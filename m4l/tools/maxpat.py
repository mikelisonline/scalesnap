"""Tiny helper for writing Max patcher (.maxpat) JSON from Python.

Used by gen_patcher.py. It knows the inlet/outlet counts of the handful of Max objects the
Scale Snap patchers use, hands out ids, and lays out sub-patchers automatically so the generated
files are readable when opened in Max. Output is plain JSON, as Max itself writes.
"""
import json
import re

APPVERSION = {"major": 8, "minor": 2, "revision": 10, "architecture": "x64", "modernui": 1}


def io_for(text):
    """(numinlets, numoutlets, outlettype) for an object box's text."""
    tok = text.split()
    cls, args = tok[0], tok[1:]
    n = len(args)
    if cls in ("t", "trigger"):
        kinds = {"i": "int", "b": "bang", "l": "list", "f": "float", "s": "", "a": ""}
        return 1, n, [kinds[a] for a in args]
    if cls in ("sel", "select"):
        return (2 if n == 1 else 1), n + 1, ["bang"] * n + [""]
    if cls == "unpack":
        return 1, n, [""] * n
    if cls == "pack":
        return n, 1, [""]
    if cls in ("+", "-", "*", "/", ">", "<", "==", "!=", ">=", "<="):
        return 2, 1, ["int"]
    if cls == "int":
        return 2, 1, ["int"]
    if cls == "gate":
        return 2, int(args[0]), [""] * int(args[0])
    if cls == "uzi":
        return 2, 3, ["bang", "bang", "int"]
    if cls == "coll":
        return 1, 4, ["", "", "", ""]
    if cls == "loadbang":
        return 1, 1, ["bang"]
    if cls == "prepend":
        return 2, 1, [""]
    if cls in ("r", "receive"):
        return 1, 1, [""]
    if cls in ("s", "send"):
        return 1, 0, []
    if cls == "midiin":
        return 1, 1, ["int"]
    if cls == "midiout":
        return 1, 0, []
    if cls == "midiparse":
        return 1, 7, [""] * 7
    if cls == "midiformat":
        return 7, 1, ["int"]
    if cls == "live.thisdevice":
        return 1, 3, ["bang", "int", "int"]
    raise KeyError("unknown object class %r (add it to maxpat.io_for)" % cls)


