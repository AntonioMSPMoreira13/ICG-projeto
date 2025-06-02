import * as THREE from 'three';

// Função para construir o rocket igual ao do Asteroids
function createRocket(textureLoader) {
    const group = new THREE.Group();

    const metalTexture = textureLoader.load('texture/Rocket.webp');
    const metalWhite = new THREE.MeshStandardMaterial({ map: metalTexture, metalness: 1, roughness: 0.3 });
    const metalRed = new THREE.MeshStandardMaterial({ color: 0xff0000, metalness: 0.7, roughness: 0.3 });
    const metalBlue = new THREE.MeshStandardMaterial({ color: 0x3399ff, emissive: 0x112244, metalness: 0.3, roughness: 0.2 });
    const metalBlack = new THREE.MeshStandardMaterial({ color: 0x000000, metalness: 0.9, roughness: 0.1 });
    const flameMat = new THREE.MeshStandardMaterial({ color: 0xffa500, emissive: 0xff6600, metalness: 0.2, roughness: 0.1 });

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.7, 0.7, 2.5, 16).toNonIndexed();
    group.add(new THREE.Mesh(bodyGeo, metalWhite));

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.7, 1, 24).toNonIndexed();
    noseGeo.translate(0, 1.75, 0);
    group.add(new THREE.Mesh(noseGeo, metalRed));

    // Windows
    const windowGeo1 = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16).toNonIndexed();
    windowGeo1.translate(-0.5, 0.7, 0);
    windowGeo1.rotateX(Math.PI);
    windowGeo1.rotateZ(-Math.PI / 2);
    group.add(new THREE.Mesh(windowGeo1, metalBlue));

    const windowGeo2 = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16).toNonIndexed();
    windowGeo2.translate(0, -0.7, 0);
    windowGeo2.rotateX(Math.PI);
    windowGeo2.rotateZ(-Math.PI / 2);
    group.add(new THREE.Mesh(windowGeo2, metalBlue));

    // Fins
    const finShape = new THREE.BoxGeometry(0.4, 0.7, 0.1);
    finShape.rotateZ(Math.PI / 4);

    const fin1 = new THREE.Mesh(finShape, metalRed);
    fin1.position.set(0.7, -1.25, -0.1);
    group.add(fin1);

    const fin2 = new THREE.Mesh(finShape.clone(), metalRed);
    fin2.rotation.y = Math.PI;
    fin2.position.set(-0.7, -1.25, 0);
    group.add(fin2);

    const fin3 = new THREE.Mesh(finShape.clone(), metalRed);
    fin3.rotation.y = Math.PI / 2;
    fin3.rotation.z = Math.PI / 2;
    fin3.position.set(0, -1.25, 0.7);
    group.add(fin3);

    const fin4 = new THREE.Mesh(finShape.clone(), metalRed);
    fin4.rotation.y = -Math.PI / 2;
    fin4.rotation.z = Math.PI / 2;
    fin4.position.set(0, -1.25, -0.7);
    group.add(fin4);

    // Thruster
    const thrusterGeo = new THREE.ConeGeometry(0.4, 1, 16).toNonIndexed();
    thrusterGeo.translate(0, -1.1, 0);
    group.add(new THREE.Mesh(thrusterGeo, metalBlack));

    const flameGeo = new THREE.ConeGeometry(0.25, 0.5, 16).toNonIndexed();
    flameGeo.rotateX(Math.PI);
    flameGeo.translate(0, -1.7, 0);
    group.add(new THREE.Mesh(flameGeo, flameMat));

    group.rotation.y = Math.PI;
    group.rotation.x = Math.PI / 2; // Rocket "em pé" para o espaço
    group.position.set(0, 0, 0);
    group.scale.set(1, 1, 1); // NÃO aumenta escala do foguete
    return group;
}

let gameActive = false;
let gamePaused = false;
let missions = [];
let completedMissions = [];

