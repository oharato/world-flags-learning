# API仕様書

本ドキュメントは、国旗学習アプリのバックエンドAPIの仕様を定義します。

## 1. 概要
このAPIは、クイズのスコアを記録し、ランキングを提供することを目的とします。

*   **ベースURL**: `/api`
*   **データ形式**: JSON

---

## 2. エンドポイント

### 2.1. ランキング取得 `GET /ranking`

現在のスコアランキングのリストを取得します。

*   **メソッド**: `GET`
*   **エンドポイント**: `/api/ranking`

#### リクエスト
*   **ボディ**: なし

#### レスポンス
*   **`200 OK`**: 成功した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**: ランキングデータの配列。配列はスコアの高い順にソートされています。
    ```json
    {
      "ranking": [
        {
          "rank": 1,
          "nickname": "PlayerA",
          "score": 9800
        },
        {
          "rank": 2,
          "nickname": "Guest123",
          "score": 8500
        },
        {
          "rank": 3,
          "nickname": "Hero",
          "score": 7600
        }
      ]
    }
    ```

*   **`500 Internal Server Error`**: サーバー内部でエラーが発生した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "error": "ランキングの取得に失敗しました。"
    }
    ```

---

### 2.2. スコア登録 `POST /ranking`

新しいスコアをランキングに登録します。同じユーザー・地域・形式の組み合わせでも、各挑戦ごとに記録されます。

**セキュリティ対策**:
- IPアドレスベースのレート制限: 1分間に10リクエストまで
- スコア検証: サーバー側でスコアを再計算して不正なスコアを検出

*   **メソッド**: `POST`
*   **エンドポイント**: `/api/ranking`

#### リクエスト
*   **ヘッダー**:
    *   `Content-Type: application/json`
*   **ボディ**:
    ```json
    {
      "nickname": "NewPlayer",
      "score": 7700,
      "region": "Asia",
      "format": "flag-to-name",
      "correctAnswers": 8,
      "timeInSeconds": 50,
      "numberOfQuestions": 10
    }
    ```
    | キー | 型 | 必須 | 説明 |
    | :--- | :--- | :--- | :--- |
    | `nickname` | string | はい | ユーザーのニックネーム。1文字以上20文字以下。 |
    | `score` | number | はい | クイズで算出されたスコア。 |
    | `region` | string | いいえ | 出題地域。デフォルト: 'all' |
    | `format` | string | いいえ | クイズ形式 ('flag-to-name' または 'name-to-flag')。デフォルト: 'flag-to-name' |
    | `correctAnswers` | number | はい | 正解数。0以上、問題数以下。 |
    | `timeInSeconds` | number | はい | 回答時間（秒）。最小0.5秒/問、最大5分/問。 |
    | `numberOfQuestions` | number | はい | 問題数。1以上1000以下。 |


#### レスポンス
*   **`201 Created`**: 登録に成功した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**: 登録されたスコアと、その時点での順位を含んだオブジェクト。
    ```json
    {
      "data": {
        "rank": 15,
        "nickname": "NewPlayer",
        "score": 7700
      },
      "message": "スコアが正常に登録されました。"
    }
    ```

*   **`400 Bad Request`**: リクエストボディの内容が不正な場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "error": "ニックネーム、またはスコアの形式が正しくありません。"
    }
    ```
    または
    ```json
    {
      "error": "不正なスコアが検出されました: 回答時間が短すぎます"
    }
    ```

*   **`429 Too Many Requests`**: レート制限に達した場合
    *   **Content-Type**: `application/json`
    *   **ヘッダー**: `Retry-After: <seconds>`
    *   **ボディ**:
    ```json
    {
      "error": "リクエストが多すぎます。しばらく待ってから再度お試しください。",
      "retryAfter": 30
    }
    ```

*   **`500 Internal Server Error`**: サーバー内部でエラーが発生した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "error": "スコアの登録に失敗しました。"
    }
    ```

---

## 3. セキュリティ機能

### 3.1. レート制限

ランキング登録エンドポイント (`POST /api/ranking`) には、以下のレート制限が適用されます：

*   **制限**: 1分間に10リクエストまで（IPアドレスごと）
*   **識別**: Cloudflare の `cf-connecting-ip` ヘッダーを優先的に使用
*   **超過時の挙動**:
    *   HTTPステータスコード: `429 Too Many Requests`
    *   `Retry-After` ヘッダー: 次のリクエストまでの待機時間（秒）
    *   エラーメッセージ: JSON形式で日本語メッセージと待機時間を返す

### 3.2. スコア検証

不正なスコアの登録を防ぐため、以下の検証を実施します：

*   **正解数の妥当性**: 0以上、問題数以下であることを確認
*   **回答時間の妥当性**:
    *   最小時間: 問題数 × 0.5秒（人間の反応時間を考慮）
    *   最大時間: 問題数 × 5分（タイムアウトを考慮）
*   **スコア計算の一致性**: `(正解数 × 1000) - (回答時間[秒] × 10)` と一致するか確認（±100点の許容誤差）
*   **理論上の最大値**: 問題数 × 1000 を超えないことを確認
*   **負のスコア**: スコアが0以上であることを確認

検証に失敗した場合は、`400 Bad Request` を返し、具体的な理由を含むエラーメッセージを提供します。
