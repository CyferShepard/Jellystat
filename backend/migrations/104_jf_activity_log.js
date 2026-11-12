// Jellyfin activity log (/System/ActivityLog/Entries): downloads, logins, device sessions, playback events...
exports.up = async function (knex) {
  await knex.schema.raw(`
    CREATE TABLE IF NOT EXISTS public.jf_activity_log (
      "Id" bigint PRIMARY KEY,
      "Date" timestamptz NOT NULL,
      "Type" text,
      "Name" text,
      "Overview" text,
      "ShortOverview" text,
      "Severity" text,
      "UserId" text,
      "UserName" text,
      "ItemId" text,
      "ItemName" text,
      "Client" text,
      "DeviceName" text,
      "RemoteAddress" text
    );
    CREATE INDEX IF NOT EXISTS jf_activity_log_date_idx ON public.jf_activity_log ("Date" DESC);
    CREATE INDEX IF NOT EXISTS jf_activity_log_type_idx ON public.jf_activity_log ("Type");
    CREATE INDEX IF NOT EXISTS jf_activity_log_user_idx ON public.jf_activity_log ("UserId");
  `);
};

exports.down = async function (knex) {
  await knex.schema.raw(`DROP TABLE IF EXISTS public.jf_activity_log;`);
};
