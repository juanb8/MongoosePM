import mongoose, { type Model } from "mongoose";
import { type iProject } from "../interface";

export type ProjectModel = Model<iProject>;

let projectSchema = new mongoose.Schema<iProject, ProjectModel>({
  projectName: String,
  createdOn: Date,
  modifiedOn: { type: Date, default: Date.now },
  createdBy: String,
  tasks: String,
});

export default projectSchema;
