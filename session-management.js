// Session management functionality
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', async function() {
    await checkAuthState();
    await loadMentees();
    await loadSessions();
    
    // Set today's date as default
    document.getElementById('session_date').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('sessionForm').addEventListener('submit', handleSessionSubmit);
});

async function loadMentees() {
    try {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: mentees, error } = await supabaseClient
            .from('mentee_profiles')
            .select('id, name')
            .eq('mentor_id', user.id)
            .order('name');

        const menteeSelect = document.getElementById('mentee');
        
        if (error || !mentees || mentees.length === 0) {
            menteeSelect.innerHTML = '<option value="">No mentees found</option>';
            return;
        }

        menteeSelect.innerHTML = '<option value="">Select a mentee</option>' +
            mentees.map(mentee => `<option value="${mentee.id}">${mentee.name}</option>`).join('');
    } catch (error) {
        console.error('Error loading mentees:', error);
    }
}

async function handleSessionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const sessionData = Object.fromEntries(formData.entries());
    
    if (currentEditingId) {
        await updateSession(currentEditingId, sessionData);
    } else {
        await addSession(sessionData);
    }
}

async function addSession(sessionData) {
    try {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data, error } = await supabaseClient
            .from('mentoring_sessions')
            .insert([
                {
                    ...sessionData,
                    mentor_id: user.id,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            showMessage('Error adding session: ' + error.message, 'error');
        } else {
            showMessage('Session recorded successfully!', 'success');
            clearForm();
            await loadSessions();
        }
    } catch (error) {
        showMessage('An unexpected error occurred', 'error');
        console.error('Error adding session:', error);
    }
}

async function updateSession(id, sessionData) {
    try {
        const { data, error } = await supabaseClient
            .from('mentoring_sessions')
            .update(sessionData)
            .eq('id', id);

        if (error) {
            showMessage('Error updating session: ' + error.message, 'error');
        } else {
            showMessage('Session updated successfully!', 'success');
            currentEditingId = null;
            clearForm();
            await loadSessions();
        }
    } catch (error) {
        showMessage('An unexpected error occurred', 'error');
        console.error('Error updating session:', error);
    }
}

async function loadSessions() {
    try {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data: sessions, error } = await supabaseClient
            .from('mentoring_sessions')
            .select(`
                *,
                mentee_profiles!inner(name)
            `)
            .eq('mentor_id', user.id)
            .order('session_date', { ascending: false });

        if (error) {
            console.error('Error loading sessions:', error);
            return;
        }

        const sessionsList = document.getElementById('sessionsList');
        
        if (!sessions || sessions.length === 0) {
            sessionsList.innerHTML = '<p style="text-align: center; color: #ccc;">No sessions recorded yet. Record your first session above!</p>';
            return;
        }

        sessionsList.innerHTML = sessions.map(session => createSessionCard(session)).join('');
    } catch (error) {
        console.error('Error loading sessions:', error);
    }
}

function createSessionCard(session) {
    const sessionDate = new Date(session.session_date).toLocaleDateString();
    const sessionTypeDisplay = session.session_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    const statusColor = {
        'completed': '#2ecc71',
        'scheduled': '#f39c12',
        'cancelled': '#e74c3c'
    };

    return `
        <div class="session-card">
            <div class="session-header">
                <div>
                    <div class="session-title">${session.mentee_profiles.name} - ${sessionTypeDisplay}</div>
                    <div class="session-date">${sessionDate}</div>
                </div>
                <div class="session-actions">
                    <button class="action-btn edit-btn" onclick="editSession('${session.id}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteSession('${session.id}')">Delete</button>
                </div>
            </div>
            <div class="session-details">
                <div class="detail-item">
                    <div class="detail-label">Duration</div>
                    <div class="detail-value">${session.duration || 'Not specified'} minutes</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value" style="color: ${statusColor[session.status] || '#fff'}">
                        ${session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Session Type</div>
                    <div class="detail-value">${sessionTypeDisplay}</div>
                </div>
            </div>
            ${session.topics_discussed ? `
                <div class="session-notes">
                    <div class="detail-label">Topics Discussed</div>
                    <div class="detail-value">${session.topics_discussed}</div>
                </div>
            ` : ''}
            ${session.action_items ? `
                <div class="session-notes">
                    <div class="detail-label">Action Items</div>
                    <div class="detail-value">${session.action_items}</div>
                </div>
            ` : ''}
            ${session.notes ? `
                <div class="session-notes">
                    <div class="detail-label">Notes</div>
                    <div class="detail-value">${session.notes}</div>
                </div>
            ` : ''}
        </div>
    `;
}

async function editSession(id) {
    try {
        const { data: session, error } = await supabaseClient
            .from('mentoring_sessions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            showMessage('Error loading session data', 'error');
            return;
        }

        // Populate form with session data
        currentEditingId = id;
        document.getElementById('mentee').value = session.mentee;
        document.getElementById('session_date').value = session.session_date;
        document.getElementById('duration').value = session.duration || '';
        document.getElementById('session_type').value = session.session_type;
        document.getElementById('status').value = session.status;
        document.getElementById('topics_discussed').value = session.topics_discussed || '';
        document.getElementById('action_items').value = session.action_items || '';
        document.getElementById('notes').value = session.notes || '';

        // Scroll to form
        document.getElementById('sessionForm').scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Editing mode activated. Update the form and click "Save Session" to save changes.', 'success');
    } catch (error) {
        showMessage('Error loading session data', 'error');
        console.error('Error editing session:', error);
    }
}

async function deleteSession(id) {
    if (!confirm('Are you sure you want to delete this session record? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('mentoring_sessions')
            .delete()
            .eq('id', id);

        if (error) {
            showMessage('Error deleting session: ' + error.message, 'error');
        } else {
            showMessage('Session deleted successfully', 'success');
            await loadSessions();
        }
    } catch (error) {
        showMessage('An unexpected error occurred', 'error');
        console.error('Error deleting session:', error);
    }
}

function clearForm() {
    currentEditingId = null;
    document.getElementById('sessionForm').reset();
    document.getElementById('session_date').value = new Date().toISOString().split('T')[0];
}

function showMessage(message, type) {
    const messageContainer = document.getElementById('messageContainer');
    const messageClass = type === 'error' ? 'error-message' : 'success-message';
    
    messageContainer.innerHTML = `<div class="${messageClass}">${message}</div>`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageContainer.innerHTML = '';
    }, 5000);
}
