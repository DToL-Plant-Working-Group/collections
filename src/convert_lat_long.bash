
lat_lon=$(cut -d, -f6,7 $1 | tail -n +2 | sort | uniq)

for i in $lat_lon; do
    first=$(echo $i | cut -d, -f1)
    second=$(echo $i | cut -d, -f2)
    
    printf "$first\t$second\t"
    ./geodojo_county --lat $first --lon $second
    
done