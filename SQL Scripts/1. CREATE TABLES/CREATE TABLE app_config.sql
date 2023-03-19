-- Table: public.app_config

-- DROP TABLE IF EXISTS public.app_config;

CREATE TABLE IF NOT EXISTS public.app_config
(
    "ID" integer NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    "JF_HOST" text COLLATE pg_catalog."default",
    "JF_API_KEY" text COLLATE pg_catalog."default",
    "APP_USER" text COLLATE pg_catalog."default",
    "APP_PASSWORD" text COLLATE pg_catalog."default",
    CONSTRAINT app_config_pkey PRIMARY KEY ("ID")
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.app_config
    OWNER to postgres;