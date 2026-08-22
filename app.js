/* ============================================================================
   EMRS STUDENT PROFILE FORM — Firebase + client-side PDF version
   No servers, no Apps Script. Firestore stores the data (photo included, as a
   compressed base64 string), and every PDF (single or merged) is generated
   live in the browser using jsPDF + html2canvas, so watermark opacity and the
   Garamond font both render exactly as designed — no server-side converter
   limitations here.
   ========================================================================== */

const HOUSES = ['Brahmaputra', 'Ganga', 'Godavari', 'Tapi'];
const CATEGORIES = ['Junior Girls', 'Junior Boys', 'Senior Girls', 'Senior Boys'];
const ASSESSMENT_ROWS = [['PT1','pt1'],['PT2','pt2'],['HY','hy'],['PT3','pt3'],['PT4','pt4'],['Y/B','yb'],['Pre B1','preb1'],['Pre B2','preb2']];
const NUM_SUBJECT_COLS = 7;

document.getElementById('brandLogoImg').src = EMRS_LOGO_BASE64;

/* ------------------------- FIELD CONFIG ------------------------- */
// Each field: { key, label, type, required, numeric, maxLength, options, wide, textSize }
const SECTIONS = [
  { title: 'House / Class', fields: [
    { key: 'fullName', label: 'Full Name', type: 'text', required: true },
    { key: 'className', label: 'Class', type: 'select', required: true, options: [6,7,8,9,10,11,12] },
    { key: 'section', label: 'Section', type: 'select', required: true, options: ['A','B','Science','Arts'] },
    { key: 'house', label: 'House', type: 'houseSelect', required: true },
    { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male','Female'] },
    { key: 'caste', label: 'Caste', type: 'fixed', value: 'BHIL', required: true },
    { key: 'casteCategory', label: 'Category', type: 'fixed', value: 'ST', required: true },
    { key: 'photo', label: 'Photo', type: 'photo' }
  ]},
  { title: 'Contact Information', fields: [
    { key: 'fatherName', label: "Father's Name", type: 'text', required: true },
    { key: 'motherName', label: "Mother's Name", type: 'text', required: true },
    { key: 'email', label: 'Email ID', type: 'email' },
    { key: 'distanceFromSchool', label: 'Distance From School (km)', type: 'text', numeric: true },
    { key: 'aadhaarNo', label: 'Aadhaar No. (12 digits)', type: 'text', numeric: true, maxLength: 12 },
    { key: 'fatherAadhaar', label: "Father's Aadhaar No. (12 digits)", type: 'text', numeric: true, maxLength: 12 },
    { key: 'motherAadhaar', label: "Mother's Aadhaar No. (12 digits)", type: 'text', numeric: true, maxLength: 12 },
    { key: 'phone1', label: 'Phone Number (1) (10 digits)', type: 'text', numeric: true, maxLength: 10 },
    { key: 'phone2', label: 'Phone Number (2) (10 digits)', type: 'text', numeric: true, maxLength: 10 },
    { key: 'phone3', label: 'Phone Number (3) (10 digits)', type: 'text', numeric: true, maxLength: 10 },
    { key: 'address', label: 'Address', type: 'textarea', wide: true, textSize: 'extraTall',
      placeholder: 'Full address — village/town, tehsil, district, state, PIN' }
  ]},
  { title: 'Personal Information', fields: [
    { key: 'bloodGroup', label: 'Blood Group', type: 'select',
      options: ['A+','A-','B+','B-','O+','O-','AB+','AB-','Not Checked Yet'] },
    { key: 'religion', label: 'Religion', type: 'select',
      options: ['Hindu','Muslim','Christian','Sikh','Buddhist','Jain','Parsi','Jewish','Other'] },
    { key: 'age', label: 'Age', type: 'text', numeric: true },
    { key: 'satsNo', label: 'SATS No.', type: 'text' },
    { key: 'penNo', label: 'PEN No. (UDISE)', type: 'text' },
    { key: 'nearestRelative', label: 'Nearest Relative (Emergency)', type: 'text' },
    { key: 'nearestRelativeMobile', label: 'Nearest Relative Mob. No. (10 digits)', type: 'text', numeric: true, maxLength: 10 }
  ]},
  { title: 'Family Information', fields: [
    { key: 'parentsEmployer', label: "Parent's Employer", type: 'text' },
    { key: 'fatherOccupation', label: "Father's Occupation", type: 'text' },
    { key: 'motherOccupation', label: "Mother's Occupation", type: 'text' },
    { key: 'singleParentChild', label: 'Single Parent Child', type: 'select', options: ['Yes','No'] },
    { key: 'guardianParent', label: 'Guardian (if single parent)', type: 'text' },
    { key: 'guardianMobile', label: "Guardian's Mob. No. (10 digits)", type: 'text', numeric: true, maxLength: 10 },
    { key: 'guardianOccupation', label: "Guardian's Occupation", type: 'text' },
    { key: 'guardianEducation', label: "Guardian's Education", type: 'text' },
    { key: 'workingFamilyMembers', label: 'Number of Working Family Members', type: 'text', numeric: true }
  ]},
  { title: 'Health Information', fields: [
    { key: 'medicalConditions', label: 'Medical Conditions (if any)', type: 'textarea', textSize: 'tall' },
    { key: 'allergies', label: 'Allergies (if any)', type: 'textarea', textSize: 'tall' },
    { key: 'specialNeeds', label: 'Special Needs (if any)', type: 'textarea', textSize: 'tall' },
    { key: 'parentsLivingStatus', label: 'Parents Living Status', type: 'select', options: ['Single','Family'] },
    { key: 'guardianName', label: 'Guardian Name', type: 'text' },
    { key: 'medications', label: 'Medications (if any)', type: 'textarea', textSize: 'tall' },
    { key: 'annualFamilyIncome', label: 'Annual Family Income', type: 'text', numeric: true },
    { key: 'primaryLanguage', label: "Family's Primary Language", type: 'text' }
  ]},
  { title: 'Family Background', fields: [
    { key: 'familyType', label: 'Family Type', type: 'select', options: ['Nuclear','Joint'] },
    { key: 'siblingsSister', label: 'Number of Sisters', type: 'text', numeric: true },
    { key: 'siblingsBrother', label: 'Number of Brothers', type: 'text', numeric: true },
    { key: 'fatherEducation', label: "Father's Education", type: 'text' },
    { key: 'motherEducation', label: "Mother's Education", type: 'text' },
    { key: 'emergencyContact', label: 'Emergency Contact Number (10 digits)', type: 'text', numeric: true, maxLength: 10 },
    { key: 'height', label: 'Height', type: 'text', numeric: true },
    { key: 'weight', label: 'Weight', type: 'text', numeric: true },
    { key: 'mbs', label: 'MBS', type: 'text', numeric: true },
    { key: 'chest', label: 'Chest', type: 'text', numeric: true }
  ]},
  { title: 'Academic Information', fields: [
    { key: 'otherRelevantInfo', label: 'Any Other Relevant Information', type: 'textarea' },
    { key: 'specialEducationalNeeds', label: 'Special Educational Needs (if any)', type: 'textarea' },
    { key: 'strengths', label: 'Strengths', type: 'textarea' },
    { key: 'areasOfImprovement', label: 'Areas of Improvement', type: 'textarea' },
    { key: 'previousClass', label: 'Class/Grade (Previous)', type: 'text' },
    { key: 'lastYearResult', label: "Last Year's Result", type: 'select', options: ['Pass','Fail'] },
    { key: 'previousSchool', label: 'Previous School (if applicable)', type: 'text' },
    { key: 'academicAchievements', label: 'Academic Achievements (Previous)', type: 'textarea' }
  ]},
  { title: 'Additional Information (By HM or CT)', fields: [
    { key: 'hobbies', label: 'Hobbies/Interests', type: 'textarea', textSize: 'tall' },
    { key: 'learningDifficulties', label: 'Learning Difficulties (Previous)', type: 'textarea', textSize: 'tall' }
  ]},
  { title: 'Comments', fields: [
    { key: 'teacherComments', label: "Teacher's Comments", type: 'textarea' },
    { key: 'houseMasterComments', label: "House Master's Comments", type: 'textarea' }
  ]}
];

const FIELD_LABELS = {};
SECTIONS.forEach(function(s) { s.fields.forEach(function(f) { FIELD_LABELS[f.key] = f.label; }); });

/* ------------------------- RENDER THE FORM ------------------------- */

function fieldControlHtml(f) {
  const reqAttr = f.required ? 'required' : '';
  const reqClass = f.required ? 'req' : '';
  if (f.type === 'fixed') {
    return '<label class="' + reqClass + '">' + f.label + '</label>' +
      '<input type="text" name="' + f.key + '" value="' + f.value + '" disabled>';
  }
  if (f.type === 'photo') {
    return '<label>' + f.label + '</label>' +
      '<input type="file" name="photo" accept="image/*" id="photoInput">' +
      '<div id="photoPreview">No photo</div>';
  }
  if (f.type === 'select') {
    let opts = '<option value="">Select</option>';
    f.options.forEach(function(o) { opts += '<option value="' + o + '">' + o + '</option>'; });
    return '<label class="' + reqClass + '">' + f.label + '</label>' +
      '<select name="' + f.key + '" ' + reqAttr + '>' + opts + '</select>';
  }
  if (f.type === 'houseSelect') {
    let opts = '<option value="">Select</option>';
    HOUSES.forEach(function(h) {
      CATEGORIES.forEach(function(c) {
        opts += '<option value="' + h + ' - ' + c + '">' + h + ' — ' + c + '</option>';
      });
    });
    return '<label class="' + reqClass + '">' + f.label + '</label>' +
      '<select name="' + f.key + '" ' + reqAttr + '>' + opts + '</select>';
  }
  if (f.type === 'date') {
    return '<label class="' + reqClass + '">' + f.label + '</label>' +
      '<input type="date" name="' + f.key + '" autocomplete="off" ' + reqAttr + '>';
  }
  if (f.type === 'textarea') {
    const sizeClass = f.textSize ? ' class="' + f.textSize + '"' : '';
    const ph = f.placeholder ? ' placeholder="' + f.placeholder + '"' : '';
    return '<label>' + f.label + '</label>' +
      '<textarea name="' + f.key + '"' + sizeClass + ph + ' autocomplete="off"></textarea>';
  }
  // text / email
  const numClass = f.numeric ? ' numOnly' : '';
  const maxAttr = f.maxLength ? ' maxlength="' + f.maxLength + '"' : '';
  return '<label class="' + reqClass + '">' + f.label + '</label>' +
    '<input type="' + f.type + '" name="' + f.key + '" class="' + numClass.trim() + '"' + maxAttr + ' autocomplete="off" ' + reqAttr + '>';
}

function renderForm() {
  const container = document.getElementById('formFieldsets');
  let html = '';
  SECTIONS.forEach(function(section) {
    html += '<fieldset><legend>' + section.title + '</legend><div class="grid">';
    section.fields.forEach(function(f) {
      const wideClass = f.wide ? ' wide' : '';
      html += '<div class="field' + wideClass + '">' + fieldControlHtml(f) + '</div>';
    });
    html += '</div></fieldset>';
  });
  container.innerHTML = html;
}
renderForm();

/* ------------------------- SUBJECTS GRID ------------------------- */

function buildSubjectsGrid() {
  const headerRow = document.getElementById('subjHeaderRow');
  headerRow.innerHTML = '<th>Assessment</th><th>Max Marks</th>';
  for (let col = 0; col < NUM_SUBJECT_COLS; col++) {
    const th = document.createElement('th');
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Subject ' + (col + 1);
    input.className = 'subjNameInput';
    input.dataset.col = col;
    th.appendChild(input);
    headerRow.appendChild(th);
  }
  const body = document.getElementById('subjBody');
  body.innerHTML = '';
  ASSESSMENT_ROWS.forEach(function(r) {
    const tr = document.createElement('tr');
    let cells = '<td>' + r[0] + '</td>';
    cells += '<td><input type="text" class="subjMaxMarks numOnly" data-row="' + r[1] + '" maxlength="3"></td>';
    for (let col = 0; col < NUM_SUBJECT_COLS; col++) {
      cells += '<td><input type="text" class="subjMarks numOnly" data-col="' + col + '" data-row="' + r[1] + '" maxlength="3"></td>';
    }
    tr.innerHTML = cells;
    body.appendChild(tr);
  });
}
buildSubjectsGrid();

function collectSubjectsData() {
  const subjectNames = [];
  for (let col = 0; col < NUM_SUBJECT_COLS; col++) {
    const nameInput = document.querySelector('.subjNameInput[data-col="' + col + '"]');
    subjectNames.push(nameInput ? nameInput.value.trim() : '');
  }
  const assessments = ASSESSMENT_ROWS.map(function(r) {
    const maxInput = document.querySelector('.subjMaxMarks[data-row="' + r[1] + '"]');
    const marks = [];
    for (let col = 0; col < NUM_SUBJECT_COLS; col++) {
      const m = document.querySelector('.subjMarks[data-col="' + col + '"][data-row="' + r[1] + '"]');
      marks.push(m ? m.value : '');
    }
    return { label: r[0], key: r[1], maxMarks: maxInput ? maxInput.value : '', marks: marks };
  });
  return { subjectNames: subjectNames, assessments: assessments };
}

/* ------------------------- INPUT BEHAVIOR: numeric-only, live uppercase ------------------------- */

document.addEventListener('input', function(e) {
  if (e.target.classList.contains('numOnly')) {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  }
});
document.addEventListener('input', function(e) {
  const el = e.target;
  const isFreeText = (el.tagName === 'TEXTAREA') || (el.tagName === 'INPUT' && (el.type === 'text' || el.type === 'email'));
  if (isFreeText && !el.classList.contains('numOnly') && !el.disabled) {
    const start = el.selectionStart, end = el.selectionEnd;
    el.value = el.value.toUpperCase();
    if (start !== null) el.setSelectionRange(start, end);
  }
});

/* ------------------------- PHOTO: compress client-side before storing ------------------------- */

let photoBase64 = '';
let editingDocId = null;
let editingOriginalTimestamp = null;
document.getElementById('photoInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  const preview = document.getElementById('photoPreview');
  if (!file) { preview.innerHTML = 'No photo'; photoBase64 = ''; return; }
  const reader = new FileReader();
  reader.onload = function(evt) {
    const img = new Image();
    img.onload = function() {
      const MAX_DIM = 480;
      let w = img.width, h = img.height;
      if (w > h && w > MAX_DIM) { h = Math.round(h * (MAX_DIM / w)); w = MAX_DIM; }
      else if (h > MAX_DIM) { w = Math.round(w * (MAX_DIM / h)); h = MAX_DIM; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      photoBase64 = canvas.toDataURL('image/jpeg', 0.65);
      preview.innerHTML = '<img src="' + photoBase64 + '">';
    };
    img.src = evt.target.result;
  };
  reader.readAsDataURL(file);
});

/* ------------------------- TAB SWITCHING ------------------------- */

const tabFill = document.getElementById('tabFill');
const tabManage = document.getElementById('tabManage');
const fillView = document.getElementById('fillView');
const manageView = document.getElementById('manageView');
tabFill.addEventListener('click', function() {
  tabFill.classList.add('active'); tabManage.classList.remove('active');
  manageView.classList.remove('active'); fillView.classList.add('active');
});
tabManage.addEventListener('click', function() {
  tabManage.classList.add('active'); tabFill.classList.remove('active');
  fillView.classList.remove('active'); manageView.classList.add('active');
});

/* ------------------------- EDIT AN EXISTING STUDENT ------------------------- */
// Loads a previously-submitted student's data back into the Fill Form so it can be
// corrected and resubmitted. On save, this updates the SAME Firestore document instead
// of creating a new one (see the submit handler's editingDocId branch).

function populateFormFields(s) {
  SECTIONS.forEach(function(section) {
    section.fields.forEach(function(f) {
      if (f.type === 'fixed' || f.type === 'photo' || f.type === 'houseSelect') return;
      const el = document.querySelector('[name="' + f.key + '"]');
      if (el) el.value = s[f.key] || '';
    });
  });
  const houseSelect = document.querySelector('[name="house"]');
  if (houseSelect && s.house && s.category) houseSelect.value = s.house + ' - ' + s.category;

  photoBase64 = s.photoBase64 || '';
  const preview = document.getElementById('photoPreview');
  preview.innerHTML = photoBase64 ? '<img src="' + photoBase64 + '">' : 'No photo';
}

function populateSubjectsFromData(subj) {
  if (!subj) return;
  const names = subj.subjectNames || [];
  for (let col = 0; col < NUM_SUBJECT_COLS; col++) {
    const input = document.querySelector('.subjNameInput[data-col="' + col + '"]');
    if (input) input.value = names[col] || '';
  }
  (subj.assessments || []).forEach(function(a) {
    const maxInput = document.querySelector('.subjMaxMarks[data-row="' + a.key + '"]');
    if (maxInput) maxInput.value = a.maxMarks || '';
    (a.marks || []).forEach(function(m, col) {
      const marksInput = document.querySelector('.subjMarks[data-col="' + col + '"][data-row="' + a.key + '"]');
      if (marksInput) marksInput.value = m || '';
    });
  });
}

function loadStudentIntoForm(s) {
  editingDocId = s._id;
  editingOriginalTimestamp = s.timestamp || null;
  populateFormFields(s);
  populateSubjectsFromData(s.subjects);
  document.getElementById('submitBtn').textContent = 'Update';
  document.getElementById('editBanner').style.display = 'flex';
  document.getElementById('editBannerName').textContent = s.fullName || '';
  tabFill.click();
  window.scrollTo(0, 0);
}

document.getElementById('cancelEditBtn').addEventListener('click', function() {
  // Simplest reliable way to fully clear edit state and every field is a fresh load.
  window.location.reload();
});

/* ------------------------- POPULATE SEARCH / MERGE DROPDOWNS ------------------------- */

(function populateManageDropdowns() {
  const searchHouse = document.getElementById('searchHouse');
  const searchClass = document.getElementById('searchClass');
  const mergeHouse = document.getElementById('mergeHouse');
  const mergeCategory = document.getElementById('mergeCategory');
  HOUSES.forEach(function(h) {
    searchHouse.innerHTML += '<option value="' + h + '">' + h + '</option>';
    mergeHouse.innerHTML += '<option value="' + h + '">' + h + '</option>';
  });
  for (let c = 6; c <= 12; c++) searchClass.innerHTML += '<option value="' + c + '">' + c + '</option>';
  CATEGORIES.forEach(function(c) { mergeCategory.innerHTML += '<option value="' + c + '">' + c + '</option>'; });
})();

/* ------------------------- SUBMIT ------------------------- */

document.getElementById('profileForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const status = document.getElementById('status');
  const btn = document.getElementById('submitBtn');
  const form = e.target;

  if (!form.checkValidity()) { form.reportValidity(); return; }

  const data = {};
  new FormData(form).forEach(function(v, k) { if (k !== 'photo') data[k] = v; });
  data.caste = 'BHIL';
  data.casteCategory = 'ST';
  data.photoBase64 = photoBase64;

  if (!data.house || data.house.indexOf(' - ') === -1) {
    status.className = 'error';
    status.textContent = 'Please select a House.';
    return;
  }
  const parts = data.house.split(' - ');
  data.house = parts[0];
  data.category = parts[1];

  data.subjects = collectSubjectsData();

  btn.disabled = true;
  status.className = '';
  status.innerHTML = '<span class="spinner dark"></span>Saving...';

  // Retries a couple of times with a short backoff before giving up — a form this long
  // may sit open for many minutes while being filled in, and a mobile connection can
  // easily have hiccupped in that time. This makes the final submit noticeably more
  // resilient to a single transient network blip rather than failing outright.
  function submitWithRetry(attemptsLeft) {
    let writePromise;
    if (editingDocId) {
      data.timestamp = editingOriginalTimestamp || firebase.firestore.FieldValue.serverTimestamp();
      data.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      writePromise = db.collection('students').doc(editingDocId).set(data);
    } else {
      data.timestamp = firebase.firestore.FieldValue.serverTimestamp();
      writePromise = db.collection('students').add(data);
    }
    return writePromise.catch(function(err) {
      if (attemptsLeft <= 0) throw err;
      status.innerHTML = '<span class="spinner dark"></span>Connection hiccup, retrying...';
      return new Promise(function(resolve) { setTimeout(resolve, 1500); })
        .then(function() { return submitWithRetry(attemptsLeft - 1); });
    });
  }

  const wasEditing = !!editingDocId;
  submitWithRetry(2)
    .then(function() {
      status.className = 'ok';
      status.textContent = (wasEditing ? 'Updated successfully!' : 'Saved successfully!') + ' Starting a fresh form for the next student...';
      setTimeout(function() { window.location.reload(); }, 1500);
    })
    .catch(function(err) {
      btn.disabled = false;
      status.className = 'error';
      status.textContent = 'Error: ' + err.message + ' — please try ' + (wasEditing ? 'Update' : 'Submit') + ' again; your entered data is still filled in.';
    });
});

