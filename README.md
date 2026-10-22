# Lava Já Smart

Protótipo web para clientes e equipa de um único carwash: Lava Já, na Matola. A fase actual cobre catálogo, pré-marcações e acompanhamento da fila, e demonstrará também Crédito Lava Já, pagamentos, fidelização e possibilidades de parceria com dados simulados. Não haverá movimentação de dinheiro, integração bancária ou afiliados activos.

## Stack

- Frontend actual: Next.js, React, TypeScript e Tailwind CSS.
- Backend previsto: NestJS, API REST e Prisma.
- Base de dados: PostgreSQL em Docker Compose.
- Idioma da interface: Português de Moçambique (`pt-MZ`).
- Cores da marca: `#03A8FB`, `#85DFFC`, `#0172D4`.

O logótipo oficial será adicionado quando estiver disponível. Até lá, a aplicação apresenta uma marca textual temporária.

## Arranque local

Pré-requisitos: Node.js/npm e Docker com Docker Compose.

```bash
cp .env.example .env
docker compose up -d database
npm install
npm run dev
```

Abra `http://localhost:3000`. A API ainda será criada em incremento próprio, conforme o plano.

## Documentação do projecto

- [Plano de implementação](PLANO_IMPLEMENTACAO.md)
- [Plano de testes](PLANO_TESTES.md)
- [Arquitectura e decisões iniciais](../lava-ja-smart-arquitectura-stack.md)

Ao implementar cada incremento da API, entregar também a interface correspondente e actualizar os casos relacionados em `PLANO_TESTES.md`.
