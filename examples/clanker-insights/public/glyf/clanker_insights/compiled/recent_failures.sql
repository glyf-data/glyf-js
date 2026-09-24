SELECT
  error,
  agent,
  count(*) AS failures,
  strftime(max(started_at), '%Y-%m-%d %H:%M') AS last_seen
FROM "clanker_insights"."main"."fct_agent_runs"
WHERE outcome = 'failed'
GROUP BY 1, 2
ORDER BY failures DESC, error, agent, last_seen
LIMIT 12
