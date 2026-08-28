# SME AI

**SME AI is a voice-first business companion for micro-traders and small business owners.**

It speaks to informal-sector business owners in their own language — English, Nigerian Pidgin, Swahili, or Hindi — helping them track finances and understand their business health. It doesn't ask owners to change how they work: you speak a sale the way you'd say it out loud, and the app does the rest.

> **⚠️ Backend status — read this first.** This repository is currently a **frontend-only** build. All former server functionality (Supabase auth + database, the Groq AI calls, Tavily web search, and every `/api/*` route) has been **removed** in preparation for migrating to a separate backend. Authentication, sales, and onboarding now run entirely in the browser via `localStorage`, and the AI-flavoured features (assistant, insights, tips, loan advice) return **hardcoded placeholder data**. Everything that used to hit a server now goes through a single seam — [`src/lib/api-client.ts`](src/lib/api-client.ts) — which is where you wire your real backend. See [Connecting a Backend](#connecting-a-backend).

---

## Table of Contents

- [Feature Overview](#feature-overview)
- [Tech Stack](#tech-stack)
- [How It Works (Architecture)](#how-it-works-architecture)
- [Prerequisites](#prerequisites)
- [Getting Started (Run Locally)](#getting-started-run-locally)
- [Connecting a Backend](#connecting-a-backend)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Feature Reference (Every Page)](#feature-reference-every-page)
- [Data Model](#data-model)
- [Deployment](#deployment)
- [Known Limitations & Notes](#known-limitations--notes)

---

## Feature Overview

| Feature | What it does | Status |
| --- | --- | --- |
| 🎙️ **Voice Logging** | Record a sale just by speaking — "sold 10 bags of rice for 5000" — no typing needed (browser Web Speech API). | ✅ Fully working (client-side) |
| ⌨️ **Text Logging** | Type sales in plain language; a live preview shows the detected item, quantity, and amount before saving. | ✅ Fully working (client-side) |
| 📊 **Revenue Charts** | Weekly and monthly revenue bar charts plus best-day / weekly totals, computed from your logged sales. | ✅ Fully working (client-side) |
| 🌍 **Multi-language** | English, Nigerian Pidgin, Swahili, and Hindi — chosen during onboarding and used for greetings. | ✅ Fully working (client-side) |
| 🔐 **Accounts** | Email/password sign-up and sign-in. | ⚠️ **Stub** — local session only, no real auth or password checking |
| 💬 **AI Assistant** | Chat UI that can log a sale mid-conversation (parsing is real and client-side). | ⚠️ **Stub** — replies are canned placeholders |
| 🧠 **Smart Insights** | Plain-language observations about your sales. | ⚠️ **Stub** — hardcoded text |
| 🏦 **Micro-Loan Advice** | Loan suggestions with eligibility ratings. | ⚠️ **Stub** — hardcoded loans (eligibility varies with your sales count) |
| 📚 **Learn** | Swipeable financial-literacy tip cards, plus an on-demand "personalized" tip. | ✅ Cards are real; ⚠️ the AI tip is a hardcoded stub |

The ⚠️ items are exactly the surfaces your backend will bring to life — each is a method in [`src/lib/api-client.ts`](src/lib/api-client.ts).

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | [Next.js 14](https://nextjs.org/) (App Router, all pages are `"use client"`) |
| Language | TypeScript 5 (strict mode) |
| UI runtime | React 18 |
| Styling | Tailwind CSS 3.4, `tailwindcss-animate`, CSS variables |
| Components | [shadcn/ui](https://ui.shadcn.com/) primitives on [Radix UI](https://www.radix-ui.com/) (Button, Card, Input, Label, Progress, Tabs) |
| Icons | [lucide-react](https://lucide.dev/) |
| Charts | [Recharts](https://recharts.org/) |
| Voice | Browser **Web Speech API** (`SpeechRecognition` / `webkitSpeechRecognition`) |
| Persistence | Browser **`localStorage`** (no server, no database) |
| Tests | [Vitest](https://vitest.dev/) (unit tests for the sale parser) |

There is **no backend, database, AI provider, or API key** in this build. Nothing calls out to a network service.

---

## How It Works (Architecture)

**Everything runs in the browser.** Profiles, sales, the local session, and conversation metadata are all read from and written to `localStorage`. The app is fully usable offline and needs no configuration to boot.

**One seam to the outside world.** Every operation that *used to* hit a server now goes through [`src/lib/api-client.ts`](src/lib/api-client.ts). Each method there returns hardcoded or `localStorage`-backed data and is annotated with a `// TODO(backend)` comment naming the endpoint it should eventually call. When your backend is ready, you replace those method bodies with `fetch()` calls — **the UI never changes, only this one file does.**

**Two guards wrap the app** (in [`src/app/layout.tsx`](src/app/layout.tsx)):

- **`AuthGuard`** ([`src/components/auth-guard.tsx`](src/components/auth-guard.tsx)) — allows `/`, `/signin`, and `/signup` for anyone; redirects users without a local session away from every other route to `/signin`.
- **`OnboardingGuard`** ([`src/components/onboarding-guard.tsx`](src/components/onboarding-guard.tsx)) — used inside the authenticated pages; if a signed-in user has no saved profile, it redirects them to `/onboarding`.

Auth state is held in [`src/lib/auth-context.tsx`](src/lib/auth-context.tsx) (`useAuth()` → `{ user, loading, signOut }`). The api-client dispatches a `sme-ai:auth-changed` event on sign-in/out so the context updates immediately, and it also listens to the `storage` event to stay in sync across browser tabs.

**Sale parsing is deterministic (no AI needed).** [`src/lib/parse-sale.ts`](src/lib/parse-sale.ts) converts spoken/typed English ("sold ten bags of rice for fifty") into a structured `{ description, amount, quantity, item }` using word-to-digit conversion and regex — fast, free, and offline-capable. This stays client-side even after you add a backend.

---

## Prerequisites

- **Node.js 18.17+** (Node 20 LTS recommended — required by Next.js 14)
- **npm** (ships with Node) — or yarn/pnpm if you prefer

That's it. No API keys, no database, no `.env` setup required to run the app.

---

## Getting Started (Run Locally)

### 1. Clone the repository

```bash
git clone <your-repo-url> sme-ai
cd sme-ai
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open **http://localhost:3000**. The dev server hot-reloads on file changes. Sign up with any email and password (it creates a local session — nothing is verified), complete onboarding, and start logging sales.

### 4. Build for production (optional)

```bash
npm run build
npm start
```

> **Resetting your data:** because everything lives in `localStorage`, you can wipe all app state by clearing site data for `localhost:3000` in your browser's dev tools, or running `localStorage.clear()` in the console.

---

## Connecting a Backend

All backend wiring happens in **one file**: [`src/lib/api-client.ts`](src/lib/api-client.ts). Replace each method body with a `fetch()` to your API. The argument and return shapes are already exactly what the components expect, so no component needs to change.

| api-client method | Suggested endpoint | Current stub behaviour |
| --- | --- | --- |
| `auth.getCurrentUser()` | `GET /auth/me` | Reads the `sme-ai-user` key from `localStorage`. |
| `auth.signUp(email, password)` | `POST /auth/signup` | Creates a local user object; **password is ignored**. |
| `auth.signIn(email, password)` | `POST /auth/login` | Creates/loads a local user; **password is ignored**. |
| `auth.signOut()` | `POST /auth/logout` | Clears the local session. |
| `conversations.list()` | `GET /conversations` | Reads the `sme-ai-conversations` key. |
| `conversations.create(title)` | `POST /conversations` | Prepends a conversation to `localStorage`. |
| `conversations.messages(id)` | `GET /conversations/:id/messages` | Returns `[]` (per-conversation history isn't persisted offline). |
| `getInsights({ sales, language })` | `POST /ai/insights` | Returns 2–3 hardcoded strings (or `[]` when there are no sales). |
| `getTip({ businessType, language })` | `POST /ai/tip` | Returns one random tip from a fixed list. |
| `getLoanRecommendation({ sales, businessType, language })` | `POST /ai/loan-recommendation` | Returns 3 hardcoded loans; eligibility scales with sales count. |
| `sendAssistantMessage({ messages, context })` | `POST /ai/assistant` | Returns a canned "offline mode" reply. |
| `parseSale(text)` | — (stays client-side) | Runs `parseSaleInput` locally; keep it here even with a backend. |

Onboarding and sale **persistence** live in [`src/lib/storage.ts`](src/lib/storage.ts) (also `localStorage`-backed). If your backend should own sales/profiles too, point those functions at it as well — they're already `async`, so their call sites won't change.

> When you add a backend URL or other config, put it in `.env.local` (e.g. `NEXT_PUBLIC_API_URL=...`). The file currently holds only a commented placeholder.

---

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server at http://localhost:3000 with hot reload. |
| `npm run build` | Create an optimized production build. |
| `npm start` | Run the production build (run `npm run build` first). |
| `npm run lint` | Run ESLint (`eslint-config-next`). |
| `npm test` | Run the Vitest unit tests (currently the sale parser). |

---

## Project Structure

```
src/
├── app/                          # Next.js App Router (all pages are "use client")
│   ├── layout.tsx                # Root layout: fonts, AuthProvider, guards, nav
│   ├── page.tsx                  # Public landing page ("/")
│   ├── globals.css               # Tailwind base + theme CSS variables
│   ├── signup/page.tsx           # Create account (local session)
│   ├── signin/page.tsx           # Sign in (local session)
│   ├── onboarding/page.tsx       # 3-step profile wizard
│   ├── dashboard/page.tsx        # Home: totals, quick actions, AI insights (stub)
│   ├── log/page.tsx              # Voice + text sale logging
│   ├── insights/page.tsx         # Weekly/monthly revenue charts
│   ├── loans/page.tsx            # Micro-loan recommendations (stub)
│   ├── learn/page.tsx            # Financial-literacy tips + AI tip (stub)
│   └── assistant/page.tsx        # AI chat assistant (stub replies, real sale parsing)
├── components/
│   ├── auth-guard.tsx            # Route protection (public vs. private routes)
│   ├── onboarding-guard.tsx      # Forces onboarding if profile missing
│   ├── top-nav.tsx               # Desktop navigation bar
│   ├── bottom-nav.tsx            # Mobile bottom tab bar
│   ├── floating-log.tsx          # ⚠️ Unfinished, unused stub (not mounted anywhere)
│   └── ui/                       # shadcn/ui primitives (button, card, input, label, progress, tabs)
├── lib/
│   ├── api-client.ts             # ★ THE backend seam — hardcoded stubs + TODO(backend) markers
│   ├── storage.ts                # localStorage-only profile + sales persistence
│   ├── parse-sale.ts             # Natural-language sale parser + words→digits
│   ├── parse-sale.test.ts        # Vitest unit tests for the parser
│   ├── auth-context.tsx          # React context: current user, loading, signOut
│   ├── language.ts               # Language label → prompt string mapping
│   ├── types.ts                  # Shared types + business types / languages constants
│   └── utils.ts                  # cn(), formatCurrency(), formatDate()
└── types/
    └── speech.d.ts               # Web Speech API type declarations
```

---

## Feature Reference (Every Page)

### Landing page — `/`
Public marketing page. Shows the product pitch, a stat row, and feature cards. If you already have a local session the CTAs change to "Go to Dashboard"; otherwise they point to **Get Started** (`/signup`) and **Sign In** (`/signin`).

### Sign Up — `/signup`
Email + password + confirm-password form with client-side validation (non-empty email, password ≥ 6 chars, matching confirmation). On success it creates a **local session** (`apiClient.auth.signUp` — the password is not checked or stored) and redirects to **`/onboarding`**.

### Sign In — `/signin`
Email + password form. On success it creates/loads a **local session** (`apiClient.auth.signIn` — again, no real credential check) and redirects to **`/dashboard`**.

### Onboarding — `/onboarding`
A 3-step wizard with a progress bar:
1. **Your Name** — personalizes greetings (minimum 2 characters).
2. **Business Type** — Retail Shop 🏪 · Food & Drinks 🍲 · Services ✂️ · Agriculture 🌾 · Other 💼.
3. **Language** — English · Nigerian Pidgin · Swahili · Hindi.

The profile is saved via `saveOnboardingData` (localStorage) and you're redirected to the dashboard. This is where `OnboardingGuard` sends signed-in users who have no profile yet.

### Dashboard — `/dashboard`
The authenticated home screen:
- **Localized greeting** using your name and language.
- **Sales summary card**: Today, This Week, and This Month totals (computed in `getSalesSummary`).
- **Chat CTA** and **Quick Actions** (Ask AI, Log Sale, Insights).
- **AI Insights**: 2–3 short observations from `apiClient.getInsights` — **currently hardcoded**, with loading/empty states preserved for when a backend is connected.
- **Recent Sales**: your five most recent entries. **Empty state**: a "Log Your First Sale" prompt.

### Log a Sale — `/log`
Two ways to record a sale:
- **Voice** — tap the microphone to start speech recognition. Interim text streams into the input; when a final transcript with a valid amount/quantity is produced, the sale **auto-saves** (guarded against double-saves). Unsupported browsers disable the mic and point you to the text field.
- **Text** — type in plain language (e.g., "sold 10 bags of rice for ₦50"). A live **"Detected"** card previews the parsed item/quantity and amount before you save.

Parsing is handled by `parseSaleInput`, which understands spelled-out numbers ("five" → 5), quantity+unit patterns, and price cues ("for"/"at"/"$").

### Insights — `/insights`
Revenue visualization built with Recharts: **This Week** total, your **Best Day**, a **Weekly** bar chart (last 7 days) and a **Monthly** bar chart (last 4 weeks). Friendly empty states when there's no data. Fully client-side — no backend needed.

### Micro-Loans — `/loans`
Requests loan suggestions from `apiClient.getLoanRecommendation`. Each card shows the loan name, amount, an eligibility badge (**High** / **Medium** / **Low**), the rationale, and a suggested repayment. **The loans are hardcoded**, though eligibility shifts with how many sales you've logged. A disclaimer notes these are guidance, not real offers.

### Learn — `/learn`
A financial-literacy micro-course: **8 swipeable tip cards** across five topics (Savings, Loans, Budgeting, Growth, Safety) with pagination dots and touch-swipe support, plus **topic filters**. The **"Get a personalized AI tip"** button calls `apiClient.getTip` — **currently a random pick from a fixed list**.

### AI Assistant — `/assistant`
A chat interface with your business context assembled client-side:
- **Inline sale logging**: before treating your text as a chat message, the app runs it through `apiClient.parseSale` (real, deterministic). If it looks like a sale, a **"Parsed sale"** confirmation card appears so you can save it to your local sales instead of chatting.
- **Chat replies** come from `apiClient.sendAssistantMessage` — **currently a canned "offline mode" placeholder** that references your name and sales count.
- **Quick prompts**: one-tap starters.
- **Conversations**: a desktop sidebar lists conversations stored in `localStorage`; per-conversation message history is not persisted offline (that's a backend concern).

### Navigation
- **`TopNav`** (desktop, `md+`): Dashboard · AI Assistant · Log Sale · Insights · Loans · Learn, plus sign-out.
- **`BottomNav`** (mobile): Home · Log · AI · Insights.
- Both are hidden on the landing, onboarding, and auth pages.

---

## Data Model

Shared types are defined in [`src/lib/types.ts`](src/lib/types.ts); auth/conversation/loan types live in [`src/lib/api-client.ts`](src/lib/api-client.ts).

- **`OnboardingData`** — `{ name, businessType, language, completedAt }`
  - `BusinessType`: `retail | food | services | agriculture | other`
  - `Language`: `english | pidgin | swahili | hindi`
- **`Sale`** — `{ id, description, amount, quantity?, item?, createdAt }`
- **`AuthUser`** — `{ id, email }`
- **`Conversation`** — `{ id, title, createdAt }`
- **`ChatMessage`** — `{ role: "user" | "assistant", content }`
- **`AiLoan`** — `{ name, amount, reason, eligibility, repayment }`

**localStorage keys** (the entire persistence layer):

| Key | Contents |
| --- | --- |
| `sme-ai-onboarding` | The user's profile (`OnboardingData`). |
| `sme-ai-sales` | Array of `Sale` records (newest first). |
| `sme-ai-user` | The local session user (`AuthUser`), or absent when signed out. |
| `sme-ai-conversations` | Array of `Conversation` records. |

**Currency:** amounts are displayed in Nigerian Naira (₦) via `Intl.NumberFormat("en-NG", …)` in `formatCurrency`. Some input placeholders and the chart Y-axis still show `$`; the parser treats the marked/trailing number as the amount regardless of symbol.

---

## Deployment

The app is a standard Next.js 14 project and deploys cleanly to **[Vercel](https://vercel.com/)** or any Node host that can run `npm run build` + `npm start`:

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the project into Vercel (or your host of choice).
3. Deploy. No environment variables are required for this frontend-only build.

Because all data lives in each visitor's browser `localStorage`, deployments are stateless — there is nothing to provision, and different browsers/devices do not share data. That changes once you connect a backend via [`src/lib/api-client.ts`](src/lib/api-client.ts).

---

## Known Limitations & Notes

- **Frontend-only build.** There is no server, database, or AI. Accounts are unverified local sessions, and the assistant/insights/tips/loan features return placeholder data until a backend is wired into [`src/lib/api-client.ts`](src/lib/api-client.ts).
- **Data is per-browser.** Everything is in `localStorage`, so data doesn't sync across devices or survive clearing site data.
- **`src/components/floating-log.tsx` is an unfinished, unused stub** — it declares hooks but renders nothing and isn't mounted anywhere. Finish it or delete it before shipping.
- **Voice logging** relies on the browser Web Speech API (best support in Chromium-based browsers); recognition is fixed to `en-US`. Unsupported browsers fall back to text entry.
- **Loan recommendations are placeholder guidance**, not real financial offers.
