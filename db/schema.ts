/**
 * Drizzle ORM schema — mirrors prisma/schema.prisma exactly.
 * Table names and column names match the existing PostgreSQL database.
 * This file is the Phase 2 migration target; Prisma remains the active
 * ORM until the Drizzle migration is complete.
 *
 * To regenerate SQL from this schema:
 *   npx drizzle-kit generate
 *
 * To introspect existing DB into this schema:
 *   npx drizzle-kit introspect
 */

import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  integer,
  boolean,
  timestamp,
  date,
  doublePrecision,
  decimal,
  json,
  customType,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// ─── Custom Types ────────────────────────────────────────────

/** Postgres bytea for encrypted key vault blobs */
const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});

// ─── Enums ───────────────────────────────────────────────────

export const accountTypeEnum = pgEnum("AccountType", [
  "SAVINGS_ACCOUNT",
  "CREDIT_ACCOUNT",
  "CREDIT_CARD",
  "RECURRING_DEPOSIT",
  "FIXED_DEPOSIT",
]);

export const balanceChangeReasonEnum = pgEnum("BalanceChangeReason", [
  "ACCOUNT_ADDED",
  "ACCOUNT_REMOVED",
  "BALANCE_UPDATED",
]);

export const transactionTypeEnum = pgEnum("TransactionType", [
  "INCOME",
  "EXPENSE",
]);

export const investmentAssetTypeEnum = pgEnum("InvestmentAssetType", [
  "GOLD",
  "SILVER",
  "STOCK",
  "MUTUAL_FUND",
]);

export const investmentModeEnum = pgEnum("InvestmentMode", [
  "LUMPSUM",
  "SIP",
]);

export const stockExchangeEnum = pgEnum("StockExchange", ["NSE", "BSE"]);

export const depositTypeEnum = pgEnum("DepositType", [
  "RECURRING_DEPOSIT",
  "FIXED_DEPOSIT",
]);

export const depositStatusEnum = pgEnum("DepositStatus", [
  "ACTIVE",
  "MATURED",
]);

export const depositInstallmentFrequencyEnum = pgEnum(
  "DepositInstallmentFrequency",
  ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]
);

export const installmentStatusEnum = pgEnum("InstallmentStatus", [
  "PENDING",
  "PAID",
  "MISSED",
]);

export const messageTypeEnum = pgEnum("MessageType", [
  "TEXT",
  "LIST",
  "REMINDER",
  "AI_RESPONSE",
  "IMAGE",
  "VOICE",
]);

export const tripStatusEnum = pgEnum("TripStatus", [
  "PLANNING",
  "CONFIRMED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// ─── NextAuth Models ─────────────────────────────────────────

export const authAccounts = pgTable(
  "auth_accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => ({
    userIdIdx: index("auth_accounts_userId_idx").on(t.userId),
    providerUnique: uniqueIndex("auth_accounts_provider_providerAccountId_key").on(
      t.provider,
      t.providerAccountId
    ),
  })
);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionToken: text("sessionToken").notNull().unique(),
  userId: text("userId").notNull(),
  expires: timestamp("expires").notNull(),
  deviceInfo: text("device_info"),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull().unique(),
    expires: timestamp("expires").notNull(),
  },
  (t) => ({
    identifierTokenUnique: uniqueIndex("verification_tokens_identifier_token_key").on(
      t.identifier,
      t.token
    ),
  })
);

// ─── Core Models ─────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  currency: text("currency").notNull().default("INR"),
  monthlyIncome: doublePrecision("monthlyIncome"),
  publicKey: text("publicKey"),
  keyVersion: integer("keyVersion").notNull().default(1),
  keyRotatedAt: timestamp("keyRotatedAt"),
  encryptedKeyVault: bytea("encryptedKeyVault"),
  lastDeviceInfo: text("last_device_info"),
  lastSeenAt: timestamp("last_seen_at"),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
  updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
});

// ─── Finance Models ──────────────────────────────────────────

