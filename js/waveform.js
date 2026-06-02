const BARS_AUDIO_PATH = "../audio/butterfly.mp3";
let forma;
let mic;
let fft;
let suavizado = 0.8;

function setup() {
  createCanvas(800, 600);
  
  // Inicializar audio
  mic = new p5.AudioIn();
  mic.start();
  
  // Configurar FFT para análisis de frecuencia
  fft = new p5.FFT(suavizado, 64);
  fft.setInput(mic);
  
  // Crear la forma rectangular orgánica
  forma = new FormaOrganica(width/2, height/2, 300, 200);
}

function draw() {
  background(20, 20, 30, 25);
  
  // Analizar el espectro de frecuencia
  let spectrum = fft.analyze();
  
  // Obtener niveles de audio
  let nivelGraves = fft.getEnergy("bass");
  let nivelMedios = fft.getEnergy("mid");
  let nivelAgudos = fft.getEnergy("treble");
  let volumen = mic.getLevel();
  
  // Actualizar y dibujar la forma
  forma.actualizar(spectrum, nivelGraves, nivelMedios, nivelAgudos, volumen);
  forma.dibujar();
  
  // Mostrar información de audio
  mostrarInfoAudio(nivelGraves, nivelMedios, nivelAgudos, volumen);
}

class FormaOrganica {
  constructor(x, y, ancho, alto) {
    this.x = x;
    this.y = y;
    this.ancho = ancho;
    this.alto = alto;
    this.puntos = [];
    this.numPuntos = 8; // Número de puntos de control
    this.inicializarPuntos();
  }
  
  inicializarPuntos() {
    for (let i = 0; i < this.numPuntos; i++) {
      let angulo = (TWO_PI / this.numPuntos) * i;
      let px = this.x + cos(angulo) * this.ancho/2;
      let py = this.y + sin(angulo) * this.alto/2;
      this.puntos.push({
        x: px,
        y: py,
        originalX: px,
        originalY: py,
        desplazamientoX: 0,
        desplazamientoY: 0,
        velocidadX: random(0.01, 0.05),
        velocidadY: random(0.01, 0.05)
      });
    }
  }
  
  actualizar(spectrum, graves, medios, agudos, volumen) {
    let tiempo = millis() * 0.001;
    
    for (let i = 0; i < this.puntos.length; i++) {
      let punto = this.puntos[i];
      let angulo = (TWO_PI / this.numPuntos) * i;
      
      // Obtener valor del espectro para este punto
      let indiceEspectro = floor(map(i, 0, this.numPuntos, 0, spectrum.length - 1));
      let valorEspectro = spectrum[indiceEspectro] / 255;
      
      // Diferentes tipos de distorsión según la frecuencia
      let distorsionGraves = sin(tiempo * 2 + i) * graves * 0.02;
      let distorsionMedios = cos(tiempo * 1.5 + i * 1.3) * medios * 0.015;
      let distorsionAgudos = sin(tiempo * 3 + i * 0.7) * agudos * 0.01;
      
      // Movimiento orgánico base
      let movimientoOrganico = noise(tiempo * 0.5 + i * 0.5, i) * 2 - 1;
      
      // Combinar todas las distorsiones
      let distorsionTotal = (distorsionGraves + distorsionMedios + distorsionAgudos) * (1 + volumen * 5);
      
      // Actualizar desplazamiento con suavizado
      punto.desplazamientoX = lerp(
        punto.desplazamientoX,
        distorsionTotal * 100 + movimientoOrganico * 10 + valorEspectro * 50,
        0.1
      );
      
      punto.desplazamientoY = lerp(
        punto.desplazamientoY,
        distorsionTotal * 80 + movimientoOrganico * 15 + valorEspectro * 40,
        0.1
      );
      
      // Aplicar desplazamiento perpendicular a la forma
      let normalX = cos(angulo);
      let normalY = sin(angulo);
      
      punto.x = punto.originalX + normalX * punto.desplazamientoX;
      punto.y = punto.originalY + normalY * punto.desplazamientoY;
    }
  }
  
  dibujar() {
    push();
    noFill();
    
    // Dibujar múltiples capas para efecto orgánico
    for (let capa = 3; capa >= 0; capa--) {
      let opacidad = map(capa, 0, 3, 100, 255);
      let grosor = map(capa, 0, 3, 1, 4);
      
      strokeWeight(grosor);
      
      // Gradiente de color basado en el audio
      let colorR = map(cos(millis() * 0.001), -1, 1, 100, 255);
      let colorG = map(sin(millis() * 0.0015), -1, 1, 100, 200);
      let colorB = map(cos(millis() * 0.002), -1, 1, 200, 255);
      
      stroke(colorR, colorG, colorB, opacidad);
      
      beginShape();
      
      // Crear curva suave usando curveVertex
      for (let i = 0; i < this.puntos.length + 3; i++) {
        let indice = i % this.puntos.length;
        let punto = this.puntos[indice];
        
        // Añadir pequeña variación adicional
        let offsetX = (noise(i * 0.3, millis() * 0.001) - 0.5) * capa * 5;
        let offsetY = (noise(i * 0.3 + 100, millis() * 0.001) - 0.5) * capa * 5;
        
        curveVertex(punto.x + offsetX, punto.y + offsetY);
      }
      
      endShape(CLOSE);
    }
    
    // Dibujar puntos de control (opcional)
    if (mouseIsPressed) {
      fill(255, 100);
      noStroke();
      for (let punto of this.puntos) {
        ellipse(punto.x, punto.y, 8, 8);
      }
    }
    
    pop();
  }
}

function mostrarInfoAudio(graves, medios, agudos, volumen) {
  push();
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(12);
  
  text(`Graves: ${graves.toFixed(2)}`, 10, 10);
  text(`Medios: ${medios.toFixed(2)}`, 10, 30);
  text(`Agudos: ${agudos.toFixed(2)}`, 10, 50);
  text(`Volumen: ${(volumen * 100).toFixed(2)}%`, 10, 70);
  
  // Barras de nivel
  let barraX = 150;
  dibujarBarra(barraX, 15, graves, color(255, 0, 0));
  dibujarBarra(barraX, 35, medios, color(0, 255, 0));
  dibujarBarra(barraX, 55, agudos, color(0, 0, 255));
  dibujarBarra(barraX, 75, volumen * 255, color(255, 255, 0));
  
  pop();
}

function dibujarBarra(x, y, valor, col) {
  push();
  noStroke();
  fill(col);
  rect(x, y, valor, 15);
  pop();
}

// Funciones de interacción
function mousePressed() {
  // Reiniciar forma al hacer clic
  forma = new FormaOrganica(width/2, height/2, 300, 200);
}

function keyPressed() {
  if (key === 'r' || key === 'R') {
    // Reiniciar forma
    forma = new FormaOrganica(width/2, height/2, 300, 200);
  }
}