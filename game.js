// ----------------------------------------------------
// ROCK BEAT - game.js (Mega Man Style Rhythm Action Engine)
// ----------------------------------------------------

// スプライトアセットのロード＆動的背景透過システム
let playerSpriteCanvas = null;
let enemySpriteCanvas = null;

const playerSprite = new Image();
playerSprite.src = '/player_sprite.jpg';
playerSprite.onload = () => {
  playerSpriteCanvas = createTransparentImage(playerSprite);
};

const enemySprite = new Image();
enemySprite.src = '/enemy_sprite.jpg';
enemySprite.onload = () => {
  enemySpriteCanvas = createTransparentImage(enemySprite);
};

/**
 * 読み込んだ画像の特定背景色を自動検出して透明化した Canvas 要素を作成します。
 */
function createTransparentImage(img) {
  const offCanvas = document.createElement('canvas');
  offCanvas.width = img.naturalWidth;
  offCanvas.height = img.naturalHeight;
  const offCtx = offCanvas.getContext('2d');
  offCtx.drawImage(img, 0, 0);
  
  const imgData = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height);
  const data = imgData.data;
  
  // 左上のピクセル色を背景色として検出
  const rBg = data[0];
  const gBg = data[1];
  const bBg = data[2];
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    
    const dist = Math.sqrt((r - rBg)*(r - rBg) + (g - gBg)*(g - gBg) + (b - bBg)*(b - bBg));
    const isWhite = (r > 225 && g > 225 && b > 225);
    const isBlack = (r < 30 && g < 30 && b < 30);
    
    if (dist < 60 || isWhite || isBlack) {
      data[i+3] = 0;
    }
  }
  
  offCtx.putImageData(imgData, 0, 0);
  return offCanvas;
}

/**
 * 8-bit およびモダンシンセサイザーサウンドの生成・再生を管理するクラス。
 * Web Audio API を使用してオシレータ波形とフィルターをリアルタイム合成します。
 */
class SoundManager {
  constructor() {
    /** @type {AudioContext|null} Web Audio APIのコンテキスト */
    this.ctx = null;
    /** @type {GainNode|null} マスター音量制御ノード */
    this.masterGain = null;
    /** @type {number} BGMの基準音量倍率 */
    this.bgmVolume = 0.12;
    /** @type {number} 効果音(SFX)の基準音量倍率 */
    this.sfxVolume = 0.45;
  }

