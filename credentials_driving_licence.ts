import { CredentialSchema} from '@docknetwork/crypto-wasm-ts'
import {get_random_issuance_date_driving_license, getRandomDateForAge,random_value_between, 
    get_random_image_signature,get_random_image_byte_array, get_row_table_from_csv, get_zla_code_driving_license,
    get_random_first_name,get_column_table_from_csv, get_random_value_from_array, get_random_number, 
     get_random_age_driving_license, get_probabilities_from_array } from './utils';
import moment from 'moment';
const last_name_rows = get_column_table_from_csv("stat/last_name.csv", 0, 6);
const origin_autority_rows = get_column_table_from_csv("stat/Cantons.csv", 1, 1);
const male_rows = get_column_table_from_csv("stat/first_name.csv", 1, 6)
const female_rows = get_column_table_from_csv("stat/first_name.csv", 0, 6)
const total_population =get_row_table_from_csv("stat/output_age.csv", 1).total_value;
const age_A_rows = get_row_table_from_csv("stat/age_gender_driving_license.csv", 8, 1, 1);
const age_B_rows = get_row_table_from_csv("stat/age_gender_driving_license.csv", 4, 1, 1);
const gender_A_rows= get_row_table_from_csv("stat/age_gender_driving_license.csv", 6, 1, 1);
const gender_B_rows = get_row_table_from_csv("stat/age_gender_driving_license.csv", 2, 1, 1);
const new_driver_age_A_rows =  get_row_table_from_csv("stat/age_gender_driving_license.csv", 12, 1, 1);
const new_driver_age_B_rows =  get_row_table_from_csv("stat/age_gender_driving_license.csv", 16, 1, 1);
const current_date = new Date("1-1-2025").getTime()
const relative_min_date= new Date("1-1-1920").getTime()

function get_schema_add_information(num_additional_info:number){
    return {type:'array', items: Array.from({ length: num_additional_info }, (_, i) => ({type:"string"}))}
}

function get_schema_category(num_additional_info:number) {
  return {
        type:'object',
        properties:{
            categoryName:{ title: 'Name of the license category', type: 'string' },
            issuanceDate :{ title: 'Date of issuance', type: 'integer'},
            expirationDate :{ title: 'Date of expiration', type: 'string'},
            addInfo :get_schema_add_information(num_additional_info)
        }
    }
}

function get_schema_categories_array(num_categories: number, num_additional_infos:number[]) {
    return {type:'array', items: Array.from({ length: num_categories }, (_, i) => (get_schema_category(num_additional_infos[i])))}
}


export function get_driving_license_schema(num_categories: number, num_additional_infos_categories:number[], num_additional_info:number) {
    return {
        $schema: 'http://json-schema.org/draft-07/schema#',
        $id: 'https://ld.dock.io/examples/resident-card-schema.json',
        title: 'Identity Card Example',
        type: 'object',
        properties: {
          credentialSubject: {
            type: 'object',
            properties: {
                firstName: { title: 'Given Name', type: 'string' },
                lastName: { title: 'Family Name', type: 'string' },
                image: { title: 'Biometric Image', type: 'string' },
                autority: { title: 'autority', type: 'string'},
                signImage: { title: 'Signature Image', type: 'string'},
                issuanceDate : { title: 'Date of issuance', type: 'integer'},
                expirationDate : { title: 'Date of expiration', type: 'string'},
                birthDate: { title: 'Date of Birth', type: 'integer'},
                nationality: { title: 'Nationality', type: 'string'},
                code: { title: 'Country Code', type: 'string'},
                documentNumber: { title: 'Document Number', type: 'string'},
                zla: { title: 'ZLA Code', type: 'string'},
                categories: get_schema_categories_array(num_categories, num_additional_infos_categories),
                add_info: get_schema_add_information(num_additional_info),
            },
            required: []
          },
          cryptoVersion: { type: 'string' },
          credentialSchema: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              version: { type: 'string' },
              details: { type: 'string' },
            }
          },
          proof: CredentialSchema.essential().properties.proof,
          '@context': {
            type: 'array',
            items: [{ type: 'string' }, { type: 'string' }, { type: 'string' }]
          },
          id: { type: 'string' },
          type: {
            type: 'array',
            items: [{ type: 'string' }, { type: 'string' }]
          },
          issuer: {
            type: 'object',
            properties:{
                id: { type: 'string' },
                image: { type: 'string' },
            }
          },
          name: { type: 'string' },
          description: { type: 'string' }
        }
      };

}

