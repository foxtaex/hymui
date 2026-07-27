// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { describe, expect, it } from "vitest";

import AppShell from "./AppShell.vue";

const TestIcon = defineComponent({
  template: "<span />",
});

describe("AppShell", () => {
  it("updates the navigation position", async () => {
    const wrapper = mount(AppShell, {
      props: {
        active: "projects",
        nav: [{ icon: TestIcon, id: "projects", label: "Projects" }],
        navPosition: "bottom",
      },
    });

    expect(wrapper.classes()).toContain("hm-app-shell--nav-bottom");
    expect(wrapper.find(".hm-app-shell__nav-indicator").exists()).toBe(true);

    await wrapper.setProps({ navPosition: "top" });

    expect(wrapper.classes()).toContain("hm-app-shell--nav-top");
    expect(wrapper.classes()).not.toContain("hm-app-shell--nav-bottom");
  });

  it("exposes the active mobile item index for the sliding indicator", async () => {
    const wrapper = mount(AppShell, {
      props: {
        active: "board",
        nav: [
          { icon: TestIcon, id: "projects", label: "Projects" },
          { icon: TestIcon, id: "board", label: "Board" },
        ],
      },
    });

    expect(wrapper.find(".hm-app-shell__mobile-nav").attributes("style")).toContain(
      "--hm-mobile-active-index: 1",
    );

    await wrapper.setProps({ active: "projects" });

    expect(wrapper.find(".hm-app-shell__mobile-nav").attributes("style")).toContain(
      "--hm-mobile-active-index: 0",
    );
  });
});
