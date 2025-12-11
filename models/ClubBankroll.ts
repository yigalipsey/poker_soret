import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPlayerBankroll {
  userId: mongoose.Types.ObjectId;
  balance: number; // יתרה בזיטונים
  totalDeposited: number; // סך הכל הוטען (בשקלים)
  totalWithdrawn: number; // סך הכל נמשך (בשקלים)
}

export interface IClubBankroll extends Document {
  clubId: mongoose.Types.ObjectId;
  players: IPlayerBankroll[]; // רשימת יתרות לכל שחקן
  totalBalance: number; // סך הכל בקופה המשותפת (בזיטונים)
  createdAt: Date;
  updatedAt: Date;
}

const PlayerBankrollSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  balance: { type: Number, default: 0 }, // יתרה בזיטונים
  totalDeposited: { type: Number, default: 0 }, // סך הכל הוטען (בשקלים)
  totalWithdrawn: { type: Number, default: 0 }, // סך הכל נמשך (בשקלים)
});

const ClubBankrollSchema: Schema = new Schema(
  {
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
      unique: true,
    },
    players: [PlayerBankrollSchema],
    totalBalance: { type: Number, default: 0 }, // סך הכל בקופה המשותפת (בזיטונים)
  },
  {
    timestamps: true,
  }
);

// אינדקס למציאת יתרה של שחקן ספציפי
ClubBankrollSchema.index({ clubId: 1, "players.userId": 1 });

const ClubBankroll: Model<IClubBankroll> =
  mongoose.models.ClubBankroll ||
  mongoose.model<IClubBankroll>("ClubBankroll", ClubBankrollSchema);

export default ClubBankroll;
