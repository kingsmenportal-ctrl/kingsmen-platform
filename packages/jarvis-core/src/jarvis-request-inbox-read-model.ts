export type JarvisRequestInboxStatus = 'new' | 'triaged' | 'blocked' | 'done';

export interface JarvisRequestInboxItem {
  readonly inboxRef: string;
  readonly requestRef: string;
  readonly source: 'hud' | 'voice' | 'repo' | 'system';
  readonly status: JarvisRequestInboxStatus;
  readonly safeSummary: string;
  readonly moduleRef?: string;
  readonly createdAtIso: string;
}

export interface JarvisRequestInboxReadModel {
  readonly readModelRef: 'jarvis-request-inbox-read-model';
  readonly items: readonly JarvisRequestInboxItem[];
  readonly newCount: number;
  readonly blockedCount: number;
}

export function jarvisCreateRequestInboxReadModel(items: readonly JarvisRequestInboxItem[]): JarvisRequestInboxReadModel {
  return {
    readModelRef: 'jarvis-request-inbox-read-model',
    items,
    newCount: items.filter((item) => item.status === 'new').length,
    blockedCount: items.filter((item) => item.status === 'blocked').length,
  };
}
