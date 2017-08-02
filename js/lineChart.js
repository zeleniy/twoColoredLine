class LineChart {


    constructor(config) {

        this._config = config;
        this._data = this._config.data;
        this._extent = this._config.extent;
        this._id = this._getUniqueId();
        this._duration = 1000;

        this._margin = {
            left: 35,
            top: 25,
            right: 35,
            bottom: 25
        };

        this._defaults = {
            height: 400
        };

        d3.select(window).on('resize.' + this._id, function() {
            this.resize();
        }.bind(this));
    }


    static getInstance(config) {

        return new LineChart(config);
    }


    update(data, extent) {

        this._data = data;
        this._extent = extent;

        this._rect.datum(this._extent);
        this._borders.data(this._extent);
        this._path1.datum(this._data);
        this._clipPath.datum(this._extent);
        this._path2.datum(this._data);

        return this.resize();
    }


    renderTo(selector) {

        this._container = d3.select(selector);

        var container = this._container
            .attr('class', 'line-chart')
            .append('div');

        var header = container.append('div')
            .attr('class', 'chart-header');

        var button = header.append('button')
            .text('update')
            .on('click', this._config.clickHandler);

        header.append('div')
            .attr('class', 'chart-title')
            .text(this._config.title);

        header.append('div')
            .style('clear', 'both');

        header.append('div')
            .attr('class', 'chart-description')
            .text(this._config.description);

        header.append('div')
            .style('clear', 'both');

        this._svgContainer = container.append('div')
            .attr('class', 'chart-container');

        var height = this._getOuterHeight();
        var width = this._getOuterWidth();

        this._svg = this._svgContainer
            .append('svg')
            .attr('class', 'line-chart')
            .attr('width', width)
            .attr('height', height);

        this._canvas = this._svg
            .append('g')
            .attr('class', 'canvas');

        this._rect = this._canvas
            .append('rect')
            .datum(this._extent)
            .style('fill', '#e6f7ff');

        this._borders = this._canvas
            .selectAll('line.border')
            .data(this._extent)
            .enter()
            .append('line')
            .attr('class', 'border');

        this._xAxisContainer = this._canvas
            .append('g')
            .attr('class', 'axis x-axis');

        this._yAxisContainer = this._canvas
            .append('g')
            .attr('class', 'axis y-axis');

        var min = this._getYScale().domain()[0];
        var data = JSON.parse(JSON.stringify(this._data)).map(function(d) {
            d.value = min;
            return d;
        });

        this._path1 = this._canvas
            .append('path')
            .attr('class', 'line outer-line')
            .datum(data)
            .attr('d', this._getLineGenerator());

        this._clipPath = this._canvas
            .append('defs')
            .append('clipPath')
            .datum(this._extent)
            .attr('id', 'clip')
            .append('rect');

        this._path2 = this._canvas
            .append('path')
            .attr('class', 'line inner-line')
            .datum(data)
            .attr('clip-path', 'url(#clip)')
            .attr('d', this._getLineGenerator());

        return this.update(this._data, this._extent);
    }


    resize() {

        var xScale = this._getXScale();
        var yScale = this._getYScale();

        var height = this._getOuterHeight()

        this._svg
            .attr('width', this._getOuterWidth())
            // .attr('height', height);

        this._canvas
            .attr('transform', 'translate(' + [this._margin.left, this._margin.top] + ')');

        this._clipPath
            .transition()
            .duration(this._duration)
            .attr('x', 0)
            .attr('y', d => yScale(d[1]))
            .attr('width', this._getInnerWidth())
            .attr('height', d => yScale(d[0]) - yScale(d[1]));

        this._rect
            .transition()
            .duration(this._duration)
            .attr('x', 0)
            .attr('y', d => yScale(d[1]))
            .attr('width', this._getInnerWidth())
            .attr('height', d => yScale(d[0]) - yScale(d[1]));

        this._borders
            .transition()
            .duration(this._duration)
            .attr('x1', 0)
            .attr('y1', yScale)
            .attr('x2', this._getInnerWidth())
            .attr('y2', yScale);

        this._xAxisContainer
            .attr('transform', 'translate(' + [0, this._getInnerHeight()] + ')')
            .transition()
            .duration(this._duration)
            .call(d3.svg.axis().scale(this._getXScale()).orient('bottom')
                .tickSize(- this._getInnerHeight())
                .tickPadding(8)
            );

        this._yAxisContainer
            .transition()
            .duration(this._duration)
            .call(d3.svg.axis().scale(this._getYScale()).orient('left')
                .tickSize(- this._getInnerWidth())
                .tickPadding(8)
            );

        this._originalXScale = this._getXScale().copy();

        this._path1
            .transition()
            .duration(this._duration)
            .attr('d', this._getLineGenerator());

        this._path2
            .transition()
            .duration(this._duration)
            .attr('d', this._getLineGenerator());

        return this;
    }


    _getLineGenerator() {

        var xScale = this._getXScale();
        var yScale = this._getYScale();

        return d3.svg.line()
            .x(function(d) {
                return xScale(d.date);
            }).y(function(d) {
                return yScale(d.value);
            });
    }


    _getXScale() {

        return d3.time.scale()
            .range([0, this._getInnerWidth()])
            .domain(d3.extent(this._data, d => d.date));
    }


    _getYScale() {

        return d3.scale.linear()
            .range([this._getInnerHeight(), 0])
            .domain(this._getYDomain());
    }


    _getYDomain() {

        var domain = d3.extent(this._data, d => d.value);
        var offset = Math.max(Math.abs(domain[0] / 100 * 10), Math.abs(domain[1] / 100 * 10));

        domain[0] -= offset;
        domain[1] += offset;

        return domain;
    }


    _getExtent(value) {

        return value / 100 * 10;
    }


    _getSize() {

        return this._svgContainer.node().getBoundingClientRect();
    }


    _getOuterWidth() {

        return this._getSize().width;
    }


    _getOuterHeight() {

        return this._getSize().height || this._defaults.height;
    }


    _getInnerWidth() {

        return this._getSize().width - this._margin.left - this._margin.right;
    }


    _getInnerHeight() {

        return this._getSize().height - this._margin.top - this._margin.bottom;
    }


    /**
     * Generate unique string.
     * @private
     * @returns {String}
     */
    _getUniqueId() {

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });
    }
}
