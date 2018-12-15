/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：预警分析js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var projectId = top.SYSTEMPARAMS.project;
earth = top.LayerManagement.earth;
setDivHeight();

$(function () {
    StatisticsMgr.initPipelineSelectList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表
    /**
     * 图层切换事件
     */
    $("#divPipeLineLayersList").change(function () {
        $("#tblResult>tbody").empty();
        $("#showResult").removeAttr("checked");
    });
    $("#divPipeLineLayersList").trigger("change");
    /**
     * 分析点击事件
     */
    $("#btnAnalyze").click(function () {
        divload("tablediv");
        clearHighLight();
        $("#tblResult>tbody").empty();
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        lineObjArr = [];
        $("#showResult").removeAttr("checked");
        $("#tblResult>tbody").empty();
        var layeId = $("#divPipeLineLayersList").val();
        var layer = earth.LayerManager.GetLayerByGUID(layeId);
        var layerName = layer.Name;
        var server = $("#divPipeLineLayersList").find("option:selected").attr("server");
        //报废年限
        var jgTime = parseInt($("#year").val());
        var now = new Date();
        //当前系统时间
        var year = now.getFullYear();
        var bTime = parseInt(year) + jgTime;
        var beginTime = bTime + "-01-01";
        var endTime = bTime + "-12-31";
        var conStr = server + "pipeline?rt=life&service=" + layeId + "&year1=" + beginTime + "&year2=" + endTime;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                parseResult(xmlDoc, layeId, layerName);
            }
            divloaded();
        }
        earth.DatabaseManager.GetXml(conStr);
    });
    /**
     * 年限控制输入
     */
    $("#year").keyup(function () {
        checkNum($("#year")[0], true, 0, 100);
        if (!$("#year").val()) {
            $("#btnAnalyze").attr("disabled", true);
        } else {
            $("#btnAnalyze").attr("disabled", false);
        }
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "类型", "图层"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    /**
     * 显示结果点击事件
     */
    $("#showResult").click(function () {
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
    $(window).unload(function () {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            analysisShowResult(false, lineObjArr);
        }
        clearHighLight();
    });
});
var lineObjArr = [];//需要高亮的对象集合
/**
 * 解析查询结果，添加到结果表格中
 * @param result 查询结果
 * @param guid 图层ID
 * @param name 图层名
 */
var parseResult = function (result, guid, name) {
    var json = $.xml2json(result);
    if (json == null || !json.LifeMgrResult.Result) {
        alert("数据服务出错!");
        return;
    }
    if (json.LifeMgrResult.count == 0 || json.LifeMgrResult.TotalLength <= 0) {
        alert("没有需要预警的数据!");
        return;
    }
    var type = "line";
    var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
        '><td class="col">$INDEX</td><td class="col">$YEAR</td><td class="col">$DEFINEYEAR</td></tr>';

    var bdTimeField = top.getName("US_BD_TIME", 1, true);

    var uskeyField = top.getName("US_KEY", 1, true);
    var us_PMATER = top.getName("US_PMATER", 1, true);
    var useYear;
    //获取数据
    var res = json.LifeMgrResult.Pipeline;
    if (!res) {
        alert("无分析结果");
        return;
    }
    if (!res.length) {//只有一个结果，构造为数组方便后面解析
        res = [res];
    }
    for (var i = 0; i < res.length; i++) {
        var disBDTime = res[i][bdTimeField];
        disBDTime = disBDTime.substring(0, 10);
        disBDTime = disBDTime.replace(/-/g, "/");
        //材质类型
        var materialType = res[i][us_PMATER];
        //使用年限
        if (!useYear) {
            useYear = top.getUseYear(materialType);
        }
        lineObjArr.push({layerId: guid, type: type, guid: "", key: res[i][uskeyField]});
        $("#tblResult>tbody").append(template.replace("$INDEX", res[i][uskeyField])
            .replace("$YEAR", disBDTime)
            .replace("$DEFINEYEAR", useYear)
            .replace("$LayerID", guid)
            .replace("$TYPE", type)
            .replace("$GUID", "")
            .replace("$KEY", res[i][uskeyField]));
    }
    $("#importExcelBtn").attr("disabled", false);
    $("#showResult").attr("disabled", false);
    $("#detailData").attr("disabled", false);
};
//创建时间格式处理，精准到月
//支持"2011.09"这样的格式 2014.1.18
function timeCheck(time, year, month) {
    var month1 = parseInt(year * 12) + parseInt(month);
    var month2;
    if (time.length > 4) {
        var time1 = time.split("/");
        var time2 = time.split("-");
        var time3 = time.split("年");
        var time4 = time.split(".");
        if (time1.length > 1) {  //2013/11/11
            month2 = parseInt(time1[0] * 12) + parseInt(time1[1]);
        } else if (time2.length > 1) { //2013-11-11
            month2 = parseInt(time2[0] * 12) + parseInt(time2[1]);
        } else if (time3.length > 1) {  //2013年11月11日r
            var timeMonth = time3[1].split("月");
            month2 = parseInt(time3[0] * 12) + parseInt(timeMonth[0]);
        } else if (time4.length > 1) {
            month2 = parseInt(time4[0] * 12) + parseInt(time4[1].substring(0, 2));
            //alert(parseInt(time4[1].substring(0,1));
        }
    } else {  //2013
        month2 = parseInt(time) * 12;
    }
    return Math.abs(month1 - month2);
}

function checkYear(time) {
    var month2;
    if (time.length > 4) {
        var time1 = time.split("/");
        var time2 = time.split("-");
        var time3 = time.split("年");
        var time4 = time.split(".");
        if (time1.length > 1) {  //2013/11/11
            month2 = time1[0] + "." + time1[1];
        } else if (time2.length > 1) { //2013-11-11
            month2 = time2[0] + "." + time2[1];
        } else if (time3.length > 1) {  //2013年11月11日r
            var timeMonth = time3[1].split("月");
            month2 = time3[0] + "." + timeMonth[0];
        } else if (time4.length > 1) {
            month2 = time4[0] + "." + time4[1].substring(0, 2);
        }
    }
    return month2;
}
/**
 *解析从服务器返回数据,插入valueRangeResultList
 */
function parseValueRangeResult(data, layerId) {
    var json = $.xml2json(data);
    if (json == null || !json.ValueRangeResult) {
        return;
    }
    var valueRangeResult = json.ValueRangeResult.ValueRange.Value;
    $("#valueRangeResultList").children().remove();
    for (var i = 0; i < valueRangeResult.length; i++) {
        if (valueRangeResult[i] != 0) {
            var valueRangeResult1 = StatisticsMgr.getValueByCode("AttachmentCode", valueRangeResult[i]);
            $("#valueRangeResultList").append('<div><label><input type="checkbox" value="' +
                valueRangeResult[i] + '">' +
                valueRangeResult1 + '</label></div>');
        }
    }
}
var btnAnalyzeEnabled = function () {
    var length = ($("#valueRangeResultList input:checkbox[checked=checked]")).length;
    var value1 = $("#longitude").val();
    var value2 = $("#latitude").val();
    if (length > 0 && (value1 && value1 != "0.00") && (value2 && value2 != "0.00")) {
        $("#btnAnalyze").attr("disabled", false);
    } else {
        $("#btnAnalyze").attr("disabled", true);
    }
};