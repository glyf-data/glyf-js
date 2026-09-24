SELECT runs, lag(runs) OVER (ORDER BY week) AS previous
FROM "clanker_insights"."main"."fct_weekly_usage"
ORDER BY week DESC, runs, previous
LIMIT 1
