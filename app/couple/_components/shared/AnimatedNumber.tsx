'use client';

import { useEffect, useRef, useState } from 'react';

/** Props for the AnimatedNumber component. */
export interface AnimatedNumberProps {
  /** Target numeric value to animate to. */
  value: number;
  /** Animation duration in milliseconds. Defaults to 1000. */
  duration?: number;
  /** Prefix before the number (e.g. '₹'). Defaults to '₹'. */
  prefix?: string;
  /** Suffix after the number (e.g. '%'). */
  suffix?: string;
  /** Number of decimal places. Defaults to 0. */
  decimals?: number;
}

/**
 * Easing function for smooth deceleration (ease-out cubic).
 */
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Format a number with Indian locale grouping.
 */
function formatNumber(num: number, decimals: number): string {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Animates a number from 0 (or previous value) to the target value
 * using requestAnimationFrame with an ease-out deceleration curve.
 * Formats output with Indian locale grouping.
 */
export default function AnimatedNumber({
  value,
  duration = 1000,
  prefix = '₹',
  suffix = '',
  decimals = 0,
}: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const startTime = performance.now();
    const diff = value - startValue;

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + diff * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        previousValue.current = value;
      }
    }

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return (
    <span>
      {prefix}
      {formatNumber(displayValue, decimals)}
      {suffix}
    </span>
  );
}
