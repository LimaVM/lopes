const express = require('express');
const { db, nextId } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Função para gerar dados simulados
function generateSimulatedData(animalId) {
    const baseHeartRate = 70;
    const baseTemperature = 38.5;
    const baseHumidity = 60;
    
    // Gerar variações realistas
    const heartRate = baseHeartRate + Math.floor(Math.random() * 30) - 15; // 55-85 BPM
    const temperature = (baseTemperature + (Math.random() * 2) - 1).toFixed(1); // 37.5-39.5°C
    const humidity = (baseHumidity + Math.floor(Math.random() * 20) - 10); // 50-70%
    
    // Coordenadas simuladas (região de São Paulo)
    const baseLat = -23.5505;
    const baseLng = -46.6333;
    const latitude = (baseLat + (Math.random() * 0.01) - 0.005).toFixed(6);
    const longitude = (baseLng + (Math.random() * 0.01) - 0.005).toFixed(6);
    
    const activityLevels = ['Baixa', 'Moderada', 'Alta'];
    const activityLevel = activityLevels[Math.floor(Math.random() * activityLevels.length)];
    
    return {
        animal_id: animalId,
        heart_rate: heartRate,
        temperature: parseFloat(temperature),
        humidity: humidity,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        activity_level: activityLevel
    };
}

// Obter dados mais recentes de um animal
router.get('/:animalId/latest', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.animalId, 10);
    const userId = req.user.userId;

    await db.read();
    const animal = db.data.animals.find(a => a.id === animalId && a.user_id === userId);
    if (!animal) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    const dataList = db.data.monitoring_data
        .filter(d => d.animal_id === animalId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (dataList.length === 0) {
        const simulatedData = generateSimulatedData(animalId);
        const record = {
            id: nextId('monitoring_data'),
            ...simulatedData,
            timestamp: new Date().toISOString()
        };
        db.data.monitoring_data.push(record);
        await db.write();
        return res.json(record);
    }

    res.json(dataList[0]);
});

// Obter histórico de dados de um animal
router.get('/:animalId/history', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.animalId, 10);
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    await db.read();
    const animal = db.data.animals.find(a => a.id === animalId && a.user_id === userId);
    if (!animal) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    const history = db.data.monitoring_data
        .filter(d => d.animal_id === animalId)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(offset, offset + limit);

    res.json(history);
});

// Adicionar dados de monitoramento (simulando recebimento de sensores)
router.post('/:animalId/data', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.animalId, 10);
    const userId = req.user.userId;
    const { heart_rate, temperature, humidity, latitude, longitude, activity_level } = req.body;

    // Verificar se o animal pertence ao usuário
    await db.read();
    const animal = db.data.animals.find(a => a.id === animalId && a.user_id === userId);
    if (!animal) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    const record = {
        id: nextId('monitoring_data'),
        animal_id: animalId,
        heart_rate,
        temperature,
        humidity,
        latitude,
        longitude,
        activity_level,
        timestamp: new Date().toISOString()
    };

    db.data.monitoring_data.push(record);
    await db.write();

    res.status(201).json(record);
});

// Gerar dados simulados para um animal (endpoint para demonstração)
router.post('/:animalId/simulate', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.animalId, 10);
    const userId = req.user.userId;

    // Verificar se o animal pertence ao usuário
    await db.read();
    const animal = db.data.animals.find(a => a.id === animalId && a.user_id === userId);
    if (!animal) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    const simulatedData = generateSimulatedData(animalId);
    const record = {
        id: nextId('monitoring_data'),
        ...simulatedData,
        timestamp: new Date().toISOString()
    };
    db.data.monitoring_data.push(record);
    await db.write();

    res.status(201).json(record);
});

// Obter estatísticas de um animal
router.get('/:animalId/stats', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.animalId, 10);
    const userId = req.user.userId;

    // Verificar se o animal pertence ao usuário
    await db.read();
    const animal = db.data.animals.find(a => a.id === animalId && a.user_id === userId);
    if (!animal) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    const records = db.data.monitoring_data.filter(d => d.animal_id === animalId);
    const total_records = records.length;

    const avg_heart_rate = total_records ? records.reduce((s, r) => s + r.heart_rate, 0) / total_records : null;
    const min_heart_rate = total_records ? Math.min(...records.map(r => r.heart_rate)) : null;
    const max_heart_rate = total_records ? Math.max(...records.map(r => r.heart_rate)) : null;
    const avg_temperature = total_records ? records.reduce((s, r) => s + r.temperature, 0) / total_records : null;
    const min_temperature = total_records ? Math.min(...records.map(r => r.temperature)) : null;
    const max_temperature = total_records ? Math.max(...records.map(r => r.temperature)) : null;
    const avg_humidity = total_records ? records.reduce((s, r) => s + r.humidity, 0) / total_records : null;

    const stats = {
        total_records,
        avg_heart_rate: avg_heart_rate !== null ? Math.round(avg_heart_rate) : null,
        min_heart_rate,
        max_heart_rate,
        avg_temperature: avg_temperature !== null ? parseFloat(avg_temperature.toFixed(1)) : null,
        min_temperature,
        max_temperature,
        avg_humidity: avg_humidity !== null ? Math.round(avg_humidity) : null
    };

    res.json(stats);
});

module.exports = router;

