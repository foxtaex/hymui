import { createHash, randomBytes, randomUUID } from "node:crypto";

import type { FastifyReply, FastifyRequest } from "fastify";
import { hash, verify } from "@node-rs/argon2";
import type { Actor } from "@hymui/contracts";
import type { HymuiDatabase } from "@hymui/db";

export const SessionCookieName = "hymui_session";
export const SessionLifetimeSeconds = 60 * 60 * 24 * 7;

const passwordOptions = {
  algorithm: 2,
  memoryCost: 19_456,
  outputLen: 32,
  parallelism: 1,
  timeCost: 2,
} as const;

export function sessionTokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, passwordOptions);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  return verify(passwordHash, password);
}

export async function createSession(
  database: HymuiDatabase,
  actorId: string,
): Promise<{ expiresAt: Date; token: string }> {
  const token = randomBytes(32).toString("base64url");
  const timestamp = new Date();
  const expiresAt = new Date(timestamp.getTime() + SessionLifetimeSeconds * 1_000);
  await database.sessions.create({
    actorId,
    expiresAt,
    id: randomUUID(),
    timestamp,
    tokenHash: sessionTokenHash(token),
  });
  return { expiresAt, token };
}

export function setSessionCookie(reply: FastifyReply, token: string, secure: boolean): void {
  reply.setCookie(SessionCookieName, token, {
    httpOnly: true,
    maxAge: SessionLifetimeSeconds,
    path: "/",
    sameSite: "strict",
    secure,
  });
}

export function clearSessionCookie(reply: FastifyReply, secure: boolean): void {
  reply.clearCookie(SessionCookieName, {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure,
  });
}

export async function authenticatedActor(
  request: FastifyRequest,
  database: HymuiDatabase,
): Promise<Actor | null> {
  const token = request.cookies[SessionCookieName];
  if (!token) return null;
  const tokenHash = sessionTokenHash(token);
  const session = await database.sessions.findByTokenHash(tokenHash);
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now()) {
    await database.sessions.deleteByTokenHash(tokenHash);
    return null;
  }
  const account = await database.accounts.findById(session.actorId);
  if (!account) return null;
  return {
    createdAt: account.createdAt,
    displayName: account.displayName,
    id: account.id,
    username: account.username,
  };
}
