let soundFile;
let amplitude;
let fft;

// Sistema celular
let cells = [];
const NUM_CELLS = 12;
const CELL_REGENERATION_TIME = 24000; // 24 segundos para regenerar

// Control de tiempo
let lastRegenerationTime = 0;
let isRegenerating = false;
let regenerationStartTime = 0;
const regenerationDuration = 1500;

// Control de aparición progresiva
let cellsVisible = 0;
let lastCellAppearance = 0;
const cellAppearanceInterval = 1500;
const CURSOR_ATTRACTION_RADIUS = 420;
const CURSOR_ATTRACTION_STRENGTH = 0.4;

function preload() {
    soundFile = loadSound('./audio/butterfly.mp3');
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // Inicializar análisis de audio
    amplitude = new p5.Amplitude();
    fft = new p5.FFT();
    amplitude.setInput(soundFile);
    fft.setInput(soundFile);
    
    // Crear el sistema celular
    initializeCellularSystem();
    
    // Iniciar reproducción
    soundFile.loop();
    lastRegenerationTime = millis();
    
    textAlign(CENTER, CENTER);
}

function initializeCellularSystem() {
    cells = [];
    cellsVisible = 0;
    
    // Crear células madre (posiciones centrales)
    let centerX = width / 2;
    let centerY = height / 2;
    
    for (let i = 0; i < NUM_CELLS; i++) {
        let cell = {
            // Posición base (centro de la célula)
            baseX: random(width * 0.2, width * 0.8),
            baseY: random(height * 0.2, height * 0.8),
            
            // Posición actual (con movimiento orgánico)
            x: 0,
            y: 0,
            
            // Tamaño y salud de la célula
            size: random(60, 120),
            health: random(0.7, 1.0),
            
            // Movimiento orgánico
            noiseOffsetX: random(1000),
            noiseOffsetY: random(2000),
            noiseSpeed: random(0.001, 0.003),
            
            // Estrellas dentro de la célula
            stars: [],
            numStars: floor(random(5, 10)),
            
            // Color de la célula
            hue: random(200, 280), // Azul a púrpura
            
            // Edad y ciclo de vida
            age: 0,
            maxAge: random(20000, 30000),
            
            // Conexiones
            connections: [],
            
            // Pulsación
            pulsePhase: random(TWO_PI),
            pulseSpeed: random(0.02, 0.05),
            audioScale: 1
        };
        
        // Inicializar posición
        cell.x = cell.baseX;
        cell.y = cell.baseY;
        
        // Crear estrellas dentro de la célula
        for (let j = 0; j < cell.numStars; j++) {
            let angle = random(TWO_PI);
            let distance = random(cell.size * 0.3, cell.size * 0.8);
            
            cell.stars.push({
                offsetX: cos(angle) * distance,
                offsetY: sin(angle) * distance,
                baseOffsetX: cos(angle) * distance,
                baseOffsetY: sin(angle) * distance,
                size: random(5, 15),
                rotationSpeed: random(-0.02, 0.02),
                rotation: random(TWO_PI)
            });
        }
        
        cells.push(cell);
    }
    
    // Establecer conexiones entre células cercanas
    establishConnections();
}

function establishConnections() {
    for (let i = 0; i < cells.length; i++) {
        cells[i].connections = [];
        for (let j = i + 1; j < cells.length; j++) {
            let d = dist(cells[i].baseX, cells[i].baseY, cells[j].baseX, cells[j].baseY);
            if (d < 250) {
                cells[i].connections.push(j);
                cells[j].connections.push(i);
            }
        }
    }
}

function draw() {
    // Fondo orgánico
    drawCellularBackground();
    
    // Control de regeneración celular
    if (millis() - lastRegenerationTime >= CELL_REGENERATION_TIME && !isRegenerating) {
        startRegeneration();
    }
    
    // Animación de regeneración
    if (isRegenerating) {
        updateRegeneration();
    }
    
    // Aparición progresiva de células
    if (!isRegenerating) {
        if (millis() - lastCellAppearance >= cellAppearanceInterval && cellsVisible < cells.length) {
            cellsVisible++;
            lastCellAppearance = millis();
        }
    }
    
    // Obtener datos de audio
    let level = amplitude.getLevel();
    let spectrum = fft.analyze();
    
    // Actualizar y dibujar el sistema celular
    updateCellularSystem(level, spectrum);
    drawCellularConnections(level);
    drawCells(level, spectrum);
}

function drawCellularBackground() {
    // Fondo con patrón celular orgánico
    noStroke();
    for (let i = 0; i < width; i += 3) {
        for (let j = 0; j < height; j += 3) {
            let noiseVal = noise(i * 0.005, j * 0.005, millis() * 0.0001);
            let r = lerp(10, 25, noiseVal);
            let g = lerp(2, 8, noiseVal);
            let b = lerp(40, 70, noiseVal);
            fill(r, g, b, 150);
            rect(i, j, 3, 3);
        }
    }
}

