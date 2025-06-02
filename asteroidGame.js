import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';


let gameActive = false; // Flag to track if the game is active
let gamePaused = false; // Flag to track if the game is paused

// Function to generate a procedural asteroid
function createProceduralAsteroid() {
    let geometry = new THREE.IcosahedronGeometry(1, 3);
    geometry = geometry.toNonIndexed();
    const positionAttribute = geometry.attributes.position;

    // Apply stronger noise for chunkiness
    const noiseScale = 0.5;
    for (let i = 0; i < positionAttribute.count; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        const randomFactor = (Math.random() - 0.5) * noiseScale;
        positionAttribute.setXYZ(i, x + randomFactor, y + randomFactor, z + randomFactor);
    }

    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
        color: 0x5a3b2e, // darker rocky tone
        roughness: 0.9,
        metalness: 0.1,
        flatShading: true
    });

    return new THREE.Mesh(geometry, material);
}

// Exported function to start the asteroid game
export function startAsteroidGame() {
    gameActive = true; // Activate the game
    gamePaused = false; // Ensure the game is not paused

    // Configuração da cena
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.innerHTML = ''; // Limpa o conteúdo atual da página
    document.body.appendChild(renderer.domElement);

    // Adicionar fundo com textura de estrelas
    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load('texture/fundo.jpg', () => {
        const backgroundGeometry = new THREE.SphereGeometry(500, 64, 32);
        const backgroundMaterial = new THREE.MeshStandardMaterial({
            map: starTexture,
            side: THREE.BackSide // Renderiza a textura do lado interno da esfera
        });
        const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        scene.add(backgroundSphere);
    });

    // Adicionar o Sol ao centro
    const sunTexture = textureLoader.load('texture/Solar_sys/Sun.jpg');
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({
        map: sunTexture,
        emissive: 0xFFFF00,
        emissiveIntensity: 1,
        emissiveMap: sunTexture
    });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, -50); // Posicionar o Sol no fundo
    scene.add(sun);

    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404040, 1); // Reduced intensity
    scene.add(ambientLight);

    const lightIntensity = 0.2;
    // Top
    const topLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    topLight.position.set(0, 50, -25);
    topLight.target.position.set(0, 0, -25);
    scene.add(topLight);
    scene.add(topLight.target);
    // Bottom
    const bottomLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    bottomLight.position.set(0, -50, -25);
    bottomLight.target.position.set(0, 0, -25);
    scene.add(bottomLight);
    scene.add(bottomLight.target);
    // Left
    const leftLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    leftLight.position.set(-50, 0, -25);
    leftLight.target.position.set(0, 0, -25);
    scene.add(leftLight);
    scene.add(leftLight.target);
    // Right
    const rightLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    rightLight.position.set(50, 0, -25);
    rightLight.target.position.set(0, 0, -25);
    scene.add(rightLight);
    scene.add(rightLight.target);
    // Behind ship
    const rearLight = new THREE.DirectionalLight(0xffffff, lightIntensity);
    rearLight.position.set(0, 0, 10);
    rearLight.target.position.set(0, 0, -25);
    scene.add(rearLight);
    scene.add(rearLight.target);


    // Nave do jogador
    const shipShape = SHIP_SHAPES[selectedShipShape];
    const shipGeometry = shipShape.geometry();
    const shipMaterial = new THREE.MeshStandardMaterial({ color: shipShape.color });
    const ship = shipGeometry;
    ship.rotation.x = Math.PI * -0.5; // Rotate to face the camera
    ship.position.set(0, 0, 0);
    scene.add(ship);

    // Moedas e asteroides
    const coins = [];
    const asteroids = [];
    const asteroidGeometry = new THREE.SphereGeometry(1.2, 16, 16); // Asteroids are now larger
    const coinGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 32); // Diameter matches the ship, thin height
    let coinExists = false;

    function spawnAsteroidOrCoin() {
        const isCoin = !coinExists && Math.random() > 0.7; // Only one coin at a time
        if (isCoin) {
            const coinmaterial = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                metalness: 1.0,
                roughness: 0.2,
                emissive: 0x332200
            });
            const coin = new THREE.Mesh(coinGeometry, coinmaterial);
            coin.userData = { isCoin: true };
            coin.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                -50
            );
            coin.rotation.x = Math.PI / 2; // Rotate to face the player
            coinExists = true;
            coins.push(coin);
            scene.add(coin);
        } else {
            const asteroid = createProceduralAsteroid(); // Use procedural asteroid
            asteroid.userData = { isCoin: false };
            asteroid.position.set(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                -50
            );
            asteroids.push(asteroid);
            scene.add(asteroid);
        }
    }

    // Pontuação, nível e vidas
    let score = 0;
    let level = 1;
    let asteroidSpeed = 0.3; // Speed of asteroids
    let lives = 3; // Total de vidas
    let invulnerable = false; // Flag de invulnerabilidade
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];

    // Elemento de pontuação
    const scoreElement = document.createElement('div');
    scoreElement.className = 'score-display'; // Use class instead of inline styles
    scoreElement.innerText = `Score: ${score} | Level: ${level}`;
    document.body.appendChild(scoreElement);

    // Elemento de vidas
    const livesElement = document.createElement('div');
    livesElement.className = 'lives-display'; // Use class instead of inline styles
    updateLivesDisplay();
    document.body.appendChild(livesElement);

    function updateLivesDisplay() {
        livesElement.innerHTML = 'Lives: ' + '❤️'.repeat(lives);
    }

    // Controles do teclado
    const controls = {
        w: false,
        a: false,
        s: false,
        d: false,
        space: false
    };

    window.addEventListener('keydown', (event) => {
        controls[event.key.toLowerCase()] = true;
        if (event.key === 'Escape') pauseGame();
    });
    window.addEventListener('keyup', (event) => {
        controls[event.key.toLowerCase()] = false;
    });

    // Spawn inicial de objetos
    for (let i = 0; i < 7; i++) {
        spawnAsteroidOrCoin();
    }

    // Configuração inicial da câmera
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    // Temporizador de sobrevivência
    let survivalTimer = 0;

    // Adicionar streaks de luz para o efeito de velocidade
    const streaks = [];
    const streakGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2, 8); // Estreitas e longas
    const streakMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

    function createStreak() {
        const streak = new THREE.Mesh(streakGeometry, streakMaterial);
        streak.position.set(
            (Math.random() - 0.5) * 40, // Distribuição aleatória no eixo X
            (Math.random() - 0.5) * 40, // Distribuição aleatória no eixo Y
            -Math.random() * 100 - 10  // Distribuição ao longo do eixo Z
        );
        streak.rotation.x = Math.PI / 2; // Orientar streaks para o movimento
        streaks.push(streak);
        scene.add(streak);
    }

    // Criar várias streaks inicialmente
    for (let i = 0; i < 300; i++) {
        createStreak();
    }

    // Atualizar streaks para o efeito de movimento
    function updateStreaks() {
        streaks.forEach((streak) => {
            streak.position.z += 1; // Move streaks para trás
            if (streak.position.z > 10) {
                // Reposicionar streaks para o fundo quando saem da visão
                streak.position.z = -100;
                streak.position.x = (Math.random() - 0.5) * 40;
                streak.position.y = (Math.random() - 0.5) * 40;
            }
        });
    }

    // Planets for levels
    const planetTextures = {
        Neptune: textureLoader.load('texture/Solar_sys/Neptune.jpg'),
        Uranus: textureLoader.load('texture/Solar_sys/Uranus.jpg'),
        Saturn: textureLoader.load('texture/Solar_sys/Saturn.jpg'),
        Jupiter: textureLoader.load('texture/Solar_sys/Jupiter.jpg'),
        Mars: textureLoader.load('texture/Solar_sys/Mars.jpg'),
        Earth: textureLoader.load('texture/Solar_sys/Earth.jpg'),
        Venus: textureLoader.load('texture/Solar_sys/Venus.jpg'),
        Mercury: textureLoader.load('texture/Solar_sys/Mercury.jpg'),
        Sun: textureLoader.load('texture/Solar_sys/Sun.jpg')
    };

    const planetOrder = [
        'Neptune', 'Uranus', 'Saturn', 'Jupiter', 'Mars', 'Earth', 'Venus', 'Mercury'
    ];

    let currentPlanetIndex = 0;
    let currentPlanet = null;

    function addPlanetForLevel() {
        if (currentPlanet) {
            scene.remove(currentPlanet);
            currentPlanet = null;
        }

        const planetName = planetOrder[currentPlanetIndex];
        const texture = planetTextures[planetName];

        if (!texture) {
            console.warn(`Texture for planet ${planetName} not found.`);
            return;
        }

        const geometry = new THREE.SphereGeometry(3, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            map: texture,
            emissive: new THREE.Color(0xffffff),
            emissiveMap: texture,
            emissiveIntensity: 0.01
        });

        currentPlanet = new THREE.Mesh(geometry, material);
        currentPlanet.scale.set(0.01, 0.01, 0.01); // Start small
        const sideX = Math.random() > 0.5 ? 30 : -30;
        currentPlanet.position.set(sideX, 0, -50);
        scene.add(currentPlanet);
    }

    // Call this function when the level changes
    function levelUp() {
        level++;
        asteroidSpeed += 0.05; // Slightly increase asteroid speed
        for (let i = 0; i < 5 + level; i++) spawnAsteroidOrCoin(); // Add more asteroids as the level increases

        if (currentPlanetIndex < planetOrder.length - 1) {
            currentPlanetIndex++; // Move to the next planet
            const previousSidePosition = currentPlanet ? currentPlanet.position.x : 0; // Safely get the side position
            addPlanetForLevel(); // Add the new planet
        } else {
            // If the player reaches the Sun, stop adding planets
            currentPlanetIndex = planetOrder.length - 1;
        }
    }

    // Update the planets' sizes and positions
    function updatePlanetSize() {
        const planetIndex = Math.floor(score / 100);
        const showPlanet = planetIndex % 2 === 1; // Show planet only for odd 100s like 100–199, 300–399...

        if (showPlanet && planetIndex < planetOrder.length) {
            if (currentPlanetIndex !== planetIndex) {
                currentPlanetIndex = planetIndex;
                addPlanetForLevel();
            }

            const progress = (score % 100) / 100;

            if (currentPlanet) {
                const easedProgress = Math.pow(progress, 2.5); // ease-in curve
                const scale = 0.01 + easedProgress * 3;
                currentPlanet.scale.set(scale, scale, scale);
                currentPlanet.position.z = -50 + progress * 70;

                if (progress >= 1) {
                    scene.remove(currentPlanet);
                    currentPlanet = null;
                }
            }
        } else {
            // Remove current planet if not in the display range
            if (currentPlanet) {
                scene.remove(currentPlanet);
                currentPlanet = null;
            }
        }
    }

    // Atualizar objetos e planetas
    function updateObjects() {
        asteroids.forEach((asteroid, index) => {
            asteroid.position.z += asteroidSpeed;
            if (asteroid.position.z > 10) {
                scene.remove(asteroid);
                asteroids.splice(index, 1);
                spawnAsteroidOrCoin(); // Substituir o asteroide
            }

            // Detectar colisão com a nave
            if (!invulnerable && ship.position.distanceTo(asteroid.position) < 1.5) {
                gameOver();
                return;
            }
        });

        coins.forEach((coin, index) => {
            coin.position.z += asteroidSpeed;
            coin.rotation.z += 0.02;
             // Add spinning animation to the coin
            if (coin.position.z > 10) {
                scene.remove(coin);
                coins.splice(index, 1);
                coinExists = false;
                spawnAsteroidOrCoin(); // Substituir a moeda
            }

            // Detectar coleta de moeda pela nave
            if (ship.position.distanceTo(coin.position) < 1.5) {
                score += 10; // Incrementar pontuação ao coletar moeda
                scoreElement.innerText = `Score: ${score} | Level: ${level}`;
                scene.remove(coin);
                coins.splice(index, 1);
                coinExists = false;

                // Simulate a speed-up effect by increasing asteroid speed temporarily
                asteroidSpeed += 0.2;
                setTimeout(() => {
                    asteroidSpeed -= 0.2; // Revert the speed after a short duration
                }, 1000);
            }
        });

        // Incrementar pontuação por sobrevivência
        survivalTimer += 1;
        if (survivalTimer >= 60) { // A cada 60 frames (~1 segundo)
            score += 1;
            scoreElement.innerText = `Score: ${score} | Level: ${level}`;
            survivalTimer = 0;
        }

        // Aumentar dificuldade com base na pontuação
        if (score >= level * 100) { // Aumenta o nível a cada 100 pontos
            levelUp();
        }

        // Update the planets' sizes and positions
        updatePlanetSize();
    }

    // Função de pausa
    function pauseGame() {
        if (!gamePaused) {
            gamePaused = true;
            const pauseMenu = document.createElement('div');
            pauseMenu.className = 'pause-menu'; // Use class instead of inline styles

            const resumeButton = document.createElement('button');
            resumeButton.className = 'menu-button'; // Use class instead of inline styles
            resumeButton.innerText = 'Resume';
            resumeButton.onclick = () => {
                gamePaused = false; // Resume the game
                pauseMenu.remove(); // Close the pause menu
                animate(); // Restart the animation loop
            };
            pauseMenu.appendChild(resumeButton);

            const menuButton = document.createElement('button');
            menuButton.className = 'menu-button'; // Use class instead of inline styles
            menuButton.innerText = 'Menu';
            menuButton.onclick = () => {
                gameActive = false; // End the game
                gamePaused = false; // Ensure the game is not paused
                lives = 0; // Set lives to 0 to trigger game over
                pauseMenu.remove(); // Close the pause menu
                gameOver(); // Trigger the game over menu
            };
            pauseMenu.appendChild(menuButton);

            document.body.appendChild(pauseMenu);

            // Add event listener for "Escape" key to toggle the pause menu
            function handleEscape(event) {
                if (event.key === 'Escape') {
                    gamePaused = false; // Resume the game
                    pauseMenu.remove(); // Close the pause menu
                    animate(); // Restart the animation loop
                    window.removeEventListener('keydown', handleEscape); // Remove listener after resuming
                }
            }
            window.addEventListener('keydown', handleEscape);
        }
    }

    // Função de game over
    function gameOver() {
        if (lives > 1) {
            lives--; // Perde uma vida
            updateLivesDisplay();
            invulnerable = true; // Ativa invulnerabilidade

            // Faz a nave piscar durante a invulnerabilidade
            let blinkInterval = setInterval(() => {
                ship.visible = !ship.visible; // Alterna a visibilidade da nave
            }, 200); // Pisca a cada 200ms

            setTimeout(() => {
                clearInterval(blinkInterval); // Para o piscar após 3 segundos
                ship.visible = true; // Garante que a nave fique visível no final
                invulnerable = false; // Remove invulnerabilidade
            }, 3000);

            return; // Não termina o jogo ainda
        }
        gameActive = false; // Stop the game
        gamePaused = true; // Ensure animations stop
        highScores.push(score);
        highScores = [...new Set(highScores)]; // Ensure unique scores
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, 5); // Mantém apenas os 5 melhores
        localStorage.setItem('highScores', JSON.stringify(highScores));

        const gameOverMenu = document.createElement('div');
        gameOverMenu.className = 'game-over-menu'; // Use class instead of inline styles

        const title = document.createElement('h1');
        title.className = 'game-over-title'; // Use class instead of inline styles
        title.innerText = 'Game Over';
        gameOverMenu.appendChild(title);

        const currentScoreElement = document.createElement('div');
        currentScoreElement.className = 'game-over-score'; // Use class instead of inline styles
        currentScoreElement.innerText = `Your Score: ${score}`;
        gameOverMenu.appendChild(currentScoreElement);

        const highScoreList = document.createElement('div');
        highScoreList.className = 'high-score-list'; // Use class instead of inline styles
        highScoreList.innerHTML = `<h3>High Scores</h3><ol>${highScores.map(score => `<li>${score}</li>`).join('')}</ol>`;
        gameOverMenu.appendChild(highScoreList);

        const restartButton = document.createElement('button');
        restartButton.className = 'menu-button'; // Use class instead of inline styles
        restartButton.innerText = 'Restart';
        restartButton.onclick = () => {
            document.body.innerHTML = ''; // Limpa o menu
            startAsteroidGame(); // Reinicia o jogo
        };
        gameOverMenu.appendChild(restartButton);

        const menuButton = document.createElement('button');
        menuButton.className = 'menu-button'; // Use class instead of inline styles
        menuButton.innerText = 'Menu';
        menuButton.onclick = () => {
            document.body.innerHTML = ''; // Limpa o menu
            startAsteroidGameMenu(); // Retorna ao menu principal do jogo dos asteroides
        };
        gameOverMenu.appendChild(menuButton);

        const quitButton = document.createElement('button');
        quitButton.className = 'menu-button'; // Use class instead of inline styles
        quitButton.innerText = 'Quit';
        quitButton.onclick = () => {
            location.reload(); // Retorna ao menu principal do sistema solar
        };
        gameOverMenu.appendChild(quitButton);

        document.body.appendChild(gameOverMenu);
    }

    // Loop de animação
    function animate() {
        if (!gameActive || gamePaused) return; // Stop animation if the game is inactive or paused

        requestAnimationFrame(animate);

        // Atualizar streaks para o efeito de velocidade
        updateStreaks();

        // Movimentação da nave
        if (controls.w) ship.position.y += 0.1;
        if (controls.s) ship.position.y -= 0.1;
        if (controls.a) {
            ship.position.x -= 0.1;
            ship.rotation.y += 0.025;
        } else if (controls.d) {
            ship.position.x += 0.1;
            ship.rotation.y -= 0.025;
        } else {
            ship.rotation.z = 0;
        }

        // Limit ship movement to asteroid spawn bounds
        ship.position.x = Math.max(-10, Math.min(10, ship.position.x));
        ship.position.y = Math.max(-10, Math.min(10, ship.position.y));


        // Atualizar objetos (asteroides e moedas)
        updateObjects();

        renderer.render(scene, camera);
    }

    animate();

    // Responsividade
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Ship shape options
const SHIP_SHAPES = [
    {
        name: 'Rocket',
        geometry: () => {
            const group = new THREE.Group();

            const textureLoader = new THREE.TextureLoader();
            const metalTexture = textureLoader.load('texture/Rocket.webp');

            // Metal-like material options
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
            return group;
        },
        color: 0xff0000
    },
    {
        name: 'Blocky',
        geometry: () => {
            const blockyShip = new THREE.Group();

            // Central glowing sphere
            const lightSphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
            const lightSphereMat = new THREE.MeshStandardMaterial({ color: 0x00ccff, emissive: 0x00ccff, emissiveIntensity: 1.5, metalness: 0.3, roughness: 0.2 });
            const lightSphere = new THREE.Mesh(lightSphereGeo, lightSphereMat);
            blockyShip.add(lightSphere);

            // Cubes around the sphere
            const cubeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const cubeMat = new THREE.MeshStandardMaterial({ color: 0xff00ff, metalness: 1, roughness: 0.1 });

            const cubeShell = new THREE.Group();
            const spacing = 1.0;
            const count = 3;

            for (let x = -count; x <= count; x++) {
              for (let y = -count; y <= count; y++) {
                for (let z = -count; z <= count; z++) {
                  const distance = Math.sqrt(x * x + y * y + z * z);
                  if (distance > 1.5 && distance < 3.5) {
                    const cube = new THREE.Mesh(cubeGeo, cubeMat);
                    cube.position.set(x * spacing, y * spacing, z * spacing);
                    cubeShell.add(cube);
                  }
                }
              }
            }

            blockyShip.add(cubeShell);
            blockyShip.rotation.y = Math.PI;
            return blockyShip;
        }
    },
];

