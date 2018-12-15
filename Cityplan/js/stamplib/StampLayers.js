/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：图层管理公共脚本
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var elementSphere = null;
var LayerManagement = {
    earth:null,
    earthArray: [], //保存earth
    PIPELINELAYERS:[],//记录所有管线图层
    POILAYERS:[],//记录所有管线POI图层
    pipelineSelectId:[],//所有图层中的管线图层
    PROJECTLIST:[],//工程列表
    htmlBalloon:null,
    searchLayers:[],//查询或者分析的图层
    /**
     * 获取图层根节点
     * @param  {[type]} earth [三维球]
     * @return {[type]}       [图层根节点]
     */
    getRootLayer: function(earth) {
        var rootLayer = earth.LayerManager.LayerList;
        return rootLayer;
    },
    
    /**
     * 初始化图层查询的返回类型
     * @param  {[type]} earth [description]
     * @param  {[type]} layer [description]
     * @return {[type]}       [description]
     */
    initLayerDataType: function(earth, layer) {
        if (layer == null) {
            layer = this.getRootLayer(earth);
        }

        var childCount = layer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = layer.GetChildAt(i);
            if (childLayer.LocalSearchParameter != null) {
                if (childLayer.LayerType == 'POI') {
                    childLayer.LocalSearchParameter.ReturnDataType = 1;
                } else {
                    childLayer.LocalSearchParameter.ReturnDataType = 4;
                }
            }
            if (childLayer.GetChildCount() > 0) {
                this.initLayerDataType(earth, childLayer);
            }
        }
    },

    /**
     * 功能：递归获取管线图层Guid集合
     * 参数：layer-图层根节点（最开始是工程级图层）
     * 返回值：该图层的子节点是否全部是管线图层
     （ true：该图层所有子节点全部是管线图层，则该根节点也需要push进管线图层Guid集合中；
        false：该图层所有子节点不全是管线图层，则该根节点不需要push进管线图层Guid集合中）
     */
    getPipelineSelectIds: function(layer) {
        var bAllPipeline = true;
        var childCount = layer.GetChildCount();
        for (var s = 0; s < childCount; s++) { //获取所有的管线图层ID集合，用于从基础图层中消除 
            var childLayer = layer.GetChildAt(s);
            var layerType = childLayer.LayerType;
            if (layerType === "Pipeline") {
                LayerManagement.pipelineSelectId.push(childLayer.Guid);
            } else if (layerType === "Folder") {
                var bFlagg = LayerManagement.getPipelineSelectIds(childLayer);
                if (!bFlagg) {
                    bAllPipeline = false;
                }
            } else {
                bAllPipeline = false;
            }
        }
        if (bAllPipeline) {
            LayerManagement.pipelineSelectId.push(layer.Guid);
        }
        return bAllPipeline;
    },

    /**
     * 功能：将table导出成Excel文档
     * 参数：tableId - 要导出的表对象; columns - 列标题数组
     * 返回：无
     */
    importExcelByTable: function(tabObj, columns) {
        var xls = null;
        try {
            xls = new ActiveXObject("Excel.Application");
        } catch (e) {
            alert("无法启动Excel\n\n如果您确信您的电脑中已经安装了Excel, 那么请调整IE的安全级别\n" +
                "具体的操作：\n" +
                "工具 -> Internet选项 -> 安全 -> 自定义级别 -> 对没有标记为安全的ActiveX进行初始化和脚本运行 -> 启用");
            return;
        }
        try {
            xls.visible = true;
            var xlsBook = xls.Workbooks.Add;
            var xlsSheet = xlsBook.WorkSheets(1);

            for (var k = 0; k < columns.length; k++) {
                xlsSheet.Cells(1, k + 1).Value = columns[k];
            }

            var rowList = tabObj.rows;
            for (var i = 0; i < rowList.length; i++) {
                var cellList = rowList[i].cells;
                for (var j = 0; j < cellList.length; j++) {
                    var thisClassName = cellList[j].className;
                    if(thisClassName){
                        var redIndex = thisClassName.indexOf("bgRed");
                        if(redIndex>-1){
                            xlsSheet.Cells(i + 2, j + 1).Interior.ColorIndex = 3;//如果不符合标准则为红色
                        }
                    }
                    xlsSheet.Cells(i + 2, j + 1).Value = cellList[j].innerHTML;
                }
            }

            xls.UserControl = true;
        } catch (err) {
        }
    },

    getChildVisibility: function(dataArr){
        if(dataArr == null || dataArr.length <= 0){
            return false;
        }
        for(var i = 0; i < dataArr.length; i++){
            var item = dataArr[i];
            if(item.checked){
                return true;
            }
        }
        return false;
    },

    clearHtmlBalloons: function() {
        if (LayerManagement.htmlBalloon != null) {
            LayerManagement.htmlBalloon.DestroyObject();
            LayerManagement.htmlBalloon = null;
        }
    },

    /*
     * 获取基本图层数据
     * @param  {object} layer 图层
     */
    getLayerTreeData: function(layer) {
        if (!layer) {
            layer = LayerManagement.earth.LayerManager.LayerList;
        }
        var layerData = [];
        var childCount = layer.GetChildCount();
        for (var s = 0; s < childCount; s++) { //获取所有的管线图层ID集合，用于从基础图层中消除
            var childLayer = layer.GetChildAt(s);
            LayerManagement.getPipelineSelectIds(childLayer); //modified by zhangd 修改基础图层显示，剔除管线图层，包括管线图层的根节点
        }
        for (var i = 0; i < childCount; i++) {
            var childLayer = layer.GetChildAt(i);
            var name = childLayer.Name;
            if (name == "equipment") {
                name = "附属设施";
            } else if (name == "container") {
                name = "管线";
            } else if (name == "well") {
                name = "井";
            } else if (name == "joint") {
                name = "附属点";
            } else if (name == "plate") {
                name = "井盖";
            } else if (name == "room") {
                name = "井室";
            } else if (name == "container_og") {
                name = "地上管线"
            } else if (name == "joint") {
                name = "特征";
            } else if (name == "joint_og") {
                name == "地上特征";
            }

            var id = childLayer.Guid;
            var data = {};
            var layerType = childLayer.LayerType;
            data['id'] = childLayer.Guid;
            data['pId'] = 3;
            data['name'] = name;
            //Add by lq  控制图层图标 2017-9-13
            var demType = childLayer.DEMType;
            if(demType.toUpperCase() === "TIN" || demType.toUpperCase() === "GRID"){
                layerType = "DEM"
            }
            layerType = layerType ? layerType : "DOM";
            if(layerType == "Model" && childLayer.DataType == "Water"){
                layerType = "Water";
            }
            if(layerType == "Model" && childLayer.DataType == "Building"){
                layerType = "Building";
            }
            if(layerType == "Model" && childLayer.DataType == "Ground"){
                layerType = "Ground";
            }
            if(childLayer.DataType == "CurrentRoad"){
                layerType = "Ground";
            }
            if(layerType == "GISVector" && childLayer.DataType == "CurrentLand"){
                layerType = "CurrentLand";
            }
            if(layerType == "GISVector" && childLayer.DataType == "Canton"){
                layerType = "Canton";
            }
            if(layerType == "GISVector" && childLayer.DataType == "CurrentGreenbelt"){
                layerType = "CurrentGreenbelt";
            }
            if(layerType == "GISVector" && childLayer.DataType == "RegulatoryFigure"){
                layerType = "RegulatoryFigure";
            }
            if(layerType == "GISVector" && childLayer.DataType == "CurrentBuilding"){
                layerType = "CurrentBuilding";
            }
            data['icon'] = LayerManagement.getLayerIcon(layerType);
            if (childLayer.GetChildCount() > 0) {
                var bFlagPipeline = false;
                if (LayerManagement.pipelineSelectId.length > 0) { //清除基础图层中所有的管线图层（基础图层中不应该包括管线图层）
                    for (var a = 0; a < LayerManagement.pipelineSelectId.length; a++) {
                        if (LayerManagement.pipelineSelectId[a] === childLayer.Guid) {
                            bFlagPipeline = true;
                            break;
                        }
                    }
                    if (bFlagPipeline) {
                        continue;
                    }
                }
                data.children = LayerManagement.getLayerTreeData(childLayer);
            }
            if(data.children && data.children.length > 0){
                data['checked'] = this.getChildVisibility(data.children);
            }else{
                data['checked'] = childLayer.Visibility;
            }
            if (name != "buffer" && name != "room") {
                layerData.push(data);
            }
            if (layerType === "POI") {
                LayerManagement.POILAYERS.push({
                    'id': id,
                    'name': name,
                    'pId': 3,
                    'server': childLayer.GISServer,
                    'pltype': childLayer.PipeLineType
                });
            }
        }
        return layerData;
    },

    /*
    * 获取基本图层数据
    * @param  {object} layer 图层
    */
    setCurProjectLayerVisible: function() {
        var layer = LayerManagement.earth.LayerManager.LayerList;
        var layerData = [];
        var childCount = layer.GetChildCount();
        var curProjectLayer = null;
        for (var s = 0; s < childCount; s++) { //获取所有的管线图层ID集合，用于从基础图层中消除 
            var childLayer = layer.GetChildAt(s);
            if(childLayer.guid == SYSTEMPARAMS.project){
                curProjectLayer = childLayer;
            }
        }
        if(curProjectLayer == null){
            return;
        }
        childCount = curProjectLayer.GetChildCount();
        this.setChildLayerVisible(curProjectLayer);
    },

    //设置当前工程的图层全部隐藏（除了DEM和DOM图层）
    setChildLayerVisible: function(layer){
        if(layer.LayerType.toLowerCase() == "pipeline"){
            return;
        }
        if(layer.LayerType.toLowerCase() == "tin" || layer.LayerType.toLowerCase() == "grid" || layer.LayerType.toLowerCase() == "DOM" || layer.LayerType.toLowerCase() == "" || layer.DEMType.toLowerCase() == "tin"){

        }else if(layer.LayerType.toLowerCase() !== "folder" && layer.LayerType.toLowerCase() != "project"){
            layer.Visibility = false;
        }
        
        for(var i = 0; i < layer.GetChildCount(); i++){
            this.setChildLayerVisible(layer.GetChildAt(i));   
        }
    },

    /**
     * 获取显示的所有管线图层，横断面分析用到
     * @return {[type]} [description]
     */
    getCheckedPipelineLayers: function(){
        var earthObj = LayerManagement.earth;
        var rootLayer = LayerManagement.getRootLayer(earthObj);
        var zNodes = [];
        var childCount = rootLayer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = rootLayer.GetChildAt(i);
            if (SYSTEMPARAMS.project === childLayer.Guid) {
                var children = LayerManagement.getChildPipelineLayers(childLayer, true);
                return children;
            }
        }
        return null;
    },

    /**
     * 获取管线子图层
     * @param  {[type]} layer    [description]
     * @param  {[type]} bChecked [description]
     * @return {[type]}          [description]
     */
    getChildPipelineLayers: function(layer, bChecked){
        if (!layer) {
            layer = LayerManagement.earth.LayerManager.LayerList;
        }
        var layerData = [];
        var childCount = layer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = layer.GetChildAt(i);
            var id = childLayer.Guid;
            var name = childLayer.Name;
            if (name === "buffer") {
                childLayer.Visibility = false;
            }
            var visibility = childLayer.Visibility;
            var layerType = childLayer.LayerType;
            if(layerType == "Pipeline" && bChecked == visibility){
                layerData.push(childLayer);
                continue;
            }
            var count = childLayer.GetChildCount();
            if (count > 0) {
                var children = this.getChildPipelineLayers(childLayer, bChecked);
                layerData = layerData.concat(children);
            }
        }
        return layerData;
    },

    /**
     * 获取当前管线图层
     * @return {[type]} [description]
     */
    getPipeTreeData:function(){
        var earthObj = LayerManagement.earth;
        var rootLayer = LayerManagement.getRootLayer(earthObj);
        var zNodes = [];
        var childCount = rootLayer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = rootLayer.GetChildAt(i);
            if (SYSTEMPARAMS.project === childLayer.Guid) {
                LayerManagement.PIPELINELAYERS = []; //记录所有管线图层
                var children = LayerManagement.getPipelineLayerData(childLayer);
                var data = {};
                data.id = childLayer.Guid;
                data.name = childLayer.Name;
                if (childLayer.Name === "buffer") {
                    childLayer.visibility = false;
                }
                data.checked = childLayer.visibility;
                data.icon = LayerManagement.getLayerIcon(childLayer.LayerType);
                data.children = children;
                zNodes.push(data);
            }
        }
        return zNodes;
    },

    /**
     * 功能：获取管线图层数据
     * 参数：layer-图层根节点
     * 返回值：图层管线数据数组
     */
    getPipelineLayerData: function(layer) {
        if (!layer) {
            layer = LayerManagement.earth.LayerManager.LayerList;
        }
        var layerData = [];
        var childCount = layer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = layer.GetChildAt(i);
            var id = childLayer.Guid;
            var name = childLayer.Name;
            if (name === "buffer") {
                childLayer.Visibility = false;
            }
            var visibility = childLayer.Visibility;
            var layerType = childLayer.LayerType;
            var count = childLayer.GetChildCount();
            if (count > 0) {
                if (layerType === "Project" || layerType === "Folder" || layerType === "Pipeline") {/* || layerType === "Pipeline"*/
                    var children = this.getPipelineLayerData(childLayer);
                    if (children.length > 0) {
                        var data = {};
                        data.id = id;
                        data.name = name;
                        data.checked = visibility;
                        data.icon = this.getLayerIcon(layerType);
                        data.children = children;
                        layerData.push(data);
                        if(layerType == "Pipeline"){
                            LayerManagement.PIPELINELAYERS.push({
                                'id': data.id,
                                'name': data.name,
                                'server': childLayer.GISServer,
                                'pltype': childLayer.PipeLineType,
                                customColor: childLayer.CustomColor
                            });
                        }
                    }
                }
            } else { //添加Container_Og和Joint_Og架空管线，add by zhangd
                if ((layerType === "Container") || (layerType === "Container_Og")
                    || (layerType === "Equipment") || (layerType === "Joint")
                    || (layerType === "Joint_Og") || (layerType === "Well")
                    || (layerType === "Plate") || (layerType === "Buffer")
                    || (layerType.toUpperCase() === "ROOM") || (layerType === "Model_container")
                    || (layerType === "Model_camera") || (layerType === "Model_catchment")
                    || (layerType === "Model_equipment") || (layerType === "Model_plate") ||
                    (layerType === "Model_sensor") || (layerType === "Model_upperplate")
                    ||(layerType === "line2_zd") || (layerType == "Danger")) {
                    if (layerType === "Equipment") {
                        name = "附属设施";
                    } else if (layerType === "Container") {
                        name = "管线";
                    } else if (layerType === "Well") {
                        name = "井";
                    } else if (layerType === "Joint") {
                        name = "特征";
                    } else if (layerType === "Plate") {
                        name = "井盖";
                    } else if (name === "buffer") { //这里为啥图层的name为buffer呢
                        childLayer.visibility = false;
                    } else if (layerType.toUpperCase() == "ROOM") {
                        name = "井室";
                    } else if (layerType === "Container_Og") {
                        name = "地上管线";
                    } else if (layerType === "Joint_Og") {
                        name = "地上特征";
                    }else if(layerType === "line2_zd"){
                        name="地铁";
                    }else if(layerType === "GISPOI"){
                        name="兴趣点";
                    }else if(layerType === "GISPolyline"){
                        name="道路";
                    }else if(layerType === "GISPolygon"){
                        name ="现状用地";
                    }else if(layerType === "Danger"){
                        name = "管廊";
                    }
                    var data = {};
                    data.id = id;
                    data.name = name;
                    data.checked = visibility;
                    data.icon = this.getLayerIcon(layerType);
                    layerData.push(data);
                }
            }
        }
        return layerData;
    },

    /**
     * 图层树节点勾选
     * @param  {[type]} earth          [三维球]
     * @param  {[type]} node           [勾选节点]
     * @param  {[type]} editLayersList [编辑中的图层节点列表]
     * @return {[type]}                [description]
     */
    layerTreeCheck: function(earth, node, editLayersList) {
    	if(editLayersList){//如果当前编辑中的图层列表不为空
    		this.editLayers = editLayersList;
    	}else if(this.editLayers){//如果编辑图层本身不为空
    		editLayersList = this.editLayers;
    	}
        if (node && node.id) {
    		if (node.children && node.children.length > 0) {
                for (var i = 0; i < node.children.length; i++) {
                    this.layerTreeCheck(earth, node.children[i]);
                }
            }else {
	        	if(node.type == "OLD01"){
	        		var nodeEditLayer = editLayersList[node.id];
	        		nodeEditLayer.Visibility = node.checked;
				}else{
					var id = node.id;
	                var layerObj = earth.LayerManager.GetLayerByGUID(id);
	                if(layerObj){
	                	layerObj.Visibility = node.checked;
	                }
	                
				}
        	}
        }
    },
    
    /**
     * 功能：定位到选定的图层
     * 参数：lonLatRect-图层范围对象
     * 返回值：无
     */
    flyToLayer: function(earth, lonLatRect) {
        var rectNorth = lonLatRect.North;
        var rectSouth = lonLatRect.South;
        var rectEast = lonLatRect.East;
        var rectWest = lonLatRect.West;

        var centerX = (rectEast + rectWest) / 2;
        var centerY = (rectNorth + rectSouth) / 2;
        var width = (parseFloat(rectNorth) - parseFloat(rectSouth)) / 2;
        var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
        earth.GlobeObserver.FlytoLookat(centerX, centerY, 0, 0, 90, 0, range, 5);
    },

    /**
     * 功能：双击图层列表
     * 参数：earth,节点
     * 返回值：无
     */
    layerTreeDbClick: function(earth, node) {
        if (node && node.id) {
        	var layers = [];
        	var layerList = {};
        	if(node.type === "OLD01"){
        		earth.DatabaseManager.GetAllLayer(STAMP_config.server.dataServerIP);
			    earth.Event.OnEditDatabaseFinished = function (pRes, Feature) {
			    	earth.Event.OnEditDatabaseFinished = function() {};
			        for (var i = 0; i < Feature.GetChildCount(); i++) {
			            var templayer = Feature.GetChildAt(i);
			            if (templayer.GroupID == -3){
			            	layers.push(templayer); 
			            	layerList[templayer.Guid] = templayer;
			            }
			        }
			        var layerObj = layerList[node.id];
			        var rect = layerObj.LonLatRect;
                    //若当前为二维球显示状态则替换earth为二维球，从而实现二维球定位图层
                    if(top.$("#earthDiv1").width() != 0){
                        if((top.$("#earthDiv1").parent().width()/top.$("#earthDiv1").width()) == 2){
                            //此时为二三维球同时显示状态
                            for (var i = 0; i < top.LayerManagement.earthArray.length; i++) {
                                LayerManagement.flyToLayer(top.LayerManagement.earthArray[i], rect); //定位图层
                            };
                            return;
                        }else{
                            //此时为只显示二维球的状态
                            if(top.LayerManagement.earthArray && top.LayerManagement.earthArray.length > 1){
                                earth = top.LayerManagement.earthArray[1];
                            }
                        }
                    }
                    LayerManagement.flyToLayer(earth, rect); //定位图层
			    }
        	}else{
        		var id = node.id;
	            var layerObj = earth.LayerManager.GetLayerByGUID(id);
	            if(layerObj){
	            	var rect = layerObj.LonLatRect;
                    //若当前为二维球显示状态则替换earth为二维球，从而实现二维球定位图层
                    if(top.$("#earthDiv1").width() != 0){
                        if((top.$("#earthDiv1").parent().width()/top.$("#earthDiv1").width()) == 2){
                            for (var i = 0; i < top.LayerManagement.earthArray.length; i++) {
                                LayerManagement.flyToLayer(top.LayerManagement.earthArray[i], rect); //定位图层
                            };
                            return;
                        }else{
                            if(top.LayerManagement.earthArray && top.LayerManagement.earthArray.length > 1){
                                earth = top.LayerManagement.earthArray[1];
                            }
                        }
                    }
	        		LayerManagement.flyToLayer(earth, rect); //定位图层
	            }
        	}
        }
    },

    /**
     * 功能：根据图层类型，获取图标样式
     * 参数：layerType-图层类型
     * 返回值：图标样式
     */
    getLayerIcon: function(layerType) {
        var icon = "../../images/layer/";
        if (layerType === "DEM") {
            icon += 'DEM.png';
        }else if (layerType === "DOM") {
            icon += 'DOM.png';
        }else if (layerType === "POI" || layerType === "GISPOI") {
            icon += 'POI.png';
        }else if (layerType === "Map") {
            icon += 'Map.png';
        } else if (layerType === "Vector") {
            icon += 'layer_vector.gif';
        } else if (layerType === "Model") {
            icon += 'Model.png';
        } else if (layerType === "Water") {//水面模型
            icon += 'Water.png';
        }else if (layerType === "Building") {//建筑模型
            icon += 'Building.png';
        }else if (layerType === "Ground") {//建筑模型
            icon += 'Ground.png';
        } else if (layerType === "Block") {
            icon += 'Block.png';
        } else if (layerType === "MatchModel") {
            icon += 'MatchModel.png';
        } else if (layerType === "Billboard") {
            icon += 'Billboard.png';
        } else if (layerType === "Annotation") {
            icon += 'Annotation.png';
        } else if (layerType === "Equipment") {
            icon += 'Equipment.png';
        } else if (layerType === "Container") {
            icon += 'layer_container2.png';
        } else if (layerType === "Well") {
            icon += 'layer_well.png';
        } else if (layerType === "Joint") {
            icon += 'layer_joint2.png';
        } else if (layerType === "Plate") {
            icon += 'layer_plate.png';
        } else if (layerType === "Pipeline") {
            icon += 'layer_pipeline.png';
        }else if (layerType === "Room") {
            icon += 'Room.png';
        } else if (layerType === "Danger") {
            icon += 'Model.png';
        } else if (layerType === "Project") {
            icon += 'Project.png';
        } else if (layerType === "Powerline") {
            icon += 'Powerline.png';
        }else if (layerType === "CurrentLand") {//现状用地
            icon += 'CurrentLand.png';
        }else if (layerType === "CurrentRoad") {//道路
            icon += 'CurrentRoad.png';
        }else if (layerType === "CurrentGreenbelt") {//现状用地
            icon += 'CurrentGreenbelt.png';
        }else if (layerType === "Canton") {//区划
            icon += 'Canton.png';
        }else if (layerType === "RegulatoryFigure") {//控规
            icon += 'RegulatoryFigure.png';
        }else if (layerType === "CurrentBuilding") {//现状建筑
            icon += 'CurrentBuilding.png';
        }   else if (layerType === "Line") {
            icon += 'layer_line.gif';
        } else if (layerType === "Tower") {
            icon += 'layer_tower.gif';
        }else if(layerType === 'Folder'){
            icon += 'folder.png';
        }else if(layerType === "Container_Og"){
            icon +='Container_Og.png';
        }else if(layerType === "Joint_Og"){
            icon +='Joint_Og.png';
        }else if(layerType === "GISVector"){
            icon += 'layer_road.png';
        }else if(layerType === "GISPolygon"){
            icon += 'layer_konggui.png';
        }else{
            icon += "default.png";
        }
        return icon;
    },

    /**
     * 显示气泡
     * @param  {[type]} vecCenter.X [description]
     * @param  {[type]} vecCenter.Y [description]
     * @param  {[type]} vecCenter.Z [description]
     * @param  {[type]} htmlStr     [description]
     * @return {[type]}             [description]
     */
    showHtmlBalloon: function(vecCenterX, vecCenterY, vecCenterZ, htmlStr) {
        var earth = top.LayerManagement.earth;
        if (top.LayerManagement.htmlBalloon) {
            top.LayerManagement.htmlBalloon.DestroyObject();
            top.LayerManagement.htmlBalloon = null;
        }
        var guid = earth.Factory.CreateGuid();
        top.LayerManagement.htmlBalloon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
        top.LayerManagement.htmlBalloon.SetSphericalLocation(vecCenterX, vecCenterY, vecCenterZ);

        var color = parseInt("0xffffff00");
        top.LayerManagement.htmlBalloon.SetTailColor(color);
        top.LayerManagement.htmlBalloon.SetIsAddCloseButton(true);
        top.LayerManagement.htmlBalloon.SetIsAddMargin(true);
        top.LayerManagement.htmlBalloon.SetIsAddBackgroundImage(true);
        if(top.SYSTEMPARAMS.balloonAlpha > 0){
            top.LayerManagement.htmlBalloon.SetRectSize(300, 340);
            top.LayerManagement.htmlBalloon.SetIsTransparence(true);
        }else{
            top.LayerManagement.htmlBalloon.SetRectSize(340, 380);
            top.LayerManagement.htmlBalloon.SetIsTransparence(false);
        }
        top.LayerManagement.htmlBalloon.SetBackgroundAlpha(0xcc);
        top.LayerManagement.htmlBalloon.ShowHtml(htmlStr);

        top.Stamp.Tools.OnHtmlBalloonFinishedFunc(guid,function(closeBid){
            if (top.LayerManagement.htmlBalloon != null) {
                top.LayerManagement.htmlBalloon.DestroyObject();
                top.LayerManagement.htmlBalloon = null;
            }
        });
    },
    /**
     * 清除图层的查询或者分析结果
     * @return {[type]} [description]
     */
    clearSearchResult: function () {
        for (var i = 0; i < LayerManagement.searchLayers.length; i++) {
            var thisSearchLayer = LayerManagement.searchLayers[i];
            if(!thisSearchLayer.GUID){
                thisSearchLayer = earth.LayerManager.GetLayerByGUID(thisSearchLayer.id);
            }
            thisSearchLayer.ClearSearchResult();
        }
        LayerManagement.searchLayers = [];
    }
};

