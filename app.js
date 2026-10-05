/**
 * こもれびの羅針盤 (Komorebi Compass)
 * 生きる意味に迷ったとき、日常の小さな光と安心感を思い出すためのWebアプリケーション
 */

// --- 音響システム (Web Audio API - 外部ファイル不要で動作) ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.isEnabled = false;
    this.ambientOscillators = [];
    this.ambientGain = null;
    this.ambientInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.init();
    this.isEnabled = !this.isEnabled;
    if (this.isEnabled) {
      this.startAmbient();
      this.playNote(523.25, 0.4); // C5
    } else {
      this.stopAmbient();
    }
    return this.isEnabled;
  }

  // 優しいカリンバ・オルゴール風の音
  playNote(freq = 440, duration = 0.5, type = 'sine') {
    if (!this.isEnabled || !this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, this.ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio play note error:", e);
    }
  }

  // ボタン押下音（温かみのあるポーンという音）
  playTap() {
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00]; // Pentatonic C D E G A
    const note = notes[Math.floor(Math.random() * notes.length)];
    this.playNote(note, 0.6);
  }

  // 決定・完了時の和音
  playChord() {
    if (!this.isEnabled) return;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      setTimeout(() => this.playNote(freq, 0.8), idx * 90);
    });
  }

  // 静かなアンビエント（木漏れ日のような穏やかな和音ドローン）
  startAmbient() {
    if (!this.ctx || this.ambientInterval) return;
    const chords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00]  // G
    ];
    let chordIdx = 0;

    const playAmbientChord = () => {
      if (!this.isEnabled || !this.ctx) return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((freq) => {
        try {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.015, this.ctx.currentTime + 2.5);
          gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 7.5);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start();
          osc.stop(this.ctx.currentTime + 8);
        } catch (e) {}
      });
    };

    playAmbientChord();
    this.ambientInterval = setInterval(playAmbientChord, 7000);
  }

  stopAmbient() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

const sound = new SoundManager();

// --- アプリケーション状態 & 質問データ ---
const QUESTIONS = [
  {
    category: "五感のひかり",
    title: "最近、体がほっとしたり、「あ、美味しいな」「気持ちいいな」と感じた瞬間はありますか？",
    subtitle: "生きる実感は、壮大な目的ではなく、五感が味わう小さな心地よさから始まります。",
    chips: [
      "お布団のぬくもり",
      "温かいお茶やコーヒー",
      "湯船に浸かった瞬間",
      "澄んだ朝の空気",
      "好きな音楽を聴いた時",
      "美味しいご飯を食べた時",
      "ペットを撫でた時",
      "日向ぼっこの暖かさ"
    ],
    placeholder: "例：朝起きて飲んだ白湯が美味しかった、帰り道の夕焼けが綺麗だった…など",
    storageKey: "senses"
  },
  {
    category: "心がほどける時間",
    title: "誰の目も気にせず、時間を忘れて浸れること（あるいは何も考えずにいられる時間）は何ですか？",
    subtitle: "誰かの役に立たなくてもいい。あなたが「ふっと肩の荷を下ろせる避難所」です。",
    chips: [
      "あてもなく散歩する",
      "ぼーっと空や天井を眺める",
      "好きな動画やアニメを見る",
      "ゲームに没頭する",
      "ひたすら深く眠る",
      "お気に入りの本を開く",
      "好きな音楽を爆音で聴く",
      "部屋をすこし片付ける"
    ],
    placeholder: "例：夜中に一人で散歩している時、好きなゲームの世界にいる時…など",
    storageKey: "unwind"
  },
  {
    category: "誰かとのぬくもり",
    title: "誰かに「ありがとう」と思ったこと、または誰かがいてくれて良かったなと感じた記憶は？",
    subtitle: "人との繋がりは、時に重荷にもなりますが、時に生きる灯火にもなります。",
    chips: [
      "友達と他愛もない話をした",
      "店員さんの笑顔や気遣い",
      "家族がさりげなく支えてくれた",
      "推しや好きな人が元気をくれた",
      "誰かの相談に乗って喜ばれた",
      "昔かけてもらった優しい言葉",
      "言葉がなくても隣にいてくれた人"
    ],
    placeholder: "例：コンビニで「ありがとう」と言えたこと、友達がくだらないことで笑ってくれたこと…など",
    storageKey: "connection"
  },
  {
    category: "ちいさな好奇心",
    title: "もし失敗も評価もお金も気にしなくていいなら、ちょっとやってみたい・覗いてみたいことは？",
    subtitle: "立派な夢じゃなくて構いません。「ちょっと気になる」好奇心の芽です。",
    chips: [
      "知らない街を一人で歩く",
      "海や山で一日中のんびりする",
      "目覚ましをかけずに寝倒す",
      "気になる本を一日中読む",
      "美味しいものを限界まで食べる",
      "星空を見に行く",
      "新しい趣味を少しだけかじる",
      "何もしない贅沢を味わう"
    ],
    placeholder: "例：海辺のカフェで何時間も読書したい、星が綺麗な場所に行ってみたい…など",
    storageKey: "curiosity"
  },
  {
    category: "大切にしたい感覚",
    title: "これからの日々で、何よりも大切に守ってあげたいあなたの「心の状態」はどれですか？",
    subtitle: "これは、あなただけの人生の「北極星（コンパス）」になります。（最大2つまで）",
    type: "compass",
    options: [
      { id: "peace", label: "安心・平穏", desc: "穏やかで、脅かされず、無理のない日々", icon: "shield-check" },
      { id: "freedom", label: "自由・身軽さ", desc: "誰にも縛られず、自分のペースで歩むこと", icon: "wind" },
      { id: "warmth", label: "小さな温もり", desc: "日々のささやかな喜びやご飯を味わうこと", icon: "coffee" },
      { id: "connection", label: "心のつながり", desc: "大切に思える人や生き物と心を通わせること", icon: "heart" },
      { id: "wonder", label: "好奇心・探求", desc: "まだ見ぬ面白いものや美しい景色に出会うこと", icon: "sparkles" },
      { id: "authenticity", label: "自分らしさ", desc: "周りの期待ではなく、自分の気持ちに正直でいること", icon: "smile" }
    ],
    storageKey: "compass"
  }
];

