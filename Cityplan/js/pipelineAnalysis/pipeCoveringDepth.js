/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：覆土分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
/**
 * 屏蔽右键菜单
 */

document.oncontextmenu = function () {
    event.returnValue = false;
};
var lastResult = false;

var earth = null;
$(function () {
    var pageSize = 20;
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    var lastHighlightGuid = null;
    /**
     * 功能："项目"下拉列表的onchange事件
     */
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    /**
     * 解析查询结果，添加到结果表格中
     * @param result 查询结果
     * @param guid 图层ID
     * @param name 图层名
     */
    var highlightObjectList = [];
    var parseResult = function (result, guid, pltype) {
        var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
            '><td class="w75">$INDEX</td>' +
            '<td class="w125 $SRED">$SDEEP</td>' +
            '<td class="w125 $ERED">$EDEEP</td><td class="w125">$STANDARD</td></tr>';
        var json = $.xml2json(result);
        if (json == null || !json.depthResult) {
            return;
        }
        var type = "line";
        var records = json.depthResult.Record;
        if (json.depthResult.num <= 0) {
            return;
        } else if (json.depthResult.num == 1) {
            records = [records];
        }
        for (var i = 0; i < records.length; i++) {
            var standard = records[i].ISO;
            $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                .replace("$SDEEP", (parseFloat(records[i][top.getNameNoIgnoreCase("US_SDEEP", 1, true)])).toFixed(2))
                .replace("$SRED", parseFloat(records[i][top.getNameNoIgnoreCase("US_SDEEP", 1, true)]) < standard ? "bgRed" : "")
                .replace("$EDEEP", (parseFloat(records[i][top.getNameNoIgnoreCase("US_EDEEP", 1, true)])).toFixed(2))
                .replace("$ERED", parseFloat(records[i][top.getNameNoIgnoreCase("US_EDEEP", 1, true)]) < standard ? "bgRed" : "")
                .replace("$STANDARD", standard)
                .replace("$LayerID", guid)
                .replace("$TYPE", type)
                .replace("$GUID", records[i][top.getNameNoIgnoreCase("US_ID", 1, true)])
                .replace("$KEY", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)]));
            if (parseFloat(records[i][top.getNameNoIgnoreCase("US_SDEEP", 1, true)]) < standard || parseFloat(records[i][top.getNameNoIgnoreCase("US_EDEEP", 1, true)]) < standard) {
                var obj = {};
                obj.layerId = guid;
                obj.type = type;
                obj.guid = records[i][top.getNameNoIgnoreCase("US_ID", 1, true)];
                obj.key = records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)];
                highlightObjectList.push(obj);
            }
        }
    };
    // 初始化表格
    var initGrid = function (layerId, type, recordsNum, firstResults, strCon) { //给数据表格设置表头
        if (recordsNum < 1) {

            alert("无该图层分析数据");
            $("#dg").datagrid({
                pagination: false
            });
            if (lastResult) {
                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
            }
            $('#dg').datagrid('loadData', {total: 0, rows: []});

            lastResult = false;
            return;
        }
        var pageNum = Math.ceil(recordsNum / pageSize);
        $("#dg").datagrid({
            pageSize: 20,
            singleSelect: true,
            pagination: true,
            columns: [
                [{
                    field: 'us_key',//覆土分析只针对管线分析，不分析管点
                    title: '编号',
                    width: 60,
                    align: 'center',
                    formatter: function (value, rowData, rowIndex) {
                        var fieldName = top.getNameNoIgnoreCase("US_KEY", 1, true);
                        return rowData[fieldName];
                    }
                },
                    {
                        field: 's_deep',
                        title: '起点',
                        width: 60,
                        align: 'center',
                        formatter: function (value, rowData, rowIndex) {
                            var fieldName = top.getNameNoIgnoreCase("US_SDEEP", 1, true);
                            var s_deep = rowData[fieldName];
                            if (parseFloat(s_deep) < parseFloat(rowData.ISO)) {
                                var str = "<div style='background-color:red'>" + parseFloat(s_deep).toFixed(2) + "</div>";
                                return str;
                            } else {
                                return parseFloat(s_deep).toFixed(2);
                            }
                        }
                    },
                    {
                        field: 'e_deep',
                        title: '终点',
                        width: 60,
                        align: 'center',
                        formatter: function (value, rowData, rowIndex) {
                            var fieldName = top.getNameNoIgnoreCase("US_EDEEP", 1, true);
                            var e_deep = rowData[fieldName];
                            if (parseFloat(e_deep) < parseFloat(rowData.ISO)) {
                                var str = "<div style='background-color:red'>" + parseFloat(e_deep).toFixed(2) + "</div>";
                                return str;
                            } else {
                                return parseFloat(e_deep).toFixed(2);
                            }
                        }
                    },
                    {
                        field: 'ISO',
                        title: '标准',
                        width: 60,
                        align: 'center'
                    }]
            ],
            fitColumns: true,
            onRowContextMenu: function (e, rowIndex, rowData) {
                e.preventDefault();
            },
            onHeaderContextMenu: function (e, field) {
                e.preventDefault();
            },
            onDblClickRow: function (rowIndex, rowData) {
                var key;
                key = top.getNameNoIgnoreCase("US_KEY", 1, true);
                key = rowData[key];
                analysisHighlightObject(layerId, type, null, key);
            },
            nowrap: false
        });

        var data = {"total": recordsNum, "rows": firstResults};
        if (lastResult) {
            $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
        }
        lastResult = true;
        $('#dg').datagrid('loadData', data);
        $($(".datagrid-body")[1]).mCustomScrollbar();
        $("#importExcelBtn").attr("disabled", false);
        $("#showResult").attr("disabled", false);
        $("#detailData").attr("disabled", false);
        var pager = $('#dg').datagrid('getPager');
        pager.pagination({
            showPageList: false,
            showRefresh: false,
            beforePageText: "",
            afterPageText: "" + pageNum + "页",
            displayMsg: '',
            onSelectPage: function (pageNum, pageSize) {
                var pgStartIndex = pageNum - 1;
                var url = strCon + "&pg=" + pgStartIndex + "," + pageSize;
                earth.Event.OnEditDatabaseFinished = function (pRes) {
                    if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                        var xmlStr = pRes.AttributeName;
                        result = loadXMLStr(xmlStr);
                        if (result !== null) {
                            var json = $.xml2json(result);
                            var records = json.depthResult.Record;
                            var counts = records.length;
                            if (!counts) {
                                records = [records];
                            }
                            var pageData = {"total": recordsNum, "rows": records};
                            if (lastResult) {
                                $($(".datagrid-body")[1]).mCustomScrollbar("destroy");
                            }
                            $('#dg').datagrid('loadData', pageData);
                            $($(".datagrid-body")[1]).mCustomScrollbar();
                            lastResult = true;
                        }
                    }
                }
                earth.DatabaseManager.GetXml(url);
            }
        });
    }
    var strCon = "";
    /**
     * 画多边形回调函数
     * @param pFeat
     * @param geoType
     */
    var onCreatePolygon = function (pFeat, geoType) {
        divload("tablediv");
        clearHighLight();
        $("#tblResult>tbody").empty();
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var name = vv.text();
        var layer = earth.LayerManager.GetLayerByGUID(guid);

        var result = null;

        if (layer.GISServer) {
            if (geoType === 5) {
                var pointString = "";
                for (var i = 0; i < pFeat.Count; i++) {
                    if (pointString === "") {
                        pointString = pointString + pFeat.Items(i).X + "," + pFeat.Items(i).Y + "," + 0;
                    } else {
                        pointString = pointString + "," + pFeat.Items(i).X + "," + pFeat.Items(i).Y + "," + 0;
                    }
                }
                strCon = layer.GISServer + "pipeline?rt=depth&service=" + guid + "&sc=" + "(2" + "," + pFeat.Count + "," + "" + pointString + "," + ")";
            } else if (geoType === 8) {
                strCon = layer.GISServer + "pipeline?rt=depth&service=" + guid + "&sc=" + "(3,1" + "," + "" + pFeat.Radius + ",";
                strCon = strCon + pFeat.Longitude + "," + pFeat.Latitude + ")";
            } else if (geoType === 404) {
                strCon = layer.GISServer + "pipeline?rt=depth&service=" + guid;
            }
            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                    var xmlStr = pRes.AttributeName;
                    result = loadXMLStr(xmlStr);
                    if (result !== null) {
                        var json = $.xml2json(result);
                        if (json == null || !json.depthResult) {
                            alert("分析结果为空！");
                            divloaded();
                            return;
                        }
                        var type = "line";
                        var analysisResult = json.depthResult;
                        var recordsNum = analysisResult.num;
                        var firstResults = analysisResult.Record;
                        if (recordsNum == 1) {
                            firstResults = [firstResults];
                        }
                        initGrid(guid, type, recordsNum, firstResults, strCon);
                        divloaded();
                    }
                    earth.Event.OnCreateGeometry = function () {
                    };
                } else {
                    alert("分析结果为空！");
                    divloaded();
                }
            }
            earth.DatabaseManager.GetXml(strCon + "&pg=0,20");
        }
    };
    // 全部按钮
    $("#btnAllRegionSelect").click(function () {
        if ($("#showResult").attr("checked")) {
            getHighLightObjects(strArr, lastHighlightGuid, "line", false);
            $("#showResult").attr("checked", false);
        }
        resetResults();

        earth.ShapeCreator.Clear();
        if (highlightObjectList.length > 0) {
            highlightObjectList.splice(0, highlightObjectList.length);
        }
        $("#showResult").attr("checked", false);
        $("#tblResult>tbody").empty();
        onCreatePolygon(null, 404);
    });
    // 圆形按钮
    $("#btnCircle").click(function () {
        if ($("#showResult").attr("checked")) {
            getHighLightObjects(strArr, lastHighlightGuid, "line", false);
            $("#showResult").attr("checked", false);
        }
        resetResults();
        $("#showResult").attr("checked", false);
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    // 多边形按钮
    $("#btnPolygonRegion").click(function () {
        if ($("#showResult").attr("checked")) {
            getHighLightObjects(strArr, lastHighlightGuid, "line", false);
            $("#showResult").attr("checked", false);
        }
        resetResults();
        $("#showResult").attr("checked", false);
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    // 获取当前高亮对象
    var getHighLightObjects = function (arr, guid, pt, isShow) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i]) {
                highlightObjects(guid, pt, arr[i], isShow);
            }
        }
        $("#showResult").attr("disabled", false);
    }
    var strArr = [];//传入的编号字符串数组
    var strArrLen = 0;
    var totalRecordsLen = 0;
    var resetResults = function () {
        strArr = [];//传入的编号字符串数组
        strArrLen = 0;
        totalRecordsLen = 0;
    }
    //显示结果

    $("#showResult").click(function () {
        $("#showResult").attr("disabled", true);
        var strIndex = 0;

        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        lastHighlightGuid = guid;
        var selectLayer = earth.LayerManager.GetLayerByGUID(guid);
        clearHighLight();
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            if (strArr.length) {
                getHighLightObjects(strArr, guid, "line", true)
            } else {
                earth.Event.OnEditDatabaseFinished = function (pRes) {
                    if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                        var thisStr = "";
                        var xmlStr = pRes.AttributeName;
                        result = loadXMLStr(xmlStr);
                        if (result !== null) {
                            var json = $.xml2json(result);
                            var records = json.depthResult.Record;
                            if (records == null || !records) {
                                return;
                            }
                            var counts = records.length;
                            if (strArrLen == 0) {
                                strArrLen = Math.ceil(json.depthResult.num / 10000);
                            }
                            if (!counts) {
                                records = [records];
                            }
                            for (var i = 0; i < records.length; i++) {
                                var fieldName = top.getNameNoIgnoreCase("US_KEY", 1, true);
                                var fieldValue = records[i][fieldName];
                                var s_deep = records[i][top.getNameNoIgnoreCase("US_SDEEP", 1, true)];
                                var e_deep = records[i][top.getNameNoIgnoreCase("US_EDEEP", 1, true)];
                                var deepIso = records[i].ISO;
                                if (deepIso > s_deep || deepIso > e_deep) {
                                    if (thisStr == "") {
                                        thisStr += fieldValue
                                    } else {
                                        thisStr += "," + fieldValue;
                                    }
                                }
                            }
                            strArr.push(thisStr);
                            strIndex++;
                            if (strIndex < strArrLen) {
                                earth.DatabaseManager.GetXml(strCon + "&pg=" + strIndex + ",10000");
                            } else {
                                earth.Event.OnEditDatabaseFinished = function () {
                                };
                                getHighLightObjects(strArr, guid, "line", true)
                            }

                        }
                    }
                }
                earth.DatabaseManager.GetXml(strCon + "&pg=0,10000");
            }
        } else {
            if (strArr.length) {
                getHighLightObjects(strArr, guid, "line", false);
            }
        }
    });
    //显示详细信息
    $("#detailData").click(function () {
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                result = loadXMLStr(strCon);
                if (result !== null) {
                    var vv = $("#selLayers option:selected");
                    var guid = vv.val();
                    parseResult(result, guid);
                    var tabObj = $("#tblResult>tbody")[0];
                    var columns = ["编号", "起点埋深", "终点埋深", "埋深标准"];
                    StatisticsMgr.importExcelByTable(tabObj, columns);
                }
                earth.Event.OnCreateGeometry = function () {
                };
            }
        }
        earth.DatabaseManager.GetXml(strCon);

    });
    window.onunload = function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            var vv = $("#selLayers option:selected");
            getHighLightObjects(strArr, lastHighlightGuid, "line", false);
        }
        earth.ShapeCreator.Clear();
        clearHighLight();
    };
});