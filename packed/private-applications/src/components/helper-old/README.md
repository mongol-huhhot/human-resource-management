## AgGridを活かした汎用ツール  
- csv出力
- 全文検索（クィックフィルター）
- カラム設定など  
機能を組み込んだコンポネント。そのままコピーして繰り返して使えます。  

AgGridPro.vueがエントランスコンポネント。


## 外部から受け取るプロパティー  

```python
# 外部から受け取るプロパティー  
const props = defineProps({
  rowData: { type: Array, default: () => [] },
  pinnedBottomRowData: { type: Array, default: () => [] },
  columns: { type: Array, required: true },
  height: { type: [Number, String], default: 730 },
  localeText: { type: Object, default: () => localeJP },

  // ✅ MUST be literal (avoid vue/valid-define-props error)
  columnPrefKey: { type: String, default: 'aggrid:columnVisibility' },
  quickFilterKey: { type: String, default: 'aggrid-quick-filter' },
})
``` 

## 使い方  
```python
# 先にimportする
import AgGridDataBrowser from '@/components/helper/AgGridPro.vue'

const agGridHandler = ref(null)

# 次に配置する

    <AgGridDataBrowser
        ref="agGridHandler"
        v-if="dataStore.data?.fb_salary_bonus_data_summary"  # data check
        :columns="dataStore.salary_bonus_summary_columns" # カラーム定義。通常のAgGridのと同じ
        :rowData="dataStore.data?.fb_salary_bonus_data_summary" # data
        height="680px"
    />
```

