/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：管线分析
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
// 改变窗口大小时，结果栏高度自适应
$(window).resize(function() {
	// easyui datagrid高度自适应
	try {
		setDivHeight();
		$("#dg").datagrid('resize', {
			height: $("#dgDiv").height()
		});
	} catch(e) {

	}
});
//横截面
var groundAltList = [];
var pipeLineAltList = [];
var dataGroundAltList = []; //如果是地形高程，需要数据高程去绘制线
var isClearAll = false;
var thisSearchLayer = null;

var pipeTranSectionAnalysisClick = function() {
	var earth = top.LayerManagement.earth;
	top.LayerManagement.earth.ToolManager.SphericalObjectEditTool.Browse();
	top.LayerManagement.earth.ShapeCreator.Clear();
	top.LayerManagement.earth.Event.OnCreateGeometry = OnCreateHorizonSectionLine;
	top.LayerManagement.earth.ShapeCreator.CreateLine();
	top.LayerManagement.earth.focus();
};
// 创建线回调函数
var OnCreateHorizonSectionLine = function(pObj) {
	if(!pObj || pObj.Count == 0) {
		return;
	}
	$("#AnalysisTranSection").attr("disabled", true);
	var thisImg = $("#AnalysisTranSection").find("img");
	thisImg.attr("src", "images/dialog/loading.gif");
	top.LayerManagement.earth.Event.OnCreateGeometry = function() {};
	var projectId = top.SYSTEMPARAMS.project;
	var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(projectId);
	var pipeLineLayers = top.LayerManagement.getCheckedPipelineLayers();
	addServices(pipeLineLayers, pObj);
};

/**
 * 清空数组中内容
 */
function clear() {
	if(groundAltList.length > 0 || pipeLineAltList.length > 0) {
		groundAltList.splice(0, groundAltList.length);
		pipeLineAltList.splice(0, pipeLineAltList.length);
	}
	minGroundAltitude = 0;
	maxGroundAltitude = 0;
	minLength = 0;
	maxLength = 0;
	minPipeLineAltitude = 0;
	maxPipeLineAltitude = 0;
	flag = true;
}
// 请求数据
var pVectors = [];
var pVectorsNew = {};

function addServices(layers, pObj) {
	clear();
	if(pObj.Count == 0) {
		return;
	}
	pVectors = pObj.GetPointAt(0);
	var strPoints = getStrPoints(pObj);
	var urlList = [];
	if(layers == null){
		return;
	}
	for(var i = 0; i < layers.length; i++) {
		var url = layers[i].GisServer;
		var layerId = layers[i].Guid;
		var type = layers[i].PipeLineType;
		var strCon = url + "pipeline?rt=transect&service=" + layerId;
		strCon = strCon + "&aparam=0" + strPoints;
		urlList.push({
			"url": strCon,
			"layerId": layerId,
			"type": type,
			"customColor": top.LayerManagement.earth.layerManager.GetLayerByGUID(layerId).CustomColor
		});

	}
	sendService(urlList);
}
var sendService = function(urlList) {
	var earth = window.top.LayerManagement.earth;
	if(urlList) {
		var tempArr = urlList.shift();
		window.top.LayerManagement.earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
			if(pRes.ExcuteType == top.SystemSetting.excuteType) {
				var xmlStr = pRes.AttributeName;
				var xmlDoc = loadXMLStr(xmlStr);
				parseResult(xmlDoc, tempArr.layerId, tempArr.type, tempArr.customColor);
			}
			if(urlList.length == 0) {
				createTranSectionChat();
			}
			if(urlList.length != 0) {
				sendService(urlList);
			}
		};
		window.top.LayerManagement.earth.DatabaseManager.GetXml(tempArr["url"]);
	}
};
//判断是否支持svg
function hasSvg() {
	var SVG_NS = 'http://www.w3.org/2000/svg';
	return !!document.createElementNS && !!document.createElementNS(SVG_NS, 'svg').createSVGRect;
}
// 创建横截面图
function createTranSectionChat() {
	var params = {
		gAltList: groundAltList,
		dataGroundAltList: dataGroundAltList,
		pAltList: pipeLineAltList,
		minL: minLength,
		maxL: maxLength,
		minG: minGroundAltitude,
		maxG: maxGroundAltitude,
		minP: minPipeLineAltitude,
		maxP: maxPipeLineAltitude,
		profileAlt: top.SYSTEMPARAMS.profileAlt,
		earthObj: top.LayerManagement.earth
	};
	$("#AnalysisTranSection").attr("disabled", false);
	var thisImg = $("#AnalysisTranSection").find("img");
	thisImg.attr("src", "images/tools/横断面.png");
	if(hasSvg()) {
		openDialog("html/pipelineAnalysis/tranSectionResult.html", params, 1060, 700);
	} else {
		openDialog("html/pipelineAnalysis/tranSectionResult2.html", params, 1060, 700);
	}
}

// 创建横截面图从气泡点击弹出
function createTranSectionChatByBalloon(elementLine) {
	var params = {
		gAltList: groundAltList,
		pAltList: pipeLineAltList,
		minL: minLength,
		maxL: maxLength,
		minG: minGroundAltitude,
		maxG: maxGroundAltitude,
		minP: minPipeLineAltitude,
		maxP: maxPipeLineAltitude,
		earthObj: earth,
		elementLine: elementLine
	};

	var is_opera = /opera/i.test(navigator.userAgent);
	var is_ie = (/msie/i.test(navigator.userAgent) && !is_opera);
	var is_ie_6 = (is_ie && /msie 6\.0/i.test(navigator.userAgent));
	var is_ie_7 = (is_ie && /msie 7\.0/i.test(navigator.userAgent));
	var is_ie_8 = (is_ie && /msie 8\.0/i.test(navigator.userAgent));

	if(is_ie_6 || is_ie_7 || is_ie_8) {
		openDialog("tranSectionResult2.html", params, 1060, 700);
	} else {
		openDialog("tranSectionResult.html", params, 1060, 700);
	}
}

// 获取点字符串
function getStrPoints(pObj) {
	var strPoints = "";
	if(pObj.GetPointAt(0).Longitude < pObj.GetPointAt(pObj.Count - 1).Longitude) {
		for(var j = 0; j < pObj.Count; j++) {
			var point = pObj.GetPointAt(j);
			strPoints = strPoints + "," + point.Longitude + "," + point.Latitude + "," + point.Altitude;
		}
		pVectorsNew.Longitude = pObj.GetPointAt(0).Longitude - 0.00045;
		pVectorsNew.Latitude = pObj.GetPointAt(0).Latitude;
		pVectorsNew.Altitude = pObj.GetPointAt(0).Altitude;
	} else {
		for(var j = pObj.Count - 1; j >= 0; j--) {
			var point = pObj.GetPointAt(j);
			strPoints = strPoints + "," + point.Longitude + "," + point.Latitude + "," + point.Altitude;
		}
		pVectorsNew.Longitude = pObj.GetPointAt(pObj.Count - 1).Longitude - 0.00045;
		pVectorsNew.Latitude = pObj.GetPointAt(pObj.Count - 1).Latitude;
		pVectorsNew.Altitude = pObj.GetPointAt(pObj.Count - 1).Altitude;
	}
	return strPoints;
}
// 解析服务器返回结果
var minGroundAltitude = 0;
var maxGroundAltitude = 0;
var minLength = 0;
var maxLength = 0;
var minPipeLineAltitude = 0;
var maxPipeLineAltitude = 0;
var flag = true;

