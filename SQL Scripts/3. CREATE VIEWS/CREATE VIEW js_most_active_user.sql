-- View: public.js_most_active_user

-- DROP VIEW public.js_most_active_user;

CREATE OR REPLACE VIEW public.js_most_active_user
 AS
 SELECT count(*) AS "Plays",
    jf_playback_activity."UserId",
    jf_playback_activity."UserName"
   FROM jf_playback_activity
  GROUP BY jf_playback_activity."UserId", jf_playback_activity."UserName"
  ORDER BY (count(*)) DESC;

ALTER TABLE public.js_most_active_user
    OWNER TO postgres;

