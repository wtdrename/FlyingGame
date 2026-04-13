import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        // --- PROPRIEDADES FÍSICAS ---
        this.speed = 0;          // Velocidade de avanço
        this.velocityY = 0;      // Velocidade vertical (subida/descida)
        this.gravity = 0.005;    // Força da gravidade
        this.maxSpeed = 2.0;     // Velocidade máxima permitida
        
        // --- ATITUDE (Ângulos) ---
        this.pitch = 0;          // Inclinação do nariz (eixo X)
        this.roll = 0;           // Inclinação das asas (eixo Z)

        // Inicialização
        this._createMesh();
        this.mesh.position.set(0, 0.6, 100); // Posição inicial na pista
        this.scene.add(this.mesh);
    }

    // Cria a parte visual do avião
    _createMesh() {
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
        const redMat = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333 });

        // 1. Fuselagem (Corpo)
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2); // Deitar o cilindro
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
        this.mesh.add(fuselage);

        // 2. Nariz
        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        nose.position.z = 3;
        this.mesh.add(nose);

        // 3. Hélice
        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeller = new THREE.Mesh(propGeo, darkMat);
        this.propeller.position.z = 3.5; // À frente do nariz
        this.mesh.add(this.propeller);

        // 4. Asas
        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        wings.position.z = 0.5;
        wings.castShadow = true;
        this.mesh.add(wings);

        // 5. Cauda (Estabilizadores)
        const tailHorGeo = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const tailHor = new THREE.Mesh(tailHorGeo, whiteMat);
        tailHor.position.z = -2;
        this.mesh.add(tailHor);

        const tailVerGeo = new THREE.BoxGeometry(0.1, 1.2, 0.8);
        tailVerGeo.translate(0, 0.6, 0);
        const tailVer = new THREE.Mesh(tailVerGeo, whiteMat);
        tailVer.position.z = -2;
        this.mesh.add(tailVer);
    }

    // O coração da física - corre a cada frame (60fps)
    update(keys) {
        // 1. MOTOR E ACELERAÇÃO
        if (keys['w'] || keys['W']) this.speed += 0.005;
        if (keys['s'] || keys['S']) this.speed -= 0.01;
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // 2. ANIMAÇÃO DA HÉLICE
        if (this.propeller) {
            this.propeller.rotation.z += this.speed * 0.8;
        }

        // 3. CONTROLOS DE ATITUDE (PITCH E ROLL)
        let targetPitch = 0;
        let targetRoll = 0;

        if (keys['ArrowUp']) targetPitch = -0.6;   // Empurrar manche (desce)
        if (keys['ArrowDown']) targetPitch = 0.5;  // Puxar manche (sobe)
        if (keys['ArrowLeft']) targetRoll = 0.8;   // Inclinar para a esquerda
        if (keys['ArrowRight']) targetRoll = -0.8; // Inclinar para a direita

        // Suavização (Interpolação Linear) para dar peso ao avião
        this.pitch += (targetPitch - this.pitch) * 0.1;
        this.roll += (targetRoll - this.roll) * 0.1;

        this.mesh.rotation.x = this.pitch;
        this.mesh.rotation.z = this.roll;

        // 4. CÁLCULO DE SUSTENTAÇÃO (LIFT) E GRAVIDADE
        const liftFactor = 0.008;
        // O avião só sobe se tiver velocidade e o nariz estiver para cima
        const isGainingLift = this.speed > 0.6 && this.pitch > 0.1;
        
        if (isGainingLift) {
            this.velocityY += (this.pitch * this.speed * liftFactor);
        }

        this.velocityY -= this.gravity; // A gravidade puxa sempre para baixo
        
        // Aplicar movimentos
        this.mesh.position.y += this.velocityY;
        this.mesh.translateZ(this.speed);

        // 5. DETEÇÃO DE SOLO
        if (this.mesh.position.y < 0.6) {
            this._handleGroundCollision();
        }
    }

    _handleGroundCollision() {
        // Verifica se o impacto foi demasiado violento
        // Se a velocidade vertical for alta ou o avião estiver muito inclinado lateralmente
        if (this.velocityY < -0.15 || Math.abs(this.roll) > 0.3) {
            alert("💥 CRASH! Perdeste o controlo no impacto.");
            this._resetPlane();
        } else {
            // Aterragem suave ou deslocação na pista (Taxiing)
            this.mesh.position.y = 0.6;
            this.velocityY = 0;
            this.mesh.rotation.x = 0; // O chão endireita o nariz
            
            // Reduz inclinação lateral gradualmente no chão
            if (Math.abs(this.roll) < 0.1) this.mesh.rotation.z = 0;
            
            // Atrito do solo (faz o avião parar se não acelerares)
            this.speed *= 0.99;
        }
    }

    _resetPlane() {
        this.speed = 0;
        this.velocityY = 0;
        this.mesh.position.set(0, 0.6, 100);
        this.mesh.rotation.set(0, 0, 0);
        this.pitch = 0;
        this.roll = 0;
    }
}