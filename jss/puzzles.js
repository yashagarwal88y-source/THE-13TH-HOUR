/**
 * THE 13TH HOUR - Puzzles System (Simple, Fun & Interactive)
 * Contains:
 * 1. Ticket Dials (Echo 1)
 * 2. Carousel Gear Alignment (Echo 2)
 * 3. Cracked Mirror Reflection (Echo 3)
 * 4. NEW: Fortune Teller's Tarot Match
 * 5. NEW: Phantom Ring Toss Carnival Stall
 */

class PuzzleSystem {
  constructor(story) {
    this.story = story;

    // Puzzle 1: Ticket Dials
    this.ticketDials = { hour: 11, min: 10, zodiac: 2 };
    this.zodiacValues = ['X', 'XI', 'XII', 'XIII'];

    // Puzzle 2: Carousel
    this.gearAngle = 45;
    this.gearSpinning = false;
    this.gearHistory = [];

    // Puzzle 3: Mirror Shards
    this.mirrorTiles = [
      { id: 0, angle: 0 },
      { id: 1, angle: 1 },
      { id: 2, angle: 0 },
      { id: 3, angle: 1 }
    ];

    // Puzzle 4: Tarot Match (6 cards = 3 pairs)
    this.tarotCards = [
      { id: 0, icon: '🦇', name: 'Vampire', flipped: false, matched: false },
      { id: 1, icon: '⏳', name: 'Hourglass', flipped: false, matched: false },
      { id: 2, icon: '🦋', name: 'Butterfly', flipped: false, matched: false },
      { id: 3, icon: '🦇', name: 'Vampire', flipped: false, matched: false },
      { id: 4, icon: '⏳', name: 'Hourglass', flipped: false, matched: false },
      { id: 5, icon: '🦋', name: 'Butterfly', flipped: false, matched: false }
    ];
    this.tarotSelected = [];

    // Puzzle 5: Ring Toss
    this.ringX = 50;
    this.ringDirection = 1;
    this.ringInterval = null;
    this.ringScore = 0;
  }

  // ==========================================
  // PUZZLE 1: TICKET BOOTH DIALS (ECHO 1)
  // ==========================================
  openTicketPuzzle() {
    if (this.story.memoryEchoes.ticket.collected) {
      this.story.showModal('TICKET BOOTH', `
        <div class="dialogue-text" style="text-align: center;">
          The ticket drawer is already opened and the Memory Echo collected!
        </div>
      `, [{ text: 'Close', action: 'close' }]);
      return;
    }

    const modalBody = `
      <div style="text-align: center;">
        <div style="font-size: 15px; color: var(--text-parchment); margin-bottom: 14px; line-height: 1.5;">
          Enter the time the clock froze<br>
          <span style="color: var(--crimson-bright); font-size: 13px;">(HINT: It is an eerily common time)</span>
        </div>

        <div class="ticket-dials-row" style="margin-bottom: 16px;">
          <div class="dial-column">
            <span style="font-size: 11px; color: var(--text-muted);">HOUR</span>
            <button class="dial-btn" onclick="window.gamePuzzles.adjustTicketDial('hour', 1)">▲</button>
            <div class="dial-value" id="ticket-dial-hour">${this.ticketDials.hour}</div>
            <button class="dial-btn" onclick="window.gamePuzzles.adjustTicketDial('hour', -1)">▼</button>
          </div>

          <div class="dial-column">
            <span style="font-size: 11px; color: var(--text-muted);">MINUTE</span>
            <button class="dial-btn" onclick="window.gamePuzzles.adjustTicketDial('min', 1)">▲</button>
            <div class="dial-value" id="ticket-dial-min">${this.ticketDials.min < 10 ? '0' + this.ticketDials.min : this.ticketDials.min}</div>
            <button class="dial-btn" onclick="window.gamePuzzles.adjustTicketDial('min', -1)">▼</button>
          </div>

          <div class="dial-column">
            <span style="font-size: 11px; color: var(--text-muted);">GATE</span>
            <button class="dial-btn" onclick="window.gamePuzzles.adjustTicketDial('zodiac', 1)">▲</button>
            <div class="dial-value" id="ticket-dial-zodiac" style="color: var(--crimson-bright); font-size: 15px;">${this.zodiacValues[this.ticketDials.zodiac]}</div>
            <button class="dial-btn" onclick="window.gamePuzzles.adjustTicketDial('zodiac', -1)">▼</button>
          </div>
        </div>

        <div style="font-size: 12px; color: var(--text-muted);">
          Align the three brass tumblers to unlock the admission drawer.
        </div>
      </div>
    `;

    this.story.showModal('TICKET BOOTH TUMBLER', modalBody, [{ text: 'Cancel', action: 'close' }]);
  }

