#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"
#include "Favorites.h"
#include "UiComponents.h"

/** Piano strip that shows the scale, the keys you press and the notes that come out. */
class KeyboardView : public juce::Component
{
public:
    explicit KeyboardView (ScaleSnapProcessor& p) : processor (p) {}

    void paint (juce::Graphics&) override;

    /** Copies the processor's note state; returns true if anything changed. */
    bool refresh();

    static constexpr int lowestNote = 36;  // C1 in Ableton's naming
    static constexpr int highestNote = 96; // C6 in Ableton's naming

private:
    ScaleSnapProcessor& processor;
    std::array<bool, 128> in {}, out {};
    int lastRoot = -1, lastScale = -1;
};

class ScaleSnapEditor : public juce::AudioProcessorEditor,
                        private juce::Timer,
                        private juce::ChangeListener
{
public:
    explicit ScaleSnapEditor (ScaleSnapProcessor&);
    ~ScaleSnapEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override;
    void changeListenerCallback (juce::ChangeBroadcaster*) override;

    void refreshList();
    void updateScaleState();
    void pickScale (int scaleIndex);
    void stepScale (int direction);

    ScaleSnapProcessor& processor;
    ui::LiveLookAndFeel lookAndFeel;
    juce::SharedResourcePointer<Favorites> favorites;
    juce::TooltipWindow tooltipWindow { this, 600 };

    // Title bar
    ui::PowerButton power;

    // Browser (left)
    juce::TextEditor search;
    ui::SidebarList sidebar;
    ui::ScaleList scaleList { *favorites };

    // Device controls (right)
    ui::OptionRow keyRow { ui::OptionRow::Style::spaced };
    ui::IconButton previousButton { ui::IconButton::Icon::previous };
    ui::IconButton nextButton { ui::IconButton::Icon::next };
    ui::IconButton starButton { ui::IconButton::Icon::star };
    ui::ReadoutBox scaleName;
    ui::OptionRow modeRow { ui::OptionRow::Style::joined };
    ui::OptionRow chordRow { ui::OptionRow::Style::joined };

    KeyboardView keyboard;

    // What the browser currently shows, and the scale that is selected.
    std::vector<int> visibleScales;
    int currentRoot = 0;
    int currentScale = 0;
    juce::String summaryText, notesText, infoText;

    // Declared last so they are destroyed (and stop listening) first.
    juce::ParameterAttachment rootAttachment, scaleAttachment, modeAttachment, chordAttachment, bypassAttachment;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ScaleSnapEditor)
};
