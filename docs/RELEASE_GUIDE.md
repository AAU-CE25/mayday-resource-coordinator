# Release and Deployment Guide

This guide explains how to create releases that automatically deploy Docker images to AWS ECR.

## 🎯 Release Strategy

Docker images are automatically built and pushed to AWS ECR **only when you create a new GitHub release**. This ensures:
- ✅ Only tested, stable code is deployed
- ✅ Clear version tracking
- ✅ Rollback capability
- ✅ No accidental deployments

## 📦 Creating a Release

### Option 1: GitHub Web UI (Recommended)

1. **Go to your repository on GitHub**
   - Navigate to: `https://github.com/AAU-CE25/mayday-resource-coordinator`

2. **Click on "Releases"** (right sidebar)
   - Or go to: `https://github.com/AAU-CE25/mayday-resource-coordinator/releases`

3. **Click "Draft a new release"**

4. **Fill in the release details:**
   - **Tag version**: e.g., `v1.0.0`, `v1.2.3` (follow semantic versioning)
   - **Target**: Select the branch (usually `main` or `staging`)
   - **Release title**: e.g., "Release 1.0.0 - Initial Production Release"
   - **Description**: Add release notes (features, bug fixes, breaking changes)

5. **Choose release type:**
   - ✅ **Release** - For production-ready versions
   - ⚠️ **Pre-release** - For beta/RC versions (won't deploy to production)

6. **Click "Publish release"**

7. **Automatic deployment starts:**
   - Go to "Actions" tab to watch the deployment
   - All 3 services will be built and pushed to ECR

### Option 2: GitHub CLI

```bash
# Install GitHub CLI (if not already installed)
brew install gh

# Authenticate
gh auth login

# Create a release
gh release create v1.0.0 \
  --title "Release 1.0.0" \
  --notes "Initial production release with all core features"

# For pre-release
gh release create v1.0.0-beta \
  --title "Beta Release 1.0.0" \
  --notes "Beta version for testing" \
  --prerelease
```

### Option 3: Git Tags + GitHub UI

```bash
# Create and push a tag
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# Then go to GitHub → Releases → "Draft a new release"
# Select the tag you just pushed
```

## 🏷️ Version Tags

Your Docker images will be tagged with multiple versions:

| Release Tag | Docker Image Tags Created |
|-------------|---------------------------|
| `v1.2.3` | `1.2.3`, `1.2`, `1`, `latest` |
| `v2.0.0` | `2.0.0`, `2.0`, `2`, `latest` |
| `v1.5.0-beta` | `1.5.0-beta` (no `latest` tag) |

### Example:
For release `v1.2.3`, these images are created:
```
123456789012.dkr.ecr.us-east-1.amazonaws.com/api_service:1.2.3
123456789012.dkr.ecr.us-east-1.amazonaws.com/api_service:1.2
123456789012.dkr.ecr.us-east-1.amazonaws.com/api_service:1
123456789012.dkr.ecr.us-east-1.amazonaws.com/api_service:latest
```

## 📋 Semantic Versioning

Follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR** (v2.0.0): Breaking changes
- **MINOR** (v1.2.0): New features (backwards compatible)
- **PATCH** (v1.0.1): Bug fixes (backwards compatible)

### Examples:
- `v1.0.0` - Initial release
- `v1.1.0` - Added volunteer assignment feature
- `v1.1.1` - Fixed bug in volunteer assignment
- `v2.0.0` - Complete API redesign (breaking changes)

## 🔄 Release Workflow

```
┌─────────────────┐
│  Code Changes   │
│   (Pull Request)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Merge to      │
│   staging/main  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Release  │
│  (GitHub UI)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ GitHub Actions  │
│  Triggered      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build & Push    │
│   to AWS ECR    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Images Ready    │
│  for Deployment │
└─────────────────┘
```

## 🎬 Example Release Process

### 1. Prepare the release
```bash
# Make sure you're on the right branch
git checkout main
git pull origin main

# Verify everything works
docker compose build
docker compose up -d
# Test your application...
```

### 2. Create the release on GitHub
- Go to Releases → Draft a new release
- Tag: `v1.0.0`
- Title: "Release 1.0.0 - Initial Production Release"
- Description:
  ```markdown
  ## 🎉 Features
  - Emergency event management
  - Resource allocation system
  - Volunteer assignment tracking
  - Real-time dashboard
  
  ## 🐛 Bug Fixes
  - Fixed authentication issues
  - Improved error handling
  
  ## 📝 Notes
  - First production-ready release
  - All services containerized and tested
  ```

### 3. Monitor the deployment
```bash
# Watch the GitHub Actions workflow
# Go to: Actions → Build and Push to AWS ECR

# Or check from CLI
gh run list --workflow=deploy-to-ecr.yml
gh run watch
```

### 4. Verify images in ECR
```bash
# List images in ECR
aws ecr describe-images \
  --repository-name api_service \
  --region us-east-1

# Pull and test the image
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/api_service:1.0.0
```

## 🚨 Manual Deployment

If you need to deploy without creating a release:

```bash
# Go to GitHub → Actions → Build and Push to AWS ECR
# Click "Run workflow" → Select branch → Run

# Or use GitHub CLI
gh workflow run deploy-to-ecr.yml --ref main
```

## 🔙 Rollback Process

If something goes wrong with a release:

### Option 1: Deploy Previous Version
```bash
# Use the previous version tag
docker pull YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/api_service:1.0.0
```

### Option 2: Create a Hotfix Release
```bash
# Fix the issue in code
git checkout main
# ... make fixes ...
git commit -m "Hotfix: Critical bug fix"
git push

# Create hotfix release
gh release create v1.0.1 --title "Hotfix 1.0.1" --notes "Critical bug fix"
```

## 📊 Monitoring Releases

### View all releases:
```bash
gh release list
```

### View release details:
```bash
gh release view v1.0.0
```

### View deployment status:
```bash
gh run list --workflow=deploy-to-ecr.yml --limit 5
```

## ✅ Pre-Release Checklist

Before creating a production release:

- [ ] All tests pass (`pytest tests/ -v`)
- [ ] Code reviewed and merged to main
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version number decided
- [ ] Release notes prepared
- [ ] AWS credentials configured in GitHub Secrets
- [ ] Tested in staging environment

## 🔒 Security Notes

- Only maintainers should create releases
- Protect your `main` branch (Settings → Branches → Add rule)
- Review all changes before creating a release
- Use pre-releases for testing
- Keep AWS credentials secure

## 📚 Additional Resources

- [GitHub Releases Documentation](https://docs.github.com/en/repositories/releasing-projects-on-github)
- [Semantic Versioning](https://semver.org/)
- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🎯 Quick Commands Reference

```bash
# Create a release
gh release create v1.0.0 --title "Release 1.0.0" --notes "Release notes"

# List releases
gh release list

# View release
gh release view v1.0.0

# Delete release (if needed)
gh release delete v1.0.0

# Watch deployment
gh run watch

# List ECR images
aws ecr describe-images --repository-name api_service --region us-east-1
```
