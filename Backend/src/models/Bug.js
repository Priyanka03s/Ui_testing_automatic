import mongoose from 'mongoose';
import { BUG_SEVERITY, BUG_CATEGORY, BUG_STATUS } from '../config/constants.js';

const bugSchema = new mongoose.Schema(
  {
    pageResultId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PageResult',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    pageName: {
      type: String,
      default: '',
    },
    severity: {
      type: String,
      enum: Object.values(BUG_SEVERITY),
      default: BUG_SEVERITY.MEDIUM,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(BUG_CATEGORY),
      default: BUG_CATEGORY.LAYOUT,
    },
    status: {
      type: String,
      enum: Object.values(BUG_STATUS),
      default: BUG_STATUS.OPEN,
      index: true,
    },
    suggestedFix: {
      type: String,
      default: '',
    },
    confidence: {
      type: Number,
      default: 0.85,
    },
    x: {
      type: Number,
      default: 0,
    },
    y: {
      type: Number,
      default: 0,
    },
    width: {
      type: Number,
      default: 0,
    },
    height: {
      type: Number,
      default: 0,
    },
    firstDetectedAt: {
      type: Date,
      default: Date.now,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

bugSchema.index({ projectId: 1, status: 1 });

export const Bug = mongoose.model('Bug', bugSchema);
