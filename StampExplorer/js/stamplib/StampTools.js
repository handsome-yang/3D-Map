/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：功能方法-封装成对象
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月7日
 ******************************************/

var Stamp = new Object(); //创建全局对象
var htmlBalloons = null; //气泡
var terrain_layer = null; //独立场景dem/dom
var edit_list = []; //独立场景editlayer
var isMultiScreen_2 = false; //是否有联动

//封装方法：功能方法
Stamp.Tools = {
	Earth: null,
	htmlBalloonMove: null,
	balloonsFunc: new ActiveXObject("Scripting.Dictionary"),
	//管线图层
	getPipeListByLayer: function(layer) {
		var pipelineArr = [];
		var count = layer.GetChildCount();
		for(var i = 0; i < count; i++) {
			var childLayer = layer.GetChildAt(i);
			var layerType = childLayer.LayerType;
			if(layerType === "Pipeline") {
				var pipelineId = childLayer.Guid;
				var pipelineName = childLayer.Name;
				var pipelineServer = childLayer.GISServer;
				pipelineArr.push({
					id: pipelineId,
					name: pipelineName,
					server: pipelineServer,
					LayerType: layerType
				});
			} else {
				var childCount = childLayer.GetChildCount();
				if(childCount > 0) {
					var childPipelineArr = this.getPipeListByLayer(childLayer);
					for(var k = 0; k < childPipelineArr.length; k++) {
						pipelineArr.push(childPipelineArr[k]);
					}
				}
			}
		}
		return pipelineArr;
	},
	OnHtmlBalloonFinishedFunc: function(curBid, callback) { //全局OnHtmlBalloonFinished事件
		Stamp.Tools.balloonsFunc.item(curBid) = callback;
		Stamp.Tools.Earth.event.OnHtmlBalloonFinished = function(closeBid) {
			if(Stamp.Tools.balloonsFunc.Exists(closeBid)) {
				Stamp.Tools.balloonsFunc.item(closeBid)(closeBid);
				Stamp.Tools.balloonsFunc.Remove(closeBid);
			}
		}
	},
	ViewTranSetting: function(id) { //地形透明
		var flag = BalloonHtml.itemClickStyle(id);//是否被选中
		if(flag) {
			setSlidersVisible(1);
			ViewTranSettingBtn = true;//无作用，只是用来表示旗袍的显隐
		} else {
			setSlidersVisible(0);
			ViewTranSettingBtn = false;
		}
	},
	ViewUndergroundMode: function(id) { //地下浏览
		var flag = BalloonHtml.itemClickStyle(id);
		if(flag) {
			ViewUndergroundModeBtn = true;
			LayerManagement.earth.GlobeObserver.UndergroundMode = true; // 地下浏览模式
		} else {
			ViewUndergroundModeBtn = false;
			LayerManagement.earth.GlobeObserver.UndergroundMode = false; // 取消地下浏览模式
			LayerManagement.earth.Event.OnObserverChanged = function() {};
		}
	},
	Hawkeye2D: function(id) { // 鹰眼图
		var flag = ThreeMenu.itemClickStyle(id);
		if(flag) {
			this.Earth.Environment.Thumbnail = true;
		} else {
			this.Earth.Environment.Thumbnail = false;
		}
	},
	refersToNorth: function() { // 指北
		Stamp.Tools.Earth.GlobeObserver.NorthView();
	},
	globalView: function() { //恢复全球
		Stamp.Tools.Earth.GlobeObserver.Resume();
	},
	ViewOpenCollision: function(id) { //开启碰撞
		var flag = BalloonHtml.itemClickStyle(id);
		if(flag) {
			this.Earth.GlobeObserver.IntersectModel = true;
			this.Earth.Environment.EnableWaterCollision = true;
		} else {
			this.Earth.GlobeObserver.IntersectModel = false;
			this.Earth.Environment.EnableWaterCollision = false;
		}
	},
	ViewTunnelMode: function(id) { //隧道模式
		var flag = BalloonHtml.itemClickStyle(id);
		if(flag) {
			this.Earth.GlobeObserver.TunnelMode = true;
		} else {
			this.Earth.GlobeObserver.TunnelMode = false;
		}
	},
	ViewCoordLocation: function() { //坐标定位
		var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/page"));
		var width = 292,
			height = 213;
		var url = loaclUrl + "/html/view/coordLocation.html";

		if(Stamp.Tools.htmlBalloonMove != null) {
			Stamp.Tools.htmlBalloonMove.DestroyObject();
			Stamp.Tools.htmlBalloonMove = null;
		}
		Stamp.Tools.htmlBalloonMove = Stamp.Tools.Earth.Factory.CreateHtmlBalloon(Stamp.Tools.Earth.Factory.CreateGuid(), "屏幕坐标窗体");
		Stamp.Tools.htmlBalloonMove.SetScreenLocation(width / 2 + 80, 0);
		Stamp.Tools.htmlBalloonMove.SetRectSize(width, height);
		Stamp.Tools.htmlBalloonMove.SetIsAddBackgroundImage(false);
		Stamp.Tools.htmlBalloonMove.ShowNavigate(url);
		Stamp.Tools.Earth.Event.OnDocumentReadyCompleted = function(guid) {
			Stamp.Tools.Earth.ifEarth = window.frames.ifEarth;
			Stamp.Tools.Earth.htmlBallon = Stamp.Tools.htmlBalloonMove;
			if(Stamp.Tools.htmlBalloonMove === null) {
				return;
			}
			if(Stamp.Tools.htmlBalloonMove.Guid == guid) {
				Stamp.Tools.htmlBalloonMove.InvokeScript("getEarth", Stamp.Tools.Earth);
			}
		};
		Stamp.Tools.OnHtmlBalloonFinishedFunc(Stamp.Tools.htmlBalloonMove.Guid, function(id) {
			if(Stamp.Tools.htmlBalloonMove != null && id === Stamp.Tools.htmlBalloonMove.Guid) {
				Stamp.Tools.htmlBalloonMove.DestroyObject();
				Stamp.Tools.htmlBalloonMove = null;
			}
		});
	},
	showMoveHtmlBalloons: function(url, w, h) { //显示气泡
		if(url === "") {
			return;
		}
		var width = w ? w : 280;
		var height = h ? h : 220;
		var earth = Stamp.Tools.Earth;
		earth.Event.OnHtmlNavigateCompleted = function() {};
		htmlMoveBalloons = Stamp.Tools.htmlMoveBalloons;

		htmlMoveBalloons = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), "屏幕坐标窗体");
		htmlMoveBalloons.SetScreenLocation(width / 2 + 86, 0);
		htmlMoveBalloons.SetRectSize(width, height);
		htmlMoveBalloons.SetIsAddBackgroundImage(false);
		htmlMoveBalloons.ShowNavigate(url);
		earth.Event.OnDocumentReadyCompleted = function(guid) {
			if(htmlMoveBalloons === null) {
				return;
			}
			earth.htmlBallon = htmlMoveBalloons;
			earth.params = params;
			earth.CoordinateTransform = CoordinateTransform;
			earth.SYSTEMPARAMS = SYSTEMPARAMS;
			earth.dataProcess = top.getDataProcessIndex();

			if(htmlMoveBalloons.Guid == guid) {
				htmlMoveBalloons.InvokeScript("getEarth", earth);
			}
		};

		Stamp.Tools.OnHtmlBalloonFinishedFunc(htmlMoveBalloons.Guid, function(id) {
			if(htmlMoveBalloons != null && id === htmlMoveBalloons.Guid) {
				htmlMoveBalloons.DestroyObject();
				htmlMoveBalloons = null;
			}
		});
	},
	//独立场景【进入和退出】
	IndependentScene: function(id, flag) {
		if(!earth.Environment.EnableObserver && !flag) {
			independentsceneBtn = false;

			for(var i = 0; i < edit_list.length; i++) {
				var edit_layer = edit_list[i];
				edit_layer.BeginUpdate();
				edit_layer.EnableObserver = true;
				for(var j = 0; j < edit_layer.GetObjCount(); j++) {
					var thisEditObject = edit_layer.GetObjAt(j);
					edit_layer.DetachWithDeleteObject(thisEditObject);
				}
				edit_layer.EndUpdate();
				earth.DetachObject(edit_layer);
			}
			edit_list = [];

			terrain_layer.BeginUpdate();
			terrain_layer.EnableObserver = true;
			for(var i = 0; i < terrain_layer.GetObjCount(); i++) {
				terrain_layer.DetachWithDeleteObject(terrain_layer.GetObjAt(i));
			}
			terrain_layer.EndUpdate();
			earth.DetachObject(terrain_layer);
			terrain_layer = null;
			earth.Environment.EnableObserver = true;
		} else {
			independentsceneBtn = true;
			earth.Event.OnCreateGeometry = function(pval, type) {
				earth.Event.OnSelectChanged = function() {};
				earth.ShapeCreator.Clear();
				if(pval.Count < 3) {
					independentsceneBtn = false;
					Tools.toolBarItemClickStyle(id);
					alert("应至少取三个点!");
					return;
				}
				on_create_other_window(pval, type);
			}; // 构建要显示的范围多边形
			earth.ShapeCreator.CreatePolygon();
		}
	}
}

