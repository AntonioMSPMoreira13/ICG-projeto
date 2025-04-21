import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let gameActive = false; // Flag to track if the game is active
let gamePaused = false; // Flag to track if the game is paused

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

    // Add soft white lights above and below the camera
    const topLight = new THREE.DirectionalLight(0xffffff, 0.5); // Light above the camera
    topLight.position.set(0, 50, 0);
    scene.add(topLight);

    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.5); // Light below the camera
    bottomLight.position.set(0, -50, 0);
    scene.add(bottomLight);

    // Nave do jogador
    const shipGeometry = new THREE.ConeGeometry(1, 2, 32);
    const shipMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    const ship = new THREE.Mesh(shipGeometry, shipMaterial);
    ship.rotation.x = Math.PI / 2;
    ship.position.set(0, 0, 0);
    scene.add(ship);

    // Moedas e asteroides
    const coins = [];
    const asteroids = [];
    const asteroidGeometry = new THREE.SphereGeometry(1.2, 16, 16); // Asteroids are now larger
    const coinGeometry = new THREE.SphereGeometry(0.8, 16, 16); // Smaller for coins
    let coinExists = false;

    function spawnAsteroidOrCoin() {
        const isCoin = !coinExists && Math.random() > 0.7; // Only one coin at a time
        const color = isCoin ? 0xffff00 : 0xff0000; // Yellow for coin, red for asteroid
        const material = new THREE.MeshStandardMaterial({ color });
        const object = new THREE.Mesh(isCoin ? coinGeometry : asteroidGeometry, material);
        object.userData = { isCoin };
        object.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -50
        );
        if (isCoin) coinExists = true;
        (isCoin ? coins : asteroids).push(object);
        scene.add(object);
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
        'Neptune', 'Uranus', 'Saturn', 'Jupiter', 'Mars', 'Earth', 'Venus', 'Mercury', 'Sun'
    ];

    let currentPlanetIndex = 0;
    let currentPlanet = null;
    let nextPlanet = null;

    // Function to add a planet for the current level
    function addPlanetForLevel() {
        if (currentPlanet) {
            scene.remove(currentPlanet); // Remove the previous planet
        }

        const planetName = planetOrder[currentPlanetIndex];
        const planetTexture = planetTextures[planetName];
        const planetSize = planetName === 'Sun' ? 10 : 3; // Sun is larger
        const planetGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
        const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });
        currentPlanet = new THREE.Mesh(planetGeometry, planetMaterial);

        // Position the planet to the side as a background
        const sidePosition = Math.random() > 0.5 ? 30 : -30; // Randomly choose left or right
        currentPlanet.position.set(sidePosition, 0, -50); // Position the planet to the side
        scene.add(currentPlanet);

        // Add the next planet for the upcoming level
        addNextPlanet(sidePosition); // Pass the same side position
    }

    // Function to add the next planet for the upcoming level
    function addNextPlanet(sidePosition) {
        if (nextPlanet) {
            scene.remove(nextPlanet); // Remove the previous next planet
        }

        const nextPlanetIndex = currentPlanetIndex + 1;
        if (nextPlanetIndex < planetOrder.length) {
            const planetName = planetOrder[nextPlanetIndex];
            const planetTexture = planetTextures[planetName];
            const planetSize = planetName === 'Sun' ? 10 : 3; // Sun is larger
            const planetGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
            const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });
            nextPlanet = new THREE.Mesh(planetGeometry, planetMaterial);

            // Position the next planet on the same side as the current planet
            nextPlanet.position.set(sidePosition, 0, -100); // Position the next planet further back
            scene.add(nextPlanet);
        }
    }

    // Call this function when the level changes
    function levelUp() {
        level++;
        asteroidSpeed += 0.05; // Slightly increase asteroid speed
        for (let i = 0; i < 5 + level; i++) spawnAsteroidOrCoin(); // Add more asteroids as the level increases

        if (currentPlanetIndex < planetOrder.length - 1) {
            currentPlanetIndex++; // Move to the next planet
            const previousSidePosition = currentPlanet.position.x; // Get the side position of the current planet
            addPlanetForLevel(); // Add the new planet
            addNextPlanet(previousSidePosition); // Add the next planet on the same side
        } else {
            // If the player reaches the Sun, stop adding planets
            currentPlanetIndex = planetOrder.length - 1;
        }
    }

    // Update the planets' sizes and positions
    function updatePlanetSize() {
        if (currentPlanet) {
            const scaleFactor = 1 + score / 500; // Slower scaling factor
            currentPlanet.scale.set(scaleFactor, scaleFactor, scaleFactor);

            // Move the current planet forward even slower
            currentPlanet.position.z += 0.02; // Very slow forward movement
            if (currentPlanet.position.z > 10) {
                scene.remove(currentPlanet);
                currentPlanet = null;
            }
        }

        if (nextPlanet) {
            const nextScaleFactor = 0.5 + (score / 1000); // Half the scaling rate of the current planet
            nextPlanet.scale.set(nextScaleFactor, nextScaleFactor, nextScaleFactor);

            // Move the next planet forward slower than the current planet
            nextPlanet.position.z += 0.01; // Slower forward movement
            if (nextPlanet.position.z > 10) {
                scene.remove(nextPlanet);
                nextPlanet = null;
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
        gamePaused = true;
        const pauseMenu = document.createElement('div');
        pauseMenu.className = 'pause-menu'; // Use class instead of inline styles

        const resumeButton = document.createElement('button');
        resumeButton.className = 'menu-button'; // Use class instead of inline styles
        resumeButton.innerText = 'Resume';
        resumeButton.onclick = () => {
            gamePaused = false; // Retomar o jogo
            pauseMenu.remove(); // Remover o menu de pausa
            animate(); // Reiniciar o loop de animação
        };
        pauseMenu.appendChild(resumeButton);

        const menuButton = document.createElement('button');
        menuButton.className = 'menu-button'; // Use class instead of inline styles
        menuButton.innerText = 'Menu';
        menuButton.onclick = () => {
            gameOver(); // Trigger game over when quitting to the menu
        };
        pauseMenu.appendChild(menuButton);

        document.body.appendChild(pauseMenu);
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
        if (controls.a) ship.position.x -= 0.1;
        if (controls.d) ship.position.x += 0.1;

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
        highScoreList.innerHTML = '<li>0</li><li>0</li><li>0</li><li>0</li><li>0</li>'; // Atualiza a lista na interface
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