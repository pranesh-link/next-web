"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getCouple,
  createNewCouple,
  sendInvite,
  revokeInvite,
  renameCoupleAction,
  disbandCoupleAction,
} from "@/couple/finance/_actions/couples";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import { PageWrapper } from "./_styled";
import type { CoupleData, Notification } from "./_types";
import NotificationBanner from "./_components/NotificationBanner";
import LoadingSkeleton from "./_components/LoadingSkeleton";
import CreateCoupleForm from "./_components/CreateCoupleForm";
import PartnerInviteCard from "./_components/PartnerInviteCard";
import FullCoupleCard from "./_components/FullCoupleCard";
import DisbandConfirmModal from "./_components/DisbandConfirmModal";
import { NOTIFICATION_TIMINGS } from "@/couple/_constants/animation";

export default function CouplePage() {
  const [couple, setCouple] = useState<CoupleData>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coupleName, setCoupleName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [error, setError] = useState("");
  const [showDisbandConfirm, setShowDisbandConfirm] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newCoupleName, setNewCoupleName] = useState("");

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const inviteSubmitting = useRef(false);

  const [notification, setNotification] = useState<Notification | null>(null);
  const [notifLeaving, setNotifLeaving] = useState(false);
  const notifTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const notify = useCallback((message: string, type: "success" | "error") => {
    if (notifTimer.current) clearTimeout(notifTimer.current);
    setNotifLeaving(false);
    setNotification({ message, type });
    notifTimer.current = setTimeout(() => {
      setNotifLeaving(true);
      setTimeout(() => setNotification(null), NOTIFICATION_TIMINGS.fadeOutMs);
    }, NOTIFICATION_TIMINGS.displayMs);
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
    if (inviteSubmitting.current) return;
    inviteSubmitting.current = true;
    setSaving(true);
    setError("");
    try {
      const res = await sendInvite({ email: inviteEmail.trim() });
      if (res.success) {
        if (res.inviteLink) {
          await navigator.clipboard.writeText(res.inviteLink);
          notify("Invite created! Link copied to clipboard.", "success");
        } else {
          notify("Invite created!", "success");
        }
        setInviteEmail("");
        await fetchCouple();
      } else {
        setError(res.error);
        notify(res.error, "error");
      }
    } finally {
      setSaving(false);
      inviteSubmitting.current = false;
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    setCancellingId(inviteId);
    const res = await revokeInvite(inviteId);
    if (res.success) {
      notify("Invite cancelled", "success");
      await fetchCouple();
    } else {
      notify(res.error, "error");
    }
    setCancellingId(null);
  };

  const handleStartRename = () => {
    setIsRenaming(true);
    setNewCoupleName(couple?.name || "");
  };

  const handleCancelRename = () => {
    setIsRenaming(false);
    setNewCoupleName("");
  };

  const handleRename = async () => {
    setSaving(true);
    const res = await renameCoupleAction(newCoupleName.trim());
    if (res.success) {
      notify("Group renamed!", "success");
      setIsRenaming(false);
      await fetchCouple();
    } else {
      notify(res.error, "error");
    }
    setSaving(false);
  };

  const handleDisband = async () => {
    setSaving(true);
    const res = await disbandCoupleAction();
    if (res.success) {
      notify("Group disbanded", "success");
      setCouple(null);
      setShowDisbandConfirm(false);
    } else {
      notify(res.error, "error");
    }
    setSaving(false);
  };

  const handleInviteEmailChange = (value: string) => {
    setInviteEmail(value);
    setError("");
  };

  return (
    <>
      <FinanceHeader title="Partner" onRefresh={fetchCouple} />

      {notification && (
        <NotificationBanner
          notification={notification}
          leaving={notifLeaving}
        />
      )}

      <PageWrapper>
        {loading ? (
          <LoadingSkeleton />
        ) : !couple ? (
          <CreateCoupleForm
            coupleName={coupleName}
            onCoupleNameChange={setCoupleName}
            saving={saving}
            error={error}
            onCreate={handleCreateCouple}
          />
        ) : couple.members.length < 2 ? (
          <PartnerInviteCard
            title={couple.name || "Your Couple"}
            isRenaming={isRenaming}
            newCoupleName={newCoupleName}
            onNewCoupleNameChange={setNewCoupleName}
            onStartRename={handleStartRename}
            onSubmitRename={handleRename}
            onCancelRename={handleCancelRename}
            saving={saving}
            members={couple.members}
            inviteEmail={inviteEmail}
            onInviteEmailChange={handleInviteEmailChange}
            onSendInvite={handleSendInvite}
            error={error}
            invites={couple.invites}
            cancellingId={cancellingId}
            onCancelInvite={handleCancelInvite}
            notify={notify}
            onShowDisband={() => setShowDisbandConfirm(true)}
          />
        ) : (
          <FullCoupleCard
            title={`${couple.name || "Your Couple"} 💑`}
            isRenaming={isRenaming}
            newCoupleName={newCoupleName}
            onNewCoupleNameChange={setNewCoupleName}
            onStartRename={handleStartRename}
            onSubmitRename={handleRename}
            onCancelRename={handleCancelRename}
            saving={saving}
            members={couple.members}
            onShowDisband={() => setShowDisbandConfirm(true)}
          />
        )}
      </PageWrapper>

      <DisbandConfirmModal
        isOpen={showDisbandConfirm}
        saving={saving}
        onClose={() => setShowDisbandConfirm(false)}
        onConfirm={handleDisband}
      />
    </>
  );
}