export function get_driving_license_attributes(){
    // As the first category obtained in a driving license is generally either A or B
    // (And as we have the obtention statistics of these two categories)
    // We choose randomly one of them to generate afterward the age and the gender
    let gender:string;
    let age;
    let issuance_date;
    let additionalInformationCategories:any = {};
    let emptyCategory = {
        expirationDate: "**********",
        issuanceDate: 0,
        addInfo: []
    }
    // A
    if(Math.floor(Math.random() * 2) == 1){
        gender = get_probabilities_from_array(gender_A_rows.total_value, gender_A_rows.table) === 0 ? "F": "M";
        age = get_random_age_driving_license(age_A_rows.table,age_A_rows.total_value, 0)
        if(age.age === 15){
            additionalInformationCategories["A1"] = {categoryName:"A1",...emptyCategory}
            additionalInformationCategories["A1"]["addInfo"] = ["45kmh"]
            let last_birthday = new Date(age.birth_date)
            last_birthday.setFullYear(new Date(current_date).getFullYear()-1)
            issuance_date = getRandomDateForAge(last_birthday.getTime(), current_date, 15)
            additionalInformationCategories["A1"]["issuanceDate"] = issuance_date

        } else if (age.age ===16 || age.age === 17) {
            additionalInformationCategories["A1"] = {categoryName:"A1",...emptyCategory}
            issuance_date = get_random_issuance_date_driving_license(age.birth_date,age.age,15, new_driver_age_A_rows.table, new_driver_age_A_rows.total_value, current_date)
            additionalInformationCategories["A1"]["issuanceDate"] = issuance_date
        } else {
            additionalInformationCategories["A"] = {categoryName:"A",...emptyCategory}
            issuance_date = get_random_issuance_date_driving_license(age.birth_date,age.age,18, new_driver_age_A_rows.table, new_driver_age_A_rows.total_value, current_date)
            additionalInformationCategories["A"]["issuanceDate"] = issuance_date

            // B
            // Only if A and 18 y.o
            // Percentage gender_B_rows.total_value/total_population
            if(Math.random() < (gender_B_rows.total_value/total_population)){
                additionalInformationCategories["B"] = {categoryName:"B",...emptyCategory}
                additionalInformationCategories["B"]["issuanceDate"] = get_random_issuance_date_driving_license(age.birth_date,age.age,18, new_driver_age_B_rows.table, new_driver_age_B_rows.total_value, current_date)
            }
        }

    // B
    } else {
        gender =get_probabilities_from_array(gender_B_rows.total_value, gender_B_rows.table) === 0 ? "F": "M";
        age = get_random_age_driving_license(age_B_rows.table,age_B_rows.total_value, 0)
        additionalInformationCategories["B"] = {categoryName:"B",...emptyCategory}
        issuance_date = get_random_issuance_date_driving_license(age.birth_date,age.age,18, new_driver_age_B_rows.table, new_driver_age_B_rows.total_value, current_date)
        additionalInformationCategories["B"]["issuanceDate"] = issuance_date
        // A
        // Only if B
        // Percentage gender_A_rows.total_value/total_population
        if(Math.random() < (gender_A_rows.total_value/total_population)){
            additionalInformationCategories["A"] = {categoryName:"A",...emptyCategory}
            additionalInformationCategories["A"]["issuanceDate"] = get_random_issuance_date_driving_license(age.birth_date,age.age,18, new_driver_age_A_rows.table, new_driver_age_A_rows.total_value, current_date)
        }
    }


    // General issuance day
    // When the identity obtained the driving license
    // Use statistic of the new drivers for the age they have obtained it (if the value is higher than their current age...redo it ? No, use a smaller table)
    // age give the category array, can't use category higher....need to change the total value corresponding to it
    // After having the category, check if the current age is inside, if yes, adjust the category, if the age is equal to the smaller value, use the smaller value
    // choose a random date in the year between two birthday, or a date between the last birthday and the current date (1-1-2025)
    // Minimum age for each category (18 for A, 15 for A1, 18 for B)
    // If A1, only 15, 16 or 17, no need to make the random selection fo categories


    // Categories issuance day

    // A, A1 and B have the general issuance date (first one)
    // second A and B can be anywhere in the years

    // C must be after B
    // C1 must be after B
    // D must be after 21 y.o AND (2 year after B or 3 month after C, wichever is the latest)
    // D1 must be after 21 y.o
    // E must be after B. 
    //      All categories before the general issuance date of their E counterpart 
    //          => E counterpart have the general issuance date
    //      All catégories after => E counterparts have their issuance date




    if("B" in additionalInformationCategories){
        // C
        // Only if B
        // Percentage...10% ?
        // Remove C1
        if(Math.random() < 0.10){
            additionalInformationCategories["C"] = {categoryName:"C",...emptyCategory}
            additionalInformationCategories["C"]["issuanceDate"] = random_value_between(additionalInformationCategories["B"]["issuanceDate"],current_date)
        }

        // D
        // Only if B for 2 year or C for three month and + 21y.o
        // Give TTP
        // Percentage...10% ?
        // Remove D1 and C1
        if(age.age >= 21 
            && (
                (moment(additionalInformationCategories["B"]["issuanceDate"]).diff(moment(current_date), "years") > 2) 
                || ( 
                    ("C" in additionalInformationCategories)
                    && (moment(additionalInformationCategories["C"]["issuanceDate"]).diff(moment(current_date), "month") > 3
                )))
            && Math.random() < 0.10) {
            additionalInformationCategories["D"] = {categoryName:"D",...emptyCategory}


            if(!("C" in additionalInformationCategories) || additionalInformationCategories["B"]["issuanceDate"] < additionalInformationCategories["C"]["issuanceDate"]){
                // shift the b isuance date to 2 year
                // Change the day of issuance to after 21 y.o if it is not
                // Random value 
                let min_issuance_date = new Date(additionalInformationCategories["B"]["issuanceDate"])
                min_issuance_date.setFullYear(min_issuance_date.getFullYear()+2)
                let diff_age = moment(min_issuance_date).diff(moment(age.birth_date), "years")
                if(diff_age<21){
                    min_issuance_date.setFullYear(min_issuance_date.getFullYear() + (21-diff_age))
                }
                additionalInformationCategories["D"]["issuanceDate"] = random_value_between(min_issuance_date.getTime(),current_date)
            } else {
                // shift the C isuance date to 3 month
                // Change the day of issuance to after 21 y.o
                // Random value 
                let min_issuance_date = new Date(additionalInformationCategories["C"]["issuanceDate"])
                min_issuance_date.setMonth(min_issuance_date.getMonth()+3)
                let diff_age = moment(min_issuance_date).diff(moment(age.birth_date), "years")
                if(diff_age<21){
                    min_issuance_date.setFullYear(min_issuance_date.getFullYear() + (21-diff_age))
                }
                additionalInformationCategories["D"]["issuanceDate"] = random_value_between(min_issuance_date.getTime(),current_date)
            }
        }

        // D1
        // Only if B and 21y.o
        // Give TTP
        // Percentage...10% ?
        // Remove C1
        if(!("D" in additionalInformationCategories) && age.age >= 21 && Math.random() < 0.10){
            additionalInformationCategories["D1"] = {categoryName:"D1",...emptyCategory}
            // Change the day of issuance to after 21 y.o
            // Random value 
            let min_issuance_date = new Date(additionalInformationCategories["B"]["issuanceDate"])
            let diff = moment(min_issuance_date).diff(moment(age.birth_date), "years")
            if(diff<21){
                min_issuance_date.setFullYear(min_issuance_date.getFullYear() + (21-diff))
            }
            additionalInformationCategories["D1"]["issuanceDate"] = random_value_between(min_issuance_date.getTime(),current_date)
        }

        // C1
        // Only if B
        // Percentage...10% ?
        if(!("C" in additionalInformationCategories) && Math.random() < 0.10 ){
            additionalInformationCategories["C1"] = {categoryName:"C1",...emptyCategory}
            additionalInformationCategories["C1"]["issuanceDate"] = random_value_between(additionalInformationCategories["B"]["issuanceDate"],current_date)
        }

        // E
        // Give an E category to each B, C, C1, D, and D1
        // Percentage...10% ?
        if(Math.random() < 0.10 ){
            //Generate random basic issuance date
            let general_E_issuance_date = random_value_between(additionalInformationCategories["B"]["issuanceDate"],current_date)
            Object.keys(additionalInformationCategories)
                .filter((x)=> !/[A]/.test(x))
                .forEach((x)=> {
                    additionalInformationCategories[`${x}E`] = {categoryName:`${x}E`,...emptyCategory}
                    if (additionalInformationCategories[x]["issuanceDate"] > general_E_issuance_date){
                        additionalInformationCategories[`${x}E`]["issuanceDate"] = additionalInformationCategories[x]["issuanceDate"]
                    } else {
                        additionalInformationCategories[`${x}E`]["issuanceDate"] = current_date
                    }
                    
                
                })
        }
    }


    // A1
    // Not present except at the initialisation, If A or B, A1 not present

    // B1
    // Only if only A1, but A1 is only present under 18 y.o, so never




    // After categories and issuance date, additional information

    // A1 DONE
    // Only 45kmh, only if 15 y.o, added at the beginning

    // A 
    // Have 35kw if before 2 y.o of the issuance date

    if(("A" in additionalInformationCategories) 
        && moment(additionalInformationCategories["A"]["issuanceDate"]).diff(moment(current_date), "years") < 2){
        additionalInformationCategories["A"]["addInfo"] = ["35kw"]
    }
    
    // B
    // 121: TTP, for passenger (1% and 19 y.o.)
    // 122: Ambulance, only of 121 beforehand, remove 121 (50% of 121)
    // 108: 100% if 122, 0.1% if not (for doctor)
    if(("B" in additionalInformationCategories)){
        if (age.age >= 19 && Math.random() < 0.01){
            additionalInformationCategories["B"]["addInfo"] = ["121"]
        }
        if ("121" in additionalInformationCategories["B"]["addInfo"] && Math.random() < 0.5){
            additionalInformationCategories["B"]["addInfo"] = ["122", "108"]
        } else if (Math.random() < 0.001){
            additionalInformationCategories["B"]["addInfo"].push("108")
        }
    }

    // C1
    // 121: TTP, for passenger (1% and 19 y.o.)
    // 122: Ambulance, only of 121 beforehand, remove 121 (50%)
    // 109: small fire engine (5%)
    // 118: any kind fire engine (2,5%)
    if(("C1" in additionalInformationCategories)){
        if (age.age >= 19 && Math.random() < 0.01){
            if (Math.random() < 0.5){
                additionalInformationCategories["C1"]["addInfo"] = ["122"]
            } else {
                additionalInformationCategories["C1"]["addInfo"] = ["121"]
            }
        }
        if (Math.random() < 0.05){
            additionalInformationCategories["C1"]["addInfo"].push("109")
        } 
        if (Math.random() < 0.025){
            additionalInformationCategories["C1"]["addInfo"].push("118")
        }
    }

    // C1E:
    // 109: small fire engine (5%)
    if(("C1E" in additionalInformationCategories)){
        if (Math.random() < 0.05){
            additionalInformationCategories["C1E"]["addInfo"].push("109")
        } 
    }

    // D
    // 107: Limited to scheduled regional service. 5%
    if(("D" in additionalInformationCategories)){
        if (Math.random() < 0.05){
            additionalInformationCategories["D"]["addInfo"].push("107")
        } 
    }

    // D1
    // 3.5t: limited to minibus without TTP (1%)
    // 106: more than 17 seats, without TTP (1%)
    if(("D1" in additionalInformationCategories)){
        if (Math.random() < 0.01){
            additionalInformationCategories["D1"]["addInfo"].push("3.5t")
        }
        if (Math.random() < 0.01){
            additionalInformationCategories["D1"]["addInfo"].push("3.5t")
        } 
    }
    // BE, C, CE, DE
    // No additional informations


    //Other additional informations
    let additionalInformation = [];
    // 201 Driving instructor category I (light motor vehicles) (1%)
    // 202 Driving instructor category II (heavy motor vehicles) (1%)
    // 203 Driving instructor category III (theory) (1%)
    // 204 Driving instructor category IV (motorcycles) (1%)
    if (Math.random() < 0.01){
        additionalInformation.push("201")
    }
    if (Math.random() < 0.01){
        additionalInformation.push("202")
    } 
    if (Math.random() < 0.01){
        additionalInformation.push("203")
    } 
    if (Math.random() < 0.01){
        additionalInformation.push("204")
    } 

    // 101 Special conditions (1%)
    // 110 Entitled to drive trolleybuses (1%)
    // 111 Must carry the foreign driving licence (2%)
    // 9XX Additional information to replace the military driving licence (3%)
    if (Math.random() < 0.01){
        additionalInformation.push("101")
    }
    if (Math.random() < 0.01){
        additionalInformation.push("110")
    } 
    if (Math.random() < 0.02){
        additionalInformation.push("111")
    } 
    if (Math.random() < 0.03){
        additionalInformation.push("9XX")
    } 

    // 01 Sight correction (get precentage stat) (Subcode not obligatory)
    // 02 Hearing correction (get precentage stat) (Subcode not obligatory)
    if (Math.random() < 0.01){
        additionalInformation.push("101")
    }
    if (Math.random() < 0.01){
        additionalInformation.push("110")
    } 

    // 03 Prosthesis/orthosis for the limbs (0,1%)
    if (Math.random() < 0.001){
        additionalInformation.push("03")
    }

    // 04 Must carry a valid medical certificate (1%)
    if (Math.random() < 0.01){
        additionalInformation.push("04")
    } 

    // 50 (..) Restricted to a specific vehicle/chassis number (vehicle identification number, VIN) (1%, random value of 20 number)
    // 51 (..) Restricted to a specific vehicle/registration plate (vehicle registration number, VRN) (1%, random value of 20 number)
    if (Math.random() < 0.01){
        additionalInformation.push(`50.${get_random_number(10**10).toString().padStart(9, "0")}`)
    } else if ((Math.random() < 0.01)){
        additionalInformation.push(`51.${get_random_number(10**10).toString().padStart(9, "0")}`)
    }

    // 70 (..) Exchange of driving licence issued by a third country (EU/UN distinguishing sign) (1%) 
    // 71 (..) Duplicate of licence No … (EU/UN distinguishing sign in the case of a third country; e.g.: 71.987654321.HR) (1%, random value of 10 number)
    // 78 Restricted to vehicles with automatic transmission (1%)
    if (Math.random() < 0.01){
        additionalInformation.push(`70.${get_random_number(10**10).toString().padStart(9, "0")}`)
    } else if ((Math.random() < 0.01)){
        additionalInformation.push(`71.${get_random_number(10**10).toString().padStart(9, "0")}`)
    }

    if ((Math.random() < 0.01)){
        additionalInformation.push(`78`)
    }

    // 20 Modified braking systems (0.1%) (Subcode not obligatory)
    // 25 Modified accelerator systems (0.1%)(Subcode not obligatory)
    // 30 Modified combined braking and accelerator systems(0.1%) (Subcode not obligatory)
    // 35 Modified control layout (0.1%)(Subcode not obligatory)
    // 40 Modified steering(0.1%) (Subcode not obligatory)
    // 42 Modified rear-view mirror(s)(0.1%)(Subcode not obligatory)
    // 43 Modified driver seat (0.1%)(Subcode not obligatory)
    if (Math.random() < 0.001){
        additionalInformation.push("20")
    }
    if (Math.random() < 0.001){
        additionalInformation.push("25")
    } 
    if (Math.random() < 0.001){
        additionalInformation.push("30")
    } 
    if (Math.random() < 0.001){
        additionalInformation.push("35")
    }
    if (Math.random() < 0.001){
        additionalInformation.push("40")
    }
    if (Math.random() < 0.001){
        additionalInformation.push("42")
    }
    if (Math.random() < 0.001){
        additionalInformation.push("43")
    }

    // As we need positive values for any issuance date, 
    // we shift their values
    Object.keys(additionalInformationCategories).forEach((x)=> {
        additionalInformationCategories[x]["issuanceDate"] -= relative_min_date
        // The library does not accept empty array, so we must add a dummy value
        if(additionalInformationCategories[x]["addInfo"].length === 0){
            additionalInformationCategories[x]["addInfo"] = ["Null"]
        }
    })


    // The library does not accept empty array, so we must add a dummy value
    if(additionalInformation.length === 0){
        additionalInformation = ["Null"]
    }

    let first_name =get_random_first_name(gender, male_rows, female_rows)
    let last_name = get_random_value_from_array(last_name_rows)
    let documentNumber = get_random_number(10**10).toString().padStart(9, "0") + "002"

    let credential = {
        '@context': [
            'https://www.w3.org/2018/credentials/v1',
            'https://w3id.org/citizenship/v1',
            'https://ld.dock.io/security/bbs/v1'
        ],
        id: 'https://issuer.oidp.uscis.gov/credentials/'+documentNumber,
        type: ['VerifiableCredential', 'PermanentDrivingLicense'],
        issuer: {
            "id": "did:web:credentials.switzerland.example",
            "image": "data:image/png;base64,iVBORw0KGgo...YII="
            },
        name: 'Swiss Driving License',
        description: 'Swiss Confederation Driving License',
        credentialSubject: {
            firstName: first_name,
            lastName: last_name,
            birthDate: age.birth_date-relative_min_date, // DONE
            issuanceDate :issuance_date-relative_min_date, //DONE
            expirationDate :"**********", // DONE
            autority: get_random_value_from_array(origin_autority_rows), //(Only Canton) DONE
            documentNumber: documentNumber, //DONE
            signImage:  get_random_image_signature(age.age),
            categories: Object.values(additionalInformationCategories), //DONE TODO issuance Date
            add_info: additionalInformation, // DONE
            image:  get_random_image_byte_array(),
            nationality: "Schweiz - Suisse - Svizzera - Svizra - Switzerland",
            code: "CHE",
            zla: get_zla_code_driving_license(documentNumber,age.birth_date,first_name,last_name), // DONE
        }
    }

    // Create the schema, based on the size of the credentials
    let num_additional_infos_categories:number[] = [];
    Object.keys(additionalInformationCategories).forEach((x:any) => {
        num_additional_infos_categories.push(additionalInformationCategories[x]["addInfo"].length)
    })

    let schema = get_driving_license_schema(Object.keys(additionalInformationCategories).length,num_additional_infos_categories,additionalInformation.length)
    
    return {
        credential : credential, 
        num_categories : Object.keys(additionalInformationCategories).length, 
        num_additional_infos_categories : num_additional_infos_categories, 
        num_additional_infos : additionalInformation.length
    }
}

module.exports= {
    get_driving_license_schema,
    get_driving_license_attributes
}



