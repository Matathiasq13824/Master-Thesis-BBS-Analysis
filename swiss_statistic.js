"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
function extractAndSaveCSV(apiResponse, outputPath) {
    const { dimension, label, source, updated, value, extension } = apiResponse.dataset;
    // Extract indices and labels for each dimension
    const dimensionCategories = dimension.id.map((value, index) => {
        let indexes = Object.keys(dimension[value].category.index);
        indexes = [indexes[indexes.length - 1]].concat(indexes.slice(0, -1));
        return {
            name: value,
            label: dimension[value].label,
            size: dimension.size[index],
            index: indexes,
            labels: dimension[value].category.label,
        };
    }).reverse();
    let mainCategory = dimensionCategories[0];
    let secondaryCategories = dimensionCategories.slice(1);
    let count_label_second_category = [];
    for (let i = 0; i < secondaryCategories.length; i++) {
        count_label_second_category.push(0);
    }
    let valuesN = value;
    let rows = [];
    for (let i = 0; i < valuesN.length / mainCategory.size; i++) {
        let index = i * mainCategory.size;
        let row = valuesN.slice(index, index + mainCategory.size);
        let tagged_row = {};
        // Add label information
        count_label_second_category.forEach((i, index) => {
            tagged_row[secondaryCategories[index].name] = secondaryCategories[index].labels[secondaryCategories[index].index[i]];
        });
        count_label_second_category = recursive_increase(count_label_second_category, count_label_second_category.length - 1, secondaryCategories);
        row.forEach((value, index) => {
            tagged_row[mainCategory.index[index]] = value;
        });
        rows.push(tagged_row);
    }
    let headers = secondaryCategories.map((value) => ({ id: value.name, title: value.label }));
    headers = headers.concat(mainCategory.index.map((value) => ({ id: value, title: mainCategory.labels[value] })));
    rows.push([label, source]);
    // transfer the relevant information about the labels
    // number of secondary Categories followed by the size of each category
    // like this, we can recover the data without any label
    rows.push([secondaryCategories.length].concat(dimension.size));
    const createCsvWriter = require('csv-writer').createObjectCsvWriter;
    const csvWriter = createCsvWriter({
        path: outputPath,
        header: headers
    });
    csvWriter.writeRecords(rows) // returns a promise
        .then(() => {
        console.log('...Done');
    });
    console.log(`CSV file saved at ${outputPath}`);
}
function recursive_increase(array, index, dimensionCategories) {
    if (index === -1) {
        return array;
    }
    array[index] += 1;
    if (array[index] === (dimensionCategories[index].size)) {
        array[index] = 0;
        return recursive_increase(array, index - 1, dimensionCategories);
    }
    return array;
}
/*
*   Recovery of the age percetage of the population
*/
const data_call_age_class = {
    "query": [
        {
            "code": "Jahr",
            "selection": {
                "filter": "item",
                "values": [
                    "2023"
                ]
            }
        },
        {
            "code": "Bevölkerungstyp",
            "selection": {
                "filter": "item",
                "values": [
                    "1"
                ]
            }
        },
        {
            "code": "Geschlecht",
            "selection": {
                "filter": "item",
                "values": [
                    "-99999",
                    "1",
                    "2"
                ]
            }
        },
        {
            "code": "Alter",
            "selection": {
                "filter": "item",
                "values": Array.from({ length: 102 }, (_, i) => (i === 0 ? "-99999" : (i - 1).toString()))
            }
        }
    ],
    "response": {
        "format": "json-stat"
    }
};
const url_age_class = "https://www.pxweb.bfs.admin.ch/api/v1/fr/px-x-0103010000_102/px-x-0103010000_102.px";
axios_1.default.post(url_age_class, data_call_age_class, {
    headers: {
        "Content-Type": "application/json"
    }
}).then((response) => {
    // Transform data to CSV format
    extractAndSaveCSV(response.data, "./stat/output_age.csv");
});
