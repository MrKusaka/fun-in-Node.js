const path = require('path');
const got = require('got');
const fs = require('fs').promises;
const AdmZip = require("adm-zip");
const convert = require('xml-js');
const iconv = require('iconv-lite');


// Функция скачивания файла
async function download(url, archive) {
    const buffer = await got.get(url).buffer();
    await fs.writeFile(archive, buffer);
}
// Основная функция
async function main() {
    console.log("Downloading...");
    const url = 'http://www.cbr.ru/s/newbik';

    // Путь сохранения файла
    const archFolder = path.resolve(__dirname, 'arch');
    const archive = path.resolve(archFolder, 'archive.zip');

    //Вызов функции скачивания
    await download(url, archive);

    // Распаковка файла
    console.log("Extracting...");
    const zip = new AdmZip(archive);
    zip.extractAllTo(archFolder, true);

    /*
    Чтение, кодирование файла
    В path использую уже конкретное имя файла после распаковки, мне не хватило времени сделать иначе:(/
    Не знал как назвать эту переменную 'pupa'... Надеюсь ничего не перепутал...
    */
    let pupa = await fs.readFile('arch/20221125_ED807_full.xml');
    pupa = iconv.decode(Buffer.from(pupa), 'win1251');

    // Конвентирование в объект JS
    let jsObj = convert.xml2js(pupa);

    // Прохождение по файл и по нужным тегам добавляем данные в массив
    let bd = [];
    let banks = jsObj['elements'][0]['elements'];
    for (let bank of banks) {
        let dic = {};
        dic.BIC = bank['attributes']['BIC'];
        dic.name = bank['elements'][0]['attributes']['NameP'];
        dic.accounts = [];
        for (let account of bank['elements']) {
            if (account.hasOwnProperty('attributes') && account['attributes'].hasOwnProperty('Account')) {
                dic.accounts.push(account['attributes']['Account']);
            }
        }
        if (dic.accounts.length > 0) {
            bd.push(dic);
        }
    }
    //Помещение полученного массива в json файл
    await fs.writeFile('textBD.json', JSON.stringify(bd, null, 2));
}

// Вызов основной функции
main ()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

/*
Это мой первый, полноценный опыт работы с node.js
Не судите строго. В дальнейшем всему смогу научиться!!!
Успел сделать только без записи в БД:(/
Зато генерируется красивый json файл
Тоже своего рода база данных
 */