function parseResult(xmlDoc, layerId, type, customColor) {
	var json = $.xml2json(xmlDoc);
	if(json == null || !json.TransectResult) {
		return;
	}
	var count = parseInt(json.TransectResult.num);
	if(count < 1) {
		return;
	}
	for(var i = 0; i < count; i++) {
		var Record = null;
		if(count == 1) {
			Record = json.TransectResult.Record;
		} else {
			Record = json.TransectResult.Record[i];
		}
		try {
			var ID = Record[top.getNameNoIgnoreCase("US_KEY", 1, true)]; //ID
			var mater = Record[top.getNameNoIgnoreCase("US_PMATER", 1, true)]; //材质
			mater = top.getCaptionByCustomValue(type, "MaterialType", mater);
		} catch(e) {
			var ID = Record[parent.getNameNoIgnoreCase("US_KEY", 1, true)]; //ID   
			var mater = Record[parent.getNameNoIgnoreCase("US_PMATER", 1, true)]; //材质 
			mater = top.getCaptionByCustomValue(type, "MaterialType", mater);
		}

		var dataType = StatisticsMgr.getValueByCode("PipeCode", type); //数据类型

		var color = "000000";
		if(Stamp.Tools.showMode == "material") {
			color = PipelineStandard.getStandardLineColor(type); // 按材质来
		} else if(Stamp.Tools.showMode == "standard") {
			color = PipelineStandard.standardColor(type); // 按国标来
			color = parseInt(color).toString(16);
			color = color.substring(2);
		} else if(Stamp.Tools.showMode == "custom") {
			color = parseInt(customColor).toString(16); //按自定义颜色来
			color = color.substring(2);
		}

		var tmp = "000000".substring(color.length, 6);
		color = "#" + color + tmp;
		var specification = Record[top.getNameNoIgnoreCase("US_SIZE", 1, true)]; //规格

		var intersectPoint = Record.IntersectPoint; // 横切点
		var intersectPointArr = intersectPoint.split(",");
		var intersectDeep = (parseFloat(Record.IntersectDeep)).toFixed(2); // 横切深度
		var intersectAltitude = parseFloat(Record.IntersectAltitude); // 横切高程=地面高程 不需要加上埋深
		intersectAltitude = (parseFloat(intersectAltitude)).toFixed(2);
		var vAltitude = top.LayerManagement.earth.Measure.MeasureTerrainAltitude(intersectPointArr[0], intersectPointArr[1]);
		vAltitude = (parseFloat(vAltitude)).toFixed(2); //算出地形高程
		var intersectPointZ = parseFloat(intersectPointArr[2]); //管线高程 横切点的Z值就是管线高程
		intersectPointZ = (parseFloat(intersectPointZ)).toFixed(2);
		var datum;
		if(!top.SYSTEMPARAMS) {
			datum = top.LayerManagement.earth.datum;
		} else {
			datum = top.SYSTEMPARAMS.pipeDatum;
		}
		var vecBegin = datum.des_BLH_to_src_xy(pVectors.Longitude,
			pVectors.Latitude, pVectors.Altitude);
		intersectPointArr[2] = pVectorsNew.Altitude;
		var vecEnd = datum.des_BLH_to_src_xy(intersectPointArr[0],
			intersectPointArr[1], intersectPointArr[2]);
		var lengthl = Math.sqrt(Math.abs(vecBegin.X - vecEnd.X) * Math.abs(vecBegin.X - vecEnd.X) + Math.abs(vecBegin.Y - vecEnd.Y) * Math.abs(vecBegin.Y - vecEnd.Y)); // 间距
		lengthl = (parseFloat(lengthl)).toFixed(6);
		if(flag) {
			minLength = maxLength = lengthl; //间距
			if(top.SYSTEMPARAMS.profileAlt == "0") { //数据高程
				minGroundAltitude = maxGroundAltitude = intersectAltitude;
			} else {
				minGroundAltitude = maxGroundAltitude = vAltitude; //地形高程
			}

			minPipeLineAltitude = maxPipeLineAltitude = intersectPointZ; //管线高程
			flag = false;
		}
		if(parseFloat(maxLength) < parseFloat(lengthl)) {
			maxLength = lengthl;
		}
		if(parseFloat(minLength) >= parseFloat(lengthl)) {
			minLength = lengthl;
		}
		if(top.SYSTEMPARAMS.profileAlt == "0") { //数据高程
			if(parseFloat(maxGroundAltitude) < parseFloat(intersectAltitude)) {
				maxGroundAltitude = intersectAltitude;
			} else if(parseFloat(minGroundAltitude) >= parseFloat(intersectAltitude)) {
				minGroundAltitude = intersectAltitude;
			}
		} else {
			if(parseFloat(maxGroundAltitude) < parseFloat(vAltitude)) {
				maxGroundAltitude = vAltitude;
			} else if(parseFloat(minGroundAltitude) >= parseFloat(vAltitude)) {
				minGroundAltitude = vAltitude;
			}
		}
		if(parseFloat(maxPipeLineAltitude) < parseFloat(intersectPointZ)) {
			maxPipeLineAltitude = intersectPointZ;
		} else if(parseFloat(minPipeLineAltitude) >= parseFloat(intersectPointZ)) {
			minPipeLineAltitude = intersectPointZ;
		}
		var pipeLineObj = {};
		if(top.SYSTEMPARAMS.profileAlt == "0") {
			groundAltList.push(intersectAltitude); //数据高程
			pipeLineObj.groundAltitude = intersectAltitude;
		} else {
			groundAltList.push(vAltitude); //地形高程
			dataGroundAltList.push(intersectAltitude);
			pipeLineObj.groundAltitude = vAltitude;
			pipeLineObj.dataAltitude = intersectAltitude; //地形高程也显示数据高程
		}
		groundAltList.push(lengthl);

		pipeLineObj.dataType = dataType;
		pipeLineObj.ID = ID;
		pipeLineObj.mater = mater;
		pipeLineObj.x = intersectPointZ;
		pipeLineObj.y = lengthl;
		pipeLineObj.coordX = (vecEnd.X).toFixed(2);
		pipeLineObj.coordY = (vecEnd.Y).toFixed(2);
		pipeLineObj.fillcolor = color;

		pipeLineObj.specification = specification;
		pipeLineObj.deep = intersectDeep;
		pipeLineAltList.push(pipeLineObj);
	}
};

