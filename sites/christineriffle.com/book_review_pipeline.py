"""
Christine Book Review Pipeline
================================
Processes book cover photos in temp_book_review_images/ through 4 stages:

  extracted  -> identified  (Step 2: identify book via Claude vision, fetch clean cover)
  identified -> published   (Step 3: insert book card into index.html)
  published  -> uploaded    (Step 4: SFTP upload to Pair Networks)

Run from the site root directory:
    python book_review_pipeline.py

Requires in .env:
    ANTHROPIC_API_KEY   (for Step 2 vision identification)
    SFTP_HOST, SFTP_USER, SFTP_PASS   (for Step 4 upload)

pip install anthropic paramiko python-dotenv requests
"""

import os
import json
import base64
import re
from pathlib import Path

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
            title = line.split(":", 1)[-1].strip()
        elif "author" in low:
            author = line.split(":", 1)[-1].strip()
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

    # Insert before the closing </div> of the books row (the line right
    # after the last book card's closing </div>, followed by </div>).
    marker = "\n        </div>\n"
    idx = html.rfind(marker)
    if idx == -1:
        raise RuntimeError("Could not find books grid closing </div> in index.html")

    html = html[:idx] + card + marker + html[idx + len(marker):]
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
