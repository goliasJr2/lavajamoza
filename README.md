# Lava Já Smart

Aplicação web para clientes e equipa de um único carwash: Lava Já, na Matola. O catálogo, pré-marcações, estados operacionais, histórico do cliente e movimentos de carteira/fidelização demonstrativos são persistidos através da API. Não há movimentação de dinheiro real, integração bancária nem afiliados activos.

## Stack

- Frontend: Next.js, React, TypeScript e Tailwind CSS (`src/`).
- Backend: NestJS, API REST e Prisma (`apps/api/`).
- Base de dados: PostgreSQL em Docker Compose.
- Idioma da interface: Português de Moçambique (`pt-MZ`).
- Cores da marca: `#03A8FB`, `#85DFFC`, `#0172D4`.

Os logótipos oficiais estão em `public/brand/`. Os serviços, credenciais e dados de cliente do seed são demonstrativos; ajuste os valores no `.env` antes de usar o painel.

## Arranque local

Pré-requisitos: Node.js 22.12+ e Docker com Docker Compose.

```bash
cp .env.example .env
npm install
npm --prefix apps/api install
docker compose up -d database
npm run api:prisma:generate
npm run api:prisma:deploy
npm run api:prisma:seed
npm run dev:api
```

Noutro terminal, inicie o frontend:

```bash
npm run dev
```

Abra `http://localhost:3000`. A API fica disponível em `http://localhost:4000/api`. O seed é repetível e cria serviços, conta administrativa, cliente/viatura, três marcações, carteira demonstrativa e pontos. A conta administrativa usa `ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env` (valores locais de exemplo disponíveis em `.env.example`).

Para validar instalação e service worker, execute também a versão de produção em localhost:

```bash
npm run build
npm run start
```

O service worker não é registado pelo servidor de desenvolvimento. Em produção, só coloca em cache recursos estáticos públicos, ícones e a página offline; não guarda páginas da aplicação nem respostas da API. Em iOS, abra no Safari e use Partilhar → Adicionar ao ecrã principal.

### Dados de demonstração

- Cliente: `84 123 4567`; viatura: `ABC123MC`.
- Marcação pendente: `LAVA1001`.
- Marcação aceite (pode ser usada para simular pagamento): `LAVA1002`.
- Marcação concluída: `LAVA1003`.
- Carteira demonstrativa inicial: 1.500 MT sem valor monetário real e 500 pontos fictícios.
- Administração local: `admin@lavaja.local` / `change-this-password-123` (mude a palavra-passe antes de expor a aplicação fora da máquina local).

O seed preserva estados de marcações e movimentos já existentes quando é executado novamente. Datas de marcações de exemplo são renovadas para permanecerem úteis numa nova demonstração.

As demonstrações comerciais permanecem explicitamente fictícias: o painel separa estimativas do catálogo de pagamentos simulados e nenhuma métrica representa receita real.

## Documentação do projecto

- [Plano de implementação](PLANO_IMPLEMENTACAO.md)
- [Plano de testes](PLANO_TESTES.md)
- [Arquitectura e decisões iniciais](../lava-ja-smart-arquitectura-stack.md)

Ao implementar cada incremento da API, entregar também a interface correspondente e actualizar os casos relacionados em `PLANO_TESTES.md`.
