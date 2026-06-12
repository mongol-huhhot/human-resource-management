// 外部index.js　Configファイル内容
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  app_key: "staff_registration",   // mtb_item_categoryテーブルのcategory_codeになります。
  app_name: "スタッフ情報登録",    // 例えば、アプリにタイトルなどに表示に使用。また、どんなアプリを開発しているか明白にする 
  //grid: {}   // not need in this app
  // 各タブのSQLタグを定義。このアプリは個人が応募するとき登録する情報です。この情報が入社後基本情報として転用されます
  // tab2sqltag_list: { // 機能別の定義
  unit_list: { // 機能別の定義
    staff_profile: { // mtb_categoryテーブルのsub_category_codeの値になります
      item_group_code: 'basic',
      label: 'ロールのアプリへの権限設定',
      // 左一覧に選択するときフォームのタイトルに表示したい項目。（例えば、{"ユーザーID - ユーザー名"}表示したい場合、user_id, user_nameという項目を設定する（実在する項目））
      display_items: ['role_code','role_name', 'process_code', 'process_name'], 
      // data_key: 'roledata',
      jsonb_fields: [profile_jsonb, files],   // jsonb カラムの一覧
      skip_reload: true,  // 現在実装してない
      sqltags:{ select:'permission.get_role_app_permissions', save:'permission.save_app_role_permissions', delete:'permission.delete_app_role_permissions', }, // jsonb以外の普通カラム
      separate_items: [ 'id', 'role_code', 'role_name', 'app_code', 'app_name', 'process_code', 'process_name', 'status_code', 'access_allowed', 'view_includes', 'view_excludes', 'edit_includes','edit_excludes',  'scope_codes', 'enabled', 'show_order' ],// jsonb以外の普通カラム
      condition: {id:null, role_code:null, app_code:null, process_code:null }, // selectのときの条件にrole_codeのみが必要です。こちらに必要なすべて条件項目を定義、デフォルト値も入れる！！！
    },
    employment_history: { // mtb_categoryテーブルのsub_category_codeの値になります
      item_group_code: 'history',
      label: 'ロールのアプリへの権限設定',
      // 左一覧に選択するときフォームのタイトルに表示したい項目。（例えば、{"ユーザーID - ユーザー名"}表示したい場合、user_id, user_nameという項目を設定する（実在する項目））
      display_items: ['role_code','role_name', 'process_code', 'process_name'], 
      jsonb_fields: [profile_jsonb, files],   // jsonb カラムの一覧
      skip_reload: true,  // 現在実装してない
      sqltags:{ select:'permission.get_role_app_permissions', save:'permission.save_app_role_permissions', delete:'permission.delete_app_role_permissions', }, // jsonb以外の普通カラム
      separate_items: [ 'id', 'role_code', 'role_name', 'app_code', 'app_name', 'process_code', 'process_name', 'status_code', 'access_allowed', 'view_includes', 'view_excludes', 'edit_includes','edit_excludes',  'scope_codes', 'enabled', 'show_order' ],// jsonb以外の普通カラム
      condition: {id:null, role_code:null, app_code:null, process_code:null }, // selectのときの条件にrole_codeのみが必要です。こちらに必要なすべて条件項目を定義、デフォルト値も入れる！！！
    },
    staff_certification: { // mtb_categoryテーブルのsub_category_codeの値になります
      item_group_code: 'certification',
      label: 'ロールのアプリへの権限設定',
      // 左一覧に選択するときフォームのタイトルに表示したい項目。（例えば、{"ユーザーID - ユーザー名"}表示したい場合、user_id, user_nameという項目を設定する（実在する項目））
      display_items: ['role_code','role_name', 'process_code', 'process_name'], 
      jsonb_fields: [profile_jsonb, files],   // jsonb カラムの一覧
      skip_reload: true,  // 現在実装してない
      sqltags:{ select:'permission.get_role_app_permissions', save:'permission.save_app_role_permissions', delete:'permission.delete_app_role_permissions', }, // jsonb以外の普通カラム
      separate_items: [ 'id', 'role_code', 'role_name', 'app_code', 'app_name', 'process_code', 'process_name', 'status_code', 'access_allowed', 'view_includes', 'view_excludes', 'edit_includes','edit_excludes',  'scope_codes', 'enabled', 'show_order' ],// jsonb以外の普通カラム
      condition: {id:null, role_code:null, app_code:null, process_code:null }, // selectのときの条件にrole_codeのみが必要です。こちらに必要なすべて条件項目を定義、デフォルト値も入れる！！！
    },
  },
};

