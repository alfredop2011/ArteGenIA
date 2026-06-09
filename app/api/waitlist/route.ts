import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * POST /api/waitlist
 *
 * Apunta a un user a la lista de espera de un plan pago. Sirve para validar
 * interes ANTES de implementar checkout real (LemonSqueezy/Stripe).
 *
 * Body: { email, plan: "pro" | "business", cycle?: "monthly" | "annual", notes? }
 *
 * Comportamiento:
 *  - Si email ya esta en la lista para ese plan → 200 OK con flag "already" true
 *  - Si es nuevo → insert + 200 OK con "ok: true"
 *  - Si user esta logueado, asociamos user_id automaticamente
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      email?: string;
      plan?: string;
      cycle?: string;
      notes?: string;
    };

    // Validacion
    const email = body.email?.trim().toLowerCase();
    const plan = body.plan?.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }
    if (!plan || !["pro", "business"].includes(plan)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }
    if (body.cycle && !["monthly", "annual"].includes(body.cycle)) {
      return NextResponse.json({ error: "Cycle inválido" }, { status: 400 });
    }

    // User opcional
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Insert (puede fallar por unique index → ya estaba)
    const { error } = await supabaseAdmin.from("waitlist").insert({
      email,
      user_id: user?.id ?? null,
      plan,
      cycle: body.cycle ?? null,
      notes: body.notes?.slice(0, 1000) ?? null,
    });

    if (error) {
      // 23505 = unique_violation (ya esta en la lista)
      if (error.code === "23505") {
        return NextResponse.json({ ok: true, already: true });
      }
      console.error("[waitlist] insert error:", error);
      return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[waitlist] unexpected:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
