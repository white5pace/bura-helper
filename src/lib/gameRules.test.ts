import { describe, expect, it } from "vitest";
import { nextDealerId, scoresAfterRound } from "@/lib/gameRules";

describe("scoresAfterRound", () => {
  it("records both team keys after the first round, including a zero penalty", () => {
    expect(
      scoresAfterRound({}, [
        { id: "t1", points: 4 },
        { id: "t2", points: 0 },
      ]),
    ).toEqual({ t1: 4, t2: 0 });
  });

  it("adds the next round points to the existing team keys", () => {
    expect(
      scoresAfterRound({ t1: 4, t2: 0 }, [
        { id: "t1", points: 2 },
        { id: "t2", points: 0 },
      ]),
    ).toEqual({ t1: 6, t2: 0 });
  });
});

describe("nextDealerId", () => {
  it("passes the deal to the next selected player and wraps to the first", () => {
    expect(nextDealerId(["p3", "p1", "p2"], "p3")).toBe("p1");
    expect(nextDealerId(["p3", "p1", "p2"], "p1")).toBe("p2");
    expect(nextDealerId(["p3", "p1", "p2"], "p2")).toBe("p3");
  });
});
