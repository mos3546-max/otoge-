// ----------------------------------------------------
// ROCK BEAT - game.js (Mega Man Style Rhythm Action Engine)
// ----------------------------------------------------

// ==========================================
// 1. 8-bit サウンドシステム (Web Audio API)
// ==========================================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmVolume = 0.12;
    this.sfxVolume = 0.45;
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
  }

  // 8-bit SFX 生成
  playDrum(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (type) {
      case 'rock': { // ROCK / pata / [A]: パルス駆動音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.12);

        gain.gain.setValueAtTime(this.sfxVolume * 0.7, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.13);
        break;
      }
      case 'shot': { // SHOT / pon / [S]: バスター発射音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(250, now + 0.08);

        gain.gain.setValueAtTime(this.sfxVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.09);
        break;
      }
      case 'bari': { // BARI / chaka / [D]: バリアノイズ
        const bufferSize = this.ctx.sampleRate * 0.15;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, now);
        filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);

        const gain = this.ctx.createGain();
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        gain.gain.setValueAtTime(this.sfxVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        noise.start(now);
        noise.stop(now + 0.16);
        break;
      }
      case 'sync': { // SYNC / don / [F]: チャージ音
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(1400, now + 0.2);

        gain.gain.setValueAtTime(this.sfxVolume * 0.5, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.21);
        break;
      }
    }
  }

  // 8-bit メトロノーム音
  playMetronome(isFirstBeat) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.frequency.setValueAtTime(isFirstBeat ? 600 : 350, now);
    gain.gain.setValueAtTime(isFirstBeat ? 0.08 : 0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // アクション中ロボットメロディ
  singRobotAction(syllable, index) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.connect(gain);
    gain.connect(this.masterGain);

    let pitch = 523; // C5 (pata / [A])
    if (syllable === 'shot') pitch = 659; // E5 (pon / [S])
    if (syllable === 'bari') pitch = 783; // G5 (chaka / [D])
    if (syllable === 'don' || syllable === 'sync') pitch = 987; // B5 (don / [F])

    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.setValueAtTime(pitch * 1.5, now + 0.05);
    osc.frequency.setValueAtTime(pitch, now + 0.1);

    gain.gain.setValueAtTime(this.sfxVolume * 0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // BGM tick: 8-bit PSG調ループ
  playBgmTick(beatIndex, stepIndex, isFever) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    const chords = [
      [220, 261, 329], // Am
      [196, 246, 293], // G
      [174, 220, 261], // F
      [164, 207, 246]  // E
    ];

    const chordIndex = Math.floor(stepIndex / 8) % chords.length;
    const currentChord = chords[chordIndex];
    
    // ベース音 (三角波)
    const baseOsc = this.ctx.createOscillator();
    const baseGain = this.ctx.createGain();
    baseOsc.type = 'triangle';
    baseOsc.connect(baseGain);
    baseGain.connect(this.masterGain);
    
    const rootNote = currentChord[0] / 2;
    baseOsc.frequency.setValueAtTime(rootNote, now);
    baseGain.gain.setValueAtTime(this.bgmVolume * (isFever ? 0.9 : 0.6), now);
    baseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    baseOsc.start(now);
    baseOsc.stop(now + 0.4);

    // メロディ (矩形波)
    if (beatIndex === 1 || beatIndex === 3) {
      const melodyOsc = this.ctx.createOscillator();
      const melodyGain = this.ctx.createGain();
      melodyOsc.type = 'square';
      melodyOsc.connect(melodyGain);
      melodyGain.connect(this.masterGain);
      
      const octave = isFever ? 2 : 1;
      const note = currentChord[beatIndex === 1 ? 1 : 2] * octave;
      melodyOsc.frequency.setValueAtTime(note, now);
      
      melodyGain.gain.setValueAtTime(this.bgmVolume * 0.25, now);
      melodyGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      
      melodyOsc.start(now);
      melodyOsc.stop(now + 0.28);
    }
  }
}

const sounds = new SoundManager();

// ==========================================
// 2. カスタムパーツ・チップデータベース
// ==========================================
const WEAPONS_DB = {
  wood_spear: { name: "バスターMk-I", type: "spear", atk: 4, hp: 0, def: 0, crit: 0, range: 350, rarity: "common", icon: "🔫", desc: "標準バスター。射程:350" },
  stone_spear: { name: "ワイドバスター", type: "spear", atk: 7, hp: 0, def: 0, crit: 2, range: 260, rarity: "common", icon: "🔫", desc: "広範囲攻撃パーツ。射程:260" },
  wood_shield: { name: "ライトバリア", type: "shield", atk: 0, hp: 20, def: 2, range: 100, rarity: "common", icon: "🛡️", desc: "簡易バリア。射程:100" },
  
  iron_spear: { name: "チタンバスター", type: "spear", atk: 14, hp: 12, def: 0, crit: 4, range: 380, rarity: "uncommon", icon: "🔫", desc: "熱効率補強バスター。射程:380" },
  iron_shield: { name: "プロトシールド", type: "shield", atk: 0, hp: 50, def: 6, range: 120, rarity: "uncommon", icon: "🛡️", desc: "試作型電磁シールド。射程:120" },
  hunter_bow: { name: "レーザーバスター", type: "bow", atk: 11, hp: 0, def: 0, crit: 8, range: 520, rarity: "uncommon", icon: "⚡", desc: "高速長射程レーザー。射程:520" },

  ice_spear: { name: "アイスシュート", type: "spear", atk: 28, hp: 25, def: 0, crit: 10, range: 300, rarity: "rare", icon: "❄️", desc: "冷却型バスター。射程:300" },
  gold_shield: { name: "メタルシールド", type: "shield", atk: 3, hp: 100, def: 14, range: 150, rarity: "rare", icon: "⚙️", desc: "回転スチール防壁。射程:150" },
  fire_bow: { name: "ファイアシュート", type: "bow", atk: 22, hp: 0, def: 0, crit: 15, range: 450, rarity: "rare", icon: "🔥", desc: "超高温プラズマ射出。射程:450" },
  crystal_staff: { name: "ジュエルバスター", type: "staff", atk: 33, hp: 35, def: 4, range: 350, rarity: "rare", icon: "💎", desc: "反射レーザー乱射。射程:350" },

  gungnir: { name: "ハイパーバスター", type: "spear", atk: 60, hp: 55, def: 5, crit: 20, range: 480, rarity: "legendary", icon: "☄️", desc: "ギガプラズマを放射。射程:480" },
  aegis: { name: "ホーリーバリア", type: "shield", atk: 5, hp: 200, def: 28, range: 150, rarity: "legendary", icon: "🔱", desc: "絶対防御障壁。射程:150" },
  failures_bow: { name: "ソニックバスター", type: "bow", atk: 52, hp: 45, def: 0, crit: 25, range: 500, rarity: "legendary", icon: "🌊", desc: "超高周波空間破壊弾。射程:500" },
  shadow_bow: { name: "シャドウブレード", type: "bow", atk: 55, hp: 30, def: 2, crit: 22, range: 300, rarity: "legendary", icon: "🥷", desc: "暗黒物質手裏剣投擲。射程:300" },
  sage_staff: { name: "プラズマキャノン", type: "staff", atk: 70, hp: 70, def: 8, range: 600, rarity: "legendary", icon: "⚡", desc: "要塞破壊レーザー砲。射程:600" },
  excalibur: { name: "ゼットセイバー", type: "sword", atk: 110, hp: 130, def: 15, crit: 30, range: 130, rarity: "legendary", icon: "⚔️", desc: "純光エネルギーの刃。射程:130" }
};

// ==========================================
// 3. ゲームステート
// ==========================================
const state = {
  player: {
    level: 1,
    xp: 0,
    nextXp: 100,
    hp: 100,
    maxHp: 100,
    baseAtk: 15,
    baseDef: 5,
    crit: 5,
    sp: 0,
    gold: 0,
    bossKills: 0,
    
    equippedId: "wood_spear",
    inventory: ["wood_spear"],
    chests: [],
    
    evoIndex: 0,
    unlockedCommands: ['walk', 'retreat', 'attack', 'jump', 'duck']
  },

  enemy: null,
  
  stage: 1,
  wave: 1,
  maxWaves: 5,
  distanceToBoss: 4,
  gameActive: false,
  combatLog: "",

  // 進行フェーズ
  phase: 'move',
  moveProgress: 0,
  moveRequired: 3,

  bpm: 120,
  beatInterval: 500,
  lastBeatTime: 0,
  beatCount: 0,
  stepCount: 0,
  turn: 'input',
  
  currentInputs: [],
  hasInputThisBeat: false,
  perfectWindow: 90,
  goodWindow: 170,
  
  combo: 0,
  fever: false,
  feverMeter: 0,
  isCharged: false,

  particles: [],
  playerX: 200,
  enemyX: 600,
  playerActionAnim: null,
  enemyActionAnim: null,
  enemyHurtTime: 0
};

