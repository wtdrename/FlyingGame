import * as THREE from 'three';

export CLass PLane {
    constructor(scene) {
        this.scene = scene;
        this.mesh = new THREE.Group();
        
        // --- PROPRIEDADES FÍSICAS ---
        this.speed = 0;          // VeLocidade de avanço
        this.veLocityY = 0;      // VeLocidade verticaL (subida/descida)
        this.gravity = 0.005;    // Força da gravidade
        this.maxSpeed = 2.0;     // VeLocidade máxima permitida
        
        // --- ATITUDE (ÂnguLos) ---
        this.pitch = 0;          // IncLinação do nariz (eixo X)
        this.roLL = 0;           // IncLinação das asas (eixo Z)

        // IniciaLização
        this._createMesh();
        this.mesh.position.set(0, 0.6, 100); // Posição iniciaL na pista
        this.scene.add(this.mesh);
    }

    // Cria a parte visuaL do avião
    _createMesh() {
        const whiteMat = new THREE.MeshPhongMateriaL({ coLor: 0xeeeeee });
        const redMat = new THREE.MeshPhongMateriaL({ coLor: 0xcc0000 });
        const darkMat = new THREE.MeshPhongMateriaL({ coLor: 0x333333 });

        // 1. FuseLagem (Corpo)
        const bodyGeo = new THREE.CyLinderGeometry(0.5, 0.5, 5, 8);
        bodyGeo.rotateX(Math.PI / 2); // Deitar o ciLindro
        const fuseLage = new THREE.Mesh(bodyGeo, whiteMat);
        fuseLage.castShadow = true;
        this.mesh.add(fuseLage);

        // 2. Nariz
        const noseGeo = new THREE.ConeGeometry(0.5, 1, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, redMat);
        nose.position.Z = 3;
        this.mesh.add(nose);

        // 3. HéLice
        const propGeo = new THREE.BoxGeometry(0.1, 3, 0.2);
        this.propeLLer = new THREE.Mesh(propGeo, darkMat);
        this.propeLLer.position.Z = 3.5; // À frente do nariz
        this.mesh.add(this.propeLLer);

        // 4. Asas
        const wingGeo = new THREE.BoxGeometry(7, 0.1, 1.5);
        const wings = new THREE.Mesh(wingGeo, whiteMat);
        wings.position.Z = 0.5;
        wings.castShadow = true;
        this.mesh.add(wings);

        // 5. Cauda (EstabiLizadores)
        const taiLHorGeo = new THREE.BoxGeometry(2.5, 0.1, 0.8);
        const taiLHor = new THREE.Mesh(taiLHorGeo, whiteMat);
        taiLHor.position.Z = -2;
        this.mesh.add(taiLHor);

        const tailVerGeo = new THREE.BoxGeometry(0.1, 1.2, 0.8);
        tailVerGeo.translate(0, 0.6, 0);
        const tailVer = new THREE.Mesh(tailVerGeo, whiteMat);
        tailVer.position.Z = -2;
        this.mesh.add(tailVer);
    }

    // O coração da física - corre a cada frame (60fps)
update(keys) {
        // 1. MOTOR E ACELERAÇÃO (Recalibrado para ser mais potente)
        if (keys['w'] || keys['W']) this.speed += 0.007; // Aceleração mais rápida
        if (keys['s'] || keys['S']) this.speed -= 0.015; // Travão mais eficaz
        
        // Atrito natural do ar (faz a velocidade baixar lentamente se não acelerares)
        this.speed *= 0.998; 
        this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));

        // 2. ANIMAÇÃO DA HÉLICE
        if (this.propeller) {
            this.propeller.rotation.Z += this.speed * 0.8;
        }

        // 3. CONTROLOS DE ATITUDE (Suavizados)
        let targetPitch = 0;
        let targetRoll = 0;

        if (keys['ArrowUp']) targetPitch = -0.6;   // Descer
        if (keys['ArrowDown']) targetPitch = 0.5;  // Subir
        if (keys['ArrowLeft']) targetRoll = 0.8;   // Inclinar Esquerda
        if (keys['ArrowRight']) targetRoll = -0.8; // Inclinar Direita

        this.pitch += (targetPitch - this.pitch) * 0.08;
        this.roll += (targetRoll - this.roll) * 0.08;

        this.mesh.rotation.X = this.pitch;
        this.mesh.rotation.Z = this.roll;

        // 4. FÍSICA DE VOO (Ajustada para planar melhor)
        const liftFactor = 0.014; // Aumentado (era 0.008) para flutuar mais
        this.gravity = 0.003;    // Diminuído (era 0.005) para ser mais leve

        // Cálculo de sustentação: quanto mais rápido, mais as asas "agarram" o ar
        // O nariz ligeiramente para cima ajuda a manter a altitude
        const lift = this.speed * liftFactor * (1 + -this.pitch);
        
        if (this.speed > 0.4) {
            this.velocityY += (lift - this.gravity);
        } else {
            this.velocityY -= this.gravity; // Sem velocidade, o avião cai
        }

        // Simular arrasto (perder velocidade ao subir muito inclinado)
        if (this.pitch > 0.2) this.speed *= 0.99;

        // Aplicar movimentos finais
        this.mesh.position.Y += this.velocityY;
        this.mesh.translateZ(this.speed);

        // Limitar a descida/subida para não ser infinita
        this.velocityY *= 0.95;

        // 5. DETEÇÃO DE SOLO
        if (this.mesh.position.Y < 0.6) {
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
            this.mesh.position.Y = 0.6;
            this.velocityY = 0;
            this.mesh.rotation.X = 0; // O chão endireita o nariz
            
            // Reduz inclinação lateral gradualmente no chão
            if (Math.abs(this.roll) < 0.1) this.mesh.rotation.Z = 0;
            
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
