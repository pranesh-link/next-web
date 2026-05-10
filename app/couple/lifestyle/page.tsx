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
 * Renders a tile grid for the lifestyle sub-modules. Currently surfaces a
 * single "Wellness Tracker" tile linking to {@link /couple/lifestyle/wellness}.
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
            <TileDescription>BMI, weight & smart suggestions</TileDescription>
          </Tile>
        </TileGrid>
      </PageWrapper>
    </>
  );
}

/**
 * Heart-pulse glyph used for the Wellness Tracker tile.
 *
 * @returns Inline SVG sized via the parent `Tile` rule.
 */
function HeartPulseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      <polyline points="3.5 12 8 12 10 9 14 15 16 12 20.5 12" />
    </svg>
  );
}