  adjustTicketDial(type, delta) {
    window.gameAudio.playGearClick();

    if (type === 'hour') {
      this.ticketDials.hour = ((this.ticketDials.hour - 1 + delta + 12) % 12) + 1;
      const el = document.getElementById('ticket-dial-hour');
      if (el) el.innerText = this.ticketDials.hour;
    } else if (type === 'min') {
      this.ticketDials.min = (this.ticketDials.min + delta + 60) % 60;
      const el = document.getElementById('ticket-dial-min');
      if (el) el.innerText = this.ticketDials.min < 10 ? '0' + this.ticketDials.min : this.ticketDials.min;
    } else if (type === 'zodiac') {
      this.ticketDials.zodiac = (this.ticketDials.zodiac + delta + this.zodiacValues.length) % this.zodiacValues.length;
      const el = document.getElementById('ticket-dial-zodiac');
      if (el) el.innerText = this.zodiacValues[this.ticketDials.zodiac];
    }

    if (this.ticketDials.hour === 12 && this.ticketDials.min === 13 && this.zodiacValues[this.ticketDials.zodiac] === 'XIII') {
      setTimeout(() => {
        this.story.closeModal();
        this.story.collectEcho('ticket');
      }, 300);
    }
  }

  // ==========================================
  // PUZZLE 2: STOPPED CAROUSEL GEARS (ECHO 2)
  // ==========================================
  openCarouselPuzzle() {
    if (this.story.memoryEchoes.carousel.collected) {
      this.story.showModal('THE HAUNTED CAROUSEL', `
        <div class="dialogue-text" style="text-align: center;">
          The carousel gears are spinning smoothly! Memory Echo collected.
        </div>
      `, [{ text: 'Close', action: 'close' }]);
      return;
    }

    const modalBody = `
      <div style="text-align: center;">
        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 10px;">
          Lock the spinning gear at the <strong style="color: var(--spectral-cyan);">180° Target Mark</strong>!
        </div>

        <div class="gear-puzzle-area">
          <canvas id="gearCanvas" width="560" height="200" style="width: 100%; height: 100%; display: block;"></canvas>
        </div>

        <div style="display: flex; justify-content: center; gap: 12px; margin-top: 14px;">
          <button class="gothic-btn" id="gear-spin-btn" onclick="window.gamePuzzles.toggleGearSpin()">
            Spin Drive Gear
          </button>
          <button class="gothic-btn" style="border-color: var(--spectral-cyan); color: #fff; font-weight: bold;" onclick="window.gamePuzzles.lockGearPin()">
            🎯 Lock Pin (180°)
          </button>
          <button class="gothic-btn choice-btn-break" onclick="window.gamePuzzles.rewindGear()">
            ⏪ Rewind Gear
          </button>
        </div>
      </div>
    `;

    this.story.showModal('CAROUSEL GEAR ENGINE', modalBody, [{ text: 'Cancel', action: 'close' }]);
    setTimeout(() => this.startGearCanvas(), 80);
  }

