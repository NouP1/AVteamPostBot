const express = require('express');
const TelegramApi = require('node-telegram-bot-api');
const dayjs = require('dayjs');
const sequelize = require('./db.js');
<<<<<<< HEAD
const BuyerModel = require('./models/Buyer.js');
const CapModel = require('./models/Cap.js');
=======
const BuyerModel = require('./models.js');
>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95
require('dotenv').config();
const cron = require('node-cron');
const moment = require('moment');
const axios = require('axios')
<<<<<<< HEAD
const { auth } = require('google-auth-library');
const { google } = require('googleapis');
const serviceAccount = require('./googleapikey.json');


=======
>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95

const app = express();
app.use(express.json());
const port = 3000;

const token = process.env.TOKEN;
const ApiKey = process.env.API_KEY;
const spreadsheetId = process.env.SPREADSHEETID;
const bot = new TelegramApi(token, { polling: true });

const channelAll = '-1002191506094'; // ID канала для всех полученных данных
const channelPasha = '-1002196076246';
const channelArtur = '-1002211371353';

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
    'Partners 15': '3snet',
    'Partners 16': 'Chillipartners2',
    'Partners 17': 'Lgaming',
    'Partners 18': 'Cpa Rocks',
    'Partners 19': 'Glory Partners',
    'Partners 20': 'Royal Partners',
    'Partners 21': 'Pin-up',
    'Partners 22': 'Traffi Cake',
    'Partners 23': 'MoonStar',
    'Partners 24': 'Vortex',
    'Partners 25': '1xBet',
    'Partners 26': 'Alfaleads',
    'Partners 27': 'OnePartners'
<<<<<<< HEAD

=======
>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95

    
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


<<<<<<< HEAD
const sendToChannelAll = async (data, RatingMessage,networkCaps) => {
=======
const sendToChannelAll = async (data,RatingMessage) => {
>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95
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
<<<<<<< HEAD
Cap:${networkCaps.fullcap}/${networkCaps.countCap}
=======
>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95

`;

        await bot.sendMessage(channelAll, message);
        //await bot.sendMessage(channelAll, RatingMessage);
        console.log("Конверсия успешно отправлена в канал для админов")
    } catch (error) {
        console.log("Ошибка отправи конверсии в канал админов", error)
    }
};


<<<<<<< HEAD
const sendToChannelNew = async (data, responsiblePerson, RatingMessage, networkCaps) => {
=======
const sendToChannelNew = async (data, responsiblePerson,RatingMessage) => {
>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95

    try {
        const message = `
First Dep 💸:
ClickID: ${data.clickid}
Time: ${formatTimestamp(data.time)}
App: ${data.campaign_name}
GEO: ${data.country}
Offer: ${data.offer_name}
Revenue: ${data.payout};
Cap:${networkCaps.fullcap}/${networkCaps.countCap}
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
<<<<<<< HEAD
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

const resetRevenueCount = async () => {
    try {
        await BuyerModel.destroy({ where: {} });
        console.log('Счетчики выплат сброшены');
    } catch (error) {
        console.error('Error resetting count revenue:', error);
    }
};


async function getNetworkCap(networkName) {
    try {

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

            // Получаем данные из текущего листа
            const response = await sheetsApi.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!A1:B`,  // Обращаемся к диапазону текущего листа
            });

            const rows = response.data.values;

            if (rows && rows.length > 0) {

                const networksRow = rows.find(row => row[0] === networkName);

                const [cap, created] = await CapModel.findOrCreate({
                    where: { nameCap: networkName },
                    defaults: { nameCap: networksRow[0] || 0, countCap: networksRow[1] || 0, fullCap: networksRow[1] }
                });

                if (!created) {
                    cap.countCap -= 1;
                    cap.fullCap = networksRow[1]
                    await cap.save();

                    if (cap.countCap < 0 || cap.countCap===undefined || cap.fullCap ===undefined) {
                        await cap.update({countCap:0,fullCap:0})
                    }

                   

                    let ojectCap = {
                        countCap: cap.countCap,
                        fullcap: cap.fullCap
                    }
                    return ojectCap;
                }
            }
        }


        // Если ничего не найдено ни в одном листе
        throw new Error(`Данные для ${networkName} не найдены.`);

    } catch (error) {
        console.error('Error getting sheet data:', error);
        throw error;  // Перебрасываем ошибку для обработки на более высоком уровне
=======
>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95
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
        await BuyerModel.destroy({ where: {} });
        console.log('Счетчики выплат сброшены');
    } catch (error) {
        console.error('Error resetting count revenue:', error);
    }
};



const postbackQueue = [];
let isProcessing = false; // Флаг, указывающий на то, идет ли в данный момент обработка очереди

// Функция для обработки данных постбека
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

        const RatingMessage = await sendRatingMessage(postData, responsiblePerson);
        await Promise.allSettled([
            sendToChannelNew(postData, responsiblePerson, RatingMessage),
            sendToChannelAll(postData, RatingMessage),
            (async () => {
                try {
                    await axios.post('http://185.81.115.100:3100/api/webhook/postback', postData);
                } catch (error) {
                    console.error('Ошибка отправки на внешний сервер:', error);
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




const postbackQueue = [];
let isProcessing = false; // Флаг, указывающий на то, идет ли в данный момент обработка очереди

// Функция для обработки данных постбека
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
        const networkCaps = await getNetworkCap(postData.affiliate_network_name)
        const RatingMessage = await formatedRatingMessage(postData, responsiblePerson);

        
        await Promise.allSettled([
            sendToChannelNew(postData, responsiblePerson, RatingMessage,networkCaps),
            sendToChannelAll(postData, RatingMessage,networkCaps),
            (async () => {
                try {
                    await axios.post('http://185.81.115.100:3100/api/webhook/postback', postData);
                } catch (error) {
                    console.error('Ошибка отправки на внешний сервер:', error);
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
<<<<<<< HEAD

        // Запускаем обработку очереди, если она не запущена
        if (!isProcessing) {
            processQueue();
        }

=======

        // Запускаем обработку очереди, если она не запущена
        if (!isProcessing) {
            processQueue();
        } 

>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95
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
<<<<<<< HEAD
    console.log(now + '\n-------------------------------------------------');
});

app.post('/update', async (req, res) => {
     try { 
        const {networkName, newCapValue } = req.body;
        console.log('-------------------------------------------------\n!Изменение в Google Tables!\n')
        console.log(req.body)
        console.log('\n-------------------------------------------------')
        if (!networkName || !newCapValue) {
            return res.status(400).json({ message: 'Missing required fields' });
          }
   
    
  const cap = await CapModel.findOne({ where: { nameCap: networkName } });
      if (cap) {  
        
        cap.countCap = newCapValue;  // Сбрасываем счетчик
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

=======
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

>>>>>>> 8717865cfe28eb4546d4f04eadf0363e37e9df95
startServer();
