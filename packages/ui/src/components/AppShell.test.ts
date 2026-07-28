// @vitest-environment happy-dom

import { mount } from "@vue/test-utils";
import { defineComponent, markRaw } from "vue";
import { describe, expect, it } from "vitest";

import AppShell from "./AppShell.vue";

const TestIcon = markRaw(
  defineComponent({
    template: "<span />",
  }),
);

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
    expect(
      wrapper
        .find(".hm-app-shell__nav-item--active")
        .find(".hm-app-shell__item-indicator")
        .exists(),
    ).toBe(true);
    expect(wrapper.find(".hm-brand-mark").element.tagName).toBe("svg");
    expect(wrapper.find(".hm-brand img").exists()).toBe(false);

    await wrapper.setProps({ navPosition: "top" });

    expect(wrapper.classes()).toContain("hm-app-shell--nav-top");
    expect(wrapper.classes()).not.toContain("hm-app-shell--nav-bottom");

    await wrapper.setProps({ navPosition: "left" });
    expect(wrapper.classes()).toContain("hm-app-shell--nav-left");

    await wrapper.setProps({ navPosition: "right" });
    expect(wrapper.classes()).toContain("hm-app-shell--nav-right");
  });

  it("moves the liquid indicator to the active mobile item", async () => {
    const wrapper = mount(AppShell, {
      props: {
        active: "board",
        nav: [
          { icon: TestIcon, id: "projects", label: "Projects" },
          { icon: TestIcon, id: "board", label: "Board" },
        ],
      },
    });

    expect(
      wrapper
        .find(".hm-app-shell__mobile-item--active")
        .find(".hm-app-shell__item-indicator")
        .exists(),
    ).toBe(true);
    expect(wrapper.find(".hm-app-shell__mobile-item--active").text()).toContain("Board");

    await wrapper.setProps({ active: "projects" });

    expect(wrapper.find(".hm-app-shell__mobile-item--active").text()).toContain("Projects");
  });

  it("removes product navigation when the shell is used for authentication", async () => {
    const wrapper = mount(AppShell, {
      props: {
        active: "projects",
        nav: [{ icon: TestIcon, id: "projects", label: "Projects" }],
        navigationVisible: false,
      },
    });

    expect(wrapper.classes()).toContain("hm-app-shell--navigation-hidden");
    expect(wrapper.find(".hm-app-shell__bar-wrap").exists()).toBe(false);
    expect(wrapper.find(".hm-app-shell__mobile-nav").exists()).toBe(false);

    await wrapper.setProps({ navigationVisible: true });

    expect(wrapper.find(".hm-app-shell__bar-wrap").exists()).toBe(true);
    expect(wrapper.find(".hm-app-shell__mobile-nav").exists()).toBe(true);
  });
});
