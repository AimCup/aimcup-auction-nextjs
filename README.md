# aimcup-auction-frontend

Next.js + Apollo Client front-end for the aimcup player auction. Real-time bidding over GraphQL
subscriptions, an organizer dashboard, and a public live auction page — styled to match
`/ac/aimcup-frontend` (deep charcoal, deep red, mint green) with smooth framer-motion animations.

## Stack

- **Next.js 14** (App Router)
- **Apollo Client** — HTTP for queries/mutations, `graphql-ws` WebSocket for subscriptions; the JWT
  is attached to both
- **Tailwind CSS + daisyUI** (custom `aimcup` theme) and **framer-motion**

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

Requires the API running on `http://localhost:8080` (configurable via `NEXT_PUBLIC_API_URL` in `.env`).

## Pages

| Route | Purpose |
| --- | --- |
| `/` | Landing — browse auctions; admins create one here |
| `/auth/callback` | Receives the JWT from the API after osu! login |
| `/dashboard` | Auctions you manage |
| `/dashboard/{id}` | Overview + readiness checklist + start button |
| `/dashboard/{id}/players` | Add players, import CSV, flag captains (with Discord id) |
| `/dashboard/{id}/managers` | Add/remove co-organizers |
| `/dashboard/{id}/settings` | Bidding rules, banner & Discord ids, multi-stage editor |
| `/dashboard/{id}/control` | Live control room — start/pause/resume, edit balances, remove sold players |
| `/{id}` | **Public live auction** (the centrepiece) |

### The public auction page (`/{id}`)

A 1–2–3 column layout (narrow · wide · narrow) that adapts to auction state, all driven by the
`liveAuction` subscription:

- **Before start** — column 2 shows a countdown to the start, an explanation of every bidding rule,
  and the full player list; column 3 lists captains (with a green dot for those online); column 1 is
  a placeholder.
- **Running** — column 1 is the live bid history (resets per player); column 2 has the current-player
  card (avatar, ranks, flag, description over a fading banner, with the bid input / `+` / `MAX BID` /
  `BID` controls) plus the live team cards; column 3 shows captains, balances and highlights the
  current leader.
- **Finished** — how long it lasted, the formed teams, and the unsold players.

## Auth

Click **Sign in with osu!** → the API handles OAuth and redirects back to `/auth/callback` with a
JWT, which is stored in `localStorage` and sent with every request. Only captains can bid; only
managers see the management UI.
