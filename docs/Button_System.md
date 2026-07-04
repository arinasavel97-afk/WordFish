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

WordFish contains exactly four button components.

1. CTA Button
2. Toolbar Button
3. Icon Button
4. Close Button

No additional button types should be created.

---

# CTA Button

Purpose:

Primary actions.

Examples:

- Play
- New Set
- Copy Link
- Share
- Delete
- Cancel

All CTA buttons use exactly the same geometry.

Only colors change.

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

Play

New Set

Copy Link

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

Share

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

Delete

Delete Forever

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

Cancel

Import

Back (outside Classroom)

Light gray / aqua palette.

---

# Toolbar Button

Purpose

Header controls inside classroom screens.

Examples

Back

Fullscreen

Shuffle

Loop

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

Toolbar

```
.wf-toolbar-button
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