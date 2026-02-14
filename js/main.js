import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

console.log("Valentine's Universe: Initializing Final v7 - Infinite Sparkles...");

// --- 1. SETUP ---
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
    duration: 1.5,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true
});
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));

const CONFIG = {
    bgStarCount: 6000,
    tinySparkleCount: 4000, // New extra layer
    floatStarCount: 1500,
    heartColor: 0xff69b4,
    bgColor: 0x05050a
};

const canvas = document.querySelector('#webgl');
const scene = new THREE.Scene();
scene.background = new THREE.Color(CONFIG.bgColor);
scene.fog = new THREE.FogExp2(CONFIG.bgColor, 0.002); // Slightly denser fog for depth

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- 2. ASSETS ---
function createHeartTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    const top = 20, size = 20;
    ctx.moveTo(32, top + size / 4);
    ctx.bezierCurveTo(32, top, 32 - size, top, 32 - size, top + size / 4);
    ctx.bezierCurveTo(32 - size, top + size / 2, 32, top + size * 0.8, 32, top + size);
    ctx.bezierCurveTo(32, top + size * 0.8, 32 + size, top + size / 2, 32 + size, top + size / 4);
    ctx.bezierCurveTo(32 + size, top, 32, top, 32, top + size / 4);
    ctx.fill();
    return new THREE.CanvasTexture(canvas);
}
const heartTexture = createHeartTexture();

function createCircleTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    return new THREE.CanvasTexture(canvas);
}
const circleTexture = createCircleTexture();

// --- 3. SCENE OBJECTS ---
// A. BG Stars (Medium)
const bgStarGeo = new THREE.BufferGeometry();
const bgStarPos = new Float32Array(CONFIG.bgStarCount * 3);
const bgStarSizes = new Float32Array(CONFIG.bgStarCount);
for (let i = 0; i < CONFIG.bgStarCount; i++) {
    bgStarPos[i * 3] = (Math.random() - 0.5) * 400; // Wider
    bgStarPos[i * 3 + 1] = (Math.random() - 0.5) * 400;
    bgStarPos[i * 3 + 2] = (Math.random() - 0.5) * 400;
    bgStarSizes[i] = Math.random();
}
bgStarGeo.setAttribute('position', new THREE.BufferAttribute(bgStarPos, 3));
bgStarGeo.setAttribute('size', new THREE.BufferAttribute(bgStarSizes, 1));
const bgStars = new THREE.Points(bgStarGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.15, transparent: true, opacity: 0.8, map: circleTexture, depthWrite: false, blending: THREE.AdditiveBlending
}));
scene.add(bgStars);

// A2. TINY SPARKLES (New Layer)
const tinyGeo = new THREE.BufferGeometry();
const tinyPos = new Float32Array(CONFIG.tinySparkleCount * 3);
for (let i = 0; i < CONFIG.tinySparkleCount; i++) {
    tinyPos[i * 3] = (Math.random() - 0.5) * 300;
    tinyPos[i * 3 + 1] = (Math.random() - 0.5) * 300;
    tinyPos[i * 3 + 2] = (Math.random() - 0.5) * 300;
}
tinyGeo.setAttribute('position', new THREE.BufferAttribute(tinyPos, 3));
const tinySparkles = new THREE.Points(tinyGeo, new THREE.PointsMaterial({
    color: 0xffffff, size: 0.08, // Very small
    transparent: true, opacity: 0.6, map: circleTexture, depthWrite: false, blending: THREE.AdditiveBlending
}));
scene.add(tinySparkles);

// B. Floating Hearts
const floatStarGeo = new THREE.BufferGeometry();
const floatStarPos = new Float32Array(CONFIG.floatStarCount * 3);
const floatStarVelocities = [];
for (let i = 0; i < CONFIG.floatStarCount; i++) {
    floatStarPos[i * 3] = (Math.random() - 0.5) * 200;
    floatStarPos[i * 3 + 1] = (Math.random() - 0.5) * 200;
    floatStarPos[i * 3 + 2] = (Math.random() - 0.5) * 200;
    floatStarVelocities.push({ y: Math.random() * 0.02 + 0.01, phase: Math.random() * Math.PI * 2 });
}
floatStarGeo.setAttribute('position', new THREE.BufferAttribute(floatStarPos, 3));
const floatStars = new THREE.Points(floatStarGeo, new THREE.PointsMaterial({
    color: 0xff69b4, size: 0.35, transparent: true, opacity: 0.6, map: heartTexture, depthWrite: false, blending: THREE.AdditiveBlending
}));
scene.add(floatStars);

