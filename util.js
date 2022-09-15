const { execSync } = require('child_process');
const fs = require('fs').promises;

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
            if (GlobalPackageList.includes(this.packageName)) {
                console.log(`    ┃${'    '.repeat(tab)}┣ ${this.packageName}依存関係調査済み`);
                return [];
            } else {
                GlobalPackageList = Array.from(new Set([...GlobalPackageList, this.packageName]));
                await fs.writeFile('./history.json', JSON.stringify(GlobalPackageList));
                let info = await this.info();
                let deps = [];
                console.log(`    ┃${'    '.repeat(tab)}┣ ${this.packageName}依存関係を検索開始...`);
                let counter = 1;
                for (let version of info.versions ?? []) {
                    //バージョンごとに処理
                    let dlStart = performance.now();
                    this.download('./outputs', version);
                    let dlEnd = performance.now();
                    let dlTime = dlEnd - dlStart;
                    let pkg = new packageController(this.packageName);
                    let packageInfo = await pkg.info(version);
                    deps.push(Object.keys(packageInfo.dependencies??{}));
                    console.log(`    ┃${'    '.repeat(tab)}┃ (${counter}/${info.versions.length}) ${version}処理完了(${dlTime}ms)`);
                    counter++;
                }
                deps = Array.from(new Set(deps.flat()));
                console.log(`    ┃${'    '.repeat(tab)}┗ ${this.packageName}依存関係を検索完了(${deps.length}依存)`);
        
                for (let dep of deps) {
                    let depPkg = new packageController(dep);
                    deps =  [...deps, ... await depPkg.getAllDeps(tab+1)];
                }
                
                return deps;
            }
        } catch (error) {
            console.log(error);
            return [];
        }
    }
}

async function existsFileFolder (path) {
    return fs.stat(path)
        .then(_ => {
            return true;
        })
        .catch(_ => {
            return false;
        });
}

module.exports = {
    packageController,
    existsFileFolder
}