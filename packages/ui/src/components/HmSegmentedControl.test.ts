// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import HmSegmentedControl from "./HmSegmentedControl.vue";

describe("HmSegmentedControl", () => {
  it("moves to the selected option and emits changes", async () => {
    const wrapper = mount(HmSegmentedControl, {
      props: {
        id: "theme",
        label: "Color scheme",
        modelValue: "system",
        options: [
          { label: "Light", value: "light" },
          { label: "System", value: "system" },
          { label: "Dark", value: "dark" },
        ],
      },
    });

    expect(wrapper.attributes("style")).toContain("--hm-segment-index: 1");

    await wrapper.get("#theme-dark").trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([["dark"]]);
  });
});
