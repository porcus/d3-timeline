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
        global.CaseTimerEventBrowser = mod.exports;
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

    var CaseTimerEventBrowser = function () {
        function CaseTimerEventBrowser(element, caseData, opts) {
            _classCallCheck(this, CaseTimerEventBrowser);

            var self = this;

            // extend the selection prototype to include an appendHTML function
            if (!d3.selection.prototype.appendHTML) {
                d3.selection.prototype.appendHTML = d3.selection.enter.prototype.appendHTML = function (HTMLString) {
                    return this.select(function () {
                        return this.appendChild(document.importNode(new DOMParser().parseFromString(HTMLString, 'text/html').body.childNodes[0], true));
                    });
                };
            }

            d3.select(element).appendHTML('\n            <div class="container-fluid">\n\n                <div class="row">\n                    <div class="col-xs-12">\n                        <div class="heading">Case Timer Status!!!</div>\n                    </div>\n                </div>\n\n                <br>\n\n                <div class="row">\n                    <div class="col-xs-12">\n                        <div id="chart2" class="chart-container" style="height: 600px;"></div>\n                    </div>\n                </div>\n\n                <br>\n                \n                <div class="row">\n                    <div class="col-xs-12">\n                        <div id="case-timer-details" class="box details-container responsive-table-1500" style="min-height: 300px;"></div>\n                    </div>\n                </div>\n\n                <br>\n                \n                <div class="row">\n                    <div class="col-xs-12" >\n                        <div id="event-details" class="box details-container responsive-table-1100" style="min-height: 300px;"></div>\n                    </div>\n                </div>\n\n                <br>\n\n                <div class="row">\n                    <div class="col-xs-12">\n                        <div id="snapshot-details" class="box details-container responsive-table" style="min-height: 300px;"></div>\n                    </div>\n                </div>\n\n                <br>\n\n            </div>');

            var chartContainer = document.getElementById('chart2');
            var caseTimerDetailsContainer = document.getElementById('case-timer-details');
            var eventDetailsContainer = document.getElementById('event-details');
            var selectedSnapshotContainer = document.getElementById('snapshot-details');

            var caseTimerPropertyConfigs = [{ propertyLabel: "Type", propertyValueSelector: function propertyValueSelector(x) {
                    return x.CaseTimerType;
                }, onClick: null }, { propertyLabel: "Name", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Name;
                }, onClick: null }, { propertyLabel: "Current Effective Clock State", propertyValueSelector: function propertyValueSelector(x) {
                    return separateWordsInCamelCaseStringWithSpaces(x.CurrentEffectiveClockState);
                }, onClick: null }, { propertyLabel: "Current NonWorking Time Period Types", propertyValueSelector: function propertyValueSelector(x) {
                    return x.CurrentNonWorkingTimePeriodTypes;
                }, onClick: null }, { propertyLabel: "Show On Case", propertyValueSelector: function propertyValueSelector(x) {
                    return x.DisplayOnCase;
                }, onClick: null }, { propertyLabel: "NonWorking Event Source", propertyValueSelector: function propertyValueSelector(x) {
                    return x.NonWorkingEventSource;
                }, onClick: null }, { propertyLabel: "Respects", propertyValueSelector: function propertyValueSelector(x) {
                    return [x.RespectNonWorkingSchedule ? "<nobr>Non-Working Schedule</nobr>" : null, x.RespectSlaClock ? "<nobr>SLA Clock</nobr>" : null, x.RespectWorkCalendar ? "<nobr>Work Calendar</nobr>" : null].filter(function (r) {
                        return !!r;
                    }).join(', ');
                }, onClick: null }, { propertyLabel: "Offset + Run Time = Elapsed Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Offset + ' + ' + x.RunTime + ' = ' + x.ElapsedTime;
                }, onClick: null },
            // { propertyLabel: "Offset", propertyValueSelector: x => x.Offset, onClick: null },
            // { propertyLabel: "Run Time", propertyValueSelector: x => x.RunTime, onClick: null },
            // { propertyLabel: "Elapsed Time", propertyValueSelector: x => x.ElapsedTime, onClick: null },

            { propertyLabel: "Last Calculated", propertyValueSelector: function propertyValueSelector(x) {
                    return x.LastCalculated;
                }, onClick: null },
            //{ propertyLabel: "Last Modified", propertyValueSelector: x => x.LastModified, onClick: null },
            // { propertyLabel: "Respect NonWorking Schedule", propertyValueSelector: x => x.RespectNonWorkingSchedule, onClick: null },
            // { propertyLabel: "Respect Sla Clock", propertyValueSelector: x => x.RespectSlaClock, onClick: null },
            // { propertyLabel: "Respect Work Calendar", propertyValueSelector: x => x.RespectWorkCalendar, onClick: null },
            //{ propertyLabel: "Is Active", propertyValueSelector: x => x.IsActive, onClick: null },
            { propertyLabel: "Started", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Started;
                }, onClick: null }, { propertyLabel: "Stopped", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Stopped;
                }, onClick: null }, { propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Id;
                }, onClick: null }, { propertyLabel: "Events", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Events;
                }, onClick: function onClick(d) {
                    return renderEventDetailsTable(d.Events, []);
                } }];

            var caseTimerEventPropertyConfigs = [{ propertyLabel: "Event Time", propertyValueSelector: function propertyValueSelector(d) {
                    return d.EventTime;
                }, onClick: null }, { propertyLabel: "Event Identifier", propertyValueSelector: function propertyValueSelector(d) {
                    return d.EventIdentifierString;
                }, onClick: null }, { propertyLabel: "Is Derived", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsDerived;
                }, onClick: null }, { propertyLabel: "Is Inherited", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsInherited;
                }, onClick: null }, { propertyLabel: "Is Creation", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsCaseTimerCreationEvent;
                }, onClick: null }, { propertyLabel: "App Id", propertyValueSelector: function propertyValueSelector(d) {
                    return d.AppIdentifier;
                }, onClick: null }, { propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(d) {
                    return d.Id;
                }, onClick: null }, { propertyLabel: "Snapshot", propertyValueSelector: function propertyValueSelector(d) {
                    return d.CaseTimerSnapshot;
                }, onClick: function onClick(d) {
                    return displaySnapshotDetails(d.CaseTimerSnapshot);
                } }];

            var caseTimerSnapshotPropertyConfigs = [{ propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(d) {
                    return d.Id;
                }, onClick: null }, { propertyLabel: "Is Derived", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsDerived;
                }, onClick: null }, { propertyLabel: "Snapshot Time", propertyValueSelector: function propertyValueSelector(d) {
                    return d.SnapshotTime;
                }, onClick: null }];

            function renderCaseData(caseDataToRender) {
                if (!caseDataToRender) {
                    alert('case data was not provided.');return;
                }
                if ((caseDataToRender.Timers || []).length == 0) {
                    alert('case data contains no timers');return;
                }

                console.log("input caseData:", caseDataToRender);

                //normalizeProperties(caseTimerDataArray);

                var caseTimerTimelineData = transformCaseTimerDataToTimelineData(caseDataToRender.Timers);
                console.log("caseTimerTimelineData:", caseTimerTimelineData);

                renderCaseTimersTable(caseDataToRender.Timers);

                renderTimeline(chartContainer, caseTimerTimelineData);
            }

            self.renderCaseData = renderCaseData;

            self.renderCaseData(caseData);

            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


            function renderTimeline(container, timelineData) {
                removeAllChildNodesOfElement(container);

                var timeline = new TimelineChart(container, timelineData, {
                    //enableLiveTimer: true, 
                    tip: formatTipText,
                    groupHeight: 40
                }); //.onVizChange(e => console.log(e));

                // Resize container vertically to fit timeline
                var svgHeight = d3.select(container).select("svg").attr("height") * 1;
                d3.select(container).style("height", svgHeight + 10 + "px");
            }

            function separateWordsInCamelCaseStringWithSpaces(str) {
                return (str || '').replace(/([A-Z])/g, " $1").trim();
            }

            function formatDate(date) {
                // We will only display fractional seconds to ms precision, because JS's date doesn't support any greater precision than that.
                //return moment(date).format('MMMM Do YYYY, h:mm:ss.SSS a');
                return moment(date).format('YYYY-MM-DD hh:mm:ss.SSS a');
            }

            var createLabelFromIntervalDuration = function createLabelFromIntervalDuration(d) {
                return formatDuration(d.to, d.from);
            };

            function formatLabelForTipHtml(label) {
                return (label || '').replace(/ /g, '&nbsp;').replace(/\\n/g, '<br>');
            };

            function formatDuration(later, earlier) {
                var msDiff = moment(later).diff(moment(earlier));
                var duration = moment.duration(msDiff);
                var parts = [duration._data.years ? duration._data.years + ' year(s)' : null, duration._data.months ? duration._data.months + ' month(s)' : null, duration._data.days ? duration._data.days + ' day(s)' : null, duration._data.hours ? duration._data.hours + ' hour(s)' : null, duration._data.minutes ? duration._data.minutes + ' minute(s)' : null, duration._data.seconds ? duration._data.seconds + ' second(s)' : null].filter(function (x) {
                    return x != null;
                });
                return parts.join(' ');
            };

            function formatTipText(d) {
                // if d.label is a fn, call it now.
                var lbl = typeof d.label == 'function' ? formatLabelForTipHtml(d.label(d) + '') : typeof d.label == 'string' ? formatLabelForTipHtml(d.label) : '(no label)';
                // include "at" time for points or from/to time range for intervals with label
                var result = !!d.at ? lbl + '<br><br>Time: ' + formatDate(d.at) : lbl + '<br><br>From: ' + formatDate(d.from) + '<br>To: ' + formatDate(d.to) + '<br>Duration: ' + formatDuration(d.to, d.from);
                return result;
            };

            function isUUID(value) {
                var result = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
                return !!result && result.index === 0;
            }

            function removeAllChildNodesOfElement(container) {
                // remove all elements of the container
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }

            function renderEventDetailsTable(allEvents, selectedEvents) {
                removeAllChildNodesOfElement(eventDetailsContainer);
                //renderEventList(allEvents, selectedEvents);
                renderTableOfObjects(eventDetailsContainer, caseTimerEventPropertyConfigs, allEvents, selectedEvents);
            }

            function renderCaseTimersTable(allCaseTimers, selectedTimers) {
                removeAllChildNodesOfElement(caseTimerDetailsContainer);
                renderTableOfObjects(caseTimerDetailsContainer, caseTimerPropertyConfigs, allCaseTimers, selectedTimers);
            }

            function renderTableOfObjects(tableContainer, propertyConfigs, itemsToRender, itemsToHighlight) {
                // itemsToRender is required and must contain data
                if (!itemsToRender) {
                    alert('renderTableOfObjects called with no data');
                    return;
                }

                itemsToHighlight = itemsToHighlight || [];

                var table = d3.select(tableContainer).append('table').classed('table', true);
                var headerRow = table.append('thead').append('tr');
                // render table header
                propertyConfigs.forEach(function (pc) {
                    return headerRow.append('th').text(pc.propertyLabel);
                });

                var tbody = table.append('tbody');

                itemsToRender.forEach(function (cte) {
                    var tr = tbody.append('tr').classed('highlighted', itemsToHighlight.findIndex(function (o) {
                        return o == cte;
                    }) != -1).selectAll('td').data(propertyConfigs);
                    tr.enter().append('td').attr('data-title', function (d) {
                        return d.propertyLabel;
                    }).html(function (d) {
                        return getHtmlContentForPropertyValue(d, cte);
                    }).on('click', function (d) {
                        if (!!d.onClick) d.onClick(cte);
                    });
                });

                function getHtmlContentForPropertyValue(propertyConfig, obj) {
                    var propertyValue = propertyConfig.propertyValueSelector(obj);

                    if (propertyValue === undefined) {
                        return "";
                    } else if (propertyValue === null) {
                        return "(null)";
                    } else if (typeof propertyValue == 'string') {
                        //if (isUUID(propertyValue))
                        //    return "<span title='"+propertyValue+"'>"+propertyValue.substring(0, 7)+"...</span>";
                        return propertyValue;
                    } else if (typeof propertyValue == 'boolean') {
                        //return propertyValue;
                        return "<input type='checkbox' " + (!!propertyValue ? "checked" : "") + " onclick='return false;' />";
                    } else if (propertyValue.constructor == new Date().constructor) {
                        return formatDate(propertyValue);
                    } else if (!!propertyConfig.onClick) {
                        return "<button class='btn btn-xs'>View</button>";
                    }
                    return '<em>(no value resolver defined)</em>';
                }
            }

            // function renderEventList(events)
            // {
            //     // case timer event container
            //     let selection = d3.select(eventDetailsContainer).append('div')
            //         .selectAll('.case-timer-event')
            //         .data(events);

            //     //caseTimerEventSelection.exit().remove();

            //     let caseTimerEventSelection = selection.enter()
            //         .call(renderEventListItem);

            //     function renderEventListItem()
            //     {
            //         var caseTimerEventContainer = this.append('div').attr('class', 'case-timer-event');
            //         // Render the event properties
            //         caseTimerEventPropertyConfigs.forEach(pc => caseTimerEventContainer.call(d => renderProperty.bind(d)(pc)));
            //     }
            // }

            // function renderProperty(caseTimerEventPropertyConfig)
            // {
            //     var {propertyLabel, propertyValueSelector, onClick} = caseTimerEventPropertyConfig;

            //     let caseTimerProperty = this
            //         .append('div')
            //         .attr('class', 'case-timer-event-property');
            //     let label = caseTimerProperty
            //         .append('div')
            //         .attr('class', 'case-timer-event-property-label')
            //         .text(propertyLabel)
            //     let caseTimerPropertyValue = caseTimerProperty
            //         .append('div')
            //         .attr('class', 'case-timer-event-property-value')
            //         .html(d => {
            //             var propertyValue = propertyValueSelector(d);

            //             if (propertyValue === undefined)
            //             {
            //                 return "";
            //             }
            //             else if (propertyValue === null)
            //             {
            //                 return "(null)";
            //             }
            //             else if (typeof propertyValue == 'string')
            //             {
            //                 return propertyValue;
            //             }
            //             else if (typeof propertyValue == 'boolean')
            //             {
            //                 return propertyValue;
            //             }
            //             else if (propertyValue.constructor == (new Date()).constructor)
            //             {
            //                 return formatDate(propertyValue);
            //             }
            //             else if(!!onClick)
            //             {
            //                 return "<span class='link'>(click here to view)</span>";
            //             }
            //             return '<em>(no value resolver defined)</em>'
            //         })
            //         .on("click", (d) => { 
            //             if (!!onClick)
            //             {
            //                 onClick(d); 
            //             }
            //         });
            // }


            function displaySnapshotDetails(caseTimerSnapshot) {
                console.log(caseTimerSnapshot);

                // remove all elements of the container
                while (selectedSnapshotContainer.firstChild) {
                    selectedSnapshotContainer.removeChild(selectedSnapshotContainer.firstChild);
                }

                renderTableOfObjects(selectedSnapshotContainer, caseTimerSnapshotPropertyConfigs, [caseTimerSnapshot], [caseTimerSnapshot]);
            }

            function normalizeProperties(caseTimerArray) {
                var convertDateProperties = function convertDateProperties(obj, propertyNamesArray) {
                    if (!obj) return;
                    propertyNamesArray.forEach(function (pn) {
                        var value = obj[pn];
                        if (value !== null && typeof value === 'string') obj[pn] = new Date(value);
                    });
                };

                caseTimerArray.forEach(function (ct) {
                    ct.Events.forEach(function (e) {
                        convertDateProperties(e, ["EventTime", "LastModified"]);
                        convertDateProperties(e.CaseTimerSnapshot, ["SnapshotTime", "LastModified"]);
                        var ssd = e.CaseTimerSnapshot.SnapshotData;
                        convertDateProperties(ssd, ["SnapshotTime", "LastModified"]);
                        convertDateProperties(ssd.CaseTimer, ["LastCalculated", "LastModified", "Started", "Stopped"]);
                        convertDateProperties(ssd.Sla, ["EstimatedNextControlPointDate", "EstimatedTargetResolutionDate", "LastModified"]);
                    });
                    convertDateProperties(ct, ["LastCalculated", "LastModified", "Started", "Stopped"]);
                });
            }

            function restoreReferencesInCaseTimerObjectGraph(caseTimerArray) {
                // normalize data
                caseTimerArray.forEach(function (ct) {
                    ct.Events.forEach(function (e) {
                        // link the case timer events to the case timer that it belongs to
                        e.CaseTimer = ct;

                        // Share Case/CaseTimer data, depending upon whether an SLA is present.
                        //  - If CaseTimer is for an SLA, then share the CaseTimer data with the SLA.
                        //  - If CaseTimer is not for an SLA but if there is an SLA on the case, then share the Case data with the Sla's CaseTimer.
                        var ssd = e.CaseTimerSnapshot.SnapshotData;
                        if (ssd.CaseTimer.CaseTimerType === 'Sla') {
                            // If SLA hasn't already been removed 
                            if (ssd.Sla != null) {
                                ssd.Sla.CaseTimer = ssd.CaseTimer;
                            }
                        } else if (ssd.Sla != null) {
                            ssd.Sla.CaseTimer.Case = ssd.CaseTimer.Case;
                        }
                        // If an SLA is present, then share its data with the Case.
                        if (ssd.Sla != null && ssd.Sla.CaseTimer.Case.Sla != ssd.Sla) {
                            ssd.Sla.CaseTimer.Case.Sla = ssd.Sla;
                        }
                    });
                });
            }

            function transformCaseTimerDataToTimelineData(originalCaseTimerArray) {
                // create a copy of the data
                //let copyOfCaseTimerArray = JSON.parse(JSON.stringify(originalCaseTimerArray));
                var copyOfCaseTimerArray = originalCaseTimerArray;

                restoreReferencesInCaseTimerObjectGraph(copyOfCaseTimerArray);

                normalizeProperties(copyOfCaseTimerArray);

                var allTimelineSeries = copyOfCaseTimerArray.map(function (ct) {
                    // for each case timer, this returns an array of data series, each of which can be plotted on the timeline

                    // As we group these events into points, we have to treat the EventTime as an integral number of milliseconds.
                    // Otherwise, the milliseconds will be lost if we just use the EventTime (Date), because the d3.nest.key resolver will convert the returned object into a string.
                    var points = d3.nest().key(function (d) {
                        return d.EventTime * 1;
                    }).entries(ct.Events).map(function (d) {
                        // Create point data structure
                        return {
                            type: TimelineChart.TYPE.POINT,
                            customClass: 'point-white',
                            label: function label() {
                                return d.values.length + ' Event' + (d.values.length == 1 ? '' : 's') + ':<br>' + d.values.map(function (e) {
                                    return ' - ' + e.EventIdentifierString + '<br>';
                                }).join('');
                            },
                            at: new Date(d.key * 1),
                            data: d.values,
                            onClick: function onClick() {
                                renderCaseTimersTable(copyOfCaseTimerArray, [ct]);
                                renderEventDetailsTable(ct.Events, d.values);
                            }
                        };
                    });

                    var eventsForTimerSeries = {
                        label: "All Events for timer [" + ct.Name + "]",
                        groupingKey: ct.Id, // The case timer Id is a suitable grouping key
                        data: points
                    };

                    var now = new Date();
                    var intervalConfigs = [{
                        key: "TimeAccrualIntervalKey",
                        intervalSeriesEventGroupingKeyFn: function intervalSeriesEventGroupingKeyFn(evt) {
                            return "TimeAccrualInterval";
                        },
                        groupLabelFn: function groupLabelFn(evt) {
                            return "Time Accrued";
                        },
                        intervalLabelFn: function intervalLabelFn(evt) {
                            return "Clock Running";
                        },
                        startEventId: "TimerStartedAccruingTime",
                        endEventId: "TimerStoppedAccruingTime",
                        intervalType: "TimeAccrualInterval",
                        customClass: 'interval-white'
                    }, {
                        key: "FollowingSlaIntervalKey",
                        intervalSeriesEventGroupingKeyFn: function intervalSeriesEventGroupingKeyFn(evt) {
                            return "FollowingSlaInterval";
                        },
                        groupLabelFn: function groupLabelFn(evt) {
                            return "Following SLA";
                        },
                        intervalLabelFn: function intervalLabelFn(evt) {
                            return "Following SLA";
                        },
                        startEventId: "CaseTimerStartedFollowingSla",
                        endEventId: "CaseTimerStoppedFollowingSla",
                        intervalType: "FollowingSlaInterval",
                        customClass: 'interval-white'
                    }, {
                        key: "NonworkingScheduledTimePeriodIntervalKey",
                        intervalSeriesEventGroupingKeyFn: function intervalSeriesEventGroupingKeyFn(evt) {
                            return "NonworkingScheduledTimePeriodInterval-" + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceId;
                        },
                        groupLabelFn: function groupLabelFn(evt) {
                            return "Non-working Scheduled Time Period: " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName;
                        },
                        intervalLabelFn: function intervalLabelFn(evt) {
                            return "Non-working Scheduled Time Period: " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName;
                        },
                        startEventId: "Temporal:NonworkingScheduledTimePeriodBegan",
                        endEventId: "Temporal:NonworkingScheduledTimePeriodEnded",
                        intervalType: "NonworkingScheduledTimePeriodInterval",
                        customClass: 'interval-white'
                    }, {
                        key: "SlaPauseIntervalKey",
                        intervalSeriesEventGroupingKeyFn: function intervalSeriesEventGroupingKeyFn(evt) {
                            return "SlaPauseInterval-" + evt.EventData.TemporalEventArgs.SourceId;
                        },
                        groupLabelFn: function groupLabelFn(evt) {
                            return "SLA Pause for " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName;
                        },
                        intervalLabelFn: function intervalLabelFn(evt) {
                            return "SLA Pause for " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName;
                        },
                        startEventId: "Temporal:SlaPauseBegan",
                        endEventId: "Temporal:SlaPauseEnded",
                        intervalType: "SlaPauseInterval",
                        customClass: 'interval-white'
                    }, {
                        key: "OffWorkTimePeriodIntervalKey",
                        intervalSeriesEventGroupingKeyFn: function intervalSeriesEventGroupingKeyFn(evt) {
                            return "OffWorkTimePeriodInterval-" + evt.EventData.TemporalEventArgs.SourceId;
                        },
                        groupLabelFn: function groupLabelFn(evt) {
                            return "Off-work time period for " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceNameName;
                        },
                        intervalLabelFn: function intervalLabelFn(evt) {
                            return "Off-work time period for " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName;
                        },
                        startEventId: "Temporal:WorkPeriodEnded",
                        endEventId: "Temporal:WorkPeriodBegan",
                        intervalType: "OffWorkTimePeriodInterval",
                        customClass: 'interval-white'
                    }];
                    //var intervalStartEventIds = intervalConfigs.map(ic => ic.startEventId);
                    //var intervalEndEventIds = intervalConfigs.map(ic => ic.endEventId);

                    // This fn creates a key from an event that will be used to group the event.  Each event will end up in at most 1 group.
                    var eventIntervalGroupingKeyFn = function eventIntervalGroupingKeyFn(evt) {
                        // find the first interval config that matches, cand call it's fn to generate the grouping key.
                        var matchingIntervalConfig = intervalConfigs.find(function (ic) {
                            return evt.EventIdentifierString.includes(ic.startEventId) || evt.EventIdentifierString.includes(ic.endEventId);
                        });
                        if (!matchingIntervalConfig) return "REMOVE";
                        //evt.intervalConfig = matchingIntervalConfig;  // attach this to the event here, so we don't have to resolve it again later
                        return matchingIntervalConfig.key + "::" + matchingIntervalConfig.intervalSeriesEventGroupingKeyFn(evt);
                    };

                    // Create an array of interval groups
                    // Using D3.nest and the event interval grouping fn, create a series of time intervals for each distinct group of data for this timer
                    var timerIntervalSeriesArray = d3.nest().key(eventIntervalGroupingKeyFn).entries(ct.Events).filter(function (o) {
                        return o.key != "REMOVE";
                    }) // exclude all interval groups that yield a key of "REMOVE"
                    .map(function (intervalGroup) {

                        // extract the interval config key from the first part of the key
                        var intervalConfigKey = intervalGroup.key.split('::')[0];
                        // resolve the associated interval config using its key
                        var intervalConfig = intervalConfigs.find(function (ic) {
                            return ic.key == intervalConfigKey;
                        });

                        var eventsOfInterest = intervalGroup.values;
                        // Create intervals for this group from the events
                        var intervals = [];

                        var _loop = function _loop() {
                            var curEvt = eventsOfInterest[i];
                            var nextEvt = eventsOfInterest.length > i + 1 ? eventsOfInterest[i + 1] : null;
                            var ic = intervalConfig;

                            // If following item exist in array, create an interval with this one and that one
                            if (nextEvt != null) {
                                intervals.push({
                                    type: TimelineChart.TYPE.INTERVAL,
                                    intervalType: ic.intervalType,
                                    customClass: ic.customClass,
                                    label: ic.intervalLabelFn(curEvt),
                                    from: new Date(curEvt.EventTime),
                                    to: new Date(nextEvt.EventTime),
                                    data: [curEvt, nextEvt],
                                    onClick: function onClick() {
                                        renderCaseTimersTable(copyOfCaseTimerArray, [ct]);
                                        renderEventDetailsTable(ct.Events, [curEvt, nextEvt]);
                                    }
                                });
                            }
                            // ...otherwise, create the final interval with this one and the current time as a tentative stop time
                            else {
                                    intervals.push({
                                        type: TimelineChart.TYPE.INTERVAL,
                                        intervalType: ic.intervalType,
                                        customClass: ic.customClass,
                                        label: ic.intervalLabelFn(curEvt),
                                        from: new Date(curEvt.EventTime),
                                        to: now,
                                        data: [curEvt],
                                        onClick: function onClick() {
                                            renderCaseTimersTable(copyOfCaseTimerArray, [ct]);
                                            renderEventDetailsTable(ct.Events, [curEvt]);
                                        }
                                    });
                                }
                        };

                        for (var i = 0; i < eventsOfInterest.length; i += 2) {
                            _loop();
                        }

                        // new series
                        return {
                            label: intervalConfig.groupLabelFn(intervalGroup.values[0]),
                            groupingKey: ct.Id, // The case timer Id is a suitable grouping key
                            data: intervals
                        };
                    });
                    console.log(timerIntervalSeriesArray);
                    // end grouping of intervals

                    var allSeriesForTimer = [eventsForTimerSeries].concat(timerIntervalSeriesArray);

                    return allSeriesForTimer;
                })
                // flatten the array of timeline data series arrays into a single array of TDS.
                .reduce(function (accumulator, currentValue) {
                    return accumulator.concat(currentValue);
                });

                // We want to provide some sort of visual grouping mechanism so that all series associated with the same case timer can be visually grouped.
                // Transform the group key to a 0-based index.
                var newGroupingKey = 0;
                var lastGroupKey = "----------------";
                allTimelineSeries.forEach(function (x) {
                    if (lastGroupKey != x.groupingKey) {
                        lastGroupKey = x.groupingKey;
                        newGroupingKey++;
                    }
                    x.groupingKey = newGroupingKey;
                });

                return allTimelineSeries;
            }
        }

        _createClass(CaseTimerEventBrowser, [{
            key: 'updateTimelineData',
            value: function updateTimelineData(newCaseData) {
                this.renderCaseData(newCaseData);
            }
        }]);

        return CaseTimerEventBrowser;
    }();

    module.exports = CaseTimerEventBrowser;
});
//# sourceMappingURL=case-timer-event-browser.js.map
