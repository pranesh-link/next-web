import { getCouple } from "@/couple/finance/_actions/couples";

export type CoupleData = Extract<
  Awaited<ReturnType<typeof getCouple>>,
  { success: true }
>["data"];

export type NonNullCouple = NonNullable<CoupleData>;
export type CoupleMember = NonNullCouple["members"][number];
export type CoupleInvite = NonNullCouple["invites"][number];

export type Notification = {
  message: string;
  type: "success" | "error";
};

export type Notify = (message: string, type: "success" | "error") => void;
