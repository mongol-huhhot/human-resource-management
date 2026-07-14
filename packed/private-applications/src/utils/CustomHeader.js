// CustomHeader.js
import Vue from 'vue';

export default Vue.extend({
  template: `
    <div class="custom-header">
      <span>{{ params.columnName }}</span>
      <button @click="exportCSV">Export</button>
      <button @click="toggleColumns">Columns</button>
    </div>
  `,
  data() {
    return {
      params: null
    };
  },
  methods: {
    init(params) {
      this.params = params;
    },
    exportCSV() {
      this.params.api.exportDataAsCsv({ fileName: 'data_export.csv' });
    },
    toggleColumns() {
      const colDef = this.params.columnApi.getAllColumns().find(col => col.colId === this.params.column.colId);
      colDef.hide = !colDef.hide;
      this.params.api.onFilterChanged();
    }
  }
});
