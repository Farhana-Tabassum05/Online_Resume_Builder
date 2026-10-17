/* ============================================================
   STEP NAVIGATION
============================================================ */

let currentStep = 1;
const totalSteps = 7;

const steps = document.querySelectorAll(".step");
const formSteps = document.querySelectorAll(".form-step");
const nextBtns = document.querySelectorAll(".next-btn");
const backBtns = document.querySelectorAll(".back-btn");

/* Show a specific step by number */
function showStep(step) {
    currentStep = step;

    // show correct form step
    formSteps.forEach(s => s.classList.remove("active"));
    document.getElementById(`step-${step}`).classList.add("active");

    // highlight correct sidebar step
    steps.forEach(s => s.classList.remove("active"));
    document.querySelector(`.step[data-step="${step}"]`).classList.add("active");

    // Scroll form area to top for clean UX
    document.querySelector(".form-area").scrollTo({ top: 0, behavior: "smooth" });
}

/* Next buttons */
nextBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (currentStep < totalSteps) {
            showStep(currentStep + 1);
        }
    });
});

/* Back buttons */
backBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (currentStep > 1) {
            showStep(currentStep - 1);
        }
    });
});

/* Sidebar direct step click */
steps.forEach(stepEl => {
    stepEl.addEventListener("click", () => {
        const stepNumber = parseInt(stepEl.getAttribute("data-step"));
        showStep(stepNumber);
    });
});

/* Start on step 1 */
showStep(1);



/* ============================================================
   LIVE PREVIEW (inside iframe)
============================================================ */

const iframe = document.getElementById("resume-preview");

/* Update a single text node inside iframe */
function updatePreview(id, value) {
    if (!iframe || !iframe.contentDocument || !iframe.contentDocument.documentElement) return;
    const doc = iframe.contentDocument;
    const aliases = {
        fullNamePreview: ['namePreview', 'profileName'],
        namePreview: ['namePreview', 'profileName'],
        rolePreview: ['rolePreview', 'role']
    };
    const targetIds = aliases[id] || [id];
    targetIds.forEach(targetId => {
        const target = doc.getElementById(targetId);
        if (target) target.textContent = value || '';
    });
    if (id === 'rolePreview') {
        const role = doc.querySelector('.title');
        if (role) role.textContent = value || '';
    }
}

// Profile photo upload handling
let currentProfileImageData = null;
const photoInput = document.getElementById('profilePhotoInput');
const photoPreviewDiv = document.getElementById('photoPreview');

function applyProfileImageToIframe() {
    if (!currentProfileImageData || !iframe || !iframe.contentWindow) return;
    const doc = iframe.contentWindow.document;

    try {
        // Update any img elements that match common selectors
        const imgSelectors = ['.avatar', '.photo'];
        imgSelectors.forEach(sel => {
            const imgs = doc.querySelectorAll(sel);
            imgs.forEach(img => {
                img.src = currentProfileImageData;
            });
        });

        // If template uses a monogram or placeholder div, set its background
        const monograms = doc.querySelectorAll('.monogram');
        monograms.forEach(m => {
            m.style.backgroundImage = `url(${currentProfileImageData})`;
            m.style.backgroundSize = 'cover';
            m.style.backgroundPosition = 'center';
            m.textContent = '';
        });
    } catch (err) {
        // accessing iframe document can throw if cross-origin — templates are local so it's fine
        console.warn('Could not apply profile image to iframe:', err);
    }
}

