(function(){
  // ---- Config -------------------------------------------------------------
  // Replace with the deployed Worker URL. Cohort must match a key in origins.ts.
  var workerMeta=document.querySelector('meta[name="worker-url"]');
  var WORKER_URL=(workerMeta && workerMeta.content) || '/submit';
  var COHORT_ID='mar-2027';
  var EMAIL_RE=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Hero video: hide the still poster once the video plays; respect reduced motion.
  var v=document.getElementById('hero-video'), poster=document.querySelector('.hero .poster');
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  v.addEventListener('playing',function(){poster.hidden=true;});
  if(reduce){v.pause();v.removeAttribute('autoplay');}

  // Countdown to 09:00 WAT, March 19, 2027
  var target=Date.UTC(2027,2,19,8,0,0);
  function tick(){var ms=Math.max(0,target-Date.now());var m=Math.floor(ms/60000);
    document.getElementById('cd-d').textContent=Math.floor(m/1440);
    document.getElementById('cd-h').textContent=String(Math.floor(m%1440/60)).padStart(2,'0');
    document.getElementById('cd-m').textContent=String(m%60).padStart(2,'0');}
  tick(); setInterval(tick,30000);

  // ---- Tickets & pricing --------------------------------------------------
  var P={inperson:{NGN:800000,USD:600,label:'In-person'},online:{NGN:700000,USD:500,label:'Online'}};
  var state={cur:'NGN',ticket:'inperson',formats:['inperson']};
  var attendeeData=[{},{}];
  function fmt(n){return (state.cur==='NGN'?'₦':'$')+Math.round(n).toLocaleString('en-US');}
  function sum(fs){return fs.reduce(function(a,f){return a+P[f][state.cur];},0);}
  function comboLabel(fs){if(fs[0]===fs[1])return fs[0]==='inperson'?'Both in-person':'Both online';return 'One in-person, one online';}

  function renderPrices(){
    document.querySelectorAll('[data-price]').forEach(function(el){el.textContent=fmt(P[el.dataset.price][state.cur]);});
    document.querySelectorAll('[data-combo]').forEach(function(el){el.textContent=fmt(sum(el.dataset.combo.split(','))*0.9);});
    var c=document.querySelector('input[name="combo"]:checked').value.split(',');
    document.getElementById('bundle-was').textContent=fmt(sum(c));
    document.getElementById('bundle-amt').textContent=fmt(sum(c)*0.9);
    document.querySelectorAll('[data-cur]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.cur===state.cur);});
    document.querySelectorAll('.tk[data-card]').forEach(function(t){t.classList.toggle('selected',t.dataset.card===state.ticket);});
  }

  // ---- Attendee form ------------------------------------------------------
  function saveAttendees(){
    document.querySelectorAll('#attendees fieldset').forEach(function(fs,i){
      fs.querySelectorAll('input,select').forEach(function(el){if(!el.name)return;if(el.type==='radio'){if(el.checked)attendeeData[i].attend=el.value;}else attendeeData[i][el.name]=el.value;});
      var cc=fs.querySelector('[data-cc]');if(cc&&cc.dataset.touched)attendeeData[i].ccTouched=true;
    });
  }

  // Countries: name|ISO|dial code
  var RAW="Afghanistan|AF|93;Åland Islands|AX|358;Albania|AL|355;Algeria|DZ|213;American Samoa|AS|1684;Andorra|AD|376;Angola|AO|244;Anguilla|AI|1264;Antigua and Barbuda|AG|1268;Argentina|AR|54;Armenia|AM|374;Aruba|AW|297;Australia|AU|61;Austria|AT|43;Azerbaijan|AZ|994;Bahamas|BS|1242;Bahrain|BH|973;Bangladesh|BD|880;Barbados|BB|1246;Belarus|BY|375;Belgium|BE|32;Belize|BZ|501;Benin|BJ|229;Bermuda|BM|1441;Bhutan|BT|975;Bolivia|BO|591;Bosnia and Herzegovina|BA|387;Botswana|BW|267;Brazil|BR|55;British Virgin Islands|VG|1284;Brunei|BN|673;Bulgaria|BG|359;Burkina Faso|BF|226;Burundi|BI|257;Cabo Verde|CV|238;Cambodia|KH|855;Cameroon|CM|237;Canada|CA|1;Cayman Islands|KY|1345;Central African Republic|CF|236;Chad|TD|235;Chile|CL|56;China|CN|86;Colombia|CO|57;Comoros|KM|269;Congo|CG|242;Congo (DRC)|CD|243;Cook Islands|CK|682;Costa Rica|CR|506;Côte d'Ivoire|CI|225;Croatia|HR|385;Cuba|CU|53;Curaçao|CW|599;Cyprus|CY|357;Czechia|CZ|420;Denmark|DK|45;Djibouti|DJ|253;Dominica|DM|1767;Dominican Republic|DO|1809;Ecuador|EC|593;Egypt|EG|20;El Salvador|SV|503;Equatorial Guinea|GQ|240;Eritrea|ER|291;Estonia|EE|372;Eswatini|SZ|268;Ethiopia|ET|251;Falkland Islands|FK|500;Faroe Islands|FO|298;Fiji|FJ|679;Finland|FI|358;France|FR|33;French Guiana|GF|594;French Polynesia|PF|689;Gabon|GA|241;Gambia|GM|220;Georgia|GE|995;Germany|DE|49;Ghana|GH|233;Gibraltar|GI|350;Greece|GR|30;Greenland|GL|299;Grenada|GD|1473;Guadeloupe|GP|590;Guam|GU|1671;Guatemala|GT|502;Guernsey|GG|44;Guinea|GN|224;Guinea-Bissau|GW|245;Guyana|GY|592;Haiti|HT|509;Honduras|HN|504;Hong Kong|HK|852;Hungary|HU|36;Iceland|IS|354;India|IN|91;Indonesia|ID|62;Iran|IR|98;Iraq|IQ|964;Ireland|IE|353;Isle of Man|IM|44;Israel|IL|972;Italy|IT|39;Jamaica|JM|1876;Japan|JP|81;Jersey|JE|44;Jordan|JO|962;Kazakhstan|KZ|7;Kenya|KE|254;Kiribati|KI|686;Kosovo|XK|383;Kuwait|KW|965;Kyrgyzstan|KG|996;Laos|LA|856;Latvia|LV|371;Lebanon|LB|961;Lesotho|LS|266;Liberia|LR|231;Libya|LY|218;Liechtenstein|LI|423;Lithuania|LT|370;Luxembourg|LU|352;Macao|MO|853;Madagascar|MG|261;Malawi|MW|265;Malaysia|MY|60;Maldives|MV|960;Mali|ML|223;Malta|MT|356;Marshall Islands|MH|692;Martinique|MQ|596;Mauritania|MR|222;Mauritius|MU|230;Mayotte|YT|262;Mexico|MX|52;Micronesia|FM|691;Moldova|MD|373;Monaco|MC|377;Mongolia|MN|976;Montenegro|ME|382;Montserrat|MS|1664;Morocco|MA|212;Mozambique|MZ|258;Myanmar|MM|95;Namibia|NA|264;Nauru|NR|674;Nepal|NP|977;Netherlands|NL|31;New Caledonia|NC|687;New Zealand|NZ|64;Nicaragua|NI|505;Niger|NE|227;Nigeria|NG|234;North Korea|KP|850;North Macedonia|MK|389;Northern Mariana Islands|MP|1670;Norway|NO|47;Oman|OM|968;Pakistan|PK|92;Palau|PW|680;Palestine|PS|970;Panama|PA|507;Papua New Guinea|PG|675;Paraguay|PY|595;Peru|PE|51;Philippines|PH|63;Poland|PL|48;Portugal|PT|351;Puerto Rico|PR|1787;Qatar|QA|974;Réunion|RE|262;Romania|RO|40;Russia|RU|7;Rwanda|RW|250;Saint Kitts and Nevis|KN|1869;Saint Lucia|LC|1758;Saint Vincent and the Grenadines|VC|1784;Samoa|WS|685;San Marino|SM|378;São Tomé and Príncipe|ST|239;Saudi Arabia|SA|966;Senegal|SN|221;Serbia|RS|381;Seychelles|SC|248;Sierra Leone|SL|232;Singapore|SG|65;Sint Maarten|SX|1721;Slovakia|SK|421;Slovenia|SI|386;Solomon Islands|SB|677;Somalia|SO|252;South Africa|ZA|27;South Korea|KR|82;South Sudan|SS|211;Spain|ES|34;Sri Lanka|LK|94;Sudan|SD|249;Suriname|SR|597;Sweden|SE|46;Switzerland|CH|41;Syria|SY|963;Taiwan|TW|886;Tajikistan|TJ|992;Tanzania|TZ|255;Thailand|TH|66;Timor-Leste|TL|670;Togo|TG|228;Tonga|TO|676;Trinidad and Tobago|TT|1868;Tunisia|TN|216;Türkiye|TR|90;Turkmenistan|TM|993;Turks and Caicos Islands|TC|1649;Tuvalu|TV|688;Uganda|UG|256;Ukraine|UA|380;United Arab Emirates|AE|971;United Kingdom|GB|44;United States|US|1;Uruguay|UY|598;US Virgin Islands|VI|1340;Uzbekistan|UZ|998;Vanuatu|VU|678;Vatican City|VA|39;Venezuela|VE|58;Vietnam|VN|84;Yemen|YE|967;Zambia|ZM|260;Zimbabwe|ZW|263";
  var COUNTRIES=RAW.split(';').map(function(r){var a=r.split('|');return {name:a[0],iso:a[1],dial:'+'+a[2]};});
  var BY_ISO={};COUNTRIES.forEach(function(c){BY_ISO[c.iso]=c;});
  var PINNED=['NG','GB','US','CA','GH','ZA','KE','AE'];
  function flag(iso){return iso.toUpperCase().replace(/./g,function(ch){return String.fromCodePoint(127397+ch.charCodeAt(0));});}
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function countryOptions(sel){
    function o(c){return '<option value="'+c.iso+'"'+(c.iso===sel?' selected':'')+'>'+flag(c.iso)+'  '+esc(c.name)+'</option>';}
    return '<optgroup label="Common">'+PINNED.map(function(i){return o(BY_ISO[i]);}).join('')+'</optgroup><optgroup label="All countries">'+COUNTRIES.map(o).join('')+'</optgroup>';
  }
  function ccPicker(p,iso){var c=BY_ISO[iso]||BY_ISO.NG;
    return '<div class="cc" data-cc><button type="button" class="cc-btn" id="'+p+'cc" aria-haspopup="listbox" aria-expanded="false" aria-label="Country code, '+esc(c.name)+' '+c.dial+'"><span class="fl">'+flag(c.iso)+'</span><span class="code">'+c.dial+'</span></button>'+
      '<div class="cc-pop" hidden><input type="search" id="'+p+'cc-search" placeholder="Search country or code" aria-label="Search countries" autocomplete="off"><ul role="listbox" aria-label="Country codes"></ul></div>'+
      '<input type="hidden" name="cc" value="'+c.iso+'"></div>';}
  function setCC(el,iso){var c=BY_ISO[iso];if(!c)return;el.querySelector('input[name=cc]').value=iso;
    var b=el.querySelector('.cc-btn');b.querySelector('.fl').textContent=flag(iso);b.querySelector('.code').textContent=c.dial;b.setAttribute('aria-label','Country code, '+c.name+' '+c.dial);}
  function initCC(el){
    var btn=el.querySelector('.cc-btn'),pop=el.querySelector('.cc-pop'),q=pop.querySelector('input'),ul=pop.querySelector('ul');
    function list(term){term=(term||'').trim().toLowerCase().replace(/^\+/,'');var cur=el.querySelector('input[name=cc]').value;
      var rows=term?COUNTRIES.filter(function(c){return c.name.toLowerCase().indexOf(term)>-1||c.dial.slice(1).indexOf(term)===0||c.iso.toLowerCase()===term;})
          .sort(function(a,b){return (PINNED.indexOf(a.iso)<0?99:PINNED.indexOf(a.iso))-(PINNED.indexOf(b.iso)<0?99:PINNED.indexOf(b.iso));})
        :PINNED.map(function(i){return BY_ISO[i];}).concat(COUNTRIES.filter(function(c){return PINNED.indexOf(c.iso)<0;}));
      ul.innerHTML=rows.length?rows.map(function(c){return '<li><button type="button" role="option" data-iso="'+c.iso+'" aria-selected="'+(c.iso===cur)+'"><span class="fl">'+flag(c.iso)+'</span><span>'+esc(c.name)+'</span><span class="dc">'+c.dial+'</span></button></li>';}).join(''):'<li class="none">No matching country</li>';}
    function open(){list('');pop.hidden=false;btn.setAttribute('aria-expanded','true');q.value='';q.focus();}
    function close(f){pop.hidden=true;btn.setAttribute('aria-expanded','false');if(f)btn.focus();}
    btn.addEventListener('click',function(){pop.hidden?open():close();});
    q.addEventListener('input',function(){list(q.value);});
    q.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var f=ul.querySelector('button');if(f)f.click();}if(e.key==='ArrowDown'){e.preventDefault();var f2=ul.querySelector('button');if(f2)f2.focus();}});
    ul.addEventListener('keydown',function(e){var b=document.activeElement;if(!b||b.tagName!=='BUTTON')return;var li=b.parentElement;
      if(e.key==='ArrowDown'&&li.nextElementSibling){e.preventDefault();li.nextElementSibling.querySelector('button').focus();}
      if(e.key==='ArrowUp'){e.preventDefault();li.previousElementSibling?li.previousElementSibling.querySelector('button').focus():q.focus();}});
    ul.addEventListener('click',function(e){var b=e.target.closest('button[data-iso]');if(!b)return;setCC(el,b.dataset.iso);el.dataset.touched='1';close(true);validate();});
    el.addEventListener('keydown',function(e){if(e.key==='Escape'&&!pop.hidden){e.stopPropagation();close(true);}});
    document.addEventListener('click',function(e){if(!el.contains(e.target)&&!pop.hidden)close();});
  }

  function attendeeBlock(i,fmtVal,isBundle){
    var d=attendeeData[i], n=i+1, p='a'+n+'-';
    function val(k,def){return d[k]!==undefined?d[k]:(def||'');}
    function opt(list,sel){return list.map(function(o){return '<option'+(o===sel?' selected':'')+'>'+o+'</option>';}).join('');}
    var occ=val('occupation');
    return '<fieldset><legend>'+(isBundle?('Attendee '+n):'Your details')+'</legend>'+
      '<div class="fields">'+
      '<div class="field full" role="radiogroup" aria-label="How will you attend?"><span class="lbl">How will you attend? <span class="req" aria-hidden="true">*</span></span><div class="attend">'+
        '<label><input type="radio" name="'+p+'attend" id="'+p+'ip" value="inperson"'+(fmtVal==='inperson'?' checked':'')+'>In-person</label>'+
        '<label><input type="radio" name="'+p+'attend" id="'+p+'on" value="online"'+(fmtVal==='online'?' checked':'')+'>Online</label></div></div>'+
      '<label class="field"><span class="lbl">First name <span class="req" aria-hidden="true">*</span></span><input id="'+p+'first" name="first" autocomplete="'+(i?'off':'given-name')+'" placeholder="Jane" value="'+esc(val('first'))+'"></label>'+
      '<label class="field"><span class="lbl">Last name <span class="req" aria-hidden="true">*</span></span><input id="'+p+'last" name="last" autocomplete="'+(i?'off':'family-name')+'" placeholder="Smith" value="'+esc(val('last'))+'"></label>'+
      '<label class="field"><span class="lbl">Email <span class="req" aria-hidden="true">*</span></span><input id="'+p+'email" name="email" type="email" autocomplete="'+(i?'off':'email')+'" placeholder="jane@example.com" value="'+esc(val('email'))+'"></label>'+
      '<div class="field"><span class="lbl">Phone number <span class="req" aria-hidden="true">*</span></span><div class="phone">'+ccPicker(p,val('cc','NG'))+'<input id="'+p+'phone" name="phone" type="tel" aria-label="Phone number" placeholder="801 234 5678" value="'+esc(val('phone'))+'"></div></div>'+
      '<label class="field"><span class="lbl">Gender <span class="req" aria-hidden="true">*</span></span><select id="'+p+'gender" name="gender"><option value="">Select gender</option>'+opt(['Male','Female','Prefer not to say'],val('gender'))+'</select></label>'+
      '<label class="field"><span class="lbl">Occupation <span class="req" aria-hidden="true">*</span></span><select id="'+p+'occupation" name="occupation" data-occ><option value="">Select current status</option>'+opt(['Employed','Self-employed','Entrepreneur','Student','Other'],occ)+'</select></label>'+
      '<label class="field full" data-level'+(occ==='Employed'?'':' hidden')+'><span class="lbl">Employment level <span class="req" aria-hidden="true">*</span></span><select id="'+p+'level" name="level"><option value="">Select your level</option>'+opt(['Founder / Co-founder','Executive / C-suite','Manager','Associate','Other'],val('level'))+'</select></label>'+
      '<label class="field">Company name<input id="'+p+'company" name="company" autocomplete="'+(i?'off':'organization')+'" placeholder="Acme Ltd" value="'+esc(val('company'))+'"></label>'+
      '<label class="field">Role<input id="'+p+'role" name="role" autocomplete="'+(i?'off':'organization-title')+'" placeholder="Founder, Product Manager…" value="'+esc(val('role'))+'"></label>'+
      '<label class="field"><span class="lbl">City <span class="req" aria-hidden="true">*</span></span><input id="'+p+'city" name="city" placeholder="Lagos" value="'+esc(val('city'))+'"></label>'+
      '<label class="field"><span class="lbl">Country <span class="req" aria-hidden="true">*</span></span><select id="'+p+'country" name="country" data-country>'+countryOptions(val('country','NG'))+'</select></label>'+
      '</div></fieldset>';
  }

  function renderForm(){
    saveAttendees();
    var isBundle=state.ticket==='bundle', box=document.getElementById('attendees');
    box.innerHTML=state.formats.map(function(f,i){return attendeeBlock(i,f,isBundle);}).join('');
    box.style.display='grid';box.style.gap='28px';
    box.querySelectorAll('[data-cc]').forEach(function(el,i){if(attendeeData[i].ccTouched)el.dataset.touched='1';initCC(el);});
    box.querySelectorAll('[data-country]').forEach(function(s){s.addEventListener('change',function(){
      var cc=s.closest('fieldset').querySelector('[data-cc]');if(!cc.dataset.touched)setCC(cc,s.value);});});
    box.querySelectorAll('[data-occ]').forEach(function(s){s.addEventListener('change',function(){s.closest('.fields').querySelector('[data-level]').hidden=s.value!=='Employed';});});
    box.querySelectorAll('input[type=radio]').forEach(function(r){r.addEventListener('change',function(){
      var i=+r.name.charAt(1)-1; state.formats[i]=r.value==='online'?'online':'inperson';
      if(isBundle){var key=state.formats.slice().sort().join(',');var map={'inperson,inperson':'combo-ii','online,online':'combo-oo','inperson,online':'combo-io'};document.getElementById(map[key]).checked=true;}
      else state.ticket=r.value;
      renderPrices();renderSummary();validate();});});
    validate();
  }

  function renderSummary(){
    var lines=state.formats.map(function(f,i){return '<div class="row"><span>'+(state.ticket==='bundle'?'Attendee '+(i+1)+' · ':'')+P[f].label+'</span><span>'+fmt(P[f][state.cur])+'</span></div>';});
    var isB=state.ticket==='bundle';
    if(isB)lines.unshift('<div class="row"><span>2-in-1 Bundle</span><span>'+comboLabel(state.formats)+'</span></div>');
    document.getElementById('s-lines').innerHTML=lines.join('');
    var s=sum(state.formats), d=isB?s*0.1:0;
    document.getElementById('s-disc-row').hidden=!isB;
    document.getElementById('s-disc').textContent='−'+fmt(d);
    document.getElementById('s-total').textContent=fmt(s-d);
  }

  function select(t){
    state.ticket=t;
    state.formats=t==='bundle'?document.querySelector('input[name="combo"]:checked').value.split(','):[t];
    renderPrices();renderForm();renderSummary();
  }

  // ---- Required-field gating ---------------------------------------------
  function filled(el){return !!(el && el.value && el.value.trim()!=='');}

  // Returns true only when every compulsory field is complete and valid.
  // Drives the Continue button's disabled state.
  function validate(){
    var ok=true;
    var sets=document.querySelectorAll('#attendees fieldset');
    if(!sets.length) ok=false;
    sets.forEach(function(fs){
      if(!fs.querySelector('input[type=radio]:checked')) ok=false;
      ['first','last','city','gender','occupation','country'].forEach(function(n){
        if(!filled(fs.querySelector('[name="'+n+'"]'))) ok=false;
      });
      var email=fs.querySelector('[name="email"]');
      if(!filled(email)||!EMAIL_RE.test(email.value.trim())) ok=false;
      var phone=fs.querySelector('[name="phone"]');
      if(!phone||phone.value.replace(/\D/g,'').length<6) ok=false;
      var occ=fs.querySelector('[name="occupation"]');
      if(occ&&occ.value==='Employed'&&!filled(fs.querySelector('[name="level"]'))) ok=false;
    });
    if(!filled(document.getElementById('f-source'))) ok=false;

    var btn=document.getElementById('pay-btn');
    btn.disabled=!ok;
    document.getElementById('hint').textContent=ok
      ? 'Ready. We’ll show your bank transfer details next.'
      : 'Complete all required fields to continue.';
    return ok;
  }

  // ---- Payload & submit ---------------------------------------------------
  function collect(i){
    var fs=document.querySelectorAll('#attendees fieldset')[i];
    function v(n){var el=fs.querySelector('[name="'+n+'"]');return el?el.value.trim():'';}
    // Only the fields on the form. Anything else is not sent.
    var occ=v('occupation');
    var countrySel=fs.querySelector('[name="country"]');
    var sourceEl=document.getElementById('f-source');
    return {
      firstName:v('first'),
      lastName:v('last'),
      email:v('email'),
      phone:v('phone'),
      phoneCountryCode:(BY_ISO[v('cc')]||{}).dial||'',
      gender:v('gender'),
      occupation:occ,
      employmentLevel:occ==='Employed'?v('level'):'',
      company:v('company'),
      role:v('role'),
      city:v('city'),
      country:(BY_ISO[countrySel.value]||{}).name||countrySel.value,
      attendanceType:fs.querySelector('input[type=radio]:checked').value==='online'?'virtual':'in-person',
      source:sourceEl?sourceEl.value:'',
      currency:state.cur,
      bundle:state.ticket==='bundle',
      cohortId:COHORT_ID
    };
  }

  async function submitRegistration(){
    var btn=document.getElementById('pay-btn'), err=document.getElementById('err');
    var results=[];
    err.hidden=true; btn.disabled=true; btn.textContent='Submitting…';
    try{
      // One request per attendee; the Worker handles one registration per call.
      for(var i=0;i<state.formats.length;i++){
        var res=await fetch(WORKER_URL,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(collect(i))});
        var body=await res.json().catch(function(){return {};});
        if(!res.ok||!body.success) throw new Error(body.message||'Something went wrong. Please try again.');
        results.push(body);
      }
      showSuccess(results);
    }catch(e){
      var msg=e.message||'Something went wrong. Please try again.';
      if(results.length){
        msg='Attendee '+(results.length+1)+' could not be registered: '+msg+' Already registered: '+results.map(function(r){return r.reference;}).join(', ')+'. Please email info@sonderplace.com with these references.';
      }
      err.textContent=msg; err.hidden=false;
      btn.disabled=false; btn.textContent='Continue to checkout';
      validate();
    }
  }

  function showSuccess(results){
    var box=document.getElementById('success');
    box.textContent='';
    var h=document.createElement('h3'); h.textContent='Registration received';
    var p=document.createElement('p');
    p.textContent='We have emailed your payment details. Complete your bank transfer quoting the reference below to secure your place.';
    box.appendChild(h); box.appendChild(p);

    results.forEach(function(r){
      var line=document.createElement('p'); line.className='ref';
      line.textContent='Reference: '+r.reference+' · Amount: '+r.totalLabel;
      box.appendChild(line);
    });

    var bank=results[0].bankDetails;
    bank.accounts.forEach(function(a){
      var wrap=document.createElement('div'); wrap.className='acct';
      var title=document.createElement('b'); title.textContent=a.label;
      var dl=document.createElement('dl');
      [['Account name',a.accountName],['Account number',a.accountNumber],['Bank',a.bankName&&a.bankName.trim()],['Routing number',a.routingNumber],['Email',a.email]]
        .forEach(function(kv){
          if(!kv[1]) return;
          var dt=document.createElement('dt'); dt.textContent=kv[0];
          var dd=document.createElement('dd'); dd.textContent=kv[1];
          dl.appendChild(dt); dl.appendChild(dd);
        });
      wrap.appendChild(title); wrap.appendChild(dl);
      box.appendChild(wrap);
    });

    var note=document.createElement('p');
    note.textContent='Please send proof of payment to info@sonderplace.com.';
    box.appendChild(note);

    document.querySelector('#register .reg-grid').hidden=true;
    box.hidden=false;
    box.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
  }

  // ---- Wiring -------------------------------------------------------------
  document.querySelectorAll('[data-cur]').forEach(function(b){b.addEventListener('click',function(){state.cur=b.dataset.cur;renderPrices();renderSummary();});});
  document.querySelectorAll('input[name="combo"]').forEach(function(r){r.addEventListener('change',function(){renderPrices();if(state.ticket==='bundle')select('bundle');});});
  document.querySelectorAll('[data-select]').forEach(function(b){b.addEventListener('click',function(){select(b.dataset.select);document.getElementById('register').scrollIntoView({behavior:reduce?'auto':'smooth'});});});

  var form=document.getElementById('reg-form');
  ['input','change'].forEach(function(ev){form.addEventListener(ev,validate);});
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!validate()) return;
    submitRegistration();
  });

  select('inperson');
})();
