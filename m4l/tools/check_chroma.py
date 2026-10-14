#!/usr/bin/env python3
"""Offline check of the audio detection parameters (needs NumPy and Node).

Synthesises a few chords / scales as audio, runs them through the same analysis the Max patch performs --
mono signal, Hann window, FFT size and hop taken from the pfft~ object in "Scale Snap Detect.maxpat",
magnitudes of the first N/2 bins (what ssd.spec.maxpat writes into the buffer~), then the chroma settings of
ScaleSnapChroma.PARAMS (60 Hz - 5 kHz, 4 harmonics, 250 Hz bass limit, memory) -- and confirms that

  1. an independent Python implementation of the chromagram gives the same vectors as the device's JavaScript, and
  2. the shared scorer (detect.js, run through Node) ranks the expected key / scale first.

    python3 m4l/tools/check_chroma.py            # prints one table per signal, exit 1 on any failure
    python3 m4l/tools/check_chroma.py -v         # also print the chroma vectors

Not covered (needs Live): that pfft~ really writes these magnitudes, its window and scaling.
"""
import argparse
import json
import math
import os
import re
import subprocess
import sys
import tempfile

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
DETECT_DIR = os.path.join(REPO, "m4l", "ScaleSnapDetect")
RUNNER = os.path.join(HERE, "chroma_runner.js")
SR = 48000
SECONDS = 12
KEEP_BINS = 2048          # spectra are cut at ~6 kHz before they are handed to Node (the analysis stops at 5 kHz)


# ---------------------------------------------------------------------------------------- parameters
def node_params():
    out = subprocess.run(["node", RUNNER, "--params"], check=True, capture_output=True, text=True).stdout
    return json.loads(out)


def patch_params():
    """FFT size / overlap / window / buffer name as the patchers actually say it."""
    dev = json.load(open(os.path.join(DETECT_DIR, "Scale Snap Detect.maxpat")))["patcher"]
    spec = json.load(open(os.path.join(DETECT_DIR, "ssd.spec.maxpat")))["patcher"]
    texts = [b["box"].get("text", "") for b in dev["boxes"]]
    m = [re.match(r"pfft~ (\S+) (\d+) (\d+)$", t) for t in texts]
    m = [x for x in m if x][0]
    stexts = [b["box"].get("text", "") for b in spec["boxes"]]
    window = [re.match(r"fftin~ 1 (\w+)$", t).group(1) for t in stexts if t.startswith("fftin~")][0]
    return {"name": m.group(1), "fftSize": int(m.group(2)), "overlap": int(m.group(3)), "window": window}


# ---------------------------------------------------------------------------------------- synthesis
def hz(midi, cents=0.0):
    return 440.0 * 2.0 ** ((midi - 69 + cents / 100.0) / 12.0)


def synth(notes, cents=0.0, harmonics=(1.0, 0.5, 0.33, 0.25)):
    n = int(SECONDS * SR)
    t = np.arange(n) / SR
    x = np.zeros(n)
    for midi, t0, dur, amp in notes:
        f = hz(midi, cents)
        s0, s1 = int(t0 * SR), min(n, int((t0 + dur) * SR))
        if s1 <= s0:
            continue
        env = np.minimum(1.0, np.arange(s1 - s0) / (0.01 * SR)) * np.minimum(1.0, (s1 - s0 - np.arange(s1 - s0)) / (0.02 * SR))
        v = np.zeros(s1 - s0)
        for h, a in enumerate(harmonics, start=1):
            if f * h < SR / 2:
                v += a * np.sin(2 * np.pi * f * h * t[s0:s1])
        x[s0:s1] += amp * env * v
    return x


def line(pitches, step, amp, t0=0.0):
    notes, i, t = [], 0, t0
    while t < SECONDS:
        notes.append((pitches[i % len(pitches)], t, step * 0.95, amp))
        i += 1
        t += step
    return notes


def held(pitches, amp):
    return [(p, 0.0, SECONDS, amp) for p in pitches]


def chord_progression(chords, bar, amp):
    """Each chord = list of MIDI notes, one chord per `bar` seconds, looped."""
    notes, i, t = [], 0, 0.0
    while t < SECONDS:
        for p in chords[i % len(chords)]:
            notes.append((p, t, bar * 0.98, amp))
        i += 1
        t += bar
    return notes