  /**
   * オーディオコンテキストを初期化します。
   * ブラウザの自動再生防止ポリシーを回避するため、ユーザー操作（スタートクリック）時に呼び出します。
   */
  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
    this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
  }

  /**
   * ドラムパッド入力（キーボード演奏）に対応する8-bit効果音をリアルタイム合成して再生します。
   * @param {'rock'|'shot'|'bari'|'sync'} type 音色の種類
   */
  playDrum(type) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    switch (type) {
      case 'rock': { // pata / [A]: 低周波の短波によるノイズ風パルス音
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
      case 'shot': { // pon / [S]: 高周波の矩形波スイープによるロックマン風バスター弾発射音
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
      case 'bari': { // chaka / [D]: 特殊ノイズバッファを用いた電磁バリア展開音
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
      case 'sync': { // don / [F]: ピッチ上昇型矩形波によるチャージ・同調エネルギー音
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

  /**
   * メトロノームクリック音（テンポガイド）を再生します。
   * @param {boolean} isFirstBeat 小節の最初の拍(1拍目)の場合は高音で強調します
   */
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

  /**
   * アクション実行フェーズ(レスポンス側)にて、ロボットが歌うように再生するFC調メロディ。
   * @param {'pata'|'pon'|'chaka'|'don'|'sync'} syllable 再生する音素シラブル
   * @param {number} index 小節内での拍インデックス (0〜3)
   */
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

  /**
   * メトロノームビートと同調し、裏で走るステージBGMをモダンなシンセサウンドで合成再生します。
   * Synthwave / Cyberpunk風の太いベース、コードパッド、キックをブレンドします。
   * @param {number} beatIndex 小節内の拍インデックス (0〜3)
   * @param {number} stepIndex ゲーム開始時からの累積拍カウント
   * @param {boolean} isFever フィーバー（オーバードライブ）状態か否か
   */
  playBgmTick(beatIndex, stepIndex, isFever) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // モダンで浮遊感のあるネオ・シンセウェーブコード進行 (Am9 -> Fmaj9 -> Cmaj9 -> G6/9)
    const prog = [
      {
        root: 110.00, // A2 (ベース音は55Hz)
        pad: [220.00, 261.63, 329.63, 392.00] // Am7 (A3, C4, E4, G4)
      },
      {
        root: 87.31,  // F2
        pad: [174.61, 220.00, 261.63, 329.63] // Fmaj7 (F3, A3, C4, E4)
      },
      {
        root: 65.41,  // C2
        pad: [130.81, 164.81, 196.00, 246.94] // Cmaj7 (C3, E3, G3, B3)
      },
      {
        root: 98.00,  // G2
        pad: [196.00, 246.94, 293.66, 329.63] // G6 (G3, B3, D4, E4)
      }
    ];

    const chordIdx = Math.floor(stepIndex / 8) % prog.length;
    const chord = prog[chordIdx];

    // --- 1. ディープ・シンセベース (Synth Bass) ---
    const baseOsc = this.ctx.createOscillator();
    const baseGain = this.ctx.createGain();
    const baseFilter = this.ctx.createBiquadFilter();

    baseOsc.type = 'sawtooth';
    baseFilter.type = 'lowpass';
    
    const baseFreq = chord.root / 2;
    baseOsc.frequency.setValueAtTime(baseFreq, now);
    
    baseFilter.frequency.setValueAtTime(250, now);
    baseFilter.frequency.exponentialRampToValueAtTime(75, now + 0.35);

    baseGain.gain.setValueAtTime(this.bgmVolume * (isFever ? 1.1 : 0.7), now);
    baseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    baseOsc.connect(baseFilter);
    baseFilter.connect(baseGain);
    baseGain.connect(this.masterGain);

    baseOsc.start(now);
    baseOsc.stop(now + 0.38);

    if (isFever) {
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(baseFreq * 2, now);
      subGain.gain.setValueAtTime(this.bgmVolume * 0.3, now);
      subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      subOsc.connect(subGain);
      subGain.connect(this.masterGain);
      subOsc.start(now);
      subOsc.stop(now + 0.38);
    }

    // --- 2. アンビエント・コードシンセパッド (Synth Pad) ---
    if (beatIndex === 0 || beatIndex === 2) {
      chord.pad.forEach((freq, idx) => {
        const padOsc = this.ctx.createOscillator();
        const padGain = this.ctx.createGain();
        const padFilter = this.ctx.createBiquadFilter();

        padOsc.type = idx % 2 === 0 ? 'triangle' : 'sawtooth';
        padOsc.frequency.setValueAtTime(freq, now);

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(1000, now);
        padFilter.frequency.exponentialRampToValueAtTime(250, now + 0.9);

        padGain.gain.setValueAtTime(0, now);
        padGain.gain.linearRampToValueAtTime(this.bgmVolume * 0.22, now + 0.1);
        padGain.gain.exponentialRampToValueAtTime(0.005, now + 0.95);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(this.masterGain);

        padOsc.start(now);
        padOsc.stop(now + 1.0);
      });
    }

    // --- 3. モダン・ディープキック (Modern Deep Kick) ---
    const kickOsc = this.ctx.createOscillator();
    const kickGain = this.ctx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(150, now);
    kickOsc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    kickGain.gain.setValueAtTime(this.bgmVolume * (isFever ? 1.3 : 0.95), now);
    kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    kickOsc.connect(kickGain);
    kickGain.connect(this.masterGain);
    kickOsc.start(now);
    kickOsc.stop(now + 0.13);

    // フィーバー時のハイハット裏打ち
    if (isFever && (beatIndex === 1 || beatIndex === 3)) {
      const hatBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.03, this.ctx.sampleRate);
      const hatData = hatBuffer.getChannelData(0);
      for (let i = 0; i < hatData.length; i++) {
        hatData[i] = Math.random() * 2 - 1;
      }
      const hatSource = this.ctx.createBufferSource();
      hatSource.buffer = hatBuffer;

      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(8000, now);

      const hatGain = this.ctx.createGain();
      hatGain.gain.setValueAtTime(this.bgmVolume * 0.15, now);
      hatGain.gain.exponentialRampToValueAtTime(0.005, now + 0.03);

      hatSource.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.masterGain);
      
      hatSource.start(now);
      hatSource.stop(now + 0.04);
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

/**
 * ゲームエンジン全体のグローバルな動的ステート。
 */
const state = {
  /** プレイヤーキャラクター（ロックマン）の情報 */
  player: {
    level: 1,
    xp: 0,
    nextXp: 100,
    hp: 100,
    maxHp: 100,
    baseAtk: 15,
    baseDef: 5,
    crit: 5,
    sp: 0, // レベルアップ時にもらえる強化ポイント
    gold: 0, // ネジ
    bossKills: 0,
    
    equippedId: "wood_spear",
    inventory: ["wood_spear"],
    chests: [], // 取得したが未鑑定のカプセル格納エリア
    
    evoIndex: 0, // 現在のアーマー形態インデックス (EVO_STEPS)
    unlockedCommands: ['walk', 'attack', 'retreat', 'jump', 'duck']
  },

  /** @type {Object|null} 現在対峙している敵オブジェクト */
  enemy: null,
  
  stage: 1,
  wave: 1,
  maxWaves: 5,
  distanceToBoss: 4, // 0 になるとボスが出現
  gameActive: false,
  combatLog: "",

  // 進行フェーズ
  phase: 'move', // 'move' (道中移動) または 'combat' (対敵戦闘)
  moveProgress: 0, // 移動の進捗カウント
  moveRequired: 3, // 次のセキュリティ遭遇までに必要なDASH成功回数

  bpm: 120,
  beatInterval: 500, // 1拍のミリ秒値
  lastBeatTime: 0, // 前回のメトロノーム発火ミリ秒刻み値
  beatCount: 0, // 拍カウント (0〜3 of 4拍ループ)
  stepCount: 0, // ゲーム開始時からの総ステップ数
  turn: 'input', // 'input' (コール・プレイヤー入力ターン) または 'action' (レスポンス・行動評価ターン)
  
  /** @type {Array.<{name: string, diff: number}>} 入力ターン内で打鍵された4拍分のリズムバッファ */
  currentInputs: [],
  hasInputThisBeat: true, // 1拍内に複数連打されるのを防止するフラグ

  // タイミング判定ウィンドウ (ミリ秒値)
  perfectWindow: 125, // ジャスト判定 (この範囲内なら PERFECT)
  goodWindow: 205,    // 許容判定 (この範囲内なら GOOD)
  
  combo: 0,
  fever: false, // フィーバー(オーバードライブ)モード突入フラグ
  feverMeter: 0, // フィーバー突入用メーター(最大100)
  isCharged: false, // CHARGE完了後の次のバスターが強化されるフラグ

  /** @type {Array.<Object>} 画面上に舞う各種描画パーティクルバッファ */
  particles: [],
  playerX: 200, // プレイヤーの座標
  enemyX: 600, // 敵の座標
  playerActionAnim: null, // プレイヤーの行動アニメ状態
  enemyActionAnim: null, // 敵の行動アニメ状態
  enemyHurtTime: 0, // 敵被弾時の赤白フラッシュタイマー用
  shakeTime: 0, // 画面揺れ持続時間 (ms)
  shakeIntensity: 0, // 画面揺れの強さ (px)
  hitStopFrames: 0, // ヒットストップの残りフレーム数
  bossWarningTime: 0 // ボス出現警告演出タイマー (ms)
};

/**
 * @typedef {Object} CommandPattern
 * @property {string} name 表示日本語名
 * @property {Array.<'pata'|'pon'|'chaka'|'don'>} pattern 合致に必要な4拍のリズム配列
 * @property {string} keys 対応するキーボード文字解説
 * @property {number} [minEvo] 解放に必要なアーマー進化段階 (EVO_STEPSのインデックス)
 * @property {boolean} [feverOnly] フィーバー中のみ使用可能か否か
 */

/**
 * 入力ターンの最後に合致判定を行うための全プログラム定義。
 * @type {Object.<string, CommandPattern>}
 */
const COMMANDS = {
  walk: { name: "前進", pattern: ['pata', 'pata', 'pata', 'pon'], keys: 'A A A S' },
  attack: { name: "射撃", pattern: ['pon', 'pon', 'pata', 'pon'], keys: 'S S A S' },
  retreat: { name: "後退", pattern: ['pon', 'pata', 'pon', 'pata'], keys: 'S A S A' },
  jump: { name: "ジャンプ", pattern: ['pon', 'chaka', 'pon', 'chaka'], keys: 'S D S D' },
  duck: { name: "スライド", pattern: ['chaka', 'pon', 'chaka', 'pon'], keys: 'D S D S' },
  defend: { name: "防御", pattern: ['chaka', 'chaka', 'pata', 'pon'], keys: 'D D A S', minEvo: 1 },
  charge: { name: "溜め", pattern: ['don', 'don', 'chaka', 'chaka'], keys: 'F F D D', minEvo: 2 },
  miracle: { name: "E缶", pattern: ['don', 'don', 'don', 'don'], keys: 'F F F F', minEvo: 3, feverOnly: true }
};

/**
 * レベルアップに応じて換装されるロックマンのサイバーアーマー形態。
 * @type {Array.<{name: string, minLevel: number, avatar: string, desc: string}>}
 */
const EVO_STEPS = [
  { name: "NORMAL ROCK", minLevel: 1, avatar: "🤖", desc: "初期アーマー。安定した通常戦闘能力。" },
  { name: "RUSH GEAR", minLevel: 5, avatar: "🐕", desc: "ラッシュ合体装甲。防御プログラム『D D A S』展開可能。" },
  { name: "POWER GEAR", minLevel: 10, avatar: "💪", desc: "重装パワー型。射撃力を高める溜めコマンド『F F D D』が解放。" },
  { name: "JET ARMOR", minLevel: 15, avatar: "✈️", desc: "機動飛行型。E缶コマンド『F F F F』による全体爆破＆回復。" },
  { name: "ULTIMATE FORCE", minLevel: 20, avatar: "👑", desc: "限界突破の最強形態。すべての敵を圧倒する力を解放。" }
];

let canvas = null;
let ctx = null;

/**
 * ゲーム画面の超リッチな「電脳サイバースペース」背景を描画します。
 * バイナリ雨、脈動する巨大ネオンスリットサン、ホログラフィック回路ビル、
 * そして拍子と同期して波打つ3Dパースペクティブグリッド床をリアルタイムに描画します。
 */
function drawBackground() {
  if (!canvas || !ctx) return;
  const width = canvas.width;
  const height = canvas.height;
  const gridCount = 20;
  
  // 1. 背景空グラデーション (フィーバー時はサイケデリック、通常時はディープネイビー)
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 300);
  if (state.fever) {
    skyGrad.addColorStop(0, '#2b0042');
    skyGrad.addColorStop(0.5, '#6a005c');
    skyGrad.addColorStop(1, '#1b002c');
  } else {
    skyGrad.addColorStop(0, '#040824');
    skyGrad.addColorStop(0.6, '#0b164f');
    skyGrad.addColorStop(1, '#182b8a');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, 300);

  // --- A. デジタル・マトリックス・フォール (0と1のバイナリの雨) ---
  // ステートレスな決定論的ノイズでシアン色に流れる情報雨を降らせます。
  ctx.fillStyle = state.fever ? 'rgba(255, 63, 222, 0.16)' : 'rgba(0, 240, 255, 0.16)';
  ctx.font = '8px Courier New, monospace';
  ctx.textAlign = 'center';
  const binaryColumns = 30;
  for (let col = 0; col < binaryColumns; col++) {
    const colX = (width / binaryColumns) * col + 12;
    const speed = 1.0 + Math.abs(Math.sin(col * 3.14)) * 0.8;
    const offset = (Date.now() * 0.08 * speed) % 300;
    for (let row = 0; row < 12; row++) {
      const charY = (row * 26 + offset) % 300;
      // 0 または 1 を周期演算で決定
      const binaryVal = Math.floor(Math.sin(col * row + Date.now() * 0.001) + 1.5) % 2;
      ctx.fillText(binaryVal.toString(), colX, charY);
    }
  }

  // --- B. 空に向かって昇るデータシグナルレーザービーム ---
  ctx.save();
  ctx.strokeStyle = state.fever ? 'rgba(255, 251, 0, 0.22)' : 'rgba(0, 240, 255, 0.22)';
  ctx.lineWidth = 1.2;
  for (let bi = 0; bi < 3; bi++) {
    const bx = ((Date.now() * 0.04 + bi * 280) % width);
    ctx.beginPath();
    ctx.moveTo(bx, 300);
    ctx.lineTo(bx, 0);
    ctx.stroke();
  }
  ctx.restore();

  // --- C. 巨大ホログラフィック・ネオンスリットサン (Synthwave/Cyberpunk風) ---
  // BGMの拍に合わせて巨大太陽が脈打つ（パルス）アニメーション。
  ctx.save();
  const beatPulse = 1.0 + Math.max(0, 1.0 - ((Date.now() - state.lastBeatTime) / state.beatInterval)) * 0.14;
  const sunGrad = ctx.createLinearGradient(0, 40, 0, 220);
  sunGrad.addColorStop(0, '#ffe000');
  sunGrad.addColorStop(0.5, '#ff2060');
  sunGrad.addColorStop(1, 'rgba(11, 22, 79, 0)');
  ctx.fillStyle = sunGrad;
  
  ctx.shadowColor = '#ff2060';
  ctx.shadowBlur = 24 * beatPulse;
  
  const sunR = 65 * beatPulse;
  const sunX = width / 2;
  const sunY = 120;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  
  // 太陽の横スリット（背景色で切り抜き）
  ctx.fillStyle = state.fever ? '#1b002c' : '#0b164f';
  for (let sy = sunY - sunR; sy < sunY + sunR; sy += 12) {
    const sliceH = 2.5 + ((sy - (sunY - sunR)) / (sunR * 2)) * 6.5; // 下にいくほどスリットを太くする
    ctx.fillRect(sunX - sunR - 15, sy, sunR * 2 + 30, sliceH);
  }
  ctx.restore();

  // --- D. ホログラフィック基盤回路ビルスカイライン ---
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
    // 半透明サイバー塗り
    ctx.fillStyle = state.fever ? 'rgba(75, 10, 90, 0.38)' : 'rgba(11, 22, 79, 0.55)';
    ctx.fillRect(b.x, 300 - b.h, b.w, b.h);
    
    // ネオンワイヤーフレーム輪郭線
    ctx.strokeStyle = state.fever ? 'rgba(255, 63, 222, 0.65)' : 'rgba(0, 240, 255, 0.55)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x, 300 - b.h, b.w, b.h);

    // 電脳基盤の回路風ネオンライン (直角分岐)
    ctx.strokeStyle = state.fever ? 'rgba(255, 251, 0, 0.28)' : 'rgba(0, 240, 255, 0.28)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(b.x + b.w / 2, 300);
    ctx.lineTo(b.x + b.w / 2, 300 - b.h * 0.68);
    ctx.lineTo(b.x + b.w / 2 - 12, 300 - b.h * 0.68 - 12);
    ctx.lineTo(b.x + b.w / 2 - 12, 300 - b.h * 0.9);
    ctx.stroke();
  });

  // 3. 地面
  ctx.fillStyle = '#060a28';
  ctx.fillRect(0, 300, width, 100);
  
  // 地平線ネオンライン
  ctx.strokeStyle = state.fever ? '#ff2060' : '#00f0ff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 300);
  ctx.lineTo(width, 300);
  ctx.stroke();

  // --- E. 脈動する3Dパースペクティブグリッド床 ---
  // 横線と縦線のネオン強度が、BGMビートと同調して激しく点滅・脈動します。
  const beatProgress = Math.max(0, 1.0 - ((Date.now() - state.lastBeatTime) / state.beatInterval));
  ctx.strokeStyle = state.fever ? `rgba(255, 63, 222, ${0.48 + beatProgress * 0.52})` : `rgba(0, 240, 255, ${0.38 + beatProgress * 0.62})`;
  ctx.lineWidth = 1.8 + beatProgress * 1.5;
  
  // 横方向グリッド
  const lineY = 300;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(0, lineY + i*20);
    ctx.lineTo(width, lineY + i*20);
    ctx.stroke();
  }

  // 縦方向グリッド
  for (let i = 0; i <= gridCount; i++) {
    const xTop = (width / gridCount) * i;
    const xBottom = ((width * 1.4) / gridCount) * i - (width * 0.2);
    ctx.beginPath();
    ctx.moveTo(xTop, 300);
    ctx.lineTo(xBottom, height);
    ctx.stroke();

    // グリッド交点（コネクションノード）にネオンドットを配置
    ctx.fillStyle = state.fever ? '#ff60d0' : '#00f0ff';
    for (let j = 0; j < 6; j++) {
      const cy = lineY + j * 20;
      const tRatio = (cy - 300) / 100;
      const cx = xTop + (xBottom - xTop) * tRatio;
      ctx.fillRect(cx - 2, cy - 2, 4, 4);
    }
  }

  // スクロール光線
  const speedScale2 = state.phase === 'move' ? 3.0 : 1.0;
  ctx.strokeStyle = state.fever ? 'rgba(255, 251, 0, 0.28)' : 'rgba(0, 240, 255, 0.28)';
  ctx.lineWidth = 3;
  const flowSpeed = (Date.now() * 0.05 * speedScale2) % 80;
  for (let x = -80; x < width + 80; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x + flowSpeed, 300);
    ctx.lineTo(x + flowSpeed - 30, height);
    ctx.stroke();
  }

  // 進行表示HUD
  if (state.phase === 'move') {
    ctx.fillStyle = '#ffe000';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 6;
    ctx.fillText(`PROCEEDING... (DASH NEEDED: ${state.moveProgress} / ${state.moveRequired})`, width / 2, 80);
    ctx.shadowBlur = 0;
  }
}