// リズムパターンとキー配列の対応
const COMMANDS = {
  walk: { name: "前進", pattern: ['pata', 'pata', 'pata', 'pon'], keys: 'A A A S' },
  retreat: { name: "後退", pattern: ['pon', 'pata', 'pon', 'pata'], keys: 'S A S A' },
  attack: { name: "射撃", pattern: ['pon', 'pon', 'pata', 'pon'], keys: 'S S A S' },
  jump: { name: "ジャンプ", pattern: ['pon', 'chaka', 'pon', 'chaka'], keys: 'S D S D' },
  duck: { name: "スライド", pattern: ['chaka', 'pon', 'chaka', 'pon'], keys: 'D S D S' },
  defend: { name: "防御", pattern: ['chaka', 'chaka', 'pata', 'pon'], keys: 'D D A S', minEvo: 1 },
  charge: { name: "溜め", pattern: ['don', 'don', 'chaka', 'chaka'], keys: 'F F D D', minEvo: 2 },
  miracle: { name: "E缶", pattern: ['don', 'don', 'don', 'don'], keys: 'F F F F', minEvo: 3, feverOnly: true }
};

// アーマー換装
const EVO_STEPS = [
  { name: "NORMAL ROCK", minLevel: 1, avatar: "🤖", desc: "初期アーマー。安定した通常戦闘能力。" },
  { name: "RUSH GEAR", minLevel: 5, avatar: "🐕", desc: "ラッシュ合体装甲。防御プログラム『D D A S』展開可能。" },
  { name: "POWER GEAR", minLevel: 10, avatar: "💪", desc: "重装パワー型。射撃力を高める溜めコマンド『F F D D』が解放。" },
  { name: "JET ARMOR", minLevel: 15, avatar: "✈️", desc: "機動飛行型。E缶コマンド『F F F F』による全体爆破＆回復。" },
  { name: "ULTIMATE FORCE", minLevel: 20, avatar: "👑", desc: "限界突破の最強形態。すべての敵を圧倒する力を解放。" }
];

let canvas = null;
let ctx = null;

// ==========================================
// 4. 背景描画 (サイバー都市の遠景と格子状ネオン)
// ==========================================
function drawBackground() {
  if (!canvas || !ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  
  // 1. 空のグラデーション
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
  if (state.fever) {
    skyGrad.addColorStop(0, '#3a0058');
    skyGrad.addColorStop(0.5, '#780068');
    skyGrad.addColorStop(1, '#24003d');
  } else {
    skyGrad.addColorStop(0, '#0a103c');
    skyGrad.addColorStop(0.6, '#182b75');
    skyGrad.addColorStop(1, '#2c43ad');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, 300);

  // 2. 遠景のサイバーシティビルシルエット
  ctx.fillStyle = state.fever ? 'rgba(75, 10, 90, 0.45)' : 'rgba(28, 48, 120, 0.45)';
  const buildings = [
    { x: 20, w: 45, h: 140 },
    { x: 90, w: 65, h: 200 },
    { x: 170, w: 35, h: 110 },
    { x: 220, w: 85, h: 170 },
    { x: 330, w: 55, h: 240 },
    { x: 410, w: 45, h: 150 },
    { x: 480, w: 75, h: 190 },
    { x: 580, w: 35, h: 120 },
    { x: 640, w: 85, h: 210 },
    { x: 750, w: 45, h: 160 }
  ];
  buildings.forEach(b => {
    ctx.fillRect(b.x, 300 - b.h, b.w, b.h);
    // 窓の明かり
    ctx.fillStyle = state.fever ? 'rgba(255, 63, 222, 0.4)' : 'rgba(0, 240, 255, 0.4)';
    for (let wy = 300 - b.h + 20; wy < 290; wy += 30) {
      for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 16) {
        if (Math.sin(wx * wy) > -0.2) {
          ctx.fillRect(wx, wy, 5, 8);
        }
      }
    }
    ctx.fillStyle = state.fever ? 'rgba(75, 10, 90, 0.45)' : 'rgba(28, 48, 120, 0.45)';
  });

  // 3. 地面
  ctx.fillStyle = '#202a5c';
  ctx.fillRect(0, 300, width, 100);
  
  // 地平線ネオンライン
  ctx.strokeStyle = state.fever ? 'var(--mega-red)' : '#00f0ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(width, 300);
  ctx.stroke();

  // グリッド線
  ctx.strokeStyle = state.fever ? 'rgba(228, 0, 88, 0.55)' : 'rgba(0, 240, 255, 0.45)';
  ctx.lineWidth = 2;
  const lineY = 300;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, lineY + i*20);
    ctx.lineTo(width, lineY + i*20);
    ctx.stroke();
  }

  // 縦グリッド
  const gridCount = 20;
  for (let i = 0; i <= gridCount; i++) {
    const xTop = (width / gridCount) * i;
    const xBottom = ((width * 1.4) / gridCount) * i - (width * 0.2);
    ctx.beginPath();
    ctx.moveTo(xTop, 300);
    ctx.lineTo(xBottom, height);
    ctx.stroke();
  }

  // スクロール光線
  const speedScale = state.phase === 'move' ? 3.0 : 1.0;
  ctx.strokeStyle = state.fever ? 'rgba(255, 251, 0, 0.25)' : 'rgba(0, 240, 255, 0.25)';
  ctx.lineWidth = 3;
  const flowSpeed = (Date.now() * 0.05 * speedScale) % 80;
  for (let x = -80; x < width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x + flowSpeed, 300);
    ctx.lineTo(x + flowSpeed - 30, height);
    ctx.stroke();
  }

  if (state.phase === 'move') {
    ctx.fillStyle = 'var(--mega-yellow)';
    ctx.font = 'bold 10px var(--font-pixel)';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(`PROCEEDING... (DASH NEEDED: ${state.moveProgress} / ${state.moveRequired})`, width / 2, 80);
    ctx.shadowBlur = 0;
  }
}

