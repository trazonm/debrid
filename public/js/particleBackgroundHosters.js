const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let numParticles = Math.floor((canvas.width * canvas.height) / 5000);
const particlesArray = [];
const energyPulses = [];

// Particle class
class Particle {
	constructor() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.size = Math.random() * 3 + 1;
		this.speedX = (Math.random() * 2 - 1) * 0.7;
		this.speedY = (Math.random() * 2 - 1) * 0.7;
		this.gradient = this.createGradient();
	}

	createGradient() {
		const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
		gradient.addColorStop(0, `rgba(1, 212, 82, 0.8)`);
		gradient.addColorStop(1, `rgba(50, 201, 75, 0.1)`);
		return gradient;
	}

	update() {
		this.x += this.speedX;
		this.y += this.speedY;

		if (this.x > canvas.width) this.x = 0;
		if (this.x < 0) this.x = canvas.width;
		if (this.y > canvas.height) this.y = 0;
		if (this.y < 0) this.y = canvas.height;
	}

	draw() {
		ctx.fillStyle = this.gradient;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
	}
}

// Energy pulse class
class EnergyPulse {
	constructor() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.maxSize = Math.random() * 40 + 20;
		this.size = 0;
		this.opacity = 1;
		this.growthRate = Math.random() * 2 + 0.5;
		this.fadeRate = 0.02;
	}

	update() {
		this.size += this.growthRate;
		this.opacity -= this.fadeRate;
	}

	draw() {
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.closePath();
		ctx.strokeStyle = `rgba(255, 69, 69, ${this.opacity})`;
		ctx.lineWidth = 1.5;
		ctx.shadowColor = `rgba(255, 0, 0, ${this.opacity})`;
		ctx.shadowBlur = 10;
		ctx.stroke();
		ctx.shadowBlur = 0;
	}
}

// Generate TV static
function generateStatic() {
	const imageData = ctx.createImageData(canvas.width, canvas.height);
	const buffer = imageData.data;

	let pixelColorConstant = 4;
	if (canvas.width > 1920) pixelColorConstant = 8;
	if (canvas.width > 3000) pixelColorConstant = 40;


	for (let i = 0; i < buffer.length; i += pixelColorConstant) {
		const gray = Math.random() * 255;
		buffer[i] = gray; // Red
		buffer[i + 1] = gray; // Green
		buffer[i + 2] = gray; // Blue

		// Occasionally add red static
		if (Math.random() < 0.01) {
			buffer[i] = Math.random() * 255; // Red channel (intense red)
			buffer[i + 1] = 0; // No green
			buffer[i + 2] = 0; // No blue
		}

		buffer[i + 3] = 40; // Alpha (semi-transparent for blending)
	}

	ctx.putImageData(imageData, 0, 0);
}

// Generate more "flimsy" red glitch shapes
function generateRedGlitch() {
    // Randomize the size of the glitch
    const glitchWidth = Math.random() * 250 + 50;
    const glitchHeight = Math.random() * 15 + 5;

    // Randomly generate the position of the glitch
    const glitchX = Math.random() * canvas.width;
    const glitchY = Math.random() * canvas.height;

    // Randomize the "squigglyness" of the glitch by adding a little curve to its shape
    ctx.fillStyle = `rgba(1, 212, 82, 0.6)`;

    // Create a squiggly shape using a curve
    ctx.beginPath();
    ctx.moveTo(glitchX, glitchY);
    for (let i = 0; i < glitchWidth; i++) {
        // Use random variations in Y to make the glitch wavy
        const yOffset = Math.random() * glitchHeight - glitchHeight / 2;
        ctx.lineTo(glitchX + i, glitchY + yOffset);
    }
    ctx.closePath();
    ctx.fill();
}

// Initialize particles
function initParticles() {
	particlesArray.length = 0;
	for (let i = 0; i < numParticles; i++) {
		particlesArray.push(new Particle());
	}
}

// Animate particles
function animateParticles() {
	ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Update and draw particles
	for (let particle of particlesArray) {
		particle.update();
		particle.draw();
	}

	connectParticles();
	handleEnergyPulses();

	// Add static effect
	generateStatic();

	// Add occasional red glitch
	if (Math.random() < 0.08) {
		generateRedGlitch();
	}

	requestAnimationFrame(animateParticles);
}

// Draw connections between particles
function connectParticles() {
	for (let a = 0; a < particlesArray.length; a++) {
		for (let b = a + 1; b < particlesArray.length; b++) {
			const dx = particlesArray[a].x - particlesArray[b].x;
			const dy = particlesArray[a].y - particlesArray[b].y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 100) {
				ctx.strokeStyle = `rgba(255, 69, 69, ${1 - distance / 100})`;
				ctx.lineWidth = 0.4;
				ctx.beginPath();
				ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
				ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
				ctx.stroke();
			}
		}
	}
}

// Handle energy pulses
function handleEnergyPulses() {
	if (Math.random() < 0.02) {
		energyPulses.push(new EnergyPulse());
	}

	// Update and draw energy pulses
	for (let i = energyPulses.length - 1; i >= 0; i--) {
		energyPulses[i].update();
		energyPulses[i].draw();

		if (energyPulses[i].opacity <= 0) {
			energyPulses.splice(i, 1);
		}
	}
}

// Adjust canvas and particle count on window resize
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	numParticles = Math.floor((canvas.width * canvas.height) / 5000);
	initParticles();
});

// Initialize particles and start animation
initParticles();
animateParticles();