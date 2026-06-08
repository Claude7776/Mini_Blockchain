// ── Utils ──────────────────────────────────────────────────
function esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtDate(ts) {
    return new Date(ts * 1000).toLocaleString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function showMsg(id, text, ok = true) {
    const el = document.getElementById(id);
    el.innerHTML = `<span>${esc(text)}</span>`;
    el.className = 'msg ' + (ok ? 'msg-ok' : 'msg-err');
}

function clearMsg(id) {
    const el = document.getElementById(id);
    el.innerHTML = '';
    el.className = '';
}

// ── Tabs ───────────────────────────────────────────────────
function showTab(name) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => {
        if (l.getAttribute('onclick')?.includes(name)) l.classList.add('active');
    });
    if (name === 'explorer') loadAll();
    if (name === 'trade') loadRecentTxs();
}

// ── Chain ──────────────────────────────────────────────────
let allBlocks = [];

async function loadChain() {
    const [chainRes, validRes] = await Promise.all([
        fetch('/chain'), fetch('/validate')
    ]);
    allBlocks = await chainRes.json();
    const valid = await validRes.json();

    // Stats bar
    document.getElementById('stat-blocks').textContent = allBlocks.length;

    // Status pill
    const pill = document.getElementById('chain-status-badge');
    pill.textContent = valid.valid ? 'Chaîne valide' : 'Chaîne corrompue !';
    pill.className = 'status-pill ' + (valid.valid ? 'ok' : 'err');

    // Table
    const tbody = document.getElementById('chain-table');
    tbody.innerHTML = '';

    [...allBlocks].reverse().forEach(b => {
        const txCount = Array.isArray(b.txs) ? b.txs.length : '—';
        const tr = document.createElement('tr');
        tr.onclick = () => openModal(b);
        tr.innerHTML = `
            <td><span class="block-num">#${esc(b.index)}</span></td>
            <td><span class="hash-cell" title="${esc(b.hash)}">${esc(b.hash)}</span></td>
            <td><span class="hash-cell muted" title="${esc(b.prev_hash)}">${esc(b.prev_hash)}</span></td>
            <td><span class="nonce-val">${esc(b.nonce)}</span></td>
            <td><span class="tx-count">${txCount}</span></td>
            <td><span class="date-val">${esc(fmtDate(b.timestamp))}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// ── Pending ────────────────────────────────────────────────
async function loadPending() {
    const res = await fetch('/pending');
    const txs = await res.json();

    document.getElementById('stat-pending').textContent = txs.length;
    document.getElementById('pending-count').textContent = txs.length;

    const list = document.getElementById('pending-list');
    list.innerHTML = '';

    if (!txs.length) {
        list.innerHTML = '<p class="empty-state">Aucune transaction en attente</p>';
        return;
    }

    txs.forEach(t => {
        const div = document.createElement('div');
        div.className = 'tx-row';
        div.innerHTML = `
            <span class="tx-addr">${esc(t.sender)}</span>
            <span class="tx-arrow">→</span>
            <span class="tx-addr">${esc(t.receiver)}</span>
            <span class="tx-amount">+${esc(t.amount)} SCoin</span>
        `;
        list.appendChild(div);
    });
}

async function loadAll() {
    await Promise.all([loadChain(), loadPending()]);
}

// ── Recent TXs (trade tab) ─────────────────────────────────
async function loadRecentTxs() {
    await loadChain();
    const container = document.getElementById('recent-txs');
    container.innerHTML = '';

    const txs = [];
    [...allBlocks].reverse().forEach(b => {
        if (Array.isArray(b.txs)) b.txs.forEach(t => txs.push({ ...t, block: b.index }));
    });

    if (!txs.length) {
        container.innerHTML = '<p class="empty-state">Aucune transaction confirmée</p>';
        return;
    }

    txs.slice(0, 30).forEach(t => {
        const div = document.createElement('div');
        div.className = 'tx-row';
        div.innerHTML = `
            <span class="tx-addr">${esc(t.sender)}</span>
            <span class="tx-arrow">→</span>
            <span class="tx-addr">${esc(t.receiver)}</span>
            <span class="tx-amount">+${esc(t.amount)} SCoin</span>
        `;
        container.appendChild(div);
    });
}

// ── Send TX ────────────────────────────────────────────────
async function sendTx() {
    const sender   = document.getElementById('sender').value.trim();
    const receiver = document.getElementById('receiver').value.trim();
    const amount   = parseFloat(document.getElementById('amount').value);

    if (!sender || !receiver || isNaN(amount) || amount <= 0) {
        showMsg('tx-msg', 'Remplis tous les champs correctement.', false);
        return;
    }

    try {
        const res = await fetch('/tx', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sender, receiver, amount }),
        });
        const data = await res.json();
        if (res.ok) {
            showMsg('tx-msg', `Transaction envoyée : ${amount} SCoin de ${sender} → ${receiver}`, true);
            document.getElementById('sender').value = '';
            document.getElementById('receiver').value = '';
            document.getElementById('amount').value = '';
            loadPending();
        } else {
            showMsg('tx-msg', data.error || 'Erreur inconnue', false);
        }
    } catch {
        showMsg('tx-msg', 'Impossible de joindre le serveur.', false);
    }
}

// ── Mine ───────────────────────────────────────────────────
async function mine() {
    const miner = document.getElementById('miner-address').value.trim() || 'anonymous';
    clearMsg('mine-msg');
    try {
        const res = await fetch('/mine', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ miner }),
        });
        const data = await res.json();
        if (res.ok) {
            showMsg('mine-msg', `Bloc #${data.block.index} miné ! Nonce : ${data.block.nonce}`, true);
            loadAll();
        } else {
            showMsg('mine-msg', data.error || 'Erreur inconnue', false);
        }
    } catch {
        showMsg('mine-msg', 'Impossible de joindre le serveur.', false);
    }
}

