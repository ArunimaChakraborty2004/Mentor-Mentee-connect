const SUPABASE_URL = 'https://wukeibhjznoqhfnifaaj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1a2VpYmhqem5vcWhmbmlmYWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTE4MTUsImV4cCI6MjA3MjkyNzgxNX0.EG_GnFtVbpp79PkPTkeypmHSZl6T1xQS7avmHdt7KMA';

let supabaseClient;

document.addEventListener('DOMContentLoaded', async function () {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        // First check auth state
        await checkAuthState();

        // Also listen for future login/logout
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            console.log("Auth state changed:", _event, session);
            checkAuthState(session);
        });
    } else {
        console.error('Supabase library not loaded');
    }
});

async function checkAuthState(session = null) {
    try {
        if (!supabaseClient) return;

        // Get session if not passed
        if (!session) {
            const { data, error } = await supabaseClient.auth.getSession();
            if (error) {
                console.error("Error fetching session:", error.message);
                return;
            }
            session = data.session;
        }

        const user = session?.user || null;

        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop() || 'index.html';
        const publicPages = ['index.html', 'register.html', 'forgot-password.html'];

        console.log("User session:", user);
        console.log("Current page:", fileName);

        if (!user && !publicPages.includes(fileName)) {
            window.location.href = 'index.html';
        }

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