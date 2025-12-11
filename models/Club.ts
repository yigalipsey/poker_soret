import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClub extends Document {
  name: string;
  managerId: mongoose.Types.ObjectId;
  clubPassword?: string; // סיסמת המועדון ליוזרים רגילים
  chipsPerShekel?: number; // כמה צ'יפים שווים שקל (ברירת מחדל: 100)
  gameMode?: "free" | "shared_bankroll"; // מוד משחק: חופשי או קופה משותפת
  adminEmail?: string; // כתובת מייל של האדמין לקבלת עדכונים
  createdAt: Date;
}

const ClubSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    managerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    clubPassword: { type: String }, // סיסמת המועדון ליוזרים רגילים
    chipsPerShekel: { type: Number, default: 100 }, // כמה צ'יפים שווים שקל
    gameMode: {
      type: String,
      enum: ["free", "shared_bankroll"],
      default: "shared_bankroll", // ברירת מחדל: קופה משותפת
      required: true,
    }, // מוד משחק: חופשי או קופה משותפת
    adminEmail: { type: String }, // כתובת מייל של האדמין לקבלת עדכונים
    createdAt: { type: Date, default: Date.now },
  },
  {
    // וידוא שה-defaults נשמרים גם אם לא מעבירים אותם במפורש
    setDefaultsOnInsert: true,
  } as mongoose.SchemaOptions
);

const Club: Model<IClub> =
  mongoose.models.Club || mongoose.model<IClub>("Club", ClubSchema);

export default Club;
