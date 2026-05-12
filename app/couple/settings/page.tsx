"use client";

import { useState, useEffect, useCallback } from "react";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import {
  PageWrapper,
  Section,
  SectionTitle,
  FormGroup,
  Label,
  Input,
  Select,
  SaveButton,
  ToggleRow,
  ToggleLabel,
  Toggle,
  ToggleKnob,
  ErrorBanner,
  SuccessBanner,
} from "./_styled";
import {
  getUserSettings,
  updateUserSettings,
  getNotificationPreferences,
  type NotificationPreferences,
} from "./_actions/settings";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AED"] as const;

/**
 * User settings page with profile configuration and notification toggles.
 *
 * @returns The settings page component.
 */
export default function SettingsPage() {
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({
    budgetAlerts: true,
    sipReminders: true,
    depositReminders: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [monthlyIncome, setMonthlyIncome] = useState("");

  useEffect(() => {
    Promise.all([getUserSettings(), getNotificationPreferences()]).then(
      ([settingsRes, prefsRes]) => {
        if (settingsRes.success) {
          const d = settingsRes.data;
          setName(d.name ?? "");
          setCurrency(d.currency ?? "INR");
          setMonthlyIncome(d.monthlyIncome != null ? String(d.monthlyIncome) : "");
        }
        if (prefsRes.success) {
          setNotifPrefs(prefsRes.data);
        }
      }
    );
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    const income = monthlyIncome ? parseFloat(monthlyIncome) : undefined;
    const res = await updateUserSettings({
      name: name || undefined,
      currency,
      monthlyIncome: income,
    });

    setSaving(false);
    if (res.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(res.error);
    }
  }, [name, currency, monthlyIncome]);

  const handleRefresh = useCallback(async () => {
    const res = await getUserSettings();
    if (res.success) {
      const d = res.data;
      setName(d.name ?? "");
      setCurrency(d.currency ?? "INR");
      setMonthlyIncome(d.monthlyIncome != null ? String(d.monthlyIncome) : "");
    }
  }, []);

  return (
    <>
      <FinanceHeader title="Settings" onRefresh={handleRefresh} />
      <PageWrapper>
        {error && <ErrorBanner>{error}</ErrorBanner>}
        {success && <SuccessBanner>Settings saved successfully.</SuccessBanner>}

        <Section>
          <SectionTitle>Profile Settings</SectionTitle>

          <FormGroup>
            <Label htmlFor="settings-name">Display Name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="settings-currency">Currency</Label>
            <Select
              id="settings-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </FormGroup>

          <FormGroup>
            <Label htmlFor="settings-income">Monthly Income</Label>
            <Input
              id="settings-income"
              type="number"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="0"
              min="0"
            />
          </FormGroup>

          <SaveButton onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </SaveButton>
        </Section>

        <Section>
          <SectionTitle>Notifications</SectionTitle>

          <ToggleRow>
            <ToggleLabel>Budget Alerts</ToggleLabel>
            <Toggle
              $active={notifPrefs.budgetAlerts}
              onClick={() =>
                setNotifPrefs((p) => ({ ...p, budgetAlerts: !p.budgetAlerts }))
              }
            >
              <ToggleKnob $active={notifPrefs.budgetAlerts} />
            </Toggle>
          </ToggleRow>

          <ToggleRow>
            <ToggleLabel>SIP Reminders</ToggleLabel>
            <Toggle
              $active={notifPrefs.sipReminders}
              onClick={() =>
                setNotifPrefs((p) => ({ ...p, sipReminders: !p.sipReminders }))
              }
            >
              <ToggleKnob $active={notifPrefs.sipReminders} />
            </Toggle>
          </ToggleRow>

          <ToggleRow>
            <ToggleLabel>Deposit Reminders</ToggleLabel>
            <Toggle
              $active={notifPrefs.depositReminders}
              onClick={() =>
                setNotifPrefs((p) => ({
                  ...p,
                  depositReminders: !p.depositReminders,
                }))
              }
            >
              <ToggleKnob $active={notifPrefs.depositReminders} />
            </Toggle>
          </ToggleRow>
        </Section>
      </PageWrapper>
    </>
  );
}
