// ===== UPSTASH CLOUD SYNC (direct REST API) =====
// Calls Upstash Redis directly from the browser — no serverless needed.

var _cloudSaveTimer   = null;
var _cloudSaving      = false;   // true while a save fetch is in-flight
var _lastCloudSaveTs  = 0;       // timestamp of last successful cloud save
// ⚠️ SECURITY: In a static PWA this token is visible in DevTools.
var _UPSTASH_URL   = 'https://fond-parakeet-82826.upstash.io';
var _UPSTASH_TOKEN = 'gQAAAAAAAUOKAAIncDFiMTRlYjA0ZjU1Njg0MWZmYTQyZDFkMDc4ODBkOWFiYnAxODI4MjY';

// _cloudSavePending is persisted to localStorage — a flaky-but-"online" connection
// (weak signal in a hangar, e.g.) can fail a save without ever firing the browser's
// offline→online transition, so a save can otherwise stay stuck as lost forever,
// even across a page reload/reopen.
var _CLOUD_PENDING_KEY = 'tb7_cloud_pending';
var _cloudSavePending = (function () {
  try { return localStorage.getItem(_CLOUD_PENDING_KEY) === '1'; } catch (e) { return false; }
})();
function _setCloudPending(v) {
  _cloudSavePending = v;
  try {
    if (v) localStorage.setItem(_CLOUD_PENDING_KEY, '1');
    else localStorage.removeItem(_CLOUD_PENDING_KEY);
  } catch (e) {}
}

// Retry cloud save when the device comes back online
window.addEventListener('online', function() {
  if (_cloudSavePending && typeof cloudSave === 'function') {
    cloudSave();
  }
});

// Fallback net: retry a pending save periodically. Needed because a degraded
// connection (weak signal, not a real offline/online transition) never fires
// the 'online' event above, so without this a failed save could sit pending
// forever with no retry.
var _cloudRetryTimer = null;
function _startCloudPendingRetry() {
  if (_cloudRetryTimer) return;
  _cloudRetryTimer = setInterval(function () {
    if (_cloudSavePending && window.ME && navigator.onLine && !_cloudSaving && !_cloudSaveTimer) {
      console.log('🔁 Retrying pending cloud save...');
      cloudSave(true);
    }
  }, 20000);
}
_startCloudPendingRetry();

// Auto-refresh from cloud every 5 minutes — skipped if a save is in progress
var _cloudRefreshTimer = null;
function _startCloudAutoRefresh() {
  if (_cloudRefreshTimer) clearInterval(_cloudRefreshTimer);
  _cloudRefreshTimer = setInterval(function() {
    if (!window.ME || !navigator.onLine) return;
    // Skip if a save is pending/in-flight — cloud data may be stale
    if (_cloudSaving || _cloudSavePending || _cloudSaveTimer) return;
    cloudLoad(window.ME.u, function(loaded) {
      if (!loaded) return;
      if (typeof render === 'function') render();
      if (typeof renderFin === 'function') renderFin();
      if (typeof renderMandatory === 'function') renderMandatory();
      if (typeof renderFinVTIVTE === 'function') renderFinVTIVTE();
    });
  }, 5 * 60 * 1000);
}
function _stopCloudAutoRefresh() {
  if (_cloudRefreshTimer) { clearInterval(_cloudRefreshTimer); _cloudRefreshTimer = null; }
}

// ── Strip photos/files from active aircraft records ──────────
function _stripBinary(items) {
  if (!items || !items.length) return items;
  return items.map(function (av) {
    var copy = JSON.parse(JSON.stringify(av));
    copy.files = [];
    if (copy.cl) {
      copy.cl = copy.cl.map(function (sec) {
        sec.items = sec.items.map(function (it) { it.fotos = []; return it; });
        return sec;
      });
    }
    return copy;
  });
}

// Strip photos from finalized records for the main sync key
function _stripFinsBinary(fins) {
  if (!fins || !fins.length) return fins;
  return fins.map(function (r) {
    var copy = JSON.parse(JSON.stringify(r));
    if (copy.cl)   copy.cl   = copy.cl.map(function(sec){sec.items=(sec.items||[]).map(function(it){it.fotos=[];return it;});return sec;});
    if (copy.mand) copy.mand = copy.mand.map(function(sec){sec.items=(sec.items||[]).map(function(it){it.fotos=[];return it;});return sec;});
    return copy;
  });
}

