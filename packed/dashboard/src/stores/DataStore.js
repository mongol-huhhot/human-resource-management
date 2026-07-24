import { reactive } from "vue";
import { defineStore } from "pinia";
import { useDbStore } from "@/stores/useDbStore";
import { buildInitColumns } from "@/composables/useColumns";

export const useDataStore = defineStore("dataStore", () => {
    const baseStore = useDbStore();

    const CONST_DEF = {
        get_item_category: 'masters.get_item_category',
        get_staff_profile_by_request: 'staffs.get_staff_profile_by_request',
    }

    const states = reactive({
        currentRow: {},
    })

    const data = reactive({
        'category': [],
        get_staff_profile_by_request: [],
    })

    const params = reactive({
        attributes: {}
    })

    const runLoad = async (sql_tag, p = {}, targetKey = null) => {
        if(!targetKey) targetKey=sql_tag
        const ret = await baseStore.load(sql_tag, p)
        if (targetKey) data[targetKey] = ret
        return ret
    }

    const runSave = async (sql_tag, p = {}) => {
        return await baseStore.save(sql_tag, p)
    }

    const saveData = async (sqltag, p = {}) => {
        return await runSave(sqltag, p)
    }

    const get_item_category = async (p = {}) => {
        return await runLoad(CONST_DEF.get_item_category, p, 'category')
    }

    const get_staff_profile_by_request = async (p = {}) => {
        return await runLoad(CONST_DEF.get_staff_profile_by_request, p, 'get_staff_profile_by_request')
    }

    // グリッドのセルクリックで選択行を共有する（user-master と同じチャネル）
    const rowClicked = (v) => {
        states.currentRow = v?.data || null
    }

    // StaffList 用の列定義。onRowClicked は staff_code/staff_name セルに紐づく
    function buildColumnsDefine(onRowClicked) {
        return buildInitColumns(onRowClicked)
    }

    const login = async (p = {}, options = {}, SQL_PATH = null) => await baseStore.login('authenticate.login', p, options, SQL_PATH)
    const logout = async (p = {}) =>  await baseStore.logout(p)
    const verify = async (p = {}) =>  await baseStore.verify(p)

    const dbAccessWithMultiTags = async (params = {}, options = {}) => {
        try {
            return await baseStore.dbAccessWithMultiTags(params, options)
        } catch (error) {
            console.error('Error in dbAccessWithMultiTags:', error)
            return {
                code: -1,
                message: error.message || 'データ取得に失敗しました。',
                result: null,
                raw: null,
            }
        }
    }

    return {
        states,
        params,
        data,

        runSave,
        saveData,

        get_item_category,
        get_staff_profile_by_request,
        rowClicked,
        buildColumnsDefine,

        login,
        logout,
        verify,
        dbAccessWithMultiTags,
    }
})
