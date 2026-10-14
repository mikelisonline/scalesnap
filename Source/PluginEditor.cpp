#include "PluginEditor.h"

namespace colours = ui::colours;

namespace
{
// Keyboard strip colours.
const juce::Colour whiteKey       { 0xff7d7d7d }; // not in scale
const juce::Colour whiteKeyInKey  { 0xffe3c9a0 }; // in scale: muted orange
const juce::Colour whiteKeyRoot   { 0xffe0963a }; // root of the scale: stronger orange
const juce::Colour blackKey       { 0xff191919 };
const juce::Colour blackKeyInKey  { 0xff8a5a22 };
const juce::Colour blackKeyRoot   { 0xffb86f12 };
const juce::Colour keyOutline     { 0xff121212 };

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

// Window layout, shared by paint() and resized().
constexpr int windowWidth = 900, windowHeight = 540;
constexpr int titleHeight = 22, margin = 8, gap = 6;
constexpr int legendHeight = 20, keyboardHeight = 84, infoHeight = 40;
constexpr int sidebarWidth = 240, controlsHeight = 102;

struct Layout
{
    juce::Rectangle<int> title, sidebar, controls, list, info, keyboard, legend;

    explicit Layout (juce::Rectangle<int> b)
    {
        title = b.removeFromTop (titleHeight);
        legend = b.removeFromBottom (legendHeight).reduced (margin, 0);
        b = b.reduced (margin, 0);
        b.removeFromTop (margin);
        keyboard = b.removeFromBottom (keyboardHeight);
        b.removeFromBottom (gap);
        info = b.removeFromBottom (infoHeight);
        b.removeFromBottom (gap);

        sidebar = b.removeFromLeft (sidebarWidth);
        b.removeFromLeft (margin);
        controls = b.removeFromTop (controlsHeight);
        b.removeFromTop (gap);
        list = b;
    }
};

// The controls panel is split into a left block (key / correction) and a right block (scale / chords).
constexpr int controlsInsetX = 10, controlsInsetY = 8, leftBlockWidth = 360, blockGap = 16;
constexpr int labelHeight = 14, controlHeight = 26;

struct ControlRects
{
    juce::Rectangle<int> keyLabel, key, scaleLabel, scale, modeLabel, mode, chordLabel, chord;

    explicit ControlRects (juce::Rectangle<int> panel)
    {
        auto inner = panel.reduced (controlsInsetX, controlsInsetY);
        auto left = inner.removeFromLeft (leftBlockWidth);
        inner.removeFromLeft (blockGap);
        auto right = inner;

        auto split = [] (juce::Rectangle<int> column, juce::Rectangle<int>& label, juce::Rectangle<int>& control, int y)
        {
            label = column.withY (column.getY() + y).withHeight (labelHeight);
            control = column.withY (column.getY() + y + labelHeight).withHeight (controlHeight);
        };

        const int rowB = labelHeight + controlHeight + gap;
        split (left, keyLabel, key, 0);
        split (right, scaleLabel, scale, 0);
        split (left, modeLabel, mode, rowB);
        split (right, chordLabel, chord, rowB);
    }
};
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
    g.setColour (keyOutline);
    g.fillRect (bounds);

    const auto area = bounds.reduced (1.0f);
    const int numWhite = whiteIndex (highestNote) - whiteIndex (lowestNote) + 1;
    const float whiteW = area.getWidth() / (float) numWhite;
    const float blackW = whiteW * 0.62f;
    const float blackH = area.getHeight() * 0.6f;

    auto keyRect = [&] (int note)
    {
        const float x = area.getX() + (float) (whiteIndex (note) - whiteIndex (lowestNote)) * whiteW;
        if (isBlack (note))
            return juce::Rectangle<float> (x - blackW * 0.5f, area.getY(), blackW, blackH);
        return juce::Rectangle<float> (x, area.getY(), whiteW, area.getHeight());
    };