// 心に寄り添う言葉の処方箋（哲学・心理学・文学・日常の知恵）
const PRESCRIPTIONS = [
  {
    id: 1,
    quote: "人生の意味を問うてはならない。私たちが人生から問われているのだ。人生があなたを待っている。",
    author: "ヴィクトール・フランクル（精神科医 / 『夜と霧』）",
    interpretation: "あなたが何か大きな意味を探さなくても、あなたの笑顔や、あなたにしかできない役割を、待っている人や未来が必ずあります。"
  },
  {
    id: 2,
    quote: "人生とは、今この瞬間を真剣に踊るダンスのようなものだ。目的地に着くことではなく、踊っている今そのものに意味がある。",
    author: "アルフレッド・アドラー（心理学者）",
    interpretation: "生きる意味は「到達点」ではありません。今この瞬間にお茶を飲んだり、息を吸ったりしているそのプロセス自体が人生の本体です。"
  },
  {
    id: 3,
    quote: "生きているということ。いま生きているということ。喉が渇くということ。木漏れ日がまぶしいということ。",
    author: "谷川俊太郎（詩人 / 『生きる』）",
    interpretation: "生きる意味を探してしまう時ほど、頭でっかちになっています。喉が渇いて水を飲むこと、それだけで生命は100点満点です。"
  },
  {
    id: 4,
    quote: "上善は水の如し。水は万物を利して争わず、人の悪（にく）む所に処（お）る。",
    author: "老子（古代思想家）",
    interpretation: "無理に誰かより特別になろうとしなくていい。水のように柔らかく、目の前の形に合わせて、ただ流れて生きていけば十分です。"
  },
  {
    id: 5,
    quote: "人生に壮大な意味なんて最初からなくていい。ただ『今日食べたものが美味しかった』を積み重ねるだけでいい。",
    author: "現代のカウンセラーの言葉",
    interpretation: "意味という重荷を一度降ろしてみませんか。今日一日を無事に終えて布団に入れたなら、それだけで素晴らしい一日です。"
  },
  {
    id: 6,
    quote: "自分自身を愛することこそ、生涯にわたるロマンスの始まりである。",
    author: "オスカー・ワイルド（作家）",
    interpretation: "生きる意味が見つからないときは、自分を厳しく責めているときかもしれません。まずは自分に優しくお茶を淹れてあげてください。"
  },
  {
    id: 7,
    quote: "人生に必要なのは、勇気と想像力、そしてほんの少しのお金（と愛）だけだ。",
    author: "チャールズ・チャップリン（映画監督・俳優）",
    interpretation: "難しく考えすぎなくて大丈夫。ちょっとした想像力と、今日をやり過ごす少しの工夫があれば、人生は進んでいきます。"
  },
  {
    id: 8,
    quote: "人間は生きているだけで誰かの役に立っている。存在そのものが、この世界のパズルを埋める欠かせないピースだ。",
    author: "アドラー心理学の教え",
    interpretation: "成果や生産性で自分の価値を測らないでください。あなたがここに息をしていること自体が、誰かにとっての安心になっています。"
  }
];

