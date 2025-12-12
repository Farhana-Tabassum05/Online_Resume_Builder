const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');
const signUpForm = document.getElementById('signUpForm');
const signInForm = document.getElementById('signInForm');

// Dialog elements
const dialogOverlay = document.getElementById('dialogOverlay');
const dialogIcon = document.getElementById('dialogIcon');
const dialogTitle = document.getElementById('dialogTitle');
const dialogMessage = document.getElementById('dialogMessage');
const dialogPrimaryBtn = document.getElementById('dialogPrimaryBtn');
const dialogSecondaryBtn = document.getElementById('dialogSecondaryBtn');

let dialogResolve = null;

/* ===============================================
   DIALOG SYSTEM
=============================================== */

function showDialog(title, message, icon = 'info', buttons = ['OK']) {
    return new Promise((resolve) => {
        dialogTitle.textContent = title;
        dialogMessage.textContent = message;
        
        // Set icon
        dialogIcon.className = `dialog-icon ${icon}`;
        switch(icon) {
            case 'success':
                dialogIcon.innerHTML = '✓';
                break;
            case 'error':
                dialogIcon.innerHTML = '✕';
                break;
            case 'warning':
                dialogIcon.innerHTML = '!';
                break;
            case 'info':
                dialogIcon.innerHTML = 'i';
                break;
        }
        
        // Set buttons
        dialogPrimaryBtn.textContent = buttons[0] || 'OK';
        if (buttons.length > 1) {
            dialogSecondaryBtn.textContent = buttons[1];
            dialogSecondaryBtn.style.display = 'block';
        } else {
            dialogSecondaryBtn.style.display = 'none';
        }
        
        dialogResolve = resolve;
        dialogOverlay.classList.add('show');
    });
}

// Button handlers
dialogPrimaryBtn.addEventListener('click', () => {
    dialogOverlay.classList.remove('show');
    if (dialogResolve) dialogResolve(true);
});

dialogSecondaryBtn.addEventListener('click', () => {
    dialogOverlay.classList.remove('show');
    if (dialogResolve) dialogResolve(false);
});

// Close on overlay click
dialogOverlay.addEventListener('click', (e) => {
    if (e.target === dialogOverlay) {
        dialogOverlay.classList.remove('show');
        if (dialogResolve) dialogResolve(false);
    }
});

// When the "Sign Up" button (in the overlay) is clicked
signUpButton.addEventListener('click', () => {
    // Add the class that triggers the CSS sliding animation
    container.classList.add("right-panel-active");
});

// When the "Sign In" button (in the overlay) is clicked
signInButton.addEventListener('click', () => {
    // Remove the class to slide back to the default position
    container.classList.remove("right-panel-active");
});

// Handle hash navigation on page load
window.addEventListener('load', () => {
    const hash = window.location.hash;
    
    if (hash === '#sign-up-container') {
        // Show sign up form
        container.classList.add("right-panel-active");
    } else if (hash === '#sign-in-container') {
        // Show sign in form
        container.classList.remove("right-panel-active");
    }
});

// Also handle hash change if user navigates via browser
window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    
    if (hash === '#sign-up-container') {
        container.classList.add("right-panel-active");
    } else if (hash === '#sign-in-container') {
        container.classList.remove("right-panel-active");
    }
});

/* ===============================================
   AUTHENTICATION SYSTEM
=============================================== */

// Backend API configuration - update if your server runs on a different host/port
const API_BASE = 'http://localhost:3000/api';
const USE_API = true; // set to false to keep using localStorage-only auth

const AUTH_STORAGE_KEY = 'resumeCraftAuth';
const USER_STORAGE_KEY = 'resumeCraftUsers';

// Initialize users storage if empty
function initializeUsersStorage() {
    const users = localStorage.getItem(USER_STORAGE_KEY);
    if (!users) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify([]));
    }
}

