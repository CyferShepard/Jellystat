-- View: public.js_most_used_clients

-- DROP VIEW public.js_most_used_clients;

CREATE OR REPLACE VIEW public.js_most_used_clients
 AS
 SELECT count(*) AS "Plays",
    jf_playback_activity."Client"
   FROM jf_playback_activity
  GROUP BY jf_playback_activity."Client"
  ORDER BY (count(*)) DESC;

ALTER TABLE public.js_most_used_clients
    OWNER TO postgres;

