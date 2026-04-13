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
        
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        
        const d = 100;
        this.sunLight.shadow.camera.left = -d;
        this.sunLight.shadow.camera.right = d;
        this.sunLight.shadow.camera.top = d;
        this.sunLight.shadow.camera.bottom = -d;
        
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
        runway.receiveShadow = true;
        this.scene.add(runway);

        for(let i = 0; i < 20; i++) {
            const lineGeo = new THREE.PlaneGeometry(1, 40);
            const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const line = new THREE.Mesh(lineGeo, lineMat);
            line.rotation.x = -Math.PI / 2;
            line.position.set(0, 0.12, -(i * 100));
            this.scene.add(line);
        }
    }

    _createForest() {
        const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4, 6);
        const trunkMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const leavesGeo = new THREE.ConeGeometry(3, 10, 8);
        const leavesMat = new THREE.MeshPhongMaterial({ color: 0x117711 });

        const instancedTrunks = new THREE.InstancedMesh(trunkGeo, trunkMat, this.numTrees);
        const instancedLeaves = new THREE.InstancedMesh(leavesGeo, leavesMat, this.numTrees);
        
        instancedTrunks.castShadow = true;
        instancedLeaves.castShadow = true;

        const dummy = new THREE.Object3D();
        const range = 2000;

        for (let i = 0; i < this.numTrees; i++) {
            let x, z;
            // Loop para evitar árvores na pista
            do {
                x = (Math.random() - 0.5) * range;
                z = (Math.random() - 0.5) * range;
            } while (Math.abs(x) < 40 && z < 200 && z > -1500);

            const scaleY = 0.8 + Math.random() * 0.4;

            // Posicionar Tronco
            dummy.position.set(x, 2 * scaleY, z);
            dummy.scale.set(1, scaleY, 1);
            dummy.updateMatrix();
            instancedTrunks.setMatrixAt(i, dummy.matrix);

            // Posicionar Folhas
            dummy.position.set(x, (4 * scaleY) + 2, z);
            dummy.scale.set(1, 1, 1); 
            dummy.updateMatrix();
            instancedLeaves.setMatrixAt(i, dummy.matrix);
        }

        this.scene.add(instancedTrunks);
        this.scene.add(instancedLeaves);
    }
} // <--- ESTA CHAVE FECHA A CLASSE (Crítico!)