export const financialAccounts = pgTable(
  "financial_accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    nickname: text("nickname"),
    type: accountTypeEnum("type").notNull(),
    balance: doublePrecision("balance").notNull().default(0),
    isSalaryAccount: boolean("isSalaryAccount").notNull().default(false),
    isEmergencyFund: boolean("isEmergencyFund").notNull().default(false),
    isPinned: boolean("isPinned").notNull().default(false),
    coupleId: text("coupleId"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({ userIdIdx: index("financial_accounts_userId_idx").on(t.userId) })
);

export const balanceHistory = pgTable(
  "balance_history",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    accountId: text("accountId").notNull(),
    balance: doublePrecision("balance").notNull(),
    change: doublePrecision("change").notNull(),
    note: text("note"),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
  },
  (t) => ({
    accountIdIdx: index("balance_history_accountId_idx").on(t.accountId),
    userIdIdx: index("balance_history_userId_idx").on(t.userId),
  })
);

export const overallBalanceLog = pgTable(
  "overall_balance_log",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    coupleId: text("coupleId"),
    userId: text("userId").notNull(),
    accountId: text("accountId"),
    accountName: text("accountName").notNull(),
    reason: balanceChangeReasonEnum("reason").notNull(),
    change: doublePrecision("change").notNull(),
    totalBalance: doublePrecision("totalBalance").notNull(),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
  },
  (t) => ({
    coupleIdIdx: index("overall_balance_log_coupleId_idx").on(t.coupleId),
    userIdIdx: index("overall_balance_log_userId_idx").on(t.userId),
  })
);

export const transactions = pgTable(
  "transactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    accountId: text("accountId").notNull(),
    amount: doublePrecision("amount").notNull(),
    type: transactionTypeEnum("type").notNull(),
    category: text("category").notNull(),
    description: text("description"),
    receiptSource: text("receiptSource"),
    date: timestamp("date").notNull(),
    coupleId: text("coupleId"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("transactions_userId_idx").on(t.userId),
    userIdDateIdx: index("transactions_userId_date_idx").on(t.userId, t.date),
    userIdCategoryIdx: index("transactions_userId_category_idx").on(t.userId, t.category),
    accountIdDateIdx: index("transactions_accountId_date_idx").on(t.accountId, t.date),
    userIdCategoryDateIdx: index("transactions_userId_category_date_idx").on(t.userId, t.category, t.date),
  })
);

export const investmentHoldings = pgTable(
  "investment_holdings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    name: text("name").notNull(),
    assetType: investmentAssetTypeEnum("assetType").notNull(),
    mode: investmentModeEnum("mode").notNull().default("LUMPSUM"),
    ticker: text("ticker"),
    exchange: stockExchangeEnum("exchange"),
    quantity: doublePrecision("quantity"),
    quantityGrams: doublePrecision("quantityGrams"),
    investedAmount: doublePrecision("investedAmount").notNull(),
    currentPrice: doublePrecision("currentPrice"),
    currentValue: doublePrecision("currentValue"),
    sipAmount: doublePrecision("sipAmount"),
    sipDayOfMonth: integer("sipDayOfMonth"),
    startDate: timestamp("startDate").notNull(),
    nextSipDate: timestamp("nextSipDate"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("investment_holdings_userId_idx").on(t.userId),
    assetTypeIdx: index("investment_holdings_assetType_idx").on(t.assetType),
    nextSipDateIdx: index("investment_holdings_nextSipDate_idx").on(t.nextSipDate),
  })
);

