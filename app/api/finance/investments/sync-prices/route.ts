import { NextRequest, NextResponse } from "next/server";
import prisma from "@/_lib/prisma";

const EXCHANGE_SUFFIX: Record<string, string> = {
  NSE: ".NS",
  BSE: ".BO",
};

/**
 * Fetch the latest close price for a stock ticker from Yahoo Finance.
 *
 * @param ticker - The stock symbol (e.g. "RELIANCE").
 * @param exchange - The exchange ("NSE" or "BSE").
 * @returns The latest close price, or null if the fetch fails.
 */
async function fetchStockPrice(
  ticker: string,
  exchange: string
): Promise<number | null> {
  try {
    const suffix = EXCHANGE_SUFFIX[exchange] ?? ".NS";
    const symbol = encodeURIComponent(`${ticker}${suffix}`);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const closes: number[] | undefined =
      json?.chart?.result?.[0]?.indicators?.quote?.[0]?.close;
    const price = closes?.filter(Boolean).at(-1);
    return typeof price === "number" ? price : null;
  } catch {
    return null;
  }
}

/**
 * Fetch the latest NAV for a mutual fund scheme from MFAPI.
 *
 * @param schemeCode - The AMFI scheme code stored in the `ticker` field.
 * @returns The latest NAV as a number, or null if the fetch fails.
 */
async function fetchMutualFundNav(schemeCode: string): Promise<number | null> {
  try {
    const url = `https://api.mfapi.in/mf/${encodeURIComponent(schemeCode)}/latest`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    if (!res.ok) return null;
    const json = await res.json();
    const nav = json?.data?.[0]?.nav;
    return nav !== undefined ? parseFloat(nav) : null;
  } catch {
    return null;
  }
}

/**
 * GET /api/finance/investments/sync-prices
 *
 * Cron-protected route that refreshes currentPrice and currentValue
 * for all STOCK and MUTUAL_FUND InvestmentHolding records.
 *
 * @remarks Auth: CRON_SECRET header must match `process.env.CRON_SECRET`.
 * @returns JSON with the count of updated records.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization") ?? "";
  const secret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const holdings = await prisma.investmentHolding.findMany({
    where: { assetType: { in: ["STOCK", "MUTUAL_FUND"] } },
  });

  let updated = 0;

  for (const holding of holdings) {
    try {
      if (holding.assetType === "STOCK") {
        if (!holding.ticker || !holding.exchange) continue;
        const price = await fetchStockPrice(holding.ticker, holding.exchange);
        if (price === null) continue;
        const currentValue =
          holding.quantity != null ? holding.quantity * price : holding.currentValue;
        await prisma.investmentHolding.update({
          where: { id: holding.id },
          data: { currentPrice: price, currentValue: currentValue ?? undefined },
        });
        updated++;
      } else if (holding.assetType === "MUTUAL_FUND") {
        if (!holding.ticker) continue;
        const nav = await fetchMutualFundNav(holding.ticker);
        if (nav === null) continue;
        const currentValue =
          holding.quantity != null ? holding.quantity * nav : holding.currentValue;
        await prisma.investmentHolding.update({
          where: { id: holding.id },
          data: { currentPrice: nav, currentValue: currentValue ?? undefined },
        });
        updated++;
      }
    } catch {
      // Skip individual record failures — continue with the rest
    }
  }

  return NextResponse.json({ updated });
}
