// Mentor Dashboard functionality
document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== MENTOR DASHBOARD INITIALIZING ===');
    
    // Wait for supabase client to be ready
    let retries = 0;
    while (!supabaseClient && retries < 10) {
        console.log(`Waiting for supabase client... (${retries + 1}/10)`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
    }
    
    if (!supabaseClient) {
        console.error('Failed to initialize supabase client');
        document.getElementById('userName').textContent = 'Connection Error';
        return;
    }
    
    console.log('Supabase client ready, proceeding with initialization');
    await checkAuthState();
    await loadUserInfo();
    await loadDashboardStats();
    console.log('=== MENTOR DASHBOARD INITIALIZED ===');
});

async function loadUserInfo() {
    try {
        console.log('=== LOADING USER INFO ===');
        
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            document.getElementById('userName').textContent = 'Error: Not connected';
            return;
        }
        
        console.log('Getting current user...');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
            console.error('Error getting user:', userError);
            document.getElementById('userName').textContent = 'Error loading user';
            return;
        }
        
        if (!user) {
            console.log('No user found, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('User found:', user.id);
        console.log('User email:', user.email);
        
        // Try to get user profile
        console.log('Fetching user profile from user_profiles table...');
        const { data: profile, error: profileError } = await supabaseClient
            .from('user_profiles')
            .select('name')
            .eq('user_id', user.id)
            .single();
        
        console.log('Profile query result:', { profile, profileError });
        
        if (profileError) {
            console.error('Error fetching profile:', profileError);
            // Fallback to email if profile not found
            const displayName = user.email ? user.email.split('@')[0] : 'Unknown User';
            document.getElementById('userName').textContent = displayName;
            return;
        }
        
        if (profile && profile.name) {
            console.log('Setting username to:', profile.name);
            document.getElementById('userName').textContent = profile.name;
        } else {
            console.log('No profile name found, using email fallback');
            const displayName = user.email ? user.email.split('@')[0] : 'Unknown User';
            document.getElementById('userName').textContent = displayName;
        }
        
        console.log('=== USER INFO LOADED SUCCESSFULLY ===');
    } catch (error) {
        console.error('Unexpected error loading user info:', error);
        document.getElementById('userName').textContent = 'Error loading name';
    }
}

async function loadDashboardStats() {
    try {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        // Load total mentees
        const { data: mentees, error: menteesError } = await supabaseClient
            .from('mentee_profiles')
            .select('id')
            .eq('mentor_id', user.id);

        if (!menteesError && mentees) {
            document.getElementById('totalMentees').textContent = mentees.length;
        }

        // Load active sessions
        const { data: activeSessions, error: activeError } = await supabaseClient
            .from('mentoring_sessions')
            .select('id')
            .eq('mentor_id', user.id)
            .eq('status', 'active');

        if (!activeError && activeSessions) {
            document.getElementById('activeSessions').textContent = activeSessions.length;
        }

        // Load completed sessions
        const { data: completedSessions, error: completedError } = await supabaseClient
            .from('mentoring_sessions')
            .select('id')
            .eq('mentor_id', user.id)
            .eq('status', 'completed');

        if (!completedError && completedSessions) {
            document.getElementById('completedSessions').textContent = completedSessions.length;
        }

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
    }
}
