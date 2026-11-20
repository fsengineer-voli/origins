import { COUNTRIES, BY_ISO, PINNED_ISO, flag } from '../data/countries';

(function () {
  // ---- Config -------------------------------------------------------------
  var form = document.getElementById('reg-form');
  var workerMeta = document.querySelector('meta[name="worker-url"]');
  var WORKER_URL = (form && form.getAttribute('action')) || (workerMeta && workerMeta.content) || '/submit';
  var COHORT_ID = 'mar-2027';
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Hero video: hide the still poster once the video plays; respect reduced motion.
  var v = document.getElementById('hero-video'), poster = document.querySelector('.hero .poster');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (v && poster) {
    v.addEventListener('playing', function () { poster.hidden = true; });
    if (reduce) { v.pause(); v.removeAttribute('autoplay'); }
  }

  // Countdown to 09:00 WAT, March 19, 2027
  var target = Date.UTC(2027, 2, 19, 8, 0, 0);
  function tick() {
    var ms = Math.max(0, target - Date.now());
    var m = Math.floor(ms / 60000);
    var dEl = document.getElementById('cd-d');
    var hEl = document.getElementById('cd-h');
    var mEl = document.getElementById('cd-m');
    if (dEl) dEl.textContent = Math.floor(m / 1440);
    if (hEl) hEl.textContent = String(Math.floor((m % 1440) / 60)).padStart(2, '0');
    if (mEl) mEl.textContent = String(m % 60).padStart(2, '0');
  }
  tick();
  setInterval(tick, 30000);

  // ---- Tickets & pricing --------------------------------------------------
  var P = { inperson: { NGN: 800000, USD: 600, label: 'In-person' }, online: { NGN: 700000, USD: 500, label: 'Online' } };
  var state = { cur: 'NGN', ticket: 'inperson', formats: ['inperson'] };

  function fmt(n) { return (state.cur === 'NGN' ? '₦' : '$') + Math.round(n).toLocaleString('en-US'); }
  function sum(fs) { return fs.reduce(function (a, f) { return a + P[f][state.cur]; }, 0); }
  function comboLabel(fs) { if (fs[0] === fs[1]) return fs[0] === 'inperson' ? 'Both in-person' : 'Both online'; return 'One in-person, one online'; }

  function renderPrices() {
    document.querySelectorAll('[data-price]').forEach(function (el) { el.textContent = fmt(P[el.dataset.price][state.cur]); });
    document.querySelectorAll('[data-combo]').forEach(function (el) { el.textContent = fmt(sum(el.dataset.combo.split(',')) * 0.9); });
    var comboRadio = document.querySelector('input[name="combo"]:checked');
    if (comboRadio) {
      var c = comboRadio.value.split(',');
      var wasEl = document.getElementById('bundle-was');
      var amtEl = document.getElementById('bundle-amt');
      if (wasEl) wasEl.textContent = fmt(sum(c));
      if (amtEl) amtEl.textContent = fmt(sum(c) * 0.9);
    }
    document.querySelectorAll('[data-cur]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cur === state.cur); });
    document.querySelectorAll('.tk[data-card]').forEach(function (t) { t.classList.toggle('selected', t.dataset.card === state.ticket); });
  }

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  // ---- Country Picker ----------------------------------------------------
  function setCC(el, iso) {
    var c = BY_ISO[iso]; if (!c) return;
    var inp = el.querySelector('input[name=cc]');
    if (inp) inp.value = iso;
    var b = el.querySelector('.cc-btn');
    if (b) {
      var fl = b.querySelector('.fl');
      var code = b.querySelector('.code');
      if (fl) fl.textContent = flag(iso);
      if (code) code.textContent = c.dial;
      b.setAttribute('aria-label', 'Country code, ' + c.name + ' ' + c.dial);
    }
  }

  function initCC(el) {
    var btn = el.querySelector('.cc-btn'), pop = el.querySelector('.cc-pop');
    if (!btn || !pop) return;
    var q = pop.querySelector('input'), ul = pop.querySelector('ul');

    function list(term) {
      term = (term || '').trim().toLowerCase().replace(/^\+/, '');
      var curInp = el.querySelector('input[name=cc]');
      var cur = curInp ? curInp.value : 'NG';
      var rows = term
        ? COUNTRIES.filter(function (c) { return c.name.toLowerCase().indexOf(term) > -1 || c.dial.slice(1).indexOf(term) === 0 || c.iso.toLowerCase() === term; })
            .sort(function (a, b) { return (PINNED_ISO.indexOf(a.iso) < 0 ? 99 : PINNED_ISO.indexOf(a.iso)) - (PINNED_ISO.indexOf(b.iso) < 0 ? 99 : PINNED_ISO.indexOf(b.iso)); })
        : PINNED_ISO.map(function (i) { return BY_ISO[i]; }).concat(COUNTRIES.filter(function (c) { return PINNED_ISO.indexOf(c.iso) < 0; }));

      ul.innerHTML = rows.length
        ? rows.map(function (c) {
            return '<li><button type="button" role="option" data-iso="' + c.iso + '" aria-selected="' + (c.iso === cur) + '"><span class="fl">' + flag(c.iso) + '</span><span>' + esc(c.name) + '</span><span class="dc">' + c.dial + '</span></button></li>';
          }).join('')
        : '<li class="none">No matching country</li>';
    }

    function open() { list(''); pop.hidden = false; btn.setAttribute('aria-expanded', 'true'); q.value = ''; q.focus(); }
    function close(f) { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); if (f) btn.focus(); }

    btn.addEventListener('click', function () { pop.hidden ? open() : close(); });
    q.addEventListener('input', function () { list(q.value); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); var f = ul.querySelector('button'); if (f) f.click(); }
      if (e.key === 'ArrowDown') { e.preventDefault(); var f2 = ul.querySelector('button'); if (f2) f2.focus(); }
    });
    ul.addEventListener('keydown', function (e) {
      var b = document.activeElement;
      if (!b || b.tagName !== 'BUTTON') return;
      var li = b.parentElement;
      if (e.key === 'ArrowDown' && li.nextElementSibling) { e.preventDefault(); li.nextElementSibling.querySelector('button').focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); li.previousElementSibling ? li.previousElementSibling.querySelector('button').focus() : q.focus(); }
    });
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-iso]');
      if (!b) return;
      setCC(el, b.dataset.iso);
      el.dataset.touched = '1';
      close(true);
      validate(false);
    });
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) { e.stopPropagation(); close(true); }
    });
    document.addEventListener('click', function (e) {
      if (!el.contains(e.target) && !pop.hidden) close();
    });
  }

  // Initialize country pickers
  document.querySelectorAll('[data-cc]').forEach(initCC);

  // ---- Form Management (Astro Form DOM) -----------------------------------
  var attendee1Fs = document.getElementById('attendee-fieldset-0');
  var attendee2Fs = document.getElementById('attendee-fieldset-1');

  function updateFormState() {
    var isBundle = state.ticket === 'bundle';

    if (attendee1Fs) {
      var leg1 = attendee1Fs.querySelector('legend');
      if (leg1) leg1.textContent = isBundle ? 'Attendee 1' : 'Your details';
      var ip1 = document.getElementById('a1-ip');
      var on1 = document.getElementById('a1-on');
      if (state.formats[0] === 'online') {
        if (on1) on1.checked = true;
      } else {
        if (ip1) ip1.checked = true;
      }
    }

    if (attendee2Fs) {
      attendee2Fs.hidden = !isBundle;
      if (isBundle) {
        var ip2 = document.getElementById('a2-ip');
        var on2 = document.getElementById('a2-on');
        if (state.formats[1] === 'online') {
          if (on2) on2.checked = true;
        } else {
          if (ip2) ip2.checked = true;
        }
      }
    }
  }

  // Country select auto-updates country code
  document.querySelectorAll('[data-country]').forEach(function (s) {
    s.addEventListener('change', function () {
      var cc = s.closest('fieldset').querySelector('[data-cc]');
      if (cc && !cc.dataset.touched) setCC(cc, s.value);
    });
  });

  // Occupation dropdown toggles Employment Level
  document.querySelectorAll('[data-occ]').forEach(function (s) {
    s.addEventListener('change', function () {
      var levelField = s.closest('.fields').querySelector('[data-level]');
      var isEmp = s.value === 'Employed';
      if (levelField) {
        levelField.hidden = !isEmp;
        var levelSelect = levelField.querySelector('select');
        if (!isEmp && levelSelect) {
          clearFieldError(levelSelect);
          levelSelect.value = '';
        }
      }
    });
  });

  // Radio button change inside attendee fieldsets
  document.querySelectorAll('.attendee-fs input[type=radio]').forEach(function (r) {
    r.addEventListener('change', function () {
      var fs = r.closest('fieldset');
      var idx = fs ? +fs.dataset.attendee : 0;
      state.formats[idx] = r.value === 'online' ? 'online' : 'inperson';
      if (state.ticket === 'bundle') {
        var key = state.formats.slice().sort().join(',');
        var map = { 'inperson,inperson': 'combo-ii', 'online,online': 'combo-oo', 'inperson,online': 'combo-io' };
        var targetRadio = document.getElementById(map[key]);
        if (targetRadio) targetRadio.checked = true;
      } else {
        state.ticket = r.value;
      }
      renderPrices();
      renderSummary();
      validate(false);
    });
  });

  function renderSummary() {
    var lines = state.formats.map(function (f, i) {
      return '<div class="row"><span>' + (state.ticket === 'bundle' ? 'Attendee ' + (i + 1) + ' · ' : '') + P[f].label + '</span><span>' + fmt(P[f][state.cur]) + '</span></div>';
    });
    var isB = state.ticket === 'bundle';
    if (isB) lines.unshift('<div class="row"><span>2-in-1 Bundle</span><span>' + comboLabel(state.formats) + '</span></div>');
    var sLines = document.getElementById('s-lines');
    if (sLines) sLines.innerHTML = lines.join('');
    var s = sum(state.formats), d = isB ? s * 0.1 : 0;
    var discRow = document.getElementById('s-disc-row');
    var sDisc = document.getElementById('s-disc');
    var sTotal = document.getElementById('s-total');
    if (discRow) discRow.hidden = !isB;
    if (sDisc) sDisc.textContent = '−' + fmt(d);
    if (sTotal) sTotal.textContent = fmt(s - d);
  }

  function select(t) {
    state.ticket = t;
    if (t === 'bundle') {
      var checkedCombo = document.querySelector('input[name="combo"]:checked');
      state.formats = checkedCombo ? checkedCombo.value.split(',') : ['inperson', 'inperson'];
    } else {
      state.formats = [t];
    }
    renderPrices();
    updateFormState();
    renderSummary();
    validate(false);
  }

  // ---- Live Validation Engine ---------------------------------------------
  function getOrCreateErrorEl(inputEl) {
    var field = inputEl.closest('.field');
    if (!field) return null;
    var errEl = field.querySelector('.field-err');
    if (!errEl) {
      errEl = document.createElement('span');
      errEl.className = 'field-err';
      errEl.setAttribute('role', 'alert');
      errEl.hidden = true;
      field.appendChild(errEl);
    }
    return errEl;
  }

  function setFieldError(inputEl, msg) {
    inputEl.classList.add('invalid');
    inputEl.setAttribute('aria-invalid', 'true');
    var err = getOrCreateErrorEl(inputEl);
    if (err) {
      err.textContent = msg;
      err.hidden = false;
    }
  }

  function clearFieldError(inputEl) {
    inputEl.classList.remove('invalid');
    inputEl.removeAttribute('aria-invalid');
    var field = inputEl.closest('.field');
    if (field) {
      var err = field.querySelector('.field-err');
      if (err) {
        err.textContent = '';
        err.hidden = true;
      }
    }
  }

  function validateField(inputEl, forceShow) {
    if (!inputEl || !inputEl.name) return true;
    var name = inputEl.name;
    var val = (inputEl.value || '').trim();
    var fs = inputEl.closest('fieldset');
    var isTouched = forceShow || inputEl.dataset.touched === '1';
    var err = '';

    if (name === 'first') {
      if (!val) err = 'First name is required.';
    } else if (name === 'last') {
      if (!val) err = 'Last name is required.';
    } else if (name === 'email') {
      if (!val) {
        err = 'Email address is required.';
      } else if (!EMAIL_RE.test(val)) {
        err = 'Please enter a valid email address (e.g. name@example.com).';
      }
    } else if (name === 'phone') {
      var digits = val.replace(/\D/g, '');
      if (!val) {
        err = 'Phone number is required.';
      } else if (digits.length < 6) {
        err = 'Please enter a valid phone number (at least 6 digits).';
      }
    } else if (name === 'gender') {
      if (!val) err = 'Please select your gender.';
    } else if (name === 'occupation') {
      if (!val) err = 'Please select your current status.';
    } else if (name === 'level') {
      var occEl = fs ? fs.querySelector('[name="occupation"]') : null;
      if (occEl && occEl.value === 'Employed' && !val) {
        err = 'Please select your employment level.';
      }
    } else if (name === 'city') {
      if (!val) err = 'City is required.';
    } else if (name === 'country') {
      if (!val) err = 'Please select your country.';
    } else if (name === 'source') {
      if (!val) err = 'Please select how you heard about us.';
    }

    if (err) {
      if (isTouched) setFieldError(inputEl, err);
      return false;
    } else {
      clearFieldError(inputEl);
      return true;
    }
  }

  var emailDebounceTimers = {};
  function handleEmailInput(inputEl) {
    var id = inputEl.id || inputEl.name;
    if (emailDebounceTimers[id]) clearTimeout(emailDebounceTimers[id]);
    var val = (inputEl.value || '').trim();
    if (inputEl.dataset.touched === '1') {
      validateField(inputEl, true);
    } else if (val.indexOf('@') > -1 && val.length > 5) {
      emailDebounceTimers[id] = setTimeout(function () {
        inputEl.dataset.touched = '1';
        validateField(inputEl, true);
      }, 500);
    }
  }

  function validate(forceShow) {
    var ok = true;
    // Only validate visible fieldsets
    var visibleFieldsets = document.querySelectorAll('#attendees fieldset:not([hidden])');
    if (!visibleFieldsets.length) ok = false;

    visibleFieldsets.forEach(function (fs) {
      var occEl = fs.querySelector('[name="occupation"]');
      var isEmp = occEl && occEl.value === 'Employed';

      var fieldsToValidate = ['first', 'last', 'email', 'phone', 'gender', 'occupation', 'city', 'country'];
      if (isEmp) fieldsToValidate.push('level');

      fieldsToValidate.forEach(function (n) {
        var el = fs.querySelector('[name="' + n + '"]');
        if (el) {
          var valid = validateField(el, forceShow);
          if (!valid) ok = false;
        }
      });
    });

    var sourceEl = document.getElementById('f-source');
    if (sourceEl) {
      var sourceValid = validateField(sourceEl, forceShow);
      if (!sourceValid) ok = false;
    }

    var hint = document.getElementById('hint');
    if (hint) {
      hint.textContent = ok
        ? 'Ready. We’ll show your bank transfer details next.'
        : 'Complete all required fields to continue.';
    }
    return ok;
  }

  // ---- Payload & Submission -----------------------------------------------
  function collect(i) {
    var fs = document.getElementById('attendee-fieldset-' + i);
    if (!fs) return null;
    function v(n) { var el = fs.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ''; }
    var occ = v('occupation');
    var countrySel = fs.querySelector('[name="country"]');
    var sourceEl = document.getElementById('f-source');
    var checkedRadio = fs.querySelector('input[type=radio]:checked');
    return {
      firstName: v('first'),
      lastName: v('last'),
      email: v('email'),
      phone: v('phone'),
      phoneCountryCode: (BY_ISO[v('cc')] || {}).dial || '',
      gender: v('gender'),
      occupation: occ,
      employmentLevel: occ === 'Employed' ? v('level') : '',
      company: v('company'),
      role: v('role'),
      city: v('city'),
      country: (BY_ISO[countrySel ? countrySel.value : ''] || {}).name || (countrySel ? countrySel.value : ''),
      attendanceType: checkedRadio && checkedRadio.value === 'online' ? 'virtual' : 'in-person',
      source: sourceEl ? sourceEl.value : '',
      currency: state.cur,
      bundle: state.ticket === 'bundle',
      cohortId: COHORT_ID
    };
  }

  async function submitRegistration() {
    var btn = document.getElementById('pay-btn'), err = document.getElementById('err');
    var results = [];
    if (err) err.hidden = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

    var count = state.ticket === 'bundle' ? 2 : 1;
    var submitUrl = (form && form.getAttribute('action')) || WORKER_URL;

    try {
      for (var i = 0; i < count; i++) {
        var payload = collect(i);
        var res = await fetch(submitUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var body = await res.json().catch(function () { return {}; });
        if (!res.ok || !body.success) throw new Error(body.message || 'Something went wrong. Please try again.');
        results.push(body);
      }
      showSuccess(results);
    } catch (e) {
      var msg = e.message || 'Something went wrong. Please try again.';
      if (results.length) {
        msg = 'Attendee ' + (results.length + 1) + ' could not be registered: ' + msg + ' Already registered: ' + results.map(function (r) { return r.reference; }).join(', ') + '. Please email info@sonderplace.com with these references.';
      }
      if (err) { err.textContent = msg; err.hidden = false; }
      if (btn) { btn.disabled = false; btn.textContent = 'Continue to checkout'; }
      validate(false);
    }
  }

  function showSuccess(results) {
    var box = document.getElementById('success');
    if (!box) return;
    box.textContent = '';
    var h = document.createElement('h3'); h.textContent = 'Registration received';
    var p = document.createElement('p');
    p.textContent = 'We have emailed your payment details. Complete your bank transfer quoting the reference below to secure your place.';
    box.appendChild(h); box.appendChild(p);

    results.forEach(function (r) {
      var line = document.createElement('p'); line.className = 'ref';
      line.textContent = 'Reference: ' + r.reference + ' · Amount: ' + r.totalLabel;
      box.appendChild(line);
    });

    if (results[0] && results[0].bankDetails) {
      var bank = results[0].bankDetails;
      if (bank.accounts) {
        bank.accounts.forEach(function (a) {
          var wrap = document.createElement('div'); wrap.className = 'acct';
          var title = document.createElement('b'); title.textContent = a.label;
          var dl = document.createElement('dl');
          [['Account name', a.accountName], ['Account number', a.accountNumber], ['Bank', a.bankName && a.bankName.trim()], ['Routing number', a.routingNumber], ['Email', a.email]]
            .forEach(function (kv) {
              if (!kv[1]) return;
              var dt = document.createElement('dt'); dt.textContent = kv[0];
              var dd = document.createElement('dd'); dd.textContent = kv[1];
              dl.appendChild(dt); dl.appendChild(dd);
            });
          wrap.appendChild(title); wrap.appendChild(dl);
          box.appendChild(wrap);
        });
      }
    }

    var note = document.createElement('p');
    note.textContent = 'Please send proof of payment to info@sonderplace.com.';
    box.appendChild(note);

    var regGrid = document.querySelector('#register .reg-grid');
    if (regGrid) regGrid.hidden = true;
    box.hidden = false;
    box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  // ---- Wiring -------------------------------------------------------------
  document.querySelectorAll('[data-cur]').forEach(function (b) {
    b.addEventListener('click', function () { state.cur = b.dataset.cur; renderPrices(); renderSummary(); });
  });

  document.querySelectorAll('input[name="combo"]').forEach(function (r) {
    r.addEventListener('change', function () {
      renderPrices();
      if (state.ticket === 'bundle') select('bundle');
    });
  });

  document.querySelectorAll('[data-select]').forEach(function (b) {
    b.addEventListener('click', function () {
      select(b.dataset.select);
      var regSec = document.getElementById('register');
      if (regSec) regSec.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  if (form) {
    // Blur on any input/select marks it touched and triggers live validation
    form.addEventListener('blur', function (e) {
      var el = e.target;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'SELECT') && el.name) {
        el.dataset.touched = '1';
        validateField(el, true);
        validate(false);
      }
    }, true);

    // Live input validation
    form.addEventListener('input', function (e) {
      var el = e.target;
      if (el && el.name === 'email') {
        handleEmailInput(el);
      } else if (el && el.dataset.touched === '1') {
        validateField(el, true);
      }
      validate(false);
    });

    // Change events (selects and radios)
    form.addEventListener('change', function (e) {
      var el = e.target;
      if (el && (el.tagName === 'SELECT' || el.type === 'radio')) {
        el.dataset.touched = '1';
        validateField(el, true);
      }
      validate(false);
    });

    // Form submit
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = validate(true);
      if (!ok) {
        var firstInvalid = form.querySelector('.invalid, [aria-invalid="true"]');
        if (firstInvalid) {
          firstInvalid.focus();
          firstInvalid.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        }
        return;
      }
      submitRegistration();
    });
  }

  select('inperson');
})();
