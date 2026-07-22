# SolveCue

SolveCue is a Chrome extension that schedules spaced-repetition reviews for LeetCode problems you've already solved, so you revisit them before you forget — without maintaining your own spreadsheet.

It's built for people actively doing LeetCode prep who care about long-term retention, not just problem count. A problem only enters SolveCue when you solve and grade it; there's no separate "to-do" list to maintain.

## How it works

1. **Solve a problem on leetcode.com.** SolveCue injects a small panel onto the page. When you're done, mark it solved and pick a grade for how hard it felt: **Couldn't solve**, **Struggled**, **Solid**, or **Easy**.
2. **SolveCue schedules the first review.** The grade sets when the problem comes back — harder solves return sooner, easy ones much later.
3. **Come back when problems are due.** Each day SolveCue builds a queue of what's due and nudges you. Reviewing a problem and grading it again reschedules it further out, spacing reviews as your recall improves.

The scheduler gives every problem a **target day** (the ideal review day, which it may slide to balance daily load) and a **deadline** (the latest acceptable day, which forces the problem into the queue even if you're over your daily target).

For the precise meaning of terms like *target day*, *deadline*, *overdue*, *failed*, and *scheduling day*, see [`CONTEXT.md`](./CONTEXT.md).

## Where you interact with it

- **In-page review panel** — appears on leetcode.com, showing how many reviews are due today while you're already on the site.
- **Toolbar popup** — lists today's queue; launch a problem to review it, or pause problems you don't want in rotation.
- **Toolbar badge** — shows the number of reviews due (capped at "99+").
- **Desktop notification** — a daily nudge at rollover when reviews are waiting.

## Key behaviors

- **Grading drives scheduling.** The four grades map to increasingly long intervals; a "Couldn't solve" brings the problem back the next day and prioritizes it.
- **Soft daily cap.** You set a target number of reviews per day (default 8). It's a soft ceiling — failed problems and problems hitting their deadline can push past it.
- **Configurable day rollover.** The day boundary defaults to 4am rather than midnight, so late-night sessions still count toward the same day.
- **Pause, don't delete.** Pausing removes a problem from rotation while keeping its history; reactivate it any time. There is no delete.
- **Local storage.** All problems and settings live in the browser via `chrome.storage.local`.

## Development

Requires Node.js and npm.

```bash
npm install        # install dependencies
npm run build      # build the extension into dist/
npm test           # run the test suite (vitest)
npm run typecheck  # type-check without emitting
```

The project is written in TypeScript and built with Vite. `npm run build` produces an unpacked extension in `dist/`.

### Loading the extension in Chrome

1. Run `npm run build`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the `dist/` directory.

### Project layout

```
public/           # manifest.json and icons
src/
  background/     # service worker: alarms, badge, notifications
  capture/        # tracking a solved problem
  content/        # leetcode.com content script, review panel, page parsing
  popup/          # toolbar popup UI
  problem/        # pause / reactivate
  reminders/      # due-count nudges and rollover alarms
  review/         # completing a scheduled review
  scheduler/      # spaced-repetition intervals and queue building
  settings/       # user settings
  storage/        # chrome.storage adapter
  types/          # shared domain types
tests/            # vitest test suites mirroring src/
```

## Tech stack

- **TypeScript** + **Vite** (Manifest V3 Chrome extension)
- **Vitest** for tests
- Permissions used: `storage`, `alarms`, `notifications`
