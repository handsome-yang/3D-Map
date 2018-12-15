/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月8日
 * 描    述：功能菜单点击事件：工具栏和二级菜单栏
 * 注意事项：只用于存放功能菜单的点击事件（方法名：菜单ID + Clicked）
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 */

var g_BFirstInit = true;//第一次加载视点管理
var ViewTranSettingBtn = false;//图层管理是否已点击

/**********************************工具栏 START*************************************************/
//方案管理
function projectManageClicked(id) {
    var flag = BalloonHtml.itemClickStyle(id);
    showProjectManager(flag);
}

//图层管理
function LayerManagerClicked(id) {
    BalloonHtml.itemClickStyle(id);
    showDialog('html/view/treeView.html', id);
}

//地下浏览
function ViewUndergroundModeClicked(id) {
    Stamp.Tools.UndergroundMode(id);
}

//地形透明
function ViewTranSettingClicked(id) {
    Stamp.Tools.ViewTranSetting(id);
}

//属性查询
function QueryPropertyClicked() {
    QueryPropertyBtn = true;
    LayerManagement.earth.focus();
    GeneralQuery.propertyQuery();
}

//指北
function ViewRefersToNorthClicked(id) {
    Stamp.Tools.refersToNorth();
}

//顶视
function ViewTopClicked(id) {
    Stamp.Tools.refersToTop();
}

/**********************************工具栏 END*************************************************/

/**********************************场景 START*************************************************/
//视点管理
function ViewPointManagementClicked(id) {
    var flag = Tools.toolBarItemClickStyle("ViewPointManagement");
    if (flag) {
        if (g_BFirstInit) {
            top.getViewObject().getStarted(seearth);
            g_BFirstInit = false;
        }
        setTableView(true);
    } else {
        ViewPointManagementBtn = false;
        setTableView(false);
        resizeEarthTool();
    }
}

//飞行浏览
function trackClicked(id) {
    showDialog('html/view/track.html', id);
}

//人车漫游
function roamClicked(id) {
    showDialog('html/view/dynamicObj.html', id);
}

//场景环绕
function surroundClicked(id) {
    earth.GlobeObserver.SurroundControlEx(1);
}

//场景剖切
function clipSceneClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.clipScene(false, 31);
}

//动画管理
function animationClicked(id) {
    showDialog('html/view/animation.html', id);
}

//二维鹰眼
function Hawkeye2DClicked(id) {
    Stamp.Tools.Hawkeye2D(id);
}

//二维地图
function dimenShowHideClicked(id) {
    closeDialog();
    var isCover = Tools.getItemStyle("dimenCover");
    if (isCover) {
        Tools.singleStyleCancel("dimenCover");
        isShowMap(false, earth);
    }
    var isLink = Tools.getItemStyle("dimenLink")
    if (isLink) {
        Tools.singleStyleCancel("dimenLink");
        $("#earthDiv").css("width", "100%");
        setScreen(1, "", false);
    }
    var flag = Tools.toolBarItemClickStyle(id);
    if (flag) {
        LayerManagement.earth.Environment.Mode2DEnable = true;
        isShowMap(true,earth);
    } else {
        LayerManagement.earth.Environment.Mode2DEnable = false;
        isShowMap(false,earth);
    }
}

//二维叠加
function dimenCoverClicked(id) {
    closeDialog();
    var is2D = Tools.getItemStyle("dimenShowHide");
    if(is2D){
        LayerManagement.earth.Environment.Mode2DEnable = false;
        isShowMap(false,earth);
        Tools.singleStyleCancel("dimenShowHide");
    }
    var isLink = Tools.getItemStyle("dimenLink")
    if (isLink) {
        Tools.singleStyleCancel("dimenLink");
        $("#earthDiv").css("width", "100%");
        setScreen(1, "", false);
    }
    var flag = Tools.toolBarItemClickStyle(id);
    if (flag) { //一屏-三维
        isShowMap(true, earth);
    } else { //一屏-二维
        isShowMap(false, earth);
    }
}

