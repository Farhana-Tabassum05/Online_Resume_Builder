/* ===============================================
   RESUMES.JS - Manage and Display User-Specific Resumes
=============================================== */

// Backend API configuration - update if your server runs on a different host/port
const API_BASE = 'http://localhost:3000/api';
const USE_API = true; // set to false to use localStorage-only resumes

const AUTH_STORAGE_KEY = 'resumeCraftAuth';
const STORAGE_KEY = 'resumeCraftResumes';
const resumesGrid = document.getElementById('resumesGrid');
const emptyState = document.getElementById('emptyState');
const modal = document.getElementById('resumeModal');
const closeBtn = document.querySelector('.close-btn');      
const floatingCreateBtn = document.getElementById('floatingCreateBtn');
const createNewBtn = document.getElementById('createNewBtn');
const modalEditBtn = document.getElementById('modalEditBtn');
const modalDeleteBtn = document.getElementById('modalDeleteBtn');
const modalDownloadBtn = document.getElementById('modalDownloadBtn');
const confirmDialog = document.getElementById('confirmDialog');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');

let currentResumeId = null;
let confirmResolve = null;
let currentUser = null; // Store current user globally

/* ===============================================
   CONFIRMATION DIALOG SYSTEM
=============================================== */

function showConfirmDialog(title, message) {
    return new Promise((resolve) => {
        confirmTitle.textContent = title;
        confirmMessage.textContent = message;
        confirmResolve = resolve;
        confirmDialog.classList.add('show');
    });
}

confirmYesBtn.addEventListener('click', () => {
    confirmDialog.classList.remove('show');
    if (confirmResolve) confirmResolve(true);
});

confirmNoBtn.addEventListener('click', () => {
    confirmDialog.classList.remove('show');
    if (confirmResolve) confirmResolve(false);
});

confirmDialog.addEventListener('click', (e) => {
    if (e.target === confirmDialog) {
        confirmDialog.classList.remove('show');
        if (confirmResolve) confirmResolve(false);
    }
});

/* ===============================================
   AUTHENTICATION CHECK
=============================================== */

// Check if user is authenticated
function isUserAuthenticated() {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    return authData ? JSON.parse(authData) : null;
}

// Redirect to login if not authenticated
document.addEventListener('DOMContentLoaded', () => {
    const user = isUserAuthenticated();
    
    if (!user) {
        // Redirect to sign in page if not authenticated
        window.location.href = 'sign in & sign up/Sign in.html#sign-in-container';
        return;
    }
    
    // Store current user globally
    currentUser = user;
    
    // Display user name if element exists
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = user.name;
    }
    
    // If backend is available and we have a token, fetch from server
    if (USE_API && currentUser.token) {
        fetch(`${API_BASE}/resumes`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        }).then(r => r.json()).then(data => {
            if (Array.isArray(data)) {
                // server returns array of resume objects
                loadAndDisplayResumesFromArray(data);
            } else if (data.resumes) {
                loadAndDisplayResumesFromArray(data.resumes);
            } else {
                // fallback
                loadAndDisplayResumes();
            }
        }).catch(err => {
            console.error('Could not fetch resumes from server, falling back to localStorage', err);
            loadAndDisplayResumes();
        });
    } else {
        loadAndDisplayResumes();
    }
});

function loadAndDisplayResumesFromArray(resumesArray) {
    if (!resumesArray || resumesArray.length === 0) {
        showEmptyState();
        return;
    }
    hideEmptyState();
    displayResumes(resumesArray);
}

/* ===============================================
   LOAD AND DISPLAY RESUMES (USER-SPECIFIC)
=============================================== */
function loadAndDisplayResumes() {
    const resumes = getUserResumes();
    
    if (resumes.length === 0) {
        showEmptyState();
    } else {
        hideEmptyState();
        displayResumes(resumes);
    }
}

function displayResumes(resumes) {
    resumesGrid.innerHTML = '';
    
    resumes.forEach((resume, index) => {
        const card = createResumeCard(resume, index);
        resumesGrid.appendChild(card);
    });
}

