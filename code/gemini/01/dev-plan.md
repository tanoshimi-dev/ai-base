# rn-build-doctor — Gemini CLI Extension 開発プラン

React Native の iOS / Android ビルドエラーを診断・修正する Gemini CLI Extension

---

## 1. コンセプト

ターミナルで `gemini` を起動し、「ビルドが失敗した」と伝えるだけで、エラーログを自動解析し、原因特定 → 修正手順の提示 → 自動修正まで行う Extension。

**ターゲットユーザー**: React Native 開発者（特に iOS/Android のネイティブビルドに不慣れな人）

**ユースケース例**:

- `cd ios && pod install` が失敗 → 原因と修正コマンドを提示
- Android ビルドで Gradle エラー → Java バージョン確認から修正まで
- `/doctor` コマンドで環境全体のヘルスチェック
- `/fix ios` で iOS ビルドエラーの自動修正を試行

---

## 2. Extension 構成

```
rn-build-doctor/
├── gemini-extension.json       # マニフェスト
├── GEMINI.md                   # モデルへのコンテキスト（RN ビルド知識）
├── package.json
├── tsconfig.json
├── src/
│   ├── server.ts               # MCP サーバー（メインエントリ）
│   ├── tools/
│   │   ├── diagnose.ts         # ビルドログ解析ツール
│   │   ├── doctor.ts           # 環境ヘルスチェックツール
│   │   ├── fix.ts              # 自動修正ツール
│   │   └── env-info.ts         # 環境情報収集ツール
│   ├── patterns/
│   │   ├── ios-errors.ts       # iOS エラーパターン DB
│   │   └── android-errors.ts   # Android エラーパターン DB
│   └── utils/
│       ├── log-parser.ts       # ログパーサー
│       └── shell.ts            # コマンド実行ヘルパー
├── commands/
│   ├── doctor.toml             # /doctor コマンド
│   ├── fix/
│   │   ├── ios.toml            # /fix:ios コマンド
│   │   └── android.toml        # /fix:android コマンド
│   └── diagnose.toml           # /diagnose コマンド
├── skills/
│   └── rn-build-expert/
│       └── SKILL.md            # RN ビルド専門知識（必要時のみ活性化）
└── .github/
    └── workflows/
        └── release.yml         # GitHub Actions で npm install 自動化
```

---

## 3. MCP ツール設計

### 3.1 `diagnose_build_error`

ビルドログを受け取り、エラーパターン DB と照合して診断結果を返す。

```
Input:
  - log: string        # ビルドエラーログ（全文 or 抜粋）
  - platform?: string  # "ios" | "android" | "auto"（自動判定）

Output:
  - errors: Array<{
      id: string
      severity: "critical" | "warning" | "info"
      title: string
      cause: string
      fixes: string[]        # 修正手順（人間向け）
      autoFixable: boolean   # 自動修正可能か
    }>
```

### 3.2 `check_rn_environment`

開発環境の状態を一括チェック。

```
チェック項目:
  [共通]
  - Node.js バージョン
  - npm / yarn / pnpm バージョン
  - React Native CLI バージョン
  - react-native / react のバージョン（package.json）
  - Metro Bundler の状態
  - Watchman の有無

  [iOS]
  - Xcode バージョン（xcodebuild -version）
  - CocoaPods バージョン
  - ios/Pods ディレクトリの存在
  - Podfile.lock と node_modules の同期状態
  - Ruby バージョン（CocoaPods 依存）
  - シミュレータ一覧

  [Android]
  - ANDROID_HOME の設定
  - Java バージョン（java -version）
  - Gradle バージョン（gradle-wrapper.properties）
  - Android SDK のインストール状態
  - NDK の有無
  - エミュレータ一覧
```

### 3.3 `get_project_info`

プロジェクトの設定ファイルを読み取り、構造化された情報を返す。

