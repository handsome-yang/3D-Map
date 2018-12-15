/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：交叉口查询js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
var server = null;
var query;

//分页
var pageSize = 3; //每页显示条数
var pageIndex = 1;//页码数（第几页）
var filterCondition = null;
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
/**
 * 根据各个条件判断对按钮是否禁用
 */
var btnEnabled = function () {
    var road1 = $(".trbg2").html();
    var road2 = $(".trbg").html();
    var buffRadius = $("#radius").val();
    var length = ($("#divPipeLineLayersList input:checkbox[checked=checked]")).length;
    if (length > 0 && road1 != null && road2 != null && buffRadius > 0) {
        $("#btnQuery").attr("disabled", false);
    } else {
        $("#btnQuery").attr("disabled", true);
    }
};
//分页2
var pageIndex2 = 1;//页码数（第几页）

$(function () {
    $("#scrollDivTwo").mCustomScrollbar({});
    var bufPolygon = null;
    setGidDivHeight();
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    var projectLayer = earth.LayerManager.GetLayerByGUID(projectId); //获取项目图层
    StatisticsMgr.initPipelineList(projectId, $("#divPipeLineLayersList")); //初始化管线图层列表
    //分页查询数据
    var queryPageData = function (bClickFilter) {
        var tabList = $("#tabList");
        tabList.empty();
        var tabList2 = $("#tabList2");
        tabList2.empty();
        var radius = $("#radius").val();
        QueryObject.setRadius(radius);
        QueryObject.getTypeQuery(tabList, "road", filterCondition, projectId, 1, pageIndex - 1, pageSize, bClickFilter, pagePagination, pageIndex2 - 1, pagePagination2);
    };

    //分页控件
    var pagePagination = function (totalCount, pageCount) {
        $("#page").pagination({
            total: totalCount,//总的记录数
            pageSize: pageSize,//每页显示的大小。
            showPageList: false,
            showRefresh: false,
            pageNumber: pageIndex,
            displayMsg: "",
            beforePageText: "",
            afterPageText: pageCount.toString(),
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
    };

    //分页控件
    var pagePagination2 = function (totalCount, pageCount, projId) {
        $("#page2").pagination({
            total: totalCount,//总的记录数
            pageSize: pageSize,//每页显示的大小。
            showPageList: false,
            showRefresh: false,
            pageNumber: pageIndex2,
            displayMsg: "",
            beforePageText: "",
            afterPageText: pageCount.toString(),
            onSelectPage: function (pageNumber, ps) {//选择相应的页码时刷新显示内容列表。
                pageIndex2 = pageNumber;
                QueryObject.getRoadCross($(".trbg").html(), projectId, pageIndex2 - 1, pageSize, pagePagination2, false);
                showSmallPagination("page2");
            }
        });
        showSmallPagination("page2");
        if (totalCount > 0) {
            $("#divPage2").show();
        }
    };
    /**
     * 关键字限制输入
     */
    $("#where").keyup(function () {
        checkFilter($("#where"));
    });
    /**
     * 过滤
     */
    $("#btnWhere").click(function () {
        pageIndex = 1;
        pageIndex2 = 1;
        filterCondition = $("#where").val();
        queryPageData(true);
        btnEnabled();
        $("#radius").removeAttr("disabled");
    }).trigger("click");
    /**
     * 第一条道路点击的事件
     */
    $("#tabList").click(function () {
        var road1 = $(".trbg").html();
        var length = ($("#divPipeLineLayersList input:checkbox[checked=checked]")).length;
        if (length > 0 && road1 != null) {
            $("#btnQuery").attr("disabled", false);
        } else {
            $("#btnQuery").attr("disabled", true);
        }
    });
    /**
     * 交叉道路点击事件
     */
    $("#tabList2").click(function () {
        btnEnabled();
    });
    /**
     * 半径框点击
     */
    $("#radius").keyup(function () {
        checkNum($("#radius")[0], true, 2, 100);
        btnEnabled();
        var radiusValue = $("#radius").val();
        QueryObject.setRadius(radiusValue, "road");
    });
    /**
     * 图层点击事件
     */
    $("#divPipeLineLayersList").click(function () {
        btnEnabled();
        $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {
            var vv = $(v);
            server = vv.attr("server");
        });
    });
    /**
     *查询点击事件
     */
    $("#btnQuery").click(function () {
        var radius = $("#radius").val();
        if (isNaN(radius) || radius < 0 || radius == "") {
            alert("请输入0-100缓冲半径");
            return;
        }
        QueryObject.setRadius(radius);
        createQuery();
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
     * 执行查询函数
     */
    var noDataExist = function () {
        $("#dg").datagrid({
            pagination: false
        });
        $('#dg').datagrid('loadData', {total: 0, rows: []});
        divloaded();
    };
    /**
     * 执行查询
     */
    var createQuery = function () {
        divload("dgDiv");
        var road1 = $(".trbg2").text();
        var road2 = $(".trbg").html();
        if (road1 == null) {
            alert("交叉口不可为空!");
            return;
        }
        var bShow = $("#detailData").attr("checked") == "checked";
        var queryTableType = [1, 0];
        var ids = [];
        var names = [];
        $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {//遍历所有图层
            var vv = $(v);
            var guid = vv.val(); // checkbox的value值
            var name = vv.next().text();
            ids.push(guid);
            names.push(name, name);
        });

        var projectName = projectLayer.Name;

        var result = server + "/dataquery?service=road&project=" + projectName + "&pm=('" + road1 + "','" + road2 + "')";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = top.loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    noDataExist();
                    alert("无查询结果");
                    return;
                }

                if (!json.Result) {
                    noDataExist();
                    alert("无查询结果");
                    return;
                }
                var intersects = json.Result.Record;
                if (!intersects || intersects == "undefined") {
                    noDataExist();
                    alert("无查询结果");
                    return;
                }
                if (intersects instanceof Array) {
                    intersects = json.Result.Record[0];
                }

                if (intersects == null) {
                    noDataExist();
                    alert("无查询结果");
                    return;
                }

                var points = intersects.SHAPE.Point.Coordinates;
                var point = points.split(",");
                if (point.length < 3) {
                    noDataExist();
                    alert("无查询结果");
                    return;
                }
                var bufGeoPoints = QueryObject.createBufferFromCircle(point);
                //查询
                var header = ["US_KEY", "US_FEATURE", "layerName"];
                var aliasHeader = ["编号", "类型", "图层"];
                query = Query.PageHelper(earth);
                query.setShow(bShow);
                query.initParams(ids, names, bufGeoPoints, null, 16, queryTableType, header, aliasHeader);
                $("#detailData").attr("disabled", false);
                divloaded();
            }
        }
        earth.DatabaseManager.GetXml(result);
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        $("#importResult>tbody").empty();
        var queryTableType = [1, 0];
        var road1 = $(".trbg2").text();
        var road2 = $(".trbg").html();
        var projectName = projectLayer.Name;
        var standardName = ["INDEX", "DISPLAYTYPE", "LAYER"];
        var result = server + "/dataquery?service=road&project=" + projectName + "&pm=(" + road1 + "," + road2 + ")";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = top.loadXMLStr(xmlStr);
                var json = $.xml2json(xmlDoc);
                if (json == null) {
                    return;
                }
                var intersects = json.Result.Record;
                if (intersects instanceof Array) {
                    intersects = json.Result.Record[0];
                }

                if (intersects == null) {
                    return;
                }

                var points = intersects.SHAPE.Point.Coordinates;
                var point = points.split(",");
                if (point.length < 3) {
                    return;
                }
                var bufGeoPoints = QueryObject.createBufferFromCircle(point);

                $.each($("#divPipeLineLayersList input:checkbox[checked=checked]"), function (i, v) {
                    var vv = $(v);
                    var guid = vv.val(); // checkbox的value值
                    for (var j = 0; j < queryTableType.length; j++) {
                        QueryObject.paramQueryALL(bufGeoPoints, guid, null, 16, queryTableType[j], null, query.getTotalNum(), standardName);
                    }
                });

                var tabObj = $("#importResult>tbody")[0];
                var columns = ["编号", "类型", "图层"];
                StatisticsMgr.importExcelByTable(tabObj, columns);
            }
        }
        earth.DatabaseManager.GetXml(result);
    });
    $(window).unload(function () {
        QueryObject.clearBuffer();
        StatisticsMgr.detachShere();
        //关闭页面的时候关闭所有管线的闪烁
        if (query) {
            query.stopHighLight();
        }
    });
});