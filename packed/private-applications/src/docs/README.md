# 入社首里手順
```text
採用決定
    ↓
本人情報収集
    ↓
雇用契約作成・締結
    ↓
社員マスタ登録
    ↓
給与・勤怠・組織設定
    ↓
社会保険手続き
    ↓
アカウント発行
    ↓
入社完了

```


## vuetify color
```text
色名	用途
primary	メインカラー
secondary	サブカラー
success	成功・正常
info	情報
warning	警告
error	エラー
surface	カード・ダイアログ背景
background	ページ背景
on-primary	primary上の文字色
on-secondary	secondary上の文字色
on-success	success上の文字色
on-info	info上の文字色
on-warning	warning上の文字色
on-error	error上の文字色
on-surface	surface上の文字色
on-background	background上の文字色
ボタン
<v-btn color="primary">
  保存
</v-btn>

<v-btn color="secondary">
  キャンセル
</v-btn>

<v-btn color="success">
  登録
</v-btn>

<v-btn color="warning">
  注意
</v-btn>

<v-btn color="error">
  削除
</v-btn>
Alert
<v-alert type="success">
  保存しました
</v-alert>

<v-alert type="error">
  エラーが発生しました
</v-alert>
Text Color
<div class="text-primary">
  Primary Text
</div>

<div class="text-error">
  Error Text
</div>
Background Color
<div class="bg-primary pa-4">
  Background Primary
</div>

<div class="bg-success pa-4">
  Background Success
</div>
Material Designの色も利用可能

VuetifyにはMaterial Design Colorもあります。

<v-btn color="red">
<v-btn color="red-darken-2">
<v-btn color="blue">
<v-btn color="blue-lighten-3">
<v-btn color="green">
<v-btn color="purple">
<v-btn color="amber">
<v-btn color="deep-orange">

例：

<v-btn color="red-darken-2">
  削除
</v-btn>

<v-btn color="green-darken-1">
  登録
</v-btn>
現在のテーマカラー確認
const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          success: '#4CAF50',
          info: '#2196F3',
          warning: '#FFC107',
          error: '#FF5252',
        }
      }
    }
  }
})

例えばSURUPAsの業務画面ならよく使うのは

primary   : 保存
success   : 登録・承認
warning   : 下書き・保留
error     : 削除
secondary : 閉じる・戻る
info      : 詳細表示

```