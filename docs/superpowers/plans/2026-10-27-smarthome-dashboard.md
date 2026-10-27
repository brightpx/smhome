# Smarthome Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build mobile-first PWA webapp showing live energy flow and all ON devices from Tuya web session.

**Architecture:** Node backend keeps Tuya web session (us.device.tuya.ai cookies) and polls device list + DP values every 5s, pushes to frontend via SSE; frontend is static PWA with Liquid Glass Dark theme, layout A, responsive iPhone/iPad.

**Tech Stack:** Frontend Vite + React + TypeScript + vite-plugin-pwa, Backend Node 20 + Express + better-sqlite3 (push subs), Web Push with web-push (VAPID), Tests vitest + playwright

**Spec:** Brainstorm decision 2026-10-27 — layout A Energy Flow, theme D:/tdapp/UI-DESIGN-SYSTEM.md, 10 ON devices grouped by room, realtime 5s from web session (not cloud key), Web Push for session-expired/offline, iPhone 390px + iPad 820px. No written spec doc — this plan argues from recon notes below.

## Global Constraints

- Theme MUST match D:/tdapp/UI-DESIGN-SYSTEM.md: surface #000, panel glass rgba white, accent #0a84ff, profit #30d158, loss #ff453a, text slate-200, blur 10px saturate 150%, radius 1rem, no emoji in UI, SVG icons only.
- Mobile first 390px single column, iPad 820px two columns, touch targets min 44px, safe-area insets.
- Data source MUST be web session us.device.tuya.ai (project_id 69459073, home My Home), NOT Tuya Cloud key (Singapore-only, mismatched Western America account).
- Realtime interval 5s, show LIVE badge + last-updated seconds, auto-reconnect with backoff.
- Show all 10 online as ON grouped: ภายนอก 4 (meter, inverter, ประตูทางเข้า, ระเบียงบน), ครอบครัว 2, นอน 1, กินข้าว 1, บ้านเก่า 2. Hide 5 offline with count.
- Thai UI labels for rooms/devices as in Tuya (ห้องครอบครัว etc).
- Secrets (.env with cookies, VAPID keys) never committed.

## Review Focus

- Session cookie expires mid-poll — frontend MUST show re-login banner with QR, not blank values.
- DP query 403 when micro-app headers missing — backend MUST replicate web headers, fallback to last-known with stale flag.
- iPad split layout collapses to single column under 700px — grid MUST NOT overflow horizontally.
- Web Push on iOS without PWA install — subscribe button MUST explain Add to Home Screen.
- Meter/inverter offline — flow MUST show gray stale state, not 0 kW as if selling.

---

### Task 1: Web API contract capture

**Files:**
- Create: `docs/web-api-contract.md`
- Create: `scripts/capture-headers.mjs`
- Test: `tests/contract.test.mjs`

**Interfaces:**
- Consumes: live browser session tab_617cd3ff (us.device.tuya.ai cookies)
- Produces: `getDeviceList() -> Device[]`, `getDeviceDP(devId) -> DP[]` signatures used by Task 2; exact endpoint paths + required headers documented in docs/web-api-contract.md

- [ ] **Step 1: Write failing test for contract doc exists**

```js
// tests/contract.test.mjs
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
const md = fs.readFileSync('docs/web-api-contract.md','utf8');
assert.ok(md.includes('/device/pag/source-query'));
assert.ok(md.includes('eb0b9857bf4d24e73aujri'));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/contract.test.mjs`
Expected: FAIL file not found

- [ ] **Step 3: Document endpoints + capture headers in docs/web-api-contract.md and scripts/capture-headers.mjs**

Record from recon: POST /open-api/v1.0/m/sdf/device/pag/source-query (works), GET /device/index/:id?project_id=69459073 (works), GET /device/dp/query?dev_id= (needs micro-app headers — capture via devtools, store header names, note fallback). List 15 device IDs, 10 ON IDs, meter PID ax1iylf5qp4iqlkg, inverter PID r5rqjwfvvehfyeks.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/contract.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/web-api-contract.md scripts/capture-headers.mjs tests/contract.test.mjs
git commit -m "docs: capture tuya web api contract"
```

### Task 2: Backend session proxy + polling

**Files:**
- Create: `backend/package.json`
- Create: `backend/src/server.js`
- Create: `backend/src/tuyaWeb.js`
- Test: `backend/tests/poll.test.js`

**Interfaces:**
- Consumes: docs/web-api-contract.md endpoints, .env COOKIE header
- Produces: `GET /api/devices -> {devices, updatedAt}`, `GET /api/events (SSE)` consumed by Task 3; `POST /api/push/subscribe`

- [ ] **Step 1: Write failing test for GET /api/devices shape**

```js
// backend/tests/poll.test.js
// assert GET /api/devices returns {devices: Array(15), updatedAt: number, onCount: 10}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend test`
Expected: FAIL server not defined

