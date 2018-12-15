/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：附属物查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query; //pagehelper的封装方法
/**
 * 详细信息点击
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

$(function () {
    $("#scrollParamDiv").mCustomScrollbar({});
    var tableName = top.getName("US_ATTACHMENT", 0, true);//要查的附属物的表中属性字段名称
    setGidDivHeight();//给查询结果布局
    earth = top.LayerManagement.earth;
    var spaceParams = null;//空间查询条件
    var projectId = top.SYSTEMPARAMS.project;
    /**
     * 获取当前图层的附属物并且显示在div中
     */
    var getAttach = function () {
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var layer = earth.LayerManager.GetLayerByGUID(guid);
        var layerCode = layer.PipelineType;
        var mQueryString = layer.GISServer + "dataquery?service=" + guid + "&qt=256&fd=" + tableName + "&dt=point";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            $("#btnQueryVal").attr("disabled", false);
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                $("#divPipeLineTypeList").empty();
                var xmlStr = pRes.AttributeName;
                var xmlDoc = top.loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null || !json.ValueRangeResult) {
                    $("#divPipeLineTypeList").html("该图层无附属物");
                    return;
                }
                var values = json.ValueRangeResult.ValueRange.Value;
                //这里要先判断是否是字符串
                if (isArray(values)) {
                    for (var i = 0; i < values.length; i++) {
                        if (values[i]) {
                            $("#divPipeLineTypeList").append('<div class="tableListItem"><label><input type="checkbox" value="' +
                                values[i] + '"/>' +
                                top.getCaptionByCustomValue(layerCode, "Attachment", values[i]) + '</label></div>');
                        }
                    }
                } else {
                    if (values) {
                        $("#divPipeLineTypeList").append('<div class="tableListItem"><label><input type="checkbox" value="' +
                            values + '"/>' +
                            top.getCaptionByCustomValue(layerCode, "Attachment", values) + '</label></div>');
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
    getAttach();

    /**
     * 对几个查询按钮设置禁用
     */
    var btnQueryEnabled = function () {
        var length = $("#divPipeLineTypeList input:checkbox[checked=checked]").length;
        if (length > 0) {
            $("#btnQuery").attr("disabled", false);
            $("#btnCircleSelect").attr("disabled", false);
            $("#btnPolygonSelect").attr("disabled", false);
        } else {
            $("#btnQuery").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonSelect").attr("disabled", true);
        }
    };
    /**
     * 图层checkbox点击事件
     */
    $("#divPipeLineTypeList").click(function () {
        btnQueryEnabled();
    });
    /**
     * 图层切换事件
     */
    $("#selLayers").change(function () {
        $("#divPipeLineTypeList").empty();
        btnQueryEnabled();
    });
    var isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    };
    /**
     * 全部区域
     */
    $("#btnQuery").click(function () {
        earth.ShapeCreator.Clear();
        creatQuery(null);
    });
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
    /**
     * 圆域点击事件
     */
    $("#btnCircleSelect").click(function () {
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 画圆回调
     */
    var onCreateCircle = function (pFeat, geoType) {
        creatQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 构造查询条件然后调用pagehelper.js的方法进行查询
     * @param  {[object]} pFeat [空间查询条件]
     */
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
        var header = ["US_KEY", "US_ATTACHMENT"];
        var aliasHeader = ["编号", "附属物"];
        var queryTableType = [0];
        setTimeout(function () {
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            query.initParams([guid], [name, name], pFeat, strPara, 16, queryTableType, header, aliasHeader);
            spaceParams = pFeat;
            $("#detailData").attr("disabled", false);
            divloaded();
        }, 100);
    };
    /**
     * 查询点击事件
     */
    $("#btnQueryVal").click(function () {
        $("#btnQueryVal").attr("disabled", true);
        $("#divPipeLineTypeList").empty();
        getAttach();
        btnQueryEnabled();
    }).trigger("click");
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
        var pointType = "US_ATTACHMENT";
        QueryObject.paramQueryALL(spaceParams, guid, strPara, 16, 0, null, query.getTotalNum(), standardName, pointType);
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "附属物"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    /**
     * 面板关闭事件
     */
    $(window).unload(function () {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        //关闭页面的时候关闭所有管线的闪烁
        if (query) {
            query.stopHighLight();
        }
        StatisticsMgr.detachShere();
    });
});