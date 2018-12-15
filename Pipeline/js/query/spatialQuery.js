/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月7日
 * 描    述：空间查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query = null;

$(function () {
    /**
     * 画圆回调函数
     * @param pFeat 返回的矢量几何对象
     * @param geoType 返回的几何对象类型
     */
    var onCreateCircle = function (pFeat, geoType) {
        createQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 画多边形回调函数
     * @param pFeat 返回的vector3s对象
     * @param geoType 返回的几何对象类型
     */
    var onCreatePolygon = function (pFeat, geoType) {
        if (pFeat.Count < 3) {
            alert("无效的多边形");
            return false;
        }
        createQuery(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 通过构造条件查询
     * @param pFeat 空间条件
     */
    var createQuery = function (pFeat) {
        divload("dgDiv");
        var bShow = $("#detailData").attr("checked");
        spaceParams = pFeat;
        var ids = [];
        var layerNames = [];
        var queryTableType = [1, 0];

        for (var i = 0; i < $("#divPipeLineLayersList input:checkbox[checked=checked]").length; i++) {
            var vv = $($("#divPipeLineLayersList input:checkbox[checked=checked]")[i]);
            var guid = vv.val();  // checkbox的value值
            ids.push(guid);
            var name = vv.next().text();
            layerNames.push(name, name);
        }
        //查询
        var header = ["US_KEY", "US_FEATURE", "layerName"];
        var aliasHeader = ["编号", "类型", "图层"];
        /*
         经调试发现,此方法采取顺序执行 反复递归时会导致IE未响应卡住，且后台查询方法为直接获取数据不是异步故采用延时器加遮罩层的形式增加用户体验
         */
        setTimeout(function () {
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            query.initParams(ids, layerNames, pFeat, null, 16, queryTableType, header, aliasHeader);
            var data = $('#dg').datagrid('getRows');
            $("#detailData").attr("disabled", false);
            divloaded();
        }, 1000);
    };
    /**
     * 根据有没有图层对查询等按钮禁用与否
     */
    var btnEnabled = function () {
        var length = ($("#divPipeLineLayersList input:checkbox[checked=checked]")).length;
        $("#btnCircleSelect").attr("disabled", false);
        $("#btnPolygonSelect").attr("disabled", false);
        if (length > 0) {
            $("#detailData").attr("disabled", false);
        } else {
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonSelect").attr("disabled", true);
            $("#detailData").attr("disabled", true);
        }
    };
    setGidDivHeight();//布局
    earth = top.LayerManagement.earth;
    var spaceParams = null;
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表
    $("#scrollDiv").mCustomScrollbar({});
    /**
     * 图层点击事件
     */
    $("#divPipeLineLayersList").click(function () {
        btnEnabled();
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
     * 圆域点击事件
     */
    $("#btnCircleSelect").click(function () {
        $("#detailData").removeAttr("checked");
        $("#detailData").attr("disabled", "disabled");
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 多边形点击事件
     */
    $("#btnPolygonSelect").click(function () {
        $("#detailData").removeAttr("checked");
        $("#detailData").attr("disabled", "disabled");
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var standardName = ["INDEX", "DISPLAYTYPE", "LAYER"];
        $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {
            var vv = $(v);
            var guid = vv.val();  // checkbox的value值
            var queryTableType = [1, 0];
            for (var j = 0; j < queryTableType.length; j++) {
                QueryObject.paramQueryALL(spaceParams, guid, null, 16, queryTableType[j], null, query.getTotalNum(), standardName);
            }
        });
        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "类型", "图层"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });
    $(window).unload(function () {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        StatisticsMgr.detachShere();
        //关闭页面的时候关闭所有管线的闪烁
        if (query) {
            query.stopHighLight();
        }
    });
});
