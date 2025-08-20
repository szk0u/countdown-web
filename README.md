# Countdown Web

https://szk0u.github.io/countdown-web/

React + TypeScript の静的サイトです。月末、四半期末、半期末、年度末までのカウントダウンを表示します。土日と日本の祝日を除いた営業日の残り日数も表示します。日付計算には Temporal API（@js-temporal/polyfill）を利用しています。

シンプルモードでは日付のみを表示できます。

## 開発

```sh
npm install
npm run dev
```

## ビルド

```sh
npm run build
```

## デプロイ

GitHub Pages にデプロイする場合は GitHub Actions の `Deploy` ワークフローを利用するか、以下のコマンドで `gh-pages` ブランチへデプロイできます。

```sh
npm run deploy
```