//二维联动
function dimenLinkClicked(id) {
    closeDialog();
    var isCover = Tools.getItemStyle("dimenCover");
    if (isCover) {
        isShowMap(false, earth);
        Tools.singleStyleCancel("dimenCover");
    }
    var is2D = Tools.getItemStyle("dimenShowHide");
    if(is2D){
        LayerManagement.earth.Environment.Mode2DEnable = false;
        isShowMap(false,earth);
        Tools.singleStyleCancel("dimenShowHide");
    }
    var flag = Tools.toolBarItemClickStyle(id);
    if (flag) {
        setScreen(2, "", true);
        $("#earthDiv").css("width", "50%");
        $("#earthDiv1").css("width", "50%");
    } else {
        setScreen(1, "", false);
        $("#earthDiv").css("width", "100%");
    }
}

//系统设置
function ViewSystemSettingClicked(id) {
    Tools.singleSelectedStyle(id);
    var params = SYSTEMPARAMS;
    if (params) {
        params.projectList = LayerManagement.PROJECTLIST;
        params.earth = earth;
        params.currentPrjGuid = params.project;
        params.balloonAlpha = params.balloonAlpha;
        var url = "html/view/systemSettingDialog.html";
        var value = openDialog(url, params, 306, 231);
        Tools.singleStyleCancel(id);
        if (value == null) {
            return;
        }
        if (value.project == params.currentPrjGuid) {
            SystemSetting.setSystemConfig(value);
            SYSTEMPARAMS.balloonAlpha = value.balloonAlpha;
            return;
        }
        ctrPlanLayer = [];//控规图层
        indicatorAccountingLayer = [];//指标查看图层
        removeAnalysisLayer = [];//拆迁分析图层
        greenbeltAnalysisLayer = [];//绿地分析图层
        surroundingLayer = [];//周边查询图层

        var params = SystemSetting.setSystemConfig(value);
        //重新初始化
        LayerManagement.PIPELINELAYERS = []; //记录所有管线图层
        LayerManagement.POILAYERS = []; //记录所有管线图层
        LayerManagement.PROJECTLIST = []; //工程列表
        SYSTEMPARAMS.balloonAlpha = value.balloonAlpha;
        if (value.project != "") {
            //修改当前项目
            SYSTEMPARAMS.project = value.project;

            //派发事件
            $("#lyManager").trigger("chgSetting", SYSTEMPARAMS.project + "&" + value.prePrjGuid);
            SystemSetting.initSystemParam(function () {
                LayerManagement.setCurProjectLayerVisible();//初始默认隐藏所有图层（除了DEM/DOM/地下管线）
                var pipleLineLayerData = LayerManagement.getPipeTreeData(null); //获取管线图层数据
                var layerManager = STAMP.LayerManager(earth);
                var baseLayerDatas = layerManager.getLayerData(null, "currentPrj", true);
                aidedPlanDisableState();
            });
        }
    }
}
/**********************************场景 END*************************************************/


/**********************************方案审批 START*************************************************/
//项目导入
function projectLeadinginClicked(id) {
    var dataProcess = getDataProcessIndex();
    var generateEdit = getGenerateEditIndex();
    var projImport = STAMP.ProjImport(LayerManagement.earth, dataProcess, generateEdit);
    projImport.importProject();
}

//地形平整
function terrainSmoothClicked(id) {
    showDialog('html/project/beginDig.html', id);
}

//方案高程
function divChangeHeightClicked(id) {
    if (selNode) {
        editTool.showMoveHtml(id, editLayers);
    } else {
        alert("请先打开方案管理，选择要编辑的方案");
    }
}

//位置调整
function editPositionClicked(id) {
    editTool.editPosition(id);
}

//方位调整
function editProgrammeClicked(id) {
    editTool.editProgramme(id);
}

//楼高调整
function editFloorClicked(id) {
    editTool.editFloor(id);
}

//基底调整
function editBasalClicked(id) {
    editTool.editBasal(id);
}

//删除对象
function deleteClicked(id) {
    editTool.removeObj();
}

//材质编辑
function replaceTextureClicked(id) {
    editTool.textureEdit();
}

