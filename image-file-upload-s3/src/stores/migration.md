# BaseStore.js 廃止メモ

## 方針

`BaseStore.js` はダミー化せず、完全に廃止します。
今後は `useDbStore.js` に統一します。

## import 変更

旧:

```js
import { useBaseStore } from '@/stores/BaseStore'
const baseStore = useBaseStore()
```

新:

```js
import { useDbStore } from '@/stores/useDbStore'
const dataStore = useDbStore()
```

## 残す互換 API

- `load(sqltag, params, options)`
- `execute(sqltag, params, options)`
- `save(sqltag, params, options)`
- `dbAccess(sqltag, params, options, SQL_PATH, URL)`
- `dbAccessWithMultiTags(params, options, SQL_PATH, URL)`
- `executeMultiQuery(params, options)`
- `excecuteMultiQuery(params, options)` ※既存 typo 互換
- `login(sqltag, params, options, SQL_PATH)`
- `verify(options)`
- `logout(options)`

## 通知・Loading

`setNotifier()` / `notify()` は使いません。

直接以下を使います。

```js
import { showSnackbar } from '@/utils/SnackBar.vue'
import { showLoading, hideLoading } from '@/utils/loadingService'
```

## Loading を出したくない場合

```js
dataStore.load('masters.get_items', params, { loading: false })
```

## 成功メッセージを出したくない場合

```js
dataStore.execute('masters.save_item', params, { showSuccessMessage: false })
```

## データなしメッセージを出したくない場合

```js
dataStore.load('masters.get_items', params, { showNoDataMessage: false })
```
