"use client";

import styled from "styled-components";

export const InviteForm = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-end;

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

export const InviteInputGroup = styled.div`
  flex: 1;
`;

export const InviteRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 14px;
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: 10px;
  font-size: 13px;

  & + & {
    margin-top: 8px;
  }
`;

export const InviteEmail = styled.span`
  color: #1e293b;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
`;

export const InviteStatus = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: #d97706;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const ConfirmText = styled.p`
  font-size: 14px;
  color: #52525b;
  line-height: 1.6;
  margin: 0 0 24px 0;
`;

export const ButtonRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;