function updateCellularSystem(level, spectrum) {
    for (let i = 0; i < cells.length; i++) {
        let cell = cells[i];
        
        // Movimiento orgánico usando ruido Perlin
        let noiseX = noise(cell.noiseOffsetX + millis() * cell.noiseSpeed);
        let noiseY = noise(cell.noiseOffsetY + millis() * cell.noiseSpeed);
        
        let organicX = cell.baseX + map(noiseX, 0, 1, -30, 30);
        let organicY = cell.baseY + map(noiseY, 0, 1, -30, 30);
        let cursorDistance = dist(organicX, organicY, mouseX, mouseY);
        let cursorPull = constrain(map(cursorDistance, 0, CURSOR_ATTRACTION_RADIUS, 1, 0), 0, 1);
        cursorPull *= CURSOR_ATTRACTION_STRENGTH;
        
        cell.x = lerp(organicX, mouseX, cursorPull);
        cell.y = lerp(organicY, mouseY, cursorPull);
        
        // Actualizar edad
        cell.age += deltaTime;
        cell.health = map(cell.age, 0, cell.maxAge, 1.0, 0.3);
        
        // Pulsación basada en audio
        let pulseAmount = sin(cell.pulsePhase + millis() * cell.pulseSpeed) * 0.5 + 0.5;
        let volumeBoost = constrain(map(level, 0, 0.25, 0, 1), 0, 1);
        let targetScale = 0.8 + volumeBoost * 1.8 + pulseAmount * volumeBoost * 0.35;
        cell.audioScale = lerp(cell.audioScale, targetScale, 0.18);
        cell.currentPulse = pulseAmount * volumeBoost;
        
        // Actualizar posiciones de estrellas dentro de la célula
        for (let j = 0; j < cell.stars.length; j++) {
            let star = cell.stars[j];
            let starNoise = noise(cell.noiseOffsetX + j * 100, millis() * 0.001);
            
            star.offsetX = star.baseOffsetX + map(starNoise, 0, 1, -10, 10);
            star.offsetY = star.baseOffsetY + map(starNoise, 0, 1, -10, 10);
            star.rotation += star.rotationSpeed;
        }
        
        // Actualizar conexiones
        cell.connections = [];
        for (let j = 0; j < cells.length; j++) {
            if (i !== j) {
                let d = dist(cell.x, cell.y, cells[j].x, cells[j].y);
                if (d < 250) {
                    cell.connections.push(j);
                }
            }
        }
    }
}

function drawCellularConnections(level) {
    // Dibujar conexiones entre células como membranas
    strokeWeight(1.5);
    
    for (let i = 0; i < cells.length; i++) {
        if (i >= cellsVisible && !isRegenerating) continue;
        
        let cell = cells[i];
        let alpha = map(cell.health, 0.3, 1.0, 20, 80);
        
        for (let j = 0; j < cell.connections.length; j++) {
            let connectedCell = cells[cell.connections[j]];
            if (cell.connections[j] >= cellsVisible && !isRegenerating) continue;
            
            let d = dist(cell.x, cell.y, connectedCell.x, connectedCell.y);
            let connectionAlpha = map(d, 0, 250, alpha, 0);
            
            // Color de conexión basado en promedio de colores
            let avgHue = (cell.hue + connectedCell.hue) / 2;
            colorMode(HSB, 360, 100, 100, 100);
            stroke(avgHue, 70, 80, connectionAlpha);
            
            // Dibujar conexión ondulada
            drawMembraneConnection(cell.x, cell.y, connectedCell.x, connectedCell.y, d);
        }
    }
    
    colorMode(RGB, 255);
}

function drawMembraneConnection(x1, y1, x2, y2, distance) {
    noFill();
    beginShape();
    
    let segments = 10;
    for (let i = 0; i <= segments; i++) {
        let t = i / segments;
        let x = lerp(x1, x2, t);
        let y = lerp(y1, y2, t);
        
        // Ondulación perpendicular
        let perpAngle = atan2(y2 - y1, x2 - x1) + PI/2;
        let wave = sin(t * TWO_PI * 3 + millis() * 0.002) * 5;
        
        x += cos(perpAngle) * wave;
        y += sin(perpAngle) * wave;
        
        vertex(x, y);
    }
    
    endShape();
}

function drawCells(level, spectrum) {
    for (let i = 0; i < cells.length; i++) {
        if (i >= cellsVisible && !isRegenerating) continue;
        
        let cell = cells[i];
        let alpha = isRegenerating ? map(getRegenerationProgress(), 0, 1, 255, 0) : 255;
        
        // Dibujar membrana celular
        drawCellMembrane(cell, level, alpha);
        
        // Dibujar núcleo
        drawCellNucleus(cell, level, alpha);
        
        // Dibujar estrellas dentro de la célula
        drawCellStars(cell, level, spectrum, alpha);
    }
}

