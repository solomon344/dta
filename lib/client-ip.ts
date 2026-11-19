import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/**
 * Salted hash of the visitor's IP (from the reverse proxy's X-Forwarded-For), for
 * rate-limiting public forms. Salted so the stored value can't be turned back into an IP.
 */
export async function clientIpHash(): Promise<string | null> {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim();
  if (!ip) return null;
  return createHash("sha256").update(`${process.env.BETTER_AUTH_SECRET}:${ip}`).digest("hex");
}
