import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      required: true,
    },
    pricePerUnit: {
      // Stored as Decimal128 for exact money math (see lib/money.ts).
      type: mongoose.Schema.Types.Decimal128,
      required: true,
    },
    units: {
      type: Number,
      required: true,
    },
    market: {
      type: String,
      required: false,
    },
    taxes: {
      type: Number,
      required: false,
    },
    location: {
      type: String,
      required: false,
    },
    createdTime: {
      type: String,
      
    }
  },
  {
    timestamps: true,
  }
);

// Supports the reporting/history date-range queries, which filter by
// productCode + mode and sort/range over createdAt.
recordingSchema.index({ productCode: 1, mode: 1, createdAt: 1 });
recordingSchema.index({ createdAt: 1 });

// delete old model
if (mongoose.models.recordings) {
  const recordingModel = mongoose.model("recordings");
  mongoose.deleteModel(recordingModel.modelName);
}
// create new model
const Recording = mongoose.model("recordings", recordingSchema);

export default Recording;
