"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import { getTrips, createTrip } from "@/couple/travel/_actions/trips";
import type { Trip, TripStatus, StatusColor } from "./_types";
import {
  PageWrapper,
  TripGrid,
  TripCard,
  CardHeader,
  CardBody,
  CardFooter,
  StatusBadge,
  TripMeta,
  EmptyWrap,
  ErrorText,
  FormOverlay,
  FormBox,
  FormGrid,
  FormSpan,
  FormInput,
  FormTextarea,
  FormActions,
  CancelBtn,
  SubmitBtn,
} from "./_styled";

/** Maps TripStatus to a StatusColor key. */
const STATUS_COLORS: Record<TripStatus, StatusColor> = {
  PLANNING: "blue",
  CONFIRMED: "green",
  IN_PROGRESS: "amber",
  COMPLETED: "gray",
  CANCELLED: "red",
};

/** Human-readable labels for each status. */
const STATUS_LABELS: Record<TripStatus, string> = {
  PLANNING: "Planning",
  CONFIRMED: "Confirmed",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

/** Emoji representing a trip card based on status. */
const STATUS_EMOJI: Record<TripStatus, string> = {
  PLANNING: "🗺️",
  CONFIRMED: "✈️",
  IN_PROGRESS: "🧳",
  COMPLETED: "🎒",
  CANCELLED: "❌",
};

const EMPTY_FORM = {
  name: "",
  destination: "",
  startDate: "",
  endDate: "",
  budget: "",
  notes: "",
};

/** Formats a date to a short readable string. */
function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Travel module trip list page. */
export default function TravelPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  const fetchTrips = useCallback(async () => {
    const result = await getTrips();
    if (result.success) {
      setTrips(result.data as unknown as Trip[]);
      setError(null);
    } else {
      setError(result.error);
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchTrips();
      setLoading(false);
    }
    load();
  }, [fetchTrips]);

  function setField(key: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.destination || !form.startDate || !form.endDate)
      return;
    setSubmitting(true);
    const result = await createTrip({
      name: form.name,
      destination: form.destination,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: form.budget ? Number(form.budget) : undefined,
      notes: form.notes || undefined,
    });
    setSubmitting(false);
    if (result.success) {
      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchTrips();
    } else {
      setError(result.error);
    }
  }

  return (
    <PageWrapper>
      <FinanceHeader
        title="Travel"
        action={{ label: "New Trip", onClick: () => setShowForm(true) }}
        onRefresh={fetchTrips}
      />

      {showForm && (
        <FormOverlay onClick={() => setShowForm(false)}>
          <FormBox onClick={(e) => e.stopPropagation()}>
            <h3>Plan a New Trip</h3>
            <form onSubmit={handleSubmit}>
              <FormGrid>
                <FormInput
                  placeholder="Trip name *"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
                <FormInput
                  placeholder="Destination *"
                  value={form.destination}
                  onChange={(e) => setField("destination", e.target.value)}
                  required
                />
                <FormInput
                  type="date"
                  placeholder="Start date *"
                  value={form.startDate}
                  onChange={(e) => setField("startDate", e.target.value)}
                  required
                />
                <FormInput
                  type="date"
                  placeholder="End date *"
                  value={form.endDate}
                  onChange={(e) => setField("endDate", e.target.value)}
                  required
                />
                <FormInput
                  type="number"
                  placeholder="Budget (optional)"
                  value={form.budget}
                  onChange={(e) => setField("budget", e.target.value)}
                  min={0}
                />
                <FormSpan>
                  <FormTextarea
                    placeholder="Notes (optional)"
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                  />
                </FormSpan>
              </FormGrid>
              <FormActions>
                <CancelBtn type="button" onClick={() => setShowForm(false)}>
                  Cancel
                </CancelBtn>
                <SubmitBtn type="submit" disabled={submitting}>
                  {submitting ? "Creating..." : "Create Trip"}
                </SubmitBtn>
              </FormActions>
            </form>
          </FormBox>
        </FormOverlay>
      )}

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <EmptyWrap>
          <p>🌍</p>
          <p>Loading your trips...</p>
        </EmptyWrap>
      ) : trips.length === 0 ? (
        <EmptyWrap>
          <p>🌍</p>
          <p>No trips planned yet. Start planning your next adventure!</p>
        </EmptyWrap>
      ) : (
        <TripGrid>
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              onClick={() => router.push(`/couple/travel/${trip.id}`)}
            >
              <CardHeader>
                <span>{STATUS_EMOJI[trip.status]}</span>
                <StatusBadge $color={STATUS_COLORS[trip.status]}>
                  {STATUS_LABELS[trip.status]}
                </StatusBadge>
              </CardHeader>
              <CardBody>
                <h3>{trip.name}</h3>
                <p>{trip.destination}</p>
              </CardBody>
              <CardFooter>
                <TripMeta>
                  {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                </TripMeta>
                {trip.budget != null && (
                  <TripMeta>₹{trip.budget.toLocaleString()}</TripMeta>
                )}
              </CardFooter>
            </TripCard>
          ))}
        </TripGrid>
      )}
    </PageWrapper>
  );
}