// Hide sections in iframe when they're empty
function hideEmptySectionsInIframe() {
    if (!iframe || !iframe.contentWindow) return;
    const doc = iframe.contentWindow.document;

    function hideAncestorIfEmpty(el, ancestorSelector = 'section') {
        if (!el) return;
        const text = el.textContent ? el.textContent.trim() : '';
        if (!text) {
            const anc = el.closest(ancestorSelector) || el.parentElement;
            if (anc) anc.style.display = 'none';
        } else {
            const anc = el.closest(ancestorSelector) || el.parentElement;
            if (anc) anc.style.display = '';
        }
    }

    // Name / header
    const nameEl = doc.getElementById('namePreview') || doc.getElementById('profileName') || doc.getElementById('name');
    hideAncestorIfEmpty(nameEl, 'header');

    // Role
    const roleEl = doc.getElementById('rolePreview') || doc.getElementById('role');
    hideAncestorIfEmpty(roleEl, 'header');

    // Summary
    const summaryEl = doc.getElementById('summaryPreview') || doc.getElementById('summary');
    hideAncestorIfEmpty(summaryEl, 'section');

    // Skills (hide section if no skills listed)
    const skillsEl = doc.getElementById('skillsPreview');
    if (skillsEl) {
        const hasItems = skillsEl.querySelectorAll('li').length > 0;
        const sec = skillsEl.closest('section') || skillsEl.parentElement;
        if (sec) sec.style.display = hasItems ? '' : 'none';
    }

    // Education container
    const eduContainer = doc.getElementById('educationContainer');
    if (eduContainer) {
        const hasEdu = eduContainer.children.length > 0;
        const sec = eduContainer.closest('section') || eduContainer.parentElement;
        if (sec) sec.style.display = hasEdu ? '' : 'none';
    }

    // Experience: hide if no visible entries
    const expSection = doc.querySelector('.experience') || doc.querySelector('section.experience');
    if (expSection) {
        const experienceContainer = expSection.querySelector('#experienceContainer');
        const hasExp = experienceContainer ? experienceContainer.children.length > 0 : false;
        expSection.style.display = hasExp ? '' : 'none';
    }

    // Projects
    const projContainer = doc.getElementById('projectsContainer') || doc.getElementById('projectsPreview');
    if (projContainer) {
        const hasProj = Array.from(projContainer.children).some(c => (c.textContent || '').trim().length > 0);
        const sec = projContainer.closest('section') || projContainer.parentElement;
        if (sec) sec.style.display = hasProj ? '' : 'none';
    }
}

if (photoInput) {
    photoInput.addEventListener('change', e => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            currentProfileImageData = evt.target.result;
            if (photoPreviewDiv) {
                photoPreviewDiv.innerHTML = `<img src="${currentProfileImageData}" alt="Preview" style="max-width:96px;max-height:96px;border-radius:8px;border:1px solid #ddd;">`;
            }
            applyProfileImageToIframe();
        };
        reader.readAsDataURL(file);
    });
}

/* ============================================================
   FORM INPUT → PREVIEW BINDING
============================================================ */

// Personal details
document.getElementById("name").addEventListener("input", e => {
    updatePreview("namePreview", e.target.value);
});

// Role / Title — force uppercase and update preview
const roleInput = document.getElementById('role');
if (roleInput) {
    roleInput.addEventListener('input', e => {
        const raw = e.target.value || '';
        const upper = raw.toUpperCase();
        if (raw !== upper) {
            const pos = e.target.selectionStart;
            e.target.value = upper;
            try { e.target.setSelectionRange(pos, pos); } catch (err) {}
        }
        updatePreview('rolePreview', upper);
    });
}

document.getElementById("email").addEventListener("input", e => {
    updatePreview("emailPreview", e.target.value);
});

document.getElementById("phone").addEventListener("input", e => {
    updatePreview("phonePreview", e.target.value);
});

document.getElementById("address").addEventListener("input", e => {
    updatePreview("addressPreview", e.target.value);
});


// Education — dynamic entries
const educationList = [];
const educationContainer = document.getElementById('step-2');
const addEduBtn = document.createElement('button');
addEduBtn.textContent = 'Add Education';
addEduBtn.className = 'btn-primary';
educationContainer.appendChild(addEduBtn);

const degreeInput = document.getElementById('degree');
const schoolInput = document.getElementById('school');
const eduYearsInput = document.getElementById('edu-years');

