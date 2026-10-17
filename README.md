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

## Public demo and owner-only live testing

Visitors can browse the demo without a Vercel account. Hosted paid requests require a signed owner session, checked inside `/api/analyze` before any OpenAI call. `/api/status` returns live availability only to the owner.

Open `/owner` and enter the private owner access key. The server issues an eight-hour HTTP-only, Secure, SameSite=Strict cookie. Use **Lock live testing** on `/owner` to remove it. Tokens have verified issuer, audience, role, signature, and expiry. Login uses same-origin checks and a best-effort per-instance attempt limit; the random owner key has 256 bits of entropy. No public signup is provided. Anyone you share that key with can use your credits.

Production inference also requires all of:

- `CONTENTSIGNAL_ENABLE_LIVE_API=true`
- `VERCEL=1` and `VERCEL_ENV=production`
- `CONTENTSIGNAL_PROTECTED_PROJECT_ID` matching `VERCEL_PROJECT_ID` (an enablement guard, not authentication)
- Server-only `OPENAI_API_KEY`, `CONTENTSIGNAL_OWNER_KEY`, and `CONTENTSIGNAL_SESSION_SECRET`

Use separate random owner and session secrets of at least 40 characters. Keep them in ignored local files and Vercel Production environment secrets. Rotating the session secret invalidates existing sessions. Preview builds cannot run paid inference. Vercel Standard Protection can remain enabled for previews while production domains are public.

`CONTENTSIGNAL_MAX_API_CALLS` is a best-effort per-instance limit, not a durable billing cap. Restarts, scaling, and redeployments reset it. Requests use no automatic retries and at most 1,000 output tokens. Monitor OpenAI billing; local and hosted usage share that account.

## Verification

```sh
npm test
npm run typecheck
npm run build
```

Tests cover evaluation metrics, source-quote checks, production enablement guards, and request origins. Verify `/` is public and anonymous `/api/analyze` requests return 401 after every access change. Then test an authorized custom submission.

## Automatic deployment

The private `marAv8/contentsignal` GitHub repository is connected to Vercel. Pushes to `main` deploy to production; branch pushes create previews. Public production browsing requires no account; paid API calls require the owner session, and preview builds cannot run paid inference.

## Files and publishing

`.env.local`, `.vercel`, dependencies, and build output are ignored by Git. `.vercelignore` also excludes local secrets from direct deployment uploads. Never put a key in `.env.example`, client code, screenshots, or Git history.

Built as an independent portfolio prototype; it does not represent actual Internet Brands content, policies, or production editorial workflows.