/**
 * 主人公（ロックマン）を「電脳×音楽」の細密ドット液晶テーマでCanvas上にレンダリングします。
 */
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
    if (anim.type === 'walk') {
      const hop = Math.sin(time * Math.PI * 4);
      y -= Math.max(0, hop * 10);
      x += (time < 0.5 ? time * 2 : 1) * 30;
      isSliding = true;
    } else if (anim.type === 'retreat') {
      const hop = Math.sin(time * Math.PI * 4);
      y -= Math.max(0, hop * 12);
      x -= (time < 0.5 ? time * 2 : 1) * 30;
    } else if (anim.type === 'jump') {
      const jumpHeight = Math.sin(time * Math.PI) * 75;
      y -= jumpHeight;
      isJumping = true;
    } else if (anim.type === 'duck') {
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

  // --- A. 電脳オーディオスペクトラム(背後ホログラフィック) ---
  ctx.save();
  ctx.translate(x - 38, y - 82);
  ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
  const t = Date.now() * 0.015;
  for (let i = 0; i < 5; i++) {
    const h = 8 + Math.abs(Math.sin(t + i * 0.7)) * 32;
    ctx.fillRect(i * 5, 30 - h, 3, h);
  }
  ctx.restore();

  // --- B. 五線譜＆ネオン音符マフラー ---
  ctx.save();
  ctx.translate(x, y - 50);
  const scarfWave = Math.sin(Date.now() * 0.015) * 8;
  ctx.strokeStyle = 'rgba(0, 240, 255, 0.7)';
  ctx.lineWidth = 1.5;
  for (let li = 0; li < 5; li++) {
    ctx.beginPath();
    ctx.moveTo(-10, -10 + li * 3.5);
    ctx.quadraticCurveTo(-35, scarfWave - 15 + li * 3.5, -65, scarfWave + li * 3.5);
    ctx.stroke();
  }
  const notePos = (Date.now() * 0.04) % 55;
  ctx.fillStyle = '#ffe000';
  ctx.fillRect(-10 - notePos, scarfWave - 8 + Math.sin(notePos * 0.12) * 6, 3, 3);
  ctx.fillRect(-25 - ((notePos + 25) % 55), scarfWave - 4 + Math.sin((notePos + 25) * 0.12) * 6, 3, 3);
  ctx.restore();

  ctx.translate(x, y);
  ctx.scale(1, scaleY);

  if (isSliding) {
    ctx.rotate(0.12);
  }

  // --- F. リアル・ドットスプライト描画 (ダウンロードアセット対応) ---
  if (playerSpriteCanvas) {
    ctx.save();
    ctx.drawImage(playerSpriteCanvas, -32, -75, 64, 75);

    // 被弾時の赤・白フラッシュ効果
    if (isHurt && Math.floor(Date.now() / 40) % 2 === 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.fillRect(-32, -75, 64, 75);
    }
    ctx.restore();
  } else {
    // --- G. フォールバック・ベクター液晶ドットキャラクター描画 ---
    let suitColor = '#0058d8';
    let accentColor = '#00e0ff';
    if (p.evoIndex === 1) { suitColor = '#ff2060'; accentColor = '#fff'; }
    else if (p.evoIndex === 2) { suitColor = '#2b2b2b'; accentColor = '#ffe000'; }
    else if (p.evoIndex === 3) { suitColor = '#6011a4'; accentColor = '#ffd000'; }
    else if (p.evoIndex === 4) { suitColor = '#10052c'; accentColor = '#ff3fde'; }

    if (state.fever) {
      const isGoldTick = Math.floor(Date.now() / 60) % 2 === 0;
      suitColor = isGoldTick ? '#ffe000' : '#fff';
      accentColor = isGoldTick ? '#fff' : '#ffe000';
    }

    if (isHurt && Math.floor(Date.now() / 40) % 2 === 0) {
      suitColor = '#fff';
      accentColor = '#888';
    }

    // 1. 足パーツ
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

    // 2. 電脳コアボディアーマー
    ctx.fillStyle = suitColor;
    ctx.fillRect(-16, -41, 32, 30);
    
    ctx.fillStyle = accentColor;
    ctx.fillRect(-10, -32, 20, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-6, -30, 12, 2);

    // 3. ヘルメット
    ctx.fillStyle = suitColor;
    ctx.fillRect(-14, -68, 30, 28);
    ctx.fillRect(-10, -71, 22, 4);

    // C. サイバー・ネオンヘッドホン
    ctx.strokeStyle = '#ffe000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(1, -54, 17, Math.PI, 0);
    ctx.stroke();
    
    ctx.fillStyle = '#00ff66';
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 6;
    ctx.fillRect(-17, -60, 5, 12);
    ctx.fillRect(14, -60, 5, 12);
    ctx.shadowBlur = 0;

    // 顔
    ctx.fillStyle = '#ffdbb5';
    ctx.fillRect(-8, -54, 20, 14);

    // D. イコライザーバイザー
    ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
    ctx.shadowColor = '#00e0ff';
    ctx.shadowBlur = 8;
    ctx.fillRect(-9, -53, 16, 7);
    ctx.shadowBlur = 0;
    
    ctx.fillStyle = '#ffffff';
    const vTime = Date.now() * 0.02;
    for (let bi = 0; bi < 4; bi++) {
      const barH = 1 + Math.abs(Math.sin(vTime + bi * 1.2)) * 5;
      ctx.fillRect(-8 + bi*4, -53 + (6 - barH), 2, barH);
    }

    // 4. 音符バスター
    ctx.save();
    ctx.translate(14, -26);
    ctx.rotate(weaponRot);
    
    let glowColor = null;
    if (wp.rarity === 'uncommon') glowColor = '#00ff66';
    else if (wp.rarity === 'rare') glowColor = '#00e0ff';
    else if (wp.rarity === 'legendary') glowColor = '#ffe000';

    if (glowColor) {
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 10;
    }

    ctx.fillStyle = suitColor;
    ctx.fillRect(0, -6, 17, 12);
    
    ctx.fillStyle = accentColor;
    ctx.fillRect(4, -5, 8, 2);
    ctx.fillRect(4, 3, 8, 2);

    ctx.fillStyle = glowColor || '#ffe000';
    ctx.fillRect(17, -5, 3, 10);
    
    if (showMuzzleFlash) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.shadowColor = glowColor || '#00e0ff';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(22, 0, 10, -Math.PI*0.5, Math.PI*0.5);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  // --- H. アクティブ・バトルエフェクトの描画 ---
  if (shieldActive) {
    ctx.save();
    ctx.strokeStyle = '#ff2060';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#ff2060';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(28, -28, 26, -Math.PI*0.4, Math.PI*0.4);
    ctx.stroke();
    ctx.fillStyle = 'rgba(228, 0, 88, 0.2)';
    ctx.fill();
    ctx.restore();
  }

  if (state.isCharged) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00e0ff';
    ctx.shadowBlur = 8;
    for (let i = 0; i < 3; i++) {
      const rx = (Math.random() - 0.5) * 60;
      const ry = -65 + (Math.random() - 0.5) * 60;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx + (Math.random() - 0.5) * 15, ry + (Math.random() - 0.5) * 15);
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

  // --- I. 細密液晶ドットグリッドのオーバーレイ (画像にも適用) ---
  ctx.save();
  ctx.strokeStyle = 'rgba(0, 12, 45, 0.24)';
  ctx.lineWidth = 1;
  const gridSpacing = 3;
  for (let gx = -22; gx < 22; gx += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(gx, -75);
    ctx.lineTo(gx, 10);
    ctx.stroke();
  }
  for (let gy = -75; gy < 10; gy += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(-22, gy);
    ctx.lineTo(22, gy);
    ctx.stroke();
  }
  ctx.restore();

  ctx.restore();
}

/**
 * 敵ロボットを描画します。
 */
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

  // --- F. リアル・ドットスプライト描画 (ダウンロードアセット対応) ---
  let headTopY = -45;
  let eWidth = 20;
  let eHeight = 45;

  if (enemySpriteCanvas) {
    ctx.save();
    if (e.isBoss) {
      headTopY = e.type === 'archfiend' ? -150 : -95;
      eWidth = e.type === 'archfiend' ? 65 : 35;
      eHeight = -headTopY;
      
      // ボスは巨大サイズで描画
      ctx.drawImage(enemySpriteCanvas, -eWidth - 20, -eHeight - 20, (eWidth + 20) * 2, (eHeight + 20));
    } else {
      eWidth = 22;
      eHeight = 25;
      // 雑魚は通常サイズ
      ctx.drawImage(enemySpriteCanvas, -25, -50, 50, 50);
    }

    // 被弾時の赤・白フラッシュ効果
    if (isHurt && Math.floor(Date.now() / 40) % 2 === 0) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      if (e.isBoss) {
        ctx.fillRect(-eWidth - 20, -eHeight - 20, (eWidth + 20) * 2, (eHeight + 20));
      } else {
        ctx.fillRect(-25, -50, 50, 50);
      }
    }
    ctx.restore();
  } else {
    // --- G. フォールバック・ベクター敵ロボット描画 ---
    if (isHurt && Math.floor(Date.now() / 40) % 2 === 0) {
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#ff2060';
    }

    if (e.isBoss) {
      headTopY = e.type === 'archfiend' ? -150 : -95;
      eWidth = e.type === 'archfiend' ? 65 : 35;
      eHeight = -headTopY;
      
      if (e.type === 'dodonga') { // カットマン
        if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
          ctx.fillStyle = '#d01010';
          ctx.strokeStyle = '#fff';
        }
        ctx.lineWidth = 3;
        ctx.fillRect(-22, -45, 44, 45);
        ctx.fillRect(-16, -75, 32, 30);

        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, -85, 14, Math.PI*1.1, Math.PI*1.9);
        ctx.stroke();

        ctx.fillStyle = '#ffe000';
        ctx.fillRect(-6, -65, 4, 6);
        ctx.fillRect(2, -65, 4, 6);
        
      } else if (e.type === 'chokkinna') { // バブルマン
        if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
          ctx.fillStyle = '#008c5c';
          ctx.strokeStyle = '#fff';
        }
        ctx.lineWidth = 3;
        ctx.fillRect(-30, -38, 60, 38);
        ctx.fillRect(-14, -62, 28, 24);

        ctx.strokeStyle = '#ffe000';
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
        
        ctx.fillStyle = '#ffe000';
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
        ctx.fillRect(-22, -50, 44, 50);
        ctx.fillRect(-14, -78, 28, 28);

        ctx.strokeStyle = '#ffe000';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(-20, -84);
        ctx.lineTo(0, -98);
        ctx.lineTo(20, -84);
        ctx.stroke();

      } else if (e.type === 'archfiend') { // ワイリーマシン
        if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
          ctx.fillStyle = '#cccccc';
          ctx.strokeStyle = '#000';
        }
        ctx.lineWidth = 4;
        ctx.fillRect(-55, -100, 110, 80);

        ctx.fillStyle = '#1c002c';
        ctx.fillRect(-34, -85, 24, 20);
        ctx.fillRect(10, -85, 24, 20);

        ctx.fillStyle = '#ff2060';
        ctx.fillRect(-26, -78, 8, 8);
        ctx.fillRect(18, -78, 8, 8);

        ctx.fillStyle = '#fff';
        ctx.fillRect(-20, -45, 8, 10);
        ctx.fillRect(-8, -45, 8, 10);
        ctx.fillRect(4, -45, 8, 10);
        ctx.fillRect(16, -45, 8, 10);
      }
    } else {
      eWidth = 22;
      eHeight = 25;
      if (!(isHurt && Math.floor(Date.now() / 40) % 2 === 0)) {
        ctx.fillStyle = '#ffe000';
        ctx.strokeStyle = '#000';
      }
      ctx.lineWidth = 3;
      ctx.fillRect(-22, -22, 44, 22);

      ctx.fillStyle = '#fff';
      ctx.fillRect(-4, -18, 8, 12);
      ctx.fillRect(-10, -12, 20, 4);

      ctx.fillStyle = '#00ff66';
      ctx.fillRect(-18, -4, 12, 5);
      ctx.fillRect(6, -4, 12, 5);
    }
  }

  ctx.save();
  ctx.strokeStyle = 'rgba(0, 10, 30, 0.26)';
  ctx.lineWidth = 1;
  const gridSpacing = 3;
  for (let gx = -eWidth; gx < eWidth; gx += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(gx, -eHeight);
    ctx.lineTo(gx, 5);
    ctx.stroke();
  }
  for (let gy = -eHeight; gy < 5; gy += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(-eWidth, gy);
    ctx.lineTo(eWidth, gy);
    ctx.stroke();
  }
  ctx.restore();

  // 敵頭上HPバー
  const barWidth = e.isBoss ? 150 : 70;
  const barHeight = e.isBoss ? 12 : 8;
  const hpPct = Math.max(0, e.hp / e.maxHp);
  const barY = headTopY - 15;

  ctx.fillStyle = '#000000';
  ctx.strokeStyle = isHurt ? '#ffe000' : '#ffffff';
  ctx.lineWidth = 2;
  ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);
  ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);

  ctx.fillStyle = '#ff2060';
  ctx.fillRect(-barWidth/2 + 1, barY + 1, (barWidth - 2) * hpPct, barHeight - 2);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px Courier New, monospace';
  ctx.textAlign = 'center';
  ctx.shadowColor = '#000';
  ctx.shadowBlur = 3;
  ctx.fillText(`${e.hp} / ${e.maxHp}`, 0, barY - 6);
  ctx.shadowBlur = 0;

  if (e.isBoss && e.isChargingAttack) {
    ctx.fillStyle = '#ffe000';
    ctx.font = 'bold 10px Courier New, monospace';
    ctx.textAlign = 'center';
    
    let guide = "D D A S / S A S A!";
    if (e.pendingAttackType === 'high') guide = "DUCK: D S D S!";
    else if (e.pendingAttackType === 'low') guide = "JUMP: S D S D!";
    
    ctx.fillText(`! WARNING: ${guide} !`, 0, barY - 20 + Math.sin(Date.now() * 0.15) * 3);
  }

  ctx.restore();
}

