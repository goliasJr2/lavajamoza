"use client";

import { useState } from "react";

type Service = { id: string; name: string; priceMzn: number; durationMinutes: number; isDemo: boolean };

export default function DemoBookingForm({ services }: { services: Service[] }) {
  const [submitted, setSubmitted] = useState(false);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const selected = services.find((service) => service.id === serviceId);

  if (submitted) {
    return (
      <section className="demo-result" role="status">
        <span className="result-icon">✓</span>
        <p className="eyebrow">Simulação concluída</p>
        <h2>Assim seria a sua pré-marcação.</h2>
        <p>Este pedido foi apresentado apenas neste protótipo. Não foi enviado ao Lava Já nem reservado na agenda.</p>
        <button className="secondary-button" onClick={() => setSubmitted(false)}>Voltar ao formulário</button>
      </section>
    );
  }

  return (
    <form className="demo-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
      <div className="demo-notice">Demonstração: o formulário não cria uma marcação real.</div>
      <label>Nome<input name="name" autoComplete="name" placeholder="O seu nome" required /></label>
      <label>Contacto telefónico<input name="phone" autoComplete="tel" placeholder="+258 8X XXX XXXX" required /></label>
      <label>Matrícula da viatura<input name="plate" placeholder="Ex.: ABC-123-MC" required /></label>
      <label>Serviço
        <select value={serviceId} onChange={(event) => setServiceId(event.target.value)} required>
          {services.map((service) => <option value={service.id} key={service.id}>{service.name} — {service.priceMzn.toLocaleString("pt-MZ")} MT</option>)}
        </select>
      </label>
      <div className="form-grid">
        <label>Data<input type="date" min={new Date().toISOString().slice(0, 10)} required /></label>
        <label>Hora pretendida<input type="time" required /></label>
      </div>
      {selected && <div className="booking-summary"><span>Duração estimada: {selected.durationMinutes} min</span><strong>{selected.priceMzn.toLocaleString("pt-MZ")} MT</strong></div>}
      <button className="primary-button" type="submit">Pré-visualizar pedido</button>
    </form>
  );
}
