# Token＆Session認証とSQL実行（

## バージョン情報
#### 名称：jass(Janga Security SQLquery)
#### V2.0. 2026/06/01. 陳

# 目的
1. TokenとSession認証
2. SQL Templateを強化

## 特徴
- DB処理トランザクションと効率最大化
- 効率よくするため、下記のように複数行のSQL対応
- Arrayデータを下記になSQLにして効率を最大化する
- 既存モジュールの条件設定([department_code:<%department_code%>!=''])、戻る値構造は既存のと同様
- PG プロセス対応  
- DBアクセス設定をconst.phpあるいはテナントDB両方できるように
- 複数台DBサーバーへ自動切り替え仕組み追加。ロードバランスとDBサーバー障害対応のため、一台DBがコケている場合、自動的に次のDBサーバーへ切り替える機能を備えた
- Token認証を標準機能にしました
- 入り口： /${tenantid}/dataEngine/v5/handleRequest/requestHandler.php   
    既存  /${tenantid}/dataEngine/v5/databaseEngine.phpもサポート

## pinia Store 
```code



```

## １．下記のようなプロセスも対応  

```code
DO $$
  BEGIN
    UPDATE a SET name = 'x';
    INSERT INTO b VALUES (1);
  END
$$;

# 使い方は、
js pinia store 側で普通のSQLを動かすうと同じです

```

## ２．一括複数レコードのUPSERT可能（LOOP）

- つまり、CSV取り込み後のextract upload処理をまとめて一つのトランザクションに行えます！   

- こちらのサンプルは、例えば、保存・削除後最新データを読み込みプロセスを一つのトランザクションとして行えます。  

- これにより、
  - 1) JSコードは簡潔になる。二回DBアクセスするStore関数とプログラム上のコードは不要になります。
  - 2) DBアクセス回数を減らすため、トラフィックは減る。サーバー負荷が低減できる。  
       既存のそれぞれsqltagを作り（省ける）DB処理する方法は結局DBに回数分アクセスして処理しているのにたいして、複数のデータ処理は一回のDBアクセスで済ませる（⇒ 処理が軽い、速い、１回のみアクセス）


```Insert
1. このように書く

'shift_update' => <<<SQL
    begin; /** トランザクション開始 */

    /** 繰り返しデータをまとめて保存 */
    INSERT INTO attendance_record.generic_shift_data (
        staff_code, start_date, end_date, action_type,
        shift_pattern, content, created_by, created_at, updated_by, updated_at
    )
    VALUES
    [LOOP:]
    (<%staff_code%>, <%start_date%>, <%end_date%>, <%action_type%>,
    <%shift_pattern%>, <%content%>, <%__LOGIN_USER%>, now(), 'NULL', now())
    [/LOOP]
    ON CONFLICT (staff_code, start_date, end_date, action_type)
    DO UPDATE SET
        shift_pattern = EXCLUDED.shift_pattern,
        content = EXCLUDED.content,
        updated_by = EXCLUDED.created_by,
        updated_at = now();
    
    /** 最後の計算など処理 */
    select attendance_accumulation(
        <%target_staff_code%>,
        <%target_start_date%>,
        <%target_end_date%>
    );

    commit; /** コミットしトランザクション終了 */
SQL,

# 送信パラメータ例：
{
  shift_update: {
    SQL_TAG: 'shift_update',
    target_staff_code: '11111',
    target_start_date: '2026-06-01',
    target_end_date: '2026-06-30',
    LOOP: [
      {
        staff_code: '11111',
        start_date: '2026-06-01',
        end_date: '2026-06-01',
        action_type: 'working',
        shift_pattern: {...},
        content: {...}
      },
      ...
    ]
  }
};

# サンプルstore code

async function handleSaveRetro() {
  const iv = retroactiveEdited.value.months.map(el => {
    el.D_J9107 = calcDeltaJ9107(el)
    return {input_values: el, yearmonth: el.salaryDate }
  })
  // 
  iv=[
    {}, // 単一処理データ
    {},
    ...
  ]
  console.log("ivivivivi====",iv) 
  const p = {
    staff_code: selectedRow.value.staff_code, 
    LOOP: iv // これが大事
  }
  await dataStore.save_three_month_retroactive_data(p)

  await loadHolenToukyu()

  // スタッフ一覧を更新させる watch(salaryData.states.forceFresh)
  dataStore.states.forceFresh = '' + Math.random()
}


```

