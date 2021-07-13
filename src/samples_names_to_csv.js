fs = require('fs');

const data = JSON.parse(fs.readFileSync('./sample_names.json', 'utf8'));

const copo_data = data.data.map(d => d.copo_id);

var perChunk = 200; // items per chunk    

var result = copo_data.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk)

    if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = [] // start a new chunk
    }

    resultArray[chunkIndex].push(item)

    return resultArray
}, []);

for (let i = 0; i < result.length; i++) {
    fs.writeFile('./copo_strings/copo_csv_string' + i + '.txt', result[i], function (err) {
        if (err) return console.log(err);
    });
}
console.log(result.length + ' files written.');