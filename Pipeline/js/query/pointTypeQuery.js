/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：特征查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;
$('div.enter').bind("selectstart", function () {
    return false;
});
//document.onselectstart = new Function('event.returnValue=false;');

$("div.enter").mouseenter(function () {//mouseover mouseenter
    document.onselectstart = new Function('event.returnValue=false;');
});

$("div.enter").mouseleave(function () {//mouseout mouseleave
    document.onselectstart = new Function('event.returnValue=true;');
});
$("#detailData").click(function () {
    var bShow = $(this).attr("checked") == "checked";
    //alert(bShow);
    if (!bShow) {
        top.LayerManagement.clearHtmlBalloons();
    }
    if (query) {
        query.setShow(bShow);
    }
});

$(function () {
    $("#scrollParamDiv").mCustomScrollbar({});
    var tableName = top.getName("US_PT_TYPE", 0, true);
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var spaceParams = null;
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    var isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    /**
     * 发送异步请求，查询管线图层中所有的子类型
     * @param queryURL
     */
    var parseResult2 = function (data, layerId, layerCode) {
        var json = $.xml2json(data);
        if (json == null || !json.ValueRangeResult) {
            return;
        }
        var values = json.ValueRangeResult.ValueRange.Value;
        var valueDis = null;
        if (isArray(values)) {

            for (var i = 0; i < values.length; i++) {
                valueDis = top.getCaptionByCustomValue(layerCode, "PointType", values[i]);
                if (valueDis) {
                    $("#divPipeLineTypeList").append('<div class="tableListItem"><label><input type="checkbox" value="' +
                        values[i] + '"/>' + valueDis + '</label></div>');
                }

            }
        } else if (values) {
            valueDis = top.getCaptionByCustomValue(layerCode, "PointType", values);
            if (valueDis) {
                $("#divPipeLineTypeList").append('<div class="tableListItem"><label><input type="checkbox" value="' +
                    values + '"/>' + valueDis + '</label></div>');
            }

        }
    };
    /**
     * 获取图层的所有特征类型
     * @param guid  图层的GUID
     */
    var getPointType = function (guid) {

    };

    var selectChange = function () {
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        $("#divPipeLineTypeList").empty();
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var layerCode = layer.PipeLineType;
        var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=256&fd=" + tableName + "&dt=point";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            $("#btnQueryVal").attr("disabled", false);
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = top.loadXMLStr(xmlStr);
                parseResult2(xmlDoc, guid, layerCode);
                var length = $("#divPipeLineTypeList input:checkbox").length;
                if (length > 0) {
                    $("#btnSelectAll").attr("disabled", false);
                    $("#btnSelectReverse").attr("disabled", false);
                    $("#btnSelectNone").attr("disabled", false);
                } else {
                    $("#btnSelectAll").attr("disabled", true);
                    $("#btnSelectReverse").attr("disabled", true);
                    $("#btnSelectNone").attr("disabled", true);
                }
            }else{
                $("#divPipeLineTypeList").html("查询结果不存在");
            }
        }
        earth.DatabaseManager.GetXml(mQueryString);
    };
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    selectChange();
    $("#btnQueryVal").click(function () {
        $("#btnQueryVal").attr("disabled", true);
        $("#divPipeLineTypeList").empty();
        selectChange();
        btnQueryEnabled();
    });
    $("#selLayers").change(function () {
        $("#divPipeLineTypeList").empty();
        btnQueryEnabled();
    });
    var btnQueryEnabled = function () {
        var length = $("#divPipeLineTypeList input:checkbox[checked=checked]").length;
        if (length > 0) {
            $("#btnQuery").attr("disabled", false);
            $("#btnCircleSelect").attr("disabled", false);
            $("#btnPolygonSelect").attr("disabled", false);
            //$("#importExcelBtn").attr("disabled", false);
        } else {
            $("#btnQuery").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonSelect").attr("disabled", true);
            //$("#importExcelBtn").attr("disabled", true);
        }
    };
    $("#divPipeLineTypeList").click(function () {
        btnQueryEnabled();
    });
    $("#btnSelectAll").click(function () {
        $("#divPipeLineTypeList input:checkbox").attr("checked", "checked");
        btnQueryEnabled();
    });
    $("#btnSelectReverse").click(function () {
        $.each($("#divPipeLineTypeList input:checkbox"), function (i, v) {
            var vv = $(v);
            if (vv.attr("checked")) {
                vv.removeAttr("checked");
            } else {
                vv.attr("checked", "checked");
            }
        });
        btnQueryEnabled();
    });
    $("#btnSelectNone").click(function () {
        $("#divPipeLineTypeList input:checkbox").removeAttr("checked");
        btnQueryEnabled();
    });
    /**
     * 全部查询
     */
    $("#btnQuery").click(function () {
        earth.ShapeCreator.Clear();
        creatQuery(null);
    });
    /**
     * 圆域查询
     */
    $("#btnCircleSelect").click(function () {
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 圆域查询回调函数
     * @param pFeat
     * @param geoType
     */
    var onCreateCircle = function (pFeat, geoType) {
        creatQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 多边形查询
     */
    $("#btnPolygonSelect").click(function () {
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    /**
     * 画多边形回调函数
     * @param pFeat
     * @param geoType
     */
    var onCreatePolygon = function (pFeat, geoType) {
        if (pFeat.Count < 3) {
            alert("无效的多边形");
            return false;
        }
        creatQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    var creatQuery = function (pFeat) {
        divload("tablediv");
        var bShow = $("#detailData").attr("checked") == "checked";
        var strPara = "";
        $("#divPipeLineTypeList input:checkbox[checked=checked]").each(function (i, v) {
            strPara += "(or,equal," + tableName + "," + "'" + $(v).val() + "'" + ")";
        });
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var name = vv.text();
        //查询
        var header = ["US_KEY", "US_PT_TYPE"];
        var aliasHeader = ["编号", "特征"];
        /*
         经调试发现,此方法采取顺序执行 反复递归时会导致IE未响应卡住，且后台查询方法为直接获取数据不是异步故采用延时器加遮罩层的形式增加用户体验
         */
        setTimeout(function () {
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            query.initParams([guid], [name, name], pFeat, strPara, 16, [0], header, aliasHeader);
            spaceParams = pFeat;
            $("#detailData").attr("disabled", false);
            divloaded();
        }, 100);
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var strPara = "";
        $("#divPipeLineTypeList input:checkbox[checked=checked]").each(function (i, v) {
            strPara += "(or,equal," + tableName + "," + $(v).val() + ")";
        });
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var standardName = ["INDEX", "DISPLAYTYPE"];
        QueryObject.paramQueryALL(spaceParams, guid, strPara, 16, 0, null, query.getTotalNum(), standardName);
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "特征"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        if (earth.ShapeCreator) {
            earth.ShapeCreator.Clear();
        }
        //关闭页面的时候关闭所有管线的闪烁
        if (query) {
            query.stopHighLight();
        }
        StatisticsMgr.detachShere();
    });
});
