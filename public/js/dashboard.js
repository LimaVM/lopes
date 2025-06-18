// Variáveis globais do dashboard
let selectedAnimalId = null;
let monitoringInterval = null;
let gpsUpdateInterval = null;
let currentUserId = null;
let map = null;
let animalMarker = null;

// Inicializar dashboard
document.addEventListener("DOMContentLoaded", () => {
    if (window.location.pathname === "/dashboard.html") { // Alterado para .html
        // Obter ID do usuário logado
        const userData = localStorage.getItem("userData");
        if (userData) {
            currentUserId = JSON.parse(userData).id;
        }
        
        loadAnimals();
        startMonitoring();
        initializeMap(); // Inicializa o mapa
        initializeGPSSimulator();
    }
});

// Inicializar mapa Leaflet
function initializeMap() {
    map = L.map("mapid").setView([-23.5505, -46.6333], 13); // Posição inicial: São Paulo

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
    }).addTo(map);

    // Adicionar um marcador inicial (opcional, pode ser removido se a posição for atualizada pelo GPS)
    animalMarker = L.marker([-23.5505, -46.6333]).addTo(map)
        .bindPopup("Posição do Animal")
        .openPopup();
}

// Atualizar display do GPS e mapa
function updateGPSDisplay(positionData) {
    if (selectedAnimalId === positionData.animalId) {
        const locationElement = document.getElementById("location");
        if (locationElement) {
            locationElement.textContent = "Ativo";
            locationElement.title = `Lat: ${positionData.latitude.toFixed(6)}, Lng: ${positionData.longitude.toFixed(6)}`;
        }
        
        // Atualizar informações detalhadas se houver um painel específico
        updateGPSDetails(positionData);

        // Atualizar marcador no mapa
        if (map && animalMarker) {
            const newLatLng = new L.LatLng(positionData.latitude, positionData.longitude);
            animalMarker.setLatLng(newLatLng);
            map.setView(newLatLng, map.getZoom()); // Centraliza o mapa na nova posição
        }
    }
}

// Atualizar detalhes do GPS
function updateGPSDetails(positionData) {
    // Criar ou atualizar painel de detalhes GPS
    let gpsDetailsPanel = document.getElementById("gpsDetailsPanel");
    if (!gpsDetailsPanel) {
        gpsDetailsPanel = createGPSDetailsPanel();
    }
    
    const details = gpsDetailsPanel.querySelector(".gps-details");
    if (details) {
        details.innerHTML = `
            <div class="gps-detail-item">
                <span class="label">Latitude:</span>
                <span class="value">${positionData.latitude.toFixed(6)}</span>
            </div>
            <div class="gps-detail-item">
                <span class="label">Longitude:</span>
                <span class="value">${positionData.longitude.toFixed(6)}</span>
            </div>
            <div class="gps-detail-item">
                <span class="label">Precisão:</span>
                <span class="value">${positionData.accuracy.toFixed(1)}m</span>
            </div>
            <div class="gps-detail-item">
                <span class="label">Velocidade:</span>
                <span class="value">${positionData.speed.toFixed(2)} m/s</span>
            </div>
            <div class="gps-detail-item">
                <span class="label">Direção:</span>
                <span class="value">${positionData.heading.toFixed(0)}°</span>
            </div>
            <div class="gps-detail-item">
                <span class="label">Última atualização:</span>
                <span class="value">${new Date(positionData.timestamp).toLocaleTimeString()}</span>
            </div>
        `;
    }
}

// Criar painel de detalhes GPS
function createGPSDetailsPanel() {
    const panel = document.createElement("div");
    panel.id = "gpsDetailsPanel";
    panel.className = "gps-details-panel";
    panel.innerHTML = `
        <div class="panel-header">
            <h3>Detalhes GPS</h3>
            <div class="gps-controls">
                <button onclick="toggleGPSSimulation()" class="btn btn-sm btn-success" id="gpsToggleBtn">
                    <i class="fas fa-play"></i> Iniciar GPS
                </button>
                <button onclick="changeMovementPattern()" class="btn btn-sm btn-secondary" id="movementPatternBtn">
                    <i class="fas fa-route"></i> Aleatório
                </button>
                <button onclick="simulateGPSEmergency()" class="btn btn-sm btn-danger">
                    <i class="fas fa-exclamation-triangle"></i> Emergência
                </button>
                <button onclick="simulateSignalLoss()" class="btn btn-sm btn-warning">
                    <i class="fas fa-signal"></i> Perda Sinal
                </button>
            </div>
        </div>
        <div class="gps-details">
            <p>Selecione um animal para ver os detalhes do GPS</p>
        </div>
    `;
    
    // Inserir após o painel de monitoramento
    const dashboardGrid = document.querySelector(".dashboard-grid");
    if (dashboardGrid) {
        dashboardGrid.appendChild(panel);
    }
    
    return panel;
}