function drawCellMembrane(cell, level, alpha) {
    let membraneSize = cell.size * cell.audioScale;
    let healthAlpha = map(cell.health, 0.3, 1.0, 20, 60) * (alpha / 255);
    
    // Membrana exterior difusa
    noStroke();
    colorMode(HSB, 360, 100, 100, 100);
    fill(cell.hue, 50, 70, healthAlpha * 0.5);
    ellipse(cell.x, cell.y, membraneSize * 1.3, membraneSize * 1.3);
    
    // Membrana principal
    stroke(cell.hue, 70, 90, healthAlpha);
    strokeWeight(2);
    noFill();
    ellipse(cell.x, cell.y, membraneSize, membraneSize);
    
    // Membrana interior
    stroke(cell.hue, 60, 80, healthAlpha * 0.7);
    strokeWeight(1);
    ellipse(cell.x, cell.y, membraneSize * 0.8, membraneSize * 0.8);
    
    colorMode(RGB, 255);
}

function drawCellNucleus(cell, level, alpha) {
    let nucleusSize = cell.size * 0.3 * cell.audioScale + cell.currentPulse * 10;
    let healthAlpha = map(cell.health, 0.3, 1.0, 30, 100) * (alpha / 255);
    
    // Núcleo brillante
    noStroke();
    colorMode(HSB, 360, 100, 100, 100);
    fill(cell.hue + 20, 80, 100, healthAlpha);
    ellipse(cell.x, cell.y, nucleusSize, nucleusSize);
    
    // Centro del núcleo
    fill(255, 255, 255, healthAlpha * 0.8);
    ellipse(cell.x, cell.y, nucleusSize * 0.4, nucleusSize * 0.4);
    
    colorMode(RGB, 255);
}

function drawCellStars(cell, level, spectrum, alpha) {
    for (let j = 0; j < cell.stars.length; j++) {
        let star = cell.stars[j];
        let starX = cell.x + star.offsetX;
        let starY = cell.y + star.offsetY;
        
        // Tamaño de estrella basado en audio
        let baseSize = star.size;
        let maxSize = 20;
        let volumeScale = map(level, 0, 0.5, 1, 4);
        volumeScale = min(volumeScale, maxSize / baseSize);
        
        // Variación por frecuencia
        let freqIndex = floor(map(j, 0, cell.stars.length + cells.length, 0, spectrum.length - 1));
        let freqValue = spectrum[freqIndex] / 255;
        let freqScale = map(freqValue, 0, 1, 0.5, 2);
        
        let starSize = baseSize * volumeScale * freqScale * cell.health;
        
        // Color basado en la célula madre
        colorMode(HSB, 360, 100, 100, 100);
        let starHue = (cell.hue + j * 10) % 360;
        let starBrightness = map(level, 0, 0.5, 60, 100);
        
        // Dibujar estrella
        let starAlpha = alpha * cell.health;
        drawWindRoseStar(starX, starY, starSize, starHue, 70, starBrightness, starAlpha);
        
        // Pequeño glow
        drawWindRoseStar(starX, starY, starSize * 1.5, starHue, 50, starBrightness, starAlpha * 0.3);
    }
    
    colorMode(RGB, 255);
}

function drawWindRoseStar(x, y, size, hue, sat, bri, alpha) {
    noStroke();
    fill(hue, sat, bri, alpha);
    
    push();
    translate(x, y);
    
    beginShape();
    for (let i = 0; i < 8; i++) {
        let angle = (TWO_PI / 8) * i - PI/2;
        let radius;
        
        if (i % 2 === 0) {
            radius = size;
        } else {
            radius = size * 0.5;
        }
        
        let px = cos(angle) * radius;
        let py = sin(angle) * radius;
        vertex(px, py);
    }
    endShape(CLOSE);
    
    pop();
}

function startRegeneration() {
    isRegenerating = true;
    regenerationStartTime = millis();
    lastRegenerationTime = millis();
}

function updateRegeneration() {
    let progress = getRegenerationProgress();
    
    if (progress >= 1) {
        // Regenerar todo el sistema celular
        initializeCellularSystem();
        isRegenerating = false;
        lastCellAppearance = millis();
    }
}

function getRegenerationProgress() {
    return (millis() - regenerationStartTime) / regenerationDuration;
}

function mousePressed() {
    if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height) {
        togglePlayback();
    }
    return false;
}

function togglePlayback() {
    if (soundFile.isPlaying()) {
        soundFile.pause();
        fill(255, 255, 255, 100);
        noStroke();
        textAlign(CENTER, CENTER);
        textSize(48);
        text("⏸️", width/2, height/2);
    } else {
        soundFile.loop();
        lastRegenerationTime = millis();
        lastCellAppearance = millis();
        if (isRegenerating) {
            isRegenerating = false;
        }
    }
}

function keyPressed() {
    if (key === ' ') {
        togglePlayback();
        return false;
    }
    
    if (key === 'r' || key === 'R') {
        startRegeneration();
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    initializeCellularSystem();
}

window.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
    }
});
