/** Contact details and dates shared by the policy pages (privacy, terms, refunds, delivery, contact, account deletion). */
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+917055333321';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null;
export const PHONE_DISPLAY = SUPPORT_PHONE.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');
export const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`;
export const TEL_URL = `tel:${SUPPORT_PHONE}`;
export const DESK_HOURS = '8:00 AM – 8:00 PM, every day';

/** Bump when any policy page's substance changes. */
export const POLICIES_UPDATED = '1 November 2026';

export const POLICY_LINKS = [
  { href: '/terms', label: 'Rental terms' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/refund-policy', label: 'Cancellation and refunds' },
  { href: '/shipping-policy', label: 'Pickup and delivery' },
  { href: '/delete-account', label: 'Delete your account' },
  { href: '/contact', label: 'Contact and support' },
] as const;
