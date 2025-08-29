// Script to fix the phone index issue in MongoDB
// This script drops the problematic phone_1 index and allows the new partial index to be created

const mongoose = require('mongoose');

// Try to load dotenv if available, but don't fail if it's not
try {
  require('dotenv').config();
} catch (e) {
  console.log('dotenv not available, using environment variables directly');
}

async function fixPhoneIndex() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tijara');
    
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    console.log('Checking existing indexes...');
    const indexes = await collection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(idx => ({ name: idx.name, key: idx.key })));
    
    // Check if phone_1 index exists and drop it
    const phoneIndex = indexes.find(idx => idx.name === 'phone_1');
    if (phoneIndex) {
      console.log('Dropping problematic phone_1 index...');
      await collection.dropIndex('phone_1');
      console.log('phone_1 index dropped successfully');
    } else {
      console.log('phone_1 index not found');
    }
    
    // Verify the new index was created
    console.log('Checking indexes after fix...');
    const updatedIndexes = await collection.listIndexes().toArray();
    console.log('Updated indexes:', updatedIndexes.map(idx => ({
      name: idx.name, 
      key: idx.key, 
      partialFilterExpression: idx.partialFilterExpression,
      sparse: idx.sparse
    })));
    
    console.log('Index fix completed. The new partial index will be created when the server restarts.');
    
  } catch (error) {
    console.error('Error fixing phone index:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed');
  }
}

fixPhoneIndex();
