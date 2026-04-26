# claude-tracking

Claude Code のフックシステムを使って、ターンごとの使用量を自動で SQLite に記録する小さな追跡ツールです。

常駐プロセスや OTel 設定は不要です。`install` コマンドで `~/.claude/settings.json` にフックを登録するだけで、以降の Claude Code セッションから自動的に次を記録します。

- prompt / response 本文
- input / output / cache tokens
- model 名
- tool call 回数と合計時間
- セッション・ターン番号

## ファイル

```
sys/
├── claude_tracking.py   収集とレポート本体（Python 3 標準ライブラリのみ）
├── claude-track.sh      macOS / Linux / WSL2 用ラッパー
└── claude-track.ps1     Windows PowerShell 用ラッパー
```

## 前提

- Python 3
- Claude Code CLI (`claude` コマンド) がインストール済みであること

外部ライブラリは不要です。

## セットアップ

### フックを登録する

```bash
# macOS / Linux / WSL2
python3 sys/claude_tracking.py install

# Windows PowerShell
python sys\claude_tracking.py install
```

登録後は `claude` を普段どおり使うだけで自動的に記録されます。再起動は不要です。

オプション:

```bash
# アカウント（メールアドレス）を記録する — 初回は必ず指定することを推奨
python3 sys/claude_tracking.py install --account you@example.com

# 保存場所を変える
python3 sys/claude_tracking.py install \
  --db ~/mydata/claude.db \
  --logs-dir ~/mydata/logs

# prompt / response テキストを保存しない
python3 sys/claude_tracking.py install --no-capture-content

# 既に登録済みでも強制的に上書き（--account を追加・変更した後も --force が必要）
python3 sys/claude_tracking.py install --account you@example.com --force
```

> **アカウントが NULL になる場合**  
> Claude Code のフックペイロードにはアカウント情報が含まれないため、`--account` を指定せずに install すると `sessions.account` が NULL になります。`--account EMAIL --force` で再登録すると以降のターンから記録されます。既存の NULL 行は DB を直接 UPDATE してください。

### フックを解除する

```bash
python3 sys/claude_tracking.py uninstall
```

### 登録状態と DB 統計を確認する

```bash
python3 sys/claude_tracking.py status
```

```
Hooks: installed (PostToolUse, Stop)
DB: /home/user/.claude-tracking/claude-tracking.db
  sessions=12  turns=84  tool_calls=310
```

## 保存先

既定ではホームディレクトリ配下に保存します。

| 種別 | パス |
|------|------|
| DB | `~/.claude-tracking/claude-tracking.db` |
| ツールイベント (一時) | `~/.claude-tracking/logs/{session_id}.tools.jsonl` |

Windows では概ね次です。

- DB: `%USERPROFILE%\.claude-tracking\claude-tracking.db`

## レポートを見る

### 直近のターン詳細

```bash
python3 sys/claude_tracking.py recent
python3 sys/claude_tracking.py recent 5
```

```powershell
python sys\claude_tracking.py recent
python sys\claude_tracking.py recent 5
```

出力例:

```
[1] 2026-04-26T10:23:45+00:00  session=abc12345  account=you@example.com  model=claude-sonnet-4-6  ms=4231.0  turn=3  in=2150  out=380  cache_read=1800  tools=4
prompt:
Fix the authentication bug in login.py
response:
I've identified the issue...
```

### ターン一覧（サマリー表）

```bash
python3 sys/claude_tracking.py report
python3 sys/claude_tracking.py report 10
```

```powershell
python sys\claude_tracking.py report
python sys\claude_tracking.py report 10
```

```
session_id  account            ended_at                   ms      model               turn  in_tok  out_tok  cache_read  tools  prompt
----------  -----------------  -------------------------  ------  ------------------  ----  ------  -------  ----------  -----  ------
abc12345    you@example.com    2026-04-26T10:23:45+00:00  4231.0  claude-sonnet-4-6   3     2150    380      1800        4      Fix the authenticati…
```

### セッション一覧

```bash
python3 sys/claude_tracking.py sessions
python3 sys/claude_tracking.py sessions 5
```

### ツール使用統計

```bash
python3 sys/claude_tracking.py tools
python3 sys/claude_tracking.py tools 10
```

```
tool_name  calls  avg_ms  total_ms
---------  -----  ------  --------
Bash       142    312.5   44375.0
Read       98     18.3    1793.4
Edit       67     24.1    1614.7
```

### 記録内容を全て消去

```bash
python3 sys/claude_tracking.py clear --yes
```

```powershell
python sys\claude_tracking.py clear --yes
```

DB と一時 JSONL をまとめて削除します。`--yes` なしだとエラーになります（誤実行防止）。

## 仕組み

Claude Code には**フック**と呼ばれる仕組みがあり、ツール実行前後やターン終了時にシェルコマンドを自動実行できます。`install` コマンドは次の 2 つのフックを `~/.claude/settings.json` に書き込みます。

| フック | タイミング | 処理 |
|--------|-----------|------|
| `PostToolUse` | ツール呼び出しのたびに | ツール名・入出力・実行時間を一時 JSONL に追記 |
| `Stop` | ターン完了時 | トランスクリプトを読んで prompt/response/tokens を取得し、一時 JSONL と合わせて SQLite に書き込む |

`Stop` フックが発火すると、そのセッションのターン番号（既存のターン数 + 1）を計算し、トランスクリプト JSONL の対応するターンを読んで DB に upsert します。  
一時 JSONL はターンごとに消去されるため、次のターンのツールイベントと混在することはありません。

## トランスクリプトの読み取りについて

`Stop` フックのペイロードには `transcript_path` が含まれます。このファイルは Claude Code が管理する会話履歴の JSONL で、行ごとに `{"role": "user", ...}` / `{"role": "assistant", ...}` の形式で記録されています。

ツール呼び出しを含むターンでは、`tool_use` ブロックを持つ assistant メッセージと `tool_result` ブロックだけを持つ user メッセージが挟まれます。パーサーはこれらを同一ターンとして扱い、最初の実際の user テキストを prompt、最後の assistant テキストを response として抽出します。tokens は同一ターン内の全 assistant メッセージ分を合計します。

## 補足

- `--no-capture-content` を指定すると、prompt / response テキストおよびツールの入出力を DB に保存しません。機密情報を扱うプロジェクトではこのオプションを使ってください。
- `cache_read` 列は Claude API の `cache_read_input_tokens` をそのまま表示します。
- フックは `~/.claude/settings.json` に書き込まれるため、全プロジェクト共通で有効になります。特定プロジェクトだけに限定したい場合は、そのプロジェクトの `.claude/settings.json` に手動で設定してください。
- ターンの `started_at` は、そのターン内で最初に発火した `PostToolUse` のタイムスタンプ（ツールがなければ `Stop` の発火時刻）です。`duration_ms` はこの差分から算出します。

## 主なコマンド一覧

```
install             フックを ~/.claude/settings.json に登録
  --account EMAIL     アカウントメールを Stop フックコマンドに埋め込む（推奨）
  --no-capture-content  prompt / response テキストを保存しない
  --force             既存フックを強制上書き
uninstall           フックを解除
status              登録状態と DB 統計を表示
recent [N]          直近 N ターンの詳細を表示（既定: 1）
report [N]          直近 N ターンのサマリー表を表示（既定: 20）
sessions [N]        直近 N セッションの一覧を表示（既定: 20）
tools [N]           ツール使用統計を表示（既定: 30）
clear --yes         全データを削除
```