// ==========================================
// 4b. カッコよくなったロックマン描画
// ==========================================
function drawPlayer() {
  if (!ctx) return;
  const p = state.player;
  const wp = WEAPONS_DB[p.equippedId] || WEAPONS_DB.wood_spear;
  
  ctx.save();
  
  let x = state.playerX;
  let y = 300;
  let scaleY = 1;
  let weaponRot = 0;
  let shieldActive = false;
  let chargeFlash = false;
  let isJumping = false;
  let isSliding = false;
  let showMuzzleFlash = false;
  
  const anim = state.playerActionAnim;
  if (anim) {
    const time = (Date.now() - anim.start) / 2000;
    if (anim.type === 'walk') { // DASH
      const hop = Math.sin(time * Math.PI * 4);
      y -= Math.max(0, hop * 10);
      x += (time < 0.5 ? time * 2 : 1) * 30;
      isSliding = true;
    } else if (anim.type === 'retreat') { // RETREAT
      const hop = Math.sin(time * Math.PI * 4);
      y -= Math.max(0, hop * 12);
      x -= (time < 0.5 ? time * 2 : 1) * 30;
    } else if (anim.type === 'jump') { // JUMP
      const jumpHeight = Math.sin(time * Math.PI) * 75;
      y -= jumpHeight;
      isJumping = true;
    } else if (anim.type === 'duck') { // DUCK / SLIDE
      scaleY = 0.45;
      y += 8;
      isSliding = true;
    } else if (anim.type === 'attack') {
      if (time < 0.25) {
        x += time * 4 * 15;
        weaponRot = -0.1;
      }
      const flashStart = 1.45;
      const flashEnd = 1.65;
      if (time >= flashStart && time <= flashEnd) {
        showMuzzleFlash = true;
      }
    } else if (anim.type === 'defend') {
      scaleY = 0.85;
      shieldActive = true;
    } else if (anim.type === 'charge') {
      chargeFlash = true;
    } else if (anim.type === 'miracle') {
      y -= Math.sin(time * Math.PI) * 70;
      weaponRot = time * Math.PI * 2;
    }
  }

  let isHurt = state.playerHurtTime && Date.now() - state.playerHurtTime < 300;
  if (isHurt) {
    x += Math.sin(Date.now() * 0.25) * 8;
  }

  // 1. 光のエネルギーマフラー
  ctx.save();
  ctx.translate(x, y - 50);
  const scarfWave = Math.sin(Date.now() * 0.012) * 8;
  
  const scarfGrad = ctx.createLinearGradient(0, 0, -50, scarfWave);
  scarfGrad.addColorStop(0, 'rgba(0, 240, 255, 0.85)');
  scarfGrad.addColorStop(0.5, 'rgba(255, 251, 0, 0.6)');
  scarfGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
  
  ctx.fillStyle = scarfGrad;
  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.quadraticCurveTo(-35, scarfWave - 15, -60, scarfWave);
  ctx.quadraticCurveTo(-35, scarfWave + 15, -10, 10);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (state.isCharged || chargeFlash) {
    const flashIndex = Math.floor(Date.now() / 50) % 3;
    if (flashIndex === 0) ctx.fillStyle = 'var(--mega-yellow)';
    else if (flashIndex === 1) ctx.fillStyle = '#ffffff';
    else ctx.fillStyle = 'var(--mega-cyan)';
  }

  ctx.translate(x, y);
  ctx.scale(1, scaleY);

  if (isSliding) {
    ctx.rotate(0.12);
  }

  let suitColor = 'var(--mega-blue)';
  let accentColor = 'var(--mega-cyan)';
  if (p.evoIndex === 1) { suitColor = 'var(--mega-red)'; accentColor = '#fff'; }
  else if (p.evoIndex === 2) { suitColor = '#2b2b2b'; accentColor = 'var(--mega-yellow)'; }
  else if (p.evoIndex === 3) { suitColor = '#6011a4'; accentColor = '#ffd000'; }
  else if (p.evoIndex === 4) { suitColor = '#10052c'; accentColor = '#ff3fde'; }

  if (state.fever) {
    const isGoldTick = Math.floor(Date.now() / 60) % 2 === 0;
    suitColor = isGoldTick ? 'var(--mega-yellow)' : '#fff';
    accentColor = isGoldTick ? '#fff' : 'var(--mega-yellow)';
  }

  if (isHurt && Math.floor(Date.now() / 40) % 2 === 0) {
    suitColor = '#fff';
    accentColor = '#888';
  }

  // 2. 足
  ctx.fillStyle = suitColor;
  if (isJumping) {
    ctx.fillRect(-12, -18, 8, 8);
    ctx.fillRect(4, -18, 8, 8);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-15, -12, 10, 5);
    ctx.fillRect(2, -12, 10, 5);
  } else {
    ctx.fillRect(-15, -12, 10, 12);
    ctx.fillRect(5, -12, 10, 12);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-18, -4, 12, 5);
    ctx.fillRect(4, -4, 12, 5);
  }

  // 3. 胴体
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.arc(0, -25, 18, 0, Math.PI*2);
  ctx.fill();
  
  ctx.fillStyle = accentColor;
  ctx.fillRect(-10, -28, 20, 10);
  
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-6, -26, 12, 2);

  // 4. 頭部
  ctx.fillStyle = suitColor;
  ctx.beginPath();
  ctx.arc(2, -55, 18, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = 'var(--mega-yellow)';
  ctx.beginPath();
  ctx.moveTo(1, -73);
  ctx.lineTo(8, -65);
  ctx.lineTo(-4, -65);
  ctx.closePath();
  ctx.fill();
  
  ctx.fillStyle = 'var(--mega-red)';
  ctx.beginPath();
  ctx.arc(2, -67, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffdbb5';
  ctx.beginPath();
  ctx.arc(6, -52, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(-13, -55, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(-13, -55, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-13, -55, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(6, -58);
  ctx.lineTo(13, -58);
  ctx.lineTo(11, -50);
  ctx.lineTo(8, -50);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'var(--mega-cyan)';
  ctx.fillRect(8, -55, 2, 4);

  // 5. バスター
  ctx.save();
  ctx.translate(14, -28);
  ctx.rotate(weaponRot);
  
  let glowColor = null;
  if (wp.rarity === 'uncommon') glowColor = 'var(--neon-green)';
  else if (wp.rarity === 'rare') glowColor = 'var(--mega-cyan)';
  else if (wp.rarity === 'legendary') glowColor = 'var(--mega-yellow)';

  if (glowColor) {
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
  }

  ctx.fillStyle = suitColor;
  ctx.fillRect(0, -6, 17, 12);
  
  ctx.fillStyle = accentColor;
  ctx.fillRect(4, -5, 8, 2);
  ctx.fillRect(4, 3, 8, 2);

  ctx.fillStyle = glowColor || 'var(--mega-yellow)';
  ctx.fillRect(17, -5, 3, 10);
  
  if (showMuzzleFlash) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = glowColor || 'var(--mega-cyan)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(22, 0, 12, -Math.PI*0.5, Math.PI*0.5);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();

  // 7. シールド
  if (shieldActive) {
    ctx.save();
    ctx.strokeStyle = 'var(--mega-red)';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'var(--mega-red)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(28, -28, 26, -Math.PI*0.4, Math.PI*0.4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(228, 0, 88, 0.2)';
    ctx.fill();
    ctx.restore();
  }

  // 8. チャージ稲妻エフェクト
  if (state.isCharged) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'var(--mega-cyan)';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
      const rx = (Math.random() - 0.5) * 60;
      const ry = -65 + (Math.random() - 0.5) * 60;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + (Math.random() - 0.5) * 15, ry + (Math.random() - 0.5) * 15);
      ctx.lineTo(rx + (Math.random() - 0.5) * 30, ry + (Math.random() - 0.5) * 30);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (state.phase === 'combat' && state.turn === 'input') {
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 168, 248, 0.18)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, wp.range, 0, Math.PI*2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

// 敵ロボットの描画
function drawEnemy() {
  if (!ctx || !state.enemy || state.phase !== 'combat') return;
  const e = state.enemy;

  ctx.save();
  let x = state.enemyX;
  let y = 300;
  let scaleY = 1;
  let bodyRot = 0;

  const anim = state.enemyActionAnim;
  if (anim) {
    const time = (Date.now() - anim.start) / 2000;
    if (anim.type === 'attack') {
      if (time < 0.3) {
        x -= time * 3.3 * 80;
        bodyRot = 0.1;
      } else if (time < 0.6) {
        x -= (0.6 - time) * 3.3 * 80;
      }
    } else if (anim.type === 'roar') {
      x += Math.sin(Date.now() * 0.15) * 5;
      scaleY = 1.1 + Math.sin(Date.now() * 0.08) * 0.05;
    }
  }

  let isHurt = state.enemyHurtTime && Date.now() - state.enemyHurtTime < 300;
  if (isHurt) {
    x += Math.sin(Date.now() * 0.25) * 10;
  }

  ctx.translate(x, y);
  ctx.scale(1, scaleY);
  ctx.rotate(bodyRot);

  if (isHurt && Math.floor(Date.now() / 40) % 2 === 0) {
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'var(--mega-red)';
  }

  let headTopY = -45;

  if (e.isBoss) {
    headTopY = e.type === 'archfiend' ? -150 : -95;
    
    if (e.type === 'dodonga') { // カットマン
      if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
        ctx.fillStyle = '#d01010';
        ctx.strokeStyle = '#fff';
      }
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(0, -30, 22, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, -65, 16, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, -85, 14, Math.PI*1.1, Math.PI*1.9);
      ctx.stroke();

      ctx.fillStyle = 'var(--mega-yellow)';
      ctx.fillRect(-6, -70, 4, 6);
      ctx.fillRect(2, -70, 4, 6);
      
    } else if (e.type === 'chokkinna') { // バブルマン
      if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
        ctx.fillStyle = '#008c5c';
        ctx.strokeStyle = '#fff';
      }
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.ellipse(0, -25, 30, 18, 0, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#00a8f8';
      ctx.beginPath();
      ctx.arc(0, -50, 14, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'var(--mega-yellow)';
      ctx.lineWidth = 4;
      ctx.strokeRect(-8, -54, 16, 8);

      ctx.fillStyle = '#ff6000';
      ctx.beginPath();
      ctx.moveTo(15, -45);
      ctx.lineTo(35, -55);
      ctx.lineTo(25, -25);
      ctx.closePath();
      ctx.fill();

    } else if (e.type === 'shushu') { // ウッドマン
      if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
        ctx.fillStyle = '#8c5000';
        ctx.strokeStyle = '#2b1b00';
      }
      ctx.lineWidth = 4;

      ctx.fillRect(-30, -70, 60, 70);
      
      ctx.fillStyle = 'var(--mega-yellow)';
      ctx.fillRect(-15, -55, 6, 6);
      ctx.fillRect(9, -55, 6, 6);

      ctx.fillStyle = '#4c9800';
      ctx.beginPath();
      ctx.arc(-30, -65, 12, 0, Math.PI*2);
      ctx.arc(30, -65, 12, 0, Math.PI*2);
      ctx.fill();

    } else if (e.type === 'garuru') { // クイックマン
      if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
        ctx.fillStyle = '#e40058';
        ctx.strokeStyle = '#fff';
      }
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(-15, 0);
      ctx.lineTo(-25, -50);
      ctx.lineTo(10, -50);
      ctx.lineTo(15, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(-5, -68, 14, 0, Math.PI*2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'var(--mega-yellow)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(-20, -78);
      ctx.lineTo(0, -96);
      ctx.lineTo(20, -78);
      ctx.stroke();

    } else if (e.type === 'archfiend') { // ワイリーマシン
      if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
        ctx.fillStyle = '#cccccc';
        ctx.strokeStyle = '#000';
      }
      ctx.lineWidth = 4;

      ctx.beginPath();
      ctx.ellipse(0, -70, 60, 45, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#1c002c';
      ctx.beginPath();
      ctx.arc(-22, -80, 15, 0, Math.PI*2);
      ctx.arc(22, -80, 15, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = 'var(--mega-red)';
      ctx.beginPath();
      ctx.arc(-20 + Math.sin(Date.now()*0.02)*3, -80, 5, 0, Math.PI*2);
      ctx.arc(20 + Math.sin(Date.now()*0.02)*3, -80, 5, 0, Math.PI*2);
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.fillRect(-20, -45, 8, 10);
      ctx.fillRect(-8, -45, 8, 10);
      ctx.fillRect(4, -45, 8, 10);
      ctx.fillRect(16, -45, 8, 10);
      
      ctx.strokeStyle = 'var(--mega-red)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-45, -110);
      ctx.lineTo(-30, -95);
      ctx.lineTo(-15, -110);
      ctx.stroke();
    }
  } else {
    // メットール
    if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
      ctx.fillStyle = 'var(--mega-yellow)';
      ctx.strokeStyle = '#000';
    }
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.arc(0, -22, 22, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.fillRect(-4, -20, 8, 16);
    ctx.fillRect(-10, -14, 20, 6);

    ctx.fillStyle = 'var(--neon-green)';
    ctx.fillRect(-18, -4, 12, 5);
    ctx.fillRect(6, -4, 12, 5);

    const isAttacking = anim && anim.type === 'attack';
    if (isAttacking) {
      ctx.fillStyle = '#ffdbb5';
      ctx.fillRect(-12, -15, 24, 11);
      ctx.fillStyle = '#000';
      ctx.fillRect(-6, -12, 2, 6);
      ctx.fillRect(4, -12, 2, 6);
    }
  }

  // 敵頭上HPバー
  const barWidth = e.isBoss ? 150 : 70;
  const barHeight = e.isBoss ? 12 : 8;
  const hpPct = Math.max(0, e.hp / e.maxHp);
  const barY = headTopY - 15;

  ctx.fillStyle = '#000000';
  ctx.strokeStyle = isHurt ? 'var(--mega-yellow)' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
  ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);

  ctx.fillStyle = 'var(--mega-red)';
  ctx.fillRect(-barWidth/2 + 1, barY + 1, (barWidth - 2) * hpPct, barHeight - 2);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px var(--font-pixel)';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.fillText(`${e.hp} / ${e.maxHp}`, 0, barY - 6);
  ctx.shadowBlur = 0;

  if (e.isBoss && e.isChargingAttack) {
    ctx.fillStyle = 'var(--mega-yellow)';
    ctx.font = 'bold 10px var(--font-pixel)';
    ctx.textAlign = 'center';
    
    let guide = "D D A S / S A S A!";
    if (e.pendingAttackType === 'high') guide = "DUCK: D S D S!";
    else if (e.pendingAttackType === 'low') guide = "JUMP: S D S D!";
    
    ctx.fillText(`! WARNING: ${guide} !`, 0, barY - 20 + Math.sin(Date.now() * 0.15) * 3);
  }

  ctx.restore();
}

// パーティクル更新
function updateAndDrawParticles() {
  if (!ctx) return;
  const now = Date.now();
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    const age = now - p.created;
    if (age > p.life) {
      state.particles.splice(i, 1);
      continue;
    }

    const pct = age / p.life;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity || 0;

    ctx.save();
    
    if (p.isText) {
      ctx.globalAlpha = 1 - pct;
      ctx.fillStyle = p.color;
      ctx.font = p.font || 'bold 16px var(--font-mono)';
      ctx.textAlign = 'center';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.isBullet) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fill();
    } else if (p.isRing) {
      ctx.globalAlpha = 1 - pct;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * pct * 4, 0, Math.PI*2);
      ctx.stroke();
    } else {
      ctx.globalAlpha = 1 - pct;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - pct), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function spawnTextParticle(x, y, text, color, isCritical = false) {
  state.particles.push({
    x, y,
    vx: (Math.random() - 0.5) * 2,
    vy: -4 - Math.random() * 3,
    gravity: 0.08,
    color,
    text,
    isText: true,
    font: isCritical ? 'bold 18px var(--font-pixel)' : 'bold 16px var(--font-pixel)',
    life: 1000,
    created: Date.now()
  });
}

function spawnHitParticles(x, y, color) {
  state.particles.push({
    x, y, vx: 0, vy: 0,
    size: 20,
    color: '#fff',
    isRing: true,
    life: 400,
    created: Date.now()
  });
  state.particles.push({
    x, y, vx: 0, vy: 0,
    size: 30,
    color: 'var(--mega-cyan)',
    isRing: true,
    life: 600,
    created: Date.now()
  });

  for (let i = 0; i < 15; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 2,
      gravity: 0.12,
      size: 4 + Math.random() * 4,
      color,
      life: 500 + Math.random() * 200,
      created: Date.now()
    });
  }
}

// 弾丸生成
function spawnPlayerBullet(startX, startY, color, size, isUltimate) {
  const bulletCount = isUltimate ? 3 : 1;
  for (let i = 0; i < bulletCount; i++) {
    state.particles.push({
      x: startX + 16,
      y: startY - 28 + (isUltimate ? (i - 1) * 12 : 0),
      vx: 14,
      vy: 0,
      size: size,
      color: color,
      isBullet: true,
      life: 700,
      created: Date.now()
    });
  }
}

// メインループ
function gameLoop() {
  if (!state.gameActive) return;

  drawBackground();
  drawPlayer();
  drawEnemy();
  updateAndDrawParticles();

  requestAnimationFrame(gameLoop);
}

// ==========================================
// 5. リズムエンジン & ゲーム判定
// ==========================================
let gameTimer = null;

function startGameEngine() {
  state.gameActive = true;
  state.lastBeatTime = Date.now();
  state.beatCount = 0;
  state.stepCount = 0;
  state.turn = 'input';
  state.phase = 'move';
  state.moveProgress = 0;
  
  sounds.init();
  updateUI();
  
  if (gameTimer) clearInterval(gameTimer);
  gameTimer = setInterval(tick, 10);
  
  requestAnimationFrame(gameLoop);
}

function stopGameEngine() {
  state.gameActive = false;
  if (gameTimer) clearInterval(gameTimer);
}

function tick() {
  const now = Date.now();
  const elapsed = now - state.lastBeatTime;

  if (elapsed >= state.beatInterval) {
    state.lastBeatTime += state.beatInterval;
    state.beatCount = (state.beatCount + 1) % 4;
    state.stepCount++;
    state.hasInputThisBeat = false;

    const isFirstBeat = (state.beatCount === 0);
    sounds.playMetronome(isFirstBeat);
    sounds.playBgmTick(state.beatCount, state.stepCount, state.fever);

    updateRhythmUI(state.beatCount);

    if (state.beatCount === 0) {
      handleMeasureEnd();
    }
  }

  const progressPct = (elapsed / state.beatInterval) * 100;
  const progressEl = document.getElementById('beat-progress-bar');
  if (progressEl) {
    progressEl.style.width = `${progressPct}%`;
  }
}

function updateRhythmUI(beatIndex) {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`beat-${i + 1}`);
    if (dot) {
      dot.classList.remove('active', 'fever');
      if (i === beatIndex) {
        dot.classList.add(state.fever ? 'fever' : 'active');
      }
    }
  }
}

