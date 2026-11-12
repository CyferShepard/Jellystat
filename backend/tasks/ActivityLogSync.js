// Periodically imports the Jellyfin activity log (/System/ActivityLog/Entries) into jf_activity_log.
// This makes visible what Jellystat does not track otherwise: downloads (including books sent to
// e-readers, e.g. via KOReader), logins, devices connecting/disconnecting, etc. - who, when, what,
// and through which client/device.
const db = require("../db");
const configClass = require("../classes/config");
const { axios } = require("../classes/axios");

const PAGE = 500;
let running = false;

// Device names taken from client headers sometimes arrive as UTF-8 decoded as Latin-1
// (e.g. "MacBook â\u0080\u0093 Air" instead of "MacBook – Air").
function fixMojibake(s) {
  if (!s || !/[Â-ô][\u0080-¿]/.test(s)) return s;
  const fixed = Buffer.from(s, "latin1").toString("utf8");
  return fixed.includes("�") ? s : fixed;
}

// ShortOverview is localized by the Jellyfin server, e.g.
// "Application: X, Device: Y" / "IP address: 1.2.3.4" (en) or "Aplikace: X, Zařízení: Y" / "IP adresa: ..." (cs).
// Unknown languages simply leave these columns empty; the raw text is stored as well.
function parseOverview(text) {
  const out = { Client: null, DeviceName: null, RemoteAddress: null };
  if (!text) return out;
  const client = text.match(/(?:Application|Client|Aplikace)\s*:\s*([^,]+)/i);
  const device = text.match(/(?:Device|Za[řr][íi]zen[íi])\s*:\s*(.+?)(?:,|$)/i);
  const ip = text.match(/IP\s*(?:address|adresa)?\s*:\s*([0-9a-fA-F:.]+)/i);
  if (client) out.Client = fixMojibake(client[1].trim());
  if (device) out.DeviceName = fixMojibake(device[1].trim());
  if (ip) out.RemoteAddress = ip[1].trim();
  return out;
}

function authHeaders(config) {
  return { Authorization: `MediaBrowser Token="${config.JF_API_KEY}"` };
}

async function fetchItemNames(config, ids) {
  const names = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    try {
      const res = await axios.get(`${config.JF_HOST}/Items`, {
        params: { Ids: chunk.join(","), Recursive: true },
        headers: authHeaders(config),
        timeout: 15000,
      });
      for (const it of res.data?.Items ?? []) names[it.Id] = it.Name;
    } catch (e) {
      // the item may have been deleted in the meantime - not an error
    }
  }
  return names;
}

async function syncActivityLog() {
  if (running) return;
  running = true;
  try {
    const config = await new configClass().getConfig();
    if (config.error || config.state != 2 || config.IS_JELLYFIN === false) return;

    const { rows } = await db.query(`SELECT max("Date") AS last FROM jf_activity_log`);
    const last = rows[0]?.last;
    // small overlap; duplicates are filtered out by the primary key
    const minDate = last ? new Date(new Date(last).getTime() - 5 * 60000).toISOString() : undefined;

    let start = 0;
    let entries = [];
    for (;;) {
      const res = await axios.get(`${config.JF_HOST}/System/ActivityLog/Entries`, {
        params: { startIndex: start, limit: PAGE, ...(minDate ? { minDate } : {}) },
        headers: authHeaders(config),
        timeout: 30000,
      });
      const items = res.data?.Items ?? [];
      entries = entries.concat(items);
      start += items.length;
      if (items.length < PAGE || start >= (res.data?.TotalRecordCount ?? 0)) break;
    }
    if (entries.length === 0) return;

    const { rows: known } = await db.query(`SELECT "Id" FROM jf_activity_log WHERE "Id" = ANY($1::bigint[])`, [
      entries.map((e) => e.Id),
    ]);
    const knownIds = new Set(known.map((r) => String(r.Id)));
    const fresh = entries.filter((e) => !knownIds.has(String(e.Id)));
    if (fresh.length === 0) return;

    const itemIds = [...new Set(fresh.map((e) => e.ItemId).filter(Boolean))];
    const names = itemIds.length ? await fetchItemNames(config, itemIds) : {};

    for (const e of fresh) {
      const p = parseOverview(e.ShortOverview || e.Overview);
      await db.query(
        `INSERT INTO jf_activity_log ("Id","Date","Type","Name","Overview","ShortOverview","Severity","UserId","ItemId","ItemName","Client","DeviceName","RemoteAddress")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT ("Id") DO NOTHING`,
        [
          e.Id,
          e.Date,
          e.Type,
          e.Name,
          e.Overview ?? null,
          e.ShortOverview ?? null,
          e.Severity ?? null,
          e.UserId && e.UserId !== "00000000000000000000000000000000" ? e.UserId : null,
          e.ItemId || null,
          e.ItemId ? names[e.ItemId] ?? null : null,
          p.Client,
          p.DeviceName,
          p.RemoteAddress,
        ]
      );
    }
    console.log(`[JELLYSTAT] Activity log: ${fresh.length} new entries`);
  } catch (error) {
    console.log("[JELLYSTAT] Activity log sync error: " + (error?.message || error));
  } finally {
    running = false;
  }
}

function startActivityLogSync(intervalMs = 60000) {
  setTimeout(syncActivityLog, 15000);
  setInterval(syncActivityLog, intervalMs);
}

module.exports = { startActivityLogSync, syncActivityLog };
