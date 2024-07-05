const express = require('express');
const TelegramApi = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const { default: axios } = require('axios');
const { Console } = require('console');
require('dotenv').config();

const app = express();
const port = 3000;

const token = process.env.TOKEN;
const ApiKey = process.env.API_KEY;
const bot = new TelegramApi(token, { polling: true });

const channelAll = '-1002191506094'; // ID канала для всех полученных данных
const channelPasha = '-1002196076246';// ID канала для новых данных
const channelArtur = '-1002211371353';

const affiliateNetworkMapping = {
    'Partners #1': 'Cpa bro',
    'Partners #2': 'Advertise',
    'Partners #3': '1WIN',
    'Partners #4': 'Holy Cash',
    'Partners #5': 'Vpartners',
    'Partners #6': '4rabet',
    'Partners #7': 'NSQ',
    'Partners #8': 'CGS',
    'Partners #9': 'Play Cash',
    'Partners #10': '247 Partners',

};

const formatTimestamp = (timestamp) => {
    return dayjs.unix(timestamp).add(3, 'hour').format('YYYY-MM-DD HH:mm:ss');
};

const transformOfferName = (offerName) => {
    const parts = offerName.split('|');
    if (parts.length >= 5) {
        return parts.slice(2, -2).join('|').trim();
    }
    return offerName;
};


const sendToChannelAll = async (data) => {
    try {

        const message = `
First Dep 💸:
ClickID: ${data.clickid}
Time: ${formatTimestamp(data.time)}
App: ${data.campaign_name}
GEO: ${data.country}
Offer: ${data.offer_name}
Network: ${data.affiliate_network_name}
Revenue: ${data.payout}`;

        await bot.sendMessage(channelAll, message);
        console.log("Конверсия успешно отправлена в канал для админов")
    } catch (error) {
        console.log("Ошибка отправи конверсии в канал админов", error)
    }
};


const sendToChannelNew = async (data, responsiblePerson) => {

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
        }
        if (responsiblePerson === 'Pasha') {
            await bot.sendMessage(channelPasha, message);
        }


        console.log("Конверсия успешно отправлена в канал для команды")
    } catch (error) {
        console.log("Ошибка отправи конверсии в канал команды", error)
    }
}


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

        if (postData.status !== 'sale' && postData.status !== 'first_dep') {
            return res.status(200).send('Postback received, but status not relevant');
        }

        if (affiliateNetworkMapping[postData.affiliate_network_name]) {
            postData.affiliate_network_name = affiliateNetworkMapping[postData.affiliate_network_name];
        }

        postData.offer_name = transformOfferName(postData.offer_name);

        const offerParts = postData.campaign_name.split('|');
        const responsiblePerson = offerParts[offerParts.length - 1].trim();
      

        // const response = await axios.get(`https://silktraff.com/public/api/v1/conversion/${postData.clickid}`, {
        //     headers: {
        //         'api-key': ApiKey,

        //     }
        // })

    
        await sendToChannelNew(postData, responsiblePerson);
        await sendToChannelAll(postData);

        res.status(200).send('Postback received');
    } catch (error) {
        console.error('Error processing postback:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});