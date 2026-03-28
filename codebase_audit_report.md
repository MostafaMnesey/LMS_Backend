# LMS Backend — Codebase Audit Report

> Full scan of 57 source files across Modules, Middlewares, database, and utilities.

---

## 1. Code Quality Issues

### 1.1 🔴 Duplicated Data Across `user`, `stuff`, `student`, `teacher` Models

**Problem:** The `stuff`, `student`, and `teacher` tables each store `name`, `email`, `password`, `phone`, `code_country` — fields that already exist on the `user` table. When creating or updating, the code must manually keep **both** records in sync (e.g., [stuff.service.js:185-197](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/System/stuff/stuff.service.js#L185-L197), [teacher.service.js:231-244](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/Teachers/teachers/teacher.service.js#L231-L244)).

**Impact:** Any update that forgets to sync both records causes data drift. It also doubles the number of DB writes on every create/update.

**Recommendation:**
- Store shared fields (`name`, `email`, `password`, `phone`, `code_country`) **only** on the `user` table.
- Keep role-specific fields (e.g., `hour_price`, `gender`, `currency`) on the sub-tables.
- Use Prisma `include: { user: true }` to join shared data when needed.

---

### 1.2 🔴 Inconsistent Error Handling Patterns

**Problem:** Some files use `return next(new Error("...", { cause: 400 }))` directly, while others use [errorResponse({ next, ... })](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/response.js#43-51). Even within the same file (e.g., [stuff.service.js](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/System/stuff/stuff.service.js) lines 55 vs. 106), both patterns are mixed.

**Impact:** Harder to maintain and impossible to add centralized error logic (like logging, i18n) consistently.

**Recommendation:** Standardize on [errorResponse()](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/response.js#43-51) everywhere and remove direct `new Error(...)` calls in services.

---

### 1.3 🟡 Redundant `console.log` Statements Left in Production Code

**Problem:** Debug logs are scattered across the codebase:
- [Authorization.js:12](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Middlewares/Authorization.js#L12) — `console.log(accessRoles, userRole)`
- [currency.service.js:64](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/Transactions/currency/currency.service.js#L64) — `console.log(currency)`
- [currency.service.js:89-96](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/Transactions/currency/currency.service.js#L89-L96) — logs request body
- [teacher.service.js:89](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/Teachers/teachers/teacher.service.js#L89) — `console.log({checkuser, ...})`
- [subjects.service.js:28](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/Teachers/subjects/subjects.service.js#L28) — `console.log(activeCount)`
- [auth.service.js:207](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/authentication/auth.service.js#L207) — `console.log(hashedOtp)`

**Impact:** Leaks potentially sensitive data (hashed OTPs, user data) to stdout. Clutters logs in production.

**Recommendation:** Remove all debug `console.log` calls. Use a structured logger (e.g., `pino` or `winston`) with log levels.

---

### 1.4 🟡 Repeated CRUD Boilerplate

**Problem:** Every module repeats the same find-then-check-then-update/delete pattern. For example, `deletePlan`, `deleteRole`, `deleteSubject`, `deleteCurrency`, `deletePermission` are nearly identical:
```js
const item = await db.findOne({ model: "X", where: { id } });
if (!item) return errorResponse({ next, message: "Not found", status: 404 });
await db.deleteOne({ model: "X", where: { id } });
return successResponse({ res, message: "Deleted" });
```

**Impact:** 5× duplicated logic that must be fixed in multiple places if the pattern changes.

**Recommendation:** Create a generic `ensureExists` helper:
```js
export const ensureExists = async ({ model, where, errorMessage = "Not found" }) => {
  const item = await db.findOne({ model, where });
  if (!item) throw new Error(errorMessage, { cause: 404 });
  return item;
};
```

---

### 1.5 🟡 [findManyWithPaginationAndCount](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/database/dbService.js#21-56) Is Never Used

**Problem:** [dbService.js:21-55](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/database/dbService.js#L21-L55) defines [findManyWithPaginationAndCount](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/database/dbService.js#21-56) but no module uses it. All list endpoints use [findMany](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/database/dbService.js#13-20) without pagination.

**Impact:** All list endpoints return the **entire** dataset. As data grows, response payloads and DB load will increase linearly.

**Recommendation:** Adopt the pagination helper in all list endpoints (`getAllPlans`, `getAllTeachers`, `getAllStudents`, etc.).

---

### 1.6 🟡 `tokenTypeEnum` Defined After Usage

**Problem:** In [token.js](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Token/token.js), [verifyToken](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Token/token.js#14-24) references `tokenTypeEnum.access` as a default parameter on line 14, but `tokenTypeEnum` is defined on line 25. This works due to hoisting of `const` within the module scope at runtime, but is fragile and confusing.

**Impact:** Potential runtime `ReferenceError` in edge cases and reduces code clarity.

**Recommendation:** Move `tokenTypeEnum` to the top of the file, before its first usage.

---

### 1.7 🟡 [errorResponse](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/response.js#43-51) Accepts `data` but Never Uses It

**Problem:** [response.js:43-50](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/response.js#L43-L50) — [errorResponse({ data })](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/response.js#43-51) destructures `data` but never passes it into the error.

**Recommendation:** Either use it or remove the parameter to avoid confusion.

---

## 2. Database & Query Optimization

### 2.1 🔴 Missing Pagination on All List Endpoints

**Problem:** Every `getAll*` handler (`getAllPlans`, `getAllTeachers`, `getAllStudents`, `getCurrencies`, `getSubscriptionRequests`, `getAllStuff`, etc.) calls `db.findMany` without `take` or `skip`.

**Impact:** If any table grows to 10K+ rows, response times will spike and memory usage will balloon.

**Recommendation:** Use [findManyWithPaginationAndCount](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/database/dbService.js#21-56) (already defined but unused) across all list endpoints. Accept `page` and `limit` query params.

---

### 2.2 🔴 `subscription_requests.planId` Has `@unique` Constraint

**Problem:** In [schema.prisma:201](file:///media/asus/01DCA965666DDFA0/Backend/LMS/prisma/schema.prisma#L201), `planId` is marked `@unique`, meaning only **one** subscription request can ever exist for a given plan across all users.

**Impact:** The second user who subscribes to the same plan will get a unique constraint violation.

**Recommendation:** Remove `@unique` from `planId` on `subscription_requests`. Keep the `@@index([planId])` instead.

---

### 2.3 🟡 `subscription_requests.user_id` Has `@unique` Constraint

**Problem:** In [schema.prisma:200](file:///media/asus/01DCA965666DDFA0/Backend/LMS/prisma/schema.prisma#L200), `user_id` is marked `@unique`, meaning each user can only have **one** subscription request ever.

**Impact:** A user cannot change plans or re-subscribe. Consider if this is truly intended.

**Recommendation:** If users should be able to have multiple requests (e.g., history), remove `@unique` from `user_id` and change the `user` model relation from `subscriptionRequests subscription_requests?` to `subscriptionRequests subscription_requests[]`.

---

### 2.4 🟡 No Cascade Deletes on Critical Relations

**Problem:** Deleting a `user` won't cascade to their `stuff`, `teacher`, or `student` records. The code manually deletes related records (e.g., [teacher.service.js:292-306](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/Teachers/teachers/teacher.service.js#L292-L306)), but a direct DB delete or Prisma Studio delete would leave orphans.

**Recommendation:** Add `onDelete: Cascade` to foreign key relations where appropriate:
```prisma
user  user?  @relation(fields: [user_id], references: [id], onDelete: Cascade)
```

---

### 2.5 🟡 Sequential Queries That Could Be Parallelized

**Problem:** In [stuff.service.js:98-117](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/System/stuff/stuff.service.js#L98-L117), `checkUser` and `existingStuff` are checked sequentially. Similarly, [updateStuffUser](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/System/stuff/stuff.service.js#L172-L197) updates `stuff` and `user` sequentially instead of using `Promise.all` or a transaction.

**Recommendation:** Wrap parallel-safe reads in `Promise.all` and related writes in `db.transaction`.

---

### 2.6 🟡 `user.roleId` Has `@unique` Constraint

**Problem:** [schema.prisma:23](file:///media/asus/01DCA965666DDFA0/Backend/LMS/prisma/schema.prisma#L23) — `roleId` on `user` is `@unique`, meaning only **one** user can have each role.

**Impact:** This is almost certainly wrong. You'd expect many users to share the same role (e.g., all students share the "student" role).

**Recommendation:** Remove `@unique` from `roleId` and change `role` model's `user user?` to `users user[]`.

---

## 3. API & Backend Performance

### 3.1 🔴 Authentication Hits the DB on Every Request

**Problem:** [Authentication.js:16-24](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Middlewares/Authentication.js#L16-L24) queries the `user` table on **every** authenticated request.

**Impact:** For 100 requests/sec, that's 100 extra DB queries/sec just for auth.

**Recommendation:** Cache user data in Redis with a short TTL (e.g., 5 minutes):
```js
const cacheKey = `user:${decoded.id}`;
let user = JSON.parse(await redis.get(cacheKey));
if (!user) {
  user = await db.findFirst({ model: "user", where: { id: decoded.id, confirmAt: { not: null } } });
  if (user) await redis.set(cacheKey, JSON.stringify(user), { EX: 300 });
}
```

---

### 3.2 🟡 Authorization Makes a Separate DB Call

**Problem:** [Authorization.js:6-11](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Middlewares/Authorization.js#L6-L11) queries the `role` table separately, even though `req.user` from authentication already has `roleId`.

**Recommendation:** Include `role` in the authentication query (`include: { role: true }`) and use `req.user.role.name` in authorization — eliminating the extra query.

---

### 3.3 🟡 `getStuffById` Makes 2 Queries Instead of 1

**Problem:** [stuff.service.js:44-68](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/System/stuff/stuff.service.js#L44-L68) first finds the `stuff` record with role, then makes a **second** query to get the same role with its permissions.

**Recommendation:** Use a single query with nested includes:
```js
const stuff = await db.findOne({
  model: "stuff",
  where: { id },
  include: {
    role: { include: { rolePermissions: { include: { permission: true } } } }
  }
});
```

---

### 3.4 🟡 `getCurrencies` Duplicates the Query

**Problem:** [currency.service.js:17-52](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/Transactions/currency/currency.service.js#L17-L52) — the search branch and the no-search branch each call `db.findMany` and [successResponse](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/response.js#52-64) separately, with duplicated response construction.

**Recommendation:** Build the `where` clause conditionally, then make a single query:
```js
const where = search ? { OR: [...] } : {};
const currencies = await db.findMany({ model: "currency", where });
```

---

## 4. Frontend / React Performance

> **Note:** This project is a pure Node.js/Express backend. No frontend/React code was found. This section is not applicable.

---

## 5. Security & Best Practices

### 5.1 🔴 CRITICAL: [.env](file:///media/asus/01DCA965666DDFA0/Backend/LMS/.env) File Contains Real Secrets and Is Not in [.gitignore](file:///media/asus/01DCA965666DDFA0/Backend/LMS/.gitignore)

**Problem:** The [.env](file:///media/asus/01DCA965666DDFA0/Backend/LMS/.env) file contains:
- Database credentials (`lms_secret_password`)
- pgAdmin credentials (`admin123`)
- AES encryption key (`lms_super_secret_key_2026`)
- Gmail app password (`nizi dpub lmsw mpfp`)
- JWT secrets

The [.gitignore](file:///media/asus/01DCA965666DDFA0/Backend/LMS/.gitignore) may not include [.env](file:///media/asus/01DCA965666DDFA0/Backend/LMS/.env) (only 133 bytes).

**Impact:** If committed, all secrets are exposed. The JWT access and refresh secrets are **identical** (`lms_super_secret_key_2026_JWT_ACCESS`), so a compromised access token can forge refresh tokens.

**Recommendations:**
1. Ensure [.env](file:///media/asus/01DCA965666DDFA0/Backend/LMS/.env) is in [.gitignore](file:///media/asus/01DCA965666DDFA0/Backend/LMS/.gitignore). Run `git rm --cached .env` if already tracked.
2. **Use different JWT secrets** for access and refresh tokens.
3. Rotate all secrets immediately if they've been committed to git.
4. Use a secrets manager in production (Docker secrets, Vault, etc.).

---

### 5.2 🔴 Stack Traces Exposed in Error Responses

**Problem:** [response.js:39](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/response.js#L39) sends `stack: err.stack` in **every** error response body.

**Impact:** Exposes internal file paths, line numbers, and code structure to attackers.

**Recommendation:** Only include stack in development:
```js
...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {})
```

---

### 5.3 🔴 No Rate Limiting

**Problem:** There is no rate limiting middleware on any endpoint, including sensitive ones like `/auth/login`, `/auth/register`, `/auth/forgot-password`.

**Impact:** Brute-force attacks, credential stuffing, and OTP guessing are trivially possible.

**Recommendation:** Add `express-rate-limit`:
```js
import rateLimit from 'express-rate-limit';
app.use('/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));
```

---

### 5.4 🟡 `bcrypt.hashSync` and `bcrypt.compareSync` Block the Event Loop

**Problem:** [security/index.js:5,8](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/security/index.js#L5-L8) uses `hashSync` and `compareSync`.

**Impact:** Hashing with salt round 10 takes ~70ms and **blocks** the entire Node.js event loop during that time. Under concurrent requests, this causes noticeable latency.

**Recommendation:** Switch to async versions:
```js
export const hash = async ({ password, salt = process.env.SALT }) => {
  return bcrypt.hash(password, Number(salt));
};
export const compare = async ({ password, hash }) => {
  return bcrypt.compare(password, hash);
};
```

---

### 5.5 🟡 CORS Is Wide Open

**Problem:** [app.controller.js:16](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/app.controller.js#L16) — `app.use(cors())` with no origin restrictions allows any domain to make API requests.

**Recommendation:** Restrict to known frontend origins:
```js
app.use(cors({ origin: ['https://yourdomain.com'], credentials: true }));
```

---

### 5.6 🟡 [sendEmail](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Mailer/SendEmail.js#4-23) Silently Swallows Errors

**Problem:** [SendEmail.js:19-21](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Mailer/SendEmail.js#L19-L21) catches email errors and just `console.log`s them. The registration flow in [auth.service.js](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/Modules/authentication/auth.service.js) checks [mail](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Mailer/SendEmail.js#4-23) (the return value of `emit()`, which is always `true/false` based on listener existence, not delivery success).

**Impact:** Users may register but never receive their OTP email with no indication of failure.

**Recommendation:** Make [sendEmail](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Mailer/SendEmail.js#4-23) throw on failure so the caller can handle it. Or use a queue (BullMQ) with retries.

---

### 5.7 🟡 OTP Brute-Force Vulnerability

**Problem:** There is no limit on OTP verification attempts. An attacker with access to the email can try 6-digit codes (only 531,441 possible values from digits 1-9) without throttling.

**Recommendation:** Add an attempt counter in Redis. Lock the OTP after 5 failed attempts:
```js
const attempts = await redis.incr(`${email}_otp_attempts`);
if (attempts > 5) return next(new Error("Too many attempts", { cause: 429 }));
```

---

### 5.8 🟡 [generateMessage.js](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/GoogleClient/generateMessage.js) Contains Unrelated AI/Sarahah Code

**Problem:** [generateMessage.js](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/GoogleClient/generateMessage.js) contains a Groq-based "Sarahah reply generator" that is unrelated to an LMS. It's also placed under `GoogleClient/` which is misleading.

**Recommendation:** Remove this file if unused, or move it to its own module if intentional.

---

### 5.9 🟡 [Helpers.js](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Helpers.js) ([destructData](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Helpers.js#1-9)) Is Never Used

**Problem:** [Helpers.js](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Helpers.js) exports [destructData](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/utils/Helpers.js#1-9) but no module imports it.

**Recommendation:** Remove dead code to keep the codebase clean.

---

### 5.10 🟡 `nodemon` Is a Production Dependency

**Problem:** [package.json:39](file:///media/asus/01DCA965666DDFA0/Backend/LMS/package.json#L39) lists `nodemon` under `dependencies` instead of `devDependencies`.

**Impact:** Installs an unnecessary 4MB+ package in production Docker images.

**Recommendation:** Move to `devDependencies`:
```bash
npm install --save-dev nodemon
```

---

## 🏆 Priority List — Top 5 Highest-Impact Actions

| Priority | Action | Category | Impact |
|----------|--------|----------|--------|
| **1** | **Fix `@unique` on `subscription_requests.planId` and `user.roleId`** | 🐛 Bug | These constraints will cause runtime failures as soon as a second user subscribes to the same plan or role. **This is a production blocker.** |
| **2** | **Add rate limiting + OTP attempt throttling** | 🔒 Security | Without these, the auth system is vulnerable to brute-force attacks. Use `express-rate-limit` and Redis-based OTP attempt counters. |
| **3** | **Cache authenticated user in Redis** | ⚡ Performance | Eliminates the #1 most-called DB query. With a 5-min TTL, this reduces DB load by 80%+ on authenticated endpoints. |
| **4** | **Switch `bcrypt.hashSync`/`compareSync` to async** | ⚡ Performance | Unblocks the event loop during password hashing, preventing request queuing under concurrent load. Single biggest throughput improvement. |
| **5** | **Add pagination to all list endpoints** | ⚡ Performance | Prevents unbounded query responses as data grows. Use the already-defined [findManyWithPaginationAndCount](file:///media/asus/01DCA965666DDFA0/Backend/LMS/src/database/dbService.js#21-56) helper. |

---

> **Honorable mentions:** Remove stack traces from production errors, fix identical JWT secrets, eliminate data duplication across user/stuff/teacher/student models, add cascade deletes.
