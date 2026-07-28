import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { RuntimeConfig } from "@hymui/config";
import type {
  Project,
  ProjectAttachment,
  ProjectAttachmentList,
  ProjectList,
} from "@hymui/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../../apps/api/src/app.js";
import { createFilesystemObjectStorage } from "../../packages/storage/src/index.js";

const config: RuntimeConfig = {
  apiHost: "127.0.0.1",
  apiPort: 0,
  apiUrl: "http://127.0.0.1:0",
  databaseDriver: "pglite",
  databaseUrl: undefined,
  edition: "local",
  internalToken: "integration-internal-token",
  mode: "test",
  service: "api",
  storageDriver: "filesystem",
  storagePath: undefined,
  workerHost: "127.0.0.1",
  workerPort: 0,
  workerUrl: "http://127.0.0.1:1",
};

let api: Awaited<ReturnType<typeof buildApiApp>>;
let storageRoot: string;

beforeAll(async () => {
  storageRoot = await mkdtemp(join(tmpdir(), "hymui-api-storage-"));
  const storage = await createFilesystemObjectStorage({ rootDirectory: storageRoot });
  api = await buildApiApp({ config, logger: false, storage });
});

afterAll(async () => {
  await api.close();
  await rm(storageRoot, { force: true, recursive: true });
});

