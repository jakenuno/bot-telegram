require('dotenv').config();
const TeleBot = require('telebot');
const bot = new TeleBot(process.env.TOKEN_TELEGRAM_API);
const urlRegex = require('url-regex');
const fs = require('fs');
var i18n = require("i18n");
const fetch = require('node-fetch');
var directory = 'data_en';
var allowSend = true;

i18n.configure({
    locales:['en_US', 'es_MX'],
    directory: __dirname + '/locales',
    defaultLocale: 'en_US',
    register: global
});

// On command "info"
bot.on('/info', function (data) {
    getLanguage(data);
    return bot.sendMessage(data.chat.id, __('info'));
})

// On command "rules"
bot.on('/rules', function (data) {
    getLanguage(data);

    return bot.sendMessage(data.chat.id,  __('rules'));
})

// On command "help"
bot.on('/help', function (data) {
    getLanguage(data);

    return bot.sendMessage(data.chat.id,  __('help'));
})

// detect if someone just joined
bot.on('newChatMembers', function (data) {
    getLanguage(data);

    if (data.new_chat_member != undefined) {
        if(data.new_chat_member.username != undefined) {
            bot.sendMessage(data.chat.id, __('newChatMembers.username', data.new_chat_member.username));
        } else {
            bot.sendMessage(data.chat.id, __('newChatMembers.first_name', data.new_chat_member.first_name));
        }
    }
})

bot.on('forward', function (data) {
    console.log('forwardMessage')
    if(data.from.username != undefined) {
    bot.sendMessage(data.chat.id, __('forwardMessage.username', data.from.username), { reply: data.message_id })
        .then(d => {
            return;
        });
    } else {
    bot.sendMessage(data.chat.id, __('forwardMessage.first_name', data.from.first_name), { reply: data.message_id })
        .then(d => {
            return;
        });
    }

    bot.deleteMessage(data.chat.id, data.message_id)
        .then(data => {
            return;
        });
    return;
})

// Log every text message
bot.on('text', function (data) {
    // data_es 0 -> groserias
    // data_es 1 -> /price
    // data_es 2 -> /howToBuy
    // data_en 0 -> insults
    // data_en 1 -> /price
    // data_en 2 -> /howToBuy

    let index = null;
    getLanguage(data);

    if(data.entities != undefined) {
        if(regexJakeNunoCoin(data.text)) {
            warnUser(data, __('spam'));
            return;
        }
    }

    for (var i = 0; i < 3; i++) {
        if(checkContent(data, i, directory)) {
            index = i;
            break;
        }
    }
    switch (index) {
        case 0:
            warnUser(data, __('insult'));
            break;
        case 1:
            sendFAQ(data, 1);
            break;
        case 2:
            sendFAQ(data, 2);
            break;
        default:
            break;
    }
})

// Start getting updates
bot.start();

// checks for content forbidden
function checkContent(data, typeofContent, directory) {
    let text = data.text.toLowerCase();
    var dataJson = fs.readFileSync('data.json');
    var list = JSON.parse(dataJson);
    var array = Object.keys(list[directory]).map(function(k) { 
                    return list[directory][k];
                });
    try {
        for (var i = 0, len = array[typeofContent].length; i < len; i++) {
            if(text.indexOf(array[typeofContent][i]) != -1) {
                return true;
            }
        }
    }
    catch(err) {
        console.log('checkContent(): ', err.message);
    }
}

function regexJakeNunoCoin(text) {
    let pattJakeNunoCoin = new RegExp('.*(jakenunocoin).*');
    let pattYoutube = new RegExp('.*(youtube).*');
    let array = ['https://t.me/joinchat/hixsxhc6dxsm2c2zxs3wkw', 'https://t.me/joinchat/hu8281cbxcndycg10wzklw'];
    text = text.toLowerCase();
    let matches = text.match(urlRegex({strict: false}));
    if(matches != null) {
        try {
            for (var i = 0, len = matches.length; i < len; i++) {
                if(!pattJakeNunoCoin.test(matches[i]) && !pattYoutube.test(matches[i])) {
                    if(array.indexOf(matches[i]) == -1) {
                        return true;
                    }
                }
            }
        }
        catch(err) {
            console.log('regexJakeNunoCoin(): ', err.message);
        }
    }
}

async function replyAndDelete(data, fault, times) {
    console.log('username: ', data.from.username, '| fault: ',  fault, '| times: ', times);
    if(data.from.username != undefined) {
        await bot.sendMessage(data.chat.id, __('replyAndDelete.username', fault, data.from.username, times), { reply: data.message_id })
            .then(d => {
                return;
            });
    } else {
        await bot.sendMessage(data.chat.id, __('replyAndDelete.first_name', fault, data.from.first_name, times), { reply: data.message_id })
            .then(d => {
                return;
            });
    }

    await bot.deleteMessage(data.chat.id, data.message_id)
        .then(data => {
            return;
        });
    return;
}

function warnUser(data, fault) {
    var dataJson = () => {
        try {
            var userString = fs.readFileSync('warnedUsers.json');
            return warned = JSON.parse(userString);
        } catch (e) {
            return [];
        }
    }

    try {
        var warnedUsers = dataJson();
        var existUser = warnedUsers.find((warnedUsers) => warnedUsers.id == data.from.id);
        if (existUser != undefined) {
            if(existUser.times == 2) {
                try {
                    bot.deleteMessage(data.chat.id, data.message_id);
                    bot.kickChatMember(data.chat.id, data.from.id);
                } catch (e) {
                    console.log('kickChatMember(): ', e);
                }
            } else {
                warnedUsers.find((warnedUsers) => warnedUsers.id == data.from.id).times++;
                let times = warnedUsers.find((warnedUsers) => warnedUsers.id == data.from.id).times;
                fs.writeFileSync('warnedUsers.json', JSON.stringify(warnedUsers));
                replyAndDelete(data, fault, times);
            }
        } else {
            var user = {
                id: data.from.id,
                times: 1
            };
            warnedUsers.push(user);
            fs.writeFileSync('warnedUsers.json', JSON.stringify(warnedUsers));
            replyAndDelete(data, fault, user.times);
        }
    } catch (e) {
        console.log('error: ', e);
    }
}

function sendFAQ(data, typeofFAQ) {
    if(typeofFAQ === 1) {
        fetch('https://min-api.cryptocompare.com/data/price?fsymETH&tsyms=MXN,USD,EUR')
            .then(res => res.json())
            .then(res => {
                return bot.sendMessage(data.chat.id,  __('price.especific', '30 %', res.USD, (res.USD/50000).toFixed(5), res.EUR, (res.EUR/50000).toFixed(5), res.MXN, (res.MXN/50000).toFixed(5)))
            })
            .catch(err => console.error(err));
    } else {
        if(allowSend) {
          allowSend = false;
          changeStatus();
          return bot.sendMessage(data.chat.id, __('howToBuy'));
        }
    }
}

function getLanguage(data) {
    if(data.chat.id == process.env.ES_CHAT_ID) {
        i18n.setLocale('es_MX');
        directory = 'data_es';
    } else {
        i18n.setLocale('en_US');
        directory = 'data_en';
    }
}

function changeStatus () {
  setTimeout(function() {
    allowSend = true;
  }, 120000);
}