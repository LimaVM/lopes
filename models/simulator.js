const { nextId } = require('../database');

class AnimalSimulator {
    constructor(database) {
        this.db = database;
        this.simulationIntervals = new Map();
        this.isRunning = false;
    }

    // Iniciar simulação para todos os animais
    startGlobalSimulation() {
        if (this.isRunning) {
            console.log('Simulação já está rodando');
            return;
        }

        this.isRunning = true;
        console.log('Iniciando simulação global de animais...');

        // Executar simulação a cada 30 segundos
        this.globalInterval = setInterval(() => {
            this.simulateAllAnimals();
        }, 30000);

        // Executar uma vez imediatamente
        this.simulateAllAnimals();
    }

    // Parar simulação global
    stopGlobalSimulation() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        
        if (this.globalInterval) {
            clearInterval(this.globalInterval);
            this.globalInterval = null;
        }

        console.log('Simulação global parada');
    }

    // Simular dados para todos os animais
    async simulateAllAnimals() {
        if (!this.db) {
            console.log('Banco de dados não disponível para simulação');
            return;
        }

        await this.db.read();
        const animals = this.db.data.animals || [];

        animals.forEach(animal => {
            this.simulateAnimalData(animal.id, animal.species);
        });

        if (animals.length > 0) {
            console.log(`Dados simulados para ${animals.length} animais`);
        }
    }

    // Simular dados para um animal específico
    simulateAnimalData(animalId, species = 'Cão') {
        if (!this.db) return;

        const data = this.generateRealisticData(species);
        const record = {
            id: nextId('monitoring_data'),
            animal_id: animalId,
            ...data,
            timestamp: new Date().toISOString()
        };

        this.db.data.monitoring_data.push(record);
        this.db.write();
    }

    // Gerar dados realistas baseados na espécie
    generateRealisticData(species) {
        const speciesData = this.getSpeciesBaseData(species);
        
        // Variações realistas
        const heartRate = this.generateVariation(speciesData.baseHeartRate, speciesData.heartRateVariation);
        const temperature = this.generateVariation(speciesData.baseTemperature, speciesData.temperatureVariation);
        const humidity = this.generateVariation(60, 15); // Umidade ambiente
        
        // Localização simulada (região de São Paulo com movimento)
        const location = this.generateLocation();
        
        // Nível de atividade baseado no horário
        const activityLevel = this.getActivityLevel();
        
        return {
            heart_rate: Math.round(heartRate),
            temperature: parseFloat(temperature.toFixed(1)),
            humidity: Math.round(humidity),
            latitude: parseFloat(location.latitude.toFixed(6)),
            longitude: parseFloat(location.longitude.toFixed(6)),
            activity_level: activityLevel
        };
    }

    // Dados base por espécie
    getSpeciesBaseData(species) {
        const speciesMap = {
            'Cão': {
                baseHeartRate: 90,
                heartRateVariation: 30,
                baseTemperature: 38.5,
                temperatureVariation: 1.0
            },
            'Gato': {
                baseHeartRate: 140,
                heartRateVariation: 40,
                baseTemperature: 38.8,
                temperatureVariation: 0.8
            },
            'Cavalo': {
                baseHeartRate: 40,
                heartRateVariation: 15,
                baseTemperature: 37.8,
                temperatureVariation: 0.7
            },
            'Vaca': {
                baseHeartRate: 65,
                heartRateVariation: 20,
                baseTemperature: 38.3,
                temperatureVariation: 0.9
            },
            'Ovelha': {
                baseHeartRate: 80,
                heartRateVariation: 25,
                baseTemperature: 39.0,
                temperatureVariation: 0.8
            },
            'Porco': {
                baseHeartRate: 75,
                heartRateVariation: 20,
                baseTemperature: 38.7,
                temperatureVariation: 0.9
            }
        };

        return speciesMap[species] || speciesMap['Cão']; // Default para cão
    }

    // Gerar variação realista
    generateVariation(baseValue, variation) {
        const randomFactor = (Math.random() - 0.5) * 2; // -1 a 1
        return baseValue + (randomFactor * variation);
    }

    // Gerar localização com movimento simulado
    generateLocation() {
        // Base: São Paulo
        const baseLat = -23.5505;
        const baseLng = -46.6333;
        
        // Movimento simulado em um raio de ~1km
        const radiusKm = 1;
        const radiusDegrees = radiusKm / 111; // Aproximadamente 1 grau = 111km
        
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radiusDegrees;
        
        const latitude = baseLat + (distance * Math.cos(angle));
        const longitude = baseLng + (distance * Math.sin(angle));
        
        return { latitude, longitude };
    }

    // Determinar nível de atividade baseado no horário
    getActivityLevel() {
        const hour = new Date().getHours();
        
        if (hour >= 6 && hour <= 10) {
            return 'Alta'; // Manhã ativa
        } else if (hour >= 11 && hour <= 14) {
            return 'Moderada'; // Meio-dia
        } else if (hour >= 15 && hour <= 18) {
            return 'Alta'; // Tarde ativa
        } else if (hour >= 19 && hour <= 22) {
            return 'Moderada'; // Noite
        } else {
            return 'Baixa'; // Madrugada/sono
        }
    }

    // Simular situação de emergência (batimentos muito altos/baixos)
    simulateEmergency(animalId, emergencyType = 'high_heart_rate') {
        if (!this.db) return;

        let data;
        
        switch (emergencyType) {
            case 'high_heart_rate':
                data = {
                    heart_rate: 180 + Math.floor(Math.random() * 20), // 180-200 BPM
                    temperature: 39.5 + Math.random(),
                    humidity: 65,
                    latitude: -23.5505,
                    longitude: -46.6333,
                    activity_level: 'Crítica'
                };
                break;
            case 'low_heart_rate':
                data = {
                    heart_rate: 20 + Math.floor(Math.random() * 15), // 20-35 BPM
                    temperature: 36.0 + Math.random(),
                    humidity: 70,
                    latitude: -23.5505,
                    longitude: -46.6333,
                    activity_level: 'Crítica'
                };
                break;
            case 'high_temperature':
                data = {
                    heart_rate: 120 + Math.floor(Math.random() * 30),
                    temperature: 41.0 + Math.random(), // Febre
                    humidity: 55,
                    latitude: -23.5505,
                    longitude: -46.6333,
                    activity_level: 'Baixa'
                };
                break;
        }
        
        const record = {
            id: nextId('monitoring_data'),
            animal_id: animalId,
            ...data,
            timestamp: new Date().toISOString()
        };
        this.db.data.monitoring_data.push(record);
        this.db.write();
        console.log(`Emergência simulada para animal ${animalId}: ${emergencyType}`);
    }

    // Obter estatísticas da simulação
    async getSimulationStats() {
        if (!this.db) {
            throw new Error('Banco de dados não disponível');
        }

        await this.db.read();
        const oneHourAgo = Date.now() - 60 * 60 * 1000;

        const recent = this.db.data.monitoring_data.filter(d => new Date(d.timestamp).getTime() >= oneHourAgo);
        const animals_monitored = new Set(recent.map(r => r.animal_id)).size;
        const total_data_points = recent.length;
        const avg_heart_rate = total_data_points ? recent.reduce((s, r) => s + r.heart_rate, 0) / total_data_points : null;
        const avg_temperature = total_data_points ? recent.reduce((s, r) => s + r.temperature, 0) / total_data_points : null;
        const last_update = recent.reduce((max, r) => new Date(r.timestamp) > new Date(max) ? r.timestamp : max, null);

        return {
            animals_monitored,
            total_data_points,
            avg_heart_rate,
            avg_temperature,
            last_update
        };
    }
}

module.exports = AnimalSimulator;

