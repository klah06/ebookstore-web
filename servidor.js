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

// Conexão com o MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mariaclarabilingue_db_user:SenhaEbooks123@cluster0.56thhar.mongodb.net/ebooks?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas com sucesso!'))
  .catch(err => console.error('❌ Erro de conexão MongoDB:', err));

// Schemas Flexíveis
const Ebook = mongoose.model('Ebook', new mongoose.Schema({}, { strict: false, collection: 'ebooks' }));
const Usuario = mongoose.model('Usuario', new mongoose.Schema({}, { strict: false, collection: 'usuarios' }));
const Compra = mongoose.model('Compra', new mongoose.Schema({}, { strict: false, collection: 'compras' }));

// --- ROTAS DA API ---

// 1. Obter catálogo de eBooks
app.get(['/api/ebooks', '/ebooks'], async (req, res) => {
  try {
    const ebooks = await Ebook.find({});
    res.json(ebooks);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar catálogo de eBooks.' });
  }
});

// 2. Registo de Novo Utilizador
app.post('/api/usuarios/registro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e palavra-passe são obrigatórios.' });
    }

    const emailFormatado = email.toLowerCase().trim();
    const existente = await Usuario.findOne({ email: emailFormatado });
    
    if (existente) {
      return res.status(400).json({ erro: 'Este e-mail já está registado. Alterne para "Iniciar Sessão"!' });
    }

    const novoUsuario = new Usuario({
      nome: nome || emailFormatado.split('@')[0],
      email: emailFormatado,
      senha,
      dataCriacao: new Date()
    });

    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error('Erro no registo:', error);
    res.status(500).json({ erro: 'Erro ao criar conta no servidor.' });
  }
});

// 3. Login de Utilizador
app.post('/api/usuarios/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Preencha o e-mail e a palavra-passe.' });
    }

    const emailFormatado = email.toLowerCase().trim();
    const usuario = await Usuario.findOne({ email: emailFormatado, senha });
    
    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou palavra-passe incorretos.' });
    }

    res.json(usuario);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ erro: 'Erro ao iniciar sessão.' });
  }
});

// 4. Registar Compras
app.post('/api/compras', async (req, res) => {
  try {
    const novaCompra = new Compra({
      ...req.body,
      dataCompra: new Date()
    });
    await novaCompra.save();
    res.status(201).json({ sucesso: true, compra: novaCompra });
  } catch (error) {
    console.error('Erro na compra:', error);
    res.status(500).json({erro: 'Erro ao guardar a compra na base de dados.' });
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

// Proteção para rotas de API não encontradas (Retorna JSON em vez de HTML)
app.use('/api/*', (req, res) => {
  res.status(404).json({ erro: 'Endpoint da API não encontrado.' });
});

// Rota de fallback para o Frontend HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));