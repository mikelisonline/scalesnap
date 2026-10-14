#!/usr/bin/env python3
"""Generate m4l/ScaleSnap/Scale Snap.maxpat (the Max for Live MIDI effect patcher).

The patcher is machine-written because it is ~150 boxes and ~200 patch cords; writing the JSON by
hand invites wiring mistakes. The generated JSON is committed and CI fails if it is stale:

    python3 m4l/tools/gen_patcher.py            # (re)write m4l/ScaleSnap/Scale Snap.maxpat
    python3 m4l/tools/gen_patcher.py --check    # exit 1 if the committed file is stale

Realtime path (native Max objects only, see docs/design in m4l/README.md):
    midiin -> midiparse -> [p snapcore] -> midiformat -> midiout
[p snapcore] is driven by a 128-entry lookup (coll) that scalesnap.js rewrites whenever key, scale,
mode or power change. It remembers which output note each held key produced (so note-offs always
match, even after a scale change) and reference-counts output notes (two keys on the same output
note do not cut each other off). tests/maxsim.js executes this very JSON and compares it with the
C++ NoteTracker.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import gen_scales  # noqa: E402
from maxpat import APPVERSION, Patcher, dumps  # noqa: E402

REPO = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
OUTPUT = os.path.join(REPO, "m4l", "ScaleSnap", "Scale Snap.maxpat")

DEVICE_WIDTH = 440
DEVICE_HEIGHT = 169
JS_NAME = "scalesnap.js"            # the bundle build_amxd.py writes next to the .amxd
AMXD_TYPE_MIDI_EFFECT = 1835887981   # 'mmmm'

MODE_ENUM = ["Nearest (tie down)", "Nearest (tie up)", "Always up", "Always down", "Block"]
MEMORY_ENUM = ["Short (10 s)", "Medium (30 s)", "Hold"]
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]


# ---------------------------------------------------------------------------------------------
# p snapcore
# ---------------------------------------------------------------------------------------------
def build_snapcore():
    p = Patcher("snapcore")
    o, m, w = p.obj, p.message, p.wire

    # I/O
    p.inlet("in_note", 1, "note list: pitch velocity")
    p.inlet("in_poly", 2, "poly pressure list: pitch pressure")
    p.inlet("in_map", 3, "snap table write: index value (output note + 1, 0 = blocked)")
    p.inlet("in_flush", 4, "bang: release every sounding note and clear state")
    p.outlet("out_note", 1, "note list: pitch velocity (velocity 0 = note-off)")
    p.outlet("out_poly", 2, "poly pressure list: pitch pressure")

    # State tables. Values: MAP/HELD = output note + 1 (0 = blocked / none); CNT = refcount per output note.
    # HELDP is a mirror of HELD so polyphonic aftertouch can look up the held key without sharing HELD's outlet.
    for n in ("MAP", "HELD", "HELDP", "CNT"):
        o(n, "coll")
    o("G_CNT", "gate 3")   # routes CNT lookups back to whoever asked (1 = note-off, 2 = note-on, 3 = flush)
    for k in (1, 2, 3):
        m("K%d" % k, str(k))
    w("CNT", 0, "G_CNT", 1)
    for k in (1, 2, 3):
        w("K%d" % k, 0, "G_CNT", 0)

    def lookup_cnt(name, k):
        """[t i b]: set the return address, then look the index up in CNT."""
        o(name, "t i b")
        w(name, 1, "K%d" % k, 0)
        w(name, 0, "CNT", 0)

    # ---- note in: split note-on / note-off by velocity
    o("U1", "unpack 0 0")
    o("TV", "t i i")
    o("VINT", "int")
    o("GT", "> 0")
    o("P1", "+ 1")
    o("G", "gate 2")
    w("in_note", 0, "U1", 0)
    w("U1", 1, "TV", 0)       # velocity first
    w("TV", 1, "VINT", 1)     # remember it (cold)
    w("TV", 0, "GT", 0)
    w("GT", 0, "P1", 0)
    w("P1", 0, "G", 0)        # velocity 0 -> outlet 1 (note-off), >0 -> outlet 2 (note-on)
    w("U1", 0, "G", 1)        # then the pitch
    w("G", 0, "T_OFF1", 0)
    w("G", 1, "T_ON1", 0)

    # ---- note-off(P): o1 = HELD[P]; if o1 > 0 { HELD[P] = 0; o = o1 - 1; cnt[o]--; if cnt[o] == 0 emit(o, 0) }
    o("T_OFF1", "t i i")
    o("PK_CLR", "pack 0 0")
    o("T_CLR", "t l l")
    o("S_O1", "sel 0")
    o("DEC", "- 1")
    o("T_O1", "t i i i")
    o("OINT_A", "int")
    o("OINT_B", "int")
    lookup_cnt("LKO", 1)
    o("S_C", "sel 0 1")
    o("PK_OFFEV", "pack 0 0")
    o("T_OFFEV", "t l l")
    o("T_C2", "t b i")
    o("DEC2", "- 1")
    o("PK_DEC", "pack 0 0")
    w("T_OFF1", 1, "HELD", 0)       # read first ...
    w("T_OFF1", 0, "PK_CLR", 0)     # ... then clear HELD[P]
    w("PK_CLR", 0, "T_CLR", 0)
    w("T_CLR", 1, "HELD", 0)
    w("T_CLR", 0, "HELDP", 0)
    w("HELD", 0, "S_O1", 0)
    w("S_O1", 1, "DEC", 0)
    w("DEC", 0, "T_O1", 0)
    w("T_O1", 2, "OINT_A", 1)
    w("T_O1", 1, "OINT_B", 1)
    w("T_O1", 0, "LKO", 0)
    w("G_CNT", 0, "S_C", 0)
    w("S_C", 1, "OINT_A", 0)        # count was 1: it reaches 0 -> note-off + store 0
    w("OINT_A", 0, "PK_OFFEV", 0)
    w("PK_OFFEV", 0, "T_OFFEV", 0)
    w("T_OFFEV", 1, "out_note", 0)
    w("T_OFFEV", 0, "CNT", 0)
    w("S_C", 2, "T_C2", 0)          # count >= 2: just decrement
    w("T_C2", 1, "DEC2", 0)
    w("DEC2", 0, "PK_DEC", 1)
    w("T_C2", 0, "OINT_B", 0)
    w("OINT_B", 0, "PK_DEC", 0)
    w("PK_DEC", 0, "CNT", 0)

    # ---- note-on(P, V): note-off(P) first; o1 = MAP[P]; blocked -> drop; HELD[P] = o1;
    #      c = cnt[o]; if c > 0 emit(o, 0) (retrigger); emit(o, V); cnt[o] = c + 1
    o("T_ON1", "t i i")
    o("T_ON2", "t i i")
    o("PINT", "int")
    o("S_M", "sel 0")
    o("T_ON3", "t i b i")
    o("PK_HELD", "pack 0 0")
    o("T_HELD", "t l l")
    o("DEC3", "- 1")
    o("T_N1", "t i i i")
    o("OINT2", "int")
    o("OINT3", "int")
    lookup_cnt("LKN", 2)
    o("T_N2", "t i i i")
    o("INC", "+ 1")
    o("PK_CNT", "pack 0 0")
    o("S_C0", "sel 0")
    o("T_RT", "t b")
    o("PK_RT", "pack 0 0")
    o("T_FIN", "t b b")
    o("T_FIN2", "t i i")
    o("PK_ON", "pack 0 0")
    w("T_ON1", 1, "T_OFF1", 0)
    w("T_ON1", 0, "T_ON2", 0)
    w("T_ON2", 1, "PINT", 1)
    w("T_ON2", 0, "MAP", 0)
    w("MAP", 0, "S_M", 0)
    w("S_M", 1, "T_ON3", 0)         # blocked (0): nothing to do, HELD[P] stays 0
    w("T_ON3", 2, "PK_HELD", 1)
    w("T_ON3", 1, "PINT", 0)
    w("PINT", 0, "PK_HELD", 0)
    w("PK_HELD", 0, "T_HELD", 0)
    w("T_HELD", 1, "HELD", 0)
    w("T_HELD", 0, "HELDP", 0)
    w("T_ON3", 0, "DEC3", 0)
    w("DEC3", 0, "T_N1", 0)
    w("T_N1", 2, "OINT2", 1)
    w("T_N1", 1, "OINT3", 1)
    w("T_N1", 0, "LKN", 0)
    w("G_CNT", 1, "T_N2", 0)
    w("T_N2", 2, "INC", 0)
    w("INC", 0, "PK_CNT", 1)
    w("T_N2", 1, "S_C0", 0)
    w("S_C0", 1, "T_RT", 0)         # already sounding: release it first (fresh attack)
    w("T_RT", 0, "OINT2", 0)
    w("OINT2", 0, "PK_RT", 0)
    w("PK_RT", 0, "out_note", 0)
    w("T_N2", 0, "T_FIN", 0)
    w("T_FIN", 1, "VINT", 0)
    w("VINT", 0, "PK_ON", 1)
    w("T_FIN", 0, "OINT3", 0)
    w("OINT3", 0, "T_FIN2", 0)
    w("T_FIN2", 1, "PK_ON", 0)
    w("PK_ON", 0, "out_note", 0)
    w("T_FIN2", 0, "PK_CNT", 0)
    w("PK_CNT", 0, "CNT", 0)

    # ---- polyphonic aftertouch: follow the output note the held key is playing
    o("UP", "unpack 0 0")
    o("PK_POLY", "pack 0 0")
    o("S_HP", "sel 0")
    o("DECP", "- 1")
    w("in_poly", 0, "UP", 0)
    w("UP", 1, "PK_POLY", 1)
    w("UP", 0, "HELDP", 0)
    w("HELDP", 0, "S_HP", 0)
    w("S_HP", 1, "DECP", 0)
    w("DECP", 0, "PK_POLY", 0)
    w("PK_POLY", 0, "out_poly", 0)

    # ---- table writes from scalesnap.js
    w("in_map", 0, "MAP", 0)

    # ---- flush: note-off for every output note with a count > 0, then clear everything
    o("UZ", "uzi 128")
    o("IDX", "- 1")
    o("T_FL", "t i i i")
    o("FINT", "int")
    lookup_cnt("LKF", 3)
    o("S_FL", "sel 0")
    o("T_FB", "t b")
    o("PK_FLEV", "pack 0 0")
    o("PK_Z", "pack 0 0")
    o("T_Z", "t l l l")
    w("in_flush", 0, "UZ", 0)
    w("UZ", 2, "IDX", 0)
    w("IDX", 0, "T_FL", 0)
    w("T_FL", 2, "FINT", 1)
    w("T_FL", 1, "LKF", 0)
    w("T_FL", 0, "PK_Z", 0)
    w("G_CNT", 2, "S_FL", 0)
    w("S_FL", 1, "T_FB", 0)
    w("T_FB", 0, "FINT", 0)
    w("FINT", 0, "PK_FLEV", 0)
    w("PK_FLEV", 0, "out_note", 0)
    w("PK_Z", 0, "T_Z", 0)
    w("T_Z", 2, "HELD", 0)
    w("T_Z", 1, "HELDP", 0)
    w("T_Z", 0, "CNT", 0)

    # ---- load: identity snap table (so a missing/failed script means pass-through, never silence),
    #      and zero HELD / CNT (coll outputs nothing for keys that were never stored)
    o("LB", "loadbang")
    o("UZI", "uzi 128")
    o("T_I", "t i i")
    o("DEC_I", "- 1")
    o("T_I2", "t i i")
    o("PK_MAP", "pack 0 0")
    w("LB", 0, "UZI", 0)
    w("UZI", 2, "T_I", 0)
    w("T_I", 1, "PK_MAP", 1)        # k = index + 1 = identity value
    w("T_I", 0, "DEC_I", 0)
    w("DEC_I", 0, "T_I2", 0)
    w("T_I2", 1, "PK_Z", 0)
    w("T_I2", 0, "PK_MAP", 0)
    w("PK_MAP", 0, "MAP", 0)

    p.autolayout()
    return p


# ---------------------------------------------------------------------------------------------
# main patcher
# ---------------------------------------------------------------------------------------------
class UI:
    """Adds live.* objects (patching rect in a tidy grid, presentation rect for the device face)."""

    def __init__(self, p):
        self.p = p
        self.params = []   # (box id, long, short)
        self.row = 0

    def _patch_rect(self, w, h):
        self.row += 1
        return [620.0, 20.0 + 24.0 * self.row, float(w), float(h)]

    def _param(self, name, longname, shortname, kind, extra):
        v = {"parameter_longname": longname, "parameter_shortname": shortname, "parameter_modmode": 0}
        v.update(kind)
        box = {"parameter_enable": 1, "varname": longname, "saved_attribute_attributes": {"valueof": v}}
        box.update(extra)
        return box

    def enum_param(self, kind, name, longname, shortname, enum, initial, pres, extra=None, nout=None):
        box = {"maxclass": kind, "numinlets": 1, "numoutlets": 3 if kind == "live.menu" else 2,
               "outlettype": ["", "", "float"] if kind == "live.menu" else ["", ""],
               "patching_rect": self._patch_rect(pres[2], pres[3]),
               "presentation": 1, "presentation_rect": [float(x) for x in pres]}
        kindattrs = {"parameter_type": 2, "parameter_enum": enum, "parameter_mmax": len(enum) - 1,
                     "parameter_initial": [initial], "parameter_initial_enable": 1, "parameter_unitstyle": 0}
        box.update(self._param(name, longname, shortname, kindattrs, extra or {}))
        b = self.p.raw(name, box)
        self.params.append((b["id"], longname, shortname))
        return b

    def free(self, kind, name, pres, nout, types, extra, nin=1):
        box = {"maxclass": kind, "numinlets": nin, "numoutlets": nout, "outlettype": types,
               "patching_rect": self._patch_rect(pres[2], pres[3]),
               "presentation": 1, "presentation_rect": [float(x) for x in pres], "varname": name}
        box.update(extra)
        return self.p.raw(name, box)


def build_main():
    scales, categories = gen_scales.parse_header()
    default_uid = scales[0]["uid"]
    cat_enum = ["All Scales", "Favorites"] + categories

    core = build_snapcore()
    p = Patcher("Scale Snap")
    ui = UI(p)

    # ---- device face (presentation) -----------------------------------------------------------
    ui.enum_param("live.text", "POWER", "Power", "Power", ["Off", "On"], 1, (6, 6, 40, 18),
                  {"mode": 1, "text": "Snap", "texton": "Snap"})
    ui.enum_param("live.menu", "KEY", "Key", "Key", NOTE_NAMES, 0, (50, 6, 46, 18))
    ui.enum_param("live.menu", "CAT", "Category", "Category", cat_enum, 0, (100, 6, 122, 18))
    ui.enum_param("live.text", "PREV", "Previous Scale", "Prev", ["off", "on"], 0, (6, 28, 18, 18),
                  {"mode": 0, "text": "<"})
    ui.free("live.menu", "SCALE", (26, 28, 138, 18), 3, ["", "", "float"], {})
    ui.enum_param("live.text", "NEXT", "Next Scale", "Next", ["off", "on"], 0, (166, 28, 18, 18),
                  {"mode": 0, "text": ">"})
    ui.free("live.text", "FAV", (188, 28, 34, 18), 2, ["", ""], {"mode": 1, "text": "Fav", "texton": "Fav"})
    ui.enum_param("live.menu", "MODE", "Correction", "Correct", MODE_ENUM, 0, (6, 50, 130, 18))
    ui.free("live.text", "SNAPCLIP", (140, 50, 82, 18), 2, ["", ""], {"mode": 0, "text": "Snap Clip"})
    ui.free("kslider", "KB", (6, 72, 216, 40), 2, ["int", "int"],
            {"range": 36, "offset": 48, "mode": 1, "ignoreclick": 1, "numinlets": 2,
             "blackkeycolor": [0.22, 0.22, 0.22, 1.0], "whitekeycolor": [0.78, 0.78, 0.78, 1.0],
             "hkeycolor": [1.0, 0.6, 0.0, 1.0], "selectioncolor": [1.0, 0.6, 0.0, 1.0]}, nin=2)
    ui.free("live.comment", "INFO", (6, 116, 216, 48), 0, [], {"text": "", "fontsize": 9.0, "textjustification": 0})

    ui.free("live.comment", "DET_LABEL", (232, 4, 60, 14), 0, [], {"text": "DETECT", "fontsize": 9.0})
    ui.free("live.text", "LISTEN", (232, 22, 60, 18), 2, ["", ""], {"mode": 1, "text": "Listen", "texton": "Listen"})
    ui.free("live.text", "RESET", (296, 22, 44, 18), 2, ["", ""], {"mode": 0, "text": "Reset"})
    ui.free("live.text", "ANALYZE", (344, 22, 90, 18), 2, ["", ""], {"mode": 0, "text": "Analyze Clip"})
    ui.enum_param("live.menu", "MEMORY", "Detect Memory", "Memory", MEMORY_ENUM, 1, (232, 44, 108, 18))
    ui.free("live.text", "APPLY", (344, 44, 90, 18), 2, ["", ""], {"mode": 0, "text": "Apply"})
    ui.free("live.menu", "RESULTS", (232, 66, 202, 18), 3, ["", "", "float"], {})
    ui.free("live.comment", "SAME", (232, 88, 202, 24), 0, [], {"text": "", "fontsize": 9.0, "textjustification": 0})
    ui.free("live.comment", "STATUS", (232, 114, 202, 14), 0, [], {"text": "", "fontsize": 9.0, "textjustification": 0})
    ui.free("live.comment", "AUDIO", (232, 134, 148, 30), 0, [], {"text": "", "fontsize": 9.0, "textjustification": 0})
    ui.free("live.text", "AUDIOAPPLY", (386, 140, 48, 18), 2, ["", ""], {"mode": 0, "text": "Apply"})

    # Hidden parameter: the selected scale, stored as its stable uid (never the list position).
    uid_box = {"maxclass": "live.numbox", "numinlets": 1, "numoutlets": 2, "outlettype": ["", "float"],
               "patching_rect": ui._patch_rect(60, 15), "presentation": 0,
               "parameter_enable": 1, "varname": "Scale ID",
               "saved_attribute_attributes": {"valueof": {
                   "parameter_longname": "Scale ID", "parameter_shortname": "Scale ID", "parameter_modmode": 0,
                   "parameter_type": 1, "parameter_mmin": 0, "parameter_mmax": 16777215,
                   "parameter_initial": [default_uid], "parameter_initial_enable": 1,
                   "parameter_unitstyle": 0, "parameter_invisible": 1}}}
    b = p.raw("UID", uid_box)
    ui.params.append((b["id"], "Scale ID", "Scale ID"))

    # ---- realtime MIDI path ---------------------------------------------------------------------
    y = 20
    p.obj("MIDIIN", "midiin", (20, y))
    p.obj("PARSE", "midiparse", (20, y + 40))
    p.obj("TNOTE", "t l l", (20, y + 80))
    p.obj("PNOTE", "prepend note", (120, y + 120))
    p.subpatcher("CORE", "p snapcore", core, (20, y + 160), w=330)
    p.obj("FORMAT", "midiformat", (20, y + 240))
    p.obj("MIDIOUT", "midiout", (20, y + 280))
    p.wire("MIDIIN", 0, "PARSE", 0)
    p.wire("PARSE", 0, "TNOTE", 0)
    p.wire("TNOTE", 0, "CORE", 0)
    p.wire("TNOTE", 1, "PNOTE", 0)
    p.wire("PARSE", 1, "CORE", 1)
    for i in range(2, 7):
        p.wire("PARSE", i, "FORMAT", i)       # CC, program, channel pressure, pitch bend, channel: unchanged
    p.wire("CORE", 0, "FORMAT", 0)
    p.wire("CORE", 1, "FORMAT", 1)
    p.wire("FORMAT", 0, "MIDIOUT", 0)

    # ---- glue script ------------------------------------------------------------------------------
    p.raw("JS", {"maxclass": "newobj", "numinlets": 1, "numoutlets": 12, "outlettype": [""] * 12,
                 "patching_rect": [20.0, 340.0, 180.0, 22.0], "text": "js " + JS_NAME,
                 "saved_object_attributes": {"filename": JS_NAME, "parameter_enable": 0}})
    p.wire("PNOTE", 0, "JS", 0)
    p.wire("JS", 0, "CORE", 2)

    # UI -> script: [prepend msg] objects
    def to_js(src, outlet, msg, name=None):
        name = name or "PP_" + msg
        p.obj(name, "prepend " + msg, (300, 20 + 26 * len(p.by_name)))
        p.wire(src, outlet, name, 0)
        p.wire(name, 0, "JS", 0)

    to_js("POWER", 0, "power")
    to_js("KEY", 0, "key")
    to_js("MODE", 0, "mode")
    to_js("CAT", 0, "category")
    to_js("SCALE", 0, "scalemenu")
    to_js("UID", 0, "scaleuid")
    to_js("LISTEN", 0, "listen")
    to_js("MEMORY", 0, "memory")
    to_js("RESULTS", 0, "resultselect")

    # momentary buttons: only the press (1) triggers; the message box turns the bang into the message
    for src, msg in (("PREV", "prev"), ("NEXT", "next"), ("RESET", "reset"), ("ANALYZE", "analyze"),
                     ("APPLY", "apply"), ("SNAPCLIP", "snapclip"), ("AUDIOAPPLY", "audioapply")):
        p.obj("SEL_" + msg, "sel 1", (460, 20 + 26 * len(p.by_name)))
        p.message("MSG_" + msg, msg, (520, 20 + 26 * len(p.by_name)))
        p.wire(src, 0, "SEL_" + msg, 0)
        p.wire("SEL_" + msg, 0, "MSG_" + msg, 0)
        p.wire("MSG_" + msg, 0, "JS", 0)
    p.message("MSG_togglefav", "togglefav", (520, 20 + 26 * len(p.by_name)))
    p.wire("FAV", 0, "MSG_togglefav", 0)
    p.wire("MSG_togglefav", 0, "JS", 0)

    # lifecycle
    p.obj("THIS", "live.thisdevice", (300, 340))
    p.message("MSG_loaded", "loaded", (300, 380))
    p.wire("THIS", 0, "MSG_loaded", 0)
    p.wire("MSG_loaded", 0, "JS", 0)
    p.obj("SEL_OFF", "sel 0", (380, 380))                  # device switched off -> release sounding notes
    p.wire("THIS", 1, "SEL_OFF", 0)
    p.wire("SEL_OFF", 0, "CORE", 3)

    # global buses
    p.obj("R_DETECT", "r scalesnap.detect", (20, 420))
    p.wire("R_DETECT", 0, "JS", 0)
    p.obj("R_FAV", "r scalesnap.favorites", (200, 420))
    p.obj("T_FAV", "t b", (200, 450))
    p.message("MSG_favchanged", "favchanged", (200, 480))
    p.wire("R_FAV", 0, "T_FAV", 0)
    p.wire("T_FAV", 0, "MSG_favchanged", 0)
    p.wire("MSG_favchanged", 0, "JS", 0)

    # script -> UI (one outlet per object, see scalesnap_main.js OUT)
    for outlet, target in ((1, "KEY"), (2, "CAT"), (3, "SCALE"), (4, "UID"), (5, "FAV"), (6, "KB"),
                           (7, "INFO"), (8, "RESULTS"), (9, "SAME"), (10, "STATUS"), (11, "AUDIO")):
        p.wire("JS", outlet, target, 0)

    return device_dict(p, ui, DEVICE_WIDTH, AMXD_TYPE_MIDI_EFFECT)


def device_dict(p, ui, width, amxd_type, rect=(60.0, 90.0, 760.0, 560.0)):
    """Top-level patcher dictionary of a Max for Live device (shared with gen_patcher_detect.py)."""
    d = p.to_dict(rect=rect)
    d["openinpresentation"] = 1
    d["openrect"] = [0.0, 0.0, float(width), float(DEVICE_HEIGHT)]
    d["openrectmode"] = 0
    d["default_fontsize"] = 10.0
    d["default_fontname"] = "Arial Bold"
    d["gridsize"] = [8.0, 8.0]
    d["boxanimatetime"] = 500
    d["parameters"] = {bid: [lng, sht, 0] for bid, lng, sht in ui.params}
    d["latency"] = 0
    d["is_mpe"] = 0
    d["external_mpe_tuning_enabled"] = 0
    d["minimum_live_version"] = ""
    d["minimum_max_version"] = ""
    d["platform_compatibility"] = 0
    d["project"] = {
        "version": 1, "creationdate": 3590052493, "modificationdate": 3590052493,
        "viewrect": [0.0, 0.0, 300.0, 500.0], "autoorganize": 1, "hideprojectwindow": 1,
        "showdependencies": 1, "autolocalize": 0, "contents": {"patchers": {}}, "layout": {},
        "searchpath": {}, "detailsvisible": 0, "amxdtype": amxd_type, "readonly": 0,
        "devpathtype": 0, "devpath": ".", "sortmode": 0, "viewmode": 0, "includepackages": 0,
    }
    d["autosave"] = 0
    for k in ("bglocked", "gridonopen", "gridsnaponopen", "objectsnaponopen", "toolbars_unpinned_last_save",
              "tallnewobj", "enablehscroll", "enablevscroll", "devicewidth", "default_fontface"):
        d.pop(k, None)
    return d


def render():
    return dumps(build_main())


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--output", default=OUTPUT)
    args = ap.parse_args(argv)
    text = render()
    if args.check:
        cur = open(args.output, encoding="utf-8").read() if os.path.exists(args.output) else None
        if cur != text:
            print("STALE: %s. Run: python3 m4l/tools/gen_patcher.py" % args.output)
            return 1
        print("Scale Snap.maxpat is up to date")
        return 0
    with open(args.output, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    print("wrote", args.output)
    return 0


if __name__ == "__main__":
    sys.exit(main())
