SELECT success_rate, lag(success_rate) OVER (ORDER BY week) AS previous
FROM "clanker_insights"."main"."fct_weekly_usage"
ORDER BY week DESC, success_rate, previous
LIMIT 1
