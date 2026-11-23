/// <reference types="astro/client" />

declare module "../../../data/store.json" {
  import type { TrackerStore } from "../../../types/db";
  const value: TrackerStore;
  export default value;
}