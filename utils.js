"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToBytes = stringToBytes;
exports.get_control_number = get_control_number;
exports.get_control_number_AVS = get_control_number_AVS;
exports.get_random_AVS_number = get_random_AVS_number;
exports.gaussianRandom = gaussianRandom;
exports.get_random_height = get_random_height;
exports.get_random_gender = get_random_gender;
exports.get_random_first_name = get_random_first_name;
exports.get_random_number = get_random_number;
exports.get_random_age = get_random_age;
exports.get_random_start_and_expiration_date = get_random_start_and_expiration_date;
exports.get_probabilities_from_csv = get_probabilities_from_csv;
exports.get_random_image_byte_array = get_random_image_byte_array;
exports.get_random_image_signature = get_random_image_signature;
exports.get_row_table_from_csv = get_row_table_from_csv;
exports.get_column_table_from_csv = get_column_table_from_csv;
exports.get_zla_code = get_zla_code;
exports.get_random_value_from_array = get_random_value_from_array;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sync_1 = require("csv-parse/sync");
function stringToBytes(str) {
    return Uint8Array.from(Buffer.from(str, "utf-8"));
}
function get_control_number(str) {
    // Transform Accent to normal letter and uppercase everything
    const cleaned_str = str.normalize("NFD").replace(" ", "").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    let sum = 0;
    let counter = 0;
    const weights = [7, 3, 1];
    for (const char of cleaned_str) {
        if (/[A-Z]/.test(char)) {
            // Character is a letter, transform to number
            const charCode = char.charCodeAt(0) - 55; // 'A' -> 65 - 55 = 10
            const numberValue = charCode * weights[counter % weights.length];
            sum += numberValue;
        }
        else if (/[0-9]/.test(char)) {
            // Character is a digit, use its numeric value
            sum += (parseInt(char, 10) * weights[counter % weights.length]);
        }
        else if (char !== "<") {
            throw new Error(`Invalid character '${char}' in input string`);
        }
        counter++;
    }
    return sum % 10;
}
function get_control_number_AVS(str) {
    // Transform Accent to normal letter and uppercase everything
    const cleaned_str = str.replace(".", "").split("").reverse();
    let sum = 0;
    let counter = 0;
    const weights = [3, 1];
    for (const char of cleaned_str) {
        if (/[0-9]/.test(char)) {
            // Character is a digit, use its numeric value
            sum += (parseInt(char, 10) * weights[counter % weights.length]);
        }
        else if (char !== "<") {
            throw new Error(`Invalid character '${char}' in input string`);
        }
        counter++;
    }
    return (10 - (sum % 10)) % 10;
}
function get_random_AVS_number() {
    const max = 10; // 9 random number
    const number = 9;
    let random = "";
    for (let i = 0; i < number; i++) {
        random += Math.floor(Math.random() * max).toString();
    }
    let control_number = get_control_number_AVS("756" + random);
    let random_with_separation = random.substring(0, 4) + "." + random.substring(4, 8) + "." + random.at(8);
    return "756." + random_with_separation + control_number;
}
// Standard Normal variate using Box-Muller transform.
function gaussianRandom(mean = 0, stdev = 1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}
// Based on the result of this article from 2017
// https://www.sciencedirect.com/science/article/pii/S221133552200287X#t0005
// Below 14, the height is not added to the identity card 
// https://www.fedlex.admin.ch/eli/oc/2002/468/fr (Art 14, al 3)
function get_random_height(gender, age) {
    if (age && age < 14) {
        return 0;
    }
    let mean = (gender === "M" ? 177.0 : 164.6);
    let stdev = (gender === "M" ? 7.1 : 6.5);
    return Math.floor(gaussianRandom(mean, stdev));
}
// Swiss gender percentage
// https://www.swissstats.bfs.admin.ch/collection/ch.admin.bfs.swissstat.en.issue200111551900/article/issue200111551900-04
function get_random_gender() {
    let genders = ["M", "F"]; // Two gender considered by the swiss confederation
    let index = Math.floor(Math.random() * 2);
    return genders[index];
}
// 
function get_random_first_name(gender, male_rows = get_column_table_from_csv("stat/first_name.csv", 1, 6), female_rows = get_column_table_from_csv("stat/first_name.csv", 0, 6)) {
    if (gender === "M") {
        return get_random_value_from_array(male_rows);
    }
    else {
        return get_random_value_from_array(female_rows);
    }
}
//Used for the document number and other random values
// No precise definition about this number
// Random, unique
// Big number in string format
// One letter, 7 number, take 10 number to have around the same size set
function get_random_number(size) {
    if (size > Number.MAX_SAFE_INTEGER) {
        return BigInt(Math.floor(Math.random() * size));
    }
    else
        return Math.floor(Math.random() * size);
}
// https://www.pxweb.bfs.admin.ch/pxweb/fr/px-x-0102010000_103/-/px-x-0102010000_103.px/table/tableViewLayout2/
// As bounded Zero-Knowledge proof need positive integer, 
// and DateTime count the time based on the 1st january 1970, 
// any date previous to this is counted as negative milliseconds. 
// We thus need to shift the milliseconds values to only positive one by the oldes birth name possible
// In this experiment, as the maximum age is 100 years, taking the 1 january 1920 assure
// to not have any negative milliseconds values.
function get_random_age(gender, table, total_value, relative_min_date = new Date("1-1-1920").getTime()) {
    // Recover the correct percentage, using the general one if no gender precised
    let row = 0;
    if (!gender) {
        row = 1;
    }
    else if (gender === "M") {
        row = 2;
    }
    else if (gender === "F") {
        row = 3;
    }
    else {
        row = 1;
    }
    let new_table;
    let new_total_value;
    if (!table || !total_value) {
        let temp = get_row_table_from_csv("stat/output_age.csv", row);
        new_table = temp.table;
        new_total_value = temp.total_value;
    }
    else {
        new_table = table[row - 1];
        new_total_value = total_value[row - 1];
    }
    let age = get_probabilities_from_csv(new_total_value, new_table);
    // After generating the age, we must generate the date of birth. 
    // A date is randomly selected and in an uniform way to correspond to the age
    // For simplicity, we consider the current day to 1 january 2025
    let current_year = 2025;
    let oldest_day = new Date("01-01-" + (current_year - age).toString()).getTime();
    let newset_day = new Date("02-01-" + (current_year - 1 - age).toString()).getTime();
    return { age: age,
        birth_date: new Date(randomValueBetween(newset_day, oldest_day)).getTime() - relative_min_date };
}
// https://www.fedlex.admin.ch/eli/oc/2002/468/fr, art 5 
// As the issuance day won't be older than 20 years, the issue with negative milliseconds value
// won't appear.
function get_random_start_and_expiration_date(age, expired) {
    let time = 0;
    // if more than 18 year or not precised, 10 year
    if (!age || age >= 18) {
        time = 10;
        //if less than 18 year but more than 3, 5 year
    }
    else if (age >= 3) {
        time = 5;
        // if less than 3, 3 year
    }
    else {
        time = 3;
    }
    // For simplicity, we consider the current day to 1 january 2025
    let current_year = 2025;
    let oldest_day_possible;
    let current_day;
    if (expired && expired === true) {
        //if expired, the start day must be before the number of year
        oldest_day_possible = new Date("01-01-" + (current_year - time - Math.floor(randomValueBetween(1, 10))).toString()).getTime();
        current_day = new Date("01-01-" + (current_year - time).toString()).getTime();
    }
    else {
        oldest_day_possible = new Date("01-01-" + (current_year - time).toString()).getTime();
        current_day = new Date("01-01-" + (current_year).toString()).getTime();
    }
    let issuance_date = new Date(randomValueBetween(current_day, oldest_day_possible));
    let expiration_date = new Date(issuance_date);
    //The expiration date is time an 1 day after the issuance date
    expiration_date.setFullYear(expiration_date.getFullYear() + time);
    expiration_date.setDate(expiration_date.getDate() + 1);
    return { time: time,
        issuance_date: issuance_date.getTime(),
        expiration_date: expiration_date.getTime()
    };
}
function get_probabilities_from_csv(total_value, table) {
    let max = total_value;
    let index = Math.floor(Math.random() * max);
    let age = -9999;
    for (let i = 0; i < table.length; i++) {
        if (index <= parseInt(table[i])) {
            age = i;
            i = table.length;
        }
        index -= parseInt(table[i]);
    }
    return age;
}
// https://www.fedlex.admin.ch/eli/cc/2010/96/de#art_12
// Expected to have 1980*1440 pixels but caused issues of memory, (For a value that need only to be unique )
// so it was reduced at most as possible
function get_random_image_byte_array(length = Math.pow(10, 200)) {
    return "data:image/png;base64," + get_random_number(length).toString();
}
// https://www.fedlex.admin.ch/eli/cc/2010/96/de#art_11
function get_random_image_signature(age = 18) {
    if (age < 7) {
        return "***";
    }
    else {
        //Only black and white pixels, one fourth of the face image size
        //One pixel with 8 bits, represented with a byte => 8 pixel represented with a byte
        return get_random_image_byte_array((Math.pow(10, 200)) / (4 * 8));
    }
}
function get_row_table_from_csv(file, row, start_index, total_index) {
    const csvFilePath = path.resolve(__dirname, file);
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    let result = (0, sync_1.parse)(fileContent, { delimiter: ',', });
    let size_category = result[result.length - 1].filter((x) => x !== '');
    // If not start of the table specified, 
    //assume the table of probabilities start after the label name and the total
    start_index = start_index || size_category[0];
    start_index++;
    total_index = total_index || size_category[0];
    let total_value = result[row][total_index];
    let table = result[row].slice(start_index);
    return { table: table, total_value: total_value };
}
function get_column_table_from_csv(file, column, start_index = 0) {
    try {
        // Resolve the file path and read the file content
        const csvFilePath = path.resolve(__dirname, file);
        let fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
        // Remove BOM if it exists
        if (fileContent.charCodeAt(0) === 0xfeff) {
            fileContent = fileContent.slice(1);
        }
        // Parse the CSV file content
        const records = (0, sync_1.parse)(fileContent, { delimiter: ',' });
        // Validate the column and start_index
        if (column < 0 || column >= records[0].length) {
            throw new Error(`Invalid column index: ${column}`);
        }
        if (start_index < 0 || start_index >= records.length) {
            throw new Error(`Invalid start index: ${start_index}`);
        }
        // Extract the specified column starting from start_index
        const columnValues = [];
        for (let i = start_index; i < records.length; i++) {
            if (records[i][column] !== "") {
                columnValues.push(records[i][column]);
            }
        }
        return columnValues;
    }
    catch (error) {
        console.error(`Error processing CSV file: ${error}`);
        return [];
    }
}
function get_zla_code(documentNumber, birth_date, gender, expiration_date, first_name, last_name) {
    // First Line
    let firstLine = "ID" + "CHE" + documentNumber;
    for (let i = documentNumber.length; i < 9; i++) {
        firstLine += "<";
    }
    firstLine += get_control_number(firstLine.slice(5, 14));
    for (let i = firstLine.length; i < 30; i++) {
        firstLine += "<";
    }
    // Second Line
    let birth_d = new Date(birth_date).toLocaleDateString().split("/");
    let exp_d = new Date(expiration_date).toLocaleDateString().split("/");
    let secondLine = "" + birth_d[2].slice(2, 4);
    secondLine += birth_d[0].length === 2 ? birth_d[0] : "0" + birth_d[0];
    secondLine += birth_d[1].length === 2 ? birth_d[1] : "0" + birth_d[1];
    secondLine += get_control_number(secondLine);
    secondLine += gender + exp_d[2].slice(2, 4);
    secondLine += exp_d[0].length === 2 ? exp_d[0] : "0" + exp_d[0];
    secondLine += exp_d[1].length === 2 ? exp_d[1] : "0" + exp_d[1];
    secondLine += get_control_number(secondLine.slice(8, 15)) + "CHE";
    for (let i = secondLine.length; i < 29; i++) {
        secondLine += "<";
    }
    secondLine += get_control_number(firstLine.slice(5) + secondLine.slice(0, 7) + secondLine.slice(8, 15) + secondLine.slice(18, 29));
    // Last Line
    let f_name = first_name.normalize("NFD").replace(/[ -]/g, "<").replace(/[\u0300-\u036f'.,]ß/g, "").toUpperCase();
    let l_name = last_name.normalize("NFD").replace(/[ -]/g, "<").replace(/[\u0300-\u036f'.,]/g, "").toUpperCase();
    let thirdLine = l_name + "<<" + f_name;
    for (let i = thirdLine.length; i < 30; i++) {
        thirdLine += "<";
    }
    return firstLine + "\n" + secondLine + "\n" + thirdLine.slice(0, 31);
}
function get_random_value_from_array(array) {
    let max = array.length;
    let index = Math.floor(Math.random() * max);
    return array[index];
}
function randomValueBetween(min, max) {
    return Math.random() * (max - min) + min;
}
module.exports = {
    stringToBytes,
    get_control_number,
    get_control_number_AVS,
    get_random_height,
    get_random_AVS_number,
    get_random_start_and_expiration_date,
    get_random_age,
    get_random_gender,
    gaussianRandom,
    get_probabilities_from_csv,
    get_random_number,
    get_column_table_from_csv,
    get_random_value_from_array,
    get_random_first_name,
    get_zla_code,
    get_row_table_from_csv,
    get_random_image_byte_array,
    get_random_image_signature
};
