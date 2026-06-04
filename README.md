# HearU

<p align="center">
  <img src="app/public/logo.png" alt="HearU" width="240" />
</p>

**HearU** は、カメラに映した日本語の **指文字（手話のひらがな）** をリアルタイムに認識し、認識結果を文章としてまとめ、自然な日本語に変換して **音声で読み上げる** Web アプリケーションです。

> 聴覚障害のある方とのコミュニケーションを補助することを目的としたハッカソン作品です。

🌐 **デモ**: <https://jphack-alpha.vercel.app>

---

## ✨ 主な機能

- 🖐️ **手のランドマーク検出**: [MediaPipe Tasks Vision](https://developers.google.com/mediapipe) によって、手の 21 点のキーポイントをブラウザ上で取得します。
- 🔤 **指文字の認識**: ランドマークを正規化したうえで推論サーバーへ送信し、ひらがな（あ〜わ）の指文字を分類します。
- 📝 **文字の累積**: 同じ指文字が一定回数連続で検出された場合に文字として確定し、累積していきます。
- 💬 **自然言語化**: OpenAI ChatGPT API を使って、累積されたひらがなを自然な日本語へ変換します。
- 🔊 **音声読み上げ**: Web Speech API（`SpeechSynthesis`）で結果を発話します。

---

## 🏗️ 処理フロー

```
[ カメラ映像 ]
       │ getUserMedia
       ▼
[ HandLandmarker (MediaPipe) ]
       │ 21 点の手のランドマーク
       │ 正規化（手首を原点とした相対座標）
       ▼
[ 指文字推論サーバー (Render) ]
       │ POST /predict
       │ 確率最大のクラス → ひらがな 1 文字
       ▼
[ 連続検出による確定 & 累積 ]
       │ 入力停止を検知
       ▼
[ ChatGPT API (gpt-3.5-turbo) ]
       │ ひらがな列を自然な日本語に整形
       ▼
[ SpeechSynthesis で発話 ]
```

---

## 🛠️ 技術スタック

| 領域 | 使用技術 |
| --- | --- |
| フロントエンド | React 18, TypeScript, Vite |
| 手のランドマーク検出 | [`@mediapipe/tasks-vision`](https://www.npmjs.com/package/@mediapipe/tasks-vision) |
| ML 補助 | [`@tensorflow/tfjs`](https://www.npmjs.com/package/@tensorflow/tfjs) |
| HTTP クライアント | `axios` |
| 自然言語処理 | OpenAI ChatGPT API（`gpt-3.5-turbo`） |
| 音声合成 | Web Speech API（`SpeechSynthesis`） |
| ホスティング | Vercel |

---

## 📁 ディレクトリ構成

```
jphack/
├── README.md
└── app/                                    # フロントエンドアプリ
    ├── src/
    │   ├── App.tsx                         # メインロジック
    │   ├── App.css
    │   ├── main.tsx
    │   └── index.css
    ├── public/
    │   ├── hand_landmarker.task            # MediaPipe 用モデル
    │   ├── a-so-ikami-mikubo-model.tflite  # 指文字分類モデル（同梱）
    │   └── logo.png
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

---

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

ブラウザで <http://localhost:5173> を開きます。カメラへのアクセスを許可してください。

### ビルド

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

---

## 🔗 外部依存

- 指文字推論 API: `https://tk-2423.onrender.com/predict`
- OpenAI ChatGPT API: `https://api.openai.com/v1/chat/completions`

---

## 📝 ライセンス

未設定
