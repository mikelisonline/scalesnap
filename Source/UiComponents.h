#pragma once

// Small, flat widgets used by the editor. The look follows a dark "native device" style:
// boxy controls, 1px dark borders, orange for on/active, cyan for the selected list row.

#include <juce_gui_basics/juce_gui_basics.h>
#include <functional>
#include <vector>

#include "Favorites.h"
#include "ScaleLibrary.h"

namespace ui
{
//==============================================================================
namespace colours
{
const juce::Colour windowBg { 0xff1e1e1e };
const juce::Colour panel    { 0xff2b2b2b };
const juce::Colour panelAlt { 0xff272727 };
const juce::Colour raised   { 0xff3a3a3a };
const juce::Colour hover    { 0xff454545 };
const juce::Colour rowHover { 0xff353535 };
const juce::Colour border   { 0xff121212 };
const juce::Colour text     { 0xffcfcfcf };
const juce::Colour dimText  { 0xff8c8c8c };
const juce::Colour orange   { 0xffffa21a };
const juce::Colour cyan     { 0xff4ac4dc };
const juce::Colour red      { 0xffff5a4a };
const juce::Colour onAccent { 0xff1a1a1a }; // text on top of orange / cyan
} // namespace colours

inline juce::FontOptions font (float height, bool bold = false)
{
    return juce::FontOptions (height, bold ? juce::Font::bold : juce::Font::plain);
}

/** Draws a five pointed star centred in `area`. */
inline void drawStar (juce::Graphics& g, juce::Rectangle<float> area, bool filled, juce::Colour colour)
{
    juce::Path star;
    const float outer = juce::jmin (area.getWidth(), area.getHeight()) * 0.5f;
    star.addStar (area.getCentre(), 5, outer * 0.42f, outer, 0.0f);

    g.setColour (colour);
    if (filled)
        g.fillPath (star);
    else
        g.strokePath (star, juce::PathStrokeType (1.0f, juce::PathStrokeType::mitered));
}

//==============================================================================
class LiveLookAndFeel : public juce::LookAndFeel_V4
{
public:
    LiveLookAndFeel()
    {
        setColour (juce::PopupMenu::backgroundColourId, colours::raised);
        setColour (juce::PopupMenu::textColourId, colours::text);
        setColour (juce::PopupMenu::highlightedBackgroundColourId, colours::cyan);
        setColour (juce::PopupMenu::highlightedTextColourId, colours::onAccent);
        setColour (juce::TooltipWindow::backgroundColourId, colours::raised);
        setColour (juce::TooltipWindow::textColourId, colours::text);
        setColour (juce::TooltipWindow::outlineColourId, colours::border);
        setColour (juce::ScrollBar::thumbColourId, colours::hover);
        setColour (juce::TextEditor::backgroundColourId, colours::windowBg);
        setColour (juce::TextEditor::textColourId, colours::text);
        setColour (juce::TextEditor::outlineColourId, colours::border);
        setColour (juce::TextEditor::focusedOutlineColourId, colours::cyan);
        setColour (juce::TextEditor::highlightColourId, colours::cyan.withAlpha (0.45f));
        setColour (juce::TextEditor::highlightedTextColourId, colours::text);
        setColour (juce::TextEditor::shadowColourId, juce::Colours::transparentBlack);
        setColour (juce::CaretComponent::caretColourId, colours::orange);
    }

    int getDefaultScrollbarWidth() override { return 9; }

    void drawScrollbar (juce::Graphics& g, juce::ScrollBar&, int x, int y, int width, int height,
                        bool isVertical, int thumbStart, int thumbSize, bool isOver, bool isDown) override
    {
        g.setColour (colours::windowBg.withAlpha (0.55f));
        g.fillRect (x, y, width, height);

        const auto thumb = isVertical ? juce::Rectangle<int> (x + 2, thumbStart, width - 4, thumbSize)
                                      : juce::Rectangle<int> (thumbStart, y + 2, thumbSize, height - 4);
        g.setColour (isDown ? colours::orange : (isOver ? juce::Colour (0xff5a5a5a) : colours::hover));
        g.fillRect (thumb);
    }

    void drawTextEditorOutline (juce::Graphics& g, int width, int height, juce::TextEditor& editor) override
    {
        g.setColour (editor.findColour (editor.hasKeyboardFocus (true) ? juce::TextEditor::focusedOutlineColourId
                                                                       : juce::TextEditor::outlineColourId));
        g.drawRect (0, 0, width, height, 1);
    }
};

//==============================================================================
/** A row of selectable cells: either joined into a segmented button, or spaced out like the
    key selector. Exactly one cell is selected; the owner is told when the user picks one. */
class OptionRow : public juce::Component, public juce::TooltipClient
{
public:
    enum class Style { joined, spaced };

