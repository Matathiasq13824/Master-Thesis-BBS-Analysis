import { initializeWasm, BBSKeypair, BBSSignatureParams, BBS_SIGNATURE_PARAMS_LABEL_BYTES,
    CredentialSchema, BBSCredentialBuilder, BBSCredential, SUBJECT_STR, Presentation, PresentationBuilder, BoundCheckBppParams, 
    BBSSecretKey} from '@docknetwork/crypto-wasm-ts'

import {getRandomValuesFromArray, get_random_image_signature,get_random_image_byte_array,get_row_table_from_csv, get_zla_code,get_random_first_name,get_column_table_from_csv, get_random_value_from_array, get_random_number, get_random_gender, get_random_age, get_random_start_and_expiration_date ,get_control_number, stringToBytes, get_control_number_AVS, get_random_AVS_number, get_random_height } from './utils';
import * as path from "path";
import { parse } from 'csv-parse/sync';
import * as fs from "fs";
const schema2 = {
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
          gender:  { title: 'Gender', type: 'string' },
          image:  { title: 'Biometric Image', type: 'string' },
          origin: { title: 'Origin', type: 'string'},
          autority: { title: 'autority', type: 'string'},
          signImage:  { title: 'Signature Image', type: 'string'},
          issuanceDate :{ title: 'Date of issuance', type: 'integer'},
          expirationDate :{ title: 'Date of expiration', type: 'integer'},
          avs: { title: 'AVS Number', type: 'string'},
          size: { title: 'Height', type: 'integer', minimum: 0},
          birthDate: { title: 'Date of Birth', type: 'integer'},
          nationality: { title: 'Nationality', type: 'string'},
          code: { title: 'Country Code', type: 'string'},
          documentNumber: { title: 'Document Number', type: 'string'},
          zla: { title: 'ZLA Code', type: 'string'},
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

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  // let outputPathInformations = "credentials/identity_information.csv"
  // let headersInformations = [{id: "id", title: "Personal Number"},{id: "data", title: "JSON information"}, {id: "public", title: "Public Key"}, {id: "secret", title: "Secret Key"}]
  // const csvWriterInformation = createCsvWriter({
  //     path: outputPathInformations,
  //     header: headersInformations
  // });
  // let rows_informations: { id: number; data: string; }[] = [];

  // let last_name_rows = get_column_table_from_csv("stat/last_name.csv", 0);
  // let origin_autority_rows = get_column_table_from_csv("stat/EtatCommunes.csv", 5);
  // let male_rows = get_column_table_from_csv("stat/first_name.csv", 1, 6)
  // let female_rows = get_column_table_from_csv("stat/first_name.csv", 0, 6)
  // let all_age_rows = get_row_table_from_csv("stat/output_age.csv", 1);
  // let male_age_rows = get_row_table_from_csv("stat/output_age.csv", 2);
  // let female_age_rows = get_row_table_from_csv("stat/output_age.csv", 3);
  // let age_rows: any[][] = [all_age_rows.table,male_age_rows.table,female_age_rows.table]
  // let total_values: any[] = [all_age_rows.total_value,male_age_rows.total_value,female_age_rows.total_value]


// initializeWasm().then(() => {
//   const params = BBSSignatureParams.generate(100, BBS_SIGNATURE_PARAMS_LABEL_BYTES);
//   // Secret and public key of the issuer
//   const keypair = BBSKeypair.generate(params, stringToBytes("seed1"));
//   const secretKey = keypair.secretKey;
//   const publicKey = keypair.publicKey;

//   // Get out the table that will be reused each time to speed up the creation of data
//   Promise.all(
//     Array.from({ length: 10000}, async (_, i) => {
//       let gender = get_random_gender()
//       let age = get_random_age(gender, age_rows, total_values);
//       let issuance_expiration_dates = get_random_start_and_expiration_date(age.age)
//       let first_name =get_random_first_name(gender, male_rows, female_rows)
//       let last_name = get_random_value_from_array(last_name_rows)
//       let documentNumber = get_random_number(10**10).toString()

//       const unsignedCred = {
//         '@context': [
//           'https://www.w3.org/2018/credentials/v1',
//           'https://w3id.org/citizenship/v1',
//           'https://ld.dock.io/security/bbs/v1'
//         ],
//         id: 'https://issuer.oidp.uscis.gov/credentials/'+documentNumber,
//         type: ['VerifiableCredential', 'PermanentResidentCard'],
//         issuer: {
//             "id": "did:web:credentials.switzerland.example",
//             "image": "data:image/png;base64,iVBORw0KGgo...YII="
//           },
//         name: 'Swiss Identity Card',
//         description: 'Swiss Confederation Identity Card',
//         credentialSubject: {
//             firstName: first_name,
//             lastName: last_name,
//             gender:  gender,
//             image:  get_random_image_byte_array(),
//             origin: get_random_value_from_array(origin_autority_rows),
//             autority: get_random_value_from_array(origin_autority_rows),
//             signImage:  get_random_image_signature(age.age),
//             issuanceDate :issuance_expiration_dates.issuance_date,
//             expirationDate :issuance_expiration_dates.expiration_date,
//             avs: get_random_AVS_number(),
//             size: get_random_height(gender,age.age),
//             birthDate: age.birth_date,
//             nationality: "Schweiz - Suisse - Svizzera - Svizra - Switzerland",
//             code: "CHE",
//             documentNumber: documentNumber,
//             zla: get_zla_code(documentNumber,age.birth_date,gender, issuance_expiration_dates.expiration_date,first_name,last_name),
//         }
//       };
//       return {id:i, data:JSON.stringify(unsignedCred), public: JSON.stringify(publicKey), secret:JSON.stringify(secretKey)};
//     })
//   ).then(rows => {
//     csvWriterInformation.writeRecords(rows)
//   })
// })


// initializeWasm().then(() => {
//   let outputPathCredentials = "credentials/identity_credentials.csv"
//   let headersCredentials = [{id: "id", title: "Personal Number User"}, {id: "cred_num", title: "Number of Holder Credential"},{id: "data", title: "JSON information"}]
//   const csvWriterCredentials = createCsvWriter({
//       path: outputPathCredentials,
//       header: headersCredentials
//   });
//   let rows_credentials:any[] = []
//   //recovery of the informations
//   const csvFilePath = path.resolve(__dirname, "credentials/identity_information.csv");
//   const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
//   let result:string[][] = parse(fileContent, {delimiter: ',',}).slice(1);

//   result.forEach((row:string[], i) => {
//     let unsignedCred = JSON.parse(row[1])
//     const credSchema2 = new CredentialSchema(schema2, {useDefaults : true});
//     const builder = new BBSCredentialBuilder();
//     builder.schema = credSchema2;
//     builder.subject = unsignedCred.credentialSubject;
//     builder.setTopLevelField('@context', unsignedCred['@context']);
//     builder.setTopLevelField('id', unsignedCred['id']);
//     builder.setTopLevelField('type', unsignedCred['type']);
//     builder.setTopLevelField('name', unsignedCred['name']);
//     builder.setTopLevelField('description', unsignedCred['description']);
//     builder.setTopLevelField('issuer', unsignedCred['issuer']);
//     for (let j = 0; j< 5; j++){
//       const verifiableCredential = builder.sign(JSON.parse(row[3]));
//       console.log(i, j)
//       rows_credentials.push({id:i, cred_num: j, data:JSON.stringify(verifiableCredential.toJSON())})
//     }
//   })
//   csvWriterCredentials.writeRecords(rows_credentials)
// })

let keys = Object.keys(schema2.properties.credentialSubject.properties)
//let current_date = new Date("1-1-2025").getTime()
//let max_expiration_date = new Date("1-1-2035").getTime();
initializeWasm().then(async () => {
  const params = BBSSignatureParams.generate(100, BBS_SIGNATURE_PARAMS_LABEL_BYTES);
  // Secret and public key of the issuer
  const keypair = BBSKeypair.generate(params, stringToBytes("seed1"));
  const secretKey = keypair.secretKey;
  const publicKey = keypair.publicKey;
  let headersProofs  = [{id: "id", title: "Personal Number"}, {id: "cred_num", title: "Number of Holder Credential"}, {id: "proof_num", title: "Number of the proof"},{id: "proof", title: "proof array"}]
  let headerKeys = keys.map((x)=> {return {id: x, title: x}})
  headersProofs = headersProofs.concat(headerKeys)
  //recovery of the informations
  const csvFilePath = path.resolve(__dirname, "credentials/identity_credentials.csv");
  const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
  let result:string[][] = parse(fileContent, {delimiter: ',',}).filter((row: string[]) => row[1] === '0').slice(1).slice(0,10);  
  for(let t = 0; t < 2; t++){
    let outputPathProofs = `credentials/identity_proofs_${t}.csv`
    const csvWriterProofs  = createCsvWriter({
          path: outputPathProofs,
          header: headersProofs 
    });
    let selected_values = getRandomValuesFromArray(keys, Math.floor(Math.random() * (keys.length+ 1)))

    let rows_proof:any[] = [];
    result.forEach((row:string[]) => {

      let verifiableCredential = BBSCredential.fromJSON(JSON.parse(row[2]))
      const obj = selected_values.reduce((o, key) => ({ ...o, [key]: (verifiableCredential.subject as Record<string, any>)[key]}), {})
      const presentationBuilder = new PresentationBuilder();
      presentationBuilder.addCredential(verifiableCredential, publicKey)
      const boundCheckBppParams1 = new BoundCheckBppParams(stringToBytes('Common Reference String')).decompress();
      //presentationBuilder.enforceBounds(0, 'credentialSubject.expirationDate', current_date, max_expiration_date, 'expirationCheck', boundCheckBppParams1);
      presentationBuilder.markAttributesRevealed(0,new Set(selected_values.map(x => "credentialSubject."+x)))

      for (let j = 0; j< 10; j++){
        const presentation2 = presentationBuilder.finalize();
        console.log(row[0], row[1], j);
        let result = {...obj, id:row[0], cred_num: row[1], proof_num:j, proof:presentation2.proof.bytes}
        
        rows_proof.push(result);
      }
    })
    await csvWriterProofs.writeRecords(rows_proof)
  }
})



// TODO
// Create 10000 credentials information (depends on time to generate)
// Generate for each a holder proof (or a 100, to have some possibilities)

// Generate each a given number of proof of expiration date (basics verification so...10000 per crdentials)

// One csv for all credential informations
// One csv for the holder proofs
// One csv for the verifier proof with the bound of expiration date