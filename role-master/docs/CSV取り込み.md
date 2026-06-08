## CSV取り込み

### CSV取り込み項目

| № | 項目記号 | 名称 | 説明 |
| -- | -- | -- | -- |
| 1 | user_id | ユーザーID | 必須。ログインユーザーID |
| 2 | role_codes | ロールコード | 必須。ロールコード。複数ある場合、"staff,group_manager"の用に""で囲んだコンマ区切りのロール記号 |
| 3 | start_date | 適用開始日  | 必須。例：2026-06-01 |
| 4 | end_date | 適用終了日 | 任意。空なら無期限。例：2026-06-30 |
| 5 | enabled | 有効状態 | 任意。active(有効)/inactive（無効） |
| 6 | operation | 操作 | 任意。add(既存ロールに追加)/replace（ 既存ロールを置換）/remove(role_codesのロールを既存ロールから削除)。指定なしの場合は、replaceと等しい |
| 7 | remarks | 備考 | 任意。ITS管理者用など参考になるように |   


### CSV取り込みデータサンプル

```csv
user_id,role_codes,start_date,end_date,enabled,operation,remarks
ユーザーID,ロールコード,適用開始日,適用終了日,適用終了日,有効状態,操作,備考
its,"staff,group_manager",2026-06-01,2026-06-30,active,replace,ITS管理者用
chen,"department_manager,hr_manager",2026-06-01,,active,add,人事権限追加
liu,"staff",2026-06-01,,active,remove,スタッフ権限削除
```

