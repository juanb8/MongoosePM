import mongoose from "mongoose";
import { userSchema, type UserModel } from "../schema";
import type { iUser } from "../interface";

const User: UserModel = mongoose.model<iUser, UserModel>("User", userSchema);
export default User;
