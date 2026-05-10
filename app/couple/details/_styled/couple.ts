"use client";

import styled from "styled-components";

export const CoupleCard = styled.div`
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 32px;
  box-sizing: border-box;

  @media (max-width: 480px) {
    padding: 20px 16px;
  }
`;

export const Divider = styled.div`
  height: 1px;
  background: #e5e7eb;
  margin: 24px 0;
`;

export const SectionTitle = styled.h3`
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: #94a3b8;
  margin: 0 0 16px 0;
`;

export const MemberCard = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  border-radius: 12px;

  & + & {
    margin-top: 10px;
  }

  @media (max-width: 480px) {
    padding: 10px 12px;
  }
`;

export const Avatar = styled.div`
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

export const MemberInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

export const MemberName = styled.p`
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
`;

export const MemberEmail = styled.p`
  font-size: 12px;
  color: #94a3b8;
  margin: 2px 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const RoleBadge = styled.span<{ $role: string }>`
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

export const LeaveSection = styled.div`
  margin-top: 24px;
  text-align: center;
`;
