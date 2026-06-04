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
        { field: 'auth_type', headerName: '認証方式' },
        { field: 'user_name', headerName: 'ユーザー表示名' },
        { field: 'status', headerName: 'ステータス' },
        { field: 'email_verified', headerName: 'メール確認' },
        { field: 'valid_from', headerName: '有効期限開始' },
        { field: 'valid_to', headerName: '有効期限終了' },
        { field: 'request_type', headerName: 'リクエストタイプ' },
        { field: 'request_status', headerName: 'リクエストステータス' },
        { field: 'remarks', headerName: '備考' },
    ]
}


// id, user_id, email, password, current_data, draft_data, draft_status, draft_effective_date