import { createHash, randomUUID } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { HymuiDatabase } from "./index.js";
import { createPgliteDatabase } from "./pglite.js";

describe("PGlite database adapter", () => {
  let database: HymuiDatabase;

  beforeEach(async () => {
    database = await createPgliteDatabase();
  });

  afterEach(async () => {
    await database.close();
  });

  it("persists an account, session, and owned project through provider-neutral ports", async () => {
    const timestamp = new Date("2026-07-26T10:00:00.000Z");
    const actor = await database.accounts.create({
      displayName: "Local Owner",
      id: randomUUID(),
      passwordHash: "argon2id-test-value",
      timestamp,
      username: "owner",
    });
    await database.sessions.create({
      actorId: actor.id,
      expiresAt: new Date("2026-08-02T10:00:00.000Z"),
      id: randomUUID(),
      timestamp,
      tokenHash: "session-token-hash",
    });
    const project = await database.projects.create({
      description: "Persistent from the first slice",
      id: randomUUID(),
      links: [
        {
          kind: "repository",
          label: "Core repository",
          url: "https://github.com/hymui/core",
        },
      ],
      name: "Hymui Plan 02",
      ownerId: actor.id,
      timestamp,
    });
    const outsider = await database.accounts.create({
      displayName: "Another Actor",
      id: randomUUID(),
      passwordHash: null,
      timestamp,
      username: "outsider",
    });

    expect(await database.accounts.findByUsername("OWNER")).toMatchObject({
      id: actor.id,
      username: "owner",
    });
    expect(await database.sessions.findByTokenHash("session-token-hash")).toMatchObject({
      actorId: actor.id,
    });
    expect(await database.projects.listByActor(actor.id)).toEqual([project]);
    expect(project.links).toEqual([
      {
        kind: "repository",
        label: "Core repository",
        url: "https://github.com/hymui/core",
      },
    ]);
    expect(await database.projects.listByActor(outsider.id)).toEqual([]);
    expect(await database.projects.findById(project.id, outsider.id)).toBeNull();
    expect(
      await database.projects.update({
        id: project.id,
        name: "Unauthorized rename",
        ownerId: outsider.id,
        revision: project.revision,
        timestamp,
      }),
    ).toBeNull();

    const attachment = await database.attachments.create({
      byteLength: 5,
      checksum: `sha256:${"0".repeat(64)}`,
      contentType: "text/plain",
      fileName: "notes.txt",
      id: randomUUID(),
      objectKey: `project-attachments/${randomUUID()}`,
      ownerId: actor.id,
      projectId: project.id,
      timestamp,
    });
    expect(attachment).toMatchObject({
      fileName: "notes.txt",
      projectId: project.id,
    });
    expect(await database.attachments.listByProject(project.id, actor.id)).toEqual([attachment]);
    expect(await database.attachments.listByProject(project.id, outsider.id)).toEqual([]);
    expect(await database.attachments.findById(attachment!.id, outsider.id)).toBeNull();
    expect(await database.attachments.delete(attachment!.id, actor.id)).toEqual(attachment);
    expect(await database.attachments.listByProject(project.id, actor.id)).toEqual([]);

    expect(await database.projects.delete(project.id, actor.id, project.revision)).toBeNull();
    const archivedProject = await database.projects.update({
      archived: true,
      id: project.id,
      ownerId: actor.id,
      revision: project.revision,
      timestamp,
    });
    expect(archivedProject).toMatchObject({ archived: true, revision: 2 });
    expect(
      await database.projects.delete(project.id, outsider.id, archivedProject!.revision),
    ).toBeNull();
    expect(await database.projects.delete(project.id, actor.id, archivedProject!.revision)).toEqual(
      archivedProject,
    );
  });

  it("applies the current migration exactly once", async () => {
    const firstStatus = await database.migrations.status();
    const secondStatus = await database.migrations.apply([]);

    expect(firstStatus).toHaveLength(4);
    expect(secondStatus).toEqual(firstStatus);
  });

  it("claims durable jobs with leases and rejects stale duplicate completion", async () => {
    const timestamp = new Date("2026-07-26T10:00:00.000Z");
    const leaseTokenHash = createHash("sha256").update("lease-token").digest("hex");
    const job = await database.diagnosticJobs.create({
      correlationId: randomUUID(),
      id: randomUUID(),
      request: { message: "Recover this job" },
      timestamp,
    });

    const claim = await database.diagnosticJobs.claimNext({
      leaseExpiresAt: new Date("2026-07-26T10:00:10.000Z"),
      leaseTokenHash,
      timestamp,
      workerId: randomUUID(),
    });
    expect(claim).toMatchObject({ attempt: 1, id: job.id, status: "running" });

    const completed = await database.diagnosticJobs.complete({
      id: job.id,
      leaseTokenHash,
      result: "done",
      timestamp: new Date("2026-07-26T10:00:01.000Z"),
    });
    expect(completed).toMatchObject({ result: "done", status: "completed" });

    expect(
      await database.diagnosticJobs.complete({
        id: job.id,
        leaseTokenHash,
        result: "duplicate",
        timestamp: new Date("2026-07-26T10:00:02.000Z"),
      }),
    ).toBeNull();
    expect(await database.diagnosticJobs.get(job.id)).toMatchObject({
      result: "done",
      status: "completed",
    });
  });
});
