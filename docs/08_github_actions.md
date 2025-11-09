# GitHub Actions 自動デプロイ設定ガイド

## 概要
このガイドでは、GitHub の main/master ブランチへのプッシュまたはマージ時に、自動的に Cloudflare Pages へデプロイする設定方法を説明します。

## 前提条件
- GitHub リポジトリが作成済み
- Cloudflare アカウントが作成済み
- プロジェクトが Cloudflare Pages にデプロイ済み

## 設定手順

### 1. Cloudflare API トークンの取得

#### ステップ 1: Cloudflare ダッシュボードにアクセス
```
https://dash.cloudflare.com/profile/api-tokens
```

#### ステップ 2: API トークンを作成
1. **Create Token** ボタンをクリック
2. **Edit Cloudflare Workers** テンプレートを選択（または Custom token）
3. 以下の権限を設定:
   - **Account** → **Cloudflare Pages** → **Edit**
4. **Account Resources** で自分のアカウントを選択
5. **Continue to summary** → **Create Token** をクリック
6. 表示されたトークンをコピー（この画面を離れると二度と表示されません）

### 2. Cloudflare アカウント ID の取得

#### 方法1: ダッシュボードから
1. https://dash.cloudflare.com/ にアクセス
2. 右側のサイドバーに **Account ID** が表示されています
3. コピーしてください

#### 方法2: wrangler コマンドから
```bash
npx wrangler whoami
```
出力される `Account ID` をコピーしてください。

### 3. GitHub Secrets の設定

#### ステップ 1: GitHub リポジトリの Settings に移動
1. GitHub リポジトリのページを開く
2. **Settings** タブをクリック
3. 左メニューから **Secrets and variables** → **Actions** を選択

#### ステップ 2: Secrets を追加
**New repository secret** をクリックして、以下の2つを追加:

##### Secret 1: CLOUDFLARE_API_TOKEN
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Value**: ステップ1で取得した API トークン
- **Add secret** をクリック

##### Secret 2: CLOUDFLARE_ACCOUNT_ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID`
- **Value**: ステップ2で取得した Account ID
- **Add secret** をクリック

### 4. ワークフローファイルの確認

`.github/workflows/deploy.yml` が既に作成されています。このファイルは以下を実行します:

- main/master ブランチへのプッシュ時に自動実行
- プルリクエスト時にもプレビューデプロイを実行
- Node.js 環境のセットアップ
- 依存関係のインストール
- プロジェクトのビルド
- Cloudflare Pages へのデプロイ

### 5. 動作確認

#### ステップ 1: リポジトリにプッシュ
```bash
git add .
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

#### ステップ 2: GitHub Actions の実行を確認
1. GitHub リポジトリの **Actions** タブを開く
2. 「Deploy to Cloudflare Pages」ワークフローが実行されていることを確認
3. 緑色のチェックマーク ✅ が表示されれば成功

#### ステップ 3: デプロイを確認
- ワークフローのログに Cloudflare Pages のデプロイ URL が表示されます
- または https://national-flag-game.pages.dev にアクセスして確認

## トラブルシューティング

### エラー: "API token is invalid"
- `CLOUDFLARE_API_TOKEN` が正しく設定されているか確認
- API トークンに正しい権限（Cloudflare Pages: Edit）が付与されているか確認

### エラー: "Account ID is invalid"
- `CLOUDFLARE_ACCOUNT_ID` が正しく設定されているか確認
- Account ID が正確にコピーされているか確認

### エラー: "Project not found"
- `projectName: national-flag-game` がワークフローファイルに正しく設定されているか確認
- Cloudflare Pages で同じ名前のプロジェクトが存在するか確認

### ビルドエラー
- ローカルで `npm run build` が成功するか確認
- `package.json` の依存関係が正しく記載されているか確認

## セキュリティのベストプラクティス

✅ **実施済み**:
- API トークンは GitHub Secrets で管理（暗号化保存）
- `.gitignore` に `.env` ファイルを追加済み
- `wrangler.toml` は公開しても問題ない設定のみ記載

⚠️ **注意事項**:
- API トークンを絶対にコードにハードコードしない
- API トークンをログに出力しない
- 定期的に API トークンをローテーションする

## 手動デプロイとの併用

GitHub Actions による自動デプロイを設定した後も、以下のコマンドで手動デプロイが可能です:

```bash
npm run deploy
```

ただし、自動デプロイを有効化した場合は、基本的に Git を通じてデプロイすることを推奨します。

## まとめ

この設定により、以下のワークフローが実現されます:

1. 開発者がコードを変更
2. `git push origin main` でプッシュ
3. GitHub Actions が自動的にビルド
4. Cloudflare Pages に自動デプロイ
5. 本番環境が更新される

これにより、手動デプロイの手間が省け、デプロイミスも削減されます。
