# Security Fixes — Applied Changes & Required Manual Steps

_Applied 30 Aug 2026. Targets Next.js 16. Covers the five critical items (C1–C7) from `DEEP_CHECK_REPORT.md`._

## ⚠️ You must do these by hand — code changes alone are not enough

0. **Create `.env.local` yourself.** Remote tooling is blocked from writing `.env.local`, so it's the one file not applied automatically. Create it in the project root with:
   ```
   DB_URI=mongodb://127.0.0.1:27017/inventory-nextjs-antd
   JWT_SECRET=Zun5wZ3PNZDHtJWpvxQy0eU0dVgy3Uz3YDBjFUs5DalSSmlNsOU0E463kj9pl0Do
   NEXT_PUBLIC_IMAGES_PATH=/productImage
   ```
   (Dev-only secret — use a different one in production. `.env.local` is git-ignored.)
1. **Rotate every exposed credential now.** These were committed in plaintext and must be treated as compromised:
   - MongoDB Atlas users `sathya` (cluster `wrqpt`) and `superstar9772` (cluster `ysxjxvp`) — change their passwords in Atlas (or delete the users).
   - The JWT secret (`blackghost`) — a new dev secret is already in `.env.local`; set a **different** strong one in your production host's environment (`openssl rand -base64 48`).
2. **Scrub git history.** Neutralizing the files (done) doesn't remove the secrets from past commits. Run BFG or `git filter-repo` to purge `.local.env` and the old `config.ts`, then force-push and re-rotate:
   ```bash
   git rm --cached .local.env config.ts        # stop tracking (files are now emptied)
   git filter-repo --path .local.env --path config.ts --invert-paths   # purge from history
   ```
3. **Reinstall dependencies.** `package.json` changed (added `jose`, `tsx`; removed `express`, `jsonwebtoken`, `next-cookie`, `next-cookies`, `nookies`). Recommended:
   ```bash
   rm -rf node_modules package-lock.json && npm install
   ```
4. **Create the admin account** (the login backdoor was removed):
   ```bash
   ADMIN_NAME=admin ADMIN_PASSWORD='a-strong-password' \
   DB_URI='mongodb://127.0.0.1:27017/inventory-nextjs-antd' \
   npm run seed:admin
   ```
   Existing users are unaffected. If you previously logged in through the old `admin` auto-create, reset that account's password.
5. **Delete the dead files** once nothing imports them: `git rm config.ts .local.env` (both are emptied of secrets and no longer read).
6. **Serve over HTTPS in production.** Auth cookies are now `secure` in production, so they won't be sent over plain HTTP.

## What changed in the code

### C1 — Secrets removed from source
- `config.ts` emptied (no more hardcoded `JWT_SECRET`/`DB_URI`).
- `.local.env` emptied (it held live Atlas credentials; note it was never actually loaded by Next — a misnamed file).
- New `.env.example` (committed, no secrets) and `.env.local` (git-ignored, real local values).
- `.gitignore` now ignores `.env`, `.env.*`, and `.local.env` (keeps `.env.example`), and the uploaded `public/productImage` folder.

### C2 — Secrets no longer shipped to the browser
- `next.config.js` no longer puts `DB_URI`/`JWT_SECRET` in the `env` block (that inlined them into client JS). Server code reads `process.env.*` directly; only `NEXT_PUBLIC_*` reaches the browser. Also replaced the deprecated `images.domains` with `remotePatterns`.

### C3 — Authentication actually enforced
- New `lib/jwt.ts` — sign/verify with **`jose`** (Edge-compatible, works in middleware), an `AuthError` type, and correct cookie options (`httpOnly`, `sameSite`, `secure` in prod, `path`, and `maxAge` in **seconds**, fixing the ms/seconds bug).
- `helpers/validateJWT.ts` now **throws** on a missing/invalid token instead of swallowing the error and returning `undefined` (which had made every "protected" route effectively public). It no longer mutates cookies as a side effect.
- New `helpers/auth.ts` — `requireUser`, `requirePermission(key)`, and `errorResponse` (maps auth failures to **401**, everything else to a generic **500** without leaking internals).

### C4 — The whole surface is guarded
- `middleware.ts` now verifies the JWT signature and runs on **all** routes including `/api/*` (matcher widened), returning **401** for API and redirecting pages to `/login`. Public allow-list: `/login`, `/api/users/login`, `/api/users/logout`.
- Per-route authorization added where it was missing: user create/update require `addUser`; product create / stock / image upload require `newProduct`; recording, check, locations, queries require a valid session. `PUT /api/users` no longer blindly spreads the request body (it whitelists fields and hashes any new password).

### C5 — Image path traversal closed
- `app/api/image/route.ts` rejects keys containing `/`, `\`, or `..`, resolves the path and asserts it stays inside the images directory, restricts to known image extensions, requires auth, and uses async `fs`.

### C6 — Upload endpoint locked down
- `app/api/products/saveImage/route.ts` now requires the `newProduct` permission, whitelists extension **and** MIME type, and caps size at 5 MB.

### C7 — Admin backdoor removed
- `app/api/users/login/route.ts` no longer auto-creates an `admin` with a hardcoded hash. Login now returns a generic 401 on bad credentials (no user-enumeration). Use `scripts/seedAdmin.ts` (`npm run seed:admin`) to create the first admin.

### Bonus (needed for the above to work correctly)
- `config/dbConfig.ts` is now a cached async connection singleton, so `await connectDB()` is meaningful and imports don't open new connections.
- Removed no-op `.populate()` calls on plain-string fields (`queryAll`, `queryOne`) — those throw in newer Mongoose.

## Verification done
- All 29 changed/new TypeScript files pass an esbuild syntax check.
- No remaining imports of `jsonwebtoken` or `require("./config.ts")`; no stray top-level `connectDB()` calls.

**Before deploying**, run `npm install` then `npm run build` locally and click through login → each page once. The build is the real integration test for the Next 16 async-API changes.

## Not addressed here (still open from the report)
These are the High/Medium items beyond the five criticals — worth a follow-up pass: floating-point money math (use integers/Decimal128), inconsistent date handling (`toLocaleString` strings vs `createdAt`), the client-only menu authorization + direct state mutation in `AntdProvider`, a validation library (e.g. `zod`) at route boundaries, and tests/CI. The remaining Next 16 codemod items can be swept with `npx @next/codemod@canary upgrade latest`.
