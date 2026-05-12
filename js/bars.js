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
  background(0);   
    const spectrum = barsFft.analyze();
    const level = barsAmplitude.getLevel();

    const margin = width *0.8;
    const availableWidth = width - margin*2;
    const barWidth = availableWidth / spectrum.length;

    for (let i = 0; i < spectrum.length; i++) {
        const x = margin + i * barWidth;
        const energy = spectrum[i];
        const circleSize = map(energy, 0, 255, 10, 100) * (level + 0.8); // Tamaño del círculo basado en la energía y el nivel de amplitud
        fill(map(energy, 0, 255, 50, 255), 100, 255); // Color basado en la energía
        noStroke();
        ellipse(x + barWidth/2, height/2, barWidth * 0.8, circleSize);


        /*const barHeight = map(energy, 0, 255, 0, height * 0.42);
        fill (255, 255, 255);
        rect (x, height/2 - barHeight, barWidth * 0.8, barHeight);
        rect (x, height/2, barWidth * 0.8, barHeight);
        */
    }


}