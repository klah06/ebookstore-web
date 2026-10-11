const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir ficheiros estáticos da pasta atual (HTML, CSS, Imagens)
app.use(express.static(__dirname));

// Conexão ao MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://mariaclarabilingue_db_user:SenhaEbooks123@cluster0.56thhar.mongodb.net/ebooks?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Ligado ao MongoDB Atlas com sucesso!'))
  .catch(err => console.error('❌ Erro na ligação ao MongoDB:', err));

// Schemas flexíveis para suportar qualquer estrutura existente na coleção
const EbookSchema = new mongoose.Schema({}, { strict: false, collection: 'ebooks' });
const Ebook = mongoose.model('Ebook', EbookSchema);

const UsuarioSchema = new mongoose.Schema({}, { strict: false, collection: 'usuarios' });
const Usuario = mongoose.model('Usuario', UsuarioSchema);

const CompraSchema = new mongoose.Schema({}, { strict: false, collection: 'compras' });
const Compra = mongoose.model('Compra', CompraSchema);

// Função para procurar eBooks
const getEbooksHandler = async (req, res) => {
  try {
    const ebooks = await Ebook.find({});
    console.log(`📚 ${ebooks.length} ebooks encontrados.`);
    res.json(ebooks);
  } catch (error) {
    console.error('❌ Erro ao procurar ebooks:', error);
    res.status(500).json({ erro: 'Erro interno ao carregar o catálogo de ebooks.' });
  }
};

// Rotas do Catálogo (Suporta ambas as URLs para evitar erros de rotas)
app.get('/api/ebooks', getEbooksHandler);
app.get('/ebooks', getEbooksHandler);

// Rotas de Utilizadores
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.find({});
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao procurar utilizadores.' });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const novoUsuario = new Usuario(req.body);
    await novoUsuario.save();
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao guardar utilizador.' });
  }
});

// Rotas de Compras
app.get('/api/compras', async (req, res) => {
  try {
    const compras = await Compra.find({});
    res.json(compras);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao procurar compras.' });
  }
});

app.post('/api/compras', async (req, res) => {
  try {
    const novaCompra = new Compra(req.body);
    await novaCompra.save();
    res.status(201).json(novaCompra);
  } catch (error) {
    res.status(500).json({ erro: 'Erro ao registar compra.' });
  }
});

// Rota principal (Serve o index.html)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar o Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ativo na porta ${PORT}`);
});