export type JarvisBuildSessionListItem = {
  readonly sessionRef: string;
  readonly moduleRef: string;
  readonly status: 'planned' | 'in_progress' | 'review' | 'validated' | 'blocked';
  readonly safeSummary: string;
  readonly updatedAt: string;
};

export type JarvisBuildSessionListViewInput = {
  readonly viewRef: string;
  readonly sessions: readonly JarvisBuildSessionListItem[];
};

export type JarvisBuildSessionListView = {
  readonly viewRef: string;
  readonly mode: 'read_only_build_session_list';
  readonly totalCount: number;
  readonly activeCount: number;
  readonly reviewCount: number;
  readonly blockedCount: number;
  readonly sessions: readonly JarvisBuildSessionListItem[];
};

export function jarvisCreateBuildSessionListView(
  input: JarvisBuildSessionListViewInput,
): JarvisBuildSessionListView {
  const sessions = [...input.sessions].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  return {
    viewRef: input.viewRef,
    mode: 'read_only_build_session_list',
    totalCount: sessions.length,
    activeCount: sessions.filter((session) => session.status === 'planned' || session.status === 'in_progress').length,
    reviewCount: sessions.filter((session) => session.status === 'review').length,
    blockedCount: sessions.filter((session) => session.status === 'blocked').length,
    sessions,
  };
}

export const JARVIS_BUILD_SESSION_LIST_VIEW_LIVE = true;
