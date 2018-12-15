/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：道路统计js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null;
//分页
var pageSize = 3; //每页显示条数
var pageIndex = 1;//页码数（第几页）
var filterCondition = null;
$(function () {
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;

    setGridScrollHeight();
    $("#scrollDivTwo").mCustomScrollbar({});//滚动条

    StatisticsMgr.initPipelineList(projectId, $("#divPipeLineLayersList"));//初始化管线图层列表
    var classResList;
    $("#where").keyup(function(){
        checkFilter($("#where"));
    });
    

    //分页查询数据
    var queryPageData = function(bClickFilter){
        var tabList = $("#tabList");
        tabList.empty();
        var radius=$("#radius").val();
        QueryObject.setRadius(radius);
        QueryObject.getTypeQuery(tabList, "road", filterCondition, projectId, null,pageIndex-1, pageSize, bClickFilter, pagePagination);
    };

    //分页控件
    var pagePagination  = function(totalCount, pageCount){ //
        $("#page").pagination({
            total:totalCount,//总的记录数
            pageSize:pageSize,//每页显示的大小。
            showPageList:false,
            showRefresh:false,
            pageNumber:pageIndex,
            displayMsg:"",
            beforePageText: "",
            afterPageText: pageCount.toString(),
            onSelectPage: function(pageNumber, ps){//选择相应的页码时刷新显示内容列表。
                pageIndex = pageNumber;
                queryPageData(false);
                showSmallPagination("page");
            }
        });
        showSmallPagination("page");
        if(totalCount > 0){
            $("#divPage").show();
        }
        validation();
    }


    $("#radius").keyup(function(){
        checkNum($("#radius")[0], true, 2, 100);
        validation();
        var radiusValue = $("#radius").val();
        QueryObject.setRadius(radiusValue,"road");
    });
    $("#divPipeLineLayersList").click(function(){
        validation();
    });
    $("#tabList").click(function(){
        validation();
    });
    /**
     * 统计
     */
    $("#allAreaBtn").click(function () {
        $('.titleBlue4').css('backgroundColor','#3595e7');
        $('.titleBlue4 li').css('borderColor','#ccc');
        var radius=$("#radius").val();
        var radius=$("#radius").val();
        if(isNaN(radius)||radius<0||radius==""|| radius>100){
            alert("请输入(0-100)的缓冲半径");
            return;
        }
        var road = $(".trbg").html();
        var cc="road,"+road+","+radius;
        QueryObject.QuerySelectedArea("road", projectId, road, function(){
            var cf=["US_PMATER","US_ATTACHMENT"];
            classResList=StatisticsMgr.fieldClassification(thisSpatial,cf,null,null,"道路统计专题图");
            StatisticsMgr.showClassificationResult(classResList, $("#resultDiv"), 3); //显示特征分类汇总结果
            $("#importExcelBtn").attr("disabled", false); //恢复【导出Excel】按钮可用
            $("#sBtn").attr("disabled",false);
            addExportTitle();
            hasData("resultDiv");
        });//统计时定位
        

    });
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
     * 功能：验证是否有checkbox被选中，如果没有任何一个checkbox被选中，则弹出提示信息
     */
    var validation = function () {
        var road = $(".trbg").html();
        var buffRadius = $("#radius").val();
        if ($(":checkbox:checked").length == 0 || road==null || !buffRadius || buffRadius == 0) {
            $("#allAreaBtn").attr("disabled",true);
        }else{
            $("#allAreaBtn").attr("disabled",false);
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
        htmlBal.SetBackgroundAlpha(150);//这里怎么调整为半透明效果呢
        htmlBal.ShowNavigate(newHref);
        earth.Event.OnDocumentReadyCompleted= function () {
            if(htmlBal===null){
                return;
            }
            var jsonStrData = JSON.stringify(classResList);
            setTimeout(function(){htmlBal.InvokeScript("getdata", jsonStrData);},100);
        };
    });


    var hasData = function(divName) {
        if ($("#" + divName).find("tr").length <= 1) {
            alert("分析结果为空");
            earth.ShapeCreator.Clear();
            $("#importExcelBtn").attr("disabled", true); //恢复【导出Excel】按钮可用
            $("#sBtn").attr("disabled", true);
        }
    }

    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var exportExcel=new PageToExcel("exportTab",0,0,"export.xls");//table id , 第几行开始，最后一行颜色 ，保存的文件名
        exportExcel.CreateExcel(false);
        exportExcel.Exec();
    });
    /**
     * 过滤
     */
    $("#btnWhere").click(function () {
        pageIndex = 1;
        filterCondition = $("#where").val();
        queryPageData(true);

        validation();
        $("#radius").removeAttr("disabled");
    }).trigger("click");
    $(window).unload(function () {
        QueryObject.clearBuffer();
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