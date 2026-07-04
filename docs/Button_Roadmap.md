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

# Phase 1 — CTA Button

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

- 🟨 Play
- ⬜ New Set
- ⬜ Copy Link
- ⬜ Start
- ⬜ Next
- ⬜ Restore

---

## Secondary

Purpose

Alternative actions.

Buttons

- ⬜ Share

---

## Danger

Purpose

Destructive actions.

Buttons

- ⬜ Delete
- ⬜ Delete Forever

---

## Neutral

Purpose

Utility actions.

Buttons

- ⬜ Cancel
- ⬜ Import Excel

---

# Phase 2 — Toolbar Buttons

Status: ⬜ Not Started

Buttons

- ⬜ Back
- ⬜ Fullscreen
- ⬜ Shuffle
- ⬜ Loop

Requirements

- Separate component
- No colorful gradients
- Compact layout
- Toggle support
- Active state

---

# Phase 3 — Icon Buttons

Status: ⬜ Not Started

Buttons

- ⬜ Edit
- ⬜ Export
- ⬜ Favorite
- ⬜ Restore Icon
- ⬜ Delete Icon
- ⬜ Drag Handle

Requirements

- 40×40 px
- Square
- Icon only
- Subtle hover
- No CTA shadows

---

# Phase 4 — Close Buttons

Status: ⬜ Not Started

Buttons

- ⬜ Modal Close (X)

Requirements

- Circular
- 40×40 px
- No gradients
- No CTA styling

---

# Phase 5 — Legacy Cleanup

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
    ├── button-toolbar.css
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
- ✅ Component groups defined
- 🟨 CTA Play prototype started

Future milestones should be recorded here.