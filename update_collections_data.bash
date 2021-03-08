#!/usr/bin/env bash

Rscript ./R/parse_collections.R --input ./data/DToL_plant_collections.csv \
--centoids ./data/centoids.csv \
--genome_size_bryophytes ./data/DToL_plants/DTOL\ bryophyte\ genome\ sizes.csv \
--genome_size_vascular ./data/DToL_plants/DTOL\ Genome\ Size\ Estimates.csv

echo "Parsed data in ./data/ folder"