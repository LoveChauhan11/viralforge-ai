import { z } from "zod";
import {
  consumeBudget,
  createBudget,
  type ProviderBudget,
  type ProviderCapability,
  ProviderError,
  withTimeout,
} from "./common.js";

const channelInput = z.object({ channelId: z.string().min(1).max(128) });
const channelOutput = z.object({
  id: z.string(),
  title: z.string(),
});

const musicHandoffInput = z.object({
  trackTitle: z.string().min(1).max(200),
  artist: z.string().min(1).max(200),
  suggestedSegmentSeconds: z.tuple([z.number(), z.number()]).optional(),
});

const musicHandoffOutput = z.object({
  mode: z.literal("youtube_option_1_handoff"),
  trackTitle: z.string(),
  artist: z.string(),
  suggestedSegmentSeconds: z.tuple([z.number(), z.number()]).nullable(),
  suggestedVolume: z.number(),
  instructions: z.array(z.string()).min(1),
  /** Never a media binary or attachable audio URL for protected tracks. */
  handoffStatus: z.literal("waiting_for_music_confirmation"),
});

export type YouTubeChannel = z.infer<typeof channelOutput>;
export type MusicHandoff = z.infer<typeof musicHandoffOutput>;

export interface YouTubeProvider {
  readonly capability: ProviderCapability;
  getChannel(input: z.infer<typeof channelInput>): Promise<YouTubeChannel>;
  /**
   * Option 1: return manual Shorts-library music handoff steps.
   * Must not attach or download protected audio.
   */
  createMusicHandoff(input: z.infer<typeof musicHandoffInput>): Promise<MusicHandoff>;
}

export class FakeYouTubeProvider implements YouTubeProvider {
  readonly capability: ProviderCapability = {
    name: "youtube",
    mode: "fake",
    maxTimeoutMs: 5_000,
  };
  readonly budget: ProviderBudget;

  constructor(budget: ProviderBudget = createBudget()) {
    this.budget = budget;
  }

  async getChannel(raw: z.infer<typeof channelInput>): Promise<YouTubeChannel> {
    const parsed = channelInput.safeParse(raw);
    if (!parsed.success) {
      throw new ProviderError("invalid_input", "youtube", "invalid channel input", {
        retryable: false,
      });
    }
    consumeBudget(this.budget, "youtube", parsed.data.channelId.length);
    return withTimeout("youtube", this.capability.maxTimeoutMs ?? 5_000, async () =>
      channelOutput.parse({ id: parsed.data.channelId, title: "Fake Channel" }),
    );
  }

  async createMusicHandoff(raw: z.infer<typeof musicHandoffInput>): Promise<MusicHandoff> {
    const parsed = musicHandoffInput.safeParse(raw);
    if (!parsed.success) {
      throw new ProviderError("invalid_input", "youtube", "invalid music handoff input", {
        retryable: false,
      });
    }
    consumeBudget(this.budget, "youtube", parsed.data.trackTitle.length);
    return withTimeout("youtube", this.capability.maxTimeoutMs ?? 5_000, async () =>
      musicHandoffOutput.parse({
        mode: "youtube_option_1_handoff",
        trackTitle: parsed.data.trackTitle,
        artist: parsed.data.artist,
        suggestedSegmentSeconds: parsed.data.suggestedSegmentSeconds ?? null,
        suggestedVolume: 0.35,
        instructions: [
          "Open the Short in YouTube Studio or the YouTube app.",
          "Add the recommended track from YouTube’s Shorts music library.",
          "Trim to the suggested segment and confirm volume.",
          "Mark the ViralForge publication as music-confirmed when done.",
        ],
        handoffStatus: "waiting_for_music_confirmation",
      }),
    );
  }
}