var bLine = true;
var bufPolygon = null; //临时buffer图形
var targetPipeLineType = 0;
var obj = {}; //分析常用属性集合对象
var selobj = null; //选中对象
/**
 * 功能：选取对象
 * 参数：contain-显示标签,btn-按钮 ,bufferDisk-缓冲半径 ,pointCheck--是否分析点,objAnalys-是否解析选取对象
 * 返回值：无
 */

function analysisSelectObj(contain, btn, bufferDiskObj, pointCheck, objAnalys) {
	top.LayerManagement.earth.Event.OnRBDown = function() {
		bufferDiskObj.attr("disabled", false);
		top.LayerManagement.earth.Event.OnRBDown = function() {};
	}
	var bufferDisk = bufferDiskObj.val();
	bufferDiskObj.attr("disabled", true);
	top.LayerManagement.earth.Event.OnPickObjectEx = function(pObj) {
		stophighlight();
		pObj.Underground = true; 
		pObj.ShowHighLight();
		top.LayerManagement.earth.Event.OnPickObjectEx = function() {};
		top.LayerManagement.earth.Query.FinishPick();
		var layerGUID = pObj.GetParentLayerName().split("=")[1];
		obj.layerGUID = layerGUID;
		obj.objGUID = pObj.Guid;
		obj.key = pObj.GetKey();
		thisSearchLayer = earth.LayerManager.GetLayerByGUID(layerGUID);
		obj.X = pObj.SphericalTransform.Longitude;
		obj.Y = pObj.SphericalTransform.Latitude;
		obj.Z = pObj.SphericalTransform.Altitude;
		var lineChk = true;
		if(objAnalys) { //不需要再次查询所做操作

		} else {
			lineChk = analysisSearchObj(pObj, bufferDisk, pointCheck);
		}
		if(lineChk) {
			var checkFlag = checkProject(pObj);
			if(!checkFlag) {
				alert("所选管线不属于当前工程，请重新选择");
				return;
			} else {
				contain.val(pObj.GetKey());
			}
		} else {
			contain.val("");
		}
		bufferDiskObj.attr("disabled", false);
		if(bufferDisk == 0 || !bufferDisk) {
			btn.attr("disabled", true);
		} else {
			btn.removeAttr("disabled");
		}
		selobj = pObj;
	};
	top.LayerManagement.earth.Query.PickObjectEx(24); 
}

function checkProject(pObj) { //判断分析的管线是否属于当前工程
	var parentLayerNameTemp = pObj.GetParentLayerName();
	var parentLayerName = parentLayerNameTemp.split("=")[1];
	var str = parentLayerNameTemp.split("=")[1].split("_");
	var PObjGUID = parentLayerNameTemp.split("=")[1].split("_")[0];
	var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(PObjGUID);
	targetPipeLineType = top.LayerManagement.earth.LayerManager.GetLayerByGUID(parentLayerName.split("_")[0]).PipeLineType;
	obj.pipetype = targetPipeLineType;
	var subLayer = null;
	for(var x = 0; x < layer.GetChildCount(); x++) {
		subLayer = layer.GetChildAt(x);
		if(subLayer.Name === str[1]) {
			break;
		}
	}
	if(subLayer === null) {
		return;
	}
	var param = subLayer.QueryParameter;
	param.ClearSpatialFilter();
	param.ClearRanges();
	param.ClearCompoundCondition();
	var result = null,
		json = null;
	var US_KEY = top.getName("US_KEY", 1, true);
	param.Filter = "(and,equal," + US_KEY + "," + pObj.GetKey() + ")";
	param.QueryType = 17; 
	if(parentLayerName.indexOf("container") > -1) {
		lineChk = true;
		bLine = true;
		param.QueryTableType = 1;
		result = subLayer.SearchFromGISServer();
		if(result.RecordCount > 0) {
			return true;
		} else {
			return false;
		}
	}

}

function burstAnalysisSelectObj(contain, btn, bufferDisk, pointCheck, objAnalys) {
	top.LayerManagement.earth.Event.OnPickObjectEx = function(pObj) {
		pObj.Underground = true;
		top.LayerManagement.earth.Event.OnPickObjectEx = function() {};
		top.LayerManagement.earth.Query.FinishPick();
		var layerGUID = pObj.GetParentLayerName().split("=")[1];
		obj.layerGUID = layerGUID;
		obj.objGUID = pObj.Guid;
		obj.key = pObj.GetKey();
		obj.X = pObj.GetLonLatRect().Center.X;
		obj.Y = pObj.GetLonLatRect().Center.Y;
		obj.Z = pObj.GetLonLatRect().Center.Z;
		var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(layerGUID.split("_")[0]);
		var checkFlag = checkProject(pObj);
		if(!checkFlag) {
			alert("所选管线不属于当前工程，请重新选择");
			return false;
		}
		if(layer == null) {
			return false;
		}

		if((layer.PipeLineType >= 1000 && layer.PipeLineType < 3000) ||
			(layer.PipeLineType >= 8100 && layer.PipeLineType < 8200) || layer.PipeLineType == 4000) {
			alert("此类管线不支持爆管分析功能.");
			burstAnalysisSelectObj(contain, btn, bufferDisk, pointCheck, objAnalys);
			return;
		}
		pObj.ShowHighLight();
		var lineChk = true;
		if(objAnalys) { //不需要再次查询所做操作

		} else {
			lineChk = analysisSearchObj(pObj, bufferDisk, pointCheck);
		}
		if(lineChk) {
			contain.val(pObj.GetKey());
		} else {
			contain.val("");
		}
		btn.removeAttr("disabled");
		selobj = pObj;
	};
	top.LayerManagement.earth.Query.PickObjectEx(24); 
}

function stophighlight() {
	clearSearchResult();
	if(selobj) {
		selobj.StopHighLight();
	}
}
/**
 * 功能：对选取对象解析
 * 参数：pObj-选择对象
 * 返回值：无
 */
