-- Table: public.jf_library_episodes

-- DROP TABLE IF EXISTS public.jf_library_episodes;

CREATE TABLE IF NOT EXISTS public.jf_library_episodes
(
    "Id" text COLLATE pg_catalog."default" NOT NULL,
    "EpisodeId" text COLLATE pg_catalog."default" NOT NULL,
    "Name" text COLLATE pg_catalog."default",
    "ServerId" text COLLATE pg_catalog."default",
    "PremiereDate" timestamp with time zone,
    "OfficialRating" text COLLATE pg_catalog."default",
    "CommunityRating" double precision,
    "RunTimeTicks" bigint,
    "ProductionYear" integer,
    "IndexNumber" integer,
    "ParentIndexNumber" integer,
    "Type" text COLLATE pg_catalog."default",
    "ParentLogoItemId" text COLLATE pg_catalog."default",
    "ParentBackdropItemId" text COLLATE pg_catalog."default",
    "ParentBackdropImageTags" text COLLATE pg_catalog."default",
    "SeriesId" text COLLATE pg_catalog."default",
    "SeasonId" text COLLATE pg_catalog."default",
    "SeasonName" text COLLATE pg_catalog."default",
    "SeriesName" text COLLATE pg_catalog."default",
    CONSTRAINT jf_library_episodes_pkey PRIMARY KEY ("Id")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.jf_library_episodes
    OWNER to postgres;