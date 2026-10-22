"use client";

import { useEffect } from "react";

export default function PwaRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error: unknown) => {
      console.error("Não foi possível registar o service worker.", error);
    });
  }, []);
  return null;
}
