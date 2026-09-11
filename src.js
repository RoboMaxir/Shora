'use strict';
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const fa = n => Number(n).toLocaleString('fa-IR');
const fa2 = n => String(n).padStart(2, '0').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const G = window.gsap || null;

/* ═══ اعضا ═══ */
const AG = { finance: { ac: '#2563eb' }, strategy: { ac: '#d97706' }, hr: { ac: '#7c3aed' }, ops: { ac: '#0891b2' }, legal: { ac: '#64748b' } };
const NAMES = { finance: 'مالی', strategy: 'استراتژی', hr: 'منابع انسانی', ops: 'عملیات', legal: 'حقوقی' };
const EN = { finance: 'FINANCE', strategy: 'STRATEGY', hr: 'HR', ops: 'OPERATIONS', legal: 'LEGAL' };
const ORDER = ['finance', 'strategy', 'hr', 'ops', 'legal'];
const STANCES = { positive: { fa: 'مثبت', icon: '✓' }, negative: { fa: 'منفی', icon: '✕' }, conditional: { fa: 'مشروط', icon: '⚠' }, risk: { fa: 'ریسک', icon: '△' } };
for (const k in AG) {
    const el = document.querySelector(`.member[data-a="${k}"]`);
    AG[k].el = el; AG[k].op = el.querySelector('.m-op'); AG[k].badge = el.querySelector('.m-badge');
    el.addEventListener('click', () => openAgent(k));
}

$('#stList').innerHTML = ORDER.map(k =>
    `<div class="srow" id="sr-${k}" style="--c:${AG[k].ac}"><i></i><span class="nm">${EN[k]}</span><span class="sv">در حال تحلیل…</span></div>`).join('');

