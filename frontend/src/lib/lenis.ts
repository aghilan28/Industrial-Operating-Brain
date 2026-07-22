"use client";

import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let lenisInstance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;

/**
 * Initialize Lenis smooth scrolling, wired to GSAP ScrollTrigger.
 * Safe to call multiple times — will only create one instance.
 */
export function initLenis() {
  if (typeof window === "undefined") return null;
  if (lenisInstance) return lenisInstance;

  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });

  lenis.on("scroll", ScrollTrigger.update);

  tickerCallback = (time: number) => {
    lenis.raf(time * 1000);
  };
  gsap.ticker.add(tickerCallback);
  gsap.ticker.lagSmoothing(0, 0);

  lenisInstance = lenis;
  return lenis;
}

export function getLenis() {
  return lenisInstance;
}

export function destroyLenis() {
  if (lenisInstance) {
    lenisInstance.destroy();
    lenisInstance = null;
  }
  if (tickerCallback) {
    gsap.ticker.remove(tickerCallback);
    tickerCallback = null;
  }
}