function analysisSearchObj(pObj, bufferDisk, pointCheck) {
	var lineChk = false;
	var selectedObj = null; // SEGeoPoints类型
	var selectedObjStr = ""; // selectedObj的字符串表示：x1,y1,z1,x2,y2,z2
	var pdiam = 0;
	var ppressure = "";
	var plttype = "";
	var ppsvalue = "";
	var targetPipeLineType = 0;
	var parentLayerNameTemp = pObj.GetParentLayerName();
	var parentLayerName = parentLayerNameTemp.split("=")[1];
	var str = parentLayerNameTemp.split("=")[1].split("_");
	var PObjGUID = parentLayerNameTemp.split("=")[1].split("_")[0];
	var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(PObjGUID);
	targetPipeLineType = top.LayerManagement.earth.LayerManager.GetLayerByGUID(parentLayerName.split("_")[0]).PipeLineType;
	obj.pipetype = targetPipeLineType;
	var subLayer = null;
	for(var x = 0; x < layer.GetChildCount(); x++) {
		subLayer = layer.GetChildAt(x);
		if(subLayer.Name === str[1]) {
			break;
		}
	}
	if(subLayer === null) {
		return;
	}
	var param = subLayer.QueryParameter;
	param.ClearSpatialFilter();
	param.ClearRanges();
	param.ClearCompoundCondition();
	var result = null,
		json = null;
	var US_KEY = top.getName("US_KEY", 1, true);
	param.Filter = "(and,equal," + US_KEY + "," + pObj.GetKey() + ")";
	param.QueryType = 17; 
	if(parentLayerName.indexOf("container") > -1) {
		lineChk = true;
		bLine = true;
		param.QueryTableType = 1;
		result = subLayer.SearchFromGISServer();
		if(result.RecordCount > 0) {
			json = $.xml2json(result.GotoPage(0));
			if(json.Result.num == 1) {
				var US_SALT = top.getName("US_SALT", 1, true);
				var US_EALT = top.getName("US_EALT", 1, true);
				var jsonShap = json.Result.Record.SHAPE;
				selectedObjStr = jsonShap.Polyline.Coordinates;
				if(jsonShap.Polyline.OriginalCoordinates) {
					selectedObjStr = jsonShap.Polyline.OriginalCoordinates;
				}
				var xyz = selectedObjStr.split(",");
				selectedObjStr = xyz[0] + "," + xyz[1] + "," + json.Result.Record[US_SALT] + "," + xyz[3] + "," + xyz[4] + "," + json.Result.Record[US_EALT];
				pdiam = json.Result.Record[top.getName("US_SIZE", 1, true)];
				ppressure = json.Result.Record[top.getName("US_PRESSUR", 1, true)];
				plttype = json.Result.Record[top.getName("US_LTTYPE", 1, true)];
				ppsvalue = json.Result.Record[top.getName("US_PSVALUE", 1, true)];
				var coords = jsonShap.Polyline.Coordinates.split(",");
				selectedObj = top.LayerManagement.earth.Factory.CreateGeoPoints();
				for(var i = 0; i < coords.length; i += 3) {
					selectedObj.Add(coords[i], coords[i + 1], coords[i + 2]);
				}
				AnalysisCreateBufferFromLine(selectedObj, bufferDisk);
			} else if(json.Result.num > 1) {
				alert(top.PIPE_WORNING);
				return;
			}
		} else {
			alert("所选管线不属于当前工程，请重新选择");
			return false;
		}
	} else {
		lineChk = false;
		if(pointCheck) {
			param.QueryTableType = 0;
			result = subLayer.SearchFromGISServer();
		} else {
			alert("所选管线不属于当前工程，请重新选择");
			return false;
		}
	}
	obj.targetPipeLineType = targetPipeLineType;
	obj.selectedObjStr = selectedObjStr;
	obj.selectedObj = selectedObj;
	obj.pdiam = pdiam;

	//---水平净距、垂直净距、碰撞分析中要用到压力和埋设方式字段 START---//
	obj.ppressure = ppressure;
	obj.plttype = plttype;
	obj.ppsvalue = ppsvalue;
	if(obj.ppressure == "低压") {
		obj.ppressure = 0;
	} else if(obj.ppressure == "中压") {
		obj.ppressure = 1;
	} else if(obj.ppressure == "高压") {
		obj.ppressure = 2;
	} else {
		obj.ppressure = -1;
	}
	if(obj.plttype == undefined || obj.plttype == "") {
		obj.plttype = -1;
	}
	if(obj.ppsvalue == undefined || obj.ppsvalue == "") {
		obj.ppsvalue = -1;
	}
	//---水平净距、垂直净距、碰撞分析中要用到压力和埋设方式字段 END---//

	return lineChk;
}
/**
 * 功能：清除生成的缓冲区对象
 * 参数：无
 * 返回值：无
 */
function analysisClearBuffer() {
	if(bufPolygon != null) {
		top.LayerManagement.earth.DetachObject(bufPolygon);
		bufPolygon = null;
	}
};
/**
 * 功能：生成缓冲区对象
 * 参数：selectedObj-所选对象点集，
 * 返回值：无
 */
function AnalysisCreateBufferFromLine(selectedObj, disk) {
	if(selectedObj == null) {
		return;
	}
	if(disk === "") {
		disk = 0;
	}
	var vec3s = top.LayerManagement.earth.Factory.CreateVector3s();
	var pt = null;
	var bufGeoPoints = top.LayerManagement.earth.GeometryAlgorithm.CreatePolygonBufferFromPolyline(selectedObj,
		disk, 0, 36);

	for(var i = 0; i < bufGeoPoints.Count; i++) {
		pt = bufGeoPoints.GetPointAt(i);
		vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude);
	}
	analysisClearBuffer();
	bufPolygon = top.LayerManagement.earth.Factory.CreateElementPolygon(top.LayerManagement.earth.Factory.CreateGUID(), "");
	bufPolygon.BeginUpdate();
	bufPolygon.SetExteriorRing(vec3s); 
	bufPolygon.LineStyle.LineWidth = 1;
	bufPolygon.LineStyle.LineColor = parseInt("0xFFFF0000");
	bufPolygon.FillStyle.FillColor = parseInt("0x2500FF00");
	bufPolygon.AltitudeType = 1; 
	bufPolygon.selectable = false;
	bufPolygon.EndUpdate();
	top.LayerManagement.earth.AttachObject(bufPolygon);
	obj.bufGeoPoints = bufGeoPoints;
};
/**
 * 功能：生成缓冲区对象
 * 参数：searchResult-SearchFromLocal搜索数据，key-关键字
 * 返回值：匹配的对象/null
 */
function filterByKey(searchResult, key) {
	var obj = null;
	if(searchResult.RecordCount === 0) {
		return null;
	}
	searchResult.GotoPage(0);
	for(var i = 0; i < searchResult.RecordCount; i++) {
		obj = searchResult.GetLocalObject(i);
		if(null == obj) continue;
		if(obj.GetKey() == key) {
			obj.Underground = true; 
			return obj;
		}
	}
	return null;
};

/**
 * 功能：高亮闪烁显示
 * 参数：layerID-图层ID，type-对象类型：point / line， guid-对象的GUID，key-- 对象的US_KEY值
 * 返回值：无
 */
