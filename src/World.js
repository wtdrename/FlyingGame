import * as THREE from 'three';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.numTrees = 2000;
        this._setupLights();
        this._createGround();
        this._createRunway();
        this._createForest();
    }

    _setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.position.set(50, 100, 50);
        this.sunLight.castShadow = true;
        this.scene.add(this.sunLight);
    }

    _createGround() {
        const groundGeo = new THREE.PlaneGeometry(10000, 10000);
        const groundMat = new THREE.MeshPhongMaterial({ color: 0x44aa44 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    _createRunway() {
        const runwayGeo = new THREE.PlaneGeometry(30, 2000);
        const runwayMat = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const runway = new THREE.Mesh(runwayGeo, runwayMat);
        runway.rotation.x = -Math.PI / 2;
        runway.position.y = 0.1;
        runway.position.z = -500;
        this.scene.add(runway);
    }

    _createForest() {
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 6);
        const trunkMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const leavesGeo = new THREE.ConeGeometry(3, 10, 8);
        const leavesMat = new THREE.MeshPhongMaterial({ color: 0x117711 });

        const instancedTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, this.numTrees);
        const instancedLeaves = new THREE.InstancedMesh(leavesGeo, leavesMat, this.numTrees);

        const dummy = new THREE.Object3D();
        for (let i = 0; i < this.numTrees; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            
            if (Math.abs(x) < 40) continue; // Pula se estiver na pista

            dummy.position.set(x, 2, z);
            dummy.updateMatrix();
            instancedTrunks.setMatrixAt(i, dummy.matrix);

            dummy.position.set(x, 8, z);
            dummy.updateMatrix();
            instancedLeaves.setMatrixAt(i, dummy.matrix);
        }
        this.scene.add(instancedTrunks);
        this.scene.add(instancedLeaves);
    }
}
