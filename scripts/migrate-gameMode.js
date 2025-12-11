// Script to add gameMode field to all existing clubs
// Run with: node scripts/migrate-gameMode.js

const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const ClubSchema = new mongoose.Schema({
  name: { type: String, required: true },
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  clubPassword: { type: String },
  chipsPerShekel: { type: Number, default: 100 },
  gameMode: {
    type: String,
    enum: ["free", "shared_bankroll"],
    default: "free",
    required: true,
  },
  adminEmail: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Club = mongoose.models.Club || mongoose.model("Club", ClubSchema);

async function migrate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    // Find all clubs without gameMode field
    const clubs = await Club.find({ gameMode: { $exists: false } });
    console.log(`Found ${clubs.length} clubs without gameMode field`);

    // Update all clubs to have gameMode = "free"
    const result = await Club.updateMany(
      { gameMode: { $exists: false } },
      { $set: { gameMode: "free" } }
    );

    console.log(`Updated ${result.modifiedCount} clubs with gameMode field`);

    // Verify
    const clubsWithoutGameMode = await Club.find({
      gameMode: { $exists: false },
    });
    console.log(
      `Clubs without gameMode after migration: ${clubsWithoutGameMode.length}`
    );

    await mongoose.disconnect();
    console.log("Migration completed");
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
}

migrate();

