/**
 * THE 13TH HOUR - 2D Gothic Engine & Renderer
 * Handles parallax world rendering, particles, lighting, and Vlad's animated sprite with cape physics.
 */

class GameEngine {
  constructor(canvas, story, rewind) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.story = story;
    this.rewind = rewind;

    // World size
    this.worldWidth = 3600;
    this.worldHeight = 720;
    this.groundY = 580;

    // Camera
    this.camera = {
      x: 100,
      y: 0,
      targetX: 100,
      width: 1280,
      height: 720
    };

    // Vlad Protagonist
    this.vlad = {
      x: 250,
      y: this.groundY - 90,
      width: 40,
      height: 90,
      vx: 0,
      vy: 0,
      speed: 4.8,
      jumpForce: -11.5,
      gravity: 0.55,
      isGrounded: true,
      facing: 1, // 1: right, -1: left
      walkFrame: 0,
      isMoving: false,
      capeTrail: [
        { x: 250, y: this.groundY - 70 },
        { x: 240, y: this.groundY - 50 },
        { x: 230, y: this.groundY - 30 },
        { x: 220, y: this.groundY - 10 }
      ]
    };

    // Landmarks / Interactive Zones
    this.zones = [
      {
        id: 'gate',
        name: 'The Iron Gate & Ticket Booth',
        x: 440,
        y: this.groundY - 140,
        width: 120,
        height: 140,
        prompt: '[E] Inspect Ticket Booth',
        action: () => window.gamePuzzles.openTicketPuzzle()
      },
      {
        id: 'carousel',
        name: 'The Haunted Stopped Carousel',
        x: 1120,
        y: this.groundY - 200,
        width: 220,
        height: 200,
        prompt: '[E] Inspect Carousel Gears',
        action: () => window.gamePuzzles.openCarouselPuzzle()
      },
      {
        id: 'bell',
        name: 'The Silent Bell Tower',
        x: 1820,
        y: this.groundY - 280,
        width: 140,
        height: 280,
        prompt: '[E] Pull Silent Bell Rope',
        action: () => this.story.ringSilentBell()
      },
      {
        id: 'mirrors',
        name: 'The Hall of Cracked Mirrors',
        x: 2520,
        y: this.groundY - 180,
        width: 180,
        height: 180,
        prompt: '[E] Step into Mirror Hall',
        action: () => window.gamePuzzles.openMirrorPuzzle()
      },
      {
        id: 'tent',
        name: 'The Clockmaker\'s Tent',
        x: 3260,
        y: this.groundY - 240,
        width: 220,
        height: 240,
        prompt: () => this.story.tentUnlocked ? '[E] Enter Sanctuary' : 'Locked by Temporal Ward',
        action: () => {
          if (this.story.tentUnlocked) {
            this.story.showClockmakerEncounter();
          } else {
            this.story.showModal('TEMPORAL WARD', `
              <div class="dialogue-text">
                Massive interlocking bronze clock gears lock the velvet flaps of the Clockmaker\'s tent.
                <br><br>
                <span style="color: var(--crimson-bright); font-style: normal; font-weight: 600;">
                  "Only when the Silent Bell tolls thirteen times shall the keeper\'s sanctuary open."
                </span>
              </div>
            `, [{ text: 'Return', action: 'close' }]);
          }
        }
      }
    ];

    this.activeZone = null;

    // Atmospheric Particles (Fog, Soul motes, Embers)
    this.particles = [];
    this.initParticles();

