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
        function TimelineChart(element, timelineData, opts) {
            _classCallCheck(this, TimelineChart);

            if (!timelineData || timelineData.constructor != [].constructor || !timelineData.length) return null;

            var self = this;

            element.classList.add('timeline-chart-component');

            var options = this.extendOptions(opts);

            timelineData.forEach(function (series) {
                // Normalize data with respect to at/from/to temporal properties
                series.data.forEach(function (item) {
                    item.at = self.getItemAvgDate(item);
                    item.from = self.getItemMinDate(item);
                    item.to = self.getItemMaxDate(item);
                });
                // Sort items within the series
                var sortedItems = series.data.sort(function (a, b) {
                    return a.at < b.at ? -1 : a.at > b.at ? 1 : 0;
                });
                // On each item, set references to previous and next items
                sortedItems.forEach(function (o, i) {
                    o.prevItem = i == 0 ? null : sortedItems[i - 1];
                    o.nextItem = i == sortedItems.length - 1 ? null : sortedItems[i + 1];
                });
            });

            // flatten grouped data elements into a single array
            var allElements = timelineData.reduce(function (agg, e) {
                return agg.concat(e.data);
            }, []);

            var minDt = d3.min(allElements, self.getItemMinDate);
            var maxDt = d3.max(allElements, self.getItemMaxDate);
            // zoom out just slightly, to allow for a little space on either end of the timeline
            var dateDelta = maxDt.getTime() - minDt.getTime();
            var zoomOutPct = .02; // 2%
            minDt = new Date(minDt.getTime() - dateDelta * zoomOutPct);
            maxDt = new Date(maxDt.getTime() + dateDelta * zoomOutPct);

            var timelineContainer = d3.select(element).append('div').classed('timeline-chart', true);
            var timelineContainerElement = timelineContainer.node();

            var elementWidth = options.width || timelineContainerElement.clientWidth || 600;
            var elementHeight = options.height || timelineContainerElement.clientHeight || 200;

            var margin = {
                top: 20,
                right: 0,
                bottom: 0, // set to about 20 for a bottom-aligned axis
                left: 0
            };

            var dataIdClassPrefix = "_id_";

            var componentWidth = elementWidth - margin.left - margin.right;
            var componentHeight = elementHeight - margin.top - margin.bottom;

            // Width of the series label area
            var groupWidth = options.groupWidth || 400; // options.hideGroupLabels ? 0 : 400;

            // Height of each section containing a horizontal series.  By default, fit each series into the available vertical space.
            var groupHeight = componentHeight / timelineData.length;
            // Otherwise, if the groupHeight option is set, then use its value for the height of each series, and set the total height accordingly.
            if (!!options.groupHeight) {
                groupHeight = options.groupHeight;
                componentHeight = groupHeight * timelineData.length;
            }

            var xTimeScaleOriginal = (options.useUtcTimeScale === true ? d3.scaleUtc() : d3.scaleTime()).domain([minDt, maxDt]).range([groupWidth, componentWidth]);
            var xTimeScaleForContent = xTimeScaleOriginal;

            // X axis ticks
            var xAxis = d3.axisTop(xTimeScaleForContent)
            //.orient('top') // set to 'bottom' for a bottom-aligned axis and to 'top' for a top-aligned axis
            .tickSize(componentHeight); // set to height for a bottom-aligned axis and to -height for a top-aligned axis
            var xAxisScaled = xAxis;

            // In order to upgrade from v3 to v4, this needs to change.
            // See here:  https://coderwall.com/p/psogia/simplest-way-to-add-zoom-pan-on-d3-js
            var zoom = d3.zoom().on('zoom', zoomed).scaleExtent([1, Infinity]).extent([[groupWidth, 0], [componentWidth, componentHeight]]).translateExtent([[groupWidth, 0], [componentWidth, componentHeight]]);

            var svg = self.svgElement = timelineContainer.append('svg').attr('width', componentWidth + margin.left + margin.right).attr('height', componentHeight + margin.top + margin.bottom);

            // All elements affected by the zooming behavior are created in the zoom() fn.
            var svg_g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
            svg_g.call(zoom); //.transform);

            // let selectionFilter = svg_g.append("defs")
            //     .append("filter")
            //     .attr("id",'blurred')
            //     .attr({"x":"-50%", "y":"-50%", "width":"200%", "height":"200%"})
            //     .append("feGaussianBlur").attr("stdDeviation", 12);

            function uuidv4() {
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, function (c) {
                    return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
                });
            }

            var chartContentClipPathId = "chart-content-clip-path-" + uuidv4();
            var clipPathRect = svg_g.append('defs').append('clipPath').attr('id', chartContentClipPathId).append('rect').attr('x', groupWidth).attr('y', 0).attr('height', componentHeight).attr('width', componentWidth - groupWidth);

            // Invisible rect covering chart bounds, ensuring that all interactions intended for the chart will be raised as events on SVG elements
            var interactionRect = svg_g.append('rect').attr('class', 'chart-bounds').attr('x', groupWidth).attr('y', 0).attr('height', componentHeight).attr('width', componentWidth - groupWidth);

            //interactionRect.call(zoom);

            if (options.enableLiveTimer) {
                self.now = svg_g.append('line').attr('clip-path', 'url(#' + chartContentClipPathId + ')').attr('class', 'vertical-marker now').attr("y1", 0).attr("y2", componentHeight);
            }

            var seriesBackground = svg_g.selectAll('.series-background').data(timelineData).enter().append('rect').attr('class', 'series-background').attr('x', 0).attr('y', function (d, i) {
                return groupHeight * i;
            }).attr('width', componentWidth).attr('height', groupHeight).style('fill', function (d, i) {
                // For numeric values of grouping key, use them.  Otherwise, use the supplied index (i).
                var index = Math.abs(Math.floor((d.groupingKey == d.groupingKey * 1 ? d.groupingKey : i) % 10) - 1);
                return d3.schemePastel1[index];
            });

            // horizontal lines between groups.  (This used to use the 'group-section' class, but is now using the 'series' terminology.)
            var seriesDividers = svg_g.selectAll('.series-divider').data(timelineData).enter().append('line').attr('class', 'series-divider').attr('x1', 0).attr('x2', componentWidth).attr('y1', function (d, i) {
                return groupHeight * (i + 1);
            }).attr('y2', function (d, i) {
                return groupHeight * (i + 1);
            });

            var translucentOverlay = svg_g.append('rect').attr('x', groupWidth).attr('y', 0).attr('width', componentWidth - groupWidth).attr('height', componentHeight).style('fill', "#fff").style('fill-opacity', '.25');

            var boundingRect = svg_g.append('rect').attr('x', 0).attr('y', 0).attr('width', componentWidth).attr('height', componentHeight).style('stroke', "#000");

            // Axis with labels and ticks
            var gX = svg_g.append('g').attr('class', 'x axis').attr('transform', 'translate(0,' + componentHeight + ')').call(xAxis);

            // Monitor for change in size of containing element
            setInterval(handleWidthChange, 1000);

            function handleWidthChange() {
                var newWidth = timelineContainerElement.clientWidth - margin.left - margin.right - 2;

                if (newWidth > 0 && newWidth != componentWidth) {
                    componentWidth = newWidth;
                    svg.attr("width", componentWidth);
                    seriesDividers.attr('x2', componentWidth);
                    seriesBackground.attr('width', componentWidth);
                    boundingRect.attr('width', componentWidth);

                    var interactionWidth = componentWidth - groupWidth;
                    translucentOverlay.attr('width', interactionWidth);
                    clipPathRect.attr("width", interactionWidth);
                    interactionRect.attr("width", interactionWidth);

                    xTimeScaleOriginal.range([groupWidth, componentWidth]);
                    xTimeScaleForContent.range([groupWidth, componentWidth]);
                    xAxisScaled = xAxis.scale(xTimeScaleForContent);
                    zoom.extent([[groupWidth, 0], [componentWidth, componentHeight]]).translateExtent([[groupWidth, 0], [componentWidth, componentHeight]]);
                    zoomed();
                    console.log("Width changed.  New total width: ", componentWidth, "New interactive width: ", interactionWidth);
                }
            }

            // heading / label text (for each series)
            if (options.groupWidth > 0) {
                var groupLabels = svg_g.selectAll('.series-label').data(timelineData).enter().append('text').attr('class', 'series-label').attr('x', '0.5em') //0)
                .attr('y', function (d, i) {
                    return groupHeight * i + groupHeight / 2; //+ 5.5;
                }).attr('dx', '0.5em').attr('dy', '.4em') //'-.1em')  //'0.5em')
                .text(function (d) {
                    return d.label;
                }).call(wrap, groupWidth);

                var lineSection = svg_g.append('line').attr('x1', groupWidth).attr('x2', groupWidth).attr('y1', 0).attr('y2', componentHeight).attr('stroke', 'orange');
            }

            var groupIntervalItems = svg_g.selectAll('.series-interval-item').data(timelineData).enter().append('g').attr('clip-path', 'url(#' + chartContentClipPathId + ')').attr('class', 'item').attr('transform', function (d, i) {
                return 'translate(0, ' + groupHeight * i + ')';
            }).selectAll('.dot').data(function (d) {
                return d.data.filter(function (_) {
                    return _.type === TimelineChart.TYPE.INTERVAL;
                });
            }).enter();

            var intervalBarHeight = 0.8 * groupHeight;
            var intervalBarMargin = (groupHeight - intervalBarHeight) / 2;
            var intervals = groupIntervalItems.append('rect').attr('class', curry(addClasses, 'interval')).attr('width', function (d) {
                return Math.max(options.intervalMinWidth, xTimeScaleForContent(d.to) - xTimeScaleForContent(d.from));
            }).attr('height', intervalBarHeight).attr('y', intervalBarMargin).attr('x', function (d) {
                return xTimeScaleForContent(d.from);
            }).on('click', function (d) {
                !d.onClick || d.onClick(d);
            });

            // interval text
            var intervalTexts = groupIntervalItems.append('text').text(function (d) {
                return d.label || '';
            }) //  (typeof(d.label) === 'function' ? d.label(d) : d.label) || '')
            .attr('class', curry(addClasses, 'interval-text')).attr('y', groupHeight / 2 + 5).attr('x', function (d) {
                return xTimeScaleForContent(d.from);
            });

            var groupDotItems = svg_g.selectAll('.series-dot-item').data(timelineData).enter().append('g').attr('clip-path', 'url(#' + chartContentClipPathId + ')').attr('class', 'item').attr('transform', function (d, i) {
                return 'translate(0, ' + groupHeight * i + ')';
            }).selectAll('.dot').data(function (d) {
                return d.data.filter(function (_) {
                    return _.type === TimelineChart.TYPE.POINT;
                });
            }).enter();

            var dots = groupDotItems.append('circle').attr('class', curry(addClasses, 'dot')).attr('cx', function (d) {
                return xTimeScaleForContent(d.at);
            }).attr('cy', groupHeight / 2).attr('r', 7).on('click', function (d) {
                !d.onClick || d.onClick(d);
            });

            // If set, options.tipContentGenerator should have the following form: function(timelineObjectForWhichToRenderTipContent)
            // Note:  popper.js and tooltip.js are not required at this point.
            if (options.tipContentGenerator) {
                var tip = function () {
                    // The container element will hold the placeholder element and the tooltip element
                    // The reason we need this is because of how tooltip.js resolves the tooltip-inner element when updating the tooltip "title".
                    var container = document.createElement('div');
                    document.body.appendChild(container);

                    // The placeholder element will be used to position the tooltip by representing the
                    // area of the target element which is capable of being viewed.
                    var placeholderEl = d3.select(document.createElement('div'));
                    placeholderEl.style('position', 'absolute').style('top', 0).style('opacity', 0).style('pointer-events', 'none').style('box-sizing', 'border-box');
                    container.appendChild(placeholderEl.node());

                    function result() {
                        console.log('calling tip fn');
                    }

                    var _tooltip = null;
                    function getToolTip() {

                        // At this point, we should expect popper.js and tooltip.js to have been included, so that the Tooltip class is available before proceeding.
                        if (window.Popper && window.Tooltip && _tooltip == null) {
                            _tooltip = new Tooltip(placeholderEl.node(), {
                                placement: 'top',
                                title: 'initial value',
                                html: true,
                                popperOptions: {
                                    onCreate: function onCreate(p) {
                                        p.instance.popper.classList.add('show');
                                    },
                                    modifiers: {
                                        flip: {
                                            behavior: ['top', 'bottom', 'left', 'right']
                                        }
                                    }
                                }
                            });
                            // Showing and hiding the tooltip will cause the tooltip node to be created
                            _tooltip.show();
                            _tooltip.hide();
                            d3.select(_tooltip._tooltipNode).on('mouseenter', result.onMouseEnter);
                            d3.select(_tooltip._tooltipNode).on('mouseleave', result.onMouseLeave);
                        }
                        return _tooltip;
                    }

                    var tipContentGenerator;

                    result.html = function (val) {
                        tipContentGenerator = val;
                    };

                    var tipIsShowing = false;
                    var tipHideDelayTimeoutToken = null;
                    var targetElement = null;

                    result.onMouseEnter = function () {
                        result.cancelHide();
                    };

                    result.onMouseLeave = function () {
                        result.hideWithDelay();
                    };

                    // Cancel the delayed hide operation
                    result.cancelHide = function () {
                        if (!tipHideDelayTimeoutToken) return;

                        clearTimeout(tipHideDelayTimeoutToken);
                        tipHideDelayTimeoutToken = null;
                    };

                    result.hideNow = function () {
                        if (!tipIsShowing) return;

                        // If this method was called before the hide delay timeout expired, then cancel the pending operation
                        result.cancelHide();

                        tipHideDelayTimeoutToken = null;
                        getToolTip().hide();
                        tipIsShowing = false;
                        targetElement = null;
                    };

                    result.hideWithDelay = function () {
                        tipHideDelayTimeoutToken = setTimeout(function () {
                            result.hideNow();
                        }, 250);
                    };

                    result.show = function (d) {
                        if (tipIsShowing && this == targetElement) result.cancelHide();else result.hideNow();

                        // Update the position and dimensions of the placeholder element to match that of the target element.
                        var rect = this.getBoundingClientRect(); // bounding client rect of target element
                        var cliprect = interactionRect.node().getBoundingClientRect(); // bounding client rect of element to clip the target element's coords to

                        var top = rect.top + window.scrollY;
                        var left = Math.max(rect.left, cliprect.left) + window.scrollX;
                        var right = Math.min(rect.right, cliprect.right) + window.scrollX;
                        var bottom = rect.bottom + window.scrollY;
                        var height = Math.min(bottom - top, rect.height);
                        var width = Math.min(right - left, rect.width);

                        placeholderEl.style('top', top + 'px').style('left', left + 'px').style('height', height + 'px').style('width', width + 'px');
                        // Update the content of the tooltip by regenerating it to match the current data.
                        var html = tipContentGenerator(d);
                        var tt = getToolTip();
                        tt.updateTitleContent(html);
                        // show
                        tt.show();
                        tipIsShowing = true;
                        targetElement = this;
                    };

                    return result;
                }();

                // Set fn for generating tip content
                tip.html(options.tipContentGenerator);
                dots.on('mouseover', tip.show).on('mouseout', tip.hideWithDelay);
                intervals.on('mouseover', tip.show).on('mouseout', tip.hideWithDelay);
            }

            zoomed();

            if (options.enableLiveTimer) {
                setInterval(updateNowMarker, options.liveTimerTickInterval);
            }

            function wrap(text, width, anchorPosition) {
                text.each(function () {
                    var text = d3.select(this),
                        words = text.text().split(/\s+/).reverse(),
                        word,
                        line = [],
                        lineNumber = 0,
                        lineHeight = 1.2,
                        // ems
                    y = text.attr("y"),
                        dx = parseFloat(text.attr("dx")),
                        dy = parseFloat(text.attr("dy"));
                    //lines = [];
                    var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dx", dx + "em").attr("dy", dy + "em");
                    while (word = words.pop()) {
                        line.push(word);
                        tspan.text(line.join(" "));
                        // create line break
                        if (tspan.node().getComputedTextLength() > width) {
                            line.pop();
                            tspan.text(line.join(" "));
                            line = [word];
                            //lines.push(line);
                            tspan = text.append("tspan").attr("x", 0)
                            //.attr("y", y)
                            .attr("dx", dx + "em").attr("dy", lineHeight + "em") //++lineNumber * lineHeight + dy + "em")
                            .text(word);
                            var tspanFirst = text.select('tspan');
                            dy = parseFloat(tspanFirst.attr("dy"));
                            tspanFirst.attr('dy', dy - lineHeight * .5 + "em");
                        }
                    }
                });
            }

            function updateNowMarker() {
                var nowX = xTimeScaleForContent(new Date());

                self.now.attr('x1', nowX).attr('x2', nowX);
            }

            function curry(fn) {
                var args = Array.prototype.slice.call(arguments, 1); // capture all but the 1st arg
                return function () {
                    return fn.apply(this, args.concat(Array.prototype.slice.call(arguments, 0)));
                };
            }

            // Add to (this) selection the provided defaultClass and any customClass specified within the data.
            function addClasses(defaultClass, data) {
                //console.log('this: ', this, ' arguments: ', arguments);
                var classes = [defaultClass];
                if (!!data.customClass) classes.push(data.customClass);
                var idClasses = (data.ids || []).map(function (id) {
                    return dataIdClassPrefix + id;
                });
                return classes.concat(idClasses).join(' ');
            }

            function zoomed() {
                if (self.onVizChangeFn && d3.event) {
                    self.onVizChangeFn.call(self, {
                        scale: d3.event.scale,
                        translate: d3.event.translate,
                        domain: xTimeScaleForContent.domain()
                    });
                }

                if (options.enableLiveTimer) {
                    updateNowMarker();
                }

                var ___dummy___ = [zoom]; // include in closure

                if (d3.event && d3.event.transform) {
                    //console.log(d3.event.transform);  // includes k(scale), x, and y
                    // create new scale ojects based on event
                    xTimeScaleForContent = d3.event.transform.rescaleX(xTimeScaleOriginal);
                } else console.log('d3.event.transform is empty');

                // update axes
                xAxisScaled = xAxis.scale(xTimeScaleForContent);

                // redraw axis
                gX.call(xAxisScaled);
                // redraw points and intervals
                svg_g.selectAll('circle.dot').attr('cx', function (d) {
                    return xTimeScaleForContent(d.at);
                });
                svg_g.selectAll('rect.interval').attr('x', function (d) {
                    return xTimeScaleForContent(d.from);
                }).attr('width', function (d) {
                    return Math.max(options.intervalMinWidth, xTimeScaleForContent(d.to) - xTimeScaleForContent(d.from));
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
                    var labelText = d.label || ''; //typeof(d.label)==="string" ? d.label : typeof(d.label)==="function" ? d.label(d) : '';
                    if (percent < 1) {
                        if (positionData.width > options.textTruncateThreshold) {
                            return labelText.substr(0, Math.floor(labelText.length * percent)) + '...';
                        } else {
                            return '';
                        }
                    }

                    return labelText;
                });

                function getTextPositionData(d) {
                    this.textSizeInPx = this.textSizeInPx || this.getComputedTextLength();
                    var from = xTimeScaleForContent(d.from);
                    var to = xTimeScaleForContent(d.to);
                    return {
                        xPosition: from,
                        upToPosition: to,
                        width: to - from,
                        textWidth: this.textSizeInPx
                    };
                }
            }

            var getItemMinDate = self.getItemMinDate = function (pointOrInterval) {
                var p = pointOrInterval;
                return p.type === TimelineChart.TYPE.POINT ? p.at : p.from;
            };
            var getItemMaxDate = self.getItemMaxDate = function (pointOrInterval) {
                var p = pointOrInterval;
                return p.type === TimelineChart.TYPE.POINT ? p.at : p.to;
            };

            // whether transitions should be animated by default
            var animateTransitions = true;
            self.animateTransitions = function (value) {
                if (value === undefined) return animateTransitions;
                animateTransitions = !!value;
            };

            self.refresh = function () {
                zoomed();
            };

            self.resetTransform = function (animate) {
                if (animate === undefined ? animateTransitions : animate) svg_g.transition().duration(500).call(zoom.transform, d3.zoomIdentity);else svg_g.call(zoom.transform, d3.zoomIdentity);
            };

            // translate the timeline so that the specified range value is centered within the view.  Extent constraints will be respected.
            function translateToRangeValue(x, animate) {
                if (animate === undefined ? animateTransitions : animate) svg_g.transition().duration(500).call(zoom.translateTo, x, 0);else svg_g.call(zoom.translateTo, x, 0);
            }
            //self.translateToRangeValue = translateToRangeValue;

            // set zoom scale
            function setZoomScale(k, animate) {
                if (animate === undefined ? animateTransitions : animate) svg_g.transition().duration(500).call(zoom.scaleTo, k);else svg_g.call(zoom.scaleTo, k);
            }

            // translate to a position that is the given percentage between the min and max values
            function translateToPercent(normalizedPercentage) {
                var range = xTimeScaleForContent.range();
                var delta = range[1] - range[0];
                var x = delta * normalizedPercentage + range[0];
                translateToRangeValue(x);
            }
            self.translateToPercent = translateToPercent;

            function translateToDate(date, animate) {
                var rangeValue = xTimeScaleOriginal(date);
                translateToRangeValue(rangeValue, animate);
            }
            self.translateToDate = translateToDate;

            // Given one or more [string] ids, do one or both of the following:
            //  - move the elements into view (via zooming and panning)
            //  - apply the specified CSS class to the elements
            self.highlightNodeByIds = function (idOrIdArray, moveIntoView, highlightCssClassName) {
                var ___dummy___ = [zoom, xTimeScaleForContent]; // include zoom in closure
                var idArray = typeof idOrIdArray === "string" ? [idOrIdArray] : idOrIdArray;
                if (idArray.constructor !== [].constructor) return { data: [] };

                // Clear highlight in case one is set
                d3.selectAll('.' + highlightCssClassName).classed(highlightCssClassName, false);

                var selector = idArray.map(function (id) {
                    return "." + dataIdClassPrefix + id;
                }).join(',');

                // Bail out if no selector is available
                if (!selector) return { data: [] };

                var sel = d3.selectAll(selector);

                // Bail out if selector doesn't match an element
                if (sel.nodes().length == 0) return { data: [] };

                // Highlight new node
                sel.classed(highlightCssClassName, true);

                var items = sel.data();
                var itemToUse = items.find(function (item) {
                    return item.type == TimelineChart.TYPE.POINT;
                }) || items[0];
                // optionally scroll the node into view
                if (!!moveIntoView) {
                    // TODO:  when an interval spans the entire view, using the itemTime returned for it will likely change the view considerably. 
                    // Instead, find a better way to deal witht this, possibly using the time associated with the point clicked.  
                    // To do this, consider allowing an optional time to be provided to this method which will serve as the itemToUse/itemTime around which the view will be centered.
                    var itemTime = self.getItemAvgDate(itemToUse);
                    var rangeValue = xTimeScaleOriginal(itemTime);
                    var currentTransform = d3.zoomTransform(svg_g.node());

                    // leave log statements in here for now, for troubleshooting purposes
                    //console.log('target range value: ', rangeValue);
                    //console.log('current transform: ', currentTransform);
                    //console.log('original scale:  range: ', xTimeScaleOriginal.range(), 'domain: ', xTimeScaleOriginal.domain())
                    //console.log('current scale:  range: ', xTimeScaleForContent.range(), 'domain: ', xTimeScaleForContent.domain())

                    var neighborInfo = self.getSeriesNeighbors(itemToUse);
                    if (neighborInfo.nearest != null) {
                        var timeCoord = xTimeScaleForContent(itemTime);
                        var nearestTimeCoord = xTimeScaleForContent(neighborInfo.nearest.time);
                        var timeDeltaInMs = Math.abs(timeCoord - nearestTimeCoord);
                        var kNew = 20 / timeDeltaInMs * currentTransform.k;
                        //console.log('time delta (ms): ', timeDeltaInMs, 'new k: ', kNew);
                        if (kNew > currentTransform.k) {
                            //console.log('date: ', itemTime, 'x: ', timeCoord);
                            //console.log('nearestDate: ', itemTime, 'x: ', nearestTimeCoord);
                            //console.log('k current: ', currentTransform.k, 'new: ', kNew);
                            // Perform scale transformation instantly
                            setZoomScale(kNew, false);
                        }
                    }

                    // Perform translation transformation with animation
                    translateToDate(itemTime, false);
                }

                return {
                    data: items
                };
            };

            self.scaleTo = function (k) {
                svg_g.call(zoom.scaleTo, k);
            };

            console.log("timeline data successfully bound to chart: ", timelineData);
            console.log("timeline data flattened: ", allElements);
        }

        _createClass(TimelineChart, [{
            key: 'extendOptions',
            value: function extendOptions() {
                var ext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                var defaultOptions = {
                    useUtcTimeScale: false,
                    intervalMinWidth: 8, // px
                    tipContentGenerator: undefined,
                    textTruncateThreshold: 30,
                    enableLiveTimer: false,
                    liveTimerTickInterval: 1000,
                    width: undefined,
                    height: undefined,
                    groupWidth: 400, // px
                    groupHeight: 40 // px
                };
                Object.keys(ext).map(function (k) {
                    return defaultOptions[k] = ext[k];
                });
                return defaultOptions;
            }
        }, {
            key: 'getItemMinDate',
            value: function getItemMinDate(p) {
                return p.type === TimelineChart.TYPE.POINT ? p.at : p.from;
            }
        }, {
            key: 'getItemMaxDate',
            value: function getItemMaxDate(p) {
                return p.type === TimelineChart.TYPE.POINT ? p.at : p.to;
            }
        }, {
            key: 'getItemAvgDate',
            value: function getItemAvgDate(p) {
                return p.type === TimelineChart.TYPE.POINT ? p.at : new Date(p.from * 1 + (p.to - p.from) / 2);
            }
        }, {
            key: 'getSeriesNeighbors',
            value: function getSeriesNeighbors(item) {
                // Find an earlier item that ends before this item begins
                var earlierEndingItem = item;
                while (earlierEndingItem != null && earlierEndingItem.to >= item.from) {
                    earlierEndingItem = earlierEndingItem.prevItem;
                } // Find a later item that starts after this item ends
                var laterStartingItem = item;
                while (laterStartingItem != null && laterStartingItem.from <= item.to) {
                    laterStartingItem = laterStartingItem.nextItem;
                }var result = {
                    earlier: earlierEndingItem == null ? null : {
                        item: earlierEndingItem,
                        time: earlierEndingItem.to,
                        interval: item.from - earlierEndingItem.to
                    },
                    later: laterStartingItem == null ? null : {
                        item: laterStartingItem,
                        time: laterStartingItem.from,
                        interval: laterStartingItem.from - item.to
                    }
                };
                if (earlierEndingItem == null) result.nearest = result.later;else if (laterStartingItem == null) result.nearest = result.earlier;else result.nearest = result.earlier.interval < result.later.interval ? result.earlier : result.later;
                return result;
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
        POINT: Symbol('point'),
        INTERVAL: Symbol('interval')
    };

    module.exports = TimelineChart;
});
//# sourceMappingURL=timeline-chart.js.map
