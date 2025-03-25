import {    
    generate_attributes,
    generate_credentials,
    generate_proof,
    TypeCredential,
    TypeProof,
} from "./generator"
import * as fs from 'fs';
import * as path from 'path';

// Parameters of generation
const type_credentials = TypeCredential.DrivingLicence
const number_identity = 100;
const number_credentials_for_each_identity = 1;
const number_proofs_per_credential_per_file = 10;
const number_files_for_proof = 10;
const seed_random = "seed1"
// The Driving license allow only two type, issuance and random.
const type_proof = TypeProof.Random


// Selection of the output folders
const folder_path = "./credentials";
const proofs_folder_path = "credentials/run"
const attribute_file = "identity_attributes" + ((type_credentials === TypeCredential.DrivingLicence) ? "_driving_license.csv" : "_identity_card.csv");
const credential_file = "identity_credentials" + ((type_credentials === TypeCredential.DrivingLicence) ? "_driving_license.csv" : "_identity_card.csv");
const file_path_attributes = path.join(folder_path, attribute_file);
const file_path_credentials = path.join(folder_path, credential_file);


if (!fs.existsSync(file_path_attributes)) {
    generate_attributes(type_credentials,number_identity, seed_random)
} else if (!fs.existsSync(file_path_credentials)) {
    generate_credentials(type_credentials,file_path_attributes, number_credentials_for_each_identity)
} else {
    generate_proof(type_credentials,type_proof, file_path_credentials,number_proofs_per_credential_per_file,number_files_for_proof,proofs_folder_path)
}

