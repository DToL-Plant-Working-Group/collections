# Plant collections data

The Darwin Tree of Life repository for an updated interactive chart of sample collection progress (which itself is in progress). 

This is what the result looks like as of 24.02.21:

<img src="./dtol-plant-group.svg">

To run a (minimally) interactive version, go to https://observablehq.com/d/ea10047306c23584, or fire up a local server, e.g.

```bash
cd /path/to/this/cloned/github/repo
python3 -m http.server
```

Then go to http://localhost:8000/ and view results.

### Map data

Ireland from <a href="https://github.com/deldersveld/topojson/blob/master/countries/ireland/ireland-counties.json">here</a> and UK from <a href="https://gist.githubusercontent.com/rveciana/27272a581e975835aaa321ddf816d726/raw/c40062a328843322208b8e98c2104dc8f6ad5301/uk-counties.json">here</a>.