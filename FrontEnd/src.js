'use strict';
/* ═══════════════════════════════════════════════════════════════
   SIMORGH — شورای مدیریت هوشمند · موتور دمو (بدون بک‌اند)
   ساختار: helpers → data → scheduler → renderers → session engine
           → interactions (panel / challenges / composer / drawers)
   ═══════════════════════════════════════════════════════════════ */
const $  = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
const fa = n => Number(n).toLocaleString('fa-IR');
const fa2 = n => String(n).padStart(2, '0').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const G  = window.gsap || null;

/* ═══ داده اعضا ═══ */
const AGENTS = {
  finance: {
    fa: 'مالی', en: 'FINANCE', ac: '#2563eb', soft: '#e5eefc', strong: '#1e40af', align: true,
    icon: '<svg viewBox="0 0 24 24"><path d="M4 19h16"/><path d="M6 19v-6M11 19V6M16 19v-9M21 19v-4"/></svg>',
    bubble: 'ارزش‌گذاری پیشنهادی، شرکت را حدود ۳٫۲ برابر درآمد سال گذشته قیمت‌گذاری می‌کند؛ در کران پایینِ بازار.',
    headline: 'واگذاری ۲۰٪ فقط در ازای سرمایه‌ای که حداقل ۲۴ ماه Runway بسازد منصفانه است؛ پیشنهاد فعلی بیش از نیاز ۱۸ ماه آینده است.',
    args: [
      { angle: 'ارزش‌گذاری', claim: 'ارزش‌گذاری Pre-money در حد ۱۸ تا ۲۲ میلیارد تومان قابل دفاع است', because: 'درآمد فعلی و رشد کاربران مبنای مقایسه با معاملات مشابه را می‌سازد', evidence: ['صورت مالی سال گذشته', 'متریک‌های رشد'] },
      { angle: 'دیلوشن', claim: 'واگذاری ۲۰٪ بیش از نیاز واقعی سرمایه ۱۸ ماه آینده است', because: 'بودجه توسعه و فروش در سناریوی پایه کمتر از مبلغ پیشنهادی است', evidence: ['بودجه ۱۸ ماه'] },
      { angle: 'Runway', claim: 'سرمایه دریافتی باید حداقل ۲۴ ماه Runway بسازد', because: 'جذب بعدی باید از موضع رشد و با ارزش‌گذاری بهتر انجام شود', evidence: ['مدل مالی سه‌ساله'] }
    ],
    risks: ['پذیرش ارزش‌گذاری پایین، کران مذاکرات بعدی را هم پایین می‌آورد.'],
    conds: [],
    react: 'ملاحظه ارزش‌گذاری شما در مدل مالی لحاظ شد.'
  },
  strategy: {
    fa: 'استراتژی', en: 'STRATEGY', ac: '#d97706', soft: '#fdf0dc', strong: '#92400e', align: true,
    icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.6"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/></svg>',
    bubble: 'مقایسه سناریوهای جذب نشان می‌دهد سرمایه مرحله‌ای با واگذاری ۱۰ تا ۱۵٪ بهینه است.',
    headline: 'سناریوی D (سرمایه مرحله‌ای بر Milestone) بیشترین ارزش مالکیت را حفظ می‌کند؛ سناریوی A فقط با ارزش غیرمالی قوی قابل دفاع است.',
    args: [
      { angle: 'سناریوها', claim: 'مقایسه A تا D نشان می‌دهد مذاکره مجدد بر پذیرش فعلی می‌چربد', because: 'با فازبندی بر Milestone، سرمایه بیشتری با دیلوشن کمتر جذب می‌شود', evidence: ['ماتریس سناریوها'] },
      { angle: 'ارزش غیرمالی', claim: 'معرفی مشتری و شبکه شتابدهنده فقط در سناریوی A فعال می‌شود', because: 'تعهد غیرمالی، بخشی از دیلوشن اضافی را جبران می‌کند', evidence: ['سابقه پورتفوی شتابدهنده'] },
      { angle: 'مسیر مستقل', claim: 'سناریوی B رشد را کند اما کنترل را کامل نگه می‌دارد', because: 'درآمد مشتری بخشی از هزینه توسعه را پوشش می‌دهد', evidence: ['پیش‌بینی درآمد ۱۲ ماه'] }
    ],
    risks: ['اگر رشد سه ماه آینده کند شود، قدرت مذاکره افت می‌کند.'],
    conds: [],
    challengeOf: 'ops',
    challengeTxt: 'نیاز فوری به سرمایه، پذیرش بدون قید و شرط ارزش‌گذاری را توجیه نمی‌کند.',
    challengeWhy: 'بخش عمده نیاز سرمایه با درآمد مشتری و فاز بعدی فروش قابل تأمین است؛ بنابراین می‌توان برای ۱۰ تا ۱۵٪ یا ساختار مرحله‌ای مذاکره کرد.',
    challengeEv: ['پیش‌بینی درآمد ۱۲ ماه', 'ماتریس سناریوها'],
    react: 'فرضیه شما به سناریوهای استراتژیک اضافه شد.'
  },
  hr: {
    fa: 'منابع انسانی', en: 'HR', ac: '#7c3aed', soft: '#f0e9fd', strong: '#5b21b6', align: true,
    icon: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.5-3.4 2.6-5.2 5.5-5.2S14 15.6 14.5 19"/><circle cx="17" cy="9.5" r="2.4"/><path d="M15.5 14.6c2.7.2 4.4 1.7 5 4.4"/></svg>',
    bubble: 'سرمایه تازه باید ابتدا جذب نقش‌های کلیدی فنی و فروش را حل کند؛ جاذبه شرکت پس از سرمایه‌گذاری بالاتر می‌رود.',
    headline: 'برای Scale، جذب ۶ متخصص کلیدی و شفافیت Option Pool ۱۰٪ پیش از بستن قرارداد ضروری است.',
    args: [
      { angle: 'استخدام', claim: '۳ نقش مهندسی و ۳ نقش فروش برای Scale لازم است', because: 'ظرفیت فعلی تیم پاسخ‌گوی نقشه راه ۱۸ ماه نیست', evidence: ['نقشه راه تیم'] },
      { angle: 'Option Pool', claim: 'استخراج Option Pool از سهم مؤسس، نه از سهم سرمایه‌گذار', because: 'در غیر این صورت دیلوشن پنهان به مؤسس تحمیل می‌شود', evidence: ['پیش‌نویس Term Sheet'] },
      { angle: 'نگهداشت مؤسس', claim: 'مالکیت مؤسس پس از معامله باید بالای ۶۰٪ باقی بماند', because: 'انگیزه ادامه مسیر و کنترل جهت‌گیری شرکت به آن وابسته است', evidence: ['تراز سهام پس از معامله'] }
    ],
    risks: ['خروج حتی یک بنیان‌گذار در سال اول، منطق ارزش‌گذاری را بی‌اعتبار می‌کند.'],
    conds: [],
    react: 'نظر شما با برنامه نیروی انسانی تقاطع‌سنجی شد.'
  },
  ops: {
    fa: 'عملیات', en: 'OPERATIONS', ac: '#0891b2', soft: '#e0f4f9', strong: '#155e75', align: true,
    icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.1"/><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6 6l2.1 2.1M15.9 15.9L18 18M18 6l-2.1 2.1M8.1 15.9L6 18"/></svg>',
    bubble: 'زمان‌بندی تزریق سرمایه با نقشه راه محصول هم‌تراز نیست؛ دو فاز اجرا باید از هم جدا شوند.',
    headline: 'تزریق یک‌جای سرمایه، مصرف را از Milestone جدا می‌کند؛ فازبندی بر اساس تحویل نسخه‌های محصول لازم است.',
    args: [
      { angle: 'مصرف سرمایه', claim: '۶۰٪ سرمایه به توسعه محصول و ۴۰٪ به فروش تعلق دارد', because: 'گلوگاه فعلی Scale، ظرفیت تیم فنی و قیف فروش است', evidence: ['نقشه راه محصول', 'قیف فروش'] },
      { angle: 'زمان‌بندی', claim: 'تزریق در دو فاز ۶ماهه منطقی‌تر است', because: 'با Milestone نسخه ۲ و ورود به بازار هم‌تراز می‌شود', evidence: ['نقشه Milestone'] },
      { angle: 'زیرساخت', claim: 'بخشی از سرمایه باید ابر و پشتیبانی مشتری را تقویت کند', because: 'رشد کاربر بدون آن کیفیت سرویس را پایین می‌آورد', evidence: ['متریک‌های SLO'] }
    ],
    risks: ['تزریق یک‌جا، ریسک مصرف بی‌انضباط را بالا می‌برد.'],
    conds: [],
    react: 'فرضیه شما با برنامه اجرا بررسی می‌شود.'
  },
  legal: {
    fa: 'حقوقی', en: 'LEGAL', ac: '#64748b', soft: '#eceff3', strong: '#334155', align: false,
    icon: '<svg viewBox="0 0 24 24"><path d="M12 4v16M8.5 20h7M4.5 7h15"/><path d="M6.5 7l-2.4 4.8a2.7 2.7 0 005 0L6.5 7zM17.5 7l-2.4 4.8a2.7 2.7 0 005 0L17.5 7z"/></svg>',
    bubble: 'سه‌گانه کنترل — حق رأی، کرسی هیئت‌مدیره و حق وتو — باید پیش از قیمت بسته شود.',
    headline: 'Drag-along، Liquidation Preference ۲× و حق وتوی گسترده، پرهزینه‌ترین بندهای Term Sheet پیشنهادی هستند.',
    args: [
      { angle: 'کنترل', claim: 'حق وتو باید فقط به امور کلیدی محدود شود', because: 'وتوی گسترده چابکی تصمیم‌گیری شرکت را از بین می‌برد', evidence: ['پیش‌نویس Term Sheet'] },
      { angle: 'خروج', claim: 'Liquidation Preference باید ۱× و بدون شرکت‌کننده باشد', because: 'ترکیب ۲× با Drag-along خروج مؤسس را غیرممکن می‌کند', evidence: ['بنچمارک Term Sheet منطقه'] },
      { angle: 'مالکیت فکری', claim: 'تمام IP — کدهای OrgOS، مدل‌ها و Engineها — باید صریحاً به شرکت تعلق گیرد', because: 'سرمایه‌گذار نباید مالکیت مستقیمی جز آنچه قرارداد تعیین می‌کند داشته باشد', evidence: ['سند انتقال IP', 'مدارک ثبتی'] }
    ],
    risks: ['بند Drag-along در وضعیت ضعف، واگذاری اجباری کل شرکت را ممکن می‌کند.'],
    conds: ['بازبینی حقوقی کامل Term Sheet پیش از امضا', 'الحاقیه صریح انتقال IP به شرکت'],
    react: 'نکته شما در ملاحظات حقوقی ثبت شد.'
  }
};
const ORDER = ['finance', 'strategy', 'hr', 'ops', 'legal'];
const CHALLENGE = { from: 'strategy', to: 'ops', txt: AGENTS.strategy.challengeTxt };

