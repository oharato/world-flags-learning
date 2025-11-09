# 詳細設計書兼技術仕様書

## 1. 概要
本ドキュメントは、「国旗学習アプリ」の技術的な仕様とアーキテクチャを定義する。
デプロイ環境として Cloudflare を想定し、それに最適化された技術選定を行う。

## 2. データソース仕様

### 2.1. 国旗・国情報

*   **データファイル**: フロントエンドは `public/countries.ja.json` (日本語) および `public/countries.en.json` (英語) を静的データとして直接参照します。国旗画像は `public/flags/` に、地図画像は `public/maps/` に保存されます。
*   **情報ソース**: **Wikipedia, Wikidata, REST Countries API**
*   **理由**:
    *   「国旗の成り立ち」や歴史的背景など、アプリの目的に合致する網羅的な情報がWikipediaから得られるため。
    *   大陸情報や地図画像URLなど、Wikipediaのinfoboxから直接取得が難しい情報はWikidataやREST Countries APIで補完するため。
    *   一度JSONを生成すれば、実行時は外部に依存せず安定して高速に動作するため。

#### データ生成 (バッチ処理)
国データは、Wikipedia、Wikidata、REST Countries APIから情報を取得するバッチ処理によって自動生成します。

*   **目的**: 各種情報源から国情報を自動で取得し、フロントエンドが利用する多言語JSONファイルと国旗・地図画像を生成する。
*   **実行方法**: 開発者のPC上で手動実行するコマンドとして提供する。
    1.  **国名リストの生成**: `npm run batch:create-list`
    2.  **国データの生成と画像ダウンロード**: `npm run batch:create-data`
*   **スクリプト配置**: プロジェクトルートに `scripts/generate-country-list.mts` および `scripts/generate-data.mts` として配置する。
*   **使用技術**:
    *   **言語**: Node.js (TypeScript)
    *   **TypeScript実行環境**: **tsx**
    *   **Wikipediaクライアント**: **wikijs**
    *   **HTTPクライアント**: **node-fetch**
*   **処理フロー**:
    1.  `scripts/generate-country-list.mts` が日本語版Wikipediaの「国旗の一覧」ページから国名リストを抽出し、`scripts/country-list.json` として保存します。
    2.  `scripts/generate-data.mts` が `scripts/country-list.json` を読み込み、各国のデータを処理します。
    3.  各国のデータ取得では、日本語版Wikipedia (`ja.wikipedia.org`) と英語版Wikipedia (`en.wikipedia.org`) の両方から情報を取得します。
        -   日本語ページから言語間リンクを利用して対応する英語版ページ名を特定します。
        -   `wikijs` の `page.info()`、`page.summary()`、`page.section()` などのメソッドを使い、国名、首都、国旗画像URL、概要などの情報を抽出します。
        -   `page.info()` が返すデータ構造の多様性に対応するため、プロパティへのアクセスは防御的に行います。
        -   `page.section()` が特定のページでエラーを発生させる場合があるため、`try-catch` でハンドリングし、処理を続行します。
        -   **大陸情報**: Wikidata API (P30 property)から取得します。
        -   **地図画像URL**: WikipediaのinfoboxのHTMLを解析するか、REST Countries APIから取得します。
        -   **国旗の成り立ち・意味の解説**: 専用の国旗ページ（"Flag of [Country]"または"[国名]の国旗"）から取得し、`description` として利用します。
    4.  取得した国旗画像URLから画像をダウンロードし、`public/flags/` ディレクトリに保存します。`flag_image_url` はローカルパス (`/flags/jpn.svg` など) に変換されます。
    5.  取得した地図画像URLから画像をダウンロードし、`public/maps/` ディレクトリに保存します。`map_image_url` はローカルパス (`/maps/jpn.png` など) に変換されます。
    6.  整形した全国家のデータを `public/countries.ja.json` (日本語) および `public/countries.en.json` (英語) としてファイルに書き出します。
    7.  **各国の処理ごとにファイルに保存し、中断しても進捗を保持**するように実装されています。

*   **データ構造 (public/countries.ja.json / public/countries.en.json)**:
    ```json
    [
      {
        "id": "jpn",
        "name": "日本",
        "capital": "東京",
        "continent": "Asia",
        "flag_image_url": "/flags/jpn.svg",
        "map_image_url": "/maps/jpn.png",
        "description": "日本の国旗は「日章旗」と呼ばれ、太陽を象徴しています。...",
        "summary": "日本は東アジアに位置する島国です。..."
      },
      {
        "id": "usa",
        "name": "アメリカ合衆国",
        "capital": "ワシントンD.C.",
        "continent": "North America",
        "flag_image_url": "/flags/usa.svg",
        "map_image_url": "/maps/usa.png",
        "description": "アメリカ合衆国の国旗（アメリカがっしゅうこくのこっき、Flag of the United States）は、一般に星条旗（せいじょうき、the Stars and Stripes または the Star-Spangled Banner）と呼ばれる、13条の横縞と50個の星がデザインされた旗である。...",
        "summary": "アメリカ合衆国は、主に北アメリカに位置する国です。..."
      }
      // ... 他の国のデータ
    ]
    ```