function createEducationEntry(fromValues = {}) {
    const idx = educationList.length + 1;
    const wrapper = document.createElement('div');
    wrapper.className = 'edu-entry';
    wrapper.innerHTML = `
        <label>Degree</label><input type="text" class="degree" data-idx="${idx}" value="${fromValues.degree || ''}">
        <label>School / University</label><input type="text" class="school" data-idx="${idx}" value="${fromValues.school || ''}">
        <label>Years</label><input type="text" class="edu-years" data-idx="${idx}" value="${fromValues.years || ''}">
        <button class="remove-edu">Remove</button>
    `;
    educationContainer.insertBefore(wrapper, addEduBtn);
    educationList.push(wrapper);

    wrapper.querySelector('.remove-edu').addEventListener('click', () => {
        educationContainer.removeChild(wrapper);
        educationList.splice(educationList.indexOf(wrapper), 1);
        updateEducationPreview();
    });

    ['degree','school','edu-years'].forEach(cls => {
        wrapper.querySelector(`.${cls}`).addEventListener('input', updateEducationPreview);
    });

    updateEducationPreview();
}

addEduBtn.addEventListener('click', () => {
    createEducationEntry();
});

// Initialize first education entry from the static inputs, then hide static inputs
const initialDegree = degreeInput ? degreeInput.value : '';
const initialSchool = schoolInput ? schoolInput.value : '';
const initialYears = eduYearsInput ? eduYearsInput.value : '';

if (degreeInput) {
    // hide original static labels/inputs to avoid duplication
    degreeInput.style.display = 'none';
    if (degreeInput.previousElementSibling) degreeInput.previousElementSibling.style.display = 'none';
}
if (schoolInput) {
    schoolInput.style.display = 'none';
    if (schoolInput.previousElementSibling) schoolInput.previousElementSibling.style.display = 'none';
}
if (eduYearsInput) {
    eduYearsInput.style.display = 'none';
    if (eduYearsInput.previousElementSibling) eduYearsInput.previousElementSibling.style.display = 'none';
}

createEducationEntry({ degree: initialDegree, school: initialSchool, years: initialYears });

function updateEducationPreview() {
    if (!iframe || !iframe.contentDocument || !iframe.contentDocument.documentElement) return;
    const doc = iframe.contentDocument;
    const container = doc.getElementById('educationContainer');
    if (!container) return;

    const template = container._entryTemplate || container.firstElementChild?.cloneNode(true);
    if (!template) return;
    container._entryTemplate = template;

    const entries = educationList.map(wrapper => ({
        degree: wrapper.querySelector('.degree').value,
        school: wrapper.querySelector('.school').value,
        years: wrapper.querySelector('.edu-years').value
    })).filter(entry => Object.values(entry).some(value => value.trim()));

    container.replaceChildren(...entries.map((entry, index) => {
        const item = template.cloneNode(true);
        const suffix = index ? String(index + 1) : '';
        const values = {
            degreePreview: entry.degree,
            schoolPreview: entry.school,
            eduYearsPreview: entry.years
        };
        Object.entries(values).forEach(([baseId, value]) => {
            const target = item.querySelector(`[id^="${baseId}"]`);
            if (target) {
                target.id = `${baseId}${suffix}`;
                target.textContent = value;
            }
        });
        return item;
    }));
    const educationSection = container.closest('section');
    if (educationSection) educationSection.style.display = entries.length ? '' : 'none';
}


// Experience
['job-title', 'company', 'exp-years', 'job-desc'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateExperiencePreview);
});


// Summary
document.getElementById("summary").addEventListener("input", e => {
    updatePreview("summaryPreview", e.target.value);
});


// Skills (comma-separated → bullet list)
document.getElementById("skills").addEventListener("input", e => {
    const skillsArr = e.target.value.split(",").map(s => s.trim()).filter(s => s);
    if (!iframe || !iframe.contentDocument) return;
    const ul = iframe.contentDocument.getElementById("skillsPreview");

    if (!ul) return;

    ul.replaceChildren(...skillsArr.map(skill => {
        const li = iframe.contentDocument.createElement("li");
        li.textContent = skill;
        return li;
    }));
});



