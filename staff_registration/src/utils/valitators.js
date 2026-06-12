import { useDataStore } from "@/stores/DataStore";
// const dataStore = useDataStore();
/**
 * this is a validation lib
 * what ever function you need, please add them freely!!!
 * chen, 2025/01/14
 */

/**
 * 
 * @param {*} value: a string  value
 * @returns 
 *      if a value is Numeric true else false
 */
export function valueToNumeric( value=null ) {
    if( !value ) return false;
    const numericValue = parseFloat( value );
    return isNaN(numericValue)?0:numericValue
}

/**
 * 
 * @param {*} value : a string value
 * @returns
 *      if a value is numeric and positive value,  
 */
export function numericPositiveValue( value=null ) {
    if( !value ) return false;
    const numericRegex = /^[0-9]+(\.[0-9]+)?$/;
    if (!numericRegex.test( value )) {
        return false;
    }
    
    const numericValue = parseFloat(value);
    
    return numericValue >= 0;
}

/**
 * 
 * @param {*} value : a string value
 * @returns: true if numeric, false else
 */
export function isNotNumeric(value) {
    return typeof value !== 'number' && isNaN(parseFloat(value));
}

/**
 * 
 * @param {*} value: a string
 * @returns 
 *      if a value is a not NULL(null|undefined|'')
 */
export function notNullValue( value = null ) {
    if( !value ) return false;
    return value !== null && value.trim() !== '';
}


/**
 * 
 * @param {*} email: a string inputed 
 * @returns 
 */
export function isEmail(email) {
    // Regular expression for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * 
 * @param {*} value : a string value
 * @returns 
 */
export function phoneNumber(value) {
    const phonenumerRegex = /^\d{10,15}$/
    return phonenumerRegex.test(value)
}

/**
 * 
 * @param {*} validations :
 *  [
        {field: 'mng_comments', name: '所属長(一次評価者)コメント', func: notNullValue, error_mmessage: '入力が必要'},
        {field: 'first_eval', name: '一次評価達成度/得点', func: numericPositiveValue, error_mmessage: '数値値が必要'},
    ]
 * @param {*} data：
    {
        mng_comments:'',
        first_eval: '12',
    } 
 * @returns 
 */
export function validate(validations = [], data = null) {
    if (!validations.length) return { code: true, messages: null }; // No validation needed
    if (!data) return { code: false, messages: ["データなし"] }; // No data provided

    let messages = []; // Store error messages

    validations.forEach((el, index) => {
        console.log("eeeee===", el, data[el.field])
        if (el.func && !el.func(data[el.field])) {
            messages.push(`${index + 1}:${el.name}:${el.error_mmessage}`);
        }
    });

    return messages.length
        ? { code: false, messages } // Validation failed
        : { code: true, messages: null }; // Validation passed
}

export async function userIdExists(value) {
  if (!value) return true;
  const exists = await useDataStore().checkExistingOfUserid({ checkval: value });
  return !exists; // true: OK, false: already exists
}

export function compareDates(startDate, endDate) {
    return new Date(startDate) <= new Date(endDate);
}

/**
 * start_date > end_date
  * 
 */

/**
 * for onBlur validation
 * add more if needed
 */
export const rules = {
  required: (value) => !!value || "必須項目",
  email: (value) => isEmail(value) || "Invalid email",
  phone: (value) => phoneNumber(value) || "Invalid phone number",
  minLength: (min) => (value) =>
    (value && value.length >= min) || `Minimum length is ${min} characters`,
 
//   userIdExists: async (value) => {
//     if (!value) return true; // skip if empty, let `required` handle it
//     const exists = await useDataStore().checkExistingOfUserid({ checkval: value });
//     return !exists || "この値は既に存在します"; // Return error if exists
//   },
};


/**
 * 
 * @param {*} obj: the source object
 * @param {*} path: the item path, like 'content.staff_name' etc.
 * @returns the value of the path in the obj. like, return obj['content']['staff_name']
 *      getNestedValue(obj, 'content.staff_name')
 * 
 * console.log(getNestedValue(data, "content.staff_name")); // Output: "my name"
 * console.log(getNestedValue(data, "content.invalid_key")); // Output: undefined
 * console.log(getNestedValue(data, "invalid.path")); // Output: undefined
 */
export function getNestedValue(obj, path, defaultValue = undefined) {
    return path.split('.').reduce((acc, key) => {
        return acc && acc[key] !== undefined ? acc[key] : defaultValue;
    }, obj);
}

/**
 * for batch validation
 * add more if needed
 */
// const validationItems = [
//   { field: "fullName", name: "ユーザーID", func: validator.notNullValue, error_message: "入力が必要" },
//   { field: "password", name: "パスワード", func: validator.notNullValue, error_message: "入力が必要" },
//   { field: "email", name: "メール", func: validator.isEmail, error_message: "メールを入力してください。" },
//   { field: "gender", name: "性別", func: validator.notNullValue, error_message: "入力が必要" },
//   { field: "address", name: "住所", func: validator.notNullValue, error_message: "入力が必要" },
// ];

// function saveData(save, data={}) {
//   messages.value = null;
//   console.log("data====", { ...data });
//   const validationResult = validator.validate(validationItems, { ...data });
//   if (!validationResult.code) {
//     messages.value = validationResult.messages;
//     return;
//   }

//   save();
// }
