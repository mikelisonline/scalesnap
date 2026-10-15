"""Tests for scripts/release.py:  python3 -m unittest discover -s scripts -v"""
import os
import re
import subprocess
import sys
import tempfile
import unittest
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import release  # noqa: E402

SCRIPT = os.path.join(HERE, "release.py")
ROOT = release.REPO_ROOT


def run(*args):
    return subprocess.run([sys.executable, SCRIPT, *args], capture_output=True, text=True)


def make_zip(path, entries):
    """entries: {name: (bytes, mode)}"""
    with zipfile.ZipFile(path, "w") as z:
        for name, (data, mode) in entries.items():
            zi = zipfile.ZipInfo(name, release.ZIP_TIME)
            zi.create_system = 3
            zi.external_attr = mode << 16
            z.writestr(zi, data)


class VersionGuard(unittest.TestCase):
    def test_reads_version_from_cmake(self):
        with tempfile.TemporaryDirectory() as d:
            f = os.path.join(d, "CMakeLists.txt")
            with open(f, "w") as fh:
                fh.write("cmake_minimum_required(VERSION 3.22)\nproject(ScaleSnap VERSION 2.3.4 LANGUAGES C CXX)\n")
            self.assertEqual(release.cmake_version(f), "2.3.4")  # not the cmake_minimum_required version

    def test_repo_has_a_version(self):
        self.assertRegex(release.cmake_version(), r"^\d+\.\d+\.\d+$")

    def test_missing_version_is_an_error(self):
        with tempfile.TemporaryDirectory() as d:
            f = os.path.join(d, "CMakeLists.txt")
            with open(f, "w") as fh:
                fh.write("project(ScaleSnap LANGUAGES CXX)\n")
            with self.assertRaises(release.ReleaseError):
                release.cmake_version(f)

    def test_matching_tag_passes(self):
        release.check_version("v1.0.0", "1.0.0")

    def test_mismatches_fail(self):
        for tag in ("v1.0.1", "v0.1.0", "1.0.0", "v1.0", "v1.0.0-rc1", "v1.0.00", "V1.0.0", "", "v"):
            with self.subTest(tag=tag), self.assertRaises(release.ReleaseError):
                release.check_version(tag, "1.0.0")

    def test_cli_exit_codes(self):
        version = release.cmake_version()
        ok = run("check-version", "v" + version)
        self.assertEqual(ok.returncode, 0, ok.stderr)
        bad = run("check-version", "v" + version + ".1")
        self.assertEqual(bad.returncode, 1)
        self.assertIn("does not match the CMake version", bad.stderr)