```
読み取り対象:
  - package.json（RN バージョン、依存関係）
  - ios/Podfile（iOS ターゲット、Hermes 設定、Flipper 設定）
  - ios/*.xcodeproj/project.pbxproj（署名設定、ターゲット）
  - android/build.gradle（AGP バージョン、Kotlin バージョン）
  - android/app/build.gradle（compileSdk、targetSdk、namespace）
  - android/gradle.properties（AndroidX、Jetifier、NewArch）
  - android/gradle/wrapper/gradle-wrapper.properties（Gradle バージョン）
  - .xcode.env（Hermes、New Arch フラグ）
  - react-native.config.js
```

### 3.4 `apply_fix`

診断結果に基づいて自動修正を実行。

```
Input:
  - fix_id: string       # エラーパターン ID
  - dry_run?: boolean    # true ならプレビューのみ

修正アクション例:
  - "ios-pod-install"    → cd ios && pod deintegrate && pod install
  - "android-clean"      → cd android && ./gradlew clean
  - "metro-cache"        → npx react-native start --reset-cache
  - "ios-derived-data"   → rm -rf ~/Library/Developer/Xcode/DerivedData
  - "android-sdk-env"    → .zshrc に ANDROID_HOME を追記
```

---

## 4. エラーパターン DB

### iOS（優先度順）

| ID                     | パターン                     | 重要度   |
| ---------------------- | ---------------------------- | -------- |
| `ios-pod-install`      | CocoaPods 依存解決エラー     | critical |
| `ios-signing`          | コード署名エラー             | critical |
| `ios-module-not-found` | Module/Framework not found   | critical |
| `ios-hermes`           | Hermes エンジン問題          | critical |
| `ios-xcode-version`    | Xcode バージョン不一致       | critical |
| `ios-min-deployment`   | Deployment Target 不一致     | warning  |
| `ios-flipper`          | Flipper 関連エラー           | warning  |
| `ios-new-arch`         | New Architecture 設定ミス    | warning  |
| `ios-swift-version`    | Swift バージョン非互換       | warning  |
| `ios-simulator-arch`   | M1/M2 シミュレータ arch 問題 | info     |

### Android（優先度順）

| ID                        | パターン                       | 重要度   |
| ------------------------- | ------------------------------ | -------- |
| `android-sdk-not-found`   | ANDROID_HOME 未設定            | critical |
| `android-gradle-java`     | Gradle/Java バージョン不一致   | critical |
| `android-namespace`       | namespace 未設定（AGP 8+）     | critical |
| `android-duplicate-class` | クラス重複                     | critical |
| `android-jetifier`        | AndroidX 混在                  | warning  |
| `android-ndk`             | NDK/CMake ビルドエラー         | warning  |
| `android-r8-proguard`     | R8/ProGuard 問題               | warning  |
| `android-memory`          | OutOfMemory（Gradle デーモン） | warning  |
| `android-keystore`        | リリースキーストア問題         | info     |

### 共通

| ID                    | パターン                 | 重要度   |
| --------------------- | ------------------------ | -------- |
| `metro-bundler`       | Metro 解決エラー         | critical |
| `metro-cache`         | Metro キャッシュ破損     | warning  |
| `node-modules`        | node_modules 破損/不整合 | warning  |
| `rn-version-mismatch` | RN バージョン不一致      | warning  |

---

## 5. カスタムコマンド

### `/doctor`（環境ヘルスチェック）

```toml
# commands/doctor.toml
[command]
description = "React Native 開発環境の総合ヘルスチェック"

[command.prompt]
text = """
check_rn_environment ツールを使って開発環境を診断してください。
結果を以下の形式でまとめてください：
- ✅ 正常な項目
- ⚠️ 警告がある項目（改善推奨）
- ❌ 問題がある項目（修正必要）
最後に、問題がある場合は修正手順を提示してください。
"""
```

### `/fix:ios` `/fix:android`（自動修正）

```toml
# commands/fix/ios.toml
[command]
description = "iOS ビルドエラーの診断と自動修正"

[command.prompt]
text = """
1. まず get_project_info で iOS 関連の設定を確認
2. 直近のビルドエラーがあれば diagnose_build_error で診断
3. 自動修正可能な問題があれば apply_fix で修正（実行前に確認）
4. 修正後、再度環境チェックして改善を確認
"""
```

