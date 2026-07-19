# Cloudinary setup — listing photos

Farmer listing photos upload through **Cloudinary** when the two env vars below are set. The browser talks to Cloudinary directly using an **unsigned** upload preset — no API key, no API secret, no server involvement.

## Priority (top wins)

1. **Cloudinary** — when `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` are both set
2. **Supabase Storage** — when `NEXT_PUBLIC_DATA_SOURCE=supabase` and Cloudinary is not set
3. **Base64 in browser** — last-resort demo only (not shared across devices)

## What you need (exactly two values)

| Env var | Example | Where to find it |
|---|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dalzi79v7` | Cloudinary console — top of the dashboard |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `naub_listings` | Settings → Upload → Upload presets — the name you save below |

**That's it.** No `CLOUDINARY_API_KEY`, no `CLOUDINARY_API_SECRET`, no signed uploads. The `NEXT_PUBLIC_` prefix is required so Next.js inlines them into the browser bundle.

> ⚠️ If you ever prefix the API key or API secret with `NEXT_PUBLIC_`, the code refuses to start (`lib/cloudinary.ts` detects forbidden `NEXT_PUBLIC_CLOUDINARY_API_*` vars and logs a fatal message). Rotate the key in the Cloudinary dashboard if it leaks.

## One-time Cloudinary setup (~3 minutes)

1. Free account at [cloudinary.com/console](https://cloudinary.com/console) if you don't have one.
2. Copy your **Cloud name** from the dashboard home — that's `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. **Settings** (gear icon, top right) → **Upload** → **Upload presets** → **Add upload preset**:
   - **Signing mode:** **Unsigned** ← must be Unsigned, otherwise the browser gets 401
   - **Folder:** `naub-agri/listings` (keeps uploads organised)
   - **Restrict:** image formats only (`jpg`, `png`, `webp`); max ~5 MB
   - **Overwrite:** off
   - Save. Note the **preset name** — it's the slug you typed. That's `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

## Wire it up

### Local development

Create `.env.local` (this file is git-ignored):

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dalzi79v7
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=naub_listings
```

Verify with the dev helper:

```bash
npm run config:cloudinary
```

Expected output when set correctly:

```
✅  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME                   dalzi79v7
✅  NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET                naub_listings

✅ Cloudinary looks configured. Listing photos will upload there.
```

Restart `npm run dev` after editing `.env.local`.

### Production (Vercel)

**Vercel → Project → Settings → Environment Variables**:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | `dalzi79v7` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | `naub_listings` |

Add to all three scopes (Production / Preview / Development) if you want previews to behave the same. **Redeploy.**

## Verify it works

1. Sign in as a farmer → **New listing** → fill the form → tap **tap to add photo**
2. You should see "Uploading to Cloudinary…" then a thumbnail with a URL starting `https://res.cloudinary.com/dalzi79v7/image/upload/…`
3. Submit the form → the listing should save with that Cloudinary URL as `image_path`

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `400 Bad Request` from `api.cloudinary.com/.../image/upload` | Preset is signed, or preset doesn't exist, or preset has restrictions that block your file | Edit the preset → Signing mode = Unsigned; check the preset name matches the env var; widen format/size restrictions |
| `401 Unauthorized` | Preset is signed | Same as above — set to Unsigned |
| `404 Not Found` on the preset name | Preset name in env doesn't match dashboard | Set the env to exactly the preset's name (case-sensitive) |
| Upload form just spins forever | Network issue, or `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is wrong | Check DevTools → Network for the request URL — the cloud name in the path should be `dalzi79v7` |
| Image uploads to Supabase Storage instead | Cloudinary env vars are empty or one is missing | Run `npm run config:cloudinary` to check |

## Skip Cloudinary entirely

If you'd rather use Supabase Storage for photos (also supported), leave both Cloudinary env vars empty on Vercel. The code falls back automatically — see `lib/media/prepare-listing-image.ts`.
