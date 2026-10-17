# ContentSignal

An experimental Next.js/TypeScript content evaluator for source-grounded editorial review. All included articles, sources, policies, and benchmark labels are fictional.

## What it does

- Review 20 cases across Health, Legal, Travel, and Media.
- Compare article claims with supplied source excerpts and fictional editorial policies.
- Return a category, priority, rationale, evidence quote, recommended action, and human-review flag.
- Validate evidence quotes as exact source substrings and reject unknown policy IDs.
- Accept a new fictional claim and reference excerpt through **New test intake**.
- Inspect source-change relationships and compare predictions with separately authored gold labels.

Prewritten demo predictions are labeled as a synthetic baseline. They are not measured model performance. A successful individual live test is not a reliability benchmark. The tool does not research the web, authenticate source accuracy, send notifications, or make publication decisions.

## Run locally

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Set `OPENAI_API_KEY` in `.env.local` and `CONTENTSIGNAL_ENABLE_LIVE_API=true` to enable paid local tests. Open http://localhost:3000 and choose **Review desk → New test intake**. Submit only fictional or properly cleared text. The server sends the claim, supplied excerpt, and relevant policies to OpenAI's Responses API using `gpt-4.1-mini`, with `store: false` and at most 1,000 output tokens. No API key is exposed to the browser.

## Private hosted workspace

The hosted app is protected by **Vercel Authentication → All Deployments**, including production domains and API routes. Only the owner account has project/team access at setup. Do not grant additional access or create shareable bypass links unless you intend those recipients to be able to spend API credits.

Production inference also requires all of:

- `CONTENTSIGNAL_ENABLE_LIVE_API=true`
- `VERCEL=1` and `VERCEL_ENV=production` (Vercel system variables)
- `CONTENTSIGNAL_PROTECTED_PROJECT_ID` matching `VERCEL_PROJECT_ID`
- A server-side `OPENAI_API_KEY`

Configure secrets only in Vercel's Production environment. Preview builds remain unable to run inference. **Keep All Deployments protection enabled.** The application relies on Vercel for access control; the project-ID binding is an enablement guard, not authentication. If creating a public demo, use a separate project without the live key or opt-in.

`CONTENTSIGNAL_MAX_API_CALLS` defaults to three attempts per server instance (hosted configuration may set ten). This is a best-effort safeguard, not a durable account-wide billing cap: instances, restarts, and redeployments reset counters. Requests use no automatic retries. Monitor billing and disable auto-recharge if you want to control replenishment. Local and hosted usage share the API key's billing account.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Tests cover evaluation metrics, source-quote checks, production enablement guards, and request origins. Verify anonymous access is blocked at both `/` and `/api/analyze` after every protection change. Then test an authorized custom submission.

## Automatic deployment

The private `marAv8/contentsignal` GitHub repository is connected to Vercel. Pushes to `main` deploy to production; branch pushes create previews. All Deployments authentication remains required, and preview builds cannot run paid inference.

## Files and publishing

`.env.local`, `.vercel`, dependencies, and build output are ignored by Git. `.vercelignore` also excludes local secrets from direct deployment uploads. Never put a key in `.env.example`, client code, screenshots, or Git history.

Built as an independent portfolio prototype; it does not represent actual Internet Brands content, policies, or production editorial workflows.
