(function () {
var C = window.CONFIG, $ = function (s) { return document.querySelector(s); };
var CUR = ['NGN','USD','EUR','GBP','JPY','AUD','CAD','CHF'];
var SYM = {NGN:'₦',USD:'$',EUR:'€',GBP:'£',JPY:'¥',AUD:'A$',CAD:'C$',CHF:'CHF '};
var P = [
 {s:'EUR/USD',b:'EUR',q:'USD',p:1.0850,v:.0004,f:'🇪🇺🇺🇸',d:4},
 {s:'GBP/USD',b:'GBP',q:'USD',p:1.2900,v:.0004,f:'🇬🇧🇺🇸',d:4},
 {s:'USD/JPY',b:'USD',q:'JPY',p:150.20,v:.0005,f:'🇺🇸🇯🇵',d:2},
 {s:'USD/NGN',b:'USD',q:'NGN',p:1500.00,v:.0006,f:'🇺🇸🇳🇬',d:2},
 {s:'AUD/USD',b:'AUD',q:'USD',p:.6600,v:.0005,f:'🇦🇺🇺🇸',d:4},
 {s:'USD/CAD',b:'USD',q:'CAD',p:1.3600,v:.0004,f:'🇺🇸🇨🇦',d:4},
 {s:'USD/CHF',b:'USD',q:'CHF',p:.8800,v:.0004,f:'🇺🇸🇨🇭',d:4},
 {s:'EUR/GBP',b:'EUR',q:'GBP',p:.8410,v:.0003,f:'🇪🇺🇬🇧',d:4}];
P.forEach(function (x) { x.o = x.p; x.h = []; for (var i = 0; i < 30; i++) x.h.push(x.p); });
var isLive = false, side = 'b', cur = 'EUR/USD';

var S = {bal: {}, tx: [], ref: ''};
CUR.forEach(function (c) { S.bal[c] = 0; });
try { var sv = JSON.parse(localStorage.getItem('mfx') || 'null'); if (sv) S = sv; } catch (e) {}
if (!S.ref) { S.ref = 'MFX-' + Math.random().toString(36).slice(2, 8).toUpperCase(); save(); }
function save() { try { localStorage.setItem('mfx', JSON.stringify(S)); } catch (e) {} }

function fmt(x, d) { return Number(x).toLocaleString('en-US', {minimumFractionDigits: d, maximumFractionDigits: d}); }
function money(c, v) { return SYM[c] + fmt(v, c === 'JPY' ? 0 : 2); }
function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function pr(x) { return fmt(x.p, x.d); }
function toast(m) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; t.setAttribute('role', 'status'); document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500); }
function pend(c) { return S.tx.filter(function (t) { return t.type === 'deposit' && t.status === 'Pending' && t.cur === c; }).reduce(function (a, t) { return a + t.amt; }, 0); }
function add(type, c, amt, status, note) { S.tx.unshift({id: Date.now() + '', type: type, cur: c, amt: amt, status: status, note: note, t: Date.now()}); S.tx = S.tx.slice(0, 50); save(); }

// ---- Backend bridge. In demo mode everything stays in this browser. ----
function api(path, body) {
  return fetch(C.API_BASE + path, {method: body ? 'POST' : 'GET', headers: {'Content-Type': 'application/json'}, credentials: 'include', body: body ? JSON.stringify(body) : undefined})
    .then(function (r) { if (!r.ok) throw new Error('Request failed'); return r.json(); });
}
function loadServer() { return api('/account').then(function (d) { S.bal = d.balances; S.tx = d.transactions; refresh(); }).catch(function () { toast('Could not reach the server.'); }); }
function commit(path, payload, local) {
  if (C.API_BASE) return api(path, payload).then(loadServer);
  local(); return Promise.resolve();
}

