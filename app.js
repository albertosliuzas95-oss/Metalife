const screens = {
  intro: document.getElementById('introScreen'),
  auth: document.getElementById('authScreen'),
  subscription: document.getElementById('subscriptionScreen'),
  dashboard: document.getElementById('dashboardScreen'),
};

const feedback = document.getElementById('feedback');
const state = loadState();

function defaultData() {
  return { users: [], session: { userEmail: null } };
}

function loadState() {
  const raw = localStorage.getItem('metalifeData');
  return raw ? JSON.parse(raw) : defaultData();
}

function saveState() {
  localStorage.setItem('metalifeData', JSON.stringify(state));
}

function currentUser() {
  return state.users.find((user) => user.email === state.session.userEmail) || null;
}

function showScreen(key) {
  Object.values(screens).forEach((screen) => screen.classList.remove('active'));
  screens[key].classList.add('active');
}

function toast(message) {
  feedback.textContent = message;
  feedback.classList.add('show');
  setTimeout(() => feedback.classList.remove('show'), 2200);
}

function formatCurrency(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function parseExpenseText(text) {
  const match = text.toLowerCase().match(/gastei\s+(\d+[\.,]?\d*)\s*(.*)/);
  if (!match) return null;
  return { amount: Number(match[1].replace(',', '.')), category: match[2] ? match[2].trim() : 'outros' };
}

function luhnCheck(number) {
  const digits = number.replace(/\D/g, '').split('').reverse().map(Number);
  if (digits.length < 13) return false;
  const sum = digits.reduce((acc, digit, idx) => {
    if (idx % 2) {
      const doubled = digit * 2;
      return acc + (doubled > 9 ? doubled - 9 : doubled);
    }
    return acc + digit;
  }, 0);
  return sum % 10 === 0;
}

function validateCardForm({ cardName, cardNumber, cardExpiry, cardCvv }) {
  if (!cardName || cardName.length < 3) return 'Nome no cartão inválido.';
  if (!luhnCheck(cardNumber)) return 'Cartão inválido.';
  if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) return 'Validade inválida (MM/AA).';
  if (!/^\d{3,4}$/.test(cardCvv)) return 'CVV inválido.';
  return null;
}

function ensureUserData(user) {
  user.goals ||= ['Economizar 20% da renda', 'Evitar gastos impulsivos em dias úteis'];
  user.expenses ||= [];
  user.chat ||= [];
  user.subscription ||= { active: false, plan: 'pro', startedAt: null };
}

function setActiveTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.tab === tabId));
  document.querySelectorAll('.tab-content').forEach((panel) => panel.classList.toggle('active', panel.id === tabId));
}

function animateBars(byCategory) {
  const root = document.getElementById('categoryBars');
  root.innerHTML = '';
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]).slice(0, 5);
  if (!entries.length) {
    root.innerHTML = '<p class="muted">Sem categorias para exibir.</p>';
    return;
  }

  const topValue = entries[0][1];
  entries.forEach(([category, amount]) => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.innerHTML = `
      <span>${category}</span>
      <div class="bar-track"><div class="bar-fill"></div></div>
      <strong>${formatCurrency(amount)}</strong>
    `;
    root.appendChild(row);
    requestAnimationFrame(() => {
      row.querySelector('.bar-fill').style.width = `${Math.max(8, (amount / topValue) * 100)}%`;
    });
  });
}

function updateCharts(user, totalExpenses, savingRate) {
  const byCategory = user.expenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});

  const ring = document.getElementById('savingRing');
  const ringLabel = document.getElementById('savingRingLabel');
  const safeRate = Math.max(0, Math.min(100, Number(savingRate.toFixed(1))));
  ring.style.setProperty('--p', safeRate);
  ringLabel.textContent = `${safeRate.toFixed(1)}%`;

  animateBars(byCategory);

  const report = document.getElementById('monthlyReport');
  const lines = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => `• ${category}: ${formatCurrency(amount)}`);
  const saldo = user.income - totalExpenses;

  report.innerHTML = `
    <strong>${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</strong><br>
    Receita: ${formatCurrency(user.income)}<br>
    Gastos: ${formatCurrency(totalExpenses)}<br>
    Saldo: ${formatCurrency(saldo)}<br><br>
    <strong>Resumo por categoria</strong><br>
    ${lines.length ? lines.join('<br>') : 'Sem gastos registrados ainda.'}
  `;
}