// ── Balance ────────────────────────────────────────────────
async function checkBalance() {
    const address = document.getElementById('balance-address').value.trim();
    if (!address) return;
    const res = await fetch('/balance/' + encodeURIComponent(address));
    const data = await res.json();
    document.getElementById('balance-result').innerHTML = `
        <div class="balance-amount">${esc(data.balance)} <small>${esc(data.currency)}</small></div>
        <div class="balance-addr">${esc(data.address)}</div>
    `;
}

// ── Modal ──────────────────────────────────────────────────
function openModal(b) {
    document.getElementById('modal-title').textContent = `Bloc #${b.index}`;

    const txList = Array.isArray(b.txs)
        ? b.txs.map(t => `
            <div class="modal-tx-item">
                <span class="tx-addr">${esc(t.sender)}</span>
                <span class="tx-arrow">→</span>
                <span class="tx-addr">${esc(t.receiver)}</span>
                <span class="tx-amount">+${esc(t.amount)} SCoin</span>
            </div>`).join('')
        : `<div class="modal-tx-item"><span style="color:var(--muted)">${esc(b.txs)}</span></div>`;

    document.getElementById('modal-body').innerHTML = `
        <div class="detail-row">
            <span class="detail-label">Hash</span>
            <span class="detail-val yellow">${esc(b.hash)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Hash précédent</span>
            <span class="detail-val">${esc(b.prev_hash)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Timestamp</span>
            <span class="detail-val">${esc(fmtDate(b.timestamp))}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Nonce</span>
            <span class="detail-val">${esc(b.nonce)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Difficulté</span>
            <span class="detail-val">${esc(b.difficulty)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Transactions (${Array.isArray(b.txs) ? b.txs.length : 0})</span>
            <div class="modal-tx-list">${txList}</div>
        </div>
    `;

    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Init ───────────────────────────────────────────────────
loadAll();