/* ═══ داده نمونه ═══ */
const DEMO_TOPIC = 'تصمیم خرید دستگاه CNC جدید برای رفع گلوگاه خط تولید';
const DEMO = {
    finance: {
        stance: 'conditional', conf: .78, headline: 'از نظر مالی مشروط به تأمین نقدینگی توجیه‌پذیر است',
        args: [{ angle: 'بازگشت سرمایه', claim: 'دوره بازگشت حدود ۲۴ ماه', because: 'افزایش ۳۰٪ ظرفیت، جریان ورودی جدید ایجاد می‌کند', evidence: ['طرح توجیهی', 'پیش‌بینی فروش'] },
        { angle: 'نقدینگی', claim: 'فشار بر سرمایه در گردش در ۶۰ روز اول', because: 'پیش‌پرداخت خرید و نصب زودتر از اثر تولید است', evidence: ['صورت جریان نقدی'] },
        { angle: 'هزینه سرمایه', claim: 'استهلاک سالانه حدود ۴٪ بهای تمام‌شده', because: 'باید با صرفه‌جویی توقف‌ها جبران شود', evidence: ['آنالیز بهای تمام‌شده'] }],
        risks: ['نوسان نرخ ارز در خرید ارزی', 'تأخیر در نصب و راه‌اندازی'],
        conds: ['تأمین مالی با پیش‌پرداخت حداکثر ۴۰٪', 'مذاکره گارانتی حداقل ۲ ساله'],
        deep: 'تحلیل عمیق ۱۰×: حساسیت‌سنجی روی ۳ سناریوی ارزی انجام شد.'
    },
    strategy: {
        stance: 'positive', conf: .85, headline: 'با استراتژی توسعه ظرفیت و حفظ سهم بازار هم‌راستاست',
        args: [{ angle: 'تقاضای انباشته', claim: '۳۱٪ سفارشات معوق قابل جذب است', because: 'رفع گلوگاه، تقاضای موجود را بالفعل می‌کند', evidence: ['گزارش سفارشات'] },
        { angle: 'مزیت رقابتی', claim: 'کاهش زمان تحویل به زیر رقبا', because: 'ظرفیت جدید تعهد تحویل ۱۰ روزه ممکن می‌سازد', evidence: ['بنچمارک بازار'] },
        { angle: 'پورتفوی محصول', claim: 'امکان تولید قطعات دقیق‌تر با حاشیه بالاتر', because: 'دستگاه جدید تلرانس پایین‌تری دارد', evidence: ['نقشه راه محصول'] }],
        risks: ['کندشدن بازار در ۹۰ روز آینده'], conds: ['هم‌زمانی خرید با کمپین فروش'],
        deep: 'تحلیل عمیق ۱۰×: سناریوی عدم‌خرید هم مدل‌سازی شد.'
    },
    hr: {
        stance: 'positive', conf: .72, headline: 'بار اضافه‌کاری کم می‌شود؛ نیازمند آموزش اپراتور است',
        args: [{ angle: 'فشار کاری', claim: 'اضافه‌کاری ۱۸٪ فعلی به زیر ۸٪ می‌رسد', because: 'رفع گلوگاه، فشار زمانی شیفت‌ها را باز می‌کند', evidence: ['کارکرد ۶ ماه اخیر'] },
        { angle: 'مهارت', claim: 'نیاز به آموزش ۴ اپراتور', because: 'فناوری جدید مهارت برنامه‌نویسی CNC می‌خواهد', evidence: ['ماتریس مهارت'] },
        { angle: 'ریسک خروج', claim: 'کاهش ریزش نیروی باتجربه', because: 'فشار کمتر، فرسودگی شغلی را کم می‌کند', evidence: ['مصاحبه خروج'] }],
        risks: ['مقاومت در برابر تغییر فناوری'], conds: ['تدوین برنامه آموزش قبل از نصب'],
        deep: 'تحلیل عمیق ۱۰×: ریسک مهارت با مدل جانشین‌پروری سنجیده شد.'
    },
    ops: {
        stance: 'positive', conf: .9, headline: 'گلوگاه CNC-04 مستقیماً رفع می‌شود؛ قوی‌ترین توجیه عملیاتی',
        args: [{ angle: 'ظرفیت', claim: 'بهره‌برداری از ۹۴٪ به ۷۸٪ متعادل می‌شود', because: 'ظرفیت جدید، بار را از دستگاه اشباع خارج می‌کند', evidence: ['داشبورد OEE'] },
        { angle: 'توقف‌ها', claim: 'حذف ۲۷ ساعت توقف در ۹۰ روز', because: 'سربار تعمیرات ماشین فرسوده حذف می‌شود', evidence: ['لاگ نت'] },
        { angle: 'کیفیت', claim: 'کاهش ضایعات تا ۲٫۵ واحد درصد', because: 'دقت بالاتر ماشین جدید', evidence: ['گزارش ضایعات'] }],
        risks: ['اختلال در حین جابه‌جایی و نصب'], conds: ['نصب در پنجره کم‌بار تولید'],
        deep: 'تحلیل عمیق ۱۰×: شبیه‌سازی صف، گلوگاه ثانویه نشان نداد.'
    },
    legal: {
        stance: 'risk', conf: .65, headline: 'ریسک حقوقی در قرارداد واردات؛ نیازمند بازبینی شروط',
        args: [{ angle: 'قرارداد', claim: 'شروط فورس‌ماژور مبهم است', because: 'ریسک تأخیر تحویل بر عهده خریدار می‌ماند', evidence: ['پیش‌نویس قرارداد'] },
        { angle: 'گمرک', claim: 'ترخیص ممکن است ۴۵ روز طول بکشد', because: 'نیازمند مجوز استاندارد جدید', evidence: ['رویه گمرکی'] },
        { angle: 'گارانتی', claim: 'پوشش قطعات مصرفی ندارد', because: 'باید الحاقیه تنظیم شود', evidence: ['پیش‌نویس فروشنده'] }],
        risks: ['جریمه تأخیر در پرداخت اقساط ارزی'],
        conds: ['بازبینی حقوقی قرارداد قبل از امضا', 'اخذ ضمانت‌نامه حسن انجام'],
        deep: 'تحلیل عمیق ۱۰×: ریسک تحریمی فروشنده راستی‌آزمایی شد.'
    }
};
const DEMO_SYNTH = { rec: 'خرید دستگاه با شرط تأمین مالی مناسب و بازبینی حقوقی قرارداد؛ اولویت اجرا: پنجره کم‌بار تولید.' };

