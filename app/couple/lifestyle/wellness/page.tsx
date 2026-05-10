"use client";

import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";
import { BMI_BANDS } from "./_constants";
import {
  Card,
  FullSection,
  Grid2Col,
  PageWrapper,
  Row,
  SectionTitle,
  Subtle,
} from "./_styled";
import { useBmiCalculator } from "./_hooks/use-bmi-calculator";
import { useWellnessPage } from "./_hooks/use-wellness-page";
import SubjectSwitcher from "./_components/SubjectSwitcher";
import LogEntryForm from "./_components/LogEntryForm";
import CurrentBMICard from "./_components/CurrentBMICard";
import BMIGauge from "./_components/BMIGauge";
import IdealWeightCard from "./_components/IdealWeightCard";
import BMIRangeLegend from "./_components/BMIRangeLegend";
import WeightTrendChart from "./_components/WeightTrendChart";
import BMITrendChart from "./_components/BMITrendChart";
import MetricsTable from "./_components/MetricsTable";
import SuggestionsPanel from "./_components/SuggestionsPanel";
import EmptyState from "./_components/EmptyState";
import LoadingSkeleton from "@/couple/_components/shared/LoadingSkeleton";

/** Coerce an unknown Decimal/number to a finite JS number (0 fallback). */
function toNum(value: unknown): number {
  if (value == null) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/** Derived values for the latest metric pulled from a subject's history. */
interface LatestSnapshot {
  currentWeight: number;
  currentHeight: number;
  currentBmi: number;
  currentBand: (typeof BMI_BANDS)[number] | null;
  healthyMinKg: number;
  healthyMaxKg: number;
}

const HEALTHY_BAND = BMI_BANDS.find((b) => b.key === "healthy")!;

/**
 * Compute the latest-metric snapshot used by the right-hand cards.
 *
 * @param metrics - Metric history (newest first).
 * @param defaultHeightInCm - Profile default to fall back on.
 * @returns Numeric values + matching band + healthy weight bounds.
 */
function deriveLatest(
  metrics: BodyMetricRow[],
  defaultHeightInCm: unknown,
): LatestSnapshot {
  const latest = metrics[0];
  const currentWeight = latest ? toNum(latest.weightInKg) : 0;
  const currentHeight = latest
    ? toNum(latest.heightInCm)
    : toNum(defaultHeightInCm);
  const currentBmi = latest ? toNum(latest.bmi) : 0;
  const currentBand = latest
    ? (BMI_BANDS.find((b) => b.key === latest.bmiCategory) ?? null)
    : null;
  const heightMeters = currentHeight / 100;
  const healthyMinKg = heightMeters > 0 ? HEALTHY_BAND.min * heightMeters * heightMeters : 0;
  const healthyMaxKg = heightMeters > 0 ? HEALTHY_BAND.max * heightMeters * heightMeters : 0;
  return {
    currentWeight,
    currentHeight,
    currentBmi,
    currentBand,
    healthyMinKg: Math.round(healthyMinKg * 10) / 10,
    healthyMaxKg: Math.round(healthyMaxKg * 10) / 10,
  };
}

/**
 * Wellness Tracker page shell.
 *
 * Wires the {@link useWellnessPage} data hook and the
 * {@link useBmiCalculator} form-state hook into the leaf components
 * defined in `./_components/*`.
 *
 * @returns The wellness tracker UI for the selected subject.
 */
export default function WellnessPage() {
  const page = useWellnessPage();
  const calc = useBmiCalculator();

  const selectedSubject =
    page.subjects.find((s) => s.id === page.selectedSubjectId) ?? null;
  const subtitle = selectedSubject
    ? `${selectedSubject.name ?? "You"}${selectedSubject.isSelf ? " (You)" : ""}`
    : "";

  const latest = deriveLatest(page.metrics, page.profile?.defaultHeightInCm);

  const formDefaults = {
    heightInCm: latest.currentHeight,
    weightInKg: latest.currentWeight,
  };

  const scrollToForm = () => {
    if (typeof document === "undefined") return;
    document.getElementById("wellness-log-form")?.scrollIntoView({ behavior: "smooth" });
  };

  // The calculator state is exposed for future inline previews/forms.
  void calc;

  return (
    <>
      <FinanceHeader title="Wellness Tracker" onRefresh={page.refresh} />
      <PageWrapper>
        {subtitle && <Subtle>{subtitle}</Subtle>}

        {page.notification && (
          <Card
            role="status"
            onClick={page.clearNotification}
            aria-live="polite"
          >
            <SectionTitle>
              {page.notification.type === "success" ? "Success" : "Error"}
            </SectionTitle>
            <Subtle>{page.notification.message}</Subtle>
          </Card>
        )}

        {page.subjects.length > 1 && (
          <Row>
            <SubjectSwitcher
              subjects={page.subjects}
              selectedId={page.selectedSubjectId}
              onSelect={page.selectSubject}
            />
          </Row>
        )}

        {page.loading ? (
          <FullSection>
            <LoadingSkeleton type="card" count={2} />
          </FullSection>
        ) : page.metrics.length === 0 ? (
          <>
            <FullSection>
              <EmptyState onLog={scrollToForm} />
            </FullSection>
            <FullSection>
              <Card id="wellness-log-form">
                <LogEntryForm
                  defaults={formDefaults}
                  onSubmit={page.saveMetric}
                  saving={page.saving}
                />
              </Card>
            </FullSection>
          </>
        ) : (
          <>
            <Grid2Col>
              <Card>
                <CurrentBMICard
                  bmi={latest.currentBmi}
                  band={latest.currentBand}
                  deltaWeek={page.trend.deltaWeek}
                />
                <BMIGauge bmi={latest.currentBmi} bands={BMI_BANDS} />
              </Card>
              <Card id="wellness-log-form">
                <LogEntryForm
                  defaults={formDefaults}
                  onSubmit={page.saveMetric}
                  saving={page.saving}
                />
                <IdealWeightCard
                  currentWeight={latest.currentWeight}
                  target={
                    page.profile?.targetWeightInKg != null
                      ? toNum(page.profile.targetWeightInKg)
                      : null
                  }
                  healthyMinKg={latest.healthyMinKg}
                  healthyMaxKg={latest.healthyMaxKg}
                />
              </Card>
            </Grid2Col>

            <FullSection>
              <BMIRangeLegend
                bands={BMI_BANDS}
                currentKey={latest.currentBand?.key ?? null}
              />
            </FullSection>

            <FullSection>
              <WeightTrendChart metrics={page.metrics} />
            </FullSection>

            <FullSection>
              <BMITrendChart metrics={page.metrics} bands={BMI_BANDS} />
            </FullSection>

            <FullSection>
              <SuggestionsPanel suggestions={page.suggestions} />
            </FullSection>

            <FullSection>
              <MetricsTable
                metrics={page.metrics}
                onDelete={page.removeMetric}
                loading={page.loading}
              />
            </FullSection>
          </>
        )}
      </PageWrapper>
    </>
  );
}
