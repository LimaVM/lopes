const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { db, initDB } = require('./database');
const AnimalSimulator = require('./models/simulator');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Inicializar simulador
const animalSimulator = new AnimalSimulator(db);

// Inicializar banco de dados JSON
initDB().then(() => {
    console.log('Banco de dados JSON inicializado.');
    animalSimulator.startGlobalSimulation();
});

// Importar rotas
const authRoutes = require('./routes/auth');
const animalRoutes = require('./routes/animals');
const monitoringRoutes = require('./routes/monitoring');
const serverInfoRoutes = require('./routes/serverInfo');

// Usar rotas
app.use('/api/auth', authRoutes.router);
app.use('/api/animals', animalRoutes);
app.use('/api/monitoring', monitoringRoutes);
app.use('/api/server-info', serverInfoRoutes);

// Rota para estatísticas da simulação
app.get('/api/simulation/stats', async (req, res) => {
    try {
        const stats = await animalSimulator.getSimulationStats();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao obter estatísticas' });
    }
});

// Rota para simular emergência
app.post('/api/simulation/emergency/:animalId', (req, res) => {
    const animalId = req.params.animalId;
    const emergencyType = req.body.type || 'high_heart_rate';
    
    animalSimulator.simulateEmergency(animalId, emergencyType);
    res.json({ message: 'Emergência simulada com sucesso' });
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rota para página de cadastro
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Rota para página de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Rota para dashboard
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
    console.log('Sistema de simulação de animais ativo');
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nParando servidor...');
    animalSimulator.stopGlobalSimulation();
    await db.write();
    console.log('Banco de dados salvo.');
    process.exit(0);
});

// Exportar db para uso em outras rotas
module.exports = { app, db };

