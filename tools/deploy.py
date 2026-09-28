#!/usr/bin/env python3
"""
Deploy one of the sites over SFTP.

    python tools/deploy.py riffcode            # upload new/changed files
    python tools/deploy.py riffcode --dry-run  # show what would go up, touch nothing
    python tools/deploy.py brianriffle --all    # re-upload everything, changed or not

Sites: see SITES below. Credentials come from the root .env
(SFTP_HOST / SFTP_USER / SFTP_PASS).

Every file under the site folder uploads except what matches EXCLUDE, so a new
project in riffcode/apps/ needs no edits here. Before overwriting the live
index.html it downloads the current one into backups/<site>/, and every upload
is size-verified.
"""

import fnmatch
import os
import stat
import sys
from datetime import datetime
from pathlib import Path

import paramiko
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

# name -> (local folder, remote folder under /usr/home/<user>/)
SITES = {
    # Next.js static export: run `npm run build` in sites/brianriffle.com first.
    # The old Bootstrap site is in sites/_archive/ and is never deployed.
    "brianriffle": ("sites/brianriffle.com/out", "public_html/brianriffle.com/"),
    "christine":   ("sites/christineriffle.com", "public_html/christineriffle.com/"),
    "kate":        ("sites/kateriffle.com",      "public_html/kateriffle.com/"),
    "riffcode":   ("riffcode",                 "public_html/riffcode.brianriffle.com/"),
}

# Never uploaded. Matched against each path segment and the full relative path.
EXCLUDE = [
    ".env*", ".git*", ".claude", ".DS_Store", "Thumbs.db", "desktop.ini", "*.icloud",
    "*.md", "*.py", "__pycache__",
    "backups", "_archive", "temp_*", "apps-script",
    "contact-config*.php",   # lives on the server only; upload by hand if it changes
]


def excluded(rel):
    parts = rel.split("/")
    return any(fnmatch.fnmatch(p, pat) for p in parts for pat in EXCLUDE)


def local_files(base):
    for path in sorted(base.rglob("*")):
        if path.is_file():
            rel = path.relative_to(base).as_posix()
            if not excluded(rel):
                yield rel, path


def ensure_remote_dir(sftp, path):
    """mkdir -p, one segment at a time."""
    parts = [p for p in path.strip("/").split("/") if p]
    cur = ""
    for part in parts:
        cur = cur + "/" + part
        try:
            sftp.stat(cur)
        except IOError:
            sftp.mkdir(cur)
            print("  created " + cur + "/")


def needs_upload(sftp, rpath, lpath):
    try:
        r = sftp.stat(rpath)
    except IOError:
        return True
    l = lpath.stat()
    return r.st_size != l.st_size or int(r.st_mtime) < int(l.st_mtime)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    dry_run = "--dry-run" in sys.argv
    force_all = "--all" in sys.argv
    if len(args) != 1 or args[0] not in SITES:
        raise SystemExit("usage: python tools/deploy.py {" + ",".join(SITES) + "} [--dry-run] [--all]")
    site = args[0]
    local_dir, remote_dir = SITES[site]
    base = ROOT / local_dir

    host = os.getenv("SFTP_HOST")
    user = os.getenv("SFTP_USER")
    pw = os.getenv("SFTP_PASS")
    if not all([host, user, pw]):
        raise SystemExit("Missing SFTP_HOST / SFTP_USER / SFTP_PASS in " + str(ROOT / ".env"))

    remote_root = "/usr/home/{}/{}".format(user, remote_dir)
    files = list(local_files(base))

    if dry_run:
        print("DRY RUN - {} files from {}/ would be checked against {}".format(len(files), local_dir, remote_root))
        for rel, path in files:
            print("  {:<55} {:>9} bytes".format(rel, path.stat().st_size))
        return

    print("Connecting to {} as {}...".format(host, user))
    transport = paramiko.Transport((host, 22))
    try:
        transport.connect(username=user, password=pw)
        sftp = paramiko.SFTPClient.from_transport(transport)

        try:
            if not stat.S_ISDIR(sftp.stat(remote_root).st_mode):
                raise IOError
        except IOError:
            raise SystemExit(remote_root + " does not exist on the server. Create the domain/subdomain "
                             "in the Pair control panel first, or fix the path in SITES.")

        # Keep a copy of whatever homepage is live right now.
        if "index.html" in sftp.listdir(remote_root):
            backups = ROOT / "backups" / site
            backups.mkdir(parents=True, exist_ok=True)
            backup = backups / ("index.live-" + datetime.now().strftime("%Y%m%d-%H%M%S") + ".html")
            sftp.get(remote_root + "index.html", str(backup))
            print("Backed up live index.html -> " + backup.relative_to(ROOT).as_posix())

        for d in sorted({rel.rpartition("/")[0] for rel, _ in files if "/" in rel}):
            ensure_remote_dir(sftp, remote_root.rstrip("/") + "/" + d)

        sent = 0
        for rel, lpath in files:
            rpath = remote_root + rel
            if not force_all and not needs_upload(sftp, rpath, lpath):
                continue
            sftp.put(str(lpath), rpath)
            lstat = lpath.stat()
            sftp.utime(rpath, (lstat.st_atime, lstat.st_mtime))
            rsize = sftp.stat(rpath).st_size
            if rsize != lstat.st_size:
                raise SystemExit("Size mismatch for {}: local {}, remote {}".format(rel, lstat.st_size, rsize))
            print("  {:<55} {:>9} bytes  OK".format(rel, lstat.st_size))
            sent += 1

        print("\n{} of {} files uploaded ({} unchanged).".format(sent, len(files), len(files) - sent))
        sftp.close()
    finally:
        transport.close()


if __name__ == "__main__":
    main()
