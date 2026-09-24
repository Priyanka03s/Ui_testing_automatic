import mongoose from 'mongoose';
import { TEST_STATUS } from '../config/constants.js';

const testRunSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TEST_STATUS),
      default: TEST_STATUS.QUEUED,
      index: true,
    },
    viewportWidth: {
      type: Number,
      default: 1440,
    },
    viewportHeight: {
      type: Number,
      default: 900,
    },
    browser: {
      type: String,
      default: 'chromium',
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    totalPages: {
      type: Number,
      default: 0,
    },
    passedPages: {
      type: Number,
      default: 0,
    },
    warningPages: {
      type: Number,
      default: 0,
    },
    failedPages: {
      type: Number,
      default: 0,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

testRunSchema.index({ projectId: 1, createdAt: -1 });
testRunSchema.index({ status: 1, createdAt: 1 });

export const TestRun = mongoose.model('TestRun', testRunSchema);
