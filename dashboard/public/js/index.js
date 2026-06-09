window.appConfig = window.appConfig || {};
window.appConfig.DASHBOARD_CONFIG = {
    staff_code: '11018',
    debug_mode: true,
    todos: [
        { type: '雇用契約管理', text: 'ホーム画面追加のお知らせ', color: 'red', sql_tag: 'employment_contract', condition: {'is_approaching_expiration': true}, url: '/employment-contracts' },
        { type: '休暇承認', text: 'ホーム画面追加のお知らせ', color: 'red', sql_tag: 'leave_approval', condition: {'is_pending': true}, url: '/leave-approvals' },
        { type: '残業・早出承認', text: 'ホーム画面追加のお知らせ', color: 'red', sql_tag: 'overtime_approval', condition: {'is_pending': true}, url: '/overtime-approvals' },
        { type: '振休承認', text: 'ホーム画面追加のお知らせ', color: 'red', sql_tag: 'compensatory_leave_approval', condition: {'is_pending': true}, url: '/compensatory-leave-approvals' },
    //     // { type: 'リアルタイム打刻情報', text: 'ホーム画面追加のお知らせ', color: 'indigo', sql_tag: 'real_time_clocking', condition: {'has_updates': true}, url: '/real-time-clocking' },
    //     // { type: 'シフト管理', text: 'ホーム画面追加のお知らせ', color: 'blue', sql_tag: 'shift_management', condition: {'has_conflicts': true}, url: '/shift-management' },
    ],
    // notices: {
    //     sql_tag: 'notices',
    //     condition: {'is_active': true},
    // },
    notices: [
        '算定基礎や保険関連書類の作成も可能となりました！詳しくはお問合せください！',
        'リリース情報',
        '算定基礎や保険関連書類の作成も可能となりました！詳しくはお問合せください！',
        '算定基礎や保険関連書類の作成も可能となりました！詳しくはお問合せください！',
        '算定基礎や保険関連書類の作成も可能となりました！詳しくはお問合せください！',
    ],
    menus: [
        { title: '給与明細', icon: 'mdi-database', url: '/pay-stubs' },
        { title: '雇用保険', icon: 'mdi-account-card', url: '/employment-insurance' },
        { title: '資料アップロード', icon: 'mdi-file-upload', url: '/document-upload' },
        { title: '勤怠時間計算', icon: 'mdi-swap-horizontal', url: '/attendance-calculation' },
        { title: '給与明細', icon: 'mdi-database', url: '/pay-stubs' },
        { title: '雇用保険', icon: 'mdi-account-card', url: '/employment-insurance' },
        { title: '勤怠時間計算', icon: 'mdi-swap-horizontal', url: '/attendance-calculation' },
        { title: '給与明細', icon: 'mdi-database', url: '/pay-stubs' },
        { title: '雇用保険', icon: 'mdi-account-card', url: '/employment-insurance' },
    ],
}
