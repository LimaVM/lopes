const express = require('express');
const { db, nextId } = require('../database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Listar todos os animais do usuário
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    await db.read();
    const animals = db.data.animals
        .filter(a => a.user_id === userId)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(animals);
});

// Buscar animal específico
router.get('/:id', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.id, 10);
    const userId = req.user.userId;

    await db.read();
    const animal = db.data.animals.find(a => a.id === animalId && a.user_id === userId);

    if (!animal) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    res.json(animal);
});

// Adicionar novo animal
router.post('/', authenticateToken, async (req, res) => {
    const { name, species, age, weight, description } = req.body;
    const userId = req.user.userId;

    if (!name || !species) {
        return res.status(400).json({ error: 'Nome e espécie são obrigatórios' });
    }

    await db.read();
    const animal = {
        id: nextId('animals'),
        user_id: userId,
        name,
        species,
        age,
        weight,
        description,
        created_at: new Date().toISOString()
    };

    db.data.animals.push(animal);
    await db.write();

    res.status(201).json(animal);
});

// Atualizar animal
router.put('/:id', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.id, 10);
    const userId = req.user.userId;
    const { name, species, age, weight, description } = req.body;

    if (!name || !species) {
        return res.status(400).json({ error: 'Nome e espécie são obrigatórios' });
    }

    // Verificar se o animal pertence ao usuário
    await db.read();
    const index = db.data.animals.findIndex(a => a.id === animalId && a.user_id === userId);
    if (index === -1) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    db.data.animals[index] = {
        ...db.data.animals[index],
        name,
        species,
        age,
        weight,
        description
    };
    await db.write();

    res.json(db.data.animals[index]);
});

// Deletar animal
router.delete('/:id', authenticateToken, async (req, res) => {
    const animalId = parseInt(req.params.id, 10);
    const userId = req.user.userId;

    await db.read();
    const index = db.data.animals.findIndex(a => a.id === animalId && a.user_id === userId);
    if (index === -1) {
        return res.status(404).json({ error: 'Animal não encontrado' });
    }

    db.data.animals.splice(index, 1);
    // Remover dados de monitoramento relacionados
    db.data.monitoring_data = db.data.monitoring_data.filter(md => md.animal_id !== animalId);
    await db.write();

    res.json({ message: 'Animal deletado com sucesso' });
});

module.exports = router;

