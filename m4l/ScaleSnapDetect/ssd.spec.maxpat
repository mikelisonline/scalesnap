{
  "patcher": {
    "fileversion": 1,
    "appversion": {
      "major": 8,
      "minor": 2,
      "revision": 10,
      "architecture": "x64",
      "modernui": 1
    },
    "classnamespace": "box",
    "rect": [
      60.0,
      90.0,
      560.0,
      260.0
    ],
    "bglocked": 0,
    "openinpresentation": 0,
    "default_fontsize": 12.0,
    "default_fontface": 0,
    "default_fontname": "Arial",
    "gridonopen": 1,
    "gridsize": [
      15.0,
      15.0
    ],
    "gridsnaponopen": 1,
    "objectsnaponopen": 1,
    "statusbarvisible": 2,
    "toolbarvisible": 1,
    "lefttoolbarpinned": 0,
    "toptoolbarpinned": 0,
    "righttoolbarpinned": 0,
    "bottomtoolbarpinned": 0,
    "toolbars_unpinned_last_save": 0,
    "tallnewobj": 0,
    "boxanimatetime": 200,
    "enablehscroll": 1,
    "enablevscroll": 1,
    "devicewidth": 0.0,
    "description": "",
    "digest": "",
    "tags": "",
    "style": "",
    "subpatcher_template": "",
    "boxes": [
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 0,
          "numoutlets": 3,
          "outlettype": [
            "signal",
            "signal",
            "signal"
          ],
          "patching_rect": [
            30.0,
            30.0,
            110.0,
            22.0
          ],
          "text": "fftin~ 1 hanning",
          "id": "obj-1"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 2,
          "outlettype": [
            "signal",
            "signal"
          ],
          "patching_rect": [
            30.0,
            90.0,
            70.0,
            22.0
          ],
          "text": "cartopol~",
          "id": "obj-2"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 3,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            30.0,
            150.0,
            100.0,
            22.0
          ],
          "text": "poke~ ---spec",
          "id": "obj-3"
        }
      },
      {
        "box": {
          "maxclass": "comment",
          "numinlets": 1,
          "numoutlets": 0,
          "patching_rect": [
            170.0,
            30.0,
            360.0,
            20.0
          ],
          "text": "pfft~ frame -> magnitude of every bin into the device-local buffer~ ---spec. Read by scalesnap_detect.js (low priority).",
          "id": "obj-4"
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "destination": [
            "obj-2",
            0
          ],
          "source": [
            "obj-1",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-2",
            1
          ],
          "source": [
            "obj-1",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-3",
            0
          ],
          "source": [
            "obj-2",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-3",
            1
          ],
          "source": [
            "obj-1",
            2
          ]
        }
      }
    ]
  }
}
