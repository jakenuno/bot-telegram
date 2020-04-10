require('dotenv').config();
const TeleBot = require('telebot');
const bot = new TeleBot(process.env.TOKEN_TELEGRAM_API);
const fetch = require('node-fetch');

// On command "start"
bot.on('/start', function (data) {
    return bot.sendMessage(data.chat.id, "Hola, soy JakeNunoTest. Agregame a un grupo y como administrador😈, es hora de divertirnos.");
});

// On command "info"
bot.on('/info', function (data) {
    return bot.sendMessage(data.chat.id, "Hola, soy JakeNunoTest, un simple bot😇 \nTe recomiendo ver las reglas de este grupo en: /rules");
});

// On command "rules"
bot.on('/rules', function (data) {
    return bot.sendMessage(data.chat.id,  "• No spam \n• No groserías \n• No contenido para adultos \nEl desconocimiento de estas reglas no te exenta de su cumplimiento.");
});

// On command "bitcoin_price"
bot.on('/bitcoin_price', function (data) {
    fetch('https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=MXN,EUR,USD')
        .then(res => res.json())
        .then(res => {
            return bot.sendMessage(data.chat.id,  `Precio actual del bitcoin: \n • 1 BTC = ${res.MXN} MXN \n • 1 BTC = ${res.EUR} EUR \n • 1 BTC = ${res.USD} USD`);
        })
        .catch(err => console.error(err));
});

// detect if someone just joined
bot.on('newChatMembers', function (data) {
    if (data.new_chat_member != undefined) {
        if(data.new_chat_member.username != undefined) {
            return bot.sendMessage(data.chat.id, `¡Bienvenido al grupo @${data.new_chat_member.username}! no olvides seguir las /rules`);
        } else {
            return bot.sendMessage(data.chat.id, `¡Bienvenido al grupo ${data.new_chat_member.first_name}! no olvides seguir las /rules`);
        }
    }
});

// Start getting updates
bot.start();