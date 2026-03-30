import { s3 } from "../../lib/s3.js";
import { PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from "sharp";

const uploadFile = async (fileBuffer, fileName, mimeType) => {
  // compress image using sharp
  const compressedBuffer = await sharp(fileBuffer)
    .resize({ width: 1024 }) // Resize to a max width of 1024px
    .jpeg({ quality: 80 }) // Compress to 80% quality
    .toBuffer();
    

  const key = `attendance/${Date.now()}-${fileName}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
    Body: compressedBuffer,
    ContentType: mimeType,
  };
  await s3.send(new PutObjectCommand(params));
  return key;
};

const getPresignedUrl = async (key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });
  return await getSignedUrl(s3, command, { expiresIn: 3600 });
};

export async function batchPresignUrls(keys) {
  const unique = [...new Set(keys.filter(Boolean))]; // dedupe + drop nulls

  const entries = await Promise.all(
    unique.map(async (key) => {
      const url = await getPresignedUrl(key);
      return [key, url];
    })
  );

  return new Map(entries);
}

export { uploadFile, getPresignedUrl };