# OTel monitoring とは何か

## 1. まず一言でいうと

OTel monitoring は、アプリケーションや CLI ツールの内部で何が起きたかを、**OpenTelemetry の標準的な観測データとして外から追えるようにすること** です。  
この `copilot-tracking` では、Copilot CLI 自体を改造せずに、CLI が出力する OpenTelemetry の JSONL を記録し、あとから分析できる形にしています。

ここでいう monitoring は、単なる CPU やメモリ監視だけではありません。  
**1 回の依頼に対して、どのモデルが呼ばれ、何秒かかり、何トークン使い、どのツールを何回呼んだか** まで含めて観測する、という意味で使っています。

## 2. OpenTelemetry の基本

OpenTelemetry は、観測データを共通形式で扱うための標準です。  
代表的には次の 3 種類があります。

1. **Traces**
   - 1 つの処理の流れを追うためのデータです。
   - その中の 1 つ 1 つの処理単位を **span** と呼びます。
2. **Metrics**
   - 回数、平均時間、成功率などの数値です。
3. **Logs**
   - 文字列中心のイベント記録です。

このツールが主に使っているのは **trace / span** です。  
Copilot CLI の実行中に発生した span を JSONL として保存し、その span 群から turn を推論しています。

## 3. span をどう読むか

span には概ね次のような情報があります。

- span 名
- 開始時刻 / 終了時刻
- 親子関係
- trace ID / span ID
- attributes
- events

たとえば CLI エージェント系の処理では、次のような見え方になります。

- `invoke_agent`
- `chat ...`
- `execute_tool ...`

このような span があると、

- 1 回の依頼のルートはどこか
- その配下で LLM 呼び出しが何回起きたか
- ツール実行が何回あり、合計で何 ms かかったか

を再構成できます。  
`copilot-tracking` はこの考え方で、trace 内の span を turn 単位へまとめ直しています。

## 4. このリポジトリでの OTel monitoring の流れ

`copilot-tracking` の流れは次です。

1. ラッパーが `copilot` 起動前に OTel 用の環境変数を設定する
2. Copilot CLI が OTel データを JSONL として出力する
3. Python 側が JSONL を読み込む
4. span を正規化する
5. trace / root span をもとに turn を推論する
6. SQLite の `sessions` / `turns` / `instructions` に保存する
7. `recent` / `report` / `sessions` であとから見る

実際に設定している主な環境変数は次です。

- `COPILOT_OTEL_ENABLED=true`
- `COPILOT_OTEL_FILE_EXPORTER_PATH=<session jsonl>`
- `COPILOT_OTEL_EXPORTER_TYPE=file`
- `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT=true|false`

つまりこの仕組みは、**CLI の標準出力を無理やり解析する仕組みではなく、CLI 自身が出す観測データを利用する仕組み** です。

## 5. なぜ OTel monitoring が useful なのか

通常の CLI 利用だけだと、あとから振り返れるのは画面の印象か、手元メモくらいです。  
OTel monitoring を入れると、少なくとも次が記録対象になります。

- どの prompt が長かったか
- どのモデルを使ったか
- ツール呼び出しが多かった依頼は何か
- input / output / total tokens
- context の近似値としての `context_input_tokens`
- 同一セッション継続かどうか

これにより、「なんとなく遅い」「たぶんこの依頼は重い」という感覚を、あとから比較可能なデータに変えられます。

## 6. monitoring とデバッグの違い

OTel monitoring はデバッグログと似ていますが、目的が少し違います。

- **デバッグログ**
  - 開発者がその場で原因調査するための生ログ寄り
- **OTel monitoring**
  - 後から横断比較しやすい構造化データ寄り

このツールでも `raw_json` は残していますが、中心は span をそのまま見せることではなく、**人が読みやすい turn 単位へ変換すること** にあります。

## 7. 何が分かって、何が分からないか

OTel monitoring で分かることと、分からないことを分けて考えるのが大事です。

### 分かること

- 処理の流れ
- 各処理の所要時間
- tool call の回数と合計時間
- token usage
- session / trace / span の関係
- content capture が有効なら prompt / response 候補

### 分からないこと、または注意が必要なこと

- UI 上で見えている全文と完全一致する保証
- provider 内部の非公開ロジック
- span 名や属性名が変わった後の完全互換
- `context_input_tokens` が UI の context 表示値と完全に同義かどうか

つまり、OTel monitoring は強力ですが、**CLI の内部実装そのものを直接支配できるわけではなく、観測可能な面だけを外から捉える** ものです。

## 8. この仕組みの設計上の良い点

`copilot-tracking` で OTel monitoring を採用する利点は次です。

1. **CLI 本体を改造しない**
   - 導入と保守が軽い
2. **常駐プロセスが不要**
   - ラッパー起動と終了後 ingest だけで完結する
3. **生ログと分析用データを分離できる**
   - JSONL は生データ、SQLite は分析用
4. **バージョン差分にある程度耐えられる**
   - 複数の属性候補を見にいく実装にできる

## 9. 運用上の注意

OTel monitoring は便利ですが、導入時には次を必ず考える必要があります。

### 9.1 content capture

prompt / response を保存すると、機密情報も残り得ます。  
そのため運用では次を明確にしたほうがよいです。

- デフォルトで本文を保存するか
- `--no-capture-content` を標準運用にするか
- DB / JSONL の保存場所と削除ポリシーをどうするか

### 9.2 仕様変化

CLI の OTel は固定 API ではない可能性があります。  
特に壊れやすいのは次です。

- span 名
- 属性名
- JSONL 形式
- session / trace の切り方

このため、**ingest / normalize 層で揺れを吸収する設計** が重要です。

### 9.3 monitoring の粒度

何でも保存すればよいわけではありません。  
細かすぎる raw span を全部そのまま分析対象にすると、逆に見づらくなります。

そのためこのツールは、まず turn というレビューしやすい単位に寄せています。  
必要なら raw データへ戻れるよう `raw_json` を保持する、という二段構えです。

## 10. このプロジェクトにおける OTel monitoring の整理

このリポジトリにおける OTel monitoring は、要するに次です。

- Copilot CLI の OpenTelemetry 出力を有効化する
- その JSONL をローカルで回収する
- span を turn に再構成する
- SQLite へ保存して振り返り可能にする

したがって `copilot-tracking` の価値は、OpenTelemetry を採用したこと自体ではなく、  
**OTel の生データを、CLI 利用の振り返りに使える形へ落とし直していること** にあります。
