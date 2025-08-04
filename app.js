
document.addEventListener('DOMContentLoaded', () => {
  const $ = sel => document.querySelector(sel);
  const ls = {
    get: key => JSON.parse(localStorage.getItem(key) || 'null'),
    set: (key, val) => localStorage.setItem(key, JSON.stringify(val))
  };

  // --- State ---
  let DATA = {};

  // --- Elements ---
  const symptomSel = $('#symptom');
  const symptomResult = $('#symptomResult');
  const toggleHolder = $('#toggleHolder');
  const checklistResult = $('#checklistResult');
  const chemTestsList = $('#chemTestsList');
  const chemFilters = $('#chemFilters');
  const copyBtn = $('#copyBtn');

  // --- Helpers ---
  const toList = (txt) => {
    if (!txt) return [];
    return txt
      .split(/(?:,|;|•|·|\u00B7|\u2022|\.)\s*/g)
      .map(s => s.trim())
      .filter(Boolean);
  };

  const fetchData = async () => {
    try {
      const response = await fetch('app_data.json');
      if (!response.ok) throw new Error('Network response was not ok.');
      DATA = await response.json();
      return true;
    } catch (e) {
      console.error('Failed to fetch data', e);
      if (symptomSel) symptomSel.innerHTML = '<option value=\"\">Error loading data</option>';
      if (toggleHolder) toggleHolder.innerHTML = '<p class=\"text-red-600\">Could not load checklist questions.</p>';
      if (chemTestsList) chemTestsList.innerHTML = '<li class=\"text-red-600\">Could not load chemical tests.</li>';
      return false;
    }
  };

  // --- Symptoms ---
  const buildSymptomDropdown = () => {
    if (!symptomSel) return;
    symptomSel.innerHTML = '<option value=\"\">— choose symptom —</option>';
    Object.keys(DATA.symptoms || {}).forEach(key => {
      const o = document.createElement('option');
      o.value = key; o.textContent = key;
      symptomSel.appendChild(o);
    });
  };

  const renderSymptomResult = (key) => {
    if (!symptomResult) return;
    if (!key || !DATA.symptoms || !DATA.symptoms[key]) {
      symptomResult.classList.add('hidden');
      symptomResult.innerHTML = '';
      return;
    }
    const d = DATA.symptoms[key];
    const causes = toList(d.causes);
    const actions = toList(d.actions);
    symptomResult.innerHTML = `
      <div class="bg-blue-50 border border-blue-100 p-4 md:p-5 rounded-lg shadow-sm text-sm">
        <p class="font-semibold text-blue-800 mb-2">Likely causes</p>
        <ul class="list-disc list-inside space-y-1 text-blue-900">${causes.map(c => `<li>${c}</li>`).join('')}</ul>
        <p class="font-semibold text-green-800 mt-4 mb-2">Suggested actions</p>
        <ul class="list-disc list-inside space-y-1 text-green-900">${actions.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>`;
    symptomResult.classList.remove('hidden');
    ls.set('lastSymptom', key);
  };

  // --- Checklist ---
  const buildChecklist = () => {
    if (!toggleHolder) return;
    toggleHolder.innerHTML = '';
    const tpl = document.getElementById('toggleTemplate').content;
    (DATA.questions || []).forEach((q, i) => {
      const node = document.importNode(tpl, true);
      const p = node.querySelector('p');
      const noteDiv = node.querySelector('.note');
      const [yIn, nIn] = node.querySelectorAll('input');
      const yLbl = node.querySelector('.yes');
      const nLbl = node.querySelector('.no');

      p.textContent = `${i + 1}. ${q.text}`;
      yIn.id = `${q.key}Y`; nIn.id = `${q.key}N`;
      yIn.name = nIn.name = q.key;
      yIn.value = 'Yes'; nIn.value = 'No';
      yLbl.setAttribute('for', yIn.id); nLbl.setAttribute('for', nIn.id);

      if (q.note) {
        noteDiv.textContent = q.note;
        noteDiv.classList.remove('hidden');
      }

      const saved = ls.get('toggle_' + q.key) || 'Yes';
      if (saved === 'No') nIn.checked = true; else yIn.checked = true;

      toggleHolder.appendChild(node);
    });
  };

  const getToggleValue = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';

  const compileAdvice = () => {
    if (!checklistResult) return;
    const messages = [];
    (DATA.questions || []).forEach(q => {
      if (getToggleValue(q.key) === 'No') {
        switch(q.key) {
          case 'dosingOn': messages.push('Switch on dosing unit.'); break;
          case 'dosingWorking': messages.push('Repair or calibrate dosing equipment.'); break;
          case 'temps': messages.push('Verify and adjust wash & rinse temperatures.'); break;
          case 'jets': messages.push('Clear wash and rinse jets.'); break;
          case 'practice': messages.push('Improve pre-scraping and racking practices.'); break;
          case 'detergent': messages.push('Connect correct detergent containers & tubing.'); break;
          case 'titration': messages.push('Perform detergent titration test.'); break;
        }
      }
    });
    checklistResult.innerHTML = messages.length
      ? `<div class="bg-yellow-50 border border-yellow-100 rounded-lg p-4 shadow-sm"><h3 class="text-sm font-semibold mb-2">Checklist findings</h3><ul class="list-disc list-inside text-sm space-y-1"><li>${messages.join('</li><li>')}</li></ul></div>`
      : `<p class="text-sm text-gray-600">No obvious issues from the checklist.</p>`;
    checklistResult.classList.remove('hidden');
  };

  // --- Chemical Tests ---
  const buildChemFilters = () => {
    if (!chemFilters) return;
    // Build categories from simple keyword detection (or default to All)
    const cats = new Set();
    (DATA.chemicalTests || []).forEach(t => {
      const c = t.category || 'General';
      cats.add(c);
    });
    const list = ['All', ...cats];
    chemFilters.innerHTML = '';
    list.forEach(cat => {
      const b = document.createElement('button');
      b.textContent = cat;
      b.className = 'px-3 py-1 rounded-full bg-gray-100 hover:bg-white border border-gray-200 shadow-sm text-xs';
      b.addEventListener('click', () => buildChemicalTests(cat === 'All' ? '' : cat));
      chemFilters.appendChild(b);
    });
  };

  const buildChemicalTests = (filter = '') => {
    if (!chemTestsList) return;
    chemTestsList.innerHTML = '';
    const filtered = filter
      ? (DATA.chemicalTests || []).filter(t => (t.category || 'General') === filter)
      : (DATA.chemicalTests || []);

    filtered.forEach(test => {
      const li = document.createElement('li');
      li.innerHTML = `
        <div class="p-4 md:p-5 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div class="flex items-start justify-between">
            <h4 class="font-semibold">${test.title}</h4>
            ${test.category ? `<span class="ml-3 inline-block text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">${test.category}</span>` : ''}
          </div>
          <p class="mt-2 text-sm">${test.description}</p>
          ${test.check ? `<p class="mt-2 text-xs text-gray-700"><em>${test.check}</em></p>` : ''}
        </div>`;
      chemTestsList.appendChild(li);
    });
  };

  // --- Events ---
  const setupEvents = () => {
    if (symptomSel) symptomSel.addEventListener('change', e => renderSymptomResult(e.target.value));
    if (toggleHolder) toggleHolder.addEventListener('change', e => {
      if (e.target.matches('input[type="radio"]')) {
        ls.set('toggle_' + e.target.name, e.target.value);
        compileAdvice();
      }
    });
    if (copyBtn) copyBtn.addEventListener('click', () => {
      let txt = `Machine Make: ${$('#mMake')?.value || '-'}\n`;
      txt += `Machine Model: ${$('#mModel')?.value || '-'}\n\n`;
      (DATA.questions || []).forEach((q, i) => {
        txt += `${i + 1}. ${q.text} - ${getToggleValue(q.key) || '-'}\n`;
      });
      txt += '\n--- Symptom ---\n';
      txt += symptomSel?.value ? `${symptomSel.value}\n` : 'None selected\n';
      txt += symptomResult?.textContent.trim() ? '\n' + symptomResult.textContent.trim() : '';
      navigator.clipboard.writeText(txt).then(() => alert('Summary copied!'));
    });

    ['mMake','mModel'].forEach(id => {
      const el = $('#' + id);
      if (el) {
        el.value = ls.get(id) || '';
        el.addEventListener('input', () => ls.set(id, el.value.trim()));
      }
    });
  };

  // --- Init ---
  const init = async () => {
    const ok = await fetchData();
    if (!ok) return;
    buildSymptomDropdown();
    buildChecklist();
    buildChemFilters();
    buildChemicalTests();

    setupEvents();

    const lastSym = ls.get('lastSymptom');
    if (lastSym && DATA.symptoms && DATA.symptoms[lastSym]) {
      symptomSel.value = lastSym;
      renderSymptomResult(lastSym);
    }
    compileAdvice();
  };

  init();
});
