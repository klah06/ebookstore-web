const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

// 1. Obter catálogo de eBooks
app.get(['/api/ebooks', '/ebooks'], async (req, res) => {
  try {
    const ebooks = await Ebook.find({});
    res.json(ebooks);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao carregar o catálogo de eBooks.' });
  }
});

// 2. Registo de Utilizador
app.post(['/api/usuarios/registro', '/usuarios/registro', '/api/usuarios/registo'], async (req, res) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e palavra-passe são obrigatórios.' });
    }

    const emailFormatado = String(email).toLowerCase().trim();
    const existente = await Usuario.findOne({ email: emailFormatado });
    
    if (existente) {
      return res.status(400).json({ erro: 'Este e-mail já está registado. Tente iniciar sessão!' });
    }

    const novoUsuario = new Usuario({
      nome: nome || emailFormatado.split('@')[0],
      email: emailFormatado,
      senha,
      dataCriacao: new Date()
    });

    await novoUsuario.save();
    return res.status(201).json(novoUsuario);
  } catch (error) {
    console.error('Erro no registo:', error);
    return res.status(500).json({ erro: 'Erro ao criar a conta no servidor.' });
  }
});

// 3. Login de Utilizador
app.post(['/api/usuarios/login', '/usuarios/login'], async (req, res) => {
  try {
    const { email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ erro: 'Preencha o e-mail e a palavra-passe.' });
    }

    const emailFormatado = String(email).toLowerCase().trim();
    const usuario = await Usuario.findOne({ email: emailFormatado, senha });
    
    if (!usuario) {
      return res.status(401).json({ erro: 'E-mail ou palavra-passe incorretos.' });
    }

    return res.json(usuario);
  } catch (error) {
    console.error('Erro no login:', error);
    return res.status(500).json({ erro: 'Erro ao iniciar sessão.' });
  }
});

// 4. Registar Compras
app.post(['/api/compras', '/compras'], async (req, res) => {
  try {
    const novaCompra = new Compra({
      ...req.body,
      dataCompra: new Date()
    });
    await novaCompra.save();
    return res.status(201).json({ sucesso: true, compra: novaCompra });
  } catch (error) {
    console.error('Erro na compra:', error);
    return res.status(500).json({ erro: 'Erro ao guardar a compra na base de dados.' });
  }
});

app.get(['/api/compras', '/compras'], async (req, res) => {
  try {
    const compras = await Compra.find({});
    return res.json(compras);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao procurar compras.' });
  }
});

// Resposta JSON para rotas da API não encontradas (evita devolver páginas HTML)
app.all('/api/*', (req, res) => {
  res.status(404).json({ erro: 'Endpoint da API não encontrado.' });
});

// Rota de fallback para o Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));