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
        global.PurgeConsole = mod.exports;
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

    var PurgeConsole = function () {
        function PurgeConsole(element, initialData, opts) {
            _classCallCheck(this, PurgeConsole);

            var self = this;

            var options = this.extendOptions(opts);

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

            function appendHtmlNodesToHead(headHTMLString) {
                var targetNode = d3.select('head').node();
                var nodesToImport = new DOMParser().parseFromString(headHTMLString, 'text/html').head.childNodes;
                for (var i = 0; i < nodesToImport.length; i++) {
                    targetNode.appendChild(document.importNode(nodesToImport[i], true));
                }
            }

            // Add style and script dependencies needed by this component
            appendHtmlNodesToHead(['<link href="https://cdn.jsdelivr.net/npm/tablesaw@3.0.9/dist/tablesaw.min.css" rel="stylesheet" type="text/css">'].join('\n'));

            function initializeTableFeatures() {
                if (window.Tablesaw === undefined) {
                    setTimeout(initializeTableFeatures, 500);
                    return;
                }

                Tablesaw.init();
            }

            d3.select(element).appendHTML('\n            <div id="case-timer-event-viewer-container" class="container-fluid font-scale-pct-80">\n\n                <div class="mt-3">\n                    <div class="h4 bottom-border"> Perform Purge Operations </div>\n\n                    <div id="case-timer-event-viewer-error" class="alert alert-warning mt-3" role="alert">\n                        <div class="alert-heading"> To view case timer data for a given case, please enter a valid entity Id for a case, SLA, case timer, case timer event, or case timer snapshot.</div>\n                    </div>\n                \n                    <div class="row mb-3">\n                        <div class="col-12">\n                            <div> Enter an entity Id and click the button to perform a purge-related operation on it. </div>\n                            <div class="input-group">\n                                <div class="input-group-prepend">\n                                    <button class="btn btn-outline-secondary" data-purge-entity-type="Case" data-purge-operation="PreventPurge">Prevent Purge</button>\n                                    <button class="btn btn-outline-secondary" data-purge-entity-type="Case" data-purge-operation="AllowPurge">Allow Purge</button>\n                                    <button class="btn btn-outline-secondary" data-purge-entity-type="Case" data-purge-operation="CreatePurgeRequest">Create Request</button>\n                                    <button class="btn btn-outline-secondary" data-purge-entity-type="Case" data-purge-operation="CancelPendingPurgeRequest">Cancel Request</button>\n                                    <button class="btn btn-outline-secondary" data-purge-entity-type="Case" data-purge-operation="CreateAndExecutePurgeRequest">Purge Now</button>\n                                </div>\n                                <input type="text" id="entity-id" class="form-control" placeholder="Enter a valid entity (case or employee) Id" />\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class="row mb-3">\n                        <div class="col-12">\n                            <div id="purge-result-details"></div>\n                        </div>\n                    </div>\n\n                </div>\n\n                <div id="case-timer-event-viewer-content">\n\n                    <div class="mb-3">\n                        <div class="h4 bottom-border"> Most Recent Purge Requests </div>\n\n                        <div id="case-timer-data-latest" >\n                                <div class="form-row mb-3 align-items-center">\n                                    <div class="col-auto">\n                                        <button class="btn btn-primary" id="fetch-purge-requests"> Fetch Purge Requests </button>\n                                    </div>\n                                    <div class="col-auto">\n                                        <div class="input-group">\n                                            <div class="input-group-prepend">\n                                                <span class="input-group-text">Limit</span>\n                                            </div>\n                                            <input type="text" class="form-control" placeholder="Maximum number of recent purge requests to display" id="purge-request-take" />\n                                        </div>\n                                    </div>\n                                    <div class="col-auto">\n                                        <div class="input-group">\n                                            <div class="input-group-prepend">\n                                                <span class="input-group-text">Skip</span>\n                                            </div>\n                                            <input type="text" class="form-control" placeholder="Number of recent purge requests to skip" id="purge-request-skip" />\n                                        </div>\n                                    </div>\n                                </div>\n\n                            <div class="row mb-3">\n                                <div class="col-12">\n                                    <div id="purge-requests-latest" class="scrollable-container" ></div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n\n                </div>\n\n            </div>');

            var purgeRequestDetailsContainer = document.getElementById('purge-requests-latest');
            var purgeResultDetailsContainer = document.getElementById('purge-result-details');
            var purgeRequestTakeInput = document.getElementById('purge-request-take');
            var purgeRequestSkipInput = document.getElementById('purge-request-skip');

            d3.select(purgeRequestTakeInput).property("value", options.take);
            d3.select(purgeRequestSkipInput).property("value", options.skip);
            d3.select('#fetch-purge-requests').on('click', fetchAndRenderPurgeRequestsUsingInputs);

            function displayPurgeOperationResult(request, data) {
                console.log('PurgeOperationResult: ', data);
                emptyContainer(purgeResultDetailsContainer);
                var tf = d3.timeFormat("%H:%M:%S.%L");
                d3.select(purgeResultDetailsContainer).appendHTML('\n                <dl>\n                    <dt>Request</dt>\n                    <dd>\n                        [' + tf(request.time) + ']  Request made to ' + request.operationName + ' for entity ' + request.entityId + '...\n                    </dd>\n                    <dt>Response Data</dt>\n                    <dd>\n                        [' + tf(data.time) + '] \n                        ' + (!data.Entity ? '' : 'Entity <code>' + data.Entity.Path + '</code> was found. Its purge status is now <strong>' + data.Entity.PurgeStatus + '</strong>.<br>') + '\n                    </dd>\n                    <dd class="font-weight-bold">\n                        ' + (data.Successful ? '<span class="badge badge-success">Success</span>' : '<span class="badge badge-danger">Failure</span>') + '\n                        <span>' + data.ResultMessage + '</span>\n                    </dd>\n                </dl>\n            ');

                // If operation was successful, then refresh the list of purge requests
                fetchAndRenderPurgeRequestsUsingInputs();
            }

            function issuePurgeRequestForEntity(operationName, entityType) {
                //var entityIdInputId = `${entityType.toLowerCase()}-id`;
                //var entityId = d3.select('#'+entityIdInputId).property('value');
                var entityId = d3.select('#entity-id').property('value');
                var request = { endpoint: 'PerformPurgeOperation', /*entityType: entityType,*/entityId: entityId, operationName: operationName, time: new Date() };
                d3.json(request.endpoint + '?id=' + request.entityId + '&op=' + request.operationName).get(function (evt, data) {
                    data = evt instanceof Error ? { "Successful": false, "ResultMessage": 'Error occurred: ' + evt } : data || { "Successful": false, "ResultMessage": evt.target.status + ' (' + evt.target.statusText + ')' };
                    data.time = new Date();
                    displayPurgeOperationResult(request, data);
                });
            }

            // Wire up purge operation requests
            d3.selectAll('[data-purge-operation]').on('click', function () {
                var op = d3.select(this).attr('data-purge-operation');
                issuePurgeRequestForEntity(op);
            });

            // d3.select('#entity-id')
            //     .on("keypress", function() { if(d3.event.keyCode === 13) submitForm(); });

            // =======================================================================================================================================================================
            // Property Config fields:
            //  priority (optional) - The priority of the field which indicates how important it is to show the field.  Range: 0(most important/always show) -> 6(least important)
            //  propertyLabel - The label to display for the column header / field
            //  propertyValueSelector - A function that returns the HTML content to be displayed, given the object
            //  onClick - (optional) A click event handler which will be registered on the content.
            // =======================================================================================================================================================================

            function getBootstrapClassForPurgeRequestStatus(prStatus) {
                var cls = prStatus == "Cancelled" ? "light" : prStatus == "Pending" ? "info" : prStatus == "FailedPrerequisite" ? "danger" : prStatus == "ProcessingError" ? "danger" : prStatus == "Purged" ? "dark" : "danger";
                return '<span class="badge badge-' + cls + '">' + prStatus + '<span>';
            }

            function getHtmlForEntityPurgeStatus(epStatus) {
                var cls = epStatus == "Restricted" ? "warning" : epStatus == "None" ? "light" : epStatus == "Pending" ? "info" : epStatus == "Purged" ? "dark" : "danger";
                return '<span class="badge badge-' + cls + '">' + epStatus + '<span>';
            }

            // PurgeRequest property configs
            var purgeRequestPropertyConfigs = [
            // the datetime value has to be prefixed by a character, because if not, then the sort function will assume the column represents a numeric value.
            { priority: 2, propertyLabel: "Last <br>Modified", propertyValueSelector: function propertyValueSelector(x) {
                    return '.' + formatDateTime(x.LastModified);
                }, numericSort: true, onClick: null }, { priority: 0, propertyLabel: "Entity <br>Type", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Entity.TypeName;
                }, onClick: null }, { priority: 0, propertyLabel: "Entity Id", propertyValueSelector: function propertyValueSelector(x) {
                    return '<button type="button" class="btn btn-light d-inline-block text-truncate" style="max-width: 7em" title="' + x.Entity.Id + '">' + x.Entity.Id + '</button>';
                },
                onClick: function onClick(pr) {
                    d3.select('#entity-id').property('value', pr.Entity.Id);
                } }, { priority: 0, propertyLabel: "Purge <br>Request <br>Status", propertyValueSelector: function propertyValueSelector(x) {
                    return '<h4>' + getBootstrapClassForPurgeRequestStatus(x.Status) + '</h4>';
                }, onClick: null }, { priority: 0, propertyLabel: "Entity <br>Purge <br>Status", propertyValueSelector: function propertyValueSelector(x) {
                    return '<h4>' + getHtmlForEntityPurgeStatus(x.Entity.PurgeStatus) + '</h4>';
                }, onClick: null }, { priority: 4, propertyLabel: "Requesting <br>User", propertyValueSelector: function propertyValueSelector(x) {
                    return x.User.FirstName + '<br>' + x.User.LastName;
                }, onClick: null }, { priority: 5, propertyLabel: "Request <br>Reference <br>Note", propertyValueSelector: function propertyValueSelector(x) {
                    return x.ReferenceNote;
                }, onClick: null }, { priority: 2, propertyLabel: "Result Messages", propertyValueSelector: function propertyValueSelector(x) {
                    return (x.ResultMessages || '').replace(/\n/g, "<br>");
                }, onClick: null }, { priority: 2, propertyLabel: "Purge <br>Failure <br>Code", propertyValueSelector: function propertyValueSelector(x) {
                    return x.PurgeFailureCode;
                }, onClick: null }, { priority: 6, propertyLabel: "Id", propertyValueSelector: function propertyValueSelector(x) {
                    return x.Id;
                }, onClick: null }];

            var dataModel;
            function getDataModel() {
                return dataModel;
            }
            self.getDataModel = getDataModel;
            self.loadData = loadData;
            self.fetchAndRenderPurgeRequests = fetchAndRenderPurgeRequests;

            // by default, we will attempt to fetch and render purge requests using the input parameters on the page
            fetchAndRenderPurgeRequestsUsingInputs();

            var timeline;

            //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // Other functions below

            function fetchAndRenderPurgeRequestsUsingInputs() {

                // Try to use the skip/take input parameters on the page.  
                // Fall back to using the defaults if the value cannot be parsed or are out of bounds.

                var skip = parseInt(d3.select(purgeRequestSkipInput).property('value'));
                if (skip === NaN || skip < 0) skip = options.skip;

                var take = parseInt(d3.select(purgeRequestTakeInput).property('value'));
                if (take === NaN || take < 1 || take > 1000) take = options.take;

                var requestParams = { "skip": skip, "take": take };
                fetchAndRenderPurgeRequests(requestParams);
            }

            function fetchAndRenderPurgeRequests(requestParameters) {
                console.log('Fetching latest purge requests using parameters: ', requestParameters);
                d3.json('purgerequests?skip=' + requestParameters.skip + '&take=' + requestParameters.take).get(function (xhr, data) {
                    loadData(data);
                });
            }

            function loadData(dataToLoad) {
                processData(dataToLoad);
                renderData(dataToLoad);
            }

            var ymdhmsTimeParser = d3.utcParse("%Y-%m-%dT%H:%M:%SZ");
            var ymdhmsTimeFormatter = d3.timeFormat("%Y-%m-%d %H:%M:%S");
            var hmslTimeFormatter = d3.timeFormat("%H:%M:%S.%L");

            function processData(dataModelToProcess) {
                if (!dataModelToProcess) {
                    return;
                }
                dataModelToProcess.Items.forEach(function (pr) {
                    pr.LastModified = ymdhmsTimeParser(pr.LastModified);
                });
            }

            function renderData(dataModelToRender) {
                // Update visibility of sections
                d3.select('#case-timer-event-viewer-error').visible(dataModelToRender === null);
                d3.select('#case-timer-event-viewer-content').visible(dataModelToRender !== null);

                // Validate input
                if (!dataModelToRender) {
                    return;
                }

                //let caseTimerTimelineData = transformCaseDataToTimelineData(dataModelToRender);
                console.log("PurgeRequest data: ", dataModelToRender);
                //console.log("Timeline data: ", caseTimerTimelineData);

                // Render stuff
                //renderLatestCaseProperties(dataModelToRender);
                renderPurgeRequestsTable(dataModelToRender.Items);

                dataModel = dataModelToRender;
            }

            function beforeSnapshotDataSerialized(ssd) {
                // If CaseTimer is for an SLA, then don't include redundant CaseTimer data.
                // If CaseTimer is not for an SLA but if there is an SLA on the case, then do include its CaseTimer data, but don't include the Sla's CaseTimer's Case data.
                if (ssd.CaseTimer.CaseTimerType === 'Sla') {
                    // If the SLA hasn't already been removed
                    if (ssd.Sla != null) {
                        ssd.Sla.CaseTimer = "(see SnapshotData.CaseTimer)"; // = null;
                    }
                } else if (ssd.Sla != null) {
                    ssd.Sla.CaseTimer.Case = "(see SnapshotData.CaseTimer.Case)"; // = null;
                }
            }

            function formatDateTime(date) {
                // We will only display fractional seconds to ms precision, because JS's date doesn't support any greater precision than that.
                return ymdhmsTimeFormatter(date);
            }

            function emptyContainer(container) {
                // remove all child elements of the specified container
                while (container.firstChild) {
                    container.removeChild(container.firstChild);
                }
            }

            function renderPurgeRequestsTable(allPurgeRequests, selectedItems) {
                emptyContainer(purgeRequestDetailsContainer);
                renderTableOfObjects(purgeRequestDetailsContainer, purgeRequestPropertyConfigs, allPurgeRequests, selectedItems);
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
                    return headerRow.append('th').attr('data-tablesaw-sortable-col', '')
                    //.attr('data-tablesaw-sortable-numeric', pc.numericSort) // if numericSort
                    .attr('data-tablesaw-priority', pc.priority === 0 ? 'persist' : pc.priority).html(pc.propertyLabel);
                });

                var tbody = table.append('tbody');

                // Render each row
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
                }
                // If nothing else was matched above, but if the onClick handler was set, then make it a button with the label "View"
                else !!propertyConfig.onClick;
                {
                    return '<button class="btn btn-sm btn-' + (propertyConfig.priority < 3 ? 'primary' : 'secondary') + '">View</button>';
                }
                return '<em>(no value resolver defined for this type)</em>';;
            }
        }

        _createClass(PurgeConsole, [{
            key: 'extendOptions',
            value: function extendOptions() {
                var ext = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

                var defaultOptions = {
                    skip: 0, // # of latest purge requests to skip
                    take: 20 // # of latest purge requests to take
                };
                Object.keys(ext).map(function (k) {
                    return defaultOptions[k] = ext[k];
                });
                return defaultOptions;
            }
        }, {
            key: 'updateData',
            value: function updateData(newData) {
                this.loadData(newData);
            }
        }, {
            key: 'fetchData',
            value: function fetchData(requestParams) {
                this.fetchAndRenderPurgeRequests(requestParams);
            }
        }]);

        return PurgeConsole;
    }();

    module.exports = PurgeConsole;
});
//# sourceMappingURL=purge-console.js.map
