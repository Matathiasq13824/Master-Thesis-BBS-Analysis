
import { initializeWasm, BBSKeypair, BBSSignatureParams, BBS_SIGNATURE_PARAMS_LABEL_BYTES,
    CredentialSchema, BBSCredentialBuilder, BBSCredential, PresentationBuilder, BoundCheckBppParams, 
    } from '@docknetwork/crypto-wasm-ts'

import {get_driving_license_attributes,get_driving_license_schema} from "./credentials_driving_licence"
import {get_identity_card_attributes, get_identity_card_schema} from "./credentials_identity_card"
import {string_to_bytes, get_random_values_from_array} from "./utils"
import {    generate_attributes,
    generate_credentials,
    generate_proof,
    TypeCredential,
    TypeProof,
    generate_driving_license_attributes_statistics} from "./generator"


// let birth_date = new Date("06/17/1999")
// let expiration_date = new Date("02/16/2031")

// initializeWasm().then(() => {
//     const params = BBSSignatureParams.generate(100, BBS_SIGNATURE_PARAMS_LABEL_BYTES);
//     const keypair = BBSKeypair.generate(params, string_to_bytes("seed1"));
//     const secretKey = keypair.secretKey;
//     const publicKey = keypair.publicKey;
//     const unsignedCred = get_driving_license_attributes()
//     let schema = get_driving_license_schema(unsignedCred.num_categories, unsignedCred.num_additional_infos_categories, unsignedCred.num_additional_infos)
//     const credSchema2:CredentialSchema = new CredentialSchema(schema, {useDefaults : true});
//     const builder = new BBSCredentialBuilder();
//     builder.schema = credSchema2;
//     builder.subject = unsignedCred.credential.credentialSubject;
//     builder.setTopLevelField('@context', unsignedCred.credential['@context']);
//     builder.setTopLevelField('id', unsignedCred.credential['id']);
//     builder.setTopLevelField('type', unsignedCred.credential['type']);
//     builder.setTopLevelField('name', unsignedCred.credential['name']);
//     builder.setTopLevelField('description', unsignedCred.credential['description']);
//     builder.setTopLevelField('issuer', unsignedCred.credential['issuer']);  

//     const verifiableCredential = builder.sign(secretKey);
//     // console.log(credSchema2.flatten()[0].filter((x) => x.includes("credentialSubject")))
//     console.log(unsignedCred.num_additional_infos)
//     console.log(unsignedCred.num_categories)
//     console.log(unsignedCred.num_additional_infos_categories)

//     const presentationBuilder = new PresentationBuilder();
//     presentationBuilder.addCredential(verifiableCredential, publicKey)

//     const boundCheckBppParams1 = new BoundCheckBppParams(string_to_bytes('Common Reference String')).decompress();
//     //presentationBuilder.enforceBounds(0, 'credentialSubject.expirationDate', current_date, max_expiration_date, 'expirationCheck', boundCheckBppParams1);
//     presentationBuilder.markAttributesRevealed(0,new Set(["credentialSubject.categories.0"]))
    
//     const presentation2 = presentationBuilder.finalize();
//     console.log(presentation2)
// })

//let output_attributes = generate_attributes(TypeCredential.DrivingLicence,1000)
// console.log(output_attributes)

//let output_path = generate_credentials(TypeCredential.DrivingLicence,"credentials/identity_attributes_driving_license.csv", 5)
// console.log(output_path);
generate_proof(TypeCredential.IdentityCard,TypeProof.ExpirationDate, "credentials/identity_credentials.csv",100,100,"credentials/run3_trial1_expiration_revealed")