export function startExplorationGame() {
    gameActive = true;
    gamePaused = false;

    // Setup Three.js Scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 500000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.innerHTML = '';
    document.body.appendChild(renderer.domElement);

    // Background stars (10x maior)
    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load('texture/fundo.jpg', () => {
        const backgroundGeometry = new THREE.SphereGeometry(250000, 64, 32);
        const backgroundMaterial = new THREE.MeshStandardMaterial({
            map: starTexture,
            side: THREE.BackSide
        });
        const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        scene.add(backgroundSphere);
    });

    // Carregar texturas planetárias
    const textures = {
        sun: textureLoader.load('texture/Solar_sys/Sun.jpg'),
        mercury: textureLoader.load('texture/Solar_sys/Mercury.jpg'),
        venus: textureLoader.load('texture/Solar_sys/Venus.jpg'),
        earth: textureLoader.load('texture/Solar_sys/Earth.jpg'),
        mars: textureLoader.load('texture/Solar_sys/Mars.jpg'),
        jupiter: textureLoader.load('texture/Solar_sys/Jupiter.jpg'),
        saturn: textureLoader.load('texture/Solar_sys/Saturn.jpg'),
        uranus: textureLoader.load('texture/Solar_sys/Uranus.jpg'),
        neptune: textureLoader.load('texture/Solar_sys/Neptune.jpg'),
        saturnRing: textureLoader.load('texture/Solar_sys/SaturnRing.png')
    };

    // Sun (centro, 10x)
    const sunGeometry = new THREE.SphereGeometry(5000, 64, 64);
    const sunMaterial = new THREE.MeshStandardMaterial({
        map: textures.sun,
        emissive: 0xffff00,
        emissiveIntensity: 1,
        emissiveMap: textures.sun
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    scene.add(sun);

    // Luz ambiente
    scene.add(new THREE.AmbientLight(0xffffff, 0.2));
    const sunLight = new THREE.PointLight(0xffffcc, 10, 80000, 0.1/18);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const planetDefs = [
        { name: 'Mercury', texture: textures.mercury, distance: 15000, size: 180 },
        { name: 'Venus', texture: textures.venus, distance: 22000, size: 400 },
        { name: 'Earth', texture: textures.earth, distance: 30000, size: 420 },
        { name: 'Mars', texture: textures.mars, distance: 42000, size: 300 },
        { name: 'Jupiter', texture: textures.jupiter, distance: 80000, size: 1500 },
        { name: 'Saturn', texture: textures.saturn, distance: 120000, size: 1250 },
        { name: 'Uranus', texture: textures.uranus, distance: 160000, size: 900 },
        { name: 'Neptune', texture: textures.neptune, distance: 200000, size: 850 }
    ];

    const planets = [];

    planetDefs.forEach(def => {
        const geo = new THREE.SphereGeometry(def.size, 32, 32);
        const mat = new THREE.MeshStandardMaterial({ map: def.texture, metalness: 0.6, roughness: 0.3 });

        // Ângulo aleatório para órbita (theta), inclinação pequena (phi)
        const theta = Math.random() * 2 * Math.PI;
        const phi = (Math.random() - 0.5) * Math.PI / 7;

        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
            Math.cos(theta) * def.distance * Math.cos(phi),
            Math.sin(phi) * def.distance,
            Math.sin(theta) * def.distance * Math.cos(phi)
        );
        mesh.name = def.name;
        scene.add(mesh);

        // Saturno com anel
        if (def.name === 'Saturn') {
            const ringGeometry = new THREE.RingGeometry(def.size * 1.8, def.size * 3, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                map: textures.saturnRing,
                side: THREE.DoubleSide,
                transparent: true
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.position.copy(mesh.position);
            ring.rotation.x = -Math.PI / 2;
            scene.add(ring);
        }
        planets.push(mesh); // <- funciona agora!
    });

    // Rocket: igual ao do Asteroids, mas MAIOR
    const rocket = createRocket(textureLoader);
    rocket.position.set(0, 0, 800);
    rocket.scale.set(6, 6, 6); // Agora é bem visível na escala do jogo
    scene.add(rocket);

    // Camera inicial (atrás do foguete)
    camera.position.set(0, 120, 800 - 350);
    camera.lookAt(rocket.position);

    // Missões (igual antes)
    missions = [
        { id: 1, description: "Visite Mercúrio", target: "Mercury", completed: false },
        { id: 2, description: "Visite Vênus", target: "Venus", completed: false },
        { id: 3, description: "Visite a Terra", target: "Earth", completed: false },
        { id: 4, description: "Visite Marte", target: "Mars", completed: false },
        { id: 5, description: "Visite Júpiter", target: "Jupiter", completed: false },
        { id: 6, description: "Visite Saturno", target: "Saturn", completed: false },
        { id: 7, description: "Visite Urano", target: "Uranus", completed: false },
        { id: 8, description: "Visite Netuno", target: "Neptune", completed: false }
    ];

    // HUD
    const hud = document.createElement('div');
    hud.className = 'score-display';
    hud.style.right = 'unset';
    hud.style.left = '50%';
    hud.style.transform = 'translateX(-50%)';
    document.body.appendChild(hud);

    // --- CONTROLES NOVOS ---
    let velocity = 0;
    let movingForward = false;
    let movingBackward = false;
    let pitch = 0;
    let yaw = 0;

    const controls = {
        w: false, s: false, a: false, d: false, shift: false, ctrl: false
    };

    window.addEventListener('keydown', (e) => {
        if (e.key === 'w') controls.w = true;
        if (e.key === 's') controls.s = true;
        if (e.key === 'a') controls.a = true;
        if (e.key === 'd') controls.d = true;
        if (e.key === 'Shift') {
            controls.shift = !controls.shift;
            movingForward = !movingForward;
        }
        if (e.key === 'Control') {
            controls.ctrl = true;
            movingBackward = true;
        }
        if (e.key === 'Escape') pauseGame();
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'w') controls.w = false;
        if (e.key === 's') controls.s = false;
        if (e.key === 'a') controls.a = false;
        if (e.key === 'd') controls.d = false;
        if (e.key === 'Control') {
            controls.ctrl = false;
            movingBackward = false;
        }
    });

    function pauseGame() {
        if (!gamePaused) {
            gamePaused = true;
            const pauseMenu = document.createElement('div');
            pauseMenu.className = 'pause-menu';

            const resumeButton = document.createElement('button');
            resumeButton.className = 'menu-button';
            resumeButton.innerText = 'Resume';
            resumeButton.onclick = () => {
                gamePaused = false;
                pauseMenu.remove();
                animate();
            };
            pauseMenu.appendChild(resumeButton);

            const quitButton = document.createElement('button');
            quitButton.className = 'menu-button';
            quitButton.innerText = 'Quit';
            quitButton.onclick = () => {
                location.reload();
            };
            pauseMenu.appendChild(quitButton);

            document.body.appendChild(pauseMenu);

            function handleEscape(event) {
                if (event.key === 'Escape') {
                    gamePaused = false;
                    pauseMenu.remove();
                    animate();
                    window.removeEventListener('keydown', handleEscape);
                }
            }
            window.addEventListener('keydown', handleEscape);
        }
    }

    function animate() {
        if (!gameActive || gamePaused) return;
        requestAnimationFrame(animate);

        // Atualiza pitch/yaw
        let rotated = false;

        if (controls.w) {
            pitch = Math.max(pitch - 0.018, -Math.PI/2 + 0.15);
            rotated = true;
        }
        if (controls.s) {
            pitch = Math.min(pitch + 0.018, Math.PI/2 - 0.15);
            rotated = true;
        }
        if (controls.a) {
            yaw += 0.022;
            rotated = true;
        }
        if (controls.d) {
            yaw -= 0.022;
            rotated = true;
        }

        // Aplica a rotação só se alguma tecla de direção foi pressionada
        if (rotated) {
            rocket.rotation.set(pitch, yaw, 0);
        }

        // Calcula direção de movimento
        const forward = new THREE.Vector3(
            Math.sin(yaw) * Math.cos(pitch),
            Math.sin(pitch),
            Math.cos(yaw) * Math.cos(pitch)
        );

        // Atualiza velocidade
        if (movingForward && !movingBackward) {
            velocity = Math.min(velocity + 0.13, 70);
        } else if (!movingForward && movingBackward) {
            velocity = Math.max(velocity - 0.13, -40);
        } else {
            velocity *= 0.99;
        }

        // Atualiza posição
        rocket.position.addScaledVector(forward, velocity);

        // Faz a nave apontar SEMPRE para onde está indo
        // Lógica: cria um vetor lookAt do movimento (se parado, usa orientação anterior)
        if (velocity !== 0) {
            const lookAtTarget = rocket.position.clone().add(forward);
            rocket.lookAt(lookAtTarget);
            // Corrige para o modelo "ficar em pé"
            rocket.rotateX(Math.PI / 2);
        }

        // Calcula "para trás" real da nave baseado na rotação dela
        const backward = new THREE.Vector3(0, 0, 1); // Eixo +Z do modelo (ajuste se necessário)
        backward.applyEuler(rocket.rotation);

        // Atualiza a posição da câmera SEMPRE (para seguir o movimento da nave)
        const camDistance = 100;
        const camHeight = 120;
        const cameraPos = rocket.position.clone()
            .add(backward.multiplyScalar(camDistance))
            .add(new THREE.Vector3(0, camHeight, 0));
        camera.position.lerp(cameraPos, 0.14);
        camera.lookAt(rocket.position);


        // Missão: Chegou perto de algum planeta?
        missions.forEach(m => {
            if (!m.completed) {
                const target = planets.find(p => p.name === m.target);
                if (target && rocket.position.distanceTo(target.position) < target.geometry.parameters.radius + 90 * rocket.scale.x) {
                    m.completed = true;
                    completedMissions.push(m);
                }
            }
        });

        // Atualiza HUD
        hud.innerHTML = `
            <div><b>Missões:</b></div>
            ${missions.map(m =>
                `<div style="color:${m.completed?'#6f6':'#fff'}">${m.completed?'✔️':'⏳'} ${m.description}</div>`
            ).join('')}
        `;

        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}