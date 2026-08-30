/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // NOTE: secrets (DB_URI, JWT_SECRET) are NO LONGER placed in `env` — anything
  // here is inlined into the client bundle. Server code reads them from
  // process.env directly (loaded from .env.local). Only NEXT_PUBLIC_* vars are
  // exposed to the browser, and Next handles those automatically.
  images: {
    // `domains` is deprecated; use remotePatterns. Add real hosts here if you
    // ever serve remote images. Local /public images need no config.
    remotePatterns: [],
  },
  // NOTE: no `eslint` key here — Next 16 removed `next lint` and the
  // `eslint` config option along with it. Linting runs via the ESLint CLI
  // (`npm run lint`, configured in eslint.config.mjs), separate from the build.
};

module.exports = nextConfig;