/* ═══ پرونده تصمیم (هاردکد — قابل ورود از کمپوزر) ═══ */
const CASE_FILE = {
  id: 'INV-2026-012',
  title: 'بررسی پیشنهاد سرمایه‌گذاری در ازای واگذاری سهام',
  company: 'سیمرغ هوش‌افزار',
  investor: 'شتابدهنده / هلدینگ پیشنهاددهنده',
  stake: 'حدود ۲۰٪',
  goal: 'تأمین سرمایه برای توسعه محصول، تیم، فروش و Scale شرکت',
  sections: [
    { k: 'ارزش‌گذاری', items: ['ارزش‌گذاری پیش از سرمایه‌گذاری', 'ارزش‌گذاری پس از سرمایه‌گذاری', 'آیا ۲۰٪ سهام در برابر سرمایه پیشنهادی منصفانه است؟'] },
    { k: 'ساختار سهام', items: ['چه کسی دقیقاً چه درصدی را واگذار می‌کند؟', 'کسری از سهم مؤسس یا افزایش سرمایه؟', 'درخواست سهام ترجیحی توسط سرمایه‌گذار؟'] },
    { k: 'کنترل شرکت', items: ['حق رأی', 'کرسی هیئت‌مدیره', 'حق وتو', 'حق دخالت در مدیریت', 'محدودیت فروش یا انتقال سهام'] },
    { k: 'تعهدات سرمایه‌گذار', items: ['مبلغ و زمان‌بندی تزریق سرمایه', 'معرفی مشتری', 'شبکه ارتباطی', 'پشتیبانی استخدام', 'زیرساخت', 'سرمایه‌گذاری‌های بعدی'] },
    { k: 'تعهدات سیمرغ', items: ['Milestoneهای مورد انتظار', 'نحوه مصرف سرمایه', 'گزارش‌دهی', 'محدودیت‌های مالی و عملیاتی'] },
    { k: 'ریسک‌های خروج', items: ['Drag-along / Tag-along', 'Buy-back', 'Liquidation Preference', 'حق فروش سهام سرمایه‌گذار', 'شرایط خروج مؤسس'] },
    { k: 'مالکیت فکری', items: ['IP شرکت، کدهای OrgOS، مدل‌ها و Engineها', 'محصولات فعلی و آینده', 'هیچ مالکیت مستقیمی برای سرمایه‌گذار جز آنچه صراحتاً در قرارداد آمده'] }
  ],
  scenarios: [
    { id: 'A', t: 'گرفتن سرمایه و واگذاری ۲۰٪', s: 'تعهد غیرمالی کامل سرمایه‌گذار فعال می‌شود اما دیلوشن بالا است' },
    { id: 'B', t: 'ادامه مستقل و رشد با درآمد مشتری', s: 'کنترل کامل می‌ماند اما رشد کندتر و ریسک نقدینگی بالاست' },
    { id: 'C', t: 'مذاکره برای درصد کمتر / سرمایه بیشتر', s: 'بهترین ارزش هر واحد دیلوشن، اگر قدرت مذاکره اجازه دهد' },
    { id: 'D', t: 'سرمایه مرحله‌ای بر اساس Milestone', s: 'ریسک طرفین را کم می‌کند؛ نیاز به انضباط گزارش‌دهی دارد' }
  ],
  mainQ: 'آیا واگذاری حدود ۲۰٪ از سهام سیمرغ هوش‌افزار در شرایط پیشنهادی — با توجه به ارزش فعلی شرکت، پتانسیل OrgOS، سرمایه موردنیاز، ارزش غیرمالی سرمایه‌گذار و هزینه فرصت از دست دادن مالکیت — تصمیم اقتصادی و استراتژیک مناسبی است؟',
  followUp: 'اگر بتوان همین سرمایه را با واگذاری ۱۰ تا ۱۵٪ یا با ساختار مرحله‌ای جذب کرد، آیا پیشنهاد فعلی باید رد یا مذاکره مجدد شود؟'
};

