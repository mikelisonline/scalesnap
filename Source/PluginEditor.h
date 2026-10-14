#pragma once

#include <juce_audio_processors/juce_audio_processors.h>
#include "PluginProcessor.h"

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

class ScaleSnapEditor : public juce::AudioProcessorEditor, private juce::Timer
{
public:
    explicit ScaleSnapEditor (ScaleSnapProcessor&);
    ~ScaleSnapEditor() override;

    void paint (juce::Graphics&) override;
    void resized() override;

private:
    void timerCallback() override;
    juce::String describeScale() const;

    using ComboAttachment = juce::AudioProcessorValueTreeState::ComboBoxAttachment;
    using ButtonAttachment = juce::AudioProcessorValueTreeState::ButtonAttachment;

    struct LabelledCombo
    {
        juce::Label label;
        juce::ComboBox box;
        std::unique_ptr<ComboAttachment> attachment;
    };

    void setUpCombo (LabelledCombo&, const juce::String& paramId);

    ScaleSnapProcessor& processor;
    juce::LookAndFeel_V4 lookAndFeel;

    LabelledCombo root, scale, mode, chord;
    juce::ToggleButton bypass { "Bypass" };
    std::unique_ptr<ButtonAttachment> bypassAttachment;

    KeyboardView keyboard;
    juce::String scaleDescription;

    JUCE_DECLARE_NON_COPYABLE_WITH_LEAK_DETECTOR (ScaleSnapEditor)
};
