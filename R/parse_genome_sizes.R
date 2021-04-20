library(data.table)

bry_data <- fread("./data/DToL_plants/DTOL\ bryophyte\ genome\ sizes.csv")
vas_data <- fread("./data/DToL_plants/DTOL\ Genome\ Size\ Estimates.csv")

bry_data <- bry_data[,.(taxon_name = paste(Genus, Species), 
                   GS_2C = `GS (2C)`,
                   GS_1C = `GS (1C)`,
                   GS_gb = `GS (gb)`)]

vas_data <- vas_data[,.(taxon_name = paste(Genus, Species), 
                   GS_2C = `GS (2C) pg`,
                   GS_1C = `GS (1C) pg`,
                   GS_gb = `GS (Gbp/1C)`)]

res <- rbind(bry_data, vas_data)
res <- res[complete.cases(res),]

fwrite(x = res, file = "./data/parsed_genome_sizes.csv")