// Get all registered users
function getAllUsers() {
    const data = localStorage.getItem(USER_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Save new user
function saveUser(name, email, password) {
    const users = getAllUsers();
    
    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return { success: false, message: 'Email already registered!' };
    }
    
    const newUser = {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        password: password, // In production, this should be hashed!
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: 'Account created successfully!', user: newUser };
}

// Verify user login
function verifyUser(email, password) {
    const users = getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        return { success: true, message: 'Login successful!', user: user };
    }
    
    return { success: false, message: 'Invalid email or password!' };
}

// Set authentication token
function setAuthToken(user) {
    const authData = {
        userId: user.id,
        email: user.email,
        name: user.name,
        loginTime: new Date().toISOString()
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
}

// Get current authenticated user
function getCurrentUser() {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
}

// Logout
function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
}

// Sign Up Form Handler
if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signUpName').value.trim();
        const email = document.getElementById('signUpEmail').value.trim();
        const password = document.getElementById('signUpPassword').value.trim();

        if (!name || !email || !password) {
            await showDialog('Validation Error', 'Please fill all fields!', 'warning');
            return;
        }

        if (USE_API) {
            try {
                const resp = await fetch(`${API_BASE}/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                const data = await resp.json();
                if (resp.ok) {
                    const userId = (data.user && (data.user.userId || data.user._id || data.user._id && data.user._id.toString())) || null;
                    const authData = { token: data.token, userId: userId, name: data.user.name, email: data.user.email };
                    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
                    await showDialog('Success', data.message || 'Account created and signed in!', 'success');
                    setTimeout(() => window.location.href = '../resumes.html', 500);
                } else {
                    // Show backend error message if present
                    await showDialog('Error', data.error || data.message || 'Signup failed', 'error');
                }
            } catch (err) {
                // fallback to local storage if backend unreachable
                const result = saveUser(name, email, password);
                if (result.success) {
                    setAuthToken(result.user);
                    await showDialog('Success', result.message, 'success');
                    setTimeout(() => { window.location.href = '../resumes.html'; }, 500);
                } else {
                    await showDialog('Error', result.message, 'error');
                }
            }
        } else {
            const result = saveUser(name, email, password);
            if (result.success) {
                setAuthToken(result.user);
                await showDialog('Success', result.message, 'success');
                setTimeout(() => { window.location.href = '../resumes.html'; }, 500);
            } else {
                await showDialog('Error', result.message, 'error');
            }
        }
        signUpForm.reset();
    });
}

// Sign In Form Handler
if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('signInEmail').value.trim();
        const password = document.getElementById('signInPassword').value.trim();
        
        if (!email || !password) {
            await showDialog('Validation Error', 'Please fill all fields!', 'warning');
            return;
        }
        
        if (USE_API) {
            try {
                // server expects /signin
                const resp = await fetch(`${API_BASE}/auth/signin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await resp.json();
                if (resp.ok) {
                    const userId = (data.user && (data.user.userId || data.user._id || data.user._id && data.user._id.toString())) || null;
                    const authData = { token: data.token, userId: userId, name: data.user.name, email: data.user.email };
                    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
                    await showDialog('Success', 'Login successful!', 'success');
                    setTimeout(() => { window.location.href = '../resumes.html'; }, 500);
                } else {
                    await showDialog('Error', data.message || 'Login failed', 'error');
                }
            } catch (err) {
                // fallback to local storage verification
                const result = verifyUser(email, password);
                if (result.success) {
                    setAuthToken(result.user);
                    await showDialog('Success', result.message, 'success');
                    setTimeout(() => { window.location.href = '../resumes.html'; }, 500);
                } else {
                    await showDialog('Error', result.message, 'error');
                }
            }
        } else {
            const result = verifyUser(email, password);
            if (result.success) {
                setAuthToken(result.user);
                await showDialog('Success', result.message, 'success');
                setTimeout(() => { window.location.href = '../resumes.html'; }, 500);
            } else {
                await showDialog('Error', result.message, 'error');
            }
        }

        signInForm.reset();
    });
}

// Initialize on page load
initializeUsersStorage();