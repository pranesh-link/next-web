"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import { getTrip } from "@/couple/travel/_actions/trips";
import type {
  TripWithRelations,
  TripStatus,
  StatusColor,
} from "../_types";
import ItineraryTab from "./_components/ItineraryTab";
import ExpensesTab from "./_components/ExpensesTab";
import PackingTab from "./_components/PackingTab";
import {
  DetailWrapper,
  TripInfoSection,
  TripInfoHeader,
  TripDates,
  TripMeta,
  StatusBadge,
  TabBar,
  TabBtn,
  TabContent,
  EmptyHint,
} from "./_styled";

const TABS = ["Itinerary", "Expenses", "Packing List"] as const;
type TabName = (typeof TABS)[number];

/** Maps TripStatus to a badge color key. */
const STATUS_COLORS: Record<TripStatus, StatusColor> = {
  PLANNING: "blue",
  CONFIRMED: "green",
  IN_PROGRESS: "amber",
  COMPLETED: "gray",
  CANCELLED: "red",
};

/** Short human-readable date. */
function fmtDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Trip detail page with Itinerary, Expenses, and Packing List tabs. */
export default function TripDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [trip, setTrip] = useState<TripWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabName>("Itinerary");

  const fetchTrip = useCallback(async () => {
    const result = await getTrip(id);
    if (result.success) {
      setTrip(result.data as unknown as TripWithRelations);
      setError(null);
    } else {
      setError(result.error);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      await fetchTrip();
      setLoading(false);
    }
    load();
  }, [fetchTrip]);

  if (loading) {
    return (
      <DetailWrapper>
        <EmptyHint>Loading trip...</EmptyHint>
      </DetailWrapper>
    );
  }

  if (!trip) {
    return (
      <DetailWrapper>
        <EmptyHint>{error ?? "Trip not found."}</EmptyHint>
      </DetailWrapper>
    );
  }

  return (
    <DetailWrapper>
      <FinanceHeader title={trip.name} onRefresh={fetchTrip} />

      <TripInfoSection>
        <TripInfoHeader>
          <div>
            <h2>{trip.destination}</h2>
            <TripDates>
              {fmtDate(trip.startDate)} → {fmtDate(trip.endDate)}
            </TripDates>
          </div>
          <TripMeta>
            <StatusBadge $color={STATUS_COLORS[trip.status]}>
              {trip.status.replace("_", " ")}
            </StatusBadge>
            {trip.budget != null && (
              <span>Budget: ₹{trip.budget.toLocaleString()}</span>
            )}
          </TripMeta>
        </TripInfoHeader>
      </TripInfoSection>

      <TabBar>
        {TABS.map((tab) => (
          <TabBtn
            key={tab}
            $active={activeTab === tab}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </TabBtn>
        ))}
      </TabBar>

      <TabContent>
        {activeTab === "Itinerary" && (
          <ItineraryTab
            tripId={id}
            items={trip.itineraryItems}
            onRefresh={fetchTrip}
          />
        )}
        {activeTab === "Expenses" && (
          <ExpensesTab
            tripId={id}
            expenses={trip.expenses}
            budget={trip.budget}
            onRefresh={fetchTrip}
          />
        )}
        {activeTab === "Packing List" && (
          <PackingTab
            tripId={id}
            items={trip.checklistItems}
            onRefresh={fetchTrip}
          />
        )}
      </TabContent>
    </DetailWrapper>
  );
}
