import mongoose from 'mongoose';

const buyingSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    buying: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//delete old model
if (mongoose.models.buyings) {
  const buyingModel = mongoose.model('buyings');
  mongoose.deleteModel(buyingModel.modelName);
}
//create new model
const Buying = mongoose.model('buyings', buyingSchema);

export default Buying;