export const depositInstruments = pgTable(
  "deposit_instruments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    name: text("name").notNull(),
    provider: text("provider"),
    type: depositTypeEnum("type").notNull(),
    principalAmount: doublePrecision("principalAmount").notNull(),
    interestRate: doublePrecision("interestRate").notNull(),
    tenureMonths: integer("tenureMonths").notNull(),
    installmentAmount: doublePrecision("installmentAmount"),
    installmentFrequency: depositInstallmentFrequencyEnum("installmentFrequency").notNull().default("MONTHLY"),
    paidInstallments: integer("paidInstallments").notNull().default(0),
    totalInstallments: integer("totalInstallments"),
    startDate: timestamp("startDate").notNull(),
    maturityDate: timestamp("maturityDate").notNull(),
    maturityAmount: doublePrecision("maturityAmount").notNull(),
    nextInstallmentDate: timestamp("nextInstallmentDate"),
    status: depositStatusEnum("status").notNull().default("ACTIVE"),
    sourceAccountId: text("sourceAccountId"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("deposit_instruments_userId_idx").on(t.userId),
    typeIdx: index("deposit_instruments_type_idx").on(t.type),
    maturityDateIdx: index("deposit_instruments_maturityDate_idx").on(t.maturityDate),
    nextInstallmentDateIdx: index("deposit_instruments_nextInstallmentDate_idx").on(t.nextInstallmentDate),
    sourceAccountIdIdx: index("deposit_instruments_sourceAccountId_idx").on(t.sourceAccountId),
  })
);

export const depositInstallments = pgTable(
  "deposit_installments",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    depositId: text("depositId").notNull(),
    amount: doublePrecision("amount").notNull(),
    dueDate: timestamp("dueDate").notNull(),
    paidDate: timestamp("paidDate"),
    status: installmentStatusEnum("status").notNull().default("PENDING"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    depositIdIdx: index("deposit_installments_depositId_idx").on(t.depositId),
    dueDateIdx: index("deposit_installments_dueDate_idx").on(t.dueDate),
  })
);

export const budgets = pgTable(
  "budgets",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    category: text("category").notNull(),
    limit: doublePrecision("limit").notNull(),
    month: text("month").notNull(),
    coupleId: text("coupleId"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdCategoryMonthUnique: uniqueIndex("budgets_userId_category_month_key").on(t.userId, t.category, t.month),
    userIdIdx: index("budgets_userId_idx").on(t.userId),
    userIdMonthIdx: index("budgets_userId_month_idx").on(t.userId, t.month),
  })
);

export const loans = pgTable(
  "loans",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    principal: doublePrecision("principal").notNull(),
    interestRate: doublePrecision("interestRate").notNull(),
    tenureMonths: integer("tenureMonths").notNull(),
    emiAmount: doublePrecision("emiAmount").notNull(),
    startDate: timestamp("startDate").notNull(),
    remainingBalance: doublePrecision("remainingBalance").notNull(),
    prepayments: json("prepayments"),
    schedule: json("schedule"),
    loanAccountNumber: text("loan_account_number"),
    scheduleGeneratedOn: text("schedule_generated_on"),
    loanProvider: text("loan_provider"),
    coupleId: text("coupleId"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({ userIdIdx: index("loans_userId_idx").on(t.userId) })
);

export const savingsGoals = pgTable(
  "savings_goals",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    name: text("name").notNull(),
    targetAmount: doublePrecision("targetAmount").notNull(),
    currentAmount: doublePrecision("currentAmount").notNull().default(0),
    deadline: timestamp("deadline"),
    coupleId: text("coupleId"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({ userIdIdx: index("savings_goals_userId_idx").on(t.userId) })
);

// ─── Budget Plans ─────────────────────────────────────────────

export const budgetPlans = pgTable(
  "budget_plans",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    monthAndYear: text("month_and_year").notNull(),
    mode: text("mode").notNull().default("monthly"),
    income: doublePrecision("income").notNull(),
    lineItems: json("lineItems").notNull(),
    coupleId: text("coupleId"),
    lastUpdatedById: text("last_updated_by_id"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("budget_plans_userId_idx").on(t.userId),
    coupleIdIdx: index("budget_plans_coupleId_idx").on(t.coupleId),
    lastUpdatedByIdIdx: index("budget_plans_lastUpdatedById_idx").on(t.lastUpdatedById),
  })
);

// ─── Notifications ────────────────────────────────────────────

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    type: text("type").notNull().default("COUPLE_INVITE"),
    featureId: text("featureId"),
    read: boolean("read").notNull().default(false),
    archived: boolean("archived").notNull().default(false),
    payload: json("payload"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    archivedAt: timestamp("archivedAt"),
  },
  (t) => ({
    userIdTypeFeatureIdUnique: uniqueIndex("notifications_userId_type_featureId_key").on(t.userId, t.type, t.featureId),
    userIdIdx: index("notifications_userId_idx").on(t.userId),
    featureIdIdx: index("notifications_featureId_idx").on(t.featureId),
    userIdArchivedIdx: index("notifications_userId_archived_idx").on(t.userId, t.archived),
  })
);

