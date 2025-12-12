// templates.js
// Handles template selection and live preview updates inside the preview iframe.

(function () {
  const iframe = document.getElementById('resume-preview');
  const templateOptions = document.querySelectorAll('.template-option');

  // Form fields to mirror into templates (id -> selector inside iframe)
  const fieldIds = [
    'name', 'email', 'phone', 'address', 'role',
    'degree', 'school', 'edu-years',
    'job-title', 'company', 'exp-years', 'job-desc',
    'skills', 'summary'
  ];

  // Map builder input ids to likely target element ids in templates (attempt many common ids)
  const targetMap = {
    name: ['namePreview', 'profileName', 'name'],
    email: ['emailPreview', 'email'],
    phone: ['phonePreview', 'phone'],
    address: ['addressPreview', 'address'],
    degree: ['degreePreview', 'degree'],
    school: ['schoolPreview', 'school'],
    'edu-years': ['eduYearsPreview', 'eduYears', 'edu-years'],
    'job-title': ['jobTitlePreview', 'jobTitle', 'job-title'],
    company: ['companyPreview', 'company'],
    'exp-years': ['expYearsPreview', 'expYears', 'exp-years'],
    'job-desc': ['jobDescPreview', 'jobDesc', 'job-desc'],
    skills: ['skillsPreview', 'skills-list', 'skills'],
    summary: ['summaryPreview', 'summary']
  };

  // Add mapping for role/title
  targetMap.role = ['rolePreview', 'role'];

  let pendingData = null;

  // Helper: collect values from builder form
  function collectFormData() {
    const data = {};
    fieldIds.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (id === 'skills') {
        data[id] = el.value ? el.value.split(',').map(s => s.trim()).filter(Boolean) : [];
      } else {
        data[id] = el.value || '';
      }
    });
    return data;
  }

  // Update iframe content by mapping data to elements inside the iframe document
  function updateIframe(data) {
    if (!iframe || !iframe.contentDocument) {
      pendingData = data;
      return;
    }

    const doc = iframe.contentDocument;

    // Simple text fields
    Object.keys(data).forEach(key => {
      const val = data[key];
      const targets = targetMap[key] || [key];
      // Special handling for skills array
      if (key === 'skills') {
        const skillsEl = targets.map(t => doc.getElementById(t)).find(Boolean);
        if (skillsEl) {
          if (skillsEl.tagName && skillsEl.tagName.toLowerCase() === 'ul') {
            skillsEl.innerHTML = '';
            val.forEach(skill => {
              const li = doc.createElement('li');
              li.textContent = skill;
              skillsEl.appendChild(li);
            });
          } else {
            skillsEl.textContent = Array.isArray(val) ? val.join(', ') : val;
          }
        }
        return;
      }

      for (let t of targets) {
        const target = doc.getElementById(t);
        if (target) {
            // Special formatting: treat job description as paragraph + bullets
            if (key === 'job-desc' || key === 'jobDesc') {
              // Render first line as paragraph, remaining non-empty lines as list items
              if (!val || !String(val).trim()) {
                target.textContent = ' ';
              } else {
                const parts = String(val).split('\n');
                const first = (parts.shift() || '').trim();
                let html = '';
                if (first) html += `<p>${escapeHtml(first)}</p>`;
                const remaining = parts.map(s => s.trim()).filter(Boolean);
                if (remaining.length > 0) {
                  html += '<ul>' + remaining.map(l => `<li>${escapeHtml(l.replace(/^•\s*/, ''))}</li>`).join('') + '</ul>';
                }
                target.innerHTML = html;
              }
            } else {
              if (target.tagName.toLowerCase() === 'input' || target.tagName.toLowerCase() === 'textarea') {
                target.value = val;
              } else {
                target.textContent = val;
              }
            }
          break; // stop after first match
        }
      }
    });
  }

  // Escape HTML to avoid injection in preview
  function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Smoothly switch iframe src with fade
  function switchTemplate(templateId) {
    if (!iframe) return;
    const src = `templates/template${templateId}.html`;
    iframe.style.transition = 'opacity 260ms ease';
    iframe.style.opacity = '0.01';
    setTimeout(() => {
      iframe.src = src;
    }, 260);
  }

  // Attach listeners to template options
  templateOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      templateOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      const tid = opt.dataset.template || opt.getAttribute('data-template');
      switchTemplate(tid);
    });
  });

  // Attach listeners to form inputs for live preview
  fieldIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const ev = (el.tagName.toLowerCase() === 'input' || el.tagName.toLowerCase() === 'textarea') ? 'input' : 'change';
    el.addEventListener(ev, () => {
      const data = collectFormData();
      updateIframe(data);
    });
  });

  // When iframe loads, apply pending data and fade back in
  if (iframe) {
    iframe.addEventListener('load', () => {
      requestAnimationFrame(() => { iframe.style.opacity = '1'; });
      if (pendingData) {
        updateIframe(pendingData);
        pendingData = null;
      } else {
        updateIframe(collectFormData());
      }
    });
  }

  // Initialize: mark first template option active if none
  (function init() {
    const active = document.querySelector('.template-option.active') || document.querySelector('.template-option');
    if (active) {
      active.classList.add('active');
      const tid = active.dataset.template || active.getAttribute('data-template');
      iframe.src = `templates/template${tid}.html`;
    }
  })();

})();
