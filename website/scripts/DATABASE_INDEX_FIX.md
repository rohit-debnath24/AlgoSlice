# Database Index Fix

## Problem
The application was encountering a MongoDB duplicate key error:
```
E11000 duplicate key error collection: devops-ghostwriter.repositories index: fullName_1 dup key: { fullName: "BikramMondal5/Articuno.AI" }
```

This occurred because there was a unique index on the `fullName` field alone, which prevented different users from having repositories with the same name (e.g., multiple users forking the same repository).

## Solution

### 1. Updated Repository Model
Added compound unique index on `userId + fullName` to allow different users to have repositories with the same name.

### 2. Improved saveRepositories Function
- Changed the filter from `{ userId, repoId }` to `{ userId, fullName }` for consistency
- Added try-catch error handling to gracefully handle duplicate key errors
- If a duplicate is detected, the existing repository is fetched and returned instead of failing

### 3. Database Migration
Created a migration script to:
- Drop the old `fullName_1` unique index
- Create a new `userId_1_fullName_1` unique compound index
- Verify `userId_1_repoId_1` unique compound index exists

## Running the Migration

To fix the database indexes, run:

```bash
npm run fix-indexes
```

This will:
1. Connect to your MongoDB database
2. Display existing indexes
3. Remove the problematic `fullName_1` index
4. Create proper compound indexes
5. Display the updated indexes

## What Changed

### Before:
- `fullName` had a unique index (global uniqueness)
- Multiple users couldn't have repos with the same name

### After:
- `userId + fullName` has a unique compound index (per-user uniqueness)
- Different users can have repositories with the same name
- Same user cannot add the same repository twice

## Files Modified

1. `models/Repository.ts` - Added compound index definition
2. `lib/repository.ts` - Improved error handling in saveRepositories
3. `scripts/fix-repository-indexes.js` - Migration script
4. `package.json` - Added `fix-indexes` script

## Testing

After running the migration, try:
1. Connect your GitHub account
2. Select repositories
3. Save them
4. The repositories should now appear in the "Active Repositories" section without errors
