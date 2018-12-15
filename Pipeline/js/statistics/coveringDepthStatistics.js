/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：埋深分段js文件
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 **************************************************/
var earth = null; //地球对象
var allDepthRangeList = []; //所有管线图层的埋深统计范围
var lastLayerId = null;
$(function () {
    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;

    setGridScrollHeight();
    $("#twoUlLeft,#twoUlRight").mCustomScrollbar({});//滚动条
    /**
     * 功能："项目"下拉列表的onchange事件
     */
    StatisticsMgr.initPipelineSelectList(projectId, $("#selLayers"));//初始化管线图层列表
    /**
     * 图层确定按钮点击事件
     */
    $("#confirmBtn").click(function () {
        if ($("#selLayers").val() != lastLayerId) {
            lastLayerId = $("#selLayers").val();
            showDepthRangeList();
        } else {
            return;
        }
    }).trigger("click");
    /**
     * 图层切换事件
     */
    $("#selLayers").change(function () {
        $("#diameterRangeDiv").empty();
    });

    /**
     * 功能：埋深范围列表的onclick事件
     */
    $("#depthRangeDiv").click(function () {
        var rangeTable = $("#depthRangeDiv table");
        if (rangeTable.length == 0) {
            return;
        }
        var selectIndex = rangeTable[0].selectIndex;
        if (selectIndex != null) { //是否一行埋深范围被选中
            $("#upLimitBtn").removeAttr("disabled");
            $("#downLimitBtn").removeAttr("disabled");
            $("#addRowBtn").removeAttr("disabled");
        }
    });

    /**
     * 功能：统计范围列表的onclick事件
     */
    $("#statisticsListTab").click(function () {
        $("#deleteRowBtn").removeAttr("disabled");
        $("#upLimitBtn").removeAttr("disabled");
        $("#downLimitBtn").removeAttr("disabled");
    });
    /**
     * 对几个统计按钮进行禁用与否
     */
    function enabledBtn() {
        var rangeTable = $("#statisticsListTab");
        if (rangeTable[0].rows.length != 0) { //如果统计范围被全部删除，则【删除行】按钮不可用
            $("#statisticsBtn").removeAttr("disabled");
            $("#btnCircleSelect").removeAttr("disabled");
            $("#btnPolygonSelect").removeAttr("disabled");
        }
    }

    /**
     * 功能：【上限】按钮onclick事件
     */
    $("#upLimitBtn").click(function () {
        var rangeTable = $("#depthRangeDiv table");
        var selectIndex = rangeTable[0].selectIndex;
        var rangeValue = rangeTable[0].rows[selectIndex].cells[0].innerHTML;

        var statTable = $("#statisticsListTab");
        var selectedStatRow = statTable[0].selectIndex;
        if (selectedStatRow == null) { //如果统计列表没有任何一行被选中，则添加一行数据
            var minValue = rangeTable[0].rows[0].cells[0].innerHTML;
            StatisticsMgr.appendStatisticsRangeRow(minValue, rangeValue, statTable);
        } else { //如果选中一行统计信息，则修改上限值
            statTable[0].rows[selectedStatRow].cells[1].innerHTML = rangeValue;  //修改上限值
        }
        enabledBtn();
    });


    /**
     * 功能：【下限】按钮onclick事件
     */
    $("#downLimitBtn").click(function () {
        var rangeTable = $("#depthRangeDiv table");
        var selectIndex = rangeTable[0].selectIndex;
        var rangeValue = rangeTable[0].rows[selectIndex].cells[0].innerHTML;

        var statTable = $("#statisticsListTab");
        var selectedStatRow = statTable[0].selectIndex;
        if (selectedStatRow == null) { //如果统计列表没有任何一行被选中，则添加一行数据
            var rowsNum = rangeTable[0].rows.length;
            var maxValue = rangeTable[0].rows[rowsNum - 1].cells[0].innerHTML;
            StatisticsMgr.appendStatisticsRangeRow(rangeValue, maxValue, statTable);
        } else { //如果选中一行统计信息，则修改下限值
            statTable[0].rows[selectedStatRow].cells[0].innerHTML = rangeValue;  //修改下限值
        }
        enabledBtn();
    });

    /**
     * 功能：【添加行】按钮onclick事件
     */
    $("#addRowBtn").click(function () {
        var rangeTable = $("#depthRangeDiv table");
        var rowsNum = rangeTable[0].rows.length;
        var maxValue = rangeTable[0].rows[rowsNum - 1].cells[0].innerHTML;
        var minValue = rangeTable[0].rows[0].cells[0].innerHTML;
        StatisticsMgr.appendStatisticsRangeRow(minValue, maxValue, $("#statisticsListTab"));
        enabledBtn();
    });

    /**
     * 功能：【删除行】按钮onclick事件
     */
    $("#deleteRowBtn").click(function () {
        var rangeTable = $("#statisticsListTab");
        var selectIndex = rangeTable[0].selectIndex;
        rangeTable[0].deleteRow(selectIndex);
        if (rangeTable[0].rows.length == 0) { //如果统计范围被全部删除，则【删除行】按钮不可用
            $("#deleteRowBtn").attr("disabled", true);
            $("#statisticsBtn").attr("disabled", true);
            $("#btnCircleSelect").attr("disabled", true);
            $("#btnPolygonSelect").attr("disabled", true);
            rangeTable[0].selectIndex = null;
            return;
        }
        if (selectIndex >= rangeTable[0].rows.length) { //如果被删除的为最后一行，则选择第一行
            selectIndex = 0;
        }
        StatisticsMgr.selectSingleRow(rangeTable[0].rows[selectIndex].cells[0]); //选中下一行
    });

    /**
     * 全部统计
     */
    $("#statisticsBtn").click(function () {
        var checkValue = checkRangeValue();
        if (!checkValue) {
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
        if (!checkValue) {
            return;
        }
        earth.Event.OnCreateGeometry = onCreateCircle;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateCircle();
    });

    /**
     * 圆域查询回调函数
     * @param pFeat
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
        if (!checkValue) {
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
    $("#importExcelBtn").click(function () {
        var exportExcel = new PageToExcel("exportTab", 0, 0, "export.xls");//table id , 第几行开始，最后一行颜色 ，保存的文件名
        exportExcel.CreateExcel(false);
        exportExcel.Exec();
    });
    /**
     * 判断修改后的上下限是否符合上限大于下限
     * @returns {boolean}
     */
    var checkUpDownValue = function () {
        var rangeTable = $("#statisticsListTab")[0];
        for (var i = 0; i < rangeTable.rows.length; i++) {
            var downValue = rangeTable.rows[i].cells[0].innerHTML;
            var upValue = rangeTable.rows[i].cells[1].innerHTML;
            if (downValue == "" || upValue == "" || isNaN(upValue) || isNaN(downValue)) {
                alert("上限或者下限值输入不正确.");
                return false;
            } else if (parseFloat(downValue) > parseFloat(upValue)) {
                alert("上限必须大于等于下限值.");
                return false;
            }
        }
        return true;
    };
    /**
     * 判断统计范围是否合格
     * @returns {boolean}
     */
    var checkRangeValue = function () {
        if (!checkUpDownValue()) return false;

        //判断统计范围中是否有重复范围
        var rangeTableRows = $("#statisticsListTab")[0].rows;
        for (var i = 0; i < rangeTableRows.length; i++) {
            for (var j = 0; j < rangeTableRows.length; j++) {
                if (i == j) {
                    continue;
                }
                if (rangeTableRows[i].innerText === rangeTableRows[j].innerText) {
                    alert("统计范围有重复");
                    return false;
                }
            }
            ;
        }
        return true;
    }
    /**
     * 功能：埋深分段统计功能代码
     */
    var diameterStatistics = function (pFeat) {
        $('.titleBlue4').css('backgroundColor', '#3595e7');
        $('.titleBlue4 li').css('borderColor', '#ccc');
        classResList = [];
        var rangeTable = $("#statisticsListTab")[0];
        //要传递到chart统计的数据
        var layers = [];
        var fields = [{dataType: "埋深"}, {dataNum: "数量"}, {length: "长度"}];
        var chartTitle = "埋深分段统计图";
        var layerId = $("#selLayers").val();
        var layerName = $("#selLayers option:selected").text();
        layers.push(layerName);

        var classLayer = {
            chartTitle: chartTitle,
            layer: layers,
            fields: fields,
            dataList: [{layerName: layerName}]
        };
        var lengthCount = 0;
        var numCount = 0;
        for (var i = 0; i < rangeTable.rows.length; i++) {
            var downValue = rangeTable.rows[i].cells[0].innerHTML;
            var upValue = rangeTable.rows[i].cells[1].innerHTML;
            var usSdeep = top.getName("US_SDEEP", 1, true);
            var result = StatisticsMgr.statisticsParamQuery(layerId, pFeat, downValue, upValue, usSdeep);
            if (result !== null || result !== "error") {
                var json = $.xml2json(result);
                if (json) {
                    var totalLength = json.Item.length;
                    totalLength = totalLength / 1000;
                    var dataType = downValue + "-" + upValue;
                    var dataNum = json.Item.Times;
                    classLayer.dataList.push({
                        dataType: dataType,
                        dataNum: dataNum,
                        length: parseFloat(totalLength).toFixed(3)
                    });
                    lengthCount = parseFloat(lengthCount) + parseFloat(totalLength);
                    numCount = parseFloat(numCount) + parseFloat(dataNum);
                }
            }
        }
        //小计
        classLayer.dataList.push({dataType: "小计", dataNum: numCount, length: parseFloat(lengthCount).toFixed(3)});
        classResList.push(classLayer);
        StatisticsMgr.showClassificationResult(classResList, $("#resultDiv"), 3); //显示埋深分段统计结果
        $("#importExcelBtn").attr("disabled", false); //恢复【导出Excel】按钮可用
        $("#sBtn").attr("disabled", false);
        addExportTitle();
    };
    //给导出table加上表头
    var addExportTitle = function () {
        var cols = ["图层", "埋深", "数量", "长度(km)"];
        var rangeTable = document.getElementById("exportTab");
        var newTr = rangeTable.insertRow(0);
        newTr.style.display = "none";
        for (var i = 0; i < cols.length; i++) {
            var td = newTr.insertCell();
            td.innerHTML = cols[i];
        }
    };
    $(window).unload(function () {
        if (earth.ShapeCreator != null) {
            earth.ShapeCreator.Clear();
        }
        clearHtmlBal();
    });
});

var classResList;//统计结果
/**
 * 统计功能
 */
var htmlBal = null;//统计图气泡对象
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
    htmlBal.SetBackgroundAlpha(150);//这里怎么调整为半透明效果呢
    htmlBal.ShowNavigate(newHref);
    earth.Event.OnDocumentReadyCompleted = function () {
        if (htmlBal === null) {
            return;
        }
        var jsonStrData = JSON.stringify(classResList);
        htmlBal.InvokeScript("getdata", jsonStrData);
    };
});
/*
 * 清除统计图页面
 */
