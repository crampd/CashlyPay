const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const questions = [
  {
    key: 'BOT_TOKEN',
    question: 'Enter your Telegram Bot Token: '
  },
  {
    key: 'STRIPE_SECRET_KEY',
    question: 'Enter your Stripe Secret Key: '
  },
  {
    key: 'WEBHOOK_SECRET',
    question: 'Enter your Stripe Webhook Secret: '
  },
  {
    key: 'ADMINS',
    question: 'Enter admin Telegram user IDs (comma-separated): '
  }
];

const answers = {};

function ask(index = 0) {
  if (index === questions.length) {
    // Write to .env
    const envContent = questions.map(q => `${q.key}=${answers[q.key]}`).join('\n');
    const envPath = path.join(__dirname, '..', '.env');
    fs.writeFileSync(envPath, envContent);
    console.log(`\n✅ .env file created at ${envPath}\n`);
    rl.close();
    return;
  }
  rl.question(questions[index].question, answer => {
    answers[questions[index].key] = answer.trim();
    ask(index + 1);
  });
}

console.log('--- Cashly .env Setup ---');
ask();