// Internship management functionality
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== INTERNSHIP GUIDANCE PAGE LOADED ===');
    console.log('1. Checking auth state...');
    await checkAuthState();
    
    console.log('2. Loading mentees...');
    await loadMentees();
    
    console.log('3. Loading internship records...');
    await loadInternships();
    
    console.log('4. Setting up form handler...');
    const form = document.getElementById('internshipForm');
    if (form) {
        form.addEventListener('submit', handleInternshipSubmit);
        console.log('Form handler attached successfully');
    } else {
        console.error('Form with ID "internshipForm" not found!');
    }
    
    console.log('=== INITIALIZATION COMPLETE ===');
});

async function handleInternshipSubmit(e) {
    e.preventDefault();
    
    console.log('Internship form submitted');
    
    const formData = new FormData(e.target);
    const internshipData = Object.fromEntries(formData.entries());
    
    console.log('Form data collected:', internshipData);
    
    if (currentEditingId) {
        console.log('Updating existing internship:', currentEditingId);
        await updateInternship(currentEditingId, internshipData);
    } else {
        console.log('Adding new internship record');
        await addInternship(internshipData);
    }
}

async function loadMentees() {
    try {
        console.log('Loading mentees for dropdown...');
        
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

        const menteeSelect = document.getElementById('mentee_id');
        
        if (error || !mentees || mentees.length === 0) {
            menteeSelect.innerHTML = '<option value="">No mentees found</option>';
            return;
        }

        menteeSelect.innerHTML = '<option value="">Select a mentee</option>' +
            mentees.map(mentee => `<option value="${mentee.id}">${mentee.name}</option>`).join('');
            
        console.log(`Loaded ${mentees.length} mentees for dropdown`);
    } catch (error) {
        console.error('Error loading mentees:', error);
    }
}

async function addInternship(internshipData) {
    try {
        console.log('Starting to add internship with data:', internshipData);
        
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            showMessage('Application not ready. Please refresh the page.', 'error');
            return;
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            console.error('No user found');
            showMessage('Please log in again.', 'error');
            return;
        }
        
        console.log('Current user:', user.id);
        
        // Validate required fields
        if (!internshipData.mentee_id || !internshipData.company_name || !internshipData.position || !internshipData.status) {
            showMessage('Please fill in all required fields (Mentee, Company, Position, Status)', 'error');
            return;
        }
        
        const insertData = {
            ...internshipData,
            mentor_id: user.id,
            stipend: internshipData.stipend ? parseFloat(internshipData.stipend) : null,
            created_at: new Date().toISOString()
        };
        
        console.log('Inserting data:', insertData);
        
        const { data, error } = await supabaseClient
            .from('internship_records')
            .insert([insertData]);

        console.log('Insert result:', { data, error });

        if (error) {
            console.error('Database error:', error);
            showMessage('Error adding internship record: ' + error.message, 'error');
        } else {
            console.log('Internship record added successfully');
            showMessage('Internship record added successfully!', 'success');
            document.getElementById('internshipForm').reset();
            await loadInternships();
        }
    } catch (error) {
        console.error('Unexpected error adding internship:', error);
        showMessage('An unexpected error occurred: ' + error.message, 'error');
    }
}

async function updateInternship(id, internshipData) {
    try {
        if (!supabaseClient) {
            console.error('Supabase client not initialized');
            return;
        }
        
        const updateData = {
            ...internshipData,
            stipend: internshipData.stipend ? parseFloat(internshipData.stipend) : null,
            updated_at: new Date().toISOString()
        };
        
        const { data, error } = await supabaseClient
            .from('internship_records')
            .update(updateData)
            .eq('id', id);

        if (error) {
            showMessage('Error updating internship record: ' + error.message, 'error');
        } else {
            showMessage('Internship record updated successfully!', 'success');
            currentEditingId = null;
            document.getElementById('internshipForm').reset();
            await loadInternships();
        }
    } catch (error) {
        showMessage('An unexpected error occurred', 'error');
        console.error('Error updating internship:', error);
    }
}

