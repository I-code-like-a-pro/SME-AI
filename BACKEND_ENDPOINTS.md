# SME AI backend endpoints

These are the endpoints I need built for the backend.

Right now the app runs entirely on the client. Data lives in `localStorage` and the "AI" screens return hardcoded content. I want to move all of that onto a real server, and this is the list that makes the swap possible.

I pulled the list straight out of the client. Every `async` function in `src/lib/storage.ts` is already a place where the app waits on data, so each one becomes an endpoint. Then there are four screens that fake their responses today (dashboard insights, the learn tip, loan suggestions, and the assistant chat), and those become endpoints too.

A few things stay on the client and don't need you at all. They're at the bottom so nobody builds them by mistake.

## Ground rules

| Thing | How it works |
|---|---|
| Base URL | `NEXT_PUBLIC_API_URL` (something like `https://api.smeai.app`). Everything below is relative to it. |
| Format | JSON in, JSON out. Send `Content-Type: application/json`. |
| Auth | Bearer token in the header: `Authorization: Bearer <token>`. Signup and login hand back the token. |
| Whose data is it | Every row (profile, sales, inventory, conversations) belongs to the logged-in user. Figure out who they are from the token. The client never sends a user id. This is the whole reason each person's data, including their onboarding-based inventory, stays private to them. |
| Timestamps | ISO 8601 in UTC, e.g. `2026-08-30T14:03:00.000Z`. |
| IDs | UUID v4 strings, generated server-side. |
| Errors | Anything that isn't 2xx comes back as `{ "error": "..." }`. Use the usual codes: 400 bad input, 401 not logged in, 403 not allowed, 404 not found, 409 conflict (like an email that's taken), 500 when it's your fault. |
| Money | Plain numbers, in the user's currency (default is Naira). The client doesn't do any cents/minor-unit scaling. |
| Lists | For now the list endpoints just return all of the user's rows, newest first. We can add paging later, see the bottom. |

## The shapes

These are the types the client already uses, so the responses need to match them.

```ts
// the logged-in account
interface AuthUser {
  id: string;
  email: string;
}

type BusinessType = "retail" | "food" | "services" | "agriculture" | "other";

// stored as a plain string. Right now the UI uses "english" and "pidgin".
// (some older builds also had "swahili" and "hindi" - need to confirm the final set)
type Language = string;

// the user's profile, filled in during onboarding
interface OnboardingData {
  name: string;
  businessType: BusinessType;
  language: Language;
  completedAt: string; // ISO 8601
}

// a logged sale
interface Sale {
  id: string;
  description: string;
  amount: number;
  quantity?: number;
  item?: string;
  createdAt: string; // ISO 8601
}

// a stock item. the client tailors these per business type
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;          // stock on hand right now
  lowStockThreshold: number; // low-stock warning fires when quantity <= this
  category?: string;
  unit?: string;             // "bag", "bottle", "carton", etc.
  costPrice?: number;        // what a unit costs me
  sellingPrice?: number;     // what I sell a unit for
  createdAt: string;         // ISO 8601
  updatedAt?: string;        // ISO 8601, set on edits and stock changes
}

// a chat thread with the assistant
interface Conversation {
  id: string;
  title: string;
  createdAt: string; // ISO 8601
}

// one message inside a conversation
interface ChatMessage {
  id: string;                // server-generated
  role: "user" | "assistant";
  content: string;
  createdAt: string;         // ISO 8601
}

// an AI loan suggestion on the loans screen
interface AiLoan {
  name: string;
  amount: string;            // display text, e.g. "₦75,000"
  reason: string;
  eligibility: "High" | "Medium" | "Low";
  repayment: string;         // e.g. "12 weeks"
}
```

## The full list

| # | Endpoint | What it replaces on the client | Auth |
|---|---|---|---|
| 1 | `POST /auth/signup` | `signUp(email)` | no |
| 2 | `POST /auth/login` | `signIn(email)` | no |
| 3 | `POST /auth/logout` | `signOut()` | yes |
| 4 | `GET /auth/me` | `getUser()` | yes |
| 5 | `GET /profile` | `getOnboardingData()` | yes |
| 6 | `PUT /profile` | `saveOnboardingData(data)` | yes |
| 7 | `GET /sales` | `getSales()` | yes |
| 8 | `POST /sales` | `saveSale(sale)` | yes |
| 9 | `GET /sales/summary` | `getSalesSummary()` | yes |
| 10 | `GET /inventory` | `getInventory()` | yes |
| 11 | `POST /inventory` | `addInventoryItem(input)` | yes |
| 12 | `PATCH /inventory/:id` | `updateInventoryItem(id, patch)` | yes |
| 13 | `POST /inventory/:id/adjust-stock` | `adjustInventoryStock(id, delta)` | yes |
| 14 | `DELETE /inventory/:id` | `deleteInventoryItem(id)` | yes |
| 15 | `GET /conversations` | `getConversations()` | yes |
| 16 | `POST /conversations` | `createConversation(title)` | yes |
| 17 | `GET /conversations/:id/messages` | new, for chat history | yes |
| 18 | `POST /conversations/:id/messages` | new, for sending a message | yes |
| 19 | `POST /ai/insights` | dashboard insights (hardcoded now) | yes |
| 20 | `POST /ai/tip` | learn tip button (hardcoded now) | yes |
| 21 | `POST /ai/loan-recommendation` | loans screen (hardcoded now) | yes |
| 22 | `POST /ai/assistant` | assistant reply (canned now) | yes |