    explicit OptionRow (Style s) : style (s) {}

    void setLabels (const juce::StringArray& newLabels, const juce::StringArray& newTips = {})
    {
        labels = newLabels;
        tips = newTips;
        repaint();
    }

    /** Cells listed here are drawn slightly darker (the black keys of the key selector). */
    void setDarkCells (std::vector<bool> darkFlags) { dark = std::move (darkFlags); repaint(); }

    void setSelected (int index)
    {
        if (index != selected)
        {
            selected = index;
            repaint();
        }
    }

    int getSelected() const noexcept { return selected; }

    std::function<void (int)> onSelect;

    juce::String getTooltip() override
    {
        return juce::isPositiveAndBelow (hovered, tips.size()) ? tips[hovered] : juce::String();
    }

    void paint (juce::Graphics& g) override
    {
        const int n = labels.size();
        if (n == 0)
            return;

        if (style == Style::joined)
        {
            g.setColour (colours::border);
            g.fillRect (getLocalBounds());
        }

        for (int i = 0; i < n; ++i)
        {
            auto r = cellBounds (i);

            if (style == Style::spaced)
            {
                g.setColour (colours::border);
                g.fillRect (r);
                r = r.reduced (1);
            }

            const bool isSelected = i == selected;
            const bool isDark = (size_t) i < dark.size() && dark[(size_t) i];

            g.setColour (isSelected ? colours::orange
                                    : i == hovered ? colours::hover
                                                   : isDark ? juce::Colour (0xff303030) : colours::raised);
            g.fillRect (r);

            g.setColour (isSelected ? colours::onAccent : colours::text);
            g.setFont (font (11.0f, isSelected));
            g.drawText (labels[i], r, juce::Justification::centred, false);
        }
    }

    void mouseMove (const juce::MouseEvent& e) override { setHovered (indexAt (e.x)); }
    void mouseExit (const juce::MouseEvent&) override { setHovered (-1); }

    void mouseDown (const juce::MouseEvent& e) override
    {
        const int index = indexAt (e.x);
        if (index < 0)
            return;

        setSelected (index);
        if (onSelect)
            onSelect (index);
    }

private:
    int indexAt (int x) const
    {
        const int n = labels.size();
        return n == 0 || getWidth() == 0 ? -1 : juce::jlimit (0, n - 1, x * n / getWidth());
    }

    void setHovered (int index)
    {
        if (index != hovered)
        {
            hovered = index;
            repaint();
        }
    }

    juce::Rectangle<int> cellBounds (int i) const
    {
        const int n = labels.size();
        const int gap = style == Style::joined ? 1 : 3;
        const auto area = style == Style::joined ? getLocalBounds().reduced (1) : getLocalBounds();
        const float step = (float) (area.getWidth() + gap) / (float) n;

        const int x0 = area.getX() + juce::roundToInt ((float) i * step);
        const int x1 = area.getX() + juce::roundToInt ((float) (i + 1) * step) - gap;
        return { x0, area.getY(), x1 - x0, area.getHeight() };
    }

    Style style;
    juce::StringArray labels, tips;
    std::vector<bool> dark;
    int selected = -1, hovered = -1;
};

//==============================================================================
/** The round on/off switch at the left of the device title bar. */
class PowerButton : public juce::Component, public juce::SettableTooltipClient
{
public:
    void setOn (bool shouldBeOn)
    {
        if (shouldBeOn != on)
        {
            on = shouldBeOn;
            repaint();
        }
    }

    bool isOn() const noexcept { return on; }

    std::function<void (bool)> onToggle;

    void paint (juce::Graphics& g) override
    {
        const auto circle = getLocalBounds().toFloat().withSizeKeepingCentre (14.0f, 14.0f);

        g.setColour (colours::border);
        g.fillEllipse (circle.expanded (1.0f));

        auto fill = on ? colours::orange : juce::Colour (0xff4a4a4a);
        if (over)
            fill = fill.brighter (0.15f);
        g.setColour (fill);
        g.fillEllipse (circle);

        // Power symbol: an open ring with a stroke through the gap.
        const auto c = circle.getCentre();
        juce::Path arc;
        arc.addCentredArc (c.x, c.y, 3.6f, 3.6f, 0.0f, 0.65f, juce::MathConstants<float>::twoPi - 0.65f, true);
        arc.startNewSubPath (c.x, c.y - 4.4f);
        arc.lineTo (c.x, c.y - 0.6f);
        g.setColour (on ? colours::onAccent : colours::dimText);
        g.strokePath (arc, juce::PathStrokeType (1.4f, juce::PathStrokeType::curved, juce::PathStrokeType::rounded));
    }

