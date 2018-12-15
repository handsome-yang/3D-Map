/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：查询功能模块相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/

$.support.cors = true; //开启jQuery跨域支持
var layers = null; //图层对象数组
var searchResult = self.searchResult || parent.searchResult; //搜索结果对象
var searchCurrpage = 0; //查询的当前页面
var searchTree; //查询树
var layerGuid = ""; //图层id
var myicon = null; //图标
var htmlBalloonXY = null; //气泡
var selectLayer = top.LayerManagement.selectLayer; //所选图层
var currentPOIObj = null;
if(!STAMP) {
	var STAMP = {};
}

STAMP.Search = function(earth) {
	var __returnDataType__ = 'xml';
	var config = self.params || parent.params;
	var balloonAlpha = 0xcc;
	var systemParams = self.SYSTEMPARAMS || parent.SYSTEMPARAMS;
	if(systemParams && systemParams.balloonAlpha && !isNaN(systemParams.balloonAlpha)) {
		balloonAlpha = systemParams.balloonAlpha;
	}
	var search = {};
	var drawV3s = null;
	/**
	 * 根据图层类型，获取图标路径
	 * @param layerType 图层类型
	 * @return 图标样式
	 */
	var _getLayerIcon = function(layerType) {
		var icon = "";
		if(layerType != "Folder") {
			icon = '../../image/layer/layer_' + layerType.toLowerCase() + '.gif';
		}
		return icon;
	};
	/**
	 * 将管线子图层中的英文名标识改为中文标识
	 * @param name
	 * @return {*}
	 */
	var _enName2cnName = function(name) {
		var map = {
			"equipment": "附属",
			"container": "管线",
			"well": "井",
			"joint": "附属点",
			"plate": "井盖"
		};
		if(map[name]) {
			name = map[name];
		}
		return name;
	};
	/**
	 * 获取图层数据
	 * @param layer 图层根节点
	 * @param bWithIcon 是否需要图标
	 * @return 图层数据数组
	 */
	var getLayerData = function(layer, bWithIcon) {
		if(!layer) {
			layer = earth.LayerManager.LayerList;
		}
		var layerData = [];
		var childCount = layer.GetChildCount();
		for(var i = 0; i < childCount; i++) {
			var childLayer = layer.GetChildAt(i);
			var name = _enName2cnName(childLayer.Name);

			var data = {
				"id": childLayer.Guid,
				"name": name,
				"checked": childLayer.Visibility
			};
			if(bWithIcon) {
				data["icon"] = _getLayerIcon(childLayer.LayerType);
			}
			if(childLayer.GetChildCount() > 0) {
				data.children = getLayerData(childLayer, true);
			}
			layerData.push(data);
		}
		return layerData;
	};

	/**
	 * 翻页
	 * @param {Object} searchResult 查询结果
	 * @param {Object} currPage  当前页
	 */
	var GotoPage = function(searchResult, currPage) {
		var layerObj = earth.LayerManager.GetLayerByGUID(selectLayer);
		var searchParam = layerObj.LocalSearchParameter;
		var tmptype = searchParam.ReturnDataType;
		if(__returnDataType__ == 'json') {
			searchParam.ReturnDataType = (layerObj.LayerType == 'POI' ? 5 : 5);
		} else if(__returnDataType__ == 'xml') {
			searchParam.ReturnDataType = (layerObj.LayerType == 'POI' ? 1 : 1);
		} else {
			searchParam.ReturnDataType = 1; //;
		}

		var result = searchResult.GotoPage(currPage);
		searchParam.ReturnDataType = tmptype;
		return result;
	};

	/**
	 * 初始化基础图层树
	 */
	var initLayerTree = function() {
		var layerManager = STAMP.LayerManager(earth);
		var zNodes = getLayerData(null, true);
		var setting = {
			check: {
				enable: true,
				chkStyle: "checkbox",
				chkboxType: {
					"Y": "ps",
					"N": "ps"
				}
			},
			view: {
				dblClickExpand: false,
				//双击节点时，是否自动展开父节点的标识
				expandSpeed: "",
				//节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
				selectedMulti: false //设置是否允许同时选中多个节点
			},
			callback: {
				onClick: function(event, treeId, node) {
					layerGuid = node.id;
					var currLayer = earth.LayerManager.GetLayerByGUID(layerGuid);
					if(currLayer.LayerType == "Model") {
						$("#search_tips").removeAttr("disabled");
					} else {
						$("#search_tips").attr("disabled", "disabled");
					}
				},
				onDblClick: function(event, treeId, node) {
					if(node && node.id) {
						var layer = earth.LayerManager.GetLayerByGUID(node.id);
						if(layer.LayerType) {
							layerManager.flyToLayer(layer); //定位图层
						}
					}
				},
				onCheck: function(event, treeId, node) {
					layerGuid = node.id;
					var currLayer = earth.LayerManager.GetLayerByGUID(layerGuid);
					if(currLayer.LayerType == "Model") {
						$("#search_tips").removeAttr("disabled");
					} else {
						$("#search_tips").attr("disabled", "disabled");
					}
				}
			}
		};

		searchTree = $.fn.zTree.init($("#searchTree"), setting, zNodes);
		searchTree.checkAllNodes(false);

	}

	/**
	 * 初始化
	 */
	var loadSearch = function(earth) {
		if(earth == null) {
			earth = self.earth || parent.earth;
		}
	}
	/**
	 * 设置查询结果的颜色
	 */
	var clearDateList = function() {
		var n = document.all.selectFalg.rows.length;
		for(var i = 0; i < n; i++) {
			document.getElementById("rows" + i).style.backgroundColor = '#FFFFFF';
		}
	}
	/**
	 * 关键字查询面板展开
	 */
	var keywordSearchBtnClick = function(id) {
		if($("#keywordSearch").attr("disabled") == "disabled") {
			return;
		}
		showDialog('html/search/keywordSerResult.html', id);
	}
	/**
	 * 兴趣点查询面板展开
	 */
	var poiSearchBtnClick = function(id) {
		showDialog('html/search/keywordSerResult.html?poiLayerId=poi', id);
	};
	/**
	 * 关键字搜索
	 */
	var searchTag = true;
	var keyWordSearch = function(layerId) {
		selectLayer = layerId;
		var keyword = document.getElementById("searchkey").value;
		if("" == keyword || null == keyword || keyword == undefined) {
			alert("请输入关键字");
			return;
		}
		searchTag = false;
		var queryLayer = "";
		if(typeof layerId != 'undefined' && layerId != null && layerId != '') {
			queryLayer = earth.LayerManager.GetLayerByGUID(layerId);
		} else {
			queryLayer = earth.LayerManager.GetLayerByGUID(selectLayer);
		}
		if(queryLayer != "" && queryLayer != null) {
			if(queryLayer.LayerType == "GISVector" || queryLayer.LayerType == "GISPOI") {
				//对GISVector和GISPOI类型的进行查询
				onGeoSearchCallback(keyword, null);
			} else {
				//一般的关键字查询
				onSearchCallback(keyword, null, layerId);
			}
		}
	};
	var layerTd = function() {
		if(selectLayer) {
			var layer = earth.LayerManager.GetLayerByGUID(selectLayer);
			var name = _enName2cnName(layer.Name);
			document.getElementById("layerTd").innerText = "查询图层" + ":" + name;
		}

	};
	/**
	 * 将管线子图层中的英文名标识改为中文标识
	 * @param name
	 * @return {*}
	 */
	var _enName2cnName = function(name) {
		var map = {
			"equipment": "附属",
			"container": "管线",
			"well": "井",
			"joint": "附属点",
			"plate": "井盖"
		};
		if(map[name]) {
			name = map[name];
		}
		return name;
	};
	/**
	 * 点搜索
	 */
	var pointSearch = function() {
		if(layerGuid == "") {
			alert("请先选择一个图层");
			return;
		}
		earth.Event.OnPickObjectEx = function(args) {
			earth.Query.FinishPick();
			if(args != null) {
				var color = parseInt("0x77ff0000");
				args.ShowHighLight();
				var htmlStr = '<table style="width:100%;"><tr>';
				htmlStr = htmlStr + '<td>' + 1 + '</td>';
				htmlStr = htmlStr + '<td>' + args.GetKey() + '</td>';
				htmlStr = htmlStr + '</tr></table>';
				document.getElementById("searchData").innerHTML = htmlStr;
				$("#pageDiv").hide();
			}
		};
		var query = earth.Query;
		query.PickObjectEx(127);
	}

	/**
	 *功能：根据一个经纬高程点生成一条短线，用于点搜索
	 *参数：经纬高程
	 *调用：pointSearch方法调用
	 */
	var generateGeoPoints = function(geoPoint) {
		var geoPoints = earth.Factory.CreateGeoPoints();
		geoPoints.Add(geoPoint.Longitude, geoPoint.Latitude, geoPoint.altitude);
		return geoPoints;
	}

	/**
	 * 面搜索
	 */
	var polygonSearch = function(id) {
		if(drawV3s == null) {
			alert("请先绘制多边形");
			return;
		}
		selectLayer = id;
		var pval = drawV3s;
		var layer = earth.LayerManager.GetLayerByGUID(selectLayer);
		if(layer && (layer.layerType != "GISVector" && layer.layerType != "GISPOI")) {
			onSearchCallback("", pval, "", id);
		} else {
			var pointString = "";
			for(var i = 0; i < pval.Count; i++) {
				if(pointString === "") {
					pointString = pointString + pval.Items(i).X + "," + pval.Items(i).Y + "," + 0;
				} else {
					pointString = pointString + "," + pval.Items(i).X + "," + pval.Items(i).Y + "," + 0;
				}
			}
			var sc = "(2" + "," + pval.Count + "," + pointString + ")";
			onGeoSearchCallback("", sc, id);
		}
	}

	/*
	 * 绘制面
	 */
	var drawPolygon = function(layerId) {
		drawV3s = null;
		earth.ShapeCreator.Clear();
		earth.Event.OnCreateGeometry = function(pval, type) {
			drawV3s = pval;
			polygonSearch(layerId)
			earth.Event.OnCreateGeometry = function() {};
		}
		earth.ShapeCreator.CreatePolygon();
	}

	/*
	 * 绘制圆
	 */
	var drawCircle = function(layerId) {
		drawV3s = null;
		earth.ShapeCreator.Clear();
		earth.Event.OnCreateGeometry = function(pval, type) {
			drawV3s = pval;
			circleSearch(layerId);
			earth.Event.OnCreateGeometry = function() {};
		}
		earth.ShapeCreator.CreateCircle();
	}

	/*
	 * 绘制矩形框
	 */
	var drawRectangle = function(layerId) {
		drawV3s = null;
		earth.ShapeCreator.Clear();
		earth.Event.OnCreateGeometry = function(pval, type) {
			drawV3s = pval;
			rectangleSearch(layerId);
			earth.Event.OnCreateGeometry = function() {};
		}
		earth.ShapeCreator.CreateRectangle();
	}

	/**
	 * 圆搜索
	 */
	var circleSearch = function(id) {
		if(drawV3s == null) {
			alert("请先绘制圆");
			return;
		}
		selectLayer = id;
		var pval = drawV3s;
		var layer = earth.LayerManager.GetLayerByGUID(selectLayer);
		if(layer && (layer.layerType != "GISVector" && layer.layerType != "GISPOI")) {
			onSearchCallback("", pval, "", id);
		} else {
			var sc = "(3,0,";
			sc += pval.Radius + ",";
			sc += pval.Longitude + "," + pval.Latitude;
			sc += ")";
			onGeoSearchCallback("", sc, id);
		}
	}

	/**
	 * 矩形搜索
	 */
	var rectangleSearch = function(id) {
		if(drawV3s == null) {
			alert("请先绘制矩形");
			return;
		}
		selectLayer = id;
		var pval = drawV3s;
		var layer = earth.LayerManager.GetLayerByGUID(selectLayer);
		if(layer && (layer.layerType != "GISVector" && layer.layerType != "GISPOI")) {
			onSearchCallback("", pval, "", id);
		} else {
			var pointString = "";
			for(var i = 0; i < pval.Count; i++) {
				if(pointString === "") {
					pointString = pointString + pval.Items(i).X + "," + pval.Items(i).Y + "," + 0;
				} else {
					pointString = pointString + "," + pval.Items(i).X + "," + pval.Items(i).Y + "," + 0;
				}
			}
			var sc = "(2" + "," + pval.Count + "," + pointString + ")";
			onGeoSearchCallback("", sc, id);
		}
	};
	/**
	 * 范围搜索回调函数
	 */
	var caculateHeight = function() {
		var dlgHeight = $(parent.document).height() - 110;
		pageRecordCount = parseInt((dlgHeight - 200) / 27);
		parent.pageRecordCount = parseInt((dlgHeight - 80) / 27);
	};
	caculateHeight();

	//坐标查询
	var coordSearchBtnClicked = function() {
		if($("#coordSearch").attr("disabled") == "disabled") {
			return;
		}
		earth.Event.OnHtmlBalloonFinished = function() {};
		earth.Event.OnCreateGeometry = function(pval) {
			if(htmlBalloonXY != null) {
				htmlBalloonXY.DestroyObject();
				htmlBalloonXY = null;
			}
			if(pval) {
				var longitude = pval.Longitude.toFixed(3);
				var latitude = pval.Latitude.toFixed(3);
				var altitude = pval.Altitude.toFixed(2);
				var lonStr = "经度: ";
				var latitudeStr = "纬度: ";
				if(SYSTEMPARAMS.spatialUrl && earth.Environment.UseLocalCoord == true) {
					var pxy = SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(pval.Longitude, pval.Latitude, pval.Altitude);
					longitude = pxy.x.toFixed(2);
					latitude = pxy.y.toFixed(2);
					var lonStr = "X坐标:";
					var latitudeStr = "Y坐标:";
				}
				var ba = 0xcc;
				if(SYSTEMPARAMS.balloonAlpha && !isNaN(SYSTEMPARAMS.balloonAlpha)) {
					ba = parseInt(SYSTEMPARAMS.balloonAlpha);
				}

				var guid = earth.Factory.CreateGuid();
				htmlBalloonXY = earth.Factory.CreateHtmlBalloon(guid, "balloon");
				if(top.SYSTEMPARAMS.balloonAlpha == 0) {
					var htmlStr = '<table border="0" cellpadding="3" cellspacing="1" align="center" width="100%" ' +
						'style="font-size:16px;background-color:#b9d8f3;">';
					htmlStr = htmlStr + '<tr style="background-color:#f4faff;" >';
					htmlStr = htmlStr + '<td>' + lonStr + '</td>';
					htmlStr = htmlStr + '<td>' + longitude + '</td>';
					htmlStr = htmlStr + '</tr>';
					htmlStr = htmlStr + '<tr style="background-color:#f4faff;">';
					htmlStr = htmlStr + '<td>' + latitudeStr + '</td>';
					htmlStr = htmlStr + '<td>' + latitude + '</td>';
					htmlStr = htmlStr + '</tr>';
					htmlStr = htmlStr + '<tr style="background-color:#f4faff;">';
					htmlStr = htmlStr + '<td>高程:</td>';
					htmlStr = htmlStr + '<td>' + altitude + '</td>';
					htmlStr = htmlStr + '</tr>';
					htmlStr = htmlStr + '</table>';

					htmlBalloonXY.SetRectSize(250, 200);
					htmlBalloonXY.SetIsTransparence(false);
				} else {
					var htmlStr = '<table align="center" style="font-size:16px;background-color:#ffffff;color:#fffffe;">';
					htmlStr = htmlStr + '<tr>';
					htmlStr = htmlStr + '<td>' + lonStr + '</td>';
					htmlStr = htmlStr + '<td>' + longitude + '</td>';
					htmlStr = htmlStr + '</tr>';
					htmlStr = htmlStr + '<tr>';
					htmlStr = htmlStr + '<td>' + latitudeStr + '</td>';
					htmlStr = htmlStr + '<td>' + latitude + '</td>';
					htmlStr = htmlStr + '</tr>';
					htmlStr = htmlStr + '<tr>';
					htmlStr = htmlStr + '<td>高程:</td>';
					htmlStr = htmlStr + '<td>' + altitude + '</td>';
					htmlStr = htmlStr + '</tr>';
					htmlStr = htmlStr + '</table>';

					htmlBalloonXY.SetRectSize(200, 130);
					htmlBalloonXY.SetIsTransparence(true);
					htmlBalloonXY.SetBackgroundAlpha(0xcc);
				}
				htmlBalloonXY.SetSphericalLocation(pval.Longitude, pval.Latitude, pval.Altitude);
				htmlBalloonXY.SetTailColor(0xffffff00);
				htmlBalloonXY.SetIsAddCloseButton(true);
				htmlBalloonXY.SetIsAddMargin(true);
				htmlBalloonXY.SetIsAddBackgroundImage(true);
				htmlBalloonXY.ShowHtml(htmlStr);
				earth.Event.OnHtmlBalloonFinished = function() {
					if(htmlBalloonXY != null) {
						htmlBalloonXY.DestroyObject();
						htmlBalloonXY = null;
						earth.Event.OnHtmlBalloonFinished = function() {};
					}
				}
				earth.Event.OnCreateGeometry = function() {};
				earth.ShapeCreator.Clear();
			} else {
				return;
			}
		};
		earth.ShapeCreator.CreatePoint();
	};

	//坐标定位
	var coordlocationBtnClicked = function() {
		if($("#coordlocation").attr("disabled") == "disabled") {
			return;
		}
		var analysis = STAMP.Analysis(earth);
		analysis.showMoveHtml("coordlocation");
	}

	var onSearchCallback = function(keyword, spatialObj, layerId, titleId) {
		if(!titleId) titleId = null;
		var layerValue = selectLayer;
		if(typeof layerId != 'undefined' && layerId != '') {
			layerValue = layerId;
		}
		searchResult = localSearch(layerValue, keyword, spatialObj);
		if((searchResult == null) || (searchResult.RecordCount == 0)) {
			search.emptyResultHtml();
			pagePagination();
		} else {
			search.showResult(1);
			pagePagination();
		}
	}

	/**
	 * 显示结果
	 * @param {Object} page 页
	 */
	var showGeoResult = function(page) {
		if(searchResult && searchResult.resultObj) {
			earth.DetachObject(searchResult.resultObj);
		}
		var pagging = "&pg=" + (page - 1) + "," + searchResult.perPage;
		var url = searchResult.url + pagging;
		var result = loadXMLStr(url + pagging);
		var resultObj = $.xml2json(result);
		if(resultObj && resultObj.Result && resultObj.Result.num != 0) {
			searchResult.currentResult = resultObj.Result.Record;
			//由于服务的bug导致第一条记录重复
			if(page != 1) {
				searchResult.currentResult.shift();
			}
			var records = searchResult.currentResult;
			var htmlStr = '<table style="width:100%;color:black" >';
			if(records != null && records != undefined && records.length == undefined) {
				var arr = [];
				arr.push(records);
				records = arr;
				searchResult.currentResult = records;
			}
			for(var i = 0; i < records.length; i++) {
				var name = records[i]["NAME"];
				var dataType = 'GISVector';
				var no = (page - 1) * pageRecordCount + i + 1;

				htmlStr = htmlStr + '<tr style="CURSOR: hand" ondblclick="search.goToGeoSearchObject(' + i + ',\'' + dataType + '\'' + ',\'' + name + '\'' + ')">';
				htmlStr = htmlStr + '<td width=\"30\" height=\"25\" class=\"\" nowrap>' + no + '</td>';
				htmlStr = htmlStr + '<td>' + name + '</td>';
				htmlStr = htmlStr + '</tr>';
			}
			htmlStr = htmlStr + '</table>';
			document.getElementById("searchData").style.display = "";
			document.getElementById("searchData").innerHTML = htmlStr;
			$("#searchData").resize();

			document.getElementById("pageDiv").style.display = "";
			var height = (pageRecordCount) * 27;
		}
	};
	//对gis数据进行查询
	var onGeoSearchCallback = function(pc, sc, titleId) {
		if(!titleId) titleId = null;
		if(pc) {
			caculateHeight(true);
		} else {
			caculateHeight();
		}
		var pcStr = "";
		if(pc != null && pc != '') {
			pcStr = '&pc=' + '(and,like,NAME,' + pc + ')';
		}
		var scStr = "";
		if(sc != null && sc != '') {
			scStr = '&sc=' + sc;
		}
		var url = config.ip + "/geoserver?service=" + selectLayer + "&qt=16" + scStr + pcStr;
		var result = loadXMLStr(url + "&pg=0," + pageRecordCount);
		var resultObj = $.xml2json(result);
		if(resultObj && resultObj.Result) {
			searchResult = {
				url: url,
				currentResult: resultObj.Result.Record,
				totalPageNum: Math.ceil(resultObj.Result.num / pageRecordCount),
				perPage: pageRecordCount,
				recordCount: resultObj.Result.num
			};
			if(searchResult.currentResult != null && searchResult.currentResult.length == undefined) {
				var arr = [];
				arr.push(searchResult.currentResult);
				searchResult.currentResult = arr;
			}
			if(searchTag) { //先搜索再弹出结果页面
				if((searchResult == null) || (searchResult.recordCount == 0)) {
					search.emptyResultHtml();
					pagePagination('geo');
				} else {
					search.showGeoResult(1);
					pagePagination('geo');
				}
			} else { //先弹出结果页面再搜索
				if((searchResult == null) || (searchResult.recordCount == 0)) {
					emptyResultHtml();
					pagePagination('geo');
				} else {
					showGeoResult(1);
					pagePagination('geo');
				}
			}
		} else {
			searchResult = null;
		}
	};

	//分页控件引用
	var pagePagination = function(type) {
		var totalPageNum;
		if(type == 'other' || !type) {
			totalPageNum = Math.ceil(searchResult.RecordCount / pageRecordCount);
		} else if(type == 'geo') {
			totalPageNum = searchResult.totalPageNum;
		} else if(totalPageNum == 0) {
			totalPageNum = 1;
		}
		$("#page").pagination({
			total: searchResult.recordCount,
			//总的记录数
			pageSize: pageRecordCount,
			//每页显示的大小。
			showPageList: false,
			showRefresh: false,
			displayMsg: "",
			pageNumber: 1,
			beforePageText: "",
			afterPageText: "/" + totalPageNum,
			onSelectPage: function(pageNumber, ps) { //选择相应的页码时刷新显示内容列表。
				if(type == 'other' || !type) {
					showResult(pageNumber);
				} else if(type == 'geo') {
					showGeoResult(pageNumber);
				}
			}
		});
	};
	/*
	 */
	var localSearch = function(guid, keyword, spatialObj) {
		var layerObj = earth.LayerManager.GetLayerByGUID(guid);
		var searchParam = layerObj.LocalSearchParameter;
		if(searchParam == null) {
			return;
		}
		searchParam.ClearSpatialFilter();
		if(searchParam == null) {
			return null;
		}
		top.clearSearchResult(layerObj); //清除上次查询的图层数据
		if(spatialObj) {
			searchParam.SetFilter("", "");
			searchParam.SetSpatialFilter(spatialObj);
		}
		if(keyword != "") {
			caculateHeight(true);
			searchParam.SetFilter(keyword, "");
		}

		searchParam.PageRecordCount = pageRecordCount;
		searchParam.HasDetail = true;
		searchParam.HasMesh = true;
		var tmptype = searchParam.ReturnDataType;
		if(__returnDataType__ == 'json') {
			searchParam.ReturnDataType = (layerObj.LayerType == 'POI' ? 5 : 5);
		} else if(__returnDataType__ == 'xml') {
			searchParam.ReturnDataType = (layerObj.LayerType == 'POI' ? 1 : 1);
		} else {
			searchParam.ReturnDataType = 4;
		}
		var result = layerObj.SearchFromLocal();
		searchParam.ReturnDataType = tmptype;
		return result;
	};

	/**
	 * 查询结果为空时的hmtl字符串
	 */
	var emptyResultHtml = function() {
		var Html = "";
		Html += '<div style="margin-top:100px;"><font color=#993300><b>没有找到符合条件的结果<b></font></div>';
		document.getElementById("searchData").innerHTML = Html;
		document.getElementById("pageDiv").style.display = "none";
	}

	var resultCache = [];
	var saveResult = function(resultXml) {
		resultCache = [];
		var resultObj = null;
		if(__returnDataType__ == 'json') {
			resultObj = JSON.parse(resultXml).Json;
		} else if(__returnDataType__ == 'xml') {
			resultObj = $.xml2json(resultXml);
		}

		if(resultObj.SearchResult != null && resultObj.SearchResult.total > 0) {
			var resultData = null;
			if(resultObj.SearchResult.ModelResult != null) {
				resultData = resultObj.SearchResult.ModelResult.ModelData;
			} else if(resultObj.SearchResult.POIResult != null) {
				resultData = resultObj.SearchResult.POIResult.POIData;
			} else if(resultObj.SearchResult.VectorResult != null) {
				resultData = resultObj.SearchResult.VectorResult.VectorData;
			}
			if(!$.isArray(resultData)) {
				resultData = [resultData];
			}
			for(var i = 0; i < resultData.length; i++) {
				resultCache.push(resultData[i]);
			}
		}
	}

	/**
	 * 查找结果项
	 * @param {Object} name 名称
	 */
	var findResultItem = function(name) {
		for(var i = 0; i < resultCache.length; i++) {
			var key = "SE_NAME";
			var data = resultCache[i];
			if(data[key].toLowerCase() == name.toLowerCase()) {
				return data;
			}
		}
		return null;
	}

	/**
	 * 截取查询结果数组中的一页数据
	 */
	var getShowResult = function(searchResult, currPage) {
		var resultXml = GotoPage(searchResult, currPage - 1);
		var resultDoc = loadXMLStr(resultXml);
		var dataRoot = resultDoc.documentElement.firstChild.firstChild;
		saveResult(resultXml);
		return dataRoot;
	}

	var getShowResult2 = function(searchResult, currPage) {
		var resultStr = GotoPage(searchResult, currPage - 1);
		saveResult(resultStr);
		var resultJson = JSON.parse(resultStr).Json.SearchResult;
		if(resultJson.ModelResult) {
			resultJson = resultJson.ModelResult;
		} else if(resultJson.POIResult) {
			resultJson = resultJson.POIResult;
		} else if(resultJson.VectorResult) {
			resultJson = resultJson.VectorResult;
		}
		return resultJson;
	}

	/**
	 * 获得查询结果进行展现
	 */
	var showResult = function(searchCurrpage) {
		if(__returnDataType__ == 'json') {
			return showResult2(searchCurrpage);
		}

		var pageSize = pageRecordCount;
		var totalPageNum = Math.ceil(searchResult.RecordCount / pageSize);
		var dataRoot = getShowResult(searchResult, searchCurrpage);
		var pageNum = searchCurrpage;
		var htmlStr = '<table style="width:100%;color:black" >';
		var no = 0;
		for(var i = 0; i < dataRoot.childNodes.length; i++) {
			var index = (pageNum - 1) * pageRecordCount + i;
			no = index + 1;
			var dataNode = dataRoot.childNodes[i];
			var name = dataNode.selectSingleNode("SE_NAME").text;
			var dataType = null;
			if(dataNode.tagName == "ModelData") {
				dataType = "Model";
			} else if(dataNode.tagName == "POIData") {
				dataType = "POI";
			} else if(dataNode.tagName == "VectorData") {
				dataType = 'Model';
			} else {
				dataType = "Model";
			}
			htmlStr = htmlStr + '<tr style="CURSOR: hand" ondblclick="search.goToSearchObject(' + index + ',\'' + dataType + '\'' + ',\'' + name + '\')">';
			htmlStr = htmlStr + '<td width=\"30\" height=\"25\" class=\"\" nowrap><font>' + no + '</font></td>';
			htmlStr = htmlStr + '<td width="160" style="word-wrap:break-word;">' + name + '</td>';
			htmlStr = htmlStr + '</tr>';
		}
		htmlStr = htmlStr + '</table>';
		document.getElementById("searchData").style.display = "";
		document.getElementById("searchData").innerHTML = htmlStr;
		$("#searchData").resize();
		document.getElementById("pageDiv").style.display = "";
		var height = (pageRecordCount) * 27;
		$("#searchData").css('overflow-y', 'auto');
	}

	var showResult2 = function(searchCurrpage) {
		var pageSize = pageRecordCount;
		var totalPageNum = Math.ceil(searchResult.RecordCount / pageSize);

		var dataRoot = getShowResult2(searchResult, searchCurrpage);
		var pageNum = searchCurrpage;
		var dataType = null;
		if(dataRoot.ModelData) {
			dataRoot = dataRoot.ModelData;
			dataType = 'Model';
		} else if(dataRoot.POIData) {
			dataRoot = dataRoot.POIData;
			dataType = 'POI';
		} else if(dataRoot.VectorData) {
			dataRoot = dataRoot.VectorData;
			dataType = 'Model';
		} else {
			dataRoot = dataRoot.ModelData;
			dataType = 'Model';
		}
		var htmlStr = '<table style="width:100%;color:black" >';
		var no = 0;
		for(var i = 0; i < dataRoot.length; i++) {
			var index = (pageNum - 1) * pageRecordCount + i;
			no = index + 1;
			var dataNode = dataRoot[i];
			var name = dataNode['SE_NAME'];

			htmlStr = htmlStr + '<tr style="CURSOR: hand" ondblclick="search.goToSearchObject(' + index + ',\'' + dataType + '\'' + ',\'' + name + '\'' + ')">';
			htmlStr = htmlStr + '<td width=\"30\" height=\"25\" class=\"\" nowrap><font>' + no + '</font></td>';
			htmlStr = htmlStr + '<td width="160" style="word-wrap:break-word;">' + name + '</td>';
			htmlStr = htmlStr + '</tr>';
		}
		htmlStr = htmlStr + '</table>';
		document.getElementById("searchData").style.display = "";
		document.getElementById("searchData").innerHTML = htmlStr;
		$("#searchData").resize();
		document.getElementById("pageDiv").style.display = "";
		var height = (pageRecordCount) * 27;
		$("#searchData").attr("style", "height:" + height + "px;");
		$("#searchData").css('overflow-y', 'auto');
	}
	/**
	 * 单击查询结果定位
	 */
	var goToSearchObject = function(index, dataType, name) {
		var obj = null;
		if(dataType == "Model") {
			obj = searchResult.GetLocalObject(index);
			var currLayer = earth.LayerManager.GetLayerByGUID(selectLayer);
			var layType = currLayer.Name.substr(currLayer.Name.indexOf("--") + 1);
			var layerType = layType.toLowerCase();
			if(layerType == "billboard") {
				billboardBlinkBox(obj, 0, 0);
			}
			flyToModel(obj);
			var detailCheck = document.getElementById("search_info").checked;
			if(detailCheck == true) {
				var key = searchResult.GetLocalObjectKey(index);
				showModelDetailMsg(obj, key);
			}
		} else if(dataType == "POI" || dataType == 'POLYLINE' || dataType == 'POLYGON') {
			obj = resultCache[index % pageRecordCount];
			if(dataType == 'POI') {
				flyToPOI(obj, name);
			} else {
				flyToModel(obj);
			}
			var detailCheck = document.getElementById("search_info").checked;
			if(detailCheck == true) {
				var key = searchResult.GetLocalObjectKey(index);
				if(dataType == 'POI') {
					showPOIMsg2(obj, name, index % pageRecordCount);
				} else {
					showModelDetailMsg(obj, key);
				}
			}
		}
	};

	/**
	 * 获取详细信息
	 * @param {Object} layerId 图层id
	 * @param {Object} key 关键字
	 * @param {Object} value  值
	 */
	var getGeoDetail = function(layerId, key, value) {
		if(!layerId) {
			return null;
		}
		if(!key) {
			key = 'OBJECTID';
		}
		if(!value) {
			return null;
		}
		var pc = '&pc=(and,equal,' + key + ',' + value + ')';
		var url = config.ip + "/geoserver?service=" + layerId + pc + "&qt=17&pg=0,1";
		var dataDoc = null;
		$.ajax({
			type: 'GET',
			dataType: 'text',
			url: url,
			async: false,
			cache: false,
			success: function(data, textStatus, jqXHR) {
				dataDoc = loadXMLStr(data);
				if(!dataDoc) {
					return;
				}
			},
			error: function(XMLHttpRequest, textStatus, errorThrown) {
				dataDoc = null;
			}
		});
		if(!dataDoc || dataDoc.xml == '') {
			return null;
		}
		try {
			var data = $.xml2json(dataDoc);
			var records = data && data.Result && data.Result.Record;
			if(!$.isArray(records)) {
				var arr = [];
				arr.push(records);
				records = arr;
			}
			return records;
		} catch(e) {
			return null;
		}
	}
	//定位到查询结果
	var goToGeoSearchObject = function(index, dataType, name) {
		var records = searchResult.currentResult;
		var record = records[index];
		var rec = getGeoDetail(selectLayer, 'OBJECTID', record['OBJECTID']);
		if(!rec) {
			return;
		}
		record = rec[0];
		var guid = earth.Factory.CreateGuid();
		if(searchResult && searchResult.resultObj) {
			earth.DetachObject(searchResult.resultObj);
		}
		var lyr = earth.LayerManager.GetLayerByGUID(selectLayer);
		var alt = lyr.LonLatRect.MinHeight;
		var eleObj = {};
		if(record.SHAPE.hasOwnProperty('Polyline')) {
			eleObj = earth.Factory.CreateElementLine(guid, '');
			eleObj.BeginUpdate();
			var points = earth.Factory.CreateVector3s();
			var coordinateArr = record.SHAPE.Polyline.Coordinates.split(',');
			for(var i = 0;
				(i + 2) < coordinateArr.length; i += 3) {
				var point = earth.Factory.CreateVector3();
				point.x = coordinateArr[i];
				point.y = coordinateArr[i + 1];
				point.z = earth.GlobeObserver.GetHeight(point.x, point.y);
				points.AddVector(point);
			}
			eleObj.SetPointArray(points);
			eleObj.Visibility = true;
			eleObj.LineStyle.LineColor = parseInt("0xff00ff00");
			eleObj.LineStyle.LineWidth = 2;
			eleObj.AltitudeType = 1;
			eleObj.DrawOrder = 1;
			eleObj.EndUpdate();
			earth.AttachObject(eleObj);
			earth.GlobeObserver.GotoLookat(eleObj.SphericalTransform.Longitude, eleObj.SphericalTransform.Latitude, eleObj.SphericalTransform.Altitude, 0, 90, 0, 100);
			eleObj.HightLightIsFlash(true);
			eleObj.ShowHighLight();
			searchResult.resultObj = eleObj;
			var detailCheck = document.getElementById("search_info").checked;
			if(detailCheck == true) {
				showVectorMsg(record, eleObj.SphericalTransform);
			}
		} else if(record.SHAPE.hasOwnProperty('Polygon')) {
			eleObj = earth.Factory.CreateElementPolygon(guid, '');
			eleObj.BeginUpdate();
			var points = earth.Factory.CreateVector3s();
			var coordinateArr = record.SHAPE.Polygon.Coordinates.split(',');
			var polygon = earth.Factory.CreatePolygon();
			for(var i = 0;
				(i + 2) < coordinateArr.length; i += 3) {
				var point = earth.Factory.CreateVector3();
				point.x = coordinateArr[i];
				point.y = coordinateArr[i + 1];
				point.z = earth.GlobeObserver.GetHeight(point.x, point.y);
				points.AddVector(point);
			}

			eleObj.SetExteriorRing(points);
			eleObj.Visibility = true;
			eleObj.LineStyle.LineColor = 0xff00ff00;
			eleObj.FillStyle.FillColor = 0xff00ff00;
			eleObj.LineStyle.LineWidth = 2;
			eleObj.AltitudeType = 1;
			eleObj.DrawOrder = 1;
			eleObj.EndUpdate();
			earth.AttachObject(eleObj);
			earth.GlobeObserver.GotoLookat(eleObj.SphericalTransform.Longitude, eleObj.SphericalTransform.Latitude, eleObj.SphericalTransform.Altitude, 0, 90, 0, 100);
			eleObj.HightLightIsFlash(true);
			eleObj.ShowHighLight();
			searchResult.resultObj = eleObj;
			var detailCheck = document.getElementById("search_info").checked;
			if(detailCheck == true) {
				showVectorMsg(record, eleObj.SphericalTransform);
			}
		} else if(record.SHAPE.hasOwnProperty('Point')) {
			eleObj = earth.Factory.CreateElementCircle(guid, '');
			var coordinateArr = record.SHAPE.Point.Coordinates.split(',');
			var point = earth.Factory.CreateGeoPoint();
			for(var i = 0;
				(i + 2) < coordinateArr.length; i += 3) {
				point.Longitude = coordinateArr[i];
				point.Latitude = coordinateArr[i + 1];
				point.Altitude = earth.GlobeObserver.GetHeight(point.x, point.y);
			}
			eleObj.SphericalTransform.SetLocationEx(point.Longitude, point.Latitude, point.Altitude);
			eleObj.BeginUpdate();
			eleObj.radius = 5;
			eleObj.FillStyle.FillColor = parseInt("0xff00ff00");
			eleObj.LineStyle.LineWidth = 2;
			eleObj.LineStyle.LineColor = parseInt("0xff00ff00");
			earth.GlobeObserver.GotoLookat(point.Longitude, point.Latitude, point.Altitude, 0, 90, 0, 100);
			eleObj.HightLightIsFlash(true);
			eleObj.AltitudeType = 1;
			eleObj.DrawOrder = 1;
			eleObj.EndUpdate();
			eleObj.ShowHighLight();
			searchResult.resultObj = eleObj;
			var detailCheck = document.getElementById("search_info").checked;
			if(detailCheck == true) {
				showVectorMsg(record, point);
			}
		}
	};

	/**
	 * 显示矢量信息
	 * @param {Object} record  记录
	 * @param {Object} location  位置
	 */
	var vectorBallon = null;
	var showVectorMsg = function(record, location) {
		if(record != null) {
			if(htmlBalloons) {
				htmlBalloons.DestroyObject();
				htmlBalloons = null;
			}
			if(vectorBallon) {
				vectorBallon.DestroyObject();
				vectorBallon = null;
			}
			var htmlStr = '';
			var guid = earth.Factory.CreateGuid();
			vectorBallon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
			var earthHeight = $("#earthDiv", window.parent.document).height();
			var balloonHeight = earthHeight / 2 - 50;
			var divHeight = balloonHeight - 30;
			if(top.SYSTEMPARAMS.balloonAlpha > 0) {
				htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:' + divHeight + 'px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
				vectorBallon.SetRectSize(300, balloonHeight);
				vectorBallon.SetIsTransparence(true);
				vectorBallon.SetBackgroundAlpha(0xcc);
			} else {
				htmlStr = '<div style="word-break:keep-all;font-family:Microsoft Yahei;border:1px solid #ccc;white-space:nowrap;overflow:auto;width:255px;height:275px;margin-top:15px;margin-bottom:15px"><table style="font-size:16px;background-color: #fff; color: black">';
				vectorBallon.SetRectSize(340, 380);
				vectorBallon.SetIsTransparence(false);
			}
			for(var key in record) {
				if(key == "SHAPE") {
					continue;
				}
				htmlStr += '<tr><td style="word-wrap:break-word;width:100px">' + key + '</td>';
				htmlStr += '<td style="word-wrap:break-word;width:100px">' + record[key] + '</td></tr>';
			}
			htmlStr += "</table></div>";
			vectorBallon.SetSphericalLocation(location.Longitude, location.Latitude, location.Altitude);
			vectorBallon.SetTailColor(0xffffff00);
			vectorBallon.SetIsAddCloseButton(true);
			vectorBallon.SetIsAddMargin(true);
			vectorBallon.SetIsAddBackgroundImage(true);
			vectorBallon.ShowHtml(htmlStr);
			earth.Event.OnHtmlBalloonFinished = function() {
				if(vectorBallon != null) {
					vectorBallon.DestroyObject();
					vectorBallon = null;
				}
				earth.Event.OnHtmlBalloonFinished = function() {};
			}
		}
	};

	/**
	 * 显示POI信息
	 * @param {Object} obj  POI对象
	 * @param {Object} name  名称
	 */
	var poihtmlBallon = null;
	var showpoiMsg = function(obj, name) {
		if(obj != null) {
			if(htmlBalloons) {
				htmlBalloons.DestroyObject();
				htmlBalloons = null;
			}
			if(poihtmlBallon) {
				poihtmlBallon.DestroyObject();
				poihtmlBallon = null;
			}
			var htmlStr = '';
			var guid = earth.Factory.CreateGuid();
			poihtmlBallon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
			var earthHeight = $("#earthDiv", window.parent.document).height();
			var balloonHeight = earthHeight / 2 - 50;
			var divHeight = balloonHeight - 30;
			if(top.SYSTEMPARAMS.balloonAlpha > 0) { //气泡透明
				htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:' + divHeight + 'px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
				poihtmlBallon.SetRectSize(300, balloonHeight);
				poihtmlBallon.SetIsTransparence(true);
				poihtmlBallon.SetBackgroundAlpha("0xcc");
			} else {
				htmlStr = '<div style="word-break:keep-all;font-family:Microsoft Yahei;border:1px solid #ccc;white-space:nowrap;overflow:auto;width:255px;height:275px;margin-top:15px;margin-bottom:15px"><table style="font-size:16px;background-color: #fff; color: black">';
				poihtmlBallon.SetRectSize(330, 340);
				poihtmlBallon.SetIsTransparence(true);

			}
			htmlStr = htmlStr + '<tr>';
			htmlStr = htmlStr + '<td style="word-wrap:break-word;" width="50">名称:</td>';
			htmlStr = htmlStr + '<td style="word-wrap:break-word;" width="100">' + name + '</td>';
			htmlStr = htmlStr + '</tr>';
			htmlStr = htmlStr + '<tr>';
			htmlStr = htmlStr + '<td>经度:</td>';
			htmlStr = htmlStr + '<td>' + obj.Longitude + '</td>';
			htmlStr = htmlStr + '</tr>';
			htmlStr = htmlStr + '<tr>';
			htmlStr = htmlStr + '<td>纬度:</td>';
			htmlStr = htmlStr + '<td>' + obj.Latitude + '</td>';
			htmlStr = htmlStr + '</tr>';
			htmlStr = htmlStr + '<tr>';
			htmlStr = htmlStr + '<td>高程:</td>';
			htmlStr = htmlStr + '<td>' + obj.Altitude + '</td>';
			htmlStr = htmlStr + '</tr>';
			htmlStr = htmlStr + '<tr>';
			htmlStr = htmlStr + '<td>图层:</td>';
			htmlStr = htmlStr + '<td>' + obj.ParentGuid + '</td>';
			htmlStr = htmlStr + '</tr>';
			htmlStr = htmlStr + '</table>';
			htmlStr = htmlStr + '</div>';
			poihtmlBallon.SetSphericalLocation(obj.Longitude, obj.Latitude, obj.Altitude);
			poihtmlBallon.SetTailColor(0xffffff00);
			poihtmlBallon.SetIsAddCloseButton(true);
			poihtmlBallon.SetIsAddMargin(true);
			poihtmlBallon.SetIsAddBackgroundImage(true);
			poihtmlBallon.ShowHtml(htmlStr);
			earth.Event.OnHtmlBalloonFinished = function() {
				if(poihtmlBallon != null) {
					poihtmlBallon.DestroyObject();
					poihtmlBallon = null;
				}
				earth.Event.OnHtmlBalloonFinished = function() {};
			}
		}
	}

	var showPOIMsg2 = function(obj, name, index) {
		if(obj != null) {
			if(htmlBalloons) {
				htmlBalloons.DestroyObject();
				htmlBalloons = null;
			}
			if(poihtmlBallon) {
				poihtmlBallon.DestroyObject();
				poihtmlBallon = null;
			}

			var hiddenFields = ['longitude', 'latitude', 'altitude', 'se_name', 'parentlayer'];
			var attr = resultCache[index];
			var htmlStr = '';
			var guid = earth.Factory.CreateGuid();
			poihtmlBallon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
			var earthHeight = $("#earthDiv", window.parent.document).height();
			var balloonHeight = earthHeight / 2 - 50;
			var divHeight = balloonHeight - 30;
			if(top.SYSTEMPARAMS.balloonAlpha > 0) {
				htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:' + divHeight + 'px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
				poihtmlBallon.SetRectSize(300, balloonHeight);
				poihtmlBallon.SetIsTransparence(true);
				poihtmlBallon.SetBackgroundAlpha("0xcc");
			} else {
				htmlStr = '<div style="word-break:keep-all;font-family:Microsoft Yahei;border:1px solid #ccc;white-space:nowrap;overflow:auto;width:255px;height:275px;margin-top:15px;margin-bottom:15px"><table style="font-size:16px;background-color: #fff; color: black">';
				poihtmlBallon.SetRectSize(340, 380);
				poihtmlBallon.SetIsTransparence(false);

			}
			if(attr) {
				for(var i in attr) {
					if($.inArray(i.toLowerCase(), hiddenFields) >= 0) {
						continue;
					}
					htmlStr += '<tr>';
					htmlStr += '<td style="word-wrap:break-word;" width="50">' + i + ':</td>';
					htmlStr += '<td style="word-wrap:break-word;" width="100">' + attr[i] + '</td>';
					htmlStr += '</tr>';
				}
			} else {
				htmlStr += '<tr>';
				htmlStr += '<td style="word-wrap:break-word;" width="50">名称:</td>';
				htmlStr += '<td style="word-wrap:break-word;" width="100">' + name + '</td>';
				htmlStr += '</tr>';
			}
			htmlStr += '</table>';
			htmlStr += '</div>';
			poihtmlBallon.SetSphericalLocation(obj.Longitude, obj.Latitude, obj.Altitude);
			poihtmlBallon.SetTailColor(0xffffff00);
			poihtmlBallon.SetIsAddCloseButton(true);
			poihtmlBallon.SetIsAddMargin(true);
			poihtmlBallon.SetIsAddBackgroundImage(true);
			poihtmlBallon.ShowHtml(htmlStr);
			earth.Event.OnHtmlBalloonFinished = function() {
				if(poihtmlBallon != null) {
					poihtmlBallon.DestroyObject();
					poihtmlBallon = null;
				}
				earth.Event.OnHtmlBalloonFinished = function() {};
			}
		}
	}

	/**
	 * 设置树的高亮（画立方体）
	 */
	var billboardBlinkBox = function(obj, counter, control_box) {
		if(counter <= 15) {
			if(control_box == 0) {
				var lonLatRect = obj.GetLonLatRect();
				var north = lonLatRect.North + 0.00002500;
				var south = lonLatRect.South - 0.00002500;
				var east = lonLatRect.East + 0.00002501;
				var west = lonLatRect.West - 0.00002500;
				var top_height = lonLatRect.MaxHeight + 7;
				var bottom_height = lonLatRect.MinHeight;
				control_box = 1;
			} else {
				control_box = 0;
			}
		} else {}
	}

	/**
	 * 设置POI的高亮
	 */
	var poiBlink = function(obj, counter, control_box) {
		if(counter <= 15) {
			if(control_box == 0) {
				var lon = obj.Longitude;
				var lat = obj.Latitude;
				var alt = obj.Altitude;
				control_box = 1;
			} else {
				control_box = 0;
			}
			var self = this;
		} else {}
	}
	/**
	 * 定位(飞行)到模型搜索数据.
	 */
	var flyToModel = function(obj) {
		if(obj == null) {
			return;
		}
		var rect = obj.GetLonLatRect();
		if(rect == null || rect == undefined) return;
		var north = Number(rect.North);
		var south = Number(rect.South);
		var east = Number(rect.East);
		var west = Number(rect.West);
		var topHeight = Number(rect.MaxHeight);
		var bottomHeight = Number(rect.MinHeight);

		var lon = (east + west) / 2;
		var lat = (south + north) / 2;
		var alt = (topHeight + bottomHeight) / 2;
		var width = (parseFloat(north) - parseFloat(south)) / 2;
		var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
		range += 50;
		earth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 60, 0, range, 5);
		obj.ShowHighLight();
	}

	/**
	 * 定位(飞行)到POI
	 */
	var flyToPOI = function(obj, name) {
		clearBolloan();
		var lon = obj.Longitude;
		var lat = obj.Latitude;
		var alt = obj.Altitude;
		var path1 = earth.RootPath + "\\icon\\" + "flag1.png";
		var guid = earth.Factory.CreateGuid();
		myicon = earth.Factory.CreateElementIcon(guid, name);
		myicon.Create(lon, lat, alt, path1, path1, name);
		myicon.Visibility = true;
		earth.AttachObject(myicon);
		earth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 60, 0, 1000, 5);
		currentPOIObj = myicon;
		blinkElementObject(myicon, 0, 0);
	}
	/**
	 * 闪烁双击定位的对象
	 */
	var blinkElementObject = function(obj, counter, control_box) {
		if(obj == null || obj.guid != currentPOIObj.guid){
			return;
		}
		if(counter <= 10) {
			if(control_box == 0) {
				obj.Visibility = false;
				control_box = 1;
			} else {
				obj.Visibility = true;
				control_box = 0;
			}
			setTimeout(function() {
					counter++;
					blinkElementObject(obj, counter, control_box);
				}, 1000);
		} else {
			obj.Visibility = true;
		}
	}

	/**
	 *功能：显示搜索对象的详细信息
	 *参数：obj-要定位查看的搜索对象；key-搜索对象的关键字
	 *调用：flyToSearchObject(index)调用
	 */
	var htmlBalloons = null;
	var showModelDetailMsg = function(obj, key) {
		if(obj != null) {
			if(htmlBalloons) {
				htmlBalloons.DestroyObject();
				htmlBalloons = null;
			}
			if(htmlBalloons) {
				htmlBalloons.DestroyObject();
				htmlBalloons = null;
			}
			var rect = obj.GetLonLatRect();
			var north = rect.North;
			var south = rect.South;
			var east = rect.East;
			var west = rect.West;
			var up = rect.MaxHeight;
			var bottom = rect.MinHeight;

			var guid = earth.Factory.CreateGuid();
			var earthHeight = $("#earthDiv", window.parent.document).height();
			var balloonHeight = earthHeight / 2 - 50;
			var divHeight = balloonHeight - 30;
			htmlBalloons = earth.Factory.CreateHtmlBalloon(guid, "balloon");
			var htmlStr = "";
			if(top.SYSTEMPARAMS.balloonAlpha > 0) {
				htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:' + divHeight + 'px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
				htmlBalloons.SetIsTransparence(true);
				htmlBalloons.SetBackgroundAlpha(0xcc);
				htmlBalloons.SetRectSize(300, balloonHeight);
			} else {
				htmlStr = '<div style="word-break:keep-all;font-family:Microsoft Yahei;border:1px solid #ccc;white-space:nowrap;overflow:auto;width:255px;height:275px;margin-top:15px;margin-bottom:15px"><table style="font-size:16px;background-color: #fff; color: black">';
				htmlBalloons.SetIsTransparence(false);
				htmlBalloons.SetRectSize(340, 380);
			}
			var attrData = findResultItem(obj.GetKey());
			if(attrData != null) {
				for(var key in attrData) {
					if(key.toLowerCase() == 'shape' || key.toLowerCase() == 'lonlatbox' || key.toLowerCase() == 'parentlayer') {
						continue;
					}
					htmlStr = htmlStr + '<tr>';
					htmlStr = htmlStr + '<td>' + key + ':</td>';
					htmlStr = htmlStr + '<td>' + attrData[key] + '</td>';
					htmlStr = htmlStr + '</tr>';
				}
			}
			htmlStr = htmlStr + '</table></div>';
			var centerX = (east + west) / 2;
			var centerY = (north + south) / 2;
			var centerZ = (up + bottom) / 2;
			htmlBalloons.SetSphericalLocation(centerX, centerY, centerZ);
			htmlBalloons.SetTailColor(0xffffff00);
			htmlBalloons.SetIsAddCloseButton(true);
			htmlBalloons.SetIsAddMargin(true);
			htmlBalloons.SetIsAddBackgroundImage(true);
			htmlBalloons.ShowHtml(htmlStr);
			earth.Event.OnHtmlBalloonFinished = function() {
				if(htmlBalloons != null) {
					htmlBalloons.DestroyObject();
					htmlBalloons = null;
				}
				earth.Event.OnHtmlBalloonFinished = function() {};
			}
		}
	}
	var clearBolloan = function() {
		if(earth == null) {
			return;
		}
		if(htmlBalloons) {
			htmlBalloons.DestroyObject();
			htmlBalloons = null;
		}
		if(poihtmlBallon) {
			poihtmlBallon.DestroyObject();
			poihtmlBallon = null;
		}
		if(myicon) {
			earth.DetachObject(myicon);
			myicon = null;
		}
		if(vectorBallon) {
			vectorBallon.DestroyObject();
			vectorBallon = null;
		}
		if(searchResult && searchResult.resultObj) {
			earth.DetachObject(searchResult.resultObj);
		}
	}
	var goToFirstPage = function() {
		showResult(1);
	}

	var goToPrePage = function() {
		var currPage = parseInt(document.getElementById("pageNum").innerHTML);
		if(currPage == 1) {
			return;
		}
		var prePage = currPage - 1;
		showResult(prePage);
	}

	var goToNextPage = function() {
		var currPage = parseInt(document.getElementById("pageNum").innerHTML);
		var totalPageNum = Math.ceil(searchResult.RecordCount / pageRecordCount);
		if(currPage == totalPageNum) {
			return;
		}
		var nextPage = currPage + 1;
		showResult(nextPage);
	}

	var goToLastPage = function() {
		var lastPage = parseInt(document.getElementById("totalPageNum").innerHTML);
		showResult(lastPage);
	}

	/**
	 * 功能：Tips信息显示
	 * 参数：tipChecked-是否显示Tip信息（true表示显示；false表示不显示）
	 * 调用：Tips复选框的onclick事件触发调用
	 */
	var searchTips = function(t) {
		if(t) {
			earth.Environment.EnableHoverMessage = true;
			earth.ToolTips.Enable = true;
			earth.Event.onMouseHover = showTipsMessage;
		} else {
			earth.Environment.EnableHoverMessage = false;
			earth.ToolTips.Enable = false;
			earth.ToolTips.Hide();
		}
	}

	/**
	 * Tips信息显示回调函数
	 */
	var showTipsMessage = function(x, y) {
		earth.ToolTips.Hide();
		var geoPoint = earth.GlobeObserver.Pick(x, y);
		var geoPoints = generateGeoPoints(geoPoint);

		var searchGuid = selectLayer;
		var tmpResult;
		var records;

		//如果一次没有查询到 则继续查询 超过五次不再查询
		for(var i = 4; i >= 0; i--) {
			tmpResult = localSearch(searchGuid, "", geoPoints);
			var tmpResultXml = GotoPage(tmpResult, 0);

			var json = null;
			if(__returnDataType__ == 'json') {
				json = JSON.parse(tmpResultXml).Json;
			} else if(__returnDataType__ == 'xml') {
				json = $.xml2json(tmpResultXml);
			}
			records = json.SearchResult.ModelResult.ModelData;
			if(records === undefined) {
				if(i === 0) {
					alert("查询失败!");
					return;
				}
				continue;
			} else {
				break;
			}
		};
		var attributes = [];
		$.each(records, function(i, record) {
			//属性数据
			for(var key in record) {
				if(key && record[key]) {
					attributes.push({
						key: key,
						value: record[key]
					});
				}
			}
		});
		var htmlStr = '<table style="font-size:14px;">';
		for(var i = attributes.length - 1; i >= 0; i--) {
			htmlStr = htmlStr + '<tr>';
			htmlStr = htmlStr + '<td>' + attributes[i]["key"] + '</td>';
			htmlStr = htmlStr + '<td>' + attributes[i]["value"] + '</td>';
			htmlStr = htmlStr + '</tr>';
		};
		htmlStr = htmlStr + '</table>';

		var centerX = (east + west) / 2;
		var centerY = (north + south) / 2;
		var centerZ = (up + bottom) / 2;
		usearth.HtmlBalloon.ShowHtml(htmlStr, geoPoint.x, geoPoint.y, geoPoint.z, 410, 300, true);
		earth.Event.onMouseHover = function() {};
	}

	/**
	 * 回车键的操作
	 */
	window.document.onkeydown = function(event) {
		event = window.event || event;
		if(event.keyCode == 13) {
			keyWordSearch();
		}
	};

	/**
	 * 屏蔽右键菜单
	 */
	document.oncontextmenu = function() {
		event.returnValue = false;
	};
	$(window).unload(function() {
		if(earth.ShapeCreator != null) {
			earth.ShapeCreator.Clear();
		}
	});

	/**
	 * 设置窗体的大小
	 */
	function setWinSize() {
		var tabSearchObj = document.getElementById("tab_search");
		tabSearchObj.style.height = "100%";
	}

	search.loadSearch = loadSearch;
	search.keywordSearchBtnClick = keywordSearchBtnClick; //关键字按钮
	search.poiSearchBtnClick = poiSearchBtnClick; //兴趣点按钮
	search.coordSearchBtnClicked = coordSearchBtnClicked; //坐标查询按钮
	search.coordlocationBtnClicked = coordlocationBtnClicked; //坐标定位按钮
	search.keyWordSearch = keyWordSearch;
	search.pointSearch = pointSearch;
	search.polygonSearch = polygonSearch;
	search.circleSearch = circleSearch;
	search.rectangleSearch = rectangleSearch;
	search.drawPolygon = drawPolygon;
	search.drawCircle = drawCircle;
	search.drawRectangle = drawRectangle;
	search.searchTips = searchTips;
	search.emptyResultHtml = emptyResultHtml;
	search.showResult = showResult;
	search.showGeoResult = showGeoResult;
	search.goToSearchObject = goToSearchObject;
	search.goToGeoSearchObject = goToGeoSearchObject;
	search.goToFirstPage = goToFirstPage;
	search.goToPrePage = goToPrePage;
	search.goToNextPage = goToNextPage;
	search.goToLastPage = goToLastPage;
	search.initLayerTree = initLayerTree;
	search.layerTd = layerTd;
	search.clearBolloan = clearBolloan;
	return search;
};

$(window).unload(function() {
	if(htmlBalloonXY != null) {
		htmlBalloonXY.DestroyObject();
		htmlBalloonXY = null;
	}
});