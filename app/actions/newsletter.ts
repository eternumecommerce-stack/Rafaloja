"use server";

import { db } from "@/lib/db";
import { rateLimit, TOO_MANY } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function subscribeToNewsletter(
  email: string,
  source: "home" | "checkout" = "home",
): Promise<{ ok: true } | { error: string }> {
  if (!(await rateLimit("newsletter", 5, 10 * 60_000))) return { error: TOO_MANY };
  const clean = String(email ?? "").trim().toLowerCase();
  if (!clean || !EMAIL_RE.test(clean) || clean.length > 254) {
    return { error: "Enter a valid email" };
  }
  try {
    // Reinscrever o mesmo email não é erro
    await db.newsletterSubscriber.upsert({
      where: { email: clean },
      create: { email: clean, source },
      update: {},
    });
    return { ok: true };
  } catch (e) {
    console.error("Newsletter subscribe error", e);
    return { error: "Something went wrong. Please try again." };
  }
}
