import { randomUUID } from "node:crypto";

import type { RuntimeConfig } from "@hymui/config";
import {
  AuthCapabilitiesSchema,
  AuthSessionSchema,
  ErrorResponseSchema,
  LoginRequestSchema,
  RegisterRequestSchema,
  type Actor,
  type ErrorResponse,
} from "@hymui/contracts";
import { PersistenceError, type HymuiDatabase } from "@hymui/db";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import type { FastifyInstance } from "fastify";

import {
  SessionCookieName,
  authenticatedActor,
  clearSessionCookie,
  createSession,
  hashPassword,
  sessionTokenHash,
  setSessionCookie,
  verifyPassword,
} from "../security.js";

function errorResponse(correlationId: string, code: string, message: string): ErrorResponse {
  return { code, correlationId, message };
}

function publicActor(account: {
  createdAt: string;
  displayName: string;
  id: string;
  username: string;
}): Actor {
  return {
    createdAt: account.createdAt,
    displayName: account.displayName,
    id: account.id,
    username: account.username,
  };
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  database: HymuiDatabase,
  config: RuntimeConfig,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();
  const secureCookie = config.mode === "hosted";

  typedApp.get(
    "/api/v1/auth/capabilities",
    {
      schema: {
        response: {
          200: AuthCapabilitiesSchema,
        },
      },
    },
    async () => {
      const accountCount = await database.accounts.count();
      const localAccount =
        config.edition === "local" ? await database.accounts.findByUsername("local") : null;

      return {
        edition: config.edition,
        localProfileAvailable:
          config.edition === "local" && (accountCount === 0 || localAccount !== null),
        registrationOpen: config.edition === "hosted" || accountCount === 0,
      };
    },
  );

  typedApp.post(
    "/api/v1/auth/register",
    {
      schema: {
        body: RegisterRequestSchema,
        response: {
          201: AuthSessionSchema,
          400: ErrorResponseSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      if (config.edition !== "hosted" && (await database.accounts.count()) > 0) {
        return reply
          .status(403)
          .send(
            errorResponse(
              correlationId,
              "REGISTRATION_CLOSED",
              "Create additional accounts through workspace membership.",
            ),
          );
      }

      try {
        const timestamp = new Date();
        const account = await database.accounts.create({
          displayName: request.body.displayName.trim(),
          id: randomUUID(),
          passwordHash: await hashPassword(request.body.password),
          timestamp,
          username: request.body.username.toLowerCase(),
        });
        const session = await createSession(database, account.id);
        setSessionCookie(reply, session.token, secureCookie);
        return reply.status(201).send({
          actor: publicActor(account),
          expiresAt: session.expiresAt.toISOString(),
        });
      } catch (error) {
        if (error instanceof PersistenceError && error.code === "PERSISTENCE_DUPLICATE") {
          return reply
            .status(409)
            .send(errorResponse(correlationId, "USERNAME_TAKEN", "Username is already in use."));
        }
        throw error;
      }
    },
  );

  typedApp.post(
    "/api/v1/auth/login",
    {
      schema: {
        body: LoginRequestSchema,
        response: {
          200: AuthSessionSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      const account = await database.accounts.findByUsername(request.body.username);
      const valid =
        account?.passwordHash &&
        (await verifyPassword(account.passwordHash, request.body.password));
      if (!account || !valid) {
        return reply
          .status(401)
          .send(
            errorResponse(correlationId, "INVALID_CREDENTIALS", "Username or password is invalid."),
          );
      }
      const session = await createSession(database, account.id);
      setSessionCookie(reply, session.token, secureCookie);
      return reply.send({
        actor: publicActor(account),
        expiresAt: session.expiresAt.toISOString(),
      });
    },
  );

  typedApp.post(
    "/api/v1/auth/local",
    {
      schema: {
        response: {
          200: AuthSessionSchema,
          403: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      if (config.edition !== "local") {
        return reply
          .status(403)
          .send(
            errorResponse(correlationId, "LOCAL_AUTH_DISABLED", "Local profile is unavailable."),
          );
      }
      let account = await database.accounts.findByUsername("local");
      if (!account) {
        if ((await database.accounts.count()) > 0) {
          return reply
            .status(409)
            .send(
              errorResponse(
                correlationId,
                "LOCAL_PROFILE_CONFLICT",
                "This Local installation already has an account.",
              ),
            );
        }
        account = await database.accounts.create({
          displayName: "Local profile",
          id: randomUUID(),
          passwordHash: null,
          timestamp: new Date(),
          username: "local",
        });
      }
      const session = await createSession(database, account.id);
      setSessionCookie(reply, session.token, secureCookie);
      return reply.send({
        actor: publicActor(account),
        expiresAt: session.expiresAt.toISOString(),
      });
    },
  );

  typedApp.get(
    "/api/v1/auth/session",
    {
      schema: {
        response: {
          200: AuthSessionSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const correlationId = reply.getHeader("x-hymui-correlation-id") as string;
      const actor = await authenticatedActor(request, database);
      if (!actor) {
        return reply
          .status(401)
          .send(errorResponse(correlationId, "AUTH_REQUIRED", "Authentication is required."));
      }
      const token = request.cookies[SessionCookieName];
      const session = token
        ? await database.sessions.findByTokenHash(sessionTokenHash(token))
        : null;
      if (!session) {
        return reply
          .status(401)
          .send(errorResponse(correlationId, "AUTH_REQUIRED", "Authentication is required."));
      }
      return reply.send({ actor, expiresAt: session.expiresAt.toISOString() });
    },
  );

  typedApp.post(
    "/api/v1/auth/logout",
    {
      schema: {
        response: {
          204: { type: "null" },
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies[SessionCookieName];
      if (token) await database.sessions.deleteByTokenHash(sessionTokenHash(token));
      clearSessionCookie(reply, secureCookie);
      return reply.status(204).send(null);
    },
  );
}
