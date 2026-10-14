#!/usr/bin/env python3
"""Build/verify m4l/tests/golden_snap.json.gz, the C++ reference output used by the Node tests.

Compiles m4l/tests/golden/gen_golden.cpp against Source/ScaleEngine.h (the real engine and
NoteTracker used by the VST3) and records:
  * snap(): every scale x snap mode x root x MIDI note
  * NoteTracker event streams for randomized note-on/off/scale-change scripts

    python3 m4l/tools/gen_golden.py            # regenerate the committed golden file
    python3 m4l/tools/gen_golden.py --check    # exit 1 if it is stale (needs a C++ compiler)
"""
import argparse
import gzip
import os
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(REPO, "m4l", "tests", "golden", "gen_golden.cpp")
OUT = os.path.join(REPO, "m4l", "tests", "golden_snap.json.gz")


def build_json():
    cxx = os.environ.get("CXX") or shutil.which("g++") or shutil.which("c++") or shutil.which("clang++")
    if not cxx:
        raise SystemExit("no C++ compiler found (set CXX)")
    with tempfile.TemporaryDirectory() as tmp:
        exe = os.path.join(tmp, "gen_golden")
        subprocess.check_call([cxx, "-std=c++17", "-O1", "-I", os.path.join(REPO, "Source"), SRC, "-o", exe])
        return subprocess.check_output([exe])


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args(argv)
    data = build_json()
    if args.check:
        if not os.path.exists(OUT) or gzip.decompress(open(OUT, "rb").read()) != data:
            print("STALE: %s. Run: python3 m4l/tools/gen_golden.py" % OUT)
            return 1
        print("golden_snap.json.gz is up to date")
        return 0
    # mtime=0 keeps the gzip bytes reproducible
    with open(OUT, "wb") as raw:
        with gzip.GzipFile(filename="", mode="wb", fileobj=raw, compresslevel=9, mtime=0) as gz:
            gz.write(data)
    print("wrote %s (%d bytes, %d uncompressed)" % (OUT, os.path.getsize(OUT), len(data)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
