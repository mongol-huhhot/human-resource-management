<script setup>
import { computed, ref } from 'vue';
// import { ElInput } from 'element-plus';
/**
 * to input Japan EN currency
 * by chen, 2023/02/09
 * 
 * usage:
 * import MyCurrency from './MyCurrency.vue'
 * 
 * <MyCurrency v-model="yourcurrencyValue"></MyCurrency>
//  */
const props = defineProps({
    modelValue: {
        type: [String, Number],
    },
    disabled:{
        type:Boolean,
        default:false
    },
    min: {
        type: [String, Number],
    },
    max: {
        type: [String, Number],
    }
})

const emit = defineEmits(['update:modelValue','blur','input'])

const imeState = ref(false)
const message = ref('')
// convert to money(Japan EN) format 
function moneyFormat(num) {
    // return (
    //     "￥" +
    //     (num || 0)
    //     .toString()
    //     .replace(/^-?\d+/g, m => m.replace(/(?=(?!\b)(\d{3})+$)/g, ","))
    // );

    // 小数に対応
    if (num === null || num === undefined) {
        return "￥0";
    }
    const numStr = num.toString();
    const [integerPart, decimalPart] = numStr.split('.');
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return "￥" + (decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger);

}

// cut off '￥' and ',' comma and convert to number
function removeComma(v) {
    if(v === undefined || v === '') return 0

    let val = '' + v;
    val = hankaku2Zenkaku(val)
    if( val === '' || val === '￥' )
        val = '￥0'
    if(val.slice(0,1) === '￥') val = val.slice(1)
    const sv = val.split(',')
    return parseFloat(sv.join(''))
}

function checkIME(e) {
  if (e.isComposing || e.key === 'Process' || e.keyCode === 229) {
    imeState.value = true;
    message.value = "英数字で入力ください。"
    e.preventDefault();
    // IME入力中
  } else {
    imeState.value = false;
    message.value = ""
    // IME入力中でない
  }
}

// get rid off not numeric alphabets
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
     if ((charCode > 31 && (charCode < 48 || charCode > 57)) && charCode !== 46) { 
    //if (charCode > 31 && (charCode < 48 || charCode > 57)) { // We don't need '.' in Japan EN
        evt.preventDefault();
    } else {
        return true;
    }
}

function hankaku2Zenkaku(str) {
    // console.log(str)
    if( imeState.value ) {
        document.getElementById('currency_field').value = "￥0"
        return "￥0"
    }
    return str.replace(/[０-９]/g, function(s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
}

const currency = computed({
    get: () => {
        return moneyFormat(removeComma(props.modelValue))
    },
    set: (v) => {
        emit('update:modelValue', removeComma(v))
    }
})

const handleBlur = (ev) => {
  emit('blur', ev);
}

const handleInput = (ev) => {
    emit('input', ev)
}

</script>

<template>
    <div>
        <input id="currency_field"
            class="input_field"
            :disabled="props.disabled" 
            :min="props.min"
            :max="props.max"
            v-model="currency" @blur="handleBlur" @input="handleInput" @keypress="isNumber($event)" @keydown="checkIME($event)">
        <!-- <el-input id="currency_field"
            style="text-align: right;"
            class="input_field"
            :disabled="props.disabled" 
            :min="props.min"
            :max="props.max"
            v-model="currency" @blur="handleBlur" @input="handleInput" @keypress="isNumber($event)" @keydown="checkIME($event)">
        </el-input> -->
        <span v-show="message!=''" style="margin-left: 4px;color:red;">{{ message }}</span>
    </div>
</template>
<style scoped>

.input_field {
    margin-left: 4px;
    margin-right: 4px;
    background-color: transparent !important;
    color: #2f4f4f;
    text-align: right;
    width: 7em;
    border: 1px solid #c8e4e4;
}

</style>