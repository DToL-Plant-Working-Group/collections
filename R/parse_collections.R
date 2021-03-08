library(data.table)
library(argparse)
library(taxonlookup)

#
# Add plant families to data
# Merge 
#

parser <- ArgumentParser()
parser$add_argument("-i", "--input", default = "./data/DToL_plant_collections.csv",
                    help="name of the input csv file for collection data [default \"DToL_plant_collections.csv\"]")

parser$add_argument("-c", "--centoids", default = "./data/centoids.csv",
                    help="name of the input csv file for county centoids [default \"centoids.csv\"]")

parser$add_argument("-d", "--genome_size_bryophytes", default = "./data/DToL_plants/DTOL\ bryophyte\ genome\ sizes.csv",
                    help="name of the input csv file for bryophyte genome size data [default \"DToL_plants/DTOL\ bryophyte\ genome\ sizes.csv\"]")

parser$add_argument("-e", "--genome_size_vascular", default = "./data/DToL_plants/DTOL\ Genome\ Size\ Estimates.csv",
                    help="name of the input csv file for bryophyte genome size data [default \"DToL_plants/DTOL\ Genome\ Size\ Estimates.csv\"]")

parser$add_argument("-o", "--output", default = "parsed_DToL_plant_collections.csv",
                    help="name of output file. [default \"parsed_DToL_plant_collections.csv\"]")

args <- parser$parse_args()

data <- fread(args$input)
centoids <- fread(args$centoids)
genome_size_bryophyes <- fread(args$genome_size_bryophytes)
genome_size_vascular <- fread(args$genome_size_vascular)


genome_size_bryophyes2 <- genome_size_bryophyes[,.(taxon_name = paste(Genus, Species), 
                   collector_number = gsub(pattern = "[[:alpha:]]+", replacement = "", x = `ID Number`),
                   GS_2C = `GS (2C)`,
                   GS_1C = `GS (1C)`,
                   GS_gb = `GS (gb)`)]

genome_size_vascular2 <- genome_size_vascular[,.(taxon_name = paste(Genus, Species), 
                   collector_number = ifelse(test = grepl(pattern = "ZAG", x = `Collector ID`, fixed = TRUE), 
                                             yes = gsub(pattern = "ZAG", replacement = "", x = `Collector ID`, fixed = TRUE), 
                                             no = gsub(pattern = "([[:alpha:]]+)", replacement = "\\1 ", x = `Collector ID`)),
                   GS_2C = `GS (2C) pg`,
                   GS_1C = `GS (1C) pg`,
                   GS_gb = `GS (Gbp/1C)`)]

genome_sizes <- rbind(genome_size_bryophyes2, genome_size_vascular2)

# collector number wrong for this?
genome_sizes[taxon_name == "Euphorbia lathyris", collector_number := "MC 9003"]

merge_gs <- genome_sizes[data, on = .(collector_number, taxon_name)]

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

centoids <- rbind(centoids, manual_centoids)

# create the county from the data
merge_gs[, county := gsub(pattern = ", .*", replacement = "", x =  collection_location)]
# merge

res <- centoids[merge_gs, on = .(county)]

res2 <- add_families_orders(res, res$taxon_name)

# some manual curation - Pulvigera = moss, Apopellia = moss
res2[genus == "Pulvigera", group := "Bryophytes"]
res2[genus == "Apopellia", group := "Bryophytes"]

fwrite(x = res2, file = paste("./data/", args$output, sep = ""))