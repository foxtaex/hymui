import { randomUUID } from "node:crypto";

import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  CreateProjectRequestSchema,
  DeleteProjectRequestSchema,
  ErrorResponseSchema,
  ProjectListSchema,
  ProjectSchema,
  UpdateProjectRequestSchema,
  type ErrorResponse,
} from "@hymui/contracts";
import { PersistenceError, type HymuiDatabase } from "@hymui/db";
import type { ObjectStorage } from "@hymui/storage";
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
  storage: ObjectStorage,
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

  typedApp.delete(
    "/api/v1/projects/:id",
    {
      schema: {
        body: DeleteProjectRequestSchema,
        params: ProjectParamsSchema,
        response: {
          204: Type.Null(),
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
      const project = await database.projects.findById(request.params.id, actor.id);
      if (!project) {
        return reply
          .status(404)
          .send(errorResponse(correlationId, "PROJECT_NOT_FOUND", "Project was not found."));
      }
      if (!project.archived) {
        return reply
          .status(409)
          .send(
            errorResponse(
              correlationId,
              "PROJECT_NOT_ARCHIVED",
              "Only archived projects can be deleted.",
            ),
          );
      }
      if (request.body.name !== project.name) {
        return reply
          .status(400)
          .send(
            errorResponse(
              correlationId,
              "PROJECT_DELETE_CONFIRMATION_MISMATCH",
              "Project name does not match.",
            ),
          );
      }
      if (request.body.revision !== project.revision) {
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

      const attachments = await database.attachments.listByProject(project.id, actor.id);
      const deleted = await database.projects.delete(project.id, actor.id, project.revision);
      if (!deleted) {
        return reply
          .status(409)
          .send(
            errorResponse(
              correlationId,
              "PROJECT_REVISION_CONFLICT",
              "Project changed while it was being deleted.",
            ),
          );
      }
      const storageResults = await Promise.allSettled(
        attachments.map((attachment) => storage.delete(attachment.objectKey)),
      );
      if (storageResults.some((result) => result.status === "rejected")) {
        request.log.warn(
          { correlationId, projectId: project.id },
          "Project deleted with orphaned attachment objects",
        );
      }
      return reply.status(204).send(null);
    },
  );
}
