# Dashboard v2 Specification

Status: Approved Target Design

---

# Purpose

The Dashboard is the main screen of WordFish.

It should immediately communicate:

- create vocabulary
- organize vocabulary
- play games

The Dashboard should feel:

- calm
- playful
- modern
- ocean-inspired
- easy to scan

Editing is a secondary task.
Playing is always the primary task.

---

# General Layout

The screen consists of two areas.

LEFT

- Sidebar

RIGHT

- Header
- Primary Actions
- Library Toolbar
- Set Cards
- Empty State

---

# Sidebar

A fixed left sidebar.

Contents:

Logo area

- WordFish logo
- Teacher Dashboard

Navigation

- My Sets
- Shared with Me
- Favorites
- Trash

Divider

Utilities

- Settings
- Help

Bottom

- Log Out

Style

- White panel
- Rounded corners
- Soft shadow
- Ocean background visible around it

---

# Header

Main title

Welcome back! 👋

Subtitle

Create vocabulary sets and play ocean-style word games.

Top-right buttons

- Classroom Mode
- New Set

There is no Settings button here.

Settings lives inside the sidebar.

No decorative hero banner.

No duplicate WordFish titles.

---

# Primary Actions

Top-right only.

Buttons

Primary

- Classroom Mode

Primary

- New Set

Import Excel is moved to the Empty State.

---

# Library Toolbar

One rounded white container.

Order

1. Search
2. View Selector
3. Sort
4. Select

Search occupies most of the width.

View Selector

- All Sets
- Favorites
- Trash

Future implementation may replace this with a Segmented Control.

Sort remains a dropdown.

Select remains a Neutral CTA.

Toolbar width matches the card grid.

---

# Set Grid

Responsive grid.

Desktop

4 columns

Tablet

2–3 columns

Mobile

1 column

Cards remain centered.

---

# Set Card

Top Row

★ Favorite

⋮⋮ Drag Handle

⋯ Overflow Menu

Favorite

Always visible.

Drag

Visible only while Custom Sort is active.

Overflow menu contains

- Edit
- Duplicate
- Export
- Delete

Delete is always the final menu item.

---

# Color Strip

Every card has a thin colored strip across the top.

No image thumbnails.

Each set receives an accent color.

Examples

- Blue
- Green
- Purple
- Orange
- Pink

The strip helps visual recognition.

---

# Title

Large bold title.

Example

Animals

---

# Metadata

Single line only.

Example

27 words • 18 images

Do NOT display

- Last edited
- Ready to play

---

# Actions

Bottom row.

Left

Play

Primary CTA

Right

Share

Secondary CTA

Purple gradient.

Both buttons stay visible.

---

# Empty State

Centered card.

Contains

Treasure Chest illustration.

Heading

No sets yet

Description

Create your first vocabulary set
or import from Excel.

Buttons

- New Set
- Import Excel

---

# Background

Ocean-inspired.

Soft aqua gradient.

Bottom corners

Decorative corals.

Bottom-left

Treasure chest integrated into the scenery.

Small bubbles are allowed.

Background must never distract from content.

---

# Color Palette

Background

Soft Aqua

Cards

White

Sidebar

White

Toolbar

White

Primary

Green

Secondary

Purple

Neutral

White / Aqua

Danger

Red

---

# Responsive

Desktop

Sidebar visible.

Tablet

Collapsible sidebar.

Mobile

Hamburger menu.

Toolbar stacks vertically.

Cards become one column.

---

# Accessibility

Keyboard navigation.

Visible focus states.

Minimum touch target

44px

All icon buttons have aria-label.

---

# Design Principles

Visual priority

1. Content
2. Play
3. Navigation
4. Editing

Editing should never be visually stronger than Playing.

The Dashboard should feel light, uncluttered, and inviting.

---

# Approved Visual Reference

The approved Dashboard reference includes:

- Left navigation sidebar
- Compact Welcome header
- Classroom Mode and New Set buttons in the top-right
- White toolbar with Search, View Selector, Sort, and Select
- Card grid without image thumbnails
- Thin colored strip at the top of each card
- Favorite star
- Drag handle
- Overflow menu
- Green Play button
- Purple Share button
- Ocean background with corals
- Treasure chest integrated into the bottom-left scenery

This visual reference is the target implementation.

---

# Definition of Done

The Dashboard redesign is complete when it includes:

✓ Sidebar

✓ Compact Header

✓ Primary Actions

✓ Library Toolbar

✓ New Card Layout

✓ Overflow Menu

✓ Empty State

✓ Responsive Layout

✓ Ocean Background

✓ Treasure Chest

✓ WordFish Button System

✓ Semantic HTML

✓ Accessibility