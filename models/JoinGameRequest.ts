import mongoose, { Schema, Document, Model } from "mongoose";

export interface IJoinGameRequest extends Document {
  userId: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  amount: number; // סכום זיטונים מבוקש
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId; // מי אישר (מנהל)
}

const JoinGameRequestSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gameId: {
      type: Schema.Types.ObjectId,
      ref: "GameSession",
      required: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// אינדקס למציאת בקשות ממתינות
JoinGameRequestSchema.index({ gameId: 1, status: 1 });
JoinGameRequestSchema.index({ userId: 1, status: 1 });

const JoinGameRequest: Model<IJoinGameRequest> =
  mongoose.models.JoinGameRequest ||
  mongoose.model<IJoinGameRequest>("JoinGameRequest", JoinGameRequestSchema);

export default JoinGameRequest;

