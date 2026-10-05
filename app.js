/**
 * 人生のサブクエストガチャ (Subquest Gacha)
 * 今日の生きる意味をガチャで引いて適当にクリアするWebアプリ
 */

// --- 音響システム (Web Audio API - ピコピコゲーム風SE) ---
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
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
    this.enabled = !this.enabled;
    return this.enabled;
  }

  // 短いピコッ音（ボタン等）
  playBeep(freq = 440, type = 'square', duration = 0.08) {
    if (!this.enabled) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  // ガチャドラムロール音
  playDrumroll() {
    if (!this.enabled) return;
    this.init();
    let count = 0;
    const interval = setInterval(() => {
      this.playBeep(200 + count * 30, 'sawtooth', 0.05);
      count++;
      if (count > 12) clearInterval(interval);
    }, 70);
  }

  // ガチャ排出・ファンファーレ
  playFanfare(rarity) {
    if (!this.enabled) return;
    this.init();
    const notes = rarity === 'UR' || rarity === 'SSR'
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // C E G C E
      : [440, 554.37, 659.25, 880];

    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 'triangle', 0.25);
      }, idx * 100);
    });
  }

  // クエスト達成音
  playSuccess() {
    if (!this.enabled) return;
    this.init();
    [587.33, 739.99, 880, 1174.66].forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 'sine', 0.2);
      }, idx * 80);
    });
  }
}

const se = new SoundEffects();

