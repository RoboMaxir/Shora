'use strict';
const $ = s => document.querySelector(s), $$ = s => document.querySelectorAll(s);
const fa = n => Number(n).toLocaleString('fa-IR');
const fa2 = n => String(n).padStart(2, '0').replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
const G = window.gsap || null;

/* ═══════════ پس‌زمینه: شهر، ستاره، ذرات ═══════════ */
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

/* ═══════════ عامل‌ها ═══════════ */
const AG = {
    finance: { ac: '#5ab0ff' }, strategy: { ac: '#f3c95c' }, hr: { ac: '#b18cff' }, ops: { ac: '#35e0c8' }, legal: { ac: '#9db4d2' }
};
const NAMES = { finance: 'Finance', strategy: 'Strategy', hr: 'HR', ops: 'Operations', legal: 'Legal' };
const ORDER = ['finance', 'strategy', 'hr', 'ops', 'legal'];
const STAT = { thinking: 'Thinking…', speaking: 'Speaking…', done: 'Done ✓' };
const STATFA = { thinking: 'در حال تحلیل', speaking: 'در حال صحبت', done: 'تکمیل شد' };
const NEED = { finance: 2, strategy: 2, ops: 2, hr: 1, legal: 1 };
const spoken = {};
for (const k in AG) {
    const el = document.querySelector(`.agent[data-a="${k === 'ops' ? 'operations' : k}"]`);
    AG[k].el = el; AG[k].sp = el.querySelector('.speech'); AG[k].stx = el.querySelector('.stx');
}

$('#stList').innerHTML = ORDER.map(k =>
    `<div class="srow" id="sr-${k}" style="--c:${AG[k].ac}"><i></i><span class="nm">${NAMES[k]}</span><span class="sv">${STATFA.thinking}</span></div>`).join('');

function setStatus(k, s) {
    const a = AG[k];
    a.el.className = a.el.className.replace(/s-\w+/, '').trim();
    a.el.classList.add('s-' + s);
    a.el.classList.toggle('busy', s === 'speaking' || s === 'thinking');
    a.stx.textContent = STAT[s];
    const row = $('#sr-' + k); if (row) { row.querySelector('.sv').textContent = STATFA[s]; row.classList.toggle('done', s === 'done'); }
    syncProg();
}
function syncProg() {
    const done = ORDER.filter(k => $('#sr-' + k).classList.contains('done')).length;
    $('#stProgN').textContent = fa(done) + '/۵';
    [...$('#pmini').children].forEach((s, i) => s.classList.toggle('on', i < done));
}

function say(k, text, dur, extra) {
    const a = AG[k]; setStatus(k, 'speaking');
    a.sp.querySelector('.s-txt').textContent = text; a.sp.classList.add('show');
    clearTimeout(a.ht);
    a.ht = setTimeout(() => {
        a.sp.classList.remove('show');
        if (!extra) spoken[k] = (spoken[k] || 0) + 1;
        setStatus(k, (spoken[k] || 0) >= NEED[k] ? 'done' : 'thinking');
    }, dur);
}

/* ═══════════ موتور جلسه ═══════════ */
const TURNS = [
    { a: 'finance', t: 'کاهش حاشیه سود عمدتاً از رشد ۲۲٪ هزینه مواد اولیه ناشی شده است.', s: 1 },
    { a: 'strategy', t: 'موافقم؛ اما حجم سفارشات هم ۹٪ افت داشته است.', s: 0 },
    { a: 'ops', t: 'با هر دو تحلیل اختلاف جدی دارم؛ گلوگاه اصلی، ظرفیت ۹۴٪ دستگاه CNC-04 است.', s: 2 },
    { a: 'hr', t: 'اضافه‌کاری خط تولید ۱۸٪ رشد کرده؛ فشار ظرفیت تأیید می‌شود.', s: 0 },
    { a: 'legal', t: 'قرارداد تأمین مواد تا پایان فصل قابل بازبینی است.', s: 0 },
    { a: 'finance', t: 'با تفکیک هزینه‌ها: ۶۱٪ از کاهش سود از محل مواد اولیه است.', s: 3 },
    { a: 'strategy', t: 'پس علت مرکب است: هزینه مواد + گلوگاه تولید.', s: 4 },
    { a: 'ops', t: 'راه‌حل: سرویس پیشگیرانه CNC-04 و بازبینی برنامه تولید.', s: 5 },
];
const STEPS = [
    'در حال دریافت و همگام‌سازی داده‌های سازمان…',
    'فرضیه غالب: رشد هزینه مواد اولیه، عامل اصلی کاهش سود.',
    'اختلاف‌نظر: عملیات، گلوگاه تولید (CNC-04) را عامل اصلی می‌داند.',
    'راستی‌آزمایی: ۶۱٪ از کاهش سود از محل مواد اولیه تأیید شد.',
    'جمع‌بندی: علت مرکب — هزینه مواد اولیه + گلوگاه خط تولید.',
    'توصیه نهایی: سرویس پیشگیرانه CNC-04 + بازبینی برنامه تولید و تأمین.'];