## Auth

### `POST /auth/signup`
Replaces `signUp(email)`. Public.

Request:
```json
{ "email": "shop@example.com", "password": "••••••••" }
```
Returns 201:
```json
{ "user": { "id": "uuid", "email": "shop@example.com" }, "token": "jwt-or-session-token" }
```
Heads up: the signup screen already collects a password, but the current client function drops it. You should require it and store it hashed. I'll update the client to send it. If the email's already registered, return 409.

### `POST /auth/login`
Replaces `signIn(email)`. Public.

Request:
```json
{ "email": "shop@example.com", "password": "••••••••" }
```
Returns 200:
```json
{ "user": { "id": "uuid", "email": "shop@example.com" }, "token": "jwt-or-session-token" }
```
Same password note as signup. Return 401 on bad credentials.

### `POST /auth/logout`
Replaces `signOut()`. Needs auth. Empty body, and a `204` back. Kill the token/session if there's one to kill.

### `GET /auth/me`
Replaces `getUser()`. Needs auth.

Returns 200:
```json
{ "id": "uuid", "email": "shop@example.com" }
```
The client hits this on load to check the session is still good. If the token's missing or expired, return 401 so the client knows to bounce the user to sign-in.

## Profile

### `GET /profile`
Replaces `getOnboardingData()`. Needs auth.

Returns 200 with an `OnboardingData`, or `null` if they haven't onboarded yet:
```json
{ "name": "Ada", "businessType": "retail", "language": "english", "completedAt": "2026-08-30T14:03:00.000Z" }
```
`null` with a 200 is how the client knows to send them into onboarding.

### `PUT /profile`
Replaces `saveOnboardingData(data)`. Needs auth. This is an upsert: create it the first time, overwrite after.

Request (the full `OnboardingData`):
```json
{ "name": "Ada", "businessType": "retail", "language": "english", "completedAt": "2026-08-30T14:03:00.000Z" }
```
Returns 200 with what got saved. One thing to keep solid: `businessType` drives the tailored inventory categories and starter items on the client.

## Sales

### `GET /sales`
Replaces `getSales()`. Needs auth. Returns a `Sale[]`, newest first:
```json
[ { "id": "uuid", "description": "2 bags of rice", "amount": 18000, "quantity": 2, "item": "rice", "createdAt": "2026-08-30T14:03:00.000Z" } ]
```

### `POST /sales`
Replaces `saveSale(sale)`. Needs auth. `id` and `createdAt` are optional, fill them in if they're missing.

Request:
```json
{ "description": "2 bags of rice", "amount": 18000, "quantity": 2, "item": "rice" }
```
Returns 201 with the created `Sale` (server `id` + `createdAt`). The client turns free text like "sold 2 bags of rice for 18000" into these fields before it calls you (see the bottom), so you just get clean data.

### `GET /sales/summary`
Replaces `getSalesSummary()`. Needs auth.

Returns 200:
```json
{
  "today": 18000,
  "week": 92000,
  "month": 350000,
  "totalSales": 42,
  "recentSales": [ "...up to 5 most recent Sale objects" ]
}
```
`today` / `week` (last 7 days) / `month` (calendar month) are sums of `amount`. `totalSales` is the count. `recentSales` is the 5 newest. This one's optional since the client can work it out from `GET /sales`, but doing it server-side is cheaper for the dashboard. If you can grab the user's timezone, do the date math in it, otherwise UTC is fine.

## Inventory

All of this is per-user, so each account's tailored stock stays private.

### `GET /inventory`
Replaces `getInventory()`. Needs auth. Returns an `InventoryItem[]`, newest first.

### `POST /inventory`
Replaces `addInventoryItem(input)`. Needs auth. `id`/`createdAt` optional, optional fields can be left out.

Request:
```json
{ "name": "Rice", "quantity": 10, "lowStockThreshold": 3, "category": "Groceries", "unit": "bag", "costPrice": 7500, "sellingPrice": 9000 }
```
Returns 201 with the created item (`id`, `createdAt`, `updatedAt` filled in). Same endpoint seeds the "starter items" for a business type, the client just calls it once per starter row.

### `PATCH /inventory/:id`
Replaces `updateInventoryItem(id, patch)`. Needs auth. Send whatever fields changed:
```json
{ "sellingPrice": 9500, "lowStockThreshold": 5 }
```
Returns 200 with the updated item (bump `updatedAt`). 404 if it isn't theirs.

