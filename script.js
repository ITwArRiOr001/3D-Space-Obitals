// Pre-Loading and Loading Screen
const preLoadingScreen = document.getElementById('preLoadingScreen');
const proceedButton = document.getElementById('proceedButton');
const loadingScreen = document.getElementById('loadingScreen');
const loadingCanvas = document.getElementById('loadingCanvas');
const mainScene = document.getElementById('mainScene') || document.body;
// Transition State Management
let isTransitioning = false;

// Initialize THREE.js for loading screen
const loadingScene = new THREE.Scene();
const loadingCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const loadingRenderer = new THREE.WebGLRenderer({ canvas: loadingCanvas, alpha: true });

// Check WebGL context
if (!loadingRenderer.getContext()) {
    console.error('WebGL not supported for loadingRenderer');
    alert('WebGL is not supported for the loading canvas.');
}
loadingRenderer.setSize(window.innerWidth, window.innerHeight);
loadingCamera.position.set(0, 0, 5);
console.log('Loading renderer initialized:', loadingRenderer.domElement);

// 🎧 Loading Screen Sound
const loadingAudio = new Audio('assets/sounds/smooth-vibe-music-loop-alternate-95804.mp3');
loadingAudio.volume = 0.7;
loadingAudio.loop = false;
loadingAudio.preload = 'auto';
console.log('Loading audio initialized:', loadingAudio.src);

// Star ring setup
const starCount = 800;
const ringRadius = 1.6;
const starGeometry = new THREE.BufferGeometry();
const starPositions = new Float32Array(starCount * 3);
const starOpacities = new Float32Array(starCount);
const starPhases = new Float32Array(starCount);

for (let i = 0; i < starCount; i++) {
    const angle = (i / starCount) * Math.PI * 2;
    starPositions[i * 3] = Math.cos(angle) * ringRadius;
    starPositions[i * 3 + 1] = Math.sin(angle) * ringRadius;
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    starOpacities[i] = 0;
    starPhases[i] = Math.random() * Math.PI * 2;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));
starGeometry.setAttribute('phase', new THREE.BufferAttribute(starPhases, 1));

const starMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, progress: { value: 0 } },
    vertexShader: `
    attribute float opacity;
    attribute float phase;
    uniform float time;
    uniform float progress;
    varying float vOpacity;
    varying float vSize;
    void main() {
      vOpacity = opacity * (0.8 + 0.4 * sin(time + phase));
      vSize = 0.2 + 0.15 * sin(time + phase);
      gl_PointSize = vSize * 30.0;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    varying float vOpacity;
    void main() {
      float t = sin(vOpacity * 3.14) * 0.2 + 0.8;
      gl_FragColor = vec4(t, t * 0.83, 1.0, vOpacity);
    }
  `,
    transparent: true,
    blending: THREE.AdditiveBlending
});

const starRing = new THREE.Points(starGeometry, starMaterial);
loadingScene.add(starRing);
console.log('Star ring added to loading scene:', starRing);

function updateStarRing(progress) {
    const visibleStars = Math.floor(starCount * progress);
    for (let i = 0; i < starCount; i++) {
        starOpacities[i] = i < visibleStars ? 1 : 0;
    }
    starGeometry.setAttribute('opacity', new THREE.BufferAttribute(starOpacities, 1));
    console.log('Star ring updated with progress:', progress, 'visible stars:', visibleStars);
}

// 🌠 Create Particle Elements
const particles = [];
for (let i = 0; i < 150; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.width = `2px`;
    particle.style.height = `${Math.random() * 20 + 10}px`;
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDuration = `${Math.random() * 0.4 + 0.2}s`;
    particle.style.animationDelay = `${Math.random() * 2}s`;
    loadingScreen.appendChild(particle);
    particles.push(particle);
}
console.log('Particles created and appended:', particles.length);

let time = 0;
let loadingAnimationId = null;

function animateLoading() {
    if (!loadingScreen.classList.contains('slide-in')) {
        if (loadingAnimationId) {
            cancelAnimationFrame(loadingAnimationId);
            loadingAnimationId = null;
        }
        if (loadingAudio && !loadingAudio.paused) {
            loadingAudio.pause();
            loadingAudio.currentTime = 0;
            console.log('Loading audio paused');
        }
        return;
    }
    
    loadingAnimationId = requestAnimationFrame(animateLoading);
    time += 0.012;
    starMaterial.uniforms.time.value = time;
    starRing.rotation.z += 0.012;
    starRing.scale.setScalar(1 + 0.1 * Math.sin(time));
    loadingRenderer.render(loadingScene, loadingCamera);
}

// Smooth transition functions
function slideToLoadingScreen() {
    if (isTransitioning) return;
    isTransitioning = true;
    
    // Disable button to prevent multiple clicks
    proceedButton.disabled = true;
    
    console.log('Starting transition to loading screen');
    
    // Slide out preloading screen and slide in loading screen
    preLoadingScreen.classList.add('slide-out');
    loadingScreen.classList.add('slide-in');
    
    // Start loading screen animations after slide transition begins
    setTimeout(() => {
        if (loadingAudio && loadingAudio.paused) {
            loadingAudio.play().then(() => {
                console.log('Loading audio started');
            }).catch(error => {
                console.error('Loading audio play failed:', error.message);
            });
        }
        animateLoading();
    }, 200); // Start animations 200ms into the slide transition
}

function slideToMainScene() {
    console.log('Starting transition to main scene');
    
    // Slide out loading screen and slide in main scene
    loadingScreen.classList.remove('slide-in');
    loadingScreen.classList.add('slide-out');
    
    // If mainScene div exists, slide it in
    if (document.getElementById('mainScene')) {
        mainScene.classList.add('slide-in');
    }
    
    // Clean up loading screen after transition
    setTimeout(() => {
        particles.forEach(p => p.remove());
        if (loadingAudio && !loadingAudio.paused) {
            loadingAudio.pause();
            loadingAudio.currentTime = 0;
            console.log('Loading audio paused on main scene transition');
        }
        
        // Start main scene audio
        if (mainAudio) {
            mainAudio.play().catch(e => console.warn('Main sound playback failed:', e));
        }
        
        isTransitioning = false;
    }, 1000); // Wait for visual transition to finish
}

// Transition from Pre-Loading to Loading Screen
proceedButton.addEventListener('click', slideToLoadingScreen);

// =====================
// 🌌 Main Scene Setup
// =====================
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 5, 10000);
camera.position.set(10, 3, 180);

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    preserveDrawingBuffer: true
});
renderer.setClearColor(0x000000, 1);

// Check WebGL context for main renderer
if (!renderer.getContext()) {
    console.error('WebGL not supported for main renderer');
    alert('WebGL is not supported for the main scene.');
}

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000, 0);

if (document.getElementById('mainScene')) {
    document.getElementById('mainScene').appendChild(renderer.domElement);
} else {
    document.body.appendChild(renderer.domElement);
}
console.log('Main renderer initialized:', renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.15;
controls.minDistance = 0.4;
controls.maxDistance = 10000;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = 3 * Math.PI / 4;

scene.add(new THREE.AmbientLight(0x404040, 0.2));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
directionalLight.position.set(0, 0, 0);
scene.add(directionalLight);
console.log('Main scene lights added');

// 🎧 Main Scene Background Audio (Looped)
const mainAudio = new Audio('assets/sounds/spaceship-transmitter-hum-epic-stock-media-1-00-13.mp3');
mainAudio.volume = 0.2;
mainAudio.loop = true;
console.log('Main audio initialized:', mainAudio.src);

// =====================
// 📦 Loading Manager
// =====================
const loadingManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadingManager);
let isLoading = true;

loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
    updateStarRing(itemsLoaded / itemsTotal);
    console.log('Loading progress:', itemsLoaded, '/', itemsTotal, 'URL:', url);
};

loadingManager.onLoad = () => {
    console.log('Loading manager onLoad triggered');
    const minLoadingTime = 5000; // 3 seconds minimum loading time
    const startTime = Date.now();
    
    // Ensure minimum loading time, then transition to main scene
    setTimeout(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minLoadingTime) {
            slideToMainScene();
            isLoading = false;
        } else {
            setTimeout(() => {
                slideToMainScene();
                isLoading = false;
            }, minLoadingTime - elapsed);
        }
    }, 400); // Small delay to ensure smooth transition
};

// ⏱️ Fallback Timeout (15 seconds)
setTimeout(() => {
    if (isLoading && loadingScreen.classList.contains('slide-in')) {
        console.log('Fallback timeout triggered');
        slideToMainScene();
        isLoading = false;
    }
}, 15000);

// Handle window resize
window.addEventListener('resize', () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Update main camera and renderer
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Update loading camera and renderer
    loadingCamera.aspect = width / height;
    loadingCamera.updateProjectionMatrix();
    loadingRenderer.setSize(width, height);
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (loadingAudio && !loadingAudio.paused) {
        loadingAudio.pause();
    }
    if (mainAudio && !mainAudio.paused) {
        mainAudio.pause();
    }
});

// Navigation Audio
window.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const openSound = new Audio('assets/sounds/mixkit-sword-blade-swish-1506.wav');
    const closeSound = new Audio('assets/sounds/mixkit-ui-zoom-out-2619.wav');
    console.log('Navigation audio initialized:', openSound.src, closeSound.src);
    
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            const isOpen = navToggle.classList.toggle('active');
            if (isOpen) {
                openSound.currentTime = 0;
                openSound.play().catch(e => console.warn('Open sound playback failed:', e));
            } else {
                closeSound.currentTime = 0;
                closeSound.play().catch(e => console.warn('Close sound playback failed:', e));
            }
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            if (navMenu) {
                navMenu.classList.toggle('visible');
            }
            console.log('Nav toggle clicked, isOpen:', isOpen);
        });
    }
});
// Navigation
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');
navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    navMenu.classList.toggle('open');
});

let activeView = null;
let isInteracting = false;
let cameraOffset = new THREE.Vector3();
let lastTargetPosition = new THREE.Vector3();
let showOrbits = true;
let showLabels = false;

controls.addEventListener('start', () => {
    isInteracting = true;
});

controls.addEventListener('end', () => {
    isInteracting = false;
    if (activeView === 'moon' && moon) cameraOffset.copy(camera.position).sub(moon.position);
    else if (activeView === 'earth' && earth) cameraOffset.copy(camera.position).sub(earth.position);
    else if (activeView === 'mars' && mars) cameraOffset.copy(camera.position).sub(mars.position);
    else if (activeView === 'jupiter' && jupiter) cameraOffset.copy(camera.position).sub(jupiter.position);
    else if (activeView === 'mercury' && mercury) cameraOffset.copy(camera.position).sub(mercury.position);
    else if (activeView === 'venus' && venus) cameraOffset.copy(camera.position).sub(venus.position);
    else if (activeView === 'saturn' && saturn) cameraOffset.copy(camera.position).sub(saturn.position);
    else if (activeView === 'sun' && sun) cameraOffset.copy(camera.position).sub(sun.position);
    else if (activeView === 'neptune' && neptune) cameraOffset.copy(camera.position).sub(neptune.position);
    else if (activeView === 'uranus' && uranus) cameraOffset.copy(camera.position).sub(uranus.position);
});

function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function transitionCamera(newPosition, newTarget, duration = 1500, newView = null, newOffset = new THREE.Vector3()) {
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = performance.now();
    const originalDamping = controls.enableDamping;
    controls.enableDamping = true;
    
    function updateCamera() {
        const elapsed = performance.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easedT = easeInOutQuad(t);
        camera.position.lerpVectors(startPosition, newPosition, easedT);
        controls.target.lerpVectors(startTarget, newTarget, easedT);
        controls.update();
        if (t < 1) requestAnimationFrame(updateCamera);
        else {
            camera.position.copy(newPosition);
            controls.target.copy(newTarget);
            controls.enableDamping = originalDamping;
            controls.update();
            activeView = newView;
            cameraOffset.copy(newOffset);
            lastTargetPosition.copy(newTarget);
        }
    }
    requestAnimationFrame(updateCamera);
}

// Navigation Listeners (Ordered: Sun, Mercury, Venus, Earth, Moon, Mars, Jupiter, Saturn, Milky Way)
document.getElementById('nav1').addEventListener('click', () => {
    if (sun) transitionCamera(sun.position.clone().add(new THREE.Vector3(30, 10, 30)), sun.position, 1500, 'sun', new THREE.Vector3(30, 10, 30));
});
document.getElementById('nav2').addEventListener('click', () => {
    if (mercury) transitionCamera(mercury.position.clone().add(new THREE.Vector3(9, 3, 9)), mercury.position, 1500, 'mercury', new THREE.Vector3(10, 3, 10));
});
document.getElementById('nav3').addEventListener('click', () => {
    if (venus) transitionCamera(venus.position.clone().add(new THREE.Vector3(12, 3, 12)), venus.position, 1500, 'venus', new THREE.Vector3(12, 4, 12));
});
document.getElementById('nav4').addEventListener('click', () => {
    if (earth) transitionCamera(earth.position.clone().add(new THREE.Vector3(15, 5, 15)), earth.position, 1500, 'earth', new THREE.Vector3(15, 5, 15));
});
document.getElementById('nav5').addEventListener('click', () => {
    if (moon) transitionCamera(moon.position.clone().add(new THREE.Vector3(5, 2, 5)), moon.position, 1500, 'moon', new THREE.Vector3(5, 2, 5));
});
document.getElementById('nav6').addEventListener('click', () => {
    if (mars) transitionCamera(mars.position.clone().add(new THREE.Vector3(15, 5, 15)), mars.position, 1500, 'mars', new THREE.Vector3(15, 5, 15));
});
document.getElementById('nav7').addEventListener('click', () => {
    if (jupiter) transitionCamera(jupiter.position.clone().add(new THREE.Vector3(20, 5, 20)), jupiter.position, 1500, 'jupiter', new THREE.Vector3(20, 5, 20));
});
document.getElementById('nav8').addEventListener('click', () => {
    if (saturn) transitionCamera(saturn.position.clone().add(new THREE.Vector3(20, 5, 20)), saturn.position, 1500, 'saturn', new THREE.Vector3(20, 5, 20));
});
document.getElementById('nav9').addEventListener('click', () => {
    if (uranus) transitionCamera(uranus.position.clone().add(new THREE.Vector3(20, 5, 20)), uranus.position, 1500, 'uranus', new THREE.Vector3(20, 5, 20));
});
document.getElementById('nav10').addEventListener('click', () => {
    if (neptune) transitionCamera(neptune.position.clone().add(new THREE.Vector3(20, 5, 20)), neptune.position, 1500, 'neptune', new THREE.Vector3(20, 5, 20));
});
document.getElementById('nav11').addEventListener('click', () => {
    transitionCamera(new THREE.Vector3(2800, 60, 60), new THREE.Vector3(4000, 0, 0), 2000, 'milkyWay', new THREE.Vector3(0, 50, 50));
});
document.getElementById('nav12').addEventListener('click', () => {
    showOrbits = !showOrbits;
    showLabels = !showLabels;
    scene.traverse(obj => {
        if (obj.userData.isOrbit) obj.visible = showOrbits;
        if (obj.userData.isLabel) obj.visible = showLabels;
    });
});

function createLabel(text, position, size = 0.5) {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 80;
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = '40px Orbitron';
    context.fillStyle = '#00D4FF';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(position);
    sprite.scale.set(size * 4, size * 2, 1);
    sprite.userData.isLabel = true;
    sprite.visible = showLabels;
    scene.add(sprite);
    return sprite;
}

