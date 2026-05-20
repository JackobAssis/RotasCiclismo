# Copilot Project Context — Cycling System

IMPORTANT:

Before generating, modifying, or suggesting any code for this project, analyze and use ALL files inside the folder:

"Estrutura Base"

This folder contains:

* architecture decisions
* project concepts
* UX ideas
* visual references
* module definitions
* business logic
* system objectives
* technical planning
* roadmap definitions
* project structure references

These files are part of the project's source of truth and MUST guide implementation decisions.

Do NOT ignore them.

Always prioritize consistency with the information documented inside "Estrutura Base".

---

# Project Overview

This project is a modern cycling WebApp/PWA focused on:

* realtime GPS tracking
* cycling navigation
* cinematic ride recording
* HUD overlays
* cycling analytics
* safety systems
* exploration/trail riding

The application should transform the smartphone into an immersive smart cycling dashboard.

The project is mobile-first and highly focused on user experience and visual immersion.

---

# Core Product Philosophy

This is NOT a generic fitness app.

The experience should feel like:

* a cinematic cycling assistant
* a smart cycling dashboard
* a realtime ride tracking system
* an immersive outdoor navigation platform

The visual identity and realtime experience are critical parts of the system.

---

# Main Operational Modes

## GPS Mode

Lightweight navigation mode focused on:

* map navigation
* route tracking
* speed
* compass
* route rendering
* battery efficiency

---

## Record Mode

Immersive mode focused on:

* fullscreen camera
* HUD overlays
* realtime metrics
* cinematic cycling experience
* route visualization
* ride recording support

The environment/trail/path must remain visually dominant.

HUD overlays must be:

* minimal
* elegant
* transparent
* futuristic
* lightweight

Avoid cluttered interfaces.

---

# Architecture Requirements

Use modular architecture.

The project uses:

* feature-based organization
* reusable components
* shared types
* isolated modules
* strict TypeScript

Each feature must remain independent and scalable.

---

# Tech Stack

Frontend:

* React
* Vite
* TypeScript
* TailwindCSS
* shadcn/ui
* Framer Motion
* Zustand
* React Query
* React Router
* PWA

Maps:

* Leaflet
* React Leaflet
* OpenStreetMap

Backend:

* Node.js
* NestJS
* Socket.IO

Database:

* PostgreSQL
* PostGIS
* Prisma ORM

Offline:

* IndexedDB
* Service Workers

Monorepo:

* Turborepo
* PNPM

---

# Project Structure

Use the monorepo structure already defined in the project.

Respect:

* folder organization
* naming conventions
* architecture patterns
* modular separation

Do not create random structures outside established standards.

---

# Main System Modules

Core modules include:

* auth
* gps
* routes
* rides
* camera
* hud
* safety
* analytics
* history
* dashboard

Each module should contain:

* components
* hooks
* services
* stores
* types
* utils

---

# Ride Session Concept

The core entity of the application is:

Ride Session

Everything revolves around realtime ride sessions.

A ride session may include:

* GPS tracking
* route points
* metrics
* HUD updates
* camera mode
* snapshots
* ride analytics

---

# GPS Requirements

Use:
navigator.geolocation.watchPosition()

Features:

* realtime updates
* speed
* heading
* altitude
* tracking persistence
* optimized battery usage

---

# Camera Requirements

Use:
navigator.mediaDevices.getUserMedia()

Features:

* rear camera support
* fullscreen stream
* snapshots
* future recording support

The camera system must remain decoupled from GPS logic.

---

# UI/UX Requirements

Visual identity:

* dark mode
* glassmorphism
* premium outdoor-tech feel
* immersive
* cinematic
* clean futuristic interface

Prioritize:

* readability during cycling
* minimal interactions
* large touch targets
* realtime responsiveness
* low visual pollution

The route/trail/camera must always remain the primary visual focus.

---

# Engineering Principles

Always prioritize:

* performance
* mobile-first
* offline-first
* modularity
* scalability
* low rerendering
* clean architecture
* reusable logic
* maintainability

---

# Development Guidelines

Before implementing any feature:

1. Analyze existing project structure
2. Analyze "Estrutura Base" documentation
3. Reuse existing abstractions whenever possible
4. Respect modular architecture
5. Avoid duplicated logic
6. Keep components isolated and reusable

---

# Initial Development Priorities

1. Foundation setup
2. Authentication
3. GPS engine
4. Map rendering
5. Ride session engine
6. HUD system
7. Record mode
8. Ride history
9. Offline support
10. Safety systems

