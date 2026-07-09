// index.js
window.appConfig = window.appConfig || {};
window.appConfig.MAIN_CONFIG = {
  debug_mode: true,
  // 各タブのSQLタグを定義
  tab2sqltag_list: {
    basic: {
      label: '基本情報',
      data_key: 'staff_profile',
      jsonb_fields: ['profile_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'get_current_staff_info', save:'staffs.upsert_staff_profile', delete:'staffs.delete_staff_profile' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    address: {
      label: '基本情報',
      data_key: 'staff_profile',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'get_staff_address_info', save:'staffs.upsert_staff_profile', delete:'staffs.delete_staff_profile' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    contact: {
      label: '基本情報',
      data_key: 'staff_profile',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      skip_reload: true,
      sqltags:{ select:'get_staff_contact_info', save:'staffs.upsert_staff_profile', delete:'staffs.delete_staff_profile' },
      separate_items: ['staff_code', 'profile_version'],// jsonb以外の普通カラム
    },
    bank: {
      label: '銀行情報',
      data_key: 'staff_bank',
      jsonb_fields: ['data_jsonb'],// jsonb カラムの一覧
      sqltags:{ select:'get_staff_bank_info', save:'masters.upsert_staff_bank', delete:'masters.delete_staff_bank'}, // jsonb以外の普通カラム
      separate_items: ['bank_code','bank_name','branch_code','branch_name','bank_account_type','bank_account','bank_account_kana','bank_account_kanji','is_primary','enabled','remarks',],
    },


    traffic: {
      label: '通勤情報',
      data_key: 'staff_traffic',
      jsonb_fields: ['traffic_info'],
      sqltags:{ select:'staffs.get_staff_traffic', save:'staffs.upsert_staff_traffic', delete:'staffs.delete_staff_traffic' },
    },


    education: {
      label: '教育情報',
      data_key: 'staff_education',
      jsonb_fields: ['education_info'],
      sqltags:{ select:'masters.get_staff_education', save:'masters.upsert_staff_education', delete:'masters.delete_staff_education' },
    },


    certification: {
      label: '資格情報',
      data_key: 'staff_certification',
      jsonb_fields: ['certification_info'],
      sqltags:{ select:'masters.get_staff_certification', save:'masters.upsert_staff_certification', delete:'masters.delete_staff_certification' },
    },
  },
};

window.appConfig.UploadFiles = {
    // default config for staff. these items will be gotten from login information
    editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
    height: 200,    // number of Pixels
    width:  200,    // number of Pixels
    returnType: 'base64', // 'base64' or 'blob'
    direction: 'row', // 'row' or 'column'
    student_card: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        files : [// you can define many files to be uloaded
            { field: 'front', headerName: '学生証表'},
            { field: 'back', headerName: '学生証裏'},
            { field: 'diploma', headerName: '卒業書'},
            { field: 'academic_transcript', headerName: '成績書'},
        ],
    },
    mynumber_card: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        swapSizeInLandscape: true,
        compressRatio: 1,    // 0.1 ~ 1
        jpegQuality:   0.9,  // 0.1 ~ 1
        outputFormat:  'image/jpeg',
        maxWidth:      0,    // 0 = ignore
        maxHeight:     0,    // 0 = ignore
        files :[ // you can define many files to be uloaded
            { field: 'front', headerName: 'マイナンバーカード表'},
            { field: 'back', headerName: 'マイナンバーカード裏'},
        ]
    },
    bank_book: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        swapSizeInLandscape: true,
        compressRatio: 1,    // 0.1 ~ 1
        jpegQuality:   0.9,  // 0.1 ~ 1
        outputFormat:  'image/jpeg',
        maxWidth:      0,    // 0 = ignore
        maxHeight:     0,    // 0 = ignore
        files :[ // you can define many files to be uloaded
            { field: 'cover', headerName: '通帳表紙'},
            { field: 'front', headerName: '通帳見開き'},
        ]
    },
    bank_card: {
        editable: true, // if editable: false then the own has viewable permission only. if editable:  true then has editing permission
        height: 360,    // number of Pixels
        width:  360,    // number of Pixels
        returnType: 'blob', // 'base64' or 'blob'
        direction: 'row', // 'row' or 'column'
        swapSizeInLandscape: true,
        compressRatio: 1,    // 0.1 ~ 1
        jpegQuality:   0.9,  // 0.1 ~ 1
        outputFormat:  'image/jpeg',
        maxWidth:      0,    // 0 = ignore
        maxHeight:     0,    // 0 = ignore
        files :[ // you can define many files to be uloaded
            { field: 'front', headerName: '銀行カード'},
        ]
    },
};
