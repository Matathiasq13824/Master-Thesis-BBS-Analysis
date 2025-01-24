import * as fs from "fs";
import * as path from "path";
import { parse } from 'csv-parse/sync';

/*
*
*           Helper Functions
* 
*/


export function string_to_bytes(str: string): Uint8Array {
    return Uint8Array.from(Buffer.from(str, "utf-8"));
}

// Standard Normal variate using Box-Muller transform.
export function gaussian_random(mean=0, stdev=1) {
    const u = 1 - Math.random(); // Converting [0,1) to (0,1]
    const v = Math.random();
    const z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev + mean;
}

//Used for the document number and other random values
// No precise definition about this number
// Random, unique
// Big number in string format
// One letter, 7 number, take 10 number to have around the same size set
export function get_random_number(size:number){
    if (size > Number.MAX_SAFE_INTEGER){
        return BigInt(Math.floor(Math.random() * size))
    }
    else return  Math.floor(Math.random() * size)

}


export function random_value_between(min:number, max:number) {
    return Math.floor(Math.random() * (max - min) + min);
}

export function get_row_table_from_csv(
    file: string,
    row: number,
    start_index?: number,
    total_index?: number
  ): any {
    const csvFilePath = path.resolve(__dirname, file);
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    let result = parse(fileContent, {delimiter: ',',})

    // If no index values, the csv file must contain at the last line the number of columns who contain label
    let size_category:number[] = result[result.length-1].filter((x:string) => x !=='');
    // If not start_index specified, 
    // assume the table of probabilities start after the label name and the total value
    start_index = start_index || size_category[0];
    start_index++;
    total_index = total_index || size_category[0];
    let total_value = result[row][total_index];
    let table = result[row].slice(start_index).filter((x:string) => x !=='');
    return {table: table, total_value: total_value};
}


export function get_column_table_from_csv(
    file: string,
    column: number,
    start_index: number = 0
  ): string[] {
    try {
        // Resolve the file path and read the file content
        const csvFilePath = path.resolve(__dirname, file);
        let fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  
        // Remove BOM if it exists
        if (fileContent.charCodeAt(0) === 0xfeff) {
            fileContent = fileContent.slice(1);
        }
        // Parse the CSV file content
        const records: string[][] = parse(fileContent, { delimiter: ',' });

    
        // Validate the column and start_index
        if (column < 0 || column >= records[0].length) {
            throw new Error(`Invalid column index: ${column}`);
        }
        if (start_index < 0 || start_index >= records.length) {
            throw new Error(`Invalid start index: ${start_index}`);
        }
    
        // Extract the specified column starting from start_index
        const columnValues: string[] = [];
        for (let i = start_index; i < records.length; i++) {
            if(records[i][column] !== ""){
                columnValues.push(records[i][column]);
            }
        }
  
      return columnValues;
    } catch (error) {
      console.error(`Error processing CSV file: ${error}`);
      return [];
    }
  }

  export function get_probabilities_from_array(total_value:number, table:string[]):number{
    let max = total_value;
    let index:number = Math.floor(Math.random() * max);
    let age = -9999;
    for(let i = 0; i < table.length; i++){
        if (index <= parseInt(table[i])){
            age = i;
            i = table.length;
        }
        index-=parseInt(table[i]);
    }
    return age;
}

export function get_random_value_from_array(array:any[]){
    let max = array.length;
    let index:number = Math.floor(Math.random() * max);
    return array[index]
}

export function get_random_values_from_array<T>(array: T[], count: number): T[] {
    if (count > array.length) {
      throw new Error("Count cannot be greater than the array length");
    }
  
    const shuffled = [...array]; // Create a copy to avoid modifying the original array
    for (let i = shuffled.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]]; // Swap elements
    }
  
    return shuffled.slice(0, count); // Take the first `count` elements
} 


export function get_control_number(str:string): number {
    // Transform Accent to normal letter and uppercase everything
    const cleaned_str = str.normalize("NFD").replace(" ", "").replace(/[\u0300-\u036f]/g, "").toUpperCase()
    let sum = 0;
    let counter = 0;
    const weights = [7,3,1]

    for (const char of cleaned_str) {
        if (/[A-Z]/.test(char)) {
            // Character is a letter, transform to number
            const charCode = char.charCodeAt(0) - 55; // 'A' -> 65 - 55 = 10
            const numberValue = charCode * weights[counter%weights.length];
            sum += numberValue;
        } else if (/[0-9]/.test(char)) {
            // Character is a digit, use its numeric value
            sum += (parseInt(char, 10)* weights[counter%weights.length]);
        } else if (char !== "<"){
            throw new Error(`Invalid character '${char}' in input string`);
        }
        counter++;
    }
    return sum%10;
}

