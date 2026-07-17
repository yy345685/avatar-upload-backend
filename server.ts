import express from "express";
import { infrai } from "./infrai";

const app = express();
app.use(express.json());

const BUCKET = "avatars";

// Create the bucket ONCE at module load — not inside the request handler.
// bucket.create takes the name in the body.
const bucketReady = infrai.storage.bucket.create({ name: BUCKET, acl: "private" }).catch(() => {});

// POST { "userId": "u_123" } -> a presigned PUT to upload, plus the current avatar's
// metadata (from a head check) so the UI can show "replace current" vs "add one".
app.post("/avatar/upload-url", async (req, res) => {
  await bucketReady;
  const userId = String(req.body.userId);
  const key = userId + "/avatar.png";

  const put = await infrai.storage.object.presign(BUCKET, key, {
    op: "put",
    expires_seconds: 600,
    content_type: "image/png",
  });

  // head is a cheap existence + size/type probe — no bytes move.
  const head = await infrai.storage.object.head(BUCKET, key).catch(() => null);

  // Client PUTs the image to uploadUrl; `current` tells the UI what's already there.
  res.json({
    uploadUrl: put.url,
    current: head ? { size: head.size_bytes, contentType: head.content_type } : null,
  });
});

app.listen(3000, () => console.log("avatar backend on :3000"));
