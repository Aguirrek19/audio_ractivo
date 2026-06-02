let arreglo = ["Guayaba", "Mango", "Piña", "Fresa"];
let nombre = 'Juan';
let offset = 0;

const PALETTE = ['#FF5733', '#33FF57', '#3357FF', '#F333FF'];
const radio = 300;
function setup() {
    createCanvas(windowWidth, windowHeight);
    background(PALETTE[2]);
}
function draw() {
    background(PALETTE[0]); // [i] Cambia el fondo usando un color de la paleta
    //beginShape();
    noFill();
    strokeWeight(2);
    stroke(PALETTE[1]);
    for (let i = 0; i < width; i++) {
        let angle = (i * 0.02) + offset;
        let y = sin(angle) * radio + (height / 2); // [ii] Onda senoidal centrada
  //      vertex(i, y);
        rect(i, y, 1, 1);
    }
//    endShape();
    offset += 0.1; // [iii] Incrementa el offset para animar la onda
}