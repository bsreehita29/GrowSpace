# GROW SPACE Security Specification

## 1. Data Invariants
1. **Workspace Capability Isolation**: Every document under `/users/{userId}` and all 18 user subcollections belongs exclusively to a high-entropy workspace ID (`>= 24` chars, `[a-zA-Z0-9_\-]+`) with `allow list: if false` on `/users` to prevent directory enumeration.
2. **PII Isolation**: User profile documents contain personal targets and wellness/finance data; `allow list` on `/users` is strictly forbidden (`false`), and short/guessable workspace IDs (`< 24` chars) are rejected.
3. **Subcollection Master Gate**: Creating a document in any `/users/{userId}/...` subcollection requires the parent `/users/{userId}` document to exist via `exists()` after static validation.
4. **Immutable Ownership & Creation Time**: `userId` and `createdAt` can never change on update. `createdAt == request.time` on create; `updatedAt == request.time` on create and update.
5. **Bounded Payloads & Strict Keys**: Every create enforces `hasAll` + `hasOnly`; every update enforces `isValid[Entity](incoming())` + action-specific `affectedKeys().hasOnly(...)`; all strings have `.size()` bounds; all arrays have `.size() <= MAX` and first-element type validation.
6. **ID Poisoning Guard**: Every single-document operation (`get`, `create`, `update`, `delete`) validates `isValidId(id)` (`^[a-zA-Z0-9_\-]+$`, max 128 chars).

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Short / Guessable Workspace Read**: `GET /users/uid_a/moods/m1` (`uid_a` < 24 chars).
2. **Invalid Workspace ID Format Read**: `GET /users/bad$workspace$id$with$invalid$chars/financeTx/tx1`.
3. **Short / Guessable Workspace Write**: `CREATE /users/uid_a/dailyTasks/t1` (`uid_a` < 24 chars).
4. **User Directory Enumeration**: `LIST /users` by any authenticated user.
5. **Identity Spoofing on Create**: `CREATE /users/uid_a/moods/m1` with `userId: "uid_b"`.
6. **Ghost / Shadow Field Injection**: `CREATE /users/uid_a/studyTasks/t1` with extra `isAdmin: true` field.
7. **Update Without Server Timestamp**: `UPDATE /users/uid_a/dailyTasks/t1` with client-forged `updatedAt` != `request.time`.
8. **Immutable Field Tampering**: `UPDATE /users/uid_a/careerApps/a1` changing `createdAt` or `userId`.
9. **ID Poisoning**: `CREATE /users/uid_a/studyNotes/${'x'.repeat(200)}` (exceeds 128 chars or invalid chars).
10. **Denial-of-Wallet String Bloat**: `CREATE /users/uid_a/studyNotes/n1` with `content` > 5000 chars.
11. **Unbounded Array Injection**: `CREATE /users/uid_a/habits/h1` with 95 items in `completedDates` (limit 90) or non-string first element `[123]`.
12. **Terminal State / Invalid Enum Injection**: `UPDATE /users/uid_a/careerApps/a1` setting `status: "ceo"` or `UPDATE /users/uid_a/studyTasks/t1` modifying `status` from `"completed"` when locked or invalid priority.