function renderChat(user) {
  const chatLog = document.getElementById('chatLog');
  chatLog.innerHTML = '';
  user.chat.slice(-20).forEach((message) => {
    const p = document.createElement('p');
    p.className = `msg ${message.role}`;
    p.textContent = message.text;
    chatLog.appendChild(p);
  });
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderDashboard() {
  const user = currentUser();
  if (!user) return;
  ensureUserData(user);

  document.getElementById('welcomeBadge').textContent = `Olá, ${user.name}`;
  document.getElementById('subscriptionStatus').textContent = user.subscription.active
    ? 'Assinatura ativa • Plano Pro'
    : 'Assinatura inativa';

  const totalExpenses = user.expenses.reduce((sum, item) => sum + item.amount, 0);
  const balance = user.income - totalExpenses;
  const savingRate = user.income > 0 ? (balance / user.income) * 100 : 0;

  document.getElementById('kpiIncome').textContent = formatCurrency(user.income);
  document.getElementById('kpiExpenses').textContent = formatCurrency(totalExpenses);
  document.getElementById('kpiBalance').textContent = formatCurrency(balance);
  document.getElementById('kpiSavingRate').textContent = `${Math.max(0, savingRate).toFixed(1)}%`;

  const goalList = document.getElementById('goalList');
  goalList.innerHTML = '';
  user.goals.forEach((goal) => {
    const li = document.createElement('li');
    li.textContent = goal;
    goalList.appendChild(li);
  });

  const expenseHistory = document.getElementById('expenseHistory');
  expenseHistory.innerHTML = '';
  user.expenses.slice().reverse().forEach((item) => {
    const li = document.createElement('li');
    li.textContent = `${item.date} • ${item.category} • ${formatCurrency(item.amount)}`;
    expenseHistory.appendChild(li);
  });

  renderChat(user);
  updateCharts(user, totalExpenses, savingRate);
}

function routeAfterAuth() {
  const user = currentUser();
  if (!user) return showScreen('auth');
  ensureUserData(user);
  if (!user.subscription.active) return showScreen('subscription');
  showScreen('dashboard');
  setActiveTab('overviewTab');
  renderDashboard();
}

document.querySelector('[data-action="start"]').addEventListener('click', () => showScreen('auth'));

document.getElementById('tabNav').addEventListener('click', (event) => {
  const btn = event.target.closest('.tab-btn');
  if (!btn) return;
  setActiveTab(btn.dataset.tab);
});

document.getElementById('registerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim().toLowerCase();
  const password = document.getElementById('regPassword').value;
  const income = Number(document.getElementById('regIncome').value);

  if (password.length < 6) return toast('Senha deve ter no mínimo 6 caracteres.');
  if (state.users.some((user) => user.email === email)) return toast('E-mail já cadastrado.');

  state.users.push({ name, email, password, income, goals: [], expenses: [], chat: [] });
  state.session.userEmail = email;
  saveState();
  toast('Conta criada com sucesso!');
  routeAfterAuth();
});

document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;

  const user = state.users.find((item) => item.email === email && item.password === password);
  if (!user) return toast('Credenciais inválidas.');

  state.session.userEmail = email;
  saveState();
  toast('Login realizado!');
  routeAfterAuth();
});

document.getElementById('subscriptionForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const user = currentUser();
  if (!user) return toast('Crie/acesse uma conta para assinar.');

  const payload = {
    cardName: document.getElementById('cardName').value.trim(),
    cardNumber: document.getElementById('cardNumber').value.trim(),
    cardExpiry: document.getElementById('cardExpiry').value.trim(),
    cardCvv: document.getElementById('cardCvv').value.trim(),
  };
  const error = validateCardForm(payload);
  if (error) return toast(error);

  user.subscription = {
    active: true,
    plan: 'pro',
    startedAt: new Date().toISOString(),
    paymentLast4: payload.cardNumber.replace(/\D/g, '').slice(-4),
  };

  saveState();
  toast('Assinatura confirmada com sucesso!');
  routeAfterAuth();
});

document.getElementById('goalForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const user = currentUser();
  const goalInput = document.getElementById('goalInput');
  const goal = goalInput.value.trim();
  if (!goal) return;

  user.goals.push(goal);
  goalInput.value = '';
  saveState();
  renderDashboard();
  toast('Meta adicionada!');
});

document.getElementById('chatForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const user = currentUser();
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  user.chat.push({ role: 'user', text: `Você: ${text}` });
  const expense = parseExpenseText(text);

  if (expense && expense.amount > 0) {
    user.expenses.push({
      amount: expense.amount,
      category: expense.category || 'outros',
      date: new Date().toLocaleDateString('pt-BR'),
    });
    user.chat.push({ role: 'bot', text: `Bot: Anotado! ${formatCurrency(expense.amount)} em ${expense.category}.` });
  } else {
    const total = user.expenses.reduce((sum, item) => sum + item.amount, 0);
    user.chat.push({ role: 'bot', text: `Bot: Seu total gasto no mês está em ${formatCurrency(total)}.` });
  }

  input.value = '';
  saveState();
  renderDashboard();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  state.session.userEmail = null;
  saveState();
  toast('Sessão encerrada.');
  showScreen('auth');
});

routeAfterAuth();
