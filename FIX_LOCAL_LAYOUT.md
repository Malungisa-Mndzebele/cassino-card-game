# Fix Local Layout to Match Production

## Problem
Local development shows single-column layout, but production shows two-column layout with "How to Play" section.

## Root Cause
Tailwind CSS responsive classes (`md:grid-cols-2`, `md:block`) weren't being compiled correctly in dev mode.

## Fix Applied

1. **Updated `tailwind.config.js`**:
   - Added explicit screen breakpoints
   - Ensured all file paths are included in content array
   - Fixed duplicate theme entries

2. **Updated `App.tsx`**:
   - Changed `hidden md:block` to `w-full md:block` to ensure element is always visible for testing
   - The grid layout uses `grid grid-cols-1 md:grid-cols-2` which is correct

## Steps to Apply Fix

1. **Stop dev server** (Ctrl+C)

2. **Restart dev server**:
```powershell
npm run dev
```

3. **Clear browser cache and hard refresh**:
   - Open `http://localhost:5173/cassino/`
   - Press `Ctrl+Shift+R` (hard refresh)

4. **Verify browser width**:
   - Ensure browser window is wider than 768px (md breakpoint)
   - The two-column layout should appear automatically

## Expected Result

- **Mobile (< 768px)**: Single column with RoomManager only
- **Desktop (≥ 768px)**: Two columns - RoomManager on left, "How to Play" on right

## If Still Not Working

1. **Delete node_modules and reinstall**:
```powershell
if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }
npm install
```

2. **Rebuild Vite cache**:
```powershell
if (Test-Path node_modules/.vite) { Remove-Item node_modules/.vite -Recurse -Force }
npm run dev
```

3. **Check browser console**:
   - Open DevTools (F12)
   - Check for CSS loading errors
   - Verify Tailwind classes are being applied