  startGearCanvas() {
    const canvas = document.getElementById('gearCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    this.gearAngle = 40;
    this.gearSpinning = true;
    this.gearHistory = [];

    const btn = document.getElementById('gear-spin-btn');
    if (btn) btn.innerText = 'Pause Gear';

    const render = () => {
      if (!document.getElementById('gearCanvas')) return;
      ctx.fillStyle = '#0a0815';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (this.gearSpinning) {
        this.gearAngle = (this.gearAngle + 2.8) % 360;
        this.gearHistory.push(this.gearAngle);
        if (this.gearHistory.length > 500) this.gearHistory.shift();
      }

      // Draw Gear
      const cx = 280;
      const cy = 100;
      const radius = 60;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((this.gearAngle * Math.PI) / 180);

      ctx.fillStyle = '#c99e46';
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const a = (i * Math.PI * 2) / 12;
        ctx.lineTo(Math.cos(a) * (radius + 8), Math.sin(a) * (radius + 8));
        ctx.lineTo(Math.cos(a + 0.2) * (radius - 8), Math.sin(a + 0.2) * (radius - 8));
      }
      ctx.closePath();
      ctx.fill();

      // Gear Notch line
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(radius, 0);
      ctx.stroke();

      ctx.restore();

      // Target Alignment Arc at 180 deg (Left side)
      ctx.strokeStyle = '#3df3d8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 75, Math.PI - 0.35, Math.PI + 0.35);
      ctx.stroke();

      const diff = Math.abs((this.gearAngle % 360) - 180);
      const isAligned = diff < 22 || diff > 338;

      ctx.fillStyle = isAligned ? '#3df3d8' : '#e63946';
      ctx.font = '14px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(this.gearAngle)}° ${isAligned ? '★ TARGET READY!' : ''}`, cx, 190);

      requestAnimationFrame(render);
    };
    render();
  }

  toggleGearSpin() {
    this.gearSpinning = !this.gearSpinning;
    window.gameAudio.playGearClick();
    const btn = document.getElementById('gear-spin-btn');
    if (btn) btn.innerText = this.gearSpinning ? 'Pause Gear' : 'Spin Drive Gear';
  }

  lockGearPin() {
    window.gameAudio.playClick();
    const diff = Math.abs((this.gearAngle % 360) - 180);
    const isAligned = diff < 25 || diff > 335;

    if (isAligned) {
      this.gearSpinning = false;
      window.gameAudio.playEchoCollect();
      setTimeout(() => {
        this.story.closeModal();
        this.story.collectEcho('carousel');
      }, 400);
    } else {
      window.gameAudio.playGlassShatter();
      this.story.showToast('Missed mark! Press "Rewind Gear" to reverse!');
    }
  }

  rewindGear() {
    if (!this.gearHistory || this.gearHistory.length < 5) return;
    window.gameAudio.playRewind();
    for (let i = 0; i < 35 && this.gearHistory.length > 0; i++) {
      this.gearAngle = this.gearHistory.pop();
    }
  }

  // ==========================================
  // PUZZLE 3: CRACKED MIRROR REFLECTION (ECHO 3)
  // ==========================================
  openMirrorPuzzle() {
    if (this.story.memoryEchoes.mirror.collected) {
      this.story.showModal('HALL OF CRACKED MIRRORS', `
        <div class="dialogue-text" style="text-align: center;">
          The silver moonlight is already restored! Memory Echo collected.
        </div>
      `, [{ text: 'Close', action: 'close' }]);
      return;
    }

    const modalBody = `
      <div style="text-align: center;">
        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px;">
          Click the 2 corner shards to direct the moonbeam into the <strong style="color: var(--crimson-bright);">Shattered Heart</strong>!
        </div>

        <div style="position: relative; width: 280px; height: 280px; margin: 0 auto; background: #0c0919; border: 2px solid var(--brass-main); border-radius: 8px; padding: 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;">
          <div class="mirror-tile active-beam" style="cursor: default;">
            <div style="font-size: 22px;">🌙</div>
          </div>
          <div class="mirror-tile" id="mirror-tile-0" onclick="window.gamePuzzles.rotateMirror(0)">
            <div id="mirror-arrow-0" style="font-size: 20px; transform: rotate(${this.mirrorTiles[0].angle * 90}deg);">◢</div>
          </div>
          <div class="mirror-tile" style="opacity: 0.3; cursor: default;"><div style="font-size: 11px; color: #555;">WALL</div></div>

          <div class="mirror-tile" style="opacity: 0.3; cursor: default;"><div style="font-size: 11px; color: #555;">WALL</div></div>
          <div class="mirror-tile" id="mirror-heart-tile" style="border-color: var(--crimson-bright);">
            <div style="font-size: 26px;">💔</div>
          </div>
          <div class="mirror-tile" id="mirror-tile-1" onclick="window.gamePuzzles.rotateMirror(1)">
            <div id="mirror-arrow-1" style="font-size: 20px; transform: rotate(${this.mirrorTiles[1].angle * 90}deg);">◣</div>
          </div>

          <div class="mirror-tile" style="opacity: 0.3; cursor: default;"><div style="font-size: 11px; color: #555;">WALL</div></div>
          <div class="mirror-tile" id="mirror-tile-2" onclick="window.gamePuzzles.rotateMirror(2)">
            <div id="mirror-arrow-2" style="font-size: 20px; transform: rotate(${this.mirrorTiles[2].angle * 90}deg);">◤</div>
          </div>
          <div class="mirror-tile" style="opacity: 0.3; cursor: default;"><div style="font-size: 11px; color: #555;">WALL</div></div>
        </div>

        <button class="gothic-btn" style="margin-top: 12px; border-color: var(--spectral-cyan); color: #fff;" onclick="window.gamePuzzles.autoSolveMirror()">
          ⚡ Quick Align Beam
        </button>
      </div>
    `;

    this.story.showModal('HALL OF CRACKED MIRRORS', modalBody, [{ text: 'Cancel', action: 'close' }]);
  }

