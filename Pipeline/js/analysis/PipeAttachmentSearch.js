/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：设施搜索js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var projectId = top.SYSTEMPARAMS.project;
earth = top.LayerManagement.earth;
;
var datum = top.SYSTEMPARAMS.pipeDatum;
var bufPolygon = null;//缓冲区生成的对象
var bDist = true;
setDivHeight();

$(function () {
    $("#scrollParamDiv").mCustomScrollbar({});
    /**
     * 获取附属物
     */
    var getAttach = function () {
        $("#valueRangeResultList").empty();
        var serviceName = $("#divPipeLineLayersList").val();
        var server = $("#divPipeLineLayersList").find("option:selected").attr("server");
        var dataType = "point";
        var mFieldName = top.getName("US_ATTACHMENT", 0, true);
        var strConn = server + "dataquery?service=" + serviceName + "&qt=256&fd=" + mFieldName + "&dt=" + dataType;
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            $("#queryBtn").attr("disabled", false);
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                parseValueRangeResult(xmlDoc, serviceName);
            } else {
                $("#valueRangeResultList").html("查询结果不存在");
            }
        };
        earth.DatabaseManager.GetXml(strConn);
    };
    StatisticsMgr.initPipelineSelectList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表
    getAttach();
    btnAnalyzeEnabled();
    /**
     * 绘制范围点击事件
     */
    $("#selectBtn").click(function () {
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        $("#tblResult>tbody").empty();
        earth.ShapeCreator.Clear();
        clearBuffer(0);
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 半径输入框限制并且重新绘制缓冲面
     */
    $("#txtBufferDist").keyup(function () {
        checkNum($("#txtBufferDist")[0], true, 2, 10000);
        btnAnalyzeEnabled();
        clearBuffer();
        var radius = $("#txtBufferDist").val();
        if (top.regExpValidation.test(radius)) {
            bDist = true;
            if ($("#tblResult>tbody")[0].innerHTML) {
                createBufferFromLine(mVec, radius, true);
                greenCircle();
            } else {
                createBufferFromLine(mVec, radius, true, true);
            }
        }
    });
    /**
     * 间隔输入框限制输入,并且在输入的时候实时控制三维球的显示
     */
    $("#BufferDist").keyup(function () {
        checkNum($("#BufferDist")[0], true, 2, 10000);
        btnAnalyzeEnabled();
        clearBuffer();
        var radius = parseFloat($("#txtBufferDist").val());
        createBufferFromLine(mVec, radius, true);
        greenCircle();
    });
    /**
     * 附属物checkbox点击事件
     */
    $("#valueRangeResultList").click(function () {
        btnAnalyzeEnabled();
    });
    /**
     * 图层切换时间
     */
    $("#divPipeLineLayersList").change(function () {
        $("#valueRangeResultList").empty();
        btnAnalyzeEnabled();
    });
    /**
     * 分析点击事件
     */
    $("#queryBtn").click(function () {
        $("#queryBtn").attr("disabled", true);
        $("#valueRangeResultList").empty();
        $("#txtBufferDist").val(0);
        $("#BufferDist").val(10);
        $("#tblResult>tbody").empty();
        $("#showResult").removeAttr("checked");
        $("#importExcelBtn").attr("disabled", true);
        $("#showResult").attr("disabled", true);
        $("#detailData").attr("disabled", true);
        clearBuffer();
        getAttach();
        $("#txtBufferDist").attr("disabled", true);
        btnAnalyzeEnabled();
    });
    /**
     * 分析点击事件
     */
    $("#btnAnalyze").click(function () {
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        lineObjArr = [];
        $("#showResult").removeAttr("checked");
        if (bufPolygon == null) {
            return;
        }
        divload("tablediv");
        $("#tblResult>tbody").empty();
        var layeId = $("#divPipeLineLayersList").val();
        var layer = earth.LayerManager.GetLayerByGUID(layeId);
        var layerName = layer.Name;
        var server = $("#divPipeLineLayersList").find("option:selected").attr("server");
        var strParaAttr = "";
        var US_ATTACHMENT = top.getName("US_ATTACHMENT", 0, true);
        $("#valueRangeResultList input:checkbox[checked=checked]").each(function (i, v) {
            strParaAttr += "(or,equal," + US_ATTACHMENT + ",";
            strParaAttr += $(v).val();
            strParaAttr += ")";
        });
        if (strParaAttr == "") return;
        var strParaSpat = "(3,0,";
        strParaSpat += $("#txtBufferDist").val() + ",";
        strParaSpat += mVec.X + "," + mVec.Y;
        strParaSpat += ")";
        var queryType = 17;
        var dataType = 'point';
        var conStr = server + "dataquery?service=" + layeId + "&qt=" + queryType.toString() + "&dt=" + dataType.toString();
        conStr = conStr + "&pc=" + strParaAttr;
        conStr = conStr + "&sc=" + strParaSpat;
        conStr = conStr + "&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                parseResult(xmlDoc, layeId, layerName);
                if ("" == $("#tblResult>tbody").text()) {
                    alert("分析结果为空！");
                }
            }
            divloaded();
        };
        earth.DatabaseManager.GetXml(conStr);
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "类型", "距离"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    //显示结果
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
        if (checkTag) {//如果显示结果是勾选的,则先取消勾选
            analysisShowResult(false, lineObjArr);
        }
        StatisticsMgr.detachShere();
        clearBuffer();
        clearHighLight();
    });
});
/**
 * 清除生成的缓冲区对象
 */
