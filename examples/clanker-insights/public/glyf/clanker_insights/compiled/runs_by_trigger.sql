SELECT trigger, count(*) AS runs
FROM "clanker_insights"."main"."fct_agent_runs"
GROUP BY 1
ORDER BY runs DESC, trigger
