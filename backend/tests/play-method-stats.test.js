/* eslint-env node */
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { test } = require("node:test");

if (process.argv[2] === "fixture") {
  const express = require("express");
  const rows = JSON.parse(process.argv[3]);
  // The database boundary returns the same fields as the production playback query.
  require.cache[require.resolve("../db")] = {
    exports: {
      query: async (_sql, values) => {
        assert.equal(values[0], "fixture-library");
        return { rows };
      },
    },
  };
  const app = express();
  app.use(express.json());
  app.use("/stats", require("../routes/stats"));
  const server = app.listen(0, "127.0.0.1", async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${server.address().port}/stats/getLibraryItemsPlayMethodStats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ libraryid: "fixture-library", startDate: "2026-01-01T00:00:00Z", endDate: "2026-01-03T00:00:00Z" }),
      });
      assert.equal(response.status, 200);
      console.log(JSON.stringify(await response.json()));
    } catch (error) {
      console.error(error);
      process.exitCode = 1;
    } finally {
      server.close();
      server.closeAllConnections();
    }
  });
} else {
  const request = (rows) => {
    // A separate process bounds a synchronous loop that would block the test runner's timers.
    const result = spawnSync(process.execPath, [__filename, "fixture", JSON.stringify(rows)], {
      encoding: "utf8",
      timeout: 5000,
      env: { ...process.env, TZ: "UTC" },
    });
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stderr);
    return JSON.parse(result.stdout);
  };

  test("play method statistics returns an empty series without playback", () => {
    assert.deepEqual(request([]).stats, []);
  });

  test("play method statistics advances hour buckets for direct plays and transcodes", () => {
    const stats = request([
      { ActivityDateInserted: "2026-01-01T12:30:00Z", PlaybackDuration: 1800, PlayMethod: "DirectPlay" },
      { ActivityDateInserted: "2026-01-01T13:15:00Z", PlaybackDuration: 3600, PlayMethod: "Transcode" },
    ]).stats;
    // Retain the endpoint's existing one-hour padding on either side of each session.
    assert.deepEqual(stats, [
      { Key: "Jan 01, 26 11:00", Transcodes: 1, DirectPlays: 1 },
      { Key: "Jan 01, 26 12:00", Transcodes: 1, DirectPlays: 1 },
      { Key: "Jan 01, 26 13:00", Transcodes: 1, DirectPlays: 1 },
      { Key: "Jan 01, 26 14:00", Transcodes: 1, DirectPlays: 0 },
    ]);
  });
}
