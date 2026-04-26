# Claude Code / Codex 向けに同様の監視機能を広げるときの設計と検討事項

## 1. 先に結論

Copilot CLI で動いている仕組みを、そのまま Claude Code や Codex に横展開するのではなく、**provider ごとの観測差分を adapter 層で吸収する設計** にしたほうが安全です。  
再利用しやすいのは Wrapper / Ingest / Storage / Query の大枠で、最も provider 依存が強いのは **入力形式の取得方法、span 正規化、turn 推論** です。

## 2. まず確認すべき前提

他の CLI ツールへ広げる前に、各ツールについて最低限次を確認する必要があります。

| 確認項目 | Copilot CLI | Claude Code | Codex |
| --- | --- | --- | --- |
| OpenTelemetry を有効化できるか | 既知 | 要確認 | 要確認 |
| file exporter があるか | 既知 | 要確認 | 要確認 |
| JSONL か、別形式か | 既知 | 要確認 | 要確認 |
| session / trace の概念が見えるか | 既知 | 要確認 | 要確認 |
| tool call を観測できるか | 既知 | 要確認 | 要確認 |
| token / context usage を属性で取れるか | 既知 | 要確認 | 要確認 |
| prompt / response capture を切り替えられるか | 既知 | 要確認 | 要確認 |

重要なのは、**同じ「CLI エージェント」でも観測インターフェースが同じとは限らない** ことです。  
ここを曖昧にすると、設計が最初から Copilot 依存のまま固定されます。

## 3. どこを共通化し、どこを分けるべきか

### 共通化しやすい層

1. **Wrapper の制御フロー**
   - セッション ID 発行
   - ログ保存先作成
   - CLI 実行
   - 終了コード取得
   - 実行後 ingest
2. **保存先**
   - SQLite の基本運用
   - レポート表示
   - クリアや retention の扱い
3. **分析 UI**
   - recent / report / sessions のような参照系

### provider ごとに分けるべき層

1. **Telemetry の有効化方法**
   - 環境変数か、CLI フラグか、設定ファイルか
2. **入力形式**
   - OTel JSONL か、独自 JSON か、標準出力ベースか
3. **Normalize**
   - 属性名、event 構造、tool call 表現
4. **Turn inference**
   - root span の見つけ方
   - 1 trace = 何 turn か
   - session 継続の判定方法

つまり、共通化の中心は「全部同じスキーマに押し込むこと」ではなく、  
**provider ごとの差分を狭い層へ閉じ込めること** です。

## 4. 推奨アーキテクチャ

次のように provider adapter を明示した構成が扱いやすいです。

```text
Wrapper
  -> ProviderRuntimeAdapter
       -> enable telemetry
       -> build command
       -> locate raw output
  -> Raw ingest
       -> ProviderTelemetryAdapter
            -> parse raw records
            -> normalize spans/events/messages
            -> infer turns
  -> Canonical storage
       -> sessions / turns / instructions / raw artifacts
  -> Query / report
```

実装イメージとしては、少なくとも次の責務を切り分けるとよいです。

- `ProviderRuntimeAdapter`
  - 実行前設定、環境変数、引数組み立て
- `ProviderTelemetryAdapter`
  - 生データの parse
  - 正規化
  - turn 推論
- `CanonicalTurn`
  - 共通保存フォーマット

## 5. 共通スキーマは「最小安定コア」に寄せる

将来拡張を考えると、DB スキーマは最初から広く取りすぎないほうが安全です。  
おすすめは、**どの provider でも比較的安定して持てそうな最小コア** を先に決めることです。

例:

- provider
- session_id
- trace_id
- turn_id 相当
- started_at / ended_at / duration_ms
- prompt
- response
- model
- input_tokens / output_tokens / total_tokens
- tool_calls / tool_duration_ms
- capture_content
- raw_json
- schema_version
- provider_version

一方で、provider 固有の項目は無理に全部共通列へ入れず、次のどちらかで持つと運用しやすいです。

1. `raw_json` に保持する
2. `provider_attributes` のような JSON 列へ分離する

この方針にすると、Claude Code だけが持つ属性や、Codex だけが持つイベントを無理に一般化せずに済みます。

## 6. turn 推論を共通化しすぎない

Copilot CLI では `invoke_agent` と `chat ...` / `execute_tool ...` の関係から turn を組めます。  
しかし別 provider では、次のような差分があり得ます。

- ルート span 名が違う
- tool 実行が子 span ではなく event で表現される
- 1 回のユーザー依頼で複数 trace に分かれる
- streaming 中の partial response が細かい event で流れる
- session 継続が trace ではなく conversation ID で識別される

そのため、turn 推論は共通化しすぎず、各 provider adapter に次の責務を持たせるのが自然です。

- root の選定
- turn 境界の決定
- prompt / response 候補の優先順位
- tool call 集計ルール
- session continuity の判定

## 7. tool call の正規化は設計の要

CLI エージェント比較で価値が高いのは、たいてい tool usage です。  
ただし provider ごとに表現がぶれやすいので、次の正規化ルールを決めておくと後で効きます。

最低限そろえたい項目:

- `tool_name`
- `tool_kind`
- `started_at`
- `ended_at`
- `duration_ms`
- `success`
- `error_type`
- `input_summary`
- `output_summary`

