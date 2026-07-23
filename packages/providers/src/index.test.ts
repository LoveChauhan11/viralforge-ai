import { describe, expect, it, vi } from "vitest";
import {
  createBudget,
  FakeModelProvider,
  FakeNotificationProvider,
  FakeTranscriptionProvider,
  FakeTrendProvider,
  FakeYouTubeProvider,
  ProviderError,
  redactProviderFields,
  withTimeout,
} from "./index.js";

describe("provider fakes", () => {
  it("never requires network and validates model IO", async () => {
    const model = new FakeModelProvider();
    const out = await model.complete({ prompt: "hook ideas for biking shorts" });
    expect(out.model).toBe("fake-model-v0");
    expect(out.text.startsWith("fake-response:")).toBe(true);
    await expect(model.complete({ prompt: "" })).rejects.toBeInstanceOf(ProviderError);
  });

  it("rejects cross-tenant transcription keys", async () => {
    const t = new FakeTranscriptionProvider();
    await expect(
      t.transcribe({
        workspaceId: "019f8f2d-8f49-7065-a1df-1372d62d28c8",
        objectKey: "019f8f2d-8f4c-72f9-9072-ed3503c1c0ae/source/x.mp4",
      }),
    ).rejects.toMatchObject({ code: "rejected" });
  });

  it("lists fake trends and notifies without external calls", async () => {
    const trends = new FakeTrendProvider();
    const items = await trends.listTrends({ niche: "fitness", region: "us" });
    expect(items[0]?.confidence).toBeGreaterThan(0);

    const notify = new FakeNotificationProvider();
    await notify.send({
      to: "local.dev@example.invalid",
      subject: "Job failed",
      body: "foundation job failed",
    });
    expect(notify.sent).toHaveLength(1);
  });

  it("preserves YouTube Option 1 music handoff without audio attachment", async () => {
    const yt = new FakeYouTubeProvider();
    const handoff = await yt.createMusicHandoff({
      trackTitle: "Demo Beat",
      artist: "Library Artist",
      suggestedSegmentSeconds: [0, 15],
    });
    expect(handoff.mode).toBe("youtube_option_1_handoff");
    expect(handoff.handoffStatus).toBe("waiting_for_music_confirmation");
    expect(JSON.stringify(handoff)).not.toMatch(/https?:\/\/.*(mp3|audio)/i);
  });

  it("enforces budgets and timeouts", async () => {
    const budget = createBudget(1, 100);
    const model = new FakeModelProvider(budget);
    await model.complete({ prompt: "one" });
    await expect(model.complete({ prompt: "two" })).rejects.toMatchObject({
      code: "budget_exceeded",
    });

    await expect(
      withTimeout("model", 20, async () => {
        await new Promise((r) => setTimeout(r, 100));
        return "late";
      }),
    ).rejects.toMatchObject({ code: "timeout" });
  });

  it("redacts sensitive fields for logs", () => {
    const redacted = redactProviderFields({
      requestId: "r1",
      apiKey: "sk-live-secret",
      nested: { accessToken: "tok", safe: true },
    });
    expect(redacted).toEqual({
      requestId: "r1",
      apiKey: "[redacted]",
      nested: { accessToken: "[redacted]", safe: true },
    });
  });

  it("does not open sockets in fake adapters", async () => {
    const spy = vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      throw new Error("network forbidden in provider unit tests");
    });
    const model = new FakeModelProvider();
    const trends = new FakeTrendProvider();
    const yt = new FakeYouTubeProvider();
    await model.complete({ prompt: "x" });
    await trends.listTrends({ niche: "x", region: "us" });
    await yt.getChannel({ channelId: "UC_fake" });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