// 今日できる0.1歩のちいさなご褒美アクション
const TINY_ACTIONS = [
  "お気に入りの温かい飲み物を淹れて、香りを深く吸い込む",
  "窓を開けて、外の空気を胸いっぱいに吸って吐き出す",
  "大好きな曲を1曲だけ、目をつぶって集中して聴く",
  "今夜はスマホを置いて、いつもより30分早くお布団に入る",
  "空を見上げて、雲の形をぼーっと眺めてみる",
  "コンビニで、一番心惹かれたスイーツや飲み物を自分に買ってあげる",
  "首や肩をゆっくり回して、体のコリを優しくほぐす",
  "「今日も生きててえらかった」と心の中で自分をぎゅっと抱きしめる"
];

// アプリ本体
class App {
  constructor() {
    this.currentStep = 0; // 0: Prologue, 1-5: Questions, 6: Prescription, 7: Final Card
    this.answers = {
      name: "",
      senses: [],
      sensesText: "",
      unwind: [],
      unwindText: "",
      connection: [],
      connectionText: "",
      curiosity: [],
      curiosityText: "",
      compass: [],
      selectedPrescription: null,
      tinyAction: null
    };

    this.container = document.getElementById("screenContainer");
    this.progressBar = document.getElementById("progressBar");
    this.progressContainer = document.getElementById("progressContainer");
    this.stepCountText = document.getElementById("stepCountText");
    this.stepCategoryText = document.getElementById("stepCategoryText");
    this.soundToggleBtn = document.getElementById("soundToggleBtn");
    this.soundIcon = document.getElementById("soundIcon");
    this.soundText = document.getElementById("soundText");
    this.restartBtn = document.getElementById("restartBtn");

    this.initEvents();
    this.render();
  }

  initEvents() {
    this.soundToggleBtn.addEventListener("click", () => {
      const isEnabled = sound.toggle();
      if (isEnabled) {
        this.soundIcon.setAttribute("data-lucide", "volume-2");
        this.soundText.textContent = "音: オン";
        this.soundToggleBtn.classList.add("bg-white", "text-[#705E51]", "border-[#D7BAA2]");
      } else {
        this.soundIcon.setAttribute("data-lucide", "volume-x");
        this.soundText.textContent = "音: オフ";
        this.soundToggleBtn.classList.remove("bg-white", "text-[#705E51]", "border-[#D7BAA2]");
      }
      lucide.createIcons();
    });
  }

  resetToStart() {
    if (this.currentStep > 0) {
      if (confirm("最初の画面に戻りますか？（入力した内容はいったんリセットされます）")) {
        this.currentStep = 0;
        this.answers = {
          name: "",
          senses: [],
          sensesText: "",
          unwind: [],
          unwindText: "",
          connection: [],
          connectionText: "",
          curiosity: [],
          curiosityText: "",
          compass: [],
          selectedPrescription: null,
          tinyAction: null
        };
        sound.playTap();
        this.render();
      }
    }
  }