function handleMeasureEnd() {
  const feedbackEl = document.getElementById('rhythm-feedback');
  const echoEl = document.getElementById('player-input-echo');

  if (state.turn === 'input') {
    state.turn = 'action';
    
    const isFullInput = state.currentInputs.length === 4 && state.currentInputs.every(x => x !== undefined && x !== null);
    let matchedCmd = null;

    if (isFullInput) {
      for (const [key, cmd] of Object.entries(COMMANDS)) {
        const isMatch = cmd.pattern.every((val, idx) => state.currentInputs[idx].name === val);
        if (isMatch) {
          matchedCmd = { key, ...cmd };
          break;
        }
      }
    }

    if (matchedCmd) {
      const p = state.player;
      const isUnlocked = !matchedCmd.minEvo || p.evoIndex >= matchedCmd.minEvo;
      const isFeverValid = !matchedCmd.feverOnly || state.fever;

      if (isUnlocked && isFeverValid) {
        const averageDiff = state.currentInputs.reduce((sum, input) => sum + input.diff, 0) / 4;
        let quality = 'GOOD';
        if (averageDiff <= state.perfectWindow) {
          quality = 'PERFECT';
          state.combo += 2;
          state.feverMeter = Math.min(100, state.feverMeter + 20);
        } else {
          state.combo += 1;
          state.feverMeter = Math.min(100, state.feverMeter + 10);
        }

        if (state.combo >= 10 || state.feverMeter >= 100) {
          if (!state.fever) {
            state.fever = true;
            document.getElementById('fever-banner').classList.remove('hidden');
            spawnTextParticle(400, 150, "OVER DRIVE!!", 'var(--mega-yellow)', true);
          }
        }

        feedbackEl.innerText = `${quality}! [${matchedCmd.name.toUpperCase()}]`;
        feedbackEl.className = `rhythm-feedback ${quality.toLowerCase()}`;
        state.nextAction = matchedCmd.key;
      } else {
        handleMiss("SYS UNLOCKED ERROR");
      }
    } else {
      if (state.currentInputs.length > 0) {
        handleMiss("SYNC ERROR");
      } else {
        handleMiss("NO LINK");
      }
    }

    state.currentInputs = [];

  } else {
    state.turn = 'input';
    
    echoEl.innerHTML = "";
    feedbackEl.innerText = "STANDBY..";
    feedbackEl.className = "rhythm-feedback";
    state.nextAction = null;

    if (state.phase === 'combat' && state.enemy && state.enemy.isBoss) {
      if (!state.enemy.isChargingAttack && Math.random() < 0.4) {
        state.enemy.isChargingAttack = true;
        
        const types = ['high', 'low', 'sweep'];
        state.enemy.pendingAttackType = types[Math.floor(Math.random() * types.length)];
        
        let warnText = "突進攻撃の予兆！防壁 (D D A S) または 後退 (S A S A) で備えよ！";
        if (state.enemy.pendingAttackType === 'high') warnText = "上段攻撃の予兆！スライド (D S D S) で回避せよ！";
        else if (state.enemy.pendingAttackType === 'low') warnText = "下段攻撃の予兆！ジャンプ (S D S D) で回避せよ！";
        
        state.combatLog = `[ALERT] ${state.enemy.name}が${warnText}`;
        state.enemyActionAnim = { type: 'roar', start: Date.now() };
      }
    }
  }

  updateUI();
}

