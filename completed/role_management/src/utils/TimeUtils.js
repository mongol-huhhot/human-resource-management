import dayjs from 'dayjs'

/**
 *  (-)HH:mm:ss String =>  (-)'HH:mm' String
 * @param {*} input: '00:00:00'
 * @returns (-)'HH:mm'format string
 */
export function formatTime(input) {
    // Ensure that input is a string
    if (typeof input !== "string") {
        return input; // Return the original value or handle it appropriately
    }

    // Check if the input starts with a negative sign
    const isNegative = input.startsWith("-");

    // Remove the negative sign if present
    const timeString = isNegative ? input.slice(1) : input;

    // Split the time string by ":"
    const parts = timeString.split(":");

    // Format the result with hours and minutes
    let formattedTime = `${parts[0]}:${parts[1]}`;

    // Add the negative sign back if it was originally negative
    if (isNegative) {
        formattedTime = `-${formattedTime}`;
    }

    return formattedTime;
}

// Example usage
// let timeString = "88:42";
// let minutesToAdd = 30;
// let newTimeString = addMinutesToTimeString(timeString, minutesToAdd);
// console.log(newTimeString); // Output: "89:12"
export function addMinutesToTimeString(timeString, minutesToAdd) {
    // Split the timeString into hours and minutes
    let isNegative = timeString.startsWith("-");
    let [hours, minutes] = timeString.replace("-", "").split(":").map(Number);
    
    // Calculate the total minutes
    let totalMinutes = hours * 60 + minutes;

    // Add the given minutes (handle negative time properly)
    if (isNegative) {
        totalMinutes = -totalMinutes;
    }
    totalMinutes += minutesToAdd;

    // Convert back to hours and minutes
    let resultIsNegative = totalMinutes < 0;
    totalMinutes = Math.abs(totalMinutes);
    let resultHours = Math.floor(totalMinutes / 60);
    let resultMinutes = totalMinutes % 60;

    // Format the result
    let formattedTime = `${resultHours}:${resultMinutes.toString().padStart(2, '0')}`;
    if (resultIsNegative) {
        formattedTime = `-${formattedTime}`;
    }

    return formattedTime;
}

// Helper function to convert time string to total minutes
/**
 * '130:34'=>7834m
 * 
 * @param {*} timeString 
 * @returns 
 */
export function timeStringToMinutes(timeString) {
    let isNegative = timeString.startsWith("-");
    let [hours, minutes] = timeString.replace("-", "").split(":").map(Number);
    let totalMinutes = hours * 60 + minutes;
    return isNegative ? -totalMinutes : totalMinutes;
}

// Example usage
// let timeString1 = "89:10";
// let timeString2 = "80:10";
// let result = addTimeStrings(timeString1, timeString2);
// console.log(result); // Output: "169:20"
export function addTimeStrings(timeString1, timeString2) {
    // Convert both time strings to total minutes
    let totalMinutes1 = timeStringToMinutes(timeString1);
    let totalMinutes2 = timeStringToMinutes(timeString2);

    // Add the total minutes
    let summedMinutes = totalMinutes1 + totalMinutes2;

    // Convert total minutes back to time string
    let isNegative = summedMinutes < 0;
    summedMinutes = Math.abs(summedMinutes);
    let resultHours = Math.floor(summedMinutes / 60);
    let resultMinutes = summedMinutes % 60;

    // Format the result
    let formattedTime = `${resultHours}:${resultMinutes.toString().padStart(2, '0')}`;
    if (isNegative) {
        formattedTime = `-${formattedTime}`;
    }

    return formattedTime;
}

/**
 * to get two date strings substract. 
 * 
 * @param {*} endtime 
 * @param {*} starttime 
 * @returns 
 */
export function subTimeStrings(endtime,starttime) {

    let diffInMinutes = dayjs(endtime).diff(dayjs(starttime), 'minute');
  
    let isNegative = diffInMinutes < 0;
    diffInMinutes = Math.abs(diffInMinutes);
  
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
  
    // Format the result as 'HH:mm'
    let formattedDiff = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    if (isNegative) {
        formattedDiff = `-${formattedDiff}`;
    }
    return formattedDiff
}

/**
 * mimutes to time string. 7834m=130:34, -7834m=-130:34
 * 
 * @param {*} totalMinutes 
 * @returns 
 */
export function minutesToTimeString(totalMinutes) {
    let isNegative = totalMinutes < 0;
    totalMinutes = Math.abs(totalMinutes);
    let hours = Math.floor(totalMinutes / 60);
    let minutes = totalMinutes % 60;

    let formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    if (isNegative) {
        formattedTime = `-${formattedTime}`;
    }

    return formattedTime;
}

/**
 * round timestamp to nearest value by RoundMinutes
 * @param {*} date 
 * @param {*} RoundMinutes 
 * @returns 
 */
export function roundToNearestMinutes(date, RoundMinutes) {
    const minutes = dayjs(date).minute();
    const roundedMinutes = Math.round(minutes / RoundMinutes) * RoundMinutes;
    return dayjs(date).minute(roundedMinutes).second(0);
}

/**
 * Check the value is Negative or a string start with '-'
 * 
 * @param {*} value 
 * @returns if Negastive number or string start with '-' returns true  else returns false
 */
export function isNegativeTime(value) {
    if( typeof value === 'number' && !isNaN(value) ) 
        return value < 0

    if (typeof value === "string" ) {
        return value.startsWith("-");
    }

    return false
}

