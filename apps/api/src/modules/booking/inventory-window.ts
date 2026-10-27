/** Shared by availability and row-locked allocation. All ids/times are bound replacements. */
export const INVENTORY_WINDOW = `
  v.status = 'ACTIVE'
  AND (:pickup IS NULL OR COALESCE(v.current_location_id, v.home_location_id) = :pickup)
  AND NOT EXISTS (
    SELECT 1 FROM bookings b WHERE b.vehicle_id = v.id AND b.status IN (:active)
      AND tstzrange(b.start_at, b.end_at, '[)') && tstzrange(:startAt, :endAt, '[)')
  )
  AND NOT EXISTS (
    SELECT 1 FROM bookings overdue WHERE overdue.vehicle_id = v.id
      AND overdue.status = 'ONGOING' AND overdue.end_at < now()
  )
  AND (:pickup IS NULL OR COALESCE(
    (SELECT prior.return_location_id FROM bookings prior
      WHERE prior.vehicle_id = v.id AND prior.status IN (:active) AND prior.end_at <= :startAt
      ORDER BY prior.end_at DESC LIMIT 1), COALESCE(v.current_location_id, v.home_location_id)) = :pickup)
  AND (:returnTo IS NULL OR COALESCE(
    (SELECT successor.pickup_location_id FROM bookings successor
      WHERE successor.vehicle_id = v.id AND successor.status IN (:active) AND successor.start_at >= :endAt
      ORDER BY successor.start_at ASC LIMIT 1), :returnTo) = :returnTo)
`;
