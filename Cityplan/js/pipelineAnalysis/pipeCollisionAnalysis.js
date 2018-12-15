/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：碰撞分析
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
var earth = top.LayerManagement.earth;

$(function () {
    var projectId = top.SYSTEMPARAMS.project;
    var layer = earth.LayerManager.GetLayerByGUID(projectId);
    var pipeLineLayers = top.SystemSetting.getPipeListByLayer(layer);
    setDivHeight();//设置结果框高度
    var highlightObjectList = [];//不合格需要高亮的管线

    /**
     * 解析查询结果，添加到结果表格中
     * @param result 查询结果
     * @param guid 图层ID
     * @param name 图层名
     */
    var parseResult = function (result, guid, name) {
        var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY",true)' +
            '><td class="col">$INDEX</td><td class="col">$LAYER</td>' +
            '<td title="$HTITLE" class="col $HRED">$HDIST</td>' +
            '<td title="$VTITLE" class="col $VRED">$VDIST</td></tr>';
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
            var thisHClass = "bgNone";
            var thisVClass = "bgNone";
            var thisHTitle = "水平净距符合标准";
            var thisVTitle = "垂直净距符合标准";
            var thisFlag = true;
            if ((parseFloat(records[i].HorizonDistance) >= 0 && parseFloat(records[i].HorizonDistance) < parseFloat(records[i].HorizonISO))) {
                thisFlag = false;
                thisHClass = "bgRed";
                thisHTitle = "水平净距<标准";
            } else if (parseFloat(records[i].HorizonDistance) < 0) {
                thisFlag = false;
                thisHClass = "bgRed";
                thisHTitle = "水平净距为负";
            }
            if ((parseFloat(records[i].VerticalDistance) >= 0 && parseFloat(records[i].VerticalDistance) < parseFloat(records[i].VerticalISO))) {
                thisFlag = false;
                thisVClass = "bgRed";
                thisVTitle = "垂直净距<标准";
            } else if (parseFloat(records[i].VerticalDistance) < 0) {
                thisVTitle = "垂直净距为负";
            }

            $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                .replace("$LAYER", name)
                .replace("$HDIST", parseFloat(records[i].HorizonDistance).toFixed(2) < 0 ? "-" : parseFloat(records[i].HorizonDistance).toFixed(2))
                .replace("$HSTANDARD", parseFloat(records[i].HorizonISO).toFixed(2))
                .replace("$HRED", thisHClass)
                .replace("$VDIST", parseFloat(records[i].VerticalDistance).toFixed(2) < 0 ? "-" : parseFloat(records[i].VerticalDistance).toFixed(2))
                .replace("$VSTANDARD", parseFloat(records[i].VerticalISO).toFixed(2))
                .replace("$VRED", thisVClass)
                .replace("$LayerID", guid)
                .replace("$TYPE", type)
                .replace("$GUID", records[i][top.getNameNoIgnoreCase("US_ID", 1, true)])
                .replace("$KEY", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                .replace("$HTITLE", thisHTitle)
                .replace("$VTITLE", thisVTitle));
            if (!thisFlag) {
                var obj = {};
                obj.layerId = guid;
                obj.type = type;
                obj.guid = records[i][top.getNameNoIgnoreCase("US_ID", 1, true)];
                obj.key = records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)];
                highlightObjectList.push(obj);
            }
        }

        noResult = false;
        $("#importExcelBtn").attr("disabled", false);
        $("#showResult").attr("disabled", false);
        $("#detailData").attr("disabled", false);
        divloaded();
    };
    /**
     * 选取管段点击事件
     */
    $("#btnSelectObject").click(function () {
        if (highlightObjectList.length > 0) {
            analysisShowResult(false, highlightObjectList);
            $("#showResult").attr("checked", false);
        }
        earth.focus();
        analysisSelectObj($("#txtObjId"), $("#btnAnalyze"), $("#txtBufferDist"));
    });
    $("#txtBufferDist").keyup(function () {
        checkNum($("#txtBufferDist")[0], true, 2, null, null);
        if(!parseFloat($("#txtBufferDist").val())){
            $("#btnAnalyze").attr("disabled", true);
        }else{
            if(!obj.selectedObj){
                $("#btnAnalyze").attr("disabled", true);
            }else{
                $("#btnAnalyze").attr("disabled", false);
                AnalysisCreateBufferFromLine(obj.selectedObj, $("#txtBufferDist").val());
            }
        }
    });
    var hasClicked = false;
    $("#btnAnalyze").click(function () {
        var radius = $("#txtBufferDist").val();
        if(!parseFloat(radius)){
            alert("请输入正确的半径");
            return;
        }
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
            $("#showResult").attr("checked", false);
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
            strConn += 0; //燃气编码现在拿不到，暂时统一用0
            urlList.push({"url": strConn, "guid": guid, "name": name});
        });
        sendService(urlList);
    });
    var noResult = true;
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
            }
            earth.DatabaseManager.GetXml(tempArr["url"]);
        }
    }
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "图层", "水平净距", "垂直净距"];
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
    });
});
