export type InviteDetail = {
  id: string;
  token: string;
  status: string;
  coupleName: string | null;
  inviterName: string | null;
};

export type NotificationContent = {
  icon: string;
  title: string;
  meta: string;
  hasActions: boolean;
  token: string | undefined;
  inviteId: string | undefined;
  linkTo?: string;
  /** Label for the linkTo action button. Defaults to "View" when omitted. */
  linkLabel?: string;
};

export function formatTime(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return d.toLocaleDateString();
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

type NotificationLike = {
  type: string;
  featureId: string | null;
  payload?: unknown;
};

export function getNotificationContent(
  notif: NotificationLike,
  inviteDetails: Record<string, InviteDetail>
): NotificationContent {
  if (notif.type === "COUPLE_INVITE" && notif.featureId) {
    const detail = inviteDetails[notif.featureId];
    const inviterName = detail?.inviterName || "Someone";
    const groupName = detail?.coupleName || "their group";
    return {
      icon: "👥",
      title: `${inviterName} invited you to join ${groupName}`,
      meta: "Partner invite",
      hasActions: detail?.status === "PENDING",
      token: detail?.token,
      inviteId: detail?.id,
    };
  }
  if (notif.type === "INCOME_REMINDER" && notif.featureId) {
    const [year, monthNum] = notif.featureId.split("-");
    const monthName = new Date(Number(year), Number(monthNum) - 1).toLocaleString("en-US", { month: "long", year: "numeric" });
    return {
      icon: "💰",
      title: `Record your income for ${monthName}`,
      meta: "Income reminder",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/accounts?addIncome=true",
      linkLabel: "Add Income",
    };
  }
  if (notif.type === "BUDGET_ALERT") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { category: string; pct: number })
      : null;
    return {
      icon: "⚠️",
      title: p
        ? `You've used ${p.pct}% of your ${p.category} budget this month`
        : "Budget limit reached",
      meta: "Budget alert",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/budgets",
      linkLabel: "View Budget",
    };
  }
  if (notif.type === "SIP_REMINDER") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { name: string; sipAmount: number; daysUntil: number })
      : null;
    const rupee = (v: number) => `\u20b9${v.toLocaleString("en-IN")}`;
    return {
      icon: "📈",
      title: p
        ? `Your SIP of ${rupee(p.sipAmount)} is due in ${p.daysUntil} day${
            p.daysUntil === 1 ? "" : "s"
          }`
        : "SIP installment is due",
      meta: "Investment reminder",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/investments",
      linkLabel: "View Investments",
    };
  }
  if (notif.type === "DEPOSIT_REMINDER") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { name: string; installmentAmount: number; dueDate: string })
      : null;
    const rupee = (v: number) => `\u20b9${v.toLocaleString("en-IN")}`;
    const dateStr = p
      ? new Date(p.dueDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })
      : "";
    return {
      icon: "🗓️",
      title: p
        ? `Deposit installment of ${rupee(p.installmentAmount)} is due on ${dateStr}`
        : "Deposit installment is due",
      meta: "Deposit reminder",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/deposits",
      linkLabel: "View Deposits",
    };
  }
  if (notif.type === "INVESTMENT_SIP_REMINDER") {
    return {
      icon: "📈",
      title: "SIP installment is due",
      meta: "Investment reminder",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/investments",
      linkLabel: "View Investments",
    };
  }
  if (notif.type === "DEPOSIT_MATURITY_REMINDER") {
    return {
      icon: "🏦",
      title: "A deposit is nearing maturity",
      meta: "Deposit reminder",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/deposits",
      linkLabel: "View Deposits",
    };
  }
  if (notif.type === "DEPOSIT_INSTALLMENT_REMINDER") {
    return {
      icon: "🗓️",
      title: "Recurring deposit installment is due",
      meta: "Deposit reminder",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/deposits",
      linkLabel: "View Deposits",
    };
  }
  // Push notification types
  if (notif.type === "PUSH_BUDGET_ALERT") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { category?: string; message?: string })
      : null;
    return {
      icon: "⚠️",
      title: p?.message || "Budget alert",
      meta: "Budget notification",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/budgets",
      linkLabel: "View Budget",
    };
  }
  if (notif.type === "PUSH_SIP_REMINDER") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { message?: string })
      : null;
    return {
      icon: "📈",
      title: p?.message || "SIP installment due",
      meta: "Investment notification",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/investments",
      linkLabel: "View Investments",
    };
  }
  if (notif.type === "PUSH_DEPOSIT_REMINDER") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { message?: string })
      : null;
    return {
      icon: "🏦",
      title: p?.message || "Deposit installment due",
      meta: "Deposit notification",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/deposits",
      linkLabel: "View Deposits",
    };
  }
  if (notif.type === "PUSH_LOAN_REMINDER") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { message?: string })
      : null;
    return {
      icon: "💳",
      title: p?.message || "Loan EMI due soon",
      meta: "Loan notification",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/loans",
      linkLabel: "View Loans",
    };
  }
  if (notif.type === "PUSH_GOAL_REMINDER") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { message?: string })
      : null;
    return {
      icon: "🎯",
      title: p?.message || "Goal progress update",
      meta: "Goal notification",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/goals",
      linkLabel: "View Goals",
    };
  }
  if (notif.type === "PUSH_TRANSACTION_ALERT") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { message?: string })
      : null;
    return {
      icon: "💰",
      title: p?.message || "Transaction alert",
      meta: "Transaction notification",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/transactions",
      linkLabel: "View Transactions",
    };
  }
  if (notif.type === "PUSH_ACCOUNT_SYNC") {
    const p = isRecord(notif.payload)
      ? (notif.payload as { message?: string })
      : null;
    return {
      icon: "🔄",
      title: p?.message || "Account sync update",
      meta: "Account notification",
      hasActions: false,
      token: undefined,
      inviteId: undefined,
      linkTo: "/couple/finance/accounts",
      linkLabel: "View Accounts",
    };
  }
  return {
    icon: "🔔",
    title: "New notification",
    meta: notif.type,
    hasActions: false,
    token: undefined,
    inviteId: undefined,
  };
}
