"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import {
  getInviteByToken,
  acceptInviteByToken,
} from "@/couple/finance/_actions/couples";

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
`;

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #f8fafc;
  padding: 20px;
`;

const Card = styled.div`
  max-width: 440px;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 40px 32px;
  text-align: center;
`;

const Icon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

const Title = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px;
`;

const Description = styled.p`
  font-size: 14px;
  color: #52525b;
  line-height: 1.6;
  margin: 0 0 28px;
`;

const PrimaryButton = styled.button`
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 10px;
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: #2563eb;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  font-size: 14px;
  color: #dc2626;
  margin: 16px 0 0;
`;

const SkeletonLine = styled.div<{ $width?: string }>`
  width: ${(p) => p.$width ?? "100%"};
  height: 16px;
  border-radius: 8px;
  background: #e5e7eb;
  margin: 8px auto;
  animation: ${pulse} 1.5s ease-in-out infinite;
`;

type InviteData = {
  id: string;
  email: string;
  status: string;
  couple: {
    name: string | null;
    members: { user: { name: string | null } }[];
  };
};

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [invite, setInvite] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");
  const [accepted, setAccepted] = useState(false);

  const fetchInvite = useCallback(async () => {
    const res = await getInviteByToken(token);
    if (res.success) {
      setInvite(res.data as InviteData);
    } else {
      setError(res.error);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchInvite();
  }, [fetchInvite]);

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    const res = await acceptInviteByToken(token);
    if (res.success) {
      setAccepted(true);
      setTimeout(() => router.push("/couple/details"), 1500);
    } else {
      setError(res.error);
    }
    setAccepting(false);
  };

  if (loading) {
    return (
      <Wrapper>
        <Card>
          <SkeletonLine $width="30%" />
          <SkeletonLine $width="60%" />
          <SkeletonLine $width="45%" />
        </Card>
      </Wrapper>
    );
  }

  if (accepted) {
    return (
      <Wrapper>
        <Card>
          <Icon>🎉</Icon>
          <Title>You&apos;re In!</Title>
          <Description>
            Welcome to the couple. Redirecting to your dashboard…
          </Description>
        </Card>
      </Wrapper>
    );
  }

  if (error && !invite) {
    return (
      <Wrapper>
        <Card>
          <Icon>😔</Icon>
          <Title>Invalid Invite</Title>
          <Description>{error}</Description>
          <PrimaryButton onClick={() => router.push("/couple/finance")}>
            Go to Dashboard
          </PrimaryButton>
        </Card>
      </Wrapper>
    );
  }

  if (invite && invite.status !== "PENDING") {
    return (
      <Wrapper>
        <Card>
          <Icon>📋</Icon>
          <Title>Invite {invite.status.toLowerCase()}</Title>
          <Description>
            This invite is no longer available.
          </Description>
          <PrimaryButton onClick={() => router.push("/couple/finance")}>
            Go to Dashboard
          </PrimaryButton>
        </Card>
      </Wrapper>
    );
  }

  const inviterName =
    invite?.couple.members[0]?.user?.name || "Your partner";
  const coupleName = invite?.couple.name;

  return (
    <Wrapper>
      <Card>
        <Icon>💑</Icon>
        <Title>Couple Invite</Title>
        <Description>
          <strong>{inviterName}</strong> invited you to join
          {coupleName ? ` "${coupleName}"` : " their couple"} on LuvVerse.
        </Description>
        <PrimaryButton disabled={accepting} onClick={handleAccept}>
          {accepting ? "Accepting…" : "Accept Invite"}
        </PrimaryButton>
        {error && <ErrorText>{error}</ErrorText>}
      </Card>
    </Wrapper>
  );
}
