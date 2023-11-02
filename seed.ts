import { MongoClient } from 'mongodb';

const url = 'mongodb://127.0.0.1:27017'; // Replace with your MongoDB connection string
const dbName = 'inventory-nextjs-antd'; // Replace with your database name

async function seed() {
  try {
    // Connect to MongoDB
    const client = await MongoClient.connect(url);
    const db = client.db(dbName);

    // Define the seed data
    const seedData = [
      { name: 'John', age: 28 },
      { name: 'Jane', age: 32 },
      { name: 'Alice', age: 45 },
    ];

    // Insert the seed data into a collection
    const collection = db.collection('users'); // Replace 'users' with your desired collection name
    await collection.insertMany(seedData);

    console.log('Seed data inserted successfully!');

    // Close the MongoDB connection
    client.close();
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Call the seeder function
seed();
