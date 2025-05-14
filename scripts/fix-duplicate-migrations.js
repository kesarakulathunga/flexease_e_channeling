// fix-duplicate-migrations.js
const fs = require('fs');
const path = require('path');

console.log('Checking for duplicate migration files...');

const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
const migrations = fs.readdirSync(migrationsDir)
  .filter(dir => !dir.includes('migration_lock') && fs.statSync(path.join(migrationsDir, dir)).isDirectory());

// Group migrations by date
const migrationsByDate = {};
migrations.forEach(migrationDir => {
  const dateMatch = migrationDir.match(/^(\d{8})/);
  if (dateMatch) {
    const date = dateMatch[1];
    if (!migrationsByDate[date]) {
      migrationsByDate[date] = [];
    }
    migrationsByDate[date].push(migrationDir);
  }
});

// Find dates with multiple migrations
let duplicatesFound = false;
for (const [date, dirs] of Object.entries(migrationsByDate)) {
  if (dirs.length > 1) {
    duplicatesFound = true;
    console.log(`Found duplicate migrations for date ${date}:`);
    dirs.forEach(dir => console.log(`  - ${dir}`));
    
    // Keep the latest one if they're adding similar features
    const mobileMigrations = dirs.filter(dir => dir.includes('mobile_number'));
    if (mobileMigrations.length > 1) {
      console.log(`\nFound multiple migrations for mobile number:`);
      mobileMigrations.forEach(dir => console.log(`  - ${dir}`));
      
      // Sort by timestamp to find the latest
      mobileMigrations.sort();
      const latestMigration = mobileMigrations[mobileMigrations.length - 1];
      const toRemove = mobileMigrations.filter(dir => dir !== latestMigration);
      
      console.log(`\nKeeping the latest migration: ${latestMigration}`);
      console.log(`Migrations that can be safely removed:`);
      toRemove.forEach(dir => console.log(`  - ${dir}`));
      
      console.log(`\nTo remove these migrations, run:`);
      toRemove.forEach(dir => {
        console.log(`rm -rf ${path.join('prisma', 'migrations', dir)}`);
      });
    }
  }
}

if (!duplicatesFound) {
  console.log('No duplicate migrations found.');
} else {
  console.log('\nWARNING: Removing migrations may cause database sync issues if already applied.');
  console.log('Consider keeping all migrations if the database is already in production.');
}
