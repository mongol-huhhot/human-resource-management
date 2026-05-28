// index.js
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  // 各タブのSQLタグを定義
  tab2sqltag_list: {
    basic: {
      label: '基本情報',
      data_key: 'staff_profile',
      jsonb_fields: ['profile_jsonb'],
      skip_reload: true,
    },

    traffic: {
      label: '通勤情報',
      data_key: 'staff_traffic',
      jsonb_fields: ['traffic_info'],
    },

    bank: {
      label: '銀行情報',
      data_key: 'staff_bank',
      jsonb_fields: [],
    },

    education: {
      label: '資格情報',
      data_key: 'staff_education',
      jsonb_fields: ['education_info'],
      sqltags:{select:'staffs.get_staff_education', save:'staffs.save_staff_education', delete:'staffs.delete_staff_education'},
    },
  },

  // 上記の”data_key”がキーで、SQLタグと対応するデータキーを定義
  sqltagMap: {
    staff_profile: 'staffs.get_staff_profile', // スタッフプロフィール情報の取得
    staff_traffic: 'masters.get_staff_traffic',// スタッフ通勤情報の取得
    staff_bank: 'masters.get_staff_bank', // スタッフ銀行口座情報の取得
    staff_education: 'staffs.get_staff_education',// スタッフ資格情報の取得
  },
  sqlSavetagMap: {
    staff_profile: 'staffs.get_staff_profile', // スタッフプロフィール情報の取得
    staff_traffic: 'masters.get_staff_traffic',// スタッフ通勤情報の取得
    staff_bank: 'masters.get_staff_bank', // スタッフ銀行口座情報の取得
    staff_education: 'staffs.get_staff_education',// スタッフ資格情報の取得
  },


};

