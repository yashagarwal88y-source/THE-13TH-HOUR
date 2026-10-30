/**
 * THE 13TH HOUR - 3D Gothic Horror-Adventure Engine
 * Built with Three.js (Procedural Gothic World, Dynamic Lighting, Vlad Character with Cape Physics)
 */

class GameEngine3D {
  constructor(canvasContainer, story, rewind) {
    this.container = canvasContainer;
    this.story = story;
    this.rewind = rewind;

    this.scene = null;
    this.camera = null;
    this.renderer = null;

    // Camera orbit state
    this.camDistance = 14;
    this.camHeight = 6.5;
    this.camAngle = Math.PI;
    this.camPitch = 0.28;
    this.isDraggingMouse = false;
    this.prevMousePos = { x: 0, y: 0 };

    // Player (Vlad)
    this.vlad = null;
    this.vladParts = {};
    this.vladSpeed = 0.45; // Brisk, fun movement speed
    this.gravity = -0.016;

    // Landmarks / Zones
    this.landmarks = [];
    this.activeZone = null;
    this.guidanceArrow = null;

    // Interactive 3D Objects
    this.carouselMesh = null;
    this.carouselHorses = [];
    this.bellMesh = null;
    this.bellAngle = 0;
    this.bellAngularVel = 0;
    this.shockwaveRings = [];
    this.clockmakerGears = [];
    this.tentCurtains = null;
    this.tentLight = null;
    this.ferrisWheel = null;

    // Particles
    this.soulParticles = null;
    this.ghostClones = [];

    // Objective Indicator
    this.objectiveBeacon = null;

    this.clock = new THREE.Clock();
    this.init();
  }

  init() {
    // 1. Setup Three.js Scene, Camera, Renderer
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x0a0614, 0.012);

    const width = this.container.clientWidth || 1280;
    const height = this.container.clientHeight || 720;

    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;

    this.container.appendChild(this.renderer.domElement);

    // 2. Build 3D World
    this.buildSkyAndMoon();
    this.buildLighting();
    this.buildPlazaGround();
    this.buildWatchBezelPerimeter();
    this.buildLandmarks();
    this.buildParticles();

    // 3. Build Vlad 3D Character
    this.buildVladCharacter();

    // 4. Setup Input Controls for Camera Orbit
    this.setupCameraControls();

