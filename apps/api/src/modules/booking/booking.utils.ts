import { randomInt } from 'node:crypto';

/** No 0/O, 1/I: codes are read out over the phone. */
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Short human code, e.g. VR-24K9Q. UNIQUE(code) in the database catches the rare collision. */
export function newBookingCode(): string {
  let s = 'VR-';
  for (let i = 0; i < 5; i++) s += CODE_CHARS[randomInt(CODE_CHARS.length)];
  return s;
}
