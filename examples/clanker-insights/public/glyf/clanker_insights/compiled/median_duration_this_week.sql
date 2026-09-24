SELECT median_duration_s, lag(median_duration_s) OVER (ORDER BY week) AS previous
FROM "clanker_insights"."main"."fct_weekly_usage"
ORDER BY week DESC, median_duration_s, previous
LIMIT 1