// ---- Shared pieces ----
function wallet() {
  var n = pend('NGN');
  return '<div class="card walletbox"><div class="mute">Available balance</div><div class="bigbal">' + money('NGN', S.bal.NGN) + '</div>' +
    (n ? '<div class="mute">+ ' + money('NGN', n) + ' pending confirmation</div>' : '') +
    '<div class="bal">' + CUR.filter(function (c) { return c !== 'NGN'; }).map(function (c) { var p = pend(c); return '<div><span class="mute">' + c + '</span><br><b>' + money(c, S.bal[c]) + '</b></div>'; }).join('') + '</div></div>';
}
function activity(types) {
  var l = S.tx.filter(function (t) { return !types || types.indexOf(t.type) > -1; }).slice(0, 8);
  if (!l.length) return '<p class="mute">Nothing here yet.</p>';
  return l.map(function (t) {
    var ok = t.status === 'Completed' || t.status === 'Paid' || t.status === 'Filled';
    return '<div class="row"><span>' + esc(t.note) + '<br><span class="mute">' + new Date(t.t).toLocaleString() + '</span></span><span style="text-align:right"><b>' + (t.type === 'withdraw' ? '−' : t.type === 'deposit' ? '+' : '') + money(t.cur, t.amt) + '</b><br><span class="badge ' + (ok ? 'ok' : 'wait') + '">' + t.status + '</span></span></div>';
  }).join('');
}
function head() { $('#hb').textContent = 'Available ' + money('NGN', S.bal.NGN); }
function refresh() { head(); if ($('#wal')) $('#wal').innerHTML = wallet(); if ($('#act')) $('#act').innerHTML = activity($('#act').dataset.t ? $('#act').dataset.t.split(',') : null); }
function spark(x) {
  var h = x.h, mn = Math.min.apply(0, h), mx = Math.max.apply(0, h), r = mx - mn || 1;
  return '<svg viewBox="0 0 120 34" width="100%" height="34" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="' + (x.p >= x.o ? 'var(--up)' : 'var(--down)') + '" stroke-width="2" points="' + h.map(function (v, i) { return (i * 120 / 29).toFixed(1) + ',' + (32 - (v - mn) / r * 30).toFixed(1); }).join(' ') + '"/></svg>';
}
function chg(x) { var c = (x.p / x.o - 1) * 100; return '<span class="' + (c >= 0 ? 'up' : 'down') + '">' + (c >= 0 ? '▲ ' : '▼ ') + Math.abs(c).toFixed(2) + '%</span>'; }
function row(k, v, copy) { return '<div class="row"><span class="mute">' + k + '</span><span><b>' + esc(v) + '</b>' + (copy ? ' <button class="btn sm cp" data-c="' + esc(v) + '">Copy</button>' : '') + '</span></div>'; }

