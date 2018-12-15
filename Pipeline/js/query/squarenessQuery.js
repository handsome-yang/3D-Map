/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：管径查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;//pagehelper.js文件

$(function () {
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var spaceParams = null;
    var strPara = "";
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    $("select#selLayers").trigger("change");
    $("select#selConditionWidth").change(function (event) {
        btnEnabled();
    });
    /**
     * 方管、圆管切换
     */
    $("select#selTypes").change(function () {
        var layerType = $("select#selTypes").val();
        if (layerType == "0") {//圆管
            $("#labWidth").text("管径:");
            $("#txtWidth1").hide();
            $("#selConditionWidth").show();
            $("#txtWidth").show();
            $("#textHeightTr").css("visibility", "hidden");
        } else {//方管
            $("#labWidth").html("宽度:");
            $("#selConditionWidth").hide();
            $("#txtWidth").hide();
            $("#txtWidth1").show();
            $("#textHeightTr").css("visibility", "visible");
        }
        btnEnabled();
    });
    /**
     * 对查询等按钮控制
     */
    var btnEnabled = function () {
        var height = $("#txtHeight").val();
        var layerType = $("select#selTypes").val();
        var boolwh = null;
        if (layerType == "0") {//圆管
            var width = $("#txtWidth").val();
            boolwh = (width != "" && Number(width) >= 0);
        } else {//方管
            var width = $("#txtWidth1").val();
            boolwh = parseFloat(width) > 0 && parseFloat(height) > 0;
        }
        if (boolwh) {
            $("#btnAllRegionSelect").attr("disabled", false);
            $("#btnCircleSelect").attr("disabled", false);
            $("#btnPolygonRegion").attr("disabled", false);
        } else {
            $("#btnAllRegionSelect").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonRegion").attr("disabled", true);
        }

    };
    $("#txtWidth").keyup(function () {
        btnEnabled();
    });
    $("#txtWidth1").keyup(function () {
        btnEnabled();
    });
    $("#txtHeight").keyup(function () {
        btnEnabled();
    });
    /**
     * 查询点击事件
     */
    $("#btnAllRegionSelect").click(function () {
        earth.ShapeCreator.Clear();
        creatQuery(null);
    });
    /**
     * 多边形点击事件
     */
    $("#btnPolygonRegion").click(function () {
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
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
     * 画多边形回调函数
     */
    var onCreatePolygon = function (pFeat) {
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
     * 画圆回调事件
     */
    var onCreateCircle = function (pFeat, geoType) {
        creatQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 执行查询事件
     * @param pFeat  空间查询条件
     */
    var creatQuery = function (pFeat) {
        var usSize = top.getName("US_SIZE", 1, true);
        var bShow = $("#detailData").attr("checked") == "checked";
        var layerType = $("select#selTypes").val();
        if (layerType == "0") {//圆管
            strPara = "(and," +
                $("#selConditionWidth option:selected").val() + "," + usSize + "," + $("#txtWidth").val() + ")";
        } else {//方管
            strPara = "(and," +
                "equal" + "," + usSize + "," + ($("#txtWidth1").val() + "X" + $("#txtHeight").val()) + ")(or,equal," + usSize + "," + $("#txtWidth").val() + "*" + $("#txtHeight").val() + ")";
        }
        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var name = vv.text();
        //查询
        var layerType = $("select#selTypes").val();
        var header = "";
        var aliasHeader = "";
        if (layerType == "0") {//圆管
            header = ["US_KEY", "US_SIZE"];
            aliasHeader = ["编号", "管径"];
        } else {//方管
            header = ["US_KEY", "US_SIZE"];
            aliasHeader = ["编号", "管径"];
        }

        query = Query.PageHelper(earth);
        query.setShow(bShow);
        query.initParams([guid], [name, name], pFeat, strPara, 16, [1], header, aliasHeader);
        spaceParams = pFeat;
        $("#detailData").attr("disabled", false);
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();

        var vv = $("#selLayers option:selected");
        var guid = vv.val();
        var standardName = ["INDEX", "US_SIZE"];
        QueryObject.paramQueryALL(spaceParams, guid, strPara, 16, 1, null, query.getTotalNum(), standardName);
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "管径"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
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