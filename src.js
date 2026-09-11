'use strict';
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const fa = n => Number(n).toLocaleString('fa-IR');
const fa2 = n => String(n).padStart(2, '0').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const G = window.gsap || null;

/* ═══════ پس‌زمینه ═══════ */
const NS = 'http://www.w3.org/2000/svg';
(function city() {
    const svg = $('#cityFar'); let x = -10;
    while (x < 1620) {
        const w = 26 + Math.random() * 66, h = 80 + Math.random() * 130, y = 340 - h;
        const b = document.createElementNS(NS, 'rect');
        b.setAttribute('x', x); b.setAttribute('y', y); b.setAttribute('width', w); b.setAttribute('height', h + 6); b.setAttribute('fill', '#0a1524');
        svg.appendChild(b);
        for (let wy = y + 8; wy < 332; wy += 11)for (let wx = x + 5; wx < x + w - 5; wx += 10) {
            if (Math.random() < .10) {
                const r = document.createElementNS(NS, 'rect');
                r.setAttribute('x', wx); r.setAttribute('y', wy); r.setAttribute('width', 2.6); r.setAttribute('height', 3.6);
                r.setAttribute('fill', '#cfe8ff'); r.setAttribute('opacity', (0.08 + Math.random() * .5).toFixed(2));
                if (Math.random() < .07) { r.setAttribute('class', 'tw'); r.style.animationDelay = (Math.random() * 5) + 's'; }
                svg.appendChild(r);
            }
        }
        x += w + 4 + Math.random() * 16;
    }
    const st = $('#stars');
    for (let i = 0; i < 55; i++) {
        const d = document.createElement('i');
        d.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 55}%;animation-delay:${Math.random() * 5}s`;
        st.appendChild(d);
    }
})();
(function particles() {
    const cv = $('#pcv'); if (!cv) return; const ctx = cv.getContext('2d'); let W, H, P = [];
    function rs() {
        const r = cv.getBoundingClientRect(); W = cv.width = r.width; H = cv.height = r.height;
        P = Array.from({ length: 36 }, () => ({ x: Math.random() * W, y: Math.random() * H, v: .18 + Math.random() * .5, r: .6 + Math.random() * 1.4, a: .15 + Math.random() * .5 }));
    }
    rs(); addEventListener('resize', rs);
    (function tick() {
        ctx.clearRect(0, 0, W, H);
        for (const p of P) {
            p.y -= p.v; if (p.y < -4) { p.y = H + 4; p.x = W * .2 + Math.random() * W * .6; }
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fillStyle = `rgba(140,225,255,${p.a * (p.y / H)})`; ctx.fill();
        }
        requestAnimationFrame(tick);
    })();
})();

/* ═══════ عامل‌ها ═══════ */
const AG = { finance: { ac: '#5ab0ff' }, strategy: { ac: '#f3c95c' }, hr: { ac: '#b18cff' }, ops: { ac: '#35e0c8' }, legal: { ac: '#9db4d2' } };
const NAMES = { finance: 'FINANCE', strategy: 'STRATEGY', hr: 'HR', ops: 'OPERATIONS', legal: 'LEGAL' };
const NAMESFA = { finance: 'مالی', strategy: 'استراتژی', hr: 'منابع انسانی', ops: 'عملیات', legal: 'حقوقی' };
const ORDER = ['finance', 'strategy', 'hr', 'ops', 'legal'];
const STAT = { thinking: 'Thinking…', done: 'Done ✓' };
const STANCES = { positive: { fa: 'مثبت', icon: '✓' }, negative: { fa: 'منفی', icon: '✕' }, conditional: { fa: 'مشروط', icon: '⚠' }, risk: { fa: 'ریسک', icon: '△' } };
for (const k in AG) {
    const el = document.querySelector(`.agent[data-a="${k === 'ops' ? 'operations' : k}"]`);
    AG[k].el = el; AG[k].sp = el.querySelector('.speech'); AG[k].stx = el.querySelector('.stx');
}
$$('.agent').forEach(a => a.addEventListener('click', () => {
    const k = a.dataset.a === 'operations' ? 'ops' : a.dataset.a; openAgent(k);
}));

$('#stList').innerHTML = ORDER.map(k =>
    `<div class="srow" id="sr-${k}" style="--c:${AG[k].ac}"><i></i><span class="nm">${NAMES[k]}</span><span class="sv">در حال تحلیل…</span></div>`).join('');

function setStatus(k, s) {
    const a = AG[k];
    a.el.className = a.el.className.replace(/s-\w+/, '').trim(); a.el.classList.add('s-' + s);
    a.el.classList.toggle('busy', s === 'thinking'); a.stx.textContent = STAT[s];
}

/* ═══════ داده نمونه: موضوع پیش‌فرض ═══════ */
const DEMO_TOPIC = 'تصمیم خرید دستگاه CNC جدید برای رفع گلوگاه خط تولید';
const DEMO = {
    finance: {
        stance: 'conditional', conf: .78, headline: 'از نظر مالی مشروط به تأمین نقدینگی توجیه‌پذیر است',
        args: [{ angle: 'بازگشت سرمایه', claim: 'دوره بازگشت حدود ۲۴ ماه', because: 'افزایش ۳۰٪ ظرفیت، جریان ورودی جدید ایجاد می‌کند', evidence: ['طرح توجیهی', 'پیش‌بینی فروش'] },
        { angle: 'نقدینگی', claim: 'فشار بر سرمایه در گردش در ۶۰ روز اول', because: 'پیش‌پرداخت خرید و نصب زودتر از اثر تولید است', evidence: ['صورت جریان نقدی'] },
        { angle: 'هزینه سرمایه', claim: 'استهلاک سالانه حدود ۴٪ بهای تمام‌شده اضافه می‌کند', because: 'باید با صرفه‌جویی توقف‌ها جبران شود', evidence: ['آنالیز بهای تمام‌شده'] }],
        risks: ['نوسان نرخ ارز در خرید ارزی', 'تأخیر در نصب و راه‌اندازی'],
        conds: ['تأمین مالی با پیش‌پرداخت حداکثر ۴۰٪', 'مذاکره گارانتی حداقل ۲ ساله'],
        deep: 'تحلیل عمیق ۱۰×: حساسیت‌سنجی روی ۳ سناریوی ارزی و ۲ سناریوی نرخ بهره انجام شد.'
    },
    strategy: {
        stance: 'positive', conf: .85, headline: 'با استراتژی توسعه ظرفیت و حفظ سهم بازار هم‌راستاست',
        args: [{ angle: 'تقاضای انباشته', claim: '۳۱٪ سفارشات معوق قابل جذب است', because: 'رفع گلوگاه، تقاضای موجود را بالفعل می‌کند', evidence: ['گزارش سفارشات'] },
        { angle: 'مزیت رقابتی', claim: 'کاهش زمان تحویل به زیر رقبا', because: 'ظرفیت جدید، تعهد تحویل ۱۰ روزه ممکن می‌سازد', evidence: ['بنچمارک بازار'] },
        { angle: 'پورتفوی محصول', claim: 'امکان تولید قطعات دقیق‌تر با حاشیه بالاتر', because: 'دستگاه جدید تلرانس پایین‌تری دارد', evidence: ['نقشه راه محصول'] }],
        risks: ['کندشدن بازار در ۹۰ روز آینده'],
        conds: ['هم‌زمانی خرید با کمپین فروش برای جذب سفارش'],
        deep: 'تحلیل عمیق ۱۰×: سناریوی عدم‌خرید هم مدل‌سازی شد — ریزش سهم بازار محتمل‌تر است.'
    },
    hr: {
        stance: 'positive', conf: .72, headline: 'بار اضافه‌کاری کم می‌شود؛ نیازمند آموزش اپراتور است',
        args: [{ angle: 'فشار کاری', claim: 'اضافه‌کاری ۱۸٪ فعلی به زیر ۸٪ می‌رسد', because: 'رفع گلوگاه، گلوگاه زمانی شیفت‌ها را باز می‌کند', evidence: ['کارکرد ۶ ماه اخیر'] },
        { angle: 'مهارت', claim: 'نیاز به آموزش ۴ اپراتور برای دستگاه جدید', because: 'فناوری جدید، مهارت برنامه‌نویسی CNC می‌خواهد', evidence: ['ماتریس مهارت'] },
        { angle: 'ریسک خروج', claim: 'کاهش ریزش نیروی باتجربه', because: 'فشار کمتر، فرسودگی شغلی را کم می‌کند', evidence: ['مصاحبه خروج'] }],
        risks: ['مقاومت در برابر تغییر فناوری'],
        conds: ['تدوین برنامه آموزش قبل از نصب'],
        deep: 'تحلیل عمیق ۱۰×: ریسک مهارت با مدل جانشین‌پروری سنجیده شد.'
    },
    ops: {
        stance: 'positive', conf: .9, headline: 'گلوگاه CNC-04 مستقیماً رفع می‌شود؛ قوی‌ترین توجیه عملیاتی',
        args: [{ angle: 'ظرفیت', claim: 'بهره‌برداری از ۹۴٪ به ۷۸٪ متعادل می‌شود', because: 'ظرفیت جدید، بار را از دستگاه اشباع خارج می‌کند', evidence: ['داشبورد OEE'] },
        { angle: 'توقف‌ها', claim: 'حذف ۲۷ ساعت توقف خارج از برنامه در ۹۰ روز', because: 'سربار تعمیرات روی ماشین فرسوده حذف می‌شود', evidence: ['لاگ نت'] },
        { angle: 'کیفیت', claim: 'کاهش ضایعات تا ۲٫۵ واحد درصد', because: 'دقت بالاتر ماشین جدید', evidence: ['گزارش ضایعات'] }],
        risks: ['اختلال در حین جابه‌جایی و نصب'],
        conds: ['نصب در پنجره کم‌بار تولید'],
        deep: 'تحلیل عمیق ۱۰×: شبیه‌سازی صف تولید، گلوگاه ثانویه در مونتاژ نشان نداد.'
    },
    legal: {
        stance: 'risk', conf: .65, headline: 'ریسک حقوقی در قرارداد واردات؛ نیازمند بازبینی شروط',
        args: [{ angle: 'قرارداد', claim: 'شروط فورس‌ماژور قرارداد تأمین مبهم است', because: 'ریسک تأخیر تحویل بر عهده خریدار می‌ماند', evidence: ['پیش‌نویس قرارداد'] },
        { angle: 'گمرک و مجوزها', claim: 'فرایند ترخیص ممکن است ۴۵ روز طول بکشد', because: 'نیازمند مجوز استاندارد جدید', evidence: ['رویه گمرکی'] },
        { angle: 'گارانتی', claim: 'گارانتی پیشنهادی پوشش قطعات مصرفی ندارد', because: 'باید الحاقیه تنظیم شود', evidence: ['پیش‌نویس فروشنده'] }],
        risks: ['جریمه تأخیر در پرداخت اقساط ارزی'],
        conds: ['بازبینی حقوقی قرارداد قبل از امضا', 'اخذ ضمانت‌نامه حسن انجام'],
        deep: 'تحلیل عمیق ۱۰×: ریسک تحریمی فروشنده با فهرست‌های رسمی راستی‌آزمایی شد.'
    }
};
const DEMO_SYNTH = {
    chips: '۳ مثبت · ۱ مشروط · ۱ ریسک',
    rec: 'توصیه شورا: خرید دستگاه با شرط تأمین مالی مناسب و بازبینی حقوقی قرارداد؛ اولویت اجرا: پنجره کم‌بار تولید.'
};

/* ═══════ مولد تحلیل برای موضوع دلخواه ═══════ */
function hash(s) { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) % 9973; return x; }
function genAnalyses(topic) {
    const T = topic.length > 46 ? topic.slice(0, 46) + '…' : topic, h = hash(topic);
    const pick = (arr, i) => arr[(h + i) % arr.length];
    const st = {
        finance: pick(['conditional', 'positive', 'risk'], 0), strategy: pick(['positive', 'conditional'], 1),
        hr: pick(['positive', 'conditional', 'risk'], 2), ops: pick(['positive', 'positive', 'conditional'], 3),
        legal: pick(['risk', 'conditional'], 4)
    };
    const mk = (k, headline, args, risks, conds) => ({
        stance: st[k], conf: .62 + ((h + ORDER.indexOf(k) * 7) % 28) / 100, headline, args, risks, conds,
        deep: 'تحلیل عمیق ۱۰×: سناریوهای مقابل نیز ارزیابی و وزن‌دهی شدند.'
    });
    return {
        finance: mk('finance', `از بُعد مالی «${T}» نیازمند کنترل نقدینگی و بهای تمام‌شده است`,
            [{ angle: 'جریان نقدینگی', claim: 'فشار نقدینگی در فاز اول', because: 'هزینه‌های اجرا زودتر از درآمد اثر می‌گذارند', evidence: ['صورت جریان نقدی'] },
            { angle: 'بازگشت سرمایه', claim: 'دوره بازگشت در سناریوی پایه قابل قبول است', because: 'بهره‌وری تدریجی، جریان ورودی ایجاد می‌کند', evidence: ['طرح توجیهی'] }],
            ['نوسان هزینه‌ها و تورم'], ['تعریف سقف بودجه و نقطه توقف']),
        strategy: mk('strategy', `از منظر استراتژیک «${T}» با اهداف رشد هم‌راستا ارزیابی می‌شود`,
            [{ angle: 'جایگاه بازار', claim: 'تقویت جایگاه در صورت اجرای سریع', because: 'پنجره فرصب محدود است', evidence: ['تحلیل رقبا'] },
            { angle: 'هم‌راستایی', claim: 'هم‌سو با نقشه راه سال جاری', because: 'اهداف کمّی مشترک دارد', evidence: ['OKR سازمان'] }],
            ['پراکندگی تمرکز تیم‌ها'], ['تعریف شاخص موفقیت قبل از اجرا']),
        hr: mk('hr', `از نظر منابع انسانی «${T}» نیازمند ظرفیت مهارتی و پذیرش تیم‌هاست`,
            [{ angle: 'مهارت', claim: 'نیازمند توانمندسازی بخشی از تیم', because: 'اجرای موفق به مهارت جدید وابسته است', evidence: ['ماتریس مهارت'] },
            { angle: 'بار کاری', claim: 'توزیع بار باید بازطراحی شود', because: 'از فرسودگی تیم‌های کلیدی جلوگیری می‌کند', evidence: ['کارکرد اخیر'] }],
            ['مقاومت در برابر تغییر'], ['برنامه ارتباطی و آموزش قبل از اجرا']),
        ops: mk('ops', `از زاویه عملیات «${T}` + '» باید با ظرفیت واقعی اجرا سنجیده شود',
            [{ angle: 'ظرفیت', claim: 'بار اجرایی باید با ظرفیت فعلی بالانس شود', because: 'از ایجاد گلوگاه جدید جلوگیری می‌کند', evidence: ['داشبورد عملیات'] },
            { angle: 'فرایند', claim: 'نیازمند به‌روزرسانی فرایندهای پشتیبان', because: 'اجرای پایدار بدون فرایند ممکن نیست', evidence: ['نقشه فرایندها'] }],
            ['اختلال موقت در حین استقرار'], ['نصب تدریجی و پایلوت']),
        legal: mk('legal', `از منظر حقوقی «${T}» نیازمند بازبینی تعهدات و قراردادهاست`,
            [{ angle: 'قراردادها', claim: 'تعهدات قراردادی مرتبط باید بازبینی شوند', because: 'ریسک تعارض یا جریمه وجود دارد', evidence: ['آرشیو قراردادها'] },
            { angle: 'انطباق', claim: 'الزامات نظارتی مرتبط شناسایی شد', because: 'عدم انطباق، ریسک توقف ایجاد می‌کند', evidence: ['فهرست الزامات'] }],
            ['ابهام در شروط طرف مقابل'], ['اخذ تأییدیه حقوقی قبل از اجرا'])
    };
}

/* ═══════ موتور جلسه ═══════ */
let mult = 3, levelName = 'Medium 3x';
const LEVELS = { low: { c: 78, n: 'Low 1x' }, med: { c: 84, n: 'Medium 3x' }, high: { c: 87, n: 'High 5x' }, ultra: { c: 92, n: 'Ultra 10x' } };
let state = { phase: 'idle' }, timers = [], secs = 0, conf = 0, confTarget = 0;
const BASEDUR = { ops: 5200, finance: 7400, strategy: 9600, hr: 11800, legal: 13800 };
const speed = () => ({ 1: 1.5, 3: 1, 5: .72, 10: .5 })[mult] || 1;
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
(function confLoop() {
    conf += (confTarget - conf) * .05;
    $('#concFill').style.width = conf + '%'; $('#concPct').textContent = fa(Math.round(conf)) + '٪';
    requestAnimationFrame(confLoop);
})();

function buildSkeleton() {
    $('#concRows').innerHTML = ORDER.map(k =>
        `<div class="crow skel" id="cr-${k}"><i class="cdot" style="--dc:${AG[k].ac}"></i>
    <span class="cname">${NAMES[k]}</span><span class="cstance">در حال تحلیل…</span>
    <span class="chead">تحلیل از بُعد ${NAMESFA[k]}</span></div>`).join('');
    $('#synth').classList.remove('show'); $('#synth').innerHTML = '';
    $('#concNote').classList.remove('show'); $('#concBox').classList.remove('final');
    $('#concStep').textContent = '۰ از ۵';
    ORDER.forEach(k => { const r = $('#sr-' + k); r.className = 'srow'; r.querySelector('.sv').textContent = 'در حال تحلیل…'; });
}

function startSession(topic, analyses, synth) {
    clearTimers();
    state = { phase: 'analyzing', topic, analyses, synth, results: {}, finished: false };
    $('#topicTxt').textContent = topic; secs = 0; conf = 0; confTarget = 0;
    buildSkeleton();
    ORDER.forEach(k => {
        const sp = AG[k].sp;
        sp.className = 'speech show thinking'; sp.querySelector('.badge').innerHTML = ''; sp.querySelector('.s-txt').textContent = '';
        setStatus(k, 'thinking');
    });
    toast('ارزیابی آغاز شد — ۵ عامل در حال تحلیل موازی');
    ORDER.forEach(k => timers.push(setTimeout(() => completeAgent(k), BASEDUR[k] * speed())));
}

function completeAgent(k) {
    if (state.phase !== 'analyzing') return;
    const r = state.analyses[k]; state.results[k] = r; setStatus(k, 'done');
    const sp = AG[k].sp;
    sp.classList.remove('thinking'); sp.classList.add('done', 'st-' + r.stance);
    sp.querySelector('.badge').innerHTML = `${STANCES[r.stance].icon} ${STANCES[r.stance].fa}`;
    sp.querySelector('.s-txt').textContent = r.headline;
    if (G) G.fromTo(sp, { scale: .88 }, { scale: 1, duration: .45, ease: 'back.out(2)' });
    const row = $('#cr-' + k);
    row.className = 'crow ready st-' + r.stance;
    row.querySelector('.cstance').textContent = `${STANCES[r.stance].icon} ${STANCES[r.stance].fa}`;
    row.querySelector('.chead').textContent = r.headline;
    row.onclick = () => openAgent(k);
    if (G) G.from(row, { x: -14, opacity: 0, duration: .4, ease: 'power2.out' });
    const sr = $('#sr-' + k); sr.className = 'srow st-' + r.stance;
    sr.querySelector('.sv').textContent = 'موضع: ' + STANCES[r.stance].fa;
    const done = Object.keys(state.results).length;
    $('#concStep').textContent = fa(done) + ' از ۵';
    [...$('#pmini').children].forEach((s, i) => s.classList.toggle('on', i < done));
    $('#stProgN').textContent = fa(done) + '/۵';
    confTarget = Object.values(state.results).reduce((a, x) => a + x.conf, 0) / done * 100;
    if (done === 5) timers.push(setTimeout(synthesize, 900));
}

function synthesize() {
    if (state.phase !== 'analyzing') return;
    state.phase = 'done'; state.finished = true;
    const cnt = { positive: 0, negative: 0, conditional: 0, risk: 0 };
    ORDER.forEach(k => cnt[state.results[k].stance]++);
    const chips = [];
    if (cnt.positive) chips.push(fa(cnt.positive) + ' مثبت');
    if (cnt.conditional) chips.push(fa(cnt.conditional) + ' مشروط');
    if (cnt.risk) chips.push(fa(cnt.risk) + ' ریسک');
    if (cnt.negative) chips.push(fa(cnt.negative) + ' منفی');
    const s = state.synth || {
        chips: chips.join(' · '),
        rec: `توصیه شورا: «${state.topic}» با ${chips.join('، ')} ارزیابی شد؛ اجرای مشروط به لحاظ شروط اعلام‌شده پیشنهاد می‌شود.`
    };
    $('#synth').innerHTML = `<div class="schips">${chips.join(' · ')}</div><p>${s.rec}</p>`;
    $('#synth').classList.add('show'); $('#concBox').classList.add('final');
    const overall = Math.round(Object.values(state.results).reduce((a, x) => a + x.conf, 0) / 5 * 100);
    confTarget = overall;
    toast('ارزیابی چندبُعدی کامل شد — روی هر عامل کلیک کنید');
    if (G) G.from('#synth', { y: 10, opacity: 0, duration: .5, ease: 'power2.out' });
}

/* ═══════ تحلیل کامل یک عامل ═══════ */
function shownArgs(r) { const d = { 1: 1, 3: 2, 5: 3, 10: 3 }[mult] || 2; return r.args.slice(0, d); }
function openAgent(k) {
    if (!state.results[k]) { toast(NAMESFA[k] + ' هنوز در حال تحلیل است…'); return; }
    const r = state.results[k], icon = AG[k].el.querySelector('.avatar svg').outerHTML;
    $('#agentBody').innerHTML = `
   <div class="ab-head" style="--ac:${AG[k].ac}"><div class="aic">${icon}</div>
    <div><h4>${NAMESFA[k]} · ${NAMES[k]}</h4><div class="badge" style="display:inline-flex;--sc:var(--sc,#fff)"></div></div>
    <span class="conf">Confidence ${fa(Math.round(r.conf * 100))}%</span></div>
   <div class="ab-hl st-${r.stance}" style="border-color:color-mix(in srgb,var(--sc) 40%,transparent)">
     <span class="badge" style="display:inline-flex">${STANCES[r.stance].icon} موضع: ${STANCES[r.stance].fa}</span><br>${r.headline}</div>
   <div class="ab-sec">استدلال‌های چندجهته</div>
   ${shownArgs(r).map(a => `<div class="arg"><div class="ah"><span class="angle">${a.angle}</span><span class="claim">${a.claim}</span></div>
     <div class="bec"><b>چرا؟</b> ${a.because}</div>
     <div class="evs">${a.evidence.map(e => `<span>📎 ${e}</span>`).join('')}</div></div>`).join('')}
   <div class="ab-sec">ریسک‌ها</div>${r.risks.map(x => `<div class="risk">${x}</div>`).join('')}
   <div class="ab-sec">شروط اجرا</div>${r.conds.map(x => `<div class="condc">${x}</div>`).join('')}
   ${mult === 10 && r.deep ? `<div class="deep">◈ ${r.deep}</div>` : ''}`;
    $('#ovAgent').classList.add('open');
    if (G) G.from('#ovAgent .modal', { scale: .93, y: 16, opacity: 0, duration: .32, ease: 'power3.out' });
}
$('#agentClose').onclick = () => $('#ovAgent').classList.remove('open');

/* ═══════ موضوع جدید ═══════ */
function openTopic() { $('#ovTopic').classList.add('open'); $('#topicInput').focus(); }
$('#topicBtn2').onclick = () => { closeAll(); openTopic(); };
$('#topicNo').onclick = () => $('#ovTopic').classList.remove('open');
$('#topicGo').onclick = () => {
    const v = $('#topicInput').value.trim(); if (!v) return;
    $('#ovTopic').classList.remove('open'); $('#topicInput').value = '';
    startSession(v, genAnalyses(v), null);
};
$('#topicInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#topicGo').click(); });

/* ═══════ نظر مدیرعامل ═══════ */
const REPLY = {
    finance: 'ملاحظه مدیرعامل در مدل مالی اعمال شد.', strategy: 'یادداشت مدیرعامل ثبت شد؛ سناریوها به‌روزرسانی می‌شود.',
    hr: 'نظر مدیرعامل در برنامه نیروی انسانی لحاظ می‌شود.', ops: 'دستور مدیرعامل دریافت شد؛ برنامه اجرا تنظیم می‌شود.',
    legal: 'نکته مدیرعامل در ملاحظات حقوقی ثبت می‌شود.'
};
let ri = 0;
function send() {
    const inp = $('#ceoInput'), v = inp.value.trim(); if (!v) return; inp.value = '';
    const b = $('#ceoBubble'); $('#ceoTxt').textContent = v; b.classList.add('show');
    clearTimeout(b.ht); b.ht = setTimeout(() => b.classList.remove('show'), 6500);
    if (G) G.from(b, { y: 14, opacity: 0, duration: .4, ease: 'power2.out' });
    if (state.phase === 'analyzing') { toast('شورا در حال تحلیل است؛ نظر شما پس از جمع‌بندی لحاظ می‌شود'); $('#concNote').classList.add('show'); return; }
    if (state.phase === 'done') {
        const k = ORDER[(ri++) % 5], sp = AG[k].sp, txt = sp.querySelector('.s-txt'), old = txt.textContent;
        txt.textContent = REPLY[k]; sp.classList.add('reply');
        setTimeout(() => { txt.textContent = old; sp.classList.remove('reply'); }, 4600);
        $('#concNote').classList.add('show');
    }
}
$('#sendBtn').onclick = send;
$('#ceoInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

/* ═══════ سطح تفکر ═══════ */
$('#thinkSel').addEventListener('click', e => {
    const b = e.target.closest('.tbtn'); if (!b) return;
    $$('.tbtn').forEach(x => x.classList.remove('on')); b.classList.add('on');
    mult = +b.dataset.m; levelName = LEVELS[b.dataset.n].n;
    $('#thinkBadge').textContent = 'تفکر · ' + levelName;
    toast('سطح تفکر: ' + levelName + ' — عمق استدلال‌های نمایشی تغییر کرد');
});

/* ═══════ منوی + ═══════ */
$('#plusBtn').onclick = e => { e.stopPropagation(); $('#plusW').classList.toggle('open'); };
document.addEventListener('click', e => { if (!e.target.closest('.plusW')) $('#plusW').classList.remove('open'); });
function addChip(name) {
    const c = document.createElement('span'); c.className = 'chip';
    c.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7z"/></svg><b>${name}</b><button>✕</button>`;
    $('#chips').appendChild(c);
}
$('#chips').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') e.target.closest('.chip').remove(); });
function shared() {
    toast('با اعضای شورا به اشتراک گذاشته شد');
    setTimeout(() => {
        if (state.phase === 'done') {
            const sp = AG.legal.sp, txt = sp.querySelector('.s-txt'), old = txt.textContent;
            txt.textContent = 'مستندات پیوست بررسی و لحاظ شد.'; sp.classList.add('reply');
            setTimeout(() => { txt.textContent = old; sp.classList.remove('reply'); }, 4200);
        }
    }, 900);
}
$('#plusMenu').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('#plusW').classList.remove('open');
    const a = b.dataset.act;
    if (a === 'topic') openTopic();
    else if (a === 'file') $('#fileInput').click();
    else if (a === 'img') $('#imgInput').click();
    else if (a === 'ref') { addChip('گزارش فروش فصلی'); shared(); }
});
$('#fileInput').onchange = e => { if (e.target.files[0]) { addChip(e.target.files[0].name); shared(); e.target.value = ''; } };
$('#imgInput').onchange = e => { if (e.target.files[0]) { addChip(e.target.files[0].name); shared(); e.target.value = ''; } };

