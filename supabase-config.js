// Supabase configuration
const SUPABASE_URL = 'https://wukeibhjznoqhfnifaaj.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1a2VpYmhqem5vcWhmbmlmYWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTE4MTUsImV4cCI6MjA3MjkyNzgxNX0.EG_GnFtVbpp79PkPTkeypmHSZl6T1xQS7avmHdt7KMA'

// Create Supabase client - make sure this runs after the Supabase library is loaded
let supabaseClient;

// Initialize Supabase client when the page loads
document.addEventListener('DOMContentLoaded', function() {
    if (typeof supabase !== 'undefined') {
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        // Now check auth state
        checkAuthState();
    } else {
        console.error('Supabase library not loaded');
    }
});

async function checkAuthState() {
    try {
        if (!supabaseClient) return;
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const currentPath = window.location.pathname;
        const fileName = currentPath.split('/').pop() || 'index.html';
        
        if (user && fileName === 'index.html') {
            window.location.href = 'role-selection.html';
        } else if (!user && !['index.html', 'register.html', 'forgot-password.html'].includes(fileName)) {
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}
