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
        
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
        this.mesh.add(fuselage);

        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        // CORREÇÃO: minúsculo .z
        nose.position.z = 3; 
        this.mesh.add(nose);

        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeller = new THREE.Mesh(propGeo, darkMat);
        // CORREÇÃO: minúsculo .z
        this.propeller.position.z = 3.5; 
        this.mesh.add(this.propeller);

        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        // CORREÇÃO: minúsculo .z
        wings.position.z = 0.5; 
        wings.castShadow = true;
        this.mesh.add(wings);

        const tailHorGeo = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const tailHor = new THREE.Mesh(tailHorGeo, whiteMat);
        // CORREÇÃO: minúsculo .z
        tailHor.position.z = -2; 
        this.mesh.add(tailHor);

        const tailVerGeo = new THREE.BoxGeometry(0.1, 1.2, 0.8);
        tailVerGeo.translate(0, 0.6, 0);
        const tailVer = new THREE.Mesh(tailVerGeo, whiteMat);
        // CORREÇÃO: minúsculo .z
        tailVer.position.z = -2; 
        this.mesh.add(tailVer);
    }

    update(keys) {
        // 1. MOTOR
        if (keys['w'] || keys['W']) this.speed += 0.03;
        else if (keys['s'] || keys['S']) this.speed -= 0.05;
        else this.speed *= 0.99;

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // 2. CONTROLOS
        let targetPitch = 0;
        let targetRoll = 0;

        // CORREÇÃO: minúsculo .y
        if (keys['ArrowUp']) {
            targetPitch = -0.5; 
            this.mesh.position.y += 0.1 * (this.speed + 0.1); 
        }
        if (keys['ArrowDown']) {
            targetPitch = 0.5;
            this.mesh.position.y -= 0.1 * (this.speed + 0.1);
        }
        if (keys['ArrowLeft']) targetRoll = 0.6;
        if (keys['ArrowRight']) targetRoll = -0.6;

        this.pitch += (targetPitch - this.pitch) * 0.1;
        this.roll += (targetRoll - this.roll) * 0.1;

        // CORREÇÃO: minúsculo .x e .z
        this.mesh.rotation.x = this.pitch;
        this.mesh.rotation.z = this.roll;

        // 3. MOVIMENTO
        this.mesh.translateZ(this.speed); 

        // 4. HÉLICE
        // CORREÇÃO: minúsculo .z
        if (this.propeller) this.propeller.rotation.z += this.speed * 0.8;

        // 5. SOLO
        // CORREÇÃO: minúsculo .y
        if (this.mesh.position.y < 0.6) {
            this.mesh.position.y = 0.6;
            if (this.speed > 1.5 && this.pitch > 0.2) this._handleGroundCollision();
        }
    }

    _handleGroundCollision() {
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
