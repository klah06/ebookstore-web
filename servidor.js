const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ligação ao MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mariaclarabilingue_db_user:SenhaEbooks123@cluster0.56thhar.mongodb.net/ebooks?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Ligado ao MongoDB Atlas com sucesso!'))
  .catch(err => console.error('❌ Erro na ligação ao MongoDB:', err));

// Schemas Flexíveis
const Ebook = mongoose.model('Ebook', new mongoose.Schema({}, { strict: false, collection: 'ebooks' }));
const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false, collection: 'usuarios' }));
const Compra = mongoose.model('Compra', new mongoose.Schema({}, { strict: false, collection: 'compras' }));

// --- ROTAS DA API ---

// 1. Obter eBooks
const getEbooks = async (req, res) => {
  try {
    const ebooks = await Ebook.find({});
    res.json(ebooks);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar catálogo.' });
  }
};
app.get('/api/ebooks', getEbooks);
app.get('/ebooks', getEbooks);

// 2. Registo e Login de Utilizadores
app.post('/api/usuarios/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const existente = await Usuario.findOne({ email });
    if (existente) return res.status(400).json({ erro: 'Este e-mail já está registado.' });

    const novoUsuario = new Usuario({ nome, email, senha, dataCriacao: new Date() });
    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao criar conta.' });
  }
});

app.post('/api/usuarios/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await Usuario.findOne({ email, senha });
    if (!usuario) return res.status(401).json({ erro: 'E-mail ou palavra-passe incorretos.' });

    res.json(usuario);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao iniciar sessão.' });
  }
});

// 3. Registar Compras no MongoDB
app.post('/api/compras', async (req, res) => {
  try {
    const novaCompra = new Compra({
      ...req.body,
      dataCompra: new Date()
    });
    await novaCompra.save();
    res.status(201).json({ sucesso: true, compra: novaCompra });
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao processar compra.' });
  }
});

app.get('/api/compras', async (req, res) => {
  try {
    const compras = await Compra.find({});
    res.json(compras);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao procurar compras.' });
  }
});

// Rota para o Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));