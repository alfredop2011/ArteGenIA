import { describe, it, expect } from "vitest";
import { isAdmin, ADMIN_EMAILS } from "./admin";

describe("isAdmin (admin gating)", () => {
  it("admin email reconocido", () => {
    expect(isAdmin("alfredop2011@gmail.com")).toBe(true);
    expect(isAdmin("hola@artegenia.com")).toBe(true);
  });

  it("case-insensitive", () => {
    expect(isAdmin("ALFREDOP2011@GMAIL.COM")).toBe(true);
    expect(isAdmin("AlfredoP2011@Gmail.Com")).toBe(true);
  });

  it("no admin → false", () => {
    expect(isAdmin("random@example.com")).toBe(false);
  });

  it("null/undefined no rompe", () => {
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("string vacia → false (no falso positivo)", () => {
    expect(isAdmin("")).toBe(false);
  });

  it("ADMIN_EMAILS contiene al menos 1 email", () => {
    expect(ADMIN_EMAILS.size).toBeGreaterThan(0);
  });
});
