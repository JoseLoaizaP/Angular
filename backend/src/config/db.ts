import mongoose from 'mongoose';

export const connectDB = async (uri: string): Promise<void> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('Conexion a MongoDB establecida');
};

export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
