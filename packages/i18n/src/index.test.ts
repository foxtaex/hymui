import { describe, expect, it } from "vitest";

import { messages } from "./index.js";

function flatten(value: object, prefix = ""): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" ? flatten(child as object, path) : [path];
  });
}

describe("translations", () => {
  it("keeps German in lockstep with English", () => {
    expect(flatten(messages.de)).toEqual(flatten(messages.en));
  });
});