// Compress a single photo to max 500×400 at 60% quality for cloud storage
function _compressPhotoCloud(dataUrl) {
  return new Promise(function(resolve) {
    if (!dataUrl || dataUrl.length < 100) { resolve(''); return; }
    var img = new Image();
    img.onload = function() {
      var mW = 500, mH = 400, w = img.width, h = img.height;
      if (w > mW) { h = Math.round(h * mW / w); w = mW; }
      if (h > mH) { w = Math.round(w * mH / h); h = mH; }
      var cvs = document.createElement('canvas');
      cvs.width = w; cvs.height = h;
      cvs.getContext('2d').drawImage(img, 0, 0, w, h);
      resolve(cvs.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = function() { resolve(''); };
    img.src = dataUrl;
  });
}

// Collect + compress all photos from FINS and FINSVTIVTE
function _buildPhotoPayload() {
  var fins = (window.FINS || []).concat(typeof FINSVTIVTE !== 'undefined' ? FINSVTIVTE : []);
  var jobs = [], index = [];
  fins.forEach(function(r) {
    var secs = r.cl || r.mand || [];
    secs.forEach(function(sec, s) {
      (sec.items || []).forEach(function(it, i) {
        (it.fotos || []).forEach(function(f, fp) {
          if (f.d && f.d.length > 100) {
            // Use string key so JSON round-trip matches
            index.push({id: String(r.id), s: s, i: i, fp: fp, by: f.by || '', dt: f.dt || ''});
            jobs.push(_compressPhotoCloud(f.d));
          }
        });
      });
    });
  });
  return Promise.all(jobs).then(function(compressed) {
    var out = {};
    compressed.forEach(function(d, idx) {
      if (!d) return;
      var ref = index[idx];
      if (!out[ref.id]) out[ref.id] = [];
      out[ref.id].push({s: ref.s, i: ref.i, fp: ref.fp, d: d, by: ref.by, dt: ref.dt});
    });
    return out;
  });
}

// Copy photos from a previous (local) fins array into the new (cloud) fins array
// so that cloudLoad never destroys photos that were only in localStorage
function _restoreLocalPhotos(newFins, oldFins) {
  if (!oldFins || !oldFins.length) return;
  newFins.forEach(function(f) {
    var old = null;
    for (var oi = 0; oi < oldFins.length; oi++) { if (oldFins[oi].id === f.id) { old = oldFins[oi]; break; } }
    if (!old) return;
    var newSecs = f.cl || f.mand || [];
    var oldSecs = old.cl || old.mand || [];
    newSecs.forEach(function(sec, s) {
      var osec = oldSecs[s]; if (!osec) return;
      (sec.items || []).forEach(function(it, i) {
        var oit = (osec.items || [])[i]; if (!oit) return;
        if (oit.fotos && oit.fotos.some(function(fo) { return fo.d && fo.d.length > 100; })) {
          it.fotos = oit.fotos; // restore higher-quality local photos
        }
      });
    });
  });
}

// Merge cloud photos back into FINS and FINSVTIVTE in memory + localStorage
function _mergePhotosIntoFins(photoMap) {
  if (!photoMap) return;
  var allFins = (window.FINS || []).concat(typeof FINSVTIVTE !== 'undefined' ? FINSVTIVTE : []);
  var changed = false;
  allFins.forEach(function(r) {
    // JSON keys are always strings; r.id may be a number — normalise
    var photos = photoMap[String(r.id)];
    if (!photos || !photos.length) return;
    var secs = r.cl || r.mand || [];
    photos.forEach(function(p) {
      var sec = secs[p.s]; if (!sec) return;
      var it  = (sec.items || [])[p.i]; if (!it) return;
      if (!it.fotos) it.fotos = [];
      // Only fill empty slots — don't overwrite higher-quality local copy
      if (!it.fotos[p.fp] || !it.fotos[p.fp].d || it.fotos[p.fp].d.length < 100) {
        it.fotos[p.fp] = {d: p.d, by: p.by, dt: p.dt};
        changed = true;
      }
    });
  });
  // Persist to localStorage so photos survive page reload
  if (changed) {
    if (typeof svf === 'function') svf();
    if (typeof FINSVTIVTE !== 'undefined' && typeof saveVTIVTE === 'function') saveVTIVTE();
  }
}

// ── Load user data from cloud ──────────────────────────────────
function cloudLoad(username, callback) {
  var key   = 'tb7_' + username;
  var phKey = 'tb7_' + username + '_fp';
  fetch(_UPSTASH_URL + '/pipeline', {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + _UPSTASH_TOKEN, 'Content-Type': 'application/json'},
    body: JSON.stringify([['GET', key], ['GET', phKey]])
  })
    .then(function (r) { return r.json(); })
    .then(function (result) {
      var raw  = result[0] && result[0].result;
      var data = raw ? JSON.parse(raw) : null;
      var phRaw   = result[1] && result[1].result;
      var photoMap = phRaw ? JSON.parse(phRaw) : null;

      if (data) {
        var cloudTs = data.updated ? new Date(data.updated).getTime() : 0;
        var skipUpdate = cloudTs > 0 && cloudTs < _lastCloudSaveTs;
        if (!skipUpdate) {
          if (data.avs) { AVS = data.avs; sv(); }
          if (data.fins) {
            // Preserve photos already in local FINS before overwriting with stripped cloud version
            var _prevFins = window.FINS || [];
            FINS = data.fins;
            _restoreLocalPhotos(FINS, _prevFins);
            svf();
          }
          if (data.mand)       { MAND       = data.mand;       svMand();      }
          if (data.mand_extra) { MAND_EXTRA = data.mand_extra; svMandExtra(); }
          if (data.vtivte && typeof AVSVTIVTE !== 'undefined') { AVSVTIVTE = data.vtivte; if(typeof saveVTIVTE==='function') saveVTIVTE(); }
          if (data.vtivte_fins && typeof FINSVTIVTE !== 'undefined') {
            var _prevVt = typeof FINSVTIVTE !== 'undefined' ? FINSVTIVTE : [];
            FINSVTIVTE = data.vtivte_fins;
            _restoreLocalPhotos(FINSVTIVTE, _prevVt);
            if(typeof saveVTIVTE==='function') saveVTIVTE();
          }
        }
        // Merge cloud photos as fallback for slots still empty after local restore
        if (photoMap) _mergePhotosIntoFins(photoMap);
        console.log('✅ Cloud data loaded for:', username, skipUpdate ? '(skip — local newer)' : '');
      } else {
        console.log('No cloud data for:', username, '— using local data');
      }
      if (callback) callback(!!data);
    })
    .catch(function (e) {
      console.error('Cloud load error:', e);
      if (callback) callback(false);
    });
}

// ── Check Upstash database memory usage (used by the dev-only storage alert) ──
function checkUpstashUsage(callback) {
  fetch(_UPSTASH_URL + '/pipeline', {
    method: 'POST',
    headers: {'Authorization': 'Bearer ' + _UPSTASH_TOKEN, 'Content-Type': 'application/json'},
    body: JSON.stringify([['INFO', 'memory']])
  })
    .then(function (r) { return r.json(); })
    .then(function (result) {
      var info = result[0] && result[0].result;
      var m = info && /used_memory:(\d+)/.exec(info);
      callback(m ? parseInt(m[1], 10) : null);
    })
    .catch(function (e) {
      console.error('Upstash usage check error:', e);
      callback(null);
    });
}

// ── Save all user data to cloud (debounced 2s; pass immediate=true to skip debounce) ──
function cloudSave(immediate) {
  if (!window.ME) return;
  if (!navigator.onLine) {
    _setCloudPending(true);
    console.log('📴 Offline — cloud save queued');
    return;
  }

  clearTimeout(_cloudSaveTimer);
  _cloudSaveTimer = setTimeout(function () {
    _cloudSaveTimer = null;
    var key   = 'tb7_' + window.ME.u;
    var phKey = 'tb7_' + window.ME.u + '_fp';
    var mainData = {
      avs:         _stripBinary(window.AVS       || []),
      fins:        _stripFinsBinary(window.FINS  || []),
      mand:        window.MAND       || [],
      mand_extra:  window.MAND_EXTRA || [],
      vtivte:      _stripBinary(typeof AVSVTIVTE  !== 'undefined' ? AVSVTIVTE  : []),
      vtivte_fins: _stripFinsBinary(typeof FINSVTIVTE !== 'undefined' ? FINSVTIVTE : []),
      updated:     new Date().toISOString()
    };

    _cloudSaving = true;
    _buildPhotoPayload().then(function(photoMap) {
      fetch(_UPSTASH_URL + '/pipeline', {
        method: 'POST',
        headers: {'Authorization': 'Bearer ' + _UPSTASH_TOKEN, 'Content-Type': 'application/json'},
        body: JSON.stringify([
          ['SET', key,   JSON.stringify(mainData)],
          ['SET', phKey, JSON.stringify(photoMap)]
        ])
      })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          _cloudSaving = false;
          if (r[0] && r[0].result === 'OK') {
            _lastCloudSaveTs = Date.now();
            _setCloudPending(false);
            console.log('✅ Cloud saved for:', window.ME.u);
          } else {
            _setCloudPending(true);
            console.warn('⚠️ Cloud save unexpected response:', r);
          }
        })
        .catch(function (e) {
          _cloudSaving = false;
          _setCloudPending(true);
          console.error('Cloud save error:', e);
        });
    }).catch(function(e) {
      _cloudSaving = false;
      _setCloudPending(true);
      console.error('Photo compression error:', e);
    });
  }, immediate ? 50 : 2000);
}
