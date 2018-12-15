/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：权属查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;//pagehelper.js封装对象

$(function () {
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    $("#queryValBtn").attr("disabled", true);
    var vv = $("#selLayers option:selected");
    var guid = vv.val();
    getOwner(guid);
    $("#queryValBtn").attr("disabled", false);
    $("#queryValBtn").click(function () {
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        getOwner(guid);
    });

    $("#txtKeyword").keyup(function () {
        if ($.trim($("#txtKeyword").val()) != "") {
            $("#btnQuery").attr("disabled", false);
            $("#detailData").attr("disabled", false);
        } else {
            $("#btnQuery").attr("disabled", true);
            $("#detailData").attr("disabled", true);
        }
    });
    $("#detailData").click(function () {
        var bShow = $(this).attr("checked") == "checked";
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
        if (query) {
            query.setShow(bShow);
        }
    });

    var divList = document.getElementById("selOwner");
    $("#selLayers").change(function () {
        while(divList.hasChildNodes())
        {
            divList.removeChild(divList.firstChild);
        }
    });

    $("#btnQuery").click(function () {
        divload("tablediv");
        var bShow = $("#detailData").attr("checked") == "checked";
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var name = vv.text();
        //暂时只查询管线...
        var onwerStr = top.getName("US_OWNER", 1, true);
        var filter = "(and,eq," + onwerStr + "," + "'" + $("#selOwner").val() + "'" + ")";
        var queryTableType = [1];
        //查询
        var header = ["US_KEY", "US_FEATURE"];
        var aliasHeader = ["编号", "类型"];
        setTimeout(function () {
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            query.initParams([guid], [name, name], null, filter, 16, queryTableType, header, aliasHeader);
            $("#detailData").attr("disabled", false);
            divloaded();
        }, 100);
    });

    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var onwerStr = top.getName("US_OWNER", 1, true);
        var filter = "(or,equal," + onwerStr + "," + $("#selOwner").val() + ")";
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var queryTableType = [1];
        var standardName = ["INDEX", "DISPLAYTYPE"];
        for (var i = 0; i < queryTableType.length; i++) {
            QueryObject.paramQueryALL(null, guid, filter, 16, queryTableType[i], null, query.getTotalNum(), standardName);
        }
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "类型"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        StatisticsMgr.detachShere();
        //关闭页面的时候关闭所有管线的闪烁
        if (query) {
            query.stopHighLight();
        }
    });
});
/**
 * 获取权属单位
 * @param  {[string]} guid [图层guid]
 */
var getOwner = function (guid) {
    $("#selOwner").empty();
    var layer = earth.LayerManager.GetLayerByGUID(guid);
    var onwerStr = top.getName("US_OWNER", 1, true);
    var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=256&fd=" + onwerStr + "&dt=line";
    earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
        if (pRes.ExcuteType == top.SystemSetting.excuteType) {
            var xmlStr = pRes.AttributeName;
            var xmlDoc = top.loadXMLStr(xmlStr);
            parseResult2(xmlDoc, guid);
        }
    }
    earth.DatabaseManager.GetXml(mQueryString);
};
/**
 * 解析查询的权属单位结果
 * @param  {[type]} data    [xml字符串]
 * @param  {[string]} layerId [图层guid]
 * @return {[type]}         [description]
 */
var parseResult2 = function (data, layerId) {
    var json = $.xml2json(data);
    if (json == null || !json.ValueRangeResult) {
        return;
    }
    var values = json.ValueRangeResult.ValueRange.Value;
    if (typeof values == "string") {
        var value = top.getCaptionByCustomValue(null, "Ownership", values);
        ;
        $("#selOwner").append('<option value="' +
            values + '" server="' + value + '" title="' + value + '">' +
            value + '</option>');
    } else if (values instanceof Array) {
        for (var i = 0; i < values.length; i++) {
            var value = top.getCaptionByCustomValue(null, "Ownership", values[i]);
            $("#selOwner").append('<option value="' +
                values[i] + '" server="' + value + '" title="' + value + '">' +
                value + '</option>');
        }
    }
};