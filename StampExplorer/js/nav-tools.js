/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述：菜单响应方法,,菜单功能导航转发
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月8日
 ******************************************/

var g_BFirstInit = true; //第一次加载视点管理
var bLayerShow = true; //图层是否显示

/*---------------------------------------工具栏START---------------------------------*/
//图层管理
function LayerManagerClicked(id) {
	var flag = BalloonHtml.itemClickStyle(id);
	setLayerShow(flag);
	bLayerVisible = flag;
}

// 地下浏览
function ViewUndergroundModeClicked(id) {
	Stamp.Tools.ViewUndergroundMode(id);
}

// 地形透明
function ViewTranSettingClicked(id) {
	if($("#historyData").hasClass("selected") || isShowHistory) {
		alert("请先关闭历史比对或者历史变迁再使用此功能"); //防止开启之后onguisliderchanged事件混乱
		return;
	}
	Stamp.Tools.ViewTranSetting(id);
}
//模型透明
function layerTransClicked(id) {
	var flag = Tools.toolBarItemClickStyle(id);
	if(flag) { //显示
		setSlidersVisible(16);
	} else { //关闭
		setSlidersVisible(0);
	}
}
//全球
function globeViewClicked() {
	Stamp.Tools.globalView();
}

//指北
function ViewRefersToNorthClicked() {
	Stamp.Tools.refersToNorth();
}

//环绕
function surroundClicked(id) {
	earth.GlobeObserver.SurroundControlEx(1);
}

//场景俯视
function topViewClicked() {
	earth.GlobeObserver.TopView();
}

//碰撞检测
function ViewOpenCollisionClicked(id) {
	Stamp.Tools.ViewOpenCollision(id);
}

//水面碰撞
function UnderWaterCollisionClicked(id) {
	Stamp.Tools.UnderWaterCollision(id);
}

//隧道模式
function ViewTunnelModeClicked(id) {
	Stamp.Tools.ViewTunnelMode(id);
}

//属性
function QueryPropertyClicked() {
	QueryPropertyBtn = true;
	LayerManagement.earth.focus();
	GeneralQuery.propertyQuery();
}

/*-------------------------------------工具栏END-------------------------------------------------*/

/*-------------------------------------场景START-------------------------------------------------*/
//视点
function ViewPointManagementClicked(id) { //视点管理
	var flag = Tools.toolBarItemClickStyle(id);
	if(flag) {
		hideProfile();
		ViewPointManagementBtn = true;
		if(g_BFirstInit) {
			getViewObject().getStarted(seearth);
			g_BFirstInit = false;
		}
		setTableView(true, 135);
	} else {
		ViewPointManagementBtn = false;
		setTableView(false, 135);
		resizeEarthTool();
	}
}
//路径
function ViewFlyModeClicked(id) {
	showDialog('html/view/track.html', id);
}

//漫游
function ViewPersonModeClicked(id) {
	showDialog('html/view/dynamicObj.html', id);
}
//动画
function animationClicked(id) {
	showDialog('html/view/animation.html', id);
}
//截屏
function mScreenShotClicked(id) {
	pictureHtml(id);
}
//出图
function picturesClicked(id) {
	pictureHtml(id);
}
//双屏对比
function mMultipleScreenClicked(id) {
	showDialog('html/view/multipleScreen.html?type=1', id);
}

top.bMultiple = false; // 当前是否是多屏显示状态
//历史变迁
function historyDataClicked(id) {
	if(top.bMultiple) {
		alert("该功能不能在多屏状态下使用，请先关闭‘双屏显示’！");
		return;
	}
	top.isCloseSlider = true;
	var flag1 = BalloonHtml.getItemStyle("ViewTranSetting");
	if(!flag1) {
		top.BalloonHtml.removeItemStle("ViewTranSetting");
		top.setSlidersVisible(0);
		earth.Event.OnGUISliderChanged = function() {};
	}
	var flag = Tools.toolBarItemClickStyle(id);
	if(flag) {
		LayerManagement.showHistorySlider(true);
	} else {
		LayerManagement.showHistorySlider(false);
		earth.Event.OnGUISliderChanged = function() {};
	}

}

