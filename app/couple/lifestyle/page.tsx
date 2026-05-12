import FinanceHeader from "@/couple/_components/layout/FinanceHeader";
import {
  PageWrapper,
  Tile,
  TileDescription,
  TileGrid,
  TileTitle,
} from "./_styled";

/**
 * Lifestyle module landing page.
 *
 * Renders a tile grid for the lifestyle sub-modules: Wellness, Nutrition,
 * Exercise, Sleep, and Habits.
 *
 * @returns Server-rendered dashboard for `/couple/lifestyle`.
 * @remarks Auth: inherited from the parent `/couple` layout.
 */
export default function LifestylePage() {
  return (
    <>
      <FinanceHeader title="Lifestyle" />
      <PageWrapper>
        <TileGrid>
          <Tile href="/couple/lifestyle/wellness" aria-label="Open Wellness Tracker">
            <HeartPulseIcon />
            <TileTitle>Wellness Tracker</TileTitle>
            <TileDescription>BMI, weight &amp; smart suggestions</TileDescription>
          </Tile>
          <Tile href="/couple/lifestyle/nutrition" aria-label="Open Nutrition Tracker">
            <NutritionIcon />
            <TileTitle>Nutrition</TileTitle>
            <TileDescription>Log meals and track macros daily</TileDescription>
          </Tile>
          <Tile href="/couple/lifestyle/exercise" aria-label="Open Exercise Tracker">
            <ExerciseIcon />
            <TileTitle>Exercise</TileTitle>
            <TileDescription>Log workouts and weekly activity</TileDescription>
          </Tile>
          <Tile href="/couple/lifestyle/sleep" aria-label="Open Sleep Tracker">
            <SleepIcon />
            <TileTitle>Sleep</TileTitle>
            <TileDescription>Track sleep duration and quality</TileDescription>
          </Tile>
          <Tile href="/couple/lifestyle/habits" aria-label="Open Habits Tracker">
            <HabitsIcon />
            <TileTitle>Habits</TileTitle>
            <TileDescription>Build daily habits together</TileDescription>
          </Tile>
        </TileGrid>
      </PageWrapper>
    </>
  );
}

/** Heart-pulse glyph for the Wellness tile. */
function HeartPulseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <polyline points="3.5 12 8 12 10 9 14 15 16 12 20.5 12" />
    </svg>
  );
}

/** Coffee-cup / utensils glyph for the Nutrition tile. */
function NutritionIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  );
}

/** Activity / waveform glyph for the Exercise tile. */
function ExerciseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

/** Moon glyph for the Sleep tile. */
function SleepIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

/** Check-circle glyph for the Habits tile. */
function HabitsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