const TOPIC_DEMO = CASE_FILE.mainQ;
const SYNTH_PARTIAL = 'تا این لحظه، اکثریت شورا واگذاری ۲۰٪ در شرایط فعلی را مشروط به بازساخت معامله می‌داند؛ اختلاف اصلی بر سر ساختار جذب است.';
const SYNTH_FINAL = 'واگذاری ۲۰٪ در شرایط فعلی توصیه نمی‌شود؛ همان سرمایه با ساختار مرحله‌ای بر Milestone و واگذاری ۱۰ تا ۱۵٪ قابل جذب است.';

/* ═══ گزارش نهایی شورا (گزارش + پیشنهاد) ═══ */
const FREC = {
  conf: 84,
  report: [
    { k: 'نتیجه کلی', t: '۴ از ۵ عضو پیشنهاد فعلی را در شکل حاضر تأیید نمی‌کنند؛ محور اختلاف، ارزش‌گذاری و ساختار کنترل است نه اصل جذب سرمایه.' },
    { k: 'اجماع‌ها', t: 'همه اعضا بر لزوم Runway ۲۴ ماهه، محدودسازی حق وتو، Option Pool از سهم مؤسس و انتقال صریح IP به شرکت اجماع دارند.' },
    { k: 'اختلاف‌ها', t: 'استراتژی واگذاری ۲۰٪ را با تعهد غیرمالی قابل مذاکره می‌داند؛ حقوقی ریسک Drag-along و Liquidation Preference ۲× را تعیین‌کننده می‌داند.' },
    { k: 'مقایسه سناریوها', t: 'سناریوی D (مرحله‌ای بر Milestone) بیشترین حفظ مالکیت را دارد؛ سناریوی C در مذاکره، بالاترین ارزش واحد دیلوشن را می‌سازد.' }
  ],
  rec: 'مذاکره مجدد: جذب همان سرمایه با ساختار مرحله‌ای و واگذاری ۱۰ تا ۱۵٪ — رد پیشنهاد در شکل حاضر',
  acts: [
    { t: 'پاسخ متقابل مکتوب به Term Sheet با دیل ۱۰–۱۵٪ مرحله‌ای', when: 'now',  w: 'اقدام فوری' },
    { t: 'مدل مالی Runway ۲۴ ماهه و سقف مصرف فاز اول', when: 'd30', w: '۳۰ روز' },
    { t: 'بازنگری ارزش‌گذاری پس از بستن ۲ قرارداد فروش جدید', when: 'd90', w: '۹۰ روز' }
  ]
};

/* تحلیل عمومی برای موضوعات دلخواه مدیرعامل (شبیه‌سازی محلی) */
function genAnalyses(topic) {
  let h = 7; for (const c of topic) h = (h * 31 + c.charCodeAt(0)) % 9973;
  const pick = (a, i) => a[(h + i) % a.length];
  const T = topic.length > 38 ? topic.slice(0, 38) + '…' : topic;
  const mk = (k, headline, args, risks, conds) => ({
    bubble: headline, headline, args, risks, conds, align: pick([true, true, false], k.length).valueOf() && (h + k.length) % 5 !== 4,
    conf: .62 + ((h + k.length * 7) % 26) / 100,
    react: 'نظر شما در تحلیل تازه لحاظ می‌شود.'
  });
  return {
    finance: mk('finance', `از منظر مالی، «${T}» نیازمند مدل جریان نقدی شفاف است`, [
      { angle: 'جریان نقدی', claim: 'فشار نقدینگی در فاز اجرا', because: 'هزینه‌ها زودتر از بازگشت اثر می‌کنند', evidence: ['صورت جریان نقدی'] },
      { angle: 'بازگشت سرمایه', claim: 'بازگشت در افق قابل قبول', because: 'بهره‌وری تدریجی جریان ورودی می‌سازد', evidence: ['طرح توجیهی'] }], ['نوسان هزینه‌های اجرا'], []),
    strategy: mk('strategy', `از منظر استراتژیک، «${T}» با اهداف رشد هم‌راستاست`, [
      { angle: 'بازار', claim: 'پنجره فرصت محدود است', because: 'تأخیر، جایگاه رقابتی را تضعیف می‌کند', evidence: ['تحلیل رقبا'] },
      { angle: 'هم‌راستایی', claim: 'سو با نقشه راه سال', because: 'با اهداف کمّی سازمان هم‌پوشانی دارد', evidence: ['OKR سازمان'] }], ['پراکندگی تمرکز تیم‌ها'], []),
    hr: mk('hr', `از نظر منابع انسانی، «${T}» به توانمندسازی تیم وابسته است`, [
      { angle: 'مهارت', claim: 'نیاز به آموزش بخشی از تیم', because: 'اجرا به مهارت جدید وابسته است', evidence: ['ماتریس مهارت'] },
      { angle: 'بار کاری', claim: 'توزیع بار باید بازطراحی شود', because: 'از فرسودگی تیم جلوگیری می‌کند', evidence: ['کارکرد اخیر'] }], ['مقاومت در برابر تغییر'], []),
    ops: mk('ops', `از زاویه عملیات، «${T}» باید با ظرفیت واقعی سنجیده شود`, [
      { angle: 'ظرفیت', claim: 'بالانس بار و ظرفیت فعلی', because: 'از گلوگاه جدید جلوگیری می‌کند', evidence: ['داشبورد عملیات'] },
      { angle: 'فرایند', claim: 'به‌روزرسانی فرایندهای پشتیبان', because: 'اجرای پایدار بدون فرایند ممکن نیست', evidence: ['نقشه فرایندها'] }], ['اختلال موقتی در استقرار'], []),
    legal: mk('legal', `از منظر حقوقی، «${T}» نیازمند بازبینی تعهدات است`, [
      { angle: 'قراردادها', claim: 'بازبینی تعهدات مرتبط', because: 'ریسک تعارض یا جریمه وجود دارد', evidence: ['آرشیو قراردادها'] },
      { angle: 'انطباق', claim: 'الزامات نظارتی شناسایی شد', because: 'عدم انطباق ریسک توقف می‌سازد', evidence: ['فهرست الزامات'] }], ['ابهام در شروط طرف مقابل'], [])
  };
}

