// ======================
// INIT MAP
// ======================
const map = L.map('map', {
  zoomControl: false
}).setView([20, 0], 2);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

// ======================
// SATELLITE DATA
// ======================
const satellites = [
  { name: "VINSAT-NANO-1", color: "lime", speed: 1.2 },
  { name: "VINSAT-NANO-2", color: "red", speed: 1.5 },
  { name: "VINSAT-NANO-3", color: "cyan", speed: 1.0 }
];

// ======================
// CREATE SATELLITES
// ======================
const satObjects = satellites.map((sat, i) => {

  const icon = L.divIcon({
    className: 'satellite-icon',
    html: `
      <div class="sat-dot" style="background:${sat.color}"></div>
      <div class="sat-label">${sat.name}</div>
    `
  });

  return {
    ...sat,
    lat: 0,
    lng: i * 60,
    marker: L.marker([0, i * 60], { icon }).addTo(map)
  };
});

// ======================
// ORBIT SIMULATION
// ======================
setInterval(() => {

  satObjects.forEach(sat => {

    sat.lng += sat.speed;
    sat.lat = 20 * Math.sin(sat.lng * Math.PI / 180);

    if (sat.lng > 180) sat.lng = -180;

    sat.marker.setLatLng([sat.lat, sat.lng]);

  });

}, 100);


// ======================
// TELEMETRY RANDOM DATA
// ======================
function random(min, max) {
  return (Math.random() * (max - min) + min).toFixed(2);
}

function updateTelemetry() {

  const speed = random(120, 180);
  const fuel = random(40, 90);
  const signal = random(70, 100);

  document.querySelector(".speed").innerText = `${speed} Mbps`;

  // add log
  const log = document.querySelector(".log");
  const time = new Date().toLocaleTimeString();

  const msg = `[${time}] [TELEMETRY] Downlink: ${speed} Mbps | Fuel: ${fuel}% | Signal: ${signal}%`;

  const div = document.createElement("div");
  div.innerText = msg;

  log.prepend(div);

  // limit log rows
  if (log.children.length > 20) {
    log.removeChild(log.lastChild);
  }
}

// update mỗi 2 giây
setInterval(updateTelemetry, 2000);
