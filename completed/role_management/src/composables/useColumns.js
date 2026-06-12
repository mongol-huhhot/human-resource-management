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
        // {
        //     headerName: '',
        //     colId: '__select__',
        //     width: 42,
        //     pinned: 'left',
        //     checkboxSelection: true,
        //     headerCheckboxSelection: 'multiple',
        //     headerCheckboxSelectionFilteredOnly: true,
        //     sortable: false,
        //     filter: false,
        //     resizable: false,
        //     suppressHeaderMenuButton: true,
        //     cellStyle: { textAlign: 'center', padding: '4px' },
        //     flex:1,
        // },
        { field: 'role_code', headerName: 'ロール記号',
            cellStyle: { textAlign: 'left', padding: '4px',
                color: '#1976d2',          // blue
                textDecoration: 'underline',
                cursor: 'pointer',         // optional (クリック可能っぽく見せる)
            },
            pinned: 'left',
            onCellClicked: onRowClicked || undefined,
            flex:1,
        },

        { field: 'role_name', headerName: 'ロール名',
            cellStyle: { textAlign: 'left', padding: '4px',
                color: '#1976d2',          // blue
                textDecoration: 'underline',
                cursor: 'pointer',         // optional (クリック可能っぽく見せる)
            },
            pinned: 'left',
            onCellClicked: onRowClicked || undefined,
            flex:1,
        },
        { field: 'remarks', headerName: '備考' },
        { field: 'enabled', headerName: '有効無効' },
        { field: 'show_order', headerName: '表示順番' },
        // { field: 'status', headerName: 'ステータス' }
    ]
}


// id, user_id, email, password, current_data, draft_data, draft_status, draft_effective_date