  rotateMirror(idx) {
    window.gameAudio.playClick();
    this.mirrorTiles[idx].angle = (this.mirrorTiles[idx].angle + 1) % 4;
    const arrowEl = document.getElementById(`mirror-arrow-${idx}`);
    if (arrowEl) arrowEl.style.transform = `rotate(${this.mirrorTiles[idx].angle * 90}deg)`;

    // Check solution
    if (this.mirrorTiles[0].angle === 2 && this.mirrorTiles[2].angle === 1) {
      this.triggerMirrorWin();
    }
  }

  autoSolveMirror() {
    this.mirrorTiles[0].angle = 2;
    this.mirrorTiles[2].angle = 1;
    this.triggerMirrorWin();
  }

  triggerMirrorWin() {
    const heart = document.getElementById('mirror-heart-tile');
    if (heart) {
      heart.style.boxShadow = '0 0 25px #3df3d8';
      heart.innerHTML = '<div style="font-size: 26px;">❤️</div>';
    }
    window.gameAudio.playEchoCollect();
    setTimeout(() => {
      this.story.closeModal();
      this.story.collectEcho('mirror');
    }, 400);
  }

  // ==========================================
  // PUZZLE 4: MADAME CHRONA'S TAROT MATCH (BONUS)
  // ==========================================
  openTarotPuzzle() {
    this.tarotCards.forEach(c => {
      c.flipped = false;
      c.matched = false;
    });
    this.tarotSelected = [];

    const modalBody = `
      <div style="text-align: center;">
        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 12px;">
          Match 3 pairs of temporal tarot cards to gain bonus Rewind power!
        </div>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-width: 320px; margin: 0 auto;">
          ${this.tarotCards.map((c, i) => `
            <div id="tarot-card-${i}" onclick="window.gamePuzzles.flipTarotCard(${i})" style="height: 90px; background: #1a1226; border: 2px solid var(--brass-main); border-radius: 6px; display: flex; flex-direction: column; justify-content: center; align-items: center; cursor: pointer; transition: transform 0.2s;">
              <div style="font-size: 24px;">🔮</div>
              <span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">CARD ${i + 1}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    this.story.showModal('MADAME CHRONA\'S TAROT TENT', modalBody, [{ text: 'Leave Tent', action: 'close' }]);
  }

  flipTarotCard(idx) {
    const card = this.tarotCards[idx];
    if (card.flipped || card.matched || this.tarotSelected.length >= 2) return;

    window.gameAudio.playClick();
    card.flipped = true;

    const el = document.getElementById(`tarot-card-${idx}`);
    if (el) {
      el.style.borderColor = 'var(--spectral-cyan)';
      el.innerHTML = `<div style="font-size: 32px;">${card.icon}</div><span style="font-size: 11px; color: var(--spectral-cyan);">${card.name}</span>`;
    }

    this.tarotSelected.push(idx);

    if (this.tarotSelected.length === 2) {
      const idxA = this.tarotSelected[0];
      const idxB = this.tarotSelected[1];
      const cardA = this.tarotCards[idxA];
      const cardB = this.tarotCards[idxB];

      if (cardA.name === cardB.name) {
        // Match!
        cardA.matched = true;
        cardB.matched = true;
        this.tarotSelected = [];
        window.gameAudio.playEchoCollect();

        // Check if all matched
        if (this.tarotCards.every(c => c.matched)) {
          this.story.tarotCompleted = true;
          // Restore max rewind energy
          if (window.gameRewind) window.gameRewind.rewindEnergy = 13.0;

          setTimeout(() => {
            this.story.closeModal();
            this.story.showToast('All Tarot pairs matched! +Full Rewind Energy restored!');
          }, 500);
        }
      } else {
        // Mismatch: flip back after brief delay
        setTimeout(() => {
          cardA.flipped = false;
          cardB.flipped = false;
          const elA = document.getElementById(`tarot-card-${idxA}`);
          const elB = document.getElementById(`tarot-card-${idxB}`);
          if (elA) elA.innerHTML = '<div style="font-size: 24px;">🔮</div><span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">CARD</span>';
          if (elB) elB.innerHTML = '<div style="font-size: 24px;">🔮</div><span style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">CARD</span>';
          if (elA) elA.style.borderColor = 'var(--brass-main)';
          if (elB) elB.style.borderColor = 'var(--brass-main)';
          this.tarotSelected = [];
        }, 700);
      }
    }
  }

