# ログ取得とアナリティクス

## 概要

本アプリは、サービスの改善とユーザー体験の向上のために、Cloudflare Web Analytics とカスタムログ機能を実装しています。

## 1. Cloudflare Web Analytics

### 1.1. 概要

Cloudflare Web Analytics は、プライバシーを重視したウェブサイト分析ツールです。

**特徴:**
- Cookieを使用しない
- 個人を特定する情報を収集しない
- 匿名化された集計データのみを記録
- SPAの画面遷移を自動追跡

### 1.2. トークンの取得方法

Cloudflare Web Analytics を使用するには、サイト固有のトークンを取得する必要があります。

#### 手順

1. [Cloudflare ダッシュボード](https://dash.cloudflare.com/) にログイン

2. 左側メニューから **Analytics & Logs** > **Web Analytics** を選択

3. **Add a site** ボタンをクリック

4. サイト情報を入力:
   - **Hostname**: サイトのドメイン名を入力（例: `world-flags-learning.ohchans.com`）
   - **Enable Automatic Setup**: Cloudflare でプロキシされているサイトの場合は有効化できます

5. **Done** をクリックすると、以下のようなスクリプトタグが表示されます:
   ```html
   <script defer src='https://static.cloudflareinsights.com/beacon.min.js' 
           data-cf-beacon='{"token": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}'></script>
   ```

6. `"token":` の後に続く32文字の英数字がトークンです。この値をコピーしてください。

#### 既存サイトのトークン確認方法

すでに登録済みのサイトのトークンを確認する場合:

1. **Analytics & Logs** > **Web Analytics** に移動
2. 対象のサイトをクリック
3. 右上の **⚙️ 設定アイコン** または **Manage site** をクリック
4. **JS Snippet** セクションでトークンを確認できます

#### トークンの設定

取得したトークンを `index.html` の以下の箇所に設定します:

```html
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" 
        data-cf-beacon='{"token": "ここに取得したトークンを貼り付け"}'></script>
```

**注意事項:**
- トークンはサイトごとに一意です
- トークンは公開されても問題ありません（データの書き込みのみに使用されます）
- トークンを変更すると、過去のデータとの連続性が失われます

### 1.3. 収集されるデータ

- ページビュー数
- ユニーク訪問者数
- ページ滞在時間
- 参照元URL
- 国/地域
- ブラウザ/OS情報
- デバイスタイプ

### 1.4. SPAサポート

Vue Router を使用した SPA の画面遷移は、Cloudflare Web Analytics が自動的に検出し追跡します。History API を使用したルーティング（history モード）に対応しています。

## 2. バックエンドログ

### 2.1. アクセスログ

すべてのAPIリクエストに対して、以下の情報を記録します:

```json
{
  "type": "access",
  "timestamp": "2025-06-09T12:00:00.000Z",
  "method": "GET",
  "path": "/api/ranking",
  "ip": "203.0.113.1",
  "country": "JP",
  "userAgent": "Mozilla/5.0...",
  "statusCode": 200,
  "responseTimeMs": 45
}
```

**収集項目:**
| 項目 | 説明 |
|------|------|
| timestamp | リクエスト日時（ISO 8601形式） |
| method | HTTPメソッド |
| path | リクエストパス |
| ip | クライアントIPアドレス |
| country | 国コード（Cloudflareから取得） |
| userAgent | ブラウザ情報 |
| statusCode | HTTPステータスコード |
| responseTimeMs | レスポンス時間（ミリ秒） |

### 2.2. エラーログ

APIでエラーが発生した場合、以下の情報を記録します:

```json
{
  "type": "error",
  "timestamp": "2025-06-09T12:00:00.000Z",
  "method": "POST",
  "path": "/api/ranking",
  "ip": "203.0.113.1",
  "country": "JP",
  "userAgent": "Mozilla/5.0...",
  "statusCode": 500,
  "errorMessage": "Database connection failed",
  "stackTrace": "Error: Database connection failed\n    at..."
}
```

**追加項目:**
| 項目 | 説明 |
|------|------|
| errorMessage | エラーメッセージ |
| stackTrace | スタックトレース（存在する場合） |

### 2.3. 実装

`functions/api/server.ts` にミドルウェアとして実装されています:

```typescript
app.use('*', async (c, next) => {
  const startTime = Date.now();
  const { ip, country, userAgent } = getClientInfo(c);
  
  try {
    await next();
    // アクセスログを記録
    logAccess({ ... });
  } catch (error) {
    // エラーログを記録
    logError({ ... });
    throw error;
  }
});
```

### 2.4. ログの確認方法

ログは Cloudflare ダッシュボードで確認できます:

1. **Workers & Pages** に移動
2. プロジェクト（`world-flags-learning`）を選択
3. **Functions** > **Logs** タブを開く
4. リアルタイムログまたは過去のログを確認

## 3. フロントエンドエラーログ

### 3.1. 概要

フロントエンドで発生したエラーをキャプチャし、コンソールに記録します。

### 3.2. キャプチャされるエラー種別

1. **Vueコンポーネントエラー**
   - テンプレート内のエラー
   - ライフサイクルフック内のエラー
   - computed / watch 内のエラー

2. **JavaScriptエラー**
   - 未処理の例外
   - 構文エラー
   - 参照エラー

3. **Promiseエラー**
   - 未処理の Promise rejection
   - async/await 内のエラー

### 3.3. ログ形式

```json
{
  "type": "vue-error|js-error|promise-error",
  "timestamp": "2025-06-09T12:00:00.000Z",
  "message": "Cannot read property 'name' of undefined",
  "stack": "TypeError: Cannot read property...",
  "component": "QuizPlay",
  "info": "render",
  "url": "https://world-flags-learning.ohchans.com/quiz/play",
  "userAgent": "Mozilla/5.0..."
}
```

### 3.4. 実装

`src/main.ts` にグローバルエラーハンドラーとして実装されています:

```typescript
// Vueエラーハンドラー
app.config.errorHandler = (err, instance, info) => { ... };

// JavaScriptエラーハンドラー
window.addEventListener('error', (event) => { ... });

// Promiseエラーハンドラー
window.addEventListener('unhandledrejection', (event) => { ... });
```

## 4. 画面遷移ログ

### 4.1. 概要

SPA（Single Page Application）での画面遷移は、Cloudflare Web Analytics が自動的に追跡します。

### 4.2. 追跡される遷移

- ホーム → クイズ設定
- クイズ設定 → クイズプレイ
- クイズプレイ → クイズ結果
- クイズ結果 → ランキング
- ホーム → 学習モード
- すべてのページ → プライバシーポリシー

### 4.3. 仕組み

Cloudflare Web Analytics のビーコンスクリプトは、以下を監視します:

1. `history.pushState()` の呼び出し
2. `popstate` イベント

Vue Router は history モードを使用しているため、すべての画面遷移が自動的に記録されます。

## 5. Cloudflare ダッシュボードでの分析

### 5.1. Web Analytics

以下の指標を確認できます:

- **トラフィック概要**: ページビュー、ユニーク訪問者、直帰率
- **地理情報**: 国別・地域別のアクセス分布
- **デバイス情報**: ブラウザ、OS、デバイスタイプ
- **パフォーマンス**: Core Web Vitals（LCP、FID、CLS）
- **参照元**: トラフィックソースの分析

### 5.2. Functions Logs

以下の情報を確認できます:

- APIリクエストの成功/失敗
- レスポンス時間
- エラー詳細とスタックトレース
- リクエスト元の情報

### 5.3. D1 Metrics

データベース関連の指標:

- クエリ実行回数
- クエリ実行時間
- データベースサイズ

## 6. プライバシーへの配慮

### 6.1. 収集しない情報

- メールアドレス
- パスワード
- クレジットカード情報
- その他の個人を特定できる情報

### 6.2. データの匿名化

- IPアドレスは国/地域の推定にのみ使用
- ニックネームは任意入力であり、実名ではない

### 6.3. プライバシーポリシー

詳細は `/privacy-policy` ページを参照してください。

## 7. トラブルシューティング

### 7.1. アナリティクスデータが表示されない

1. ビーコンスクリプトが正しく埋め込まれているか確認
2. トークンが正しいか確認
3. アドブロッカーが無効になっているか確認
4. Cloudflare ダッシュボードでサイトが登録されているか確認

### 7.2. ログが表示されない

1. Cloudflare ダッシュボードで Functions Logs を確認
2. ログストリーミングが有効になっているか確認
3. タイムゾーン設定を確認

### 7.3. エラーログが記録されない

1. ブラウザの開発者コンソールを確認
2. エラーハンドラーが正しく設定されているか確認
3. エラーが try-catch でキャッチされていないか確認
