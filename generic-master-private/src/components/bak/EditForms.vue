<script setup>
import { ref, } from 'vue';
import { ElCard, ElTabs, ElTabPane,  } from 'element-plus';
import SalaryPayrollItems from '@/components/EditItems.vue';
import { useDataStore } from '@/stores/DataStore'
import { useAppConfigStore } from '@/stores/AppConfigStore'
import MonthlyChangeJudgePage from './forms/MonthlyChangeJudgePage.vue';

const dataStore = useDataStore()
const configStore = useAppConfigStore()
configStore.loadFromWindow()

const activeName = ref('retroactive_Items')

</script>

<template>
    <el-card class="box-card">
        <template #header>
            <div style="padding: 0px !important; margin: 0px 0 0 8px !important; display: flex; justify-content: space-between; align-items: center;">
                <div style="display: flex;" class="truncated">
                    <small v-if="dataStore.states?.currentRow" style="font-size: 1.3em;margin-top: 8px; font-weight: 600;" 
                        :title="`${dataStore.states?.currentRow.staff_name}様`">
                        {{ dataStore.states?.currentRow?.staff_code }}-{{ dataStore.states?.currentRow?.staff_name }}様
                        ({{dataStore.states?.currentRow?.salary_date}})
                    </small>
                </div>
            </div>
        </template>

        <div class="tabs-container">
            <el-tabs v-model="activeName" class="full-height-tabs">
                <el-tab-pane label="I.通貨・現物による項目編集・随時改定処理" name="retroactive_Items">
                    <div class="tab-content">
                        <MonthlyChangeJudgePage></MonthlyChangeJudgePage>
                    </div>
                </el-tab-pane>
                <el-tab-pane label="II.計算確認" name="all">
                    <div class="tab-content">
                        <SalaryPayrollItems :items="dataStore.data.get_salary_detail" :closed_status="dataStore.states?.currentRow?.payroll_closed"></SalaryPayrollItems>
                    </div>
                </el-tab-pane>
            </el-tabs>
        </div>
    </el-card>
</template>

<style scoped>
.box-card {
    --el-card-padding: 6px; 
    box-sizing: border-box; 
    width: 100%; 
    height: calc(100vh - 184px);
    border: 1px solid rgb(191, 191, 191); 
    box-shadow: none; 
    border-radius: 0;
    margin-bottom: 8px;
    display: flex;
    flex-direction: column;
}

.box-card :deep(.el-card__body) {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 0 !important;
    min-height: 0; /* Important for flex children */
}

.tabs-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0; /* Important for flex children */
}

.full-height-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.full-height-tabs :deep(.el-tabs__content) {
    flex: 1;
    overflow: hidden;
    min-height: 0; /* Important for flex children */
}

.tab-content {
    height: 100%;
    overflow-y: auto;
    padding: 0 12px 12px 12px;
    box-sizing: border-box;
}

/* Optional: custom scrollbar */
.tab-content::-webkit-scrollbar {
    width: 8px;
}

.tab-content::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 4px;
}

.tab-content::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

.truncated {
    width: 35em;
    overflow: hidden;
    white-space: nowrap;
    display: inline-block;
    text-overflow: ellipsis;
    margin-left: 5px; 
    font-size: 0.8em;
}
</style>