import mongoose from 'mongoose'

const productSchema = new mongoose.Schema(
  {
    productCode: {
        type: String,
        required: true,
    },
    productImage:{
        type: String,
        required: true,
    } ,
    disposableUnits: {
        type: Number,
        required: true,
    },
    pricePerUnit: {
        type: Number,
        required: true,
    },
    location: {
        type: String,
        required: true,
    },
  },
  {
    timestamps: true,
  }
)

//delete old model
if (mongoose.models.products) {
  const productModel = mongoose.model('products')
  mongoose.deleteModel(productModel.modelName)
}
//create new model
const Product = mongoose.model('products', productSchema)

export default Product
