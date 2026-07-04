# WordFish Card System

Version: 1.0  
Status: Draft

This document defines the official card system for WordFish.

Cards are one of the main visual components of the platform.

---

# Purpose

Cards are used to display vocabulary sets, classroom activities, game options, empty states and future dashboard widgets.

Cards should feel:

- clean
- friendly
- soft
- premium
- easy to scan

Cards should never feel:

- crowded
- heavy
- sharp
- messy

---

# Card Types

WordFish uses these card types:

1. Dashboard Set Card
2. Classroom Activity Card
3. Vocabulary Card
4. Empty State Card
5. Modal Card

---

# Dashboard Set Card

Status: In Progress

Used on the teacher dashboard to display vocabulary sets.

Includes:

- favorite icon
- drag handle
- card action icons
- status badge
- set title
- word count
- image count
- Play button
- Share button

---

# Dashboard Set Card States

## Default

Normal active vocabulary set.

## Favorite

Shows filled star icon.

## Imported

Title may include “Imported”.

## Trash

Shows Restore and Delete Forever actions.

## Selected

Used during bulk actions.

## Disabled

Used when actions are unavailable.

---

# Visual Rules

Dashboard cards should use:

- white or very light background
- soft blue border
- large rounded corners
- subtle shadow
- generous padding
- clear hierarchy

Cards should NOT use:

- strong gradients
- dark shadows
- heavy borders
- too many colors
- images as thumbnails for every set

---

# Layout Rules

Top row:

- favorite icon
- drag handle
- edit/export/delete icons

Middle:

- status badge
- title
- metadata

Bottom:

- main actions

Primary action:

Play

Secondary action:

Share

---

# Typography

Title should be the most visually important text.

Metadata should be smaller but still readable.

Buttons should be visually separate from card content.

---

# Actions

Main actions:

- Play
- Share

Icon actions:

- Favorite
- Drag
- Edit
- Export
- Delete
- Restore

Menu actions may later move into a three-dot menu.

---

# Empty / Missing Images

Set cards should not show unique image thumbnails.

Reason:

Vocabulary sets can have very different pictures, which may make the dashboard look visually messy.

Instead, use:

- consistent icon
- set type badge
- color accent
- or no thumbnail

---

# Card Shadows

Cards should have subtle elevation.

No dark shadow.

No hard shadow.

No 3D platform effect.

---

# Border

Cards should use a soft blue border.

The border should support the ocean theme without becoming too bright.

---

# Future Improvements

Possible future improvements:

- three-dot action menu
- hover lift
- selected state
- card skeleton loading
- empty state illustration with Finn
- trash card variant
- mobile optimized layout

---

# Implementation Rule

Do not redesign all cards at once.

Migrate one card type at a time.

Recommended order:

1. Dashboard Set Card
2. Trash Set Card
3. Classroom Activity Card
4. Modal Card
5. Empty State Card