var clearHtmlBal = function () {
    if (htmlBal != null) {
        htmlBal.DestroyObject();
        htmlBal = null;
    }
};
/**
 * 功能：获取数组中的最大值
 * 参数：numberArr-数组列表
 * 返回：数组中的最大值
 */
var getMaxValue = function (numberArr) {
    if (numberArr == null) {
        return null;
    }
    if (numberArr.length == 0) {
        return null;
    }
    var maxValue = numberArr[0];
    for (var i = 1; i < numberArr.length; i++) {
        maxValue = Math.max(maxValue, numberArr[i]);
    }
    return maxValue;
};

/**
 * 功能：获取数组中的最小值
 * 参数：numberArr-数组列表
 * 返回：数组中的最小值
 */
var getMinValue = function (numberArr) {
    if (numberArr == null) {
        return null;
    }
    if (numberArr.length == 0) {
        return null;
    }
    var minValue = numberArr[0];
    for (var i = 1; i < numberArr.length; i++) {
        minValue = Math.min(minValue, numberArr[i]);
    }
    return minValue;
};

/**
 * 功能：根据图层Id，获取统计范围对象
 * 参数：layerId-管线的图层ID; depthRangeList-所有管线图层的统计范围;
 * 返回：指定图层的统计范围对象
 */
