#!/usr/bin/env python3
"""Generate the patchers of the Max for Live AUDIO effect "Scale Snap Detect":

    m4l/ScaleSnapDetect/Scale Snap Detect.maxpat   the device
    m4l/ScaleSnapDetect/ssd.spec.maxpat            the pfft~ sub-patcher (loaded by name from the device's folder)

    python3 m4l/tools/gen_patcher_detect.py            # (re)write both files
    python3 m4l/tools/gen_patcher_detect.py --check    # exit 1 if a committed file is stale

Signal flow (all native MSP, audio itself is never touched):

    plugin~ ----------------------------------------------> plugout~          (stereo pass-through)
       |  L+R
       +-> [+~] -> [*~ 0.5] -+-> [pfft~ ssd.spec 16384 4]     fftin~ (Hann) -> cartopol~ -> poke~ ---spec
                             |                                 (magnitudes of 8192 bins in [buffer~ ---spec])
                             +-> [*~] -> [average~ 16384] -> [snapshot~ 250] -> "level <mean square>" -> [js]
    [sig~ 1000] -> [mstosamps~] -> [snapshot~ 250] -> "sr <Hz>" -> [js]       (sample rate, also from [dspstate~])
    [qmetro 250] (started/stopped by the script) -> "tick" -> [js scalesnap_detect.js ---spec]
    [js] outlet 0 -> [s scalesnap.detect]        (only while "Send to Scale Snap" is on)

The script peeks the magnitude buffer from the low-priority thread on every tick, so there is no per-sample
JavaScript. FFT size / overlap here must equal ScaleSnapChroma.PARAMS (tests/detectdevice.test.js checks).
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_patcher  # noqa: E402
from maxpat import Patcher, dumps  # noqa: E402

REPO = gen_patcher.REPO
OUT_DIR = os.path.join(REPO, "m4l", "ScaleSnapDetect")
OUTPUT = os.path.join(OUT_DIR, "Scale Snap Detect.maxpat")
OUTPUT_SPEC = os.path.join(OUT_DIR, "ssd.spec.maxpat")

DEVICE_WIDTH = 440
DEVICE_HEIGHT = gen_patcher.DEVICE_HEIGHT       # 169
JS_NAME = "scalesnap_detect.js"                  # the bundle build_amxd.py writes next to the .amxd
SPEC_NAME = "ssd.spec"                            # pfft~ sub-patcher file name (without .maxpat)
BUFFER_NAME = "---spec"                           # device-local in Live (three dashes)
FFT_SIZE = 16384
OVERLAP = 4
BINS = FFT_SIZE // 2
AMXD_TYPE_AUDIO_EFFECT = 1633771873              # 'aaaa'

MEMORY_ENUM = ["Short (8 s)", "Medium (20 s)", "Long (60 s)", "Hold"]
NOTE_NAMES = gen_patcher.NOTE_NAMES

# script outlets (keep in step with OUT in scalesnap_detect.js; tests check it)
JS_OUTLETS = 10
OUT_SEND, OUT_CHROMA, OUT_ROW1, OUT_SAME, OUT_STATUS, OUT_TICK = 0, 1, 2, 7, 8, 9


class DetectUI(gen_patcher.UI):
    """gen_patcher.UI with a tidier patching-view grid and a float parameter."""

    def _patch_rect(self, w, h):
        self.row += 1
        col, row = divmod(self.row - 1, 22)
        return [560.0 + col * 230.0, 20.0 + 24.0 * row, float(w), float(h)]

    def float_param(self, name, longname, shortname, lo, hi, initial, unitstyle, pres, extra=None):
        v = {"parameter_longname": longname, "parameter_shortname": shortname, "parameter_modmode": 0,
             "parameter_type": 0, "parameter_mmin": float(lo), "parameter_mmax": float(hi),
             "parameter_initial": [float(initial)], "parameter_initial_enable": 1,
             "parameter_unitstyle": unitstyle}
        box = {"maxclass": "live.numbox", "numinlets": 1, "numoutlets": 2, "outlettype": ["", "float"],
               "patching_rect": self._patch_rect(pres[2], pres[3]),
               "presentation": 1, "presentation_rect": [float(x) for x in pres],
               "parameter_enable": 1, "varname": longname, "saved_attribute_attributes": {"valueof": v}}
        box.update(extra or {})
        b = self.p.raw(name, box)
        self.params.append((b["id"], longname, shortname))
        return b


# ---------------------------------------------------------------------------------------------
# ssd.spec.maxpat : the pfft~ sub-patcher
# ---------------------------------------------------------------------------------------------
def build_spec():
    p = Patcher(SPEC_NAME)
    p.obj("FFTIN", "fftin~ 1 hanning", (30, 30), w=110)       # outlets: real, imaginary, bin index
    p.obj("CART", "cartopol~", (30, 90), w=70)                 # -> amplitude, phase
    p.obj("POKE", "poke~ " + BUFFER_NAME, (30, 150), w=100)    # buffer[bin] = amplitude
    p.comment("NOTE", "pfft~ frame -> magnitude of every bin into the device-local buffer~ ---spec. "
              "Read by scalesnap_detect.js (low priority).", (170, 30), w=360)
    p.wire("FFTIN", 0, "CART", 0)
    p.wire("FFTIN", 1, "CART", 1)
    p.wire("CART", 0, "POKE", 0)
    p.wire("FFTIN", 2, "POKE", 1)
    d = p.to_dict(rect=(60.0, 90.0, 560.0, 260.0))
    d["openinpresentation"] = 0
    return d


# ---------------------------------------------------------------------------------------------
# the device
# ---------------------------------------------------------------------------------------------
def build_main():
    p = Patcher("Scale Snap Detect")
    ui = DetectUI(p)

    # ---- device face (presentation), 440 x 169 -------------------------------------------------
    ui.enum_param("live.text", "LISTEN", "Listen", "Listen", ["Off", "On"], 1, (6, 6, 52, 18),
                  {"mode": 1, "text": "Listen", "texton": "Listen"})
    ui.free("live.text", "RESET", (62, 6, 44, 18), 2, ["", ""], {"mode": 0, "text": "Reset"})
    ui.enum_param("live.text", "SEND", "Send to Scale Snap", "Send", ["Off", "On"], 0, (110, 6, 106, 18),
                  {"mode": 1, "text": "Send to Scale Snap", "texton": "Send to Scale Snap"})

    ui.free("multislider", "CHROMA", (6, 28, 210, 72), 2, ["", ""],
            {"size": 12, "setminmax": [0.0, 1.0], "setstyle": 1, "contdata": 1, "ignoreclick": 1,
             "bgcolor": [0.16, 0.16, 0.16, 1.0], "slidercolor": [1.0, 0.6, 0.0, 1.0]})
    for i, n in enumerate(NOTE_NAMES):
        ui.free("live.comment", "NOTE_" + str(i), (6 + 17.5 * i, 102, 17.5, 12), 0, [],
                {"text": n, "fontsize": 8.0, "textjustification": 1})
    ui.free("live.comment", "STATUS", (6, 116, 210, 14), 0, [], {"text": "Listening...", "fontsize": 9.0})

    ui.enum_param("live.menu", "MEMORY", "Memory", "Memory", MEMORY_ENUM, 1, (6, 140, 100, 18))
    ui.free("live.comment", "GATE_LABEL", (110, 142, 34, 14), 0, [], {"text": "Gate", "fontsize": 9.0})
    ui.float_param("GATE", "Gate Threshold", "Gate", -80.0, -20.0, -50.0, 4, (146, 140, 70, 18),
                   {"fontsize": 9.0})

    ui.free("live.comment", "ROW1", (224, 6, 210, 18), 0, [], {"text": "", "fontsize": 11.0})
    for i in range(2, 6):
        ui.free("live.comment", "ROW%d" % i, (224, 28 + 16 * (i - 2), 210, 14), 0, [], {"text": "", "fontsize": 9.0})
    ui.free("live.comment", "SAME", (224, 94, 210, 30), 0, [], {"text": "", "fontsize": 9.0})
    ui.free("live.comment", "INFO", (224, 128, 210, 34), 0, [],
            {"text": "Audio passes through unchanged. Turn on Send to Scale Snap, then press Apply in the "
                     "Scale Snap device.", "fontsize": 9.0})

    # ---- audio ------------------------------------------------------------------------------------
    p.obj("PLUGIN", "plugin~", (20, 20))
    p.obj("PLUGOUT", "plugout~", (20, 300))
    p.wire("PLUGIN", 0, "PLUGOUT", 0)       # untouched pass-through, both channels
    p.wire("PLUGIN", 1, "PLUGOUT", 1)

    p.obj("SUM", "+~", (140, 80))
    p.obj("HALF", "*~ 0.5", (140, 120))
    p.raw("PFFT", {"maxclass": "newobj", "numinlets": 1, "numoutlets": 0, "outlettype": [],
                   "patching_rect": [140.0, 170.0, 190.0, 22.0],
                   "text": "pfft~ %s %d %d" % (SPEC_NAME, FFT_SIZE, OVERLAP)})
    p.wire("PLUGIN", 0, "SUM", 0)
    p.wire("PLUGIN", 1, "SUM", 1)
    p.wire("SUM", 0, "HALF", 0)
    p.wire("HALF", 0, "PFFT", 0)

    p.obj("SQ", "*~", (360, 120))             # x * x
    p.obj("AVG", "average~ 16384", (360, 160), w=100)   # mean square over ~340 ms (spans the 250 ms interval)
    p.obj("SNAP", "snapshot~ 250", (360, 200), w=100)  # one value every 250 ms
    p.obj("PP_level", "prepend level", (360, 240), w=100)
    p.wire("HALF", 0, "SQ", 0)
    p.wire("HALF", 0, "SQ", 1)
    p.wire("SQ", 0, "AVG", 0)
    p.wire("AVG", 0, "SNAP", 0)
    p.wire("SNAP", 0, "PP_level", 0)

    # sample rate for the bin -> frequency mapping: 1000 ms expressed in samples (follows the audio engine)
    p.obj("SIG1000", "sig~ 1000", (520, 120), w=80)
    p.obj("MSTOS", "mstosamps~", (520, 160), w=90)
    p.obj("SNAP_SR", "snapshot~ 250", (520, 200), w=100)
    p.wire("SIG1000", 0, "MSTOS", 0)
    p.wire("MSTOS", 0, "SNAP_SR", 0)

    p.obj("BUF", "buffer~ " + BUFFER_NAME, (140, 220), w=110)
    p.message("MSG_size", "sizeinsamps %d" % BINS, (140, 260), w=100)
    p.wire("MSG_size", 0, "BUF", 0)

    # ---- glue script ------------------------------------------------------------------------------
    p.raw("JS", {"maxclass": "newobj", "numinlets": 1, "numoutlets": JS_OUTLETS, "outlettype": [""] * JS_OUTLETS,
                 "patching_rect": [20.0, 400.0, 260.0, 22.0], "text": "js %s %s" % (JS_NAME, BUFFER_NAME),
                 "saved_object_attributes": {"filename": JS_NAME, "parameter_enable": 0}})
    p.wire("PP_level", 0, "JS", 0)

    def to_js(src, outlet, msg):
        name = "PP_" + msg
        p.obj(name, "prepend " + msg, (300, 300 + 26 * len(p.by_name)))
        p.wire(src, outlet, name, 0)
        p.wire(name, 0, "JS", 0)

    to_js("LISTEN", 0, "listen")
    to_js("SEND", 0, "send")
    to_js("MEMORY", 0, "memory")
    to_js("GATE", 0, "gate")
    p.obj("SEL_reset", "sel 1", (460, 300))            # momentary button: only the press (1) triggers
    p.message("MSG_reset", "reset", (520, 300))
    p.wire("RESET", 0, "SEL_reset", 0)
    p.wire("SEL_reset", 0, "MSG_reset", 0)
    p.wire("MSG_reset", 0, "JS", 0)

    # lifecycle: loaded -> (size the spectrum buffer, ask for the sample rate, tell the script)
    p.obj("THIS", "live.thisdevice", (20, 340))
    p.obj("T_LOAD", "t b b b b b", (20, 370))
    p.message("MSG_loaded", "loaded", (20, 400 + 40))
    p.message("MSG_interval", "250", (480, 340))
    p.message("MSG_interval2", "250", (540, 340))
    p.obj("DSPST", "dspstate~", (300, 340), w=80)
    p.obj("PP_sr", "prepend sr", (300, 370))
    p.obj("PP_active", "prepend active", (140, 340))
    p.wire("THIS", 0, "T_LOAD", 0)
    p.wire("T_LOAD", 4, "MSG_size", 0)
    p.wire("T_LOAD", 3, "MSG_interval", 0)
    p.wire("MSG_interval", 0, "SNAP", 0)
    p.wire("T_LOAD", 2, "MSG_interval2", 0)
    p.wire("MSG_interval2", 0, "SNAP_SR", 0)
    p.wire("T_LOAD", 1, "DSPST", 0)
    p.wire("T_LOAD", 0, "MSG_loaded", 0)
    p.wire("MSG_loaded", 0, "JS", 0)
    p.wire("DSPST", 1, "PP_sr", 0)
    p.wire("SNAP_SR", 0, "PP_sr", 0)
    p.wire("PP_sr", 0, "JS", 0)
    p.wire("THIS", 1, "PP_active", 0)
    p.wire("PP_active", 0, "JS", 0)

    # the script owns the analysis clock: qmetro only runs while Listen is on
    p.obj("QM", "qmetro 250", (20, 440))
    p.message("MSG_tick", "tick", (20, 470))
    p.wire("JS", OUT_TICK, "QM", 0)
    p.wire("QM", 0, "MSG_tick", 0)
    p.wire("MSG_tick", 0, "JS", 0)

    # global bus to the Scale Snap MIDI devices
    p.obj("S_DETECT", "s scalesnap.detect", (200, 470), w=130)
    p.wire("JS", OUT_SEND, "S_DETECT", 0)

    # script -> UI
    p.wire("JS", OUT_CHROMA, "CHROMA", 0)
    for i in range(5):
        p.wire("JS", OUT_ROW1 + i, "ROW%d" % (i + 1), 0)
    p.wire("JS", OUT_SAME, "SAME", 0)
    p.wire("JS", OUT_STATUS, "STATUS", 0)

    return gen_patcher.device_dict(p, ui, DEVICE_WIDTH, AMXD_TYPE_AUDIO_EFFECT, rect=(60.0, 90.0, 900.0, 620.0))


def renders():
    return [(OUTPUT, dumps(build_main())), (OUTPUT_SPEC, dumps(build_spec()))]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args(argv)
    stale = False
    for path, text in renders():
        if args.check:
            cur = open(path, encoding="utf-8").read() if os.path.exists(path) else None
            if cur != text:
                print("STALE: %s. Run: python3 m4l/tools/gen_patcher_detect.py" % path)
                stale = True
            else:
                print("%s is up to date" % os.path.basename(path))
        else:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
            print("wrote", path)
    return 1 if stale else 0


if __name__ == "__main__":
    sys.exit(main())
