import mongoose from 'mongoose';

const pageMappingSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    figmaNodeId: {
      type: String,
      default: '0:1',
    },
    figmaPageName: {
      type: String,
      required: true,
    },
    frameName: {
      type: String,
      default: '',
    },
    websiteRoute: {
      type: String,
      required: true,
      trim: true,
    },
    viewportWidth: {
      type: Number,
      default: 1440,
    },
    viewportHeight: {
      type: Number,
      default: 900,
    },
    referenceImageUrl: {
      type: String,
      default: '',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

pageMappingSchema.index({ projectId: 1, websiteRoute: 1 });

export const PageMapping = mongoose.model('PageMapping', pageMappingSchema);