/* ═══ زمان‌بند قابل توقف (Pause / Continue) ═══ */
const sched = {
  ev: [], elapsed: 0, timer: null, running: false,
  at(ms, fn) { this.ev.push({ at: this.elapsed + ms / speedF(), fn }); this.ev.sort((a, b) => a.at - b.at); },
  play() {
    if (this.running) return; this.running = true;
    this.timer = setInterval(() => {
      this.elapsed += 100;
      const due = this.ev.filter(e => e.at <= this.elapsed);
      this.ev = this.ev.filter(e => e.at > this.elapsed);
      due.forEach(e => e.fn());
      if (!this.ev.length) this.pause();
    }, 100);
  },
  pause() { this.running = false; clearInterval(this.timer); },
  clear() { this.pause(); this.ev = []; this.elapsed = 0; }
};
let speedF = () => ({ 1: .62, 3: 1, 5: 1.45, 10: 2.1 })[state.mult] || 1;

/* ═══ وضعیت جلسه ═══ */
const state = {
  phase: 'idle',        // idle | run | done
  paused: false,
  mult: 3,
  topic: TOPIC_DEMO,
  analyses: null,
  done: {},             // id → analysis
  challengeSeen: false,
  synthShown: false
};

/* ═══ عناصر ═══ */
const members = {};     // id → { root, st, bub, mini }

/* ═══ ساخت اعضا ═══ */
function buildAgents() {
  $('#agents').innerHTML = ORDER.map(id => {
    const a = AGENTS[id];
    return `<button class="member" data-id="${id}" style="--ac:${a.ac};--ac-soft:${a.soft};--ac-strong:${a.strong}" aria-label="${a.fa} — مشاهده تحلیل">
      <span class="av">${a.icon}<i class="ring"></i><i class="dotst"></i></span>
      <span class="mtxt">
        <span class="nm">${a.fa}<b>${a.en}</b></span>
        <span class="st"><i class="sdot"></i><span class="stx">در انتظار</span></span>
        <span class="bub"></span>
        <span class="mini"><i></i></span>
      </span>
      <span class="chmark" hidden>۱</span>
    </button>`;
  }).join('');
  ORDER.forEach(id => {
    const root = $(`.member[data-id="${id}"]`);
    members[id] = { root, st: root.querySelector('.stx'), bub: root.querySelector('.bub'), mini: root.querySelector('.mini i') };
    root.addEventListener('click', e => {
      if (e.target.closest('.chmark')) { e.stopPropagation(); openChalPop(CHALLENGE, root.getBoundingClientRect()); return; }
      openPanel(id);
    });
  });
}

const STATUS_FA = { idle: 'در انتظار', thinking: 'فکر می‌کند…', analyzing: 'تحلیل می‌کند…', speaking: 'در حال ارائه', listening: 'گوش می‌دهد', completed: 'کامل شد' };
function setStatus(id, st) {
  const m = members[id];
  m.st.textContent = STATUS_FA[st] || st;
  m.root.classList.remove('thinking', 'analyzing', 'speaking', 'listening', 'completed');
  if (st !== 'idle') m.root.classList.add(st);
}

/* سطر لاگ — صورت جلسه و جریان موبایل */
function log(kind, who, txt) {
  const a = who ? AGENTS[who] : null;
  const kindFa = { op: 'تحلیل', ch: 'چالش', syn: 'جمع‌بندی', ceo: 'مدیرعامل', q: 'پرسش' }[kind];
  const head = a
    ? `<span class="avatar" style="--ac:${a.ac};--ac-soft:${a.soft};--ac-strong:${a.strong}">${a.icon}</span><b>${a.fa}</b><span class="tag">${a.en}</span>`
    : `<b>مدیرعامل</b>`;
  const html = `<div class="logrow"><div class="lr-h">${head}<span class="kind ${kind}">${kindFa}</span></div><p>${txt}</p></div>`;
  $('#logDesk').insertAdjacentHTML('beforeend', html);
  $('#logMobile').insertAdjacentHTML('beforeend', html);
  if (G) G.from(`#logDesk .logrow:last-child, #logMobile .logrow:last-child`, { y: 6, opacity: 0, duration: .3, ease: 'power2.out' });
}

/* هشدار دیداری روی فریم عضو — هنگام ارائه یا اشاره به او */
function flashFrame(id, color) {
  const m = members[id]; if (!m) return;
  if (G) {
    G.fromTo(m.root, { boxShadow: `0 0 0 3px ${color || 'rgba(37,99,235,.45)'}` },
      { boxShadow: '0 1px 2px rgba(16,24,40,.05)', duration: 1.4, ease: 'power2.out', clearProps: 'boxShadow' });
  }
}
const wireToCore = id => flashFrame(id);

