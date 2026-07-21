"use client";

/**
 * Reusable GSAP animation helpers.
 * Centralizes reveal/fade/slide/scale/hover/panel transition logic extracted
 * from the approved HTML template.
 */

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type AnimationTarget = string | Element | Element[] | NodeListOf<Element> | null;

export interface RevealOptions {
  y?: number;
  opacity?: number;
  blur?: number;
  duration?: number;
  delay?: number;
  stagger?: number;
  ease?: string;
  start?: string;
  trigger?: AnimationTarget;
}

const DEFAULTS = {
  y: 28,
  opacity: 0,
  blur: 0,
  duration: 0.9,
  delay: 0,
  stagger: 0.08,
  ease: "power3.out",
  start: "top 82%",
};

export function ensureScrollTrigger() {
  if (typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Reveal a frame / panel on scroll (from template's .frame-section animation).
 */
export function revealFrame(target: AnimationTarget, options?: RevealOptions) {
  ensureScrollTrigger();
  if (!target) return;
  const opts = { ...DEFAULTS, ...options };
  gsap.from(target, {
    y: opts.y,
    opacity: opts.opacity,
    filter: opts.blur ? `blur(${opts.blur}px)` : undefined,
    duration: opts.duration,
    delay: opts.delay,
    ease: opts.ease,
    scrollTrigger: {
      trigger: (opts.trigger as Element) || (target as Element),
      start: opts.start,
    },
  });
}

/**
 * Staggered reveal of children inside a block (hero .reveal-block).
 */
export function revealBlockChildren(parent: AnimationTarget, options?: RevealOptions) {
  if (!parent) return;
  const opts = { y: 24, stagger: 0.08, duration: 0.9, ease: "power3.out", ...options };
  const targets =
    typeof parent === "string"
      ? document.querySelectorAll(`${parent} > *`)
      : parent instanceof Element
        ? parent.children
        : parent;
  gsap.from(targets, {
    y: opts.y,
    opacity: 0,
    duration: opts.duration,
    stagger: opts.stagger,
    ease: opts.ease,
    delay: opts.delay,
  });
}

/**
 * Reveal a collection with stagger (cards, metrics, assets, protocol rows).
 */
export function revealStagger(
  target: AnimationTarget,
  options?: RevealOptions & { triggerStart?: string }
) {
  ensureScrollTrigger();
  if (!target) return;
  const opts = {
    y: 18,
    duration: 0.65,
    stagger: 0.06,
    ease: "power3.out",
    start: "top 78%",
    ...options,
  };
  gsap.from(target, {
    y: opts.y,
    opacity: 0,
    duration: opts.duration,
    stagger: opts.stagger,
    ease: opts.ease,
    scrollTrigger: {
      trigger: (opts.trigger as Element) || (target as Element),
      start: opts.start,
    },
  });
}

/**
 * Draw-in for dashed connector lines.
 */
export function drawConnectors(target: AnimationTarget, delay = 0.6) {
  if (!target) return;
  gsap.from(target, {
    strokeDashoffset: 80,
    opacity: 0,
    duration: 1.2,
    stagger: 0.12,
    delay,
    ease: "power2.out",
  });
}

/**
 * Heading word-by-word blur reveal from template.
 */
export function splitHeadingReveal(headings: NodeListOf<Element> | Element[]) {
  ensureScrollTrigger();
  headings.forEach((heading) => {
    const el = heading as HTMLElement;
    const existing = el.querySelectorAll(".word");
    if (existing.length === 0 && el.children.length === 0) {
      const text = el.innerText;
      el.innerHTML = text
        .split(" ")
        .map(
          (w) =>
            `<span style="display:inline-block;overflow:hidden;"><span class="word" style="display:inline-block;">${w}&nbsp;</span></span>`
        )
        .join("");
    }
    const targets = el.querySelectorAll(".word");
    if (targets.length === 0) return;
    gsap.fromTo(
      targets,
      { opacity: 0, y: 100, filter: "blur(12px)" },
      {
        scrollTrigger: { trigger: el, start: "top 90%" },
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 1.5,
        stagger: 0.1,
        ease: "power4.out",
      }
    );
  });
}

/**
 * Fade/slide in element on scroll (from template's p, button, details, .group).
 */
export function fadeSlideIn(target: AnimationTarget, options?: Partial<RevealOptions>) {
  ensureScrollTrigger();
  if (!target) return;
  const opts = { y: 30, blur: 8, duration: 1.4, start: "top 95%", ease: "power3.out", ...options };
  gsap.fromTo(
    target,
    { opacity: 0, y: opts.y, filter: `blur(${opts.blur}px)` },
    {
      scrollTrigger: { trigger: target as Element, start: opts.start },
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: opts.duration,
      ease: opts.ease,
    }
  );
}

/**
 * Parallax image scrub (template's img.object-cover effect).
 */
export function parallaxImage(img: HTMLImageElement | null) {
  ensureScrollTrigger();
  if (!img || !img.parentElement) return;
  img.parentElement.style.overflow = "hidden";
  gsap.fromTo(
    img,
    { y: "-15%", scale: 1.15 },
    {
      scrollTrigger: {
        trigger: img.parentElement,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
      y: "15%",
      ease: "none",
    }
  );
}

/**
 * Refresh ScrollTrigger (useful after route changes).
 */
export function refreshScroll() {
  if (typeof window === "undefined") return;
  ScrollTrigger.refresh();
}
