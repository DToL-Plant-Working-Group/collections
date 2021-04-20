#!/usr/bin/env bash

Rscript ./R/parse_collections.R --input ./data/DToL_plant_collections_COPO.csv \
--centoids ./data/centoids.csv

Rscript ./R/parse_genome_sizes.R

echo "Parsed data in ./data/ folder"