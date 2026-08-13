#!/usr/bin/env python3
"""Generate zero-cost Korean lesson audio with the local macOS Yuna voice."""
import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "seven-day"
SAMPLES = {
    "sample-word": ("대학교", "word"),
    "sample-sentence": ("오늘 한국 대학교에 처음 왔어요.", "sentence"),
    "sample-sound-change": ("학생 식당 옆에 작은 도서관이 있어요.", "sound-change"),
}

def render(audio_id, text, kind):
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{audio_id}.wav"
    subprocess.run([
        "/usr/bin/say", "-v", "Yuna", "-r", "165", "-o", str(target),
        "--file-format=WAVE", "--data-format=LEI16@22050", text,
    ], check=True)
    return {"src": str(target.relative_to(ROOT)), "text": text, "kind": kind, "voice": "Yuna"}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--sample", action="store_true")
    args = parser.parse_args()
    if not args.sample:
        parser.error("Use --sample; full generation starts only after listening approval")
    manifest = {audio_id: render(audio_id, *value) for audio_id, value in SAMPLES.items()}
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
