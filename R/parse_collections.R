library(data.table)
library(argparse)
library(taxonlookup)

parser <- ArgumentParser()
# defaults are wrong
parser$add_argument("-i", "--input", default = "./data/DToL_plant_collections_COPO.csv",
                    help="name of the input csv file for collection data [default \"DToL_plant_collections.csv\"]")

parser$add_argument("-c", "--centoids", default = "./data/centoids.csv",
                    help="name of the input csv file for county centoids [default \"centoids.csv\"]")

parser$add_argument("-o", "--output", default = "parsed_DToL_plant_collections.csv",
                    help="name of output file. [default \"parsed_DToL_plant_collections.csv\"]")

args <- parser$parse_args()

data <- fread(args$input)

data <- unique(data)

centoids <- fread(args$centoids)

add_families_orders <- function(data, species) {
  data[, genus := gsub(pattern = " .*", replacement = "", taxon_name)]
  lookup_tab <- setDT(taxonlookup::lookup_table(species))
  lookup_tab[data, on = .(genus)]
}

# https://www.nearby.org.uk/counties/
centoids <- centoids[, .(county = name, county_lat = wgs84_lat, county_lon = wgs84_long)]

centoids <- rbind(centoids)

# create the county from the data
data[, county := gsub(pattern = ", .*", replacement = "", x =  collection_location)]

res <- centoids[data, on = .(county)]

res2 <- add_families_orders(res, res$taxon_name)

# some manual curation - Pulvigera = moss, Apopellia = moss
# requires intervention from time to time?
res2[genus == "Pulvigera", group := "Bryophytes"]
res2[genus == "Apopellia", group := "Bryophytes"]

fwrite(x = res2, file = paste("./data/COPO_", args$output, sep = ""))