// C. Path
function createHeartCurve(scale = 18) {
    const points = [];
    for (let i = -0.1; i <= Math.PI * 2 + 0.1; i += 0.05) {
        const x = 16 * Math.pow(Math.sin(i), 3);
        const y = 13 * Math.cos(i) - 5 * Math.cos(2 * i) - 2 * Math.cos(3 * i) - Math.cos(4 * i);
        const z = i * 2.5 - 5;
        points.push(new THREE.Vector3(x * scale * 0.1, y * scale * 0.1, -z * 3));
    }
    return new THREE.CatmullRomCurve3(points);
}
const heartCurve = createHeartCurve();
const pathPoints = heartCurve.getPoints(1000);
const pathLine = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pathPoints),
    new THREE.LineBasicMaterial({ color: CONFIG.heartColor, opacity: 0.6, transparent: true, linewidth: 2 })
);
scene.add(pathLine);

// D. Audio
let audio;
function initAudio() {
    if (!audio) {
        audio = new Audio('assets/music.mp3');
        audio.loop = true;
        audio.volume = 0.5;
    }
    audio.play().catch(e => console.log("Audio autoplay prevented", e));

    // Safety check for button
    const btn = document.getElementById('toggle-audio');
    if (btn) {
        // Remove old listener if any (simple way is clone or just add new and accept overhead, but better is robust check)
        // Here we just add, browser handles multiple fine usually, but cleaner to be idempotent.
        btn.onclick = () => {
            if (audio.paused) audio.play();
            else audio.pause();
        };
    }
}


// --- 4. LOGIC ---
const nodesGroup = new THREE.Group();
scene.add(nodesGroup);
let state = { timelineData: [] };
let activeCardIndex = -1;
let fateRevealed = false; // Flag to stop scroll logic interference

async function init() {
    setupListeners();

    try {
        // Changed for GitHub Pages: Fetch static file directly
        const response = await fetch('data/timeline.json');
        state.timelineData = await response.json();
    } catch (e) {
        state.timelineData = [{ date: "Start", image: "sample.png", title: "Us", note: "Start" }];
    }

    state.timelineData.forEach((item, index) => {
        const t = 0.12 + (index / state.timelineData.length) * 0.75;
        const pos = heartCurve.getPointAt(t);

        const material = new THREE.SpriteMaterial({
            map: heartTexture,
            color: 0xff1493,
            transparent: true,
            opacity: 1
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.5, 1.5, 1.5);
        sprite.position.copy(pos);
        sprite.userData = { ...item, t: t, id: index };
        nodesGroup.add(sprite);
    });
}

function setupListeners() {
    // START BUTTON
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.style.opacity = 1;
        startBtn.onclick = () => {
            // Heart Burst for Start
            createHeartBurst(new THREE.Vector3(0, 0, 5), 500, 2, 0.4);

            gsap.to('#loader', {
                opacity: 0,
                duration: 1,
                onComplete: () => {
                    const loader = document.getElementById('loader');
                    if (loader) loader.style.display = 'none';
                    initAudio();
                    gsap.to('.hero-section', { opacity: 1, duration: 2 });
                }
            });
        };
    }

    // CONNECT BUTTON (REVEAL FATE)
    const connectBtn = document.getElementById('connect-universe');
    if (connectBtn) {
        connectBtn.onclick = (e) => {
            console.log("Connect button clicked!");
            e.preventDefault();
            e.stopPropagation();

            fateRevealed = true; // LOCK scroll animations

            // Hide old button
            const finalSec = document.querySelector('.final-section');
            if (finalSec) {
                finalSec.style.opacity = '0';
                finalSec.style.pointerEvents = 'none';
                finalSec.classList.remove('visible');
            }

            // Show new message
            const endMsg = document.querySelector('.end-message');
            if (endMsg) {
                endMsg.classList.add('visible');
                endMsg.style.zIndex = "4000";
                endMsg.style.pointerEvents = "auto";
            }

            // Burst
            createHeartBurst(new THREE.Vector3(0, 0, 38), 2000, 5, 0.4);
        };
    }

    // REPLAY BUTTON
    const replayBtn = document.getElementById('replay-btn');
    if (replayBtn) {
        replayBtn.onclick = () => {
            fateRevealed = false; // Reset flag
            lenis.scrollTo(0, { duration: 3 });
            const endMsg = document.querySelector('.end-message');
            if (endMsg) endMsg.classList.remove('visible');
        };
    }
}

