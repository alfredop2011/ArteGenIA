import { fal } from "@fal-ai/client";

if (!process.env.FAL_KEY) {
  console.warn("[falai] FAL_KEY no está definida en .env.local");
}

fal.config({
  credentials: process.env.FAL_KEY,
});

export type FlyerFormat = "instagram" | "historia" | "cuadrado" | "evento";

/**
 * Tamaños de imagen para Fal.ai por formato de flyer.
 * Coinciden visualmente con los del canvas pero a mayor resolución.
 */
const FORMAT_IMAGE_SIZE: Record<FlyerFormat, { width: number; height: number }> = {
  instagram: { width: 1024, height: 1280 }, // 4:5
  historia: { width: 1024, height: 1820 },  // 9:16
  cuadrado: { width: 1024, height: 1024 },  // 1:1
  evento: { width: 1820, height: 1024 },    // 16:9
};

type PromptInput = {
  userPrompt: string;
  style: string;
  paletteColors: string[];
  format: FlyerFormat;
};

/**
 * Construye el prompt para FLUX schnell a partir del input del usuario.
 */
function buildPrompt({ userPrompt, style, paletteColors }: PromptInput): string {
  const styleHint: Record<string, string> = {
    minimalista: "minimalist, clean composition, lots of negative space",
    elegante: "elegant, refined, sophisticated, high-end",
    moderno: "modern, contemporary, bold, dynamic",
    retro: "retro, vintage, 70s 80s aesthetic, grainy",
    vibrante: "vibrant, energetic, colorful, eye-catching",
    oscuro: "dark, moody, dramatic lighting, cinematic",
    futurista: "futuristic, sci-fi, neon, cyberpunk",
    organico: "organic shapes, natural, flowing, soft",
  };

  const styleStr = styleHint[style?.toLowerCase()] ?? style ?? "modern";
  const colorStr = paletteColors?.length
    ? `dominant colors: ${paletteColors.slice(0, 4).join(", ")}`
    : "";

  return [
    userPrompt,
    styleStr,
    colorStr,
    "abstract background composition for poster, atmospheric lighting, depth, mood",
    // Negative prompts reforzados (FLUX schnell no tiene neg prompt nativo, se enfatiza por repetición)
    "NO TEXT, NO LETTERS, NO WORDS, NO TYPOGRAPHY, NO FONTS",
    "no logos, no signage, no banners, no posters, no flags, no labels",
    "no people, no faces, no human figures, no portraits, no hands",
    "no numbers, no symbols, no characters, no calligraphy, no graffiti tags",
    "clean abstract aesthetic, pure visual atmosphere, no readable elements",
    "professional poster background, high quality, sharp details, photographic depth",
  ]
    .filter(Boolean)
    .join(", ");
}

export type GenerateBgResult = {
  imageUrl: string;
  width: number;
  height: number;
  prompt: string;
};

/**
 * Genera una imagen de fondo con FLUX schnell de Fal.ai.
 */
export async function generateBackground(input: PromptInput): Promise<GenerateBgResult> {
  const prompt = buildPrompt(input);
  const size = FORMAT_IMAGE_SIZE[input.format] ?? FORMAT_IMAGE_SIZE.instagram;

  const result = await fal.subscribe("fal-ai/flux/schnell", {
    input: {
      prompt,
      image_size: size,
      num_inference_steps: 4,
      num_images: 1,
      enable_safety_checker: true,
    },
    logs: false,
  });

  // result.data.images es un array; tomamos la primera
  const images = (result as { data?: { images?: Array<{ url: string }> } })?.data?.images;
  const imageUrl = images?.[0]?.url;

  if (!imageUrl) {
    throw new Error("Fal.ai no devolvió ninguna imagen");
  }

  return {
    imageUrl,
    width: size.width,
    height: size.height,
    prompt,
  };
}
