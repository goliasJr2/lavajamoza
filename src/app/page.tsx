const roadmap = [
  {
    number: "01",
    title: "Serviços e preços",
    description:
      "Informação clara sobre os serviços disponibilizados pelo carwash Lava Já.",
  },
  {
    number: "02",
    title: "Pré-marcação",
    description:
      "Pedido de horário e registo da viatura para organizar o atendimento.",
  },
  {
    number: "03",
    title: "Fila e estado",
    description:
      "Acompanhamento do atendimento pelo cliente e actualização pela equipa.",
  },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <a className="wordmark" href="#inicio" aria-label="Lava Já Smart, início">
          <span className="wordmark-icon" aria-hidden="true">LJ</span>
          <span>Lava Já <strong>Smart</strong></span>
        </a>
        <span className="location-pill"><span /> Matola, Moçambique</span>
      </header>

      <section className="hero" id="inicio">
        <div className="hero-copy">
          <p className="eyebrow">O seu carwash, mais simples</p>
          <h1>Mais tempo para si. Uma lavagem sem surpresas.</h1>
          <p className="hero-text">
            Consulte os serviços do Lava Já, organize a sua visita e acompanhe
            o atendimento num só lugar.
          </p>
          <a className="primary-link" href="#primeira-fase">
            Conheça a primeira fase <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="water-drop">✦</div>
          <div className="wash-card">
            <span className="wash-card-label">LAVA JÁ</span>
            <span className="wash-card-car">🚘</span>
            <span className="wash-card-sparkle sparkle-one">✦</span>
            <span className="wash-card-sparkle sparkle-two">✧</span>
          </div>
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
        </div>
      </section>

      <section className="phase" id="primeira-fase">
        <div className="section-heading">
          <p className="eyebrow">Foco inicial</p>
          <h2>Um carwash. Uma experiência completa.</h2>
          <p>
            A primeira fase é dedicada exclusivamente à operação do Lava Já.
            A plataforma será preparada para evoluir, mantendo a experiência
            inicial simples e centrada no cliente.
          </p>
        </div>

        <div className="roadmap-grid">
          {roadmap.map((item) => (
            <article className="roadmap-card" key={item.number}>
              <span className="card-number">{item.number}</span>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
        <p className="scope-note">
          A identidade visual usa as cores da marca. O logótipo oficial será
          integrado quando estiver disponível.
        </p>
      </section>

      <footer className="footer">
        <span>Lava Já Smart</span>
        <span>Uma nova forma de cuidar do seu carro.</span>
      </footer>
    </main>
  );
}
