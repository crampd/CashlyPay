/* global Chart */

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function formatCurrency(amount = 0, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount / 100);
}

function updateStatCards(summary) {
  const balanceCanvas = document.getElementById('balanceChart');
  if (balanceCanvas) {
    const balanceValue = balanceCanvas.closest('.stats-card')?.querySelector('.stats-value');
    if (balanceValue) {
      balanceValue.textContent = formatCurrency(summary.openAmount, summary.currency);
    }
  }

  const revenueCanvas = document.getElementById('revenueChart');
  if (revenueCanvas) {
    const revenueValue = revenueCanvas.closest('.stats-card')?.querySelector('.stats-value');
    if (revenueValue) {
      revenueValue.textContent = formatCurrency(summary.totalRevenue, summary.currency);
    }
  }

  const overdueCanvas = document.getElementById('invoicesChart');
  if (overdueCanvas) {
    const overdueValue = overdueCanvas.closest('.stats-card')?.querySelector('.stats-value');
    if (overdueValue) {
      overdueValue.textContent = formatCurrency(summary.overdueAmount, summary.currency);
    }
  }
}

function buildLineChart(ctx, labels, datasetLabel, data, color) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: datasetLabel,
          data,
          borderColor: color,
          backgroundColor: `${color}33`,
          tension: 0.4,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });
}

function buildBarChart(ctx, labels, data, colors) {
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Invoices',
          data,
          backgroundColor: colors,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { beginAtZero: true },
      },
    },
  });
}

function groupPaymentsByDate(payments = []) {
  const grouped = payments.reduce((acc, payment) => {
    const dateLabel = new Date(payment.createdAt).toLocaleDateString();
    const amount = payment.totalMoney?.amount || 0;
    acc[dateLabel] = (acc[dateLabel] || 0) + amount;
    return acc;
  }, {});

  const labels = Object.keys(grouped);
  const values = labels.map((label) => grouped[label]);

  return { labels, values };
}

function updatePaymentsList(payments = [], currency = 'USD') {
  const container = document.querySelector('.transaction-list');
  if (!container) return;
  container.innerHTML = '';

  if (!payments.length) {
    const empty = document.createElement('p');
    empty.className = 'transaction-empty';
    empty.textContent = 'No recent payments found.';
    container.appendChild(empty);
    return;
  }

  payments.forEach((payment) => {
    const card = document.createElement('div');
    card.className = 'transaction-card';

    const icon = document.createElement('div');
    icon.className = 'transaction-icon';
    icon.textContent = payment.cardDetails ? '💳' : '💵';

    const details = document.createElement('div');
    details.className = 'transaction-details';

    const title = document.createElement('div');
    title.className = 'transaction-title';
    title.textContent = payment.note || payment.id || 'Payment';

    const date = document.createElement('div');
    date.className = 'transaction-date';
    date.textContent = new Date(payment.createdAt).toLocaleString();

    const amount = document.createElement('div');
    amount.className = 'transaction-amount positive';
    const totalMoney = payment.totalMoney || { amount: 0, currency };
    amount.textContent = `+${formatCurrency(totalMoney.amount, totalMoney.currency || currency)}`;

    details.appendChild(title);
    details.appendChild(date);

    card.appendChild(icon);
    card.appendChild(details);
    card.appendChild(amount);

    container.appendChild(card);
  });
}

function initQuickActions() {
  document.querySelector('[data-action="new-invoice"]')?.addEventListener('click', () => {
    window.location.href = '/';
  });

  document.querySelector('[data-action="send-reminder"]')?.addEventListener('click', () => {
    alert('Schedule automated reminders by editing an invoice in Square Dashboard.');
  });

  document.querySelector('[data-action="generate-report"]')?.addEventListener('click', () => {
    alert('Custom reporting coming soon. Connect to Square Reports for now.');
  });
}

async function bootstrapDashboard() {
  const locationId = window.cashlypay?.locationId;
  if (!locationId) return;

  try {
    const [summaryPayload, paymentsPayload] = await Promise.all([
      fetchJson(`/api/analytics/summary/${locationId}`),
      fetchJson('/api/analytics/payments?limit=10'),
    ]);

    const summary = summaryPayload.summary;
    const payments = paymentsPayload.payments;

    updateStatCards(summary);
    updatePaymentsList(payments, summary.currency);

    const invoicesByStatusCtx = document.getElementById('balanceChart')?.getContext('2d');
    const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
    const overdueCtx = document.getElementById('invoicesChart')?.getContext('2d');
    const cashFlowCtx = document.getElementById('cashFlowChart')?.getContext('2d');

    buildBarChart(
      invoicesByStatusCtx,
      ['Open', 'Paid', 'Overdue'],
      [summary.openAmount, summary.totalRevenue, summary.overdueAmount].map((value) => value / 100),
      ['#ffbd2e', '#00d54b', '#ff3b30']
    );

    const paymentsSeries = groupPaymentsByDate(payments);

    buildLineChart(
      revenueCtx,
      paymentsSeries.labels,
      'Revenue',
      paymentsSeries.values.map((value) => value / 100),
      '#00d54b'
    );

    buildBarChart(
      overdueCtx,
      ['Open', 'Paid', 'Overdue'],
      [summary.openCount, summary.paidCount, summary.overdueCount],
      ['#ffbd2e', '#00d54b', '#ff3b30']
    );

    buildLineChart(
      cashFlowCtx,
      paymentsSeries.labels,
      'Cash Flow',
      paymentsSeries.values.map((value) => value / 100),
      '#4c6ef5'
    );
  } catch (error) {
    console.error('Failed to load dashboard data', error);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initQuickActions();
  bootstrapDashboard();
});
