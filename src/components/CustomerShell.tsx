import Link from "next/link";
import Image from "next/image";

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

const navigation = [
  { href: "/", label: "Serviços", mobileLabel: "Serviços", icon: "⌂" },
  { href: "/marcacoes", label: "Pré-marcação", mobileLabel: "Marcar", icon: "+" },
  { href: "/fila", label: "Acompanhar", mobileLabel: "Fila", icon: "◷" },
  { href: "/credito", label: "Crédito Lava Já", mobileLabel: "Crédito", icon: "◉" },
  { href: "/fidelizacao", label: "Fidelização", mobileLabel: "Pontos", icon: "✦" },
];

export default function CustomerShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active: string;
}) {
  return (
    <div className="customer-app">
      <a className="skip-link" href="#customer-content">Saltar para o conteúdo</a>
      <aside className="customer-sidebar">
        <Link className="wordmark" href="/" aria-label="Lava Já Smart, início"><BrandLogo /></Link>
        <p className="sidebar-caption">CARWASH · MATOLA</p>
        <nav className="sidebar-navigation" aria-label="Navegação principal">
          {navigation.map((item) => (
            <Link
              className={`sidebar-link${active === item.href ? " active" : ""}`}
              href={item.href}
              key={item.href}
              aria-current={active === item.href ? "page" : undefined}
            >
              <span className="sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-location"><span className="open-dot" /><div><strong>Lava Já</strong><small>Matola, Moçambique</small></div></div>
          <Link className="sidebar-admin-link" href="/admin"><span aria-hidden="true">↗</span> Área da equipa</Link>
        </div>
      </aside>

      <div className="customer-workspace">
        <header className="customer-mobile-header">
          <Link className="wordmark" href="/" aria-label="Lava Já Smart, início"><BrandLogo /></Link>
          <div className="mobile-header-actions">
            <span className="customer-location"><span className="open-dot" />Matola</span>
            <Link className="mobile-admin-link" href="/admin">Equipa</Link>
          </div>
        </header>
        <div className="customer-page-content" id="customer-content">{children}</div>
        <footer className="footer shell">
          <span>Lava Já Smart</span>
          <span>Uma nova forma de cuidar do seu carro. <Link href="/marcacoes/historico">As minhas marcações</Link></span>
        </footer>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Navegação principal">
        {navigation.map((item) => (
          <Link className={`mobile-nav-link${active === item.href ? " active" : ""}`} href={item.href} key={item.href} aria-current={active === item.href ? "page" : undefined}>
            <span className="mobile-nav-icon" aria-hidden="true">{item.icon}</span>
            <span>{item.mobileLabel}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