export function get_control_number_AVS(str:string): number {
    // Transform Accent to normal letter and uppercase everything
    const cleaned_str = str.replace(".", "").split("").reverse();
    let sum = 0;
    let counter = 0;
    const weights = [3,1]

    for (const char of cleaned_str) {
        if (/[0-9]/.test(char)) {
            // Character is a digit, use its numeric value
            sum += (parseInt(char, 10)* weights[counter%weights.length]);
        } else if (char !== "<"){
            throw new Error(`Invalid character '${char}' in input string`);
        }
        counter++;
    }
    return (10 - (sum%10))%10;
}

function get_random_letters(count: number, letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"): string {
    return Array.from({ length: count }, () => 
      letters[Math.floor(Math.random() * letters.length)]
    ).join('');
  }

export function getRandomDateForAge(birthDate: number, currentDate: number, targetAge: number): number {
    // Calculate the start date when the person reached the target age
    const startDate = new Date(birthDate);
    startDate.setFullYear(startDate.getFullYear() + (targetAge-1));
  
    // Calculate the end date, which is one year after the start date
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + 1);
  
    // Ensure the end date doesn't go beyond the current date
    if (endDate.getTime() > currentDate) {
      endDate.setTime(currentDate);
    }
  
    // Generate a random date between the start and end dates
    const randomTimestamp = random_value_between(startDate.getTime(),endDate.getTime());
    return randomTimestamp;
  }

/*
*
*           General Generation Function
*
*/

// Swiss gender percentage
// https://www.swissstats.bfs.admin.ch/collection/ch.admin.bfs.swissstat.en.issue200111551900/article/issue200111551900-04
export function get_random_gender(){
    let genders = ["M", "F"] // Two gender considered by the swiss confederation
    let index = Math.floor(Math.random() * 2);
    return genders[index];
}


// 
export function get_random_first_name(gender:string, male_rows = get_column_table_from_csv("stat/first_name.csv", 1, 6), female_rows = get_column_table_from_csv("stat/first_name.csv", 0, 6)){
    if (gender ==="M"){
        return get_random_value_from_array(male_rows);
    } else {
        return get_random_value_from_array(female_rows);
    }
}

// https://www.fedlex.admin.ch/eli/cc/2010/96/de#art_12
// Expected to have 1980*1440 pixels but caused issues of memory, (For a value that need only to be unique )
// so it was reduced at most as possible
export function get_random_image_byte_array(length:number = 10**200){
    return "data:image/png;base64," + get_random_number(length).toString()
}

// https://www.fedlex.admin.ch/eli/cc/2010/96/de#art_11
export function get_random_image_signature(age:number= 18){
    if(age < 7){
        return "***";
    } else {
        //Only black and white pixels, one fourth of the face image size
        //One pixel with 8 bits, represented with a byte => 8 pixel represented with a byte
        return get_random_image_byte_array((10**200)/(4*8))
    }
}



/*
*
*           Identity Card Generation Function
*
*/



export function get_random_AVS_number(): string {
    const max = 10 // 9 random number
    const number = 9;
    let random = ""
    for (let i = 0; i< number; i++){
        random+= Math.floor(Math.random() * max).toString()
    }
    let control_number = get_control_number_AVS("756"+ random)
    let random_with_separation = random.substring(0,4)+"."+random.substring(4,8)+"."+random.at(8);
    return "756."+random_with_separation+control_number
}



// Based on the result of this article from 2017
// https://www.sciencedirect.com/science/article/pii/S221133552200287X#t0005
// Below 14, the height is not added to the identity card 
// https://www.fedlex.admin.ch/eli/oc/2002/468/fr (Art 14, al 3)
export function get_random_height(gender: string, age?:number){
    if (age && age < 14){
        return 0;
    }
    let mean = (gender === "M" ? 177.0: 164.6);
    let stdev = (gender === "M" ? 7.1: 6.5)
    return Math.floor(gaussian_random(mean,stdev))
}



// https://www.pxweb.bfs.admin.ch/pxweb/fr/px-x-0102010000_103/-/px-x-0102010000_103.px/table/tableViewLayout2/
// As bounded Zero-Knowledge proof need positive integer, 
// and DateTime count the time based on the 1st january 1970, 
// any date previous to this is counted as negative milliseconds. 
// We thus need to shift the milliseconds values to only positive one by the oldes birth name possible
// In this experiment, as the maximum age is 100 years, taking the 1 january 1920 assure
// to not have any negative milliseconds values.
export function get_random_age_identity_card(gender?:string, table?:string[][], total_value?:number[], relative_min_date= new Date("1-1-1920").getTime()){

    // Recover the correct percentage, using the general one if no gender precised
    let row =0;
    if(!gender){
        row = 1;
    } else if (gender === "M"){
        row = 2;
    } else if (gender === "F"){
        row = 3;
    } else {
        row = 1;
    }
    let new_table:string[];
    let new_total_value:number
    if (!table || !total_value){
        let temp = get_row_table_from_csv("stat/output_age.csv", row)
        new_table = temp.table
        new_total_value = temp.total_value
    } else {
        new_table = table[row-1];
        new_total_value = total_value[row-1]
    }
    let age = get_probabilities_from_array(new_total_value, new_table);

    // After generating the age, we must generate the date of birth. 
    // A date is randomly selected and in an uniform way to correspond to the age
    // For simplicity, we consider the current day to 1 january 2025
    let current_year = 2025;
    let oldest_day = new Date("01-01-" + (current_year-age).toString()).getTime();
    let newset_day = new Date("02-01-" + (current_year-1-age).toString()).getTime();
    return {age: age,
         birth_date: new Date(random_value_between(newset_day,oldest_day)).getTime() - relative_min_date}
}

