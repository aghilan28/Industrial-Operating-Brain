"use client";

import * as React from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Direction = "up" | "down" | "left" | "right";

export interface RevealProps {
  children: React.ReactNode;
  /** Translation distance in px */
  y?: number;
  x?: number;
  direction?: Direction;
  duration?: number;
  delay?: number;
  stagger?: number;
  blur?: number;
  start?: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  /** Target selector for child stagger. If set, children are animated as a group. */
  childSelector?: string;
}

/**
 * Reveal — generic scroll-triggered reveal wrapper.
 * Wraps the template's heading/card/section GSAP logic in a reusable component.
 */
export function Reveal({
  children,
  y = 24,
  x = 0,
  direction,
  duration = 0.9,
  delay = 0,
  stagger = 0,
  blur = 0,
  start = "top 85%",
  as: Tag = "div",
  className,
  childSelector,
}: RevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let ty = y;
    let tx = x;
    if (direction === "down") ty = -Math.abs(y);
    if (direction === "left") tx = Math.abs(x || y);
    if (direction === "right") tx = -Math.abs(x || y);
    if (direction === "up") ty = Math.abs(y);

    const targets = childSelector ? el.querySelectorAll(childSelector) : el;

    const fromVars: gsap.TweenVars = {
      opacity: 0,
      y: ty,
      x: tx,
      filter: blur ? `blur(${blur}px)` : undefined,
      duration,
      delay,
      stagger: stagger || undefined,
      ease: "power3.out",
      scrollTrigger: {
        trigger: el,
        start,
      },
    };

    gsap.from(targets, fromVars);
    const st = ScrollTrigger.getById?.(el.id || "");
    return () => {
      st?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Component = Tag as React.ElementType;
  return (
    <Component ref={ref} className={className}>
      {children}
    </Component>
  );
}
