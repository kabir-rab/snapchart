let jsonRes;
let chartTooltip = {
    format: {
        value: d3.format(',') //apply to all
    },
    contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
        var htmlElement = '';
        var $$ = this,
            config = $$.config,
            titleFormat = config.tooltip_format_title || defaultTitleFormat,
            nameFormat = config.tooltip_format_name || function(name) { return name; },
            valueFormat = config.tooltip_format_value || defaultValueFormat,
            titleText, title, value, name, bgColour, i = 0;
        d.forEach(function(dataPoint) {
            if (!titleText) {
                title = titleFormat ? titleFormat(dataPoint.x) : dataPoint.x;
                titleText = (title || title === 0 ? title : "");
            }
        });
        htmlElement += '<div class="chart-tooltip"><div><div class="text-center"><b>' + titleText + '</b></div>';
        d.forEach(function(dataPoint) {
            name = nameFormat(dataPoint.name);
            value = valueFormat(dataPoint.value, dataPoint.ratio, dataPoint.id, dataPoint.index);
            bgColour = $$.levelColor ? $$.levelColor(dataPoint.value) : color(dataPoint.id);
            htmlElement += '<span style="width: 10px; height: 10px; background-color:' + bgColour + '; display: inline-block; margin-right: 5px;" >  </span>'
            htmlElement += '<span>' + name + ': </span><span>' + value + '</span><br/>';
            i++
        });
        htmlElement += '<div></div>';
        return htmlElement;
    }
};

const tsv2arr = (tsv) => {
    const [headers, ...rows] = tsv.trim().split('\n').map(r => r.split(" "))
    return rows.reduce((a, r) => [
        ...a,
        Object.assign(...(r.map(
            (x, i, _, c = x.trim()) => ({
                [headers[i].trim()]: isNaN(c) ? c : Number(c)
            })
        )))
    ], [])
}

function showElement(element) {
    switch (element) {
        case 'error':
            document.getElementById('btn-try').style.display = 'block';
            break;
        case 'chart-render':
            document.getElementById('btn-try').style.display = 'block';
            break;
        default:
            document.getElementById('btn-try').style.display = 'none';
    }
    document.getElementById('chart-pick').style.display = 'none';
    document.getElementById('chart-render').style.display = 'none';
    document.getElementById('data-process').style.display = 'none';
    document.getElementById('landing').style.display = 'none';
    document.getElementById('error').style.display = 'none';

    document.getElementById(element).style.display = 'block';
}

function renderBarChart(data) {
    showElement('chart-render')
    var chart = c3.generate({
        bindto: '#chart',
        data: {
            json: data,
            keys: {
                x: 'Names', // can be used when x is specified as category
                value: ['Scores'],
            },
            type: 'bar'
        },
        axis: {
            /* rotated: true, */
            x: {
                type: 'category',
                categories: data,
                label: {
                    text: 'Name',
                    position: 'center'
                }
            },
            y: {
                show: true
            }
        },
        bar: {
            width: {
                ratio: 0.5 // this makes bar width 50% of length between ticks
            }
            // or
            //width: 100 // this makes bar width 100px
        },
        tooltip: chartTooltip
    });
}

function renderPieChart(originalData) {
    var data = {};
    var value = [];
    showElement('chart-render')
    originalData.forEach(function(d) {
        data[d.Names] = d.Scores;
        value.push(d.Names);
    });
    var chart = c3.generate({
        bindto: '#chart',
        data: {
            json: [data],
            keys: {
                value: value
            },
            type: 'pie'
        },
        tooltip: chartTooltip
    })
}

function renderDonutChart(originalData) {
    var data = {};
    var value = [];
    showElement('chart-render')
    originalData.forEach(function(d) {
        data[d.Names] = d.Scores;
        value.push(d.Names);
    });
    var chart = c3.generate({
        bindto: '#chart',
        data: {
            json: [data],
            keys: {
                value: value
            },
            type: 'donut'
        },
        donut: {
            width: 40,
            label: {
                show: false
            }
        },
        tooltip: chartTooltip
    })
}


function tesseractRead() {
    showElement('data-process')
    const exampleImage = document.getElementById('image-file').files[0];
    document.getElementById('image-file').value = null;
    //console.log(exampleImage, "image");    
    const worker = Tesseract.createWorker({
        logger: m => console.log(m)
    });
    Tesseract.setLogging(true);
    work();
    async function work() {
        try {
            await worker.load();
            await worker.loadLanguage('eng');
            await worker.initialize('eng');

            let result = await worker.detect(exampleImage);
            //console.log(result.data);

            result = await worker.recognize(exampleImage);
            //console.log(result.data);
            console.log(result.data.text, "data");

            jsonRes = tsv2arr(result.data.text);
            //console.log(jsonRes, "json data");
            showElement('chart-pick');

            await worker.terminate();
        } catch (err) {
            showElement('error');
            document.getElementById('err-message').innerHTML = err.message;
        }
    }
}