// 📌 Info Panel Data
const objectInfo = {
    sun: {
        name: "Sun – Sol / Helios",
        description: "The Sun, a titanic fusion engine at the heart of our Solar System, governs planetary motion and sustains life with radiant energy. As the gravitational anchor of our cosmic neighborhood, it defines time, space, and the very rhythm of the planets.",
        fact: "The Sun’s core reaches a searing 15 million°C, and its magnetic field—twice as strong as Earth’s—extends beyond Pluto, shaping the heliosphere that shields the entire Solar System from galactic radiation.",
        surpriseFact: "Solar neutrinos—ghostlike particles from the Sun’s fusion process—pass through your body at a rate of 100 billion per second, completely undetected.",
        funShock: "Each second, the Sun fuses over 600 million tons of hydrogen into helium—fueling a chain reaction that will blaze on for another 5 billion years.",
        moreInfoLink: "https://solarsystem.nasa.gov/solar-system/sun/overview/"
    },
    
    mercury: {
        name: "Mercury – Hermean",
        description: "The smallest and innermost planet endures the most dramatic temperature swings in the Solar System. With a dense metallic core making up 75% of its radius, Mercury is a world of fire and ice orbiting in extreme proximity to the Sun.",
        fact: "Its elliptical orbit and slow spin lead to rare 'double sunrises,' where the Sun appears to rise, set, then rise again in the same sky.",
        surpriseFact: "Though baked by solar energy, Mercury hides water ice in permanently shadowed polar craters—regions colder than Pluto.",
        funShock: "At the equator, noon is hot enough to melt lead; at the poles, nitrogen would freeze—all on the same planetary body.",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/mercury/overview/"
    },
    
    venus: {
        name: "Venus – Morgensteorra & Æfensteorra",
        description: "A furnace cloaked in clouds, Venus is Earth’s twin gone rogue. Its runaway greenhouse effect creates surface conditions hot enough to melt zinc and crush probes under pressures equivalent to a kilometer of ocean depth.",
        fact: "High-altitude winds zip around the planet every four Earth days—60 times faster than Venus rotates, a phenomenon known as 'super-rotation.'",
        surpriseFact: "Lightning strikes 25 times more frequently than on Earth, flashing within sulfuric acid clouds in an endless, groundless electrical storm.",
        funShock: "Venus is brighter than any star yet hotter than molten lava beneath its opaque skies—a blazing paradox in our twilight sky.",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/venus/overview/"
    },
    
    earth: {
        name: "Earth – Terra / Gaia",
        description: "The only known world to host life, Earth is a dynamic, living system with a magnetic shield generated by its churning liquid iron core. It harbors diverse life within a narrow biosphere that clings to a spinning rock in space.",
        fact: "Earth’s biosphere, spanning 11 km below sea level to 15 km above, is thinner than an apple’s skin in proportion to the planet’s size.",
        surpriseFact: "Tidal friction with the Moon gradually slows Earth's rotation, lengthening the day by 1.7 milliseconds per century while pushing the Moon away by 3.8 cm each year.",
        funShock: "Earth's core is as hot as the surface of the Sun—5,500°C—yet life thrives atop a crust thinner than an eggshell.",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/earth/overview/"
    },
    
    moon: {
        name: "Moon – Luna / Selene",
        description: "Our natural satellite, born from a colossal collision, is the largest moon relative to its host planet. It stabilizes Earth’s tilt, controls tides, and holds clues to the early Solar System in its silent regolith.",
        fact: "Its gravitational pull not only sways ocean tides but flexes Earth's crust by 55 cm twice daily—creating ‘Earth tides.’",
        surpriseFact: "Lunar soil is dangerously abrasive and electrostatically charged, clinging to gear and threatening future Moon missions.",
        funShock: "Without the Moon, Earth’s tilt could swing wildly between 0° and 85°, creating climate chaos that might have prevented complex life from emerging.",
        moreInfoLink: "https://solarsystem.nasa.gov/moons/earths-moon/overview/"
    },
    
    mars: {
        name: "Mars – Ares / Her Desher",
        description: "Mars, the red planet, is a frozen desert of ancient riverbeds and towering volcanoes. Its dusty surface conceals a wetter past—and a promise of exploration and perhaps, life.",
        fact: "Valles Marineris, a canyon system 4,000 km long and deeper than the Grand Canyon, may have formed from tectonic rifting.",
        surpriseFact: "Planet-wide dust storms last for months, generating static electricity and creating auroras visible from the surface.",
        funShock: "Martian air pressure is so low that saliva would boil on your tongue—yet it snows frozen CO₂ near the poles!",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/mars/overview/"
    },
    
    jupiter: {
        name: "Jupiter – Jove / Optimus Maximus",
        description: "The largest planet, Jupiter is a storm-wracked gas giant whose massive gravity protects the inner Solar System. It’s surrounded by dozens of moons—some harboring oceans and possibly life.",
        fact: "At its core, pressures reach 4,000 gigapascals, possibly forming metallic hydrogen that powers Jupiter's enormous magnetic field.",
        surpriseFact: "Jupiter radiates more heat than it receives—its internal compression makes it glow in infrared like a failed star.",
        funShock: "Europa, one of its moons, hides twice Earth’s ocean water beneath its icy crust—perhaps the Solar System’s best hope for alien life.",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/jupiter/overview/"
    },
    
    saturn: {
        name: "Saturn – Cronus / Phainon",
        description: "Saturn’s ethereal rings stretch across hundreds of thousands of kilometers yet are thinner than paper. Its rapid rotation and dozens of moons make it a dynamic, elegant system unto itself.",
        fact: "Its north pole hosts a stable, 25,000-kilometer-wide hexagon—a jet stream shaped into a perfect geometric vortex.",
        surpriseFact: "The planet’s rings cast shadows that alter atmospheric temperatures by up to 15°C, reshaping wind patterns.",
        funShock: "Geysers on Enceladus launch ice 250 km into space—some of which forms Saturn’s E ring!",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/saturn/overview/"
    },
    
    uranus: {
        name: "Uranus – Georgium Sidus / Ouranos",
        description: "Uranus spins on its side, likely knocked askew by an ancient impact. Its strange magnetic field and icy composition make it one of the most enigmatic worlds in the Solar System.",
        fact: "Its magnetic field is tilted 59° from its spin axis and offset from the center, hinting at unusual internal layering.",
        surpriseFact: "Extreme pressures in its atmosphere likely forge diamonds from methane—raining gemstones into its depths.",
        funShock: "Despite being closer to the Sun than Neptune, Uranus is the coldest planet, with cloud tops reaching -224°C.",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/uranus/overview/"
    },
    
    neptune: {
        name: "Neptune – Poseidon / Oceanus",
        description: "Neptune, the windiest planet, unleashes supersonic storms beneath a blue haze. Despite receiving minimal sunlight, its powerful internal heat fuels extreme weather and active moons.",
        fact: "Triton, its largest moon, orbits backward and is slowly spiraling inward—destined to be torn apart and form rings.",
        surpriseFact: "Though it gets just 0.1% of Earth's sunlight, Neptune keeps Triton geologically alive with nitrogen geysers erupting into space.",
        funShock: "Neptune’s winds roar at 2,100 km/h—so fast they nearly break the sound barrier in the planet’s thin atmosphere.",
        moreInfoLink: "https://solarsystem.nasa.gov/planets/neptune/overview/"
    },
    
    milkyway: {
        name: "Milky Way – Via Lactea",
        description: "Our home galaxy is a sprawling barred spiral of 400+ billion stars, anchored by a supermassive black hole—Sagittarius A*—whose immense gravity warps space and time.",
        fact: "It forms stars at a rate of one solar mass per year while ejecting gas via supernova-driven winds and radiation pressure.",
        surpriseFact: "85% of the Milky Way’s mass is dark matter—an invisible scaffold detectable only through its gravitational influence.",
        funShock: "It takes 240 million years for our Solar System to orbit the galactic center—Earth has made just 20 trips since complex life began.",
        moreInfoLink: "https://solarsystem.nasa.gov/resources/482/the-milky-way-galaxy/"
    }
};

// 📌 Info Panel Logic
let lastClickedObject = null;

function showInfoPanelFor(object) {
    const panel = document.getElementById('info-panel');
    const info = objectInfo[object.name?.toLowerCase()];
    if (!info) return;
    
    // Toggle panel if clicking same object
    if (lastClickedObject === object) {
        panel.classList.remove('open');
        lastClickedObject = null;
        document.querySelector('.info-content').classList.remove('open');
        document.querySelector('.dropdown-toggle').classList.remove('open');
        return;
    }
    
    // Update panel content
    document.getElementById('info-name').textContent = info.name;
    document.getElementById('info-description').textContent = info.description;
    
    // Main facts
    const factList = info.fact
        .split('. ')
        .map(f => `<li>${f}${f.endsWith('.') ? '' : '.'}</li>`)
        .join('');
    
    // Optional: Surprise Fact and Fun Shock additions
    const surpriseFact = info.surpriseFact ? `<li><strong>Do you know?</strong> ${info.surpriseFact}</li>` : '';
    const funShock = info.funShock ? `<li><strong>Fun Fact:</strong> ${info.funShock}</li>` : '';
    
    document.getElementById('info-facts').innerHTML = factList + surpriseFact + funShock;
    
    // External link
    document.getElementById('info-link').setAttribute('href', info.moreInfoLink);
    
    // Show panel but keep additional content hidden initially
    panel.classList.add('open');
    document.querySelector('.info-content').classList.remove('open');
    document.querySelector('.dropdown-toggle').classList.remove('open');
    lastClickedObject = object;
    
    // Initialize audio
    const clickSound = new Audio('assets/sounds/mixkit-sci-fi-interface-zoom-890.wav');
    clickSound.volume = 0.3;
    
    // Add dropdown toggle event
    const toggleButton = document.querySelector('.dropdown-toggle');
    toggleButton.onclick = () => {
        const content = document.querySelector('.info-content');
        const isOpen = content.classList.contains('open');
        
        // Play sound when toggling
        clickSound.play().catch(error => {
            console.error('Error playing sound:', error);
        });
        
        content.classList.toggle('open', !isOpen);
        toggleButton.classList.toggle('open', !isOpen);
    };
}

// 📌 Raycasting Setup
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

// 📌 Unified Click Handler (Mouse + Touch)
function handleInteraction(event) {
    // Assume isLoading and isInteracting are defined elsewhere
    if (typeof isLoading !== "undefined" && isLoading) return;
    if (typeof isInteracting !== "undefined" && isInteracting) return;

    let clientX, clientY;

    if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
    } else if (event.changedTouches && event.changedTouches.length > 0) {
        clientX = event.changedTouches[0].clientX;
        clientY = event.changedTouches[0].clientY;
    } else {
        clientX = event.clientX;
        clientY = event.clientY;
    }

    pointer.x = (clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let clicked = intersects[0].object;
        while (clicked && !clicked.name && clicked.parent) {
            clicked = clicked.parent;
        }

        if (clicked && clicked.name) {
            showInfoPanelFor(clicked);
        }
    }
}

// 📌 Mouse Event (Desktop)
window.addEventListener('click', handleInteraction, false);

// 📌 Touch Events (Mobile)
let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
const TAP_DISTANCE_THRESHOLD = 100; // pixels
const TAP_TIME_THRESHOLD = 500; // ms

window.addEventListener('touchstart', (event) => {
    if (event.touches.length > 0) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        touchStartTime = Date.now();
    }
}, { passive: true });

window.addEventListener('touchend', (event) => {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    const touchEndTime = Date.now();

    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeDiff = touchEndTime - touchStartTime;

    if (distance < TAP_DISTANCE_THRESHOLD && timeDiff < TAP_TIME_THRESHOLD) {
        handleInteraction(event);
    }
}, { passive: false });

// 📌 Prevent Long Tap Menu on Mobile
window.addEventListener('contextmenu', (e) => e.preventDefault(), { passive: false });
// Global variables for dat.GUI controls
let isPaused = false;
let reverse = false;
let speedMultiplier = 1;

// Bind to window for dat.GUI compatibility
window.isPaused = isPaused;
window.reverse = reverse;
window.speedMultiplier = speedMultiplier;

// Initialize THREE.Clock
const clock = new THREE.Clock();

// Sun
let sun;
const sunGeom = new THREE.SphereGeometry(20, 64, 64);
const sunPositions = sunGeom.attributes.position;
for (let i = 0; i < sunPositions.count; i++) {
    const vertex = new THREE.Vector3().fromBufferAttribute(sunPositions, i);
    const direction = vertex.clone().normalize();
    const randomOffset = (Math.random() - 0.5) * 0.1;
    vertex.addScaledVector(direction, randomOffset);
    sunPositions.setXYZ(i, vertex.x, vertex.y, vertex.z);
}
sunGeom.computeVertexNormals();
const sunMat = new THREE.MeshStandardMaterial({
    color: 0xFFD700,
    roughness: 0.9,
    metalness: 0,
    emissive: 0xFFD700,
    emissiveIntensity: 0.8
});
sun = new THREE.Mesh(sunGeom, sunMat);
sun.name = 'sun'; // Add name for info panel
sun.position.set(0, 0, 0);
scene.add(sun);
createLabel('Sun', sun.position.clone().add(new THREE.Vector3(0, 12, 0)), 2);

const sunLight = new THREE.PointLight(0xF8F8FF, 2.5, 900);
sunLight.position.copy(sun.position);
scene.add(sunLight);

loader.load('https://threejs.org/examples/textures/lensflare/lensflare0.png', (flareTexture) => {
    const spriteMat = new THREE.SpriteMaterial({
        map: flareTexture,
        color: 0xFFD700,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
    });
    const sunGlow = new THREE.Sprite(spriteMat);
    sunGlow.scale.set(16, 16, 1);
    sunGlow.position.copy(sun.position);
    scene.add(sunGlow);
});

const sunAtmosphereMaterial = new THREE.ShaderMaterial({
    uniforms: { sunColor: { value: new THREE.Color(0xFFA500) }, atmosphereColor: { value: new THREE.Color(0xFFA500) }, intensity: { value: 1.0} },
    vertexShader: `
    varying vec3 vNormal;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: `
    uniform vec3 sunColor;
    uniform vec3 atmosphereColor;
    uniform float intensity;
    varying vec3 vNormal;
    void main() {
      float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
      gl_FragColor = vec4(mix(sunColor, atmosphereColor, glow) * intensity, glow * 0.5);
    }
  `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});
const sunAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(21, 64, 64), sunAtmosphereMaterial);
scene.add(sunAtmosphere);

// Mercury
let mercury, mercuryLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurymap.jpg', (mercuryTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/mercurybump.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(5, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: mercuryTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 0.9, metalness: 0 });
        mercury = new THREE.Mesh(geom, mat);
        mercury.name = 'Mercury'; // Add name for info panel
        mercury.position.set(40, 0, 0);
        scene.add(mercury);
        createLabel('Mercury', mercury.position.clone().add(new THREE.Vector3(0, 3, 0)), 0.8);
        mercuryLight = new THREE.PointLight(0xcccccc, 0.5, 20);
        mercuryLight.position.copy(mercury.position);
        scene.add(mercuryLight);
        const mercuryAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 5);
        mercury.add(mercuryAmbientLight);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(5, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
        mercury = new THREE.Mesh(geom, mat);
        mercury.name = 'Mercury'; // Add name for info panel
        mercury.position.set(40, 0, 0);
        scene.add(mercury);
        createLabel('Mercury', mercury.position.clone().add(new THREE.Vector3(0, 3, 0)), 0.8);
        mercuryLight = new THREE.PointLight(0xcccccc, 0.5, 20);
        mercuryLight.position.copy(mercury.position);
        scene.add(mercuryLight);
        const mercuryAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 5);
        mercury.add(mercuryAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(5, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.9 });
    mercury = new THREE.Mesh(geom, mat);
    mercury.name = 'Mercury'; // Add name for info panel
    mercury.position.set(40, 0, 0);
    scene.add(mercury);
    createLabel('Mercury', mercury.position.clone().add(new THREE.Vector3(0, 3, 0)), 0.8);
    mercuryLight = new THREE.PointLight(0xcccccc, 0.5, 20);
    mercuryLight.position.copy(mercury.position);
    scene.add(mercuryLight);
    const mercuryAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 5);
    mercury.add(mercuryAmbientLight);
});

// Venus
let venus, venusLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusmap.jpg', (venusTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/venusbump.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(6, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: venusTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 0.8, metalness: 0 });
        venus = new THREE.Mesh(geom, mat);
        venus.name = 'Venus'; // Add name for info panel
        venus.position.set(90, 0, 0);
        scene.add(venus);
        createLabel('Venus', venus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1);
        venusLight = new THREE.PointLight(0xcccccc, 0.5, 30);
        venusLight.position.copy(venus.position);
        scene.add(venusLight);
        const venusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 8);
        venus.add(venusAmbientLight);
        const venusAtmosphereMat = new THREE.ShaderMaterial({
            uniforms: { atmosphereColor: { value: new THREE.Color(0xFF8C00) }, intensity: { value: 0.3 } },
            vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform float intensity;
        varying vec3 vNormal;
        void main() {
          float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.3);
        }
      `,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            transparent: true
        });
        const venusAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(7, 64, 64), venusAtmosphereMat);
        venus.add(venusAtmosphere);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(6, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xFF8C00, roughness: 0.8 });
        venus = new THREE.Mesh(geom, mat);
        venus.name = 'Venus'; // Add name for info panel
        venus.position.set(90, 0, 0);
        scene.add(venus);
        createLabel('Venus', venus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1);
        venusLight = new THREE.PointLight(0xcccccc, 0.5, 30);
        venusLight.position.copy(venus.position);
        scene.add(venusLight);
        const venusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 8);
        venus.add(venusAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(6, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xFF8C00, roughness: 0.8 });
    venus = new THREE.Mesh(geom, mat);
    venus.name = 'Venus'; // Add name for info panel
    venus.position.set(90, 0, 0);
    scene.add(venus);
    createLabel('Venus', venus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1);
    venusLight = new THREE.PointLight(0xcccccc, 0.5, 30);
    venusLight.position.copy(venus.position);
    scene.add(venusLight);
    const venusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 8);
    venus.add(venusAmbientLight);
});

