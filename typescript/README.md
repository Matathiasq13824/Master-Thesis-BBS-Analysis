 # Typescript Identity and Proof generation

This folder contain all the code used to generate 

To generate the identities and the functions, use the following command (you must have installed yarn beforehand): 

```
yarn install
tsc
node main.js
node main.js
node main.js
```

The first call of `main` will generate the identities, the second the credentials and the third the proof. This iterative call was made because of asyncronous functions needed for the library generating the proof. Each call will be longer than the previous one, as the generation of proof is much more consequent.

By Default, 100 identities and credential for the driving license, and 10 files of 1000 proofs will be generated by the continuous calls. The separation of the proofs in multiple files is for memory reasons. If different type of proof or credential must be generated, the parameters in `main.ts` must be modified before making the call. After changing the parameters please use the command `tsc` to apply them

If the parameter `type_credentials` is set to `TypeCredential.IdentityCard`, two errors will appear. However the code can still be run without issues with `node main.js`.

### Typescript files

- `credentials_driving_licence.ts` and `credentials_identity_card.ts` contain the function used to randomly generate the corresponding identities.

- `generator.ts` contains the functions to generate the credentials and the presentations/proofs.

- `main.ts `is used to call the previous code to generate easily what is needed for the training

- `utils.ts` contains multiple functions used in other files to randomly generate precise value and othe ruseful functions.

- `swiss_statistics.ts` is a code used to call the database of the swiss office of statistics. Used only to generate `output_age.csv` in the `stat` folder 

### Folders

- `stat` contains all the statistical data to generate the identities, such as the possible names, the percentage of age or the list of cantons and municipalities
- `credentials`will contains all the data generated, such as the identities, credential and proofs. They do not need to be moved to the `python` folder.


