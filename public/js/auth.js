// Funções de autenticação
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Verificar se o usuário está logado
function checkAuth() {
    const token = localStorage.getItem('authToken');
    const currentPage = window.location.pathname;
    
    if (!token && currentPage === '/dashboard') {
        window.location.href = '/login';
        return false;
    }
    
    if (token && (currentPage === '/login' || currentPage === '/register')) {
        window.location.href = '/dashboard';
        return false;
    }
    
    return true;
}

// Fazer logout
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    window.location.href = '/';
}

// Event listeners para formulários
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Formulário de registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(registerForm);
            const password = formData.get('password');
            const confirmPassword = formData.get('confirmPassword');
            
            if (password !== confirmPassword) {
                showNotification('As senhas não coincidem!', 'error');
                return;
            }
            
            try {
                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: formData.get('username'),
                        email: formData.get('email'),
                        password: formData.get('password')
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    showNotification('Conta criada com sucesso!');
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1500);
                } else {
                    showNotification(data.error || 'Erro ao criar conta', 'error');
                }
            } catch (error) {
                showNotification('Erro de conexão', 'error');
            }
        });
    }
    
    // Formulário de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(loginForm);
            
            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        email: formData.get('email'),
                        password: formData.get('password')
                    })
                });
                
                const data = await response.json();
                
                if (response.ok) {
                    localStorage.setItem('authToken', data.token);
                    localStorage.setItem('userData', JSON.stringify(data.user));
                    showNotification('Login realizado com sucesso!');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    showNotification(data.error || 'Erro ao fazer login', 'error');
                }
            } catch (error) {
                showNotification('Erro de conexão', 'error');
            }
        });
    }
    
    // Botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

// Função para fazer requisições autenticadas
async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers
        }
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        return response;
    } catch (error) {
        console.error('Erro na requisição:', error);
        throw error;
    }
}

