/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：管径分段js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var earth = null; //地球对象
var allDiameterRangeList = []; //管线图层的管径统计范围的缓存列表
var lastLayerId = null;
var allResult = null;//管径分类统计结果
$(function(){
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;

    setGridScrollHeight();
    $("#twoUlLeft,#twoUlRight").mCustomScrollbar({});//滚动条
    /**
     * 功能："项目"下拉列表的onchange事件
     */
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表

    $("#confirmBtn").click(function(){
        if($("#selLayers").val() != lastLayerId){
            lastLayerId = $("#selLayers").val();
            showDiameterRangeList();
        }else{
            return;
        }
    }).trigger("click");
    $("#selLayers").change(function () {
        $("#diameterRangeDiv").empty();
        allResult = null;
    });
    /**
     * 功能：管径范围列表的onclick事件
     */
    $("#diameterRangeDiv").click(function(){
        var rangeTable = $("#diameterRangeDiv table");
        if(rangeTable.length == 0){
            return;
        }
        var selectIndex = rangeTable[0].selectIndex;
        if(selectIndex != null){ //是否一行管径范围被选中
            $("#addRowBtn").removeAttr("disabled");
            $("#upLimitBtn").removeAttr("disabled");
            $("#downLimitBtn").removeAttr("disabled");
        }
    });

    /**
     * 功能：统计范围列表的onclick事件
     */
    $("#statisticsListTab").click(function(){
        $("#deleteRowBtn").removeAttr("disabled");
        $("#upLimitBtn").removeAttr("disabled");
        $("#downLimitBtn").removeAttr("disabled");
    });

    function enabledBtn(){
        var rangeTable = $("#statisticsListTab");
        if(rangeTable[0].rows.length != 0){ //如果统计范围被全部删除，则【删除行】按钮不可用
            $("#statisticsBtn").removeAttr("disabled");
            $("#btnCircleSelect").removeAttr("disabled");
            $("#btnPolygonSelect").removeAttr("disabled");
        }

    };

    /**
     * 功能：【上限】按钮onclick事件
     */
    $("#upLimitBtn").click(function(){
        var rangeTable = $("#diameterRangeDiv table");
        var selectIndex = rangeTable[0].selectIndex;
        var rangeValue = rangeTable[0].rows[selectIndex].cells[0].innerHTML;
        var statTable = $("#statisticsListTab");
        var selectedStatRow = statTable[0].selectIndex;
        if(selectedStatRow == null){ //如果统计列表没有任何一行被选中，则添加一行数据
            var minValue = rangeTable[0].rows[0].cells[0].innerHTML;
            StatisticsMgr.appendStatisticsRangeRow(minValue, rangeValue, statTable, true);
        }else{ //如果选中一行统计信息，则修改上限值
            statTable[0].rows[selectedStatRow].cells[1].innerHTML = rangeValue;  //修改上限值
        }
        enabledBtn();
    });


    /**
     * 功能：【下限】按钮onclick事件
     */
    $("#downLimitBtn").click(function(){
        var rangeTable = $("#diameterRangeDiv table");
        var selectIndex = rangeTable[0].selectIndex;
        var rangeValue = rangeTable[0].rows[selectIndex].cells[0].innerHTML;

        var statTable = $("#statisticsListTab");
        var selectedStatRow = statTable[0].selectIndex;
        if(selectedStatRow == null){ //如果统计列表没有任何一行被选中，则添加一行数据
            var rowsNum = rangeTable[0].rows.length;
            var maxValue = rangeTable[0].rows[rowsNum-1].cells[0].innerHTML;
            StatisticsMgr.appendStatisticsRangeRow(rangeValue, maxValue, statTable, true);
        }else{ //如果选中一行统计信息，则修改下限值
            statTable[0].rows[selectedStatRow].cells[0].innerHTML = rangeValue;  //修改下限值
        }
        enabledBtn();
    });

    /**
     * 功能：【添加行】按钮onclick事件
     */
    $("#addRowBtn").click(function(){
        var rangeTable = $("#diameterRangeDiv table");
        var rowsNum = rangeTable[0].rows.length;
        var maxValue = rangeTable[0].rows[rowsNum-1].cells[0].innerHTML;
        var minValue = rangeTable[0].rows[0].cells[0].innerHTML;
        StatisticsMgr.appendStatisticsRangeRow(minValue, maxValue, $("#statisticsListTab"), true);
        enabledBtn();
    });

    /**
     * 功能：【删除行】按钮onclick事件
     */
    $("#deleteRowBtn").click(function(){
        var rangeTable = $("#statisticsListTab");
        var selectIndex = rangeTable[0].selectIndex;
        rangeTable[0].deleteRow(selectIndex);
        if(rangeTable[0].rows.length == 0){ //如果统计范围被全部删除，则【删除行】按钮不可用
            $("#deleteRowBtn").attr("disabled", true);
            $("#statisticsBtn").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonSelect").attr("disabled", true);
            rangeTable[0].selectIndex = null;
            return;
        }
        if(selectIndex >= rangeTable[0].rows.length){ //如果被删除的为最后一行，则选择第一行
            selectIndex = 0;
        }
        StatisticsMgr.selectSingleRow(rangeTable[0].rows[selectIndex].cells[0]); //选中下一行
    });

    /**
     * 全部统计
     */
    $("#statisticsBtn").click(function(){
        var checkValue = checkRangeValue();
        if(!checkValue){
            return;
        }
        earth.ShapeCreator.Clear();
        diameterStatistics(null);
    });
    /**
     * 圆域查询
     */
    $("#btnCircleSelect").click(function () {
        var checkValue = checkRangeValue();
        if(!checkValue){
            return;
        }
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });
    /**
     * 圆域查询回调函数
     * @param pFeat
     * @param geoType
     */
    var onCreateCircle = function (pFeat, geoType) {
        diameterStatistics(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };

    /**
     * 多边形查询
     */
    $("#btnPolygonSelect").click(function () {
        var checkValue = checkRangeValue();
        if(!checkValue){
            return;
        }
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
        diameterStatistics(pFeat);
        earth.Event.OnCreateGeometry = function () {
        };
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function(){
        var exportExcel=new PageToExcel("exportTab",0,0,"export.xls");//table id , 第几行开始，最后一行颜色 ，保存的文件名
        exportExcel.CreateExcel(false);
        exportExcel.Exec();
    });

    /**
     * 统计功能
     */
    $("#statistics").click(function(){
        var params = {
            gAltList : groundAltList,
            pAltList:pipeLineAltList,
            minL : minLength,
            maxL: maxLength,
            minG:minGroundAltitude,
            maxG:maxGroundAltitude,
            minP:minPipeLineAltitude,
            maxP:maxPipeLineAltitude
        };
        openDialog("javascript_chart_logarithmic_axis.htm", params, 1060, 700);
    });
    var checkUpDownValue=function(){
        var rangeTable = $("#statisticsListTab")[0];
        for(var i=0; i<rangeTable.rows.length; i++){
            var downValue = rangeTable.rows[i].cells[0].innerHTML;
            var upValue = rangeTable.rows[i].cells[1].innerHTML;
            if(downValue==""||upValue==""||isNaN(upValue)||isNaN(downValue)){
                alert("上限或者下限值输入不正确.");
                return false;
            }else if(parseFloat(downValue) > parseFloat(upValue)){
                alert("上限必须大于或者等于下限值.");
                return false;
            }
        }
        return true;
    }
    var checkRangeValue = function(){//判断统计范围是否合格
        if(!checkUpDownValue()) return false;

        //判断统计范围中是否有重复范围
        var rangeTableRows = $("#statisticsListTab")[0].rows;
        for (var i = 0; i < rangeTableRows.length; i++) {
            for (var j = 0; j < rangeTableRows.length; j++) {
                if(i == j){
                    continue;
                }
                if(rangeTableRows[i].innerText === rangeTableRows[j].innerText){
                    alert("统计范围有重复");
                    return false;
                }
            }
        }
        return true;
    };
    /**
     * 功能：管径分段统计功能代码
     */
    var diameterStatistics = function(pFeat){
        divload("tablediv");
        setTimeout(function(){},20000);
        $('.titleBlue4').css('backgroundColor','#3595e7');
        $('.titleBlue4 li').css('borderColor','#ccc');
        classResList = [];
        var rangeTable = $("#statisticsListTab")[0];
        //要传递到chart统计的数据
        var layers = [];
        var fields = [{dataType:"管径"}, {dataNum:"数量"}, {length:"长度"}];
        var chartTitle = "管径分段统计图";

        var layerId = $("#selLayers").val();
        var layerName = $("#selLayers option:selected").text();
        //记录layer的名称列表 传递到统计图中
        layers.push(layerName);

        var classLayer = {
            chartTitle:chartTitle,
            layer:layers,
            fields:fields,
            dataList : [{layerName : layerName}]
        };
        if(!allResult){//为了解决管径分段不统计方管的结果
            var field = top.getName("US_SIZE", 1, true);
            allResult = StatisticsMgr.statisticsTypeParamQuery(layerId, pFeat, field, 1, null, null)
            if(allResult){
                allResult = $.xml2json(allResult);
                if(allResult && allResult.Item){
                    if(!allResult.Item.length){
                        allResult.Item = [allResult.Item];
                    }
                }
            }
        }
        
        var lengthCount = 0;
        var numCount=0;
        for(var i=0; i<rangeTable.rows.length; i++){
            var downValue = rangeTable.rows[i].cells[0].innerHTML;
            var upValue = rangeTable.rows[i].cells[1].innerHTML;
            var usSize = top.getName("US_SIZE", 1, true);
            var result=StatisticsMgr.statisticsParamQuery(layerId,pFeat,downValue,upValue,usSize);
            if(result!="error"){
                var json = $.xml2json(result);
                var totalLength = 0;
                var dataNum = 0;
                if(json!=null && json != ""){
                    if(json.Item != null && json.Item != "" && json != undefined){
                        totalLength = json.Item.length/1000;//管径长度
                        dataNum = json.Item.Times;//管径总数
                    }
                }
                var dataType = downValue + "-" + upValue;//管径
                if(allResult && allResult.Item && allResult.Item.length){
                    for(var j = 0; j<allResult.Item.length; j++){
                        var thisFication  = allResult.Item[j];
                        var diameter = thisFication[usSize];
                        if(!diameter || !thisFication.length || !thisFication.Times){
                            continue;
                        }
                        if(diameter && diameter.split("X").length > 1){//使用X连接的方管
                            var width = diameter.split("X")[0];
                        }else if(diameter &&  diameter.split("x").length > 1){//使用x连接的方管
                            var width = diameter.split("x")[0];
                        }else if(diameter && diameter.split("*").length > 1){//使用*连接的方管
                            var width = diameter.split("*")[0];
                        }else{//圆管，不继续统计
                            continue;
                        }
                        width = parseInt(width);
                        if(parseInt(downValue) <= width && width < parseInt(upValue)){//如果宽度属于这个区间，那么加在里面
                            totalLength = parseFloat(totalLength) + parseFloat(thisFication.length/1000);
                            dataNum = parseInt(dataNum) + parseInt(thisFication.Times);
                        }
                    }
                }
                classLayer.dataList.push({dataType: dataType, dataNum: dataNum, length: parseFloat(totalLength).toFixed(3)});
                lengthCount=parseFloat(lengthCount)+parseFloat(totalLength);
                numCount=parseFloat(numCount)+parseFloat(dataNum);
            }
        }
        //小计开始
        classLayer.dataList.push({dataType: "小计", dataNum: numCount, length: parseFloat(lengthCount).toFixed(3)});
        classResList.push(classLayer);

        StatisticsMgr.showClassificationResult(classResList, $("#resultDiv"),3); //显示管径分段统计结果
        $("#importExcelBtn").attr("disabled",false); //恢复【导出Excel】按钮可用
        $("#sBtn").attr("disabled",false);
        addExportTitle();
    };
    var addExportTitle=function(){
        var cols=["图层","管径","数量","长度(km)"];
        var rangeTable = document.getElementById("exportTab");
        var newTr=rangeTable.insertRow(0);
        newTr.style.display="none";
        for(var i=0;i<cols.length;i++){
            var td=newTr.insertCell();
            td.innerHTML=cols[i];
        }
    }
    $(window).unload(function () {
        if(earth.ShapeCreator!=null){
            earth.ShapeCreator.Clear();
        }
        clearHtmlBal();
    });
});

var O2String = function (O) {
    //return JSON.stringify(jsonobj);

    var S = [];
    var J = "";
    if (Object.prototype.toString.apply(O) === '[object Array]') {
        for (var i = 0; i < O.length; i++)
            S.push(O2String(O[i]));
        J = '[' + S.join(',') + ']';
    }
    else if (Object.prototype.toString.apply(O) === '[object Date]') {
        J = "new Date(" + O.getTime() + ")";
    }
    else if (Object.prototype.toString.apply(O) === '[object RegExp]' || Object.prototype.toString.apply(O) === '[object Function]') {
        J = O.toString();
    }
    else if (Object.prototype.toString.apply(O) === '[object Object]') {
        for (var i in O) {
            O[i] = typeof (O[i]) == 'string' ? '"' + O[i] + '"' : (typeof (O[i]) === 'object' ? O2String(O[i]) : O[i]);
            S.push(i + ':' + O[i]);
        }
        J = '{' + S.join(',') + '}';
    }

    return J;
};

var classResList;
/**
 * 统计功能
 */
var htmlBal=null;
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
        htmlBal.InvokeScript("getdata", jsonStrData);
    };
    /*earth.Event.OnHtmlBalloonFinished= function () {
     htmlBal.DestroyObject();
     earth.Event.OnHtmlBalloonFinished= function () {};
     };*/
});
/*
 * 清楚统计图
 */
