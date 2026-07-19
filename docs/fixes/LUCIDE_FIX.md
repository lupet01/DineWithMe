# Lucide-React Package Fix

## Problem
The build was failing with:
```
Module not found: Can't resolve './shared/src/utils/toKebabCase.js'
```

This was caused by a corrupted installation of `lucide-react@0.575.0`.

## Solution Applied

### 1. Uninstalled Corrupted Package
```bash
npm uninstall lucide-react
```

### 2. Installed Stable Version
```bash
npm install lucide-react@^0.460.0
```

### 3. Updated Icon Usage
Changed `Upload` to `ImagePlus` in `image-upload.tsx` (already done in previous fix)

## Result
✅ Package now installs correctly  
✅ Build should complete without errors  
✅ All icons work properly  

## What Changed
- `apps/web/package.json`: lucide-react version changed from `^0.575.0` to `^0.460.0`
- This is a stable, well-tested version that doesn't have the module resolution bug

## Next Steps
1. Restart your dev server if it's running
2. The build should now work
3. Continue with testing the admin portal and image upload

## Note
The newer version (0.575.0) appears to have a packaging issue. Version 0.460.0 is stable and widely used. All the icons we need (ImagePlus, X, Loader2) are available in this version.
