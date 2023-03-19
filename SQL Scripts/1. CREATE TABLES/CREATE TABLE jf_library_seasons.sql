-- Table: public.jf_library_seasons

-- DROP TABLE IF EXISTS public.jf_library_seasons;

CREATE TABLE IF NOT EXISTS public.jf_library_seasons
(
    "Id" text COLLATE pg_catalog."default" NOT NULL,
    "Name" text COLLATE pg_catalog."default",
    "ServerId" text COLLATE pg_catalog."default",
    "IndexNumber" integer,
    "Type" text COLLATE pg_catalog."default",
    "ParentLogoItemId" text COLLATE pg_catalog."default",
    "ParentBackdropItemId" text COLLATE pg_catalog."default",
    "ParentBackdropImageTags" text COLLATE pg_catalog."default",
    "SeriesName" text COLLATE pg_catalog."default",
    "SeriesId" text COLLATE pg_catalog."default",
    "SeriesPrimaryImageTag" text COLLATE pg_catalog."default",
    CONSTRAINT jf_library_seasons_pkey PRIMARY KEY ("Id")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.jf_library_seasons
    OWNER to postgres;