  render() {
    this.updateProgress();

    if (this.currentStep === 0) {
      this.renderPrologue();
      this.restartBtn.classList.add("hidden");
    } else if (this.currentStep >= 1 && this.currentStep <= 5) {
      this.renderQuestion(this.currentStep - 1);
      this.restartBtn.classList.remove("hidden");
    } else if (this.currentStep === 6) {
      this.renderPrescriptionStep();
      this.restartBtn.classList.remove("hidden");
    } else if (this.currentStep === 7) {
      this.renderFinalCard();
      this.restartBtn.classList.remove("hidden");
    }

    lucide.createIcons();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  updateProgress() {
    if (this.currentStep >= 1 && this.currentStep <= 5) {
      this.progressContainer.classList.remove("hidden");
      const percent = (this.currentStep / 5) * 100;
      this.progressBar.style.width = `${percent}%`;
      this.stepCountText.textContent = `${this.currentStep} / 5`;
      this.stepCategoryText.textContent = QUESTIONS[this.currentStep - 1].category;
    } else {
      this.progressContainer.classList.add("hidden");
    }
  }

  // --- Step 0: プロローグ ---
  renderPrologue() {
    this.container.innerHTML = `
      <div class="fade-in text-center py-4 sm:py-6 flex flex-col items-center">
        <!-- Leaf / Compass Icon Badge -->
        <div class="w-16 h-16 rounded-full bg-[#F3ECE1] border border-[#E4D8CA] flex items-center justify-center text-[#876F5E] mb-6 shadow-sm">
          <i data-lucide="sparkles" class="w-8 h-8 animate-pulse"></i>
        </div>

        <h1 class="text-2xl sm:text-3xl font-bold font-mincho text-[#4A4036] leading-relaxed mb-4">
          「生きる意味」に迷ったあなたへ
        </h1>

        <p class="text-sm sm:text-base text-[#736557] max-w-lg leading-relaxed mb-6 font-normal">
          生きる意味を考えるのは、あなたが自分の人生を大切に生きようとしている証拠です。<br class="hidden sm:inline">
          でも、大きな意味なんて最初から見つからなくて大丈夫。<br>
          意味は探すものではなく、日々のちいさな温もりの中に灯るあかりです。
        </p>

        <!-- Breathing Widget -->
        <div class="my-6 p-6 rounded-2xl bg-[#F6EFE6]/80 border border-[#EADFCF] w-full max-w-md flex flex-col items-center">
          <div class="text-xs font-semibold text-[#8B7766] tracking-wider mb-4 flex items-center gap-1.5">
            <i data-lucide="wind" class="w-4 h-4"></i>
            <span>心をほどく深呼吸ガイド</span>
          </div>

          <div class="relative w-32 h-32 flex items-center justify-center my-2">
            <div class="breath-circle absolute inset-0 rounded-full bg-gradient-to-tr from-[#D7BAA2] to-[#B8CFB7] opacity-60"></div>
            <div class="relative z-10 text-center">
              <span id="breathText" class="text-sm font-semibold text-[#57493E]">息を吸って…</span>
            </div>
          </div>
          <p class="text-[12px] text-[#9A8778] mt-3">肩の力を抜いて、楽なペースで呼吸してみてください。</p>
        </div>

        <!-- Start CTA -->
        <div class="mt-4 w-full max-w-sm">
          <button id="startJourneyBtn" class="w-full py-3.5 px-6 rounded-2xl bg-[#7A6656] text-white font-medium hover:bg-[#685547] shadow-[0_4px_16px_rgba(122,102,86,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <span>少しだけ、心の声を聞いてみる</span>
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </button>
          <p class="text-[11px] text-[#A6978A] mt-2.5">所要時間: 3〜4分 / 途中でやめても大丈夫です</p>
        </div>
      </div>
    `;

    // 呼吸テキストの定期切り替え
    let breathPhase = 0;
    const breathWords = ["息を吸って… (4秒)", "そのまま止めて… (4秒)", "ゆっくり吐き出して… (6秒)"];
    const breathInterval = setInterval(() => {
      const breathEl = document.getElementById("breathText");
      if (!breathEl) {
        clearInterval(breathInterval);
        return;
      }
      breathPhase = (breathPhase + 1) % 3;
      breathEl.textContent = breathWords[breathPhase];
    }, 4500);

    document.getElementById("startJourneyBtn").addEventListener("click", () => {
      sound.playTap();
      this.currentStep = 1;
      this.render();
    });
  }

  // --- Step 1〜5: 質問ジャーナリング ---
  renderQuestion(index) {
    const q = QUESTIONS[index];
    const key = q.storageKey;

    if (q.type === "compass") {
      this.renderCompassQuestion(q);
      return;
    }

    const currentChips = this.answers[key] || [];
    const currentText = this.answers[`${key}Text`] || "";

    this.container.innerHTML = `
      <div class="fade-in flex flex-col justify-between h-full">
        <div>
          <!-- Question Header -->
          <div class="mb-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFE5D9] text-[#7A6656] mb-3">
              <i data-lucide="compass" class="w-3.5 h-3.5"></i>
              ${q.category}
            </span>
            <h2 class="text-xl sm:text-2xl font-bold font-mincho text-[#463D34] leading-relaxed mb-2">
              ${q.title}
            </h2>
            <p class="text-xs sm:text-sm text-[#87786B] leading-relaxed">
              ${q.subtitle}
            </p>
          </div>

          <!-- Suggested Chips -->
          <div class="mb-5">
            <label class="block text-xs font-semibold text-[#78695D] mb-2">
              心に浮かぶものをタップ（複数選べます）:
            </label>
            <div class="flex flex-wrap gap-2" id="chipsContainer">
              ${q.chips.map(chip => {
                const isSelected = currentChips.includes(chip);
                return `
                  <button type="button" class="chip-btn px-3.5 py-1.5 rounded-full text-xs sm:text-sm border border-[#E2D5C7] bg-[#FCF8F2] text-[#615447] ${isSelected ? 'selected' : ''}" data-chip="${chip}">
                    ${chip}
                  </button>
                `;
              }).join("")}
            </div>
          </div>

          <!-- Custom Text Input -->
          <div class="mb-4">
            <label for="freeTextInput" class="block text-xs font-semibold text-[#78695D] mb-1.5">
              あなたの言葉で言葉にしてみたいこと（任意）:
            </label>
            <textarea id="freeTextInput" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-[#DFD3C4] bg-white/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C7B29F] text-sm text-[#4E443A] placeholder-[#B5A597] transition-all resize-none" placeholder="${q.placeholder}">${currentText}</textarea>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="pt-4 border-t border-[#EDE3D6] flex items-center justify-between gap-3">
          <button id="prevBtn" class="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium text-[#7D6E61] hover:bg-[#F2EAE0] transition-colors flex items-center gap-1.5">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
            <span>前へ</span>
          </button>

          <div class="flex items-center gap-2">
            <button id="skipBtn" class="py-2.5 px-3 rounded-xl text-xs text-[#9E8E81] hover:text-[#5F5145] hover:bg-[#F2EAE0] transition-colors">
              今は思いつかない（スキップ）
            </button>
            <button id="nextBtn" class="py-2.5 px-6 rounded-xl bg-[#7A6656] text-white text-xs sm:text-sm font-medium hover:bg-[#685547] shadow-sm transition-all active:scale-[0.98] flex items-center gap-1.5">
              <span>次へ進む</span>
              <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    // Chip Click Events
    const chipBtns = this.container.querySelectorAll(".chip-btn");
    chipBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        sound.playTap();
        const chip = btn.getAttribute("data-chip");
        if (this.answers[key].includes(chip)) {
          this.answers[key] = this.answers[key].filter(c => c !== chip);
          btn.classList.remove("selected");
        } else {
          this.answers[key].push(chip);
          btn.classList.add("selected");
        }
      });
    });

    // Text Area Event
    const textArea = document.getElementById("freeTextInput");
    textArea.addEventListener("input", (e) => {
      this.answers[`${key}Text`] = e.target.value;
    });

    // Navigation Events
    document.getElementById("prevBtn").addEventListener("click", () => {
      sound.playTap();
      this.currentStep--;
      this.render();
    });

    document.getElementById("skipBtn").addEventListener("click", () => {
      sound.playTap();
      this.currentStep++;
      this.render();
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      sound.playTap();
      this.currentStep++;
      this.render();
    });
  }

  // --- Step 5: 人生の北極星（大切にしたい感覚） ---
  renderCompassQuestion(q) {
    const selected = this.answers.compass || [];

    this.container.innerHTML = `
      <div class="fade-in flex flex-col justify-between h-full">
        <div>
          <div class="mb-4">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFE5D9] text-[#7A6656] mb-3">
              <i data-lucide="compass" class="w-3.5 h-3.5"></i>
              ${q.category}
            </span>
            <h2 class="text-xl sm:text-2xl font-bold font-mincho text-[#463D34] leading-relaxed mb-2">
              ${q.title}
            </h2>
            <p class="text-xs sm:text-sm text-[#87786B] leading-relaxed">
              ${q.subtitle}
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4" id="compassOptions">
            ${q.options.map(opt => {
              const isChecked = selected.includes(opt.id);
              return `
                <div class="compass-card cursor-pointer p-4 rounded-2xl border transition-all duration-200 ${isChecked ? 'bg-[#7A6656] text-white border-[#7A6656] shadow-md' : 'bg-[#FCF8F3] hover:bg-[#F5ECE0] text-[#55493D] border-[#E5DACD]'}" data-id="${opt.id}">
                  <div class="flex items-center gap-2 mb-1.5">
                    <i data-lucide="${opt.icon}" class="w-4 h-4 ${isChecked ? 'text-amber-200' : 'text-[#8C7A6B]'}"></i>
                    <h3 class="text-sm font-bold ${isChecked ? 'text-white' : 'text-[#483E34]'}">${opt.label}</h3>
                  </div>
                  <p class="text-xs leading-relaxed ${isChecked ? 'text-amber-100/90' : 'text-[#847466]'}">${opt.desc}</p>
                </div>
              `;
            }).join("")}
          </div>
        </div>

        <div class="pt-4 border-t border-[#EDE3D6] flex items-center justify-between gap-3">
          <button id="prevBtn" class="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium text-[#7D6E61] hover:bg-[#F2EAE0] transition-colors flex items-center gap-1.5">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
            <span>前へ</span>
          </button>

          <button id="nextBtn" class="py-2.5 px-6 rounded-xl bg-[#7A6656] text-white text-xs sm:text-sm font-medium hover:bg-[#685547] shadow-sm transition-all active:scale-[0.98] flex items-center gap-1.5">
            <span>言葉の処方箋へ</span>
            <i data-lucide="sparkles" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    const cards = this.container.querySelectorAll(".compass-card");
    cards.forEach(card => {
      card.addEventListener("click", () => {
        sound.playTap();
        const id = card.getAttribute("data-id");
        if (this.answers.compass.includes(id)) {
          this.answers.compass = this.answers.compass.filter(x => x !== id);
        } else {
          if (this.answers.compass.length >= 2) {
            // 最大2つまで：古い方を押し出す
            this.answers.compass.shift();
          }
          this.answers.compass.push(id);
        }
        this.renderCompassQuestion(q);
        lucide.createIcons();
      });
    });

    document.getElementById("prevBtn").addEventListener("click", () => {
      sound.playTap();
      this.currentStep--;
      this.render();
    });

    document.getElementById("nextBtn").addEventListener("click", () => {
      if (this.answers.compass.length === 0) {
        // 未選択の場合はデフォルトで「安心・平穏」をセット
        this.answers.compass = ["peace"];
      }
      sound.playTap();
      this.currentStep = 6;
      this.render();
    });
  }

  // --- Step 6: 心に効く「言葉の処方箋」 ---
  renderPrescriptionStep() {
    if (!this.answers.selectedPrescription) {
      // 初期値はランダムで1つ選択
      const randomIdx = Math.floor(Math.random() * PRESCRIPTIONS.length);
      this.answers.selectedPrescription = PRESCRIPTIONS[randomIdx];
    }

    const currentP = this.answers.selectedPrescription;

    this.container.innerHTML = `
      <div class="fade-in flex flex-col justify-between h-full">
        <div>
          <div class="mb-4 text-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EFE5D9] text-[#7A6656] mb-2">
              <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
              こもれびの処方箋
            </span>
            <h2 class="text-xl sm:text-2xl font-bold font-mincho text-[#463D34] leading-relaxed">
              心に灯す、ひとつの言葉
            </h2>
            <p class="text-xs sm:text-sm text-[#87786B] mt-1">
              今のあなたの心に、いちばんやさしく染み込む言葉を選びました。
            </p>
          </div>

          <!-- Featured Prescription Card -->
          <div class="my-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFF9F2] via-[#F8EFE2] to-[#EEF5ED] border border-[#E2D5C5] shadow-sm relative overflow-hidden">
            <i data-lucide="quote" class="absolute -right-2 -bottom-4 w-28 h-28 text-[#DDCFC0]/30 pointer-events-none"></i>

            <p class="text-base sm:text-lg font-bold font-mincho text-[#413830] leading-relaxed mb-4 relative z-10">
              「${currentP.quote}」
            </p>

            <div class="text-xs sm:text-sm font-semibold text-[#8C7A6B] mb-4 relative z-10 flex items-center gap-1.5">
              <span>― ${currentP.author}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-white/70 border border-[#E9DECE] text-xs sm:text-sm text-[#6A5D50] leading-relaxed relative z-10">
              <span class="font-bold text-[#86705D] block mb-1">【この言葉の温もり】</span>
              ${currentP.interpretation}
            </div>
          </div>

          <!-- Random Re-roll Button -->
          <div class="flex justify-center mb-2">
            <button id="rerollBtn" class="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs bg-[#F2EAE0] hover:bg-[#EADBCC] text-[#6A5A4D] transition-colors border border-[#DDD0C0] shadow-sm">
              <i data-lucide="dice-5" class="w-3.5 h-3.5"></i>
              <span>別の言葉を引いてみる</span>
            </button>
          </div>
        </div>

        <div class="pt-4 border-t border-[#EDE3D6] flex items-center justify-between gap-3">
          <button id="prevBtn" class="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-medium text-[#7D6E61] hover:bg-[#F2EAE0] transition-colors flex items-center gap-1.5">
            <i data-lucide="chevron-left" class="w-4 h-4"></i>
            <span>前へ</span>
          </button>

          <button id="finishBtn" class="py-2.5 px-6 rounded-xl bg-[#7A6656] text-white text-xs sm:text-sm font-medium hover:bg-[#685547] shadow-sm transition-all active:scale-[0.98] flex items-center gap-1.5">
            <span>あなたのお守りカードを作る</span>
            <i data-lucide="award" class="w-4 h-4"></i>
          </button>
        </div>
      </div>
    `;

    document.getElementById("rerollBtn").addEventListener("click", () => {
      sound.playTap();
      let nextP;
      do {
        nextP = PRESCRIPTIONS[Math.floor(Math.random() * PRESCRIPTIONS.length)];
      } while (nextP.id === currentP.id);
      this.answers.selectedPrescription = nextP;
      this.renderPrescriptionStep();
      lucide.createIcons();
    });

    document.getElementById("prevBtn").addEventListener("click", () => {
      sound.playTap();
      this.currentStep = 5;
      this.render();
    });

    document.getElementById("finishBtn").addEventListener("click", () => {
      sound.playChord();
      // 小さなアクションを決定
      this.answers.tinyAction = TINY_ACTIONS[Math.floor(Math.random() * TINY_ACTIONS.length)];
      this.currentStep = 7;
      this.render();
    });
  }

  // --- Step 7: 完成した「お守りカード（心のしおり）」 ---
  renderFinalCard() {
    const p = this.answers.selectedPrescription;
    const compassOptions = QUESTIONS[4].options;
    const compassLabels = (this.answers.compass || ["peace"])
      .map(id => compassOptions.find(o => o.id === id)?.label)
      .filter(Boolean)
      .join(" ・ ");

    // 集まった小さな光（チップや自由入力を統合）
    const allLights = [];
    if (this.answers.senses.length) allLights.push(...this.answers.senses);
    if (this.answers.sensesText) allLights.push(this.answers.sensesText);
    if (this.answers.unwind.length) allLights.push(...this.answers.unwind);
    if (this.answers.unwindText) allLights.push(this.answers.unwindText);
    if (this.answers.connection.length) allLights.push(...this.answers.connection);
    if (this.answers.connectionText) allLights.push(this.answers.connectionText);
    if (this.answers.curiosity.length) allLights.push(...this.answers.curiosity);
    if (this.answers.curiosityText) allLights.push(this.answers.curiosityText);

    // 重複除去 & 最大4つまで抽出
    const uniqueLights = Array.from(new Set(allLights.filter(Boolean))).slice(0, 4);
    if (uniqueLights.length === 0) {
      uniqueLights.push("今日息をしていること", "温かいお茶の美味しさ", "静かな夜の安心感");
    }

    const todayDate = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });

