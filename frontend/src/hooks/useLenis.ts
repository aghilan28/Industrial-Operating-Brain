"use client";

import { useEffect } from "react";
import { initLenis, destroyLenis } from "@/lib/lenis";

/**
 * Mount / unmount Lenis smooth scrolling.
 * Runs once at the root layout.
 */
export function useLenis() {
  useEffect(() => {
    initLenis();
    return () => {
      destroyLenis();
    };
  }, []);
}
