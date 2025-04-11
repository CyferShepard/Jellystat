const { pool } = require("../db.js");
const pgp = require("pg-promise")();

function wrapField(field) {
  if (field === "*") {
    return field;
  }
  if (
    field.includes("COALESCE") ||
    field.includes("SUM") ||
    field.includes("COUNT") ||
    field.includes("MAX") ||
    field.includes("MIN") ||
    field.includes("AVG") ||
    field.includes("DISTINCT") ||
    field.includes("json_agg") ||
    field.includes("CASE")
  ) {
    return field;
  }
  if (field.includes(" as ")) {
    const [column, alias] = field.split(" as ");
    return `${column
      .split(".")
      .map((part) => (part == "*" ? part : `"${part}"`))
      .join(".")} as "${alias}"`;
  }
  return field
    .split(".")
    .map((part) => (part == "*" ? part : `"${part}"`))
    .join(".");
}

function buildWhereClause(conditions) {
  if (!Array.isArray(conditions)) {
    return "";
  }

  return conditions
    .map((condition, index) => {
      if (Array.isArray(condition)) {
        return `${index > 0 ? "AND" : ""} (${buildWhereClause(condition)})`;
      } else if (typeof condition === "object") {
        const { column, field, operator, value, type } = condition;
        const conjunction = index === 0 ? "" : type ? type.toUpperCase() : "AND";
        if (operator == "LIKE") {
          return `${conjunction} ${column ? wrapField(column) : field} ${operator} ${value}`;
        }
        return `${conjunction} ${column ? wrapField(column) : field} ${operator} ${value}`;
      }
      return "";
    })
    .join(" ")
    .trim();
}

function buildCTE(cte) {
  if (!cte) {
    return "";
  }

  const { select, table, cteAlias, alias, joins = [], where = [], group_by = [], order_by, sort_order = "desc" } = cte;
  let query = `WITH ${cteAlias} AS (SELECT ${select.map(wrapField).join(", ")} FROM ${wrapField(table)} AS ${wrapField(alias)}`;

  // Add joins
  joins.forEach((join) => {
    const joinConditions = join.conditions
      .map((condition, index) => {
        const conjunction = index === 0 ? "" : condition.type ? condition.type.toUpperCase() : "AND";
        return `${conjunction} ${wrapField(condition.first)} ${condition.operator} ${
          condition.second ? wrapField(condition.second) : `${condition.value}`
        }`;
      })
      .join(" ");
    const joinQuery = ` ${join.type.toUpperCase()} JOIN ${join.table} AS ${join.alias} ON ${joinConditions}`;
    query += joinQuery;
  });

  // Add where conditions
  const whereClause = buildWhereClause(where);
  if (whereClause) {
    query += ` WHERE ${whereClause}`;
  }

  // Add group by
  if (group_by.length > 0) {
    query += ` GROUP BY ${group_by.map(wrapField).join(", ")}`;
  }

  // Add order by
  if (order_by) {
    query += ` ORDER BY ${wrapField(order_by)} ${sort_order}`;
  }

  query += ")";
  return query;
}

// Helper function to check if a value is numeric
function isNumeric(value) {
  return !isNaN(value) && !isNaN(parseFloat(value));
}

async function query({
  cte,
  select = ["*"],
  table,
  alias,
  joins = [],
  where = [],
  values = [],
  group_by = [],
  order_by = "Id",
  sort_order = "desc",
  pageNumber = 1,
  pageSize = 50,
}) {
  const client = await pool.connect();
  try {
    // Build the base query
    let countQuery = `${buildCTE(cte)} SELECT COUNT(*) FROM ${wrapField(table)} AS ${wrapField(alias)}`;
    let query = `${buildCTE(cte)} SELECT ${select.map(wrapField).join(", ")} FROM ${wrapField(table)} AS ${wrapField(alias)}`;

    // Add joins
    joins.forEach((join) => {
      const joinConditions = join.conditions
        .map((condition, index) => {
          const conjunction = index === 0 ? "" : condition.type ? condition.type.toUpperCase() : "AND";
          return `${conjunction} ${condition.wrap == false ? condition.first : wrapField(condition.first)} ${
            condition.operator
          } ${condition.second ? wrapField(condition.second) : `${condition.value}`}`;
        })
        .join(" ");
      const joinQuery = ` ${join.type.toUpperCase()} JOIN ${join.table} AS ${join.alias} ON ${joinConditions}`;
      query += joinQuery;
      countQuery += joinQuery;
    });

    // Add where conditions
    const whereClause = buildWhereClause(where);
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
      countQuery += ` WHERE ${whereClause}`;
    }

    // Add group by
    if (group_by.length > 0) {
      query += ` GROUP BY ${group_by.map(wrapField).join(", ")}`;
      countQuery += ` GROUP BY ${group_by.map(wrapField).join(", ")}`;
    }

    // Add order by and pagination
    query += ` ORDER BY ${wrapField(order_by)} ${sort_order}`;
    query += ` LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`;

    // Execute the query
    const result = await client.query(query, values);

    // Count total rows
    const countResult = await client.query(countQuery, values);
    const totalRows = parseInt(countResult.rows.length > 0 ? countResult.rows[0].count : 0, 10);

    const skippedColumns = [
      "Name",
      "NowPlayingItemName",
      "SeriesName",
      "SeasonName",
      "Id",
      "NowPlayingItemId",
      "ParentId",
      "SeriesId",
      "SeasonId",
      "EpisodeId",
      "ServerId",
    ];
    // Convert integer fields in the result rows
    const convertedRows = result.rows.map((row) => {
      return Object.keys(row).reduce((acc, key) => {
        const value = row[key];
        if (skippedColumns.includes(key)) {
          acc[key] = value; // Keep the original value for skipped columns
          return acc; // Skip the rowid field
        }
        // Convert numeric strings to integers if applicable
        acc[key] = isNumeric(value) ? parseInt(value, 10) : value;
        return acc;
      }, {});
    });

    // Return the structured response
    return {
      pages: Math.ceil(totalRows / pageSize),
      results: convertedRows,
    };
  } catch (error) {
    // console.timeEnd("queryWithPagingAndJoins");
    console.error("Error occurred while executing query:", error.message);
    return {
      pages: 0,
      results: [],
    };
  } finally {
    client.release();
  }
}
module.exports = {
  query,
};
