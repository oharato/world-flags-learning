# お問い合わせフォーム設定ガイド

このドキュメントでは、Formspreeを使用した問い合わせフォームの設定方法について説明します。

## 概要

本アプリケーションでは、バックエンドサーバーを必要としない静的サイト向けのフォームサービス「Formspree」を使用して問い合わせフォームを実装しています。

## Formspreeとは

Formspree は、静的サイトにフォーム機能を追加できるサービスです。HTMLフォームの `action` 属性にFormspreeのエンドポイントを指定するだけで、フォーム送信をメールで受け取ることができます。

主な特徴：
- サーバーサイドのコード不要
- スパム対策（ハニーポット、reCAPTCHA）
- 無料プランあり（月50件まで）
- 外部サービス連携（Slack, Google Sheets など）

## セットアップ手順

### 1. Formspreeアカウントの作成

1. [Formspree](https://formspree.io) にアクセス
2. 「Get Started」をクリックしてアカウントを作成
3. メールアドレスを確認

### 2. フォームの作成

1. Formspreeダッシュボードにログイン
2. 「New Form」をクリック
3. フォーム名を入力（例：「World Flags Learning お問い合わせ」）
4. 送信先のメールアドレスを設定
5. 作成後、フォームIDを取得（例：`abcd1234`）

### 3. 環境変数の設定

取得したフォームIDを環境変数として設定します。詳細は下記の「環境変数での管理」セクションを参照してください。

### 4. スパム対策

本実装では、以下のスパム対策を施しています：

#### ハニーポットフィールド
```html
<input type="text" name="_gotcha" style="display: none" tabindex="-1" autocomplete="off" />
```
このフィールドは人間には見えませんが、ボットは自動的に入力してしまいます。入力があった場合、Formspreeはそれをスパムとして処理します。

#### 追加のセキュリティ（オプション）
Formspreeダッシュボードで以下の設定が可能です：
- reCAPTCHA の有効化
- 特定のドメインからの送信のみ許可
- 送信レート制限

### 5. デプロイ

設定が完了したら、通常通りデプロイします：

```bash
npm run deploy
```

## 環境変数での管理（必須）

フォームIDは環境変数で管理します。環境変数が設定されていない場合、フォーム送信は無効になります。

### Vite環境変数の設定

1. プロジェクトルートに `.env` ファイルを作成（gitignoreに追加済みを確認）：
```
VITE_FORMSPREE_ID=your_form_id
```

2. Cloudflare Pages の環境変数にも設定：
   - Cloudflare ダッシュボード → Pages → プロジェクト → Settings → Environment variables
   - `VITE_FORMSPREE_ID` を追加

### 実装の仕組み

`Contact.vue` では環境変数からフォームIDを取得します：
```typescript
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || '';
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;
```

環境変数が設定されていない場合、送信時にエラーメッセージが表示されます。

## フォームフィールド

現在実装されているフォームフィールド：

| フィールド名 | 説明 | 必須 |
|------------|------|------|
| name | お名前 | ✓ |
| email | メールアドレス | ✓ |
| message | お問い合わせ内容 | ✓ |
| _gotcha | スパム対策用（非表示） | - |

## バリデーション

クライアントサイドで以下のバリデーションを実施：
- お名前：空でないこと
- メールアドレス：空でないこと、有効なメール形式
- メッセージ：空でないこと

## 多言語対応

問い合わせフォームは、アプリケーションの言語設定に連動して日本語と英語に対応しています。翻訳は `src/i18n/translations.ts` で管理されています。

## トラブルシューティング

### フォームが送信できない
- ブラウザの開発者ツールでネットワークエラーを確認
- Formspree のフォームIDが正しいか確認
- Formspree ダッシュボードで送信制限に達していないか確認

### スパムが多い
- Formspree ダッシュボードで reCAPTCHA を有効化
- ドメイン制限を設定

### メールが届かない
- Formspree に登録したメールアドレスを確認
- 迷惑メールフォルダを確認
- Formspree ダッシュボードで送信履歴を確認

## 参考リンク

- [Formspree 公式ドキュメント](https://formspree.io/docs)
- [Cloudflare Pages + Formspree チュートリアル](https://developers.cloudflare.com/pages/tutorials/add-an-html-form-with-formspree/)
- [Formspree ヘルプセンター](https://help.formspree.io)
