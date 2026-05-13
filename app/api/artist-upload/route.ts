import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("photo") as File | null;
    const token = formData.get("token") as string | null;
    if (!file || !token) return NextResponse.json({ error: "Falta foto o token" }, { status: 400 });
    if (!file.type.startsWith("image/")) return NextResponse.json({ error: "Solo imágenes" }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return NextResponse.json({ error: "Máximo 15MB" }, { status: 400 });
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;
    return NextResponse.json({ ok: true, token, fileName: file.name, fileSize: file.size, dataUrl, uploadedAt: new Date().toISOString() });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Error al procesar" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectName = searchParams.get("project") ?? "mi-evento";
  const creatorName = searchParams.get("creator") ?? "ArteGenIA";
  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return NextResponse.json({
    token,
    url: `${req.nextUrl.origin}/upload/${token}?project=${encodeURIComponent(projectName)}&creator=${encodeURIComponent(creatorName)}`,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
}
