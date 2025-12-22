# Countdown Web

https://szk0u.github.io/countdown-web/

React + TypeScript の静的サイトです。月末、四半期末、半期末、年度末までのカウントダウンを表示します。土日と日本の祝日を除いた営業日の残り日数も表示します。日付計算には Temporal API（@js-temporal/polyfill）を利用しています。

カスタムターゲットでは通知日時を設定すると、指定した時刻にカウントダウンを Web Push で受け取れます。

シンプルモードでは日付と残り日数、営業日換算の残り日数のみを表示できます。

## 開発

```sh
pnpm install
pnpm lefthook install
pnpm run dev
```

## ビルド

```sh
pnpm run build
```

## デプロイ

GitHub Pages にデプロイする場合は GitHub Actions の `Deploy` ワークフローを利用するか、以下のコマンドで `gh-pages` ブランチへデプロイできます。

```sh
pnpm run deploy
```