// Earth
let earth;
loader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg', (texture) => {
    const geom = new THREE.SphereGeometry(8, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8, metalness: 0 });
    earth = new THREE.Mesh(geom, mat);
    earth.name = 'earth'; // Add name for info panel
    scene.add(earth);
    createLabel('Earth', earth.position.clone().add(new THREE.Vector3(0, 8, 0)));
    const earthAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 10);
    earth.add(earthAmbientLight);
    const earthAtmosphereMat = new THREE.ShaderMaterial({
        uniforms: { atmosphereColor: { value: new THREE.Color(0x00A3CC) }, intensity: { value: 0.6 } },
        vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 atmosphereColor;
      uniform float intensity;
      varying vec3 vNormal;
      void main() {
        float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.3);
      }
    `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const earthAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(8.6, 64, 64), earthAtmosphereMat);
    earth.add(earthAtmosphere);
}, undefined, () => {
    const geom = new THREE.SphereGeometry(8, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0x0000ff, roughness: 0.8 });
    earth = new THREE.Mesh(geom, mat);
    earth.name = 'earth'; // Add name for info panel
    scene.add(earth);
    createLabel('Earth', earth.position.clone().add(new THREE.Vector3(0, 8, 0)));
    const earthAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 10);
    earth.add(earthAmbientLight);
});

// Moon
let moon, moonLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonmap1k.jpg', (moonTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/moonbump1k.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(2.0, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: moonTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 1, metalness: 0 });
        moon = new THREE.Mesh(geom, mat);
        moon.name = 'moon'; // Add name for info panel
        moon.position.set(10, 0, 0);
        scene.add(moon);
        createLabel('Moon', moon.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.5);
        moonLight = new THREE.PointLight(0xcccccc, 0.8, 55);
        moonLight.position.copy(moon.position);
        scene.add(moonLight);
        const moonAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 3);
        moon.add(moonAmbientLight);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(2.0, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1 });
        moon = new THREE.Mesh(geom, mat);
        moon.name = 'moon'; // Add name for info panel
        moon.position.set(10, 0, 0);
        scene.add(moon);
        createLabel('Moon', moon.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.5);
        moonLight = new THREE.PointLight(0xcccccc, 0.6, 20);
        moonLight.position.copy(moon.position);
        scene.add(moonLight);
        const moonAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 3);
        moon.add(moonAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(2.0, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 1 });
    moon = new THREE.Mesh(geom, mat);
    moon.name = 'moon'; // Add name for info panel
    moon.position.set(10, 0, 0);
    scene.add(moon);
    createLabel('Moon', moon.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 0.5);
    moonLight = new THREE.PointLight(0xcccccc, 0.6, 20);
    moonLight.position.copy(moon.position);
    scene.add(moonLight);
    const moonAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 3);
    moon.add(moonAmbientLight);
});

// Mars
let mars, marsLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsmap1k.jpg', (marsTex) => {
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/marsbump1k.jpg', (bumpTex) => {
        const geom = new THREE.SphereGeometry(6.5, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ map: marsTex, bumpMap: bumpTex, bumpScale: 0.09, roughness: 0.7, metalness: 0 });
        mars = new THREE.Mesh(geom, mat);
        mars.name = 'mars'; // Add name for info panel
        mars.position.set(220, 0, 0);
        scene.add(mars);
        createLabel('Mars', mars.position.clone().add(new THREE.Vector3(0, 4, 0)), 1);
        marsLight = new THREE.PointLight(0xcccccc, 0.5, 35);
        marsLight.position.copy(mars.position);
        scene.add(marsLight);
        const marsAmbientLight = new THREE.PointLight(0xaaaaaa, 0.3, 7);
        mars.add(marsAmbientLight);
    }, undefined, () => {
        const geom = new THREE.SphereGeometry(6.5, 64, 64);
        const mat = new THREE.MeshStandardMaterial({ color: 0xff4040, roughness: 0.8 });
        mars = new THREE.Mesh(geom, mat);
        mars.name = 'mars'; // Add name for info panel
        mars.position.set(220, 0, 0);
        scene.add(mars);
        createLabel('Mars', mars.position.clone().add(new THREE.Vector3(0, 4, 0)), 1);
        marsLight = new THREE.PointLight(0xcccccc, 0.5, 25);
        marsLight.position.copy(mars.position);
        scene.add(marsLight);
        const marsAmbientLight = new THREE.PointLight(0xaaaaaa, 0.3, 7);
        mars.add(marsAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(6.5, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4040, roughness: 0.8 });
    mars = new THREE.Mesh(geom, mat);
    mars.name = 'mars'; // Add name for info panel
    mars.position.set(220, 0, 0);
    scene.add(mars);
    createLabel('Mars', mars.position.clone().add(new THREE.Vector3(0, 4, 0)), 1);
    marsLight = new THREE.PointLight(0xcccccc, 0.5, 25);
    marsLight.position.copy(mars.position);
    scene.add(marsLight);
    const marsAmbientLight = new THREE.PointLight(0xaaaaaa, 0.3, 7);
    mars.add(marsAmbientLight);
});

// Mars Moons
let phobos, deimos;
loader.load('https://i.ibb.co/BH1prqs/photo-stone-texture-pattern-58702-16107.jpg', (texture) => {
    const phobosGeom = new THREE.IcosahedronGeometry(0.9, 12);
    const phobosMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 1.2, metalness: 0, emissive: 0x555555, emissiveIntensity: 0.4 });
    phobos = new THREE.Mesh(phobosGeom, phobosMat);
    phobos.name = 'phobos'; // Add name for info panel
    phobos.position.set(94.5, 0, 0);
    scene.add(phobos);
    createLabel('Phobos', phobos.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.3);
    const phobosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    phobos.add(phobosAmbientLight);
    
    const deimosGeom = new THREE.IcosahedronGeometry(1.2, 8);
    const deimosMat = new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0, emissive: 0x555555, emissiveIntensity: 0.4 });
    deimos = new THREE.Mesh(deimosGeom, deimosMat);
    deimos.name = 'deimos'; // Add name for info panel
    deimos.position.set(97.0, 0, 0);
    scene.add(deimos);
    createLabel('Deimos', deimos.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.2);
    const deimosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    deimos.add(deimosAmbientLight);
}, undefined, () => {
    const phobosGeom = new THREE.IcosahedronGeometry(0.9, 8);
    const phobosMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1, emissive: 0x555555, emissiveIntensity: 0.3 });
    phobos = new THREE.Mesh(phobosGeom, phobosMat);
    phobos.name = 'phobos'; // Add name for info panel
    phobos.position.set(94.5, 0, 0);
    scene.add(phobos);
    createLabel('Phobos', phobos.position.clone().add(new THREE.Vector3(0, 1, 0)), 0.3);
    const phobosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    phobos.add(phobosAmbientLight);
    
    const deimosGeom = new THREE.IcosahedronGeometry(1.2, 8);
    const deimosMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 1, emissive: 0x555555, emissiveIntensity: 0.3 });
    deimos = new THREE.Mesh(deimosGeom, deimosMat);
    deimos.name = 'deimos'; // Add name for info panel
    deimos.position.set(97.0, 0, 0);
    scene.add(deimos);
    createLabel('Deimos', deimos.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.2);
    const deimosAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
    deimos.add(deimosAmbientLight);
});
        
// Jupiter
let jupiter, jupiterLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/jupitermap.jpg', (jupiterTex) => {
    const geom = new THREE.SphereGeometry(12, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ map: jupiterTex, roughness: 0.7, metalness: 0 });
    jupiter = new THREE.Mesh(geom, mat);
    jupiter.name = 'jupiter'; 
    jupiter.position.set(380, 0, 0);
    scene.add(jupiter);
    createLabel('Jupiter', jupiter.position.clone().add(new THREE.Vector3(0, 10, 0)), 1.5);
    jupiterLight = new THREE.PointLight(0xcccccc, 0.9, 50);
    jupiterLight.position.copy(jupiter.position);
    scene.add(jupiterLight);
    const jupiterAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 12);
    jupiter.add(jupiterAmbientLight);
    const jupiterAtmosphereMat = new THREE.ShaderMaterial({
        uniforms: { atmosphereColor: { value: new THREE.Color(0xcc7a00) }, intensity: { value: 0.4 } },
        vertexShader: `
      varying vec3 vNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
        fragmentShader: `
      uniform vec3 atmosphereColor;
      uniform float intensity;
      varying vec3 vNormal;
      void main() {
        float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.2);
      }
    `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const jupiterAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(12, 64, 64), jupiterAtmosphereMat);
    jupiter.add(jupiterAtmosphere);
}, undefined, () => {
    const geom = new THREE.SphereGeometry(12, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xcc7a00, roughness: 0.7 });
    jupiter = new THREE.Mesh(geom, mat);
    jupiter.name = 'jupiter'; 
    jupiter.position.set(380, 0, 0);
    scene.add(jupiter);
    createLabel('Jupiter', jupiter.position.clone().add(new THREE.Vector3(0, 10, 0)), 1.5);
    jupiterLight = new THREE.PointLight(0xcccccc, 0.5, 50);
    jupiterLight.position.copy(jupiter.position);
    scene.add(jupiterLight);
    const jupiterAmbientLight = new THREE.PointLight(0xaaaaaa, 0.2, 12);
    jupiter.add(jupiterAmbientLight);
});
let neptune, neptuneLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/neptunemap.jpg', (neptuneTex) => {
    const geom = new THREE.SphereGeometry(9, 64, 64); // Neptune's relative radius
    const mat = new THREE.MeshStandardMaterial({ map: neptuneTex, roughness: 0.9, metalness: 0.2 });
    neptune = new THREE.Mesh(geom, mat);
    neptune.name = 'neptune';
    neptune.position.set(680, 0, 0);
    scene.add(neptune);
    createLabel('Neptune', neptune.position.clone().add(new THREE.Vector3(0, 5, 0)), 1.2);
    neptuneLight = new THREE.PointLight(0xcccccc, 0.9, 40);
    neptuneLight.position.copy(neptune.position);
    scene.add(neptuneLight);
    const neptuneAmbientLight = new THREE.PointLight(0xaaaaaa, 0.28, 10);
    neptune.add(neptuneAmbientLight);
    const neptuneAtmosphereMat = new THREE.ShaderMaterial({
        uniforms: { atmosphereColor: { value: new THREE.Color(0x4682b4) }, intensity: { value: 0.7 } },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
        A      vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 atmosphereColor;
            uniform float intensity;
            varying vec3 vNormal;
            void main() {
                float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.3);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true
    });
    const neptuneAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(9.5, 64, 64), neptuneAtmosphereMat);
    neptune.add(neptuneAtmosphere);
}, undefined, () => {
    const geom = new THREE.SphereGeometry(9, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4682b4, roughness: 0.8 });
    neptune = new THREE.Mesh(geom, mat);
    neptune.name = 'neptune'; // Add name for info panel
    neptune.position.set(680, 0, 0);
    scene.add(neptune);
    createLabel('Neptune', neptune.position.clone().add(new THREE.Vector3(0, 5, 0)), 1.2);
    neptuneLight = new THREE.PointLight(0xcccccc, 0.7, 40);
    neptuneLight.position.copy(neptune.position);
    scene.add(neptuneLight);
    const neptuneAmbientLight = new THREE.PointLight(0xaaaaaa, 0.28, 10);
    neptune.add(neptuneAmbientLight);
});
// Uranus Creation
let uranus, uranusLight;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/uranusmap.jpg', (uranusTex) => {
const geom = new THREE.SphereGeometry(9.5, 64, 64);
const mat = new THREE.MeshStandardMaterial({ map: uranusTex, roughness: 0.9, metalness: 0.4 });
uranus = new THREE.Mesh(geom, mat);
uranus.name = 'uranus'; 
uranus.position.set(580, 0, 0)
scene.add(uranus);
createLabel('Uranus', uranus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1.2);
uranusLight = new THREE.PointLight(0xcccccc, 0.9, 40);
uranusLight.position.copy(uranus.position);
scene.add(uranusLight);
const uranusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.28, 10);
uranus.add(uranusAmbientLight);
const uranusAtmosphereMat = new THREE.ShaderMaterial({
    uniforms: { atmosphereColor: { value: new THREE.Color(0x66cccc) }, intensity: { value: 0.8 } },
    vertexShader: `
        varying vec3 vNormal;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 atmosphereColor;
        uniform float intensity;
        varying vec3 vNormal;
        void main() {
            float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            gl_FragColor = vec4(atmosphereColor * intensity, glow * 0.3);
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true
});
const uranusAtmosphere = new THREE.Mesh(new THREE.SphereGeometry(9.9, 64, 64), uranusAtmosphereMat);
uranus.add(uranusAtmosphere);
}, undefined, () => {
const geom = new THREE.SphereGeometry(9.5, 64, 64);
const mat = new THREE.MeshStandardMaterial({ color: 0x66cccc, roughness: 0.8 });
uranus = new THREE.Mesh(geom, mat);
uranus.name = 'uranus'; // Add name for info panel
uranus.position.set(580, 0, 0);
scene.add(uranus);
createLabel('Uranus', uranus.position.clone().add(new THREE.Vector3(0, 5, 0)), 1.2);
uranusLight = new THREE.PointLight(0xcccccc, 0.7, 40);
uranusLight.position.copy(uranus.position);
scene.add(uranusLight);
const uranusAmbientLight = new THREE.PointLight(0xaaaaaa, 0.28, 10);
uranus.add(uranusAmbientLight);
});
// Saturn
let saturn, saturnLight, titan;
loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnmap.jpg', (saturnTex) => {
    const geom = new THREE.SphereGeometry(11, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ map: saturnTex, roughness: 0.7, metalness: 0 });
    saturn = new THREE.Mesh(geom, mat);
    saturn.name = 'saturn'; // Add name for info panel
    saturn.position.set(480, 0, 0);
    scene.add(saturn);
    createLabel('Saturn', saturn.position.clone().add(new THREE.Vector3(0, 11, 0)), 1.5);
    saturnLight = new THREE.PointLight(0xcccccc, 1.8, 60);
    saturnLight.position.copy(saturn.position);
    scene.add(saturnLight);
    const saturnAmbientLight = new THREE.PointLight(0xaaaaaa, 1.6, 14);
    saturn.add(saturnAmbientLight);
    loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnringcolor.jpg', (ringTex) => {
        loader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/saturnringpattern.png', (alphaTex) => {
            const ringGeom = new THREE.RingGeometry(11, 17, 128, 8);
            const ringMat = new THREE.MeshStandardMaterial({
                map: ringTex,
                alphaMap: alphaTex,
                side: THREE.DoubleSide,
                transparent: true,
                roughness: 0.8,
                metalness: 0.2,
                opacity: 0.9
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2.2;
            ring.scale.set(1, 1, 0.1);
            saturn.add(ring);
        }, undefined, (error) => {
            console.error('Error loading Saturn ring alpha texture:', error);
            const ringGeom = new THREE.RingGeometry(11, 17, 128, 8);
            const ringMat = new THREE.MeshStandardMaterial({
                map: ringTex,
                side: THREE.DoubleSide,
                transparent: true,
                roughness: 0.8,
                metalness: 0.3,
                opacity: 0.9
            });
            const ring = new THREE.Mesh(ringGeom, ringMat);
            ring.rotation.x = Math.PI / 2.2;
            ring.scale.set(1, 1, 0.1);
            saturn.add(ring);
        });
    }, undefined, (error) => {
        console.error('Error loading Saturn ring color texture:', error);
        const ringGeom = new THREE.RingGeometry(11, 17,128, 8);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0xD4A880,
            side: THREE.DoubleSide,
            transparent: true,
            roughness: 0.8,
            metalness: 0.2,
            opacity: 0.9
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI / 2.2;
        ring.scale.set(1, 1, 0.1);
        saturn.add(ring);
    });
    loader.load('https://i.ibb.co/BH1prqs/photo-stone-texture-pattern-58702-16107.jpg', (titanTex) => {
        const titanGeom = new THREE.SphereGeometry(2.2, 32, 32);
        const titanMat = new THREE.MeshStandardMaterial({ map: titanTex, roughness: 1, metalness: 0, emissive: 0x555555, emissiveIntensity: 0.3 });
        titan = new THREE.Mesh(titanGeom, titanMat);
        titan.name = 'titan'; // Add name for info panel
        titan.position.set(480, 0, 0);
        scene.add(titan);
        createLabel('Titan', titan.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.3);
        const titanAmbientLight = new THREE.PointLight(0xaaaaaa, 0.1, 2);
        titan.add(titanAmbientLight);
    }, undefined, () => {
        const titanGeom = new THREE.SphereGeometry(2.2, 32, 32);
        const titanMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 1, emissive: 0x555555, emissiveIntensity: 0.3 });
        titan = new THREE.Mesh(titanGeom, titanMat);
        titan.name = 'titan'; // Add name for info panel
        titan.position.set(480, 0, 0);
        scene.add(titan);
        createLabel('Titan', titan.position.clone().add(new THREE.Vector3(0, 0.8, 0)), 0.3);
        const titanAmbientLight = new THREE.PointLight(0xaaaaaa, 0.5, 2);
        titan.add(titanAmbientLight);
    });
}, undefined, () => {
    const geom = new THREE.SphereGeometry(11, 64, 64);
    const mat = new THREE.MeshStandardMaterial({ color: 0xD4A880, roughness: 0.7 });
    saturn = new THREE.Mesh(geom, mat);
    saturn.name = 'saturn'; // Add name for info panel
    saturn.position.set(480, 0, 0);
    scene.add(saturn);
    createLabel('Saturn', saturn.position.clone().add(new THREE.Vector3(0, 11, 0)), 1.5);
    saturnLight = new THREE.PointLight(0xcccccc, 0.5, 60);
    saturnLight.position.copy(saturn.position);
    scene.add(saturnLight);
    const saturnAmbientLight = new THREE.PointLight(0xaaaaaa, 0.3, 14);
    saturn.add(saturnAmbientLight);
});
    
    
// Orbital Paths
function createOrbit(semiMajor, eccentricity, segments = 256, color = 0x00D4FF) {
    const points = [];
    const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        const x = semiMajor * Math.cos(theta) - semiMajor * eccentricity;
        const z = semiMinor * Math.sin(theta);
        points.push(new THREE.Vector3(x, 0, z));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({ color: color, dashSize: 0.5, gapSize: 0.5, transparent: true, opacity: 0.6 });
    const orbit = new THREE.Line(geom, mat);
    orbit.computeLineDistances();
    orbit.userData.isOrbit = true;
    orbit.visible = showOrbits;
    scene.add(orbit);
    return orbit;
}

// Orbit Creation for Planets
const mercuryOrbit = createOrbit(50, 0.2056, 256, 0xB0BEC5);
const venusOrbit = createOrbit(90, 0.0059, 256, 0xFF8C00);
const earthOrbit = createOrbit(160, 0.0167, 256, 0x4682B4);
const marsOrbit = createOrbit(220, 0.0934, 256, 0x8B0000);
const jupiterOrbit = createOrbit(380, 0.0489, 256, 0xDAA520);
const saturnOrbit = createOrbit(480, 0.0557, 256, 0xD4A880);
const neptuneOrbit = createOrbit(680, 0.009, 256, 0xFf00ff); // Updated eccentricity
const uranusOrbit = createOrbit(580, 0.046, 256, 0x00FFFF); // Updated eccentricity


    // Stars
    const starCountMain = 20000;
    const starSpread = 10000;
    const starGeometryMain = new THREE.BufferGeometry();
    const starPositionsMain = new Float32Array(starCountMain * 3);
    const starPhasesMain = new Float32Array(starCountMain);
    for (let i = 0; i < starCountMain; i++) {
      starPositionsMain[i * 3] = (Math.random() - 0.5) * starSpread;
      starPositionsMain[i * 3 + 1] = (Math.random() - 0.5) * starSpread;
      starPositionsMain[i * 3 + 2] = (Math.random() - 0.5) * starSpread;
      starPhasesMain[i] = Math.random() * Math.PI * 2;
    }
    starGeometryMain.setAttribute('position', new THREE.BufferAttribute(starPositionsMain, 3));
    starGeometryMain.setAttribute('phase', new THREE.BufferAttribute(starPhasesMain, 1));

    const starShaderMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } },
      vertexShader: `
        attribute float phase;
        uniform float time;
        varying float vOpacity;
        varying float vSize;
        void main() {
          vOpacity = 0.8 + 0.3 * sin(mod(time, 100.0) + phase);
          vSize = 0.5 + 0.4 * sin(mod(time, 100.0) + phase);
          gl_PointSize = vSize * 2.0;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(1.0, 1.0, 1.0, vOpacity);
        }
      `,
      transparent: true
    });
    const starSystem = new THREE.Points(starGeometryMain, starShaderMaterial);
    scene.add(starSystem);
    
// Ensure scene and createLabel are defined in your global context
if (typeof scene === 'undefined') {
    console.error('Scene is undefined. Ensure THREE.Scene is initialized.');
}
if (typeof createLabel === 'undefined') {
    console.warn('createLabel is undefined. Define a function to create labels or remove the call.');
    function createLabel(text, position, size) {
        // Placeholder: Log label creation
        console.log(`Creating label: ${text} at ${position.x}, ${position.y}, ${position.z}`);
    }
}

// Defining the Milky Way sub star system
const milkyWayGroup = new THREE.Group();
const milkyWayRadius = 4000; // Distance from the Sun
const milkyWayDiskRadius = 300; // Middle disk radius
const outerDiskRadius = 700; // Outer disk radius
const milkyWayStarsCount = 2500; // Middle spiral arm stars
const outerStarsCount = 4300; // Outer spiral arm stars
const backgroundStarsCount = 25000; // Blank space stars
const haloStarsCount = 300; // Stellar halo stars
const middleDiskThickness = 10; // Thin middle layer
const outerDiskThickness = 15; // Thicker outer layer
const spiralArms = 4; // Number of spiral arms
const armTightness = 3.4; // Increased for tighter, cyclone-like spirals

// Background Stars for Middle Greenish Layer
const backgroundStarsGeometry = new THREE.BufferGeometry();
const backgroundStarsPositions = new Float32Array(backgroundStarsCount * 3);
const backgroundStarsPhases = new Float32Array(backgroundStarsCount);
const backgroundStarsColors = new Float32Array(backgroundStarsCount * 3);
const backgroundStarsSizes = new Float32Array(backgroundStarsCount);
for (let i = 0; i < backgroundStarsCount; i++) {
    const r = Math.sqrt(Math.random()) * milkyWayDiskRadius * 1.2;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * middleDiskThickness * (1 - r / milkyWayDiskRadius);
    backgroundStarsPositions[i * 3] = x;
    backgroundStarsPositions[i * 3 + 1] = y;
    backgroundStarsPositions[i * 3 + 2] = z;
    backgroundStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign greenish color (#33CC99)
    backgroundStarsColors[i * 3] = 75.0 / 255; // R
    backgroundStarsColors[i * 3 + 1] = 0.0 / 255; // G
    backgroundStarsColors[i * 3 + 2] = 130.0 / 255; // B
    backgroundStarsSizes[i] = 0.5 + Math.random() * 0.6;
}
backgroundStarsGeometry.setAttribute('position', new THREE.BufferAttribute(backgroundStarsPositions, 3));
backgroundStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(backgroundStarsPhases, 1));
backgroundStarsGeometry.setAttribute('color', new THREE.BufferAttribute(backgroundStarsColors, 3));
backgroundStarsGeometry.setAttribute('size', new THREE.BufferAttribute(backgroundStarsSizes, 1));
const backgroundStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.3 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (1.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float dist = length(vPosition.xz);
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float brightness = 0.8 + 0.2 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const backgroundStars = new THREE.Points(backgroundStarsGeometry, backgroundStarsMaterial);
milkyWayGroup.add(backgroundStars);

// Middle Greenish Layer (Spiral Stars)
const milkyWayStarsGeometry = new THREE.BufferGeometry();
const milkyWayStarsPositions = new Float32Array(milkyWayStarsCount * 3);
const milkyWayStarsPhases = new Float32Array(milkyWayStarsCount);
const milkyWayStarsColors = new Float32Array(milkyWayStarsCount * 3);
const milkyWayStarsSizes = new Float32Array(milkyWayStarsCount);
for (let i = 0; i < milkyWayStarsCount; i++) {
    const arm = Math.floor(Math.random() * spiralArms);
    const r = Math.sqrt(Math.random()) * milkyWayDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / spiralArms) + Math.log(1 + r * armTightness * 0.019) * 1.7;
    const density = (Math.sin(baseTheta * spiralArms * 1.4) + 1.3) * 0.8; // Sharper density for cyclone effect
    if (Math.random() > density * 0.4) continue; // Tighter star placement
    const theta = baseTheta + (Math.random() - 0.5) * 0.4; // Reduced spread for defined arms
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * middleDiskThickness * (1 - r / milkyWayDiskRadius);
    milkyWayStarsPositions[i * 3] = x;
    milkyWayStarsPositions[i * 3 + 1] = y;
    milkyWayStarsPositions[i * 3 + 2] = z;
    milkyWayStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign green color for spiral ends (#00FF99), greenish base (#33CC99) elsewhere
    const isSpiralEnd = r > milkyWayDiskRadius * 0.8;
    milkyWayStarsColors[i * 3] = isSpiralEnd ? 75.0 / 255 : 147.0 / 255; // R
    milkyWayStarsColors[i * 3 + 1] = isSpiralEnd ? 0.0 / 255 : 112.0 / 255; // G
    milkyWayStarsColors[i * 3 + 2] = isSpiralEnd ? 130.0 / 255 : 219.0 / 255; // B
    milkyWayStarsSizes[i] = 0.7 + Math.random() * 0.7;
}
milkyWayStarsGeometry.setAttribute('position', new THREE.BufferAttribute(milkyWayStarsPositions, 3));
milkyWayStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(milkyWayStarsPhases, 1));
milkyWayStarsGeometry.setAttribute('color', new THREE.BufferAttribute(milkyWayStarsColors, 3));
milkyWayStarsGeometry.setAttribute('size', new THREE.BufferAttribute(milkyWayStarsSizes, 1));
const milkyWayStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.5 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const milkyWayStars = new THREE.Points(milkyWayStarsGeometry, milkyWayStarsMaterial);
milkyWayGroup.add(milkyWayStars);

// Middle Greenish Gas with Enhanced Gaseous Atmosphere
const gasGeometry = new THREE.PlaneGeometry(milkyWayDiskRadius * 2.8, milkyWayDiskRadius * 2.8, 128, 128);
const gasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xC71585) }, // Greenish
        intensity: { value: 1.1 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.02 - time * 0.3) * 0.5 + 0.7; // Sharper spiral
            float rotation = mod(theta - time * 0.15, 6.28318530718);
            float cloud = turbulence(vPosition.xy * 0.008 + vec2(cos(rotation), sin(rotation)) * 0.15); // Denser clouds
            float dust = turbulence(vPosition.xy * 0.015 + vec2(cos(theta * ${spiralArms}.0), sin(theta * ${spiralArms}.0)) * 0.07);
            float dustEffect = smoothstep(0.2, 0.5, dust) * 0.6; // Softer dust for visibility
            float glow = exp(-dist * 0.0015) * spiral * (0.7 + 0.3 * cloud) * (1.2 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.4); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const milkyWayGas = new THREE.Mesh(gasGeometry, gasMaterial);
milkyWayGas.position.y = -1;
milkyWayGas.renderOrder = 1;
milkyWayGroup.add(milkyWayGas);

// Nebular Glow for Spiral Arms (Middle Layer)
const nebulaGeometry = new THREE.PlaneGeometry(milkyWayDiskRadius * 2.4, milkyWayDiskRadius * 2.4, 128, 128);
const nebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0xD4A017) }, // Green for spiral ends
        intensity: { value: 1.5 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.02 - time * 0.2) * 0.5 + 0.5; // Sharper spiral
            float cloud = turbulence(vPosition.xy * 0.01 + vec2(cos(time * 0.05), sin(time * 0.05)) * 0.15);
            float glow = exp(-dist * 0.0015) * spiral * (0.6 + 0.4 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.4); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const nebulaGlow = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
nebulaGlow.position.y = 0;
nebulaGlow.renderOrder = 2;
milkyWayGroup.add(nebulaGlow);

// Background Stars for Outer Dark Blue Layer
const outerBackgroundStarsGeometry = new THREE.BufferGeometry();
const outerBackgroundStarsPositions = new Float32Array(backgroundStarsCount * 3);
const outerBackgroundStarsPhases = new Float32Array(backgroundStarsCount);
const outerBackgroundStarsColors = new Float32Array(backgroundStarsCount * 3);
const outerBackgroundStarsSizes = new Float32Array(backgroundStarsCount);
for (let i = 0; i < backgroundStarsCount; i++) {
    const r = Math.sqrt(Math.random()) * outerDiskRadius * 1.4;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * outerDiskThickness * (1 - r / outerDiskRadius);
    outerBackgroundStarsPositions[i * 3] = x;
    outerBackgroundStarsPositions[i * 3 + 1] = y;
    outerBackgroundStarsPositions[i * 3 + 2] = z;
    outerBackgroundStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign dark blue color (#003366)
    outerBackgroundStarsColors[i * 3] = 25.0 / 255; // R
    outerBackgroundStarsColors[i * 3 + 1] = 25.0 / 255; // G
    outerBackgroundStarsColors[i * 3 + 2] = 112.0 / 255; // B
    outerBackgroundStarsSizes[i] = 0.6 + Math.random() * 0.7;
}
outerBackgroundStarsGeometry.setAttribute('position', new THREE.BufferAttribute(outerBackgroundStarsPositions, 3));
outerBackgroundStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(outerBackgroundStarsPhases, 1));
outerBackgroundStarsGeometry.setAttribute('color', new THREE.BufferAttribute(outerBackgroundStarsColors, 3));
outerBackgroundStarsGeometry.setAttribute('size', new THREE.BufferAttribute(outerBackgroundStarsSizes, 1));
const outerBackgroundStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.15, 1.0);
            vOpacity = (0.35 + 0.45 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (1.6 + 0.6 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float dist = length(vPosition.xz);
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.08, 6.28318530718);
            float brightness = 0.85 + 0.15 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const outerBackgroundStars = new THREE.Points(outerBackgroundStarsGeometry, outerBackgroundStarsMaterial);
milkyWayGroup.add(outerBackgroundStars);

// Outer Dark Blue Layer (Spiral Stars)
const outerStarsGeometry = new THREE.BufferGeometry();
const outerStarsPositions = new Float32Array(outerStarsCount * 3);
const outerStarsPhases = new Float32Array(outerStarsCount);
const outerStarsColors = new Float32Array(outerStarsCount * 3);
const outerStarsSizes = new Float32Array(outerStarsCount);
for (let i = 0; i < outerStarsCount; i++) {
    const arm = Math.floor(Math.random() * spiralArms);
    const r = Math.sqrt(Math.random()) * outerDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / spiralArms) + Math.log(1 + r * armTightness * 0.018) * 1.8;
    const density = (Math.sin(baseTheta * spiralArms * 1.5) + 1.4) * 0.9; // Sharper density
    if (Math.random() > density * 0.4) continue; // Tighter star placement
    const theta = baseTheta + (Math.random() - 0.5) * 0.3; // Reduced spread
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * outerDiskThickness * (1 - r / outerDiskRadius);
    outerStarsPositions[i * 3] = x;
    outerStarsPositions[i * 3 + 1] = y;
    outerStarsPositions[i * 3 + 2] = z;
    outerStarsPhases[i] = Math.random() * Math.PI * 2;
    // Assign dark blue color (#003366)
    outerStarsColors[i * 3] = 70.0 / 255; // R
    outerStarsColors[i * 3 + 1] = 130.0 / 255; // G
    outerStarsColors[i * 3 + 2] = 180.0 / 255; // B
    outerStarsSizes[i] = 0.7 + Math.random() * 0.7;
}
outerStarsGeometry.setAttribute('position', new THREE.BufferAttribute(outerStarsPositions, 3));
outerStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(outerStarsPhases, 1));
outerStarsGeometry.setAttribute('color', new THREE.BufferAttribute(outerStarsColors, 3));
outerStarsGeometry.setAttribute('size', new THREE.BufferAttribute(outerStarsSizes, 1));
const outerStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.15, 1.0);
            vOpacity = (0.45 + 0.45 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.0 + 1.2 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const outerStars = new THREE.Points(outerStarsGeometry, outerStarsMaterial);
milkyWayGroup.add(outerStars);

// Outer Dark Blue Gas with Enhanced Gaseous Atmosphere
const outerGasGeometry = new THREE.PlaneGeometry(outerDiskRadius * 2.9, outerDiskRadius * 2.9, 128, 128);
const outerGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0x191970) }, // Dark blue
        intensity: { value: 0.85 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.015 - time * 0.25) * 0.6 + 0.7; // Sharper spiral
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float cloud = turbulence(vPosition.xy * 0.006 + vec2(cos(rotation), sin(rotation)) * 0.32); // Denser clouds
            float dust = turbulence(vPosition.xy * 0.012 + vec2(cos(theta * ${spiralArms}.0), sin(theta * ${spiralArms}.0)) * 0.06);
            float dustEffect = smoothstep(0.2, 0.7, dust) * 0.7; // Softer dust
            float glow = exp(-dist * 0.001) * spiral * (0.6 + 0.5 * cloud) * (1.4 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.6); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const outerGas = new THREE.Mesh(outerGasGeometry, outerGasMaterial);
outerGas.position.y = -1;
outerGas.renderOrder = 3;
milkyWayGroup.add(outerGas);

// Nebular Glow for Spiral Arms (Outer Layer)
const outerNebulaGeometry = new THREE.PlaneGeometry(outerDiskRadius * 2.5, outerDiskRadius * 2.5, 128, 128);
const outerNebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0xFF0000) }, // Dark blue
        intensity: { value: 0.45 } // Increased for visibility
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float turbulence(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            vec2 shift = vec2(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${spiralArms}.0 + dist * 0.015 - time * 0.16) * 0.5 + 0.7; // Sharper spiral
            float cloud = turbulence(vPosition.xy * 0.008 + vec2(cos(time * 0.04), sin(time * 0.04)) * 0.15);
            float glow = exp(-dist * 0.001) * spiral * (0.5 + 0.5 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.5); // Increased opacity
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const outerNebulaGlow = new THREE.Mesh(outerNebulaGeometry, outerNebulaMaterial);
outerNebulaGlow.position.y = 0;
outerNebulaGlow.renderOrder = 4;
milkyWayGroup.add(outerNebulaGlow);

// Stellar Halo with Enhanced 3D Effect
const haloGeometry = new THREE.BufferGeometry();
const haloPositions = new Float32Array(haloStarsCount * 3);
const haloPhases = new Float32Array(haloStarsCount);
const haloColors = new Float32Array(haloStarsCount * 3);
const haloSizes = new Float32Array(haloStarsCount);
for (let i = 0; i < haloStarsCount; i++) {
    const r = Math.pow(Math.random(), 2.0) * outerDiskRadius * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    const z = r * Math.cos(phi);
    haloPositions[i * 3] = x;
    haloPositions[i * 3 + 1] = y;
    haloPositions[i * 3 + 2] = z;
    haloPhases[i] = Math.random() * Math.PI * 2;
    // Base color for halo (white, modified in shader for rainbow effect)
    haloColors[i * 3] = 1.2;
    haloColors[i * 3 + 1] = 1.1;
    haloColors[i * 3 + 2] = 1.9;
    haloSizes[i] = 0.8 + Math.random() * 1.9 // Larger sizes for prominence
}
haloGeometry.setAttribute('position', new THREE.BufferAttribute(haloPositions, 3));
haloGeometry.setAttribute('phase', new THREE.BufferAttribute(haloPhases, 1));
haloGeometry.setAttribute('color', new THREE.BufferAttribute(haloColors, 3));
haloGeometry.setAttribute('size', new THREE.BufferAttribute(haloSizes, 1));
const haloMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.2, 1.0);
            vOpacity = (0.2 + 0.3 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            float phi = acos(position.y / length(position));
            pos.x += sin(time * 0.5 + phase) * 2.7 * sin(phi); // 3D displacement
            pos.y += cos(time * 0.5 + phase) * 2.5 * sin(phi);
            pos.z += sin(time * 0.5 + phase) * 2.2 * cos(phi);
            gl_PointSize = size * (1.5 + 0.8 * sin(mod(time, 100.0) + phase)) * distFactor * 3.4; // Larger points
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.6);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }
        void main() {
            float theta = atan(vPosition.z, vPosition.x);
            float hue = mod(theta + time * 0.8, 6.28318530718) / 6.283185307 eighteen; // Faster hue cycle
            vec3 rainbowColor = hsv2rgb(vec3(hue, 0.9, 1.3)); // Higher saturation
            float brightness = 0.9 + 0.2 * sin(theta * 2.0 + time * 1.8); // Dynamic flares
            gl_FragColor = vec4(rainbowColor * brightness, vOpacity * brightness * 0.97);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const milkyWayHalo = new THREE.Points(haloGeometry, haloMaterial);
milkyWayHalo.renderOrder = 0;
milkyWayGroup.add(milkyWayHalo);

// Central Bulge (Purple)
const bulgeStarsCount = 5000;
const bulgeRadius = 100;
const bulgeGeometry = new THREE.BufferGeometry();
const bulgePositions = new Float32Array(bulgeStarsCount * 3);
const bulgePhases = new Float32Array(bulgeStarsCount);
const bulgeColors = new Float32Array(bulgeStarsCount * 3);
const bulgeSizes = new Float32Array(bulgeStarsCount);
for (let i = 0; i < bulgeStarsCount; i++) {
    const r = Math.pow(Math.random(), 1.5) * bulgeRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.4;
    const z = r * Math.cos(phi);
    bulgePositions[i * 3] = x;
    bulgePositions[i * 3 + 1] = y;
    bulgePositions[i * 3 + 2] = z;
    bulgePhases[i] = Math.random() * Math.PI * 2;
    // Assign purple color (#660066)
    bulgeColors[i * 3] = 255.0 / 255; // R
    bulgeColors[i * 3 + 1] = 140.0 / 255; // G
    bulgeColors[i * 3 + 2] = 0.0 / 255; // B
    bulgeSizes[i] = 1.0 + Math.random() * 1.4;
}
bulgeGeometry.setAttribute('position', new THREE.BufferAttribute(bulgePositions, 3));
bulgeGeometry.setAttribute('phase', new THREE.BufferAttribute(bulgePhases, 1));
bulgeGeometry.setAttribute('color', new THREE.BufferAttribute(bulgeColors, 3));
bulgeGeometry.setAttribute('size', new THREE.BufferAttribute(bulgeSizes, 1));
const bulgeMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.15, 1.2);
            vOpacity = (0.6 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.2;
            gl_PointSize = size * (3.0 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.3);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.2, 6.28318530718);
            float brightness = 0.9 + 0.1 * sin(rotation * 2.4);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const milkyWayBulge = new THREE.Points(bulgeGeometry, bulgeMaterial);
milkyWayBulge.renderOrder = 0;
milkyWayGroup.add(milkyWayBulge);

// 🎯 Invisible and Non-Rendering Clickable Object for Bulge
const bulgeClickableGeom = new THREE.SphereGeometry(800, 64, 64);
const bulgeClickableMat = new THREE.MeshBasicMaterial({ visible: false }); // Completely non-rendering
const bulgeClickableObject = new THREE.Mesh(bulgeClickableGeom, bulgeClickableMat);
bulgeClickableObject.name = 'milkyway';
bulgeClickableObject.position.set(0, 0, 0);
milkyWayGroup.add(bulgeClickableObject);

// Central Gas Glow with Accretion Disk Effect
const coreGasGeometry = new THREE.SphereGeometry(90, 32, 32);
const coreGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xDC143C) }, // Purple
        accretionColor: { value: new THREE.Color(0xD4A017) }, // Blue for accretion disk
        intensity: { value: 2.6 }
    },
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform vec3 accretionColor;
        uniform float intensity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        float noise(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }
        float turbulence(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            vec3 shift = vec3(100.0);
            for (int i = 0; i < 6; i++) {
                v += a * noise(p);
                p = p * 2.0 + shift;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition);
            float theta = atan(vPosition.y, vPosition.x);
            float rotation = mod(theta - time * 0.3, 6.28318530718);
            float spiral = sin(theta * 2.0 - dist * 0.1 + rotation) * 0.5 + 0.5;
            float cloud = turbulence(vPosition * 0.02 + vec3(cos(rotation), sin(rotation), 0.0) * 0.1);
            float pulse = 0.8 + 0.2 * sin(time * 0.5);
            float accretion = smoothstep(0.8, 1.0, abs(vNormal.z));
            vec3 finalColor = mix(gasColor, accretionColor, accretion * 0.3);
            float glow = exp(-dist * 0.02) * (0.5 + 0.5 * cloud) * spiral * pulse;
            gl_FragColor = vec4(finalColor * intensity * glow, glow * 0.5);
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const coreGas = new THREE.Mesh(coreGasGeometry, coreGasMaterial);
coreGas.position.y = 0;
coreGas.renderOrder = 5;
milkyWayGroup.add(coreGas);

// Positioning and Slanting the Milky Way
milkyWayGroup.position.set(milkyWayRadius, 0, 0);
milkyWayGroup.rotation.x = Math.PI / 6.6;
milkyWayGroup.rotation.z = Math.PI / 8;
scene.add(milkyWayGroup);
createLabel('Milky Way', milkyWayGroup.position.clone().add(new THREE.Vector3(0, 200, 0)), 3);
// Defining the Andromeda Galaxy (M31) with realistic colors, layers, and distance-based dispersion
const andromedaGroup = new THREE.Group();
const andromedaRadius = 5000; // Slightly farther than Milky Way for visual distinction
const andromedaDiskRadius = 600; // Larger than Milky Way (500 units) to reflect ~1.5x size
const andromedaOuterDiskRadius = 840; // Scaled proportionally (700 * 1.2)
const andromedaStarsCount = 9800; // Slightly more stars in spiral arms
const andromedaOuterStarsCount = 10000; // Outer spiral arms
const andromedaBackgroundStarsCount = 20000; // Background stars
const andromedaHaloStarsCount = 1000; // Stellar halo
const andromedaMiddleDiskThickness = 15; // Slightly thicker middle layer
const andromedaOuterDiskThickness = 25; // Scaled outer layer
const andromedaSpiralArms = 5; // Andromeda has two prominent spiral arms
const andromedaArmTightness = 1.1; // Slightly looser spirals for a different look
const andromedaBarLength = 45; // Length of the central bar

// Background Stars for Middle Blue Layer (Andromeda's Spiral Arms)
const andromedaBackgroundStarsGeometry = new THREE.BufferGeometry();
const andromedaBackgroundStarsPositions = new Float32Array(andromedaBackgroundStarsCount * 3);
const andromedaBackgroundStarsPhases = new Float32Array(andromedaBackgroundStarsCount);
const andromedaBackgroundStarsColors = new Float32Array(andromedaBackgroundStarsCount * 3);
const andromedaBackgroundStarsSizes = new Float32Array(andromedaBackgroundStarsCount);
for (let i = 0; i < andromedaBackgroundStarsCount; i++) {
    const r = Math.sqrt(Math.random()) * andromedaDiskRadius;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * andromedaMiddleDiskThickness * (1 - r / andromedaDiskRadius);
    andromedaBackgroundStarsPositions[i * 3] = x;
    andromedaBackgroundStarsPositions[i * 3 + 1] = y;
    andromedaBackgroundStarsPositions[i * 3 + 2] = z;
    andromedaBackgroundStarsPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.1 - 0.08;
    andromedaBackgroundStarsColors[i * 3] = 0.4 + colorVariation;
    andromedaBackgroundStarsColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaBackgroundStarsColors[i * 3 + 2] = 1.0 + colorVariation * 1.8; // Blue tint for spiral arms
    andromedaBackgroundStarsSizes[i] = 0.5 + Math.random() * 0.6;
}
andromedaBackgroundStarsGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaBackgroundStarsPositions, 3));
andromedaBackgroundStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaBackgroundStarsPhases, 1));
andromedaBackgroundStarsGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaBackgroundStarsColors, 3));
andromedaBackgroundStarsGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaBackgroundStarsSizes, 1));
const andromedaBackgroundStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.3 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (1.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float dist = length(vPosition.xz);
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float brightness = 0.8 + 0.2 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaBackgroundStars = new THREE.Points(andromedaBackgroundStarsGeometry, andromedaBackgroundStarsMaterial);
andromedaGroup.add(andromedaBackgroundStars);

// Middle Blue Layer (Spiral Stars with Motion Trails)
const andromedaStarsGeometry = new THREE.BufferGeometry();
const andromedaStarsPositions = new Float32Array(andromedaStarsCount * 3);
const andromedaStarsPhases = new Float32Array(andromedaStarsCount);
const andromedaStarsColors = new Float32Array(andromedaStarsCount * 3);
const andromedaStarsSizes = new Float32Array(andromedaStarsCount);
for (let i = 0; i < andromedaStarsCount; i++) {
    const arm = Math.floor(Math.random() * andromedaSpiralArms);
    const r = Math.sqrt(Math.random()) * andromedaDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / andromedaSpiralArms) + Math.log(1 + r * andromedaArmTightness * 0.015);
    const density = (Math.sin(baseTheta * andromedaSpiralArms) + 1) * 0.5;
    if (Math.random() > density * 0.5) continue;
    const theta = baseTheta + (Math.random() - 0.5) * 0.3;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * andromedaMiddleDiskThickness * (1 - r / andromedaDiskRadius);
    andromedaStarsPositions[i * 3] = x;
    andromedaStarsPositions[i * 3 + 1] = y;
    andromedaStarsPositions[i * 3 + 2] = z;
    andromedaStarsPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.15 - 0.075;
    andromedaStarsColors[i * 3] = 0.4 + colorVariation;
    andromedaStarsColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaStarsColors[i * 3 + 2] = 1.0 + colorVariation * 1.5; // Blue tint
    andromedaStarsSizes[i] = 0.6 + Math.random() * 0.6;
}
andromedaStarsGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaStarsPositions, 3));
andromedaStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaStarsPhases, 1));
andromedaStarsGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaStarsColors, 3));
andromedaStarsGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaStarsSizes, 1));
const andromedaStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.5 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.2 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.5 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaStars = new THREE.Points(andromedaStarsGeometry, andromedaStarsMaterial);
andromedaGroup.add(andromedaStars);

// Middle Blue Gas with Dust Lanes
const andromedaGasGeometry = new THREE.PlaneGeometry(andromedaDiskRadius * 2.5, andromedaDiskRadius * 2.5, 128, 128);
const andromedaGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xDC143C) }, // Blue for spiral arms
        intensity: { value: 1.4 }
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.015 - time * 0.3) * 0.5 + 0.5;
            float rotation = mod(theta - time * 0.15, 6.28318530718);
            float cloud = fbm(vPosition.xy * 0.005 + vec2(cos(rotation), sin(rotation)) * 0.2);
            float dust = fbm(vPosition.xy * 0.01 + vec2(cos(theta * ${andromedaSpiralArms}.0), sin(theta * ${andromedaSpiralArms}.0)) * 0.07);
            float dustEffect = smoothstep(0.4, 0.8, dust) * 0.5;
            float glow = exp(-dist * 0.002) * spiral * (0.6 + 0.4 * cloud) * (1.5 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.5);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaGas = new THREE.Mesh(andromedaGasGeometry, andromedaGasMaterial);
andromedaGas.position.y = -1;
andromedaGas.renderOrder = 1;
andromedaGroup.add(andromedaGas);

// Nebular Glow for Spiral Arms (Middle Layer)
const andromedaNebulaGeometry = new THREE.PlaneGeometry(andromedaDiskRadius * 2.5, andromedaDiskRadius * 2.5, 128, 128);
const andromedaNebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0xD4A017) }, // Blue
        intensity: { value: 2.4 }
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.015 - time * 0.2) * 0.5 + 0.8;
            float cloud = fbm(vPosition.xy * 0.008 + vec2(cos(time * 0.05), sin(time * 0.05)) * 0.2);
            float glow = exp(-dist * 0.0025) * spiral * (0.5 + 0.5 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.4);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaNebulaGlow = new THREE.Mesh(andromedaNebulaGeometry, andromedaNebulaMaterial);
andromedaNebulaGlow.position.y = 0;
andromedaNebulaGlow.renderOrder = 2;
andromedaGroup.add(andromedaNebulaGlow);

// Outer Blue Layer (Spiral Stars with Motion Trails)
const andromedaOuterStarsGeometry = new THREE.BufferGeometry();
const andromedaOuterStarsPositions = new Float32Array(andromedaOuterStarsCount * 3);
const andromedaOuterStarsPhases = new Float32Array(andromedaOuterStarsCount);
const andromedaOuterStarsColors = new Float32Array(andromedaOuterStarsCount * 3);
const andromedaOuterStarsSizes = new Float32Array(andromedaOuterStarsCount);
for (let i = 0; i < andromedaOuterStarsCount; i++) {
    const arm = Math.floor(Math.random() * andromedaSpiralArms);
    const r = Math.sqrt(Math.random()) * andromedaOuterDiskRadius;
    const baseTheta = arm * (Math.PI * 2 / andromedaSpiralArms) + Math.log(1 + r * andromedaArmTightness * 0.022);
    const density = (Math.sin(baseTheta * andromedaSpiralArms) + 1) * 0.5;
    if (Math.random() > density * 0.5) continue;
    const theta = baseTheta + (Math.random() - 0.5) * 0.25;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * andromedaOuterDiskThickness * (1 - r / andromedaOuterDiskRadius);
    andromedaOuterStarsPositions[i * 3] = x;
    andromedaOuterStarsPositions[i * 3 + 1] = y;
    andromedaOuterStarsPositions[i * 3 + 2] = z;
    andromedaOuterStarsPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.15 - 0.075;
    andromedaOuterStarsColors[i * 3] = 0.4 + colorVariation;
    andromedaOuterStarsColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaOuterStarsColors[i * 3 + 2] = 1.0 + colorVariation * 1.5; // Blue tint
    andromedaOuterStarsSizes[i] = 0.6 + Math.random() * 0.6;
}
andromedaOuterStarsGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaOuterStarsPositions, 3));
andromedaOuterStarsGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaOuterStarsPhases, 1));
andromedaOuterStarsGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaOuterStarsColors, 3));
andromedaOuterStarsGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaOuterStarsSizes, 1));
const andromedaOuterStarsMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.4 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            float theta = atan(position.z, position.x);
            pos.x += cos(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.z += sin(theta) * sin(time * 0.15 + phase) * 2.0;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (2.0 + 1.2 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaOuterStars = new THREE.Points(andromedaOuterStarsGeometry, andromedaOuterStarsMaterial);
andromedaGroup.add(andromedaOuterStars);

// Outer Blue Gas with Dust Lanes
const andromedaOuterGasGeometry = new THREE.PlaneGeometry(andromedaOuterDiskRadius * 2.9, andromedaOuterDiskRadius * 2.9, 128, 128);
const andromedaOuterGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0x0F52BA) }, // Blue
        intensity: { value: 0.65}
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3.ConcurrentModificationException vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.012 - time * 0.25) * 0.5 + 0.5;
            float rotation = mod(theta - time * 0.1, 6.28318530718);
            float cloud = fbm(vPosition.xy * 0.004 + vec2(cos(rotation), sin(rotation)) * 0.06);
            float dust = fbm(vPosition.xy * 0.008 + vec2(cos(theta * ${andromedaSpiralArms}.0), sin(theta * ${andromedaSpiralArms}.0)) * 0.3);
            float dustEffect = smoothstep(0.4, 0.8, dust) * 0.7;
            float glow = exp(-dist * 0.0015) * spiral * (0.5 + 0.5 * cloud) * (1.0 - dustEffect);
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.3);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaOuterGas = new THREE.Mesh(andromedaOuterGasGeometry, andromedaOuterGasMaterial);
andromedaOuterGas.position.y = -1;
andromedaOuterGas.renderOrder = 3;
andromedaGroup.add(andromedaOuterGas);

// Nebular Glow for Spiral Arms (Outer Layer)
const andromedaOuterNebulaGeometry = new THREE.PlaneGeometry(andromedaOuterDiskRadius * 2.9, andromedaOuterDiskRadius * 2.9, 128, 128);
const andromedaOuterNebulaMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        nebulaColor: { value: new THREE.Color(0x6A0DAD) }, // Blue
        intensity: { value: 1.6 }
    },
    vertexShader: `
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.2);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 nebulaColor;
        uniform float intensity;
        varying vec3 vPosition;
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float fbm(vec2 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition.xy);
            float theta = atan(vPosition.y, vPosition.x);
            float spiral = sin(theta * ${andromedaSpiralArms}.0 + dist * 0.012 - time * 0.15) * 0.5 + 0.7;
            float cloud = fbm(vPosition.xy * 0.006 + vec2(cos(time * 0.04), sin(time * 0.04)) * 0.18);
            float glow = exp(-dist * 0.002) * spiral * (0.5 + 0.6 * cloud);
            gl_FragColor = vec4(nebulaColor * intensity * glow, glow * 0.5);
        }
    `,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaOuterNebulaGlow = new THREE.Mesh(andromedaOuterNebulaGeometry, andromedaOuterNebulaMaterial);
andromedaOuterNebulaGlow.position.y = 0;
andromedaOuterNebulaGlow.renderOrder = 4;
andromedaGroup.add(andromedaOuterNebulaGlow);

// Stellar Halo (Faint, Spherical Distribution)
const andromedaHaloGeometry = new THREE.BufferGeometry();
const andromedaHaloPositions = new Float32Array(andromedaHaloStarsCount * 3);
const andromedaHaloPhases = new Float32Array(andromedaHaloStarsCount);
const andromedaHaloColors = new Float32Array(andromedaHaloStarsCount * 3);
const andromedaHaloSizes = new Float32Array(andromedaHaloStarsCount);
for (let i = 0; i < andromedaHaloStarsCount; i++) {
    const r = Math.pow(Math.random(), 2.0) * andromedaOuterDiskRadius * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
    const z = r * Math.cos(phi);
  andromedaHaloPositions[i * 3] = x;
    andromedaHaloPositions[i * 3 + 1] = y;
    andromedaHaloPositions[i * 3 + 2] = z;
    andromedaHaloPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.05 - 0.025;
    andromedaHaloColors[i * 3] = 0.8 + colorVariation;
    andromedaHaloColors[i * 3 + 1] = 0.8 + colorVariation;
    andromedaHaloColors[i * 3 + 2] = 1.0 + colorVariation;
    andromedaHaloSizes[i] = 0.4 + Math.random() * 0.4;
}
andromedaHaloGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaHaloPositions, 3));
andromedaHaloGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaHaloPhases, 1));
andromedaHaloGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaHaloColors, 3));
andromedaHaloGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaHaloSizes, 1));
const andromedaHaloMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.1 + 0.2 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 1.0;
            gl_PointSize = size * (1.0 + 0.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaHalo = new THREE.Points(andromedaHaloGeometry, andromedaHaloMaterial);
andromedaHalo.renderOrder = 0;
andromedaGroup.add(andromedaHalo);

// Central Bar (Yellowish, Representing the Barred Structure)
const barStarsCount = 2000;
const barGeometry = new THREE.BufferGeometry();
const barPositions = new Float32Array(barStarsCount * 3);
const barPhases = new Float32Array(barStarsCount);
const barColors = new Float32Array(barStarsCount * 3);
const barSizes = new Float32Array(barStarsCount);
for (let i = 0; i < barStarsCount; i++) {
    const t = Math.random() * 2 - 1; // -1 to 1 along the bar
    const x = t * andromedaBarLength;
    const z = (Math.random() - 0.5) * 10; // Small spread along z-axis
    const y = (Math.random() - 0.5) * 5; // Small spread along y-axis
    barPositions[i * 3] = x;
    barPositions[i * 3 + 1] = y;
    barPositions[i * 3 + 2] = z;
    barPhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.1 - 0.05;
    barColors[i * 3] = 1.0 + colorVariation;
    barColors[i * 3 + 1] = 0.9 + colorVariation;
    barColors[i * 3 + 2] = 0.5 + colorVariation; // Yellowish tint
    barSizes[i] = 0.8 + Math.random() * 1.0;
}
barGeometry.setAttribute('position', new THREE.BufferAttribute(barPositions, 3));
barGeometry.setAttribute('phase', new THREE.BufferAttribute(barPhases, 1));
barGeometry.setAttribute('color', new THREE.BufferAttribute(barColors, 3));
barGeometry.setAttribute('size', new THREE.BufferAttribute(barSizes, 1));
const barMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.6 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 1.0;
            gl_PointSize = size * (2.5 + 1.0 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        varying float vOpacity;
        varying vec3 vColor;
        void main() {
            gl_FragColor = vec4(vColor, vOpacity);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaBar = new THREE.Points(barGeometry, barMaterial);
andromedaGroup.add(andromedaBar);

// Central Bulge (Yellowish, Enhanced Twinkling)
const andromedaBulgeStarsCount = 2000;
const andromedaBulgeRadius = 100; // Slightly larger than Milky Way's bulge
const andromedaBulgeGeometry = new THREE.BufferGeometry();
const andromedaBulgePositions = new Float32Array(andromedaBulgeStarsCount * 3);
const andromedaBulgePhases = new Float32Array(andromedaBulgeStarsCount);
const andromedaBulgeColors = new Float32Array(andromedaBulgeStarsCount * 3);
const andromedaBulgeSizes = new Float32Array(andromedaBulgeStarsCount);
for (let i = 0; i < andromedaBulgeStarsCount; i++) {
    const r = Math.pow(Math.random(), 1.5) * andromedaBulgeRadius;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta) * 0.4;
    const z = r * Math.cos(phi);
    andromedaBulgePositions[i * 3] = x;
    andromedaBulgePositions[i * 3 + 1] = y;
    andromedaBulgePositions[i * 3 + 2] = z;
    andromedaBulgePhases[i] = Math.random() * Math.PI * 2;
    const colorVariation = Math.random() * 0.1 - 0.05;
    andromedaBulgeColors[i * 3] = 1.0 + colorVariation;
    andromedaBulgeColors[i * 3 + 1] = 0.9 + colorVariation;
    andromedaBulgeColors[i * 3 + 2] = 0.5 + colorVariation; // Yellowish tint
    andromedaBulgeSizes[i] = 1.0 + Math.random() * 1.2;
}
andromedaBulgeGeometry.setAttribute('position', new THREE.BufferAttribute(andromedaBulgePositions, 3));
andromedaBulgeGeometry.setAttribute('phase', new THREE.BufferAttribute(andromedaBulgePhases, 1));
andromedaBulgeGeometry.setAttribute('color', new THREE.BufferAttribute(andromedaBulgeColors, 3));
andromedaBulgeGeometry.setAttribute('size', new THREE.BufferAttribute(andromedaBulgeSizes, 1));
const andromedaBulgeMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 }, cameraPos: { value: new THREE.Vector3() } },
    vertexShader: `
        attribute float phase;
        attribute vec3 color;
        attribute float size;
        uniform float time;
        uniform vec3 cameraPos;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            vPosition = position;
            vec3 worldPos = (modelMatrix * vec4(position, 1.0)).xyz;
            float dist = length(cameraPos - worldPos);
            float distFactor = clamp(1.0 - dist / 5000.0, 0.1, 1.0);
            vOpacity = (0.6 + 0.4 * sin(mod(time, 100.0) + phase)) * distFactor;
            vColor = color;
            vec3 pos = position;
            pos.y += sin(time * 0.5 + phase) * 2.0;
            gl_PointSize = size * (3.0 + 1.5 * sin(mod(time, 100.0) + phase)) * distFactor * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        varying float vOpacity;
        varying vec3 vColor;
        varying vec3 vPosition;
        void main() {
            float theta = atan(vPosition.z, vPosition.x);
            float rotation = mod(theta - time * 0.2, 6.28318530718);
            float brightness = 0.9 + 0.1 * sin(rotation * 2.0);
            gl_FragColor = vec4(vColor * brightness, vOpacity * brightness);
        }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending
});
const andromedaBulge = new THREE.Points(andromedaBulgeGeometry, andromedaBulgeMaterial);
andromedaBulge.renderOrder = 0;
andromedaGroup.add(andromedaBulge);