/* ============================================================
   TEMPLATE SELECTION (handled together with templates.js)
============================================================ */

/* ============================================================
   DOWNLOAD FUNCTIONALITY
============================================================ */

const downloadBtn = document.getElementById("downloadBtn");
const downloadMenu = document.getElementById("downloadMenu");
const downloadOptions = document.querySelectorAll(".dropdown-option");

// Toggle dropdown menu
downloadBtn.addEventListener("click", () => {
    downloadMenu.classList.toggle("show");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
    if (!e.target.closest(".download-dropdown")) {
        downloadMenu.classList.remove("show");
    }
});

// Handle download option selection
downloadOptions.forEach(option => {
    option.addEventListener("click", () => {
        const format = option.getAttribute("data-format");
        downloadResume(format);
        downloadMenu.classList.remove("show");
    });
});

// Main download function
function downloadResume(format) {
    const iframeDoc = iframe.contentWindow.document;
    const element = iframeDoc.documentElement;
    
    switch(format) {
        case 'pdf':
            downloadAsPDF(element);
            break;
        case 'image':
            downloadAsImage(element);
            break;
        case 'docx':
            downloadAsDocx(element);
            break;
    }
}

// Download as PDF
function downloadAsPDF(element) {
    const opt = {
        margin: 10,
        filename: 'resume.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
}

// Download as Image (PNG)
function downloadAsImage(element) {
    html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    }).then(canvas => {
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = 'resume.png';
        link.click();
    });
}

// Download as Word Document
function downloadAsDocx(element) {
    // Convert HTML to a format suitable for Word
    const htmlContent = element.innerHTML;
    const preHtml = "<html xmlns:x='urn:schemas-microsoft-com:office:excel'><head><meta charset='UTF-8'></head><body>";
    const postHtml = "</body></html>";
    
    const blob = new Blob([preHtml + htmlContent + postHtml], {
        type: 'application/msword'
    });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'resume.doc';
    link.click();
    URL.revokeObjectURL(link.href);
}



/* ============================================================
   DYNAMIC EXPERIENCE & PROJECTS
============================================================ */

// Experience
const experienceList = [];
const experienceContainer = document.getElementById('step-3');
const addExpBtn = document.createElement('button');
addExpBtn.textContent = 'Add Experience';
addExpBtn.className = 'btn-primary';
experienceContainer.appendChild(addExpBtn);

addExpBtn.addEventListener('click', () => {
    const idx = experienceList.length + 1;
    const wrapper = document.createElement('div');
    wrapper.className = 'exp-entry';
    wrapper.innerHTML = `
        <label>Job Title</label><input type="text" class="job-title" data-idx="${idx}">
        <label>Company</label><input type="text" class="company" data-idx="${idx}">
        <label>Years</label><input type="text" class="exp-years" data-idx="${idx}">
        <label>Description</label><textarea class="job-desc" data-idx="${idx}"></textarea>
        <button class="remove-exp">Remove</button>
    `;
    experienceContainer.insertBefore(wrapper, addExpBtn);
    experienceList.push(wrapper);

    wrapper.querySelector('.remove-exp').addEventListener('click', () => {
        experienceContainer.removeChild(wrapper);
        experienceList.splice(experienceList.indexOf(wrapper), 1);
        updateExperiencePreview();
    });

    ['job-title','company','exp-years','job-desc'].forEach(cls => {
        wrapper.querySelector(`.${cls}`).addEventListener('input', updateExperiencePreview);
    });
});

