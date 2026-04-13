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
        // Materiais reutilizáveis
        const whiteMat = new THREE.MeshPhongMaterial({ color: 0xeeeeee, flatShading: true });
        const redMat = new THREE.MeshPhongMaterial({ color: 0xcc0000, flatShading: true });
        const darkMat = new THREE.MeshPhongMaterial({ color: 0x333333, flatShading: true });
        
        // Fuselagem (Corpo)
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2); // Alinha o cilindro com o eixo Z
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

        // Estabilizador Horizontal (Cauda)
        const tailHor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.8), whiteMat);
        tailHor.position.z = -2;
        this.mesh.add(tailHor);

        // Estabilizador Vertical (Leme)
        const tailVer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), whiteMat);
        // Movemos a geometria para cima para a base ficar no corpo do avião
        tailVer.geometry.translate(0, 0.6, 0);
        tailVer.position.z = -2;
        this.mesh.add(tailVer);
    }

    /**
     * @param {Object} keys - Objeto contendo o estado do teclado
     * @param {number} delta - Tempo entre frames (opcional, para suavidade)
     */
    update(keys, delta = 0.016) {
        // 1. ACELERAÇÃO (W / S)
        if (keys['w'] || keys['W'] || keys['ArrowUp'] && keys['Shift']) {
            this.speed += 0.05;
        } else if (keys['s'] || keys['S']) {
            this.speed -= 0.05;
        } else {
            // Atrito natural (Glide)
            this.speed *= 0.98;
        }

        // Limita a velocidade entre 0 e o máximo
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // 2. CONTROLES DE DIREÇÃO
        let targetPitch = 0;
        let targetRoll = 0;

        // Subir/Descer (Pitch) - Invertido como em aviões reais: Seta Cima = Nariz para cima
        if (keys['ArrowUp']) {
            targetPitch = 0.4;
            this.mesh.position.y += this.speed * 0.5;
        }
        if (keys['ArrowDown']) {
            targetPitch = -0.4;
            this.mesh.position.y -= this.speed * 0.5;
        }

        // Inclinação Lateral (Roll)
        if (keys['ArrowLeft']) targetRoll = 0.6;
        if (keys['ArrowRight']) targetRoll = -0.6;

        // Interpolação para movimentos suaves (Lerp)
        this.pitch += (targetPitch - this.pitch) * 0.1;
        this.roll += (targetRoll - this.roll) * 0.1;

        this.mesh.rotation.x = this.pitch;
        this.mesh.rotation.z = this.roll;
        
        // Adiciona um pouco de Yaw (rotação no eixo Y) baseado no Roll para fazer a curva
        this.mesh.rotation.y -= this.roll * 0.05;

        // 3. MOVIMENTO PARA FRENTE
        // TranslateZ move o objeto na direção local em que ele está apontando
        this.mesh.translateZ(this.speed);

        // 4. ANIMAÇÃO DA HÉLICE
        if (this.propeller) {
            // A hélice gira proporcional à velocidade + uma rotação mínima
            this.propeller.rotation.z += (this.speed + 0.2) * 0.8;
        }

        // 5. SISTEMA DE COLISÃO COM SOLO
        const minHeight = 0.6;
        if (this.mesh.position.y < minHeight) {
            
            // Se estiver muito rápido ou muito inclinado ao tocar o solo: CRASH
            if (this.speed > 1.2 || Math.abs(this.pitch) > 0.2) {
                this._handleGroundCollision();
            } else {
                // Pouso suave ou taxiando
                this.mesh.position.y = minHeight;
                this.pitch = 0; // Alinha o nariz com o chão
            }
        }
    }

    _handleGroundCollision() {
        console.warn("💥 CRASH! O avião foi destruído.");
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