/**
 * 画面上のエフェクトパーティクルを更新・描画します。
 */
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
      ctx.font = p.font || 'bold 16px monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.isBullet) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillRect(-5, 2, 4, 4);
      ctx.fillRect(0, -6, 2, 10);
      ctx.fillRect(1, -6, 6, 2);
      
      if (p.size > 8) {
        ctx.fillRect(3, 0, 4, 4);
        ctx.fillRect(8, -8, 2, 10);
        ctx.fillRect(1, -8, 8, 2);
      }
      ctx.restore();
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
    font: isCritical ? 'bold 18px Courier New, monospace' : 'bold 16px Courier New, monospace',
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
    color: '#00e0ff',
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

function gameLoop() {
  if (!state.gameActive) return;

  // 1. ヒットストップの適用 (動きの更新を一時停止させるが、描画は維持)
  let skipUpdate = false;
  if (state.hitStopFrames > 0) {
    state.hitStopFrames--;
    skipUpdate = true;
  }

  ctx.save();

  // 2. 画面揺れ (Screen Shake) の適用
  if (state.shakeTime > 0) {
    const dx = (Math.random() - 0.5) * state.shakeIntensity;
    const dy = (Math.random() - 0.5) * state.shakeIntensity;
    ctx.translate(dx, dy);
    state.shakeTime = Math.max(0, state.shakeTime - 16.67);
  }

  if (ctx) {
    ctx.imageSmoothingEnabled = false;
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
  }

  // 3. 各種描画
  drawBackground();
  
  // ボス出現時の「WARNING!!」ホログラム警告演出
  if (state.bossWarningTime > 0) {
    drawBossWarning();
    state.bossWarningTime = Math.max(0, state.bossWarningTime - 16.67);
  }

  drawPlayer();
  drawEnemy();

  // ヒットストップ中はパーティクルの移動更新を止め、描画のみ行う
  if (skipUpdate) {
    drawParticlesStatic();
  } else {
    updateAndDrawParticles();
  }

  ctx.restore();

  requestAnimationFrame(gameLoop);
}

