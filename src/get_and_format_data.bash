#!/usr/bin/env bash

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

node jsons_to_csv.js ./curl_json_outputs/bryophytes*.json ./curl_json_outputs/angiosperms*.json

# clean-up
rm ./sample_names.json