import { describe, expect, it } from "vitest";
import { createPartnerSyncService, createInitialPartnerSyncState } from "../../server/services/partnerSyncService.js";
import { createMemoryStore } from "../../server/store/jsonStore.js";

const createService = () => {
  const store = createMemoryStore(createInitialPartnerSyncState(new Date("2026-03-10T08:00:00.000Z")));
  return createPartnerSyncService({
    store,
    now: () => new Date("2026-03-10T08:00:00.000Z"),
  });
};

describe("server partner sync service", () => {
  it("creates invite and moves disabled state into pending", async () => {
    const service = createService();

    const result = await service.createInvite();

    expect(result.status).toBe("pending");
    expect(result.invite.code).toHaveLength(6);
    expect(result.sharing.level).toBe("summary");
  });

  it("binds partner and returns bound overview", async () => {
    const service = createService();

    await service.createInvite();
    await service.bindPartner({
      partner: {
        nickname: "Alex",
        relation: "伴侣",
      },
      sharing: {
        level: "summary_plus",
      },
    });

    const overview = await service.getOverview({ lang: "zh" });

    expect(overview.status).toBe("bound");
    expect(overview.partner.nickname).toBe("Alex");
    expect(overview.sharing.level).toBe("summary_plus");
    expect(overview.preview.tasks.length).toBeGreaterThan(0);
  });

  it("updates task state and can unbind partner", async () => {
    const service = createService();

    await service.createInvite();
    await service.bindPartner({
      partner: {
        nickname: "Alex",
        relation: "伴侣",
      },
      sharing: {
        level: "summary_plus",
      },
    });

    const overview = await service.getOverview({ lang: "zh" });
    const taskId = overview.preview.tasks[0].id;

    const taskResult = await service.updateTaskState(taskId, true, { lang: "zh" });
    expect(taskResult.task.done).toBe(true);

    const unbindResult = await service.unbind();
    expect(unbindResult.status).toBe("disabled");
  });
});