//历史查看
function historyNoSliderClicked(id) {
	var flag = Tools.toolBarItemClickStyle(id);
	if(flag) {
		showMoveHtmlBalloon(id);
	}
}
//历史比对
function historyCompareClicked(id) {
	top.bMultiple = false; // 当前是否是多屏显示状态
	if($("#historyData").hasClass("selected")) {
		LayerManagement.showHistorySlider(false);
		Tools.singleStyleCancel("historyData");
	}
	showDialog('html/view/multipleScreen.html?type=2', id);
}

//街景浏览
function vistaSetClicked(id) {
	showDialog('html/view/vistaBrowse.html', id);
}

//独立场景
function independentsceneClicked(id) {
	var flag = Tools.toolBarItemClickStyle(id);
	Stamp.Tools.IndependentScene(id, flag);
}

//特效
function SpecialEffectClicked(id) {
	showDialog("html/menu/three_menu_item.html?menuType=1", id, function() {
		if(earthToolsDiv.find("#ViewTranSetting").attr("isChecked")) {
			return;
		} else {
			setSlidersVisible(0);
		}
	});
}
//风场
function windScenetClicked(id) {
	showDialog("html/view/windscenet.html", id);
}
//监控
function mCameraClicked(id) {
	showDialog('html/view/camera.html', id);
}
//GB28181
function GB28181Clicked(id) {
	showDialog('html/view/GB28181.html', id);
}
//GPS
function GPSClicked(id) {
	showDialog("html/view/GPS.html", id);
}
//GPS监控
function GPSTrackClicked(id) {
	showDialog("html/view/GPSTrack.html", id);
}
//电子地图
function Map2DClicked(id) {
	showDialog("html/menu/three_menu_item.html?menuType=1", id, function() {
		Map2DClosed();
	});
}
//系统设置
function systemSettingClicked(id) {
	var params = SYSTEMPARAMS;
	if(params) {
		params.projectList = LayerManagement.PROJECTLIST;
		params.earth = earth;
		params.currentPrjGuid = params.project;
		params.balloonAlpha = params.balloonAlpha;
		var url = "html/view/systemSettingDialog.html";
		var value = openDialog(url, params, 304, 189);
		if(value == null) {
			return;
		}
		if(value.project == params.currentPrjGuid) {
			SystemSetting.setSystemConfig(value);
			SYSTEMPARAMS.balloonAlpha = value.balloonAlpha;
			return;
		}
		var params = SystemSetting.setSystemConfig(value);
		//重新初始化
		LayerManagement.PROJECTLIST = []; //工程列表
		SYSTEMPARAMS.balloonAlpha = value.balloonAlpha;
		SystemSetting.setSystemConfig(value);
		SYSTEMPARAMS.project = value.project;
		SYSTEMPARAMS.Position = value.Position;
		SYSTEMPARAMS.profileAlt = value.profileAlt;
		init();
	}
}

//实时配置
function systemSettingNowClicked(id) {
	var params = SYSTEMPARAMS;
	params.earth = LayerManagement.earth;
	showDialog("html/view/systemSettingNow.html", id);
}

//二维联动
function ViewLinkClicked(id) {
	ThreeMenu.removeClickStyle("ViewFullScreen2D");
	ThreeMenu.removeClickStyle("ViewScreen2D");
	var flag = ThreeMenu.itemClickStyle(id);
	if(flag) {
		setScreen(2, 0, true);
	} else {
		setScreen(1, 0, false);
	}
}