// ─── Lifestyle / Wellness ─────────────────────────────────────

export const bodyMetrics = pgTable(
  "body_metrics",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    subjectId: text("subject_id").notNull(),
    coupleId: text("couple_id"),
    measuredOn: date("measured_on").notNull(),
    weightInKg: decimal("weight_in_kg", { precision: 5, scale: 2 }).notNull(),
    heightInCm: decimal("height_in_cm", { precision: 5, scale: 2 }).notNull(),
    bmi: decimal("bmi", { precision: 4, scale: 2 }).notNull(),
    bmiCategory: text("bmi_category").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    subjectIdMeasuredOnUnique: uniqueIndex("body_metrics_subjectId_measuredOn_key").on(t.subjectId, t.measuredOn),
    coupleIdMeasuredOnIdx: index("body_metrics_coupleId_measuredOn_idx").on(t.coupleId, t.measuredOn),
    subjectIdMeasuredOnIdx: index("body_metrics_subjectId_measuredOn_idx").on(t.subjectId, t.measuredOn),
  })
);

export const bodyProfiles = pgTable(
  "body_profiles",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    subjectId: text("subject_id").notNull().unique(),
    coupleId: text("couple_id"),
    defaultHeightInCm: decimal("default_height_in_cm", { precision: 5, scale: 2 }),
    targetWeightInKg: decimal("target_weight_in_kg", { precision: 5, scale: 2 }),
    birthDate: date("birth_date"),
    sex: text("sex"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("body_profiles_userId_idx").on(t.userId),
    coupleIdIdx: index("body_profiles_coupleId_idx").on(t.coupleId),
  })
);

export const nutritionLogs = pgTable(
  "nutrition_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    loggedOn: date("loggedOn").notNull(),
    mealType: text("mealType").notNull(),
    name: text("name").notNull(),
    calories: doublePrecision("calories").notNull(),
    proteinG: doublePrecision("proteinG").notNull().default(0),
    carbsG: doublePrecision("carbsG").notNull().default(0),
    fatG: doublePrecision("fatG").notNull().default(0),
    note: text("note"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdLoggedOnIdx: index("nutrition_logs_userId_loggedOn_idx").on(t.userId, t.loggedOn),
    coupleIdIdx: index("nutrition_logs_coupleId_idx").on(t.coupleId),
  })
);

export const exerciseLogs = pgTable(
  "exercise_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    loggedOn: date("loggedOn").notNull(),
    type: text("type").notNull(),
    name: text("name").notNull(),
    durationMins: integer("durationMins").notNull(),
    caloriesBurned: doublePrecision("caloriesBurned"),
    note: text("note"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdLoggedOnIdx: index("exercise_logs_userId_loggedOn_idx").on(t.userId, t.loggedOn),
    coupleIdIdx: index("exercise_logs_coupleId_idx").on(t.coupleId),
  })
);

export const sleepLogs = pgTable(
  "sleep_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    date: date("date").notNull(),
    bedtimeAt: timestamp("bedtimeAt").notNull(),
    wakeAt: timestamp("wakeAt").notNull(),
    durationMins: integer("durationMins").notNull(),
    quality: integer("quality").notNull(),
    note: text("note"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdDateIdx: index("sleep_logs_userId_date_idx").on(t.userId, t.date),
    coupleIdIdx: index("sleep_logs_coupleId_idx").on(t.coupleId),
  })
);

