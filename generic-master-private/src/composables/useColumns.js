const f_color = (params) => {
    if (params.data?.is_monthly_changed && params.data.approved_status) {
        return {
            backgroundColor: '#22a710',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center'
        }
    }
    if (params.data?.is_monthly_changed) {
        return {
            backgroundColor: '#409EFF',
            color: 'white',
            fontWeight: 'bold',
            textAlign: 'center'
        }
    }
    if (params.data?.is_monthly_change_candidate) {
        return {
            backgroundColor: '#ffd966',
            color: '#333',
            fontWeight: 'bold',
            textAlign: 'center'
        }
    }
    return { textAlign: 'center',  }
}

/**
 * Build "init" columns on-demand.
 * - can safely include functions (onCellClicked) because this result is NOT stored in pinia state.
 */
export function buildInitColumns(onRowClicked) {
    return [
        // { field : 'staff_id', headerName: '', },
        { field : 'staff_code', headerName: '社員番号',
            cellStyle: { textAlign: 'center', padding: '4px',
                color: '#1976d2',          // blue
                textDecoration: 'underline',
                cursor: 'pointer',         // optional (クリック可能っぽく見せる)
            },
            pinned: 'left',
            onCellClicked: onRowClicked || undefined,
            flex:1,
        },
        { field : 'staff_name', headerName: '氏名（漢字）', 
            cellStyle: { textAlign: 'center', padding: '4px',
                color: '#1976d2',          // blue
                textDecoration: 'underline',
                cursor: 'pointer',         // optional (クリック可能っぽく見せる)
            },
            pinned: 'left',
            onCellClicked: onRowClicked || undefined,
            flex:1,
        },
        { field : 'kana_name', headerName: '氏名（カナ）', },
        { field : 'is_activity', headerName: '有効状態', },
        { field : 'koseki_given_name', headerName: '戸籍（名）', },
        { field : 'remarks', headerName: '備考欄', },
        { field : 'student_type', headerName: '学生区分', },
        { field : 'town', headerName: '町域', },
        { field : 'mobile_phone', headerName: '携帯電話', },
        { field : 'phone_number', headerName: '電話番号', },
        { field : 'prefecture', headerName: '都道府県', },
        { field : 'koseki_family_name', headerName: '戸籍（姓）', },
        { field : 'mynumber', headerName: 'マイナンバー', },
        { field : 'postal_code', headerName: '郵便番号', },
        { field : 'koseki_family_name_kana', headerName: '戸籍フリガナ（姓）', },
        { field : 'koseki_given_name_kana', headerName: '戸籍フリガナ（名）', },
        { field : 'method_transport', headerName: '通勤手段', },
        { field : 'reference_number', headerName: '参照番号', },
        { field : 'residence_address1', headerName: '住民票住所1', },
        { field : 'residence_address1_kana', headerName: '住民票住所1（カナ）', },
        { field : 'resignation_date_actual', headerName: '退職日（資格喪失日）', },
        { field : 'resignation_date', headerName: '退職日', },
        { field : 'address_line1', headerName: '番地', },
        { field : 'address_line2', headerName: '建物名・部屋番号', },
        { field : 'birthday', headerName: '生年月日', },
        { field : 'city', headerName: '市区町村', },
        { field : 'residence_address2', headerName: '住民票住所2', },
        { field : 'residence_address2_kana', headerName: '住民票住所2（カナ）', },
        { field : 'residence_expire', headerName: '在留期限', },
        { field : 'residence_post_code1', headerName: '住民票 郵便番号（前3桁）', },
        { field : 'residence_post_code2', headerName: '住民票 郵便番号（後4桁）', },
        { field : 'resignation_remark', headerName: '退職備考', },
        { field : 'company_id', headerName: '会社ID', },
        { field : 'country', headerName: '国', },
        { field : 'current_address1', headerName: '現住所1', },
        { field : 'current_address2', headerName: '現住所2', },
        { field : 'department_id', headerName: '部署ID', },
        { field : 'email', headerName: 'メールアドレス', },
        { field : 'emergency_address1', headerName: '緊急連絡先住所1', },
        { field : 'emergency_address2', headerName: '緊急連絡先住所2', },
        { field : 'emergency_contact_name', headerName: '緊急連絡先氏名', },
        { field : 'emergency_contact_phone', headerName: '緊急連絡先電話番号', },
        { field : 'emergency_contact_relationship', headerName: '続柄', },
        { field : 'employee_number', headerName: '従業員番号', },
        { field : 'disabled_info', headerName: '障がい区分', },
        { field : 'enrollment_class', headerName: '在籍区分', },
        { field : 'foreigner', headerName: '国籍区分', },
        { field : 'hire_date', headerName: '入社日（資格取得日）', },
        { field : 'induction_date', headerName: '入社日', },
        { field : 'insurance_qualification_code', headerName: '保険資格コード', },
        { field : 'resignation_category', headerName: '退職事由カテゴリ', },
        { field : 'employee_category', headerName: '雇用形態カテゴリ', },
        { field : 'gender', headerName: '性別', },
    ]

    // [
    // // {
    // //     headerName: '',
    // //     colId: '__select__',
    // //     width: 42,
    // //     pinned: 'left',
    // //     checkboxSelection: true,
    // //     headerCheckboxSelection: 'multiple',
    // //     headerCheckboxSelectionFilteredOnly: true,
    // //     sortable: false,
    // //     filter: false,
    // //     resizable: false,
    // //     suppressHeaderMenuButton: true,
    // //     cellStyle: { textAlign: 'center', padding: '4px' },
    // //     flex:1,
    // // },

    // ]
}