/* ------------------------- SEARCH ------------------------- */

document.getElementById('searchBtn').addEventListener('click', function() {
  const btn = this;
  const status = document.getElementById('searchStatus');
  const resultsList = document.getElementById('resultsList');
  const nameQuery = document.getElementById('searchName').value.trim().toUpperCase();
  const houseFilter = document.getElementById('searchHouse').value;
  const classFilter = document.getElementById('searchClass').value;
  const sectionFilter = document.getElementById('searchSection').value;

  btn.disabled = true;
  status.innerHTML = '<span class="spinner dark"></span>Searching...';
  resultsList.innerHTML = '';

  let query = db.collection('students');
  if (houseFilter) query = query.where('house', '==', houseFilter);
  if (classFilter) query = query.where('className', '==', classFilter);
  if (sectionFilter) query = query.where('section', '==', sectionFilter);

  query.get().then(function(snap) {
    btn.disabled = false;
    let results = [];
    snap.forEach(function(doc) { const d = doc.data(); d._id = doc.id; results.push(d); });
    if (nameQuery) results = results.filter(function(r) { return (r.fullName || '').toUpperCase().indexOf(nameQuery) !== -1; });
    results.sort(function(a, b) {
      const ta = a.timestamp && a.timestamp.seconds ? a.timestamp.seconds : 0;
      const tb = b.timestamp && b.timestamp.seconds ? b.timestamp.seconds : 0;
      return tb - ta;
    });

    if (!results.length) {
      status.textContent = '';
      resultsList.innerHTML = '<div class="emptyState">No matching students found.</div>';
      return;
    }
    status.textContent = results.length + ' student(s) found.';
    results.forEach(function(r) {
      const card = document.createElement('div');
      card.className = 'resultCard';
      card.innerHTML =
        '<div class="info">' +
          '<div class="name">' + r.fullName + '</div>' +
          '<div class="meta">Class ' + r.className + r.section + ' &middot; ' + r.house + ' - ' + r.category + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:6px;flex-shrink:0;">' +
          '<button type="button" class="secondary editBtn">Edit</button>' +
          '<button type="button" class="dlBtn">Download</button>' +
        '</div>';
      const dlBtn = card.querySelector('.dlBtn');
      dlBtn.addEventListener('click', function() {
        dlBtn.disabled = true;
        dlBtn.innerHTML = '<span class="spinner"></span>';
        generateStudentPdf(r).then(function(pdf) {
          dlBtn.disabled = false;
          dlBtn.textContent = 'Download';
          const filename = (r.fullName || 'Student').replace(/[^a-z0-9]/gi, '_') + '_' + r.className + r.section + '.pdf';
          pdf.save(filename);
        }).catch(function(err) {
          dlBtn.disabled = false;
          dlBtn.textContent = 'Download';
          alert('Error generating PDF: ' + err.message);
        });
      });
      const editBtn = card.querySelector('.editBtn');
      editBtn.addEventListener('click', function() {
        loadStudentIntoForm(r);
      });
      resultsList.appendChild(card);
    });
  }).catch(function(err) {
    btn.disabled = false;
    status.textContent = 'Error: ' + err.message;
  });
});

