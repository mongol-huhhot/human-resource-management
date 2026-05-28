// 手軽く使える関数
// import {toNumber, formatYen, } from 'UseUtils'
/**
 * String を数値の変換
 */
export const toNumber = (value) => {
  if (value === null || value === undefined || value === '') return 0
  const n = Number(String(value).replace(/,/g, ''))
  return Number.isNaN(n) ? 0 : n
}

/**
 * 値を円形式にする
 */
export const formatYen = (value) => {
  return `¥ ${toNumber(value).toLocaleString()}`
}


export function formatInteger(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)

  if (Number.isNaN(num)) return value
  return num.toString()
}

// item_labelがMの時のみ3桁区切りカンマで表示だけ行う。2026-03-02 佐藤追加。
export function formatMoney(value) {
  if (value === null || value === undefined || value === '') return ''
  const num = Number(value)

  if (!Number.isNaN(num)) {
    return `￥ ${num.toLocaleString('ja-JP')}`
  }
  return `￥ ${value}`
}

export function toTime(value) {
  console.log('value', value)
  if (value === null) return '';
  if (value === undefined) return '';
  if (value === '') return '';
  if (value === 0) return '00:00';

  let time = value;
  const hours = Math.floor(time / 60);
  const minutes = time % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
