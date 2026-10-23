"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import PwaInstallButton from "@/components/PwaInstallButton";

function BrandLogo({ vertical = false }: { vertical?: boolean }) {
  return <Image
    className={`brand-logo${vertical ? " brand-logo-vertical" : ""}`}
    src={vertical ? "/brand/lava-ja-vertical.svg" : "/brand/lava-ja-horizontal.svg"}
    alt="Lava Já Smart"
    width={vertical ? 347 : 726}
    height={vertical ? 315 : 184}
    priority
  />;
}

const primaryNavigation = [
  { href: "/", label: "Serviços", mobileLabel: "Serviços", icon: "⌂" },
  { href: "/marcacoes", label: "Pré-marcação", mobileLabel: "Marcar", icon: "+" },
  { href: "/fila", label: "Acompanhar", mobileLabel: "Fila", icon: "◷" },
  { href: "/perfil", label: "Perfil", mobileLabel: "Perfil", icon: "◉" },
];

const extraNavigation = [
  { href: "/cartao", label: "Cartão virtual", icon: "▦" },
  { href: "/credito", label: "Crédito Lava Já", icon: "◉" },
  { href: "/fidelizacao", label: "Fidelização", icon: "✦" },
  { href: "/marketplace", label: "Marketplace", icon: "◈" },
  { href: "/notificacoes", label: "Notificações", icon: "◌" },
  { href: "/marcacoes/historico", label: "Histórico de marcações", icon: "◷" },
  { href: "/ao-redor", label: "À volta do Lava Já", icon: "⌖" },
];

export default function CustomerShell({ children, active }: { children: React.ReactNode; active: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuOpen]);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="customer-app">
      <a className="skip-link" href="#customer-content">Saltar para o conteúdo</a>
      {menuOpen && <button className="mobile-menu-backdrop" type="button" aria-label="Fechar menu" onClick={closeMenu} />}

      <aside id="customer-menu" className={`customer-sidebar${menuOpen ? " is-open" : ""}`} aria-label="Menu de navegação">
        <Link className="wordmark" href="/" aria-label="Lava Já Smart, início" onClick={closeMenu}><BrandLogo /></Link>
        <p className="sidebar-caption">CARWASH · MATOLA</p>
        <nav className="sidebar-navigation sidebar-primary-navigation" aria-label="Navegação principal">
          {primaryNavigation.map((item) => <Link className={`sidebar-link${active === item.href ? " active" : ""}`} href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined} onClick={closeMenu}>
            <span className="sidebar-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
          </Link>)}
        </nav>
        <details className="sidebar-extra-details" open={menuOpen || undefined}>
          <summary>Mais funcionalidades</summary>
          <nav className="sidebar-navigation sidebar-extra-navigation" aria-label="Mais funcionalidades">
            {extraNavigation.map((item) => <Link className={`sidebar-link${active === item.href ? " active" : ""}`} href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined} onClick={closeMenu}>
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>
            </Link>)}
          </nav>
        </details>
        <div className="sidebar-bottom">
          <PwaInstallButton />
          <div className="sidebar-location"><span className="open-dot" /><div><strong>Lava Já</strong><small>Matola, Moçambique</small></div></div>
          <Link className="sidebar-admin-link" href="/admin" onClick={closeMenu}><span aria-hidden="true">↗</span> Área da equipa</Link>
        </div>
      </aside>

      <div className="customer-workspace">
        <header className="customer-mobile-header">
          <Link className="wordmark" href="/" aria-label="Lava Já Smart, início"><BrandLogo /></Link>
          <button className={`mobile-menu-toggle${menuOpen ? " is-open" : ""}`} type="button" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="customer-menu" onClick={() => setMenuOpen((open) => !open)}>
            <span /><span /><span />
          </button>
        </header>
        <div className="customer-page-content" id="customer-content">{children}</div>
        <footer className="footer shell">
          <span>Lava Já Smart</span>
          <span>Uma nova forma de cuidar do seu carro. <Link href="/marcacoes/historico">As minhas marcações</Link> · <Link href="/notificacoes">Notificações</Link> · <Link href="/ao-redor">À volta do Lava Já</Link></span>
        </footer>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {primaryNavigation.map((item) => <Link className={`mobile-nav-link${active === item.href ? " active" : ""}`} href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>
          <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.mobileLabel}</span>
        </Link>)}
      </nav>
    </div>
  );
}