/* ------------------------- MERGE (Download All in a House) ------------------------- */

document.getElementById('mergeBtn').addEventListener('click', function() {
  const btn = this;
  const status = document.getElementById('mergeStatus');
  const house = document.getElementById('mergeHouse').value;
  const category = document.getElementById('mergeCategory').value;

  btn.disabled = true;
  status.innerHTML = '<span class="spinner dark"></span>Fetching students...';

  let query = db.collection('students').where('house', '==', house);
  if (category !== 'All') query = query.where('category', '==', category);

  query.get().then(function(snap) {
    const students = [];
    snap.forEach(function(doc) { students.push(doc.data()); });
    if (!students.length) {
      btn.disabled = false;
      status.textContent = 'No submitted students found for ' + house + ' / ' + category + '.';
      return;
    }
    let doc = null;
    let i = 0;
    function next() {
      if (i >= students.length) {
        btn.disabled = false;
        status.textContent = 'Merged ' + students.length + ' student(s).';
        doc.save(house + '_' + category.replace(/\s+/g, '') + '_Combined_' + students.length + 'students.pdf');
        return;
      }
      status.innerHTML = '<span class="spinner dark"></span>Rendering ' + (i + 1) + ' of ' + students.length + '...';
      renderStudentIntoDoc(doc, students[i], i > 0).then(function(d) {
        doc = d;
        i++;
        setTimeout(next, 10);
      }).catch(function(err) {
        btn.disabled = false;
        status.textContent = 'Error on student ' + (i + 1) + ': ' + err.message;
      });
    }
    next();
  }).catch(function(err) {
    btn.disabled = false;
    status.textContent = 'Error: ' + err.message;
  });
});

