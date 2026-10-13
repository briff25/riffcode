"""
Christine Book Review Pipeline
================================
Processes book cover photos in temp_book_review_images/ through 4 stages:

  (email)    -> extracted   (Step 1: `--fetch` pulls unread Gmail sent to briff25+book@gmail.com
                             from any sender: photo + star rating + optional comment)
  extracted  -> identified  (Step 2: identify book via Claude vision, fetch clean cover)
  identified -> published   (Step 3: insert book card into index.html)
  published  -> uploaded    (Step 4: SFTP upload to Pair Networks)

Run from the site root directory:
    python book_review_pipeline.py --fetch    # Step 1 only; review the sidecars afterward
    python book_review_pipeline.py            # Steps 2-4 on every non-uploaded sidecar

Requires in .env:
    ANTHROPIC_API_KEY   (for Step 2 vision identification)
    SFTP_HOST, SFTP_USER, SFTP_PASS   (for Step 4 upload)
    GMAIL_APP_PASSWORD   (for Step 1; GMAIL_USER optional, defaults to briff25@gmail.com)

pip install anthropic paramiko python-dotenv requests truststore
"""

import os
import json
import base64
import re
import sys
import email
import imaplib
from datetime import datetime
from email import policy
from email.utils import parsedate_to_datetime
from html import unescape
from pathlib import Path

# Use the OS certificate store so HTTPS works behind antivirus/proxy
# interception (Python's bundled certifi doesn't trust those roots).
try:
    import truststore
    truststore.inject_into_ssl()
except ImportError:
    pass

import requests
import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent
load_dotenv(dotenv_path=ROOT / ".env")

TEMP_DIR = ROOT / "temp_book_review_images"
IMAGES_DIR = ROOT / "Images"
INDEX_HTML = ROOT / "index.html"

VISION_PROMPT = (
    "This is a photo of a book cover. Please identify: the exact book title, "
    "the author's full name, and the ISBN if visible anywhere on the cover. "
    "Return only these three values, nothing else."
)

CARD_TEMPLATE = """
            <!-- Book Card {n} -->
            <div class="col-lg-4 col-md-6 mb-4">
                    <div class="card book-card h-100">
                        <img src="./Images/{cover}" class="card-img-top book-cover" alt="{title}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="book-title">{title}</h5>
                            <p class="book-author">by {author}</p>
                            <div class="rating mb-3">
                                {stars}
                                <span class="ms-2 text-muted">({rating}/5)</span>
                            </div>
                            <div class="genre-tags">
                                {genre_tags}
                            </div>
                            <p class="review-text flex-grow-1">
                                {review}
                            </p>

                        </div>
                    </div>
                </div>
"""


# ---------------------------------------------------------------------------
# Step 1: Fetch update emails from Gmail (IMAP) -> extracted sidecar + photo
# ---------------------------------------------------------------------------

BOOK_ADDRESS = "briff25+book@gmail.com"
IMAP_HOST = "imap.gmail.com"
STAR_RE = re.compile(r"(?<![\d.])([0-5](?:\.\d+)?)\s*(?:/\s*5\b|stars?\b)", re.I)
LEAD_NUM_RE = re.compile(r"^\s*([0-5](?:\.\d+)?)\b")


def parse_rating_and_review(text, sender=""):
    """Pull (rating, review) out of a plain-text email body.

    The rating is read from the first non-empty line ("5 stars", "4.5/5",
    "Loved it, 5 stars", or a leading number). Anything else in the body
    becomes the review, minus attachment placeholders like [IMG_0007.jpg],
    quoted replies, "Sent from..." footers, and a trailing sign-off that
    is just the sender's name. Returns (None, text) if no rating is found.
    """
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith(">") or re.match(r"on .+ wrote:$", line, re.I):
            break
        if not line or re.fullmatch(r"\[.*\]", line) or line.lower().startswith("sent from"):
            continue
        lines.append(line)
    if not lines:
        return None, ""

    first = lines[0]
    m = STAR_RE.search(first) or LEAD_NUM_RE.match(first)
    if not m:
        return None, " ".join(lines)

    rating = float(m.group(1))
    rest = (first[:m.start()] + " " + first[m.end():]).strip(" -:,.")
    words = " ".join(p for p in [rest] + lines[1:] if p).split()

    name_words = {w.lower() for w in re.split(r"[^A-Za-z]+", sender) if len(w) > 1}
    if words and words[-1].strip(".,!-").lower() in name_words:
        words = words[:-1]
    return rating, " ".join(words)