/* ═══ جمع‌بندی (ستون کناری) ═══ */
function setConclusion(txt, align, conf) {
  const t = $('#ccTxt');
  t.classList.add('dim');
  setTimeout(() => {
    t.textContent = txt; t.classList.remove('dim');
    if (G) G.from(t, { y: 4, opacity: 0, duration: .35, ease: 'power2.out' });
  }, 220);
  $('#ccStats').hidden = false; $('#ccLive').hidden = state.phase !== 'run';
  if (align != null) {
    [...$('#ccDots').children].forEach((d, i) => d.classList.toggle('on', i < align));
    $('#ccAlign').textContent = fa(align) + '/۵';
  }
  if (conf != null) { $('#ccBar').style.width = conf + '%'; $('#ccConf').textContent = fa(conf) + '٪'; }
}

/* ═══ موتور جلسه ═══ */
function runCouncil(topic, analyses) {
  sched.clear();
  Object.assign(state, { phase: 'run', paused: false, topic, analyses, done: {}, challengeSeen: false, synthShown: false });
  $('#topicTxt').textContent = topic;
  $('#ccTxt').textContent = 'اعضای شورا موضوع را بررسی می‌کنند…';
  $('#ccStats').hidden = true; $('#ccLive').hidden = false;
  $('#ceoChip').hidden = true; $('#frec').hidden = true; $('#frecPill').hidden = true;
  $('#chalDock').innerHTML = '';
  $('#logDesk').innerHTML = ''; $('#logMobile').innerHTML = '';
  ORDER.forEach(id => {
    const m = members[id];
    m.bub.textContent = ''; m.mini.style.width = '0%';
    m.root.querySelector('.chmark').hidden = true;
    setStatus(id, 'thinking');
  });
  badge('run', 'شورا در حال تحلیل'); setPauseIco(true);
  log('q', null, topic);
  toast('پنج عضو شورا موضوع را هم‌زمان تحلیل می‌کنند');

  /* STATE ۲..۶ — شروع تدریجی اعضا */
  const starts = { finance: 1400, strategy: 2800, hr: 4200, ops: 5600, legal: 7000 };
  ORDER.forEach((id, i) => {
    const t = starts[id];
    sched.at(t - 500, () => { setStatus(id, 'analyzing'); if (state.mult >= 5) members[id].mini.style.width = '45%'; });
    sched.at(t, () => speak(id));
  });

  /* STATE ۷ — چالش استراتژی → عملیات */
  sched.at(8600, () => {
    state.challengeSeen = true;
    flashFrame('ops', 'rgba(220,38,38,.4)');
    flashFrame('strategy', 'rgba(220,38,38,.4)');
    members.ops.root.querySelector('.chmark').hidden = false;
    renderChallenge();
    log('ch', 'strategy', CHALLENGE.txt);
    toast('استراتژی تحلیل عملیات را به چالش کشید');
    members.strategy.root.classList.add('speaking');
    sched.at(1800, () => { if (state.phase === 'run') setStatus('strategy', 'completed'); });
  });

  /* STATE ۸ — به‌روزرسانی جمع‌بندی */
  sched.at(9600, () => {
    state.synthShown = true;
    setConclusion(SYNTH_PARTIAL, 4, 74);
    log('syn', null, SYNTH_PARTIAL);
  });

  /* STATE ۹ — توصیه نهایی */
  sched.at(11200, showFrec);
  sched.play();
}

function speak(id) {
  if (state.phase !== 'run' || state.done[id]) return;
  const a = state.analyses[id];
  setStatus(id, 'speaking');
  wireToCore(id);
  const m = members[id];
  m.bub.textContent = a.bubble;
  if (G) G.from(m.bub, { y: 6, opacity: 0, duration: .35, ease: 'power2.out' });
  m.mini.style.width = '55%';
  log('op', id, a.bubble);
  sched.at(1500, () => complete(id, a));
}

function complete(id, a) {
  if (state.phase !== 'run') return;
  state.done[id] = a;
  setStatus(id, 'completed');
  members[id].mini.style.width = '100%';
  const n = Object.keys(state.done).length;
  /* جمع‌بندی تدریجی */
  if (n < 5) {
    const align = ORDER.filter(k => state.done[k] && state.done[k].align !== false).length;
    const conf = Math.round(Object.values(state.done).reduce((s, x) => s + x.conf, 0) / n * 100);
    setConclusion(partialSynth(n, align), align, conf);
  }
}

function partialSynth(n, align) {
  const parts = [];
  if (state.done.finance) parts.push('ارزش‌گذاری و Runway ۲۴ ماهه');
  if (state.done.strategy) parts.push('بهترین سناریوی جذب');
  if (state.done.ops) parts.push('فازبندی تزریق سرمایه');
  if (state.done.hr) parts.push('سازوکار تیم و Option Pool');
  if (state.done.legal) parts.push('بندهای کنترل و خروج');
  return `${fa(n)} عضو جمع‌بندی کردند: کلید تصمیم در ${parts.join('، ')} است —${align >= 4 ? ' شواهد هم‌راستاست.' : ' همچنان شواهد هم‌راستا نیست.'}`;
}

function showFrec() {
  if (state.phase !== 'run') return;
  state.phase = 'done';
  badge('done', 'شورا تکمیل شد'); setPauseIco(false);
  $('#ccLive').hidden = true;
  setConclusion(SYNTH_FINAL, 4, FREC.conf);
  log('syn', null, SYNTH_FINAL);
  /* گزارش تحلیل */
  $('#frReport').innerHTML = FREC.report.map(x =>
    `<div class="fr-row"><b>${x.k}</b><p>${x.t}</p></div>`).join('');
  /* پیشنهاد شورا */
  $('#frRec').textContent = FREC.rec;
  $('#frConf').textContent = fa(FREC.conf) + '٪';
  $('#frBar').style.width = FREC.conf + '%';
  $('#frActs').innerHTML = FREC.acts.map(x => `<li><span class="fa-t"><b>${x.t}</b><small>اقدام پیشنهادی شورا</small></span><span class="when ${x.when}">${x.w}</span></li>`).join('');
  $('#frSub').textContent = 'نشست #۱۲ · آماده اعمال';
  $('#frec').hidden = false; $('#frecPill').hidden = true;
  if (G) { G.from('#frec', { y: 16, opacity: 0, duration: .5, ease: 'power3.out' }); G.from('#frec li, #frec .fr-row', { y: 8, opacity: 0, duration: .35, stagger: .06, delay: .15 }); }
  toast('گزارش و پیشنهاد نهایی شورا آماده است');
}

