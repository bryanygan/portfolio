# Bryan Gan — Portfolio

Personal portfolio and playground at [bryangan.com](https://bryangan.com).

Built with **Astro 5** (server-rendered), **React 19** for interactive
islands, and **Tailwind CSS**. Deployed on **Cloudflare Workers** via
`@astrojs/cloudflare`.

## Features

- **Landing page** — hero, about, experience, and projects sections.
- **Bot Simulator** (`/bot-simulator`) — Discord-style UI that exercises a
  mock `/api/bot-simulate` server route. Demonstrates command routing,
  embed rendering, rate limiting, and input validation.
- **Bot Status Monitor** (`/bot-status`) — read-only dashboard for a
  Railway-hosted Discord bot's public `/status`, `/pools`, and `/logs`
  endpoints (streams updates via SSE).
- **Banking System Simulator** (`/banking-system`) — interactive
  TypeScript reimplementation of a TDD Java exercise. Accepts
  `create`/`deposit`/`withdraw`/`transfer`/`pass` commands, validates
  CD locks, enforces balance/limit rules, and accrues APR monthly.
  Ships with 150+ Vitest tests.
- **Contact form** — Web3Forms submission with a honeypot; no
  server-side storage of messages.

## Tech Stack

- Astro 5 (`output: 'server'`), `@astrojs/cloudflare` adapter
- React 19 islands for the two simulators
- TypeScript (strict)
- Tailwind CSS 3 + `@astrojs/tailwind`
- Vitest 3 for unit and integration tests
- `@astrojs/sitemap` for the sitemap
- GitHub Actions CI (install → typecheck → test → build)

## Project Structure

```
.
├── __tests__/                 Vitest suites (banking core, hooks, integration)
├── lib/
│   └── banking/               Pure TypeScript banking domain
│       ├── core/              Account / Bank / MasterControl / CD
│       ├── processors/        Command processors (create, deposit, …)
│       ├── validators/        Command validators + NumericParsing helper
│       ├── utils/             CommandParser, TransactionLogger
│       ├── config/            Example scenarios
│       └── types.ts
├── public/                    Static assets + CSP/caching _headers
├── src/
│   ├── assets/                SVGs, images
│   ├── components/
│   │   ├── banking/           Banking simulator React components
│   │   ├── BotSimulator/      Bot simulator React components
│   │   ├── sections/          Hero / About / Experience / Projects / Contact
│   │   ├── ui/                Button / Card / Section primitives
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   └── StructuredData.astro
│   ├── hooks/
│   │   └── useBankingSystem.ts
│   ├── layouts/
│   │   └── Layout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   ├── banking-system.astro
│   │   ├── bots.astro
│   │   ├── bot-simulator.astro
│   │   ├── bot-status.astro
│   │   └── api/
│   │       └── bot-simulate.js
│   └── styles/
│       └── global.css
├── astro.config.mjs
├── tailwind.config.js
├── tsconfig.json
└── vitest.config.ts
```

## Getting Started

Requires Node ≥ 18.20 (`.nvmrc` pins 20).

```bash
git clone https://github.com/bryanygan/portfolio.git
cd portfolio
npm install
cp .env.example .env      # fill in PUBLIC_WEB3FORMS_ACCESS_KEY if testing Contact
npm run dev               # http://localhost:4321
```

## Scripts

| Command               | What it does                                           |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start Astro dev server (default port 4321)             |
| `npm run build`       | Build for production into `dist/`                      |
| `npm run preview`     | Preview the production build locally                   |
| `npm test`            | Run Vitest in watch mode                               |
| `npm run test:run`    | Run Vitest once (used in CI)                           |
| `npm run test:ui`     | Open the Vitest UI                                     |
| `npm run typecheck`   | `astro check` — type-checks Astro, TS, and `.tsx`/`.jsx` |

## Deployment

Deployed to Cloudflare Workers via `@astrojs/cloudflare`. `public/_headers`
configures caching, `Content-Security-Policy`, `Strict-Transport-Security`,
and other defensive headers for every response. A sitemap is emitted at
`/sitemap-index.xml`; `public/robots.txt` points at it.

## License

MIT.