### 2.2. ランキングデータ
*   **保存先**: **Cloudflare D1**
*   **理由**:
    *   デプロイ先である Cloudflare 環境でネイティブに動作するサーバーレスSQLデータベースであるため。
    *   使用フレームワークである Hono との親和性が非常に高い。
    *   「スコアでのソート」といったSQLクエリが必要なランキング機能の要件に合致するため。
*   **テーブル定義 (D1)**:
    
    **ranking_daily テーブル** (日次ランキング)
    | カラム名 | 型 | 説明 |
    | :--- | :--- | :--- |
    | `id` | INTEGER | 主キー (自動採番) |
    | `nickname` | TEXT | ユーザーニックネーム |
    | `score` | INTEGER | スコア |
    | `region` | TEXT | 出題範囲（地域）: 'all', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania' |
    | `format` | TEXT | クイズ形式: 'flag-to-name' (国旗→国名), 'name-to-flag' (国名→国旗) |
    | `date` | TEXT | 日付 (YYYY-MM-DD形式) |
    | `created_at` | TEXT | 登録日時 (ISO 8601形式) |
    | UNIQUE制約 | - | (nickname, region, format, date) - 同じユーザーは1日1地域1形式につき1回のみ記録（最高スコアで更新） |

    **ranking_all_time テーブル** (全期間ランキング - 上位5位のみ保持)
    | カラム名 | 型 | 説明 |
    | :--- | :--- | :--- |
    | `id` | INTEGER | 主キー (自動採番) |
    | `nickname` | TEXT | ユーザーニックネーム |
    | `score` | INTEGER | スコア |
    | `region` | TEXT | 出題範囲（地域） |
    | `format` | TEXT | クイズ形式: 'flag-to-name', 'name-to-flag' |
    | `created_at` | TEXT | 登録日時 (ISO 8601形式) |

## 3. アーキテクチャと使用技術

### 3.1. 総合アーキテクチャ
*   **デプロイ環境**: **Cloudflare Pages**
*   **構成**:
    *   フロントエンド (Vue.js) とバックエンド (Hono) を一つのプロジェクトに統合。
    *   Cloudflare Pages の Functions 機能を利用し、特定パス (`/api/*`) へのアクセスをバックエンドAPI(Hono)が処理する構成とする。

### 3.2. フロントエンド技術
*   **UIフレームワーク**: **Vue.js** (v3, Composition API)
*   **状態管理**: **Pinia** (Vue公式の状態管理ライブラリ)
*   **スタイリング**: **Tailwind CSS** (ユーティリティファーストのCSSフレームワーク)
*   **ビルドツール**: **Vite** (Vueの標準ビルドツール)
*   **ルーティング**: **Vue Router**
*   **ローカルストレージ**: ニックネームの保持にlocalStorageを使用

#### パフォーマンス最適化
*   **画像プリロード**: 次の問題の画像を事前に読み込み、スムーズな問題移行を実現
*   **画像優先読み込み**: `loading="eager"` と `fetchpriority="high"` 属性で即座に読み込み
*   **ビルド最適化**: `assetsInlineLimit: 0` でブラウザキャッシュを最大活用
*   **ローディング状態管理**: 画像読み込み完了まで選択肢を無効化

### 3.3. バックエンド技術
*   **Webフレームワーク**: **Hono** (Cloudflare Workers/Pages に最適化された高速フレームワーク)
*   **データベース**: **Cloudflare D1**
*   **連携**: HonoからD1のデータベースにアクセスし、ランキングデータの読み書きを行う。
*   **API エンドポイント**:
    *   `GET /api/ranking?region={region}&type={daily|all_time}&format={flag-to-name|name-to-flag}`: 地域別・タイプ別・形式別ランキング取得
    *   `POST /api/ranking`: スコア登録（日次ランキングと全期間トップ5に記録、regionとformatを含む）

### 3.4. マイグレーション管理
*   **ツール**: Wrangler CLI
*   **マイグレーションファイル**: `migrations/` ディレクトリに配置
    *   `0000_create_ranking_table.sql`: 初期テーブル作成
    *   `0001_create_regional_ranking_tables.sql`: 地域別ランキングテーブル追加
    *   `0002_add_format_to_ranking_tables.sql`: クイズ形式列を追加
*   **適用コマンド**: 
    *   ローカル: `npx wrangler d1 migrations apply national-flag-game-db --local`
    *   本番: `npx wrangler d1 migrations apply national-flag-game-db --remote`
```