// https://www.fedlex.admin.ch/eli/oc/2002/468/fr, art 5 
// As the issuance day won't be older than 20 years, the issue with negative milliseconds value
// won't appear.
export function get_random_start_and_expiration_date_identity_card(age?:number, expired?:boolean){
    let time = 0;
    // if more than 18 year or not precised, 10 year
    if(!age || age >= 18){
        time = 10;
    //if less than 18 year but more than 3, 5 year
    } else if (age >= 3){
        time = 5;
    // if less than 3, 3 year
    } else {
        time = 3;
    }

    // For simplicity, we consider the current day to 1 january 2025
    let current_year = 2025;
    let oldest_day_possible;
    let current_day;
    if (expired && expired === true){
        //if expired, the start day must be before the number of year
        oldest_day_possible = new Date("01-01-" + (current_year-time-Math.floor(random_value_between(1,10))).toString()).getTime();
        current_day = new Date("01-01-" + (current_year-time).toString()).getTime();
    } else {
        oldest_day_possible = new Date("01-01-" + (current_year-time).toString()).getTime();
        current_day = new Date("01-01-" + (current_year).toString()).getTime();    
    }


    let issuance_date = new Date(random_value_between(current_day,oldest_day_possible));
    let expiration_date = new Date(issuance_date);
    //The expiration date is time an 1 day after the issuance date
    expiration_date.setFullYear(expiration_date.getFullYear()+ time)
    expiration_date.setDate(expiration_date.getDate()+1);

    return {time: time,
         issuance_date: issuance_date.getTime(),
         expiration_date:expiration_date.getTime()
    };
}


