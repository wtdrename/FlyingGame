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
        // 1. MOTOR ARCADE (Resposta instantânea)
        if (keys['w'] || keys['W']) {
            this.speed += 0.05; // Acelera muito rápido
        } else if (keys['s'] || keys['S']) {
            this.speed -= 0.05; // Trava muito rápido
        } else {
            // No modo arcade, o avião mantém a velocidade se não travares
            this.speed *= 0.995; 
        }
        
        this.speed = Math.max(0, Math.min(this.speed, 3.0)); // Velocidade máxima aumentada

        // 2. HÉLICE (Sempre a rodar rápido)
        if (this.propeller) this.propeller.rotation.Z += this.speed * 1.5;

        // 3. CONTROLOS DIRETOS (Movem o avião, não apenas a inclinação)
        let targetPitch = 0;
        let targetRoll = 0;

        // Subir/Descer Direto
        if (keys['ArrowUp']) {
            targetPitch = -0.6;
            this.mesh.position.Y -= this.speed * 0.4; // O avião desce mesmo
        }
        if (keys['ArrowDown']) {
            targetPitch = 0.5;
            this.mesh.position.Y += this.speed * 0.4; // O avião sobe mesmo
        }

        // Inclinação Lateral
        if (keys['ArrowLeft']) targetRoll = 0.8;
        if (keys['ArrowRight']) targetRoll = -0.8;

        // Suavização visual apenas (para não ser robótico)
        this.pitch += (targetPitch - this.pitch) * 0.15;
        this.roll += (targetRoll - this.roll) * 0.15;

        this.mesh.rotation.X = this.pitch;
        this.mesh.rotation.Z = this.roll;

        // 4. MOVIMENTO PARA A FRENTE (Ignoramos gravidade se houver velocidade)
        // Se a velocidade for mínima, ele não cai, apenas flutua
        if (this.speed < 0.1) {
            this.mesh.position.Y -= 0.05; // Gravidade mínima só para não ser estático
        }

        this.mesh.translateZ(this.speed);

        // 5. COLISÃO SIMPLIFICADA
        if (this.mesh.position.Y < 0.6) {
            this.mesh.position.Y = 0.6;
            this.velocityY = 0;
            if (this.speed > 1.5 && Math.abs(this.pitch) > 0.3) {
                this._resetPlane(); // Só crasha se bater mesmo de bico com muita força
            }
        }
    }
_handleGroundCollision() {
        // Verifica se o impacto foi demasiado violento
        // Se a velocidade de queda (velocityY) for muito negativa ou o avião estiver torto
        if (this.velocityY < -0.15 || Math.abs(this.roll) > 0.3) {
            // Pequeno truque: usamos um setTimeout para o alert não bloquear 
            // o loop do Three.js antes de limparmos a posição
            setTimeout(() => {
                alert("💥 CRASH! O avião foi recuperado para a pista.");
            }, 10);
            
            this._resetPlane();
        } else {
            // Aterragem suave ou Taxiing
            this.mesh.position.Y = 0.6;
            this.velocityY = 0;
            this.mesh.rotation.X = 0; 
            
            // Endireita as asas gradualmente se estiver no chão
            if (Math.abs(this.roll) < 0.1) this.mesh.rotation.Z = 0;
            
            // Atrito do solo (trava o avião se não acelerar)
            this.speed *= 0.99;
        }
    }

    _resetPlane() {
        // 1. Reposicionar o avião (Início da pista e ligeiramente acima do solo)
        this.mesh.position.set(0, 0.6, 100);
        
        // 2. FORÇAR ROTAÇÃO ZERO (Limpar a inclinação do crash no objeto 3D)
        this.mesh.rotation.set(0, 0, 0);
        
        // 3. LIMPAR VARIÁVEIS DE CONTROLO (Impedir que o erro continue)
        this.speed = 0;
        this.velocityY = 0;
        this.pitch = 0; // MUITO IMPORTANTE: Resetar o nariz
        this.roll = 0;  // MUITO IMPORTANTE: Resetar as asas
        
        // 4. Parar qualquer movimento residual da câmara ou física
        targetPitch = 0; // Se usares variáveis globais de target, limpa-as também
        targetRoll = 0;
    }
}
