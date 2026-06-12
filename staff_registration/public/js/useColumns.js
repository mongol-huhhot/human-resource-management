const clickableStyle = {
  textAlign: 'left',
  padding: '4px',
  color: '#1976d2',
  textDecoration: 'underline',
  cursor: 'pointer',
}

export function buildPermissionColumns({ onRowClicked } = {}) {
  return [
    {
      field: 'role_code',
      headerName: 'ロール記号',
      pinned: 'left',
      flex: 1,
      onCellClicked: onRowClicked,
      cellStyle: clickableStyle,
    },
    {
      field: 'role_name',
      headerName: 'ロール名',
      pinned: 'left',
      flex: 1,
      onCellClicked: onRowClicked,
      cellStyle: clickableStyle,
    },
    { field: 'app_code', headerName: 'アプリ記号' },
    { field: 'app_name', headerName: 'アプリ名' },
    { field: 'process_code', headerName: '機能記号' },
    { field: 'process_name', headerName: '機能名' },
    { field: 'status_code', headerName: 'ステータスコード' },
    { field: 'access_allowed', headerName: 'アクセス許可' },
    { field: 'view_includes', headerName: '項目ビュー可' },
    { field: 'view_excludes', headerName: '項目ビュー不可' },
    { field: 'edit_includes', headerName: '項目編集可' },
    { field: 'edit_excludes', headerName: '項目編集不可' },
    { field: 'scope_codes', headerName: 'データスコープ' },
    { field: 'enabled', headerName: '有効無効' },
    { field: 'show_order', headerName: '表示順番' },
  ]
}