// 5. SCROLL
document.body.style.height = '6000px';
const proxy = { p: 0 };
gsap.to(proxy, {
    p: 1,
    ease: "none",
    scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
            const p = self.progress;
            const time = Date.now() * 0.001;

            // Hero
            const hero = document.querySelector('.hero-section');
            if (hero) {
                if (p < 0.1) hero.style.opacity = Math.max(0, 1 - (p * 10));
                else hero.style.opacity = 0;
            }

            // Camera
            if (p < 0.92) {
                const pos = heartCurve.getPointAt(p);
                const lookAt = heartCurve.getPointAt(Math.min(p + 0.02, 1));
                pos.x += Math.sin(time * 0.3) * 0.3;
                pos.y += Math.cos(time * 0.2) * 0.3;
                camera.position.lerp(pos, 0.1);
                camera.lookAt(lookAt);
                camera.rotation.z = p * Math.PI * 0.1;
            } else {
                const finalPos = new THREE.Vector3(0, 0, 45);
                camera.position.lerp(finalPos, 0.05);
                camera.lookAt(0, 0, 0);
            }

            pathLine.geometry.setDrawRange(0, Math.floor((p + 0.05) * 1000));

            // Cards
            let foundActive = false;
            nodesGroup.children.forEach(node => {
                const t = node.userData.t;
                if (Math.abs(p - t) < 0.04) {
                    if (activeCardIndex !== node.userData.id) {
                        showCard(node);
                        activeCardIndex = node.userData.id;
                        gsap.fromTo(node.scale, { x: 3, y: 3, z: 3 }, { x: 1.5, y: 1.5, z: 1.5, duration: 1 });
                    }
                    foundActive = true;
                }
            });
            if (!foundActive && activeCardIndex !== -1) {
                hideCard();
                activeCardIndex = -1;
            }

            // Final
            const finalSec = document.querySelector('.final-section');
            if (finalSec && !fateRevealed) { // Check flag!
                if (p > 0.95) finalSec.classList.add('visible');
                else finalSec.classList.remove('visible');
            }
        }
    }
});

function showCard(object) {
    const card = document.getElementById('star-card');
    if (!card) return;
    const data = object.userData;
    card.querySelector('#card-date').innerText = data.date;
    card.querySelector('#card-title').innerText = data.title;
    card.querySelector('#card-note').innerText = data.note;
    const img = card.querySelector('#card-img');
    const video = card.querySelector('#card-video');

    if (data.image) {
        if (data.image.toLowerCase().endsWith('.mp4')) {
            // It's a video
            img.style.display = 'none';
            video.src = `assets/images/${data.image}`;
            video.style.display = 'block';
            video.play().catch(e => console.log('Video play error', e));
        } else {
            // It's an image
            video.pause();
            video.style.display = 'none';
            img.src = `assets/images/${data.image}`;
            img.style.display = 'block';
        }
    }
    card.classList.add('active');
}

function hideCard() {
    const card = document.getElementById('star-card');
    if (card) card.classList.remove('active');
}


// 6. HEART BURST EFFECT (Improved)
function createHeartBurst(position = new THREE.Vector3(0, 0, 0), count = 500, spread = 3, size = 0.5) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
        positions[i * 3] = position.x;
        positions[i * 3 + 1] = position.y;
        positions[i * 3 + 2] = position.z;

        // Random spherical explosion
        const r = Math.cbrt(Math.random()) * spread; // Uniform volume distribution
        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.acos(2 * Math.random() - 1);

        const vx = r * Math.sin(phi) * Math.cos(theta);
        const vy = r * Math.sin(phi) * Math.sin(theta);
        const vz = r * Math.cos(phi);

        velocities.push({ x: vx, y: vy, z: vz });
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
        color: 0xff1493, // Deep Pink
        size: size,
        transparent: true,
        map: heartTexture,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });
    const burst = new THREE.Points(geo, mat);
    scene.add(burst);

    let t = 0;
    function animateBurst() {
        t += 0.01;
        const pos = burst.geometry.attributes.position.array;
        for (let i = 0; i < count; i++) {
            // Expand
            pos[i * 3] += velocities[i].x * 0.1;
            pos[i * 3 + 1] += velocities[i].y * 0.1;
            pos[i * 3 + 2] += velocities[i].z * 0.1;
        }
        burst.geometry.attributes.position.needsUpdate = true;
        mat.opacity = 1 - t; // Fade out
        if (t < 1) requestAnimationFrame(animateBurst);
        else scene.remove(burst);
    }
    animateBurst();
}

// 7. LOOP
function animate() {
    const time = Date.now() * 0.001;
    bgStars.rotation.y = time * 0.01;

    const floatPos = floatStars.geometry.attributes.position.array;
    for (let i = 0; i < CONFIG.floatStarCount; i++) {
        floatPos[i * 3 + 1] += floatStarVelocities[i].y;
        if (floatPos[i * 3 + 1] > 100) floatPos[i * 3 + 1] = -100;
        floatPos[i * 3] += Math.sin(time + floatStarVelocities[i].phase) * 0.02;
    }
    floatStars.geometry.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

init();
animate();
