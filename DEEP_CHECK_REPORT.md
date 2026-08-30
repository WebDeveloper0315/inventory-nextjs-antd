# Deep-Check Report — `inventory-nextjs-antd`

_Reviewed: 30 Aug 2026 · Stack: Next.js App Router + React 18 + Ant Design 5 + Redux Toolkit + Mongoose/MongoDB + JWT_

## Verdict

The app is a working prototype whose **security model is effectively absent** and whose **declared framework version (`next: ^16.2.6`) does not match the code**, which is written for Next 13/14 idioms. Before you build features on top of it, two things need to happen: (1) close the auth/secret holes, and (2) decide the target Next version and fix the breaking changes for it. Nothing here is a rewrite — the domain logic is salvageable — but the plumbing (auth, secrets, DB connection, types) needs real work.

The findings below are ordered by severity. Line references are to the files as they stand today.

---

## 🔴 Critical — fix before this runs anywhere but localhost

### C1. Live database credentials and the JWT secret are committed to the repo
`.local.env` contains not just the local dev config but **two real-looking MongoDB Atlas connection strings with embedded passwords**:

```
mongodb+srv://sathya:sathyapr@cluster0.wrqpt.mongodb.net/...
mongodb+srv://superstar9772:Star123!@#@cluster0.ysxjxvp.mongodb.net/
jwt_secret=blackghost
```

`config.ts` **also hardcodes** `JWT_SECRET="blackghost"` and a DB URI, and it's a normal source file (committed, not ignored).

Note your `.gitignore` rule is `.env*.local` — that matches `.env.local`, but it does **not** match the filename `.local.env`. So this secrets file is tracked in git, not ignored.