/* ═══ چالش‌ها ═══ */
function renderChallenge() {
  const b = document.createElement('button');
  b.className = 'chal';
  b.innerHTML = `<span class="ci"><svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.3 4.2L2.8 17a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z"/></svg></span>
    <span class="ct"><b>${AGENTS.strategy.fa} → ${AGENTS.ops.fa}</b><span>${CHALLENGE.txt}</span></span>`;
  b.addEventListener('click', () => openChalPop(CHALLENGE, b.getBoundingClientRect()));
  $('#chalDock').appendChild(b);
  if (G) G.from(b, { x: 14, opacity: 0, duration: .4, ease: 'power3.out' });
}
function openChalPop(c, rect) {
  const p = $('#chalPop');
  p.innerHTML = `<div class="cph"><b>${AGENTS[c.from].fa}</b><span class="arrow">⬅ چالش برای</span><span class="tgt">${AGENTS[c.to].fa}</span>
      <button class="x" style="margin-inline-start:auto" aria-label="بستن">✕</button></div>
    <p>${c.txt}</p>
    <div class="cpev"><b>استدلال و شواهد</b><span>${AGENTS[c.from].challengeWhy}</span><span>📎 ${AGENTS[c.from].challengeEv.join(' · ')}</span></div>`;
  p.hidden = false;
  if (G) G.from(p, { y: 8, opacity: 0, scale: .96, duration: .28, ease: 'power3.out' });
  const w = 300, h = p.offsetHeight || 170, vw = innerWidth;
  let x = rect.left + rect.width / 2 - w / 2; x = Math.max(12, Math.min(x, vw - w - 12));
  let y = rect.top - h - 10; if (y < 64) y = rect.bottom + 10;
  p.style.left = x + 'px'; p.style.top = y + 'px';
  p.querySelector('.x').onclick = () => p.hidden = true;
}
document.addEventListener('click', e => {
  if (!e.target.closest('#chalPop') && !e.target.closest('.chal') && !e.target.closest('.chmark')) $('#chalPop').hidden = true;
});

/* ═══ پنل جزئیات عضو ═══ */
function openPanel(id) {
  const a = AGENTS[id], r = state.analyses ? state.analyses[id] : null, done = !!state.done[id];
  const head = `<div class="ap-head" style="--ac:${a.ac};--ac-soft:${a.soft};--ac-strong:${a.strong}">
      <span class="ap-av">${a.icon}</span>
      <span class="ap-tt"><b>${a.fa}</b><small>${a.en} · عضو شورا</small></span>
      <span class="ap-conf"><b>${done ? fa(Math.round(r.conf * 100)) + '٪' : '—'}</b><small>اطمینان</small></span>
      <button class="ap-x" id="apX" aria-label="بستن">✕</button>
    </div>`;
  let body;
  if (!done) {
    body = `<div class="ap-body"><div class="ap-sec">وضعیت</div>
      <p style="font-size:12.5px;line-height:2;color:var(--text2)">${a.fa} هنوز تحلیل خود را کامل نکرده است. پس از ارائه، استدلال‌ها و شواهد اینجا نمایش داده می‌شود.</p></div>`;
  } else {
    const chIn = id === CHALLENGE.to && state.challengeSeen
      ? `<div class="ap-sec">چالش دریافتی</div><div class="chrec">
          <div class="chrow"><div class="chh"><svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.3 4.2L2.8 17a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z"/></svg>${AGENTS[CHALLENGE.from].fa}</div><p>${CHALLENGE.txt}</p></div></div>`
      : '';
    body = `<div class="ap-body">
      <div class="ap-hl">${r.headline}</div>
      <div class="ap-sec">استدلال‌ها و شواهد</div>
      ${r.args.map(x => `<div class="arg"><div class="ah"><span class="angle">${x.angle}</span><span class="claim">${x.claim}</span></div>
        <div class="because"><b>چرا؟</b> ${x.because}</div>
        <div class="evs">${x.evidence.map(e => `<span><svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/></svg>${e}</span>`).join('')}</div></div>`).join('')}
      ${r.risks.length ? `<div class="ap-sec">ریسک‌ها</div>${r.risks.map(x => `<div class="riskrow"><svg viewBox="0 0 24 24"><path d="M12 9v4M12 17h.01"/><path d="M10.3 4.2L2.8 17a2 2 0 001.7 3h15a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z"/></svg>${x}</div>`).join('')}` : ''}
      ${r.conds.length ? `<div class="ap-sec">شروط اجرا</div>${r.conds.map(x => `<div class="condrow"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 8v4M12 15.5h.01"/></svg>${x}</div>`).join('')}` : ''}
      ${chIn}
    </div>`;
  }
  const p = $('#apanel');
  p.innerHTML = head + body;
  $('#apScrim').hidden = false; p.hidden = false; p.setAttribute('aria-hidden', 'false');
  if (G) G.from(p, { x: -30, opacity: 0, duration: .35, ease: 'power3.out' });
  $('#apX').onclick = closePanel;
}
function closePanel() {
  $('#apanel').hidden = true; $('#apScrim').hidden = true; $('#apanel').setAttribute('aria-hidden', 'true');
}
$('#apScrim').addEventListener('click', closePanel);

/* ═══ توصیه نهایی — جمع‌کردن ═══ */
$('#frecMin').addEventListener('click', () => { $('#frec').hidden = true; $('#frecPill').hidden = false; if (G) G.from('#frecPill', { y: 8, opacity: 0, duration: .3 }); });
$('#frecPill').addEventListener('click', () => { $('#frecPill').hidden = true; $('#frec').hidden = false; if (G) G.from('#frec', { y: 10, opacity: 0, duration: .3 }); });
$('#frCta').addEventListener('click', () => {
  const b = $('#frCta');
  b.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg> به OrgOS اعمال شد';
  b.style.background = 'var(--green)';
  toast('تصمیم به OrgOS ارسال شد — در صورت‌جلسه ثبت گردید');
  setTimeout(() => { b.innerHTML = 'اعمال در OrgOS<svg viewBox="0 0 24 24"><path d="M14 4H7v16h7"/><path d="M10 12h11M18 8.5L21.5 12 18 15.5"/></svg>'; b.style.background = ''; }, 2600);
});