//简单建筑
function simplebuildingClicked(id) {
    editTool.clearHtmlBallon();
    editTool.browse();
    projManager.showParamModel(top.currentPlanLayerId, false);
    userdataTemp.importModelData(id);
}

//导入楼块
function importAlbugineaClicked(id) {
    editTool.clearHtmlBallon();
    editTool.browse();
    projManager.showParamModel(top.currentPlanLayerId, false);
    var analysis = STAMP.Analysis(earth);
    analysis.showMoveHtml(id);
}

//添加楼块
function addAlbugineaClicked(id) {
    editTool.clearHtmlBallon();
    editTool.browse();
    projManager.showParamModel(top.currentPlanLayerId, false);
    userdataTemp.importModelData(id);
}

//导入模型
function importModelClicked(id) {
    editTool.clearHtmlBallon();
    editTool.browse();
    projManager.showParamModel(top.currentPlanLayerId, false);
    var analysis = STAMP.Analysis(earth);
    analysis.showMoveHtml(id);
}

//添加模型
function modelClicked(id) {
    editTool.clearHtmlBallon();
    editTool.browse();
    projManager.showParamModel(top.currentPlanLayerId, false);
    userdataTemp.importModelData(id);
}

//审批纪要
function approveTagClicked(id) {
    editTool.showMoveHtml(id);
}
/**********************************方案审批 END*************************************************/

/**********************************规划分析 START*************************************************/
//附件查看
function attachmentClicked(id) {
    showDialog("html/analysis/attachment.html?type=project", id);
}

//方案指标
function buildingIndexClicked(id) {
    if (selNode) {
        var analysis = STAMP.Analysis(earth);
        analysis.showMoveHtml(id);
    } else {
        alert("请选择要编辑的方案");
    }
}

//方案比选
function divContrastProjectClicked(id) {
    if (projNodeId) {
        showDialog('html/analysis/comparison.html', id);
    } else {
        alert("请先审批项目")
    }
}

//控高分析
function heightControlClicked(id) {
    showDialog('html/analysis/heightcontrol.html', id);
}

//退让分析
function redLineClicked(id) {
    showDialog('html/analysis/roaddistance.html', id);
}

//视野分析-定点观察
function mFixedObserverClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.showMoveHtml(id);
}

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

//沿路通视
function mRoadLineSightClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.showMoveHtml(id);
}

//建筑间距
function mFloorToFloorClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.mFloorToFloor(id);
}

//阴影分析
function mShinningClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.showMoveHtml(id);
}

//日照分析
function mInsolationClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.showMoveHtml(id);
}

//天际线分析 沿街立面
function mSkylineClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.showMoveHtml(id);
}

//淹没分析
function mValleyClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.clear();
    analysis.showMoveHtml(id);
}
/**********************************规划分析 END*************************************************/

/**********************************辅助规划 START*************************************************/
//用地平衡
function balanceClicked(id) {
    var searchAnalysis = STAMP.searchAnalysis(earth);//公用库
    searchAnalysis.ctrPlanSeach(id);
}

//限高分析
function highLimitClicked(id) {
    showDialog('html/aidedPlan/highLimit.html', id);
}

//指标核算
function quotaAccountClicked(id) {
    showDialog('html/aidedPlan/quotaAccount.html', id);
}

//绿地分析
function greenLandAlyClicked(id) {
    showDialog("html/aidedPlan/greenLandAnalysis.html", id);
}

//选址分析
function selectPlaceClicked(id) {
    showDialog("html/aidedPlan/selectPlace.html", id);
}

//拆迁分析
function demolitionClicked(id) {
    var analysis = STAMP.Analysis(earth);
    analysis.clear();
    showDialog('html/aidedPlan/removeanalysis.html', id);
}

//空间查询
function spatialQueryClicked(id) {
    showDialog("html/aidedPlan/spatialSearch.html", id);
}

//关键字查询
function keywordQueryClicked(id) {
    showDialog("html/aidedPlan/keywordSearch.html", id);
}

//SQL查询
function complexQueryClicked(id) {
    showDialog("html/aidedPlan/complexSearch.html", id);
}
/**********************************辅助规划 END*************************************************/