// Central Gas Glow (Yellowish, Brighter)
const andromedaCoreGasGeometry = new THREE.SphereGeometry(80, 32, 32);
const andromedaCoreGasMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        gasColor: { value: new THREE.Color(0xD4A017) }, // Yellowish (gold-like)
        intensity: { value: 2.9 }
    },
    vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 gasColor;
        uniform float intensity;
        varying vec3 vPosition;
        varying vec3 vNormal;
        float noise(vec3 p) {
            return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
        }
        float fbm(vec3 p) {
            float v = 0.0;
            float a = 0.5;
            for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0;
                a *= 0.5;
            }
            return v;
        }
        void main() {
            float dist = length(vPosition);
            float theta = atan(vPosition.y, vPosition.x);
            float rotation = mod(theta - time * 0.3, 6.28318530718);
            float spiral = sin(theta * 2.0 - dist * 0.1 + rotation) * 0.5 + 0.5;
            float cloud = fbm(vPosition * 0.02 + vec3(cos(rotation), sin(rotation), 0.0) * 0.3);
            float glow = exp(-dist * 0.02) * (0.5 + 0.5 * cloud) * spiral;
            gl_FragColor = vec4(gasColor * intensity * glow, glow * 0.6);
        }
    `,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false
});
const andromedaCoreGas = new THREE.Mesh(andromedaCoreGasGeometry, andromedaCoreGasMaterial);
andromedaCoreGas.position.y = 0;
andromedaCoreGas.renderOrder = 5;
andromedaGroup.add(andromedaCoreGas);

// Positioning and Slanting the Andromeda Galaxy (Different orientation for distinction)
andromedaGroup.position.set(andromedaRadius, -2500, -5000); // Offset from Milky Way
andromedaGroup.rotation.x = Math.PI / 6; // More tilted than Milky Way
andromedaGroup.rotation.z = -Math.PI / 6;
scene.add(andromedaGroup);
createLabel('Andromeda Galaxy', andromedaGroup.position.clone().add(new THREE.Vector3(0, 200, 0)), 3);

// Comets
const comets = [];
const cometsCount = 30; // Reduced for performance
const cometBeltInnerRadius = 100; // Beyond Saturn
const cometBeltWidth = 100;
const minPerihelion = 25; // Safe distance from Sun (radius 10 + buffer)

for (let i = 0; i < cometsCount; i++) {
    // Comet Core
    const cometGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const cometMat = new THREE.MeshStandardMaterial({
        color: 0xDCDCDC, // Light cyan for realism
        emissive: 0x00BFFF, // Ion tail blue
        emissiveIntensity: 0.8,
        roughness: 0.4,
    });
    const comet = new THREE.Mesh(cometGeom, cometMat);
    comet.name = `comet${i + 1}`; // Unique name for each comet (e.g., Comet1, Comet2, etc.)
    const semiMajor = cometBeltInnerRadius + Math.random() * cometBeltWidth;
    const eccentricity = 0.6 + Math.random() * 0.6; // High eccentricity
    const perihelion = semiMajor * (1 - eccentricity);
    const adjustedSemiMajor = Math.max(semiMajor, minPerihelion / (1 - eccentricity));
    const semiMinor = adjustedSemiMajor * Math.sqrt(1 - eccentricity * eccentricity);
    const theta = Math.random() * Math.PI * 2;
    const x = adjustedSemiMajor * Math.cos(theta) - adjustedSemiMajor * eccentricity;
    const z = semiMinor * Math.sin(theta);
    comet.position.set(x, (Math.random() - 0.5) * 1.5, z);
    comet.userData = {
        theta,
        semiMajor: adjustedSemiMajor,
        semiMinor,
        eccentricity,
        speed: 0.004 + Math.random() * 0.002,
    };
    scene.add(comet);
    
    // Comet Tail
    const tailLength = 1.6;
    const tailSegments = 12;
    const tailPositions = new Float32Array(tailSegments * 3);
    const tailOpacities = new Float32Array(tailSegments);
    for (let j = 0; j < tailSegments; j++) {
        const t = j / (tailSegments - 1);
        tailPositions[j * 3] = -t * tailLength;
        tailPositions[j * 3 + 1] = 0;
        tailPositions[j * 3 + 2] = 0;
        tailOpacities[j] = 1 - t * 0.9;
    }
    const tailGeom = new THREE.BufferGeometry();
    tailGeom.setAttribute('position', new THREE.BufferAttribute(tailPositions, 3));
    tailGeom.setAttribute('opacity', new THREE.BufferAttribute(tailOpacities, 0.3));
    const tailMat = new THREE.PointsMaterial({
        color: 0x00BFFF,
        size: 0.2,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
    });
    const tail = new THREE.Points(tailGeom, tailMat);
    comet.add(tail);
    
    comets.push({ comet, tail });
}

// Meteor
let meteor, meteorLight, meteorTrail;
const meteorStart = new THREE.Vector3(-250, 10, 50); // Start outside, slightly above and offset from Sun
const meteorEnd = new THREE.Vector3(250, -10, 50); // End outside, slightly below, passing near Sun
let meteorT = 0;
const meteorSpeed = 0.0008; // Adjusted speed for smooth one-way travel
loader.load('https://i.ibb.co/BH1prqs/photo-stone-texture-pattern-58702-16107.jpg', (texture) => {
    const geom = new THREE.IcosahedronGeometry(1.5, 3); // Larger for visibility
    const positions = geom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        const direction = vertex.clone().normalize();
        const randomOffset = (Math.random() - 0.5) * 0.3;
        vertex.addScaledVector(direction, randomOffset);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xC0C0C0, // Solar silver color
        roughness: 0.6, // Slightly less rough for shine
        metalness: 0.7, // Higher metalness for metallic silver look
        emissive: 0xD4D4D4, // Light silver emission
        emissiveIntensity: 0.5 // Visible glow
    });
    meteor = new THREE.Mesh(geom, mat);
    meteor.name = 'Meteor'; // Name for info panel
    meteor.position.copy(meteorStart);
    scene.add(meteor);
    
    // Meteor Light for enhanced visibility
    meteorLight = new THREE.PointLight(0xD4D4D4, 2, 25); // Brighter silver light
    meteorLight.position.copy(meteor.position);
    scene.add(meteorLight);
    
    // Meteor Trail for dynamic effect
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(100 * 3); // 100 points for trail
    const trailOpacities = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
        trailPositions[i * 3] = meteorStart.x;
        trailPositions[i * 3 + 1] = meteorStart.y;
        trailPositions[i * 3 + 2] = meteorStart.z;
        trailOpacities[i] = 1 - (i / 100); // Fade from 1 to 0
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('opacity', new THREE.BufferAttribute(trailOpacities, 1));
    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0xD4D4D4) } }, // Silver trail
        vertexShader: `
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0;
        }
      `,
        fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(color, vOpacity * 0.8);
        }
      `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    meteorTrail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(meteorTrail);
}, undefined, () => {
    const geom = new THREE.IcosahedronGeometry(1.5, 3); // Larger for visibility
    const positions = geom.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        const direction = vertex.clone().normalize();
        const randomOffset = (Math.random() - 0.5) * 0.3;
        vertex.addScaledVector(direction, randomOffset);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({
        color: 0xC0C0C0, // Solar silver color
        roughness: 0.6, // Slightly less rough for shine
        metalness: 0.7, // Higher metalness for metallic silver look
        emissive: 0xD4D4D4, // Light silver emission
        emissiveIntensity: 0.5 // Visible glow
    });
    meteor = new THREE.Mesh(geom, mat);
    meteor.name = 'Meteor'; // Name for info panel
    meteor.position.copy(meteorStart);
    scene.add(meteor);
    
    // Meteor Light for enhanced visibility
    meteorLight = new THREE.PointLight(0xD4D4D4, 2, 25); // Brighter silver light
    meteorLight.position.copy(meteor.position);
    scene.add(meteorLight);
    
    // Meteor Trail for dynamic effect
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(100 * 3); // 100 points for trail
    const trailOpacities = new Float32Array(100);
    for (let i = 0; i < 100; i++) {
        trailPositions[i * 3] = meteorStart.x;
        trailPositions[i * 3 + 1] = meteorStart.y;
        trailPositions[i * 3 + 2] = meteorStart.z;
        trailOpacities[i] = 1 - (i / 100); // Fade from 1 to 0
    }
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('opacity', new THREE.BufferAttribute(trailOpacities, 1));
    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0xD4D4D4) } }, // Silver trail
        vertexShader: `
        attribute float opacity;
        varying float vOpacity;
        void main() {
          vOpacity = opacity;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = 2.0;
        }
      `,
        fragmentShader: `
        uniform vec3 color;
        varying float vOpacity;
        void main() {
          gl_FragColor = vec4(color, vOpacity * 0.8);
        }
      `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });
    meteorTrail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(meteorTrail);
});
// Red Meteor with proper texture and visibility
let redMeteor, redMeteorLight, redMeteorTrail;
const redMeteorStart = new THREE.Vector3(250, 50, -30);  // Start position more visible
const redMeteorEnd = new THREE.Vector3(-500, 60, 100);    // End position
let redMeteorT = 0;
const redMeteorSpeed = 0.0006; // Same speed as silver meteor

