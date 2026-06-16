// Chờ thư viện Leaflet (L) nạp xong
const initWhenReady = setInterval(function() {
  if (typeof L !== 'undefined') {
    clearInterval(initWhenReady);
    runDashboard();
  }
}, 50);

function runDashboard() {
  const MAP_WIDTH = 2000;
  const MAP_HEIGHT = 1000;
  // ======================
  // INIT MAP (Bung hết cỡ bản đồ và vô hiệu hóa khoảng trống thừa)
  // ======================
  const map = L.map('map', {
    zoomControl: true,
    attributionControl: false,
    crs: L.CRS.Simple,
    zoomSnap: 0.1,  
    minZoom: -2,
    maxZoom: 3,
    maxBoundsViscosity: 1.0     
  });

  // Thiết lập ma trận ranh giới bản đồ (2000 x 1000)
  const leftBounds = [[0, -MAP_WIDTH], [MAP_HEIGHT, 0]];
  const mainBounds = [[0, 0], [MAP_HEIGHT, MAP_WIDTH]];
  const rightBounds = [[0, MAP_WIDTH], [MAP_HEIGHT, MAP_WIDTH * 2]];
  const worldBounds = [[0, -MAP_WIDTH], [MAP_HEIGHT, MAP_WIDTH * 2]];

  map.setMaxBounds(worldBounds);
  
  // ======================
  // SỬ DỤNG HÌNH ẢNH MAP.WEBP TỪ REPO CỦA BẠN
  // ======================
  L.imageOverlay('map.webp', leftBounds, { pane: 'tilePane' }).addTo(map);
  L.imageOverlay('map.webp', mainBounds, { pane: 'tilePane' }).addTo(map);
  L.imageOverlay('map.webp', rightBounds, { pane: 'tilePane' }).addTo(map);

  const VINUNI_LAT = 20.993;
  const VINUNI_LON = 105.944;
  const VINUNI_MAP_X = 1570;
  const VINUNI_MAP_Y = 565;
  map.setView(L.latLng(VINUNI_MAP_Y, VINUNI_MAP_X), -0.5); // Tập trung góc nhìn ban đầu ngay gần VinUniversity
  
  // ======================
  // TRẠM MẶT ĐẤT VINUNIVERSITY
  // ======================
 
  // ======================
  var stationPoint = new Array();
  stationPoint.push(VINUNI_MAP_Y);
  stationPoint.push(VINUNI_MAP_X);
  
  function createGroundStationIcon(label) {
    return L.divIcon({
      className: 'gs-icon',
      html: '<div class="gs-pulse"></div><div class="gs-dot"></div><div class="gs-label">' + label + '</div>',
      iconSize: L.point(20, 20),
      iconAnchor: L.point(10, 10)
    });
  }
  
  L.marker(stationPoint, { icon: createGroundStationIcon("GS-1 VINUNIVERSITY") }).addTo(map);


  // ======================
  // ======================
  const colorsList = ["#10b981", "#ef4444", "#06b6d4", "#f59e0b", "#a855f7", "#3b82f6", "#ec4899", "#14b8a6", "#f43f5e", "#0284c7"];

  const EARTH_RADIUS_KM = 6371;
  const EARTH_MU = 398600.4418;
  const EARTH_ROTATION_RAD_PER_SEC = 7.2921159e-5;
  const TIME_SCALE = 1;
  const orbitEpoch = Date.UTC(2026, 5, 15, 0, 0, 0);
  const MAP_X_OFFSET = VINUNI_MAP_X - (((VINUNI_LON + 180) / 360) * MAP_WIDTH);
  const MAP_Y_OFFSET = VINUNI_MAP_Y - (((VINUNI_LAT + 90) / 180) * MAP_HEIGHT);

  map.createPane('shadowPane');
  map.getPane('shadowPane').style.zIndex = 350;

  function degToRad(deg) {
    return (deg * Math.PI) / 180;
  }

  function radToDeg(rad) {
    return (rad * 180) / Math.PI;
  }

  function normalizeLon(lonDeg) {
    return ((lonDeg + 540) % 360) - 180;
  }

  function geoToMapPoint(latDeg, lonDeg) {
    const x = ((normalizeLon(lonDeg) + 180) / 360) * MAP_WIDTH + MAP_X_OFFSET;
    const y = ((latDeg + 90) / 180) * MAP_HEIGHT + MAP_Y_OFFSET;
    return [y, x];
  }

  const NIGHT_SHADOW_CANVAS = {
    width: 720,
    height: 360
  };
  const NIGHT_SHADOW_COLOR = {
    r: 17,
    g: 24,
    b: 39,
    maxAlpha: 86
  };
  const TERMINATOR_SOFTNESS = 0.08;

  function getDayOfYear(date) {
    const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 0);
    const currentTime = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return Math.floor((currentTime - startOfYear) / 86400000);
  }

  function getUtcDecimalHours(date) {
    return date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  }

  function getSolarDeclination(date) {
    const dayOfYear = getDayOfYear(date);
    const angle = ((360 / 365) * (dayOfYear - 81)) * (Math.PI / 180);
    return 23.44 * Math.sin(angle);
  }

  function getSubsolarLongitude(date) {
    const utcHours = getUtcDecimalHours(date);
    return normalizeLon((12 - utcHours) * 15);
  }

  const nightShadowCanvas = document.createElement('canvas');
  nightShadowCanvas.width = NIGHT_SHADOW_CANVAS.width;
  nightShadowCanvas.height = NIGHT_SHADOW_CANVAS.height;
  const nightShadowContext = nightShadowCanvas.getContext('2d');
  const nightShadowOverlays = [
    L.imageOverlay('', leftBounds, { pane: 'shadowPane', opacity: 1, interactive: false }).addTo(map),
    L.imageOverlay('', mainBounds, { pane: 'shadowPane', opacity: 1, interactive: false }).addTo(map),
    L.imageOverlay('', rightBounds, { pane: 'shadowPane', opacity: 1, interactive: false }).addTo(map)
  ];
  var lastShadowSecondBucket = '';
  const VIETNAM_TIME_ZONE = 'Asia/Ho_Chi_Minh';
  const vietnamTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: VIETNAM_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const utcTimeFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  function formatVietnamTime(date) {
    return vietnamTimeFormatter.format(date);
  }

  function formatUtcTime(date) {
    return utcTimeFormatter.format(date);
  }

  function renderNightShadow(date) {
    const secondBucket = Math.floor(date.getTime() / 5000).toString();
    if (secondBucket === lastShadowSecondBucket) return;
    lastShadowSecondBucket = secondBucket;

    const width = NIGHT_SHADOW_CANVAS.width;
    const height = NIGHT_SHADOW_CANVAS.height;
    const imageData = nightShadowContext.createImageData(width, height);
    const data = imageData.data;
    const sunLat = degToRad(getSolarDeclination(date));
    const sunLon = degToRad(getSubsolarLongitude(date));
    const sinSunLat = Math.sin(sunLat);
    const cosSunLat = Math.cos(sunLat);

    for (var y = 0; y < height; y++) {
      const lat = degToRad(90 - (y / (height - 1)) * 180);
      const sinLat = Math.sin(lat);
      const cosLat = Math.cos(lat);

      for (var x = 0; x < width; x++) {
        const lon = degToRad((x / (width - 1)) * 360 - 180);
        const sunlight =
          sinLat * sinSunLat +
          cosLat * cosSunLat * Math.cos(lon - sunLon);
        const rawAlpha = Math.max(
          0,
          Math.min(
            1,
            (TERMINATOR_SOFTNESS - sunlight) / (TERMINATOR_SOFTNESS * 2)
          )
        );
        const alpha = Math.round(rawAlpha * NIGHT_SHADOW_COLOR.maxAlpha);
        const index = (y * width + x) * 4;

        data[index] = NIGHT_SHADOW_COLOR.r;
        data[index + 1] = NIGHT_SHADOW_COLOR.g;
        data[index + 2] = NIGHT_SHADOW_COLOR.b;
        data[index + 3] = alpha;
      }
    }

    nightShadowContext.putImageData(imageData, 0, 0);
    const shadowUrl = nightShadowCanvas.toDataURL('image/png');
    nightShadowOverlays.forEach(function(overlay) {
      overlay.setUrl(shadowUrl);
    });
  }

  const timeGridLines = [];
  for (var gridLon = -150; gridLon <= 150; gridLon += 30) {
    timeGridLines.push(L.polyline([
      geoToMapPoint(-90, gridLon),
      geoToMapPoint(90, gridLon)
    ], {
      pane: 'shadowPane',
      color: '#ffffff',
      opacity: 0.08,
      weight: 1,
      interactive: false
    }));
  }
  L.layerGroup(timeGridLines).addTo(map);

  const timeControl = L.control({ position: 'bottomleft' });
  timeControl.onAdd = function() {
    const container = L.DomUtil.create('div', 'time-control');
    L.DomEvent.disableClickPropagation(container);
    return container;
  };
  timeControl.addTo(map);

  function updateTimeAndShadow() {
    const now = new Date();
    const timeEl = document.querySelector('.time-control');
    if (timeEl) {
      timeEl.innerHTML =
        '<div>VN ' + formatVietnamTime(now) + '</div>' +
        '<div>UTC ' + formatUtcTime(now) + '</div>';
    }
    renderNightShadow(now);
  }

  updateTimeAndShadow();
  setInterval(updateTimeAndShadow, 1000);
  map.on('zoom move resize viewreset', function() {
    renderNightShadow(new Date());
  });

  function makeLaunchOrbit(name, altitudeKm, inclinationDeg, launchLatDeg, launchLonDeg, alongTrackOffsetDeg) {
    const lat = degToRad(launchLatDeg);
    const lon = degToRad(launchLonDeg);
    const inc = degToRad(inclinationDeg);
    const sinU = Math.max(-1, Math.min(1, Math.sin(lat) / Math.sin(inc)));
    const u = Math.asin(sinU);
    const inPlaneLon = Math.atan2(Math.cos(inc) * Math.sin(u), Math.cos(u));
    const raan = lon - inPlaneLon;

    return {
      name: name,
      altitudeKm: altitudeKm,
      inclinationDeg: inclinationDeg,
      raanDeg: normalizeLon(radToDeg(raan)),
      phaseDeg: radToDeg(u) + alongTrackOffsetDeg
    };
  }

  const satellites = [
    makeLaunchOrbit("VINSAT-1", 430, 51.6, VINUNI_LAT, VINUNI_LON, 0),
    makeLaunchOrbit("VINSAT-2", 470, 53.0, VINUNI_LAT, VINUNI_LON, 45),
    makeLaunchOrbit("VINSAT-3", 520, 56.0, VINUNI_LAT, VINUNI_LON, 90),
    makeLaunchOrbit("VINSAT-4", 560, 63.4, VINUNI_LAT, VINUNI_LON, 135),
    makeLaunchOrbit("VINSAT-5", 610, 70.0, VINUNI_LAT, VINUNI_LON, 180),
    makeLaunchOrbit("VINSAT-6", 450, 82.0, VINUNI_LAT, VINUNI_LON, 225),
    makeLaunchOrbit("VINSAT-7", 540, 97.6, VINUNI_LAT, VINUNI_LON, 270),
    makeLaunchOrbit("VINSAT-8", 590, 98.2, VINUNI_LAT, VINUNI_LON, 315)
  ];

  function getSimSeconds(timeMs) {
    return ((timeMs - orbitEpoch) / 1000) * TIME_SCALE;
  }

  function positionAt(sat, timeMs) {
    const a = EARTH_RADIUS_KM + sat.altitudeKm;
    const n = Math.sqrt(EARTH_MU / Math.pow(a, 3));
    const u = degToRad(sat.phaseDeg) + n * getSimSeconds(timeMs);
    const inc = degToRad(sat.inclinationDeg);
    const raan = degToRad(sat.raanDeg);

    const xOrb = a * Math.cos(u);
    const yOrb = a * Math.sin(u);
    const cosRaan = Math.cos(raan);
    const sinRaan = Math.sin(raan);
    const cosInc = Math.cos(inc);
    const sinInc = Math.sin(inc);

    const xEci = cosRaan * xOrb - sinRaan * cosInc * yOrb;
    const yEci = sinRaan * xOrb + cosRaan * cosInc * yOrb;
    const zEci = sinInc * yOrb;

    const theta = EARTH_ROTATION_RAD_PER_SEC * getSimSeconds(timeMs);
    const cosTheta = Math.cos(theta);
    const sinTheta = Math.sin(theta);
    const xEcef = cosTheta * xEci + sinTheta * yEci;
    const yEcef = -sinTheta * xEci + cosTheta * yEci;
    const zEcef = zEci;

    const lat = radToDeg(Math.atan2(zEcef, Math.sqrt(xEcef * xEcef + yEcef * yEcef)));
    const lon = normalizeLon(radToDeg(Math.atan2(yEcef, xEcef)));

    return {
      lat: lat,
      lon: lon,
      mapPoint: geoToMapPoint(lat, lon)
    };
  }

  function buildGroundTrack(sat, timeMs) {
    const segments = [];
    var currentSegment = [];

    for (var minutes = -45; minutes <= 90; minutes += 2) {
      const pointTime = timeMs + (minutes * 60 * 1000) / TIME_SCALE;
      const pos = positionAt(sat, pointTime);

      if (currentSegment.length > 0) {
        const prevPoint = currentSegment[currentSegment.length - 1];
        if (Math.abs(pos.mapPoint[1] - prevPoint[1]) > MAP_WIDTH / 2) {
          segments.push(currentSegment);
          currentSegment = [];
        }
      }

      currentSegment.push(pos.mapPoint);
    }

    if (currentSegment.length > 1) {
      segments.push(currentSegment);
    }

    return segments;
  }

  function buildFootprint(pos, sat) {
    const points = [];
    const lat1 = degToRad(pos.lat);
    const lon1 = degToRad(pos.lon);
    const psi = Math.acos(EARTH_RADIUS_KM / (EARTH_RADIUS_KM + sat.altitudeKm));

    for (var bearingDeg = 0; bearingDeg <= 360; bearingDeg += 8) {
      const bearing = degToRad(bearingDeg);
      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(psi) +
        Math.cos(lat1) * Math.sin(psi) * Math.cos(bearing)
      );
      const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(psi) * Math.cos(lat1),
        Math.cos(psi) - Math.sin(lat1) * Math.sin(lat2)
      );

      points.push(geoToMapPoint(radToDeg(lat2), radToDeg(lon2)));
    }

    return points;
  }

  const satObjects = satellites.map(function(sat, i) {
    const clr = colorsList[i % colorsList.length];
    const visibleByDefault = i === 0;
    const initialPosition = positionAt(sat, orbitEpoch);
    
    const icon = L.divIcon({
      className: 'satellite-custom-icon', 
      html: '<div class="sat-dot" style="background:' + clr + '; border-color:' + clr + '"></div><div class="sat-label" style="border-left: 2px solid ' + clr + '">' + sat.name + '</div>',
      iconSize: L.point(10, 10),
      iconAnchor: L.point(5, 5)
    });

    const track = L.polyline(buildGroundTrack(sat, orbitEpoch), {
      color: clr,
      weight: 2,
      opacity: 0.75,
      interactive: false
    });

    const footprint = L.polygon(buildFootprint(initialPosition, sat), {
      color: clr,
      weight: 2,
      opacity: 0.85,
      fillColor: clr,
      fillOpacity: 0.04,
      dashArray: '6 5',
      interactive: false
    });

    const marker = L.marker(initialPosition.mapPoint, { icon: icon });

    if (visibleByDefault) {
      track.addTo(map);
      footprint.addTo(map);
      marker.addTo(map);
    }

    return {
      name: sat.name,
      color: clr,
      orbit: sat,
      track: track,
      footprint: footprint,
      marker: marker,
      visible: visibleByDefault
    };
  });

  function setSatelliteVisible(sat, visible) {
    sat.visible = visible;

    if (visible) {
      if (!map.hasLayer(sat.track)) sat.track.addTo(map);
      if (!map.hasLayer(sat.footprint)) sat.footprint.addTo(map);
      if (!map.hasLayer(sat.marker)) sat.marker.addTo(map);
      return;
    }

    if (map.hasLayer(sat.track)) map.removeLayer(sat.track);
    if (map.hasLayer(sat.footprint)) map.removeLayer(sat.footprint);
    if (map.hasLayer(sat.marker)) map.removeLayer(sat.marker);
  }

  function renderSatelliteToggleSidebar() {
    const sidebar = document.querySelector('.left-panel');
    if (!sidebar) return;

    const card = L.DomUtil.create('div', 'card satellite-toggle-card', sidebar);
    const container = L.DomUtil.create('div', 'sat-toggle-control', card);
    container.innerHTML = '<div class="sat-toggle-title">SATELLITES</div>';

    satObjects.forEach(function(sat) {
      const row = L.DomUtil.create('label', 'sat-toggle-row', container);
      row.innerHTML = '<input type="checkbox"' + (sat.visible ? ' checked' : '') + '> <span style="color:' + sat.color + '">' + sat.name + '</span>';
      const input = row.querySelector('input');
      input.addEventListener('change', function() {
        setSatelliteVisible(sat, input.checked);
      });
    });
  }
  renderSatelliteToggleSidebar();

  // ======================
  // THUẬT TOÁN QUỸ ĐẠO LEO TRẢI 2D KIỂU GROUND TRACK
  // ======================
  setInterval(function() {
    satObjects.forEach(function(sat) {
      if (!sat.visible) return;

      const now = Date.now();
      const pos = positionAt(sat.orbit, now);
      sat.marker.setLatLng(pos.mapPoint);
      sat.track.setLatLngs(buildGroundTrack(sat.orbit, now));
      sat.footprint.setLatLngs(buildFootprint(pos, sat.orbit));
    });
  }, 250);

  // ======================
  // TELEMETRY REAL-TIME DATA
  // ======================
  function random(min, max) {
    return (Math.random() * (max - min) + min).toFixed(2);
  }

  function updateTelemetry() {
    const speed = random(120, 180);
    const fuel = random(40, 90);
    const signal = random(70, 100);

    const speedEl = document.querySelector(".speed");
    if (speedEl) speedEl.innerText = speed + " Mbps";

    const visibleSatObjects = satObjects.filter(function(sat) { return sat.visible; });
    const randomSat = visibleSatObjects[Math.floor(Math.random() * visibleSatObjects.length)] || satObjects[0];
    const log = document.querySelector(".log");
    if (!log) return;
    const time = formatVietnamTime(new Date());

    const msg = "[" + time + "] [" + randomSat.name + "] Downlink: " + speed + " Mbps | Nhiên liệu: " + fuel + "% | Tín hiệu: " + signal + "%";
    const div = document.createElement("div");
    div.className = "log-item";
    div.innerText = msg;

    if (signal < 75) {
      div.style.color = "#ef4444"; 
    } else if (speed > 160) {
      div.style.color = "#10b981"; 
    } else {
      div.style.color = "#3b82f6"; 
    }

    log.prepend(div);

    if (log.children.length > 20) {
      log.removeChild(log.lastChild);
    }
  }

  setInterval(updateTelemetry, 1500);
}
