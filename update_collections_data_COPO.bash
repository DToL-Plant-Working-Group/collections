#!/usr/bin/env bash

d=$(date +%Y-%m-%d)

# call script in src
cd ./src
bash ./get_and_format_data.bash

cd ..
# clean up files using R.



Rscript ./R/parse_collections.R --input ./data/DToL_plant_collections_COPO_${d}.csv \
--centoids ./data/centoids.csv

# remove DToL_plant_collections_COPO_${d}.csv
rm ./data/DToL_plant_collections_COPO_${d}.csv

echo "Parsed data in ./data/ folder"

# automatically update the github.
git add .
git commit -m "Update data on $d."
git push