// Alternar simulação GPS
function toggleGPSSimulation() {
    if (!selectedAnimalId) {
        showNotification("Selecione um animal primeiro", "warning");
        return;
    }
    
    const btn = document.getElementById("gpsToggleBtn");
    
    if (window.gpsSimulator.isRunning) {
        window.gpsSimulator.stop();
        btn.innerHTML = "<i class=\"fas fa-play\"></i> Iniciar GPS";
        btn.classList.remove("btn-danger");
        btn.classList.add("btn-success");
    } else {
        // Inicializar com ID do usuário e animal
        window.gpsSimulator.init(selectedAnimalId, currentUserId);
        window.gpsSimulator.start(3000); // Atualizar a cada 3 segundos
        
        btn.innerHTML = "<i class=\"fas fa-stop\"></i> Parar GPS";
        btn.classList.remove("btn-success");
        btn.classList.add("btn-danger");
        
        showNotification("Simulação GPS iniciada", "success");
    }
}

// Alterar padrão de movimento
function changeMovementPattern() {
    if (!window.gpsSimulator.isRunning) {
        showNotification("Inicie a simulação GPS primeiro", "warning");
        return;
    }
    
    const patterns = ["random", "circular", "linear"];
    const currentPattern = window.gpsSimulator.movementPattern;
    const currentIndex = patterns.indexOf(currentPattern);
    const nextIndex = (currentIndex + 1) % patterns.length;
    const nextPattern = patterns[nextIndex];
    
    window.gpsSimulator.setMovementPattern(nextPattern);
    
    const btn = document.getElementById("movementPatternBtn");
    const patternNames = {
        "random": "Aleatório",
        "circular": "Circular",
        "linear": "Linear"
    };
    
    btn.innerHTML = `<i class="fas fa-route"></i> ${patternNames[nextPattern]}`;
    showNotification(`Padrão alterado para: ${patternNames[nextPattern]}`, "info");
}

// Salvar dados GPS no servidor
async function saveGPSData(positionData) {
    try {
        await authenticatedFetch(`/api/monitoring/${positionData.animalId}/data`, {
            method: "POST",
            body: JSON.stringify({
                heart_rate: document.getElementById("heartRate").textContent || 70,
                temperature: parseFloat(document.getElementById("temperature").textContent) || 38.5,
                humidity: parseInt(document.getElementById("humidity").textContent) || 60,
                latitude: positionData.latitude,
                longitude: positionData.longitude,
                activity_level: "Moderada"
            })
        });
    } catch (error) {
        console.error("Erro ao salvar dados GPS:", error);
    }
}

// Obter ícone da espécie
function getSpeciesIcon(species) {
    const icons = {
        "Cão": "fas fa-dog",
        "Gato": "fas fa-cat",
        "Cavalo": "fas fa-horse",
        "Vaca": "fas fa-cow",
        "Ovelha": "fas fa-sheep",
        "Porco": "fas fa-pig",
        "Bode": "fas fa-goat"
    };
    return icons[species] || "fas fa-paw";
}

