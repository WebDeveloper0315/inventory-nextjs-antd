import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// delete old model
if (mongoose.models.locations) {
  const locationModel = mongoose.model("locations");
  mongoose.deleteModel(locationModel.modelName);
}
// create new model
const Location = mongoose.model("locations", locationSchema);

export default Location;