/**********************************管线分析 START*************************************************/
//碰撞分析
function AnalysisCollisionClicked(id) {
    showDialog('html/pipelineAnalysis/PipeCollisionAnalysis.html', id);
}

//覆土分析
function AnalysisCoveringDepthClicked(id) {
    showDialog('html/pipelineAnalysis/PipeCoveringDepth.html', id);
}

//设施搜索
function AnalysisAttachmentSearchClicked(id) {
    showDialog('html/pipelineAnalysis/PipeAttachmentSearch.html', id);
}

//爆管分析
function AnalysisBurstClicked(id) {
    showDialog('html/pipelineAnalysis/PipeBurstAnalysis.html', id);
}

//流向分析
function AnalysisFlowShowingClicked(id) {
    FlowDirection.singleFlowShowing();//单根管线分析
}

//横断面分析
function AnalysisTranSectionClicked(id) {
    pipeTranSectionAnalysisClick();
}

//纵断面分析
function AnalysisCrossSectionClicked(id) {
    showDialog('html/pipelineAnalysis/PipeVerSectionAnalysis.html', id);
}

//开挖分析
function AnalysisExcavaClicked(id) {
    showDialog('html/pipelineAnalysis/AnalysisExcave.html', id);
}

//智能排管
function AnalysisPipelClicked(id) {
    showDialog('html/pipelineAnalysis/analysisPipeline.html', id);
}

//隧道分析
function tunnelAnalysisClicked(id) {
    showDialog('html/pipelineAnalysis/TerrainAnalysis.html', id);
}

//管线标注
function pipelineMarkClicked(id) {
    showDialog('html/pipelineAnalysis/three_menu_item.html', id);
}

/*-------------------------三级菜单 管线标注 START-------------------------------*/
//标高标注
function MarkedElevationClicked() { //标高标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    elevationClick();
}

//管径标注
function MarkedDiameterClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    diameterClick();
}

//埋深标注
function MarkedCoveringDepthClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    coveringDepthClick();
}

//坐标标注
function MarkedCoordinatesClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    coordinatesClick();
}

//坡度标注
function MarkedSlopeClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    slopeClick();
}

//弯头标注
function MarkedCurvedAngleClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    curvedAngleClick();
}

//栓点标注
function MarkedAngleAndLengthClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    AngleAndLengthClick("", "true");
}

//扯旗标注
function MarkedComplexClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    complexClick();
}

//自定义标注
function MarkedCustomPartClicked() {
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    customPartClick();
}
/*-------------------------三级菜单 管线标注 END-------------------------------*/

/**********************************管线分析 END*************************************************/

/**********************************常用工具 START*************************************************/
//水平距离测量
function mHorizontalDisClicked(id) {
    clearLRBDownEvent();
    horizontalDisClick();
}

//垂直距离测量
function mVerticalDisClicked(id) {
    clearLRBDownEvent();
    verticalDisClick();
}

//空间距离测量
function mSpaceDisClicked(id) {
    clearLRBDownEvent();
    spaceDisClick();
}

//水平面积测量
function mFlatAreaClicked(id) {
    clearLRBDownEvent();
    flatAreaClick();
}

//地表面积测量
function mSurfaceAreaClicked(id) {
    clearLRBDownEvent();
    surfaceAreaClick();
}

//平面角度测量
function mPlaneAngleClicked(id) {
    clearLRBDownEvent();
    mPlaneAngleClick();
}

//坐标获取
function CoordinateClicked(id) {
    var flag = Tools.groupItemSelected(id, 4);
    Stamp.Tools.picrureHtml(id, "/html/commonTools/getCoord.html", flag);
}

//屏幕截图
function screenShotClicked(id) {
    var flag = Tools.groupItemSelected(id, 4);
    Stamp.Tools.picrureHtml(id, "/html/commonTools/screenShot.html", flag);
}

//专题出图
function picturesClicked(id) {
    var flag = Tools.groupItemSelected(id, 4);
    Stamp.Tools.picrureHtml(id, "/html/commonTools/pictures.html", flag);
}
/**********************************常用工具 END*************************************************/