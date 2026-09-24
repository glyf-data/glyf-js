WITH grid AS (
  SELECT weekday, weekday_number, hour
  FROM (SELECT DISTINCT weekday, weekday_number FROM "clanker_insights"."main"."fct_agent_runs") AS days
  CROSS JOIN range(24) AS hours(hour)
),
counted AS (
  SELECT weekday_number, hour, count(*) AS runs
  FROM "clanker_insights"."main"."fct_agent_runs"
  GROUP BY 1, 2
)
SELECT grid.weekday, grid.weekday_number, grid.hour, coalesce(counted.runs, 0) AS runs
FROM grid
LEFT JOIN counted USING (weekday_number, hour)
ORDER BY grid.weekday_number, grid.hour, grid.weekday, runs
