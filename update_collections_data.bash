#!/usr/bin/env bash

Rscript ./R/parse_collections.R --input ./data/DToL_plant_collections.csv --centoids ./data/centoids.csv

echo "Parsed data in ./data/ folder"