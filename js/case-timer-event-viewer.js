class CaseTimerEventViewer {
    constructor(element, initialCaseData, opts) {
        let self = this;

        // We'll use this several times hereafter
        Array.prototype.selectMany = function(memberArraySelectorFn){ return this.map(memberArraySelectorFn).reduce((a,b) => a.concat(b)); };

        // Extend the d3 selection prototype to include some additional functions

        // Note:  This function will ONLY append the first element in the HTML string literal provided.
        if (!d3.selection.prototype.appendHTML) {
            d3.selection.prototype.appendHTML =
            //d3.selection.enter.prototype.appendHTML = 
            function(HTMLString) {
                return this.select(function() {
                    return this.appendChild(document.importNode(new DOMParser().parseFromString(HTMLString, 'text/html').body.childNodes[0], true));
                });
            };
        }
        d3.selection.prototype.hide = 
            //d3.selection.enter.prototype.hide = 
            function() { this.style('display', 'none') };
        d3.selection.prototype.show = 
            //d3.selection.enter.prototype.show = 
            function() { this.style('display', null) };
        d3.selection.prototype.visible = 
            //d3.selection.enter.prototype.visible = 
            function(value) { if (value === undefined) return this.style('display') !== 'none'; this.style('display', !!value ? null : 'none'); };

        function appendHtmlNodesToHead(headHTMLString) {
            var targetNode = d3.select('head').node();
            var nodesToImport = new DOMParser().parseFromString(headHTMLString, 'text/html').head.childNodes;
            for(var i = 0; i < nodesToImport.length; i++) {
                targetNode.appendChild(document.importNode(nodesToImport[i], true));
            }
        }

        // Add style and script dependencies needed by this component
        appendHtmlNodesToHead([
            '<link href="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor.css" rel="stylesheet" type="text/css">',
            '<script src="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor-minimalist.js"></script>',
            '<link href="https://cdn.jsdelivr.net/npm/tablesaw@3.0.9/dist/tablesaw.min.css" rel="stylesheet" type="text/css">',
            //'<script src="https://cdn.jsdelivr.net/npm/tablesaw@3.0.9/dist/tablesaw.min.js"></script>'
            //'<script src="tablesaw.min.js"></script>'
            ].join('\n'));
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


        d3.select(element).appendHTML(`
            <div id="case-timer-event-viewer-container" class="container-fluid font-scale-pct-80">

                <div id="case-timer-event-viewer-error" class="alert alert-danger mt-3" role="alert">
                    <h4 class="alert-heading"> Error:  Invalid input argument.  Please try again.</h4>
                </div>

                
                <div id="case-timer-event-viewer-input" class="mt-3">
                    <div class="h4 bottom-border">Input</div>
                    <div class="row mb-3">
                        <div class="col-6">
                            <div class="input-group">
                                <input type="text" class="form-control" placeholder="Enter a valid case Id, case timer Id, or SLA Id to load related data" id="entity-id" />
                                <div class="input-group-append">
                                    <button id="load-entity-button" class="btn btn-primary">Load</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="case-timer-event-viewer-content">

                    <div class="mb-3">
                        <div class="h4 bottom-border">
                            <label for="case-timer-data-latest-toggle">Latest Data</label>
                            <input type="checkbox" id="case-timer-data-latest-toggle" data-toggle-target-element-id="case-timer-data-latest" />
                        </div>
                        <div id="case-timer-data-latest" class="indent">
                            <div class="row mb-3">
                                <div class="col-12">
                                    <div class="h6">Case</div>
                                    <div id="case-details-latest" class="property-card-flex-layout" ></div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <div class="h6">SLA</div>
                                    <div id="sla-details-latest" class="property-card-flex-layout" ></div>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col-12">
                                    <div class="h6">Case Timers</div>
                                    <div id="case-timer-details-latest" class="scrollable-container" ></div>
                                </div>
                            </div>
                        </div>
                    </div>


                    <!-- Timeline -->
                    <div class="row mb-3">
                        <div class="col-12">
                            <div class="h4 bottom-border">Case Timer Events Timeline
                                <button id="reset-timeline-view" type="button" class="btn btn-info btn-sm ml-4 m-1">Reset View</button>
                            </div>
                            <div id="timeline-chart" class="chart-container" ></div>
                        </div>
                    </div>


                    <div class="mb-3">
                        <div id="selected-case-timer-label" class="h4 bottom-border">Selected Case Timer</div>
                        <div class="row">
                            <div class="col-8">
                                <div class="h6">Events</div>
                                <div id="event-details" class="scrollable-container" ></div>
                            </div>
                            <div class="col-4">
                                <div class="h6">Snapshots</div>
                                <div id="case-timer-snapshot-details" class="scrollable-container" ></div>
                            </div>
                        </div>
                    </div>


                    <div class="h4 bottom-border">
                        <label for="case-timer-data-historical-contextual-toggle">Historical Data Contemporary with Selected Snapshot</label>
                        <input type="checkbox" id="case-timer-data-historical-contextual-toggle" data-toggle-target-element-id="case-timer-data-historical-contextual" />
                    </div>
                    <div id="case-timer-data-historical-contextual" class="indent">
                        <div class="row mb-3">
                            <div class="col-12">
                                <div class="h6">Selected Snapshot</div>
                                <div id="snapshot-details-historical" class="property-card-flex-layout" ></div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-12">
                                <div class="h6">Case</div>
                                <div id="case-details-historical" class="property-card-flex-layout" ></div>
                            </div>
                        </div>
                        <div class="row mb-3">
                            <div class="col-12">
                                <div class="h6">SLA</div>
                                <div id="sla-details-historical" class="property-card-flex-layout" ></div>
                            </div>
                        </div>

                        <div class="row">
                            <div class="col-12">
                                <div class="h5">Case Timers</div>
                                <div id="case-timer-details-historical" class="scrollable-container" ></div>
                            </div>
                        </div>
                    </div>

                </div>

            </div>`);

        // set up 
        d3.selectAll('[data-toggle-target-element-id]').each(function(d, i, o) {
            var toggleEl = this;
            var toggle = d3.select(toggleEl);

            var targetElementId = toggle.attr('data-toggle-target-element-id');
            if (!targetElementId) return;

            var target = d3.select('#'+targetElementId);
            var targetElement = target.node();
            if (!targetElement) return;

            var toggleFn = function() {
                var isVisible = toggle.property('checked');
                toggle.html(isVisible ? 'hide' : 'show');
                target.style('display', isVisible ? '' : 'none');
            };
            toggle.on('click', toggleFn);
            toggleFn();
         });

        d3.select('#load-entity-button')
            .on('click', d => { 
                var newurl = `${window.location.origin + window.location.pathname}?id=${d3.select('#entity-id').property('value')}`;
                window.location.href = newurl;
            });

        const selectedCaseTimerLabel = document.getElementById('selected-case-timer-label');
        const latestCaseDetailsContainer = document.getElementById('case-details-latest');
        const latestSlaDetailsContainer = document.getElementById('sla-details-latest');
        const historicalSnapshotDetailsContainer = document.getElementById('snapshot-details-historical');
        const historicalCaseDetailsContainer = document.getElementById('case-details-historical');
        const historicalSlaDetailsContainer = document.getElementById('sla-details-historical');
        const timelineContainer = document.getElementById('timeline-chart');
        const latestCaseTimerDetailsContainer = document.getElementById('case-timer-details-latest');
        const historicalCaseTimerDetailsContainer = document.getElementById('case-timer-details-historical');
        const eventDetailsContainer = document.getElementById('event-details');
        const caseTimerSnapshotDetailsContainer = document.getElementById('case-timer-snapshot-details');
        const selectedSnapshotContainer = document.getElementById('snapshot-details');

        // =======================================================================================================================================================================
        // Property Config fields:
        //  priority (optional) - The priority of the field which indicates how important it is to show the field.  Range: 0(most important/always show) -> 6(least important)
        //  propertyLabel - The label to display for the column header / field
        //  propertyValueSelector - A function that returns the HTML content to be displayed, given the object
        //  onClick - (optional) A click event handler which will be registered on the content.
        // =======================================================================================================================================================================

        // Case property configs
        const casePropertyConfigs = [
            { propertyLabel: "Identifier", propertyValueSelector: x => x.Identifier, onClick: null },
            { propertyLabel: "Id", propertyValueSelector: x => x.Id, onClick: null },
            //{ propertyLabel: "Last Modified", propertyValueSelector: x => x.LastModified, onClick: null },
            
            { propertyLabel: "Owner", propertyValueSelector: x => `${x.Owner.FirstName} ${x.Owner.LastName} (${x.Owner.Id})`, onClick: null },
            { propertyLabel: "Owner's Site", propertyValueSelector: x => `${x.Owner.Site.Identifier} - ${x.Owner.Site.Name} (${x.Owner.Site.Id})`, onClick: null },
            
            { propertyLabel: "Employee", propertyValueSelector: x => `${x.Employee.FirstName} ${x.Employee.LastName} (${x.Employee.Id})`, onClick: null },
            { propertyLabel: "Owner's Primary Site", propertyValueSelector: x => `${x.Employee.PrimarySite.Identifier} - ${x.Employee.PrimarySite.Name} (${x.Employee.PrimarySite.Id})`, onClick: null },
        ];

        // CaseTimer property configs
        const caseTimerPropertyConfigs = [
            { priority: 0, propertyLabel: "#", propertyValueSelector: x => x.OrdinalId, onClick: null },
            { priority: 1, propertyLabel: "Events", propertyValueSelector: x => x.Events, onClick: ct => renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, []) },
            { priority: 0, propertyLabel: "Type", propertyValueSelector: x => x.CaseTimerType, onClick: null },
            { priority: 1, propertyLabel: "Name", propertyValueSelector: x => x.Name, onClick: null },
            { priority: 2, propertyLabel: "Current Effective Clock State", propertyValueSelector: x => separateWordsInCamelCaseStringWithSpaces(x.CurrentEffectiveClockState), onClick: null },
            { priority: 3, propertyLabel: "Current NonWorking Time Period Types", propertyValueSelector: x => x.CurrentNonWorkingTimePeriodTypes, onClick: null },
            { priority: 5, propertyLabel: "Show On Case", propertyValueSelector: x => x.DisplayOnCase, onClick: null },
            { priority: 4, propertyLabel: "NonWorking Event Source", propertyValueSelector: x => x.NonWorkingEventSource, onClick: null },
            { priority: 5, propertyLabel: "Respects", propertyValueSelector: x => 
                [x.RespectNonWorkingSchedule ? "<nobr>Non-Working Schedule</nobr>" : null, 
                 x.RespectSlaClock ? "<nobr>SLA Clock</nobr>" : null, 
                 x.RespectWorkCalendar ? "<nobr>Work Calendar</nobr>" : null].filter(r => !!r).join(', '), onClick: null },
            { priority: 2, propertyLabel: "Elapsed Time (Offset + Run Time)", propertyValueSelector: x => `${x.ElapsedTime} (${x.Offset} + ${x.RunTime})`, onClick: null },
                // { propertyLabel: "Offset", propertyValueSelector: x => x.Offset, onClick: null },
                // { propertyLabel: "Run Time", propertyValueSelector: x => x.RunTime, onClick: null },
                // { propertyLabel: "Elapsed Time", propertyValueSelector: x => x.ElapsedTime, onClick: null },
            { priority: 3, propertyLabel: "Last Calculated", propertyValueSelector: x => x.LastCalculated, onClick: null },
            //{ propertyLabel: "Last Modified", propertyValueSelector: x => x.LastModified, onClick: null },
            //{ propertyLabel: "Is Active", propertyValueSelector: x => x.IsActive, onClick: null },
            { priority: 4, propertyLabel: "Started", propertyValueSelector: x => x.Started, onClick: null },
            { priority: 4, propertyLabel: "Stopped", propertyValueSelector: x => x.Stopped, onClick: null },
            { priority: 6, propertyLabel: "Id", propertyValueSelector: x => x.Id, onClick: null },
        ];

        // SLA property configs
        const slaPropertyConfigs = [
            { priority: 1, propertyLabel: "Respect SLA Pauses", propertyValueSelector: x => x.RespectSlaPauses, onClick: null },
            { priority: 1, propertyLabel: "Sla Replacement Elapsed Time Allocation Policy", propertyValueSelector: x => x.SlaReplacementElapsedTimeAllocationPolicy, onClick: null },
            { priority: 1, propertyLabel: "Status", propertyValueSelector: x => x.Status, onClick: null },
            { priority: 1, propertyLabel: "Condition", propertyValueSelector: x => x.Condition, onClick: null },
            { priority: 1, propertyLabel: "Color", propertyValueSelector: x => x.SlaColor, onClick: null },
            { priority: 1, propertyLabel: "Paused", propertyValueSelector: x => x.IsPaused, onClick: null },
            { priority: 1, propertyLabel: "Active", propertyValueSelector: x => x.IsActive, onClick: null },

            { priority: 1, propertyLabel: "Target IR Duration", propertyValueSelector: x => x.TargetInitialResponseDuration, onClick: null },
            { priority: 1, propertyLabel: "Is Target IR Defined", propertyValueSelector: x => x.IsTargetInitialResponseDefined, onClick: null },
            { priority: 1, propertyLabel: "Time Until IR", propertyValueSelector: x => x.TimeUntilInitialResponse, onClick: null },
            { priority: 1, propertyLabel: "Actual IR Time", propertyValueSelector: x => x.ActualInitialResponseDate, onClick: null },
            { priority: 1, propertyLabel: "Expected IR Time", propertyValueSelector: x => x.ExpectedInitialResponseDate, onClick: null },
            { priority: 1, propertyLabel: "IR Breached Time", propertyValueSelector: x => x.InitialResponseBreachedDate, onClick: null },
            { priority: 1, propertyLabel: "Has IR Target Breached", propertyValueSelector: x => x.HasInitialResponseBreached, onClick: null },
            { priority: 1, propertyLabel: "Has IR Occurred", propertyValueSelector: x => x.HasInitialResponseOccurred, onClick: null },

            { priority: 1, propertyLabel: "TR Duration", propertyValueSelector: x => x.TargetResolutionDuration, onClick: null },
            { priority: 1, propertyLabel: "TR Time Remaining", propertyValueSelector: x => x.TimeRemaining, onClick: null },
            { priority: 1, propertyLabel: "TR BreachedDate", propertyValueSelector: x => x.TargetResolutionBreachedDate, onClick: null },
            { priority: 1, propertyLabel: "Estimated TR Time", propertyValueSelector: x => x.EstimatedTargetResolutionDate, onClick: null },
            { priority: 1, propertyLabel: "Has TR Breached", propertyValueSelector: x => x.HasTargetResolutionBreached, onClick: null },

            { priority: 1, propertyLabel: "Time Until Next CP", propertyValueSelector: x => x.TimeUntilNextControlPoint, onClick: null },
            { priority: 1, propertyLabel: "Estimated Next CP Time", propertyValueSelector: x => x.EstimatedNextControlPointDate, onClick: null },
        ];

        // Case Timer Event property configs
        const caseTimerEventPropertyConfigs = [
            { priority: 0, propertyLabel: "#", propertyValueSelector: x => x.OrdinalId, onClick: null },
            { priority: 1, propertyLabel: "Snapshot<br>(details)", propertyValueSelector: d => d.CaseTimerSnapshot, onClick: cte => renderEventDetails(cte) },
            { priority: 1, propertyLabel: "Event Time", propertyValueSelector: d => d.EventTime, onClick: null },
            { priority: 1, propertyLabel: "Event Identifier", propertyValueSelector: d => d.EventIdentifierString, onClick: null },
            { priority: 1, propertyLabel: "App Id", propertyValueSelector: d => d.AppIdentifier, onClick: null },
            { priority: 4, propertyLabel: "Is Derived", propertyValueSelector: d => d.IsDerived, onClick: null },
            { priority: 4, propertyLabel: "Is Inherited", propertyValueSelector: d => d.IsInherited, onClick: null },
            { priority: 4, propertyLabel: "Is Creation", propertyValueSelector: d => d.IsCaseTimerCreationEvent, onClick: null },
            { priority: 6, propertyLabel: "Id", propertyValueSelector: d => d.Id, onClick: null },
            { priority: 5, propertyLabel: "Snapshot<br>(JSON)", propertyValueSelector: d => d.CaseTimerSnapshot, onClick: cte => displaySnapshotAsJson(cte.CaseTimerSnapshot) },
            { priority: 5, propertyLabel: "EventData<br>(JSON)", propertyValueSelector: d => d.EventData, onClick: cte => displayEventDataAsJson(cte) },
        ];

        // Case Timer Snapshot property configs
        const caseTimerSnapshotPropertyConfigs = [
            { priority: 0, propertyLabel: "Snapshot<br>(details)", propertyValueSelector: d => d, onClick: cts => renderSnapshotDetails(cts) },
            { priority: 0, propertyLabel: "Snapshot Time", propertyValueSelector: d => d.SnapshotTime, onClick: null },
            { priority: 1, propertyLabel: "Id", propertyValueSelector: d => d.Id, onClick: null },
            { priority: 6, propertyLabel: "Is Derived", propertyValueSelector: d => d.IsDerived, onClick: null },
            { priority: 6, propertyLabel: "Snapshot<br>(JSON)", propertyValueSelector: d => d.SnapshotData, onClick: cts => displaySnapshotAsJson(cts) },
        ];

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
            // Update visibility of sections
            d3.select('#case-timer-event-viewer-error').visible(caseDataToRender === null);
            d3.select('#case-timer-event-viewer-content').visible(caseDataToRender !== null);

            // Validate input
            if (!caseDataToRender) { /*alert('case data was not provided.');*/ return; }
            if ((caseDataToRender.Timers || []).length == 0) { alert('case data contains no timers'); return; }
    
            console.log("Original case data:", caseDataToRender);
            let caseTimerTimelineData = transformCaseDataToTimelineData(caseDataToRender);
            console.log("Timeline data:", caseTimerTimelineData);

            // Render stuff
            renderLatestCaseProperties(caseDataToRender);
            renderLatestCaseTimersTable(caseDataToRender.Timers);
            timeline = self.timeline = renderTimeline(timelineContainer, caseTimerTimelineData);

            caseDataModel = caseDataToRender;
        }

        function displayEventDataAsJson(caseTimerEvent)
        {
            createJsonViewerPopup( caseTimerEvent.EventData, `Data for Case Timer Event: ${caseTimerEvent.EventIdentifierString}`  );
        }

        function displaySnapshotAsJson(caseTimerSnapshot)
        {
            var cts = caseTimerSnapshot;

            // Save and clear properties that are redundant or which would cause problems.
            beforeSnapshotDataSerialized(cts.SnapshotData);
            var {saved_CaseTimer, saved_point, saved_interval} = cts;
            delete cts.CaseTimer;
            delete cts.point;
            delete cts.interval;
            
            createJsonViewerPopup( cts, `Case Timer Snapshot taken at ${formatDate(cts.Snapshottime)} for timer '${cts.SnapshotData.CaseTimer.Name}'`);

            // Restore values
            afterSnapshotDataSerialized(cts.SnapshotData);
            cts.CaseTimer = saved_CaseTimer;
            cts.point = saved_point;
            cts.interval = saved_interval;
        }

        function displayEventDataAsJson(caseTimerEvent)
        {
            createJsonViewerPopup( caseTimerEvent.EventData, `Data for Case Timer Event: ${caseTimerEvent.EventIdentifierString}`  );
        }

        function beforeSnapshotDataSerialized(ssd) {
            // If CaseTimer is for an SLA, then don't include redundant CaseTimer data.
            // If CaseTimer is not for an SLA but if there is an SLA on the case, then do include its CaseTimer data, but don't include the Sla's CaseTimer's Case data.
            if (ssd.CaseTimer.CaseTimerType === 'Sla')
            {
                // If the SLA hasn't already been removed
                if (ssd.Sla != null)
                {
                    ssd.Sla.CaseTimer = "(see SnapshotData.CaseTimer)";  // = null;
                }
            }
            else if (ssd.Sla != null)
            {
                ssd.Sla.CaseTimer.Case = "(see SnapshotData.CaseTimer.Case)";  // = null;
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
            if (ssd.CaseTimer.CaseTimerType === 'Sla')
            {
                // If SLA hasn't already been removed 
                if (ssd.Sla != null)
                {
                    ssd.Sla.CaseTimer = ssd.CaseTimer;
                }
            }
            else if (ssd.Sla != null)
            {
                ssd.Sla.CaseTimer.Case = ssd.CaseTimer.Case;
            }
            // If an SLA is present, then share its data with the Case.
            if (ssd.Sla != null && ssd.Sla.CaseTimer.Case.Sla != ssd.Sla)
            {
                ssd.Sla.CaseTimer.Case.Sla = ssd.Sla;
            }
        }

        function renderTimeline(container, timelineData) {
            emptyContainer(container);

            var timeline = new TimelineChart(container, timelineData, {
                //enableLiveTimer: true, 
                tip: formatTipText,
                groupHeight: 36,
                groupWidth: 400
            }); //.onVizChange(e => console.log(e));
            d3.select('#reset-timeline-view').on('click', () => timeline.resetTransform())

            // Resize container vertically to fit timeline
            var timelineHeight = d3.select(container).node().clientHeight;
            d3.select(container).style("height", (timelineHeight)+"px");
            return timeline;
        }


        function separateWordsInCamelCaseStringWithSpaces(str) {
            return (str || '').replace(/([A-Z])/g, " $1").trim();
        }

        function formatDate(date) {
            // We will only display fractional seconds to ms precision, because JS's date doesn't support any greater precision than that.
            //return moment(date).format('MMMM Do YYYY, h:mm:ss.SSS a');
            return moment(date).format('YYYY-MM-DD hh:mm:ss.SSS a');
        }

        // function createLabelFromIntervalDuration(d){
        //     return formatDuration(d.to, d.from);
        // };

        function formatLabelForTipHtml(label) {
            return (label || '').replace(/ /g, '&nbsp;').replace(/\\n/g, '<br>');
        };

        function formatDuration(later, earlier) {
            var msDiff = moment(later).diff(moment(earlier));
            var duration = moment.duration(msDiff);
            var parts = [
                duration.years() ? duration.years()+' year(s)' : null,
                duration.months() ? duration.months()+' month(s)' : null,
                duration.days() ? duration.days()+' day(s)' : null,
                duration.hours() ? duration.hours()+' hour(s)' : null,
                duration.minutes() ? duration.minutes()+' minute(s)' : null,
                duration.seconds() ? duration.seconds()+' second(s)' : null,
            ].filter(x => x != null);
            var durationString = parts.join(' ');
            return durationString || duration.milliseconds()+' ms';
        };

        function formatTipText(d) {
            // if d.label is a fn, call it to generate tip label content.
            var tipHeading = typeof(d.label) == 'function' ? formatLabelForTipHtml(d.label(d)+'') : typeof(d.label)=='string' ? formatLabelForTipHtml(d.label) : '(no label)';
            // include "at" time for points or from/to time range for intervals with label
            var tipBody = d.type == TimelineChart.TYPE.POINT ? 'Time: '+formatDate(d.at) : 'From: '+formatDate(d.from)+'<br>To: '+formatDate(d.to)+'<br>Duration: '+formatDuration(d.to, d.from);

            var result = `<div class="tip-heading">${tipHeading}</div> <br> <div class="tip-body">${tipBody}</div>`;
            return result;
        };

        // Returns a new string with all single and double quotes escaped, in order to ensure that it can be embedded into another string expression without causing issues.
        // NOTE:  This won't detect if single or double quotes have already been escaped, so it could potentially double-escape them, which would defeat the purpose of this method.
        function escapeQuotes(str) {
            return str.replace(/'/g,"\\'").replace(/"/g,'\\"');
        }

        // Create a separate window to view the formatted JSON content of CaseTimerSnapshotData and CaseTimerEventData
        function createJsonViewerPopup(objToView, heading) {
            var objJson = JSON.stringify(objToView);
            var popup = window.open("", "json-viewer-popup", "width=800,height=1200", false);
            var doc = popup.document;
            var html = `
            <html>
                <head>
                    <link href="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor.css" rel="stylesheet" type="text/css">
                </head>
                <body>
                    <div id="jsoneditor" style="width: 100%; height: 100%;"></div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/jsoneditor/5.13.3/jsoneditor-minimalist.js"><\/script>
                    <script>
                        var editor = new JSONEditor(document.getElementById("jsoneditor"), { mode: 'view', name: '${escapeQuotes(heading)}' }, ${objJson}); editor.expandAll();
                    <\/script>
                </body>
            </html>`;
            doc.open();
            doc.write(html);
            doc.close();
            doc.title = heading;
        }
    
        function isUUID(value) {
            var result = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
            return !!result && result.index === 0;
        }


        function emptyContainer(container)
        {
            // remove all child elements of the specified container
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        function renderLatestCaseProperties(caseDataToRender)
        {
            // Case properties
            emptyContainer(latestCaseDetailsContainer);
            renderProperties(latestCaseDetailsContainer, casePropertyConfigs, caseDataToRender);

            // Sla properties
            emptyContainer(latestSlaDetailsContainer);
            renderProperties(latestSlaDetailsContainer, slaPropertyConfigs, caseDataToRender.Sla);
            //renderTableOfObjects(latestSlaDetailsContainer, slaPropertyConfigs, allSlas, selectedSlas);
        }

        function renderLatestCaseTimersTable(allCaseTimers, selectedTimers)
        {
            emptyContainer(latestCaseTimerDetailsContainer);
            renderTableOfObjects(latestCaseTimerDetailsContainer, caseTimerPropertyConfigs, allCaseTimers, selectedTimers);
        }

        // Both event and snapshot data  details are treated as immutable, so we don't need to differentiate between latest/historical
        function renderEventDetailsTableAndSnapshotDetailsTableFromEvents(allEvents, selectedEvents)
        {
            var caseTimer = allEvents[0].CaseTimer;

            // var snapshotMap = d3.map(caseDataModel.Snapshots, ss => ss.Id);
            // var snapshotsForAllEvents = allEvents.map(evt => snapshotMap.get(evt.CaseTimerSnapshot.Id));
            // var distinctSnapshotsForAllEvents = d3.map(snapshotsForAllEvents, ss => ss.Id).values();
            // var orderedDistinctSnapshotsForAllEvents = sortBy(distinctSnapshotsForAllEvents, ss => ss.SnapshotTime, true);
            // var snapshotsForSelectedEvents = selectedEvents.map(evt => snapshotMap.get(evt.CaseTimerSnapshot.Id));
            // var latestSnapshot = maxBy(selectedEvents.map(x => x.CaseTimerSnapshot), x => x.SnapshotTime);

            // Identify snapshots corresponding to selected events
            var snapshotsForSelectedEvents = selectedEvents.map(evt => evt.CaseTimerSnapshot);
            var latestSnapshot = maxBy(selectedEvents.map(x => x.CaseTimerSnapshot), x => x.SnapshotTime);
            
            renderEventDetailsTableAndSnapshotDetailsTableAndHistoricalData(
                allEvents, selectedEvents, caseTimer.Snapshots, snapshotsForSelectedEvents, latestSnapshot);
        }

        // Both event and snapshot objects are treated as immutable, so we don't need to differentiate between latest/historical
        function renderEventDetailsTableAndSnapshotDetailsTableFromSnapshots(snapshots, selectedSnapshots)
        {
            var caseTimerId = snapshots[0].SnapshotData.CaseTimer.Id;
            var timer = caseDataModel.CaseTimerMap.get(caseTimerId);

            // Identify events corresponding to selected snapshots
            var selectedEvents = selectedSnapshots.selectMany(ss => caseDataModel.EventsBySnapshotIdLookup.get(ss.Id));

            renderEventDetailsTableAndSnapshotDetailsTableAndHistoricalData(
                timer.Events, selectedEvents, snapshots, selectedSnapshots, firstOrDefault(selectedSnapshots));
        }

        // Both event and snapshot objects are treated as immutable, so we don't need to differentiate between latest/historical
        function renderEventDetailsTableAndSnapshotDetailsTableAndHistoricalData(events, selectedEvents, snapshots, selectedSnapshots, snapshotToUseForHistoricalData)
        {
            if (events && events.length) {
                var ct = events[0].CaseTimer;
                d3.select(selectedCaseTimerLabel).html(`Timer #${ct.OrdinalId} for ${ct.CaseTimerType === 'CaseTimer' ? 'Case' : 'Sla'}: "${ct.Name}"`);
            }
            if (!snapshotToUseForHistoricalData && firstOrDefault(selectedSnapshots) != null)
                snapshotToUseForHistoricalData = firstOrDefault(selectedSnapshots);
            emptyContainer(eventDetailsContainer);
            emptyContainer(caseTimerSnapshotDetailsContainer);
            sortBy(events, cte => cte.OrdinalId, true);
            sortBy(snapshots, ss => ss.SnapshotTime, true);
            renderTableOfObjects(eventDetailsContainer, caseTimerEventPropertyConfigs, events, selectedEvents);
            renderTableOfObjects(caseTimerSnapshotDetailsContainer, caseTimerSnapshotPropertyConfigs, snapshots, selectedSnapshots);
            renderHistoricalDataFromSnapshot(snapshotToUseForHistoricalData);
        }
        
        function renderEventDetails(caseTimerEvent)
        {
            // In the timeline, highlight the related point (and interval) based on this event
            timeline.highlightNodeByIds(['p'+caseTimerEvent.Id, 'i'+caseTimerEvent.Id], true, 'chart-node-highlight');

            // Render any historical data associated with this event's snapshot
            renderHistoricalDataFromSnapshot(caseTimerEvent.CaseTimerSnapshot);

            // Refresh events/snapshots tables
            renderEventDetailsTableAndSnapshotDetailsTableFromEvents(caseTimerEvent.CaseTimer.Events, [caseTimerEvent]);
        }

        function renderSnapshotDetails(caseTimerSnapshot)
        {
            var caseTimerId = caseTimerSnapshot.SnapshotData.CaseTimer.Id;
            var snapshotsForTimer = caseDataModel.CaseTimerMap.get(caseTimerId).Snapshots;
            
            // In the timeline, highlight the related point based on this snapshot
            timeline.highlightNodeByIds('p'+caseTimerSnapshot.Id, true, 'chart-node-highlight');

            // Render any historical data associated with this snapshot
            renderHistoricalDataFromSnapshot(caseTimerSnapshot);

            // Refresh events/snapshots tables
            renderEventDetailsTableAndSnapshotDetailsTableFromSnapshots(snapshotsForTimer, [caseTimerSnapshot]); 
        }

        function renderHistoricalDataFromSnapshot(snapshot)
        {
            emptyContainer(historicalSnapshotDetailsContainer);
            emptyContainer(historicalCaseDetailsContainer);
            emptyContainer(historicalSlaDetailsContainer);
            emptyContainer(historicalCaseTimerDetailsContainer);

            if (!snapshot) return;

            renderProperties(historicalSnapshotDetailsContainer, caseTimerSnapshotPropertyConfigs, snapshot);
            renderProperties(historicalCaseDetailsContainer, casePropertyConfigs, snapshot.SnapshotData.CaseTimer.Case);
            renderProperties(historicalSlaDetailsContainer, slaPropertyConfigs, snapshot.SnapshotData.CaseTimer.Case.Sla);

            // For each case timer in effect, resolve the latest snapshot whose snapshot time is <= the current snapshot 
            var eligibleSnapshots = getCaseDataModel().Snapshots.filter(x => x.SnapshotTime < snapshot.SnapshotTime);
            var snapshotsGroupedByTimerId = d3.nest()
                .key(d => d.SnapshotData.CaseTimer.Id)
                .entries(eligibleSnapshots);
            var latestSnapshotsByDistinctTimerId = snapshotsGroupedByTimerId
                .map(g => ({ 
                    "CaseTimerId": g.key, 
                    "CaseTimerSnapshot": maxBy(g.values, _ => _.SnapshotTime*1) 
                }));
            var caseTimersToDisplay = latestSnapshotsByDistinctTimerId.map(x => x.CaseTimerSnapshot.SnapshotData.CaseTimer);
            renderTableOfObjects(historicalCaseTimerDetailsContainer, caseTimerPropertyConfigs, caseTimersToDisplay, []);
        }

        // function renderHistoricalCaseProperties(historicalCaseDataToRender)
        // {
        //     emptyContainer(historicalCaseDetailsContainer);
        //     renderProperties(historicalCaseDetailsContainer, casePropertyConfigs, historicalCaseDataToRender);

        //     emptyContainer(historicalSlaDetailsContainer);
        //     renderProperties(historicalSlaDetailsContainer, slaPropertyConfigs, historicalCaseDataToRender.Sla);
        // }

        // function displaySnapshotDetails(allSnapshots, selectedSnapshots)
        // {
        //     //console.log("selected CaseTimerSnapshot: ", caseTimerSnapshot);
        //     emptyContainer(selectedSnapshotContainer);
        //     renderTableOfObjects(selectedSnapshotContainer, caseTimerSnapshotPropertyConfigs, allSnapshots, selectedSnapshots);
        // }

        // Perform an in-place sort of array elements according to the "value" of the property returned by the specified selector.  Then, return the sorted array.
        function sortBy(arr, ps, ascendingOrder) {
            return arr.sort((a,b) => ps(a) < ps(b) ? -1 : ps(a) == ps(b) ? 0 : 1);
        }

        function distinctBy(arr, ps) {

        }

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
            for (var i = 1; i < arr.length; i++)
            {
                var value = ps(arr[i]);
                if (value > maxValue) { maxValue = value; maxi = i; }
            }
            return arr[maxi];
        }

        // Return the element of the specified array whose property selector produces the minimum value.
        function minBy(arr, ps) {
            if (!arr || arr.length == 0) return null;
            if (arr.length == 1) return arr[0];
            var minValue = ps(arr[0]);
            var mini = 0;
            for (var i = 1; i < arr.length; i++)
            {
                var value = ps(arr[i]);
                if (value < minValue) { minValue = value; mini = i; }
            }
            return arr[mini];
        }
           
        function renderTableOfObjects(tableContainer, propertyConfigs, itemsToRender, itemsToHighlight)
        {
            // itemsToRender is required and must contain data
            if (!itemsToRender)
            {
                alert('renderTableOfObjects called with no data');
                return;
            }

            itemsToHighlight = itemsToHighlight || [];

            var table = d3.select(tableContainer).append('table')
                //.classed('table', true);
                .classed('tablesaw', true)
                //.attr( 'data-tablesaw-mode', 'stack')
                .attr('data-tablesaw-sortable', '')
                .attr('data-tablesaw-sortable-switch', '')
                .attr('data-tablesaw-minimap', '')
                .attr('data-tablesaw-mode', 'columntoggle')
                ;
            var headerRow = table.append('thead').append('tr');
            // render table header
            propertyConfigs.forEach(pc => headerRow
                .append('th')
                .attr('data-tablesaw-sortable-col', '')
                .attr('data-tablesaw-priority', pc.priority === 0 ? 'persist' : pc.priority)
                .html(pc.propertyLabel));

            var tbody = table.append('tbody');

            itemsToRender.forEach(obj => {
                var tr = tbody.append('tr')
                    .classed('row-highlight', itemsToHighlight.findIndex(o => o == obj) != -1)
                    .selectAll('td').data(propertyConfigs);
                tr.enter().append('td')
                    .call(sel => renderPropertyValue(sel, obj));
            });

            // attempt to scroll all highlighted items into view
            var highlightedElements = table.selectAll('.row-highlight').nodes();
            if (highlightedElements && highlightedElements[0] && highlightedElements[0].scrollIntoView)
            {
                highlightedElements[highlightedElements.length-1].scrollIntoView({ block: "nearest" });
                if (highlightedElements.length > 1)
                    highlightedElements[0].scrollIntoView({ block: "nearest" });
            }

            // Apply tablesaw features to table
            initializeTableFeatures();
        }

        function renderPropertyValue(d3SelectionBoundToPropertyConfig, objectWithProperties) {
            var obj = objectWithProperties;
            d3SelectionBoundToPropertyConfig
                .attr('data-title', d => d.propertyLabel)
                .html(d => getHtmlContentForPropertyValue(d, obj))
                .on('click', d => { 
                    if (typeof(d.onClick) == 'function') d.onClick(obj);
                });
        }

        function renderProperties(parentElement, propertyConfigs, obj)
        {
            if (!obj)
                d3.select(parentElement).appendHTML('<div> No data exists. </div>');
            else
                d3.select(parentElement)
                    .selectAll('div').data(propertyConfigs)
                    .enter().append('div')
                    .call(pc => renderPropertyLabelAndValue(pc, obj));
        }

        function renderPropertyLabelAndValue(d3SelectionBoundToPropertyConfig, objectWithProperties)
        {
            let propertyWrapper = d3SelectionBoundToPropertyConfig
                .append('div')
                .attr('class', 'property-label-and-value');
            let labelElement = propertyWrapper
                .append('div')
                .attr('class', 'property-label')
                .html(pc => pc.propertyLabel)
            let valueElement = propertyWrapper
                .append('div')
                .attr('class', 'property-value')
                .call(pc => renderPropertyValue(pc, objectWithProperties));
        }

        function getHtmlContentForPropertyValue(propertyConfig, obj)
        {
            var propertyValue = propertyConfig.propertyValueSelector(obj);

            if (propertyValue === undefined)
            {
                return "";
            }
            else if (propertyValue === null)
            {
                return "(null)";
            }
            else if (typeof propertyValue == 'number')
            {
                return propertyValue;
            }
            else if (typeof propertyValue == 'string')
            {
                //if (isUUID(propertyValue))
                //    return "<span title='"+propertyValue+"'>"+propertyValue.substring(0, 7)+"...</span>";
                return propertyValue;
            }
            else if (typeof propertyValue == 'boolean')
            {
                return "<input type='checkbox' "+(!!propertyValue ? "checked" : "")+" onclick='return false;' />";
            }
            else if (propertyValue.constructor == (new Date()).constructor)
            {
                return formatDate(propertyValue);
            }
            else if(!!propertyConfig.onClick)
            {
                return `<button class="btn btn-sm btn-${propertyConfig.priority < 3 ? 'primary' : 'secondary'}">View</button>`;
            }
            return '<em>(no value resolver defined for this type)</em>'
        }

        function normalizeProperties(caseTimerArray)
        {
            var convertDateProperties = function(obj, propertyNamesArray)
            {
                if (!obj) return;
                propertyNamesArray.forEach(pn => {
                    var value = obj[pn];
                    if (value !== null && typeof value === 'string')
                        obj[pn] = new Date(value);
                });
            };

            caseTimerArray.forEach(ct => {
                ct.Events.forEach(e => {
                    convertDateProperties(e, [ "EventTime", "LastModified" ]);
                    convertDateProperties(e.CaseTimerSnapshot, [ "SnapshotTime", "LastModified" ]);
                    var ssd = e.CaseTimerSnapshot.SnapshotData;
                    convertDateProperties(ssd, [ "SnapshotTime", "LastModified" ]);
                    convertDateProperties(ssd.CaseTimer, [ "LastCalculated", "LastModified", "Started", "Stopped" ]);
                    convertDateProperties(ssd.Sla, [ "EstimatedNextControlPointDate", "EstimatedTargetResolutionDate", "LastModified" ]);
                });
                convertDateProperties(ct, [ "LastCalculated", "LastModified", "Started", "Stopped" ]);
            });
        }

        function restoreReferencesInCaseTimerObjectGraph(caseTimerArray)
        {
            // normalize data
            caseTimerArray.forEach(ct => 
            {
                ct.Events.forEach(e => 
                {
                    // link the case timer events to the case timer that it belongs to
                    e.CaseTimer = ct;

                    afterSnapshotDataDeserialized(e.CaseTimerSnapshot.SnapshotData);
                });
            });
        }

        function transformCaseDataToTimelineData(caseDataToTransform)
        {
            // create a copy of the data
            //let caseTimerArray = JSON.parse(JSON.stringify(caseDataToTransform.Timers));

            // Ensure that timers are ordered by when they were created
            let caseTimerArray = sortBy(caseDataToTransform.Timers, _ => _.Created);  // caseDataToTransform.Timers.sort((a,b) => a.Created < b.Created ? -1 : a.Created == b.Created ? 0 : 1);

            // Iterate over timers to set an ordinal ID and to sort events on each
            var ordinalId = 1;
            caseTimerArray.forEach(ct => {
                ct.OrdinalId = ordinalId++;
                sortBy(ct.Events, _ => _.EventTime);
            });

            restoreReferencesInCaseTimerObjectGraph(caseTimerArray);

            // Convert date strings to date objects
            normalizeProperties(caseTimerArray);

            // Flatten the events
            var allEvents = caseTimerArray.selectMany(t => t.Events);
            // Create a D3 map of case timer Id to case timer
            caseDataToTransform.CaseTimerMap = d3.map(caseDataToTransform.Timers, ct => ct.Id);
            // Create a D3 map of snapshot Id to snapshot (distinct values only).
            var caseTimerSnapshotsMap = d3.map(allEvents.map(cte => cte.CaseTimerSnapshot), cts => cts.Id);
            // Replace snapshot data with distinct snapshot objects (so we won't have different copies of the same snapshot floating around).
            allEvents.forEach(cte => cte.CaseTimerSnapshot = caseTimerSnapshotsMap.get(cte.CaseTimerSnapshot.Id));
            // Make array of snapshots accessible from case data.
            caseDataToTransform.SnapshotMap = caseTimerSnapshotsMap;
            caseDataToTransform.Snapshots = sortBy(caseTimerSnapshotsMap.values(), ss => ss.SnapshotTime, true);
            // Create a D3 map of case timer Id's to snapshots
            var snapshotsByCaseTimerIds = d3.nest().key(cts => cts.SnapshotData.CaseTimer.Id).map(caseDataToTransform.Snapshots);
            // Set snapshots array on each case timer object (to facilitate access later)
            caseTimerArray.forEach(ct => ct.Snapshots = sortBy(snapshotsByCaseTimerIds.get(ct.Id), ss => ss.SnapshotTime, true));
            // Create a D3 nested map from case timer snapshot Id to events
            caseDataToTransform.EventsBySnapshotIdLookup = d3.nest().key(cte => cte.CaseTimerSnapshot.Id).map(allEvents);



            var allTimelineSeriesForAllTimers = caseTimerArray.map(ct => 
            {
                // for each case timer, this returns an array of data series, each of which can be plotted on the timeline

                // Create timeline point data from case timer events, grouped by event time.
                // As we group these events by EventTime into points, we have to treat the EventTime as an integral number of milliseconds.
                // Otherwise, the milliseconds will be lost if we just use the EventTime (Date), because the d3.nest.key resolver will convert the returned object into a string.
                var caseTimerEventPoints = (d3.nest().key(cte => cte.EventTime*1).entries(ct.Events))
                    // map d3 groupings (of { key: "", values: [] }) into an array of points for the timeline
                    .map(d => {
                        var timeOfEvents = new Date(d.key*1);
                        var eventsAtTime = d.values;
                        // Create point data structure
                        var pointObj = {
                            type: TimelineChart.TYPE.POINT,
                            //customClass: 'point-white',
                            label: function(){ 
                                return `${eventsAtTime.length} Event${eventsAtTime.length == 1 ? '' : 's'}:<br>` + 
                                    eventsAtTime.map(e => ` - ${e.EventIdentifierString}<br>`).join('');
                            },
                            at: timeOfEvents,
                            data: d.values,
                            ids: d.values.map(p => 'p'+p.Id),  // event guids will serve as the ids
                            onClick: function(){ 
                                timeline.highlightNodeByIds('p'+d.values[0].Id, true, 'chart-node-highlight');
                                renderLatestCaseTimersTable(caseTimerArray, [ ct ]);
                                renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, eventsAtTime); 
                            }
                        };
                        // Set the point reference on each event object.  (NOTE: each event should belong to 1 and only 1 point.)
                        d.values.forEach(evt => evt.point = pointObj);
                        return pointObj;
                    });

                // Create initial series for timer which will contain points for all case timer events
                var timerEventsSeries = {
                    label: `${ct.OrdinalId}. Events for ${ct.CaseTimerType}: [${ct.Name}]`,
                    groupingKey: ct.Id,  // The case timer Id is a suitable grouping key
                    data: caseTimerEventPoints
                };

                // Create timeline point data from case timer snapshots, grouped by snapshot time.
                // As we group these events by SnapshotTime into points, we have to treat the SnapshotTime as an integral number of milliseconds.
                // Otherwise, the milliseconds will be lost if we just use the SnapshotTime (Date), because the d3.nest.key resolver will convert the returned object into a string.
                var caseTimerSnapshotPoints = (d3.nest().key(cts => cts.SnapshotTime*1).entries(ct.Snapshots))
                    // map d3 groupings (of { key: "", values: [] }) into an array of points for the timeline
                    .map(d => {
                        var snapshotTime = new Date(d.key*1); // convert key from string to a number to a date
                        var snapshotsAtTime = d.values;
                        // Create point data structure
                        var pointObj = {
                            type: TimelineChart.TYPE.POINT,
                            //customClass: 'point-white',
                            label: function(){ 
                                return `${snapshotsAtTime.length} Snapshot${snapshotsAtTime.length == 1 ? '' : 's'}:<br>` + 
                                snapshotsAtTime.map(e => ` - ${e.Id}<br>`).join('');
                            },
                            at: snapshotTime,
                            data: d.values,
                            ids: d.values.map(p => 'p'+p.Id),  // snapshot guids will serve as the ids
                            onClick: function(){ 
                                timeline.highlightNodeByIds('p'+d.values[0].Id, true, 'chart-node-highlight');
                                renderLatestCaseTimersTable(caseTimerArray, [ ct ]);
                                renderEventDetailsTableAndSnapshotDetailsTableFromSnapshots(ct.Snapshots, snapshotsAtTime); 
                            }
                        };
                        // Set the point reference on each event object.  (NOTE: each event should belong to 1 and only 1 point.)
                        d.values.forEach(evt => evt.point = pointObj);
                        return pointObj;
                    });

                var timerSnapshotsSeries = {
                    label: `Case Timer Snapshots`,
                    groupingKey: ct.Id,  // The case timer Id is a suitable grouping key
                    data: caseTimerSnapshotPoints
                };

                var now = new Date();
                var intervalConfigs = [
                    {
                        key: "TimeAccrualIntervalKey",
                        intervalSeriesEventGroupingKeyFn: evt => "TimeAccrualInterval",
                        groupLabelFn: evt => "Time Accrued",
                        intervalLabelFn: evt => "Clock Running",
                        startEventId: "TimerStartedAccruingTime",
                        endEventId: "TimerStoppedAccruingTime",
                        intervalType: "TimeAccrualInterval",
                        customClass: 'interval-white',
                    },
                    {
                        key: "FollowingSlaIntervalKey",
                        intervalSeriesEventGroupingKeyFn: evt => "FollowingSlaInterval",
                        groupLabelFn: evt => "Following SLA",
                        intervalLabelFn: evt => "Following SLA",
                        startEventId: "CaseTimerStartedFollowingSla",
                        endEventId: "CaseTimerStoppedFollowingSla",
                        intervalType: "FollowingSlaInterval",
                        customClass: 'interval-white',
                    },
                    {
                        key: "NonworkingScheduledTimePeriodIntervalKey",
                        intervalSeriesEventGroupingKeyFn: evt => "NonworkingScheduledTimePeriodInterval-"+evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceId,
                        groupLabelFn: evt => "Non-working Scheduled Time Period: "+evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName,
                        intervalLabelFn: evt => "Non-working Scheduled Time Period: " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName,
                        startEventId: "Temporal:NonworkingScheduledTimePeriodBegan",
                        endEventId: "Temporal:NonworkingScheduledTimePeriodEnded",
                        intervalType: "NonworkingScheduledTimePeriodInterval",
                        customClass: 'interval-white',
                    },
                    {
                        key: "SlaPauseIntervalKey",
                        intervalSeriesEventGroupingKeyFn: evt => "SlaPauseInterval-"+evt.EventData.TemporalEventArgs.SourceId,
                        groupLabelFn: evt => "SLA Pause for " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName,
                        intervalLabelFn: evt => "SLA Pause for " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName,
                        startEventId: "Temporal:SlaPauseBegan",
                        endEventId: "Temporal:SlaPauseEnded",
                        intervalType: "SlaPauseInterval",
                        customClass: 'interval-white',
                    },
                    {
                        key: "OffWorkTimePeriodIntervalKey",
                        intervalSeriesEventGroupingKeyFn: evt => "OffWorkTimePeriodInterval-"+evt.EventData.TemporalEventArgs.SourceId,
                        groupLabelFn: evt => "Off-work time period for "+evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceNameName,
                        intervalLabelFn: evt => "Off-work time period for " + evt.EventData.TemporalEventArgs.NonWorkingPeriod.SourceName,
                        startEventId: "Temporal:WorkPeriodEnded",
                        endEventId: "Temporal:WorkPeriodBegan",
                        intervalType: "OffWorkTimePeriodInterval",
                        customClass: 'interval-white',
                    },
                ];
                //var intervalStartEventIds = intervalConfigs.map(ic => ic.startEventId);
                //var intervalEndEventIds = intervalConfigs.map(ic => ic.endEventId);

                // Define a function to create a grouping key from an event.  Each event will end up in at most 1 group.
                let eventIntervalGroupingKeyFn = evt => {
                    // find the first interval config that matches, cand call it's fn to generate the grouping key.
                    var matchingIntervalConfig = intervalConfigs.find(ic => evt.EventIdentifierString.includes(ic.startEventId) || evt.EventIdentifierString.includes(ic.endEventId));
                    if (!matchingIntervalConfig)
                        return "REMOVE";
                    //evt.intervalConfig = matchingIntervalConfig;  // attach this to the event here, so we don't have to resolve it again later
                    return matchingIntervalConfig.key+"::"+matchingIntervalConfig.intervalSeriesEventGroupingKeyFn(evt);
                };

                // Create an array of interval groups
                // Using D3.nest and the event interval grouping fn, create a series of time intervals for each distinct group of data for this timer
                let timerIntervalSeriesArray = d3.nest()
                    .key(eventIntervalGroupingKeyFn).entries(ct.Events)
                    .filter(o => o.key != "REMOVE") // exclude all interval groups that yield a key of "REMOVE"
                    .map(intervalGroup => {

                        // extract the interval config key from the first part of the key
                        var intervalConfigKey = intervalGroup.key.split('::')[0];
                        // resolve the associated interval config using its key
                        var intervalConfig = intervalConfigs.find(ic => ic.key == intervalConfigKey);

                        // Ensure that the events of interest are sorted, so that intervals start and stop when appropriate.
                        var eventsOfInterest = intervalGroup.values.sort((a,b) => a.EventTime*1 - b.EventTime*1);

                        // Create intervals for this group from the events
                        let intervals = [];
                        for(var i = 0; i < eventsOfInterest.length; i += 2)
                        {
                            let curEvt = eventsOfInterest[i];
                            let nextEvt = eventsOfInterest.length > i + 1 ? eventsOfInterest[i + 1] : null;
                            let ic = intervalConfig;

                            // Create and add interval object
                            var intervalObj = {
                                type: TimelineChart.TYPE.INTERVAL,
                                intervalType: ic.intervalType,
                                customClass: ic.customClass,
                                label: ic.intervalLabelFn(curEvt),
                                from: new Date(curEvt.EventTime)
                            };
                            if (nextEvt != null)
                            {
                                // if both endpoints of interval are known
                                intervalObj = Object.assign({
                                    to: new Date(nextEvt.EventTime),
                                    data: [curEvt, nextEvt],
                                    ids: ['i'+curEvt.Id, 'i'+nextEvt.Id],  // starting/ending event guids will serve as the ids
                                    onClick: function(){ 
                                        timeline.highlightNodeByIds('i'+curEvt.Id, true, 'chart-node-highlight');
                                        renderLatestCaseTimersTable(caseTimerArray, [ ct ]);
                                        renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, [curEvt, nextEvt]);
                                    } 
                                }, intervalObj);
                                nextEvt.interval = intervalObj;
                            }
                            else
                            {
                                // if only the starting time is known, the end time will be "now"
                                intervalObj = Object.assign({
                                    to: now,
                                    data: [curEvt],
                                    ids: ['i'+curEvt.Id ],  // starting event guid will serve as the id
                                    onClick: function(){
                                        timeline.highlightNodeByIds('i'+curEvt.Id, true, 'chart-node-highlight');
                                        renderLatestCaseTimersTable(caseTimerArray, [ ct ]);
                                        renderEventDetailsTableAndSnapshotDetailsTableFromEvents(ct.Events, [curEvt]);
                                    } 
                                }, intervalObj);
                            }
                            curEvt.interval = intervalObj; // Set the interval reference on the event object.  (NOTE: no event should be a member of > 1 interval.)
                            intervals.push(intervalObj);
                        }

                        // return a new series
                        return {
                            label: intervalConfig.groupLabelFn(intervalGroup.values[0]),
                            groupingKey: ct.Id,  // The case timer Id is a suitable grouping key
                            data: intervals
                        };
                    });
                //console.log("timerIntervalSeriesArray: ", timerIntervalSeriesArray);
                // end grouping of intervals

                var getIntervalPointAvgDate = p => p.type === TimelineChart.TYPE.POINT ? p.at : new Date(p.from * 1 + (p.to - p.from)/2);

                // Getting events sorted in an intuitive way is more complex than one might suppose.
                // Here, we sort by the following things, in this particular order:
                //  1. event date
                //  2. intervals that each event is a part of
                //  3. related snapshot time
                ct.Events.sort((a,b) => {
                    // primary sort key is the event time
                    if (a.EventTime < b.EventTime) return -3;
                    if (a.EventTime > b.EventTime) return 3;
                    
                    // secondary sort key is the related interval time
                    var aAvgDate = getIntervalPointAvgDate(a.interval || a.point);
                    var bAvgDate = getIntervalPointAvgDate(b.interval || b.point);
                    if (aAvgDate < bAvgDate) return -2;
                    if (aAvgDate > bAvgDate) return 2;

                    // tertiary sort key is the related snapshot time
                    if (a.CaseTimerSnapshot.SnapshotTime < b.CaseTimerSnapshot.SnapshotTime) return -1;
                    if (a.CaseTimerSnapshot.SnapshotTime > b.CaseTimerSnapshot.SnapshotTime) return 1;

                    return 0;
                });
                // Number the events
                var ordinalId = 1;
                ct.Events.forEach(evt => { evt.OrdinalId = ordinalId++; });
                // // Sort by the number
                // sortBy(ct.Events, evt => evt.OrdinalId);

                var allSeriesForTimer = [ timerEventsSeries, timerSnapshotsSeries ].concat(timerIntervalSeriesArray);

                return allSeriesForTimer;
            })
            // flatten the array of timeline data series arrays into a single array of TDS.
            .reduce((accumulator, currentValue) => accumulator.concat(currentValue));

            // At this point, there will likely be 1+ series associated with each timer.
            // We want to provide some sort of visual grouping mechanism so that all series associated with the same case timer can be visually grouped.
            // Transform the group key to a 0-based index.
            var newGroupNumber = 0;
            var lastGroupKey = "----------------";
            allTimelineSeriesForAllTimers.forEach((x) => {
                if (lastGroupKey != x.groupingKey)
                {
                    lastGroupKey = x.groupingKey;
                    newGroupNumber++;
                }
                x.groupingKey = newGroupNumber;
            });

            //console.log("TimelineSeries: ", allTimelineSeriesForAllTimers);
            return allTimelineSeriesForAllTimers;
        }

    }

    updateTimelineData(newCaseData) {
        this.renderCaseData(newCaseData);
    }

}


module.exports = CaseTimerEventViewer;

