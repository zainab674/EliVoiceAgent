import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Defaulting to the provided URI if env var is missing
    const uri = process.env.MONGODB_URI || 'mongodb+srv://zainabsarwar58:zainab984@cluster0.zjkfo.mongodb.net/mydatabase?retryWrites=true&w=majority&appName=Cluster0';
    
    // Check if we're already connected
    if (mongoose.connection.readyState === 1) {
        console.log('MongoDB already connected');
        return;
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Don't exit process in dev/production on connection failure instantly, maybe retry? 
    // But for now logging is enough.
  }
};

export default connectDB;
