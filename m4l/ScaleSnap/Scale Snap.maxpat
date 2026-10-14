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
      760.0,
      560.0
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
            620.0,
            44.0,
            40.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            6.0,
            40.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Power",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Power",
              "parameter_shortname": "Power",
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
          "text": "Snap",
          "texton": "Snap",
          "id": "obj-1"
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
            620.0,
            68.0,
            46.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            50.0,
            6.0,
            46.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Key",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Key",
              "parameter_shortname": "Key",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
                "A#",
                "B"
              ],
              "parameter_mmax": 11,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "id": "obj-2"
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
            620.0,
            92.0,
            122.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            100.0,
            6.0,
            122.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Category",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Category",
              "parameter_shortname": "Category",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "All Scales",
                "Favorites",
                "Major & Modes",
                "Minor",
                "Pentatonic",
                "Blues & Jazz",
                "Symmetric",
                "Japanese",
                "Chinese",
                "Indian (Hindustani)",
                "Indian (Carnatic)",
                "Arabic & Turkish",
                "Persian",
                "Jewish & Klezmer",
                "Eastern European",
                "Spanish & Flamenco",
                "African",
                "Indonesian & SE Asian",
                "Other & Exotic"
              ],
              "parameter_mmax": 18,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "id": "obj-3"
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
            620.0,
            116.0,
            18.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            28.0,
            18.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Previous Scale",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Previous Scale",
              "parameter_shortname": "Prev",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "off",
                "on"
              ],
              "parameter_mmax": 1,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "mode": 0,
          "text": "<",
          "id": "obj-4"
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
            620.0,
            140.0,
            138.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            26.0,
            28.0,
            138.0,
            18.0
          ],
          "varname": "SCALE",
          "id": "obj-5"
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
            620.0,
            164.0,
            18.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            166.0,
            28.0,
            18.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Next Scale",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Next Scale",
              "parameter_shortname": "Next",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "off",
                "on"
              ],
              "parameter_mmax": 1,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "mode": 0,
          "text": ">",
          "id": "obj-6"
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
            620.0,
            188.0,
            34.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            188.0,
            28.0,
            34.0,
            18.0
          ],
          "varname": "FAV",
          "mode": 1,
          "text": "Fav",
          "texton": "Fav",
          "id": "obj-7"
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
            620.0,
            212.0,
            130.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            50.0,
            130.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Correction",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Correction",
              "parameter_shortname": "Correct",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "Nearest (tie down)",
                "Nearest (tie up)",
                "Always up",
                "Always down",
                "Block"
              ],
              "parameter_mmax": 4,
              "parameter_initial": [
                0
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "id": "obj-8"
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
            620.0,
            236.0,
            82.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            140.0,
            50.0,
            82.0,
            18.0
          ],
          "varname": "SNAPCLIP",
          "mode": 0,
          "text": "Snap Clip",
          "id": "obj-9"
        }
      },
      {
        "box": {
          "maxclass": "kslider",
          "numinlets": 2,
          "numoutlets": 2,
          "outlettype": [
            "int",
            "int"
          ],
          "patching_rect": [
            620.0,
            260.0,
            216.0,
            40.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            72.0,
            216.0,
            40.0
          ],
          "varname": "KB",
          "range": 36,
          "offset": 48,
          "mode": 1,
          "ignoreclick": 1,
          "blackkeycolor": [
            0.22,
            0.22,
            0.22,
            1.0
          ],
          "whitekeycolor": [
            0.78,
            0.78,
            0.78,
            1.0
          ],
          "hkeycolor": [
            1.0,
            0.6,
            0.0,
            1.0
          ],
          "selectioncolor": [
            1.0,
            0.6,
            0.0,
            1.0
          ],
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
            620.0,
            284.0,
            216.0,
            48.0
          ],
          "presentation": 1,
          "presentation_rect": [
            6.0,
            116.0,
            216.0,
            48.0
          ],
          "varname": "INFO",
          "text": "",
          "fontsize": 9.0,
          "textjustification": 0,
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
            620.0,
            308.0,
            60.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            232.0,
            4.0,
            60.0,
            14.0
          ],
          "varname": "DET_LABEL",
          "text": "DETECT",
          "fontsize": 9.0,
          "id": "obj-12"
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
            620.0,
            332.0,
            60.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            232.0,
            22.0,
            60.0,
            18.0
          ],
          "varname": "LISTEN",
          "mode": 1,
          "text": "Listen",
          "texton": "Listen",
          "id": "obj-13"
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
            620.0,
            356.0,
            44.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            296.0,
            22.0,
            44.0,
            18.0
          ],
          "varname": "RESET",
          "mode": 0,
          "text": "Reset",
          "id": "obj-14"
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
            620.0,
            380.0,
            90.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            344.0,
            22.0,
            90.0,
            18.0
          ],
          "varname": "ANALYZE",
          "mode": 0,
          "text": "Analyze Clip",
          "id": "obj-15"
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
            620.0,
            404.0,
            108.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            232.0,
            44.0,
            108.0,
            18.0
          ],
          "parameter_enable": 1,
          "varname": "Detect Memory",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Detect Memory",
              "parameter_shortname": "Memory",
              "parameter_modmode": 0,
              "parameter_type": 2,
              "parameter_enum": [
                "Short (10 s)",
                "Medium (30 s)",
                "Hold"
              ],
              "parameter_mmax": 2,
              "parameter_initial": [
                1
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0
            }
          },
          "id": "obj-16"
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
            620.0,
            428.0,
            90.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            344.0,
            44.0,
            90.0,
            18.0
          ],
          "varname": "APPLY",
          "mode": 0,
          "text": "Apply",
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
            620.0,
            452.0,
            202.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            232.0,
            66.0,
            202.0,
            18.0
          ],
          "varname": "RESULTS",
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
            620.0,
            476.0,
            202.0,
            24.0
          ],
          "presentation": 1,
          "presentation_rect": [
            232.0,
            88.0,
            202.0,
            24.0
          ],
          "varname": "SAME",
          "text": "",
          "fontsize": 9.0,
          "textjustification": 0,
          "id": "obj-19"
        }
      },
      {
        "box": {
          "maxclass": "live.comment",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            620.0,
            500.0,
            202.0,
            14.0
          ],
          "presentation": 1,
          "presentation_rect": [
            232.0,
            114.0,
            202.0,
            14.0
          ],
          "varname": "STATUS",
          "text": "",
          "fontsize": 9.0,
          "textjustification": 0,
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
            620.0,
            524.0,
            148.0,
            30.0
          ],
          "presentation": 1,
          "presentation_rect": [
            232.0,
            134.0,
            148.0,
            30.0
          ],
          "varname": "AUDIO",
          "text": "",
          "fontsize": 9.0,
          "textjustification": 0,
          "id": "obj-21"
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
            620.0,
            548.0,
            48.0,
            18.0
          ],
          "presentation": 1,
          "presentation_rect": [
            386.0,
            140.0,
            48.0,
            18.0
          ],
          "varname": "AUDIOAPPLY",
          "mode": 0,
          "text": "Apply",
          "id": "obj-22"
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
            620.0,
            572.0,
            60.0,
            15.0
          ],
          "presentation": 0,
          "parameter_enable": 1,
          "varname": "Scale ID",
          "saved_attribute_attributes": {
            "valueof": {
              "parameter_longname": "Scale ID",
              "parameter_shortname": "Scale ID",
              "parameter_modmode": 0,
              "parameter_type": 1,
              "parameter_mmin": 0,
              "parameter_mmax": 16777215,
              "parameter_initial": [
                4114085
              ],
              "parameter_initial_enable": 1,
              "parameter_unitstyle": 0,
              "parameter_invisible": 1
            }
          },
          "id": "obj-23"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            "int"
          ],
          "patching_rect": [
            20.0,
            20.0,
            60.0,
            22.0
          ],
          "text": "midiin",
          "id": "obj-24"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 7,
          "outlettype": [
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
            60.0,
            60.0,
            22.0
          ],
          "text": "midiparse",
          "id": "obj-25"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 2,
          "outlettype": [
            "list",
            "list"
          ],
          "patching_rect": [
            20.0,
            100.0,
            60.0,
            22.0
          ],
          "text": "t l l",
          "id": "obj-26"
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
            120.0,
            140.0,
            60.0,
            22.0
          ],
          "text": "prepend note",
          "id": "obj-27"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 4,
          "numoutlets": 2,
          "outlettype": [
            "",
            ""
          ],
          "patching_rect": [
            20.0,
            180.0,
            330.0,
            22.0
          ],
          "text": "p snapcore",
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
              40.0,
              60.0,
              900.0,
              700.0
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
                  "maxclass": "inlet",
                  "numinlets": 0,
                  "numoutlets": 1,
                  "outlettype": [
                    ""
                  ],
                  "index": 1,
                  "comment": "note list: pitch velocity",
                  "patching_rect": [
                    20.0,
                    20.0,
                    30.0,
                    30.0
                  ],
                  "id": "obj-1"
                }
              },
              {
                "box": {
                  "maxclass": "inlet",
                  "numinlets": 0,
                  "numoutlets": 1,
                  "outlettype": [
                    ""
                  ],
                  "index": 2,
                  "comment": "poly pressure list: pitch pressure",
                  "patching_rect": [
                    170.0,
                    20.0,
                    30.0,
                    30.0
                  ],
                  "id": "obj-2"
                }
              },
              {
                "box": {
                  "maxclass": "inlet",
                  "numinlets": 0,
                  "numoutlets": 1,
                  "outlettype": [
                    ""
                  ],
                  "index": 3,
                  "comment": "snap table write: index value (output note + 1, 0 = blocked)",
                  "patching_rect": [
                    320.0,
                    20.0,
                    30.0,
                    30.0
                  ],
                  "id": "obj-3"
                }
              },
              {
                "box": {
                  "maxclass": "inlet",
                  "numinlets": 0,
                  "numoutlets": 1,
                  "outlettype": [
                    ""
                  ],
                  "index": 4,
                  "comment": "bang: release every sounding note and clear state",
                  "patching_rect": [
                    470.0,
                    20.0,
                    30.0,
                    30.0
                  ],
                  "id": "obj-4"
                }
              },
              {
                "box": {
                  "maxclass": "outlet",
                  "numinlets": 1,
                  "numoutlets": 0,
                  "index": 1,
                  "comment": "note list: pitch velocity (velocity 0 = note-off)",
                  "patching_rect": [
                    20.0,
                    32480.0,
                    30.0,
                    30.0
                  ],
                  "id": "obj-5"
                }
              },
              {
                "box": {
                  "maxclass": "outlet",
                  "numinlets": 1,
                  "numoutlets": 0,
                  "index": 2,
                  "comment": "poly pressure list: pitch pressure",
                  "patching_rect": [
                    20.0,
                    1100.0,
                    30.0,
                    30.0
                  ],
                  "id": "obj-6"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 4,
                  "outlettype": [
                    "",
                    "",
                    "",
                    ""
                  ],
                  "patching_rect": [
                    20.0,
                    500.0,
                    60.0,
                    22.0
                  ],
                  "text": "coll",
                  "id": "obj-7"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 4,
                  "outlettype": [
                    "",
                    "",
                    "",
                    ""
                  ],
                  "patching_rect": [
                    20.0,
                    860.0,
                    60.0,
                    22.0
                  ],
                  "text": "coll",
                  "id": "obj-8"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 4,
                  "outlettype": [
                    "",
                    "",
                    "",
                    ""
                  ],
                  "patching_rect": [
                    170.0,
                    860.0,
                    60.0,
                    22.0
                  ],
                  "text": "coll",
                  "id": "obj-9"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 4,
                  "outlettype": [
                    "",
                    "",
                    "",
                    ""
                  ],
                  "patching_rect": [
                    170.0,
                    32480.0,
                    60.0,
                    22.0
                  ],
                  "text": "coll",
                  "id": "obj-10"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 3,
                  "outlettype": [
                    "",
                    "",
                    ""
                  ],
                  "patching_rect": [
                    20.0,
                    32120.0,
                    60.0,
                    22.0
                  ],
                  "text": "gate 3",
                  "id": "obj-11"
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
                    1160.0,
                    60.0,
                    22.0
                  ],
                  "text": "1",
                  "id": "obj-12"
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
                    320.0,
                    860.0,
                    60.0,
                    22.0
                  ],
                  "text": "2",
                  "id": "obj-13"
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
                    320.0,
                    60.0,
                    22.0
                  ],
                  "text": "3",
                  "id": "obj-14"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "",
                    ""
                  ],
                  "patching_rect": [
                    20.0,
                    80.0,
                    60.0,
                    22.0
                  ],
                  "text": "unpack 0 0",
                  "id": "obj-15"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    140.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i",
                  "id": "obj-16"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    32300.0,
                    60.0,
                    22.0
                  ],
                  "text": "int",
                  "id": "obj-17"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    200.0,
                    60.0,
                    22.0
                  ],
                  "text": "> 0",
                  "id": "obj-18"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    260.0,
                    60.0,
                    22.0
                  ],
                  "text": "+ 1",
                  "id": "obj-19"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 2,
                  "outlettype": [
                    "",
                    ""
                  ],
                  "patching_rect": [
                    170.0,
                    320.0,
                    60.0,
                    22.0
                  ],
                  "text": "gate 2",
                  "id": "obj-20"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    440.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i",
                  "id": "obj-21"
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
                    170.0,
                    500.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-22"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "list",
                    "list"
                  ],
                  "patching_rect": [
                    20.0,
                    560.0,
                    60.0,
                    22.0
                  ],
                  "text": "t l l",
                  "id": "obj-23"
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
                    20.0,
                    920.0,
                    60.0,
                    22.0
                  ],
                  "text": "sel 0",
                  "id": "obj-24"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    980.0,
                    60.0,
                    22.0
                  ],
                  "text": "- 1",
                  "id": "obj-25"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 3,
                  "outlettype": [
                    "int",
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    1040.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i i",
                  "id": "obj-26"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    32240.0,
                    60.0,
                    22.0
                  ],
                  "text": "int",
                  "id": "obj-27"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    32300.0,
                    60.0,
                    22.0
                  ],
                  "text": "int",
                  "id": "obj-28"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "bang"
                  ],
                  "patching_rect": [
                    170.0,
                    1100.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i b",
                  "id": "obj-29"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 3,
                  "outlettype": [
                    "bang",
                    "bang",
                    ""
                  ],
                  "patching_rect": [
                    20.0,
                    32180.0,
                    60.0,
                    22.0
                  ],
                  "text": "sel 0 1",
                  "id": "obj-30"
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
                    320.0,
                    32300.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-31"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "list",
                    "list"
                  ],
                  "patching_rect": [
                    20.0,
                    32360.0,
                    60.0,
                    22.0
                  ],
                  "text": "t l l",
                  "id": "obj-32"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "bang",
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    32240.0,
                    60.0,
                    22.0
                  ],
                  "text": "t b i",
                  "id": "obj-33"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    470.0,
                    32300.0,
                    60.0,
                    22.0
                  ],
                  "text": "- 1",
                  "id": "obj-34"
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
                    170.0,
                    32360.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-35"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    380.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i",
                  "id": "obj-36"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    440.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i",
                  "id": "obj-37"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    680.0,
                    60.0,
                    22.0
                  ],
                  "text": "int",
                  "id": "obj-38"
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
                    170.0,
                    560.0,
                    60.0,
                    22.0
                  ],
                  "text": "sel 0",
                  "id": "obj-39"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 3,
                  "outlettype": [
                    "int",
                    "bang",
                    "int"
                  ],
                  "patching_rect": [
                    20.0,
                    620.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i b i",
                  "id": "obj-40"
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
                    20.0,
                    740.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-41"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "list",
                    "list"
                  ],
                  "patching_rect": [
                    20.0,
                    800.0,
                    60.0,
                    22.0
                  ],
                  "text": "t l l",
                  "id": "obj-42"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    680.0,
                    60.0,
                    22.0
                  ],
                  "text": "- 1",
                  "id": "obj-43"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 3,
                  "outlettype": [
                    "int",
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    740.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i i",
                  "id": "obj-44"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    320.0,
                    32360.0,
                    60.0,
                    22.0
                  ],
                  "text": "int",
                  "id": "obj-45"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    620.0,
                    32300.0,
                    60.0,
                    22.0
                  ],
                  "text": "int",
                  "id": "obj-46"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "bang"
                  ],
                  "patching_rect": [
                    170.0,
                    800.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i b",
                  "id": "obj-47"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 3,
                  "outlettype": [
                    "int",
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    32180.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i i",
                  "id": "obj-48"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    320.0,
                    32240.0,
                    60.0,
                    22.0
                  ],
                  "text": "+ 1",
                  "id": "obj-49"
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
                    20.0,
                    32420.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-50"
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
                    470.0,
                    32240.0,
                    60.0,
                    22.0
                  ],
                  "text": "sel 0",
                  "id": "obj-51"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 1,
                  "outlettype": [
                    "bang"
                  ],
                  "patching_rect": [
                    770.0,
                    32300.0,
                    60.0,
                    22.0
                  ],
                  "text": "t b",
                  "id": "obj-52"
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
                    170.0,
                    32420.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-53"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "bang",
                    "bang"
                  ],
                  "patching_rect": [
                    620.0,
                    32240.0,
                    60.0,
                    22.0
                  ],
                  "text": "t b b",
                  "id": "obj-54"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    470.0,
                    32360.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i",
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
                    320.0,
                    32420.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-56"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "",
                    ""
                  ],
                  "patching_rect": [
                    170.0,
                    80.0,
                    60.0,
                    22.0
                  ],
                  "text": "unpack 0 0",
                  "id": "obj-57"
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
                    170.0,
                    1040.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-58"
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
                    170.0,
                    920.0,
                    60.0,
                    22.0
                  ],
                  "text": "sel 0",
                  "id": "obj-59"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    980.0,
                    60.0,
                    22.0
                  ],
                  "text": "- 1",
                  "id": "obj-60"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 3,
                  "outlettype": [
                    "bang",
                    "bang",
                    "int"
                  ],
                  "patching_rect": [
                    320.0,
                    80.0,
                    60.0,
                    22.0
                  ],
                  "text": "uzi 128",
                  "id": "obj-61"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    140.0,
                    60.0,
                    22.0
                  ],
                  "text": "- 1",
                  "id": "obj-62"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 3,
                  "outlettype": [
                    "int",
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    170.0,
                    200.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i i",
                  "id": "obj-63"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    920.0,
                    32300.0,
                    60.0,
                    22.0
                  ],
                  "text": "int",
                  "id": "obj-64"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "bang"
                  ],
                  "patching_rect": [
                    170.0,
                    260.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i b",
                  "id": "obj-65"
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
                    320.0,
                    32180.0,
                    60.0,
                    22.0
                  ],
                  "text": "sel 0",
                  "id": "obj-66"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 1,
                  "outlettype": [
                    "bang"
                  ],
                  "patching_rect": [
                    770.0,
                    32240.0,
                    60.0,
                    22.0
                  ],
                  "text": "t b",
                  "id": "obj-67"
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
                    620.0,
                    32360.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-68"
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
                    320.0,
                    320.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-69"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 3,
                  "outlettype": [
                    "list",
                    "list",
                    "list"
                  ],
                  "patching_rect": [
                    170.0,
                    380.0,
                    60.0,
                    22.0
                  ],
                  "text": "t l l l",
                  "id": "obj-70"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 1,
                  "outlettype": [
                    "bang"
                  ],
                  "patching_rect": [
                    620.0,
                    20.0,
                    60.0,
                    22.0
                  ],
                  "text": "loadbang",
                  "id": "obj-71"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 3,
                  "outlettype": [
                    "bang",
                    "bang",
                    "int"
                  ],
                  "patching_rect": [
                    470.0,
                    80.0,
                    60.0,
                    22.0
                  ],
                  "text": "uzi 128",
                  "id": "obj-72"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    320.0,
                    140.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i",
                  "id": "obj-73"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 2,
                  "numoutlets": 1,
                  "outlettype": [
                    "int"
                  ],
                  "patching_rect": [
                    320.0,
                    200.0,
                    60.0,
                    22.0
                  ],
                  "text": "- 1",
                  "id": "obj-74"
                }
              },
              {
                "box": {
                  "maxclass": "newobj",
                  "numinlets": 1,
                  "numoutlets": 2,
                  "outlettype": [
                    "int",
                    "int"
                  ],
                  "patching_rect": [
                    320.0,
                    260.0,
                    60.0,
                    22.0
                  ],
                  "text": "t i i",
                  "id": "obj-75"
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
                    470.0,
                    320.0,
                    60.0,
                    22.0
                  ],
                  "text": "pack 0 0",
                  "id": "obj-76"
                }
              }
            ],
            "lines": [
              {
                "patchline": {
                  "destination": [
                    "obj-11",
                    1
                  ],
                  "source": [
                    "obj-10",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-11",
                    0
                  ],
                  "source": [
                    "obj-12",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-11",
                    0
                  ],
                  "source": [
                    "obj-13",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-11",
                    0
                  ],
                  "source": [
                    "obj-14",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-15",
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
                    "obj-16",
                    0
                  ],
                  "source": [
                    "obj-15",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-17",
                    1
                  ],
                  "source": [
                    "obj-16",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-18",
                    0
                  ],
                  "source": [
                    "obj-16",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-19",
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
                    "obj-20",
                    0
                  ],
                  "source": [
                    "obj-19",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-20",
                    1
                  ],
                  "source": [
                    "obj-15",
                    0
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
                    "obj-20",
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
                    "obj-20",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-12",
                    0
                  ],
                  "source": [
                    "obj-29",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-10",
                    0
                  ],
                  "source": [
                    "obj-29",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-8",
                    0
                  ],
                  "source": [
                    "obj-21",
                    1
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
                    "obj-21",
                    0
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
                    "obj-22",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-8",
                    0
                  ],
                  "source": [
                    "obj-23",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-9",
                    0
                  ],
                  "source": [
                    "obj-23",
                    0
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
                    "obj-8",
                    0
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
                    "obj-24",
                    1
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
                    "obj-25",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-27",
                    1
                  ],
                  "source": [
                    "obj-26",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-28",
                    1
                  ],
                  "source": [
                    "obj-26",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-29",
                    0
                  ],
                  "source": [
                    "obj-26",
                    0
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
                    "obj-11",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-27",
                    0
                  ],
                  "source": [
                    "obj-30",
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
                    "obj-27",
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
                    "obj-5",
                    0
                  ],
                  "source": [
                    "obj-32",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-10",
                    0
                  ],
                  "source": [
                    "obj-32",
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
                    "obj-30",
                    2
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
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-35",
                    1
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
                    "obj-28",
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
                    "obj-28",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-10",
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
                    "obj-13",
                    0
                  ],
                  "source": [
                    "obj-47",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-10",
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
                    "obj-21",
                    0
                  ],
                  "source": [
                    "obj-36",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-37",
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
                    "obj-38",
                    1
                  ],
                  "source": [
                    "obj-37",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-7",
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
                    "obj-7",
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
                    "obj-39",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-41",
                    1
                  ],
                  "source": [
                    "obj-40",
                    2
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
                    "obj-40",
                    1
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
                    "obj-38",
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
                    "obj-41",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-8",
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
                    "obj-9",
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
                    "obj-43",
                    0
                  ],
                  "source": [
                    "obj-40",
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
                    "obj-43",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-45",
                    1
                  ],
                  "source": [
                    "obj-44",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-46",
                    1
                  ],
                  "source": [
                    "obj-44",
                    1
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
                    "obj-44",
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
                    "obj-11",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-49",
                    0
                  ],
                  "source": [
                    "obj-48",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-50",
                    1
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
                    "obj-51",
                    0
                  ],
                  "source": [
                    "obj-48",
                    1
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
                    "obj-51",
                    1
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
                    "obj-45",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-5",
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
                    "obj-48",
                    0
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
                    "obj-54",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-56",
                    1
                  ],
                  "source": [
                    "obj-17",
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
                    "obj-54",
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
                    "obj-46",
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
                    "obj-55",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-5",
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
                    "obj-50",
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
                    "obj-10",
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
                    "obj-57",
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
                    "obj-58",
                    1
                  ],
                  "source": [
                    "obj-57",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-9",
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
                    "obj-59",
                    0
                  ],
                  "source": [
                    "obj-9",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-60",
                    0
                  ],
                  "source": [
                    "obj-59",
                    1
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
                    "obj-60",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-6",
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
                    "obj-7",
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
                    "obj-14",
                    0
                  ],
                  "source": [
                    "obj-65",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-10",
                    0
                  ],
                  "source": [
                    "obj-65",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-61",
                    0
                  ],
                  "source": [
                    "obj-4",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-62",
                    0
                  ],
                  "source": [
                    "obj-61",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-63",
                    0
                  ],
                  "source": [
                    "obj-62",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-64",
                    1
                  ],
                  "source": [
                    "obj-63",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-65",
                    0
                  ],
                  "source": [
                    "obj-63",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-69",
                    0
                  ],
                  "source": [
                    "obj-63",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-66",
                    0
                  ],
                  "source": [
                    "obj-11",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-67",
                    0
                  ],
                  "source": [
                    "obj-66",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-64",
                    0
                  ],
                  "source": [
                    "obj-67",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-68",
                    0
                  ],
                  "source": [
                    "obj-64",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-5",
                    0
                  ],
                  "source": [
                    "obj-68",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-70",
                    0
                  ],
                  "source": [
                    "obj-69",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-8",
                    0
                  ],
                  "source": [
                    "obj-70",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-9",
                    0
                  ],
                  "source": [
                    "obj-70",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-10",
                    0
                  ],
                  "source": [
                    "obj-70",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-72",
                    0
                  ],
                  "source": [
                    "obj-71",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-73",
                    0
                  ],
                  "source": [
                    "obj-72",
                    2
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-76",
                    1
                  ],
                  "source": [
                    "obj-73",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-74",
                    0
                  ],
                  "source": [
                    "obj-73",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-75",
                    0
                  ],
                  "source": [
                    "obj-74",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-69",
                    0
                  ],
                  "source": [
                    "obj-75",
                    1
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-76",
                    0
                  ],
                  "source": [
                    "obj-75",
                    0
                  ]
                }
              },
              {
                "patchline": {
                  "destination": [
                    "obj-7",
                    0
                  ],
                  "source": [
                    "obj-76",
                    0
                  ]
                }
              }
            ]
          },
          "id": "obj-28"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 7,
          "numoutlets": 1,
          "outlettype": [
            "int"
          ],
          "patching_rect": [
            20.0,
            260.0,
            60.0,
            22.0
          ],
          "text": "midiformat",
          "id": "obj-29"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 0,
          "outlettype": [],
          "patching_rect": [
            20.0,
            300.0,
            60.0,
            22.0
          ],
          "text": "midiout",
          "id": "obj-30"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 12,
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
            "",
            "",
            ""
          ],
          "patching_rect": [
            20.0,
            340.0,
            180.0,
            22.0
          ],
          "text": "js scalesnap.js",
          "saved_object_attributes": {
            "filename": "scalesnap.js",
            "parameter_enable": 0
          },
          "id": "obj-31"
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
            826.0,
            60.0,
            22.0
          ],
          "text": "prepend power",
          "id": "obj-32"
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
            852.0,
            60.0,
            22.0
          ],
          "text": "prepend key",
          "id": "obj-33"
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
            878.0,
            60.0,
            22.0
          ],
          "text": "prepend mode",
          "id": "obj-34"
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
            904.0,
            60.0,
            22.0
          ],
          "text": "prepend category",
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
            300.0,
            930.0,
            60.0,
            22.0
          ],
          "text": "prepend scalemenu",
          "id": "obj-36"
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
            956.0,
            60.0,
            22.0
          ],
          "text": "prepend scaleuid",
          "id": "obj-37"
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
            982.0,
            60.0,
            22.0
          ],
          "text": "prepend listen",
          "id": "obj-38"
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
            1008.0,
            60.0,
            22.0
          ],
          "text": "prepend memory",
          "id": "obj-39"
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
            1034.0,
            60.0,
            22.0
          ],
          "text": "prepend resultselect",
          "id": "obj-40"
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
            1060.0,
            60.0,
            22.0
          ],
          "text": "sel 1",
          "id": "obj-41"
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
            1086.0,
            60.0,
            22.0
          ],
          "text": "prev",
          "id": "obj-42"
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
            1112.0,
            60.0,
            22.0
          ],
          "text": "sel 1",
          "id": "obj-43"
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
            1138.0,
            60.0,
            22.0
          ],
          "text": "next",
          "id": "obj-44"
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
            1164.0,
            60.0,
            22.0
          ],
          "text": "sel 1",
          "id": "obj-45"
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
            1190.0,
            60.0,
            22.0
          ],
          "text": "reset",
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
            1216.0,
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
            1242.0,
            60.0,
            22.0
          ],
          "text": "analyze",
          "id": "obj-48"
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
            1268.0,
            60.0,
            22.0
          ],
          "text": "sel 1",
          "id": "obj-49"
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
            1294.0,
            60.0,
            22.0
          ],
          "text": "apply",
          "id": "obj-50"
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
            1320.0,
            60.0,
            22.0
          ],
          "text": "sel 1",
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
            520.0,
            1346.0,
            60.0,
            22.0
          ],
          "text": "snapclip",
          "id": "obj-52"
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
            1372.0,
            60.0,
            22.0
          ],
          "text": "sel 1",
          "id": "obj-53"
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
            1398.0,
            60.0,
            22.0
          ],
          "text": "audioapply",
          "id": "obj-54"
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
            1424.0,
            60.0,
            22.0
          ],
          "text": "togglefav",
          "id": "obj-55"
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
            300.0,
            340.0,
            60.0,
            22.0
          ],
          "text": "live.thisdevice",
          "id": "obj-56"
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
            300.0,
            380.0,
            60.0,
            22.0
          ],
          "text": "loaded",
          "id": "obj-57"
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
            380.0,
            380.0,
            60.0,
            22.0
          ],
          "text": "sel 0",
          "id": "obj-58"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            20.0,
            420.0,
            60.0,
            22.0
          ],
          "text": "r scalesnap.detect",
          "id": "obj-59"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            ""
          ],
          "patching_rect": [
            200.0,
            420.0,
            60.0,
            22.0
          ],
          "text": "r scalesnap.favorites",
          "id": "obj-60"
        }
      },
      {
        "box": {
          "maxclass": "newobj",
          "numinlets": 1,
          "numoutlets": 1,
          "outlettype": [
            "bang"
          ],
          "patching_rect": [
            200.0,
            450.0,
            60.0,
            22.0
          ],
          "text": "t b",
          "id": "obj-61"
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
            200.0,
            480.0,
            60.0,
            22.0
          ],
          "text": "favchanged",
          "id": "obj-62"
        }
      }
    ],
    "lines": [
      {
        "patchline": {
          "destination": [
            "obj-25",
            0
          ],
          "source": [
            "obj-24",
            0
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
            "obj-25",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-28",
            0
          ],
          "source": [
            "obj-26",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-27",
            0
          ],
          "source": [
            "obj-26",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-28",
            1
          ],
          "source": [
            "obj-25",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-29",
            2
          ],
          "source": [
            "obj-25",
            2
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-29",
            3
          ],
          "source": [
            "obj-25",
            3
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-29",
            4
          ],
          "source": [
            "obj-25",
            4
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-29",
            5
          ],
          "source": [
            "obj-25",
            5
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-29",
            6
          ],
          "source": [
            "obj-25",
            6
          ]
        }
      },
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
            "obj-29",
            0
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
            "obj-27",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-28",
            2
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
            "obj-32",
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
            "obj-31",
            0
          ],
          "source": [
            "obj-32",
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
            "obj-2",
            0
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
            "obj-33",
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
            "obj-8",
            0
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
            "obj-34",
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
            "obj-3",
            0
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
            "obj-35",
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
            "obj-5",
            0
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
            "obj-36",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-37",
            0
          ],
          "source": [
            "obj-23",
            0
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
            "obj-37",
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
            "obj-13",
            0
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
            "obj-38",
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
            "obj-16",
            0
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
            "obj-39",
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
            "obj-18",
            0
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
            "obj-40",
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
            "obj-4",
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
            "obj-41",
            0
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
            "obj-42",
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
            "obj-6",
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
            "obj-43",
            0
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
            "obj-14",
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
            "obj-45",
            0
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
            "obj-15",
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
            "obj-31",
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
            "obj-49",
            0
          ],
          "source": [
            "obj-17",
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
            "obj-31",
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
            "obj-51",
            0
          ],
          "source": [
            "obj-9",
            0
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
            "obj-51",
            0
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
            "obj-22",
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
            "obj-53",
            0
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
            "obj-54",
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
            "obj-7",
            0
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
            "obj-55",
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
            "obj-56",
            0
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
            "obj-57",
            0
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
            "obj-56",
            1
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-28",
            3
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
            "obj-31",
            0
          ],
          "source": [
            "obj-59",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-61",
            0
          ],
          "source": [
            "obj-60",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-62",
            0
          ],
          "source": [
            "obj-61",
            0
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
            "obj-62",
            0
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-2",
            0
          ],
          "source": [
            "obj-31",
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
            "obj-31",
            2
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-5",
            0
          ],
          "source": [
            "obj-31",
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
            "obj-31",
            4
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-7",
            0
          ],
          "source": [
            "obj-31",
            5
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-10",
            0
          ],
          "source": [
            "obj-31",
            6
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-11",
            0
          ],
          "source": [
            "obj-31",
            7
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-18",
            0
          ],
          "source": [
            "obj-31",
            8
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-19",
            0
          ],
          "source": [
            "obj-31",
            9
          ]
        }
      },
      {
        "patchline": {
          "destination": [
            "obj-20",
            0
          ],
          "source": [
            "obj-31",
            10
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
            "obj-31",
            11
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
        "Power",
        "Power",
        0
      ],
      "obj-2": [
        "Key",
        "Key",
        0
      ],
      "obj-3": [
        "Category",
        "Category",
        0
      ],
      "obj-4": [
        "Previous Scale",
        "Prev",
        0
      ],
      "obj-6": [
        "Next Scale",
        "Next",
        0
      ],
      "obj-8": [
        "Correction",
        "Correct",
        0
      ],
      "obj-16": [
        "Detect Memory",
        "Memory",
        0
      ],
      "obj-23": [
        "Scale ID",
        "Scale ID",
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
      "amxdtype": 1835887981,
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