    this.container.innerHTML = `
      <div class="fade-in flex flex-col justify-between">
        <div class="text-center mb-6">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAE0D3] text-[#6F5D4E] mb-2">
            <i data-lucide="check" class="w-3.5 h-3.5"></i>
            心のしおりが完成しました
          </div>
          <h2 class="text-2xl sm:text-3xl font-bold font-mincho text-[#443B32]">
            あなただけのお守り羅針盤
          </h2>
          <p class="text-xs sm:text-sm text-[#87786B] mt-1">
            生きる意味に迷ったとき、いつでもこのカードを見返してください。
          </p>
        </div>

        <!-- Downloadable Card Component -->
        <div class="w-full flex justify-center mb-6">
          <div id="finalOmamoriCard" class="w-full max-w-lg p-6 sm:p-8 rounded-3xl border-2 border-[#D7C7B5] shadow-lg text-[#473D34]">
            
            <!-- Card Header -->
            <div class="flex items-center justify-between border-b border-[#E1D3C2] pb-3 mb-4">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full bg-[#E4D5C4] flex items-center justify-center text-[#746252]">
                  <i data-lucide="compass" class="w-3.5 h-3.5"></i>
                </div>
                <span class="text-xs font-semibold font-mincho tracking-wider text-[#635446]">こもれびの羅針盤</span>
              </div>
              <span class="text-[11px] text-[#9A897B]">${todayDate}</span>
            </div>

            <!-- Compass Point -->
            <div class="mb-4 text-center bg-white/60 backdrop-blur-sm p-3 rounded-2xl border border-white/70">
              <span class="text-[11px] font-bold tracking-widest text-[#947E6D] uppercase block mb-0.5">MY COMPASS / あなたの北極星</span>
              <span class="text-base sm:text-lg font-bold font-mincho text-[#524436]">
                「${compassLabels || "安心・平穏"}」
              </span>
            </div>

            <!-- 3 Little Lights -->
            <div class="mb-4">
              <span class="text-xs font-bold text-[#867362] block mb-2 flex items-center gap-1.5">
                <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-500"></i>
                いま心にある小さな光
              </span>
              <div class="flex flex-wrap gap-1.5">
                ${uniqueLights.map(light => `
                  <span class="inline-block px-3 py-1 rounded-full text-xs bg-white/80 border border-[#E3D7C9] text-[#55473A] shadow-xs">
                    ${light}
                  </span>
                `).join("")}
              </div>
            </div>

            <!-- The Prescription Quote -->
            <div class="p-4 rounded-2xl bg-white/70 backdrop-blur-sm border border-[#E8DDCE] mb-4">
              <span class="text-[11px] font-bold text-[#8C7A6A] block mb-1">【あなたへ贈る言葉】</span>
              <p class="text-xs sm:text-sm font-mincho font-semibold text-[#483F36] leading-relaxed mb-1.5">
                「${p.quote}」
              </p>
              <p class="text-[11px] text-right text-[#968576]">― ${p.author}</p>
            </div>

            <!-- Today's 0.1 Step -->
            <div class="p-3.5 rounded-xl bg-[#F4ECE1]/90 border border-[#DFD1BF] text-center">
              <span class="text-[11px] font-bold text-[#887463] block mb-0.5">🌱 今日できる、0.1歩のやさしいご褒美</span>
              <p class="text-xs font-medium text-[#504439]">${this.answers.tinyAction}</p>
            </div>

            <!-- Bottom message -->
            <div class="mt-4 pt-3 border-t border-[#E5D7C7] text-center">
              <p class="text-[11px] text-[#9A8A7C]">あなたは今日を生きているだけで、もう充分えらいです。</p>
            </div>

          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button id="downloadCardBtn" class="w-full sm:w-auto py-3 px-6 rounded-2xl bg-[#7A6656] text-white text-xs sm:text-sm font-medium hover:bg-[#685547] shadow-[0_4px_14px_rgba(122,102,86,0.25)] transition-all active:scale-[0.98] flex items-center justify-center gap-2">
            <i data-lucide="download" class="w-4 h-4"></i>
            <span>お守り画像を保存する</span>
          </button>

          <button id="copySummaryBtn" class="w-full sm:w-auto py-3 px-5 rounded-2xl bg-white border border-[#D9CCBE] text-[#635345] text-xs sm:text-sm font-medium hover:bg-[#FAF4ED] transition-all flex items-center justify-center gap-2">
            <i data-lucide="copy" class="w-4 h-4"></i>
            <span>テキストをコピー</span>
          </button>

          <button id="anotherActionBtn" class="w-full sm:w-auto py-3 px-4 rounded-2xl text-[#8E7E70] text-xs hover:bg-[#F2EAE0] transition-colors flex items-center justify-center gap-1.5" title="今日のご褒美を変える">
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
            <span>別のご褒美にする</span>
          </button>
        </div>

        <div class="mt-6 text-center">
          <button id="retakeBtn" class="text-xs text-[#9B8B7D] underline hover:text-[#584C3F] transition-colors">
            もう一度最初から向き合う
          </button>
        </div>
      </div>
    `;