/* ============================================================================
   PDF RENDERING ENGINE — builds the same branded two-page layout as before,
   but rendered by the real browser (via html2canvas) into a jsPDF document.
   This is what finally gives us working watermark opacity and true Garamond.
   ========================================================================== */

function esc(v) {
  if (v === undefined || v === null) return '';
  const div = document.createElement('div');
  div.textContent = String(v);
  return div.innerHTML;
}

function row2(a, va, b, vb) {
  return '<tr><td class="pdfLbl">' + esc(a) + '</td><td class="pdfVal">' + esc(va) + '</td>' +
    '<td class="pdfLbl">' + esc(b || '') + '</td><td class="pdfVal">' + esc(vb || '') + '</td></tr>';
}

function fullRow(label, val) {
  return '<tr><td class="pdfLbl">' + esc(label) + '</td>' +
    '<td class="pdfVal" colspan="3"><div class="pdfWideBox">' + esc(val) + '</div></td></tr>';
}

function fieldRows(keys, d) {
  let html = '';
  for (let i = 0; i < keys.length; i += 2) {
    const k1 = keys[i], k2 = keys[i + 1];
    html += row2(FIELD_LABELS[k1], d[k1], k2 ? FIELD_LABELS[k2] : '', k2 ? d[k2] : '');
  }
  return html;
}

