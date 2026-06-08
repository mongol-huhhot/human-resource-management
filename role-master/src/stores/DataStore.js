import { reactive, ref, } from "vue";
import { defineStore, createPinia, setActivePinia } from "pinia";
import { useDbStore} from "@/stores/useDbStore";
import { buildInitColumns, }  from '@/composables/useColumns'

setActivePinia(createPinia());

export const useDataStore = defineStore("dataStore", () => {
    const baseStore = useDbStore();

    const CONST_DEF = {
        // get_list: 'masters.get_roles',
        // save_data: 'masters.save_roles',
    }

    const states = reactive({
        currentRow: {},
        approved_status: null,
        current_month: '',
        staff_code: null,
    })

    const data = reactive({
        // 'get_roles': [],        
    })

    const params = reactive({
        attributes: {}
    })

    const itemDefs = ref([]) // array of DB items (serializable)

    const runLoad = async (sql_tag, p = {}, targetKey = null) => {
        console.log(`Running load for SQL tag: ${sql_tag} with params:`, p)
        if(!targetKey) targetKey=sql_tag
        const ret = await baseStore.load(sql_tag, p)
        if (targetKey) data[targetKey] = ret
        return ret
    }

    const runSave = async (sql_tag, p = {}) => {
        return await baseStore.save(sql_tag, p)
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

    // const login = async (sqltag, params = {}, options = {}, SQL_PATH = null) => {
    const login = async (p = {}, options = {}, SQL_PATH = null) => await baseStore.login('authenticate.login', p, options, SQL_PATH)
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

    const formMasters = reactive({
        category: [],
        dictionary: [],
        roles: [],
        apps: [],
        loading: false,
        loadedCategoryCode: null,
    })

    const loadFormMasters = async (categoryCode) => {
        if (!categoryCode) return null

        formMasters.loading = true

        try {
            const ret = await dbAccessWithMultiTags({
                category: {
                    SQLTAG: 'masters.get_item_category',
                    category_code: categoryCode,
                    enabled: 'active',
                },
                dictionary: {
                    SQLTAG: 'masters.get_item_dictionary',
                    category_code: categoryCode,
                    enabled: 'active',
                },
                roles: {
                    SQLTAG: 'system.get_roles',
                    enabled: 'active',
                },
                apps: {
                    SQLTAG: 'system.get_apps',
                    enabled: 'active',
                },
                key_words: {
                    SQLTAG: 'system.get_permission_scope_words',
                    enabled: 'active',
                },
            })

            if (ret.code !== 0) {
            console.error('loadFormMasters failed:', ret.message)
            return ret
            }

            formMasters.category = ret.data?.category || ret.result?.category?.result || []
            formMasters.dictionary = ret.data?.dictionary || ret.result?.dictionary?.result || []
            formMasters.roles = ret.data?.roles || ret.result?.roles?.result || []
            formMasters.apps = ret.data?.apps || ret.result?.apps?.result || []
            formMasters.loadedCategoryCode = categoryCode

            return ret
        } finally {
            formMasters.loading = false
        }
    }

    return {
        states,
        params,
        data,
        formMasters,

        rowCliked,
        runSave,
        runLoad,

        buildColumnsDefine,

        // get_user_master,
        // get_item_category,
        // get_item_dictionary,
        // get_user_register,
        // get_staff_profile,

        login,
        logout,
        verify,
        multiQuery,
        dbAccessWithMultiTags,

        loadFormMasters,
    }
})

