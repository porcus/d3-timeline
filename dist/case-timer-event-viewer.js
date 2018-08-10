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
        global.CaseTimerEventViewer = mod.exports;
    }
})(this, function (module) {
    'use strict';

    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

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

    var CaseTimerEventViewer = function () {
        function CaseTimerEventViewer(element, initialCaseData, opts) {
            _classCallCheck(this, CaseTimerEventViewer);

            var self = this;

            // We'll use this several times hereafter
            Array.prototype.selectMany = function (memberArraySelectorFn) {
                return !this.length ? [] : this.map(memberArraySelectorFn).reduce(function (a, b) {
                    return a.concat(b);
                });
            };

            // Extend the d3 selection prototype to include some additional functions

            // Note:  This function will ONLY append the first element in the HTML string literal provided.
            if (!d3.selection.prototype.appendHTML) {
                d3.selection.prototype.appendHTML =
                //d3.selection.enter.prototype.appendHTML = 
                function (HTMLString) {
                    return this.select(function () {
                        return this.appendChild(document.importNode(new DOMParser().parseFromString(HTMLString, 'text/html').body.childNodes[0], true));
                    });
                };
            }
            d3.selection.prototype.hide =
            //d3.selection.enter.prototype.hide = 
            function () {
                this.style('display', 'none');
            };
            d3.selection.prototype.show =
            //d3.selection.enter.prototype.show = 
            function () {
                this.style('display', null);
            };
            d3.selection.prototype.visible =
            //d3.selection.enter.prototype.visible = 
            function (value) {
                if (value === undefined) return this.style('display') !== 'none';this.style('display', !!value ? null : 'none');
            };

            function loadScriptFile(src) {
                var element = document.createElement("script");
                element.src = src;
                document.body.appendChild(element);
            }
            function loadCssFile(src) {
                var element = document.createElement("link");
                element.rel = "stylesheet";
                element.type = "text/css";
                element.href = src;
                document.head.appendChild(element);
            }
            function executeFunctionWhenPredicateIsSatisfied(boolPredicate, fn, initialWaitInMs, subsequentWaitInMs) {
                initialWaitInMs = initialWaitInMs || 100;
                subsequentWaitInMs = subsequentWaitInMs || 100;
                var task = function task() {
                    if (!!boolPredicate()) fn();else setTimeout(task, subsequentWaitInMs);
                };
                setTimeout(task, initialWaitInMs);
            }

            // Popper
            loadScriptFile("https://unpkg.com/popper.js");
            //loadScriptFile("https://unpkg.com/popper.js/dist/umd/popper.min.js");
            //"https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js");

            // Tooltip (by Popper)
            executeFunctionWhenPredicateIsSatisfied(function () {
                return window.Popper;
            }, function () {
                loadScriptFile("https://unpkg.com/tooltip.js");
            });
            //loadScriptFile("https://unpkg.com/tooltip.js/dist/umd/tooltip.min.js");

            // JSONEditor
            loadScriptFile("https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor-minimalist.js");
            loadCssFile("https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor.css");

            // Tablesaw
            // Until this issue https://github.com/filamentgroup/tablesaw/issues/342) is fixed, tablesaw needs to be loaded before the page has finished loading.
            // Once that issue is fixed, we can load it here:
            //loadScriptFile("https://cdn.jsdelivr.net/npm/tablesaw@3.0.9/dist/tablesaw.min.js");
            loadCssFile("https://cdn.jsdelivr.net/npm/tablesaw@3.0.9/dist/tablesaw.min.css");

            // setTimeout(function(){ 
            //     // Until this issue https://github.com/filamentgroup/tablesaw/issues/342) is fixed, loading tablesaw at this point will mean that we have to manually trigger the
            //     //   DOMContentLoaded event on the document after dynamically loading the script in order for Tablesaw to be aware that it can be safely initialized.
            //     // This is a bit of a hack, so we'll have to see how this works.
            //     var DOMContentLoaded_event = document.createEvent("Event");
            //     DOMContentLoaded_event.initEvent("DOMContentLoaded", true, true);
            //     window.document.dispatchEvent(DOMContentLoaded_event);
            // }, 500);

            function initializeTableFeatures() {
                if (window.Tablesaw === undefined) {
                    setTimeout(initializeTableFeatures, 500);
                    return;
                }

                Tablesaw.init();
            }

            d3.select(element).appendHTML('\n            <div id="case-timer-event-viewer-container" class="container-fluid font-scale-pct-80">\n\n                <div class="row mt-3 mb-3">\n                    <div class="col-10">\n                        <div id="case-timer-event-viewer-input">\n                            <div class="h4 bottom-border">Input</div>\n\n                            <div id="case-timer-event-viewer-error" class="alert alert-warning mt-3" role="alert">\n                                <div class="alert-heading"> To view case timer data for a given case, please enter a valid entity Id for a case, SLA, case timer, case timer event, or case timer snapshot.</div>\n                            </div>\n                \n                            <div class="input-group">\n                                <input type="text" class="form-control" placeholder="Enter a valid entity Id to load data for the related case" id="entity-id" />\n                                <div class="input-group-append">\n                                    <button id="load-entity-button" class="btn btn-primary">Load</button>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    <div class="col-2">\n                        <div class="h4 bottom-border">Options</div>\n\n                        <input type="checkbox" id="should-show-snapshot-json-for-selected-items"> Show snapshot JSON for each selected item.\n                    </div>\n                </div>\n\n                <div id="case-timer-event-viewer-content">\n\n                    <div class="mb-3">\n                        <div class="h4 bottom-border">\n                            <label for="case-timer-data-latest-toggle">Latest Data</label>\n                            <input type="checkbox" id="case-timer-data-latest-toggle" data-toggle-target-element-id="case-timer-data-latest" />\n                        </div>\n                        <div id="case-timer-data-latest" class="indent">\n                            <div class="row mb-3">\n                                <div class="col-12">\n                                    <div class="h6">Case</div>\n                                    <div id="case-details-latest" class="property-card-flex-layout" ></div>\n                                </div>\n                            </div>\n                            <div class="row mb-3">\n                                <div class="col-12">\n                                    <div class="h6">SLA</div>\n                                    <div id="sla-details-latest" class="property-card-flex-layout" ></div>\n                                </div>\n                            </div>\n                            <div class="row mb-3">\n                                <div class="col-12">\n                                    <div class="h6">Case Timers</div>\n                                    <div id="case-timer-details-latest" class="scrollable-container" ></div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n\n\n                    <!-- Timeline -->\n                    <div class="row mb-3">\n                        <div class="col-12">\n                            <div class="h4 bottom-border">Case Timer Events Timeline\n                                <button id="reset-timeline-view" type="button" class="btn btn-info btn-sm ml-4 m-1">Reset View</button>\n                            </div>\n                            <div id="timeline-chart" class="chart-container" ></div>\n                        </div>\n                    </div>\n\n\n                    <div class="mb-3">\n                        <div id="selected-case-timer-label" class="h4 bottom-border">Selected Case Timer</div>\n                        <div class="row">\n                            <div class="col-8">\n                                <div class="h6">Events</div>\n                                <div id="case-timer-event-details" class="scrollable-container" ></div>\n                            </div>\n                            <div class="col-4">\n                                <div class="h6">Snapshots\n                                    <span id="snapshot-reminder" class="badge badge-warning">Remember...</button>\n                                </div>\n                                <div id="case-timer-snapshot-details" class="scrollable-container" ></div>\n                            </div>\n                        </div>\n                    </div>\n\n\n                    <div class="h4 bottom-border">\n                        <label for="case-timer-data-historical-contextual-toggle">Historical Data Contemporary with Selected Snapshot</label>\n                        <input type="checkbox" id="case-timer-data-historical-contextual-toggle" data-toggle-target-element-id="case-timer-data-historical-contextual" />\n                    </div>\n                    <div id="case-timer-data-historical-contextual" class="indent">\n                        <div class="row mb-3">\n                            <div class="col-12">\n                                <div class="h6">Selected Snapshot</div>\n                                <div id="snapshot-details-historical" class="property-card-flex-layout" ></div>\n                            </div>\n                        </div>\n                        <div class="row mb-3">\n                            <div class="col-12">\n                                <div class="h6">Case</div>\n                                <div id="case-details-historical" class="property-card-flex-layout" ></div>\n                            </div>\n                        </div>\n                        <div class="row mb-3">\n                            <div class="col-12">\n                                <div class="h6">SLA</div>\n                                <div id="sla-details-historical" class="property-card-flex-layout" ></div>\n                            </div>\n                        </div>\n\n                        <div class="row">\n                            <div class="col-12">\n                                <div class="h5">Case Timers</div>\n                                <div id="case-timer-details-historical" class="scrollable-container" ></div>\n                            </div>\n                        </div>\n                    </div>\n\n                </div>\n\n            </div>');

            // set up 
            d3.selectAll('[data-toggle-target-element-id]').each(function (d, i, o) {
                var toggleEl = this;
                var toggle = d3.select(toggleEl);

                var targetElementId = toggle.attr('data-toggle-target-element-id');
                if (!targetElementId) return;

                var target = d3.select('#' + targetElementId);
                var targetElement = target.node();
                if (!targetElement) return;

                var toggleFn = function toggleFn() {
                    var isVisible = toggle.property('checked');
                    toggle.html(isVisible ? 'hide' : 'show');
                    target.style('display', isVisible ? '' : 'none');
                };
                toggle.on('click', toggleFn);
                toggleFn();
            });

            function submitForm() {
                var newurl = window.location.origin + window.location.pathname + '?id=' + d3.select('#entity-id').property('value');
                window.location.href = newurl;
            }

            d3.select('#load-entity-button').on('click', submitForm);
            d3.select('#entity-id').on("keypress", function () {
                if (d3.event.keyCode === 13) submitForm();
            });

            var ymdhmsfTimeParser = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");
            var ymdhmsTimeParser = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");
            function parseDateTime(dateString) {
                return d3.isoParse(dateString) || dateString;
                //return ymdhmsfTimeParser(dateString) || ymdhmsTimeParser(dateString) || dateString;
            }
            var ymdhmsfTimeFormatter = d3.utcFormat("%Y-%m-%d %I:%M:%S.%L %p");
            var ymdhmsTimeFormatter = d3.utcFormat("%Y-%m-%d %H:%M:%S");
            var hmslTimeFormatter = d3.utcFormat("%H:%M:%S.%L");

            // Cause toString'ed Date values to be rendered as ISO strings
            Date.prototype.toString = Date.prototype.toISOString;

            var latestCaseDetailsContainer = document.getElementById('case-details-latest');
            var latestSlaDetailsContainer = document.getElementById('sla-details-latest');
            var latestCaseTimerDetailsContainer = document.getElementById('case-timer-details-latest');
            var timelineContainer = document.getElementById('timeline-chart');
            var selectedCaseTimerLabel = document.getElementById('selected-case-timer-label');
            var caseTimerEventDetailsContainer = document.getElementById('case-timer-event-details');
            var caseTimerSnapshotDetailsContainer = document.getElementById('case-timer-snapshot-details');
            var historicalSnapshotDetailsContainer = document.getElementById('snapshot-details-historical');
            var historicalCaseDetailsContainer = document.getElementById('case-details-historical');
            var historicalSlaDetailsContainer = document.getElementById('sla-details-historical');
            var historicalCaseTimerDetailsContainer = document.getElementById('case-timer-details-historical');

            function shouldShowSnapshotJsonForSelectedItems() {
                return d3.select('#should-show-snapshot-json-for-selected-items').property('checked');
            }

            executeFunctionWhenPredicateIsSatisfied(function () {
                return window.Tooltip;
            }, function () {
                new Tooltip(document.getElementById('snapshot-reminder'), {
                    placement: 'top',
                    title: 'The data of each snapshot represents the state of the case timer, SLA, etc. at the time of the snapshot. \n                        And timer-related values (e.g. CaseTimer.ElapsedTime, SLA.TimeRemaining, etc.) are updated after each non-derived snapshot is taken.\n                        This means that the timer-related values shown on each snapshot actually represent the state of affairs as of the SnapshotTime of the prior non-derived snapshot.\n                        ',
                    html: false,
                    // This fixes a conflict with Bootstrap's usage of popper  (i.e. it sets the opacity to 0 by default in _tooltip.scss)
                    popperOptions: {
                        onCreate: function onCreate(p) {
                            p.instance.popper.classList.add('show');
                        }
                    }
                });
            }, 1000, 100);

            // =======================================================================================================================================================================
            // Property Config fields:
            //  priority (optional) - The priority of the field which indicates how important it is to show the field.  Range: 0(most important/always show) -> 6(least important)
            //  propertyLabel - The label to display for the column header / field
            //  propertyValueSelector - A function that returns the HTML content to be displayed, given the object
            //  onClick - (optional) A click event handler which will be registered on the content.
            // =======================================================================================================================================================================

            // Case property configs
            var casePropertyConfigs = [{ propertyLabel: "Identifier", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Identifier;
                }, onClick: null }, { propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Id;
                }, onClick: null },
            //{ propertyLabel: "Last Modified", propertyValueSelector: x => x.LastModified, onClick: null },

            { propertyLabel: "Owner", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Owner.FirstName + ' ' + x.Owner.LastName + ' (' + x.Owner.Id + ')';
                }, onClick: null }, { propertyLabel: "Owner's Site", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Owner.Site.Identifier + ' - ' + x.Owner.Site.Name + ' (' + x.Owner.Site.Id + ')';
                }, onClick: null }, { propertyLabel: "Employee", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Employee.FirstName + ' ' + x.Employee.LastName + ' (' + x.Employee.Id + ')';
                }, onClick: null }, { propertyLabel: "Owner's Primary Site", propertyValueSelector: function propertyValueSelector(x) {
                    return !x.Employee.PrimarySite ? '(none set)' : x.Employee.PrimarySite.Identifier + ' - ' + x.Employee.PrimarySite.Name + ' (' + x.Employee.PrimarySite.Id + ')';
                }, onClick: null }];

            // CaseTimer property configs
            var caseTimerPropertyConfigs = [{ priority: 0, propertyLabel: "#", propertyValueSelector: function propertyValueSelector(x) {
                    return x.OrdinalId;
                }, onClick: null }, { priority: 1, propertyLabel: "Events", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Events;
                }, onClick: function onClick(ct) {
                    return renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, []);
                } }, { priority: 0, propertyLabel: "Type", propertyValueSelector: function propertyValueSelector(x) {
                    return x.CaseTimerType;
                }, onClick: null }, { priority: 1, propertyLabel: "Name", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Name;
                }, onClick: null }, { priority: 2, propertyLabel: "Current Effective Clock State", propertyValueSelector: function propertyValueSelector(x) {
                    return separateWordsInCamelCaseStringWithSpaces(x.CurrentEffectiveClockState);
                }, onClick: null }, { priority: 3, propertyLabel: "Current NonWorking Time Period Types", propertyValueSelector: function propertyValueSelector(x) {
                    return x.CurrentNonWorkingTimePeriodTypes;
                }, onClick: null }, { priority: 5, propertyLabel: "Show On Case", propertyValueSelector: function propertyValueSelector(x) {
                    return x.DisplayOnCase;
                }, onClick: null }, { priority: 4, propertyLabel: "NonWorking Event Source", propertyValueSelector: function propertyValueSelector(x) {
                    return x.NonWorkingEventSource;
                }, onClick: null }, { priority: 5, propertyLabel: "Respects", propertyValueSelector: function propertyValueSelector(x) {
                    return [x.RespectNonWorkingSchedule ? "<nobr>Non-Working Schedule</nobr>" : null, x.RespectSlaClock ? "<nobr>SLA Clock</nobr>" : null, x.RespectWorkCalendar ? "<nobr>Work Calendar</nobr>" : null].filter(function (r) {
                        return !!r;
                    }).join(', ');
                }, onClick: null }, { priority: 2, propertyLabel: "Elapsed Time (Offset + Run Time)", propertyValueSelector: function propertyValueSelector(x) {
                    return x.ElapsedTime + ' (' + x.Offset + ' + ' + x.RunTime + ')';
                }, onClick: null },
            // { propertyLabel: "Offset", propertyValueSelector: x => x.Offset, onClick: null },
            // { propertyLabel: "Run Time", propertyValueSelector: x => x.RunTime, onClick: null },
            // { propertyLabel: "Elapsed Time", propertyValueSelector: x => x.ElapsedTime, onClick: null },
            { priority: 3, propertyLabel: "Last Calculated", propertyValueSelector: function propertyValueSelector(x) {
                    return x.LastCalculated;
                }, onClick: null },
            //{ propertyLabel: "Last Modified", propertyValueSelector: x => x.LastModified, onClick: null },
            //{ propertyLabel: "Is Active", propertyValueSelector: x => x.IsActive, onClick: null },
            { priority: 4, propertyLabel: "Started Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Started;
                }, onClick: null }, { priority: 4, propertyLabel: "Stopped Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Stopped;
                }, onClick: null }, { priority: 4, propertyLabel: "Error Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.ErrorTime;
                }, onClick: null }, { priority: 6, propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Id;
                }, onClick: null }];

            // SLA property configs
            var slaPropertyConfigs = [{ priority: 1, propertyLabel: "Respect SLA Pauses", propertyValueSelector: function propertyValueSelector(x) {
                    return x.RespectSlaPauses;
                }, onClick: null }, { priority: 1, propertyLabel: "Sla Replacement Elapsed Time Allocation Policy", propertyValueSelector: function propertyValueSelector(x) {
                    return x.SlaReplacementElapsedTimeAllocationPolicy;
                }, onClick: null }, { priority: 1, propertyLabel: "Status", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Status;
                }, onClick: null }, { priority: 1, propertyLabel: "Condition", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Condition;
                }, onClick: null }, { priority: 1, propertyLabel: "Color", propertyValueSelector: function propertyValueSelector(x) {
                    return x.SlaColor;
                }, onClick: null }, { priority: 1, propertyLabel: "Paused", propertyValueSelector: function propertyValueSelector(x) {
                    return x.IsPaused;
                }, onClick: null }, { priority: 1, propertyLabel: "Active", propertyValueSelector: function propertyValueSelector(x) {
                    return x.IsActive;
                }, onClick: null }, { priority: 1, propertyLabel: "Target IR Duration", propertyValueSelector: function propertyValueSelector(x) {
                    return x.TargetInitialResponseDuration;
                }, onClick: null }, { priority: 1, propertyLabel: "Is Target IR Defined", propertyValueSelector: function propertyValueSelector(x) {
                    return x.IsTargetInitialResponseDefined;
                }, onClick: null }, { priority: 1, propertyLabel: "Time Until IR", propertyValueSelector: function propertyValueSelector(x) {
                    return x.TimeUntilInitialResponse;
                }, onClick: null }, { priority: 1, propertyLabel: "Actual IR Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.ActualInitialResponseDate;
                }, onClick: null }, { priority: 1, propertyLabel: "Expected IR Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.ExpectedInitialResponseDate;
                }, onClick: null }, { priority: 1, propertyLabel: "IR Breached Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.InitialResponseBreachedDate;
                }, onClick: null }, { priority: 1, propertyLabel: "Has IR Target Breached", propertyValueSelector: function propertyValueSelector(x) {
                    return x.HasInitialResponseBreached;
                }, onClick: null }, { priority: 1, propertyLabel: "Has IR Occurred", propertyValueSelector: function propertyValueSelector(x) {
                    return x.HasInitialResponseOccurred;
                }, onClick: null }, { priority: 1, propertyLabel: "TR Duration", propertyValueSelector: function propertyValueSelector(x) {
                    return x.TargetResolutionDuration;
                }, onClick: null }, { priority: 1, propertyLabel: "TR Time Remaining", propertyValueSelector: function propertyValueSelector(x) {
                    return x.TimeRemaining;
                }, onClick: null }, { priority: 1, propertyLabel: "TR BreachedDate", propertyValueSelector: function propertyValueSelector(x) {
                    return x.TargetResolutionBreachedDate;
                }, onClick: null }, { priority: 1, propertyLabel: "Estimated TR Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.EstimatedTargetResolutionDate;
                }, onClick: null }, { priority: 1, propertyLabel: "Has TR Breached", propertyValueSelector: function propertyValueSelector(x) {
                    return x.HasTargetResolutionBreached;
                }, onClick: null }, { priority: 1, propertyLabel: "Time Until Next CP", propertyValueSelector: function propertyValueSelector(x) {
                    return x.TimeUntilNextControlPoint;
                }, onClick: null }, { priority: 1, propertyLabel: "Estimated Next CP Time", propertyValueSelector: function propertyValueSelector(x) {
                    return x.EstimatedNextControlPointDate;
                }, onClick: null }];

            // Case Timer Event property configs
            var caseTimerEventPropertyConfigs = [{ priority: 0, propertyLabel: "#", propertyValueSelector: function propertyValueSelector(x) {
                    return x.OrdinalId;
                }, onClick: null }, { priority: 1, propertyLabel: "Snapshot<br>(details)", propertyValueSelector: function propertyValueSelector(d) {
                    return d.CaseTimerSnapshot;
                }, onClick: function onClick(cte) {
                    return renderEventDetails(cte);
                } }, { priority: 1, propertyLabel: "Event Time", propertyValueSelector: function propertyValueSelector(d) {
                    return d.EventTime;
                }, onClick: null }, { priority: 1, propertyLabel: "Event Identifier", propertyValueSelector: function propertyValueSelector(d) {
                    return d.EventIdentifierString;
                }, onClick: null }, { priority: 1, propertyLabel: "App Id", propertyValueSelector: function propertyValueSelector(d) {
                    return d.AppIdentifier;
                }, onClick: null }, { priority: 4, propertyLabel: "Is Derived", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsDerived;
                }, onClick: null }, { priority: 4, propertyLabel: "Is Inherited", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsInherited;
                }, onClick: null }, { priority: 4, propertyLabel: "Is Creation", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsCaseTimerCreationEvent;
                }, onClick: null }, { priority: 6, propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(d) {
                    return d.Id;
                }, onClick: null }, { priority: 5, propertyLabel: "Snapshot<br>(JSON)", propertyValueSelector: function propertyValueSelector(d) {
                    return d.CaseTimerSnapshot;
                }, onClick: function onClick(cte) {
                    return displaySnapshotAsJson(cte.CaseTimerSnapshot);
                } }, { priority: 5, propertyLabel: "EventData<br>(JSON)", propertyValueSelector: function propertyValueSelector(d) {
                    return d.EventData;
                }, onClick: function onClick(cte) {
                    return displayEventDataAsJson(cte);
                } }];

            // Case Timer Snapshot property configs
            var caseTimerSnapshotPropertyConfigs = [{ priority: 0, propertyLabel: "#", propertyValueSelector: function propertyValueSelector(x) {
                    return x.OrdinalId;
                }, onClick: null }, { priority: 0, propertyLabel: "Snapshot<br>(details)", propertyValueSelector: function propertyValueSelector(d) {
                    return d;
                }, onClick: function onClick(cts) {
                    return renderSnapshotDetails(cts);
                } }, { priority: 0, propertyLabel: "Snapshot Time", propertyValueSelector: function propertyValueSelector(d) {
                    return d.SnapshotTime;
                }, onClick: null }, { priority: 1, propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(d) {
                    return d.Id;
                }, onClick: null }, { priority: 6, propertyLabel: "Is Derived", propertyValueSelector: function propertyValueSelector(d) {
                    return d.IsDerived;
                }, onClick: null }, { priority: 6, propertyLabel: "Snapshot<br>(JSON)", propertyValueSelector: function propertyValueSelector(d) {
                    return d.SnapshotData;
                }, onClick: function onClick(cts) {
                    return displaySnapshotAsJson(cts);
                } }];

            var caseDataModel;
            function getCaseDataModel() {
                return caseDataModel;
            }
            self.getCaseDataModel = getCaseDataModel;

            self.renderCaseData = renderCaseData;
            self.renderCaseData(initialCaseData);

            var timeline;

            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Other functions below

            function renderCaseData(caseDataToRender) {
                console.log("Unparsed case data to be rendered: ", caseDataToRender);

                // Update visibility of sections
                d3.select('#case-timer-event-viewer-error').visible(caseDataToRender === null);
                d3.select('#case-timer-event-viewer-content').visible(caseDataToRender !== null);

                // Validate input
                if (!caseDataToRender) {
                    /*alert('case data was not provided.');*/return;
                }

                var caseTimerTimelineData = transformCaseDataToTimelineData(caseDataToRender);
                console.log("Case data: ", caseDataToRender);
                console.log("Timeline data: ", caseTimerTimelineData);

                // Render stuff
                renderLatestCaseProperties(caseDataToRender);
                renderLatestCaseTimersTable(caseDataToRender.Timers);
                timeline = self.timeline = renderTimeline(timelineContainer, caseTimerTimelineData);

                d3.select(selectedCaseTimerLabel).html('(no timer selected)');
                emptyContainer(caseTimerEventDetailsContainer);
                emptyContainer(caseTimerSnapshotDetailsContainer);
                emptyContainer(historicalSnapshotDetailsContainer);
                emptyContainer(historicalCaseDetailsContainer);
                emptyContainer(historicalSlaDetailsContainer);
                emptyContainer(historicalCaseTimerDetailsContainer);

                caseDataModel = caseDataToRender;
            }

            function displayEventDataAsJson(caseTimerEvent) {
                createJsonViewerPopup(caseTimerEvent.EventData, 'Data for Case Timer Event: ' + caseTimerEvent.EventIdentifierString);
            }

            function displaySnapshotAsJson(caseTimerSnapshot) {
                var cts = caseTimerSnapshot;

                // Save and clear properties that are redundant or which would cause problems.
                beforeSnapshotDataSerialized(cts.SnapshotData);

                // These are the only fields we want to preserve for the visualization
                var ssCopy = {
                    "SnapshotTime": cts.SnapshotTime,
                    "OrdinalId": cts.OrdinalId,
                    "IsDerived": cts.IsDerived,
                    "SnapshotData": cts.SnapshotData,
                    "UniqueId": cts.UniqueId,
                    "Id": cts.Id,
                    "LastModified": cts.LastModified
                };
                createJsonViewerPopup(ssCopy, 'Case Timer Snapshot taken at ' + formatDateTime(cts.SnapshotTime) + ' for timer \'' + cts.SnapshotData.CaseTimer.Name + '\'');

                // Restore values
                afterSnapshotDataSerialized(cts.SnapshotData);
            }

            function displayEventDataAsJson(caseTimerEvent) {
                createJsonViewerPopup(caseTimerEvent.EventData, 'Data for Case Timer Event: ' + caseTimerEvent.EventIdentifierString);
            }

            function beforeSnapshotDataSerialized(ssd) {
                // If CaseTimer is for an SLA, then don't include redundant CaseTimer data.
                // If CaseTimer is not for an SLA but if there is an SLA on the case, then do include its CaseTimer data, but don't include the Sla's CaseTimer's Case data.
                if (ssd.CaseTimer.CaseTimerType === 'Sla') {
                    // If the SLA hasn't already been removed
                    if (ssd.Sla != null) {
                        ssd.Sla.CaseTimer = "(see SnapshotData.CaseTimer)";
                    }
                } else if (ssd.Sla != null) {
                    ssd.Sla.CaseTimer.Case = "(see SnapshotData.CaseTimer.Case)";
                }
            }

            function afterSnapshotDataDeserialized(ssd) {
                shareSnapshotDataReferences(ssd);
            }

            function afterSnapshotDataSerialized(ssd) {
                shareSnapshotDataReferences(ssd);
            }

            function shareSnapshotDataReferences(ssd) {
                // Share Case/CaseTimer data, depending upon whether an SLA is present.
                //  - If CaseTimer is for an SLA, then share the CaseTimer data with the SLA.
                //  - If CaseTimer is not for an SLA but if there is an SLA on the case, then share the Case data with the Sla's CaseTimer.
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
            }

            function renderTimeline(container, timelineData) {
                emptyContainer(container);

                var timeline = new TimelineChart(container, timelineData, {
                    //enableLiveTimer: true, 
                    tipContentGenerator: generateTipHtmlContent,
                    groupHeight: 36,
                    groupWidth: 400
                }); //.onVizChange(e => console.log(e));
                d3.select('#reset-timeline-view').on('click', function () {
                    return timeline.resetTransform();
                });

                // Resize container vertically to fit timeline
                //d3.select(container).style("height", null);
                //var timelineHeight = d3.select(container).node().clientHeight;
                //d3.select(container).style("height", (timelineHeight)+"px");
                return timeline;
            }

            function separateWordsInCamelCaseStringWithSpaces(str) {
                return (str || '').replace(/([A-Z])/g, " $1").trim();
            }

            function formatDateTime(date) {
                if (!date) return '';
                // We will only display fractional seconds to ms precision, because JS's date doesn't support any greater precision than that.
                return ymdhmsfTimeFormatter(date);
            }

            function formatDuration(later, earlier) {
                var rem_ms = later - earlier; // remaining ms
                var ms = rem_ms % 1000;
                var rem_s = Math.floor(rem_ms / 1000); // seconds remaining
                var s = rem_s % 60; // integral seconds part
                var rem_m = Math.floor(rem_s / 60); // minutes remaining
                var m = rem_m % 60; // integral minutes part
                var rem_h = Math.floor(rem_m / 60); // hours remaining
                var h = rem_h % 24; // integral hours part
                var rem_d = Math.floor(rem_h / 24); // days remaining
                var d = rem_d % 365; // integral days part
                var y = Math.floor(d / 365); // integral years part

                var parts = [y ? y + ' year' + (y > 1 ? 's' : '') : null, d ? d + ' day' + (d > 1 ? 's' : '') : null, h ? h + ' hour' + (h > 1 ? 's' : '') : null, m ? m + ' minute' + (m > 1 ? 's' : '') : null, s ? s + ' second' + (s > 1 ? 's' : '') : null].filter(function (x) {
                    return x != null;
                });
                var durationString = parts.join(' ');
                return durationString || ms + ' ms';
            }

            /* Generate the HTML content of the tip for each timeline object from the following properties of each:
                type:  Symbol - Should be either TimelineChart.TYPE.POINT or TimelineChart.TYPE.INTERVAL.
                label:  string | function - HTML content (or function to generate the same) which BRIEFLY names/identifies the object.
                details:  string | function - HTML content (or function to generate the same) which provides details about the object.
            */
            function generateTipHtmlContent(d) {
                // if d.label is a fn, call it to generate tip label content.
                var tipHeading = typeof d.label == 'function' ? formatLabelForTipHtml(d.label(d) + '') : typeof d.label == 'string' ? formatLabelForTipHtml(d.label) : '(no label)';

                var tipDetails = typeof d.details == 'function' ? d.details(d) + '' : typeof d.details == 'string' ? d.details : '';

                // Auto-generate temporal description.  Include "at" time for points or from/to time range for intervals with label.
                var temporalDescription = d.type == TimelineChart.TYPE.POINT ? 'Time: ' + formatDateTime(d.at) : 'From: ' + formatDateTime(d.from) + '<br>To: ' + formatDateTime(d.to) + '<br>Duration: ' + formatDuration(d.to, d.from);
                var result = '\n                <div class="tip-heading h5">' + tipHeading + '</div>\n                <div class="tip-body">\n                <div>' + temporalDescription + '</div>\n                <div>' + tipDetails + '</div>\n                </div>';
                return result;
            };

            function formatLabelForTipHtml(label) {
                return (label || '').replace(/ /g, '&nbsp;').replace(/\\n/g, '<br>');
            };

            // Returns a new string with all single and double quotes escaped, in order to ensure that it can be embedded into another string expression without causing problems.
            // NOTE:  This won't detect if single or double quotes have already been escaped, so it could potentially double-escape them, which would defeat the purpose of this method.
            function escapeQuotes(str) {
                return str.replace(/'/g, "\\'").replace(/"/g, '\\"');
            }

            // Create a separate window to view the formatted JSON content of CaseTimerSnapshotData and CaseTimerEventData
            function createJsonViewerPopup(objToView, heading) {
                var objJson = JSON.stringify(objToView);
                var html = '\n            <html>\n                <head>\n                    <link href="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor.css" rel="stylesheet" type="text/css">\n                </head>\n                <body>\n                    <div id="jsoneditor" style="width: 100%; height: 100%;"></div>\n                    <script src="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor-minimalist.js"></script>\n                    <script>\n                        var editor = new JSONEditor(document.getElementById("jsoneditor"), { mode: \'view\', name: \'' + escapeQuotes(heading) + '\' }, ' + objJson + '); editor.expandAll();\n                    </script>\n                </body>\n            </html>';
                createPopupWindowFromHtml(html, 'json-viewer-popup', 'width=800,height=1200');
            }

            function createPopupWindowFromHtml(html, targetId, windowFeatures, windowTitle) {
                var popup = window.open("", targetId, windowFeatures, false);
                var doc = popup.document;
                doc.open();
                doc.write(html);
                doc.close();
                doc.title = windowTitle;
            }

            function isUUID(value) {
                var result = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
                return !!result && result.index === 0;
            }

            function emptyContainer(container) {
                // remove all child elements of the specified container
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }

            function renderLatestCaseProperties(caseDataToRender) {
                // Case properties
                emptyContainer(latestCaseDetailsContainer);
                renderProperties(latestCaseDetailsContainer, casePropertyConfigs, caseDataToRender);

                // Sla properties
                emptyContainer(latestSlaDetailsContainer);
                renderProperties(latestSlaDetailsContainer, slaPropertyConfigs, caseDataToRender.Sla);
            }

            function renderLatestCaseTimersTable(allCaseTimers, selectedTimers) {
                emptyContainer(latestCaseTimerDetailsContainer);
                renderTableOfObjects(latestCaseTimerDetailsContainer, caseTimerPropertyConfigs, allCaseTimers, selectedTimers);
            }

            // Both event and snapshot data details are treated as immutable, so we don't need to differentiate between latest/historical
            function renderEventDetailsTableAndSnapshotDetailsTableFromEvents(allEvents, selectedEvents) {
                if (!allEvents || !allEvents.length) return; // don't continue to display invalid data

                var caseTimer = allEvents[0].CaseTimer;

                // Identify snapshots corresponding to selected events
                var snapshotsForSelectedEvents = selectedEvents.map(function (evt) {
                    return evt.CaseTimerSnapshot;
                });
                var latestSnapshot = maxBy(selectedEvents.map(function (x) {
                    return x.CaseTimerSnapshot;
                }), function (x) {
                    return x.SnapshotTime;
                });

                highlightNodesInTimeline(selectedEvents, snapshotsForSelectedEvents);

                renderEventDetailsTableAndSnapshotDetailsTableAndHistoricalData(allEvents, selectedEvents, caseTimer.Snapshots, snapshotsForSelectedEvents, latestSnapshot);
            }

            // Both event and snapshot objects are treated as immutable, so we don't need to differentiate between latest/historical
            function renderEventDetailsTableAndSnapshotDetailsTableFromSnapshots(snapshots, selectedSnapshots) {
                var caseTimerId = snapshots[0].SnapshotData.CaseTimer.Id;
                var caseTimer = caseDataModel.CaseTimerMap.get(caseTimerId);

                // Identify events corresponding to selected snapshots
                var selectedEvents = selectedSnapshots.selectMany(function (ss) {
                    return caseDataModel.EventsBySnapshotIdLookup.get(ss.Id);
                }) || [];

                highlightNodesInTimeline(selectedSnapshots, selectedEvents);

                renderEventDetailsTableAndSnapshotDetailsTableAndHistoricalData(caseTimer.Events, selectedEvents, snapshots, selectedSnapshots, firstOrDefault(selectedSnapshots));
            }

            function highlightNodesInTimeline(primaryItemsToHighlight, secondaryItemsToHighlight) {
                // generate array of primary point and interval ID's
                var primaryIds = primaryItemsToHighlight.map(function (x) {
                    return ['p' + x.Id, 'i' + x.Id];
                }).reduce(function (accumulator, currentValue) {
                    return accumulator.concat(currentValue);
                }, []);
                // generate array of secondary point and interval ID's
                var secondaryIds = secondaryItemsToHighlight.map(function (x) {
                    return ['p' + x.Id, 'i' + x.Id];
                }).reduce(function (accumulator, currentValue) {
                    return accumulator.concat(currentValue);
                }, []);

                // In the timeline, highlight the related point based on this snapshot
                timeline.highlightNodeByIds(secondaryIds, false, 'chart-node-highlight-secondary');
                timeline.highlightNodeByIds(primaryIds, true, 'chart-node-highlight-primary');
            }

            // Both event and snapshot objects are treated as immutable, so we don't need to differentiate between latest/historical
            function renderEventDetailsTableAndSnapshotDetailsTableAndHistoricalData(events, selectedEvents, snapshots, selectedSnapshots, snapshotToUseForHistoricalData) {
                if (events && events.length) {
                    var ct = events[0].CaseTimer;
                    d3.select(selectedCaseTimerLabel).html('Selected Timer #' + ct.OrdinalId + ' for ' + (ct.CaseTimerType === 'CaseTimer' ? 'Case' : 'Sla') + ': "' + ct.Name + '"');
                }
                if (!snapshotToUseForHistoricalData && firstOrDefault(selectedSnapshots) != null) snapshotToUseForHistoricalData = firstOrDefault(selectedSnapshots);
                emptyContainer(caseTimerEventDetailsContainer);
                emptyContainer(caseTimerSnapshotDetailsContainer);
                sortBy(events, function (cte) {
                    return cte.OrdinalId;
                }, true);
                sortBy(snapshots, function (ss) {
                    return ss.OrdinalId;
                }, true);
                renderTableOfObjects(caseTimerEventDetailsContainer, caseTimerEventPropertyConfigs, events, selectedEvents);
                renderTableOfObjects(caseTimerSnapshotDetailsContainer, caseTimerSnapshotPropertyConfigs, snapshots, selectedSnapshots);
                renderHistoricalDataFromSnapshot(snapshotToUseForHistoricalData);

                if (selectedSnapshots && selectedSnapshots.length > 0 && shouldShowSnapshotJsonForSelectedItems()) {
                    displaySnapshotAsJson(selectedSnapshots[0]);
                }
            }

            function renderEventDetails(caseTimerEvent) {
                // In the timeline, highlight the related point (and interval) based on this event
                //timeline.highlightNodeByIds(['p'+caseTimerEvent.Id, 'i'+caseTimerEvent.Id], true, 'chart-node-highlight');

                // Render any historical data associated with this event's snapshot
                renderHistoricalDataFromSnapshot(caseTimerEvent.CaseTimerSnapshot);

                // Refresh events/snapshots tables
                renderEventDetailsTableAndSnapshotDetailsTableFromEvents(caseTimerEvent.CaseTimer.Events, [caseTimerEvent]);
            }

            function renderSnapshotDetails(caseTimerSnapshot) {
                var caseTimerId = caseTimerSnapshot.SnapshotData.CaseTimer.Id;
                var snapshotsForTimer = caseDataModel.CaseTimerMap.get(caseTimerId).Snapshots;

                // In the timeline, highlight the related point based on this snapshot
                //timeline.highlightNodeByIds('p'+caseTimerSnapshot.Id, true, 'chart-node-highlight');

                // Render any historical data associated with this snapshot
                renderHistoricalDataFromSnapshot(caseTimerSnapshot);

                // Refresh events/snapshots tables
                renderEventDetailsTableAndSnapshotDetailsTableFromSnapshots(snapshotsForTimer, [caseTimerSnapshot]);
            }

            function renderHistoricalDataFromSnapshot(snapshot) {
                emptyContainer(historicalSnapshotDetailsContainer);
                emptyContainer(historicalCaseDetailsContainer);
                emptyContainer(historicalSlaDetailsContainer);
                emptyContainer(historicalCaseTimerDetailsContainer);

                if (!snapshot) return;

                renderProperties(historicalSnapshotDetailsContainer, caseTimerSnapshotPropertyConfigs, snapshot);
                renderProperties(historicalCaseDetailsContainer, casePropertyConfigs, snapshot.SnapshotData.CaseTimer.Case);
                renderProperties(historicalSlaDetailsContainer, slaPropertyConfigs, snapshot.SnapshotData.CaseTimer.Case.Sla);

                // For each case timer in effect, resolve the latest snapshot whose snapshot time is <= the current snapshot 
                var eligibleSnapshots = getCaseDataModel().Snapshots.filter(function (x) {
                    return x.SnapshotTime <= snapshot.SnapshotTime;
                });
                var snapshotsGroupedByTimerId = d3.nest().key(function (d) {
                    return d.SnapshotData.CaseTimer.Id;
                }).entries(eligibleSnapshots);
                var latestSnapshotsByDistinctTimerId = snapshotsGroupedByTimerId.map(function (g) {
                    return {
                        "CaseTimerId": g.key,
                        "CaseTimerSnapshot": maxBy(g.values, function (_) {
                            return _.SnapshotTime * 1;
                        })
                    };
                });
                var caseTimersToDisplay = latestSnapshotsByDistinctTimerId.map(function (x) {
                    return x.CaseTimerSnapshot.SnapshotData.CaseTimer;
                });
                renderTableOfObjects(historicalCaseTimerDetailsContainer, caseTimerPropertyConfigs, caseTimersToDisplay, []);
            }

            // Perform an in-place sort of array elements according to the "value" of the property returned by the specified selector.  Then, return the sorted array.
            function sortBy(arr, ps, ascendingOrder) {
                if (!arr) return [];
                return arr.sort(function (a, b) {
                    return ps(a) < ps(b) ? -1 : ps(a) == ps(b) ? 0 : 1;
                });
            }

            function distinctBy(arr, ps) {}

            function firstOrDefault(arr) {
                if (!arr || arr.length == 0) return null;
                return arr[0];
            }

            function withFirst(arr, fn) {
                var first = firstOrDefault(arr);
                if (first === null) return;
                fn.call(this, first);
            }

            // Return the element of the specified array whose property selector produces the maximum value.
            function maxBy(arr, ps) {
                if (!arr || arr.length == 0) return null;
                if (arr.length == 1) return arr[0];
                var maxValue = ps(arr[0]);
                var maxi = 0;
                for (var i = 1; i < arr.length; i++) {
                    var value = ps(arr[i]);
                    if (value > maxValue) {
                        maxValue = value;maxi = i;
                    }
                }
                return arr[maxi];
            }

            // Return the element of the specified array whose property selector produces the minimum value.
            function minBy(arr, ps) {
                if (!arr || arr.length == 0) return null;
                if (arr.length == 1) return arr[0];
                var minValue = ps(arr[0]);
                var mini = 0;
                for (var i = 1; i < arr.length; i++) {
                    var value = ps(arr[i]);
                    if (value < minValue) {
                        minValue = value;mini = i;
                    }
                }
                return arr[mini];
            }

            function renderTableOfObjects(tableContainer, propertyConfigs, itemsToRender, itemsToHighlight) {
                // itemsToRender is required and must contain data
                if (!itemsToRender) {
                    alert('renderTableOfObjects called with no data');
                    return;
                }

                itemsToHighlight = itemsToHighlight || [];

                var table = d3.select(tableContainer).append('table')
                //.classed('table', true);
                .classed('tablesaw', true)
                //.attr( 'data-tablesaw-mode', 'stack')
                .attr('data-tablesaw-sortable', '').attr('data-tablesaw-sortable-switch', '').attr('data-tablesaw-minimap', '').attr('data-tablesaw-mode', 'columntoggle');
                var headerRow = table.append('thead').append('tr');
                // render table header
                propertyConfigs.forEach(function (pc) {
                    return headerRow.append('th').attr('data-tablesaw-sortable-col', '').attr('data-tablesaw-priority', pc.priority === 0 ? 'persist' : pc.priority).html(pc.propertyLabel);
                });

                var tbody = table.append('tbody');

                itemsToRender.forEach(function (obj) {
                    var tr = tbody.append('tr').classed('row-highlight', itemsToHighlight.findIndex(function (o) {
                        return o == obj;
                    }) != -1).selectAll('td').data(propertyConfigs);
                    tr.enter().append('td').call(function (sel) {
                        return renderPropertyValue(sel, obj);
                    });
                });

                // Apply tablesaw features to table
                initializeTableFeatures();

                // attempt to scroll all highlighted items into view
                var highlightedElements = table.selectAll('.row-highlight').nodes();
                if (highlightedElements && highlightedElements[0] && highlightedElements[0].scrollIntoView) {
                    // scroll the last highlighted element into view
                    highlightedElements[highlightedElements.length - 1].scrollIntoView({ block: "nearest" });
                    // if more than 1 is highlighted, then scroll the first highlighted element into view
                    if (highlightedElements.length > 1) highlightedElements[0].scrollIntoView({ block: "nearest" });
                }
            }

            function renderPropertyValue(d3SelectionBoundToPropertyConfig, objectWithProperties) {
                var obj = objectWithProperties;
                d3SelectionBoundToPropertyConfig.attr('data-title', function (d) {
                    return d.propertyLabel;
                }).html(function (d) {
                    return getHtmlContentForPropertyValue(d, obj);
                }).on('click', function (d) {
                    if (typeof d.onClick == 'function') d.onClick(obj);
                });
            }

            function renderProperties(parentElement, propertyConfigs, obj) {
                if (!obj) d3.select(parentElement).appendHTML('<div> No data exists. </div>');else d3.select(parentElement).selectAll('div').data(propertyConfigs).enter().append('div').call(function (pc) {
                    return renderPropertyLabelAndValue(pc, obj);
                });
            }

            function renderPropertyLabelAndValue(d3SelectionBoundToPropertyConfig, objectWithProperties) {
                var propertyWrapper = d3SelectionBoundToPropertyConfig.append('div').attr('class', 'property-label-and-value');
                var labelElement = propertyWrapper.append('div').attr('class', 'property-label').html(function (pc) {
                    return pc.propertyLabel;
                });
                var valueElement = propertyWrapper.append('div').attr('class', 'property-value').call(function (pc) {
                    return renderPropertyValue(pc, objectWithProperties);
                });
            }

            function getHtmlContentForPropertyValue(propertyConfig, obj) {
                var propertyValue = propertyConfig.propertyValueSelector(obj);

                if (propertyValue === undefined) {
                    return "";
                } else if (propertyValue === null) {
                    return "(null)";
                } else if (typeof propertyValue == 'number') {
                    return propertyValue;
                } else if (typeof propertyValue == 'string') {
                    //if (isUUID(propertyValue))
                    //    return "<span title='"+propertyValue+"'>"+propertyValue.substring(0, 7)+"...</span>";
                    return propertyValue;
                } else if (typeof propertyValue == 'boolean') {
                    return "<input type='checkbox' " + (!!propertyValue ? "checked" : "") + " onclick='return false;' />";
                } else if (propertyValue.constructor == new Date().constructor) {
                    return formatDateTime(propertyValue);
                } else if (!!propertyConfig.onClick) {
                    return '<button class="btn btn-sm btn-' + (propertyConfig.priority < 3 ? 'primary' : 'secondary') + '">View</button>';
                }
                return '<em>(no value resolver defined for this type)</em>';
            }

            // function normalizeProperties(caseTimerArray)
            // {
            //     var convertDateProperties = function(obj, propertyNamesArray)
            //     {
            //         if (!obj) return;
            //         propertyNamesArray.forEach(pn => {
            //             var value = obj[pn];
            //             if (value !== null && typeof value === 'string')
            //                 obj[pn] = parseDateTime(value);
            //         });
            //     };

            //     caseTimerArray.forEach(ct => {
            //         ct.Events.forEach(e => {
            //             convertDateProperties(e, [ "EventTime", "LastModified" ]);
            //             convertDateProperties(e.CaseTimerSnapshot, [ "SnapshotTime", "LastModified" ]);
            //             var ssd = e.CaseTimerSnapshot.SnapshotData;
            //             convertDateProperties(ssd, [ "SnapshotTime", "LastModified" ]);
            //             convertDateProperties(ssd.CaseTimer, [ "LastCalculated", "LastModified", "Started", "Stopped" ]);
            //             convertDateProperties(ssd.Sla, [ "EstimatedNextControlPointDate", "EstimatedTargetResolutionDate", "LastModified" ]);
            //         });
            //         convertDateProperties(ct, [ "LastCalculated", "LastModified", "Started", "Stopped" ]);
            //     });
            // }

            function restoreReferencesInCaseTimerObjectGraph(caseTimerArray) {
                // normalize data
                caseTimerArray.forEach(function (ct) {
                    ct.Snapshots.forEach(function (ss) {
                        afterSnapshotDataDeserialized(ss.SnapshotData);
                    });
                    var snapshotsById = d3.map(ct.Snapshots, function (ss) {
                        return ss.Id;
                    });

                    ct.Events.forEach(function (e) {
                        // link the case timer events to the case timer that it belongs to
                        e.CaseTimer = ct;
                        e.CaseTimerSnapshot = snapshotsById.get(e.CaseTimerSnapshot.Id);

                        //afterSnapshotDataDeserialized(e.CaseTimerSnapshot.SnapshotData);
                    });
                });
            }

            // Convert date strings to date objects
            function normalizeDatesRecursively(input) {
                var eachRecursive = function eachRecursive(obj) {
                    d3.map(obj).each(function (val, key) {
                        if (!!val) {
                            if ((typeof val === 'undefined' ? 'undefined' : _typeof(val)) === "object") eachRecursive(val);
                            if (typeof val === "string") obj[key] = parseDateTime(val);
                        }
                    });
                };
                eachRecursive(input);
            }

            function transformCaseDataToTimelineData(caseDataToTransform) {
                if (!caseDataToTransform.Timers.length) return [];

                // create a copy of the data
                //let caseTimerArray = JSON.parse(JSON.stringify(caseDataToTransform.Timers));

                // Ensure that timers are ordered by when they were started
                var caseTimerArray = sortBy(caseDataToTransform.Timers, function (_) {
                    return _.Started;
                });

                // Iterate over timers to set an ordinal ID and to sort events on each
                var ordinalId = 1;
                caseTimerArray.forEach(function (ct) {
                    ct.OrdinalId = ordinalId++;
                    sortBy(ct.Events, function (_) {
                        return _.EventTime;
                    });
                });

                normalizeDatesRecursively(caseDataToTransform);
                //normalizeProperties(caseTimerArray);

                restoreReferencesInCaseTimerObjectGraph(caseTimerArray);

                // Flatten the events
                var allEvents = caseTimerArray.selectMany(function (t) {
                    return t.Events;
                });
                // Create a D3 map of case timer Id to case timer
                caseDataToTransform.CaseTimerMap = d3.map(caseDataToTransform.Timers, function (ct) {
                    return ct.Id;
                });
                // Create a D3 map of snapshot Id to snapshot (distinct values only).
                var caseTimerSnapshotsMap = d3.map(allEvents.map(function (cte) {
                    return cte.CaseTimerSnapshot;
                }), function (cts) {
                    return cts.Id;
                });
                // Replace snapshot data with distinct snapshot objects (so we won't have different copies of the same snapshot floating around).
                allEvents.forEach(function (cte) {
                    return cte.CaseTimerSnapshot = caseTimerSnapshotsMap.get(cte.CaseTimerSnapshot.Id);
                });
                // Make array of snapshots accessible from case data.
                caseDataToTransform.SnapshotMap = caseTimerSnapshotsMap;
                caseDataToTransform.Snapshots = sortBy(caseTimerSnapshotsMap.values(), function (ss) {
                    return ss.SnapshotTime;
                }, true);
                // Create a D3 map of case timer Id's to snapshots
                //            var snapshotsByCaseTimerIds = d3.nest().key(cts => cts.SnapshotData.CaseTimer.Id).map(caseDataToTransform.Snapshots);
                // Set snapshots array on each case timer object (to facilitate access later)
                //            caseTimerArray.forEach(ct => ct.Snapshots = sortBy(snapshotsByCaseTimerIds.get(ct.Id), ss => ss.SnapshotTime, true));
                caseTimerArray.forEach(function (ct) {
                    return ct.Snapshots = sortBy(ct.Snapshots, function (ss) {
                        return ss.SnapshotTime;
                    }, true);
                });
                // Create a D3 nested map from case timer snapshot Id to events
                caseDataToTransform.EventsBySnapshotIdLookup = d3.nest().key(function (cte) {
                    return cte.CaseTimerSnapshot.Id;
                }).map(allEvents);

                var allTimelineSeriesForAllTimers = caseTimerArray.map(function (ct) {
                    // for each case timer, this returns an array of data series, each of which can be plotted on the timeline

                    // Create timeline point data from case timer events, grouped by event time.
                    // As we group these events by EventTime into points, we have to treat the EventTime as an integral number of milliseconds.
                    // Otherwise, the milliseconds will be lost if we just use the EventTime (Date), because the d3.nest.key resolver will convert the returned object into a string.
                    var caseTimerEventPoints = d3.nest().key(function (cte) {
                        return cte.EventTime * 1;
                    }).entries(ct.Events).
                    // map d3 groupings (of { key: "", values: [] }) into an array of points for the timeline
                    map(function (d) {
                        var timeOfEvents = new Date(d.key * 1);
                        var eventsAtTime = d.values;
                        // Create point data structure
                        var pointObj = {
                            type: TimelineChart.TYPE.POINT,
                            //customClass: 'point-white',
                            label: function label() {
                                return eventsAtTime.length + ' Event' + (eventsAtTime.length == 1 ? '' : 's') + eventsAtTime.map(function (e) {
                                    return '<br>\uD83D\uDCC5 ' + e.EventIdentifierString;
                                }).join('');
                            },
                            at: timeOfEvents,
                            data: d.values,
                            ids: d.values.map(function (p) {
                                return 'p' + p.Id;
                            }), // event guids will serve as the ids
                            onClick: function onClick() {
                                //timeline.highlightNodeByIds('p'+d.values[0].Id, true, 'chart-node-highlight');
                                renderLatestCaseTimersTable(caseTimerArray, [ct]);
                                renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, eventsAtTime);
                            }
                        };
                        // Set the point reference on each event object.  (NOTE: each event should belong to 1 and only 1 point.)
                        d.values.forEach(function (evt) {
                            return evt.point = pointObj;
                        });
                        return pointObj;
                    });

                    // Create initial series for timer which will contain points for all case timer events
                    var timerEventsSeries = {
                        label: ct.OrdinalId + '. Events for ' + ct.CaseTimerType + ': [' + ct.Name + ']',
                        groupingKey: ct.Id, // The case timer Id is a suitable grouping key
                        data: caseTimerEventPoints
                    };

                    // Create timeline point data from case timer snapshots, grouped by snapshot time.
                    // As we group these events by SnapshotTime into points, we have to treat the SnapshotTime as an integral number of milliseconds.
                    // Otherwise, the milliseconds will be lost if we just use the SnapshotTime (Date), because the d3.nest.key resolver will convert the returned object into a string.
                    var caseTimerSnapshotPoints = d3.nest().key(function (cts) {
                        return cts.SnapshotTime * 1;
                    }).entries(ct.Snapshots).
                    // map d3 groupings (of { key: "", values: [] }) into an array of points for the timeline
                    map(function (d) {
                        var snapshotTime = new Date(d.key * 1); // convert key from string to a number to a date
                        var snapshotsAtTime = d.values;

                        function generateSnapshotTipHtmlDetails(snapshots) {
                            // the current snapshot to use for this point
                            var ss = snapshots.find(function (ss) {
                                return !ss.IsDerived;
                            }) || snapshots[0];
                            // resolve the subsequent non-derived snapshot
                            var sndss = ss.SubsequentNonDerivedSnapshot;
                            if (!sndss) return '';
                            var timer = sndss.SnapshotData.CaseTimer;
                            var timerInfo = !timer ? '' : '\n                                <h5>Timer</h5> \n                                State: ' + timer.CurrentEffectiveClockState + '<br>\n                                Current NWTP Types: ' + timer.CurrentNonWorkingTimePeriodTypes + '<br>\n                                Elapsed Time: ' + timer.ElapsedTime + ' (' + timer.Offset + ' + ' + timer.RunTime + ')<br>\n                                Last Calculated: ' + formatDateTime(timer.LastCalculated) + '<br>\n                            ';
                            var sla = sndss.SnapshotData.Sla;
                            var slaInfo = !sla ? '' : '\n                                <h5>SLA</h5> \n                                Status: ' + sla.Status + '<br>\n                                <table class="table table-sm">\n                                    <thead>\n                                        <tr>\n                                            <th scope="col"></th>\n                                            <th scope="col">Target Duration</th>\n                                            <th scope="col">Duration Remaining</th>\n                                            <th scope="col">Estimated DateTime</th>\n                                            <th scope="col">Breached?</th>\n                                        </tr>\n                                    </thead>\n                                    <tbody>\n                                        <tr>\n                                            <th scope="row">SLA Initial Response</th>\n                                            <td>' + sla.TargetInitialResponseDuration + '</td>\n                                            <td>' + (sla.TimeUntilInitialResponse || '') + '</td>\n                                            <td>' + formatDateTime(sla.ExpectedInitialResponseDate) + '</td>\n                                            <td>' + sla.HasInitialResponseBreached + '</td>\n                                        </tr>\n                                        <tr>\n                                            <th scope="row">SLA Target Resolution</th>\n                                            <td>' + sla.TargetResolutionDuration + '</td>\n                                            <td>' + sla.TimeRemaining + '</td>\n                                            <td>' + formatDateTime(sla.EstimatedTargetResolutionDate) + '</td>\n                                            <td>' + sla.HasTargetResolutionBreached + '</td>\n                                        </tr>\n                                        <tr>\n                                            <th scope="row">Next Control Point</th>\n                                            <td></td>\n                                            <td>' + sla.TimeUntilNextControlPoint + '</td>\n                                            <td>' + formatDateTime(sla.EstimatedNextControlPointDate) + '</td>\n                                            <td></td>\n                                        </tr>\n                                    </tbody>\n                                </table>\n                                ';
                            return '<div><em>The following comes from ' + (!sndss.Id ? 'the current state of this case timer' : 'subsequent non-derived snapshot ' + sndss.Id) + '.</em></div>\n                                    ' + timerInfo + '\n                                    ' + slaInfo + '\n                                    ' + (ss.IsDerived ? '<div><strong><em>NOTE: Because this snapshot is derived, the times above may not be accurate.  They actually describe the state of affairs as of the prior non-derived snapshot.</em></strong></div>' : '') + '\n                                    ';
                        }
                        // Create point data structure
                        var pointObj = {
                            type: TimelineChart.TYPE.POINT,
                            //customClass: 'point-white',
                            label: function label() {
                                var ss = snapshotsAtTime.find(function (ss) {
                                    return !ss.IsDerived;
                                }) || snapshotsAtTime[0];
                                return '\uD83D\uDCF7 ' + (ss.IsDerived ? 'Derived' : 'Live') + ' Snapshot ' + ss.OrdinalId + ': ' + ss.Id;
                                // return `${snapshotsAtTime.length} Snapshot${snapshotsAtTime.length == 1 ? '' : 's'}`+
                                //     snapshotsAtTime.map(e => `<br>📷 ${e.OrdinalId}: ${e.IsDerived ? 'Derived' : 'Live'}: ${e.Id}`).join('');
                            },
                            details: function details() {
                                return generateSnapshotTipHtmlDetails(snapshotsAtTime);
                            },
                            at: snapshotTime,
                            data: d.values,
                            ids: d.values.map(function (p) {
                                return 'p' + p.Id;
                            }), // snapshot guids will serve as the ids
                            onClick: function onClick() {
                                //timeline.highlightNodeByIds('p'+d.values[0].Id, true, 'chart-node-highlight');
                                renderLatestCaseTimersTable(caseTimerArray, [ct]);
                                renderEventDetailsTableAndSnapshotDetailsTableFromSnapshots(ct.Snapshots, snapshotsAtTime);
                            }
                        };
                        // Set the point reference on each event object.  (NOTE: each event should belong to 1 and only 1 point.)
                        d.values.forEach(function (evt) {
                            return evt.point = pointObj;
                        });
                        return pointObj;
                    });

                    var timerSnapshotsSeries = {
                        label: 'Case Timer Snapshots',
                        groupingKey: ct.Id, // The case timer Id is a suitable grouping key
                        data: caseTimerSnapshotPoints
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

                    // Define a function to create a grouping key from an event.  Each event will end up in at most 1 group.
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

                        // Ensure that the events of interest are sorted, so that intervals start and stop when appropriate.
                        var eventsOfInterest = intervalGroup.values.sort(function (a, b) {
                            return a.EventTime * 1 - b.EventTime * 1;
                        });

                        // Create intervals for this group from the events
                        var intervals = [];

                        var _loop = function _loop() {
                            var curEvt = eventsOfInterest[i];
                            var nextEvt = eventsOfInterest.length > i + 1 ? eventsOfInterest[i + 1] : null;
                            var ic = intervalConfig;

                            // Create and add interval object
                            intervalObj = {
                                type: TimelineChart.TYPE.INTERVAL,
                                intervalType: ic.intervalType,
                                customClass: ic.customClass,
                                label: ic.intervalLabelFn(curEvt),
                                from: parseDateTime(curEvt.EventTime)
                            };

                            if (nextEvt != null) {
                                // if both endpoints of interval are known
                                intervalObj = Object.assign({
                                    to: parseDateTime(nextEvt.EventTime),
                                    data: [curEvt, nextEvt],
                                    ids: ['i' + curEvt.Id, 'i' + nextEvt.Id], // starting/ending event guids will serve as the ids
                                    onClick: function onClick() {
                                        //timeline.highlightNodeByIds('i'+curEvt.Id, true, 'chart-node-highlight');
                                        renderLatestCaseTimersTable(caseTimerArray, [ct]);
                                        renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, [curEvt, nextEvt]);
                                    }
                                }, intervalObj);
                                nextEvt.interval = intervalObj;
                            } else {
                                // if only the starting time is known, the end time will be "now"
                                intervalObj = Object.assign({
                                    to: now,
                                    data: [curEvt],
                                    ids: ['i' + curEvt.Id], // starting event guid will serve as the id
                                    onClick: function onClick() {
                                        //timeline.highlightNodeByIds('i'+curEvt.Id, true, 'chart-node-highlight');
                                        renderLatestCaseTimersTable(caseTimerArray, [ct]);
                                        renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, [curEvt]);
                                    }
                                }, intervalObj);
                            }
                            curEvt.interval = intervalObj; // Set the interval reference on the event object.  (NOTE: no event should be a member of > 1 interval.)
                            intervals.push(intervalObj);
                        };

                        for (var i = 0; i < eventsOfInterest.length; i += 2) {
                            var intervalObj;

                            _loop();
                        }

                        // return a new interval series
                        return {
                            label: intervalConfig.groupLabelFn(intervalGroup.values[0]),
                            groupingKey: ct.Id, // The case timer Id is a suitable grouping key
                            data: intervals
                        };
                    });
                    //console.log("timerIntervalSeriesArray: ", timerIntervalSeriesArray);
                    // end grouping of intervals


                    // Order and assign OrdinalId to Snapshots
                    ct.Snapshots.sort(function (a, b) {
                        // primary sort key is the snapshot time
                        if (a.SnapshotTime < b.SnapshotTime) return -2;
                        if (a.SnapshotTime > b.SnapshotTime) return 2;

                        // secondary sort key is the modified time
                        if (a.LastModified < b.LastModified) return -1;
                        if (a.LastModified > b.LastModified) return 1;

                        return 0;
                    });
                    // Number the snapshots
                    ct.Snapshots.forEach(function (ss, i) {
                        ss.OrdinalId = i + 1;
                    });

                    // For each snapshot, add a reference to the subsequent non-deried snapshot.
                    // This will represent the final non-derived state of the timer, for the purposes of displaying calculated times for each snapshot.
                    var subsequentNonDerivedSnapshot = {
                        SnapshotTime: new Date(),
                        OrdinalId: ct.Snapshots.length + 1,
                        IsDerived: false,
                        LastModified: new Date(),
                        Id: null,
                        SnapshotData: {
                            CaseTimer: {
                                CurrentEffectiveClockState: ct.CurrentEffectiveClockState,
                                CurrentNonWorkingTimePeriodTypes: ct.CurrentNonWorkingTimePeriodTypes,
                                ElapsedTime: ct.ElapsedTime,
                                Offset: ct.Offset,
                                RunTime: ct.RunTime,
                                LastCalculated: ct.LastCalculated
                            }
                        }
                    };
                    var snapshotsReversed = ct.Snapshots.slice(0).reverse();
                    snapshotsReversed.forEach(function (ss) {
                        ss.SubsequentNonDerivedSnapshot = subsequentNonDerivedSnapshot;
                        if (!ss.IsDerived) subsequentNonDerivedSnapshot = ss;
                    });

                    // Create series for calculation intervals
                    var calculationIntervalsSeries = {
                        label: 'Calculation Intervals',
                        groupingKey: ct.Id, // The case timer Id is a suitable grouping key
                        data: []
                    };
                    ct.Snapshots.filter(function (x) {
                        return !x.IsDerived;
                    }).forEach(function (ss) {
                        var curSD = ss.SnapshotData;
                        var nextSD = ss.SubsequentNonDerivedSnapshot.SnapshotData;
                        var intervalObj = {
                            type: TimelineChart.TYPE.INTERVAL,
                            intervalType: 'CalculationInterval',
                            customClass: '', //ic.customClass,
                            label: '', //ic.intervalLabelFn(curEvt),
                            from: curSD.CaseTimer.LastCalculated || curSD.CaseTimer.Started,
                            to: nextSD.CaseTimer.LastCalculated,
                            data: [curSD, nextSD],
                            ids: [],
                            onClick: null
                        };
                        calculationIntervalsSeries.data.push(intervalObj);
                    });
                    // var ci_ss =  ct.Snapshots[0];
                    // while (ci_ss.SubsequentNonDerivedSnapshot) {
                    //     var data = [  ];

                    //     ci_ss = ci_ss.SubsequentNonDerivedSnapshot;
                    // }


                    // Order and assign OrdinalId to Events
                    // Getting events sorted in an intuitive way is more complex than one might suppose.
                    // Here, we sort by the following things, in this particular order:
                    //  1. event date
                    //  2. intervals that each event is a part of
                    //  3. related snapshot time
                    var getIntervalPointAvgDate = function getIntervalPointAvgDate(p) {
                        return p.type === TimelineChart.TYPE.POINT ? p.at : new Date(p.from * 1 + (p.to - p.from) / 2);
                    };
                    ct.Events.sort(function (a, b) {
                        // primary sort key is the event time
                        if (a.EventTime < b.EventTime) return -3;
                        if (a.EventTime > b.EventTime) return 3;

                        // tertiary sort key is the related snapshot time
                        if (a.CaseTimerSnapshot.SnapshotTime * 1 < b.CaseTimerSnapshot.SnapshotTime * 1) return -2;
                        if (a.CaseTimerSnapshot.SnapshotTime * 1 > b.CaseTimerSnapshot.SnapshotTime * 1) return 2;

                        // secondary sort key is the related interval time
                        var aAvgDate = getIntervalPointAvgDate(a.interval || a.point);
                        var bAvgDate = getIntervalPointAvgDate(b.interval || b.point);
                        if (aAvgDate < bAvgDate) return -1;
                        if (aAvgDate > bAvgDate) return 1;

                        return 0;
                    });
                    // Number the events
                    ct.Events.forEach(function (evt, i) {
                        evt.OrdinalId = i + 1;
                    });

                    var allSeriesForTimer = [timerEventsSeries, timerSnapshotsSeries, calculationIntervalsSeries].concat(timerIntervalSeriesArray);

                    return allSeriesForTimer;
                })
                // flatten the array of timeline data series arrays into a single array of TDS.
                .reduce(function (accumulator, currentValue) {
                    return accumulator.concat(currentValue);
                });

                // At this point, there will be multiple series associated with each timer.
                // We want to provide some sort of visual grouping mechanism so that all series associated with the same case timer can be visually grouped.
                // Transform the group key to a 0-based index.
                var newGroupNumber = 0;
                var lastGroupKey = "----------------";
                allTimelineSeriesForAllTimers.forEach(function (x) {
                    if (lastGroupKey != x.groupingKey) {
                        lastGroupKey = x.groupingKey;
                        newGroupNumber++;
                    }
                    x.groupingKey = newGroupNumber;
                });

                //console.log("TimelineSeries: ", allTimelineSeriesForAllTimers);
                return allTimelineSeriesForAllTimers;
            }
        }

        _createClass(CaseTimerEventViewer, [{
            key: 'updateTimelineData',
            value: function updateTimelineData(newCaseData) {
                this.renderCaseData(newCaseData);
            }
        }]);

        return CaseTimerEventViewer;
    }();

    module.exports = CaseTimerEventViewer;
});
//# sourceMappingURL=case-timer-event-viewer.js.map
