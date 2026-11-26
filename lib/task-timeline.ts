import type { Task, TaskStatus } from '@/lib/api/tasks';
type TimelineItem = {
  title: string;
  time?: string;
  status: 'checked' | 'active' | 'future';
};

/** Order the backend actually moves a task through. */
const STATUS_ORDER: TaskStatus[] = [
  'open',
  'assigned',
  'in-progress',
  'awaiting-confirmation',
  'completed',
];

function clockTime(iso?: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const twelve = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelve}:${minutes}${suffix}`;
}

/**
 * Build the timeline from the task itself.
 *
 * The backend stores no per-step history — only `status` plus `createdAt` /
 * `completedAt` / `updatedAt` — so intermediate steps are shown as reached or
 * not, and only the stamps that genuinely exist carry a time. The design's
 * "Tasker On the Way" step has no backend equivalent and is dropped rather than
 * invented.
 */
export function buildTimeline(task: Task): TimelineItem[] {
  if (task.status === 'cancelled') {
    return [
      { title: 'Task posted', time: clockTime(task.createdAt), status: 'checked' },
      { title: 'Cancelled', time: clockTime(task.updatedAt), status: 'active' },
    ];
  }

  const reached = STATUS_ORDER.indexOf(task.status);
  const mark = (index: number): TimelineItem['status'] =>
    index < reached ? 'checked' : index === reached ? 'active' : 'future';

  return [
    { title: 'Task posted', time: clockTime(task.createdAt), status: mark(0) },
    { title: 'Tasker hired', status: reached >= 1 ? 'checked' : 'future' },
    {
      title: 'Payment secured',
      status: reached >= 1 || ['held', 'release_requested', 'released'].includes(task.escrowStatus || '') ? 'checked' : 'future',
    },
    { title: 'In progress', status: mark(2) },
    {
      title: 'Submitted for confirmation',
      time: clockTime(task.completionSubmittedAt),
      status: reached >= 3 ? 'checked' : 'future',
    },
    {
      title: 'Completed',
      time: clockTime(task.completedAt),
      status: reached >= 4 ? 'checked' : 'future',
    },
  ];
}