    void mouseEnter (const juce::MouseEvent&) override { over = true; repaint(); }
    void mouseExit (const juce::MouseEvent&) override { over = false; repaint(); }

    void mouseUp (const juce::MouseEvent& e) override
    {
        if (e.mouseWasClicked() && contains (e.getPosition()) && onToggle)
            onToggle (! on);
    }

private:
    bool on = true, over = false;
};

//==============================================================================
/** Flat square button with an icon: a previous/next arrow or a favourite star. */
class IconButton : public juce::Button
{
public:
    enum class Icon { previous, next, star };

    explicit IconButton (Icon i) : juce::Button ({}), icon (i) {}

    void setStarred (bool shouldBeStarred)
    {
        if (starred != shouldBeStarred)
        {
            starred = shouldBeStarred;
            repaint();
        }
    }

    void paintButton (juce::Graphics& g, bool isOver, bool isDown) override
    {
        auto r = getLocalBounds();
        g.setColour (colours::border);
        g.fillRect (r);
        r.reduce (1, 1);

        g.setColour (isDown ? colours::hover.brighter (0.1f) : isOver ? colours::hover : colours::raised);
        g.fillRect (r);

        const auto centre = r.toFloat().getCentre();

        if (icon == Icon::star)
        {
            drawStar (g, juce::Rectangle<float> (13.0f, 13.0f).withCentre (centre), starred,
                      starred ? colours::orange : colours::text);
        }
        else
        {
            const float dir = icon == Icon::next ? 1.0f : -1.0f;
            juce::Path tri;
            tri.addTriangle (centre.x - 3.0f * dir, centre.y - 4.5f,
                             centre.x - 3.0f * dir, centre.y + 4.5f,
                             centre.x + 3.5f * dir, centre.y);
            g.setColour (colours::text);
            g.fillPath (tri);
        }
    }

private:
    Icon icon;
    bool starred = false;
};

/** Recessed, read-only box (shows the current scale's name between the arrow buttons). */
class ReadoutBox : public juce::Component
{
public:
    void setText (const juce::String& newText)
    {
        if (newText != content)
        {
            content = newText;
            repaint();
        }
    }

    void paint (juce::Graphics& g) override
    {
        auto r = getLocalBounds();
        g.setColour (colours::border);
        g.fillRect (r);
        g.setColour (colours::windowBg);
        g.fillRect (r.reduced (1));

        g.setColour (colours::text);
        g.setFont (font (12.0f, true));
        g.drawText (content, r.reduced (8, 0), juce::Justification::centred, true);
    }

private:
    juce::String content;
};

//==============================================================================
/** Base for the two browser lists: a ListBox with a tracked hover row. */
class ListPanel : public juce::Component, protected juce::ListBoxModel
{
public:
    static constexpr int rowHeight = 22;

    ListPanel()
    {
        box.setRowHeight (rowHeight);
        box.setOutlineThickness (0);
        box.setColour (juce::ListBox::backgroundColourId, juce::Colours::transparentBlack);
        box.getVerticalScrollBar().setAutoHide (true);
        box.addMouseListener (this, true);
        addAndMakeVisible (box);
    }

    ~ListPanel() override { box.removeMouseListener (this); }

    void mouseMove (const juce::MouseEvent& e) override
    {
        const auto p = e.getEventRelativeTo (&box).getPosition();
        setHoverRow (box.getRowContainingPosition (p.x, p.y));
    }

    void mouseExit (const juce::MouseEvent&) override { setHoverRow (-1); }

protected:
    /** Derived classes call this at the end of their constructor (the model must be complete). */
    void attachModel() { box.setModel (this); }

    void setHoverRow (int row)
    {
        if (row != hoverRow)
        {
            box.repaintRow (hoverRow);
            hoverRow = row;
            box.repaintRow (hoverRow);
        }
    }

    juce::ListBox box;
    int hoverRow = -1;
};

//==============================================================================
/** Left-hand collections list: "Favorites", then "All" and one row per category. */
class SidebarList : public ListPanel
{
public:
    static constexpr int favoritesFilter = -2;
    static constexpr int allFilter = -1;

    SidebarList()
    {
        for (auto* c : scalesnap::getCategories())
            categories.add (c);
        categoryCounts.assign ((size_t) categories.size(), 0);
        attachModel();
    }

