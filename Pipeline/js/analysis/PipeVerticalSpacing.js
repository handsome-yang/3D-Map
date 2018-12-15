/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：垂直净距js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
$(function () {
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    var layer = earth.LayerManager.GetLayerByGUID(projectId);//工程图层
    var pipeLineLayers = top.LayerManagement.getPipeListByLayer(layer);//所有管线图层
    setDivHeight();
    var highlightObjectList = [];//需要高亮的对象集合
    /**
     * 解析查询结果，添加到结果表格中
     * @param result 查询结果
     * @param guid 图层ID
     * @param name 图层名
     */
    var parseResult = function (result, guid, name) {
        var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY",true)' +
            '><td class="col1">$INDEX</td><td class="col2">$LAYER</td><td title="$TITLE" class="col3 $CLASS">$VDIST</td><td class="col4">$STANDARD</td></tr>';
        var json = $.xml2json(result);
        if (json == null || !json.CollisionResult) {
            return;
        }
        var type = "line";
        var records = json.CollisionResult.Record;
        if (json.CollisionResult.num <= 0) {
            return;
        } else if (json.CollisionResult.num == 1) {
            if (records[top.getNameNoIgnoreCase("US_KEY", 1, true)] == $("#txtObjId").val()) {
                return;
            }
            records = [records];
        }
        for (var i = 0; i < records.length; i++) {
            if (records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)] == $("#txtObjId").val()) {
                continue;
            }
            var thisClass = "bgNone";
            var thisTitle = "净距符合标准";
            if (parseFloat(records[i].VerticalDistance) > 0 && Math.abs(parseFloat(records[i].VerticalDistance)) < parseFloat(records[i].VerticalISO)) {
                thisClass = "bgRed";
                thisTitle = "净距<标准值";
                var obj = {};
                obj.layerId = guid;
                obj.type = type;
                obj.guid = records[i][top.getNameNoIgnoreCase("US_ID", 1, true)];
                obj.key = records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)];
                highlightObjectList.push(obj);
            } else if (parseFloat(records[i].VerticalDistance) < 0) {
                thisTitle = "净距为负";
            }
            $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                .replace("$LAYER", name)
                .replace("$VDIST", parseFloat(records[i].VerticalDistance) < 0 ? "-" : parseFloat(records[i].VerticalDistance).toFixed(2))
                .replace("$STANDARD", parseFloat(records[i].VerticalISO) < 0 ? "-" : parseFloat(records[i].VerticalISO).toFixed(2))
                .replace("$LayerID", guid)
                .replace("$TYPE", type)
                .replace("$GUID", records[i][top.getNameNoIgnoreCase("US_ID", 1, true)])
                .replace("$KEY", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                .replace("$TITLE", thisTitle)
                .replace("$CLASS", thisClass));

        }
        noResult = false;
        $("#importExcelBtn").attr("disabled", false);
        $("#showResult").attr("disabled", false);
        $("#detailData").attr("disabled", false);
        divloaded();
    };
    /**
     * 管线选取点击事件
     */
    $("#btnSelectObject").click(function () {
        if (highlightObjectList.length > 0) {
            analysisShowResult(false, highlightObjectList);
            $("#showResult").attr("checked", false);
        }
        earth.focus();
        analysisSelectObj($("#txtObjId"), $("#btnAnalyze"), $("#txtBufferDist"));
    });
    /**
     * 缓冲半径控制输入并且实时控制缓冲区域的绘制
     */
    $("#txtBufferDist").keyup(function () {
        checkNum($("#txtBufferDist")[0], true, 2, 100);
        var value = $("#txtBufferDist").val();
        if (!parseFloat(value) || isNaN(value)) {
            $("#btnAnalyze").attr("disabled", true);
        } else {
            if (obj.selectedObj) {
                AnalysisCreateBufferFromLine(obj.selectedObj, $("#txtBufferDist").val());
                $("#btnAnalyze").attr("disabled", false);
            } else {
                $("#btnAnalyze").attr("disabled", true);
            }
        }
    });
    var hasClicked = false;//是否点击了分析按钮，防止出现多次点击出现多次结果
    /**
     * 分析按钮点击事件
     */
    $("#btnAnalyze").click(function () {
        if (hasClicked) {
            return;
        }
        noResult = true;
        $("#tblResult>tbody").empty();
        divload("tablediv");
        hasClicked = true;
        clearHighLight();
        if (highlightObjectList.length > 0) {
            analysisShowResult(false, highlightObjectList);
        }
        if (obj == null) {
            return;
        }
        if (obj.selectedObj == null || obj.selectedObj.Count != 2) {
            return;
        }
        if (highlightObjectList.length > 0) {
            highlightObjectList.splice(0, highlightObjectList.length);
        }
        $("#showResult").attr("checked", false);
        $("#tblResult>tbody").empty();
        var urlList = [];
        $.each(pipeLineLayers, function (i, v) {
            var guid = v.id;
            var server = v.server;
            var name = v.name;
            var strConn = server + "pipeline?rt=collision&service=" + guid;
            strConn += "&aparam=0,";
            strConn += obj.selectedObjStr + ",";
            strConn += obj.pdiam + ",";
            strConn += $("#txtBufferDist").val() + ",";
            strConn += obj.pipetype + ",";
            strConn += obj.ppressure + ",";
            strConn += obj.plttype + ",";
            strConn += obj.ppsvalue;
            urlList.push({"url": strConn, "guid": guid, "name": name});

        });
        sendService(urlList);
    });
    var noResult = true;
    /**
     * 发送请求
     * @param urlList 请求url集合
     */
    var sendService = function (urlList) {
        if (urlList) {
            var tempArr = urlList.shift();
            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                    var xmlStr = pRes.AttributeName;
                    var xmlDoc = loadXMLStr(xmlStr);
                    parseResult(xmlDoc, tempArr.guid, tempArr.name);
                }
                if (noResult && urlList.length == 0) {
                    divloaded();
                    alert("分析结果为空！");
                }
                if (urlList.length != 0) {
                    sendService(urlList);
                } else {
                    hasClicked = false;
                }
            };
            earth.DatabaseManager.GetXml(tempArr["url"]);
        }
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "图层", "垂直净距", "标准"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    //显示结果
    $("#showResult").click(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        analysisShowResult(checkTag, highlightObjectList);
    });
    //显示详细信息
    $("#detailData").click(function () {
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
    });
    $(window).unload(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            analysisShowResult(false, highlightObjectList);
        }
        analysisClearBuffer();
        clearHighLight();
        stophighlight();
    });
});