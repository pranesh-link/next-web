import fs from "fs";
import path from "path";

const TYPE_MAP: Record<string, string> = {
  String: "TEXT",
  Int: "INTEGER",
  Float: "DECIMAL",
  Decimal: "DECIMAL",
  Boolean: "BOOLEAN",
  DateTime: "TIMESTAMP",
  Json: "JSONB",
  Bytes: "BYTEA",
};

const SKIP_MODELS = new Set(["Account", "Session", "VerificationToken"]);

export const SCHEMA_CACHE: { value: string | null } = { value: null };

function mapPrismaType(prismaType: string): string {
  return TYPE_MAP[prismaType] ?? "TEXT";
}

function needsQuoting(fieldName: string): boolean {
  return fieldName !== fieldName.toLowerCase();
}

export function extractSchemaForPrompt(): string {
  if (SCHEMA_CACHE.value) return SCHEMA_CACHE.value;

  try {
    const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
    const schemaContent = fs.readFileSync(schemaPath, "utf-8");

    // First pass: collect all model names to detect relation fields
    const modelNames = new Set<string>();
    const modelNameRegex = /^model\s+(\w+)\s*\{/gm;
    let nameMatch: RegExpExecArray | null;
    while ((nameMatch = modelNameRegex.exec(schemaContent)) !== null) {
      modelNames.add(nameMatch[1]);
    }

    const outputLines: string[] = [
      "## Database Schema (PostgreSQL)",
      "",
      "IMPORTANT table names and columns — use these EXACTLY in SQL queries:",
      "",
    ];

    const lines = schemaContent.split("\n");
    let inModel = false;
    let modelName = "";
    let tableName = "";
    let columnDefs: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!inModel) {
        const modelMatch = line.match(/^model\s+(\w+)\s*\{/);
        if (modelMatch) {
          modelName = modelMatch[1];
          tableName = modelName.toLowerCase();
          inModel = true;
          columnDefs = [];
        }
        continue;
      }

      // End of model block
      if (line === "}") {
        if (!SKIP_MODELS.has(modelName) && columnDefs.length > 0) {
          outputLines.push(
            `Table: ${tableName}  (model: ${modelName})`,
            `  Columns: ${columnDefs.join(", ")}`,
            "",
          );
        }
        inModel = false;
        modelName = "";
        tableName = "";
        columnDefs = [];
        continue;
      }

      // Capture @@map before the general @@ skip below
      const mapMatch = line.match(/^@@map\("([^"]+)"\)/);
      if (mapMatch) {
        tableName = mapMatch[1];
        continue;
      }

      // Skip directive lines, comments, and blank lines
      if (line.startsWith("@@") || line.startsWith("//") || line === "") {
        continue;
      }

      // Skip explicit relation fields
      if (line.includes("@relation")) continue;

      // Parse field: fieldName TypeWithModifiers ...rest
      const fieldMatch = line.match(/^(\w+)\s+(\S+)/);
      if (!fieldMatch) continue;

      const fieldName = fieldMatch[1];
      const rawType = fieldMatch[2];

      // Strip array brackets and optional marker to get the base type
      const baseType = rawType.replace(/[\[\]?]/g, "");

      // Skip list-relation fields (e.g. `accounts FinancialAccount[]`)
      if (modelNames.has(baseType)) continue;

      const sqlType = mapPrismaType(baseType);
      const colRef = needsQuoting(fieldName) ? `"${fieldName}"` : fieldName;
      columnDefs.push(`${colRef} ${sqlType}`);
    }

    SCHEMA_CACHE.value = outputLines.join("\n");
  } catch {
    SCHEMA_CACHE.value = "";
  }

  return SCHEMA_CACHE.value ?? "";
}
