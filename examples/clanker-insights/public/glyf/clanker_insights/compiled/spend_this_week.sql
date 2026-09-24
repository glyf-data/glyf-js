SELECT spend_usd, lag(spend_usd) OVER (ORDER BY week) AS previous
FROM "clanker_insights"."main"."fct_weekly_usage"
ORDER BY week DESC, spend_usd, previous
LIMIT 1
