// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import HmButton from "./HmButton.vue";

describe("HmButton", () => {
  it("forwards a click and exposes its loading state", async () => {
    const wrapper = mount(HmButton, {
      props: { loading: false },
      slots: { default: "Approve" },
    });

    await wrapper.get("button").trigger("click");
    expect(wrapper.emitted("click")).toHaveLength(1);
    expect(wrapper.get("button").attributes("aria-busy")).toBe("false");
  });

  it("disables interaction while loading", () => {
    const wrapper = mount(HmButton, {
      props: { loading: true },
      slots: { default: "Approve" },
    });

    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    expect(wrapper.get("button").attributes("aria-busy")).toBe("true");
  });
});
