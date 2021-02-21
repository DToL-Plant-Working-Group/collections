// load json of counties
d3.json("../data/uk.json").then(function (ukCounties, JSONerror) {
    if (JSONerror) return console.warn(JSONerror);
    d3.json("../data/ireland.json").then(function (irelandCounties, JSONerror) {
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
                .map(d => parse_Date(d));
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
            };
            // self assignment here lazy. This bit finds unique rows in countyData
            countyData = countyData.filter(
                (v, i, a) => a.findIndex(t => JSON.stringify(t) === JSON.stringify(v)) === i
            );
            // generate the land object
            const ukLand = topojson.feature(ukCounties, ukCounties.objects.UK);
            const irelandLand = topojson.feature(irelandCounties, irelandCounties.objects.IRL_adm1);
            // generate the projection for our map
            const projection = d3
                .geoAlbersUk()
                .translate([width / 2, height / 2]);
            // spike length for map
            const length = d3.scaleLinear([0, d3.max(countyData, d => d.n)], [0, 100]);
            // spike function
            const plant_spike = (length, width = 7) =>
                `M${-width / 2},0L0,${-length}L${width / 2},0`;

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
            const noGeneraCollected = {
                type: "noGeneraCollected",
                Vascular: new Set(
                    data
                        .filter(
                            d =>
                                d.group === "Angiosperms" ||
                                d.group === "Gymnosperms" ||
                                d.group === "Pteridophytes"
                        )
                        .map(d => d.genus)
                ).size,
                Bryophytes: new Set(
                    data.filter(d => d.group === "Bryophytes").map(d => d.genus)
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
            };
            // BARPLOT DATA & FUNCTIONS
            const familyTargetData = Object.assign(
                [
                    {
                        type: " ",
                        vascular: noFamiliesCollected.Vascular,
                        bryophytes: noFamiliesCollected.Bryophytes,
                        xMax: totalBItargetFamNeo.Vascular + totalBItargetFamNeo.Bryophytes
                    }
                ],
                { columns: ["type", "vascular", "bryophytes", "xMax"] },
                { yLab: "Number of plant families collected" }
            );
            const series = d3
                .stack()
                .keys(familyTargetData.columns.slice(1))(familyTargetData)
                .map(d => (d.forEach(v => (v.key = d.key)), d));

            const familyBarPlotData = Object.assign(
                [
                    {
                        type: "Vascular ",
                        value: noFamiliesCollected.Vascular,
                        group: "family",
                        yMax: noFamiliesCollected.Vascular + 10
                    },
                    {
                        type: "Bryophtye ",
                        value: noFamiliesCollected.Bryophytes,
                        group: "family",
                        yMax: noFamiliesCollected.Bryophytes + 10
                    },
                    {
                        type: "All ",
                        value: noFamiliesCollected.Vascular + noFamiliesCollected.Bryophytes,
                        group: "family",
                        yMax: noFamiliesCollected.Vascular + noFamiliesCollected.Bryophytes + 10
                    }
                ],
                { xLab: "Family" }
            );
            const genusBarPlotData = Object.assign(
                [
                    {
                        type: "Vascular",
                        value: noGeneraCollected.Vascular,
                        group: "genus",
                        yMax: noGeneraCollected.Vascular + 20
                    },
                    {
                        type: "Bryophyte",
                        value: noGeneraCollected.Bryophytes,
                        group: "genus",
                        yMax: noGeneraCollected.Bryophytes + 20
                    },
                    {
                        type: "All",
                        value: noGeneraCollected.Vascular + noGeneraCollected.Bryophytes,
                        group: "genus",
                        yMax: noGeneraCollected.Vascular + noGeneraCollected.Bryophytes + 20
                    }
                ],
                { xLab: "Genus" }
            );
            const speciesBarPlotData = Object.assign(
                [
                    {
                        type: "Vascular",
                        value: noSpeciesCollected.Vascular,
                        group: "species",
                        yMax: noSpeciesCollected.Vascular + 20
                    },
                    {
                        type: "Bryophyte",
                        value: noSpeciesCollected.Bryophytes,
                        group: "species",
                        yMax: noSpeciesCollected.Bryophytes + 20
                    },
                    {
                        type: "All",
                        value: noSpeciesCollected.Vascular + noSpeciesCollected.Bryophytes,
                        group: "species",
                        yMax: noSpeciesCollected.Vascular + noSpeciesCollected.Bryophytes + 20
                    }
                ],
                { xLab: "Species" }
            );

            // Axes.
            const x0 = d3
                .scaleLinear()
                .domain([0, totalBItargetFamNeo.Vascular + totalBItargetFamNeo.Bryophytes])
                .range([margin.left, width - margin.right]);
            // FIXME these horrible range definitions...
            const x1 = d3
                .scaleBand()
                .domain(familyBarPlotData.map(d => d.type))
                .range([margin.left, (width - margin.left - margin.right) / 3])
                .padding(0.1);
            const x2 = d3
                .scaleBand()
                .domain(genusBarPlotData.map(d => d.type))
                .range([
                    (width - margin.left - margin.right) / 3 + 50,
                    ((width - margin.left - margin.right) / 3) * 2 + 20
                ])
                .padding(0.1);
            const x3 = d3
                .scaleBand()
                .domain(speciesBarPlotData.map(d => d.type))
                .range([453.3333333333333 + 50, 453.3333333333333 + 187 + 50])
                .padding(0.1);
            const xAxis0 = g =>
                g
                    .attr("transform", `translate(0,${height * 0.12})`)
                    .call(d3.axisTop(x0))
                    .call(g => g.select(".tick:last-of-type text").attr("fill", "red"));
            const xAxis1 = g =>
                g
                    .attr("transform", `translate(0,${height * 0.45})`)
                    .call(d3.axisBottom(x1).tickSizeOuter(0))
                    .call(g =>
                        g
                            .select(".tick text")
                            .clone()
                            .attr("x", x1.bandwidth())
                            .attr("y", 25)
                            .attr("text-anchor", "middle")
                            .attr("font-weight", "bold")
                            .text(familyBarPlotData.xLab)
                    );
            const xAxis2 = g =>
                g
                    .attr("transform", `translate(0,${height * 0.45})`)
                    .call(d3.axisBottom(x2).tickSizeOuter(0))
                    .call(g =>
                        g
                            .select(".tick text")
                            .clone()
                            .attr("x", x2.bandwidth())
                            .attr("y", 25)
                            .attr("text-anchor", "middle")
                            .attr("font-weight", "bold")
                            .text(genusBarPlotData.xLab)
                    );
            const xAxis3 = g =>
                g
                    .attr("transform", `translate(0,${height * 0.45})`)
                    .call(d3.axisBottom(x3).tickSizeOuter(0))
                    .call(g =>
                        g
                            .select(".tick text")
                            .clone()
                            .attr("x", x3.bandwidth())
                            .attr("y", 25)
                            .attr("text-anchor", "middle")
                            .attr("font-weight", "bold")
                            .text(speciesBarPlotData.xLab)
                    );
            const y0 = d3
                .scaleBand()
                .domain(familyTargetData.map(d => d.type))
                .range([height * 0.19, height * 0.12])
                .padding(0.1);
            const y1 = d3
                .scaleLinear()
                .domain([0, familyBarPlotData[2].yMax])
                .range([height * 0.45, height * 0.25]);
            const y2 = d3
                .scaleLinear()
                .domain([0, genusBarPlotData[2].yMax])
                .range([height * 0.45, height * 0.25]);
            const y3 = d3
                .scaleLinear()
                .domain([0, speciesBarPlotData[2].yMax])
                .range([height * 0.45, height * 0.25]);
            const yAxis0 = g =>
                g
                    .attr("class", "yAxis")
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(y0))
                    .call(g => g.select(".tick").remove());
            const yAxis1 = g =>
                g
                    .attr("class", "yAxis")
                    .attr("transform", `translate(${margin.left},0)`)
                    .call(d3.axisLeft(y1))
                    .call(g =>
                        g
                            .select(".tick:last-of-type text")
                            .clone()
                            .attr("x", 3)
                            .attr("text-anchor", "start")
                            .attr("font-weight", "bold")
                            .attr("class", "show-phase1_1")
                            .html(" ")
                    );
            const yAxis2 = g =>
                g
                    .attr("class", "yAxis")
                    .attr(
                        "transform",
                        `translate(${(width - margin.left - margin.right) / 3 + 50},0)`
                    )
                    .call(d3.axisLeft(y2))
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
            const yAxis3 = g =>
                g
                    .attr("class", "yAxis")
                    .attr("transform", `translate(${453.3333333333333 + 50},0)`)
                    .call(d3.axisLeft(y3))
                    .call(g =>
                        g
                            .select(".tick:last-of-type text")
                            .clone()
                            .attr("x", 3)
                            .attr("text-anchor", "start")
                            .attr("font-weight", "bold")
                            .attr("class", "show-phase1_3")
                            .html(" ")
                    );

            // make the actual plot
            // make the svg
            const svg = d3.select("example")
                .append("svg")
                .attr("width", width)
                .attr("height", height);

            // add the title
            const title = svg.append('g');
            title.append('g').call(addTitle, 'DToL Plant Sampling Group progress', 0.035);

            // add the introductory sentences
            const para1 = svg.append('g');
            para1
                .append('g')
                .call(
                    addText,
                    `This document charts the progress made so far in the collections of plant samples for the DToL project.  Overall, ${noSpecimensCollected.Bryophytes +
                    noSpecimensCollected.Vascular} specimens have been collected from the ${dateData[dateData.length - 1]
                    } to ${dateData[0]}.`,
                    0.04,
                    0.5
                );

            // add figure 1, the horizontal bar chart
            const bars1 = svg
                .append("g")
                .selectAll("rect")
                .data(series.map(d => d[0]).filter(d => d.key !== "xMax"))
                .join("rect")
                .style("mix-blend-mode", "multiply")
                .attr("fill", d => (d.key === "bryophytes" ? "#e5f5e0" : "#a1d99b"))
                .attr("x", d => x0(d[0]))
                .attr("y", (d, i) => y0(d.data.type))
                .attr("width", d => x0(d[1]) - x0(d[0]))
                .attr("height", y0.bandwidth())
                .append("title")
                .text(
                    d => `${d.key.capitalize()}: ${d[1] - d[0]} families
Total: ${d.data.bryophytes + d.data.vascular}`
                );

            // add the axes for figure 1
            const bars1x = svg.append("g").call(xAxis0);
            const bars1y = svg.append("g").call(yAxis0);

            // add the description for figure 1
            const para2 = svg.append('g');
            para2
                .append('g')
                .call(
                    addText,
                    `Fig. 1 - the bar shows the current number of plant families collected, split by vascular plants and bryophytes. The target is ${totalBItargetFamNeo.Vascular} for vascular plants, and ${totalBItargetFamNeo.Bryophytes} for bryophytes.`,
                    0.19,
                    1.5
                );

            // add the three bar charts which split by family, genus, species (for vascular, bryophyte & total)
            const bars2 = svg
                .append("g")
                .selectAll("rect")
                .data(familyBarPlotData)
                .join("rect")
                .style("mix-blend-mode", "multiply")
                .attr("fill", "#a1d99b")
                .attr("x", d => x1(d.type))
                .attr("y", d => y1(d.value))
                .attr("height", d => y1(0) - y1(d.value))
                .attr("width", x1.bandwidth())
                .append("title")
                .text(d => `${d.type.trim()}: ${d.value} families`);

            // add the axes for figure 2
            const bars2x = svg.append("g").call(xAxis1);
            const bars2y = svg.append("g").call(yAxis1);

            const bars3 = svg
                .append("g")
                .selectAll("rect")
                .data(genusBarPlotData)
                .join("rect")
                .style("mix-blend-mode", "multiply")
                .attr("fill", "#a1d99b")
                .attr("x", d => x2(d.type))
                .attr("y", d => y2(d.value))
                .attr("height", d => y2(0) - y2(d.value))
                .attr("width", x2.bandwidth())
                .append("title")
                .text(d => `${d.type.trim()}: ${d.value} genera`);

            // add the axes for figure 2
            const bars3x = svg.append("g").call(xAxis2);
            const bars3y = svg.append("g").call(yAxis2);

            const bars4 = svg
                .append("g")
                .selectAll("rect")
                .data(speciesBarPlotData)
                .join("rect")
                .style("mix-blend-mode", "multiply")
                .attr("fill", "#a1d99b")
                .attr("x", d => x3(d.type))
                .attr("y", d => y3(d.value))
                .attr("height", d => y3(0) - y3(d.value))
                .attr("width", x3.bandwidth())
                .append("title")
                .text(d => `${d.type.trim()}: ${d.value} species`);

            // add the axes for figure 2
            // future Max, please sort out the axes positioning behind the scenes
            const bars4x = svg.append("g").call(xAxis3);
            const bars4y = svg.append("g").call(yAxis3);

            // add the description for figure 2
            const para3 = svg.append('g');
            para3
                .append('g')
                .call(
                    addText,
                    `Fig. 2 - bar charts split by family, genus, and species which show the number of taxa collected at each taxonomic level.`,
                    0.48,
                    1.5
                );

            // the c-value distribution would be here, but no data yet...

            // go on to the map

            const path = d3.geoPath(projection);
            // move the map
            const transX = 0,
                transY = height * 0.2;
            const ukCounties_ = svg
                .append("g")
                .selectAll("path")
                .data(ukLand.features)
                .join("path")
                .attr("class", "provinceShape")
                .attr("stroke", "white")
                .attr("fill", "#e0e0e0")
                .attr("transform", d => `translate(${transX},${transY})`)
                .attr("d", path);

            const irelandCounties_ = svg
                .append("g")
                .selectAll("path")
                .data(irelandLand.features)
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
                    d => `translate(${width - margin.right},${height * 0.8})`
                );

            // add the description for figure 3(4)
            const para4 = svg.append('g');
            para4
                .append('g')
                .call(
                    addText,
                    `Fig. 3 - spike map of Great Britain and Ireland, showing areas where samples have been collected so far.`,
                    0.87,
                    1.5
                );

            const footer = svg.append('g');
            footer
                .append('g')
                .call(
                    footNote,
                    `Created by Max Brown, Lucia Campos-Dominguez, and Alex Twyford.`,
                    0.97,
                    1.5
                );
        })
    })
});

