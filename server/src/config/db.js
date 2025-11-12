import mongoose from 'mongoose';

// Enable debug mode for Mongoose
mongoose.set('debug', (collectionName, method, query, doc) => {
  console.log(`Mongoose: ${collectionName}.${method}`, JSON.stringify(query), doc || '');
});

export async function connectDB() {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      const error = new Error('❌ MONGODB_URI is not defined in environment variables');
      console.error(error.message);
      throw error;
    }
    
    console.log('🔌 Attempting to connect to MongoDB...');
    
    const options = {
      autoIndex: true,
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000, // 45 seconds
      heartbeatFrequencyMS: 10000, // 10 seconds
      retryWrites: true,
      w: 'majority',
    };
    
    // Log the connection attempt (but not the actual URI for security)
    const dbName = new URL(uri).pathname.replace(/^\//, '') || 'default';
    console.log(`🔗 Connecting to database: ${dbName}...`);
    
    await mongoose.connect(uri, options);
    
    // Log successful connection
    console.log('✅ MongoDB connected successfully');
    console.log(`   - Host: ${mongoose.connection.host}`);
    console.log(`   - Port: ${mongoose.connection.port}`);
    console.log(`   - Database: ${mongoose.connection.name}`);
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('🔄 Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err.message);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose disconnected from DB');
    });
    
    // Close the connection when the Node process ends
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('👋 Mongoose connection closed through app termination');
      process.exit(0);
    });
    
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Error details:', {
      name: err.name,
      code: err.code,
      codeName: err.codeName,
      errorLabels: err.errorLabels,
      stack: err.stack
    });
    
    // Log additional debugging info
    console.log('\n🔍 Debugging Info:');
    console.log(`- Node.js Version: ${process.version}`);
    console.log(`- Mongoose Version: ${mongoose.version}`);
    console.log(`- Connection URI: ${process.env.MONGODB_URI ? '*** (set but hidden for security)' : 'Not set'}`);
    
    // Exit with error code to prevent the app from starting
    process.exit(1);
  }
}

// Export the mongoose connection for direct access if needed
export const mongooseConnection = mongoose.connection;
