--
-- PostgreSQL database dump
--

-- Dumped from database version 15.2 (Debian 15.2-1.pgdg110+1)
-- Dumped by pg_dump version 15.1

-- Started on 2023-03-21 19:12:22 UTC

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3389 (class 1262 OID 16387)
-- Name: jfstat; Type: DATABASE; Schema: -; Owner: jfstat
--

CREATE DATABASE jfstat WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


-- ALTER DATABASE jfstat OWNER TO jfstat;

\connect jfstat

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 232 (class 1255 OID 41783)
-- Name: fs_most_active_user(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fs_most_active_user(days integer) RETURNS TABLE("Plays" bigint, "UserId" text, "Name" text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT count(*) AS "Plays",
        jf_playback_activity."UserId",
        jf_playback_activity."UserName" AS "Name"
    FROM jf_playback_activity
    WHERE jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) AND NOW()
    GROUP BY jf_playback_activity."UserId", jf_playback_activity."UserName"
    ORDER BY (count(*)) DESC;
END;
$$;


ALTER FUNCTION public.fs_most_active_user(days integer) OWNER TO postgres;

--
-- TOC entry 246 (class 1255 OID 41695)
-- Name: fs_most_played_items(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fs_most_played_items(days integer, itemtype text) RETURNS TABLE("Plays" bigint, total_playback_duration numeric, "Name" text, "Id" text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.plays,
        t.total_playback_duration,
        i."Name",
        i."Id"
    FROM (
        SELECT 
            count(*) AS plays,
            sum(jf_playback_activity."PlaybackDuration") AS total_playback_duration,
            jf_playback_activity."NowPlayingItemId"
        FROM 
            jf_playback_activity
        WHERE 
            jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) and NOW()
        GROUP BY 
            jf_playback_activity."NowPlayingItemId"
        ORDER BY 
            count(*) DESC
    ) t
    JOIN jf_library_items i 
        ON t."NowPlayingItemId" = i."Id" 
        AND i."Type" = itemType
    ORDER BY 
        t.plays DESC;
END;
$$;


ALTER FUNCTION public.fs_most_played_items(days integer, itemtype text) OWNER TO postgres;

--
-- TOC entry 245 (class 1255 OID 41690)
-- Name: fs_most_popular_items(integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fs_most_popular_items(days integer, itemtype text) RETURNS TABLE(unique_viewers bigint, latest_activity_date timestamp with time zone, "Name" text, "Id" text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.unique_viewers,
        t.latest_activity_date,
        i."Name",
        i."Id"
    FROM (
        SELECT 
            jf_playback_activity."NowPlayingItemId",
            count(DISTINCT jf_playback_activity."UserId") AS unique_viewers,
            latest_activity_date.latest_date AS latest_activity_date
        FROM 
            jf_playback_activity
            JOIN (
                SELECT 
                    jf_playback_activity_1."NowPlayingItemId",
                    max(jf_playback_activity_1."ActivityDateInserted") AS latest_date
                FROM 
                    jf_playback_activity jf_playback_activity_1
                GROUP BY jf_playback_activity_1."NowPlayingItemId"
            ) latest_activity_date 
            ON jf_playback_activity."NowPlayingItemId" = latest_activity_date."NowPlayingItemId"
        WHERE 
            jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) and NOW()
        GROUP BY 
            jf_playback_activity."NowPlayingItemId", latest_activity_date.latest_date
    ) t
    JOIN jf_library_items i 
        ON t."NowPlayingItemId" = i."Id" 
        AND i."Type" = itemType
    ORDER BY 
        t.unique_viewers DESC, t.latest_activity_date DESC;
END;
$$;


ALTER FUNCTION public.fs_most_popular_items(days integer, itemtype text) OWNER TO postgres;

--
-- TOC entry 231 (class 1255 OID 41730)
-- Name: fs_most_used_clients(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fs_most_used_clients(days integer) RETURNS TABLE("Plays" bigint, "Client" text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT count(*) AS "Plays",
        jf_playback_activity."Client"
    FROM jf_playback_activity
    WHERE jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) AND NOW()
    GROUP BY jf_playback_activity."Client"
    ORDER BY (count(*)) DESC;
END;
$$;


ALTER FUNCTION public.fs_most_used_clients(days integer) OWNER TO postgres;

--
-- TOC entry 244 (class 1255 OID 41701)
-- Name: fs_most_viewed_libraries(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fs_most_viewed_libraries(days integer) RETURNS TABLE("Plays" numeric, "Id" text, "Name" text, "ServerId" text, "IsFolder" boolean, "Type" text, "CollectionType" text, "ImageTagsPrimary" text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sum(t."Plays"),
        l."Id",
        l."Name",
        l."ServerId",
        l."IsFolder",
        l."Type",
        l."CollectionType",
        l."ImageTagsPrimary"
    FROM (
        SELECT count(*) AS "Plays",
    	sum(jf_playback_activity."PlaybackDuration") AS "TotalPlaybackDuration",
    	jf_playback_activity."NowPlayingItemId"
  		FROM jf_playback_activity
		 WHERE 
            jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) and NOW()
        
  		GROUP BY jf_playback_activity."NowPlayingItemId"
  		ORDER BY "Plays" DESC
    ) t
    JOIN jf_library_items i 
        ON i."Id" = t."NowPlayingItemId"
    JOIN jf_libraries l 
        ON l."Id" = i."ParentId"
    GROUP BY 
        l."Id"
    ORDER BY 
       (sum( t."Plays")) DESC;
END;
$$;


ALTER FUNCTION public.fs_most_viewed_libraries(days integer) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 220 (class 1259 OID 16395)
-- Name: app_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.app_config (
    "ID" integer NOT NULL,
    "JF_HOST" text,
    "JF_API_KEY" text,
    "APP_USER" text,
    "APP_PASSWORD" text
);


ALTER TABLE public.app_config OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16402)
-- Name: app_config_ID_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.app_config ALTER COLUMN "ID" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public."app_config_ID_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 228 (class 1259 OID 41300)
-- Name: jf_activity_watchdog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jf_activity_watchdog (
    "Id" text NOT NULL,
    "IsPaused" boolean DEFAULT false,
    "UserId" text,
    "UserName" text,
    "Client" text,
    "DeviceName" text,
    "DeviceId" text,
    "ApplicationVersion" text,
    "NowPlayingItemId" text,
    "NowPlayingItemName" text,
    "SeasonId" text,
    "SeriesName" text,
    "EpisodeId" text,
    "PlaybackDuration" bigint,
    "ActivityDateInserted" timestamp with time zone,
    "PlayMethod" text
);


ALTER TABLE public.jf_activity_watchdog OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 41294)
-- Name: jf_playback_activity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jf_playback_activity (
    "Id" text NOT NULL,
    "IsPaused" boolean DEFAULT false,
    "UserId" text,
    "UserName" text,
    "Client" text,
    "DeviceName" text,
    "DeviceId" text,
    "ApplicationVersion" text,
    "NowPlayingItemId" text,
    "NowPlayingItemName" text,
    "SeasonId" text,
    "SeriesName" text,
    "EpisodeId" text,
    "PlaybackDuration" bigint,
    "ActivityDateInserted" timestamp with time zone,
    "PlayMethod" text
);


ALTER TABLE public.jf_playback_activity OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 41731)
-- Name: jf_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jf_users (
    "Id" text NOT NULL,
    "Name" text,
    "PrimaryImageTag" text,
    "LastLoginDate" timestamp with time zone,
    "LastActivityDate" timestamp with time zone,
    "IsAdministrator" boolean
);


ALTER TABLE public.jf_users OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 41771)
-- Name: jf_all_user_activity; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.jf_all_user_activity AS
 SELECT u."Id" AS "UserId",
    u."PrimaryImageTag",
    u."Name" AS "UserName",
        CASE
            WHEN (j."SeriesName" IS NULL) THEN j."NowPlayingItemName"
            ELSE ((j."SeriesName" || ' - '::text) || j."NowPlayingItemName")
        END AS "LastWatched",
    j."ActivityDateInserted" AS "LastActivityDate",
    ((j."Client" || ' - '::text) || j."DeviceName") AS "LastClient",
    plays."TotalPlays",
    plays."TotalWatchTime",
    (now() - j."ActivityDateInserted") AS "LastSeen"
   FROM ((( SELECT jf_users."Id",
            jf_users."Name",
            jf_users."PrimaryImageTag",
            jf_users."LastLoginDate",
            jf_users."LastActivityDate",
            jf_users."IsAdministrator"
           FROM public.jf_users) u
     LEFT JOIN LATERAL ( SELECT jf_playback_activity."Id",
            jf_playback_activity."IsPaused",
            jf_playback_activity."UserId",
            jf_playback_activity."UserName",
            jf_playback_activity."Client",
            jf_playback_activity."DeviceName",
            jf_playback_activity."DeviceId",
            jf_playback_activity."ApplicationVersion",
            jf_playback_activity."NowPlayingItemId",
            jf_playback_activity."NowPlayingItemName",
            jf_playback_activity."SeasonId",
            jf_playback_activity."SeriesName",
            jf_playback_activity."EpisodeId",
            jf_playback_activity."PlaybackDuration",
            jf_playback_activity."ActivityDateInserted"
           FROM public.jf_playback_activity
          WHERE (jf_playback_activity."UserId" = u."Id")
          ORDER BY jf_playback_activity."ActivityDateInserted" DESC
         LIMIT 1) j ON (true))
     LEFT JOIN LATERAL ( SELECT count(*) AS "TotalPlays",
            sum(jf_playback_activity."PlaybackDuration") AS "TotalWatchTime"
           FROM public.jf_playback_activity
          WHERE (jf_playback_activity."UserId" = u."Id")) plays ON (true))
  ORDER BY j."ActivityDateInserted";


ALTER TABLE public.jf_all_user_activity OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16411)
-- Name: jf_libraries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jf_libraries (
    "Id" text NOT NULL,
    "Name" text NOT NULL,
    "ServerId" text,
    "IsFolder" boolean DEFAULT true NOT NULL,
    "Type" text DEFAULT 'CollectionFolder'::text NOT NULL,
    "CollectionType" text NOT NULL,
    "ImageTagsPrimary" text
);


