/*
Provided data should match the following grammar/rules:

    <timeline_data> : 
    [
        <series_data>,
        <series_data>,
        ...
    ]

    <series_data> :
    [
        label: <label-expression>,
        data: 
        [
            <series_item>
        ]
    ]

    <series_item> : <series_interval> OR <series_point>

    <series_interval> : 
    {
        type: TimelineChart.TYPE.INTERVAL,
        label: <label-expression>,
        from: <Date>,
        to: <Date>,
        customClass: <css-class>,
        onClick: <function>,
        ids: [ (unique ID strings) ]
    }

    <series_point> :
    {
        type: TimelineChart.TYPE.INTERVAL,
        label: <label>,
        at: <Date>,
        customClass: <css-class>,
        onClick: <function>,
        ids: [ (unique ID strings) ]
    }

    <label-expression> : <string>

    <css-class> : <string>

*/
class TimelineChart {
    constructor(element, timelineData, opts) {
        let self = this;

        element.classList.add('timeline-chart-component');

        let options = this.extendOptions(opts);

        timelineData.forEach(series => {
            // Normalize data with respect to at/from/to temporal properties
            series.data.forEach(item => {
                item.at = self.getItemAvgDate(item);
                item.from = self.getItemMinDate(item);
                item.to = self.getItemMaxDate(item);
            });
            // Sort items within the series
            var sortedItems = series.data.sort((a,b) => a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
            // On each item, set references to previous and next items
            sortedItems.forEach((o,i) => {
                o.prevItem = i == 0 ? null : sortedItems[i-1];
                o.nextItem = i == sortedItems.length-1 ? null : sortedItems[i+1];
            });
        })

        // flatten grouped data elements into a single array
        let allElements = timelineData.reduce((agg, e) => agg.concat(e.data), []);

        let minDt = d3.min(allElements, self.getItemMinDate);
        let maxDt = d3.max(allElements, self.getItemMaxDate);
        // zoom out just slightly, to allow for a little space on either end of the timeline
        let dateDelta = maxDt.getTime() - minDt.getTime();
        let zoomOutPct = .02;  // 2%
        minDt = new Date(minDt.getTime() - (dateDelta * zoomOutPct));
        maxDt = new Date(maxDt.getTime() + (dateDelta * zoomOutPct));

        let timelineContainer = d3.select(element)
            .append('div')
            .classed('timeline-chart', true);
        let timelineContainerElement = timelineContainer.node();

        let elementWidth = options.width || timelineContainerElement.clientWidth || 600;
        let elementHeight = options.height || timelineContainerElement.clientHeight || 200;

        let margin = {
            top: 20,
            right: 0,
            bottom: 0,  // set to about 20 for a bottom-aligned axis
            left: 0
        };

        let dataIdClassPrefix = "_id_";

        let width = elementWidth - margin.left - margin.right;
        let height = elementHeight - margin.top - margin.bottom;

        // Width of the series label area
        let groupWidth = options.groupWidth || 400;  // options.hideGroupLabels ? 0 : 400;

        // Height of each section containing a horizontal series.  By default, fit each series into the available vertical space.
        let groupHeight = height / timelineData.length;
        // Otherwise, if the groupHeight option is set, then use its value for the height of each series, and set the total height accordingly.
        if (!!options.groupHeight)
        {
            groupHeight = options.groupHeight;
            height = groupHeight * timelineData.length;
        }

        let xTimeScaleOriginal = d3.scaleTime()
            .domain([minDt, maxDt])
            .range([groupWidth, width]);
        let xTimeScaleForContent = xTimeScaleOriginal;

        // X axis ticks
        let xAxis = d3.axisTop(xTimeScaleForContent)
            //.orient('top') // set to 'bottom' for a bottom-aligned axis and to 'top' for a top-aligned axis
            .tickSize(height); // set to height for a bottom-aligned axis and to -height for a top-aligned axis
        let xAxisScaled = xAxis;

        // In order to upgrade from v3 to v4, this needs to change.
        // See here:  https://coderwall.com/p/psogia/simplest-way-to-add-zoom-pan-on-d3-js
        let zoom = d3.zoom()
            .on('zoom', zoomed)
            .scaleExtent([1, Infinity])
            .extent([[groupWidth,0], [width, height]])
            .translateExtent([[groupWidth,0], [width, height]])

        let svg = self.svgElement = timelineContainer
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        // All elements affected by the zooming behavior are created in the zoom() fn.
        let svg_g = svg
            .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        svg_g.call(zoom); //.transform);

        // let selectionFilter = svg_g.append("defs")
        //     .append("filter")
        //     .attr("id",'blurred')
        //     .attr({"x":"-50%", "y":"-50%", "width":"200%", "height":"200%"})
        //     .append("feGaussianBlur").attr("stdDeviation", 12);

        function uuidv4() {
            return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
                (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
            )
        }
          
        let chartContentClipPathId = "chart-content-clip-path-"+uuidv4();
        let clipPathRect = svg_g.append('defs')
            .append('clipPath')
            .attr('id', chartContentClipPathId)
            .append('rect')
            .attr('x', groupWidth)
            .attr('y', 0)
            .attr('height', height)
            .attr('width', width - groupWidth)

        // Invisible rect covering chart bounds, ensuring that all interactions intended for the chart will be raised as events on SVG elements
        let interactionRect = svg_g.append('rect')
            .attr('class', 'chart-bounds')
            .attr('x', groupWidth)
            .attr('y', 0)
            .attr('height', height)
            .attr('width', width - groupWidth);

        //interactionRect.call(zoom);

        if (options.enableLiveTimer) {
            self.now = svg_g.append('line')
                .attr('clip-path', `url(#${chartContentClipPathId})`)
                .attr('class', 'vertical-marker now')
                .attr("y1", 0)
                .attr("y2", height);
        }

        let seriesBackground = svg_g.selectAll('.series-background')
            .data(timelineData)
            .enter()
            .append('rect')
            .attr('class', 'series-background')
            .attr('x', 0)
            .attr('y', (d, i) => { return groupHeight * i; })
            .attr('width', width)
            .attr('height', groupHeight)
            .style('fill', (d, i) => {
                // For numeric values of grouping key, use them.  Otherwise, use the supplied index (i).
                var index = Math.abs(Math.floor((d.groupingKey == d.groupingKey*1 ? d.groupingKey : i)%10)*2-1);
                return d3.schemeCategory20[index];
            });

        // horizontal lines between groups.  (This used to use the 'group-section' class, but is now using the 'series' terminology.)
        let seriesDividers = svg_g.selectAll('.series-divider')
            .data(timelineData)
            .enter()
            .append('line')
            .attr('class', 'series-divider')
            .attr('x1', 0)
            .attr('x2', width)
            .attr('y1', (d, i) => {
                return groupHeight * (i + 1);
            })
            .attr('y2', (d, i) => {
                return groupHeight * (i + 1);
            });

        let translucentOverlay = svg_g.append('rect')
            .attr('x', groupWidth)
            .attr('y', 0)
            .attr('width', width - groupWidth)
            .attr('height', height)
            .style('fill', "#fff")
            .style('fill-opacity', '.25');

        let boundingRect = svg_g.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', width)
            .attr('height', height)
            .style('stroke', "#000");

        // Axis with labels and ticks
        let gX = svg_g.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + height + ')')
            .call(xAxis);

        // Monitor for change in size of containing element
        setInterval(handleWidthChange, 1000);

        function handleWidthChange() {
            var newWidth = timelineContainerElement.clientWidth - margin.left - margin.right - 2;

            if (newWidth != width)
            {
                width = newWidth;
                svg.attr("width", width) ;
                seriesDividers.attr('x2', width);
                seriesBackground.attr('width', width);
                boundingRect.attr('width', width);

                var interactionWidth = width - groupWidth;
                translucentOverlay.attr('width', interactionWidth);
                clipPathRect.attr("width", interactionWidth);
                interactionRect.attr("width", interactionWidth);
                xTimeScaleOriginal.range([groupWidth, width]);
                xTimeScaleForContent.range([groupWidth, width]);
                xAxisScaled = xAxis.scale(xTimeScaleForContent);
                zoom
                    .extent([[groupWidth,0], [width, height]])
                    .translateExtent([[groupWidth,0], [width, height]]);
                zoomed();
                console.log("Width changed.  New total width: ", width, "New interactive width: ", interactionWidth);
            }
        }

        // heading / label text (for each series)
        if (options.groupWidth > 0) {
            let groupLabels = svg_g.selectAll('.series-label')
                .data(timelineData)
                .enter()
                .append('text')
                .attr('class', 'series-label')
                .attr('x', '0.5em') //0)
                .attr('y', (d, i) => {
                    return (groupHeight * i) + (groupHeight / 2) ; //+ 5.5;
                })
                .attr('dx', '0.5em')
                .attr('dy', '.4em')  //'-.1em')  //'0.5em')
                .text(d => d.label)
                .call(wrap, groupWidth);

            let lineSection = svg_g.append('line').attr('x1', groupWidth).attr('x2', groupWidth).attr('y1', 0).attr('y2', height).attr('stroke', 'orange');
        }

        let groupIntervalItems = svg_g.selectAll('.series-interval-item')
            .data(timelineData)
            .enter()
            .append('g')
            .attr('clip-path', `url(#${chartContentClipPathId})`)
            .attr('class', 'item')
            .attr('transform', (d, i) => `translate(0, ${groupHeight * i})`)
            .selectAll('.dot')
            .data(d => d.data.filter(_ => _.type === TimelineChart.TYPE.INTERVAL))
            .enter();

        let intervalBarHeight = 0.8 * groupHeight;
        let intervalBarMargin = (groupHeight - intervalBarHeight) / 2;
        let intervals = groupIntervalItems
            .append('rect')
            .attr('class', curry(addClasses, 'interval'))
            .attr('width', (d) => Math.max(options.intervalMinWidth, xTimeScaleForContent(d.to) - xTimeScaleForContent(d.from)))
            .attr('height', intervalBarHeight)
            .attr('y', intervalBarMargin)
            .attr('x', (d) => xTimeScaleForContent(d.from))
            .on('click', (d) => { !d.onClick || d.onClick(d); });

        // interval text
        let intervalTexts = groupIntervalItems
            .append('text')
            .text(d => d.label || '')  //  (typeof(d.label) === 'function' ? d.label(d) : d.label) || '')
            .attr('class', curry(addClasses, 'interval-text'))
            .attr('y', (groupHeight / 2) + 5)
            .attr('x', (d) => xTimeScaleForContent(d.from));

        let groupDotItems = svg_g.selectAll('.series-dot-item')
            .data(timelineData)
            .enter()
            .append('g')
            .attr('clip-path', `url(#${chartContentClipPathId})`)
            .attr('class', 'item')
            .attr('transform', (d, i) => `translate(0, ${groupHeight * i})`)
            .selectAll('.dot')
            .data(d => {
                return d.data.filter(_ => _.type === TimelineChart.TYPE.POINT);
            })
            .enter();

        let dots = groupDotItems
            .append('circle')
            .attr('class', curry(addClasses, 'dot'))
            .attr('cx', d => xTimeScaleForContent(d.at))
            .attr('cy', groupHeight / 2)
            .attr('r', 7)
            .on('click', (d) => { !d.onClick || d.onClick(d); });

        if (options.tip) {
            if (d3.tip) {
                let tip = d3.tip().attr('class', 'd3-tip').html(options.tip).offset([-15, 0]);;
                svg_g.call(tip);
                dots.on('mouseover', tip.show).on('mouseout', tip.hide);
                intervals.on('mouseover', showIntervalTip).on('mouseout', tip.hide);

                function showIntervalTip(d, i){
                    var x = d3.event.x, y = d3.event.y;
                    var d3_event_x = d3.event.x;

                    tip.show(d, i);

                    function updateWidth() {
                        console.log([ parseFloat(tip.style('width')), parseFloat(d3.select('.d3-tip.n').style('width')), d3.select('.d3-tip.n').node().clientWidth]);
                        var tipWidth = parseFloat(tip.style('width'));
                        console.log('tip width: ', tipWidth);
                        tip.style('left', d3_event_x - (tipWidth/2) + 'px');
                    }

                    updateWidth();
                    setTimeout(updateWidth, 1);
                }
            } else {
                console.error('Please make sure you have d3.tip included as dependency (https://github.com/Caged/d3-tip)');
            }
        }

        zoomed();

        if (options.enableLiveTimer) {
            setInterval(updateNowMarker, options.timerTickInterval);
        }


        function wrap(text, width, anchorPosition) 
        {
            text.each(function() {
                var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.2, // ems
                y = text.attr("y"),
                dx = parseFloat(text.attr("dx")),
                dy = parseFloat(text.attr("dy"));
                //lines = [];
                var tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dx", dx + "em").attr("dy", dy + "em");
                while (word = words.pop()) 
                {
                    line.push(word);
                    tspan.text(line.join(" "));
                    // create line break
                    if (tspan.node().getComputedTextLength() > width) 
                    {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        //lines.push(line);
                        tspan = text.append("tspan")
                            .attr("x", 0)
                            //.attr("y", y)
                            .attr("dx", dx + "em")
                            .attr("dy", lineHeight + "em")  //++lineNumber * lineHeight + dy + "em")
                            .text(word);
                        var tspanFirst = text.select('tspan');
                        dy = parseFloat(tspanFirst.attr("dy"));
                        tspanFirst.attr('dy', dy-(lineHeight*.5)+"em");
                    }
                }
            });
        }
      
        function updateNowMarker() {
            let nowX = xTimeScaleForContent(new Date());

            self.now.attr('x1', nowX).attr('x2', nowX);
        }

        function curry(fn) {
            var args = Array.prototype.slice.call(arguments, 1);  // capture all but the 1st arg
            return function() {
                return fn.apply(this, args.concat(Array.prototype.slice.call(arguments, 0)));
            }
        }
        
        // Add to (this) selection the provided defaultClass and any customClass specified within the data.
        function addClasses(defaultClass, data) {
            //console.log('this: ', this, ' arguments: ', arguments);
            var classes = [ defaultClass ];
            if (!!data.customClass) classes.push(data.customClass);
            var idClasses = (data.ids || []).map(id => dataIdClassPrefix+id);
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

            var ___dummy___ = [ zoom ];  // include in closure
            
            if (d3.event && d3.event.transform) {
console.log(d3.event.transform);
                // create new scale ojects based on event
                xTimeScaleForContent = d3.event.transform.rescaleX(xTimeScaleOriginal);
            }
            else console.log('d3.event.transform is empty');

            // update axes
            xAxisScaled = xAxis.scale(xTimeScaleForContent);

            // redraw axis
            gX.call(xAxisScaled);
            // redraw points and intervals
            svg_g.selectAll('circle.dot').attr('cx', d => xTimeScaleForContent(d.at));
            svg_g.selectAll('rect.interval').attr('x', d => xTimeScaleForContent(d.from)).attr('width', d => Math.max(options.intervalMinWidth, xTimeScaleForContent(d.to) - xTimeScaleForContent(d.from)));
            svg_g.selectAll('.interval-text').attr('x', function(d) {
                    let positionData = getTextPositionData.call(this, d);
                    if ((positionData.upToPosition - groupWidth - 10) < positionData.textWidth) {
                        return positionData.upToPosition;
                    } else if (positionData.xPosition < groupWidth && positionData.upToPosition > groupWidth) {
                        return groupWidth;
                    }
                    return positionData.xPosition;
                }).attr('text-anchor', function(d) {
                    let positionData = getTextPositionData.call(this, d);
                    if ((positionData.upToPosition - groupWidth - 10) < positionData.textWidth) {
                        return 'end';
                    }
                    return 'start';
                })
                .attr('dx', function(d) {
                    let positionData = getTextPositionData.call(this, d);
                    if ((positionData.upToPosition - groupWidth - 10) < positionData.textWidth) {
                        return '-0.5em';
                    }
                    return '0.5em';
                }).text(function(d) {
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
                var from = xTimeScaleForContent(d.from);
                var to = xTimeScaleForContent(d.to);
                return {
                    xPosition: from,
                    upToPosition: to,
                    width: to - from,
                    textWidth: this.textSizeInPx
                }
            }
        }

        var getItemMinDate = self.getItemMinDate = function(pointOrInterval) {
            var p = pointOrInterval;
            return p.type === TimelineChart.TYPE.POINT ? p.at : p.from;
        };
        var getItemMaxDate = self.getItemMaxDate = function(pointOrInterval) {
            var p = pointOrInterval;
            return p.type === TimelineChart.TYPE.POINT ? p.at : p.to;
        };
    
        // whether transitions should be animated by default
        var animateTransitions = true;
        self.animateTransitions = function(value) {
            if (value === undefined)
                return animateTransitions;
            animateTransitions = !!value;
        }

        self.refresh = function() { zoomed(); }
        
        self.resetTransform = function(animate) {
            if (animate === undefined ? animateTransitions : animate)
                svg_g.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
            else
                svg_g.call(zoom.transform, d3.zoomIdentity);
        };

        // translate the timeline so that the specified range value is centered within the view.  Extent constraints will be respected.
        function translateToRangeValue(x, animate) {
            if (animate === undefined ? animateTransitions : animate)
                svg_g.transition().duration(500).call(zoom.translateTo, x, 0);
            else
                svg_g.call(zoom.translateTo, x, 0);
        }
        //self.translateToRangeValue = translateToRangeValue;

        // set zoom scale
        function setZoomScale(k, animate) {
            if (animate === undefined ? animateTransitions : animate)
                svg_g.transition().duration(500).call(zoom.scaleTo, k);
            else
                svg_g.call(zoom.scaleTo, k);
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
        self.highlightNodeByIds = function(idOrIdArray, moveIntoView, highlightCssClassName) {
            var ___dummy___ = [zoom, xTimeScaleForContent];  // include zoom in closure
            var idArray = typeof(idOrIdArray) === "string" ?  [idOrIdArray] : idOrIdArray;
            if (idArray.constructor !== [].constructor) return { data: [] };

            // Clear highlight in case one is set
            d3.selectAll('.'+highlightCssClassName).classed(highlightCssClassName, false);

            var selector = idArray.map(id => "."+dataIdClassPrefix+id).join(',');
            var sel = d3.selectAll(selector);

            // if selector doesn't match an element...
            if (sel.nodes().length == 0) return { data: [] };

            // Highlight new node
            sel.classed(highlightCssClassName, true);

            var items = sel.data();
            var itemToUse = items.find(item => item.type == TimelineChart.TYPE.POINT) || items[0];
            // optionally scroll the node into view
            if (!!moveIntoView) {
                var itemTime = self.getItemAvgDate(itemToUse);
                var rangeValue = xTimeScaleOriginal(itemTime);
                var currentTransform = d3.zoomTransform(svg_g.node());

                console.log('target range value: ', rangeValue); //, 'scaled: ', rangeValue*currentTransform.k);
                console.log('current transform: ', currentTransform);
                //console.log('current transform.translate(100,0): ', currentTransform.translate(100, 0), currentTransform.x+currentTransform.k*100);
                console.log('original scale:  range: ', xTimeScaleOriginal.range(), 'domain: ', xTimeScaleOriginal.domain())
                console.log('current scale:  range: ', xTimeScaleForContent.range(), 'domain: ', xTimeScaleForContent.domain())

                var neighborInfo = self.getSeriesNeighbors(itemToUse);
                if (neighborInfo.nearest != null) {
                    var timeCoord = xTimeScaleForContent(itemTime);
                    var nearestTimeCoord = xTimeScaleForContent(neighborInfo.nearest.time);
                    var timeDeltaInMs = Math.abs(timeCoord - nearestTimeCoord);
                    var kNew = (20 / timeDeltaInMs) * currentTransform.k;
                    console.log('time delta (ms): ', timeDeltaInMs, 'new k: ', kNew);
                    if (kNew > currentTransform.k) {
                        console.log('date: ', itemTime, 'x: ', timeCoord);
                        console.log('nearestDate: ', itemTime, 'x: ', nearestTimeCoord);
                        console.log('k current: ', currentTransform.k, 'new: ', kNew);
                        // Perform scale transformation instantly
                        setZoomScale(kNew, false);
                    }
                }

                // Perform translation transformation with animation
                translateToDate(itemTime, true);
            }

            return {
                data: items
            };
        };

        self.scaleTo = function(k) {
            svg_g.call(zoom.scaleTo, k);
        }

        console.log("timeline data successfully bound to chart: ", timelineData);
        console.log("timeline data flattened: ", allElements);
    }
    extendOptions(ext = {}) {
        let defaultOptions = {
            intervalMinWidth: 8, // px
            tip: undefined,
            textTruncateThreshold: 30,
            enableLiveTimer: false,
            timerTickInterval: 1000,
            groupHeight: 40, // px
            groupWidth: 300 // px
        };
        Object.keys(ext).map(k => defaultOptions[k] = ext[k]);
        return defaultOptions;
    }
    getItemMinDate(p) {
        return p.type === TimelineChart.TYPE.POINT ? p.at : p.from;
    }
    getItemMaxDate(p) {
        return p.type === TimelineChart.TYPE.POINT ? p.at : p.to;
    }
    getItemAvgDate(p) {
        return p.type === TimelineChart.TYPE.POINT ? p.at : new Date(p.from * 1 + (p.to - p.from)/2);
    }
    // get the previous and next dates in the series (that are not identical to the starting/ending dates of the current item)
    getSeriesNeighbors(item) {
        // Find an earlier item that ends before this item begins
        var earlierEndingItem = item;
        while(earlierEndingItem != null && earlierEndingItem.to >= item.from)
            earlierEndingItem = earlierEndingItem.prevItem;
    
        // Find a later item that starts after this item ends
        var laterStartingItem = item;
        while(laterStartingItem != null && laterStartingItem.from <= item.to)
            laterStartingItem = laterStartingItem.nextItem;

        var result = {
            earlier: earlierEndingItem == null ? null : {
                item: earlierEndingItem,
                time: earlierEndingItem.to,
                interval:  item.from - earlierEndingItem.to
            },
            later: laterStartingItem == null ? null : {
                item: laterStartingItem,
                time: laterStartingItem.from,
                interval: laterStartingItem.from - item.to
            }
        };
        if (earlierEndingItem == null) result.nearest = result.later;
        else if (laterStartingItem == null) result.nearest = result.earlier;
        else result.nearest = result.earlier.interval < result.later.interval ? result.earlier : result.later;
        return result;
    }
    onVizChange(fn) {
        this.onVizChangeFn = fn;
        return this;
    }

    // reset() {
    //     this.reset();
    // }
    // highlightNodeByIds(dataId, scrollIntoView, highlightCssClassName) {
    //     this.highlightNodeByIds(dataId, scrollIntoView, highlightCssClassName);
    // }
    // scaleDomain(newDomain) {
    //     if (!newDomain)
    //         return this.contentTimeScale.domain();
    //     this.contentTimeScale.domain(newDomain);
    //     this.refresh();
    // }
    // scaleRange(newRange) {
    //     if (!newRange)
    //         return this.contentTimeScale.range();
    //     this.contentTimeScale.range(newRange);
    //     this.refresh();
    // }
    // scaleMap(value) {
    //     return this.contentTimeScale(value);
    // }
    // scaleInvert(value) {
    //     return this.contentTimeScale.invert(value);
    // }
}

TimelineChart.TYPE = {
    POINT: Symbol(),
    INTERVAL: Symbol()
};

module.exports = TimelineChart;
 