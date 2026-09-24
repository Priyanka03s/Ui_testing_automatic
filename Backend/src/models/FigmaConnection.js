import mongoose from 'mongoose';

const figmaConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      unique: true,
      index: true,
    },
    fileKey: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      default: '',
    },
    encryptedAccessToken: {
      iv: { type: String, required: true },
      data: { type: String, required: true },
      tag: { type: String, required: true },
    },
    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastSyncedAt: {
      type: Date,
      default: Date.now,
    },
    importedPages: [
      {
        id: String,
        name: String,
        frames: [
          {
            id: String,
            name: String,
            width: Number,
            height: Number,
            previewUrl: String,
            storageKey: String,
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Never return encryptedAccessToken to frontend
figmaConnectionSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.encryptedAccessToken;
  return obj;
};

export const FigmaConnection = mongoose.model('FigmaConnection', figmaConnectionSchema);
