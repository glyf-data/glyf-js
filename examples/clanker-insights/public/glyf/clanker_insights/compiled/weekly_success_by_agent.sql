SELECT
  week,
  agent,
  round(100.0 * count(*) FILTER (WHERE outcome = 'succeeded') / count(*), 1) AS success_rate
FROM "clanker_insights"."main"."fct_agent_runs"
GROUP BY 1, 2
ORDER BY week, agent, success_rate
