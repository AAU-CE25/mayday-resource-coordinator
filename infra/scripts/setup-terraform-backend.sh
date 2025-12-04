#!/bin/bash
set -e

# Configuration
BUCKET_NAME="mayday-terraform-state-390299133544"
DYNAMODB_TABLE="mayday-terraform-locks"
AWS_REGION="eu-central-1"

echo "Setting up Terraform S3 backend..."
echo "Bucket: $BUCKET_NAME"
echo "DynamoDB Table: $DYNAMODB_TABLE"
echo "Region: $AWS_REGION"
echo ""

# Create S3 bucket
echo "1. Creating S3 bucket..."
if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
    aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
    echo "✓ Bucket created"
else
    echo "✓ Bucket already exists"
fi

# Enable versioning
echo "2. Enabling versioning..."
aws s3api put-bucket-versioning \
    --bucket "$BUCKET_NAME" \
    --versioning-configuration Status=Enabled
echo "✓ Versioning enabled"

# Enable server-side encryption
echo "3. Enabling encryption..."
aws s3api put-bucket-encryption \
    --bucket "$BUCKET_NAME" \
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            },
            "BucketKeyEnabled": true
        }]
    }'
echo "✓ Encryption enabled"

# Block public access
echo "4. Blocking public access..."
aws s3api put-public-access-block \
    --bucket "$BUCKET_NAME" \
    --public-access-block-configuration \
        "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
echo "✓ Public access blocked"

# Add bucket policy for state file access
echo "5. Adding bucket policy..."
cat > /tmp/terraform-state-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "EnforcedTLS",
            "Effect": "Deny",
            "Principal": "*",
            "Action": "s3:*",
            "Resource": [
                "arn:aws:s3:::${BUCKET_NAME}",
                "arn:aws:s3:::${BUCKET_NAME}/*"
            ],
            "Condition": {
                "Bool": {
                    "aws:SecureTransport": "false"
                }
            }
        }
    ]
}
EOF

aws s3api put-bucket-policy \
    --bucket "$BUCKET_NAME" \
    --policy file:///tmp/terraform-state-policy.json
rm /tmp/terraform-state-policy.json
echo "✓ Bucket policy applied"

# Create DynamoDB table for state locking
echo "6. Creating DynamoDB table for state locking..."
if aws dynamodb describe-table --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION" 2>&1 | grep -q 'ResourceNotFoundException'; then
    aws dynamodb create-table \
        --table-name "$DYNAMODB_TABLE" \
        --attribute-definitions AttributeName=LockID,AttributeType=S \
        --key-schema AttributeName=LockID,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --region "$AWS_REGION" \
        --tags Key=Project,Value=Mayday Key=ManagedBy,Value=Terraform
    
    echo "Waiting for table to be active..."
    aws dynamodb wait table-exists --table-name "$DYNAMODB_TABLE" --region "$AWS_REGION"
    echo "✓ DynamoDB table created"
else
    echo "✓ DynamoDB table already exists"
fi

echo ""
echo "✅ Terraform backend setup complete!"
echo ""
echo "Next steps:"
echo "1. Comment out the backend block in main.tf (temporarily)"
echo "2. Run: cd ../terraform && terraform init"
echo "3. Uncomment the backend block in main.tf"
echo "4. Run: terraform init -migrate-state"
echo "5. Confirm migration when prompted"
echo ""
echo "Note: The backend block is already uncommented in main.tf"
echo "If this is your first time, you may need to comment it out temporarily."
