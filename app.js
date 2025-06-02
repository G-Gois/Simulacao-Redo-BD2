const db = require('./config/database');
require('dotenv').config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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
      console.log('Sistema pronto para uso!');
    } else {
      console.log('Servidor iniciado, mas sem conexão com banco de dados');
    }
  });
}
startServer();
