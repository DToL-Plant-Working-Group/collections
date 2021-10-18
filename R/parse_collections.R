library(data.table)
library(argparse)
library(taxonlookup)
library(stringr)

parser <- ArgumentParser()
# defaults are wrong
parser$add_argument("-i", "--input",
  default = "./data/DToL_plant_collections_COPO.csv",
  help = "name of the input csv file for collection data [default \"DToL_plant_collections.csv\"]"
)

parser$add_argument("-c", "--centoids",
  default = "./data/centoids.csv",
  help = "name of the input csv file for county centoids [default \"centoids.csv\"]"
)

parser$add_argument("-l", "--lat_lon_data",
                    default = "./data/lat_lon_county.tsv",
                    help = "name of the input csv file for county centoids [default \"lat_lon_county.tsv\"]"
)

parser$add_argument("-o", "--output",
  default = "parsed_DToL_plant_collections.csv",
  help = "name of output file. [default \"parsed_DToL_plant_collections.csv\"]"
)

args <- parser$parse_args()

data <- fread(args$input)
# debug
# data <- fread("./data/DToL_plant_collections_COPO_2021-10-15.csv")

data <- unique(data)

centoids <- fread(args$centoids)
# debug
# centoids <- fread("./data/centoids.csv")

parsed_lat_lon <- fread(args$lat_lon_data, col.names = c("latitude_decimal", "longitude_decimal", "county"))
# debug
# parsed_lat_lon <- fread("./data/lat_lon_county.tsv", col.names = c("latitude_decimal", "longitude_decimal", "county"))

# fix some of these names
parsed_lat_lon[, county := str_replace(string = county, pattern = "West Cornwall", replacement = "Cornwall")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "South Devon", replacement = "Devon")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "South Hampshire", replacement = "Hampshire")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "West Kent", replacement = "Kent")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "East Kent", replacement = "Kent")]
# middlesex is now mainly in greater london (grumble)
parsed_lat_lon[, county := str_replace(string = county, pattern = "Middlesex", replacement = "Greater London")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "West Norfolk", replacement = "Norfolk")]
# Worcestershire is West Midlands now
parsed_lat_lon[, county := str_replace(string = county, pattern = "Worcestershire", replacement = "West Midlands")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "Huntingdonshire", replacement = "Cambridgeshire")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "Caernarvonshire", replacement = "Gwynedd")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "Anglesey", replacement = "Gwynedd")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "Kirkcudbrightshire", replacement = "Dumfries and Galloway")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "Dumfriesshire", replacement = "Dumfries and Galloway")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "West Perthshire", replacement = "Perthshire")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "Mid Perthshire", replacement = "Perthshire")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "East Perthshire", replacement = "Perthshire")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "Argyllshire", replacement = "Argyll and Bute")]
parsed_lat_lon[, county := str_replace(string = county, pattern = "West Inverness-shire", replacement = "Inverness-shire")]

# merge new counties
data <- data[parsed_lat_lon, on = .(latitude_decimal, longitude_decimal)]

add_families_orders <- function(data, species) {
  data[, genus := gsub(pattern = " .*", replacement = "", taxon_name)]
  lookup_tab <- setDT(taxonlookup::lookup_table(species))
  lookup_tab[data, on = .(genus)]
}

# https://www.nearby.org.uk/counties/
centoids <- centoids[
  ,
  .(county = name, county_lat = wgs84_lat, county_lon = wgs84_long)
]

centoids <- rbind(centoids)

# create the county from the data
#data[, county := gsub(
#  pattern = ", .*",
#  replacement = "", x = collection_location
#)]

res <- centoids[data, on = .(county)]

res2 <- add_families_orders(res, res$taxon_name)

# some manual curation - Pulvigera = moss, Apopellia = moss
# requires intervention from time to time?
res2[genus == "Pulvigera", group := "Bryophytes"]
res2[genus == "Apopellia", group := "Bryophytes"]

fwrite(x = res2, file = paste("./data/COPO_", args$output, sep = ""))

# debug
fwrite(x = res2, file = "./data/DToL_plant_collections_COPO.csv")