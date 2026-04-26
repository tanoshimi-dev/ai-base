<div align="center">

```
  █████╗ ██╗      ██████╗  █████╗ ███████╗███████╗
 ██╔══██╗██║     ██╔════╝ ██╔══██╗██╔════╝██╔════╝
 ███████║██║     ██║  ███╗███████║███████╗█████╗  
 ██╔══██║██║     ██║   ██║██╔══██║╚════██║██╔══╝  
 ██║  ██║██║     ╚██████╔╝██║  ██║███████║███████╗
 ╚═╝  ╚═╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝
```

### *AI-powered developer tools — tracking, history, diagnostics*

![Python](https://img.shields.io/badge/Python-3.x-3776AB?style=flat-square&logo=python&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Platform](https://img.shields.io/badge/Platform-macOS%20│%20Linux%20│%20WSL2%20│%20Windows-lightgrey?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

</div>

---

## このリポジトリについて

**ai-base** は AI コーディングアシスタントを使う開発者向けの小さなツール集です。  
Claude Code・GitHub Copilot・Gemini CLI など、複数のツールにまたがる**記録・履歴管理・診断**の課題を解決します。

> ゆくゆくは他の AI ツールへの対応も拡充していく予定です。

---

## ツール一覧

| ツール | 対象 | カテゴリ | 説明 |
|--------|------|----------|------|
| [claude-tracking](#-claude-tracking) | Claude Code | 📊 Tracking | ターンごとのトークン・ツール使用量を SQLite に自動記録 |
| [session-vault](#-session-vault) | Claude Code | 🗄️ History | 会話履歴の保存・検索・エクスポート・ブラウザ表示 |
| [copilot-tracking](#-copilot-tracking) | GitHub Copilot | 📊 Tracking | OTel JSONL を取り込み SQLite に記録 |
| [rn-build-doctor](#-rn-build-doctor) | Gemini CLI | 🩺 Diagnostics | React Native ビルドエラーをエキスパート診断する 20 コマンド |

---

## 📊 claude-tracking

> Claude Code のフックを使い、トークン・ツール・時間を **ゼロ設定で自動記録**

```
┌──────────────────────────────────────────┐
│            Claude Code CLI               │
│   Prompt ──► Response                    │
│                  │ [Hook]                │
└──────────────────┼───────────────────────┘
                   │
       ┌───────────┴──────────┐
       ▼                      ▼
 PostToolUse Hook         Stop Hook
 (ツール実行ごと)          (ターン完了時)
       │                      │
       └──────────┬───────────┘
                  ▼
         📦 SQLite Database
      ~/.claude-tracking/claude-tracking.db
```

**記録する項目:** prompt / response / input・output・cache tokens / model / tool 名・回数・ms / session ID / turn 番号

### クイックスタート

```bash
cd code/claudecode/claude_tracking

# フック登録（これだけ）
python3 sys/claude_tracking.py install --account you@example.com

# あとは claude を普段どおり使うだけ ✅
```

### レポート例

```
$ python3 sys/claude_tracking.py report 3

session_id  account            ended_at                    ms      model              turn  in_tok  out_tok  cache  tools
----------  -----------------  --------------------------  ------  -----------------  ----  ------  -------  -----  -----
abc12345    you@example.com    2026-04-26T10:23:45+00:00  4231    claude-sonnet-4-6  3     2150    380      1800   4
abc12345    you@example.com    2026-04-25T18:04:11+00:00  2109    claude-sonnet-4-6  2     1820    290      1200   2
```

```
$ python3 sys/claude_tracking.py tools

tool_name  calls  avg_ms  total_ms
---------  -----  ------  --------
Bash       142    312.5   44375.0
Read        98     18.3    1793.4
Edit        67     24.1    1614.7
```

📄 詳細: [`code/claudecode/claude_tracking/README.md`](code/claudecode/claude_tracking/README.md)

---

## 🗄️ session-vault

> Claude Code の会話を**保存・検索・ブラウザ表示**する MCP プラグイン

Claude Code の MCP プロトコルを使い、会話履歴をプロジェクトごとに SQLite へ永続化します。  
スラッシュコマンドで保存・検索・エクスポートがすべてエディタ内で完結します。

| コマンド | 説明 |
|----------|------|
| `/session-vault:save` | 現在の会話を保存 |
| `/session-vault:history` | 保存済み会話を検索 |
| `/session-vault:extract` | 特定の会話を取り出す |
| `/session-vault:export` | Markdown / JSON でエクスポート |
| `/session-vault:viewer` | ブラウザで一覧表示 |
| `/session-vault:vault-clear` | 保存済みデータを削除 |

📄 詳細: [`code/claudecode/01/session-vault/README.md`](code/claudecode/01/session-vault/README.md)

---

## 📊 copilot-tracking

> GitHub Copilot CLI の使用量を OTel JSONL 経由で SQLite に記録

Copilot CLI をラップして OpenTelemetry JSONL を取得し、claude-tracking と同じ感覚でレポートを見られます。

```bash
cd code/copilot/copilot_tracking

# Unix
bash sys/copilot-track.sh wrap

# Windows PowerShell
.\sys\copilot-track.ps1 wrap
```

📄 詳細: [`code/copilot/copilot_tracking/README.md`](code/copilot/copilot_tracking/README.md)

---

## 🩺 rn-build-doctor

> React Native ビルドエラーを **Gemini CLI 上で即診断** する 20 コマンド拡張

ローカルで完結・外部 API 不要。iOS / Android / 共通エラーパターンを網羅したナレッジベースで、ビルド失敗の原因と修正策をその場で提示します。

```bash
# インストール
gemini extensions install rn-build-doctor

# 使用例
/rn-build-doctor:diagnose
/rn-build-doctor:ios-pod-fix
/rn-build-doctor:android-gradle-fix
```

📄 詳細: [`code/gemini/01/rn-build-doctor/README.md`](code/gemini/01/rn-build-doctor/README.md)

---

## リポジトリ構成

```
ai-base/
├── code/
│   ├── claudecode/
│   │   ├── claude_tracking/   # 📊 Claude Code usage tracker (Python)
│   │   └── 01/
│   │       └── session-vault/ # 🗄️ Conversation history plugin (TypeScript)
│   ├── copilot/
│   │   └── copilot_tracking/  # 📊 GitHub Copilot tracker (Python)
│   └── gemini/
│       └── 01/
│           └── rn-build-doctor/ # 🩺 RN build diagnostics (TypeScript)
└── doc/
    └── memo/                  # 設計メモ
```

---

## 前提条件

| ツール | 必要な環境 |
|--------|-----------|
| claude-tracking | Python 3（外部ライブラリ不要）, Claude Code CLI |
| session-vault | Node.js 20+, Claude Code CLI |
| copilot-tracking | Python 3（外部ライブラリ不要）, GitHub Copilot CLI |
| rn-build-doctor | Node.js 20+, Gemini CLI |

---

<div align="center">

**対応 AI ツールは順次拡張予定です**

[Issues](https://github.com/tanoshimi-dev/ai-base/issues) · [Pull Requests](https://github.com/tanoshimi-dev/ai-base/pulls)

</div>