// global definitions
// width and height
const width = 700,
    height = 1400;
const margin = { left: 30, right: 20, top: 20, bottom: 50 };

// hardcoded species and family targets
const phase1FamTarget = { type: "phase1FamTarget", Vascular: 132, Bryophytes: 128 };
const phase1SpTarget = { type: "phase1SpTarget", Vascular: 275, Bryophytes: 450 };
const totalBItargetFamNeo = {
    type: "totalBItargetFamNeo",
    Vascular: 132,
    Bryophytes: 128
};
const totalBItargetSpNeo = {
    type: "totalBItargetSpNeo",
    Vascular: 1648,
    Bryophytes: 1098
};


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
};

const addTitle = (g, title, scale, type = 'title') =>
    g
        .attr(
            'transform',
            `translate(${margin.left * 0.5}, ${height * scale +
            (type == 'subtitle' ? 25 : 0)})`
        )
        .attr("font-family", "sans-serif")
        .attr("font-weight", 700)
        .attr("font-size", "28px")
        .append('text')
        .attr('class', type)
        .text(title)

const addText = (g, text, hscale, wscale) =>
    g
        .append("foreignObject")
        .attr("width", width - 100)
        .attr("height", height / 6)
        .attr('transform', `translate(${margin.left * wscale}, ${height * hscale})`)
        .attr("font-family", "sans-serif")
        .attr("font-weight", 200)
        .attr("font-size", "14px")
        .append('xhtml:div')
        .style("color", "black")
        .attr('class', 'paragraph')
        .html(`<p>${text}</p>`)

const footNote = (g, text, hscale, wscale) =>
    g
        .append("foreignObject")
        .attr("width", width - 100)
        .attr("height", height / 6)
        .attr('transform', `translate(${margin.left * wscale}, ${height * hscale})`)
        .attr("font-family", "sans-serif")
        .attr("font-weight", 100)
        .attr("font-size", "12px")
        .append('xhtml:div')
        .style("color", "grey")
        .attr('class', 'paragraph')
        .html(`<p>${text}</p>`)

String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}