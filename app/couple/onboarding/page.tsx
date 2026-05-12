"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getCouple } from "@/couple/finance/_actions/couples";
import { updateUserSettings } from "@/couple/settings/_actions/settings";
import {
  Wrapper,
  Card,
  StepBar,
  StepDot,
  BigIcon,
  Title,
  Description,
  FormGroup,
  Label,
  Input,
  Select,
  ButtonRow,
  PrimaryButton,
  SkipButton,
  ErrorText,
} from "./_styled";

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "SGD", "AED"] as const;
const ONBOARDING_KEY = "coupletastic_onboarded";
const TOTAL_STEPS = 3;

/**
 * Multi-step onboarding wizard for new couple members.
 *
 * Guides the user through: welcome → currency & income setup → completion.
 * Stores completion state in localStorage under `coupletastic_onboarded`.
 *
 * @returns The onboarding wizard page.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [step, setStep] = useState(1);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCouple().then((res) => {
      if (!res.success || !res.data) return;
      const currentId = session?.user?.id;
      const partner = res.data.members.find((m) => m.user.id !== currentId);
      setPartnerName(partner?.user.name ?? null);
    });
  }, [session?.user?.id]);

  const completeOnboarding = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(ONBOARDING_KEY, "1");
    }
    router.replace("/couple");
  }, [router]);

  const handleSkip = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  const handleStep2Next = useCallback(async () => {
    setSaving(true);
    setError(null);
    const income = monthlyIncome ? parseFloat(monthlyIncome) : undefined;
    const res = await updateUserSettings({ currency, monthlyIncome: income });
    setSaving(false);
    if (res.success) {
      setStep(3);
    } else {
      setError(res.error);
    }
  }, [currency, monthlyIncome]);

  return (
    <Wrapper>
      <Card>
        <StepBar>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <StepDot key={i} $active={i + 1 === step} $done={i + 1 < step} />
          ))}
        </StepBar>

        {step === 1 && (
          <>
            <BigIcon>🎉</BigIcon>
            <Title>
              {partnerName
                ? `You're now connected with ${partnerName}!`
                : "You're now connected!"}
            </Title>
            <Description>
              Let&apos;s set up your shared finance space so you can start
              tracking budgets, goals, and expenses together.
            </Description>
            <ButtonRow>
              <SkipButton onClick={handleSkip}>Skip</SkipButton>
              <PrimaryButton onClick={() => setStep(2)}>
                Get Started
              </PrimaryButton>
            </ButtonRow>
          </>
        )}

        {step === 2 && (
          <>
            <BigIcon>💰</BigIcon>
            <Title>Currency &amp; Income</Title>
            <Description>
              Set your preferred currency and monthly income so we can
              personalise your financial insights.
            </Description>

            <FormGroup>
              <Label htmlFor="ob-currency">Currency</Label>
              <Select
                id="ob-currency"
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
              <Label htmlFor="ob-income">Monthly Income</Label>
              <Input
                id="ob-income"
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder="0"
                min="0"
              />
            </FormGroup>

            {error && <ErrorText>{error}</ErrorText>}

            <ButtonRow>
              <SkipButton onClick={handleSkip}>Skip</SkipButton>
              <PrimaryButton onClick={handleStep2Next} disabled={saving}>
                {saving ? "Saving…" : "Next"}
              </PrimaryButton>
            </ButtonRow>
          </>
        )}

        {step === 3 && (
          <>
            <BigIcon>✅</BigIcon>
            <Title>You&apos;re all set!</Title>
            <Description>
              Start tracking your finances together — budgets, goals, loans, and
              more in one shared space.
            </Description>
            <ButtonRow>
              <PrimaryButton
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem(ONBOARDING_KEY, "1");
                  }
                  router.replace("/couple/finance");
                }}
              >
                Go to Finance Dashboard
              </PrimaryButton>
            </ButtonRow>
          </>
        )}
      </Card>
    </Wrapper>
  );
}
