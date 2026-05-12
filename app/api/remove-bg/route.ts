import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { imageBase64 } = await req.json();

        if (!imageBase64) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");

        // Verificar que el buffer tiene tamaño razonable
        console.log("Image buffer size:", buffer.length);

        const formData = new FormData();
        const blob = new Blob([buffer], { type: "image/png" });
        formData.append("image_file", blob, "image.png");
        formData.append("size", "auto");
        formData.append("type", "auto");

        const response = await fetch("https://api.remove.bg/v1.0/removebg", {
            method: "POST",
            headers: {
                "X-Api-Key": process.env.REMOVE_BG_API_KEY ?? "",
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("remove.bg status:", response.status, "error:", error);
            return NextResponse.json(
                { error: `remove.bg error ${response.status}: ${error}` },
                { status: 500 }
            );
        }

        const arrayBuffer = await response.arrayBuffer();
        const resultBase64 = Buffer.from(arrayBuffer).toString("base64");

        return NextResponse.json({
            result: `data:image/png;base64,${resultBase64}`,
        });
    } catch (e) {
        console.error("remove-bg route error:", e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