function hash(s) { let x = 7; for (const c of s) x = (x * 31 + c.charCodeAt(0)) % 9973; return x; }
function genAnalyses(topic) {
    const T = topic.length > 46 ? topic.slice(0, 46) + '…' : topic, h = hash(topic);
    const pick = (a, i) => a[(h + i) % a.length];
    const st = {
        finance: pick(['conditional', 'positive', 'risk'], 0), strategy: pick(['positive', 'conditional'], 1),
        hr: pick(['positive', 'conditional', 'risk'], 2), ops: pick(['positive', 'positive', 'conditional'], 3), legal: pick(['risk', 'conditional'], 4)
    };
    const mk = (k, headline, args, risks, conds) => ({
        stance: st[k], conf: .62 + ((h + ORDER.indexOf(k) * 7) % 28) / 100, headline, args, risks, conds,
        deep: 'تحلیل عمیق ۱۰×: سناریوهای مقابل نیز وزن‌دهی شدند.'
    });
    return {
        finance: mk('finance', `از بُعد مالی «${T}» نیازمند کنترل نقدینگی است`,
            [{ angle: 'جریان نقدینگی', claim: 'فشار نقدینگی در فاز اول', because: 'هزینه‌ها زودتر از درآمد اثر می‌گذارند', evidence: ['صورت جریان نقدی'] },
            { angle: 'بازگشت سرمایه', claim: 'دوره بازگشت قابل قبول', because: 'بهره‌وری تدریجی جریان ورودی ایجاد می‌کند', evidence: ['طرح توجیهی'] }], ['نوسان هزینه‌ها'], ['تعریف سقف بودجه و نقطه توقف']),
        strategy: mk('strategy', `از منظر استراتژیک «${T}» با اهداف رشد هم‌راستاست`,
            [{ angle: 'جایگاه بازار', claim: 'تقویت جایگاه در اجرای سریع', because: 'پنجره فرص محدود است', evidence: ['تحلیل رقبا'] },
            { angle: 'هم‌راستایی', claim: 'هم‌سو با نقشه راه سال', because: 'اهداف کمّی مشترک دارد', evidence: ['OKR سازمان'] }], ['پراکندگی تمرکز تیم‌ها'], ['تعریف شاخص موفقیت قبل از اجرا']),
        hr: mk('hr', `از نظر منابع انسانی «${T}» نیازمند ظرفیت مهارتی است`,
            [{ angle: 'مهارت', claim: 'نیازمند توانمندسازی بخشی از تیم', because: 'اجرا به مهارت جدید وابسته است', evidence: ['ماتریس مهارت'] },
            { angle: 'بار کاری', claim: 'توزیع بار باید بازطراحی شود', because: 'از فرسودگی تیم جلوگیری می‌کند', evidence: ['کارکرد اخیر'] }], ['مقاومت در برابر تغییر'], ['برنامه آموزش قبل از اجرا']),
        ops: mk('ops', `از زاویه عملیات «${T}» باید با ظرفیت واقعی سنجیده شود`,
            [{ angle: 'ظرفیت', claim: 'بالانس بار با ظرفیت فعلی', because: 'از گلوگاه جدید جلوگیری می‌کند', evidence: ['داشبورد عملیات'] },
            { angle: 'فرایند', claim: 'به‌روزرسانی فرایندهای پشتیبان', because: 'اجرای پایدار بدون فرایند ممکن نیست', evidence: ['نقشه فرایندها'] }], ['اختلال موقت در استقرار'], ['نصب تدریجی و پایلوت']),
        legal: mk('legal', `از منظر حقوقی «${T}» نیازمند بازبینی تعهدات است`,
            [{ angle: 'قراردادها', claim: 'بازبینی تعهدات مرتبط', because: 'ریسک تعارض یا جریمه وجود دارد', evidence: ['آرشیو قراردادها'] },
            { angle: 'انطباق', claim: 'الزامات نظارتی شناسایی شد', because: 'عدم انطباق ریسک توقف ایجاد می‌کند', evidence: ['فهرست الزامات'] }], ['ابهام در شروط طرف مقابل'], ['اخذ تأییدیه حقوقی قبل از اجرا'])
    };
}

