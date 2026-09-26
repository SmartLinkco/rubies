import {
  CreateBucketCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomBytes } from "node:crypto";
import { AppError } from "../middleware/error.js";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const SIGNED_GET_TTL = 60 * 60 * 6; // 6 hours

let client: S3Client | null = null;
let bucketReady: Promise<void> | null = null;

export function isStorageConfigured() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_ENDPOINT_URL_S3 &&
      process.env.NEON_STORAGE_BUCKET,
  );
}

function getBucket() {
  const bucket = process.env.NEON_STORAGE_BUCKET?.trim();
  if (!bucket) {
    throw new AppError(
      503,
      "STORAGE_NOT_CONFIGURED",
      "Neon object storage is not configured",
    );
  }
  return bucket;
}

function getClient() {
  if (!isStorageConfigured()) {
    throw new AppError(
      503,
      "STORAGE_NOT_CONFIGURED",
      "Neon object storage is not configured. Add AWS_* and NEON_STORAGE_BUCKET to apps/api/.env",
    );
  }

  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION || "us-east-2",
      endpoint: process.env.AWS_ENDPOINT_URL_S3,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      requestChecksumCalculation: "WHEN_REQUIRED",
    });
  }

  return client;
}

function extensionFor(contentType: string) {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

function slugifyFilename(name: string) {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function canonicalObjectUrl(key: string) {
  const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "");
  const bucket = getBucket();
  const publicBase = process.env.NEON_STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "");
  if (publicBase) {
    return `${publicBase}/${key}`;
  }
  return `${endpoint}/${bucket}/${key}`;
}

/** @deprecated use canonicalObjectUrl */
export function publicObjectUrl(key: string) {
  return canonicalObjectUrl(key);
}

function extractStorageKey(url: string): string | null {
  if (!isStorageConfigured()) return null;
  try {
    const endpoint = process.env.AWS_ENDPOINT_URL_S3!.replace(/\/$/, "");
    const bucket = getBucket();
    const prefixes = [
      `${endpoint}/${bucket}/`,
      process.env.NEON_STORAGE_PUBLIC_BASE_URL
        ? `${process.env.NEON_STORAGE_PUBLIC_BASE_URL.replace(/\/$/, "")}/`
        : null,
    ].filter(Boolean) as string[];

    for (const prefix of prefixes) {
      if (url.startsWith(prefix)) {
        return decodeURIComponent(url.slice(prefix.length).split("?")[0]!);
      }
    }

    // Already a raw key
    if (url.startsWith("menu/")) return url.split("?")[0]!;
  } catch {
    return null;
  }
  return null;
}

export function normalizeStoredImageUrl(url: string | null | undefined) {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  const key = extractStorageKey(trimmed);
  if (key && isStorageConfigured()) {
    return canonicalObjectUrl(key);
  }
  return trimmed;
}

export async function resolveStoredImageUrl(url: string | null | undefined) {
  if (!url) return null;
  if (!isStorageConfigured()) return url;

  const key = extractStorageKey(url);
  if (!key) return url;

  try {
    return await getSignedUrl(
      getClient(),
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
      { expiresIn: SIGNED_GET_TTL },
    );
  } catch {
    return url;
  }
}

export async function withSignedMenuImage<T extends { imageUrl: string | null }>(
  item: T,
): Promise<T> {
  return {
    ...item,
    imageUrl: await resolveStoredImageUrl(item.imageUrl),
  };
}

async function ensureBucket() {
  if (bucketReady) return bucketReady;

  bucketReady = (async () => {
    const s3 = getClient();
    const bucket = getBucket();
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch {
      await s3.send(new CreateBucketCommand({ Bucket: bucket }));
    }
  })();

  return bucketReady;
}

export async function createMenuImageUpload(opts: {
  contentType: string;
  filename?: string;
}) {
  if (!ALLOWED_TYPES.has(opts.contentType)) {
    throw new AppError(
      400,
      "INVALID_IMAGE_TYPE",
      "Use JPEG, PNG, WebP, or GIF images",
    );
  }

  await ensureBucket();

  const bucket = getBucket();
  const base = slugifyFilename(opts.filename || "dish") || "dish";
  const key = `menu/${base}-${Date.now().toString(36)}-${randomBytes(3).toString("hex")}.${extensionFor(opts.contentType)}`;

  const uploadUrl = await getSignedUrl(
    getClient(),
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: opts.contentType,
    }),
    { expiresIn: 300 },
  );

  const publicUrl = canonicalObjectUrl(key);
  const displayUrl = await resolveStoredImageUrl(publicUrl);

  return {
    key,
    uploadUrl,
    method: "PUT" as const,
    headers: { "Content-Type": opts.contentType },
    publicUrl,
    displayUrl: displayUrl ?? publicUrl,
    expiresInSeconds: 300,
  };
}

export function getStorageStatus() {
  return {
    configured: isStorageConfigured(),
    bucket: process.env.NEON_STORAGE_BUCKET ?? null,
    region: process.env.AWS_REGION ?? null,
  };
}
