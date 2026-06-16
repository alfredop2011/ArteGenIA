import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

const accountId = process.env.R2_ACCOUNT_ID!;
const accessKeyId = process.env.R2_ACCESS_KEY_ID!;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY!;
const bucket = process.env.R2_BUCKET_NAME!;
const publicUrl = process.env.R2_PUBLIC_URL!;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
  console.warn(
    "[r2] Variables de entorno R2 incompletas. Revisa .env.local: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL"
  );
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export type UploadResult = {
  key: string;
  url: string;
};

/**
 * Sube un buffer a R2 y devuelve la URL pública.
 * @param buffer  Contenido del archivo.
 * @param key     Ruta dentro del bucket (ej. "flyers/bg-1747-abc123.png").
 * @param contentType  Mime type (ej. "image/png").
 */
export async function uploadToR2(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType: string
): Promise<UploadResult> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    key,
    url: `${publicUrl}/${key}`,
  };
}

/**
 * Genera una key única para un asset de flyer.
 * @param folder  Subcarpeta dentro del bucket (ej. "bg", "artist").
 * @param ext     Extensión sin punto (ej. "png", "jpg").
 */
export function makeKey(folder: string, ext: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 10);
  return `flyers/${folder}/${ts}-${rand}.${ext}`;
}

/**
 * Borra un objeto de R2 por su key (Z.8.1 completing TODO).
 * No falla si la key no existe — R2 es idempotente en delete.
 * Llamar tras borrar la row de DB para evitar archivos huérfanos.
 */
export async function deleteFromR2(key: string): Promise<void> {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
