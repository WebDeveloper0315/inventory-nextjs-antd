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
      type: Number,
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
  },
  {
    timestamps: true,
  }
);

// delete old model
if (mongoose.models.recordings) {
  const recordingModel = mongoose.model("recordings");
  mongoose.deleteModel(recordingModel.modelName);
}
// create new model
const Recording = mongoose.model("recordings", recordingSchema);

export default Recording;