  // ==========================================
  // PUZZLE 5: PHANTOM RING TOSS (CARNIVAL STALL)
  // ==========================================
  openRingTossPuzzle() {
    this.ringX = 50;
    this.ringDirection = 1;
    this.ringScore = 0;

    const modalBody = `
      <div style="text-align: center;">
        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">
          Toss the glowing Chronos Ring over the <strong style="color: var(--brass-light);">Golden Bottle (Center)</strong>!
        </div>

        <div style="position: relative; width: 100%; height: 160px; background: #0c0819; border: 2px solid var(--brass-main); border-radius: 8px; overflow: hidden; margin-bottom: 12px;">
          <!-- 3 Bottles -->
          <div style="position: absolute; bottom: 20px; left: 25%; font-size: 32px;">🍾</div>
          <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); font-size: 40px; filter: drop-shadow(0 0 10px #f5d77f);">🏆</div>
          <div style="position: absolute; bottom: 20px; right: 25%; font-size: 32px;">🍾</div>

          <!-- Oscillating Ring Indicator -->
          <div id="ring-toss-slider" style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); width: 44px; height: 44px; border: 3px solid #3df3d8; border-radius: 50%; box-shadow: 0 0 12px #3df3d8;"></div>
        </div>

        <div style="display: flex; justify-content: center; gap: 12px;">
          <button class="gothic-btn" style="border-color: var(--spectral-cyan); color: #fff; font-size: 15px; padding: 10px 24px;" onclick="window.gamePuzzles.tossRing()">
            🎯 Toss Ring!
          </button>
          <button class="gothic-btn choice-btn-break" onclick="window.gamePuzzles.rewindRingToss()">
            ⏪ Rewind Toss
          </button>
        </div>
      </div>
    `;

    this.story.showModal('CARNIVAL RING TOSS STALL', modalBody, [{
      text: 'Leave Stall',
      action: () => {
        if (this.ringInterval) clearInterval(this.ringInterval);
        this.story.closeModal();
      }
    }]);

    // Animate ring left-right
    if (this.ringInterval) clearInterval(this.ringInterval);
    this.ringInterval = setInterval(() => {
      this.ringX += this.ringDirection * 2.2;
      if (this.ringX > 82) this.ringDirection = -1;
      if (this.ringX < 18) this.ringDirection = 1;

      const ringEl = document.getElementById('ring-toss-slider');
      if (ringEl) {
        ringEl.style.left = `${this.ringX}%`;
      }
    }, 20);
  }

  tossRing() {
    window.gameAudio.playClick();
    // Center target is at 50% (+/- 8%)
    const dist = Math.abs(this.ringX - 50);

    if (dist <= 8) {
      if (this.ringInterval) clearInterval(this.ringInterval);
      window.gameAudio.playEchoCollect();
      this.story.ringTossCompleted = true;

      setTimeout(() => {
        this.story.closeModal();
        this.story.showToast('BULLSEYE! You won the Golden Carnival Token! (+Max Rewind)');
      }, 400);
    } else {
      window.gameAudio.playGlassShatter();
      this.story.showToast('Missed! Tap "Rewind Toss" to rewind time for a direct hit!');
    }
  }

