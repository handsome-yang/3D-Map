/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月15日
 * 描    述：图层管理
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */
if (!STAMP) {
    var STAMP = {};
}
STAMP.LayerManager = function (earth) {
    var layerManager = {};

    /**
     * 根据图层类型，获取图标路径
     * @param layerType 图层类型
     * @return 图标样式
     */
    var _getLayerIcon = function (layerType) {
        var icon = "";
        if (layerType != "Folder") {
            icon = '../../images/layer/layer_' + layerType.toLowerCase() + '.gif';
        }
        return icon;
    };

    /**
     * 将管线子图层中的英文名标识改为中文标识
     * @param name
     * @return {*}
     */
    var _enName2cnName = function (name) {
        var map = {
            "equipment": "附属",
            "container": "管线",
            'container_og':'地上管线',
            "well": "井",
            "joint": "附属点",
            "plate": "井盖"
        };
        if (map[name]) {
            name = map[name];
        }
        return name;
    };

    /**
     * 获取图层数据
     * @param layer 图层根节点
     * @return 图层数据数组
     */
    var getLayerData = function (layer, str) {
        return getLayerData2(layer, true, ['pipeline'], (str == 'currentPrj'), (str == 'currentPrj' ? ['gisvector'] : null));
    };

    /**
     * 获取图层数据
     * @param  {[type]} layer       [图层]
     * @param  {[type]} hideCurPrj  [是否隐藏当前工程图层]
     * @param  {[type]} visibleType [要显示的图层类型]
     * @param  {[type]} fillVector  [是否加载矢量图层数据-填充全局变量各矢量图层]
     * @param  {[type]} filterTypes [过滤的图层类型]
     * @return {[type]}             [description]
     */
    var getLayerData2 = function(layer, hideCurPrj, visibleType, fillVector, filterTypes){
        var pid = 3;
        var f = false;
        if (!layer) {
            layer = earth.LayerManager.LayerList;
            var childCount = layer.GetChildCount();
            var curProjectLayer = null;
            for (var s = 0; s < childCount; s++) { //获取所有的管线图层ID集合，用于从基础图层中消除
                var childLayer = layer.GetChildAt(s);
                if(childLayer.guid == top.SYSTEMPARAMS.project){
                    layer = childLayer;
                    break;
                }
            }
        }else{
            pid = layer.Guid;
        }
        var b= layer.DataType;
        if(fillVector){
            var data = {
                "id": layer.Guid,
                "pId": pid,
                "name": _enName2cnName(layer.Name),
                "checked": layer.Visibility,
                "type":"BASEO1",
                "icon": _getLayerIcon(layer.LayerType),
                "dataType":layer.DataType,
                "layerType":layer.LayerType
            };

            //用地平衡、限高分析、控规查询、选址分析
            if(layer.DataType=="RegulatoryFigure" || layer.DataType === "TotalFigure"){
               top.ctrPlanLayer.push(data);
            }

            // 拆迁分析 指标核算
            if(layer.DataType.toLowerCase()=="currentbuilding" || layer.DataType.toLowerCase() == "planbuilding"){
                top.indicatorAccountingLayer.push(data);
                top.removeAnalysisLayer.push(data);
            }
            //绿地分析
            if(layer.DataType.toLowerCase()=="currentgreenbelt" || layer.DataType.toLowerCase() == "plangreenbelt"){
              	top.greenbeltAnalysisLayer = [];
              	top.greenbeltAnalysisLayer.push(data);
            }
            if(layer.LayerType.toLowerCase() == "gispoi" || layer.LayerType.toLowerCase() == "gisvector" || 
            	layer.LayerType.toLowerCase() == "gispolyline" || layer.LayerType.toLowerCase() == "gispolygon"){
                top.surroundingLayer.push(data);
            }
        }
        var layerData = [];
        var childCount = layer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = layer.GetChildAt(i);
             if(childLayer.LocalSearchParameter != null){
                if(childLayer.LayerType == 'POI'){
                    childLayer.LocalSearchParameter.ReturnDataType = f ? 5 : 1;
                }else{
                    childLayer.LocalSearchParameter.ReturnDataType = f ? 6 : 4;
                }
            }
            if($.inArray(childLayer.LayerType.toLowerCase(), visibleType) >= 0){
                childLayer.Visibility = true;
            }
            var name = _enName2cnName(childLayer.Name);

            var data = {
                "id": childLayer.Guid,
                "pId": pid,
                "name": name,
                "checked": childLayer.Visibility,
                "type":"BASEO1",
                "icon": _getLayerIcon(childLayer.LayerType),
                "dataType":childLayer.DataType,
                "layerType":childLayer.LayerType
            };
            var d = getLayerData2(childLayer, hideCurPrj, visibleType, fillVector, filterTypes);
            if(filterTypes == null){
                layerData.push(data);
            }else if(filterTypes.length > 0){
                if($.inArray(data.layerType.toLowerCase(), filterTypes) >= 0){
                    layerData.push(data);
                }else if(d.length > 0){
                    layerData.push(data);
                }
            }
            
            layerData = layerData.concat(d);
        }
        return layerData;
    }

    /**
     * 定位到经纬度范围
     * @param  {[type]} layer [图层]
     * @return {[type]}       [description]
     */
    var flyToLayer = function (layer) {
        if(!layer){return;}
        var lonLatRect = layer.LonLatRect;
        if(projManager.IsValid(lonLatRect)){
            var centerX = (lonLatRect.East + lonLatRect.West) / 2;
            var centerY = (lonLatRect.North + lonLatRect.South) / 2;
            var width = (parseFloat(lonLatRect.North) - parseFloat(lonLatRect.South)) / 2;
            var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
            earth.GlobeObserver.FlytoLookat(centerX, centerY, 0, 0, 90, 0, range, 4);
        }
    };

    layerManager.flyToLayer = flyToLayer;          // 定位到图层
    layerManager.getLayerData = getLayerData;      // 获取图层数据
    return layerManager;
}