/* ═══ موتور جلسه ═══ */
let mult = 3, levelName = 'Medium 3x';
let state = { phase: 'idle' }, timers = [], secs = 0, conf = 0, confTarget = 0;
const BASEDUR = { ops: 5200, finance: 7400, strategy: 9600, hr: 11800, legal: 13800 };
const speed = () => ({ 1: 1.5, 3: 1, 5: .72, 10: .5 })[mult] || 1;
function clearTimers() { timers.forEach(clearTimeout); timers = []; }
(function confLoop() {
    conf += (confTarget - conf) * .05; const t = fa(Math.round(conf)) + '٪';
    $('#sbConf').textContent = t; if (state.finished) $('#resultConf').innerHTML = 'اطمینان <b>' + t + '</b>';
    requestAnimationFrame(confLoop);
})();

function startSession(topic, analyses, synth) {
    clearTimers();
    state = { phase: 'analyzing', topic, analyses, synth, results: {}, finished: false };
    $('#topicTxt').textContent = topic; secs = 0; conf = 0; confTarget = 0;
    $('#sbCount').textContent = '۰ از ۵'; $('#sbFill').style.width = '0%'; $('#sbConf').textContent = '۰٪';
    $('#statusBar').classList.remove('done');
    $('#resultCard').classList.remove('show'); $('#resultTxt').textContent = '';
    $('#ceoBubble').classList.remove('show');
    ORDER.forEach(k => {
        const m = AG[k]; m.el.className = 'member thinking'; m.badge.innerHTML = ''; m.op.textContent = 'در حال تحلیل…';
        const sr = $('#sr-' + k); sr.className = 'srow'; sr.querySelector('.sv').textContent = 'در حال تحلیل…';
    });
    [...$('#pmini').children].forEach(s => s.classList.remove('on')); $('#stProgN').textContent = '۰/۵';
    toast('ارزیابی آغاز شد — ۵ عضو در حال تحلیل موازی');
    ORDER.forEach(k => timers.push(setTimeout(() => completeAgent(k), BASEDUR[k] * speed())));
}

function completeAgent(k) {
    if (state.phase !== 'analyzing') return;
    const r = state.analyses[k]; state.results[k] = r;
    const m = AG[k];
    m.el.className = 'member done st-' + r.stance;
    m.badge.innerHTML = `${STANCES[r.stance].icon} ${STANCES[r.stance].fa}`;
    m.op.textContent = r.headline;
    if (G) G.from(m.el, { y: 8, opacity: .4, duration: .35, ease: 'power2.out' });
    const sr = $('#sr-' + k); sr.className = 'srow st-' + r.stance; sr.querySelector('.sv').textContent = 'موضع: ' + STANCES[r.stance].fa;
    const done = Object.keys(state.results).length;
    $('#sbCount').textContent = fa(done) + ' از ۵';
    $('#sbFill').style.width = (done / 5 * 100) + '%';
    [...$('#pmini').children].forEach((s, i) => s.classList.toggle('on', i < done));
    $('#stProgN').textContent = fa(done) + '/۵';
    confTarget = Object.values(state.results).reduce((a, x) => a + x.conf, 0) / done * 100;
    if (done === 5) timers.push(setTimeout(synthesize, 750));
}

