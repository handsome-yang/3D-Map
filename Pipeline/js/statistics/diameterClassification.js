/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：管径分类统计js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
$(function () {
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;

    setGridScrollHeight();
    $("#scrollDiv").mCustomScrollbar({});//滚动条

    StatisticsMgr.initPipelineList(projectId, $("#pipeListDiv")); //初始化管线图层列表
    var validation = function () {
        if ($("#pipeListDiv :checkbox:checked").length == 0) {
            $("#allAreaBtn").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#cusAreaBtn").attr("disabled", true);
        } else {
            $("#allAreaBtn").attr("disabled", false);
            $("#btnCircleSelect").attr("disabled", false);
            $("#cusAreaBtn").attr("disabled", false);
        }
    };
    var classResList;
    /**
     * 全部查询
     */
    $("#allAreaBtn").click(function () {
        earth.ShapeCreator.Clear();
        createQuery(null);
        hasData("resultDiv");
    });
    /**
     * 判断是否有结果
     * @param divName 结果div容器的id
     */
    var hasData = function (divName) {
        if ($("#" + divName).find("tr").length <= 1) {
            alert("分析结果为空");
            earth.ShapeCreator.Clear();
            $("#importExcelBtn").attr("disabled", true); //恢复【导出Excel】按钮可用
            $("#sBtn").attr("disabled", true);
        }
    };

    $("#pipeListDiv").click(function () {
        validation();
    });
    /**
     * 多边形点击事件
     */
    $("#cusAreaBtn").click(function () {
        earth.Event.OnCreateGeometry = function (p, t) {
            if (p.Count < 3) {
                return;
            }
            createQuery(p);
            hasData("resultDiv");
            earth.Event.OnCreateGeometry = function () {
            };
        };
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    /**
     * 圆域查询点击事件
     */
    $("#btnCircleSelect").click(function () {
        earth.Event.OnCreateGeometry = function (p, t) {
            createQuery(p);
            hasData("resultDiv");
            earth.Event.OnCreateGeometry = function () {
            };
        };
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 执行统计
     * @param p 绘制图形回调的矢量对象
     */
    var createQuery = function (p) {
        $('.titleBlue4').css('backgroundColor', '#3595e7');
        $('.titleBlue4 li').css('borderColor', '#ccc');
        var field = top.getName("US_SIZE", 1, true);
        classResList = StatisticsMgr.fieldClassification(p, "US_SIZE,1", null, null, "管径分类统计图");
        StatisticsMgr.showClassificationResult(classResList, $("#resultDiv"), 3); //显示特征分类汇总结果
        $("#importExcelBtn").attr("disabled", false); //恢复【导出Excel】按钮可用
        $("#sBtn").attr("disabled", false);
        addExportTitle();
    };
    /**
     * 给导出table加上表头
     */
    var addExportTitle = function () {
        var cols = ["图层", "管径", "数量", "长度(km)"];
        var rangeTable = document.getElementById("exportTab");
        var newTr = rangeTable.insertRow(0);
        newTr.style.display = "none";
        for (var i = 0; i < cols.length; i++) {
            var td = newTr.insertCell();
            td.innerHTML = cols[i];
        }
    };
    /**
     * 统计功能
     */
    var htmlBal = null;
    $("#sBtn").die().live("click", function () {
        clearHtmlBal();
        var href = window.location.href;
        var ary = href.split("/");
        var currentName = ary[ary.length - 1];
        var newHref = href.replace(currentName, "")
        newHref += "chart.html";

        var id = earth.Factory.CreateGuid();
        htmlBal = earth.Factory.CreateHtmlBalloon(id, "统计图");
        var width = 750;
        var leftDis = width / 2 + top.dialogLeft;
        htmlBal.SetScreenLocation(leftDis, 0);
        htmlBal.SetRectSize(width, 480);
        htmlBal.SetIsAddCloseButton(true);
        htmlBal.SetIsAddMargin(true);
        htmlBal.SetBackgroundAlpha(150); //这里怎么调整为半透明效果呢
        htmlBal.ShowNavigate(newHref);
        earth.Event.OnDocumentReadyCompleted = function () {
            var jsonStrData = JSON.stringify(classResList);
            htmlBal.InvokeScript("getdata", jsonStrData);
        };
    });
    /*
     * 清除统计图
     */
    var clearHtmlBal = function () {
        if (htmlBal != null) {
            htmlBal.DestroyObject();
            htmlBal = null;
        }
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var exportExcel = new PageToExcel("exportTab", 0, 0, "export.xls"); //table id , 第几行开始，最后一行颜色 ，保存的文件名
        exportExcel.CreateExcel(false);
        exportExcel.Exec();
    });
    /**
     * 窗口关闭事件
     */
    $(window).unload(function () {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        clearHtmlBal();
    });
});
