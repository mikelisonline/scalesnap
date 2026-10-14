#!/usr/bin/env python3
"""Tests for the frozen .amxd writer/parser (m4l/tools/amxd_frozen.py) and the dependency check of the build.

    python3 m4l/tests/test_frozen.py        (also run by `node m4l/tests/run.js`, see frozen.test.js)
"""
import contextlib
import io
import json
import os
import shutil
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "tools"))
import amxd_frozen as A  # noqa: E402
import build_amxd as B  # noqa: E402

FIXTURES = os.path.join(HERE, "fixtures")
AMXDTYPE_MIDI = A.AMXDTYPE["mmmm"]
EMPTY_PATCHER = b'{"patcher": {"boxes": []}}'


def box(text, maxclass="newobj", **extra):
    return {"box": dict({"maxclass": maxclass, "text": text}, **extra)}


def patcher(*boxes, amxdtype=AMXDTYPE_MIDI):
    return {"patcher": {"fileversion": 1, "boxes": list(boxes), "project": {"amxdtype": amxdtype}, "autosave": 0}}


def sub(*boxes):
    return box("p sub", patcher=patcher(*boxes)["patcher"])


class FixtureTests(unittest.TestCase):
    """Devices frozen by Max itself (MIT, Ableton AG): the writer must reproduce them byte for byte."""

    def test_writer_reproduces_real_frozen_devices(self):
        names = sorted(f for f in os.listdir(FIXTURES) if f.endswith(".amxd"))
        self.assertEqual(len(names), 2)
        for name in names:
            self.assertIsNone(A.roundtrip(os.path.join(FIXTURES, name)), name)

    def test_parser_reads_a_max_8_device_with_dependencies(self):
        with open(os.path.join(FIXTURES, "OSC MIDI Send.amxd"), "rb") as f:
            dev = A.parse_frozen(f.read())
        self.assertEqual((dev["type"], dev["meta"]), ("mmmm", 7))
        self.assertEqual([e.name for e in dev["entries"]], ["OSC MIDI Send.amxd", "Overlay.maxpat", "close-btn_click.svg",
                                                            "close-btn_black.svg", "close-btn_default.svg"])
        self.assertEqual([(e.type, e.flag) for e in dev["entries"]], [(b"JSON", 17), (b"JSON", 0), (b"svg ", 0), (b"svg ", 0), (b"svg ", 0)])
        self.assertEqual(sorted(e["name"] for e in dev["patcher"]["patcher"]["dependency_cache"]), sorted(dev["files"]))
        self.assertTrue(dev["files"]["close-btn_click.svg"].startswith(b"<?xml"))

    def test_parser_rejects_damaged_files(self):
        with open(os.path.join(FIXTURES, "WithGarbage.amxd"), "rb") as f:
            data = f.read()
        for bad in (data[:-1], data[:4000], data[:24] + b"mx@d" + data[28:], data + b"\0"):
            with self.assertRaises(ValueError):
                A.parse_frozen(bad)


class FreezeTests(unittest.TestCase):
    def setUp(self):
        self.js = b"function loaded() {}\n"
        self.p = patcher(box("js foo.js"), box("pfft~ spec 1024 4"))
        self.files = {"foo.js": self.js, "spec.maxpat": json.dumps(patcher(box("fftin~ 1"))).encode()}

    def freeze(self, p=None, files=None, **kw):
        return A.freeze("mmmm", "Dev", self.p if p is None else p, self.files if files is None else files, **kw)

    def test_layout_and_contents(self):
        dev = A.parse_frozen(self.freeze())
        self.assertEqual((dev["type"], dev["meta"]), ("mmmm", 7))
        self.assertEqual([(e.name, e.type, e.flag, e.vers) for e in dev["entries"]],
                         [("Dev.amxd", b"JSON", 17, 0), ("foo.js", b"TEXT", 0, 0), ("spec.maxpat", b"JSON", 0, 0)])
        self.assertEqual(dev["files"], self.files)
        self.assertEqual(dev["entries"][0].data[-1:], b"\0")
        expected = dict(self.p["patcher"], dependency_cache=[
            {"name": "foo.js", "bootpath": "~/Documents/Max 8/Max for Live Devices/Dev Project/code", "type": "TEXT", "implicit": 1},
            {"name": "spec.maxpat", "bootpath": "~/Documents/Max 8/Max for Live Devices/Dev Project/patchers", "type": "JSON", "implicit": 1}])
        self.assertEqual(dev["patcher"]["patcher"], expected)
        self.assertEqual(list(dev["patcher"]["patcher"])[-2:], ["dependency_cache", "autosave"])

    def test_without_dependencies(self):
        dev = A.parse_frozen(A.freeze("mmmm", "Dev", patcher(box("t b")), {}))
        self.assertEqual(dev["files"], {})
        self.assertEqual(dev["patcher"]["patcher"]["dependency_cache"], [])

    def test_reproducible(self):
        self.assertEqual(self.freeze(), self.freeze())
        mdats = {e.mdat for e in A.parse_frozen(self.freeze()).get("entries")}
        self.assertEqual(mdats, {A.DEFAULT_SOURCE_DATE + A.HFS_EPOCH})

    def test_source_date_epoch(self):
        self.assertEqual(A.source_date_mdat({}), A.DEFAULT_SOURCE_DATE + A.HFS_EPOCH)
        self.assertEqual(A.source_date_mdat({"SOURCE_DATE_EPOCH": "1700000000"}), 1700000000 + A.HFS_EPOCH)
        with self.assertRaises(ValueError):
            A.source_date_mdat({"SOURCE_DATE_EPOCH": "4000000000"})

    def test_device_type_must_match_the_patcher(self):
        with self.assertRaises(ValueError):
            A.freeze("aaaa", "Dev", self.p, self.files)

    def test_unsupported_file_type_is_refused(self):
        with self.assertRaises(ValueError):
            A.freeze("mmmm", "Dev", patcher(box("js a.js")), {"a.js": b"", "b.exe": b""})


