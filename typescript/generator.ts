import { initializeWasm, BBSKeypair, BBSSignatureParams, BBS_SIGNATURE_PARAMS_LABEL_BYTES,
    CredentialSchema, BBSCredentialBuilder, BBSCredential, PresentationBuilder, BoundCheckBppParams,
    BBSPublicKey 
    } from '@docknetwork/crypto-wasm-ts'

import {get_driving_license_attributes,get_driving_license_schema} from "./credentials_driving_licence"
import {get_identity_card_attributes, get_identity_card_schema} from "./credentials_identity_card"
import {string_to_bytes, get_random_values_from_array} from "./utils"

import { parse } from 'csv-parse/sync';
import * as path from "path";
import * as fs from "fs";

export enum TypeCredential{
    DrivingLicence,
    IdentityCard
}

export enum TypeProof{
    Random,
    ExpirationDate, // Only for the Identity Card, as expiration date in driving license are always "*********"
    IssuanceDate,
}

// Generation of the identities
export function generate_attributes(type:TypeCredential, number_identities = 100, seed = "seed1", output_path ="credentials/identity_attributes.csv") {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;


    let headers = [
        {id: "id", title: "Personal Number"},
        {id: "data", title: "JSON information"}, 
        {id: "public", title: "Public Key"}, 
        {id: "secret", title: "Secret Key"}
    ]

    // If the identity type is for driving licenses, we need to add the number of attributes to the data stored.
    if (type === TypeCredential.DrivingLicence){
        headers = headers.concat([
            {id:"num_categories", title: "Number of categories"}, 
            {id:"num_additional_infos_categories",  title: "Number of additional inforations of each categories"}, 
            {id:"num_additional_infos", title: "Number of general additional informations"}
        ])
    }

    // Used to avoid issues with the output path names
    if(output_path.includes(".csv")){
        output_path = output_path.slice(0,-4)+ ((type === TypeCredential.DrivingLicence) ? "_driving_license.csv" : "_identity_card.csv")
    } else {
        output_path += ((type === TypeCredential.DrivingLicence) ? "_driving_license.csv" : "_identity_card.csv")
    }
    console.log(output_path)

    let csv_writer = createCsvWriter({
        path: output_path,
        header: headers
    });
    initializeWasm().then(() => {
        // Generation of the keys used for the generation of the proofs, will be used in the other functions.
        const params = BBSSignatureParams.generate(100, BBS_SIGNATURE_PARAMS_LABEL_BYTES);
        const keypair = BBSKeypair.generate(params, string_to_bytes(seed));
        const secret_key = keypair.secretKey;
        const public_key = keypair.publicKey;
        // Get out the table that will be reused each time to speed up the creation of data
        Promise.all(
            Array.from({ length: number_identities}, async (_, i) => {
            // Generate a random identity
            const unsigned_cred:any = (type === TypeCredential.DrivingLicence) ? get_driving_license_attributes() : get_identity_card_attributes();
            // Store it
            let result = {
                id:i, 
                data:JSON.stringify(unsigned_cred.credential), 
                public: JSON.stringify(public_key), 
                secret: JSON.stringify(secret_key)
            };
            if (type === TypeCredential.DrivingLicence){
                let new_result = {
                    num_categories: unsigned_cred["num_categories"],
                    num_additional_infos_categories: unsigned_cred["num_additional_infos_categories"],
                    num_additional_infos: unsigned_cred["num_additional_infos"],
                    ...result
                }
                result = new_result
            }
            return result;
        })).then(rows => {
            csv_writer.writeRecords(rows)
            console.log(`${number_identities} ${((type === TypeCredential.DrivingLicence) ? "driving license" : "identity card")} Identities generated and stored in ${output_path}. Please rerun this code to generate the credentials.`)
        })
    })
    return output_path;
}