const CONF_STEP = [34, 46, 52, 63, 72];

let mult = 3, levelC = 84, levelName = 'Medium 3x';
let ti = 0, paused = false, finished = false, runT = null, ceoNoted = false;
const gap = () => Math.max(1900, 4600 - mult * 260);

let conf = 34, confTarget = 34;
(function confLoop() {
    conf += (confTarget - conf) * .045;
    $('#concFill').style.width = conf + '%'; $('#concPct').textContent = fa(Math.round(conf)) + '٪';
    requestAnimationFrame(confLoop);
})();

function setStep(n) {
    const el = $('#concTxt');
    if (G) { G.to(el, { opacity: 0, y: 6, duration: .2, onComplete: () => { el.textContent = STEPS[n]; G.to(el, { opacity: 1, y: 0, duration: .3 }); } }); }
    else el.textContent = STEPS[n];
    $('#concStep').textContent = n < 5 ? `گام ${fa(n)} از ۵` : 'توصیه نهایی';
    $('#concBox').classList.toggle('final', n === 5);
    confTarget = n < 5 ? CONF_STEP[n] : levelC;
}

function stepGo() {
    if (paused || ti >= TURNS.length) return;
    const t = TURNS[ti++], g = gap();
    say(t.a, t.t, g + 600);
    if (t.s) setStep(t.s);
    if (ti >= TURNS.length) {
        setTimeout(() => {
            if (!paused && !finished) {
                finished = true;
                toast('تصمیم نهایی شورا آماده است — نظر خود را اعلام کنید');
                $('#ibox').classList.add('glow'); setTimeout(() => $('#ibox').classList.remove('glow'), 2600);
            }
        }, g + 900);
        return;
    }
    runT = setTimeout(stepGo, g + 1500);
}

/* ═══════════ سطح تفکر ═══════════ */
const LEVELS = { low: { c: 78, n: 'Low 1x' }, med: { c: 84, n: 'Medium 3x' }, high: { c: 87, n: 'High 5x' }, ultra: { c: 92, n: 'Ultra 10x' } };
$('#thinkSel').addEventListener('click', e => {
    const b = e.target.closest('.tbtn'); if (!b) return;
    $$('.tbtn').forEach(x => x.classList.remove('on')); b.classList.add('on');
    mult = +b.dataset.m; levelC = LEVELS[b.dataset.n].c; levelName = LEVELS[b.dataset.n].n;
    $('#thinkBadge').textContent = 'تفکر · ' + levelName;
    if (finished) confTarget = levelC;
    toast('سطح تفکر شورا: ' + levelName);
});

/* ═══════════ ورودی مدیرعامل ═══════════ */
const REPLIES = {
    strategy: 'یادداشت مدیرعامل ثبت شد؛ سناریوها را با این قید به‌روزرسانی می‌کنم.',
    ops: 'دستور دریافت شد؛ برنامه نگهداری CNC-04 را تنظیم می‌کنم.',
    finance: 'ملاحظه مدیرعامل در مدل مالی اعمال شد.',
    legal: 'نکته مدیرعامل در پیش‌نویس مصوبه لحاظ می‌شود.',
    hr: 'برنامه شیفت را با توجه به نظر مدیرعامل بازبینی می‌کنم.'
};
let ri = 0;
function send() {
    const inp = $('#ceoInput'), v = inp.value.trim(); if (!v) return; inp.value = '';
    const b = $('#ceoBubble'); $('#ceoTxt').textContent = v; b.classList.add('show');
    clearTimeout(b.ht); b.ht = setTimeout(() => b.classList.remove('show'), 6500);
    if (G) G.from(b, { y: 14, opacity: 0, duration: .4, ease: 'power2.out' });
    const resp = ORDER[(ri++) % ORDER.length];
    setTimeout(() => say(resp, REPLIES[resp], 5200, true), 1500);
    if (!ceoNoted) { ceoNoted = true; $('#concNote').classList.add('show'); }
}
$('#sendBtn').onclick = send;
$('#ceoInput').addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