class DependencyTests(unittest.TestCase):
    def refs(self, *boxes, **kw):
        return A.referenced_files(patcher(*boxes), **kw)

    def test_object_references(self):
        self.assertEqual(self.refs(box("js a.js x y"), box("js b"), box("jsui c.js"), box("v8 d.js"), box("v8ui e.js")),
                         {"a.js", "b.js", "c.js", "d.js", "e.js"})
        self.assertEqual(self.refs(box("pfft~ ssd.spec 16384 4"), box("poly~ voice 4"), box("poly~ other.maxpat @parallel 1")),
                         {"ssd.spec.maxpat", "voice.maxpat", "other.maxpat"})

    def test_other_references(self):
        self.assertEqual(self.refs(box("", "bpatcher", name="ui.maxpat"), box("", "bpatcher"), box("", "jsui", filename="d.js")),
                         {"ui.maxpat", "d.js"})
        self.assertEqual(self.refs(box("mything 1 2"), box("other"), abstractions={"mything.maxpat"}), {"mything.maxpat"})

    def test_nothing_else_counts(self):
        self.assertEqual(self.refs(box("js"), box("js @embed 1"), box("coll"), box("buffer~ x"), box("js a.js", "comment"),
                                   box("pfft~ not a file", "message")), set())

    def test_sub_patchers_are_followed(self):
        self.assertEqual(self.refs(sub(sub(box("js deep.js")))), {"deep.js"})

    def check(self, p, files, **kw):
        A.check_dependencies(p, {n: EMPTY_PATCHER if n.endswith(".maxpat") else b"" for n in files}, **kw)

    def test_exact_match_passes(self):
        self.check(patcher(box("js a.js"), sub(box("pfft~ s 1024 4"))), ["a.js", "s.maxpat"])

    def test_missing_file_fails(self):
        with self.assertRaisesRegex(A.DependencyError, "not embedded: s.maxpat"):
            self.check(patcher(box("js a.js"), sub(box("pfft~ s 1024 4"))), ["a.js"])

    def test_wrong_name_fails_both_ways(self):
        with self.assertRaisesRegex(A.DependencyError, "not embedded: a.js.*referenced by no patcher: A.js"):
            self.check(patcher(box("js a.js")), ["A.js"])

    def test_extra_file_fails(self):
        with self.assertRaisesRegex(A.DependencyError, "referenced by no patcher: extra.js"):
            self.check(patcher(box("js a.js")), ["a.js", "extra.js"])

    def test_embedded_patchers_are_scanned(self):
        inner = json.dumps(patcher(box("js inner.js"))).encode()
        A.check_dependencies(patcher(box("poly~ voice")), {"voice.maxpat": inner, "inner.js": b""})
        with self.assertRaisesRegex(A.DependencyError, "not embedded: inner.js"):
            A.check_dependencies(patcher(box("poly~ voice")), {"voice.maxpat": inner})

    def test_unused_embedded_patcher_does_not_vouch_for_its_files(self):
        inner = json.dumps(patcher(box("js inner.js"))).encode()
        with self.assertRaisesRegex(A.DependencyError, "referenced by no patcher: inner.js, voice.maxpat"):
            A.check_dependencies(patcher(box("t b")), {"voice.maxpat": inner, "inner.js": b""})

    def test_abstraction_must_be_embedded(self):
        with self.assertRaisesRegex(A.DependencyError, "not embedded: mything.maxpat"):
            self.check(patcher(box("mything 1")), [], abstractions={"mything.maxpat"})


