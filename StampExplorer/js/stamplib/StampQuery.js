/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：属性查询相关方法
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/

var GeneralQuery = {}; //查询对象
var currentRoomCenter; //当前井室中心点
var queryPropertyObj = []; //“属性查看”高亮对象集合
var thisPropertyHtml = null; //属性气泡
var poiLayers = null; //所有POI图层
var queryHtmlBalloon = null; //查询气泡

(function() {
	//功能：拾取查询-发布图层对象
	//参数：pObj拾取对象
	//返回：无
	var onPickObjectEx = function(pObj) {
		var earth = seearth;
		if(queryPropertyObj && queryPropertyObj.length) {
			for(var k = 0; k < queryPropertyObj.length; k++) {
				queryPropertyObj[k].StopHighLight();
			}
		}
		if(pObj == null) {
			alert("对象不存在");
			return;
		}
		queryCurrentObj = pObj; //当前查询对象
		poiLayers = LayerManagement.POILAYERS; //POI图层
		var ispoi = false;
		var poiLayerId = '';
		for(var i = 0; i < poiLayers.length; i++) {
			if(pObj.ParentGuid == poiLayers[i].name) {
				ispoi = true;
				poiLayerId = poiLayers[i].id;
				break;
			}
		}
		if(!ispoi) {
			pObj.Underground = true;
			pObj.ShowHighLight();
			parentLayerName = pObj.GetParentLayerName();
			if(parentLayerName == "" || parentLayerName == null) {
				alert("获得父层名称失败！");
				return false;
			}

			key = pObj.GetKey();

			showpropertyQuery(earth, parentLayerName, key, pObj);
		} else {
			showpropertyQuery(earth, poiLayerId, 'poi', pObj);
		}
		earth.Event.OnRBDown = function() {
			earth.Event.OnPickObjectEx = function() {};
			earth.Event.OnPickObject = function() {};
			earth.Event.OnLBDown = function() {};
			earth.Event.OnLBUp = function() {};
			earth.Query.FinishPick();
			earth.Environment.SetCursorStyle(209);
			Tools.singleStyleCancel("QueryProperty");
			QueryPropertyBtn = false;
			top.QueryPropertyBtn = false;
		}

	};

	//功能：拾取查询-用户自定义对象
	//参数：pObj拾取对象
	//返回：无
	var onPickObject = function(pObj) {
		if(queryPropertyObj && queryPropertyObj.length) {
			for(var k = 0; k < queryPropertyObj.length; k++) {
				queryPropertyObj[k].StopHighLight();
			}
		}
		try {
			pObj.ShowHighLight();
			queryPropertyObj
		} catch(e) {}
		var earth = seearth;
		var llr = pObj.GetLonLatRect();
		var showObj = {
			'displayFields': ['East', 'MaxHeight', 'MinHeight', 'North', "South", "West"],
			'East': llr.East,
			'MaxHeight': llr.MaxHeight,
			'MinHeight': llr.MinHeight,
			'North': llr.North,
			'South': llr.South,
			'West': llr.West
		};
		earth.Event.OnRBDown = function() {
			earth.Event.OnPickObjectEx = function() {};
			earth.Event.OnPickObject = function() {};
			earth.Event.OnLBDown = function() {};
			earth.Event.OnLBUp = function() {};
			earth.Environment.SetCursorStyle(209);
			top.QueryPropertyBtn = false;
		}

		initObjNormal(pObj.GetLonLatRect(), showObj);
	};

	//功能：属性查询
	//参数：无
	//返回：无
	var propertyQuery = function() {
		var earth = seearth;
		earth.Environment.SetCursorStyle(32512);
		earth.Event.OnPickObjectEx = onPickObjectEx; //获取的为一般的数据
		earth.Event.OnPickObject = onPickObject;
		earth.Event.OnLBDown = function(p2) {
			function _onlbd(p2) {
				earth.Event.OnLBUp = function(p2) {
					earth.Event.OnLBDown = function(p2) {
						_onlbd(p2);
					};
				};
				earth.Query.PickObject(511, p2.x, p2.y);

			}
			_onlbd(p2);
		};
	};

	//功能：显示一般的数据气泡
	//参数：rect矩形范围，showObj显示的数据集合,type查询对象的数据类型（POI或其他对象）
	function initObjNormal(rect, showObj, type) {
		var earth = seearth;
		var config = top.STAMP_config;
		if(queryHtmlBalloon) {
			queryHtmlBalloon.DestroyObject();
			queryHtmlBalloon = null;
		}
		var displayFields = showObj.displayFields;
		if(type == 'point') {
			var centerX = rect.Longitude;
			var centerY = rect.Latitude;
			var centerZ = rect.Altitude;
		} else {
			var north = rect.North;
			var south = rect.South;
			var east = rect.East;
			var west = rect.West;
			var up = rect.MaxHeight;
			var bottom = rect.MinHeight;
			var centerX = (east + west) / 2;
			var centerY = (north + south) / 2;
			var centerZ = (up + bottom) / 2;
		}
		var showLineHtml = '<table>';
		for(var i = 0; i < displayFields.length; i++) {
			showLineHtml = showLineHtml + '<tr>';
			var displayName = displayFields[i];
			showLineHtml = showLineHtml + '<td class="col w75p" >' + displayName + ':</td>';
			showLineHtml = showLineHtml + '<td class="col w25p" >' + showObj[displayFields[i]] + '</td>';
			showLineHtml = showLineHtml + '</tr>';
		}
		showLineHtml = showLineHtml + '</table>';
		thisPropertyHtml = showLineHtml;
		showDialog("html/query/normalObjProperty.html", "QueryProperty")
	}

	/**
	 * 初始化模型
	 * @param {Object} key  关键字
	 * @param {Object} layer  图层
	 * @param {Object} pObj  对象
	 */
	function initModelValue(key, layer, pObj) {
		var earth = seearth;
		if(pObj != null) {
			if(queryHtmlBalloon) {
				queryHtmlBalloon.DestroyObject();
				queryHtmlBalloon = null;
			}
			var rect = pObj.GetLonLatRect();
			var north = rect.North;
			var south = rect.South;
			var east = rect.East;
			var west = rect.West;
			var up = rect.MaxHeight;
			var bottom = rect.MinHeight;

			var attrXml = layer.SearchResultFromLocal.GotoPage(0);
			var attrData = $.xml2json(attrXml);
			if(attrData.SearchResult != null && attrData.SearchResult.total > 0){
                if(attrData.SearchResult.ModelResult != null){
                    attrData = attrData.SearchResult.ModelResult.ModelData;
                }else if(attrData.SearchResult.VectorResult != null){
                    attrData = attrData.SearchResult.VectorResult.VectorData;
                }
                if($.isArray(attrData)){
                    attrData = attrData[0];
                }
            } else{
                attrData = null;
            }

			var htmlStr = '<table>';

			if(attrData == null) {
				htmlStr = htmlStr + '<tr>';
				htmlStr = htmlStr + '<td  class="col w75p" >图层:</td>';
				htmlStr = htmlStr + '<td class="col w25p" >' + layer.Name + '</td>';
				htmlStr = htmlStr + '</tr>';
				htmlStr = htmlStr + '<tr>';
				htmlStr = htmlStr + '<td class="col w75p" >名称:</td>';
				htmlStr = htmlStr + '<td class="col w25p" >' + key + '</td>';
				htmlStr = htmlStr + '</tr >';
				htmlStr = htmlStr + '</table>';
			} else {

				for(var i in attrData) {
					if(i == "LonLatBox" || i == "US_KEY") {
						continue;
					}
					var thisName = i;
					switch(i) {
						case "SE_NAME":
							thisName = "名称:";
							break;
						case "US_EAST":
							thisName = "东(经度):";
							break;
						case "US_WEST":
							thisName = "西(经度):";
							break;
						case "US_SOUTH":
							thisName = "南(纬度):";
							break;
						case "US_NORTH":
							thisName = "北(纬度):";
							break;
						case "US_TOP":
							thisName = "顶部高程:";
							break;
						case "US_BOTTOM":
							thisName = "底部高程:";
							break;
						case "ParentLayer":
							thisName = "父图层:";
							break;
					}
					
					htmlStr = htmlStr + '<tr>';
					htmlStr = htmlStr + '<td class="col w75p" >' + thisName + '</td>';
					htmlStr = htmlStr + '<td class="col w25p" >  ' + attrData[i] + '</td>';
					htmlStr = htmlStr + '</tr>';
				}
				htmlStr = htmlStr + '</table>';
			}
			thisPropertyHtml = htmlStr;
			showDialog("html/query/normalObjProperty.html", "QueryProperty");
		}
	}

	/**
	 * 属性查询结果展示
	 * @param {Object} earth  三维求对象
	 * @param {Object} parentLayerName  属性图层名
	 * @param {Object} key 关键字
	 * @param {Object} pObj  对象
	 */
	function showpropertyQuery(earth, parentLayerName, key, pObj) {
		function parseLocation() {
			var results = {};
			results[key] = parentLayerName;
			return results;
		};
		if(parentLayerName.indexOf('=') > -1) {
			var params = parseLocation();
			//根据图层名称字符串判断是模型图层还是管线数据图层
			var cArr = parentLayerName.split("=");
			var cArr = cArr[1].split("_");
			var layer = earth.LayerManager.GetLayerByGUID(cArr[0]);
			var keyFieldInRealData = "US_KEY";
		}
		if(parentLayerName == 'userLayer') {
			var showObj = {
				guid: pObj.Guid,
				displayFields: ['guid']
			};
			var rect = pObj.GetLonLatRect();
			initObjNormal(pObj.GetLonLatRect(), showObj);
		}
		if(key == 'poi') {
			var poiLayer = earth.LayerManager.GetLayerByGUID(parentLayerName);
			var result = poiLayer.SearchResultFromLocal.GotoPage(0);
			result = $.xml2json(result);
			if(result.SearchResult.total != 1) {
				return;
			}
			var showObj = {
				displayFields: []
			};
			var resultData = result.SearchResult.POIResult.POIData;
			for(var i in resultData) {
				showObj.displayFields.push(i);
				showObj[i] = resultData[i];
			}
			initObjNormal(pObj, showObj, 'point');
		}
		//小品图层或者楼块图层
		else if(layer.LayerType.toLowerCase() == 'billboard' || layer.LayerType.toLowerCase() == 'block') {

			var result = layer.SearchResultFromLocal.GotoPage(0);
			var result = $.xml2json(result);
			if(result != null && result.SearchResult != null && result.SearchResult.ModelResult != null && result.SearchResult.ModelResult.ModelData != null) {
				var data = result.SearchResult.ModelResult.ModelData;
				var showObj = {
					'displayFields': ['图层名', '名称', 'SE_ID', 'LonLatBox'],
					'图层名': layer.Name,
					'名称': data.SE_NAME,
					'SE_ID': data.SE_ID,
					'LonLatBox': data.LonLatBox
				};
				for(var itemKey in data) {
					var keyLower = itemKey.toLowerCase();
					if(keyLower == "id" || keyLower == "name" || keyLower == "se_name" || keyLower == "se_id" || keyLower == "lonlatbox") {
						continue;
					}
					showObj[itemKey] = data[itemKey];
					showObj["displayFields"].push(itemKey);
				}
				initObjNormal(pObj.GetLonLatRect(), showObj);
			}
		} else if(layer.LayerType.toLowerCase() == 'gisvector' || layer.LayerType.toLowerCase() == 'gispoi') {
			var result = layer.SearchResultFromGISServer.GotoPage(0);
			var resultObj = $.xml2json(result);
			if(resultObj.Result != null && resultObj.Result.Record != null) {
				var record = resultObj.Result.Record;
				var showObj = {};
				showObj.displayFields = ['名称'];
				for(var key in record) {
					if(key == 'SHAPE')
						continue;
					if(key == 'NAME') {
						showObj['名称'] = record.NAME;
					} else {
						showObj[key] = record[key];
						showObj.displayFields.push(key);
					}
				}
				var rect = pObj.GetLonLatRect();
				initObjNormal(rect, showObj);
			}
		} else if(layer.LayerType.toLowerCase() == "pipeline") {
			if(queryHtmlBalloon) {
				queryHtmlBalloon.DestroyObject();
				queryHtmlBalloon = null;
			}
			var pObjs = [];
			var pObjGUID = pObj.Guid;
			pObjs.push(pObj);
			queryPropertyObj = pObjs;
			currentRoomCenter = pObj.GetLonLatRect().Center;
			var parentLayerName = pObj.GetParentLayerName();
			parentLayerName = parentLayerName.split("=")[1];
			var layer = earth.LayerManager.GetLayerByGUID(parentLayerName.split("_")[0]);
			var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
			var centerPoint = pObj.GetLonLatRect().Center;
			thisPropertyHtml = "<table>";
			thisPropertyHtml = thisPropertyHtml + '<tr><td class="col w75p" >模型编号:</td>';
			thisPropertyHtml = thisPropertyHtml + '<td class="col w25p" >' + pObj.GetKey() + '</td></tr>';
			thisPropertyHtml = thisPropertyHtml + '<tr><td class="col w75p" >图层名称:</td>';
			thisPropertyHtml = thisPropertyHtml + '<td class="col w25p" >' + layer.Name + '</td></tr>';
			thisPropertyHtml = thisPropertyHtml + '<tr><td class="col w75p" >经度:</td>';
			thisPropertyHtml = thisPropertyHtml + '<td class="col w25p" >' + centerPoint.X + '</td></tr>';
			thisPropertyHtml = thisPropertyHtml + '<tr><td class="col w75p" >纬度:</td>';
			thisPropertyHtml = thisPropertyHtml + '<td class="col w25p" >' + centerPoint.Y + '</td></tr>';
			showDialog("html/query/normalObjProperty.html", "QueryProperty");
		} else {
			var pObjs = [];
			var pObjGUID = pObj.Guid;
			pObjs.push(pObj);
			queryPropertyObj = pObjs;
			if(cArr.length > 1) {
				var bLine = parentLayerName.indexOf("container") > -1;
				var _type = 0;
				if(bLine) _type = 1;
				if(layer) {
					//获得关键字段
					keyFieldInRealData = parent.getName("US_KEY", _type, true);
				}
				//根据关键字段，拼接查询条件
				var strPara = "(and,equal," + keyFieldInRealData + "," + key + ")"; // + "&pg=0,30";
				var param = layer.QueryParameter;
				top.clearSearchResult(layer); //清除上一次查询的结果
				param.Filter = strPara;
				param.QueryType = 16; // SE_AttributeData
				param.QueryTableType = (bLine ? 1 : 0);
				param.PageRecordCount = 1;
				//进行查询
				var result = layer.SearchFromGISServer();
				//显示查询结果
				query(result.GotoPage(0), layer.Guid, layer.Name, bLine);
			} else {
				//如果是模型图层，没有进行进一步的查询，就把当前获得的基本信息进行了显示
				$("#divPointResult").show();
				$("#divLineResult").hide();
				initModelValue(key, layer, pObj);
			}
		}
	}

	GeneralQuery.propertyQuery = propertyQuery;
})();