var northArr = [];
var southArr = [];
var eastArr = [];
var westArr = [];
var hidenArr = [];
var chkArr = []; //是否
var chkFlag = "false";
var showTag = false;
var dbClickHighLight = [];
var bShow = false; //显示详情
var recordResults = [];
var isShowResult = false; //是否是点击显示结果按钮
var highlightObjects = function(layerID, type, key, checkFlag, lineType, pointType) {
	//清除其他的高亮
	if(type === "管点") {
		type = "point";
	}
	var layer = earth.LayerManager.GetLayerByGUID(layerID);
	var i = 0;
	var subLayer = null;
	var searchResult = null;
	var obj = null;

	for(i = 0; i < layer.GetChildCount(); i++) {
		try {
			subLayer = layer.GetChildAt(i);
			if(type === "point" || type === "管点") {
				if(pointType) {
					if($.inArray(subLayer.LayerType, pointType) < 0) {
						continue;
					}
				} else {
					if(subLayer.LayerType === "Container" || subLayer.LayerType === "Vector" || subLayer.LayerType === "Container_Og") { //过滤掉缓冲区图层
						continue;
					}
				}

			} else if(type === "line" || type === "管线") {
				if(lineType) {
					if($.inArray(subLayer.LayerType, lineType) < 0) {
						continue;
					}
				} else {
					if((subLayer.LayerType !== "Container" && subLayer.LayerType !== "Container_Og") || subLayer.LayerType === "Vector") continue;

				}
			}
			var dt = subLayer.LocalSearchParameter.ReturnDataType;
			subLayer.ClearSearchResult();
			subLayer.LocalSearchParameter.ClearSpatialFilter();
			subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml; //0 返回所有数据，1 返回xml数据，2 返回渲染数据

			subLayer.LocalSearchParameter.PreciseKeyValue = key;
			subLayer.LocalSearchParameter.HasDetail = false;
			subLayer.LocalSearchParameter.HasMesh = false;
			var red = parseInt("0xFFFF0000");
			if(checkFlag) {
				subLayer.ShowHighlightBySearch(red, false);
			} else {
				subLayer.ClearHighlight();
				dbClickHighLight = [];
				selobj = null;
			}
			subLayer.LocalSearchParameter.ReturnDataType = dt;
		} catch(e) {
			alert(e);
		}

	}
};

function analysisHighlightObject(layerID, type, guid, key, flag) { //必要参数 layerID type key 
	clearSearchResult();
	isClearAll = false;
	var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(layerID);
	var i = 0;
	var subLayer = null;
	var searchResult = null;
	var obj = null;
	for(i = 0; i < layer.GetChildCount(); i++) {
		subLayer = layer.GetChildAt(i);
		if(type === "point" || type === "管点") {
			if(subLayer.LayerType === "Container" || subLayer.LayerType === "Vector") continue;
		} else if(type === "line" || type === "管线") {
			if((subLayer.LayerType !== "Container" && subLayer.LayerType !== "Container_Og") || subLayer.LayerType === "Vector") continue;
		}
		var dt = subLayer.LocalSearchParameter.ReturnDataType;
		subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
		subLayer.LocalSearchParameter.PageRecordCount = 100;
		subLayer.LocalSearchParameter.PreciseKeyValue = key;
		subLayer.LocalSearchParameter.ClearSpatialFilter();
		subLayer.LocalSearchParameter.HasDetail = false;
		subLayer.LocalSearchParameter.HasMesh = false;
		searchResult = subLayer.SearchFromLocal();
		subLayer.LocalSearchParameter.ReturnDataType = dt;
		if(searchResult.RecordCount < 1) continue;

		subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
		obj = filterByKey(searchResult, key);
		subLayer.LocalSearchParameter.ReturnDataType = dt;
		if(obj != null) {
			var vecCenter = obj.SphericalTransform;
			northArr.push(obj.GetLonLatRect().North);
			southArr.push(obj.GetLonLatRect().South);
			eastArr.push(obj.GetLonLatRect().East);
			westArr.push(obj.GetLonLatRect().West);
			if(type === "line") {
				top.LayerManagement.earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude + 50, 0.0, 89.0, 0, 4);
			} else {
				top.LayerManagement.earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, 50.0, 45.3, 0, 5);
			}
			if(chkFlag === "true") {
				if(flag === "true") {
					obj.HightLightIsFlash(false);
					obj.ShowHighLight();
				} else {
					if(chkArr && chkArr.length > 0) {
						var ck = true;
						for(var j = 0; j < chkArr.length; j++) {
							if(chkArr[j].key === obj.GetKey()) {
								ck = false;
								obj.HightLightIsFlash(true);
								setTimeout(function() {
									obj.HightLightIsFlash(false);
									obj.ShowHighLight();
								}, 100);
							}
						}
						if(ck) {
							obj.HightLightIsFlash(true);
							obj.ShowHighLight();
						}
					} else {
						obj.HightLightIsFlash(true);
						obj.ShowHighLight();
					}
				}
			} else {
				clearHighLight();
				obj.HightLightIsFlash(true);
				obj.ShowHighLight();
				dbClickHighLight.splice(0, 1);
				dbClickHighLight.push(obj);
			}
			if(showTag) {
				showTag = false;
				northArr.sort();
				southArr.sort();
				eastArr.sort();
				westArr.sort();
				var TO_RADIAN = 0.017453292519943295769236907684886;
				var SemiMajor = 6378.137;
				var width = Math.abs(eastArr[0] - westArr[westArr.length - 1]);
				var height = Math.abs(northArr[0] - southArr[southArr.length - 1]);
				var x = Math.abs((eastArr[0] + westArr[westArr.length - 1]) / 2);
				var y = Math.abs((northArr[0] + southArr[southArr.length - 1]) / 2);
				var vAltitude = top.LayerManagement.earth.Measure.MeasureTerrainAltitude(x, y);
				var vAspect1 = width / height;
				var vAspect = top.LayerManagement.earth.offsetWidth / top.LayerManagement.earth.offsetHeight;
				var vRange = 100;
				if(vAspect1 > vAspect) {
					vRange = width * TO_RADIAN * SemiMajor * 1000 / Math.tan(22.5 * vAspect * TO_RADIAN);
				} else {
					vRange = height * TO_RADIAN * SemiMajor * 1000 / Math.tan(22.5 * TO_RADIAN);
				}
				top.LayerManagement.earth.GlobeObserver.GotoLookat(x, y, vAltitude, 0, 89.0, 0, vRange);
			}
			if(!isShowResult && bShow) {
				var parentLayerName = obj.GetParentLayerName();
				var cArr = parentLayerName.split("=");
				var cArr = cArr[1].split("_");
				var layer2 = top.LayerManagement.earth.LayerManager.GetLayerByGUID(cArr[0]);
				if(cArr.length > 1) {
					var bLine = parentLayerName.indexOf("container") > -1 ? 1 : 0;
					var filed = top.getName("US_KEY", bLine, true);
					var strPara2 = "(and,equal," + filed + "," + key + ")";
					var param = layer2.QueryParameter;
					param.Filter = strPara2;
					param.QueryType = 16;
					param.QueryTableType = bLine;
					param.PageRecordCount = 1;
					var result = layer2.SearchFromGISServer();
					if(result.RecordCount > 0) {
						var currentRecord = top.$.xml2json(result.gotoPage(0)).Result.Record;
						if(currentRecord == null || currentRecord == undefined) {
							top.LayerManagement.clearHtmlBalloons();
							return;
						}
						//显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
						if(top.SYSTEMPARAMS.balloonAlpha > 0) {
							htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
						} else {
							htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:255px;height:275px;font-family:Microsoft Yahei;border:1px solid #ccc;margin-top:15px;margin-bottom:15px"><table style="font-size:16px; color: black">';
						}
						var mid;
						if(type != "line") {
							initPointValue(layerID, currentRecord, parentLayerName, obj);
						} else {
							mid = initLineValue(layerID, currentRecord, parentLayerName);
							htmlStr = htmlStr + mid + '</table></div>';
							top.LayerManagement.showHtmlBalloon(obj.SphericalTransform.Longitude, obj.SphericalTransform.Latitude, obj.SphericalTransform.Altitude, htmlStr);
						}
					}
				}
			}

			hidenArr.push(obj);
			return;
		}
	}
	if(obj == null && type === "point") {
		if(subLayer.LocalSearchParameter) {
			clearHighLight();
			StatisticsMgr.sphereGotoLookat(key, subLayer, layerID, key, bShow, null, null);
		}
	}
};

