class LineChart {


    constructor(config) {

        this._config = config;
        this._data = config.data;
        this._extent = config.extent;
        this._comments = config.comments;
        this._id = this._getUniqueId();

        this._margin = {
            left: 35,
            top: 25,
            right: 35,
            bottom: 20
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


    update(data, extent, comments) {

        this._data = data;
        this._extent = extent;
        this._comments = comments;

        this._rect.datum(this._extent);
        this._borders.data(this._extent);
        this._path1.datum(this._data);
        this._clipPath.datum(this._extent);
        this._path2.datum(this._data);
        this._images.data(this._comments);


        this.resize();
    }


    renderTo(selector) {

        this._container = d3.select(selector);

        var container = this._container
            .attr('class', 'line-chart')
            .append('div');

        var header = container.append('div')
            .attr('class', 'chart-header');

        var button = header.append('button')
            .text('button')
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

        this._path1 = this._canvas
            .append('path')
            .attr('class', 'line')
            .datum(this._data)
            .style('stroke', '#880015');

        this._clipPath = this._canvas
            .append('defs')
            .append('clipPath')
            .datum(this._extent)
            .attr('id', 'clip')
            .append('rect');

        this._path2 = this._canvas
            .append('path')
            .attr('class', 'line')
            .datum(this._data)
            .style('stroke', '#3f48cc')
            .attr('clip-path', 'url(#clip)');

        this._images = this._canvas
            .selectAll('image')
            .data(this._comments)
            .enter()
            .append('image')
            .attr('class', 'comment')
            .attr('xlink:href', 'img/comment.svg')
            .attr('width', 32)
            .attr('height', 32);

        return this.resize();
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
            .attr('x', 0)
            .attr('y', d => yScale(d[1]))
            .attr('width', this._getInnerWidth())
            .attr('height', d => yScale(d[0]) - yScale(d[1]));

        this._rect
            .attr('x', 0)
            .attr('y', d => yScale(d[1]))
            .attr('width', this._getInnerWidth())
            .attr('height', d => yScale(d[0]) - yScale(d[1]));

        this._borders
            .attr('x1', 0)
            .attr('y1', yScale)
            .attr('x2', this._getInnerWidth())
            .attr('y2', yScale);

        this._xAxisContainer
            .attr('transform', 'translate(' + [0, this._getInnerHeight()] + ')')
            .call(d3.axisBottom(this._getXScale())
                .tickSize(- this._getInnerHeight())
            );

        this._yAxisContainer
            .call(d3.axisLeft(this._getYScale())
                .tickSize(- this._getInnerWidth())
            );

        this._originalXScale = this._getXScale().copy();

        this._path1
            .attr('d', this._getLineGenerator());

        this._path2
            .attr('d', this._getLineGenerator());

        this._images
            .attr('x', function(d) {
                return xScale(d.date) - 5;
            }).attr('y', function(d) {
                return yScale(d.value) - 36;
            })


        return this;
    }


    _getLineGenerator() {

        var xScale = this._getXScale();
        var yScale = this._getYScale();

        return d3.line()
            .x(function(d) {
                return xScale(d.date);
            }).y(function(d) {
                return yScale(d.value);
            });
    }


    _getXScale() {

        return d3.scaleTime()
            .range([0, this._getInnerWidth()])
            .domain(d3.extent(this._data, d => d.date));
    }


    _getYScale() {

        return d3.scaleLinear()
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
