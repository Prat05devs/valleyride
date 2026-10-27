import { z } from 'zod';

/**
 * Editorial content for model pages (vehicle_models.specs) and route pages (route_guides stops, tips, cover).
 * Staff edit both in the admin console; the API validates with these schemas before saving.
 */

/** A photo with its credit. `url` is either a path on the API (/static/guides/…) or an absolute https URL. */
export const photoSchema = z.object({
  url: z.string().trim().min(1).max(500).regex(/^(\/static\/|https:\/\/)/, 'Use /static/… or an https:// URL'),
  credit: z.string().trim().min(1).max(160),
  license: z.string().trim().max(60).default(''),
  source: z.string().trim().url().max(500).regex(/^https:\/\//, 'Use an https:// URL').optional(),
});
export type Photo = z.infer<typeof photoSchema>;

const row = z.object({ label: z.string().trim().min(1).max(60), value: z.string().trim().min(1).max(200) });
export type SpecRow = z.infer<typeof row>;

export const vehicleSpecsSchema = z.object({
  modelYear: z.number().int().min(2000).max(2100),
  overview: z.string().trim().min(10).max(1200),
  /** The four big numbers on the page: power, torque, mileage, weight. */
  highlights: z.array(row).min(1).max(6),
  groups: z.array(z.object({ title: z.string().trim().min(1).max(60), rows: z.array(row).min(1).max(20) })).max(8),
  mileage: z.object({
    /** The manufacturer's (ARAI) figure, when it publishes one. */
    claimed: z.string().trim().max(60).nullable(),
    realWorld: z.string().trim().min(1).max(60),
    tankL: z.number().positive().max(40),
    range: z.string().trim().min(1).max(60),
    note: z.string().trim().max(300).default(''),
  }),
  /** How the bike suits each kind of road around Dehradun, scored 1–5. */
  terrain: z.array(z.object({ label: z.string().trim().min(1).max(60), score: z.number().int().min(1).max(5), note: z.string().trim().min(1).max(300) })).max(8),
  goodToKnow: z.array(z.string().trim().min(1).max(300)).max(12),
  /** Facts only the owner can give (helmets, mounts, variant, colour); empty until staff add them. */
  fromUs: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  sources: z.array(z.object({ label: z.string().trim().min(1).max(120), url: z.string().trim().url().max(500).regex(/^https:\/\//, 'Use an https:// URL') })).max(10).default([]),
});
export type VehicleSpecs = z.infer<typeof vehicleSpecsSchema>;

export const STOP_KINDS = ['start', 'junction', 'viewpoint', 'food', 'cafe', 'sight', 'waterfall', 'temple', 'walk', 'fuel', 'end'] as const;
export type StopKind = (typeof STOP_KINDS)[number];

/** `way` stops make the ride timeline; `explore` are things to see at or near the end; `eat` are cafés and food. */
export const STOP_SECTIONS = ['way', 'explore', 'eat'] as const;

export const routeStopSchema = z.object({
  name: z.string().trim().min(1).max(100),
  kind: z.enum(STOP_KINDS),
  section: z.enum(STOP_SECTIONS),
  /** Distance from the start of the route; null for places off the main line. */
  km: z.number().min(0).max(2000).nullable().default(null),
  blurb: z.string().trim().min(1).max(600),
  tip: z.string().trim().max(300).optional(),
  hours: z.string().trim().max(120).optional(),
  photo: photoSchema.optional(),
});
export type RouteStop = z.infer<typeof routeStopSchema>;

export const routeDetailsSchema = z.object({
  rideTime: z.string().trim().max(60).nullable().default(null),
  bestTime: z.string().trim().max(200).nullable().default(null),
  difficulty: z.enum(['easy', 'moderate', 'challenging']).nullable().default(null),
  /** Why the recommended bikes suit this road. */
  bikeAdvice: z.string().trim().max(800).nullable().default(null),
  highlights: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
  stops: z.array(routeStopSchema).max(40).default([]),
  tips: z.array(z.string().trim().min(1).max(300)).max(15).default([]),
  cover: photoSchema.nullable().default(null),
  /** Route map image (/static/… or https://), drawn without credits or watermarks on it. */
  mapImage: z.string().trim().max(500).regex(/^(\/static\/|https:\/\/)/, 'Use /static/… or an https:// URL').nullable().default(null),
});
export type RouteDetails = z.infer<typeof routeDetailsSchema>;

export const STOP_KIND_LABEL: Record<StopKind, string> = {
  start: 'Start', junction: 'Junction', viewpoint: 'Viewpoint', food: 'Food', cafe: 'Café', sight: 'Sight',
  waterfall: 'Waterfall', temple: 'Temple', walk: 'Walk', fuel: 'Fuel', end: 'Destination',
};

export const DIFFICULTY_LABEL = { easy: 'Easy', moderate: 'Moderate', challenging: 'Challenging' } as const;
