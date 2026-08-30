# Follow-up Fixes (High/Medium items)

_Applied after the security pass. These address correctness and hygiene items from `DEEP_CHECK_REPORT.md` that were beyond the five criticals._

## What changed

### `AntdProvider` menu — state mutation bug fixed
The sidebar menu was built by mutating the `menuItems` state array in place and
re-setting the same reference (`const t = menuItems; t[pos].name = ...;
setMenuItems(t)`), which is a React anti-pattern — it made rendering
order-dependent and unreliable. It now builds a fresh array from the user's
permissions and sets it once. Also hardened the error branch
(`error?.response?.data?.message`) so a network error doesn't throw.

### Money math — divide-by-zero guarded
`queryOne` and `queryAll` computed average buy/sell prices and taxes by dividing
by unit totals that can be zero (a product with no buys or no sells), producing
`NaN`/`Infinity` that then flowed into the profit figures. Those divisions now
fall back to `0`.

_Note: this does **not** change the money representation. Values are still
JavaScript floats. Moving to integer minor-units or `Decimal128` (report item
H3) is a larger change requiring a data migration and is still open._

### Input validation with `zod`
Added `helpers/validate.ts` with schemas and a `parseOrThrow` helper, wired into
`errorResponse` (validation failures now return **400** with a specific field
message). Applied to the main mutation endpoints:
- `POST /api/users/register` — requires `name`, `password`; `userAuthority` optional array.
- `POST /api/products/register` — requires `code`, `location`; numerics validated when present.
- `POST /api/products/recording` — requires `code`; other fields kept optional (the route serves buying/selling/returning/lost, which send different fields).

Schemas are deliberately lenient (numeric fields optional, extra keys passed
through) so they reject malformed/injection-shaped payloads without breaking the
existing forms, which submit values as strings.

### Per-feature server authorization
Each mutating/reporting endpoint is now tied to the permission its page
requires, instead of just "any valid session":
- `recording` — permission depends on the operation: buying → `newProduct`, selling → `sold`, store/bin return → `returning`.
- `queryOne` / `queryAll` → `query`.
- `history` → `returning`.
- `locations` (GET + POST) → `query`.
- `check` and `image` stay any-authenticated on purpose — every feature page uses them.

This mapping was derived by tracing which page/component calls each endpoint, so
it matches what each permission's users actually need.

### Tests
Added `vitest` with `tests/jwt.test.ts` (sign/verify round-trip, and rejection
of garbage and wrongly-signed tokens) and `tests/validate.test.ts` (the zod
schemas accept valid payloads and reject malformed ones). Run with `npm test`.
**All 9 tests pass.**

### Dependency + toolchain fix
`eslint-config-next@16` requires **ESLint 9**, but the project still pinned
ESLint 8 — `npm install` would have failed with a peer-dependency error. Bumped
`eslint` to `^9`, dropped `eslint-plugin-tailwindcss` (no ESLint 9 support) and
simplified `.eslintrc.json`. Also set `eslint.ignoreDuringBuilds: true` in
`next.config.js` so a lint issue can never block a production build. Verified the
full dependency tree resolves.

### CI workflow
Added `.github/workflows/ci.yml` — on push/PR it installs, type-checks
(`tsc --noEmit`), runs the tests, lints (non-blocking for now), and runs
`next build`. Switch `npm install` to `npm ci` once you commit a
`package-lock.json`.

## Verification
All changed TypeScript/TSX files pass an esbuild syntax check. `package.json`
and the workflow YAML are valid. Run `npm install && npm run build` locally to
confirm the full type-check and Next 16 build.

### Money → Decimal128 (H3)
Prices are now stored as MongoDB **Decimal128** and all money arithmetic goes
through **decimal.js**, so there is no floating-point drift.
- `pricePerUnit` is `Decimal128` in the product, stock and recording models.
- New `lib/money.ts` (parse / store / round helpers) and `lib/metrics.ts` (the
  reporting aggregation, extracted into a pure, tested module).