/*
 * 控制是否显示Slider
 */
function setSlidersVisible(flag) {
	earth.Event.OnGUISliderChanged = function() {};
	var st = [{
		id: 'ViewTranSetting',
		type: 'transparency'
	}, {
		id: 'EffectRain',
		type: 'rain'
	}, {
		id: 'EffectSnow',
		type: 'snow'
	}, {
		id: 'EffectFog',
		type: 'fog'
	}, {
		id: 'layerTrans',
		type: 'layerTrans'
	}];

	sliderMgr.init(Stamp.Tools.Earth, false, function(type) {
		for(var i in st) {
			if(st[i].type == type) {
				top.Tools.groupItemCancel(st[i].id);
				if(type == "transparency" ) {
					top.ViewTranSettingBtn = false;
					BalloonHtml.removeItemStle(st[i].id);
				}else if(type == "layerTrans"){
					BalloonHtml.removeItemStle(st[i].id);
				} else {
					try {
						var thisObject = window.frames["operator"].$("#" + st[i].id);
						if(thisObject.length < 1) {
							return;
						} else {
							ThreeMenu.removeClickStyle(st[i].id);
						}
					} catch(e) {

					}

				}
			}
		}
	});

	for(var i = 0; i < st.length; i++) {
		sliderMgr.setVisible(st[i].type, flag & Math.pow(2, i));
	}
};

