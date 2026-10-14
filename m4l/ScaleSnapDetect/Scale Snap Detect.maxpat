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
      900.0,
      620.0
    ],
    "openinpresentation": 1,
    "default_fontsize": 10.0,
    "default_fontname": "Arial Bold",
    "gridsize": [
      8.0,
      8.0
    ],
    "statusbarvisible": 2,
    "toolbarvisible": 1,
    "lefttoolbarpinned": 0,
    "toptoolbarpinned": 0,
    "righttoolbarpinned": 0,
    "bottomtoolbarpinned": 0,
    "boxanimatetime": 500,
    "description": "",
    "digest": "",
    "tags": "",
    "style": "",
    "subpatcher_template": "",
    "boxes": [
      {
        "box": {
          "maxclass": "live.text",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": [
            "",
            ""
          ],
          "patching_rect": [
            560.0,
            20.0,
            52.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            6.0,
            52.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Listen",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Listen",
              "parameter_shortname": "Listen",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "Off",
                "On"
              ],
              "parameter_mmax": 1,
              "parameter_initial": [
                1
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "mode": 1,
          "text": "Listen",
          "texton": "Listen",
          "id": "obj-1"
        }
      },
      {
        "box": {
          "maxclass": "live.text",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": [
            "",
            ""
          ],
          "patching_rect": [
            560.0,
            44.0,
            44.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            62.0,
            6.0,
            44.0,
            18.0
          ],
          "varname": "RESET",
          "mode": 0,
          "text": "Reset",
          "id": "obj-2"
        }
      },
      {
        "box": {
          "maxclass": "live.text",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": [
            "",
            ""
          ],
          "patching_rect": [
            560.0,
            68.0,
            106.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            110.0,
            6.0,
            106.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Send to Scale Snap",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Send to Scale Snap",
              "parameter_shortname": "Send",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "Off",
                "On"
              ],
              "parameter_mmax": 1,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "mode": 1,
          "text": "Send to Scale Snap",
          "texton": "Send to Scale Snap",
          "id": "obj-3"
        }
      },
      {
        "box": {
          "maxclass": "multislider",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": [
            "",
            ""
          ],
          "patching_rect": [
            560.0,
            92.0,
            210.0,
            72.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            28.0,
            210.0,
            72.0
          ],
          "varname": "CHROMA",
          "size": 12,
          "setminmax": [
            0.0,
            1.0
          ],
          "setstyle": 1,
          "contdata": 1,
          "ignoreclick": 1,
          "bgcolor": [
            0.16,
            0.16,
            0.16,
            1.0
          ],
          "slidercolor": [
            1.0,
            0.6,
            0.0,
            1.0
          ],
          "id": "obj-4"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            116.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_0",
          "text": "C",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-5"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            140.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            23.5,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_1",
          "text": "C#",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-6"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            164.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            41.0,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_2",
          "text": "D",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-7"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            188.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            58.5,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_3",
          "text": "D#",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-8"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            212.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            76.0,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_4",
          "text": "E",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-9"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            236.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            93.5,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_5",
          "text": "F",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-10"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            260.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            111.0,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_6",
          "text": "F#",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-11"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            284.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            128.5,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_7",
          "text": "G",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-12"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            308.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            146.0,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_8",
          "text": "G#",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-13"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            332.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            163.5,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_9",
          "text": "A",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-14"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            356.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            181.0,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_10",
          "text": "A#",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-15"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            380.0,
            17.5,
            12.0
          ],
          "presentation": 1,
          "presentation_rect": [
            198.5,
            102.0,
            17.5,
            12.0
          ],
          "varname": "NOTE_11",
          "text": "B",
          "fontsize": 8.0,
          "textjustification": 1,
          "id": "obj-16"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            404.0,
            210.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            116.0,
            210.0,
            14.0
          ],
          "varname": "STATUS",
          "text": "Listening...",
          "fontsize": 9.0,
          "id": "obj-17"
        }
      },
      {
        "box": {
          "maxclass": "live.menu",
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": [
            "",
            "",
            "float"
          ],
          "patching_rect": [
            560.0,
            428.0,
            100.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            140.0,
            100.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Memory",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Memory",
              "parameter_shortname": "Memory",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "Short (8 s)",
                "Medium (20 s)",
                "Long (60 s)",
                "Hold"
              ],
              "parameter_mmax": 3,
              "parameter_initial": [
                1
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "id": "obj-18"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            452.0,
            34.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            110.0,
            142.0,
            34.0,
            14.0
          ],
          "varname": "GATE_LABEL",
          "text": "Gate",
          "fontsize": 9.0,
          "id": "obj-19"
        }
      },
      {
        "box": {
          "maxclass": "live.numbox",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": [
            "",
            "float"
          ],
          "patching_rect": [
            560.0,
            476.0,
            70.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            146.0,
            140.0,
            70.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Gate Threshold",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Gate Threshold",
              "parameter_shortname": "Gate",
              "parameter_modmode": 0,
              "parameter_type": 0,
              "parameter_mmin": -80.0,
              "parameter_mmax": -20.0,
              "parameter_initial": [
                -50.0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 4
            }
          },
          "fontsize": 9.0,
          "id": "obj-20"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            500.0,
            210.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            224.0,
            6.0,
            210.0,
            18.0
          ],
          "varname": "ROW1",
          "text": "",
          "fontsize": 11.0,
          "id": "obj-21"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            560.0,
            524.0,
            210.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            224.0,
            28.0,
            210.0,
            14.0
          ],
          "varname": "ROW2",
          "text": "",
          "fontsize": 9.0,
          "id": "obj-22"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            790.0,
            20.0,
            210.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            224.0,
            44.0,
            210.0,
            14.0
          ],
          "varname": "ROW3",
          "text": "",
          "fontsize": 9.0,
          "id": "obj-23"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            790.0,
            44.0,
            210.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            224.0,
            60.0,
            210.0,
            14.0
          ],
          "varname": "ROW4",
          "text": "",
          "fontsize": 9.0,
          "id": "obj-24"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            790.0,
            68.0,
            210.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            224.0,
            76.0,
            210.0,
            14.0
          ],
          "varname": "ROW5",
          "text": "",
          "fontsize": 9.0,
          "id": "obj-25"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            790.0,
            92.0,
            210.0,
            30.0
          ],
          "presentation": 1,
          "presentation_rect": [
            224.0,
            94.0,
            210.0,
            30.0
          ],
          "varname": "SAME",
          "text": "",
          "fontsize": 9.0,
          "id": "obj-26"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            790.0,
            116.0,
            210.0,
            34.0
          ],
          "presentation": 1,
          "presentation_rect": [
            224.0,
            128.0,
            210.0,
            34.0
          ],
          "varname": "INFO",
          "text": "Audio passes through unchanged. Turn on Send to Scale Snap, then press Apply in the Scale Snap device.",
          "fontsize": 9.0,
          "id": "obj-27"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 0,
          "numoutlets": 2,
          "outlettype": [
            "signal",
            "signal"
          ],
          "patching_rect": [
            20.0,
            20.0,
            60.0,
            22.0
          ],
          "text": "plugin~",
          "id": "obj-28"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            20.0,
            300.0,
            60.0,
            22.0
          ],
          "text": "plugout~",
          "id": "obj-29"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            "signal"
          ],
          "patching_rect": [
            140.0,
            80.0,
            60.0,
            22.0
          ],
          "text": "+~",
          "id": "obj-30"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            "signal"
          ],
          "patching_rect": [
            140.0,
            120.0,
            60.0,
            22.0
          ],
          "text": "*~ 0.5",
          "id": "obj-31"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            140.0,
            170.0,
            190.0,
            22.0
          ],
          "text": "pfft~ ssd.spec 16384 4",
          "id": "obj-32"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            "signal"
          ],
          "patching_rect": [
            360.0,
            120.0,
            60.0,
            22.0
          ],
          "text": "*~",
          "id": "obj-33"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            "signal"
          ],
          "patching_rect": [
            360.0,
            160.0,
            100.0,
            22.0
          ],
          "text": "average~ 16384",
          "id": "obj-34"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            "float"
          ],
          "patching_rect": [
            360.0,
            200.0,
            100.0,
            22.0
          ],
          "text": "snapshot~ 250",
          "id": "obj-35"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            360.0,
            240.0,
            100.0,
            22.0
          ],
          "text": "prepend level",
          "id": "obj-36"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            "signal"
          ],
          "patching_rect": [
            520.0,
            120.0,
            80.0,
            22.0
          ],
          "text": "sig~ 1000",
          "id": "obj-37"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            "signal"
          ],
          "patching_rect": [
            520.0,
            160.0,
            90.0,
            22.0
          ],
          "text": "mstosamps~",
          "id": "obj-38"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            "float"
          ],
          "patching_rect": [
            520.0,
            200.0,
            100.0,
            22.0
          ],
          "text": "snapshot~ 250",
          "id": "obj-39"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": [
            "float",
            "bang"
          ],
          "patching_rect": [
            140.0,
            220.0,
            110.0,
            22.0
          ],
          "text": "buffer~ ---spec",
          "id": "obj-40"
        }
      },
      {
        "box": {
          "maxclass": "message",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            140.0,
            260.0,
            100.0,
            22.0
          ],
          "text": "sizeinsamps 8192",
          "id": "obj-41"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 10,
          "outlettype": [
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            ""
          ],
          "patching_rect": [
            20.0,
            400.0,
            260.0,
            22.0
          ],
          "text": "js scalesnap_detect.js ---spec",
          "saved_object_attributes": {
            "filename": "scalesnap_detect.js",
            "parameter_enable": 0
          },
          "id": "obj-42"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            300.0,
            1392.0,
            60.0,
            22.0
          ],
          "text": "prepend listen",
          "id": "obj-43"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            300.0,
            1418.0,
            60.0,
            22.0
          ],
          "text": "prepend send",
          "id": "obj-44"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            300.0,
            1444.0,
            60.0,
            22.0
          ],
          "text": "prepend memory",
          "id": "obj-45"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            300.0,
            1470.0,
            60.0,
            22.0
          ],
          "text": "prepend gate",
          "id": "obj-46"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 2,
          "outlettype": [
            "bang",
            ""
          ],
          "patching_rect": [
            460.0,
            300.0,
            60.0,
            22.0
          ],
          "text": "sel 1",
          "id": "obj-47"
        }
      },
      {
        "box": {
          "maxclass": "message",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            520.0,
            300.0,
            60.0,
            22.0
          ],
          "text": "reset",
          "id": "obj-48"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 3,
          "outlettype": [
            "bang",
            "int",
            "int"
          ],
          "patching_rect": [
            20.0,
            340.0,
            60.0,
            22.0
          ],
          "text": "live.thisdevice",
          "id": "obj-49"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 5,
          "outlettype": [
            "bang",
            "bang",
            "bang",
            "bang",
            "bang"
          ],
          "patching_rect": [
            20.0,
            370.0,
            60.0,
            22.0
          ],
          "text": "t b b b b b",
          "id": "obj-50"
        }
      },
      {
        "box": {
          "maxclass": "message",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            20.0,
            440.0,
            60.0,
            22.0
          ],
          "text": "loaded",
          "id": "obj-51"
        }
      },
      {
        "box": {
          "maxclass": "message",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            480.0,
            340.0,
            60.0,
            22.0
          ],
          "text": "250",
          "id": "obj-52"
        }
      },
      {
        "box": {
          "maxclass": "message",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            540.0,
            340.0,
            60.0,
            22.0
          ],
          "text": "250",
          "id": "obj-53"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 4,
          "outlettype": [
            "int",
            "float",
            "int",
            "int"
          ],
          "patching_rect": [
            300.0,
            340.0,
            80.0,
            22.0
          ],
          "text": "dspstate~",
          "id": "obj-54"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            300.0,
            370.0,
            60.0,
            22.0
          ],
          "text": "prepend sr",
          "id": "obj-55"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            140.0,
            340.0,
            60.0,
            22.0
          ],
          "text": "prepend active",
          "id": "obj-56"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            "bang"
          ],
          "patching_rect": [
            20.0,
            440.0,
            60.0,
            22.0
          ],
          "text": "qmetro 250",
          "id": "obj-57"
        }
      },
      {
        "box": {
          "maxclass": "message",
          "numinlets": 2,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            20.0,
            470.0,
            60.0,
            22.0
          ],
          "text": "tick",
          "id": "obj-58"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            200.0,
            470.0,
            130.0,
            22.0
          ],
          "text": "s scalesnap.detect",
          "id": "obj-59"
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "destination": [
            "obj-29",
            0
          ],
          "source": [
            "obj-28",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-29",
            1
          ],
          "source": [
            "obj-28",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-30",
            0
          ],
          "source": [
            "obj-28",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-30",
            1
          ],
          "source": [
            "obj-28",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-31",
            0
          ],
          "source": [
            "obj-30",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-32",
            0
          ],
          "source": [
            "obj-31",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-33",
            0
          ],
          "source": [
            "obj-31",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-33",
            1
          ],
          "source": [
            "obj-31",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-34",
            0
          ],
          "source": [
            "obj-33",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-35",
            0
          ],
          "source": [
            "obj-34",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-36",
            0
          ],
          "source": [
            "obj-35",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-38",
            0
          ],
          "source": [
            "obj-37",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-39",
            0
          ],
          "source": [
            "obj-38",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-40",
            0
          ],
          "source": [
            "obj-41",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-36",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-43",
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
            "obj-42",
            0
          ],
          "source": [
            "obj-43",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-44",
            0
          ],
          "source": [
            "obj-3",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-44",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-45",
            0
          ],
          "source": [
            "obj-18",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-45",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-46",
            0
          ],
          "source": [
            "obj-20",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-46",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-47",
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
            "obj-48",
            0
          ],
          "source": [
            "obj-47",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-48",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-50",
            0
          ],
          "source": [
            "obj-49",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-41",
            0
          ],
          "source": [
            "obj-50",
            4
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-52",
            0
          ],
          "source": [
            "obj-50",
            3
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-35",
            0
          ],
          "source": [
            "obj-52",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-53",
            0
          ],
          "source": [
            "obj-50",
            2
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-39",
            0
          ],
          "source": [
            "obj-53",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-54",
            0
          ],
          "source": [
            "obj-50",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-51",
            0
          ],
          "source": [
            "obj-50",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-51",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-55",
            0
          ],
          "source": [
            "obj-54",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-55",
            0
          ],
          "source": [
            "obj-39",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-55",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-56",
            0
          ],
          "source": [
            "obj-49",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-56",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-57",
            0
          ],
          "source": [
            "obj-42",
            9
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-58",
            0
          ],
          "source": [
            "obj-57",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-42",
            0
          ],
          "source": [
            "obj-58",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-59",
            0
          ],
          "source": [
            "obj-42",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-4",
            0
          ],
          "source": [
            "obj-42",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-21",
            0
          ],
          "source": [
            "obj-42",
            2
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-22",
            0
          ],
          "source": [
            "obj-42",
            3
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-23",
            0
          ],
          "source": [
            "obj-42",
            4
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-24",
            0
          ],
          "source": [
            "obj-42",
            5
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-25",
            0
          ],
          "source": [
            "obj-42",
            6
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-26",
            0
          ],
          "source": [
            "obj-42",
            7
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-17",
            0
          ],
          "source": [
            "obj-42",
            8
          ]
        }
      }
    ],
    "openrect": [
      0.0,
      0.0,
      440.0,
      169.0
    ],
    "openrectmode": 0,
    "parameters": {
      "obj-1": [
        "Listen",
        "Listen",
        0
      ],
      "obj-3": [
        "Send to Scale Snap",
        "Send",
        0
      ],
      "obj-18": [
        "Memory",
        "Memory",
        0
      ],
      "obj-20": [
        "Gate Threshold",
        "Gate",
        0
      ]
    },
    "latency": 0,
    "is_mpe": 0,
    "external_mpe_tuning_enabled": 0,
    "minimum_live_version": "",
    "minimum_max_version": "",
    "platform_compatibility": 0,
    "project": {
      "version": 1,
      "creationdate": 3590052493,
      "modificationdate": 3590052493,
      "viewrect": [
        0.0,
        0.0,
        300.0,
        500.0
      ],
      "autoorganize": 1,
      "hideprojectwindow": 1,
      "showdependencies": 1,
      "autolocalize": 0,
      "contents": {
        "patchers": {}
      },
      "layout": {},
      "searchpath": {},
      "detailsvisible": 0,
      "amxdtype": 1633771873,
      "readonly": 0,
      "devpathtype": 0,
      "devpath": ".",
      "sortmode": 0,
      "viewmode": 0,
      "includepackages": 0
    },
    "autosave": 0
  }
}