特に注意すべきなのは、ある provider では「1 tool call = 1 span」でも、別 provider では「1 tool call = 複数 event」のことがある点です。  
ここを無理に同一視すると、回数や時間比較が崩れます。

## 8. token / context 指標は意味をそろえる

`input_tokens` や `context_input_tokens` のような値は、名前が似ていても意味が同じとは限りません。  
たとえば次の差があり得ます。

- prompt tokens と cached context を分けるか
- tool 結果を input に含むか
- system / developer / user を合算するか
- reasoning tokens を別で持つか

そのため設計では、値だけでなく **定義のメタデータ** を持つことが大切です。

おすすめ:

- canonical 列は最小限にする
- provider ごとの元属性名を raw に残す
- レポート側で「厳密比較可 / 参考値」の区別を出せるようにする

## 9. セキュリティとプライバシーは provider 拡張でさらに重要になる

複数 provider を扱うと、記録される内容の境界がさらに読みにくくなります。  
少なくとも次は設計時点で決めるべきです。

1. content capture のデフォルト
2. provider ごとの capture 可否
3. 保存前マスキングの有無
4. ローカル保存のみか、共有ストレージも対象にするか
5. 保持期間と削除方法
6. 誰がその DB を閲覧できるか

特に Claude Code や Codex へ広げる場合は、**各ツールの利用規約や組織内のデータ取り扱いルールに抵触しないか** を先に確認したほうがよいです。

## 10. バージョン差分に耐える仕組み

provider 拡張では、1 回作って終わりではなく、ツール更新への追従コストが継続的に発生します。  
そのため、実装より先に次を設計しておくと壊れにくくなります。

### 10.1 capability matrix

provider / version ごとに、何が取れるかを管理します。

例:

- telemetry export 対応
- content capture 対応
- tool spans 対応
- token metrics 対応
- session continuity 対応

### 10.2 fixture ベースの contract test

実際の raw 出力サンプルを fixture 化し、

- parse できるか
- turn 推論結果が維持されるか
- schema migration 後も読めるか

を継続確認できるようにします。

### 10.3 schema versioning

少なくとも次は保存しておく価値があります。

- provider 名
- provider バージョン
- adapter バージョン
- canonical schema バージョン

これがないと、あとから「どの仕様のデータか」が追えません。

## 11. OTel が使えない場合の代替設計も考える

将来の対象ツールが必ずしも OTel を公開しているとは限りません。  
その場合は次の 3 モードを分けて考えると整理しやすいです。

1. **Native OTel mode**
   - もっとも理想
2. **Native structured log mode**
   - OTel ではないが JSON や event を取得できる
3. **Best-effort transcript mode**
   - 標準出力や保存ファイルから限定的に抽出する

ただし 3 に寄るほど精度は落ちるため、  
「Copilot と同じ精度の monitoring」を期待しないよう、**capability を UI に出す設計** が必要です。

## 12. UX と運用面の検討

provider が増えると、ユーザー向け UX も設計し直す必要があります。

例:

- 実行コマンドを provider ごとに分けるか
- `wrap --provider copilot|claude|codex` にまとめるか
- DB を共通にするか、provider ごとに分けるか
- report で provider 混在表示をどうするか
- provider ごとの unsupported 項目をどう見せるか

最初は次のどちらかに寄せると無理が少ないです。

1. provider ごとに別 entrypoint
2. 共通 entrypoint だが provider adapter を明示指定

「自動判定で全部吸収」は便利に見えますが、初期段階では誤判定リスクが高いです。

## 13. 現行 `copilot-tracking` から再利用しやすいもの

現行実装から特に再利用しやすいのは次です。

- ラッパー実行後に ingest する基本フロー
- JSONL を生データ、SQLite を分析用データと分ける考え方
- `sessions` / `turns` / `instructions` への集約方針
- `raw_json` を残して後から再解析できる設計
- `--no-capture-content` のような運用スイッチ

逆に Copilot 依存が強く、そのまま再利用しにくいのは次です。

- `invoke_agent` をルート優先にする前提
- `chat ...` / `execute_tool ...` を見る推論
- Copilot 固有の属性候補順
- `context_input_tokens` の意味づけ

## 14. 推奨する進め方

Claude Code と Codex の両方へ一気に広げるより、次の順で進めるのが安全です。

1. provider adapter 抽象を導入する
2. Copilot adapter をその抽象へ載せ替える
3. 次に 1 provider だけ追加する
4. fixture と capability matrix を整備する
5. 共通レポート上の差分表現を見直す

つまり、先にマルチ provider 対応を完成させるのではなく、  
**Copilot 実装を 1 回 adapter 構造へ分解してから横展開する** のが一番安全です。

## 15. まとめ

Claude Code や Codex へ同様の監視機能を広げるときに重要なのは、  
「同じ telemetry が取れるはず」と仮定して共通化することではありません。

重要なのは次の 4 点です。

1. provider ごとの差分を adapter 層へ隔離する
2. DB は最小安定コアだけ共通化する
3. turn 推論と token 意味づけは provider 別に扱う
4. セキュリティ、version drift、capability 表示を最初から設計に入れる

この方針なら、現在の `copilot-tracking` の価値を壊さずに、将来の Claude Code / Codex 対応へ自然に伸ばしていけます。