export function get_zla_code_identity_card(documentNumber:string, birth_date:number, gender:string, expiration_date:number, first_name:string, last_name:string){
    // First Line
    let firstLine = "ID"+"CHE"+documentNumber
    for (let i = documentNumber.length; i< 9; i++){
        firstLine += "<"
    }
    firstLine += get_control_number(firstLine.slice(5,14))
    for (let i = firstLine.length; i< 30; i++){
        firstLine += "<"
    }
    // Second Line
    let birth_d = new Date(birth_date).toLocaleDateString().split("/");
    let exp_d = new Date(expiration_date).toLocaleDateString().split("/");
    let secondLine = ""+birth_d[2].slice(2,4)
    secondLine += birth_d[0].length === 2 ? birth_d[0]: "0"+birth_d[0];
    secondLine += birth_d[1].length === 2 ? birth_d[1]: "0"+birth_d[1];
    secondLine+=get_control_number(secondLine);
    secondLine+=gender+exp_d[2].slice(2,4);
    secondLine += exp_d[0].length === 2 ? exp_d[0]: "0"+exp_d[0];
    secondLine += exp_d[1].length === 2 ? exp_d[1]: "0"+exp_d[1];
    secondLine+=get_control_number(secondLine.slice(8,15))+"CHE"
    for (let i = secondLine.length; i< 29; i++){
        secondLine += "<"
    }
    secondLine+=get_control_number(firstLine.slice(5)+ secondLine.slice(0,7)+secondLine.slice(8,15)+secondLine.slice(18,29))
    
    // Last Line
    let f_name = first_name.normalize("NFD").replace(/[ -]/g, "<").replace(/[\u0300-\u036f'.,]ß/g, "").toUpperCase()
    let l_name = last_name.normalize("NFD").replace(/[ -]/g, "<").replace(/[\u0300-\u036f'.,]/g, "").toUpperCase()
    let thirdLine = l_name + "<<" +f_name
    for (let i = thirdLine.length; i< 30; i++){
        thirdLine += "<"
    }
    return firstLine + "\n" + secondLine + "\n" + thirdLine.slice(0,31);
}

/*
*
*       Driving Licence Generation Function
* 
*/

export function get_zla_code_driving_license(documentNumber:string, birth_date:number, first_name:string, last_name:string){
    // First Line
    let firstLine = get_random_letters(3) 
        + get_random_number(1000).toString().padStart(3, "0") 
        + get_random_letters(1,"DFIR")
        + "<<"


    // Second Line
    let secondLine = "FA"+"CHE"+documentNumber+"<<"
    let birth_d = new Date(birth_date).toLocaleDateString().split("/");
    secondLine += birth_d[2].slice(2,4)
    secondLine += birth_d[0].length === 2 ? birth_d[0]: "0"+birth_d[0];
    secondLine += birth_d[1].length === 2 ? birth_d[1]: "0"+birth_d[1];
    for (let i = secondLine.length; i< 29; i++){
        secondLine += "<"
    }
    
    // Last Line
    let f_name = first_name.normalize("NFD").replace(/[ -]/g, "<").replace(/[\u0300-\u036f'.,]ß/g, "").toUpperCase()
    let l_name = last_name.normalize("NFD").replace(/[ -]/g, "<").replace(/[\u0300-\u036f'.,]/g, "").toUpperCase()
    let thirdLine = l_name + "<<" +f_name
    for (let i = thirdLine.length; i< 30; i++){
        thirdLine += "<"
    }
    return firstLine + "\n" + secondLine + "\n" + thirdLine.slice(0,31);
}

export function get_random_age_driving_license(table?:string[], total_value?:number, relative_min_date= new Date("1-1-1920").getTime()){

    // Recover the correct percentage, using the general one if no gender precised

    let new_table:string[];
    let new_total_value:number
    if (!table || !total_value){
        let temp = get_row_table_from_csv("stat/age_gender_driving_license.csv", 8);
        new_table = temp.table
        new_total_value = temp.total_value
    } else {
        new_table = table
        new_total_value = total_value
    }
    let age_interval = get_probabilities_from_array(new_total_value, new_table);

    // As we have only interval of age, we choose randomly and uniformly one age in it.
    let intevals = [[15,17],[18,24],[25,44],[45,64],[65,74],[75,100]]

    let age = Math.floor(random_value_between(intevals[age_interval][0],intevals[age_interval][1]))



    // After generating the age, we must generate the date of birth. 
    // A date is randomly selected and in an uniform way to correspond to the age
    // For simplicity, we consider the current day to 1 january 2025
    let current_year = 2025;
    let oldest_day = new Date("01-01-" + (current_year-age).toString()).getTime();
    let newset_day = new Date("02-01-" + (current_year-1-age).toString()).getTime();
    return {age: age,
         birth_date: new Date(random_value_between(newset_day,oldest_day)).getTime() - relative_min_date}
}

export function get_random_issuance_date_driving_license(birthday: number, max_age:number, min_age:number, table?:string[], total_value?:number,  current_date = new Date("1-1-2025").getTime()){
    let intevals = [[15,17],[18,24],[25,44],[45,64],[65,74],[75,100]]
    // Recover the correct percentage, using the general one if no gender precised

    let selected_table:string[];
    let new_total_value:number
    if (!table || !total_value){
        let temp = get_row_table_from_csv("stat/age_gender_driving_license.csv", 8,1,1);
        selected_table = temp.table
        new_total_value = temp.total_value
    } else {
        selected_table = table
        new_total_value = total_value
    }
    let new_intervals: any[] =[]
    let new_table: string[] = [];
    intevals.forEach((x,i) => {
        if ((x[0] <= max_age && x[1] >=  min_age)){
            new_intervals.push(x)
            new_table.push(selected_table[i])
        } else {
            new_total_value -=parseInt(selected_table[i]);
        }
    })
    let age_interval = new_intervals[get_probabilities_from_array(new_total_value, new_table)];

    if (age_interval[1] > max_age){
        age_interval[1] = max_age;
    }
    if (age_interval[0] < min_age){
        age_interval[0] = min_age;
    }

    // As we have only interval of age, we choose randomly and uniformly one age in it.
    let issuance_age = Math.floor(random_value_between(age_interval[0],age_interval[1]))
    return getRandomDateForAge(birthday,current_date,issuance_age)
}


module.exports= {
    get_random_values_from_array,
    string_to_bytes,
    get_control_number,
    get_control_number_AVS,
    get_random_height,
    get_random_AVS_number,
    get_random_start_and_expiration_date_identity_card,
    get_random_age_identity_card,
    get_random_age_driving_license,
    get_random_gender,
    gaussian_random,
    get_probabilities_from_array,
    get_random_number,
    get_column_table_from_csv,
    get_random_value_from_array,
    get_random_first_name,
    get_zla_code_identity_card,
    get_row_table_from_csv,
    get_random_image_byte_array,
    get_random_image_signature,
    random_value_between,
    getRandomDateForAge,
    get_random_issuance_date_driving_license,
    get_zla_code_driving_license
}
