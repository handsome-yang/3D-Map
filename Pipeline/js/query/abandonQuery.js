/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：废弃查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;//查询对象

$(function () {
    $("#scrollDiv").mCustomScrollbar({});
    setGidDivHeight();//初始化大小
    earth = top.LayerManagement.earth;
    var spaceParams = null;//空间查询条件
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表
    /**
     * 给各个按钮设置禁用状态
     */
    var btnQueryEnabled = function () {
        var length = ($("#divPipeLineLayersList input:checkbox[checked=checked]")).length;
        if (length > 0) {
            $("#btnCircleSelect").attr("disabled", false);
            $("#btnPolygonSelect").attr("disabled", false);
            $("#btnQuery").attr("disabled", false);
        } else {
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonSelect").attr("disabled", true);
            $("#btnQuery").attr("disabled", true);
        }
    };
    /**
     * 图层check点击事件
     */
    $("#divPipeLineLayersList").click(function () {
        btnQueryEnabled();
    });
    /**
     * 全部点击事件
     */
    $("#btnQuery").click(function () {
        earth.ShapeCreator.Clear();
        createQuery(null);
    });
    /**
     * 详细信息点击事件
     */
    $("#detailData").click(function () {
        bShow = $(this).attr("checked") == "checked";
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        } else {
            query.setShow(bShow);
        }
    });
    /**
     * 圆域点击事件
     */
    $("#btnCircleSelect").click(function () {
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 圆绘制回调事件
     * @param pFeat   空间矢量对象
     * @param geoType
     */
    var onCreateCircle = function (pFeat) {
        createQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    $("#btnPolygonSelect").click(function () {
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    var onCreatePolygon = function (pFeat) {
        if (pFeat.Count < 3) {
            alert("无效的多边形");
            return false;
        }
        createQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    var createQuery = function (pFeat) {
        divload("dgDiv");
        var bShow = $("#detailData").attr("checked") == "checked";
        var usStatus = top.getName("US_STATUS", 1, true);
        //从valueconfig.map中根据 废弃 找对应的值
        var statueType = top.getStatusType("废弃", false);
        var filter = "(and,equal," + usStatus + "," + "'" + statueType + "'" + ")";
        var ids = [];
        var queryTableType = [1];
        var layerNames = [];
        $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {
            var vv = $(v);
            var guid = vv.val();  // checkbox的value值
            var name = vv.next().text();
            ids.push(guid);
            layerNames.push(name, name);
        });
        //查询
        var header = ["US_KEY", "US_STATUS", "layerName"];
        var aliasHeader = ["编号", "废弃", "图层"];
        setTimeout(function () {
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            query.initParams(ids, layerNames, pFeat, filter, 16, queryTableType, header, aliasHeader);
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
        var standardName = ["INDEX", "US_STATUS", "LAYER"];
        $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {
            var vv = $(v);
            var guid = vv.val();  // checkbox的value值
            var queryTableType = [1];
            var usStatus = top.getName("US_STATUS", 1, true);
            //从valueconfig.map中根据 废弃 找对应的值
            var statueType = top.getStatusType("废弃", false);
            var filter = "(and,equal," + usStatus + "," + statueType + ")";
            for (var j = 0; j < queryTableType.length; j++) {
                QueryObject.paramQueryALL(spaceParams, guid, filter, 16, queryTableType[j], null, query.getTotalNum(), standardName);
            }
        });
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "废弃", "图层"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });

    $(window).unload(function () {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        //关闭页面的时候关闭所有管线的闪烁
        if (query) {
            query.stopHighLight();
            query.clearSearchResult();
        }
        StatisticsMgr.detachShere();
    });
})
;