function handleMiss(message) {
  const feedbackEl = document.getElementById('rhythm-feedback');
  feedbackEl.innerText = message;
  feedbackEl.className = "rhythm-feedback miss";
  
  state.combo = 0;
  state.fever = false;
  state.feverMeter = Math.max(0, state.feverMeter - 25);
  document.getElementById('fever-banner').classList.add('hidden');
  
  state.nextAction = null;
  state.isCharged = false;
}

// ドラム入力判定
function triggerDrumInput(type, padId) {
  sounds.playDrum(type);

  const pad = document.getElementById(padId);
  if (pad) {
    pad.classList.add('active');
    setTimeout(() => pad.classList.remove('active'), 100);
  }

  if (state.hasInputThisBeat) return;
  state.hasInputThisBeat = true;

  const now = Date.now();
  const elapsed = now - state.lastBeatTime;
  
  let diff = elapsed;
  if (elapsed > state.beatInterval / 2) {
    diff = state.beatInterval - elapsed;
  }

  state.currentInputs.push({
    name: type,
    diff: diff
  });

  const echoEl = document.getElementById('player-input-echo');
  if (echoEl) {
    const note = document.createElement('div');
    note.className = `echo-note ${type}`;
    // エコーの擬音テキストもキー名に合わせる
    let keyChar = "A";
    if (type === 'pon') keyChar = "S";
    else if (type === 'chaka') keyChar = "D";
    else if (type === 'don') keyChar = "F";
    note.innerText = keyChar;
    echoEl.appendChild(note);
  }

  let timingText = "MISS";
  let color = 'var(--mega-red)';
  if (diff <= state.perfectWindow) {
    timingText = "PERFECT";
    color = 'var(--mega-yellow)';
  } else if (diff <= state.goodWindow) {
    timingText = "GOOD";
    color = 'var(--neon-green)';
  }
  
  const inputIndex = state.currentInputs.length - 1;
  spawnTextParticle(150 + inputIndex * 130, 220, timingText, color);
}

// ==========================================
// 6. アクション効果・移動・回避・ジャンプ・しゃがみ判定
// ==========================================
function executeActionTurn(actionKey) {
  const p = state.player;
  const wp = WEAPONS_DB[p.equippedId] || WEAPONS_DB.wood_spear;

  state.playerActionAnim = {
    type: actionKey,
    start: Date.now()
  };

  const cmd = COMMANDS[actionKey];
  if (cmd) {
    cmd.pattern.forEach((syllable, idx) => {
      setTimeout(() => {
        if (state.gameActive && state.turn === 'action') {
          sounds.singRobotAction(syllable, idx);
        }
      }, idx * state.beatInterval);
    });
  }

  // 移動フェーズ中
  if (state.phase === 'move') {
    if (actionKey === 'walk') { // DASH
      state.moveProgress++;
      state.combatLog = `前進プログラム実行... 次のエリアまであと [ ${state.moveRequired - state.moveProgress} ] ダッシュ！`;
      
      for (let i = 0; i < 5; i++) {
        state.particles.push({
          x: state.playerX - 20, y: 295,
          vx: -3 - Math.random()*3, vy: -1 - Math.random()*2,
          size: 2 + Math.random()*3, color: 'var(--mega-cyan)',
          life: 400, created: Date.now()
        });
      }

      if (state.moveProgress >= state.moveRequired) {
        state.phase = 'combat';
        state.moveProgress = 0;
        state.playerX = 200;
        spawnEnemy();
        state.combatLog = `[WARNING] 敵セキュリティロボ出現！戦闘フェーズに移行します。`;
      }
    } else {
      state.combatLog = "移動中... 前進するにはDASH (A A A S) を実行してください。";
    }
    updateUI();
    return;
  }

  if (!state.enemy) return;

  // 1. DASH
  if (actionKey === 'walk') {
    state.playerX = Math.min(state.enemyX - 100, state.playerX + 120);
    state.combatLog = `ダッシュ前進。現在X:${state.playerX} (敵距離:${Math.abs(state.enemyX - state.playerX)})`;
  } 
  // 2. RETREAT
  else if (actionKey === 'retreat') {
    state.playerX = Math.max(80, state.playerX - 120);
    state.combatLog = `緊急後退。現在X:${state.playerX} (敵距離:${Math.abs(state.enemyX - state.playerX)})`;
  }
  // 3. JUMP
  else if (actionKey === 'jump') {
    state.combatLog = "ジャンプ回避システム起動！";
  }
  // 4. DUCK
  else if (actionKey === 'duck') {
    state.combatLog = "スライディング回避システム起動！";
  }
  // 5. 射撃
  else if (actionKey === 'attack') {
    state.combatLog = "バスター射撃準備。";
    
    const bColor = state.fever ? 'var(--mega-yellow)' : (wp.rarity === 'legendary' ? '#ff3fde' : 'var(--mega-cyan)');
    const bSize = state.isCharged ? 14 : 6;
    setTimeout(() => {
      if (state.gameActive && state.phase === 'combat') {
        spawnPlayerBullet(state.playerX, 300, bColor, bSize, state.fever);
      }
    }, state.beatInterval * 1.5);

    setTimeout(() => {
      if (!state.gameActive || !state.enemy || state.phase !== 'combat') return;

      const distance = Math.abs(state.enemyX - state.playerX);
      if (distance > wp.range) {
        state.combatLog = `射程外！ (距離:${distance} > 射程:${wp.range}) 前進 (A A A S) せよ！`;
        spawnTextParticle(state.enemyX, 240, "RANGE OUT!", 'var(--mega-gray)', false);
        state.isCharged = false;
        return;
      }
      
      const isCrit = Math.random() * 100 < (p.crit + (wp.crit || 0));
      let dmg = p.baseAtk + (wp.atk || 0);
      
      if (state.isCharged) {
        dmg *= 3;
        state.isCharged = false;
        state.combatLog = "フルチャージバスター直撃！";
      }

      if (isCrit) dmg = Math.floor(dmg * 1.5);
      if (state.fever) dmg = Math.floor(dmg * 1.25);

      const finalDmg = Math.max(1, dmg - state.enemy.def);
      state.enemy.hp = Math.max(0, state.enemy.hp - finalDmg);
      state.enemyHurtTime = Date.now();

      spawnHitParticles(state.enemyX, 260, isCrit ? 'var(--mega-yellow)' : 'var(--mega-cyan)');
      spawnTextParticle(state.enemyX, 180, `${finalDmg}${isCrit ? ' CRITICAL!' : ''}`, isCrit ? 'var(--mega-yellow)' : '#fff', isCrit);

      if (state.enemy.hp <= 0) {
        handleEnemyDefeat();
      }
    }, state.beatInterval * 2.5);
  } 
  // 6. 防壁
  else if (actionKey === 'defend') {
    state.combatLog = "シールド展開。";
  } 
  // 7. 同調
  else if (actionKey === 'charge') {
    state.combatLog = "エネルギー同調チャージ。";
    state.isCharged = true;
  } 
  // 8. E缶
  else if (actionKey === 'miracle') {
    state.combatLog = "E缶起動！全体爆破発射！";
    
    setTimeout(() => {
      if (!state.gameActive || state.phase !== 'combat') return;

      const dmg = Math.floor((p.baseAtk + (wp.atk || 0)) * 2.8);
      state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
      state.enemyHurtTime = Date.now();
      
      spawnHitParticles(state.enemyX, 260, 'var(--mega-yellow)');
      spawnTextParticle(state.enemyX, 150, `${dmg} (BURST)`, 'var(--mega-yellow)', true);

      const heal = Math.floor(p.maxHp * 0.35);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      spawnHitParticles(state.playerX, 250, 'var(--neon-green)');
      spawnTextParticle(state.playerX, 200, `+${heal} LIFE`, 'var(--neon-green)');

      if (state.enemy.hp <= 0) {
        handleEnemyDefeat();
      }
    }, state.beatInterval * 2.5);
  }

  // 敵の反撃
  setTimeout(() => {
    if (!state.gameActive || !state.enemy || state.enemy.hp <= 0 || state.phase !== 'combat') return;

    state.enemyActionAnim = {
      type: state.enemy.isChargingAttack ? 'roar' : 'attack',
      start: Date.now()
    };

    let enemyDmg = state.enemy.atk;
    let attackRange = 250; 
    let attackType = 'sweep';

    if (state.enemy.isChargingAttack) {
      enemyDmg *= 2.3;
      state.enemy.isChargingAttack = false;
      attackRange = 350;
      attackType = state.enemy.pendingAttackType || 'sweep';
    }

    const distance = Math.abs(state.enemyX - state.playerX);
    let avoidSuccess = false;

    // 回避判定
    if (distance > attackRange) {
      avoidSuccess = true;
      state.combatLog = `${state.enemy.name}の攻撃を間合い外で完全回避 (DODGE)！`;
    } else if (attackType === 'high' && actionKey === 'duck') {
      avoidSuccess = true;
      state.combatLog = `${state.enemy.name}の上段攻撃をスライド(DUCK)で潜り抜けた！ (DODGE)`;
    } else if (attackType === 'low' && actionKey === 'jump') {
      avoidSuccess = true;
      state.combatLog = `${state.enemy.name}の下段攻撃をジャンプ(JUMP)で跳び越えた！ (DODGE)`;
    }

    if (avoidSuccess) {
      spawnTextParticle(state.playerX, 180, "DODGE!", 'var(--mega-cyan)', true);
      updateUI();
      return;
    }

    const isPlayerDefending = (actionKey === 'defend');
    if (isPlayerDefending) {
      enemyDmg = Math.floor(enemyDmg * 0.15);
      state.combatLog = `${state.enemy.name}の直撃をシールドで最小限に防いだ！`;
      spawnTextParticle(state.playerX, 180, "BLOCK!", 'var(--mega-cyan)');
    } else {
      state.combatLog = `${state.enemy.name}の直撃を受けました！`;
      if (attackType === 'high') state.combatLog += " (上段攻撃には DUCK: D S D S が有効です)";
      if (attackType === 'low') state.combatLog += " (下段攻撃には JUMP: S D S D が有効です)";
    }

    const finalEnemyDmg = Math.max(1, enemyDmg - p.baseDef);
    p.hp = Math.max(0, p.hp - finalEnemyDmg);
    state.playerHurtTime = Date.now();

    spawnHitParticles(state.playerX, 250, 'var(--mega-red)');
    spawnTextParticle(state.playerX, 210, `-${finalEnemyDmg}`, 'var(--mega-red)');

    if (p.hp <= 0) {
      handlePlayerDefeat();
    }

    updateUI();

  }, state.beatInterval * 3.5);
}