// 二维鹰眼
function ViewHawkEyeClicked() {
	var flag = Tools.toolBarItemClickStyle("ViewHawkEye");
	var earth = SystemSetting.earth;
	if(flag) {
		earth.Environment.Thumbnail = true;
		ViewHawkEyeBtn = true;
	} else {
		earth.Environment.Thumbnail = false;
		ViewHawkEyeBtn = false;
	}
}

//二维全屏
function ViewFullScreen2DClicked(id) {
	var flag = ThreeMenu.itemClickStyle(id);
	ThreeMenu.removeClickStyle("ViewLink");
	ThreeMenu.removeClickStyle("ViewScreen2D");
	setScreen(1, "", false);
	setSync(false);
	if(flag) { //取消全屏
		LayerManagement.earth.Environment.Mode2DEnable = true;
		isShowMap(true, LayerManagement.earth);
	} else { //全屏
		LayerManagement.earth.Environment.Mode2DEnable = false;
		isShowMap(false, LayerManagement.earth);
	}
}
//二维叠加
function ViewScreen2DClicked(id) {
	earth.Environment.Mode2DEnable = false;
	ThreeMenu.removeClickStyle("ViewLink");
	ThreeMenu.removeClickStyle("ViewFullScreen2D");
	var flag = ThreeMenu.itemClickStyle(id);
	if(flag) {
		setScreen(1, "", false);
		setSync(false);
		isShowMap(true, earth);
	} else {
		isShowMap(false, earth);
	}
}

function ViewSystemSettingClicked() { //系统设置
	LayerManagement.ViewSystemSetting();
}

function Map2DClosed() { //关闭二维显示，关闭二维联动
	earth.Environment.Mode2DEnable = false;
	isShowMap(false, earth);
	setScreen(1, "", false);
	setSync(false);
	earth.Environment.Thumbnail = false;
}

/*-------------------------------------场景END-------------------------------------------------*/

/*-------------------------------------量算START-------------------------------------------------*/

//水平距离
function mHorizontalDistClicked(id) {
	analysis.measure(id, "水平距离");
}

//垂直距离
function mHeightClicked(id) {
	analysis.measure(id, "垂直距离");
}

//空间距离
function mLineLengthClicked(id) {
	analysis.measure(id, "空间距离");
}

//地表距离
function mPathLengthClicked(id) {
	analysis.measure(id, "地表距离");
}

//点-折线距离
function pointTolineClicked(id) {
	analysis.pointClear();
	analysis.pointToline();
}

//点-直线距离
function pointToZlineClicked(id) {
	analysis.pointClear();
	analysis.pointToZline();
}

//线线距离
function lineTolineClicked(id) {
	analysis.lineToline();
}

//面面距离
function SurfacesToSurfacesClicked(id) {
	analysis.SurfacesToSurfaces();
}

//点面距离
function PointToSurfacesClicked(id) {
	analysis.pointClear();
	analysis.pointToSurfaces();
}

//线面距离
function LineToSurfacesClicked(id) {
	analysis.lineToSurfaces();
}

//水平面积
function mAreaClicked(id) {
	analysis.measure(id, "水平面积");
}

//地表面积
function mSurfaceAreaClicked(id) {
	analysis.measureSurfaceArea();
}

//空间面积
function mSpatialAreaClicked(id) {
	analysis.measure(id, "空间面积");
}

//立面面积
function mVerticalAreaClicked(id) {
	analysis.measure(id, "立面面积");
}

//平面角度
function mPlaneAngleClicked(id) {
	analysis.measure(id, "平面角度");
}

//楼间距
function FloorToFloorClicked(id) {
	analysis.buidTobuid();
}
/*-------------------------------------量算END-------------------------------------------------*/

/*-------------------------------------分析START-------------------------------------------------*/

