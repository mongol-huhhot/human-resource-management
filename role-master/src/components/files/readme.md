## object-key 構成項目 
- $tenantId： テナントID
- $category： 分類。staff
- $ownerType：ファイルの所与者。例えば、staff, contract, user,...など, 
- $ownerId：所与者ID、staff_1213, contract_123444, user_test@janga.co.jp,....
- $fileKind：ファイル種別。thumnail, mynumber_front, mynumber_back,....
- $uuid：uuid。自動追加
- $ext：ファイルの拡張子 。自動追加

## ローカル保存式(files カラムの構造)

```json
file
{
    "object_key":"$tenantId/$category/$ownerType/$ownerId/$fileKind",
    "show_order":1,
    "removed": true,
}

```
