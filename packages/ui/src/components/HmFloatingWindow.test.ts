// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { describe, expect, it } from "vitest";

import HmFloatingWindow from "./HmFloatingWindow.vue";

describe("HmFloatingWindow", () => {
  it("positions movable glass without a transformed backdrop layer", async () => {
    const wrapper = mount(HmFloatingWindow, {
      attachTo: document.body,
      props: { label: "Settings" },
      slots: { default: "Content" },
    });

    await nextTick();
    await nextTick();

    const windowElement = document.body.querySelector<HTMLElement>(".hm-floating-window");

    expect(windowElement?.style.left).toMatch(/px$/);
    expect(windowElement?.style.top).toMatch(/px$/);
    expect(windowElement?.style.transform).toBe("");

    wrapper.unmount();
  });
});