//通视分析
function mLineSightClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//视域分析
function mViewshedClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//阴影分析
function mShinningClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//天际线分析
function mSkylineClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//视野分析
function mFixedObserverClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//挖填方分析
function mExcavationAndFillClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//点源淹没
function submergeClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//流域分析
function valleyClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//地形路径
function bestPathClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);

}
//地形剖面
function profileClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);

}
//坡度分析
function slopePointClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);

}
//坡度图
function slopePolygonClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);

}
//动态视域
function dViewshedClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//日照分析
function mInsolationClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}

//剖面分析
function clipSceneClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.clipScene(true, 31);
}
//等高线
function contourPolygonClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//热力图
function heatMapPolygonClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//地下水
function undergroundWaterClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//地形夸张
function demExaggerClicked(id) {
	var flag = Tools.toolBarItemClickStyle(id);
	showDemExaggerSlider(flag);
}
//滑坡分析
function landSlideAnalysisClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}

function sectionMonitorClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//单点监测
function pointMonitorClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}
//区域监测
function areaMonitorClicked(id) {
	var analysis = STAMP.Analysis(earth);
	analysis.showMoveHtml(id);
}

/*-------------------------------------分析END-------------------------------------------------*/

/*-------------------------------------查询START-------------------------------------------------*/
//关键字查询
function keywordSearchClicked(id) {
	var selectLayer = top.LayerManagement.selectLayer;
	if(!selectLayer) {
		alert("请选择一个图层");
		return;
	} else {
		showDialog("html/search/keywordSerResult.html", id);
	}
}

//兴趣点查询
function poiSearchClicked(id) {
	STAMP.Search(earth).poiSearchBtnClick(id);
}

//面域查询
function polygonSearchClicked(id) {
	var selectLayer = top.LayerManagement.selectLayer;
	if(!selectLayer) {
		alert("请选择一个图层");
		return;
	} else {
		showDialog("html/search/searchResult.html?id=polygon", id);
	}

}

//圆域查询
function circleSearchClicked(id) {
	var selectLayer = top.LayerManagement.selectLayer;
	if(!selectLayer) {
		alert("请选择一个图层");
		return;
	} else {
		showDialog("html/search/searchResult.html?id=circle", id);
	}

}

//矩形搜索
function rectangleSearchClicked(id) {
	var selectLayer = top.LayerManagement.selectLayer;
	if(!selectLayer) {
		alert("请选择一个图层");
		return;
	} else {
		showDialog("html/search/searchResult.html?id=rectangle", id);
	}

}

//坐标查询
function coordSearchClicked(id) {
	STAMP.Search(earth).coordSearchBtnClicked();
}

//坐标定位
function coordlocationClicked() {
	STAMP.Search(earth).coordlocationBtnClicked();
}

/*-------------------------------------查询END-------------------------------------------------*/

/*-------------------------------------标绘START-------------------------------------------------*/

/*-------
二维对象绘制START------*/
//二级菜单
function object2DDrawClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=1", id);
}

//地标
function iconClicked(id) {
	userdata.createPrimitives(id);
}

//折线
function createlineClicked(id) {
	userdata.createPrimitives(id);
}

//曲线
function createcurveClicked(id) {
	userdata.createPrimitives(id);
}

//多边形
function createpolygonClicked(id) {
	userdata.createPrimitives(id);
}

//纹理多边形
function createTexturePolygonClicked(id) {
	userdata.createPrimitives(id);
}

//矩形贴图
function createrectangleClicked(id) {
	userdata.createPrimitives(id);
}

//圆
function createcircleClicked(id) {
	userdata.createPrimitives(id);
}

//椭圆
function createellipseClicked(id) {
	userdata.createPrimitives(id);
}

//扇形
function createsectorClicked(id) {
	userdata.createPrimitives(id);
}

/*-------二维对象绘制END-------*/

/*-------二维对象处理START-------*/
//二维对象处理
function object2DManagerClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=1", id);
}
//线缓冲
function lineBufferClicked(id) {
	userdata.createPrimitives(id);
}
//平行线
function parallelLinesClicked(id) {
	userdata.createPrimitives(id);
}