// Carregar lista de animais
async function loadAnimals() {
    try {
        const response = await authenticatedFetch("/api/animals");
        const animals = await response.json();
        
        const animalList = document.getElementById("animalList");
        animalList.innerHTML = "";
        
        if (animals.length === 0) {
            animalList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-paw"></i>
                    </div>
                    <h3>Nenhum animal cadastrado</h3>
                    <p>Comece adicionando seu primeiro animal para monitoramento</p>
                    <button class="btn btn-primary" onclick="openAddAnimalModal()">
                        <i class="fas fa-plus"></i>
                        Adicionar Primeiro Animal
                    </button>
                </div>
            `;
            return;
        }
        
        animals.forEach(animal => {
            // Filtrar animais para exibir apenas Gado, Bode e Porco
            if (!["Gado", "Bode", "Porco"].includes(animal.species)) {
                return; // Pular este animal se não for um dos tipos desejados
            }
            const animalCard = document.createElement("div");
            animalCard.className = "animal-card";
            animalCard.dataset.animalId = animal.id; // Adiciona o ID do animal como data attribute
            animalCard.onclick = (event) => selectAnimal(animal.id, animal.name, event.currentTarget); // Passa o elemento do card
            
            const speciesIcon = getSpeciesIcon(animal.species);
            
            animalCard.innerHTML = `
                <div class="animal-icon">
                    <i class="${speciesIcon}"></i>
                </div>
                <div class="animal-info">
                    <h4>${animal.name}</h4>
                    <div class="animal-meta">
                        <span class="species-tag">
                            <i class="${speciesIcon}"></i>
                            ${animal.species}
                        </span>
                        ${animal.age ? `<span class="meta-item"><i class="fas fa-calendar"></i> ${animal.age} anos</span>` : ""}
                        ${animal.weight ? `<span class="meta-item"><i class="fas fa-weight"></i> ${animal.weight}kg</span>` : ""}
                    </div>
                    ${animal.description ? `<p class="animal-description">${animal.description}</p>` : ""}
                </div>
                <div class="animal-status">
                    <div class="status-indicator status-offline" id="status-${animal.id}">
                        <i class="fas fa-circle"></i>
                        <span>Offline</span>
                    </div>
                </div>
            `;
            
            animalList.appendChild(animalCard);
        });
        
        // Selecionar o primeiro animal automaticamente
        if (animals.length > 0) {
            // Simula o clique no primeiro card para acionar selectAnimal corretamente
            const firstAnimalCard = animalList.querySelector(".animal-card");
            if (firstAnimalCard) {
                // Passa null para o evento, pois não há um evento real aqui
                selectAnimal(animals[0].id, animals[0].name, firstAnimalCard);
            }
        }
        
    } catch (error) {
        console.error("Erro ao carregar animais:", error);
        showNotification("Erro ao carregar animais", "error");
    }
}

// Selecionar animal
function selectAnimal(animalId, animalName, targetElement) {
    selectedAnimalId = animalId;
    
    // Atualizar visual da seleção
    document.querySelectorAll(".animal-card").forEach(card => {
        card.classList.remove("active");
    });
    
    if (targetElement) {
        targetElement.classList.add("active");
    } else {
        // Fallback para encontrar o card se targetElement não for fornecido (ex: chamada direta)
        const cardToActivate = document.querySelector(`.animal-card[data-animal-id="${animalId}"]`);
        if (cardToActivate) {
            cardToActivate.classList.add("active");
        }
    }
    
    // Atualizar nome do animal selecionado
    document.getElementById("selectedAnimalName").textContent = animalName;
    
    // Parar simulação GPS anterior se estiver rodando
    if (window.gpsSimulator && window.gpsSimulator.isRunning) {
        window.gpsSimulator.stop();
        const btn = document.getElementById("gpsToggleBtn");
        if (btn) {
            btn.innerHTML = "<i class=\"fas fa-play\"></i> Iniciar GPS";
            btn.classList.remove("btn-danger");
            btn.classList.add("btn-success");
        }
    }
    
    // Atualizar status do animal
    updateAnimalStatus(animalId, "online");
    
    // Carregar dados do animal
    loadAnimalData(animalId);
}

// Atualizar status do animal
function updateAnimalStatus(animalId, status) {
    const statusElement = document.getElementById(`status-${animalId}`);
    if (statusElement) {
        statusElement.className = `status-indicator status-${status}`;
        statusElement.innerHTML = `
            <i class="fas fa-circle"></i>
            <span>${status === "online" ? "Online" : "Offline"}</span>
        `;
    }
}

// Carregar dados do animal selecionado
async function loadAnimalData(animalId) {
    try {
        const response = await authenticatedFetch(`/api/monitoring/${animalId}/latest`);
        const data = await response.json();
        
        if (data) {
            updateMetrics(data);
        } else {
            // Se não há dados, mostrar valores simulados
            generateSimulatedData();
        }
        
    } catch (error) {
        console.error("Erro ao carregar dados do animal:", error);
        generateSimulatedData();
    }
}

// Atualizar métricas na tela
function updateMetrics(data) {
    document.getElementById("heartRate").textContent = data.heart_rate || "--";
    document.getElementById("temperature").textContent = data.temperature ? `${data.temperature}` : "--";
    document.getElementById("humidity").textContent = data.humidity ? `${data.humidity}` : "--";
    document.getElementById("location").textContent = data.latitude && data.longitude ? "Ativo" : "--";
    
    // Atualizar título com coordenadas se disponível
    if (data.latitude && data.longitude) {
        document.getElementById("location").title = `Lat: ${data.latitude.toFixed(6)}, Lng: ${data.longitude.toFixed(6)}`;
    }
}

// Gerar dados simulados
function generateSimulatedData() {
    const heartRate = 60 + Math.floor(Math.random() * 40); // 60-100 BPM
    const temperature = (36 + Math.random() * 4).toFixed(1); // 36-40°C
    const humidity = (40 + Math.random() * 40).toFixed(0); // 40-80%
    
    updateMetrics({
        heart_rate: heartRate,
        temperature: temperature,
        humidity: humidity,
        latitude: -23.5505,
        longitude: -46.6333
    });
}

// Iniciar monitoramento em tempo real
function startMonitoring() {
    // Atualizar dados a cada 5 segundos
    monitoringInterval = setInterval(() => {
        if (selectedAnimalId) {
            loadAnimalData(selectedAnimalId);
        }
    }, 5000);
}

// Parar monitoramento
function stopMonitoring() {
    if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
    }
    
    if (gpsUpdateInterval) {
        clearInterval(gpsUpdateInterval);
        gpsUpdateInterval = null;
    }
}

// Modal para adicionar animal
function openAddAnimalModal() {
    document.getElementById("addAnimalModal").style.display = "block";
}

function closeAddAnimalModal() {
    document.getElementById("addAnimalModal").style.display = "none";
    document.getElementById("addAnimalForm").reset();
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById("addAnimalModal");
    if (event.target === modal) {
        closeAddAnimalModal();
    }
}

// Formulário de adicionar animal
document.addEventListener("DOMContentLoaded", () => {
    const addAnimalForm = document.getElementById("addAnimalForm");
    if (addAnimalForm) {
        addAnimalForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = new FormData(addAnimalForm);
            
            try {
                const response = await authenticatedFetch("/api/animals", {
                    method: "POST",
                    body: JSON.stringify({
                        name: formData.get("name"),
                        species: formData.get("species"),
                        age: formData.get("age") ? parseInt(formData.get("age")) : null,
                        weight: formData.get("weight") ? parseFloat(formData.get("weight")) : null,
                        description: formData.get("description")
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showNotification("Animal adicionado com sucesso!");
                    closeAddAnimalModal();
                    loadAnimals(); // Recarregar lista
                } else {
                    showNotification(data.error || "Erro ao adicionar animal", "error");
                }
            } catch (error) {
                showNotification("Erro de conexão", "error");
            }
        });
    }
});

// Simular emergência GPS
function simulateGPSEmergency() {
    if (!window.gpsSimulator || !window.gpsSimulator.isRunning) {
        showNotification("Inicie a simulação GPS primeiro", "warning");
        return;
    }
    
    window.gpsSimulator.simulateEmergency();
    showNotification("Emergência simulada - animal parado", "warning");
}

// Simular perda de sinal GPS
function simulateSignalLoss() {
    if (!window.gpsSimulator || !window.gpsSimulator.isRunning) {
        showNotification("Inicie a simulação GPS primeiro", "warning");
        return;
    }
    
    window.gpsSimulator.simulateSignalLoss(15000); // 15 segundos
    showNotification("Simulando perda de sinal GPS por 15 segundos", "info");
}

// Limpar intervalos quando sair da página
window.addEventListener("beforeunload", () => {
    stopMonitoring();
    if (window.gpsSimulator && window.gpsSimulator.isRunning) {
        window.gpsSimulator.stop();
    }
});




// Inicializar simulador GPS
function initializeGPSSimulator() {
    // Adicionar callback para o simulador GPS
    window.gpsSimulator.addCallback(updateGPSDisplay);
    window.gpsSimulator.addCallback(saveGPSData); // Para salvar os dados no backend
}


