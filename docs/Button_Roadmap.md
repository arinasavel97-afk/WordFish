# WordFish Button Migration Roadmap

Version: 1.0

This document tracks the migration from the legacy button system to the official WordFish Button System.

It is a development checklist.

The goal is to replace all legacy button styles with reusable WordFish button components without breaking existing functionality.

---

# Migration Status

Legend

- ⬜ Not started
- 🟨 In progress
- ✅ Completed

---

# Phase 1 — CTA

Status: 🟨 In Progress

Goal:

Create the official CTA component that will become the foundation of the entire application.

Variants:

- Primary
- Secondary
- Danger
- Neutral

---

## Primary

Purpose

Main positive actions.

Buttons

- ✅ Play
- ✅ New Set
- ✅ Classroom Mode
- ✅ Copy Link
- ⬜ Choose Activity
- ⬜ Start
- ⬜ Next

---

## Secondary

Purpose

Alternative actions.

Buttons

- ✅ Share

---

## Danger

Purpose

Destructive actions.

Buttons

- ✅ Delete
- ✅ Delete Forever

---

## Neutral

Purpose

Utility actions.

Buttons

- ✅ Cancel
- ✅ Import Excel
- ⬜ Select
- ⬜ Share dialog Close
- ⬜ Back to Dashboard
- ⬜ Back to Set Picker
- ⬜ Previous

---

# Phase 2 — Accent CTA

Status: ⬜ Not Started

Purpose

Mode selection.

Buttons

- ⬜ Play with Translation
- ⬜ Play with Pictures

Requirements

- Same geometry as CTA
- Warm yellow gradient
- Not a Primary CTA
- Must support future game mode buttons

---

# Phase 3 — Toolbar

Status: 🟨 In Progress

Buttons

- ✅ Back
- ✅ Fullscreen

Requirements

- Separate component
- No colorful gradients
- Compact layout
- 40 × 40 px or compact text variant for Back

---

# Phase 4 — Toggle

Status: 🟨 In Progress

Variants

- Icon Toggle
- Text Toggle

---

## Icon Toggle

Buttons

- ✅ Shuffle
- ✅ Loop

Requirements

- Toolbar geometry
- Active state with Primary green gradient
- Not CTA buttons

---

## Text Toggle

Buttons

- ⬜ Show Translation
- ⬜ Hide Translation

Requirements

- Labeled toggle in footer or content area
- Active or pressed-on state when mode enabled
- Not CTA buttons

---

# Phase 5 — Icon Buttons

Status: ✅ Completed

Buttons

- ✅ Edit
- ✅ Export
- ✅ Favorite
- ✅ Restore Icon
- ✅ Delete Icon
- ✅ Drag Handle

Requirements

- 40×40 px
- Square
- Icon only
- Subtle hover
- No CTA shadows

---

# Phase 6 — Close Buttons

Status: ✅ Completed

Buttons

- ✅ Modal Close (X)

Requirements

- Circular
- 40×40 px
- No gradients
- No CTA styling

---

# Phase 7 — Legacy Cleanup

Status: ⬜ Not Started

Tasks

- ⬜ Remove global button styles
- ⬜ Remove legacy .green-button
- ⬜ Remove legacy .red-button
- ⬜ Remove legacy .soft-button
- ⬜ Remove legacy .yellow-button
- ⬜ Remove duplicated button styles
- ⬜ Replace with official WordFish components

---

# Files

Current

style.css

Future

css/
└── buttons/
    ├── button-base.css
    ├── button-cta.css
    ├── button-accent.css
    ├── button-toolbar.css
    ├── button-toggle.css
    ├── button-icon.css
    ├── button-close.css
    └── button-layout.css

---

# Rules

Never redesign a button in isolation.

Always determine:

1. Which component group it belongs to.
2. Which variant it should use.
3. Whether an existing component can be reused.

If not, update Button_System.md before writing CSS.

---

# Progress Log

## v1

- ✅ Official button architecture approved
- ✅ Component groups defined (CTA, Toolbar, Icon, Close)
- 🟨 CTA Play prototype started

## v2

- ✅ Architecture expanded to six components (CTA, Accent CTA, Toolbar, Toggle, Icon, Close)
- ✅ CTA Primary prototypes: Play, New Set, Classroom Mode, Copy Link
- ✅ CTA Secondary prototype: Share
- ✅ CTA Danger prototypes: Delete, Delete Forever
- ✅ CTA Neutral prototypes: Cancel, Import Excel
- ✅ Toolbar prototypes: Back, Fullscreen
- ✅ Toggle Icon prototypes: Shuffle, Loop
- ✅ Icon Button prototypes: Favorite, Drag, Edit, Export, Delete icon, Restore icon
- ✅ Close Button prototype: Modal X
- ⬜ Accent CTA: Play with Translation, Play with Pictures
- ⬜ Toggle Text: Show Translation / Hide Translation
- ⬜ Remaining CTA Neutral: Select, Share dialog Close, classroom screen navigation, Previous
- ⬜ Remaining CTA Primary: Choose Activity, Start, Next

Future milestones should be recorded here.
