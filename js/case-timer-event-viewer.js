class CaseTimerEventViewer {
    constructor(element, initialCaseData, opts) {
        let self = this;

        // We'll use this several times hereafter
        Array.prototype.selectMany = function(memberArraySelectorFn){ return this.map(memberArraySelectorFn).reduce((a,b) => a.concat(b)); };

        // Extend the d3 selection prototype to include some additional functions

        // Note:  This function will ONLY append the first element in the HTML string literal provided.
        if (!d3.selection.prototype.appendHTML) {
            d3.selection.prototype.appendHTML =
            d3.selection.enter.prototype.appendHTML = function(HTMLString) {
                return this.select(function() {
                    return this.appendChild(document.importNode(new DOMParser().parseFromString(HTMLString, 'text/html').body.childNodes[0], true));
                });
            };
        }
        d3.selection.prototype.hide = d3.selection.enter.prototype.hide = function() { this.style('display', 'none') };
        d3.selection.prototype.show = d3.selection.enter.prototype.show = function() { this.style('display', null) };
        d3.selection.prototype.visible = d3.selection.enter.prototype.visible = function(value) { if (value === undefined) return this.style('display') !== 'none'; this.style('display', !!value ? null : 'none'); };

        function appendHtmlNodesToHead(headHTMLString) {
            var targetNode = d3.select('head')[0][0];
            var nodesToImport = new DOMParser().parseFromString(headHTMLString, 'text/html').head.childNodes;
            for(var i = 0; i < nodesToImport.length; i++) {
                targetNode.appendChild(document.importNode(nodesToImport[i], true));
            }
        }

        // if (initialCaseData === null)
        // {
        //     d3.select(element).appendHTML(`
        //         <div class="container-fluid">
        //             <h3>Error: Invalid input argument.  Please try again.</h3>
        //         </div>
        //     `);
        // }

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

        function initializeTableFeaturesAsync() {
            if (window.Tablesaw === undefined) {
                setTimeout(initializeTableFeaturesAsync, 500);
                return;
            }

            Tablesaw.init();
        }


        d3.select(element).appendHTML(`
            <div id="case-timer-event-viewer-container" class="container-fluid">

                <h3 id="case-timer-event-viewer-error">Error: Invalid input argument.  Please try again.</h3>

                <div>Please enter a valid case Id, a valid case timer Id, or a valid SLA Id and then continue: <input type="text" id="entity-id" style="width: 20em;" /> <input type="button" value="Continue" id="load-case"/> </div>

                <div id="case-timer-event-viewer-data">

                    <div class="row">
                        <div class="col-xs-12">
                            <div class="heading">Case Properties (Latest)</div>
                            <div id="case-details-latest" class="property-card-flex-layout" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row" style="display: block;">
                        <div class="col-xs-12">
                            <div class="heading">SLA Properties (Latest)</div>
                            <div id="sla-details-latest" class="property-card-flex-layout" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row">
                        <div class="col-xs-12">
                            <div class="heading">Case Timers (Latest)</div>
                            <div id="case-timer-details-latest" class="scrollable-container" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row">
                        <div class="col-xs-12">
                            <div class="heading">Case Timer Events Timeline</div>
                            <div id="timeline-chart" class="chart-container" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row">
                        <div class="col-xs-12">
                            <div class="heading">Case Timer Events</div>
                            <div id="event-details" class="scrollable-container responsive-table-1100" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row">
                        <div class="col-xs-12">
                            <div class="heading">Case Properties (Historical)</div>
                            <div id="case-details-historical" class="property-card-flex-layout" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row" style="display: block;">
                        <div class="col-xs-12">
                            <div class="heading">SLA Properties (Historical)</div>
                            <div id="sla-details-historical" class="property-card-flex-layout" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row">
                        <div class="col-xs-12">
                            <div class="heading">Case Timers (Historical)</div>
                            <div id="case-timer-details-historical" class="scrollable-container" ></div>
                        </div>
                    </div>
                    <br>

                    <div class="row" style="display: none;">
                        <div class="col-xs-12">
                            <div class="heading">Case Timer Snapshots</div>
                            <div id="snapshot-details" class="scrollable-container responsive-table" ></div>
                        </div>
                    </div>
                    <br>

                </div>

            </div>`);

        d3.select('#load-case')
            .on('click', d => { 
                var newurl = `${window.location.origin + window.location.pathname}?id=${d3.select('#entity-id').property('value')}`;
                window.location.href = newurl;
            });

        const latestCaseDetailsContainer = document.getElementById('case-details-latest');
        const latestSlaDetailsContainer = document.getElementById('sla-details-latest');
        const historicalCaseDetailsContainer = document.getElementById('case-details-historical');
        const historicalSlaDetailsContainer = document.getElementById('sla-details-historical');
        const chartContainer = document.getElementById('timeline-chart');
        const latestCaseTimerDetailsContainer = document.getElementById('case-timer-details-latest');
        const historicalCaseTimerDetailsContainer = document.getElementById('case-timer-details-historical');
        const eventDetailsContainer = document.getElementById('event-details');
        const selectedSnapshotContainer = document.getElementById('snapshot-details');

        // =======================================================================================================================================================================
        // Property Config fields:
        //  priority - The priority of the field which indicates how important it is to show the field. Range: 0(most important/always show) -> 6(least important)
        //  propertyLabel - The label to display for the column header / field
        //  propertyValueSelector - A function that returns the HTML content to be displayed, given the object
        //  onClick - (optional) A click event handler which will be registered on the content.
        // =======================================================================================================================================================================

        // Input 'd' represents the Case
        const casePropertyConfigs = [
            { propertyLabel: "Identifier", propertyValueSelector: x => x.Identifier, onClick: null },
            { propertyLabel: "Id", propertyValueSelector: x => x.Id, onClick: null },
            //{ propertyLabel: "Last Modified", propertyValueSelector: x => x.LastModified, onClick: null },
            
            { propertyLabel: "Owner", propertyValueSelector: x => `${x.Owner.FirstName} ${x.Owner.LastName} (${x.Owner.Id})`, onClick: null },
            { propertyLabel: "Owner's Site", propertyValueSelector: x => `${x.Owner.Site.Identifier} - ${x.Owner.Site.Name} (${x.Owner.Site.Id})`, onClick: null },
            
            { propertyLabel: "Employee", propertyValueSelector: x => `${x.Employee.FirstName} ${x.Employee.LastName} (${x.Employee.Id})`, onClick: null },
            { propertyLabel: "Owner's Primary Site", propertyValueSelector: x => `${x.Employee.PrimarySite.Identifier} - ${x.Employee.PrimarySite.Name} (${x.Employee.PrimarySite.Id})`, onClick: null },
        ];

        // Input 'd' represents the CaseTimer
        const caseTimerPropertyConfigs = [
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
            // { propertyLabel: "Respect NonWorking Schedule", propertyValueSelector: x => x.RespectNonWorkingSchedule, onClick: null },
            // { propertyLabel: "Respect Sla Clock", propertyValueSelector: x => x.RespectSlaClock, onClick: null },
            // { propertyLabel: "Respect Work Calendar", propertyValueSelector: x => x.RespectWorkCalendar, onClick: null },
            //{ propertyLabel: "Is Active", propertyValueSelector: x => x.IsActive, onClick: null },
            { priority: 4, propertyLabel: "Started", propertyValueSelector: x => x.Started, onClick: null },
            { priority: 4, propertyLabel: "Stopped", propertyValueSelector: x => x.Stopped, onClick: null },
            { priority: 6, propertyLabel: "Id", propertyValueSelector: x => x.Id, onClick: null },
            { priority: 0, propertyLabel: "Events", propertyValueSelector: x => x.Events, onClick: d => renderEventDetailsTable(d.Events, []) },
        ];

        // Input 'd' represents the SLA
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

        // Input 'd' represents the CaseTimerEvent
        const caseTimerEventPropertyConfigs = [
            { priority: 1, propertyLabel: "Event Time", propertyValueSelector: d => d.EventTime, onClick: null },
            { priority: 1, propertyLabel: "Event Identifier", propertyValueSelector: d => d.EventIdentifierString, onClick: null },
            { priority: 1, propertyLabel: "Is Derived", propertyValueSelector: d => d.IsDerived, onClick: null },
            { priority: 1, propertyLabel: "Is Inherited", propertyValueSelector: d => d.IsInherited, onClick: null },
            { priority: 1, propertyLabel: "Is Creation", propertyValueSelector: d => d.IsCaseTimerCreationEvent, onClick: null },
            { priority: 1, propertyLabel: "App Id", propertyValueSelector: d => d.AppIdentifier, onClick: null },
            { priority: 1, propertyLabel: "Id", propertyValueSelector: d => d.Id, onClick: null },
            { priority: 1, propertyLabel: "Data at Point in Time", propertyValueSelector: d => d.CaseTimerSnapshot, onClick: cte => renderHistoricalDataFromSnapshot(cte.CaseTimerSnapshot) },
            { priority: 1, propertyLabel: "Snapshot", propertyValueSelector: d => d.CaseTimerSnapshot, onClick: cte => displaySnapshotData(cte.CaseTimerSnapshot) },
            { priority: 1, propertyLabel: "EventData", propertyValueSelector: d => d.EventData, onClick: cte => displayEventData(cte) },
        ];

        function displaySnapshotData(caseTimerSnapshot)
        {
            var cts = caseTimerSnapshot;

            beforeSnapshotDataSerialized(cts.SnapshotData);
            // In case it is set, save and clear the CaseTimer property value from CaseTimerSnapshot, because it's not needed here.
            var savedCaseTimer = cts.CaseTimer;
            cts.CaseTimer = undefined;
            
            createJsonViewerPopup( cts, `Case Timer Snapshot taken at ${formatDate(cts.Snapshottime)} for timer '${cts.SnapshotData.CaseTimer.Name}'`);

            afterSnapshotDataSerialized(cts.SnapshotData);
            // Restore values
            cts.CaseTimer = savedCaseTimer;

            //displaySnapshotDetails( [d.CaseTimerSnapshot] );
        }

        function displayEventData(caseTimerEvent)
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

        // Input 'd' represents the CaseTimerSnapshot
        const caseTimerSnapshotPropertyConfigs = [
            { propertyLabel: "Id", propertyValueSelector: d => d.Id, onClick: null },
            { propertyLabel: "Is Derived", propertyValueSelector: d => d.IsDerived, onClick: null },
            { propertyLabel: "Snapshot Time", propertyValueSelector: d => d.SnapshotTime, onClick: null },
            { propertyLabel: "Snapshot Data", propertyValueSelector: d => d.SnapshotData, onClick: d => createJsonViewerPopup(d.SnapshotData, "Data for Snapshot "+d.Id) },
        ];

        var caseDataModel;
        function renderCaseData(caseDataToRender) {
            // Update visibility of sections
            d3.select('#case-timer-event-viewer-error').visible(caseDataToRender === null);
            d3.select('#case-timer-event-viewer-data').visible(caseDataToRender !== null);

            // Validate input
            if (!caseDataToRender) { /*alert('case data was not provided.');*/ return; }
            if ((caseDataToRender.Timers || []).length == 0) { alert('case data contains no timers'); return; }
    
            console.log("Original case data:", caseDataToRender);
            let caseTimerTimelineData = transformCaseDataToTimelineData(caseDataToRender);
            console.log("Timeline data:", caseTimerTimelineData);

            // Render stuff
            renderLatestCaseProperties(caseDataToRender);
            renderLatestCaseTimerDetailsTable(caseDataToRender.Timers);
            renderTimeline(chartContainer, caseTimerTimelineData);

            caseDataModel = caseDataToRender;
        }

        self.renderCaseData = renderCaseData;

        self.renderCaseData(initialCaseData);

        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


        function renderTimeline(container, timelineData) {
            removeAllChildNodesOfElement(container);

            const timeline = new TimelineChart(container, timelineData, {
                //enableLiveTimer: true, 
                tip: formatTipText,
                groupHeight: 40
            }); //.onVizChange(e => console.log(e));

            // Resize container vertically to fit timeline
            var svgHeight = d3.select(container).select("svg").attr("height")*1;
            d3.select(container).style("height", (svgHeight+10)+"px");
        }


        function separateWordsInCamelCaseStringWithSpaces(str) {
            return (str || '').replace(/([A-Z])/g, " $1").trim();
        }

        function formatDate(date) {
            // We will only display fractional seconds to ms precision, because JS's date doesn't support any greater precision than that.
            //return moment(date).format('MMMM Do YYYY, h:mm:ss.SSS a');
            return moment(date).format('YYYY-MM-DD hh:mm:ss.SSS a');
        }

        var createLabelFromIntervalDuration = function(d){
            return formatDuration(d.to, d.from);
        };

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
            // if d.label is a fn, call it now.
            var lbl = typeof(d.label) == 'function' ? formatLabelForTipHtml(d.label(d)+'') : typeof(d.label)=='string' ? formatLabelForTipHtml(d.label) : '(no label)';
            // include "at" time for points or from/to time range for intervals with label
            var result = !!d.at ? 
                lbl+'<br><br>Time: '+formatDate(d.at) : 
                lbl+'<br><br>From: '+formatDate(d.from)+'<br>To: '+formatDate(d.to)+'<br>Duration: '+formatDuration(d.to, d.from);
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

        function removeAllChildNodesOfElement(container) {
            // remove all elements of the container
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
        }

        function renderLatestCaseProperties(caseDataToRender)
        {
            removeAllChildNodesOfElement(latestCaseDetailsContainer);
            renderProperties(latestCaseDetailsContainer, casePropertyConfigs, caseDataToRender);

            removeAllChildNodesOfElement(latestSlaDetailsContainer);
            renderProperties(latestSlaDetailsContainer, slaPropertyConfigs, caseDataToRender.Sla);
            //renderTableOfObjects(latestSlaDetailsContainer, slaPropertyConfigs, allSlas, selectedSlas);
        }

        function renderLatestCaseTimerDetailsTable(allCaseTimers, selectedTimers)
        {
            removeAllChildNodesOfElement(latestCaseTimerDetailsContainer);
            renderTableOfObjects(latestCaseTimerDetailsContainer, caseTimerPropertyConfigs, allCaseTimers, selectedTimers);
        }

        // Event details are treated as immutable, so we don't need to differentiate between latest/historical
        function renderEventDetailsTable(allEvents, selectedEvents)
        {
            removeAllChildNodesOfElement(eventDetailsContainer);
            renderTableOfObjects(eventDetailsContainer, caseTimerEventPropertyConfigs, allEvents, selectedEvents);

            var latestSnapshot = maxBy(selectedEvents.map(x => x.CaseTimerSnapshot), x => x.SnapshotTime);
            renderHistoricalDataFromSnapshot(latestSnapshot);
        }

        function renderHistoricalDataFromSnapshot(snapshot)
        {
            removeAllChildNodesOfElement(historicalCaseDetailsContainer);
            removeAllChildNodesOfElement(historicalSlaDetailsContainer);

            if (!snapshot) return;

            renderProperties(historicalCaseDetailsContainer, casePropertyConfigs, snapshot.SnapshotData.CaseTimer.Case);
            renderProperties(historicalSlaDetailsContainer, slaPropertyConfigs, snapshot.SnapshotData.CaseTimer.Case.Sla);
            
        }

        function renderHistoricalDataFromDateTime(dateTime)
        {

        }

        function renderHistoricalCaseProperties(historicalCaseDataToRender)
        {
            removeAllChildNodesOfElement(historicalCaseDetailsContainer);
            renderProperties(historicalCaseDetailsContainer, casePropertyConfigs, historicalCaseDataToRender);

            removeAllChildNodesOfElement(historicalSlaDetailsContainer);
            renderProperties(historicalSlaDetailsContainer, slaPropertyConfigs, historicalCaseDataToRender.Sla);
        }

        // function displaySnapshotDetails(allSnapshots, selectedSnapshots)
        // {
        //     //console.log("selected CaseTimerSnapshot: ", caseTimerSnapshot);
        //     removeAllChildNodesOfElement(selectedSnapshotContainer);
        //     renderTableOfObjects(selectedSnapshotContainer, caseTimerSnapshotPropertyConfigs, allSnapshots, selectedSnapshots);
        // }

        function maxBy(arr, ps)
        {
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

        function minBy(arr, ps)
        {
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
                .text(pc.propertyLabel));

            var tbody = table.append('tbody');

            itemsToRender.forEach(obj => {
                var tr = tbody.append('tr')
                    .classed('highlighted', itemsToHighlight.findIndex(o => o == obj) != -1)
                    .selectAll('td').data(propertyConfigs);
                tr.enter().append('td')
                    .call(sel => renderPropertyValue(sel, obj));
            });

            // Apply tablesaw features to table
            initializeTableFeaturesAsync();
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
                    //.append('div')
                    //.classed('highlighted', itemsToHighlight.findIndex(o => o == obj) != -1)
                    .selectAll('div').data(propertyConfigs)
                    .enter().append('div')
                    .call(sel => renderPropertyLabelAndValue(sel, obj));
        }

        function renderPropertyLabelAndValue(d3SelectionBoundToPropertyConfig, objectWithProperties)
        {
            let propertyWrapper = d3SelectionBoundToPropertyConfig
                .append('div')
                .attr('class', 'property-label-and-value');
            let labelElement = propertyWrapper
                .append('div')
                .attr('class', 'property-label')
                .text(pc => pc.propertyLabel)
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
            else if (typeof propertyValue == 'string')
            {
                //if (isUUID(propertyValue))
                //    return "<span title='"+propertyValue+"'>"+propertyValue.substring(0, 7)+"...</span>";
                return propertyValue;
            }
            else if (typeof propertyValue == 'boolean')
            {
                //return propertyValue;
                return "<input type='checkbox' "+(!!propertyValue ? "checked" : "")+" onclick='return false;' />";
            }
            else if (propertyValue.constructor == (new Date()).constructor)
            {
                return formatDate(propertyValue);
            }
            else if(!!propertyConfig.onClick)
            {
                return "<button class='btn btn-xs btn-primary'>View</button>";
            }
            return '<em>(no value resolver defined)</em>'
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

            let caseTimerArray = caseDataToTransform.Timers;

            restoreReferencesInCaseTimerObjectGraph(caseTimerArray);

            normalizeProperties(caseTimerArray);

            // Produce D3 map of snapshot Id to snapshot (distinct values only).
            var caseTimerSnapshotsMap = d3.map( caseTimerArray.selectMany(t => t.Events).map(e => e.CaseTimerSnapshot), cts => cts.Id);
            // Make array of snapshots accessible from case data.
            caseDataToTransform.Snapshots = caseTimerSnapshotsMap.values();
            // Replace snapshot data with distinct snapshot data (so we won't have different copies of the same snapshot floating around).
            caseTimerArray.selectMany(t => t.Events).forEach(cte => cte.CaseTimerSnapshot = caseTimerSnapshotsMap.get(cte.CaseTimerSnapshot.Id));



            var allTimelineSeries = caseTimerArray.map(ct => 
            {
                // for each case timer, this returns an array of data series, each of which can be plotted on the timeline

                // Create a nested map of 
                // As we group these events by EventTime into points, we have to treat the EventTime as an integral number of milliseconds.
                // Otherwise, the milliseconds will be lost if we just use the EventTime (Date), because the d3.nest.key resolver will convert the returned object into a string.
                var caseTimerEventPoints = (d3.nest().key(cte => cte.EventTime*1).entries(ct.Events))
                    // map d3 groupings (of { key: "", values: [] }) into an array of points for the timeline
                    .map(d => {
                        var timeOfEvents = new Date(d.key*1);
                        var eventsAtTime = d.values;
                        // Create point data structure
                        return {
                            type: TimelineChart.TYPE.POINT,
                            customClass: 'point-white',
                            label: function(){ 
                                return eventsAtTime.length+' Event'+(eventsAtTime.length == 1 ? '' : 's')+':<br>' + 
                                    eventsAtTime.map(e => ` - ${e.EventIdentifierString}<br>`).join('');
                            },
                            at: timeOfEvents,
                            data: d.values,
                            onClick: function(){ 
                                renderLatestCaseTimerDetailsTable(caseTimerArray, [ ct ]);
                                renderEventDetailsTable(ct.Events, eventsAtTime); 
                            }
                        };
                    });

                var timerEventsSeries = {
                    label: "Events for "+ct.CaseTimerType+": ["+ct.Name+"]",
                    groupingKey: ct.Id,  // The case timer Id is a suitable grouping key
                    data: caseTimerEventPoints
                };

                // // As we group these events into points, we have to treat the SnapshotTime as an integral number of milliseconds.
                // // Otherwise, the milliseconds will be lost if we just use the EventTime (Date), because the d3.nest.key resolver will convert the returned object into a string.

                // //var caseTimerEventsBySnapshotId = (d3.nest().key(cte => cte.CaseTimerSnapshot.Id).entries(ct.Events));

                // // group by snapshot id first to ensure uniqueness and then by snapshottime
                // var caseTimerSnapshotPoints = (d3.nest().key(cts => cts.Id).entries(ct.Events.map(cte => cte.CaseTimerSnapshot)));
                // var caseTimerSnapshotPoints = (d3.nest().key(cts => cts.SnapshotTime*1).entries(ct.Events.map(cte => cte.CaseTimerSnapshot)))
                //     // map d3 groupings (of { key: "", values: [] }) into an array of points for the timeline
                //     .map(d => {
                //         var timeOfEvents = new Date(d.key*1);
                //         var eventsAtTime = d.values;
                //         // Create point data structure
                //         return {
                //             type: TimelineChart.TYPE.POINT,
                //             customClass: 'point-white',
                //             label: function(){ 
                //                 return eventsAtTime.length+' Event'+(eventsAtTime.length == 1 ? '' : 's')+':<br>' + 
                //                     eventsAtTime.map(e => ` - ${e.EventIdentifierString}<br>`).join('');
                //             },
                //             at: timeOfEvents,
                //             data: d.values,
                //             onClick: function(){ 
                //                 renderLatestCaseTimerDetailsTable(caseTimerArray, [ ct ]);
                //                 renderEventDetailsTable(ct.Events, eventsAtTime); 
                //             }
                //         };
                //     });

                // var timerSnapshotsSeries = {
                //     label: "Snapshots for ["+ct.Name+"]",
                //     groupingKey: ct.Id,  // The case timer Id is a suitable grouping key
                //     data: caseTimerSnapshotPoints
                // };

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

                            // If following item exist in array, create an interval with this one and that one
                            if (nextEvt != null)
                            {
                                intervals.push({
                                    type: TimelineChart.TYPE.INTERVAL,
                                    intervalType: ic.intervalType,
                                    customClass: ic.customClass,
                                    label: ic.intervalLabelFn(curEvt),
                                    from: new Date(curEvt.EventTime),
                                    to: new Date(nextEvt.EventTime),
                                    data: [curEvt, nextEvt],
                                    onClick: function(){ 
                                        renderLatestCaseTimerDetailsTable(caseTimerArray, [ ct ]);
                                        renderEventDetailsTable(ct.Events, [curEvt, nextEvt]);
                                    } 
                                });
                            }
                            // ...otherwise, create the final interval with this one and the current time as a tentative stop time
                            else
                            {
                                intervals.push({
                                    type: TimelineChart.TYPE.INTERVAL,
                                    intervalType: ic.intervalType,
                                    customClass: ic.customClass,
                                    label: ic.intervalLabelFn(curEvt),
                                    from: new Date(curEvt.EventTime),
                                    to: now,
                                    data: [curEvt],
                                    onClick: function(){ 
                                        renderLatestCaseTimerDetailsTable(caseTimerArray, [ ct ]);
                                        renderEventDetailsTable(ct.Events, [curEvt]);
                                    } 
                                });
                            }
                        }

                        // new series
                        return {
                            label: intervalConfig.groupLabelFn(intervalGroup.values[0]),
                            groupingKey: ct.Id,  // The case timer Id is a suitable grouping key
                            data: intervals
                        };
                    });
                //console.log("timerIntervalSeriesArray: ", timerIntervalSeriesArray);
                // end grouping of intervals

                var allSeriesForTimer = [ timerEventsSeries ].concat(timerIntervalSeriesArray);

                return allSeriesForTimer;
            })
            // flatten the array of timeline data series arrays into a single array of TDS.
            .reduce((accumulator, currentValue) => accumulator.concat(currentValue));

            // At this point, there will probably be > 1 series associated with each timer.
            // We want to provide some sort of visual grouping mechanism so that all series associated with the same case timer can be visually grouped.
            // Transform the group key to a 0-based index.
            var newGroupingKey = 0;
            var lastGroupKey = "----------------";
            allTimelineSeries.forEach((x) => {
                if (lastGroupKey != x.groupingKey)
                {
                    lastGroupKey = x.groupingKey;
                    newGroupingKey++;
                }
                x.groupingKey = newGroupingKey;
            });

            //console.log("TimelineSeries: ", allTimelineSeries);
            return allTimelineSeries;
        }

    }

    updateTimelineData(newCaseData) {
        this.renderCaseData(newCaseData);
    }

}


module.exports = CaseTimerEventViewer;

