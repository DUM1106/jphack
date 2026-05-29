# HearU

カメラで日本語の **指文字（手話のひらがな）** をリアルタイムに認識し、累積された文字列を自然な日本語に変換して **音声で読み上げる** Web アプリケーションです。

聴覚障害のある方とのコミュニケーション支援を目的とした、ハッカソンプロジェクトです。

## ✨ 主な機能

- 🖐️ **手のランドマーク検出**: MediaPipe による21点のリアルタイム手指検出
- 🔤 **指文字の認識**: 学習済みモデルで日本語ひらがな（あ〜わ）を分類
- 📝 **文字の累積**: 同じ指文字が一定回数連続検出された場合に文字を確定
- 💬 **自然言語化**: OpenAI ChatGPT API により累積されたひらがなを自然な日本語へ変換
- 🔊 **音声読み上げ**: Web Speech API（`SpeechSynthesis`）で結果を発話

## 🏗️ 処理フロー

```
カメラ映像
  ↓ getUserMedia
HandLandmarker (MediaPipe)
  ↓ 21点の手のランドマーク
正規化（手首を原点とした相対座標）
  ↓ POST /predict
指文字推論サーバー (Render)
  ↓ ひらがな1文字
連続検出によるカウントと累積
  ↓ 入力停止を検知
ChatGPT API（gpt-3.5-turbo）
  ↓ 自然な日本語
SpeechSynthesis で発話
```

## 🛠️ 技術スタック

| 領域 | 使用技術 |
| --- | --- |
| フロントエンド | React 18, TypeScript, Vite |
| 手指検出 | `@mediapipe/tasks-vision` |
| ML（同梱） | `@tensorflow/tfjs` |
| HTTP クライアント | `axios` |
| 自然言語処理 | OpenAI ChatGPT API（gpt-3.5-turbo） |
| 音声合成 | Web Speech API（`SpeechSynthesis`） |

## 📁 ディレクトリ構成

```
jphack/
├── README.md
└── app/                              # フロントエンドアプリ
    ├── src/
    │   ├── App.tsx                   # メインロジック
    │   ├── App.css
    │   ├── main.tsx
    │   └── index.css
    ├── public/
    │   ├── hand_landmarker.task      # MediaPipe 用モデル
    │   ├── a-so-ikami-mikubo-model.tflite
    │   └── logo.png
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## 🚀 セットアップ

### 必要環境

- Node.js 18 以上
- pnpm（推奨）または npm

### インストール

```bash
cd app
pnpm install
```

### 環境変数

`app/` 直下に `.env` を作成し、OpenAI の API キーを設定してください。

```bash
VITE_OPENAI_API_KEY=sk-...
```

> ⚠️ `VITE_` プレフィックスを付けた環境変数はクライアントサイドにバンドルされて公開されます。本番環境ではサーバー経由でリクエストするように変更することを推奨します。

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで `http://localhost:5173` を開きます。カメラへのアクセスを許可してください。

### ビルド

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## 🔗 外部依存

- 指文字推論 API: `https://tk-2423.onrender.com/predict`
- OpenAI ChatGPT API: `https://api.openai.com/v1/chat/completions`

## 📝 ライセンス

未設定