    // 5. Handle Window Resize
    window.addEventListener('resize', () => this.onWindowResize());
  }

  // ==========================================
  // ENVIRONMENT: SKY, MOON & LIGHTING
  // ==========================================
  buildSkyAndMoon() {
    // Starfield
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 400;

      starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 30; // Above horizon
      starPos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Silver and pale purple stars
      const c = Math.random() > 0.4 ? 0.9 : 0.6;
      starColors[i * 3] = c;
      starColors[i * 3 + 1] = c * 0.9;
      starColors[i * 3 + 2] = c * 1.1;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85
    });
    const stars = new THREE.Points(starGeo, starMat);
    this.scene.add(stars);

    // Giant 3D Blood Moon
    const moonGeo = new THREE.SphereGeometry(35, 32, 32);
    const moonMat = new THREE.MeshBasicMaterial({
      color: 0xffd9d9
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(0, 160, -320);
    this.scene.add(moon);

    // Blood Moon Glowing Halo
    const haloGeo = new THREE.RingGeometry(35.5, 52, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0x96172e,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.position.set(0, 160, -318);
    this.scene.add(halo);
  }

  buildLighting() {
    // Ambient Twilight Light
    const ambientLight = new THREE.AmbientLight(0x23183d, 1.4);
    this.scene.add(ambientLight);

    // Directional Moonlight from the Blood Moon
    const moonLight = new THREE.DirectionalLight(0xffcccc, 1.2);
    moonLight.position.set(0, 180, -300);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 50;
    moonLight.shadow.camera.far = 500;
    moonLight.shadow.camera.left = -120;
    moonLight.shadow.camera.right = 120;
    moonLight.shadow.camera.top = 120;
    moonLight.shadow.camera.bottom = -120;
    moonLight.shadow.bias = -0.0005;
    this.scene.add(moonLight);

    // Central Belfry Cyan Light
    const centerLight = new THREE.PointLight(0x3df3d8, 2.0, 45, 1.5);
    centerLight.position.set(0, 10, 0);
    this.scene.add(centerLight);
  }

  buildPlazaGround() {
    // Circular Cobblestone Plaza (Radius 120)
    const groundGeo = new THREE.CylinderGeometry(120, 120, 2, 64);
    
    // Procedural Dark Stone Canvas Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0e0b1a';
    ctx.fillRect(0, 0, 512, 512);

    // Concentric brass rings & cobblestone grid
    ctx.strokeStyle = '#291d38';
    ctx.lineWidth = 3;
    for (let r = 40; r < 250; r += 40) {
      ctx.beginPath();
      ctx.arc(256, 256, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      ctx.beginPath();
      ctx.moveTo(256, 256);
      ctx.lineTo(256 + Math.cos(a) * 250, 256 + Math.sin(a) * 250);
      ctx.stroke();
    }

    const groundTex = new THREE.CanvasTexture(canvas);
    groundTex.wrapS = THREE.RepeatWrapping;
    groundTex.wrapT = THREE.RepeatWrapping;
    groundTex.repeat.set(8, 8);

    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex,
      roughness: 0.85,
      metalness: 0.2
    });

    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Central Inscribed Floor Sigil (Roman Numerals I through XIII)
    const sigilGeo = new THREE.RingGeometry(8, 9, 32);
    const sigilMat = new THREE.MeshBasicMaterial({
      color: 0xc99e46,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7
    });
    const sigil = new THREE.Mesh(sigilGeo, sigilMat);
    sigil.rotation.x = -Math.PI / 2;
    sigil.position.y = 0.05;
    this.scene.add(sigil);
  }

  buildWatchBezelPerimeter() {
    // Outer Watch Casing Bezel (Radius 120 to 125, Height 14)
    const bezelGeo = new THREE.CylinderGeometry(124, 124, 14, 64, 1, true);
    const bezelMat = new THREE.MeshStandardMaterial({
      color: 0x8a6c2f,
      roughness: 0.35,
      metalness: 0.8,
      side: THREE.DoubleSide
    });
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.y = 6;
    this.scene.add(bezel);

    // Bezel Rim Top Ring
    const rimGeo = new THREE.RingGeometry(120, 126, 64);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xc99e46,
      roughness: 0.25,
      metalness: 0.85,
      side: THREE.DoubleSide
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 13.01;
    this.scene.add(rim);

    // Distant Skeletal Ferris Wheel (at z: -170)
    this.buildFerrisWheel(0, 0, -170);
  }

  buildFerrisWheel(x, y, z) {
    const wheelGroup = new THREE.Group();
    wheelGroup.position.set(x, y, z);

    // Support A-frame legs
    const legGeo = new THREE.CylinderGeometry(0.8, 1.2, 70, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x221833, metalness: 0.6 });

    const leg1 = new THREE.Mesh(legGeo, legMat);
    leg1.position.set(-16, 32, 0);
    leg1.rotation.z = -0.3;
    wheelGroup.add(leg1);

    const leg2 = new THREE.Mesh(legGeo, legMat);
    leg2.position.set(16, 32, 0);
    leg2.rotation.z = 0.3;
    wheelGroup.add(leg2);

    // Rotating Wheel
    this.ferrisWheel = new THREE.Group();
    this.ferrisWheel.position.set(0, 58, 0);

    const rimGeo = new THREE.TorusGeometry(38, 0.7, 8, 32);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x4a365f, metalness: 0.7 });
    const rimMesh = new THREE.Mesh(rimGeo, wheelMat);
    this.ferrisWheel.add(rimMesh);

    // Spokes and 8 Gondolas
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const spokeGeo = new THREE.CylinderGeometry(0.3, 0.3, 38, 4);
      const spoke = new THREE.Mesh(spokeGeo, wheelMat);
      spoke.position.set(Math.cos(angle) * 19, Math.sin(angle) * 19, 0);
      spoke.rotation.z = angle + Math.PI / 2;
      this.ferrisWheel.add(spoke);

      // Gondola carriage with glowing amber lantern
      const gondolaGeo = new THREE.BoxGeometry(3.5, 3.5, 3.5);
      const gondolaMat = new THREE.MeshStandardMaterial({ color: 0x7a1824, roughness: 0.5 });
      const gondola = new THREE.Mesh(gondolaGeo, gondolaMat);
      gondola.position.set(Math.cos(angle) * 38, Math.sin(angle) * 38, 0);
      this.ferrisWheel.add(gondola);
    }

    wheelGroup.add(this.ferrisWheel);
    this.scene.add(wheelGroup);
  }

  // ==========================================
  // LANDMARKS & PUZZLE ZONES
  // ==========================================
  buildLandmarks() {
    // 1. TICKET BOOTH & IRON GATE (x: -65, z: -15) — Memory Echo 1
    this.buildTicketBooth(-65, 0, -15);

    // 2. THE HAUNTED CAROUSEL (x: -45, z: 55) — Memory Echo 2
    this.buildCarousel(-45, 0, 55);

    // 3. THE SILENT BELL TOWER (x: 0, z: 0) — Center Belfry (13 Tolls)
    this.buildBellTower(0, 0, 0);

    // 4. THE HALL OF CRACKED MIRRORS (x: 55, z: 45) — Memory Echo 3
    this.buildMirrorHall(55, 0, 45);

    // 5. THE CLOCKMAKER'S TENT (x: 75, z: -25) — Sanctuary & Endings
    this.buildClockmakerTent(75, 0, -25);

    // 6. BONUS ATTRACTION: Madame Chrona's Tarot Tent (x: -25, z: -60)
    this.buildTarotTent(-25, 0, -60);

    // 7. BONUS ATTRACTION: Phantom Ring Toss Stall (x: 35, z: -60)
    this.buildRingTossStall(35, 0, -60);

    // 8. BONUS ATTRACTION: Calliope Steam Organ (x: -55, z: 25)
    this.buildCalliopeOrgan(-55, 0, 25);

    // 9. BONUS ATTRACTION: Strongman High Striker (x: 55, z: -15)
    this.buildHighStriker(55, 0, -15);

    // Objective Navigation Arrow above Vlad
    this.buildGuidanceArrow();
  }

  // --- Objective Navigation Arrow ---
  buildGuidanceArrow() {
    const arrowGroup = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.5, 1.2, 8);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0x3df3d8 });
    const cone = new THREE.Mesh(coneGeo, coneMat);
    cone.rotation.x = Math.PI / 2;
    arrowGroup.add(cone);
    arrowGroup.position.set(0, 5.2, 0);
    this.guidanceArrow = arrowGroup;
    this.scene.add(this.guidanceArrow);
  }

  // --- Bonus Zone: Madame Chrona's Tarot Tent ---
  buildTarotTent(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Purple Tent
    const tentGeo = new THREE.ConeGeometry(8, 8, 8);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x4a185f, roughness: 0.5 });
    const tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.y = 4;
    group.add(tent);

    // Round Table & Glowing Crystal Ball
    const tableGeo = new THREE.CylinderGeometry(2.2, 2.2, 1.4, 16);
    const table = new THREE.Mesh(tableGeo, new THREE.MeshStandardMaterial({ color: 0x1f1426 }));
    table.position.set(0, 0.7, 4.5);
    group.add(table);

    const ballGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const ballMat = new THREE.MeshBasicMaterial({ color: 0x9d4edd });
    const ball = new THREE.Mesh(ballGeo, ballMat);
    ball.position.set(0, 1.9, 4.5);
    group.add(ball);

    const light = new THREE.PointLight(0x9d4edd, 1.6, 12);
    light.position.set(0, 2.2, 4.5);
    group.add(light);

    const beacon = this.createBeacon(0, 0.2, 4.5, 0x9d4edd);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'tarot',
      name: 'Madame Chrona\'s Tarot Tent (Bonus)',
      position: new THREE.Vector3(x, y, z + 4.5),
      radius: 8,
      prompt: '[E] Play Tarot Card Match',
      action: () => window.gamePuzzles.openTarotPuzzle()
    });
  }

  // --- Bonus Zone: Phantom Ring Toss Stall ---
  buildRingTossStall(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Carnival Stall Wooden Booth
    const stall = new THREE.Mesh(
      new THREE.BoxGeometry(9, 4, 4),
      new THREE.MeshStandardMaterial({ color: 0x22130e })
    );
    stall.position.set(0, 2, 0);
    group.add(stall);

    // Striped Awning
    const awning = new THREE.Mesh(
      new THREE.BoxGeometry(10, 0.8, 5),
      new THREE.MeshStandardMaterial({ color: 0x96172e })
    );
    awning.position.set(0, 4.5, 0);
    group.add(awning);

    // 3 Glowing Bottles
    for (let b = -1; b <= 1; b++) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.35, 1.4, 8),
        new THREE.MeshBasicMaterial({ color: b === 0 ? 0xf5d77f : 0x3df3d8 })
      );
      bottle.position.set(b * 2.2, 4.5, 0);
      group.add(bottle);
    }

    const light = new THREE.PointLight(0xf5d77f, 1.4, 12);
    light.position.set(0, 5, 1);
    group.add(light);

    const beacon = this.createBeacon(0, 0.2, 2.5, 0xf5d77f);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'ringtoss',
      name: 'Phantom Ring Toss Stall (Bonus)',
      position: new THREE.Vector3(x, y, z + 2.5),
      radius: 8,
      prompt: '[E] Play Phantom Ring Toss',
      action: () => window.gamePuzzles.openRingTossPuzzle()
    });
  }

  // --- Bonus Zone: Steam Organ of Whispers ---
  buildCalliopeOrgan(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Organ Wooden Carriage
    const wagon = new THREE.Mesh(
      new THREE.BoxGeometry(7, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x2b1c10, roughness: 0.7 })
    );
    wagon.position.y = 1.5;
    wagon.castShadow = true;
    group.add(wagon);

    // 4 Brass Musical Pipes
    const pipeColors = [0xe63946, 0xf5d77f, 0x3df3d8, 0x9d4edd];
    const pipeHeights = [3.5, 4.5, 5.5, 6.5];

    for (let i = 0; i < 4; i++) {
      const pGroup = new THREE.Group();
      pGroup.position.set(-2.2 + i * 1.5, 3, 0);

      const pipeMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.28, 0.28, pipeHeights[i], 12),
        new THREE.MeshStandardMaterial({ color: 0xc99e46, metalness: 0.85, roughness: 0.2 })
      );
      pipeMesh.position.y = pipeHeights[i] / 2;
      pGroup.add(pipeMesh);

      // Glowing tip
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.32, 12, 12),
        new THREE.MeshBasicMaterial({ color: pipeColors[i] })
      );
      tip.position.y = pipeHeights[i];
      pGroup.add(tip);

      group.add(pGroup);
    }

    const light = new THREE.PointLight(0xf5d77f, 1.4, 14);
    light.position.set(0, 5, 2);
    group.add(light);

    const beacon = this.createBeacon(0, 0.2, 2.5, 0x3df3d8);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'organ',
      name: 'Steam Organ of Whispers (Bonus)',
      position: new THREE.Vector3(x, y, z + 2.5),
      radius: 8,
      prompt: '[E] Play Steam Organ of Whispers',
      action: () => window.gamePuzzles.openOrganPuzzle()
    });
  }

  // --- Bonus Zone: Strongman High Striker ---
  buildHighStriker(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Vertical Striker Tower Post (Height 14)
    const tower = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 14, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x1f1627, roughness: 0.8 })
    );
    tower.position.y = 7;
    tower.castShadow = true;
    group.add(tower);

    // Golden Bell at top
    const bell = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 1.1, 1.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xf5d77f, metalness: 0.9 })
    );
    bell.position.y = 14.2;
    group.add(bell);

    // Striker Anvil Base Pad
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 0.8, 16),
      new THREE.MeshStandardMaterial({ color: 0x6e4e1a, metalness: 0.7 })
    );
    pad.position.set(0, 0.4, 1.6);
    group.add(pad);

    // Big Wooden Mallet on Ground
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8),
      new THREE.MeshStandardMaterial({ color: 0x4a321d })
    );
    handle.position.set(1.4, 0.3, 2.2);
    handle.rotation.z = Math.PI / 3;
    group.add(handle);

    const light = new THREE.PointLight(0xe63946, 1.5, 12);
    light.position.set(0, 6, 2);
    group.add(light);

    const beacon = this.createBeacon(0, 0.2, 2.2, 0xe63946);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'striker',
      name: 'Strongman High Striker (Bonus)',
      position: new THREE.Vector3(x, y, z + 2.2),
      radius: 8,
      prompt: '[E] Swing Strongman Mallet',
      action: () => window.gamePuzzles.openStrikerPuzzle()
    });
  }

  // --- Zone 1: Ticket Booth ---
  buildTicketBooth(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Booth Cabin
    const cabinGeo = new THREE.BoxGeometry(8, 8, 8);
    const cabinMat = new THREE.MeshStandardMaterial({ color: 0x1d140e, roughness: 0.8 });
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.y = 4;
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    group.add(cabin);

    // Striped Awning Roof
    const roofGeo = new THREE.ConeGeometry(6.5, 4, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x96172e, roughness: 0.5 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 10;
    roof.rotation.y = Math.PI / 4;
    group.add(roof);

    // Wrought Iron Gate arches
    const gateGeo = new THREE.TorusGeometry(5, 0.3, 8, 24, Math.PI);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0x3d3020, metalness: 0.8 });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(-6, 5, 0);
    gate.rotation.y = Math.PI / 2;
    group.add(gate);

    // Glowing Sign: 12:13
    const signGeo = new THREE.BoxGeometry(4.5, 1.4, 0.4);
    const signMat = new THREE.MeshBasicMaterial({ color: 0xf5d77f });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 6.5, 4.2);
    group.add(sign);

    // Lantern PointLight
    const lantern = new THREE.PointLight(0xf5d77f, 1.5, 16);
    lantern.position.set(0, 7, 4.5);
    group.add(lantern);

    // Floating Beacon Ring
    const beacon = this.createBeacon(0, 0.2, 0, 0xf5d77f);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'ticket',
      name: 'The Iron Gate & Ticket Booth',
      position: new THREE.Vector3(x, y, z),
      radius: 9,
      prompt: '[E] Inspect Ticket Booth (Echo 1)',
      action: () => window.gamePuzzles.openTicketPuzzle()
    });
  }

  // --- Zone 2: Haunted Carousel ---
  buildCarousel(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Stepped Platform
    const baseGeo = new THREE.CylinderGeometry(14, 15, 1.5, 32);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x221528, roughness: 0.7 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.75;
    base.receiveShadow = true;
    group.add(base);

    // Center Clockwork Column
    const colGeo = new THREE.CylinderGeometry(3, 3, 12, 16);
    const colMat = new THREE.MeshStandardMaterial({ color: 0xc99e46, metalness: 0.7, roughness: 0.3 });
    const col = new THREE.Mesh(colGeo, colMat);
    col.position.y = 6;
    group.add(col);

    // Rotating Carousel Upper Group
    this.carouselMesh = new THREE.Group();
    this.carouselMesh.position.y = 6;

    // Striped Canopy
    const canopyGeo = new THREE.ConeGeometry(15, 6, 16);
    const canopyMat = new THREE.MeshStandardMaterial({ color: 0x7a1220, roughness: 0.4 });
    const canopy = new THREE.Mesh(canopyGeo, canopyMat);
    canopy.position.y = 7;
    canopy.castShadow = true;
    this.carouselMesh.add(canopy);

    // Gold Spire Peak
    const spireGeo = new THREE.CylinderGeometry(0.1, 0.8, 5, 8);
    const spireMat = new THREE.MeshStandardMaterial({ color: 0xf5d77f, metalness: 0.85 });
    const spire = new THREE.Mesh(spireGeo, spireMat);
    spire.position.y = 12.5;
    this.carouselMesh.add(spire);

    // 6 Skeletal Horses on Brass Rods
    this.carouselHorses = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const hDist = 10;
      const hGroup = new THREE.Group();
      hGroup.position.set(Math.cos(angle) * hDist, -2, Math.sin(angle) * hDist);
      hGroup.rotation.y = -angle + Math.PI / 2;

      // Brass Rod
      const rodGeo = new THREE.CylinderGeometry(0.15, 0.15, 10, 8);
      const rodMat = new THREE.MeshStandardMaterial({ color: 0xc99e46, metalness: 0.8 });
      const rod = new THREE.Mesh(rodGeo, rodMat);
      hGroup.add(rod);

      // Stylized Horse Body
      const horseBody = new THREE.Mesh(
        new THREE.BoxGeometry(1.6, 1.4, 3.8),
        new THREE.MeshStandardMaterial({ color: 0xeae1cf, roughness: 0.5 })
      );
      horseBody.position.y = 0;
      horseBody.castShadow = true;
      hGroup.add(horseBody);

      // Horse Skull
      const skull = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 2.2, 4),
        new THREE.MeshStandardMaterial({ color: 0xf5efe6 })
      );
      skull.position.set(0, 1.4, 1.8);
      skull.rotation.x = -Math.PI / 3;
      hGroup.add(skull);

      this.carouselMesh.add(hGroup);
      this.carouselHorses.push({ group: hGroup, baseAngle: angle, phase: i * 1.2 });
    }

    group.add(this.carouselMesh);

    // Lantern
    const carLight = new THREE.PointLight(0xe63946, 2.0, 24);
    carLight.position.set(0, 5, 0);
    group.add(carLight);

    const beacon = this.createBeacon(0, 0.2, 0, 0xe63946);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'carousel',
      name: 'The Haunted Stopped Carousel',
      position: new THREE.Vector3(x, y, z),
      radius: 12,
      prompt: '[E] Inspect Carousel Gears (Echo 2)',
      action: () => window.gamePuzzles.openCarouselPuzzle()
    });
  }

  // --- Zone 3: Silent Bell Tower ---
  buildBellTower(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // 4 Gothic Stone Pillars
    const pillarGeo = new THREE.BoxGeometry(2.5, 24, 2.5);
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x1f182a, roughness: 0.9 });

    const p1 = new THREE.Mesh(pillarGeo, stoneMat);
    p1.position.set(-6, 12, -6);
    p1.castShadow = true;
    group.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, stoneMat);
    p2.position.set(6, 12, -6);
    p2.castShadow = true;
    group.add(p2);

    const p3 = new THREE.Mesh(pillarGeo, stoneMat);
    p3.position.set(-6, 12, 6);
    p3.castShadow = true;
    group.add(p3);

    const p4 = new THREE.Mesh(pillarGeo, stoneMat);
    p4.position.set(6, 12, 6);
    p4.castShadow = true;
    group.add(p4);

    // Roof Belfry Canopy
    const belfryRoof = new THREE.Mesh(
      new THREE.ConeGeometry(11, 8, 4),
      new THREE.MeshStandardMaterial({ color: 0x362544, roughness: 0.5 })
    );
    belfryRoof.position.y = 28;
    belfryRoof.rotation.y = Math.PI / 4;
    group.add(belfryRoof);

    // Giant 3D Brass Bell (Hanging at y: 19)
    const bellGroup = new THREE.Group();
    bellGroup.position.set(0, 19, 0);

    const bellBody = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 4.2, 5.5, 24, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xc99e46, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide })
    );
    bellGroup.add(bellBody);

    const bellTop = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x8a6c2f, metalness: 0.9 })
    );
    bellTop.position.y = 2.4;
    bellGroup.add(bellTop);

    // Bell Clapper & Hanging Rope
    const ropeGeo = new THREE.CylinderGeometry(0.08, 0.08, 14, 6);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0x5a3f25 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.position.y = -6;
    bellGroup.add(rope);

    this.bellMesh = bellGroup;
    group.add(this.bellMesh);

    // Floor Inscription Sigil & Beacon
    const beacon = this.createBeacon(0, 0.2, 0, 0x3df3d8);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'bell',
      name: 'The Silent Bell Tower',
      position: new THREE.Vector3(x, y, z),
      radius: 9,
      prompt: () => this.story.hasAllEchoes() ? '[E] Ring Silent Bell (13 Times)' : 'Sealed by 3 Temporal Chains',
      action: () => this.triggerSilentBellRing()
    });
  }

  triggerSilentBellRing() {
    this.story.ringSilentBell();

    // Trigger 3D bell swing animation
    this.bellAngularVel = 0.45;

    // Trigger 3D shockwave ripple ring on the ground
    this.spawnShockwaveRing(0, 0.1, 0);
  }

  spawnShockwaveRing(x, y, z) {
    const ringGeo = new THREE.RingGeometry(0.5, 2.5, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x3df3d8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, y, z);
    this.scene.add(ring);

    this.shockwaveRings.push({
      mesh: ring,
      scale: 1,
      opacity: 0.9
    });
  }

  // --- Zone 4: Hall of Cracked Mirrors ---
  buildMirrorHall(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Funhouse Tent Pavilion
    const tentGeo = new THREE.ConeGeometry(12, 12, 8);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x241133, roughness: 0.6 });
    const tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.y = 6;
    group.add(tent);

    // Ornate Standing Antique Mirrors
    for (let i = 0; i < 3; i++) {
      const mAngle = (i - 1) * 0.7;
      const mirrorGroup = new THREE.Group();
      mirrorGroup.position.set(Math.sin(mAngle) * 5, 3.5, 6 + Math.cos(mAngle) * 1.5);
      mirrorGroup.rotation.y = -mAngle + Math.PI;

      // Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(3.2, 5.5, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xc99e46, metalness: 0.8 })
      );
      mirrorGroup.add(frame);

      // Reflective Glass pane with glowing cyan crack
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 5.0),
        new THREE.MeshStandardMaterial({
          color: 0x4a6b82,
          roughness: 0.1,
          metalness: 0.95,
          emissive: 0x3df3d8,
          emissiveIntensity: 0.25
        })
      );
      glass.position.z = 0.22;
      mirrorGroup.add(glass);

      group.add(mirrorGroup);
    }

    // Cyan Moonlight shaft
    const mLight = new THREE.PointLight(0x3df3d8, 1.8, 18);
    mLight.position.set(0, 4, 6);
    group.add(mLight);

    const beacon = this.createBeacon(0, 0.2, 6, 0x3df3d8);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'mirror',
      name: 'The Hall of Cracked Mirrors',
      position: new THREE.Vector3(x, y, z + 5),
      radius: 9,
      prompt: '[E] Step into Mirror Hall (Echo 3)',
      action: () => window.gamePuzzles.openMirrorPuzzle()
    });
  }

  // --- Zone 5: Clockmaker's Tent ---
  buildClockmakerTent(x, y, z) {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    // Grand Big Top Pavilion
    const tentGeo = new THREE.ConeGeometry(16, 14, 12);
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x180d24, roughness: 0.6 });
    const tent = new THREE.Mesh(tentGeo, tentMat);
    tent.position.y = 7;
    tent.castShadow = true;
    group.add(tent);

    // Three Interlocking Bronze Gears on Roof
    this.clockmakerGears = [];
    const gearCoords = [
      { r: 4.0, y: 15.0, speed: 0.015, color: 0xc99e46 },
      { r: 2.8, y: 16.5, speed: -0.02, color: 0x8a6c2f },
      { r: 2.0, y: 17.8, speed: 0.03, color: 0xf5d77f }
    ];

    gearCoords.forEach(gc => {
      const gearGeo = new THREE.CylinderGeometry(gc.r, gc.r, 0.6, 16);
      const gearMat = new THREE.MeshStandardMaterial({ color: gc.color, metalness: 0.8, roughness: 0.3 });
      const gear = new THREE.Mesh(gearGeo, gearMat);
      gear.position.set(0, gc.y, 0);
      gear.rotation.x = Math.PI / 2;
      group.add(gear);
      this.clockmakerGears.push({ mesh: gear, speed: gc.speed });
    });

    // Glowing Velvet Entrance Flaps
    const doorwayGeo = new THREE.PlaneGeometry(6, 9);
    const doorwayMat = new THREE.MeshStandardMaterial({
      color: 0x0a0512,
      emissive: 0x221105,
      emissiveIntensity: 0.2,
      side: THREE.DoubleSide
    });
    this.tentCurtains = new THREE.Mesh(doorwayGeo, doorwayMat);
    this.tentCurtains.position.set(0, 4.5, 12.2);
    group.add(this.tentCurtains);

    // Interior Warm Golden Glow Light
    this.tentLight = new THREE.PointLight(0xf5d77f, 0.5, 15);
    this.tentLight.position.set(0, 5, 13);
    group.add(this.tentLight);

    const beacon = this.createBeacon(0, 0.2, 12, 0xc99e46);
    group.add(beacon);

    this.scene.add(group);

    this.landmarks.push({
      id: 'tent',
      name: 'The Clockmaker\'s Sanctuary',
      position: new THREE.Vector3(x, y, z + 12),
      radius: 9,
      prompt: () => this.story.tentUnlocked ? '[E] Enter Sanctuary' : 'Locked by Temporal Ward',
      action: () => {
        if (this.story.tentUnlocked) {
          this.story.showClockmakerEncounter();
        } else {
          this.story.showModal('TEMPORAL WARD', `
            <div class="dialogue-text">
              Massive interlocking bronze clock gears lock the Clockmaker\'s tent.
              <br><br>
              <span style="color: var(--crimson-bright); font-weight: 600;">
                "Only when the Silent Bell tolls thirteen times shall the keeper\'s sanctuary open."
              </span>
            </div>
          `, [{ text: 'Return', action: 'close' }]);
        }
      }
    });
  }

  createBeacon(x, y, z, color) {
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(x, y, z);

    // Glowing pulsing floor ring
    const ringGeo = new THREE.RingGeometry(1.6, 2.2, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    beaconGroup.add(ring);

    // Soft vertical light pillar
    const beamGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 6;
    beaconGroup.add(beam);

    return beaconGroup;
  }

  // ==========================================
  // VLAD: 3D CHARACTER MODEL & CAPE
  // ==========================================
  buildVladCharacter() {
    this.vlad = new THREE.Group();
    this.vlad.position.set(-60, 0, -8);
    this.vlad.userData = {
      vx: 0,
      vy: 0,
      vz: 0,
      isGrounded: true,
      walkCycle: 0
    };

    // 1. Torso: Victorian Tailcoat
    const coatGeo = new THREE.BoxGeometry(1.1, 1.8, 0.8);
    const coatMat = new THREE.MeshStandardMaterial({ color: 0x110c1c, roughness: 0.7 });
    const coat = new THREE.Mesh(coatGeo, coatMat);
    coat.position.y = 2.1;
    coat.castShadow = true;
    this.vlad.add(coat);

    // 2. Head: Pale Visage with Glowing Crimson Eyes
    const headGeo = new THREE.SphereGeometry(0.48, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf5efe6, roughness: 0.4 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 3.3;
    head.castShadow = true;
    this.vlad.add(head);

    // Crimson Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff2a3d });
    const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
    eyeL.position.set(-0.16, 3.35, 0.44);
    this.vlad.add(eyeL);

    const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), eyeMat);
    eyeR.position.set(0.16, 3.35, 0.44);
    this.vlad.add(eyeR);

    // 3. Victorian Top Hat
    const hatGroup = new THREE.Group();
    hatGroup.position.set(0, 3.65, 0);

    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0x08050e })
    );
    hatGroup.add(brim);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(0.55, 0.58, 1.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x08050e })
    );
    crown.position.y = 0.55;
    hatGroup.add(crown);

    const hatBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.59, 0.59, 0.18, 16),
      new THREE.MeshStandardMaterial({ color: 0xc99e46 })
    );
    hatBand.position.y = 0.16;
    hatGroup.add(hatBand);

    this.vlad.add(hatGroup);

    // 4. Dynamic Billowing Cape (3 Segments for physics)
    this.vladParts.capeSegments = [];
    const capeMatOuter = new THREE.MeshStandardMaterial({ color: 0x08050e, roughness: 0.8 });
    const capeMatInner = new THREE.MeshStandardMaterial({ color: 0x96172e, roughness: 0.6 });

    const capeGroup = new THREE.Group();
    capeGroup.position.set(0, 2.9, -0.42);

    for (let s = 0; s < 3; s++) {
      const segGeo = new THREE.BoxGeometry(1.3 + s * 0.15, 0.9, 0.06);
      const seg = new THREE.Mesh(segGeo, s % 2 === 0 ? capeMatOuter : capeMatInner);
      seg.position.set(0, -s * 0.85, -s * 0.15);
      seg.castShadow = true;
      capeGroup.add(seg);
      this.vladParts.capeSegments.push(seg);
    }
    this.vlad.add(capeGroup);
    this.vladParts.capeGroup = capeGroup;

    // 5. Legs with walking joints
    const legGeo = new THREE.BoxGeometry(0.38, 1.3, 0.38);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x090610 });

    const legL = new THREE.Mesh(legGeo, legMat);
    legL.position.set(-0.3, 0.7, 0);
    legL.castShadow = true;
    this.vlad.add(legL);
    this.vladParts.legL = legL;

    const legR = new THREE.Mesh(legGeo, legMat);
    legR.position.set(0.3, 0.7, 0);
    legR.castShadow = true;
    this.vlad.add(legR);
    this.vladParts.legR = legR;

    // 6. Magical Chronos Heart Pocket Watch in Hand
    const watchMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.08, 16),
      new THREE.MeshStandardMaterial({ color: 0xc99e46, metalness: 0.9, roughness: 0.2 })
    );
    watchMesh.position.set(0.75, 1.8, 0.5);
    watchMesh.rotation.x = Math.PI / 4;

    const watchLight = new THREE.PointLight(0x3df3d8, 1.4, 8);
    watchLight.position.set(0.75, 1.8, 0.6);
    this.vlad.add(watchLight);
    this.vlad.add(watchMesh);
    this.vladParts.watchMesh = watchMesh;

    this.scene.add(this.vlad);
  }

  // ==========================================
  // PARTICLES & 3D REWIND GHOST CLONES
  // ==========================================
  buildParticles() {
    // Floating Soul Motes (120 particles)
    const count = 120;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 180;
      pos[i * 3 + 1] = Math.random() * 25 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 180;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: 0x3df3d8,
      size: 1.6,
      transparent: true,
      opacity: 0.7
    });

    this.soulParticles = new THREE.Points(geo, mat);
    this.scene.add(this.soulParticles);
  }

  spawnGhostClone(vladState) {
    // Create a 3D spectral cyan ghost silhouette
    const ghostGeo = new THREE.BoxGeometry(1.2, 3.2, 0.9);
    const ghostMat = new THREE.MeshBasicMaterial({
      color: 0x3df3d8,
      wireframe: true,
      transparent: true,
      opacity: 0.65
    });
    const ghost = new THREE.Mesh(ghostGeo, ghostMat);
    ghost.position.set(vladState.x, vladState.y + 1.6, vladState.z);
    ghost.rotation.y = vladState.rotationY;
    this.scene.add(ghost);

    this.ghostClones.push({
      mesh: ghost,
      life: 1.0
    });
  }

  clearGhostClones() {
    this.ghostClones.forEach(g => {
      this.scene.remove(g.mesh);
      g.mesh.geometry.dispose();
      g.mesh.material.dispose();
    });
    this.ghostClones = [];
  }

  // ==========================================
  // CAMERA & USER CONTROLS
  // ==========================================
  setupCameraControls() {
    const el = this.renderer.domElement;

    // Mouse drag to orbit camera
    el.addEventListener('mousedown', (e) => {
      this.isDraggingMouse = true;
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      this.isDraggingMouse = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDraggingMouse) return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;
      this.prevMousePos = { x: e.clientX, y: e.clientY };

      this.camAngle -= dx * 0.006;
      this.camPitch = Math.max(0.08, Math.min(1.1, this.camPitch + dy * 0.005));
    });

    // Mouse wheel zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.camDistance = Math.max(7, Math.min(26, this.camDistance + e.deltaY * 0.015));
    }, { passive: false });
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // ==========================================
  // MAIN UPDATE & RENDER LOOP
  // ==========================================
  update(dt, input) {
    const time = this.clock.getElapsedTime();

    // 1. Vlad Player Movement
    if (!this.rewind.isRewinding && this.vlad) {
      let moveX = 0;
      let moveZ = 0;

      // Camera forward & right vectors
      const forward = new THREE.Vector3(-Math.sin(this.camAngle), 0, -Math.cos(this.camAngle)).normalize();
      const right = new THREE.Vector3(Math.cos(this.camAngle), 0, -Math.sin(this.camAngle)).normalize();

      if (input.left) {
        moveX -= right.x;
        moveZ -= right.z;
      }
      if (input.right) {
        moveX += right.x;
        moveZ += right.z;
      }
      if (input.forward) {
        moveX += forward.x;
        moveZ += forward.z;
      }
      if (input.backward) {
        moveX -= forward.x;
        moveZ -= forward.z;
      }

      const moveLen = Math.hypot(moveX, moveZ);
      if (moveLen > 0.01) {
        moveX = (moveX / moveLen) * this.vladSpeed;
        moveZ = (moveZ / moveLen) * this.vladSpeed;

        this.vlad.position.x += moveX;
        this.vlad.position.z += moveZ;

        // Smoothly rotate Vlad toward movement direction
        const targetRotY = Math.atan2(moveX, moveZ);
        this.vlad.rotation.y = targetRotY;

        // Leg walk animation
        this.vlad.userData.walkCycle += 0.22;
        this.vladParts.legL.rotation.x = Math.sin(this.vlad.userData.walkCycle) * 0.65;
        this.vladParts.legR.rotation.x = -Math.sin(this.vlad.userData.walkCycle) * 0.65;

        // Billow cape back
        this.vladParts.capeGroup.rotation.x = 0.45 + Math.sin(time * 6) * 0.12;

        if (Math.sin(this.vlad.userData.walkCycle) > 0.95) {
          window.gameAudio.playFootstep();
        }
      } else {
        // Idle animation
        this.vladParts.legL.rotation.x = 0;
        this.vladParts.legR.rotation.x = 0;
        this.vladParts.capeGroup.rotation.x = 0.08 + Math.sin(time * 2.5) * 0.05;
      }

      // Jump & Gravity
      if (input.jump && this.vlad.userData.isGrounded) {
        this.vlad.userData.vy = 0.38;
        this.vlad.userData.isGrounded = false;
        window.gameAudio.ensureContext();
      }

      this.vlad.userData.vy += this.gravity;
      this.vlad.position.y += this.vlad.userData.vy;

      if (this.vlad.position.y <= 0) {
        this.vlad.position.y = 0;
        this.vlad.userData.vy = 0;
        this.vlad.userData.isGrounded = true;
      }

      // Constrain inside circular plaza (radius 115)
      const distFromCenter = Math.hypot(this.vlad.position.x, this.vlad.position.z);
      if (distFromCenter > 115) {
        const angle = Math.atan2(this.vlad.position.z, this.vlad.position.x);
        this.vlad.position.x = Math.cos(angle) * 115;
        this.vlad.position.z = Math.sin(angle) * 115;
      }
    }

    // 2. Camera Follows Vlad smoothly
    if (this.vlad) {
      const targetCamX = this.vlad.position.x + Math.sin(this.camAngle) * this.camDistance * Math.cos(this.camPitch);
      const targetCamY = this.vlad.position.y + this.camHeight + Math.sin(this.camPitch) * this.camDistance;
      const targetCamZ = this.vlad.position.z + Math.cos(this.camAngle) * this.camDistance * Math.cos(this.camPitch);

      this.camera.position.set(targetCamX, targetCamY, targetCamZ);
      this.camera.lookAt(this.vlad.position.x, this.vlad.position.y + 2.2, this.vlad.position.z);
    }

    // 3. Animate Carousel
    if (this.carouselMesh) {
      const isSpinning = this.story.memoryEchoes.carousel.collected;
      if (isSpinning) {
        this.carouselMesh.rotation.y += 0.015;
      }
      this.carouselHorses.forEach(h => {
        h.group.position.y = -2 + Math.sin(time * 3 + h.phase) * (isSpinning ? 1.4 : 0.2);
      });
    }

    // 4. Animate Bell Swing & Shockwaves
    if (this.bellMesh) {
      this.bellMesh.rotation.z += this.bellAngularVel;
      this.bellAngularVel -= this.bellMesh.rotation.z * 0.08; // Spring restoration
      this.bellAngularVel *= 0.94; // Damping
    }

    // Expand & fade shockwaves
    for (let i = this.shockwaveRings.length - 1; i >= 0; i--) {
      const s = this.shockwaveRings[i];
      s.scale += 0.45;
      s.opacity -= 0.018;
      s.mesh.scale.set(s.scale, s.scale, 1);
      s.mesh.material.opacity = Math.max(0, s.opacity);

      if (s.opacity <= 0) {
        this.scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        s.mesh.material.dispose();
        this.shockwaveRings.splice(i, 1);
      }
    }

    // 5. Animate Clockmaker Tent Gears & Curtains
    this.clockmakerGears.forEach(g => {
      g.mesh.rotation.z += g.speed * (this.story.tentUnlocked ? 2.5 : 0.4);
    });

    if (this.story.tentUnlocked && this.tentCurtains) {
      // Glow and part curtains
      this.tentCurtains.material.emissive.setHex(0xf5d77f);
      this.tentCurtains.material.emissiveIntensity = 0.8;
      if (this.tentLight) this.tentLight.intensity = 2.5;
    }

    // 6. Animate Distant Ferris Wheel
    if (this.ferrisWheel) {
      this.ferrisWheel.rotation.z += 0.004;
    }

    // 7. Float Soul Particles
    if (this.soulParticles) {
      const pos = this.soulParticles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += 0.04;
        if (pos[i] > 26) pos[i] = 0.5;
      }
      this.soulParticles.geometry.attributes.position.needsUpdate = true;
    }

    // 8. Update Objective Guidance Arrow
    if (this.guidanceArrow && this.vlad) {
      this.guidanceArrow.position.set(this.vlad.position.x, this.vlad.position.y + 4.8, this.vlad.position.z);
      
      // Determine next target position
      let targetPos = null;
      if (!this.story.memoryEchoes.ticket.collected) {
        targetPos = new THREE.Vector3(-65, 0, -15);
      } else if (!this.story.memoryEchoes.carousel.collected) {
        targetPos = new THREE.Vector3(-45, 0, 55);
      } else if (!this.story.memoryEchoes.mirror.collected) {
        targetPos = new THREE.Vector3(55, 0, 45);
      } else if (!this.story.tentUnlocked) {
        targetPos = new THREE.Vector3(0, 0, 0); // Bell tower
      } else {
        targetPos = new THREE.Vector3(75, 0, -15); // Clockmaker tent
      }

      if (targetPos) {
        this.guidanceArrow.lookAt(targetPos.x, this.vlad.position.y + 4.8, targetPos.z);
      }
    }

    // 9. Fade Rewind Ghost Clones
    for (let i = this.ghostClones.length - 1; i >= 0; i--) {
      const g = this.ghostClones[i];
      g.life -= dt * 1.4;
      g.mesh.material.opacity = Math.max(0, g.life * 0.65);
      if (g.life <= 0) {
        this.scene.remove(g.mesh);
        g.mesh.geometry.dispose();
        g.mesh.material.dispose();
        this.ghostClones.splice(i, 1);
      }
    }

    // 9. Proximity Landmark Check
    this.checkLandmarkProximity();

    // 10. Render 3D Scene
    this.renderer.render(this.scene, this.camera);
  }

  checkLandmarkProximity() {
    if (!this.vlad) return;

    this.activeZone = null;
    let closestDist = Infinity;

    for (const lm of this.landmarks) {
      const dist = this.vlad.position.distanceTo(lm.position);
      if (dist <= lm.radius && dist < closestDist) {
        closestDist = dist;
        this.activeZone = lm;
      }
    }

    const promptEl = document.getElementById('interaction-prompt');
    const locBadge = document.getElementById('location-name-txt');

    if (this.activeZone) {
      if (promptEl) {
        promptEl.style.display = 'flex';
        promptEl.style.left = '50%';
        promptEl.style.top = '78%';
        const text = typeof this.activeZone.prompt === 'function' ? this.activeZone.prompt() : this.activeZone.prompt;
        promptEl.innerText = text;
      }
      if (locBadge) locBadge.innerText = this.activeZone.name;
    } else {
      if (promptEl) promptEl.style.display = 'none';
      if (locBadge) locBadge.innerText = 'Carnival Nocturne Plaza (3D)';
    }
  }

  interact() {
    if (this.activeZone && typeof this.activeZone.action === 'function') {
      window.gameAudio.ensureContext();
      window.gameAudio.playClick();
      this.activeZone.action();
    }
  }

  teleportToTent() {
    if (this.vlad) {
      this.vlad.position.set(75, 0, -10);
      this.camAngle = Math.PI * 0.8;
    }
  }
}

window.GameEngine3D = GameEngine3D;
