/**
 * THE 13TH HOUR - Main Game Controller (3D)
 */

class Game {
  constructor() {
    this.container = document.getElementById('canvas-wrapper');
    this.story = new StoryEngine();
    this.rewind = new RewindSystem(13.0); // 13-second rewind
    this.puzzles = new PuzzleSystem(this.story);
    this.engine = new GameEngine3D(this.container, this.story, this.rewind);

    // Global references for UI onclick events
    window.gameInstance = this;
    window.gameStory = this.story;
    window.gamePuzzles = this.puzzles;
    window.gameRewind = this.rewind;

    // 10-Minute Master Loop (12:13:00 -> 12:23:00)
    // 600 real-time seconds
    this.loopSeconds = 0;
    this.maxLoopSeconds = 600;
    this.startMin = 13;

    // 3D Input state
    this.input = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      rewind: false
    };

    this.lastTime = performance.now();
    this.isRunning = false;

    this.setupEventListeners();
  }

  init() {
    this.isRunning = true;
    requestAnimationFrame((t) => this.gameLoop(t));

    // Intro Prologue Screen
    const introScreen = document.getElementById('cinematic-screen');
    const introBtn = document.getElementById('cinematic-action-btn');
    if (introBtn) {
      introBtn.onclick = () => {
        window.gameAudio.ensureContext();
        window.gameAudio.playClick();
        if (introScreen) introScreen.style.display = 'none';
        this.story.showToast('You step into the circular 3D watch face. The loop has begun (12:13). Use WASD to move!');
      };
    }
  }

  setupEventListeners() {
    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      window.gameAudio.ensureContext();

      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.forward = true;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.backward = true;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = true;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = true;
      if (e.code === 'Space') this.input.jump = true;

      if (e.code === 'KeyE') {
        this.engine.interact();
      }

      if (e.code === 'KeyR' && !this.input.rewind) {
        this.input.rewind = true;
        this.rewind.startRewind();
      }

      if (e.code === 'KeyM') {
        this.toggleAudio();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'KeyW' || e.code === 'ArrowUp') this.input.forward = false;
      if (e.code === 'KeyS' || e.code === 'ArrowDown') this.input.backward = false;
      if (e.code === 'KeyA' || e.code === 'ArrowLeft') this.input.left = false;
      if (e.code === 'KeyD' || e.code === 'ArrowRight') this.input.right = false;
      if (e.code === 'Space') this.input.jump = false;

      if (e.code === 'KeyR') {
        this.input.rewind = false;
        this.rewind.stopRewind();
      }
    });

    // Rewind HUD Button
    const rewindBtn = document.getElementById('rewind-btn');
    if (rewindBtn) {
      const start = (e) => {
        e.preventDefault();
        window.gameAudio.ensureContext();
        this.input.rewind = true;
        this.rewind.startRewind();
      };
      const stop = (e) => {
        e.preventDefault();
        this.input.rewind = false;
        this.rewind.stopRewind();
      };

      rewindBtn.addEventListener('mousedown', start);
      window.addEventListener('mouseup', stop);
      rewindBtn.addEventListener('touchstart', start, { passive: false });
      window.addEventListener('touchend', stop);
    }

    // Audio Mute Toggle Button
    const audioBtn = document.getElementById('audio-toggle-btn');
    if (audioBtn) {
      audioBtn.addEventListener('click', () => this.toggleAudio());
    }

    // Escape Key closes modals
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        this.story.closeModal();
      }
    });
  }

  toggleAudio() {
    const isMuted = window.gameAudio.toggleMute();
    const btn = document.getElementById('audio-toggle-btn');
    if (btn) {
      btn.innerHTML = isMuted ? '🔇 Audio: Off' : '🔊 Audio: On';
    }
  }

  teleportToTent() {
    this.engine.teleportToTent();
  }

  gameLoop(currentTime) {
    const dt = Math.min((currentTime - this.lastTime) / 1000, 0.1);
    this.lastTime = currentTime;

    // 1. Advance or rewind the 10-Minute Loop Clock
    if (this.rewind.isRewinding) {
      this.rewind.stepRewind(this);
    } else {
      this.loopSeconds += dt;
      if (this.loopSeconds >= this.maxLoopSeconds) {
        this.triggerLoopCollapse();
      }
      this.rewind.recordState(this);
    }

    // 2. Update HUD Watch Hands & Timer
    this.updateClockHUD();
    this.rewind.updateHUD();

    // 3. 3D Engine update & render
    this.engine.update(dt, this.input);

    if (this.isRunning) {
      requestAnimationFrame((t) => this.gameLoop(t));
    }
  }

  updateClockHUD() {
    const totalCurrentSec = (this.startMin * 60) + this.loopSeconds;
    const currentMin = Math.floor(totalCurrentSec / 60);
    const currentSec = Math.floor(totalCurrentSec % 60);

    const minuteDeg = (totalCurrentSec / 3600) * 360;
    const secondDeg = (currentSec / 60) * 360;

    const handMinute = document.getElementById('watch-hand-minute');
    const handSecond = document.getElementById('watch-hand-second');
    const digitalTxt = document.getElementById('digital-time-txt');

    if (handMinute) handMinute.style.transform = `rotate(${minuteDeg}deg)`;
    if (handSecond) handSecond.style.transform = `rotate(${secondDeg}deg)`;

    if (digitalTxt) {
      const minStr = currentMin < 10 ? '0' + currentMin : currentMin;
      const secStr = currentSec < 10 ? '0' + currentSec : currentSec;
      digitalTxt.innerText = `12:${minStr}:${secStr}`;
    }
  }

  triggerLoopCollapse() {
    window.gameAudio.playGlassShatter();
    this.loopSeconds = 0;
    if (this.engine.vlad) {
      this.engine.vlad.position.set(-60, 0, -8);
    }
    this.rewind.buffer = [];

    this.story.showModal('TEMPORAL COLLAPSE (12:23)', `
      <div class="dialogue-text" style="color: var(--crimson-bright); font-style: normal; text-align: center;">
        <strong>THE TEN MINUTES HAVE EXPIRED!</strong>
        <br><br>
        The glass boundary of the Chronos Heart fractures into blinding light.
        <br><br>
        You awaken once again before the iron entrance gate. The hands snap back to <strong>12:13</strong>.
      </div>
    `, [{ text: 'Awaken at Gate', action: 'close' }]);
  }
}

// Auto-launch on page load
window.addEventListener('DOMContentLoaded', () => {
  new Game().init();
});
