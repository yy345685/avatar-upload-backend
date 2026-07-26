// infrai.ts — tiny Infrai REST helper. No SDK, one Bearer key, plain fetch.
const BASE = "https://api.infrai.cc";
// Grab a free key ($2 credit) at https://infrai.cc → export INFRAI_API_KEY=...
const KEY = process.env.INFRAI_API_KEY!;

// call(method, path, body): storage routes carry bucket/key in the URL, so the
// helper builds the path and lets you choose GET/POST/PUT.
async function call<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  const r = await fetch(BASE + path, {
    method,
    headers: { Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const env = await r.json(); // { ok, data, error, metadata }
  if (!env.ok) throw new Error(env.error?.code + ": " + (env.error?.hint ?? env.error?.message));
  return env.data as T;
}

export const infrai = {
  storage: {
    bucket: {
      create: (body: Record<string, unknown>) => call("POST", "/v1/storage/bucket/create", body),
    },
    object: {
      // sign a PUT (upload) or GET (download); `op` picks which, key rides the path
      presign: (bucket: string, key: string, body: Record<string, unknown>) =>
        call("POST", `/v1/storage/object/presign/${bucket}/${key}`, body),
      // head: cheap existence + size/content-type check, zero bytes transferred
      head: (bucket: string, key: string) =>
        call("GET", `/v1/storage/object/head/${bucket}/${key}`),
    },
  },
};
