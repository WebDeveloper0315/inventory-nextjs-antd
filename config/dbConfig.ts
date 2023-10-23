import mongoose from 'mongoose';

export function connectDB() {
  try {
    mongoose.connect(process.env.mongo_url!)  //! - This is very important to connect the database

    const connection = mongoose.connection

    connection.on('connected', () => {
      console.log("MongoDB Connection Successfull")
    })

    connection.on('error', (error) => {
      console.log(error)
    })
  } catch (error) {
    console.log(error)
  }
}
