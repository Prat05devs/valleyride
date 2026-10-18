import type { ZodError } from 'zod';

/** "stops › 3 › blurb: Required": the first problem in a failed parse, with its path, for admin forms. */
export function firstIssue(e: ZodError) {
  const i = e.issues[0];
  if (!i) return 'Check the form';
  return i.path.length ? `${i.path.join(' › ')}: ${i.message}` : i.message;
}