// --- 生きる意味サブクエスト データベース ---
const QUEST_POOL = [
  // === N (ノーマル: 日常のささやかな幸せ) ===
  {
    id: "n1",
    rarity: "N",
    title: "コンビニの新作アイス棚を5分間真剣に品評する",
    difficulty: "★☆☆☆☆",
    exp: 50,
    category: "食欲解放",
    comment: "買うか買わないかは自由。ただ『今の企業努力すげえな』と感心するだけで生きる意味は達成されます。",
    icon: "🍦"
  },
  {
    id: "n2",
    rarity: "N",
    title: "靴下を脱ぎ捨てて足の指を限界までパーにする",
    difficulty: "★☆☆☆☆",
    exp: 40,
    category: "身体解放",
    comment: "人類が靴という拘束具から解き放たれる至福の瞬間。足の指の解放感こそが人生の原点です。",
    icon: "👣"
  },
  {
    id: "n3",
    rarity: "N",
    title: "ポテチの袋の底に溜まった細かい破片を一気に口に流し込む",
    difficulty: "★☆☆☆☆",
    exp: 60,
    category: "背徳感",
    comment: "塩分と旨味が凝縮された最後の一撃。お行儀の良さを捨て去った者だけに許された神の一口。",
    icon: "🥔"
  },
  {
    id: "n4",
    rarity: "N",
    title: "お風呂上がりに腰に手を当てて冷たい飲み物をグッと飲む",
    difficulty: "★☆☆☆☆",
    exp: 50,
    category: "王道儀式",
    comment: "牛乳でも麦茶でも炭酸でも可。声に出して『ぷはぁーっ！』と言えたら追加経験値獲得。",
    icon: "🥛"
  },
  {
    id: "n5",
    rarity: "N",
    title: "YouTubeで動物がただ寝てるだけの動画を3本見る",
    difficulty: "★☆☆☆☆",
    exp: 45,
    category: "脳内洗浄",
    comment: "犬でも猫でもパンダでもOK。役に立たない情報を浴びることこそが休日の真髄。",
    icon: "🐱"
  },
  {
    id: "n6",
    rarity: "N",
    title: "ペットボトルのキャップを一発でゴミ箱にスナイプする",
    difficulty: "★★☆☆☆",
    exp: 70,
    category: "日常スポーツ",
    comment: "入ったらガッツポーズ。外れたら誰にも見られてないことを確認して拾いに行きましょう。",
    icon: "🎯"
  },
  {
    id: "n7",
    rarity: "N",
    title: "信号で青になった瞬間に『今、俺が世界を動かした』と思う",
    difficulty: "★☆☆☆☆",
    exp: 50,
    category: "中二病セラピー",
    comment: "ただの歩行者用信号ですが、あなたが歩き出すために青になったと解釈してください。",
    icon: "🚥"
  },

  // === R (レア: ちょっとテンション上がる瞬間) ===
  {
    id: "r1",
    rarity: "R",
    title: "散歩中に猫を見かけて心の中で『お疲れ様です』と敬礼する",
    difficulty: "★★☆☆☆",
    exp: 120,
    category: "地域交流",
    comment: "目があっても深追いは禁物。クールに心の中でエールを送り合うのが大人の作法です。",
    icon: "🐈"
  },
  {
    id: "r2",
    rarity: "R",
    title: "金曜の夜に『明日アラーム鳴らさなくていい事実』を噛み締める",
    difficulty: "★☆☆☆☆",
    exp: 150,
    category: "精神勝利",
    comment: "アラームを全OFFにする瞬間の脳内麻薬は、どんな高級スパよりも効きます。",
    icon: "⏰"
  },
  {
    id: "r3",
    rarity: "R",
    title: "スーパーでちょうど半額シールが貼られた瞬間の惣菜を奪取する",
    difficulty: "★★★☆☆",
    exp: 180,
    category: "ハンター",
    comment: "店員さんの背後に忍び寄り、貼られた瞬間にサッとカゴへ。今日という日の勝者はあなたです。",
    icon: "🏷️"
  },
  {
    id: "r4",
    rarity: "R",
    title: "深夜0時を過ぎてから罪深いカップ麺にお湯を注ぐ",
    difficulty: "★★☆☆☆",
    exp: 160,
    category: "深夜の背徳",
    comment: "カロリーとは『美味しさの単位』。深夜3分間のタイマー音は人生最高のBGMです。",
    icon: "🍜"
  },
  {
    id: "r5",
    rarity: "R",
    title: "新品のノートや本を開いて最初のページの匂いを深く嗅ぐ",
    difficulty: "★☆☆☆☆",
    exp: 110,
    category: "変態的快感",
    comment: "インクと紙の独特なアロマ。勉強や読書をしなくても、匂いを嗅いだ時点で50%完了です。",
    icon: "📖"
  },
  {
    id: "r6",
    rarity: "R",
    title: "自動ドアが開く瞬間に心の中でハンドパワーを送る",
    difficulty: "★★☆☆☆",
    exp: 130,
    category: "超能力訓練",
    comment: "タイミングがバッチリ合えば、あたかも自分の念動力で開いたかのような優越感に浸れます。",
    icon: "🚪"
  },
  {
    id: "r7",
    rarity: "R",
    title: "雨の日に『今日は一歩も外に出ないぞ』という鉄の決意を固める",
    difficulty: "★☆☆☆☆",
    exp: 140,
    category: "引きこもり",
    comment: "雨音をBGMにお布団に潜り込む快感。外で戦う人々への敬意を払いつつ二度寝しましょう。",
    icon: "🌧️"
  },

  // === SR (スーパーレア: 日常の小さな奇跡) ===
  {
    id: "sr1",
    rarity: "SR",
    title: "目的地までの信号に一度も引っかからず『選ばれし者』になる",
    difficulty: "★★★★☆",
    exp: 300,
    category: "奇跡の遭遇",
    comment: "街全体があなたのために青信号をプレゼントしてくれた奇跡。今日宝くじ買ってもいいレベル。",
    icon: "⚡"
  },
  {
    id: "sr2",
    rarity: "SR",
    title: "美容室のシャンプーで『痒いとこないですか？』に完璧な呼吸で『大丈夫です』と返す",
    difficulty: "★★★☆☆",
    exp: 280,
    category: "コミュ力極",
    comment: "喉に力を入れず、穏やかかつ聞き取りやすいトーンで返す芸術的コミュニケーション。",
    icon: "💇"
  },
  {
    id: "sr3",
    rarity: "SR",
    title: "布団の『まだ誰も温めてないひんやりしたゾーン』を足先で発掘する",
    difficulty: "★★☆☆☆",
    exp: 260,
    category: "秘境探検",
    comment: "冬はあたたかい場所を、夏はつめたい場所を。足先が未知のオアシスに触れた時の感動。",
    icon: "🛌"
  },
  {
    id: "sr4",
    rarity: "SR",
    title: "卵を片手で割ろうとして殻をひとつも入れずに成功させる",
    difficulty: "★★★★☆",
    exp: 320,
    category: "神業クッキング",
    comment: "フライパンの縁でコンッ！パカッ！ジュワー！もし殻が入ったらなかったことにしましょう。",
    icon: "🍳"
  },
  {
    id: "sr5",
    rarity: "SR",
    title: "友達にめちゃくちゃくだらないネットミームを送りつけて反応を待つ",
    difficulty: "★★☆☆☆",
    exp: 250,
    category: "友情の証明",
    comment: "「草」の一言が返ってきたらクエスト達成。無駄話ができる友達がいることこそ人生の宝です。",
    icon: "📱"
  },

  // === SSR (超激レア: 悟りの境地) ===
  {
    id: "ssr1",
    rarity: "SSR",
    title: "今日一日生き延びて、地球の植物に二酸化炭素を安定供給する",
    difficulty: "★☆☆☆☆",
    exp: 600,
    category: "地球規模貢献",
    comment: "あなたが吸った酸素と吐いた息のおかげで森が潤っています。立派な地球の環境保全活動です。",
    icon: "🌍"
  },
  {
    id: "ssr2",
    rarity: "SSR",
    title: "『まあ明日地球が滅亡するかもだしな』と唱えて宿題・タスクを後回しにする",
    difficulty: "★★☆☆☆",
    exp: 650,
    category: "脱力奥義",
    comment: "明日の自分は今日の自分より優秀であるという強い信頼（他力本願）に基づく崇高な決断。",
    icon: "🌌"
  },
  {
    id: "ssr3",
    rarity: "SSR",
    title: "自販機で一番売れてなさそうな謎ジュースを買って『悪くないな』と呟く",
    difficulty: "★★★★☆",
    exp: 700,
    category: "開拓者精神",
    comment: "誰も選ばない選択肢をあえて愛でる孤独のグルメ。世間の流行に流されない真の強者です。",
    icon: "🥤"
  },
  {
    id: "ssr4",
    rarity: "SSR",
    title: "休日に14時まで爆睡して『寝すぎて腰痛えわwww』と高笑いする",
    difficulty: "★★☆☆☆",
    exp: 620,
    category: "時間富豪",
    comment: "「一日を無駄にした」と悔やんではいけません。「半日を贅沢に溶かした」と胸を張るのです。",
    icon: "😴"
  },

  // === UR (神話級: 究極の生きる意味) ===
  {
    id: "ur1",
    rarity: "UR",
    title: "生きる意味を探すのを完全に放棄して、目の前のポテチを無心で食べる神になる",
    difficulty: "★★★★★",
    exp: 1500,
    category: "全知全能",
    comment: "意味なんて最初から無かった。美味しいものを食べて寝る、それ以上の高尚な哲学がこの世にあるだろうか？",
    icon: "👑"
  },
  {
    id: "ur2",
    rarity: "UR",
    title: "人類80億人の中で、今日この瞬間にこの画面を見て笑った唯一の存在になる",
    difficulty: "★★★★★",
    exp: 1800,
    category: "奇跡の特異点",
    comment: "あなたの存在確率は天文学的数字。今日あなたがここにいるだけで、宇宙の歴史のハイライトです。",
    icon: "🌟"
  },
  {
    id: "ur3",
    rarity: "UR",
    title: "「生きて息してるだけで偉すぎでは？？？」と自分に名誉市民賞を授与する",
    difficulty: "★★★★★",
    exp: 2000,
    category: "自己肯定極振",
    comment: "心臓は休まず動き、内臓は働き、あなたは今呼吸をしている。すでに全自動で偉業達成中です。",
    icon: "🎖️"
  }
];