//地形夸张滚动条生成方法
function showDemExaggerSlider(isShow, destroy, exceptFirst) {
	var i = exceptFirst ? 1 : 0;
	if(isShow) {
		if(LayerManagement.earthArray && LayerManagement.earthArray.length > 0) {
			for(; i < LayerManagement.earthArray.length; i++) {
				SetDemcrazySliderMgr.showSliderDom({
					earth: LayerManagement.earthArray[i],
					title: '夸张系数',
					visible: true
				});
			}
		}
	} else {
		if(LayerManagement.earthArray && LayerManagement.earthArray.length > 0) {
			for(; i < LayerManagement.earthArray.length; i++) {
				SetDemcrazySliderMgr.showSliderDom({
					earth: LayerManagement.earthArray[i],
					visible: false,
					destroy: destroy
				});
			}
		}
	}
}

//功能：判断用户对象是否在线框内-目前是判断的中心点
//参数：obj用户自定义对象，polygon线框点集合
//返回：是否在线框内
function isInPolygon(obj, polygon) {
	var point = earth.Factory.CreateGeoPoint();
	point.Longitude = obj.SphericalTransform.Longitude;
	point.Latitude = obj.SphericalTransform.Latitude;
	point.Altitude = obj.SphericalTransform.Altitude;
	var bInRect = earth.GeometryAlgorithm.CalculatePointPolygonDistance(polygon, point);
	if(bInRect && bInRect.Count >= 2) {
		bInRect = false;
	} else {
		bInRect = true;
	}
	return bInRect;
}