// Use a proper texture URL for fiery/rocky meteor
loader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/lava/lavatile.jpg', (texture) => {
    const geom = new THREE.IcosahedronGeometry(1.4, 8); // Slightly larger for visibility
    const positions = geom.attributes.position;
    
    // Add roughness to geometry
    for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        const direction = vertex.clone().normalize();
        const randomOffset = (Math.random() - 0.5) * 0.6; // More roughness
        vertex.addScaledVector(direction, randomOffset);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        map: texture,
        color: 0xCC2200,        // Deep red color
        roughness: 0.8,         // Rough surface
        metalness: 0.3,         // Less metallic, more rocky
        emissive: 0xFF4400,     // Fiery orange-red glow
        emissiveIntensity: 0.8  // Strong glow for Turkish red effect
    });

    redMeteor = new THREE.Mesh(geom, mat);
    redMeteor.name = 'RedMeteor';
    redMeteor.position.copy(redMeteorStart);
    scene.add(redMeteor);

    // Brighter red light with Turkish red tones
    redMeteorLight = new THREE.PointLight(0xFF2200, 3, 30); // Brighter and wider range
    redMeteorLight.position.copy(redMeteor.position);
    scene.add(redMeteorLight);

    // Enhanced trail for red meteor
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(120 * 2); // More trail points
    const trailOpacities = new Float32Array(120);
    
    for (let i = 0; i < 120; i++) {
        trailPositions[i * 3] = redMeteorStart.x;
        trailPositions[i * 3 + 1] = redMeteorStart.y;
        trailPositions[i * 3 + 2] = redMeteorStart.z;
        trailOpacities[i] = 1 - (i / 120);
    }
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('opacity', new THREE.BufferAttribute(trailOpacities, 1));

    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: { 
            color: { value: new THREE.Color(0xFF3300) } // Bright Turkish red
        },
        vertexShader: `
            attribute float opacity;
            varying float vOpacity;
            void main() {
                vOpacity = opacity;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 3.0; // Larger trail points
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vOpacity;
            void main() {
                gl_FragColor = vec4(color, vOpacity * 0.9); // More visible trail
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    redMeteorTrail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(redMeteorTrail);
    
}, undefined, (error) => {
    // Fallback creation if texture fails to load
    console.log('Red meteor texture failed, creating fallback');
    
    const geom = new THREE.IcosahedronGeometry(2.5, 4);
    const positions = geom.attributes.position;
    
    for (let i = 0; i < positions.count; i++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, i);
        const direction = vertex.clone().normalize();
        const randomOffset = (Math.random() - 0.5) * 0.4;
        vertex.addScaledVector(direction, randomOffset);
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    geom.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: 0xCC2200,        // Deep red without texture
        roughness: 0.7,
        metalness: 0.3,
        emissive: 0xFF4400,     // Strong fiery glow
        emissiveIntensity: 1.0  // Maximum glow for visibility
    });

    redMeteor = new THREE.Mesh(geom, mat);
    redMeteor.name = 'RedMeteor';
    redMeteor.position.copy(redMeteorStart);
    scene.add(redMeteor);

    redMeteorLight = new THREE.PointLight(0xFF2200, 3, 30);
    redMeteorLight.position.copy(redMeteor.position);
    scene.add(redMeteorLight);

    // Same trail creation as above
    const trailGeometry = new THREE.BufferGeometry();
    const trailPositions = new Float32Array(120 * 3);
    const trailOpacities = new Float32Array(120);
    
    for (let i = 0; i < 120; i++) {
        trailPositions[i * 3] = redMeteorStart.x;
        trailPositions[i * 3 + 1] = redMeteorStart.y;
        trailPositions[i * 3 + 2] = redMeteorStart.z;
        trailOpacities[i] = 1 - (i / 120);
    }
    
    trailGeometry.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
    trailGeometry.setAttribute('opacity', new THREE.BufferAttribute(trailOpacities, 1));

    const trailMaterial = new THREE.ShaderMaterial({
        uniforms: { 
            color: { value: new THREE.Color(0xFF3300) }
        },
        vertexShader: `
            attribute float opacity;
            varying float vOpacity;
            void main() {
                vOpacity = opacity;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 3.0;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vOpacity;
            void main() {
                gl_FragColor = vec4(color, vOpacity * 0.9);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    redMeteorTrail = new THREE.Points(trailGeometry, trailMaterial);
    scene.add(redMeteorTrail);
});
// Kuiper Belt (Huge Asteroid Belt after Saturn)
const kuiperAsteroids = [];
const kuiperAsteroidCount = 10000;
const kuiperAsteroidBeltInnerRadius = 750;
const kuiperAsteroidBeltOuterRadius = 850;
const kuiperAsteroidBeltHeight = 12;

const kuiperAsteroidMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0x8A2BE2) }, // Purple glow
    },
    vertexShader: `
        uniform float time;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 baseColor = vec3(0.1, 0.1, 0.1); // Dark gray to black
            float purpleMix = 0.4 + 0.3 * sin(time + vPosition.x * 0.2);
            vec3 color = mix(baseColor, glowColor, purpleMix * glow);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.DoubleSide,
});

const kuiperAsteroidBeltGroup = new THREE.Group();
kuiperAsteroidBeltGroup.userData.clickable = true;
kuiperAsteroidBeltGroup.name = 'kuiperBelt';

for (let i = 0; i < kuiperAsteroidCount; i++) {
    const radius = kuiperAsteroidBeltInnerRadius + Math.random() * (kuiperAsteroidBeltOuterRadius - kuiperAsteroidBeltInnerRadius);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * kuiperAsteroidBeltHeight;
    const size = 0.5 + Math.random() * 1.5; // Larger asteroids
    
    // Irregular shape using Icosahedron with vertex displacement
    const asteroidGeom = new THREE.IcosahedronGeometry(size, 1);
    const positions = asteroidGeom.attributes.position;
    for (let j = 0; j < positions.count; j++) {
        const vertex = new THREE.Vector3().fromBufferAttribute(positions, j);
        const offset = vertex.clone().normalize().multiplyScalar((Math.random() - 0.5) * 0.3);
        vertex.add(offset);
        positions.setXYZ(j, vertex.x, vertex.y, vertex.z);
    }
    asteroidGeom.computeVertexNormals();
    
    const asteroid = new THREE.Mesh(asteroidGeom, kuiperAsteroidMaterial);
    asteroid.position.set(radius * Math.cos(theta), y, radius * Math.sin(theta));
    asteroid.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    
    // Orbital parameters
    const eccentricity = 0.05 + Math.random() * 0.1;
    const semiMajor = radius;
    const semiMinor = semiMajor * Math.sqrt(1 - eccentricity * eccentricity);
    asteroid.userData = {
        theta: theta,
        semiMajor: semiMajor,
        semiMinor: semiMinor,
        eccentricity: eccentricity,
        speed: 0.0002 + Math.random() * 0.0003,
        rotationSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02,
            (Math.random() - 0.5) * 0.02
        ),
    };
    
    kuiperAsteroidBeltGroup.add(asteroid);
    kuiperAsteroids.push(asteroid);
}
scene.add(kuiperAsteroidBeltGroup);

// Main Asteroid Belt (between Mars and Jupiter)
const mainAsteroidCount = 1000;
const mainAsteroidBeltInnerRadius = 280; 
const mainAsteroidBeltOuterRadius = 340;
const mainAsteroidBeltHeight = 20;
const mainAsteroidSize = 1.5;

// Base geometry (low detail for performance)
const mainAsteroidGeom = new THREE.IcosahedronGeometry(mainAsteroidSize, 0);

// Custom shader material with vertex displacement and random glow color
const mainAsteroidMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { value: 0 },
        ironGlowColor: { value: new THREE.Color(0xB22222) }, // Reddish (Iron-rich)
        carbonGlowColor: { value: new THREE.Color(0x1E90FF) }, // Bluish (Carbon-rich)
    },
    vertexShader: `
        uniform float time;
        attribute float instanceSeed;
        attribute float glowType;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vGlowType;
        void main() {
            vec3 pos = position;
            float seed = instanceSeed + float(gl_VertexID);
            pos.x += sin(seed * 123.456) * 0.3;
            pos.y += cos(seed * 789.012) * 0.3;
            pos.z += sin(seed * 345.678) * 0.3;
            vNormal = normalize(normalMatrix * normal);
            vPosition = pos;
            vGlowType = glowType;
            gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
        }
    `,
    fragmentShader: `
        uniform float time;
        uniform vec3 ironGlowColor;
        uniform vec3 carbonGlowColor;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vGlowType;
        void main() {
            float glow = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            vec3 baseColor = vec3(0.545, 0.271, 0.075); // Brown base
            float dustyMix = 0.3 + 0.2 * sin(time + vPosition.x * 0.2);
            vec3 glowColor = mix(ironGlowColor, carbonGlowColor, vGlowType);
            vec3 color = mix(baseColor, glowColor, dustyMix * glow);
            gl_FragColor = vec4(color, 1.0);
        }
    `,
    side: THREE.DoubleSide,
});

// Create InstancedMesh for efficient rendering
const mainAsteroidMesh = new THREE.InstancedMesh(mainAsteroidGeom, mainAsteroidMaterial, mainAsteroidCount);
mainAsteroidMesh.userData.clickable = true;
mainAsteroidMesh.name = 'mainAsteroidBelt';

// Set up per-instance seeds and glow types for unique displacements and color
const seeds = new Float32Array(mainAsteroidCount);
const glowTypes = new Float32Array(mainAsteroidCount);
for (let i = 0; i < mainAsteroidCount; i++) {
    seeds[i] = Math.random();
    glowTypes[i] = Math.round(Math.random()); // 0 = red (iron), 1 = blue (carbon)
}
mainAsteroidMesh.geometry.setAttribute('instanceSeed', new THREE.InstancedBufferAttribute(seeds, 1));
mainAsteroidMesh.geometry.setAttribute('glowType', new THREE.InstancedBufferAttribute(glowTypes, 1));

// Set positions and static rotations for each instance
const dummy = new THREE.Object3D();
for (let i = 0; i < mainAsteroidCount; i++) {
    const radius = mainAsteroidBeltInnerRadius + Math.random() * (mainAsteroidBeltOuterRadius - mainAsteroidBeltInnerRadius);
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * mainAsteroidBeltHeight;
    dummy.position.set(radius * Math.cos(theta), y, radius * Math.sin(theta));
    dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
    dummy.updateMatrix();
    mainAsteroidMesh.setMatrixAt(i, dummy.matrix);
}
mainAsteroidMesh.instanceMatrix.needsUpdate = true;

// Add to a group for rotation
const mainAsteroidBeltGroup = new THREE.Group();
mainAsteroidBeltGroup.add(mainAsteroidMesh);
scene.add(mainAsteroidBeltGroup); 


    // Orbital Parameters
    const mercuryOrbitSemiMajor = 50;
    const mercuryOrbitEccentricity = 0.2056;
    const mercuryOrbitSemiMinor = mercuryOrbitSemiMajor * Math.sqrt(1 - mercuryOrbitEccentricity * mercuryOrbitEccentricity);
    const mercuryOrbitSpeed = 0.00028

    const venusOrbitSemiMajor = 90;
    const venusOrbitEccentricity = 0.0059;
    const venusOrbitSemiMinor = venusOrbitSemiMajor * Math.sqrt(1 - venusOrbitEccentricity * venusOrbitEccentricity);
    const venusOrbitSpeed = 0.00026;

    const earthOrbitSemiMajor = 160;
    const earthOrbitEccentricity = 0.0167;
    const earthOrbitSemiMinor = earthOrbitSemiMajor * Math.sqrt(1 - earthOrbitEccentricity * earthOrbitEccentricity);
    const earthOrbitSpeed = 0.00021;

    const moonOrbitSemiMajor = 15;
    const moonOrbitEccentricity = 0.0549;
    const moonOrbitSemiMinor = moonOrbitSemiMajor * Math.sqrt(1 - moonOrbitEccentricity * moonOrbitEccentricity);
    const moonOrbitSpeed = 0.0002;
    const marsOrbitSemiMajor = 220;
    const marsOrbitEccentricity = 0.0934;
    const marsOrbitSemiMinor = marsOrbitSemiMajor * Math.sqrt(1 - marsOrbitEccentricity * marsOrbitEccentricity);
    const marsOrbitSpeed = 0.00016;

    const phobosOrbitSemiMajor = 10.0;
    const phobosOrbitEccentricity = 0.0151;
    const phobosOrbitSemiMinor = phobosOrbitSemiMajor * Math.sqrt(1 - phobosOrbitEccentricity * phobosOrbitEccentricity);
    const phobosOrbitSpeed = 0.0003;

    const deimosOrbitSemiMajor = 15.0;
    const deimosOrbitEccentricity = 0.0002;
    const deimosOrbitSemiMinor = deimosOrbitSemiMajor * Math.sqrt(1 - deimosOrbitEccentricity * deimosOrbitEccentricity);
    const deimosOrbitSpeed = 0.001;

    const jupiterOrbitSemiMajor = 380;
    const jupiterOrbitEccentricity = 0.0489;
    const jupiterOrbitSemiMinor = jupiterOrbitSemiMajor * Math.sqrt(1 - jupiterOrbitEccentricity * jupiterOrbitEccentricity);
    const jupiterOrbitSpeed = 0.00013;

    const saturnOrbitSemiMajor = 480;
    const saturnOrbitEccentricity = 0.0557;
    const saturnOrbitSemiMinor = saturnOrbitSemiMajor * Math.sqrt(1 - saturnOrbitEccentricity * saturnOrbitEccentricity);
    const saturnOrbitSpeed = 0.00011;

    const titanOrbitSemiMajor = 20;
    const titanOrbitEccentricity = 0.0288;
    const titanOrbitSemiMinor = titanOrbitSemiMajor * Math.sqrt(1 - titanOrbitEccentricity * titanOrbitEccentricity);
    const titanOrbitSpeed = 0.0005;
    
const neptuneOrbitSemiMajor = 680;
const neptuneOrbitEccentricity = 0.009;
const neptuneOrbitSemiMinor = neptuneOrbitSemiMajor * Math.sqrt(1 - Math.pow(neptuneOrbitEccentricity, 2));
const neptuneOrbitSpeed = 0.00006; 
const neptuneRotationSpeed = 0.00008  ; 


const uranusOrbitSemiMajor = 580 
const uranusOrbitEccentricity = 0.046; 
const uranusOrbitSemiMinor = uranusOrbitSemiMajor * Math.sqrt(1 - Math.pow(uranusOrbitEccentricity, 2));
const uranusOrbitSpeed = 0.00009;
const uranusRotationSpeed = -0.015; 

// Animation Loop
function animate(time = 0) {
    requestAnimationFrame(animate);
    try {
        controls.update();
        if (isLoading) return;

        // Apply dat.GUI controls
        if (!window.isPaused) {
            // Adjust time for speed and direction
            const adjustedTime = time * window.speedMultiplier * (window.reverse ? -1 : 1);

            // Update Positions
            if (mercury) {
                mercury.rotation.y += 0.003 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const mercuryAngle = adjustedTime * mercuryOrbitSpeed;
                const mercuryX = mercuryOrbitSemiMajor * Math.cos(mercuryAngle) - mercuryOrbitSemiMajor * mercuryOrbitEccentricity;
                const mercuryZ = mercuryOrbitSemiMinor * Math.sin(mercuryAngle);
                mercury.position.set(mercuryX, 0, mercuryZ);
                if (mercuryLight) mercuryLight.position.copy(mercury.position);
            }

            if (venus) {
                venus.rotation.y += -0.003 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const venusAngle = adjustedTime * venusOrbitSpeed;
                const venusX = venusOrbitSemiMajor * Math.cos(venusAngle) - venusOrbitSemiMajor * venusOrbitEccentricity;
                const venusZ = venusOrbitSemiMinor * Math.sin(venusAngle);
                venus.position.set(venusX, 0, venusZ);
                if (venusLight) venusLight.position.copy(venus.position);
            }

            if (earth) {
                earth.rotation.y += 0.015 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const earthAngle = adjustedTime * earthOrbitSpeed;
                const earthX = earthOrbitSemiMajor * Math.cos(earthAngle) - earthOrbitSemiMajor * earthOrbitEccentricity;
                const earthZ = earthOrbitSemiMinor * Math.sin(earthAngle);
                earth.position.set(earthX, 0, earthZ);
            }

            if (moon && earth) {
                moon.rotation.y += 0.003 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const moonAngle = adjustedTime * moonOrbitSpeed;
                const moonX = earth.position.x + moonOrbitSemiMajor * Math.cos(moonAngle) - moonOrbitSemiMajor * moonOrbitEccentricity;
                const moonZ = earth.position.z + moonOrbitSemiMinor * Math.sin(moonAngle);
                moon.position.set(moonX, earth.position.y, moonZ);
                if (moonLight) {
                    moonLight.position.copy(moon.position);
                    moonLight.intensity = moon.position.z < earth.position.z ? 1 : 0.8;
                }
            }

            if (mars) {
                mars.rotation.y += 0.04 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const marsAngle = adjustedTime * marsOrbitSpeed;
                const marsX = marsOrbitSemiMajor * Math.cos(marsAngle) - marsOrbitSemiMajor * marsOrbitEccentricity;
                const marsZ = marsOrbitSemiMinor * Math.sin(marsAngle);
                mars.position.set(marsX, 0, marsZ);
                if (marsLight) marsLight.position.copy(mars.position);
            }

            if (phobos && mars) {
                phobos.rotation.y += 0.002 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const phobosAngle = adjustedTime * phobosOrbitSpeed;
                const phobosX = mars.position.x + phobosOrbitSemiMajor * Math.cos(phobosAngle) - phobosOrbitSemiMajor * phobosOrbitEccentricity;
                const phobosZ = mars.position.z + phobosOrbitSemiMinor * Math.sin(phobosAngle);
                phobos.position.set(phobosX, mars.position.y, phobosZ);
            }

            if (deimos && mars) {
                deimos.rotation.y -= 0.0015 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const deimosAngle = adjustedTime * deimosOrbitSpeed;
                const deimosX = mars.position.x + deimosOrbitSemiMajor * Math.cos(deimosAngle) - deimosOrbitSemiMajor * deimosOrbitEccentricity;
                const deimosZ = mars.position.z + deimosOrbitSemiMinor * Math.sin(deimosAngle);
                deimos.position.set(deimosX, mars.position.y + 0.5 * Math.sin(deimosAngle), deimosZ);
            }

            if (jupiter) {
                jupiter.rotation.y += 0.02 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const jupiterAngle = adjustedTime * jupiterOrbitSpeed;
                const jupiterX = jupiterOrbitSemiMajor * Math.cos(jupiterAngle) - jupiterOrbitSemiMajor * jupiterOrbitEccentricity;
                const jupiterZ = jupiterOrbitSemiMinor * Math.sin(jupiterAngle);
                jupiter.position.set(jupiterX, 0, jupiterZ);
                if (jupiterLight) jupiterLight.position.copy(jupiter.position);
            }

            if (saturn) {
                saturn.rotation.y += 0.017 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const saturnAngle = adjustedTime * saturnOrbitSpeed;
                const saturnX = saturnOrbitSemiMajor * Math.cos(saturnAngle) - saturnOrbitSemiMajor * saturnOrbitEccentricity;
                const saturnZ = saturnOrbitSemiMinor * Math.sin(saturnAngle);
                saturn.position.set(saturnX, 0, saturnZ);
                if (saturnLight) saturnLight.position.copy(saturn.position);
            }

            if (titan && saturn) {
                titan.rotation.y += 0.0015 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const titanAngle = adjustedTime * titanOrbitSpeed;
                const titanX = saturn.position.x + titanOrbitSemiMajor * Math.cos(titanAngle) - titanOrbitSemiMajor * titanOrbitEccentricity;
                const titanZ = saturn.position.z + titanOrbitSemiMinor * Math.sin(titanAngle);
                titan.position.set(titanX, saturn.position.y, titanZ);
            }

            if (neptune) {
                neptune.rotation.y += 0.013 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const neptuneAngle = adjustedTime * neptuneOrbitSpeed;
                const neptuneX = neptuneOrbitSemiMajor * Math.cos(neptuneAngle) - neptuneOrbitSemiMajor * neptuneOrbitEccentricity;
                const neptuneZ = neptuneOrbitSemiMinor * Math.sin(neptuneAngle);
                neptune.position.set(neptuneX, 0, neptuneZ);
                if (neptuneLight) neptuneLight.position.copy(neptune.position);
            }

            if (uranus) {
                uranus.rotation.y += -0.015 * window.speedMultiplier * (window.reverse ? -1 : 1);
                const uranusAngle = adjustedTime * uranusOrbitSpeed;
                const uranusX = uranusOrbitSemiMajor * Math.cos(uranusAngle) - uranusOrbitSemiMajor * uranusOrbitEccentricity;
                const uranusZ = uranusOrbitSemiMinor * Math.sin(uranusAngle);
                uranus.position.set(uranusX, 0, uranusZ);
                if (uranusLight) uranusLight.position.copy(uranus.position);
            }

            // Update Comets
            comets.forEach(({ comet, tail, orbit }) => {
                comet.userData.theta += comet.userData.speed * window.speedMultiplier * (window.reverse ? -1 : 1);
                const theta = comet.userData.theta;
                const x = comet.userData.semiMajor * Math.cos(theta) - comet.userData.semiMajor * comet.userData.eccentricity;
                const z = comet.userData.semiMinor * Math.sin(theta);
                comet.position.set(x, comet.position.y, z);
                const prevTheta = theta - comet.userData.speed * window.speedMultiplier * (window.reverse ? -1 : 1);
                const prevX = comet.userData.semiMajor * Math.cos(prevTheta) - comet.userData.semiMajor * comet.userData.eccentricity;
                const prevZ = comet.userData.semiMinor * Math.sin(prevTheta);
                const velocity = new THREE.Vector3(x - prevX, 0, z - prevZ).normalize();
                const sunDirection = new THREE.Vector3().sub(comet.position).normalize();
                tail.lookAt(comet.position.clone().add(sunDirection));
            });

            // Update Meteor
            if (meteor) {
                meteorT += meteorSpeed * window.speedMultiplier * (window.reverse ? -1 : 1);
                if (meteorT > 1) meteorT = 0; // Reset for continuous one-way movement
                if (meteorT < 0) meteorT = 1; // Handle reverse case
                meteor.position.lerpVectors(meteorStart, meteorEnd, meteorT);
                meteor.rotation.x += 0.015 * window.speedMultiplier * (window.reverse ? -1 : 1);
                meteor.rotation.y += 0.015 * window.speedMultiplier * (window.reverse ? -1 : 1);
                meteor.rotation.z += 0.015 * window.speedMultiplier * (window.reverse ? -1 : 1);
                if (meteorLight) meteorLight.position.copy(meteor.position);
                if (meteorTrail) {
                    const trailPositions = meteorTrail.geometry.attributes.position.array;
                    const trailOpacities = meteorTrail.geometry.attributes.opacity.array;
                    for (let i = 99; i > 0; i--) {
                        trailPositions[i * 3] = trailPositions[(i - 1) * 3];
                        trailPositions[i * 3 + 1] = trailPositions[(i - 1) * 3 + 1];
                        trailPositions[i * 3 + 2] = trailPositions[(i - 1) * 3 + 2];
                        trailOpacities[i] = trailOpacities[i - 1] * 0.95;
                    }
                    trailPositions[0] = meteor.position.x;
                    trailPositions[1] = meteor.position.y;
                    trailPositions[2] = meteor.position.z;
                    trailOpacities[0] = 1;
                    meteorTrail.geometry.attributes.position.needsUpdate = true;
                    meteorTrail.geometry.attributes.opacity.needsUpdate = true;
                }
            }

            // Update Red Meteor
            if (redMeteor) {
                redMeteorT += redMeteorSpeed * window.speedMultiplier * (window.reverse ? -1 : 1);
                if (redMeteorT > 1) redMeteorT = 0;
                if (redMeteorT < 0) redMeteorT = 1;
                redMeteor.position.lerpVectors(redMeteorStart, redMeteorEnd, redMeteorT);
                redMeteor.rotation.x += 0.018 * window.speedMultiplier * (window.reverse ? -1 : 1);
                redMeteor.rotation.y += 0.018 * window.speedMultiplier * (window.reverse ? -1 : 1);
                redMeteor.rotation.z += 0.018 * window.speedMultiplier * (window.reverse ? -1 : 1);
                if (redMeteorLight) redMeteorLight.position.copy(redMeteor.position);
                if (redMeteorTrail) {
                    const trailPositions = redMeteorTrail.geometry.attributes.position.array;
                    const trailOpacities = redMeteorTrail.geometry.attributes.opacity.array;
                    for (let i = 119; i > 0; i--) {
                        trailPositions[i * 3] = trailPositions[(i - 1) * 3];
                        trailPositions[i * 3 + 1] = trailPositions[(i - 1) * 3 + 1];
                        trailPositions[i * 3 + 2] = trailPositions[(i - 1) * 3 + 2];
                        trailOpacities[i] = trailOpacities[i - 1] * 0.97;
                    }
                    trailPositions[0] = redMeteor.position.x;
                    trailPositions[1] = redMeteor.position.y;
                    trailPositions[2] = redMeteor.position.z;
                    trailOpacities[0] = 1;
                    redMeteorTrail.geometry.attributes.position.needsUpdate = true;
                    redMeteorTrail.geometry.attributes.opacity.needsUpdate = true;
                }
            }

            // Update Sun
            if (sun) {
                sun.rotation.y += 0.00001 * window.speedMultiplier * (window.reverse ? -1 : 1);
                sunAtmosphere.rotation.copy(sun.rotation);
            }

            // Update Stars
            starShaderMaterial.uniforms.time.value = adjustedTime * 0.002;

            // Update Milky Way
            updateMilkyWay(adjustedTime);

            // Update Asteroid Materials
         kuiperAsteroidMaterial.uniforms.time.value += 0.05 * window.speedMultiplier * (window.reverse ? -1 : 1);
            mainAsteroidMaterial.uniforms.time.value += 0.05 * window.speedMultiplier * (window.reverse ? -1 : 3);

            // Update Main Asteroid Belt
            mainAsteroidBeltGroup.rotation.y += 0.0005 * window.speedMultiplier * (window.reverse ? -1 : 3);

            // Update Kuiper Belt
            for (let i = 0; i < kuiperAsteroidCount; i++) {
                const asteroid = kuiperAsteroids[i];
                const data = asteroid.userData;
                data.theta += data.speed * window.speedMultiplier * (window.reverse ? -1 : 3);
                const x = data.semiMajor * Math.cos(data.theta);
                const z = data.semiMinor * Math.sin(data.theta);
                asteroid.position.set(x, asteroid.position.y, z);
                asteroid.rotation.x += data.rotationSpeed.x * window.speedMultiplier * (window.reverse ? -1 : 1);
                asteroid.rotation.y += data.rotationSpeed.y * window.speedMultiplier * (window.reverse ? -1 : 1);
                asteroid.rotation.z += data.rotationSpeed.z * window.speedMultiplier * (window.reverse ? -1 : 1);
            }
        }

// Inside your render loop (replace the existing camera tracking block)
if (!isInteracting) {
    let planetPos;
    if (activeView === 'moon' && moon) {
        planetPos = moon.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'earth' && earth) {
        planetPos = earth.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'mars' && mars) {
        planetPos = mars.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'jupiter' && jupiter) {
        planetPos = jupiter.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'mercury' && mercury) {
        planetPos = mercury.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'venus' && venus) {
        planetPos = venus.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'saturn' && saturn) {
        planetPos = saturn.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'neptune' && neptune) {
        planetPos = neptune.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'uranus' && uranus) {
        planetPos = uranus.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    } else if (activeView === 'sun' && sun) {
        planetPos = sun.position.clone();
        camera.position.copy(planetPos).add(cameraOffset);
        controls.target.copy(planetPos);
        lastTargetPosition.copy(planetPos);
    }
    
    // Apply space drift effect when not interacting and a planet is active
    if (activeView && activeView !== 'milkyWay') {
        const time = Date.now() * 0.001; // Time-based oscillation
        camera.position.x += Math.sin(time) * 0.01;
        camera.position.y += Math.cos(time) * 0.01;
        // Optional: Add z-axis drift for 3D effect
        // camera.position.z += Math.sin(time + 1) * 0.01;
        controls.update(); // Sync OrbitControls with new camera position
    }
} else {
    // Existing interaction logic
    if (activeView === 'moon' && moon) {
        controls.target.copy(moon.position);
        lastTargetPosition.copy(moon.position);
    } else if (activeView === 'earth' && earth) {
        controls.target.copy(earth.position);
        lastTargetPosition.copy(earth.position);
    } else if (activeView === 'mars' && mars) {
        controls.target.copy(mars.position);
        lastTargetPosition.copy(mars.position);
    } else if (activeView === 'jupiter' && jupiter) {
        controls.target.copy(jupiter.position);
        lastTargetPosition.copy(jupiter.position);
    } else if (activeView === 'mercury' && mercury) {
        controls.target.copy(mercury.position);
        lastTargetPosition.copy(mercury.position);
    } else if (activeView === 'venus' && venus) {
        controls.target.copy(venus.position);
        lastTargetPosition.copy(venus.position);
    } else if (activeView === 'saturn' && saturn) {
        controls.target.copy(saturn.position);
        lastTargetPosition.copy(saturn.position);
    } else if (activeView === 'neptune' && neptune) {
        controls.target.copy(neptune.position);
        lastTargetPosition.copy(neptune.position);
    } else if (activeView === 'uranus' && uranus) {
        controls.target.copy(uranus.position);
        lastTargetPosition.copy(uranus.position);
    } else if (activeView === 'sun' && sun) {
        controls.target.copy(sun.position);
        lastTargetPosition.copy(sun.position);
    }
}

        // Update Labels
        scene.traverse(obj => {
            if (obj.userData.isLabel) {
                obj.lookAt(camera.position);
            }
        });

        // Render
        renderer.render(scene, camera);
    } catch (error) {
        console.error('Animation error:', error);
    }
}

// Updated Milky Way animation function
function updateMilkyWay(time) {
    milkyWayGroup.rotation.y += 0.00015 * window.speedMultiplier * (window.reverse ? -1 : 1);
    const cameraPos = camera.position.clone();
    milkyWayStarsMaterial.uniforms.cameraPos.value = cameraPos;
    bulgeMaterial.uniforms.cameraPos.value = cameraPos;
    backgroundStarsMaterial.uniforms.cameraPos.value = cameraPos;
    outerStarsMaterial.uniforms.cameraPos.value = cameraPos;
    outerBackgroundStarsMaterial.uniforms.cameraPos.value = cameraPos;
    haloMaterial.uniforms.cameraPos.value = cameraPos;
    milkyWayStarsMaterial.uniforms.time.value = time * 0.001;
    bulgeMaterial.uniforms.time.value = time * 0.001;
    gasMaterial.uniforms.time.value = time * 0.001;
    outerStarsMaterial.uniforms.time.value = time * 0.001;
    outerGasMaterial.uniforms.time.value = time * 0.001;
    nebulaMaterial.uniforms.time.value = time * 0.001;
    outerNebulaMaterial.uniforms.time.value = time * 0.001;
    coreGasMaterial.uniforms.time.value = time * 0.001;
    backgroundStarsMaterial.uniforms.time.value = time * 0.001;
    outerBackgroundStarsMaterial.uniforms.time.value = time * 0.001;
    haloMaterial.uniforms.time.value = time * 0.001;
}

// Render and start animation
renderer.render(scene, camera);
animate();

    // Resize Handler
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      loadingRenderer.setSize(window.innerWidth, window.innerHeight);
      loadingCamera.aspect = window.innerWidth / window.innerHeight;
      loadingCamera.updateProjectionMatrix();
    });

    // Error Handling for Renderer
    renderer.domElement.addEventListener('webglcontextlost', (event) => {
      console.error('WebGL context lost:', event);
      alert('WebGL context lost. Please refresh the page.');
    });

    renderer.domElement.addEventListener('webglcontextrestored', () => {
      console.log('WebGL context restored');
      animate();
    });