// Tests for the pure countdown maths in timer.ts, plus the TIME_LIMITS setting.
// We pass made-up times (in milliseconds) instead of reading a real clock.
import { describe, expect, it } from "vitest";
import { TIME_LIMITS } from "@/lib/game/config";
import { computeDeadline, isPastDeadline, secondsLeftUntil } from "@/lib/game/timer";

describe("computeDeadline", () => {
  it("adds the duration (in seconds) to the start time (in ms)", () => {
    expect(computeDeadline(1000, 5)).toBe(6000);
    expect(computeDeadline(0, 3)).toBe(3000);
  });
});

describe("secondsLeftUntil", () => {
  it("returns the remaining seconds", () => {
    expect(secondsLeftUntil(5000, 3500)).toBe(1.5);
    expect(secondsLeftUntil(5000, 0)).toBe(5);
  });

  it("never goes below zero, even if we check late", () => {
    expect(secondsLeftUntil(5000, 5000)).toBe(0);
    expect(secondsLeftUntil(5000, 9000)).toBe(0);
  });
});

describe("isPastDeadline", () => {
  it("is false before the deadline and true at or after it", () => {
    expect(isPastDeadline(5000, 4999)).toBe(false);
    expect(isPastDeadline(5000, 5000)).toBe(true);
    expect(isPastDeadline(5000, 5001)).toBe(true);
  });

  it("doesn't drift: a late check still measures from the original deadline", () => {
    const deadline = computeDeadline(0, 3);
    // Pretend the browser only checked at uneven moments.
    expect(secondsLeftUntil(deadline, 1013)).toBeCloseTo(1.987);
    expect(secondsLeftUntil(deadline, 2290)).toBeCloseTo(0.71);
    expect(isPastDeadline(deadline, 3004)).toBe(true);
  });
});

describe("TIME_LIMITS", () => {
  it("offers 10, 5 and 3 seconds", () => {
    expect([...TIME_LIMITS]).toEqual([10, 5, 3]);
  });
});
