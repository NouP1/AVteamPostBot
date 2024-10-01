const {formatTimestamp} = require('../helpers/formatters')
const TelegramApi = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.TOKEN;
const channelAll = process.env.CH_ALL;
const channelPasha = process.env.CH_PASHA;
const channelArtur = process.env.CH_ARTUR;
const channelIliya = process.env.CH_ILIYA;

const bot = new TelegramApi(token, { polling: true });

exports.sendToChannelAll = async (data, RatingMessage, networkCaps) => {
    try {

        const message = `
First Dep 💸:
ClickID: ${data.clickid}
Time: ${formatTimestamp(data.time)}
App: ${data.campaign_name}
GEO: ${data.country}
Offer: ${data.offer_name}
Network: ${data.affiliate_network_name}
Cap: ${networkCaps.countCap}/${networkCaps.fullCap}
Revenue: ${data.payout}

${RatingMessage}


`;

        await bot.sendMessage(channelAll, message);
        //await bot.sendMessage(channelAll, RatingMessage);
        console.log("Конверсия успешно отправлена в канал для админов")
    } catch (error) {
        console.log("Ошибка отправи конверсии в канал админов", error)
    }
};


exports.sendToChannelNew = async (data, responsiblePerson, RatingMessage, networkCaps) => {

    try {
        const message = `
First Dep 💸:
ClickID: ${data.clickid}
Time: ${formatTimestamp(data.time)}
App: ${data.campaign_name}
GEO: ${data.country}
Offer: ${data.offer_name}
Revenue: ${data.payout}
Cap: ${networkCaps.countCap}/${networkCaps.fullCap}
`
        if (responsiblePerson === 'Artur') {
            await bot.sendMessage(channelArtur, message);
            //await bot.sendMessage(channelAll, RatingMessage);
        }
        if (responsiblePerson === 'Pasha') {
            await bot.sendMessage(channelPasha, message);
            //await bot.sendMessage(channelAll, RatingMessage);
        }
        if (responsiblePerson === 'Iliya') {
            await bot.sendMessage(channelIliya, message);
            //await bot.sendMessage(channelAll, RatingMessage);
        }

        console.log("Конверсия успешно отправлена в канал для команды")
        console.log("-------------------------------------------------")
    } catch (error) {
        console.log("Ошибка отправки конверсии в канал команды", error)
    }
}