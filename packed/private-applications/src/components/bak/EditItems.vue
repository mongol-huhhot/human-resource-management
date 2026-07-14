<script setup>
import { computed } from 'vue';
import { formatInteger, formatMoney, toTime,  } from '@/composables/useUtils'

const props = defineProps({
  items: Array,
  closed_status: Boolean,
});

// Computed property to sort items by item_order
const sortedItems = computed(() => {
  return [...props.items].sort((a, b) => {
    return a.item_order - b.item_order;
  });
});

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//  項目タイプ。H:時間、M:お金、D:選択（適用、不適用）、S:選択（加入・未加入）、I:数値、T:テキスト、Y:日付、その他は普通の入力  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
</script>

<template>
  <div v-if="props.items && props.items.length > 0" class="table-responsive">
    <table>
      <thead class="thead-fixed">
        <tr>
          <th class="fixed-column header_col">No.</th>
          <th class="header_col">項目名</th>
          <th class="header_col">個人情報・契約マスタ値</th>
          <th class="header_col">遡及前計算結果</th>
          <th class="header_col">遡及CSV取込値(増減値)</th>
          <th class="header_col">遡及後計算結果(確定値)</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, j) in sortedItems" :key="j">
          <td class="table_td fixed-column">{{ j + 1 }}</td>
          <td v-if="item.salary_value_old != item.salary_value" class="table_td"
            style="text-align: left; padding: 6px; background-color: rgba(242, 32, 25, 0.4);">
            {{ item.item_label }}
          </td>
          <td v-else class="table_td" style="text-align: left; padding: 6px;">
            {{ item.item_label }}
          </td>
          <td class="table_td" style="text-align: right; padding-right: 4px;">
            <template v-if="item.input_type == 'M'">
              {{ formatMoney(item.master_value) }}
            </template>
            <template v-else-if="item.input_type == 'I'">
              {{ formatInteger(item.master_value) }}
            </template>
            <template v-else-if="item.input_type == 'H'">
              {{ toTime(item.master_value) }}
            </template>
            <template v-else>
              {{ item.master_value }}
            </template>
            <!-- {{ formatMoney(item.cal_value) }} -->
          </td>
          <td class="table_td" style="text-align: right; padding-right: 4px;">
            <template v-if="item.input_type == 'M'">
              {{ formatMoney(item.salary_value_old) }}
            </template>
            <template v-else-if="item.input_type == 'I'">
              {{ formatInteger(item.salary_value_old) }}
            </template>
            <template v-else-if="item.input_type == 'H'">
              {{ toTime(item.salary_value_old) }}
            </template>
            <template v-else>
              {{ item.salary_value_old }}
            </template>
            <!-- {{ formatMoney(item.salary_value_old) }} -->
          </td>
          <!-- 遡及CSV修正値 -->
          <td class="table_td" style="text-align: right; padding-right: 4px;">
            <template v-if="item.input_type == 'M'">
              {{ formatMoney(item.csv_value_retroactive) }}
            </template>
            <template v-else-if="item.input_type == 'I'">
              {{ formatInteger(item.csv_value_retroactive) }}
            </template>
            <template v-else-if="item.input_type == 'H'">
              {{ toTime(item.csv_value_retroactive) }}
            </template>
            <template v-else>
              {{ item.csv_value_retroactive }}
            </template>
          </td>
          <!-- 遡及後計算結果 -->
          <td class="table_td" style="text-align: right; padding-right: 4px;">
            <template v-if="item.input_type == 'M'">
              {{ formatMoney(item.salary_value_retroactive) }}
            </template>
            <template v-else-if="item.input_type == 'I'">
              {{ formatInteger(item.salary_value_retroactive) }}
            </template>
            <template v-else-if="item.input_type == 'H'">
              {{ toTime(item.salary_value_retroactive) }}
            </template>
            <template v-else>
              {{ item.salary_value_retroactive }}
            </template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <div v-else class="message_class">該当する給与計算項目の値はありません!</div>
</template>

<style scoped>
.message_class {
  padding-left: 20px;
  font-size: 0.9em;
  color: rgb(207, 15, 44);
}

.table-responsive {
  height: calc(100vh - 200px);
  overflow: scroll;
  width: 100%;
  /* overflow-x: auto; */
  margin-bottom: 8px;
}

.thead-fixed {
  position: sticky;
  position: -webkit-sticky;
  top: 0;
  z-index: 1002;
  background-color: rgba(233, 238, 241, 1);
}

.fixed-column {
  position: -webkit-sticky;
  position: sticky;
  left: 0;
  background-color: rgba(233, 238, 241, 1);
  z-index: 1000;
}

.header_col {
  border-bottom: 1px solid #ccc;
  border-right: 1px solid #ccc;
  text-align: center;
  color: #2f4f4f;
  font-weight: 500;
  font-size: 0.78em;
  background-color: rgba(204, 217, 228, 0.45);
  padding: 2px 12px 2px 4px;
}

.table_td {
  text-align: center;
  border-bottom: 1px solid #ccc;
  border-right: 1px solid #ccc;
  font-size: 0.78em;
}

.input_field {
  background-color: transparent !important;
  border: none;
  color: #2f4f4f;
  text-align: right;
  width: 8em;
}

.half-width {
  width: 3em;
}

table {
  border-collapse: collapse;
  table-layout: auto;
}

tbody tr:nth-child(even) {
  background-color: #f8fce9;
  /* 偶数行の背景色 */
}

tbody tr:nth-child(odd) {
  background-color: #ffffff;
  /* 奇数行の背景色 */
}
</style>
