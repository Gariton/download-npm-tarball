const { packageController, existsFileFolder } = require('./util');
const fs = require('fs').promises;

global.GlobalPackageList = [];

async function main () {
    try {
        let start = performance.now();
        let DLPackages = [];

        //historyファイルがなければ作成
        if (!await existsFileFolder('./history.json')) {
            await fs.writeFile('./history.json', '[]');
        }
        GlobalPackageList = JSON.parse(await fs.readFile('./history.json', 'utf8'));

        //outputsフォルダをなければ作成
        if (!await existsFileFolder('./outputs')) {
            await fs.mkdir('./outputs');
        }

        // コマンドラインからパッケージ名を取得するよ
        let packageNames = process.argv.slice(2, process.argv.length);
        if (packageNames.length <= 0) {
            throw new Error('パッケージ名を1つ以上指定してください。');
		}

        // 指定のパッケージ名が存在するかチェック
        for (let packageName of packageNames) {
            let package = new packageController(packageName);
            let info = await package.info();
            if (info !== false ) {
                // 存在するものをDLPackagesに入れておく
                DLPackages.push(package);
            }
        }

        console.log(`💾 ${DLPackages.length}個のパッケージの依存関係を含めたすべてのnpmパッケージを取得します。`);

        // すべての依存パッケージ名を取得する
        for (let p of DLPackages) {
            let info = await p.info();
            console.log(`    ┣ ${p.packageName}(バージョン数:${info.versions.length})のすべての依存関係を取得...`);
            let deps = await p.getAllDeps(2);
            GlobalPackageList = Array.from(new Set([...GlobalPackageList, ...deps]));
        }

        await fs.writeFile('./history.json', JSON.stringify(GlobalPackageList));

        let end = performance.now();
        console.log(`実行時間(ms) : `+ (end - start));

    } catch (error) {
       console.error(error); 
    }
}

main();