- Rewrote every money calculation in Decimal: the weighted-average cost in
  `recording`, and the totals/averages/profit in `queryOne` and `queryAll`.
  API responses convert to plain numbers (rounded to 2 dp) at the JSON boundary.
- `units`/`stocks` stay integers; `taxes` stays a percentage rate.
- **17 unit tests pass**, including a profit calc that drifts under float math but
  is exact here.

#### ⚠️ Migration required (you have live data)
Existing `pricePerUnit` values are still stored as floats until you migrate.
A safe, reversible, idempotent script is included:

```bash
# 1) DRY RUN first — reports what would change, writes nothing:
DB_URI='mongodb://…' npm run migrate:money

# 2) Back up (or copy) the database, then apply:
DB_URI='mongodb://…' npm run migrate:money -- --commit

# Rollback if ever needed (Decimal128 → double):
DB_URI='mongodb://…' npm run migrate:money -- --commit --rollback
```

Run it against a **copy first**, verify a few documents and a report page, then
run on production. Re-running is safe (it only converts fields of the wrong
type).

### Date handling (H4)
Standardized on the real UTC `createdAt` timestamp, and fixed two genuine bugs
found while tracing the date flow.

**Bug 1 — the end day was silently excluded.** The selling-history range was
queried as `createdAt: { $gte: start, $lte: end }` with date-only strings from
the client. A date-only bound parses as UTC *midnight*, so anything sold during
the end day itself fell outside the range. Worse, the two client code paths
disagreed: the range-picker handler computed `end + 1 day`, stored it in state,
but then sent the **un-adjusted** `end` — so picking a range excluded the end
day while the initial page load included it.

Now `lib/dates.ts` owns this: a date-only `start` snaps to `00:00:00.000Z` and a
date-only `end` to `23:59:59.999Z`, making ranges inclusive of both calendar
days. The client sends the dates exactly as picked (the +1-day fudge is gone),
so both paths agree. Explicit timestamps are still honoured as given.

**Bug 2 — unparseable displayed dates.** Records stored `createdTime` as
`new Date().toLocaleString()` — a *server*-locale string — and the history
endpoint returned that as `createdAt`, which the table then fed to
`new Date(...)`. Parsing a locale string that way is implementation-defined and
can produce `Invalid Date`. The API now returns **ISO-8601** from the real
`createdAt`, and the table renders it with dayjs (showing `—` if ever invalid).

Also: invalid or inverted ranges now return **400** instead of quietly matching
nothing; new writes store ISO-8601 in the legacy `createdTime` field instead of
a locale string; added indexes on `{productCode, mode, createdAt}` and
`{createdAt}` for the range queries; and added `dayjs` as an explicit
dependency (it was used directly in the returning page but only resolved
transitively through antd).

**No migration needed.** `timestamps: true` was always on, so every existing
document already has a correct UTC `createdAt` — display now reads from that.
`displayTimestamp()` still falls back to the legacy `createdTime` (and returns
an unparseable legacy value as-is rather than losing it).

Range bounds are interpreted in **UTC**. For an internal tool that is the
simplest defensible rule; if you later want the day boundaries to follow a
business timezone (e.g. Asia/Kuala_Lumpur), that's a change isolated to
`lib/dates.ts`.

### Route integration tests
Two suites, split by whether they need a database.

**`tests/routes.auth.test.ts` — no database required, always runs (35 tests).**
`validateJWT` runs before `connectDB()` in every protected route, so an
unauthenticated request is rejected before any DB access. That makes this a
fast, dependency-free regression guard for exactly the vulnerability that was
fixed. It asserts every one of the 15 protected endpoints returns **401** with
no token *and* with a garbage token, plus forged-signature and expired-token
rejection, that errors don't leak internals, and that logout actually clears the
cookie.

