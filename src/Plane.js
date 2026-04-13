import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
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
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee });
        const redMat = new THREE.MeshPhongMaterial({ color: 0xcc0000 });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
        this.mesh.add(fuselage);
        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        nose.position.Z = 3;
        this.mesh.add(nose);
        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeller = new THREE.Mesh(propGeo, darkMat);
        this.propeller.position.Z = 3.5;
        this.mesh.add(this.propeller);
        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        wings.position.Z = 0.5;
        wings.castShadow = true;
        this.mesh.add(wings);
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
        // 1. MOTOR ARCADE (Mais suave)
        if (keys['w'] || keys['W']) {
            this.speed += 0.02; // Aceleração menos bruta
        } else if (keys['s'] || keys['S']) {
            this.speed -= 0.04; // Travão continua forte
        } else {
            // Atrito natural para não disparar sozinho
            this.speed *= 0.99; 
        }
        
        // Velocidade mínima para manobrar e máxima para não perder o controlo
        this.speed = Math.max(0, Math.min(this.speed, 2.0)); 

        // 2. HÉLICE
        if (this.propeller) this.propeller.rotation.Z += this.speed * 1.5;

        // 3. CONTROLOS DIRETOS (Sobe/Desce mais fácil)
        let targetPitch = 0;
        let targetRoll = 0;

        // Sensibilidade de subida: agora depende menos da velocidade
        // para conseguires levantar voo logo ao início
        const climbSpeed = 0.25; 

        if (keys['ArrowUp']) {
            targetPitch = -0.6;
            this.mesh.position.Y -= climbSpeed; // Desce
        }
        if (keys['ArrowDown']) {
            targetPitch = 0.5;
            this.mesh.position.Y += climbSpeed; // Sobe
        }

        if (keys['ArrowLeft']) targetRoll = 0.8;
        if (keys['ArrowRight']) targetRoll = -0.8;

        // Suavização da inclinação
        this.pitch += (targetPitch - this.pitch) * 0.1;
        this.roll += (targetRoll - this.roll) * 0.1;

        this.mesh.rotation.X = this.pitch;
        this.mesh.rotation.Z = this.roll;

        // 4. MOVIMENTO PARA A FRENTE
        this.mesh.translateZ(this.speed);

        // 5. COLISÃO SOLO
        if (this.mesh.position.Y < 0.6) {
            this.mesh.position.Y = 0.6;
            // Se bater de bico com velocidade, faz reset
            if (this.speed > 1.2 && this.pitch > 0.3) {
                this._handleGroundCollision();
            } else {
                this.speed *= 0.96; // Atrito da pista
            }
        }
    }

    _handleGroundCollision() {
        setTimeout(() => { alert("💥 CRASH!"); }, 10);
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
