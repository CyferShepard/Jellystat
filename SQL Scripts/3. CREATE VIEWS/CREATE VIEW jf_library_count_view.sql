-- View: public.jf_library_count_view

-- DROP VIEW public.jf_library_count_view;

CREATE OR REPLACE VIEW public.jf_library_count_view
 AS
 SELECT l."Id",
    l."Name",
    l."CollectionType",
    count(DISTINCT i."Id") AS "Library_Count",
    count(DISTINCT s."Id") AS "Season_Count",
    count(DISTINCT e."Id") AS "Episode_Count"
   FROM jf_libraries l
     JOIN jf_library_items i ON i."ParentId" = l."Id"
     LEFT JOIN jf_library_seasons s ON s."SeriesId" = i."Id"
     LEFT JOIN jf_library_episodes e ON e."SeasonId" = s."Id"
  GROUP BY l."Id", l."Name"
  ORDER BY (count(DISTINCT i."Id")) DESC;

ALTER TABLE public.jf_library_count_view
    OWNER TO postgres;

