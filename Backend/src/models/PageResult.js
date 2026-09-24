import mongoose from 'mongoose';

const pageResultSchema = new mongoose.Schema(
  {
    testRunId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TestRun',
      required: true,
      index: true,
    },
    pageMappingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PageMapping',
      required: true,
    },
    pageName: {
      type: String,
      default: '',
    },
    websiteRoute: {
      type: String,
      default: '',
    },
    figmaReferenceUrl: {
      type: String,
      default: '',
    },
    actualScreenshotUrl: {
      type: String,
      default: '',
    },
    diffScreenshotUrl: {
      type: String,
      default: '',
    },
    matchPercentage: {
      type: Number,
      default: 0,
    },
    diffPixelCount: {
      type: Number,
      default: 0,
    },
    totalPixelCount: {
      type: Number,
      default: 0,
    },
    differenceRegions: [
      {
        x: Number,
        y: Number,
        width: Number,
        height: Number,
        area: Number,
        differencePercentage: Number,
      },
    ],
    status: {
      type: String,
      enum: ['passed', 'warning', 'failed'],
      default: 'passed',
    },
  },
  {
    timestamps: true,
  }
);

export const PageResult = mongoose.model('PageResult', pageResultSchema);
