"use client";

import { useEffect } from "react";

export function HydrationSuppressor() {
  useEffect(() => {
    const originalError = console.error;
    console.error = (...args) => {
      const message = args[0];
      if (
        typeof message === "string" &&
        message.includes("hydrated but some attributes") &&
        message.includes("speedupyoutubeads") ||
        message.includes("resize")
      ) {
        return;
      }
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  return null;
} 