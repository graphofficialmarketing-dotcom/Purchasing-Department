// Vercel function: passes the page's requests to the Google Apps Script web app on the server,
// in case the browser cannot reach it directly. Only Apps Script web app links (…/exec) are allowed.
module.exports = async function handler(req, res) {
  const raw = String((req.query && req.query.url) || "");
  let u;
  try { u = new URL(raw); } catch (e) { res.status(400).send("bad url"); return; }
  const allowed =
    u.protocol === "https:" &&
    u.hostname === "script.google.com" &&
    /^\/(a\/macros\/[^/]+|macros)\/s\/[A-Za-z0-9_-]+\/exec$/.test(u.pathname);
  if (!allowed) { res.status(400).send("only Apps Script web app links"); return; }
  try {
    const opts = { redirect: "follow" };
    if (req.method === "POST") {
      opts.method = "POST";
      opts.headers = { "Content-Type": "text/plain;charset=utf-8" };
      opts.body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
    }
    const r = await fetch(u.toString(), opts);
    const text = await r.text();
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.status(r.ok ? 200 : 502).send(text);
  } catch (e) {
    res.status(502).send(JSON.stringify({ ok: false, error: "proxy_failed" }));
  }
};
