#!/usr/bin/env python3
"""Release helpers used by .github/workflows/build.yml (standard library only, so it runs on every runner).

    python3 scripts/release.py version                      # print the version from CMakeLists.txt
    python3 scripts/release.py check-version v1.0.0         # exit 1 unless the tag is exactly "v" + that version
    python3 scripts/release.py package-ableton OUT_DIR      # build OUT_DIR/ScaleSnap-Ableton.zip from m4l/dist
    python3 scripts/release.py notes v1.0.0 OUT_FILE        # render .github/release-notes.md for the tag
    python3 scripts/release.py verify-vst3 ZIP --macos|--windows
    python3 scripts/release.py verify-assets DIR            # the three release assets exist and look right
    python3 scripts/release.py is-latest v1.0.1 --tags $(git tag -l 'v*')   # print true/false: is it the highest vX.Y.Z tag?

The version lives in one place: project(ScaleSnap VERSION x.y.z) in CMakeLists.txt.
"""
import argparse
import os
import re
import sys
import zipfile

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
GITHUB_REPO = os.environ.get("GITHUB_REPOSITORY") or "mikelisonline/scalesnap"

ABLETON_ZIP = "ScaleSnap-Ableton.zip"
MAC_ZIP = "ScaleSnap-VST3-macOS.zip"
WIN_ZIP = "ScaleSnap-VST3-Windows.zip"
ASSETS = (ABLETON_ZIP, MAC_ZIP, WIN_ZIP)

FOLDER = "Scale Snap"
DEVICES = ("Scale Snap.amxd", "Scale Snap Detect.amxd")
INSTALL_TXT = "INSTALL.txt"
ABLETON_ENTRIES = [FOLDER + "/", FOLDER + "/Scale Snap.amxd", FOLDER + "/Scale Snap Detect.amxd", FOLDER + "/" + INSTALL_TXT]

ZIP_TIME = (2020, 1, 1, 0, 0, 0)  # fixed, so the same inputs give the same zip bytes


class ReleaseError(Exception):
    pass


def cmake_version(cmake_file=None):
    path = cmake_file or os.path.join(REPO_ROOT, "CMakeLists.txt")
    with open(path, encoding="utf-8") as f:
        text = f.read()
    m = re.search(r"^\s*project\s*\(\s*\w+\s+VERSION\s+(\d+\.\d+\.\d+)\b", text, re.MULTILINE | re.IGNORECASE)
    if not m:
        raise ReleaseError("no 'project(<name> VERSION x.y.z ...)' line found in " + path)
    return m.group(1)


def check_version(tag, version):
    """The tag must be exactly 'v' + the CMake version."""
    if tag != "v" + version:
        raise ReleaseError("tag '%s' does not match the CMake version %s (expected tag 'v%s'). "
                           "Bump project(... VERSION) in CMakeLists.txt, merge, then tag that commit."
                           % (tag, version, version))


SEMVER_TAG = re.compile(r"^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$")


def is_latest(tag, tags):
    """True when `tag` is the highest plain vX.Y.Z tag among `tags` (and `tag` itself).

    Anything that is not exactly vX.Y.Z (v1.2.3-rc1, v1.2, release-3, ...) is ignored when looking for the highest,
    and such a tag is never 'latest' itself. Used so that re-running an old release, or publishing a hotfix for an
    older line, does not steal GitHub's 'latest release' (and with it every releases/latest/download/... link).
    """
    def key(t):
        m = SEMVER_TAG.match(t)
        return tuple(int(g) for g in m.groups()) if m else None

    mine = key(tag)
    if mine is None:
        return False
    others = [k for k in (key(t) for t in tags) if k is not None]
    return mine >= max(others, default=mine)


def _read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def render(template, tag, version):
    out = template
    for key, value in (("{{TAG}}", tag), ("{{VERSION}}", version), ("{{REPO}}", GITHUB_REPO)):
        out = out.replace(key, value)
    left = re.findall(r"\{\{[A-Z_]+\}\}", out)
    if left:
        raise ReleaseError("unknown placeholder(s) in template: " + ", ".join(sorted(set(left))))
    return out


def package_ableton(out_dir, dist_dir=None, install_template=None, version=None):
    """ScaleSnap-Ableton.zip = 'Scale Snap/' with both devices and a plain-text INSTALL.txt."""
    dist_dir = dist_dir or os.path.join(REPO_ROOT, "m4l", "dist")
    install_template = install_template or os.path.join(REPO_ROOT, "m4l", "INSTALL.txt")
    version = version or cmake_version()
    for name in DEVICES:
        if not os.path.isfile(os.path.join(dist_dir, name)):
            raise ReleaseError("missing %s in %s (run python3 m4l/tools/build_amxd.py first)" % (name, dist_dir))
    install = render(_read(install_template), "v" + version, version).replace("\r\n", "\n")
    os.makedirs(out_dir, exist_ok=True)
    target = os.path.join(out_dir, ABLETON_ZIP)

    def info(name, mode):
        zi = zipfile.ZipInfo(name, ZIP_TIME)
        zi.external_attr = mode << 16
        zi.create_system = 3  # Unix, so the permission bits are honoured
        zi.compress_type = zipfile.ZIP_DEFLATED
        return zi

    with zipfile.ZipFile(target, "w") as z:
        z.writestr(info(FOLDER + "/", 0o40755), b"")
        for name in DEVICES:
            with open(os.path.join(dist_dir, name), "rb") as f:
                z.writestr(info(FOLDER + "/" + name, 0o100644), f.read())
        z.writestr(info(FOLDER + "/" + INSTALL_TXT, 0o100644), install.encode("utf-8"))
    return target


