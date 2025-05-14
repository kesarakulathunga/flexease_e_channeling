const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Log the current directory
console.log("Current directory:", __dirname);

// Check if .env file exists
const envPath = path.resolve(__dirname, '.env');
console.log(".env path:", envPath);
console.log(".env exists:", fs.existsSync(envPath));

// Load environment variables with explicit path
const result = dotenv.config({ path: envPath });
console.log("dotenv config result:", result);

// Log the environment variables
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
