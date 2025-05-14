// fix-mobile-number-migrations.js
const fs = require('fs');
const path = require('path');

console.log('Starting migration cleanup...');

const migrationsDir = path.join(__dirname, 'prisma', 'migrations');

// Target migrations to examine
const dropMigration = '20250513203232_add_mobile_number';
const duplicateMigration = '20250514000000_add_mobile_number';
const latestMigration = '20250514120000_add_mobile_number_and_updated_at';

// Create backup directory
const backupDir = path.join(__dirname, 'prisma', 'migrations_backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
  console.log('Created backup directory:', backupDir);
}

// Backup function
function backupMigration(migrationName) {
  const sourcePath = path.join(migrationsDir, migrationName);
  if (!fs.existsSync(sourcePath)) {
    console.log(`Migration ${migrationName} not found, skipping backup`);
    return false;
  }
  
  const backupPath = path.join(backupDir, migrationName);
  fs.mkdirSync(backupPath, { recursive: true });
  
  // Copy migration.sql
  const sourceSql = path.join(sourcePath, 'migration.sql');
  const backupSql = path.join(backupPath, 'migration.sql');
  fs.copyFileSync(sourceSql, backupSql);
  
  console.log(`Backed up ${migrationName} to ${backupPath}`);
  return true;
}

// Remove function (only after backup)
function removeMigration(migrationName) {
  const migrationPath = path.join(migrationsDir, migrationName);
  if (!fs.existsSync(migrationPath)) {
    console.log(`Migration ${migrationName} not found, nothing to remove`);
    return false;
  }
  
  // Remove migration.sql
  const sqlPath = path.join(migrationPath, 'migration.sql');
  fs.unlinkSync(sqlPath);
  
  // Remove directory
  fs.rmdirSync(migrationPath);
  
  console.log(`Removed migration ${migrationName}`);
  return true;
}

// Backup and remove the migrations in the correct order
console.log('Backing up migrations...');
let backupSuccess = true;
backupSuccess = backupMigration(dropMigration) && backupSuccess;
backupSuccess = backupMigration(duplicateMigration) && backupSuccess;
backupSuccess = backupMigration(latestMigration) && backupSuccess;

if (!backupSuccess) {
  console.log('Some backups failed, aborting migration cleanup for safety');
  process.exit(1);
}

console.log('Backup completed successfully');

// Now remove the problematic migrations
console.log('Removing problematic migrations...');
removeMigration(dropMigration);
removeMigration(duplicateMigration);

console.log('Migration cleanup completed');
console.log('');
console.log('IMPORTANT: You need to manually update your database with:');
console.log('1. npx prisma migrate resolve --applied 20250513203232_add_mobile_number');
console.log('2. npx prisma migrate resolve --applied 20250514000000_add_mobile_number');
console.log('3. npx prisma db push');
console.log('');
console.log('This will mark the removed migrations as applied in the _prisma_migrations table');
console.log('and ensure your database schema matches the Prisma schema.');