describe("account sessions and persistent project authorization", () => {
  let cookie: string;
  let project: Project;

  it("reports the available authentication paths before setup", async () => {
    const response = await api.inject({
      method: "GET",
      url: "/api/v1/auth/capabilities",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      edition: "local",
      localProfileAvailable: true,
      registrationOpen: true,
    });
  });

  it("allows browser clients to send project updates", async () => {
    const response = await api.inject({
      headers: {
        "access-control-request-headers": "content-type",
        "access-control-request-method": "PATCH",
        origin: "http://127.0.0.1:3000",
      },
      method: "OPTIONS",
      url: "/api/v1/projects/7548a934-de2e-4df2-b50f-6ec988c0685e",
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain("PATCH");
  });

  it("rejects unauthenticated project reads", async () => {
    const response = await api.inject({ method: "GET", url: "/api/v1/projects" });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "AUTH_REQUIRED" });
  });

  it("registers the first owner with an HttpOnly session", async () => {
    const response = await api.inject({
      method: "POST",
      payload: {
        displayName: "Ada Lovelace",
        password: "correct horse battery staple",
        username: "ada",
      },
      url: "/api/v1/auth/register",
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      actor: { displayName: "Ada Lovelace", username: "ada" },
    });
    const setCookie = response.headers["set-cookie"];
    expect(setCookie).toContain("HttpOnly");
    cookie = Array.isArray(setCookie) ? (setCookie[0] ?? "") : (setCookie ?? "");
  });

  it("closes first-owner setup and hides the conflicting local profile", async () => {
    const response = await api.inject({
      method: "GET",
      url: "/api/v1/auth/capabilities",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      edition: "local",
      localProfileAvailable: false,
      registrationOpen: false,
    });
  });

  it("creates and lists only the signed-in actor's projects", async () => {
    const createResponse = await api.inject({
      headers: { cookie },
      method: "POST",
      payload: {
        description: "The first durable product record",
        links: [
          {
            kind: "repository",
            label: "Core repository",
            url: "https://github.com/hymui/core",
          },
        ],
        name: "Plan 02",
      },
      url: "/api/v1/projects",
    });
    project = createResponse.json<Project>();

    expect(createResponse.statusCode).toBe(201);
    expect(project).toMatchObject({
      links: [{ kind: "repository", label: "Core repository" }],
      name: "Plan 02",
      revision: 1,
    });

    const listResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: "/api/v1/projects",
    });
    const list = listResponse.json<ProjectList>();

    expect(listResponse.statusCode).toBe(200);
    expect(list.projects).toEqual([project]);
  });

  it("edits project details and external links with a revision check", async () => {
    const response = await api.inject({
      headers: { cookie },
      method: "PATCH",
      payload: {
        description: "Updated project record",
        links: [
          {
            kind: "external",
            label: "Product brief",
            url: "https://example.com/hymui-brief",
          },
        ],
        name: "Plan 02 Updated",
        revision: project.revision,
      },
      url: `/api/v1/projects/${project.id}`,
    });
    project = response.json<Project>();

    expect(response.statusCode).toBe(200);
    expect(project).toMatchObject({
      description: "Updated project record",
      links: [{ kind: "external", label: "Product brief" }],
      name: "Plan 02 Updated",
      revision: 2,
    });
  });

  it("uploads, lists, downloads, and deletes an owned project attachment", async () => {
    const content = Buffer.from("Attachment content", "utf8");
    const uploadResponse = await api.inject({
      headers: {
        "content-type": "application/octet-stream",
        cookie,
        "x-hymui-file-content-type": "text/plain",
        "x-hymui-file-name": encodeURIComponent("Plan notes.txt"),
      },
      method: "POST",
      payload: content,
      url: `/api/v1/projects/${project.id}/attachments`,
    });
    const attachment = uploadResponse.json<ProjectAttachment>();

    expect(uploadResponse.statusCode).toBe(201);
    expect(attachment).toMatchObject({
      byteLength: content.byteLength,
      contentType: "text/plain",
      fileName: "Plan notes.txt",
      projectId: project.id,
    });

    const listResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: `/api/v1/projects/${project.id}/attachments`,
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json<ProjectAttachmentList>().attachments).toEqual([attachment]);

    const downloadResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: `/api/v1/attachments/${attachment.id}/content`,
    });
    expect(downloadResponse.statusCode).toBe(200);
    expect(downloadResponse.rawPayload).toEqual(content);
    expect(downloadResponse.headers["content-disposition"]).toContain("Plan notes.txt");

    const deleteResponse = await api.inject({
      headers: { cookie },
      method: "DELETE",
      url: `/api/v1/attachments/${attachment.id}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const missingResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: `/api/v1/attachments/${attachment.id}/content`,
    });
    expect(missingResponse.statusCode).toBe(404);
  });

  it("deletes only an archived project after its exact name is confirmed", async () => {
    const createResponse = await api.inject({
      headers: { cookie },
      method: "POST",
      payload: { name: "Disposable project" },
      url: "/api/v1/projects",
    });
    const disposable = createResponse.json<Project>();
    expect(createResponse.statusCode).toBe(201);

    const uploadResponse = await api.inject({
      headers: {
        "content-type": "application/octet-stream",
        cookie,
        "x-hymui-file-name": "disposable.txt",
      },
      method: "POST",
      payload: Buffer.from("Delete with project", "utf8"),
      url: `/api/v1/projects/${disposable.id}/attachments`,
    });
    const attachment = uploadResponse.json<ProjectAttachment>();
    expect(uploadResponse.statusCode).toBe(201);

    const activeDeleteResponse = await api.inject({
      headers: { cookie },
      method: "DELETE",
      payload: { name: disposable.name, revision: disposable.revision },
      url: `/api/v1/projects/${disposable.id}`,
    });
    expect(activeDeleteResponse.statusCode).toBe(409);
    expect(activeDeleteResponse.json()).toMatchObject({ code: "PROJECT_NOT_ARCHIVED" });

    const archiveResponse = await api.inject({
      headers: { cookie },
      method: "PATCH",
      payload: { archived: true, revision: disposable.revision },
      url: `/api/v1/projects/${disposable.id}`,
    });
    const archived = archiveResponse.json<Project>();
    expect(archiveResponse.statusCode).toBe(200);

    const mismatchResponse = await api.inject({
      headers: { cookie },
      method: "DELETE",
      payload: { name: "Disposable Project", revision: archived.revision },
      url: `/api/v1/projects/${archived.id}`,
    });
    expect(mismatchResponse.statusCode).toBe(400);
    expect(mismatchResponse.json()).toMatchObject({
      code: "PROJECT_DELETE_CONFIRMATION_MISMATCH",
    });

    const deleteResponse = await api.inject({
      headers: { cookie },
      method: "DELETE",
      payload: { name: archived.name, revision: archived.revision },
      url: `/api/v1/projects/${archived.id}`,
    });
    expect(deleteResponse.statusCode).toBe(204);

    const attachmentResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: `/api/v1/attachments/${attachment.id}/content`,
    });
    expect(attachmentResponse.statusCode).toBe(404);
  });

  it("archives and restores a project with revision checks", async () => {
    const archiveResponse = await api.inject({
      headers: { cookie },
      method: "PATCH",
      payload: {
        archived: true,
        revision: project.revision,
      },
      url: `/api/v1/projects/${project.id}`,
    });
    const archived = archiveResponse.json<Project>();

    expect(archiveResponse.statusCode).toBe(200);
    expect(archived).toMatchObject({ archived: true, revision: 3 });

    const restoreResponse = await api.inject({
      headers: { cookie },
      method: "PATCH",
      payload: {
        archived: false,
        revision: archived.revision,
      },
      url: `/api/v1/projects/${project.id}`,
    });
    project = restoreResponse.json<Project>();

    expect(restoreResponse.statusCode).toBe(200);
    expect(project).toMatchObject({ archived: false, revision: 4 });
  });

  it("logs out and invalidates the persisted session", async () => {
    const logoutResponse = await api.inject({
      headers: { cookie },
      method: "POST",
      url: "/api/v1/auth/logout",
    });
    expect(logoutResponse.statusCode).toBe(204);

    const sessionResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: "/api/v1/auth/session",
    });
    expect(sessionResponse.statusCode).toBe(401);
  });

  it("logs back in with the persisted account and restores project access", async () => {
    const loginResponse = await api.inject({
      method: "POST",
      payload: {
        password: "correct horse battery staple",
        username: "ada",
      },
      url: "/api/v1/auth/login",
    });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.json()).toMatchObject({
      actor: { displayName: "Ada Lovelace", username: "ada" },
    });

    const setCookie = loginResponse.headers["set-cookie"];
    cookie = Array.isArray(setCookie) ? (setCookie[0] ?? "") : (setCookie ?? "");

    const listResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: "/api/v1/projects",
    });

    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json<ProjectList>().projects).toHaveLength(1);
  });

  it("returns a stable error code for invalid credentials", async () => {
    const response = await api.inject({
      method: "POST",
      payload: {
        password: "not-the-right-password",
        username: "ada",
      },
      url: "/api/v1/auth/login",
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({ code: "INVALID_CREDENTIALS" });
  });
});
