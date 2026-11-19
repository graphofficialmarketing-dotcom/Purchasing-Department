// Vercel function: reads the published Google Sheets CSV on the server and hands it to the page,
// so the browser never runs into Google's cross-site limits. Only published Google Sheets CSV links are allowed.
module.exports = async function handler(req, res) {
  const raw = String((req.query && req.query.url) || "");
  let u;
  try { u = new URL(raw); } catch (e) { res.status(400).send("bad url"); return; }
  const allowed =
    u.protocol === "https:" &&
    u.hostname === "docs.google.com" &&
    u.pathname.startsWith("/spreadsheets/") &&
    u.pathname.includes("/pub") &&
    u.searchParams.get("output") === "csv";
  if (!allowed) { res.status(400).send("only published Google Sheets CSV links"); return; }
  try {
    const r = await fetch(u.toString(), { redirect: "follow" });
    if (!r.ok) { res.status(502).send("sheet returned " + r.status); return; }
    const text = await r.text();
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).send(text);
  } catch (e) {
    res.status(502).send("could not reach Google Sheets");
  }
};
