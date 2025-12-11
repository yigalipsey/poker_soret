import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDepositRequest extends Document {
  userId: mongoose.Types.ObjectId;
  clubId: mongoose.Types.ObjectId;
  amountInShekels: number; // סכום בשקלים
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  approvedAt?: Date;
  approvedBy?: mongoose.Types.ObjectId; // מי אישר (מנהל)
}

const DepositRequestSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clubId: {
      type: Schema.Types.ObjectId,
      ref: "Club",
      required: true,
    },
    amountInShekels: {
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
DepositRequestSchema.index({ clubId: 1, status: 1 });
DepositRequestSchema.index({ userId: 1, status: 1 });

const DepositRequest: Model<IDepositRequest> =
  mongoose.models.DepositRequest ||
  mongoose.model<IDepositRequest>("DepositRequest", DepositRequestSchema);

export default DepositRequest;
