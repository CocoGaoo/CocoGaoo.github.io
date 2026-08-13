#!/usr/bin/env python3
"""Generate static Korean lesson audio with Microsoft SunHi Neural via edge-tts."""
import argparse
import json
import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "seven-day"
VOICE = "ko-KR-SunHiNeural"

def course_items():
    node = os.environ.get("NODE", "node")
    raw = subprocess.check_output([node, str(ROOT / "scripts" / "extract-audio-map.mjs")], text=True)
    return json.loads(raw)

def render(edge_tts, audio_id, text):
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / f"{audio_id}.mp3"
    if not target.exists() or target.stat().st_size < 1000:
        for attempt in range(3):
            target.unlink(missing_ok=True)
            try:
                subprocess.run([
                    edge_tts, "--voice", VOICE, "--rate=-8%", "--text", text,
                    "--write-media", str(target),
                ], check=True)
                break
            except subprocess.CalledProcessError:
                if attempt == 2:
                    raise
                time.sleep(2**attempt)
    return {"src": str(target.relative_to(ROOT)), "text": text, "kind": "course", "voice": VOICE}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--edge-tts", default=os.environ.get("EDGE_TTS", "edge-tts"))
    args = parser.parse_args()
    if not args.all:
        parser.error("Use --all after the selected voice has been approved")
    items = course_items()
    manifest = {}
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures={pool.submit(render,args.edge_tts,audio_id,text):(audio_id,text) for audio_id,text in items.items()}
        for index,future in enumerate(as_completed(futures),1):
            audio_id,_=futures[future]
            manifest[audio_id]=future.result()
            print(f"[{index}/{len(items)}] {audio_id}",flush=True)
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

if __name__ == "__main__":
    main()
