// load json of counties
d3.json("https://gist.githubusercontent.com/rveciana/27272a581e975835aaa321ddf816d726/raw/c40062a328843322208b8e98c2104dc8f6ad5301/uk-counties.json").then(function (ukCounties, JSONerror) {
    if (JSONerror) return console.warn(JSONerror);
    d3.csv("../data/parsed_DToL_plant_collections.csv").then(function (data, CSVerror) {
        // return csv of parsed data from R script
        if (CSVerror) return console.warn(CSVerror);

        // get the unique dates
        const dateData = data
            .map(d => {
                let splits = d.collection_date_verbatim.split("/");
                let date = new Date(splits[2], splits[1] - 1, splits[0]);
                return date;
            })
            .filter(
                (date, i, self) => self.findIndex(d => d.getTime() === date.getTime()) === i
            )
            .sort(function (a, b) {
                // Turn your strings into dates, and then subtract them
                // to get a value that is either negative, positive, or zero.
                return new Date(b) - new Date(a);
            })
            .map(d => parse_Date(d))
        // parse the data to get per-county data points
        const countyArr = d3.rollups(data, v => v.length, d => d.county);
        let countyData = [];
        for (let i = 0; i < countyArr.length; i++) {
            for (let j = 0; j < data.length; j++) {
                if (countyArr[i][0] === data[j].county) {
                    countyData.push({
                        county: countyArr[i][0],
                        n: countyArr[i][1],
                        county_lat: data[j].county_lat,
                        county_lon: data[j].county_lon
                    });
                }
            }
        }
        // self assignment here lazy. This bit finds unique rows in countyData
        countyData = countyData.filter(
            (v, i, a) => a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i
        );
        // generate the land object
        const land = topojson.feature(ukCounties, ukCounties.objects.UK)
        // generate the projection for our map
        const projection = d3
            .geoAlbersUk()
            .translate([width / 2, height / 2])
        // spike length for map
        const length = d3.scaleLinear([0, d3.max(countyData, d => d.n)], [0, 100])
        // spike function
        const plant_spike = (length, width = 7) =>
            `M${-width / 2},0L0,${-length}L${width / 2},0`

        // DATA MANIPULATION
        const noDupCollections = {
            type: "noDupCollections",
            Vascular:
                data.filter(
                    d =>
                        d.group === "Angiosperms" ||
                        d.group === "Gymnosperms" ||
                        d.group === "Pteridophytes"
                ).length -
                new Set(
                    data
                        .filter(
                            d =>
                                d.group === "Angiosperms" ||
                                d.group === "Gymnosperms" ||
                                d.group === "Pteridophytes"
                        )
                        .map(d => d.taxon_name)
                ).size,
            Bryophytes:
                data.filter(d => d.group === "Bryophytes").length -
                new Set(data.filter(d => d.group === "Bryophytes").map(d => d.taxon_name))
                    .size
        };
        const noSpecimensCollected = {
            type: "noSpecimensCollected",
            Vascular: data.filter(
                d =>
                    d.group === "Angiosperms" ||
                    d.group === "Gymnosperms" ||
                    d.group === "Pteridophytes"
            ).length,
            Bryophytes: data.filter(d => d.group === "Bryophytes").length
        };
        const noSpeciesCollected = {
            type: "noSpeciesCollected",
            Vascular: new Set(
                data
                    .filter(
                        d =>
                            d.group === "Angiosperms" ||
                            d.group === "Gymnosperms" ||
                            d.group === "Pteridophytes"
                    )
                    .map(d => d.taxon_name)
            ).size,
            Bryophytes: new Set(
                data.filter(d => d.group === "Bryophytes").map(d => d.taxon_name)
            ).size
        };
        const noFamiliesCollected = {
            type: "noFamiliesCollected",
            Vascular: new Set(
                data
                    .filter(
                        d =>
                            d.group === "Angiosperms" ||
                            d.group === "Gymnosperms" ||
                            d.group === "Pteridophytes"
                    )
                    .map(d => d.family)
            ).size,
            Bryophytes: new Set(
                data.filter(d => d.group === "Bryophytes").map(d => d.family)
            ).size
        }
        // BARPLOT DATA & FUNCTIONS
        const familyBarPlotData = Object.assign(
            [
                {
                    type: "Vascular ",
                    value: noFamiliesCollected.Vascular,
                    group: "family",
                    phaseLabel: `Phase 1 vascular target: ${phase1FamTarget.Vascular}`,
                    yMax: phase1FamTarget.Vascular
                },
                {
                    type: "Bryophtye ",
                    value: noFamiliesCollected.Bryophytes,
                    group: "family",
                    phaseLabel: `Phase 1 bryophyte target: ${phase1FamTarget.Bryophytes}`,
                    yMax: phase1FamTarget.Bryophytes
                }
            ],
            { xLab: "Family" }
        );
        const speciesBarPlotData = Object.assign(
            [
                {
                    type: "Vascular",
                    value: noSpeciesCollected.Vascular,
                    group: "species",
                    phaseLabel: `Phase 1 vascular target: ${phase1SpTarget.Vascular}`,
                    yMax: phase1SpTarget.Vascular
                },
                {
                    type: "Bryophyte",
                    value: noSpeciesCollected.Bryophytes,
                    group: "species",
                    phaseLabel: `Phase 1 bryophyte target: ${phase1SpTarget.Bryophytes}`,
                    yMax: phase1SpTarget.Bryophytes
                }
            ],
            { xLab: "Species" }
        );
        const x = d3
            .scaleBand()
            .domain(familyBarPlotData.map(d => d.type))
            .range([margin.left, width / 4]);
        const x2 = d3
            .scaleBand()
            .domain(speciesBarPlotData.map(d => d.type))
            .range([width / 4 + 25, width / 2]); // +25 moves barplot to right slightly
        const xAxis = g =>
            g
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x).tickSizeOuter(0))
                .call(g =>
                    g
                        .select(".tick text")
                        .clone()
                        .attr("x", x.bandwidth() / 2 - 20)
                        .attr("y", 25)
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .text(familyBarPlotData.xLab)
                );
        const xAxis2 = g =>
            g
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(x2).tickSizeOuter(0))
                .call(g =>
                    g
                        .select(".tick text")
                        .clone()
                        .attr("x", x2.bandwidth() / 2 - 20)
                        .attr("y", 25)
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .text(speciesBarPlotData.xLab)
                );
        const y = d3
            .scaleLinear()
            .domain([0, phase1FamTarget.Vascular])
            .range([height - margin.bottom, margin.top + 180]);
        const y2 = d3
            .scaleLinear()
            .domain([0, phase1SpTarget.Vascular])
            .range([height - margin.bottom, margin.top + 180]);
        const yAxis = g =>
            g
                .attr("class", "yAxis")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(y))
                .call(g => g.select(".domain").remove())
                .call(g =>
                    g
                        .select(".tick:last-of-type text")
                        .clone()
                        .attr("x", 3)
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("class", "show-phase1_1")
                        .html(" ") // blank html to edit on hover.
                );
        const yAxis2 = g =>
            g
                .attr("class", "yAxis")
                .attr("transform", `translate(${width / 4 + 25},0)`)
                .call(d3.axisLeft(y2))
                .call(g => g.select(".domain").remove())
                .call(g =>
                    g
                        .select(".tick:last-of-type text")
                        .clone()
                        .attr("x", 3)
                        .attr("text-anchor", "start")
                        .attr("font-weight", "bold")
                        .attr("class", "show-phase1_2")
                        .html(" ")
                );

        // THE PLOT ITSELF

        const path = d3.geoPath(projection);

        const svg = d3
            .select("example")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // title and text at top
        // text will probably want to be amended
        const title = svg.append('g');
        title.append('g').call(addTitle, 'DToL Plant Sampling group summary');
        const para = svg.append('g');
        para
            .append('g')
            .call(
                addText,
                `This chart documents the progress made so far in the collections of plant samples for the DToL project, from the ${dateData[dateData.length - 1]
                } to ${dateData[0]}. Out of ${totalBItargetSpNeo.Bryophytes +
                totalBItargetSpNeo.Vascular} target species, ${noSpeciesCollected.Bryophytes +
                noSpeciesCollected.Vascular} have been collected. In terms of plant families - out of ${totalBItargetFamNeo.Bryophytes +
                totalBItargetFamNeo.Vascular}, ${noFamiliesCollected.Bryophytes +
                noFamiliesCollected.Vascular} have been collected. There have been ${noDupCollections.Bryophytes +
                noDupCollections.Vascular} duplicate collections. Overall, ${noSpecimensCollected.Bryophytes +
                noSpecimensCollected.Vascular} specimens have been collected. The bar chart below splits these totals by vascular and bryophyte collections.`
            );

        // move the map
        const transX = 150,
            transY = 90;

        const counties = svg
            .append("g")
            .selectAll("path")
            .data(land.features)
            .join("path")
            .attr("class", "provinceShape")
            .attr("stroke", "white")
            .attr("fill", "#e0e0e0")
            .attr("transform", d => `translate(${transX},${transY})`)
            .attr("d", path);

        // add the lat long for individual points
        countyData.forEach(function (d) {
            var coords = projection([d.county_lon, d.county_lat]);
            d.position = [coords[0], coords[1]];
        });

        const spikes = svg
            .append("g")
            .attr("fill", "green")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "green")
            .attr("class", "spikes")
            .selectAll("path")
            .data(countyData)
            .join("path")
            .attr("transform", d => `translate(${d.position})`)
            .attr("d", d => plant_spike(length(d.n)));

        spikes.append("title").text(d => `${d.county}`);

        svg
            .selectAll(".spikes")
            .attr("transform", d => `translate(${transX},${transY})`);

        const legend = svg
            .append("g")
            .attr("fill", "#777")
            .attr("text-anchor", "middle")
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .attr("class", "legend")
            .selectAll("g")
            .data(
                length
                    .ticks(6)
                    .slice(1)
                    .reverse()
            )
            .join("g")
            .attr("transform", (d, i) => `translate(${1 - (i + 1) * 18},0)`);
        legend
            .append("path")
            .attr("fill", "green")
            .attr("fill-opacity", 0.3)
            .attr("stroke", "green")
            .attr("d", d => plant_spike(length(d)));

        legend
            .append("text")
            .attr("dy", "1.3em")
            .text(length.tickFormat(4, "s"));

        // move the legend around
        svg
            .selectAll(".legend")
            .attr(
                "transform",
                d => `translate(${width - margin.right},${height - margin.top - 300})`
            );

        const bars = svg
            .append("g")
            .attr("fill", "steelblue")
            .selectAll("rect")
            .data(familyBarPlotData)
            .join("rect")
            .style("mix-blend-mode", "multiply")
            .attr("fill", d => (d.group === "family" ? "#a1d99b" : "#e5f5e0"))
            .attr("x", d => x(d.type))
            .attr("y", d => y(d.value))
            .attr("height", d => y(0) - y(d.value))
            .attr("width", x.bandwidth() - 5)
            // bit of interactivity
            .on("pointerenter", function (event, d) {
                // change opacity
                d3.select(this).attr("fill-opacity", 0.6);
                // make value appear above bar
                d3.select(this.parentNode)
                    .append("text")
                    .attr("class", "hover-value")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "14px")
                    .attr("fill", "black")
                    .attr("x", _ => x(d.type) + x.bandwidth() / 3)
                    .attr("y", _ => y(d.value) - 10)
                    .text(d.value);
                // change yaxis label
                d3.select(".show-phase1_1").text(_ => d.phaseLabel);
            })
            .on("pointerout", function (event, d) {
                d3.select(this).attr("fill-opacity", 1);
                d3.select(".hover-value").remove();
                d3.select(".show-phase1_1").text(_ => "");
            });

        // add lines for the species and family targets
        // phase1SpTarget, phase1FamTarget

        const gx = svg.append("g").call(xAxis);

        const gy = svg.append("g").call(yAxis);

        const bars2 = svg
            .append("g")
            .attr("fill", "steelblue")
            .selectAll("rect")
            .data(speciesBarPlotData)
            .join("rect")
            .style("mix-blend-mode", "multiply")
            .attr("fill", d => (d.group === "family" ? "#a1d99b" : "#e5f5e0"))
            .attr("x", d => x2(d.type))
            .attr("y", d => y2(d.value))
            .attr("height", d => y2(0) - y2(d.value))
            .attr("width", x2.bandwidth() - 5)
            // bit of interactivity
            .on("pointerenter", function (event, d) {
                // change opacity
                d3.select(this).attr("fill-opacity", 0.6);
                // make value appear above bar
                d3.select(this.parentNode)
                    .append("text")
                    .attr("class", "hover-value")
                    .attr("font-family", "sans-serif")
                    .attr("font-size", "14px")
                    .attr("fill", "black")
                    .attr("x", _ => x2(d.type) + x2.bandwidth() / 3)
                    .attr("y", _ => y2(d.value) - 10)
                    .text(d.value);
                // change yaxis label
                d3.select(".show-phase1_2").text(_ => d.phaseLabel);
            })
            .on("pointerout", function (event, d) {
                d3.select(this).attr("fill-opacity", 1);
                d3.select(".hover-value").remove();
                d3.select(".show-phase1_2").text(_ => "");
            });

        // add lines for the species and family targets
        // phase1SpTarget, phase1FamTarget

        const gx2 = svg.append("g").call(xAxis2);

        const gy2 = svg.append("g").call(yAxis2);

    })
})

