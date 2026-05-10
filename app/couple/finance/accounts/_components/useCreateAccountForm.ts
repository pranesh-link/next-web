"use client";

import { useState } from "react";

/**
 * Hold all controlled-input state for the create-account modal.
 *
 * Centralizes the form fields and their setters so the accounts page can pass
 * them straight to {@link CreateAccountModal} without managing each piece of
 * state inline.
 *
 * @returns Bag with field values, setters, error string, error setter, and a
 *   `reset` helper that restores defaults.
 */
export function useCreateAccountForm() {
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newType, setNewType] = useState("SAVINGS_ACCOUNT");
  const [newBalance, setNewBalance] = useState("");
  const [newIsSalary, setNewIsSalary] = useState(false);
  const [newIsEmergency, setNewIsEmergency] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState("");
  const [createError, setCreateError] = useState("");

  function reset(currentUserId: string) {
    setNewName("");
    setNewNickname("");
    setNewType("SAVINGS_ACCOUNT");
    setNewBalance("");
    setNewIsSalary(false);
    setNewIsEmergency(false);
    setNewOwnerId(currentUserId);
    setCreateError("");
  }

  return {
    newName,
    setNewName,
    newNickname,
    setNewNickname,
    newType,
    setNewType,
    newBalance,
    setNewBalance,
    newIsSalary,
    setNewIsSalary,
    newIsEmergency,
    setNewIsEmergency,
    newOwnerId,
    setNewOwnerId,
    createError,
    setCreateError,
    reset,
  };
}