/**
 * ボス戦開始時の「WARNING!!」という巨大なサイバー警告ホログラムを描画します。
 */
function drawBossWarning() {
  if (!ctx || !canvas) return;
  const width = canvas.width;
  
  // 赤い半透明帯の描画
  ctx.save();
  ctx.fillStyle = 'rgba(255, 32, 96, 0.35)';
  ctx.fillRect(0, 100, width, 60);
  
  // 上下の黄色ネオン境界線
  ctx.strokeStyle = '#ffe000';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 100);
  ctx.lineTo(width, 100);
  ctx.moveTo(0, 160);
  ctx.lineTo(width, 160);
  ctx.stroke();

  // 文字の点滅
  if (Math.floor(Date.now() / 150) % 2 === 0) {
    ctx.fillStyle = '#ff2060';
    ctx.shadowColor = '#ff2060';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 22px Courier New, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('! WARNING: SECURE FORCE DETECTED !', width / 2, 138);
  }
  ctx.restore();
}

/**
 * ヒットストップ中にパーティクルの動きを静止したまま描画します。
 */
function drawParticlesStatic() {
  if (!ctx) return;
  const now = Date.now();
  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i];
    const age = now - p.created;
    const pct = Math.min(1, age / p.life);

    ctx.save();
    if (p.isText) {
      ctx.globalAlpha = 1 - pct;
      ctx.fillStyle = p.color;
      ctx.font = p.font || 'bold 16px Courier New, monospace';
      ctx.textAlign = 'center';
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.isBullet) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fillStyle = p.color;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillRect(-5, 2, 4, 4);
      ctx.fillRect(0, -6, 2, 10);
      ctx.fillRect(1, -6, 6, 2);
      ctx.restore();
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
            spawnTextParticle(400, 150, "OVER DRIVE!!", '#ffe000', true);
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
  let isEarly = false;
  if (elapsed > state.beatInterval / 2) {
    diff = state.beatInterval - elapsed;
    isEarly = true;
  } else {
    diff = elapsed;
    isEarly = false;
  }

  if (type === 'pata') {
    diff = diff * 0.55;
  } else if (isEarly) {
    diff = diff * 0.7;
  }

  state.currentInputs.push({
    name: type,
    diff: diff
  });

  const echoEl = document.getElementById('player-input-echo');
  if (echoEl) {
    const note = document.createElement('div');
    note.className = `echo-note ${type}`;
    let keyChar = "A";
    if (type === 'pon') keyChar = "S";
    else if (type === 'chaka') keyChar = "D";
    else if (type === 'don') keyChar = "F";
    note.innerText = keyChar;
    echoEl.appendChild(note);
  }

  let timingText = "MISS";
  let color = '#ff2060';
  if (diff <= state.perfectWindow) {
    timingText = "PERFECT";
    color = '#ffe000';
  } else if (diff <= state.goodWindow) {
    timingText = "GOOD";
    color = '#00ff66';
  }
  
  const inputIndex = state.currentInputs.length - 1;
  spawnTextParticle(150 + inputIndex * 130, 220, timingText, color);
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

  if (state.phase === 'move') {
    if (actionKey === 'walk') {
      state.moveProgress++;
      state.combatLog = `前進プログラム実行... 次のエリアまであと [ ${state.moveRequired - state.moveProgress} ] ダッシュ！`;
      
      for (let i = 0; i < 5; i++) {
        state.particles.push({
          x: state.playerX - 20, y: 295,
          vx: -3 - Math.random()*3, vy: -1 - Math.random()*2,
          size: 2 + Math.random()*3, color: '#00e0ff',
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

  if (actionKey === 'walk') {
    state.playerX = Math.min(state.enemyX - 100, state.playerX + 120);
    state.combatLog = `ダッシュ前進。現在X:${state.playerX} (敵距離:${Math.abs(state.enemyX - state.playerX)})`;
  } 
  else if (actionKey === 'retreat') {
    state.playerX = Math.max(80, state.playerX - 120);
    state.combatLog = `緊急後退。現在X:${state.playerX} (敵距離:${Math.abs(state.enemyX - state.playerX)})`;
  }
  else if (actionKey === 'jump') {
    state.combatLog = "ジャンプ回避システム起動！";
  }
  else if (actionKey === 'duck') {
    state.combatLog = "スライディング回避システム起動！";
  }
  else if (actionKey === 'attack') {
    state.combatLog = "バスター射撃準備。";
    
    const bColor = state.fever ? '#ffe000' : (wp.rarity === 'legendary' ? '#ff3fde' : '#00e0ff');
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
        spawnTextParticle(state.enemyX, 240, "RANGE OUT!", '#808898', false);
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

      // ヒット演出 (画面揺れ & ヒットストップ)
      state.shakeTime = isCrit ? 400 : 250;
      state.shakeIntensity = isCrit ? 12 : 6;
      state.hitStopFrames = isCrit ? 8 : 4;

      spawnHitParticles(state.enemyX, 260, isCrit ? '#ffe000' : '#00e0ff');
      spawnTextParticle(state.enemyX, 180, `${finalDmg}${isCrit ? ' CRITICAL!' : ''}`, isCrit ? '#ffe000' : '#fff', isCrit);

      if (state.enemy.hp <= 0) {
        handleEnemyDefeat();
      }
    }, state.beatInterval * 2.5);
  } 
  else if (actionKey === 'defend') {
    state.combatLog = "シールド展開。";
  } 
  else if (actionKey === 'charge') {
    state.combatLog = "エネルギー同調チャージ。";
    state.isCharged = true;
  } 
  else if (actionKey === 'miracle') {
    state.combatLog = "E缶起動！全体爆破発射！";
    
    setTimeout(() => {
      if (!state.gameActive || state.phase !== 'combat') return;

      const dmg = Math.floor((p.baseAtk + (wp.atk || 0)) * 2.8);
      state.enemy.hp = Math.max(0, state.enemy.hp - dmg);
      state.enemyHurtTime = Date.now();

      // 全体爆破による大地震
      state.shakeTime = 600;
      state.shakeIntensity = 18;
      state.hitStopFrames = 12;
      
      spawnHitParticles(state.enemyX, 260, '#ffe000');
      spawnTextParticle(state.enemyX, 150, `${dmg} (BURST)`, '#ffe000', true);

      const heal = Math.floor(p.maxHp * 0.35);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      spawnHitParticles(state.playerX, 250, '#00ff66');
      spawnTextParticle(state.playerX, 200, `+${heal} LIFE`, '#00ff66');

      if (state.enemy.hp <= 0) {
        handleEnemyDefeat();
      }
    }, state.beatInterval * 2.5);
  }

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
      spawnTextParticle(state.playerX, 180, "DODGE!", '#00e0ff', true);
      updateUI();
      return;
    }

    const isPlayerDefending = (actionKey === 'defend');
    if (isPlayerDefending) {
      enemyDmg = Math.floor(enemyDmg * 0.15);
      state.combatLog = `${state.enemy.name}の直撃をシールドで最小限に防いだ！`;
      spawnTextParticle(state.playerX, 180, "BLOCK!", '#00e0ff');
    } else {
      state.combatLog = `${state.enemy.name}の直撃を受けました！`;
      if (attackType === 'high') state.combatLog += " (上段攻撃には DUCK: D S D S が有効です)";
      if (attackType === 'low') state.combatLog += " (下段攻撃には JUMP: S D S D が有効です)";
    }

    const finalEnemyDmg = Math.max(1, enemyDmg - p.baseDef);
    p.hp = Math.max(0, p.hp - finalEnemyDmg);
    state.playerHurtTime = Date.now();

    // プレイヤー被弾時の画面揺れ & ヒットストップ
    state.shakeTime = isPlayerDefending ? 200 : 450;
    state.shakeIntensity = isPlayerDefending ? 4 : 14;
    state.hitStopFrames = isPlayerDefending ? 2 : 8;

    spawnHitParticles(state.playerX, 250, '#ff2060');
    spawnTextParticle(state.playerX, 210, `-${finalEnemyDmg}`, '#ff2060');

    if (p.hp <= 0) {
      handlePlayerDefeat();
    }

    updateUI();

  }, state.beatInterval * 3.5);
}

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
    state.bossWarningTime = 2500;
    state.shakeTime = 1200;
    state.shakeIntensity = 5;
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
    spawnTextParticle(state.playerX, 100, "SYSTEM UPGRADE!", '#ffe000', true);
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
    spawnTextParticle(state.playerX, 70, `ARMOR ATTACHED: ${evo.name}`, '#ff2060', true);
    
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

  const hudWalk = document.getElementById('hud-cmd-walk');
  const hudAttack = document.getElementById('hud-cmd-attack');
  const hudRetreat = document.getElementById('hud-cmd-retreat');
  const hudJump = document.getElementById('hud-cmd-jump');
  const hudDuck = document.getElementById('hud-cmd-duck');
  const hudDefend = document.getElementById('hud-cmd-defend');
  const hudCharge = document.getElementById('hud-cmd-charge');
  const hudMiracle = document.getElementById('hud-cmd-miracle');

  if (hudWalk) hudWalk.classList.remove('locked');
  if (hudAttack) hudAttack.classList.remove('locked');
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
        dot.style.background = '#ff2060';
      } else {
        dot.style.background = '#ffe000';
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
      state.player.unlockedCommands = ['walk', 'attack', 'retreat', 'jump', 'duck'];
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
