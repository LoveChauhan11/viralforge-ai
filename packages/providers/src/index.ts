/**
 * Provider interfaces + fake adapters (S0-12 expands these).
 * Domain packages must depend only on interfaces, never SDKs.
 */
export type ProviderCapability = {
  name: string;
  mode: "fake" | "live";
};

export interface ModelProvider {
  readonly capability: ProviderCapability;
  complete(prompt: string): Promise<{ text: string }>;
}

export interface TranscriptionProvider {
  readonly capability: ProviderCapability;
  transcribe(objectKey: string): Promise<{ text: string }>;
}

export interface TrendProvider {
  readonly capability: ProviderCapability;
  listTrends(niche: string): Promise<Array<{ id: string; label: string }>>;
}

export interface YouTubeProvider {
  readonly capability: ProviderCapability;
  getChannel(channelId: string): Promise<{ id: string; title: string }>;
}

export interface NotificationProvider {
  readonly capability: ProviderCapability;
  send(to: string, subject: string, body: string): Promise<void>;
}

export class FakeModelProvider implements ModelProvider {
  readonly capability = { name: "model", mode: "fake" as const };
  async complete(prompt: string): Promise<{ text: string }> {
    return { text: `fake-response:${prompt.slice(0, 32)}` };
  }
}

export class FakeTranscriptionProvider implements TranscriptionProvider {
  readonly capability = { name: "transcription", mode: "fake" as const };
  async transcribe(objectKey: string): Promise<{ text: string }> {
    return { text: `fake-transcript:${objectKey}` };
  }
}

export class FakeTrendProvider implements TrendProvider {
  readonly capability = { name: "trends", mode: "fake" as const };
  async listTrends(niche: string): Promise<Array<{ id: string; label: string }>> {
    return [{ id: "t1", label: `${niche}-trend-1` }];
  }
}

export class FakeYouTubeProvider implements YouTubeProvider {
  readonly capability = { name: "youtube", mode: "fake" as const };
  async getChannel(channelId: string): Promise<{ id: string; title: string }> {
    return { id: channelId, title: "Fake Channel" };
  }
}

export class FakeNotificationProvider implements NotificationProvider {
  readonly capability = { name: "notification", mode: "fake" as const };
  readonly sent: Array<{ to: string; subject: string; body: string }> = [];
  async send(to: string, subject: string, body: string): Promise<void> {
    this.sent.push({ to, subject, body });
  }
}