class Patcher:
    def __init__(self, name="patcher"):
        self.name = name
        self.boxes = []        # dicts with a "box" key
        self.lines = []
        self._wires = []       # (src, outlet, dst, inlet); resolved lazily so forward references work
        self.by_name = {}      # symbolic name -> box dict
        self._n = 0

    # ---- boxes
    def _add(self, name, box):
        self._n += 1
        box["id"] = "obj-%d" % self._n
        if name in self.by_name:
            raise KeyError("duplicate name " + name)
        self.by_name[name] = box
        self.boxes.append({"box": box})
        return box

    def obj(self, name, text, rect=(0, 0), **extra):
        nin, nout, types = io_for(text)
        box = {"maxclass": "newobj", "numinlets": nin, "numoutlets": nout, "outlettype": types,
               "patching_rect": [float(rect[0]), float(rect[1]), float(extra.pop("w", 60)), 22.0],
               "text": text}
        box.update(extra)
        return self._add(name, box)

    def message(self, name, text, rect=(0, 0), **extra):
        box = {"maxclass": "message", "numinlets": 2, "numoutlets": 1, "outlettype": [""],
               "patching_rect": [float(rect[0]), float(rect[1]), float(extra.pop("w", 60)), 22.0],
               "text": text}
        box.update(extra)
        return self._add(name, box)

    def comment(self, name, text, rect=(0, 0), w=120, **extra):
        box = {"maxclass": "comment", "numinlets": 1, "numoutlets": 0,
               "patching_rect": [float(rect[0]), float(rect[1]), float(w), 20.0], "text": text}
        box.update(extra)
        return self._add(name, box)

    def raw(self, name, box):
        return self._add(name, box)

    def inlet(self, name, index, comment, rect=(0, 0)):
        return self._add(name, {"maxclass": "inlet", "numinlets": 0, "numoutlets": 1, "outlettype": [""],
                                "index": index, "comment": comment,
                                "patching_rect": [float(rect[0]), float(rect[1]), 30.0, 30.0]})

    def outlet(self, name, index, comment, rect=(0, 0)):
        return self._add(name, {"maxclass": "outlet", "numinlets": 1, "numoutlets": 0,
                                "index": index, "comment": comment,
                                "patching_rect": [float(rect[0]), float(rect[1]), 30.0, 30.0]})

    def subpatcher(self, name, text, sub, rect=(0, 0), w=70):
        """Embedded [p ...] box. `sub` is a Patcher whose inlet/outlet boxes define the I/O."""
        sub.resolve()
        nin = sum(1 for b in sub.boxes if b["box"]["maxclass"] == "inlet")
        nout = sum(1 for b in sub.boxes if b["box"]["maxclass"] == "outlet")
        box = {"maxclass": "newobj", "numinlets": nin, "numoutlets": nout, "outlettype": [""] * nout,
               "patching_rect": [float(rect[0]), float(rect[1]), float(w), 22.0], "text": text,
               "patcher": sub.to_dict(embedded=True)}
        return self._add(name, box)

    # ---- connections
    def wire(self, src, outlet, dst, inlet):
        self._wires.append((src, outlet, dst, inlet))

    def resolve(self):
        """Turn the recorded wires into patchlines (checks names and inlet/outlet numbers)."""
        self.lines = []
        for src, outlet, dst, inlet in self._wires:
            s, d = self.by_name[src], self.by_name[dst]
            if outlet >= s["numoutlets"]:
                raise ValueError("%s has no outlet %d" % (src, outlet))
            if inlet >= d["numinlets"]:
                raise ValueError("%s has no inlet %d" % (dst, inlet))
            self.lines.append({"patchline": {"destination": [d["id"], inlet], "source": [s["id"], outlet]}})

    # ---- layout for machine-built sub-patchers
    def autolayout(self, x0=20, y0=20, dx=150, dy=60):
        self.resolve()
        ids = {b["box"]["id"]: b["box"] for b in self.boxes}
        depth = {i: 0 for i in ids}
        edges = [(l["patchline"]["source"][0], l["patchline"]["destination"][0]) for l in self.lines]
        for _ in range(len(ids)):          # relax (graph is a DAG; loops are not used)
            changed = False
            for s, d in edges:
                if depth[d] < depth[s] + 1:
                    depth[d] = depth[s] + 1
                    changed = True
            if not changed:
                break
        layers = {}
        for b in self.boxes:
            box = b["box"]
            if box["maxclass"] == "inlet":
                depth[box["id"]] = 0
            layers.setdefault(depth[box["id"]], []).append(box)
        for d, boxes in layers.items():
            for i, box in enumerate(boxes):
                box["patching_rect"][0] = float(x0 + i * dx)
                box["patching_rect"][1] = float(y0 + d * dy)

    def to_dict(self, embedded=False, rect=(40.0, 60.0, 900.0, 700.0)):
        self.resolve()
        d = {
            "fileversion": 1,
            "appversion": dict(APPVERSION),
            "classnamespace": "box",
            "rect": list(rect),
            "bglocked": 0, "openinpresentation": 0, "default_fontsize": 12.0, "default_fontface": 0,
            "default_fontname": "Arial", "gridonopen": 1, "gridsize": [15.0, 15.0], "gridsnaponopen": 1,
            "objectsnaponopen": 1, "statusbarvisible": 2, "toolbarvisible": 1, "lefttoolbarpinned": 0,
            "toptoolbarpinned": 0, "righttoolbarpinned": 0, "bottomtoolbarpinned": 0, "toolbars_unpinned_last_save": 0,
            "tallnewobj": 0, "boxanimatetime": 200, "enablehscroll": 1, "enablevscroll": 1, "devicewidth": 0.0,
            "description": "", "digest": "", "tags": "", "style": "", "subpatcher_template": "",
            "boxes": self.boxes, "lines": self.lines,
        }
        if embedded:
            d["openinpresentation"] = 0
        return d


def dumps(patcher_dict):
    return json.dumps({"patcher": patcher_dict}, indent=2) + "\n"
