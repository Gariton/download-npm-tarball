# download-npm-tarball
指定のnpmパッケージのすべてのバージョンとすべての依存関係パッケージのtarをダウンロードする。

## 使い方
```
    > node index.js hoge
```
inde.jsを実行させる際に引数にダウンロードしたいパッケージ名をつける。

一度実行すると履歴が残るので、再度同一パッケージを取得する際には`history.json`を削除する。