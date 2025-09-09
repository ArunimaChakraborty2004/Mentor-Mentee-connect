// Authentication functions
async function handleLogin() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const loginForm = document.getElementById('loginForm');
    
    // Reset messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    if (!supabaseClient) {
        showError('Application not ready. Please refresh the page.');
        return;
    }
    
    // Show loading state
    loginForm.classList.add('loading');
    
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            showError(error.message);
        } else {
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'role-selection.html';
            }, 1500);
        }
    } catch (error) {
        showError('An unexpected error occurred');
    } finally {
        loginForm.classList.remove('loading');
    }
}

async function handleRegister() {
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const registerForm = document.getElementById('registerForm');
    
    // Reset messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (!name || !email || !password || !confirmPassword || !role) {
        showError('Please fill in all fields');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }
    
    // Show loading state
    registerForm.classList.add('loading');
    
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    role: role
                }
            }
        });
        
        if (error) {
            showError(error.message);
        } else {
            // Create user profile in database
            const { error: profileError } = await supabaseClient
                .from('user_profiles')
                .insert([
                    {
                        user_id: data.user.id,
                        name: name,
                        email: email,
                        role: role,
                        created_at: new Date().toISOString()
                    }
                ]);
            
            if (profileError) {
                console.error('Profile creation error:', profileError);
            }
            
            showSuccess('Registration successful! Please check your email to verify your account.');
        }
    } catch (error) {
        showError('An unexpected error occurred');
    } finally {
        registerForm.classList.remove('loading');
    }
}

async function handleForgotPassword() {
    const email = document.getElementById('email').value;
    const errorDiv = document.getElementById('errorMessage');
    const successDiv = document.getElementById('successMessage');
    const form = document.getElementById('forgotPasswordForm');
    
    // Reset messages
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    
    if (!email) {
        showError('Please enter your email address');
        return;
    }
    
    // Show loading state
    form.classList.add('loading');
    
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email);
        
        if (error) {
            showError(error.message);
        } else {
            showSuccess('Password reset email sent! Please check your inbox.');
        }
    } catch (error) {
        showError('An unexpected error occurred');
    } finally {
        form.classList.remove('loading');
    }
}

async function handleLogout() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
}

// Handle Enter key press on forms
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        const activeElement = document.activeElement;
        if (activeElement.closest('#loginForm')) {
            handleLogin();
        } else if (activeElement.closest('#registerForm')) {
            handleRegister();
        } else if (activeElement.closest('#forgotPasswordForm')) {
            handleForgotPassword();
        }
    }
});
