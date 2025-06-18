// Simulador de GPS para AnimalIoT

// Lista de coordenadas de grandes cidades para simular localização em terra firme
const LAND_LOCATIONS = [
    { name: "São Paulo, Brasil", lat: -23.5505, lng: -46.6333 },
    { name: "Nova Iorque, EUA", lat: 40.7128, lng: -74.0060 },
    { name: "Londres, Reino Unido", lat: 51.5074, lng: -0.1278 },
    { name: "Tóquio, Japão", lat: 35.6895, lng: 139.6917 },
    { name: "Sydney, Austrália", lat: -33.8688, lng: 151.2093 },
    { name: "Cairo, Egito", lat: 30.0444, lng: 31.2357 },
    { name: "Cidade do Cabo, África do Sul", lat: -33.9249, lng: 18.4241 },
    { name: "Buenos Aires, Argentina", lat: -34.6037, lng: -58.3816 },
    { name: "Paris, França", lat: 48.8566, lng: 2.3522 },
    { name: "Pequim, China", lat: 39.9042, lng: 116.4074 }
];

class GPSSimulator {
    constructor() {
        this.isRunning = false;
        this.currentPosition = { latitude: 0, longitude: 0 };
        this.speed = 0.0001; // Velocidade de movimento em graus
        this.direction = 0; // Direção em radianos
        this.updateInterval = null;
        this.callbacks = [];
        this.animalId = null;
        this.userId = null; // Adicionado para agrupar animais por usuário
        this.userCenterPoint = {}; // Ponto central para o usuário
        this.movementPattern = 'random'; // random, circular, linear
        this.boundaryRadius = 0.005; // Raio de movimento em graus (~500m)
    }

    // Inicializar simulador para um animal e usuário específicos
    init(animalId, userId, initialPosition = null) {
        this.animalId = animalId;
        this.userId = userId;

        // Se não houver um ponto central para o usuário, defina um aleatoriamente
        if (!this.userCenterPoint[userId]) {
            const randomLocation = LAND_LOCATIONS[Math.floor(Math.random() * LAND_LOCATIONS.length)];
            this.userCenterPoint[userId] = { ...randomLocation };
            console.log(`Ponto central para o usuário ${userId} definido em: ${randomLocation.name}`);
        }

        // Defina a posição inicial do animal perto do ponto central do usuário
        if (initialPosition) {
            this.currentPosition = { ...initialPosition };
        } else {
            const center = this.userCenterPoint[userId];
            this.currentPosition = {
                latitude: center.lat + (Math.random() - 0.5) * this.boundaryRadius,
                longitude: center.lng + (Math.random() - 0.5) * this.boundaryRadius
            };
        }
        console.log(`GPS Simulator inicializado para animal ${animalId} do usuário ${userId}`);
    }

    // Adicionar callback para receber atualizações de posição
    addCallback(callback) {
        this.callbacks.push(callback);
    }

    // Remover callback
    removeCallback(callback) {
        const index = this.callbacks.indexOf(callback);
        if (index > -1) {
            this.callbacks.splice(index, 1);
        }
    }

    // Notificar todos os callbacks
    notifyCallbacks(position) {
        this.callbacks.forEach(callback => {
            try {
                callback(position);
            } catch (error) {
                console.error('Erro ao executar callback GPS:', error);
            }
        });
    }

    // Iniciar simulação
    start(updateIntervalMs = 5000) {
        if (this.isRunning) {
            console.log('GPS Simulator já está rodando');
            return;
        }

        this.isRunning = true;
        console.log('Iniciando GPS Simulator...');

        this.updateInterval = setInterval(() => {
            this.updatePosition();
        }, updateIntervalMs);

        // Primeira atualização imediata
        this.updatePosition();
    }

