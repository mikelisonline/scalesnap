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
    if cls == "split":
        return 3, 2, ["", ""]
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
    # ---- MSP objects of the audio device (Scale Snap Detect)
    if cls == "plugin~":
        return 0, 2, ["signal", "signal"]
    if cls == "plugout~":
        return 2, 0, []
    if cls in ("+~", "*~"):
        return 2, 1, ["signal"]
    if cls in ("sig~", "mstosamps~"):
        return 1, 1, ["signal"]
    if cls == "average~":
        return 1, 1, ["signal"]
    if cls == "snapshot~":
        return 2, 1, ["float"]
    if cls == "qmetro":
        return 2, 1, ["bang"]
    if cls == "dspstate~":
        return 1, 4, ["int", "float", "int", "int"]
    if cls == "pfft~":            # one fftin~ in the sub-patcher, no fftout~: analysis only
        return 1, 0, []
    if cls == "fftin~":
        return 0, 3, ["signal", "signal", "signal"]
    if cls == "cartopol~":
        return 2, 2, ["signal", "signal"]
    if cls == "poke~":
        return 3, 0, []
    if cls == "buffer~":
        return 1, 2, ["float", "bang"]
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
        """Arrange the boxes in layers, signal flow downwards.

        Inlets go in one row at the top and outlets in one row at the bottom, each with strictly
        increasing x in index order: Max numbers a sub-patcher's inlets and outlets by their
        left-to-right position, so equal or swapped x positions would permute the I/O.
        The wiring may contain loops (a value written back to a table); edges that close a loop
        are ignored when assigning layers, so the layout is always finite and shallow.
        """
        self.resolve()
        ids = {b["box"]["id"]: b["box"] for b in self.boxes}
        order = [b["box"]["id"] for b in self.boxes]
        succ = {i: [] for i in ids}
        for l in self.lines:
            s, d = l["patchline"]["source"][0], l["patchline"]["destination"][0]
            succ[s].append(d)

        # depth-first search (iterative) to find the edges that point back into the current path
        back = set()
        state = {}                          # 1 = on the current path, 2 = done
        for root in order:
            if root in state:
                continue
            state[root] = 1
            stack = [(root, iter(succ[root]))]
            while stack:
                node, it = stack[-1]
                for nxt in it:
                    if state.get(nxt) == 1:
                        back.add((node, nxt))
                    elif nxt not in state:
                        state[nxt] = 1
                        stack.append((nxt, iter(succ[nxt])))
                        break
                else:
                    state[node] = 2
                    stack.pop()

        # longest path from a source over the remaining (acyclic) edges
        indeg = {i: 0 for i in ids}
        for s, ds in succ.items():
            for d in ds:
                if (s, d) not in back:
                    indeg[d] += 1
        depth = {i: 0 for i in ids}
        ready = [i for i in order if indeg[i] == 0]
        while ready:
            s = ready.pop()
            for d in succ[s]:
                if (s, d) in back:
                    continue
                depth[d] = max(depth[d], depth[s] + 1)
                indeg[d] -= 1
                if indeg[d] == 0:
                    ready.append(d)

        inlets = sorted((b["box"] for b in self.boxes if b["box"]["maxclass"] == "inlet"), key=lambda b: b["index"])
        outlets = sorted((b["box"] for b in self.boxes if b["box"]["maxclass"] == "outlet"), key=lambda b: b["index"])
        layers = {}
        for i in order:
            box = ids[i]
            if box["maxclass"] not in ("inlet", "outlet"):
                layers.setdefault(depth[i] + 1, []).append(box)     # layer 0 is the inlet row
        for layer, boxes in layers.items():
            for k, box in enumerate(boxes):
                box["patching_rect"][0] = float(x0 + k * dx)
                box["patching_rect"][1] = float(y0 + layer * dy)
        last = (max(layers) if layers else 0) + 1
        for row, boxes in ((0, inlets), (last, outlets)):
            for k, box in enumerate(boxes):
                box["patching_rect"][0] = float(x0 + k * dx)
                box["patching_rect"][1] = float(y0 + row * dy)

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
