const SUPABASE_URL = 'https://wukeibhjznoqhfnifaaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1a2VpYmhqem5vcWhmbmlmYWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTE4MTUsImV4cCI6MjA3MjkyNzgxNX0.EG_GnFtVbpp79PkPTkeypmHSZl6T1xQS7avmHdt7KMA';

let supabaseClient;

document.addEventListener('DOMContentLoaded', async function () {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        await checkAuthState();
    } else {
        console.error('Supabase library not loaded');
    }
});

async function checkAuthState() {
    try {
        if (!supabaseClient) return;

        const { data: { user }, error } = await supabaseClient.auth.getUser();
        if (error) {
            console.error('Error fetching user:', error.message);
            return;
        }

        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop() || 'index.html';
        const urlParams = new URLSearchParams(window.location.search);
        const isTesting = urlParams.get('test') === 'true';

        const publicPages = ['index.html', 'register.html', 'forgot-password.html'];

        console.log("User session:", user);
        console.log("Current page:", fileName);

        // ✅ Only redirect if user is NOT logged in and trying to access a protected page
        if (!user && !publicPages.includes(fileName)) {
            window.location.href = 'index.html';
        }

        // ✅ If user is logged in and on index.html, show a welcome message instead of redirecting
        if (user && fileName === 'index.html') {
            const welcomeDiv = document.getElementById('welcomeBack');
            if (welcomeDiv) {
                welcomeDiv.innerHTML = `Welcome back, ${user.email}! <button onclick="continueToDashboard()">Continue</button>`;
                welcomeDiv.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

function continueToDashboard() {
    window.location.href = 'role-selection.html';
}