    auto drawKey = [&] (int note)
    {
        const bool black = isBlack (note);
        const bool inScale = engine.isInScale (note);
        const bool isRoot = inScale && note % 12 == engine.getRoot();
        const auto full = keyRect (note);

        // 1px dark outline around every key, then the fill inside it.
        g.setColour (keyOutline);
        g.fillRect (full);
        const auto r = full.reduced (1.0f);

        juce::Colour fill = black ? (isRoot ? blackKeyRoot : inScale ? blackKeyInKey : blackKey)
                                  : (isRoot ? whiteKeyRoot : inScale ? whiteKeyInKey : whiteKey);
        if (out[(size_t) note])
            fill = colours::orange;

        g.setColour (fill);
        g.fillRect (r);

        // A dot on keys you are physically pressing: light if in scale, red if corrected.
        if (in[(size_t) note])
        {
            const float d = 9.0f;
            const auto dot = juce::Rectangle<float> (d, d).withCentre ({ full.getCentreX(), full.getBottom() - (black ? 10.0f : 27.0f) });
            g.setColour (keyOutline);
            g.fillEllipse (dot.expanded (1.0f));
            g.setColour (inScale ? juce::Colour (0xfff4f4f4) : colours::red);
            g.fillEllipse (dot);
        }

        if (! black && note % 12 == 0)
        {
            g.setColour (out[(size_t) note] || isRoot ? colours::onAccent : juce::Colour (0xff1f1f1f).withAlpha (0.75f));
            g.setFont (ui::font (9.0f, true));
            g.drawText ("C" + juce::String (note / 12 - 2), // Ableton naming: MIDI 60 = C3
                        full.withTrimmedBottom (3.0f).removeFromBottom (11.0f), juce::Justification::centred);
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
    : AudioProcessorEditor (&p),
      processor (p),
      keyboard (p),
      rootAttachment (*p.parameters.getParameter ("root"), [this] (float v)
      {
          currentRoot = juce::jlimit (0, 11, juce::roundToInt (v));
          keyRow.setSelected (currentRoot);
          updateScaleState();
      }),
      scaleAttachment (*p.parameters.getParameter ("scale"), [this] (float v)
      {
          currentScale = juce::jlimit (0, (int) scalesnap::getScales().size() - 1, juce::roundToInt (v));
          scaleList.setCurrent (currentScale);
          updateScaleState();
      }),
      modeAttachment (*p.parameters.getParameter ("mode"), [this] (float v) { modeRow.setSelected (juce::roundToInt (v)); }),
      chordAttachment (*p.parameters.getParameter ("chord"), [this] (float v) { chordRow.setSelected (juce::roundToInt (v)); }),
      bypassAttachment (*p.parameters.getParameter ("bypass"), [this] (float v) { power.setOn (v < 0.5f); })
{
    setLookAndFeel (&lookAndFeel);
    tooltipWindow.setLookAndFeel (&lookAndFeel);

    // Title bar power switch: on = correcting, off = bypassed.
    power.setTooltip ("On: notes are corrected. Off: notes pass through unchanged (bypass).");
    power.onToggle = [this] (bool on) { bypassAttachment.setValueAsCompleteGesture (on ? 0.0f : 1.0f); };
    addAndMakeVisible (power);

    // Browser.
    search.setFont (ui::font (12.0f));
    search.setTextToShowWhenEmpty ("Search scales", colours::dimText);
    search.setIndents (8, 5);
    search.setBorder ({ 0, 0, 0, 0 });
    search.setSelectAllWhenFocused (true);
    search.onTextChange = [this] { refreshList(); };
    search.onEscapeKey = [this] { search.clear(); };
    addAndMakeVisible (search);

    sidebar.onFilterChanged = [this] (int) { refreshList(); };
    addAndMakeVisible (sidebar);

    scaleList.onPick = [this] (int index) { pickScale (index); };
    addAndMakeVisible (scaleList);

    // Key selector.
    juce::StringArray keyNames;
    for (auto* n : scalesnap::getNoteNames())
        keyNames.add (n);
    keyRow.setLabels (keyNames);
    keyRow.setDarkCells ({ false, true, false, true, false, false, true, false, true, false, true, false });
    keyRow.onSelect = [this] (int index) { rootAttachment.setValueAsCompleteGesture ((float) index); };
    addAndMakeVisible (keyRow);

    // Scale stepper.
    previousButton.setTooltip ("Previous scale in the list (or in your favorites)");
    nextButton.setTooltip ("Next scale in the list (or in your favorites)");
    starButton.setTooltip ("Add or remove this scale from your favorites");
    previousButton.onClick = [this] { stepScale (-1); };
    nextButton.onClick = [this] { stepScale (1); };
    starButton.onClick = [this]
    {
        favorites->toggle (scalesnap::getScales()[(size_t) currentScale].id);
    };
    addAndMakeVisible (previousButton);
    addAndMakeVisible (nextButton);
    addAndMakeVisible (starButton);
    addAndMakeVisible (scaleName);

    // Correction and chords: short labels, the full parameter names as tooltips.
    juce::StringArray modeTips, chordTips;
    for (auto* n : scalesnap::getSnapModeNames())  modeTips.add (n);
    for (auto* n : scalesnap::getChordTypeNames()) chordTips.add (n);

    modeRow.setLabels ({ juce::String::fromUTF8 ("Nearest \xe2\x86\x93"), juce::String::fromUTF8 ("Nearest \xe2\x86\x91"),
                         juce::String::fromUTF8 ("Always \xe2\x86\x91"),  juce::String::fromUTF8 ("Always \xe2\x86\x93"), "Block" },
                       modeTips);
    modeRow.onSelect = [this] (int index) { modeAttachment.setValueAsCompleteGesture ((float) index); };
    addAndMakeVisible (modeRow);

    chordRow.setLabels ({ "Off", "Triad", "7th", "9th" }, chordTips);
    chordRow.onSelect = [this] (int index) { chordAttachment.setValueAsCompleteGesture ((float) index); };
    addAndMakeVisible (chordRow);

    addAndMakeVisible (keyboard);

    // Favorites are shared by every instance: pick up changes made elsewhere.
    favorites->reload();
    favorites->addChangeListener (this);

    refreshList();

    rootAttachment.sendInitialUpdate();
    scaleAttachment.sendInitialUpdate();
    modeAttachment.sendInitialUpdate();
    chordAttachment.sendInitialUpdate();
    bypassAttachment.sendInitialUpdate();

    setSize (windowWidth, windowHeight);
    startTimerHz (30);
}

ScaleSnapEditor::~ScaleSnapEditor()
{
    stopTimer();
    favorites->removeChangeListener (this);
    tooltipWindow.setLookAndFeel (nullptr);
    setLookAndFeel (nullptr);
}

void ScaleSnapEditor::changeListenerCallback (juce::ChangeBroadcaster*)
{
    refreshList();
    updateScaleState();
}

void ScaleSnapEditor::refreshList()
{
    const auto& scales = scalesnap::getScales();
    const auto& categories = scalesnap::getCategories();
    const int filter = sidebar.getFilter();

    juce::StringArray terms;
    terms.addTokens (search.getText().trim(), " ", "");
    terms.removeEmptyStrings();

    visibleScales.clear();
    std::vector<int> perCategory (categories.size(), 0);
    int total = 0, numFavourites = 0;

    for (size_t i = 0; i < scales.size(); ++i)
    {
        const auto& s = scales[i];
        const bool isFavourite = favorites->isFavorite (s.id);

        ++total;
        numFavourites += isFavourite ? 1 : 0;
        for (size_t c = 0; c < categories.size(); ++c)
            if (std::strcmp (categories[c], s.category) == 0)
                ++perCategory[c];

        if (filter == ui::SidebarList::favoritesFilter && ! isFavourite)
            continue;
        if (filter >= 0 && (size_t) filter < categories.size() && std::strcmp (categories[(size_t) filter], s.category) != 0)
            continue;

        const juce::String haystack = juce::String (s.name) + " " + s.category + " " + s.info;
        bool matches = true;
        for (auto& term : terms)
            matches = matches && haystack.containsIgnoreCase (term);

        if (matches)
            visibleScales.push_back ((int) i);
    }

    juce::String emptyMessage = "No scales match your search.";
    if (filter == ui::SidebarList::favoritesFilter && numFavourites == 0 && terms.isEmpty())
        emptyMessage = juce::String::fromUTF8 ("No favorites yet.\nClick the star next to a scale to add it here.");

    sidebar.setCounts (total, numFavourites, perCategory);
    scaleList.setItems (visibleScales, emptyMessage);
    scaleList.setCurrent (currentScale);
}

void ScaleSnapEditor::updateScaleState()
{
    const auto& def = scalesnap::getScales()[(size_t) currentScale];
    scalesnap::ScaleEngine engine;
    engine.setScale (currentRoot, currentScale);

    juce::StringArray notes;
    for (int i = 0; i < 12; ++i)
        if (engine.isInScale (currentRoot + i))
            notes.add (scalesnap::getNoteNames()[(size_t) ((currentRoot + i) % 12)]);

    summaryText = juce::String (scalesnap::getNoteNames()[(size_t) currentRoot]) + " " + def.name;
    notesText = notes.joinIntoString ("   ");
    infoText = juce::String (def.category) + "  -  " + def.info;

    scaleName.setText (def.name);
    starButton.setStarred (favorites->isFavorite (def.id));
    scaleList.refreshFavorites();
    repaint();
}

void ScaleSnapEditor::pickScale (int scaleIndex)
{
    scaleAttachment.setValueAsCompleteGesture ((float) scaleIndex);
}

void ScaleSnapEditor::stepScale (int direction)
{
    // Steps through whatever the browser is showing: your favorites if that collection is
    // selected, otherwise the current category and search.
    const int n = (int) visibleScales.size();
    if (n == 0)
        return;

    int position = -1;
    for (int i = 0; i < n; ++i)
        if (visibleScales[(size_t) i] == currentScale)
            position = i;

    const int next = position < 0 ? (direction > 0 ? 0 : n - 1)
                                  : (position + direction + n) % n;
    pickScale (visibleScales[(size_t) next]);
}

void ScaleSnapEditor::timerCallback()
{
    if (keyboard.refresh())
        keyboard.repaint();
}

//==============================================================================
void ScaleSnapEditor::paint (juce::Graphics& g)
{
    g.fillAll (colours::windowBg);

    const Layout layout (getLocalBounds());

    auto panel = [&] (juce::Rectangle<int> r, juce::Colour fill)
    {
        g.setColour (colours::border);
        g.fillRect (r);
        g.setColour (fill);
        g.fillRect (r.reduced (1));
    };

    // Device title bar.
    g.setColour (colours::raised);
    g.fillRect (layout.title);
    g.setColour (colours::border);
    g.fillRect (layout.title.withTop (layout.title.getBottom() - 1));

    auto title = layout.title.withTrimmedLeft (32).withTrimmedRight (10);
    g.setColour (colours::text);
    g.setFont (ui::font (12.0f, true));
    g.drawText ("Scale Snap", title.removeFromLeft (90), juce::Justification::centredLeft);

    g.setFont (ui::font (12.0f));
    const int summaryW = juce::roundToInt (juce::GlyphArrangement::getStringWidth (juce::Font (ui::font (12.0f)), summaryText)) + 4;
    g.setColour (colours::text);
    g.drawText (summaryText, title.removeFromRight (summaryW), juce::Justification::centredRight);
    title.removeFromRight (8);
    g.setColour (colours::dimText);
    g.setFont (ui::font (9.0f, true));
    g.drawText ("KEY SCALE", title.removeFromRight (60), juce::Justification::centredRight);

    // Browser, controls, list.
    panel (layout.sidebar, colours::panel);
    panel (layout.controls, colours::panel);
    panel (layout.list, colours::panel);

    g.setColour (colours::border);
    g.fillRect (layout.sidebar.getX() + 1, layout.sidebar.getY() + 36, layout.sidebar.getWidth() - 2, 1);

    const ControlRects rects (layout.controls);
    g.setColour (colours::dimText);
    g.setFont (ui::font (9.0f, true));
    g.drawText ("KEY", rects.keyLabel, juce::Justification::bottomLeft);
    g.drawText ("SCALE", rects.scaleLabel, juce::Justification::bottomLeft);
    g.drawText ("CORRECTION", rects.modeLabel, juce::Justification::bottomLeft);
    g.drawText ("CHORDS", rects.chordLabel, juce::Justification::bottomLeft);

    // Current scale: name and notes, then what it sounds like.
    panel (layout.info, colours::panel);
    auto info = layout.info.reduced (10, 5);
    auto line1 = info.removeFromTop (16);

    g.setFont (ui::font (13.0f, true));
    g.setColour (colours::text);
    const int nameW = juce::roundToInt (juce::GlyphArrangement::getStringWidth (juce::Font (ui::font (13.0f, true)), summaryText)) + 18;
    g.drawText (summaryText, line1.removeFromLeft (nameW), juce::Justification::centredLeft);
    g.setColour (colours::orange);
    g.setFont (ui::font (13.0f));
    g.drawText (notesText, line1, juce::Justification::centredLeft);

    g.setColour (colours::dimText);
    g.setFont (ui::font (11.0f));
    g.drawText (infoText, info.removeFromTop (16), juce::Justification::centredLeft, true);

    // Legend and routing tip.
    auto legend = layout.legend;
    g.setFont (ui::font (10.0f));

    auto legendItem = [&] (int textWidth, const juce::String& text, std::function<void (juce::Rectangle<float>)> swatch)
    {
        swatch (legend.removeFromLeft (10).toFloat().withSizeKeepingCentre (9.0f, 9.0f));
        legend.removeFromLeft (5);
        g.setColour (colours::dimText);
        g.drawText (text, legend.removeFromLeft (textWidth), juce::Justification::centredLeft);
        legend.removeFromLeft (8);
    };

    auto dot = [&] (juce::Colour c)
    {
        return [&g, c] (juce::Rectangle<float> r) { g.setColour (c); g.fillEllipse (r); };
    };

    legendItem (92, "played (in scale)", dot (juce::Colour (0xfff4f4f4)));
    legendItem (104, "played (corrected)", dot (colours::red));
    legendItem (90, "note sent out", [&g] (juce::Rectangle<float> r) { g.setColour (colours::orange); g.fillRect (r); });
    legendItem (72, "in scale", [&g] (juce::Rectangle<float> r) { g.setColour (whiteKeyInKey); g.fillRect (r); });
    legendItem (50, "root", [&g] (juce::Rectangle<float> r) { g.setColour (whiteKeyRoot); g.fillRect (r); });

    g.setColour (colours::dimText);
    g.drawText (juce::String::fromUTF8 ("To record: another track's MIDI From \xe2\x86\x92 this track \xe2\x86\x92 Scale Snap"),
                legend, juce::Justification::centredRight);
}

void ScaleSnapEditor::resized()
{
    const Layout layout (getLocalBounds());

    power.setBounds (layout.title.getX() + 7, layout.title.getY() + 3, 18, 16);

    auto sidebarArea = layout.sidebar.reduced (1);
    search.setBounds (sidebarArea.removeFromTop (35).reduced (6, 5));
    sidebarArea.removeFromTop (1);
    sidebar.setBounds (sidebarArea.reduced (0, 2));

    const ControlRects rects (layout.controls);
    keyRow.setBounds (rects.key);
    modeRow.setBounds (rects.mode);
    chordRow.setBounds (rects.chord);

    auto scaleArea = rects.scale;
    const int button = 26;
    previousButton.setBounds (scaleArea.removeFromLeft (button));
    scaleArea.removeFromLeft (3);
    starButton.setBounds (scaleArea.removeFromRight (button));
    scaleArea.removeFromRight (3);
    nextButton.setBounds (scaleArea.removeFromRight (button));
    scaleArea.removeFromRight (3);
    scaleName.setBounds (scaleArea);

    scaleList.setBounds (layout.list.reduced (1));
    keyboard.setBounds (layout.keyboard);
}
