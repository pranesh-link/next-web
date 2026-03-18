"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import styled, { keyframes } from "styled-components";
import {
  getCouple,
  createNewCouple,
  sendInvite,
  leaveExistingCouple,
} from "@/finance/_actions/couples";
import FinanceHeader from "@/finance/_components/layout/FinanceHeader";
import Modal from "@/finance/_components/shared/Modal";

/* ── Types ──────────────────────────────────────────── */

type CoupleData = Extract<
  Awaited<ReturnType<typeof getCouple>>,
  { success: true }
>["data"];

type NonNullCouple = NonNullable<CoupleData>;
type CoupleMember = NonNullCouple["members"][number];
type CoupleInvite = NonNullCouple["invites"][number];

type Notification = {
  message: string;
  type: "success" | "error";
};

/* ── Animations ─────────────────────────────────────── */

const EASING = "cubic-bezier(0.16, 1, 0.3, 1)";

const slideDown = keyframes`
  from { opacity: 0; transform: translate(-50%, -12px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translate(-50%, 0); }
  to   { opacity: 0; transform: translate(-50%, -12px); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

/* ── Styled Components ──────────────────────────────── */

const PageWrapper = styled.div`
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 80px);

  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const NotificationBanner = styled.div<{
  $type: "success" | "error";
  $leaving: boolean;
}>`
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  background: ${(p) =>
    p.$type === "success"
      ? "rgba(34, 197, 94, 0.15)"
      : "rgba(239, 68, 68, 0.15)"};
  border: 1px solid
    ${(p) =>
      p.$type === "success"
        ? "rgba(34, 197, 94, 0.4)"
        : "rgba(239, 68, 68, 0.4)"};
  color: ${(p) => (p.$type === "success" ? "#16a34a" : "#dc2626")};
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  backdrop-filter: blur(12px);
  animation: ${(p) => (p.$leaving ? fadeOut : slideDown)} 0.3s ${EASING}
    forwards;
`;

/* ── Loading skeleton ── */

const SkeletonCard = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
`;

const SkeletonLine = styled.div<{ $width?: string; $height?: string }>`
  width: ${(p) => p.$width ?? "100%"};
  height: ${(p) => p.$height ?? "16px"};
  border-radius: 8px;
  background: #e5e7eb;
  animation: ${pulse} 1.5s ease-in-out infinite;

  & + & {
    margin-top: 12px;
  }
`;

/* ── Solo / Create card ── */

const SoloCard = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
`;

const CardIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const CardTitle = styled.h2`
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
`;

const CardDescription = styled.p`
  font-size: 14px;
  color: #52525b;
  margin: 0 0 28px 0;
  line-height: 1.6;
`;

const FieldGroup = styled.div`
  max-width: 320px;
  margin: 0 auto 20px;
  text-align: left;
`;

const Label = styled.label`
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 6px;
`;

const Input = styled.input`
  background: #ffffff;
  border: 1px solid #d1d5db;
  color: #1e293b;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  width: 100%;
  font-family: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const PrimaryButton = styled.button`
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const OutlineButton = styled.button`
  background: #ffffff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: #9ca3af;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DangerButton = styled.button`
  background: #dc2626;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #b91c1c;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.span`
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
`;

/* ── Couple card ── */

const CoupleCard = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
`;

const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 24px 0;
`;

const SectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #94a3b8;
  margin: 0 0 16px 0;
`;

/* ── Member rows ── */

const MemberCard = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;

  & + & {
    margin-top: 10px;
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.12);
  color: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
`;

const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const MemberName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

const MemberEmail = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
`;

const RoleBadge = styled.span<{ $role: string }>`
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 4px 10px;
  border-radius: 20px;
  flex-shrink: 0;
  background: ${(p) =>
    p.$role === "OWNER" ? "rgba(59, 130, 246, 0.1)" : "rgba(22, 163, 74, 0.1)"};
  color: ${(p) => (p.$role === "OWNER" ? "#3b82f6" : "#16a34a")};
`;

/* ── Invite section ── */

const InviteForm = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const InviteInputGroup = styled.div`
  flex: 1;
`;

const InviteRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 10px;
  font-size: 13px;

  & + & {
    margin-top: 8px;
  }
`;

const InviteEmail = styled.span`
  color: #1e293b;
  font-weight: 500;
`;

const InviteStatus = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #d97706;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

/* ── Leave section ── */

const LeaveSection = styled.div`
  margin-top: 24px;
  text-align: center;
`;

/* ── Modal styled ── */

const ConfirmText = styled.p`
  font-size: 14px;
  color: #52525b;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

/* ── Component ──────────────────────────────────────── */

