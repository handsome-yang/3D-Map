/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：图层相关功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 13f日
 ******************************************/

if(!STAMP) {
	var STAMP = {};
}
/**
 * 图层管理对象
 */
STAMP.LayerManager = function(earth) {
	var layerManager = {};
	var mapLayers = [];
	var poiLayers = [];

	/**
	 * 根据图层类型，获取图标路径
	 * @param layerType 图层类型
	 * @return 图标样式
	 */
	var _getLayerIcon = function(layerType) {
		var icon = "";
		if(layerType != "Folder") {
			icon = 'image/layer/layer_' + layerType.toLowerCase() + '.gif';
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
			"equipment": "附属设施",
			"container": "管线",

			"well": "井",
			"joint": "附属点",
			"plate": "井盖",
			"room": "井室",

			"container_og": "地上管线",
			"joint": "特征",
			"joint_og": "地上特征"

		};
		if(map[name]) {
			name = map[name];
		}
		return name;
	};
	layerManager.mapLayerCount = 0;
	layerManager.wmsLayerCount = 0;
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
		var f = (STAMP_config.server.returnDataType != undefined && STAMP_config.server.returnDataType == 'json');
		var layerData = [];
		var childCount = layer.GetChildCount();
		for(var i = 0; i < childCount; i++) {
			var childLayer = layer.GetChildAt(i);
			var name = _enName2cnName(childLayer.Name);

			if(childLayer.LayerType.toLowerCase() == "map") {
				layerManager.mapLayerCount++;
			}
			if(childLayer.LayerType.toLowerCase() == "wms") {
				layerManager.wmsLayerCount++;
			}
			if(childLayer.LocalSearchParameter != null) {
				if(childLayer.LayerType == 'POI') {
					childLayer.LocalSearchParameter.ReturnDataType = f ? 5 : 1;
				} else {
					childLayer.LocalSearchParameter.ReturnDataType = f ? 6 : 4;
				}
			}
			var data = {
				"id": childLayer.Guid,
				"name": name,
				"checked": childLayer.Visibility
			};
			if(childLayer.LayerType === "Project") {
				STAMP_config.spatial.push({
					id: childLayer.Guid,
					name: name
				});
			}
			if(bWithIcon) {
				data["icon"] = _getLayerIcon(childLayer.LayerType);
			}
			if(childLayer.GetChildCount() > 0) {
				data.children = getLayerData(childLayer, true);
			}
			if(childLayer.LayerType.toLowerCase() == "wms" || childLayer.layerType == "map") {
				mapLayers.push(childLayer)
			}
			if(name != "buffer" && name != "room") {
				layerData.push(data);
			}
			if(childLayer.LayerType.toLowerCase() == 'poi' || childLayer.LayerType.toLowerCase() == 'gispoi') {
				var obj = {
					id: childLayer.Guid,
					name: name,
					type: childLayer.LayerType
				}
				poiLayers.push(obj);
			}
		}
		return layerData;
	};
	/**
	 * 定位到经纬度范围
	 */
	var flyToLayer = function(layer) {
		var lonLatRect = layer.LonLatRect;
		var centerX = (lonLatRect.East + lonLatRect.West) / 2;
		var centerY = (lonLatRect.North + lonLatRect.South) / 2;
		var width = (parseFloat(lonLatRect.North) - parseFloat(lonLatRect.South)) / 2;
		var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
		earth.GlobeObserver.FlytoLookat(centerX, centerY, 0, 0, 90, 0, range, 4);
	};
	/**
	 * 获取POI图层
	 * @param {Object} flag  标记
	 */
	var getPoiLayers = function(flag) {
		poiLayers = [];
		getLayerData();
		var _poiLayers = [];
		var _gispoiLayers = [];
		var _allLayers = [];
		for(var i = 0; i < poiLayers.length; i++) {
			var layerObj = poiLayers[i];
			if(layerObj.type.toLowerCase() == 'poi') {
				_poiLayers.push(layerObj);
			} else if(layerObj.type.toLowerCase() == 'gispoi') {
				_gispoiLayers.push(layerObj);
			}
			_allLayers.push(layerObj);
		}
		if(flag == 1) {
			return _poiLayers;
		} else if(flag == 2) {
			return _gispoiLayers;
		} else {
			return _allLayers;
		}
	}

	layerManager.flyToLayer = flyToLayer; // 定位到图层
	layerManager.getPoiLayers = getPoiLayers; //获取poi类型的图层数据
	layerManager.getLayerData = getLayerData; // 获取图层数据
	layerManager.mapLayers = mapLayers; //二维图层数组
	return layerManager;
};