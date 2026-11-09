/** Contact details and dates shared by the policy pages (privacy, terms, refunds, delivery, contact, account deletion). */
export const SUPPORT_PHONE = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || '+917055333321';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null;
export const PHONE_DISPLAY = SUPPORT_PHONE.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');
export const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`;
export const TEL_URL = `tel:${SUPPORT_PHONE}`;
export const DESK_HOURS = '8:00 AM – 8:00 PM, every day';

/** Bump when any policy page's substance changes. */
export const POLICIES_UPDATED = '9 November 2026';

export const POLICY_LINKS = [
  { href: '/terms', label: 'Rental terms' },
  { href: '/privacy', label: 'Privacy policy' },
  { href: '/refund-policy', label: 'Cancellation and refunds' },
  { href: '/shipping-policy', label: 'Pickup and delivery' },
  { href: '/delete-account', label: 'Delete your account' },
  { href: '/contact', label: 'Contact and support' },
] as const;

/**
 * WhatsApp link for Valley Ride Capital enquiries, with the message pre-filled so the team sees at once that
 * this is an investor asking about the plans and the bank details for the transfer.
 */
export function investWhatsAppUrl(planRupees?: number) {
  const plan = planRupees ? `the ₹${(planRupees / 100_000).toLocaleString('en-IN')} lakh plan` : 'the ₹1 lakh or ₹2.5 lakh plan';
  const text = [
    'Hello Valley Ride team,',
    `I would like to invest with Valley Ride Capital in ${plan} (20% a year, interest paid monthly, principal back after the 18-month lock-in).`,
    'Please share the investment details and the bank details for the transfer.',
    '',
    'Name:',
    'City:',
  ].join('\n');
  return `${WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}
