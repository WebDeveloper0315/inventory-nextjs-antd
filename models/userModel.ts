import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    newProduct: {
      type: Boolean,
      required: true,
      default: false,
    },
    sold: {
        type: Boolean,
        required: true,
        default: false,
    },
    returning: {
      type: Boolean,
      required: true,
      default: false,
    },
    query: {
        type: Boolean,
        required: true,
        default: false,
    },
    addUser: {
        type: Boolean,
        required: true,
        default: false,
    },
  },
  {
    timestamps: true,
  }
)

//delete old model
if (mongoose.models.users) {
  const userModel = mongoose.model('users')
  mongoose.deleteModel(userModel.modelName)
}
//create new model
const User = mongoose.model('users', userSchema)

export default User