// global definitions
// width and height
const width = 700,
    height = 700;
const margin = { left: 30, right: 20, top: 20, bottom: 50 }

// hardcoded species and family targets
const phase1FamTarget = { type: "phase1FamTarget", Vascular: 132, Bryophytes: 128 };
const phase1SpTarget = { type: "phase1SpTarget", Vascular: 275, Bryophytes: 450 };
const totalBItargetFamNeo = {
    type: "totalBItargetFamNeo",
    Vascular: 132,
    Bryophytes: 128
}
const totalBItargetSpNeo = {
    type: "totalBItargetSpNeo",
    Vascular: 1648,
    Bryophytes: 1098
}


// functions used above

function parse_Date(date) {
    const dtf = new Intl.DateTimeFormat('en', {
        year: 'numeric',
        month: 'short',
        day: '2-digit'
    });
    const [{ value: mo }, , { value: da }, , { value: ye }] = dtf.formatToParts(
        date
    );
    return `${da}-${mo}-${ye}`;
}

const addTitle = (g, title, type = 'title') =>
    g
        .attr(
            'transform',
            `translate(${margin.left * 0.5}, ${height * 0.075 +
            (type == 'subtitle' ? 25 : 0)})`
        )
        .attr("font-family", "sans-serif")
        .attr("font-weight", 700)
        .attr("font-size", "28px")
        .append('text')
        .attr('class', type)
        .text(title)

const addText = (g, text, type = 'para') =>
    g
        .append("foreignObject")
        .attr("width", width)
        .attr("height", height / 6)
        .attr('transform', `translate(${margin.left * 0.5}, ${height * 0.11})`)
        .attr("font-family", "sans-serif")
        .attr("font-weight", 200)
        .attr("font-size", "14px")
        .append('xhtml:div')
        .style("color", "black")
        .attr('class', type)
        .html(`<p>${text}</p>`)