function createResumeCard(resume, index) {
    const card = document.createElement('div');
    card.className = 'resume-card';
    
    // support both localStorage shape (id) and server shape (_id)
    const resumeId = resume.id || resume._id || resume._id && resume._id.toString();
    const createdAt = resume.createdAt || resume.createdAt || resume.createdAt;
    const createdDate = new Date(createdAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    
    card.innerHTML = `
        <div class="resume-thumbnail">
            <div class="resume-icon">📄</div>
        </div>
        <div class="resume-info">
            <div class="resume-name">${resume.fullName || 'Untitled Resume'}</div>
            <div class="resume-role">${resume.role || 'No title'}</div>
            <div class="resume-date">Created: ${createdDate}</div>
            <div class="resume-actions">
                <button class="btn-view" data-id="${resumeId}">View</button>
                <button class="btn-delete" data-id="${resumeId}">Delete</button>
            </div>
        </div>
    `;
    
    // View button
    card.querySelector('.btn-view').addEventListener('click', (e) => {
        e.stopPropagation();
        // If resume came from server it may not have id property; pass the resume object and normalize inside modal
        openResumeModal(resume);
    });
    
    // Delete button
    card.querySelector('.btn-delete').addEventListener('click', async (e) => {
        e.stopPropagation();
        const confirmed = await showConfirmDialog('Delete Resume', 'Are you sure you want to delete this resume? This action cannot be undone.');
        if (confirmed) {
            deleteResume(resume.id || resume._id || resume._id && resume._id.toString());
        }
    });
    
    return card;
}

/* ===============================================
   MODAL FUNCTIONS
=============================================== */
function openResumeModal(resume) {
    // normalize id (support server _id or local id)
    const normalizedId = resume.id || (resume._id ? (resume._id._id ? resume._id._id : resume._id) : null) || (resume._id && resume._id.toString && resume._id.toString());
    currentResumeId = normalizedId;
    document.getElementById('modalTitle').textContent = `${resume.fullName} - ${resume.role}`;
    
    // Load resume template into iframe (templates are named `templateX.html`)
    const iframeElement = document.getElementById('modalIframe');
    const templateFile = resume.templateId && String(resume.templateId).startsWith('template')
        ? resume.templateId
        : `template${resume.templateId}`;
    iframeElement.src = `templates/${templateFile}.html?t=${Date.now()}`;
    
    // Update button handlers — use normalized id
    modalEditBtn.onclick = () => {
        editResume(currentResumeId);
    };
    
    modalDeleteBtn.onclick = async () => {
        const confirmed = await showConfirmDialog('Delete Resume', 'Are you sure you want to delete this resume? This action cannot be undone.');
        if (confirmed) {
            deleteResume(currentResumeId);
            closeModal();
        }
    };
    
    modalDownloadBtn.onclick = () => {
        downloadResume(currentResumeId);
    };
    
    // Wait for iframe to load, then populate it with resume data
    iframeElement.onload = () => {
        populateIframeWithResumeData(iframeElement, resume);
    };
    
    modal.classList.add('show');
}

function populateIframeWithResumeData(iframeElement, resume) {
    try {
        const iframeDoc = iframeElement.contentWindow.document;
        
        // Update personal details
        updateIframeElement(iframeDoc, 'fullNamePreview', resume.fullName);
        updateIframeElement(iframeDoc, 'rolePreview', resume.role);
        updateIframeElement(iframeDoc, 'emailPreview', resume.email);
        updateIframeElement(iframeDoc, 'phonePreview', resume.phone);
        updateIframeElement(iframeDoc, 'addressPreview', resume.address);
        
        // Update profile photo if exists
        if (resume.profilePhotoData) {
            const images = iframeDoc.querySelectorAll('.avatar, .photo');
            images.forEach(img => {
                img.src = resume.profilePhotoData;
            });
            
            const monograms = iframeDoc.querySelectorAll('.monogram');
            monograms.forEach(m => {
                m.style.backgroundImage = `url(${resume.profilePhotoData})`;
                m.style.backgroundSize = 'cover';
                m.style.backgroundPosition = 'center';
                m.textContent = '';
            });
        }
        
        // Update education
        updateIframeElement(iframeDoc, 'degreePreview', resume.degree);
        updateIframeElement(iframeDoc, 'schoolPreview', resume.school);
        updateIframeElement(iframeDoc, 'eduYearsPreview', resume.eduYears);
        
        // Update experience
        if (resume.experience && resume.experience.length > 0) {
                resume.experience.forEach((exp, i) => {
                const suffix = i === 0 ? '' : (i + 1);
                updateIframeElement(iframeDoc, `jobTitlePreview${suffix}`, exp.jobTitle);
                updateIframeElement(iframeDoc, `companyPreview${suffix}`, exp.company);
                updateIframeElement(iframeDoc, `expYearsPreview${suffix}`, exp.years);
                // Render description with paragraph + bullets
                renderParagraphAndBullets(iframeDoc, `jobDescPreview${suffix}`, exp.description);
            });
        }
        
        // Update skills
        if (resume.skills) {
            updateIframeElement(iframeDoc, 'skillsPreview', resume.skills);
        }
        
        // Update summary
        if (resume.summary) {
            updateIframeElement(iframeDoc, 'summaryPreview', resume.summary);
        }
        
        // Update projects
        if (resume.projects && resume.projects.length > 0) {
            const projectContainer = iframeDoc.getElementById('projectsContainer');
            if (projectContainer) {
                projectContainer.innerHTML = '';
                        resume.projects.forEach(proj => {
                            const li = iframeDoc.createElement('li');
                            const title = proj.title || '';
                            const desc = proj.description || proj.desc || '';

                            const strong = iframeDoc.createElement('strong');
                            strong.textContent = title;
                            li.appendChild(strong);

                            if (desc && String(desc).trim()) {
                                const parts = String(desc).split('\n');
                                const first = (parts.shift() || '').trim();
                                if (first) {
                                    const p = iframeDoc.createElement('p');
                                    p.textContent = first;
                                    li.appendChild(p);
                                }

                                const remaining = parts.map(s => s.trim()).filter(Boolean);
                                if (remaining.length > 0) {
                                    const ul = iframeDoc.createElement('ul');
                                    remaining.forEach(line => {
                                        const clean = line.replace(/^•\s*/, '');
                                        const pli = iframeDoc.createElement('li');
                                        pli.textContent = clean;
                                        ul.appendChild(pli);
                                    });
                                    li.appendChild(ul);
                                }
                            }

                            projectContainer.appendChild(li);
                        });
            }
        }
    } catch (err) {
        console.log('Note: Cross-origin or template compatibility issue. Resume data may not display fully.');
    }
}

function updateIframeElement(doc, id, value) {
    // Allow passing either a string id or try common alternative ids for templates
    const altMap = {
        fullNamePreview: ['fullNamePreview', 'namePreview', 'profileName', 'fullName'],
        rolePreview: ['rolePreview', 'role', 'title'],
        emailPreview: ['emailPreview', 'email'],
        phonePreview: ['phonePreview', 'phone'],
        addressPreview: ['addressPreview', 'address'],
        degreePreview: ['degreePreview', 'degree'],
        schoolPreview: ['schoolPreview', 'school'],
        eduYearsPreview: ['eduYearsPreview', 'eduYears', 'edu-years'],
        skillsPreview: ['skillsPreview', 'skills-list', 'skills'],
        summaryPreview: ['summaryPreview', 'summary']
    };

    const tryIds = Array.isArray(id) ? id : (altMap[id] || [id]);
    for (let tid of tryIds) {
        const element = doc.getElementById(tid);
        if (element) {
            element.textContent = value || ' ';
            return;
        }
    }
}

// Render a text where the first line is a paragraph and subsequent lines are bullets
function renderParagraphAndBullets(doc, id, text) {
    const altMapKeys = {
        jobDescPreview: ['jobDescPreview', 'jobDesc', 'job-desc'],
        // Add other possible keys if needed
    };
    const tryIds = altMapKeys[id] || [id];
    let element = null;
    for (let tid of tryIds) {
        element = doc.getElementById(tid);
        if (element) break;
    }
    if (!element) return;
    const val = text || '';
    if (!val || !String(val).trim()) {
        element.textContent = ' ';
        return;
    }
    const parts = String(val).split('\n');
    const first = (parts.shift() || '').trim();
    let html = '';
    if (first) {
        html += `<p>${escapeHtml(first)}</p>`;
    }
    const remaining = parts.map(s => s.trim()).filter(Boolean);
    if (remaining.length > 0) {
        html += '<ul>' + remaining.map(line => `<li>${escapeHtml(line.replace(/^•\s*/, ''))}</li>`).join('') + '</ul>';
    }
    element.innerHTML = html;
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function closeModal() {
    modal.classList.remove('show');
    currentResumeId = null;
}

/* ===============================================
   EMPTY STATE MANAGEMENT
=============================================== */
function showEmptyState() {
    emptyState.style.display = 'block';
    resumesGrid.style.display = 'none';
}

function hideEmptyState() {
    emptyState.style.display = 'none';
    resumesGrid.style.display = 'grid';
}

/* ===============================================
   RESUME MANAGEMENT FUNCTIONS (USER-SPECIFIC)
=============================================== */

// Get all resumes from storage (all users)
function getAllResumes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Get only current user's resumes
function getUserResumes() {
    if (!currentUser) return [];
    
    const allResumes = getAllResumes();
    return allResumes.filter(resume => resume.userId === currentUser.userId);
}

function saveResume(resumeData) {
    // Ensure the resume has the current user's ID
    if (currentUser) {
        resumeData.userId = currentUser.userId;
    }
    
    const resumes = getAllResumes();
    const existingIndex = resumes.findIndex(r => r.id === resumeData.id);
    
    if (existingIndex > -1) {
        resumes[existingIndex] = resumeData;
    } else {
        resumes.push(resumeData);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
}

function deleteResume(resumeId) {
    // If using API and we have token, call backend
    if (USE_API && currentUser && currentUser.token) {
        fetch(`${API_BASE}/resumes/${resumeId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        }).then(res => {
            if (res.ok) {
                // remove visually
                loadAndDisplayResumes();
                // refresh page data
                window.location.reload();
            } else {
                console.error('Failed to delete resume on server');
            }
        }).catch(err => console.error('Delete error', err));
        return;
    }

    let resumes = getAllResumes();
    
    // Only delete if the resume belongs to the current user
    const resumeToDelete = resumes.find(r => r.id === resumeId);
    if (resumeToDelete && resumeToDelete.userId === currentUser.userId) {
        resumes = resumes.filter(r => r.id !== resumeId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
        loadAndDisplayResumes();
    } else {
        console.error('Unauthorized: Cannot delete another user\'s resume');
    }
}

function editResume(resumeId) {
    // Verify the resume belongs to current user before editing
    if (USE_API && currentUser && currentUser.token) {
        // For API-backed resumes we still navigate to builder where it will fetch the resume details
        window.location.href = `builder.html?resumeId=${resumeId}`;
        return;
    }

    const resume = getAllResumes().find(r => r.id === resumeId);
    if (resume && resume.userId === currentUser.userId) {
        window.location.href = `builder.html?resumeId=${resumeId}`;
    } else {
        console.error('Unauthorized: Cannot edit another user\'s resume');
    }
}

function downloadResume(resumeId) {
    if (USE_API && currentUser && currentUser.token) {
        // fetch resume from server then store in session and navigate
        fetch(`${API_BASE}/resumes/${resumeId}`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        }).then(r => r.json()).then(resume => {
            sessionStorage.setItem('resumeToDownload', JSON.stringify(resume));
            window.location.href = `builder.html?resumeId=${resumeId}&download=true`;
        }).catch(err => console.error('Download error', err));
        return;
    }

    const resume = getAllResumes().find(r => r.id === resumeId);
    
    // Verify the resume belongs to current user before downloading
    if (resume && resume.userId === currentUser.userId) {
        sessionStorage.setItem('resumeToDownload', JSON.stringify(resume));
        window.location.href = `builder.html?resumeId=${resumeId}&download=true`;
    } else {
        console.error('Unauthorized: Cannot download another user\'s resume');
    }
}

/* ===============================================
   EVENT LISTENERS
=============================================== */

// Floating create button
floatingCreateBtn.addEventListener('click', () => {
    window.location.href = 'builder.html';
});

// Create new button in empty state
createNewBtn.addEventListener('click', () => {
    window.location.href = 'builder.html';
});

// Close modal
closeBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});

/* ===============================================
   LOGOUT FUNCTIONALITY
=============================================== */

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        const confirmed = await showConfirmDialog('Logout', 'Are you sure you want to logout?');
        if (confirmed) {
            // Clear authentication
            localStorage.removeItem(AUTH_STORAGE_KEY);
            // Redirect to home page
            window.location.href = 'index.html';
        }
    });
}
