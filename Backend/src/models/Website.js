import mongoose from 'mongoose';
import { WEBSITE_TYPE } from '../config/constants.js';

const websiteSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(WEBSITE_TYPE),
      required: true,
    },
    name: {
      type: String,
      default: 'Website Preview',
    },
    previewId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    previewUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'ready', 'failed'],
      default: 'ready',
    },
    storageKey: {
      type: String,
      default: '',
    },
    themeConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const Website = mongoose.model('Website', websiteSchema);
