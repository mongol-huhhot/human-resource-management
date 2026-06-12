// 外部index.js　Configファイル内容
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  app_key: "role_master_management",   // mtb_item_categoryテーブルのcategory_codeになります。
  app_name: "ロールマスタ管理",        // 例えば、アプリにタイトルなどに表示に使用。また、どんなアプリを開発しているか明白にする 
  grid: {  // 左に一覧を表示したい場合はこれを追加。個人用個人情報登録にこれがないです
    sql_tag: 'roles.get_role_list', 
    condition:{ enabled: 'active' }, // こちらに必要なすべて条件項目を定義、デフォルト値も入れる！！！
    // ✅ columns を関数化
    buildInitColumns: ({ onRowClicked } = {}) => [
      {
        field: 'role_code',
        headerName: 'ロール記号',
        pinned: 'left',
        flex: 1,
        onCellClicked: onRowClicked,
        cellStyle: {
          textAlign: 'left',
          padding: '4px',
          color: '#1976d2',
          textDecoration: 'underline',
          cursor: 'pointer',
        },
      },
      {
        field: 'role_name',
        headerName: 'ロール名',
        pinned: 'left',
        flex: 1,
        onCellClicked: onRowClicked,
        cellStyle: {
          textAlign: 'left',
          padding: '4px',
          color: '#1976d2',
          textDecoration: 'underline',
          cursor: 'pointer',
        },
      },
      { field: 'remarks', headerName: '備考' },
      { field: 'enabled', headerName: '有効無効' },
      { field: 'show_order', headerName: '表示順番' },
    ],
  },
  // 各タブのSQLタグを定義
  tab2sqltag_list: { // 機能別の定義
    role_master: { // mtb_categoryテーブルのsub_category_codeの値になります
      label: 'ロール編集',
      // 左一覧に選択するときフォームのタイトルに表示したい項目。（例えば、{"ユーザーID - ユーザー名"}表示したい場合、user_id, user_nameという項目を設定する（実在する項目））
      display_items: ['role_code','role_name'], 
      data_key: 'roledata',
      jsonb_fields: [],   // jsonb カラムの一覧
      skip_reload: true,  // 現在実装してない
      sqltags:{ select:'roles.get_role_list', save:'roles.save_roles', delete:'roles.delete_roles', }, // jsonb以外の普通カラム
      separate_items: [ 'role_code','role_name','remarks','enabled','show_order' ],// jsonb以外の普通カラム
      condition: { role_code:null }, // selectのときの条件にrole_codeのみが必要です。こちらに必要なすべて条件項目を定義、デフォルト値も入れる！！！
    },
  },
};

