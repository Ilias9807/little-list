# Little List

Little List is a small, calm, local-first to-do app designed around one simple idea:

> keep it simple enough to be pleasant to use every day.

## Product direction

- browser-first task management
- no user accounts
- no backend required
- no login system
- no account sync
- no productivity gamification
- no complex dashboards or team tools
- focused on projects, tasks, and quick completion

The app is intentionally designed to feel like a digital sticky note or a clean piece of paper, not another productivity platform.

## Current architecture

The app is built with:

- React
- TypeScript
- Vite
- CSS

Data is intentionally kept local to the browser first, and the data model is kept simple so it can later be adapted to:

- IndexedDB
- a Chrome side panel
- a static website deployment

## Local-first philosophy

The app is designed so users can:

- open it in the browser
- keep tasks locally
- close the browser and reopen later
- continue without any account setup

The storage layer is intentionally separated from the UI so it can evolve without affecting the rest of the app.

## Future direction

The project is intended to grow toward:

- a static website at a cheap hosting provider
- a local-first browser experience
- a Chrome extension using the same core task model
- possible import/export backup functionality later

This is not a backend product. It is a simple personal tool that should remain lightweight, calm, and easy to maintain.
