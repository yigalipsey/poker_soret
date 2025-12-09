import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    name: string;
    isAdmin: boolean;
    globalBalance: number;
    avatarUrl?: string;
    password?: string;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    globalBalance: { type: Number, default: 0 },
    avatarUrl: { type: String, required: false },
    password: { type: String, required: false },
});

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
