import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        this.speed = 0;
        this.maxSpeed = 3.0;
        this.pitch = 0;
        this.roll = 0;
        
        this._createMesh();
        this.mesh.position.set(0, 0.6, 100);
        this.scene.add(this.mesh);
    }

    _createMesh() {
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
        const redMat = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        // Fuselagem
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
        this.mesh.add(fuselage);

        // Nariz
        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        nose.position.Z = 3; // Corrigido: z minúsculo
        this.mesh.add(nose);

        // Hélice
        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeller = new THREE.Mesh(propGeo, darkMat);
        this.propeller.position.Z = 3.5; // Corrigido: z minúsculo
        this.mesh.add(this.propeller);

        // Asas
        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        wings.position.Z = 0.5; // Corrigido: z minúsculo
        wings.castShadow = true;
        this.mesh.add(wings);

        // Cauda Horizontal
        const tailHorGeo = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const tailHor = new THREE.Mesh(tailHorGeo, whiteMat);
        tailHor.position.Z = -2; // Corrigido: z minúsculo
        this.mesh.add(tailHor);

        // Cauda Vertical
        const tailVerGeo = new THREE.BoxGeometry(0.1, 1.2, 0.8);
        tailVerGeo.translate(0, 0.6, 0);
        const tailVer = new THREE.Mesh(tailVerGeo, whiteMat);
        tailVer.position.Z = -2; // Corrigido: z minúsculo
        this.mesh.add(tailVer);
    }

    update(keys) {
    // 1. INPUT DE VELOCIDADE (W / S)
    // Usamos .toLowerCase() para evitar problemas com Caps Lock
    if (keys['w'] || keys['W']) this.speed += 0.03;
    else if (keys['s'] || keys['S']) this.speed -= 0.05;
    else this.speed *= 0.99; // Atrito/Drag

    this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

    // 2. CONTROLOS DE DIREÇÃO (Arrows)
    let targetPitch = 0;
    let targetRoll = 0;

    // Seta para CIMA -> O avião sobe (Pitch Negativo no Three.js inclina o nariz para cima se o modelo estiver correto)
    if (keys['ArrowUp']) {
        targetPitch = -0.5; 
        this.mesh.position.Y += 0.1 * (this.speed + 0.1); // Só sobe se tiver alguma velocidade
    }
    if (keys['ArrowDown']) {
        targetPitch = 0.5;
        this.mesh.position.Y -= 0.1 * (this.speed + 0.1);
    }
    if (keys['ArrowLeft']) targetRoll = 0.6;
    if (keys['ArrowRight']) targetRoll = -0.6;

    // Suavização das rotações
    this.pitch += (targetPitch - this.pitch) * 0.1;
    this.roll += (targetRoll - this.roll) * 0.1;

    // Aplicar rotações (Eixos minúsculos!)
    this.mesh.rotation.X = this.pitch;
    this.mesh.rotation.Z = this.roll;

    // 3. MOVIMENTO PARA A FRENTE
    // IMPORTANTE: Se o avião andar para trás, muda para -this.speed
    this.mesh.translateZ(this.speed); 

    // 4. HÉLICE
    if (this.propeller) this.propeller.rotation.Z += this.speed * 0.8;

    // 5. CHÃO
    if (this.mesh.position.Y < 0.6) {
        this.mesh.position.Y = 0.6;
        if (this.speed > 1.5) this._handleGroundCollision();
    }
}

    _handleGroundCollision() {
        // O alert bloqueia o render loop, idealmente usarias um UI in-game
        console.log("💥 CRASH!");
        this._resetPlane();
    }

    _resetPlane() {
        this.mesh.position.set(0, 0.6, 100);
        this.mesh.rotation.set(0, 0, 0);
        this.speed = 0;
        this.pitch = 0;
        this.roll = 0;
    }
}
