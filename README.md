# Sistema Solar 3D com Jogos Interativos

Este projeto foi desenvolvido em `Three.js` e simula um sistema solar interativo, com **visualização 3D**, informações dinâmicas e **dois jogos integrados**: um clássico jogo de asteroides e um jogo de exploração espacial em escala épica.

---

## 🌌 Funcionalidades Gerais

### Sistema Solar 3D
- Visualização tridimensional dos 8 planetas principais, Lua e Sol.
- Lua orbitando a Terra com velocidade própria.
- Cada planeta possui:
  - Tamanho e distância proporcionais e realistas
  - Velocidade de rotação e translação distintas
  - Texturas realistas e nomes exibidos em destaque ao passar o mouse
  - Anel dinâmico e rotativo em Saturno
- Fundo espacial com textura de estrelas
- **Interatividade:** Raycasting para destaque de planetas e exibição do nome; clique para seguir o planeta com a câmera.
- **Menu lateral (Drawer)**:
  - Ajuste de velocidade orbital dos planetas (slider)
  - Exibir/ocultar órbitas
  - Botões para iniciar jogos interativos

---

## 🕹️ Jogo dos Asteroides

- Iniciado pelo menu lateral
- Nave inspirada no clássico Asteroids, controlada por **W, A, S, D**
- Moedas amarelas (coletáveis) e asteroides (indestrutíveis)
- **Regras e mecânicas:**
  - +10 pontos por moeda coletada
  - +1 ponto por segundo sobrevivido
  - A cada 25 pontos aumenta dificuldade (mais asteroides, maior velocidade)
  - 3 vidas por partida; invulnerabilidade temporária após colisão
  - Sistema de pontuação com ranking de High Scores (salvo no navegador)
- **Menus exclusivos**:
  - Início, Pause, Game Over
  - Reset de High Scores

---

## 🚀 Exploration Game (Novo modo!)

- Universo 3D explorável, com **escala épica** (sol e planetas 100x maiores que o padrão do sistema solar)
- Você pilota um foguete (estilo Asteroids) em terceira pessoa
- Sistema solar ampliado: planetas gerados com tamanhos reais, **espalhados em posições aleatórias de suas órbitas**
- **Missões:** Objetivo é visitar cada planeta (chegue perto para completar a missão!)
- **Controles do foguete:**
  - **W/S**: Olhar para cima/baixo (pitch)
  - **A/D**: Olhar para esquerda/direita (yaw)
  - **Shift**: Ligar/desligar propulsão para frente (toggle)
  - **Ctrl**: Ré (andar para trás enquanto pressionado)
  - **ESC**: Pausa (mostra menu com Resume/Quit)
- **Câmera:** acompanha sempre o thruster, sempre atrás da nave, seguindo movimento e curvas
- Planetas aparecem em posições realmente espalhadas no espaço, cada vez que um novo jogo começa

---

## 🗺️ Organização dos Arquivos

- `index.html`: entrada principal e inicialização da cena 3D
- `solarSystem.js`: lógica e renderização do sistema solar (planetas, órbitas, Lua)
- `DrawerMenu.js`: menu lateral com controles do sistema e acesso aos jogos
- `asteroidGame.js`: lógica completa do jogo de asteroides
- `explorationGame.js`: lógica do modo Exploration Game (exploração livre)
- `Project.css`: estilos visuais e responsividade

---

## 🧪 Técnicas Utilizadas

- `Three.js` para renderização 3D e interatividade
- `WebGLRenderer`, `OrbitControls`, Raycasting, animação com `requestAnimationFrame`
- Controle de menus e estado do jogo com JavaScript moderno
- Responsividade total e integração com eventos de teclado/mouse

---

## 🎮 Como Jogar

1. **Explore o Sistema Solar**: clique nos planetas para segui-los, ajuste a velocidade orbital ou ative/desative órbitas no menu.
2. **Jogue Asteroid Game**: acesse pelo menu lateral, escolha sua nave, colete moedas e desvie dos asteroides!
3. **Experimente o Exploration Game**: explore o sistema solar em escala gigante, pilote o foguete e complete as missões visitando os planetas.

---

## 📎 Links Importantes

- **Demo Online:**  
  https://antoniomspmoreira13.github.io/ICG-projeto/index

- **Imagens/texturas dos planetas:**  
  https://www.fab.com/listings/f6df77fc-df73-4d6e-aab1-e0ccc2261a59

---

### Desenvolvido por António Moreira - 93279