### `/diagnose`（ログ解析）

```toml
# commands/diagnose.toml
[command]
description = "ビルドエラーログを貼り付けて診断"

[command.prompt]
text = """
ユーザーからビルドエラーログを受け取り、diagnose_build_error ツールで解析してください。
各エラーについて原因と修正手順を日本語で説明し、
自動修正可能な場合は apply_fix の実行を提案してください。
"""
```

---

## 6. GEMINI.md（モデルコンテキスト）

Extension ルートに配置。モデルに React Native ビルドの専門知識を与える。

```markdown
## 含める内容

- RN バージョンごとの主な変更点（0.71〜0.76）
  - 0.71: Hermes デフォルト化
  - 0.72: Metro 設定変更
  - 0.73: Java 17 必須、Flipper 削除
  - 0.74: Android namespace 必須化
  - 0.75: New Architecture デフォルト化方向
  - 0.76: 最新の変更
- iOS / Android ビルドプロセスの概要
- よくあるトラブルシューティングの流れ
- 修正コマンドの安全性に関する注意事項
  （例：DerivedData 削除は安全、Pods 再インストールは安全、
  .gradle 削除はキャッシュクリアのみ）
```

---

## 7. 技術スタック

| 項目       | 選択                                 |
| ---------- | ------------------------------------ |
| 言語       | TypeScript                           |
| MCP SDK    | `@modelcontextprotocol/sdk`          |
| ランタイム | Node.js 20+                          |
| ログパース | 正規表現ベース（外部ライブラリ不要） |
| シェル実行 | Node.js `child_process`              |
| 開発環境   | Docker + VSCode Dev Containers       |

---

## 8. 開発ステップ

### Phase 1: 基盤（1〜2日）

- [ ] `gemini extensions new rn-build-doctor mcp-server` でスキャフォールド
- [ ] Docker 開発環境セットアップ（Node.js 20 + Gemini CLI）
- [ ] MCP サーバーの骨組み作成
- [ ] `gemini extensions link .` でローカル開発リンク

### Phase 2: コアツール（3〜5日）

- [ ] `check_rn_environment` ツール実装
- [ ] `get_project_info` ツール実装
- [ ] エラーパターン DB 構築（iOS 10 + Android 10 + 共通 4）
- [ ] `diagnose_build_error` ツール実装（パターンマッチング）

### Phase 3: 自動修正（2〜3日）

- [ ] `apply_fix` ツール実装（dry_run 付き）
- [ ] 各修正アクションの安全性検証
- [ ] ユーザー確認フローの実装

### Phase 4: カスタムコマンド & コンテキスト（1〜2日）

- [ ] `/doctor`, `/fix:ios`, `/fix:android`, `/diagnose` コマンド作成
- [ ] GEMINI.md 作成
- [ ] skills/rn-build-expert/SKILL.md 作成

### Phase 5: テスト & リリース（1〜2日）

- [ ] 実際の RN プロジェクトでテスト（新規 & 既存）
- [ ] GitHub Actions ワークフロー設定
- [ ] README.md 作成
- [ ] GitHub にリリース → `gemini extensions install` で配布

---

## 9. Docker 開発環境

```dockerfile
# Dockerfile
FROM node:20-slim

RUN npm install -g @google/gemini-cli typescript

WORKDIR /workspace

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# 開発時は volume マウントで src/ を同期
CMD ["bash"]
```

```yaml
# docker-compose.yml
services:
  dev:
    build: .
    volumes:
      - .:/workspace
      - node_modules:/workspace/node_modules
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
    working_dir: /workspace

volumes:
  node_modules:
```

---

## 10. 将来の拡張案

- **Expo 対応**: `eas build` のエラー診断
- **エラーパターン自動更新**: GitHub Issues / Stack Overflow から新パターンを収集
- **ビルド時間計測**: ビルド前後で時間を計測し、ボトルネック特定
- **CI/CD 連携**: GitHub Actions のビルドログを直接解析
- **マルチ言語対応**: エラーメッセージの日英対応
- **Extension Settings 対応**: プロジェクトパス、優先プラットフォームなどをインストール時に設定
