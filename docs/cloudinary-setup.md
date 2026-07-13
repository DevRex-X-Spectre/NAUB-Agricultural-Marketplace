# Cloudinary setup — listing photos

Farmer listing photos upload through **Cloudinary** when env vars are set.  
Images are compressed on-device (max ~1280px, JPEG) then sent to Cloudinary.

## Priority

1. **Cloudinary** — if `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` + `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
2. **Supabase Storage** — if `DATA_SOURCE=supabase` and Cloudinary is not set
3. **Base64 in browser** — last resort demo only (not shared across devices)

## Steps

1. Create a free account at [cloudinary.com](https://cloudinary.com).
2. Dashboard home → copy **Cloud name**.
3. **Settings → Upload → Upload presets → Add upload preset**
   - **Signing mode:** Unsigned  
   - **Folder:** `naub-agri/listings` (optional)  
   - Save the preset name (e.g. `naub_listings`)
4. Add to `.env.local`:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxxxxx
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=naub_listings
```

5. Restart `npm run dev`.
6. Sign in as a farmer → **New listing** → choose a photo.  
   You should see “Uploading to Cloudinary…” then a preview from `res.cloudinary.com`.

## Security notes

- Unsigned presets are fine for a marketplace demo if you restrict the preset to **images only** and a fixed folder.
- For stricter production, switch to a signed upload API route with `CLOUDINARY_API_SECRET` (never `NEXT_PUBLIC_`).
- Do not enable “Overwrite” on the unsigned preset unless you understand the risk.

## Deploy (Vercel)

Add the same `NEXT_PUBLIC_CLOUDINARY_*` variables in the Vercel project settings, then redeploy.
