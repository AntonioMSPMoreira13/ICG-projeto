import * as THREE from 'three';

export function createSolarSystem(scene) {
    const sundiameter = 5.0; // Reduce the Sun's size for better scaling

    // Carregar texturas
    const textureLoader = new THREE.TextureLoader();
    const textures = {
        sun: textureLoader.load('texture/Solar_sys/Sun.jpg'),
        mercury: textureLoader.load('texture/Solar_sys/Mercury.jpg'),
        venus: textureLoader.load('texture/Solar_sys/Venus.jpg'),
        earth: textureLoader.load('texture/Solar_sys/Earth.jpg'),
        moon: textureLoader.load('texture/Solar_sys/Moon.jpg'),
        mars: textureLoader.load('texture/Solar_sys/Mars.jpg'),
        jupiter: textureLoader.load('texture/Solar_sys/Jupiter.jpg'),
        saturn: textureLoader.load('texture/Solar_sys/Saturn.jpg'),
        saturnRing: textureLoader.load('texture/Solar_sys/SaturnRing.png'),
        uranus: textureLoader.load('texture/Solar_sys/Uranus.jpg'),
        neptune: textureLoader.load('texture/Solar_sys/Neptune.jpg')
    };

    // Criar a esfera gigante para o fundo com textura de estrelas
    const starTexture = textureLoader.load('texture/fundo.jpg', () => {
        const backgroundGeometry = new THREE.SphereGeometry(500, 64, 32); // Increase background size
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
    sun.userData = {
        onClick: () => {
            // Dispatch an event to handle the Sun click
            const event = new CustomEvent('objectClicked', { detail: { name: 'Sun', resetCamera: true } });
            window.dispatchEvent(event);
        }
    };
    scene.add(sun);

    // Criar planetas e suas órbitas
    const planets = [];
    const orbits = [];

    const planetData = [
        { name: 'Mercury', texture: textures.mercury, distance: sundiameter + 8, size: 0.4, speed: 0.0001, rotationSpeed: 0.0002, clockwise: false },
        { name: 'Venus', texture: textures.venus, distance: sundiameter + 12, size: 0.9, speed: 0.00007, rotationSpeed: 0.0001, clockwise: true },
        { name: 'Earth', texture: textures.earth, distance: sundiameter + 16, size: 1.0, speed: 0.00005, rotationSpeed: 0.001, clockwise: false, hasMoon: true },
        { name: 'Mars', texture: textures.mars, distance: sundiameter + 22, size: 0.7, speed: 0.00003, rotationSpeed: 0.0008, clockwise: false },
        { name: 'Jupiter', texture: textures.jupiter, distance: sundiameter + 60, size: 3.5, speed: 0.00001, rotationSpeed: 0.002, clockwise: false },
        { name: 'Saturn', texture: textures.saturn, distance: sundiameter + 100, size: 2.8, speed: 0.000008, rotationSpeed: 0.0018, clockwise: false },
        { name: 'Uranus', texture: textures.uranus, distance: sundiameter + 150, size: 2.0, speed: 0.000004, rotationSpeed: 0.001, clockwise: true },
        { name: 'Neptune', texture: textures.neptune, distance: sundiameter + 200, size: 1.9, speed: 0.000002, rotationSpeed: 0.0012, clockwise: false }
    ];

    let paused = false; // Pause state
    let moonAngle = 0; // Moon's orbital angle

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
                // Dispatch an event with the planet's data
                const event = new CustomEvent('planetInfo', { detail: { ...data } });
                window.dispatchEvent(event);
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
        if (data.name === 'Earth' && data.hasMoon) {
            const moonGeometry = new THREE.SphereGeometry(0.3, 32, 32); // Adjust Moon size
            const moonMaterial = new THREE.MeshStandardMaterial({ map: textures.moon });
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.position.set(data.distance + 3, 0, 0); // Adjust Moon distance relative to Earth
            moon.name = 'Moon';
            scene.add(moon);

            planetDataEntry.moon = {
                mesh: moon,
                distance: 3, // Moon's orbit radius
                angle: 0, // Initial orbital angle
                speed: 0.000015, // Slower than Earth's orbit
                baseSpeed: 0.000015,
                rotationSpeed: 0.000015 // Synchronous rotation, also slow
            };
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

    return { planets, orbits, sun, paused };
}

export function animateSolarSystem(planets, paused) {
    if (!paused) {
        planets.forEach(planet => {
            // Atualizar órbita e rotação dos planetas
            planet.angle += planet.speed;
            planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
            planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
            planet.mesh.rotation.y += planet.rotationSpeed;

            // Atualizar órbita da Lua se ela existir
            if (planet.mesh.name === 'Earth' && planet.moon) {
                planet.moon.angle += planet.moon.speed;
                const moonX = Math.cos(planet.moon.angle) * planet.moon.distance;
                const moonZ = Math.sin(planet.moon.angle) * planet.moon.distance;
                planet.moon.mesh.position.set(
                    moonX + planet.mesh.position.x,
                    planet.mesh.position.y,
                    moonZ + planet.mesh.position.z
                );

                // Synchronous rotation of the Moon
                planet.moon.mesh.rotation.y += planet.moon.rotationSpeed;
            }
        });
    }
}