function buildSubjectsTableHtml(subjects) {
  subjects = subjects || { subjectNames: [], assessments: [] };
  let names = subjects.subjectNames || [];
  while (names.length < 7) names = names.concat(['']);
  names = names.slice(0, 7);
  const byKey = {};
  (subjects.assessments || []).forEach(function(a) { byKey[a.key] = a; });

  let html = '<table class="pdfResultsTable"><tr><th>Assessment</th><th>Max<br>Marks</th>';
  names.forEach(function(n) { html += '<th>' + esc(n) + '</th>'; });
  html += '</tr>';
  ASSESSMENT_ROWS.forEach(function(r) {
    const a = byKey[r[1]] || {};
    const marks = a.marks || [];
    html += '<tr><td class="pdfRowLbl">' + r[0] + '</td><td class="pdfMaxCol">' + esc(a.maxMarks) + '</td>';
    for (let i = 0; i < 7; i++) html += '<td>' + esc(marks[i]) + '</td>';
    html += '</tr>';
  });
  html += '</table>';
  return html;
}

// One continuous flowing document (no artificial page split) — a "band" of watermark
// divs is pre-placed at regular intervals so whichever physical pages this content ends
// up sliced into (see renderStudentIntoDoc below), each one has a watermark on it.
const PAGE_HEIGHT_CSS_PX = 1123; // A4 height at the same 96dpi scale as the 794px-wide container
const MAX_EXPECTED_PAGES = 5;

