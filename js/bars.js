//audio
const BARS_AUDIO_PATH = "../audio/butterfly.mp3";
let barsSong;
let barsFft; 
let barsAmplitude;
const barBins = 64; // Número de barras (bins) para el espectro

function preload() {
  soundFormats('mp3');
  barsSong = loadSound(BARS_AUDIO_PATH);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  barsFft = new p5.FFT(0.8, barBins);
  barsFft.setInput(barsSong);
  barsAmplitude = new p5.Amplitude();
  barsAmplitude.setInput(barsSong);
  barsSong.play();  
}

function draw() {
  background(189, 210, 255);   
    const spectrum = barsFft.analyze();
    const level = barsAmplitude.getLevel();

    const numCircles = 30;
    const availableWidth = width;
    const barWidth = availableWidth / numCircles;

    for (let i = 0; i < Math.min(numCircles, spectrum.length); i++) {
        const x = i * barWidth;
        const energy = spectrum[i];
        const circleSize = map(energy, 0, 255, 10, 200) * (level + 0.8); // Tamaño del círculo basado en la energía y el nivel de amplitud
        fill(map(energy, 0, 255, 50, 255), 100, 255); // Color basado en la energía
        noStroke();
        ellipse(x + barWidth / 2, height / 2, barWidth * 0.8, circleSize + 25); // Círculo con tamaño variable y posición ligeramente aleatoria para efecto dinámico
    }


}