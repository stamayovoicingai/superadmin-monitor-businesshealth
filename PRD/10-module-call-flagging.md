# 10 · Module: Call Flagging

Feature 1B. Any user with access to a call can flag it with a comment; flagged calls land in a
review queue for SuperAdmin (and the Voicing team) to triage.

---

## 1. Flagging a call (all roles)

From **Call Detail** (doc 05) or any call row:
- "🚩 Flag this call" action → opens a panel.
- Fields: **comment** (required, describes the problem), optional **category** (from the issue
  categories, doc 05 §4.2: Infra / Compliance / Technical / Effectiveness / custom), optional severity.
- A call can have a **thread** of comments (multiple users add context).
- Unflag / resolve allowed by SuperAdmin (and original flagger, configurable).

A flagged call shows a 🚩 badge wherever it appears (call logs, live ops, detail).

---

## 2. Flag Review Queue (`/controls/flags`, SuperAdmin)

Dedicated triage queue.

**Columns**: call_id · org/project · agent · flagged by · date · category · severity · status
(`open` / `in_review` / `resolved` / `dismissed`) · comment preview.

**Filters**: org/project · category · severity · status · date · flagged-by.

**Actions**:
- Open → Call Detail (transcript + recording + logs) in review mode.
- Change status, assign category/severity, add internal note.
- Bulk resolve/dismiss.
- (Phase-2 link) escalate to QA Bench evaluator or to an Issue.

---

## 3. Relationship to auto-flagging (QA Bench, doc 11)

QA Bench can **auto-flag** calls when an eval threshold is breached. Auto-flags enter the **same
queue**, tagged `source = auto (QA Bench)` vs `source = manual (user)`, with the evaluator/metric
that triggered them. This keeps one unified review surface.

---

## 4. Notifications
- In-platform notification to SuperAdmin on new flags (and optional email — see doc 11 §notifications).
- Queue badge count in the sidebar.

## 5. Data
- `call_flag` (id, call_id, flagged_by, source [manual|auto], category_id?, severity?, status, created_at, resolved_by?, resolved_at?).
- `call_flag_comment` (id, flag_id, author, body, created_at).

## 6. Role behavior
- **All roles:** flag + comment on accessible calls; see flags on their calls.
- **SuperAdmin:** full review queue + triage + status management.

## 7. Open questions
- [ ] Can `User` resolve their own flags, or only SuperAdmin resolves? (default: SuperAdmin resolves.)
- [ ] Is category required at flag time or assigned during triage? (default: optional at flag, set in triage.)
