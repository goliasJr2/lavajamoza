import Link from "next/link";

const navigation = [
  { href: "/", label: "Serviços" },
  { href: "/marcacoes", label: "Pré-marcação" },
  { href: "/fila", label: "Fila" },
  { href: "/credito", label: "Crédito Lava Já" },
  { href: "/fidelizacao", label: "Fidelização" },
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
      <div className="demo-strip">Protótipo demonstrativo · Sem pagamentos ou marcações reais</div>
      <header className="customer-header shell">
        <Link className="wordmark" href="/" aria-label="Lava Já Smart, início">
          <span className="wordmark-icon" aria-hidden="true">LJ</span>
          <span>Lava Já <strong>Smart</strong></span>
        </Link>
        <div className="customer-location">Matola, Moçambique <span className="open-dot" /></div>
      </header>
      <nav className="customer-nav" aria-label="Navegação principal">
        <div className="shell customer-nav-inner">
          {navigation.map((item) => (
            <Link
              className={`customer-nav-link${active === item.href ? " active" : ""}`}
              href={item.href}
              key={item.href}
              aria-current={active === item.href ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
          <Link className="customer-nav-admin" href="/admin">Área da equipa ↗</Link>
        </div>
      </nav>
      {children}
      <footer className="footer shell">
        <span>Lava Já Smart</span>
        <span>Uma nova forma de cuidar do seu carro.</span>
      </footer>
    </div>
  );
}
