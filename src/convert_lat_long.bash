
cut -d, -f6,7 $1 | tail -n +2 | sort | uniq > temp_lat_lons.txt

./geodojo_county -f temp_lat_lons.txt

rm temp_lat_lons.txt

# for i in $lat_lon; do
#     first=$(echo $i | cut -d, -f1)
#     second=$(echo $i | cut -d, -f2)

#     parsed_county=$(./geodojo_county --lat $first --lon $second)

#     printf "$first\t$second\t$parsed_county\n"

# done