// ----------------------------------------
// 7. ゲーム進行 (カプセル、討伐、ネジ)
// ----------------------------------------

function spawnEnemy() {
  const isBossWave = (state.distanceToBoss === 0);
  const scale = Math.pow(1.2, state.stage - 1) * Math.pow(1.05, state.wave - 1);
  
  if (isBossWave) {
    const bossIndex = (state.stage - 1) % 5;
    const bosses = [
      { name: "DWN-003 カットマン", type: "dodonga", hp: 350, atk: 25, def: 8 },
      { name: "DWN-011 バブルマン", type: "chokkinna", hp: 500, atk: 35, def: 15 },
      { name: "DWN-016 ウッドマン", type: "shushu", hp: 700, atk: 40, def: 12 },
      { name: "DWN-012 クイックマン", type: "garuru", hp: 950, atk: 55, def: 18 },
      { name: "ワイリーマシン 1号", type: "archfiend", hp: 1400, atk: 75, def: 25 }
    ];
    const b = bosses[bossIndex];
    state.enemy = {
      name: b.name,
      type: b.type,
      hp: Math.floor(b.hp * scale),
      maxHp: Math.floor(b.hp * scale),
      atk: Math.floor(b.atk * scale),
      def: Math.floor(b.def * scale),
      isBoss: true,
      isChargingAttack: false,
      pendingAttackType: 'sweep'
    };
    state.combatLog = `[ALERT] ボスロボ『${state.enemy.name}』を検知！`;
  } else {
    const names = ["メットール", "バットンロボ", "ジョー防衛型", "スクリュー敵"];
    const name = names[Math.floor(Math.random() * names.length)];
    state.enemy = {
      name,
      type: "zako",
      hp: Math.floor((40 + Math.random() * 30) * scale),
      maxHp: Math.floor((40 + Math.random() * 30) * scale),
      atk: Math.floor((10 + Math.random() * 6) * scale),
      def: Math.floor((2 + Math.random() * 3) * scale),
      isBoss: false,
      pendingAttackType: 'sweep'
    };
    state.combatLog = `敵セキュリティ『${state.enemy.name}』が出現。`;
  }
  
  state.enemyX = 600;
  updateUI();
}

function handleEnemyDefeat() {
  const e = state.enemy;
  const p = state.player;
  
  const baseExp = e.isBoss ? 150 : 25;
  const baseGold = e.isBoss ? 100 : 15;
  const expGained = Math.floor(baseExp * Math.pow(1.1, state.stage - 1));
  const goldGained = Math.floor(baseGold * Math.pow(1.1, state.stage - 1));

  p.xp += expGained;
  p.gold += goldGained;
  state.combatLog = `${e.name}を完全デリート。 ${expGained} XP と ネジ ${goldGained}個を獲得！`;

  let chestDropped = false;
  let chestType = 'wood';
  const rand = Math.random() * 100;
  
  if (e.isBoss) {
    chestDropped = true;
    if (rand < 25) chestType = 'jeweled';
    else if (rand < 65) chestType = 'gold';
    else chestType = 'iron';
  } else {
    if (rand < 35) {
      chestDropped = true;
      const r2 = Math.random() * 100;
      const bonus = state.stage * 3;
      if (r2 + bonus > 92) chestType = 'jeweled';
      else if (r2 + bonus > 75) chestType = 'gold';
      else if (r2 + bonus > 45) chestType = 'iron';
      else chestType = 'wood';
    }
  }

  if (chestDropped) {
    p.chests.push(chestType);
    state.combatLog += ` カプセル（${getChestName(chestType)}）を回収。`;
  }

  checkLevelUp();

  if (e.isBoss) {
    p.bossKills++;
    if (p.bossKills >= 5) {
      state.stage++;
      p.bossKills = 0;
      state.combatLog += ` STAGE ${state.stage} (ベース深部) へ侵入。`;
    }
    state.distanceToBoss = 4;
  } else {
    state.distanceToBoss = Math.max(0, state.distanceToBoss - 1);
  }

  state.wave++;
  
  state.phase = 'move';
  state.moveProgress = 0;
  state.moveRequired = 2 + Math.floor(Math.random() * 3);
  state.playerX = 200;
  state.enemy = null;

  updateUI();
}

function handlePlayerDefeat() {
  stopGameEngine();
  document.getElementById('gameover-overlay').classList.remove('hidden');
  document.getElementById('gameover-title').innerText = "MISSION FAILED";
  document.getElementById('gameover-reason').innerText = `到達エリア: STAGE ${state.stage} - WAVE ${state.wave}`;
}

function checkLevelUp() {
  const p = state.player;
  let leveledUp = false;
  
  while (p.xp >= p.nextXp) {
    p.xp -= p.nextXp;
    p.level++;
    p.nextXp = Math.floor(p.nextXp * 1.3);
    
    p.maxHp += 15;
    p.hp = p.maxHp;
    p.baseAtk += 4;
    p.baseDef += 2;
    p.sp += 3;
    
    leveledUp = true;
  }

  if (leveledUp) {
    state.combatLog = `システムアップデート！ Lv. ${p.level} 到達。ネジ:${p.gold}`;
    spawnTextParticle(state.playerX, 100, "SYSTEM UPGRADE!", 'var(--mega-yellow)', true);
    checkEvolution();
  }
}

