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

### 2.2. クイズセッション開始 `POST /quiz/start`

クイズを開始し、セッショントークンを取得します。このトークンはスコア登録時に必要です。

*   **メソッド**: `POST`
*   **エンドポイント**: `/api/quiz/start`

#### リクエスト
*   **ヘッダー**:
    *   `Content-Type: application/json`
*   **ボディ**:
    ```json
    {
      "numberOfQuestions": 10,
      "region": "Asia",
      "format": "flag-to-name",
      "questionIds": ["jpn", "usa", "fra", "deu", "gbr", "ita", "esp", "chn", "kor", "bra"]
    }
    ```
    | キー | 型 | 必須 | 説明 |
    | :--- | :--- | :--- | :--- |
    | `numberOfQuestions` | number | はい | 問題数。1以上1000以下。 |
    | `region` | string | いいえ | 出題地域。デフォルト: 'all' |
    | `format` | string | いいえ | クイズ形式 ('flag-to-name' または 'name-to-flag')。デフォルト: 'flag-to-name' |
    | `questionIds` | string[] | はい | 出題する問題のIDリスト。 |

#### レスポンス
*   **`200 OK`**: 成功した場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "sessionToken": "eyJzdGFydFRpbWUiOjE3MDA...",
      "message": "クイズセッションを開始しました"
    }
    ```

*   **`400 Bad Request`**: リクエストボディの内容が不正な場合
    *   **Content-Type**: `application/json`
    *   **ボディ**:
    ```json
    {
      "error": "問題数とquestionIdsの数が一致しません"
    }
    ```

---

### 2.3. スコア登録 `POST /ranking`

新しいスコアをランキングに登録します。同じユーザー・地域・形式の組み合わせでも、各挑戦ごとに記録されます。

**セキュリティ対策**:
- IPアドレスベースのレート制限: 1分間に10リクエストまで
- スコア検証: サーバー側でスコアを再計算して不正なスコアを検出
- セッショントークン検証: クイズ開始→回答→終了の正規フローを検証

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
      "numberOfQuestions": 10,
      "sessionToken": "eyJzdGFydFRpbWUiOjE3MDA...",
      "answeredQuestionIds": ["jpn", "usa", "fra", "deu", "gbr", "ita", "esp", "chn", "kor", "bra"]
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
    | `sessionToken` | string | はい | クイズ開始時に取得したセッショントークン。 |
    | `answeredQuestionIds` | string[] | はい | 回答した問題のIDリスト。 |


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
    または
    ```json
    {
      "error": "セッション検証エラー: セッショントークンの署名が無効です"
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

### 3.3. セッショントークン検証

クイズの正規フロー（開始→回答→終了）を検証し、直接APIを叩いた不正なスコア登録を防止します。

#### フロー
1. **クイズ開始時**: `POST /api/quiz/start` でセッショントークンを取得
2. **各問題に回答**: フロントエンドで回答履歴を記録
3. **スコア登録時**: `POST /api/ranking` でセッショントークンと回答履歴を送信

#### 検証項目
*   **トークンの署名**: HMAC-SHA256で署名されたトークンの改ざんを検出
*   **トークンの有効期限**: 発行から1時間以内のトークンのみ有効
*   **トークンの開始時刻**: 未来の時刻を持つトークンを拒否
*   **問題セットの一致**: 回答した問題が元の問題セットに含まれていることを確認
*   **回答数の一致**: 回答数が問題数と一致することを確認
*   **経過時間の整合性**: 報告された回答時間がセッション開始からの経過時間を超えていないことを確認

#### エラーメッセージ例
*   `セッション検証エラー: セッショントークンの署名が無効です`
*   `セッション検証エラー: セッショントークンの有効期限が切れています`
*   `セッション検証エラー: 回答数が一致しません`
*   `クイズ設定がセッションと一致しません`