    void setCounts (int total, int favourites, const std::vector<int>& perCategory)
    {
        totalCount = total;
        favouriteCount = favourites;
        categoryCounts = perCategory;
        box.repaint();
    }

    void setFilter (int newFilter)
    {
        filter = newFilter;
        box.repaint();
    }

    int getFilter() const noexcept { return filter; }

    std::function<void (int)> onFilterChanged;

    void resized() override { box.setBounds (getLocalBounds()); }

private:
    // Row layout: 0 header, 1 favourites, 2 header, 3 all, 4.. categories.
    static constexpr int notAFilter = -1000;

    static int filterForRow (int row)
    {
        if (row == 1) return favoritesFilter;
        if (row == 3) return allFilter;
        if (row >= 4) return row - 4;
        return notAFilter;
    }

    int getNumRows() override { return 4 + categories.size(); }

    void paintListBoxItem (int row, juce::Graphics& g, int width, int height, bool) override
    {
        const juce::Rectangle<int> area (0, 0, width, height);

        if (row == 0 || row == 2)
        {
            g.setColour (colours::dimText);
            g.setFont (font (10.0f, true));
            g.drawText (row == 0 ? "COLLECTIONS" : "CATEGORIES", area.withTrimmedLeft (10).withTrimmedTop (4),
                        juce::Justification::centredLeft);
            return;
        }

        const int rowFilter = filterForRow (row);
        const bool selected = rowFilter == filter;

        if (selected)
        {
            g.setColour (colours::raised);
            g.fillRect (area);
            g.setColour (colours::cyan);
            g.fillRect (area.withWidth (2));
        }
        else if (row == hoverRow)
        {
            g.setColour (colours::rowHover);
            g.fillRect (area);
        }

        const auto textColour = selected ? colours::cyan : colours::text;
        int count = 0;
        juce::String label;
        int indent = 14;

        if (rowFilter == favoritesFilter)
        {
            label = "Favorites";
            count = favouriteCount;
            drawStar (g, juce::Rectangle<float> (11.0f, 11.0f).withCentre ({ 16.0f, (float) height * 0.5f }),
                      true, colours::orange);
            indent = 28;
        }
        else if (rowFilter == allFilter)
        {
            label = "All Scales";
            count = totalCount;
            indent = 28;
        }
        else
        {
            label = categories[rowFilter];
            count = (size_t) rowFilter < categoryCounts.size() ? categoryCounts[(size_t) rowFilter] : 0;
            indent = 28;
        }

        g.setColour (textColour);
        g.setFont (font (12.0f));
        g.drawText (label, area.withTrimmedLeft (indent).withTrimmedRight (40), juce::Justification::centredLeft, true);

        g.setColour (colours::dimText);
        g.setFont (font (11.0f));
        g.drawText (juce::String (count), area.withTrimmedRight (10), juce::Justification::centredRight);
    }

    void listBoxItemClicked (int row, const juce::MouseEvent&) override
    {
        const int newFilter = filterForRow (row);
        if (newFilter == notAFilter)
            return;

        setFilter (newFilter);
        if (onFilterChanged)
            onFilterChanged (newFilter);
    }

    juce::StringArray categories;
    std::vector<int> categoryCounts;
    int totalCount = 0, favouriteCount = 0;
    int filter = allFilter;
};

//==============================================================================
/** The scale list: star | name | category | info. Clicking a row picks the scale, clicking the
    star toggles it as a favourite. */
class ScaleList : public ListPanel
{
public:
    explicit ScaleList (Favorites& f) : favorites (f) { attachModel(); }

    /** `scaleIndices` are positions in scalesnap::getScales(), in display order. */
    void setItems (std::vector<int> scaleIndices, const juce::String& message)
    {
        items = std::move (scaleIndices);
        emptyMessage = message;
        box.updateContent();
        box.repaint();
        repaint();
    }

    void setCurrent (int scaleIndex)
    {
        current = scaleIndex;
        box.repaint();
        scrollToCurrent();
    }

    /** Brings the selected scale into view: if it is off screen it is centred in the list. */
    void scrollToCurrent()
    {
        if (box.getHeight() <= 0)
        {
            scrollPending = true; // not laid out yet: try again from resized()
            return;
        }

        scrollPending = false;

        for (size_t row = 0; row < items.size(); ++row)
        {
            if (items[row] != current)
                continue;

            auto* viewport = box.getViewport();
            const int top = (int) row * rowHeight;
            const int viewTop = viewport->getViewPositionY();

            if (top < viewTop || top + rowHeight > viewTop + viewport->getViewHeight())
                viewport->setViewPosition (0, juce::jmax (0, top - (viewport->getViewHeight() - rowHeight) / 2));

            return;
        }
    }

