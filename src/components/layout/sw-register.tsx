"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for PWA functionality.
 * Renders nothing — side-effect only component.
 */
export function SwRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Register SW after page load for better performance
    const handler = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.warn("SW registration failed:", error);
        });
    };

    window.addEventListener("load", handler);

    return () => {
      window.removeEventListener("load", handler);
    };
  }, []);

  return null;
}
