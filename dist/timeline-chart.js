(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod);
        global.TimelineChart = mod.exports;
    }
})(this, function (module) {
    'use strict';

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var _createClass = function () {
        function defineProperties(target, props) {
            for (var i = 0; i < props.length; i++) {
                var descriptor = props[i];
                descriptor.enumerable = descriptor.enumerable || false;
                descriptor.configurable = true;
                if ("value" in descriptor) descriptor.writable = true;
                Object.defineProperty(target, descriptor.key, descriptor);
            }
        }

        return function (Constructor, protoProps, staticProps) {
            if (protoProps) defineProperties(Constructor.prototype, protoProps);
            if (staticProps) defineProperties(Constructor, staticProps);
            return Constructor;
        };
    }();

    var TimelineChart = function () {
        function TimelineChart(element, data, opts) {
            _classCallCheck(this, TimelineChart);

            var self = this;

            element.classList.add('timeline-chart');

            var options = this.extendOptions(opts);

            var allElements = data.reduce(function (agg, e) {
                return agg.concat(e.data);
            }, []);

            var minDt = d3.min(allElements, this.getPointMinDt);
            var maxDt = d3.max(allElements, this.getPointMaxDt);
            // zoom out just slightly, to allow for a little space on either end of the timeline
            var dateDelta = maxDt.getTime() - minDt.getTime();
            var zoomOutPct = .02; // 2%
            minDt = new Date(minDt.getTime() - dateDelta * zoomOutPct);
            maxDt = new Date(maxDt.getTime() + dateDelta * zoomOutPct);

            var elementWidth = options.width || element.clientWidth || 600;
            var elementHeight = options.height || element.clientHeight || 200;

            var margin = {
                top: 20,
                right: 0,
                bottom: 0, // set to about 20 for a bottom-aligned axis
                left: 0
            };

            var width = elementWidth - margin.left - margin.right;
            var height = elementHeight - margin.top - margin.bottom;

            // Width of the series label area
            var groupWidth = options.hideGroupLabels ? 0 : 400;
            // Height of each section containing a horizontal series.  By default, fit each series into the available vertical space.
            var groupHeight = height / data.length;

            // If the groupHeight option is set, then use its value for the height of each series, and set the total height accordingly.
            if (!!options.groupHeight) {
                groupHeight = options.groupHeight;
                height = groupHeight * data.length;
            }

            var xTimeScale = d3.time.scale().domain([minDt, maxDt]).range([groupWidth, width]);

            // X axis ticks
            var xAxis = d3.svg.axis().scale(xTimeScale).orient('top') // set to 'bottom' for a bottom-aligned axis and to 'top' for a top-aligned axis
            .tickSize(height); // set to height for a bottom-aligned axis and to -height for a top-aligned axis

            // In order to upgrade from v3 to v4, this needs to change.
            // See here:  https://coderwall.com/p/psogia/simplest-way-to-add-zoom-pan-on-d3-js
            var zoom = d3.behavior.zoom().x(xTimeScale).on('zoom', zoomed);

            var svg = d3.select(element).append('svg').attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom);

            // All elements affected by the zooming behavior are created in the zoom() fn.
            var svg_g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')').call(zoom);

            var clipPathRect = svg_g.append('defs').append('clipPath').attr('id', 'chart-content').append('rect').attr('x', groupWidth).attr('y', 0).attr('height', height).attr('width', width - groupWidth);

            // Invisible rect covering chart bounds, ensuring that all interactions intended for the chart will be raised as events on SVG elements
            var interactionRect = svg_g.append('rect').attr('class', 'chart-bounds').attr('x', groupWidth).attr('y', 0).attr('height', height).attr('width', width - groupWidth);

            if (options.enableLiveTimer) {
                self.now = svg_g.append('line').attr('clip-path', 'url(#chart-content)').attr('class', 'vertical-marker now').attr("y1", 0).attr("y2", height);
            }

            var c20 = d3.scale.category20c();
            var seriesBackground = svg_g.selectAll('.series-background').data(data).enter().append('rect').attr('class', 'series-background').attr('x', 0).attr('y', function (d, i) {
                return groupHeight * i;
            }).attr('width', width).attr('height', groupHeight).style('fill', function (d, i) {
                //return c20(Math.floor((4*(d.groupingKey || i - 3)/3)));
                return c20(d.groupingKey || i);
            });

            // horizontal lines between groups.  (This used to use the 'group-section' class, but is now using the 'series' terminology.)
            var seriesDividers = svg_g.selectAll('.series-divider').data(data).enter().append('line').attr('class', 'series-divider').attr('x1', 0).attr('x2', width).attr('y1', function (d, i) {
                return groupHeight * (i + 1);
            }).attr('y2', function (d, i) {
                return groupHeight * (i + 1);
            });

            // Axis with labels and ticks
            svg_g.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + height + ')').call(xAxis);

            // Monitor for change in size of containing element
            setInterval(handleWidthChange, 1000);

            function handleWidthChange() {
                var newWidth = element.clientWidth - margin.left - margin.right - 2;

                if (newWidth != width) {
                    //console.log('xTimeScale', xTimeScale);
                    //console.log("old width: ", width);
                    //console.log("new width: ", newWidth);
                    width = newWidth;

                    svg.attr("width", width);
                    seriesDividers.attr('x2', width);
                    seriesBackground.attr('width', width);
                    clipPathRect.attr("width", width);
                    interactionRect.attr("width", width - groupWidth);
                    xTimeScale.range([xTimeScale.range()[0], width]);
                    zoomed();
                }
            }

            // heading / label text (for each series)
            if (!options.hideGroupLabels) {
                var groupLabels = svg_g.selectAll('.series-label').data(data).enter().append('text').attr('class', 'series-label').attr('x', '0.5em') //0)
                .attr('y', function (d, i) {
                    return groupHeight * i + groupHeight / 2; //+ 5.5;
                }).attr('dx', '0.5em').attr('dy', '0') //'0.5em')
                .text(function (d) {
                    return d.label;
                }).call(wrap, groupWidth);

                var lineSection = svg_g.append('line').attr('x1', groupWidth).attr('x2', groupWidth).attr('y1', 0).attr('y2', height).attr('stroke', 'orange');
            }

            var groupIntervalItems = svg_g.selectAll('.series-interval-item').data(data).enter().append('g').attr('clip-path', 'url(#chart-content)').attr('class', 'item').attr('transform', function (d, i) {
                return 'translate(0, ' + groupHeight * i + ')';
            }).selectAll('.dot').data(function (d) {
                return d.data.filter(function (_) {
                    return _.type === TimelineChart.TYPE.INTERVAL;
                });
            }).enter();

            var intervalBarHeight = 0.8 * groupHeight;
            var intervalBarMargin = (groupHeight - intervalBarHeight) / 2;
            var intervals = groupIntervalItems.append('rect').attr('class', withCustom('interval')).attr('width', function (d) {
                return Math.max(options.intervalMinWidth, xTimeScale(d.to) - xTimeScale(d.from));
            }).attr('height', intervalBarHeight).attr('y', intervalBarMargin).attr('x', function (d) {
                return xTimeScale(d.from);
            }).on('click', function (d) {
                !d.onClick || d.onClick(d);
            });

            // interval text
            var intervalTexts = groupIntervalItems.append('text').text(function (d) {
                return d.label || '';
            }) //  (typeof(d.label) === 'function' ? d.label(d) : d.label) || '')
            .attr('fill', 'white').attr('class', withCustom('interval-text')).attr('y', groupHeight / 2 + 5).attr('x', function (d) {
                return xTimeScale(d.from);
            });

            var groupDotItems = svg_g.selectAll('.series-dot-item').data(data).enter().append('g').attr('clip-path', 'url(#chart-content)').attr('class', 'item').attr('transform', function (d, i) {
                return 'translate(0, ' + groupHeight * i + ')';
            }).selectAll('.dot').data(function (d) {
                return d.data.filter(function (_) {
                    return _.type === TimelineChart.TYPE.POINT;
                });
            }).enter();

            var dots = groupDotItems.append('circle').attr('class', withCustom('dot')).attr('cx', function (d) {
                return xTimeScale(d.at);
            }).attr('cy', groupHeight / 2).attr('r', 7).on('click', function (d) {
                !d.onClick || d.onClick(d);
            });

            if (options.tip) {
                if (d3.tip) {
                    var tip = d3.tip().attr('class', 'd3-tip').html(options.tip);
                    svg_g.call(tip);
                    dots.on('mouseover', tip.show).on('mouseout', tip.hide);
                    intervals.on('mouseover', tip.show).on('mouseout', tip.hide);
                } else {
                    console.error('Please make sure you have d3.tip included as dependency (https://github.com/Caged/d3-tip)');
                }
            }

            zoomed();

            if (options.enableLiveTimer) {
                setInterval(updateNowMarker, options.timerTickInterval);
            }

            function wrap(text, width, anchorPosition) {
                text.each(function () {
                    var text = d3.select(this),
                        words = text.text().split(/\s+/).reverse(),
                        word,
                        line = [],
                        lineNumber = 0,
                        lineHeight = 1.1,
                        // ems
                    y = text.attr("y"),
                        dx = parseFloat(text.attr("dx")),
                        dy = parseFloat(text.attr("dy")),
                        lines = [];
                    var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dx", dx + "em").attr("dy", dy + "em");
                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" "));
                        if (tspan.node().getComputedTextLength() > width) {
                            line.pop();
                            tspan.text(line.join(" "));
                            line = [word];
                            lines.push(line);
                            tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dx", dx + "em").attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                        }
                    }
                });
            }

            function updateNowMarker() {
                var nowX = xTimeScale(new Date());

                self.now.attr('x1', nowX).attr('x2', nowX);
            }

            function withCustom(defaultClass) {
                return function (d) {
                    return d.customClass ? [d.customClass, defaultClass].join(' ') : defaultClass;
                };
            }

            function zoomed() {
                if (self.onVizChangeFn && d3.event) {
                    self.onVizChangeFn.call(self, {
                        scale: d3.event.scale,
                        translate: d3.event.translate,
                        domain: xTimeScale.domain()
                    });
                }

                if (options.enableLiveTimer) {
                    updateNowMarker();
                }

                svg_g.select('.x.axis').call(xAxis);

                svg_g.selectAll('circle.dot').attr('cx', function (d) {
                    return xTimeScale(d.at);
                });
                svg_g.selectAll('rect.interval').attr('x', function (d) {
                    return xTimeScale(d.from);
                }).attr('width', function (d) {
                    return Math.max(options.intervalMinWidth, xTimeScale(d.to) - xTimeScale(d.from));
                });

                svg_g.selectAll('.interval-text').attr('x', function (d) {
                    var positionData = getTextPositionData.call(this, d);
                    if (positionData.upToPosition - groupWidth - 10 < positionData.textWidth) {
                        return positionData.upToPosition;
                    } else if (positionData.xPosition < groupWidth && positionData.upToPosition > groupWidth) {
                        return groupWidth;
                    }
                    return positionData.xPosition;
                }).attr('text-anchor', function (d) {
                    var positionData = getTextPositionData.call(this, d);
                    if (positionData.upToPosition - groupWidth - 10 < positionData.textWidth) {
                        return 'end';
                    }
                    return 'start';
                }).attr('dx', function (d) {
                    var positionData = getTextPositionData.call(this, d);
                    if (positionData.upToPosition - groupWidth - 10 < positionData.textWidth) {
                        return '-0.5em';
                    }
                    return '0.5em';
                }).text(function (d) {
                    var positionData = getTextPositionData.call(this, d);
                    var percent = (positionData.width - options.textTruncateThreshold) / positionData.textWidth;
                    // (typeof(d.label) === 'function' ? d.label(d) : d.label) || ''
                    var labelText = d.label || ''; //typeof(d.label)==="string" ? d.label : typeof(d.label)==="function" ? d.label(d) : '';
                    if (percent < 1) {
                        if (positionData.width > options.textTruncateThreshold) {
                            //return d.label.substr(0, Math.floor(d.label.length * percent)) + '...';
                            return labelText.substr(0, Math.floor(labelText.length * percent)) + '...';
                        } else {
                            return '';
                        }
                    }

                    return labelText;
                });

                function getTextPositionData(d) {
                    this.textSizeInPx = this.textSizeInPx || this.getComputedTextLength();
                    var from = xTimeScale(d.from);
                    var to = xTimeScale(d.to);
                    return {
                        xPosition: from,
                        upToPosition: to,
                        width: to - from,
                        textWidth: this.textSizeInPx
                    };
                }
            }
        }

        _createClass(TimelineChart, [{
            key: 'extendOptions',
            value: function extendOptions() {
                var ext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                var defaultOptions = {
                    intervalMinWidth: 8, // px
                    tip: undefined,
                    textTruncateThreshold: 30,
                    enableLiveTimer: false,
                    timerTickInterval: 1000,
                    hideGroupLabels: false
                };
                Object.keys(ext).map(function (k) {
                    return defaultOptions[k] = ext[k];
                });
                return defaultOptions;
            }
        }, {
            key: 'getPointMinDt',
            value: function getPointMinDt(p) {
                return p.type === TimelineChart.TYPE.POINT ? p.at : p.from;
            }
        }, {
            key: 'getPointMaxDt',
            value: function getPointMaxDt(p) {
                return p.type === TimelineChart.TYPE.POINT ? p.at : p.to;
            }
        }, {
            key: 'onVizChange',
            value: function onVizChange(fn) {
                this.onVizChangeFn = fn;
                return this;
            }
        }]);

        return TimelineChart;
    }();

    TimelineChart.TYPE = {
        POINT: Symbol(),
        INTERVAL: Symbol()
    };

    module.exports = TimelineChart;
});
//# sourceMappingURL=timeline-chart.js.map
