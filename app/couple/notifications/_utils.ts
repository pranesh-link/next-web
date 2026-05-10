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

type NotificationLike = {
  type: string;
  featureId: string | null;
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