var clearBuffer = function (tag) {
    if (bufPolygon != null) {
        earth.DetachObject(bufPolygon);
        bufPolygon = null;
    }
    for (var i = 0; i < bufferArr.length; i++) {
        earth.DetachObject(bufferArr[i]);
    }

    for (var s = 0; s < bufferDisk.length; s++) {
        earth.DetachObject(bufferDisk[s]);

    }
    bufferArr = [];
    bufferDisk = [];
};
var bufferArr = [];
var bufferDisk = [];
/**
 * 绘制缓冲区
 * @param center  中间点坐标
 * @param radius  缓冲区半径
 * @param bDist   是否是间隔圆
 * @param fillcolorTag  是否有填充色
 * @param lineColor     线颜色
 */
var createBufferFromLine = function (center, radius, bDist, fillcolorTag, lineColor) {
    if (bufferArr.length > 0) {
        for (var i = 0; i < bufferArr.length; i++) {
            bufferArr[i].BeginUpdate();
            bufferArr[i].FillStyle.FillColor = parseInt(0x00ffffff);
            bufferArr[i].EndUpdate();
        }
    }
    if (center != null) {
        var guid = earth.Factory.CreateGuid();
        bufPolygon = earth.Factory.CreateElementCircle(guid, "circle");
        var tran = bufPolygon.SphericalTransform;
        tran.SetLocationEx(center.X, center.Y, center.Z);
        bufPolygon.BeginUpdate();

        if (fillcolorTag) {
            bufPolygon.FillStyle.FillColor = parseInt(0x2500FF00);
        } else {
            bufPolygon.FillStyle.FillColor = parseInt(0x00ffffff);
        }
        bufPolygon.Radius = radius;
        var fillstyle = bufPolygon.FillStyle;
        if (bDist) {
            bufPolygon.LineStyle.LineColor = parseInt(0xccff0000);
        } else {
            if (lineColor) {
                bufPolygon.LineStyle.LineColor = lineColor;
            } else {
                bufPolygon.LineStyle.LineColor = parseInt(0xcc009900);
            }
        }
        bufPolygon.AltitudeType = 1;
        bufPolygon.EndUpdate();
        earth.AttachObject(bufPolygon);
        if (bDist) {
            bufferArr.push(bufPolygon);
        } else {
            bufferDisk.push(bufPolygon);
        }
    }
};

var mVec = null;//绘制范围的中心点经纬度坐标
var mVecXYZ = null;//绘制范围的中心点平面坐标
/**
 *创建点回调函数，根据点位置初始化输入框
 */
var onCreateCircle = function (pObj) {
    earth.ShapeCreator.Clear();
    $("#txtBufferDist").val(pObj.Radius.toFixed(2));
    var radius = parseFloat($("#txtBufferDist").val());
    var radius1 = parseFloat($("#BufferDist").val());
    if (isNaN(radius) && isNaN(radius1)) {
        alert("请把半径设为数字");
    }
    mVec = earth.Factory.CreateVector3();
    mVec.X = pObj.Longitude;
    mVec.Y = pObj.Latitude;
    mVec.Z = pObj.Altitude;
    mVecXYZ = datum.des_BLH_to_src_xy(mVec.X, mVec.Y, mVec.Z);
    createBufferFromLine(mVec, radius, true, true);
    $("#txtBufferDist").removeAttr("disabled");
    btnAnalyzeEnabled();
};
/**
 * 绘制间隔圆
 */
var greenCircle = function () {
    var radius0 = parseFloat($("#txtBufferDist").val());
    var radius1 = parseFloat($("#BufferDist").val());
    var circleCount = parseInt(radius0 / radius1);
    if (radius0 >= radius1) {
        bDist = false;
        for (var i = 0; i < circleCount; i++) {
            var bGreen = i % 2 == 0 ? parseInt(0xcc009900) : parseInt(0xccffff00);
            var radius = radius1 * (i + 1);
            createBufferFromLine(mVec, radius, false, null, bGreen);
        }
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
            obj.Underground = true;
            return obj;
        }
    }
    return null;
};


