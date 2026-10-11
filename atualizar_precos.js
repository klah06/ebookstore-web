const { MongoClient } = require('mongodb');

async function atualizarPrecos() {
    // 1. URL de conexão ao MongoDB Atlas na Nuvem
    const url = 'mongodb+srv://mariaclarabilingue_db_user:SenhaEbooks123@cluster0.56thhar.mongodb.net/ebooks?retryWrites=true&w=majority&appName=Cluster0';
    const client = new MongoClient(url);

    try {
        await client.connect();
        const db = client.db('ebooks');
        const colecao = db.collection('ebooks');

        const precos = [21.90, 22.90, 24.90, 25.90, 27.90, 28.90, 29.90];
        let livros = await colecao.find({}).toArray();

        // 2. Se a nuvem estiver vazia, copia os livros da base local
        if (livros.length === 0) {
            console.log("📦 A copiar os 22 livros do banco local para o MongoDB Atlas...");
            const clientLocal = new MongoClient('mongodb://127.0.0.1:27017');
            await clientLocal.connect();
            const livrosLocais = await clientLocal.db('ebooks').collection('ebooks').find({}).toArray();
            await clientLocal.close();

            if (livrosLocais.length > 0) {
                await colecao.insertMany(livrosLocais);
                livros = await colecao.find({}).toArray();
                console.log(`✅ ${livros.length} livros enviados para o MongoDB Atlas com sucesso!`);
            }
        }

        // 3. Atualiza os preços na nuvem
        for (const livro of livros) {
            const novoPreco = precos[Math.floor(Math.random() * precos.length)];
            await colecao.updateOne({ _id: livro._id }, { $set: { preco: novoPreco } });
        }

        console.log(`✅ Sucesso! Preços atualizados em ${livros.length} livros no MongoDB Atlas.`);
    } catch (erro) {
        console.error("❌ Erro:", erro);
    } finally {
        await client.close();
    }
}

atualizarPrecos();