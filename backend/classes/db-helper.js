const { pool } = require("../db.js");

function wrapField(field) {
  if (field === "*") {
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
        return `(${buildWhereClause(condition)})`;
      } else if (typeof condition === "object") {
        const { column, operator, value, type } = condition;
        const conjunction = index === 0 ? "" : type ? type.toUpperCase() : "AND";
        return `${conjunction} ${wrapField(column)} ${operator} '${value}'`;
      }
      return "";
    })
    .join(" ")
    .trim();
}

async function query({
  select = ["*"],
  table,
  alias,
  joins = [],
  where = [],
  order_by = "Id",
  sort_order = "desc",
  pageNumber = 1,
  pageSize = 50,
}) {
  const client = await pool.connect();
  try {
    // Build the base query
    let countQuery = `SELECT COUNT(*) FROM ${wrapField(table)} AS ${wrapField(alias)}`;
    let query = `SELECT ${select.map(wrapField).join(", ")} FROM ${wrapField(table)} AS ${wrapField(alias)}`;

    // Add joins
    joins.forEach((join) => {
      const joinConditions = join.conditions
        .map((condition, index) => {
          const conjunction = index === 0 ? "" : condition.type ? condition.type.toUpperCase() : "AND";
          return `${conjunction} ${wrapField(condition.first)} ${condition.operator} ${
            condition.second ? wrapField(condition.second) : `'${condition.value}'`
          }`;
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

    // Add order by and pagination
    query += ` ORDER BY ${wrapField(order_by)} ${sort_order}`;
    query += ` LIMIT ${pageSize} OFFSET ${(pageNumber - 1) * pageSize}`;

    // Execute the query
    const result = await client.query(query);

    // Count total rows
    const countResult = await client.query(countQuery);
    const totalRows = parseInt(countResult.rows[0].count, 10);

    // Return the structured response
    return {
      pages: Math.ceil(totalRows / pageSize),
      results: result.rows,
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
