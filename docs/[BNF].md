[BNF]
合計所得金額 ::＝ 給与収入 ＋ 雑所得収入
年間給与収入 ::＝ 合計所得金額
給与収入 ::＝ 現職給与収入 ＋ 前職給与収入
雑所得収入  ::＝ 不動産収入 ＋ 個人売買収入（内訳不問）
課税所得 ::＝ 所得金額 － 基礎控除
基礎控除(R8) ::＝ {



}

- 1) applicant_info + spouse_info => 

基礎控除 := 


  if 
     年収 = 6000000 then 650000 
     年収 = 6000000 then 650000 
  end   

- 2) applicant_info + dependents_info => 
- 3) applicant_info + insurance_info => 
- 4) applicant_info + house_loan_info => 


<optgroup label="承認後">
    <option value="1" data-apply="true">扶養親族控除申告書</option>
    <option value="2" data-apply="true">保険控除申告書</option>
    <option value="8" data-apply="true">基礎控除申告書</option>
    <option value="4" data-apply="true">源泉徴収票個人用(必須)</option>
    <option value="5" data-apply="true">源泉徴収票税務署提出用</option>
    <option value="6" data-apply="true">源泉徴収票市町村提出用１</option>
    <option value="7" data-apply="true">源泉徴収票市町村提出用２</option>
</optgroup> 
