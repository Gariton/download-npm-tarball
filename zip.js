const fs = require('fs').promises;
const { existsFileFolder, zip } = require('./util');
const readline = require('readline');

async function main () {
    try {
        const packSize = 1000; //zip化するサイズ default:1000000000(1GB)

        //outputsフォルダがあるか。なければエラー終了
        if (!await existsFileFolder('./outputs')) {
            throw new Error('outputsフォルダがありません。');
        }

        // zipフォルダなければ作る
        if (!await existsFileFolder('./zip')) {
            await fs.mkdir('./zip');
        }

        let files = await fs.readdir('./outputs');
        if (files.length <= 0) {
            throw new Error('ファイルがありません。');
        }

        //zipCount初期値をzipフォルダ内のファイル名によって判定する
        let zipFiles = await fs.readdir('./zip');
        zipFiles = zipFiles.filter(file => /(.+)\.zip/g.test(file));
        let zipCount = 1;

        let totalFileSize = 0;

        process.stdout.write(`ダウンロードしたパッケージ(${files.length}個)を${packSize}byteずつzip化します。\n`);
        let now = new Date();
        let nowStr = `${now.getFullYear()}${now.getMonth()+1}${now.getDate()}${now.getHours()}${now.getMinutes()}${now.getSeconds()}`;
        for (let file of files) {
            //移動先フォルダ
            let zipPath = `./zip/npm_modules_${nowStr}_${zipCount}`;
            if (!await existsFileFolder(zipPath)) {
                await fs.mkdir(zipPath);
            }

            //フォルダの情報
            let fileInfo = await fs.stat(`./outputs/${file}`);
            totalFileSize += fileInfo.size;

            //ファイルをzipPathに移動
            await fs.rename(`./outputs/${file}`, `${zipPath}/${file}`);

            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`${zipCount}: ${zipPath}.zip (${totalFileSize})`);
            if (totalFileSize >= packSize || files[files.length-1]==file) {
                await zip(zipPath); //zip化
                await fs.rm(zipPath, {recursive: true, force: true}); //フォルダを削除
                zipCount++;
                totalFileSize = 0;
                process.stdout.write('\n');
            }
        }


    } catch (error) {
        console.error(error);
    }
}

main();