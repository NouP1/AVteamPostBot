const { auth } = require('google-auth-library');
const { google } = require('googleapis');
const CapModel = require('../models/Cap');
const serviceAccount = require('../googleapikey.json');
require('dotenv').config();
const spreadsheetId = process.env.SPREADSHEETID;

const getNetworkCap = async (PostDatanetworkName,PostDataofferName,Geo) => {
    try {
        
        const authClient = auth.fromJSON(serviceAccount);
        authClient.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
        await authClient.authorize();

        const sheetsApi = google.sheets({ version: 'v4', auth: authClient });

        const sheetsMetadata = await sheetsApi.spreadsheets.get({
            spreadsheetId: spreadsheetId,
        });

        const sheets = sheetsMetadata.data.sheets;
        if (!sheets || sheets.length === 0) {
            throw new Error('Не удалось найти листы в таблице.');
        }

        for (const sheet of sheets) {
            const sheetName = sheet.properties.title;
            const response = await sheetsApi.spreadsheets.values.get({
                spreadsheetId: spreadsheetId,
                range: `${sheetName}!A1:E`,
            });

            const rows = response.data.values;
            

            if (rows && rows.length > 0) {

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
                    let cap = await CapModel.findOne({
                        where: {
                            Geo: networksRow[0],
                            nameCap: networksRow[1],
                            offerName: networksRow[2]
                        }
                    });

                    if (!cap) {
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
                    return {
                        countCap: cap.countCap,
                        fullCap: cap.fullCap
                    };
                } else {
                    console.log("-------------------------------------------------------------------------------------------------");
                    console.log(`Запись не найдена в Google Таблице для гео ${Geo} партнерки ${PostDatanetworkName} и оффера ${PostDataofferName}. Добавляю новую запись в БД.`);
                    console.log("-------------------------------------------------------------------------------------------------");

                    let cap = await CapModel.findOne({
                        where: {
                            nameCap: PostDatanetworkName,
                            offerName: PostDataofferName
                        }
                    });

                    if (!cap) {
                        cap = await CapModel.create({
                            nameCap: PostDatanetworkName,
                            offerName: PostDataofferName,
                            countCap: 0,
                            fullCap: 0
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
module.exports = getNetworkCap;