ALTER TABLE public.jf_libraries OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 25160)
-- Name: jf_library_count_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.jf_library_count_view AS
SELECT
    NULL::text AS "Id",
    NULL::text AS "Name",
    NULL::text AS "CollectionType",
    NULL::bigint AS "Library_Count",
    NULL::bigint AS "Season_Count",
    NULL::bigint AS "Episode_Count";


ALTER TABLE public.jf_library_count_view OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 24906)
-- Name: jf_library_episodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jf_library_episodes (
    "Id" text NOT NULL,
    "EpisodeId" text NOT NULL,
    "Name" text,
    "ServerId" text,
    "PremiereDate" timestamp with time zone,
    "OfficialRating" text,
    "CommunityRating" double precision,
    "RunTimeTicks" bigint,
    "ProductionYear" integer,
    "IndexNumber" integer,
    "ParentIndexNumber" integer,
    "Type" text,
    "ParentLogoItemId" text,
    "ParentBackdropItemId" text,
    "ParentBackdropImageTags" text,
    "SeriesId" text,
    "SeasonId" text,
    "SeasonName" text,
    "SeriesName" text
);


ALTER TABLE public.jf_library_episodes OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 24599)
-- Name: jf_library_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jf_library_items (
    "Id" text NOT NULL,
    "Name" text NOT NULL,
    "ServerId" text,
    "PremiereDate" timestamp with time zone,
    "EndDate" timestamp with time zone,
    "CommunityRating" double precision,
    "RunTimeTicks" bigint,
    "ProductionYear" integer,
    "IsFolder" boolean,
    "Type" text,
    "Status" text,
    "ImageTagsPrimary" text,
    "ImageTagsBanner" text,
    "ImageTagsLogo" text,
    "ImageTagsThumb" text,
    "BackdropImageTags" text,
    "ParentId" text NOT NULL
);