// Generation of Credentials
export function generate_credentials(
        type:TypeCredential, 
        input_path:string, 
        number_credentials_for_each = 1, 
        output_path ="credentials/identity_credentials.csv")
    {

    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    let headers = [
        {id: "id", title: "Personal Number User"}, 
        {id: "cred_num", title: "Number of Holder Credential"},
        {id: "data", title: "JSON information"},
        {id: "public", title: "Public Key"}, 
        {id: "secret", title: "Secret Key"}
    ]
    if (type === TypeCredential.DrivingLicence){
        headers = headers.concat([
            {id:"num_categories", title: "Number of categories"}, 
            {id:"num_additional_infos_categories",  title: "Number of additional inforations of each categories"}, 
            {id:"num_additional_infos", title: "Number of general additional informations"}
        ])
    }

    // Used to avoid issues with the output path names
    if(output_path.includes(".csv")){
        output_path = output_path.slice(0,-4)+ ((type === TypeCredential.DrivingLicence) ? "_driving_license.csv" : "_identity_card.csv")
    } else {
        output_path += ((type === TypeCredential.DrivingLicence) ? "_driving_license.csv" : "_identity_card.csv")
    }
    
    let csv_writer = createCsvWriter({
        path: output_path,
        header: headers
    });

    initializeWasm().then(async () => {
        //Recovery of the identities
        const csv_file_path = path.resolve(__dirname, input_path);
        const file_content = fs.readFileSync(csv_file_path, { encoding: 'utf-8' });
        let result:string[][] = parse(file_content, {delimiter: ',',}).slice(1);
        for (let i = 0; i < result.length;i++) {
            let row = result[i]
            let rows_credentials:any[] = []
            let unsigned_cred = JSON.parse(row[1])
            let schema;
            // Recovery of the Schema used by the library
            if (type === TypeCredential.DrivingLicence){
                schema = get_driving_license_schema(parseInt(row[4]), row[5].split(",").map(x => parseInt(x)), parseInt(row[6]))
            } else {
                schema = get_identity_card_schema()
            }
            const cred_schema = new CredentialSchema(schema, {useDefaults : true});
            const builder = new BBSCredentialBuilder();
            builder.schema = cred_schema;
            builder.subject = unsigned_cred.credentialSubject;
            // Set the Context Part
            builder.setTopLevelField('@context', unsigned_cred['@context']);
            builder.setTopLevelField('id', unsigned_cred['id']);
            builder.setTopLevelField('type', unsigned_cred['type']);
            builder.setTopLevelField('name', unsigned_cred['name']);
            builder.setTopLevelField('description', unsigned_cred['description']);
            builder.setTopLevelField('issuer', unsigned_cred['issuer']);
            for (let j = 0; j< number_credentials_for_each; j++){
                // Generate the BBS signature for the credential
                const signed_credential = builder.sign(JSON.parse(row[3]));
                console.log(i, j)
                // Store the credential
                let result = {
                    id:i, 
                    cred_num:j,
                    data:JSON.stringify(signed_credential.toJSON()), 
                    public: row[2], 
                    secret: row[3]
                };
                if (type === TypeCredential.DrivingLicence){
                    let new_result = {
                        num_categories:row[4],
                        num_additional_infos_categories: row[5],
                        num_additional_infos: row[6],
                        ...result
                    }
                    result = new_result
                }
                rows_credentials.push(result)
            }
            await csv_writer.writeRecords(rows_credentials)
        }   
        console.log(`${result.length*number_credentials_for_each} ${((type === TypeCredential.DrivingLicence) ? "driving license" : "identity card")} Credentials generated and stored in ${output_path}. Please rerun this code to generate the proofs.`)
    })
    return output_path
}