def _body_text(msg):
    part = msg.get_body(preferencelist=("plain", "html"))
    if part is None:
        return ""
    text = part.get_content()
    if part.get_content_type() == "text/html":
        text = re.sub(r"<(br|/p|/div)[^>]*>", "\n", text, flags=re.I)
        text = unescape(re.sub(r"<[^>]+>", "", text))
    return text


def _first_jpeg(msg):
    for part in msg.walk():
        fname = (part.get_filename() or "").lower()
        if part.get_content_type() == "image/jpeg" or fname.endswith((".jpg", ".jpeg")):
            return part
    return None


def step1_fetch():
    """Save each unread email sent to BOOK_ADDRESS (from any sender) as a photo
    plus a JSON sidecar with status 'extracted'. Stops there so you can review
    the sidecars before running Steps 2-4."""
    user = os.getenv("GMAIL_USER", "briff25@gmail.com")
    pw = "".join((os.getenv("GMAIL_APP_PASSWORD") or "").split())  # Google shows it with spaces
    if not pw:
        raise RuntimeError("Missing GMAIL_APP_PASSWORD in .env")

    TEMP_DIR.mkdir(exist_ok=True)
    known_ids = set()
    for p in TEMP_DIR.glob("*.json"):
        try:
            known_ids.add(json.loads(p.read_text(encoding="utf-8")).get("source_message_id"))
        except ValueError:
            pass
    known_ids.discard(None)

    imap = imaplib.IMAP4_SSL(IMAP_HOST)
    saved = 0
    try:
        imap.login(user, pw)
        imap.select("INBOX")
        query = f'"(to:{BOOK_ADDRESS} OR deliveredto:{BOOK_ADDRESS}) is:unread has:attachment"'
        status, data = imap.search(None, "X-GM-RAW", query)
        if status != "OK":
            raise RuntimeError(f"IMAP search failed: {status} {data}")
        nums = data[0].split()
        print(f"Found {len(nums)} unread email(s) to {BOOK_ADDRESS}")

        for num in nums:
            status, msg_data = imap.fetch(num, "(BODY.PEEK[])")
            msg = email.message_from_bytes(msg_data[0][1], policy=policy.default)
            subject = str(msg["Subject"] or "")
            sender = str(msg["From"] or "")
            msg_id = str(msg["Message-ID"] or "").strip()
            print(f"\n--- {subject!r} from {sender}")

            if msg_id and msg_id in known_ids:
                print("  Already processed (Message-ID match); marking read")
                imap.store(num, "+FLAGS", "\\Seen")
                continue

            photo = _first_jpeg(msg)
            if photo is None:
                print("  SKIPPED: no JPEG attachment found (left unread)")
                continue

            rating, review = parse_rating_and_review(_body_text(msg), sender)
            if rating is None:
                print("  SKIPPED: no star rating found in the first line (left unread)")
                continue

            try:
                when = parsedate_to_datetime(str(msg["Date"])).astimezone()
            except (TypeError, ValueError):
                when = datetime.now()
            orig = re.sub(r"[^\w.\-]", "_", photo.get_filename() or "photo.jpg")
            image_file = f"{when:%Y%m%d_%H%M%S}_{orig}"

            (TEMP_DIR / image_file).write_bytes(photo.get_payload(decode=True))
            sidecar = {
                "image_file": image_file,
                "rating": str(rating),
                "genres": [],
                "review": review,
                "status": "extracted",
                "source_message_id": msg_id,
                "source_sender": sender,
            }
            (TEMP_DIR / (Path(image_file).stem + ".json")).write_text(
                json.dumps(sidecar, indent=2), encoding="utf-8"
            )
            imap.store(num, "+FLAGS", "\\Seen")
            saved += 1
            print(f"  Saved {image_file}: {rating} stars, review: {review or '(none)'}")
    finally:
        try:
            imap.logout()
        except Exception:
            pass

    print(f"\n{saved} new update(s) saved to {TEMP_DIR.name}/ with status 'extracted'.")
    print("Review the .json sidecars (add genres / edit the review if wanted), then run "
          "`python book_review_pipeline.py` to identify, publish, and upload.")


