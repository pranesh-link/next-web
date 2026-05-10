"use client";

import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import LastUpdatedBadge from "@/couple/_components/shared/LastUpdatedBadge";
import type { BodyMetricRow } from "@/_services/lifestyle/body-metric-service";
import { BMI_BANDS } from "./_constants";
import {
  CardStack,
  FullSection,
  Grid2Col,
  PageWrapper,
  Row,
  Subtle,
} from "./_styled";
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

  /** ISO date strings of existing entries for duplicate detection. */
  const existingDates = page.metrics.map((m) => {
    const d = new Date(m.measuredOn);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const scrollToForm = () => {
    document.getElementById("wellness-log-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToHistory = () => {
    document.getElementById("wellness-history")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDuplicate = () => {
    page.showNotification({
      type: "error",
      message: "An entry for this date already exists. Edit it from the History section below.",
    });
    setTimeout(() => scrollToHistory(), 150);
  };

  const lastMetric = page.metrics[0] ?? null;

  return (
    <>
      <FinanceHeader title="Wellness Tracker" onRefresh={page.refresh} />
      <PageWrapper>
        {subtitle && <Subtle>{subtitle}</Subtle>}

        {page.notification && (
          <Subtle
            role="status"
            aria-live="polite"
            onClick={page.clearNotification}
          >
            {page.notification.type === "error" ? "⚠ " : "✓ "}
            {page.notification.message}
          </Subtle>
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

        {lastMetric && (
          <LastUpdatedBadge
            userId={lastMetric.userId}
            currentUserId={page.currentUserId}
            name={selectedSubject?.name}
            updatedAt={lastMetric.updatedAt}
          />
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
              <LogEntryForm
                defaults={formDefaults}
                onSubmit={page.saveMetric}
                saving={page.saving}
              />
            </FullSection>
          </>
        ) : (
          <>
            <Grid2Col>
              <CardStack>
                <CurrentBMICard
                  bmi={latest.currentBmi}
                  band={latest.currentBand}
                  deltaWeek={page.trend.deltaWeek}
                  suggestions={page.suggestions}
                />
                <BMIGauge bmi={latest.currentBmi} bands={BMI_BANDS} />
              </CardStack>
              <CardStack id="wellness-log-form">
                <LogEntryForm
                  defaults={formDefaults}
                  onSubmit={page.saveMetric}
                  saving={page.saving}
                  existingDates={existingDates}
                  onDuplicate={handleDuplicate}
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
              </CardStack>
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
              <MetricsTable
                metrics={page.metrics}
                onDelete={page.removeMetric}
                onEdit={page.editMetricWeight}
                loading={page.loading}
              />
            </FullSection>
          </>
        )}
      </PageWrapper>
    </>
  );
}
