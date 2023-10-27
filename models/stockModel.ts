import mongoose from 'mongoose'

const stockSchema = new mongoose.Schema(
  {
    productCode: {
        type: String,
        required: true,
    },
    pricePerUnit: {
        type: Number,
        required: true,
    },
    stocks: {
        type:  Number,
        required: true,
    }
  },
  {
    timestamps: true,
  }
)

//delete old model
if (mongoose.models.stocks) {
  const stockModel = mongoose.model('stocks')
  mongoose.deleteModel(stockModel.modelName)
}
//create new model
const Stock = mongoose.model('stocks', stockSchema)

export default Stock