# ---------------------------------------------------------------------------
# Step 2: Identify book + fetch clean cover
# ---------------------------------------------------------------------------

def round_rating(value):
    return round(float(value) * 2) / 2


def identify_book(image_path):
    """Send the cover photo to Claude vision and parse title/author/isbn."""
    import anthropic

    client = anthropic.Anthropic()
    media_type = "image/jpeg"
    image_data = base64.standard_b64encode(image_path.read_bytes()).decode("utf-8")

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=300,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": image_data}},
                {"type": "text", "text": VISION_PROMPT},
            ],
        }],
    )
    text = response.content[0].text

    title = author = isbn = ""
    for line in text.splitlines():
        low = line.lower()
        if "title" in low:
            title = line.split(":", 1)[-1].strip(" *_")
        elif "author" in low:
            author = line.split(":", 1)[-1].strip(" *_")
        elif "isbn" in low:
            val = line.split(":", 1)[-1].strip()
            isbn = re.sub(r"[^0-9X]", "", val)

    return title, author, isbn


def fetch_cover(title, author, isbn, fallback_image, dest_path):
    """Try Open Library (ISBN, then title/author search), then Google Books,
    then fall back to the original photo. Returns the source label used."""

    def save(url):
        r = requests.get(url, timeout=15)
        if r.ok and r.headers.get("Content-Type", "").startswith("image") and len(r.content) > 1000:
            dest_path.write_bytes(r.content)
            return True
        return False

    if isbn:
        if save(f"https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg"):
            return "Open Library ISBN"

    if title and author:
        r = requests.get(
            "https://openlibrary.org/search.json",
            params={"title": title, "author": author},
            timeout=15,
        )
        if r.ok:
            docs = r.json().get("docs", [])
            for doc in docs:
                cover_i = doc.get("cover_i")
                if cover_i and save(f"https://covers.openlibrary.org/b/id/{cover_i}-L.jpg"):
                    return "Open Library search"

    if title and author:
        r = requests.get(
            "https://www.googleapis.com/books/v1/volumes",
            params={"q": f"intitle:{title}+inauthor:{author}"},
            timeout=15,
        )
        if r.ok:
            for item in r.json().get("items", []):
                thumb = item.get("volumeInfo", {}).get("imageLinks", {}).get("thumbnail")
                if thumb and save(thumb):
                    return "Google Books"

    dest_path.write_bytes(fallback_image.read_bytes())
    return "Original photo"


def step2_identify(data, image_path):
    title, author, isbn = identify_book(image_path)
    data["title"] = title
    data["author"] = author
    data["isbn"] = isbn
    data["rating"] = str(round_rating(data["rating"]))

    safe_title = title.replace(":", "").replace("/", "-")
    cover_filename = f"{safe_title}.jpg"
    cover_path = IMAGES_DIR / cover_filename

    source = fetch_cover(title, author, isbn, image_path, cover_path)
    data["clean_cover_file"] = cover_filename
    data["status"] = "identified"

    print(f"  Identified: {title} by {author} (ISBN: {isbn or 'none'})")
    print(f"  Cover source: {source} -> {cover_filename}")
    return data


# ---------------------------------------------------------------------------
# Step 3: Build card and insert into index.html
# ---------------------------------------------------------------------------

def stars_html(rating):
    rating = float(rating)
    full = int(rating)
    half = rating - full >= 0.5
    icons = ['<i class="fas fa-star"></i>'] * full
    if half:
        icons.append('<i class="fa-solid fa-star-half"></i>')
    return "\n                                ".join(icons)


