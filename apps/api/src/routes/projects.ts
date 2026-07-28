import { randomUUID } from "node:crypto";

import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  CreateProjectRequestSchema,
  ErrorResponseSchema,
  ProjectListSchema,
  ProjectSchema,
  UpdateProjectRequestSchema,
  type ErrorResponse,
} from "@hymui/contracts";
import { PersistenceError, type HymuiDatabase } from "@hymui/db";
import { Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";

import { authenticatedActor } from "../security.js";

const ProjectParamsSchema = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

function errorResponse(correlationId: string, code: string, message: string): ErrorResponse {
  return { code, correlationId, message };
}

function normalizedLinks(
  links: ReadonlyArray<{ kind: "external" | "repository"; label: string; url: string }> | undefined,
) {
  return links?.map((link) => ({
    kind: link.kind,
    label: link.label.trim(),
    url: link.url.trim(),
  }));
}

export async function registerProjectRoutes(
  app: FastifyInstance,
  database: HymuiDatabase,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    "/api/v1/projects",
    {
      schema: {
        response: {
          200: ProjectListSchema,
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
      return reply.send({ projects: [...(await database.projects.listByActor(actor.id))] });
    },
  );

  typedApp.post(
    "/api/v1/projects",
    {
      schema: {
        body: CreateProjectRequestSchema,
        response: {
          201: ProjectSchema,
          400: ErrorResponseSchema,
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
      if (!request.body.name.trim()) {
        return reply
          .status(400)
          .send(errorResponse(correlationId, "PROJECT_NAME_REQUIRED", "Project name is required."));
      }
      const links = normalizedLinks(request.body.links);
      if (links?.some((link) => !link.label)) {
        return reply
          .status(400)
          .send(errorResponse(correlationId, "PROJECT_LINK_INVALID", "Link labels are required."));
      }
      const project = await database.projects.create({
        ...(request.body.description === undefined
          ? {}
          : { description: request.body.description }),
        id: randomUUID(),
        ...(links === undefined ? {} : { links }),
        name: request.body.name.trim(),
        ownerId: actor.id,
        timestamp: new Date(),
      });
      return reply.status(201).send(project);
    },
  );

  typedApp.patch(
    "/api/v1/projects/:id",
    {
      schema: {
        body: UpdateProjectRequestSchema,
        params: ProjectParamsSchema,
        response: {
          200: ProjectSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          409: ErrorResponseSchema,
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
      try {
        if (request.body.name !== undefined && !request.body.name.trim()) {
          return reply
            .status(400)
            .send(
              errorResponse(correlationId, "PROJECT_NAME_REQUIRED", "Project name is required."),
            );
        }
        const links = normalizedLinks(request.body.links);
        if (links?.some((link) => !link.label)) {
          return reply
            .status(400)
            .send(
              errorResponse(correlationId, "PROJECT_LINK_INVALID", "Link labels are required."),
            );
        }
        const project = await database.projects.update({
          ...request.body,
          id: request.params.id,
          ...(links === undefined ? {} : { links }),
          ...(request.body.name === undefined ? {} : { name: request.body.name.trim() }),
          ownerId: actor.id,
          timestamp: new Date(),
        });
        if (!project) {
          return reply
            .status(404)
            .send(errorResponse(correlationId, "PROJECT_NOT_FOUND", "Project was not found."));
        }
        return reply.send(project);
      } catch (error) {
        if (error instanceof PersistenceError && error.code === "PERSISTENCE_CONFLICT") {
          return reply
            .status(409)
            .send(
              errorResponse(
                correlationId,
                "PROJECT_REVISION_CONFLICT",
                "Project changed after it was loaded.",
              ),
            );
        }
        throw error;
      }
    },
  );
}
