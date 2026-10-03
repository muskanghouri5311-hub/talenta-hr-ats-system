const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Models
const EmploymentType = require("../models/EmploymentType");

// Connect to Database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ MongoDB Connected");
  } catch (error) {
    console.error("✗ Database Connection Error:", error.message);
    process.exit(1);
  }
};

const EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Internship"];

// Seed Employment Types
const seedEmploymentTypes = async () => {
  try {
    const createdTypes = [];

    for (const typeName of EMPLOYMENT_TYPES) {
      let type = await EmploymentType.findOne({ name: typeName });

      if (!type) {
        type = await EmploymentType.create({ name: typeName });
        createdTypes.push(type);
      }
    }

    if (createdTypes.length > 0) {
      console.log(`✓ ${createdTypes.length} new employment type(s) created`);
    } else {
      console.log("✓ Employment types already exist");
    }

    return await EmploymentType.find();
  } catch (error) {
    console.error("✗ Error with employment types:", error.message);
    throw error;
  }
};

// Main seeder function
const runSeeder = async () => {
  try {
    console.log("\n🌱 Starting Employment Types Seeder...\n");

    // Connect to database
    await connectDB();

    // Seed employment types
    await seedEmploymentTypes();

    console.log("✓ Employment types seeding completed successfully!\n");

    // Disconnect from database
    await mongoose.connection.close();
    console.log("✓ Database connection closed");

    process.exit(0);
  } catch (error) {
    console.error("✗ Seeding failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run seeder
runSeeder();