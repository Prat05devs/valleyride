import type { VehicleCategory } from '../constants';
import type { RouteDetails, VehicleSpecs } from './guide';

export interface LocationDTO {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number | null;
  lng: number | null;
  /** e.g. { "mon-sun": "08:00-20:00" } */
  openHours: Record<string, string> | null;
}

export interface VehicleModelDTO {
  id: string;
  slug: string;
  name: string;
  category: VehicleCategory;
  engineCc: number;
  pricePerDayPaise: number;
  depositPaise: number;
  kmPerDay: number;
  extraKmPaise: number;
  images: string[];
  /** Engine, chassis, mileage and terrain notes for the model page; null until written. */
  specs: VehicleSpecs | null;
  /** Units in service; on the list and detail endpoints. */
  units?: number;
}

export interface AvailabilityDTO {
  model_id: string;
  free: number;
  /** With ?pickup (and ?return for one-way): the priced quote for this model and window. */
  quote?: import('../pricing').Quote;
}

export interface RouteGuideDTO extends RouteDetails {
  id: string;
  slug: string;
  title: string;
  distanceKm: number;
  bodyMd: string;
  recommendedModels: string[];
}
