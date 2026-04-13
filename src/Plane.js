import * as THREE from 'three';

export class Plane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        // Propriedades de voo
        this.speed = 0;
        this.maxSpeed = 1.5;      // Ajustado para melhor controlo
        this.velocityY = 0;       
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
        
        // Fuselagem
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2);
        const fuselage = new THREE.Mesh(bodyGeo, whiteMat);
        fuselage.castShadow = true;
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

        // Cauda Horizontal
        const tailHor = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.1, 0.8), whiteMat);
        tailHor.position.z = -2;
        this.mesh.add(tailHor);

        // Cauda Vertical
        const tailVer = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.8), whiteMat);
        tailVer.geometry.translate(0, 0.6, 0);
        tailVer.position.z = -2;
        this.mesh.add(tailVer);
    }

    update(keys) {
        // 1. MOTOR (Aceleração e Travagem)
        if (keys['w'] || keys['W']) this.speed += 0.005;
        else if (keys['s'] || keys['S']) this.speed -= 0.01;
        
        // Atrito natural (o avião abranda sozinho sem motor)
        this.speed *= 0.995;
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // 2. ATITUDE (Pitch e Roll)
        let targetPitch = 0;
        let targetRoll = 0;

        // Comandos (Invertidos como num avião real: Seta para cima = Descer)
        if (keys['ArrowUp']) targetPitch = 0.4;
        if (keys['ArrowDown']) targetPitch = -0.4;
        if (keys['ArrowLeft']) targetRoll = 0.6;
        if (keys['ArrowRight']) targetRoll = -0.6;

        // Interpolação suave para os controlos
        this.pitch += (targetPitch - this.pitch) * 0.1;
        this.roll += (targetRoll - this.roll) * 0.1;

        this.mesh.rotation.x = this.pitch;
        this.mesh.rotation.z = this.roll;
        
        // Curvatura baseada no Roll (Yawn)
        this.mesh.rotation.y -= this.roll * (this.speed * 0.05);

        // 3. FÍSICA DE VOO REVISADA
        const gravity = 0.015;      
        const stallSpeed = 0.4;    // Velocidade mínima para manter voo nivelado
        
        // Cálculo de Lift (Sustentação)
        // Quanto mais rápido, mais lift. Se speed < 0.4, o lift será menor que a gravidade.
        let lift = this.speed * 0.035; 

        // Lógica de ESTOL (Stall)
        if (this.speed < stallSpeed) {
            // Se estiver muito lento, o nariz cai e a sustentação desaparece
            this.pitch += (0.4 - this.pitch) * 0.05; 
            lift *= 0.5;
        }

        // Subida/Descida baseada na inclinação do nariz e velocidade
        // Se o nariz está para cima (pitch negativo no THREE), o avião sobe
        let climbSink = -this.pitch * this.speed * 0.1;

        // Aplicação da Velocidade Vertical
        this.velocityY += (lift - gravity) + climbSink;

        // Arrastar vertical (Air Resistance)
        this.velocityY *= 0.95;

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
            // Se a queda for rápida, crasha
            if (this.velocityY < -0.04) {
                this._handleGroundCollision();
            } else {
                // Pouso suave ou taxiing
                this.mesh.position.y = ground;
                this.velocityY = 0;
                this.pitch *= 0.9; // O chão nivela o avião
            }
        }
    }

    _handleGroundCollision() {
        console.warn("💥 CRASH! Velocidade de queda muito alta.");
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
