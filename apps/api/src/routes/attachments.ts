import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";
import {
  ErrorResponseSchema,
  ProjectAttachmentListSchema,
  ProjectAttachmentSchema,
  type ErrorResponse,
  type ProjectAttachment,
} from "@hymui/contracts";
import type { HymuiDatabase, ProjectAttachmentRecord } from "@hymui/db";
import { StorageError, type ObjectStorage } from "@hymui/storage";
import { Type } from "@sinclair/typebox";
import type { FastifyInstance } from "fastify";

import { authenticatedActor } from "../security.js";

export const ProjectAttachmentMaxBytes = 20 * 1_024 * 1_024;

const ProjectParamsSchema = Type.Object(
  {
    projectId: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

const AttachmentParamsSchema = Type.Object(
  {
    id: Type.String({ format: "uuid" }),
  },
  { additionalProperties: false },
);

const UploadHeadersSchema = Type.Object(
  {
    "content-type": Type.Literal("application/octet-stream"),
    "x-hymui-file-content-type": Type.Optional(Type.String({ maxLength: 255, minLength: 1 })),
    "x-hymui-file-name": Type.String({ maxLength: 1_024, minLength: 1 }),
  },
  { additionalProperties: true },
);

function errorResponse(correlationId: string, code: string, message: string): ErrorResponse {
  return { code, correlationId, message };
}

function publicAttachment(record: ProjectAttachmentRecord): ProjectAttachment {
  return {
    byteLength: record.byteLength,
    checksum: record.checksum,
    contentType: record.contentType,
    createdAt: record.createdAt,
    fileName: record.fileName,
    id: record.id,
    projectId: record.projectId,
  };
}

function normalizeFileName(value: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return null;
  }
  const fileName = [...(decoded.split(/[\\/]/).at(-1)?.normalize("NFC") ?? "")]
    .filter((character) => {
      const codePoint = character.codePointAt(0);
      return codePoint !== undefined && codePoint > 0x1f && codePoint !== 0x7f;
    })
    .join("")
    .trim();
  return fileName && fileName.length <= 255 ? fileName : null;
}

function contentDisposition(fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `attachment; filename="${ascii || "attachment"}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

async function* bufferBody(body: Buffer): AsyncGenerator<Uint8Array, void, undefined> {
  yield body;
}

export async function registerAttachmentRoutes(
  app: FastifyInstance,
  database: HymuiDatabase,
  storage: ObjectStorage,
): Promise<void> {
  const typedApp = app.withTypeProvider<TypeBoxTypeProvider>();

  typedApp.get(
    "/api/v1/projects/:projectId/attachments",
    {
      schema: {
        params: ProjectParamsSchema,
        response: {
          200: ProjectAttachmentListSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
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
      if (!(await database.projects.findById(request.params.projectId, actor.id))) {
        return reply
          .status(404)
          .send(errorResponse(correlationId, "PROJECT_NOT_FOUND", "Project was not found."));
      }
      const attachments = await database.attachments.listByProject(
        request.params.projectId,
        actor.id,
      );
      return reply.send({ attachments: attachments.map(publicAttachment) });
    },
  );

  typedApp.post(
    "/api/v1/projects/:projectId/attachments",
    {
      schema: {
        headers: UploadHeadersSchema,
        params: ProjectParamsSchema,
        response: {
          201: ProjectAttachmentSchema,
          400: ErrorResponseSchema,
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
          413: ErrorResponseSchema,
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
      if (!(await database.projects.findById(request.params.projectId, actor.id))) {
        return reply
          .status(404)
          .send(errorResponse(correlationId, "PROJECT_NOT_FOUND", "Project was not found."));
      }

      const fileName = normalizeFileName(request.headers["x-hymui-file-name"]);
      if (!fileName) {
        return reply
          .status(400)
          .send(errorResponse(correlationId, "ATTACHMENT_NAME_INVALID", "File name is invalid."));
      }
      const contentType =
        request.headers["x-hymui-file-content-type"]?.trim() || "application/octet-stream";
      const body = request.body;
      if (!Buffer.isBuffer(body)) {
        return reply
          .status(400)
          .send(
            errorResponse(correlationId, "ATTACHMENT_BODY_REQUIRED", "File content is required."),
          );
      }
      if (body.byteLength > ProjectAttachmentMaxBytes) {
        return reply
          .status(413)
          .send(errorResponse(correlationId, "ATTACHMENT_TOO_LARGE", "File is too large."));
      }

      const id = randomUUID();
      const objectKey = `project-attachments/${id}`;
      const metadata = await storage.put({
        body: bufferBody(body),
        contentType,
        key: objectKey,
      });
      try {
        const attachment = await database.attachments.create({
          byteLength: metadata.byteLength,
          checksum: metadata.checksum,
          contentType: metadata.contentType,
          fileName,
          id,
          objectKey,
          ownerId: actor.id,
          projectId: request.params.projectId,
          timestamp: metadata.createdAt,
        });
        if (!attachment) {
          await storage.delete(objectKey);
          return reply
            .status(404)
            .send(errorResponse(correlationId, "PROJECT_NOT_FOUND", "Project was not found."));
        }
        return reply.status(201).send(publicAttachment(attachment));
      } catch (error) {
        await storage.delete(objectKey);
        throw error;
      }
    },
  );

  app.get<{ Params: { id: string } }>(
    "/api/v1/attachments/:id/content",
    {
      schema: {
        params: AttachmentParamsSchema,
        response: {
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
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
      const attachment = await database.attachments.findById(request.params.id, actor.id);
      if (!attachment) {
        return reply
          .status(404)
          .send(errorResponse(correlationId, "ATTACHMENT_NOT_FOUND", "Attachment was not found."));
      }
      const stored = await storage.get(attachment.objectKey);
      if (!stored) {
        return reply
          .status(404)
          .send(
            errorResponse(
              correlationId,
              "ATTACHMENT_CONTENT_NOT_FOUND",
              "Attachment content was not found.",
            ),
          );
      }
      reply
        .header("content-disposition", contentDisposition(attachment.fileName))
        .header("content-length", stored.metadata.byteLength)
        .header("content-type", attachment.contentType);
      return reply.send(Readable.from(stored.body));
    },
  );

  typedApp.delete(
    "/api/v1/attachments/:id",
    {
      schema: {
        params: AttachmentParamsSchema,
        response: {
          204: Type.Null(),
          401: ErrorResponseSchema,
          404: ErrorResponseSchema,
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
      const attachment = await database.attachments.findById(request.params.id, actor.id);
      if (!attachment) {
        return reply
          .status(404)
          .send(errorResponse(correlationId, "ATTACHMENT_NOT_FOUND", "Attachment was not found."));
      }
      try {
        await storage.delete(attachment.objectKey);
      } catch (error) {
        if (!(error instanceof StorageError && error.code === "OBJECT_NOT_FOUND")) throw error;
      }
      await database.attachments.delete(attachment.id, actor.id);
      return reply.status(204).send(null);
    },
  );
}