## ３．一つのタグに重複のSQL可能 

```sql

"multisql" => <<< SQL
    begin;
    insert into youtable (a,b) values
    (<%a%>,<%b%>)
    ;

    select * from youtable;

    commit;
    # store 側のコーディング方法は１つSQLのと同じ
SQL,

```

## ４．複数タグを一括動かす  

```sql
"firstsql" => <<<SQL
    select * from m_users
SQL,

"secondsql" => <<<SQL
    select * from t_user_roles where user_id=<%user_id%>
SQL,

"thirdsql" => <<<SQL
    select * from m_app_role_permissions 
    where app_code = <%app_code%>
    and role_code=<%role_code%>
SQL,

# 複数storeのコード
const multiQueryResult = await dataStore.dbAccessWithMultiTags({
    firstsql: {
        SQLTAG: 'firstsql',
    },
    secondsql: {
        SQLTAG: 'secondsql',
        user_id: '12212',
    },
    thirdsql: {
        SQLTAG: 'secondsql',
        app: 'staff_manager',
        user_id: '12212',
    }
})

# multiQueryResultの値構造
{
    firstsql:{code:0,..result:[]}, // 上記の
    secondsql:{code:0,..result:[]},
    thirdsql:{code:0,..result:[]},
}

・エラーがある場合、codeはエラーコードになる
・result:[]は１つSQLの結果

```


## 複数レコード一括保存サンプルデータ構造

```json

'csv_upload' => <<<SQL
sample data:

{
  "COMMON": {
    "SQL_PATH": "janga_vue_base_system/generic-folder/genericMasterSqlTemplate.sql",
    "QUERY_TYPE": 2,
    "__LOGIN_USER": "admin@example.com"
  },
  "save_shift_batch": {
    "SQL_TAG": "csv_upload",
    "LOOP": [
        {
            "staff_code": "1122",
            "start_date": "2025-07-21",
            "end_date": "2025-07-23",
            "action_type": "company_holiday",
            "notes": "定例会社年間休日",
            "shift_pattern": "daily",
            "content": {
                "shift_blocks": {
                    "start_time": "00:00",
                    "end_time": "23:59",
                    "relative_end_day": 0,
                    "location": ""
                },
                "recurrence_rule": {
                    "frequency": "daily"
                }
            }
        },
        {
            "staff_code": "1122",
            "start_date": "2025-01-01",
            "end_date": "2025-01-05",
            "action_type": "new_year_holiday",
            "notes": "定例新年休日",
            "shift_pattern": "daily",
            "content": {
                "shift_blocks": {
                    "start_time": "00:00",
                    "end_time": "23:59",
                    "relative_end_day": 0,
                    "location": ""
                },
                "recurrence_rule": {
                    "frequency": "daily"
                }
            }
        },
        {
            "staff_code": "1122",
            "start_date": "2025-05-01",
            "end_date": "2025-05-04",
            "action_type": "gw_holiday",
            "notes": "定例GW休日",
            "shift_pattern": "daily",
            "content": {
                "shift_blocks": {
                    "start_time": "00:00",
                    "end_time": "23:59",
                    "relative_end_day": 0,
                    "location": ""
                },
                "recurrence_rule": {
                    "frequency": "daily"
                }
            }
        }
    ]
  }
};


it will be converted to:

INSERT INTO attendance_record.generic_shift_data (staff_code, start_date, end_date, action_type, shift_pattern, content, created_by, created_at, updated_by, updated_at)
  VALUES 
  ('1122', '2025-07-21', '2025-07-23', 'company_holiday',     'daily', replace(replace(replace('{"shift_blocks":[],"recurrence_rule":{"frequency":"daily"}}', '&quot', '"'), '\u', '\\u'), '\\', '')::jsonb, NULL, now(), 'NULL', now()),
  ('1122', '2026-01-01', '2026-01-05', 'new_year_holiday',     'daily', replace(replace(replace('{"shift_blocks":[],"recurrence_rule":{"frequency":"daily"}}', '&quot', '"'), '\u', '\\u'), '\\', '')::jsonb, NULL, now(), 'NULL', now()),
  ('1122', '2026-05-01', '2026-01-04', 'gw_holiday',     'daily', replace(replace(replace('{"shift_blocks":[],"recurrence_rule":{"frequency":"daily"}}', '&quot', '"'), '\u', '\\u'), '\\', '')::jsonb, NULL, now(), 'NULL', now())
  ON CONFLICT (staff_code, start_date, end_date, action_type)     
  DO UPDATE SET 
    shift_pattern = EXCLUDED.shift_pattern,
    content = EXCLUDED.content,
    updated_by = EXCLUDED.created_by,
    updated_at = now();


このようなSQLを作成して動かす
INSERT INTO shared.users (userid, password, additional)
VALUES
('chen1', 'chen1', '{"e_mail": "mongol.huhhotn@gmail.com", "department_code": "1234"}'),
('chen2', 'chen2', '{"e_mail": "chen@example.com", "department_code": "5678"}'),
('chen3', 'chen3', '{"e_mail": "chen3@example.com", "department_code": "91011"}'),
('chen4', 'chen4', '{"e_mail": "chen4@example.com", "department_code": "1213"}');
```

