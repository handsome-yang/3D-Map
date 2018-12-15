/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：连通分析js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
$(function () {
    earth = top.LayerManagement.earth;
    var layerGUID1 = "";  // 管段所属图层的GUID
    var objGUID1 = "";   // 选中管线的GUID
    var layerGUID2 = "";  // 管段所属图层的GUID
    var objGUID2 = "";   // 选中管线的GUID
    var projectId = top.SYSTEMPARAMS.project;
    var layer = earth.LayerManager.GetLayerByGUID(projectId);
    var pipeLineLayers = top.LayerManagement.getPipeListByLayer(layer);
    setDivHeight();
    /**
     * 第一条管线选取的回调
     */
    var onPickObjectEx1 = function (pObj) {
        layerGUID1 = pObj.GetParentLayerName();
        if (layerGUID1.indexOf("container") > -1) {  // line
            objGUID1 = pObj.GetKey();
            var checkFlag = checkProject(pObj);
            if (!checkFlag) {
                alert("所选管线不属于当前工程，请重新选择");
                return;
            }
            $("#txtObjId1").val(pObj.GetKey());
            pObj.Underground = true;  // SEObjectFlagType.ObjectFlagUnderground
            pObj.ShowHighLight();
            earth.Event.OnPickObjectEx = function () {
            };
            earth.Query.FinishPick();
        } else {
            alert("选择对象为非管段，请重新选择!");
            return false;
        }
        btnAnalyzeEnabled();
    };
    /**
     * 第二条需要分析的管线选取回调事件
     */
    var onPickObjectEx2 = function (pObj) {
        layerGUID2 = pObj.GetParentLayerName();
        if (layerGUID2.indexOf("container") > -1) {  // line
            objGUID2 = pObj.GetKey();
            var checkFlag = checkProject(pObj);
            if (!checkFlag) {
                alert("所选管线不属于当前工程，请重新选择");
                return;
            }
            $("#txtObjId2").val(pObj.GetKey());
            pObj.Underground = true; // SEObjectFlagType.ObjectFlagUnderground
            pObj.ShowHighLight();
            earth.Event.OnPickObjectEx = function () {
            };
            earth.Query.FinishPick();
        } else {
            alert("选择对象为非管段，请重新选择!");
            return false;
        }
        btnAnalyzeEnabled();
    };
    //管段1的值change事件
    $("#txtObjId1").change(function () {
        $("#tblResult>tbody").empty();
        btnAnalyzeEnabled();
    });
    //管段2的值change事件
    $("#txtObjId2").change(function () {
        $("#tblResult>tbody").empty();
        btnAnalyzeEnabled();
    });
    /**
     * 分析按钮仅用于否
     */
    var btnAnalyzeEnabled = function () {
        if (($("#txtObjId1").val() != "") && ($("#txtObjId2").val() != "")) {
            $("#btnAnalyze").attr("disabled", false);
        } else {
            $("#btnAnalyze").attr("disabled", true);
        }
    };
    /**
     * 在搜索的结果集中根据key值确定具体的对象
     * @param searchResult  搜索结果集
     * @param key           对象的US_KEY值
     * @return {*}          返回匹配的对象
     */
    var filterByKey = function (searchResult, key) {
        var obj = null;
        if (searchResult.RecordCount === 0) {
            return null;
        }
        searchResult.GotoPage(0);
        for (var i = 0; i < searchResult.RecordCount; i++) {
            obj = searchResult.GetLocalObject(i);
            if (null == obj) continue;
            if (obj.GetKey() == key) {
                obj.Underground = true; // SEObjectFlagType.ObjectFlagUnderground
//                    obj.SetRenderState(2, -1);   // SERenderStateType.RenderStateDepthBias
                return obj;
            }
        }
        return null;
    };
    /**
     * 解析查询结果，添加到结果表格中
     * @param result 查询结果
     * @param guid 图层ID
     */
    var lineObjArr = [];
    var parseResult = function (result, guid, type) {
        guid = guid.split("=")[1];
        if (result.num <= 0) {
            return;
        }
        var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
            '><td class="col1">$INDEX</td><td class="col2">$DISPLAYTYPE</td></tr>';
        var records = result.Record;
        var displayType = "管线";
        var nameType = 1;
        if (type == "point") {
            displayType = "管点";
            nameType = 0;
        }
        if (result.num <= 0) {
            return;
        } else if (result.num == 1) {//只有一个结果时构造成为数组跟别的一样的解析方式
            records = [records]
        }
        for (var i = 0; i < records.length; i++) {
            $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", nameType, true)])
                .replace("$DISPLAYTYPE", displayType)
                .replace("$LayerID", guid.split("_")[0])
                .replace("$TYPE", type)
                .replace("$GUID", "")
                .replace("$KEY", records[i][top.getNameNoIgnoreCase("US_KEY", nameType, true)]));
            lineObjArr.push({
                layerId: guid.split("_")[0],
                type: type,
                guid: "",
                key: records[i][top.getNameNoIgnoreCase("US_KEY", nameType, true)]
            });
        }
        $("#importExcelBtn").attr("disabled", false);
        $("#showResult").attr("disabled", false);
        $("#detailData").attr("disabled", false);
    };
    /**
     * 重置到初始状态
     */
    var reset = function (n) {
        if (n === 1) {
            layerGUID1 = "";
            objGUID1 = "";
            $("#txtObjId1").val("");
        } else if (n === 2) {
            layerGUID2 = "";
            objGUID2 = "";
            $("#txtObjId2").val("");
        }
    };
    /**
     * 管段1选取按钮点击事件
     */
    $("#btnSelectPipe1").click(function () {
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        reset(1);
        earth.focus();
        earth.Event.OnPickObjectEx = onPickObjectEx1;
        earth.Query.PickObjectEx(24);  // SEPickObjectType.PickAllObject
    });
    /**
     * 管段2选取按钮点击事件
     */
    $("#btnSelectPipe2").click(function () {
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        reset(2);
        earth.focus();
        earth.Event.OnPickObjectEx = onPickObjectEx2;
        earth.Query.PickObjectEx(24);  // SEPickObjectType.PickAllObject
    });
    /**
     * 分析点击事件
     */
    $("#btnAnalyze").click(function () {
        $("#tblResult>tbody").empty();
        clearHighLight();
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        lineObjArr = [];
        $("#showResult").removeAttr("checked");
        if (objGUID1 == "" || objGUID2 == "") {
            return;
        }
        if (layerGUID1 != layerGUID2) {
            alert("管线不在同一个图层!");
            return false;
        }
        divload("tablediv");
        var strConn = earth.LayerManager.GetLayerByGUID(layerGUID1.split("=")[1].split("_")[0]).GISServer +
            "network?rt=connection&service=" + layerGUID1.split("=")[1].split("_")[0];
        strConn += "&aparam=0," + objGUID1 + "," + objGUID2;

        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                $("#tblResult>tbody").empty();
                var json = $.xml2json(xmlDoc);
                if (json == "" || json == null || !json.ConnectionResult) {
                    return;
                }
                result = json.ConnectionResult.PointResult;
                if (json.ConnectionResult.conn === "true") {
                    $("#spanResult").text("连通！");
                } else {
                    $("#spanResult").text("不能连通！");
                }
                parseResult(result, layerGUID1, "point");
                var result = json.ConnectionResult.LineResult;
                parseResult(result, layerGUID1, "line");
                if ("" == $("#tblResult>tbody").text()) {
                    alert("分析结果为空！");
                }
                divloaded();
            }
        }
        earth.DatabaseManager.GetXml(strConn);
    });
    /**
     * 显示结果点击事件
     */
    $("#showResult").click(function () {
        clearHighLight();
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        analysisShowResult(checkTag, lineObjArr);
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
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "类型"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            analysisShowResult(false, lineObjArr);
        }
        StatisticsMgr.detachShere();
        reset();
        clearHighLight();
    });
});