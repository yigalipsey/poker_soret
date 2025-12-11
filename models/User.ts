import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBankrollTransaction {
  type: "deposit" | "withdrawal" | "game_profit" | "game_loss";
  amount: number; // בשקלים או זיטונים (תלוי בסוג)
  date: Date;
  gameId?: mongoose.Types.ObjectId;
  description?: string;
}

export interface IUser extends Document {
  name: string;
  isAdmin: boolean;
  globalBalance: number;
  avatarUrl?: string;
  password?: string;
  clubId?: mongoose.Types.ObjectId;
  // קופה משותפת
  bankroll?: number; // יתרת זיטונים בקופה
  totalDeposited?: number; // סך הכל הפקדות (בשקלים)
  totalWithdrawn?: number; // סך הכל משיכות (בשקלים)
  bankrollHistory?: IBankrollTransaction[]; // היסטוריית תנועות בקופה
}

const BankrollTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ["deposit", "withdrawal", "game_profit", "game_loss"],
    required: true,
  },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  gameId: { type: Schema.Types.ObjectId, ref: "GameSession" },
  description: { type: String },
});

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  globalBalance: { type: Number, default: 0 },
  avatarUrl: { type: String, required: false },
  password: { type: String, required: false },
  clubId: { type: Schema.Types.ObjectId, ref: "Club", required: false },
  // קופה משותפת
  bankroll: { type: Number, default: 0 }, // יתרת זיטונים בקופה
  totalDeposited: { type: Number, default: 0 }, // סך הכל הפקדות (בשקלים)
  totalWithdrawn: { type: Number, default: 0 }, // סך הכל משיכות (בשקלים)
  bankrollHistory: [BankrollTransactionSchema], // היסטוריית תנועות בקופה
});

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
