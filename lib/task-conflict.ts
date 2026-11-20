import type { QueryClient } from '@tanstack/react-query';

export const TASK_CHANGED_MESSAGE = 'This task changed while you were viewing it. Review the updated details, then try again if the action is still available.';

/** Refresh server state after a conflict. Never repeat a financial mutation automatically. */
export async function refreshChangedTask(client: QueryClient, endpoint: string) {
  if (!/^\/api\/tasks\/[^/?]+/.test(endpoint)) return;
  // Task detail, feeds and history all share this prefix.
  await client.invalidateQueries({ queryKey: ['tasks'] }).catch(() => undefined);
}
