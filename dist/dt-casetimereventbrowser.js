(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(["module"], factory);
    } else if (typeof exports !== "undefined") {
        factory(module);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod);
        global.dtCasetimereventbrowser = mod.exports;
    }
})(this, function (module) {
    "use strict";

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

            d3.select(element).appendHTML("\n            <div class=\"container-fluid\">\n\n                <div class=\"row\">\n                    <div class=\"col-xs-12\">\n                        <div class=\"heading\">Case Timer Status!!!</div>\n                    </div>\n                </div>\n\n                <br>\n\n                <div class=\"row\">\n                    <div class=\"col-xs-12\">\n                        <div id=\"chart2\" class=\"chart-container\" style=\"height: 600px;\"></div>\n                    </div>\n                </div>\n\n                <br>\n                \n                <div class=\"row\">\n                    <div class=\"col-xs-12\">\n                        <div id=\"case-timer-details\" class=\"box details-container responsive-table-1500\" style=\"min-height: 300px;\"></div>\n                    </div>\n                </div>\n\n                <br>\n                \n                <div class=\"row\">\n                    <div class=\"col-xs-12\" >\n                        <div id=\"event-details\" class=\"box details-container responsive-table-1100\" style=\"min-height: 300px;\"></div>\n                    </div>\n                </div>\n\n                <br>\n\n                <div class=\"row\">\n                    <div class=\"col-xs-12\">\n                        <div id=\"snapshot-details\" class=\"box details-container responsive-table\" style=\"min-height: 300px;\"></div>\n                    </div>\n                </div>\n\n                <br>\n\n                <div class=\"row\">\n                    <div class=\"col-xs-12\">\n                        <div id=\"chart1\" class=\"chart-container\"  style=\"height: 400px;\"></div>\n                    </div>\n                </div>\n                \n                <br>\n\n            </div>");

            // if (!caseData) { alert('case data was not provided.'); return; }
            // if ((caseData.Timers || []).length == 0) { alert('case data contains no timers'); return; }

            // console.log("input caseData:", caseData);

            // //normalizeProperties(caseTimerDataArray);

            // caseTimerTimelineData = transformCaseTimerDataToTimelineData(caseData.Timers);
            // console.log("caseTimerTimelineData:", caseTimerTimelineData);

            // renderCaseTimersTable(caseData.Timers);


            // const timeline = new TimelineChart(element, caseTimerTimelineData, {
            //     //enableLiveTimer: true, 
            //     tip: formatTipText,
            //     groupHeight: 50
            // }); //.onVizChange(e => console.log(e));

            // // Resize container vertically to fit timeline
            // var svgHeight = d3.select(element).select("svg").attr("height")*1;
            // d3.select(element).style("height", (svgHeight+10)+"px");
        }

        _createClass(CaseTimerEventBrowser, [{
            key: "someotherfnhere",
            value: function someotherfnhere() {
                var donothing;
            }
        }]);

        return CaseTimerEventBrowser;
    }();

    module.exports = CaseTimerEventBrowser;
});
//# sourceMappingURL=dt-casetimereventbrowser.js.map