    // Parar simulação
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('GPS Simulator parado');
    }

    // Atualizar posição baseada no padrão de movimento
    updatePosition() {
        switch (this.movementPattern) {
            case 'random':
                this.randomMovement();
                break;
            case 'circular':
                this.circularMovement();
                break;
            case 'linear':
                this.linearMovement();
                break;
            default:
                this.randomMovement();
        }

        // Garantir que não saia dos limites do ponto central do usuário
        this.enforceGeofence();

        // Notificar callbacks
        const positionData = {
            animalId: this.animalId,
            latitude: this.currentPosition.latitude,
            longitude: this.currentPosition.longitude,
            timestamp: new Date().toISOString(),
            accuracy: Math.random() * 10 + 5, // 5-15 metros
            speed: this.calculateSpeed(),
            heading: this.direction * (180 / Math.PI) // Converter para graus
        };

        this.notifyCallbacks(positionData);
    }

    // Movimento aleatório
    randomMovement() {
        // Gerar nova direção aleatória
        this.direction = Math.random() * 2 * Math.PI;
        
        // Movimento pequeno na direção escolhida
        const deltaLat = Math.cos(this.direction) * this.speed * (0.5 + Math.random());
        const deltaLng = Math.sin(this.direction) * this.speed * (0.5 + Math.random());
        
        this.currentPosition.latitude += deltaLat;
        this.currentPosition.longitude += deltaLng;
    }

    // Movimento circular
    circularMovement() {
        this.direction += 0.1; // Incrementar direção para movimento circular
        
        const radius = this.boundaryRadius * 0.7;
        const center = this.userCenterPoint[this.userId];
        this.currentPosition.latitude = center.lat + Math.cos(this.direction) * radius;
        this.currentPosition.longitude = center.lng + Math.sin(this.direction) * radius;
    }

    // Movimento linear
    linearMovement() {
        // Manter direção constante, mas com pequenas variações
        this.direction += (Math.random() - 0.5) * 0.2;
        
        const deltaLat = Math.cos(this.direction) * this.speed;
        const deltaLng = Math.sin(this.direction) * this.speed;
        
        this.currentPosition.latitude += deltaLat;
        this.currentPosition.longitude += deltaLng;
    }

    // Garantir que o animal não saia da área definida para o usuário
    enforceGeofence() {
        const center = this.userCenterPoint[this.userId];
        if (!center) return; // Não há ponto central definido

        const distance = this.calculateDistance(
            center.lat,
            center.lng,
            this.currentPosition.latitude,
            this.currentPosition.longitude
        );

        if (distance > this.boundaryRadius) {
            // Calcular direção de volta ao centro
            const angleToCenter = Math.atan2(
                center.lng - this.currentPosition.longitude,
                center.lat - this.currentPosition.latitude
            );
            
            // Mover de volta para dentro dos limites
            this.currentPosition.latitude = center.lat + Math.cos(angleToCenter) * this.boundaryRadius * 0.9;
            this.currentPosition.longitude = center.lng + Math.sin(angleToCenter) * this.boundaryRadius * 0.9;
            
            // Ajustar direção para evitar sair novamente
            this.direction = angleToCenter + (Math.random() - 0.5) * Math.PI;
        }
    }

    // Calcular distância entre dois pontos (em graus)
    calculateDistance(lat1, lng1, lat2, lng2) {
        const deltaLat = lat2 - lat1;
        const deltaLng = lng2 - lng1;
        return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng);
    }

    // Calcular velocidade aproximada
    calculateSpeed() {
        return this.speed * 111000; // Converter graus para metros aproximadamente
    }

    // Definir padrão de movimento
    setMovementPattern(pattern) {
        if (['random', 'circular', 'linear'].includes(pattern)) {
            this.movementPattern = pattern;
            console.log(`Padrão de movimento alterado para: ${pattern}`);
        }
    }

    // Definir velocidade
    setSpeed(speed) {
        this.speed = Math.max(0.00001, Math.min(0.001, speed)); // Limitar velocidade
    }

    // Definir área de movimento
    setBoundaryRadius(radius) {
        this.boundaryRadius = Math.max(0.001, Math.min(0.01, radius)); // Limitar raio
    }

    // Simular perda de sinal GPS
    simulateSignalLoss(durationMs = 30000) {
        console.log('Simulando perda de sinal GPS...');
        const originalCallback = this.notifyCallbacks;
        
        this.notifyCallbacks = () => {
            // Não notificar durante perda de sinal
        };
        
        setTimeout(() => {
            this.notifyCallbacks = originalCallback;
            console.log('Sinal GPS restaurado');
            this.updatePosition(); // Atualização imediata após restaurar
        }, durationMs);
    }

    // Obter posição atual
    getCurrentPosition() {
        return {
            animalId: this.animalId,
            latitude: this.currentPosition.latitude,
            longitude: this.currentPosition.longitude,
            timestamp: new Date().toISOString(),
            accuracy: Math.random() * 10 + 5,
            speed: this.calculateSpeed(),
            heading: this.direction * (180 / Math.PI)
        };
    }

    // Definir posição manualmente
    setPosition(latitude, longitude) {
        this.currentPosition.latitude = latitude;
        this.currentPosition.longitude = longitude;
        const center = this.userCenterPoint[this.userId];
        if (center) {
            center.lat = latitude;
            center.lng = longitude;
        }
        console.log(`Posição definida para: ${latitude}, ${longitude}`);
    }

    // Simular emergência (animal parado)
    simulateEmergency() {
        console.log('Simulando emergência - animal parado');
        const originalSpeed = this.speed;
        this.speed = 0;
        
        // Restaurar movimento após 2 minutos
        setTimeout(() => {
            this.speed = originalSpeed;
            console.log('Emergência resolvida - movimento restaurado');
        }, 120000);
    }

    // Obter estatísticas do simulador
    getStats() {
        return {
            isRunning: this.isRunning,
            animalId: this.animalId,
            userId: this.userId,
            currentPosition: this.currentPosition,
            movementPattern: this.movementPattern,
            speed: this.speed,
            boundaryRadius: this.boundaryRadius,
            callbacksCount: this.callbacks.length
        };
    }
}

// Instância global do simulador
window.gpsSimulator = new GPSSimulator();

// Exportar para uso em módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GPSSimulator;
}