- [ ] **Step 3: Implement `tuyaWeb.pollAll()` and Express routes in backend/src/server.js**

Poll source-query every 5s, cache last-good, serve SSE on /api/events, persist cookies from .env, return stale:true on 403.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix backend test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat: backend web session proxy with 5s poll and SSE"
```

### Task 3: PWA shell + Liquid Glass theme

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/src/app.tsx`
- Create: `frontend/src/theme.css`
- Test: `frontend/tests/theme.test.ts`

**Interfaces:**
- Consumes: GET /api/devices (Task 2)
- Produces: `<App/>` shell with glass panels, iPhone/iPad grid consumed by Task 4

- [ ] **Step 1: Write failing test for theme tokens**

```ts
// theme.test.ts asserts theme.css contains --accent:#0a84ff and .panel blur 10px
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test`
Expected: FAIL

- [ ] **Step 3: Implement Vite React PWA + theme.css copied from tdapp tokens in frontend/src/theme.css**

Single column <700px, two columns >=700px, no emoji, SVG icons.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/
git commit -m "feat: pwa shell with liquid glass dark theme"
```

### Task 4: Energy flow + ON devices list

**Files:**
- Create: `frontend/src/components/FlowCard.tsx`
- Create: `frontend/src/components/DeviceList.tsx`
- Test: `frontend/tests/flow.test.tsx`

**Interfaces:**
- Consumes: `<App/>` shell + /api/devices
- Produces: Flow values {solarKw, homeKw, gridKw} + grouped ON list

- [ ] **Step 1: Write failing test for flow math**

```tsx
// flow.test.tsx: given meter 1.8 + solar 2.4 expects grid 0.6, renders 10 rows grouped by room
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test flow`
Expected: FAIL

- [ ] **Step 3: Implement `FlowCard({solarKw,homeKw})` and `DeviceList({devices})` in exact files**

Mock values allowed until Task 2 live; group rooms ภายนอก/ครอบครัว/นอน/กินข้าว/บ้านเก่า.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test flow`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ frontend/tests/flow.test.tsx
git commit -m "feat: energy flow and on-device list"
```

### Task 5: Realtime SSE + stale handling

**Files:**
- Modify: `frontend/src/app.tsx`
- Create: `frontend/src/hooks/useLive.ts`
- Test: `frontend/tests/live.test.ts`

**Interfaces:**
- Consumes: GET /api/events SSE from Task 2
- Produces: LIVE badge + last-updated + reconnect banner

- [ ] **Step 1: Write failing test for reconnect**

```ts
// live.test.ts: close SSE, expect banner + retry, stale flag shows gray
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix frontend test live`
Expected: FAIL

- [ ] **Step 3: Implement `useLive(url)` hook with 5s heartbeat, backoff, stale flag**

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix frontend test live`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add frontend/src/hooks/useLive.ts frontend/src/app.tsx frontend/tests/live.test.ts
git commit -m "feat: realtime sse with reconnect and stale state"
```

### Task 6: Web Push notifications

**Files:**
- Create: `backend/src/push.js`
- Create: `frontend/public/sw.js`
- Create: `frontend/src/components/PushButton.tsx`
- Test: `backend/tests/push.test.js`

**Interfaces:**
- Consumes: /api/devices stale/offline transitions (Task 2)
- Produces: Push on session-expired + device-offline

- [ ] **Step 1: Write failing test for subscribe roundtrip**

```js
// push.test.js: POST /api/push/subscribe with fake sub returns 201, triggers notify on offline
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix backend test push`
Expected: FAIL

- [ ] **Step 3: Implement VAPID push with web-push, store subs in sqlite, notify on session-expired/offline**

Generate VAPID via `npx web-push generate-vapid-keys`, document iOS Add-to-Home-Screen note in PushButton.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix backend test push`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/push.js frontend/public/sw.js frontend/src/components/PushButton.tsx
git commit -m "feat: web push for session and offline alerts"
```
