-- This is an empty migration.

CREATE OR REPLACE VIEW "project_employee_total_hours" AS
SELECT
    "M"."id" AS "managerId",
    "M"."name" AS "managerName",
    "P"."id" AS "projectId",
    "P"."name" AS "projectName",
    "U"."id" AS "userId",
    "U"."name" AS "userName",
    SUM("TE"."hours") AS "totalHours"
FROM
    "Project" AS "P"
INNER JOIN
    "Task" AS "T" ON "P"."id" = "T"."projectId"
INNER JOIN
    "TimeEntry" AS "TE" ON "T"."id" = "TE"."taskId"
INNER JOIN
    "User" AS "U" ON "TE"."userId" = "U"."id"
INNER JOIN
    "User" AS "M" ON "P"."ownerId" = "M"."id" -- JOIN to get Manager details
GROUP BY
    "M"."id", "M"."name", "P"."id", "P"."name", "U"."id", "U"."name"
ORDER BY
    "M"."name", "P"."name", "U"."name";

CREATE OR REPLACE VIEW "avg_completed_project_duration" AS
SELECT
    "M"."id" AS "managerId",
    "M"."name" AS "managerName",
    AVG(DATE_PART('day', "P"."endDate"::timestamp - "P"."startDate"::timestamp)) AS "averageProjectDurationDays"
FROM
    "Project" AS "P"
INNER JOIN
    "User" AS "M" ON "P"."ownerId" = "M"."id" -- JOIN to get Manager details
WHERE
    "P"."endDate" IS NOT NULL
GROUP BY
    "M"."id", "M"."name"
ORDER BY
    "M"."name";

CREATE OR REPLACE VIEW "project_duration_variance" AS
SELECT
    "M"."id" AS "managerId",
    "M"."name" AS "managerName",
    "P"."id" AS "projectId",
    "P"."name" AS "projectName",
    DATE_PART('day', "P"."plannedEndDate"::timestamp - "P"."startDate"::timestamp) AS "plannedDurationDays",
    DATE_PART('day', "P"."endDate"::timestamp - "P"."startDate"::timestamp) AS "actualDurationDays",
    -- Variance: Actual - Planned
    DATE_PART('day', "P"."endDate"::timestamp - "P"."startDate"::timestamp) - 
    DATE_PART('day', "P"."plannedEndDate"::timestamp - "P"."startDate"::timestamp) AS "durationVarianceDays"
FROM
    "Project" AS "P"
INNER JOIN
    "User" AS "M" ON "P"."ownerId" = "M"."id" -- JOIN to get Manager details
WHERE
    "P"."endDate" IS NOT NULL AND "P"."plannedEndDate" IS NOT NULL
ORDER BY
    "managerName", "durationVarianceDays" DESC;

CREATE OR REPLACE VIEW "monthly_project_hours" AS
SELECT
    "M"."id" AS "managerId",
    "M"."name" AS "managerName",
    TO_CHAR("TE"."date", 'YYYY-MM') AS "month",
    "P"."id" AS "projectId",
    "P"."name" AS "projectName",
    SUM("TE"."hours") AS "totalMonthlyHours"
FROM
    "TimeEntry" AS "TE"
INNER JOIN
    "Task" AS "T" ON "TE"."taskId" = "T"."id"
INNER JOIN
    "Project" AS "P" ON "T"."projectId" = "P"."id"
INNER JOIN
    "User" AS "M" ON "P"."ownerId" = "M"."id" -- JOIN to get Manager details
GROUP BY
    "M"."id", "M"."name", "month", "P"."id", "P"."name"
ORDER BY
    "M"."name", "month" DESC, "totalMonthlyHours" DESC;