import { initializeWasm, BBSKeypair, BBSSignatureParams, BBS_SIGNATURE_PARAMS_LABEL_BYTES,
    CredentialSchema, BBSCredentialBuilder, BBSCredential, PresentationBuilder, BoundCheckBppParams,
    BBSPublicKey 
    } from '@docknetwork/crypto-wasm-ts'

import {get_driving_license_attributes,get_driving_license_schema} from "./credentials_driving_licence"
import {get_identity_card_attributes, get_identity_card_schema} from "./credentials_identity_card"
import {string_to_bytes, get_random_values_from_array} from "./utils"
import * as path from "path";
import { parse } from 'csv-parse/sync';
import * as fs from "fs";

// Generation Attributes

export enum TypeCredential{
    DrivingLicence,
    IdentityCard
}

export enum TypeProof{
    Random,
    ExpirationDate, // Only for the Identity Card, as expiration date in driving license are always "*********"
    IssuanceDate,
}

export function generate_attributes(type:TypeCredential, number_identities = 10000,seed = "seed1", output_path ="credentials/identity_attributes.csv") {
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;


    let headers = [
        {id: "id", title: "Personal Number"},
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
        const params = BBSSignatureParams.generate(100, BBS_SIGNATURE_PARAMS_LABEL_BYTES);
        const keypair = BBSKeypair.generate(params, string_to_bytes(seed));
        const secretKey = keypair.secretKey;
        const publicKey = keypair.publicKey;
        // Get out the table that will be reused each time to speed up the creation of data
        Promise.all(
            Array.from({ length: number_identities}, async (_, i) => {
            const unsignedCred:any = (type === TypeCredential.DrivingLicence) ? get_driving_license_attributes() : get_identity_card_attributes();
            let result = {
                id:i, 
                data:JSON.stringify(unsignedCred.credential), 
                public: JSON.stringify(publicKey), 
                secret: JSON.stringify(secretKey)
            };
            if (type === TypeCredential.DrivingLicence){
                let new_result = {
                    num_categories: unsignedCred["num_categories"],
                    num_additional_infos_categories: unsignedCred["num_additional_infos_categories"],
                    num_additional_infos: unsignedCred["num_additional_infos"],
                    ...result
                }
                result = new_result
            }
            return result;
        })).then(rows => {
            csv_writer.writeRecords(rows)
        })
    })
    return output_path;
}



// Generation Credentials

export function generate_credentials(
        type:TypeCredential, 
        input_path:string, 
        number_credentials_for_each = 5, 
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
        //recovery of the informations
        const csvFilePath = path.resolve(__dirname, input_path); // "credentials/identity_information.csv"
        const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
        let result:string[][] = parse(fileContent, {delimiter: ',',}).slice(1);
        for (let i = 0; i < result.length;i++) {
            let row = result[i]
            let rows_credentials:any[] = []
            let unsignedCred = JSON.parse(row[1])
            let schema;
            if (type === TypeCredential.DrivingLicence){
                schema = get_driving_license_schema(parseInt(row[4]), row[5].split(",").map(x => parseInt(x)), parseInt(row[6]))
            } else {
                schema = get_identity_card_schema()
            }
            const credSchema2 = new CredentialSchema(schema, {useDefaults : true});
            const builder = new BBSCredentialBuilder();
            builder.schema = credSchema2;
            builder.subject = unsignedCred.credentialSubject;
            builder.setTopLevelField('@context', unsignedCred['@context']);
            builder.setTopLevelField('id', unsignedCred['id']);
            builder.setTopLevelField('type', unsignedCred['type']);
            builder.setTopLevelField('name', unsignedCred['name']);
            builder.setTopLevelField('description', unsignedCred['description']);
            builder.setTopLevelField('issuer', unsignedCred['issuer']);
            for (let j = 0; j< number_credentials_for_each; j++){
                const verifiableCredential = builder.sign(JSON.parse(row[3]));
                console.log(i, j)
                let result = {
                    id:i, 
                    cred_num:j,
                    data:JSON.stringify(verifiableCredential.toJSON()), 
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
    })
    return output_path
}

// Generation Proof
export function generate_proof(
    type_credential:TypeCredential, 
    type_proof:TypeProof,
    input_path:string,
    number_proof_for_each_credentials = 5, 
    number_files= 100, 
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


    //recovery of the informations
    const csvFilePath = path.resolve(__dirname, input_path);
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    // TODO: Add management of the credentials per identity
    let result:string[][] = parse(fileContent, {delimiter: ',',}).filter((row: string[]) => row[1] === '0').slice(1).slice(0,100);

    let keys:string[] = [];

    if(type_proof == TypeProof.Random){
        if(type_credential == TypeCredential.DrivingLicence){
            headers.push({id: "revealedAttributes", title: "Attributes Revealed"})
        } else {
            // Same at every credentials
            keys = Object.keys(get_identity_card_schema().properties.credentialSubject.properties)
            let headerKeys = keys.map((x)=> {return {id: x, title: x}})
            headers = headers.concat(headerKeys)
        }
    }

    for(let t = 0; t < number_files; t++){
        let output_path = (
            output_folder_path
            + "/identity_proofs_" + 
            ((type_credential === TypeCredential.DrivingLicence) ? "driving_license_" : "identity_card_") 
            + t +
            ".csv")
        const csvWriterProofs  = createCsvWriter({
            path: output_path,
            header: headers 
        });


        for (let i = 0; i < result.length;i++) {
            let row = result[i]
            let rows_proof:any[] = [];
            let verifiableCredential = BBSCredential.fromJSON(JSON.parse(row[2]))
            const presentationBuilder = new PresentationBuilder();
            presentationBuilder.addCredential(verifiableCredential, new BBSPublicKey(JSON.parse(row[3]).value))
            const boundCheckBppParams1 = new BoundCheckBppParams(string_to_bytes('Common Reference String')).decompress();
            let obj;
            if (type_proof == TypeProof.Random){
                if(type_credential == TypeCredential.DrivingLicence){
                    //Change at each credential
                    keys = verifiableCredential.schema.flatten()[0].filter((x) => x.includes("credentialSubject"))
                }
                let selected_values = get_random_values_from_array(keys, Math.floor(Math.random() * (keys.length+ 1)))
                obj = selected_values.reduce((o, key) => ({ ...o, [key]: (verifiableCredential.subject as Record<string, any>)[key]}), {})
                presentationBuilder.markAttributesRevealed(0,new Set(selected_values))
            } else if (type_proof == TypeProof.ExpirationDate){
                let current_date = new Date("1-1-2025").getTime()
                let max_expiration_date = new Date("1-1-2035").getTime();
                const relative_min_date= new Date("1-1-1920").getTime()
                presentationBuilder.enforceBounds(0, 'credentialSubject.expirationDate', current_date - relative_min_date, max_expiration_date - relative_min_date, 'expirationCheck', boundCheckBppParams1);
            } else {
                let current_date = new Date("1-1-2025").getTime()
                const relative_min_date= new Date("1-1-1920").getTime()
                presentationBuilder.enforceBounds(0, 'credentialSubject.issuanceDate', 0, current_date - relative_min_date, 'expirationCheck', boundCheckBppParams1);
            }

            for (let j = 0; j< number_proof_for_each_credentials; j++){
                const presentation2 = presentationBuilder.finalize();
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
            await csvWriterProofs.writeRecords(rows_proof)
        }
        
    }
    })

}

module.exports = {
    generate_attributes,
    generate_credentials,
    generate_proof,
    TypeCredential,
    TypeProof
}
