library(data.table)
library(argparse)
library(taxonlookup)

#
# Add plant families to data
# Merge 
#

parser <- ArgumentParser()
parser$add_argument("-i", "--input", default = "DToL_plant_collections.csv",
                    help="name of the input csv file for collection data [default \"DToL_plant_collections.csv\"]")

parser$add_argument("-c", "--centoids", default = "centoids.csv",
                    help="name of the input csv file for county centoids [default \"centoids.csv\"]")

parser$add_argument("-o", "--output", default = "parsed_DToL_plant_collections.csv",
                    help="name of output file. [default \"parsed_DToL_plant_collections.csv\"]")

args <- parser$parse_args()

data <- fread(args$input)
centoids <- fread(args$centoids)

add_families_orders <- function(data, species) {
  data[, genus := gsub(pattern = " .*", replacement = "", taxon_name)]
  lookup_tab <- setDT(taxonlookup::lookup_table(species))
  lookup_tab[data, on = .(genus)]
}

# https://www.nearby.org.uk/counties/
centoids <- centoids[, .(county = name, county_lat = wgs84_lat, county_lon = wgs84_long)]

# lat/long from google maps
manual_centoids <- data.table(county = c("East Lothian", "Shetland Islands", "City of Edinburgh", "Argyll and Bute"),
           county_lat = c(55.9459201493332, 59.921060375706034,  55.94099621182082, 56.17475491814173),
           county_lon = c(-2.726971889549852, -1.2952103850324475, -3.1957269319409205, -5.3310235268056045))

centoids <- rbind(centoids,manual_centoids)

# create the county from the data
data[, county := gsub(pattern = ", .*", replacement = "", x =  collection_location)]
# merge

res <- centoids[data, on = .(county)]

res2 <- add_families_orders(res, res$taxon_name)

fwrite(x = res2, file = paste("./", args$output, sep = ""))