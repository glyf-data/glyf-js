SELECT
  strftime(run_date, '%m-%d') AS day,
  outcome,
  agent,
  count(*) AS runs
FROM "clanker_insights"."main"."fct_agent_runs"
GROUP BY 1, 2, 3
ORDER BY day, outcome, agent, runs