// 称号・レベルテーブル
const TITLES = [
  { level: 1, name: "一般人", reqExp: 0 },
  { level: 2, name: "日常の観察者", reqExp: 100 },
  { level: 3, name: "散歩の達人", reqExp: 300 },
  { level: 4, name: "二度寝の勇者", reqExp: 600 },
  { level: 5, name: "深夜の哲学者", reqExp: 1000 },
  { level: 6, name: "脱力マスター", reqExp: 1600 },
  { level: 7, name: "無駄の錬金術師", reqExp: 2400 },
  { level: 8, name: "人生ボーナスステージ突入者", reqExp: 3500 },
  { level: 9, name: "地球滞在プロフェッショナル", reqExp: 5000 },
  { level: 10, name: "現世超越神", reqExp: 7500 }
];

// アプリ本体
class SubquestApp {
  constructor() {
    this.userExp = parseInt(localStorage.getItem("sq_exp") || "0", 10);
    this.completedQuests = JSON.parse(localStorage.getItem("sq_completed") || "[]");
    this.currentQuest = null;
    this.isSpinning = false;

    // DOM要素
    this.idleView = document.getElementById("idleView");
    this.resultView = document.getElementById("resultView");
    this.spinBtn = document.getElementById("spinBtn");
    this.soundBtn = document.getElementById("soundBtn");
    this.soundIcon = document.getElementById("soundIcon");
    this.playerLevelText = document.getElementById("playerLevelText");
    this.completedCountBadge = document.getElementById("completedCountBadge");
    this.collectionBtn = document.getElementById("collectionBtn");
    this.collectionModal = document.getElementById("collectionModal");
    this.closeModalBtn = document.getElementById("closeModalBtn");
    this.collectionList = document.getElementById("collectionList");
    this.shareSiteBtn = document.getElementById("shareSiteBtn");

    this.init();
  }