//平行面
function parallelSurfaceClicked(id) {
	userdata.createPrimitives(id);
}

//面面求并
function surfaceTosurface_1Clicked(id) {
	userdata.createPrimitives(id);
}

//面面想减
function surfaceTosurface_2Clicked(id) {
	userdata.createPrimitives(id);
}

//面面求交
function surfaceTosurface_0Clicked(id) {
	userdata.createPrimitives(id);
}

/*-------二维对象处理END-------*/

/*-------二维导入导出START-------*/
//二维导入导出
function importExport2DClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=1", id);
}

//导入矢量
function importVectorClicked(id) {
	analysis.showMoveHtml(id);
}

//导出shp
function exportSHPClicked(id) {
	analysis.showMoveHtml(id);
}

/*-------二维导入导出END-------*/

/*-------应急标绘START-------*/
//应急标绘
function emergencyPlotClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=2", id);
}

//简单箭头
function sArrowClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotSArrow();
}

//自定义箭头
function customArrowClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotCustomArrow();

}

//燕尾箭头
function tailSArrowClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotTailSArrow();
}

//自定义燕尾箭头
function customTailArrowClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotCustomTailArrow();
}

//直箭头
function equalSArrowClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotEqualSArrow();
}

//双箭头
function doubleArrowClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotDoubleArrow();
}

//多箭头
function xArrowClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotXArrow();
}

//集结地域
function assemblyAreaClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotAssemblyArea();
}

//曲线旗标
function curveFlagClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotCurveFlag();
}

//直角旗标
function rightAngleFlagClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotRectFlag();
}

//三角旗标
function triangleFlagClicked(id) {
	userdata.createMilitaryTag(id);
	earth.ShapeCreator.CreatePlotTriangleFlag();
}

//雷达基站
function signalSphereClicked(id) {
	userdata.createSignalSphere(id);
	earth.ShapeCreator.CreatePoint();
}
/*-------应急标绘END-------*/

/*------------几何对象绘制 start-----------*/
function object3DDrawClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=3", id);
}
//球体
function sphereClicked(id) {
	userdata.createPrimitives("create" + id);
}
//立方体
function boxClicked(id) {
	userdata.createPrimitives("create" + id);
}
//立体多边形
function volumeClicked(id) {
	userdata.createPrimitives("create" + id);
}
//圆柱
function cylinderClicked(id) {
	userdata.createPrimitives("create" + id);
}
//圆锥
function coneClicked(id) {
	userdata.createPrimitives("create" + id);
}
//棱柱
function prismClicked(id) {
	userdata.createPrimitives("create" + id);
}
//棱锥
function pyramidClicked(id) {
	userdata.createPrimitives("create" + id);
}
//简单建筑
function simplebuildingClicked(id) {
	userdata.importModelData(id);
}
//路线
function flowRouteClicked(id) {
	userdata.createPrimitives("create" + id);
}
//警戒线
function cordonClicked(id) {
	userdata.createPrimitives("create" + id);
}
/*------------几何对象绘制 end-----------*/

/*------------三维对象添加 start-----------*/
function object3DAddClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=4", id);
}

function modelClicked(id) { //模型
	userdata.importModelData(id);
}

function treeClicked(id) { //树
	userdata.importModelData(id);
}

function furnitureClicked(id) { //小品
	userdata.importModelData(id);
}

function pictureClicked(id) { //图片
	userdata.importModelData(id);
}
/*------------三维对象添加 end-----------*/

//三维对象导出
/*------------三维导入导出 start-----------*/
function importExport3DClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=4", id);
}

function exportObjClicked(id) { //导出obj
	analysis.showMoveHtml(id);
}

function importBuildingClicked(id) { //导入楼块
	analysis.showMoveHtml(id);
}

function importModelClicked(id) { //导入模型
	analysis.showMoveHtml(id);
}

