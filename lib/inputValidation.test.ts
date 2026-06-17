import { describe, it, expect } from "vitest";
import { validateImageUrl, validateContentLength, validateImageFile } from "./inputValidation";

describe("validateImageUrl (SSRF protection)", () => {
  // ─── URLs PERMITIDAS ──────────────────────────────────────────────────
  it.each([
    "https://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/foo.png",
    "https://tbuszlffgtjnbvkxhkti.supabase.co/storage/v1/object/public/x.png",
    "https://cdn.fal.media/some/file.jpg",
    "https://api.fal.run/generated/123.png",
  ])("acepta whitelist: %s", (url) => {
    expect(validateImageUrl(url)).toBeNull();
  });

  // ─── BLOQUEO HTTPS ────────────────────────────────────────────────────
  it("rechaza HTTP (no HTTPS)", () => {
    expect(validateImageUrl("http://pub-9dafc090b0534d8fabaaf9ccc21936a0.r2.dev/x.png"))
      .toContain("HTTPS");
  });

  it("rechaza protocolos exoticos", () => {
    expect(validateImageUrl("file:///etc/passwd")).toContain("HTTPS");
    expect(validateImageUrl("ftp://example.com")).toContain("HTTPS");
    expect(validateImageUrl("gopher://example.com")).toContain("HTTPS");
  });

  // ─── BLOQUEO SSRF — METADATA SERVERS ──────────────────────────────────
  it.each([
    "https://169.254.169.254/latest/meta-data/",   // AWS/Vercel metadata
    "https://169.254.169.254/",
    "https://127.0.0.1/admin",                      // localhost via IP
    "https://10.0.0.1/private",                     // RFC1918 privadas
    "https://192.168.1.1/router",                   // home network
    "https://172.16.0.1/internal",                  // RFC1918
  ])("rechaza IP literal SSRF: %s", (url) => {
    expect(validateImageUrl(url)).toContain("IPs");
  });

  // ─── BLOQUEO HOSTNAMES INTERNOS ───────────────────────────────────────
  it.each([
    "https://localhost/admin",
    "https://server.local/data",
    "https://api.internal/secret",
    "https://metadata.google.internal/computeMetadata/v1/",
  ])("rechaza hostname interno: %s", (url) => {
    const result = validateImageUrl(url);
    expect(result).toContain("interno");
  });

  // ─── BLOQUEO DOMINIOS NO PERMITIDOS ───────────────────────────────────
  it.each([
    "https://evil.com/payload",
    "https://attacker.example.com/x.png",
    "https://api.openai.com/v1/leak",
  ])("rechaza dominios no whitelist: %s", (url) => {
    expect(validateImageUrl(url)).toContain("no permitido");
  });

  // ─── URLS MALFORMADAS ─────────────────────────────────────────────────
  it("rechaza URL malformada", () => {
    expect(validateImageUrl("not-a-url")).toContain("inválida");
    expect(validateImageUrl("")).toContain("inválida");
  });

  // ─── BYPASS ATTEMPTS ─────────────────────────────────────────────────
  it("no se deja engañar con subdominios falsos", () => {
    // evil.com.fal.media NO es *.fal.media (sufijo real)
    // pero validamos con endsWith → si alguien registra "x.fal.media" SI passa
    // Esto es OK porque el atacante necesitaria registrar un subdominio
    // legítimo de fal.media, que no puede.
    expect(validateImageUrl("https://evil-fal.media/x")).toContain("no permitido");
  });

  it("acepta path traversal en URL valida (el server filesystem es otro nivel)", () => {
    // No es trabajo de validateImageUrl prevenir path traversal en el server
    // remoto; solo restringe el HOST. Path/query libres.
    expect(validateImageUrl("https://cdn.fal.media/../etc/passwd")).toBeNull();
  });

  // ─── HARDENING 2026-06-17 ─────────────────────────────────────────────
  it("rechaza credenciales embebidas (userinfo @host)", () => {
    // El host efectivo es 169.254.169.254, no el host de confianza del userinfo
    expect(validateImageUrl("https://cdn.fal.media@169.254.169.254/x"))
      .toContain("Credenciales");
  });

  it.each([
    "https://2130706433/x",        // 127.0.0.1 en entero decimal
    "https://0x7f000001/x",        // 127.0.0.1 en hex
    "https://017700000001/x",      // octal
  ])("rechaza IP en codificacion alternativa: %s", (url) => {
    expect(validateImageUrl(url)).toContain("IPs");
  });
});

describe("validateContentLength", () => {
  it("acepta header null (no podemos saber)", () => {
    expect(validateContentLength(null)).toBeNull();
  });

  it("acepta tamaño bajo limite", () => {
    expect(validateContentLength(String(1024 * 1024))).toBeNull(); // 1MB
  });

  it("rechaza tamaño sobre limite", () => {
    const tooBig = String(20 * 1024 * 1024); // 20MB
    const err = validateContentLength(tooBig);
    expect(err).toContain("demasiado grande");
  });

  it("respeta limite custom", () => {
    expect(validateContentLength(String(2 * 1024 * 1024), 1024 * 1024)).toContain("demasiado grande");
  });
});

describe("validateImageFile (magic numbers)", () => {
  // Helper: crea un File mock con bytes especificos
  const makeFile = (bytes: number[], name = "x.png"): File => {
    const u8 = new Uint8Array(bytes);
    return new File([u8.buffer], name, { type: "image/png" });
  };

  it("acepta PNG valido", async () => {
    // 89 50 4E 47 0D 0A 1A 0A
    const png = makeFile([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    expect(await validateImageFile(png)).toBeNull();
  });

  it("acepta JPEG valido", async () => {
    // FF D8 FF
    const jpeg = makeFile([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    expect(await validateImageFile(jpeg)).toBeNull();
  });

  it("acepta GIF valido", async () => {
    // 47 49 46 38 (GIF8)
    const gif = makeFile([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0]);
    expect(await validateImageFile(gif)).toBeNull();
  });

  it("acepta WEBP valido", async () => {
    // 52 49 46 46 _ _ _ _ 57 45 42 50 (RIFF...WEBP)
    const webp = makeFile([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);
    expect(await validateImageFile(webp)).toBeNull();
  });

  it("rechaza .exe disfrazado de PNG", async () => {
    // MZ header de executable Windows con extension .png
    const fakeExe = makeFile([0x4d, 0x5a, 0x90, 0x00, 0, 0, 0, 0, 0, 0, 0, 0], "evil.png");
    const err = await validateImageFile(fakeExe);
    expect(err).toContain("Formato");
  });

  it("rechaza HTML disfrazado de imagen", async () => {
    // <!DOCTYPE html (anti XSS via SVG/HTML)
    const html = makeFile([0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45, 0, 0, 0]);
    const err = await validateImageFile(html);
    expect(err).toContain("Formato");
  });

  it("rechaza archivo > 10MB", async () => {
    const bigFile = {
      size: 15 * 1024 * 1024, // 15MB
      slice: () => ({ arrayBuffer: async () => new ArrayBuffer(12) }),
    } as unknown as File;
    const err = await validateImageFile(bigFile);
    expect(err).toContain("demasiado grande");
  });
});