def step3_publish(data):
    html = INDEX_HTML.read_text(encoding="utf-8")

    card_numbers = [int(m) for m in re.findall(r"<!-- Book Card (\d+) -->", html)]
    next_n = max(card_numbers) + 1 if card_numbers else 1

    genre_tags = "\n                                ".join(
        f'<span class="genre-tag">{g}</span>' for g in data.get("genres", [])
    )

    card = CARD_TEMPLATE.format(
        n=next_n,
        cover=data["clean_cover_file"],
        title=data["title"],
        author=data["author"],
        stars=stars_html(data["rating"]),
        rating=data["rating"],
        genre_tags=genre_tags,
        review=data.get("review", ""),
    )

    # Insert at the top of the books grid: right after the opening
    # <div class="row"> inside <section id="books">, so newest books come first.
    sec = html.find('<section id="books"')
    row_tag = '<div class="row">'
    row = html.find(row_tag, sec) if sec != -1 else -1
    if row == -1:
        raise RuntimeError('Could not find the books grid (<section id="books"> > <div class="row">) in index.html')
    idx = row + len(row_tag)

    html = html[:idx] + card.rstrip("\n") + "\n" + html[idx:]
    INDEX_HTML.write_text(html, encoding="utf-8")

    data["status"] = "published"
    print(f"  Inserted Book Card {next_n} into index.html")
    return data


# ---------------------------------------------------------------------------
# Step 4: SFTP upload
# ---------------------------------------------------------------------------

def step4_upload(data):
    host = os.getenv("SFTP_HOST")
    user = os.getenv("SFTP_USER")
    pw = os.getenv("SFTP_PASS")
    if not all([host, user, pw]):
        raise RuntimeError("Missing SFTP_HOST / SFTP_USER / SFTP_PASS in .env")

    remote_root = f"/usr/home/{user}/public_html/christineriffle.com/"

    transport = paramiko.Transport((host, 22))
    try:
        transport.connect(username=user, password=pw)
        sftp = paramiko.SFTPClient.from_transport(transport)

        if "index.html" not in sftp.listdir(remote_root):
            raise RuntimeError(f"index.html not found in {remote_root}")

        uploads = [
            (IMAGES_DIR / data["clean_cover_file"], remote_root + "Images/" + data["clean_cover_file"]),
            (INDEX_HTML, remote_root + "index.html"),
        ]
        for local, remote in uploads:
            sftp.put(str(local), remote)
            rsize = sftp.stat(remote).st_size
            lsize = local.stat().st_size
            status = "MATCH" if rsize == lsize else "MISMATCH"
            print(f"  Uploaded {local.name}: remote {rsize}, local {lsize} ({status})")
            if rsize != lsize:
                raise RuntimeError(f"Size mismatch after upload: {local.name}")

        sftp.close()
    finally:
        transport.close()

    data["status"] = "uploaded"
    return data


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------

def process_json(json_path):
    data = json.loads(json_path.read_text(encoding="utf-8"))
    image_path = TEMP_DIR / data["image_file"]

    print(f"\n=== {json_path.name} (status: {data['status']}) ===")

    if data["status"] == "extracted":
        data = step2_identify(data, image_path)
        json_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    if data["status"] == "identified":
        data = step3_publish(data)
        json_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    if data["status"] == "published":
        data = step4_upload(data)
        json_path.write_text(json.dumps(data, indent=2), encoding="utf-8")

    print(f"  Final status: {data['status']}")


def main():
    if "--fetch" in sys.argv[1:]:
        step1_fetch()
        return

    json_files = sorted(TEMP_DIR.glob("*.json"))
    if not json_files:
        print("No JSON files found in temp_book_review_images/")
        return

    for json_path in json_files:
        data = json.loads(json_path.read_text(encoding="utf-8"))
        if data["status"] == "uploaded":
            continue
        process_json(json_path)


if __name__ == "__main__":
    main()