function buildWatermarkBands() {
  let html = '';
  for (let i = 0; i < MAX_EXPECTED_PAGES; i++) {
    const top = i * PAGE_HEIGHT_CSS_PX + (PAGE_HEIGHT_CSS_PX - 460) / 2;
    html += '<div class="pdfWatermarkBand" style="top:' + top + 'px;background-image:url(' + EMRS_LOGO_BASE64 + ');"></div>';
  }
  return html;
}

function buildFullStudentHtml(d, photoDataUrl) {
  let html = buildWatermarkBands();
  html += '<div class="pdfContent">';
  html += '<table class="pdfHeaderTable"><tr>';
  html += '<td class="pdfHLogo"><img src="' + EMRS_LOGO_BASE64 + '"></td>';
  html += '<td class="pdfHCenter"><div class="pdfSchoolName">EKLAVYA MODEL RESIDENTIAL SCHOOL, BANSLA-BAGIDORA</div>' +
    '<div class="pdfFormTitle">STUDENT PROFILE</div></td>';
  html += '<td class="pdfHPhoto"><div class="pdfPhotoBox">' + (photoDataUrl ? '<img src="' + photoDataUrl + '">' : 'Photo') + '</div></td>';
  html += '</tr></table>';

  html += '<table class="pdfTopInfo">';
  html += row2('Name', d.fullName, 'Class', d.className);
  html += row2('Section', d.section, 'House', d.house);
  html += row2('Category (Hostel)', d.category, 'Date of Birth', d.dob);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Contact Information</div><table class="pdfFieldTable">';
  html += fieldRows(['gender','email','distanceFromSchool','aadhaarNo','phone1','phone2','phone3',
    'fatherName','motherName','fatherAadhaar','motherAadhaar'], d);
  html += fullRow('Address', d.address);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Personal Information</div><table class="pdfFieldTable">';
  html += fieldRows(['caste','casteCategory','bloodGroup','religion','age','satsNo','penNo',
    'nearestRelative','nearestRelativeMobile'], d);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Family Information</div><table class="pdfFieldTable">';
  html += fieldRows(['parentsEmployer','fatherOccupation','motherOccupation','singleParentChild',
    'guardianParent','guardianMobile','guardianOccupation','guardianEducation','workingFamilyMembers'], d);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Health Information</div><table class="pdfFieldTable">';
  html += fieldRows(['medicalConditions','allergies','specialNeeds','parentsLivingStatus','guardianName',
    'medications','annualFamilyIncome','primaryLanguage'], d);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Family Background</div><table class="pdfFieldTable">';
  html += fieldRows(['familyType','siblingsSister','siblingsBrother','fatherEducation','motherEducation',
    'emergencyContact','height','weight','mbs','chest'], d);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Academic Information</div><table class="pdfFieldTable">';
  html += fieldRows(['otherRelevantInfo','specialEducationalNeeds','strengths','areasOfImprovement',
    'previousClass','lastYearResult','previousSchool','academicAchievements'], d);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Additional Information (By HM or CT)</div><table class="pdfFieldTable">';
  html += row2('Hobbies/Interests', d.hobbies, 'Learning Difficulties (Previous)', d.learningDifficulties);
  html += '</table>';

  html += '<div class="pdfSectionTitle">Current Year Results</div>';
  html += buildSubjectsTableHtml(d.subjects);

  html += '<div class="pdfSectionTitle">Comments</div><table class="pdfFieldTable">';
  html += row2("Teacher's Comments", d.teacherComments, "House Master's Comments", d.houseMasterComments);
  html += '</table>';

  html += '<div class="pdfSigRow">' +
    '<div class="pdfSigBox"><div class="pdfSigLine">&nbsp;</div>Student Signature</div>' +
    '<div class="pdfSigBox"><div class="pdfSigLine">&nbsp;</div>Guardian/Parent Signature</div>' +
    '<div class="pdfSigBox"><div class="pdfSigLine">&nbsp;</div>H.M. Signature</div>' +
    '<div class="pdfSigBox"><div class="pdfSigLine">&nbsp;</div>Principal Signature</div>' +
    '</div>';

  html += '</div>'; // .pdfContent
  return html;
}

