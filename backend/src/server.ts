import dotenv from 'dotenv';
import { createApp } from './app';
import { connectDB } from './config/db';

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const MONGODB_URI = process.env.MONGODB_URI;

const start = async (): Promise<void> => {
  if (!MONGODB_URI) {
    throw new Error('Falta definir la variable de entorno MONGODB_URI');
  }

  await connectDB(MONGODB_URI);

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
  });
};

start().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
