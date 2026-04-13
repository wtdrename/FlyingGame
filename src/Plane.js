import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        this.speed = 0;
        this.velocityY = 0;
        this.gravity = 0.005;
        this.maxSpeed = 2.0;
        
        this.pitch = 0;
        this.roll = 0;

        this._createMesh();
        this.mesh.position.set(0, 0.6, 100); 
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
        if (keys['w'] || keys['W']) this.speed += 0.01;
        else if (keys['s'] || keys['S']) this.speed -= 0.02;
        else this.speed *= 0.995;

        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

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

        const liftFactor = 0.004;
        const lift = (this.speed * this.speed) * liftFactor;
        
        this.velocityY += (this.pitch * lift);
        this.velocityY -= this.gravity;

        this.mesh.position.y += this.velocityY;
        this.mesh.translateZ(this.speed);

        if (this.propeller) {
            this.propeller.rotation.z += (this.speed + 0.1) * 0.8;
        }

        const groundLevel = 0.6;
        if (this.mesh.position.y <= groundLevel) {
            this._checkLandingStatus();
        }
    }

    _checkLandingStatus() {
        const isHardImpact = this.velocityY < -0.12;
        const isBadAngle = Math.abs(this.roll) > 0.4;

        if (isHardImpact || isBadAngle) {
            console.warn("💥 CRASH!");
            this._resetPlane();
        } else {
            this.mesh.position.y = 0.6;
            this.velocityY = 0;
            this.pitch *= 0.9; 
            this.roll *= 0.9;
            this.speed *= 0.98;
        }
    }

    _resetPlane() {
        this.speed = 0;
        this.velocityY = 0;
        this.pitch = 0;
        this.roll = 0;
        this.mesh.position.set(0, 0.6, 100);
        this.mesh.rotation.set(0, 0, 0);
    }
}
