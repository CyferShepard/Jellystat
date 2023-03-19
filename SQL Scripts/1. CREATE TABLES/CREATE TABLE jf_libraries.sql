-- Table: public.jf_libraries

-- DROP TABLE IF EXISTS public.jf_libraries;

CREATE TABLE IF NOT EXISTS public.jf_libraries
(
    "Id" text COLLATE pg_catalog."default" NOT NULL,
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "ServerId" text COLLATE pg_catalog."default",
    "IsFolder" boolean NOT NULL DEFAULT true,
    "Type" text COLLATE pg_catalog."default" NOT NULL DEFAULT 'CollectionFolder'::text,
    "CollectionType" text COLLATE pg_catalog."default" NOT NULL,
    "ImageTagsPrimary" text COLLATE pg_catalog."default",
    CONSTRAINT jf_libraries_pkey PRIMARY KEY ("Id")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.jf_libraries
    OWNER to postgres;