import type { Source, NormalizedFetchResult } from "../source";
import {
  PLACEHOLDER_GPUS,
  PLACEHOLDER_RETAILERS,
  PLACEHOLDER_STORES,
  PLACEHOLDER_CARDS,
  PLACEHOLDER_PROVINCE_TAXES,
  PLACEHOLDER_OBSERVATIONS,
  PLACEHOLDER_CHANGE_EVENTS,
} from "./placeholder-data";

export class PlaceholderSource implements Source {
  readonly id = "placeholder";
  readonly displayName = "Placeholder example data (not live retailer data)";

  async fetch(): Promise<NormalizedFetchResult> {
    return {
      gpus: PLACEHOLDER_GPUS,
      retailers: PLACEHOLDER_RETAILERS,
      stores: PLACEHOLDER_STORES,
      cards: PLACEHOLDER_CARDS,
      provinceTaxes: PLACEHOLDER_PROVINCE_TAXES,
      observations: PLACEHOLDER_OBSERVATIONS,
      changeEvents: PLACEHOLDER_CHANGE_EVENTS,
    };
  }
}