```Upsert
２．このように書
INSERT INTO shared.m_users (userid, "password", additional)
VALUES
    [LOOP:]
    (
        '<%userid%>',
        '<%password%>',
        '<%additional%>'::jsonb
    )
    [/LOOP]
ON CONFLICT (userid)
DO UPDATE 
SET "password" = EXCLUDED."password",
    additional = EXCLUDED.additional;
=>
このようなSQLを作成して動かす
INSERT INTO shared.m_users (userid, "password", additional)
VALUES
    ('chen1', 'chen133', '{"e_mail": "mongol.huhhotn@gmail.com", "department_code": "1234"}'),
    ('chen2', 'chen234', '{"e_mail": "chen2@example.com", "department_code": "5678"}'),
    ('chen3', 'chen345', '{"e_mail": "chen3@example.com", "department_code": "91011"}'),
    ('chen4', 'chen456', '{"e_mail": "chen4@example.com", "department_code": "1213"}')
ON CONFLICT (userid)
DO UPDATE 
SET "password" = EXCLUDED."password",
    additional = EXCLUDED.additional;
```
```Update
３．このように書
UPDATE shared.m_users
SET 
    "password" = updates."password",
    additional = updates.additional
FROM (
    VALUES
    [LOOP:]
    (
        '<%userid%>',
        '<%password%>',
        '<%additional%>'::jsonb
    )
    [/LOOP]
) AS updates(userid, "password", additional)
WHERE shared.m_users.userid = updates.userid;
=>
このようなSQLを作成して動かす
UPDATE shared.m_users
SET
    "password" = updates."password",
    additional = updates.additional
FROM (
    VALUES
        ('chen1', 'chen133', '{"e_mail": "mongol.huhhotn@gmail.com", "department_code": "1234"}'),
        ('chen2', 'chen234', '{"e_mail": "chen2@example.com", "department_code": "5678"}'),
        ('chen3', 'chen345', '{"e_mail": "chen3@example.com", "department_code": "91011"}'),
        ('chen4', 'chen456', '{"e_mail": "chen4@example.com", "department_code": "1213"}')
) AS updates(userid, "password", additional)
WHERE shared.m_users.userid = updates.userid;
```