function checkEvolution() {
  const p = state.player;
  let newEvoIndex = p.evoIndex;

  for (let i = EVO_STEPS.length - 1; i >= 0; i--) {
    if (p.level >= EVO_STEPS[i].minLevel) {
      newEvoIndex = i;
      break;
    }
  }

  if (newEvoIndex > p.evoIndex) {
    p.evoIndex = newEvoIndex;
    const evo = EVO_STEPS[p.evoIndex];
    state.combatLog += ` アーマー換装：『${evo.name}』。`;
    spawnTextParticle(state.playerX, 70, `ARMOR ATTACHED: ${evo.name}`, 'var(--mega-red)', true);
    
    if (p.evoIndex >= 1 && !p.unlockedCommands.includes('defend')) p.unlockedCommands.push('defend');
    if (p.evoIndex >= 2 && !p.unlockedCommands.includes('charge')) p.unlockedCommands.push('charge');
    if (p.evoIndex >= 3 && !p.unlockedCommands.includes('miracle')) p.unlockedCommands.push('miracle');
  }
}

function getChestName(type) {
  if (type === 'wood') return 'ブロンズ';
  if (type === 'iron') return 'シルバー';
  if (type === 'gold') return 'ゴールド';
  if (type === 'jeweled') return 'プラチナ';
  return '未定義';
}

function getChestIcon(type) {
  if (type === 'wood') return '🟫';
  if (type === 'iron') return '⬜';
  if (type === 'gold') return '🟨';
  if (type === 'jeweled') return '🔮';
  return '🟫';
}

function openChest(index) {
  const p = state.player;
  if (index < 0 || index >= p.chests.length) return;
  
  const chestType = p.chests[index];
  p.chests.splice(index, 1);

  let pool = [];
  if (chestType === 'wood') {
    pool = ['wood_spear', 'stone_spear', 'wood_shield'];
  } else if (chestType === 'iron') {
    pool = ['stone_spear', 'iron_spear', 'iron_shield', 'hunter_bow'];
  } else if (chestType === 'gold') {
    pool = ['iron_spear', 'ice_spear', 'gold_shield', 'fire_bow', 'crystal_staff'];
  } else if (chestType === 'jeweled') {
    pool = ['ice_spear', 'gungnir', 'aegis', 'failures_bow', 'shadow_bow', 'sage_staff', 'excalibur'];
  }

  const selectedId = pool[Math.floor(Math.random() * pool.length)] || 'wood_spear';
  const wp = WEAPONS_DB[selectedId];

  p.inventory.push(selectedId);
  state.combatLog = `データカプセル解析完了。チップ『${wp.name}』をバッファに格納。`;
  
  updateUI();
  renderInventory();
}

function getRarityText(rarity) {
  if (rarity === 'common') return 'コモン';
  if (rarity === 'uncommon') return 'アンコモン';
  if (rarity === 'rare') return 'レア';
  if (rarity === 'legendary') return 'レジェンダリー';
  return rarity;
}

function equipWeapon(inventoryIndex) {
  const p = state.player;
  if (inventoryIndex < 0 || inventoryIndex >= p.inventory.length) return;
  
  const weaponId = p.inventory[inventoryIndex];
  
  if (weaponId === 'excalibur' && p.evoIndex < 4) {
    alert("このバスターパーツはアルティメットアーマー専用です！");
    return;
  }

  p.equippedId = weaponId;
  state.combatLog = `バスターパーツに『${WEAPONS_DB[weaponId].name}』をロード。`;
  
  updateUI();
  renderInventory();
}

// ==========================================
// 8. UIレンダリング & 縦型HPゲージ制御
// ==========================================

function updateUI() {
  const p = state.player;
  const wp = WEAPONS_DB[p.equippedId] || WEAPONS_DB.wood_spear;
  
  const stageTxt = document.getElementById('stage-text');
  const floorTxt = document.getElementById('floor-text');
  const goldVal = document.getElementById('gold-value');
  const bossKills = document.getElementById('boss-kills');
  const heroClass = document.getElementById('hero-class');
  const heroAvatar = document.getElementById('hero-avatar');
  const heroXpBar = document.getElementById('hero-xp-bar');
  const heroXpText = document.getElementById('hero-xp-text');
  const statHp = document.getElementById('stat-hp');
  const statAtk = document.getElementById('stat-atk');
  const statDef = document.getElementById('stat-def');
  const statCrit = document.getElementById('stat-crit');
  const spWarning = document.getElementById('sp-warning');
  const spPoints = document.getElementById('sp-points');
  const spHpBtn = document.getElementById('sp-hp-btn');
  const spAtkBtn = document.getElementById('sp-atk-btn');
  const spDefBtn = document.getElementById('sp-def-btn');
  const evoInfoText = document.getElementById('evo-info-text');
  const eqIcon = document.getElementById('eq-icon');
  const eqName = document.getElementById('eq-name');
  const eqStats = document.getElementById('eq-stats');
  const comboDisplay = document.getElementById('combo-display');

  if (stageTxt) stageTxt.innerText = `STAGE ${state.stage}`;
  if (floorTxt) floorTxt.innerText = `WAVE ${state.wave} (BOSS WAVE まで ${state.distanceToBoss})`;
  if (goldVal) goldVal.innerText = p.gold;
  if (bossKills) bossKills.innerText = `${p.bossKills} / 5`;
  
  const evo = EVO_STEPS[p.evoIndex];
  if (heroClass) heroClass.innerText = `${evo.name} (Lv. ${p.level})`;
  if (heroAvatar) heroAvatar.innerText = evo.avatar;
  
  const xpPct = (p.xp / p.nextXp) * 100;
  if (heroXpBar) heroXpBar.style.width = `${xpPct}%`;
  if (heroXpText) heroXpText.innerText = `${p.xp} / ${p.nextXp} XP`;

  const totalHp = p.maxHp + (wp.hp || 0);
  const totalAtk = p.baseAtk + (wp.atk || 0);
  const totalDef = p.baseDef + (wp.def || 0);
  const totalCrit = p.crit + (wp.crit || 0);

  if (statHp) statHp.innerText = `${p.hp} / ${totalHp} (基本:${p.maxHp})`;
  if (statAtk) statAtk.innerText = `${totalAtk} (基本:${p.baseAtk})`;
  if (statDef) statDef.innerText = `${totalDef} (基本:${p.baseDef})`;
  if (statCrit) statCrit.innerText = `${totalCrit}%`;

  renderVerticalHpBar(p.hp, totalHp);

  if (p.sp > 0) {
    if (spWarning) spWarning.classList.remove('hidden');
    if (spPoints) spPoints.innerText = p.sp;
    if (spHpBtn) spHpBtn.classList.remove('hidden');
    if (spAtkBtn) spAtkBtn.classList.remove('hidden');
    if (spDefBtn) spDefBtn.classList.remove('hidden');
  } else {
    if (spWarning) spWarning.classList.add('hidden');
    if (spHpBtn) spHpBtn.classList.add('hidden');
    if (spAtkBtn) spAtkBtn.classList.add('hidden');
    if (spDefBtn) spDefBtn.classList.add('hidden');
  }

  EVO_STEPS.forEach((step, idx) => {
    const stepEl = document.getElementById(`evo-${idx}`);
    if (stepEl) {
      if (idx <= p.evoIndex) stepEl.classList.add('active');
      else stepEl.classList.remove('active');
    }
  });

  const nextEvo = EVO_STEPS[p.evoIndex + 1];
  if (evoInfoText) {
    if (nextEvo) {
      const needed = nextEvo.minLevel - p.level;
      evoInfoText.innerText = `NEXT ARMOR AT LV. ${nextEvo.minLevel} (NEED ${needed} LV)`;
    } else {
      evoInfoText.innerText = "MAX ARMOR SYSTEM READY";
    }
  }

  if (eqIcon) eqIcon.innerText = wp.icon;
  if (eqName) eqName.innerText = wp.name;
  if (eqStats) eqStats.innerText = `ATK +${wp.atk || 0}, HP +${wp.hp || 0}, DEF +${wp.def || 0}, RANGE ${wp.range || 0}`;
  
  const cardBadge = document.querySelector('#equipped-card .rarity-badge');
  if (cardBadge) {
    cardBadge.className = `rarity-badge rarity-${wp.rarity}`;
    cardBadge.innerText = getRarityText(wp.rarity).toUpperCase();
  }

  updateFooterCommandGuide();

  // HUDコマンドガイドの解放状況
  const hudWalk = document.getElementById('hud-cmd-walk');
  const hudRetreat = document.getElementById('hud-cmd-retreat');
  const hudJump = document.getElementById('hud-cmd-jump');
  const hudDuck = document.getElementById('hud-cmd-duck');
  const hudDefend = document.getElementById('hud-cmd-defend');
  const hudCharge = document.getElementById('hud-cmd-charge');
  const hudMiracle = document.getElementById('hud-cmd-miracle');

  if (hudWalk) hudWalk.classList.remove('locked');
  if (hudRetreat) hudRetreat.classList.remove('locked');
  if (hudJump) hudJump.classList.remove('locked');
  if (hudDuck) hudDuck.classList.remove('locked');
  if (hudDefend) {
    if (p.unlockedCommands.includes('defend')) hudDefend.classList.remove('locked');
    else hudDefend.classList.add('locked');
  }
  if (hudCharge) {
    if (p.unlockedCommands.includes('charge')) hudCharge.classList.remove('locked');
    else hudCharge.classList.add('locked');
  }
  if (hudMiracle) {
    if (p.unlockedCommands.includes('miracle')) hudMiracle.classList.remove('locked');
    else hudMiracle.classList.add('locked');
  }

  if (comboDisplay) {
    if (state.combo > 0) {
      comboDisplay.classList.remove('hidden');
      comboDisplay.innerText = `${state.combo} SYNC`;
    } else {
      comboDisplay.classList.add('hidden');
    }
  }
}