/* ═══ پرونده تصمیم — ورود هاردکد ═══ */
function caseHTML() {
  const c = CASE_FILE;
  return `<div class="casefile">
    <div class="cf-meta"><span class="cf-id">${c.id}</span><span>${c.company}</span><span>${c.investor}</span></div>
    <div class="cf-grid">
      <div class="cf-cell"><small>موضوع</small><b>${c.title}</b></div>
      <div class="cf-cell"><small>سهام مورد بحث</small><b>${c.stake}</b></div>
      <div class="cf-cell w2"><small>هدف سرمایه‌گذاری</small><b>${c.goal}</b></div>
    </div>
    <div class="cf-sec">موارد بررسی شورا</div>
    <div class="cf-checks">${c.sections.map(s => `<div class="cf-chk"><b>${s.k}</b><ul>${s.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>
    <div class="cf-sec">سناریوهای مقایسه</div>
    <div class="cf-sc">${c.scenarios.map(s => `<div class="cf-scrow"><b>${s.id}</b><div><p>${s.t}</p><small>${s.s}</small></div></div>`).join('')}</div>
    <div class="cf-sec">پرسش اصلی شورا</div>
    <p class="cf-q">${c.mainQ}</p>
    <p class="cf-q2">${c.followUp}</p>
  </div>`;
}
function openCase() {
  $('#genTitle').textContent = 'پرونده تصمیم — ورود به شورا';
  $('#genBody').innerHTML = caseHTML();
  $('#ovGen').classList.add('open');
  if (G) G.from('#ovGen .modal', { scale: .95, y: 12, opacity: 0, duration: .3, ease: 'power3.out' });
  /* شروع جلسه با پرسش اصلی پرونده */
  runCouncil(CASE_FILE.mainQ, AGENTS);
}

/* ═══ هدر: توقف / اجرای مجدد / صورت‌جلسه ═══ */
function badge(cls, txt) { const b = $('#stateBadge'); b.className = 'hbadge ' + cls; $('#stateTxt').textContent = txt; }
function setPauseIco(running) {
  $('#pauseIco').innerHTML = running ? '<path d="M9 5v14M15 5v14"/>' : '<path d="M8 5l11 7-11 7z"/>';
}
$('#pauseBtn').addEventListener('click', () => {
  if (state.phase !== 'run') { toast('شورا در حال اجرا نیست'); return; }
  state.paused = !state.paused;
  if (state.paused) { sched.pause(); badge('run', 'متوقف شده'); setPauseIco(false); toast('شورا متوقف شد'); }
  else { sched.play(); badge('run', 'شورا در حال تحلیل'); setPauseIco(true); toast('شورا ادامه داد'); }
});
$('#restartBtn').addEventListener('click', () => { toast('اجرای مجدد شورا'); runCouncil(state.topic, state.analyses); });
$('#logBtn').addEventListener('click', () => openDrawer($('#logDrawer')));

/* ═══ کمپوزر مدیرعامل ═══ */
const ceoInput = $('#ceoInput'), sendBtn = $('#sendBtn');
ceoInput.addEventListener('input', () => sendBtn.disabled = !ceoInput.value.trim());
ceoInput.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
sendBtn.addEventListener('click', send);

function send() {
  const v = ceoInput.value.trim(); if (!v) return;
  ceoInput.value = ''; sendBtn.disabled = true;
  const chip = $('#ceoChip'); $('#ceoChipTxt').textContent = v; chip.hidden = false;
  if (G) G.from(chip, { y: 8, opacity: 0, duration: .35, ease: 'power3.out' });
  log('ceo', null, v);

  if (state.phase === 'run') { toast('شورا نظر شما را پس از این دور لحاظ می‌کند'); return; }

  /* واکنش اعضا — شبیه‌سازی محلی */
  toast('اعضای شورا نظر شما را بررسی می‌کنند');
  const doneIds = ORDER.filter(id => state.done[id]);
  doneIds.forEach((id, i) => schedReact(id, i * 700));
  if (state.phase === 'done') {
    badge('run', 'بازبینی نظر مدیرعامل');
    setTimeout(() => { if (state.phase === 'done') badge('done', 'شورا تکمیل شد'); }, doneIds.length * 700 + 2600);
  }
}
function schedReact(id, delay) {
  setTimeout(() => {
    const m = members[id], a = state.analyses[id];
    setStatus(id, 'listening');
    m.bub.textContent = a.react;
    if (G) G.from(m.bub, { y: 5, opacity: 0, duration: .3 });
    setTimeout(() => {
      setStatus(id, 'completed');
      m.bub.textContent = a.bubble;
      if (G) G.from(m.bub, { opacity: 0, duration: .4 });
    }, 3000);
  }, delay);
}

/* ═══ پاپ‌اورهای کمپوزر (+ و سطح تفکر) ═══ */
function bindPop(btnId, popId) {
  const btn = $(btnId), pop = $(popId);
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const open = !pop.hidden;
    $$('.pop').forEach(p => p.hidden = true);
    if (!open) { pop.hidden = false; if (G) G.from(pop, { y: 6, opacity: 0, scale: .97, duration: .25, ease: 'power3.out' }); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.popwrap')) pop.hidden = true; });
}
bindPop('#plusBtn', '#plusMenu');
bindPop('#thinkBtn', '#thinkMenu');

$('#plusMenu').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $('#plusMenu').hidden = true;
  if (b.dataset.add === 'case') { openCase(); return; }
  const add = { file: null, doc: 'سند: Term Sheet پیشنهادی', data: 'داده: متریک‌های رشد محصول', ctx: 'زمینه: بازار سرمایه خطرپذیر' }[b.dataset.add];
  if (b.dataset.add === 'file') $('#fileInput').click(); else addChip(add, b.textContent.trim());
});
$('#fileInput').addEventListener('change', e => { [...e.target.files].forEach(f => addChip(f.name, 'فایل')); e.target.value = ''; });
function addChip(name, fallback) {
  const chips = $('#chips'); chips.hidden = false;
  const c = document.createElement('span'); c.className = 'chip';
  c.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4"/></svg><b>${name || fallback}</b><button aria-label="حذف">✕</button>`;
  c.querySelector('button').onclick = () => { c.remove(); if (!chips.children.length) chips.hidden = true; };
  chips.appendChild(c);
  if (G) G.from(c, { scale: .9, opacity: 0, duration: .25 });
  toast('به شورا پیوست شد');
}

$('#thinkMenu').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#thinkMenu button').forEach(x => x.classList.remove('on'));
  b.classList.add('on');
  state.mult = +b.dataset.lv;
  $('#thinkLbl').textContent = 'تفکر · ' + fa(state.mult) + '×';
  $('#thinkMenu').hidden = true;
  toast(`سطح تفکر: ${b.querySelector('b').textContent} — عمق استدلال‌ها تنظیم شد`);
});

/* ═══ کشوها ═══ */
function openDrawer(d) {
  closeDrawers();
  $('#scrim').hidden = false; requestAnimationFrame(() => $('#scrim').classList.add('show'));
  d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
}
function closeDrawers() {
  $$('.drawer').forEach(d => { d.classList.remove('open'); d.setAttribute('aria-hidden', 'true'); });
  $('#scrim').classList.remove('show');
  setTimeout(() => { if (!$('.drawer.open')) $('#scrim').hidden = true; }, 260);
}
$('#scrim').addEventListener('click', closeDrawers);
$$('[data-closedrawer]').forEach(b => b.addEventListener('click', closeDrawers));