var getDepthRangeById = function (layerId, depthRangeList) {
    var depth = null;
    for (var i = 0; i < depthRangeList.length; i++) {
        if (layerId == depthRangeList[i].layerId) {
            depth = depthRangeList[i];
            break;
        }
    }
    return depth;
};

/**
 * 功能：判断元素是否存在数组中
 * 参数：range - 要判断是否存在的元素；rangeList-要判断的数组
 * 返回：是否存在（true为存在；false为不存在）
 */
var isRangeExists = function (range, rangeList) {
    var flag = false;
    for (var i = 0; i < rangeList.length; i++) {
        if (range == rangeList[i]) {
            flag = true;
            break;
        }
    }
    return flag;
};

/**
 * 功能：获取被选中的管线图层的统计范围
 * 参数：depthRangeList - 所有管线图层的统计范围
 * 返回：被选中的管线图层的统计范围
 */
var getSelectDepthRangeList = function () {
    var minValue = null;
    var maxValue = null;
    var queryTableType = 1; //线表搜索
    var layerId = $("#selLayers").val();
    var tempRangeList = [];
    var depthRange = getDepthRangeById(layerId, allDepthRangeList); //先从缓存数组中查找图层的埋深范围
    if (depthRange == null) { //如果缓存数组中不存在该图层的埋深范围，则从GISServer服务中查找，并将查找结果保存到缓存数组中，以便下次直接使用
        var usSdeep = top.getName("US_SDEEP", 1, true);
        var sdeepResult = StatisticsMgr.getValueRangeInfo(layerId, null, 4, queryTableType, usSdeep);
        var sdeepValueList = StatisticsMgr.getValueRangeList(sdeepResult);
        var usEdeep = top.getName("US_EDEEP", 1, true);
        var edeepResult = StatisticsMgr.getValueRangeInfo(layerId, null, 4, queryTableType, usEdeep);
        var edeepValueList = StatisticsMgr.getValueRangeList(edeepResult);

        for (var i = 0; i < sdeepValueList.length; i++) {
            if (!isRangeExists(sdeepValueList[i], tempRangeList)) {
                tempRangeList.push(sdeepValueList[i]);
            }
        }
        for (var i = 0; i < edeepValueList.length; i++) {
            if (!isRangeExists(edeepValueList[i], tempRangeList)) {
                tempRangeList.push(edeepValueList[i]);
            }
        }
        tempRangeList.sort(StatisticsMgr.sortNumber);

        depthRange = {
            layerId: layerId,
            rangeList: tempRangeList
        };
        allDepthRangeList.push(depthRange); //将查找结果保存到缓存数组中
    } else {
        tempRangeList = depthRange.rangeList;
    }
    return tempRangeList;
};

/**
 * 功能：显示被选中的管线图层的统计范围
 * 参数：无
 * 返回：无
 */
var showDepthRangeList = function () {
    var rangeList = getSelectDepthRangeList();
    StatisticsMgr.showRangeList($("#depthRangeDiv"), rangeList);
    $("#upLimitBtn").attr("disabled", true);
    $("#downLimitBtn").attr("disabled", true);
    $("#addRowBtn").attr("disabled", true);
    $("#statisticsListTab").html("");
    $("#statisticsListTab")[0].selectIndex = null;
};