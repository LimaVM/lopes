const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db, nextId } = require('../database');

const router = express.Router();
const JWT_SECRET = 'animal_iot_secret_key_2024'; // Em produção, usar variável de ambiente

// Middleware para verificar token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Rota de registro
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
    }

    try {
        await db.read();
        const exists = db.data.users.find(u => u.email === email || u.username === username);
        if (exists) {
            return res.status(400).json({ error: 'Usuário ou email já existe' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: nextId('users'),
            username,
            email,
            password: hashedPassword,
            created_at: new Date().toISOString()
        };
        db.data.users.push(user);
        await db.write();

        res.status(201).json({
            message: 'Usuário criado com sucesso',
            userId: user.id
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota de login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    try {
        await db.read();
        const user = db.data.users.find(u => u.email === email);
        if (!user) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login realizado com sucesso',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rota para verificar token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: req.user 
    });
});

module.exports = { router, authenticateToken };

