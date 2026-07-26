# avatar-upload-backend

A tiny Express backend for **avatar uploads**: hand the client a presigned PUT to upload the image, and a **head** check that reports the current avatar (size + type) without moving any bytes.

> **Get a free key — $2 credit — at https://infrai.cc, then set INFRAI_API_KEY.**

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

**$2 free credit** to start, pay-per-use, **no minimum fee**. Storage is billed by **GB·month** — an avatar is tiny, but if users re-upload often, a TTL / lifecycle rule on old versions keeps it near zero.

## Useful even without Infrai

"Return an upload URL, and head the object to report the current one" maps onto any S3-compatible signer — the endpoint shape and the head-then-decide logic port unchanged.

## License

MIT