  init() {
    this.updatePlayerStatus();
    this.bindEvents();
    lucide.createIcons();
  }

  bindEvents() {
    this.spinBtn.addEventListener("click", () => this.spinGacha());

    this.soundBtn.addEventListener("click", () => {
      const enabled = se.toggle();
      if (enabled) {
        this.soundIcon.setAttribute("data-lucide", "volume-2");
      } else {
        this.soundIcon.setAttribute("data-lucide", "volume-x");
      }
      lucide.createIcons();
    });

    this.collectionBtn.addEventListener("click", () => this.openCollectionModal());
    this.closeModalBtn.addEventListener("click", () => this.collectionModal.classList.add("hidden"));
    this.collectionModal.addEventListener("click", (e) => {
      if (e.target === this.collectionModal) this.collectionModal.classList.add("hidden");
    });

    this.shareSiteBtn.addEventListener("click", () => {
      se.playBeep(520, "sine");
      const shareUrl = window.location.href;
      const shareText = "「生きる意味？そんなのガチャで引けばいいじゃん。」今日の生きる意味生成器をやってみたww";

      if (navigator.share) {
        navigator.share({
          title: "人生のサブクエストガチャ",
          text: shareText,
          url: shareUrl
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert("サイトのURLをコピーしました！LINEやSNSで友達に送りつけてみよう！");
      }
    });
  }

  updatePlayerStatus() {
    let currentTitle = TITLES[0];
    for (let t of TITLES) {
      if (this.userExp >= t.reqExp) {
        currentTitle = t;
      }
    }
    this.playerLevelText.textContent = `Lv.${currentTitle.level} ${currentTitle.name}`;
    this.completedCountBadge.textContent = this.completedQuests.length;
    localStorage.setItem("sq_exp", this.userExp.toString());
  }

  // ガチャ抽選ロジック
  drawRandomQuest() {
    // 確率テーブル: N: 40%, R: 35%, SR: 18%, SSR: 6%, UR: 1%
    const rand = Math.random() * 100;
    let targetRarity = "N";

    if (rand < 1) targetRarity = "UR";
    else if (rand < 7) targetRarity = "SSR";
    else if (rand < 25) targetRarity = "SR";
    else if (rand < 60) targetRarity = "R";
    else targetRarity = "N";

    const filtered = QUEST_POOL.filter(q => q.rarity === targetRarity);
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  spinGacha() {
    if (this.isSpinning) return;
    this.isSpinning = true;

    se.playDrumroll();

    // カプセルをガタガタ激しく回転させる演出
    const capsuleEl = this.idleView.querySelector(".capsule-bounce");
    if (capsuleEl) {
      capsuleEl.classList.remove("capsule-bounce");
      capsuleEl.classList.add("spinning-anim");
    }

    setTimeout(() => {
      this.currentQuest = this.drawRandomQuest();
      this.showResult(this.currentQuest);
      this.isSpinning = false;

      if (capsuleEl) {
        capsuleEl.classList.remove("spinning-anim");
        capsuleEl.classList.add("capsule-bounce");
      }
    }, 1100);
  }

  showResult(quest) {
    this.idleView.classList.add("hidden");
    this.resultView.classList.remove("hidden");

    se.playFanfare(quest.rarity);

    // UR/SSR時は紙吹雪！
    if (quest.rarity === "UR" || quest.rarity === "SSR") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // レア度に応じたバッジ色とスタイル
    const rarityColors = {
      N: "bg-[#E5DFD7] text-[#4A423C] border-[#2B231D]",
      R: "bg-[#7CD5FF] text-[#113B56] border-[#2B231D]",
      SR: "bg-[#FFDA55] text-[#523B00] border-[#2B231D]",
      SSR: "bg-[#FF7BB0] text-[#540B28] border-[#2B231D]",
      UR: "rarity-ur text-white border-[#2B231D] shadow-[0_0_15px_rgba(255,107,107,0.6)]"
    };

    const isAlreadyCompleted = this.completedQuests.some(q => q.id === quest.id);

    this.resultView.innerHTML = `
      <div id="questCardCapture" class="relative bg-white border-3 border-[#2B231D] rounded-3xl p-6 sm:p-7 shadow-[8px_8px_0_#2B231D] overflow-hidden">
        
        <!-- Stamp container -->
        <div id="stampContainer" class="absolute right-4 bottom-16 pointer-events-none z-20 ${isAlreadyCompleted ? '' : 'hidden'}">
          <div class="stamp-anim px-4 py-1.5 border-4 border-[#FF3838] text-[#FF3838] font-black text-xl rounded-xl rotate-[-12deg] tracking-widest bg-white/90 shadow-lg">
            達成済み！
          </div>
        </div>

        <!-- Top Rarity & Category -->
        <div class="flex items-center justify-between border-b-2 border-[#2B231D] pb-3 mb-4">
          <div class="flex items-center gap-2">
            <span class="px-3 py-1 rounded-xl text-xs font-black border-2 ${rarityColors[quest.rarity]} shadow-[2px_2px_0_#2B231D]">
              ${quest.rarity}
            </span>
            <span class="text-xs font-extrabold text-[#75665D]">【${quest.category}】</span>
          </div>
          <div class="text-xs font-black text-amber-500">
            難易度: ${quest.difficulty}
          </div>
        </div>

        <!-- Quest Icon & Title -->
        <div class="text-center my-3">
          <div class="text-5xl mb-3 select-none transform hover:scale-110 transition-transform inline-block">
            ${quest.icon}
          </div>
          <h2 class="text-lg sm:text-xl font-black text-[#2B231D] leading-snug tracking-tight">
            ${quest.title}
          </h2>
        </div>

        <!-- Quest Comment / Meaning -->
        <div class="my-4 p-3.5 bg-[#FFF9E6] border-2 border-[#2B231D] rounded-2xl text-xs sm:text-sm font-bold text-[#57493E] leading-relaxed shadow-[2px_2px_0_#2B231D]">
          <span class="block text-[11px] font-black text-[#FF5A5F] mb-1">💡 クエストの意義：</span>
          ${quest.comment}
        </div>

        <!-- Quest Rewards -->
        <div class="flex items-center justify-between bg-[#F5F2EB] border-2 border-[#2B231D] rounded-xl px-4 py-2.5 text-xs font-black mb-1">
          <span class="text-[#69584E]">達成報酬</span>
          <span class="text-[#FF5A5F] flex items-center gap-1">
            <span>✨</span>
            <span>+${quest.exp} EXP 獲得</span>
          </span>
        </div>

      </div>

      <!-- Result Action Buttons -->
      <div class="mt-5 space-y-2.5">
        <!-- Complete Button -->
        <button id="completeBtn" class="w-full py-3.5 px-6 rounded-2xl ${isAlreadyCompleted ? 'bg-[#DCD4CA] text-[#75685E] border-2 border-[#A8988C] cursor-default' : 'bg-[#43B581] hover:bg-[#3AA373] text-white border-3 border-[#2B231D] shadow-[0_5px_0_#267551] active:translate-y-1 active:shadow-[0_0px_0_#267551]'} font-black text-base transition-all flex items-center justify-center gap-2">
          <i data-lucide="check-circle" class="w-5 h-5"></i>
          <span>${isAlreadyCompleted ? '達成済みです！' : 'この生きる意味を達成した！'}</span>
        </button>

        <div class="grid grid-cols-2 gap-2">
          <!-- Re-spin Button -->
          <button id="respinBtn" class="py-3 px-4 rounded-2xl bg-white border-2 border-[#2B231D] text-[#2B231D] font-black text-xs sm:text-sm shadow-[3px_3px_0_#2B231D] hover:bg-amber-50 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5">
            <i data-lucide="rotate-ccw" class="w-4 h-4 text-[#FF5A5F]"></i>
            <span>別の意味を引く</span>
          </button>

          <!-- Share Button -->
          <button id="shareResultBtn" class="py-3 px-4 rounded-2xl bg-white border-2 border-[#2B231D] text-[#2B231D] font-black text-xs sm:text-sm shadow-[3px_3px_0_#2B231D] hover:bg-amber-50 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5">
            <i data-lucide="share-2" class="w-4 h-4 text-sky-500"></i>
            <span>友達に見せる</span>
          </button>
        </div>

        <!-- Download Card as Image -->
        <button id="downloadCardBtn" class="w-full py-2.5 px-4 rounded-xl bg-transparent text-[#7D6B60] hover:text-[#2B231D] font-black text-xs flex items-center justify-center gap-1.5 transition-colors">
          <i data-lucide="download" class="w-3.5 h-3.5"></i>
          <span>このクエストをお守り画像として保存</span>
        </button>
      </div>
    `;

    lucide.createIcons();

    // イベント設定
    const completeBtn = document.getElementById("completeBtn");
    if (!isAlreadyCompleted) {
      completeBtn.addEventListener("click", () => this.completeQuest(quest));
    }

    document.getElementById("respinBtn").addEventListener("click", () => {
      se.playBeep(480, "sine");
      this.resultView.classList.add("hidden");
      this.idleView.classList.remove("hidden");
    });

    document.getElementById("shareResultBtn").addEventListener("click", () => {
      se.playBeep(520, "sine");
      const text = `今日の私の生きる意味は【${quest.title}】(${quest.rarity})でしたwww\n#人生のサブクエストガチャ`;
      const url = window.location.href;

      if (navigator.share) {
        navigator.share({ title: "人生のサブクエストガチャ", text, url }).catch(() => {});
      } else {
        navigator.clipboard.writeText(`${text}\n${url}`);
        alert("テキストをコピーしました！友達とのLINEやXに貼り付けてみてね！");
      }
    });

    document.getElementById("downloadCardBtn").addEventListener("click", () => {
      se.playBeep(520, "sine");
      const cardEl = document.getElementById("questCardCapture");
      html2canvas(cardEl, { scale: 2, backgroundColor: null }).then(canvas => {
        const link = document.createElement("a");
        link.download = `生きる意味クエスト_${quest.rarity}_${quest.title.slice(0, 10)}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      });
    });
  }

  completeQuest(quest) {
    se.playSuccess();

    // 経験値加算
    this.userExp += quest.exp;
    this.completedQuests.push({
      ...quest,
      completedAt: new Date().toLocaleDateString("ja-JP")
    });

    localStorage.setItem("sq_completed", JSON.stringify(this.completedQuests));
    this.updatePlayerStatus();

    // スタンプ表示 & 紙吹雪
    const stamp = document.getElementById("stampContainer");
    stamp.classList.remove("hidden");

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 }
    });

    // ボタンの見た目更新
    const completeBtn = document.getElementById("completeBtn");
    completeBtn.className = "w-full py-3.5 px-6 rounded-2xl bg-[#DCD4CA] text-[#75685E] border-2 border-[#A8988C] font-black text-base cursor-default flex items-center justify-center gap-2";
    completeBtn.innerHTML = `<span>達成済みです！ (+${quest.exp} EXP)</span>`;
  }

  openCollectionModal() {
    se.playBeep(440, "sine");
    this.collectionModal.classList.remove("hidden");

    if (this.completedQuests.length === 0) {
      this.collectionList.innerHTML = `
        <div class="text-center py-10 text-[#8C7A6F]">
          <p class="text-3xl mb-2">📦</p>
          <p class="font-bold text-sm">まだ達成したクエストがありません！</p>
          <p class="text-xs mt-1">ガチャを回して今日の生きる意味をクリアしよう。</p>
        </div>
      `;
      return;
    }

    this.collectionList.innerHTML = this.completedQuests.map((q, idx) => `
      <div class="p-3 bg-[#FAF7EE] border-2 border-[#2B231D] rounded-xl flex items-center justify-between gap-2 shadow-[2px_2px_0_#2B231D]">
        <div class="flex items-center gap-2 overflow-hidden">
          <span class="text-2xl flex-shrink-0">${q.icon}</span>
          <div class="truncate">
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] font-black px-1.5 py-0.5 rounded border border-[#2B231D] bg-white">${q.rarity}</span>
              <span class="text-xs font-black text-[#2B231D] truncate">${q.title}</span>
            </div>
            <span class="text-[10px] text-[#8C7B71]">${q.completedAt} 達成</span>
          </div>
        </div>
        <span class="text-xs font-black text-emerald-600 flex-shrink-0">済</span>
      </div>
    `).reverse().join("");
  }
}

// 起動
window.addEventListener("DOMContentLoaded", () => {
  new SubquestApp();
});
