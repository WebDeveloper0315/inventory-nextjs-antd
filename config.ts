// DEPRECATED — this file previously hard-coded the JWT secret and DB URI.
// Those secrets have been removed. All configuration now comes from
// environment variables loaded from `.env.local` (see `.env.example`).
//
// Server code reads `process.env.JWT_SECRET`, `process.env.DB_URI`, etc.
// This file is intentionally left empty and is safe to delete once nothing
// imports it.
export {};
