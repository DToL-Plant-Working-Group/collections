// this is going to be a bit tricky.

const fs = require('fs');

let writeStream = fs.createWriteStream('../data/DToL_plant_collections_COPO.csv');

writeStream.write('order_copo,family_copo,genus_copo,taxon_name,collector_number,collection_location,latitude_decimal,longitude_decimal,collection_date_verbatim' + '\n', () => {
    // a line was written to stream
})

// command line args
const args = process.argv.slice(2);

const bryophytes_path = args[0];
const angiosperms_path = args[1];

const bryophytes = JSON.parse(fs.readFileSync(bryophytes_path, 'utf8'));
const angiosperms = JSON.parse(fs.readFileSync(angiosperms_path, 'utf8'));

// this will need to be updated as new data comes in.
const countyRegex = new RegExp(
    'othian|shire|Shetland|New Forest|Surrey|Kent|Trefor|Edinburgh|Dartmoor',
    'g'
);
// bryophytes data
bryophytes.forEach((d, index) => {
    let newLine = []
    // order
    newLine.push(d.species_list[0].ORDER_OR_GROUP)
    // family
    newLine.push(d.species_list[0].FAMILY)
    // genus 
    newLine.push(d.species_list[0].GENUS)
    // species
    newLine.push(d.species_list[0].SCIENTIFIC_NAME)
    // collection sample ID
    newLine.push(d.COLLECTOR_SAMPLE_ID)
    // collection location, [0] for first match
    newLine.push(d.COLLECTION_LOCATION.split(" | ").filter(d =>
        d.match(countyRegex)
    )[0])
    // lat
    newLine.push(d.DECIMAL_LATITUDE)
    // lon
    newLine.push(d.DECIMAL_LONGITUDE)
    // date of collection 
    newLine.push(d.DATE_OF_COLLECTION)

    writeStream.write(newLine.join(',') + '\n', () => {
        // a line was written to stream
    })
})

// angiosperms data
angiosperms.forEach((d, index) => {
    let newLine = []
    // order
    newLine.push(d.species_list[0].ORDER_OR_GROUP)
    // family
    newLine.push(d.species_list[0].FAMILY)
    // genus 
    newLine.push(d.species_list[0].GENUS)
    // species
    newLine.push(d.species_list[0].SCIENTIFIC_NAME)
    // collection sample ID
    newLine.push(d.COLLECTOR_SAMPLE_ID)
    // collection location, [0] for first match
    newLine.push(d.COLLECTION_LOCATION.split(" | ").filter(d =>
        d.match(countyRegex)
    )[0])
    // lat
    newLine.push(d.DECIMAL_LATITUDE)
    // lon
    newLine.push(d.DECIMAL_LONGITUDE)
    // date of collection 
    newLine.push(d.DATE_OF_COLLECTION)

    writeStream.write(newLine.join(',') + '\n', () => {
        // a line was written to stream
    })
})

writeStream.end()

writeStream.on('finish', () => {
    console.log('Data written to ../data/DToL_plant_collections_COPO.csv')
}).on('error', (err) => {
    console.log(err)
})
