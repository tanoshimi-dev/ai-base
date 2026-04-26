# copilot-tracking レビュー観点チェックリスト

## 1. 目的とスコープ

- Copilot CLI の観測ツールとしての目的は明確か
- 「CLI 本体の改造」ではなく「外側からの観測」というスコープが適切か
- いま解く課題と、将来やりたいことが混ざっていないか
- Copilot CLI 専用であることを前提にした設計判断は妥当か

## 2. アーキテクチャ

- Wrapper / Execution / Ingest / Storage / Query の責務分離は明確か
- ラッパーが薄く保たれているか
- JSONL を生データ、SQLite を分析用データとする分離は妥当か
- 常駐プロセスなしの構成は運用面で有利か
- 失敗時に Copilot CLI の本来の利用体験を過度に壊さないか

## 3. Turn 推論ロジック

- span から turn を推論する方針は妥当か
- `invoke_agent` をルート優先とする前提は現実的か
- `chat...` span と `execute_tool...` span の集約で十分か
- 1 trace = 1 つ以上の turn とみなすモデルに破綻はないか
- 将来の span 名変更にどこまで耐えられるか
- turn 推論に失敗したときの影響範囲は限定されているか

## 4. Copilot CLI 記録仕様への依存

- OTel file exporter 前提は妥当か
- JSONL の `resourceSpans` と 1 行 1 span の両対応は十分か
- 属性名の候補探索は過不足ないか
- model / tokens / messages の取得優先順位は適切か
- `context_input_tokens` を context の近似値として扱う説明は誤解を生まないか
- Copilot CLI バージョン差分に対する追従コストは許容範囲か

## 5. データモデル

### sessions

- セッション単位メタデータとして不足はないか
- `capture_content` を持たせているのは適切か
- `command_line` や `exit_code` の保存はレビューや監査に有効か

### turns

- ターン粒度として保存項目は適切か
- prompt / response / model / tokens / tools の揃え方は妥当か
- `raw_json` を保持する設計はデバッグ性に十分寄与するか
- 将来 `raw_spans` を別テーブルに切り出す必要はあるか

### instructions

- instructions を別テーブルに分ける設計は妥当か
- turn 内で ordinal を持たせて順序保持している点は十分か

## 6. セキュリティとプライバシー

- prompt / response 保存のリスク説明は十分か
- `--no-capture-content` で実運用に耐えられるか
- デフォルトで content capture ON が妥当か
- ローカル保存先の扱いはチーム運用上問題ないか
- 機密情報や個人情報のマスキングが必要か
- 共有前提の DB / ログとして扱うべきか、個人端末限定にすべきか

## 7. 運用性

- 導入手順は十分シンプルか
- PowerShell / bash 両対応は必要十分か
- `copilot` が PATH にない場合のエラーは分かりやすいか
- ログ削除や DB クリアの運用は明確か
- `--live` と ingest 後参照の使い分けは分かりやすいか

## 8. 可観測性と分析価値

- 今保存している指標で十分に振り返りができるか
- 所要時間、token、tool usage の組み合わせは有用か
- instruction を分離保存していることに分析上の意味があるか
- context 使用量の近似値は意思決定に使えるか
- 追加したい分析軸は何か

## 9. Claude Code との差分と拡張性

- 今の設計が Copilot CLI 特化であることは妥当か
- Claude Code 対応を将来入れるなら adapter 層分離が自然か
- 共通 DB スキーマをどこまで抽象化するべきか
- provider ごとの差分をどの層で吸収するべきか
- 早すぎる一般化になっていないか

## 10. 将来の拡張候補

- provider adapter 化
- ingest 時マスキング
- raw span 詳細保持
- SQLite 以外の分析基盤対応
- モデル別 / タスク別の集計レポート
- CI やチーム共有レポートとの連携

## 11. レビュー時の問い

以下の問いを中心に議論すると、レビューが進めやすいです。

1. いまの価値提供に対して、実装は十分に小さく保てているか
2. Copilot CLI の OTel 仕様変化に対して、どこが最も壊れやすいか
3. turn 推論の前提に危ない仮定はないか
4. content 保存のデフォルトはチーム導入上適切か
5. Claude Code などへ広げるとき、今のどの設計が再利用できるか
6. 逆に、今の時点で一般化しないほうがいい部分はどこか