// A scaled override stylesheet for the hidden PDF template. Rather than resizing the
// final image (which would distort text), this actually shrinks font sizes and spacing
// and lets the content genuinely reflow smaller — the only way to fit more real content
// into the same physical page size without anything looking stretched or squashed.
function pdfScaledStyleTag(scale) {
  const px = function(base) { return Math.round(base * scale * 10) / 10; };
  return '<style>' +
    '.pdfFlow{font-size:' + px(14.5) + 'px;padding:' + px(24) + 'px ' + px(32) + 'px;}' +
    '.pdfSchoolName{font-size:' + px(16.5) + 'px;}' +
    '.pdfFormTitle{font-size:' + px(14) + 'px;}' +
    '.pdfHeaderTable{margin-bottom:' + px(16) + 'px;}' +
    'table.pdfTopInfo td, table.pdfFieldTable td{padding:' + px(5) + 'px ' + px(9) + 'px;font-size:' + px(14.5) + 'px;}' +
    '.pdfWideBox{min-height:' + px(42) + 'px;}' +
    '.pdfSectionTitle{font-size:' + px(14) + 'px;padding:' + px(5) + 'px ' + px(11) + 'px;margin-top:' + px(11) + 'px;margin-bottom:' + px(6) + 'px;}' +
    'table.pdfResultsTable th{padding:' + px(6) + 'px ' + px(2) + 'px;font-size:' + px(13) + 'px;}' +
    'table.pdfResultsTable td{padding:' + px(4) + 'px;font-size:' + px(12.5) + 'px;}' +
    '.pdfSigRow{margin-top:' + px(34) + 'px;font-size:' + px(13.5) + 'px;}' +
    '.pdfSigLine{height:' + px(36) + 'px;margin-bottom:' + px(6) + 'px;}' +
    '</style>';
}

