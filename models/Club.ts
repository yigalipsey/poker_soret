import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClub extends Document {
  name: string;
  managerId: mongoose.Types.ObjectId;
  clubPassword?: string; // סיסמת המועדון ליוזרים רגילים
  chipsPerShekel?: number; // כמה צ'יפים שווים שקל (ברירת מחדל: 1000)
  createdAt: Date;
}

const ClubSchema: Schema = new Schema({
  name: { type: String, required: true },
  managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  clubPassword: { type: String }, // סיסמת המועדון ליוזרים רגילים
  chipsPerShekel: { type: Number, default: 1000 }, // כמה צ'יפים שווים שקל
  createdAt: { type: Date, default: Date.now },
});

const Club: Model<IClub> =
  mongoose.models.Club || mongoose.model<IClub>("Club", ClubSchema);

export default Club;
