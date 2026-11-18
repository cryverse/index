# INDEX

**INDEX** is a portfolio demo of an AI Sales Intelligence workspace. Upload a sales export (CSV or Excel), and the app verifies metrics on the server, renders KPIs and charts, and uses OpenAI to interpret findings and suggest next actions grounded in those numbers.

This is a demonstration project—not a production SaaS. There is no authentication, billing, or persistent user data.

## Capabilities

- **Upload & parse** — CSV, XLSX, and XLS with integrity checks (encoding, delimiters, duplicates, invalid values).
- **Verified analytics** — Deterministic revenue totals, transaction counts, AOV, growth (when dates exist), and segment charts.
- **AI narrative** — Executive summary, key findings, and structured recommendations (action / supported by / intended outcome) with server-side validation.
- **Data quality** — Missing values, scope limits, and file-processing warnings surfaced in results.

## Stack

- [Next.js 16](https://nextjs.org) (App Router)
- TypeScript, Tailwind CSS 4
- OpenAI Chat Completions (JSON schema)
- Papa Parse, SheetJS (`xlsx`), Recharts, Zod

## Local setup

```bash
npm install
```

Create `.env.local` in the project root:

```env
OPENAI_API_KEY=your_key_here
```

Optional:

```env
OPENAI_MODEL=gpt-4o-mini
OPENAI_TIMEOUT_MS=120000
```

Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Purpose                          |
|----------------|----------------------------------|
| `npm run dev`  | Development server               |
| `npm run build`| Production build                 |
| `npm run start`| Serve production build           |
| `npm run lint` | ESLint                           |
| `npm run test` | Node test runner (`src/**/*.test.ts`) |

## Try the demo

1. Run `npm run dev`.
2. On the home page, click **Try with sample data** (loads `public/test_sales.csv`), or upload your own export.
3. Click **Analyze Sales** and review KPIs, charts, findings, and recommendations.

For larger regression scenarios, tests use the root `test_sales.csv` and synthetic 240-row datasets—see `src/lib/analysis/analytical-context.test.ts`.

## Upload limits (enforced on server)

| Limit | Value |
|-------|--------|
| Max file size | 5 MB per file |
| Max files per request | 5 |
| Max total upload | 15 MB |
| Sales UI | One file per analysis (CSV / XLSX / XLS) |

PDF parsing exists in the API for other flows but is not offered in the sales upload UI.

## Environment variables (Vercel)

Set these in the Vercel project **Environment Variables** UI (never commit values):

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | **Yes** | Server-only OpenAI API key |
| `OPENAI_MODEL` | No | Model id (default: `gpt-4o-mini`) |
| `OPENAI_TIMEOUT_MS` | No | Request timeout in ms (default: `120000`) |

There are no `NEXT_PUBLIC_*` secrets. The API key is only read in server code (`src/lib/ai/openai-client.ts`, `/api/research`).

## Analytical & processing limitations

- KPIs and charts use **parsed tabular rows** on the server; AI context text may preview only the first 200 rows.
- Revenue column detection is heuristic; identifier columns (e.g. order IDs) are excluded from revenue rollups.
- Invalid numerics and dates are treated as **missing**, not zero.
- Recommendations that fail validation are **dropped** (the UI shows a clear empty state).
- Trend, seasonality, and anomaly logic use simple statistical guardrails—suitable for a demo, not a full BI product.
- Excel: all non-empty worksheets are analyzed; empty sheets are skipped with warnings.
- PDF text extraction has no OCR; scanned PDFs are not suitable for verified tabular metrics.

## Deploying to Vercel

1. Import the repository into Vercel.
2. Set `OPENAI_API_KEY` (and optional model/timeout).
3. Deploy; default Next.js build command (`npm run build`) and output settings apply.

**Note:** `/api/research` sets `maxDuration = 120` seconds for long analyses. On Vercel, that duration requires a plan that supports extended serverless timeouts; hobby tiers may cap lower—increase timeout only if your plan allows it.

## License

Private portfolio demo—use and adapt for evaluation purposes only.