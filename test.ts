
import {get_zla_code,get_random_number,get_column_table_from_csv, get_probabilities_from_csv, get_random_age, get_random_start_and_expiration_date ,get_control_number, stringToBytes, get_control_number_AVS, get_random_AVS_number, get_random_height } from './utils';
// We start by declaring our most important asset which is the E-ID Verifiable Credential we will be working with.
import axios from "axios";
import crypto from "crypto"

//get_column_table_from_csv("stat/EtatCommunes.csv", 5);
let birth_date = new Date("06/17/1999")
let expiration_date = new Date("02/16/2031")

//get_zla_code("E4647169", birth_date.getTime(), "M", expiration_date.getTime(), "FLORIAN ROMAIN", "DELAVY")

console.log(get_column_table_from_csv("stat/first_name.csv", 0, 0))
console.log(crypto.randomBytes(1980*1440).toString("base64"))