    // Download Image via html2canvas
    document.getElementById("downloadCardBtn").addEventListener("click", () => {
      sound.playTap();
      const cardEl = document.getElementById("finalOmamoriCard");
      const downloadBtn = document.getElementById("downloadCardBtn");
      downloadBtn.innerHTML = `<span>保存中...</span>`;

      html2canvas(cardEl, {
        scale: 2,
        backgroundColor: null,
        useCORS: true
      }).then(canvas => {
        const link = document.createElement("a");
        link.download = `こもれびの羅針盤_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
        downloadBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4"></i><span>保存しました！</span>`;
        lucide.createIcons();
        setTimeout(() => {
          downloadBtn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i><span>お守り画像を保存する</span>`;
          lucide.createIcons();
        }, 2500);
      }).catch(err => {
        console.error(err);
        alert("画像の保存に失敗しました。スクリーンショット等をご利用ください。");
        downloadBtn.innerHTML = `<i data-lucide="download" class="w-4 h-4"></i><span>お守り画像を保存する</span>`;
        lucide.createIcons();
      });
    });

    // Copy Summary Text
    document.getElementById("copySummaryBtn").addEventListener("click", () => {
      sound.playTap();
      const textToCopy = `【こもれびの羅針盤 - 心のお守り】
■ 私の北極星：${compassLabels || "安心・平穏"}
■ 心にある小さな光：${uniqueLights.join("、")}
■ 心に灯す言葉：「${p.quote}」 (― ${p.author})
■ 今日できる0.1歩：${this.answers.tinyAction}
― あなたは今日を生きているだけで、もう充分えらいです。`;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const copyBtn = document.getElementById("copySummaryBtn");
        copyBtn.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-emerald-600"></i><span>コピー完了！</span>`;
        lucide.createIcons();
        setTimeout(() => {
          copyBtn.innerHTML = `<i data-lucide="copy" class="w-4 h-4"></i><span>テキストをコピー</span>`;
          lucide.createIcons();
        }, 2000);
      });
    });

    // Change Tiny Action
    document.getElementById("anotherActionBtn").addEventListener("click", () => {
      sound.playTap();
      let nextAction;
      do {
        nextAction = TINY_ACTIONS[Math.floor(Math.random() * TINY_ACTIONS.length)];
      } while (nextAction === this.answers.tinyAction);
      this.answers.tinyAction = nextAction;
      this.renderFinalCard();
      lucide.createIcons();
    });

    // Retake
    document.getElementById("retakeBtn").addEventListener("click", () => {
      this.resetToStart();
    });
  }
}

// アプリの起動
let app;
window.addEventListener("DOMContentLoaded", () => {
  app = new App();
});