### `POST /inventory/:id/adjust-stock`
Replaces `adjustInventoryStock(id, delta)`. Needs auth. `delta` is a signed int, plus for restock, minus for sold or spoiled:
```json
{ "delta": -2 }
```
Returns 200 with the updated item. Clamp the result at 0, never let it go negative: `quantity = max(0, quantity + delta)`. I split this out from the normal update so the +/- buttons stay atomic and don't race. 404 if it isn't theirs.

### `DELETE /inventory/:id`
Replaces `deleteInventoryItem(id)`. Needs auth. `204` on success, 404 if it isn't theirs.

## Conversations and messages

Today the client only stores conversation titles and keeps the actual messages in memory, so they vanish on refresh. Endpoints 17 and 18 are what make chat actually stick around across sessions and devices.

### `GET /conversations`
Replaces `getConversations()`. Needs auth. Returns a `Conversation[]`, newest first.

### `POST /conversations`
Replaces `createConversation(title)`. Needs auth. `title` optional, default it to something like "New conversation":
```json
{ "title": "New conversation" }
```
Returns 201 with the new `Conversation`.

### `GET /conversations/:id/messages`
New. Needs auth. Returns a `ChatMessage[]` in order, oldest first. 404 if the conversation isn't theirs.

### `POST /conversations/:id/messages`
New. Needs auth. Saves a message:
```json
{ "role": "user", "content": "Sold 3 crates of drinks today" }
```
Returns 201 with the stored `ChatMessage`. One thing we need to decide together (see the bottom): does this endpoint also generate the assistant's reply and store it, or does the client call `/ai/assistant` on its own and then post the reply back here as a second message. Either works, just pick one.

## AI

These four screens fake their content on the client today. Each becomes an endpoint. Use the logged-in user's own sales and profile as context, you can read those yourself, the client doesn't need to ship them over.

### `POST /ai/insights`
Replaces the dashboard insights (generated inline from the sale count right now). Needs auth. Body can be empty since you've got their sales, or pass `{ "language": "english" }` if that helps.

Returns 200:
```json
{ "insights": [ "You've logged 42 sales...", "Try putting aside a bit of each day's takings..." ] }
```
`insights` is an ordered list of short strings. If they've got no sales yet, send back `{ "insights": [] }` and the client shows an empty state.

### `POST /ai/tip`
Replaces the "get a personalized tip" button on learn (picks one of a few hardcoded tips now). Needs auth.

Request (optional context):
```json
{ "businessType": "retail", "language": "english" }
```
Returns 200:
```json
{ "tip": "Keep your best sellers in stock. Running out is a sale you never make." }
```

### `POST /ai/loan-recommendation`
Replaces the loans screen (hardcoded `AiLoan` cards now). Needs auth. Read their sales for the eligibility call.

Request (optional context):
```json
{ "businessType": "retail", "language": "english" }
```
Returns 200:
```json
{
  "loans": [
    { "name": "Growth Loan", "amount": "₦75,000", "reason": "Your steady sales history qualifies you...", "eligibility": "High", "repayment": "12 weeks" }
  ]
}
```
`eligibility` is `"High" | "Medium" | "Low"` and the client styles the card off it (a "Low" card says "Keep Logging Sales" and is disabled). If there isn't enough history, send `{ "loans": [] }`.

### `POST /ai/assistant`
Replaces the assistant's reply (a canned "offline demo mode" string right now). Needs auth.

Request:
```json
{ "conversationId": "uuid", "message": "How are my sales this week?" }
```
Returns 200:
```json
{ "reply": "This week you're at ₦92,000 across 12 sales, up from last week. Nice." }
```
Use their name, language, and sales summary as context. Sale detection stays on the client: it parses the message first, and if it's actually a sale it calls `POST /sales` itself, so this endpoint only ever returns chat text. Sort out message persistence with endpoint 18.

## Stays on the client (don't build these)

Not endpoints. This is deterministic client-side stuff with no server involved:

- `parseSaleInput(text)`: turns free text ("sold 2 bags of rice for 18000") into `{ description, amount, quantity?, item? }`. Runs in the browser, and its output is what feeds `POST /sales`.
- The static learn cards: the fixed set of tip articles ships with the app. Only the AI tip button hits `/ai/tip`.
- Formatting helpers: `formatCurrency`, `formatDate`, and the `cn()` class helper.

## Stuff we still need to settle

1. Auth: JWT or a server session cookie? How long does the token live, and is there a refresh? That decides how the client holds and sends it.
2. Passwords: signup/login collect a password the client currently throws away. Confirm the backend owns auth (hash and verify) and I'll start sending it.
3. Assistant replies: does `POST /conversations/:id/messages` generate the reply, or does the client call `/ai/assistant` and post the reply back separately? (endpoints 18 and 22)
4. Languages: lock down the final `language` values (`english`, `pidgin`, and maybe `swahili` / `hindi`).
5. Summary timezone: should `/sales/summary` do "today/week/month" in the user's local time? If so I'll send their timezone, or we store it on the profile.
6. Paging: lists return everything for now. Add `?limit` / `?cursor` before the data gets big?
