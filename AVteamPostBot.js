const express = require('express');
const TelegramApi = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const sequelize = require('./db.js');
const BuyerModel = require('./models/Buyer.js');
const CapModel = require('./models/Cap.js');
require('dotenv').config();
const cron = require('node-cron');
const moment = require('moment');
const axios = require('axios')
const { auth } = require('google-auth-library');
const { google } = require('googleapis');
const serviceAccount = require('./googleapikey.json');
const countryCodes = require('./country.js');
const affiliateNetworkMapping = require('./affneworks.js')

const app = express();
app.use(express.json());
const port = 3000;

const token = process.env.TOKEN;
const ApiKey = process.env.API_KEY;
const spreadsheetId = process.env.SPREADSHEETID;
const bot = new TelegramApi(token, { polling: true });

const channelAll = '-1002191506094';
const channelPasha = '-1002196076246';
const channelArtur = '-1002211371353';

const formatTimestamp = (timestamp) => {
    return dayjs.unix(timestamp).add(3, 'hour').format('YYYY-MM-DD HH:mm:ss');
};

function getCountryCode(country) {
    return countryCodes[country] || 'Unknown';
}

const transformOfferName = (offerName) => {
    const parts = offerName.split('|');
    if (parts.length >= 5) {
        return parts.slice(2, -2).map(part => part.trim()).join(' ');
    }
    return offerName;
};


const sendToChannelAll = async (data, RatingMessage, networkCaps) => {
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


const sendToChannelNew = async (data, responsiblePerson, RatingMessage, networkCaps) => {

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


        console.log("Конверсия успешно отправлена в канал для команды")
        console.log("-------------------------------------------------")
    } catch (error) {
        console.log("Ошибка отправки конверсии в канал команды", error)
    }
}

