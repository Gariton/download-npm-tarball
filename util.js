const { execSync } = require('child_process');
const fsPromise = require('fs').promises;
const fs = require('fs');
const readline = require('readline');
const archiver = require('archiver');
const path = require('path')

class packageController {
    constructor (packageName) {
        this.packageName = packageName;
    }

    async info (version='latest') {
        try {
            let resultStr = execSync(`npm info ${this.packageName}@${version} --json`, {stdio: []});
            return JSON.parse(resultStr);
        } catch (error) {
            return false;
        }
    }

    async download (dir, version='latest') {
        try {
            execSync(`cd ${dir} && npm pack ${this.packageName}@${version}`, {stdio: []});
        } catch (error) {
            return false;
        }
    }

    async getAllDeps (tab=1) {
        try {
            const progressLength = 40;
            if (!Object.keys(history).includes(this.packageName)) {
                //初めてのパッケージ名
                history[this.packageName] = {versions: []};
            }
            
            let info = await this.info();
            let deps = [];
            process.stdout.write(`    ┃${'    '.repeat(tab)}┣ ${this.packageName}(バージョン数:${info.versions.length})依存関係を検索開始...\n`);
            let counter = 1;
            for (let version of info.versions ?? []) {
                //historyを保存
                if (!history[this.packageName].versions.includes(version)) {
                    //このバージョンは初めて
                    //バージョンごとに処理
                    this.download('./outputs', version);
                    history[this.packageName].versions.push(version);
                    await fsPromise.writeFile('./history.json', JSON.stringify(history));
                }
                let done = Math.floor((counter/info.versions.length)*progressLength);
                readline.cursorTo(process.stdout, 0);
                process.stdout.write(`    ┃${'    '.repeat(tab)}┃ 【\x1b[32m${'='.repeat(done)}\x1b[39m${'-'.repeat(progressLength-done)}】(${counter}/${info.versions.length}) 処理完了`);
                let pkg = new packageController(this.packageName);
                let packageInfo = await pkg.info(version);
                deps.push(Object.keys(packageInfo.dependencies??{}));
                counter++;
            }
            process.stdout.write('🎉\n');
            deps = Array.from(new Set(deps.flat()));
            process.stdout.write(`    ┃${'    '.repeat(tab)}┗ ${this.packageName}依存関係を検索完了(${deps.length}依存)\n`);
    
            for (let dep of deps) {
                let depPkg = new packageController(dep);
                deps =  [...deps, ... await depPkg.getAllDeps(tab+1)];
            }
            
            return deps;
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}

async function existsFileFolder (path) {
    return fsPromise.stat(path)
        .then(_ => {
            return true;
        })
        .catch(_ => {
            return false;
        });
}

async function zip (targetDir) {
    const zipPath = `${targetDir}.zip`;
    const output = fs.createWriteStream(path.join(__dirname, zipPath));
  
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
  
    archive.pipe(output);
  
    archive.glob(path.join(targetDir, '*.tgz'));
  
    await archive.finalize();
  
    return;
}

module.exports = {
    packageController,
    existsFileFolder,
    zip
}