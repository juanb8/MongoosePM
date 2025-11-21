import mongoose, { type Model } from "mongoose";
import type { iUser } from "../interface";

export type UserModel = Model<iUser>;

let userSchema = new mongoose.Schema<iUser, UserModel>({
  name: String,
  email: { type: String, unique: true },
  createdOn: { type: Date, default: Date.now },
  modifiedOn: Date,
  lastLogin: Date,
});

export default userSchema;