export const habits = pgTable(
  "habits",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    name: text("name").notNull(),
    description: text("description"),
    targetDays: integer("targetDays").notNull().default(7),
    isShared: boolean("isShared").notNull().default(false),
    isActive: boolean("isActive").notNull().default(true),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("habits_userId_idx").on(t.userId),
    coupleIdIdx: index("habits_coupleId_idx").on(t.coupleId),
  })
);

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    habitId: text("habitId").notNull(),
    userId: text("userId").notNull(),
    loggedOn: date("loggedOn").notNull(),
    completed: boolean("completed").notNull().default(true),
    note: text("note"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
  },
  (t) => ({
    habitIdUserIdLoggedOnUnique: uniqueIndex("habit_logs_habitId_userId_loggedOn_key").on(t.habitId, t.userId, t.loggedOn),
    habitIdIdx: index("habit_logs_habitId_idx").on(t.habitId),
    userIdLoggedOnIdx: index("habit_logs_userId_loggedOn_idx").on(t.userId, t.loggedOn),
  })
);

// ─── Couple Models ────────────────────────────────────────────

export const couples = pgTable("couples", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
  updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
});

export const coupleMembers = pgTable(
  "couple_members",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    coupleId: text("coupleId").notNull(),
    userId: text("userId").notNull(),
    role: text("role").notNull().default("OWNER"),
    joinedAt: timestamp("joinedAt").notNull().default(sql`now()`),
    typingAt: timestamp("typingAt"),
  },
  (t) => ({
    coupleIdUserIdUnique: uniqueIndex("couple_members_coupleId_userId_key").on(t.coupleId, t.userId),
  })
);

export const coupleInvites = pgTable("couple_invites", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  coupleId: text("coupleId").notNull(),
  email: text("email").notNull(),
  invitedBy: text("invitedBy").notNull(),
  token: text("token").notNull().unique().$defaultFn(() => crypto.randomUUID()),
  status: text("status").notNull().default("PENDING"),
  createdAt: timestamp("createdAt").notNull().default(sql`now()`),
});

// ─── Couple: Chat ─────────────────────────────────────────────

export const coupleMessages = pgTable(
  "couple_messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    coupleId: text("coupleId").notNull(),
    senderId: text("senderId").notNull(),
    type: messageTypeEnum("type").notNull().default("TEXT"),
    content: text("content").notNull(),
    iv: text("iv"),
    encrypted: boolean("encrypted").notNull().default(false),
    payload: json("payload"),
    reminderAt: timestamp("reminderAt"),
    readBy: text("readBy").array().notNull().default(sql`'{}'::text[]`),
    deliveredAt: timestamp("deliveredAt"),
    pinnedAt: timestamp("pinnedAt"),
    fileStoragePath: text("fileStoragePath"),
    fileDownloadedBy: text("fileDownloadedBy").array().notNull().default(sql`'{}'::text[]`),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    coupleIdCreatedAtIdx: index("couple_messages_coupleId_createdAt_idx").on(t.coupleId, t.createdAt),
    senderIdIdx: index("couple_messages_senderId_idx").on(t.senderId),
    coupleIdDeliveredAtIdx: index("couple_messages_coupleId_deliveredAt_idx").on(t.coupleId, t.deliveredAt),
  })
);

export const coupleChats = pgTable(
  "couple_chats",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    coupleId: text("coupleId").notNull(),
    title: text("title").notNull().default("New chat"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({ coupleIdIdx: index("couple_chats_coupleId_idx").on(t.coupleId) })
);

export const coupleChatMessages = pgTable(
  "couple_chat_messages",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    chatId: text("chatId").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    iv: text("iv"),
    encrypted: boolean("encrypted").notNull().default(false),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
  },
  (t) => ({ chatIdIdx: index("couple_chat_messages_chatId_idx").on(t.chatId) })
);

