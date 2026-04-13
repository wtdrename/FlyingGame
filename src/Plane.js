import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        // Propriedades de voo
        this.speed = 0;
        this.maxSpeed = 2.0;
        this.pitch = 0;
        this.roll = 0;
        
        this._createMesh();
        
        // Posição inicial: x, y, z
        this.mesh.position.set(0, 0.6, 0); 
        this.scene.add(this.mesh);
    }

    _createMesh() {
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, flatShading: true });
        const redMat = new THREE.MeshPhongMaterial({ color: 0xcc0000, flatShading: true });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        
        // Fuselagem
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
        fuselage.receiveShadow = true;
        this.mesh.add(fuselage);

        // Nariz
        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        nose.position.z = 3; 
        this.mesh.add(nose);

        // Hélice
        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeller = new THREE.Mesh(propGeo, darkMat);
        this.propeller.position.z = 3.5; 
        this.mesh.add(this.propeller);

        // Asas
        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        wings.position.z = 0.5;
        wings.castShadow = true;
        this.mesh.add(wings);

        // Cauda
        const tailHor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.8), whiteMat);
        tailHor.position.z = -2;
        this.mesh.add(tailHor);

        const tailVer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), whiteMat);
        tailVer.geometry.translate(0, 0.6, 0);
        tailVer.position.z = -2;
        this.mesh.add(tailVer);
    }

    update(keys) {
        // 1. ACELERAÇÃO
        if (keys['w'] || keys['W']) {
            this.speed += 0.01;
        } else if (keys['s'] || keys['S']) {
            this.speed -= 0.02;
        } else {
            this.speed *= 0.99; // Atrito do ar
        }
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // 2. CONTROLOS DE ATITUDE (Simulador Real)
        let targetPitch = 0;
        let targetRoll = 0;

        if (keys['ArrowUp']) targetPitch = -0.5;    // Nariz para baixo
        if (keys['ArrowDown']) targetPitch = 0.5;   // Nariz para cima
        if (keys['ArrowLeft']) targetRoll = 0.7;    // Inclinar esquerda
        if (keys['ArrowRight']) targetRoll = -0.7;  // Inclinar direita

        // Suavização dos movimentos (Lerp)
        this.pitch += (targetPitch - this.pitch) * 0.1;
        this.roll += (targetRoll - this.roll) * 0.1;

        // Aplicar rotações ao mesh
        this.mesh.rotation.x = this.pitch;
        this.mesh.rotation.z = this.roll;
        
        // Yaw (Giro horizontal) baseado na inclinação das asas
        this.mesh.rotation.y -= this.roll * 0.02;

        // 3. MOVIMENTO VERTICAL (Subir/Descer)
        // O avião sobe se tiver velocidade e inclinação positiva
        if (this.speed > 0.5) {
            this.mesh.position.y += this.pitch * this.speed * 0.1;
        }

        // 4. MOVIMENTO PARA FRENTE
        this.mesh.translateZ(this.speed);

        // 5. ANIMAÇÃO DA HÉLICE
        if (this.propeller) {
            this.propeller.rotation.z += (this.speed + 0.2) * 0.8;
        }

        // 6. COLISÃO SOLO
        const minHeight = 0.6;
        if (this.mesh.position.y < minHeight) {
            if (this.speed > 1.2 || Math.abs(this.pitch) > 0.2) {
                this._handleGroundCollision();
            } else {
                this.mesh.position.y = minHeight;
                this.pitch *= 0.5; // O chão estabiliza o nariz
                this.roll *= 0.5;  // O chão estabiliza as asas
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
        this.pitch = 0;
        this.roll = 0;
    }
}