function updateExperiencePreview() {
    if (!iframe || !iframe.contentDocument || !iframe.contentDocument.documentElement) return;
    const container = iframe.contentDocument.getElementById('experienceContainer');
    if (!container) return;

    const entries = [];
    const firstEntry = {
        jobTitle: document.getElementById('job-title').value,
        company: document.getElementById('company').value,
        years: document.getElementById('exp-years').value,
        description: document.getElementById('job-desc').value
    };
    if (Object.values(firstEntry).some(value => value.trim())) entries.push(firstEntry);

    experienceList.forEach(wrapper => {
        const entry = {
            jobTitle: wrapper.querySelector('.job-title').value,
            company: wrapper.querySelector('.company').value,
            years: wrapper.querySelector('.exp-years').value,
            description: wrapper.querySelector('.job-desc').value
        };
        if (Object.values(entry).some(value => value.trim())) entries.push(entry);
    });

    const doc = iframe.contentDocument;
    const template = container._entryTemplate || container.firstElementChild?.cloneNode(true);
    if (!template) return;
    container._entryTemplate = template;
    container.replaceChildren(...entries.map((entry, index) => {
        const item = template.cloneNode(true);
        const suffix = index ? String(index + 1) : '';
        const values = {
            jobTitlePreview: entry.jobTitle,
            companyPreview: entry.company,
            expYearsPreview: entry.years,
            jobDescPreview: entry.description
        };
        Object.entries(values).forEach(([baseId, value]) => {
            const target = item.querySelector(`[id^="${baseId}"]`);
            if (target) {
                target.id = `${baseId}${suffix}`;
                target.textContent = value;
            }
        });
        return item;
    }));
    const experienceSection = container.closest('section');
    if (experienceSection) experienceSection.style.display = entries.length ? '' : 'none';
    // re-evaluate visibility after experience updates
    setTimeout(hideEmptySectionsInIframe, 10);
}

// Projects (now in step 6)
const projectList = [];
const projectStepDiv = document.getElementById('projects-step');
const addProjBtn = document.createElement('button');
addProjBtn.textContent = 'Add Project';
addProjBtn.className = 'btn-primary';
projectStepDiv.appendChild(addProjBtn);

addProjBtn.addEventListener('click', () => {
    const idx = projectList.length + 1;
    const wrapper = document.createElement('div');
    wrapper.className = 'proj-entry';
    wrapper.innerHTML = `
        <label>Project Title & Description</label><input type="text" class="project-title" data-idx="${idx}">
        <button class="remove-proj">Remove</button>
    `;
    projectStepDiv.insertBefore(wrapper, addProjBtn);
    projectList.push(wrapper);

    wrapper.querySelector('.remove-proj').addEventListener('click', () => {
        projectStepDiv.removeChild(wrapper);
        projectList.splice(projectList.indexOf(wrapper), 1);
        updateProjectPreview();
    });

    wrapper.querySelector('.project-title').addEventListener('input', updateProjectPreview);
});

function updateProjectPreview() {
    if (!iframe || !iframe.contentDocument || !iframe.contentDocument.documentElement) return;
    const doc = iframe.contentDocument;
    const container = doc.getElementById('projectsContainer');
    
    if (!container) return;
    
    const projects = projectList.map(wrapper => wrapper.querySelector('.project-title').value.trim()).filter(Boolean);
    container.replaceChildren(...projects.map((projectText, i) => {
        const li = doc.createElement('li');
        li.id = `project${i + 1}Preview`;
        li.textContent = projectText;
        return li;
    }));
    const section = container.closest('section');
    if (section) section.style.display = projects.length ? '' : 'none';
}

window.refreshResumePreview = function() {
    applyProfileImageToIframe();
    updateEducationPreview();
    updateProjectPreview();
    updateExperiencePreview();
    hideEmptySectionsInIframe();
};

/* ============================================================
   RESUME STORAGE & MANAGEMENT - FIXED VERSION
============================================================ */

// Backend API configuration
const API_BASE = 'http://localhost:3000/api';
const USE_API = true;
const STORAGE_KEY = 'resumeCraftResumes';
const AUTH_STORAGE_KEY = 'resumeCraftAuth';
let currentResumeId = null;

// Helper function to get current user
function getCurrentUser() {
    const authData = localStorage.getItem(AUTH_STORAGE_KEY);
    return authData ? JSON.parse(authData) : null;
}

