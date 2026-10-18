import { closeStack, releaseTestBookings } from './fixtures/stack';

/** Before and after a run: free bikes held by earlier test riders. */
export default async function globalSetup() {
  await releaseTestBookings();
  return async () => { await releaseTestBookings(); await closeStack(); };
}
