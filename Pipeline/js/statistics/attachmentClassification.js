/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：附属物统计js文件
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 **************************************************/
var earth = null;
$(function() {
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    setGridScrollHeight();
    $("#scrollDiv").mCustomScrollbar({});//滚动条

    /**
     * 功能：验证是否有checkbox被选中，如果没有任何一个checkbox被选中，则弹出提示信息
     */
    var validation = function() {
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
    StatisticsMgr.initPipelineList(projectId, $("#pipeListDiv")); //初始化管线图层列表
    var classResList;
    /**
     * 全部查询
     */
    $("#allAreaBtn").click(function() {
        earth.ShapeCreator.Clear();
        createQuery(null);
        hasData("resultDiv");
    });

    var hasData = function(divName) {
        if ($("#" + divName).find("tr").length <= 1) {
            alert("分析结果为空");
            earth.ShapeCreator.Clear();
            $("#importExcelBtn").attr("disabled", true); //恢复【导出Excel】按钮可用
            $("#sBtn").attr("disabled", true);
        }
    }

    $("#pipeListDiv").click(function() {
        validation();
    })
    /**
     * 多边形查询
     */
    $("#cusAreaBtn").click(function() {
        earth.Event.OnCreateGeometry = function(p, t) {
            if (p.Count < 3) {
                return;
            }
            createQuery(p);
            hasData("resultDiv");
            earth.Event.OnCreateGeometry = function() {};
        };
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolygon();
    });
    /**
     * 圆域查询
     */
    $("#btnCircleSelect").click(function() {
        earth.Event.OnCreateGeometry = function(p, t) {
            createQuery(p);
            hasData("resultDiv");
            earth.Event.OnCreateGeometry = function() {};
        };
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     *  执行统计方法
     * @param p 绘制图形回调返回的空间对象
     */
    var createQuery = function(p) {
        $('.titleBlue3').css('backgroundColor','#3595e7');
        $('.titleBlue3 li').css('borderColor','#ccc');
        classResList = StatisticsMgr.fieldClassification(p, "US_ATTACHMENT,0", null, null, "附属物分类统计图");
        StatisticsMgr.showClassificationResult(classResList, $("#resultDiv"), 2); //显示特征分类汇总结果
        $("#importExcelBtn").attr("disabled", false); //恢复【导出Excel】按钮可用
        $("#sBtn").attr("disabled", false);
        addExportTitle();
    };
    /**
     * 给结果table加上表头
     */
    var addExportTitle = function() {
        var cols = ["图层", "点性质", "点数"];
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
    $("#sBtn").die().live("click", function() {
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
        htmlBal.SetRectSize(width,480);
        htmlBal.SetIsAddCloseButton(true);
        htmlBal.SetIsAddMargin(true);
        //htmlBal.SetIsTransparence(true);
        htmlBal.SetBackgroundAlpha(150); //这里怎么调整为半透明效果呢
        htmlBal.ShowNavigate(newHref);
        earth.Event.OnDocumentReadyCompleted  = function() {
            if (htmlBal === null) {
                return;
            }
            var jsonStrData = JSON.stringify(classResList);
            htmlBal.InvokeScript("getdata", jsonStrData);
        };
        /*earth.Event.OnHtmlBalloonFinished= function () {
         htmlBal.DestroyObject();
         earth.Event.OnHtmlBalloonFinished= function () {};
         };*/
    });
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function() {
        var exportExcel = new PageToExcel("exportTab", 0, 0, "export.xls"); //table id , 第几行开始，最后一行颜色 ，保存的文件名
        exportExcel.CreateExcel(false);
        exportExcel.Exec();
    });

    $(window).unload(function() {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        clearHtmlBal();
    });
    /*
     * 清除统计图页面
     */
    var clearHtmlBal = function() {
        if (htmlBal != null) {
            htmlBal.DestroyObject();
            htmlBal = null;
        }
    };
});