def verify_ableton(path):
    with zipfile.ZipFile(path) as z:
        names = z.namelist()
        if z.testzip() is not None:
            raise ReleaseError(path + ": corrupt zip")
        if sorted(names) != sorted(ABLETON_ENTRIES):
            raise ReleaseError("%s: unexpected layout %r, expected %r" % (path, names, ABLETON_ENTRIES))
        for dev in DEVICES:
            if z.getinfo(FOLDER + "/" + dev).file_size < 1000:
                raise ReleaseError("%s: %s is suspiciously small" % (path, dev))
        text = z.read(FOLDER + "/" + INSTALL_TXT).decode("utf-8")
        if "{{" in text or not text.strip():
            raise ReleaseError(path + ": INSTALL.txt is empty or has unrendered placeholders")


def verify_vst3(path, platform):
    """The VST3 bundle must be the single top-level folder; on macOS the binary must keep its executable bit."""
    with zipfile.ZipFile(path) as z:
        if z.testzip() is not None:
            raise ReleaseError(path + ": corrupt zip")
        infos = [(i.filename.replace("\\", "/"), i) for i in z.infolist()]
    names = [n for n, _ in infos]
    tops = {n.split("/")[0] for n in names if n and not n.startswith("__MACOSX")}
    if tops != {"Scale Snap.vst3"}:
        raise ReleaseError("%s: expected one top-level 'Scale Snap.vst3', found %s" % (path, sorted(tops)))
    if platform == "macos":
        binary = [i for n, i in infos if n == "Scale Snap.vst3/Contents/MacOS/Scale Snap"]
        if not binary:
            raise ReleaseError(path + ": Contents/MacOS/Scale Snap is missing")
        if not (binary[0].external_attr >> 16) & 0o111:
            raise ReleaseError(path + ": the plugin binary lost its executable bit")
    else:
        if not any(n.startswith("Scale Snap.vst3/Contents/") and n.endswith(".vst3") and not n.endswith("/") for n in names):
            raise ReleaseError(path + ": no Windows binary under Contents/")


def verify_assets(directory):
    for name in ASSETS:
        if not os.path.isfile(os.path.join(directory, name)):
            raise ReleaseError("release asset missing: " + name)
    verify_ableton(os.path.join(directory, ABLETON_ZIP))
    verify_vst3(os.path.join(directory, MAC_ZIP), "macos")
    verify_vst3(os.path.join(directory, WIN_ZIP), "windows")


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("version")
    p = sub.add_parser("check-version")
    p.add_argument("tag")
    p = sub.add_parser("package-ableton")
    p.add_argument("out_dir")
    p = sub.add_parser("notes")
    p.add_argument("tag")
    p.add_argument("out_file")
    p = sub.add_parser("verify-vst3")
    p.add_argument("zip")
    g = p.add_mutually_exclusive_group(required=True)
    g.add_argument("--macos", dest="platform", action="store_const", const="macos")
    g.add_argument("--windows", dest="platform", action="store_const", const="windows")
    p = sub.add_parser("verify-assets")
    p.add_argument("directory")
    p = sub.add_parser("is-latest")
    p.add_argument("tag")
    p.add_argument("--tags", nargs="*", default=[], help="all existing tags (whitespace or newline separated is fine)")
    args = ap.parse_args(argv)

    try:
        if args.cmd == "version":
            print(cmake_version())
        elif args.cmd == "check-version":
            version = cmake_version()
            check_version(args.tag, version)
            print("ok: %s matches CMake version %s" % (args.tag, version))
        elif args.cmd == "package-ableton":
            target = package_ableton(args.out_dir)
            verify_ableton(target)
            print("wrote " + target)
        elif args.cmd == "notes":
            version = cmake_version()
            check_version(args.tag, version)
            text = render(_read(os.path.join(REPO_ROOT, ".github", "release-notes.md")), args.tag, version)
            with open(args.out_file, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
            print("wrote " + args.out_file)
        elif args.cmd == "verify-vst3":
            verify_vst3(args.zip, args.platform)
            print("ok: " + args.zip)
        elif args.cmd == "verify-assets":
            verify_assets(args.directory)
            print("ok: all release assets present and well formed")
        elif args.cmd == "is-latest":
            print("true" if is_latest(args.tag, [t for a in args.tags for t in a.split()]) else "false")
    except (ReleaseError, OSError, zipfile.BadZipFile) as e:
        print("error: %s" % e, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