// Collect all education entries
function collectEducationData() {
    const education = [];
    const entries = document.querySelectorAll('.edu-entry');
    
    entries.forEach(entry => {
        const degree = entry.querySelector('.degree')?.value || '';
        const school = entry.querySelector('.school')?.value || '';
        const years = entry.querySelector('.edu-years')?.value || '';
        
        if (degree || school || years) {
            education.push({ degree, school, years });
        }
    });
    
    return education;
}

// Collect all experience entries
function collectExperienceData() {
    const experience = [];
    
    // Get the first static entry if it exists
    const staticJobTitle = document.getElementById('job-title')?.value || '';
    const staticCompany = document.getElementById('company')?.value || '';
    const staticYears = document.getElementById('exp-years')?.value || '';
    const staticDesc = document.getElementById('job-desc')?.value || '';
    
    if (staticJobTitle || staticCompany || staticYears || staticDesc) {
        experience.push({
            jobTitle: staticJobTitle,
            company: staticCompany,
            years: staticYears,
            description: staticDesc
        });
    }
    
    // Get dynamic entries
    const entries = document.querySelectorAll('.exp-entry');
    entries.forEach(entry => {
        const jobTitle = entry.querySelector('.job-title')?.value || '';
        const company = entry.querySelector('.company')?.value || '';
        const years = entry.querySelector('.exp-years')?.value || '';
        const description = entry.querySelector('.job-desc')?.value || '';
        
        if (jobTitle || company || years || description) {
            experience.push({ jobTitle, company, years, description });
        }
    });
    
    return experience;
}

// Collect all project entries
function collectProjectsData() {
    const projects = [];
    const entries = document.querySelectorAll('.proj-entry');
    
    entries.forEach(entry => {
        const title = entry.querySelector('.project-title')?.value || '';
        if (title) {
            projects.push({ title });
        }
    });
    
    return projects;
}

