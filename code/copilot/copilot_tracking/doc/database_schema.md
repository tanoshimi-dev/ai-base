# データベーススキーマ項目一覧

対象スキーマは `E:\dev\vs_code\products\ai-base\code\copilot\copilot_tracking\sys\copilot_tracking.py` 内の `SCHEMA` 定義です。  
OpenTelemetry(JSONL) から取り込んだ Copilot CLI のセッション情報・ターン情報・指示文を SQLite に保存します。

## 1. sessions テーブル

Copilot CLI の実行セッション単位の情報を記録します。

| 項目名 | 型 | 記録内容 |
| --- | --- | --- |
| `session_id` | `TEXT` | セッション識別子。主キー。`YYYYMMDD-HHMMSS-xxxxxxxx` 形式で生成される一意なID。 |
| `command_line` | `TEXT` | 実行した `copilot` コマンドライン全体。 |
| `otel_file` | `TEXT` | 取り込み元になった OpenTelemetry JSONL ファイルの保存先パス。 |
| `started_at` | `TEXT` | セッション開始時刻。通常は最初のターン開始時刻。 |
| `ended_at` | `TEXT` | セッション終了時刻。通常は最後のターン終了時刻。 |
| `exit_code` | `INTEGER` | `copilot` コマンド終了コード。 |
| `platform` | `TEXT` | 実行環境のプラットフォーム情報。`platform.platform()` の結果。 |
| `account` | `TEXT` | 推定または取得できた GitHub / Copilot 利用アカウント名。 |
| `capture_content` | `INTEGER` | プロンプト/応答本文の収集有無。1=収集あり、0=収集なし。 |
| `created_at` | `TEXT` | このセッション行をDBへ作成した時刻。 |

## 2. turns テーブル

1回の対話ターン単位で、プロンプト、応答、トークン数、ツール利用などを記録します。

| 項目名 | 型 | 記録内容 |
| --- | --- | --- |
| `id` | `INTEGER` | ターン行の連番ID。主キー。 |
| `session_id` | `TEXT` | 所属セッションID。`sessions.session_id` を参照。 |
| `trace_id` | `TEXT` | OpenTelemetry のトレースID。 |
| `root_span_id` | `TEXT` | 当該ターンのルートスパンID。 |
| `started_at` | `TEXT` | ターン開始時刻。 |
| `ended_at` | `TEXT` | ターン終了時刻。 |
| `duration_ms` | `REAL` | ターン全体の処理時間(ミリ秒)。 |
| `account` | `TEXT` | 当該ターンに紐づくアカウント名。未設定時はセッション情報などから補完される。 |
| `prompt` | `TEXT` | LLMに渡したプロンプト候補。入力メッセージや prompt 系属性から抽出した内容。 |
| `response` | `TEXT` | モデル応答候補。出力メッセージや response 系属性から抽出した内容。 |
| `model` | `TEXT` | 使用モデル名。 |
| `input_tokens` | `INTEGER` | 入力トークン数。 |
| `output_tokens` | `INTEGER` | 出力トークン数。 |
| `total_tokens` | `INTEGER` | 合計トークン数。 |
| `context_input_tokens` | `INTEGER` | コンテキスト入力トークン数。`input_tokens` とは別に文脈使用量として保持。 |
| `context_window_pct` | `REAL` | コンテキストウィンドウ使用率。 |
| `llm_calls` | `INTEGER` | 当該ターン内で発生した chat 系 LLM 呼び出し回数。 |
| `tool_calls` | `INTEGER` | 当該ターン内で発生した execute_tool 系呼び出し回数。 |
| `tool_duration_ms` | `REAL` | ツール呼び出し時間の合計(ミリ秒)。 |
| `raw_json` | `TEXT` | ターンに紐づく全スパン情報の JSON 文字列。解析用の生データ。 |
| `created_at` | `TEXT` | このターン行をDBへ作成した時刻。 |

補足:

- `UNIQUE(session_id, trace_id, root_span_id)` により同一ターンの重複登録を防止します。
- `idx_turns_session_started_at` インデックスにより、セッション別・時刻順の取得を高速化しています。

## 3. instructions テーブル

1ターンの中に含まれるユーザー指示文を、順序付きで分解保存します。

| 項目名 | 型 | 記録内容 |
| --- | --- | --- |
| `id` | `INTEGER` | 指示文行の連番ID。主キー。 |
| `turn_id` | `INTEGER` | 所属ターンID。`turns.id` を参照。 |
| `session_id` | `TEXT` | 所属セッションID。`sessions.session_id` を参照。 |
| `trace_id` | `TEXT` | OpenTelemetry のトレースID。 |
| `root_span_id` | `TEXT` | そのターンのルートスパンID。 |
| `ordinal` | `INTEGER` | ターン内での指示文の並び順。1始まり。 |
| `content` | `TEXT` | 抽出したユーザー指示文本文。 |
| `created_at` | `TEXT` | この指示文行をDBへ作成した時刻。 |

補足:

- `UNIQUE(session_id, trace_id, root_span_id, ordinal)` により同一指示文の重複登録を防止します。
- `turn_id` は `ON DELETE CASCADE` のため、ターン削除時に関連指示文も自動削除されます。
- `idx_instructions_session_turn` インデックスにより、セッション・ターン・順序での取得を高速化しています。

## 4. テーブル間の関係

1. `sessions` : セッション単位の親テーブル
2. `turns` : `sessions` に従属する対話ターン
3. `instructions` : `turns` に従属するユーザー指示文

関係は以下の通りです。

- `sessions.session_id` -> `turns.session_id`
- `sessions.session_id` -> `instructions.session_id`
- `turns.id` -> `instructions.turn_id`

## 5. データの由来

主な値の由来は次の通りです。

- セッション系: `run_wrap_command()` と `ingest_otel_file()` が記録
- ターン系: `infer_turns()` が OTel span から推定して記録
- 指示文系: `collect_user_instruction_candidates()` で抽出し `instructions` に分解保存
