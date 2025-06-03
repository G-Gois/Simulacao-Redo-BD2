import { config } from 'dotenv';
import express from 'express';
import db from './src/config/database.js';
import sqlRoutes from './src/routes/sql.routes.js';
import redoRoutes from './src/routes/redo.routes.js';
import stopRoutes from './src/routes/stop.routes.js';
config(); // Carrega variáveis do .env

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use('/sql', sqlRoutes);
app.use('/redo', redoRoutes);
app.use('/stop', stopRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Servidor funcionando!' });
});

async function testConnection() {
  try {
    await db.query('SELECT 1');
    console.log('Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.error('Falha na conexão com banco de dados:', error.message);
    return false;
  }
}

async function startServer() {
  const dbConnected = await testConnection();
  
  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    
    if (dbConnected) {
      console.log('Banco conectado com sucesso!');
    } else {
      console.log('Servidor iniciado, mas sem conexão com banco de dados');
    }
  });
}

startServer();