//功能：生成小场景窗体
//参数：pval多边形范围，type类型
//返回：无
function on_create_other_window(pval, type) {
	// 统计显示范围
	var west = 180;
	var east = -180;
	var north = -90;
	var south = 90;
	var maxHeight = -100000;
	for(var i = 0; i < pval.Count; ++i) {
		var point = pval.Items(i);
		if(point.x > east) east = point.x;
		if(point.x < west) west = point.x;
		if(point.y > north) north = point.y;
		if(point.y < south) south = point.y;
		if(point.z > maxHeight) maxHeight = point.z;
	}

	// 生成地形模型，按指定名称将多边形内的地形导出成一个模型，然后加载
	var file_name = earth.RootPath + "\\terrain\\terrain.m";
	var vec = earth.TerrainManager.GetTerrainModelByPolygon(file_name, pval);
	terrain_layer = earth.Factory.CreateEditLayer(earth.Factory.CreateGUID(), "", earth.Factory.CreateLonLatRect(north, south, east, west, 0, 4.5), -10, 10, "");
	terrain_layer.DataLayerType = 3;
	terrain_layer.Underground = true;
	earth.AttachObject(terrain_layer);
	terrain_layer.BeginUpdate();
	var terrain_model = earth.Factory.CreateEditModelByLocal(earth.Factory.CreateGUID(), "", file_name, 11);
	terrain_model.BeginUpdate();
	terrain_model.SphericalTransform.SetLocationEx(vec.Longitude, vec.Latitude, vec.Altitude);
	terrain_model.EndUpdate();
	terrain_layer.AttachObject(terrain_model);
	terrain_layer.EnableObserver = false;
	terrain_layer.EndUpdate();
	//因为用户数据添加会引起崩溃，所以基线版本去掉了用户数据的添加，如有需要查看之前的版本

	// 根据浏览数据的图层GUID获取对应的数据库数据
	var database_link = params.ip;
	var guids = earth.LayerManager.GetLayersByRegion(pval); // 获取在多边形范围内浏览数据图层GUID，此接口未判断当前图层是否可见
	var guid_list = guids.split(",");
	var num = 0;
	var edit_layer_guid = earth.Factory.CreateGuid();
	earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) { // 逐图层获取数据库数据，加载到earth上
		if(pFeature && pFeature.Count > 0) {
			var edit_layer = earth.Factory.CreateEditLayer(pRes.LayerGuid, "", earth.Factory.CreateLonLatRect(north, south, east, west, 0, 4.5), 0, 10, database_link);
			edit_layer.DataLayerType = 3;
			earth.AttachObject(edit_layer);
			edit_layer.BeginUpdate();
			for(var i = 0; i < pFeature.Count; ++i) {
				var obj_info = pFeature.Items(i);
				if(!isInPolygon(obj_info, pval)) { //判断模型中心点位置是否在范围内
					continue;
				}
				var element_model = earth.Factory.CreateEditModelByDatabase(obj_info.Guid, obj_info.Name, obj_info.MeshID, 3);
				element_model.BeginUpdate();
				element_model.SetBBox(obj_info.BBox.MinVec, obj_info.BBox.MaxVec);
				element_model.SphericalTransform.SetLocation(obj_info.SphericalTransform.GetLocation());
				element_model.SphericalTransform.SetRotation(obj_info.SphericalTransform.GetRotation());
				element_model.SphericalTransform.SetScale(obj_info.SphericalTransform.GetScale());
				element_model.EndUpdate();
				edit_layer.AttachObject(element_model);
			}
			edit_layer.EnableObserver = false;
			edit_layer.EndUpdate();
			edit_list.push(edit_layer);
		}

		num++;
		if(num == guid_list.length) { // 当全部图层加载完全后处理
			earth.Environment.EnableObserver = false; // 这一属性设置后，摄像机只有滚轮有效，可以控制缩放。如果要实现对模型的平移和旋转，可调用编辑工具的Move、Rotate。Scale没有被屏蔽，不过我感觉没什么意义使用
		}
	};
	for(var i = 0; i < guid_list.length; ++i) { // 申请各图层在多边形范围内的数据
		earth.DatabaseManager.GetDataBaseRecordByRegion(database_link, guid_list[i], pval);
	}
	if(guid_list.length == 0) {
		earth.Environment.EnableObserver = false;
	}
}