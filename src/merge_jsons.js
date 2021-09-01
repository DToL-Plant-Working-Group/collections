const fs = require('fs');

const json_directory = "./curl_json_outputs/";
const DATE = new Date().toISOString().slice(0, 10);

// CHECK SPELLING FOR BOTH SETS OF REGEXES.
const ANGIOSPERM_ORDER_REGEX = /Nymphaeales|Piperales|Magnoliales|Laurales|Ceratophyllales|Ranunculales|Proteales|Buxales|Gunnerales|Saxifragales|Vitales|Fabales|Rosales|Fagales|Curcubitales|Celastrales|Oxalidales|Malphigiales|Geraniales|Myrtales|Crossosomatales|Sapindales|Malvales|Brassicales|Santalales|Caryophyllales|Cornales|Ericales|Garryales|Gentianales|Boraginales|Solanales|Lamiales|Aquifoliales|Asterales|Escalloniales|Dipsacales|Apiales/;
// I need help for bryophytes. I used this for now: https://core.ac.uk/download/pdf/144790701.pdf
const BRYOPHYTE_ORDER_REGEX = /Anthocerotales|Dendrocerotales|Phymatocerotales|Notothyladales|Leiosporocerotales|Calobryales|Treubiales|Jungermanniales|Porellales|Ptilidiales|Metzgeriales|Pleuroziales|Fossombroniales|Pallaviciniales|Pelliales|Blasiales|Lunulariales|Marchantiales|Neohodgsoniales|Sphaerocarpales/;

(async () => {
    try {
        // Get the files as an array
        const files = fs.readdirSync(json_directory).filter(fn => fn.includes('copo_csv_string'));

        let init_array = [];

        for (const file of files) {
            let copo = JSON.parse(fs.readFileSync(json_directory + "/" + file, 'utf8'));

            let data = copo.data;

            init_array.push(data);
        }

        // flatten array of arrays
        init_array_flat = init_array.flat();

        angiosperms = [];
        bryophytes = [];
        for (let i = 0; i < init_array_flat.length; i++) {

            // skip iterations where undefined/species list absent.
            if (init_array_flat[i] === undefined) {
                continue;
            }
            // collect
            if (init_array_flat[i].ORDER_OR_GROUP.match(ANGIOSPERM_ORDER_REGEX)) {
                angiosperms.push(init_array_flat[i])
            }
            if (init_array_flat[i].ORDER_OR_GROUP.match(BRYOPHYTE_ORDER_REGEX)) {
                bryophytes.push(init_array_flat[i])
            }
        }

        // print some stats
        console.log("There were " + bryophytes.length + " bryophyte records.");
        console.log("There were " + angiosperms.length + " angiosperm records.");

        const angiosperms_json = JSON.stringify(angiosperms);
        const bryophytes_json = JSON.stringify(bryophytes);

        fs.writeFile('./curl_json_outputs/angiosperms_' + DATE + '.json', angiosperms_json, function (err) {
            if (err) return console.log(err);
        });
        fs.writeFile('./curl_json_outputs/bryophytes_' + DATE + '.json', bryophytes_json, function (err) {
            if (err) return console.log(err);
        });

    }
    catch (e) {
        // Catch anything bad that happens
        console.error("Damn, we errored: ", e);
    }

})();