function importAnimateClicked(id) { //导入动画
	analysis.showMoveHtml(id);
}
/*------------三维导入导出 end-----------*/

//动态对象
function dynamicObjectClicked(id) {
	showDialog("html/menu/three_menu_item.html?type=5", id);
}

function fireClicked(id) { //火
	userdata.createParticle(0);
}

function mistClicked(id) { //烟
	userdata.createParticle(1);
}

function fountainClicked(id) { //多头喷泉
	userdata.createParticle(2);
}

function nozzleClicked(id) { //单头喷泉
	userdata.createParticle(3);
}

function SprayNozzleClicked(id) { //喷雾喷泉
	userdata.createParticle(4);
}

function WaterGunSmallClicked(id) { //喷雾水枪
	userdata.createParticle(5);
}

function ExplosionClicked(id) { //爆炸
	userdata.createParticle(6);
}

function dWaterClicked(id) { //动态水面
	userdata.createPrimitives("createdWater");
}

/*-------------------------------------标绘END-------------------------------------------------*/

/*-------------------------------------编辑START-------------------------------------------------*/
/*-------基础编辑START-----*/
//基础编辑
function basicEditClicked(id) {
	showDialog("html/menu/three_menu_item.html", id);
}

//选择
function selectClicked(id) {
	userdata.select();
}

//移动
function moveClicked(id) {
	userdata.move();
	editCameraOrElement(id);
}

//旋转
function rotateClicked(id) {
	userdata.rotate();
	editCameraOrElement(id);
}

//缩放
function scaleClicked(id) {
	userdata.scale();
	editCameraOrElement(id);
}

//贴地
function groundClicked() {
	userdata.alignGround();
}

//组合
function groupClicked() {
	userdata.group();
}

//拆分
function ungroupClicked() {
	userdata.ungroup()
}
/*-------基础编辑END-------*/

/*-------高级编辑START-----*/
//高级编辑
function seniorEditClicked(id) {
	showDialog("html/menu/three_menu_item.html", id);
}

//移动顶点
function editpointClicked(id) {
	userdata.editpoint();
}

//删除顶点
function deletepointClicked(id) {
	userdata.deletepoint();
}

//增加顶点
function addpointClicked(id) {
	userdata.addpoint();
}

//边拉伸
function SegmentExtrudeClicked(id) {
	userdata.SegmentExtrude();
}

//体拉伸
function VolumeSegmentExtrudeClicked(id) {
	userdata.VolumeSegmentExtrude();
}

//克隆
function cloneClicked(id) {
	userdata.clone();
}
//删除对象
function delObjClicked(id) {
	userdata.delObj();
}
//地形平整
function terrainSmoothClicked(id) {
	analysis.showMoveHtml(id);
}
/*-------高级编辑END-------*/
/*-------------------------------------编辑END-------------------------------------------------*/
/*-------------------------------------三级菜单START-------------------------------------------------*/
/*------------------------特效START-------------------------*/
//雨
function EffectRainClicked(id) {
	var flag = ThreeMenu.itemClickStyle(id);
	if(flag) { //显示
		setSlidersVisible(2);
	} else { //关闭
		setSlidersVisible(0);
	}
}
//雪
function EffectSnowClicked(id) {
	var flag = ThreeMenu.itemClickStyle(id);
	if(flag) { //显示
		setSlidersVisible(4);
	} else { //关闭
		setSlidersVisible(0);
	}
}
//雾
function EffectFogClicked(id) {
	var flag = ThreeMenu.itemClickStyle(id);
	if(flag) { //显示
		setSlidersVisible(8);
	} else { //关闭
		setSlidersVisible(0);
	}
}
//二维鹰眼
function ViewHawkeye2DClicked(id) {
	Stamp.Tools.Hawkeye2D(id);
}
/*------------------------特效END-------------------------*/

/*-------------------------------------三级菜单END-------------------------------------------------*/