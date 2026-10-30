/**
 * THE 13TH HOUR - Chronos Heart 3D Rewind System
 * Stores 13 seconds (780 frames) of 3D transforms, player actions, and world state.
 */

class RewindSystem {
  constructor(maxSeconds = 13.0) {
    this.maxSeconds = maxSeconds;
    this.maxFrames = Math.round(maxSeconds * 60);
    this.buffer = [];
    this.isRewinding = false;
    this.rewindEnergy = maxSeconds;
    this.rechargeRate = 1.8;
    this.rewindSpeed = 2;
    this.ghostHistory = [];
  }

  recordState(state) {
    if (this.isRewinding) return;

    const vlad = state.engine.vlad;
    const snapshot = {
      timestamp: performance.now(),
      vlad: {
        x: vlad.position.x,
        y: vlad.position.y,
        z: vlad.position.z,
        rotationY: vlad.rotation.y,
        vx: vlad.userData.vx || 0,
        vy: vlad.userData.vy || 0,
        vz: vlad.userData.vz || 0,
        isGrounded: vlad.userData.isGrounded !== false
      },
      loopSeconds: state.loopSeconds
    };

    this.buffer.push(snapshot);
    if (this.buffer.length > this.maxFrames) {
      this.buffer.shift();
    }

    if (this.rewindEnergy < this.maxSeconds) {
      this.rewindEnergy = Math.min(this.maxSeconds, this.rewindEnergy + (1 / 60) * this.rechargeRate);
    }
  }

  startRewind() {
    if (this.buffer.length < 5 || this.rewindEnergy <= 0.5) return false;
    this.isRewinding = true;
    window.gameAudio.ensureContext();
    window.gameAudio.playRewind();

    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) canvasWrapper.classList.add('rewind-active');

    const rewindBtn = document.getElementById('rewind-btn');
    if (rewindBtn) rewindBtn.classList.add('active');

    return true;
  }

  stopRewind() {
    if (!this.isRewinding) return;
    this.isRewinding = false;

    // Clear 3D ghost clones
    if (window.gameInstance && window.gameInstance.engine) {
      window.gameInstance.engine.clearGhostClones();
    }

    const canvasWrapper = document.getElementById('canvas-wrapper');
    if (canvasWrapper) canvasWrapper.classList.remove('rewind-active');

    const rewindBtn = document.getElementById('rewind-btn');
    if (rewindBtn) rewindBtn.classList.remove('active');
  }

  stepRewind(gameState) {
    if (!this.isRewinding) return null;

    if (this.buffer.length <= 1 || this.rewindEnergy <= 0) {
      this.stopRewind();
      return null;
    }

    let targetSnapshot = null;
    for (let i = 0; i < this.rewindSpeed && this.buffer.length > 0; i++) {
      targetSnapshot = this.buffer.pop();
    }

    if (!targetSnapshot) {
      this.stopRewind();
      return null;
    }

    this.rewindEnergy = Math.max(0, this.rewindEnergy - (this.rewindSpeed / 60));

    // Apply restored 3D transforms
    const v = gameState.engine.vlad;
    v.position.set(targetSnapshot.vlad.x, targetSnapshot.vlad.y, targetSnapshot.vlad.z);
    v.rotation.y = targetSnapshot.vlad.rotationY;
    v.userData.vx = targetSnapshot.vlad.vx;
    v.userData.vy = targetSnapshot.vlad.vy;
    v.userData.vz = targetSnapshot.vlad.vz;
    v.userData.isGrounded = targetSnapshot.vlad.isGrounded;

    gameState.loopSeconds = targetSnapshot.loopSeconds;

    // Spawn 3D ghost clone trail
    if (gameState.engine && gameState.engine.spawnGhostClone) {
      gameState.engine.spawnGhostClone(targetSnapshot.vlad);
    }

    return targetSnapshot;
  }

  updateHUD() {
    const fillCircle = document.getElementById('rewind-circle-fill');
    const txtEnergy = document.getElementById('rewind-energy-txt');
    if (fillCircle && txtEnergy) {
      const pct = (this.rewindEnergy / this.maxSeconds) * 100;
      fillCircle.style.strokeDashoffset = 100 - pct;
      txtEnergy.innerText = `${this.rewindEnergy.toFixed(1)}s`;
    }
  }
}

window.RewindSystem = RewindSystem;
