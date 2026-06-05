// index.js
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  default_list: 'user',
  // 各タブのSQLタグを定義
  tab2sqltag_list: {
    user: {
      label: 'ユーザー情報',
      data_key: 'userdata',
      jsonb_fields: ['option_data'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'system.get_users', save:'system.save_user_request', delete:'system.delete_user_request', approve:'system.approve_user_request'}, // jsonb以外の普通カラム
      separate_items: [ 'id', 'user_id', 'email', "password", 'draft_status', "draft_effective_date" ],// jsonb以外の普通カラム
    },
    user_roles: { 
      label: 'ユーザーロール',
      data_key: 'user_roles',
      jsonb_fields: [],// jsonb カラムの一覧
      sqltags:{ select:'system.get_user_roles', save:'system.save_user_roles', delete:'system.delete_user_role'}, // jsonb以外の普通カラム
      separate_items: ['user_id','role_code','start_date','end_date','enabled','remarks',],
    },
    role_permissions: {
      label: 'ロール権限',
      data_key: 'role_permissions',
      jsonb_fields: [],// jsonb カラムの一覧
      sqltags:{ select:'system.get_app_role_permissions', save:'system.save_app_role_permissions', delete:'system.delete_app_role_permissions'}, // jsonb以外の普通カラム
      separate_items: ['app_code','role_code','start_date','end_date','enabled','remarks','show_order', 'id', 'process_code','view_rule','action_rule','scope_rule'],
    },
  },
};

