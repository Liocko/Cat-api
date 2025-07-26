const https = require('https');

const BOT_TOKEN = '8171322819:AAE69XsNvS9vWss7UwhXUilwOdoALjgvpS0';
const CHAT_ID = '@CatApiAlerts';

function sendTelegramMessage(message, useMarkdown = false) {
  const data = JSON.stringify({
    chat_id: CHAT_ID,
    text: message,
    ...(useMarkdown && { parse_mode: 'Markdown' })
  });

  const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${BOT_TOKEN}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      console.log('Telegram message sent successfully!');
      console.log('Response:', responseData);
    });
  });

  req.on('error', (error) => {
    console.error('Error sending Telegram message:', error);
  });

  req.on('response', (res) => {
    if (res.statusCode !== 200) {
      console.error('Telegram API error:', res.statusCode);
    }
  });

  req.write(data);
  req.end();
}

// Приветственное сообщение
const welcomeMessage = `CAT ALERT BOT IS ONLINE!\n\n"Hello! I'm your Cat Service monitoring bot."\n\nWhat I monitor:\n- 5xx errors (critical)\n- High latency (>1s)\n- No traffic\n- 4xx errors (>10 in 5min)\n- Slow external cat API\n\nCurrent Status: All systems operational\n\nI'll notify you immediately if anything goes wrong with our cat service!\n\nBot started at: ${new Date().toLocaleString()}`;

// Отправляем приветственное сообщение
console.log('Sending welcome message to Telegram...');
sendTelegramMessage(welcomeMessage, false);

// Также отправляем тестовое сообщение через 5 секунд
setTimeout(() => {
  const testMessage = `TEST ALERT\n\nThis is a test message to verify that the alert system is working properly.\n\nTest Details:\n- Type: System test\n- Status: Working\n- Time: ${new Date().toLocaleString()}\n\nIf you received this message, the alert system is ready!`;
  sendTelegramMessage(testMessage, false);
}, 5000);

// Держим контейнер запущенным
console.log('Telegram bot initialization completed. Container will stay running...');
setInterval(() => {
  // Периодически проверяем, что контейнер жив
  console.log('Telegram bot is alive...');
}, 300000); // каждые 5 минут 