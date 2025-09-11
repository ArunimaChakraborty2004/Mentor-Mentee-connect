let currentEditingId = null;

document.addEventListener('DOMContentLoaded', async function () {
    const user = await getValidUser();
    if (!user) return;

    await loadMentees(user.id);
    await loadSessions(user.id);

    document.getElementById('session_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('sessionForm').addEventListener('submit', handleSessionSubmit);
});

async function getValidUser() {
    const { data, error } = await supabaseClient.auth.getSession();
    const user = data?.session?.user;

    if (!user) {
        console.error('Session missing or user not found');
        showMessage('Session expired. Please log in again.', 'error');
        await supabaseClient.auth.signOut();
        window.location.href = 'login.html';
        return null;
    }

    return user;
}

async function loadMentees(mentorId) {
    try {
        const { data: mentees, error } = await supabaseClient
            .from('mentee_profiles')
            .select('id, name')
            .eq('mentor_id', mentorId)
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
    const user = await getValidUser();
    if (!user) return;

    const formData = new FormData(e.target);
    const sessionData = Object.fromEntries(formData.entries());

    if (currentEditingId) {
        await updateSession(currentEditingId, sessionData);
    } else {
        await addSession(user.id, sessionData);
    }
}

async function addSession(mentorId, sessionData) {
    try {
        const { error } = await supabaseClient
            .from('mentoring_sessions')
            .insert([
                {
                    ...sessionData,
                    mentor_id: mentorId,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            showMessage('Error adding session: ' + error.message, 'error');
        } else {
            showMessage('Session recorded successfully!', 'success');
            clearForm();
            await loadSessions(mentorId);
        }
    } catch (error) {
        showMessage('Unexpected error occurred', 'error');
        console.error('Error adding session:', error);
    }
}

async function updateSession(id, sessionData) {
    try {
        const { error } = await supabaseClient
            .from('mentoring_sessions')
            .update(sessionData)
            .eq('id', id);

        if (error) {
            showMessage('Error updating session: ' + error.message, 'error');
        } else {
            showMessage('Session updated successfully!', 'success');
            currentEditingId = null;
            clearForm();
            const user = await getValidUser();
            if (user) await loadSessions(user.id);
        }
    } catch (error) {
        showMessage('Unexpected error occurred', 'error');
        console.error('Error updating session:', error);
    }
}

async function loadSessions(mentorId) {
    try {
        const { data: sessions, error } = await supabaseClient
            .from('mentoring_sessions')
            .select(`
                *,
                mentee_profiles!inner(name)
            `)
            .eq('mentor_id', mentorId)
            .order('session_date', { ascending: false });

        const sessionsList = document.getElementById('sessionsList');

        if (error || !sessions || sessions.length === 0) {
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

        currentEditingId = id;
        document.getElementById('mentee').value = session.mentee;
        document.getElementById('session_date').value = session.session_date;
        document.getElementById('duration').value = session.duration || '';
        document.getElementById('session_type').value = session.session_type;
        document.getElementById('status').value = session.status;
        document.getElementById('topics_discussed').value = session.topics_discussed || '';
        document.getElementById('action_items').value = session.action_items || '';
        document.getElementById('notes').value = session.notes || '';

        document.getElementById('sessionForm').scrollIntoView({ behavior: 'smooth' });
        showMessage('Editing mode activated. Update the form and click "Save Session" to save changes.', 'success');
    } catch (error) {
        showMessage('Error loading session data', 'error');
        console.error('Error editing session:', error);
    }
}

async function deleteSession(id) {
    if (!confirm('Are you sure you want to delete this session record? This action cannot be undone.')) return;

    try {
        const { error } = await supabaseClient
            .from('mentoring_sessions')
            .delete()
            .eq('id', id);

        if (error) {
            showMessage('Error deleting session: ' + error.message, 'error');
        } else {
            showMessage('Session deleted successfully', 'success');
            const user = await getValidUser();
            if (user) await loadSessions(user.id);
        }
    } catch (error) {
        showMessage('Unexpected error occurred', 'error');
        console.error('Error deleting session:', error);
    }
}

function clearForm() {
    currentEditingId = null;
    document.getElementById('sessionForm').reset();
    document.getElementById('session_date').value = new Date().toISOString().split('T')[0];
}

// Placeholder function to show messages (you may have your own implementation)
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('messageContainer');
    if (!messageContainer) {
        console.warn('Message container not found in HTML');
        alert(message); // fallback
        return;
    }

    messageContainer.textContent = message;
    messageContainer.className = `message ${type}`; // e.g., "message success" or "message error"

    messageContainer.style.display = 'block';

    setTimeout(() => {
        messageContainer.style.display = 'none';
        messageContainer.className = 'message';
        messageContainer.textContent = '';
    }, 5000); // hide after 5 seconds
}
