/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：埋设统计js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
$(function () {
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;

    setGridScrollHeight();
    $("#scrollDiv").mCustomScrollbar({});//滚动条

    StatisticsMgr.initPipelineList(projectId, $("#pipeListDiv"));//初始化管线图层列表
    var validation = function () {
        var startDate = $("#startDate").val();
        var endDate = $("#endDate").val();
        if ($("#pipeListDiv :checkbox:checked").length == 0||startDate==""||endDate=="") {
            $("#allAreaBtn").attr("disabled",true);
            $("#btnCircleSelect").attr("disabled",true);
            $("#cusAreaBtn").attr("disabled",true);
        }else{
            $("#allAreaBtn").attr("disabled",false);
            $("#btnCircleSelect").attr("disabled",false);
            $("#cusAreaBtn").attr("disabled",false);
        }
    };
    var classResList;
    $("#pipeListDiv").click(function(){
        validation();
    });
    $("#startDate").focus(function(){
        validation();
    });
    $("#endDate").focus(function(){
        validation();
    });
    /**
     * 功能：【整体区域】按钮onclick事件
     */
    $("#allAreaBtn").click(function () {
        earth.ShapeCreator.Clear();
        createQuery(null);
        $("#sBtn").attr("disabled",false);
        hasData("resultDiv");
    });

    var hasData = function(divName) {
        if ($("#" + divName).find("tr").length <= 1) {
            alert("统计结果为空");
            earth.ShapeCreator.Clear();
            $("#importExcelBtn").attr("disabled", true); //恢复【导出Excel】按钮可用
            $("#sBtn").attr("disabled", true);
        }
    }
    /**
     * 多边形查询
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
     * 圆域查询
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
    var getDaysInMonth = function(year,month){//根据年月获取当月日期
        month = parseInt(month,10)+1;
        var temp = new Date(year+"/"+month+"/0");
        return temp.getDate();
    }
    var createQuery=function(p){
        $('.titleBlue4').css('backgroundColor','#3595e7');
        $('.titleBlue4 li').css('borderColor','#ccc');
        var startDate = $("#startDate").val();
        var endDate = $("#endDate").val();
        if(parseFloat(startDate)>parseFloat(endDate)){
            alert("起始时间不得大于结束时间.");
            return;
        }

        startDate = startDate + "-01";
        var timeArr = endDate.split("-");
        var monthDays = getDaysInMonth(timeArr[0],timeArr[1])
        endDate = endDate + "-" +monthDays;

        var us_bd_time = top.getName("US_BD_TIME", 1, true);
        var obj = {"field":"US_BD_TIME", "bTime":startDate, "eTime":endDate};
        var filter="(and,greaterequal," +us_bd_time+","+startDate+")(and,lessequal,"+us_bd_time+","+endDate+")";
        var cf=["US_PMATER","US_ATTACHMENT"];
        classResList=StatisticsMgr.fieldClassification(p,cf,filter,null,"埋设统计图",obj);
        StatisticsMgr.showClassificationResult(classResList, $("#resultDiv"), 3); //显示特征分类汇总结果
        $("#importExcelBtn").attr("disabled", false); //恢复【导出Excel】按钮可用
        $("#sBtn").attr("disabled",false);
        addExportTitle();
    };
    var addExportTitle=function(){
        var cols=["图层","类型","数量","长度(km)"];
        var rangeTable = document.getElementById("exportTab");
        var newTr=rangeTable.insertRow(0);
        newTr.style.display="none";
        for(var i=0;i<cols.length;i++){
            var td=newTr.insertCell();
            td.innerHTML=cols[i];
        }
    };
    /**
     * 统计功能
     */
    var htmlBal =null;
    $("#sBtn").die().live("click",function(){
        clearHtmlBal();
        var href = window.location.href;
        var ary = href.split("/");
        var currentName = ary[ary.length - 1];
        var newHref = href.replace(currentName,"")
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
        htmlBal.SetBackgroundAlpha(150);//这里怎么调整为半透明效果呢
        htmlBal.ShowNavigate(newHref);
        earth.Event.OnDocumentReadyCompleted= function () {
            if(htmlBal===null){
                return;
            }
            var jsonStrData = JSON.stringify(classResList);
            htmlBal.InvokeScript("getdata", jsonStrData);
        };
        /* earth.Event.OnHtmlBalloonFinished= function () {
         htmlBal.DestroyObject();
         earth.Event.OnHtmlBalloonFinished= function () {};
         };*/
    });

    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var exportExcel=new PageToExcel("exportTab",0,0,"export.xls");//table id , 第几行开始，最后一行颜色 ，保存的文件名
        exportExcel.CreateExcel(false);
        exportExcel.Exec();
    });
    $(window).unload(function () {
        if(earth.ShapeCreator!=null){
            earth.ShapeCreator.Clear();
        }
        clearHtmlBal();
    });
    /*
     * 清除统计图页面
     */
    var clearHtmlBal=function(){
        if (htmlBal != null) {
            htmlBal.DestroyObject();
            htmlBal = null;
        }
    };
});