  rewindRingToss() {
    window.gameAudio.playRewind();
    this.ringX = 50; // Directly snaps to center target
    const ringEl = document.getElementById('ring-toss-slider');
    if (ringEl) ringEl.style.left = '50%';
    this.story.showToast('Time rewound! Ready on bullseye center!');
  }

  // ==========================================
  // PUZZLE 6: THE STEAM ORGAN OF WHISPERS (NEW)
  // ==========================================
  openOrganPuzzle() {
    this.organPipes = [
      { id: 0, note: 'D4', freq: 293.66, color: '#e63946', label: 'Crimson' },
      { id: 1, note: 'F4', freq: 349.23, color: '#f5d77f', label: 'Gold' },
      { id: 2, note: 'A4', freq: 440.00, color: '#3df3d8', label: 'Cyan' },
      { id: 3, note: 'C5', freq: 523.25, color: '#9d4edd', label: 'Violet' }
    ];
    this.organTargetSeq = [2, 1, 0]; // Cyan -> Gold -> Crimson
    this.organInputSeq = [];

    const modalBody = `
      <div style="text-align: center;">
        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">
          Listen to the 3-note phantom melody and repeat it by tapping the pipes!
        </div>

        <div style="display: flex; justify-content: center; gap: 14px; margin: 18px 0;">
          ${this.organPipes.map((p, i) => `
            <div id="organ-pipe-${i}" onclick="window.gamePuzzles.pressOrganPipe(${i})" style="width: 58px; height: 130px; background: linear-gradient(180deg, ${p.color} 0%, #160f24 100%); border: 2px solid #5a4220; border-radius: 8px 8px 3px 3px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; padding: 8px 0; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;">
              <span style="font-size: 10px; font-weight: bold; color: #fff;">${p.note}</span>
              <div style="width: 14px; height: 14px; border-radius: 50%; background: #fff; opacity: 0.7;"></div>
              <span style="font-size: 10px; color: rgba(255,255,255,0.8);">${p.label}</span>
            </div>
          `).join('')}
        </div>

        <div style="display: flex; justify-content: center; gap: 10px;">
          <button class="gothic-btn" style="border-color: var(--brass-main);" onclick="window.gamePuzzles.playOrganMelody()">
            🎵 Play Melody Again
          </button>
          <button class="gothic-btn choice-btn-break" onclick="window.gamePuzzles.rewindOrganNote()">
            ⏪ Rewind Note
          </button>
        </div>
      </div>
    `;

    this.story.showModal('STEAM ORGAN OF WHISPERS', modalBody, [{ text: 'Step Away', action: 'close' }]);

    // Play initial demo sequence
    setTimeout(() => this.playOrganMelody(), 400);
  }

  playOrganMelody() {
    this.organInputSeq = [];
    let delay = 0;
    this.organTargetSeq.forEach((pipeIdx) => {
      setTimeout(() => {
        const pipe = this.organPipes[pipeIdx];
        if (window.gameAudio.playOrganPipe) window.gameAudio.playOrganPipe(pipe.freq);
        const el = document.getElementById(`organ-pipe-${pipeIdx}`);
        if (el) {
          el.style.transform = 'translateY(-8px)';
          el.style.boxShadow = `0 0 20px ${pipe.color}`;
          setTimeout(() => {
            el.style.transform = 'translateY(0)';
            el.style.boxShadow = 'none';
          }, 300);
        }
      }, delay);
      delay += 550;
    });
  }

  pressOrganPipe(idx) {
    const pipe = this.organPipes[idx];
    if (window.gameAudio.playOrganPipe) window.gameAudio.playOrganPipe(pipe.freq);

    const el = document.getElementById(`organ-pipe-${idx}`);
    if (el) {
      el.style.transform = 'scale(0.95)';
      setTimeout(() => el.style.transform = 'scale(1)', 150);
    }

    this.organInputSeq.push(idx);

    // Check current step
    const currentStep = this.organInputSeq.length - 1;
    if (this.organInputSeq[currentStep] !== this.organTargetSeq[currentStep]) {
      window.gameAudio.playGlassShatter();
      this.story.showToast('Sour note! Press "Rewind Note" to fix!');
      return;
    }

    // Sequence completed?
    if (this.organInputSeq.length === this.organTargetSeq.length) {
      window.gameAudio.playEchoCollect();
      if (window.gameInstance) {
        window.gameInstance.loopSeconds = Math.max(0, window.gameInstance.loopSeconds - 30); // Bonus +30s loop time
      }
      setTimeout(() => {
        this.story.closeModal();
        this.story.showToast('HARMONY ACHIEVED! The Calliope Waltz echoes (+30s Time Added)!');
      }, 500);
    }
  }

