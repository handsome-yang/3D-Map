/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：关于图层树构造和一些操作图层的方法
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 **************************************************/
var LayerManagement = {
    searchLayers: [],//进行了查询分析的图层
    earth: null,
    historyLayers: {},//历史图层
    earthArray: [], //保存earth
    PIPELINELAYERS: [],//记录所有管线图层
    POILAYERS: [],//记录所有管线POI图层
    pipelineSelectId: [],//所有图层中的管线图层
    PROJECTLIST: [],//工程列表
    htmlBalloon: null,//详细信息气泡框
    importPipeLines: [],//重点管线
    modelLayerList: [],//模型图层数组
    balloonsFunc: new ActiveXObject("Scripting.Dictionary"),
    OnHtmlBalloonFinishedFunc: function (curBid, callback) {//全局OnHtmlBalloonFinished事件
        LayerManagement.balloonsFunc.item(curBid) = callback;
        LayerManagement.earth.event.OnHtmlBalloonFinished = function (closeBid) {
            if (LayerManagement.balloonsFunc.Exists(closeBid)) {
                LayerManagement.balloonsFunc.item(closeBid)(closeBid);
                LayerManagement.balloonsFunc.Remove(closeBid);
            }
        };
    },
    /**
     * 功能：获取图层根节点
     * 参数：无
     * 返回值：图层根节点
     */
    getRootLayer: function (earth) {
        var rootLayer = earth.LayerManager.LayerList;
        return rootLayer;
    },
    initLayerDataType: function (earth, layer) {
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
     * 功能：获取指定图层下的所有管线图层列表
     * 参数：layer-指定图层
     * 返回：指定图层下的所有管线图层列表
     */
    getPipeListByLayer: function (layer) {
        if (layer == null) return;
        var pipelineArr = [];
        var count = layer.GetChildCount();
        for (var i = 0; i < count; i++) {
            var childLayer = layer.GetChildAt(i);
            var layerTypeC = childLayer.LayerType;
            var nameC = childLayer.Name;
            if (layerTypeC === "Pipeline") {
                var pipelineId = childLayer.Guid;
                var pipelineName = childLayer.Name;
                var pipelineServer = childLayer.GISServer;
                var layerType = childLayer.PipeLineType;
                top.LayerManagement.searchLayers.push(childLayer);
                pipelineArr.push({
                    id: pipelineId,
                    name: pipelineName,
                    server: pipelineServer,
                    LayerType: layerType
                });
            } else {
                var childCount = childLayer.GetChildCount();
                if (childCount > 0) {
                    var childPipelineArr = this.getPipeListByLayer(childLayer);
                    for (var k = 0; k < childPipelineArr.length; k++) {
                        pipelineArr.push(childPipelineArr[k]);
                    }
                }
            }
        }
        return pipelineArr;
    },
    /**
     * 功能：递归获取管线图层Guid集合
     * 参数：layer-图层根节点（最开始是工程级图层）
     * 返回值：该图层的子节点是否全部是管线图层
     （ true：该图层所有子节点全部是管线图层，则该根节点也需要push进管线图层Guid集合中；
     false：该图层所有子节点不全是管线图层，则该根节点不需要push进管线图层Guid集合中）
     */
    getPipelineSelectIds: function (layer) {
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
     * 功能：获取指定图层下的所有勾选选中的管线图层列表
     * 参数：layer-指定图层
     * 返回：指定图层下的所有管线图层列表
     */
    getPipeListByLayerChecked: function (layer) {
        var pipelineArr = [];
        var count = layer.GetChildCount();
        var checkCount = $.fn.zTree.getZTreeObj("pipelineLayerTree").getCheckedNodes(true);
        if (checkCount) {
            for (var j = 0; j < checkCount.length; j++) {
                var node = checkCount[j];
                for (var i = 0; i < count; i++) {
                    var childLayer = layer.GetChildAt(i);
                    var layerTypeC = childLayer.LayerType;
                    if (node.id === childLayer.Guid) {
                        if (layerTypeC === "Pipeline") {
                            var pipelineId = childLayer.Guid;
                            var pipelineName = childLayer.Name;
                            var pipelineServer = childLayer.GISServer;
                            var layerType = childLayer.PipeLineType;
                            pipelineArr.push({
                                id: pipelineId,
                                name: pipelineName,
                                server: pipelineServer,
                                LayerType: layerType
                            });
                        } else {
                            var childCount = childLayer.GetChildCount();
                            if (childCount > 0) {
                                var childPipelineArr = this.getPipeListByLayerChecked(childLayer);
                                for (var k = 0; k < childPipelineArr.length; k++) {
                                    pipelineArr.push(childPipelineArr[k]);
                                }
                            }
                        }
                    }
                }
            }
        }

        return pipelineArr;
    },
    /*
     *功能显示保护区域或者管理区域
     *type=mScope为管理区域，type=pScope为保护区域
     *layerId为重点管线图层id
     */
    showBufferLayer: function (type, layerId) {
        var tempLayer = LayerManagement.earth.LayerManager.GetLayerByGUID(layerId);
        var rect = tempLayer.LonLatRect;
        var rectNorth = rect.North;
        var rectSouth = rect.South;
        var rectEast = rect.East;
        var rectWest = rect.West;
        var centerX = (rectEast + rectWest) / 2;
        var centerY = (rectNorth + rectSouth) / 2;
        var width = (parseFloat(rectNorth) - parseFloat(rectSouth)) / 2;
        var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);

        //修改为从xml中获取
        var mScope;
        var pScope;
        var fillColor;
        var importIndex = undefined;
        for (var i = 0; i < LayerManagement.importPipeLines.length; i++) {
            if (layerId === LayerManagement.importPipeLines[i].guid) {
                importIndex = i;
                mScope = LayerManagement.importPipeLines[i].mScope;
                pScope = LayerManagement.importPipeLines[i].pScope;
                fillColor = LayerManagement.importPipeLines[i].fillColor;
            }
        }
        if (type.toUpperCase() === "MSCOPE") {
            tempLayer.BufferDist = Number(mScope);
        } else if (type.toUpperCase() === "PSCOPE") {
            tempLayer.BufferDist = Number(pScope);
        }
        tempLayer.BufferColor = parseInt("0x" + "504BE064");
        tempLayer.ShowPipeLineBuffer(true);
        if (importIndex !== undefined && type === "MScope") {
            LayerManagement.importPipeLines[importIndex].IsMOpen = true;
            LayerManagement.importPipeLines[importIndex].IsPOpen = false;
        } else if (importIndex !== undefined && type === "PScope") {
            LayerManagement.importPipeLines[importIndex].IsMOpen = false;
            LayerManagement.importPipeLines[importIndex].IsPOpen = true;
        }
        return 1;
    },
    /**
     * 隐藏所有的重点管线的缓冲区域
     */
    hideAllBufferLayers: function () {
        for (var i = 0; i < LayerManagement.importPipeLines.length; i++) {
            var pID = LayerManagement.importPipeLines[i].guid;
            LayerManagement.hideBufferLayer(pID);
        }
    },
    /**
     * 隐藏单个图层的缓冲区域
     * @param  {[string]} layerId [图层的guid]
     */
    hideBufferLayer: function (layerId) {
        var isPipe = false;
        var importIndex = undefined;
        for (var i = 0; i < LayerManagement.importPipeLines.length; i++) {
            var pID = LayerManagement.importPipeLines[i].guid;
            if (pID === layerId) {
                isPipe = true;
                importIndex = i;
            }
        }
        if (isPipe) {
            var tempLayer = LayerManagement.earth.LayerManager.GetLayerByGUID(layerId);
            tempLayer.ShowPipeLineBuffer(false);
            if (importIndex != undefined) {
                LayerManagement.importPipeLines[importIndex].IsMOpen = false;
                LayerManagement.importPipeLines[importIndex].IsPOpen = false;
            }
        }
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
        var earth = LayerManagement.earth;
        if (LayerManagement.htmlBalloon) {
            LayerManagement.htmlBalloon.DestroyObject();
            LayerManagement.htmlBalloon = null;
        }
        var guid = earth.Factory.CreateGuid();
        var earthHeight = $("#earthDiv", window.parent.document).height();
        var balloonHeight = earthHeight / 2 - 50;
        var divHeight = balloonHeight - 30;
        $("<div id='re' style='display:none;'></div>").appendTo("body");
        $("#re").html(htmlStr);
        $("#re").find("div").height(divHeight);
        LayerManagement.htmlBalloon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
        LayerManagement.htmlBalloon.SetSphericalLocation(vecCenterX, vecCenterY, vecCenterZ);
        if(SYSTEMPARAMS.balloonAlpha >0 ){
            htmlStr = $("#re").html();
            LayerManagement.htmlBalloon.SetRectSize(300, balloonHeight);
            LayerManagement.htmlBalloon.SetIsTransparence(true);
        }else{
            LayerManagement.htmlBalloon.SetRectSize(340, 380);
            LayerManagement.htmlBalloon.SetIsTransparence(false);
        }
        var color = parseInt("0xffffff00");
        LayerManagement.htmlBalloon.SetTailColor(color);
        LayerManagement.htmlBalloon.SetIsAddCloseButton(true);
        LayerManagement.htmlBalloon.SetIsAddMargin(true);
        LayerManagement.htmlBalloon.SetIsAddBackgroundImage(true);
        LayerManagement.htmlBalloon.SetBackgroundAlpha(0xcc);
        LayerManagement.htmlBalloon.ShowHtml(htmlStr);
        Stamp.Tools.OnHtmlBalloonFinishedFunc(guid,function(closeBid){
            if (LayerManagement.htmlBalloon != null) {
                LayerManagement.htmlBalloon.DestroyObject();
                LayerManagement.htmlBalloon = null;
            }
        });
    },
    /**
     * 清除详细信息气泡
     * @return {[type]} [description]
     */
    clearHtmlBalloons: function () {
        if (LayerManagement.htmlBalloon != null) {
            LayerManagement.htmlBalloon.DestroyObject();
            LayerManagement.htmlBalloon = null;
        }
    },
    /*
     * 获取基本图层数据
     * @param  {object} layer 图层
     */
    getLayerTreeData: function (layer) {
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
            var id = childLayer.Guid;
            var data = {};
            var layerType = childLayer.LayerType;
            if (layerType === "POI") {
                LayerManagement.POILAYERS.push({
                    'id': id,
                    'name': name,
                    'server': childLayer.GISServer,
                    'pltype': childLayer.PipeLineType
                });
            }
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
            } else if (name == "buffer") {
                childLayer.visibility = false;
            } else if (name == "room") {
                name = "井室";
            } else if (name == "container_og") {
                name = "地上管线"
            } else if (name == "joint") {
                name = "特征";
            } else if (name == "joint_og") {
                name == "地上特征";
            }
            data.id = id;
            data.name = name;
            data.checked = childLayer.Visibility;
            data.type = layerType;
            var demType = childLayer.DEMType;
            if (demType.toUpperCase() === "TIN" || demType.toUpperCase() === "GRID") {
                layerType = "DEM"
            }
            layerType = layerType ? layerType : "DOM";
            if (layerType == "Model" && childLayer.DataType == "Water") {
                layerType = "Water";
            }
            if (layerType == "Model" && childLayer.DataType == "Building") {
                layerType = "Building";
            }
            if (layerType == "Model" && childLayer.DataType == "Ground") {
                layerType = "Ground";
            }
            if (childLayer.DataType == "CurrentRoad") {
                layerType = "Ground";
            }
            if (layerType == "GISVector" && childLayer.DataType == "CurrentLand") {
                layerType = "CurrentLand";
            }
            if (layerType == "GISVector" && childLayer.DataType == "Canton") {
                layerType = "Canton";
            }
            if (layerType == "GISVector" && childLayer.DataType == "CurrentGreenbelt") {
                layerType = "CurrentGreenbelt";
            }
            if (layerType == "GISVector" && childLayer.DataType == "RegulatoryFigure") {
                layerType = "RegulatoryFigure";
            }
            if (layerType == "GISVector" && childLayer.DataType == "CurrentBuilding") {
                layerType = "CurrentBuilding";
            }
            data.icon = LayerManagement.getLayerIcon(layerType);

            var count = childLayer.GetChildCount();
            layerData.push(data);
            if (count > 0) {
                var bFlagPipeline = false;
                var bFlagPipeline = false;
                if (LayerManagement.pipelineSelectId.length > 0) { //清除基础图层中所有的管线图层（基础图层中不应该包括管线图层）
                    for (var a = 0; a < LayerManagement.pipelineSelectId.length; a++) {
                        if (LayerManagement.pipelineSelectId[a] === childLayer.Guid) {
                            layerData.splice(layerData.length - 1, 1);
                            bFlagPipeline = true;
                            break;
                        }
                    }
                    if (!bFlagPipeline) {
                        data.children = LayerManagement.getLayerTreeData(childLayer);
                    }
                } else {
                    data.children = LayerManagement.getLayerTreeData(childLayer);
                }
            }
        }
        return layerData;
    },
    /**
     * 获取当前工程管线图层
     * @return {[type]} [description]
     */
    getPipeTreeData: function () {
        var earthObj = LayerManagement.earth;
        var rootLayer = LayerManagement.getRootLayer(earthObj);
        var zNodes = [];
        var childCount = rootLayer.GetChildCount();
        for (var i = 0; i < childCount; i++) {
            var childLayer = rootLayer.GetChildAt(i);
            if (SYSTEMPARAMS.project === childLayer.Guid) {
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
     * 初始化时保存所有模型图层
     * @param {[object]} layer [图层]
     */
    GetModelLayers: function (layer) {

        var count = layer.GetChildCount();
        for (var i = 0; i < count; i++) {
            var childLayer = layer.GetChildAt(i);
            if (childLayer.GetChildCount() > 0) {
                LayerManagement.GetModelLayers(childLayer);
            } else {
                var retLayer = {};
                retLayer.layer = childLayer;
                retLayer.guid = childLayer.Guid;
                retLayer.name = childLayer.Name;
                LayerManagement.modelLayerList.push(retLayer);
            }
        }
    },
    /**
     * 获取管线图层数据
     * 参数：layer-图层根节点
     * 返回值：图层管线数据数组
     */
    getPipelineLayerData: function (layer) {
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
            if (name === "model") { //根据当前项目的模型图层名称来判断模型图层
                //zhangd修改保存模型图层的方式，之前是只保存最外层模型图层，这里是保存所有子模型图层
                LayerManagement.GetModelLayers(childLayer);
            }
            //如果是重点管线则添加到数组对象中 2014.1.6
            if (childLayer.KeyLine) {
                LayerManagement.importPipeLines.push({
                    guid: childLayer.guid,
                    name: childLayer.name,
                    mScope: childLayer.MScope,
                    pScope: childLayer.PScope
                });
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
                        if (layerType == "Pipeline") {
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
                    || (layerType === "line2_zd") || (layerType == "Danger")) {
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
                    } else if (layerType === "line2_zd") {
                        name = "地铁";
                    } else if (layerType === "GISPOI") {
                        name = "兴趣点";
                    } else if (layerType === "GISPolyline") {
                        name = "道路";
                    } else if (layerType === "GISPolygon") {
                        name = "现状用地";
                    } else if (layerType === "Danger") {
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
     * 递归判断该图层下是否有管线图层，存在管线图层的工程才显示在系统设置的切换工程中
     * @param {[object]} [layer] [工程图层]
     */
    hasPipelinelayer: function (layer) {
        var bHasPipeline = false;
        var layerCount = layer.GetChildCount();
        for (var s = 0; s < layerCount; s++) {
            var childLayer = layer.GetChildAt(s);
            var pipelayerType = childLayer.LayerType;
            if (pipelayerType === "Pipeline") {
                return true;
            } else if (pipelayerType === "Folder") {
                bHasPipeline = LayerManagement.hasPipelinelayer(childLayer);
                if (bHasPipeline) {
                    return true;
                }
            }
        }
        return false;
    },
    /**
     * 通过判断工程下是否有管线图层，得到管线图层集合
     * @return {[type]} [description]
     */
    initProjectList: function () {
        if(LayerManagement.PROJECTLIST.length){//如果有值证明已经初始化过了
            return LayerManagement.PROJECTLIST;
        }
        var rootLayerList = LayerManagement.earth.LayerManager.LayerList;
        var projectCount = rootLayerList.GetChildCount();
        for (var i = 0; i < projectCount; i++) {
            var childLayer = rootLayerList.GetChildAt(i);

            var layerType = childLayer.LayerType;
            if (layerType === "Project") {
                var projectId = childLayer.Guid;
                var projectName = childLayer.Name;
                var pipeTag = false;
                pipeTag = LayerManagement.hasPipelinelayer(childLayer);
                if (pipeTag) {
                    LayerManagement.PROJECTLIST.push({id: projectId, name: projectName});
                }
            }
        }
        return LayerManagement.PROJECTLIST;
    },
    /**
     * 功能：图层树节点 checkbox / radio 被勾选或取消勾选的事件
     * 参数：event-标准的 js event 对象；
     *       treeId-对应图层树的Id；
     *       node-被勾选或取消的节点
     * 返回值：无
     */
    layerTreeCheck: function (earth, node) {
        if (node && node.id) {
            if (node.children && node.children.length > 0) {
                for (var i = 0; i < node.children.length; i++) {
                    this.layerTreeCheck(earth, node.children[i]);
                }
            } else {
                var id = node.id;
                var layerObj = earth.LayerManager.GetLayerByGUID(id);
                layerObj.Visibility = node.checked;
            }
        }
    },

    /**
     * 功能：定位到选定的图层
     * 参数：lonLatRect-图层范围对象
     * 返回值：无
     */
    flyToLayer: function (earth, lonLatRect) {
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
    layerTreeDbClick: function (earth, node) {
        if (node && node.id) {
            var id = node.id;
            var layerObj = earth.LayerManager.GetLayerByGUID(id);
            var rect = layerObj.LonLatRect;
            LayerManagement.flyToLayer(earth, rect); //定位图层
        }
    },
    /**
     * 功能：根据图层类型，获取图标样式
     * 参数：layerType-图层类型
     * 返回值：图标样式
     */
    getLayerIcon: function (layerType) {
        var icon = "images/layer/";
        if (layerType === "DEM") {
            icon += 'DEM.png';
        } else if (layerType === "DOM") {
            icon += 'DOM.png';
        } else if (layerType === "POI" || layerType === "GISPOI") {
            icon += 'POI.png';
        } else if (layerType === "Map") {
            icon += 'Map.png';
        } else if (layerType === "Vector") {
            icon += 'layer_vector.gif';
        } else if (layerType === "Model") {
            icon += 'Model.png';
        } else if (layerType === "Water") {//水面模型
            icon += 'Water.png';
        } else if (layerType === "Building") {//建筑模型
            icon += 'Building.png';
        } else if (layerType === "Ground") {//建筑模型
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
        } else if (layerType === "Room") {
            icon += 'Room.png';
        } else if (layerType === "Danger") {
            icon += 'Model.png';
        } else if (layerType === "Project") {
            icon += 'Project.png';
        } else if (layerType === "Powerline") {
            icon += 'Powerline.png';
        } else if (layerType === "CurrentLand") {//现状用地
            icon += 'CurrentLand.png';
        } else if (layerType === "CurrentRoad") {//道路
            icon += 'CurrentRoad.png';
        } else if (layerType === "CurrentGreenbelt") {//现状用地
            icon += 'CurrentGreenbelt.png';
        } else if (layerType === "Canton") {//区划
            icon += 'Canton.png';
        } else if (layerType === "RegulatoryFigure") {//控规
            icon += 'RegulatoryFigure.png';
        } else if (layerType === "CurrentBuilding") {//现状建筑
            icon += 'CurrentBuilding.png';
        } else if (layerType === "Line") {
            icon += 'layer_line.gif';
        } else if (layerType === "Tower") {
            icon += 'layer_tower.gif';
        } else if (layerType === 'Folder') {
            icon += 'folder.png';
        } else if (layerType === "Container_Og") {
            icon += 'Container_Og.png';
        } else if (layerType === "Joint_Og") {
            icon += 'Joint_Og.png';
        } else if (layerType === "GISVector") {
            icon += 'layer_road.png';
        } else if (layerType === "GISPolygon") {
            icon += 'layer_konggui.png';
        } else {
            icon += "default.png";
        }
        return icon;
    },
    /**
     * 系统设置点击
     * @param {[string]} id [系统设置二级菜单id]
     */
    ViewSystemSetting: function (id) {
        var params = SYSTEMPARAMS;
        var preprojectId = SYSTEMPARAMS.project;
        params.projectList = LayerManagement.PROJECTLIST;
        params.earth = LayerManagement.earth;
        params.profileAlt = SYSTEMPARAMS.profileAlt;
        params.Alt = "";
        var url = "html/view/systemSettingDialog.html";
        var value = openDialog(url, params, 306, 231);
        Tools.singleStyleCancel(id);
        if (value == null) {
            return;
        }
        if (value.project == preprojectId) {//如果工程没有变化那就只是更新其中的额参数就行了
            SYSTEMPARAMS.Position = value.Position;
            SYSTEMPARAMS.profileAlt = value.profileAlt;
            SystemSetting.setSystemConfig(value);
            return;
        }
        isProjectChanged = true;//代表工程已经被切换过了
        disabledButtonArr = [];//工程切换了被禁用的按钮也需要置空
        closeDialog();//关闭左侧面板
        SystemSetting.setSystemConfig(value);//重新初始化工程的配置的参数

        //重新初始化

        LayerManagement.PIPELINELAYERS = []; //管线图层置空
        LayerManagement.POILAYERS = []; //POI图层置空
        LayerManagement.importPipeLines = [];//重点管线置空

        SYSTEMPARAMS.project = value.project;
        SYSTEMPARAMS.Position = value.Position;
        SYSTEMPARAMS.profileAlt = value.profileAlt;
        areaTable = [];//单位、道路、行政数组置空
        init();
    },
    /**
     * 获取allLayers中的二维图层并返回
     * @param  {[Array]} allLayers [该工程下的所有图层]
     * @param  {[Array]} layers    [二维图层]
     * @return {[array]}           [二维图层]
     */
    getMapLayerLayers: function (allLayers, layers) {
        for (var i = 0; i < allLayers.length; i++) {
            var layer = allLayers[i];
            var lCount = 0;
            if (layer.children != undefined) {
                lCount = layer.children.length;
            }
            if (lCount == 0) {
                if (layer.type) {
                    var layerType = layer.type.toLowerCase();
                    if (layerType == "map" || layerType == "wms") {
                        layers.push(layer);
                    }
                } else {
                    continue;
                }
            } else {
                LayerManagement.getMapLayerLayers(layer.children, layers);
            }
        }
        return layers;
    },
    /**
     * 获取选中工程的二维图层并返回
     */
    getMapLayers: function () {
        var projectId = SYSTEMPARAMS.project;
        var projectLayer = LayerManagement.earth.LayerManager.GetLayerByGUID(projectId);
        var layers = [];
        var rootLayer = LayerManagement.getRootLayer(LayerManagement.earth);
        var zNodes = LayerManagement.getLayerTreeData(rootLayer);
        layers = LayerManagement.getMapLayerLayers(zNodes, layers);
        return layers;
    },
    /**
     * 清除图层中由于查询分析遗留下来的结果
     */
    clearSearchResult: function () {
        for (var i = 0; i < LayerManagement.searchLayers.length; i++) {
            LayerManagement.searchLayers[i].ClearSearchResult();
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
    if (!configXML) {
        return;
    }
    var lineData;
    if (pipeType === 1 || pipeType === "1") {//管线
        lineData = configXML.getElementsByTagName("LineFieldInfo")[0] ? configXML.getElementsByTagName("LineFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
    } else if (pipeType === 0 || pipeType === "0") {//管点
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
        }
    }
};
/**
 * 根据数据库字段名称返回标准名称
 * @param  {[type]} fieldName     数据库字段名称
 * @param  {[type]} pipeType         管线类型 1 -- 管线 0 -- 管点
 * @param  {[type]} returnStandardName  true返回StandardName false返回CaptionName
 * @return {[type]}                  显示名称
 */
function getStandardName(fieldName, pipeType, returnStandardName) {
    if (fieldName === "" || fieldName === undefined) {
        return;
    }
    if (pipeType === "" || pipeType === undefined) {
        return;
    }
    var configXML = SYSTEMPARAMS.pipeFieldMap;
    var lineData;
    if (pipeType === 1 || pipeType === "1") {//管线
        lineData = configXML.getElementsByTagName("LineFieldInfo")[0] ? configXML.getElementsByTagName("LineFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
    } else if (pipeType === 0 || pipeType === "0") {//管点
        lineData = configXML.getElementsByTagName("PointFieldInfo")[0] ? configXML.getElementsByTagName("PointFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
    }
    if (lineData && lineData.childNodes.length) {
        for (var i = lineData.childNodes.length - 1; i >= 0; i--) {
            var item = lineData.childNodes[i];
            if (item.getAttribute("FieldName").toUpperCase() == fieldName.toUpperCase()) {
                if (returnStandardName) {
                    return item.getAttribute("StandardName").toUpperCase();
                } else {
                    return item.getAttribute("CaptionName");
                }
            }
        }
    }
};

/**
 * 根据数据库返回的材质类型来获取对应的使用年限 ValueMap.config
 * @param  {[type]} MaterialType [description]
 * @return {[type]}              [description]
 */
function getUseYear(MaterialType) {
    if (MaterialType === "" || MaterialType === undefined) {
        return "";
    }
    var configXML = SYSTEMPARAMS.valueMap;
    var lineData = configXML.getElementsByTagName("MaterialType");
    if (lineData && lineData.length) {
        for (var i = lineData.length - 1; i >= 0; i--) {
            var item = lineData[i];
            var fieldValue = item.getElementsByTagName("Customer")[0].text;
            if (fieldValue === MaterialType) {
                return item.getElementsByTagName("UseYear")[0].text;
            }
        }
    }
}

/**
 * 根据valuemap.config中的Standard来获取Customer/Caption
 * @param  {[type]} standardName    [description]
 * @param  {[type]} returnFiledName [description]
 * @return {[type]}                 [description]
 */
function getStatusType(standardName, isCaption) {
    try {
        if (standardName === "" || standardName === undefined) {
            return;
        }
        var configXML = SYSTEMPARAMS.valueMap;
        var lineData = configXML.getElementsByTagName("StatusType");
        if (lineData && lineData.length) {
            for (var i = lineData.length - 1; i >= 0; i--) {
                var item = lineData[i];
                var fieldValue = item.getElementsByTagName("Standard")[0].text;
                if (fieldValue === standardName) {
                    if (isCaption) {
                        return item.getElementsByTagName("Caption")[0].text;
                    } else {
                        return item.getElementsByTagName("Customer")[0].text;
                    }
                }
            }
        }
    } catch (e) {
        return undefined;
    }
}
function getNameNoIgnoreCase(standardName, pipeType, returnFiledName) {
    if (standardName === "" || standardName === undefined) {
        return;
    }
    if (pipeType === "" || pipeType === undefined) {
        return;
    }
    var configXML = SYSTEMPARAMS.pipeFieldMap;
    if (!configXML) {
        alert("无管线字段映射，请配置!");
        return false;
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
            if (item.getAttribute("StandardName") == standardName) {
                if (returnFiledName) {
                    return item.getAttribute("FieldName");
                } else {
                    return item.getAttribute("CaptionName");
                }
            }
        }
    }
};
function bFromCode(layerCode, childCode, codeType) {
    if (layerCode == null || layerCode == "" || childCode == null || childCode == "") {
        return true;
    } else {
        if (codeType == "Attachment" || codeType == "MaterialType") {
            if (layerCode.toString().length == childCode.toString().length && layerCode.toString().substr(0, 1) == childCode.toString().substr(0, 1)) {
                return true;
            } else {
                return false;
            }
        } else if (codeType == "WellTypeByAtt") {
            if (layerCode == childCode) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    }
}
/**
 *  根据value类型和value的自定义值，获取其显示值
 */
function getCaptionByCustomValue(layerCode, type, customValue) {
    if (type == undefined || type == "") {
        return customValue;
    }
    if (customValue == undefined || (customValue == "" && customValue != 0)) {
        return "";
    }
    var code = 0;
    var codeValue = null;

    var configXML = SYSTEMPARAMS.valueMap;
    var lineData = configXML.getElementsByTagName(type);
    if (lineData && lineData.length > 0) {
        for (var i = 0; i < lineData.length; i++) {
            var item = lineData[i];
            if (type == "MaterialType") {
                codeValue = item.getElementsByTagName("ClassID")[0].text;
            } else if (type == "WellTypeByAtt") {
                codeValue = item.getElementsByTagName("Group")[0].text;
            } else if (type != "Ownership" && item.getElementsByTagName("Code")[0]) {
                codeValue = item.getElementsByTagName("Code")[0].text;
            }

            var fieldValue = item.getElementsByTagName("Customer")[0].text;
            if (parseInt(fieldValue) || parseInt(fieldValue) == 0) {
                fieldValue = Number(fieldValue);
            }
            if (parseInt(customValue) || parseInt(customValue) == 0) {
                customValue = Number(customValue);
            }
            if (bFromCode(layerCode, codeValue, type) && fieldValue === customValue) {
                if (item.getElementsByTagName("Caption")[0]) {
                    return item.getElementsByTagName("Caption")[0].text;
                } else if (item.getElementsByTagName("Standard")[0]) {
                    return item.getElementsByTagName("Standard")[0].text;
                }
            }
        }
        return customValue;
    } else {
        return customValue;
    }
}
//冒泡算法
function sort(arr) {
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr.length - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                var temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
    return arr;
}