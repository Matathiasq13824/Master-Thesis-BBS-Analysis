import { initializeWasm, BBSKeypair, BBSSignatureParams, BBS_SIGNATURE_PARAMS_LABEL_BYTES,
  CredentialSchema, BBSCredentialBuilder, BBSCredential, SUBJECT_STR, Presentation, PresentationBuilder, BoundCheckBppParams, 
  BBSSecretKey} from '@docknetwork/crypto-wasm-ts'

import {get_random_values_from_array, get_random_image_signature,get_random_image_byte_array,get_row_table_from_csv, get_zla_code_identity_card,get_random_first_name,get_column_table_from_csv, get_random_value_from_array, get_random_number, get_random_gender, get_random_age_identity_card, get_random_start_and_expiration_date_identity_card ,get_control_number, string_to_bytes, get_control_number_AVS, get_random_AVS_number, get_random_height } from './utils';
import * as path from "path";
import { parse } from 'csv-parse/sync';
import * as fs from "fs";


const last_name_rows = get_column_table_from_csv("stat/last_name.csv", 0, 5);
const origin_autority_rows = get_column_table_from_csv("stat/EtatCommunes.csv", 5, 1);
const male_rows = get_column_table_from_csv("stat/first_name.csv", 1, 6)
const female_rows = get_column_table_from_csv("stat/first_name.csv", 0, 6)
const all_age_rows = get_row_table_from_csv("stat/output_age.csv", 1);
const male_age_rows = get_row_table_from_csv("stat/output_age.csv", 2);
const female_age_rows = get_row_table_from_csv("stat/output_age.csv", 3);
const age_rows: any[][] = [all_age_rows.table,male_age_rows.table,female_age_rows.table]
const total_values: any[] = [all_age_rows.total_value,male_age_rows.total_value,female_age_rows.total_value]

export function get_identity_card_schema() {
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
}

export function get_identity_card_attributes() {
  let gender = get_random_gender()
  let age = get_random_age_identity_card(gender, age_rows, total_values);
  let issuance_expiration_dates = get_random_start_and_expiration_date_identity_card(age.age)
  let first_name =get_random_first_name(gender, male_rows, female_rows)
  let last_name = get_random_value_from_array(last_name_rows)
  let documentNumber = get_random_number(10**10).toString()

  return {
    credential:{
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://w3id.org/citizenship/v1',
        'https://ld.dock.io/security/bbs/v1'
      ],
      id: 'https://issuer.oidp.uscis.gov/credentials/'+documentNumber,
      type: ['VerifiableCredential', 'PermanentResidentCard'],
      issuer: {
          "id": "did:web:credentials.switzerland.example",
          "image": "data:image/png;base64,iVBORw0KGgo...YII="
        },
      name: 'Swiss Identity Card',
      description: 'Swiss Confederation Identity Card',
      credentialSubject: {
          firstName: first_name,
          lastName: last_name,
          gender:  gender,
          image:  get_random_image_byte_array(),
          origin: get_random_value_from_array(origin_autority_rows),
          autority: get_random_value_from_array(origin_autority_rows),
          signImage:  get_random_image_signature(age.age),
          issuanceDate :issuance_expiration_dates.issuance_date,
          expirationDate :issuance_expiration_dates.expiration_date,
          avs: get_random_AVS_number(),
          size: get_random_height(gender,age.age),
          birthDate: age.birth_date,
          nationality: "Schweiz - Suisse - Svizzera - Svizra - Switzerland",
          code: "CHE",
          documentNumber: documentNumber,
          zla: get_zla_code_identity_card(documentNumber,age.birth_date,gender, issuance_expiration_dates.expiration_date,first_name,last_name),
      }
    }
  }
}



module.exports = {
  get_identity_card_schema,
  get_identity_card_attributes,
}