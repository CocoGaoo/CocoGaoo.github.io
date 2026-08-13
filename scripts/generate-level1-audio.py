#!/usr/bin/env python3
"""Generate static Level 1 Korean and English lesson audio via edge-tts."""
import argparse
import json
import os
import subprocess
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "level1"


def course_items(days):
    command = [os.environ.get("NODE", "node"), str(ROOT / "scripts" / "extract-level1-audio.mjs")]
    if days:
        command.extend(["--days", str(days)])
    raw = subprocess.check_output(command, text=True)
    return json.loads(raw)


def render(edge_tts, audio_id, item):
    target = OUT / f"{audio_id}.mp3"
    if target.exists() and target.stat().st_size > 1000:
        return audio_id, {"src": str(target.relative_to(ROOT)), **item}
    for attempt in range(3):
        temp = target.with_suffix(".tmp.mp3")
        temp.unlink(missing_ok=True)
        try:
            subprocess.run([edge_tts, "--voice", item["voice"], "--text", item["text"], "--write-media", str(temp)], check=True)
            if temp.stat().st_size > 1000:
                os.replace(temp, target)
                return audio_id, {"src": str(target.relative_to(ROOT)), **item}
            raise RuntimeError(f"{audio_id}: generated audio is too small")
        except (subprocess.CalledProcessError, FileNotFoundError, RuntimeError):
            temp.unlink(missing_ok=True)
            if attempt == 2:
                raise
            time.sleep(2 ** attempt)


def write_manifest(manifest):
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=OUT, delete=False) as handle:
        json.dump(manifest, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temp_path = Path(handle.name)
    os.replace(temp_path, OUT / "manifest.json")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--days", type=int)
    parser.add_argument("--edge-tts", default=os.environ.get("EDGE_TTS", "edge-tts"))
    args = parser.parse_args()
    if args.all == (args.days is not None) or args.days is not None and not 1 <= args.days <= 45:
        parser.error("Use exactly one of --all or --days 1..45")
    OUT.mkdir(parents=True, exist_ok=True)
    items = course_items(args.days)
    manifest = {}
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(render, args.edge_tts, audio_id, item): audio_id for audio_id, item in items.items()}
        for index, future in enumerate(as_completed(futures), 1):
            audio_id, entry = future.result()
            manifest[audio_id] = entry
            print(f"[{index}/{len(items)}] {audio_id}", flush=True)
    write_manifest({audio_id: manifest[audio_id] for audio_id in items})


if __name__ == "__main__":
    main()