    void refreshFavorites() { box.repaint(); }

    std::function<void (int)> onPick;

    void resized() override
    {
        auto area = getLocalBounds();
        area.removeFromTop (headerHeight);
        box.setBounds (area);

        if (scrollPending)
            scrollToCurrent();
    }

    void paint (juce::Graphics& g) override
    {
        auto header = getLocalBounds().removeFromTop (headerHeight);
        g.setColour (colours::raised);
        g.fillRect (header);
        g.setColour (colours::border);
        g.fillRect (header.removeFromBottom (1));

        const auto cols = columns (getWidth());
        g.setColour (colours::dimText);
        g.setFont (font (10.0f, true));
        g.drawText ("NAME", cols.name, juce::Justification::centredLeft);
        g.drawText ("CATEGORY", cols.category, juce::Justification::centredLeft);
        g.drawText ("INFO", cols.info, juce::Justification::centredLeft);
    }

    void paintOverChildren (juce::Graphics& g) override
    {
        if (! items.empty())
            return;

        auto area = getLocalBounds().withTrimmedTop (headerHeight).reduced (20);
        g.setColour (colours::dimText);
        g.setFont (font (12.0f));
        g.drawFittedText (emptyMessage, area.withHeight (60).withY (area.getY() + 24),
                          juce::Justification::centredTop, 3);
    }

    static constexpr int headerHeight = 20;

private:
    struct Columns { juce::Rectangle<int> star, name, category, info; };

    static Columns columns (int width)
    {
        const int nameW = juce::jlimit (130, 200, width / 3);
        const int catW = 120;
        Columns c;
        c.star = { 0, 0, 30, rowHeight };
        c.name = { 34, 0, nameW - 4, rowHeight };
        c.category = { 34 + nameW, 0, catW - 4, rowHeight };
        c.info = { 34 + nameW + catW, 0, juce::jmax (0, width - (34 + nameW + catW) - 14), rowHeight };
        return c;
    }

    int getNumRows() override { return (int) items.size(); }

    void paintListBoxItem (int row, juce::Graphics& g, int width, int height, bool) override
    {
        if (! juce::isPositiveAndBelow (row, (int) items.size()))
            return;

        const auto& scale = scalesnap::getScales()[(size_t) items[(size_t) row]];
        const bool isCurrent = items[(size_t) row] == current;
        const bool isFavourite = favorites.isFavorite (scale.id);
        const juce::Rectangle<int> area (0, 0, width, height);

        if (isCurrent)
            g.setColour (colours::cyan);
        else if (row == hoverRow)
            g.setColour (colours::rowHover);
        else
            g.setColour (row % 2 == 0 ? colours::panel : colours::panelAlt);
        g.fillRect (area);

        const auto cols = columns (width);
        const auto primary = isCurrent ? colours::onAccent : colours::text;
        const auto secondary = isCurrent ? colours::onAccent.withAlpha (0.7f) : colours::dimText;

        const auto starColour = isFavourite ? (isCurrent ? colours::onAccent : colours::orange)
                                            : (isCurrent ? colours::onAccent.withAlpha (0.65f) : juce::Colour (0xff6a6a6a));
        drawStar (g, juce::Rectangle<float> (12.0f, 12.0f).withCentre (cols.star.toFloat().getCentre().translated (-2.0f, 0.0f)),
                  isFavourite, starColour);

        g.setColour (primary);
        g.setFont (font (12.0f, isCurrent));
        g.drawText (scale.name, cols.name, juce::Justification::centredLeft, true);

        g.setColour (secondary);
        g.setFont (font (11.0f));
        g.drawText (scale.category, cols.category, juce::Justification::centredLeft, true);
        g.drawText (scale.info, cols.info, juce::Justification::centredLeft, true);
    }

    void listBoxItemClicked (int row, const juce::MouseEvent& e) override
    {
        if (! juce::isPositiveAndBelow (row, (int) items.size()))
            return;

        const int scaleIndex = items[(size_t) row];

        if (e.x < columns (getWidth()).star.getRight())
            favorites.toggle (scalesnap::getScales()[(size_t) scaleIndex].id);
        else if (onPick)
            onPick (scaleIndex);
    }

    Favorites& favorites;
    std::vector<int> items;
    juce::String emptyMessage;
    int current = -1;
    bool scrollPending = false;
};

} // namespace ui
