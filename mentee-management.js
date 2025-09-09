// Mentee management functionality
let currentEditingId = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('=== MENTEE MANAGEMENT PAGE LOADED ===');
    console.log('1. Checking auth state...');
    await checkAuthState();
    
    console.log('2. Loading mentees...');
    await loadMentees();
    
    console.log('3. Setting up form handler...');
    const form = document.getElementById('menteeForm');
    if (form) {
        form.addEventListener('submit', handleMenteeSubmit);
        console.log('Form handler attached successfully');
    } else {
        console.error('Form with ID "menteeForm" not found!');
    }
    
    console.log('=== INITIALIZATION COMPLETE ===');
});

async function handleMenteeSubmit(e) {
    e.preventDefault();
    
    console.log('Form submitted');
    
    const formData = new FormData(e.target);
    const menteeData = Object.fromEntries(formData.entries());
    
    console.log('Form data collected:', menteeData);
    
    if (currentEditingId) {
        console.log('Updating existing mentee:', currentEditingId);
        await updateMentee(currentEditingId, menteeData);
    } else {
        console.log('Adding new mentee');
        await addMentee(menteeData);
    }
}

async function addMentee(menteeData) {
    try {
        console.log('Starting to add mentee with data:', menteeData);
        
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
        if (!menteeData.name || !menteeData.email || !menteeData.student_id || !menteeData.department || !menteeData.year) {
            showMessage('Please fill in all required fields (Name, Email, Student ID, Department, Year)', 'error');
            return;
        }
        
        const insertData = {
            ...menteeData,
            mentor_id: user.id,
            created_at: new Date().toISOString()
        };
        
        console.log('Inserting data:', insertData);
        
        const { data, error } = await supabaseClient
            .from('mentee_profiles')
            .insert([insertData]);

        console.log('Insert result:', { data, error });

        if (error) {
            console.error('Database error:', error);
            showMessage('Error adding mentee: ' + error.message, 'error');
        } else {
            console.log('Mentee added successfully');
            showMessage('Mentee added successfully!', 'success');
            document.getElementById('menteeForm').reset();
            await loadMentees();
        }
    } catch (error) {
        console.error('Unexpected error adding mentee:', error);
        showMessage('An unexpected error occurred: ' + error.message, 'error');
    }
}

async function updateMentee(id, menteeData) {
    try {
        const { data, error } = await supabaseClient
            .from('mentee_profiles')
            .update(menteeData)
            .eq('id', id);

        if (error) {
            showMessage('Error updating mentee: ' + error.message, 'error');
        } else {
            showMessage('Mentee updated successfully!', 'success');
            currentEditingId = null;
            document.getElementById('menteeForm').reset();
            await loadMentees();
        }
    } catch (error) {
        showMessage('An unexpected error occurred', 'error');
        console.error('Error updating mentee:', error);
    }
}

async function loadMentees() {
    try {
        console.log('=== LOADING MENTEES ===');
        console.log('Step 1: Checking Supabase client...');
        
        if (!supabaseClient) {
            console.error('❌ Supabase client not initialized');
            const menteesList = document.getElementById('menteesList');
            menteesList.innerHTML = '<p style="text-align: center; color: #e74c3c;">❌ Database connection failed. Please refresh the page.</p>';
            return;
        }
        console.log('✅ Supabase client is ready');
        
        console.log('Step 2: Getting current user...');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
            console.error('❌ Error getting user:', userError);
            const menteesList = document.getElementById('menteesList');
            menteesList.innerHTML = '<p style="text-align: center; color: #e74c3c;">❌ Authentication error. Please log in again.</p>';
            return;
        }
        
        if (!user) {
            console.log('❌ No user found, redirecting to login');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ User found:', user.id);
        console.log('Step 3: Testing database connection...');
        
        // First, let's test if we can connect to any table
        try {
            const { data: testData, error: testError } = await supabaseClient
                .from('user_profiles')
                .select('id')
                .limit(1);
            
            if (testError) {
                console.error('❌ Database connection test failed:', testError);
                const menteesList = document.getElementById('menteesList');
                menteesList.innerHTML = `<p style="text-align: center; color: #e74c3c;">❌ Database error: ${testError.message}<br><small>The database tables may not be created yet.</small></p>`;
                return;
            }
            console.log('✅ Database connection successful');
        } catch (dbError) {
            console.error('❌ Database connection failed:', dbError);
            const menteesList = document.getElementById('menteesList');
            menteesList.innerHTML = '<p style="text-align: center; color: #e74c3c;">❌ Cannot connect to database. Please check your setup.</p>';
            return;
        }
        
        console.log('Step 4: Querying mentee_profiles table...');
        const { data: mentees, error } = await supabaseClient
            .from('mentee_profiles')
            .select('*')
            .eq('mentor_id', user.id)
            .order('created_at', { ascending: false });

        console.log('Query result:', { mentees, error });

        if (error) {
            console.error('❌ Error loading mentees:', error);
            const menteesList = document.getElementById('menteesList');
            if (error.message.includes('does not exist')) {
                menteesList.innerHTML = '<p style="text-align: center; color: #e74c3c;">❌ Mentee table does not exist.<br><small>Please run the database schema in Supabase SQL Editor.</small></p>';
            } else {
                menteesList.innerHTML = `<p style="text-align: center; color: #e74c3c;">❌ Database error: ${error.message}</p>`;
            }
            return;
        }

        const menteesList = document.getElementById('menteesList');
        
        if (!mentees || mentees.length === 0) {
            console.log('✅ Query successful - No mentees found');
            menteesList.innerHTML = '<p style="text-align: center; color: #ccc;">✅ No mentees found. Add your first mentee above!</p>';
            return;
        }

        console.log(`✅ Found ${mentees.length} mentees`);
        menteesList.innerHTML = mentees.map(mentee => createMenteeCard(mentee)).join('');
        console.log('=== MENTEES LOADED SUCCESSFULLY ===');
    } catch (error) {
        console.error('❌ Unexpected error loading mentees:', error);
        const menteesList = document.getElementById('menteesList');
        menteesList.innerHTML = `<p style="text-align: center; color: #e74c3c;">❌ Unexpected error: ${error.message}</p>`;
    }
}