# name, notes, cents, expected top-N pitch sets (as lists of pitch classes) and how many ranks to look at
def scenarios():
    c_major = [0, 2, 4, 5, 7, 9, 11]
    a_min_pent = [9, 0, 2, 4, 7]
    return [
        ("C major scale over a C pedal", line([60, 62, 64, 65, 67, 69, 71, 72], 0.2, 0.3) + held([36], 0.3), 0, c_major, 1),
        ("C major, +30 cents", line([60, 62, 64, 65, 67, 69, 71, 72], 0.2, 0.3) + held([36], 0.3), 30, c_major, 1),
        ("F# major scale over an F# pedal", line([66, 68, 70, 71, 73, 75, 77, 78], 0.2, 0.3) + held([42], 0.3), 0,
         [6, 8, 10, 11, 1, 3, 5], 1),
        ("E Phrygian dominant over an E pedal", line([64, 65, 68, 69, 71, 72, 74, 76], 0.2, 0.3) + held([40], 0.3), 0,
         [4, 5, 8, 9, 11, 0, 2], 1),
        ("A minor pentatonic riff over an Am triad", held([57, 60, 64], 0.25) + line([69, 72, 74, 76, 79, 76, 74, 72], 0.125, 0.2), 0,
         a_min_pent, 2),
        ("same, -40 cents", held([57, 60, 64], 0.25) + line([69, 72, 74, 76, 79, 76, 74, 72], 0.125, 0.2), -40, a_min_pent, 2),
        ("Am - F - C - G (A natural minor / C major notes)",
         chord_progression([[45, 57, 60, 64], [41, 53, 57, 60], [48, 60, 64, 67], [43, 55, 59, 62]], 2.0, 0.25), 0, c_major, 2),
    ]


# ---------------------------------------------------------------------------------------- mirror of chroma.js
class Mirror:
    """Straight Python transcription of ScaleSnapChroma.chromaFromSpectrum / Accumulator."""

    def __init__(self, P, memory):
        self.P = P
        self.memory = memory
        self.h = np.zeros(12)
        self.b = np.zeros(12)
        self.tx = self.ty = 0.0
        self.voiced = 0.0

    @staticmethod
    def spread(vec, mid, w):
        fl = math.floor(mid)
        d = mid - fl
        c0 = int(fl) % 12
        c1 = (c0 + 1) % 12
        k = math.cos(math.pi * d)
        vec[c0] += w * (1 + k) * 0.5
        vec[c1] += w * (1 - k) * 0.5

    def tuning_cents(self):
        mag = math.hypot(self.tx, self.ty)
        sh = self.h.sum()
        if not mag > 0 or not sh > 0 or mag < 0.15 * sh:
            return 0.0
        cents = math.atan2(self.ty, self.tx) / (2 * math.pi) * 100
        return cents if abs(cents) > self.P["tuneThresholdCents"] else 0.0

    def frame(self, mag, sr, tuning):
        P = self.P
        bin_hz = sr / P["fftSize"]
        f_min = P["fMinHighSr"] if sr > P["highSr"] else P["fMin"]
        k_lo = max(2, math.ceil(f_min / bin_hz))
        k_hi = min(math.floor(P["fMax"] / bin_hz), len(mag) - 2)
        if not k_hi > k_lo:
            return None
        ref = 440.0 * 2 ** (tuning / 1200.0)
        seg = mag[k_lo:k_hi + 1]
        max_mag = float(seg.max())
        if not max_mag > 0:
            return None
        thr = max_mag * 10 ** (-P["rangeDb"] / 20.0)
        k = np.arange(k_lo, k_hi + 1)
        m = mag[k]
        is_peak = (m > thr) & (m > mag[k - 1]) & (m >= mag[k + 1])
        chroma, bass = np.zeros(12), np.zeros(12)
        tx = ty = 0.0
        tiny = 1e-30
        for kk in k[is_peak]:
            a, b, c = (math.log(mag[kk - 1] + tiny), math.log(mag[kk] + tiny), math.log(mag[kk + 1] + tiny))
            den = a - 2 * b + c
            p = 0.5 * (a - c) / den if den < 0 else 0.0
            p = max(-0.5, min(0.5, p))
            f = (kk + p) * bin_hz
            amp = math.log10(1 + P["compress"] * mag[kk] / max_mag)
            for i, w in enumerate(P["harmonics"]):
                self.spread(chroma, 12 * math.log2(f / (i + 1) / ref) + 69, amp * w)
            if f < P["bassMax"]:
                self.spread(bass, 12 * math.log2(f / ref) + 69, amp)
            if f <= P["tuneMax"]:
                m1 = 12 * math.log2(f / 440.0) + 69
                ang = 2 * math.pi * (m1 - math.floor(m1 + 0.5))
                tx += amp * math.cos(ang)
                ty += amp * math.sin(ang)
        total = chroma.sum()
        if not total > 0:
            return None
        return chroma / total, bass / total, tx / total, ty / total

    def add(self, fr, dt):
        if fr is None or not dt > 0:
            return
        d = math.exp(-dt / self.memory) if self.memory > 0 else 1.0
        self.h = self.h * d + fr[0] * dt
        self.b = self.b * d + fr[1] * dt
        self.tx = self.tx * d + fr[2] * dt
        self.ty = self.ty * d + fr[3] * dt
        self.voiced += dt


