#!/usr/bin/env bash

# remove old data

# COPO data
rm ../data/COPO_*
# google sheet latest collections
rm ../data/all_*
# genome sizes
rm ../data/DTOL_genome_sizes_*

##                                   ##
# Get the COPO data from the COPO API #
##                                   ##

# get the DToL sample names
curl https://copo-project.org/api/sample/dtol/ > ./sample_names.json

mkdir ./copo_strings

# takes the sample_names.json and
# creates a comma separated string of ID's to curl in the
# next loop
# it seems > 200 ID's times out the curl, which is why
# samples_names_to_csv.js has chunk sizes of 200.
node ./samples_names_to_csv.js

mkdir ./curl_json_outputs

# ping the copo API as many times as there are files in copo_strings
# to get the entire DToL database.
for file in ./copo_strings/*.txt; do
    sample_names=$(cat $file)
    url="https://copo-project.org/api/sample/copo_id/"
    url_to_curl="${url}${sample_names}"
    curl $url_to_curl > ./curl_json_outputs/$(basename ${file}).json
done

# remove all the string files
rm ./copo_strings/copo_csv_string*.txt

# now cat all the jsons in ./curl_json_outputs
# this also filters for angiosperms & bryophytes
# and creates two output files:
# ./curl_json_outputs/angiosperms_(Date).json && ./curl_json_outputs/bryophytes_(Date).json

node ./merge_jsons.js

# remove all the intermediate files.
rm ./curl_json_outputs/copo_csv_string*.txt.json

# now to (re)create the DToL_plant_collections.csv
d=$(date +%Y-%m-%d)

node jsons_to_csv.js ./curl_json_outputs/bryophytes_${d}.json ./curl_json_outputs/angiosperms_${d}.json

# clean-up
rm ./sample_names.json
# QC the bryophyte && angiosperm location information, comment the below lines out.
# rm ./curl_json_outputs/angiosperms_*
# rm ./curl_json_outputs/bryophytes_*

##                                      ##
# Get the data from google sheets (curl) #
##                                      ##

mkdir google_sheets_data && cd google_sheets_data

# angiosperms
curl -L "https://docs.google.com/spreadsheets/d/e/2PACX-1vQnttoVuGLAaqVzqaCjb7Qyc7gKgSNCb7INVIDdS8X83S78nZ_szlHcOxpveueKSrDkRzlqmUGWmtHx/pub?gid=0&single=true&output=csv" \
> vascular_${d}.csv
# bryophytes
curl -L "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWzz8Sut3hQFB4DyxYE_wiZZrHB41VXokc8eihEGAOKdMPDhGw2KkJIl-zjAob6oeDcqgri1zcF3d8/pub?gid=0&single=true&output=csv" \
> bryophytes_${d}.csv

curl -L "https://docs.google.com/spreadsheets/d/e/2PACX-1vSt0R1T3MpoOM6UFNMaT_Q9gR5TYyUZC1wgLqW_6_cH9zzII8ehadrbHX8bpktjTv2_yt_KHaj3x_e1/pub?output=csv" \
> genome_sizes_${d}.csv


# need format to be:
# group, family, genus, species
# and filtered to just contain a list of species.

awk -v d="$d" -F ","  'BEGIN {OFS=","} { if ($7 == "yes" || $9 == "yes" || $10 == "yes")  print $1,$2,$3,$3 " "  $4,d}' bryophytes_${d}.csv > bryophytes_${d}_collected.csv
awk -v d="$d" -F ","  'BEGIN {OFS=","} { if ($7 == "yes" || $9 == "yes" || $10 == "yes")  print $1,$2,$3,$3 " "  $4,d}' vascular_${d}.csv > vascular_${d}_collected.csv

cat vascular_${d}_collected.csv bryophytes_${d}_collected.csv > all_${d}_collected.csv

# prepend headers
cat <(echo "group,family,genus,species,date") all_${d}_collected.csv > ../data/all_collected_final.csv

# genome size data wrangling.
# just need species,GB (which in this dataset is 1C/Gbp)

awk -F ","  'BEGIN {OFS=","} { if ($3 == "DTOL")  print $6 " "  $7,$19}' genome_sizes_${d}.csv > DTOL_genome_sizes_${d}.csv
cat <(echo "species,GB") DTOL_genome_sizes_${d}.csv > ../data/DTOL_genome_sizes_final.csv

# clean up all the intermediate files.
rm all_${d}_collected.csv vascular_${d}.csv bryophytes_${d}.csv genome_sizes_${d}.csv bryophytes_${d}_collected.csv vascular_${d}_collected.csv DTOL_genome_sizes_${d}.csv