///////////////////////////////////////////////////////////
//  双击获取属性
//////////////////////////////////////////////////////////
function getPlaneCoordinates(layerID, data, usKey) {
	var Record = null;
	var jsonData = $.xml2json(data);
	var us_key = top.getName("US_KEY", 0, true);
	if(jsonData == null || !jsonData.Result || jsonData.Result.num == 0) {
		return;
	} else if(jsonData.Result.num == 1) {
		Record = jsonData.Result.Record;
		if(jsonData.Result.Record[us_key] != usKey) {
			return false;
		}
	} else if(jsonData.Result.num > 1) {
		for(var i = 0; i < jsonData.Result.num; i++) {
			if(jsonData.Result.Record[i][us_key] != usKey) {
				continue;
			} else {
				Record = jsonData.Result.Record[i];
			}
		}
	}
	var Coordinates = Record.SHAPE.Point.Coordinates;
	var coord = Coordinates.split(" ");
	var coordinate1 = coord[0].split(",");
	var Coordinate = transformToPlaneCoordinates(layerID, coordinate1);
	return Coordinate;
}

function transformToPlaneCoordinates(layerId, coord) {
	var datum = top.SYSTEMPARAMS.pipeDatum;
	var v3s1 = datum.des_BLH_to_src_xy(coord[0], coord[1], coord[2]); //经纬度转平面坐标
	return {
		datumCoord: v3s1,
		originCoord: coord
	};
}

var initNotLineValue = function(layerID, record, obj) {
	var strKey = record[top.getName("US_KEY", 0, true)];
	var road = record[top.getName("US_ROAD", 0, true)];
	var isScra = record[top.getName("US_IS_SCRA", 0, true)];
	var bdTime = record[top.getName("US_BD_TIME", 0, true)];
	var fxYear = record[top.getName("US_FX_YEAR", 0, true)];
	var owner = record[top.getName("US_OWNER", 0, true)];
	var state = record[top.getName("US_UPDATE", 0, true)];
	var update = record[top.getName("US_UPDATE", 0, true)];
	var altitude = (parseFloat(record[top.getName("US_PT_ALT", 0, true)])).toFixed(2);
	var attachment = record[top.getName("US_ATTACHMENT", 0, true)];
	var pointType = record[top.getName("US_PT_TYPE", 0, true)];

	var str_caption = top.getNameNoIgnoreCase("US_KEY", 0, false);
	var road_caption = top.getNameNoIgnoreCase("US_ROAD", 0, false);
	var isScra_caption = top.getNameNoIgnoreCase("US_IS_SCRA", 0, false);
	var bdTime_caption = top.getNameNoIgnoreCase("US_BD_TIME", 0, false);
	var fxYear_caption = top.getNameNoIgnoreCase("US_FX_YEAR", 0, false);
	var owner_caption = top.getNameNoIgnoreCase("US_OWNER", 0, false);
	var state_caption = top.getNameNoIgnoreCase("US_UPDATE", 0, false);
	var update_caption = top.getNameNoIgnoreCase("US_UPDATE", 0, false);
	var altitude_caption = top.getNameNoIgnoreCase("US_PT_ALT", 0, false);
	var attachment_caption = top.getNameNoIgnoreCase("US_ATTACHMENT", 0, false);
	var pointType_caption = top.getNameNoIgnoreCase("US_PT_TYPE", 0, false);

	//井类型 井直径 井脖深 井底深 井盖类型  井盖规格 井盖材质  井材质  旋转角度  偏心井点号
	var us_well = record[top.getName("US_WELL", 0, true)];
	var us_wdia = record[top.getName("US_WDIA", 0, true)];
	var us_ndeep = (parseFloat(record[top.getName("US_NDEEP", 0, true)])).toFixed(2);
	var us_wdeep = (parseFloat(record[top.getName("US_WDEEP", 0, true)])).toFixed(2);
	var us_plate = record[top.getName("US_PLATE", 0, true)];
	var us_psize = (parseFloat(record[top.getName("US_PSIZE", 0, true)])).toFixed(2);
	var us_pmater = record[top.getName("US_PMATER", 0, true)];
	var us_wmater = record[top.getName("US_WMATER", 0, true)];
	var us_angle = record[top.getName("US_ANGLE", 0, true)];
	var us_offset = record[top.getName("US_OFFSET", 0, true)];

	var us_well_caption = top.getNameNoIgnoreCase("US_WELL", 0, false);
	var us_wdia_caption = top.getNameNoIgnoreCase("US_WDIA", 0, false);
	var us_ndeep_caption = top.getNameNoIgnoreCase("US_NDEEP", 0, false);
	var us_wdeep_caption = top.getNameNoIgnoreCase("US_WDEEP", 0, false);
	var us_plate_caption = top.getNameNoIgnoreCase("US_PLATE", 0, false);
	var us_psize_caption = top.getNameNoIgnoreCase("US_PSIZE", 0, false);
	var us_pmater_caption = top.getNameNoIgnoreCase("US_PMATER", 0, false);
	var us_wmater_caption = top.getNameNoIgnoreCase("US_WMATER", 0, false);
	var us_angle_caption = top.getNameNoIgnoreCase("US_ANGLE", 0, false);
	var us_offset_caption = top.getNameNoIgnoreCase("US_OFFSET", 0, false);

	if(road == undefined) {
		road = "";
	}
	if(isScra == undefined) {
		isScra = "";
	}
	if(bdTime == undefined) {
		bdTime = "";
	}
	if(fxYear == undefined) {
		fxYear = "";
	}
	if(owner == undefined) {
		owner = "";
	}
	if(state == undefined) {
		state = "";
	}
	if(update == undefined) {
		update = "";
	}
	var v3s = null;
	var us_key = top.getName("US_KEY", 0, true);
	var strPara = "(and,equal," + us_key + ",";
	strPara += strKey;
	strPara += ")";
	var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(layerID);
	var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc=" + strPara + "&pg=0,100";
	top.LayerManagement.earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
		if(pRes.ExcuteType == top.SystemSetting.excuteType) {
			var xmlStr = pRes.AttributeName;
			var xmlDoc = loadXMLStr(xmlStr);
			v3s = getPlaneCoordinates(layerID, xmlDoc, strKey);
			var tv3s = v3s["datumCoord"];
			originCoord = v3s["originCoord"];
			var X = "";
			var Y = "";
			if(tv3s) {
				X = (parseFloat(tv3s.X)).toFixed(2);
				Y = (parseFloat(tv3s.Y)).toFixed(2);
			}
			var str = "";
			str += '<tr><td style="word-wrap:break-word;" width="100">&nbsp;&nbsp;&nbsp;&nbsp;' + str_caption + '</td><td style="word-wrap:break-word;" width="150">&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + record[top.getName("US_KEY", 0, true)] + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;X坐标</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + X + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;Y坐标</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + Y + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + altitude_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + altitude + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + pointType_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + (pointType == undefined ? "" : pointType) + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + attachment_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + (attachment == undefined ? "" : attachment) + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + road_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + road + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + owner_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + owner + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + bdTime_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + bdTime + '</td></tr>';
			str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + state_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + state + '</td></tr>';
			//井相关字段处理
			if(us_well) {
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_well_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_well + '</td></tr>';
			}
			if(us_wdia && Number(us_wdia)) {
				us_wdia = Number(us_wdia).toFixed(2);
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_wdia_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_wdia + '</td></tr>';
			}
			if(us_ndeep && Number(us_ndeep)) {
				us_ndeep = Number(us_ndeep).toFixed(2);
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_ndeep_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_ndeep + '</td></tr>';
			}
			if(us_wdeep && Number(us_wdeep)) {
				us_wdeep = Number(us_wdeep).toFixed(2);
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_wdeep_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_wdeep + '</td></tr>';
			}
			if(us_plate) {
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_plate_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_plate + '</td></tr>';
			}
			if(us_psize) {
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_psize_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_psize + '</td></tr>';
			}
			if(us_pmater) {
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_pmater_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_pmater + '</td></tr>';
			}
			if(us_wmater) {
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_wmater_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_wmater + '</td></tr>';
			}
			if(us_angle && Number(us_angle)) {
				us_angle = Number(us_angle).toFixed(2);
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_angle_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_angle + '</td></tr>';
			}
			if(us_offset) {
				str += '<tr><td>&nbsp;&nbsp;&nbsp;&nbsp;' + us_offset_caption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + "   " + us_offset + '</td></tr>';
			}
			htmlStr = htmlStr + str + '</table></div>';
			if(obj != null) {
				var vecCenter = obj.SphericalTransform;
				top.LayerManagement.showHtmlBalloon(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, htmlStr);
			}
		}
	}
	top.LayerManagement.earth.DatabaseManager.GetXml(strConn);
}

