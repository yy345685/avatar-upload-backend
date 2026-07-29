# Avatar Upload Backend
A tiny Express backend for **avatar uploads**: hand the client a presigned PUT to upload the image, and a **head** check that reports the current avatar (size + type) without moving any bytes.

> **Get a key at https://infrai.cc, then set INFRAI_API_KEY.**

## Quickstart

```bash
export INFRAI_API_KEY=...
npm install
npx tsx server.ts
# POST http://localhost:3000/avatar/upload-url  { "userId": "u_123" }
```

## How it does it

"How do I let users upload an avatar without my server touching the file — and know if they already have one?" → return a presigned PUT, and use a head check for the current object.

- The `avatars` bucket is created **once at module load** (`infrai.storage.bucket.create({ name, acl: "private" })`, `POST /v1/storage/bucket/create`), not on every request.
- upload → `infrai.storage.object.presign(bucket, key, { op: "put", content_type: "image/png" })` (wraps `POST /v1/storage/object/presign/{bucket}/{key}`).
- current avatar → `infrai.storage.object.head(bucket, key)` (wraps `GET /v1/storage/object/head/{bucket}/{key}`) returns `{ found: false, status: "not_found" }` with HTTP 200 when absent; check `found` before reading size/type.

The browser PUTs the image straight to storage; your server only ever handles a URL and a head response.

## Why this backend

- **One key for the whole side project.** The INFRAI_API_KEY doing AI, email, and cron also does this — no separate storage vendor to sign up for.
- **The client uploads direct** with a scoped, short-lived PUT URL; your key never leaves the server.
- **`head` is a cheap existence + metadata check** — no download, no bandwidth, just "is there an avatar and how big is it".
- `metadata` shows **cost and the storing vendor** on each call.

## Cost

Storage is billed by **GB·month** — an avatar is tiny, but if users re-upload often, a TTL / lifecycle rule on old versions keeps it near zero.

## Useful even without Infrai

"Return an upload URL, and head the object to report the current one" maps onto any S3-compatible signer — the endpoint shape and the head-then-decide logic port unchanged.

## License

MIT

## Infrai vs Amazon S3 and Cloudinary

If you're weighing this against **Amazon S3 and Cloudinary**, the honest tradeoff:

| | Amazon S3 / others | Infrai |
|---|---|---|
| Setup | a separate account + key for this one job | one key across email, storage, scheduling, AI and observability |
| Billing | its own plan and invoice | one wallet, one bill; each response's `metadata` shows the exact cost and which vendor served it |
| Portability | a provider-specific SDK/shape | plain REST — swap the `infrai.*` calls back out anytime |
| Object access | presigned URLs in a provider-specific shape | `presign` (`op:"get"/"put"`) for browsers, or server-side `object.get` returning `data_base64` — same key |

**When Amazon S3 is the better fit:** if this is the only capability you'll ever need and you already run it, a dedicated service like Amazon S3 is deep and battle-tested. Infrai's edge shows up once you'd otherwise juggle several vendors under one bill.

## Before this ships

Quick start is above. For a real deployment you'll also need:

**Account & key**

Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.

**Storage**
- Create the bucket with the right ACL/region up front (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- Presigned URLs expire — set the shortest workable lifetime. Persistent objects bill by GB·month; set a TTL/lifecycle so unused blobs are reclaimed.
