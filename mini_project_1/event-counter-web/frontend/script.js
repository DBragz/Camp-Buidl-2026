const COUNTER_ABI = [
  'event ThresholdReached(uint256 number, uint256 threshold)',
  'function number() view returns (uint256)',
  'function name() view returns (string)',
  'function description() view returns (string)',
  'function threshold() view returns (uint256)',
  'function increment()'
];

let provider = null;
let contract = null;
let listener = null;
let walletProvider = null;
let signer = null;
let refreshIntervalId = null;

const contractAddressEl = document.getElementById('contractAddress');
const rpcUrlEl = document.getElementById('rpcUrl');
const btnStart = document.getElementById('btnStart');
const btnStop = document.getElementById('btnStop');
const btnConnect = document.getElementById('btnConnect');
const btnIncrement = document.getElementById('btnIncrement');
const statusEl = document.getElementById('status');
const eventDetailEl = document.getElementById('eventDetail');
const errorEl = document.getElementById('error');
const counterNameEl = document.getElementById('counterName');
const counterDescriptionEl = document.getElementById('counterDescription');
const counterNumberEl = document.getElementById('counterNumber');
const counterThresholdEl = document.getElementById('counterThreshold');
const thresholdOverlayEl = document.getElementById('thresholdOverlay');
const celebrationDetailEl = document.getElementById('celebrationDetail');
const confettiContainerEl = document.getElementById('confettiContainer');
const btnDismissCelebration = document.getElementById('btnDismissCelebration');
const btnRefresh = document.getElementById('btnRefresh');

function showError(msg) {
  errorEl.textContent = msg || '';
  errorEl.classList.toggle('hidden', !msg);
}

function setStatus(text, className) {
  statusEl.textContent = text;
  statusEl.className = 'status ' + (className || '');
  if (className === 'triggered') {
    eventDetailEl.classList.remove('hidden');
  }
}

async function refreshCounterState() {
  if (!contract || !counterNameEl) return;
  try {
    const [name, desc, num, thresh] = await Promise.all([
      contract.name(),
      contract.description(),
      contract.number(),
      contract.threshold()
    ]);
    counterNameEl.textContent = (name != null && name !== '') ? String(name) : '—';
    counterDescriptionEl.textContent = (desc != null && desc !== '') ? String(desc) : '—';
    counterNumberEl.textContent = num != null && num !== undefined ? String(num) : '—';
    counterThresholdEl.textContent = thresh != null && thresh !== undefined ? String(thresh) : '—';
  } catch (e) {
    counterNameEl.textContent = '—';
    counterDescriptionEl.textContent = '—';
    counterNumberEl.textContent = '—';
    counterThresholdEl.textContent = '—';
    throw e;
  }
}

const CONFETTI_COLORS = ['#34d399', '#6366f1', '#fbbf24', '#f87171', '#22d3ee', '#a78bfa'];
function createConfetti() {
  confettiContainerEl.innerHTML = '';
  for (let i = 0; i < 40; i++) {
    const span = document.createElement('span');
    span.style.left = Math.random() * 100 + '%';
    span.style.top = '-10px';
    span.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    span.style.animationDelay = Math.random() * 0.5 + 's';
    span.style.animationDuration = (1.5 + Math.random() * 1) + 's';
    confettiContainerEl.appendChild(span);
  }
}
function showThresholdAnimation(number, threshold) {
  celebrationDetailEl.textContent = 'number = ' + number + ', threshold = ' + threshold;
  createConfetti();
  thresholdOverlayEl.classList.remove('hidden');
  thresholdOverlayEl.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => thresholdOverlayEl.classList.add('visible'));
}
function hideThresholdAnimation() {
  thresholdOverlayEl.classList.remove('visible');
  thresholdOverlayEl.classList.add('hidden');
  thresholdOverlayEl.setAttribute('aria-hidden', 'true');
}

function getProvider() {
  const rpc = (rpcUrlEl.value || '').trim();
  if (rpc) return new ethers.JsonRpcProvider(rpc);
  return new ethers.JsonRpcProvider('https://rpc.sepolia.org');
}

btnStart.addEventListener('click', async () => {
  const address = (contractAddressEl.value || '').trim();
  if (!address) {
    setStatus('Please enter a contract address.', 'waiting');
    showError('Contract address required.');
    return;
  }
  if (!ethers.isAddress(address)) {
    setStatus('Invalid address.', 'waiting');
    showError('Invalid Ethereum address.');
    return;
  }
  showError('');
  try {
    provider = getProvider();
    contract = new ethers.Contract(address, COUNTER_ABI, provider);
    await refreshCounterState();
    setStatus('Listening for ThresholdReached…', 'waiting');
    eventDetailEl.classList.add('hidden');
    eventDetailEl.textContent = '';
    hideThresholdAnimation();

    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = setInterval(() => {
      refreshCounterState().catch(() => {});
    }, 5000);

    if (listener) contract.off('ThresholdReached', listener);
    // Only the ThresholdReached event drives the animation and triggered status.
    // We never compare number to threshold in the frontend to show the overlay.
    listener = (number, threshold) => {
      setStatus('Event triggered!', 'triggered');
      eventDetailEl.textContent = `number = ${number.toString()}, threshold = ${threshold.toString()}`;
      eventDetailEl.classList.remove('hidden');
      showThresholdAnimation(number.toString(), threshold.toString());
      refreshCounterState();
    };
    contract.on('ThresholdReached', listener);
  } catch (e) {
    setStatus('Error starting listener.', 'waiting');
    showError(e.message || String(e));
    if (refreshIntervalId) clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
});

btnStop.addEventListener('click', () => {
  if (contract && listener) {
    contract.off('ThresholdReached', listener);
    listener = null;
  }
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
    refreshIntervalId = null;
  }
  setStatus('Stopped.', 'waiting');
  eventDetailEl.classList.add('hidden');
});

if (btnRefresh) {
  btnRefresh.addEventListener('click', async () => {
    if (!contract) {
      showError('Start listening first.');
      return;
    }
    showError('');
    setStatus('Refreshing…', 'waiting');
    try {
      await refreshCounterState();
      setStatus('Listening for ThresholdReached…', 'waiting');
    } catch (e) {
      showError('Could not load counter: ' + (e.message || String(e)));
      setStatus('Refresh failed.', 'waiting');
    }
  });
}

btnConnect.addEventListener('click', async () => {
  try {
    walletProvider = new ethers.BrowserProvider(window.ethereum);
    await walletProvider.send('eth_requestAccounts', []);
    signer = await walletProvider.getSigner();
    setStatus('Wallet connected. You can use Increment.', 'waiting');
    showError('');
  } catch (e) {
    showError(e.message || String(e));
  }
});

btnDismissCelebration.addEventListener('click', hideThresholdAnimation);

btnIncrement.addEventListener('click', async () => {
  const address = (contractAddressEl.value || '').trim();
  if (!address || !ethers.isAddress(address)) {
    showError('Enter a valid contract address first.');
    return;
  }
  if (!signer) {
    showError('Connect wallet first.');
    return;
  }
  try {
    const contractWithSigner = new ethers.Contract(address, COUNTER_ABI, signer);
    const tx = await contractWithSigner.increment();
    setStatus('Increment sent. Waiting for confirmation…', 'waiting');
    await tx.wait();
    setStatus('Increment confirmed. Listening for events…', 'waiting');
    await refreshCounterState();
    showError('');
  } catch (e) {
    showError(e.message || String(e));
  }
});