**Action:** rotate every one of those DB passwords and the JWT secret now (assume they're compromised), delete the secrets from source, move them to a real `.env.local`, and scrub them from git history (`git filter-repo` / BFG). Remove the hardcoded values from `config.ts`.

### C2. The JWT signing secret is shipped to the browser
`next.config.js` puts `JWT_SECRET` (and `DB_URI`) inside the `env:` block:

```js
env: { DB_URI: config.DB_URI, JWT_SECRET: config.JWT_SECRET, ... }
```

Everything in `next.config` `env` is **inlined into the client JavaScript bundle**. That means the secret used to sign auth tokens is downloadable by anyone who opens the site — they can forge a valid token for any user. This defeats authentication entirely.

**Action:** never expose server secrets through `env`. Read `process.env.JWT_SECRET` / `process.env.DB_URI` directly in server code only. Only `NEXT_PUBLIC_*` values belong client-side.

### C3. Auth is not actually enforced — `validateJWT` swallows failures
`helpers/validateJWT.ts` catches every error, deletes the cookie, and **returns `undefined` instead of throwing**. Routes "protect" themselves with `await validateJWT(request)` and then continue regardless of the result. Because it never throws, a request with **no token or an invalid token still proceeds**.

Concretely, `PUT /api/users` updates any user by `_id` from the body with no effective auth gate. `currentuser` only survives by accident (`findById(undefined)` returns null → "No user found").

**Action:** make `validateJWT` throw (or return a discriminated result the caller checks), return `401` on failure, and stop mutating cookies inside a validation helper.

### C4. Most API routes have no auth at all, and middleware guards almost nothing
`middleware.ts` only matches `matcher: ['/', '/login']`, so pages like `/adduser`, `/newproduct`, `/sold`, `/returning`, `/query` are not gated, and it only checks that a token *string exists* — it never verifies the signature.

The API is wide open:
- `POST /api/users/register` — **no auth**: anyone can create a user with full authorities (`addUser`, etc.).
- `POST /api/products/register`, `POST /api/products/stock`, `GET /api/products/check`, `POST/GET /api/locations` — **no auth**: anyone can create/alter inventory, move stock between locations, rename locations.
- `POST /api/products/saveImage` — auth commented out.

**Action:** enforce auth in one place. Verify the JWT in `middleware.ts` (Edge-compatible, e.g. `jose`) for both pages and `/api/*`, then have routes read the identity middleware attaches. Add per-route authorization checks against the user's boolean permissions.

### C5. Path traversal / arbitrary file read in `/api/image`
`app/api/image/route.ts` takes `key` from the query string and joins it straight into a filesystem path with no sanitization or containment check:

```ts
const imagePath = path.join('public', process.env.NEXT_PUBLIC_IMAGES_PATH, `${image}`);
```

`?key=../../../../etc/passwd` escapes the intended directory and reads arbitrary server files (returned with an `image/png` content-type). It's also unauthenticated and uses sync `fs` calls in the request path.

**Action:** reject any `key` containing path separators / `..`, resolve the final path and assert it stays under the images directory (`path.resolve(...).startsWith(baseDir)`), and serve static images from `public/` normally rather than through an ad-hoc route.

### C6. Unauthenticated file upload
`POST /api/products/saveImage` has `validateJWT` commented out. The filename base is sanitized (good), but the **extension comes from the user-supplied `file.name`** and there's no type/size limit, so arbitrary files land in `public/`. Combined with C5, this is a stored-content vector.

**Action:** require auth, whitelist extensions/MIME, cap size, and store outside the web root (or in object storage) with server-generated names.

### C7. Self-service admin backdoor
`POST /api/users/login` — when the submitted `name` is `"admin"` and no such user exists, it **creates an admin account with a hardcoded bcrypt hash** and all permissions. Anyone who posts `{name:"admin"}` provisions the admin account, whose password is whatever that fixed hash corresponds to (known to whoever generated it).

**Action:** remove this block entirely. Seed the first admin with a proper one-off script / migration, not from the login handler.

---

## 🟠 High — will break or misbehave on the declared stack

### H1. The code targets Next 13/14 but `package.json` pins Next 16
`next: "^16.2.6"` resolves to Next 16 (current stable is 16.2.x), yet `eslint-config-next` is pinned to `14.0.1` and the code uses APIs that **changed in Next 15/16**:

- **`cookies()` is async in Next 15+.** `validateJWT` calls `cookies().set(...)` / `cookies().delete(...)` synchronously — these need `await`.
- **Dynamic route `params` is async in Next 15+.** `app/api/users/[userid]/route.ts` does `params.userid` synchronously; it must be `const { userid } = await params`.
- **`images.domains` is deprecated** (use `images.remotePatterns`), and the odd `images.path` / the `mydomain.com` placeholder look leftover.
- **`next.config.js` does `require("./config.ts")`.** Plain Node can't `require` a TypeScript file; this is fragile at best.

**Action:** pick the target version deliberately. Either commit to Next 16 and work through `npx @next/codemod@canary upgrade latest` + the [v16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16) (async `cookies`/`params` are the big ones), or pin to the Next 14 line to match the code and upgrade later as a separate task. Don't leave the versions mismatched.

### H2. Database connection is neither cached nor awaited
`config/dbConfig.ts` calls `mongoose.connect(...)` at module load on every route, never awaits it, and never checks `mongoose.connection.readyState`. Every model file also **deletes and recreates the Mongoose model on each import**. Under dev HMR and serverless this produces connection churn and race conditions (queries firing before the connection is ready).

**Action:** use the standard cached-connection singleton (a global `mongoose` promise reused across invocations) and register each model once with the `models.X || model('X', schema)` guard.

### H3. Money is stored and computed as floating-point
All prices/taxes are `Number` (IEEE-754 float) and the code does weighted-average price math (`recording/route.ts`) and profit aggregation across `queryOne`/`queryAll`. Floats accumulate rounding error — unacceptable for financial/inventory records over time. There are also **division-by-zero paths** (`avgBuyPrice = totalBuyPrice / totalBuyUnits` with zero buys → `NaN`/`Infinity`) that then flow into totals.

**Action:** store money as integer minor units (cents) or `Decimal128`, centralize the money math, and guard every divisor.

### H4. Inconsistent / broken date handling
Records store `createdTime` as `new Date().toLocaleString()` (a locale- and host-timezone-dependent string) **and** rely on Mongoose `timestamps` (`createdAt`). `history/route.ts` then filters on `createdAt` with `start`/`end` values from the request. Mixing a display string and the real timestamp, plus `toLocaleString()`, makes range queries and reporting unreliable across environments.

**Action:** store real `Date`/UTC everywhere, query on the indexed `createdAt`, and format for display only at the edge.

### H5. `.populate()` on non-reference fields
`queryOne` does `.populate("productCode")` and `queryAll` does `.populate("productCode").populate("market")`, but those schema fields are plain `String`, not `ObjectId` refs. These calls are no-ops (or throw on stricter Mongoose) and signal a data-model that was never wired up as relations.

**Action:** either model real references (`ref` + `ObjectId`) or drop the `populate` calls.

---

## 🟡 Medium — correctness, robustness, hygiene

- **No input validation anywhere.** Routes trust `reqBody` shape. `register` does `reqBody.userAuthority.includes(...)` — a missing field throws and returns a 500. Add schema validation (e.g. `zod`) at every route boundary.
- **Error handling leaks internals and uses wrong status codes.** Almost every `catch` returns `error.message` with `status: 500`, including auth and validation failures (should be `401`/`400`). Don't echo raw error messages to clients.
- **Cookie lifetime bug.** Login and `validateJWT` set `maxAge: 10 * 60 * 1000` — `maxAge` is in **seconds**, so the cookie lives ~7 days, not the intended 10 minutes, while the JWT itself expires in `10m`. The two are out of sync.
- **Authorization is client-side only.** `AntdProvider` builds the menu from the user's permission booleans, but nothing server-side stops a user from calling an endpoint for a feature they lack. Enforce permissions on the server.
- **`AntdProvider` mutates React state directly.** `const tempMenuItems = menuItems; tempMenuItems[pos].name = ...; setMenuItems(tempMenuItems)` mutates the existing array and re-sets the same reference — an anti-pattern that makes menu rendering order-dependent and fragile. Build a new array from the permissions each render.
- **No rate limiting** on login or any mutating endpoint.

---

## 🔵 Low — quality & maintenance

- **Dependency bloat / duplication:** `express` is unused in an App-Router app; three overlapping cookie libraries are present (`next-cookie`, `next-cookies`, `nookies`). Prune them.
- **TypeScript is `strict` but the code is `any`-typed throughout**, and `tsconfig` `target` is `es5` (bump to `es2017`+). You're paying for strict mode without the benefit.
- **Dead commented-out code** in nearly every file (whole alternate `calculateMetrics`, login page JSX, route stubs). Delete it; git is your history.
- **Mongoose 7** works but is two majors behind (9.x is current); plan the bump alongside the Next upgrade.
- **No `package-lock.json` committed, no tests, no CI.** Commit the lockfile, add a smoke test per route, wire a minimal CI (`lint` + `build`).
- `README.md` is the generic create-next-app text.

---

## Suggested order of work

1. **Contain the secret exposure (C1, C2):** rotate all DB passwords + JWT secret, remove secrets from source and `next.config` `env`, scrub history.
2. **Rebuild the auth spine (C3, C4, C7):** throwing `validateJWT`, JWT verification in middleware for pages **and** `/api/*`, per-route permission checks, delete the admin backdoor.
3. **Close the file endpoints (C5, C6):** contain the image path, lock down uploads.
4. **Pin the framework and fix breaking changes (H1, H2):** choose Next 14 or 16, fix async `cookies`/`params`, `images.remotePatterns`, and the DB-connection singleton — get a clean `next build`.
5. **Fix the data/money correctness (H3, H4, H5):** integer/Decimal money, real dates, drop dead `populate`.
6. **Then** the Medium/Low hygiene items as you touch each area.

Items 1–2 are the ones I'd not deploy without.

---

_Sources for version claims: [Next.js v16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [Next.js `cookies` reference](https://nextjs.org/docs/app/api-reference/functions/cookies), [Mongoose version support](https://mongoosejs.com/docs/version-support.html)._
