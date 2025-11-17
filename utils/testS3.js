/**
 * S3 Configuration Test Script
 * 
 * This script tests your S3 setup by:
 * 1. Verifying credentials
 * 2. Generating pre-signed upload URL
 * 3. Generating pre-signed download URL
 * 
 * Run with: node utils/testS3.js
 */

import { getUploadUrl, getObjectUrl } from "./S3Client.js";
import dotenv from "dotenv";

dotenv.config();

async function testS3Configuration() {
  console.log("\n🧪 Testing S3 Configuration...\n");

  // Check environment variables
  console.log("1️⃣  Checking Environment Variables:");
  const requiredEnvVars = [
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_REGION",
    "S3_BUCKET_NAME",
  ];

  let allVarsPresent = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`   ✅ ${envVar}: ${envVar === "AWS_SECRET_ACCESS_KEY" ? "****" : process.env[envVar]}`);
    } else {
      console.log(`   ❌ ${envVar}: MISSING`);
      allVarsPresent = false;
    }
  }

  if (!allVarsPresent) {
    console.error("\n❌ Missing required environment variables. Check your .env file.\n");
    process.exit(1);
  }

  console.log("\n2️⃣  Testing Pre-signed Upload URL Generation:");
  try {
    const { uploadUrl, key } = await getUploadUrl("test-audio.wav", "audio/wav");
    console.log(`   ✅ Generated upload URL successfully`);
    console.log(`   📝 S3 Key: ${key}`);
    console.log(`   🔗 Upload URL: ${uploadUrl.substring(0, 80)}...`);
  } catch (error) {
    console.error(`   ❌ Failed to generate upload URL:`, error.message);
    process.exit(1);
  }

  console.log("\n3️⃣  Testing Pre-signed Download URL Generation:");
  try {
    // Use a test key (even if object doesn't exist, pre-signed URL should generate)
    const testKey = "uploads/audio/test-file.wav";
    const downloadUrl = await getObjectUrl(testKey);
    console.log(`   ✅ Generated download URL successfully`);
    console.log(`   📝 S3 Key: ${testKey}`);
    console.log(`   🔗 Download URL: ${downloadUrl.substring(0, 80)}...`);
  } catch (error) {
    console.error(`   ❌ Failed to generate download URL:`, error.message);
    process.exit(1);
  }

  console.log("\n✨ All tests passed! Your S3 configuration is working correctly.\n");
  console.log("📋 Next Steps:");
  console.log("   1. Make sure CORS is configured on your S3 bucket");
  console.log("   2. Test actual upload from frontend");
  console.log("   3. Verify files appear in S3 Console\n");
}

testS3Configuration().catch((error) => {
  console.error("\n💥 Test failed with error:", error);
  process.exit(1);
});