let selectedShipShape = 0; // Default to Classic

export function startAsteroidGameMenu() {
    // Limpar o conteúdo atual da página
    document.body.innerHTML = '';

    // Criar o menu
    const menu = document.createElement('div');
    menu.className = 'main-menu'; // Use class for styling

    // Seção de high scores (esquerda)
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    const highScoreSection = document.createElement('div');
    highScoreSection.className = 'high-scores-section'; // Use class for styling
    highScoreSection.innerHTML = `
        <h3>High Scores</h3>
        <ol id="highScoreList">
            ${
                highScores.length > 0
                    ? highScores.slice(0, 5).map(score => `<li>${score}</li>`).join('')
                    : '<li>No scores yet</li>'
            }
        </ol>
    `;

    // Botão para resetar os high scores
    const resetButton = document.createElement('button');
    resetButton.className = 'menu-button'; // Use class for styling
    resetButton.innerText = 'Reset High Scores';
    resetButton.onclick = () => {
        localStorage.setItem('highScores', JSON.stringify([0, 0, 0, 0, 0])); // Reseta os high scores para 0
        const highScoreList = document.getElementById('highScoreList');
        highScoreList.innerHTML = '<li>0</li><li>0</li><li>0</li><li>0</li><li>0</li>';
    };
    highScoreSection.appendChild(resetButton);
    menu.appendChild(highScoreSection);

    // Seção de botões (centro)
    const buttonSection = document.createElement('div');
    buttonSection.className = 'button-section'; // Use class for styling

    const title = document.createElement('h1');
    title.className = 'menu-title'; // Use class for styling
    title.innerText = 'Asteroid Game Menu';
    buttonSection.appendChild(title);

    // --- Ship selection ---
    const shipSelectLabel = document.createElement('div');
    shipSelectLabel.innerText = 'Choose your ship:';
    shipSelectLabel.style.color = 'white';
    shipSelectLabel.style.fontSize = '20px';
    shipSelectLabel.style.marginBottom = '10px';
    buttonSection.appendChild(shipSelectLabel);

    const shipSelectContainer = document.createElement('div');
    shipSelectContainer.style.display = 'flex';
    shipSelectContainer.style.gap = '16px';
    shipSelectContainer.style.marginBottom = '20px';

    SHIP_SHAPES.forEach((shape, idx) => {
        const btn = document.createElement('button');
        btn.className = 'menu-button';
        btn.innerText = shape.name;
        btn.style.background = idx === selectedShipShape ? '#888' : '#444';
        btn.onclick = () => {
            selectedShipShape = idx;
            // Update button highlights
            Array.from(shipSelectContainer.children).forEach((b, i) => {
                b.style.background = i === idx ? '#888' : '#444';
            });
        };
        shipSelectContainer.appendChild(btn);
    });
    buttonSection.appendChild(shipSelectContainer);
    // --- End ship selection ---

    const startButton = document.createElement('button');
    startButton.className = 'menu-button'; // Use class for styling
    startButton.innerText = 'Start Game';
    startButton.onclick = () => {
        document.body.innerHTML = ''; // Limpa o menu
        startAsteroidGame(); // Inicia o jogo dos asteroides
    };
    buttonSection.appendChild(startButton);

    const quitButton = document.createElement('button');
    quitButton.className = 'menu-button'; // Use class for styling
    quitButton.innerText = 'Quit';
    quitButton.onclick = () => {
        location.reload(); // Retorna ao menu principal do sistema solar
    };
    buttonSection.appendChild(quitButton);
    menu.appendChild(buttonSection);

    // Seção de controles e explicação de cores (direita)
    const infoSection = document.createElement('div');
    infoSection.className = 'info-section'; // Use class for styling

    const controlsSection = document.createElement('div');
    controlsSection.innerHTML = `
        <h3>Controls</h3>
        <ul>
            <li><b>W:</b> Move Up</li>
            <li><b>S:</b> Move Down</li>
            <li><b>A:</b> Move Left</li>
            <li><b>D:</b> Move Right</li>
            <li><b>Escape:</b> Pause Game</li>
        </ul>
    `;
    infoSection.appendChild(controlsSection);

    const colorExplanation = document.createElement('div');
    colorExplanation.innerHTML = `
        <h3>Asteroid Colors</h3>
        <ul>
            <li><span style="color: yellow;">Yellow:</span> Coin, gives 10 points</li>
            <li><span style="color: red;">Red:</span> Indestructible, avoid them!</li>
        </ul>
    `;
    infoSection.appendChild(colorExplanation);

    menu.appendChild(infoSection);

    // Adicionar o menu ao corpo
    document.body.appendChild(menu);
}