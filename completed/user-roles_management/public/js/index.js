// 外部index.js　Configファイル内容
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  app_key: "user_ownd_roles",   // mtb_item_categoryテーブルのcategory_codeになります。
  grid: {  // 左に一覧を表示したい場合はこれを追加
    sql_tag: 'users.get_user_list', 
    condition:{},
    buildInitColumns: ({ onRowClicked } = {}) => [
        {
          headerName: '',
          colId: '__select__',
          width: 42,
          pinned: 'left',
          checkboxSelection: true,
          headerCheckboxSelection: 'multiple',
          headerCheckboxSelectionFilteredOnly: true,
          sortable: false,
          filter: false,
          resizable: false,
          suppressHeaderMenuButton: true,
          cellStyle: { textAlign: 'center', padding: '4px' },
          flex:1,
      },
      { field: 'user_id', headerName: 'ユーザーID',
          cellStyle: { textAlign: 'left', padding: '4px',
              color: '#1976d2',          // blue
              textDecoration: 'underline',
              cursor: 'pointer',         // optional (クリック可能っぽく見せる)
          },
          pinned: 'left',
          onCellClicked: onRowClicked || undefined,
          flex:1,
      },

      { field: 'email', headerName: 'メールアドレス',
          cellStyle: { textAlign: 'left', padding: '4px',
              color: '#1976d2',          // blue
              textDecoration: 'underline',
              cursor: 'pointer',         // optional (クリック可能っぽく見せる)
          },
          pinned: 'left',
          onCellClicked: onRowClicked || undefined,
          flex:1,
      },
      { field: 'user_name', headerName: 'ユーザー名' },
      // { field: 'status', headerName: 'ステータス' }
    ],    
  },
  // 各タブのSQLタグを定義
  tab2sqltag_list: { // 機能別の定義
    user_roles: { // mtb_categoryテーブルのsub_category_codeの値になります
      label: 'ユーザーのロール編集',
      data_key: 'userdata',
      jsonb_fields: [],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'user_roles.get_user_roles', save:'user_roles.save_user_roles', delete:'user_roles.delete_user_role', }, // jsonb以外の普通カラム
      separate_items: [ 'role_code','role_name','remarks','enabled','show_order' ],// jsonb以外の普通カラム
    },
  },
};
