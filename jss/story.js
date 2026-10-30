/**
 * THE 13TH HOUR - Story & Dialogue Engine (Streamlined & Snappy)
 */

class StoryEngine {
  constructor() {
    this.memoryEchoes = {
      ticket: {
        id: 'ticket',
        title: 'Old Invitation Ticket',
        subtitle: 'October 30, 1888',
        collected: false,
        text: 'The carnival opened at dusk. At 12:13, time froze just as the flames ignited.'
      },
      carousel: {
        id: 'carousel',
        title: 'The Stopped Carousel',
        subtitle: 'Children\'s Laughter',
        collected: false,
        text: 'The children never felt the blaze. They believe they have only ridden for a single song.'
      },
      mirror: {
        id: 'mirror',
        title: 'The Cracked Mirror',
        subtitle: 'The Vampire\'s Vow',
        collected: false,
        text: '"I swear on eternity... I will forge a heart of clockwork so none shall ever die again."'
      }
    };

    // Bonus Mini-Games
    this.tarotCompleted = false;
    this.ringTossCompleted = false;

    this.silentBellRings = 0;
    this.tentUnlocked = false;
  }

  showModal(title, contentHtml, buttons = [{ text: 'Close', action: 'close' }]) {
    const modalBackdrop = document.getElementById('story-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    if (!modalBackdrop || !modalTitle || !modalBody || !modalFooter) return;

    modalTitle.innerText = title;
    modalBody.innerHTML = contentHtml;
    modalFooter.innerHTML = '';

    buttons.forEach(btn => {
      const b = document.createElement('button');
      b.className = `gothic-btn ${btn.className || ''}`;
      b.innerText = btn.text;
      b.onclick = () => {
        window.gameAudio.playClick();
        if (typeof btn.action === 'function') btn.action();
        else if (btn.action === 'close') this.closeModal();
      };
      modalFooter.appendChild(b);
    });
    modalBackdrop.style.display = 'flex';
  }

  closeModal() {
    const modalBackdrop = document.getElementById('story-modal');
    if (modalBackdrop) modalBackdrop.style.display = 'none';
  }

  collectEcho(echoKey) {
    const echo = this.memoryEchoes[echoKey];
    if (!echo || echo.collected) return;
    echo.collected = true;
    window.gameAudio.playEchoCollect();

    const slot = document.getElementById(`slot-${echoKey}`);
    if (slot) slot.classList.add('active');

    const contentHtml = `
      <div style="text-align: center; margin-bottom: 12px;">
        <div style="font-family: 'Cinzel Decorative', serif; font-size: 20px; color: var(--spectral-cyan); text-shadow: 0 0 10px var(--spectral-glow);">
          ${echo.title}
        </div>
        <div style="font-size: 13px; color: var(--brass-light); letter-spacing: 1px;">
          ${echo.subtitle}
        </div>
      </div>
      <div class="dialogue-text" style="text-align: center; font-size: 16px; padding: 12px; background: rgba(0,0,0,0.5); border-radius: 6px;">
        "${echo.text}"
      </div>
    `;

    this.showModal('MEMORY ECHO RESTORED', contentHtml, [
      { text: 'Keep Exploring', action: 'close' }
    ]);

    if (this.hasAllEchoes()) {
      setTimeout(() => {
        this.showToast('All 3 Echoes collected! Run to the Silent Bell at the center plaza!');
      }, 800);
    }
  }

  hasAllEchoes() {
    return Object.values(this.memoryEchoes).every(e => e.collected);
  }

  ringSilentBell() {
    if (!this.hasAllEchoes()) {
      const collectedCount = Object.values(this.memoryEchoes).filter(e => e.collected).length;
      this.showModal('THE SILENT BELL', `
        <div class="dialogue-text" style="text-align: center;">
          The bell is wrapped in temporal chains.
          <br><br>
          <span style="color: var(--crimson-bright); font-weight: bold;">
            Collect all 3 Memory Echoes to unlock! (${collectedCount}/3 Found)
          </span>
        </div>
      `, [{ text: 'Got It', action: 'close' }]);
      return;
    }

    if (this.tentUnlocked) {
      this.showModal('THE SILENT BELL', `
        <div class="dialogue-text" style="text-align: center;">
          The 13 chimes have already been rung. The Clockmaker\'s Tent is open!
        </div>
      `, [{ text: 'Go to Tent', action: () => {
        this.closeModal();
        if (window.gameInstance) window.gameInstance.teleportToTent();
      }}]);
      return;
    }

    // Advance ring count
    this.silentBellRings++;
    window.gameAudio.playBell(this.silentBellRings);

    const banner = document.getElementById('bell-counter-banner');
    const numeral = document.getElementById('bell-numeral-display');
    const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];

    if (banner && numeral) {
      banner.style.display = 'flex';
      numeral.innerText = `${romanNumerals[this.silentBellRings]} (${this.silentBellRings}/13)`;
    }

    if (this.silentBellRings >= 13) {
      this.tentUnlocked = true;
      setTimeout(() => {
        window.gameAudio.playGlassShatter();
        this.showModal('THIRTEENTH TOLL — SEAL BROKEN!', `
          <div style="text-align: center;">
            <div style="font-family: 'Cinzel Decorative', serif; font-size: 24px; color: var(--crimson-bright); margin-bottom: 8px;">
              XIII — THE WARD SHATTERS!
            </div>
            <div class="dialogue-text">
              The golden bell resonates across the fairground. The giant gears atop the Clockmaker\'s Tent have unlocked!
            </div>
          </div>
        `, [
          {
            text: 'Enter Clockmaker\'s Tent',
            action: () => {
              this.closeModal();
              if (window.gameInstance) window.gameInstance.teleportToTent();
            }
          }
        ]);
      }, 400);
    } else {
      this.showToast(`Tolled Bell: ${romanNumerals[this.silentBellRings]} of XIII`);
    }
  }

