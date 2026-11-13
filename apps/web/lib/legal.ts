/** Contact details and dates shared by the policy pages (privacy, terms, refunds, delivery, contact, account deletion). */
const display = (e164: string) => e164.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2');

/**
 * Bookings, WhatsApp, payments, roadside help and every other customer question: calls and WhatsApp.
 * Fixed here on purpose (owner, November 2026): an old NEXT_PUBLIC_SUPPORT_WHATSAPP in the hosting settings kept
 * showing the investment line, so the environment no longer overrides it. Change the number here.
 */
export const SUPPORT_PHONE = '+919762697523';
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || null;
export const PHONE_DISPLAY = display(SUPPORT_PHONE);
export const WHATSAPP_URL = `https://wa.me/${SUPPORT_PHONE.replace(/\D/g, '')}`;
export const TEL_URL = `tel:${SUPPORT_PHONE}`;
/** The pickup desk: the same line. */
export const DESK_PHONE = SUPPORT_PHONE;

/** Valley Ride Capital only: investment enquiries and bank details (calls and WhatsApp). Not for rentals. */
export const INVEST_PHONE = '+917055333321';
export const INVEST_PHONE_DISPLAY = display(INVEST_PHONE);
export const INVEST_TEL_URL = `tel:${INVEST_PHONE}`;
const INVEST_WHATSAPP_URL = `https://wa.me/${INVEST_PHONE.replace(/\D/g, '')}`;
/** Official social profiles (also schema.org sameAs). */
export const INSTAGRAM_URL = 'https://www.instagram.com/valley.ride/';
export const INSTAGRAM_HANDLE = '@valley.ride';

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
  return `${INVEST_WHATSAPP_URL}?text=${encodeURIComponent(text)}`;
}