async function loadInternships() {
    try {
        console.log('=== LOADING INTERNSHIP RECORDS ===');
        
        if (!supabaseClient) {
            console.error('❌ Supabase client not initialized');
            const internshipsList = document.getElementById('internshipsList');
            internshipsList.innerHTML = '<p style="text-align: center; color: #e74c3c;">❌ Database connection failed. Please refresh the page.</p>';
            return;
        }
        
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            window.location.href = 'index.html';
            return;
        }

        const { data: internships, error } = await supabaseClient
            .from('internship_records')
            .select(`
                *,
                mentee_profiles!inner(name)
            `)
            .eq('mentor_id', user.id)
            .order('created_at', { ascending: false });

        console.log('Query result:', { internships, error });

        if (error) {
            console.error('❌ Error loading internships:', error);
            const internshipsList = document.getElementById('internshipsList');
            if (error.message.includes('does not exist')) {
                internshipsList.innerHTML = '<p style="text-align: center; color: #e74c3c;">❌ Internship table does not exist.<br><small>Please run the database schema in Supabase SQL Editor.</small></p>';
            } else {
                internshipsList.innerHTML = `<p style="text-align: center; color: #e74c3c;">❌ Database error: ${error.message}</p>`;
            }
            return;
        }

        const internshipsList = document.getElementById('internshipsList');
        
        if (!internships || internships.length === 0) {
            console.log('✅ Query successful - No internship records found');
            internshipsList.innerHTML = '<p style="text-align: center; color: #ccc;">✅ No internship records found. Add the first record above!</p>';
            return;
        }

        console.log(`✅ Found ${internships.length} internship records`);
        internshipsList.innerHTML = internships.map(internship => createInternshipCard(internship)).join('');
        console.log('=== INTERNSHIP RECORDS LOADED SUCCESSFULLY ===');
    } catch (error) {
        console.error('❌ Unexpected error loading internships:', error);
        const internshipsList = document.getElementById('internshipsList');
        internshipsList.innerHTML = `<p style="text-align: center; color: #e74c3c;">❌ Unexpected error: ${error.message}</p>`;
    }
}

function createInternshipCard(internship) {
    const statusClass = `status-${internship.status}`;
    const statusDisplay = internship.status.charAt(0).toUpperCase() + internship.status.slice(1);
    
    const startDate = internship.start_date ? new Date(internship.start_date).toLocaleDateString() : 'Not specified';
    const endDate = internship.end_date ? new Date(internship.end_date).toLocaleDateString() : 'Not specified';
    
    return `
        <div class="internship-card">
            <div class="internship-header">
                <div>
                    <div class="internship-title">${internship.position}</div>
                    <div class="internship-company">${internship.company_name} - ${internship.mentee_profiles.name}</div>
                </div>
                <div class="internship-actions">
                    <button class="action-btn edit-btn" onclick="editInternship('${internship.id}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteInternship('${internship.id}')">Delete</button>
                </div>
            </div>
            <div class="internship-details">
                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="detail-value ${statusClass}">${statusDisplay}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Duration</div>
                    <div class="detail-value">${startDate} - ${endDate}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Location</div>
                    <div class="detail-value">${internship.location || 'Not specified'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Stipend</div>
                    <div class="detail-value">${internship.stipend ? `₹${internship.stipend.toLocaleString()}/month` : 'Not specified'}</div>
                </div>
            </div>
            ${internship.description ? `
                <div class="internship-notes">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${internship.description}</div>
                </div>
            ` : ''}
            ${internship.skills_gained ? `
                <div class="internship-notes">
                    <div class="detail-label">Skills Gained</div>
                    <div class="detail-value">${internship.skills_gained}</div>
                </div>
            ` : ''}
            ${internship.feedback ? `
                <div class="internship-notes">
                    <div class="detail-label">Feedback & Notes</div>
                    <div class="detail-value">${internship.feedback}</div>
                </div>
            ` : ''}
        </div>
    `;
}

async function editInternship(id) {
    try {
        const { data: internship, error } = await supabaseClient
            .from('internship_records')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            showMessage('Error loading internship data', 'error');
            return;
        }

        // Populate form with internship data
        currentEditingId = id;
        document.getElementById('mentee_id').value = internship.mentee_id;
        document.getElementById('company_name').value = internship.company_name;
        document.getElementById('position').value = internship.position;
        document.getElementById('start_date').value = internship.start_date || '';
        document.getElementById('end_date').value = internship.end_date || '';
        document.getElementById('status').value = internship.status;
        document.getElementById('location').value = internship.location || '';
        document.getElementById('stipend').value = internship.stipend || '';
        document.getElementById('description').value = internship.description || '';
        document.getElementById('skills_gained').value = internship.skills_gained || '';
        document.getElementById('feedback').value = internship.feedback || '';

        // Scroll to form
        document.getElementById('internshipForm').scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Editing mode activated. Update the form and click "Save Internship Record" to save changes.', 'success');
    } catch (error) {
        showMessage('Error loading internship data', 'error');
        console.error('Error editing internship:', error);
    }
}

async function deleteInternship(id) {
    if (!confirm('Are you sure you want to delete this internship record? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('internship_records')
            .delete()
            .eq('id', id);

        if (error) {
            showMessage('Error deleting internship record: ' + error.message, 'error');
        } else {
            showMessage('Internship record deleted successfully', 'success');
            await loadInternships();
        }
    } catch (error) {
        showMessage('An unexpected error occurred', 'error');
        console.error('Error deleting internship:', error);
    }
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
