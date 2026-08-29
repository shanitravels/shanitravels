import { describe, it, expect } from "vitest";
import { engineCc, byEngineSize } from "./engine-size";

/**
 * The `engine` field is free text written for humans, and the fleet ordering
 * reads a number out of it. The traps are cylinder counts ("V8", "4/5-cylinder")
 * and dual-engine entries — every string below is one that actually appears in
 * the fleet.
 */

describe("engineCc", () => {
  it("reads a cc figure", () => {
    expect(engineCc("660cc petrol")).toBe(660);
    expect(engineCc("800cc petrol")).toBe(800);
  });

  it("converts litres to cc", () => {
    expect(engineCc("1.0L petrol")).toBe(1000);
    expect(engineCc("1.3L petrol")).toBe(1300);
    expect(engineCc("2.8L diesel")).toBe(2800);
    expect(engineCc("5.7L V8 petrol")).toBe(5700);
  });

  it("reads a capacity that is followed by trim wording", () => {
    expect(engineCc("1.2L i-VTEC")).toBe(1200);
    expect(engineCc("1.5L VTEC Turbo")).toBe(1500);
    expect(engineCc("2.5L hybrid")).toBe(2500);
  });

  /** A cylinder count is not a displacement. */
  it("ignores the cylinder figure in a V8", () => {
    expect(engineCc("4.6L V8 petrol")).toBe(4600);
    expect(engineCc("4.0L V8 petrol")).toBe(4000);
    expect(engineCc("4.5L V8 diesel")).toBe(4500);
  });

  it("does not mistake a cylinder range for litres", () => {
    // Would parse as 4L or 5L if bare numbers counted.
    expect(engineCc("Diesel (4/5-cylinder)")).toBeNull();
  });

  it("takes the smaller figure when two engines are quoted", () => {
    expect(engineCc("1.6L / 2.0L petrol")).toBe(1600);
    expect(engineCc("2.7L petrol / 2.8L diesel")).toBe(2700);
  });

  it("reports null when no displacement is named", () => {
    expect(engineCc("Diesel")).toBeNull();
    expect(engineCc("Heavy diesel")).toBeNull();
  });

  it("handles missing input", () => {
    expect(engineCc("")).toBeNull();
    expect(engineCc(null)).toBeNull();
    expect(engineCc(undefined)).toBeNull();
  });

  it("accepts spelled-out and plural units", () => {
    expect(engineCc("2.0 litre petrol")).toBe(2000);
    expect(engineCc("2.0 liters")).toBe(2000);
  });

  it("is case-insensitive", () => {
    expect(engineCc("1500CC PETROL")).toBe(1500);
    expect(engineCc("1.8l petrol")).toBe(1800);
  });

  it("rejects a non-positive figure", () => {
    expect(engineCc("0cc")).toBeNull();
  });
});

describe("byEngineSize", () => {
  const v = (name: string, engine: string | null) => ({ name, engine });

  it("orders smallest engine first", () => {
    const sorted = [
      v("Sonata", "2.0L petrol"),
      v("City 1200", "1.2L i-VTEC"),
      v("Corolla XLI", "1.3L petrol"),
    ].sort(byEngineSize);
    expect(sorted.map((x) => x.name)).toEqual(["City 1200", "Corolla XLI", "Sonata"]);
  });

  it("puts unknown capacity last, whatever the input order", () => {
    const sorted = [
      v("Yutong Bus", "Diesel"),
      v("Hiace", "2.7L petrol"),
      v("Bedford", "Heavy diesel"),
    ].sort(byEngineSize);
    expect(sorted[0].name).toBe("Hiace");
    expect(sorted.slice(1).map((x) => x.name)).toEqual(["Bedford", "Yutong Bus"]);
  });

  it("breaks ties by name so the order is stable", () => {
    const sorted = [
      v("Suzuki Wagon-R 1000", "1.0L petrol"),
      v("Kia Picanto 1000", "1.0L petrol"),
      v("Suzuki Cultus 1000", "1.0L petrol"),
    ].sort(byEngineSize);
    expect(sorted.map((x) => x.name)).toEqual([
      "Kia Picanto 1000",
      "Suzuki Cultus 1000",
      "Suzuki Wagon-R 1000",
    ]);
  });

  it("sorts the real sedan lineup into engine order", () => {
    const sorted = [
      v("Hyundai Sonata", "2.0L / 2.5L petrol"),
      v("Toyota Corolla Grande 1800CC", "1.8L petrol"),
      v("Honda City 1200", "1.2L i-VTEC"),
      v("Honda Civic VTi Oriel 1500", "1.5L VTEC Turbo"),
      v("Toyota Corolla XLI / GLI", "1.3L petrol"),
      v("Hyundai Elantra", "1.6L / 2.0L petrol"),
    ].sort(byEngineSize);
    expect(sorted.map((x) => x.name)).toEqual([
      "Honda City 1200",
      "Toyota Corolla XLI / GLI",
      "Honda Civic VTi Oriel 1500",
      "Hyundai Elantra",
      "Toyota Corolla Grande 1800CC",
      "Hyundai Sonata",
    ]);
  });
});