---

# Important Development Notes

This system should NOT feel like:

* a simple CRUD app
* a generic dashboard
* a traditional fitness tracker

It should feel like:

* an immersive cycling operating system
* a smart realtime riding assistant
* a cinematic exploration platform

All implementations should reinforce this product vision.








RESPOSTA:



Optimized tool selection

Planned implementation steps and resolved formatting conflicts
I'll create a brief todo plan, then read every file inside "Estrutura Base" to extract requirements and constraints.

Created 5 todos

Now I'll list the files inside "Estrutura Base" to confirm paths.

Read Estrutura Base

Next I'll read each document (all lines) to extract requirements and constraints.

Reviewed 6 files and updated Todo List
Now I'll mark analysis complete and start extracting requirements (update todo statuses).

Starting: Extract requirements & constraints (2/5)

Plan

Todo: Created initial plan and marked Analyze 'Estrutura Base' docs completed; Extract requirements & constraints in-progress.
What I did

Read: All files under [Estrutura Base](Estrutura Base) — specifically:
[Estrutura Base/ideia-base.md](Estrutura Base/ideia-base.md#L1)
[Estrutura Base/arquitetura-do-sistema.md](Estrutura Base/arquitetura-do-sistema.md#L1)
[Estrutura Base/decisoes.md](Estrutura Base/decisoes.md#L1)
[Estrutura Base/estruturacao.md](Estrutura Base/estruturacao.md#L1)
[Estrutura Base/ferramentas-tecnologias.md](Estrutura Base/ferramentas-tecnologias.md#L1)
[Estrutura Base/modelagem.md](Estrutura Base/modelagem.md#L1)
[Estrutura Base/ux-ui.md](Estrutura Base/ux-ui.md#L1)
Key findings (concise)

Core entity: Ride Session is the single source of truth (start/stop, points, snapshots, metrics).
Operational modes: GPS_ONLY (lightweight, battery-friendly) and GPS + CAMERA (immersive recording). Both must be supported.
Module layout: Feature-based monorepo: apps/ (web, api), packages/ (types, ui, utils). Follow the exact folders and file responsibilities described in [Estrutura Base/estruturacao.md](Estrutura Base/estruturacao.md#L1).
Tech stack: Frontend React + Vite + TypeScript + Tailwind + shadcn/ui + Framer Motion + Zustand; Maps: Leaflet/OpenStreetMap; Backend: NestJS, Socket.IO; DB: Postgres + PostGIS + Prisma. (see [ferramentas-tecnologias.md](Estrutura Base/ferramentas-tecnologias.md#L1)).
GPS: Use navigator.geolocation.watchPosition() with ~1Hz updates for MVP; store RoutePoint structure (lat, lon, speed, alt, heading, timestamp) as in [modelagem.md](Estrutura Base/modelagem.md#L1).
Camera: Use navigator.mediaDevices.getUserMedia() decoupled from GPS; snapshots linked to RideSession (not required for GPS-only).
State mgmt / stores: Use Zustand stores per module (gps.store.ts, ride.store.ts, etc.) with a central ride store for session lifecycle (see [arquitetura-do-sistema.md](Estrutura Base/arquitetura-do-sistema.md#L1)).
Offline-first: Save session/points locally (IndexedDB), queue sync to backend when online (per [modelagem.md](Estrutura Base/modelagem.md#L1)).
UI/UX constraints: Mobile-first, dark + glassmorphism, camera or map must remain visually dominant, HUD minimal/transparent and readable while riding (see [ux-ui.md](Estrutura Base/ux-ui.md#L1)).
Performance priorities: Minimize rerenders (HUD reflects store state only), tune GPS frequency, use Web Workers for heavy tasks (workers/gps.worker.ts, analytics.worker.ts) as recommended in [estruturacao.md](Estrutura Base/estruturacao.md#L1).
MVP scope (from docs): Auth, GPS Mode, Record Mode (camera + HUD), Ride Session start/finish/save, basic History, Settings.
Immediate recommended next step

Scaffold the monorepo foundation for the web app (apps/web) following the documented structure: Vite + React + TypeScript + Tailwind + PWA + Zustand + React Router + React Leaflet. This respects the "Foundation" sprint and will let us implement GPS engine and ride-session next.
Do you want me to scaffold the monorepo frontend foundation now (create apps/web with Vite+TS, Tailwind, PWA setup, basic folder structure and example Zustand stores), or would you prefer I start by drafting the RideSession and RoutePoint shared types in packages/types first?