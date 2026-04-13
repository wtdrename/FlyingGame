import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        // --- PROPRIEDADES ---
        this.speed = 0;
        this.velocityY = 0;
        this.maxSpeed = 3.0;
        this.pitch = 0;
        this.roll = 0;

        this._createMesh();
        this.mesh.position.set(0, 0.6, 100);
        this.scene.add(this.mesh);
    }

    _createMesh() {
        // Cores e Materiais (Nomes corrigidos para o padrão Three.js)
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
        const redMat = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333 });

        // 1. Fuselagem (Cilindro deitado)
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
        this.mesh.add(fuselage);

        // 2. Nariz (Cone)
        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        nose.position.Z = 3;
        this.mesh.add(nose);

        // 3. Hélice (Referência correta: this.propeller)
        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeller = new THREE.Mesh(propGeo, darkMat);
        this.propeller.position.Z = 3.5;
        this.mesh.add(this.propeller);

        // 4. Asas
        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        wings.position.Z = 0.5;
        wings.castShadow = true;
        this.mesh.add(wings);

        // 5. Cauda
        const tailHorGeo = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const tailHor = new THREE.Mesh(tailHorGeo, whiteMat);
        tailHor.position.Z = -2;
        this.mesh.add(tailHor);

        const tailVerGeo = new THREE.BoxGeometry(0.1, 1.2, 0.8);
        tailVerGeo.translate(0, 0.6, 0);
        const tailVer = new THREE.Mesh(tailVerGeo, whiteMat);
        tailVer.position.Z = -2;
        this.mesh.add(tailVer);
    }

    update(keys) {
        // 1. MOTOR ARCADE
        if (keys['w'] || keys['W']) {
            this.speed += 0.05;
        } else if (keys['s'] || keys['S']) {
            this.speed -= 0.05;
        } else {
            this.speed *= 0.995; 
        }
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // 2. ANIMAÇÃO HÉLICE (Sempre baseada na velocidade)
        if (this.propeller) {
            this.propeller.rotation.Z += this.speed * 1.5;
        }

        // 3. CONTROLOS DIRETOS (MODO ARCADE)
        let targetPitch = 0;
        let targetRoll = 0;

        if (keys['ArrowUp']) {
            targetPitch = -0.6;
            this.mesh.position.Y -= this.speed * 0.4; // Desce direto com a tecla
        }
        if (keys['ArrowDown']) {
            targetPitch = 0.5;
            this.mesh.position.Y += this.speed * 0.4; // Sobe direto com a tecla
        }

        if (keys['ArrowLeft']) targetRoll = 0.8;
        if (keys['ArrowRight']) targetRoll = -0.8;

        // Suavização visual da inclinação
        this.pitch += (targetPitch - this.pitch) * 0.15;
        this.roll += (targetRoll - this.roll) * 0.15;

        this.mesh.rotation.X = this.pitch;
        this.mesh.rotation.Z = this.roll;

        // 4. MOVIMENTO PARA A FRENTE
        this.mesh.translateZ(this.speed);

        // 5. COLISÃO SOLO ARCADE
        if (this.mesh.position.Y < 0.6) {
            // Se estiver a picar o nariz com muita velocidade: CRASH
            if (this.speed > 1.5 && this.pitch > 0.3) {
                this._handleGroundCollision();
            } else {
                // Senão: Apenas desliza na pista
                this.mesh.position.Y = 0.6;
                this.speed *= 0.98; // Atrito da pista
            }
        }
    }

    _handleGroundCollision() {
        // Usamos o timeout para o alert não "congelar" o browser bruscamente
        setTimeout(() => {
            alert("💥 CRASH! Tentaste mergulhar no chão?");
        }, 10);
        this._resetPlane();
    }

    _resetPlane() {
        this.mesh.position.set(0, 0.6, 100);
        this.mesh.rotation.set(0, 0, 0);
        this.speed = 0;
        this.velocityY = 0;
        this.pitch = 0;
        this.roll = 0;
    }
}