ALTER TABLE public.jf_library_items OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 24731)
-- Name: jf_library_seasons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jf_library_seasons (
    "Id" text NOT NULL,
    "Name" text,
    "ServerId" text,
    "IndexNumber" integer,
    "Type" text,
    "ParentLogoItemId" text,
    "ParentBackdropItemId" text,
    "ParentBackdropImageTags" text,
    "SeriesName" text,
    "SeriesId" text,
    "SeriesPrimaryImageTag" text
);


ALTER TABLE public.jf_library_seasons OWNER TO postgres;

--
-- TOC entry 3228 (class 2606 OID 16401)
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.app_config
    ADD CONSTRAINT app_config_pkey PRIMARY KEY ("ID");


--
-- TOC entry 3230 (class 2606 OID 16419)
-- Name: jf_libraries jf_libraries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jf_libraries
    ADD CONSTRAINT jf_libraries_pkey PRIMARY KEY ("Id");


--
-- TOC entry 3236 (class 2606 OID 24912)
-- Name: jf_library_episodes jf_library_episodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jf_library_episodes
    ADD CONSTRAINT jf_library_episodes_pkey PRIMARY KEY ("Id");


--
-- TOC entry 3232 (class 2606 OID 24605)
-- Name: jf_library_items jf_library_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jf_library_items
    ADD CONSTRAINT jf_library_items_pkey PRIMARY KEY ("Id");


