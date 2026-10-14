#include "PluginEditor.h"

namespace colours
{
const juce::Colour background  { 0xff15171c };
const juce::Colour panel       { 0xff1f232b };
const juce::Colour text        { 0xffe8eaee };
const juce::Colour dimText     { 0xff8a919e };
const juce::Colour accent      { 0xff4fd1a5 }; // notes coming out
const juce::Colour wrong       { 0xffff6b6b }; // keys pressed outside the scale
const juce::Colour pressed     { 0xfff2c14e }; // keys pressed inside the scale
const juce::Colour whiteKey    { 0xffd9dde3 };
const juce::Colour whiteInKey  { 0xfff7fbff };
const juce::Colour blackKey    { 0xff2a2e36 };
const juce::Colour blackInKey  { 0xff5a6170 };
} // namespace colours

namespace
{
bool isBlack (int note)
{
    const int pc = note % 12;
    return pc == 1 || pc == 3 || pc == 6 || pc == 8 || pc == 10;
}

int whiteIndex (int note) // number of white keys below `note` from C0
{
    static constexpr int whitesBefore[12] = { 0, 1, 1, 2, 2, 3, 4, 4, 5, 5, 6, 6 };
    return (note / 12) * 7 + whitesBefore[note % 12];
}
} // namespace

//==============================================================================
bool KeyboardView::refresh()
{
    bool changed = false;
    for (size_t n = 0; n < 128; ++n)
    {
        const bool i = processor.inputActive[n].load (std::memory_order_relaxed);
        const bool o = processor.outputActive[n].load (std::memory_order_relaxed);
        changed = changed || i != in[n] || o != out[n];
        in[n] = i;
        out[n] = o;
    }

    const int r = (int) processor.parameters.getRawParameterValue ("root")->load();
    const int s = (int) processor.parameters.getRawParameterValue ("scale")->load();
    changed = changed || r != lastRoot || s != lastScale;
    lastRoot = r;
    lastScale = s;
    return changed;
}

void KeyboardView::paint (juce::Graphics& g)
{
    scalesnap::ScaleEngine engine;
    engine.setScale (lastRoot, lastScale);

    const auto bounds = getLocalBounds().toFloat();
    const int numWhite = whiteIndex (highestNote) - whiteIndex (lowestNote) + 1;
    const float whiteW = bounds.getWidth() / (float) numWhite;
    const float blackW = whiteW * 0.62f;
    const float blackH = bounds.getHeight() * 0.62f;

    auto keyRect = [&] (int note)
    {
        const float x = bounds.getX() + (float) (whiteIndex (note) - whiteIndex (lowestNote)) * whiteW;
        if (isBlack (note))
            return juce::Rectangle<float> (x - blackW * 0.5f, bounds.getY(), blackW, blackH);
        return juce::Rectangle<float> (x, bounds.getY(), whiteW, bounds.getHeight());
    };

    auto drawKey = [&] (int note)
    {
        const bool black = isBlack (note);
        const bool inScale = engine.isInScale (note);
        auto r = keyRect (note).reduced (black ? 0.0f : 1.0f, 0.0f);

        juce::Colour fill = black ? (inScale ? colours::blackInKey : colours::blackKey)
                                  : (inScale ? colours::whiteInKey : colours::whiteKey.darker (0.35f));
        if (out[(size_t) note])
            fill = colours::accent;

        g.setColour (fill);
        g.fillRoundedRectangle (r, 3.0f);

        // Root notes get a small marker at the bottom.
        if (inScale && note % 12 == engine.getRoot())
        {
            g.setColour (out[(size_t) note] ? colours::background : colours::accent.darker (0.2f));
            g.fillRect (r.removeFromBottom (4.0f).reduced (2.0f, 0.0f));
        }

        // A dot on keys you are physically pressing: yellow if in scale, red if corrected.
        if (in[(size_t) note])
        {
            const float d = juce::jmin (whiteW, blackW) * 0.55f;
            const auto k = keyRect (note);
            const auto dot = juce::Rectangle<float> (d, d).withCentre ({ k.getCentreX(), k.getBottom() - d * 1.6f });
            g.setColour (inScale ? colours::pressed : colours::wrong);
            g.fillEllipse (dot);
        }

        if (! black && note % 12 == 0)
        {
            g.setColour (colours::background.withAlpha (0.55f));
            g.setFont (juce::FontOptions (10.0f));
            g.drawText ("C" + juce::String (note / 12 - 2), keyRect (note).withTrimmedBottom (12.0f).removeFromBottom (14.0f),
                        juce::Justification::centred);
        }
    };

    for (int n = lowestNote; n <= highestNote; ++n)
        if (! isBlack (n))
            drawKey (n);

    for (int n = lowestNote; n <= highestNote; ++n)
        if (isBlack (n))
            drawKey (n);
}