/**
 * 根据标准名称返回显示字段名称
 * @param  {[type]} standardName     标准字段名称
 * @param  {[type]} pipeType         管线类型 1 -- 管线 0 -- 管点
 * @param  {[type]} returnFiledName  true返回FiledName false返回CaptionName
 * @return {[type]}                  显示名称
 */
function getName(standardName, pipeType, returnFiledName) {
    if (standardName === "" || standardName === undefined) {
        return;
    }
    if (pipeType === "" || pipeType === undefined) {
        return;
    }
    var configXML = SYSTEMPARAMS.pipeFieldMap;
    if (configXML == null) {
        return;
    }
    var lineData;
    if (pipeType === 1 || pipeType === "1") {
        lineData = configXML.getElementsByTagName("LineFieldInfo")[0] ? configXML.getElementsByTagName("LineFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
    } else if (pipeType === 0 || pipeType === "0") {
        lineData = configXML.getElementsByTagName("PointFieldInfo")[0] ? configXML.getElementsByTagName("PointFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
    }
    if (lineData && lineData.childNodes.length) {
        for (var i = lineData.childNodes.length - 1; i >= 0; i--) {
            var item = lineData.childNodes[i];
            if (item.getAttribute("StandardName").toUpperCase() == standardName.toUpperCase()) {
                if (returnFiledName) {
                    return item.getAttribute("FieldName").toUpperCase();
                } else {
                    return item.getAttribute("CaptionName");
                }
            }
        };
    }
};

/**
 * 根据数据库字段名称返回标准名称（不计大小写）
 * @param  {[type]} fieldName     数据库字段名称
 * @param  {[type]} pipeType         管线类型 1 -- 管线 0 -- 管点
 * @param  {[type]} returnStandardName  true返回StandardName false返回CaptionName
 * @return {[type]}                  显示名称
 */
function getNameNoIgnoreCase(standardName, pipeType, returnFiledName) {
    if (standardName === "" || standardName === undefined) {
        return;
    }
    if (pipeType === "" || pipeType === undefined) {
        return;
    }
    var configXML = SYSTEMPARAMS.pipeFieldMap;
    var lineData;
    if (pipeType === 1 || pipeType === "1") {
        lineData = configXML.getElementsByTagName("LineFieldInfo")[0] ? configXML.getElementsByTagName("LineFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
    } else if (pipeType === 0 || pipeType === "0") {
        lineData = configXML.getElementsByTagName("PointFieldInfo")[0] ? configXML.getElementsByTagName("PointFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
    }
    if (lineData && lineData.childNodes.length) {
        for (var i = lineData.childNodes.length - 1; i >= 0; i--) {
            var item = lineData.childNodes[i];
            if (item.getAttribute("StandardName") == standardName) {
                if (returnFiledName) {
                    return item.getAttribute("FieldName");
                } else {
                    return item.getAttribute("CaptionName");
                }
            }
        };
    }
};

/**
 * 得到是否需要转码
 * @param  {[type]} layerCode [图层编码]
 * @param  {[type]} childCode [子图层编码]
 * @param  {[type]} codeType  [字段类型]
 * @return {[type]}           [description]
 */
function bFromCode(layerCode, childCode, codeType){
    if(layerCode == null || layerCode == "" || childCode == null || childCode == ""){
        return true;
    }else{
        if(codeType == "Attachment" || codeType == "MaterialType"){
            if(layerCode.toString().length == childCode.toString().length && layerCode.toString().substr(0,1) == childCode.toString().substr(0,1)){
                return true;
            }else{
                return false;
            }
        }else if(codeType == "WellTypeByAtt"){
            if(layerCode == childCode){
                return true;
            }else{
                return false;
            }
        }else{
            return true;
        }
    }
}

/**
 * 根据value类型和value的自定义值，获取其显示值
 * @param  {[type]} layerCode   [图层编码]
 * @param  {[type]} type        [字段类型]
 * @param  {[type]} customValue [自定义值]
 * @return {[type]}             [description]
 */
function getCaptionByCustomValue(layerCode, type, customValue){
    if(type == undefined || type == ""){
        return customValue;
    }
    if(customValue == undefined || customValue == ""){
        return "";
    }
    var code = 0;

    var configXML = SYSTEMPARAMS.valueMap;
    var lineData = configXML.getElementsByTagName(type);
    if(lineData && lineData.length > 0){
        for(var i = 0; i < lineData.length; i++){
            var item = lineData[i];
            if(type == "MaterialType"){
                var codeValue = item.getElementsByTagName("ClassID")[0].text;
            }else if(type == "WellTypeByAtt"){
                var codeValue = item.getElementsByTagName("Group")[0].text;
            }else if(item.getElementsByTagName("Code")[0]){
                var codeValue = item.getElementsByTagName("Code")[0].text;
            }
            
            var fieldValue = item.getElementsByTagName("Customer")[0].text;

            if(Number(fieldValue)>0){
                fieldValue = Number(fieldValue);
            }
            if(Number(customValue)>0){
                customValue = Number(customValue);
            }
            if (bFromCode(layerCode, codeValue, type) && fieldValue === customValue) {
                if(item.getElementsByTagName("Caption")[0]){
                   return item.getElementsByTagName("Caption")[0].text; 
                }else if(item.getElementsByTagName("Standard")[0]){
                    return item.getElementsByTagName("Standard")[0].text;
                }
            }
        }
        return customValue;
    }else{
        return customValue;
    }
}