/* ═══════════ منوی + ═══════════ */
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
    setTimeout(() => say('legal', 'فایل پیوست دریافت شد و در تحلیل لحاظ می‌شود.', 4200, true), 900);
}
$('#plusMenu').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    $('#plusW').classList.remove('open');
    const act = b.dataset.act;
    if (act === 'file') $('#fileInput').click();
    else if (act === 'img') $('#imgInput').click();
    else if (act === 'ref') { addChip('گزارش فروش فصلی'); shared(); }
    else toast('در این نسخه نمایشی فعال نیست');
});
$('#fileInput').onchange = e => { if (e.target.files[0]) { addChip(e.target.files[0].name); shared(); e.target.value = ''; } };
$('#imgInput').onchange = e => { if (e.target.files[0]) { addChip(e.target.files[0].name); shared(); e.target.value = ''; } };

/* ═══════════ کشوها / نوارها ═══════════ */
function openDr(id) {
    closeAll(); $('#' + id).classList.add('open'); $('#scrim').classList.add('show');
    if (id === 'sideR') mkChart();
}
function closeAll() { $$('.dr').forEach(d => d.classList.remove('open')); $('#scrim').classList.remove('show'); }
$$('.eicon').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.open) { openDr(b.dataset.open); return; }
    const a = b.dataset.act;
    if (a === 'sum') openMod('خلاصه نشست', sumHTML());
    else if (a === 'set') toast('تنظیمات شورا در نسخه کامل فعال است');
    else if (a === 'data') openDr('sideR');
    else if (a === 'bell') toast('اعلان جدیدی وجود ندارد');
}));
$$('.dr [data-close]').forEach(b => b.onclick = closeAll);
$('#scrim').onclick = closeAll;
$('#sumBtn2').onclick = () => { closeAll(); openMod('خلاصه نشست', sumHTML()); };
$('#dataBtn2').onclick = () => openDr('sideR');
$('#histBtn').onclick = () => {
    closeAll(); openMod('تاریخچه جلسات', `
  <div class="hrow"><b>#11</b>بازبینی قیمت‌گذاری محصولات فصلی<span>مصوبه داشت</span></div>
  <div class="hrow"><b>#10</b>تحلیل ریزش مشتریان حقوقی<span>مصوبه داشت</span></div>
  <div class="hrow"><b>#9</b>ارزیابی ظرفیت خط تولید جدید<span>در انتظار اقدام</span></div>`);
};
$('#setBtn').onclick = () => { closeAll(); toast('تنظیمات شورا در نسخه کامل فعال است'); };

function sumHTML() {
    return `
  <ul>
   <li>حاشیه سود ۴٫۲ واحد درصد کاهش یافته؛ عامل اصلی رشد ۲۲٪ هزینه مواد اولیه.</li>
   <li>ظرفیت CNC-04 به ۹۴٪ رسیده؛ گلوگاه اصلی خط تولید.</li>
   <li>اضافه‌کاری نیروی تولید ۱۸٪ رشد داشته است.</li>
   <li>قرارداد تأمین مواد تا پایان فصل قابل بازبینی است (اهرم مذاکره).</li>
   <li>توصیه نهایی با اطمینان ${fa(levelC)}٪: سرویس پیشگیرانه CNC-04 + بازبینی برنامه تولید.</li>
  </ul>`;
}

/* مودال عمومی */
function openMod(t, h) {
    $('#modTitle').textContent = t; $('#modBody').innerHTML = h; $('#ovMod').classList.add('open');
    if (G) G.from('#ovMod .modal', { scale: .93, y: 16, opacity: 0, duration: .32, ease: 'power3.out' });
}
$('#modClose').onclick = () => $('#ovMod').classList.remove('open');
$$('.overlay').forEach(o => o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); }));

/* ═══════════ خروج از جلسه ═══════════ */
$('#exitBtn').onclick = () => { closeAll(); $('#ovExit').classList.add('open'); };
$('#exitNo').onclick = () => $('#ovExit').classList.remove('open');
$('#exitYes').onclick = () => {
    $('#ovExit').classList.remove('open');
    paused = true; clearTimeout(runT);
    $('#exitScr').classList.add('show');
    if (G) G.from('.exCard', { scale: .92, opacity: 0, duration: .45, ease: 'power3.out' });
};
$('#backBtn').onclick = () => {
    $('#exitScr').classList.remove('show'); paused = false;
    if (ti < TURNS.length) stepGo(); toast('به جلسه بازگشتید');
};
$('#minBtn').onclick = () => openMod('صورت‌جلسه — نشست #۱۲', sumHTML());
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        closeAll();
        $$('.overlay').forEach(o => o.classList.remove('open')); $('#plusW').classList.remove('open');
    }
});

/* ═══════════ تایمر / نمودار / توست ═══════════ */
let secs = 0; setInterval(() => {
    secs++;
    $('#sessTimer').textContent = fa2(Math.floor(secs / 60)) + ':' + fa2(secs % 60);
}, 1000);

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

/* ═══════════ اینترو و شروع ═══════════ */
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
syncProg();
setTimeout(stepGo, G ? 1900 : 600);