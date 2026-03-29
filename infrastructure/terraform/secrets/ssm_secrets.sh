#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Store application secrets in AWS SSM Parameter Store (SecureString).
# SecureString uses the default KMS key at no extra cost within free tier.
#
# Usage:
#   chmod +x ssm_secrets.sh
#   ENV=staging   ./ssm_secrets.sh
#   ENV=production ./ssm_secrets.sh
#
# Requirements: AWS CLI configured with appropriate permissions.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

ENV="${ENV:-staging}"
REGION="${AWS_REGION:-us-east-1}"
PREFIX="/chathub/${ENV}"

put_param() {
  local name="$1"
  local value="$2"
  aws ssm put-parameter \
    --region "${REGION}" \
    --name "${PREFIX}/${name}" \
    --type "SecureString" \
    --value "${value}" \
    --overwrite \
    --tags "Key=Project,Value=chathub" "Key=Environment,Value=${ENV}"
  echo "  ✓ ${PREFIX}/${name}"
}

echo "Writing secrets to SSM Parameter Store [${ENV}]..."

# MongoDB Atlas connection string
put_param "MONGO_URI"               "${MONGO_URI:?MONGO_URI is required}"

# JWT — generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
put_param "JWT_SECRET"              "${JWT_SECRET:?JWT_SECRET is required}"

# Cloudinary (free tier: 25 credits/month, 25 GB storage)
put_param "CLOUDINARY_CLOUD_NAME"   "${CLOUDINARY_CLOUD_NAME:?required}"
put_param "CLOUDINARY_API_KEY"      "${CLOUDINARY_API_KEY:?required}"
put_param "CLOUDINARY_API_SECRET"   "${CLOUDINARY_API_SECRET:?required}"

echo ""
echo "All secrets written to ${PREFIX}/*"
echo "ECS task definition will read them via the 'secrets' block."
