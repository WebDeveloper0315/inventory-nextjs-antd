import { NextRequest } from "next/server";
import { signToken, COOKIE_NAME } from "@/lib/jwt";

/** All permission flags, for building test users. */
export const ALL_PERMISSIONS = {
  newProduct: true,
  sold: true,
  returning: true,
  query: true,
  addUser: true,
};

export const NO_PERMISSIONS = {
  newProduct: false,
  sold: false,
  returning: false,
  query: false,
  addUser: false,
};

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** A signed token to send as the auth cookie; omit for an anonymous request. */
  token?: string;
  /** Send a deliberately bad cookie value. */
  rawCookie?: string;
}

/** Build a NextRequest against a route, optionally authenticated. */
export function makeRequest(url: string, opts: RequestOptions = {}): NextRequest {
  const { method = "GET", body, token, rawCookie } = opts;

  const headers: Record<string, string> = {};
  const cookie = rawCookie ?? (token ? `${COOKIE_NAME}=${token}` : undefined);
  if (cookie) headers.cookie = cookie;
  if (body !== undefined) headers["content-type"] = "application/json";

  return new NextRequest(new URL(url, "http://localhost").toString(), {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  } as any);
}

/** Sign a token for a given user id (defaults to an arbitrary valid id). */
export async function tokenFor(userId: string): Promise<string> {
  return signToken(userId);
}

/** Read a route handler's Response as JSON, tolerating empty bodies. */
export async function readJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return text;
  }
}
