"""
Move long-form guide sections (by section id) to just before </main>.
Run from repo root: python tools/move_longform_bottom.py
"""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parent.parent

MOVES = [
    ("index.html", "888bet-guide"),
    ("slots.html", "888bet-slots-guide"),
    ("live-casino.html", "888bet-live-guide"),
    ("table-games.html", "888bet-tables-guide"),
    ("promotions.html", "888bet-promos-guide"),
    ("about-us.html", "about-888bet-live"),
    ("help-center.html", "888bet-help-guide"),
]


def move_section(path: Path, section_id: str) -> bool:
    text = path.read_text(encoding="utf-8")
    pattern = (
        r'(\s*<section\b[^>]*\bid="' + re.escape(section_id) + r'"[^>]*>.*?</section>\s*)'
    )
    m = re.search(pattern, text, flags=re.DOTALL | re.IGNORECASE)
    if not m:
        print(f"NOT FOUND id={section_id!r} in {path.name}")
        return False
    block = m.group(1)
    text = text[: m.start()] + text[m.end() :]
    idx = text.rfind("</main>")
    if idx == -1:
        print(f"No </main> in {path.name}")
        return False
    text = text[:idx] + block + "\n" + text[idx:]
    path.write_text(text, encoding="utf-8")
    print(f"OK {path.name} -> {section_id}")
    return True


def main():
    for filename, sid in MOVES:
        move_section(ROOT / filename, sid)


if __name__ == "__main__":
    main()