# ファイル一覧
## サーバー側ファイル
#### 場所: /var/www/html/sms/database/v1/handleRequest/
現在devサーバー上に配置している
| file name | comments |
|----------------------|---------------------------------------------------------------------|
| auth.php  | Token認証関連|
| config.php  |DB接続情報など保存するファイル|
| login.php  |ログインプログラム。既存アクセスパラメターjson_stringを用いる。「login」タグにログインSQLパラメターを設定する|
| requestHandler.php  |通常DB関連エンジン。既存databaseEngine.phpと同様|
| sqlRequestHandler.php  |SQL TemplateをParseするプログラム|
| vendor/  |Token用firebase　Lib|
| composer.json  |composer用設定|
| composer.lock  |composer用|

## クライアント側ファイル(.vue)
github=>sou-edu->authAndSqlTemplate(ログイン機能とshift-managementの再現)

### DBアクセス方法
既存と同じ。Teken/SessionなどはDBConnectionStore.jsに書き込みしているため、使用上意識しなくていい


# 文法

## 通常SQL文法

通常SQL文法:={key=>value}のarray
key:=自分が識別できる文字列
key:=変数含むSQL文
変数含むSQL文:=SQL文に必要な変数TAGを組んだ文字列
変数TAG:=<%%>に囲まれた文字列。例、<%staff_id%>。変数TAGはRequestパラメタなどに含む変数の値で交換される


## フィルターSQL文法

フィルターSQL:=条件TAGで囲んだSQLの文字列
条件TAG:=[tag_name:判断条件]SQLの文字列[/tag_name]
判断条件:=有効なPHP条件式（Postgresqlの条件式ではない！）
例、
[position_id:<%staff_type_search%> != '']
and F.position_id = <%staff_type_search%>
[/position_id]

##　通常SQL定義

SQL文定義ファイル:={テンプレートPHPファイルの中の$configArrayに定義する連想Array}