function synthesize() {
    if (state.phase !== 'analyzing') return;
    state.phase = 'done'; state.finished = true;
    const s = state.synth || genSynth();
    $('#resultTxt').textContent = s.rec;
    $('#resultCard').classList.add('show');
    $('#statusBar').classList.add('done'); $('#sbCount').textContent = '۵ از ۵ · تکمیل شد';
    confTarget = Math.round(Object.values(state.results).reduce((a, x) => a + x.conf, 0) / 5 * 100);
    toast('ارزیابی کامل شد — برای جزئیات روی هر عضو کلیک کنید');
    if (G) G.from('#resultCard', { y: 10, opacity: 0, duration: .45, ease: 'power2.out' });
}
function genSynth() {
    const cnt = { positive: 0, negative: 0, conditional: 0, risk: 0 };
    ORDER.forEach(k => cnt[state.results[k].stance]++);
    const p = []; if (cnt.positive) p.push(fa(cnt.positive) + ' مثبت'); if (cnt.conditional) p.push(fa(cnt.conditional) + ' مشروط');
    if (cnt.risk) p.push(fa(cnt.risk) + ' ریسک'); if (cnt.negative) p.push(fa(cnt.negative) + ' منفی');
    return { rec: `«${state.topic}» با آرای ${p.join('، ')} ارزیابی شد؛ اجرای مشروط به شروط اعلام‌شده توصیه می‌شود.` };
}

/* ═══ تحلیل کامل ═══ */
function shownArgs(r) { const d = { 1: 1, 3: 2, 5: 3, 10: 3 }[mult] || 2; return r.args.slice(0, d); }
function openAgent(k) {
    if (!state.results[k]) { toast(NAMES[k] + ' هنوز در حال تحلیل است…'); return; }
    const r = state.results[k], icon = AG[k].el.querySelector('.m-av svg').outerHTML;
    $('#agentBody').innerHTML = `
   <div class="ab-head" style="--ac:${AG[k].ac}"><div class="aic">${icon}</div>
    <div><h4>${NAMES[k]} · ${EN[k]}</h4></div>
    <span class="conf">Confidence ${fa(Math.round(r.conf * 100))}%</span></div>
   <div class="ab-hl st-${r.stance}"><span class="badge">${STANCES[r.stance].icon} موضع: ${STANCES[r.stance].fa}</span><br>${r.headline}</div>
   <div class="ab-sec">استدلال‌های چندجهته</div>
   ${shownArgs(r).map(a => `<div class="arg"><div class="ah"><span class="angle">${a.angle}</span><span class="claim">${a.claim}</span></div>
     <div class="bec"><b>چرا؟</b> ${a.because}</div>
     <div class="evs">${a.evidence.map(e => `<span>📎 ${e}</span>`).join('')}</div></div>`).join('')}
   <div class="ab-sec">ریسک‌ها</div>${r.risks.map(x => `<div class="risk">${x}</div>`).join('')}
   <div class="ab-sec">شروط اجرا</div>${r.conds.map(x => `<div class="condc">${x}</div>`).join('')}
   ${mult === 10 && r.deep ? `<div class="deep">◈ ${r.deep}</div>` : ''}`;
    $('#ovAgent').classList.add('open');
    if (G) G.from('#ovAgent .modal', { scale: .95, y: 12, opacity: 0, duration: .3, ease: 'power3.out' });
}
$('#agentClose').onclick = () => $('#ovAgent').classList.remove('open');

/* ═══ موضوع جدید ═══ */
function openTopic() { $('#ovTopic').classList.add('open'); $('#topicInput').focus(); }
$('#topicBtn2').onclick = () => { closeAll(); openTopic(); };
$('#topicNo').onclick = () => $('#ovTopic').classList.remove('open');
$('#topicGo').onclick = () => {
    const v = $('#topicInput').value.trim(); if (!v) return;
    $('#ovTopic').classList.remove('open'); $('#topicInput').value = ''; startSession(v, genAnalyses(v), null);
};
$('#topicInput').addEventListener('keydown', e => { if (e.key === 'Enter') $('#topicGo').click(); });

