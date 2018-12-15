/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：用地平衡
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
jQuery.support.cors = true; //开启jQuery跨域支持
var earth = null;//球对象
var layers = null;//所有的控规图层
var pVal = null;//气泡弹出之前绘制的多边形对象
var elList = [];//根据结果生成的点线面对象集合
var mapMgr = null;//获取映射函数集合
var layerId = null;//选取图层ID
var layerDataType = null;//选取图层的datatype
var searchAnalysis = null;//方法集合
var htmlBalloon = null;//气泡对象
var ydType = "";
var ydArea = "";

//初始化
//earthObj:从气泡外传进来的earth对象
function getEarth(earthObj){
	pVal = earthObj.pVal;
	earth = earthObj;
	layers = earthObj.ctrPlanLayer;
	mapMgr = earth.mapMgr;
	htmlBalloon = earthObj.htmlBalloon;
    searchAnalysis = earthObj.searchAnalysis;
	initLayer();
}

//初始化图层数据
function initLayer(){
	for (var i = 0; i < layers.length; i++) {
        $("#selLayers").append('<option value="' +
            layers[i].id + '" server="' + layers[i].name + '">' +
            layers[i].name + '</option>');
    }
    if(layers.length==0){
    	$("#statistics").attr("disabled",true);
    	$("#export").attr("disabled",true);
    }
}

/**
 * [showTable 将组织好的对象显示在表格中]
 * @param  {[obj]} data      [已组织好的对象]
 * @param  {[number]} totalArea [总面积]
 * @return {[type]}           [无]
 */
function showTable(data, totalArea){
    var trIndx = 0;
	for(var i in data){
        if(i == "num"){
            continue;
        }
		var iCount = data[i].num;
        var isFirstCode1 = true;
		for(var j in data[i]){
            if(j == "num"){
                continue;
            }
            var jCount = data[i][j].num;
            var isFirstCode2 = true;
            for(var k in data[i][j]){
                if(k == "num"){
                    continue;
                }
                var kCount = data[i][j][k].num;
                var isFirstCode3 = true;
                for(var l = 0; l < kCount; l++){
                    trIndx++;
                    var str = "<tr><td>" + trIndx + "</td>";
                    if(isFirstCode1){
                        str += "<td rowspan='" + iCount + "'>" + i + "</td>";
                    }
                    if(isFirstCode2){
                        str += "<td rowspan='" + jCount + "'>" + j + "</td>";
                    }
                    if(isFirstCode3){
                        str += "<td rowspan='" + kCount + "'>" + k + "</td>";
                    }
                    str += "<td>" + data[i][j][k][l][ydType] + "</td><td>" 
                    + parseFloat(data[i][j][k][l][ydArea]).toFixed(2) + "</td><td>"+ (parseFloat(data[i][j][k][l][ydArea]) * 100 / parseFloat(totalArea)).toFixed(2) + "</td></tr>";
                    $("#dg tbody").append(str);
                    isFirstCode1 = false;
                    isFirstCode2 = false;
                    isFirstCode3 = false;
                }
            }
		}
	}
}
   
//将查询结果显示在表格中
//layerId:图层guid;sc:空间过滤条件
function showData(layerId,sc){
	var data = searchAnalysis.getGeoData(layerId,"",sc,0,1000);
	if (!data) {
        return;
    }
    data = searchAnalysis.parseData(data, layerId);
    var totalNum = data.total;
    var dataRows = data.rows;
    if(!totalNum){
        alert("无查询结果");
        return;
    }
    var resultData = [];
    var resultCount = [];
    var code1Arr = [];
    var totalArea = 0;
    var code1 = mapMgr.getTrueField("YDDHF",layerDataType);
    var code2 = mapMgr.getTrueField("YDDHS",layerDataType);
    var code3 = mapMgr.getTrueField("YDDHT",layerDataType);
    ydType = mapMgr.getTrueField("YDXZ",layerDataType);
    ydArea = mapMgr.getTrueField("YDMJ",layerDataType);
    //结果使用数组的方式存放，下标分别为用地大类、中类以及小类
    for(var i=0; i<totalNum; i++){
    	var code1Value = dataRows[i][code1]?dataRows[i][code1]:"其他";
    	var code2Value = dataRows[i][code2]?dataRows[i][code2]:"其他";
    	var code3Value = dataRows[i][code3]?dataRows[i][code3]:"其他";

    	if(!resultData[code1Value]){
    		resultData[code1Value] = {};
    		if(!resultData[code1Value][code2Value]){
    			resultData[code1Value][code2Value] = {};
    			if(!resultData[code1Value][code2Value][code3Value]){
	    			resultData[code1Value][code2Value][code3Value] = [];
	    		}
    		}
    	}else{
    		if(!resultData[code1Value][code2Value]){
    			resultData[code1Value][code2Value] = {};
    			if(!resultData[code1Value][code2Value][code3Value]){
	    			resultData[code1Value][code2Value][code3Value] = [];
	    		}
    		}else{
    			if(!resultData[code1Value][code2Value][code3Value]){
	    			resultData[code1Value][code2Value][code3Value] = [];
	    		}
    		}
    	}
    	if(!resultData[code1Value].num){
    		resultData[code1Value].num = 1;
    	}else{
    		resultData[code1Value].num ++;
    	}
    	if(!resultData[code1Value][code2Value].num){
    		resultData[code1Value][code2Value].num = 1;
    	}else{
    		resultData[code1Value][code2Value].num ++;
    	}
    	if(!resultData[code1Value][code2Value][code3Value].num){
    		resultData[code1Value][code2Value][code3Value].num = 1;
    	}else{
    		resultData[code1Value][code2Value][code3Value].num ++;
    	}
    	resultData[code1Value][code2Value][code3Value].push(dataRows[i]);
        totalArea += parseFloat(dataRows[i][ydArea]);
    }

    showTable(resultData, totalArea);
}

//点击事件注册
$(function(){
	//统计点击事件
	$("#statistics").click(function(){
        $("#dg tbody").empty();
		var str = '';
		layerId = $("#selLayers").val();
		layerDataType = earth.LayerManager.GetLayerByGuid(layerId).DataType;
		for (var i = 0; i < pVal.Count; i++) {
            str += pVal.Items(i).X + ',' + pVal.Items(i).Y + ',0,';
        }
        str = str.substr(0, str.length - 1);
        str = '(2' + ',' + pVal.Count + ',' + str + ')';
        showData(layerId,str);
	});

	//导出按钮点击事件
	$("#export").click(function(){
        var exportExcel=new PageToExcel("dg",0,0,"export.xls");//table id , 第几行开始，最后一行颜色 ，保存的文件名
        exportExcel.CreateExcel(false);
        exportExcel.Exec();
	});

	//页面关闭
	window.onunload = function(){
		earth.ShapeCreator.Clear();
	}
})