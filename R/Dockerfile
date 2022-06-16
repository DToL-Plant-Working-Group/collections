FROM rocker/r-ver

RUN apt-get update && \
  apt-get install -y libcurl4-openssl-dev libssl-dev libssh2-1-dev libxml2-dev zlib1g-dev && \
  R -e "install.packages(c('devtools', 'testthat', 'roxygen2', 'argparse', 'stringr', 'data.table'))"

RUN R -e 'devtools::install_github("ropenscilabs/datastorr")'
RUN R -e 'devtools::install_github("wcornwell/taxonlookup")'
