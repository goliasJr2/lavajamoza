"use client";

import type { MouseEvent, ReactNode } from "react";

export default function SmoothScrollLink({ href, className, children }: { href: `#${string}`; className: string; children: ReactNode }) {
  function scrollToTarget(event: MouseEvent<HTMLAnchorElement>) {
    const id = href.slice(1);
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    window.history.replaceState(window.history.state, "", href);
  }

  return <a className={className} href={href} onClick={scrollToTarget}>{children}</a>;
}
