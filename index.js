const express = require('express');
const TelegramApi = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const { default: axios } = require('axios');
const { Console } = require('console');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const token = process.env.TOKEN;
const ApiKey = process.env.API_KEY;
const bot = new TelegramApi(token, { polling: true });

const channelIdAll = '-1002191506094'; // ID канала для всех полученных данных
const channelIdNew = '-1002196076246'; // ID канала для новых данных


const formatTimestamp = (timestamp) => {
    return dayjs.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');
};
// Функция для обработки и отправки сообщений в канал "All"
const sendToChannelAll = async (data,conversedAt,timeSinceClick) => {
    try {


        const message = `
    Новая конверсия :
    ClickID: ${data.clickid}
    Time: ${formatTimestamp(data.time)}
    Время с момента клика: ${timeSinceClick}
    Время конверсии: ${conversedAt}
    App: ${data.campaign_name}
    GEO: ${data.country}
    Offer: ${data.offer_name}
    Network: ${data.affiliate_network_name}
    Revenue: ${data.payout}
    `;

        await bot.sendMessage(channelIdAll, message);
        console.log("Конверсия успешно отправлена в канал для админов")
    } catch (error) {
        console.log("Ошибка отправи конверсии в канал админов", error)
    }
};


const sendToChannelNew = async (data,conversedAt,timeSinceClick) => {

    try {
        const message = `
    Новая конверсия :
    ClickID: ${data.clickid}
    Time: ${formatTimestamp(data.time)}
    Время с момента клика: ${timeSinceClick}
    Время конверсии: ${conversedAt}
    App: ${data.campaign_name}
    GEO: ${data.country}
    Offer: ${data.offer_name}
    Revenue: ${data.payout}
    `;

        await bot.sendMessage(channelIdNew, message);
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

 const response = await axios.get(`https://silktraff.com/public/api/v1/conversion/${postData.clickid}`,{
    headers:{
        'api-key': ApiKey,

    }
 })
const conversedAt = response.data.conversed_at;
const timeSinceClick = response.data.time_since_click;

await sendToChannelAll(postData, conversedAt, timeSinceClick);
await sendToChannelNew(postData, conversedAt, timeSinceClick);
        res.status(200).send('Postback received');
    } catch (error) {
        console.error('Error processing postback:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});