export type ShareTasker = { _id?: string; firstName?: string; lastName?: string; fullName?: string; name?: string; subCategories?: { name?: string; displayName?: string }[]; services?: string[]; profilePicture?: string | null };
export const TASKHUB_SITE_URL = 'https://ngtaskhub.com';
const clean = (value: string) => value.replace(/\s*\u2014\s*/g, ' ').trim();
const readable = (value?: string) => value && !/^[a-f0-9]{24}$/i.test(value.trim()) ? clean(value) : '';
export function taskerShareContent(tasker: ShareTasker, id: string, origin = TASKHUB_SITE_URL) {
  const name = readable(tasker.fullName || tasker.name || [tasker.firstName, tasker.lastName].filter(Boolean).join(' ')) || 'a skilled tasker';
  const services = (tasker.subCategories?.length ? tasker.subCategories.map((service) => service.displayName || service.name || '') : tasker.services || []).map(readable).filter(Boolean);
  const specialty = services.slice(0, 3).join(', ');
  return { title: `Hire ${name} on TaskHub`, text: specialty ? `Need help with ${specialty}? Hire ${name} on TaskHub. Explore their services, experience and reviews, then book the help you need.` : `Find the help you need with ${name} on TaskHub. Explore their services, experience and reviews, then hire with confidence.`, url: `${origin.replace(/\/$/, '')}/taskers/${encodeURIComponent(id)}` };
}