// Main save function
function saveCurrentResume() {
    const currentUser = getCurrentUser();
    
    // Collect all form data
    const resumeData = {
        userId: currentUser ? currentUser.userId : null,
        fullName: document.getElementById('name')?.value || '',
        role: document.getElementById('role')?.value || '',
        email: document.getElementById('email')?.value || '',
        phone: document.getElementById('phone')?.value || '',
        address: document.getElementById('address')?.value || '',
        
        // Collect dynamic education data
        education: collectEducationData(),
        
        // Keep backward compatibility for single education entry
        degree: document.querySelector('.edu-entry .degree')?.value || document.getElementById('degree')?.value || '',
        school: document.querySelector('.edu-entry .school')?.value || document.getElementById('school')?.value || '',
        eduYears: document.querySelector('.edu-entry .edu-years')?.value || document.getElementById('edu-years')?.value || '',
        
        // Collect all experience entries
        experience: collectExperienceData(),
        
        // Collect all projects
        projects: collectProjectsData(),
        
        // Other fields
        skills: document.getElementById('skills')?.value || '',
        summary: document.getElementById('summary')?.value || '',
        profilePhotoData: currentProfileImageData || null,
        templateId: window.currentTemplateId || '1',
        
        // Timestamps
        createdAt: currentResumeId ? undefined : new Date().toISOString(),
        savedAt: new Date().toISOString()
    };
    
    // If API is enabled and auth token exists, save to server
    if (USE_API && currentUser && currentUser.token) {
        if (currentResumeId) {
            // Update existing resume
            return fetch(`${API_BASE}/resumes/${currentResumeId}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${currentUser.token}` 
                },
                body: JSON.stringify(resumeData)
            })
            .then(r => {
                if (!r.ok) throw new Error('Failed to update resume');
                return r.json();
            })
            .then(saved => {
                currentResumeId = saved._id || saved.id || currentResumeId;
                console.log('Resume updated successfully:', currentResumeId);
                return currentResumeId;
            })
            .catch(err => {
                console.error('Failed to save resume to server:', err);
                // Fallback to localStorage
                return saveResumeLocally(resumeData);
            });
        } else {
            // Create new resume
            return fetch(`${API_BASE}/resumes`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${currentUser.token}` 
                },
                body: JSON.stringify(resumeData)
            })
            .then(r => {
                if (!r.ok) throw new Error('Failed to create resume');
                return r.json();
            })
            .then(saved => {
                currentResumeId = saved._id || saved.id;
                console.log('Resume created successfully:', currentResumeId);
                return currentResumeId;
            })
            .catch(err => {
                console.error('Failed to create resume on server:', err);
                // Fallback to localStorage
                return saveResumeLocally(resumeData);
            });
        }
    }
    
    // Fallback: save locally
    return Promise.resolve(saveResumeLocally(resumeData));
}

// Save to localStorage
function saveResumeLocally(resumeData) {
    try {
        const resumes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const existingIndex = resumes.findIndex(r => r.id === resumeData.id);
        
        if (existingIndex > -1) {
            // Keep original createdAt
            resumeData.createdAt = resumes[existingIndex].createdAt || new Date().toISOString();
            resumes[existingIndex] = resumeData;
        } else {
            // New resume
            if (!resumeData.createdAt) {
                resumeData.createdAt = new Date().toISOString();
            }
            resumes.push(resumeData);
        }
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
        currentResumeId = resumeData.id;
        console.log('Resume saved locally:', currentResumeId);
        return currentResumeId;
    } catch (err) {
        console.error('Error saving to localStorage:', err);
        throw err;
    }
}

// Load existing resume
function loadExistingResume() {
    const urlParams = new URLSearchParams(window.location.search);
    const resumeId = urlParams.get('resumeId');
    
    if (!resumeId) return;
    
    const currentUser = getCurrentUser();
    
    // Try to load from API first
    if (USE_API && currentUser && currentUser.token) {
        fetch(`${API_BASE}/resumes/${resumeId}`, {
            headers: { 'Authorization': `Bearer ${currentUser.token}` }
        })
        .then(r => {
            if (!r.ok) throw new Error('Failed to fetch resume');
            return r.json();
        })
        .then(resume => {
            if (resume && (resume._id || resume.id)) {
                currentResumeId = resume._id || resume.id;
                populateFormWithResumeData(resume);
                loadTemplate(resume.templateId || '1');
            }
        })
        .catch(err => {
            console.error('Failed to load resume from server, trying localStorage:', err);
            loadResumeFromLocalStorage(resumeId);
        });
    } else {
        loadResumeFromLocalStorage(resumeId);
    }
}

// Load from localStorage
function loadResumeFromLocalStorage(resumeId) {
    try {
        const resumes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const resume = resumes.find(r => r.id === resumeId);
        
        if (resume) {
            currentResumeId = resumeId;
            populateFormWithResumeData(resume);
            loadTemplate(resume.templateId || '1');
        }
    } catch (err) {
        console.error('Error loading resume from localStorage:', err);
    }
}

// Populate form with resume data
function populateFormWithResumeData(resume) {
    document.getElementById('name').value = resume.fullName || '';
    document.getElementById('role').value = resume.role || '';
    document.getElementById('email').value = resume.email || '';
    document.getElementById('phone').value = resume.phone || '';
    document.getElementById('address').value = resume.address || '';
    document.getElementById('summary').value = resume.summary || '';
    document.getElementById('skills').value = Array.isArray(resume.skills)
        ? resume.skills.join(', ')
        : (resume.skills || '');

    const education = Array.isArray(resume.education) && resume.education.length
        ? resume.education
        : (resume.degree || resume.school || resume.eduYears
            ? [{ degree: resume.degree, school: resume.school, years: resume.eduYears }]
            : []);
    while (educationList.length > 1) {
        educationList[educationList.length - 1].querySelector('.remove-edu').click();
    }
    const firstEducation = educationList[0];
    firstEducation.querySelector('.degree').value = education[0]?.degree || '';
    firstEducation.querySelector('.school').value = education[0]?.school || '';
    firstEducation.querySelector('.edu-years').value = education[0]?.years || '';
    education.slice(1).forEach(entry => createEducationEntry(entry));

    const experiences = Array.isArray(resume.experience) ? resume.experience : [];
    document.getElementById('job-title').value = experiences[0]?.jobTitle || '';
    document.getElementById('company').value = experiences[0]?.company || '';
    document.getElementById('exp-years').value = experiences[0]?.years || '';
    document.getElementById('job-desc').value = experiences[0]?.description || '';
    while (experienceList.length) {
        experienceList[experienceList.length - 1].querySelector('.remove-exp').click();
    }
    experiences.slice(1).forEach(entry => {
        addExpBtn.click();
        const wrapper = experienceList[experienceList.length - 1];
        wrapper.querySelector('.job-title').value = entry.jobTitle || '';
        wrapper.querySelector('.company').value = entry.company || '';
        wrapper.querySelector('.exp-years').value = entry.years || '';
        wrapper.querySelector('.job-desc').value = entry.description || '';
    });

    while (projectList.length) {
        projectList[projectList.length - 1].querySelector('.remove-proj').click();
    }
    (Array.isArray(resume.projects) ? resume.projects : []).forEach(project => {
        addProjBtn.click();
        projectList[projectList.length - 1].querySelector('.project-title').value = project.title || '';
    });

    currentProfileImageData = resume.profilePhotoData || null;
    if (photoPreviewDiv) {
        photoPreviewDiv.replaceChildren();
        if (currentProfileImageData) {
            const image = document.createElement('img');
            image.src = currentProfileImageData;
            image.alt = 'Profile';
            image.style.cssText = 'max-width:96px;max-height:96px;border-radius:8px;border:1px solid #ddd;';
            photoPreviewDiv.appendChild(image);
        }
    }

    updateEducationPreview();
    updateExperiencePreview();
    updateProjectPreview();
    loadTemplate(resume.templateId || '1');
}

// Save button handler
const saveBtn = document.getElementById('save');
const saveDialog = document.getElementById('saveDialog');
const closeDialogBtn = document.getElementById('closeDialogBtn');

if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
        try {
            // Validate required fields
            const name = document.getElementById('name')?.value.trim();
            const role = document.getElementById('role')?.value.trim();
            
            if (!name || !role) {
                alert('Please fill in at least your name and role/title before saving.');
                return;
            }
            
            // Save the resume
            const result = saveCurrentResume();
            const resumeId = (result && typeof result.then === 'function') ? await result : result;
            
            console.log('Resume saved with ID:', resumeId);
            
            // Show success dialog
            showSaveDialog();
            
            // Navigate to resumes page after a short delay
            setTimeout(() => {
                window.location.href = 'resumes.html';
            }, 1500);
            
        } catch (err) {
            console.error('Error saving resume:', err);
            alert('Could not save resume. Please try again. Check console for details.');
        }
    });
}

// Show save dialog
function showSaveDialog() {
    if (saveDialog) {
        saveDialog.classList.add('show');
    }
}

// Close save dialog
function closeSaveDialog() {
    if (saveDialog) {
        saveDialog.classList.remove('show');
    }
}

// Close dialog button
if (closeDialogBtn) {
    closeDialogBtn.addEventListener('click', closeSaveDialog);
}

// Close dialog when clicking outside
if (saveDialog) {
    saveDialog.addEventListener('click', (e) => {
        if (e.target === saveDialog) {
            closeSaveDialog();
        }
    });
}

// Close dialog with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && saveDialog?.classList.contains('show')) {
        closeSaveDialog();
    }
});

// Load existing resume on page load
document.addEventListener('DOMContentLoaded', () => {
    loadExistingResume();
    
    // Check if this is a download request
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('download') === 'true') {
        // Auto-trigger download after page loads
        setTimeout(() => {
            const sessionData = sessionStorage.getItem('resumeToDownload');
            if (sessionData) {
                const resume = JSON.parse(sessionData);
                populateFormWithResumeData(resume);
                loadTemplate(resume.templateId || '1');
                
                // Trigger download after iframe loads
                setTimeout(() => {
                    downloadResume('pdf');
                    sessionStorage.removeItem('resumeToDownload');
                }, 1000);
            }
        }, 500);
    }
});