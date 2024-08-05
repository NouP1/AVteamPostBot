const express = require('express');
const TelegramApi = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const sequelize = require('./db.js');
const BuyerModel = require('./models.js');
require('dotenv').config();
const cron = require('node-cron');
const moment = require('moment');

const app = express();
const port = 3000;




const token = process.env.TOKEN;
const ApiKey = process.env.API_KEY;
const bot = new TelegramApi(token, { polling: true });

const channelAll = '-1002164350760'; // ID канала для всех полученных данных
const channelPasha = '-1002163208194';
const channelArtur = '-1002247205947';

const affiliateNetworkMapping = {
    'Partners 1': 'Cpa bro',
    'Partners 2': 'Advertise',
    'Partners 3': '1WIN',
    'Partners 4': 'Holy Cash',
    'Partners 5': 'Vpartners',
    'Partners 6': '4rabet',
    'Partners 7': 'NSQ',
    'Partners 8': 'CGS',
    'Partners 9': 'Play Cash',
    'Partners 10': '247 Partners',
    'Partners 11': 'Monkey Traff',
    'Partners 12': 'Ami Leads',
    'Partners 13': 'Tesla Traff',
    'Partners 14': 'X-partners',
};

const formatTimestamp = (timestamp) => {
    return dayjs.unix(timestamp).add(3, 'hour').format('YYYY-MM-DD HH:mm:ss');
};

const transformOfferName = (offerName) => {
    const parts = offerName.split('|');
    if (parts.length >= 5) {
        return parts.slice(2, -2).map(part => part.trim()).join(' ');
    }
    return offerName;
};


const sendToChannelAll = async (data,RatingMessage) => {
    try {

        const message = `
First Dep 💸:
ClickID: ${data.clickid}
Time: ${formatTimestamp(data.time)}
App: ${data.campaign_name}
GEO: ${data.country}
Offer: ${data.offer_name}
Network: ${data.affiliate_network_name}
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


const sendToChannelNew = async (data, responsiblePerson,RatingMessage) => {

    try {
        const message = `
First Dep 💸:
ClickID: ${data.clickid}
Time: ${formatTimestamp(data.time)}
App: ${data.campaign_name}
GEO: ${data.country}
Offer: ${data.offer_name}
Revenue: ${data.payout}`;

        if (responsiblePerson === 'Artur') {
            await bot.sendMessage(channelArtur, message);
            //await bot.sendMessage(channelAll, RatingMessage);
        }
        if (responsiblePerson === 'Pasha') {
            await bot.sendMessage(channelPasha, message);
            //await bot.sendMessage(channelAll, RatingMessage);
        }


        console.log("Конверсия успешно отправлена в канал для команды")
    } catch (error) {
        console.log("Ошибка отправки конверсии в канал команды", error)
    }
}

const sendRatingMessage = async (postData, responsiblePerson) => {
    try {
        const [buyer, created] = await BuyerModel.findOrCreate({
            where: { nameBuyer: responsiblePerson },
            defaults: { nameBuyer: responsiblePerson, countRevenue: postData.payout, countFirstdeps:1}
        });

        if (!created) {
            buyer.countRevenue += postData.payout;
            buyer.countFirstdeps +=1;
            await buyer.save();
        }

        const buyers = await BuyerModel.findAll({
            order: [['countRevenue', 'DESC']]
        });

        const message = 'Buyers:\n' + buyers.map(b => `${b.nameBuyer} => $${b.countRevenue} / FD ${b.countFirstdeps}`).join('\n');
        return message  
    } catch (error) {
        console.log("Ошибка в отправке сообщения с рейтингом \n" + error)
    }

};

const resetRevenueCount = async () => {
    try {
        await BuyerModel.update({ countRevenue: 0, countFirstdeps:0 }, { where: {} });
        console.log('Счетчики выплат сброшены');
    } catch (error) {
        console.error('Error resetting count revenue:', error);
    }
};



app.get('/postback', async (req, res) => {

 try {

        const postData = {
            clickid,
            date,
            time,
            campaign_name,
            country,
            offer_name,
            affiliate_network_name,
            payout
        } = req.query;
        console.log(req.query)

        if (postData.status !== 'sale' && postData.status !== 'first_dep') {
            return res.status(200).send('Postback received, but status not relevant');
        }

        if (affiliateNetworkMapping[postData.affiliate_network_name]) {
            postData.affiliate_network_name = affiliateNetworkMapping[postData.affiliate_network_name];
        }

        
        postData.payout = Math.floor(parseFloat(postData.payout));
        postData.offer_name = transformOfferName(postData.offer_name);

        const offerParts = postData.campaign_name.split('|');
        const responsiblePerson = offerParts[offerParts.length - 1].trim();


        const RatingMessage = await sendRatingMessage(postData, responsiblePerson)
        await sendToChannelNew(postData, responsiblePerson,RatingMessage);
        await sendToChannelAll(postData,RatingMessage);
       
        

        res.status(200).send('Postback received');
    } catch (error) {
        console.error('Error processing postback:', error);
        res.status(500).send('Internal Server Error');
    }
});

cron.schedule('0 21 * * *', () => {
    const now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log('Running resetRevenueCount at 00:00');
    resetRevenueCount();
    console.log(now +'\n----------------------------------------------------------------');
});

const startServer = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
        console.log('Connected to database...');
        
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (error) {
        console.error('Отсутствует подключение к БД', error);
    }
};

startServer();
