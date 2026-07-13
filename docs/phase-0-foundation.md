# Phase 0 — Foundation Audit

## Design system (DESIGN.md “Seed”)

Wired into `app/globals.css` as CSS custom properties + Tailwind v4 `@theme` tokens.

| Token role | Value |
|---|---|
| Primary text / CTA | Forest Canopy `#1c3a13` |
| Accent (scarce) | Lime Sprout `#d3fa99` |
| Canvas | Warm Parchment `#fcfcf7` |
| Secondary surface | Pale Stone `#eeeee9` |
| Type substitute | DM Sans 300/400/500 (Seed Sans not available as webfont) |
| Mono | JetBrains Mono |

**Rules enforced in components:** pill buttons (`rounded-full`), no box-shadow, 8px inputs, 16px cards, `font-feature-settings: "ss05" on`.

### Gaps to fill in later UI phases (agri-specific)

| Component | Notes |
|---|---|
| Star rating | Not in DESIGN.md — build with Forest Canopy fill / Pale Stone empty; no yellow stars (palette is one-green) |
| Price tag | Mono or body-sm + Naira format utility (`formatNaira`) |
| Freshness / expiry badge | Lime = fresh; Pale Stone = expiring soon; outline = expired |
| Verification badge | Lime pill “Verified”; outline “Pending”; inverse “Suspended” |
| Category icons | Emoji/icon keys on `Category.icon` for low-literacy browse |
| Mobile bottom nav | Not in Seed (desktop pill nav only) — needed for farmer/buyer apps |

## Boilerplate map

| Plan path | Status |
|---|---|
| `app/` | App Router present; root layout + home + `/dev/data-test` |
| `components/ui/` | Button, Badge, Card, Input |
| `lib/config.ts` | `DATA_SOURCE = 'local'` |
| `lib/types/` | 7 entities + enums |
| `lib/repositories/` | Storage engine + 7 repos |
| `lib/services/` | 7 services |
| `lib/utils/` | password, format, whatsapp, session |
| Auth middleware | Deferred to Phase 2 route groups |

## Architecture rule

**UI → services → repositories → localStorage.** Never skip a layer.
