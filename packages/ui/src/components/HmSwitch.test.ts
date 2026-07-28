// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

import HmSwitch from "./HmSwitch.vue";

describe("HmSwitch", () => {
  it("emits the next checked state", async () => {
    const wrapper = mount(HmSwitch, {
      props: {
        id: "theme",
        label: "Dark theme",
        modelValue: false,
      },
    });

    await wrapper.get('input[type="checkbox"]').setValue(true);

    expect(wrapper.emitted("update:modelValue")).toEqual([[true]]);
  });
});