// Generation Proof
export function generate_proof(
    type_credential:TypeCredential, 
    type_proof:TypeProof,
    input_path:string,
    number_proof_for_each_credentials = 10, 
    number_files= 10, 
    output_folder_path ="credentials/run")
{

    const createCsvWriter = require('csv-writer').createObjectCsvWriter;

    initializeWasm().then(async () => {

        let headers = [
            {id: "id", title: "Personal Number User"}, 
            {id: "cred_num", title: "Number of Holder Credential"},
            {id: "proof_num", title: "Number of the proof"},
            {id: "proof", title: "proof array"},
            {id: "public", title: "Public Key"}, 
            {id: "secret", title: "Secret Key"}
        ]

        if (type_credential === TypeCredential.DrivingLicence){
            headers = headers.concat([
                {id:"num_categories", title: "Number of categories"}, 
                {id:"num_additional_infos_categories",  title: "Number of additional inforations of each categories"}, 
                {id:"num_additional_infos", title: "Number of general additional informations"}
            ])
        }

        // Recovery of the credentials
        const csv_file_path = path.resolve(__dirname, input_path);
        const file_content = fs.readFileSync(csv_file_path, { encoding: 'utf-8' });
        let result:string[][] = parse(file_content, {delimiter: ',',}).slice(1);
        let keys:string[] = [];

        if(type_proof == TypeProof.Random){
            if(type_credential == TypeCredential.DrivingLicence){
                // As the number of attributes varies, we put the revealed value only in one column
                headers.push({id: "revealedAttributes", title: "Attributes Revealed"})
            } else {
                // As the atributes does not varies, each revealed attributes has a column
                keys = Object.keys(get_identity_card_schema().properties.credentialSubject.properties)
                let header_keys = keys.map((x)=> {return {id: x, title: x}})
                keys = keys.map((x) => `credentialSubject.${x}`)
                headers = headers.concat(header_keys)
            }
        }

        for(let t = 0; t < number_files; t++){
            let output_path = (
                output_folder_path
                + "/identity_proofs_" + 
                ((type_credential === TypeCredential.DrivingLicence) ? "driving_license_" : "identity_card_") 
                + t +
                ".csv")
            const csv_writer  = createCsvWriter({
                path: output_path,
                header: headers 
            });


            for (let i = 0; i < result.length;i++) {
                let row = result[i]
                let rows_proof:any[] = [];
                let signed_credential = BBSCredential.fromJSON(JSON.parse(row[2]))
                const presentation_builder = new PresentationBuilder();
                if(type_credential == TypeCredential.DrivingLicence){
                    presentation_builder.addCredential(signed_credential, new BBSPublicKey(JSON.parse(row[3]).value))
                } else {
                    presentation_builder.addCredential(signed_credential, new BBSPublicKey(JSON.parse(row[3]).value))
                }
                
                // Selection of the revealed attributes and the bounded range of the attributes
                const range_proof_param = new BoundCheckBppParams(string_to_bytes('Common Reference String')).decompress();
                let obj;
                if (type_proof == TypeProof.Random){
                    if(type_credential == TypeCredential.DrivingLicence){
                        //Change at each credential
                        keys = signed_credential.schema.flatten()[0].filter((x:any) => x.includes("credentialSubject"))
                    }
                    let selected_values = get_random_values_from_array(keys, Math.floor(Math.random() * (keys.length+ 1)))
                    obj = selected_values.reduce((o, key) => ({ ...o, [key]: (signed_credential.subject as Record<string, any>)[key]}), {})
                    presentation_builder.markAttributesRevealed(0,new Set(selected_values))
                } else if (type_proof == TypeProof.ExpirationDate){
                    let current_date = new Date("1-1-2025").getTime()
                    let max_expiration_date = new Date("1-1-2035").getTime();
                    const relative_min_date= new Date("1-1-1920").getTime()
                    presentation_builder.enforceBounds(0, 'credentialSubject.expirationDate', current_date - relative_min_date, max_expiration_date - relative_min_date, 'expirationCheck', range_proof_param);
                } else {
                    let current_date = new Date("1-1-2025").getTime()
                    const relative_min_date= new Date("1-1-1920").getTime()
                    presentation_builder.enforceBounds(0, 'credentialSubject.issuanceDate', 0, current_date - relative_min_date, 'expirationCheck', range_proof_param);
                }

                for (let j = 0; j< number_proof_for_each_credentials; j++){
                    // Generate the presentation with the proof
                    const presentation2 = presentation_builder.finalize();
                    // Store the presentation
                    let result = {
                        id:row[0], 
                        cred_num: row[1], 
                        proof_num:j, 
                        proof:presentation2.proof.bytes,
                        public: row[3], 
                        secret: row[4]
                    }
                    console.log(row[0], row[1], j);
                    if(type_credential == TypeCredential.DrivingLicence){
                        let new_result = {
                            num_categories:row[5],
                            num_additional_infos_categories: row[6],
                            num_additional_infos: row[7],
                            ...result}
                        result = new_result;
                    }

                    if(type_proof == TypeProof.Random){
                        if(type_credential == TypeCredential.DrivingLicence){
                            let new_result = {
                                revealedAttributes:JSON.stringify((presentation2.spec.credentials[0].revealedAttributes as any)["credentialSubject"]),
                                ...result
                            }
                            result = new_result;
                        } else {
                            let new_result = {...obj, ...result}
                            result = new_result;
                        }
                    }
                    rows_proof.push(result);
                }
                await csv_writer.writeRecords(rows_proof)
            }
            
        }
        console.log(`${result.length*number_proof_for_each_credentials*number_files} ${((type_credential === TypeCredential.DrivingLicence) ? "driving license" : "identity card")} proofs generated and stored in ${output_folder_path}. Please use the python codes present in the folder "python to continue".`)
    })

}

// Function used to generate large number of identities to analyse the variance of number of attributes.
export function generate_driving_license_attributes_statistics(number_identities = 100000, output_path ="credentials/identity_attributes_stat_driving_license.csv") {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;


    let headers = [
        {id:"id", title: "Personal Number"},
        {id:"number_attributes", title: "JSON information"}, 
        {id:"num_categories", title: "Number of categories"},
        {id:"categories", title: "Categories"}, 
        {id:"num_additional_infos_categories",  title: "Number of additional inforations of each categories"}, 
        {id:"num_additional_infos", title: "Number of general additional informations"}
    ]

    let csv_writer = createCsvWriter({
        path: output_path,
        header: headers
    });
    initializeWasm().then(async () => {
        for (let i = 0; i< number_identities; i++){
            const unsigned_cred:any = get_driving_license_attributes();
            let result = {
                id:i, 
                num_categories: unsigned_cred["num_categories"],
                num_additional_infos_categories: unsigned_cred["num_additional_infos_categories"],
                num_additional_infos: unsigned_cred["num_additional_infos"],
                number_attributes: 12+3*unsigned_cred["num_categories"]+(unsigned_cred["num_additional_infos_categories"].reduce((partialSum:number, a:number) => partialSum + a, 0)),
                categories: unsigned_cred["credential"]["credentialSubject"]["categories"].map((x:any)=> x["categoryName"])
            };
            await csv_writer.writeRecords([result])
            console.log(i)
        }
    })
    return output_path;
}


module.exports = {
    generate_attributes,
    generate_credentials,
    generate_proof,
    generate_driving_license_attributes_statistics,
    TypeCredential,
    TypeProof
}
