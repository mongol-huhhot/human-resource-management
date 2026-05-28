import { defineStore, createPinia, setActivePinia } from "pinia";
import { useDBConnectionStore } from "@/stores/DBConnectionStore.js";
import { ElNotification, ElLoading } from "element-plus";
import { reactive } from 'vue'

setActivePinia(createPinia());

/**
 * これはベースストアで、他のストアが継承して利用する
 * もとuseDBConnectionStoreストアにアクセス結果を知らせるメッセージ表示機能を追加
 * 
 * 陳。2023/11/22
 */
export const useBaseStore = defineStore('baseStore', () => {
    const dbStore = useDBConnectionStore();

    //const sqlpath = 'fuji-sangyo/payroll/payroll-resident-tax-Template.sql'
    const sqlpath = 'fuji-sangyo/payroll/payroll-retroactive.sql'

    // the states of the module
    const state = reactive({
        staff_permission:'',
        salary_month:'',
    })

    // some parameters from outside, or initial properties
    const params = reactive({
        props: {},// the parameters from (login module. usually given from index.php, which contains login staff id)
    })

    const load = async (sqltag=null, param={}) => {
        if(!sqltag) return null;
        console.log("dddd")
        const loading = ElLoading.service();
  
        try {
          const resp = await dbStore.dbAccess( sqlpath, sqltag, {...param } );
          const result = resp[sqltag][0]
    
          if(result.code != 0 ) {
              ElNotification({
                  title: 'データ取得エラー',
                  message: 'データ取得にエラーが発生しました。',
                  type: 'error',
              })
              return null
          }
          if( result.result && result.result.length === 0 ){
            //   ElNotification({
            //       title: 'データなし',
            //       message: '条件に当てはまるデータはありませんでした。',
            //       type: 'warning',
            //   })
              return null
          }

          return result.result

        } catch(error) {
          ElNotification({
              title: 'エラー',
              message: 'エラーが発生しました。',
              type: 'error',
          })
          return null
        }
        finally {
          loading.close();
        }
    }

    // データをDBに保存する内部関数
    const save = async (sqltag=null, params={}) => {
        if(!sqltag) return null;
        
        const loading = ElLoading.service();

        try {
            const resp = await dbStore.dbAccess( sqlpath, sqltag, {...params} );
            const result = resp[sqltag]
            const rst = Array.isArray(result)?result:[result]

            let errorMessages = rst.filter(el => el.code != 0)
            if(errorMessages)
                errorMessages = []

            if( errorMessages && errorMessages.length > 0 ) {
                ElNotification({
                    title: '',
                    message: 'データ処理にエラーが発生しました。',
                    type: 'error',
                    position: 'top-right',
                })
                return null
            }
            ElNotification({
                title: '',
                message: 'データ処理をしました。',
                type: 'warning',
                position: 'top-right',
            })

            return true

        } catch(error) {
            ElNotification({
                title: 'エラー',
                message: 'エラーが発生しました。',
                type: 'error',
                position: 'top-right',
            })
            return null
        }
        finally {
            loading.close();
        }
    }

    const uniqueId = (prefix) =>dbStore.uniqueId(prefix)

    return {
        params,
        state,
        uniqueId,
        load,
        save,
    }
})
