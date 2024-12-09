const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let numParticles = Math.floor((canvas.width * canvas.height) / 6000);
const particlesArray = [];
const lightningBolts = [];

// Particle class
class Particle {
	constructor() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.size = Math.random() * 3 + 1;
		this.speedX = Math.random() * 2 - 1;
		this.speedY = Math.random() * 2 - 1;
		this.color = `rgba(191, 44, 44, ${Math.random() * 0.7 + 0.3})`;
	}

	update() {
		this.x += this.speedX;
		this.y += this.speedY;

		// Wrap particles around edges
		if (this.x > canvas.width) this.x = 0;
		if (this.x < 0) this.x = canvas.width;
		if (this.y > canvas.height) this.y = 0;
		if (this.y < 0) this.y = canvas.height;
	}

	draw() {
		ctx.fillStyle = this.color;
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
		ctx.closePath();
		ctx.fill();
	}
}

// Lightning bolt class
class Lightning {
	constructor() {
		this.startX = Math.random() * canvas.width;
		this.startY = Math.random() * canvas.height;
		this.segments = this.createSegments();
		this.life = 15; // Frames before the lightning disappears
	}

	createSegments() {
		let segments = [];
		let x = this.startX;
		let y = this.startY;
		let length = Math.random() * 150 + 50;

		for (let i = 0; i < 10; i++) {
			let angle = Math.random() * Math.PI * 2;
			x += Math.cos(angle) * (length / 10);
			y += Math.sin(angle) * (length / 10);
			segments.push({ x, y });
		}

		return segments;
	}

	draw() {
		ctx.strokeStyle = `rgba(191, 44, 44, ${this.life / 15})`;
		ctx.lineWidth = 2;
		ctx.shadowColor = 'rgba(255, 0, 0, 0.6)';
		ctx.shadowBlur = 10;

		ctx.beginPath();
		ctx.moveTo(this.startX, this.startY);
		for (let point of this.segments) {
			ctx.lineTo(point.x, point.y);
		}
		ctx.stroke();
		ctx.shadowBlur = 0;
	}

	update() {
		this.life--;
	}
}

// Initialize particles
function initParticles() {
	for (let i = 0; i < numParticles; i++) {
		particlesArray.push(new Particle());
	}
}

// Animate particles
function animateParticles() {
	ctx.fillStyle = 'black';
	ctx.fillRect(0, 0, canvas.width, canvas.height);

	for (let particle of particlesArray) {
		particle.update();
		particle.draw();
	}

	connectParticles();
	handleLightning();

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
				ctx.strokeStyle = `rgba(191, 44, 44, ${1 - distance / 100})`;
				ctx.lineWidth = 0.3;
				ctx.beginPath();
				ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
				ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
				ctx.stroke();
			}
		}
	}
}

// Handle lightning sparks
function handleLightning() {
	// Lightning strikes occasionally
	if (Math.random() < 0.05) {
		lightningBolts.push(new Lightning());
	}

	// Draw and update lightning bolts
	for (let i = lightningBolts.length - 1; i >= 0; i--) {
		lightningBolts[i].draw();
		lightningBolts[i].update();

		// Remove lightning bolt if its life is over
		if (lightningBolts[i].life <= 0) {
			lightningBolts.splice(i, 1);
		}
	}
}

// Adjust canvas and particle count on window resize
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	numParticles = Math.floor((canvas.width * canvas.height) / 6000);
	particlesArray.length = 0;
	initParticles();
});

// Initialize particles and start animation
initParticles();
animateParticles();
