# AnimalIoT - Sistema de Monitoramento de Animais

## Descrição
Sistema completo de monitoramento IoT para animais com simulação GPS integrada, interface responsiva e dados em tempo real.

## Funcionalidades Implementadas

### ✅ Backend
- Sistema de autenticação JWT
- API RESTful completa
- Banco de dados JSON (lowdb)
- Simulador de dados de sensores
- Simulador GPS integrado
- Rotas para monitoramento em tempo real

### ✅ Frontend
- Interface moderna e responsiva
- Dashboard interativo
 - Sistema de notificações centralizadas
- Simulador GPS com controles
- Múltiplos padrões de movimento (aleatório, circular, linear)
- Métricas em tempo real
- Design mobile-first

### ✅ Simulador GPS
- Movimento realista dos animais
- Múltiplos padrões de movimento
- Controles interativos
- Geofencing automático
- Simulação de emergências
- Perda de sinal GPS

### ✅ Melhorias de UX/UI
- Design moderno com gradientes
- Animações suaves
- Responsividade completa
- Notificações em tempo real
- Estados de loading
- Feedback visual

## Estrutura do Projeto

```
projeto-lopes-codex-mudar-l-gica-para-usar-.json/
├── data/
│   └── db.json                 # Banco de dados JSON
├── models/
│   └── simulator.js           # Simulador de dados dos sensores
├── public/
│   ├── css/
│   │   ├── auth.css          # Estilos de autenticação
│   │   └── style.css         # Estilos principais (melhorado)
│   ├── js/
│   │   ├── auth.js           # Lógica de autenticação
│   │   ├── dashboard.js      # Dashboard com GPS integrado
│   │   ├── gps-simulator.js  # Simulador GPS completo
│   │   └── main.js           # Utilitários e funções auxiliares
│   ├── dashboard.html        # Dashboard principal
│   ├── index.html           # Página inicial
│   ├── login.html           # Página de login
│   └── register.html        # Página de registro
├── routes/
│   ├── animals.js           # Rotas dos animais
│   ├── auth.js              # Rotas de autenticação
│   ├── monitoring.js        # Rotas de monitoramento
│   └── serverInfo.js        # Informações do servidor
├── database.js              # Configuração do banco
├── package.json             # Dependências
└── server.js                # Servidor principal
```

## Tecnologias Utilizadas

### Backend
- Node.js
- Express.js
- LowDB (banco JSON)
- JWT (autenticação)
- bcryptjs (criptografia)

### Frontend
- HTML5 semântico
- CSS3 moderno (Grid, Flexbox, Animations)
- JavaScript ES6+
- Font Awesome (ícones)
- Google Fonts (Inter)

## Como Executar

1. Instalar dependências:
```bash
npm install
```

2. Iniciar o servidor:
```bash
node server.js
```

3. Acessar no navegador:
```
http://localhost:3000
```

## Funcionalidades do Simulador GPS

### Padrões de Movimento
- **Aleatório**: Movimento imprevisível dentro da área
- **Circular**: Movimento em círculos ao redor do ponto central
- **Linear**: Movimento em linha reta com pequenas variações

### Controles Disponíveis
- Iniciar/Parar simulação
- Alternar padrões de movimento
- Simular emergências
- Simular perda de sinal

### Dados Simulados
- Coordenadas GPS (latitude/longitude)
- Precisão do sinal
- Velocidade de movimento
- Direção (heading)
- Timestamp das atualizações

## Melhorias Implementadas

### Design e UX
- Interface moderna com gradientes
- Cards com hover effects
- Animações suaves
- Design responsivo para mobile
- Sistema de notificações melhorado (avisos centralizados com ícones)
- Estados de loading visuais

### Funcionalidades
- Simulador GPS completo integrado
- Múltiplas espécies de animais
- Dados em tempo real
- Geofencing automático
- Controles interativos do GPS
- Feedback visual em tempo real

### Performance
- Otimização de CSS
- JavaScript modular
- Lazy loading de imagens
- Debounce e throttle
- Gerenciamento eficiente de estado

## Dados JSON
Todos os dados são armazenados em formato JSON:
- Usuários
- Animais
- Dados de monitoramento
- Contadores automáticos

## Responsividade
- Design mobile-first
- Breakpoints otimizados
- Layout adaptativo
- Touch-friendly
- Performance em dispositivos móveis

## Próximas Melhorias Sugeridas
- Gráficos em tempo real
- Mapas interativos
- Alertas personalizáveis
- Relatórios detalhados
- Integração com APIs de mapas
- PWA (Progressive Web App)
- Notificações push