  rewindOrganNote() {
    window.gameAudio.playRewind();
    this.organInputSeq.pop();
    this.story.showToast('Note rewound! Play the next correct pipe.');
  }

  // ==========================================
  // PUZZLE 7: STRONGMAN HIGH STRIKER (NEW)
  // ==========================================
  openStrikerPuzzle() {
    this.strikerPower = 0;
    this.strikerDirection = 1;
    this.strikerInterval = null;

    const modalBody = `
      <div style="text-align: center;">
        <div style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">
          Swing the mallet when the power meter hits the <strong style="color: var(--crimson-bright);">BELL ZONE (88% - 100%)</strong>!
        </div>

        <div style="position: relative; width: 80px; height: 180px; background: #0c0819; border: 2px solid var(--brass-main); border-radius: 8px; margin: 12px auto; overflow: hidden;">
          <!-- Bell at top -->
          <div style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); font-size: 24px;">🔔</div>

          <!-- Sweet spot zone -->
          <div style="position: absolute; top: 18px; left: 0; right: 0; height: 35px; background: rgba(230, 57, 70, 0.35); border-bottom: 1px dashed var(--crimson-bright); display: flex; justify-content: center; align-items: center; font-size: 9px; color: #ffdede;">
            BELL ZONE
          </div>

          <!-- Rising Power Slider -->
          <div id="striker-slider-bar" style="position: absolute; bottom: 0; left: 0; right: 0; height: 10%; background: linear-gradient(180deg, var(--spectral-cyan) 0%, #160e24 100%); transition: height 0.03s linear;"></div>
        </div>

        <div style="display: flex; justify-content: center; gap: 12px;">
          <button class="gothic-btn" style="border-color: var(--spectral-cyan); color: #fff; font-size: 15px; padding: 10px 22px;" onclick="window.gamePuzzles.swingStrikerMallet()">
            🔨 Swing Mallet!
          </button>
          <button class="gothic-btn choice-btn-break" onclick="window.gamePuzzles.rewindStriker()">
            ⏪ Rewind Swing
          </button>
        </div>
      </div>
    `;

    this.story.showModal('STRONGMAN HIGH STRIKER', modalBody, [{
      text: 'Leave Striker',
      action: () => {
        if (this.strikerInterval) clearInterval(this.strikerInterval);
        this.story.closeModal();
      }
    }]);

    // Animate power meter
    if (this.strikerInterval) clearInterval(this.strikerInterval);
    this.strikerInterval = setInterval(() => {
      this.strikerPower += this.strikerDirection * 4;
      if (this.strikerPower >= 100) this.strikerDirection = -1;
      if (this.strikerPower <= 0) this.strikerDirection = 1;

      const bar = document.getElementById('striker-slider-bar');
      if (bar) bar.style.height = `${this.strikerPower}%`;
    }, 25);
  }

  swingStrikerMallet() {
    window.gameAudio.playClick();
    if (this.strikerPower >= 85) {
      if (this.strikerInterval) clearInterval(this.strikerInterval);
      window.gameAudio.playBell(13); // Thunderous bell gong!
      if (window.gameInstance && window.gameInstance.engine) {
        window.gameInstance.engine.vladSpeed = 0.58; // Permanent Speed Boost!
      }

      setTimeout(() => {
        this.story.closeModal();
        this.story.showToast('DING! DING! 100% VAMPIRE STRENGTH! (+Vlad Movement Speed Boosted!)');
      }, 500);
    } else {
      window.gameAudio.playGlassShatter();
      this.story.showToast('Weak strike! Press "Rewind Swing" to reverse time and smash the bell!');
    }
  }

  rewindStriker() {
    window.gameAudio.playRewind();
    this.strikerPower = 95;
    const bar = document.getElementById('striker-slider-bar');
    if (bar) bar.style.height = '95%';
    this.story.showToast('Time rewound! Ready in the 95% Bell Zone!');
  }
}

window.PuzzleSystem = PuzzleSystem;
