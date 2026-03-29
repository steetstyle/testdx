import mongoose, { Schema, Document } from 'mongoose';

export interface IProject {
  teamId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  otelCollectorEndpoint: string;
  projectVariables?: Record<string, string | number | boolean | string[] | number[]>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectDocument extends Omit<IProject, '_id'>, Document {}

const ProjectSchema = new Schema<ProjectDocument>({
  teamId: { type: Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: false, trim: true, maxlength: 500, default: '' },
  otelCollectorEndpoint: { type: String, required: true, default: 'http://localhost:4318' },
  projectVariables: { type: Schema.Types.Mixed, default: {} },
  isActive: { type: Boolean, required: true, default: true, index: true },
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

ProjectSchema.index({ teamId: 1, isActive: 1 });

export const Project = mongoose.model<ProjectDocument>('Project', ProjectSchema);
export default Project;