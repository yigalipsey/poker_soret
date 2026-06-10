import mongoose, { Schema, Document, Model } from "mongoose";

export interface IClubBankroll extends Document {
  clubId: mongoose.Types.ObjectId;
  players: {
    userId: mongoose.Types.ObjectId;
    balance: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const ClubBankrollSchema: Schema = new Schema(
  {
    clubId: { type: Schema.Types.ObjectId, ref: "Club", required: true },
    players: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        balance: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

const ClubBankroll: Model<IClubBankroll> =
  mongoose.models.ClubBankroll ||
  mongoose.model<IClubBankroll>("ClubBankroll", ClubBankrollSchema);

export default ClubBankroll;