export default function CouplePage() {
  const [couple, setCouple] = useState<CoupleData>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupleName, setCoupleName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifLeaving, setNotifLeaving] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((message: string, type: "success" | "error") => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), 300);
    }, 3000);
  }, []);

  const fetchCouple = useCallback(async () => {
    const res = await getCouple();
    if (res.success) {
      setCouple(res.data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCouple();
  }, [fetchCouple]);

  const handleCreateCouple = async () => {
    setSaving(true);
    setError("");
    const res = await createNewCouple({ name: coupleName || undefined });
    if (res.success) {
      notify("Couple created!", "success");
      setCoupleName("");
      await fetchCouple();
    } else {
      setError(res.error);
      notify(res.error, "error");
    }
    setSaving(false);
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }
    setSaving(true);
    setError("");
    const res = await sendInvite({ email: inviteEmail.trim() });
    if (res.success) {
      notify("Invite sent!", "success");
      setInviteEmail("");
      await fetchCouple();
    } else {
      setError(res.error);
      notify(res.error, "error");
    }
    setSaving(false);
  };

  const handleLeave = async () => {
    setSaving(true);
    const res = await leaveExistingCouple();
    if (res.success) {
      notify("You left the couple", "success");
      setCouple(null);
      setShowLeaveConfirm(false);
    } else {
      notify(res.error, "error");
    }
    setSaving(false);
  };

  return (
    <>
      <FinanceHeader title="Partner" />

      {notification && (
        <NotificationBanner $type={notification.type} $leaving={notifLeaving}>
          {notification.message}
        </NotificationBanner>
      )}

      <PageWrapper>
        {loading ? (
          <SkeletonCard>
            <SkeletonLine $width="40%" $height="20px" />
            <SkeletonLine $width="70%" />
            <SkeletonLine $width="55%" />
            <SkeletonLine $width="100%" $height="44px" />
          </SkeletonCard>
        ) : !couple ? (
          /* ── No couple: create form ── */
          <SoloCard>
            <CardIcon>💑</CardIcon>
            <CardTitle>Start Your Couple Journey</CardTitle>
            <CardDescription>
              Link with your partner to manage finances together
            </CardDescription>
            <FieldGroup>
              <Label>Couple Name (optional)</Label>
              <Input
                placeholder="e.g. The Smiths"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
              />
            </FieldGroup>
            {error && <ErrorText>{error}</ErrorText>}
            <PrimaryButton
              type="button"
              disabled={saving}
              onClick={handleCreateCouple}
            >
              {saving ? "Creating…" : "Create Couple"}
            </PrimaryButton>
          </SoloCard>
        ) : couple.members.length < 2 ? (
          /* ── One member: invite partner ── */
          <CoupleCard>
            <CardTitle>{couple.name || "Your Couple"}</CardTitle>

            <Divider />

            <SectionTitle>Members</SectionTitle>
            {couple.members.map((member: CoupleMember) => (
              <MemberCard key={member.userId}>
                <Avatar>
                  {member.user.name?.[0]?.toUpperCase() || "?"}
                </Avatar>
                <MemberInfo>
                  <MemberName>{member.user.name || "Unknown"}</MemberName>
                  <MemberEmail>{member.user.email}</MemberEmail>
                </MemberInfo>
                <RoleBadge $role={member.role}>{member.role}</RoleBadge>
              </MemberCard>
            ))}

            <Divider />

            <SectionTitle>Invite Your Partner</SectionTitle>
            <InviteForm>
              <InviteInputGroup>
                <Label>Partner&apos;s Email</Label>
                <Input
                  type="email"
                  placeholder="partner@email.com"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    setError("");
                  }}
                />
              </InviteInputGroup>
              <PrimaryButton
                type="button"
                disabled={saving || !inviteEmail.trim()}
                onClick={handleSendInvite}
                style={{ whiteSpace: "nowrap" }}
              >
                {saving ? "Sending…" : "Send Invite"}
              </PrimaryButton>
            </InviteForm>
            {error && <ErrorText>{error}</ErrorText>}

            {couple.invites && couple.invites.length > 0 && (
              <>
                <Divider />
                <SectionTitle>Pending Invites</SectionTitle>
                {couple.invites.map((invite: CoupleInvite) => (
                  <InviteRow key={invite.id}>
                    <InviteEmail>{invite.email}</InviteEmail>
                    <InviteStatus>Pending</InviteStatus>
                  </InviteRow>
                ))}
              </>
            )}
          </CoupleCard>
        ) : (
          /* ── Full couple ── */
          <CoupleCard>
            <CardTitle>{couple.name || "Your Couple"} 💑</CardTitle>

            <Divider />

            <SectionTitle>Members</SectionTitle>
            {couple.members.map((member: CoupleMember) => (
              <MemberCard key={member.userId}>
                <Avatar>
                  {member.user.name?.[0]?.toUpperCase() || "?"}
                </Avatar>
                <MemberInfo>
                  <MemberName>{member.user.name || "Unknown"}</MemberName>
                  <MemberEmail>{member.user.email}</MemberEmail>
                </MemberInfo>
                <RoleBadge $role={member.role}>{member.role}</RoleBadge>
              </MemberCard>
            ))}

            <LeaveSection>
              <OutlineButton
                type="button"
                onClick={() => setShowLeaveConfirm(true)}
                style={{ color: "#dc2626", borderColor: "#fca5a5" }}
              >
                Leave Couple
              </OutlineButton>
            </LeaveSection>
          </CoupleCard>
        )}
      </PageWrapper>

      {/* Leave confirmation modal */}
      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="Leave Couple"
        size="sm"
      >
        <ConfirmText>
          Are you sure? Your partner will retain access to their own data.
        </ConfirmText>
        <ButtonRow>
          <OutlineButton
            type="button"
            onClick={() => setShowLeaveConfirm(false)}
            disabled={saving}
          >
            Cancel
          </OutlineButton>
          <DangerButton type="button" onClick={handleLeave} disabled={saving}>
            {saving ? "Leaving…" : "Leave"}
          </DangerButton>
        </ButtonRow>
      </Modal>
    </>
  );
}
