/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：材质查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;//pagehelper.js

$(function () {
    $("#scrollParamDiv").mCustomScrollbar({});
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var spaceParams = null;
    var projectId = top.SYSTEMPARAMS.project;
    /**
     * 根据图层获取到材质
     */
    var getMaterial = function () {
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        $("#divPipeLineTypeList").empty();
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var layerCode = layer.PipelineType;
        var pmater = top.getName("US_PMATER", 1, true);
        var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=256&fd=" + pmater + "&dt=line";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            $("#btnQueryVal").attr("disabled", false);
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = top.loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null || !json.ValueRangeResult) {
                    $("#divPipeLineTypeList").html("查询结果不存在");
                    return;
                }
                var values = json.ValueRangeResult.ValueRange.Value;
                if (values != null) {
                    if (typeof(values) == "string") {
                        $("#divPipeLineTypeList").append('<div class="tableListItem"><label><input type="checkbox" value="' +
                            values + '"/>' +
                            top.getCaptionByCustomValue(layerCode, "MaterialType", values) + '</label></div>');
                    } else if (values instanceof Array) {
                        for (var i = 0; i < values.length; i++) {
                            if (values[i] == 0) continue;
                            values1 = values[i];
                            $("#divPipeLineTypeList").append('<div class="tableListItem"><label><input type="checkbox" value="' +
                                values[i] + '"/>' +
                                top.getCaptionByCustomValue(layerCode, "MaterialType", values1) + '</label></div>');
                        }
                    }
                }
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
            } else {
                $("#divPipeLineTypeList").html("查询结果不存在");
            }
        }
        earth.DatabaseManager.GetXml(mQueryString);
    };
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    $("#btnQueryVal").attr("disabled", true);
    getMaterial();
    /**
     * 获取材质点击事件
     */
    $("#btnQueryVal").click(function () {
        $("btnQueryVal").attr("disabled", true);
        $("#divPipeLineTypeList").empty();
        getMaterial();
        btnQueryEnabled();
    });
    /**
     * 详细信息点击事件
     */
    $("#detailData").click(function () {
        var bShow = $(this).attr("checked") == "checked";
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
        if (query) {
            query.setShow(bShow);
        }
    });
    /**
     * 图层切换事件
     */
    $("#selLayers").change(function () {
        $("#divPipeLineTypeList").empty();
        btnQueryEnabled();
    });
    /**
     * 对按钮的禁用与否
     */
    var btnQueryEnabled = function () {
        var length = $("#divPipeLineTypeList input:checkbox[checked=checked]").length;
        if (length > 0) {
            $("#btnQuery").attr("disabled", false);
            $("#btnCircleSelect").attr("disabled", false);
            $("#btnPolygonRegion").attr("disabled", false);
        } else {
            $("#btnQuery").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonRegion").attr("disabled", true);
        }
    };
    /**
     * 材质点击事件
     */
    $("#divPipeLineTypeList").click(function () {
        btnQueryEnabled();
    });

    /**
     * 查询点击事件
     */
    $("#btnQuery").click(function () {
        earth.ShapeCreator.Clear();
        creatQuery(null);
    });
    /**
     * 多边形查询
     */
    $("#btnPolygonRegion").click(function () {
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
    /**
     * 画圆点击事件
     */
    $("#btnCircleSelect").click(function () {
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 画圆回调事件
     */
    var onCreateCircle = function (pFeat) {
        creatQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 构造查询条件进行查询
     * @param  {[object]} pFeat [空间查询条件]
     */
    var creatQuery = function (pFeat) {
        divload("dgDiv");
        var bShow = $("#detailData").attr("checked") == "checked";
        var strPara = "";
        var pmater = top.getName("US_PMATER", 1, true);
        $("#divPipeLineTypeList input:checkbox[checked=checked]").each(function (i, v) {
            strPara += "(or,equal," + pmater + "," + "'" + $(v).val() + "'" + ")";
        });
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var name = vv.text();
        //查询
        var header = ["US_KEY", "US_PMATER"];
        var aliasHeader = ["编号", "材质"];
        setTimeout(function () {
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            query.initParams([guid], [name, name], pFeat, strPara, 16, [1], header, aliasHeader);
            spaceParams = pFeat;
            $("#detailData").attr("disabled", false);
            divloaded();
        }, 100)

    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var strPara = "";
        var pmater = top.getName("US_PMATER", 1, true);
        $("#divPipeLineTypeList input:checkbox[checked=checked]").each(function (i, v) {
            strPara += "(or,equal," + pmater + "," + $(v).val() + ")";
        });
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var standardName = ["INDEX", "US_PMATER"];
        QueryObject.paramQueryALL(spaceParams, guid, strPara, 16, 1, null, query.getTotalNum(), standardName);
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "材质"];
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