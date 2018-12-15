/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 7月 22日
 * 描       述：图层管理相关模块
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 13日
 ******************************************/

var LayerManagement = {
	earth: null,
	earthArray: [], //保存earth
	PIPELINELAYERS: [], //记录所有管线图层
	POILAYERS: [], //记录所有管线POI图层
	pipelineSelectId: [], //所有图层中的管线图层
	PROJECTLIST: [], //工程列表
	htmlBalloon: null,
	importPipeLines: [], //重点管线
	guihuaArr: [],
	dataBackClick: false,
	modelLayerList: [],
	historySlider: [], //历史拉杆条数组
	demArr: [], //工程与DEM图层数组
	historyData: [],
	mapLayers: [],
	gisArr: [],
	groupLayers: [], //模型图层、Block图层、倾斜图层
	selectLayer: null, //选中的图层
	/**
	 * 功能：获取图层根节点
	 * 参数：无
	 * 返回值：图层根节点
	 */
	getRootLayer: function(earth) {
		var rootLayer = earth.LayerManager.LayerList;
		return rootLayer;
	},
	/**
	 * 初始化图层
	 * @param {Object} earth  三维求
	 * @param {Object} layer  图层
	 */
	initLayerDataType: function(earth, layer) {
		if(layer == null) {
			layer = this.getRootLayer(earth);
		}

		var childCount = layer.GetChildCount();
		for(var i = 0; i < childCount; i++) {
			var childLayer = layer.GetChildAt(i);
			if(childLayer.LocalSearchParameter != null) {
				if(childLayer.LayerType == 'POI') {
					childLayer.LocalSearchParameter.ReturnDataType = 1;
				} else {
					childLayer.LocalSearchParameter.ReturnDataType = 4;
				}
			}
			if(childLayer.GetChildCount() > 0) {
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
		for(var s = 0; s < childCount; s++) { //获取所有的管线图层ID集合，用于从基础图层中消除
			var childLayer = layer.GetChildAt(s);
			var layerType = childLayer.LayerType;
			if(layerType === "Pipeline") {
				LayerManagement.pipelineSelectId.push(childLayer.Guid);
			} else if(layerType === "Folder") {
				var bFlagg = LayerManagement.getPipelineSelectIds(childLayer);
				if(!bFlagg) {
					bAllPipeline = false;
				}
			} else {
				bAllPipeline = false;
			}
		}
		if(bAllPipeline) {
			LayerManagement.pipelineSelectId.push(layer.Guid);
		}
		return bAllPipeline;
	},
	/**
	 * 功能：获取指定图层下的所有勾选选中的管线图层列表
	 * 参数：layer-指定图层
	 * 返回：指定图层下的所有管线图层列表
	 */
	getPipeListByLayerChecked: function(layer) {
		var pipelineArr = [];
		var count = layer.GetChildCount();
		var checkCount = $.fn.zTree.getZTreeObj("pipelineLayerTree").getCheckedNodes(true);
		if(checkCount) {
			for(var j = 0; j < checkCount.length; j++) {
				var node = checkCount[j];
				for(var i = 0; i < count; i++) {
					var childLayer = layer.GetChildAt(i);
					var layerTypeC = childLayer.LayerType;
					if(node.id === childLayer.Guid) {
						if(layerTypeC === "Pipeline") {
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
							if(childCount > 0) {
								var childPipelineArr = this.getPipeListByLayerChecked(childLayer);
								for(var k = 0; k < childPipelineArr.length; k++) {
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
	showBufferLayer: function(type, layerId) { //
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
		for(var i = 0; i < LayerManagement.importPipeLines.length; i++) {
			if(layerId === LayerManagement.importPipeLines[i].guid) {
				importIndex = i;
				mScope = LayerManagement.importPipeLines[i].mScope;
				pScope = LayerManagement.importPipeLines[i].pScope;
				fillColor = LayerManagement.importPipeLines[i].fillColor;
			}
		}
		if(type.toUpperCase() === "MSCOPE") {
			tempLayer.BufferDist = Number(mScope);
		} else if(type.toUpperCase() === "PSCOPE") {
			tempLayer.BufferDist = Number(pScope);
		}
		tempLayer.BufferColor = parseInt("0x" + "504BE064");
		tempLayer.ShowPipeLineBuffer(true);
		if(importIndex !== undefined && type === "MScope") {
			LayerManagement.importPipeLines[importIndex].IsMOpen = true;
			LayerManagement.importPipeLines[importIndex].IsPOpen = false;
		} else if(importIndex !== undefined && type === "PScope") {
			LayerManagement.importPipeLines[importIndex].IsMOpen = false;
			LayerManagement.importPipeLines[importIndex].IsPOpen = true;
		}
		return 1;
	},
	/**
	 * 影藏所有缓冲图层
	 */
	hideAllBufferLayers: function() {
		for(var i = 0; i < LayerManagement.importPipeLines.length; i++) {
			var pID = LayerManagement.importPipeLines[i].guid;
			LayerManagement.hideBufferLayer(pID);
		}
	},
	/**
	 * 影藏指定缓冲图层
	 * @param {Object} layerId  图层id
	 */
	hideBufferLayer: function(layerId) {
		var isPipe = false;
		var importIndex = undefined;
		for(var i = 0; i < LayerManagement.importPipeLines.length; i++) {
			var pID = LayerManagement.importPipeLines[i].guid;
			if(pID === layerId) {
				isPipe = true;
				importIndex = i;
			}
		}
		if(isPipe) {
			var tempLayer = LayerManagement.earth.LayerManager.GetLayerByGUID(layerId);
			tempLayer.ShowPipeLineBuffer(false);
			if(importIndex != undefined) {
				LayerManagement.importPipeLines[importIndex].IsMOpen = false;
				LayerManagement.importPipeLines[importIndex].IsPOpen = false;
			}
		}

	},
	/**
	 * 清除气泡
	 */
	clearHtmlBalloons: function() {
		if(LayerManagement.htmlBalloon != null) {
			LayerManagement.htmlBalloon.DestroyObject();
			LayerManagement.htmlBalloon = null;
		}
	},
	/*
	 * 获取基本图层数据
	 * @param  {object} layer 图层
	 * @param  {Boolean} isThree 是否是弹出框调用
	 */
	getLayerTreeData: function(layer, isDialog) {
		if(!layer) {
			layer = top.LayerManagement.earth.LayerManager.LayerList;
		}
		var layerData = [];
		var childCount = layer.GetChildCount();
		for(var i = 0; i < childCount; i++) {
			var childLayer = layer.GetChildAt(i);
			var name = childLayer.Name;
			var id = childLayer.Guid;
			var data = {};
			var layerType = childLayer.LayerType;
			var demType = childLayer.DEMType;
			if(layerType == "Model" || layerType == "Block" || layerType == "ObliquePhoto") {
				LayerManagement.groupLayers.push({
					id: id,
					name: name
				})
			}
			if(layerType === "Project") {
				LayerManagement.demArr.push({
					id: id,
					name: name,
					dem: []
				});
				LayerManagement.gisArr.push({
					id: id,
					gis: []
				})
			}
			if(layerType.toLowerCase() == "map" || layerType.toLowerCase() == "wms") {
				LayerManagement.mapLayers.push(childLayer);
			}
			if(demType.toUpperCase() === "TIN" || demType.toUpperCase() === "GRID") {
				var demArrLen = LayerManagement.demArr.length;
				LayerManagement.demArr[demArrLen - 1].dem.push({
					"id": id,
					"name": name
				})
			}
			if(layerType.toUpperCase() == "GISPOI" || layerType.toUpperCase() == "GISVECTOR" || layerType.toUpperCase() == "POI") {
				var gisArrLen = LayerManagement.gisArr.length;
				LayerManagement.gisArr[gisArrLen - 1].gis.push({
					id: id,
					name: name
				})
			}
			if(layerType === "POI") {
				LayerManagement.POILAYERS.push({
					'id': id,
					'name': name,
					'server': childLayer.GISServer,
					'pltype': childLayer.PipeLineType
				});
			}
			if(name == "equipment") {
				name = "附属设施";
			} else if(name == "container") {
				name = "管线";
			} else if(name == "well") {
				name = "井";
			} else if(name == "joint") {
				name = "附属点";
			} else if(name == "plate") {
				name = "井盖";
			} else if(name == "buffer") {
				childLayer.visibility = false;
			} else if(name == "room") {
				name = "井室";
			} else if(name == "container_og") {
				name = "地上管线"
			} else if(name == "joint") {
				name = "特征";
			} else if(name == "joint_og") {
				name == "地上特征";
			}
			data.id = id;
			data.name = name;
			data.checked = childLayer.Visibility;
			data.type = layerType;
			var demType = childLayer.DEMType;
			if(demType.toUpperCase() === "TIN" || demType.toUpperCase() === "GRID") {
				layerType = "DEM"
			}
			layerType = layerType ? layerType : "DOM";
			if(layerType == "Model" && childLayer.DataType == "Water") {
				layerType = "Water";
			}
			if(layerType == "Model" && childLayer.DataType == "Building") {
				layerType = "Building";
			}
			if(layerType == "Model" && childLayer.DataType == "Ground") {
				layerType = "Ground";
			}
			if(childLayer.DataType == "CurrentRoad") {
				layerType = "Ground";
			}
			if(layerType == "GISVector" && childLayer.DataType == "CurrentLand") {
				layerType = "CurrentLand";
			}
			if(layerType == "GISVector" && childLayer.DataType == "Canton") {
				layerType = "Canton";
			}
			if(layerType == "GISVector" && childLayer.DataType == "CurrentGreenbelt") {
				layerType = "CurrentGreenbelt";
			}
			if(layerType == "GISVector" && childLayer.DataType == "RegulatoryFigure") {
				layerType = "RegulatoryFigure";
			}
			if(layerType == "GISVector" && childLayer.DataType == "CurrentBuilding") {
				layerType = "CurrentBuilding";
			}
			data.icon = LayerManagement.getLayerIcon(layerType, isDialog);
			var count = childLayer.GetChildCount();
			layerData.push(data);
			if(count > 0) {
				data.children = LayerManagement.getLayerTreeData(childLayer);
			}
		}
		return layerData;
	},
	//获取当前管线图层
	getPipeTreeData: function() {
		var earthObj = LayerManagement.earth;
		var rootLayer = LayerManagement.getRootLayer(earthObj);
		var zNodes = [];
		var childCount = rootLayer.GetChildCount();
		for(var i = 0; i < childCount; i++) {
			var childLayer = rootLayer.GetChildAt(i);
			if(SYSTEMPARAMS.project === childLayer.Guid) {
				var children = LayerManagement.getPipelineLayerData(childLayer);
				var data = {};
				data.id = childLayer.Guid;
				data.name = childLayer.Name;
				if(childLayer.Name === "buffer") {
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

	//获取LayerType为GISPOI的图层
	getGisTreeData: function() {
		var earthObj = LayerManagement.earth;
		var rootLayer = LayerManagement.getRootLayer(earthObj);
		var zNodes = [];
		for(var i = 0; i < rootLayer.GetChildCount(); i++) {
			var childLayer = rootLayer.GetChildAt(i);
			if(SYSTEMPARAMS.project === childLayer.Guid) {

				for(var j = 0; j < childLayer.GetChildCount(); j++) {
					var childsLayer = childLayer.GetChildAt(j);
					for(var n = 0; n < childsLayer.GetChildCount(); n++) {
						var LayerArr = childsLayer.GetChildAt(n);
						if(LayerArr.LayerType == "GISPOI" || LayerArr.LayerType == "GISVector" || LayerArr.LayerType == "POI") {
							zNodes.push(LayerArr);
						}
					}
				}

			}
		}
		return zNodes;
	},

	//初始化时保存所有模型图层
	GetModelLayers: function(layer) {
		var count = layer.GetChildCount();
		for(var i = 0; i < count; i++) {
			var childLayer = layer.GetChildAt(i);
			if(childLayer.GetChildCount() > 0) {
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
	 * 功能：获取管线图层数据
	 * 参数：layer-图层根节点
	 * 返回值：图层管线数据数组
	 */
	getPipelineLayerData: function(layer) {
		if(!layer) {
			layer = LayerManagement.earth.LayerManager.LayerList;
		}
		var layerData = [];
		var childCount = layer.GetChildCount();
		for(var i = 0; i < childCount; i++) {
			var childLayer = layer.GetChildAt(i);
			var id = childLayer.Guid;
			var name = childLayer.Name;
			if(name === "buffer") {
				childLayer.Visibility = false;
			}
			if(name === "model") { //根据当前项目的模型图层名称来判断模型图层
				LayerManagement.GetModelLayers(childLayer);
			}
			//如果是重点管线则添加到数组对象中 2014.1.6
			if(childLayer.KeyLine) {
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
			if(count > 0) {
				if(layerType === "Project" || layerType === "Folder" || layerType === "Pipeline") {
					var children = this.getPipelineLayerData(childLayer);
					if(children.length > 0) {
						var data = {};
						data.id = id;
						data.name = name;
						data.checked = visibility;
						data.icon = this.getLayerIcon(layerType);
						data.children = children;
						layerData.push(data);
						if(layerType == "Pipeline") {
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
				if((layerType === "Container") || (layerType === "Container_Og") || (layerType === "Equipment") || (layerType === "Joint") || (layerType === "Joint_Og") || (layerType === "Well") || (layerType === "Plate") || (layerType === "Buffer") || (layerType.toUpperCase() === "ROOM") || (layerType === "Model_container") || (layerType === "Model_camera") || (layerType === "Model_catchment") || (layerType === "Model_equipment") || (layerType === "Model_plate") || (layerType === "Model_sensor") || (layerType === "Model_upperplate")) {
					if(layerType === "Equipment") {
						name = "附属设施";
					} else if(layerType === "Container") {
						name = "管线";
					} else if(layerType === "Well") {
						name = "井";
					} else if(layerType === "Joint") {
						name = "特征";
					} else if(layerType === "Plate") {
						name = "井盖";
					} else if(name === "buffer") { //这里为啥图层的name为buffer呢
						childLayer.visibility = false;
					} else if(layerType.toUpperCase() == "ROOM") {
						name = "井室";
					} else if(layerType === "Container_Og") {
						name = "地上管线";
					} else if(layerType === "Joint_Og") {
						name = "地上特征";
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
	/*
	  功能：递归判断该图层下是否有管线图层，存在管线图层的工程才显示在系统设置的切换工程中
	  说明：add by zhangd 2015-03-27
	  **/
	hasPipelinelayer: function(layer) {
		var bHasPipeline = false;
		var layerCount = layer.GetChildCount();
		for(var s = 0; s < layerCount; s++) {
			var childLayer = layer.GetChildAt(s);
			var pipelayerType = childLayer.LayerType;
			if(pipelayerType === "Pipeline") {
				return true;
			} else if(pipelayerType === "Folder") {
				bHasPipeline = LayerManagement.hasPipelinelayer(childLayer);
				if(bHasPipeline) {
					return true;
				}
			}
		}
		return false;
	},
	//获取所有管线工程列表
	initProjectList: function() {
		var rootLayerList = LayerManagement.earth.LayerManager.LayerList;
		var projectCount = rootLayerList.GetChildCount();
		for(var i = 0; i < projectCount; i++) {
			var childLayer = rootLayerList.GetChildAt(i);
			var layerType = childLayer.LayerType;
			if(layerType === "Project") { //17
				var projectId = childLayer.Guid;
				var projectName = childLayer.Name;
				var pipeTag = false;
				pipeTag = LayerManagement.hasPipelinelayer(childLayer);
				if(pipeTag) {
					LayerManagement.PROJECTLIST.push({
						id: projectId,
						name: projectName
					});
				}
			}
		}
		return LayerManagement.PROJECTLIST;
	},
	/**
	 * 显示某图层
	 * @param  {string} guid 图层的guid
	 */
	showLayer: function(guid) {
		if(guid) {
			var layer = LayerManagement.earth.LayerManager.GetLayerByGUID(guid);
			if(layer) {
				layer.Visibility = true;
			}
		}
	},

	/**
	 * 隐藏某图层
	 * @param  {string} guid 图层的guid
	 */
	hideLayer: function(guid) {
		if(guid) {
			var layer = LayerManagement.earth.LayerManager.GetLayerByGUID(guid);
			if(layer) {
				layer.Visibility = false;
			}
		}
	},
	/**
	 * 功能：图层树节点 checkbox / radio 被勾选或取消勾选的事件
	 * 参数：event-标准的 js event 对象；
	 *       treeId-对应图层树的Id；
	 *       node-被勾选或取消的节点
	 * 返回值：无
	 */
	layerTreeCheck: function(earth, node) {
		if(node && node.id) {
			if(node.children && node.children.length > 0) {
				for(var i = 0; i < node.children.length; i++) {
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
		if(node && node.id) {
			var id = node.id;
			var layerObj = earth.LayerManager.GetLayerByGUID(id);
			if(layerObj.LayerType.toLowerCase() == "folder") {
				return;
			}
			var rect = layerObj.LonLatRect;
			LayerManagement.flyToLayer(earth, rect); //定位图层
		}
	},
	/**
	 * 功能：根据图层类型，获取图标样式
	 * 参数：layerType-图层类型
	 * 返回值：图标样式
	 */
	getLayerIcon: function(layerType, isDialog) {
		if(isDialog) {
			var icon = "../../images/layer/";
		} else {
			var icon = "images/layer/";
		}
		if(layerType === "DEM") {
			icon += 'DEM.png';
		} else if(layerType === "DOM") {
			icon += 'DOM.png';
		} else if(layerType === "POI" || layerType === "GISPOI") {
			icon += 'POI.png';
		} else if(layerType === "Map") {
			icon += 'Map.png';
		} else if(layerType === "Vector") {
			icon += 'layer_vector.gif';
		} else if(layerType === "Model") {
			icon += 'Model.png';
		} else if(layerType === "Water") { //水面模型
			icon += 'Water.png';
		} else if(layerType === "Building") { //建筑模型
			icon += 'Building.png';
		} else if(layerType === "Ground") { //建筑模型
			icon += 'Ground.png';
		} else if(layerType === "Block") {
			icon += 'Block.png';
		} else if(layerType === "MatchModel") {
			icon += 'MatchModel.png';
		} else if(layerType === "Billboard") {
			icon += 'Billboard.png';
		} else if(layerType === "Annotation") {
			icon += 'Annotation.png';
		} else if(layerType === "Equipment") {
			icon += 'Equipment.png';
		} else if(layerType === "Container") {
			icon += 'layer_container2.png';
		} else if(layerType === "Well") {
			icon += 'layer_well.png';
		} else if(layerType === "Joint") {
			icon += 'layer_joint2.png';
		} else if(layerType === "Plate") {
			icon += 'layer_plate.png';
		} else if(layerType === "Pipeline") {
			icon += 'layer_pipeline.png';
		} else if(layerType === "Room") {
			icon += 'Room.png';
		} else if(layerType === "Danger") {
			icon += 'Model.png';
		} else if(layerType === "Project") {
			icon += 'Project.png';
		} else if(layerType === "Powerline") {
			icon += 'Powerline.png';
		} else if(layerType === "CurrentLand") { //现状用地
			icon += 'CurrentLand.png';
		} else if(layerType === "CurrentRoad") { //道路
			icon += 'CurrentRoad.png';
		} else if(layerType === "CurrentGreenbelt") { //现状用地
			icon += 'CurrentGreenbelt.png';
		} else if(layerType === "Canton") { //区划
			icon += 'Canton.png';
		} else if(layerType === "RegulatoryFigure") { //控规
			icon += 'RegulatoryFigure.png';
		} else if(layerType === "CurrentBuilding") { //现状建筑
			icon += 'CurrentBuilding.png';
		} else if(layerType === "Line") {
			icon += 'layer_line.gif';
		} else if(layerType === "Tower") {
			icon += 'layer_tower.gif';
		} else if(layerType === 'Folder') {
			icon += 'folder.png';
		} else if(layerType === "Container_Og") {
			icon += 'Container_Og.png';
		} else if(layerType === "Joint_Og") {
			icon += 'Joint_Og.png';
		} else if(layerType === "GISVector") {
			icon += 'layer_road.png';
		} else if(layerType === "GISPolygon") {
			icon += 'layer_konggui.png';
		} else {
			//icon += 'layer_interest.png';
			icon += "default.png";
		}
		return icon;
	},
	ViewSystemSetting: function() { //系统设置
		var params = SYSTEMPARAMS;
		var preprojectId = SYSTEMPARAMS.project;
		params.projectList = LayerManagement.PROJECTLIST;
		params.earth = LayerManagement.earth;
		params.profileAlt = SYSTEMPARAMS.profileAlt;
		params.Alt = "";
		var url = "html/view/systemSettingDialog.html";
		var value = openDialog(url, params, 304, 189);
		if(value == null) {
			return;
		}
		if(value.project == preprojectId) {
			SYSTEMPARAMS.Position = value.Position;
			SYSTEMPARAMS.profileAlt = value.profileAlt;
			SYSTEMPARAMS.balloonAlpha = value.balloonAlpha;
			SystemSetting.setSystemConfig(value);
			return;
		}
		closeDialog();
		SystemSetting.setSystemConfig(value);

		//重新初始化

		LayerManagement.PIPELINELAYERS = []; //记录所有管线图层
		LayerManagement.POILAYERS = []; //记录所有管线图层
		LayerManagement.PROJECTLIST = []; //工程列表
		LayerManagement.importPipeLines = [];

		SYSTEMPARAMS.project = value.project;
		SYSTEMPARAMS.Position = value.Position;
		SYSTEMPARAMS.profileAlt = value.profileAlt;

		init();
	},
	/**
	 * 显示历史拉杆条
	 * @param {Object} isShow  是否显示
	 * @param {Object} destroy  清除
	 * @param {Object} exceptFirst  开始位置
	 */
	showHistorySlider: function(isShow, destroy, exceptFirst) {
		var i = exceptFirst ? 1 : 0;
		if(isShow) {
			if(LayerManagement.earthArray && LayerManagement.earthArray.length > 0) {
				for(; i < LayerManagement.earthArray.length; i++) {
					seHistorySliderMgr.showSlider({
						earth: LayerManagement.earthArray[i],
						title: '历史',
						visible: true
					});
				}
			}
			LayerManagement.earthArray[0].Event.OnGUISliderChanged = function(id) {
				// if(!top.bSync) {
					// return;
				// } else {
					// var thisId = LayerManagement.earthArray[0].id;
					// var thisSliderText = top.seHistorySliderMgr.data[thisId]['slider'].CurrentHistoryDateTimeTxt;
					// top.LayerManagement.setOtherSliderChaged(thisId, thisSliderText);
				// }
			}
		} else {
			if(LayerManagement.earthArray && LayerManagement.earthArray.length > 0) {
				for(; i < LayerManagement.earthArray.length; i++) {
					seHistorySliderMgr.showSlider({
						earth: LayerManagement.earthArray[i],
						visible: false,
						destroy: destroy
					});
				}
			}
		}
	},
	setOtherSliderChaged: function(id, thisSliderText) {
		var isOpposite = false;
		for(var j in seHistorySliderMgr.data) {
			if(seHistorySliderMgr.data[j] && seHistorySliderMgr.data[j]['slider']) {
				if(j != id) {
					var thisJ = j;
					seHistorySliderMgr.data[thisJ]['slider'].LoadHistoryData();
					seHistorySliderMgr.data[thisJ]['slider'].CurrentHistoryDateTimeTxt = thisSliderText;
					seHistorySliderMgr.data[thisJ]['earth'].Event.OnGUISliderChanged = function() { //2屏的拉杆变化事件
						// if(top.bSync && !isOpposite) {
							// isOpposite = true;
						// } else if(top.bSync) {
							// var thisId = thisJ;
							// var thisText = seHistorySliderMgr.data[thisJ]['slider'].CurrentHistoryDateTimeTxt;
							// LayerManagement.setOtherSliderChaged(thisId, thisText);
						// }
					};
					seHistorySliderMgr.data[thisJ]['earth'].Event.OnLBDown = function() {
						seHistorySliderMgr.data[thisJ]['earth'].Event.OnGUISliderChanged = function() {
							// var thisText = seHistorySliderMgr.data[thisJ]['slider'].CurrentHistoryDateTimeTxt;
							// var thisId = thisJ;
							// LayerManagement.setOtherSliderChaged(thisId, thisText);
						}
					}
				}
			}
		}
		//1697 右屏联动左屏
		setSync(top.bSync);
	}
};


/**
 * 根据标准名称返回显示字段名称
 * @param  {[string]}   standardName     标准字段名称
 * @param  {[int]}      pipeType         管线类型 1 -- 管线 0 -- 管点
 * @param  {[string]}   returnFiledName  true返回FiledName false返回CaptionName
 * @return {[string]}                    显示名称
 */
function getName(standardName, pipeType, returnFiledName) {
	if(standardName === "" || standardName === undefined) {
		return;
	}
	if(pipeType === "" || pipeType === undefined) {
		return;
	}
	var configXML = SYSTEMPARAMS.pipeFieldMap;
	if(configXML == undefined) {
		alert("未获取到字段映射信息");
		return;
	}
	var lineData;
	if(pipeType === 1 || pipeType === "1") {
		lineData = configXML.getElementsByTagName("LineFieldInfo")[0] ? configXML.getElementsByTagName("LineFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
	} else if(pipeType === 0 || pipeType === "0") {
		lineData = configXML.getElementsByTagName("PointFieldInfo")[0] ? configXML.getElementsByTagName("PointFieldInfo")[0].getElementsByTagName("SystemFieldList")[0] : null;
	}
	if(lineData && lineData.childNodes.length) {
		for(var i = lineData.childNodes.length - 1; i >= 0; i--) {
			var item = lineData.childNodes[i];
			if(item.getAttribute("StandardName").toUpperCase() == standardName.toUpperCase()) {
				if(returnFiledName) {
					return item.getAttribute("FieldName").toUpperCase();
				} else {
					return item.getAttribute("CaptionName");
				}
			}
		};
	}
};

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

/**
 *  根据value类型和value的自定义值，获取其显示值
 */
function getCaptionByCustomValue(layerCode, type, customValue) {
	if(type == undefined || type == "") {
		return customValue;
	}
	if(customValue == undefined || customValue == "") {
		return "";
	}
	var code = 0;
	var codeValue = null;

	var configXML = SYSTEMPARAMS.valueMap;
	var lineData = configXML.getElementsByTagName(type);
	if(lineData && lineData.length > 0) {
		for(var i = 0; i < lineData.length; i++) {
			var item = lineData[i];
			if(type == "MaterialType") {
				codeValue = item.getElementsByTagName("ClassID")[0].text;
			} else if(type == "WellTypeByAtt") {
				codeValue = item.getElementsByTagName("Group")[0].text;
			} else if(type != "Ownership" && item.getElementsByTagName("Code")[0]) {
				codeValue = item.getElementsByTagName("Code")[0].text;
			}

			var fieldValue = item.getElementsByTagName("Customer")[0].text;
			if(Number(fieldValue) > 0) {
				fieldValue = Number(fieldValue);
			}
			if(Number(customValue) > 0) {
				customValue = Number(customValue);
			}
			if(bFromCode(layerCode, codeValue, type) && fieldValue === customValue) {
				if(item.getElementsByTagName("Caption")[0]) {
					return item.getElementsByTagName("Caption")[0].text;
				} else if(item.getElementsByTagName("Standard")[0]) {
					return item.getElementsByTagName("Standard")[0].text;
				}
			}
		}
		return customValue;
	} else {
		return customValue;
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

/**
 * 类型编码转换
 * @param {Object} layerCode  图层编码
 * @param {Object} childCode  子节点
 * @param {Object} codeType  编码类型
 */
function bFromCode(layerCode, childCode, codeType) {
	if(layerCode == null || layerCode == "" || childCode == null || childCode == "") {
		return true;
	} else {
		if(codeType == "Attachment" || codeType == "MaterialType") {
			if(layerCode.toString().length == childCode.toString().length && layerCode.toString().substr(0, 1) == childCode.toString().substr(0, 1)) {
				return true;
			} else {
				return false;
			}
		} else if(codeType == "WellTypeByAtt") {
			if(layerCode == childCode) {
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
 * 功能：图层控制，形成基本图层树
 * 参数：data图层数据，earthObj为earth
 * 返回值：无
 */
function baseLayerTree(earthObj) {
	var setting = {
		check: {
			enable: true, //是否显示checkbox或radio
			chkStyle: "checkbox" //显示类型,可设置(checbox,radio)
		},
		view: {
			dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
			expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
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
				if(currLayer.LayerType != "Project" && currLayer.LayerType != "Folder" && currLayer.LayerType != "Pipeline") {
					LayerManagement.selectLayer = node.id;
				} else {
					LayerManagement.selectLayer = "";
				}
			},
			onDblClick: function(event, treeId, node) { //双击图层
				top.LayerManagement.layerTreeDbClick(earthObj, node);
			},
			onCheck: function(event, treeId, node) { //点击checkbox事件
				top.LayerManagement.layerTreeCheck(earthObj, node);
			}
		}
	};
	var rootLayer = LayerManagement.getRootLayer(earthObj);
	var zNodes = LayerManagement.getLayerTreeData(rootLayer);
	var tree = $.fn.zTree.init($("#layerTree"), setting, zNodes);
	return tree;
}