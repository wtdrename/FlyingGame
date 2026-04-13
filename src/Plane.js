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
        // 1. MOTOR (Aumentar a potência máxima e aceleração)
        if (keys['w'] || keys['W']) this.speed += 0.01; 
        if (keys['s'] || keys['S']) this.speed -= 0.02;
        
        // Atrito do ar mais suave para manter a inércia
        this.speed *= 0.999; 
        this.speed = Math.max(0, Math.min(this.speed, 2.5)); // Aumentei maxSpeed para 2.5

        // 2. ANIMAÇÃO HÉLICE
        if (this.propeller) this.propeller.rotation.Z += this.speed * 0.8;

        // 3. CONTROLOS (PITCH E ROLL)
        let targetPitch = 0;
        let targetRoll = 0;
        if (keys['ArrowUp']) targetPitch = -0.5;
        if (keys['ArrowDown']) targetPitch = 0.4;
        if (keys['ArrowLeft']) targetRoll = 0.7;
        if (keys['ArrowRight']) targetRoll = -0.7;

        this.pitch += (targetPitch - this.pitch) * 0.08;
        this.roll += (targetRoll - this.roll) * 0.08;

        this.mesh.rotation.X = this.pitch;
        this.mesh.rotation.Z = this.roll;

        // 4. FÍSICA DE SUSTENTAÇÃO (LIFT) REFORMULADA
        // O segredo: Lift baseado no quadrado da velocidade para ser mais potente
        const liftPower = 0.007; 
        const gravityConst = 0.004;

        // Gerar sustentação baseada na velocidade
        // Se speed for > 0.8, o avião já começa a querer flutuar sozinho
        let lift = (this.speed * this.speed) * liftPower;

        // Bónus de inclinação: se o nariz estiver para cima, ganha mais lift,
        // mas só se tiver velocidade suficiente!
        if (this.pitch > 0) {
            lift += this.pitch * this.speed * 0.02;
            this.speed *= 0.995; // Subir custa velocidade (troca energia por altitude)
        }

        // Aplicar a força vertical (Sustentação - Gravidade)
        this.velocityY += (lift - gravityConst);

        // Estabilizador: impede que o avião "vibre" ou suba descontroladamente
        this.velocityY *= 0.94;

        // 5. MOVIMENTO
        this.mesh.position.Y += this.velocityY;
        this.mesh.translateZ(this.speed);

        // 6. COLISÃO SOLO
        if (this.mesh.position.Y < 0.6) {
            this._handleGroundCollision();
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
