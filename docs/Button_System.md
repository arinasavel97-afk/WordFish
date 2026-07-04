# WordFish Button System

Version: 1.0

This document defines the official button system for the WordFish platform.

It is the single source of truth for all buttons.

No new button styles should be introduced outside this specification.

---

# Design Principles

Buttons must look:

- friendly
- premium
- playful
- clean
- modern
- highly readable

The style should match the official WordFish visual identity.

Buttons use soft gradients, subtle depth and rounded corners.

No glassmorphism.

No neumorphism.

No heavy shadows.

No glossy plastic effects.

No exaggerated animations.

---

# Component Groups

WordFish contains exactly six button components.

1. CTA
2. Accent CTA
3. Toolbar
4. Toggle
5. Icon
6. Close

No additional button types should be created.

---

# CTA

Purpose:

Primary actions.

CTA contains four variants:

- Primary
- Secondary
- Danger
- Neutral

All CTA buttons use exactly the same geometry.

Only colors change.

CTA buttons are NOT Toolbar buttons.

CTA buttons are NOT Toggle buttons.

---

## Geometry

Height

48 px

Border radius

14 px

Horizontal padding

24 px

Font

Baloo 2

Font weight

700

Font size

17 px

Icon size

18 px

Gap between icon and text

8 px

---

## Visual Style

Soft vertical gradient.

Thin 1 px border.

Small glossy highlight on the top.

Soft dark shading on the bottom.

Soft blurred shadow.

No thick bottom platform.

---

## States

Default

Hover

Pressed

Disabled

Focus

Every CTA button must support all five states.

---

## Variants

### Primary

Purpose

Main positive action.

Examples

- Play
- New Set
- Classroom Mode
- Copy Link
- Choose Activity
- Start
- Next

Gradient

Top

#75DC58

Bottom

#16AE4A

---

### Secondary

Purpose

Alternative action.

Examples

- Share

Gradient

Top

#B36DE7

Bottom

#7D3BD9

---

### Danger

Purpose

Destructive actions.

Examples

- Delete
- Delete Forever

Gradient

Top

#FA574D

Bottom

#EC2B2D

---

### Neutral

Purpose

Secondary utility actions.

Examples

- Cancel
- Import Excel
- Select
- Share dialog Close
- Back to Dashboard
- Back to Set Picker
- Previous

Light gray / aqua palette.

---

# Accent CTA

Purpose:

Mode selection.

Examples:

- Play with Translation
- Play with Pictures

Accent CTA uses a warm yellow gradient.

This is NOT a Primary CTA.

This component should later support future game mode buttons.

Accent CTA uses the same geometry as CTA buttons.

Only the color palette differs.

---

## Accent Gradient

Top

Warm yellow (design token)

Bottom

Deeper yellow (design token)

Legacy class today:

`.yellow-button`

---

# Toolbar

Purpose

Header controls inside classroom screens.

Examples

- Back
- Fullscreen

Toolbar buttons are NOT CTA buttons.

Toolbar buttons never use colorful gradients.

Toolbar buttons use:

- subtle background
- thin border
- small shadow
- compact size

Height

40 px

Border radius

12 px

---

# Toggle

Purpose:

Enable / disable application modes.

Toggle buttons are not CTA buttons.

Toggle buttons are not Toolbar navigation buttons.

Contains two variants.

---

## Icon Toggle

Purpose

Compact header toggles with icon and optional label.

Examples

- Shuffle
- Loop

Icon Toggle uses Toolbar geometry.

Icon Toggle supports an active state with Primary green gradient when enabled.

---

## Text Toggle

Purpose

Labeled mode toggles in content or footer areas.

Examples

- Show Translation
- Hide Translation

Text Toggle uses larger layout context than Icon Toggle.

Text Toggle may change label when state changes.

Text Toggle supports an active or pressed-on state when the mode is enabled.

---

# Icon Button

Purpose

Icon-only actions.

Examples

Edit

Export

Favorite

Restore

Delete

Drag

Shape

Square

Size

40 × 40 px

Border radius

12 px

No text.

No CTA shadows.

Hover uses only subtle background color changes.

---

# Close Button

Purpose

Dismiss dialogs.

Example

Modal X

Always circular.

Size

40 × 40 px

No gradients.

No colorful backgrounds.

Uses only subtle hover feedback.

Must never inherit CTA styles.

---

# Colors

Primary

Top

#75DC58

Bottom

#16AE4A

Secondary

Top

#B36DE7

Bottom

#7D3BD9

Danger

Top

#FA574D

Bottom

#EC2B2D

Neutral

Defined by design tokens.

Accent

Warm yellow gradient (mode selection).

Defined by design tokens.

---

# Motion

Hover

Lift

1 px

Pressed

Move down

2 px

Transitions

150–180 ms

Ease-out.

No bounce.

---

# Accessibility

Every button must support:

- keyboard focus
- disabled state
- visible focus ring
- ARIA labels for icon-only buttons

---

# Implementation Rules

Never style the global `button` selector.

Always use component classes.

Preferred structure:

CTA

```
.wf-button
.wf-button--primary
.wf-button--secondary
.wf-button--danger
.wf-button--neutral
```

Accent CTA

```
.wf-button
.wf-button--accent
```

Toolbar

```
.wf-toolbar-button
```

Toggle

```
.wf-toggle-button
.wf-toggle-button--icon
.wf-toggle-button--text
.wf-toggle-button--active
```

Icon

```
.wf-icon-button
```

Close

```
.wf-close-button
```

---

# Future Rule

When creating a new button:

1. Determine its component group.
2. Reuse an existing variant.
3. Do not invent a new style.
4. If a new style seems necessary, update this document first.