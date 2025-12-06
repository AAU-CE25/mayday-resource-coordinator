# Documentation Updates - December 5, 2025

This document summarizes all documentation updates made to reflect recent infrastructure and configuration changes.

## ✅ Changes Made

### 1. **Updated Path References**
Changed all references from `/volunteer` to `/suv` to match actual ALB routing configuration.

**Files Updated:**
- `.github/workflows/README.md`
- `infra/QUICK_REFERENCE.md`
- `infra/DEPLOYMENT_GUIDE.md`
- `infra/TESTING_WORKFLOWS.md`
- `infra/CHANGES_SUMMARY.md`
- `infra/terraform/README.md`

### 2. **Added API_URL Configuration Requirements**

**New Documentation:**
- `API_URL` **must** include protocol (`http://` or `https://`)
- `API_URL` should **not** have trailing slash
- Builds will fail with clear error if misconfigured
- Added to GitHub Variables section (not Secrets)

**Files Updated:**
- `.github/workflows/README.md`
- `infra/QUICK_REFERENCE.md`
- `infra/CHANGES_SUMMARY.md`
- `infra/terraform/README.md`

### 3. **Added Next.js basePath Configuration**

**New Documentation:**
- Frontend requires `basePath: '/dashboard'` in `next.config.ts`
- SUV UI requires `basePath: '/suv'` in `next.config.ts`
- Docker images must be rebuilt after changing basePath
- These must match ALB path routing rules

**Files Updated:**
- `infra/QUICK_REFERENCE.md`
- `infra/CHANGES_SUMMARY.md`
- `infra/terraform/README.md`

### 4. **Added PORT Environment Variable Documentation**

**New Documentation:**
- SUV UI requires `PORT=3030` environment variable
- Set in Terraform task definition
- Ensures Next.js listens on correct port
- Fixes 502 Bad Gateway errors

**Files Updated:**
- `infra/CHANGES_SUMMARY.md`
- `infra/terraform/README.md`

### 5. **Updated Service Access URLs**

**Old:**
```
Frontend: Extract from ECS task
SUV UI: Extract from ECS task
```

**New:**
```
Frontend: http://<alb-dns>/dashboard (via ALB)
SUV UI: http://<alb-dns>/suv (via ALB)
```

**Files Updated:**
- `infra/terraform/README.md`

### 6. **Added GitHub Secrets vs Variables Distinction**

**New Documentation:**
- Separated Secrets from Variables
- `API_URL` is a Variable (not a Secret)
- `AWS_ACCOUNT_ID` is a Variable (not a Secret)
- Clearer instructions for GitHub Actions configuration

**Files Updated:**
- `.github/workflows/README.md`
- `infra/terraform/README.md`

### 7. **Added Recent Fixes Section**

**New Documentation:**
Added "Recently Fixed Issues" section documenting:
- SUV UI 502 Bad Gateway fix
- Frontend static asset 404 fix  
- API URL duplication fix
- Routing configuration fix

**Files Updated:**
- `infra/CHANGES_SUMMARY.md`

### 8. **Enhanced Troubleshooting Sections**

**New Troubleshooting Items:**
- API URL errors
- SUV UI port mismatch
- Static asset loading issues
- Protocol validation errors

**Files Updated:**
- `.github/workflows/README.md`

### 9. **Updated Testing Checklists**

**New Test Cases:**
- Verify static assets load (no 404 for JS/CSS files)
- Verify API calls work from frontend/SUV UI
- Check API URL includes protocol

**Files Updated:**
- `infra/TESTING_WORKFLOWS.md`
- `infra/CHANGES_SUMMARY.md`

## 📋 Summary of Key Changes

| Topic | Old Info | New Info |
|-------|----------|----------|
| SUV UI Path | `/volunteer` | `/suv` |
| API_URL | Not specified | Must include `http://` or `https://` |
| Frontend Config | Not documented | `basePath: '/dashboard'` required |
| SUV UI Config | Not documented | `basePath: '/suv'` required |
| SUV UI Port | Not documented | `PORT=3030` required |
| Service Access | Via ECS task IPs | Via ALB path routing |

## 🎯 Impact

These documentation updates ensure:
- ✅ Accurate deployment instructions
- ✅ Clear configuration requirements
- ✅ Proper troubleshooting guidance
- ✅ Updated testing procedures
- ✅ Correct URL references throughout

## 📁 Files Modified

1. `.github/workflows/README.md`
2. `infra/QUICK_REFERENCE.md`
3. `infra/DEPLOYMENT_GUIDE.md`
4. `infra/TESTING_WORKFLOWS.md`
5. `infra/CHANGES_SUMMARY.md`
6. `infra/terraform/README.md`

## ⚠️ Important Notes for Users

If following old documentation:
1. Use `/suv` instead of `/volunteer` for SUV UI
2. Ensure `API_URL` includes protocol in GitHub variables
3. Add `basePath` to both Next.js configs
4. Rebuild Docker images after configuration changes
5. Verify `PORT=3030` is set in SUV UI task definition

## ✅ Verification

All documentation now:
- Uses correct path `/suv` for SUV UI
- Specifies API_URL protocol requirement
- Documents basePath configuration
- Includes PORT environment variable
- Shows correct access URLs via ALB

---

**Date**: December 5, 2025  
**Status**: ✅ Complete  
**Version**: 2.0
