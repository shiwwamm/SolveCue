# SolveCue

SolveCue is a Chrome extension that schedules spaced-repetition reviews for LeetCode problems you've already solved, so you revisit them before you forget — without maintaining your own spreadsheet. A problem only enters SolveCue at the moment you solve and grade it; there is no "to-do later" list.

## Language

### Problems

**Track**:
Recording a solved problem into SolveCue along with a self-assessed grade, which schedules its first review. A problem can only enter SolveCue by being tracked at solve time.
_Avoid_: Capture, add, import, log, save

**Grade**:
The user's self-assessment of how hard a solve was, chosen at track time, which determines when the problem comes back. One of four levels:

- **Couldn't solve** — needed the solution or didn't get it.
- **Struggled** — got it, but with real difficulty.
- **Solid** — solved it comfortably.
- **Easy** — trivial.

**Active**:
A problem that is in rotation and can appear in queues.
_Avoid_: Enabled, live

**Paused**:
A problem retained in history but excluded from all scheduling until reactivated. Pausing is the only way to take a problem out of rotation — there is no delete.
_Avoid_: Archived, snoozed, deleted

### Scheduling

**Target day**:
The ideal day to review a problem. The scheduler may slide it earlier or later within a window to balance daily load.
_Avoid_: Soft due date, due date

**Deadline**:
The latest acceptable day to review a problem. A problem reaching its deadline is forced into the queue even when the daily target cap is already met.
_Avoid_: Hard due date

**Overdue**:
A problem whose target day has passed but has not yet been reviewed.

**Failed**:
A problem whose most recent grade was "Couldn't solve." It returns the next day and is prioritized ahead of other due problems.
_Avoid_: Lapsed

**Scheduling day**:
The day a review counts toward. The clock rolls over at a configurable hour (default 4am), not midnight, so late-night sessions still count as the same day.
_Avoid_: Calendar day, today

### Daily review

**Today's queue**:
The ordered list of problems due on the current scheduling day. Ordered by priority: failed first, then overdue, then normal.
_Avoid_: Review list, backlog

**Daily target cap**:
The target number of reviews per day; a soft ceiling, not a hard limit. Failed problems and problems reaching their deadline can exceed it.
_Avoid_: Daily limit, quota

**Pending review**:
A problem the user has opened to review but has not yet graded. Grading it completes the review and reschedules it.
