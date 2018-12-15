/**
 * 统计图
 */

var statisAryData;
var displayF;
var chartTitle;
var dataT = "dataType";
var myChart = null;

var selobjsChange = function() {
    $("#seltype").html("");
    if ($("#selobjs").val() == "管点") {
        $("#seltype").append("<option>数量</option>");
    } else {
        $("#seltype").append("<option>数量</option>");
        $("#seltype").append("<option>长度</option>");
    }
}

function getdata(data) {
    statisAryData = [];
    var obj = JSON.parse(data); //由JSON字符串转换为JSON对象
    var layerN;
    var layerNames = [];
    displayF = obj[0].fields;
    chartTitle = obj[0].chartTitle;

    if (chartTitle === "特征分类统计图" || chartTitle === "附属物分类统计图") {
        $("#seltype").hide();
        $("#seltypelabel").hide();
    }
    //解析json对象
    for (var i = 0; i < obj.length; i++) {
        var layerObj = obj[i];
        layerN = obj[i].layer;
        var layerObjLen = layerObj.dataList.length;
        var layerParam = [];
        if (layerObjLen > 1) {
            var layerName = layerObj.dataList[0].layerName;
            layerNames.push(layerName);
            for (var j = 1; j < layerObjLen; j++) {
                var layerObjParam = layerObj.dataList[j];
                if (layerObjParam.dataType == "小计" || layerObjParam.dataType == "总计") {
                    continue;
                } // hr add

                if (chartTitle === "特征分类统计图" || chartTitle === "附属物分类统计图") {
                    //alert(layerObjParam.dataType);
                    layerParam.push({
                        "pointType": (layerObjParam.pointType ? layerObjParam.pointType : layerObjParam.dataType),
                        "pointNum": layerObjParam.pointNum ? layerObjParam.pointNum : (layerObjParam.dataNum ? layerObjParam.dataNum : layerObjParam.length)
                    });
                    dataT = "pointType";
                    //alert(layerObjParam.dataRange + " " +  layerObjParam.length);
                } else {
                    layerParam.push({
                        "dataNum": layerObjParam.dataNum,
                        "dataType": layerObjParam.dataType,
                        "length": layerObjParam.length
                    });
                    dataT = "dataType";
                    //alert(layerObjParam.dataType);
                }
            }
            statisAryData.push({
                "layerName": layerName,
                "layerParam": layerParam
            });
        }
    }
    $("#selLayers").empty();

    //处理一下 改成从obj获取图层列表
    for (var i = 0; i < layerNames.length; i++) {
        var pipeLineLayer = layerNames[i];
        $("#selLayers").append('<option value="' +
            pipeLineLayer + '" server="' + pipeLineLayer + '">' +
            pipeLineLayer + '</option>');
    }
    if (chartTitle != "道路统计专题图" && chartTitle != "行政区统计图" && chartTitle != "测区统计图") {
        $("#selobjslabel").hide();
        $("#selobjs").hide();
    };

    function getNameYIndex(nameArr){
        var maxHeight = 50;
        for(var i = 0; i < nameArr.length; i++){
            var nameHeight = nameArr[i].length * 9;
            if(nameHeight > maxHeight){
                maxHeight = nameHeight;
            }
        }
        return maxHeight;
    }

    var roadobj = "";
    var query = function() {
        $('#chartContainer').unbind();
        $("#chartContainer").empty();
        var dom = document.getElementById("chartContainer");
        myChart = echarts.init(dom);

        var vv = $("#selLayers option:selected");
        var name = vv.val();
        var layerData;
        if (statisAryData) {
            for (var i = 0; i < statisAryData.length; i++) {
                if (statisAryData[i].layerName === name) {
                    layerData = statisAryData[i].layerParam;
                }
            };
        }

        var vv2 = $("#selobjs option:selected");
        roadobj = vv2.val();
        showChart(layerData);
        $("body").css("overflowX","auto");
    };

    $("#btnQuery").click(function(){
        query();
    });

    var getDisplayField = function(property) {
        for (var i = 0; i < displayF.length; i++) {
            var obj = displayF[i];
            for (var p in obj) {
                if (property === p) {
                    return obj[p];
                }
            }
        }
    }


    var showChart = function(data) {
        var chartDataName = [];
        var chartDataNum = [];
        var chartDataLength = [];
        var width = 75;
        var barWidth = 30;
        var chartData = [];
        var finishCharDatas = [];
        var fields = [];
        var type = "";
        var xName = "类型";
        if (chartTitle === "特征分类统计图" || chartTitle === "附属物分类统计图") {
            for (var i = 0; i < data.length; i++) {
                var ty = (data[i].pointType) ? (data[i].pointType) : (data[i].dataType);
                var sum = parseFloat((data[i].pointNum) ? (data[i].pointNum) : (data[i].length));
                chartData.push({
                    "pointType": ty,
                    "pointNum": sum
                });
                chartDataName.push(ty);
                chartDataNum.push(sum);
            };
            xName = "点性质";
            type = "点数";
        } else if (chartTitle == "道路统计专题图" || chartTitle == "行政区统计图" || chartTitle == "测区统计图") {
            for (var i = 0; i < data.length; i++) {
                if (roadobj == "管线") {
                    if (data[i].length > 0) {
                        chartData.push({
                            "dataType": data[i].dataType,
                            "dataNum": data[i].dataNum,
                            "length": data[i].length
                        });
                        chartDataName.push(data[i].dataType);
                        chartDataNum.push(parseFloat(data[i].dataNum));
                        chartDataLength.push(parseFloat(data[i].length));
                    }
                } else {
                    if (data[i].length <= 0 || data[i].length === "-") {
                        chartData.push({
                            "dataType": data[i].dataType,
                            "dataNum": data[i].dataNum
                        });
                        chartDataName.push(data[i].dataType);
                        chartDataNum.push(parseFloat(data[i].dataNum));
                    }
                }
            };
            var vv = $("#seltype option:selected");
            type = vv.val();
            xName = "类型";
        } else {
            for (var i = 0; i < data.length; i++) {
                chartData.push({
                    "dataType": data[i].dataType,
                    "dataNum": data[i].dataNum,
                    "length": data[i].length
                });
                chartDataName.push(data[i].dataType);
                chartDataNum.push(parseFloat(data[i].dataNum));
                chartDataLength.push(parseFloat(data[i].length));
            };
            var vv = $("#seltype option:selected");
            type = vv.val();
            switch(chartTitle){
                case "管径分段统计图":xName = "管径(mm)";break;
                case "埋深分段统计图":xName = "埋深(m)";break;
                case "管径分类统计图":xName = "管径(mm)";break;
                case "材质分类统计图":xName = "材质";break;
                case "权属统计图":xName = "单位";break;
                case "埋设统计图":xName = "类型";break;
                case "废弃分类统计图":xName = "类型";break;
            }
        }

        $("#chartContainer").css("min-width", "8000px");
        ///调整窗体和内容自适应---edit by zhangd
        if(chartDataName.length * width > 8000){
            width = 8000/chartDataName.length;
            barWidth = width / 2;
        }
        if(chartDataName.length * width > $(window).width() * 0.95){
            $("#chartContainer").css("min-width", chartDataName.length * width + "px");
            $("#headerDiv").css("min-width",chartDataName.length * width + "px");
        }else{
            $("#headerDiv").css("width", "100%");
            $("#chartContainer").css("width", "100%");
            $("#headerDiv").css("min-width", "380px");
            $("#chartContainer").css("min-width", "380px");
        }


        ///修改为echarts表格---edit by zhangd
        var option = {
            title: {
                text: chartTitle,
                left: "center",
                textStyle:{
                    fontStyle:'normal',
                    fontWeight:'normal',
                    fontSize:14
                }
            },
            tooltip: {},
            legend: {
                show:true,
                fontStyle:'normal',
                fontWeight:'normal',
                data: [type],
                top:30
            },
            grid:{
                show: true,
                left:70,
                right:80,
                y2: getNameYIndex(chartDataName)
            },
            xAxis: {
                axisLabel:{
                    show:true,
                    interval:0,
                    fontStyle:'normal',
                    fontWeight:'normal',
                    rotate: 40
                },
                name:xName,
                data: chartDataName
            },
            yAxis: {
                name: (type=="数量" || type=="点数")?type+'(个)':type+'（km）'
            },
            series: [{
                name: type,
                type: 'bar',
                barWidth: barWidth,
                barGap: '100%',
                data: (type=="数量" || type=="点数")?chartDataNum:chartDataLength
            }],
            color:["#2190c4"]
        };
        if (option && typeof option === "object") {
            setTimeout(function(){
                myChart.setOption(option, true);
                window.onresize = myChart.resize;
                $(window).resize();
            },200);
        }
    };
    $("#headerDiv").click();
}