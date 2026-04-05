import { describe, expect, it } from "vitest";
import { createRiskTools } from "../../server/services/agent/tools/riskTools.js";

describe("risk tools", () => {
  it("maps urgent clinical risk to R3", async () => {
    const tools = createRiskTools({});
    const result = await tools.assessEmotionalRisk.execute(
      {},
      {
        lang: "zh",
        clientContext: {
          checkIns: [],
          cbtAssessment: {
            epdsScore: 4,
            gad7Score: 4,
            isi7Score: 4,
            selfHarmRisk: true,
            completedAt: new Date(2026, 2, 10, 12, 0, 0, 0).toISOString(),
          },
        },
      }
    );

    expect(result.level).toBe("high");
    expect(result.alert.level).toBe("urgent");
    expect(result.riskLevel).toBe("R3");
  });
});
