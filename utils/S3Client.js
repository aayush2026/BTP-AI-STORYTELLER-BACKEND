import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";

dotenv.config();

// Initialize S3 Client
export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Generate a pre-signed GET URL to retrieve an object from S3
 * @param {string} key - The S3 object key (path)
 * @param {number} expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Pre-signed GET URL
 */
export async function getObjectUrl(key, expiresIn = 3600) {
  const cdnBase = process.env.CDN_BASE_URL;

  if (cdnBase){
    // Normalize to avoid double/missing slashes
    const base = cdnBase.replace(/\/+$/, "");
    const path = String(key || "").replace(/^\/+/, "");
    return `${base}/${path}`;
  }

  // Fallback to direct S3 access if CDN not configured
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Generate a pre-signed PUT URL to upload an object directly to S3
 * @param {string} filename - The filename to use in S3
 * @param {string} contentType - MIME type of the file (e.g., 'audio/wav')
 * @param {number} expiresIn - URL expiration time in seconds (default: 5 minutes)
 * @returns {Promise<{uploadUrl: string, key: string}>} Pre-signed PUT URL and S3 key
 */
export async function getUploadUrl(filename, contentType = "audio/wav", expiresIn = 300) {
  const key = `uploads/audio/${Date.now()}-${filename}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  
  return { uploadUrl, key };
}

console.log("✅ S3 Client configured successfully");
console.log(`   Bucket: ${process.env.S3_BUCKET_NAME}`);
console.log(`   Region: ${process.env.AWS_REGION}`);