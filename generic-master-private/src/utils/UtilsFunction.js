const selectedAllowances = ref([]);
const selectedRates = ref([]);

const availableAllowances = computed(() => {
    return data.allowanceList?.filter(
        (allowance) => !selectedAllowances.value.includes(allowance.value)
    );
});
    
// Computed property for available overtime pay rates
const availableRates = computed(() => {
    return data.overtimeRateList?.filter(
        (rate) => !selectedRates.value.includes(rate.value)
    );
});

// Handle allowance selection
const handleAllowanceSelection = (index, value) => {
    const currentAllowance = states.contractSelectRow.content.allowances[index].allowance_name;

    // Remove the previously selected allowance (if any)
    if (currentAllowance) {
        selectedAllowances.value = selectedAllowances.value.filter(
            (item) => item !== currentAllowance.value
        );
    }

    // Add the new allowance to the selected list
    if (value) {
        selectedAllowances.value.push(value.value);
    }

    // Update the allowance in the data store
    states.contractSelectRow.content.allowances[index].allowance_name = value;
};

// Handle rate selection
const handleRateSelection = (index, value) => {
    const currentRate = states.contractSelectRow.content.over_time_pay_rates[index].rate_name;

    // Remove the previously selected rate (if any)
    if (currentRate) {
        selectedRates.value = selectedRates.value.filter(
        (item) => item !== currentRate.value
        );
    }

    // Add the new rate to the selected list
    if (value) {
        selectedRates.value.push(value.value);
    }

    // Update the rate in the data store
    states.contractSelectRow.content.over_time_pay_rates[index].rate_name = value;
};

function init() {
    if( !states.contractSelectRow ) 
        states.contractSelectRow = {}

    if( !states.contractSelectRow?.content ) 
        states.contractSelectRow.content = {}

    if( !states.contractSelectRow.content?.allowances ) {
        states.contractSelectRow.content.allowances= []
        states.contractSelectRow.content.over_time_pay_rates= []
    }
}

// Add allowance
function addAllowance() {
    init()
    states.contractSelectRow.content.allowances.push({ allowance_name: '', allowance_value: '', allowance_unit: '' });
}

// Delete allowance
function delAllowance(index) {
    const deletedAllowance = states.contractSelectRow.content.allowances[index].allowance_name;
    if (deletedAllowance) {
        selectedAllowances.value = selectedAllowances.value.filter(
        (item) => item !== deletedAllowance.value
        );
    }
    states.contractSelectRow.content.allowances.splice(index, 1);
}

// Add rate
function addRate() {
    init()
    states.contractSelectRow.content.over_time_pay_rates.push({ rate_name: '', rate_value: '' });
}

// Delete rate
function delRate(index) {
    const deletedRate = states.contractSelectRow.content.over_time_pay_rates[index].rate_name;
    if (deletedRate) {
        selectedRates.value = selectedRates.value.filter(
        (item) => item !== deletedRate.value
        );
    }
    states.contractSelectRow.content.over_time_pay_rates.splice(index, 1);
}
