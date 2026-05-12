let mic;
let time = 0;

function setup() {
  createCanvas(windowWidth, windowHeight); 
  mic = new p5.AudioIn();
  mic.start();
}

function draw() {
  background(0);
  let vol = mic.getLevel();
  
  // Amplificar el volumen para que sea más sensible (multiplica por 5 para mayor sensibilidad)
  let amplitud = vol * 200;
  
  stroke(100, 200, 255);
  strokeWeight(2);
  noFill();
  
  // Dibujar la onda
  beginShape();
  for (let x = 0; x < width; x += 10) {
    // Crear múltiples ondas superpuestas para efecto más interesante
    let y1 = height / 2 + sin(x * 0.01 + time * 0.05) * amplitud;
    let y2 = height / 2 + sin(x * 0.005 + time * 0.03) * amplitud * 0.7;
    let y = y1 + y2;
    vertex(x, y);
  }
  endShape(255);
  
  // Mostrar el nivel de volumen en pantalla
  fill(255);
  textSize(20);
  text('Volumen: ' + nf(vol, 0, 2), 20, 40);
  
  time += 1;
}