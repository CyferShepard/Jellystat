-- Table: public.jf_library_items

-- DROP TABLE IF EXISTS public.jf_library_items;

CREATE TABLE IF NOT EXISTS public.jf_library_items
(
    "Id" text COLLATE pg_catalog."default" NOT NULL,
    "Name" text COLLATE pg_catalog."default" NOT NULL,
    "ServerId" text COLLATE pg_catalog."default",
    "PremiereDate" timestamp with time zone,
    "EndDate" timestamp with time zone,
    "CommunityRating" double precision,
    "RunTimeTicks" bigint,
    "ProductionYear" integer,
    "IsFolder" boolean,
    "Type" text COLLATE pg_catalog."default",
    "Status" text COLLATE pg_catalog."default",
    "ImageTagsPrimary" text COLLATE pg_catalog."default",
    "ImageTagsBanner" text COLLATE pg_catalog."default",
    "ImageTagsLogo" text COLLATE pg_catalog."default",
    "ImageTagsThumb" text COLLATE pg_catalog."default",
    "BackdropImageTags" text COLLATE pg_catalog."default",
    "ParentId" text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT jf_library_items_pkey PRIMARY KEY ("Id"),
    CONSTRAINT jf_library_items_fkey FOREIGN KEY ("ParentId")
        REFERENCES public.jf_libraries ("Id") MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE SET NULL
        NOT VALID
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.jf_library_items
    OWNER to postgres;

COMMENT ON CONSTRAINT jf_library_items_fkey ON public.jf_library_items
    IS 'jf_library';