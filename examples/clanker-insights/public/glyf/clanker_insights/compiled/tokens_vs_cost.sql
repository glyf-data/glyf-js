SELECT run_id, tokens, cost_usd, model, agent
FROM "clanker_insights"."main"."fct_agent_runs"
ORDER BY model, tokens, run_id, cost_usd, agent
