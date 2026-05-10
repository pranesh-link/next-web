"use client";

import { NoAccountsAction, NoAccountsBanner as Banner } from "../_styled";

type Props = {
  onCreate: () => void;
};

export default function NoAccountsBanner({ onCreate }: Props) {
  return (
    <Banner>
      <strong>No accounts yet</strong>
      You need at least one account before adding transactions.
      <br />
      <NoAccountsAction type="button" onClick={onCreate}>
        + Create Your First Account
      </NoAccountsAction>
    </Banner>
  );
}
