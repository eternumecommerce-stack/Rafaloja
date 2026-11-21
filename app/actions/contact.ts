"use server";

import { db } from "@/lib/db";
import { rateLimit, TOO_MANY } from "@/lib/rate-limit";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ContactInput = {
  name: string;
  email: string;
  phone: string;
  message: string;
  /** Campo invisível: robôs costumam preencher, pessoas não */
  website?: string;
};

export type ContactResult =
  | { ok: true }
  | { error: string; fields?: Partial<Record<"email" | "message", string>> };

export async function sendContactMessage(input: ContactInput): Promise<ContactResult> {
  if (input.website) return { ok: true }; // spam: finge sucesso e descarta
  if (!(await rateLimit("contact", 5, 10 * 60_000))) return { error: TOO_MANY };

  const name = String(input.name ?? "").trim().slice(0, 120);
  const email = String(input.email ?? "").trim().toLowerCase();
  const phone = String(input.phone ?? "").trim().slice(0, 40);
  const message = String(input.message ?? "").trim();

  const fields: Partial<Record<"email" | "message", string>> = {};
  if (!email) fields.email = "This field is required";
  else if (!EMAIL_RE.test(email) || email.length > 254) fields.email = "Enter a valid email";
  if (!message) fields.message = "This field is required";
  else if (message.length > 5000) fields.message = "Message is too long";
  if (Object.keys(fields).length) return { error: "Please correct the fields below.", fields };

  try {
    await db.contactMessage.create({
      data: { name: name || null, email, phone: phone || null, message },
    });
    return { ok: true };
  } catch (e) {
    console.error("Contact form error", e);
    return { error: "Something went wrong. Please try again." };
  }
}