var lineObjArr = [];
/**
 * 解析查询结果，添加到结果表格中
 * @param result 查询结果
 * @param guid 图层ID
 * @param name 图层名
 */
var parseResult = function (result, guid, name) {
    $("#dgDiv thead").show();
    var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
        '><td class="col">$INDEX</td><td class="col">$DISPLAYTYPE</td><td class="col">$DISTANCE</td></tr>';
    var json = $.xml2json(result);
    if (json == null || !json.Result) {
        return;
    }
    var type = json.Result.geometry;
    var displayType = type === "point" ? "管点" : "管线";
    type = type === "point" ? "point" : "line";
    var records = json.Result.Record;
    var layerObj = earth.LayerManager.GetLayerByGUID(guid);
    var layerCode = layerObj.PipeLineType;
    if (json.Result.num <= 0) {
        return;
    } else if (json.Result.num == 1) {
        records = [records];
    }
    greenCircle();
    for (var i = 0; i < records.length; i++) {
        var distance = 0;
        var Coordinates = records[i].SHAPE.Point.OriginalCoordinates;
        var coord = Coordinates.split(" ");
        var coordinate1 = coord[0].split(",");
        if (coordinate1.length > 2) {
            distance = parseFloat(Math.sqrt((coordinate1[0] - mVecXYZ.X) * (coordinate1[0] - mVecXYZ.X) + (coordinate1[1] - mVecXYZ.Y) * (coordinate1[1] - mVecXYZ.Y))).toFixed(3);
        }
        records[i].distance = distance;
    }
    records.sort(function (a, b) {
        return parseFloat(a.distance) > parseFloat(b.distance) ? 1 : -1;
    });

    for (var i = 0; i < records.length; i++) {
        lineObjArr.push({
            layerId: guid,
            type: type,
            guid: records[i][top.getName("US_ID", 0, true)],
            key: records[i][top.getName("US_KEY", 0, true)]
        });
        var valueRangeResult1 = records[i][top.getName("US_ATTACHMENT", 0, true)];
        $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getName("US_KEY", 0, true)])
            .replace("$DISPLAYTYPE", top.getCaptionByCustomValue(layerCode, "Attachment", valueRangeResult1))
            .replace("$LayerID", guid)
            .replace("$TYPE", type)
            .replace("$GUID", records[i][top.getName("US_ID", 0, true)])
            .replace("$KEY", records[i][top.getName("US_KEY", 0, true)])
            .replace("$DISTANCE", records[i].distance));
    }
    $("#tblResult").resize();
    $("#importExcelBtn").attr("disabled", false);
    $("#showResult").attr("disabled", false);
    $("#detailData").attr("disabled", false);
};
/**
 *解析从服务器返回数据,插入valueRangeResultList
 */
function parseValueRangeResult(data, layerId) {
    var json = $.xml2json(data);
    if (json == null || !json.ValueRangeResult) {
        $("#valueRangeResultList").html("查询结果不存在");
        return;
    }
    var cLayer = earth.LayerManager.GetLayerByGUID(layerId);
    var layerCode = cLayer.PipeLineType;
    var valueRangeResult = json.ValueRangeResult.ValueRange.Value;
    $("#valueRangeResultList").children().remove();
    if (!(valueRangeResult instanceof Array)) {//只有一个结果时，结果为对象转换为数组与数组统一处理
        valueRangeResult = [valueRangeResult];
    }
    for (var i = 0; i < valueRangeResult.length; i++) {
        if (valueRangeResult[i] != 0) {
            $("#valueRangeResultList").append('<div class="tableListItem"><label><input type="checkbox" value="' +
                valueRangeResult[i] + '">' +
                top.getCaptionByCustomValue(layerCode, "Attachment", valueRangeResult[i]) + '</label></div>');
        }
    }
    if ($("#valueRangeResultList").children().length > 0) {
        $("#selectDiv").removeAttr("disabled");
    } else {
        $("#selectDiv").attr("disabled", "disabled");
    }
}
/**
 * 通过各个条件判断分析按钮是否可用
 */
var btnAnalyzeEnabled = function () {
    var length = ($("#valueRangeResultList input:checkbox[checked=checked]")).length;
    var value1 = $("#txtBufferDist").val();
    var value2 = $("#BufferDist").val();
    if (length > 0 && top.regExpValidation.test(value1) && top.regExpValidation.test(value2)) {
        $("#btnAnalyze").attr("disabled", false);
    } else {
        $("#btnAnalyze").attr("disabled", true);
    }
};
