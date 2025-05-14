# Migration Fix Guide: Resolving Duplicate Mobile Number Migrations

## Issue Analysis

The codebase has three migration files related to the `mobileNumber` field in the `PatientProfile` model:

1. `20250513203232_add_mobile_number` - Drops `mobileNumber` and `updatedAt` columns
2. `20250514000000_add_mobile_number` - Adds `mobileNumber` (nullable) and `updatedAt` (nullable with default value)
3. `20250514120000_add_mobile_number_and_updated_at` - Adds `mobileNumber` (nullable) and `updatedAt` (NOT NULL with default value)

These migrations create potential conflicts when applied to the database:
- The first migration drops columns that might not exist yet
- The second and third migrations try to add the same columns with slightly different constraints

## Current Schema State

According to the Prisma schema, the `PatientProfile` model should have:
- `mobileNumber` as a nullable string (`String?`)
- `updatedAt` as a required DateTime with `@updatedAt` annotation and default value

```prisma
model PatientProfile {
  id           Int      @id @default(autoincrement())
  email        String
  fullName     String
  age          Int
  nicNumber    String
  mobileNumber String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt @default(now())

  @@unique([email, fullName])
}
```

## Fix Strategy

We've created a script to help resolve this issue: `fix-mobile-number-migrations.js`. The script will:

1. Back up all affected migrations
2. Remove the problematic migrations (`20250513203232_add_mobile_number` and `20250514000000_add_mobile_number`)
3. Keep the latest migration (`20250514120000_add_mobile_number_and_updated_at`)

After running the script, the database state needs to be updated manually.

## Implementation Steps

### 1. Back up your database (IMPORTANT!)

Before proceeding, create a backup of your database:

```
pg_dump -U your_username -d your_database > backup.sql
```

### 2. Run the fix script

```
cd d:\sdp test 1\backend
node fix-mobile-number-migrations.js
```

### 3. Update the database migration state

The script will remove the problematic migrations, but the database still needs to be updated:

```
npx prisma migrate resolve --applied 20250513203232_add_mobile_number
npx prisma migrate resolve --applied 20250514000000_add_mobile_number
npx prisma db push
```

These commands will:
1. Mark the removed migrations as already applied in the `_prisma_migrations` table
2. Ensure the database schema matches the Prisma schema

### 4. Verify database schema

After applying the fixes, verify that the database schema matches the Prisma schema:

```
npx prisma db pull --print
```

Compare the output with your `schema.prisma` file to ensure consistency.

### 5. Run tests

Run the provided test scripts to ensure everything works correctly:

```
node test-profile-editing.js
node test-backward-compatibility.js
```

## Documentation Updates

Update implementation documentation to reflect the current state of migrations and database schema.

## Preventive Measures

To prevent similar issues in the future:
1. Use unique, descriptive migration names
2. Run `prisma migrate dev` with the `--name` flag to auto-generate a unique timestamp
3. Consider using a migration review process for critical database changes
