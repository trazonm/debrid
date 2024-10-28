const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let numParticles = Math.floor((canvas.width * canvas.height) / 3000); // Responsive particle count
const particlesArray = [];

// Particle class
class Particle {
	constructor() {
		this.x = Math.random() * canvas.width;
		this.y = Math.random() * canvas.height;
		this.size = Math.random() * 4 + 1;
		this.speedX = Math.random() * 3 - 1.5;
		this.speedY = Math.random() * 3 - 1.5;
		this.color = `rgba(106, 225, 255, ${Math.random()})`;
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

// Initialize particles
function initParticles() {
	for (let i = 0; i < numParticles; i++) {
		particlesArray.push(new Particle());
	}
}

// Animate particles
function animateParticles() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	for (let particle of particlesArray) {
		particle.update();
		particle.draw();
	}
	connectParticles();
	requestAnimationFrame(animateParticles);
}

// Draw connections between particles
function connectParticles() {
	for (let a = 0; a < particlesArray.length; a++) {
		for (let b = a; b < particlesArray.length; b++) {
			const dx = particlesArray[a].x - particlesArray[b].x;
			const dy = particlesArray[a].y - particlesArray[b].y;
			const distance = Math.sqrt(dx * dx + dy * dy);

			if (distance < 150) {
				ctx.strokeStyle = `rgba(106, 225, 255, ${1 - distance / 150})`;
				ctx.lineWidth = 0.5;
				ctx.beginPath();
				ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
				ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
				ctx.stroke();
			}
		}
	}
}

// Adjust canvas and particle count on window resize
window.addEventListener('resize', () => {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	numParticles = Math.floor((canvas.width * canvas.height) / 3000); // Recalculate particle count
	particlesArray.length = 0; // Clear current particles
	initParticles(); // Initialize new particles
});

// Initialize particles and start animation
initParticles();
animateParticles();
