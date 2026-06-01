// ======================
// INIT MAP (GLOBAL VIEW)
// ======================
const map = L.map('map', {
  zoomControl: false
}).setView([20, 0], 2);

// DARK MODE MAP
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
}).addTo(map);

// ======================
// SATELLITE MARKER
// ======================
const satIcon = L.divIcon({
  className: 'satellite-icon'
});

let lat = 0;
let lng = 0;

const sat = L.marker([lat, lng], { icon: satIcon }).addTo(map);

// ======================
// ORBIT SIMULATION
// ======================
setInterval(() => {

  lng += 1.5;
  lat = 20 * Math.sin(lng * Math.PI / 180);

  if (lng > 180) lng = -180;

  sat.setLatLng([lat, lng]);

}, 100);