/* ═══════ کشوها / نوارها ═══════ */
function openDr(id) {
    closeAll(); $('#' + id).classList.add('open'); $('#scrim').classList.add('show');
    if (id === 'sideR') mkChart();
}
function closeAll() { $$('.dr').forEach(d => d.classList.remove('open')); $('#scrim').classList.remove('show'); }
$$('.eicon').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.open) { openDr(b.dataset.open); return; }
    const a = b.dataset.act;
    if (a === 'sum') openMod('خلاصه ارزیابی', sumHTML());
    else if (a === 'set') toast('تنظیمات شورا در نسخه کامل فعال است');
    else if (a === 'data') openDr('sideR');
    else if (a === 'bell') toast('اعلان جدیدی وجود ندارد');
}));
$$('.dr [data-close]').forEach(b => b.onclick = closeAll);
$('#sumBtn2').onclick = () => { closeAll(); openMod('خلاصه ارزیابی', sumHTML()); };
$('#dataBtn2').onclick = () => openDr('sideR');
$('#histBtn').onclick = () => {
    closeAll(); openMod('تاریخچه جلسات', `
  <div class="hrow"><b>#11</b>بازبینی قیمت‌گذاری محصولات فصلی<span>ارزیابی کامل</span></div>
  <div class="hrow"><b>#10</b>تحلیل ریزش مشتریان حقوقی<span>ارزیابی کامل</span></div>
  <div class="hrow"><b>#9</b>ظرفیت خط تولید جدید<span>در انتظار اقدام</span></div>`);
};
function sumHTML() {
    if (state.finished) {
        const r = ORDER.map(k => `<li><b style="color:${AG[k].ac}">${NAMESFA[k]}:</b> ${STANCES[state.results[k].stance].fa} — ${state.results[k].headline}</li>`).join('');
        return `<p class="muted">موضوع: <b style="color:#e8f2ff">${state.topic}</b></p><ul>${r}</ul><p class="muted">${$('#synth').textContent}</p>`;
    }
    return `<p class="muted">ارزیابی هنوز کامل نشده است — ${$('#concStep').textContent} عامل تحلیل را تمام کرده‌اند.</p>`;
}
function openMod(t, h) {
    $('#modTitle').textContent = t; $('#modBody').innerHTML = h; $('#ovMod').classList.add('open');
    if (G) G.from('#ovMod .modal', { scale: .93, y: 16, opacity: 0, duration: .32, ease: 'power3.out' });
}
$('#modClose').onclick = () => $('#ovMod').classList.remove('open');
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));

