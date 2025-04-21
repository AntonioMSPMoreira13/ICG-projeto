import { startAsteroidGameMenu } from './asteroidGame.js';

export function Drawermenu(scene, planets, orbits) {
    // Obter o container 3D
    const container = document.getElementById('Tag3DScene');

    // Criar o drawer
    const drawer = document.createElement('div');
    drawer.className = 'drawer';
    container.appendChild(drawer); // Adicionar ao container 3D

    // Criar botão para abrir/fechar o drawer
    const toggleButton = document.createElement('button');
    toggleButton.className = 'toggle-button';
    toggleButton.onclick = () => {
        drawer.classList.toggle('open');
        toggleButton.classList.toggle('hidden'); // Esconde o botão quando o menu está ativo
    };
    container.appendChild(toggleButton); // Adicionar ao container 3D

    // Criar botão para fechar o menu dentro do drawer
    const closeButton = document.createElement('button');
    closeButton.className = 'close-button';
    closeButton.innerText = 'X';
    closeButton.onclick = () => {
        drawer.classList.remove('open');
        toggleButton.classList.remove('hidden'); // Mostra o botão novamente quando o menu é fechado
    };
    drawer.appendChild(closeButton);

    // Criar slider para ajustar a velocidade orbital
    const sliderContainer = document.createElement('div');
    sliderContainer.className = 'slider-container';
    drawer.appendChild(sliderContainer);

    const sliderLabel = document.createElement('label');
    sliderLabel.innerText = 'Speed Multiplier: 1x';
    sliderContainer.appendChild(sliderLabel);

    const speedSlider = document.createElement('input');
    speedSlider.type = 'range';
    speedSlider.min = '0';
    speedSlider.max = '100';
    speedSlider.step = '1';
    speedSlider.value = '1';
    speedSlider.oninput = () => {
        const speedMultiplier = parseFloat(speedSlider.value);
        sliderLabel.innerText = `Speed Multiplier: ${speedMultiplier}x`;
        planets.forEach(planet => {
            planet.speed = planet.baseSpeed * speedMultiplier;
        });
    };
    sliderContainer.appendChild(speedSlider);

    // Criar botão para alternar visibilidade das órbitas
    const orbitToggleButton = document.createElement('button');
    orbitToggleButton.className = 'orbit-toggle-button';
    orbitToggleButton.innerText = 'Toggle Orbits';
    orbitToggleButton.onclick = () => {
        const showOrbits = orbits[0]?.visible ?? true;
        orbits.forEach(orbit => {
            orbit.visible = !showOrbits;
        });
    };
    drawer.appendChild(orbitToggleButton);

    // Criar botão para iniciar o menu do jogo dos asteroides
    const asteroidGameButton = document.createElement('button');
    asteroidGameButton.className = 'asteroid-game-button';
    asteroidGameButton.innerText = 'Asteroid Game';
    asteroidGameButton.onclick = () => {
        document.body.innerHTML = ''; // Limpa o conteúdo atual
        startAsteroidGameMenu(); // Navega para o menu do jogo dos asteroides
    };
    drawer.appendChild(asteroidGameButton);
}
