"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const crypto_1 = __importDefault(require("crypto"));
//get_column_table_from_csv("stat/EtatCommunes.csv", 5);
let birth_date = new Date("06/17/1999");
let expiration_date = new Date("02/16/2031");
//get_zla_code("E4647169", birth_date.getTime(), "M", expiration_date.getTime(), "FLORIAN ROMAIN", "DELAVY")
console.log((0, utils_1.get_column_table_from_csv)("stat/first_name.csv", 0, 0));
console.log(crypto_1.default.randomBytes(1980 * 1440).toString("base64"));
