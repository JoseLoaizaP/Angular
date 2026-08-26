import mongoose from 'mongoose';

/** Abre la conexión global de Mongoose contra la URI dada (p. ej. process.env.MONGODB_URI). */
export const connectDB = async (uri: string): Promise<void> => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log('Conexion a MongoDB establecida');
};

/** Cierra la conexión de Mongoose. Usado principalmente al finalizar los tests. */
export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
