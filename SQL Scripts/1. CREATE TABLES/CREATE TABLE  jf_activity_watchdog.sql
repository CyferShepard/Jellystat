-- Table: public.jf_activity_watchdog

-- DROP TABLE IF EXISTS public.jf_activity_watchdog;

CREATE TABLE IF NOT EXISTS public.jf_activity_watchdog
(
    "Id" text COLLATE pg_catalog."default" NOT NULL,
    "IsPaused" boolean DEFAULT false,
    "UserId" text COLLATE pg_catalog."default",
    "UserName" text COLLATE pg_catalog."default",
    "Client" text COLLATE pg_catalog."default",
    "DeviceName" text COLLATE pg_catalog."default",
    "DeviceId" text COLLATE pg_catalog."default",
    "ApplicationVersion" text COLLATE pg_catalog."default",
    "NowPlayingItemId" text COLLATE pg_catalog."default",
    "NowPlayingItemName" text COLLATE pg_catalog."default",
    "SeasonId" text COLLATE pg_catalog."default",
    "SeriesName" text COLLATE pg_catalog."default",
    "EpisodeId" text COLLATE pg_catalog."default",
    "PlaybackDuration" bigint,
    "ActivityDateInserted" timestamp with time zone
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.jf_activity_watchdog
    OWNER to postgres;