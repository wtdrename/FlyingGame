import * as THREE from 'three';
import { World } from './World.js';
import { Plane } from './Plane.js';

// --- CONFIGURAÇÃO DA CENA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 200, 1500);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- INICIALIZAÇÃO DE MÓDULOS ---
const world = new World(scene);
const plane = new Plane(scene);

// Captura de Teclado
const keys = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// UI Elements
const uiSpeed = document.getElementById('speed');
const uiAlt = document.getElementById('alt');

// --- LOOP PRINCIPAL ---
function animate() {
    requestAnimationFrame(animate);

    // 1. Atualizar lógica do avião (Física e Controlos)
    plane.update(keys);

    // 2. Fazer a câmara seguir o avião com suavização
    updateCamera();

    // 3. Atualizar UI (apenas se os elementos existirem no DOM)
    if (uiSpeed) uiSpeed.innerText = Math.round(plane.speed * 150);
    if (uiAlt) uiAlt.innerText = Math.max(0, Math.round(plane.mesh.position.y));

    // 4. Renderizar a cena
    renderer.render(scene, camera);
}

function updateCamera() {
    const relativeCameraOffset = new THREE.Vector3(0, 5, -15);
    
    // Aplica a rotação e posição do avião ao offset da câmera
    const cameraOffset = relativeCameraOffset.applyMatrix4(plane.mesh.matrixWorld);
    
    camera.position.lerp(cameraOffset, 0.1); // 0.1 para uma câmera mais "suave" e cinematográfica
    camera.lookAt(plane.mesh.position);
}

// Redimensionamento da janela para manter a proporção
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Descolar!
animate();
