export const SUPPORT_PHONE_NUMBERS = [
  { label: '+234 912 463 8396', actionLabel: 'Chat with Us', kind: 'whatsapp', href: 'https://wa.me/2349124638396' },
  { label: '+234 913 530 8859', actionLabel: 'Call Us', kind: 'call', href: 'tel:+2349135308859' },
] as const;

export const SUPPORT_CHAT_CONTACT = SUPPORT_PHONE_NUMBERS[0];
export const SUPPORT_CALL_CONTACT = SUPPORT_PHONE_NUMBERS[1];

export function getSupportContactUrl(contact: typeof SUPPORT_PHONE_NUMBERS[number], message = 'Hello TaskHub support, I need help.') {
  return contact.kind === 'whatsapp' ? `${contact.href}?text=${encodeURIComponent(message)}` : contact.href;
}
