/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：双屏比对相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月7日
 ******************************************/
var locationHref = window.location.href;
var typeIndex = locationHref.indexOf("type=");
var type = locationHref.substr(typeIndex + 5, 1);
$(function() {
	var bMultiple = top.bMultiple; // 当前是否是多屏显示状态
	var earth = top.LayerManagement.earth; //接收全局earth
	var bSync = false; // 当前是否联动
	var selectSetFile = null; //设置存储值
	var selectTag = "";
	var obj = {
		selectSet: "",
		tag: false
	};
	$("#btnSetup").click(function() {
		obj.selectSet = selectSetFile;
		window.showModalDialog("../view/multipleScreenSetup.html", obj, "dialogWidth=256px;dialogHeight=105px;status=no");
		if(!obj.tag) {
			return;
		}
		selectTag = obj.selectSet;
		selectSetFile = obj.selectSet;
	});
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

			if(childLayer.LayerType.toLowerCase() == "map") {
				childLayer.Visibility = false;
			}
			var data = {
				"id": childLayer.Guid,
				"name": name,
				"checked": childLayer.Visibility
			};
			var layerType = childLayer.LayerType;
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
			if(bWithIcon) {
				data["icon"] = LayerManagement.getLayerIcon(layerType, true);
			}
			if(childLayer.GetChildCount() > 0) {
				data.children = getLayerData(childLayer, true);
			}
			if(name != "buffer" && name != "room") {
				layerData.push(data);
			}
		}
		return layerData;
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

	/**
	 * 定位到经纬度范围
	 */
	var flyToLayer = function(layer, earthObj) {
		var lonLatRect = layer.LonLatRect;
		var centerX = (lonLatRect.East + lonLatRect.West) / 2;
		var centerY = (lonLatRect.North + lonLatRect.South) / 2;
		var width = (parseFloat(lonLatRect.North) - parseFloat(lonLatRect.South)) / 2;
		var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
		earthObj.GlobeObserver.FlytoLookat(centerX, centerY, 0, 0, 90, 0, range, 4);
	};

	var earthTag = 0;
	/**
	 * 创建图层树
	 * @param treeId 图层树ul元素的ID，含#井号
	 * @param earth
	 */
	function createLayerTree(treeId, earthObj) {
		var zNodes = getLayerData(earthObj.LayerManager.LayerList, true);
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
				onDblClick: function(event, treeId, node) {
					if(node && node.id) {
						if(bSync) {
							top.setFocus(earthTag)();
						}
						var layer = earthObj.LayerManager.GetLayerByGUID(node.id);
						if(layer) {
							if(bSync) {
								top.setLock(4);
							}
							flyToLayer(layer, earthObj); //定位图层
						}
					}
				},
				onCheck: function(event, treeId, node) {
					var layer = earthObj.LayerManager.GetLayerByGUID(node.id);
					layer.Visibility = node.checked;
				}
			}
		};

		$.fn.zTree.init($(treeId), setting, zNodes);
	}
	createLayerTree("#layerTree", earth);
	var divHeight = $("#tablediv").height() - $(".cardTitle").height();
	$("#dgDiv").height(divHeight);
	$("#layerTree").height($("#dgDiv").height() - $("#dgDivHeader").height() - 20);
	$("#layerTree").mCustomScrollbar();

	$("#rdoLeft").click(function() {
		$("#rdoRight").removeAttr("checked");
		$("#rdoLeft").attr("checked", "checked");
		earthTag = 0;
		createLayerTree("#layerTree", top.LayerManagement.earthArray[0]);
	});
	$("#rdoRight").click(function() {
		$("#rdoLeft").removeAttr("checked");
		$("#rdoRight").attr("checked", "checked");
		earthTag = 1;
		createLayerTree("#layerTree", top.LayerManagement.earthArray[1]);
	});
	$("#btnCompare").click(function() {
		if(bSync || top.bSync) {
			bSync = false; //首先关闭联动
			top.bSync = bSync;
			top.setSync(bSync);
			setAlphaSync(false);
		}
		if(bMultiple) { //当前多屏时
			if(type == 2) {
				top.LayerManagement.showHistorySlider(false, true, true);
			}
			$(this).text("双屏显示");
			top.isShowHistory = false;
			top.setScreen(1, ""); // 恢复到一屏
			bMultiple = false;
			top.bMultiple = bMultiple;
			$("#btnSync").text("联动").attr("disabled", "disabled");
			$("#rdoRight").attr("disable", "disabled"); //btnSetup
			$("#btnSetup").removeAttr("disabled"); //
			$("#rdoRight").removeAttr("checked");
			$("#rdoLeft").attr("checked", "checked");
			$("#rdoRight").attr("disabled", "disabled");
			createLayerTree("#layerTree", top.LayerManagement.earthArray[0]); // 恢复为默认球的图层树
			if(type == 2) {
				if(!($(parent.document).find("#historyData").hasClass("selected"))) {
					top.LayerManagement.showHistorySlider(false);
				}
			}
		} else { //当前单屏时
			debugger
			top.isCloseSlider = true;
			$(this).text("单屏显示");
			bMultiple = true;
			top.bMultiple = bMultiple;

			$("#btnSync").text("联动").removeAttr("disabled");
			// $("#btnIndexCompare").removeAttr("disabled");
			top.setScreen(2, selectTag, false, function() {
				debugger
				if(type == 2) {
					top.isShowHistory = true;
					var flag = top.BalloonHtml.getItemStyle("ViewTranSetting");
					if(!flag) {
						top.BalloonHtml.removeItemStle("ViewTranSetting");
						top.setSlidersVisible(0);
						earth.Event.OnGUISliderChanged = function() {};
						setTimeout(function() {
							// var flag2 = top.Tools.toolBarItemClickStyle("historyData");
							top.LayerManagement.showHistorySlider(true);
						}, 300);
					} else {
						// var flag2 = top.Tools.toolBarItemClickStyle("historyData");
						top.LayerManagement.showHistorySlider(true);
					}
				}
				top.gotoPose(0)(); // 将其他屏定位到第一屏的位置
			});
			$("#rdoRight").removeAttr("disabled");
			$("#btnSetup").attr("disabled", "disabled");
		}
	});
	/**
	 * 联动按钮点击
	 */
	$("#btnSync").click(function() {
		bSync = !bSync;
		setAlphaSync(bSync);
		top.bSync = bSync;
		top.setSync(bSync);
		$(this).text(bSync ? "取消联动" : "联动");
	});
});

/**
 * 设置联动 透明联动
 * @param {Object} isMulti  是否联动
 */
function setAlphaSync(isMulti) {
	top.isMultiScreen_2 = isMulti;
	if(isMulti) {
		if(top.LayerManagement.earthArray[1]) {
			top.LayerManagement.earthArray[1].Environment.TerrainTransparency = top.LayerManagement.earthArray[0].Environment.TerrainTransparency;
		}
	}
}

window.onbeforeunload = function() {
	if(type == 2) {
		top.LayerManagement.showHistorySlider(false, true, true);
	}
	top.isShowHistory = false;
	top.setScreen(1, "");
	bSync = false;
	top.bSync = false;
	top.setSync(bSync);
	setAlphaSync(false);
	if(type == 2) {
		if(!($(parent.document).find("#historyData").hasClass("selected"))) {
			top.LayerManagement.showHistorySlider(false);
		}
	}
}