例：
"login","getMessageList","getAMessage"など連想Array項目は例です。
注：<%staff_id%>は ''で囲まれてないことに
```config file
$configArray=array(
"login" => <<<SQL
    select A.USER_ID, G.url default_display, A.USER_TYPE, TO_CHAR(D.login_date, 'MM月DD日 HH24:MI') login_date, B.STAFF_ID, C.STAFF_NAME, E.job_name,
        case when (A.PASSWORD1 = F.default_password) or (D.user_id is null)  then '1' else '0' end default_password_flag, C.department_id
    from MTB_LOGIN_USER A left join
        (select user_id, max(login_date) login_date from login_history group by user_id ) D on A.USER_ID = D.user_id ,
        MTB_LOGIN_STAFF B, MTB_STAFF C, mtb_job_type E, mtb_own_company F, mtb_tree G, mtb_tree H
    where
            A.USER_ID = <%staff_id%>
    and A.PASSWORD1 = <%password%>
    and A.USER_FLAG1 = '1'
    and A.USER_FLAG2 = '0'
    and C.staff_flag3 = '0'
    and A.LOCK_FLG = '0'
    and A.USER_ID = B.USER_ID
    and B.STAFF_ID = C.STAFF_ID
    and A.USER_TYPE = E.job_id
    and F.company_code = '1234567890'
    and G.id = A.default_display
    and H.id = '902'
SQL,
"getMessageList" => <<<SQL
    SELECT id, title, mtype, startdate, enddate, messagebody, murl, mowner, enabled 
    FROM public.tb_messages
    where mtype=<%mtype%>
    <%sample_staff_filter%>
SQL,
"getAMessage" => <<<SQL
    SELECT id, title, mtype, startdate, enddate, messagebody, murl, mowner, enabled FROM public.tb_messages
    <%sample_staff_filter%>
    where id=<%id%>
SQL
);
```
-------------------------------------------------------------------------
```
## フィルター用SQLの例
```sql
$configArray=array(
"staff_filter" => <<<SQL
    [position_id:<%staff_type_search%> != '']
	and F.position_id = <%staff_type_search%>
    [/position_id]
    [staff_flag1:<%staff_flag1%> != '']
    and (<%staff_flag1%> = '' or staff_flag1 = <%staff_flag1%>)
    [/staff_flag1]
SQL,
"staff_filter_long" => <<<SQL
    [position_id:<%staff_type_search%> != '']
	and F.position_id = <%staff_type_search%>
    [/position_id]
    [staff_flag1:<%staff_flag1%> != '']
    and (<%staff_flag1%> = '' or staff_flag1 = <%staff_flag1%>)
    [/staff_flag1]
    [staff_flag1:'<%staff_flag1%>' != '']
    and ('<%staff_flag4%>' = '' or A.staff_flag4 = '<%staff_flag4%>')
    [/staff_flag1]
    [staff_flag4:'<%staff_flag4%>' != '']
    and ('<%is_pharmacist%>' = '' or coalesce_space(A.pharmacist_flag, '0') = '<%is_pharmacist%>')
    [/staff_flag4:]
    [is_salesperson:'<%is_salesperson%>' != '']
    and ('<%is_salesperson%>' = '' or 
        ('<%is_salesperson%>' = '0' and coalesce_space(A.registered_salesperson_flag, '0') IN ('0', '3')) or
        ('<%is_salesperson%>' in ('1', '2') and A.registered_salesperson_flag = '<%is_salesperson%>') or 
        ('<%is_salesperson%>' = '9' and A.registered_salesperson_flag IN ('1', '2')))
    [/is_salesperson]
    [is_nutritionist:'<%is_nutritionist%>' != '']
    and ('<%is_nutritionist%>' = '' or coalesce_space(A.nutritionist_flag, '0') = '<%is_nutritionist%>')
    [/is_nutritionist]
    [route_type:'<%route_type%>' != '']
    and ('<%route_type%>' = '' or A.route_type = '<%route_type%>')
    [/route_type]
    and ('<%induction_date%>' = '' or char_to_date('<%induction_date%>') <= coalesce(A.induction_date, to_date('1900/01/01','YYYY/MM/DD')))
    and ('<%induction_date_end%>' = '' or char_to_date('<%induction_date_end%>') >= coalesce(A.induction_date, to_date('1900/01/01','YYYY/MM/DD')))
    and ('<%resignation_date%>' = '' or char_to_date('<%resignation_date%>') <= coalesce(A.resignation_date, to_date('2100/01/01','YYYY/MM/DD')) )
    and ('<%resignation_date_end%>' = '' or char_to_date('<%resignation_date_end%>') >= coalesce(A.resignation_date, to_date('2100/01/01','YYYY/MM/DD')))
    and (case when '<%induction_date%>' = '' and '<%induction_date_end%>' = '' then 
        (case when A.induction_date is not null then A.induction_date <= to_date('<%start_date%>','YYYY/MM/DD')
            else coalesce(A.induction_date, to_date('1900/01/01','YYYY/MM/DD')) <= to_date('<%start_date%>','YYYY/MM/DD') end)  else 1 = 1 end)
    and (case when '<%resignation_date%>' = '' and '<%resignation_date_end%>' = '' then 
        (case when A.resignation_date is not null and A.resignation_date = to_date('<%start_date%>','YYYY/MM/DD')- '1 day'::interval then A.resignation_date+'1 day'::interval between  to_date('<%start_date%>','YYYY/MM/DD') and to_date('<%end_date%>','YYYY/MM/DD')
            else coalesce(A.resignation_date, to_date('2100/12/31','YYYY/MM/DD')) >= to_date('<%start_date%>','YYYY/MM/DD') end)  else 1 = 1 end)
SQL
);
```

## ログイン認証

``` mermaid
flowchart TD
    login[ログイン画面] --> main[機能画面]

```
