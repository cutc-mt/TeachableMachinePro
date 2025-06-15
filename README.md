# Advanced Teachable Machine

GoogleのTeachable Machineクローンをベースにした、UI/UXを大幅に改善した機械学習プラットフォーム

## 機能

### 🎯 主要機能
- **ドラッグ&ドロップ画像アップロード**: 直感的な画像追加
- **リアルタイムWebカメラ撮影**: ライブ画像キャプチャ
- **TensorFlow.js統合**: ブラウザ内でのML処理
- **転移学習**: MobileNetベースの効率的なトレーニング
- **リアルタイム予測**: ライブカメラフィードでの即座の結果表示

### 📊 強化された機能
- **詳細メトリクス表示**: トレーニング進行とモデル統計
- **インタラクティブチャート**: 精度と損失の可視化
- **日本語対応**: 完全な多言語サポート
- **ステップバイステップガイド**: 初心者向けチュートリアル
- **プロフェッショナルUI**: モダンなデザインとアニメーション

## 技術スタック

- **フロントエンド**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui
- **機械学習**: TensorFlow.js
- **バックエンド**: Express.js + Node.js
- **チャート**: Recharts
- **ルーティング**: Wouter

## インストールと実行

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build
```

## 使用方法

1. **クラス作成**: 分類したいカテゴリを設定
2. **画像追加**: ドラッグ&ドロップまたはWebカメラで画像をアップロード
3. **モデルトレーニング**: エポック数を選択してトレーニング実行
4. **予測テスト**: カメラを使ってリアルタイム予測を確認
5. **メトリクス確認**: 詳細な統計情報とチャートを表示

## ファイル構造

```
├── client/                 # フロントエンド
│   ├── src/
│   │   ├── components/     # UIコンポーネント
│   │   ├── hooks/          # カスタムフック
│   │   ├── lib/            # ユーティリティ
│   │   ├── pages/          # ページコンポーネント
│   │   └── types/          # TypeScript型定義
├── server/                 # バックエンド
├── shared/                 # 共通スキーマ
└── components.json         # shadcn設定
```

## 主要コンポーネント

- `ClassManager`: トレーニングクラス管理
- `TrainingControls`: モデルトレーニング制御
- `PredictionDisplay`: 予測結果表示
- `MetricsModal`: 詳細統計表示
- `TutorialOverlay`: 使い方ガイド
- `WebcamCapture`: カメラ機能

## 開発者向け情報

### カスタムフック
- `useTensorFlow`: TensorFlow.js統合とモデル管理
- `useWebcam`: Webカメラ制御
- `useToast`: 通知システム

### 機械学習パイプライン
1. MobileNet特徴抽出器の読み込み
2. 転移学習モデルの構築
3. カスタムデータでのファインチューニング
4. リアルタイム推論

## ライセンス

MIT License

## 貢献

プルリクエストとIssueを歓迎します。