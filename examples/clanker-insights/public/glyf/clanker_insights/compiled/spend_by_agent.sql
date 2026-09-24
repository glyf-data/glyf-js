SELECT agent, model, round(sum(cost_usd), 2) AS spend_usd
FROM "clanker_insights"."main"."fct_agent_runs"
GROUP BY 1, 2
ORDER BY agent, model, spend_usd