var initPointValue = function(layerID, record, layerName, obj) {
	var strKey = record[top.getName("US_KEY", 0, true)];
	var v3s = null;
	var us_key = top.getName("US_KEY", 0, true);
	var strPara = "(and,equal," + us_key + ",";
	strPara += strKey;
	strPara += ")";
	var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(layerID);
	var layerCode = layer.PipeLineType;
	var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc=" + strPara + "&pg=0,100";
	top.LayerManagement.earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
		if(pRes.ExcuteType == top.SystemSetting.excuteType) {
			var xmlStr = pRes.AttributeName;
			var xmlDoc = loadXMLStr(xmlStr);
			v3s = getPlaneCoordinates(layerID, xmlDoc, strKey);
			var tv3s = v3s["datumCoord"];
			originCoord = v3s["originCoord"];
			var X = "";
			var Y = "";
			if(tv3s) {
				X = (parseFloat(tv3s.X)).toFixed(2);
				Y = (parseFloat(tv3s.Y)).toFixed(2);
			}

			var us_well = record[top.getName("US_WELL", 0, true)];
			var fieldArr = [];

			fieldArr = top.STAMP_config.PointProperty.DEFAULTPOINT;
			var str = "";
			for(var i = 0; i < fieldArr.length; i++) {
				var fieldCaption = top.getName(fieldArr[i], 0, false); //显示字段
				var fieldName = top.getName(fieldArr[i], 0, true); //数据库字段
				var fieldValue = record[fieldName] || "";
				var fieldType = "";
				if(fieldArr[i] == "US_PT_TYPE") {
					fieldType = "PointType";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				} else if(fieldArr[i] == "US_ATTACHMENT") {
					fieldType = "Attachment";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				} else if(fieldArr[i] == "US_PRESSUR") {
					fieldType = "Pressure";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				} else if(fieldArr[i] == "US_LTTYPE") {
					fieldType = "LayoutType";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				} else if(fieldArr[i] == "US_LTYPE") {
					fieldType = "LineType";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				} else if(fieldArr[i] == "US_PMATER") {
					fieldType = "MaterialType";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				} else if(fieldArr[i] == "US_OWNER") {
					fieldType = "Ownership";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				} else if(fieldArr[i] == "US_BD_TIME") {
					fieldValue = fieldValue.substr(0, 10);
					fieldValue = fieldValue.replace(/-/g, "/");
				} else if(fieldArr[i] == "US_STATUS") {
					fieldType = "StatusType";
					fieldValue = top.getCaptionByCustomValue(layerCode, fieldType, fieldValue);
				}
				if(fieldArr[i] == "X") {
					fieldCaption = "X坐标";
					fieldValue = X;
				} else if(fieldArr[i] == "Y") {
					fieldCaption = "Y坐标";
					fieldValue = Y;
				}
				if(Number(fieldValue) && (fieldArr[i] == "US_PT_ALT" || fieldArr[i] == "US_NDEEP" || fieldArr[i] == "US_WDEEP" || fieldArr[i] == "US_PSIZE" || fieldArr[i] == "US_WDIA" || fieldArr[i] == "US_ANGLE")) {
					fieldValue = parseFloat(fieldValue).toFixed(2);
				}
				str += '<tr><td  width="100">&nbsp;&nbsp;&nbsp;&nbsp;' + fieldCaption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + fieldValue || "" + '</td></tr>';
			}
			htmlStr = htmlStr + str + '</table></div>';
			if(obj != null) {
				var vecCenter = obj.SphericalTransform;
				top.LayerManagement.showHtmlBalloon(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, htmlStr);
			}
		}
	}
	top.LayerManagement.earth.DatabaseManager.GetXml(strConn);
};