// 縦型HPゲージをセグメントドットでレンダリング
function renderVerticalHpBar(hp, maxHp) {
  const hpBarContainer = document.getElementById('mega-hp-bar');
  if (!hpBarContainer) return;

  hpBarContainer.innerHTML = '';
  
  const totalSegments = 28;
  const activeSegments = Math.ceil((hp / maxHp) * totalSegments);
  
  for (let i = totalSegments - 1; i >= 0; i--) {
    const dot = document.createElement('div');
    dot.className = 'mega-hp-dot';
    
    if (i >= activeSegments) {
      dot.style.background = '#000000';
    } else {
      if (hp / maxHp < 0.25) {
        dot.style.background = 'var(--mega-red)';
      } else {
        dot.style.background = 'var(--mega-yellow)';
      }
    }
    hpBarContainer.appendChild(dot);
  }
}

function updateFooterCommandGuide() {
  const p = state.player;
  const defendBadge = document.getElementById('help-cmd-defend');
  const chargeBadge = document.getElementById('help-cmd-charge');
  const miracleBadge = document.getElementById('help-cmd-miracle');

  if (defendBadge && p.unlockedCommands.includes('defend')) defendBadge.classList.remove('disabled');
  if (chargeBadge && p.unlockedCommands.includes('charge')) chargeBadge.classList.remove('disabled');
  if (miracleBadge && p.unlockedCommands.includes('miracle')) miracleBadge.classList.remove('disabled');
}

function renderInventory() {
  const p = state.player;
  
  const chestGrid = document.getElementById('chest-grid');
  if (chestGrid) {
    chestGrid.innerHTML = "";
    if (p.chests.length === 0) {
      chestGrid.innerHTML = `<p class="no-chests">NO CAPSULES IN BUFFER.<br>DEFEAT ENEMY ROBOTS.</p>`;
    } else {
      p.chests.forEach((type, idx) => {
        const el = document.createElement('div');
        el.className = 'chest-item';
        el.innerHTML = `
          <span class="chest-icon">${getChestIcon(type)}</span>
          <span class="chest-label">${getChestName(type)}</span>
        `;
        el.addEventListener('click', () => openChest(idx));
        chestGrid.appendChild(el);
      });
    }
  }

  const weaponsGrid = document.getElementById('weapons-grid');
  if (weaponsGrid) {
    weaponsGrid.innerHTML = "";
    p.inventory.forEach((id, idx) => {
      const wp = WEAPONS_DB[id] || WEAPONS_DB.wood_spear;
      const isEquipped = p.equippedId === id;
      
      const card = document.createElement('div');
      card.className = `weapon-card ${isEquipped ? 'equipped' : ''}`;
      card.innerHTML = `
        <span class="wp-icon">${wp.icon}</span>
        <div class="wp-meta">
          <div class="wp-name">${wp.name}</div>
          <div class="wp-desc">ATK+${wp.atk || 0} RANGE:${wp.range || 0}</div>
          <span class="rarity-badge rarity-${wp.rarity}">${getRarityText(wp.rarity).toUpperCase()}</span>
        </div>
      `;
      card.addEventListener('click', () => equipWeapon(idx));
      weaponsGrid.appendChild(card);
    });
  }
}

// DOMContentLoaded 後のハンドラ初期化
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('game-canvas');
  if (canvas) ctx = canvas.getContext('2d');

  const spHpBtn = document.getElementById('sp-hp-btn');
  const spAtkBtn = document.getElementById('sp-atk-btn');
  const spDefBtn = document.getElementById('sp-def-btn');

  if (spHpBtn) {
    spHpBtn.addEventListener('click', () => {
      if (state.player.sp > 0) {
        state.player.sp--;
        state.player.maxHp += 10;
        state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
        updateUI();
      }
    });
  }

  if (spAtkBtn) {
    spAtkBtn.addEventListener('click', () => {
      if (state.player.sp > 0) {
        state.player.sp--;
        state.player.baseAtk += 2;
        updateUI();
      }
    });
  }

  if (spDefBtn) {
    spDefBtn.addEventListener('click', () => {
      if (state.player.sp > 0) {
        state.player.sp--;
        state.player.baseDef += 1;
        updateUI();
      }
    });
  }

  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const tabId = btn.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      const content = document.getElementById(tabId);
      if (content) content.classList.add('active');
      
      if (tabId === 'inventory-tab') {
        renderInventory();
      }
    });
  });

  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const overlay = document.getElementById('start-overlay');
      if (overlay) overlay.classList.add('hidden');
      startGameEngine();
    });
  }

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      const overlay = document.getElementById('gameover-overlay');
      if (overlay) overlay.classList.add('hidden');
      
      state.player.hp = 100;
      state.player.maxHp = 100;
      state.player.level = 1;
      state.player.xp = 0;
      state.player.nextXp = 100;
      state.player.baseAtk = 15;
      state.player.baseDef = 5;
      state.player.crit = 5;
      state.player.sp = 0;
      state.player.gold = 0;
      state.player.bossKills = 0;
      state.player.equippedId = "wood_spear";
      state.player.inventory = ["wood_spear"];
      state.player.chests = [];
      state.player.evoIndex = 0;
      state.player.unlockedCommands = ['walk', 'retreat', 'attack', 'jump', 'duck'];
      state.playerX = 200;
      
      state.stage = 1;
      state.wave = 1;
      state.distanceToBoss = 4;
      state.combo = 0;
      state.fever = false;
      state.feverMeter = 0;
      state.isCharged = false;
      
      startGameEngine();
    });
  }

  const padPata = document.getElementById('pad-pata');
  const padPon = document.getElementById('pad-pon');
  const padChaka = document.getElementById('pad-chaka');
  const padDon = document.getElementById('pad-don');

  if (padPata) {
    padPata.addEventListener('mousedown', () => {
      if (state.gameActive && state.turn === 'input') triggerDrumInput('pata', 'pad-pata');
    });
  }
  if (padPon) {
    padPon.addEventListener('mousedown', () => {
      if (state.gameActive && state.turn === 'input') triggerDrumInput('pon', 'pad-pon');
    });
  }
  if (padChaka) {
    padChaka.addEventListener('mousedown', () => {
      if (state.gameActive && state.turn === 'input') triggerDrumInput('chaka', 'pad-chaka');
    });
  }
  if (padDon) {
    padDon.addEventListener('mousedown', () => {
      if (state.gameActive && state.turn === 'input') triggerDrumInput('don', 'pad-don');
    });
  }

  updateUI();
});

// キーボード入力監視
window.addEventListener('keydown', (e) => {
  if (!state.gameActive || state.turn !== 'input') return;

  const key = e.key.toLowerCase();
  let drumType = null;
  let padId = null;

  if (key === 'a' || key === 'j') { drumType = 'pata'; padId = 'pad-pata'; }
  else if (key === 's' || key === 'k') { drumType = 'pon'; padId = 'pad-pon'; }
  else if (key === 'd' || key === 'l') { drumType = 'chaka'; padId = 'pad-chaka'; }
  else if (key === 'f' || key === 'i') { drumType = 'don'; padId = 'pad-don'; }

  if (drumType) {
    e.preventDefault();
    triggerDrumInput(drumType, padId);
  }
});

// 実行ループ監視
setInterval(() => {
  if (state.gameActive && state.turn === 'action' && state.nextAction) {
    const actionToRun = state.nextAction;
    state.nextAction = null;
    executeActionTurn(actionToRun);
  }
}, 50);
