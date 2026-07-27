import type { RuntimeConfig } from "@hymui/config";
import type { Project, ProjectList } from "@hymui/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApiApp } from "../../apps/api/src/app.js";

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

beforeAll(async () => {
  api = await buildApiApp({ config, logger: false });
});

afterAll(async () => {
  await api.close();
});

describe("account sessions and persistent project authorization", () => {
  let cookie: string;

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

  it("creates and lists only the signed-in actor's projects", async () => {
    const createResponse = await api.inject({
      headers: { cookie },
      method: "POST",
      payload: {
        description: "The first durable product record",
        name: "Plan 02",
      },
      url: "/api/v1/projects",
    });
    const project = createResponse.json<Project>();

    expect(createResponse.statusCode).toBe(201);
    expect(project).toMatchObject({ name: "Plan 02", revision: 1 });

    const listResponse = await api.inject({
      headers: { cookie },
      method: "GET",
      url: "/api/v1/projects",
    });
    const list = listResponse.json<ProjectList>();

    expect(listResponse.statusCode).toBe(200);
    expect(list.projects).toEqual([project]);
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
});