var initLineValue = function(layerID, record, layerName) {
	var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(layerID);
	var intLayerCode = layer.PipeLineType;
	var fieldArr = [];
	if(intLayerCode >= 1000 && intLayerCode < 2000) { //电力管线
		fieldArr = top.STAMP_config.LineProperty.DLLINE;
	} else if(intLayerCode >= 2000 && intLayerCode < 3000) { //电信
		fieldArr = top.STAMP_config.LineProperty.DXLINE;
	} else if(intLayerCode >= 3000 && intLayerCode < 4000) { //给水
		fieldArr = top.STAMP_config.LineProperty.JSLINE;
	} else if(intLayerCode >= 4000 && intLayerCode < 5000) { //排水
		fieldArr = top.STAMP_config.LineProperty.PSLINE;
	} else if(intLayerCode >= 5000 && intLayerCode < 6000) { //燃气
		fieldArr = top.STAMP_config.LineProperty.RQLINE;
	} else if(intLayerCode >= 6000 && intLayerCode < 7000) { //热力
		fieldArr = top.STAMP_config.LineProperty.RLLINE;
	} else if(intLayerCode >= 7000 && intLayerCode < 8000) { //工业
		fieldArr = top.STAMP_config.LineProperty.GYLINE;
	} else { //其他
		fieldArr = top.STAMP_config.LineProperty.DEFAULTLINE;
	}

	var str = "";

	for(var i = 0; i < fieldArr.length; i++) {
		var fieldCaption = top.getName(fieldArr[i], 1, false); //显示字段
		var fieldName = top.getName(fieldArr[i], 1, true); //数据库字段
		var fieldValue = record[fieldName] || "";
		var fieldType = "";
		if(fieldArr[i] == "US_PT_TYPE") {
			fieldType = "PointType";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		} else if(fieldArr[i] == "US_ATTACHMENT") {
			fieldType = "Attachment";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		} else if(fieldArr[i] == "US_PRESSUR") {
			fieldType = "Pressure";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		} else if(fieldArr[i] == "US_LTTYPE") {
			fieldType = "LayoutType";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		} else if(fieldArr[i] == "US_LTYPE") {
			fieldType = "LineType";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		} else if(fieldArr[i] == "US_PMATER") {
			fieldType = "MaterialType";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		} else if(fieldArr[i] == "US_OWNER") {
			fieldType = "Ownership";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		} else if(fieldArr[i] == "US_BD_TIME") {
			fieldValue = fieldValue.substr(0, 10);
			fieldValue = fieldValue.replace(/-/g, "/");
		} else if(fieldArr[i] == "US_STATUS") {
			fieldType = "StatusType";
			fieldValue = top.getCaptionByCustomValue(intLayerCode, fieldType, fieldValue);
		}
		if(fieldArr[i] == "US_SIZE" && fieldValue.indexOf('X') == -1) {
			fieldValue = parseFloat(parseFloat(fieldValue).toFixed(2));
		}
		str += '<tr><td  width="100">&nbsp;&nbsp;&nbsp;&nbsp;' + fieldCaption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + fieldValue || "" + '</td></tr>';
	}

	return str;
};
var clearSearchResult = function() {
	var flag = $("#showResult").attr("checked");
	if(flag) {
		return;
	}
	if(thisSearchLayer) {
		thisSearchLayer.ClearSearchResult();
		thisSearchLayer = null;
	}
}
//清除双击高亮
var clearHighLight = function() {
	if(dbClickHighLight.length > 0 && top.LayerManagement.earth != null) {
		dbClickHighLight[0].StopHighLight();
	}
	clearSearchResult();
}
/**
 * 功能：显示结果
 * 参数：checkTag-checkbox选中状态 ,highlightObjectList-高亮对象数组
 * 返回值：无
 */
function analysisShowResult(checkTag, highlightObjectList, lineType, pointType) {
	var layerArr = [];
	var resultObj = [];
	for(var i = 0; i < highlightObjectList.length; i++) {
		var thisLayerId = highlightObjectList[i].layerId;
		if($.inArray(thisLayerId, layerArr) < 0) {
			layerArr.push(thisLayerId);
			resultObj[thisLayerId] = {};
			resultObj[thisLayerId].lineArr = "";
			resultObj[thisLayerId].pointArr = "";
		}
		if(highlightObjectList[i].type == "point") {

			if(resultObj[thisLayerId].pointArr == "") {
				resultObj[thisLayerId].pointArr += highlightObjectList[i].key;
			} else {
				resultObj[thisLayerId].pointArr += "," + highlightObjectList[i].key;
			}
		} else {
			if(resultObj[thisLayerId].lineArr == "") {
				resultObj[thisLayerId].lineArr += highlightObjectList[i].key;
			} else {
				resultObj[thisLayerId].lineArr += "," + highlightObjectList[i].key;
			}
		}
	}

	for(var layerId in resultObj) {
		if(resultObj[layerId].pointArr != "") {
			highlightObjects(layerId, "point", resultObj[layerId].pointArr, checkTag, lineType, pointType);
		}
		if(resultObj[layerId].lineArr != "") {
			highlightObjects(layerId, "line", resultObj[layerId].lineArr, checkTag, lineType, pointType);
		}

	}
};

function stopHideArrObj() {
	if(hidenArr && hidenArr.length) {
		for(var i = 0; i < hidenArr.length; i++) {
			if(hidenArr[i]) {
				hidenArr[i].StopHighLight();
			}
		}
	}
}

//计算两个线之间的距离
function lineToline(line1, line2) {
	var line1Arr = line1.split(" ");
	for(var i = 0; i < line1Arr.length; i++) {
		line1Arr[i] = line1Arr[i].split(",");
	}
	var line2Arr = line2.split(",");
	var points1 = top.LayerManagement.earth.Factory.CreateVector3s();
	for(var i = 0; i < line1Arr.length; i++) {
		points1.Add(line1Arr[i][0], line1Arr[i][1], line1Arr[i][2]);
	}
	var points2 = top.LayerManagement.earth.Factory.CreateVector3s();
	for(var i = 0; i < line2Arr.length; i += 3) {
		points2.Add(line2Arr[i], line2Arr[i + 1], line2Arr[i + 2]);
	}
	var result = top.LayerManagement.earth.GeometryAlgorithm.CalculateLineLineDistance(points1, points2);
	if(result === null) {
		return 0;
	} else {
		return result.Length;
	}

}
//点到建筑底面的距离
function lineToPoylon(line, polygon) {
	var lineArr = line.split(" ");
	for(var i = 0; i < lineArr.length; i++) {
		lineArr[i] = lineArr[i].split(",");
	}
	var points = top.LayerManagement.earth.Factory.CreateVector3s();
	for(var i = 0; i < lineArr.length; i++) {
		points.Add(lineArr[i][0], lineArr[i][1], lineArr[i][2]);
	}
	var result = top.LayerManagement.earth.GeometryAlgorithm.CalculateLinePolygonDistance(line, polygon);
	if(result === null) { //面和线相交
		return 0;
	} else {
		return result.Length;
	}
}
/***********************************************************************************************************************/