/* آکاردئون‌های کشو */
$$('.dacc .ditem.acc').forEach(b => b.addEventListener('click', () => b.closest('.dacc').classList.toggle('open')));
function expandAcc(name) { const acc = $(`.dacc[data-acc="${name}"]`); if (acc) { $$('.dacc').forEach(a => a.classList.remove('open')); acc.classList.add('open'); } }

/* داده‌های کشو */
$('#listSessions').innerHTML = [
  { t: 'سود کارخانه — سه‌ماهه اخیر', s: 'نشست جاری #۱۲' },
  { t: 'بازبینی قیمت‌گذاری فصلی', s: 'نشست #۱۱ · تکمیل' },
  { t: 'ریزش مشتریان حقوقی', s: 'نشست #۱۰ · تکمیل' },
  { t: 'ظرفیت خط تولید جدید', s: 'نشست #۹ · اعمال‌شده' }
].map(x => `<button class="drow"><span class="pd"><b>${x.t}</b><small>${x.s}</small></span></button>`).join('');
$('#listFiles').innerHTML = [
  'ترازنامه فصل دوم · PDF', 'گزارش OEE خط تولید · XLSX', 'قراردادهای تأمین · DOCX'
].map(x => `<button class="drow"><span class="pi"><svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7z"/></svg></span><span class="pd"><b>${x}</b></span></button>`).join('');
$('#listDecisions').innerHTML = [
  { t: 'رفع گلوگاه CNC-04', s: 'اعمال‌شده در OrgOS · #۹' },
  { t: 'بازنگری قرارداد تأمین', s: 'در انتظار اجرا · #۱۰' },
  { t: 'تغییر ترکیب شیفت‌ها', s: 'پیش‌نویس · #۱۱' }
].map(x => `<button class="drow"><span class="pi" style="--ac:var(--green);--ac-soft:var(--green-soft);--ac-strong:#065f46"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="pd"><b>${x.t}</b><small>${x.s}</small></span></button>`).join('');
$('#listHistory').innerHTML = [
  { n: '#۱۲', t: 'سود کارخانه', s: 'جاری' }, { n: '#۱۱', t: 'قیمت‌گذاری فصلی', s: 'تکمیل' },
  { n: '#۱۰', t: 'ریزش مشتریان', s: 'تکمیل' }, { n: '#۹', t: 'ظرفیت تولید', s: 'اعمال‌شده' }, { n: '#۸', t: 'انبار و موجودی', s: 'بایگانی' }
].map(x => `<button class="drow"><b>${x.n}</b><span class="pd"><b>${x.t}</b></span><span class="dd">${x.s}</span></button>`).join('');

/* ریل + منوی هدر */
$$('.rbtn').forEach(b => b.addEventListener('click', () => {
  const nav = b.dataset.nav;
  if (nav === 'new') { openDrawer($('#navDrawer')); $('#ovTopic').classList.add('open'); return; }
  if (nav === 'settings') { openDrawer($('#navDrawer')); toast('تنظیمات شورا در نسخه کامل فعال است'); return; }
  openDrawer($('#navDrawer')); expandAcc(nav);
}));
$('#hmenu').addEventListener('click', () => openDrawer($('#navDrawer')));
$('#newSessionBtn').addEventListener('click', () => { closeDrawers(); $('#ovTopic').classList.add('open'); $('#topicInput').focus(); });
$('#settingsBtn').addEventListener('click', () => { closeDrawers(); toast('تنظیمات شورا در نسخه کامل فعال است'); });
$('#exitBtn').addEventListener('click', () => { closeDrawers(); $('#ovExit').classList.add('open'); });

/* ═══ مودال‌ها ═══ */
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));
$$('[data-closeov]').forEach(b => b.addEventListener('click', () => b.closest('.overlay').classList.remove('open')));
$('#topicGo').addEventListener('click', () => {
  const v = $('#topicInput').value.trim();
  if (!v) { toast('موضوع را وارد کنید'); return; }
  $('#ovTopic').classList.remove('open'); $('#topicInput').value = '';
  runCouncil(v, genAnalyses(v));
});
$('#topicInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#topicGo').click(); });

/* خروج از جلسه */
$('#exitYes').addEventListener('click', () => {
  $('#ovExit').classList.remove('open');
  sched.clear(); state.phase = 'idle'; badge('', 'پایان نشست');
  $('#exitScr').hidden = false;
  if (G) G.from('.exCard', { scale: .95, opacity: 0, duration: .4, ease: 'power3.out' });
});
$('#backBtn').addEventListener('click', () => { $('#exitScr').hidden = true; toast('به جلسه بازگشتید'); });
$('#minBtn').addEventListener('click', () => {
  $('#exitScr').hidden = true;
  $('#genTitle').textContent = 'صورت جلسه — نشست #۱۲';
  $('#genBody').innerHTML = $('#logDesk').innerHTML || '<p class="muted">صورت‌جلسه خالی است.</p>';
  $('#ovGen').classList.add('open');
});

/* ESC — بستن لایه‌های باز */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeDrawers(); closePanel();
  $$('.overlay').forEach(o => o.classList.remove('open'));
  $$('.pop').forEach(p => p.hidden = true);
  $('#chalPop').hidden = true;
});

/* ═══ توست ═══ */
let toastT;
function toast(t) {
  $('#toastTxt').textContent = t; $('#toast').classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

/* ═══ شروع ═══ */
buildAgents();
if (G) {
  G.from('.hdr', { y: -14, opacity: 0, duration: .4, ease: 'power2.out' });
  G.from('.member', { y: 12, opacity: 0, duration: .4, stagger: .06, ease: 'power2.out', delay: .1 });
  G.from('.conclusion', { scale: .94, opacity: 0, duration: .45, ease: 'power3.out', delay: .3 });
  G.from('.composer', { y: 16, opacity: 0, duration: .4, ease: 'power2.out', delay: .35 });
  G.from('.rail', { opacity: 0, duration: .4, delay: .4 });
}
$('#topicTxt').textContent = TOPIC_DEMO;
$('#hKicker').textContent = `پرونده ${CASE_FILE.id} · شورای مدیریت SIMORGH`;
/* شروع خودکار جلسه با پرونده سرمایه‌گذاری */
setTimeout(() => runCouncil(TOPIC_DEMO, AGENTS), G ? 1100 : 300);