class BuildTests(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix="ssfrozen-")
        self.addCleanup(shutil.rmtree, self.dir, True)
        self.src, self.out = os.path.join(self.dir, "src"), os.path.join(self.dir, "out")
        os.makedirs(self.src)
        os.makedirs(self.out)
        with open(os.path.join(self.src, "Dev.maxpat"), "w") as f:
            json.dump(patcher(box("js dev.js"), box("pfft~ spec 1024 4")), f)
        for name, text in (("spec.maxpat", json.dumps(patcher(box("fftin~ 1")))), ("a.js", "var a;"), ("b.js", "var b;")):
            with open(os.path.join(self.src, name), "w") as f:
                f.write(text)
        self.dev = {"name": "Dev", "type": "mmmm", "patcher": os.path.join(self.src, "Dev.maxpat"), "src": self.src,
                    "js_name": "dev.js", "js_sources": ["a.js", "b.js"], "extra_files": [os.path.join(self.src, "spec.maxpat")]}

    def test_frozen_build_writes_one_file(self):
        path, info = B.build_device(self.dev, self.out)
        self.assertEqual(os.listdir(self.out), ["Dev.amxd"])
        self.assertTrue(info["frozen"])
        self.assertEqual(sorted(info["files"]), ["dev.js", "spec.maxpat"])
        self.assertIn(b"/* ---- a.js ---- */\nvar a;\n\n/* ---- b.js ---- */\nvar b;\n", info["files"]["dev.js"])

    def test_unfrozen_build_writes_loose_files_and_frozen_build_removes_them_again(self):
        B.build_device(self.dev, self.out, frozen=False)
        self.assertEqual(sorted(os.listdir(self.out)), ["Dev.amxd", "dev.js", "spec.maxpat"])
        B.build_device(self.dev, self.out)
        self.assertEqual(os.listdir(self.out), ["Dev.amxd"])

    def test_missing_dependency_fails_the_build(self):
        self.dev["extra_files"] = []
        for frozen in (True, False):
            with self.assertRaisesRegex(A.DependencyError, "not embedded: spec.maxpat"):
                B.build_device(self.dev, self.out, frozen=frozen)
        self.assertEqual(os.listdir(self.out), [])

    def test_extra_dependency_fails_the_build(self):
        self.dev["extra_files"].append(os.path.join(self.src, "b.js"))
        for frozen in (True, False):
            with self.assertRaisesRegex(A.DependencyError, "referenced by no patcher: b.js"):
                B.build_device(self.dev, self.out, frozen=frozen)
        self.assertEqual(os.listdir(self.out), [])

    def test_misnamed_script_fails_the_build(self):
        self.dev["js_name"] = "Dev.js"
        with self.assertRaisesRegex(A.DependencyError, "not embedded: dev.js.*referenced by no patcher: Dev.js"):
            B.build_device(self.dev, self.out)

    def test_abstraction_next_to_the_patcher_must_be_embedded(self):
        with open(self.dev["patcher"], "w") as f:
            json.dump(patcher(box("js dev.js"), box("pfft~ spec 1024 4"), box("helper 3")), f)
        with open(os.path.join(self.src, "helper.maxpat"), "w") as f:
            json.dump(patcher(box("t b")), f)
        with self.assertRaisesRegex(A.DependencyError, "not embedded: helper.maxpat"):
            B.build_device(self.dev, self.out)

    def test_the_real_devices_embed_exactly_their_references(self):
        for frozen in (True, False):
            out = os.path.join(self.dir, "real%d" % frozen)
            os.makedirs(out)
            with contextlib.redirect_stdout(io.StringIO()):
                self.assertEqual(B.main(["--out", out] + ([] if frozen else ["--unfrozen"])), 0)
            names = sorted(os.listdir(out))
            if frozen:
                self.assertEqual(names, ["Scale Snap Detect.amxd", "Scale Snap.amxd"])
            else:
                self.assertEqual(names, ["Scale Snap Detect.amxd", "Scale Snap.amxd", "scalesnap.js", "scalesnap_detect.js", "ssd.spec.maxpat"])

    def test_cli_exits_non_zero_when_a_dependency_is_missing(self):
        self.dev["extra_files"] = []
        saved = B.DEVICES
        B.DEVICES = [self.dev]
        self.addCleanup(setattr, B, "DEVICES", saved)
        with contextlib.redirect_stderr(io.StringIO()) as err:
            self.assertEqual(B.main(["--out", self.out]), 1)
        self.assertIn("not embedded: spec.maxpat", err.getvalue())

    def test_same_sources_give_identical_bytes(self):
        first = B.build_device(self.dev, self.out)[0]
        with open(first, "rb") as f:
            a = f.read()
        os.remove(first)
        B.build_device(self.dev, self.out)
        with open(first, "rb") as f:
            self.assertEqual(f.read(), a)


if __name__ == "__main__":
    unittest.main()
