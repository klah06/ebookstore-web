// servidor.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));
app.use('/livros', express.static(path.join(__dirname, 'livros')));

// SUBSTIUIR PELA TUA STRING DO MONGODB ATLAS QUANDO PUBLICARES NA NUVEM
const url = process.env.MONGODB_URI || 'mongodb+srv://mariaclarabilingue_db_user:SenhaEbooks123@cluster0.56thhar.mongodb.net/ebooks?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(url);

let db;
async function conectarDB() {
    try {
        await client.connect();
        db = client.db('ebooks');
        console.log('✅ Ligado ao MongoDB com sucesso!');
    } catch (err) {
        console.error('❌ Erro de conexão ao MongoDB:', err);
    }
}
conectarDB();

// 1. CATÁLOGO DE EBOOKS
app.get('/api/ebooks', async (req, res) => {
    try {
        const livros = await db.collection('ebooks').find({}).toArray();
        res.json(livros);
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro ao procurar catálogo." });
    }
});

// 2. REGISTO DE UTILIZADOR
app.post('/api/registro', async (req, res) => {
    try {
        const { nome, email, senha } = req.body;
        if (!nome || !email || !senha) {
            return res.status(400).json({ mensagem: "Preencha todos os campos!" });
        }

        const usuarios = db.collection('usuarios');
        const usuarioExistente = await usuarios.findOne({ email: email.toLowerCase() });
        if (usuarioExistente) {
            return res.status(400).json({ mensagem: "Este e-mail já está registado!" });
        }

        const novoUsuario = {
            nome,
            email: email.toLowerCase(),
            senha,
            dataCriacao: new Date()
        };

        const resultado = await usuarios.insertOne(novoUsuario);

        res.json({
            sucesso: true,
            mensagem: "Conta criada com sucesso!",
            usuario: { id: resultado.insertedId, nome: novoUsuario.nome, email: novoUsuario.email }
        });
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro interno ao criar conta." });
    }
});

// 3. LOGIN DE UTILIZADOR
app.post('/api/login', async (req, res) => {
    try {
        const { email, senha } = req.body;
        const usuario = await db.collection('usuarios').findOne({ email: email.toLowerCase(), senha: senha });

        if (!usuario) {
            return res.status(401).json({ mensagem: "E-mail ou palavra-passe incorretos!" });
        }

        res.json({
            sucesso: true,
            mensagem: "Login efetuado com sucesso!",
            usuario: { id: usuario._id, nome: usuario.nome, email: usuario.email }
        });
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro ao efetuar login." });
    }
});

// 4. REGISTAR NOVA COMPRA NO MONGODB
app.post('/api/pedidos', async (req, res) => {
    try {
        const { usuarioEmail, usuarioNome, itens, total, metodoPagamento } = req.body;

        if (!usuarioEmail || !itens || itens.length === 0) {
            return res.status(400).json({ mensagem: "Dados do pedido inválidos!" });
        }

        const novoPedido = {
            usuarioEmail: usuarioEmail.toLowerCase(),
            usuarioNome,
            itens: itens.map(item => ({
                livroId: item.livro._id,
                titulo: item.livro.titulo,
                formato: item.formato,
                quantidade: item.quantidade,
                precoUnitario: item.livro.preco
            })),
            total,
            metodoPagamento,
            status: 'CONCLUIDO',
            dataCompra: new Date()
        };

        const resultado = await db.collection('compras').insertOne(novoPedido);

        res.json({
            sucesso: true,
            mensagem: "Compra gravada na base de dados com sucesso!",
            pedidoId: resultado.insertedId
        });
    } catch (erro) {
        console.error("Erro ao gravar pedido:", erro);
        res.status(500).json({ mensagem: "Erro ao gravar a compra." });
    }
});

// 5. ROTA ADMIN: VER TODAS AS COMPRAS EFETUADAS NA LOJA
app.get('/api/admin/compras', async (req, res) => {
    try {
        const compras = await db.collection('compras').find({}).sort({ dataCompra: -1 }).toArray();
        res.json(compras);
    } catch (erro) {
        res.status(500).json({ mensagem: "Erro ao procurar compras." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor ativo na porta ${PORT}`);
});