// ---- Pages ----
var pages = {
home: function () {
  return '<div class="hero"><div class="wrap"><div><h1>Trade the world’s currencies as they move.</h1><p>Deposit from your bank, trade eight major pairs, and withdraw back to your bank. Your balance is always in view.</p><a class="btn" href="#deposit">Deposit money</a><a class="btn alt" href="#trade">Start trading</a></div>' +
  '<svg viewBox="0 0 360 280" role="img" aria-label="Globe with rising price chart"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c28a14" stop-opacity=".5"/><stop offset="1" stop-color="#c28a14" stop-opacity="0"/></linearGradient></defs><circle cx="180" cy="130" r="110" fill="none" stroke="#5bb0e6" stroke-width="2" opacity=".6"/><ellipse cx="180" cy="130" rx="45" ry="110" fill="none" stroke="#5bb0e6" opacity=".5"/><ellipse cx="180" cy="130" rx="95" ry="110" fill="none" stroke="#5bb0e6" opacity=".3"/><path d="M70 130h220M85 80h190M85 180h190" stroke="#5bb0e6" opacity=".4"/><path d="M20 230L80 200L130 215L190 150L240 165L300 90L345 60L345 260L20 260Z" fill="url(#g)"/><polyline points="20,230 80,200 130,215 190,150 240,165 300,90 345,60" fill="none" stroke="#e6b84a" stroke-width="4" stroke-linejoin="round"/><circle cx="345" cy="60" r="7" fill="#e6b84a"/></svg></div></div>' +
  '<section><div class="wrap"><div id="wal">' + wallet() + '</div><h2>Live markets</h2><p class="mute">Tap a pair to trade it.</p><div class="grid" id="mk"></div></div></section>' +
  '<section><div class="wrap"><div class="grid">' + [
   ['Deposit from your bank', 'Send a transfer to our account with your reference. It shows in your balance once confirmed.', 'M4 8h16v10H4zM4 11h16'],
   ['Trade at clear prices', 'See the price before you confirm each order.', 'M4 17l5-6 4 3 7-9'],
   ['Withdraw to your bank', 'Request a payout to your own bank account at any time.', 'M12 4v12M7 11l5 5 5-5M5 20h14']
  ].map(function (a) { return '<div class="card feat"><svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + a[2] + '"/></svg><div><h3>' + a[0] + '</h3><span class="mute">' + a[1] + '</span></div></div>'; }).join('') + '</div></div></section>';
},
trade: function () {
  return '<section><div class="wrap"><h2>Buy or trade</h2><div id="wal">' + wallet() + '</div><div class="cols"><div class="card"><label for="sel">Currency pair</label><select id="sel">' + P.map(function (x) { return '<option value="' + x.s + '"' + (x.s === cur ? ' selected' : '') + '>' + x.f + ' ' + x.s + '</option>'; }).join('') + '</select>' +
  '<div class="seg" style="margin-top:14px"><button id="sb" class="b">Buy</button><button id="ss" class="s">Sell</button></div><label for="amt" id="al">Amount</label><input id="amt" type="number" min="0" step="any" value="100" inputmode="decimal"><div class="row"><span>Price</span><b id="qp"></b></div><div class="row"><span id="ql"></span><b id="qt"></b></div><button class="btn full" id="go">Place order</button></div>' +
  '<div class="card"><div id="big"></div><h3 style="margin-top:14px">Recent orders</h3><div id="act" data-t="trade">' + activity(['trade']) + '</div></div></div></div></section>';
},
deposit: function () {
  var B = C.BANK;
  return '<section><div class="wrap"><h2>Deposit money</h2><div id="wal">' + wallet() + '</div><div class="cols"><div>' +
  '<div class="card"><h3>Step 1. Send a bank transfer</h3><p class="mute">From your own bank app, send naira to our account below.</p>' + row('Bank', B.bank, 1) + row('Account number', B.accountNumber, 1) + row('Account name', B.Opaye, 1) + row('Your reference', S.ref, 1) +
  '<div class="note">Put your reference in the transfer narration so we can match the payment to you.</div></div>' +
  '<div class="card"><h3>Step 2. Tell us you’ve sent it</h3><label for="da">Amount sent (₦)</label><input id="da" type="number" min="' + C.MIN_DEPOSIT + '" step="any" inputmode="decimal" placeholder="Minimum ' + fmt(C.MIN_DEPOSIT, 0) + '"><label for="ds">Name on the sending account</label><input id="ds"><label for="db">Your bank</label><input id="db" placeholder="e.g. GTBank"><button class="btn full" id="dgo">I’ve sent the money</button>' +
  (C.DEMO_MODE ? '<div class="note">Practice mode: no real money moves. Deposits are credited automatically after 8 seconds.</div>' : '<div class="note">We credit your balance after the payment reaches our account.</div>') + '</div></div>' +
  '<div class="card"><h3>Deposit history</h3><div id="act" data-t="deposit">' + activity(['deposit']) + '</div></div></div></div></section>';
},
withdraw: function () {
  return '<section><div class="wrap"><h2>Withdraw</h2><div id="wal">' + wallet() + '</div><div class="cols"><div class="card"><label for="wc">Currency</label><select id="wc">' + CUR.map(function (k) { return '<option>' + k + '</option>'; }).join('') + '</select><div class="mute" id="wav" style="margin-top:6px"></div>' +
  '<label for="wa">Amount</label><input id="wa" type="number" min="0" step="any" inputmode="decimal"><button class="btn sm" id="wmax" type="button" style="margin-top:6px">Withdraw everything</button>' +
  '<label for="wb">Your bank name</label><input id="wb"><label for="wn">Account number</label><input id="wn" inputmode="numeric"><label for="wm">Account name</label><input id="wm"><button class="btn full" id="wgo">Request withdrawal</button>' +
  (C.DEMO_MODE ? '<div class="note">Practice mode: no real money is sent. The request is marked paid after 8 seconds.</div>' : '<div class="note">Withdrawals go only to a bank account in your own name.</div>') + '</div>' +
  '<div class="card"><h3>Withdrawal history</h3><div id="act" data-t="withdraw">' + activity(['withdraw']) + '</div></div></div></div></section>';
}};

// ---- Page behaviour ----
function gp() { return P.filter(function (x) { return x.s === cur; })[0]; }
function quote() {
  var x = gp(), a = parseFloat($('#amt').value) || 0, r = side === 'b' ? x.p * 1.0002 : x.p * .9998;
  $('#qp').textContent = fmt(r, x.d) + ' ' + x.q; $('#al').textContent = 'Amount of ' + x.b + ' to ' + (side === 'b' ? 'buy' : 'sell');
  $('#ql').textContent = side === 'b' ? 'You pay' : 'You receive'; $('#qt').textContent = fmt(a * r, 2) + ' ' + x.q;
  $('#big').innerHTML = '<div class="flags">' + x.f + '</div><div class="px">' + x.s + ' ' + pr(x) + '</div>' + chg(x) + spark(x);
  var g = $('#go'); g.className = 'btn full ' + (side === 'b' ? 'buy' : 'sell'); g.textContent = (side === 'b' ? 'Buy ' : 'Sell ') + x.b;
  $('#sb').classList.toggle('on', side === 'b'); $('#ss').classList.toggle('on', side === 's');
}
function initTrade() {
  $('#sel').onchange = function () { cur = this.value; quote(); }; $('#amt').oninput = quote;
  $('#sb').onclick = function () { side = 'b'; quote(); }; $('#ss').onclick = function () { side = 's'; quote(); };
  $('#go').onclick = function () {
    var x = gp(), a = parseFloat($('#amt').value);
    if (!(a > 0)) return toast('Enter an amount above zero.');
    var rate = side === 'b' ? x.p * 1.0002 : x.p * .9998, cost = a * rate;
    if (side === 'b' && S.bal[x.q] < cost) return toast('Not enough ' + x.q + '. Deposit or trade into it first.');
    if (side === 's' && S.bal[x.b] < a) return toast('Not enough ' + x.b + ' to sell.');
    commit('/trades', {pair: x.s, side: side, amount: a}, function () {
      if (side === 'b') { S.bal[x.q] -= cost; S.bal[x.b] += a; } else { S.bal[x.b] -= a; S.bal[x.q] += cost; }
      add('trade', x.q, cost, 'Filled', (side === 'b' ? 'Bought ' : 'Sold ') + fmt(a, 2) + ' ' + x.b);
    }).then(function () { toast('Order filled.'); route(); });
  };
}
function initDep() {
  $('#dgo').onclick = function () {
    var a = parseFloat($('#da').value), s = $('#ds').value.trim(), b = $('#db').value.trim();
    if (!(a >= C.MIN_DEPOSIT)) return toast('The minimum deposit is ' + money('NGN', C.MIN_DEPOSIT) + '.');
    if (!s || !b) return toast('Enter the sender name and bank.');
    commit('/deposits', {amount: a, senderName: s, senderBank: b, reference: S.ref}, function () {
      add('deposit', 'NGN', a, 'Pending', 'Transfer from ' + s + ' (' + b + '), ref ' + S.ref);
    }).then(function () { toast('Thanks. We’re waiting for your transfer to arrive.'); route(); });
  };
}
function initWd() {
  function av() { $('#wav').textContent = 'Available: ' + money($('#wc').value, S.bal[$('#wc').value]); }
  $('#wc').onchange = av; av();
  $('#wmax').onclick = function () { $('#wa').value = S.bal[$('#wc').value]; };
  $('#wgo').onclick = function () {
    var k = $('#wc').value, a = parseFloat($('#wa').value), b = $('#wb').value.trim(), n = $('#wn').value.trim(), m = $('#wm').value.trim();
    if (!(a > 0)) return toast('Enter an amount above zero.');
    if (k === 'NGN' && a < C.MIN_WITHDRAWAL) return toast('The minimum withdrawal is ' + money('NGN', C.MIN_WITHDRAWAL) + '.');
    if (a > S.bal[k]) return toast('You only have ' + money(k, S.bal[k]) + ' available.');
    if (!b || !m || (k === 'NGN' ? !/^\d{10}$/.test(n) : n.length < 6)) return toast(k === 'NGN' ? 'Enter your bank, a 10-digit account number and the account name.' : 'Enter your bank, account number and account name.');
    commit('/withdrawals', {currency: k, amount: a, bank: b, accountNumber: n, accountName: m}, function () {
      S.bal[k] -= a; add('withdraw', k, a, 'Processing', 'To ' + m + ', ' + b + ' ' + n.slice(-4).padStart(n.length, '•'));
    }).then(function () { toast('Withdrawal requested.'); route(); });
  };
}
function route() {
  var p = (location.hash || '#home').slice(1); if (!pages[p]) p = 'home';
  $('#app').innerHTML = pages[p]();
  document.querySelectorAll('nav a.l').forEach(function (a) { a.classList.toggle('on', a.dataset.p === p); });
  window.scrollTo(0, 0);
  if (p === 'trade') initTrade(); if (p === 'deposit') initDep(); if (p === 'withdraw') initWd();
  head(); live();
}
function live() {
  var h = P.map(function (x) { return '<span><b>' + x.s + '</b> ' + pr(x) + ' ' + chg(x) + '</span>'; }).join('');
  $('#tk').innerHTML = h + h;
  var m = $('#mk'); if (m) m.innerHTML = P.map(function (x) { return '<div class="card pair" tabindex="0" role="link" data-s="' + x.s + '"><div class="flags" aria-hidden="true">' + x.f + '</div><div class="mute">' + x.s + '</div><div class="px">' + pr(x) + '</div>' + chg(x) + spark(x) + '</div>'; }).join('');
  if ($('#qp')) quote();
  $('#src').textContent = isLive ? 'Rates: open.er-api.com, refreshed every minute.' : 'Rates are simulated until live rates load.';
}
function fetchRates() {
  fetch(C.RATES_URL).then(function (r) { return r.json(); }).then(function (d) {
    var r = d.rates; if (!r) return;
    var m = {'EUR/USD': 1 / r.EUR, 'GBP/USD': 1 / r.GBP, 'USD/JPY': r.JPY, 'USD/NGN': r.NGN, 'AUD/USD': 1 / r.AUD, 'USD/CAD': r.CAD, 'USD/CHF': r.CHF, 'EUR/GBP': r.GBP / r.EUR};
    P.forEach(function (x) { if (!m[x.s]) return; x.p = m[x.s]; if (!isLive) { x.o = x.p; x.h = x.h.map(function () { return x.p; }); } x.h.push(x.p); x.h.shift(); });
    isLive = true; live();
  }).catch(function () {});
}
function settle() {
  if (!C.DEMO_MODE || C.API_BASE) return;
  var ch = false;
  S.tx.forEach(function (t) {
    if (Date.now() - t.t < 8000) return;
    if (t.type === 'deposit' && t.status === 'Pending') { t.status = 'Completed'; S.bal[t.cur] += t.amt; ch = true; }
    if (t.type === 'withdraw' && t.status === 'Processing') { t.status = 'Paid'; ch = true; }
  });
  if (ch) { save(); refresh(); }
}

document.addEventListener('click', function (e) {
  var c = e.target.closest('.pair'); if (c) { cur = c.dataset.s; location.hash = 'trade'; }
  var b = e.target.closest('.cp'); if (b) { navigator.clipboard.writeText(b.dataset.c).then(function () { toast('Copied.'); }).catch(function () { toast('Could not copy. Select the text instead.'); }); }
});
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('pair')) { cur = e.target.dataset.s; location.hash = 'trade'; } });
window.addEventListener('hashchange', route);

$('#brand').textContent = C.BRAND; document.title = C.BRAND;
$('#mode').textContent = C.DEMO_MODE ? 'Practice mode: balances are virtual.' : '';
setInterval(function () {
  if (!isLive) P.forEach(function (x) { x.p *= 1 + (Math.random() - .5) * x.v * 2; x.h.push(x.p); x.h.shift(); });
  settle(); live();
}, 1500);
fetchRates(); setInterval(fetchRates, 60000);
if (C.API_BASE) { loadServer(); setInterval(loadServer, 10000); }
route();
})();
