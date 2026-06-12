/**
 * NL-to-SQL tool for "Chat with your Couple data".
 * Exposes a single `executeQuery` tool — the LLM writes the SQL,
 * we validate it, scope it to the couple, and execute it.
 */

import { db } from "@db";
import { sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToolParam = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: {
      type: "object";
      properties: Record<string, { type: string; description: string }>;
      required?: string[];
    };
  };
};

// ─── Tool Definition ──────────────────────────────────────────────────────────

export const NL_TO_SQL_TOOL: ToolParam[] = [
  {
    type: "function",
    function: {
      name: "executeQuery",
      description: `Execute a read-only PostgreSQL SELECT query against the couple's data. 
The query MUST include WHERE "userId" IN (...coupleUserIds) to scope data to this couple.
Always use double-quoted column names for camelCase fields (e.g. "userId", "createdAt").
Use the exact table names from the schema (snake_case with @@map).
Add LIMIT 100 if not specified. Only SELECT queries are allowed.
Return raw SQL — no markdown, no explanation, just the SQL string.`,
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A valid PostgreSQL SELECT query scoped to the couple user IDs.",
          },
          explanation: {
            type: "string",
            description: "One sentence explaining what this query retrieves (shown to user while loading).",
          },
        },
        required: ["query", "explanation"],
      },
    },
  },
];

// ─── Tool Labels ──────────────────────────────────────────────────────────────

export const NL_TO_SQL_TOOL_LABELS: Record<string, string> = {
  executeQuery: "Querying your couple data...",
};

// ─── Query Validator & Executor ───────────────────────────────────────────────

export async function validateAndExecuteQuery(
  query: string,
  coupleUserIds: string[]
): Promise<{ rows: unknown[]; error?: string }> {
  // Step 1 — Strip comments
  const stripped = query
    .replace(/--[^\n]*/g, "")         // single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .trim();

  // Step 2 — Strip trailing semicolon (LLMs always add one); reject mid-query
  // semicolons which indicate statement chaining.
  const noTrailingSemi = stripped.replace(/;\s*$/, "");
  if (noTrailingSemi.includes(";")) {
    return { rows: [], error: "Query must not contain multiple statements." };
  }
  const cleaned = noTrailingSemi;

  // Step 3 — Must start with SELECT
  if (!/^SELECT\b/i.test(cleaned)) {
    return { rows: [], error: "Only SELECT queries are allowed." };
  }

  // Step 4 — Forbidden keyword check
  const FORBIDDEN =
    /\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXECUTE|CALL|COPY|VACUUM|ANALYZE|EXPLAIN)\b/i;
  if (FORBIDDEN.test(cleaned)) {
    return { rows: [], error: "Query contains forbidden keywords." };
  }

  // Step 5 — Must reference at least one of the couple user IDs
  const hasUserScope =
    coupleUserIds.some((id) => cleaned.includes(id)) ||
    /WHERE[\s\S]+"userId"/i.test(cleaned);
  if (!hasUserScope) {
    return { rows: [], error: "Query must be scoped to couple user IDs." };
  }

  // Step 6 — Add LIMIT if missing
  const finalQuery = /\bLIMIT\b/i.test(cleaned)
    ? cleaned
    : `${cleaned} LIMIT 100`;

  // Step 7 — Execute
  try {
    const result = await db.execute(sql.raw(finalQuery));
    return { rows: result.rows as unknown[] };
  } catch (err) {
    return {
      rows: [],
      error: err instanceof Error ? err.message : "Query execution failed.",
    };
  }
}
