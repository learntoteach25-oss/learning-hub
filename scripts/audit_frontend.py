#!/usr/bin/env python3
"""Read-only checks for Learning Hub HTML and shared frontend assets."""
from __future__ import annotations
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP = {".git", "node_modules", ".next", "dist", "build"}
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.refs = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            self.ids.append(a["id"])
        if tag == "script" and a.get("src"):
            self.refs.append(a["src"])
        if tag == "link" and a.get("href") and a.get("rel") == "stylesheet":
            self.refs.append(a["href"])

def audit():
    problems = []
    pages = sorted(p for p in ROOT.rglob("*.html") if not set(p.relative_to(ROOT).parts) & SKIP)
    for page in pages:
        source = page.read_text(encoding="utf-8")
        parser = Page()
        parser.feed(source)
        duplicate_ids = [k for k,v in Counter(parser.ids).items() if v > 1]
        if duplicate_ids:
            problems.append(f"{page.relative_to(ROOT)}: duplicate IDs: {', '.join(duplicate_ids[:10])}")
        for ref in parser.refs:
            if ref.startswith(("http:", "https:", "//", "data:", "#")):
                continue
            target = (page.parent / ref.split("?",1)[0].split("#",1)[0])
            if not target.is_file():
                problems.append(f"{page.relative_to(ROOT)}: missing local asset {ref}")
        if 'src="//' in source:
            problems.append(f"{page.relative_to(ROOT)}: protocol-relative script or image URL")
    for name in ("assets/site.css", "assets/site-shell.js"):
        path = ROOT / name
        if path.exists():
            source = path.read_text(encoding="utf-8")
            print(f"{name}: {len(source):,} characters, {source.count('!important'):,} !important tokens")
    print(f"Checked {len(pages)} HTML pages")
    for issue in problems:
        print("WARNING:", issue)
    return bool(problems)

if __name__ == "__main__":
    sys.exit(1 if audit() and "--strict" in sys.argv else 0)
