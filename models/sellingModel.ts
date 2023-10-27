import mongoose from 'mongoose';

const sellingSchema = new mongoose.Schema(
  {
    productCode: {
      type: String,
      required: true,
    },
    pricePerUnit: {
      type: Number,
      required: true,
    },
    selling: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

//delete old model
if (mongoose.models.sellings) {
  const sellingModel = mongoose.model('sellings');
  mongoose.deleteModel(sellingModel.modelName);
}
//create new model
const Selling = mongoose.model('sellings', sellingSchema);

export default Selling;
