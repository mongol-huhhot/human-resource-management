import { defineStore, createPinia, setActivePinia } from "pinia";

setActivePinia(createPinia());

/**
 * 
 */
export const useDBConnectionStore = defineStore('DBConnectionStor', () => {
    // const TRANSATION_URL = '/dataEngine/v1/databaseEngineSms.php'
    const TRANSATION_URL = '/dataEngine/v1/databaseEngine.php'
    const RETURN = 1
    const RESULT_TYPE = 1
    const QUERY_TYPE = 2
    let tid = "jfsg230540"

    ///仮置きとしてここに履歴用のログイン情報を置く
    // const loginUser = 'testUser';
    // const login_nid = '1';

    const COMMON = {
        RETURN: RETURN, 
        RESULT_TYPE: RESULT_TYPE, 
        QUERY_TYPE: QUERY_TYPE,
    }

    /**
     * 
     * @param {*} sqlpath : sql file name
     * @param {*} sqltag : sql tag in over sql file
     * @param {*} params : addtional params
     * @returns 
     */
    const jsonObject = (sqlpath, sqltag, params,tenantid ) => {
        
        COMMON["SQL_PATH"] = sqlpath
        if( tenantid != undefined && tenantid != null &&  tenantid.trim() != '') 
            tid = tenantid

        const param = Object.assign({}, params)
        param['SQL_TAG'] = sqltag;
        // param['login_user'] = loginUser;
        // param['login_nid'] = login_nid;
        let jsonObject = {
            COMMON:COMMON,
        }

        jsonObject[sqltag] = param

        return jsonObject
    }

    const access = async( url, formData ) => {
        return await fetch( url, {
            method: 'POST',
            body: formData
        } )
        .then( function( response ){
            if( response.status != 200 ){
                throw response.status;
            } else {
                return response.json();
            }
        })
    }

    /**
     * 
     * @param {string} sqlpath : sql file name
     * @param {string} sqltag : sql tag in over sql file
     * @param {*} params : addtional params
     * @returns 
     */
    const dbAccess = async (sqlpath, sqltag, params ) => {
        let formData = new FormData();

        const json = jsonObject(sqlpath, sqltag, params)
        console.log("json --- ", json)
        formData.append('json_string', JSON.stringify( json ) )
        
        const url = transactionURL()
   
        console.log("dbAccess ----- URL ===== ", url)
    
        const resp = await access(url, formData);

        return resp;
    }

    /**
     * 
     * @param {*} obj : DBアクセスオブジェ {aaa:{SQL_TAG:"aaa", SQL_PATH:"bbb.sql", LOOP:[{'hoge':'ho'},{'hoge':'ge'}]}}
     *      既存と同じプラスLOOPに入れたのを複数回処理する
     *      
     * @returns 
     */
    const multiDBAccess = async (obj) => {
        const formData = new FormData();

        // obj['RETURN'] = 1;
        // obj['RESULT_TYPE'] = 1;
        // obj['QUERY_TYPE'] = 2;
        // obj['TRANSACTION'] = 1;

        const setObj = {};
        //Object.assign(setObj, COMMON);
        // setObj['TRANSACTION'] = 1;
        setObj.COMMON = COMMON;
        setObj.COMMON['TRANSACTION'] = 1;
        Object.assign(setObj, obj)

        formData.append('json_string', JSON.stringify(setObj));

        const url = transactionURL()
   
        console.log("dbAccess ----- URL ===== ", url)

        const resp = await access(url, formData);
        return resp;
    }

    const transactionURL = () => {
        if( document.location.hostname == '192.168.88.13' ) {
            const path = document.location.pathname
            const paths = path.split('/')
            tid = paths[2];
            tid = 'sms/' + tid
        } else if( document.location.hostname != 'localhost' ) {
            const path = document.location.pathname
            const paths = path.split('/')
            tid = paths[1];
        }
        return `/${tid}${TRANSATION_URL}`
    }

    const uniqueId = (user_id) => {
        if (!user_id || user_id == '') user_id='any'

        const timestamp = new Date().getTime();
        const randomNum = Math.random() * 16;
        const unique = timestamp.toString(16) + randomNum.toString(16);
        return `${user_id}_${unique}`;
    };


    return {
        transactionURL,
        jsonObject,
        dbAccess,
        uniqueId,
        multiDBAccess
    }
})