--
-- TOC entry 3234 (class 2606 OID 24737)
-- Name: jf_library_seasons jf_library_seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jf_library_seasons
    ADD CONSTRAINT jf_library_seasons_pkey PRIMARY KEY ("Id");


--
-- TOC entry 3238 (class 2606 OID 41737)
-- Name: jf_users jf_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jf_users
    ADD CONSTRAINT jf_users_pkey PRIMARY KEY ("Id");


--
-- TOC entry 3382 (class 2618 OID 25163)
-- Name: jf_library_count_view _RETURN; Type: RULE; Schema: public; Owner: postgres
--

CREATE OR REPLACE VIEW public.jf_library_count_view AS
 SELECT l."Id",
    l."Name",
    l."CollectionType",
    count(DISTINCT i."Id") AS "Library_Count",
    count(DISTINCT s."Id") AS "Season_Count",
    count(DISTINCT e."Id") AS "Episode_Count"
   FROM (((public.jf_libraries l
     JOIN public.jf_library_items i ON ((i."ParentId" = l."Id")))
     LEFT JOIN public.jf_library_seasons s ON ((s."SeriesId" = i."Id")))
     LEFT JOIN public.jf_library_episodes e ON ((e."SeasonId" = s."Id")))
  GROUP BY l."Id", l."Name"
  ORDER BY (count(DISTINCT i."Id")) DESC;


--
-- TOC entry 3239 (class 2606 OID 24617)
-- Name: jf_library_items jf_library_items_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jf_library_items
    ADD CONSTRAINT jf_library_items_fkey FOREIGN KEY ("ParentId") REFERENCES public.jf_libraries("Id") ON DELETE SET NULL NOT VALID;


--
-- TOC entry 3390 (class 0 OID 0)
-- Dependencies: 3239
-- Name: CONSTRAINT jf_library_items_fkey ON jf_library_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON CONSTRAINT jf_library_items_fkey ON public.jf_library_items IS 'jf_library';


-- Completed on 2023-03-21 19:12:22 UTC

--
-- PostgreSQL database dump complete
--

