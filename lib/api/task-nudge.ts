import { getTaskById } from './tasks';
import { getTaskerBids } from './bids';
import { createOrGetConversation, sendMessage } from './chat';
import { offerTaskId } from '@/lib/task-lifecycle';
const sending = new Set<string>();
export async function nudgeCustomer(taskId: string): Promise<void> {
  if (sending.has(taskId)) throw new Error('A reminder is already being sent.');
  sending.add(taskId);
  try {
    const { task } = await getTaskById(taskId);
    if (!['open', 'assigned', 'in-progress', 'awaiting-confirmation'].includes(task.status)) throw new Error('This task is no longer active.');
    let bidId: string | undefined;
    if (task.status === 'open') {
      const { bids } = await getTaskerBids({ status: 'pending', limit: 100 });
      const offer = bids.find((bid) => offerTaskId(bid) === taskId && bid.status === 'pending' && bid.taskerConfirmed);
      if (!offer) throw new Error('Accept the hire request before sending a reminder.');
      bidId = offer._id;
    }
    const text = task.status === 'open' ? `I have accepted your hire request for "${task.title}" and I am ready to help. Please review and confirm the hire on TaskHub.`
      : task.status === 'assigned' ? `I am ready to start "${task.title}". You can follow updates on TaskHub or message me here.`
      : task.status === 'awaiting-confirmation' ? `I have submitted the completed work for "${task.title}". Please review it and confirm completion on TaskHub when you are satisfied.`
      : `Work has started on "${task.title}". You can follow progress on TaskHub or message me here.`;
    const { conversation } = await createOrGetConversation({ taskId, ...(bidId ? { bidId } : {}) });
    await sendMessage(conversation._id, text);
  } finally { sending.delete(taskId); }
}
