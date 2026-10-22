"use client";

import { useEffect, useState } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

export default function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent) && !("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone));
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPrompt);
    };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;
  if (promptEvent) return <button className="install-app-button" type="button" onClick={async () => {
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  }}>Instalar app</button>;
  if (isIos) return <details className="install-app-help"><summary>Instalar</summary><p>No Safari, toque em Partilhar e escolha “Adicionar ao ecrã principal”.</p></details>;
  return null;
}
