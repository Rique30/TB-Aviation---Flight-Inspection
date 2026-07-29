// ===== EMAILJS CONFIG (password reset) =====
// 1. Create a free account at https://emailjs.com
// 2. Add an Email Service (Gmail, Outlook, etc.) → copy the Service ID
// 3. Create a Template with variables: {{to_name}}, {{username}}, {{temp_password}}
//    Subject: "TB Aviation — Your temporary password"
//    Body:  "Hi {{to_name}}, your temporary password is: {{temp_password}}"
// 4. Copy your Public Key from Account → API Keys
var _EMAILJS_SERVICE  = 'YOUR_SERVICE_ID';   // ← replace
var _EMAILJS_TEMPLATE = 'YOUR_TEMPLATE_ID';  // ← replace
var _EMAILJS_PUBKEY   = 'YOUR_PUBLIC_KEY';   // ← replace

// ===== USUÁRIOS FIXOS =====
// Passwords stored as 'b64:<btoa(plaintext)>' — decoded at login/compare time.
function _h(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function _encPw(pw){return 'b64:'+btoa(String(pw));}
function _checkPw(stored,input){
  if(stored&&stored.slice(0,4)==='b64:'){try{return atob(stored.slice(4))===input;}catch(e){return false;}}
  return stored===input; // legacy plaintext fallback
}
var USERS=[
  {u:'gabriela',p:'b64:MTIzNA==',nome:'Gabriela Botteon',role:'user',email:'gabriela@tb.com',hint:'4 digits'},
  {u:'caio',p:'b64:MTIzNA==',nome:'Caio Chiavelli',role:'user',email:'caio@tb.com',hint:'4 digits'},
  {u:'thomas',p:'b64:MTIzNA==',nome:'Thomas Antonelli',role:'user',email:'thomas@tb.com',hint:'4 digits'},
  {u:'henrique',p:'b64:MTIzNA==',nome:'Henrique Cuin',role:'user',email:'henrique@tb.com',hint:'4 digits'},
  {u:'matheus',p:'b64:MTIzNA==',nome:'Matheus Gonzalez',role:'user',email:'matheus@tb.com',hint:'4 digits'},
  {u:'rafael',p:'b64:MTIzNA==',nome:'Rafael Braz',role:'adm',email:'rafael@tb.com',hint:'4 digits'},
  {u:'luis',p:'b64:MTIzNA==',nome:'Luis Henrique',role:'dev',email:'luis@tb.com',hint:'4 digits'},
  {u:'rafaelh',p:'b64:MTIzNA==',nome:'Rafael Henrique',role:'user',email:'rleonardi@tbaviation.com.br',hint:'4 digits'},
];

// Load extra accounts created by users (merge tb7users and tb7u for compatibility)
var USERS_EXTRA=[];
try{
  var _ue=localStorage.getItem('tb7users');
  if(_ue) USERS_EXTRA=JSON.parse(_ue);
  var _ue2=localStorage.getItem('tb7u');
  if(_ue2){
    var _eu2=JSON.parse(_ue2);
    _eu2.forEach(function(u){
      if(!USERS_EXTRA.some(function(e){return e.u===u.u;})) USERS_EXTRA.push(u);
    });
  }
}catch(e){USERS_EXTRA=[];}
function svUsers(){try{localStorage.setItem('tb7users',JSON.stringify(USERS_EXTRA));}catch(e){}if(typeof cloudSave==='function')cloudSave();}
function getAllUsers(){
  var baseU=USERS.map(function(u){return u.u;});
  return USERS.concat(USERS_EXTRA.filter(function(u){return baseU.indexOf(u.u)===-1;}));
}

var USERS_PWD_OVERRIDES={};
try{USERS_PWD_OVERRIDES=JSON.parse(localStorage.getItem('tb7_upwd')||'{}');}catch(e){}
function svUserPwd(){try{localStorage.setItem('tb7_upwd',JSON.stringify(USERS_PWD_OVERRIDES));}catch(e){}}

// Apply persisted name/email overrides for built-in users
(function(){
  var _ui={};
  try{_ui=JSON.parse(localStorage.getItem('tb7_uinfo')||'{}');}catch(e){}
  USERS.forEach(function(u){
    if(_ui[u.u]){
      if(_ui[u.u].nome)u.nome=_ui[u.u].nome;
      if(_ui[u.u].email)u.email=_ui[u.u].email;
    }
  });
})();

// ===== CREATE ACCOUNT =====
function abrirCriarConta(){
  document.getElementById('cc-nome').value='';
  document.getElementById('cc-email').value='';
  document.getElementById('cc-user').value='';
  document.getElementById('cc-pass').value='';
  document.getElementById('cc-pass2').value='';
  document.getElementById('cc-msg').textContent='';
  document.getElementById('mod-criar-conta').style.display='flex';
}
function fecharCriarConta(){
  document.getElementById('mod-criar-conta').style.display='none';
}

// ===== FORGOT PASSWORD =====
function abrirEsqueceuSenha(){
  var m=document.getElementById('mod-forgot-pwd');
  if(m){m.style.display='flex';}
  var inp=document.getElementById('fp-user');
  if(inp){inp.value='';inp.focus();}
  var msg=document.getElementById('fp-msg');
  if(msg)msg.textContent='';
}
function fecharEsqueceuSenha(){
  var m=document.getElementById('mod-forgot-pwd');
  if(m)m.style.display='none';
}
function _genTempPwd(){
  var chars='ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  var pw='';
  for(var i=0;i<8;i++) pw+=chars[Math.floor(Math.random()*chars.length)];
  return pw;
}
function enviarResetSenha(){
  var uVal=(document.getElementById('fp-user').value||'').trim().toLowerCase();
  var msg=document.getElementById('fp-msg');
  var btn=document.getElementById('fp-btn');
  if(!uVal){msg.style.color='#e65100';msg.textContent='Please enter your username.';return;}
  var all=getAllUsers();
  var found=null;
  for(var i=0;i<all.length;i++){if(all[i].u===uVal){found=all[i];break;}}
  if(!found){msg.style.color='#e65100';msg.textContent='Username not found.';return;}
  if(!found.email){msg.style.color='#e65100';msg.textContent='No email registered for this account. Contact your admin.';return;}

  var tempPwd=_genTempPwd();
  // Store as encoded override so the user can log in immediately
  USERS_PWD_OVERRIDES[found.u]=_encPw(tempPwd);
  svUserPwd();
  if(typeof _svAdminDataCloud==='function')_svAdminDataCloud();

  // Try to send via EmailJS
  var ejsConfigured=(_EMAILJS_SERVICE!=='YOUR_SERVICE_ID'&&_EMAILJS_PUBKEY!=='YOUR_PUBLIC_KEY');
  if(ejsConfigured&&window.emailjs){
    btn.disabled=true;
    msg.style.color='#1565c0';
    msg.textContent='⏳ Sending email...';
    window.emailjs.init({publicKey:_EMAILJS_PUBKEY});
    window.emailjs.send(_EMAILJS_SERVICE, _EMAILJS_TEMPLATE, {
      to_email: found.email,
      to_name: found.nome,
      username: found.u,
      temp_password: tempPwd
    }).then(function(){
      btn.disabled=false;
      msg.style.color='#2e7d32';
      msg.textContent='✅ Email sent to '+found.email+'. Check your inbox and log in with the temporary password.';
    }).catch(function(err){
      btn.disabled=false;
      console.error('EmailJS error:',err);
      msg.style.color='#e65100';
      msg.textContent='❌ Failed to send email. Contact your admin. Your temp password: '+tempPwd;
    });
  } else {
    // EmailJS not configured — show temp password on screen so admin can relay it
    msg.style.color='#2e7d32';
    msg.innerHTML='✅ Temporary password set.<br><strong style="font-size:18px;letter-spacing:2px;">'+_h(tempPwd)+'</strong><br><span style="font-size:11px;color:#888;">Log in with this password and change it in Settings. Share it with your admin if needed.</span>';
    if(!ejsConfigured) console.warn('EmailJS not configured. Set _EMAILJS_SERVICE, _EMAILJS_TEMPLATE and _EMAILJS_PUBKEY in script.js.');
  }
}
function criarConta(){
  var nome=document.getElementById('cc-nome').value.trim();
  var email=document.getElementById('cc-email').value.trim();
  var user=document.getElementById('cc-user').value.trim().toLowerCase();
  var pass=document.getElementById('cc-pass').value.trim();
  var pass2=document.getElementById('cc-pass2').value.trim();
  var msg=document.getElementById('cc-msg');

  if(!nome||!email||!user||!pass||!pass2){
    msg.style.color='#e65100';
    msg.textContent='Please fill in all fields.';
    return;
  }
  if(!email.includes('@')||!email.includes('.')){
    msg.style.color='#e65100';
    msg.textContent='Please enter a valid email.';
    return;
  }
  if(pass.length<4){
    msg.style.color='#e65100';
    msg.textContent='Password must be at least 4 characters.';
    return;
  }
  if(pass!==pass2){
    msg.style.color='#e65100';
    msg.textContent='Passwords do not match.';
    return;
  }
  // Verifica se username já existe
  var all=getAllUsers();
  for(var i=0;i<all.length;i++){
    if(all[i].u===user){
      msg.style.color='#e65100';
      msg.textContent='Username already taken. Choose another.';
      return;
    }
    if(all[i].email&&all[i].email===email){
      msg.style.color='#e65100';
      msg.textContent='Email already registered.';
      return;
    }
  }
  // Cria a conta
  USERS_EXTRA.push({
    u:user,
    p:_encPw(pass),
    nome:nome,
    email:email,
    role:'user',
    hint:'Created by user'
  });
  svUsers();
  msg.style.color='#2e7d32';
  msg.textContent='✅ Account created! You can now sign in.';
  setTimeout(function(){fecharCriarConta();},2000);
}

var SERIE_HINT={
  'EMB-505 - Phenom 300':'Ex: 50500255',
  'Falcon 900EX':'Ex: LX-180',
  'Hawker 400A':'Ex: RK-450',
  'C750 - Citation X':'Ex: 750-0001',
  'C525 - CJ1':'Ex: 525-0650',
  'C525B - CJ3':'Ex: 525B-0001',
  'Gulfstream G280':'Ex: 280-2001',
  'Other':'Enter serial number'
};

var CL={
  'EMB-505 - Phenom 300':[
    {s:'Forward Fuselage',items:[
      'Pax Door - check for general condition and correct operation for Closing/Locking mechanism',
      'Ice Indicator - inspect for general condition',
      'Protection Covers - remove before start the engines',
      'Oxygen Reservoir - inspect cylinder pressure, closing/locking of inspection door, bottle depressurization seal and expiration date for recharge'
    ]},
    {s:'Nose Landing Gear',items:[
      'Hoses and tubes - general condition and leaks',
      'Lock Pin-Stainless Steel NLG - check if it is installed',
      'Wiring - check for general condition and fasteners',
      'Shock Absorber - pressure check (keep at maximum allowable pressure per AMM)',
      'Hydraulic Rack - leaks, damage, tripped pop-out indicators, F.O reservoir level and remove NLG Door Pin',
      'Pitot tubes (LH/RH) and Sensors - general condition, covers removed and clear'
    ]},
    {s:'Wing LH',items:[
      'External Light - inspect correct operation',
      'Static Discharger - check fasteners and general condition',
      'Nacas - find for cuts, contamination or cracks',
      'Inspection Window - check for closing',
      'Filler Port - check locking',
      'Fuselage Filler Port (EMB-505)',
      'Wing - no leakage, check if all panels are closed',
      'Mobile Surface Unblocked - check for general condition',
      'Refueling panel door - check closing',
      'Aileron Cable and Trailing Edge',
      'Cowling - check for general condition and fastening',
      'Wing Covering - find for jags, cuts or cracks',
      'Register Paint - check for general condition',
      'Cover Protection - remove before start the engines'
    ]},
    {s:'Wing RH',items:[
      'External Light - inspect correct operation',
      'Static Discharger - check fasteners and general condition',
      'De-Ice Boot - find for cuts, contamination or cracks',
      'Nacas - find for cuts, contamination or cracks',
      'Inspection Window - check for closing',
      'Filler Port - check locking',
      'Fuselage Filler Port (EMB-505)',
      'Wing - no leakage, check if all panels are closed',
      'Mobile Surface Unblocked - check for general condition',
      'Refueling panel door - check closing',
      'Aileron Cable and Trailing Edge',
      'Cowling - check for general condition and fastening',
      'Wing Covering - find for jags, cuts or cracks',
      'Register Paint - check for general condition',
      'Cover Protection - remove before start the engines'
    ]},
    {s:'Main Landing Gear LH',items:[
      'Wheels and brakes - general condition: safety, leaks, oil contamination, damage',
      'Tires - general condition: safety, leaks, oil contamination, pressure, wear and tear, damage',
      'Hoses - verify if there is any leak or bend',
      'Pipes/Tubes - verify if there are any leak or dented',
      'Actuators - general condition and leaks',
      'Struts - general condition',
      'W.O.W sensors - general condition and correct connection',
      'Landing Gear Bay - F.O. general condition and correct closing of access panel'
    ]},
    {s:'Main Landing Gear RH',items:[
      'Wheels and brakes - general condition: safety, leaks, oil contamination, damage',
      'Tires - general condition: safety, leaks, oil contamination, pressure, wear and tear, damage',
      'Hoses - verify if there is any leak or bend',
      'Pipes/Tubes - verify if there are any leak or dented',
      'Actuators - general condition and leaks',
      'Struts - general condition',
      'W.O.W sensors - general condition and correct connection',
      'Landing Gear Bay - F.O. general condition and correct closing of access panel'
    ]},
    {s:'Pylon and Engine LH',items:[
      'Fuel Filter - check general condition',
      'Fuel Drain - find for blocks',
      'Engine Oil | Add oil: _____ mL',
      'Oil Drain - find for blocks',
      'Blades - find for grooves and F.O.',
      'Engine - find for leaks',
      'Air intake - check for general condition and locking',
      'Access Panel - general condition and locking',
      'Closure of all access panels'
    ]},
    {s:'Pylon and Engine RH',items:[
      'Fuel Filter - check general condition',
      'Fuel Drain - find for blocks',
      'Engine Oil | Add oil: _____ mL',
      'Oil Drain - find for blocks',
      'Blades - find for grooves and F.O.',
      'Engine - find for leaks',
      'Air intake - check for general condition and locking',
      'Access Panel - general condition and locking',
      'Closure of all access panels'
    ]},
    {s:'Rear Fuselage and Stabilizers',items:[
      'Cargo Compartment Door - general condition, freedom of movement and locking',
      'Antennas (lower and upper) - general condition, fastening and correct operation',
      'Light Inspection - general condition and correct operation',
      'Red Beacon (lower and upper) - general condition and correct operation',
      'Cargo Compartment - looking for untied items and correct fastenings',
      'Horizontal Stabilizer Boot - find for cuts, contamination and cracks',
      'Mobile Surface Unblocked - general condition',
      'Rig pins - remove all from control surfaces',
      'Access Doors - general condition, freedom of movement and locking',
      'Drop Gate and Ram Air',
      'Cowling - general condition and fastenings',
      'Register Paint - general condition and precision',
      'Elevator and Rudder Static Discharger - general condition and precision'
    ]},
    {s:'Internal Inspection',items:[
      'Cockpit - general condition and safety, equipment, panels, instruments and seats',
      'Cockpit Lights - correct operation',
      'Passenger Cabin Light - correct operation',
      'General Alarms (audio and light) - correct operation',
      'Displays Cooling - correct operation',
      'Compass - coherence of indications and correction cards on aircraft',
      'Altitude Indicators - coherence of indications',
      'Avionics - EICAS','Avionics - PFD','Avionics - MFD',
      'Avionics - VOR/LOC','Avionics - ADF','Avionics - DME',
      'Avionics - TCAS','Avionics - GPS','Avionics - FMS',
      'Avionics - GPWS','Avionics - VHF 1','Avionics - VHF 2',
      'Avionics - HF','Avionics - Transponder',
      'Altimeter, Airspeed and VSIs - coherence of indications',
      'Engine and fuel system indicators - correct indication',
      'Auto Pilot - functional test and Flight Director',
      'Interphone, panel, ramp and oxygen masks - correct operation',
      'Radios - set local frequencies',
      'VOR calibration - VOR 1 and VOR 2 difference must be less than 4 degrees',
      'Passenger Seats - fastening, locking and correct operation',
      'Seat belts - general condition and safety',
      'Emergency windows and doors - general condition and proper closing',
      'Survival Items - valid and correct position',
      'First Aid Kit - valid and correct position',
      'Jungle/Survival kit and life rafts (if installed)',
      'Oxygen System - check','Masks - housing and fastening',
      'Oxygen on EICAS - check indications',
      'Oxygen Pressure | Register value: _____ psi',
      'Fire extinguisher - general condition and safety',
      'Cabin - no loose items in lockers, bins and compartments, no blockage of doors/aisles/exits',
      'Absence of FOD on cabin interior, lockers, bins and compartments'
    ]},
    {s:'Standard Practices (Departure)',items:[
      'Perform Servicing - Hydraulic Accumulator',
      'Perform Servicing - Emergency/Parking Brake Accumulator',
      'Perform Oxygen Servicing (AMM 12-14-00-600-801-A)',
      'Perform Servicing MLG and NLG wheel tires (AMM 12-13-05)',
      'Perform Level check - Hydraulic System reservoir fluid and servicing',
      'Perform Aircraft Towing to Delivery',
      'Perform Aircraft Return to Service after normal parking'
    ]}
  ],
  'Falcon 900EX':[
    {s:'Section 1 - Cockpit / Interior Inspection',items:[
      'Documents on board (CofA, Registration, AFM, Insurance, MEL) - check',
      'Oxygen system - pressure and masks check',
      'Smoke goggles - on board and accessible',
      'Emergency oxygen bottles (crew and cabin) - pressure check',
      'External lights (nav, strobe, beacon, landing) - check operation',
      'Battery Master - check voltage',
      'Hydraulic system 1 and 2 - pressure and fluid level check',
      'Fuel quantity - check (all tanks: LH, RH, Center)',
      'Fire extinguisher (cockpit) - check pin, gauge and safety',
      'Emergency equipment - check position and validity',
      'ELT - armed and operational',
      'Circuit breakers - all in (none popped)',
      'Avionics - EASy II EFIS check (PFD, MFD, FMS)',
      'TCAS II - test and operational',
      'GPWS / EGPWS - test and operational',
      'Autopilot / Flight Director - test',
      'Weather radar - operational',
      'VHF 1 and VHF 2 - operational',
      'HF Radio - operational',
      'Transponder - operational and coded',
      'Pressurization system - check',
      'Seat belts - all seats condition',
      'Cabin safety items - check'
    ]},
    {s:'Section 2 - Nose Section',items:[
      'Nose cone - condition, no damage or cracks',
      'Radome - condition and attachment',
      'Pitot tubes (Captain, First Officer) - covers removed, clear, condition',
      'Static ports - clear',
      'AOA vane - condition and movement',
      'Total air temperature probe - condition',
      'Nose landing gear - strut extension, no hydraulic leaks',
      'NLG doors - condition and closing',
      'NLG tires - pressure, wear and condition',
      'NLG wheels - condition'
    ]},
    {s:'Section 3 - Left Wing',items:[
      'Wing skin - condition, no damage or cracks',
      'Leading edge - condition, no dents or damage',
      'De-ice boots (leading edge) - condition, no cuts or contamination',
      'Static dischargers - condition and attachment',
      'Fuel cap (LH) - locked and sealed',
      'Fuel vent - clear and unobstructed',
      'Navigation light (LH wingtip) - condition',
      'Strobe light - condition',
      'Aileron - condition, free movement, no damage',
      'Flap - condition, no damage',
      'Spoilers - condition',
      'Wing panels - all closed and secured'
    ]},
    {s:'Section 4 - Left Engine (TFE731-60 No.1)',items:[
      'Engine cowling - condition, secured, no damage',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel filter - condition',
      'Fuel drain - check for blockage',
      'Engine mounts - no visible damage',
      'Exhaust - condition, no cracks',
      'Thrust reverser (if installed) - condition',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 5 - Center Engine (TFE731-60 No.2)',items:[
      'Engine cowling - condition, secured, no damage',
      'Intake (S-duct) - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel filter - condition',
      'Engine mounts - no visible damage',
      'Exhaust - condition, no cracks',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 6 - Right Wing',items:[
      'Wing skin - condition, no damage or cracks',
      'Leading edge - condition, no dents',
      'De-ice boots - condition, no cuts or contamination',
      'Static dischargers - condition and attachment',
      'Fuel cap (RH) - locked and sealed',
      'Fuel vent - clear and unobstructed',
      'Navigation light (RH wingtip) - condition',
      'Strobe light - condition',
      'Aileron - condition, free movement',
      'Flap - condition, no damage',
      'Spoilers - condition',
      'Wing panels - all closed and secured'
    ]},
    {s:'Section 7 - Right Engine (TFE731-60 No.3)',items:[
      'Engine cowling - condition, secured, no damage',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel filter - condition',
      'Fuel drain - check for blockage',
      'Engine mounts - no visible damage',
      'Exhaust - condition, no cracks',
      'Thrust reverser (if installed) - condition',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 8 - Main Landing Gear',items:[
      'LH MLG tires - pressure, wear, condition',
      'LH MLG wheels - condition, no cracks',
      'LH MLG brakes - wear, no leaks',
      'LH MLG strut - extension, no leaks',
      'RH MLG tires - pressure, wear, condition',
      'RH MLG wheels - condition, no cracks',
      'RH MLG brakes - wear, no leaks',
      'RH MLG strut - extension, no leaks',
      'MLG doors - condition and closing',
      'Gear pins - removed before flight'
    ]},
    {s:'Section 9 - Rear Fuselage and Empennage',items:[
      'Fuselage skin - condition, no damage',
      'Antennas - condition, fastening and operation',
      'Horizontal stabilizer - condition, no damage',
      'Elevator - condition, free movement',
      'Vertical stabilizer - condition, no damage',
      'Rudder - condition, free movement',
      'Static dischargers (tail) - condition and attachment',
      'APU exhaust - condition',
      'Beacon lights - condition and operation',
      'All access panels - closed and secured'
    ]}
  ],
  'Hawker 400A':[
    {s:'Section 1 - Cockpit / Interior Inspection',items:[
      'Documents (CofA, Registration, AFM, Pilot Checklist, AMS-5000) - check',
      'Master Battery - check voltage',
      'Fuel quantity - check all tanks (LH main, RH main, tip tanks if installed)',
      'Oxygen system pressure - check and record value',
      'Oxygen masks (crew) - accessible and condition check',
      'Fire extinguisher - check pin, gauge and condition',
      'ELT - armed',
      'Seat belts - all seats condition',
      'Avionics - Collins Pro Line 4 EFIS (PFD, MFD) - check',
      'TCAS - test and operational',
      'GPWS - test and operational',
      'Autopilot - test',
      'VHF 1 and VHF 2 - operational',
      'Transponder - operational and coded',
      'Pressurization system - check',
      'Anti-ice / De-ice - check',
      'Circuit breakers - all in',
      'Emergency equipment - check position and validity'
    ]},
    {s:'Section 2 - Nose Section',items:[
      'Nose cone - condition, no damage or cracks',
      'Pitot tubes (Captain and First Officer) - covers removed, clear, condition',
      'Static ports - clear',
      'AOA vane - condition and movement',
      'Total air temperature probe - condition',
      'Nose landing gear - strut extension, no hydraulic leaks',
      'NLG doors - condition and closing',
      'NLG tires - pressure, wear and condition (check for flat spots)',
      'NLG wheels - condition'
    ]},
    {s:'Section 3 - Left Wing',items:[
      'Wing skin - condition, no damage',
      'Leading edge - no dents or damage',
      'De-ice boots - condition, no cuts',
      'Fuel cap (LH) - locked and sealed',
      'Fuel vent - clear',
      'Navigation light (LH) - condition',
      'Aileron - condition, free movement',
      'Flap - condition',
      'Static dischargers - condition',
      'Wing panels - closed and secured'
    ]},
    {s:'Section 4 - Left Engine (JT15D-5)',items:[
      'Engine cowling - condition, secured',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel filter - condition',
      'Fuel drain - check for blockage',
      'Exhaust - condition, no cracks',
      'Thrust reverser - condition and locked',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 5 - Right Wing',items:[
      'Wing skin - condition, no damage',
      'Leading edge - no dents or damage',
      'De-ice boots - condition, no cuts',
      'Fuel cap (RH) - locked and sealed',
      'Fuel vent - clear',
      'Navigation light (RH) - condition',
      'Aileron - condition, free movement',
      'Flap - condition',
      'Static dischargers - condition',
      'Wing panels - closed and secured'
    ]},
    {s:'Section 6 - Right Engine (JT15D-5)',items:[
      'Engine cowling - condition, secured',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel filter - condition',
      'Fuel drain - check for blockage',
      'Exhaust - condition, no cracks',
      'Thrust reverser - condition and locked',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 7 - Main Landing Gear',items:[
      'LH MLG tires - pressure, wear, condition',
      'LH MLG wheels - condition',
      'LH MLG brakes - wear, no leaks',
      'LH MLG strut - extension, no leaks',
      'RH MLG tires - pressure, wear, condition',
      'RH MLG wheels - condition',
      'RH MLG brakes - wear, no leaks',
      'RH MLG strut - extension, no leaks',
      'MLG doors - condition and closing',
      'Gear pins - removed before flight'
    ]},
    {s:'Section 8 - Rear Fuselage and Empennage',items:[
      'Fuselage skin - condition, no damage',
      'Antennas - condition and fastening',
      'Horizontal stabilizer - condition',
      'Elevator - condition, free movement',
      'Vertical stabilizer - condition',
      'Rudder - condition, free movement',
      'Static dischargers (tail) - condition',
      'Beacon lights - condition',
      'All access panels - closed and secured'
    ]}
  ],
  'C750 - Citation X':[
    // FT 750-05-002 — Pre-Flight Inspection Worksheet — Model 750 (Citation X)
    // REDE ENERGIA | Rev. 01 | Ref: 750 Maintenance Manual P/N 75MM38
    // Each item uses: ✓ AC (Acceptable) | ✕ NA (Not Acceptable) | N/A (Not Applicable)
    {s:'Section 1 - Entry Door & Forward Windshields',items:[
      'Entry Door: paint damage, scratches, dents',
      'Entry Door: placard condition / interior & exterior door handles',
      'Entry Door: visor (scratches, deformations, sealing)',
      'Entry Door: opening & closing operation',
      'Entry Door: primary & secondary door seals',
      'Entry Door: door-locked indicator condition',
      'Entry Door: door runner condition',
      'LH Lateral / Weather Window: scratches, deformations, delamination',
      'LH Windshield: deformations, delamination',
      'LH Windshield: Humpseal condition'
    ]},
    {s:'Section 2 - Forward / Nose Area',items:[
      'LH Static Ports / Pitots: damage, deformations, blockage',
      'LH Avionics Bay: scratches, dents, deformations, door latch',
      'LH Avionics Bay: seal condition',
      'LH Avionics Bay: door opening & closing',
      'LH Avionics Bay: gas strut condition',
      'LH Avionics Bay: rack & module attachment',
      'LH Avionics Bay: N₂ pressure per placards',
      'LH Avionics Bay: O₂ bottle attachment',
      'Radome: scratches, deformations, impact damage',
      'Radome: paint condition',
      'Radome: Weather Erosion Boot condition',
      'Radome: attachment',
      'Nose Landing Gear: deformations, dents',
      'Nose Landing Gear: tire condition',
      'Nose Landing Gear: actuator & steering condition',
      'Nose Landing Gear: strut condition',
      'Nose Landing Gear: oil leak signs',
      'Nose Landing Gear: excessive play (gear & torque link)',
      'Nose Landing Gear: door (damage & alignment)',
      'Nose Landing Gear: taxi lights condition',
      'Nose Gear Bay: visible damage',
      'RH Windshield: scratches, deformations, delamination',
      'RH Windshield: Humpseal condition',
      'RH Avionics Bay: scratches, dents, deformations, door latch',
      'RH Avionics Bay: seal condition',
      'RH Avionics Bay: door opening & closing',
      'RH Avionics Bay: gas strut / mechanical lock condition',
      'RH Avionics Bay: rack & module attachment',
      'RH Avionics Bay: O₂ bottles attachment'
    ]},
    {s:'Section 3 - RH Fuselage, Windows & Wing',items:[
      'RH Static Ports / AOA Sensor: damage, deformations, blockage',
      'RH AOA Sensor: free rotation',
      'RH AOA Sensor: O₂ green expansion disc integrity',
      'RH Pitot: condition',
      'RH Lateral / Weather Window: scratches, deformations, delamination',
      'RH Passenger Windows: scratches, deformations, delamination',
      'RH Passenger Windows: sealant condition',
      'RH Passenger Windows: emergency exit condition',
      'RH Passenger Windows: wing lights & landing light',
      'RH Wing Leading Edge / Slat: dents, cracks, corrosion',
      'RH Wing Leading Edge / Slat: rivet condition',
      'RH Wing Leading Edge / Slat: hydraulic leaks',
      'RH Wing Leading Edge / Slat: refuel station bay condition',
      'RH Wing Tip: dents, cracks',
      'RH Wing Tip: lamp lens condition',
      'RH Wing Tip: rivet condition',
      'RH Wing Tip: static dischargers (attachment & integrity)',
      'RH Aileron: dents, cracks, deformations, excessive play',
      'RH Flaps (outboard/middle/inboard): dents, cracks, deformations',
      'RH Flaps: excessive play, delamination',
      'RH Flaps: hydraulic leaks',
      'RH Flaps: bearing & track condition',
      'RH Roll Spoilers / Speed Brake: dents, cracks, deformations',
      'RH Roll Spoilers / Speed Brake: excessive play',
      'RH Roll Spoilers / Speed Brake: hydraulic actuator leak',
      'RH Wing (upper & lower): dents',
      'RH Wing: fuel panel condition',
      'RH Wing: fuel leak signs',
      'RH Wing: fuel filler cap condition'
    ]},
    {s:'Section 4 - RH Landing Gear & Engine',items:[
      'RH Main Landing Gear: Trunnion damage',
      'RH Main Landing Gear: tire wear condition',
      'RH Main Landing Gear: brake wear condition',
      'RH Main Landing Gear: hydraulic leaks',
      'RH Main Landing Gear: actuator condition',
      'RH Main Landing Gear: door (attachment & damage)',
      'RH Main Landing Gear: uplock condition',
      'RH Pylon: dents, cracks, deformations',
      'RH Pylon: fuel / hydraulic oil leaks',
      'RH Pylon: ram air condition',
      'RH Engine Air Inlet: FOD signs',
      'RH Engine Air Inlet: rivet condition',
      'RH Engine Air Inlet: fan blade condition',
      'RH Engine Air Inlet: Inner Duct (cracks, loose/missing rivets)',
      'RH Engine Air Inlet: Spinner (attachment & FOD signs)',
      'RH Engine Nacelle (upper & lower): dents, cowling attachment',
      'RH Engine Nacelle: access panel attachment',
      'RH Engine Nacelle: placard condition',
      'RH Engine Nacelle: oil / fuel leak signs',
      'RH Engine Exhaust: dents, attachment',
      'RH Engine Exhaust: oil leak signs',
      'RH Engine Exhaust: reverser buckets (fairing, cracks, hydraulic leaks)',
      'RH Hydraulic Service Couplings: attachment',
      'RH Hydraulic Service Couplings: fairing condition',
      'RH Hydraulic Service Couplings: leaks'
    ]},
    {s:'Section 5 - Empennage',items:[
      'Battery Compartment: battery fairing condition',
      'Battery Compartment: battery attachment',
      'RH Horizontal Stabilizer: damage, dents, cracks',
      'RH Elevator: dents, deformations, cracks',
      'RH Elevator: static dischargers condition',
      'RH Elevator: hydraulic leak',
      'Vertical Stabilizer: dents, deformations, cracks',
      'Vertical Stabilizer: static dischargers condition',
      'Vertical Stabilizer: fairing & bullet condition',
      'Lower & Upper Rudder: dents, deformations, cracks',
      'Lower & Upper Rudder: alignment',
      'Lower & Upper Rudder: excessive play',
      'Lower & Upper Rudder: hydraulic leak',
      'Tailcone: dents, deformations, cracks',
      'Tailcone: APU exhaust condition',
      'Tailcone: delamination'
    ]},
    {s:'Section 6 - APU & LH Engine',items:[
      'APU: oil level & fairing condition',
      'LH Elevator: dents, deformations, cracks',
      'LH Elevator: hydraulic leak',
      'LH Horizontal Stabilizer: damage, dents, cracks',
      'LH Hydraulic Service Couplings: attachment',
      'LH Hydraulic Service Couplings: fairing condition',
      'LH Hydraulic Service Couplings: leaks',
      'LH Engine Exhaust: dents, attachment',
      'LH Engine Exhaust: oil leak signs',
      'LH Engine Exhaust: reverser buckets (fairing, cracks, hydraulic leaks)',
      'LH Engine Nacelle (upper & lower): dents, cowling attachment',
      'LH Engine Nacelle: access panel attachment',
      'LH Engine Nacelle: placard condition',
      'LH Engine Nacelle: oil / fuel leak signs',
      'LH Engine Air Inlet: FOD signs',
      'LH Engine Air Inlet: rivet condition',
      'LH Engine Air Inlet: fan blade condition',
      'LH Engine Air Inlet: Inner Duct (cracks, loose/missing rivets)',
      'LH Engine Air Inlet: Spinner (attachment & FOD signs)',
      'LH Pylon (upper & lower): dents, cracks, deformations',
      'LH Pylon: fuel / hydraulic oil leaks',
      'LH Pylon: air inlet condition'
    ]},
    {s:'Section 7 - LH Wing, Aft Compartments & Fuselage',items:[
      'Aft Baggage Compartment: scratches, dents, deformations, door latch',
      'Aft Baggage Compartment: door seal condition',
      'Aft Baggage Compartment: door opening & closing',
      'Aft Baggage Compartment: internal condition',
      'Aft Baggage Compartment: step / ladder condition (if installed)',
      'Air Conditioning Compartment: duct condition',
      'Air Conditioning Compartment: ACM / ECU (forward & aft) condition',
      'Air Conditioning Compartment: water separators, pneumatic valves, catalyzers',
      'LH Main Landing Gear: Trunnion damage',
      'LH Main Landing Gear: tire wear condition',
      'LH Main Landing Gear: brake wear condition',
      'LH Main Landing Gear: hydraulic leaks',
      'LH Main Landing Gear: actuator condition',
      'LH Main Landing Gear: door (attachment & damage)',
      'LH Main Landing Gear: uplock condition',
      'LH Flaps (outboard/middle/inboard): dents, cracks, deformations',
      'LH Flaps: excessive play, delamination',
      'LH Flaps: hydraulic leaks',
      'LH Flaps: bearing & track condition',
      'LH Roll Spoilers / Speed Brake: dents, cracks, deformations',
      'LH Roll Spoilers / Speed Brake: excessive play',
      'LH Roll Spoilers / Speed Brake: hydraulic actuator leak',
      'LH Aileron: dents, cracks, deformations, excessive play',
      'LH Wing Tip: dents, cracks',
      'LH Wing Tip: lamp lens condition',
      'LH Wing Tip: rivet condition',
      'LH Wing Tip: static dischargers (attachment & integrity)',
      'LH Wing Leading Edge / Slat: dents, cracks, corrosion',
      'LH Wing Leading Edge / Slat: rivet condition',
      'LH Wing Leading Edge / Slat: hydraulic leaks',
      'LH Wing Leading Edge / Slat: wing lights & landing light',
      'LH Passenger Windows: scratches, deformations, delamination',
      'LH Passenger Windows: sealant condition',
      'Fuselage (upper & lower): scratches, deformations, dents',
      'Fuselage: rivet condition',
      'Fuselage: antenna condition',
      'Fuselage: drain condition (damage & blockage)',
      'Fuselage: fairings general condition'
    ]},
    {s:'Section 8 - Interior Inspection',items:[
      'Seats: upholstery / leather damage',
      'Seats: seat adjustment operation',
      'Seats: seat belt functionality',
      'Sidewall Panels: loose, scratched, torn, dirty',
      'Carpet & Ceiling: ceiling panel loose',
      'Carpet & Ceiling: carpet loose',
      'Carpet & Ceiling: carpet / ceiling soiled',
      'Cabin Lighting & Air Outlets: lamp operation',
      'Cabin Lighting & Air Outlets: luminous alert operation',
      'Window Shades: opening & closing',
      'Window Shades: physical condition & cleanliness',
      'Galley: cabinet physical condition',
      'Galley: drawer / door opening & closing',
      'Galley: lighting condition',
      'Equipment Check: jungle survival kit',
      'Equipment Check: first aid kit',
      'Equipment Check: aircraft documents & logbook',
      'Equipment Check: portable fire extinguishers',
      'Equipment Check: Pitot & engine covers (stowed)',
      'Equipment Check: life vests',
      'Equipment Check: crew O₂ masks',
      'Equipment Check: headsets & microphones'
    ]},
    {s:'Section 9 - Cockpit & Functional Test',items:[
      'Cockpit: pilot seat condition',
      'Cockpit: seat belt functionality',
      'Cockpit: instrument panel physical condition',
      'Cockpit: sidewall & ceiling panel condition',
      'Cockpit: window opening & closing',
      'Cockpit: circuit breaker panel condition',
      'Cockpit: Glareshield & Control Wheel condition',
      'Cockpit: fuel quantity LH _____ / RH _____ / CTL _____',
      'Cockpit Functional Test: cabin lighting',
      'Cockpit Functional Test: air outlet operation',
      'Engine Functional Test: start & stabilize at idle',
      'Functional Test: O₂ pressure & engine instrument indication',
      'Functional Test: power test per N1 of the day',
      'Functional Test: generator operation',
      'Functional Test: external lights operation',
      'Functional Test: flap / aileron / spoiler / elevator systems',
      'Functional Test: brake system (pedals & parking brake)',
      'Functional Test: communication & radio systems',
      'Functional Test: hydraulic & fuel systems',
      'Functional Test: APU & Air Conditioning / Pneumatic',
      'Functional Test: Anti-Ice system',
      'Functional Test: Rotary Test'
    ]}
  ],
  'C525 - CJ1':[
    {s:'Section 1 - Cockpit / Interior Inspection',items:[
      'Documents (CofA, Registration, AFM, Pilot Checklist) - check',
      'Battery master - voltage check',
      'Fuel quantity - check (LH and RH tanks)',
      'Oxygen pressure - check and record',
      'Crew oxygen masks - accessible',
      'Fire extinguisher - pin, gauge, condition',
      'ELT - armed',
      'Avionics - Garmin G1000 avionics suite - check',
      'TCAS - test and operational',
      'GPWS - test and operational',
      'Autopilot - test',
      'VHF 1 and VHF 2 - operational',
      'Transponder - operational',
      'Pressurization - check',
      'Anti-ice - check',
      'Circuit breakers - all in',
      'Seat belts - all seats condition'
    ]},
    {s:'Section 2 - Nose / NLG',items:[
      'Nose cone - condition',
      'Pitot tubes (Captain, First Officer) - covers removed, clear',
      'Static ports - clear',
      'Nose landing gear - strut, no leaks',
      'NLG tires - pressure, wear and condition',
      'NLG wheels - condition',
      'NLG doors - condition and closing',
      'Landing light - condition'
    ]},
    {s:'Section 3 - Left Wing',items:[
      'Wing skin - condition, no damage',
      'Leading edge - condition, no dents',
      'De-ice boots - condition',
      'Fuel cap (LH) - locked and sealed',
      'Navigation light (LH) - condition',
      'Aileron - condition, free movement',
      'Flap - condition',
      'Static dischargers - condition',
      'Wing panels - closed and secured'
    ]},
    {s:'Section 4 - Left Engine (Williams FJ44-1A)',items:[
      'Engine cowling - condition, secured',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel drain - check for blockage',
      'Exhaust - condition, no cracks',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 5 - Right Wing',items:[
      'Wing skin - condition, no damage',
      'Leading edge - condition, no dents',
      'De-ice boots - condition',
      'Fuel cap (RH) - locked and sealed',
      'Navigation light (RH) - condition',
      'Aileron - condition, free movement',
      'Flap - condition',
      'Static dischargers - condition',
      'Wing panels - closed and secured'
    ]},
    {s:'Section 6 - Right Engine (Williams FJ44-1A)',items:[
      'Engine cowling - condition, secured',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel drain - check for blockage',
      'Exhaust - condition, no cracks',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 7 - Main Landing Gear',items:[
      'LH MLG tires - pressure, wear, condition',
      'LH MLG wheels - condition',
      'LH MLG brakes - wear, no leaks',
      'LH MLG strut - extension, no leaks',
      'RH MLG tires - pressure, wear, condition',
      'RH MLG wheels - condition',
      'RH MLG brakes - wear, no leaks',
      'RH MLG strut - extension, no leaks',
      'Gear pins - removed before flight'
    ]},
    {s:'Section 8 - Rear Fuselage and Empennage',items:[
      'Fuselage skin - condition, no damage',
      'Horizontal stabilizer - condition',
      'Elevator - condition, free movement',
      'Vertical stabilizer - condition',
      'Rudder - condition, free movement',
      'Static dischargers (tail) - condition',
      'Beacon lights - condition',
      'All access panels - closed and secured'
    ]}
  ],
  'C525B - CJ3':[
    {s:'Section 1 - Cockpit / Interior Inspection',items:[
      'Documents (CofA, Registration, AFM, Pilot Checklist) - check',
      'Battery master - voltage check',
      'Fuel quantity - check (LH and RH tanks)',
      'Oxygen pressure - check and record',
      'Crew oxygen masks - accessible and condition',
      'Fire extinguisher - pin, gauge, condition',
      'ELT - armed',
      'Avionics - Garmin G1000 (3-screen suite) - check',
      'TCAS II - test and operational',
      'EGPWS - test and operational',
      'Autopilot / Yaw Damper - test',
      'VHF 1 and VHF 2 - operational',
      'HF (if installed) - operational',
      'Transponder - operational',
      'FMS - route programmed and checked',
      'Pressurization - check',
      'Anti-ice - check',
      'Circuit breakers - all in',
      'Seat belts - all seats condition'
    ]},
    {s:'Section 2 - Nose / NLG',items:[
      'Nose cone - condition',
      'Pitot tubes (Captain and First Officer) - covers removed, clear',
      'Static ports - clear',
      'AOA sensor - condition',
      'Nose landing gear - strut extension, no leaks',
      'NLG tires - pressure, wear and condition',
      'NLG wheels - condition',
      'NLG doors - condition and closing'
    ]},
    {s:'Section 3 - Left Wing',items:[
      'Wing skin - condition, no damage',
      'Leading edge - condition, no dents',
      'De-ice boots - condition, no cuts',
      'Fuel cap (LH) - locked and sealed',
      'Navigation light (LH) - condition',
      'Winglet - condition, no damage',
      'Aileron - condition, free movement',
      'Flap - condition',
      'Static dischargers - condition',
      'Wing panels - closed and secured'
    ]},
    {s:'Section 4 - Left Engine (Williams FJ44-3A)',items:[
      'Engine cowling - condition, secured',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel drain - check for blockage',
      'Exhaust - condition, no cracks',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 5 - Right Wing',items:[
      'Wing skin - condition, no damage',
      'Leading edge - condition, no dents',
      'De-ice boots - condition, no cuts',
      'Fuel cap (RH) - locked and sealed',
      'Navigation light (RH) - condition',
      'Winglet - condition, no damage',
      'Aileron - condition, free movement',
      'Flap - condition',
      'Static dischargers - condition',
      'Wing panels - closed and secured'
    ]},
    {s:'Section 6 - Right Engine (Williams FJ44-3A)',items:[
      'Engine cowling - condition, secured',
      'Intake - clear of FOD, no damage',
      'Fan blades - condition, no nicks or cracks',
      'Oil level - check and record',
      'Fuel drain - check for blockage',
      'Exhaust - condition, no cracks',
      'Access panels - all closed and latched'
    ]},
    {s:'Section 7 - Main Landing Gear',items:[
      'LH MLG tires - pressure, wear, condition',
      'LH MLG wheels - condition',
      'LH MLG brakes - wear, no leaks',
      'LH MLG strut - extension, no leaks',
      'RH MLG tires - pressure, wear, condition',
      'RH MLG wheels - condition',
      'RH MLG brakes - wear, no leaks',
      'RH MLG strut - extension, no leaks',
      'Gear pins - removed before flight'
    ]},
    {s:'Section 8 - Rear Fuselage and Empennage',items:[
      'Fuselage skin - condition, no damage',
      'Horizontal stabilizer - condition',
      'Elevator - condition, free movement',
      'Vertical stabilizer - condition',
      'Rudder - condition, free movement',
      'Static dischargers (tail) - condition',
      'Beacon lights - condition',
      'All access panels - closed and secured'
    ]}
  ],
  'Gulfstream G280':[
    {s:'Section 1 - Cockpit Preflight Inspection',items:[
      'Certificates - check availability and validity',
      'Flight Log, Flight Manual, Trip Books and Charts - check',
      'Weight and Balance - calculate',
      'Cockpit and Cabin Portable Fire Extinguishers - charged and secured',
      'First Aid Kit - unsealed and valid',
      'Crash Axe (if installed) - secured',
      'Circuit Breakers - checked, all in',
      'LANDING GEAR Lever - down',
      'STBY BATT - on',
      'EMER BUS - BATT ON (wait 10 seconds, verify DU1 and CDU1 are ON)',
      'EMER BUS - off',
      'Both BATT - on',
      'Overhead Panel and Pedestal Pushbuttons - all off (out) except: BATT, STBY BATT, ENG GEN, APU GEN, UTILITY, PACK, TEMP CONTROL, CPCS MODE MAN, COCKPIT LTS MASTER',
      'Fuel Quantity, Type and Distribution - check',
      'PARK BRAKE - set (operate left EMP if brake accumulator below 1300 PSI)',
      'GUST LOCK - unlocked',
      'APU - as required'
    ]},
    {s:'Section 2 - Left Forward Fuselage',items:[
      'Ground area - free of foreign objects',
      'Fuselage, all surfaces, lights and antennas - condition check during walk-around',
      'Inspect for evidence of leaks: fuel, oil and hydraulics',
      'Main Entry Door - check condition and latching',
      'Main Entry Door Light - check',
      'Main Entry Door Emergency Exit Handle - check',
      'Left AOA Vane - cover removed, check condition and free movement',
      'Left Pitot, Ice Detector and TAT Probes - covers removed, check',
      'Side Window / Windshield - check',
      'Left Nose Avionics Door - closed',
      'Radome / EVS Window - check',
      'Nose Landing Gear Doors - check condition and actuating rods',
      'Nose Landing Gear - check harnesses, hoses, structure and taxi lights',
      'Nose Wheels and Tires - pressure, wear and condition',
      'Nose Landing Gear Safety Pin - removed',
      'Nose Landing Gear Strut Extension - as required',
      'Tow Bar Adapter - secured (shear pin and cotter pin installed)',
      'Oxygen Discharge Indicator and Pressure - check',
      'Nose Compartment Ventilation Inlets and Outlets - check clear'
    ]},
    {s:'Section 3 - Right Forward Fuselage',items:[
      'Right AOA Vane - cover removed, check',
      'Right Pitot and Ice Detector Probes - covers removed, check',
      'STBY Pitot - cover removed, check',
      'Side Window / Windshield - check',
      'Right Nose Avionics Door - closed',
      'Outflow Valve - check open, clear of obstructions',
      'Right Static Ports and RVSM Region - covers removed, check',
      'Window Emergency Releases / Windows - secure, check',
      'Right Ice Inspection Light - check condition',
      'Antennas - check',
      'Refuel Defuel Panels (RDP) - check and closed',
      'Forward Emergency Lights (above and below wing) - check'
    ]},
    {s:'Section 4 - Right Wing Area',items:[
      'Right Landing Light - check',
      'Wing Leading Edge - check',
      'Wing Fuel Vent - clear',
      'Gravity Fueling Filler Cap Access Panel - secured',
      'NAV / Strobe Lights - check',
      'Winglet and Aileron Static Wicks - check',
      'Aileron Surface and Tab - check alignment',
      'Aileron / Aileron Gear Tab / Flaps / Spoilers - check surfaces, attach points, actuators',
      'MLG Fairing Door / Strut (RH) - check alignment within red band and actuating rods',
      'MLG Brake Wear Indicator inboard/outboard (RH) - check',
      'MLG WOW (RH) - check',
      'MLG Strut Extension (RH) - 1 inch minimum',
      'MLG Tires Pressure (RH) - check',
      'MLG Uplock (RH) - check (if not open, gear will not lock up after retraction)',
      'MLG Wheel and Brake (RH) - check',
      'MLG Safety Pin (RH) - remove'
    ]},
    {s:'Section 5 - Right Aft Fuselage',items:[
      'Emergency Exit (RH) - secured',
      'Dorsal Fin Air Scoop - clear',
      'Hydraulic Accumulators / Pneumatic Bottle Pre-charge - check (ref. page 11/20)',
      'HYD MAINT / R BATT / WATER and WASTE Service Doors - closed',
      'Engine Intake Ground Cover (RH) - removed',
      'Nacelle Intake and Probes (RH) - clear',
      'Fan Blades (RH) - check condition',
      'Cowling and Latches (RH) - secured',
      'Exhaust Ground Cover (RH) - removed',
      'Exhaust (RH) - clear',
      'Rear Turbine Blades (RH) - check condition',
      'Heat Exchanger Outlet - clear',
      'AIR Conditioning Unit Outlet - clear',
      'Pre-cooler Exhaust - clear',
      'APU Inlet Door - closed'
    ]},
    {s:'Section 6 - Tail Area / Empennage',items:[
      'Empennage - check condition',
      'Battery Vents - clear',
      'Tail Compartment Door - closed',
      'Horizontal Stabilizer - check condition',
      'Static Wicks (tail) - check',
      'Rudder - check',
      'Tail Position and Logo Lights - check condition',
      'APU Tailpipe - check',
      'APU Service Door - closed',
      'APU Generator Inlet - clear'
    ]},
    {s:'Section 7 - Left Aft Fuselage',items:[
      'Engine Intake Ground Cover (LH) - removed',
      'Nacelle Intake and Probes (LH) - clear',
      'Fan Blades (LH) - check condition',
      'Cowling and Latches (LH) - secured',
      'Exhaust Ground Cover (LH) - removed',
      'Exhaust (LH) - clear',
      'Rear Turbine Blades (LH) - check condition',
      'Air Turbine Starter Door - as required',
      'Baggage Door - secure',
      'L BATT / EXT PWR Doors - closed / as required'
    ]},
    {s:'Section 8 - Left Wing Area',items:[
      'MLG Fairing Door / Strut (LH) - check alignment within red band and actuating rods',
      'MLG Brake Wear Indicator inboard/outboard (LH) - check',
      'MLG WOW (LH) - check',
      'MLG Strut Extension (LH) - 1 inch minimum',
      'MLG Tires / Brakes / Plugs (LH) - check',
      'MLG Uplock (LH) - check (if not open, gear will not lock up after retraction)',
      'MLG Wheel Well Area (LH) - check',
      'MLG Safety Pin (LH) - remove',
      'Aileron / Aileron Gear Tab / Flaps / Spoilers (LH) - check',
      'Aileron Surface and Tab (LH) - check alignment',
      'Winglet and Aileron Static Wicks (LH) - check',
      'NAV / Strobe Lights (LH) - check',
      'Gravity Fueling Filler Cap Access Panel (LH) - secure',
      'Wing Fuel Vent (LH) - clear',
      'Wing Leading Edge (LH) - check',
      'Left Landing Light - check'
    ]},
    {s:'Section 9 - Left Forward Fuselage Final',items:[
      'Windows - check intact and clean',
      'Left Ice Inspection Light - check condition',
      'Left Static Ports and RVSM Region - clear',
      'Emergency Lights - check',
      'Landing Gear Safety Pins / Pitot Probe Covers - stowed'
    ]},
    {s:'Section 10 - Documents and Final Checks',items:[
      'Mandatory Documents Folder - check',
      'Flight Logbook - check',
      'Engine LH - run performed | Add oil: _____ qt',
      'Engine RH - run performed | Add oil: _____ qt',
      'APU - run performed | Add oil: _____ qt',
      'Q.T.U (Hydraulic Left) - check | Quantity: _____',
      'Q.T.A (Hydraulic Right) - check | Quantity: _____',
      'Brake accumulator precharge - 700 ±30 psi at 70°F (21°C)',
      'Left hydraulic reservoir level - 47-60% (pressurized)',
      'Right hydraulic reservoir level - 30-41% (pressurized)'
    ]}
  ],
  'Other':[
    {s:'Documentation',items:['Certificate of Airworthiness','Aircraft Registration','Flight Manual','Pilot License','Aviation Insurance']},
    {s:'General Inspection',items:['Fuselage','Engines','Control surfaces','Landing gear']},
    {s:'Fuel',items:['Fuel level','Contamination check','Oil level']},
    {s:'Safety',items:['Seat belts','Fire extinguisher','ELT']}
  ]
};

// ===== STATE =====
var ME=null,AVS=[],FINS=[],FT=null,FD=null,currentFinIdx=-1;

function isAdm(role){ return role==='adm'||role==='dev'; }

try{var _a=localStorage.getItem('tb7');if(_a)AVS=JSON.parse(_a);}catch(e){AVS=[];}
try{var _f=localStorage.getItem('tb7f');if(_f)FINS=JSON.parse(_f);}catch(e){FINS=[];}

// ===== ACTIVITY LOG =====
var ACTLOG=[];
try{var _al=localStorage.getItem('tb7_actlog');if(_al)ACTLOG=JSON.parse(_al);}catch(e){ACTLOG=[];}

function _saveActLog(){try{localStorage.setItem('tb7_actlog',JSON.stringify(ACTLOG));}catch(e){}}

function logActivity(action,detail){
  if(!ME)return;
  var entry={ts:Date.now(),u:ME.u,nome:ME.nome,action:action,detail:detail||''};
  ACTLOG.unshift(entry);
  if(ACTLOG.length>500)ACTLOG=ACTLOG.slice(0,500);
  _saveActLog();
  // Push to shared cloud log (all admins see all users' activity)
  if(typeof _UPSTASH_URL!=='undefined'){
    fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify([['LPUSH','tb7_actlog_v1',JSON.stringify(entry)],['LTRIM','tb7_actlog_v1','0','499']])
    }).catch(function(){});
  }
}

function clearActLog(){
  ACTLOG=[];_saveActLog();
  if(typeof _UPSTASH_URL!=='undefined'){
    fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify([['DEL','tb7_actlog_v1']])
    }).catch(function(){});
  }
  renderAdmLog();
}

function deleteActLogEntry(ts){
  if(!confirm('Delete this activity log entry?')) return;
  ACTLOG=ACTLOG.filter(function(e){return e.ts!==ts;});
  _saveActLog();
  if(typeof _UPSTASH_URL!=='undefined'){
    var cmds=[['DEL','tb7_actlog_v1']].concat(ACTLOG.slice().reverse().map(function(e){return['RPUSH','tb7_actlog_v1',JSON.stringify(e)];}));
    fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify(cmds)
    }).catch(function(){});
  }
  renderAdmLog();
  _showToast('✅ Entry deleted','ok');
}

function _actLogChecked(){
  return Array.from(document.querySelectorAll('#adm-log-content input[type=checkbox][data-ts]:checked'));
}
function actLogCheckChange(){
  var checked=_actLogChecked();
  var bar=document.getElementById('actlog-bulk-bar');
  var cnt=document.getElementById('actlog-bulk-count');
  if(bar) bar.style.display=checked.length?'flex':'none';
  if(cnt) cnt.textContent=checked.length+' selected';
}
function actLogSelectAll(){
  document.querySelectorAll('#adm-log-content input[type=checkbox][data-ts]').forEach(function(cb){cb.checked=true;});
  actLogCheckChange();
}
function actLogDeselectAll(){
  document.querySelectorAll('#adm-log-content input[type=checkbox][data-ts]').forEach(function(cb){cb.checked=false;});
  actLogCheckChange();
}
function actLogDeleteSelected(){
  var checked=_actLogChecked();
  if(!checked.length)return;
  if(!confirm('Delete '+checked.length+' selected entr'+(checked.length===1?'y':'ies')+'?'))return;
  var toDelete={};
  checked.forEach(function(cb){toDelete[Number(cb.dataset.ts)]=true;});
  ACTLOG=ACTLOG.filter(function(e){return!toDelete[e.ts];});
  _saveActLog();
  if(typeof _UPSTASH_URL!=='undefined'){
    var cmds=[['DEL','tb7_actlog_v1']].concat(ACTLOG.slice().reverse().map(function(e){return['RPUSH','tb7_actlog_v1',JSON.stringify(e)];}));
    fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify(cmds)
    }).catch(function(){});
  }
  renderAdmLog();
  _showToast('✅ '+checked.length+' entr'+(checked.length===1?'y':'ies')+' deleted','ok');
}

function sv(){try{localStorage.setItem('tb7',JSON.stringify(AVS));}catch(e){}if(typeof cloudSave==='function')cloudSave();}
function svf(){try{localStorage.setItem('tb7f',JSON.stringify(FINS));}catch(e){}if(typeof cloudSave==='function')cloudSave();}

function dh(){var d=new Date(),z=function(x){return String(x).padStart(2,'0');};return z(d.getDate())+'/'+z(d.getMonth()+1)+'/'+d.getFullYear()+' '+z(d.getHours())+':'+z(d.getMinutes());}
function sgRes(cl){
  var all=[];
  for(var s=0;s<cl.length;s++)for(var i=0;i<cl[s].items.length;i++){
    var it=cl[s].items[i];
    if(it.type==='select')continue; // select-type items are optional; don't affect result
    all.push(it.st);
  }
  if(all.indexOf('na')>-1)return'danger';
  if(all.indexOf('re')>-1)return'warn';
  var pre=0;for(var x=0;x<all.length;x++)if(all[x])pre++;
  if(pre===all.length&&all.length>0)return'ok';
  return'neutral';
}

window.onload=function(){
  document.getElementById('pg-login').style.display='flex';
  document.getElementById('pg-main').style.display='none';
  document.getElementById('lu').onkeydown=function(e){if(e.key==='Enter')login();};
  document.getElementById('lp').onkeydown=function(e){if(e.key==='Enter')login();};
  updateSerialHint();
  // Load latest user list from cloud so newly-created users can login from any device
  if(typeof _loadAdminDataFromCloud==='function')_loadAdminDataFromCloud(function(){});

  // ── Pre-load logo for PDF export ─────────────────────────
window._logoTB=new Image();
window._logoTB.src='logo_tbaviation 2020-02.png';
  // ─────────────────────────────────────────────────────────

  // ── Floating scroll-to-top button ────────────────────────
  var _fab=document.getElementById('fab-top');
  if(_fab){
    window.addEventListener('scroll',function(){
      _fab.classList.toggle('visible',window.scrollY>320);
    },{passive:true});
  }
};

function updateSerialHint(){
  var sel=document.getElementById('f-mod');
  var inp=document.getElementById('f-serie');
  var hint=document.getElementById('hint-serie');
  if(!sel||!inp)return;
  var h=SERIE_HINT[sel.value]||'Enter serial number';
  inp.placeholder=h;
  if(hint)hint.textContent=sel.value?('Format: '+h):'';
}

// ===== LOGIN =====
function login(){
  var u=document.getElementById('lu').value.trim();
  var p=document.getElementById('lp').value.trim();
  var found=null;
  var all=getAllUsers();
  for(var i=0;i<all.length;i++){var _sp=USERS_PWD_OVERRIDES[all[i].u]||all[i].p;if(all[i].u===u&&_checkPw(_sp,p)){found=all[i];break;}}
  
  if(found){
    ME=found;
    // Show loading message while syncing from cloud
    document.getElementById('le').style.color='#4A90D9';
    document.getElementById('le').textContent='⏳ Syncing data...';

    function _afterLoad(){
      document.getElementById('pg-login').style.display='none';
      document.getElementById('pg-main').style.display='block';
      document.getElementById('huser').textContent='Hello, '+found.nome;
      document.getElementById('le').textContent='';
      document.getElementById('le').style.color='';
      document.getElementById('hadm').style.display=(found.role==='adm')?'inline-block':'none';
      var hdevEl=document.getElementById('hdev');
      if(hdevEl) hdevEl.style.display=(found.role==='dev')?'inline-block':'none';
      document.getElementById('form-adm').style.display=isAdm(found.role)?'block':'none';
      var fVTIVTE=document.getElementById('form-vtivte-adm');
      if(fVTIVTE) fVTIVTE.style.display=isAdm(found.role)?'block':'none';
      var tbAdmBtn=document.getElementById('tb-adm');
      if(tbAdmBtn) tbAdmBtn.style.display=isAdm(found.role)?'':'none';
      var devChangesTab=document.getElementById('adm-tab-changes');
      if(devChangesTab) devChangesTab.style.display=(found.role==='dev')?'inline-block':'none';
      // Show feedback button for all users; admins load unread count
      var fbBtn=document.getElementById('btn-feedback');
      if(fbBtn) fbBtn.style.display='inline-block';
      logActivity('login','');
      // Load aircraft photos from cloud for ALL users (needed for PDF exports)
      if(typeof _loadRegImgsFromCloud==='function') _loadRegImgsFromCloud(function(){});
      if(isAdm(found.role)){
        fbLoadUnreadBadge();
        // Migrate any locally-stored reg photos to cloud (one-time upload)
        _AC_REGS.forEach(function(r){if(REG_IMGS[r])_svRegImgCloud(r,REG_IMGS[r]);});
        // Migrate existing local ACTLOG entries to cloud (one-time only)
        if(ACTLOG.length&&typeof _UPSTASH_URL!=='undefined'&&!localStorage.getItem('tb7_actlog_migrated')){
          var cmds=ACTLOG.map(function(e){return['RPUSH','tb7_actlog_v1',JSON.stringify(e)];});
          cmds.push(['LTRIM','tb7_actlog_v1','0','499']);
          fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify(cmds)})
            .then(function(){localStorage.setItem('tb7_actlog_migrated','1');})
            .catch(function(){});
        }
      }
      aba('active');
      render();
      renderFin();
      if(typeof renderFinVTIVTE==='function') renderFinVTIVTE();
      if(typeof renderVTIVTE==='function') renderVTIVTE();
    }

    // Try to load from cloud first; fall back immediately if unavailable
    if(typeof cloudLoad==='function'){
      cloudLoad(found.u, function(){ _afterLoad(); if(typeof _startCloudAutoRefresh==='function')_startCloudAutoRefresh(); });
    } else {
      _afterLoad();
    }

  }else{
    document.getElementById('le').textContent='Incorrect username or password.';
  }
}

function logout(){
  if(typeof _stopCloudAutoRefresh==='function')_stopCloudAutoRefresh();
  ME=null;
  document.getElementById('pg-login').style.display='flex';
  document.getElementById('pg-main').style.display='none';
  document.getElementById('lu').value='';
  document.getElementById('lp').value='';
  var fbBtn=document.getElementById('btn-feedback');
  if(fbBtn) fbBtn.style.display='none';
  document.getElementById('le').textContent='';
}
// ===== MANDATORY DOCUMENTS STATE =====
var MAND=[],MAND_EXTRA=[];

try{var _m=localStorage.getItem('tb7m');if(_m)MAND=JSON.parse(_m);}catch(e){MAND=[];}

try{var _me=localStorage.getItem('tb7me');if(_me)MAND_EXTRA=JSON.parse(_me);}catch(e){MAND_EXTRA=[];}

function svMand(){try{localStorage.setItem('tb7m',JSON.stringify(MAND));}catch(e){}if(typeof cloudSave==='function')cloudSave();}

function svMandExtra(){try{localStorage.setItem('tb7me',JSON.stringify(MAND_EXTRA));}catch(e){}if(typeof cloudSave==='function')cloudSave();}

// ===== MANDATORY DOCUMENTS TEMPLATE =====
var MAND_TEMPLATE={
  'Required Documents':[
    'Certificate of Airworthiness (CA)',
    'Certificate of Registration (CM)',
    'Airworthiness Verification Certificate (CVA)',
    'ANATEL Station License',
    'ANATEL Tax Payment Proof (FISTEL/FOMENTO)',
    'Weight and Balance Sheet',
    'RVSM Report – F-900-44B',
    'PBN Report – F-900-76C'
  ],
  'LOAs':[
    'LOA RVSM',
    'LOA PBN',
    'LOA NAT-HLA',
    'LOA CPDLC',
    'LOA EFVS',
    'LOA eDB',
    'LOA GRF'
  ],
  'Insurance':[
    'Civil Liability Insurance (RETA)',
    'Hull/Aircraft Insurance (LUC)'
  ],
  'Supplementary Documents':[
    'Minimum Equipment List (MEL) - On Board Revision',
    'Aircraft Flight Manual (AFM) - On Board Revision',
    'Quick Reference Handbook/Checklist - On Board Revision'
  ],
  'Optional / Not Required':[
    'CVA - NOTE: Replaced by Initial Technical Inspection Report (VTI)',
    'NSCA 3-13 - NOTE: No longer required since 2021'
  ]
};
// Load any admin-saved custom template overrides
(function(){
  try{var _cc=localStorage.getItem('tb7_cl_custom');if(_cc){var _ccp=JSON.parse(_cc);Object.keys(_ccp).forEach(function(k){CL[k]=_ccp[k];});}}catch(e){}
  try{var _mc=localStorage.getItem('tb7_mand_custom');if(_mc){var _mcp=JSON.parse(_mc);Object.keys(_mcp).forEach(function(k){MAND_TEMPLATE[k]=_mcp[k];});}}catch(e){}
})();
function toggleCustomModel(){
  var sel=document.getElementById('f-mod');
  document.getElementById('grp-custom').style.display=sel.value==='Other'?'block':'none';
  if(sel.value!=='Other')document.getElementById('f-mod-custom').value='';
  updateSerialHint();
}

// ===== ADD AIRCRAFT =====
function addAircraft(){
  var mat=document.getElementById('f-mat').value.toUpperCase().trim();
  var serie=document.getElementById('f-serie').value.trim();
  var modSel=document.getElementById('f-mod').value;
  var resp=document.getElementById('f-resp').value;
  var mod=modSel;
  if(modSel==='Other'){
    mod=document.getElementById('f-mod-custom').value.trim();
    if(!mod){alert('Please enter a custom model name.');return;}
  }
  if(!mat||!serie||!modSel||!resp){alert('Please fill in all required fields.');return;}
  var tpl=CL[modSel]||CL['Other'];
  var cl=[];
  for(var s=0;s<tpl.length;s++){
    var sec={s:tpl[s].s,items:[]};
    for(var i=0;i<tpl[s].items.length;i++){
      var tIt=tpl[s].items[i];
      var iN=typeof tIt==='string'?tIt:tIt.n;
      var iT=typeof tIt==='object'&&tIt.type?tIt.type:'standard';
      sec.items.push({n:iN,type:iT,st:'',by:'',dt:'',obs:'',fotos:[]});
    }
    cl.push(sec);
  }
  AVS.push({mat:mat,serie:serie,mod:mod,resp:resp,dc:dh(),files:[],cl:cl});
  logActivity('add_flight',mat+' ('+mod+')');
  sv();render();
  document.getElementById('f-mat').value='';
  document.getElementById('f-serie').value='';
  document.getElementById('f-mod').value='';
  document.getElementById('f-resp').value='';
  document.getElementById('f-mod-custom').value='';
  document.getElementById('grp-custom').style.display='none';
  updateSerialHint();
}

// ===== SAVE OBSERVATION =====
function saveObs(ai,si,ii,val){AVS[ai].cl[si].items[ii].obs=val;sv();}

// ===== RENDER ACTIVE =====
function render(){
  // Remove any AVS record that already has a finalized flight counterpart in FINS
  var _finsFlight=(FINS||[]).filter(function(f){return f.type==='flight'||(!f.type&&!f.mand);});
  var _staleAvs=[];
  for(var _ai=0;_ai<AVS.length;_ai++){
    var _av=AVS[_ai];
    if(_finsFlight.some(function(f){return f.mat===_av.mat&&f.mod===_av.mod&&(f.serie||'')===((_av.serie)||'');})){
      _staleAvs.push(_ai);
    }
  }
  if(_staleAvs.length){
    for(var _si=_staleAvs.length-1;_si>=0;_si--)AVS.splice(_staleAvs[_si],1);
    sv();
  }

  var filtro=document.getElementById('busca')?document.getElementById('busca').value.toLowerCase():'';
  var lista=document.getElementById('lista');
  if(!lista)return;
  lista.innerHTML='';
  var found=[];
  for(var a=0;a<AVS.length;a++){
    var av=AVS[a];
    if(av.mat.toLowerCase().indexOf(filtro)>-1||
       av.mod.toLowerCase().indexOf(filtro)>-1||
       (av.serie&&av.serie.toLowerCase().indexOf(filtro)>-1))
      found.push(a);
  }
  if(!found.length){lista.innerHTML='<p class="empty">No aircraft found.</p>';return;}

  for(var fi=0;fi<found.length;fi++){
    var idx=found[fi];
    var av=AVS[idx];
    var res=sgRes(av.cl);
    var bCls='neutral',bLbl='PENDING';
    if(res==='ok'){bCls='ok';bLbl='✓ ALL ACCEPTABLE';}
    if(res==='warn'){bCls='warn';bLbl='R WITH RESTRICTIONS';}
    if(res==='danger'){bCls='danger';bLbl='✕ NOT ACCEPTABLE';}

    // ── Section jump bar (mobile quick-navigation) ───────────
    var jumpBar='<div class="sec-jump-bar">';
    for(var sj=0;sj<av.cl.length;sj++){
      jumpBar+='<button class="sec-jump-pill" onclick="document.getElementById(\'sec-'+idx+'-'+sj+'\').scrollIntoView({behavior:\'smooth\',block:\'start\'})">'+('S'+(sj+1)+' '+av.cl[sj].s).substring(0,18)+'</button>';
    }
    jumpBar+='</div>';

    var clH='';
    for(var s=0;s<av.cl.length;s++){
      var sec=av.cl[s];
      clH+='<div class="cl-sec" id="sec-'+idx+'-'+s+'"><h4>'+sec.s+'</h4>';
      for(var i=0;i<sec.items.length;i++){
        var it=sec.items[i];
        var aOn=it.st==='ac'?' on':'';
        var rOn=it.st==='re'?' on':'';
        var nOn=it.st==='na'?' on':'';
        var pOn=it.st==='np'?' on':'';
        var obsVal=it.obs?it.obs.replace(/"/g,'&quot;'):'';
        var itemType=it.type||'standard';
        clH+='<div class="cl-item-new" id="item-'+idx+'-'+s+'-'+i+'">';
  clH+='<div class="cl-item-header">';
    var hasQtyField=(itemType==='qty'||it.n.indexOf('_____')>-1);
    var dispN=hasQtyField&&it.qty?it.n.replace('_____','<span class="cl-qty-badge">'+it.qty+'</span>'):it.n;
    clH+='<span class="cl-name">'+dispN+'</span>';
    clH+='<div class="cl-btns">';
      if(itemType==='select'){
        var isSel=it.st==='ok';
        clH+='<button class="sb'+(isSel?' on':'')+'" onclick="setSt('+idx+','+s+','+i+','+(isSel?'\'\'':'\'ok\'')+');render()" style="min-width:80px;background:'+(isSel?'#43a047':'white')+';color:'+(isSel?'white':'#555')+';border-color:'+(isSel?'#43a047':'#ccc')+';">'+(isSel?'✓ Selected':'Select')+'</button>';
      } else {
        if(hasQtyField){
          if(!it.qty){
            clH+='<input type="text" class="cl-qty-input" placeholder="Value" oninput="saveQty('+idx+','+s+','+i+',this.value)" onblur="saveQtyAndRender('+idx+','+s+','+i+',this.value)" onclick="event.stopPropagation()">';
          } else {
            clH+='<button class="cl-qty-edit" onclick="editQty('+idx+','+s+','+i+')" title="Edit value">✏️</button>';
          }
        }
        clH+='<button class="sb ac'+aOn+'" onclick="setSt('+idx+','+s+','+i+',\'ac\')" title="ACCEPTABLE">✓ AC</button>';
        clH+='<button class="sb re'+rOn+'" onclick="setSt('+idx+','+s+','+i+',\'re\')" title="WITH RESTRICTIONS">R</button>';
        clH+='<button class="sb na'+nOn+'" onclick="setSt('+idx+','+s+','+i+',\'na\')" title="NOT ACCEPTABLE">✕ NAC</button>';
        clH+='<button class="sb np'+pOn+'" onclick="setSt('+idx+','+s+','+i+',\'np\')" title="NOT APPLICABLE">N/A</button>';
      }
    clH+='</div>';
  clH+='</div>';

  clH+='<div class="cl-item-content">';
    clH+='<textarea rows="2" class="cl-textarea" placeholder="Add observation or notes..." oninput="saveObs('+idx+','+s+','+i+',this.value)">'+obsVal+'</textarea>';
    
    clH+='<div class="cl-photos-section">';
      clH+='<label class="cl-photos-label">Photos & Evidence</label>';
      clH+='<div class="cl-photos-grid">';
      if(!it.fotos)it.fotos=[];
      for(var fp=0;fp<it.fotos.length;fp++){
        clH+='<div class="cl-photo-item">';
        clH+='<img src="'+it.fotos[fp].d+'" onclick="verImg(\''+it.fotos[fp].d+'\')" class="cl-photo-thumb">';
        clH+='<button class="cl-photo-remove" onclick="rmFoto('+idx+','+s+','+i+','+fp+')" title="Remove">✕</button>';
        clH+='<span class="cl-photo-info">'+it.fotos[fp].by.substring(0,10)+'</span>';
        clH+='</div>';
      }
      clH+='<button class="cl-photo-add" onclick="abrirModFoto('+idx+','+s+','+i+')" title="'+(it.fotos.length?'Add more photos':'Add photo')+'">📷 Add Photo</button>';
      clH+='</div>';
    clH+='</div>';

  clH+='</div>';
clH+='</div>';
      }
      clH+='</div>';
    }

    var fH='<small style="color:#aaa;">No files attached.</small>';
    if(av.files&&av.files.length){
      fH='';
      for(var f=0;f<av.files.length;f++){
        var fl=av.files[f];
        if(fl.tp==='img')
          fH+='<div class="fitem"><img src="'+fl.d+'" onclick="verImg(\''+fl.d+'\')"><span>'+fl.nm+'</span><span class="rm" onclick="rmArq('+idx+','+f+')">✕</span></div>';
        else
          fH+='<div class="fitem">📄 <a href="'+fl.d+'" download="'+fl.nm+'">'+fl.nm+'</a><span class="rm" onclick="rmArq('+idx+','+f+')">✕</span></div>';
      }
    }

    var admH='';
    if(ME&&isAdm(ME.role)){
      admH+='<button class="btn-red" onclick="rmAviao('+idx+')">🗑 Remove</button>';
      admH+='<button class="btn-blue" onclick="addItem('+idx+')">➕ Add Item</button>';
    }
    admH+='<button class="btn-green" onclick="finalizar('+idx+')">✓ Finalize</button>';

    var d=document.createElement('div');
    d.className='av '+res;
    d.innerHTML=
      '<div class="av-header">'+
        '<div class="av-title">'+
          '<h3>✈️ '+av.mat+' — '+av.mod+'</h3>'+
          '<div class="tags">'+
            '<span class="tag">👤 '+av.resp+'</span>'+
            '<span class="tag">🔗 S/N: '+av.serie+'</span>'+
            '<span class="tag">📅 '+av.dc+'</span>'+
          '</div>'+
        '</div>'+
        '<span class="badge '+bCls+'">'+bLbl+'</span>'+
      '</div>'+
      jumpBar+
      clH+
      '<div class="upload">'+
        '<label>📸 Attach Photo or PDF:</label>'+
        '<input type="file" accept="image/*,.pdf" multiple onchange="upArq(event,'+idx+')">'+
        '<div class="flist">'+fH+'</div>'+
      '</div>'+
      '<div class="acoes">'+admH+'</div>';
    lista.appendChild(d);
  }
}

// ===== CHECKLIST ACTIONS =====
function setSt(ai,si,ii,ns){
  var it=AVS[ai].cl[si].items[ii];
  if(it.st===ns){it.st='';it.by='';it.dt='';}
  else{it.st=ns;it.by=ME.nome;it.dt=dh();}
  sv();render();
  if(it.st)_scrollToNextItem(ai,si,ii);
}

function _scrollToNextItem(ai,si,ii){
  var av=AVS[ai];if(!av)return;
  for(var s=si;s<av.cl.length;s++){
    var start=(s===si)?ii+1:0;
    for(var i=start;i<av.cl[s].items.length;i++){
      var it=av.cl[s].items[i];
      if((it.st===''||it.st===undefined)&&it.type!=='select'){
        (function(ts,ti){
          setTimeout(function(){
            var el=document.getElementById('item-'+ai+'-'+ts+'-'+ti);
            if(el)el.scrollIntoView({behavior:'smooth',block:'center'});
          },60);
        })(s,i);
        return;
      }
    }
  }
}

function saveQty(ai,si,ii,val){
  AVS[ai].cl[si].items[ii].qty=val;
  sv();
}

function saveQtyAndRender(ai,si,ii,val){
  if(val&&val.trim()){
    AVS[ai].cl[si].items[ii].qty=val.trim();
    sv();render();
  }
}

function editQty(ai,si,ii){
  AVS[ai].cl[si].items[ii].qty='';
  sv();render();
}

function addItem(ai){
  var sx='';
  for(var s=0;s<AVS[ai].cl.length;s++)sx+=(s+1)+'. '+AVS[ai].cl[s].s+'\n';
  var e=parseInt(prompt('Section:\n\n'+sx+'\nNumber:'))-1;
  if(isNaN(e)||e<0||e>=AVS[ai].cl.length)return;
  var n=prompt('Item name:');
  if(n&&n.trim()){
    AVS[ai].cl[e].items.push({n:n.trim(),st:'',by:'',dt:'',obs:'',fotos:[]});
    sv();render();
  }
}

function rmAviao(ai){
  if(confirm('Remove '+AVS[ai].mat+'?')){AVS.splice(ai,1);sv();render();}
}

function upArq(ev,ai){
  var fs=ev.target.files;
  var total=fs.length,done=0;
  for(var i=0;i<fs.length;i++){
    (function(f){
      var isPDF=f.type==='application/pdf';
      var isImg=f.type.indexOf('image')>-1;
      if(!isPDF&&!isImg){
        done++;if(done===total){sv();render();}
        return;
      }
      var r=new FileReader();
      r.onload=function(e){
        AVS[ai].files.push({
          nm:f.name,
          tp:isPDF?'pdf':'img',
          d:e.target.result,
          by:(ME&&ME.nome)?ME.nome:'Unknown User',
          dt:dh()
        });
        done++;if(done===total){sv();render();}
      };
      r.readAsDataURL(f);
    })(fs[i]);
  }
}

function rmArq(ai,fi){
  if(confirm('Remove file?')){AVS[ai].files.splice(fi,1);sv();render();}
}

// ===== IMAGE VIEWER =====
var _imgZoomLevel=1;
var _imgViewerSrc=''; // original data URL kept for saving
function verImg(src){
  _imgZoomLevel=1;
  _imgViewerSrc=src;
  var img=document.getElementById('mod-img-src');
  // Use blob URL so iOS long-press "Save Image" works (data URLs save as black on iOS)
  if(src&&src.startsWith('data:')){
    try{
      var arr=src.split(','),mime=arr[0].match(/:(.*?);/)[1];
      var bstr=atob(arr[1]),n=bstr.length,u8=new Uint8Array(n);
      while(n--)u8[n]=bstr.charCodeAt(n);
      var blob=new Blob([u8],{type:mime});
      if(img._blobUrl)URL.revokeObjectURL(img._blobUrl);
      img._blobUrl=URL.createObjectURL(blob);
      img.src=img._blobUrl;
    }catch(e){img.src=src;}
  } else {
    if(img._blobUrl){URL.revokeObjectURL(img._blobUrl);img._blobUrl=null;}
    img.src=src;
  }
  img.style.transform='scale(1)';
  img.style.maxWidth='95%';
  img.style.maxHeight='80vh';
  var lbl=document.getElementById('mod-img-zoom-lbl');
  if(lbl)lbl.textContent='100%';
  document.getElementById('mod-img').style.display='flex';
}
function _saveImgViewer(){
  if(!_imgViewerSrc)return;
  var a=document.createElement('a');
  a.href=_imgViewerSrc;
  a.download='photo_'+Date.now()+'.jpg';
  document.body.appendChild(a);
  a.click();
  setTimeout(function(){document.body.removeChild(a);},200);
}
function _zoomImg(delta){
  if(delta===0){_imgZoomLevel=1;}
  else{_imgZoomLevel=Math.max(0.5,Math.min(8,_imgZoomLevel+delta));}
  var img=document.getElementById('mod-img-src');
  if(!img)return;
  if(_imgZoomLevel<=1){
    img.style.transform='scale(1)';
    img.style.maxWidth='95%';
    img.style.maxHeight='80vh';
  }else{
    img.style.transform='scale('+_imgZoomLevel+')';
    img.style.maxWidth='none';
    img.style.maxHeight='none';
  }
  var lbl=document.getElementById('mod-img-zoom-lbl');
  if(lbl)lbl.textContent=Math.round(_imgZoomLevel*100)+'%';
}
// ESC closes image viewer; wheel zooms
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    var m=document.getElementById('mod-img');
    if(m&&m.style.display!=='none')m.style.display='none';
  }
});
document.addEventListener('wheel',function(e){
  var m=document.getElementById('mod-img');
  if(!m||m.style.display==='none')return;
  e.preventDefault();
  _zoomImg(e.deltaY<0?0.2:-0.2);
},{passive:false});

// Downscale + re-encode as JPEG so full-resolution camera photos (often
// several MB each) don't bloat localStorage/cloud sync and PDF exports.
function _compressImageDataUrl(dataUrl, cb, maxDim, quality){
  maxDim = maxDim || 1600;
  quality = quality || 0.78;
  var img = new Image();
  img.onload = function(){
    var w = img.naturalWidth, h = img.naturalHeight;
    if(!w || !h){ cb(dataUrl); return; }
    if(w > maxDim || h > maxDim){
      if(w >= h){ h = Math.round(h * maxDim / w); w = maxDim; }
      else { w = Math.round(w * maxDim / h); h = maxDim; }
    }
    try{
      var c = document.createElement('canvas');
      c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      var out = c.toDataURL('image/jpeg', quality);
      cb(out.length < dataUrl.length ? out : dataUrl);
    }catch(e){ cb(dataUrl); }
  };
  img.onerror = function(){ cb(dataUrl); };
  img.src = dataUrl;
}

function uploadFoto(ev){
  var f=ev.target.files[0];if(!f)return;
  var myToken=_fotoUploadToken;
  var r=new FileReader();
  r.onload=function(e){
    _compressImageDataUrl(e.target.result, function(compressed){
      // If the modal was reopened for a different item while this was
      // compressing, drop the result instead of attaching it to the wrong item.
      if(myToken!==_fotoUploadToken)return;
      FD=compressed;
      var pi=document.getElementById('prev-img');
      pi.src=FD;
      pi.style.display='block';
      document.getElementById('foto-placeholder').style.display='none';
      document.getElementById('btn-retake').style.display='block';
      setTimeout(_autoSalvar, 150);
    });
  };
  r.readAsDataURL(f);
}

function descartarFoto(){
  FD=null;
  document.getElementById('prev-img').style.display='none';
  document.getElementById('prev-img').src='';
  document.getElementById('foto-placeholder').style.display='block';
  document.getElementById('btn-retake').style.display='none';
  var c=document.getElementById('inp-foto-cam');if(c)c.value='';
  var g=document.getElementById('inp-foto');if(g)g.value='';
}

function salvarFoto(){
  if(!FD||!FT)return;
  var it=AVS[FT.ai].cl[FT.si].items[FT.ii];
  if(!it.fotos)it.fotos=[];
  it.fotos.push({d:FD,by:(ME&&ME.nome)?ME.nome:'Unknown User',dt:dh()});
  sv();render();fecharModFoto();
  FD=null;
}

function rmFoto(ai,si,ii,fi){
  if(confirm('Remove photo?')){
    var it=AVS[ai].cl[si].items[ii];
    if(!it.fotos)it.fotos=[];
    if(typeof fi==='number'){
      it.fotos.splice(fi,1);
    }else{
      it.fotos=[];
    }
    sv();render();
  }
}

// ===== FINALIZE FLIGHT INSPECTION - APENAS PARA COMPLETED =====
function finalizar(ai){
  var av=AVS[ai];
  window._currentAVIndex=ai;
  document.getElementById('mod-fi-flow').style.display='flex';
}

function finalizarParaCompleted(){
  var ai=window._currentAVIndex;
  var av=AVS[ai];
  
  FINS.unshift({
    id:Date.now(),mat:av.mat,serie:av.serie,mod:av.mod,
    resp:av.resp,dc:av.dc,df:dh(),by:(ME&&ME.nome)?ME.nome:'Unknown User',
    res:sgRes(av.cl),
    cl:JSON.parse(JSON.stringify(av.cl)),
    files:JSON.parse(JSON.stringify(av.files||[]))
  });
  
  var _mat=av.mat, _mod=av.mod;
  logActivity('fin_flight',_mat+' ('+_mod+')');
  svf();AVS.splice(ai,1);sv();
  if(typeof cloudSave==='function')cloudSave(true); // immediate — don't risk losing on tab close
  render();
  fecharFlowModal();
  _showFinalizeSuccess(_mat + ' — ' + _mod);
  _showToast('✅ Flight Inspection archived!','ok');
  aba('fin');
}

// ✅ NOVO — manter apenas UMA
function fecharFlowModal(){
  document.getElementById('mod-fi-flow').style.display='none';
  window._currentAVIndex=null;
}

// ===== RENDER COMPLETED - ORGANIZADO ===== 
function renderFin(){
  var container=document.querySelector('.completed-container');
  if(!container)return;
  
  var flightGrid=document.getElementById('completed-flight-grid');
  var mandatoryGrid=document.getElementById('completed-mandatory-grid');
  var flightSection=document.getElementById('completed-flight-section');
  var mandatorySection=document.getElementById('completed-mandatory-section');
  var emptyState=document.getElementById('completed-empty-state');
  
  if(!flightGrid||!mandatoryGrid)return;
  
  flightGrid.innerHTML='';
  mandatoryGrid.innerHTML='';
  
  var hasVTIVTE=typeof FINSVTIVTE!=='undefined'&&FINSVTIVTE.length>0;
  if(!FINS||FINS.length===0){
    if(!hasVTIVTE) emptyState.style.display='block';
    else emptyState.style.display='none';
    flightSection.style.display='none';
    mandatorySection.style.display='none';
    return;
  }

  emptyState.style.display='none';
  
  var flightCount=0,mandatoryCount=0;

  for(var i=0;i<FINS.length;i++){
    var reg=FINS[i];
    var isFlight=!reg.type||reg.type!=='mandatory';

    var rCls=reg.res==='ok'?'ok':reg.res==='warn'?'warn':'danger';
    var stIcon=reg.res==='ok'?'✓':reg.res==='warn'?'⚠️':'✕';
    var stLabel=reg.res==='ok'?'ALL COMPLETE':reg.res==='warn'?'INCOMPLETE':'NOT ACCEPTABLE';
    var bannerColor=isFlight?'#1565C0':'#E65100';
    var typeLabel=isFlight?'FLIGHT INSPECTION':'MANDATORY DOCUMENT';

    var card=document.createElement('div');
    card.className='completed-card '+rCls;
    card.setAttribute('data-type', isFlight?'flight':'mandatory');
    card.setAttribute('data-status', reg.res);
    card.innerHTML=
      '<div style="background:'+bannerColor+';color:white;padding:12px 16px;border-radius:8px 8px 0 0;">'+
        '<div style="font-weight:bold;font-size:13px;">'+typeLabel+'</div>'+
      '</div>'+
      '<div style="padding:16px;">'+
        '<h4 style="margin:0 0 8px 0;color:#1a2a4a;font-size:14px;">'+reg.mat+' — '+reg.mod+'</h4>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;font-size:12px;color:#666;">'+
          '<span>👤 '+(reg.resp||'N/A')+'</span>'+
          '<span>🔗 S/N: '+(reg.serie||'N/A')+'</span>'+
          '<span>📅 '+(reg.df||'N/A')+'</span>'+
        '</div>'+
        (isFlight?'<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;"><span style="font-size:16px;">'+stIcon+'</span><span style="font-weight:bold;color:#1a2a4a;font-size:13px;">'+stLabel+'</span></div>':'')+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;">'+
          '<button onclick="verFin('+i+')" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #2196F3 0%, #1976D2 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(33,150,243,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">👁️ View</button>'+
          '<button onclick="currentFinIdx='+i+';exportCurrentPDF()" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(76,175,80,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">📄 Export PDF</button>'+
          '<button onclick="abrirSeletorOneDrive('+i+')" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #0078D4 0%, #005A9E 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(0,120,212,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">☁️ OneDrive</button>'+
          '<button onclick="delFin('+i+')" style="flex:1;minwidth:90px;padding:12px 14px;border:none;border-radius:8px;background:linear-gradient(135deg, #F44336 0%, #D32F2F 100%);color:white;cursor:pointer;font-weight:700;font-size:14px;box-shadow:0 4px 12px rgba(244,67,54,0.3);transition:all 0.3s ease;display:flex;align-items:center;justify-content:center;gap:6px;">🗑️ Delete</button>'+
        '</div>'+
        '</div>';

    if(isFlight){
      flightGrid.appendChild(card);
      flightCount++;
    }else{
      mandatoryGrid.appendChild(card);
      mandatoryCount++;
    }
  }
  
  document.getElementById('completed-flight-count').textContent=flightCount;
  document.getElementById('completed-mandatory-count').textContent=mandatoryCount;
  
  flightSection.style.display=flightCount>0?'block':'none';
  mandatorySection.style.display=mandatoryCount>0?'block':'none';
}

// ===== FILTER BY TYPE (Completed) =====
function filterByType(type) {
  const flightSection = document.getElementById('completed-flight-section');
  const vtivteSection = document.getElementById('completed-vtivte-section');
  const mandatorySection = document.getElementById('completed-mandatory-section');
  const emptyState = document.getElementById('completed-empty-state');
  
  // Reseta visibilidade
  flightSection.style.display = 'none';
  vtivteSection.style.display = 'none';
  mandatorySection.style.display = 'none';
  emptyState.style.display = 'none';
  
  let hasContent = false;
  
  // Mostra seções baseado no filtro
  if (type === 'all' || type === 'flight') {
    if (FINS && FINS.length > 0) {
      flightSection.style.display = 'block';
      hasContent = true;
    }
  }
  
  if (type === 'all' || type === 'vti') {
    const vtiCount = FINSVTIVTE.filter(sr => sr.type === 'VTI').length;
    if (vtiCount > 0) {
      vtivteSection.style.display = 'block';
      hasContent = true;
    }
  }
  
  if (type === 'all' || type === 'vte') {
    const vteCount = FINSVTIVTE.filter(sr => sr.type === 'VTE').length;
    if (vteCount > 0) {
      vtivteSection.style.display = 'block';
      hasContent = true;
    }
  }
  
  if (type === 'all' || type === 'mandatory') {
    if (FINS && FINS.some(function(r){ return r.type === 'mandatory'; })) {
      mandatorySection.style.display = 'block';
      hasContent = true;
    }
  }
  
  // Mostra empty state se nada foi encontrado
  if (!hasContent) {
    emptyState.style.display = 'block';
  }
  
  // Atualiza estilo dos botões
  document.querySelectorAll('.completed-filter-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
}

// ===== FILTER COMPLETED BY STATUS =====
function filterByStatus(status){
  var cards=document.querySelectorAll('.completed-card');
  var btns=document.querySelectorAll('.completed-filter-btn');
  
  btns.forEach(function(btn){btn.classList.remove('active');});
  event.target.classList.add('active');
  
  cards.forEach(function(card){
    if(status==='all'||card.dataset.status===status){
      card.style.display='flex';
    }else{
      card.style.display='none';
    }
  });
}

// ===== SEARCH COMPLETED =====
function filterCompleted(){
  var search=document.getElementById('completed-search').value.toLowerCase();
  var cards=document.querySelectorAll('.completed-card');
  
  cards.forEach(function(card){
    var text=card.textContent.toLowerCase();
    if(text.indexOf(search)>-1){
      card.style.display='flex';
    }else{
      card.style.display='none';
    }
  });
}

// ===== VIEW COMPLETED (FLIGHT INSPECTION & MANDATORY) =====
function verFin(idx){
  if(idx<0 || !FINS[idx]){alert('Record not found.');return;}
  var reg=FINS[idx];
  var modal=document.getElementById('mod-fin');
  var content=document.getElementById('mod-fin-content');
  currentFinIdx=idx;
  
  content.innerHTML='';
  var topActionsHtml='<div class="fin-actions-top"><button class="btn-green" onclick="exportCurrentPDF()">📄 Export PDF</button><button class="btn-outline" onclick="document.getElementById(\'mod-fin\').style.display=\'none\'">✕ Close</button></div>';
  var modalContentHtml='';
  
  if(reg.type==='mandatory'){
    var rTxt=reg.res==='ok'?'COMPLETE':'INCOMPLETE';
    var rCls=reg.res==='ok'?'ok':'warn';
    
    modalContentHtml+='<div class="fin-mand-header"><h3>📄 '+reg.mat+' — '+reg.mod+'</h3><div class="fin-mand-tags"><span class="fin-mand-tag">👤 '+reg.resp+'</span><span class="fin-mand-tag">🔗 S/N: '+reg.serie+'</span><span class="fin-mand-tag">📅 '+reg.df+'</span></div></div>';
    
    for(var s=0;s<reg.mand.length;s++){
      var sec=reg.mand[s];
      var isLoaSec=sec.s&&sec.s.indexOf('LOA')>-1;
      modalContentHtml+='<div class="fin-mand-section"><div class="fin-mand-section-title">'+sec.s+'</div>';

      for(var i=0;i<sec.items.length;i++){
        var it=sec.items[i];
        if(isLoaSec&&it.st==='') continue; // LOA não selecionada = não exibir
        var stCls=it.st==='ok'?'ok':it.st==='na'?'na':'pending';
        // ✅ NOVO - Status 100% em inglês e padronizado
        var stTxt = it.st==='ok'  ? '✓  OK'      :
                    it.st==='na'  ? '—  N/A'     :
                            '[ ] PENDING';
        var stClr = it.st==='ok'  ? [46,125,50]  :
                    it.st==='na'  ? [120,144,156]:
                            [150,150,150];
        
        modalContentHtml+='<div class="fin-mand-item"><div class="fin-mand-item-header"><span class="fin-mand-item-status '+stCls+'">'+stTxt+'</span><span class="fin-mand-item-name">'+it.n+'</span></div>';
        
        if(it.obs){
          modalContentHtml+='<div class="fin-mand-item-note"><strong>Note:</strong> '+_h(it.obs)+'</div>';
        }
        
        var fotosArr=it.fotos||[];
        if(fotosArr.length>0){
          modalContentHtml+='<div class="fin-mand-photos-grid">';
          for(var fp=0;fp<fotosArr.length;fp++){
            var fotoSrc=fotosArr[fp].d;
            var fotoBy=fotosArr[fp].by;
            var fotoDt=fotosArr[fp].dt;
            modalContentHtml+='<div class="fin-mand-photo-item"><img class="fin-mand-photo-thumb" src="'+fotoSrc+'" onclick="verImg(\''+fotoSrc+'\')" title="By: '+fotoBy+' on '+fotoDt+'"><span class="fin-mand-photo-info">'+fotoBy.substring(0,10)+'</span></div>';
          }
          modalContentHtml+='</div>';
        }
        
        if(it.dt&&it.dt.trim()){
          var dtP=it.dt.split('-');
          var dtDisp=dtP.length===3?dtP[2]+'/'+dtP[1]+'/'+dtP[0]:it.dt;
          modalContentHtml+='<div style="margin-top:4px;"><span style="background:#e3f2fd;color:#1565c0;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:bold;display:inline-block;">📅 Validity:'+dtDisp+'</span></div>';
        }
        modalContentHtml+='</div>';
      }
      modalContentHtml+='</div>';
    }
  }else{
    var rTxt=reg.res==='ok'?'ALL ACCEPTABLE':reg.res==='warn'?'WITH RESTRICTIONS':'NOT ACCEPTABLE';
    var rCls=reg.res==='ok'?'ok':reg.res==='warn'?'warn':'danger';
    
    modalContentHtml+='<div class="fin-flight-header"><h3>✈️ '+reg.mat+' — '+reg.mod+'</h3><div class="fin-flight-tags"><span class="fin-flight-tag">👤 '+reg.resp+'</span><span class="fin-flight-tag">🔗 S/N: '+reg.serie+'</span><span class="fin-flight-tag">📅 '+reg.df+'</span></div></div>';
    modalContentHtml+='<div class="fin-flight-status-summary"><strong>Overall Result:</strong><span class="fin-flight-status-badge '+rCls+'">'+rTxt+'</span></div>';
    
    for(var s=0;s<reg.cl.length;s++){
      var sec=reg.cl[s];
      modalContentHtml+='<div class="fin-flight-section"><div class="fin-flight-section-title">'+sec.s+'</div>';
      
      for(var i=0;i<sec.items.length;i++){
        var it=sec.items[i];
        var stCls=it.st==='ac'?'ac':it.st==='re'?'re':it.st==='na'?'na':'pending';
        var stTxt=it.st==='ac'?'✓ AC':it.st==='re'?'R':it.st==='na'?'✕ NAC':'[ ]';
        
        var dispItN=(it.qty&&it.n.indexOf('_____')>-1)?it.n.replace('_____','<span class="cl-qty-badge">'+it.qty+'</span>'):it.n;
        modalContentHtml+='<div class="fin-flight-item"><div class="fin-flight-item-header"><span class="fin-flight-item-status '+stCls+'">'+stTxt+'</span><span class="fin-flight-item-name">'+dispItN+'</span></div>';
        
        if(it.obs){
          modalContentHtml+='<div class="fin-flight-item-note"><strong>Note:</strong> '+_h(it.obs)+'</div>';
        }
        
        // ✅ ADICIONAR FOTOS NO FLIGHT INSPECTION
        var fotosArr=it.fotos||[];
        if(fotosArr.length>0){
          modalContentHtml+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:8px;padding-top:10px;border-top:1px dashed #f0f4f8;">';
          for(var fp=0;fp<fotosArr.length;fp++){
            var fotoSrc=fotosArr[fp].d;
            var fotoBy=fotosArr[fp].by;
            var fotoDt=fotosArr[fp].dt;
            modalContentHtml+='<div style="position:relative;aspect-ratio:1;border:1px solid #dde3ed;border-radius:8px;overflow:hidden;background:#f7fafd;cursor:pointer;" onclick="verImg(\''+fotoSrc+'\')"><img src="'+fotoSrc+'" style="width:100%;height:100%;object-fit:cover;"><span style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:white;font-size:9px;padding:2px 4px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="By: '+fotoBy+' on '+fotoDt+'">'+fotoBy.substring(0,10)+'</span></div>';
          }
          modalContentHtml+='</div>';
        }
        
        modalContentHtml+='</div>';
      }
      modalContentHtml+='</div>';
    }
    
    if(reg.files&&reg.files.length){
      var fH='<div class="fin-flight-section"><div class="fin-flight-section-title">📎 Attached Files</div>';
      for(var f=0;f<reg.files.length;f++){
        var fl=reg.files[f];
        if(fl.tp==='img'){
          fH+='<div class="fin-flight-item"><img style="width:100%;border-radius:8px;cursor:pointer;" src="'+fl.d+'" onclick="verImg(\''+fl.d+'\')"><span style="font-size:12px;color:#666;">'+fl.nm+' — '+fl.by+' | '+fl.dt+'</span></div>';
        }else{
          fH+='<div class="fin-flight-item"><span style="color:#4A90D9;font-weight:600;cursor:pointer;" onclick="window.open(\''+fl.d+'\')">📄 '+fl.nm+'</span><span style="font-size:11px;color:#999;">'+fl.by+' | '+fl.dt+'</span></div>';
        }
      }
      fH+='</div>';
      modalContentHtml+=fH;
    }
  }
  
  content.innerHTML=topActionsHtml+'<div class="modal-content-wrapper">'+modalContentHtml+'</div>';
  modal.style.display='flex';
}


function abrirSettings(){
  var m = document.getElementById('mod-settings');
  if(m){ m.style.display='flex'; }
}

function fecharSettings(){
  var m = document.getElementById('mod-settings');
  if(m){ m.style.display='none'; }
  var msg = document.getElementById('sp-msg');
  if(msg) msg.textContent='';
}

function _showFinalizeSuccess(label) {
  var el = document.createElement('div');
  el.className = 'finalize-overlay';
  el.innerHTML = '<div class="fo-check">✅</div><div class="fo-title">Finalized!</div><div class="fo-sub">' + (label || '') + '</div>';
  document.body.appendChild(el);
  setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); }, 2400);
}

function enviarFeedback(){
  var ta = document.getElementById('fb-msg');
  var st = document.getElementById('fb-status');
  var text = ta ? ta.value.trim() : '';
  if(!text){ if(st) st.textContent='⚠️ Please write a message before sending.'; return; }

  var user = ME ? (ME.nome || ME.user || 'Unknown') : 'Unknown';
  var subject = encodeURIComponent('TB Aviation App — Feedback from ' + user);
  var body = encodeURIComponent(text + '\n\n— ' + user + '\n' + new Date().toLocaleString());
  window.open('mailto:ltavares@tbaviation.com.br?subject=' + subject + '&body=' + body);

  if(st){ st.style.color='#2e7d32'; st.textContent='✅ Email client opened. Thank you for your feedback!'; }
  if(ta) ta.value='';
  setTimeout(function(){ if(st) st.textContent=''; }, 4000);
}

function mudarSenha(){
  var atual=document.getElementById('sp-atual').value.trim();
  var nova=document.getElementById('sp-nova').value.trim();
  var nova2=document.getElementById('sp-nova2').value.trim();
  var msg=document.getElementById('sp-msg');

  if(!atual||!nova||!nova2){
    msg.style.color='#e65100';
    msg.textContent='Please fill in all fields.';
    return;
  }
  var _curStored=USERS_PWD_OVERRIDES[ME.u]||ME.p;
  if(!_checkPw(_curStored,atual)){
    msg.style.color='#e65100';
    msg.textContent='Current password is incorrect.';
    return;
  }
  if(nova.length<4){
    msg.style.color='#e65100';
    msg.textContent='New password must be at least 4 characters.';
    return;
  }
  if(nova!==nova2){
    msg.style.color='#e65100';
    msg.textContent='New passwords do not match.';
    return;
  }

  var _encNova=_encPw(nova);

  // Update USERS_EXTRA entry if one exists (created accounts)
  for(var j=0;j<USERS_EXTRA.length;j++){
    if(USERS_EXTRA[j].u===ME.u){ USERS_EXTRA[j].p=_encNova; break; }
  }
  // Always store in USERS_PWD_OVERRIDES — this is what login checks first,
  // and it covers base users where getAllUsers() ignores USERS_EXTRA duplicates.
  USERS_PWD_OVERRIDES[ME.u]=_encNova;
  ME.p=_encNova;
  svUserPwd();
  svUsers();
  if(typeof _svAdminDataCloud==='function')_svAdminDataCloud();

  msg.style.color='#2e7d32';
  msg.textContent='✅ Password changed successfully!';
  setTimeout(function(){fecharSettings();},2000);
}

function delFin(idx){
  if(confirm('Permanently delete this record?')){FINS.splice(idx,1);svf();renderFin();}
}

// ===== EXPORT PDF - INTELIGENTE =====
// ✅ NOVO — com verificação completa
function exportCurrentPDF(){
  if(currentFinIdx<0||currentFinIdx===undefined){
    alert('No record selected.');return;
  }
  if(!FINS[currentFinIdx]){
    alert('Record not found. Index: '+currentFinIdx);return;
  }
  var reg=FINS[currentFinIdx];
  if(reg.type==='mandatory'){exportMandatoryPDF();}
  else{exportPDFPreview();}
}

// ===== EXPORT PDF - FLIGHT INSPECTION =====
function exportPDF(){
  if(currentFinIdx<0){alert('No record selected.');return;}
  if(typeof window.jspdf==='undefined'){alert('PDF library not loaded.');return;}
  var reg=FINS[currentFinIdx];
  var doc=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  var y=15,lm=14,rm=196,pw=175;
  var chkPage=function(){if(y>272){doc.addPage();y=15;}};

  // HEADER
  doc.setFillColor(26,42,74);
  doc.rect(0,0,210,35,'F');
  try{
    if(window._logoTB&&window._logoTB.complete&&window._logoTB.naturalWidth>0){
      var cvs=document.createElement('canvas');
      cvs.width=window._logoTB.naturalWidth;
      cvs.height=window._logoTB.naturalHeight;
      cvs.getContext('2d').drawImage(window._logoTB,0,0);
      var _lmxW=52,_lmxH=24,_lpW,_lpH;
      if(window._logoTB.naturalWidth*_lmxH>window._logoTB.naturalHeight*_lmxW){_lpW=_lmxW;_lpH=Math.round(_lmxW*window._logoTB.naturalHeight/window._logoTB.naturalWidth*10)/10;}
      else{_lpH=_lmxH;_lpW=Math.round(_lmxH*window._logoTB.naturalWidth/window._logoTB.naturalHeight*10)/10;}
      doc.addImage(cvs.toDataURL('image/png'),'PNG',145,5,_lpW,_lpH);
    }
  }catch(e){console.warn('Logo error:',e);}

  doc.setFontSize(20);doc.setFont(undefined,'bold');doc.setTextColor(255,255,255);
  doc.text('TB Aviation',lm,13);
  doc.setFontSize(11);doc.setFont(undefined,'normal');
  doc.text('Flight Inspection Report',lm,21);
  doc.setFontSize(8);
  doc.text('Generated: '+dh(),lm,29);
  y=43;

  // AIRCRAFT INFO BOX
  var _acPh1=REG_IMGS[reg.mat]||'';
  var _cH1=_acPh1?60:52;
  var _cY1=y;
  doc.setFillColor(240,244,248);
  doc.roundedRect(lm,y,pw,_cH1,3,3,'F');
  doc.setDrawColor(74,144,217);doc.setLineWidth(0.5);
  doc.roundedRect(lm,y,pw,_cH1,3,3,'S');
  if(_acPh1){try{
    var _f1=_acPh1.indexOf('data:image/png')===0?'PNG':'JPEG';
    var _px1=lm+pw-58,_py1=_cY1+15,_pw1=54,_ph1=_cH1-19;
    doc.setFillColor(255,255,255);doc.roundedRect(_px1,_py1,_pw1,_ph1,2,2,'F');
    doc.addImage(_acPh1,_f1,_px1+1,_py1+1,_pw1-2,_ph1-2);
    doc.setDrawColor(180,200,225);doc.setLineWidth(0.3);doc.roundedRect(_px1,_py1,_pw1,_ph1,2,2,'S');
  }catch(e){}}
  y+=7;
  doc.setFontSize(12);doc.setFont(undefined,'bold');doc.setTextColor(26,42,74);
  doc.text('Aircraft Information',lm+4,y);y+=7;
  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(0,0,0);
  var rTxt1=reg.res==='ok'?'ALL ACCEPTABLE':reg.res==='warn'?'WITH RESTRICTIONS':'NOT ACCEPTABLE';
  var rClr1=reg.res==='ok'?[46,125,50]:reg.res==='warn'?[230,81,0]:[198,40,40];
  if(_acPh1){
    var _rows1=[['Registration',reg.mat],['Model',reg.mod],['Serial No.',reg.serie],
                ['Responsible',reg.resp],['Created',reg.dc],['Finalized',reg.df]];
    _rows1.forEach(function(r){
      doc.setFont(undefined,'normal');doc.setTextColor(110,110,130);doc.text(r[0],lm+4,y);
      doc.setFont(undefined,'bold');doc.setTextColor(26,42,74);doc.text(r[1]||'N/A',lm+32,y);
      doc.setFont(undefined,'normal');doc.setTextColor(0,0,0);y+=5.5;
    });
    y+=1;
    doc.setFont(undefined,'bold');doc.setTextColor(rClr1[0],rClr1[1],rClr1[2]);
    doc.text('Result: '+rTxt1,lm+4,y);
    y=_cY1+_cH1+8;
  }else{
    var col1=lm+4,col2=lm+90;
    doc.text('Registration : '+reg.mat,col1,y);doc.text('Model        : '+reg.mod,col2,y);y+=6;
    doc.text('Serial No.   : '+reg.serie,col1,y);doc.text('Responsible  : '+reg.resp,col2,y);y+=6;
    doc.text('Created      : '+reg.dc,col1,y);doc.text('Finalized    : '+reg.df,col2,y);y+=6;
    doc.setFont(undefined,'bold');doc.setTextColor(rClr1[0],rClr1[1],rClr1[2]);
    doc.text('Result       : '+rTxt1,col2,y);y+=14;
  }

  var stLbl={'ac':'[AC] ACCEPTABLE','re':'[R] WITH RESTRICTIONS',
             'na':'[NAC] NOT ACCEPTABLE','np':'[N/A] NOT APPLICABLE','':'[ ] PENDING'};
  var stClr={'ac':[46,125,50],'re':[230,81,0],'na':[198,40,40],'np':[84,110,122],'':[150,150,150]};

  // ✅ CORRIGIDO: ÚNICO loop usando reg.cl (removido loop duplo com reg.mand)
  for(var s=0;s<reg.cl.length;s++){
    chkPage();
    doc.setFillColor(74,144,217);
    doc.rect(lm,y,pw,7,'F');
    doc.setFontSize(9);doc.setFont(undefined,'bold');doc.setTextColor(255,255,255);
    doc.text((reg.cl[s].s||'Section').toUpperCase(),lm+3,y+5); // ✅ reg.cl
    y+=10;
    doc.setFont(undefined,'normal');doc.setFontSize(8.5);

    for(var i=0;i<reg.cl[s].items.length;i++){ // ✅ reg.cl
      chkPage();
      var it=reg.cl[s].items[i]; // ✅ reg.cl
      var lbl=stLbl[it.st]!==undefined?stLbl[it.st]:stLbl[''];
      var clr=stClr[it.st]||stClr[''];

      if(i%2===0){doc.setFillColor(247,250,253);doc.rect(lm,y-3.5,pw,6,'F');}
      doc.setTextColor(51,51,51);

// ── Nome do item + Status (mesma linha, sem data sobreposta) ──────
var iName = (it.qty && it.n.indexOf('_____')>-1) ? it.n.replace('_____', '['+it.qty+']') : it.n;
var iLines = doc.splitTextToSize((i+1)+'. '+iName, pw - 60);
doc.text(iLines, lm+2, y);

// ✅ CORRETO (ancora pela DIREITA — todos alinhados na mesma borda):
doc.setFont(undefined,'bold');
doc.setTextColor(clr[0],clr[1],clr[2]);
doc.text(lbl, rm - 2, y, { align: 'right' });
doc.setFont(undefined,'normal');
doc.setTextColor(0,0,0);
y += iLines.length * 5;


      if(it.obs){
        chkPage();
        doc.setTextColor(123,79,0);doc.setFontSize(8);
        var obsLines=doc.splitTextToSize('    Note: '+it.obs,pw-10);
        doc.text(obsLines,lm+4,y);
        y+=obsLines.length*4.5;
        doc.setFontSize(8.5);
      }

      if(it.by){
        chkPage();
        doc.setTextColor(150,150,150);doc.setFontSize(7.5);
        doc.text('    By: '+it.by+' | '+it.dt,lm+4,y);
        y+=4.5;
        doc.setFontSize(8.5);doc.setTextColor(0,0,0);
      }

      var fotosArr=it.fotos||[];
      for(var fp=0;fp<fotosArr.length;fp++){
        var fotoItem=fotosArr[fp];
        if(!fotoItem.d||fotoItem.d.length<100)continue;
        try{
          var fotoType='JPEG';
          if(fotoItem.d.indexOf('image/png')>-1)fotoType='PNG';
          if(fotoItem.d.indexOf('image/jpeg')>-1)fotoType='JPEG';
          if(fotoItem.d.indexOf('image/webp')>-1)fotoType='JPEG';
          var _fProps=doc.getImageProperties(fotoItem.d);
          var _fMaxW=160,_fMaxH=100,_fW,_fH;
          if(_fProps.width*_fMaxH>_fProps.height*_fMaxW){_fW=_fMaxW;_fH=Math.round(_fMaxW*_fProps.height/_fProps.width);}
          else{_fH=_fMaxH;_fW=Math.round(_fMaxH*_fProps.width/_fProps.height);}
          if(y+_fH+8>272){doc.addPage();y=15;}
          doc.addImage(fotoItem.d,fotoType,lm+2,y,_fW,_fH);
          y+=_fH+3;
          doc.setFontSize(7);doc.setTextColor(150,150,150);
          doc.text('    Photo '+(fp+1)+' by: '+fotoItem.by+' | '+fotoItem.dt,lm+2,y);
          y+=5;
          doc.setFontSize(8.5);doc.setTextColor(0,0,0);
        }catch(e){
          doc.setFontSize(7.5);doc.setTextColor(200,0,0);
          doc.text('    [Photo could not be loaded]',lm+2,y);
          y+=5;doc.setTextColor(0,0,0);
        }
      }
    } // ✅ fecha for(var i) — itens
    y+=4;
  } // ✅ fecha for(var s) — seções

  // ATTACHED FILES
  if(reg.files&&reg.files.length){
    chkPage();
    doc.setFillColor(26,42,74);
    doc.rect(lm,y,pw,7,'F');
    doc.setFontSize(9);doc.setFont(undefined,'bold');doc.setTextColor(255,255,255);
    doc.text('ATTACHED FILES',lm+3,y+5);
    y+=10;
    doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(0,0,0);
    for(var ff=0;ff<reg.files.length;ff++){
      chkPage();
      var fl=reg.files[ff];
      if(fl.tp==='img'){
        try{
          var imgType=fl.d.indexOf('image/png')>-1?'PNG':'JPEG';
          var imgW=80,imgH=55;
          if(y+imgH+12>272){doc.addPage();y=15;}
          doc.setFontSize(8);doc.setTextColor(51,51,51);
          doc.text('  📎 '+fl.nm,lm+2,y);y+=5;
          doc.addImage(fl.d,imgType,lm+2,y,imgW,imgH);
          y+=imgH+3;
          doc.setFontSize(7);doc.setTextColor(150,150,150);
          doc.text('  By: '+fl.by+' | '+fl.dt,lm+2,y);y+=6;
          doc.setDrawColor(200,200,200);doc.setLineWidth(0.3);
          doc.line(lm,y,rm,y);y+=4;
          doc.setTextColor(0,0,0);doc.setFontSize(8.5);
        }catch(e){
          doc.setTextColor(200,0,0);
          doc.text('  [Image error: '+fl.nm+']',lm+2,y);y+=5.5;
          doc.setTextColor(0,0,0);
        }
      }else{
        doc.setTextColor(51,51,51);
        doc.text('  📄 '+fl.nm+' ('+fl.by+' | '+fl.dt+')',lm+2,y);y+=5.5;
      }
    }
  }

  // FOOTER
  var total=doc.internal.getNumberOfPages();
  for(var pg=1;pg<=total;pg++){
    doc.setPage(pg);
    doc.setFillColor(240,244,248);
    doc.rect(0,285,210,12,'F');
    doc.setFontSize(7.5);doc.setFont(undefined,'normal');
    doc.setTextColor(120,120,120);
    doc.text('TB Aviation - Flight Inspection Report | '+reg.mat+' - '+reg.mod,lm,291);
    doc.text('Page '+pg+' of '+total,190,291,{align:'right'});
  }

  var fileName='FlightInspection_'+reg.mat+'_'+reg.mod.replace(/ /g,'_')+'.pdf';
  _showPdfSaveDialog(fileName, doc.output('blob'));
}

// ===== EXPORT PDF PREVIEW — NEW STYLE (temporary, for review only) =====
function exportPDFPreview(){
  if(currentFinIdx<0||!FINS[currentFinIdx]){alert('Open a finalized record first.');return;}
  if(typeof window.jspdf==='undefined'){alert('PDF library not loaded.');return;}
  var reg=FINS[currentFinIdx];
  if(reg.type==='mandatory'){alert('Preview only available for Flight Inspection.');return;}

  var doc=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  var lm=12,rm=198,pw=186;
  var y=0;
  var chkPage=function(){if(y>268){doc.addPage();y=16;}};

  // ── PALETTE ──────────────────────────────────────────────────────────────
  var C_NAVY   =[26,42,74];
  var C_BLUE   =[74,144,217];
  var C_LIGHT  =[240,246,255];
  var C_WHITE  =[255,255,255];
  var C_GREEN  =[46,125,50];
  var C_ORANGE =[230,81,0];
  var C_RED    =[198,40,40];
  var C_GREY   =[120,120,120];
  var C_TEXT   =[30,30,30];

  // ── HEADER BAND ───────────────────────────────────────────────────────────
  doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
  doc.rect(0,0,210,38,'F');
  // accent stripe
  doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.rect(0,34,210,4,'F');

  // logo
  try{
    if(window._logoTB&&window._logoTB.complete&&window._logoTB.naturalWidth>0){
      var cvs=document.createElement('canvas');
      cvs.width=window._logoTB.naturalWidth; cvs.height=window._logoTB.naturalHeight;
      cvs.getContext('2d').drawImage(window._logoTB,0,0);
      var _lmxW=50,_lmxH=24,_lpW,_lpH;
      if(window._logoTB.naturalWidth*_lmxH>window._logoTB.naturalHeight*_lmxW){_lpW=_lmxW;_lpH=Math.round(_lmxW*window._logoTB.naturalHeight/window._logoTB.naturalWidth*10)/10;}
      else{_lpH=_lmxH;_lpW=Math.round(_lmxH*window._logoTB.naturalWidth/window._logoTB.naturalHeight*10)/10;}
      doc.addImage(cvs.toDataURL('image/png'),'PNG',148,4,_lpW,_lpH);
    }
  }catch(e){}

  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.text('TB Aviation',lm,10);
  doc.setFontSize(18);doc.setFont(undefined,'bold');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
  doc.text('FLIGHT INSPECTION',lm,19);
  doc.setFontSize(10);doc.setFont(undefined,'normal');
  doc.text('Pre-Flight Inspection Report',lm,26);
  doc.setFontSize(8);doc.setTextColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.text('Generated: '+dh(),lm,32);

  y=46;

  // ── AIRCRAFT INFO CARD (same layout as original PDF) ─────────────────────
  var rTxt=reg.res==='ok'?'ALL ACCEPTABLE':reg.res==='warn'?'WITH RESTRICTIONS':'NOT ACCEPTABLE';
  var rClr=reg.res==='ok'?C_GREEN:reg.res==='warn'?C_ORANGE:C_RED;
  var cardH=48;

  var _acPh2=REG_IMGS[reg.mat]||'';
  var _cH2=_acPh2?60:cardH;
  var _cY2=y;
  doc.setFillColor(240,246,255);
  doc.setDrawColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.setLineWidth(0.5);
  doc.roundedRect(lm,y,pw,_cH2,3,3,'FD');
  if(_acPh2){try{
    var _f2=_acPh2.indexOf('data:image/png')===0?'PNG':'JPEG';
    var _px2=lm+pw-58,_py2=_cY2+15,_pw2=54,_ph2=_cH2-19;
    doc.setFillColor(255,255,255);doc.roundedRect(_px2,_py2,_pw2,_ph2,2,2,'F');
    doc.addImage(_acPh2,_f2,_px2+1,_py2+1,_pw2-2,_ph2-2);
    doc.setDrawColor(180,200,225);doc.setLineWidth(0.3);doc.roundedRect(_px2,_py2,_pw2,_ph2,2,2,'S');
  }catch(e){}}

  // Title
  doc.setFontSize(11);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
  doc.text('Aircraft Information',lm+4,y+8);

  // Divider under title
  doc.setDrawColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.setLineWidth(0.3);
  doc.line(lm+4,y+11,(_acPh2?lm+pw-62:rm-4),y+11);

  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);

  if(_acPh2){
    // Single column — text on left, photo on right
    var _rows2=[['Registration',reg.mat],['Model',reg.mod],['Serial No.',reg.serie],
                ['Responsible',reg.resp],['Created',reg.dc],['Finalized',reg.df]];
    var _ry2=y+18;
    _rows2.forEach(function(r){
      doc.setFont(undefined,'normal');doc.setTextColor(110,110,130);doc.text(r[0],lm+4,_ry2);
      doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(r[1]||'N/A',lm+32,_ry2);
      doc.setFont(undefined,'normal');doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);_ry2+=5.5;
    });
    _ry2+=1;
    doc.setFont(undefined,'bold');doc.setTextColor(rClr[0],rClr[1],rClr[2]);
    doc.text('Result: '+rTxt,lm+4,_ry2);
  }else{
    var lx=lm+4, rx=lm+96;
    // Row 1
    doc.text('Registration',lx,y+18);  doc.text(':',lx+26,y+18); doc.setFont(undefined,'bold'); doc.text(reg.mat,lx+29,y+18); doc.setFont(undefined,'normal');
    doc.text('Model',rx,y+18);         doc.text(':',rx+22,y+18); doc.setFont(undefined,'bold'); doc.text(reg.mod,rx+25,y+18); doc.setFont(undefined,'normal');
    // Row 2
    doc.text('Serial No.',lx,y+25);    doc.text(':',lx+26,y+25); doc.setFont(undefined,'bold'); doc.text(reg.serie,lx+29,y+25); doc.setFont(undefined,'normal');
    doc.text('Responsible',rx,y+25);   doc.text(':',rx+22,y+25); doc.setFont(undefined,'bold'); doc.text(reg.resp,rx+25,y+25);  doc.setFont(undefined,'normal');
    // Row 3
    doc.text('Created',lx,y+32);       doc.text(':',lx+26,y+32); doc.setFont(undefined,'bold'); doc.text(reg.dc,lx+29,y+32);   doc.setFont(undefined,'normal');
    doc.text('Finalized',rx,y+32);     doc.text(':',rx+22,y+32); doc.setFont(undefined,'bold'); doc.text(reg.df,rx+25,y+32);   doc.setFont(undefined,'normal');
    // Row 4 — Result
    doc.text('Result',rx,y+40);        doc.text(':',rx+22,y+40);
    doc.setFont(undefined,'bold');doc.setTextColor(rClr[0],rClr[1],rClr[2]);
    doc.text(rTxt,rx+25,y+40);
    doc.setFont(undefined,'normal');doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
  }

  y=_cY2+_cH2+8;

  // ── STATUS LABELS & COLOURS ───────────────────────────────────────────────
  var stLbl={'ac':'AC','re':'R','na':'NAC','np':'N/A','':'—'};
  var stFill={
    'ac':[232,245,233], 're':[255,243,224], 'na':[255,235,238],
    'np':[240,240,240],  '' :[245,245,245]
  };
  var stInk={
    'ac':C_GREEN, 're':C_ORANGE, 'na':C_RED, 'np':[84,110,122], '':[160,160,160]
  };

  // ── SECTIONS & ITEMS ──────────────────────────────────────────────────────
  doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);

  for(var s=0;s<reg.cl.length;s++){
    chkPage();

    // section header
    doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
    doc.rect(lm,y,pw,7,'F');
    doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
    doc.rect(lm,y,3,7,'F');
    doc.setFontSize(8.5);doc.setFont(undefined,'bold');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
    doc.text((reg.cl[s].s||'Section').toUpperCase(),lm+6,y+5);
    y+=10;
    doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);

    for(var i=0;i<reg.cl[s].items.length;i++){
      chkPage();
      var it=reg.cl[s].items[i];
      // skip unselected select-type items (same as LOA in mandatory PDF)
      if(it.type==='select'&&it.st!=='ok')continue;
      var lbl, fill, ink;
      if(it.type==='select'){
        lbl='SEL'; fill=[232,245,233]; ink=C_GREEN;
      } else {
        lbl=stLbl[it.st]!==undefined?stLbl[it.st]:stLbl[''];
        fill=stFill[it.st]||stFill[''];
        ink=stInk[it.st]||stInk[''];
      }

      // row background
      if(i%2===0){doc.setFillColor(248,250,253);doc.rect(lm,y-3.5,pw,6,'F');}

      var iName=(it.qty&&it.n.indexOf('_____')>-1)?it.n.replace('_____','['+it.qty+']'):it.n;
      var iLines=doc.splitTextToSize((i+1)+'.  '+iName,pw-22);
      doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      doc.text(iLines,lm+2,y);

      // status pill
      var pillW=12, pillX=rm-pillW;
      doc.setFillColor(fill[0],fill[1],fill[2]);
      doc.roundedRect(pillX,y-3.5,pillW,5.5,1.2,1.2,'F');
      doc.setFontSize(7);doc.setFont(undefined,'bold');
      doc.setTextColor(ink[0],ink[1],ink[2]);
      doc.text(lbl,pillX+pillW/2,y+0.3,{align:'center'});
      doc.setFont(undefined,'normal');doc.setFontSize(8.5);

      y+=iLines.length*5;

      if(it.obs){
        chkPage();
        doc.setTextColor(C_ORANGE[0],C_ORANGE[1],C_ORANGE[2]);doc.setFontSize(7.5);
        var obsLines=doc.splitTextToSize('   ⚠  '+it.obs,pw-10);
        doc.text(obsLines,lm+4,y);
        y+=obsLines.length*4.5;
        doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      }

      var fotosArr=it.fotos||[];
      for(var fp=0;fp<fotosArr.length;fp++){
        var fi=fotosArr[fp];
        if(!fi.d||fi.d.length<100)continue;
        try{
          var ft=fi.d.indexOf('image/png')>-1?'PNG':'JPEG';
          var fw=60,fh=40;
          if(y+fh+10>268){doc.addPage();y=16;}
          doc.addImage(fi.d,ft,lm+4,y,fw,fh);
          y+=fh+3;
          doc.setFontSize(7);doc.setTextColor(C_GREY[0],C_GREY[1],C_GREY[2]);
          doc.text('Photo '+(fp+1),lm+6,y);y+=5;
          doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
        }catch(e){
          doc.setTextColor(C_RED[0],C_RED[1],C_RED[2]);doc.setFontSize(7.5);
          doc.text('   [Photo could not be loaded]',lm+2,y);y+=5;
          doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
        }
      }
    }
    y+=3;
  }

  // ── FOOTER (all pages) ────────────────────────────────────────────────────
  var total=doc.internal.getNumberOfPages();
  for(var pg=1;pg<=total;pg++){
    doc.setPage(pg);
    doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
    doc.rect(0,287,210,10,'F');
    doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
    doc.rect(0,287,210,1,'F');
    doc.setFontSize(7);doc.setFont(undefined,'normal');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
    doc.text('TB Aviation  |  Flight Inspection Report  |  '+reg.mat+' — '+reg.mod,lm,293);
    doc.text('Page '+pg+' / '+total,198,293,{align:'right'});
  }

  var fileName='PREVIEW_FlightInspection_'+reg.mat+'.pdf';
  _showPdfSaveDialog(fileName, doc.output('blob'));
}

// ===== EXPORT PDF - MANDATORY DOCUMENTS =====
function exportMandatoryPDF(overrideReg){
  if(typeof window.jspdf==='undefined'){alert('PDF library not loaded.');return;}
  var reg=overrideReg||null;
  if(!reg){
    if(currentFinIdx<0){alert('No record selected.');return;}
    reg=FINS[currentFinIdx];
    if(!reg||reg.type!=='mandatory'){alert('Not a Mandatory record.');return;}
  }

  var doc=new window.jspdf.jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  var lm=12,rm=198,pw=186;
  var y=0;
  var chkPage=function(){if(y>268){doc.addPage();y=16;}};

  var C_NAVY=[26,42,74],C_BLUE=[74,144,217],C_WHITE=[255,255,255];
  var C_GREEN=[46,125,50],C_GREY=[120,120,120],C_TEXT=[30,30,30];

  // ── HEADER BAND ────────────────────────────────────────────────────────────
  doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
  doc.rect(0,0,210,38,'F');
  doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.rect(0,34,210,4,'F');
  try{
    if(window._logoTB&&window._logoTB.complete&&window._logoTB.naturalWidth>0){
      var cvs=document.createElement('canvas');
      cvs.width=window._logoTB.naturalWidth;cvs.height=window._logoTB.naturalHeight;
      cvs.getContext('2d').drawImage(window._logoTB,0,0);
      var _lmxW=50,_lmxH=24,_lpW,_lpH;
      if(window._logoTB.naturalWidth*_lmxH>window._logoTB.naturalHeight*_lmxW){_lpW=_lmxW;_lpH=Math.round(_lmxW*window._logoTB.naturalHeight/window._logoTB.naturalWidth*10)/10;}
      else{_lpH=_lmxH;_lpW=Math.round(_lmxH*window._logoTB.naturalWidth/window._logoTB.naturalHeight*10)/10;}
      doc.addImage(cvs.toDataURL('image/png'),'PNG',148,4,_lpW,_lpH);
    }
  }catch(e){}
  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.text('TB Aviation',lm,10);
  doc.setFontSize(18);doc.setFont(undefined,'bold');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
  doc.text('MANDATORY DOCUMENTS',lm,19);
  doc.setFontSize(10);doc.setFont(undefined,'normal');
  doc.text('Mandatory Documents Report',lm,26);
  doc.setFontSize(8);doc.setTextColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);
  doc.text('Generated: '+dh(),lm,32);
  y=46;

  // ── AIRCRAFT INFO CARD ────────────────────────────────────────────────────
  var _acPh=REG_IMGS[reg.mat]||'';
  var _cH=_acPh?60:48,_cY=y;
  doc.setFillColor(240,246,255);
  doc.setDrawColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.setLineWidth(0.5);
  doc.roundedRect(lm,y,pw,_cH,3,3,'FD');
  if(_acPh){try{
    var _ff=_acPh.indexOf('data:image/png')===0?'PNG':'JPEG';
    var _px=lm+pw-58,_py=_cY+15,_pw=54,_ph=_cH-19;
    doc.setFillColor(255,255,255);doc.roundedRect(_px,_py,_pw,_ph,2,2,'F');
    doc.addImage(_acPh,_ff,_px+1,_py+1,_pw-2,_ph-2);
    doc.setDrawColor(180,200,225);doc.setLineWidth(0.3);doc.roundedRect(_px,_py,_pw,_ph,2,2,'S');
  }catch(e){}}
  doc.setFontSize(11);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);
  doc.text('Aircraft Information',lm+4,y+8);
  doc.setDrawColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.setLineWidth(0.3);
  doc.line(lm+4,y+11,(_acPh?lm+pw-62:rm-4),y+11);
  doc.setFontSize(9);doc.setFont(undefined,'normal');doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
  if(_acPh){
    var _rows=[['Registration',reg.mat],['Model',reg.mod],['Serial No.',reg.serie],
               ['Responsible',reg.resp],['Created',reg.dc||''],['Completed',reg.df]];
    var ry=y+18;
    _rows.forEach(function(r){
      doc.setFont(undefined,'normal');doc.setTextColor(110,110,130);doc.text(r[0],lm+4,ry);
      doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(r[1]||'N/A',lm+32,ry);
      doc.setFont(undefined,'normal');doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);ry+=5.5;
    });
  }else{
    var lx=lm+4,rx=lm+96;
    doc.setTextColor(110,110,130);doc.text('Registration',lx,y+18);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(reg.mat,lx+28,y+18);doc.setFont(undefined,'normal');
    doc.setTextColor(110,110,130);doc.text('Model',rx,y+18);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(reg.mod,rx+18,y+18);doc.setFont(undefined,'normal');
    doc.setTextColor(110,110,130);doc.text('Serial No.',lx,y+25);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(reg.serie,lx+28,y+25);doc.setFont(undefined,'normal');
    doc.setTextColor(110,110,130);doc.text('Responsible',rx,y+25);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(reg.resp,rx+28,y+25);doc.setFont(undefined,'normal');
    doc.setTextColor(110,110,130);doc.text('Created',lx,y+32);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(reg.dc||'',lx+28,y+32);doc.setFont(undefined,'normal');
    doc.setTextColor(110,110,130);doc.text('Completed',rx,y+32);doc.setFont(undefined,'bold');doc.setTextColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.text(reg.df,rx+28,y+32);doc.setFont(undefined,'normal');
  }
  y=_cY+_cH+8;

  // ── STATUS PILLS ──────────────────────────────────────────────────────────
  var stLbl={'ok':'OK','na':'N/A','':'—'};
  var stFill={'ok':[232,245,233],'na':[240,240,240],'':[245,245,245]};
  var stInk={'ok':C_GREEN,'na':[84,110,122],'':[160,160,160]};

  // ── SECTIONS & ITEMS ─────────────────────────────────────────────────────
  doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);

  for(var s=0;s<reg.mand.length;s++){
    chkPage();
    doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.rect(lm,y,pw,7,'F');
    doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.rect(lm,y,3,7,'F');
    doc.setFontSize(8.5);doc.setFont(undefined,'bold');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
    doc.text((reg.mand[s].s||'Section').toUpperCase(),lm+6,y+5);
    y+=10;
    doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);

    var isLoa=reg.mand[s].s&&(reg.mand[s].s.indexOf('LOA')>-1||reg.mand[s].s.indexOf('Optional')>-1);
    for(var i=0;i<reg.mand[s].items.length;i++){
      var it=reg.mand[s].items[i];
      if(isLoa&&it.st==='')continue;
      chkPage();
      var lbl=stLbl[it.st]!==undefined?stLbl[it.st]:stLbl[''];
      var fill=stFill[it.st]||stFill[''];
      var ink=stInk[it.st]||stInk[''];

      if(i%2===0){doc.setFillColor(248,250,253);doc.rect(lm,y-3.5,pw,6,'F');}
      var iLines=doc.splitTextToSize((i+1)+'.  '+it.n,pw-22);
      doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      doc.text(iLines,lm+2,y);
      var pillW=12,pillX=rm-pillW;
      doc.setFillColor(fill[0],fill[1],fill[2]);doc.roundedRect(pillX,y-3.5,pillW,5.5,1.2,1.2,'F');
      doc.setFontSize(7);doc.setFont(undefined,'bold');doc.setTextColor(ink[0],ink[1],ink[2]);
      doc.text(lbl,pillX+pillW/2,y+0.3,{align:'center'});
      doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      y+=iLines.length*5;

      if(it.dt&&it.dt.trim()!==''){
        chkPage();
        var dtParts=it.dt.split('-');
        var dtDisp=dtParts.length===3?dtParts[2]+'/'+dtParts[1]+'/'+dtParts[0]:it.dt;
        doc.setFillColor(227,242,253);doc.roundedRect(lm+2,y-3,62,6,1,1,'F');
        doc.setFontSize(8);doc.setFont(undefined,'bold');doc.setTextColor(25,118,210);
        doc.text('Validity: '+dtDisp,lm+4,y+1);
        doc.setFont(undefined,'normal');doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);y+=7;
      }
      if(it.obs&&it.obs.trim()){
        chkPage();
        doc.setFontSize(7.5);doc.setTextColor(123,79,0);
        var obsLines=doc.splitTextToSize('   Note: '+it.obs,pw-10);
        doc.text(obsLines,lm+4,y);y+=obsLines.length*4.5;
        doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      }
      if(it.by&&it.completedAt){
        chkPage();
        doc.setFontSize(7);doc.setTextColor(C_GREY[0],C_GREY[1],C_GREY[2]);
        doc.text('   By: '+it.by+' | '+it.completedAt,lm+4,y);
        y+=4.5;doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
      }
      var fotosArr=it.fotos||[];
      for(var fp=0;fp<fotosArr.length;fp++){
        var fotoItem=fotosArr[fp];
        if(!fotoItem.d||fotoItem.d.length<100)continue;
        try{
          var fType=fotoItem.d.indexOf('image/png')>-1?'PNG':'JPEG';
          var _mProps=doc.getImageProperties(fotoItem.d);
          var _mMaxW=160,_mMaxH=100,_mW,_mH;
          if(_mProps.width*_mMaxH>_mProps.height*_mMaxW){_mW=_mMaxW;_mH=Math.round(_mMaxW*_mProps.height/_mProps.width);}
          else{_mH=_mMaxH;_mW=Math.round(_mMaxH*_mProps.width/_mProps.height);}
          if(y+_mH+8>268){doc.addPage();y=16;}
          doc.addImage(fotoItem.d,fType,lm+2,y,_mW,_mH);y+=_mH+3;
          doc.setFontSize(7);doc.setTextColor(C_GREY[0],C_GREY[1],C_GREY[2]);
          doc.text('   Photo '+(fp+1)+' by: '+fotoItem.by+' | '+fotoItem.dt,lm+2,y);
          y+=5;doc.setFontSize(8.5);doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
        }catch(e){
          doc.setFontSize(7.5);doc.setTextColor(200,0,0);
          doc.text('   [Photo could not be loaded]',lm+2,y);y+=5;
          doc.setTextColor(C_TEXT[0],C_TEXT[1],C_TEXT[2]);
        }
      }
    }
    y+=4;
  }

  // ── FOOTER ────────────────────────────────────────────────────────────────
  var total=doc.internal.getNumberOfPages();
  for(var pg=1;pg<=total;pg++){
    doc.setPage(pg);
    doc.setFillColor(C_NAVY[0],C_NAVY[1],C_NAVY[2]);doc.rect(0,287,210,10,'F');
    doc.setFillColor(C_BLUE[0],C_BLUE[1],C_BLUE[2]);doc.rect(0,287,210,1,'F');
    doc.setFontSize(7.5);doc.setFont(undefined,'normal');doc.setTextColor(C_WHITE[0],C_WHITE[1],C_WHITE[2]);
    doc.text('TB Aviation  |  Mandatory Documents Report  |  '+reg.mat+' — '+reg.mod,lm,292.5);
    doc.text('Page '+pg+' / '+total,rm,292.5,{align:'right'});
  }

  var fileName='MandatoryDocuments_'+reg.mat+'_'+reg.mod.replace(/ /g,'_')+'.pdf';
  _showPdfSaveDialog(fileName,doc.output('blob'));
}

// ===== ONEDRIVE / MSAL =====
var _msToken = null;
var _msalInstance = null;
var _msalReady = false;
var _odPicker = {idx:-1, path:'', pathParts:[], type:'fi'};
var _multiSel = {on:false, fins:{}, vtivte:{}};

var _msalConfig = {
  auth: {
    clientId: '17a52b1d-2a20-4e61-a187-5a2d0d12af78',
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: window.location.origin + window.location.pathname
  },
  cache: { cacheLocation: 'sessionStorage', storeAuthStateInCookie: false }
};
var _msScopes = ['Files.ReadWrite.All', 'User.Read'];

// ===== VERIFICA SE MSAL ESTÁ DISPONÍVEL =====
function _isMSALAvailable() {
  return (typeof window.msal !== 'undefined' && 
          typeof window.msal.PublicClientApplication !== 'undefined');
}

// ===== CONECTA ONEDRIVE =====
function connectOneDrive(){
  // Verificação rápida se MSAL já carregou
  if (_isMSALAvailable()) {
    console.log('✅ MSAL disponível, conectando...');
    _connectWithMSAL();
    return;
  }
  
  // Se falhou completamente
  if (window.msalAllFailed) {
    alert('❌ Error: MSAL library failed to load.\n\nCheck:\n' +
          '• Your internet connection\n' +
          '• Firewall/proxy blocking CDNs\n' +
          '• Ad blocker extensions\n\n' +
          'Try refreshing the page (Ctrl+R)');
    return;
  }
  
  // Se ainda está carregando, aguarda
  console.log('⏳ Aguardando MSAL carregar...');
  _waitForMSALWithTimeout(function(success) {
    if (success) {
      _connectWithMSAL();
    } else {
      alert('❌ MSAL failed to load. Please refresh the page and try again.');
    }
  });
}

// ===== AGUARDA COM TIMEOUT (menos agressivo) =====
function _waitForMSALWithTimeout(callback, maxWait) {
  maxWait = maxWait || 5000; // 5 segundos
  var startTime = Date.now();
  
  function check() {
    if (_isMSALAvailable()) {
      _msalReady = true;
      console.log('✅ MSAL carregado!');
      callback(true);
      return;
    }
    
    if (Date.now() - startTime > maxWait) {
      console.error('❌ MSAL timeout após ' + maxWait + 'ms');
      callback(false);
      return;
    }
    
    setTimeout(check, 200); // Verifica a cada 200ms, não 100ms
  }
  
  check();
}

window.addEventListener('load', function() {
  _waitForMSALWithTimeout(function(success) {
    if (success) {
      var instance = _initMSAL();
      _handleMsalRedirectResponse(instance);
    }
  }, 10000);
});

// ===== INICIALIZA MSAL =====
function _initMSAL() {
  if (_msalInstance) return _msalInstance;
  
  try {
    if (!_isMSALAvailable()) {
      console.error('❌ MSAL não disponível');
      return null;
    }
    _msalInstance = new window.msal.PublicClientApplication(_msalConfig);
    console.log('✅ PublicClientApplication inicializado');
    return _msalInstance;
  } catch (err) {
    console.error('❌ Erro ao inicializar MSAL:', err);
    return null;
  }
}

// ===== CONECTA COM MSAL =====
function _connectWithMSAL(){
  var instance = _initMSAL();
  if (!instance) {
    alert('❌ Error initializing MSAL. Please refresh the page.');
    return;
  }
  
  try {
    var accounts = instance.getAllAccounts();
    if (accounts.length > 0) {
      console.log('Usuário encontrado, tentando token silencioso...');
      instance.acquireTokenSilent({ scopes: _msScopes, account: accounts[0] })
        .then(_onMsToken)
        .catch(function(err) {
          console.debug('Token silencioso falhou, abrindo redirect...', err.message);
          _connectOneDriveRedirect(instance);
        });
    } else {
      console.log('Nenhum usuário, abrindo redirect de login...');
      _connectOneDriveRedirect(instance);
    }
  } catch (err) {
    console.error('Error connecting MSAL:', err);
    alert('❌ Error: ' + (err.message || err));
  }
}

// ===== LOGIN REDIRECT =====
var _msalInteractionInProgress = false;

function _connectOneDriveRedirect(instance){
  if (_msalInteractionInProgress) {
    console.warn('Interação MSAL já em andamento. Aguarde a janela de login.');
    _showToast('⚠️ OneDrive login already in progress. Close the previous window and try again.','warn');
    return;
  }
  _msalInteractionInProgress = true;
  // Save current session so we can restore it after the redirect returns.
  // Pair the username with a random nonce so only code from this page can set a valid entry.
  if(window.ME && window.ME.u){
    var _odNonce=Math.random().toString(36).slice(2)+Date.now().toString(36);
    sessionStorage.setItem('tb7_od_nonce', _odNonce);
    sessionStorage.setItem('tb7_od_restore', _odNonce+':'+window.ME.u);
  }
  try {
    instance.loginRedirect({ scopes: _msScopes });
  } catch (err) {
    console.error('OneDrive redirect error:', err);
    _msalInteractionInProgress = false;
    sessionStorage.removeItem('tb7_od_restore');
    sessionStorage.removeItem('tb7_od_nonce');
    _showToast('⚠️ Error starting login: ' + (err.message||err), 'warn');
  }
}

function _handleMsalRedirectResponse(instance) {
  if (!instance || !instance.handleRedirectPromise) return;
  instance.handleRedirectPromise()
    .then(function(response){
      if (response && response.accessToken) {
        _onMsToken(response);
        // Restore session if we came back from an OD redirect while logged in
        _tryRestoreSessionAfterODRedirect();
      } else {
        // No redirect — try silent auth with cached account
        var accounts = instance.getAllAccounts();
        if (accounts.length > 0) {
          instance.acquireTokenSilent({ scopes: _msScopes, account: accounts[0] })
            .then(_onMsToken)
            .catch(function(err) {
              console.debug('Auto silent OneDrive token failed:', err.message);
            });
        }
      }
      _msalInteractionInProgress = false;
    })
    .catch(function(err){
      console.error('MSAL redirect response error:', err);
      // Still try to restore session even if OD failed
      _tryRestoreSessionAfterODRedirect();
      _msalInteractionInProgress = false;
    });
}

function _tryRestoreSessionAfterODRedirect(){
  var raw = sessionStorage.getItem('tb7_od_restore');
  var nonce = sessionStorage.getItem('tb7_od_nonce');
  sessionStorage.removeItem('tb7_od_restore');
  sessionStorage.removeItem('tb7_od_nonce');
  if (!raw || !nonce) return;
  var sep = raw.indexOf(':');
  if (sep < 0 || raw.slice(0, sep) !== nonce) return; // tamper check
  var savedU = raw.slice(sep + 1);
  if (!savedU) return;
  var all = getAllUsers();
  var found = null;
  for(var i=0;i<all.length;i++){ if(all[i].u===savedU){found=all[i];break;} }
  if(!found) return;
  ME = found;
  document.getElementById('pg-login').style.display='none';
  document.getElementById('pg-main').style.display='block';
  document.getElementById('huser').textContent='Hello, '+found.nome;
  document.getElementById('hadm').style.display=(found.role==='adm')?'inline-block':'none';
  var hdevEl2=document.getElementById('hdev');
  if(hdevEl2) hdevEl2.style.display=(found.role==='dev')?'inline-block':'none';
  document.getElementById('form-adm').style.display=isAdm(found.role)?'block':'none';
  var fVTIVTE=document.getElementById('form-vtivte-adm');
  if(fVTIVTE) fVTIVTE.style.display=isAdm(found.role)?'block':'none';
  var tbAdmBtn=document.getElementById('tb-adm');
  if(tbAdmBtn) tbAdmBtn.style.display=isAdm(found.role)?'':'none';
  var devChangesTab2=document.getElementById('adm-tab-changes');
  if(devChangesTab2) devChangesTab2.style.display=(found.role==='dev')?'inline-block':'none';
  var fbBtn=document.getElementById('btn-feedback');
  if(fbBtn) fbBtn.style.display='inline-block';
  if(isAdm(found.role)) fbLoadUnreadBadge();
  logActivity('login','');
  if(typeof _loadRegImgsFromCloud==='function') _loadRegImgsFromCloud(function(){});
  if(typeof cloudLoad==='function'){
    cloudLoad(found.u, function(){ aba('active'); render(); renderFin(); if(typeof renderFinVTIVTE==='function')renderFinVTIVTE(); });
  } else {
    aba('active'); render(); renderFin(); if(typeof renderFinVTIVTE==='function')renderFinVTIVTE();
  }
}

// ===== TOKEN RECEBIDO =====
function _onMsToken(result){
  _msToken = result.accessToken;
  var btn = document.getElementById('btnOneDrive');
  if(btn){ btn.style.background='#43a047'; btn.textContent='✅ OneDrive'; }
  var btnLogin = document.getElementById('btnOneDriveLogin');
  if(btnLogin){ btnLogin.style.background='#43a047'; btnLogin.textContent='✅ OneDrive Connected'; }
  _showToast('✅ OneDrive connected!', 'ok');
}

// ===== MODAL SALVAR PDF (SEM UPLOAD AUTOMÁTICO) =====
// _odUploadPending is set by confirmarUploadOneDrive* before the PDF is generated.
// _showPdfSaveDialog checks it so the PDF goes directly to OneDrive without a dialog.
var _odUploadPending = null;

function _showPdfSaveDialog(defaultFileName, blob){
  // OneDrive upload intercept — no monkey-patching needed
  if(_odUploadPending){
    var od=_odUploadPending;
    _odUploadPending=null;
    if(od.isShared) _uploadToOneDriveShared(blob, defaultFileName, od.driveId, od.itemId);
    else            _uploadToOneDriveCustom(blob, defaultFileName, od.folder);
    return;
  }
  var existing = document.getElementById('mod-pdf-save');
  if(existing) existing.remove();
  
  var html = '<div id="mod-pdf-save" style="position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9999;display:flex;align-items:center;justify-content:center;">' +
    '<div style="background:#fff;border-radius:12px;padding:28px 28px 22px;width:380px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,.22);">' +
      '<h3 style="margin:0 0 18px;font-size:16px;color:#1a2a4a;">📄 Save PDF</h3>' +
      '<label style="display:block;font-size:12px;color:#555;margin-bottom:4px;font-weight:600;">File Name</label>' +
      '<input id="pdf-save-name" type="text" value="'+defaultFileName+'" style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #ccc;border-radius:6px;font-size:13px;margin-bottom:14px;">' +
      '<small style="font-size:11px;color:#888;display:block;margin-bottom:14px;">💾 The PDF will be saved locally to your Downloads folder.</small>' +
      '<div style="display:flex;gap:10px;margin-top:22px;">' +
        '<button onclick="_confirmPdfSave()" style="flex:1;padding:10px;background:linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);color:#fff;border:none;border-radius:7px;font-weight:bold;font-size:14px;cursor:pointer;box-shadow:0 4px 12px rgba(76,175,80,0.3);transition:all 0.3s ease;">💾 Save PDF</button>' +
        '<button onclick="document.getElementById(\'mod-pdf-save\').remove()" style="flex:1;padding:10px;background:#eee;color:#333;border:none;border-radius:7px;font-size:14px;cursor:pointer;transition:all 0.3s ease;">Cancel</button>' +
      '</div>' +
    '</div>' +
  '</div>';
  
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('pdf-save-name').select();
  window._pendingPdfBlob = blob;
}

function _confirmPdfSave(){
  var nameInput = document.getElementById('pdf-save-name');
  var fileName = (nameInput ? nameInput.value.trim() : '') || 'checklist.pdf';
  if(!fileName.toLowerCase().endsWith('.pdf')) fileName += '.pdf';
  
  var blob = window._pendingPdfBlob;
  document.getElementById('mod-pdf-save').remove();
  window._pendingPdfBlob = null;
  
  // ✅ Salva APENAS localmente (SEM upload automático)
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(function(){URL.revokeObjectURL(url);}, 1000);
  
  // ✅ Mensagem de sucesso
  if(window._showToast){
    _showToast('✅ PDF saved locally!', 'ok');
  } else {
    alert('✅ PDF saved to Downloads!');
  }
}

// ===== CRIA PASTAS ANINHADAS NO ONEDRIVE =====
function _ensureOneDrivePath(folderPath) {
  var parts = folderPath.split('/').filter(function(p){ return p.length > 0; });
  var p = Promise.resolve();
  parts.forEach(function(part, i) {
    var parentPath = parts.slice(0, i).join('/');
    p = p.then(function() {
      var url = parentPath
        ? 'https://graph.microsoft.com/v1.0/me/drive/root:/' + encodeURIComponent(parentPath).replace(/%2F/g,'/') + ':/children'
        : 'https://graph.microsoft.com/v1.0/me/drive/root/children';
      return fetch(url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + _msToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: part, folder: {}, '@microsoft.graph.conflictBehavior': 'fail' })
      }).catch(function(){ /* folder already exists */ });
    });
  });
  return p;
}

// ===== UPLOAD PARA ONEDRIVE (Microsoft Graph API) =====
// Chunk size must be a multiple of 320 KiB; 10×320 KiB ≈ 3.13 MB
var _OD_CHUNK = 320 * 1024 * 10;   // 3,276,800 bytes
var _OD_SIMPLE_LIMIT = 4 * 1024 * 1024; // 4 MB — simple PUT limit

// Shared helper: uploads blob to a pre-built createSessionUrl (own or shared drive)
function _odUpload(blob, fileName, createSessionUrl, simplePutUrl) {
  if(blob.size <= _OD_SIMPLE_LIMIT) {
    return fetch(simplePutUrl, {
      method: 'PUT',
      headers: {'Authorization':'Bearer '+_msToken, 'Content-Type':'application/pdf'},
      body: blob
    }).then(function(res) {
      if(res.ok) { _showToast('✅ PDF uploaded: '+fileName, 'ok'); return; }
      return res.json().then(function(e) {
        throw new Error((e.error&&e.error.message)||'HTTP '+res.status);
      });
    });
  }

  // Large file — upload session
  _showToast('⏳ Creating upload session...', 'ok');
  return fetch(createSessionUrl, {
    method: 'POST',
    headers: {'Authorization':'Bearer '+_msToken, 'Content-Type':'application/json'},
    body: JSON.stringify({item:{'@microsoft.graph.conflictBehavior':'replace'}})
  })
  .then(function(r){ return r.json(); })
  .then(function(session) {
    if(!session.uploadUrl) throw new Error('Failed to create upload session');
    return _odUploadChunks(blob, fileName, session.uploadUrl, 0);
  });
}

function _odUploadChunks(blob, fileName, uploadUrl, start) {
  var total = blob.size;
  var end   = Math.min(start + _OD_CHUNK - 1, total - 1);
  var chunk = blob.slice(start, end + 1);
  var pct   = Math.round(((end + 1) / total) * 100);
  _showToast('⏳ Uploading... ' + pct + '%', 'ok');

  return fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(chunk.size),
      'Content-Range' : 'bytes ' + start + '-' + end + '/' + total,
      'Content-Type'  : 'application/pdf'
    },
    body: chunk
  })
  .then(function(res) {
    if(res.status === 202) return _odUploadChunks(blob, fileName, uploadUrl, end + 1);
    if(res.status === 200 || res.status === 201) {
      _showToast('✅ PDF uploaded: ' + fileName, 'ok');
      return;
    }
    return res.json().then(function(e) {
      throw new Error((e.error&&e.error.message)||'HTTP '+res.status);
    });
  });
}

function _uploadToOneDriveCustom(blob, fileName, folder) {
  if(!_msToken) { alert('❌ OneDrive not connected.'); return; }
  if(!blob)     { alert('❌ No PDF data to upload.'); return; }

  folder = (folder || 'TB_Aviation_Checklists').replace(/^\/+|\/+$/g, '');
  var path = encodeURIComponent(folder+'/'+fileName).replace(/%2F/g,'/');
  var base = 'https://graph.microsoft.com/v1.0/me/drive/root:/'+path;

  _showToast('⏳ Uploading to OneDrive...', 'ok');
  _ensureOneDrivePath(folder)
  .then(function() {
    return _odUpload(blob, fileName, base+':/createUploadSession', base+':/content');
  })
  .catch(function(err) {
    _showToast('❌ Upload failed: '+(err.message||err), 'warn');
    alert('❌ Upload to OneDrive failed:\n'+(err.message||err));
    console.error('OneDrive upload error:', err);
  });
}

// ===== UPLOAD PARA PASTA COMPARTILHADA =====
function _uploadToOneDriveShared(blob, fileName, driveId, itemId) {
  if(!_msToken)             { alert('❌ OneDrive not connected.'); return; }
  if(!blob)                 { alert('❌ No PDF data to upload.'); return; }
  if(!driveId || !itemId)   { alert('❌ No shared folder selected.'); return; }

  var base = 'https://graph.microsoft.com/v1.0/drives/'+driveId+'/items/'+itemId+':/'+encodeURIComponent(fileName);
  _showToast('⏳ Uploading to shared OneDrive...', 'ok');
  _odUpload(blob, fileName, base+':/createUploadSession', base+':/content')
  .catch(function(err) {
    _showToast('❌ Upload failed: '+(err.message||err), 'warn');
    alert('❌ Upload to shared folder failed:\n'+(err.message||err));
    console.error('OneDrive shared upload error:', err);
  });
}

function aba(a){
  var pgActive=document.getElementById('pg-active');
  var pgMandatory=document.getElementById('pg-mandatory');
  var pgFin=document.getElementById('pg-fin');
  var pgVTIVTE=document.getElementById('pg-vtivte');
  var pgAdm=document.getElementById('pg-adm');
  var tb1=document.getElementById('tb1');
  var tb3=document.getElementById('tb3');
  var tb2=document.getElementById('tb2');
  var tbVTIVTE=document.getElementById('tb-vtivte');
  var tbAdm=document.getElementById('tb-adm');
  var allPgs=[pgActive,pgMandatory,pgFin,pgVTIVTE,pgAdm];
  var allTbs=[tb1,tb3,tb2,tbVTIVTE,tbAdm];
  allPgs.forEach(function(p){if(p)p.style.display='none';});
  allTbs.forEach(function(t){if(t&&t.style.display!=='none')t.className='tab';});

  if(a==='active'){
    if(pgActive)pgActive.style.display='block';
    if(tb1)tb1.className='tab active';
    if(typeof render==='function')render();
  }
  else if(a==='mandatory'){
    if(pgMandatory)pgMandatory.style.display='block';
    if(tb3)tb3.className='tab active';
    var fMandAdm=document.getElementById('form-mandatory-adm');
    if(fMandAdm) fMandAdm.style.display=(ME&&isAdm(ME.role))?'block':'none';
    if(typeof renderMandatory==='function')renderMandatory();
  }
  else if(a==='fin'){
    if(pgFin)pgFin.style.display='block';
    if(tb2)tb2.className='tab active';
    if(typeof renderFin==='function')renderFin();
    if(typeof renderFinVTIVTE==='function')renderFinVTIVTE();
  }
  else if(a==='vtivte'){
    if(pgVTIVTE)pgVTIVTE.style.display='block';
    if(tbVTIVTE)tbVTIVTE.className='tab active';
    var fVTIVTE=document.getElementById('form-vtivte-adm');
    if(fVTIVTE) fVTIVTE.style.display=(ME&&isAdm(ME.role))?'block':'none';
    if(typeof renderVTIVTE==='function')renderVTIVTE();
  }
  else if(a==='adm'){
    if(pgAdm)pgAdm.style.display='block';
    if(tbAdm)tbAdm.className='tab active';
    admTab('log');
  }
}
// ===== RENDER MANDATORY - CORRIGIDO COMPLETO COM data-loa-key =====
function renderMandatory(){
  var filtro=document.getElementById('busca-mandatory')?document.getElementById('busca-mandatory').value.toLowerCase():'';
  var lista=document.getElementById('lista-mandatory');
  if(!lista){console.error('❌ lista-mandatory not found!');return;}
  lista.innerHTML='';
  
  if(!MAND||MAND.length===0){
    lista.innerHTML='<div style="padding:40px;text-align:center;color:#999;"><p>📋 No mandatory documents yet.</p></div>';
    return;
  }
  
  // Remove any MAND record that already has a finalized counterpart in FINS (sync safety)
  var _finsMand=(FINS||[]).filter(function(f){return f.type==='mandatory';});
  var _staleMand=[];
  for(var _mi=0;_mi<MAND.length;_mi++){
    var _m=MAND[_mi];
    if(_finsMand.some(function(f){return f.mat===_m.mat&&f.mod===_m.mod&&(f.serie||'')===((_m.serie)||'');})){
      _staleMand.push(_mi);
    }
  }
  if(_staleMand.length){
    for(var _si=_staleMand.length-1;_si>=0;_si--)MAND.splice(_staleMand[_si],1);
    svMand();
  }

  var found=[];
  for(var m=0;m<MAND.length;m++){
    var md=MAND[m];
    if(md.mat.toLowerCase().indexOf(filtro)>-1||md.mod.toLowerCase().indexOf(filtro)>-1){
      found.push(m);
    }
  }
  
  if(!found.length){
    lista.innerHTML='<div style="padding:40px;text-align:center;color:#999;"><p>🔍 No documents found.</p></div>';
    return;
  }

  for(var fi=0;fi<found.length;fi++){
    var idx=found[fi];
    var md=MAND[idx];
    var res=sgResMand(md.mand);

    var mandH='<div style="padding:14px;border-top:1px solid #f0f0f0;">';
    
    for(var s=0;s<md.mand.length;s++){
      var sec=md.mand[s];
      var sectionName=(typeof sec.s==='string')?sec.s:'Sem título';
      
      mandH+='<div style="margin-bottom:16px;">';
      mandH+='<h4 style="font-size:13px;font-weight:700;color:#4A90D9;margin:0 0 10px 0;text-transform:uppercase;">'+sectionName+'</h4>';
      
      // ✅ VERIFICAR SE É SEÇÃO LOA
      var isLoaSection=sectionName.indexOf('LOA')>-1;
      var isOptionalSection=sectionName.indexOf('Optional')>-1;

      if(isOptionalSection){
        // Multi-toggle for Optional / Not Required — each item independently selectable
        var optSelectedItems=[];
        for(var i=0;i<sec.items.length;i++){
          if(sec.items[i].st==='ok') optSelectedItems.push(sec.items[i].n);
        }
        mandH+='<div style="margin-bottom:12px;padding:12px;background:#fff8e1;border-radius:8px;border-left:5px solid #ffa000;">';
        mandH+='<small style="color:#5d4037;font-weight:700;display:block;margin-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">Select if applicable (optional):</small>';
        if(optSelectedItems.length>0){
          mandH+='<div style="display:flex;gap:8px;flex-wrap:wrap;">';
          for(var oi=0;oi<optSelectedItems.length;oi++){
            mandH+='<span style="background:#ffa000;color:white;padding:6px 14px;border-radius:14px;font-size:12px;font-weight:700;display:inline-block;">✓ '+optSelectedItems[oi]+'</span>';
          }
          mandH+='</div>';
        }else{
          mandH+='<small style="color:#999;font-style:italic;">None selected — not required for completion.</small>';
        }
        mandH+='</div>';
        for(var i=0;i<sec.items.length;i++){
          var it=sec.items[i];
          var isOk=it.st==='ok';
          var obsVal=it.obs?it.obs.replace(/"/g,'&quot;'):'';
          var dtVal=it.dt||'';
          mandH+='<div style="padding:10px;background:#f9f9f9;border-radius:6px;margin-bottom:8px;border-left:3px solid '+(isOk?'#ffa000':'#ddd')+';">';
          mandH+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">';
          mandH+='<span style="font-size:13px;color:#333;flex:1;min-width:120px;">'+it.n+'</span>';
          mandH+='<input type="date" value="'+dtVal+'" onchange="saveMandDt('+idx+','+s+','+i+',this.value)" style="padding:6px 8px;border:1.5px solid #dde3ed;border-radius:6px;font-size:11px;background:white;cursor:pointer;flex-shrink:0;" title="Expiration date">';
          mandH+='<button onclick="toggleOptionalItem('+idx+','+s+','+i+')" style="padding:6px 14px;border-radius:8px;border:1.5px solid '+(isOk?'#ffa000':'#bbb')+';background:'+(isOk?'#ffa000':'white')+';color:'+(isOk?'white':'#666')+';font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;">'+(isOk?'✓ Selected':'Select')+'</button>';
          mandH+='</div>';
          mandH+='<textarea placeholder="📝 Add observation..." onchange="saveMandObs('+idx+','+s+','+i+',this.value)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;min-height:50px;resize:vertical;font-family:\'Segoe UI\',Arial,sans-serif;box-sizing:border-box;">'+obsVal+'</textarea>';
          mandH+='<button class="cl-photo-add" onclick="abrirModFotoMand('+idx+','+s+','+i+')" style="margin-top:6px;margin-bottom:'+(it.fotos&&it.fotos.length>0?'8':'0')+'px;">📷 Add Photo</button>';
          if(it.fotos&&it.fotos.length>0){
            mandH+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:6px;padding-top:8px;border-top:1px solid #ddd;">';
            for(var fp=0;fp<it.fotos.length;fp++){
              mandH+='<div style="position:relative;aspect-ratio:1;border:1px solid #ddd;border-radius:6px;overflow:hidden;cursor:pointer;" onclick="verImg(\''+it.fotos[fp].d+'\')">';
              mandH+='<img src="'+it.fotos[fp].d+'" style="width:100%;height:100%;object-fit:cover;">';
              mandH+='<button style="position:absolute;top:2px;right:2px;background:#e53935;color:white;border:none;border-radius:50%;width:18px;height:18px;padding:0;cursor:pointer;font-size:10px;font-weight:bold;" onclick="event.stopPropagation();rmMandFoto('+idx+','+s+','+i+','+fp+')">✕</button>';
              mandH+='</div>';
            }
            mandH+='</div>';
          }
          mandH+='</div>';
        }

      }else if(isLoaSection){
        // Summary: show selected LOAs as green tags
        var loasSelected=[];
        for(var i=0;i<sec.items.length;i++){
          if(sec.items[i].st==='ok') loasSelected.push(sec.items[i].n);
        }
        mandH+='<div style="margin-bottom:12px;padding:12px;background:#e8f5e9;border-radius:8px;border-left:5px solid #43a047;">';
        mandH+='<small style="color:#1a2a4a;font-weight:700;display:block;margin-bottom:8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">✓ Selected LOAs:</small>';
        if(loasSelected.length>0){
          mandH+='<div style="display:flex;gap:8px;flex-wrap:wrap;">';
          for(var lIdx=0;lIdx<loasSelected.length;lIdx++){
            mandH+='<span style="background:#43a047;color:white;padding:8px 14px;border-radius:16px;font-size:12px;font-weight:700;display:inline-flex;align-items:center;gap:6px;">✓ '+loasSelected[lIdx]+'</span>';
          }
          mandH+='</div>';
        }else{
          mandH+='<small style="color:#999;font-style:italic;">No LOAs selected yet.</small>';
        }
        mandH+='</div>';

        // One row per LOA with a single Select toggle button
        for(var i=0;i<sec.items.length;i++){
          var it=sec.items[i];
          var isOk=it.st==='ok';
          var dtVal=it.dt||'';
          var obsVal=it.obs?it.obs.replace(/"/g,'&quot;'):'';
          mandH+='<div style="padding:10px;background:#f9f9f9;border-radius:6px;margin-bottom:8px;border-left:3px solid '+(isOk?'#43a047':'#ddd')+';">';
          mandH+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:'+(isOk?'8':'0')+'px;">';
          mandH+='<span style="font-size:13px;color:#333;flex:1;min-width:120px;">'+it.n+'</span>';
          mandH+='<input type="date" value="'+dtVal+'" onchange="saveMandDt('+idx+','+s+','+i+',this.value)" style="padding:6px 8px;border:1.5px solid #dde3ed;border-radius:6px;font-size:11px;background:white;cursor:pointer;flex-shrink:0;" title="Validity date"'+(isOk?'':' disabled')+'>';
          mandH+='<button onclick="toggleOptionalItem('+idx+','+s+','+i+')" style="padding:6px 14px;border-radius:8px;border:1.5px solid '+(isOk?'#43a047':'#bbb')+';background:'+(isOk?'#43a047':'white')+';color:'+(isOk?'white':'#666')+';font-size:12px;font-weight:700;cursor:pointer;flex-shrink:0;">'+(isOk?'✓ Selected':'Select')+'</button>';
          mandH+='</div>';
          if(isOk){
            mandH+='<textarea placeholder="📝 Add observation..." onchange="saveMandObs('+idx+','+s+','+i+',this.value)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;min-height:50px;resize:vertical;font-family:\'Segoe UI\',Arial,sans-serif;box-sizing:border-box;margin-bottom:6px;">'+obsVal+'</textarea>';
            mandH+='<button class="cl-photo-add" onclick="abrirModFotoMand('+idx+','+s+','+i+')" style="margin-bottom:'+(it.fotos&&it.fotos.length>0?'8':'0')+'px;">📷 Add Photo</button>';
            if(it.fotos&&it.fotos.length>0){
              mandH+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:6px;padding-top:8px;border-top:1px solid #ddd;">';
              for(var fp=0;fp<it.fotos.length;fp++){
                mandH+='<div style="position:relative;aspect-ratio:1;border:1px solid #ddd;border-radius:6px;overflow:hidden;cursor:pointer;" onclick="verImg(\''+it.fotos[fp].d+'\')">';
                mandH+='<img src="'+it.fotos[fp].d+'" style="width:100%;height:100%;object-fit:cover;">';
                mandH+='<button style="position:absolute;top:2px;right:2px;background:#e53935;color:white;border:none;border-radius:50%;width:18px;height:18px;padding:0;cursor:pointer;font-size:10px;font-weight:bold;" onclick="event.stopPropagation();rmMandFoto('+idx+','+s+','+i+','+fp+')">✕</button>';
                mandH+='</div>';
              }
              mandH+='</div>';
            }
          }
          mandH+='</div>';
        }

      }else{
        // ✅ ITEMS NORMAIS COM DATA DE VENCIMENTO À ESQUERDA DO OK
        for(var i=0;i<sec.items.length;i++){
          var it=sec.items[i];
          var itemName=(typeof it.n==='string')?it.n:'';
          if(!itemName)continue;
          
          var obsVal=it.obs?it.obs.replace(/"/g,'&quot;'):'';
          var dtVal=it.dt||'';
          
          var _itemBorder=it.st==='ok'?'#43a047':it.st==='na'?'#90a4ae':'#ddd';
          mandH+='<div style="padding:10px;background:'+(it.st==='na'?'#f5f7f8':'#f9f9f9')+';border-radius:6px;margin-bottom:8px;border-left:3px solid '+_itemBorder+';">';

          // LINHA 1: Nome, DATA DE VENCIMENTO (à esquerda), OK e N/A
          mandH+='<div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap;">';
          mandH+='<span style="flex:1;min-width:150px;font-weight:600;color:#1a2a4a;font-size:13px;">'+itemName+'</span>';
          
          var okOn=it.st==='ok'?'style="background:#43a047;color:white;"':'';
          var naOn=it.st==='na'?'style="background:#90a4ae;color:white;"':'';
          
          // 🔵 DATA DE VENCIMENTO - À ESQUERDA DO OK!
          mandH+='<input type="date" value="'+dtVal+'" onchange="saveMandDt('+idx+','+s+','+i+',this.value)" style="padding:6px 8px;border:1.5px solid #dde3ed;border-radius:6px;font-size:11px;background:white;cursor:pointer;flex-shrink:0;order:2;" title="Expiration date">';
          
          // OK BUTTON - AGORA VINDO DEPOIS DA DATA
          mandH+='<button class="sb ok'+((it.st==='ok')?'on':'')+'" onclick="setMandStatus('+idx+','+s+','+i+',\'ok\')" '+okOn+' style="padding:6px 12px;background:#f0f0f0;border:1px solid #ddd;border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;order:3;">✓ OK</button>';
          
          // N/A BUTTON (gray = not applicable, excluded from result)
          mandH+='<button class="sb na'+((it.st==='na')?'on':'')+'" onclick="setMandStatus('+idx+','+s+','+i+',\'na\')" '+naOn+' style="padding:6px 12px;background:#f0f0f0;border:1px solid #ccc;border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;order:4;color:#607d8b;">N/A</button>';
          
          mandH+='</div>';
          
          // ✅ OBSERVAÇÕES
          mandH+='<div style="margin-bottom:8px;">';
          mandH+='<textarea placeholder="📝 Add observation..." onchange="saveMandObs('+idx+','+s+','+i+',this.value)" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:4px;font-size:12px;min-height:50px;resize:vertical;font-family:\'Segoe UI\',Arial,sans-serif;">'+obsVal+'</textarea>';
          mandH+='</div>';
          
          // ✅ BOTÃO PARA ADICIONAR FOTO
          mandH+='<button class="cl-photo-add" onclick="abrirModFotoMand('+idx+','+s+','+i+')" style="margin-bottom:8px;">📷 Add Photo</button>';
          
          // ✅ MOSTRAR FOTOS SE EXISTIREM
          if(it.fotos&&it.fotos.length>0){
            mandH+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:6px;padding-top:8px;border-top:1px solid #ddd;">';
            for(var fp=0;fp<it.fotos.length;fp++){
              mandH+='<div style="position:relative;aspect-ratio:1;border:1px solid #ddd;border-radius:6px;overflow:hidden;cursor:pointer;" onclick="verImg(\''+it.fotos[fp].d+'\')">';
              mandH+='<img src="'+it.fotos[fp].d+'" style="width:100%;height:100%;object-fit:cover;">';
              mandH+='<button style="position:absolute;top:2px;right:2px;background:#e53935;color:white;border:none;border-radius:50%;width:18px;height:18px;padding:0;cursor:pointer;font-size:10px;font-weight:bold;" onclick="event.stopPropagation();rmMandFoto('+idx+','+s+','+i+','+fp+')">✕</button>';
              mandH+='</div>';
            }
            mandH+='</div>';
          }
          
          mandH+='</div>';
        }
      }
      
      mandH+='</div>';
    }
    
    mandH+='</div>';
    
    var d=document.createElement('div');
    d.className='mandatory-doc '+res;
    d.innerHTML='<div class="mand-header">'+
                  '<div class="mand-title"><h3>📄 '+md.mat+' — '+md.mod+'</h3>'+
                    '<div class="mand-tags"><span class="mand-tag">👤 '+md.resp+'</span><span class="mand-tag">🔗 '+md.serie+'</span><span class="mand-tag">📅 '+md.dc+'</span></div>'+
                  '</div>'+
                '</div>'+
                mandH+
                '<div style="padding:10px;background:#f9f9f9;border-top:1px solid #eee;display:flex;gap:8px;">'+
                  '<button onclick="finalizarMandatory('+idx+')" style="flex:1;padding:8px;background:#43a047;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">✓ Finalize</button>'+
                  '<button onclick="verMandatory('+idx+')" style="flex:1;padding:8px;background:#666;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">👁️ View</button>'+
                  (ME&&isAdm(ME.role)?'<button onclick="rmMandatory('+idx+')" style="flex:1;padding:8px;background:#d32f2f;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:12px;">🗑 Delete</button>':'')+
                '</div>';
    lista.appendChild(d);
  }
}
// ===== SET MANDATORY STATUS =====
// ✅ NOVO
function setMandStatus(mi,si,ii,ns){
  var it=MAND[mi].mand[si].items[ii];
  if(it.st===ns){
    it.st='';
    it.by='';
    it.completedAt='';
    // ✅ NÃO apaga it.dt (data de vencimento digitada no input!)
  }else{
    it.st=ns;
    it.by=(ME&&ME.nome)?ME.nome:'Unknown User';
    it.completedAt=dh(); // ← timestamp vai para campo separado
    // ✅ NÃO sobrescreve it.dt (data de vencimento!)
  }
  svMand();
  renderMandatory();
}

// ===== CHECK MANDATORY STATUS =====
function sgResMand(mand){
  var hasOk=false;
  for(var s=0;s<mand.length;s++){
    var secName=mand[s].s||'';
    // LOA and Optional sections are not required — blank items there don't block completion
    var isOptional=secName.indexOf('LOA')>-1||secName.indexOf('Optional')>-1;
    for(var i=0;i<mand[s].items.length;i++){
      var st=mand[s].items[i].st;
      if(st==='na') continue;
      if(isOptional&&st==='') continue;
      if(st==='ok'){hasOk=true;}
      else return'warn'; // blank in required section = incomplete
    }
  }
  return hasOk?'ok':'neutral';
}

// ===== REMOVE MANDATORY =====
function rmMandatory(mi){
  if(confirm('Remove '+MAND[mi].mat+'?')){
    MAND.splice(mi,1);
    svMand();
    renderMandatory();
  }
}

// ===== SAVE MANDATORY OBSERVATION =====
function saveMandObs(mi,si,ii,val){
  MAND[mi].mand[si].items[ii].obs=val;
  svMand();
}

// ===== SAVE MANDATORY DATE =====
function saveMandDt(mi,si,ii,val){
  MAND[mi].mand[si].items[ii].dt=val;
  svMand();
}

// ===== CLEAR MANDATORY ITEM =====
function clearMandItem(mi,si,ii){
  if(confirm('Clear this item?')){
    var it=MAND[mi].mand[si].items[ii];
    it.st='';
    it.by='';
    it.dt='';
    it.obs='';
    svMand();
    renderMandatory();
  }
}

// ===== SALVAR FOTO - MANDATORY DOCUMENTS =====
function salvarFotoMand(){
  var idx=window._mandCurrentIdx;
  
  if(!idx || !Array.isArray(idx) || idx.length!==3){
    alert('❌ No item selected.');
    return;
  }
  
  if(!FD || FD.length<20){
    alert('❌ Please capture or upload a photo first.');
    return;
  }
  
  try {
    if(!MAND || !MAND[idx[0]] || !MAND[idx[0]].mand || !MAND[idx[0]].mand[idx[1]] || !MAND[idx[0]].mand[idx[1]].items || !MAND[idx[0]].mand[idx[1]].items[idx[2]]){
      alert('❌ Item structure not found.');
      return;
    }
  } catch(e) {
    alert('❌ Error accessing data structure.');
    console.error(e);
    return;
  }
  
  var it=MAND[idx[0]].mand[idx[1]].items[idx[2]];
  if(!it.fotos) it.fotos=[];
  
  it.fotos.push({
    d:FD,
    by:(ME&&ME.nome)?ME.nome:'Unknown User',
    dt:dh()
  });
  
  FD=null;
  svMand();
  renderMandatory();
  fecharModFoto();
  
  if(window._showToast){
    _showToast('✅ Photo saved successfully!','ok');
  } else {
    alert('✅ Photo saved successfully!');
  }
}

// ===== FECHAR MODAL FOTO =====
// ── Reset modal to clean state ────────────────────────────────
// Bumped every time the photo modal is (re)opened for an item, so a slow
// compression from a previous pick can detect it's stale and bail out
// instead of attaching its photo to whatever item is open when it finishes.
var _fotoUploadToken=0;
function _resetFotoModal(){
  _fotoUploadToken++;
  FD=null;
  document.getElementById('prev-img').style.display='none';
  document.getElementById('prev-img').src='';
  document.getElementById('foto-placeholder').style.display='block';
  document.getElementById('btn-retake').style.display='none';
  var c=document.getElementById('inp-foto-cam');if(c)c.value='';
  var g=document.getElementById('inp-foto');if(g)g.value='';
}

// ── Track which context opened the photo modal ─────────────────
var _fotoTipo = 'flight';
function mostrarBotaoCorreto(tipo){
  _fotoTipo = tipo;
}

// Called after capture/upload — auto-saves and closes modal
function _autoSalvar(){
  if(_fotoTipo==='flight')    { salvarFoto();     return; }
  if(_fotoTipo==='vtivte')    { salvarFotoVTIVTE(); return; }
  if(_fotoTipo==='mandatory') { salvarFotoMand(); return; }
  if(_fotoTipo==='admdesign') { _admDesignSalvarFoto(); return; }
}

function fecharModFoto(){
  _resetFotoModal();
  FT=null;
  document.getElementById('mod-foto').style.display='none';
}

// ── Flight Inspection — open photo modal ─────────────────────
function abrirModFoto(ai,si,ii){
  FT={ai:ai,si:si,ii:ii};
  _resetFotoModal();
  mostrarBotaoCorreto('flight');
  document.getElementById('mod-foto-label').textContent=AVS[ai].cl[si].items[ii].n;
  document.getElementById('mod-foto').style.display='flex';
}

// ── Mandatory Documents — open photo modal ────────────────────
function abrirModFotoMand(mi,si,ii){
  window._mandCurrentIdx=[mi,si,ii];
  if(!MAND[mi]||!MAND[mi].mand[si]||!MAND[mi].mand[si].items[ii]){
    alert('❌ Item not found.');return;
  }
  _resetFotoModal();
  mostrarBotaoCorreto('mandatory');
  document.getElementById('mod-foto-label').textContent=MAND[mi].mand[si].items[ii].n;
  document.getElementById('mod-foto').style.display='flex';
}

// ===== ATUALIZAR HINT DE SÉRIE BASEADO NO MODELO =====
function atualizarSerialHint(){
  var mod=document.getElementById('md-mod').value;
  var hint=document.getElementById('hint-mand-serie');
  
  var hints={
    'EMB-505 - Phenom 300':'Serial format: 50500XXX',
    'Falcon 900EX':'Serial format: FA-XXX',
    'Hawker 400A':'Serial format: HA-XXXX',
    'C750 - Citation X':'Serial format: 750-XXXX',
    'C525 - CJ1':'Serial format: 525-XXXX',
    'C525B - CJ3':'Serial format: 525B-XXXX',
    'Gulfstream G280':'Serial format: N-XXXXX',
    'Other':''
  };
  
  hint.textContent=hints[mod]||'';
}

// ===== FINALIZAR MANDATORY DOCUMENT =====
function finalizarMandatory(idx){
  if(MAND[idx]){
    var fin={
      id:Date.now(),
      mat:MAND[idx].mat,
      serie:MAND[idx].serie,
      mod:MAND[idx].mod,
      resp:MAND[idx].resp,
      dc:MAND[idx].dc,
      df:dh(),
      by:(ME&&ME.nome)?ME.nome:'Unknown',
      res:sgResMand(MAND[idx].mand),
      type:'mandatory',
      mand:JSON.parse(JSON.stringify(MAND[idx].mand))
    };
    
    var _mat=MAND[idx].mat, _mod=MAND[idx].mod;
    logActivity('fin_mand',_mat+' ('+_mod+')');
    FINS.unshift(fin);
    svf();
    MAND.splice(idx,1);
    svMand();
    if(typeof cloudSave==='function')cloudSave(true);
    renderMandatory();
    renderFin();
    _showFinalizeSuccess(_mat + ' — Mandatory Documents');
    _showToast('✅ Mandatory Document finalized! Redirecting to Completed tab...','ok');
    setTimeout(function(){
      aba('fin');
      var mandSec=document.getElementById('completed-mandatory-section');
      if(mandSec)mandSec.scrollIntoView({behavior:'smooth',block:'start'});
    },800);
  }
}
// ===== REOPEN FINALIZED MANDATORY — move back from FINS to MAND =====
function reopenMandatory(finIdx){
  var fin=FINS[finIdx];
  if(!fin||fin.type!=='mandatory')return;
  if(!confirm('Reabrir "'+fin.mat+' — '+fin.mod+'" para edição? O registro sairá do histórico.'))return;
  var md={
    mat:fin.mat,
    serie:fin.serie||'',
    mod:fin.mod||'',
    resp:fin.resp||'',
    dc:fin.dc||dh(),
    mand:JSON.parse(JSON.stringify(fin.mand||[]))
  };
  MAND.push(md);
  svMand();
  FINS.splice(finIdx,1);
  svf();
  logActivity('reopen_mand',fin.mat+' ('+fin.mod+')');
  renderFin();
  renderMandatory();
  _showToast('↩ Checklist reaberto na aba Mandatory Documents','ok');
  setTimeout(function(){aba('mandatory');},600);
}

// ===== VIEW MANDATORY DOCUMENT - CORRIGIDO PARA MOSTRAR TUDO =====
function verMandatory(idx){
  if(!MAND[idx]){alert('Document not found');return;}
  
  var md=MAND[idx];
  var modal=document.getElementById('mod-fin');
  var content=document.getElementById('mod-fin-content');
  
  content.innerHTML='';
  
  // ✅ ADICIONE BOTÃO DE FECHAR NO TOPO
  var topActionsHtml='<div style="display:flex;gap:8px;justify-content:flex-end;margin-bottom:16px;flex-wrap:wrap;">'+
    '<button type="button" class="btn-green" onclick="exportMandatoryPDF(MAND['+idx+'])">📄 Export PDF</button>'+
    '<button type="button" class="btn-outline" onclick="document.getElementById(\'mod-fin\').style.display=\'none\'">✕ Close</button>'+
  '</div>';
  
  var html=topActionsHtml+'<div style="padding:20px;background:white;border-radius:8px;">';
  html+='<h3 style="margin:0 0 16px 0;color:#1a2a4a;">📄 '+md.mat+' — '+md.mod+'</h3>';
  html+='<div style="margin-bottom:16px;padding:12px;background:#f0f4f8;border-radius:6px;border-left:4px solid #4A90D9;">';
  html+='<small><strong>✈️ Aircraft:</strong> '+md.mat+' | <strong>Model:</strong> '+md.mod+' | <strong>S/N:</strong> '+md.serie+'</small><br>';
  html+='<small><strong>👤 Responsible:</strong> '+md.resp+' | <strong>Created:</strong> '+md.dc+'</small>';
  html+='</div>';
  
  for(var s=0;s<md.mand.length;s++){
    var sec=md.mand[s];
    html+='<h4 style="color:#4A90D9;margin:20px 0 12px 0;padding-bottom:8px;border-bottom:2px solid #eef4fb;font-size:14px;font-weight:700;">'+sec.s+'</h4>';
    
    // ✅ SE É SEÇÃO LOA, MOSTRAR DIFERENTES
    var isLoaSection=sec.s.indexOf('LOA')>-1;
    
    if(isLoaSection){
      // Mostrar LOAs selecionadas
      html+='<div style="margin-bottom:12px;padding:10px;background:#e8f5e9;border-radius:6px;border-left:4px solid #43a047;">';
      html+='<strong style="color:#1a2a4a;">✓ Selected LOAs:</strong><br>';
      
      var loasFound=[];
      for(var i=0;i<sec.items.length;i++){
        var it=sec.items[i];
        if(it.st==='ok'){
          loasFound.push(it.n);
          html+='<span style="background:#43a047;color:white;padding:6px 12px;border-radius:12px;font-size:12px;font-weight:700;margin-right:6px;display:inline-block;margin-top:4px;">✓ '+it.n+'</span>';
        }
      }
      if(loasFound.length===0){
        html+='<small style="color:#999;">No LOAs selected</small>';
      }
      html+='</div>';
    }else{
      // Items normais com status e data
      for(var i=0;i<sec.items.length;i++){
        var it=sec.items[i];
        var statusTxt='[ ] PENDING';
        var statusColor='#999';
        
        if(it.st==='ok'){
          statusTxt='✓ OK';
          statusColor='#4A90D9';
        }else if(it.st==='na'){
          statusTxt='— N/A';
          statusColor='#ff9800';
        }
        
        html+='<div style="padding:10px;background:#f9f9f9;border-radius:6px;margin-bottom:8px;border-left:3px solid #ddd;">';
        html+='<div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap;">';
        html+='<strong style="flex:1;color:#1a2a4a;">'+it.n+'</strong>';
        
        // 🔵 MOSTRAR DATA DE VENCIMENTO
        if(it.dt){
          html+='<span style="background:#e3f2fd;color:#1976d2;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">📅 '+it.dt+'</span>';
        }
        
        html+='<span style="background:'+statusColor+';color:white;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:700;">'+statusTxt+'</span>';
        html+='</div>';
        
        if(it.obs){
          html+='<small style="color:#666;display:block;margin-bottom:6px;"><strong>Note:</strong> '+it.obs+'</small>';
        }
        
        // Mostrar fotos se existirem
        if(it.fotos&&it.fotos.length>0){
          html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(60px,1fr));gap:6px;margin-top:8px;padding-top:8px;border-top:1px solid #ddd;">';
          for(var fp=0;fp<it.fotos.length;fp++){
            html+='<div style="position:relative;aspect-ratio:1;border:1px solid #ddd;border-radius:6px;overflow:hidden;cursor:pointer;" onclick="verImg(\''+it.fotos[fp].d+'\')">';
            html+='<img src="'+it.fotos[fp].d+'" style="width:100%;height:100%;object-fit:cover;">';
            html+='<span style="position:absolute;bottom:0;left:0;right:0;background:rgba(0,0,0,0.6);color:white;font-size:9px;padding:2px;text-align:center;">'+it.fotos[fp].by.substring(0,10)+'</span>';
            html+='</div>';
          }
          html+='</div>';
        }
        
        html+='</div>';
      }
    }
  }
  
  html+='</div>';
  
  content.innerHTML=html;
  modal.style.display='flex';
}

// ===== REMOVER FOTO MANDATORY =====
function rmMandFoto(idx,s,i,fp){
  if(MAND[idx]&&MAND[idx].mand[s]&&MAND[idx].mand[s].items[i]&&MAND[idx].mand[s].items[i].fotos){
    MAND[idx].mand[s].items[i].fotos.splice(fp,1);
    svMand();
    renderMandatory();
  }
}
// ===== ADD MANDATORY - CORRIGIDO =====
function addMandatory(){
  var mat=document.getElementById('md-mat').value.toUpperCase().trim();
  var mod=document.getElementById('md-mod').value.trim();
  var serie=document.getElementById('md-serie').value.trim();
  var resp=document.getElementById('md-resp').value.trim();
  
  // ✅ VALIDAÇÃO
  if(!mat||!mod||!serie||!resp){
    alert('❌ Please fill in all required fields.');
    return;
  }
  
  var md={
    mat:mat,
    serie:serie,
    mod:mod,
    resp:resp,
    dc:dh(),
    mand:[]
  };
  
  // ✅ PROCESSAR TEMPLATE COM VALIDAÇÃO
  try{
    for(var cat in MAND_TEMPLATE){
      if(!MAND_TEMPLATE.hasOwnProperty(cat))continue;
      
      var sec={s:cat,items:[]};
      var templateItems=MAND_TEMPLATE[cat];
      
      if(!Array.isArray(templateItems)){
        console.warn('⚠️ WARNING: '+cat+' is not an array');
        continue;
      }
      
      for(var i=0;i<templateItems.length;i++){
        var itemName=templateItems[i];
        if(!itemName)continue;
        
        sec.items.push({
          n:itemName,
          st:'',
          by:'',
          dt:'',
          obs:'',
          fotos:[]
        });
      }
      
      if(sec.items.length>0){
        md.mand.push(sec);
      }
    }
  }catch(e){
    console.error('ERROR processing template:',e);
    alert('❌ Error adding document. Try again.');
    return;
  }
  
  // ✅ VALIDAR SE TEM SECTIONS
  if(md.mand.length===0){
    alert('❌ No document sections were created.');
    return;
  }
  
  // ✅ SALVAR NO ARRAY GLOBAL
  MAND.push(md);
  logActivity('add_mand',mat+' ('+mod+')');
  svMand();
  
  // ✅ LIMPAR FORMULÁRIO
  document.getElementById('md-mat').value='';
  document.getElementById('md-mod').value='';
  document.getElementById('md-serie').value='';
  document.getElementById('md-resp').value='';
  
  var hintElement=document.getElementById('hint-mand-serie');
  if(hintElement){
    hintElement.textContent='';
  }
  
  var formModal=document.getElementById('form-mandatory-adm');
  if(formModal){
    formModal.style.display='none';
  }
  
  // ✅ RENDERIZAR E MUDAR ABA (ANTES DO ALERT!)
  renderMandatory();
  aba('mandatory');
  
  alert('✅ Mandatory Document added successfully!');
}
// ===== INICIALIZAR MANDATORY =====
function initMandatory(){
  var formAdm=document.getElementById('form-mandatory-adm');
  
  if(!formAdm)return;
  
  // ✅ Mostrar form APENAS se for admin
  if(ME&&isAdm(ME.role)){
    formAdm.style.display='block';
  } else {
    formAdm.style.display='none';
  }
  
  // ✅ Renderizar lista
  renderMandatory();
}

// ===== NOVA FUNÇÃO - CORRIGIDA PARA LOAs COM data-loa-key =====
function toggleOptionalItem(idx, s, i){
  if(!MAND[idx]||!MAND[idx].mand[s])return;
  var it=MAND[idx].mand[s].items[i];
  if(it.st==='ok'){
    it.st=''; it.by=''; it.completedAt='';
  }else{
    it.st='ok';
    it.by=(ME&&ME.nome)?ME.nome:'Unknown User';
    it.completedAt=dh();
  }
  svMand();
  renderMandatory();
}

// ===== GLOSSARY =====
function fecharGlossario(){
  var m=document.getElementById('mod-glossary');
  if(m) m.style.display='none';
}

function filterGlossary(){
  var q=(document.getElementById('glossary-search').value||'').toLowerCase();
  var rows=document.querySelectorAll('#glossary-content [data-term]');
  rows.forEach(function(r){
    var match=r.getAttribute('data-term').toLowerCase().indexOf(q)>-1||
              r.textContent.toLowerCase().indexOf(q)>-1;
    r.style.display=match?'':'none';
  });
}

// Close mod-fin modal when clicking outside
document.getElementById('mod-fin').addEventListener('click',function(e){
  if(e.target===this){this.style.display='none';}
});

// ===== TOAST NOTIFICATION =====
function _showToast(message, type) {
  console.log('['+(type||'ok').toUpperCase()+'] '+message);
  var existing = document.getElementById('_toast-notif');
  if(existing) existing.remove();
  var bg = type === 'warn' ? '#c62828' : type === 'ok' ? '#2e7d32' : '#1565c0';
  var div = document.createElement('div');
  div.id = '_toast-notif';
  div.style.cssText = 'position:fixed;bottom:28px;right:24px;z-index:99999;background:'+bg+';color:#fff;padding:14px 22px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.28);max-width:340px;word-break:break-word;transition:opacity 0.4s;';
  div.textContent = message;
  document.body.appendChild(div);
  setTimeout(function(){ if(div.parentNode){div.style.opacity='0';setTimeout(function(){if(div.parentNode)div.parentNode.removeChild(div);},400);} }, 5000);
}

// ===== ONEDRIVE FILE PICKER =====
var _odSharedItems = {}; // key → {driveId, itemId, name} lookup to avoid inline encoding issues

function _odPickerOpen(idx, type) {
  if(!_msToken) {
    alert('❌ OneDrive not connected. Click the OneDrive button in the header first.');
    return;
  }
  var existing = document.getElementById('mod-od-picker');
  if(existing) existing.remove();

  _odPicker.idx = idx;
  _odPicker.path = '';
  _odPicker.pathParts = [];
  _odPicker.type = type || 'fi';
  _odPicker.mode = 'root';
  _odPicker.driveId = null;
  _odPicker.itemId = null;
  _odPicker.itemStack = [];
  _odSharedItems = {};

  var html =
    '<div id="mod-od-picker" style="position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:9999;display:flex;align-items:center;justify-content:center;">' +
      '<div style="background:#1e293b;border-radius:14px;width:500px;max-width:95vw;max-height:82vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.5);overflow:hidden;">' +
        '<div style="padding:16px 20px;border-bottom:1px solid #334155;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">' +
          '<div style="display:flex;align-items:center;gap:12px;">' +
            '<div style="width:40px;height:40px;background:#0078D4;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">☁️</div>' +
            '<div>' +
              '<div style="font-weight:700;color:#e2e8f0;font-size:15px;">OneDrive</div>' +
              '<div style="font-size:11px;color:#64748b;">Select folder then click Upload Here</div>' +
            '</div>' +
          '</div>' +
          '<button onclick="_odPickerClose()" style="width:32px;height:32px;background:#334155;border:none;border-radius:50%;color:#94a3b8;font-size:16px;cursor:pointer;">✕</button>' +
        '</div>' +
        '<div id="od-breadcrumb" style="padding:9px 16px;background:#253148;border-bottom:1px solid #1a2740;min-height:36px;display:flex;align-items:center;flex-wrap:wrap;gap:2px;flex-shrink:0;"></div>' +
        '<div id="od-file-list" style="flex:1;overflow-y:auto;min-height:180px;"></div>' +
        '<div style="padding:14px 18px;border-top:1px solid #334155;display:flex;gap:10px;flex-shrink:0;background:#1e293b;">' +
          '<button onclick="_odPickerUpload()" style="flex:1;padding:11px;background:#0078D4;color:#fff;border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;">☁️ Upload Here</button>' +
          '<button onclick="_odPickerClose()" style="padding:11px 20px;background:#334155;color:#94a3b8;border:none;border-radius:8px;font-size:14px;cursor:pointer;">Cancel</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.insertAdjacentHTML('beforeend', html);
  _odPickerLoad();
}

function _odPickerClose() {
  var el = document.getElementById('mod-od-picker');
  if(el) el.remove();
}

function _odPickerBreadcrumb() {
  var bcEl = document.getElementById('od-breadcrumb');
  if(!bcEl) return;
  var h = '<span onclick="_odPickerGoRoot()" style="cursor:pointer;color:#60a5fa;font-size:12px;font-weight:600;">☁️ OneDrive</span>';

  if(_odPicker.mode === 'own') {
    h += _odBcSep();
    if(_odPicker.pathParts.length === 0) {
      h += '<span style="color:#e2e8f0;font-size:12px;font-weight:600;">My OneDrive</span>';
    } else {
      h += '<span onclick="_odPickerGoTo(-1)" style="cursor:pointer;color:#60a5fa;font-size:12px;">My OneDrive</span>';
      for(var i=0;i<_odPicker.pathParts.length;i++) {
        h += _odBcSep();
        if(i < _odPicker.pathParts.length-1)
          h += '<span onclick="_odPickerGoTo('+i+')" style="cursor:pointer;color:#60a5fa;font-size:12px;">'+_escHtml(_odPicker.pathParts[i])+'</span>';
        else
          h += '<span style="color:#e2e8f0;font-size:12px;font-weight:600;">'+_escHtml(_odPicker.pathParts[i])+'</span>';
      }
    }
  } else if(_odPicker.mode === 'shared') {
    h += _odBcSep();
    if(_odPicker.itemStack.length === 0) {
      h += '<span style="color:#e2e8f0;font-size:12px;font-weight:600;">🤝 Shared with me</span>';
    } else {
      h += '<span onclick="_odPickerGoToShared(-1)" style="cursor:pointer;color:#60a5fa;font-size:12px;">🤝 Shared with me</span>';
      for(var j=0;j<_odPicker.itemStack.length;j++) {
        h += _odBcSep();
        if(j < _odPicker.itemStack.length-1)
          h += '<span onclick="_odPickerGoToShared('+j+')" style="cursor:pointer;color:#60a5fa;font-size:12px;">'+_escHtml(_odPicker.itemStack[j].name)+'</span>';
        else
          h += '<span style="color:#e2e8f0;font-size:12px;font-weight:600;">'+_escHtml(_odPicker.itemStack[j].name)+'</span>';
      }
    }
  }
  bcEl.innerHTML = h;
}

function _odBcSep() { return '<span style="color:#475569;margin:0 4px;font-size:12px;">›</span>'; }

function _odPickerLoad() {
  _odPickerBreadcrumb();
  if(_odPicker.mode === 'root') _odPickerLoadRoot();
  else if(_odPicker.mode === 'own') _odPickerLoadOwn();
  else _odPickerLoadShared();
}

function _odPickerLoadRoot() {
  var listEl = document.getElementById('od-file-list');
  if(!listEl) return;
  listEl.innerHTML =
    _odPickerRow('📁', 'My OneDrive', '#60a5fa', '_odPickerEnterOwn()', true) +
    _odPickerRow('🤝', 'Shared with me', '#a78bfa', '_odPickerEnterShared()', true);
}

function _odPickerRow(icon, label, color, onclick, arrow) {
  return '<div onclick="'+onclick+'" onmouseover="this.style.background=\'#253148\'" onmouseout="this.style.background=\'transparent\'"'+
    ' style="display:flex;align-items:center;gap:12px;padding:12px 18px;border-bottom:1px solid #1a2740;cursor:pointer;transition:background 0.1s;">'+
    '<span style="font-size:18px;flex-shrink:0;">'+icon+'</span>'+
    '<span style="font-size:13px;color:'+color+';flex:1;">'+_escHtml(label)+'</span>'+
    (arrow?'<span style="color:#475569;font-size:13px;">›</span>':'')+
    '</div>';
}

function _odPickerEnterOwn() {
  _odPicker.mode = 'own';
  _odPicker.path = '';
  _odPicker.pathParts = [];
  _odPickerLoad();
}

function _odPickerEnterShared() {
  _odPicker.mode = 'shared';
  _odPicker.driveId = null;
  _odPicker.itemId = null;
  _odPicker.itemStack = [];
  _odPickerLoad();
}

function _odPickerGoRoot() {
  _odPicker.mode = 'root';
  _odPickerLoad();
}

function _odPickerLoadOwn() {
  var listEl = document.getElementById('od-file-list');
  if(!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;font-size:13px;">⏳ Loading...</div>';

  var url = _odPicker.path
    ? 'https://graph.microsoft.com/v1.0/me/drive/root:/' + encodeURIComponent(_odPicker.path).replace(/%2F/g,'/') + ':/children?$select=name,id,folder,file&$orderby=name'
    : 'https://graph.microsoft.com/v1.0/me/drive/root/children?$select=name,id,folder,file&$orderby=name';

  fetch(url, {headers:{'Authorization':'Bearer '+_msToken}})
    .then(function(r){return r.json();})
    .then(function(data){ _odPickerRenderItems(data, 'own'); })
    .catch(function(){ _odPickerError(); });
}

function _odPickerLoadShared() {
  var listEl = document.getElementById('od-file-list');
  if(!listEl) return;
  listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;font-size:13px;">⏳ Loading...</div>';

  var url;
  if(!_odPicker.driveId || !_odPicker.itemId) {
    url = 'https://graph.microsoft.com/v1.0/me/drive/sharedWithMe?$select=name,id,folder,file,remoteItem,parentReference';
  } else {
    url = 'https://graph.microsoft.com/v1.0/drives/'+_odPicker.driveId+'/items/'+_odPicker.itemId+'/children?$select=name,id,folder,file,remoteItem,parentReference&$orderby=name';
  }

  fetch(url, {headers:{'Authorization':'Bearer '+_msToken}})
    .then(function(r){return r.json();})
    .then(function(data){ _odPickerRenderItems(data, 'shared'); })
    .catch(function(){ _odPickerError(); });
}

function _odPickerRenderItems(data, mode) {
  var listEl = document.getElementById('od-file-list');
  if(!listEl) return;
  if(!data.value || data.value.length === 0) {
    listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#64748b;font-size:13px;">📂 Empty folder</div>';
    return;
  }
  var items = data.value.slice().sort(function(a,b){
    var af=!!(a.folder||(a.remoteItem&&a.remoteItem.folder));
    var bf=!!(b.folder||(b.remoteItem&&b.remoteItem.folder));
    if(af!==bf) return af?-1:1;
    return a.name.localeCompare(b.name);
  });
  var h = '';
  for(var j=0;j<items.length;j++) {
    var it = items[j];
    var isF = !!(it.folder || (it.remoteItem && it.remoteItem.folder));
    var nm = _escHtml(it.name);
    var onclick = '';
    if(isF) {
      if(mode === 'own') {
        var nmRaw = it.name.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
        onclick = 'onclick="_odPickerNav(\''+nmRaw+'\')"';
      } else {
        var ri = it.remoteItem || it;
        var dId = (ri.parentReference && ri.parentReference.driveId) || _odPicker.driveId || '';
        var iId = ri.id || it.id || '';
        var key = 'k'+j;
        _odSharedItems[key] = {driveId: dId, itemId: iId, name: it.name};
        onclick = 'onclick="_odPickerNavShared(\''+key+'\')"';
      }
    }
    h += '<div '+onclick+
      ' onmouseover="this.style.background=\'#253148\'" onmouseout="this.style.background=\'transparent\'"'+
      ' style="display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid #1a2740;cursor:'+(isF?'pointer':'default')+';transition:background 0.1s;">'+
      '<span style="font-size:18px;flex-shrink:0;">'+(isF?'📁':'📄')+'</span>'+
      '<span style="font-size:13px;color:'+(isF?'#60a5fa':'#94a3b8')+';flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+nm+'</span>'+
      (isF?'<span style="color:#475569;font-size:13px;">›</span>':'')+
      '</div>';
  }
  listEl.innerHTML = h;
}

function _odPickerError() {
  var listEl = document.getElementById('od-file-list');
  if(listEl) listEl.innerHTML = '<div style="text-align:center;padding:40px;color:#f87171;font-size:13px;">❌ Failed to load folder</div>';
}

function _odPickerNav(name) {
  _odPicker.pathParts.push(name);
  _odPicker.path = _odPicker.pathParts.join('/');
  _odPickerLoad();
}

function _odPickerGoTo(level) {
  if(level < 0) { _odPicker.pathParts = []; _odPicker.path = ''; }
  else { _odPicker.pathParts = _odPicker.pathParts.slice(0, level+1); _odPicker.path = _odPicker.pathParts.join('/'); }
  _odPickerLoad();
}

function _odPickerNavShared(key) {
  var info = _odSharedItems[key];
  if(!info) return;
  _odPicker.itemStack.push({name: info.name, driveId: info.driveId, itemId: info.itemId});
  _odPicker.driveId = info.driveId;
  _odPicker.itemId = info.itemId;
  _odSharedItems = {};
  _odPickerLoad();
}

function _odPickerGoToShared(level) {
  if(level < 0) {
    _odPicker.itemStack = [];
    _odPicker.driveId = null;
    _odPicker.itemId = null;
  } else {
    _odPicker.itemStack = _odPicker.itemStack.slice(0, level+1);
    var top = _odPicker.itemStack[_odPicker.itemStack.length-1];
    _odPicker.driveId = top.driveId;
    _odPicker.itemId = top.itemId;
  }
  _odSharedItems = {};
  _odPickerLoad();
}

function _odPickerUpload() {
  if(_odPicker.mode === 'shared' && _odPicker.itemStack.length === 0) {
    alert('⚠️ Please navigate into a shared folder first, then click Upload Here.');
    return;
  }
  if(_odPicker.type === 'vtivte') confirmarUploadOneDriveVTIVTE(_odPicker.idx);
  else confirmarUploadOneDrive(_odPicker.idx);
}

function _escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ===== ABRIR SELETOR DE PASTA ONEDRIVE =====
function abrirSeletorOneDrive(idx) {
  if(idx < 0 || !FINS[idx]) { alert('Record not found.'); return; }
  _odPickerOpen(idx, 'fi');
}

// ===== CONFIRMAR UPLOAD PARA ONEDRIVE =====
function confirmarUploadOneDrive(idx) {
  if(idx < 0 || !FINS[idx]) {
    alert('Record not found.');
    return;
  }

  var isShared = (_odPicker.mode === 'shared');
  var _driveId = _odPicker.driveId, _itemId = _odPicker.itemId;
  var folder   = _odPicker.path || 'TB_Aviation_Checklists';

  var reg = FINS[idx];
  currentFinIdx = idx;

  _odUploadPending = {driveId:_driveId, itemId:_itemId, folder:folder, isShared:isShared};
  // Safety: clear flag after 10s in case PDF generation fails silently
  setTimeout(function(){_odUploadPending=null;}, 10000);

  _odPickerClose();

  try {
    if(reg.type === 'mandatory') exportMandatoryPDF();
    else                         exportPDFPreview();
  } catch(e) {
    _odUploadPending=null;
    console.error('Error generating PDF for OneDrive:', e);
    alert('❌ Error generating PDF:\n' + (e.message || e));
  }
}

// ===== DARK MODE =====
function _applyDarkMode(on){
  var el=document.getElementById('pg-main');
  if(!el) el=document.body;
  if(on) el.classList.add('dark-mode'); else el.classList.remove('dark-mode');
  var btn=document.getElementById('btn-dark-mode');
  if(btn) btn.textContent=on?'☀️':'🌙';
}
function toggleDarkMode(){
  var el=document.getElementById('pg-main')||document.body;
  var on=!el.classList.contains('dark-mode');
  _applyDarkMode(on);
  localStorage.setItem('tb_dark', on?'1':'0');
}
(function(){
  if(localStorage.getItem('tb_dark')==='1'){
    document.addEventListener('DOMContentLoaded',function(){ _applyDarkMode(true); });
    if(document.readyState!=='loading') _applyDarkMode(true);
  }
})();

// ===== ADMIN PANEL =====

function admTab(name){
  ['log','cl','tpl','photos','stats','export','feedback','users','history','design','changes'].forEach(function(t){
    var pg=document.getElementById('adm-pg-'+t);
    if(pg)pg.style.display=name===t?'block':'none';
    var btn=document.getElementById('adm-tab-'+t);
    if(btn){btn.style.background=name===t?'#1a2a4a':'#e8edf4';btn.style.color=name===t?'white':'#1a2a4a';}
  });
  // Scroll the active tab into view on mobile
  var activeBtn=document.getElementById('adm-tab-'+name);
  if(activeBtn)activeBtn.scrollIntoView({behavior:'smooth',block:'nearest',inline:'center'});
  // Hide the right-fade hint when the active tab is one of the last
  var tabFade=document.getElementById('adm-tab-fade');
  var tabBar=document.getElementById('adm-tab-bar');
  if(tabFade&&tabBar){
    tabBar.addEventListener('scroll',function(){
      var atEnd=tabBar.scrollLeft+tabBar.clientWidth>=tabBar.scrollWidth-4;
      tabFade.style.display=atEnd?'none':'block';
    },{once:false,passive:true});
  }
  if(name==='log')renderAdmLog();
  if(name==='cl')renderAdmChecklists();
  if(name==='tpl')renderAdmTemplates();
  if(name==='photos')renderAdmPhotos();
  if(name==='stats')renderAdmDashboard();
  if(name==='export')renderAdmExport();
  if(name==='feedback')renderAdmFeedback();
  if(name==='users')renderAdmUsers();
  if(name==='docs')renderAdmDocs();
  if(name==='history')renderAdmHistory();
  if(name==='design')renderAdmDesign();
  if(name==='changes')renderAdmChanges();
}

function _renderActLogHtml(el){
  var actionLabels={
    login:'Login',
    add_flight:'Added Flight',fin_flight:'✅ Finalized Flight',
    add_vtivte:'Added VTI/VTE',fin_vtivte:'✅ Finalized VTI/VTE',
    add_mand:'Added Mandatory',fin_mand:'✅ Finalized Mandatory'
  };
  var actionColors={
    login:'#4A90D9',
    add_flight:'#43a047',fin_flight:'#2e7d32',
    add_vtivte:'#7b1fa2',fin_vtivte:'#4a148c',
    add_mand:'#e65100',fin_mand:'#bf360c'
  };
  var avatarColors=['#1565c0','#2e7d32','#6a1b9a','#c62828','#00838f','#e65100','#4527a0','#283593'];

  // ── Build per-user summary cards ─────────────────────────────
  var userSummary={};
  ACTLOG.forEach(function(l){
    if(!userSummary[l.u]){
      userSummary[l.u]={u:l.u,nome:l.nome,lastLogin:null,lastAction:null};
    }
    var s=userSummary[l.u];
    if(l.action==='login'){if(!s.lastLogin||l.ts>s.lastLogin.ts)s.lastLogin=l;}
    else{if(!s.lastAction||l.ts>s.lastAction.ts)s.lastAction=l;}
  });
  var userList=Object.keys(userSummary).map(function(u){return userSummary[u];})
    .sort(function(a,b){
      var ta=(a.lastLogin||a.lastAction||{ts:0}).ts;
      var tb=(b.lastLogin||b.lastAction||{ts:0}).ts;
      return tb-ta;
    });

  var fuEl=document.getElementById('adm-log-filter-user');
  var faEl=document.getElementById('adm-log-filter-action');
  var fu=fuEl?fuEl.value:'';
  var fa=faEl?faEl.value:'';
  var usersMap={};
  ACTLOG.forEach(function(l){if(!usersMap[l.u])usersMap[l.u]=l.nome;});

  // ── User cards grid ──────────────────────────────────────────
  var h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:20px;">';
  userList.forEach(function(s,ci){
    var initials=(s.nome||s.u).split(' ').map(function(w){return w[0];}).slice(0,2).join('').toUpperCase();
    var aClr=avatarColors[ci%avatarColors.length];
    var loginTs=s.lastLogin?new Date(s.lastLogin.ts):null;
    var loginStr=loginTs?(loginTs.toLocaleDateString('pt-BR')+' '+loginTs.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})):'—';
    var lastAct=s.lastAction;
    var actLabel=lastAct?(actionLabels[lastAct.action]||lastAct.action):'No checklist yet';
    var actDetail=lastAct?(lastAct.detail||''):'';
    var actClr=lastAct?(actionColors[lastAct.action]||'#555'):'#bbb';
    var actTs=lastAct?new Date(lastAct.ts):null;
    var actStr=actTs?(actTs.toLocaleDateString('pt-BR')+' '+actTs.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})):'';
    h+='<div style="background:white;border-radius:14px;padding:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1.5px solid #e8edf4;display:flex;flex-direction:column;gap:10px;">';
    // Avatar + name
    h+='<div style="display:flex;align-items:center;gap:10px;">';
    h+='<div style="width:42px;height:42px;border-radius:50%;background:'+aClr+';display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;color:white;flex-shrink:0;">'+initials+'</div>';
    h+='<div><div style="font-size:14px;font-weight:800;color:#1a2a4a;">'+_h(s.nome||s.u)+'</div>';
    h+='<div style="font-size:11px;color:#aaa;">@'+_h(s.u)+'</div></div>';
    h+='</div>';
    // Last login
    h+='<div style="background:#f0f6fc;border-radius:8px;padding:8px 10px;">';
    h+='<div style="font-size:10px;font-weight:700;color:#4A90D9;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;">🕐 Last Access</div>';
    h+='<div style="font-size:12px;color:#1a2a4a;font-weight:600;">'+_h(loginStr)+'</div>';
    h+='</div>';
    // Last checklist
    h+='<div style="background:'+(lastAct?actClr+'12':'#f5f5f5')+';border-radius:8px;padding:8px 10px;border-left:3px solid '+(lastAct?actClr:'#ddd')+'">';
    h+='<div style="font-size:10px;font-weight:700;color:'+actClr+';text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;">📋 Last Checklist</div>';
    h+='<div style="font-size:12px;color:#1a2a4a;font-weight:600;">'+_h(actLabel)+'</div>';
    if(actDetail)h+='<div style="font-size:11px;color:#555;margin-top:1px;">'+_h(actDetail)+'</div>';
    if(actStr)h+='<div style="font-size:10px;color:#aaa;margin-top:3px;">'+actStr+'</div>';
    h+='</div>';
    h+='</div>';
  });
  h+='</div>';

  // ── Filters + detailed log below ─────────────────────────────
  h+='<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap;align-items:center;border-top:1.5px solid #e8edf4;padding-top:14px;">';
  h+='<select id="adm-log-filter-user" onchange="renderAdmLog()" style="padding:8px 12px;border:1.5px solid #dde3ed;border-radius:8px;font-size:13px;">';
  h+='<option value="">All Users</option>';
  Object.keys(usersMap).forEach(function(u){h+='<option value="'+u+'"'+(fu===u?' selected':'')+'>'+usersMap[u]+'</option>';});
  h+='</select>';
  h+='<select id="adm-log-filter-action" onchange="renderAdmLog()" style="padding:8px 12px;border:1.5px solid #dde3ed;border-radius:8px;font-size:13px;">';
  h+='<option value="">All Actions</option>';
  Object.keys(actionLabels).forEach(function(k){h+='<option value="'+k+'"'+(fa===k?' selected':'')+'>'+actionLabels[k]+'</option>';});
  h+='</select>';

  var logs=ACTLOG.filter(function(l){
    if(fu&&l.u!==fu)return false;
    if(fa&&l.action!==fa)return false;
    return true;
  });
  h+='<span style="margin-left:auto;font-size:12px;color:#888;">'+logs.length+' record'+(logs.length!==1?'s':'')+'</span>';
  h+='<button onclick="if(confirm(\'Clear all activity log?\'))clearActLog()" style="padding:7px 12px;background:#f44336;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">🗑 Clear</button>';
  h+='</div>';

  // Bulk-select toolbar (dev only)
  if(ME&&ME.role==='dev'&&logs.length){
    h+='<div id="actlog-bulk-bar" style="display:none;align-items:center;gap:10px;padding:8px 12px;background:#fff3e0;border-radius:8px;border:1.5px solid #ffb74d;margin-bottom:10px;">';
    h+='<span id="actlog-bulk-count" style="font-size:13px;font-weight:700;color:#e65100;">0 selected</span>';
    h+='<button onclick="actLogSelectAll()" style="padding:5px 12px;background:#e65100;color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Select All</button>';
    h+='<button onclick="actLogDeselectAll()" style="padding:5px 12px;background:#fff;color:#e65100;border:1.5px solid #e65100;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Deselect All</button>';
    h+='<button onclick="actLogDeleteSelected()" style="padding:5px 12px;background:#f44336;color:white;border:none;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;margin-left:auto;">🗑 Delete Selected</button>';
    h+='</div>';
  }

  if(!logs.length){
    h+='<div style="text-align:center;padding:40px;color:#999;font-size:14px;">No activity recorded yet.</div>';
  } else {
    h+='<div style="display:flex;flex-direction:column;gap:5px;">';
    logs.forEach(function(l){
      var d=new Date(l.ts);
      var ds=d.toLocaleDateString('en-US',{day:'2-digit',month:'short',year:'numeric'})+' '+d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'});
      var color=actionColors[l.action]||'#555';
      var label=actionLabels[l.action]||l.action;
      h+='<div style="display:flex;align-items:center;gap:10px;padding:10px 14px;background:white;border-radius:8px;border:1px solid #e8edf4;">';
      if(ME&&ME.role==='dev') h+='<input type="checkbox" data-ts="'+l.ts+'" onchange="actLogCheckChange()" style="width:16px;height:16px;cursor:pointer;flex-shrink:0;">';
      h+='<div style="width:9px;height:9px;border-radius:50%;background:'+color+';flex-shrink:0;"></div>';
      h+='<div style="flex:1;min-width:0;">';
      h+='<span style="font-weight:700;font-size:13px;color:#1a2a4a;">'+_h(l.nome)+'</span>';
      h+=' <span style="font-size:12px;color:#666;">— '+_h(label)+(l.detail?' &nbsp;<b style="color:#1a2a4a;">'+_h(l.detail)+'</b>':'')+'</span>';
      h+='</div>';
      h+='<div style="font-size:11px;color:#aaa;white-space:nowrap;">'+ds+'</div>';
      if(ME&&ME.role==='dev') h+='<button onclick="deleteActLogEntry('+l.ts+')" title="Delete entry" style="background:none;border:none;cursor:pointer;color:#f44336;font-size:14px;padding:2px 6px;border-radius:4px;flex-shrink:0;">🗑</button>';
      h+='</div>';
    });
    h+='</div>';
  }
  el.innerHTML=h;
}

function renderAdmLog(){
  var el=document.getElementById('adm-log-content');
  if(!el)return;

  el.innerHTML='<div style="text-align:center;padding:40px;color:#aaa;">⏳ Loading activity log from cloud...</div>';

  if(typeof _UPSTASH_URL==='undefined'){_renderActLogHtml(el);return;}

  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['LRANGE','tb7_actlog_v1','0','499']])
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var items=res[0]&&Array.isArray(res[0].result)?res[0].result:[];
    var cloudLog=[];
    items.forEach(function(s){try{cloudLog.push(JSON.parse(s));}catch(e){}});
    // Deduplicate cloud log itself (migration reruns can cause duplicates)
    var seen={};
    cloudLog=cloudLog.filter(function(e){
      var k=(e.ts||0)+'_'+(e.u||'')+'_'+(e.action||'');
      if(seen[k])return false;seen[k]=true;return true;
    });
    // Merge with local, deduplicate by same key
    ACTLOG.forEach(function(l){
      var k=(l.ts||0)+'_'+(l.u||'')+'_'+(l.action||'');
      if(!seen[k]){seen[k]=true;cloudLog.push(l);}
    });
    cloudLog.sort(function(a,b){return b.ts-a.ts;});
    ACTLOG=cloudLog.slice(0,500);
    _saveActLog();
    _renderActLogHtml(el);
  })
  .catch(function(){_renderActLogHtml(el);});
}

function renderAdmChecklists(){
  var el=document.getElementById('adm-cl-content');
  if(!el)return;
  if(!_admAllData)el.innerHTML='<div style="text-align:center;padding:40px;color:#aaa;">⏳ Loading all users\' data from cloud...</div>';
  _loadAllUsersDataFromCloud(function(data){
  if(!data||!el){return;}
  var vtArr=data.vtivte;

  var allAvs=data.avs;
  var allMand=data.mand;
  var allFins=data.fins;

  // Index maps for local records (edit/delete only available for own records)
  function localFlIdx(av){return AVS.indexOf(av);}
  function localVtIdx(av){return (typeof AVSVTIVTE!=='undefined')?AVSVTIVTE.indexOf(av):-1;}
  function localMdIdx(av){return MAND.indexOf(av);}

  function mkRow(type,localIdx,av,badge){
    var isOwn=localIdx>=0;
    var r='<div style="background:white;border:1px solid '+(isOwn?'#c8dff7':'#e0e7ef')+';border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
    r+='<div style="flex:1;min-width:0;">';
    r+='<div style="font-weight:700;font-size:14px;color:#1a2a4a;">'+av.mat+(badge?' <span style="font-size:11px;background:#7b1fa2;color:white;padding:2px 7px;border-radius:10px;">'+badge+'</span>':'')+'</div>';
    r+='<div style="font-size:12px;color:#555;">'+av.mod+(av.serie?' &nbsp;·&nbsp; SN: '+av.serie:'')+'</div>';
    r+='<div style="font-size:12px;color:#888;">Resp: '+av.resp+(av.dc?' &nbsp;·&nbsp; Added: '+av.dc:'')+'</div>';
    r+='</div>';
    if(isOwn){
      r+='<div style="display:flex;gap:6px;">';
      if(type==='mand') r+='<button onclick="exportMandatoryPDF(MAND['+localIdx+'])" style="padding:7px 12px;background:#4A90D9;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📄 PDF</button>';
      r+='<button onclick="openEditAircraft(\''+type+'\','+localIdx+')" style="padding:7px 12px;background:#4A90D9;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">✏️ Edit</button>';
      r+='<button onclick="admDeleteAircraft(\''+type+'\','+localIdx+')" style="padding:7px 12px;background:#f44336;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">🗑</button>';
      r+='</div>';
    } else if(type==='mand'){
      r+='<div style="display:flex;gap:6px;">';
      r+='<button onclick="admViewActiveMandPDF(\''+_h(av.mat)+'\',\''+_h(av._owner||'')+'\')" style="padding:7px 12px;background:#4A90D9;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📄 PDF</button>';
      r+='</div>';
    }
    r+='</div>';
    return r;
  }

  function section(title,count,content){
    var s='<div style="margin-bottom:24px;">';
    s+='<div style="font-size:15px;font-weight:700;color:#1a2a4a;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #e0e7ef;">'+title+' <span style="font-size:12px;background:#e8edf4;color:#555;padding:2px 8px;border-radius:10px;">'+count+'</span></div>';
    s+=count?content:'<div style="color:#bbb;font-size:13px;padding:10px 0;">No active records.</div>';
    s+='</div>';
    return s;
  }

  var flHtml=allAvs.map(function(av){return mkRow('flight',localFlIdx(av),av,'');}).join('');
  var vtHtml=vtArr.map(function(av){return mkRow('vtivte',localVtIdx(av),av,av.type);}).join('');
  var mdHtml=allMand.map(function(av){return mkRow('mand',localMdIdx(av),av,'');}).join('');

  // Completed flight inspections — explicitly exclude records with mand data (old mandatory records without type field)
  var finFlight=allFins.filter(function(r){return r.type==='flight'||((!r.type)&&(!r.mand));});
  // Completed VTI/VTE inspections
  var finVt=data.finsvtivte||[];
  // Completed mandatory documents
  var finMand=allFins.filter(function(r){return r.type==='mandatory';});

  function resLabel(res){
    if(res==='ok')return{lbl:'✓ All Acceptable',color:'#43a047'};
    if(res==='warn')return{lbl:'⚠ With Restrictions',color:'#ff9800'};
    if(res==='danger')return{lbl:'✕ Not Acceptable',color:'#f44336'};
    return{lbl:'— Incomplete',color:'#90a4ae'};
  }

  var finFlightHtml=finFlight.map(function(r){
    var rl=resLabel(r.res);
    var owner=r._owner||'';
    var border=r.res==='danger'?'#ffcdd2':r.res==='warn'?'#ffe082':'#e0e7ef';
    var row='<div style="background:white;border:1px solid '+border+';border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
    row+='<div style="flex:1;min-width:0;">';
    row+='<div style="font-weight:700;font-size:14px;color:#1a2a4a;">'+r.mat+' <span style="font-size:11px;background:'+rl.color+';color:white;padding:2px 7px;border-radius:10px;">'+rl.lbl+'</span></div>';
    row+='<div style="font-size:12px;color:#555;">'+r.mod+(r.serie?' &nbsp;·&nbsp; SN: '+r.serie:'')+'</div>';
    row+='<div style="font-size:12px;color:#888;">Resp: '+r.resp+' &nbsp;·&nbsp; Finalized: '+r.df+(owner?' &nbsp;·&nbsp; User: '+owner:'')+'</div>';
    row+='</div>';
    row+='<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:1;justify-content:flex-end;">';
    var _fFotos=[];r.cl&&r.cl.forEach(function(sec){(sec.items||[]).forEach(function(it){(it.fotos||[]).forEach(function(f){_fFotos.push(f);});});});
    if(_fFotos.length) row+='<button onclick="admShowRecordPhotos('+r.id+',\'flight\')" style="padding:7px 14px;background:#0277bd;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📷 '+_fFotos.length+'</button>';
    if(r.id) row+='<button onclick="admViewFlightPDF('+r.id+')" style="padding:7px 14px;background:#4A90D9;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📄 PDF</button>';
    if(r.id) row+='<button onclick="admOpenEditFinFlight('+r.id+',\''+_h(owner)+'\')" style="padding:7px 14px;background:#43a047;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">✏️ Edit</button>';
    if(r.id) row+='<button onclick="admDeleteFinFlight('+r.id+',\''+_h(owner)+'\')" style="padding:7px 12px;background:#f44336;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">🗑</button>';
    row+='</div>';
    row+='</div>';
    return row;
  }).join('');

  var finVtHtml=finVt.map(function(r){
    var rl=resLabel(r.res);
    var owner=r._owner||'';
    var typeBadge=r.type?(' <span style="font-size:11px;background:#7b1fa2;color:white;padding:2px 7px;border-radius:10px;">'+r.type+'</span>'):'';
    var border=r.res==='danger'?'#ffcdd2':r.res==='warn'?'#ffe082':'#e0e7ef';
    var row='<div style="background:white;border:1px solid '+border+';border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
    row+='<div style="flex:1;min-width:0;">';
    row+='<div style="font-weight:700;font-size:14px;color:#1a2a4a;">'+r.mat+typeBadge+' <span style="font-size:11px;background:'+rl.color+';color:white;padding:2px 7px;border-radius:10px;">'+rl.lbl+'</span></div>';
    row+='<div style="font-size:12px;color:#555;">'+r.mod+(r.serie?' &nbsp;·&nbsp; SN: '+r.serie:'')+'</div>';
    row+='<div style="font-size:12px;color:#888;">Resp: '+r.resp+' &nbsp;·&nbsp; Finalized: '+r.df+(owner?' &nbsp;·&nbsp; User: '+owner:'')+'</div>';
    row+='</div>';
    row+='<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:1;justify-content:flex-end;">';
    var _vFotos=[];r.cl&&r.cl.forEach(function(sec){(sec.items||[]).forEach(function(it){(it.fotos||[]).forEach(function(f){_vFotos.push(f);});});});
    if(_vFotos.length) row+='<button onclick="admShowRecordPhotos('+r.id+',\'vtivte\')" style="padding:7px 14px;background:#0277bd;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📷 '+_vFotos.length+'</button>';
    if(r.id) row+='<button onclick="admViewVTIVTEPDF('+r.id+')" style="padding:7px 14px;background:#7b1fa2;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📄 PDF</button>';
    if(r.id) row+='<button onclick="admOpenEditFinVTIVTE('+r.id+',\''+_h(owner)+'\')" style="padding:7px 14px;background:#43a047;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">✏️ Edit</button>';
    if(r.id) row+='<button onclick="admDeleteFinVTIVTE('+r.id+',\''+_h(owner)+'\')" style="padding:7px 12px;background:#f44336;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">🗑</button>';
    row+='</div>';
    row+='</div>';
    return row;
  }).join('');

  var finMandHtml=finMand.map(function(r){
    var owner=r._owner||'';
    var row='<div style="background:white;border:1px solid #e0e7ef;border-radius:10px;padding:12px 14px;margin-bottom:8px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
    row+='<div style="flex:1;min-width:0;">';
    row+='<div style="font-weight:700;font-size:14px;color:#1a2a4a;">'+r.mat+' <span style="font-size:11px;background:#e65100;color:white;padding:2px 7px;border-radius:10px;">📄 Mandatory</span></div>';
    row+='<div style="font-size:12px;color:#555;">'+r.mod+(r.serie?' &nbsp;·&nbsp; SN: '+r.serie:'')+'</div>';
    row+='<div style="font-size:12px;color:#888;">Resp: '+r.resp+' &nbsp;·&nbsp; Finalized: '+r.df+(owner?' &nbsp;·&nbsp; User: '+owner:'')+'</div>';
    row+='</div>';
    row+='<div style="display:flex;gap:6px;flex-wrap:wrap;flex-shrink:1;justify-content:flex-end;">';
    var _mFotos=[];(r.mand||r.cl||[]).forEach(function(sec){(sec.items||[]).forEach(function(it){(it.fotos||[]).forEach(function(f){_mFotos.push(f);});});});
    if(_mFotos.length) row+='<button onclick="admShowRecordPhotos('+r.id+',\'mandatory\')" style="padding:7px 14px;background:#0277bd;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📷 '+_mFotos.length+'</button>';
    row+='<button onclick="admViewMandPDF('+r.id+',\''+_h(owner)+'\')" style="padding:7px 14px;background:#4A90D9;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📄 PDF</button>';
    if(r.id&&owner){
      row+='<button onclick="admOpenEditFinMand('+r.id+',\''+owner+'\')" style="padding:7px 14px;background:#43a047;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">✏️ Edit</button>';
    }
    if(r.id){
      row+='<button onclick="admDeleteFinMand('+r.id+',\''+_h(owner)+'\')" style="padding:7px 12px;background:#f44336;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">🗑</button>';
    }
    row+='</div>';
    row+='</div>';
    return row;
  }).join('');

  var allUsernames=getAllUsers().map(function(u){return u.u;});
  var repairBtns=allUsernames.map(function(u){return '<button onclick="admRepairCloudData(\''+u+'\')" style="padding:3px 8px;background:#fff;color:#1565c0;border:1px solid #90caf9;border-radius:4px;cursor:pointer;font-size:10px;margin:2px;">'+u+'</button>';}).join('');
  var noteBox='<div style="background:#e3f2fd;border:1px solid #90caf9;border-radius:8px;padding:10px 14px;margin-bottom:20px;font-size:12px;color:#1565c0;">'+
    '👥 All users\' records. <button onclick="_admAllData=null;renderAdmChecklists()" style="margin-left:4px;padding:3px 10px;background:#1565c0;color:white;border:none;border-radius:5px;cursor:pointer;font-size:11px;">🔄 Refresh</button>'+
    '<div style="margin-top:8px;color:#b71c1c;">🔧 Recuperar dados de usuário: '+repairBtns+'</div>'+
    '</div>';

  el.innerHTML=noteBox+
    section('✈️ Active Flight Inspections',allAvs.length,flHtml)+
    section('🔬 Active VTI/VTE',vtArr.length,vtHtml)+
    section('📄 Active Mandatory Documents',allMand.length,mdHtml)+
    (finFlight.length?section('✅ Completed Flight Inspections',finFlight.length,finFlightHtml):'')+
    (finVt.length?section('✅ Completed VTI/VTE Inspections',finVt.length,finVtHtml):'')+
    (finMand.length?section('✅ Completed Mandatory Documents',finMand.length,finMandHtml):'');
  }); // end _loadAllUsersDataFromCloud callback
}

// ===== ADMIN PHOTOS MODAL =====
function admShowRecordPhotos(recId, recType){
  var rec=null;
  if(recType==='vtivte'){
    rec=_admAllData&&_admAllData.finsvtivte?_admAllData.finsvtivte.find(function(f){return f.id===recId;}):null;
  } else {
    rec=_admAllData&&_admAllData.fins?_admAllData.fins.find(function(f){return f.id===recId;}):null;
  }
  if(!rec){_showToast('Record not found.','warn');return;}

  // Collect all photos with item name context
  var allPhotos=[];
  (rec.mand||rec.cl||[]).forEach(function(sec){
    (sec.items||[]).forEach(function(it){
      (it.fotos||[]).forEach(function(f){
        allPhotos.push({d:f.d,by:f.by||'',dt:f.dt||'',item:it.n||''});
      });
    });
  });

  if(!allPhotos.length){_showToast('No photos in this record.','warn');return;}

  var ex=document.getElementById('adm-photos-modal');
  if(ex)ex.remove();
  var overlay=document.createElement('div');
  overlay.id='adm-photos-modal';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};

  var title=rec.mat+(rec.mod?' — '+rec.mod:'')+(rec.df?' · '+rec.df:'');
  var grid=allPhotos.map(function(p,i){
    return '<div style="position:relative;border-radius:10px;overflow:hidden;background:#111;cursor:pointer;height:150px;display:flex;align-items:center;justify-content:center;" onclick="verImg(\''+p.d+'\')">'+
      '<img src="'+p.d+'" style="max-width:100%;max-height:150px;object-fit:contain;">'+
      '<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.75));padding:6px 8px;">'+
        '<div style="color:#fff;font-size:10px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+p.item+'">'+p.item+'</div>'+
        '<div style="color:rgba(255,255,255,0.75);font-size:9px;">'+p.by.substring(0,14)+(p.dt?' · '+p.dt.substring(0,10):'')+'</div>'+
      '</div>'+
    '</div>';
  }).join('');

  overlay.innerHTML='<div style="background:#1a1a2e;border-radius:16px;width:100%;max-width:680px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;">'+
    '<div style="padding:16px 20px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.1);">'+
      '<div><div style="color:white;font-weight:700;font-size:15px;">📷 Photos</div><div style="color:rgba(255,255,255,0.6);font-size:12px;">'+title+'</div></div>'+
      '<div style="display:flex;align-items:center;gap:10px;">'+
        '<span style="background:rgba(255,255,255,0.1);color:white;padding:3px 10px;border-radius:20px;font-size:12px;">'+allPhotos.length+' photo'+(allPhotos.length>1?'s':'')+'</span>'+
        '<button onclick="document.getElementById(\'adm-photos-modal\').remove()" style="background:rgba(255,255,255,0.15);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;">✕</button>'+
      '</div>'+
    '</div>'+
    '<div style="overflow-y:auto;padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">'+
      grid+
    '</div>'+
  '</div>';
  document.body.appendChild(overlay);
}

// ===== ADMIN EDIT FINALIZED MANDATORY MODAL =====
var _admEditRec=null; // {recId, ownerUser, mand, res}

function admViewMandPDF(recId, ownerUser){
  var rec=_admAllData&&_admAllData.fins?_admAllData.fins.find(function(f){return f.id===recId;}):null;
  if(!rec){_showToast('Record not found. Try refreshing.','warn');return;}
  exportMandatoryPDF(rec);
}

function admViewActiveMandPDF(mat, ownerUser){
  var rec=_admAllData&&_admAllData.mand?_admAllData.mand.find(function(m){return m.mat===mat&&(m._owner||'')===(ownerUser||'');}):null;
  if(!rec){_showToast('Record not found. Try refreshing.','warn');return;}
  exportMandatoryPDF(rec);
}

function admDeleteFinMand(recId, ownerUser){
  if(!confirm('Permanently delete this mandatory record? This cannot be undone.')) return;
  var myU=window.ME?window.ME.u:'';

  function _afterDelete(){
    // Remove from in-memory cache so UI updates instantly
    if(_admAllData&&_admAllData.fins){
      _admAllData.fins=_admAllData.fins.filter(function(f){return f.id!==recId;});
    }
    renderAdmChecklists();
    _showToast('✅ Record deleted','ok');
  }

  if(!ownerUser||ownerUser===myU){
    // Own record — delete locally and sync
    var di=FINS.findIndex(function(f){return f.id===recId;});
    if(di>=0){FINS.splice(di,1);svf();}
    _afterDelete();
    return;
  }

  // Another user's record — fetch their cloud data, remove just this record, save back
  _showToast('⏳ Deleting from cloud...','ok');
  var key='tb7_'+ownerUser;
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['GET',key]])
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var raw=res[0]&&res[0].result;
    if(!raw){_showToast('❌ User data not found in cloud','err');return Promise.reject('no data');}
    var data=JSON.parse(raw);
    var before=(data.fins||[]).length;
    data.fins=(data.fins||[]).filter(function(f){return f.id!==recId;});
    if(data.fins.length===before){_showToast('⚠️ Record not found in cloud','warn');return Promise.reject('not found');}
    return fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify([['SET',key,JSON.stringify(data)]])
    });
  })
  .then(function(){ _afterDelete(); })
  .catch(function(e){
    if(e==='no data'||e==='not found') return;
    console.error('admDeleteFinMand error:',e);
    _showToast('❌ Failed to delete record from cloud','err');
  });
}

function admViewFlightPDF(recId){
  var rec=_admAllData&&_admAllData.fins?_admAllData.fins.find(function(f){return f.id===recId&&f.type!=='mandatory';}):null;
  if(!rec){_showToast('Record not found. Try refreshing.','warn');return;}
  FINS.unshift(rec);
  var prev=currentFinIdx; currentFinIdx=0;
  try{exportPDFPreview();}finally{FINS.shift(); currentFinIdx=prev;}
}

function admViewVTIVTEPDF(recId){
  var rec=_admAllData&&_admAllData.finsvtivte?_admAllData.finsvtivte.find(function(f){return f.id===recId;}):null;
  if(!rec){_showToast('Record not found. Try refreshing.','warn');return;}
  FINSVTIVTE.unshift(rec);
  try{if(typeof exportPDFVTIVTE==='function') exportPDFVTIVTE(0);}finally{FINSVTIVTE.shift();}
}

function admDeleteFinFlight(recId, ownerUser){
  if(!confirm('Permanently delete this flight record? This cannot be undone.')) return;

  var myU=window.ME?window.ME.u:'';

  function _afterDelete(){
    if(_admAllData&&_admAllData.fins){
      _admAllData.fins=_admAllData.fins.filter(function(f){return f.id!==recId;});
    }
    renderAdmChecklists();
    _showToast('✅ Record deleted','ok');
  }

  if(!ownerUser||ownerUser===myU){
    var di=FINS.findIndex(function(f){return f.id===recId;});
    if(di>=0){FINS.splice(di,1);svf();}
    _afterDelete();
    return;
  }

  _showToast('⏳ Deleting from cloud...','ok');
  var key='tb7_'+ownerUser;
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['GET',key]])
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var raw=res[0]&&res[0].result;
    if(!raw){_showToast('❌ User data not found in cloud','err');return Promise.reject('no data');}
    var data=JSON.parse(raw);
    var before=(data.fins||[]).length;
    data.fins=(data.fins||[]).filter(function(f){return f.id!==recId;});
    if(data.fins.length===before){_showToast('⚠️ Record not found in cloud','warn');return Promise.reject('not found');}
    return fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify([['SET',key,JSON.stringify(data)]])
    });
  })
  .then(function(){ _afterDelete(); })
  .catch(function(e){
    if(e==='no data'||e==='not found') return;
    console.error('admDeleteFinFlight error:',e);
    _showToast('❌ Failed to delete record from cloud','err');
  });
}

function admDeleteFinVTIVTE(recId, ownerUser){
  if(!confirm('Permanently delete this VTI/VTE record? This cannot be undone.')) return;
  var myU=window.ME?window.ME.u:'';

  function _afterDelete(){
    if(_admAllData&&_admAllData.finsvtivte){
      _admAllData.finsvtivte=_admAllData.finsvtivte.filter(function(f){return f.id!==recId;});
    }
    renderAdmChecklists();
    _showToast('✅ Record deleted','ok');
  }

  if(!ownerUser||ownerUser===myU){
    if(typeof FINSVTIVTE!=='undefined'){
      var di=FINSVTIVTE.findIndex(function(f){return f.id===recId;});
      if(di>=0){FINSVTIVTE.splice(di,1);if(typeof svfVTIVTE==='function') svfVTIVTE();}
    }
    _afterDelete();
    return;
  }

  _showToast('⏳ Deleting from cloud...','ok');
  var key='tb7_'+ownerUser;
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['GET',key]])
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var raw=res[0]&&res[0].result;
    if(!raw){_showToast('❌ User data not found in cloud','err');return Promise.reject('no data');}
    var data=JSON.parse(raw);
    var before=(data.vtivte_fins||[]).length;
    data.vtivte_fins=(data.vtivte_fins||[]).filter(function(f){return f.id!==recId;});
    if(data.vtivte_fins.length===before){_showToast('⚠️ Record not found in cloud','warn');return Promise.reject('not found');}
    return fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify([['SET',key,JSON.stringify(data)]])
    });
  })
  .then(function(){ _afterDelete(); })
  .catch(function(e){
    if(e==='no data'||e==='not found') return;
    console.error('admDeleteFinVTIVTE error:',e);
    _showToast('❌ Failed to delete record from cloud','err');
  });
}

function admOpenEditFinMand(recId, ownerUser){
  // Find record in cache
  var rec=_admAllData&&_admAllData.fins?_admAllData.fins.find(function(f){return f.id===recId;}):null;
  if(!rec){_showToast('Record not found. Try refreshing.','warn');return;}
  _admEditRec={recId:recId,ownerUser:ownerUser,mand:JSON.parse(JSON.stringify(rec.mand||[])),res:rec.res||'warn',mat:rec.mat,mod:rec.mod};
  _renderAdmEditModal();
}

function _renderAdmEditModal(){
  var ex=document.getElementById('adm-edit-fin-modal');
  if(ex)ex.remove();
  var rec=_admEditRec;
  var overlay=document.createElement('div');
  overlay.id='adm-edit-fin-modal';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:16px;box-sizing:border-box;overflow-y:auto;';

  var html='<div style="background:white;border-radius:14px;width:100%;max-width:700px;margin:auto;overflow:hidden;">';
  // Header
  html+='<div style="background:#1a2a4a;color:white;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">';
  html+='<div><div style="font-weight:700;font-size:16px;">✏️ Edit Mandatory — '+_h(rec.mat)+'</div><div style="font-size:12px;opacity:0.8;">'+_h(rec.mod)+'</div></div>';
  html+='<button onclick="document.getElementById(\'adm-edit-fin-modal\').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;">✕</button>';
  html+='</div>';

  // Status selector
  html+='<div style="padding:14px 20px;background:#f5f7fa;border-bottom:1px solid #e0e7ef;display:flex;gap:12px;align-items:center;">';
  html+='<span style="font-weight:600;font-size:13px;color:#1a2a4a;">Status:</span>';
  html+='<button onclick="_admEditRec.res=\'ok\';_renderAdmEditModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='ok'?'#43a047':'#ccc')+';background:'+(rec.res==='ok'?'#43a047':'white')+';color:'+(rec.res==='ok'?'white':'#555')+';font-weight:700;cursor:pointer;">✓ Completo</button>';
  html+='<button onclick="_admEditRec.res=\'warn\';_renderAdmEditModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='warn'?'#ff9800':'#ccc')+';background:'+(rec.res==='warn'?'#ff9800':'white')+';color:'+(rec.res==='warn'?'white':'#555')+';font-weight:700;cursor:pointer;">⚠ Incompleto</button>';
  html+='</div>';

  // Items
  html+='<div style="padding:16px 20px;max-height:60vh;overflow-y:auto;">';
  for(var s=0;s<rec.mand.length;s++){
    var sec=rec.mand[s];
    var sName=sec.s||'';
    html+='<div style="margin-bottom:20px;">';
    html+='<div style="font-weight:700;font-size:13px;color:#4A90D9;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e0e7ef;">'+sName+'</div>';
    for(var i=0;i<sec.items.length;i++){
      var it=sec.items[i];
      if(!it.n)continue;
      var st=it.st||'';
      html+='<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:6px;margin-bottom:6px;background:'+(st==='ok'?'#f1f8e9':st==='na'?'#f5f7f8':'#fff9f9')+';border:1px solid '+(st==='ok'?'#c8e6c9':st==='na'?'#e0e0e0':'#ffcdd2')+';">';
      html+='<span style="flex:1;font-size:13px;color:#1a2a4a;">'+it.n+'</span>';
      html+='<button onclick="_admEditItem('+s+','+i+',\'ok\')" style="padding:5px 10px;border-radius:5px;border:1.5px solid '+(st==='ok'?'#43a047':'#ccc')+';background:'+(st==='ok'?'#43a047':'white')+';color:'+(st==='ok'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">✓ OK</button>';
      html+='<button onclick="_admEditItem('+s+','+i+',\'na\')" style="padding:5px 10px;border-radius:5px;border:1.5px solid '+(st==='na'?'#90a4ae':'#ccc')+';background:'+(st==='na'?'#90a4ae':'white')+';color:'+(st==='na'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">N/A</button>';
      html+='<button onclick="_admEditItem('+s+','+i+',\'\')" style="padding:5px 10px;border-radius:5px;border:1.5px solid '+(st===''?'#ef5350':'#ccc')+';background:'+(st===''?'#ef5350':'white')+';color:'+(st===''?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">✕</button>';
      html+='</div>';
    }
    html+='</div>';
  }
  html+='</div>';

  // Footer
  html+='<div style="padding:16px 20px;background:#f5f7fa;border-top:1px solid #e0e7ef;display:flex;gap:10px;justify-content:flex-end;">';
  html+='<button onclick="document.getElementById(\'adm-edit-fin-modal\').remove()" style="padding:10px 20px;border-radius:8px;border:1px solid #ccc;background:white;color:#555;font-weight:600;cursor:pointer;">Cancelar</button>';
  html+='<button onclick="admSaveFinMand()" style="padding:10px 24px;border-radius:8px;border:none;background:#1a2a4a;color:white;font-weight:700;cursor:pointer;font-size:14px;">💾 Salvar</button>';
  html+='</div>';
  html+='</div>';

  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function _admEditItem(si,ii,newSt){
  var it=_admEditRec.mand[si].items[ii];
  it.st=it.st===newSt?'':newSt; // toggle off if same
  _renderAdmEditModal();
}

function admSaveFinMand(){
  var rec=_admEditRec;
  if(!rec)return;
  var recId=rec.recId, ownerUser=rec.ownerUser, newMand=rec.mand, newRes=rec.res;
  // Patch in-memory cache
  if(_admAllData&&_admAllData.fins){
    var cidx=_admAllData.fins.findIndex(function(f){return f.id===recId;});
    if(cidx>=0){_admAllData.fins[cidx].res=newRes;_admAllData.fins[cidx].mand=JSON.parse(JSON.stringify(newMand));}
  }
  // Patch local FINS if own record
  var localIdx=FINS.findIndex(function(f){return f.id===recId;});
  if(localIdx>=0){FINS[localIdx].res=newRes;FINS[localIdx].mand=JSON.parse(JSON.stringify(newMand));svf();}
  // Close modal and re-render
  var modal=document.getElementById('adm-edit-fin-modal');
  if(modal)modal.remove();
  renderAdmChecklists();
  renderFin();
  // Save to owner's cloud key in background
  if(typeof _UPSTASH_URL!=='undefined'&&ownerUser){
    var key='tb7_'+ownerUser;
    fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['GET',key]])})
    .then(function(r){return r.json();}).then(function(res){
      var raw=res[0]&&res[0].result?res[0].result:'';
      if(!raw)return;
      var udata;try{udata=JSON.parse(raw);}catch(e){return;}
      if(!udata.fins)return;
      var fidx=udata.fins.findIndex(function(f){return f.id===recId;});
      if(fidx<0)return;
      udata.fins[fidx].res=newRes;
      udata.fins[fidx].mand=JSON.parse(JSON.stringify(newMand));
      return fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['SET',key,JSON.stringify(udata)]])});
    }).then(function(){_showToast('✅ Salvo com sucesso!','ok');}).catch(function(){_showToast('⚠ Salvo localmente (cloud pendente)','warn');});
  }
}

// ===== ADMIN EDIT — FLIGHT FINALIZED =====
var _admEditFlight=null;

function admOpenEditFinFlight(recId, ownerUser){
  var rec=_admAllData&&_admAllData.fins?_admAllData.fins.find(function(f){return f.id===recId&&f.type!=='mandatory';}):null;
  if(!rec){_showToast('Record not found. Try refreshing.','warn');return;}
  if(!rec.cl||!rec.cl.length){_showToast('This record has no checklist items to edit.','warn');return;}
  _admEditFlight={recId:recId,ownerUser:ownerUser,cl:JSON.parse(JSON.stringify(rec.cl||[])),res:rec.res||'ok',mat:rec.mat,mod:rec.mod};
  _renderAdmEditFlightModal();
}

function _renderAdmEditFlightModal(){
  var ex=document.getElementById('adm-edit-flight-modal');
  if(ex)ex.remove();
  var rec=_admEditFlight;
  var overlay=document.createElement('div');
  overlay.id='adm-edit-flight-modal';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:16px;box-sizing:border-box;overflow-y:auto;';

  var html='<div style="background:white;border-radius:14px;width:100%;max-width:700px;margin:auto;overflow:hidden;">';
  html+='<div style="background:#1a2a4a;color:white;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">';
  html+='<div><div style="font-weight:700;font-size:16px;">✏️ Edit Flight — '+_h(rec.mat)+'</div><div style="font-size:12px;opacity:0.8;">'+_h(rec.mod)+'</div></div>';
  html+='<button onclick="document.getElementById(\'adm-edit-flight-modal\').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;">✕</button>';
  html+='</div>';

  html+='<div style="padding:14px 20px;background:#f5f7fa;border-bottom:1px solid #e0e7ef;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">';
  html+='<span style="font-weight:600;font-size:13px;color:#1a2a4a;">Result:</span>';
  html+='<button onclick="_admEditFlight.res=\'ok\';_renderAdmEditFlightModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='ok'?'#43a047':'#ccc')+';background:'+(rec.res==='ok'?'#43a047':'white')+';color:'+(rec.res==='ok'?'white':'#555')+';font-weight:700;cursor:pointer;">✓ Acceptable</button>';
  html+='<button onclick="_admEditFlight.res=\'warn\';_renderAdmEditFlightModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='warn'?'#ff9800':'#ccc')+';background:'+(rec.res==='warn'?'#ff9800':'white')+';color:'+(rec.res==='warn'?'white':'#555')+';font-weight:700;cursor:pointer;">⚠ Restriction</button>';
  html+='<button onclick="_admEditFlight.res=\'danger\';_renderAdmEditFlightModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='danger'?'#f44336':'#ccc')+';background:'+(rec.res==='danger'?'#f44336':'white')+';color:'+(rec.res==='danger'?'white':'#555')+';font-weight:700;cursor:pointer;">✕ Not Accept.</button>';
  html+='</div>';

  html+='<div style="padding:16px 20px;max-height:60vh;overflow-y:auto;">';
  for(var s=0;s<rec.cl.length;s++){
    var sec=rec.cl[s];
    html+='<div style="margin-bottom:20px;">';
    html+='<div style="font-weight:700;font-size:13px;color:#4A90D9;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e0e7ef;">'+(sec.s||'')+'</div>';
    for(var i=0;i<sec.items.length;i++){
      var it=sec.items[i];
      if(!it.n)continue;
      var st=it.st||'';
      var bg=st==='ac'?'#f1f8e9':st==='re'?'#fff8e1':st==='na'?'#ffebee':st==='np'?'#f5f5f5':'#fafafa';
      var bd=st==='ac'?'#c8e6c9':st==='re'?'#ffe082':st==='na'?'#ffcdd2':st==='np'?'#e0e0e0':'#e0e7ef';
      html+='<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:6px;margin-bottom:6px;background:'+bg+';border:1px solid '+bd+';flex-wrap:wrap;">';
      html+='<span style="flex:1;min-width:120px;font-size:13px;color:#1a2a4a;">'+_h(it.n)+'</span>';
      html+='<button onclick="_admEditFlightItem('+s+','+i+',\'ac\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='ac'?'#43a047':'#ccc')+';background:'+(st==='ac'?'#43a047':'white')+';color:'+(st==='ac'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">✓ AC</button>';
      html+='<button onclick="_admEditFlightItem('+s+','+i+',\'re\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='re'?'#ff9800':'#ccc')+';background:'+(st==='re'?'#ff9800':'white')+';color:'+(st==='re'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">R</button>';
      html+='<button onclick="_admEditFlightItem('+s+','+i+',\'na\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='na'?'#f44336':'#ccc')+';background:'+(st==='na'?'#f44336':'white')+';color:'+(st==='na'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">✕ NAC</button>';
      html+='<button onclick="_admEditFlightItem('+s+','+i+',\'np\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='np'?'#90a4ae':'#ccc')+';background:'+(st==='np'?'#90a4ae':'white')+';color:'+(st==='np'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">N/A</button>';
      html+='</div>';
    }
    html+='</div>';
  }
  html+='</div>';

  html+='<div style="padding:16px 20px;background:#f5f7fa;border-top:1px solid #e0e7ef;display:flex;gap:10px;justify-content:flex-end;">';
  html+='<button onclick="document.getElementById(\'adm-edit-flight-modal\').remove()" style="padding:10px 20px;border-radius:8px;border:1px solid #ccc;background:white;color:#555;font-weight:600;cursor:pointer;">Cancelar</button>';
  html+='<button onclick="admSaveFinFlight()" style="padding:10px 24px;border-radius:8px;border:none;background:#1a2a4a;color:white;font-weight:700;cursor:pointer;font-size:14px;">💾 Salvar</button>';
  html+='</div>';
  html+='</div>';

  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function _admEditFlightItem(si,ii,newSt){
  var it=_admEditFlight.cl[si].items[ii];
  it.st=it.st===newSt?'':newSt;
  _renderAdmEditFlightModal();
}

function admSaveFinFlight(){
  var rec=_admEditFlight;
  if(!rec)return;
  var recId=rec.recId, ownerUser=rec.ownerUser, newCl=rec.cl, newRes=rec.res;
  if(_admAllData&&_admAllData.fins){
    var cidx=_admAllData.fins.findIndex(function(f){return f.id===recId;});
    if(cidx>=0){_admAllData.fins[cidx].res=newRes;_admAllData.fins[cidx].cl=JSON.parse(JSON.stringify(newCl));}
  }
  var localIdx=FINS.findIndex(function(f){return f.id===recId;});
  if(localIdx>=0){FINS[localIdx].res=newRes;FINS[localIdx].cl=JSON.parse(JSON.stringify(newCl));svf();}
  var modal=document.getElementById('adm-edit-flight-modal');
  if(modal)modal.remove();
  renderAdmChecklists();
  renderFin();
  if(typeof _UPSTASH_URL!=='undefined'&&ownerUser){
    var key='tb7_'+ownerUser;
    fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['GET',key]])})
    .then(function(r){return r.json();}).then(function(res){
      var raw=res[0]&&res[0].result?res[0].result:'';
      if(!raw)return;
      var udata;try{udata=JSON.parse(raw);}catch(e){return;}
      if(!udata.fins)return;
      var fidx=udata.fins.findIndex(function(f){return f.id===recId;});
      if(fidx<0)return;
      udata.fins[fidx].res=newRes;
      udata.fins[fidx].cl=JSON.parse(JSON.stringify(newCl));
      return fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['SET',key,JSON.stringify(udata)]])});
    }).then(function(){_showToast('✅ Salvo com sucesso!','ok');}).catch(function(){_showToast('⚠ Salvo localmente (cloud pendente)','warn');});
  }
}

// ===== ADMIN EDIT — VTI/VTE FINALIZED =====
var _admEditVTIVTE=null;

function admOpenEditFinVTIVTE(recId, ownerUser){
  var rec=_admAllData&&_admAllData.finsvtivte?_admAllData.finsvtivte.find(function(f){return f.id===recId;}):null;
  if(!rec){_showToast('Record not found. Try refreshing.','warn');return;}
  _admEditVTIVTE={recId:recId,ownerUser:ownerUser,cl:JSON.parse(JSON.stringify(rec.cl||[])),res:rec.res||'ok',mat:rec.mat,mod:rec.mod,type:rec.type||''};
  _renderAdmEditVTIVTEModal();
}

function _renderAdmEditVTIVTEModal(){
  var ex=document.getElementById('adm-edit-vtivte-modal');
  if(ex)ex.remove();
  var rec=_admEditVTIVTE;
  var overlay=document.createElement('div');
  overlay.id='adm-edit-vtivte-modal';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-start;justify-content:center;padding:16px;box-sizing:border-box;overflow-y:auto;';

  var typeLabel=rec.type?' ('+rec.type+')':'';
  var html='<div style="background:white;border-radius:14px;width:100%;max-width:700px;margin:auto;overflow:hidden;">';
  html+='<div style="background:#4a1272;color:white;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;">';
  html+='<div><div style="font-weight:700;font-size:16px;">✏️ Edit VTI/VTE'+typeLabel+' — '+_h(rec.mat)+'</div><div style="font-size:12px;opacity:0.8;">'+_h(rec.mod)+'</div></div>';
  html+='<button onclick="document.getElementById(\'adm-edit-vtivte-modal\').remove()" style="background:rgba(255,255,255,0.2);border:none;color:white;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:18px;line-height:1;">✕</button>';
  html+='</div>';

  html+='<div style="padding:14px 20px;background:#f5f7fa;border-bottom:1px solid #e0e7ef;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">';
  html+='<span style="font-weight:600;font-size:13px;color:#1a2a4a;">Resultado:</span>';
  html+='<button onclick="_admEditVTIVTE.res=\'ok\';_renderAdmEditVTIVTEModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='ok'?'#43a047':'#ccc')+';background:'+(rec.res==='ok'?'#43a047':'white')+';color:'+(rec.res==='ok'?'white':'#555')+';font-weight:700;cursor:pointer;">✓ Satisfatório</button>';
  html+='<button onclick="_admEditVTIVTE.res=\'warn\';_renderAdmEditVTIVTEModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='warn'?'#fb8c00':'#ccc')+';background:'+(rec.res==='warn'?'#fb8c00':'white')+';color:'+(rec.res==='warn'?'white':'#555')+';font-weight:700;cursor:pointer;">FT Faltando</button>';
  html+='<button onclick="_admEditVTIVTE.res=\'danger\';_renderAdmEditVTIVTEModal()" style="padding:8px 18px;border-radius:8px;border:2px solid '+(rec.res==='danger'?'#e53935':'#ccc')+';background:'+(rec.res==='danger'?'#e53935':'white')+';color:'+(rec.res==='danger'?'white':'#555')+';font-weight:700;cursor:pointer;">✕ Deficiente</button>';
  html+='</div>';

  html+='<div style="padding:16px 20px;max-height:60vh;overflow-y:auto;">';
  for(var s=0;s<rec.cl.length;s++){
    var sec=rec.cl[s];
    html+='<div style="margin-bottom:20px;">';
    html+='<div style="font-weight:700;font-size:13px;color:#7b1fa2;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #e0e7ef;">'+(sec.s||'')+'</div>';
    for(var i=0;i<sec.items.length;i++){
      var it=sec.items[i];
      if(!it.n)continue;

      if(it.type==='airworthy'){
        var awSt=it.st||'';
        html+='<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:6px;margin-bottom:6px;background:#fafafa;border:1px solid #e0e7ef;flex-wrap:wrap;">';
        html+='<span style="flex:1;min-width:120px;font-size:13px;color:#1a2a4a;">'+_h(it.n)+'</span>';
        html+='<button onclick="_admEditVTIVTEItem('+s+','+i+',null,\'aero\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(awSt==='aero'?'#43a047':'#ccc')+';background:'+(awSt==='aero'?'#43a047':'white')+';color:'+(awSt==='aero'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">AERONAVEGÁVEL</button>';
        html+='<button onclick="_admEditVTIVTEItem('+s+','+i+',null,\'naoaero\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(awSt==='naoaero'?'#e53935':'#ccc')+';background:'+(awSt==='naoaero'?'#e53935':'white')+';color:'+(awSt==='naoaero'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">NÃO-AERONAVEGÁVEL</button>';
        html+='</div>';
        continue;
      }

      if(Array.isArray(it.st)){
        var colLbls=(sec.multiCols||it.cols||[]);
        html+='<div style="padding:8px 10px;border-radius:6px;margin-bottom:6px;background:#fafafa;border:1px solid #e0e7ef;">';
        html+='<div style="font-size:13px;color:#1a2a4a;margin-bottom:6px;">'+_h(it.n)+'</div>';
        html+='<div style="display:flex;flex-wrap:wrap;gap:10px;">';
        it.st.forEach(function(cst,ci){
          html+='<div style="display:flex;align-items:center;gap:4px;">';
          html+='<span style="font-size:10px;color:#888;font-weight:700;">'+_h(String(colLbls[ci]||(ci+1)))+'</span>';
          ['ok','na','ft','df'].forEach(function(opt){
            var onCol={'ok':'#43a047','na':'#90a4ae','ft':'#fb8c00','df':'#e53935'}[opt];
            html+='<button onclick="_admEditVTIVTEItem('+s+','+i+','+ci+',\''+opt+'\')" style="padding:4px 7px;border-radius:5px;border:1.5px solid '+(cst===opt?onCol:'#ccc')+';background:'+(cst===opt?onCol:'white')+';color:'+(cst===opt?'white':'#555')+';font-size:10px;font-weight:700;cursor:pointer;">'+opt.toUpperCase()+'</button>';
          });
          html+='</div>';
        });
        html+='</div></div>';
        continue;
      }

      var st=it.st||'';
      var bg=st==='ok'?'#f1f8e9':st==='na'?'#f5f5f5':st==='ft'?'#fff8e1':st==='df'?'#ffebee':'#fafafa';
      var bd=st==='ok'?'#c8e6c9':st==='na'?'#e0e0e0':st==='ft'?'#ffe082':st==='df'?'#ffcdd2':'#e0e7ef';
      html+='<div style="display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:6px;margin-bottom:6px;background:'+bg+';border:1px solid '+bd+';flex-wrap:wrap;">';
      html+='<span style="flex:1;min-width:120px;font-size:13px;color:#1a2a4a;">'+_h(it.n)+'</span>';
      html+='<button onclick="_admEditVTIVTEItem('+s+','+i+',null,\'ok\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='ok'?'#43a047':'#ccc')+';background:'+(st==='ok'?'#43a047':'white')+';color:'+(st==='ok'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">✓ OK</button>';
      html+='<button onclick="_admEditVTIVTEItem('+s+','+i+',null,\'na\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='na'?'#90a4ae':'#ccc')+';background:'+(st==='na'?'#90a4ae':'white')+';color:'+(st==='na'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">NA</button>';
      html+='<button onclick="_admEditVTIVTEItem('+s+','+i+',null,\'ft\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='ft'?'#fb8c00':'#ccc')+';background:'+(st==='ft'?'#fb8c00':'white')+';color:'+(st==='ft'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">FT</button>';
      html+='<button onclick="_admEditVTIVTEItem('+s+','+i+',null,\'df\')" style="padding:5px 9px;border-radius:5px;border:1.5px solid '+(st==='df'?'#e53935':'#ccc')+';background:'+(st==='df'?'#e53935':'white')+';color:'+(st==='df'?'white':'#555')+';font-size:11px;font-weight:700;cursor:pointer;">DF</button>';
      html+='</div>';
    }
    html+='</div>';
  }
  html+='</div>';

  html+='<div style="padding:16px 20px;background:#f5f7fa;border-top:1px solid #e0e7ef;display:flex;gap:10px;justify-content:flex-end;">';
  html+='<button onclick="document.getElementById(\'adm-edit-vtivte-modal\').remove()" style="padding:10px 20px;border-radius:8px;border:1px solid #ccc;background:white;color:#555;font-weight:600;cursor:pointer;">Cancelar</button>';
  html+='<button onclick="admSaveFinVTIVTE()" style="padding:10px 24px;border-radius:8px;border:none;background:#4a1272;color:white;font-weight:700;cursor:pointer;font-size:14px;">💾 Salvar</button>';
  html+='</div>';
  html+='</div>';

  overlay.innerHTML=html;
  document.body.appendChild(overlay);
}

function _admEditVTIVTEItem(si,ii,ci,newSt){
  var it=_admEditVTIVTE.cl[si].items[ii];
  if(ci===null||ci===undefined){
    it.st=it.st===newSt?'':newSt;
  } else {
    if(!Array.isArray(it.st))return;
    it.st[ci]=it.st[ci]===newSt?'--':newSt;
  }
  _renderAdmEditVTIVTEModal();
}

function admSaveFinVTIVTE(){
  var rec=_admEditVTIVTE;
  if(!rec)return;
  var recId=rec.recId, ownerUser=rec.ownerUser, newCl=rec.cl, newRes=rec.res;
  if(_admAllData&&_admAllData.finsvtivte){
    var cidx=_admAllData.finsvtivte.findIndex(function(f){return f.id===recId;});
    if(cidx>=0){_admAllData.finsvtivte[cidx].res=newRes;_admAllData.finsvtivte[cidx].cl=JSON.parse(JSON.stringify(newCl));}
  }
  if(typeof FINSVTIVTE!=='undefined'){
    var localIdx=FINSVTIVTE.findIndex(function(f){return f.id===recId;});
    if(localIdx>=0){FINSVTIVTE[localIdx].res=newRes;FINSVTIVTE[localIdx].cl=JSON.parse(JSON.stringify(newCl));if(typeof svfVTIVTE==='function')svfVTIVTE();}
  }
  var modal=document.getElementById('adm-edit-vtivte-modal');
  if(modal)modal.remove();
  renderAdmChecklists();
  if(typeof renderFinVTIVTE==='function') renderFinVTIVTE();
  if(typeof _UPSTASH_URL!=='undefined'&&ownerUser){
    var key='tb7_'+ownerUser;
    fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['GET',key]])})
    .then(function(r){return r.json();}).then(function(res){
      var raw=res[0]&&res[0].result?res[0].result:'';
      if(!raw)return;
      var udata;try{udata=JSON.parse(raw);}catch(e){return;}
      if(!udata.vtivte_fins)return;
      var fidx=udata.vtivte_fins.findIndex(function(f){return f.id===recId;});
      if(fidx<0)return;
      udata.vtivte_fins[fidx].res=newRes;
      udata.vtivte_fins[fidx].cl=JSON.parse(JSON.stringify(newCl));
      return fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['SET',key,JSON.stringify(udata)]])});
    }).then(function(){_showToast('✅ Salvo com sucesso!','ok');}).catch(function(){_showToast('⚠ Salvo localmente (cloud pendente)','warn');});
  }
}

// Also try to recover potentially double-encoded cloud data for a user
function admRepairCloudData(u){
  var key='tb7_'+u;
  fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['GET',key]])})
  .then(function(r){return r.json();}).then(function(res){
    var raw=res[0]&&res[0].result;
    if(!raw){_showToast(u+': sem dados no cloud — pode estar vazio','warn');return;}
    // Parse once
    var data;
    try{data=JSON.parse(raw);}catch(e){data=null;}
    // If result is a string (not an object), it's double-encoded — parse again
    if(typeof data==='string'){
      try{data=JSON.parse(data);}catch(e){data=null;}
      if(data&&typeof data==='object'){
        // Repair: save back correctly
        return fetch(_UPSTASH_URL+'/pipeline',{method:'POST',headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},body:JSON.stringify([['SET',key,JSON.stringify(data)]])})
        .then(function(){
          var nFins=(data.fins||[]).length;
          var nMand=(data.mand||[]).length;
          _showToast('✅ '+u+' reparado! '+nFins+' fins, '+nMand+' mand','ok');
          _admAllData=null;renderAdmChecklists();
        });
      }else{
        _showToast(u+': dados corrompidos, não recuperável','warn');return;
      }
    }
    if(!data||typeof data!=='object'){_showToast(u+': dados ilegíveis','warn');return;}
    // Data is fine
    var nFins=(data.fins||[]).length;
    var nMand=(data.mand||[]).length;
    var mandFins=(data.fins||[]).filter(function(f){return f.type==='mandatory';}).length;
    _showToast(u+': OK — '+nFins+' fins ('+mandFins+' mandatory), '+nMand+' mand ativos','ok');
  }).catch(function(){_showToast(u+': erro de rede','warn');});
}

// Change the result of a finalized mandatory record (admin only)
// recId = r.id, ownerUser = r._owner username, newRes = 'ok'|'warn'
function setFinMandResult(recId, ownerUser, newRes){
  // 1. Patch the in-memory cache immediately so the UI updates right away
  //    without needing a cloud round-trip (avoids race conditions)
  if(_admAllData&&_admAllData.fins){
    var cidx=_admAllData.fins.findIndex(function(f){return f.id===recId;});
    if(cidx>=0)_admAllData.fins[cidx].res=newRes;
  }
  // 2. Patch local FINS if this record belongs to the current user
  var localIdx=FINS.findIndex(function(f){return f.id===recId;});
  if(localIdx>=0){
    FINS[localIdx].res=newRes;
    svf(); // saves locally + triggers cloudSave in background
  }
  // 3. Re-render immediately using the patched in-memory cache
  renderAdmChecklists();
  renderFin();
  // 4. For other users' records, patch their cloud key in the background
  if(localIdx<0&&typeof _UPSTASH_URL!=='undefined'&&ownerUser){
    var key='tb7_'+ownerUser;
    fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify([['GET',key]])
    }).then(function(r){return r.json();}).then(function(res){
      var raw=res[0]&&res[0].result?res[0].result:'';
      if(!raw)return;
      var udata;try{udata=JSON.parse(raw);}catch(e){return;}
      if(!udata.fins)return;
      var fidx=udata.fins.findIndex(function(f){return f.id===recId;});
      if(fidx<0)return;
      udata.fins[fidx].res=newRes;
      return fetch(_UPSTASH_URL+'/pipeline',{
        method:'POST',
        headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
        body:JSON.stringify([['SET',key,JSON.stringify(udata)]])
      });
    }).catch(function(){});
  }
}

function openEditAircraft(type,idx){
  var av;
  if(type==='flight')av=AVS[idx];
  else if(type==='vtivte')av=(typeof AVSVTIVTE!=='undefined')?AVSVTIVTE[idx]:null;
  else if(type==='mand')av=MAND[idx];
  if(!av)return;
  document.getElementById('edit-ac-type').value=type;
  document.getElementById('edit-ac-idx').value=idx;
  document.getElementById('edit-ac-mat').value=av.mat;
  document.getElementById('edit-ac-serie').value=av.serie||'';
  document.getElementById('edit-ac-resp').value=av.resp;
  document.getElementById('mod-edit-aircraft').style.display='flex';
}

function saveEditAircraft(){
  var type=document.getElementById('edit-ac-type').value;
  var idx=parseInt(document.getElementById('edit-ac-idx').value);
  var mat=document.getElementById('edit-ac-mat').value.toUpperCase().trim();
  var serie=document.getElementById('edit-ac-serie').value.trim();
  var resp=document.getElementById('edit-ac-resp').value;
  if(!mat||!resp){alert('Registration and responsible are required.');return;}
  if(type==='flight'){AVS[idx].mat=mat;AVS[idx].serie=serie;AVS[idx].resp=resp;sv();}
  else if(type==='vtivte'&&typeof AVSVTIVTE!=='undefined'){AVSVTIVTE[idx].mat=mat;AVSVTIVTE[idx].serie=serie;AVSVTIVTE[idx].resp=resp;if(typeof saveVTIVTE==='function')saveVTIVTE();}
  else if(type==='mand'){MAND[idx].mat=mat;MAND[idx].serie=serie;MAND[idx].resp=resp;svMand();}
  document.getElementById('mod-edit-aircraft').style.display='none';
  renderAdmChecklists();
  _showToast('✅ Aircraft updated!','ok');
  if(typeof cloudSave==='function')cloudSave();
}

function admDeleteAircraft(type,idx){
  var mat='';
  if(type==='flight')mat=AVS[idx]?AVS[idx].mat:'';
  else if(type==='vtivte')mat=(typeof AVSVTIVTE!=='undefined'&&AVSVTIVTE[idx])?AVSVTIVTE[idx].mat:'';
  else if(type==='mand')mat=MAND[idx]?MAND[idx].mat:'';
  if(!confirm('Delete '+mat+'? This cannot be undone.'))return;
  if(type==='flight'){AVS.splice(idx,1);sv();}
  else if(type==='vtivte'&&typeof AVSVTIVTE!=='undefined'){AVSVTIVTE.splice(idx,1);if(typeof saveVTIVTE==='function')saveVTIVTE();}
  else if(type==='mand'){MAND.splice(idx,1);svMand();}
  renderAdmChecklists();
  _showToast('🗑 Deleted: '+mat,'ok');
  if(typeof cloudSave==='function')cloudSave();
}

// ===== CHECKLIST TEMPLATE EDITOR =====

var _tplType='flight',_tplModel='',_tplVtType='VTI';

function _getTplArr(){
  if(_tplType==='flight')return _tplModel?CL[_tplModel]:null;
  if(_tplType==='vtivte')return _tplModel?(((typeof CL_VTIVTE!=='undefined'?CL_VTIVTE:{})[_tplVtType]||{})[_tplModel]||null):null;
  if(_tplType==='mand')return MAND_TEMPLATE;
  return null;
}

function _saveTpl(){
  if(_tplType==='flight'){
    try{localStorage.setItem('tb7_cl_custom',JSON.stringify(CL));}catch(e){}
  } else if(_tplType==='vtivte'){
    try{
      if(typeof CL_VTIVTE!=='undefined'){
        localStorage.setItem('tb7_cl_vtivte_custom',JSON.stringify(CL_VTIVTE));
        localStorage.setItem('tb7_cl_vtivte_custom_v', typeof CL_VTIVTE_TPL_VERSION!=='undefined'?CL_VTIVTE_TPL_VERSION:'');
      }
    }catch(e){}
  } else if(_tplType==='mand'){
    try{localStorage.setItem('tb7_mand_custom',JSON.stringify(MAND_TEMPLATE));}catch(e){}
  }
}

// Normalize MAND_TEMPLATE {cat:[items]} → [{s,items}] for uniform display
function _tplToArray(data,isMand){
  if(!isMand)return data; // already [{s,items}]
  return Object.keys(data).map(function(k){return {s:k,items:data[k]};});
}

// Write back [{s,items}] into MAND_TEMPLATE
function _arrayToMand(arr){
  var out={};
  arr.forEach(function(sec){out[sec.s]=sec.items;});
  Object.keys(MAND_TEMPLATE).forEach(function(k){delete MAND_TEMPLATE[k];});
  arr.forEach(function(sec){MAND_TEMPLATE[sec.s]=sec.items;});
}

function renderAdmTemplates(){
  var el=document.getElementById('adm-tpl-content');
  if(!el)return;

  var isMand=(_tplType==='mand');
  var rawData=_getTplArr();
  var secArr=rawData?(isMand?_tplToArray(rawData,true):rawData):null;

  var h='';

  // Type buttons
  h+='<div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;">';
  [{k:'flight',l:'✈️ Flight Inspection'},{k:'vtivte',l:'🔍 VTI/VTE'},{k:'mand',l:'📄 Mandatory Docs'}].forEach(function(tb){
    var act=_tplType===tb.k;
    h+='<button onclick="_tplType=\''+tb.k+'\';_tplModel=\'\';renderAdmTemplates()" style="padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;background:'+(act?'#1a2a4a':'#e8edf4')+';color:'+(act?'white':'#1a2a4a')+';">'+tb.l+'</button>';
  });
  h+='</div>';

  // Model selector row (not for mandatory)
  if(!isMand){
    h+='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">';
    if(_tplType==='vtivte'){
      h+='<select onchange="_tplVtType=this.value;_tplModel=\'\';renderAdmTemplates()" style="padding:8px 12px;border:1.5px solid #dde3ed;border-radius:8px;font-size:13px;">';
      h+='<option value="VTI"'+(_tplVtType==='VTI'?' selected':'')+'>VTI</option>';
      h+='<option value="VTE"'+(_tplVtType==='VTE'?' selected':'')+'>VTE</option>';
      h+='</select>';
    }
    var models=_tplType==='flight'?Object.keys(CL):Object.keys((typeof CL_VTIVTE!=='undefined'?CL_VTIVTE[_tplVtType]||{}:{}));
    h+='<select onchange="_tplModel=this.value;renderAdmTemplates()" style="padding:8px 12px;border:1.5px solid #dde3ed;border-radius:8px;font-size:13px;">';
    h+='<option value="">-- Select Aircraft Model --</option>';
    models.forEach(function(m){h+='<option value="'+_escHtml(m)+'"'+(_tplModel===m?' selected':'')+'>'+_escHtml(m)+'</option>';});
    h+='</select>';
    h+='</div>';
  }

  if(!secArr){
    h+='<div style="color:#bbb;font-size:14px;padding:20px 0;text-align:center;">Select a model to view and edit its checklist template.</div>';
    el.innerHTML=h;return;
  }

  // Header bar
  var totalItems=0;secArr.forEach(function(s){totalItems+=s.items.length;});
  h+='<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap;">';
  h+='<span style="font-size:12px;color:#888;">'+secArr.length+' sections · '+totalItems+' items total — click ✏️ to edit, 🗑 to delete</span>';
  h+='<button onclick="tplResetModel()" style="margin-left:auto;padding:7px 14px;background:#ff7043;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">↺ Reset to Default</button>';
  h+='</div>';

  // Sections
  secArr.forEach(function(sec,sIdx){
    h+='<div style="background:white;border:1px solid #e0e7ef;border-radius:10px;margin-bottom:8px;overflow:hidden;">';
    // Section header
    h+='<div style="display:flex;align-items:center;padding:10px 14px;background:#f5f7fa;gap:8px;">';
    h+='<span onclick="tplToggleSec(this)" style="cursor:pointer;font-size:11px;color:#aaa;user-select:none;padding:4px;min-width:20px;">▶</span>';
    h+='<span onclick="tplToggleSec(this.parentElement.querySelector(\'span\'))" style="font-weight:700;font-size:14px;color:#1a2a4a;flex:1;cursor:pointer;">'+_escHtml(sec.s)+'</span>';
    h+='<span style="font-size:11px;background:#e8edf4;color:#555;padding:2px 8px;border-radius:10px;">'+sec.items.length+' items</span>';
    h+='<button onclick="tplOpenEditSection('+sIdx+')" style="padding:4px 10px;background:#4A90D9;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;">✏️ Rename</button>';
    h+='<button onclick="tplDeleteSection('+sIdx+')" style="padding:4px 10px;background:#f44336;color:white;border:none;border-radius:6px;cursor:pointer;font-size:11px;font-weight:600;margin-left:4px;">🗑</button>';
    h+='</div>';
    // Items (hidden by default — toggle on click)
    h+='<div class="tpl-sec-body" style="display:none;padding:8px 14px 12px;">';
    sec.items.forEach(function(item,iIdx){
      var iN=typeof item==='string'?item:item.n;
      var iT=typeof item==='object'&&item.type?item.type:'standard';
      var typeBadge=iT==='select'?'<span style="font-size:10px;background:#e8f5e9;color:#2e7d32;border-radius:4px;padding:1px 5px;margin-right:4px;flex-shrink:0;">☑ Select</span>':iT==='qty'?'<span style="font-size:10px;background:#fff3e0;color:#e65100;border-radius:4px;padding:1px 5px;margin-right:4px;flex-shrink:0;">🔢 Qty</span>':'';
      h+='<div style="display:flex;align-items:flex-start;gap:8px;padding:5px 0;border-bottom:1px solid #f5f5f5;">';
      h+='<span style="color:#bbb;font-size:12px;min-width:24px;padding-top:3px;text-align:right;">'+(iIdx+1)+'.</span>';
      h+=typeBadge;
      h+='<span style="flex:1;font-size:13px;color:#333;line-height:1.4;">'+_escHtml(iN)+'</span>';
      h+='<button onclick="tplOpenEditItem('+sIdx+','+iIdx+')" style="padding:3px 8px;background:#4A90D9;color:white;border:none;border-radius:5px;cursor:pointer;font-size:11px;flex-shrink:0;">✏️</button>';
      h+='<button onclick="tplDeleteItem('+sIdx+','+iIdx+')" style="padding:3px 8px;background:#f44336;color:white;border:none;border-radius:5px;cursor:pointer;font-size:11px;flex-shrink:0;margin-left:2px;">🗑</button>';
      h+='</div>';
    });
    h+='<button onclick="tplOpenAddItem('+sIdx+')" style="margin-top:8px;padding:7px 14px;background:#e8f5e9;color:#2e7d32;border:1px solid #c8e6c9;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">+ Add Item</button>';
    h+='</div>';
    h+='</div>';
  });

  h+='<button onclick="tplOpenAddSection()" style="margin-top:4px;padding:9px 18px;background:#e8edf4;color:#1a2a4a;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;">+ Add Section</button>';

  el.innerHTML=h;
}

function tplToggleSec(arrowEl){
  var card=arrowEl.closest ? arrowEl.closest('.tpl-sec-body') : null;
  // find sibling tpl-sec-body
  var parent=arrowEl.parentElement; // the header div
  var body=parent.nextElementSibling;
  if(!body)return;
  var open=body.style.display==='block';
  body.style.display=open?'none':'block';
  arrowEl.textContent=open?'▶':'▼';
}

// ---- Modal helpers ----
function _tplOpenModal(title,text,mode,sIdx,iIdx,itemType){
  document.getElementById('mod-tpl-edit-title').textContent=title;
  document.getElementById('tpl-edit-text').value=text;
  document.getElementById('tpl-edit-mode').value=mode;
  document.getElementById('tpl-edit-sec-idx').value=sIdx!==null?sIdx:'';
  document.getElementById('tpl-edit-item-idx').value=iIdx!==null?iIdx:'';
  var isItemMode=(mode==='item'||mode==='new-item');
  var typeRow=document.getElementById('tpl-type-row');
  if(typeRow)typeRow.style.display=isItemMode?'block':'none';
  var typeEl=document.getElementById('tpl-edit-type');
  if(typeEl&&isItemMode)typeEl.value=itemType||'standard';
  document.getElementById('mod-tpl-edit').style.display='flex';
  setTimeout(function(){document.getElementById('tpl-edit-text').focus();},50);
}

function tplOpenEditItem(sIdx,iIdx){
  var secArr=_tplType==='mand'?_tplToArray(_getTplArr(),true):_getTplArr();
  if(!secArr)return;
  var raw=secArr[sIdx].items[iIdx];
  var iN=typeof raw==='string'?raw:raw.n;
  var iT=typeof raw==='object'&&raw.type?raw.type:'standard';
  _tplOpenModal('✏️ Edit Item',iN,'item',sIdx,iIdx,iT);
  // 'multi'/'airworthy' items have no editable type in this dropdown (Standard/Select/Quantity
  // don't cover them) — hide the row so saving can't silently downgrade the item's type/cols.
  if(iT==='multi'||iT==='airworthy'){
    var typeRow=document.getElementById('tpl-type-row');
    if(typeRow)typeRow.style.display='none';
  }
}

function tplOpenAddItem(sIdx){
  _tplOpenModal('➕ Add Item to Section','','new-item',sIdx,null,'standard');
}

function tplOpenEditSection(sIdx){
  var secArr=_tplType==='mand'?_tplToArray(_getTplArr(),true):_getTplArr();
  if(!secArr)return;
  _tplOpenModal('✏️ Rename Section',secArr[sIdx].s,'section',sIdx,null);
}

function tplOpenAddSection(){
  _tplOpenModal('➕ Add New Section','','new-section',null,null);
}

function tplSaveModal(){
  var text=document.getElementById('tpl-edit-text').value.trim();
  var mode=document.getElementById('tpl-edit-mode').value;
  var sIdx=parseInt(document.getElementById('tpl-edit-sec-idx').value);
  var iIdx=parseInt(document.getElementById('tpl-edit-item-idx').value);
  if(!text){alert('Text cannot be empty.');return;}

  var typeEl=document.getElementById('tpl-edit-type');
  var chosenType=typeEl?typeEl.value:'standard';

  var isMand=(_tplType==='mand');
  var secArr=isMand?_tplToArray(MAND_TEMPLATE,true):_getTplArr();
  if(!secArr)return;

  // For item modes, store as object if type is non-standard, plain string otherwise
  function _mkItem(txt,ty){ return ty==='standard'?txt:{n:txt,type:ty}; }

  if(mode==='item'){
    var _origItem=secArr[sIdx].items[iIdx];
    var _origType=typeof _origItem==='object'&&_origItem.type?_origItem.type:'standard';
    if(_origType==='multi'||_origType==='airworthy'){
      // Preserve type/cols — the type dropdown can't represent these, only the name changed.
      secArr[sIdx].items[iIdx]=Object.assign({},_origItem,{n:text});
    } else {
      secArr[sIdx].items[iIdx]=_mkItem(text,chosenType);
    }
  } else if(mode==='new-item'){
    secArr[sIdx].items.push(_mkItem(text,chosenType));
  } else if(mode==='section'){
    secArr[sIdx].s=text;
  } else if(mode==='new-section'){
    secArr.push({s:text,items:[]});
  }

  if(isMand)_arrayToMand(secArr);
  else if(_tplType==='vtivte'&&typeof CL_VTIVTE!=='undefined'){
    CL_VTIVTE[_tplVtType][_tplModel]=secArr;
  }

  _saveTpl();
  document.getElementById('mod-tpl-edit').style.display='none';
  _showToast('✅ Template saved!','ok');
  renderAdmTemplates();
}

function tplDeleteItem(sIdx,iIdx){
  var isMand=(_tplType==='mand');
  var secArr=isMand?_tplToArray(MAND_TEMPLATE,true):_getTplArr();
  if(!secArr)return;
  var item=secArr[sIdx].items[iIdx];
  if(!confirm('Delete item:\n"'+item+'"?'))return;
  secArr[sIdx].items.splice(iIdx,1);
  if(isMand)_arrayToMand(secArr);
  else if(_tplType==='vtivte'&&typeof CL_VTIVTE!=='undefined')CL_VTIVTE[_tplVtType][_tplModel]=secArr;
  _saveTpl();
  _showToast('🗑 Item deleted','ok');
  renderAdmTemplates();
}

function tplDeleteSection(sIdx){
  var isMand=(_tplType==='mand');
  var secArr=isMand?_tplToArray(MAND_TEMPLATE,true):_getTplArr();
  if(!secArr)return;
  var sec=secArr[sIdx];
  if(!confirm('Delete section "'+sec.s+'" with all '+sec.items.length+' items?'))return;
  secArr.splice(sIdx,1);
  if(isMand)_arrayToMand(secArr);
  else if(_tplType==='vtivte'&&typeof CL_VTIVTE!=='undefined')CL_VTIVTE[_tplVtType][_tplModel]=secArr;
  _saveTpl();
  _showToast('🗑 Section deleted','ok');
  renderAdmTemplates();
}

function tplResetModel(){
  var label=_tplType==='mand'?'Mandatory Docs template':(_tplModel+' template');
  if(!confirm('Reset '+label+' to factory defaults? All custom edits will be lost.'))return;
  if(_tplType==='flight'){
    try{var s=localStorage.getItem('tb7_cl_custom');if(s){var o=JSON.parse(s);delete o[_tplModel];localStorage.setItem('tb7_cl_custom',JSON.stringify(o));}}catch(e){}
    _showToast('↺ Reset — reload the page to see defaults','ok');
  } else if(_tplType==='vtivte'){
    try{var s=localStorage.getItem('tb7_cl_vtivte_custom');if(s){var o=JSON.parse(s);if(o[_tplVtType])delete o[_tplVtType][_tplModel];localStorage.setItem('tb7_cl_vtivte_custom',JSON.stringify(o));}}catch(e){}
    _showToast('↺ Reset — reload the page to see defaults','ok');
  } else if(_tplType==='mand'){
    localStorage.removeItem('tb7_mand_custom');
    _showToast('↺ Reset — reload the page to see defaults','ok');
  }
}

// ===== ADMIN DASHBOARD / STATISTICS =====

// Bytes used in the Upstash Redis cloud DB (via INFO memory), checked
// against the Upstash Free plan's 256MB data-size limit for the alert below.
var UPSTASH_LIMIT_BYTES=256*1024*1024; // Upstash Free plan data-size limit
var _upstashUsageBytes=null;
var _upstashUsageTs=0;
var _upstashUsageChecking=false;

// Refreshes the cached Upstash usage (throttled to once every 5min unless forced),
// then re-renders the Dashboard so the alert reflects the fresh number.
function _refreshUpstashUsage(force){
  if(!ME||ME.role!=='dev')return;
  if(_upstashUsageChecking)return;
  if(!force&&_upstashUsageTs&&(Date.now()-_upstashUsageTs)<5*60*1000)return;
  if(typeof checkUpstashUsage!=='function')return;
  _upstashUsageChecking=true;
  checkUpstashUsage(function(bytes){
    _upstashUsageChecking=false;
    _upstashUsageTs=Date.now(); // throttle retries even on failure, to avoid hammering Upstash
    if(bytes==null)return;
    _upstashUsageBytes=bytes;
    var _statsPg=document.getElementById('adm-pg-stats');
    if(typeof renderAdmDashboard==='function'&&_statsPg&&_statsPg.style.display!=='none')renderAdmDashboard();
  });
}

function _renderStorageAlert(){
  if(!ME||ME.role!=='dev')return ''; // dev-only — other admins don't need to see this
  _refreshUpstashUsage(false);
  if(_upstashUsageBytes==null)return '';
  var pct=Math.min(100,Math.round(_upstashUsageBytes/UPSTASH_LIMIT_BYTES*100));
  var usedMB=(_upstashUsageBytes/(1024*1024)).toFixed(1);
  var limitMB=(UPSTASH_LIMIT_BYTES/(1024*1024)).toFixed(0);
  if(pct<60)return '';
  var danger=pct>=85;
  var bg=danger?'linear-gradient(135deg,#c62828,#8e0000)':'linear-gradient(135deg,#e65100,#bf360c)';
  var h='<div style="background:'+bg+';border-radius:12px;padding:14px 18px;margin:0 14px 12px;color:white;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
  h+='<span style="font-size:22px;">'+(danger?'🚨':'⚠️')+'</span>';
  h+='<div style="flex:1;min-width:220px;">';
  h+='<div style="font-weight:800;font-size:13px;">Banco de dados (Upstash) '+(danger?'quase cheio':'ficando cheio')+' — '+usedMB+'MB de '+limitMB+'MB ('+pct+'%)</div>';
  h+='<div style="font-size:12px;opacity:.9;margin-top:2px;">O banco na nuvem está enchendo. Considere apagar vistorias finalizadas antigas em Admin &gt; History, ou revisar as fotos salvas em Admin &gt; Photos.</div>';
  h+='</div>';
  h+='<button onclick="admTab(\'history\')" style="padding:8px 16px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);color:white;border-radius:8px;cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;">🗂️ Ir para History</button>';
  h+='</div>';
  return h;
}

function _renderAdmDashboardData(el, fins, vteFins, actlog){
  // Separate flight-only from mandatory within fins
  var flightFins=fins.filter(function(f){return !f.type||f.type==='flight';});
  var mandFins=fins.filter(function(f){return f.type==='mandatory';});
  // Collect all finalized records
  var allFins=fins.concat(vteFins);

  // Parse DD/MM/YYYY HH:MM date string
  function parseDate(ds){
    if(!ds)return null;
    var p=ds.split(' ')[0].split('/');
    return p.length<3?null:new Date(parseInt(p[2]),parseInt(p[1])-1,parseInt(p[0]));
  }

  // Last 6 months buckets
  var now=new Date();
  var monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var months=[];
  for(var m=5;m>=0;m--){
    var d=new Date(now.getFullYear(),now.getMonth()-m,1);
    months.push({key:d.getFullYear()+'-'+(d.getMonth()+1),
      label:monthNames[d.getMonth()]+'\''+String(d.getFullYear()).slice(2),count:0});
  }
  allFins.forEach(function(f){
    var d=parseDate(f.df);if(!d)return;
    var key=d.getFullYear()+'-'+(d.getMonth()+1);
    for(var mi=0;mi<months.length;mi++){if(months[mi].key===key){months[mi].count++;break;}}
  });

  // Result distribution
  var rc={ok:0,warn:0,danger:0,neutral:0};
  allFins.forEach(function(f){if(rc[f.res]!==undefined)rc[f.res]++;else rc.neutral++;});
  var total=allFins.length||1;

  // Problem aircraft (warn or danger results)
  var ap={};
  allFins.forEach(function(f){
    if(f.res==='warn'||f.res==='danger')ap[f.mat]=(ap[f.mat]||0)+1;
  });
  var probList=Object.keys(ap).map(function(k){return{mat:k,cnt:ap[k]};})
    .sort(function(a,b){return b.cnt-a.cnt;}).slice(0,6);
  var maxProb=probList.length?probList[0].cnt:1;

  // User ranking from activity log
  var ua={};
  actlog.forEach(function(l){
    if(!ua[l.u])ua[l.u]={nome:l.nome,total:0,fins:0};
    ua[l.u].total++;
    if(l.action.indexOf('fin_')===0)ua[l.u].fins++;
  });
  var uList=Object.keys(ua).map(function(k){return ua[k];})
    .sort(function(a,b){return b.total-a.total;}).slice(0,6);
  var maxU=uList.length?uList[0].total:1;

  var activeTotal=AVS.length+(typeof AVSVTIVTE!=='undefined'?AVSVTIVTE.length:0)+MAND.length;
  var maxBar=Math.max.apply(null,months.map(function(m){return m.count;}))||1;
  var medals=['🥇','🥈','🥉','4.','5.','6.'];
  var lastInsp=allFins.length?allFins.sort(function(a,b){return(b.id||0)-(a.id||0);})[0].df:'—';

  var css='<style>';
  css+='@keyframes _dashFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}';
  css+='@keyframes _dashPop{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}';
  css+='@keyframes _dashPulse{0%,100%{box-shadow:0 0 0 0 rgba(74,144,217,0.18)}50%{box-shadow:0 0 0 8px rgba(74,144,217,0)}}';
  css+='.dash-card{animation:_dashFadeUp 0.45s cubic-bezier(.22,.68,0,1.2) both}';
  css+='.dash-stat{animation:_dashPop 0.4s cubic-bezier(.22,.68,0,1.2) both}';
  css+='.dash-bar-v{transition:height 0.8s cubic-bezier(.4,0,.2,1);}';
  css+='.dash-bar-h{transition:width 0.8s cubic-bezier(.4,0,.2,1);}';
  css+='.dash-seg{transition:flex 0.9s cubic-bezier(.4,0,.2,1)}';
  css+='</style>';

  var h=css;
  h+='<div style="background:#f0f2f5;border-radius:16px;padding:0 0 8px;overflow:hidden;">';

  // ── Hero header ────────────────────────────────────────────
  h+='<div style="background:linear-gradient(135deg,#1a2a4a 0%,#2d4a7a 60%,#1a3a6a 100%);padding:22px 22px 18px;position:relative;overflow:hidden;">';
  h+='<div style="position:absolute;right:-20px;top:-20px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,0.04);"></div>';
  h+='<div style="position:absolute;right:30px;top:10px;width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,0.06);"></div>';
  h+='<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;">';
  h+='<div>';
  h+='<div style="font-size:11px;font-weight:600;color:rgba(255,255,255,0.55);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px;">TB Aviation</div>';
  h+='<div style="font-size:22px;font-weight:800;color:white;letter-spacing:-0.3px;">Admin Dashboard</div>';
  h+='<div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:5px;">Last inspection: '+lastInsp+'</div>';
  h+='</div>';
  h+='<button onclick="_admAllData=null;renderAdmDashboard()" style="padding:8px 16px;background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.9);border:1px solid rgba(255,255,255,0.2);border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;backdrop-filter:blur(4px);">🔄 Refresh</button>';
  h+='</div></div>';

  var _storageAlertHtml=_renderStorageAlert();
  if(_storageAlertHtml)h+='<div style="padding-top:12px;">'+_storageAlertHtml+'</div>';

  h+='<div style="padding:14px 14px 6px;display:grid;gap:12px;">';

  // ── Stat cards ─────────────────────────────────────────────
  var _curM=months[5].count, _prevM=months[4].count, _diffM=_curM-_prevM;
  var _prevMLabel=months[4].label;
  var statCards=[
    {label:'Total Finalized',value:allFins.length,color:'#43a047',grad:'linear-gradient(135deg,#43a047,#1b5e20)',icon:'✅',sub:'inspections done',
     diff:_curM,diffLabel:'added this month'},
    {label:'In Progress',value:activeTotal,color:'#4A90D9',grad:'linear-gradient(135deg,#4A90D9,#1a2a6c)',icon:'⏳',sub:'open checklists',
     diff:null},
    {label:'This Month',value:_curM,color:'#e65100',grad:'linear-gradient(135deg,#e65100,#bf360c)',icon:'📅',sub:'finalizations',
     diff:_diffM,diffLabel:'vs '+_prevMLabel},
    {label:'Active Users',value:uList.length,color:'#7b1fa2',grad:'linear-gradient(135deg,#7b1fa2,#4a0072)',icon:'👥',sub:'in activity log',
     diff:null}
  ];
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px;">';
  statCards.forEach(function(c,ci){
    var diffHtml='';
    if(c.diff!==null&&c.diff!==undefined){
      var pos=c.diff>0, neg=c.diff<0;
      var arrow=pos?'↑':neg?'↓':'→';
      var clr=pos?'#43a047':neg?'#e53935':'#90a4ae';
      diffHtml='<div style="margin-top:6px;display:flex;align-items:center;gap:3px;">'+
        '<span style="font-size:13px;font-weight:800;color:'+clr+';">'+arrow+(c.diff>0?'+':'')+c.diff+'</span>'+
        '<span style="font-size:10px;color:#aaa;"> '+_h(c.diffLabel||'')+'</span>'+
      '</div>';
    }
    h+='<div class="dash-stat" style="animation-delay:'+( ci*0.07)+'s;background:white;border-radius:14px;padding:16px 14px;box-shadow:0 4px 16px rgba(0,0,0,0.08);position:relative;overflow:hidden;">';
    h+='<div style="position:absolute;right:-10px;top:-10px;width:56px;height:56px;border-radius:50%;background:'+c.grad+';opacity:0.12;"></div>';
    h+='<div style="font-size:22px;margin-bottom:8px;">'+c.icon+'</div>';
    h+='<div class="dash-num" data-target="'+c.value+'" style="font-size:32px;font-weight:900;color:'+c.color+';line-height:1;letter-spacing:-1px;">0</div>';
    h+='<div style="font-size:12px;font-weight:700;color:#1a2a4a;margin-top:5px;">'+c.label+'</div>';
    h+='<div style="font-size:10px;color:#aaa;margin-top:2px;">'+c.sub+'</div>';
    h+=diffHtml;
    h+='<div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:'+c.grad+';border-radius:0 0 14px 14px;"></div>';
    h+='</div>';
  });
  h+='</div>';

  // ── By-type breakdown ──────────────────────────────────────
  h+='<div class="dash-card" style="animation-delay:0.28s;background:white;border-radius:14px;padding:18px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">';
  h+='<div style="font-size:13px;font-weight:700;color:#1a2a4a;margin-bottom:14px;display:flex;align-items:center;gap:6px;">📋 <span>Finalized by Type</span></div>';
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">';
  (function(){
    var flRC={ok:0,warn:0,danger:0,neutral:0};
    flightFins.forEach(function(f){if(flRC[f.res]!==undefined)flRC[f.res]++;else flRC.neutral++;});
    var vtRC={ok:0,warn:0,danger:0,neutral:0};
    vteFins.forEach(function(f){if(vtRC[f.res]!==undefined)vtRC[f.res]++;else vtRC.neutral++;});
    function typeCard(icon,label,color,grad,cnt,breakdown){
      var c='<div style="background:linear-gradient(135deg,'+color+'12,'+color+'06);border:1px solid '+color+'30;border-radius:12px;padding:14px;">';
      c+='<div style="display:flex;align-items:center;gap:7px;margin-bottom:10px;">';
      c+='<div style="width:32px;height:32px;border-radius:8px;background:'+grad+';display:flex;align-items:center;justify-content:center;font-size:16px;">'+icon+'</div>';
      c+='<div><div style="font-size:12px;font-weight:800;color:'+color+';">'+label+'</div><div style="font-size:10px;color:#aaa;">'+cnt+' records</div></div>';
      c+='</div>';
      c+='<div style="font-size:11px;color:#555;line-height:1.9;">'+breakdown+'</div>';
      c+='</div>';
      return c;
    }
    var flBd=(flRC.ok?'<span style="color:#43a047;font-weight:700;">✓ AC: '+flRC.ok+'</span><br>':'')+(flRC.warn?'<span style="color:#ff9800;font-weight:700;">⚠ R: '+flRC.warn+'</span><br>':'')+(flRC.danger?'<span style="color:#f44336;font-weight:700;">✕ NAC: '+flRC.danger+'</span><br>':'')+(flRC.neutral?'<span style="color:#90a4ae;">— Pend: '+flRC.neutral+'</span>':'')+((!flightFins.length)?'<span style="color:#bbb;">No records yet</span>':'');
    var vtBd=(vtRC.ok?'<span style="color:#43a047;font-weight:700;">✓ AC: '+vtRC.ok+'</span><br>':'')+(vtRC.warn?'<span style="color:#ff9800;font-weight:700;">⚠ R: '+vtRC.warn+'</span><br>':'')+(vtRC.danger?'<span style="color:#f44336;font-weight:700;">✕ NAC: '+vtRC.danger+'</span><br>':'')+(vtRC.neutral?'<span style="color:#90a4ae;">— Pend: '+vtRC.neutral+'</span>':'')+((!vteFins.length)?'<span style="color:#bbb;">No records yet</span>':'');
    h+=typeCard('✈️','Flight','#4A90D9','linear-gradient(135deg,#4A90D9,#1a5276)',flightFins.length,flBd);
    h+=typeCard('🔬','VTI/VTE','#7b1fa2','linear-gradient(135deg,#7b1fa2,#4a0072)',vteFins.length,vtBd);
    h+=typeCard('📄','Mandatory','#e65100','linear-gradient(135deg,#e65100,#bf360c)',mandFins.length,'<span style="color:#e65100;font-weight:700;">'+mandFins.length+' finalized</span><br>'+(mandFins.length?'<span style="color:#aaa;">Docs archived</span>':'<span style="color:#bbb;">No records yet</span>'));
  })();
  h+='</div></div>';

  // ── Monthly bar chart ──────────────────────────────────────
  h+='<div class="dash-card" style="animation-delay:0.35s;background:white;border-radius:14px;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">';
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">';
  h+='<div style="font-size:13px;font-weight:700;color:#1a2a4a;display:flex;align-items:center;gap:6px;">📈 <span>Inspections — Last 6 Months</span></div>';
  h+='<div style="font-size:11px;color:#aaa;">Total: <b style="color:#1a2a4a;">'+allFins.length+'</b></div>';
  h+='</div>';
  // Chart wrapper with grid lines
  h+='<div style="position:relative;padding-bottom:32px;">';
  // Horizontal grid lines
  var gridLabels=[Math.round(maxBar*0.5),maxBar];
  h+='<div style="position:absolute;left:0;right:0;top:0;bottom:32px;pointer-events:none;">';
  [100,50].forEach(function(pct){
    var lbl=Math.round(maxBar*(pct/100));
    h+='<div style="position:absolute;left:0;right:0;bottom:'+(Math.round((lbl/maxBar)*120))+'px;display:flex;align-items:center;gap:6px;">';
    h+='<span style="font-size:9px;color:#e0e0e0;min-width:12px;text-align:right;">'+lbl+'</span>';
    h+='<div style="flex:1;height:1px;background:#f0f0f0;"></div>';
    h+='</div>';
  });
  h+='</div>';
  // Bars — chronological order (oldest → newest, left → right)
  h+='<div style="display:flex;align-items:flex-end;gap:6px;height:160px;padding-left:20px;">';
  for(var mi2=0;mi2<months.length;mi2++){
    var mo=months[mi2];
    var isThis=(mi2===months.length-1);
    var prevMo=mi2>0?months[mi2-1]:null;
    var diff=prevMo!==null?(mo.count-prevMo.count):null;
    var barH=mo.count>0?Math.max(Math.round((mo.count/maxBar)*120),10):0;
    var barGrad=isThis
      ?'linear-gradient(180deg,#5ba8f5 0%,#1a2a4a 100%)'
      :'linear-gradient(180deg,#a8cff0 0%,#4A90D9 100%)';
    var parts=mo.label.split("'");
    var monLabel=parts[0], yrLabel="'"+(parts[1]||'');
    h+='<div style="flex:1;display:flex;flex-direction:column;align-items:center;position:relative;">';
    // Delta badge (↑/↓ vs previous month)
    if(diff!==null&&diff!==0){
      var dClr=diff>0?'#43a047':'#e53935';
      var dArrow=diff>0?'↑':'↓';
      h+='<div style="font-size:10px;font-weight:800;color:'+dClr+';margin-bottom:2px;">'+dArrow+Math.abs(diff)+'</div>';
    } else if(diff===0&&mi2>0){
      h+='<div style="font-size:10px;color:#bbb;margin-bottom:2px;">→</div>';
    } else {
      h+='<div style="height:16px;margin-bottom:2px;"></div>';
    }
    // Count badge above bar
    if(mo.count>0){
      h+='<div style="font-size:11px;font-weight:800;color:'+(isThis?'#1a2a4a':'#4A90D9')+';margin-bottom:4px;background:'+(isThis?'#dbeafe':'#f0f6fc')+';padding:1px 7px;border-radius:10px;">'+mo.count+'</div>';
    }else{
      h+='<div style="height:20px;margin-bottom:4px;"></div>';
    }
    // Bar or empty dot
    h+='<div style="flex:1;width:100%;display:flex;align-items:flex-end;justify-content:center;">';
    if(mo.count>0){
      h+='<div class="dash-bar-v" data-h="'+barH+'" style="width:80%;max-width:44px;height:0;border-radius:7px 7px 0 0;background:'+barGrad+';position:relative;">';
      if(isThis) h+='<div style="position:absolute;top:0;left:0;right:0;height:100%;border-radius:7px 7px 0 0;background:rgba(255,255,255,0.15);"></div>';
      h+='</div>';
    }else{
      h+='<div style="width:6px;height:6px;border-radius:50%;background:#e0e7ef;margin-bottom:2px;"></div>';
    }
    h+='</div>';
    // Month label
    h+='<div style="position:absolute;bottom:-30px;text-align:center;width:100%;">';
    h+='<div style="font-size:10px;font-weight:'+(isThis?'800':'500')+';color:'+(isThis?'#1a2a4a':'#aaa')+';">'+monLabel+'</div>';
    h+='<div style="font-size:9px;color:'+(isThis?'#4A90D9':'#ccc')+';">'+yrLabel+'</div>';
    h+='</div>';
    h+='</div>';
  }
  h+='</div>';
  // Baseline
  h+='<div style="margin-left:20px;height:2px;background:linear-gradient(90deg,#e0e7ef,#c8daf0);border-radius:1px;margin-top:0;"></div>';
  h+='</div>'; // end chart wrapper
  h+='</div>'; // end card

  // ── Two column: Result dist + Problems ─────────────────────
  h+='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">';

  // Result distribution
  h+='<div class="dash-card" style="animation-delay:0.42s;background:white;border-radius:14px;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">';
  h+='<div style="font-size:13px;font-weight:700;color:#1a2a4a;margin-bottom:14px;display:flex;align-items:center;gap:6px;">📊 <span>Result Distribution</span></div>';
  var segs=[{k:'ok',l:'Acceptable',c:'#43a047'},{k:'warn',l:'Restriction',c:'#ff9800'},
            {k:'danger',l:'Not Acceptable',c:'#f44336'},{k:'neutral',l:'Pending',c:'#e0e0e0'}];
  h+='<div style="display:flex;height:20px;border-radius:6px;overflow:hidden;margin-bottom:14px;gap:2px;">';
  segs.forEach(function(sg){
    if(rc[sg.k]>0) h+='<div class="dash-seg" style="flex:'+rc[sg.k]+';background:'+sg.c+';border-radius:4px;" title="'+sg.l+': '+rc[sg.k]+'"></div>';
  });
  h+='</div>';
  segs.forEach(function(sg){
    var pct=Math.round((rc[sg.k]/total)*100);
    if(!rc[sg.k]) return;
    h+='<div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f5f5f5;">';
    h+='<div style="display:flex;align-items:center;gap:7px;">';
    h+='<div style="width:10px;height:10px;border-radius:3px;background:'+sg.c+';flex-shrink:0;"></div>';
    h+='<span style="font-size:12px;color:#555;">'+sg.l+'</span></div>';
    h+='<div style="display:flex;align-items:center;gap:8px;"><b style="font-size:13px;color:#1a2a4a;">'+rc[sg.k]+'</b><span style="font-size:11px;color:#bbb;">('+pct+'%)</span></div>';
    h+='</div>';
  });
  h+='</div>';

  // Problem aircraft
  h+='<div class="dash-card" style="animation-delay:0.49s;background:white;border-radius:14px;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">';
  h+='<div style="font-size:13px;font-weight:700;color:#1a2a4a;margin-bottom:14px;display:flex;align-items:center;gap:6px;">⚠️ <span>Most Issues</span></div>';
  if(!probList.length){
    h+='<div style="display:flex;flex-direction:column;align-items:center;padding:20px 0;gap:8px;">';
    h+='<div style="font-size:32px;">🎉</div>';
    h+='<div style="font-size:13px;color:#bbb;text-align:center;">No issues recorded — great!</div>';
    h+='</div>';
  }else{
    probList.forEach(function(p,pi){
      var pct=Math.round((p.cnt/maxProb)*100);
      h+='<div style="margin-bottom:12px;">';
      h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">';
      h+='<span style="font-size:12px;font-weight:700;color:#1a2a4a;">'+(pi+1)+'. '+p.mat+'</span>';
      h+='<span style="font-size:11px;font-weight:700;background:#ffebee;color:#f44336;padding:2px 7px;border-radius:10px;">'+p.cnt+'x</span>';
      h+='</div>';
      h+='<div style="height:7px;background:#f5f5f5;border-radius:4px;overflow:hidden;">';
      h+='<div class="dash-bar-h" data-w="'+pct+'" style="height:100%;width:0;background:linear-gradient(90deg,#ff9800,#f44336);border-radius:4px;"></div>';
      h+='</div></div>';
    });
  }
  h+='</div>';

  h+='</div>'; // end 2-col

  // ── User ranking ───────────────────────────────────────────
  h+='<div class="dash-card" style="animation-delay:0.56s;background:white;border-radius:14px;padding:20px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">';
  h+='<div style="font-size:13px;font-weight:700;color:#1a2a4a;margin-bottom:14px;display:flex;align-items:center;gap:6px;">🏆 <span>Most Active Users</span></div>';
  if(!uList.length){
    h+='<div style="color:#bbb;font-size:13px;padding:10px 0;text-align:center;">No activity logged yet.</div>';
  }else{
    var rankColors=['#f0b429','#c0c0c0','#cd7f32','#4A90D9','#4A90D9','#4A90D9'];
    uList.forEach(function(u,ui){
      var pct=Math.round((u.total/maxU)*100);
      var initials=(u.nome||'?').split(' ').slice(0,2).map(function(w){return w[0]||'';}).join('').toUpperCase();
      h+='<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f5f5f5;">';
      h+='<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,'+rankColors[ui]+','+rankColors[ui]+'88);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:white;flex-shrink:0;">'+initials+'</div>';
      h+='<div style="flex:1;min-width:0;">';
      h+='<div style="font-size:13px;font-weight:700;color:#1a2a4a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'+medals[ui]+' '+u.nome+'</div>';
      h+='<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">';
      h+='<div style="flex:1;height:5px;background:#f0f0f0;border-radius:3px;overflow:hidden;">';
      h+='<div class="dash-bar-h" data-w="'+pct+'" style="height:100%;width:0;background:linear-gradient(90deg,'+rankColors[ui]+'99,'+rankColors[ui]+');border-radius:3px;"></div>';
      h+='</div>';
      h+='<span style="font-size:11px;color:#aaa;white-space:nowrap;">'+u.total+' acts · '+u.fins+' fins</span>';
      h+='</div></div></div>';
    });
  }
  h+='</div>';

  h+='</div>'; // end inner grid
  h+='</div>'; // end outer wrapper
  el.innerHTML=h;

  // ── Trigger animations after render ───────────────────────
  // Count-up numbers
  var nums=el.querySelectorAll('.dash-num');
  nums.forEach(function(e){
    var target=parseInt(e.getAttribute('data-target'))||0;
    if(target===0){e.textContent='0';return;}
    var dur=900, start=Date.now();
    function tick(){
      var elapsed=Date.now()-start;
      var progress=Math.min(elapsed/dur,1);
      var eased=1-Math.pow(1-progress,3);
      e.textContent=Math.round(target*eased);
      if(progress<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
  // Animate bars
  setTimeout(function(){
    el.querySelectorAll('.dash-bar-v').forEach(function(b){
      b.style.height=(b.getAttribute('data-h')||'0')+'px';
    });
    el.querySelectorAll('.dash-bar-h').forEach(function(b){
      b.style.width=(b.getAttribute('data-w')||'0')+'%';
    });
  },200);
}

function renderAdmDashboard(){
  var el=document.getElementById('adm-stats-content');
  if(!el)return;
  if(!_admAllData){
    el.innerHTML='<div style="text-align:center;padding:40px;color:#aaa;">⏳ Loading all users\' data from cloud...</div>';
  }
  _loadAllUsersDataFromCloud(function(data){
    _renderAdmDashboardData(el,data.fins,data.finsvtivte,data.actlog);
  });
}

// ===== BACKUP & EXPORT =====

function renderAdmExport(){
  var el=document.getElementById('adm-export-content');
  if(!el)return;
  el.innerHTML='<div style="text-align:center;padding:40px;color:#aaa;">⏳ Loading all users\' data...</div>';
  _loadAllUsersDataFromCloud(function(data){
    var allFlightFins=(data.fins||[]).filter(function(f){return !f.type||f.type==='flight';});
    var allMandFins=(data.fins||[]).filter(function(f){return f.type==='mandatory';});
    var allVtFins=data.finsvtivte||[];
    var allFinsCount=allFlightFins.length+allMandFins.length+allVtFins.length;
    var active=AVS.length+(typeof AVSVTIVTE!=='undefined'?AVSVTIVTE.length:0)+MAND.length;

    var h='<div style="max-width:560px;">';
    h+='<div style="margin-bottom:20px;padding:14px 16px;background:#fffde7;border:1px solid #ffe082;border-radius:10px;font-size:13px;color:#795548;">';
    h+='👥 Export includes all users\' records (loaded from cloud). <button onclick="_admAllData=null;renderAdmExport()" style="margin-left:8px;padding:3px 10px;background:#795548;color:white;border:none;border-radius:5px;cursor:pointer;font-size:11px;">🔄 Refresh</button>';
    h+='</div>';

    function card(icon,title,desc,stats,btnLabel,btnColor,fn){
      var s='<div style="background:white;border-radius:12px;padding:22px;margin-bottom:14px;box-shadow:0 2px 8px rgba(0,0,0,0.07);border-left:4px solid '+btnColor+';">';
      s+='<div style="display:flex;align-items:flex-start;gap:14px;flex-wrap:wrap;">';
      s+='<div style="flex:1;min-width:200px;">';
      s+='<div style="font-size:15px;font-weight:700;color:#1a2a4a;margin-bottom:5px;">'+icon+' '+title+'</div>';
      s+='<div style="font-size:12px;color:#666;margin-bottom:8px;">'+desc+'</div>';
      s+='<div style="font-size:11px;color:#aaa;">'+stats+'</div>';
      s+='</div>';
      s+='<button onclick="'+fn+'" style="padding:11px 20px;background:'+btnColor+';color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;white-space:nowrap;align-self:center;">'+btnLabel+'</button>';
      s+='</div></div>';
      return s;
    }

    var today=new Date().toLocaleDateString('en-GB');
    h+=card('📦','Full Backup (JSON)',
      'Exports everything: active checklists, finalized records, activity log and templates.',
      'Active: '+active+' · Finalized: '+allFinsCount+' · Generated: '+today,
      '⬇ Download JSON','#1a2a4a','exportAllJSON()');

    h+=card('📋','Completed Records — All Users (Excel)',
      '4 sheets: Summary + Flight + VTI/VTE + Mandatory. Opens directly in Excel, Google Sheets or Numbers.',
      '✈️ Flight: '+allFlightFins.length+' · 🔬 VTI/VTE: '+allVtFins.length+' · 📄 Mandatory: '+allMandFins.length,
      '⬇ Download .xlsx','#43a047','exportAllCSVCloud()');

    h+=card('📄','Active Checklists (CSV)',
      'All currently in-progress checklists with their current status summary.',
      active+' active records (current user)',
      '⬇ Download CSV','#4A90D9','exportActiveCSV()');

    h+=card('📊','Activity Log (CSV)',
      'Full user activity log: logins, checklist actions with timestamps.',
      (data.actlog||[]).length+' log entries (all users)',
      '⬇ Download CSV','#7b1fa2','exportLogCSVCloud()');

    h+='</div>';
    el.innerHTML=h;
  });
}

function _dlBlob(content,filename,mime){
  var blob=new Blob([content],{type:mime});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download=filename;
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},200);
}

function _todayStr(){return new Date().toISOString().slice(0,10);}

function exportAllJSON(){
  var data={
    exported:new Date().toISOString(),
    app:'TB Aviation Flight Inspection',
    active_flight:AVS,
    active_mandatory:MAND,
    active_vtivte:typeof AVSVTIVTE!=='undefined'?AVSVTIVTE:[],
    finalized_flight:FINS.filter(function(f){return!f.type;}),
    finalized_mandatory:FINS.filter(function(f){return f.type==='mandatory';}),
    finalized_vtivte:typeof FINSVTIVTE!=='undefined'?FINSVTIVTE:[],
    activity_log:ACTLOG
  };
  _dlBlob(JSON.stringify(data,null,2),'tb-aviation-backup-'+_todayStr()+'.json','application/json');
  _showToast('✅ Full backup downloaded!','ok');
}

function _toCSV(rows){
  return '﻿'+rows.map(function(r){
    return r.map(function(cell){
      var s=(cell===null||cell===undefined)?'':String(cell).replace(/"/g,'""');
      return (s.indexOf(',')>-1||s.indexOf('"')>-1||s.indexOf('\n')>-1)?'"'+s+'"':s;
    }).join(',');
  }).join('\r\n');
}

function exportAllCSV(){
  // Local-only export (kept for backwards compatibility)
  var rows=[['Type','Registration','Model','Serial No.','Responsible','Created','Finalized','Result','Finalized By']];
  FINS.forEach(function(f){
    var t=f.type==='mandatory'?'Mandatory Document':'Flight Inspection';
    var r=f.res==='ok'?'All Acceptable':f.res==='warn'?'With Restrictions':f.res==='danger'?'Not Acceptable':'Pending';
    rows.push([t,f.mat||'',f.mod||'',f.serie||'',f.resp||'',f.dc||'',f.df||'',r,f.by||'']);
  });
  if(typeof FINSVTIVTE!=='undefined'){
    FINSVTIVTE.forEach(function(f){
      var r=f.res==='ok'?'All Acceptable':f.res==='warn'?'With Restrictions':f.res==='danger'?'Not Acceptable':'Pending';
      rows.push([f.type||'VTI/VTE',f.mat||'',f.mod||'',f.serie||'',f.resp||'',f.dc||'',f.df||'',r,f.by||'']);
    });
  }
  _dlBlob(_toCSV(rows),'tb-aviation-completed-'+_todayStr()+'.csv','text/csv;charset=utf-8');
  _showToast('✅ Completed records CSV downloaded!','ok');
}

function _loadExcelJS(cb){
  if(window.ExcelJS){cb();return;}
  if(_loadExcelJS._q){_loadExcelJS._q.push(cb);return;}
  _loadExcelJS._q=[];
  var s=document.createElement('script');
  s.src='https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.3.0/exceljs.min.js';
  s.onload=function(){var q=_loadExcelJS._q;_loadExcelJS._q=null;cb();q.forEach(function(f){f();});};
  s.onerror=function(){_loadExcelJS._q=null;_showToast('❌ Could not load ExcelJS. Check connection.','err');};
  document.head.appendChild(s);
}

function exportAllCSVCloud(){
  _showToast('⏳ Loading all users\' records...','ok');
  _loadAllUsersDataFromCloud(function(data){
    _loadExcelJS(function(){
      var flightFins=(data.fins||[]).filter(function(f){return !f.type||f.type==='flight';});
      var mandFins=(data.fins||[]).filter(function(f){return f.type==='mandatory';});
      var vtFins=data.finsvtivte||[];
      var now=new Date().toLocaleString('en-GB');

      function resLabel(res){
        return res==='ok'?'ALL ACCEPTABLE':res==='warn'?'WITH RESTRICTIONS':res==='danger'?'NOT ACCEPTABLE':'PENDING';
      }
      function resArgb(res){
        return res==='ok'?'FF43a047':res==='warn'?'FFe65100':res==='danger'?'FFc62828':'FF78909c';
      }
      function countSt(cl){
        var c={ac:0,re:0,na:0,np:0,pending:0};
        (cl||[]).forEach(function(sec){(sec.items||[]).forEach(function(it){
          if(it.st==='ac')c.ac++;else if(it.st==='re')c.re++;
          else if(it.st==='na')c.na++;else if(it.st==='np')c.np++;
          else c.pending++;
        });});
        return c;
      }
      function countMand(mand){
        var c={ok:0,na:0,pending:0};
        (mand||[]).forEach(function(sec){(sec.items||[]).forEach(function(it){
          if(it.st==='ok')c.ok++;else if(it.st==='na')c.na++;else c.pending++;
        });});
        return c;
      }
      function countVT(cl){
        var c={ok:0,na:0,ft:0,df:0,pending:0};
        function tally(st){
          if(st==='ok'||st==='aero')c.ok++;else if(st==='na')c.na++;
          else if(st==='ft')c.ft++;else if(st==='df'||st==='naoaero')c.df++;
          else c.pending++;
        }
        (cl||[]).forEach(function(sec){(sec.items||[]).forEach(function(it){
          if(Array.isArray(it.st))it.st.forEach(tally);else tally(it.st);
        });});
        return c;
      }

      // shared style helpers
      function hdrFill(argb){ return {type:'pattern',pattern:'solid',fgColor:{argb:argb}}; }
      function hdrFont(bold,argb){ return {bold:!!bold,color:{argb:argb||'FFFFFFFF'},size:11}; }
      function cellFill(argb){ return {type:'pattern',pattern:'solid',fgColor:{argb:argb}}; }
      function numFmt(cell){ cell.numFmt='0'; cell.alignment={horizontal:'center'}; }
      function styleHeader(row, fillArgb){
        row.eachCell(function(cell){
          cell.fill=hdrFill(fillArgb||'FF1a2a4a');
          cell.font=hdrFont(true,'FFFFFFFF');
          cell.alignment={horizontal:'center',vertical:'middle'};
          cell.border={bottom:{style:'medium',color:{argb:'FF334155'}}};
        });
        row.height=22;
      }
      function stripeRow(row, even){
        row.eachCell(function(cell){
          cell.fill=hdrFill(even?'FFf0f4f8':'FFffffff');
          cell.alignment={vertical:'middle',wrapText:false};
        });
        row.height=18;
      }
      function colorResultCell(cell, res){
        cell.fill=cellFill(resArgb(res));
        cell.font={bold:true,color:{argb:'FFFFFFFF'},size:10};
        cell.alignment={horizontal:'center',vertical:'middle'};
      }
      function colorCountCell(cell, type){
        var fills={ac:'FFe8f5e9',re:'FFfff3e0',na:'FFffebee',np:'FFeceff1',pending:'FFf5f5f5',ok:'FFe8f5e9'};
        var fonts={ac:'FF2e7d32',re:'FFe65100',na:'FFc62828',np:'FF546e7a',pending:'FF9e9e9e',ok:'FF2e7d32'};
        cell.fill=cellFill(fills[type]||'FFffffff');
        cell.font={bold:true,color:{argb:fonts[type]||'FF000000'},size:10};
        cell.alignment={horizontal:'center',vertical:'middle'};
      }

      var wb=new ExcelJS.Workbook();
      wb.creator='TB Aviation FI';
      wb.created=new Date();

      // ── Sheet 1: Summary ─────────────────────────────────
      var wsSumm=wb.addWorksheet('Summary',{tabColor:{argb:'FF1a2a4a'}});
      wsSumm.columns=[{width:36},{width:22}];

      var titleRow=wsSumm.addRow(['TB Aviation — Flight Inspection System','']);
      wsSumm.mergeCells('A1:B1');
      titleRow.getCell(1).fill=hdrFill('FF1a2a4a');
      titleRow.getCell(1).font={bold:true,color:{argb:'FFFFFFFF'},size:16};
      titleRow.getCell(1).alignment={horizontal:'center',vertical:'middle'};
      titleRow.height=36;

      var subRow=wsSumm.addRow(['Completed Records Export — All Users','']);
      wsSumm.mergeCells('A2:B2');
      subRow.getCell(1).fill=hdrFill('FF253148');
      subRow.getCell(1).font={bold:false,color:{argb:'FFb0c4de'},size:11};
      subRow.getCell(1).alignment={horizontal:'center'};
      subRow.height=20;

      wsSumm.addRow(['Generated',now]);
      wsSumm.addRow([]);

      var hRow=wsSumm.addRow(['Type','Total Records']);
      styleHeader(hRow,'FF334155');

      var summData=[
        {label:'✈️  Flight Inspections', count:flightFins.length, fill:'FF4A90D9'},
        {label:'🔬  VTI/VTE Inspections', count:vtFins.length,   fill:'FF7b1fa2'},
        {label:'📄  Mandatory Documents', count:mandFins.length, fill:'FFe65100'},
      ];
      summData.forEach(function(d,i){
        var r=wsSumm.addRow([d.label, d.count]);
        r.getCell(1).fill=hdrFill(d.fill); r.getCell(1).font=hdrFont(true);
        r.getCell(2).fill=hdrFill(d.fill); r.getCell(2).font=hdrFont(true);
        r.getCell(2).alignment={horizontal:'center'};
        r.height=22;
      });
      var totRow=wsSumm.addRow(['TOTAL', flightFins.length+vtFins.length+mandFins.length]);
      totRow.getCell(1).fill=hdrFill('FF1a2a4a'); totRow.getCell(1).font=hdrFont(true);
      totRow.getCell(2).fill=hdrFill('FF1a2a4a'); totRow.getCell(2).font=hdrFont(true);
      totRow.getCell(2).alignment={horizontal:'center'};
      totRow.height=24;

      // ── Sheet 2: Flight Inspections ──────────────────────
      var wsFL=wb.addWorksheet('Flight Inspections',{tabColor:{argb:'FF4A90D9'}});
      wsFL.columns=[
        {header:'#',width:5},{header:'Registration',width:14},{header:'Model',width:20},
        {header:'Serial No.',width:13},{header:'Responsible',width:18},
        {header:'Date Added',width:13},{header:'Date Finalized',width:14},
        {header:'Overall Result',width:20},
        {header:'AC',width:6},{header:'R',width:6},{header:'NAC',width:6},
        {header:'N/A',width:6},{header:'Pending',width:8},
        {header:'Finalized By',width:18},{header:'User',width:14}
      ];
      styleHeader(wsFL.getRow(1),'FF1a2a4a');
      wsFL.views=[{state:'frozen',ySplit:1}];
      wsFL.autoFilter={from:'A1',to:'O1'};
      flightFins.forEach(function(f,i){
        var c=countSt(f.cl);
        var r=wsFL.addRow([i+1,f.mat||'',f.mod||'',f.serie||'',f.resp||'',
          f.dc||'',f.df||'',resLabel(f.res),c.ac,c.re,c.na,c.np,c.pending,f.by||'',f._owner||'']);
        stripeRow(r,i%2===0);
        colorResultCell(r.getCell(8),f.res);
        colorCountCell(r.getCell(9),'ac'); colorCountCell(r.getCell(10),'re');
        colorCountCell(r.getCell(11),'na'); colorCountCell(r.getCell(12),'np');
        colorCountCell(r.getCell(13),'pending');
      });

      // ── Sheet 3: VTI/VTE ────────────────────────────────
      var wsVT=wb.addWorksheet('VTI-VTE Inspections',{tabColor:{argb:'FF7b1fa2'}});
      wsVT.columns=[
        {header:'#',width:5},{header:'Registration',width:14},{header:'Type',width:8},
        {header:'Model',width:20},{header:'Serial No.',width:13},{header:'Responsible',width:18},
        {header:'Date Added',width:13},{header:'Date Finalized',width:14},
        {header:'Overall Result',width:20},
        {header:'OK',width:6},{header:'NA',width:6},{header:'FT',width:6},{header:'DF',width:6},{header:'Pending',width:8},
        {header:'Finalized By',width:18},{header:'User',width:14}
      ];
      styleHeader(wsVT.getRow(1),'FF4a148c');
      wsVT.views=[{state:'frozen',ySplit:1}];
      wsVT.autoFilter={from:'A1',to:'P1'};
      vtFins.forEach(function(f,i){
        var c=countVT(f.cl);
        var r=wsVT.addRow([i+1,f.mat||'',f.type||'VTI/VTE',f.mod||'',f.serie||'',f.resp||'',
          f.dc||'',f.df||'',resLabel(f.res),c.ok,c.na,c.ft,c.df,c.pending,f.by||'',f._owner||'']);
        stripeRow(r,i%2===0);
        colorResultCell(r.getCell(9),f.res);
        colorCountCell(r.getCell(10),'ok'); colorCountCell(r.getCell(11),'np');
        colorCountCell(r.getCell(12),'re'); colorCountCell(r.getCell(13),'na');
        colorCountCell(r.getCell(14),'pending');
      });

      // ── Sheet 4: Mandatory Documents ────────────────────
      var wsMD=wb.addWorksheet('Mandatory Documents',{tabColor:{argb:'FFe65100'}});
      wsMD.columns=[
        {header:'#',width:5},{header:'Registration',width:14},{header:'Model',width:20},
        {header:'Serial No.',width:13},{header:'Responsible',width:18},
        {header:'Date Added',width:13},{header:'Date Finalized',width:14},
        {header:'Docs OK',width:10},{header:'Docs N/A',width:10},{header:'Docs Pending',width:12},
        {header:'Finalized By',width:18},{header:'User',width:14}
      ];
      styleHeader(wsMD.getRow(1),'FFbf360c');
      wsMD.views=[{state:'frozen',ySplit:1}];
      wsMD.autoFilter={from:'A1',to:'L1'};
      mandFins.forEach(function(f,i){
        var c=countMand(f.mand);
        var r=wsMD.addRow([i+1,f.mat||'',f.mod||'',f.serie||'',f.resp||'',
          f.dc||'',f.df||'',c.ok,c.na,c.pending,f.by||'',f._owner||'']);
        stripeRow(r,i%2===0);
        colorCountCell(r.getCell(8),'ok'); colorCountCell(r.getCell(9),'np');
        colorCountCell(r.getCell(10),'pending');
      });

      wb.xlsx.writeBuffer().then(function(buf){
        var blob=new Blob([buf],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
        var url=URL.createObjectURL(blob);
        var a=document.createElement('a');
        a.href=url; a.download='tb-aviation-completed-'+_todayStr()+'.xlsx';
        document.body.appendChild(a); a.click();
        setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},200);
        _showToast('✅ Excel file downloaded!','ok');
      });
    });
  });
}

function exportLogCSVCloud(){
  _showToast('⏳ Loading activity log...','ok');
  _loadAllUsersDataFromCloud(function(data){
    var labels={login:'Login',add_flight:'Added Flight',fin_flight:'Finalized Flight',
      add_vtivte:'Added VTI/VTE',fin_vtivte:'Finalized VTI/VTE',
      add_mand:'Added Mandatory',fin_mand:'Finalized Mandatory'};
    var rows=[['Date','Time','User','Action','Detail']];
    (data.actlog||[]).forEach(function(l){
      var d=new Date(l.ts);
      var ds=d.toLocaleDateString('en-GB');
      var ts=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
      rows.push([ds,ts,l.nome||l.u,labels[l.action]||l.action,l.detail||'']);
    });
    _dlBlob(_toCSV(rows),'tb-aviation-activitylog-all-'+_todayStr()+'.csv','text/csv;charset=utf-8');
    _showToast('✅ Activity log CSV downloaded!','ok');
  });
}

function exportActiveCSV(){
  var now=new Date().toLocaleString('en-GB');
  var rows=[];
  rows.push(['TB Aviation — Flight Inspection System']);
  rows.push(['Active Checklists Export']);
  rows.push(['Generated:',now]);
  rows.push([]);

  var flightRows=[],vtRows=[],mandRows=[];

  AVS.forEach(function(av,i){
    var ac=0,re=0,na=0,np=0,pend=0,total=0;
    av.cl.forEach(function(s){s.items.forEach(function(it){
      total++;
      if(it.st==='ac')ac++;else if(it.st==='re')re++;
      else if(it.st==='na')na++;else if(it.st==='np')np++;
      else pend++;
    });});
    flightRows.push([i+1,av.mat||'',av.mod||'',av.serie||'',av.resp||'',av.dc||'',
                     (total-pend)+'/'+total+' answered',ac,re,na,np,pend]);
  });

  if(typeof AVSVTIVTE!=='undefined'){
    AVSVTIVTE.forEach(function(av,i){
      var ok=0,na=0,ft=0,df=0,pend=0,total=0;
      function tallyVt(st){
        total++;
        if(st==='ok'||st==='aero')ok++;else if(st==='na')na++;
        else if(st==='ft')ft++;else if(st==='df'||st==='naoaero')df++;
        else pend++;
      }
      av.cl.forEach(function(s){s.items.forEach(function(it){
        if(Array.isArray(it.st))it.st.forEach(tallyVt);else tallyVt(it.st);
      });});
      vtRows.push([i+1,av.mat||'',av.type||'VTI/VTE',av.mod||'',av.serie||'',av.resp||'',av.dc||'',
                   (ok+na+ft+df)+'/'+total+' answered',ok,na,ft,df,pend]);
    });
  }

  MAND.forEach(function(md,i){
    var ok=0,na=0,pend=0,total=0;
    md.mand.forEach(function(s){s.items.forEach(function(it){
      total++;
      if(it.st==='ok')ok++;else if(it.st==='na')na++;else pend++;
    });});
    mandRows.push([i+1,md.mat||'',md.mod||'',md.serie||'',md.resp||'',md.dc||'',
                   (ok+na)+'/'+total+' answered',ok,na,pend]);
  });

  rows.push(['=== FLIGHT INSPECTIONS ('+flightRows.length+') ===']);
  rows.push(['#','Registration','Model','Serial No.','Responsible','Date Added','Progress','AC','R','NAC','N/A','Pending']);
  flightRows.forEach(function(r){rows.push(r);});
  rows.push([]);

  rows.push(['=== VTI/VTE INSPECTIONS ('+vtRows.length+') ===']);
  rows.push(['#','Registration','Type','Model','Serial No.','Responsible','Date Added','Progress','OK','NA','FT','DF','Pending']);
  vtRows.forEach(function(r){rows.push(r);});
  rows.push([]);

  rows.push(['=== MANDATORY DOCUMENTS ('+mandRows.length+') ===']);
  rows.push(['#','Registration','Model','Serial No.','Responsible','Date Added','Progress','OK','N/A','Pending']);
  mandRows.forEach(function(r){rows.push(r);});

  _dlBlob(_toCSV(rows),'tb-aviation-active-'+_todayStr()+'.csv','text/csv;charset=utf-8');
  _showToast('✅ Active checklists CSV downloaded!','ok');
}

function exportLogCSV(){
  var labels={login:'Login',add_flight:'Added Flight',fin_flight:'Finalized Flight',
    add_vtivte:'Added VTI/VTE',fin_vtivte:'Finalized VTI/VTE',
    add_mand:'Added Mandatory',fin_mand:'Finalized Mandatory'};
  var rows=[['Date','Time','User','Action','Detail']];
  ACTLOG.forEach(function(l){
    var d=new Date(l.ts);
    var ds=d.toLocaleDateString('en-GB');
    var ts=d.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
    rows.push([ds,ts,l.nome||l.u,labels[l.action]||l.action,l.detail||'']);
  });
  _dlBlob(_toCSV(rows),'tb-aviation-activitylog-'+_todayStr()+'.csv','text/csv;charset=utf-8');
  _showToast('✅ Activity log CSV downloaded!','ok');
}

// ===== FEEDBACK SYSTEM =====

var _fbCat = 'bug';
var _FB_KEY = 'tb7_feedback_v1';

// ── Telegram notification config ─────────────────────────────────────────
var _TG_CFG_KEY = 'tb7_notif_cfg';

function _loadTgCfg(){
  try{return JSON.parse(localStorage.getItem(_TG_CFG_KEY)||'{}');}catch(e){return {};}
}

function saveTgCfg(){
  var token=(document.getElementById('tg-token')||{}).value||'';
  var chatid=(document.getElementById('tg-chatid')||{}).value||'';
  var enabled=!!(document.getElementById('tg-enabled')&&document.getElementById('tg-enabled').checked);
  localStorage.setItem(_TG_CFG_KEY,JSON.stringify({token:token.trim(),chatid:chatid.trim(),enabled:enabled}));
  _showToast('✅ Notification settings saved!','ok');
}

function sendTelegramNotif(msgText){
  var cfg=_loadTgCfg();
  if(!cfg.enabled||!cfg.token||!cfg.chatid)return;
  fetch('https://api.telegram.org/bot'+cfg.token+'/sendMessage',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:cfg.chatid,text:msgText,parse_mode:'HTML'})
  }).catch(function(){});
}

function testTelegramNotif(){
  var token=(document.getElementById('tg-token')||{}).value||'';
  var chatid=(document.getElementById('tg-chatid')||{}).value||'';
  if(!token||!chatid){alert('Enter the Bot Token and Chat ID first.');return;}
  fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({chat_id:chatid,text:'✅ <b>TD Aviation FI</b>\nTelegram notifications are working!',parse_mode:'HTML'})
  })
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.ok)_showToast('✅ Test message sent to Telegram!','ok');
    else _showToast('❌ '+d.description,'err');
  })
  .catch(function(){_showToast('❌ Could not reach Telegram API.','err');});
}

function fbSelectCat(btn){
  document.querySelectorAll('.fb-cat-btn').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
  _fbCat = btn.getAttribute('data-cat');
}

function abrirFeedback(){
  document.getElementById('fb-text').value='';
  document.querySelectorAll('.fb-cat-btn').forEach(function(b,i){b.classList.toggle('active',i===0);});
  _fbCat='bug';
  document.getElementById('mod-feedback').style.display='flex';
  setTimeout(function(){document.getElementById('fb-text').focus();},50);
}

function submitFeedback(){
  var text=document.getElementById('fb-text').value.trim();
  if(!text){alert('Please write your message before sending.');return;}
  if(!ME){alert('Please log in first.');return;}

  var item={
    id:Date.now(),
    ts:Date.now(),
    u:ME.u,
    nome:ME.nome,
    cat:_fbCat,
    text:text,
    status:'new',
    device:window.innerWidth<768?'mobile':'desktop',
    date:dh()
  };

  // Push to Upstash shared list (LPUSH so newest is first)
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['LPUSH',_FB_KEY,JSON.stringify(item)]])
  })
  .then(function(r){return r.json();})
  .then(function(){
    document.getElementById('mod-feedback').style.display='none';
    _showToast('✅ Feedback sent! Thank you.','ok');
    var catLabels={bug:'🐛 Bug',suggestion:'💡 Suggestion',question:'❓ Question',other:'📝 Other'};
    var catLabel=catLabels[item.cat]||item.cat;
    sendTelegramNotif(
      '📬 <b>New Feedback — TD Aviation FI</b>\n'+
      '👤 <b>'+item.nome+'</b> (@'+item.u+')\n'+
      catLabel+' · '+item.date+'\n\n'+
      item.text
    );
  })
  .catch(function(){
    // Offline fallback: queue locally
    try{
      var q=JSON.parse(localStorage.getItem('tb7_fb_queue')||'[]');
      q.push(item);
      localStorage.setItem('tb7_fb_queue',JSON.stringify(q));
    }catch(e){}
    document.getElementById('mod-feedback').style.display='none';
    _showToast('📴 Saved offline — will send when back online.','ok');
  });
}

// Retry queued feedback when back online
window.addEventListener('online',function(){
  try{
    var q=JSON.parse(localStorage.getItem('tb7_fb_queue')||'[]');
    if(!q.length)return;
    var cmds=q.map(function(item){return['LPUSH',_FB_KEY,JSON.stringify(item)];});
    fetch(_UPSTASH_URL+'/pipeline',{
      method:'POST',
      headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
      body:JSON.stringify(cmds)
    }).then(function(){localStorage.removeItem('tb7_fb_queue');});
  }catch(e){}
});

// Load unread count badge for admin
function fbLoadUnreadBadge(){
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['LRANGE',_FB_KEY,'0','99']])
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var list=res[0]&&res[0].result?res[0].result:[];
    var unread=0;
    list.forEach(function(raw){
      try{var it=JSON.parse(raw);if(it.status==='new')unread++;}catch(e){}
    });
    var badge=document.getElementById('adm-feedback-badge');
    if(badge&&unread>0){badge.style.display='inline-block';badge.textContent=unread>9?'9+':unread;}
    var tabBadge=document.getElementById('adm-feedback-badge');
    if(tabBadge&&unread>0){tabBadge.style.display='inline-block';tabBadge.textContent=unread>9?'9+':String(unread);}
  })
  .catch(function(){});
}

// Mark all as read in Upstash (fetch full list, update status, write back)
function fbMarkAllRead(list){
  var updated=list.map(function(it){
    if(it.status==='new'){it.status='read';}return it;
  });
  // Replace the list: delete key then push all back
  var cmds=[['DEL',_FB_KEY]];
  // Push in reverse so newest stays first
  for(var i=updated.length-1;i>=0;i--){
    cmds.push(['RPUSH',_FB_KEY,JSON.stringify(updated[i])]);
  }
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(cmds)
  }).then(function(){
    var badge=document.getElementById('adm-feedback-badge');
    if(badge){badge.style.display='none';}
  }).catch(function(){});
}

function fbDeleteItem(idx,list){
  if(!confirm('Delete this feedback?'))return;
  list.splice(idx,1);
  var cmds=[['DEL',_FB_KEY]];
  for(var i=list.length-1;i>=0;i--){
    cmds.push(['RPUSH',_FB_KEY,JSON.stringify(list[i])]);
  }
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(cmds)
  }).then(function(){renderAdmFeedback();}).catch(function(){});
}

// Store loaded list globally so delete button can reference it
var _fbLoadedList=[];


function renderAdmFeedback(){
  var el=document.getElementById('adm-feedback-content');
  if(!el)return;
  el.innerHTML='<div id="fb-list-area" style="text-align:center;padding:32px;color:#aaa;">⏳ Loading feedback...</div>';

  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['LRANGE',_FB_KEY,'0','99']])
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var raw=res[0]&&res[0].result?res[0].result:[];
    var list=[];
    raw.forEach(function(s){try{list.push(JSON.parse(s));}catch(e){}});
    _fbLoadedList=list;

    // Mark all as read silently
    var hasNew=list.some(function(it){return it.status==='new';});
    if(hasNew)fbMarkAllRead(list);

    var catLabels={bug:'🐛 Bug',suggestion:'💡 Suggestion',question:'❓ Question',other:'📝 Other'};
    var catColors={bug:'#f44336',suggestion:'#4A90D9',question:'#ff9800',other:'#78909c'};

    var listEl=document.getElementById('fb-list-area');
    if(!listEl)return;

    var h='';

    if(!list.length){
      h='<div style="text-align:center;padding:60px 20px;">';
      h+='<div style="font-size:48px;margin-bottom:12px;">📭</div>';
      h+='<div style="font-size:15px;color:#aaa;">No feedback received yet.</div>';
      h+='</div>';
      listEl.innerHTML=h;
      return;
    }

    h='<div style="margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
    h+='<span style="font-size:14px;font-weight:700;color:#1a2a4a;">'+list.length+' message'+(list.length!==1?'s':'')+'</span>';
    h+='<button onclick="renderAdmFeedback()" style="margin-left:auto;padding:7px 14px;background:#4A90D9;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">↻ Refresh</button>';
    h+='</div>';

    h+='<div style="display:flex;flex-direction:column;gap:10px;">';
    list.forEach(function(it,idx){
      var color=catColors[it.cat]||'#78909c';
      var label=catLabels[it.cat]||it.cat;
      var isNew=it.status==='new';
      h+='<div style="background:white;border-radius:12px;padding:16px 18px;box-shadow:0 2px 8px rgba(0,0,0,0.07);border-left:4px solid '+color+';'+(isNew?'border-top:2px solid '+color+';':'')+'">';
      h+='<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;flex-wrap:wrap;">';
      h+='<span style="font-size:11px;background:'+color+';color:white;padding:2px 9px;border-radius:10px;font-weight:700;flex-shrink:0;">'+label+'</span>';
      if(isNew)h+='<span style="font-size:11px;background:#fff3e0;color:#e65100;border:1px solid #ffcc80;padding:1px 8px;border-radius:10px;font-weight:700;">● NEW</span>';
      h+='<span style="margin-left:auto;font-size:11px;color:#aaa;white-space:nowrap;">'+it.date+'</span>';
      h+='</div>';
      h+='<div style="font-size:13px;font-weight:700;color:#1a2a4a;margin-bottom:6px;">👤 '+it.nome+' <span style="font-weight:400;color:#aaa;font-size:11px;">('+it.u+' · '+(it.device||'?')+')</span></div>';
      h+='<div style="font-size:13px;color:#333;line-height:1.6;background:#f8f9fc;border-radius:8px;padding:10px 12px;margin-bottom:10px;">'+_escHtml(it.text)+'</div>';
      h+='<div style="text-align:right;">';
      h+='<button onclick="fbDeleteItem('+idx+',_fbLoadedList)" style="padding:5px 12px;background:#fff0f0;color:#f44336;border:1px solid #ffcdd2;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">🗑 Delete</button>';
      h+='</div>';
      h+='</div>';
    });
    h+='</div>';

    listEl.innerHTML=h;
  })
  .catch(function(){
    var listEl2=document.getElementById('fb-list-area');
    if(listEl2)listEl2.innerHTML='<div style="text-align:center;padding:32px;color:#f44336;">❌ Could not load feedback. Check your connection.</div>';
  });
}

// =====================================================================
// ===== 👥 USER MANAGEMENT ============================================
// =====================================================================

var _euMode='edit'; // 'add' or 'edit'
var _euTarget='';   // username being edited

function renderAdmUsers(){
  var el=document.getElementById('adm-users-content');
  if(!el)return;
  var all=getAllUsers();
  var baseUsernames=USERS.map(function(u){return u.u;});
  var roleColors={adm:'#7b1fa2',dev:'#e65100',user:'#43a047'};
  var roleLabels={adm:'Admin',dev:'Dev','user':'User'};

  var h='<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">';
  h+='<h3 style="margin:0;color:#1a2a4a;font-size:16px;font-weight:800;">👥 User Management</h3>';
  h+='<span style="font-size:12px;color:#aaa;">'+all.length+' accounts</span>';
  h+='<button onclick="openAddUser()" style="margin-left:auto;padding:9px 18px;background:#1a2a4a;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;">+ Add User</button>';
  h+='</div>';

  h+='<div style="display:grid;gap:10px;">';
  all.forEach(function(usr){
    var isBase=baseUsernames.indexOf(usr.u)>-1;
    var _rawPwd=USERS_PWD_OVERRIDES[usr.u]||usr.p;
    var effPwd=(_rawPwd&&_rawPwd.slice(0,4)==='b64:')?atob(_rawPwd.slice(4)):_rawPwd;
    var initials=usr.nome?usr.nome.split(' ').slice(0,2).map(function(w){return w[0];}).join('').toUpperCase():'?';
    var roleColor=roleColors[usr.role]||'#666';
    var roleLabel=roleLabels[usr.role]||usr.role;
    var pwdChanged=!!USERS_PWD_OVERRIDES[usr.u];
    h+='<div style="background:white;border-radius:12px;padding:14px 18px;box-shadow:0 2px 8px rgba(0,0,0,0.07);display:flex;align-items:center;gap:14px;flex-wrap:wrap;">';
    h+='<div style="width:44px;height:44px;border-radius:50%;background:'+roleColor+';color:white;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0;">'+initials+'</div>';
    h+='<div style="flex:1;min-width:140px;">';
    h+='<div style="font-size:14px;font-weight:700;color:#1a2a4a;">'+_escHtml(usr.nome)+'</div>';
    h+='<div style="font-size:12px;color:#888;">@'+_escHtml(usr.u)+(usr.email?' · '+_escHtml(usr.email):'')+'</div>';
    h+='</div>';
    h+='<span style="padding:3px 11px;border-radius:10px;font-size:11px;font-weight:800;background:'+roleColor+';color:white;">'+roleLabel+'</span>';
    if(pwdChanged)h+='<span title="Password changed from default" style="padding:3px 9px;border-radius:8px;font-size:10px;font-weight:700;background:#e8f5e9;color:#2e7d32;border:1px solid #a5d6a7;">🔑 Pwd changed</span>';
    if(isBase)h+='<span style="padding:3px 9px;border-radius:8px;font-size:10px;font-weight:700;background:#e8edf4;color:#1a2a4a;">Built-in</span>';
    h+='<div style="display:flex;gap:7px;">';
    h+='<button onclick="openEditUser(\''+_escHtml(usr.u)+'\')" style="padding:6px 14px;background:#e8edf4;color:#1a2a4a;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;">✏️ Edit</button>';
    if(!isBase){
      h+='<button onclick="deleteUser(\''+_escHtml(usr.u)+'\')" style="padding:6px 14px;background:#fff0f0;color:#f44336;border:1px solid #ffcdd2;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;">🗑</button>';
    }
    h+='</div>';
    h+='</div>';
  });
  h+='</div>';
  el.innerHTML=h;
}

function openAddUser(){
  _euMode='add';
  _euTarget='';
  document.getElementById('eu-title').textContent='Add New User';
  document.getElementById('eu-username-row').style.display='';
  document.getElementById('eu-user').value='';
  document.getElementById('eu-user').disabled=false;
  document.getElementById('eu-nome').value='';
  document.getElementById('eu-email').value='';
  document.getElementById('eu-pass').value='';
  document.getElementById('eu-pass-label').textContent='Password *';
  document.getElementById('eu-role').value='user';
  document.getElementById('eu-role-row').style.display='';
  document.getElementById('eu-msg').textContent='';
  document.getElementById('mod-edit-user').style.display='flex';
}

function openEditUser(username){
  var all=getAllUsers();
  var usr=null;
  for(var i=0;i<all.length;i++){if(all[i].u===username){usr=all[i];break;}}
  if(!usr)return;
  var isBase=USERS.some(function(u){return u.u===username;});
  _euMode='edit';
  _euTarget=username;
  document.getElementById('eu-title').textContent='Edit User';
  document.getElementById('eu-username-row').style.display='none';
  document.getElementById('eu-nome').value=usr.nome||'';
  document.getElementById('eu-email').value=usr.email||'';
  document.getElementById('eu-pass').value='';
  document.getElementById('eu-pass-label').textContent='New Password (leave blank to keep current)';
  document.getElementById('eu-role').value=usr.role||'user';
  document.getElementById('eu-role-row').style.display=isBase?'none':'';
  document.getElementById('eu-msg').textContent='';
  document.getElementById('mod-edit-user').style.display='flex';
}

function saveEditUser(){
  var msg=document.getElementById('eu-msg');
  var nome=document.getElementById('eu-nome').value.trim();
  var email=document.getElementById('eu-email').value.trim();
  var pass=document.getElementById('eu-pass').value.trim();
  var role=document.getElementById('eu-role').value;

  if(!nome){msg.style.color='#e65100';msg.textContent='Name is required.';return;}

  if(_euMode==='add'){
    var username=document.getElementById('eu-user').value.trim().toLowerCase();
    if(!username){msg.style.color='#e65100';msg.textContent='Username is required.';return;}
    if(!pass){msg.style.color='#e65100';msg.textContent='Password is required.';return;}
    var all=getAllUsers();
    if(all.some(function(u){return u.u===username;})){msg.style.color='#e65100';msg.textContent='Username already taken.';return;}
    USERS_EXTRA.push({u:username,p:pass,nome:nome,email:email,role:role,hint:'Created by admin'});
    svUsers();
    _svAdminDataCloud();
    msg.style.color='#2e7d32';msg.textContent='✅ User created!';
    setTimeout(function(){document.getElementById('mod-edit-user').style.display='none';renderAdmUsers();},1200);
    return;
  }

  // Edit mode
  var isBase=USERS.some(function(u){return u.u===_euTarget;});
  if(isBase){
    // Update in-memory USERS array immediately so display refreshes
    for(var bi=0;bi<USERS.length;bi++){
      if(USERS[bi].u===_euTarget){USERS[bi].nome=nome;USERS[bi].email=email;break;}
    }
    // Password override (encode before storing)
    if(pass)USERS_PWD_OVERRIDES[_euTarget]=_encPw(pass);
    svUserPwd();
    // Persist name/email overrides for page reloads
    var baseOverrides={};
    try{baseOverrides=JSON.parse(localStorage.getItem('tb7_uinfo')||'{}');}catch(e){}
    baseOverrides[_euTarget]={nome:nome,email:email};
    try{localStorage.setItem('tb7_uinfo',JSON.stringify(baseOverrides));}catch(e){}
    _svAdminDataCloud();
  } else {
    var idx=-1;
    for(var ei=0;ei<USERS_EXTRA.length;ei++){if(USERS_EXTRA[ei].u===_euTarget){idx=ei;break;}}
    if(idx===-1){msg.style.color='#e65100';msg.textContent='User not found.';return;}
    USERS_EXTRA[idx].nome=nome;
    USERS_EXTRA[idx].email=email;
    USERS_EXTRA[idx].role=role;
    if(pass)USERS_EXTRA[idx].p=pass;
    svUsers();
    _svAdminDataCloud();
  }
  msg.style.color='#2e7d32';msg.textContent='✅ Saved!';
  setTimeout(function(){document.getElementById('mod-edit-user').style.display='none';renderAdmUsers();},1200);
}

function deleteUser(username){
  if(!confirm('Delete user @'+username+'? This cannot be undone.'))return;
  var idx=-1;
  for(var i=0;i<USERS_EXTRA.length;i++){if(USERS_EXTRA[i].u===username){idx=i;break;}}
  if(idx===-1){alert('Cannot delete a built-in user.');return;}
  USERS_EXTRA.splice(idx,1);
  svUsers();
  _svAdminDataCloud();
  renderAdmUsers();
}

// =====================================================================
// ===== 📅 DOCUMENT EXPIRY & ALERTS ===================================
// =====================================================================

var DOCS=[];
try{DOCS=JSON.parse(localStorage.getItem('tb7_docs')||'[]');}catch(e){DOCS=[];}
function svDocs(){try{localStorage.setItem('tb7_docs',JSON.stringify(DOCS));}catch(e){}}

// ===== ✈️ AIRCRAFT IMAGES =====
var ACIMGS={};
try{ACIMGS=JSON.parse(localStorage.getItem('tb7_acimg')||'{}');}catch(e){}
function svAcImgs(){try{localStorage.setItem('tb7_acimg',JSON.stringify(ACIMGS));}catch(e){}}

function _doUploadAcImg(model,inputEl,afterFn){
  var file=inputEl.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    var img=new Image();
    img.onload=function(){
      var canvas=document.createElement('canvas');
      var MAX_W=900,MAX_H=560,w=img.width,h=img.height;
      if(w>MAX_W){h=Math.round(h*MAX_W/w);w=MAX_W;}
      if(h>MAX_H){w=Math.round(w*MAX_H/h);h=MAX_H;}
      canvas.width=w;canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      ACIMGS[model]=canvas.toDataURL('image/jpeg',0.85);
      svAcImgs();
      afterFn();
    };
    img.src=ev.target.result;
  };
  reader.readAsDataURL(file);
}

function uploadAcImg(model,inputEl){
  _doUploadAcImg(model,inputEl,renderAdmChecklists);
}

function uploadAcImgTpl(model,inputEl){
  _doUploadAcImg(model,inputEl,renderAdmTemplates);
}

function removeAcImg(model){
  if(!confirm('Remove image for '+model+'?'))return;
  delete ACIMGS[model];
  svAcImgs();
  renderAdmChecklists();
}

function removeAcImgTpl(model){
  if(!confirm('Remove image for '+model+'?'))return;
  delete ACIMGS[model];
  svAcImgs();
  renderAdmTemplates();
}

// =====================================================================
// ===== 🛩️ AIRCRAFT PHOTOS (by registration) ==========================
// =====================================================================

var _REG_IMGS_KEY = 'tb7_reg_imgs';
var REG_IMGS = {};
try{REG_IMGS=JSON.parse(localStorage.getItem(_REG_IMGS_KEY)||'{}');}catch(e){}
function svRegImgs(){try{localStorage.setItem(_REG_IMGS_KEY,JSON.stringify(REG_IMGS));}catch(e){}}

// ── Cloud sync helpers (Upstash) ─────────────────────────────────────────
function _regCloudKey(reg){ return 'tb7_rimg_'+reg.replace(/-/g,'_'); }

function _svRegImgCloud(reg, data){
  var cmd = data ? [['SET',_regCloudKey(reg),data]] : [['DEL',_regCloudKey(reg)]];
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(cmd)
  }).catch(function(){});
}

function _loadRegImgsFromCloud(cb){
  var cmds=_AC_REGS.map(function(r){return['GET',_regCloudKey(r)];});
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(cmds)
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var changed=false;
    res.forEach(function(item,i){
      var data=item&&item.result?item.result:'';
      if(data&&data.length>10){REG_IMGS[_AC_REGS[i]]=data;changed=true;}
    });
    if(changed)svRegImgs();
    if(cb)cb();
  })
  .catch(function(){if(cb)cb();});
}
var _AC_REGS = [
  'PP-JDB','PP-JMJ','PP-NRN',
  'PR-EOB','PR-JAQ','PR-JGG','PR-RCF',
  'PS-BYO','PS-CGM','PS-FRN','PS-INJ','PS-MNC','PS-PHE','PS-RAR','PS-TJM','PS-VJZ','PS-WRA',
  'PT-LBM','PT-TJS'
];

// ── Admin shared data: extra users, password overrides, name/email overrides ──
function _svAdminDataCloud(){
  var uinfo={};
  try{uinfo=JSON.parse(localStorage.getItem('tb7_uinfo')||'{}');}catch(e){}
  var data={
    users_extra:USERS_EXTRA,
    pwd_overrides:USERS_PWD_OVERRIDES,
    uinfo:uinfo,
    updated:new Date().toISOString()
  };
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['SET','tb7_admin_data',JSON.stringify(data)]])
  }).catch(function(){});
}

function _loadAdminDataFromCloud(cb){
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['GET','tb7_admin_data']])
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var raw=res[0]&&res[0].result?res[0].result:'';
    if(raw){
      var data=JSON.parse(raw);
      // Merge extra users (cloud wins)
      if(data.users_extra&&Array.isArray(data.users_extra)){
        data.users_extra.forEach(function(cu){
          var found=false;
          for(var i=0;i<USERS_EXTRA.length;i++){
            if(USERS_EXTRA[i].u===cu.u){USERS_EXTRA[i]=cu;found=true;break;}
          }
          if(!found)USERS_EXTRA.push(cu);
        });
        try{localStorage.setItem('tb7users',JSON.stringify(USERS_EXTRA));}catch(e){}
      }
      // Merge password overrides
      if(data.pwd_overrides&&typeof data.pwd_overrides==='object'){
        var k;for(k in data.pwd_overrides){if(data.pwd_overrides.hasOwnProperty(k))USERS_PWD_OVERRIDES[k]=data.pwd_overrides[k];}
        try{localStorage.setItem('tb7_upwd',JSON.stringify(USERS_PWD_OVERRIDES));}catch(e){}
      }
      // Merge name/email overrides and apply to in-memory USERS
      if(data.uinfo&&typeof data.uinfo==='object'){
        var localUinfo={};
        try{localUinfo=JSON.parse(localStorage.getItem('tb7_uinfo')||'{}');}catch(e){}
        var uk;for(uk in data.uinfo){if(data.uinfo.hasOwnProperty(uk))localUinfo[uk]=data.uinfo[uk];}
        try{localStorage.setItem('tb7_uinfo',JSON.stringify(localUinfo));}catch(e){}
        USERS.forEach(function(u){
          if(localUinfo[u.u]){
            if(localUinfo[u.u].nome)u.nome=localUinfo[u.u].nome;
            if(localUinfo[u.u].email)u.email=localUinfo[u.u].email;
          }
        });
      }
      console.log('✅ Admin data loaded from cloud');
    }
    if(cb)cb();
  })
  .catch(function(){if(cb)cb();});
}

// ── Load all users' checklist data from cloud (for admin multi-user views) ──
var _admAllData = null; // cached merged data from all users
var _admAllDataTs = 0;  // timestamp of last fetch

function _loadAllUsersDataFromCloud(cb) {
  // Use cache if data was fetched within the last 2 minutes
  if(_admAllData && (Date.now()-_admAllDataTs)<120000){if(cb)cb(_admAllData);return;}
  var users = getAllUsers();
  // Build pipeline: main key + photo key per user + actlog
  var pipeline = [];
  users.forEach(function(u){ pipeline.push(['GET','tb7_'+u.u]); });
  pipeline.push(['LRANGE','tb7_actlog_v1','0','499']);
  users.forEach(function(u){ pipeline.push(['GET','tb7_'+u.u+'_fp']); });

  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(pipeline)
  })
  .then(function(r){return r.json();})
  .then(function(res){
    var merged={avs:[],fins:[],vtivte:[],finsvtivte:[],mand:[],actlog:[]};
    // res[0..N-1] = user main data
    for(var i=0;i<users.length;i++){
      var raw=res[i]&&res[i].result?res[i].result:'';
      if(!raw)continue;
      var data;try{data=JSON.parse(raw);}catch(e){continue;}
      var fu=users[i].u;
      if(data.avs)merged.avs=merged.avs.concat(data.avs);
      if(data.fins){data.fins.forEach(function(f){f._owner=fu;});merged.fins=merged.fins.concat(data.fins);}
      if(data.vtivte)merged.vtivte=merged.vtivte.concat(data.vtivte);
      if(data.vtivte_fins){data.vtivte_fins.forEach(function(f){f._owner=users[i].u;});merged.finsvtivte=merged.finsvtivte.concat(data.vtivte_fins);}
      if(data.mand){
        var mandTagged=data.mand.map(function(m){var mc=Object.assign({},m);mc._owner=fu;return mc;});
        var userFins=(data.fins||[]).filter(function(f){return f.type==='mandatory';});
        var activeMand=mandTagged.filter(function(m){
          return !userFins.some(function(f){return f.mat===m.mat&&f.mod===m.mod&&(f.serie||'')===(m.serie||'');});
        });
        merged.mand=merged.mand.concat(activeMand);
      }
    }
    // res[N] = actlog
    var logItems=res[users.length]&&Array.isArray(res[users.length].result)?res[users.length].result:[];
    logItems.forEach(function(s){try{merged.actlog.push(JSON.parse(s));}catch(e){}});
    ACTLOG.forEach(function(l){
      if(!merged.actlog.some(function(m){return m.ts===l.ts&&m.u===l.u;}))merged.actlog.push(l);
    });
    merged.actlog.sort(function(a,b){return b.ts-a.ts;});
    // res[N+1..2N] = photo keys — merge into fins and finsvtivte
    var photoOffset=users.length+1;
    for(var pi=0;pi<users.length;pi++){
      var phRaw=res[photoOffset+pi]&&res[photoOffset+pi].result?res[photoOffset+pi].result:'';
      if(!phRaw)continue;
      var photoMap;try{photoMap=JSON.parse(phRaw);}catch(e){continue;}
      var allFins=merged.fins.concat(merged.finsvtivte);
      allFins.forEach(function(r){
        var photos=photoMap[String(r.id)];
        if(!photos||!photos.length)return;
        var secs=r.cl||r.mand||[];
        photos.forEach(function(p){
          var sec=secs[p.s];if(!sec)return;
          var it=(sec.items||[])[p.i];if(!it)return;
          if(!it.fotos)it.fotos=[];
          if(!it.fotos[p.fp]||!it.fotos[p.fp].d||it.fotos[p.fp].d.length<100){
            it.fotos[p.fp]={d:p.d,by:p.by,dt:p.dt};
          }
        });
      });
    }
    _admAllData=merged;
    _admAllDataTs=Date.now();
    if(cb)cb(merged);
  })
  .catch(function(){
    // Fallback to local data — tag _owner so admin buttons still appear
    var myU=window.ME?window.ME.u:'';
    var localFins=FINS.slice();
    if(myU)localFins.forEach(function(f){if(!f._owner)f._owner=myU;});
    _admAllData={
      avs:AVS.slice(),fins:localFins,
      vtivte:(typeof AVSVTIVTE!=='undefined'?AVSVTIVTE.slice():[]),
      finsvtivte:(typeof FINSVTIVTE!=='undefined'?FINSVTIVTE.slice():[]),
      mand:MAND.slice(),actlog:ACTLOG.slice()
    };
    if(cb)cb(_admAllData);
  });
}

function uploadRegImg(reg, inputEl){
  var file = inputEl.files[0]; if(!file) return;
  var isPng = file.type === 'image/png' || (file.name||'').toLowerCase().endsWith('.png');
  var reader = new FileReader();
  reader.onload = function(ev){
    var img = new Image();
    img.onload = function(){
      var canvas = document.createElement('canvas');
      var MAX_W=1200, MAX_H=800, w=img.width, h=img.height;
      if(w>MAX_W){h=Math.round(h*MAX_W/w);w=MAX_W;}
      if(h>MAX_H){w=Math.round(w*MAX_H/h);h=MAX_H;}
      canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      REG_IMGS[reg] = isPng
        ? canvas.toDataURL('image/png')
        : canvas.toDataURL('image/jpeg', 0.88);
      svRegImgs();
      _svRegImgCloud(reg, REG_IMGS[reg]);
      renderAdmPhotos();
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function removeRegImg(reg){
  if(!confirm('Remove photo for '+reg+'?'))return;
  delete REG_IMGS[reg];
  svRegImgs();
  _svRegImgCloud(reg,'');
  renderAdmPhotos();
}

function renderAdmPhotos(){
  var el = document.getElementById('adm-photos-content');
  if(!el) return;
  el.innerHTML='<div style="text-align:center;padding:32px;color:#aaa;">⏳ Loading photos from cloud...</div>';
  _loadRegImgsFromCloud(function(){ _renderAdmPhotosGrid(el); });
}

function _renderAdmPhotosGrid(el){
  var withPhoto  = _AC_REGS.filter(function(r){return !!REG_IMGS[r];});
  var noPhoto    = _AC_REGS.filter(function(r){return !REG_IMGS[r];});

  var h = '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">';
  h += '<h3 style="margin:0;color:#1a2a4a;font-size:16px;font-weight:800;">🛩️ Aircraft Photos</h3>';
  h += '<span style="font-size:12px;color:#aaa;">'+withPhoto.length+' / '+_AC_REGS.length+' with photo</span>';
  h += '<span style="font-size:11px;color:#888;margin-left:4px;">Supports PNG & JPEG</span>';
  h += '</div>';

  function grid(regs){
    var g = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px;margin-bottom:28px;">';
    regs.forEach(function(reg){
      var img = REG_IMGS[reg]||'';
      var safeReg = reg.replace(/'/g,"\\'");
      var hasPng = img.indexOf('data:image/png')===0;
      var fmt = hasPng ? 'PNG' : (img?'JPEG':'');
      g += '<div style="background:white;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.09);border:1.5px solid '+(img?'#4A90D9':'#e0e7ef')+';display:flex;flex-direction:column;">';
      // Image area
      g += '<div style="width:100%;height:120px;background:#f0f4f8;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;">';
      if(img){
        g += '<img src="'+img+'" style="width:100%;height:100%;object-fit:cover;" alt="'+reg+'">';
        if(fmt) g += '<span style="position:absolute;bottom:5px;left:6px;background:rgba(0,0,0,0.5);color:white;font-size:9px;font-weight:700;padding:1px 5px;border-radius:4px;">'+fmt+'</span>';
        g += '<button onclick="removeRegImg(\''+safeReg+'\')" title="Remove" style="position:absolute;top:5px;right:5px;background:rgba(0,0,0,0.55);color:white;border:none;border-radius:50%;width:24px;height:24px;font-size:12px;cursor:pointer;line-height:24px;text-align:center;padding:0;">✕</button>';
      } else {
        g += '<div style="text-align:center;"><div style="font-size:34px;opacity:0.2;">✈️</div><div style="font-size:10px;color:#ccc;margin-top:4px;">No photo</div></div>';
      }
      g += '</div>';
      // Label + upload
      g += '<div style="padding:10px 11px;">';
      g += '<div style="font-size:13px;font-weight:800;color:#1a2a4a;margin-bottom:7px;letter-spacing:0.5px;">'+reg+'</div>';
      g += '<label style="display:block;width:100%;padding:7px 0;background:'+(img?'#e8edf4':'#1a2a4a')+';color:'+(img?'#1a2a4a':'white')+';border-radius:8px;font-size:12px;font-weight:700;text-align:center;cursor:pointer;box-sizing:border-box;">';
      g += img ? '🔄 Change' : '📷 Upload';
      g += '<input type="file" accept="image/*" style="display:none;" onchange="uploadRegImg(\''+safeReg+'\',this)">';
      g += '</label>';
      g += '</div>';
      g += '</div>';
    });
    g += '</div>';
    return g;
  }

  if(withPhoto.length){
    h += '<div style="font-size:13px;font-weight:700;color:#1a2a4a;margin-bottom:10px;padding-bottom:5px;border-bottom:2px solid #e0e7ef;">✅ With Photo ('+withPhoto.length+')</div>';
    h += grid(withPhoto);
  }

  h += '<div style="font-size:13px;font-weight:700;color:#1a2a4a;margin-bottom:10px;padding-bottom:5px;border-bottom:2px solid #e0e7ef;">📭 No Photo Yet ('+noPhoto.length+')</div>';
  if(noPhoto.length){
    h += grid(noPhoto);
  } else {
    h += '<div style="text-align:center;padding:24px;color:#aaa;font-size:13px;">All aircraft have photos! 🎉</div>';
  }

  el.innerHTML = h;
}

var _docEditIdx=-1;

function _daysUntil(expiryStr){
  if(!expiryStr)return null;
  var d=new Date(expiryStr);d.setHours(23,59,59,0);
  return Math.ceil((d-new Date())/(1000*60*60*24));
}

function _docStatus(days){
  if(days===null)return{label:'No date',color:'#aaa',bg:'#f5f5f5',sev:0};
  if(days<0)return{label:'EXPIRED '+Math.abs(days)+'d ago',color:'#fff',bg:'#f44336',sev:4};
  if(days===0)return{label:'Expires today!',color:'#fff',bg:'#f44336',sev:4};
  if(days<=7)return{label:days+'d left',color:'#fff',bg:'#ff5722',sev:3};
  if(days<=30)return{label:days+'d left',color:'#fff',bg:'#ff9800',sev:2};
  if(days<=90)return{label:days+'d left',color:'#333',bg:'#fff9c4',sev:1};
  return{label:days+'d left',color:'#fff',bg:'#43a047',sev:0};
}

function checkExpiryAlerts(){
  var banner=document.getElementById('expiry-banner');
  var bannerText=document.getElementById('expiry-banner-text');
  if(!banner||!bannerText)return;
  var expired=0,critical=0,warning=0;
  DOCS.forEach(function(d){
    var days=_daysUntil(d.expiry);
    if(days===null)return;
    if(days<0)expired++;
    else if(days<=7)critical++;
    else if(days<=30)warning++;
  });
  var total=expired+critical+warning;
  if(!total){banner.style.display='none';return;}
  var parts=[];
  if(expired)parts.push(expired+' expired');
  if(critical)parts.push(critical+' critical (≤7 days)');
  if(warning)parts.push(warning+' expiring soon (≤30 days)');
  bannerText.textContent=total+' document'+(total>1?'s':'')+' need attention: '+parts.join(', ')+'.';
  banner.style.display='flex';
}

function renderAdmDocs(){
  var el=document.getElementById('adm-docs-content');
  if(!el)return;

  // Sort by severity (expired/critical first)
  var sorted=DOCS.map(function(d,i){return{d:d,i:i,days:_daysUntil(d.expiry)};})
    .sort(function(a,b){
      var sa=_docStatus(a.days).sev;var sb=_docStatus(b.days).sev;
      if(sb!==sa)return sb-sa;
      if(a.days===null)return 1;if(b.days===null)return -1;
      return a.days-b.days;
    });

  var h='<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap;">';
  h+='<h3 style="margin:0;color:#1a2a4a;font-size:16px;font-weight:800;">📅 Document Expiry Tracker</h3>';
  h+='<span style="font-size:12px;color:#aaa;">'+DOCS.length+' documents</span>';
  h+='<button onclick="openAddDoc()" style="margin-left:auto;padding:9px 18px;background:#1a2a4a;color:white;border:none;border-radius:8px;cursor:pointer;font-weight:700;font-size:13px;">+ Add Document</button>';
  h+='</div>';

  if(!DOCS.length){
    h+='<div style="text-align:center;padding:60px 20px;"><div style="font-size:48px;margin-bottom:12px;">📄</div>';
    h+='<div style="font-size:15px;color:#aaa;">No documents tracked yet.<br>Add LOAs, certificates and licenses to monitor their expiry.</div></div>';
    el.innerHTML=h;return;
  }

  var typeIcons={LOA:'🛂',Certificate:'📜',License:'🪪',Insurance:'🛡',Report:'📋',Other:'📄'};

  h+='<div style="display:grid;gap:10px;">';
  sorted.forEach(function(item){
    var d=item.d;var oi=item.i;var days=item.days;
    var st=_docStatus(days);
    var icon=typeIcons[d.docType]||'📄';
    var expiryFmt=d.expiry?d.expiry.split('-').reverse().join('/'):'—';
    h+='<div style="background:white;border-radius:12px;padding:14px 18px;box-shadow:0 2px 8px rgba(0,0,0,0.07);border-left:5px solid '+st.bg+';display:flex;align-items:center;gap:14px;flex-wrap:wrap;">';
    h+='<div style="flex:1;min-width:180px;">';
    h+='<div style="font-size:14px;font-weight:700;color:#1a2a4a;">'+icon+' '+_escHtml(d.name)+'</div>';
    h+='<div style="font-size:12px;color:#888;margin-top:3px;">✈️ '+_escHtml(d.aircraft||'—')+' · '+_escHtml(d.docType||'—')+' · Expires: '+expiryFmt+'</div>';
    if(d.notes)h+='<div style="font-size:11px;color:#aaa;margin-top:2px;">'+_escHtml(d.notes)+'</div>';
    h+='</div>';
    h+='<span style="padding:4px 11px;border-radius:10px;font-size:11px;font-weight:800;background:'+st.bg+';color:'+st.color+';white-space:nowrap;">'+st.label+'</span>';
    h+='<div style="display:flex;gap:7px;">';
    h+='<button onclick="openEditDoc('+oi+')" style="padding:6px 14px;background:#e8edf4;color:#1a2a4a;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;">✏️</button>';
    h+='<button onclick="deleteDoc('+oi+')" style="padding:6px 14px;background:#fff0f0;color:#f44336;border:1px solid #ffcdd2;border-radius:7px;cursor:pointer;font-size:12px;font-weight:700;">🗑</button>';
    h+='</div>';
    h+='</div>';
  });
  h+='</div>';
  el.innerHTML=h;
}

function openAddDoc(){
  _docEditIdx=-1;
  document.getElementById('doc-title').textContent='Add Document';
  document.getElementById('doc-aircraft').value='';
  document.getElementById('doc-type').value='LOA';
  document.getElementById('doc-name').value='';
  document.getElementById('doc-expiry').value='';
  document.getElementById('doc-notes').value='';
  document.getElementById('doc-msg').textContent='';
  document.getElementById('mod-add-doc').style.display='flex';
}

function openEditDoc(idx){
  var d=DOCS[idx];if(!d)return;
  _docEditIdx=idx;
  document.getElementById('doc-title').textContent='Edit Document';
  document.getElementById('doc-aircraft').value=d.aircraft||'';
  document.getElementById('doc-type').value=d.docType||'LOA';
  document.getElementById('doc-name').value=d.name||'';
  document.getElementById('doc-expiry').value=d.expiry||'';
  document.getElementById('doc-notes').value=d.notes||'';
  document.getElementById('doc-msg').textContent='';
  document.getElementById('mod-add-doc').style.display='flex';
}

function saveDoc(){
  var msg=document.getElementById('doc-msg');
  var aircraft=document.getElementById('doc-aircraft').value.trim();
  var docType=document.getElementById('doc-type').value;
  var name=document.getElementById('doc-name').value.trim();
  var expiry=document.getElementById('doc-expiry').value;
  var notes=document.getElementById('doc-notes').value.trim();

  if(!aircraft||!name||!expiry){msg.style.color='#e65100';msg.textContent='Aircraft, name and expiry are required.';return;}

  var doc={aircraft:aircraft,docType:docType,name:name,expiry:expiry,notes:notes,updatedAt:Date.now()};
  if(_docEditIdx===-1){
    doc.id=Date.now();
    doc.createdBy=ME?ME.u:'';
    DOCS.push(doc);
  } else {
    doc.id=DOCS[_docEditIdx].id;
    doc.createdBy=DOCS[_docEditIdx].createdBy||'';
    DOCS[_docEditIdx]=doc;
  }
  svDocs();
  checkExpiryAlerts();
  msg.style.color='#2e7d32';msg.textContent='✅ Saved!';
  setTimeout(function(){document.getElementById('mod-add-doc').style.display='none';renderAdmDocs();},1000);
}

function deleteDoc(idx){
  var d=DOCS[idx];
  if(!d||!confirm('Delete "'+d.name+'"?'))return;
  DOCS.splice(idx,1);
  svDocs();
  checkExpiryAlerts();
  renderAdmDocs();
}

// =====================================================================
// ===== 📊 AIRCRAFT HISTORY ===========================================
// =====================================================================

function _renderAdmHistoryData(el, fins, vteFins){
  // Collect all completed inspections
  var all=[];
  (fins||[]).forEach(function(r){
    all.push({
      mat:r.mat,serie:r.serie||'',mod:r.mod||'',df:r.df||'',
      by:r.by||'',res:r.res||'',
      type:r.type==='mandatory'?'mandatory':'flight'
    });
  });
  (vteFins||[]).forEach(function(r){
    all.push({
      mat:r.mat,serie:r.serie||'',mod:r.mod||'',df:r.df||'',
      by:r.by||'',res:r.res||'',
      type:(r.type||'VTI').toLowerCase()
    });
  });

  if(!all.length){
    el.innerHTML='<div style="text-align:center;padding:60px 20px;"><div style="font-size:48px;margin-bottom:12px;">📭</div><div style="font-size:15px;color:#aaa;">No completed inspections yet.</div></div>';
    return;
  }

  // Unique registrations
  var mats=[];
  all.forEach(function(r){if(r.mat&&mats.indexOf(r.mat)===-1)mats.push(r.mat);});
  mats.sort();

  // Determine selected aircraft
  var selEl=document.getElementById('adm-hist-sel');
  var selected=selEl?selEl.value:(mats[0]||'');

  var h='<div style="max-width:680px;">';
  h+='<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap;">';
  h+='<h3 style="margin:0;color:#1a2a4a;font-size:16px;font-weight:800;">📊 Aircraft Inspection History</h3>';
  h+='<button onclick="_admAllData=null;renderAdmHistory()" style="margin-left:auto;padding:5px 14px;background:#e3f2fd;color:#1565c0;border:1px solid #90caf9;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">🔄 Refresh</button>';
  h+='</div>';

  h+='<div style="margin-bottom:20px;">';
  h+='<label style="font-size:12px;font-weight:700;color:#555;display:block;margin-bottom:6px;">Select Aircraft</label>';
  h+='<select id="adm-hist-sel" onchange="renderAdmHistory()" style="padding:10px 14px;border:1.5px solid #dde3ed;border-radius:9px;font-size:14px;background:white;min-width:220px;">';
  mats.forEach(function(m){
    h+='<option value="'+_escHtml(m)+'"'+(m===selected?' selected':'')+'>'+_escHtml(m)+'</option>';
  });
  h+='</select>';
  h+='</div>';

  if(!selected){el.innerHTML=h+'</div>';return;}

  var records=all.filter(function(r){return r.mat===selected;});
  // Sort newest first using df string (format DD/MM/YYYY HH:MM)
  records.sort(function(a,b){
    function parseDF(s){
      if(!s)return 0;
      var p=s.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
      if(!p)return 0;
      return new Date(p[3],p[2]-1,p[1],p[4],p[5]).getTime();
    }
    return parseDF(b.df)-parseDF(a.df);
  });

  var typeLabels={flight:'✈️ Flight',mandatory:'📄 Mandatory',vti:'🔍 VTI',vte:'🔧 VTE'};
  var typeColors={flight:'#1565C0',mandatory:'#e65100',vti:'#6a1b9a',vte:'#00695c'};
  var resLabels={ok:'✓ Acceptable',warn:'⚠ Restrictions',danger:'✗ Not Acceptable'};
  var resColors={ok:'#43a047',warn:'#ff9800',danger:'#f44336'};

  // Mini trend chart (last 10)
  var trend=records.slice(0,10).reverse();
  if(trend.length>1){
    h+='<div style="background:white;border-radius:12px;padding:16px 18px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,0.07);">';
    h+='<div style="font-size:12px;font-weight:700;color:#555;margin-bottom:10px;">Result Trend (last '+trend.length+' inspections, oldest → newest)</div>';
    h+='<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">';
    trend.forEach(function(r,i){
      var rc=resColors[r.res]||'#aaa';
      var rl=resLabels[r.res]||r.res||'?';
      var tl=typeLabels[r.type]||r.type||'?';
      h+='<div title="'+tl+' · '+r.df+' · '+rl+'" style="width:28px;height:28px;border-radius:50%;background:'+rc+';display:flex;align-items:center;justify-content:center;font-size:13px;cursor:default;" ';
      h+='onmouseover="this.title" >';
      h+=(r.res==='ok'?'✓':r.res==='warn'?'⚠':'✗')+'</div>';
      if(i<trend.length-1)h+='<div style="flex:1;height:2px;background:#e8edf4;min-width:10px;max-width:30px;"></div>';
    });
    h+='</div>';
    h+='</div>';
  }

  // Summary stats
  var okCount=records.filter(function(r){return r.res==='ok';}).length;
  var warnCount=records.filter(function(r){return r.res==='warn';}).length;
  var badCount=records.filter(function(r){return r.res==='danger';}).length;
  h+='<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:16px;">';
  [['✓ Acceptable',okCount,'#43a047'],['⚠ Restrictions',warnCount,'#ff9800'],['✗ Not Acceptable',badCount,'#f44336']].forEach(function(stat){
    h+='<div style="background:white;border-radius:10px;padding:12px 14px;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,0.06);border-top:3px solid '+stat[2]+'">';
    h+='<div style="font-size:20px;font-weight:800;color:'+stat[2]+';">'+stat[1]+'</div>';
    h+='<div style="font-size:11px;color:#888;margin-top:3px;">'+stat[0]+'</div>';
    h+='</div>';
  });
  h+='</div>';

  // Timeline
  h+='<div style="position:relative;">';
  // Vertical line
  h+='<div style="position:absolute;left:20px;top:0;bottom:0;width:2px;background:#e8edf4;"></div>';
  h+='<div style="display:flex;flex-direction:column;gap:12px;">';
  records.forEach(function(r){
    var tc=typeColors[r.type]||'#555';
    var tl=typeLabels[r.type]||r.type||'?';
    var rc=resColors[r.res]||'#aaa';
    var rl=resLabels[r.res]||r.res||'?';
    h+='<div style="display:flex;align-items:flex-start;gap:14px;">';
    // Dot
    h+='<div style="width:40px;height:40px;border-radius:50%;background:'+tc+';border:3px solid white;box-shadow:0 0 0 2px '+tc+';display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;z-index:1;">'+tl.split(' ')[0]+'</div>';
    // Card
    h+='<div style="flex:1;background:white;border-radius:10px;padding:12px 14px;box-shadow:0 2px 6px rgba(0,0,0,0.07);border-left:4px solid '+tc+';">';
    h+='<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px;">';
    h+='<span style="font-size:12px;font-weight:700;color:'+tc+';">'+tl+'</span>';
    h+='<span style="font-size:11px;padding:2px 8px;border-radius:8px;background:'+rc+';color:white;font-weight:700;">'+rl+'</span>';
    h+='<span style="margin-left:auto;font-size:11px;color:#aaa;">'+_escHtml(r.df)+'</span>';
    h+='</div>';
    h+='<div style="font-size:12px;color:#555;">👤 '+_escHtml(r.by||'Unknown')+(r.mod?' · '+_escHtml(r.mod):'')+(r.serie?' · S/N: '+_escHtml(r.serie):'')+'</div>';
    h+='</div>';
    h+='</div>';
  });
  h+='</div></div>';
  h+='</div>';
  el.innerHTML=h;
}

function renderAdmHistory(){
  var el=document.getElementById('adm-history-content');
  if(!el)return;
  if(!_admAllData)el.innerHTML='<div style="text-align:center;padding:40px;color:#aaa;">⏳ Loading all users\' data from cloud...</div>';
  _loadAllUsersDataFromCloud(function(data){_renderAdmHistoryData(el,data.fins,data.finsvtivte);});
}

// =====================================================================
// ===== ADMIN — VTI/VTE-STYLE PREVIEW FOR FLIGHT & MANDATORY ==========
// =====================================================================
// Sandbox only — never touches AVS/MAND. Lets an admin see how the
// compact-table style built for VTI/VTE would look applied to the other
// two checklists before deciding whether to switch them over for real.
var _admDesignType='flight';
var _admDesignModel='';
var _admDesignSt={};
var _admDesignObs={};
var _admDesignExpanded={};
var _admDesignPhotos={};
var _admDesignPhotoKey=null;

var _ADM_DESIGN_STATUS_SETS={
  flight:   [{k:'ac',lbl:'AC', cls:'ok'},{k:'re',lbl:'R',  cls:'ft'},{k:'na',lbl:'NAC',cls:'df'},{k:'np',lbl:'N/A',cls:'na'}],
  mandatory:[{k:'ok',lbl:'OK', cls:'ok'},{k:'na',lbl:'N/A',cls:'na'}]
};

function _admDesignSections(){
  if(_admDesignType==='flight'){
    var models=Object.keys(CL);
    if(!_admDesignModel||!CL[_admDesignModel])_admDesignModel=models[0]||'';
    return CL[_admDesignModel]||[];
  }
  return Object.keys(MAND_TEMPLATE).map(function(cat){return {s:cat,items:MAND_TEMPLATE[cat]};});
}

function _admDesignSetType(t){
  _admDesignType=t;
  _admDesignSt={};_admDesignObs={};_admDesignExpanded={};_admDesignPhotos={};
  renderAdmDesign();
}

function renderAdmDesign(){
  var el=document.getElementById('adm-design-content');
  if(!el)return;
  // Close any open status popover — a full re-render invalidates its stale key/position
  var _stalePop=document.getElementById('adm-design-st-popover');
  if(_stalePop)_stalePop.classList.remove('open');

  var h='<div style="max-width:900px;margin:0 auto;">';
  h+='<div style="background:#fff3e0;border:1px solid #ffcc80;border-radius:10px;padding:12px 16px;margin-bottom:16px;font-size:13px;color:#6d4c00;">';
  h+='🎨 <strong>Prévia de estilo</strong> — mostra o Flight Inspection e o Mandatory Documents no mesmo layout compacto criado para o VTI/VTE (tabela com número, sinopse e status ao lado). É só uma demonstração para você avaliar antes de decidir se aplica esse estilo nas abas de verdade — nada aqui é salvo.';
  h+='</div>';

  h+='<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;align-items:center;">';
  [{k:'flight',l:'✈️ Flight Inspection'},{k:'mandatory',l:'📄 Mandatory Documents'}].forEach(function(t){
    var act=_admDesignType===t.k;
    h+='<button onclick="_admDesignSetType(\''+t.k+'\')" style="padding:8px 16px;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;background:'+(act?'#1a2a4a':'#e8edf4')+';color:'+(act?'white':'#1a2a4a')+';">'+t.l+'</button>';
  });
  if(_admDesignType==='flight'){
    var models=Object.keys(CL);
    h+='<select onchange="_admDesignModel=this.value;_admDesignSt={};_admDesignObs={};_admDesignExpanded={};_admDesignPhotos={};renderAdmDesign()" style="padding:8px 12px;border:1.5px solid #dde3ed;border-radius:8px;font-size:13px;">';
    models.forEach(function(m){h+='<option value="'+_escHtml(m)+'"'+(_admDesignModel===m?' selected':'')+'>'+_escHtml(m)+'</option>';});
    h+='</select>';
  }
  h+='<button onclick="exportAdmDesignPDF()" style="margin-left:auto;padding:8px 14px;background:#43a047;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">📄 Exportar PDF de exemplo</button>';
  h+='<button onclick="_admDesignSt={};_admDesignObs={};_admDesignExpanded={};_admDesignPhotos={};renderAdmDesign()" style="padding:8px 14px;background:#ff7043;color:white;border:none;border-radius:7px;cursor:pointer;font-size:12px;font-weight:600;">↺ Limpar demo</button>';
  h+='</div>';

  var sections=_admDesignSections();
  var statusOpts=_ADM_DESIGN_STATUS_SETS[_admDesignType];

  sections.forEach(function(sec,si){
    h+='<div class="vti-table">';
    h+='<div class="vti-sec-title">'+_escHtml(sec.s)+'</div>';
    sec.items.forEach(function(rawIt,ii){
      var itN=typeof rawIt==='string'?rawIt:rawIt.n;
      var key=_admDesignType+'-'+si+'-'+ii;
      var st=_admDesignSt[key];
      var optCfg=statusOpts.filter(function(o){return o.k===st;})[0];
      var legLbl=optCfg?optCfg.lbl:'—';
      var legCls=optCfg?optCfg.cls:'';
      var detailId='admdes-det-'+key;
      var expanded=!!_admDesignExpanded[key];
      var obsVal=_escHtml(_admDesignObs[key]||'');
      var fotos=_admDesignPhotos[key]||[];

      var indicators='';
      if(_admDesignObs[key]&&_admDesignObs[key].trim())indicators+='<span class="vti-ind" title="Tem observação">📝</span>';
      if(fotos.length)indicators+='<span class="vti-ind" title="'+fotos.length+' foto(s)">📷'+fotos.length+'</span>';

      h+='<div class="vti-row">';
      h+='<div class="vti-row-main" onclick="_admDesignToggleRow(\''+key+'\',\''+detailId+'\',this)">';
      h+='<span class="vti-expand-icon">'+(expanded?'▾':'▸')+'</span>';
      h+='<span class="vti-num">'+(ii+1)+'.</span>';
      h+='<span class="vti-sinopse">'+_escHtml(itN)+indicators+'</span>';
      h+='<span class="vti-leg'+(legCls?' st-'+legCls:'')+'" tabindex="0" role="button" onclick="event.stopPropagation();_admDesignOpenPopover(\''+key+'\',this)" onkeydown="if(event.key===\'Enter\'||event.key===\' \'){event.preventDefault();event.stopPropagation();_admDesignOpenPopover(\''+key+'\',this);}" title="Toque para escolher o status">'+legLbl+'</span>';
      h+='</div>';
      h+='<div class="vti-row-detail" id="'+detailId+'" style="display:'+(expanded?'block':'none')+';">';
      h+='<textarea rows="2" class="cl-textarea" placeholder="Adicionar observação..." oninput="_admDesignObs[\''+key+'\']=this.value">'+obsVal+'</textarea>';
      h+='<div class="cl-photos-section"><label class="cl-photos-label">Fotos e Evidências</label><div class="cl-photos-grid">';
      fotos.forEach(function(foto,fi){
        h+='<div class="cl-photo-item">';
        h+='<img src="'+foto.d+'" onclick="verImg(\''+foto.d+'\')" class="cl-photo-thumb">';
        h+='<button class="cl-photo-remove" onclick="_admDesignRmFoto(\''+key+'\','+fi+')" title="Remover">✕</button>';
        h+='<span class="cl-photo-info">'+_escHtml((foto.by||'').substring(0,10))+'</span>';
        h+='</div>';
      });
      h+='<button class="cl-photo-add" onclick="_admDesignOpenPhotoModal(\''+key+'\')">📷 Adicionar Foto</button>';
      h+='</div></div>';
      h+='</div>';
      h+='</div>';
    });
    h+='</div>';
  });

  el.innerHTML=h;
}

// ---- status popover (separate instance/state from the real VTI/VTE one) ----
function _admDesignOpenPopover(key,anchorEl){
  var pop=document.getElementById('adm-design-st-popover');
  if(!pop){
    pop=document.createElement('div');
    pop.id='adm-design-st-popover';
    pop.className='vti-status-popover';
    document.body.appendChild(pop);
  }
  var opts=_ADM_DESIGN_STATUS_SETS[_admDesignType];
  var html='';
  opts.forEach(function(o){
    html+='<button class="vti-pop-btn st-'+o.cls+'" onclick="_admDesignPick(\''+key+'\',\''+o.k+'\')">'+o.lbl+'</button>';
  });
  html+='<button class="vti-pop-btn st-clear" onclick="_admDesignPick(\''+key+'\',\'\')" title="Limpar">✕</button>';
  pop.innerHTML=html;
  pop.classList.add('open');

  var r=anchorEl.getBoundingClientRect();
  var popW=pop.offsetWidth||220, popH=pop.offsetHeight||36;
  var left=r.right+8;
  if(left+popW>window.innerWidth-4) left=r.left-popW-8;
  if(left<4) left=Math.max(4,window.innerWidth-popW-4);
  var top=r.top+window.scrollY-(popH/2)+(r.height/2);
  top=Math.max(4+window.scrollY,top);
  pop.style.left=left+'px';
  pop.style.top=top+'px';
}

function _admDesignPick(key,st){
  _admDesignSt[key]=st||undefined;
  var pop=document.getElementById('adm-design-st-popover');
  if(pop)pop.classList.remove('open');
  renderAdmDesign();
}

function _admDesignToggleRow(key,detailId,rowMainEl){
  var el=document.getElementById(detailId);
  if(!el)return;
  var open=el.style.display==='block';
  el.style.display=open?'none':'block';
  _admDesignExpanded[key]=!open;
  var icon=rowMainEl?rowMainEl.querySelector('.vti-expand-icon'):null;
  if(icon)icon.textContent=open?'▸':'▾';
}

document.addEventListener('click',function(e){
  var pop=document.getElementById('adm-design-st-popover');
  if(!pop||!pop.classList.contains('open'))return;
  if(pop.contains(e.target)||e.target.classList.contains('vti-leg'))return;
  pop.classList.remove('open');
});

// ---- photo capture (reuses the shared #mod-foto modal, saves into the demo state only) ----
function _admDesignOpenPhotoModal(key){
  var parts=key.split('-'), si=+parts[1], ii=+parts[2];
  var sec=_admDesignSections()[si];
  var it=sec?sec.items[ii]:null;
  if(!it){alert('❌ Item not found.');return;}
  _admDesignPhotoKey=key;
  _resetFotoModal();
  mostrarBotaoCorreto('admdesign');
  document.getElementById('mod-foto-label').textContent=typeof it==='string'?it:it.n;
  document.getElementById('mod-foto').style.display='flex';
}

function _admDesignSalvarFoto(){
  var prevImg=document.getElementById('prev-img');
  if(!prevImg||!prevImg.src||prevImg.src.length<100){ _showToast('❌ Nenhuma foto selecionada','warn'); return; }
  var key=_admDesignPhotoKey;
  if(!key)return;
  if(!_admDesignPhotos[key])_admDesignPhotos[key]=[];
  _admDesignPhotos[key].push({d:prevImg.src,by:ME?ME.nome:'Unknown',dt:dh()});
  _admDesignPhotoKey=null;
  renderAdmDesign();
  fecharModFoto();
  _showToast('✅ Foto salva (só na prévia)!','ok');
}

function _admDesignRmFoto(key,fi){
  if(!_admDesignPhotos[key])return;
  _admDesignPhotos[key].splice(fi,1);
  renderAdmDesign();
}

// ---- Sample PDF export — reuses the VTI/VTE PDF layout so you can see how
// Flight/Mandatory would look printed in that style (temporarily borrows
// FINSVTIVTE the same way admViewVTIVTEPDF does, then removes it again) ----
function exportAdmDesignPDF(){
  if(typeof exportPDFVTIVTE!=='function'){ _showToast('❌ Exportador de PDF não disponível','error'); return; }
  var sections=_admDesignSections();
  var vtMap=_admDesignType==='flight'?{ac:'ok',re:'ft',na:'df',np:'na'}:{ok:'ok',na:'na'};
  var cl=sections.map(function(sec,si){
    // Mirrors exportMandatoryPDF(): LOA/Optional sections only show items the user actually picked a status for
    var isLoa=_admDesignType==='mandatory'&&sec.s&&(sec.s.indexOf('LOA')>-1||sec.s.indexOf('Optional')>-1);
    var items=sec.items.map(function(rawIt,ii){
      var itN=typeof rawIt==='string'?rawIt:rawIt.n;
      var key=_admDesignType+'-'+si+'-'+ii;
      var rawSt=_admDesignSt[key];
      return {
        n:itN,
        st:vtMap[rawSt]||'--',
        obs:_admDesignObs[key]||'',
        fotos:_admDesignPhotos[key]||[],
        by:rawSt?(ME?ME.nome:'Unknown'):'',
        dt:rawSt?dh():'',
        _picked:!!rawSt
      };
    });
    if(isLoa)items=items.filter(function(it){return it._picked;});
    items.forEach(function(it){delete it._picked;});
    return { s:sec.s, items:items };
  });
  var fakeRec={
    id:Date.now(),
    type:(_admDesignType==='flight'?'Flight Inspection':'Mandatory Documents'),
    mat:'DEMO', mod:_admDesignType==='flight'?_admDesignModel:'—',
    serie:'—', resp:ME?ME.nome:'—',
    dc:dh(), df:dh(), by:ME?ME.nome:'Unknown', res:'ok',
    cl:cl
  };
  if(typeof FINSVTIVTE==='undefined'){ _showToast('❌ Exportador de PDF não disponível','error'); return; }
  FINSVTIVTE.unshift(fakeRec);
  try{ exportPDFVTIVTE(0); } finally { FINSVTIVTE.shift(); }
}

// ===== DEV CHANGES PANEL =====
var _FEATURE_FLAGS={};
try{_FEATURE_FLAGS=JSON.parse(localStorage.getItem('tb7_flags')||'{}');}catch(e){}
function _saveFlags(){try{localStorage.setItem('tb7_flags',JSON.stringify(_FEATURE_FLAGS));}catch(e){}}

// JS error capture
var _DEV_ERRORS=[];
(function(){
  var _onerr=window.onerror;
  window.onerror=function(msg,src,line,col,err){
    _DEV_ERRORS.unshift({ts:Date.now(),msg:String(msg),src:(src||'').split('/').pop(),line:line,col:col});
    if(_DEV_ERRORS.length>50)_DEV_ERRORS=_DEV_ERRORS.slice(0,50);
    var badge=document.getElementById('dev-err-badge');
    if(badge){badge.textContent=_DEV_ERRORS.length;badge.style.display='inline-block';}
    if(_onerr)return _onerr.apply(this,arguments);
  };
  var _onunhandled=window.onunhandledrejection;
  window.onunhandledrejection=function(e){
    _DEV_ERRORS.unshift({ts:Date.now(),msg:'Unhandled promise: '+String(e.reason),src:'promise',line:0,col:0});
    if(_DEV_ERRORS.length>50)_DEV_ERRORS=_DEV_ERRORS.slice(0,50);
    var badge=document.getElementById('dev-err-badge');
    if(badge){badge.textContent=_DEV_ERRORS.length;badge.style.display='inline-block';}
    if(_onunhandled)return _onunhandled.apply(this,arguments);
  };
})();

function _devInjectStyles(){
  if(document.getElementById('dev-panel-styles'))return;
  var st=document.createElement('style');
  st.id='dev-panel-styles';
  st.textContent=[
    '@keyframes devFadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}',
    '@keyframes devPulse{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.18)}50%{box-shadow:0 0 0 8px rgba(255,255,255,0)}}',
    '@keyframes devSpin{to{transform:rotate(360deg)}}',
    '@keyframes devBlink{0%,100%{opacity:1}50%{opacity:0.3}}',
    '@keyframes devSlideIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}',
    '.dev-card{animation:devFadeUp .35s ease both;background:#161616;border-radius:16px;margin-bottom:14px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);box-shadow:0 4px 24px rgba(0,0,0,0.45);}',
    '.dev-card-hdr{display:flex;align-items:center;gap:10px;padding:12px 18px;background:linear-gradient(135deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015));border-bottom:1px solid rgba(255,255,255,0.08);}',
    '.dev-card-icon{width:34px;height:34px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;background:rgba(255,255,255,0.07);color:#e4e4e7;}',
    '.dev-card-body{padding:18px;display:flex;flex-direction:column;gap:14px;}',
    '.dev-label{font-size:11px;font-weight:800;color:#8a8a8f;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px;}',
    '.dev-input{width:100%;padding:9px 12px;background:#1c1c1c;border:1.5px solid #333333;border-radius:8px;color:#e5e5e5;font-size:13px;box-sizing:border-box;outline:none;transition:border-color .2s;}',
    '.dev-input:focus{border-color:#8a8a8f;}',
    '.dev-select{padding:9px 12px;background:#1c1c1c;border:1.5px solid #333333;border-radius:8px;color:#e5e5e5;font-size:13px;outline:none;cursor:pointer;}',
    '.dev-btn{padding:8px 18px;border:none;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:.5px;transition:all .15s;white-space:nowrap;}',
    '.dev-btn-orange{background:#f4f4f5;color:#111111;}',
    '.dev-btn-orange:hover{filter:brightness(.9);transform:translateY(-1px);}',
    '.dev-btn-blue{background:#262626;color:#e4e4e7;border:1px solid #3a3a3a;}',
    '.dev-btn-blue:hover{filter:brightness(1.3);transform:translateY(-1px);}',
    '.dev-btn-red{background:transparent;color:#f4f4f4;border:1.5px solid #7a7a80;}',
    '.dev-btn-red:hover{background:rgba(255,255,255,0.1);transform:translateY(-1px);}',
    '.dev-btn-ghost{background:rgba(255,255,255,0.06);color:#a1a1aa;border:1px solid rgba(255,255,255,0.1);}',
    '.dev-btn-ghost:hover{background:rgba(255,255,255,0.13);}',
    '.dev-divider{border:none;border-top:1px solid rgba(255,255,255,0.08);margin:4px 0;}',
    '.dev-mono{font-family:monospace;font-size:11px;}',
    '.dev-toggle{position:relative;width:44px;height:24px;flex-shrink:0;}',
    '.dev-toggle input{opacity:0;width:0;height:0;position:absolute;}',
    '.dev-toggle-track{position:absolute;inset:0;border-radius:24px;background:#333333;transition:background .25s;cursor:pointer;}',
    '.dev-toggle input:checked+.dev-toggle-track{background:#8a8a8f;}',
    '.dev-toggle-track::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:white;transition:transform .25s;box-shadow:0 1px 4px rgba(0,0,0,.4);}',
    '.dev-toggle input:checked+.dev-toggle-track::after{transform:translateX(20px);}',
    '.dev-err-item{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.16);border-radius:8px;padding:10px 12px;margin-bottom:6px;animation:devSlideIn .2s ease both;}',
    '.dev-tag{display:inline-block;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:800;letter-spacing:.5px;}',
  ].join('');
  document.head.appendChild(st);
}

var _roleLbl={user:'usuário',adm:'admin',dev:'dev'};
function renderAdmChanges(){
  var el=document.getElementById('adm-pg-changes');
  if(!el)return;
  _devInjectStyles();

  var errCnt=_DEV_ERRORS.length;
  var allUsers=getAllUsers();
  var otherUsers=allUsers.filter(function(u){return u.u!==ME.u;});

  var userOpts=allUsers.map(function(u){return'<option value="'+_h(u.u)+'">'+_h(u.nome)+' (@'+_h(u.u)+')</option>';}).join('');
  var otherOpts=otherUsers.map(function(u){return'<option value="'+_h(u.u)+'">'+_h(u.nome)+' — '+(_roleLbl[u.role]||u.role)+'</option>';}).join('');

  var s='<div style="background:#0a0a0a;min-height:100vh;margin:-20px;padding:20px;">';

  // ── Header ───────────────────────────────────────────────────
  var _badgeEl=document.getElementById('app-version-badge');
  var _appVer=_badgeEl?(_badgeEl.textContent||'').replace('TB Aviation ','').trim():'';
  s+='<div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;padding:20px 0 16px;">';
  s+='<div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,#3f3f46,#18181b);border:1px solid #4a4a50;display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 4px 16px rgba(255,255,255,.08);animation:devPulse 3s infinite;">🛠</div>';
  s+='<div>';
  s+='<div style="font-size:20px;font-weight:900;color:#f5f5f5;letter-spacing:-.5px;">Painel Dev</div>';
  s+='<div style="font-size:12px;color:#8a8a8f;">TB Aviation <b style="color:#f4f4f4;">'+_h(_appVer)+'</b> — Logado como <b style="color:#f4f4f4;">@'+_h(ME.u)+'</b></div>';
  s+='</div>';
  if(errCnt)s+='<div style="margin-left:auto;background:#f4f4f4;color:#0a0a0a;border-radius:10px;padding:4px 12px;font-size:12px;font-weight:800;animation:devBlink 1.5s infinite;">⚠ '+errCnt+' erro'+(errCnt>1?'s':'')+'</div>';
  s+='</div>';

  // ── Diagnostics ──────────────────────────────────────────────
  s+=_devCard('🔍','Diagnóstico','#1565c0',0,[
    // Sync
    '<div class="dev-label">Sincronização na Nuvem</div>'+
    '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'+
      '<button class="dev-btn dev-btn-orange" onclick="devForceSync()">☁️ Forçar Sincronização</button>'+
      '<span id="dev-sync-msg" style="font-size:12px;color:#8a8a8f;"></span>'+
    '</div>',
    // Sizes
    '<div class="dev-label">Tamanho dos Dados no Upstash</div>'+
    '<button class="dev-btn dev-btn-blue" onclick="devLoadSizes()">📊 Carregar Tamanhos</button>'+
    '<div id="dev-sizes" style="margin-top:10px;"></div>',
    // LocalStorage
    '<div class="dev-label">Inspetor do localStorage</div>'+
    '<button class="dev-btn dev-btn-blue" onclick="devShowLocalStorage()">🗄 Inspecionar</button>'+
    '<div id="dev-ls" style="margin-top:10px;"></div>',
    // JS Errors
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">'+
      '<div class="dev-label" style="margin:0;">Erros JS</div>'+
      (errCnt?'<span style="background:#f4f4f4;color:#0a0a0a;border-radius:8px;padding:1px 8px;font-size:11px;font-weight:800;">'+errCnt+'</span>':'')+
      '<button class="dev-btn dev-btn-ghost" style="margin-left:auto;padding:4px 10px;" onclick="_DEV_ERRORS=[];renderAdmChanges();">Limpar</button>'+
    '</div>'+
    (errCnt?_DEV_ERRORS.slice(0,8).map(function(e,i){
      return '<div class="dev-err-item" style="animation-delay:'+(i*0.05)+'s">'+
        '<div style="color:#f4f4f4;font-size:12px;font-weight:700;margin-bottom:2px;">'+_h(e.msg)+'</div>'+
        '<div class="dev-mono" style="color:#8a8a8f;">'+_h(e.src)+' · linha '+e.line+'</div>'+
      '</div>';
    }).join(''):'<div style="color:#6b6b70;font-size:12px;padding:8px 0;">✅ Nenhum erro capturado</div>')
  ]);

  // ── Data Management ──────────────────────────────────────────
  s+=_devCard('🗃','Gestão de Dados','#7b1fa2',1,[
    '<div class="dev-label">Redefinir Senha do Usuário</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      '<select id="dev-pwd-user" class="dev-select" style="flex:1;min-width:140px;">'+userOpts+'</select>'+
      '<input id="dev-pwd-new" class="dev-input" type="text" placeholder="Nova senha" style="flex:1;min-width:120px;width:auto;">'+
      '<button class="dev-btn dev-btn-red" onclick="devResetPwd()">🔑 Redefinir</button>'+
    '</div>'+
    '<div id="dev-pwd-msg" style="font-size:12px;margin-top:4px;color:#8a8a8f;"></div>',

    '<hr class="dev-divider">'+
    '<div class="dev-label">Limpar Dados na Nuvem do Usuário</div>'+
    '<div style="font-size:12px;color:#8a8a8f;margin-bottom:8px;">Remove checklists e registros da nuvem — mantém a conta.</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      '<select id="dev-clear-user" class="dev-select" style="flex:1;min-width:140px;">'+userOpts+'</select>'+
      '<button class="dev-btn dev-btn-red" onclick="devClearUserData()">🗑 Limpar</button>'+
    '</div>'+
    '<div id="dev-clear-msg" style="font-size:12px;margin-top:4px;color:#8a8a8f;"></div>',

    '<hr class="dev-divider">'+
    '<div class="dev-label">Ver JSON Bruto</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      '<select id="dev-json-src" class="dev-select" style="flex:1;">'+
        '<option value="avs">Checklists Ativos (AVS)</option>'+
        '<option value="fins">Finalizados (FINS)</option>'+
        '<option value="mand">Mandatory (MAND)</option>'+
        '<option value="vtivte">VTI/VTE Ativos</option>'+
        '<option value="vtivtefins">VTI/VTE Finalizados</option>'+
        '<option value="users">Todos os Usuários</option>'+
        '<option value="flags">Feature Flags</option>'+
      '</select>'+
      '<button class="dev-btn dev-btn-blue" onclick="devShowJSON()">Ver</button>'+
    '</div>'+
    '<div id="dev-json-out" style="margin-top:8px;"></div>'
  ]);

  // ── Activity Log ─────────────────────────────────────────────
  var _logPreview=ACTLOG.slice(0,5).map(function(e,i){
    var actionLabels={login:'🔑 Login',fin_flight:'✅ Flight finalizado',fin_mand:'✅ Mandatory finalizado',
      fin_vtivte:'✅ VTI/VTE finalizado',add_av:'➕ Aeronave adicionada',del_av:'🗑 Aeronave removida',
      add_vtivte:'➕ VTI/VTE adicionado',del_vtivte:'🗑 VTI/VTE removido',pwd_change:'🔑 Senha alterada'};
    var label=actionLabels[e.action]||(e.action||'—');
    var tsStr='';
    try{if(e.ts){var _d=new Date(e.ts);tsStr=_d.toLocaleDateString('pt-BR')+' '+_d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});}}catch(ex){}
    return '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05);animation:devSlideIn .2s ease '+(i*0.05)+'s both;">'+
      '<span style="font-size:11px;min-width:130px;color:#a1a1aa;">'+_h(label)+'</span>'+
      '<span style="flex:1;font-size:11px;color:#d4d4d4;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;">'+_h(e.mat||e.detail||'')+'</span>'+
      '<span style="font-size:10px;color:#6b6b70;white-space:nowrap;">'+_h(tsStr)+'</span>'+
    '</div>';
  }).join('');
  s+=_devCard('📊','Log de Atividade','#0277bd',2,[
    '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;margin-bottom:12px;">'+
      '<div>'+
        '<div style="font-size:28px;font-weight:900;color:#f5f5f5;">'+ACTLOG.length+'</div>'+
        '<div style="font-size:11px;color:#8a8a8f;">registros totais</div>'+
      '</div>'+
      '<button class="dev-btn dev-btn-blue" onclick="devExportLogCSV()">⬇️ Exportar CSV</button>'+
    '</div>'+
    '<div class="dev-label">Últimas entradas</div>'+
    (_logPreview||'<div style="font-size:12px;color:#6b6b70;padding:8px 0;">Nenhum registro ainda.</div>')
  ]);

  // ── Impersonate ──────────────────────────────────────────────
  s+=_devCard('👤','Personificar Usuário','#c62828',3,[
    '<div style="font-size:12px;color:#8a8a8f;margin-bottom:10px;">Veja o app exatamente como outro usuário. Toque em <b style="color:#f4f4f4;">↩ Voltar ao Dev</b> no cabeçalho para retornar.</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      '<select id="dev-imp-user" class="dev-select" style="flex:1;min-width:140px;">'+otherOpts+'</select>'+
      '<button class="dev-btn dev-btn-red" onclick="devImpersonate()">▶ Personificar</button>'+
    '</div>'
  ]);

  // ── Role Quick-Change ────────────────────────────────────────
  s+=_devCard('🎭','Alterar Função Rapidamente','#2e7d32',4,[
    '<div style="font-size:12px;color:#8a8a8f;margin-bottom:10px;">Altere a função de qualquer usuário instantaneamente.</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
      '<select id="dev-role-user" class="dev-select" style="flex:1;min-width:140px;">'+userOpts+'</select>'+
      '<select id="dev-role-new" class="dev-select">'+
        '<option value="user">👤 usuário</option><option value="adm">🔐 admin</option><option value="dev">🛠 dev</option>'+
      '</select>'+
      '<button class="dev-btn dev-btn-blue" onclick="devChangeRole()">Aplicar</button>'+
    '</div>'+
    '<div id="dev-role-msg" style="font-size:12px;margin-top:6px;color:#8a8a8f;"></div>'
  ]);

  // ── Feature Flags & UI Settings (merged) ─────────────────────
  var flags=[
    {k:'dark_mode_default',icon:'🌙',label:'Modo escuro ativado por padrão'},
    {k:'show_pdf_preview',icon:'📄',label:'Pré-visualização de PDF antes de exportar'},
    {k:'mandatory_photos_required',icon:'📷',label:'Exigir fotos nos itens obrigatórios'},
    {k:'show_debug_bar',icon:'🐛',label:'Mostrar barra de depuração no rodapé'}
  ];
  var uiFlags=[
    {k:'ui_compact',icon:'📐',label:'Modo compacto (cartões menores)'},
    {k:'ui_large_text',icon:'🔠',label:'Texto grande (14px → 16px)'},
    {k:'ui_no_animations',icon:'⚡',label:'Desativar animações (mais rápido)'},
    {k:'ui_show_timestamps',icon:'🕐',label:'Mostrar data/hora nos itens do checklist'},
    {k:'ui_confirm_status',icon:'✅',label:'Confirmar antes de mudar o status'},
    {k:'ui_photo_fullwidth',icon:'🖼',label:'Fotos em largura total no checklist'},
    {k:'ui_hide_hints',icon:'💬',label:'Ocultar dicas de ajuda'},
    {k:'ui_sticky_header',icon:'📌',label:'Cabeçalho fixo ao rolar'}
  ];
  var _devFlagRow=function(f,i){
    var on=!!_FEATURE_FLAGS[f.k];
    return '<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06);animation:devSlideIn .2s ease '+(i*0.05)+'s both;">'+
      '<span style="font-size:16px;width:24px;text-align:center;">'+f.icon+'</span>'+
      '<span style="flex:1;font-size:13px;color:#d4d4d4;">'+f.label+'</span>'+
      '<span style="font-size:10px;color:'+(on?'#f4f4f4':'#8a8a8f')+';font-weight:800;margin-right:6px;">'+(on?'LIGADO':'DESLIGADO')+'</span>'+
      '<label class="dev-toggle"><input type="checkbox" '+(on?'checked':'')+' onchange="devToggleFlag(\''+f.k+'\')"><div class="dev-toggle-track"></div></label>'+
    '</div>';
  };
  s+=_devCard('🚩','Feature Flags e Interface','#e65100',5,[
    '<div class="dev-label">Recursos do App</div>'+flags.map(_devFlagRow).join(''),
    '<hr class="dev-divider"><div class="dev-label">Interface / Exibição</div>'+uiFlags.map(_devFlagRow).join('')
  ]);

  // ── PDF Preview ──────────────────────────────────────────────
  // Active flights first (most relevant — "current"), then finalized newest-first
  var activeFlightOpts='';
  for(var _ai=0;_ai<AVS.length;_ai++){
    var _af=AVS[_ai];
    activeFlightOpts+='<option value="avs_'+_ai+'" selected>🟡 ATIVO — '+_h(_af.mat||'?')+' ('+_h(_af.mod||'')+')</option>';
  }
  // Only keep first active pre-selected; clear selected on the rest
  if(AVS.length>1){
    activeFlightOpts=activeFlightOpts.replace(/ selected/g,'');
    activeFlightOpts=activeFlightOpts.replace('value="avs_0"','value="avs_0" selected');
  }
  var flightOpts='';
  for(var _fi=FINS.length-1;_fi>=0;_fi--){
    var _ff=FINS[_fi];
    if(_ff.type==='mandatory')continue;
    flightOpts+='<option value="flight_'+_fi+'">✅ '+_h(_ff.mat||'?')+' — '+(_ff.df||_ff.dc||'')+'</option>';
  }
  var mandOpts='';
  for(var _mi=FINS.length-1;_mi>=0;_mi--){
    var _mf=FINS[_mi];
    if(_mf.type!=='mandatory')continue;
    mandOpts+='<option value="mand_'+_mi+'">📄 '+_h(_mf.mat||'?')+' — '+(_mf.df||_mf.dc||'')+'</option>';
  }
  var _vtArr=(typeof FINSVTIVTE!=='undefined'?FINSVTIVTE:[]);
  var vtOpts='';
  for(var _vi=_vtArr.length-1;_vi>=0;_vi--){
    var _vf=_vtArr[_vi];
    vtOpts+='<option value="vt_'+_vi+'">🔬 '+_h(_vf.mat||'?')+' '+_h(_vf.type||'VTI/VTE')+' — '+(_vf.df||_vf.dc||'')+'</option>';
  }
  var allOpts=(activeFlightOpts||flightOpts||mandOpts||vtOpts)?
    (activeFlightOpts?'<optgroup label="🟡 Em andamento">'+activeFlightOpts+'</optgroup>':'')+
    (flightOpts?'<optgroup label="✅ Flight Finalizados">'+flightOpts+'</optgroup>':'')+
    (mandOpts?'<optgroup label="📄 Mandatory Documents">'+mandOpts+'</optgroup>':'')+
    (vtOpts?'<optgroup label="🔬 VTI/VTE">'+vtOpts+'</optgroup>':''):
    '<option value="">— Nenhum registro ainda —</option>';
  // Aircraft photo for demo (PT-TEST)
  var demoPhotoThumb=REG_IMGS['PT-TEST']?
    '<img src="'+REG_IMGS['PT-TEST']+'" style="width:64px;height:40px;object-fit:cover;border-radius:6px;border:2px solid #6b6b70;vertical-align:middle;margin-left:6px;">':
    '<span style="font-size:11px;color:#8a8a8f;margin-left:6px;">(no photo yet)</span>';

  s+=_devCard('📄','Pré-visualização de PDF','#ad1457',5.5,[
    // ── Existing records ──
    '<div class="dev-label">Pré-visualizar a partir de um registro finalizado existente</div>'+
    '<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">'+
      '<select id="dev-pdf-sel" class="dev-select" style="flex:1;min-width:180px;">'+allOpts+'</select>'+
      '<button class="dev-btn dev-btn-orange" onclick="devPreviewPDF()">👁 Pré-visualizar</button>'+
    '</div>'+
    '<div id="dev-pdf-msg" style="font-size:12px;color:#8a8a8f;margin-top:6px;"></div>',

    // ── Demo PT-TEST ──
    '<hr class="dev-divider">'+
    '<div class="dev-label">Demo PDF — PT-TEST (dados fictícios)</div>'+
    '<div style="background:#1c1c1c;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:12px;">'+
      // Aircraft photo upload
      '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'+
        '<div>'+
          '<div style="font-size:11px;color:#8a8a8f;margin-bottom:4px;font-weight:700;">✈️ Foto do avião (PT-TEST)</div>'+
          '<div style="display:flex;align-items:center;gap:8px;">'+
            '<label class="dev-btn dev-btn-blue" style="cursor:pointer;">'+
              '📷 '+(REG_IMGS['PT-TEST']?'Trocar foto':'Adicionar foto')+
              '<input type="file" accept="image/*" onchange="devSetDemoPhoto(event)" style="display:none;">'+
            '</label>'+
            demoPhotoThumb+
            (REG_IMGS['PT-TEST']?'<button class="dev-btn dev-btn-ghost" onclick="devClearDemoPhoto()" style="padding:4px 10px;font-size:11px;">✕ Remover</button>':'')+
          '</div>'+
          '<div style="font-size:11px;color:#6b6b70;margin-top:4px;">A foto aparece no canto superior direito do PDF.</div>'+
        '</div>'+
      '</div>'+
      // PDF type selector
      '<div>'+
        '<div style="font-size:11px;color:#8a8a8f;margin-bottom:6px;font-weight:700;">Tipo de PDF</div>'+
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">'+
          '<button class="dev-btn dev-btn-orange" onclick="devPreviewDemo(\'flight\')">✈️ Flight Inspection</button>'+
          '<button class="dev-btn dev-btn-blue" onclick="devPreviewDemo(\'mand\')">📄 Mandatory</button>'+
          '<button class="dev-btn dev-btn-blue" onclick="devPreviewDemo(\'vt\')">🔬 VTI/VTE</button>'+
        '</div>'+
      '</div>'+
      '<div id="dev-demo-msg" style="font-size:12px;color:#8a8a8f;"></div>'+
    '</div>'
  ]);
  var cfg=_devGetCfg();
  s+=_devCard('⚙️','Configurações do App','#00838f',6,[
    '<div class="dev-label">Título do App (mostrado no cabeçalho)</div>'+
    '<div style="display:flex;gap:8px;">'+
      '<input id="dev-cfg-title" class="dev-input" value="'+_h(cfg.appTitle||'TB Aviation')+'" placeholder="TB Aviation">'+
      '<button class="dev-btn dev-btn-blue" onclick="devSaveCfg()">Salvar</button>'+
    '</div>',

    '<div class="dev-label">Cor Principal (cabeçalho e botões)</div>'+
    '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">'+
      ['#1a2a4a','#0d47a1','#1b5e20','#4a148c','#bf360c','#37474f'].map(function(c){
        var active=cfg.primaryColor===c;
        return '<div onclick="devSetColor(\''+c+'\')" style="width:32px;height:32px;border-radius:50%;background:'+c+';cursor:pointer;border:'+(active?'3px solid white':'3px solid transparent')+';box-shadow:'+(active?'0 0 0 2px '+c:'none')+';transition:all .2s;"></div>';
      }).join('')+
      '<input id="dev-cfg-color" type="color" value="'+(cfg.primaryColor||'#1a2a4a')+'" onchange="devSetColor(this.value)" style="width:32px;height:32px;border:none;border-radius:50%;cursor:pointer;background:none;padding:0;" title="Cor personalizada">'+
    '</div>',

    '<div class="dev-label">Tempo Limite de Sessão (minutos, 0 = nunca)</div>'+
    '<div style="display:flex;gap:8px;align-items:center;">'+
      '<input id="dev-cfg-timeout" class="dev-input" type="number" min="0" max="480" value="'+(cfg.sessionTimeout||0)+'" style="width:100px;">'+
      '<span style="color:#8a8a8f;font-size:12px;">Atual: '+(cfg.sessionTimeout?cfg.sessionTimeout+' min':'desativado')+'</span>'+
      '<button class="dev-btn dev-btn-blue" onclick="devSaveCfg()">Salvar</button>'+
    '</div>',

    '<div class="dev-label">Mensagem de Boas-vindas do Login</div>'+
    '<div style="display:flex;gap:8px;">'+
      '<input id="dev-cfg-welcome" class="dev-input" value="'+_h(cfg.welcomeMsg||'Flight Inspection System')+'" placeholder="Flight Inspection System">'+
      '<button class="dev-btn dev-btn-blue" onclick="devSaveCfg()">Salvar</button>'+
    '</div>',
    '<div id="dev-cfg-msg" style="font-size:12px;color:#8a8a8f;"></div>'
  ]);

  // ── Module Controls ──────────────────────────────────────────
  var modules=[
    {k:'mod_flight',icon:'✈️',label:'Módulo Flight Inspection',tab:'pg-flight'},
    {k:'mod_mandatory',icon:'📄',label:'Módulo Mandatory Documents',tab:'pg-mand'},
    {k:'mod_vtivte',icon:'🔬',label:'Módulo VTI/VTE',tab:'pg-vtivte'},
    {k:'mod_onedrive',icon:'☁️',label:'Integração com OneDrive'},
    {k:'mod_feedback',icon:'💬',label:'Aba de Feedback no Admin'},
    {k:'mod_history',icon:'📋',label:'Aba de Histórico no Admin'},
    {k:'mod_stats',icon:'📊',label:'Dashboard de Estatísticas no Admin'},
    {k:'mod_export',icon:'📤',label:'Aba de Export no Admin'}
  ];
  var modRows=modules.map(function(m,i){
    var on=_FEATURE_FLAGS[m.k]!==false; // default ON
    return '<div style="display:flex;align-items:center;gap:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.06);animation:devSlideIn .2s ease '+(i*0.05)+'s both;">'+
      '<span style="font-size:16px;width:24px;text-align:center;">'+m.icon+'</span>'+
      '<span style="flex:1;font-size:13px;color:#d4d4d4;">'+m.label+'</span>'+
      '<span style="font-size:10px;color:'+(on?'#f4f4f4':'#8a8a8f')+';font-weight:800;margin-right:6px;">'+(on?'LIGADO':'DESLIGADO')+'</span>'+
      '<label class="dev-toggle"><input type="checkbox" '+(on?'checked':'')+' onchange="devToggleModule(\''+m.k+'\',\''+m.tab+'\',this.checked)"><div class="dev-toggle-track"></div></label>'+
    '</div>';
  }).join('');
  s+=_devCard('🧩','Controle de Módulos','#558b2f',8,[
    '<div style="font-size:12px;color:#8a8a8f;margin-bottom:10px;">Módulos vêm ativados por padrão. Desativar oculta a aba/seção para todos os usuários.</div>',
    modRows
  ]);

  // ── Quick Actions ────────────────────────────────────────────
  s+=_devCard('⚡','Ações Rápidas','#f57f17',9,[
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'+
      _devAction('🔄','Recarregar Página','window.location.reload()','dev-btn-blue')+
      _devAction('🗑','Limpar Todo o localStorage','devClearAllLS()','dev-btn-red')+
      _devAction('📋','Copiar URL do App','devCopyURL()','dev-btn-ghost')+
      _devAction('🔔','Testar Toast OK','_showToast(\'✅ Toast de teste!\',\'ok\')','dev-btn-ghost')+
      _devAction('❌','Testar Toast de Erro','_showToast(\'❌ Erro de teste!\',\'err\')','dev-btn-ghost')+
      _devAction('💥','Disparar Erro JS','null.crash()','dev-btn-red')+
      _devAction('☁️','Recarregar da Nuvem','devReloadCloud()','dev-btn-orange')+
      _devAction('🧹','Redefinir Config do Dev','devResetCfg()','dev-btn-red')+
    '</div>'
  ]);

  s+='</div>';
  el.innerHTML=s;
}

function _devAction(icon,label,onclick,cls){
  return '<button class="dev-btn '+cls+'" onclick="'+onclick+'" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:12px 8px;font-size:11px;border-radius:10px;width:100%;">'+
    '<span style="font-size:20px;">'+icon+'</span>'+label+'</button>';
}

// ── Dev Config (persisted settings) ──────────────────────────
function _devGetCfg(){
  try{return JSON.parse(localStorage.getItem('tb7_devcfg')||'{}');}catch(e){return {};}
}
function _devSaveCfgObj(obj){
  var existing=_devGetCfg();
  var merged=Object.assign({},existing,obj);
  try{localStorage.setItem('tb7_devcfg',JSON.stringify(merged));}catch(e){}
  return merged;
}

function devSaveCfg(){
  var title=document.getElementById('dev-cfg-title');
  var timeout=document.getElementById('dev-cfg-timeout');
  var welcome=document.getElementById('dev-cfg-welcome');
  var msg=document.getElementById('dev-cfg-msg');
  var cfg={};
  if(title)cfg.appTitle=title.value.trim()||'TB Aviation';
  if(timeout)cfg.sessionTimeout=parseInt(timeout.value)||0;
  if(welcome)cfg.welcomeMsg=welcome.value.trim()||'Flight Inspection System';
  _devSaveCfgObj(cfg);
  // Apply live
  var sub=document.querySelector('.login-sub');
  if(sub&&cfg.welcomeMsg)sub.textContent=cfg.welcomeMsg;
  if(msg){msg.style.color='#d4d4d4';msg.textContent='✅ Salvo! Algumas mudanças aplicam no próximo login.';}
  _showToast('✅ Configuração salva','ok');
}
function devSetColor(c){
  _devSaveCfgObj({primaryColor:c});
  // Apply live to header
  var h=document.querySelector('.header,.page-header,[class*="header"]');
  document.querySelectorAll('.btn-green,.btn-blue,.btn-red').forEach(function(){});
  // Simplest live preview: tint the admin tab bar
  var tabBar=document.getElementById('adm-tab-bar');
  if(tabBar)tabBar.style.background=c+'18';
  renderAdmChanges();
  _showToast('✅ Cor salva','ok');
}
function devToggleModule(key,tabId,on){
  _FEATURE_FLAGS[key]=on;
  _saveFlags();
  // Hide/show the nav tab if tabId given
  if(tabId){
    var tabEl=document.getElementById(tabId);
    // nav buttons are typically btn-nav or similar — try to find by onclick
    document.querySelectorAll('[onclick*="'+tabId+'"]').forEach(function(el){
      el.style.display=on?'':'none';
    });
  }
  _showToast((on?'✅ Módulo ativado':'⛔ Módulo desativado'),'ok');
}
function devClearAllLS(){
  if(!confirm('Limpar TODO o localStorage? Isso reseta tudo localmente (os dados na nuvem ficam seguros).'))return;
  localStorage.clear();
  _showToast('✅ localStorage limpo — recarregue para resetar','ok');
}
function devCopyURL(){
  try{navigator.clipboard.writeText(window.location.href).then(function(){_showToast('✅ URL copiada','ok');});}catch(e){_showToast('Falha ao copiar','err');}
}
function devReloadCloud(){
  if(!ME)return;
  if(typeof cloudLoad==='function'){
    cloudLoad(ME.u,function(){render();renderMand();if(typeof renderVTIVTE==='function')renderVTIVTE();});
    _showToast('✅ Recarregado da nuvem','ok');
  }
}
function devResetCfg(){
  if(!confirm('Redefinir toda a config do Dev (cores, título, flags)?'))return;
  localStorage.removeItem('tb7_devcfg');
  localStorage.removeItem('tb7_flags');
  _FEATURE_FLAGS={};
  renderAdmChanges();
  _showToast('✅ Config do Dev redefinida','ok');
}

// ── PDF Preview ───────────────────────────────────────────────
var _devPdfBlob=null;
function devPreviewPDF(){
  var sel=document.getElementById('dev-pdf-sel');
  var msg=document.getElementById('dev-pdf-msg');
  if(!sel)return;
  var val=sel.value;
  if(!val){if(msg)msg.textContent='Nenhum registro selecionado.';return;}
  if(typeof window.jspdf==='undefined'){
    if(msg)msg.textContent='⏳ Carregando biblioteca de PDF...';
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload=function(){devPreviewPDF();};
    document.head.appendChild(s);
    return;
  }
  if(msg)msg.textContent='⏳ Gerando pré-visualização...';

  // Patch prototype.save to capture blob instead of downloading
  var proto=window.jspdf.jsPDF.prototype;
  var origSave=proto.save;
  var capturedBlob=null;
  proto.save=function(filename){
    try{
      var blob=this.output('blob');
      capturedBlob=blob;
      _devShowPDFBlob(blob,filename||'preview.pdf');
    }catch(e){origSave.call(this,filename);}
  };

  try{
    var parts=val.split('_');
    var type=parts[0];
    var idx=parseInt(parts[1]);
    var prevFinIdx=currentFinIdx;
    if(type==='avs'){
      // Active (in-progress) flight — inject temporarily into FINS to reuse exportPDF()
      var av=AVS[idx];
      if(!av){proto.save=origSave;if(msg)msg.textContent='Registro ativo não encontrado.';return;}
      var tmpRec={id:Date.now(),mat:av.mat,serie:av.serie||'',mod:av.mod||'',
        resp:av.resp||'',dc:av.dc||'',df:'(em andamento)',
        by:(ME&&ME.nome)||'',res:typeof sgRes==='function'?sgRes(av.cl):'neutral',
        cl:JSON.parse(JSON.stringify(av.cl)),files:JSON.parse(JSON.stringify(av.files||[]))};
      FINS.unshift(tmpRec);
      currentFinIdx=0;
      try{exportPDF();}finally{FINS.shift();currentFinIdx=prevFinIdx;}
    } else if(type==='flight'){
      currentFinIdx=idx;
      try{exportPDF();}finally{currentFinIdx=prevFinIdx;}
    } else if(type==='mand'){
      exportMandatoryPDF(FINS[idx]);
      currentFinIdx=prevFinIdx;
    } else if(type==='vt'){
      if(typeof exportPDFVTIVTE==='function'){exportPDFVTIVTE(idx);}
      else{proto.save=origSave;if(msg)msg.textContent='PDF de VTI/VTE não disponível.';return;}
      currentFinIdx=prevFinIdx;
    }
  } catch(e){
    if(msg)msg.textContent='Erro: '+e.message;
  }
  proto.save=origSave; // restore
  if(msg)msg.textContent=capturedBlob?'':'Não foi possível capturar — tente baixar normalmente.';
}

function _devShowPDFBlob(blob,filename){
  _devPdfBlob={blob:blob,filename:filename||'preview.pdf'};
  var url=URL.createObjectURL(blob);
  var iframe=document.getElementById('dev-pdf-iframe');
  var modal=document.getElementById('mod-pdf-preview');
  if(!iframe||!modal)return;
  iframe.src=url;
  modal.style.display='flex';
  _showToast('✅ Pré-visualização do PDF pronta','ok');
}

function devClosePDFPreview(){
  var modal=document.getElementById('mod-pdf-preview');
  var iframe=document.getElementById('dev-pdf-iframe');
  if(modal)modal.style.display='none';
  if(iframe){URL.revokeObjectURL(iframe.src);iframe.src='';}
  _devPdfBlob=null;
}

function devDownloadPDF(){
  if(!_devPdfBlob)return;
  var url=URL.createObjectURL(_devPdfBlob.blob);
  var a=document.createElement('a');
  a.href=url;a.download=_devPdfBlob.filename;
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},300);
}

// ── Demo PDF (PT-TEST) ─────────────────────────────────────────
function devSetDemoPhoto(ev){
  var f=ev.target.files[0];if(!f)return;
  var r=new FileReader();
  r.onload=function(e){
    REG_IMGS['PT-TEST']=e.target.result;
    svRegImgs();
    renderAdmChanges(); // refresh card to show thumbnail
    _showToast('✅ Foto do PT-TEST salva','ok');
  };
  r.readAsDataURL(f);
}
function devClearDemoPhoto(){
  delete REG_IMGS['PT-TEST'];
  svRegImgs();
  renderAdmChanges();
  _showToast('✅ Foto removida','ok');
}

function devPreviewDemo(type){
  var msg=document.getElementById('dev-demo-msg');
  if(msg)msg.textContent='⏳ Gerando PDF demo...';
  if(typeof window.jspdf==='undefined'){
    if(msg)msg.textContent='⏳ Carregando biblioteca PDF...';
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    s.onload=function(){devPreviewDemo(type);};
    document.head.appendChild(s);
    return;
  }

  // Build mock record PT-TEST
  var mockItems=[
    {n:'Aircraft Registration Certificate',st:'ac',obs:'',fotos:[]},
    {n:'Airworthiness Certificate',st:'ac',obs:'',fotos:[]},
    {n:'Weight & Balance Manual',st:'re',obs:'Manual requires update — expires next month',fotos:[]},
    {n:'Minimum Equipment List (MEL)',st:'ac',obs:'',fotos:[]},
    {n:'Navigation charts current',st:'na',obs:'',fotos:[]},
    {n:'Emergency equipment (ELT)',st:'ac',obs:'',fotos:[]},
    {n:'Fire extinguisher in date',st:'ac',obs:'',fotos:[]},
    {n:'First aid kit complete',st:'--',obs:'',fotos:[]}
  ];
  var mockSec=[
    {s:'Authorization Documents',items:mockItems.slice(0,3)},
    {s:'Safety Equipment',items:mockItems.slice(3,6)},
    {s:'Emergency Equipment',items:mockItems.slice(6)}
  ];
  var now=dh();

  // Patch prototype.save
  var proto=window.jspdf.jsPDF.prototype;
  var origSave=proto.save;
  proto.save=function(filename){
    try{
      var blob=this.output('blob');
      _devShowPDFBlob(blob,filename||'pt-test-demo.pdf');
    }catch(e){origSave.call(this,filename);}
  };

  try{
    if(type==='flight'){
      var mockFin={
        mat:'PT-TEST',mod:'Phenom 300',serie:'50500001',
        resp:'Luis Henrique',by:'luis',
        dc:now,df:now,res:'warn',type:'flight',
        cl:mockSec
      };
      // Temporarily inject into FINS and export
      var prevIdx=currentFinIdx;
      FINS.unshift(mockFin);
      currentFinIdx=0;
      exportPDF();
      FINS.shift();
      currentFinIdx=prevIdx;

    } else if(type==='mand'){
      var mockMand={
        mat:'PT-TEST',mod:'Phenom 300',serie:'50500001',
        resp:'Luis Henrique',by:'luis',
        dc:now,df:now,res:'ok',type:'mandatory',
        mand:[
          {s:'Documents',items:mockItems.slice(0,4).map(function(it){return Object.assign({},it);})}
        ]
      };
      exportMandatoryPDF(mockMand);

    } else if(type==='vt'){
      if(typeof exportPDFVTIVTE!=='function'){
        proto.save=origSave;
        if(msg)msg.textContent='VTI/VTE PDF não disponível.';
        return;
      }
      var mockVT={
        mat:'PT-TEST',mod:'Phenom 300',serie:'50500001',type:'VTI',
        resp:'Luis Henrique',by:'luis',
        di:now,df:now,res:'ok',
        cl:mockSec
      };
      var prevFinVT=typeof FINSVTIVTE!=='undefined'?FINSVTIVTE:[];
      if(typeof FINSVTIVTE!=='undefined')FINSVTIVTE=[mockVT];
      exportPDFVTIVTE(0);
      if(typeof FINSVTIVTE!=='undefined')FINSVTIVTE=prevFinVT;
    }
    if(msg)msg.textContent='';
  }catch(e){
    if(msg)msg.textContent='Erro: '+e.message;
  }
  proto.save=origSave;
}

function _devCard(icon,title,color,idx,rows){
  // `color` is accepted for call-site compatibility but ignored — every card
  // uses the same neutral gray treatment for the monochrome dev-panel theme.
  var delay=(idx*0.08)+'s';
  var h='<div class="dev-card" style="animation-delay:'+delay+';">';
  h+='<div class="dev-card-hdr">';
  h+='<div class="dev-card-icon">'+icon+'</div>';
  h+='<span style="font-size:14px;font-weight:800;color:#f5f5f5;">'+title+'</span>';
  h+='<div style="margin-left:auto;width:6px;height:6px;border-radius:50%;background:#525258;"></div>';
  h+='</div>';
  h+='<div class="dev-card-body">';
  rows.forEach(function(r){h+='<div>'+r+'</div>';});
  h+='</div></div>';
  return h;
}

function devForceSync(){
  var msg=document.getElementById('dev-sync-msg');
  if(msg)msg.textContent='⏳ Sincronizando...';
  if(typeof cloudSave==='function')cloudSave();
  setTimeout(function(){if(msg)msg.textContent='✅ Sincronização disparada (salva em até 2s)';},300);
}

function devLoadSizes(){
  var el=document.getElementById('dev-sizes');
  if(!el)return;
  el.innerHTML='<span style="color:#8a8a8f;font-size:12px;animation:devBlink 1s infinite">⏳ Carregando do Upstash...</span>';
  var all=getAllUsers();
  var keys=[];
  all.forEach(function(u){keys.push(['STRLEN','tb7_'+u.u]);keys.push(['STRLEN','tb7_'+u.u+'_fp']);});
  keys.push(['STRLEN','tb7_admin_data']);
  keys.push(['STRLEN','tb7_actlog_v1']);
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify(keys)
  }).then(function(r){return r.json();})
  .then(function(res){
    var h='<div style="display:flex;flex-direction:column;gap:4px;margin-top:4px;">';
    var idx=0;
    all.forEach(function(u,ui){
      var sz=res[idx]&&res[idx].result?res[idx].result:0;
      var szFp=res[idx+1]&&res[idx+1].result?res[idx+1].result:0;
      idx+=2;
      var pct=Math.min(100,sz/10240*100);
      h+='<div style="animation:devSlideIn .2s ease '+(ui*0.05)+'s both;">'+
        '<div style="display:flex;justify-content:space-between;margin-bottom:3px;">'+
          '<span class="dev-mono" style="color:#a1a1aa;">@'+_h(u.u)+'</span>'+
          '<span class="dev-mono" style="color:#e5e5e5;font-weight:700;">'+(sz/1024).toFixed(1)+' KB'+(szFp?' <span style="color:#8a8a8f;">+photos '+(szFp/1024).toFixed(1)+'KB</span>':'')+'</span>'+
        '</div>'+
        '<div style="height:4px;background:#1c1c1c;border-radius:4px;overflow:hidden;">'+
          '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#4a4a50,#e5e5e5);border-radius:4px;transition:width .6s ease;"></div>'+
        '</div>'+
      '</div>';
    });
    var adminSz=res[idx]&&res[idx].result?res[idx].result:0;
    var logSz=res[idx+1]&&res[idx+1].result?res[idx+1].result:0;
    h+='<div style="margin-top:8px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;display:flex;gap:16px;">'+
      '<span class="dev-mono" style="color:#8a8a8f;">admin_data: <b style="color:#a1a1aa;">'+(adminSz/1024).toFixed(1)+' KB</b></span>'+
      '<span class="dev-mono" style="color:#8a8a8f;">actlog: <b style="color:#a1a1aa;">'+(logSz/1024).toFixed(1)+' KB</b></span>'+
    '</div>';
    h+='</div>';
    el.innerHTML=h;
  }).catch(function(e){el.innerHTML='<span style="color:#f4f4f4;font-size:12px;">Erro: '+e.message+'</span>';});
}

function devShowLocalStorage(){
  var el=document.getElementById('dev-ls');
  if(!el)return;
  var keys=['tb7','tb7f','tb7m','tb7me','tb7users','tb7_upwd','tb7_flags','tb7_actlog','tb7_uinfo'];
  var h='<div style="display:flex;flex-direction:column;gap:4px;margin-top:6px;">';
  keys.forEach(function(k,i){
    var v=localStorage.getItem(k);
    var sz=v?v.length:0;
    h+='<div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:#1c1c1c;border-radius:8px;animation:devSlideIn .2s ease '+(i*0.04)+'s both;">'+
      '<span class="dev-mono" style="flex:1;color:#a1a1aa;font-size:11px;">'+k+'</span>'+
      '<span class="dev-mono" style="color:'+(sz?'#e5e5e5':'#6b6b70')+';font-size:11px;">'+(sz?(sz/1024).toFixed(1)+' KB':'—')+'</span>'+
      (sz?'<button onclick="devCopyLS(\''+k+'\')" class="dev-btn dev-btn-ghost" style="padding:3px 8px;font-size:10px;">Copiar</button>':'')+
    '</div>';
  });
  h+='</div>';
  el.innerHTML=h;
}
function devCopyLS(k){
  var v=localStorage.getItem(k)||'';
  try{navigator.clipboard.writeText(v).then(function(){_showToast('✅ Copiado '+k,'ok');});} catch(e){_showToast('Falha ao copiar','err');}
}

function devShowJSON(){
  var src=document.getElementById('dev-json-src');
  var el=document.getElementById('dev-json-out');
  if(!src||!el)return;
  var data;
  switch(src.value){
    case 'avs':     data=AVS;break;
    case 'fins':    data=FINS;break;
    case 'mand':    data=MAND;break;
    case 'vtivte':  data=typeof AVSVTIVTE!=='undefined'?AVSVTIVTE:[];break;
    case 'vtivtefins': data=typeof FINSVTIVTE!=='undefined'?FINSVTIVTE:[];break;
    case 'users':   data=getAllUsers();break;
    case 'flags':   data=_FEATURE_FLAGS;break;
    default: data={};
  }
  var json=JSON.stringify(data,null,2);
  el.innerHTML='<div style="position:relative;animation:devFadeUp .2s ease;">'+
    '<button onclick="navigator.clipboard.writeText(document.getElementById(\'dev-json-pre\').textContent).then(function(){_showToast(\'✅ Copiado\',\'ok\');})" class="dev-btn dev-btn-ghost" style="position:absolute;top:8px;right:8px;padding:4px 10px;font-size:10px;">Copiar</button>'+
    '<pre id="dev-json-pre" style="background:#0a0a0a;color:#d4d4d4;border:1px solid rgba(255,255,255,.14);border-radius:10px;padding:14px 14px 14px 14px;font-size:11px;overflow:auto;max-height:320px;margin:0;line-height:1.6;">'+_h(json)+'</pre>'+
  '</div>';
}

function devResetPwd(){
  var uSel=document.getElementById('dev-pwd-user');
  var nPwd=document.getElementById('dev-pwd-new');
  var msg=document.getElementById('dev-pwd-msg');
  if(!uSel||!nPwd||!msg)return;
  var username=uSel.value, newPwd=nPwd.value.trim();
  if(!newPwd||newPwd.length<4){msg.style.color='#f4f4f4';msg.textContent='Mín. 4 caracteres.';return;}
  USERS_PWD_OVERRIDES[username]=_encPw(newPwd);
  svUserPwd();
  if(typeof _svAdminDataCloud==='function')_svAdminDataCloud();
  nPwd.value='';
  msg.style.color='#d4d4d4';
  msg.textContent='✅ Senha de @'+username+' redefinida.';
  _showToast('✅ Senha redefinida','ok');
}

function devClearUserData(){
  var uSel=document.getElementById('dev-clear-user');
  var msg=document.getElementById('dev-clear-msg');
  if(!uSel||!msg)return;
  var username=uSel.value;
  if(!confirm('Limpar TODOS os dados na nuvem (checklists, finalizados) de @'+username+'? Isso não pode ser desfeito.'))return;
  fetch(_UPSTASH_URL+'/pipeline',{
    method:'POST',
    headers:{'Authorization':'Bearer '+_UPSTASH_TOKEN,'Content-Type':'application/json'},
    body:JSON.stringify([['DEL','tb7_'+username],['DEL','tb7_'+username+'_fp']])
  }).then(function(){
    msg.style.color='#d4d4d4';
    msg.textContent='✅ Dados na nuvem de @'+username+' limpos.';
    _showToast('✅ Dados limpos','ok');
  }).catch(function(){msg.style.color='#f4f4f4';msg.textContent='Erro ao limpar dados.';});
}

function devExportLogCSV(){
  if(!ACTLOG.length){_showToast('Nenhum registro no log','err');return;}
  var csv='Timestamp,Date,User,Username,Action,Detail\n';
  ACTLOG.forEach(function(l){
    var d=new Date(l.ts);
    var ds=d.toLocaleDateString('en-US')+' '+d.toLocaleTimeString('en-US');
    var actionLabels={login:'Login',add_flight:'Added Flight',fin_flight:'Finalized Flight',add_vtivte:'Added VTI/VTE',fin_vtivte:'Finalized VTI/VTE',add_mand:'Added Mandatory',fin_mand:'Finalized Mandatory'};
    var row=[l.ts,ds,l.nome,l.u,actionLabels[l.action]||l.action,l.detail||''];
    csv+=row.map(function(v){return'"'+String(v).replace(/"/g,'""')+'"';}).join(',')+'\n';
  });
  var blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url;a.download='activity_log_'+new Date().toISOString().slice(0,10)+'.csv';
  document.body.appendChild(a);a.click();
  setTimeout(function(){document.body.removeChild(a);URL.revokeObjectURL(url);},500);
  _showToast('✅ CSV exportado','ok');
}

var _devImpersonating=null;
function devImpersonate(){
  var uSel=document.getElementById('dev-imp-user');
  if(!uSel)return;
  var username=uSel.value;
  var all=getAllUsers();
  var usr=null;for(var i=0;i<all.length;i++){if(all[i].u===username){usr=all[i];break;}}
  if(!usr)return;
  if(!confirm('Personificar @'+username+'? Você verá o app como se fosse ele(a). Clique em "Voltar ao Dev" no cabeçalho para retornar.'))return;
  _devImpersonating=ME.u;
  ME=Object.assign({},usr);
  // Show "back to dev" button
  var hdr=document.getElementById('header-row')||document.querySelector('.header');
  var backBtn=document.createElement('button');
  backBtn.id='dev-back-btn';
  backBtn.textContent='↩ Voltar ao Dev';
  backBtn.style.cssText='position:fixed;top:8px;right:60px;z-index:99999;padding:6px 14px;background:#262626;color:#f4f4f4;border:1px solid #4a4a50;border-radius:8px;font-size:12px;font-weight:800;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.3);';
  backBtn.onclick=devStopImpersonate;
  document.body.appendChild(backBtn);
  if(typeof cloudLoad==='function')cloudLoad(username,function(){render();renderMand();if(typeof renderVTIVTE==='function')renderVTIVTE();});
  document.getElementById('pg-adm').style.display='none';
  document.getElementById('pg-main').style.display='block';
  _showToast('👤 Personificando @'+username,'ok');
}

function devStopImpersonate(){
  if(!_devImpersonating)return;
  var all=getAllUsers();
  var devUsr=null;for(var i=0;i<all.length;i++){if(all[i].u===_devImpersonating){devUsr=all[i];break;}}
  if(devUsr)ME=Object.assign({},devUsr);
  _devImpersonating=null;
  var btn=document.getElementById('dev-back-btn');
  if(btn)btn.parentNode.removeChild(btn);
  if(typeof cloudLoad==='function')cloudLoad(ME.u,function(){render();renderMand();if(typeof renderVTIVTE==='function')renderVTIVTE();});
  document.getElementById('pg-main').style.display='none';
  document.getElementById('pg-adm').style.display='block';
  admTab('changes');
  _showToast('✅ De volta ao Dev','ok');
}

function devChangeRole(){
  var uSel=document.getElementById('dev-role-user');
  var rSel=document.getElementById('dev-role-new');
  var msg=document.getElementById('dev-role-msg');
  if(!uSel||!rSel||!msg)return;
  var username=uSel.value, newRole=rSel.value;
  var all=getAllUsers();
  var changed=false;
  for(var i=0;i<USERS.length;i++){if(USERS[i].u===username){USERS[i].role=newRole;changed=true;break;}}
  if(!changed){for(var j=0;j<USERS_EXTRA.length;j++){if(USERS_EXTRA[j].u===username){USERS_EXTRA[j].role=newRole;changed=true;break;}}}
  if(!changed){msg.style.color='#f4f4f4';msg.textContent='Usuário não encontrado.';return;}
  svUsers();
  if(typeof _svAdminDataCloud==='function')_svAdminDataCloud();
  msg.style.color='#d4d4d4';
  msg.textContent='✅ @'+username+' agora é '+(_roleLbl[newRole]||newRole)+'.';
  renderAdmChanges();
  _showToast('✅ Função atualizada','ok');
}

function devToggleFlag(k){
  _FEATURE_FLAGS[k]=!_FEATURE_FLAGS[k];
  _saveFlags();
  renderAdmChanges();
}

// ===== DEV CHANGES — CAMERA TEST =====
function devCamTest(ev){
  var f=ev.target.files[0]; if(!f) return;
  var previewEl=document.getElementById('dev-cam-preview');
  var wrapEl=document.getElementById('dev-crop-wrap');
  var r=new FileReader();
  r.onload=function(e){
    if(previewEl){previewEl.src=e.target.result;}
    if(wrapEl){wrapEl.style.display='block';}
  };
  r.readAsDataURL(f);
}
