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
  data.timestamp = firebase.firestore.FieldValue.serverTimestamp();

  btn.disabled = true;
  status.className = '';
  status.innerHTML = '<span class="spinner dark"></span>Saving...';

  // Retries a couple of times with a short backoff before giving up — a form this long
  // may sit open for many minutes while being filled in, and a mobile connection can
  // easily have hiccupped in that time. This makes the final submit noticeably more
  // resilient to a single transient network blip rather than failing outright.
  function submitWithRetry(attemptsLeft) {
    return db.collection('students').add(data).catch(function(err) {
      if (attemptsLeft <= 0) throw err;
      status.innerHTML = '<span class="spinner dark"></span>Connection hiccup, retrying...';
      return new Promise(function(resolve) { setTimeout(resolve, 1500); })
        .then(function() { return submitWithRetry(attemptsLeft - 1); });
    });
  }

  submitWithRetry(2)
    .then(function() {
      status.className = 'ok';
      status.textContent = 'Saved successfully! Starting a fresh form for the next student...';
      setTimeout(function() { window.location.reload(); }, 1500);
    })
    .catch(function(err) {
      btn.disabled = false;
      status.className = 'error';
      status.textContent = 'Error: ' + err.message + ' — please try Submit again; your entered data is still filled in.';
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
          '<div class="meta">Class ' + r.className + r.section + ' &middot; ' + r.house + ' - ' + r.category + '</div>'
