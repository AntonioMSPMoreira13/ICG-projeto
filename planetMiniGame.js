import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function startPlanetMiniGame(planetName, planetTexture) {
    // Configuração da cena
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.innerHTML = ''; // Limpa o conteúdo atual da página
    document.body.appendChild(renderer.domElement);

    // Fundo com textura de estrelas
    const textureLoader = new THREE.TextureLoader();
    const starTexture = textureLoader.load('texture/fundo.jpg', () => {
        const backgroundGeometry = new THREE.SphereGeometry(350, 64, 32);
        const backgroundMaterial = new THREE.MeshStandardMaterial({
            map: starTexture,
            side: THREE.BackSide // Renderiza a textura do lado interno da esfera
        });
        const backgroundSphere = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        scene.add(backgroundSphere);
    });

    // Luz simulando o Sol
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 500,0.1);
    pointLight.position.set(50, 50, 50); // Posição da luz
    scene.add(pointLight);

    // Criar o planeta
    const planetGeometry = new THREE.SphereGeometry(5, 32, 32);
    const planetMaterial = new THREE.MeshStandardMaterial({ map: planetTexture });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planet);

    // Configuração inicial da câmera
    camera.position.set(0, 10, 20);
    camera.lookAt(planet.position);

    // Criar botão para voltar
    const backButton = document.createElement('button');
    backButton.innerText = 'Voltar';
    backButton.style.position = 'absolute';
    backButton.style.top = '10px';
    backButton.style.left = '10px';
    backButton.style.padding = '10px 20px';
    backButton.style.fontSize = '16px';
    backButton.style.cursor = 'pointer';
    backButton.onclick = () => {
        location.reload(); // Recarrega a página para voltar ao sistema solar
    };
    document.body.appendChild(backButton);

    // Adicionar a Lua se o planeta for a Terra
    let moon = null;
    let moonAngle = 0;
    const moonOrbitRadius = 10;
    const moonSpeed = 0.02;

    if (planetName === 'Earth') {
        const moonTexture = textureLoader.load('texture/Solar_sys/Moon.jpg');
        const moonGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const moonMaterial = new THREE.MeshStandardMaterial({ map: moonTexture });
        moon = new THREE.Mesh(moonGeometry, moonMaterial);
        moon.position.set(moonOrbitRadius, 0, 0); // Posicionar a Lua
        scene.add(moon);
    }

    // Controles de câmera
    const orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.enableZoom = true;

    // Loop de animação
    function animate() {
        requestAnimationFrame(animate);

        // Rotação do planeta
        planet.rotation.y += 0.01;

        // Atualizar a órbita da Lua
        if (moon) {
            moonAngle += moonSpeed;
            moon.position.x = Math.cos(moonAngle) * moonOrbitRadius;
            moon.position.z = Math.sin(moonAngle) * moonOrbitRadius;
        }

        orbitControls.update();
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
