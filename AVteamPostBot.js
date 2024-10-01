const express = require('express');
const TelegramApi = require('node-telegram-bot-api');
const sequelize = require('./models/db.js');
const BuyerModel = require('./models/Buyer.js');
const CapModel = require('./models/Cap.js');
const cron = require('node-cron');
const moment = require('moment');
const axios = require('axios')
const affiliateNetworkMapping = require('./data/affneworks.js')
const Queue = require('bull');
const getNetworkCap = require('./services/googleSheetsService.js');
const { transformOfferName, formatedRatingMessage } = require('./helpers/formatters.js')
const getCountryCode = require('./helpers/countryUtils.js')
const { sendToChannelAll, sendToChannelNew } = require('./services/telegramService.js')
require('dotenv').config();

const app = express();
app.use(express.json());

const port = process.env.PORT;
const crm = process.env.CRM;

const postbackQueue = new Queue('postbackQueue', {
    redis: { host: '127.0.0.1', port: 6379 }
});


const resetRevenueCount = async () => {
    try {
        await BuyerModel.destroy({ where: {} });
        console.log('Счетчики выплат сброшены');
    } catch (error) {
        console.error('Error resetting count revenue:', error);
    }
};

const processPostback = async (postData) => {
    try {
        if (postData.status !== 'sale' && postData.status !== 'first_dep') {
            return 'Postback received, but status not relevant';
        }

        if (affiliateNetworkMapping[postData.affiliate_network_name]) {
            postData.affiliate_network_name = affiliateNetworkMapping[postData.affiliate_network_name];
        }

        postData.payout = Math.floor(parseFloat(postData.payout));
        postData.offer_name = transformOfferName(postData.offer_name);
        const offerParts = postData.campaign_name.split('|');
        const responsiblePerson = offerParts[offerParts.length - 1].trim();
        const geo = getCountryCode(postData.country)
        const networkCaps = await getNetworkCap(postData.affiliate_network_name, postData.offer_name, geo)
        const RatingMessage = await formatedRatingMessage(postData, responsiblePerson);


        await Promise.allSettled([
            sendToChannelNew(postData, responsiblePerson, RatingMessage, networkCaps),
            sendToChannelAll(postData, RatingMessage, networkCaps),
            (async () => {
                try {
                    const response = await axios.post(crm, postData);

                    // Проверяем, что код ответа равен 200
                    if (response.status === 200) {
                        console.log("-------------------------------------------------");
                        console.log('Постбек удачно отправлен в AVteamCRM!');
                        console.log('Ответ сервера:', response.data); // можно вывести данные ответа, если нужно
                        console.log("-------------------------------------------------");
                    } else {
                        console.error('Ошибка: неожиданный код ответа', response.status);
                    }
                } catch (error) {
                    console.error('Ошибка отправки на внешний сервер:', error);
                    console.log("-------------------------------------------------");
                    console.error('Ошибка отправки на внешний сервер!');
                    console.log("-------------------------------------------------");
                }
            })()
        ]);

        return result = 'Postback processed';
    } catch (error) {
        console.error('Ошибка обработки postback:', error);
        throw new Error('Internal Server Error');
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

        await postbackQueue.add(postData);


        res.status(200).send('Postback получен и добавлен в очередь');
    } catch (error) {
        console.error('Ошибка добавления postback в очередь:', error);
        res.status(500).send('Internal Server Error');
    }
});

postbackQueue.process(async (job) => {
    await processPostback(job.data);
    return Promise.resolve();
});

postbackQueue.on('completed', () => {
    console.log(`Задание завершено`);
});

postbackQueue.on('failed', (err) => {
    console.error(`Задание завершилось ошибкой: ${err}`);
});

cron.schedule('0 21 * * *', () => {
    const now = moment().format('YYYY-MM-DD HH:mm:ss')
    console.log('Running resetRevenueCount at 00:00');
    resetRevenueCount();
    console.log(now + '\n-------------------------------------------------');
});

app.post('/update', async (req, res) => {
    try {
        const { geo, networkName, offerName, newCapValue } = req.body;
        console.log('-------------------------------------------------\n!Изменение в Google Tables: CAP!\n')
        console.log(req.body)
        console.log('\n-------------------------------------------------')

        if (!geo || !networkName || !newCapValue || !offerName) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const cap = await CapModel.findOne({ where: { Geo: geo, nameCap: networkName, offerName: offerName } });
        if (cap) {
            cap.fullCap = newCapValue;   // Обновляем fullCap
            await cap.save();

            res.status(200).json({ message: 'Cap updated successfully' });
        } else {
            res.status(404).json({ message: 'Network not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating cap', error });
    }
});

app.post('/reset', async (req, res) => {
    try {
        const { geo, networkName, offerName, resetCap } = req.body;
        console.log('-------------------------------------------------\n!Изменение в Google Tables: RESET!\n')
        console.log(req.body)
        console.log('\n-------------------------------------------------')

        if (!geo || !networkName || !offerName || !resetCap) {
            return res.status(400).json({ message: 'Missing required fields' });
        }


        const cap = await CapModel.findOne({ where: { Geo: geo, nameCap: networkName, offerName: offerName } });

        if (cap && resetCap) {
            cap.countCap = 0;
            await cap.save();
            res.status(200).json({ message: 'Cap updated successfully' });
        } else {
            res.status(404).json({ message: 'Network not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating cap', error });
    }
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