class AbletonZip(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dist = os.path.join(self.tmp.name, "dist")
        os.mkdir(self.dist)
        for name in release.DEVICES:
            with open(os.path.join(self.dist, name), "wb") as f:
                f.write(b"ampf" + name.encode() * 200)

    def tearDown(self):
        self.tmp.cleanup()

    def build(self, out="out"):
        return release.package_ableton(os.path.join(self.tmp.name, out), self.dist,
                                       os.path.join(ROOT, "m4l", "INSTALL.txt"), "1.2.3")

    def test_layout(self):
        path = self.build()
        self.assertEqual(os.path.basename(path), "ScaleSnap-Ableton.zip")
        with zipfile.ZipFile(path) as z:
            self.assertEqual(z.namelist(), ["Scale Snap/", "Scale Snap/Scale Snap.amxd",
                                            "Scale Snap/Scale Snap Detect.amxd", "Scale Snap/INSTALL.txt"])
            txt = z.read("Scale Snap/INSTALL.txt").decode()
            self.assertIn("SCALE SNAP 1.2.3", txt)
            self.assertNotIn("{{", txt)
            self.assertNotIn("\r", txt)
        release.verify_ableton(path)

    def test_reproducible(self):
        with open(self.build("a"), "rb") as a, open(self.build("b"), "rb") as b:
            self.assertEqual(a.read(), b.read())

    def test_missing_device_fails(self):
        os.remove(os.path.join(self.dist, "Scale Snap Detect.amxd"))
        with self.assertRaises(release.ReleaseError):
            self.build()

    def test_verify_rejects_wrong_layout(self):
        bad = os.path.join(self.tmp.name, "bad.zip")
        make_zip(bad, {"Scale Snap.amxd": (b"x" * 5000, 0o644)})
        with self.assertRaises(release.ReleaseError):
            release.verify_ableton(bad)

    def test_install_notes_stay_consistent(self):
        """INSTALL.txt (shipped in the zip), m4l/INSTALL.md and README.md tell the same story."""
        def read(*p):
            with open(os.path.join(ROOT, *p), encoding="utf-8") as f:
                return f.read()
        txt, md, readme = read("m4l", "INSTALL.txt"), read("m4l", "INSTALL.md"), read("README.md")
        for needle in ("Scale Snap.amxd", "Scale Snap Detect.amxd", "User Library", "~/Music/Ableton/User Library"):
            self.assertIn(needle, txt)
            self.assertIn(needle, md)
            self.assertIn(needle, readme)
        url = "https://github.com/mikelisonline/scalesnap/releases/latest/download/ScaleSnap-Ableton.zip"
        self.assertIn(url, md)
        self.assertIn(url, readme)


class ReleaseNotes(unittest.TestCase):
    def test_render_fills_placeholders(self):
        out = release.render("{{TAG}} {{VERSION}} {{REPO}}", "v1.0.0", "1.0.0")
        self.assertEqual(out, "v1.0.0 1.0.0 " + release.GITHUB_REPO)

    def test_unknown_placeholder_fails(self):
        with self.assertRaises(release.ReleaseError):
            release.render("{{NOPE}}", "v1.0.0", "1.0.0")

    def test_real_template_renders_and_links_every_asset(self):
        with open(os.path.join(ROOT, ".github", "release-notes.md"), encoding="utf-8") as f:
            text = release.render(f.read(), "v1.0.0", "1.0.0")
        for asset in release.ASSETS:
            self.assertIn("/releases/download/v1.0.0/" + asset, text)
        self.assertIn("/releases/latest/download/ScaleSnap-Ableton.zip", text)
        self.assertIsNone(re.search(r"\{\{|\}\}", text))

    def test_notes_cli_refuses_a_wrong_tag(self):
        with tempfile.TemporaryDirectory() as d:
            out = os.path.join(d, "notes.md")
            self.assertEqual(run("notes", "v9.9.9", out).returncode, 1)
            self.assertFalse(os.path.exists(out))
            self.assertEqual(run("notes", "v" + release.cmake_version(), out).returncode, 0)
            self.assertTrue(os.path.exists(out))


class Vst3Zips(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmp.cleanup()

    def mac(self, mode):
        p = os.path.join(self.tmp.name, "mac.zip")
        make_zip(p, {"Scale Snap.vst3/": (b"", 0o40755),
                     "Scale Snap.vst3/Contents/MacOS/Scale Snap": (b"bin", mode),
                     "Scale Snap.vst3/Contents/Info.plist": (b"x", 0o644)})
        return p

    def test_mac_keeps_exec_bit(self):
        release.verify_vst3(self.mac(0o100755), "macos")
        with self.assertRaises(release.ReleaseError):
            release.verify_vst3(self.mac(0o100644), "macos")

    def test_windows_zip(self):
        p = os.path.join(self.tmp.name, "win.zip")
        make_zip(p, {"Scale Snap.vst3\\Contents\\x86_64-win\\Scale Snap.vst3": (b"MZ", 0o644)})
        release.verify_vst3(p, "windows")  # backslash separators (old Compress-Archive) are tolerated
        make_zip(p, {"Other/Scale Snap.vst3": (b"MZ", 0o644)})
        with self.assertRaises(release.ReleaseError):
            release.verify_vst3(p, "windows")

    def test_verify_assets_needs_all_three(self):
        with self.assertRaises(release.ReleaseError):
            release.verify_assets(self.tmp.name)


if __name__ == "__main__":
    unittest.main()
