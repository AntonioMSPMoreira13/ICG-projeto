import * as THREE from 'three';
import { startPlanetMiniGame } from '../planetMiniGame.js';

export function createSolarSystem(scene) {
    const sundiameter = 9.2;

    // Carregar texturas
    //obtidas de https://www.fab.com/listings/f6df77fc-df73-4d6e-aab1-e0ccc2261a59
    const textureLoader = new THREE.TextureLoader();
    const textures = {
        sun: textureLoader.load('texture/Solar_sys/Sun.jpg'),
        mercury: textureLoader.load('texture/Solar_sys/Mercury.jpg'),
        venus: textureLoader.load('texture/Solar_sys/Venus.jpg'),
        earth: textureLoader.load('texture/Solar_sys/Earth.jpg'),
        mars: textureLoader.load('texture/Solar_sys/Mars.jpg'),
        jupiter: textureLoader.load('texture/Solar_sys/Jupiter.jpg'),
        saturn: textureLoader.load('texture/Solar_sys/Saturn.jpg'),
        saturnRing: textureLoader.load('texture/Solar_sys/SaturnRing.png'),
        uranus: textureLoader.load('texture/Solar_sys/Uranus.jpg'),
        neptune: textureLoader.load('texture/Solar_sys/Neptune.jpg')
    };

    // Criar a esfera gigante para o fundo com textura de estrelas
    const starTexture = textureLoader.load('texture/fundo.jpg', () => {
        const backgroundGeometry = new THREE.SphereGeometry(350, 64, 32);
        const backgroundMaterial = new THREE.MeshStandardMaterial({ 
            map: starTexture,
            side: THREE.BackSide // Renderiza a textura do lado interno da esfera
        });
        const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        scene.add(backgroundSphere);
    });

    // Criar o Sol
    const sunGeometry = new THREE.SphereGeometry(sundiameter, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({ 
        map: textures.sun, 
        emissive: 0xFFFF00, 
        emissiveIntensity: 1,
        emissiveMap: textures.sun
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.name = 'Sun'; // Adicionar o nome do Sol
    sun.castShadow = false;
    scene.add(sun);

    // Criar planetas e suas órbitas
    const planets = [];
    const orbits = [];

    const planetData = [
        { name: 'Mercury', texture: textures.mercury, distance: sundiameter + 3.9, size: 0.7, speed: 0.04, rotationSpeed: 0.005, clockwise: false },
        { name: 'Venus', texture: textures.venus, distance: sundiameter + 7.2, size: 1.2, speed: 0.03, rotationSpeed: 0.002, clockwise: true },
        { name: 'Earth', texture: textures.earth, distance: sundiameter + 10, size: 1.7, speed: 0.02, rotationSpeed: 0.01, clockwise: false },
        { name: 'Mars', texture: textures.mars, distance: sundiameter + 15.2, size: 1, speed: 0.015, rotationSpeed: 0.008, clockwise: false },
        { name: 'Jupiter', texture: textures.jupiter, distance: sundiameter + 52, size: 5.2, speed: 0.008, rotationSpeed: 0.02, clockwise: false },
        { name: 'Saturn', texture: textures.saturn, distance: sundiameter + 95.4, size: 4.2, speed: 0.006, rotationSpeed: 0.018, clockwise: false },
        { name: 'Uranus', texture: textures.uranus, distance: sundiameter + 192.2, size: 3.2, speed: 0.004, rotationSpeed: 0.01, clockwise: true },
        { name: 'Neptune', texture: textures.neptune, distance: sundiameter + 300.6, size: 3, speed: 0.002, rotationSpeed: 0.012, clockwise: false }
    ];

    let paused = false; // Pause state
    let moon = null; // Moon object
    let moonAngle = 0; // Moon's orbital angle
    const moonOrbitRadius = 2.5; // Moon's orbit radius
    const moonSpeed = 0.02; // Moon's orbital speed

    planetData.forEach(data => {
        // Criar o planeta
        const geometry = new THREE.SphereGeometry(data.size, 32, 32);
        const material = new THREE.MeshStandardMaterial({ 
            map: data.texture,
        });
        const planet = new THREE.Mesh(geometry, material);
        planet.position.x = data.distance;
        planet.name = data.name; // Adicionar o nome do planeta
        planet.castShadow = true;
        planet.receiveShadow = true;
        scene.add(planet);

        const planetDataEntry = {
            mesh: planet,
            distance: data.distance,
            speed: data.speed,
            angle: Math.random() * Math.PI * 2,
            baseSpeed: data.speed,
            rotationSpeed: data.rotationSpeed,
            clockwise: data.clockwise
        };

        // Detectar clique em qualquer planeta
        planet.userData = {
            onClick: () => {
                if (!document.body.classList.contains('menu-active')) {
                    startPlanetMiniGame(data.name, data.texture); // Iniciar o mini-jogo com o planeta clicado
                }
            }
        };

        // Adicionar o anel de Saturno
        if (data.name === 'Saturn') {
            const ringGeometry = new THREE.RingGeometry(data.size * 1.8, data.size * 3, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                map: textures.saturnRing,
                side: THREE.DoubleSide,
                transparent: true
            });
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            ring.rotation.x = -Math.PI / 2; // Corrigir a direção do anel
            ring.position.x = data.distance; // Posicionar o anel junto ao planeta
            scene.add(ring);

            // Associar o anel ao planeta
            planetDataEntry.ring = ring;

            // Adicionar rotação do anel
            planetDataEntry.ringRotationSpeed = data.rotationSpeed; // Sincronizar com a rotação do planeta
        }

        // Adicionar a Lua se o planeta for a Terra
        if (data.name === 'Earth') {
            const moonTexture = textures.mercury; // Reuse Mercury's texture for the Moon
            const moonGeometry = new THREE.SphereGeometry(0.5, 32, 32);
            const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
            moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.position.set(data.distance + moonOrbitRadius, 0, 0); // Initial Moon position
            scene.add(moon);

            // Store Earth's data for Moon's orbit calculations
            data.moon = moon;
        }

        planets.push(planetDataEntry);

        // Criar a órbita do planeta
        const orbitGeometry = new THREE.RingGeometry(data.distance - 0.2, data.distance + 0.2, 64);
        const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
        const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
        orbit.rotation.x = Math.PI / 2;
        scene.add(orbit);
        orbits.push(orbit);
    });

    // Desativar interações com os planetas quando um menu está ativo
    document.body.classList.add('menu-active');

    // Certifique-se de reativar as interações ao sair do menu
    document.body.classList.remove('menu-active'); // Reativa as interações quando o menu é fechado

    // Adicionar listener para funcionalidade de pausa/resumo
    window.addEventListener('keydown', (event) => {
        if (event.code === 'Space') {
            paused = !paused; // Alternar estado de pausa
        }
    });

    return { planets, orbits, sun, moon, paused };
}

// Atualizar o loop de animação para lidar com pausa e órbita da Lua
export function animateSolarSystem(planets, moon, paused) {
    if (!paused) {
        planets.forEach(planet => {
            // Atualizar órbita e rotação dos planetas
            planet.angle += planet.speed;
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
            planet.mesh.rotation.y += planet.rotationSpeed;

            // Atualizar órbita da Lua se ela existir
            if (planet.mesh.name === 'Earth' && moon) {
                moonAngle += moonSpeed;
                moon.position.x = Math.cos(moonAngle) * moonOrbitRadius + planet.mesh.position.x;
                moon.position.z = Math.sin(moonAngle) * moonOrbitRadius + planet.mesh.position.z;
            }
        });
    }
}