    // Time ticker for ambient animations
    this.ambientTime = 0;
  }

  initParticles() {
    for (let i = 0; i < 75; i++) {
      this.particles.push({
        x: Math.random() * this.worldWidth,
        y: this.groundY - Math.random() * 220,
        size: Math.random() * 45 + 20,
        speedX: Math.random() * 0.4 + 0.2,
        speedY: (Math.random() - 0.5) * 0.1,
        alpha: Math.random() * 0.12 + 0.04,
        type: 'fog'
      });
    }

    for (let i = 0; i < 35; i++) {
      this.particles.push({
        x: Math.random() * this.worldWidth,
        y: Math.random() * this.worldHeight,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: -Math.random() * 0.6 - 0.2,
        alpha: Math.random() * 0.7 + 0.3,
        color: Math.random() > 0.4 ? '#3df3d8' : '#e63946',
        type: 'soul'
      });
    }
  }

  update(dt, input) {
    this.ambientTime += dt;

    if (!this.rewind.isRewinding) {
      // Horizontal Vlad Movement
      this.vlad.vx = 0;
      this.vlad.isMoving = false;

      if (input.left) {
        this.vlad.vx = -this.vlad.speed;
        this.vlad.facing = -1;
        this.vlad.isMoving = true;
      }
      if (input.right) {
        this.vlad.vx = this.vlad.speed;
        this.vlad.facing = 1;
        this.vlad.isMoving = true;
      }

      // Jump
      if (input.jump && this.vlad.isGrounded) {
        this.vlad.vy = this.vlad.jumpForce;
        this.vlad.isGrounded = false;
        window.gameAudio.ensureContext();
      }

      // Apply Gravity
      this.vlad.vy += this.vlad.gravity;
      this.vlad.x += this.vlad.vx;
      this.vlad.y += this.vlad.vy;

      // Ground Collision
      if (this.vlad.y >= this.groundY - this.vlad.height) {
        this.vlad.y = this.groundY - this.vlad.height;
        this.vlad.vy = 0;
        this.vlad.isGrounded = true;
      }

      // World Boundary Constraints
      this.vlad.x = Math.max(40, Math.min(this.worldWidth - 80, this.vlad.x));

      // Walk cycle animation frame
      if (this.vlad.isMoving && this.vlad.isGrounded) {
        this.vlad.walkFrame += 0.18;
        if (Math.sin(this.vlad.walkFrame * 2) > 0.95) {
          window.gameAudio.playFootstep();
        }
      } else {
        this.vlad.walkFrame = 0;
      }

      // Update Cape Soft Physics
      this.updateCapePhysics();
    }

    // Smooth Camera Tracking with Lookahead
    const targetCamX = this.vlad.x - this.camera.width * 0.42 + (this.vlad.facing * 80);
    this.camera.x += (targetCamX - this.camera.x) * 0.08;
    this.camera.x = Math.max(0, Math.min(this.worldWidth - this.camera.width, this.camera.x));

    // Update Particles
    this.updateParticles();

    // Check Interactive Zone Collisions
    this.checkZoneInteraction();
  }

  updateCapePhysics() {
    const anchorX = this.vlad.x + (this.vlad.facing === 1 ? 12 : 28);
    const anchorY = this.vlad.y + 24;

    this.vlad.capeTrail[0] = { x: anchorX, y: anchorY };

    for (let i = 1; i < this.vlad.capeTrail.length; i++) {
      const prev = this.vlad.capeTrail[i - 1];
      const cur = this.vlad.capeTrail[i];

      // Drag behind movement
      const targetX = prev.x - (this.vlad.facing * 10) - (this.vlad.vx * 1.8);
      const targetY = prev.y + 16 + Math.sin(this.ambientTime * 3 + i) * 2;

      cur.x += (targetX - cur.x) * 0.35;
      cur.y += (targetY - cur.y) * 0.35;
    }
  }

  updateParticles() {
    this.particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      if (p.type === 'fog') {
        if (p.x > this.worldWidth) p.x = -p.size;
      } else if (p.type === 'soul') {
        if (p.y < 0) {
          p.y = this.worldHeight;
          p.x = Math.random() * this.worldWidth;
        }
      }
    });
  }

  checkZoneInteraction() {
    this.activeZone = null;
    const vladCenterX = this.vlad.x + this.vlad.width / 2;

    for (const zone of this.zones) {
      if (vladCenterX >= zone.x && vladCenterX <= zone.x + zone.width) {
        this.activeZone = zone;
        break;
      }
    }

    const promptEl = document.getElementById('interaction-prompt');
    const locBadge = document.getElementById('location-name-txt');

    if (this.activeZone) {
      if (promptEl) {
        promptEl.style.display = 'flex';
        const screenX = this.activeZone.x + this.activeZone.width / 2 - this.camera.x;
        const screenY = this.activeZone.y - 15;
        promptEl.style.left = `${Math.max(120, Math.min(1160, screenX))}px`;
        promptEl.style.top = `${screenY}px`;
        const promptText = typeof this.activeZone.prompt === 'function' ? this.activeZone.prompt() : this.activeZone.prompt;
        promptEl.innerText = promptText;
      }
      if (locBadge) locBadge.innerText = this.activeZone.name;
    } else {
      if (promptEl) promptEl.style.display = 'none';
      if (locBadge) locBadge.innerText = 'Carnival Nocturne Grounds';
    }
  }

  interact() {
    if (this.activeZone && typeof this.activeZone.action === 'function') {
      window.gameAudio.ensureContext();
      window.gameAudio.playClick();
      this.activeZone.action();
    }
  }

  // ==========================================
  // RENDERING PIPELINE
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Layer 1: Gothic Night Sky & Blood Moon (Parallax 0.08)
    this.renderSkyAndMoon(ctx);

    // Layer 2: Distant Carnival Skyline & Ferris Wheel (Parallax 0.25)
    this.renderDistantCarnival(ctx);

    // Layer 3: Midground Tents & Fog (Parallax 0.5)
    this.renderMidgroundTents(ctx);

    // Layer 4: Foreground Cobblestone Street & Carnival Landmarks
    this.renderLandmarksAndGround(ctx);

    // Layer 5: Rewind Ghost Shadows
    this.rewind.renderGhosts(ctx, this.camera);

    // Layer 6: Vlad Protagonist
    this.renderVlad(ctx);

    // Layer 7: Fog & Soul Particles
    this.renderParticles(ctx);

    // Layer 8: Gas Lamp Lighting & Vignette Overlay
    this.renderLightingAndAtmosphere(ctx);
  }

  renderSkyAndMoon(ctx) {
    const camOffset = this.camera.x * 0.08;

    // Deep midnight gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 480);
    skyGrad.addColorStop(0, '#04020a');
    skyGrad.addColorStop(0.5, '#120b22');
    skyGrad.addColorStop(1, '#1b122e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Distant Blood Moon
    const moonX = 880 - camOffset;
    const moonY = 150;

    // Moon halo
    const haloGrad = ctx.createRadialGradient(moonX, moonY, 20, moonX, moonY, 140);
    haloGrad.addColorStop(0, 'rgba(230, 57, 70, 0.4)');
    haloGrad.addColorStop(0.6, 'rgba(157, 78, 221, 0.15)');
    haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 140, 0, Math.PI * 2);
    ctx.fill();

    // Crimson Moon Disc
    ctx.fillStyle = '#fce4dc';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 48, 0, Math.PI * 2);
    ctx.fill();

    // Blood lunar shadow
    ctx.fillStyle = 'rgba(180, 25, 45, 0.5)';
    ctx.beginPath();
    ctx.arc(moonX - 10, moonY + 5, 42, 0, Math.PI * 2);
    ctx.fill();
  }

  renderDistantCarnival(ctx) {
    const camOffset = this.camera.x * 0.25;

    ctx.save();
    ctx.fillStyle = '#0c0717';

    // Distant Skeletal Ferris Wheel
    const wheelX = 600 - camOffset;
    const wheelY = 320;
    const wheelRadius = 130;

    ctx.strokeStyle = '#1b122c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wheelX, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + (this.ambientTime * 0.05);
      ctx.beginPath();
      ctx.moveTo(wheelX, wheelY);
      ctx.lineTo(wheelX + Math.cos(angle) * wheelRadius, wheelY + Math.sin(angle) * wheelRadius);
      ctx.stroke();
    }

    // Distant spires and tent silhouettes
    for (let i = -2; i < 15; i++) {
      const spireX = i * 260 - camOffset;
      ctx.beginPath();
      ctx.moveTo(spireX, this.groundY - 80);
      ctx.lineTo(spireX + 60, this.groundY - 260);
      ctx.lineTo(spireX + 120, this.groundY - 80);
      ctx.fill();
    }
    ctx.restore();
  }

  renderMidgroundTents(ctx) {
    const camOffset = this.camera.x * 0.5;

    ctx.save();
    for (let i = -1; i < 10; i++) {
      const tentX = i * 420 - camOffset;
      const tentY = this.groundY - 140;

      // Striped Carnival Big Tops in shadow
      ctx.fillStyle = i % 2 === 0 ? '#160d26' : '#221438';
      ctx.beginPath();
      ctx.moveTo(tentX, this.groundY);
      ctx.lineTo(tentX + 100, tentY);
      ctx.lineTo(tentX + 200, this.groundY);
      ctx.closePath();
      ctx.fill();

      // Distant amber lantern glow
      ctx.fillStyle = 'rgba(245, 215, 127, 0.15)';
      ctx.beginPath();
      ctx.arc(tentX + 100, tentY + 40, 25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  renderLandmarksAndGround(ctx) {
    const camX = this.camera.x;

    // 1. Cobblestone Ground
    ctx.fillStyle = '#0f0b1a';
    ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

    // Stone trim border
    ctx.strokeStyle = '#3a2b1b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, this.groundY);
    ctx.lineTo(this.canvas.width, this.groundY);
    ctx.stroke();

    // Cobblestone tiles and puddle reflections
    for (let x = - (camX % 60); x < this.canvas.width; x += 60) {
      ctx.strokeStyle = '#1b1427';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, this.groundY + 8, 56, 24);
      ctx.strokeRect(x + 28, this.groundY + 32, 56, 24);
    }

    // 2. Render Zone 1: The Iron Gate & Ticket Booth (x: 440)
    this.renderTicketBooth(ctx, 440 - camX);

    // 3. Render Zone 2: The Stopped Carousel (x: 1120)
    this.renderCarousel(ctx, 1120 - camX);

    // 4. Render Zone 3: The Silent Bell Tower (x: 1820)
    this.renderBellTower(ctx, 1820 - camX);

    // 5. Render Zone 4: The Hall of Cracked Mirrors (x: 2520)
    this.renderMirrorHall(ctx, 2520 - camX);

    // 6. Render Zone 5: The Clockmaker's Grand Pavilion (x: 3260)
    this.renderClockmakerTent(ctx, 3260 - camX);
  }

  renderTicketBooth(ctx, screenX) {
    // Wrought Iron Gate
    ctx.strokeStyle = '#5a4832';
    ctx.lineWidth = 4;
    for (let gx = screenX - 60; gx <= screenX - 10; gx += 12) {
      ctx.beginPath();
      ctx.moveTo(gx, this.groundY);
      ctx.lineTo(gx, this.groundY - 120);
      ctx.stroke();
      // Fleur-de-lis tip
      ctx.fillStyle = '#c99e46';
      ctx.beginPath();
      ctx.arc(gx, this.groundY - 124, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Booth booth frame
    ctx.fillStyle = '#1c130d';
    ctx.strokeStyle = '#c99e46';
    ctx.lineWidth = 2;
    ctx.fillRect(screenX, this.groundY - 140, 110, 140);
    ctx.strokeRect(screenX, this.groundY - 140, 110, 140);

    // Striped awning
    ctx.fillStyle = '#7a1824';
    ctx.beginPath();
    ctx.moveTo(screenX - 10, this.groundY - 140);
    ctx.lineTo(screenX + 55, this.groundY - 175);
    ctx.lineTo(screenX + 120, this.groundY - 140);
    ctx.fill();

    // Signboard: "12:13"
    ctx.fillStyle = '#08050e';
    ctx.fillRect(screenX + 15, this.groundY - 110, 80, 26);
    ctx.strokeStyle = '#c99e46';
    ctx.strokeRect(screenX + 15, this.groundY - 110, 80, 26);
    ctx.fillStyle = this.story.memoryEchoes.ticket.collected ? '#3df3d8' : '#f5d77f';
    ctx.font = '11px Cinzel, serif';
    ctx.fillText('ADMIT 12:13', screenX + 22, this.groundY - 93);

    // Glow if echo not collected
    if (!this.story.memoryEchoes.ticket.collected) {
      this.drawPulseGlow(ctx, screenX + 55, this.groundY - 50, '#f5d77f');
    }
  }

  renderCarousel(ctx, screenX) {
    const isCollected = this.story.memoryEchoes.carousel.collected;
    const carouselY = this.groundY - 180;

    // Canopy Roof
    ctx.fillStyle = '#2c1220';
    ctx.beginPath();
    ctx.moveTo(screenX, carouselY + 40);
    ctx.lineTo(screenX + 100, carouselY - 40);
    ctx.lineTo(screenX + 200, carouselY + 40);
    ctx.closePath();
    ctx.fill();

    // Ornate finial peak
    ctx.fillStyle = '#c99e46';
    ctx.beginPath();
    ctx.arc(screenX + 100, carouselY - 45, 10, 0, Math.PI * 2);
    ctx.fill();

    // Center Clockwork Pillar
    ctx.fillStyle = '#1c1528';
    ctx.fillRect(screenX + 85, carouselY + 40, 30, 140);

    // Rotating gears if spinning/active
    ctx.strokeStyle = '#c99e46';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(screenX + 100, carouselY + 100, 24, 0, Math.PI * 2);
    ctx.stroke();

    // Skeletal Carousel Horses
    const horseOffset = isCollected ? Math.sin(this.ambientTime * 3) * 12 : 0;
    this.drawSkeletalHorse(ctx, screenX + 35, carouselY + 110 + horseOffset);
    this.drawSkeletalHorse(ctx, screenX + 155, carouselY + 120 - horseOffset);

    // Glow if echo not collected
    if (!isCollected) {
      this.drawPulseGlow(ctx, screenX + 100, carouselY + 100, '#e63946');
    }
  }

  drawSkeletalHorse(ctx, x, y) {
    ctx.save();
    ctx.strokeStyle = '#eae1cf';
    ctx.lineWidth = 2.5;

    // Vertical pole
    ctx.beginPath();
    ctx.moveTo(x, y - 50);
    ctx.lineTo(x, y + 40);
    ctx.stroke();

    // Horse skull and spine
    ctx.fillStyle = '#eae1cf';
    ctx.beginPath();
    ctx.ellipse(x + 12, y - 20, 12, 6, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Ribcage lines
    for (let r = 0; r < 3; r++) {
      ctx.beginPath();
      ctx.moveTo(x + 4 - r * 6, y - 10);
      ctx.lineTo(x + 4 - r * 6, y + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  renderBellTower(ctx, screenX) {
    const towerY = this.groundY - 260;

    // Stone Belfry Pillars
    ctx.fillStyle = '#181224';
    ctx.strokeStyle = '#3e2d1d';
    ctx.lineWidth = 2;
    ctx.fillRect(screenX, towerY, 130, 260);
    ctx.strokeRect(screenX, towerY, 130, 260);

    // Gothic Arch Opening
    ctx.fillStyle = '#090610';
    ctx.beginPath();
    ctx.arc(screenX + 65, towerY + 70, 42, Math.PI, 0);
    ctx.lineTo(screenX + 107, towerY + 160);
    ctx.lineTo(screenX + 23, towerY + 160);
    ctx.closePath();
    ctx.fill();

    // Giant Brass Bell
    const bellSway = Math.sin(this.story.silentBellRings * 0.8) * (this.story.silentBellRings > 0 ? 4 : 0);
    ctx.save();
    ctx.translate(screenX + 65, towerY + 50);
    ctx.rotate((bellSway * Math.PI) / 180);

    ctx.fillStyle = '#c99e46';
    ctx.beginPath();
    ctx.arc(0, 0, 28, Math.PI, 0);
    ctx.lineTo(36, 45);
    ctx.lineTo(-36, 45);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#5a3d13';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Bell Clapper & Hanging Rope
    ctx.fillStyle = '#3a2b13';
    ctx.fillRect(-3, 40, 6, 120);

    ctx.restore();

    // Inscribed Floor Sigil (Roman Numerals)
    ctx.strokeStyle = this.story.tentUnlocked ? '#3df3d8' : '#876222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(screenX + 65, this.groundY, 50, Math.PI, 0);
    ctx.stroke();

    // Glowing Bell Rope handle
    this.drawPulseGlow(ctx, screenX + 65, this.groundY - 70, this.story.hasAllEchoes() ? '#3df3d8' : '#c99e46');
  }

  renderMirrorHall(ctx, screenX) {
    const isCollected = this.story.memoryEchoes.mirror.collected;
    const hallY = this.groundY - 170;

    // Tent facade
    ctx.fillStyle = '#20112c';
    ctx.fillRect(screenX, hallY, 160, 170);

    // Ornate Gilded Mirror Frames
    ctx.strokeStyle = '#c99e46';
    ctx.lineWidth = 3;
    ctx.strokeRect(screenX + 20, hallY + 30, 50, 110);
    ctx.strokeRect(screenX + 90, hallY + 30, 50, 110);

    // Silver Mirror Surface
    ctx.fillStyle = '#171a2a';
    ctx.fillRect(screenX + 23, hallY + 33, 44, 104);
    ctx.fillRect(screenX + 93, hallY + 33, 44, 104);

    // Jagged crack in right mirror
    ctx.strokeStyle = '#3df3d8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(screenX + 115, hallY + 33);
    ctx.lineTo(screenX + 110, hallY + 80);
    ctx.lineTo(screenX + 125, hallY + 110);
    ctx.lineTo(screenX + 105, hallY + 137);
    ctx.stroke();

    // Light ray cutting down
    const rayGrad = ctx.createLinearGradient(screenX + 20, hallY - 40, screenX + 115, hallY + 80);
    rayGrad.addColorStop(0, 'rgba(61, 243, 216, 0.4)');
    rayGrad.addColorStop(1, 'rgba(61, 243, 216, 0)');
    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(screenX + 20, hallY - 40);
    ctx.lineTo(screenX + 125, hallY + 80);
    ctx.lineTo(screenX + 105, hallY + 80);
    ctx.closePath();
    ctx.fill();

    if (!isCollected) {
      this.drawPulseGlow(ctx, screenX + 115, hallY + 80, '#3df3d8');
    }
  }

  renderClockmakerTent(ctx, screenX) {
    const isUnlocked = this.story.tentUnlocked;
    const tentY = this.groundY - 240;

    // Grand Big Top
    ctx.fillStyle = isUnlocked ? '#231238' : '#140c1e';
    ctx.beginPath();
    ctx.moveTo(screenX, this.groundY);
    ctx.lineTo(screenX + 100, tentY);
    ctx.lineTo(screenX + 200, this.groundY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#c99e46';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Giant Clock Gears atop tent
    const gearRot = this.ambientTime * (isUnlocked ? 1.5 : 0.2);
    ctx.save();
    ctx.translate(screenX + 100, tentY);
    ctx.rotate(gearRot);
    ctx.strokeStyle = isUnlocked ? '#3df3d8' : '#876222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.stroke();
    for (let g = 0; g < 6; g++) {
      const a = (g * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 35, Math.sin(a) * 35);
      ctx.stroke();
    }
    ctx.restore();

    // Entrance Curtains
    if (isUnlocked) {
      // Golden glowing interior doorway
      const doorwayGrad = ctx.createRadialGradient(screenX + 100, this.groundY - 60, 10, screenX + 100, this.groundY - 60, 60);
      doorwayGrad.addColorStop(0, '#fce096');
      doorwayGrad.addColorStop(0.7, '#c99e46');
      doorwayGrad.addColorStop(1, '#0e0818');
      ctx.fillStyle = doorwayGrad;
      ctx.fillRect(screenX + 70, this.groundY - 120, 60, 120);
      this.drawPulseGlow(ctx, screenX + 100, this.groundY - 60, '#f5d77f');
    } else {
      // Sealed with ethereal chains
      ctx.fillStyle = '#06040d';
      ctx.fillRect(screenX + 75, this.groundY - 110, 50, 110);
      ctx.strokeStyle = '#e63946';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX + 70, this.groundY - 110);
      ctx.lineTo(screenX + 130, this.groundY);
      ctx.moveTo(screenX + 130, this.groundY - 110);
      ctx.lineTo(screenX + 70, this.groundY);
      ctx.stroke();
    }
  }

  drawPulseGlow(ctx, x, y, color) {
    const pulse = (Math.sin(this.ambientTime * 4) + 1) * 0.5;
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12 + pulse * 10;
    ctx.beginPath();
    ctx.arc(x, y, 6 + pulse * 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  renderVlad(ctx) {
    const v = this.vlad;
    const screenX = v.x - this.camera.x;
    const screenY = v.y;

    ctx.save();

    // 1. Render Flowing Crimson-Lined Cape behind body
    if (v.capeTrail && v.capeTrail.length >= 4) {
      // Crimson silk inside
      ctx.fillStyle = '#96172e';
      ctx.beginPath();
      ctx.moveTo(screenX + (v.facing === 1 ? 14 : 26), screenY + 28);
      v.capeTrail.forEach(pt => {
        ctx.lineTo(pt.x - this.camera.x, pt.y);
      });
      ctx.lineTo(screenX + (v.facing === 1 ? 26 : 14), screenY + 65);
      ctx.closePath();
      ctx.fill();

      // Obsidian outer cape
      ctx.fillStyle = '#08060f';
      ctx.beginPath();
      ctx.moveTo(screenX + (v.facing === 1 ? 16 : 24), screenY + 26);
      v.capeTrail.forEach(pt => {
        ctx.lineTo(pt.x - this.camera.x - (v.facing * 4), pt.y + 2);
      });
      ctx.lineTo(screenX + (v.facing === 1 ? 22 : 18), screenY + 70);
      ctx.closePath();
      ctx.fill();
    }

    // 2. Vlad's Body & Victorian Tailcoat
    const bobY = Math.sin(v.walkFrame * 2) * 2;
    ctx.fillStyle = '#110c1e';
    ctx.fillRect(screenX + 12, screenY + 26 + bobY, 16, 36);

    // Tailcoat tails
    ctx.fillStyle = '#08050e';
    ctx.beginPath();
    ctx.moveTo(screenX + 12, screenY + 60 + bobY);
    ctx.lineTo(screenX + (v.facing === 1 ? 6 : 26), screenY + 76 + bobY);
    ctx.lineTo(screenX + 28, screenY + 60 + bobY);
    ctx.fill();

    // Legs with walk cycle
    const legOffset = Math.sin(v.walkFrame) * 6;
    ctx.strokeStyle = '#06040b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(screenX + 16, screenY + 62 + bobY);
    ctx.lineTo(screenX + 16 + legOffset, screenY + 88);
    ctx.moveTo(screenX + 24, screenY + 62 + bobY);
    ctx.lineTo(screenX + 24 - legOffset, screenY + 88);
    ctx.stroke();

    // Tall Gothic Collar
    ctx.fillStyle = '#e63946';
    ctx.beginPath();
    ctx.moveTo(screenX + 12, screenY + 24 + bobY);
    ctx.lineTo(screenX + 10, screenY + 12 + bobY);
    ctx.lineTo(screenX + 20, screenY + 20 + bobY);
    ctx.fill();

    // Pale Visage / Face
    ctx.fillStyle = '#f5efe6';
    ctx.beginPath();
    ctx.arc(screenX + 20, screenY + 18 + bobY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glowing Crimson Vampire Eyes
    ctx.fillStyle = '#ff2a3d';
    ctx.shadowColor = '#ff2a3d';
    ctx.shadowBlur = 6;
    const eyeX = screenX + 20 + (v.facing * 3);
    ctx.fillRect(eyeX, screenY + 16 + bobY, 2, 2);

    // Victorian Top Hat
    ctx.fillStyle = '#0a0714';
    ctx.fillRect(screenX + 10, screenY + 10 + bobY, 20, 3); // Brim
    ctx.fillRect(screenX + 13, screenY - 4 + bobY, 14, 14); // Crown
    // Crimson Hat Ribbon
    ctx.fillStyle = '#c99e46';
    ctx.fillRect(screenX + 13, screenY + 8 + bobY, 14, 2);

    // Magical Chronos Heart in hand (Glowing gold/cyan pocket watch)
    const handX = screenX + 20 + (v.facing * 12);
    const handY = screenY + 40 + bobY;
    ctx.fillStyle = '#c99e46';
    ctx.beginPath();
    ctx.arc(handX, handY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3df3d8';
    ctx.shadowColor = '#3df3d8';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(handX, handY, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderParticles(ctx) {
    const camX = this.camera.x;

    this.particles.forEach(p => {
      const screenX = p.x - camX;
      if (screenX < -60 || screenX > this.canvas.width + 60) return;

      if (p.type === 'fog') {
        const fogGrad = ctx.createRadialGradient(screenX, p.y, 4, screenX, p.y, p.size);
        fogGrad.addColorStop(0, `rgba(75, 55, 105, ${p.alpha})`);
        fogGrad.addColorStop(1, 'rgba(10, 6, 20, 0)');
        ctx.fillStyle = fogGrad;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'soul') {
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
      }
    });
  }

  renderLightingAndAtmosphere(ctx) {
    // Lampposts light cones
    const camX = this.camera.x;
    const lamps = [350, 950, 1650, 2350, 3050];

    lamps.forEach(lx => {
      const sx = lx - camX;
      if (sx < -100 || sx > this.canvas.width + 100) return;

      // Lamppost pole
      ctx.fillStyle = '#1b1424';
      ctx.fillRect(sx - 3, this.groundY - 130, 6, 130);

      // Lantern cage
      ctx.strokeStyle = '#c99e46';
      ctx.lineWidth = 2;
      ctx.strokeRect(sx - 10, this.groundY - 145, 20, 20);

      // Light cone
      const lightGrad = ctx.createRadialGradient(sx, this.groundY - 135, 10, sx, this.groundY, 150);
      lightGrad.addColorStop(0, 'rgba(245, 215, 127, 0.35)');
      lightGrad.addColorStop(0.5, 'rgba(201, 158, 70, 0.12)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = lightGrad;
      ctx.beginPath();
      ctx.arc(sx, this.groundY - 135, 150, 0, Math.PI);
      ctx.fill();
    });

    // Dark vignette around edges
    const vigGrad = ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 400,
      this.canvas.width / 2, this.canvas.height / 2, 750
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, 'rgba(3, 1, 8, 0.7)');
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

window.GameEngine = GameEngine;