function createMenteeCard(mentee) {
    return `
        <div class="mentee-card">
            <div class="mentee-header">
                <div class="mentee-name">${mentee.name}</div>
                <div class="mentee-actions">
                    <button class="action-btn edit-btn" onclick="editMentee('${mentee.id}')">Edit</button>
                    <button class="action-btn delete-btn" onclick="deleteMentee('${mentee.id}')">Delete</button>
                </div>
            </div>
            <div class="mentee-details">
                <div class="detail-item">
                    <div class="detail-label">Email</div>
                    <div class="detail-value">${mentee.email}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Student ID</div>
                    <div class="detail-value">${mentee.student_id}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Department</div>
                    <div class="detail-value">${mentee.department}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Year</div>
                    <div class="detail-value">${getYearDisplay(mentee.year)}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">GPA</div>
                    <div class="detail-value">${mentee.gpa || 'Not set'}</div>
                </div>
                <div class="detail-item">
                    <div class="detail-label">Phone</div>
                    <div class="detail-value">${mentee.phone || 'Not provided'}</div>
                </div>
            </div>
            ${mentee.goals ? `
                <div style="margin-top: 15px; padding: 15px; background: rgba(51, 150, 139, 0.1); border-radius: 8px;">
                    <div class="detail-label">Academic Goals</div>
                    <div class="detail-value">${mentee.goals}</div>
                </div>
            ` : ''}
        </div>
    `;
}

function getYearDisplay(year) {
    const yearMap = {
        '1': 'First Year',
        '2': 'Second Year',
        '3': 'Third Year',
        '4': 'Fourth Year',
        'graduate': 'Graduate'
    };
    return yearMap[year] || year;
}

async function editMentee(id) {
    try {
        const { data: mentee, error } = await supabaseClient
            .from('mentee_profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            showMessage('Error loading mentee data', 'error');
            return;
        }

        // Populate form with mentee data
        currentEditingId = id;
        document.getElementById('name').value = mentee.name;
        document.getElementById('email').value = mentee.email;
        document.getElementById('phone').value = mentee.phone || '';
        document.getElementById('student_id').value = mentee.student_id;
        document.getElementById('department').value = mentee.department;
        document.getElementById('year').value = mentee.year;
        document.getElementById('gpa').value = mentee.gpa || '';
        document.getElementById('goals').value = mentee.goals || '';

        // Scroll to form
        document.getElementById('menteeForm').scrollIntoView({ behavior: 'smooth' });
        
        showMessage('Editing mode activated. Update the form and click "Add Mentee" to save changes.', 'success');
    } catch (error) {
        showMessage('Error loading mentee data', 'error');
        console.error('Error editing mentee:', error);
    }
}

async function deleteMentee(id) {
    if (!confirm('Are you sure you want to delete this mentee? This action cannot be undone.')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('mentee_profiles')
            .delete()
            .eq('id', id);

        if (error) {
            showMessage('Error deleting mentee: ' + error.message, 'error');
        } else {
            showMessage('Mentee deleted successfully', 'success');
            await loadMentees();
        }
    } catch (error) {
        showMessage('An unexpected error occurred', 'error');
        console.error('Error deleting mentee:', error);
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