var clearHtmlBal=function(){
    if (htmlBal != null) {
        htmlBal.DestroyObject();
        htmlBal = null;
    }
}
/**
 * 功能：根据图层Id，获取统计范围对象
 * 参数：layerId-管线的图层ID; pipeRangeList-所有管线图层的统计范围;
 * 返回：指定图层的统计范围对象
 */
var getPipeRangeById = function(layerId, pipeRangeList){
    var pipeRange = null;
    for(var i=0; i<pipeRangeList.length; i++){
        if(layerId == pipeRangeList[i].layerId){
            pipeRange = pipeRangeList[i].rangeList;
            break;
        }
    }
    return pipeRange;
};

/**
 * 功能：判断元素是否存在数组中
 * 参数：range - 要判断是否存在的元素；rangeList-要判断的数组
 * 返回：是否存在（true为存在；false为不存在）
 */
var isRangeExists = function(range, rangeList){
    var flag = false;
    for(var i=0; i<rangeList.length; i++){
        if(range == rangeList[i]){
            flag = true;
            break;
        }
    }
    return flag;
};

/**
 * 功能：获取被选中的管线图层的统计范围
 * 参数：无
 * 返回：被选中的管线图层的统计范围
 */
var getSelectPipeRangeList = function(){
    var queryTableType = 1; //线表搜索
    var rangeList = [];
    var layerId = $("#selLayers").val();
    var usSize = top.getName("US_SIZE", 1, true);
    var valueList = getPipeRangeById(layerId, allDiameterRangeList); //先从缓存数组中查找图层的管径范围
    if(valueList == null){ //如果缓存数组中不存在该图层的管径范围，则从GISServer服务中查找，并将查找结果保存到缓存数组中，以便下次直接使用
        var result = StatisticsMgr.getValueRangeInfo(layerId, null, 4, queryTableType, usSize);
        valueList = StatisticsMgr.getValueRangeList(result);
        var rangeObj = {
            layerId : layerId,
            rangeList : valueList
        };
        allDiameterRangeList.push(rangeObj); //将查找结果保存到缓存数组中
    }
    if(valueList != null){
        for(var i=0; i<valueList.length; i++){
            var value = parseFloat(valueList[i]);
            if(isRangeExists(value,rangeList) == false){
                rangeList.push(value);
            }
        }
    }
    rangeList.sort(StatisticsMgr.sortNumber);
    return rangeList;
};

/**
 * 功能：显示被选中的管线图层的统计范围
 * 参数：无
 * 返回：无
 */
var showDiameterRangeList = function(){
    var rangeList = getSelectPipeRangeList();
    StatisticsMgr.showRangeList($("#diameterRangeDiv"), rangeList);
    $("#upLimitBtn").attr("disabled", true);
    $("#downLimitBtn").attr("disabled", true);
    $("#addRowBtn").attr("disabled", true);
    //$("#deleteRowBtn").removeAttr("disabled");
    //$("#statisticsBtn").removeAttr("disabled");
    $("#statisticsListTab").html("");
    $("#statisticsListTab")[0].selectIndex = null;
};