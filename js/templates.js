// Keeps the selected template and its live preview in sync with the builder form.
(function () {
  const iframe = document.getElementById('resume-preview');
  const templateOptions = document.querySelectorAll('.template-option');
  const fieldTargets = {
    name: ['namePreview', 'profileName'],
    email: ['emailPreview'],
    phone: ['phonePreview'],
    address: ['addressPreview'],
    role: ['rolePreview', 'role'],
    degree: ['degreePreview'],
    school: ['schoolPreview'],
    'edu-years': ['eduYearsPreview', 'eduYears', 'edu-years'],
    'job-title': ['jobTitlePreview', 'jobTitle', 'job-title'],
    company: ['companyPreview', 'company'],
    'exp-years': ['expYearsPreview', 'expYears', 'exp-years'],
    'job-desc': ['jobDescPreview', 'jobDesc', 'job-desc'],
    summary: ['summaryPreview', 'summary']
  };

  let templateLoadTimer;

  function collectFormData() {
    const data = {};
    Object.keys(fieldTargets).forEach((fieldId) => {
      const input = document.getElementById(fieldId);
      if (input) data[fieldId] = input.value || '';
    });
    const skills = document.getElementById('skills');
    if (skills) data.skills = skills.value.split(',').map(skill => skill.trim()).filter(Boolean);
    return data;
  }

  function updateIframe(data) {
    const doc = iframe && iframe.contentDocument;
    if (!doc || !doc.documentElement) return;

    Object.entries(fieldTargets).forEach(([fieldId, targetIds]) => {
      const value = data[fieldId] || '';
      targetIds.forEach((id) => {
        const target = doc.getElementById(id);
        if (target) target.textContent = value;
      });
    });

    const roleInput = doc.querySelector('.title');
    if (roleInput && data.role !== undefined) roleInput.textContent = data.role;

    if (data.skills) {
      const skillsList = doc.getElementById('skillsPreview');
      if (skillsList) {
        skillsList.replaceChildren(...data.skills.map((skill) => {
          const item = doc.createElement('li');
          item.textContent = skill;
          return item;
        }));
      }
    }
  }

  function loadTemplate(templateId) {
    const id = String(templateId || '1').replace(/^template/, '');
    if (!/^[1-5]$/.test(id)) {
      console.error(`Unknown resume template: ${templateId}`);
      return;
    }

    window.currentTemplateId = id;
    templateOptions.forEach((option) => {
      option.classList.toggle('active', option.dataset.template === id);
    });

    if (!iframe) return;
    window.clearTimeout(templateLoadTimer);
    iframe.style.transition = 'opacity 260ms ease';
    iframe.style.opacity = '0.01';
    templateLoadTimer = window.setTimeout(() => {
      iframe.src = `templates/template${id}.html?t=${Date.now()}`;
    }, 260);
  }

  window.loadTemplate = loadTemplate;
  window.currentTemplateId = '1';

  templateOptions.forEach((option) => {
    option.addEventListener('click', () => loadTemplate(option.dataset.template));
  });

  Object.keys(fieldTargets).concat('skills').forEach((fieldId) => {
    const input = document.getElementById(fieldId);
    if (input) input.addEventListener('input', () => updateIframe(collectFormData()));
  });

  if (iframe) {
    iframe.addEventListener('load', () => {
      requestAnimationFrame(() => { iframe.style.opacity = '1'; });
      updateIframe(collectFormData());
      window.setTimeout(() => {
        if (typeof window.refreshResumePreview === 'function') {
          window.refreshResumePreview();
        }
      }, 80);
    });
  }

  const active = document.querySelector('.template-option.active') || templateOptions[0];
  if (active) {
    loadTemplate(active.dataset.template);
  } else if (iframe) {
    iframe.addEventListener('load', () => updateIframe(collectFormData()), { once: true });
  }
})();