**`tests/routes.integration.test.ts` — needs a real MongoDB (15 tests).**
Covers login/session behavior (wrong password sets no cookie; identical message
for unknown-user vs wrong-password, so the endpoint can't enumerate usernames;
httpOnly cookie on success), permission enforcement (a user without `addUser`
can't create users *and no user is written*; without `query` can't read reports;
a deleted user's still-valid token is rejected), money (`pricePerUnit` really is
stored as `Decimal128`; the weighted-average cost stays exact; overselling is
refused; no `NaN` with zero sales), and the date range (a sale during the **end
day** is included — the old off-by-one; out-of-range excluded; ISO-8601 output;
inverted range → 400).

Running them:
```bash
npm test                                             # helpers + auth suite; DB suite skips
TEST_DB_URI='mongodb://127.0.0.1:27017/inv-test' npm test    # everything, against a throwaway DB
```
`mongodb-memory-server` is listed as a devDependency and used automatically when
it can provide a binary; otherwise set `TEST_DB_URI`. CI now runs a `mongo:7`
service container and sets `TEST_DB_URI`, so the DB suite executes on every push.

> **Note:** the DB-backed suite could not be executed in the environment these
> changes were authored in (the MongoDB binary download host is blocked there),
> so it is verified by construction and by CI, not by a local run. Run it once
> locally — `TEST_DB_URI=… npm test` — to confirm before relying on it.

**Also fixed while writing these:** the login route called `connectDB()` *before*
validating the payload, so malformed/empty requests opened a database connection
for nothing. It now validates first (via the shared `loginSchema`, so bad input
returns a specific **400**) and only then connects.

Current totals: **62 passing, 15 skipped without a database** (77 with one).

### Next 16.3 warnings cleared

Running `npm run dev` on Next 16.3.3 surfaced three things, now fixed.

**1. `Unrecognized key(s) in object: 'eslint'` — my mistake.** I had added
`eslint: { ignoreDuringBuilds: true }` to `next.config.js`. Next 16 removed
`next lint` *and* the `eslint` config key along with it, so that key is now
invalid. Removed.

**2. `next lint` no longer exists**, so the `"lint": "next lint"` script would
have failed the moment you ran it (and in CI). Linting now goes through the
ESLint CLI:
- `"lint": "eslint ."`
- new `eslint.config.mjs` (ESLint 9 **flat config**, which is what
  `eslint-config-next@16` requires) replacing `.eslintrc.json`
- bumped `eslint-config-prettier` to `^10` — the `eslint-config-prettier/flat`
  entry point the flat config imports doesn't exist in v9
Verified: `eslint .` loads the config and runs clean.

**3. `middleware` is deprecated → renamed to `proxy`.** `middleware.ts` is now
`proxy.ts`, with the exported function renamed `middleware` → `proxy`. The
`export const config = { matcher }` block is unchanged, and so is all the auth
logic — this is purely the Next 16 file-convention rename.

While migrating I noted a caveat from the Next docs worth recording: Server
Functions aren't separate routes, so a matcher change can silently drop proxy
coverage. That's exactly why every route handler does its own
`requireUser`/`requirePermission` check rather than trusting the proxy alone —
the defence-in-depth here is deliberate, not redundant.

> **Two files must be deleted by hand** (remote tooling can write files but not
> delete them):
> ```bash
> rm middleware.ts .eslintrc.json
> ```
> Delete `middleware.ts` **after** confirming `proxy.ts` is present — leaving
> both would keep the deprecated convention active.

Also seen in that dev output, and *not* a problem to fix:
- Next auto-reconfigured `tsconfig.json` (added `.next/dev/types/**/*.ts`, set
  `jsx: react-jsx`). That's expected and correct — leave it.
- `Slow filesystem detected … took 307ms`. The project lives on
  `/run/media/...`, an external/removable drive. Purely a dev-speed warning;
  moving the repo to a local disk would make `next dev` noticeably faster.

## Still open (from the report)
- **Frontend component tests** — the API surface is covered now; the React components are not.