function renderFullCanvas(data, scale) {
  return new Promise(function(resolve, reject) {
    const root = document.getElementById('pdfRoot');
    root.innerHTML = pdfScaledStyleTag(scale) +
      '<div class="pdfFlow" id="pdfFlowEl">' + buildFullStudentHtml(data, data.photoBase64 || '') + '</div>';
    setTimeout(function() {
      html2canvas(document.getElementById('pdfFlowEl'), { scale: 2, useCORS: true }).then(resolve).catch(reject);
    }, 60);
  });
}

// Renders one student into the given jsPDF doc, fit to exactly 2 A4 pages whenever
// possible — in BOTH directions:
//   - If content is too long, it's re-rendered smaller (real reflow, not an image
//     resize) until it fits within 2 pages, tried a few times.
//   - If content is short enough to leave a large blank gap at the bottom of page 2
//     (more than ~1/4 of the page), it's re-rendered LARGER instead, so it fills most
//     of page 2 with only a small, natural-looking gap left (roughly 1/5 of a page).
// Growing is capped at a sensible maximum so very sparse content doesn't get blown up
// to an unnaturally huge size. If content doesn't fit within 2 pages even at the
// smallest readable size, it's allowed to spill onto a 3rd page rather than silently
// cutting off real data.
// Pass doc=null to create a new one. Pass isNotFirstStudent=true when appending another
// student to an existing merged PDF.
const PDF_MARGIN_MM = 10;
const TARGET_PAGES = 2;
const MIN_SCALE = 0.55;
const MAX_SCALE = 1.4;
const GROW_IF_BELOW = 1.75;   // natural pages below this would leave >25% of page 2 blank
const GROW_TARGET = 1.82;     // aim to fill up to here (~18% blank — within the 1/5-1/4 range)

async function renderStudentIntoDoc(doc, data, isNotFirstStudent) {
  const isVeryFirstPage = !doc;
  if (!doc) doc = new jspdf.jsPDF({ unit: 'mm', format: 'a4' });

  let scale = 1;
  let bigCanvas = await renderFullCanvas(data, scale);
  let pageHeightPx = bigCanvas.width * (297 / 210);
  let pagesNeeded = bigCanvas.height / pageHeightPx;

  let attempts = 0;
  if (pagesNeeded > TARGET_PAGES + 0.02) {
    // Too long — shrink until it fits within 2 pages.
    while (pagesNeeded > TARGET_PAGES + 0.02 && scale > MIN_SCALE && attempts < 3) {
      scale = Math.max(MIN_SCALE, scale * (TARGET_PAGES / pagesNeeded) * 0.97);
      bigCanvas = await renderFullCanvas(data, scale);
      pageHeightPx = bigCanvas.width * (297 / 210);
      pagesNeeded = bigCanvas.height / pageHeightPx;
      attempts++;
    }
  } else if (pagesNeeded < GROW_IF_BELOW) {
    // Too short — grow so page 2 doesn't end up mostly empty.
    while (pagesNeeded < GROW_IF_BELOW && scale < MAX_SCALE && attempts < 3) {
      scale = Math.min(MAX_SCALE, scale * (GROW_TARGET / pagesNeeded) * 1.0);
      bigCanvas = await renderFullCanvas(data, scale);
      pageHeightPx = bigCanvas.width * (297 / 210);
      pagesNeeded = bigCanvas.height / pageHeightPx;
      attempts++;
      // Don't let growing accidentally push it over 2 pages — back off one step if so.
      if (pagesNeeded > TARGET_PAGES + 0.02) {
        scale = scale * 0.94;
        bigCanvas = await renderFullCanvas(data, scale);
        pageHeightPx = bigCanvas.width * (297 / 210);
        pagesNeeded = bigCanvas.height / pageHeightPx;
        break;
      }
    }
  }

  const numPages = Math.max(1, Math.ceil(pagesNeeded - 0.02));

  // Fit each full-page-aspect slice inside a margin-inset box, preserving aspect ratio
  // (so nothing looks stretched/squashed), centered within the page.
  const boxW = 210 - 2 * PDF_MARGIN_MM, boxH = 297 - 2 * PDF_MARGIN_MM;
  let renderW = boxW, renderH = boxW * (297 / 210);
  if (renderH > boxH) { renderH = boxH; renderW = boxH * (210 / 297); }
  const xOffset = (210 - renderW) / 2, yOffset = (297 - renderH) / 2;

  for (let p = 0; p < numPages; p++) {
    if (!(isVeryFirstPage && p === 0)) doc.addPage();
    const sliceH = Math.min(pageHeightPx, bigCanvas.height - p * pageHeightPx);
    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = bigCanvas.width;
    sliceCanvas.height = pageHeightPx;
    const ctx = sliceCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
    ctx.drawImage(bigCanvas, 0, p * pageHeightPx, bigCanvas.width, sliceH, 0, 0, bigCanvas.width, sliceH);
    const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92);
    doc.addImage(imgData, 'JPEG', xOffset, yOffset, renderW, renderH);
  }
  return doc;
}

// Generates a single student's PDF (for the Manage-tab Download button).
async function generateStudentPdf(data) {
  return renderStudentIntoDoc(null, data, false);
}

