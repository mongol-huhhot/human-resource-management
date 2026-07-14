import { reactive, ref, } from "vue";
import { defineStore, createPinia, setActivePinia } from "pinia";
import { useDbStore} from "@/stores/useDbStore";
import { buildInitColumns, }  from '@/composables/useColumns'

setActivePinia(createPinia());

export const useDataStore = defineStore("dataStore", () => {
    const baseStore = useDbStore();

    const CONST_DEF = {
        get_user_register: 'users.get_user_register',
        get_item_category: 'masters.get_item_category',
        get_item_dictionary: 'masters.get_item_dictionary',
        get_staff_profile: 'staffs.get_staff_profile',
    }

    const states = reactive({
        currentRow: {},
        approved_status: null,
        current_month: '',
        staff_code: null,
    })

    const data = reactive({
        'get_user_register': [],        
        'get_item_category': [],
        'get_item_dictionary': [],
        'get_staff_profile': [],
    })

    const params = reactive({
        attributes: {}
    })

    const itemDefs = ref([]) // array of DB items (serializable)

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

    const get_user_master = async (p = {}) => {
        return await runLoad(CONST_DEF.get_user_master, p,  'users.get_user_master')
    }

    const get_item_category = async (p = {}) => {
        return await runLoad(CONST_DEF.get_item_category, p,  'masters.get_item_category')
    }

    const get_item_dictionary = async (p = {}) => {
        return await runLoad(CONST_DEF.get_item_dictionary, p,  'masters.get_item_dictionary')
    }

    const get_user_register = async (p = {}) => {
        return await runLoad(CONST_DEF.get_user_register, p,  'users.get_user_register')
    }

    const get_staff_profile = async (p = {}) => {
        return await runLoad(CONST_DEF.get_staff_profile, p,  'staffs.get_staff_profile')
    }

    async function rowCliked(v) {
        states.currentRow = v?.data || null
    }

    /**
     * ✅ Build colDefs for the current salary items list.
     *
     * Usage in component:
     *   const cols = salaryData.buildColumnsDefine((p)=>salaryData.rowCliked(p))
     *   <AgGridPro :columns="cols" ... />
     */
    function buildColumnsDefine(onRowClicked) {
        const cols = buildInitColumns(onRowClicked)

        const items = Array.isArray(itemDefs.value) ? itemDefs.value : []
        for (let i = 0; i < items.length; i++) {
        cols.push({
            headerName: items[i].item_label,
            field: items[i].item_name,
            cellStyle: { textAlign: 'right', padding: '4px' },
        })
        }
        return cols
    }

    const login = async (p = {}) =>  await baseStore.login('authenticate.login', p)
    const logout = async (p = {}) =>  await baseStore.logout(p)
    const verify = async (p = {}) =>  await baseStore.verify(p)
    const multiQuery = async (blocks = {}, options = {}) => baseStore.multiQuery(blocks, options)
    
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

        rowCliked,
        runSave,
        saveData,
        // build AG Grid columns on-demand
        buildColumnsDefine,

        get_user_master,
        get_item_category,
        get_item_dictionary,
        get_user_register,
        get_staff_profile,
        login,
        logout,
        verify, 
        multiQuery,
        dbAccessWithMultiTags,
    }
})
