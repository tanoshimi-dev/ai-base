# OpenTelemetry は標準規格か / Claude Code と Codex で使えるか

## 1. 結論

- **OpenTelemetry は、CNCF がホストするオープンな観測仕様・実装群**です。  
  ISO や JIS のような公的標準そのものではありませんが、**業界で広く使われる事実上の標準**として扱ってよいです。
- **Claude Code は OpenTelemetry を公式にサポートしています。**  
  公式ドキュメントに、metrics / logs(events) / traces(beta) を OTel でエクスポートする方法があります。
- **Codex も OpenTelemetry を利用できます。**  
  Claude Code のような専用ガイドは見当たりませんが、**公式設定リファレンスと公式 OSS リポジトリ**に OTel 設定と実装があります。

## 2. OpenTelemetry は「どこの団体の標準か」

OpenTelemetry 公式サイトでは、OpenTelemetry を次のように説明しています。

- observability framework / toolkit
- traces / metrics / logs を扱う
- vendor-agnostic
- OpenTelemetry 自体は backend ではない

また公式サイトには、**OpenTelemetry は CNCF プロジェクトであり、OpenTracing と OpenCensus の統合から生まれた**とあります。  
そのため、「どこかの団体が作った標準規格か」という問いには、次の答えが適切です。

> **はい。CNCF 配下で策定・運営されている、オープンな標準仕様群です。**  
> ただし、厳密には ISO のような公的標準ではなく、**クラウドネイティブ領域のデファクト標準**です。

## 3. Claude Code で使えるか

**使えます。**

Anthropic の公式ドキュメント `Monitor usage` には、Claude Code が OpenTelemetry 経由で telemetry data を export できると明記されています。

確認できた内容:

- `CLAUDE_CODE_ENABLE_TELEMETRY=1` で有効化
- metrics を export 可能
- logs / events を export 可能
- traces は **beta**
- OTLP endpoint / protocol / headers を設定可能
- 管理者が managed settings file で一括設定可能

特に公式ドキュメントには、次の説明があります。

> Claude Code exports metrics as time series data via the standard metrics protocol, events via the logs/events protocol, and optionally distributed traces via the traces protocol.

つまり Claude Code は、**ユーザー向けに明示された OTel サポートがある**状態です。

## 4. Codex で使えるか

**使えます。**

ただし Claude Code と違って、今回確認した範囲では **「OTel の監視方法だけを説明した専用ページ」ではなく、設定リファレンスと OSS 実装側に根拠がある** 形です。

### 4.1 公式ドキュメント上の根拠

OpenAI の Codex `config-reference` には、次の設定キーがあります。

- `otel.environment`
- `otel.exporter`
- `otel.metrics_exporter`
- `otel.trace_exporter`
- `otel.log_user_prompt`

記載されている exporter 種別:

- `otel.exporter`: `none | otlp-http | otlp-grpc`
- `otel.metrics_exporter`: `none | statsig | otlp-http | otlp-grpc`
- `otel.trace_exporter`: `none | otlp-http | otlp-grpc`

これは少なくとも、**Codex にユーザー設定可能な OpenTelemetry 出力面がある**ことを示しています。

### 4.2 公式 OSS リポジトリ上の根拠

OpenAI の公式リポジトリ `openai/codex` には、以下が存在します。

- `codex-rs/otel/README.md`
  - `codex-otel is the OpenTelemetry integration crate for Codex`
- `codex-rs/core/src/otel_init.rs`
  - `build_provider(...)` で Codex 設定から OTel provider を構築
- `codex-rs/otel/src/config.rs`
  - OTLP HTTP / gRPC exporter、metrics / traces / logs 向け設定型を定義

つまり Codex は、**内部実装としても OpenTelemetry 統合を持っている**と判断できます。

## 5. Claude Code と Codex の差分

| 項目 | Claude Code | Codex |
| --- | --- | --- |
| OTel 利用可否 | 可 | 可 |
| 根拠 | 公式 monitoring guide | 公式 config reference + 公式 OSS 実装 |
| metrics | 可 | 可 |
| logs / events | 可 | 可 |
| traces | beta と明記 | 可（設定キー・実装あり） |
| 主な設定方法 | 環境変数 | `config.toml` の `otel.*` |
| 公式ドキュメントの見つけやすさ | 高い | やや低い |

## 6. このリポジトリ観点でのメモ

- **Claude Code は公式 monitoring guide があるので、導入確認はしやすい**
- **Codex も OTel 対応だが、Claude Code より「実装と設定を読む」寄り**
- 今回確認した範囲では、**どちらも OTLP 系 exporter を前提にした使い方が中心**で、Copilot CLI のような file exporter 前提とは限らない

## 7. 参照元

1. OpenTelemetry 公式: https://opentelemetry.io/docs/what-is-opentelemetry/
2. CNCF project page: https://www.cncf.io/projects/opentelemetry/
3. Anthropic Claude Code monitoring docs: https://docs.anthropic.com/en/docs/claude-code/monitoring-usage
4. OpenAI Codex config reference: https://developers.openai.com/codex/config-reference
5. OpenAI Codex OSS repository: https://github.com/openai/codex
6. `openai/codex` 内 `codex-rs/otel/README.md`
7. `openai/codex` 内 `codex-rs/core/src/otel_init.rs`
8. `openai/codex` 内 `codex-rs/otel/src/config.rs`
