import type { IndicatorZone, Thresholds } from "./types";

/** Пороговые значения по ТЗ (docs/TZ.md, раздел 4.3). */
export const TEMPERATURE_THRESHOLDS: Thresholds = {
  normalMax: 350,
  warningMax: 400,
};
export const TEMPERATURE_MELTDOWN = 450;

export const PRESSURE_MIN_NORMAL = 6;
export const PRESSURE_MAX_NORMAL = 12;
export const PRESSURE_MIN_WARNING = 4;
export const PRESSURE_MAX_WARNING = 15;

export const SAFETY_THRESHOLDS: Thresholds = {
  normalMax: 100,
  warningMax: 70,
};
export const SAFETY_WARNING_MIN = 40;

export function temperatureZone(temperature: number): IndicatorZone {
  if (temperature <= TEMPERATURE_THRESHOLDS.normalMax) return "normal";
  if (temperature <= TEMPERATURE_THRESHOLDS.warningMax) return "warning";
  return "danger";
}

export function pressureZone(pressure: number): IndicatorZone {
  if (pressure >= PRESSURE_MIN_NORMAL && pressure <= PRESSURE_MAX_NORMAL) {
    return "normal";
  }
  if (pressure >= PRESSURE_MIN_WARNING && pressure <= PRESSURE_MAX_WARNING) {
    return "warning";
  }
  return "danger";
}

export function safetyZone(safety: number): IndicatorZone {
  if (safety >= SAFETY_THRESHOLDS.warningMax) return "normal";
  if (safety >= SAFETY_WARNING_MIN) return "warning";
  return "danger";
}