/* ═══════ خروج / تایمر / نمودار / توست ═══════ */
$('#exitBtn').onclick = () => { closeAll(); $('#ovExit').classList.add('open'); };
$('#exitNo').onclick = () => $('#ovExit').classList.remove('open');
$('#exitYes').onclick = () => {
    $('#ovExit').classList.remove('open'); clearTimers();
    $('#exitScr').classList.add('show');
    if (G) G.from('.exCard', { scale: .92, opacity: 0, duration: .45, ease: 'power3.out' });
};
$('#backBtn').onclick = () => {
    $('#exitScr').classList.remove('show');
    if (state.phase === 'analyzing') { startSession(state.topic, state.analyses, state.synth); toast('جلسه از سر گرفته شد'); }
    else toast('به جلسه بازگشتید');
};
$('#minBtn').onclick = () => openMod('صورت‌جلسه — نشست #۱۲', sumHTML());
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeAll();
        $$('.overlay').forEach(o => o.classList.remove('open')); $('#plusW').classList.remove('open');
    }
});

setInterval(() => { secs++; $('#sessTimer').textContent = fa2(Math.floor(secs / 60)) + ':' + fa2(secs % 60); }, 1000);

let mChart = null;
function mkChart() {
    if (mChart || !window.Chart) return;
    Chart.defaults.font.family = "'Vazirmatn','Space Grotesk',sans-serif";
    Chart.defaults.color = '#8fa6c0'; Chart.defaults.borderColor = 'rgba(122,196,255,.08)'; Chart.defaults.font.size = 9;
    const el = $('#mChart'), ctx = el.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 110);
    g.addColorStop(0, 'rgba(90,176,255,.32)'); g.addColorStop(1, 'rgba(90,176,255,0)');
    mChart = new Chart(el, {
        type: 'line',
        data: {
            labels: ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر'],
            datasets: [{
                data: [22.4, 21.8, 21.1, 20.2, 19.1, 18.2], borderColor: '#5ab0ff', backgroundColor: g,
                fill: true, tension: .42, borderWidth: 2, pointRadius: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { display: false }, tooltip: {
                    rtl: true, displayColors: false,
                    backgroundColor: 'rgba(8,16,32,.95)', borderColor: 'rgba(122,196,255,.3)', borderWidth: 1
                }
            },
            scales: {
                y: { grid: { color: 'rgba(122,196,255,.06)' }, ticks: { font: { family: 'Space Grotesk' } } },
                x: { grid: { display: false } }
            }
        }
    });
}

let toastT; function toast(t) {
    $('#toastTxt').textContent = t; $('#toast').classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

/* ═══════ اینترو + شروع خودکار ═══════ */
if (G) {
    const tl = G.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.hdr', { y: -52, opacity: 0, duration: .6 })
        .from('.sky', { opacity: 0, duration: .9 }, 0)
        .from('#tableWrap', { opacity: 0, scale: .9, transformOrigin: '50% 50%', duration: .8 }, .15)
        .from('.agent .av', { scale: 0, opacity: 0, duration: .5, stagger: .09, ease: 'back.out(1.7)' }, .35)
        .from('.agent .meta', { opacity: 0, duration: .4, stagger: .09 }, .55)
        .from('.conc', { opacity: 0, duration: .6 }, .6)
        .from('.ftr', { y: 52, opacity: 0, duration: .6 }, .5)
        .from('.ebar', { opacity: 0, scale: .7, duration: .45, stagger: .1 }, .7);
}
setTimeout(() => startSession(DEMO_TOPIC, DEMO, DEMO_SYNTH), G ? 2100 : 500);