# ---------------------------------------------------------------------------------------- main
def spectra(x, n, hop):
    w = 0.5 - 0.5 * np.cos(2 * np.pi * np.arange(n) / n)       # Hann, periodic
    frames = [np.abs(np.fft.rfft(x[s:s + n] * w))[:n // 2] for s in range(0, len(x) - n + 1, hop)]
    return np.array(frames, dtype=np.float32)


def pitch_set(pcs):
    return sum(1 << p for p in pcs)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-v", "--verbose", action="store_true")
    args = ap.parse_args(argv)

    P = node_params()
    patch = patch_params()
    print("patch: pfft~ %s %d %d, window %s;  chroma: %d-%d Hz, bass < %d Hz, harmonics %s" % (
        patch["name"], patch["fftSize"], patch["overlap"], patch["window"], P["fMin"], P["fMax"], P["bassMax"], P["harmonics"]))
    failures = []
    if (patch["fftSize"], patch["overlap"]) != (P["fftSize"], P["overlap"]):
        failures.append("pfft~ arguments %r differ from ScaleSnapChroma.PARAMS" % patch)
    if patch["window"] != "hanning":
        failures.append("window is %s, the check assumes Hann" % patch["window"])
    n, hop = patch["fftSize"], patch["fftSize"] // patch["overlap"]
    memory = P["memorySeconds"][1]
    print("bin spacing %.2f Hz, hop %d samples = %.0f ms, memory %d s" % (SR / n, hop, 1000.0 * hop / SR, memory))

    with tempfile.TemporaryDirectory() as tmp:
        for idx, (name, notes, cents, expected, ranks) in enumerate(scenarios()):
            x = synth(notes, cents)
            sp = spectra(x, n, hop)[:, :KEEP_BINS]
            path = os.path.join(tmp, "s%d.f32" % idx)
            sp.astype("<f4").tofile(path)
            spec = {"file": path, "frames": int(sp.shape[0]), "bins": KEEP_BINS, "sr": SR, "hop": hop, "memory": memory}
            specf = os.path.join(tmp, "s%d.json" % idx)
            json.dump(spec, open(specf, "w"))
            js = json.loads(subprocess.run(["node", RUNNER, specf], check=True, capture_output=True, text=True).stdout)

            # independent Python chromagram
            mir = Mirror(P, memory)
            worst = 0.0
            for f in range(sp.shape[0]):
                fr = mir.frame(sp[f].astype(np.float64), SR, mir.tuning_cents())
                mir.add(fr, hop / SR)
                if fr is None or js["chroma"][f] is None:
                    if (fr is None) != (js["chroma"][f] is None):
                        failures.append("%s: frame %d voiced in one implementation only" % (name, f))
                    continue
                worst = max(worst, float(np.abs(fr[0] - np.array(js["chroma"][f])).max()),
                            float(np.abs(fr[1] - np.array(js["bass"][f])).max()))
            disp = mir.h / mir.h.max()
            worst_disp = float(np.abs(disp - np.array(js["display"])).max())

            want = pitch_set(expected)
            top = [g["set"] for g in js["groups"][:ranks]]
            ok_rank = want in top
            ok_mirror = worst < 1e-6 and worst_disp < 1e-6
            print("\n%s  (%+d cents)  [%s]" % (name, cents, "ok" if ok_rank and ok_mirror else "FAIL"))
            print("  expected pitch set in top %d: %s   python vs JS chroma: max diff %.1e / average %.1e;  tuning estimate %+.1f cents" % (
                ranks, "yes" if ok_rank else "NO", worst, worst_disp, js["tuning"]))
            for i, g in enumerate(js["groups"][:3]):
                print("  %d. %-26s %3d%%%s" % (i + 1, g["label"], g["pct"], "   <- expected set" if g["set"] == want else ""))
            if args.verbose:
                print("  chroma C..B:", " ".join("%.2f" % v for v in js["display"]))
            if not ok_rank:
                failures.append("%s: expected set not in the top %d" % (name, ranks))
            if not ok_mirror:
                failures.append("%s: python and JS chromagrams differ (%.2e, %.2e)" % (name, worst, worst_disp))

    print()
    if failures:
        print("FAILED:\n  " + "\n  ".join(failures))
        return 1
    print("all checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
