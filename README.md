# Sistema Solar 3D com Jogo de Asteroides

Este projeto foi desenvolvido com base em `Three.js` e simula um sistema solar interativo com uma experiência complementar: um jogo de asteroides em 3D.

## 🌌 Funcionalidades Gerais

### Sistema Solar 3D
- Visualização 3D do sistema solar com os 8 planetas principais e o Sol.
- Lua orbitando a Terra.
- Cada planeta possui:
  - Tamanho proporcional
  - Velocidade de rotação e translação distinta
  - Texturas realistas
  - Anel rotativo no planeta Saturno
- Fundo com textura de estrelas para imersão espacial.
- Raycasting para destaque de planetas e exibição do nome ao passar o mouse.
- Câmera dinâmica:
  - Padrão: visão do sistema solar
  - Ao clicar em um planeta: a câmera segue esse planeta de forma suave

### Menu Lateral (Drawer)
- Botão flutuante para abrir/fechar o menu lateral
- Ajustes disponíveis:
  - **Velocidade orbital** dos planetas (slider)
  - **Mostrar ou esconder órbitas**
  - **Iniciar o jogo dos asteroides**

## 🕹️ Jogo dos Asteroides
- Jogo 3D integrado, iniciado via menu lateral
- Nave controlada com teclas **W, A, S, D**
- Moedas amarelas (**coletáveis**) e asteroides vermelhos (**indestrutíveis**) aparecem no espaço
- Regras do jogo:
  - +10 pontos ao coletar moeda
  - +1 ponto a cada segundo sobrevivido
  - A cada 25 pontos:
    - Aumenta a velocidade dos obstáculos
    - Mais asteroides são gerados
  - O jogador possui **3 vidas**
  - Após colisão, há um período de **invulnerabilidade com efeito de piscar**
- Menu do jogo:
  - Início
  - Quit
  - **Ranking de High Scores (localStorage)**
  - Botão para resetar pontuação

## 🧪 Técnicas Utilizadas
- `Three.js` para renderização 3D
- `WebGLRenderer` com `OrbitControls`
- Raycasting para interação com planetas
- Animação contínua (`requestAnimationFrame`)
- Responsividade via `window.resize`
- Controle de estado para pausa, jogo ativo e menus

## 📁 Organização dos Arquivos
- `Project.html`: entrada principal
- `solarSystem.js`: lógica do sistema solar
- `DrawerMenu.js`: menu lateral com controles e botão do jogo
- `asteroidGame.js`: lógica do jogo de asteroides
- `Project.css`: estilo visual da interface

---

# Links
Planet images:
https://www.fab.com/listings/f6df77fc-df73-4d6e-aab1-e0ccc2261a59

Desenvolvido por António Moreira - 93279