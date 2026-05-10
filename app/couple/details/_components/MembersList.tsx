"use client";

import {
  SectionTitle,
  MemberCard,
  Avatar,
  MemberInfo,
  MemberName,
  MemberEmail,
  RoleBadge,
} from "../_styled";
import type { CoupleMember } from "../_types";

type Props = {
  members: CoupleMember[];
};

export default function MembersList({ members }: Props) {
  return (
    <>
      <SectionTitle>Members</SectionTitle>
      {members.map((member) => (
        <MemberCard key={member.userId}>
          <Avatar>{member.user.name?.[0]?.toUpperCase() || "?"}</Avatar>
          <MemberInfo>
            <MemberName>{member.user.name || "Unknown"}</MemberName>
            <MemberEmail>{member.user.email}</MemberEmail>
          </MemberInfo>
          <RoleBadge $role={member.role}>
            {member.role === "OWNER" ? "Group Creator" : "Partner"}
          </RoleBadge>
        </MemberCard>
      ))}
    </>
  );
}