//==============================================================================
ScaleSnapEditor::ScaleSnapEditor (ScaleSnapProcessor& p)
    : AudioProcessorEditor (&p), processor (p), keyboard (p)
{
    lookAndFeel.setColourScheme ({ colours::panel, colours::background, colours::panel,
                                   colours::dimText, colours::text, colours::accent,
                                   colours::background, colours::accent, colours::text });
    lookAndFeel.setColour (juce::ComboBox::outlineColourId, juce::Colours::transparentBlack);
    lookAndFeel.setColour (juce::ToggleButton::tickColourId, colours::accent);
    setLookAndFeel (&lookAndFeel);

    setUpCombo (root, "root");
    setUpCombo (scale, "scale");
    setUpCombo (mode, "mode");
    setUpCombo (chord, "chord");

    addAndMakeVisible (bypass);
    bypassAttachment = std::make_unique<ButtonAttachment> (processor.parameters, "bypass", bypass);

    addAndMakeVisible (keyboard);

    setSize (820, 330);
    startTimerHz (30);
}

ScaleSnapEditor::~ScaleSnapEditor()
{
    setLookAndFeel (nullptr);
}

void ScaleSnapEditor::setUpCombo (LabelledCombo& c, const juce::String& paramId)
{
    auto* param = dynamic_cast<juce::AudioParameterChoice*> (processor.parameters.getParameter (paramId));
    jassert (param != nullptr);

    c.label.setText (param->getName (32).toUpperCase(), juce::dontSendNotification);
    c.label.setFont (juce::FontOptions (11.0f, juce::Font::bold));
    c.label.setColour (juce::Label::textColourId, colours::dimText);
    c.box.addItemList (param->choices, 1);

    addAndMakeVisible (c.label);
    addAndMakeVisible (c.box);
    c.attachment = std::make_unique<ComboAttachment> (processor.parameters, paramId, c.box);
}

juce::String ScaleSnapEditor::describeScale() const
{
    const int r = (int) processor.parameters.getRawParameterValue ("root")->load();
    const int s = (int) processor.parameters.getRawParameterValue ("scale")->load();
    scalesnap::ScaleEngine engine;
    engine.setScale (r, s);

    juce::StringArray notes;
    for (int i = 0; i < 12; ++i)
        if (engine.isInScale (r + i))
            notes.add (scalesnap::getNoteNames()[(size_t) ((r + i) % 12)]);

    return juce::String (scalesnap::getNoteNames()[(size_t) r]) + " " + scalesnap::getScales()[(size_t) s].name
         + ":   " + notes.joinIntoString ("  ");
}

void ScaleSnapEditor::timerCallback()
{
    if (keyboard.refresh())
        keyboard.repaint();

    const auto description = describeScale();
    if (description != scaleDescription)
    {
        scaleDescription = description;
        repaint();
    }
}

void ScaleSnapEditor::paint (juce::Graphics& g)
{
    g.fillAll (colours::background);

    auto area = getLocalBounds().reduced (20, 14);
    auto header = area.removeFromTop (30);

    g.setColour (colours::text);
    g.setFont (juce::FontOptions (22.0f, juce::Font::bold));
    g.drawText ("SCALE SNAP", header, juce::Justification::centredLeft);

    g.setColour (colours::dimText);
    g.setFont (juce::FontOptions (12.0f));
    g.drawText ("mikel.studio", header, juce::Justification::centredRight);

    // Scale summary line, just above the keyboard.
    g.setColour (colours::accent);
    g.setFont (juce::FontOptions (14.0f, juce::Font::bold));
    g.drawText (scaleDescription, keyboard.getBounds().translated (0, -26).withHeight (20), juce::Justification::centredLeft);

    // Legend + routing tip.
    auto footer = getLocalBounds().reduced (20, 10).removeFromBottom (18);
    g.setFont (juce::FontOptions (11.0f));

    auto legendItem = [&] (juce::Colour c, const juce::String& text)
    {
        g.setColour (c);
        g.fillEllipse (footer.removeFromLeft (8).toFloat().withSizeKeepingCentre (8.0f, 8.0f));
        footer.removeFromLeft (6);
        g.setColour (colours::dimText);
        g.drawText (text, footer.removeFromLeft (128), juce::Justification::centredLeft);
    };

    legendItem (colours::pressed, "you played (in scale)");
    legendItem (colours::wrong, "you played (corrected)");
    legendItem (colours::accent, "note sent out");

    g.setColour (colours::dimText);
    g.drawText (juce::String::fromUTF8 ("To record: another track's MIDI From \xe2\x86\x92 this track \xe2\x86\x92 Scale Snap"),
                footer, juce::Justification::centredRight);
}

void ScaleSnapEditor::resized()
{
    auto area = getLocalBounds().reduced (20, 14);
    area.removeFromTop (40); // header

    auto controls = area.removeFromTop (48);
    const int gap = 12;
    const int bypassW = 90;
    const int comboW = (controls.getWidth() - bypassW - gap * 4) / 4;
    const int widths[] = { comboW - 50, comboW + 30, comboW + 20, comboW };

    LabelledCombo* combos[] = { &root, &scale, &mode, &chord };
    for (int i = 0; i < 4; ++i)
    {
        auto col = controls.removeFromLeft (widths[i]);
        combos[i]->label.setBounds (col.removeFromTop (18));
        combos[i]->box.setBounds (col.reduced (0, 1));
        controls.removeFromLeft (gap);
    }
    bypass.setBounds (controls.withTrimmedTop (18));

    area.removeFromTop (40); // scale summary line
    area.removeFromBottom (28); // footer
    keyboard.setBounds (area);
}
