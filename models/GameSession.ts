import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRequest {
  amount: number;
  status: "pending" | "approved" | "rejected";
  timestamp: Date;
  isInitial: boolean; // האם זו כניסה ראשונית
  addedBy: "admin" | "user"; // מי הוסיף - מנהל או משתמש
  _id?: string;
}

export interface IPlayerSession {
  userId: mongoose.Types.ObjectId;
  totalApprovedBuyIn: number;
  buyInRequests: IRequest[];
  cashOut: number;
  netProfit: number;
  isCashedOut: boolean;
}

export interface ITransfer {
  payerId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  amount: number;
}

export interface IGameSession extends Document {
  date: Date;
  isActive: boolean;
  isSettled: boolean;
  players: IPlayerSession[];
  settlementTransfers: ITransfer[];
  clubId?: mongoose.Types.ObjectId;
}

const RequestSchema = new Schema({
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  timestamp: { type: Date, default: Date.now },
  isInitial: { type: Boolean, default: false }, // האם זו כניסה ראשונית
  addedBy: { type: String, enum: ["admin", "user"], default: "admin" }, // מי הוסיף - מנהל או משתמש
});

const PlayerSessionSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  totalApprovedBuyIn: { type: Number, default: 0 },
  buyInRequests: [RequestSchema],
  cashOut: { type: Number, default: 0 },
  netProfit: { type: Number, default: 0 },
  isCashedOut: { type: Boolean, default: false },
});

const TransferSchema = new Schema({
  payerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
});

const GameSessionSchema = new Schema({
  date: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  isSettled: { type: Boolean, default: false },
  players: [PlayerSessionSchema],
  settlementTransfers: [TransferSchema],
  clubId: { type: Schema.Types.ObjectId, ref: "Club", required: false },
});

const GameSession: Model<IGameSession> =
  mongoose.models.GameSession ||
  mongoose.model<IGameSession>("GameSession", GameSessionSchema);

export default GameSession;
