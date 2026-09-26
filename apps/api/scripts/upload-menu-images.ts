import "dotenv/config";
import { readFileSync } from "node:fs";
import { basename, join } from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const dishes = [
  { slug: "jollof-rice", file: "jollof-rice.png" },
  { slug: "fufu-and-soup", file: "fufu-and-soup.png" },
  { slug: "banku-and-soup", file: "banku-and-soup.png" },
  { slug: "grilled-chicken", file: "grilled-chicken.png" },
] as const;

async function main() {
  const bucket = process.env.NEON_STORAGE_BUCKET;
  const endpoint = process.env.AWS_ENDPOINT_URL_S3?.replace(/\/$/, "");
  if (!bucket || !endpoint || !process.env.AWS_ACCESS_KEY_ID) {
    throw new Error("Neon storage env vars missing");
  }

  const client = new S3Client({
    region: process.env.AWS_REGION || "us-east-2",
    endpoint,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
  });

  const dir = join(process.cwd(), "../web/public/menu");

  for (const dish of dishes) {
    const filePath = join(dir, dish.file);
    const body = readFileSync(filePath);
    const key = `menu/${dish.file}`;
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: "image/png",
      }),
    );
    const imageUrl = `${endpoint}/${bucket}/${key}`;
    await prisma.menuItem.update({
      where: { slug: dish.slug },
      data: { imageUrl },
    });
    console.log("ok", dish.slug, imageUrl, `(${basename(filePath)}, ${body.length} bytes)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
