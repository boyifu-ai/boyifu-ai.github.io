(() => {
  'use strict';
  const root = document.getElementById('visitor-map');
  if (!root) return;
  const canvas = document.getElementById('visitor-map-canvas');
  const totalElement = document.getElementById('visitor-map-total');
  const status = document.getElementById('visitor-map-status');
  const baseline = Number(root.dataset.baseline) || 0;
  const local = root.dataset.mode !== 'production' || ['localhost','127.0.0.1','::1','[::1]'].includes(location.hostname);
  const endpoints = [...new Set([root.dataset.endpoint,root.dataset.fallbackEndpoint].filter(Boolean).map(value=>value.replace(/\/+$/,'')))];
  let map, collected = false;
  const formatCount = value => value >= 1000000 ? (Math.floor(value / 100000) / 10) + 'M+' : value >= 1000 ? Math.floor(value / 1000) + 'K+' : String(value);
  totalElement.textContent = formatCount(baseline);
  async function request(url, keepalive = false) {
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),7000);
    try {
      const response = await fetch(url,{signal:controller.signal,credentials:'omit',cache:'no-store',keepalive});
      if (!response.ok) throw new Error('Visitor data is unavailable');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function recordVisit() {
    if (local || collected || !endpoints.length) {
      root.dataset.collectionStatus = local ? 'preview' : 'unavailable';
      return;
    }
    // Count one page load independently of optional Google Analytics cookies.
    // Do not retry ambiguous failures: the current API has no idempotency key.
    collected = true;
    root.dataset.collectionStatus = 'pending';
    try {
      const result = await request(endpoints[0] + '/collect?path=' + encodeURIComponent(location.pathname), true);
      root.dataset.collectionStatus = result.ok === true ? 'recorded' : 'unavailable';
    } catch {
      root.dataset.collectionStatus = 'unavailable';
    }
  }
  const visitRequest = recordVisit();
  function drawMap(locations) {
    if (!window.L) { status.textContent = 'The map could not load. Please refresh to try again.'; return; }
    if (!map) {
      map = L.map(canvas,{scrollWheelZoom:false,zoomControl:true,zoomSnap:.25,zoomDelta:.5,minZoom:0,maxZoom:6,worldCopyJump:true}).setView([20,0],.5);
      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{minZoom:0,maxZoom:6,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'});
      // A failed tile must never hide the entire visitor map.
      tiles.addTo(map);
      new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(canvas);
    }
    const markers = L.featureGroup().addTo(map);
    for (const item of locations) {
      const latitude = Number(item.latitude), longitude = Number(item.longitude);
      if (!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180) continue;
      const marker = L.circleMarker([latitude,longitude],{radius:Math.max(3.5,Math.min(10,3.1+Math.log10((Number(item.visits)||0)+1)*1.15)),color:'#254d69',weight:1.25,fillColor:'#9b2f3f',fillOpacity:.65}).addTo(markers);
      const tooltip = document.createElement('span');
      tooltip.textContent = [item.city,item.region,item.country].filter(value=>value&&value!=='Unknown').join(', ') + ' · ' + formatCount(Number(item.visits)||0) + ' visits';
      marker.bindTooltip(tooltip,{direction:'top',opacity:.95});
      marker.bindPopup(tooltip.cloneNode(true));
    }
    canvas.dataset.locations = String(locations.length);
    setTimeout(()=>map.invalidateSize({pan:false}),0);
  }
  async function init() {
    // Read the summary after this visit so its count and city can appear at once.
    await visitRequest;
    let summary, snapshot = local;
    if (!local) {
      for (const endpoint of endpoints) {
        try { summary = await request(endpoint+'/summary'); if (Array.isArray(summary.locations)) break; summary = null; } catch {}
      }
    }
    if (!summary) {
      try { summary = await request(root.dataset.snapshot); snapshot = true; } catch {}
    }
    if (!summary) { drawMap([]); status.textContent = 'Visitor data is temporarily unavailable. Please try again later.'; return; }
    const total = Number.isFinite(Number(summary.totalVisits)) && summary.totalVisits !== null ? Number(summary.totalVisits) : baseline + (Number(summary.recordedVisits)||0);
    totalElement.textContent = formatCount(total);
    totalElement.title = total.toLocaleString('en-US') + ' cumulative visits';
    const locations = Array.isArray(summary.locations) ? summary.locations : [];
    const updated = summary.fetchedAt ? new Date(summary.fetchedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}) : '';
    status.textContent = snapshot ? `${locations.length} locations · ${local ? 'Preview snapshot' : 'Last available data'}${updated ? ' · '+updated : ''}` : `${locations.length} locations around the world`;
    drawMap(locations);
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();init();}},{rootMargin:'300px'});
    observer.observe(root);
  } else init();
})();
