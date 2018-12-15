/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：道路查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var query;
var pageSize = 3; //每页显示条数
var pageIndex = 1;//页码数（第几页）
var filterCondition = null;
$("#detailData").click(function () {
    var bShow = $(this).attr("checked") == "checked";
    if (!bShow) {
        top.LayerManagement.clearHtmlBalloons();
    }
    if (query) {
        query.setShow(bShow);
    }
});
$('#radius').bind('paste', function (e) {
    var pastedText = undefined;
    if (window.clipboardData && window.clipboardData.getData) { // IE
        pastedText = window.clipboardData.getData('Text');
    } else {
        pastedText = e.originalEvent.clipboardData.getData('Text');
    }

    if (isNaN(pastedText)) {
        alert("请输入正确的数值");
        return false;
    } else {
        return true;
    }
});
var btnEnabled = function () {
    var roadName = $(".trbg").html();//道路
    var length = ($("#divPipeLineLayersList input:checkbox[checked=checked]")).length;
    var buffRadius = $("#radius").val();
    if (length > 0 && roadName != null && buffRadius > 0) {
        $("#btnQuery").attr("disabled", false);
        $("#detailData").attr("disabled", false);
    } else {
        $("#btnQuery").attr("disabled", true);
        $("#detailData").attr("disabled", true);
    }
};

$(function () {
    $("#scrollDivTwo").mCustomScrollbar({});

    setGidDivHeight();

    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    StatisticsMgr.initPipelineList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表
    /**
     * 关键字限制输入
     */
    $("#where").keyup(function () {
        checkFilter($("#where"));
    });


    //分页查询数据
    var queryPageData = function (bClickFilter) {
        var tabList = $("#tabList");
        tabList.empty();
        var radius = $("#radius").val();
        QueryObject.setRadius(radius);
        QueryObject.getTypeQuery(tabList, "road", filterCondition, projectId, null, pageIndex - 1, pageSize, bClickFilter, pagePagination);
    }

    //分页控件
    var pagePagination = function (totalCount, pageCount) { //
        $("#page").pagination({
            total: totalCount,//总的记录数
            pageSize: pageSize,//每页显示的大小。
            showPageList: false,
            showRefresh: false,
            displayMsg: "",
            beforePageText: "",
            afterPageText: "" + pageCount,
            onSelectPage: function (pageNumber, ps) {//选择相应的页码时刷新显示内容列表。
                pageIndex = pageNumber;
                queryPageData(false);
                showSmallPagination("page");
            }
        });
        showSmallPagination("page");
        if (totalCount > 0) {
            $("#divPage").show();
        }
        btnEnabled();
    }
    /**
     * 图层checkbox点击事件,主要是根据有没有选择图层去禁用按钮
     */
    $("#divPipeLineLayersList").click(function () {
        btnEnabled();
    });
    /**
     * 道路点击事件,对按钮进行禁用与否
     */
    $("#tabList").click(function () {
        btnEnabled();
    });
    /**
     * 过滤
     */
    $("#btnWhere").click(function () {
        pageIndex = 1;
        filterCondition = $("#where").val();
        queryPageData(true);
        btnEnabled();
        $("#radius").removeAttr("disabled");
    }).trigger("click");
    /**
     * 对输入半径的控制,输入半径后改变query.js里面的半径,以便定位
     */
    $("#radius").keyup(function () {
        checkNum($("#radius")[0], true, 2, 100);
        var radiusValue = $("#radius").val();
        btnEnabled();
        QueryObject.setRadius(radiusValue, "road");
    });
    /**
     *查询
     */
    $("#btnQuery").click(function () {
        var radius = $("#radius").val();
        if (isNaN(radius) || radius < 0 || radius == "" || radius > 100) {
            alert("请输入(0-100)的缓冲半径");
            return;
        }
        QueryObject.setRadius(radius);
        createQuery();
    });

    /**
     * 执行查询函数
     */
    var createQuery = function () {
        divload("dgDiv")
        var bShow = $("#detailData").attr("checked") == "checked";
        var radius = $("#radius").val(); //半径
        var roadName = $(".trbg").html();//道路
        var compoundCondition = "road," + roadName + "," + radius;
        var queryTableType = [1, 0];
        var ids = [];
        var names = [];
        $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {
            var vv = $(v);
            var guid = vv.val();  // checkbox的value值
            ids.push(guid);
            var name = vv.next().text();
            names.push(name, name);
        });
        QueryObject.QuerySelectedArea("road", projectId, roadName, function () {
            //查询
            var header = ["US_KEY", "US_FEATURE", "layerName"];
            var aliasHeader = ["编号", "类型", "图层"];
            query = Query.PageHelper(earth);
            query.setShow(bShow);
            query.initParams(ids, names, thisSpatial, null, 16, queryTableType, header, aliasHeader);
            $("#detailData").attr("disabled", false);
            divloaded();
        });//查询时定位


    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var radius = $("#radius").val(); //半径
        var roadName = $(".trbg").html();//道路
        var compoundCondition = "road," + roadName + "," + radius;
        var queryTableType = [1, 0];
        var standardName = ["INDEX", "DISPLAYTYPE", "LAYER"];
        $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {
            var vv = $(v);
            var guid = vv.val();  // checkbox的value值
            for (var j = 0; j < queryTableType.length; j++) {
                QueryObject.paramQueryALL(null, guid, null, 16, queryTableType[j], compoundCondition, query.getTotalNum(), standardName);
            }
        });

        var tabObj = $("#importResult>tbody")[0];
        var columns = ["编号", "类型", "图层"];
        StatisticsMgr.importExcelByTable(tabObj, columns);
    });

    $(window).unload(function () {
        QueryObject.clearBuffer();
        //关闭页面的时候关闭所有管线的闪烁
        if (query) {
            query.stopHighLight();
        }
        StatisticsMgr.detachShere();
    });
});