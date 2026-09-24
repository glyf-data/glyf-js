SELECT cost_usd, model
FROM "clanker_insights"."main"."fct_agent_runs"
WHERE cost_usd < 3
ORDER BY cost_usd, model