// ─── Travel ───────────────────────────────────────────────────

export const trips = pgTable(
  "trips",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    coupleId: text("coupleId"),
    name: text("name").notNull(),
    destination: text("destination").notNull(),
    startDate: date("startDate").notNull(),
    endDate: date("endDate").notNull(),
    budget: doublePrecision("budget"),
    status: tripStatusEnum("status").notNull().default("PLANNING"),
    notes: text("notes"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("trips_userId_idx").on(t.userId),
    coupleIdIdx: index("trips_coupleId_idx").on(t.coupleId),
  })
);

export const tripItineraryItems = pgTable(
  "trip_itinerary_items",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text("tripId").notNull(),
    day: integer("day").notNull(),
    time: text("time"),
    title: text("title").notNull(),
    description: text("description"),
    location: text("location"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({ tripIdIdx: index("trip_itinerary_items_tripId_idx").on(t.tripId) })
);

export const tripExpenses = pgTable(
  "trip_expenses",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text("tripId").notNull(),
    userId: text("userId").notNull(),
    title: text("title").notNull(),
    amount: doublePrecision("amount").notNull(),
    currency: text("currency").notNull().default("INR"),
    category: text("category"),
    paidBy: text("paidBy"),
    splitWith: text("splitWith").array().notNull().default(sql`'{}'::text[]`),
    date: date("date").notNull(),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    tripIdIdx: index("trip_expenses_tripId_idx").on(t.tripId),
    userIdIdx: index("trip_expenses_userId_idx").on(t.userId),
  })
);

export const tripChecklist = pgTable(
  "trip_checklist",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    tripId: text("tripId").notNull(),
    userId: text("userId").notNull(),
    item: text("item").notNull(),
    packed: boolean("packed").notNull().default(false),
    assignedTo: text("assignedTo"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({ tripIdIdx: index("trip_checklist_tripId_idx").on(t.tripId) })
);

// ─── Push Notifications ───────────────────────────────────────

export const deviceTokens = pgTable(
  "device_tokens",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("userId").notNull(),
    token: text("token").notNull().unique(),
    platform: text("platform").notNull(),
    active: boolean("active").notNull().default(true),
    deviceInfo: text("device_info"),
    createdAt: timestamp("createdAt").notNull().default(sql`now()`),
    updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdIdx: index("device_tokens_userId_idx").on(t.userId),
    tokenIdx: index("device_tokens_token_idx").on(t.token),
  })
);

// ─── App Config ───────────────────────────────────────────────

export const appConfig = pgTable("app_config", {
  id: text("id").primaryKey().default("singleton"),
  minAppVersion: text("minAppVersion").notNull().default("1.0.0"),
  enabledFeatures: text("enabledFeatures").array().notNull().default(sql`'{finance,chat}'::text[]`),
  maintenanceMode: boolean("maintenanceMode").notNull().default(false),
  maintenanceMessage: text("maintenanceMessage").notNull().default(""),
  updatedAt: timestamp("updatedAt").notNull().default(sql`now()`),
});

// ─── Error Tracing ────────────────────────────────────────────

export const appErrors = pgTable(
  "app_errors",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id"),
    route: text("route").notNull(),
    method: text("method").notNull(),
    statusCode: integer("status_code").notNull(),
    message: text("message").notNull(),
    stack: text("stack"),
    platform: text("platform"),
    appVersion: text("app_version"),
    createdAt: timestamp("created_at").notNull().default(sql`now()`),
  },
  (t) => ({
    userIdCreatedAtIdx: index("app_errors_user_id_created_at_idx").on(t.userId, t.createdAt),
    routeCreatedAtIdx: index("app_errors_route_created_at_idx").on(t.route, t.createdAt),
    statusCodeCreatedAtIdx: index("app_errors_status_code_created_at_idx").on(t.statusCode, t.createdAt),
  })
);
