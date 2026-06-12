import { reactive, ref, computed, } from "vue"
// import { ElNotification, ElLoading,} from 'element-plus'
import { defineStore, createPinia, setActivePinia } from "pinia"
import { useDbStore } from '@/stores/useDbStore.js'
import { showSnackbar } from '@/utils/SnackBar.vue'

setActivePinia(createPinia())

export const useCSVUploadStore = defineStore('CSVUploadStore', () => { 
    const dbStore = useDbStore()

    const CONST_DEF = {
        sql_path: 'fuji-sangyo/payroll/payroll-income-adjust.sql',
        csv_upload_insert: 'csv_upload_insert',
        do_transaction_monthly_revision: 'do_transaction_monthly_revision',
    }

    const params = reactive({
        attributes:null,
    })

    const dataContainer = reactive({})

    const salaryYearMonth = ref(new Date())

    const saveResult = ref([])
    const errorMessages = ref([])
    const errorLog = computed(() => dataContainer['get_error_log'])

    const transactionID = () => {
        const id = 'retro_'
        return dbStore.uniqueId(id);
    }

    const load = async ( sqltag, params={} ) => {
        // const loading = ElLoading.service();

        const p = {...params, ...params.attributes }

        try {
    
            const resp = await dbStore.dbAccess( CONST_DEF.sql_path, CONST_DEF[sqltag], { ...p } );
            const result = resp[sqltag][0]

            if(result.code != 0 ) {
                showSnackbar('データ取得にエラーが発生しました。', 'error'  )
                return []
            }
            if( result.result && result.result.length === 0 ){
                showSnackbar('条件に当てはまるデータはありませんでした。', 'warning'  )
                return []
            }

            dataContainer[sqltag] = result.result

            return dataContainer[sqltag]

        } catch(error) {
            showSnackbar('エラーが発生しました。', 'error'  )

            return null
        }
        finally {
            // loading.close();
        }
    }

    const loadHistList = async () => load('csv_upload_history_list' )
    const loadHistData = async (p) => load('csv_upload_data_select', p)
    const loadErrorLog = async (transaction_id) => load('get_error_log', {transaction_id: transaction_id})

    /**
     * 
     * @param :{transaction_id: '', login_staff: '' }
     * @returns 
     */
    const adoptToDefault = async (p={}) => { 
        const ret = load('adopt_csv_upload_data_default_transaction', p)
        if( ret && ret.length != 0 ) {
            showSnackbar('データを処理しました。', 'warning'  )
        }
        return ret;
    }

    /**
     * 
     * @param {*} p = {transaction_id: '', login_staff: ''}
     * @returns 
     */
    const adoptToResident = async (p={}) => { 
        const ret = load('adopt_csv_upload_data_resident_transaction', p)
        if( ret && ret.length != 0 ) {
            showSnackbar('データを処理しました。', 'warning'  )
        }
        return ret;
    }

    /**
     * 
     * @param {*} p = {transaction_id: '', login_staff: '', yearmonth:'' }
     * @returns 
     */
    const adoptToValues = async (p={}) => {
        const ret = load('adopt_csv_upload_data_values_transaction', p)
        if( ret && ret.length != 0 ) {
            showSnackbar('データを処理しました。', 'warning'  )
        }   
        return ret;
    }
    

    /**
     * 
     * @param {*} p = {transaction_id: '', login_staff: '', yearmonth:'' }
     * @returns 
     */
    const adoptToBonus = async (p={}) => {
        const ret = load('adopt_csv_upload_data_bonus_transaction', p)
        if( ret && ret.length != 0 ) {
            showSnackbar('データを処理しました。', 'warning'  )
        }
        return ret;
    }

    // const doTransaction = async ( transaction_id, params ) =>  {
    //     const resp = await dbStore.dbAccess( CONST_DEF.sql_path, CONST_DEF.do_transaction_monthly_revision, { transaction_id: transaction_id, ...params } );
    //     const result = resp[CONST_DEF.do_transaction_monthly_revision][0]

    //     if(result.code != 0 ) {
    //         showSnackbar('データ処理にエラーが発生しました。', 'error'  )
    //     }
    //     return ret;
    // }
    
    const doTransaction = async ( transaction_id, params ) =>  {
        const resp = await dbStore.dbAccess( CONST_DEF.sql_path, CONST_DEF.do_transaction_monthly_revision, { transaction_id: transaction_id, ...params } );
        const result = resp[CONST_DEF.do_transaction_monthly_revision][0]

        if(result.code != 0 ) {
            showSnackbar('データ処理にエラーが発生しました。', 'error'  )
            return null
        } 

        return true;
    }

    // Save csv data with transaction. Rollback if has any error
    const save = async ( csvdata, params={TRANSACTION:1} ) => {
        console.log("save csv data--", csvdata)
        if( csvdata.length <= 0 ) return;

        const transaction_id = transactionID();
        
        const p = {...params, ...params.attributes, transaction_id: transaction_id }

        console.log("save params--", p)
        

        // const loading = ElLoading.service();

        try {
    
            // 1. save csv data 
            const resp = await dbStore.dbAccess( CONST_DEF.sql_path, CONST_DEF.csv_upload_insert, {"LOOP":csvdata, ...p } );
            console.log(resp)

            const result = resp[CONST_DEF.csv_upload_insert]

            showSnackbar('CSVデータを保存しました。', 'success'  )
            // return result

            const rst = Array.isArray(result)?result:[result]

            // console.log(rst)
            saveResult.value = dataContainer[CONST_DEF.csv_upload_insert] = [...rst]

            // console.log(saveResult.value)
            errorMessages.value = dataContainer.errorMessages = rst.filter(el => el.code != 0)
            if(errorMessages.value) errorMessages.value = []
            
            // console.log(errorMessages)
            if( errorMessages.value && errorMessages.value.length > 0 ) {
                showSnackbar('データ保存にエラーが発生しました。', 'error'  )
                // console.log("error----", result.message)
                return null
            }

            const transactionResult = await doTransaction( transaction_id, p )
            if( !transactionResult ) {
                return null
            }

            // loadErrorLog(transaction_id);

            showSnackbar('CSVデータを保存しました。', 'success'  )
        } catch(error) {
            showSnackbar('エラーが発生しました。', 'error'  )
            return null
        }
        finally {
            // loading.close();
        }
    }

    const remove = async(transaction_id, params={TRANSACTION:1}) => {
        // update_user = <%login_staff%>
        // where transaction_id = <%transaction_id%>;
        // csv_upload_delete
        const p = {...params, ...params.attributes }
        // const loading = ElLoading.service();

        try {
            // 1. delete csv data 
            const resp = await dbStore.dbAccess( CONST_DEF.sql_path, CONST_DEF.csv_upload_delete, {transaction_id: transaction_id, ...p } );
            console.log(resp)

            const result = resp[CONST_DEF.csv_upload_delete]
            const rst = Array.isArray(result)?result:[result]

            dataContainer[CONST_DEF.csv_upload_delete] = [...rst]
            dataContainer.errorMessages = rst.filter(el => el.code != 0)
            if(errorMessages.value) errorMessages.value = []
            
            // console.log(errorMessages)
            if( errorMessages.value && errorMessages.value.length > 0 ) {
                showSnackbar('データ処理エラー', 'error'  )
                return null
            }

            loadHistList();

            return true;
        } catch(error) {
            showSnackbar('エラーが発生しました。', 'error'  )
            return null
        }
        finally {
            // loading.close();
        }
    }

    return {
        dataContainer,
        saveResult,
        errorMessages,
        errorLog,
        salaryYearMonth,
        params,
        loadHistList,
        loadHistData,
        loadErrorLog,
        adoptToDefault,
        adoptToResident,
        adoptToValues,
        adoptToBonus,
        load,
        save,
        remove,
    }
})