/* ═══ نظر مدیرعامل ═══ */
const REPLY = {
    finance: 'ملاحظه مدیرعامل در مدل مالی اعمال شد.', strategy: 'یادداشت مدیرعامل ثبت شد؛ سناریوها به‌روزرسانی می‌شود.',
    hr: 'نظر مدیرعامل در برنامه نیروی انسانی لحاظ می‌شود.', ops: 'دستور مدیرعامل دریافت شد؛ برنامه اجرا تنظیم می‌شود.',
    legal: 'نکته مدیرعامل در ملاحظات حقوقی ثبت می‌شود.'
};
let ri = 0;
function send() {
    const inp = $('#ceoInput'), v = inp.value.trim(); if (!v) return; inp.value = '';
    const b = $('#ceoBubble'); $('#ceoTxt').textContent = v; b.classList.add('show');
    clearTimeout(b.ht); b.ht = setTimeout(() => b.classList.remove('show'), 6000);
    if (state.phase === 'analyzing') { toast('شورا در حال تحلیل است؛ نظر شما پس از جمع‌بندی لحاظ می‌شود'); return; }
    if (state.phase === 'done') {
        const k = ORDER[(ri++) % 5], m = AG[k]; m.op.textContent = REPLY[k];
        setTimeout(() => { m.op.textContent = state.results[k].headline; }, 4200);
    }
}
$('#sendBtn').onclick = send;
$('#ceoInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

/* ═══ سطح تفکر ═══ */
$('#thinkSel').addEventListener('click', e => {
    const b = e.target.closest('.tbtn'); if (!b) return;
    $$('.tbtn').forEach(x => x.classList.remove('on')); b.classList.add('on');
    mult = +b.dataset.m; levelName = b.textContent.trim();
    $('#thinkBadge').textContent = 'تفکر · ' + ({ low: 'Low 1x', med: 'Medium 3x', high: 'High 5x', ultra: 'Ultra 10x' })[b.dataset.n];
    toast('سطح تفکر تغییر کرد — عمق استدلال‌ها به‌روز شد');
});

/* ═══ منوی + ═══ */
$('#plusBtn').onclick = e => { e.stopPropagation(); $('#plusW').classList.toggle('open'); };
document.addEventListener('click', e => { if (!e.target.closest('.plusW')) $('#plusW').classList.remove('open'); });
function addChip(n) {
    const c = document.createElement('span'); c.className = 'chip';
    c.innerHTML = `<svg viewBox="0 0 24 24"><path d="M7 3h8l4 4v14H7z"/></svg><b>${n}</b><button>✕</button>`; $('#chips').appendChild(c);
}
$('#chips').addEventListener('click', e => { if (e.target.tagName === 'BUTTON') e.target.closest('.chip').remove(); });
function shared() { toast('با اعضای شورا به اشتراک گذاشته شد'); }
$('#plusMenu').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('#plusW').classList.remove('open'); const a = b.dataset.act;
    if (a === 'topic') openTopic(); else if (a === 'file') $('#fileInput').click();
    else if (a === 'img') $('#imgInput').click(); else if (a === 'ref') { addChip('گزارش فروش فصلی'); shared(); }
});
$('#fileInput').onchange = e => { if (e.target.files[0]) { addChip(e.target.files[0].name); shared(); e.target.value = ''; } };
$('#imgInput').onchange = e => { if (e.target.files[0]) { addChip(e.target.files[0].name); shared(); e.target.value = ''; } };

/* ═══ کشوها / نوارها ═══ */
function openDr(id) { closeAll(); $('#' + id).classList.add('open'); $('#scrim').classList.add('show'); if (id === 'sideR') mkChart(); }
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
$('#sbDetails').onclick = () => openMod('خلاصه ارزیابی', sumHTML());
$('#resultDetails').onclick = () => openMod('خلاصه ارزیابی', sumHTML());
$('#dataBtn2').onclick = () => openDr('sideR');
$('#histBtn').onclick = () => {
    closeAll(); openMod('تاریخچه جلسات', `
  <div class="hrow"><b>#11</b>بازبینی قیمت‌گذاری فصلی<span>ارزیابی کامل</span></div>
  <div class="hrow"><b>#10</b>تحلیل ریزش مشتریان حقوقی<span>ارزیابی کامل</span></div>
  <div class="hrow"><b>#9</b>ظرفیت خط تولید جدید<span>در انتظار اقدام</span></div>`);
};
function sumHTML() {
    if (state.finished) {
        const r = ORDER.map(k => `<li style="position:relative;padding-right:16px;list-style:none;font-size:12.5px;line-height:2;color:var(--text2)">
    <span style="position:absolute;right:0;top:11px;width:6px;height:6px;border-radius:2px;background:${AG[k].ac}"></span>
    <b style="color:var(--text)">${NAMES[k]}:</b> ${STANCES[state.results[k].stance].fa} — ${state.results[k].headline}</li>`).join('');
        return `<p class="muted">موضوع: <b style="color:var(--text)">${state.topic}</b></p><ul style="margin:8px 0">${r}</ul>
    <div class="ab-hl st-positive" style="margin-top:10px"><b>جمع‌بندی:</b> ${$('#resultTxt').textContent}</div>`;
    }
    return `<p class="muted">ارزیابی هنوز کامل نشده است.</p>`;
}
function openMod(t, h) {
    $('#modTitle').textContent = t; $('#modBody').innerHTML = h; $('#ovMod').classList.add('open');
    if (G) G.from('#ovMod .modal', { scale: .95, y: 12, opacity: 0, duration: .3, ease: 'power3.out' });
}
$('#modClose').onclick = () => $('#ovMod').classList.remove('open');
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));

