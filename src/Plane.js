import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        // Propriedades de voo
        this.speed = 0;
        this.maxSpeed = 2.0;
        this.velocityY = 0;      // Nova: Velocidade vertical
        this.gravity = 0.01;      // Nova: Força da gravidade
        this.pitch = 0;
        this.roll = 0;
        
        this._createMesh();
        this.mesh.position.set(0, 0.6, 0); 
        this.scene.add(this.mesh);
    }

    _createMesh() {
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, flatShading: true });
        const redMat = new THREE.MeshPhongMaterial({ color: 0xcc0000, flatShading: true });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
        this.mesh.add(fuselage);

        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        nose.position.z = 3; 
        this.mesh.add(nose);

        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeller = new THREE.Mesh(propGeo, darkMat);
        this.propeller.position.z = 3.5; 
        this.mesh.add(this.propeller);

        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        wings.position.z = 0.5;
        wings.castShadow = true;
        this.mesh.add(wings);

        const tailHor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.8), whiteMat);
        tailHor.position.z = -2;
        this.mesh.add(tailHor);

        const tailVer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), whiteMat);
        tailVer.geometry.translate(0, 0.6, 0);
        tailVer.position.z = -2;
        this.mesh.add(tailVer);
    }
update(keys) {
    // 1. MOTOR (Mantém a velocidade a menos que trave)
    if (keys['w'] || keys['W']) this.speed += 0.01;
    else if (keys['s'] || keys['S']) this.speed -= 0.02;
    
    this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

    // 2. ATITUDE (Pitch e Roll)
    let targetPitch = 0;
    let targetRoll = 0;
    if (keys['ArrowUp']) targetPitch = -0.5;
    if (keys['ArrowDown']) targetPitch = 0.5;
    if (keys['ArrowLeft']) targetRoll = 0.7;
    if (keys['ArrowRight']) targetRoll = -0.7;

    this.pitch += (targetPitch - this.pitch) * 0.1;
    this.roll += (targetRoll - this.roll) * 0.1;

    this.mesh.rotation.x = this.pitch;
    this.mesh.rotation.z = this.roll;
    this.mesh.rotation.y -= this.roll * 0.02;

    // 3. FÍSICA DE VOO E QUEDA LIVRE (O MOTOR DA QUEDA)
    
    // Constantes físicas
    const gravity = 0.02;          // Força da gravidade (puxa sempre para baixo)
    const stallSpeed = 0.5;        // Velocidade abaixo da qual o avião cai (Estol)
    
    // Cálculo de Sustentação (Lift)
    // Se speed for 0, o lift é 0. Se speed for > 1.0, o lift vence a gravidade.
    let lift = this.speed * 0.02; 

    // Se o avião estiver muito inclinado para cima, ele perde velocidade mais rápido (arrasto induzido)
    if (this.pitch > 0.2) this.speed -= 0.002;

    // Se a velocidade for menor que a de estol, o controle de Pitch (subida) falha
    let effectivePitch = this.pitch;
    if (this.speed < stallSpeed) {
        effectivePitch = -0.2; // O nariz "pesa" e cai sozinho se não houver velocidade
        lift *= 0.5;           // Perde metade da sustentação imediatamente
    }

    // Aplicação da Velocidade Vertical (Y)
    // A subida depende de: (Inclinação do Nariz * Velocidade) + (Sustentação - Gravidade)
    this.velocityY += (effectivePitch * this.speed * 0.04) + (lift - gravity);

    // Atrito do ar vertical (impede que ele caia a velocidades infinitas)
    this.velocityY *= 0.96;

    // 4. APLICAR MOVIMENTO NO MUNDO
    this.mesh.position.y += this.velocityY;
    this.mesh.translateZ(this.speed);

    // 5. ANIMAÇÃO DA HÉLICE
    if (this.propeller) {
        this.propeller.rotation.z += (this.speed + 0.1) * 0.8;
    }

    // 6. COLISÃO COM O SOLO
    const ground = 0.6;
    if (this.mesh.position.y < ground) {
        // Se a queda vertical for forte (velocityY negativa), explode
        if (this.velocityY < -0.05) {
            this._handleGroundCollision();
        } else {
            // Pouso ou taxi
            this.mesh.position.y = ground;
            this.velocityY = 0;
            this.pitch *= 0.8;
            this.roll *= 0.8;
        }
    }
}
    _handleGroundCollision() {
        console.warn("💥 CRASH!");
        this._resetPlane();
    }

    _resetPlane() {
        this.mesh.position.set(0, 0.6, 0);
        this.mesh.rotation.set(0, 0, 0);
        this.speed = 0;
        this.velocityY = 0;
        this.pitch = 0;
        this.roll = 0;
    }
}