  showClockmakerEncounter() {
    const contentHtml = `
      <div style="text-align: center; margin-bottom: 14px;">
        <div style="font-family: 'Cinzel Decorative', serif; font-size: 22px; color: var(--brass-light); margin-bottom: 4px;">
          THE CLOCKMAKER REVEALED
        </div>
        <div style="color: var(--spectral-cyan); font-size: 14px;">
          Future Vlad stands before you.
        </div>
      </div>
      <div class="dialogue-text" style="background: rgba(0,0,0,0.5); padding: 14px; border-radius: 6px; font-size: 16px;">
        "I am you, one century from now. When the 1888 fire struck, I sealed this carnival inside the watch to protect these souls. 
        <br><br>
        Now my power is spent. <strong>You must choose their fate:</strong>"
      </div>
      <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
        <button class="gothic-btn choice-btn-break" onclick="window.gameStory.triggerEnding('break')">
          🔨 Shatter Chronos Heart (Free Souls & Dissolve Carnival)
        </button>
        <button class="gothic-btn choice-btn-keeper" onclick="window.gameStory.triggerEnding('keeper')">
          👑 Become the New Keeper (Preserve the Eternal Carnival)
        </button>
      </div>
    `;

    this.showModal('THE FINAL DECISION', contentHtml, []);
  }

  triggerEnding(choice) {
    this.closeModal();
    const screen = document.getElementById('cinematic-screen');
    const title = document.getElementById('cinematic-title');
    const sub = document.getElementById('cinematic-subtitle');
    const body = document.getElementById('cinematic-body');
    const btn = document.getElementById('cinematic-action-btn');

    if (choice === 'break') {
      window.gameAudio.playGlassShatter();
      title.innerText = 'THE DAWN OF SOULS';
      sub.innerText = 'ENDING I — THE SOULS ARE FREED';
      body.innerHTML = `
        You smash the Chronos Heart upon the anvil.
        <br><br>
        The glass face shatters. Trapped souls transform into thousands of glowing silver butterflies ascending into the morning sky.
        <br><br>
        The carnival fades into morning mist. You awaken in your manor at 12:14. Time moves forward once more.
      `;
    } else {
      window.gameAudio.playEchoCollect();
      title.innerText = 'THE ETERNAL CARNIVAL';
      sub.innerText = 'ENDING II — THE NEW KEEPER';
      body.innerHTML = `
        You take the silver winding key and don the Clockmaker's mantle.
        <br><br>
        The loop resets to 12:13. The carnival blazes with phantom fireworks, calliopes play a triumphant waltz, and laughter echoes forever.
        <br><br>
        Outside of time, beyond death, you rule as the immortal guardian of the 13th Hour.
      `;
    }

    btn.innerText = 'Play Again';
    btn.onclick = () => window.location.reload();

    if (screen) {
      screen.style.display = 'flex';
      screen.style.opacity = '1';
    }
  }

  showToast(message) {
    const toast = document.getElementById('toast-notification');
    if (!toast) return;
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

window.StoryEngine = StoryEngine;