const formatedRatingMessage = async (postData, responsiblePerson) => {
    try {
        const [buyer, created] = await BuyerModel.findOrCreate({
            where: { nameBuyer: responsiblePerson },
            defaults: { nameBuyer: responsiblePerson, countRevenue: postData.payout, countFirstdeps: 1 }
        });

        if (!created) {
            buyer.countRevenue += postData.payout;
            buyer.countFirstdeps += 1;
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




async function getNetworkCap(PostDatanetworkName, PostDataofferName, Geo) {
    try {
        console.log(PostDataofferName)
        const authClient = auth.fromJSON(serviceAccount);
        authClient.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
        await authClient.authorize();

        const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

        // Получаем список всех листов в таблице
        const sheetsMetadata = await sheetsApi.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        const sheets = sheetsMetadata.data.sheets;
        if (!sheets || sheets.length === 0) {
            throw new Error('Не удалось найти листы в таблице.');
        }

        for (const sheet of sheets) {
            const sheetName = sheet.properties.title;

            // Получаем данные из текущего листа (диапазон A1:C для Affiliate Network, Offers и Cap)
            const response = await sheetsApi.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!A1:E`,  // Обращаемся к диапазону с учётом нового столбца
            });

            const rows = response.data.values;

            if (rows && rows.length > 0) {
                // Поиск записи по названию сети
                const networksRow = rows.find(row =>
                    row[0] && row[1] && row[2] &&
                    row[0].trim().toLowerCase() === Geo.trim().toLowerCase() &&
                    row[1].trim().toLowerCase() === PostDatanetworkName.trim().toLowerCase() &&
                    row[2].trim().toLowerCase() === PostDataofferName.trim().toLowerCase()
                );
                console.log("-------------------------------------------------");
                console.log('Найденная строка в Google Tables');
                console.log(networksRow)
                console.log("-------------------------------------------------");

                if (networksRow) {
                    // Ищем запись в БД по партнёрке и офферу
                    let cap = await CapModel.findOne({
                        where: {
                            Geo: networksRow[0],
                            nameCap: networksRow[1],  // Affiliate Network
                            offerName: networksRow[2]  // Offers
                        }
                    });

                    if (!cap) {
                        // Если записи нет, создаём её
                        cap = await CapModel.create({
                            Geo: networksRow[0],
                            nameCap: networksRow[1],
                            offerName: networksRow[2],
                            countCap: 1,
                            fullCap: networksRow[3]
                        });
                        console.log("-------------------------------------------------");
                        console.log(`!!Создаю запись в БД для  ${Geo} ${PostDatanetworkName} ${PostDataofferName} !!`);
                        console.log("-------------------------------------------------");
                    } else {

                        console.log("-------------------------------------------------");
                        console.log(`!!Обновляю значения в БД для ${Geo} ${PostDatanetworkName} ${PostDataofferName} !!`);
                        console.log("-------------------------------------------------");

                        cap.countCap += 1;
                        cap.fullCap = networksRow[3];

                        if (networksRow[4] === 'TRUE') {
                            cap.countCap = 0;
                        }

                        if (networksRow[3] === '0' || networksRow[3] === undefined) {
                            cap.fullCap = 0;
                            cap.countCap = 0;
                            console.log("-------------------------------------------------");
                            console.log(`!!Обнулил значения для ${Geo} ${PostDatanetworkName} ${PostDataofferName} !!`);
                            console.log("-------------------------------------------------");
                        }

                        await cap.save();
                    }

                    // Возвращаем объект с информацией о Cap
                    return {
                        countCap: cap.countCap,
                        fullCap: cap.fullCap
                    };
                } else {
                    // Если запись не найдена в Google Таблице
                    console.log("-------------------------------------------------------------------------------------------------");
                    console.log(`Запись не найдена в Google Таблице для гео ${Geo} партнерки ${PostDatanetworkName} и оффера ${PostDataofferName}. Добавляю новую запись в БД.`);
                    console.log("-------------------------------------------------------------------------------------------------");
                    // Ищем запись в БД по партнёрке и офферу
                    let cap = await CapModel.findOne({
                        where: {
                            nameCap: PostDatanetworkName,
                            offerName: PostDataofferName
                        }
                    });

                    if (!cap) {
                        // Если записи нет в БД, создаём её с нулевыми значениями
                        cap = await CapModel.create({
                            nameCap: PostDatanetworkName,
                            offerName: PostDataofferName,
                            countCap: 0,  // Устанавливаем 0 для countCap
                            fullCap: 0    // Устанавливаем 0 для fullCap
                        });
                        console.log("-------------------------------------------------");
                        console.log(`!!Создал запись с нулевыми значениями капы для  ${Geo} ${PostDatanetworkName} и ${PostDataofferName}!!`);
                        console.log("-------------------------------------------------");
                    } else {
                        cap.countCap = 0;
                        cap.fullCap = 0;
                        await cap.save()
                        console.log("-------------------------------------------------");
                        console.log(`!!Запись уже существует для ${Geo} ${PostDatanetworkName} и ${PostDataofferName} обнуляю их значения капы!!`);
                        console.log("-------------------------------------------------");
                    }

                    // Возвращаем объект с нулевыми значениями капы
                    return {
                        countCap: cap.countCap,
                        fullCap: cap.fullCap
                    };
                }
            }
        }
        throw new Error(`Данные для ${PostDatanetworkName} не найдены.`);

    } catch (error) {
        console.error('Error getting sheet data:', error);
        throw error;
    }
}



const resetRevenueCount = async () => {
    try {
        await BuyerModel.destroy({ where: {} });
        console.log('Счетчики выплат сброшены');
    } catch (error) {
        console.error('Error resetting count revenue:', error);
    }
};



const postbackQueue = [];
let isProcessing = false; // Флаг, указывающий на то, идет ли в данный момент обработка очереди

// // Функция для обработки данных постбека
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
                    const response = await axios.post('http://185.81.115.100:3100/api/webhook/postback', postData);

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
        return 'Postback processed';
    } catch (error) {
        console.error('Ошибка обработки postback:', error);
        throw new Error('Internal Server Error');
    }
};

// Функция для обработки очереди постбеков
const processQueue = async () => {
    if (isProcessing) return; // Если уже идет обработка, выходим
    isProcessing = true; // Устанавливаем флаг обработки

    while (postbackQueue.length > 0) {
        const postData = postbackQueue.shift(); // Извлекаем первый элемент из очереди
        await processPostback(postData); // Обрабатываем постбек
        await new Promise(resolve => setTimeout(resolve, 4000)); // Задержка в 4 секунды
    }

    isProcessing = false; // Сбрасываем флаг после завершения обработки
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

        // Добавление задачи в очередь
        postbackQueue.push(postData);

        // Запускаем обработку очереди, если она не запущена
        if (!isProcessing) {
            processQueue();
        }

        res.status(200).send('Postback получен и добавлен в очередь');
    } catch (error) {
        console.error('Ошибка добавления postback в очередь:', error);
        res.status(500).send('Internal Server Error');
    }
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
