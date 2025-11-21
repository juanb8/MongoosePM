import mongoose from "mongoose";
import { projectSchema, type ProjectModel } from "../schema";
import { type iProject } from "../interface";
export default mongoose.model<iProject, ProjectModel>("Project", projectSchema);
