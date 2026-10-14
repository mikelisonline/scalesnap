cmake_minimum_required(VERSION 3.22)

# Universal binary (Apple Silicon + Intel) on macOS. Must be set before project().
set(CMAKE_OSX_ARCHITECTURES "arm64;x86_64" CACHE STRING "")
set(CMAKE_OSX_DEPLOYMENT_TARGET "10.13" CACHE STRING "")

project(ScaleSnap VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

option(SCALESNAP_BUILD_PLUGIN "Build the plugin (needs JUCE)" ON)
option(SCALESNAP_BUILD_TESTS "Build the unit tests" ON)
set(SCALESNAP_JUCE_PATH "" CACHE PATH "Use a local JUCE checkout instead of downloading it")

if(SCALESNAP_BUILD_TESTS)
    enable_testing()
    add_executable(ScaleEngineTests Tests/ScaleEngineTests.cpp)
    target_include_directories(ScaleEngineTests PRIVATE Source)
    add_test(NAME ScaleEngineTests COMMAND ScaleEngineTests)
endif()

if(NOT SCALESNAP_BUILD_PLUGIN)
    return()
endif()

if(SCALESNAP_JUCE_PATH)
    add_subdirectory(${SCALESNAP_JUCE_PATH} JUCE)
else()
    include(FetchContent)
    FetchContent_Declare(JUCE
        GIT_REPOSITORY https://github.com/juce-framework/JUCE.git
        GIT_TAG 8.0.12
        GIT_SHALLOW TRUE)
    FetchContent_MakeAvailable(JUCE)
endif()

juce_add_plugin(ScaleSnap
    PRODUCT_NAME "Scale Snap"
    COMPANY_NAME "mikel.studio"
    BUNDLE_ID studio.mikel.scalesnap
    PLUGIN_MANUFACTURER_CODE Mkls
    PLUGIN_CODE Scsn
    FORMATS VST3
    # Loaded as an instrument (not a MIDI effect) because that's how Ableton
    # lets other tracks take a plugin's MIDI output.
    IS_SYNTH TRUE
    NEEDS_MIDI_INPUT TRUE
    NEEDS_MIDI_OUTPUT TRUE
    IS_MIDI_EFFECT FALSE
    EDITOR_WANTS_KEYBOARD_FOCUS TRUE # for the scale search box
    VST3_CATEGORIES Instrument Tools
    COPY_PLUGIN_AFTER_BUILD FALSE)

target_sources(ScaleSnap PRIVATE
    Source/PluginProcessor.cpp
    Source/PluginEditor.cpp
    Source/Favorites.cpp)

target_compile_definitions(ScaleSnap PUBLIC
    JUCE_WEB_BROWSER=0
    JUCE_USE_CURL=0
    JUCE_VST3_CAN_REPLACE_VST2=0
    JUCE_DISPLAY_SPLASH_SCREEN=0)

target_link_libraries(ScaleSnap
    PRIVATE
        juce::juce_audio_utils
    PUBLIC
        juce::juce_recommended_config_flags
        juce::juce_recommended_lto_flags
        juce::juce_recommended_warning_flags)