/* ═══ خروج / تایمر / نمودار / توست ═══ */
$('#exitBtn').onclick = () => { closeAll(); $('#ovExit').classList.add('open'); };
$('#exitNo').onclick = () => $('#ovExit').classList.remove('open');
$('#exitYes').onclick = () => {
    $('#ovExit').classList.remove('open'); clearTimers(); $('#exitScr').classList.add('show');
    if (G) G.from('.exCard', { scale: .94, opacity: 0, duration: .4, ease: 'power3.out' });
};
$('#backBtn').onclick = () => {
    $('#exitScr').classList.remove('show');
    if (state.phase === 'analyzing') { startSession(state.topic, state.analyses, state.synth); toast('جلسه از سر گرفته شد'); } else toast('به جلسه بازگشتید');
};
$('#minBtn').onclick = () => openMod('صورت‌جلسه — نشست #۱۲', sumHTML());
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeAll(); $$('.overlay').forEach(o => o.classList.remove('open')); $('#plusW').classList.remove('open'); } });

setInterval(() => { secs++; $('#sessTimer').textContent = fa2(Math.floor(secs / 60)) + ':' + fa2(secs % 60); }, 1000);

let mChart = null;
function mkChart() {
    if (mChart || !window.Chart) return;
    Chart.defaults.font.family = "'Inter','Vazirmatn',sans-serif"; Chart.defaults.color = '#6e6e80';
    Chart.defaults.borderColor = 'rgba(0,0,0,.06)'; Chart.defaults.font.size = 9;
    const el = $('#mChart'), ctx = el.getContext('2d');
    const g = ctx.createLinearGradient(0, 0, 0, 110); g.addColorStop(0, 'rgba(37,99,235,.18)'); g.addColorStop(1, 'rgba(37,99,235,0)');
    mChart = new Chart(el, {
        type: 'line', data: {
            labels: ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر'],
            datasets: [{ data: [22.4, 21.8, 21.1, 20.2, 19.1, 18.2], borderColor: '#2563eb', backgroundColor: g, fill: true, tension: .4, borderWidth: 2, pointRadius: 0 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { rtl: true, displayColors: false } },
            scales: { y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { color: '#a0a0ab' } }, x: { grid: { display: false }, ticks: { color: '#a0a0ab' } } }
        }
    });
}

let toastT; function toast(t) {
    $('#toastTxt').textContent = t; $('#toast').classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => $('#toast').classList.remove('show'), 2600);
}

/* ═══ شروع ═══ */
if (G) {
    G.from('.hdr', { y: -20, opacity: 0, duration: .4 });
    G.from('.statusbar', { y: -10, opacity: 0, duration: .4, delay: .05 });
    G.from('.member', { y: 10, opacity: 0, duration: .38, stagger: .06, ease: 'power2.out', delay: .1 });
    G.from('.ftr', { y: 20, opacity: 0, duration: .4, delay: .16 });
    G.from('.ebar', { opacity: 0, scale: .8, duration: .35, stagger: .08, delay: .3 });
}
setTimeout(() => startSession(DEMO_TOPIC, DEMO, DEMO_SYNTH), G ? 1500 : 400);