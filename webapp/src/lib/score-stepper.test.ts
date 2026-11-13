import { describe, expect, it } from "vitest";
import { stepScore } from "./score-stepper";

describe("stepScore", () => {
  it("starts from the imported result when the match has no edit", () => {
    expect(stepScore(undefined, { home: 2, guest: 3 }, "guest", 1)).toEqual({ home: "2", guest: "4" });
  });

  it("keeps an intentionally cleared home score empty when the guest score goes up", () => {
    expect(stepScore({ home: "", guest: "3" }, { home: 2, guest: 3 }, "guest", 1))
      .toEqual({ home: "", guest: "4" });
  });

  it("keeps a cleared guest score empty when the home score goes up", () => {
    expect(stepScore({ home: "99", guest: "" }, { home: 2, guest: 3 }, "home", 1))
      .toEqual({ home: "99", guest: "" });
  });

  it("counts an empty score on the stepped side as 0", () => {
    expect(stepScore({ home: "", guest: "1" }, { home: 2, guest: 3 }, "home", 1))
      .toEqual({ home: "1", guest: "1" });
  });
});
