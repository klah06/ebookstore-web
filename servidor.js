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

// Registos no terminal para depuração no Render
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

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

// 1. Catálogo
app.get(['/api/ebooks', '/ebooks'], async (req, res, next) => {
  try {
    const ebooks = await Ebook.find({});
    return res.json(ebooks);
  } catch (error) {
    return next(error);
  }
});

// 2. Registo
app.post(['/api/usuarios/registro', '/api/usuarios/registro/'], async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body || {};
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e palavra-passe são obrigatórios.' });
    }

    const emailFormatado = String(email).toLowerCase().trim();
    const existente = await Usuario.findOne({ email: emailFormatado });
    
    if (existente) {
      return res.status(400).json({ erro: 'Este e-mail já está registado. Alterne para "Iniciar Sessão".' });
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
    return next(error);
  }
});

// 3. Login
app.post(['/api/usuarios/login', '/api/usuarios/login/'], async (req, res, next) => {
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
    return next(error);
  }
});

// 4. Compras
app.post(['/api/compras', '/api/compras/'], async (req, res, next) => {
  try {
    const novaCompra = new Compra({
      ...req.body,
      dataCompra: new Date()
    });
    await novaCompra.save();
    return res.status(201).json({ sucesso: true, compra: novaCompra });
  } catch (error) {
    return next(error);
  }
});

app.get(['/api/compras', '/api/compras/'], async (req, res, next) => {
  try {
    const compras = await Compra.find({});
    return res.json(compras);
  } catch (error) {
    return next(error);
  }
});

// Resposta estrita em JSON para rotas da API não encontradas (impede devolução de HTML)
app.all('/api/*', (req, res) => {
  return res.status(404).json({ erro: `Rota da API não encontrada: ${req.method} ${req.url}` });
});

// Fallback para o frontend HTML
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Tratador global de erros em JSON
app.use((err, req, res, next) => {
  console.error('❌ Erro no servidor:', err);
  res.status(500).json({ erro: err.message || 'Erro interno no servidor.' });
});

app.listen(PORT, () => console.log(`🚀 Servidor ativo na porta ${PORT}`));
