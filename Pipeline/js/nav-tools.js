/*
 * 菜单栏
 */

var g_BFirstInit = true;//第一次加载视点管理
var bLayerShow = true;//图层是否显示
var ViewTranSettingBtn = false;//地形透明是否开启

function LayerManagerClicked(id) {//图层管理
    var flag = BalloonHtml.itemClickStyle(id);
    setLayerShow(flag);
    bLayerVisible = flag;
}

function ViewUndergroundModeClicked(id) { // 地下浏览
    var flag = BalloonHtml.itemClickStyle(id);
    if (flag) {
        LayerManagement.earth.GlobeObserver.UndergroundMode = true; // 地下浏览模式
    } else {
        LayerManagement.earth.GlobeObserver.UndergroundMode = false; // 取消地下浏览模式
        LayerManagement.earth.Event.OnObserverChanged = function () {
        };
    }
}

function ViewTranSettingClicked(id) { // 地形透明
    var flag = BalloonHtml.itemClickStyle(id);
    Stamp.Tools.ViewTranSetting(flag);
}

function ViewRefersToNorthClicked(id) {
    Stamp.Tools.refersToNorth();
}

function ViewPointManagementClicked(id) { //视点管理
    var flag = Tools.toolBarItemClickStyle(id);
    if (flag) {
        if (g_BFirstInit) {
            getViewObject().getStarted(seearth);
            g_BFirstInit = false;
        }
        setTableView(true);
    } else {
        setTableView(false);
        resizeEarthTool();
    }
}
function ViewQuickLocateClicked(id) {//快速定位
    showDialog("html/view/quickQuery.html", id);
}
function ViewScreenShotClicked(id) {//屏幕截图
    Stamp.Tools.showMoveHtmlBalloons(id);
}
function ViewPicturesClicked(id) {//出图
    Stamp.Tools.showMoveHtmlBalloons(id);
}
function ViewPipelineUpdateClicked(id) { // 管线更新
    Stamp.Tools.showMoveHtmlBalloons(id);
}

function ViewFlyModeClicked(id) { //路径
    showDialog('html/view/track.html', id);
}

function ViewPersonModeClicked(id) { //漫游
    showDialog('html/view/dynamicObj.html', id);
}
function ViewLinkClicked(id) {//二维联动
    if ($("#ViewFullScreen2D").hasClass("selected")) {
        Tools.singleStyleCancel("ViewFullScreen2D")
    }
    closeDialog();
    var flag = BalloonHtml.itemClickStyle("ViewLink");
    if (flag) {
        Tools.disabledAll(["ViewFullScreen2D", "ViewLink", "ViewHawkEye"]);
        disableAll(true);
        setScreen(2, 0, true);
    } else {
        Tools.cancelDisabled(disabledButtonArr);
        disableAll(false);
        setScreen(1, 0, false);
    }
}
function ViewOpenCollisionClicked() { //开启碰撞
    Stamp.Tools.ViewOpenCollision();
}
function ViewShowingClicked(id) { //纹理显示
    if ($("#" + id + " span").text() == "纹理显示") {
        $("#" + id + " span").text("颜色显示");
        $("#" + id).attr("title", "颜色显示");
        Stamp.Tools.materialShowing();
    } else {
        $("#" + id + " span").text("纹理显示");
        $("#" + id).attr("title", "纹理显示");
        Stamp.Tools.customColorShowing();
    }
}

function AnalysisFlowShowingClicked(id) {//流向分析
    var flowFlag = Tools.toolBarItemClickStyle(id);
    if (flowFlag) {
        FlowDirection.flowShowing();
        $("#AnalysisFlowShowing span").text("取消显示");

    } else {
        FlowDirection.flowClosing();
        $("#AnalysisFlowShowing span").text("流向显示");

    }
}

function ViewClipSceneClicked(id) {//剖切分析
    ClipScene();
}

function ViewRoadNameClicked(id) {//显示道路
    var flag = Tools.toolBarItemClickStyle(id);
    var RoadName = $("#ViewRoadName span");
    if (flag) {
        RoadName.text("隐藏路名");
        Stamp.Tools.roadName(1);
    } else {
        RoadName.text("显示路名");
        Stamp.Tools.roadName(0);
    }
}

function ViewHawkEyeClicked(id) { // 二维鹰眼
    var flag = Tools.toolBarItemClickStyle(id);
    var earth = SystemSetting.earth;
    if (flag) {
        earth.Environment.Thumbnail = true;
    } else {
        earth.Environment.Thumbnail = false;
    }
}

function ViewFullScreen2DClicked(id) { //全屏
    var flag = Tools.toolBarItemClickStyle(id);
    BalloonHtml.removeItemStyle("ViewLink")
    closeDialog();
    setScreen(1, "", false);
    setSync(false);
    if (flag) {//取消全屏
        Tools.disabledAll(["ViewFullScreen2D", "ViewLink", "ViewHawkEye"]);
        disableAll(true);
        LayerManagement.earth.Environment.Mode2DEnable = true;
        isShowMap(true, LayerManagement.earth);
    } else {//全屏
        Tools.cancelDisabled(disabledButtonArr);
        disableAll(false);
        LayerManagement.earth.Environment.Mode2DEnable = false;
        isShowMap(false, LayerManagement.earth);
    }

    var f = $('#TerrainTransparency').hasClass('selected') ? 1 : 0;
    setSlidersVisible(f);
}
function ViewLegendShowingClicked(id) {//显示图例
    Stamp.Tools.legendShowing(id);
}
function ViewSystemSettingClicked(id) {//系统设置
    Tools.singleSelectedStyle(id);
    LayerManagement.ViewSystemSetting(id);
}
/*-----------------------查询------------------------*/
function QueryPropertyClicked() {//属性查询
    QueryPropertyBtn = true;
    LayerManagement.earth.focus();
    GeneralQuery.propertyQuery();
}
function QuerySpatialClicked(id) {//空间查询
    showDialog("html/query/spatialQuery.html", id);
}
function QueryBufferClicked(id) {//缓冲查询
    showDialog("html/query/PipeBufferAnalysis.html", id);
}
function QueryRoadClicked(id) {//道路查询
    showDialog("html/query/roadQuery.html", id);
}
function QueryCantonClicked(id) {//行政查询
    showDialog("html/query/cantonQuery.html", id);
}
function QueryCrossClicked(id) {//交叉口查询
    showDialog("html/query/crossQuery.html", id);
}
function QueryEquipmentClicked(id) {//特征查询
    showDialog("html/query/pointTypeQuery.html", id);
}
function QueryAttachmentClicked(id) {//附属物查询
    showDialog("html/query/attachmentQuery.html", id);
}
function QuerySquarenessClicked(id) {//管径查询
    showDialog("html/query/squarenessQuery.html", id);
}
function QueryMaterialClicked(id) {//材质查询
    showDialog("html/query/materialQuery.html", id);
}
function QueryAbandonClicked(id) {//废弃查询
    showDialog("html/query/abandonQuery.html", id);
}
function QueryOwnerClicked(id) {//权属查询
    showDialog("html/query/ownerQuery.html", id);
}
function QueryComplexClicked(id) {//复合查询
    showDialog("html/query/complexQuery.html", id);
}
function QueryAssociatedClicked(id) {//关联查询
    showDialog("html/query/associatedQuery.html", id);
}
/*----------------查询end--------------------------------------*/

/*----------------统计end--------------------------------------*/

function StatisticsDiameterClicked(id) { // 管径分段
    showDialog("html/statistics/diameterStatistics.html", id);
}

function StatisticsCoveringDepthClicked(id) { // 埋深分段
    showDialog("html/statistics/coveringDepthStatistics.html", id);

}

function StatisticsEquipmentClassClicked(id) { // 特征分类统计
    showDialog("html/statistics/pointTypeClassification.html", id);
}

function StatisticsAttachmentClassClicked(id) { // 附属物分类统计
    showDialog("html/statistics/attachmentClassification.html", id);
}

function StatisticsDiameterClassClicked(id) { // 管径分类统计
    showDialog("html/statistics/diameterClassification.html", id);
}

function StatisticsMaterialClassClicked(id) { // 材质分类统计
    showDialog("html/statistics/materialClassification.html", id);
}


function StatisticsAbandonClicked(id) { // 废弃统计
    showDialog("html/statistics/abandonStatistics.html", id);
}

function StatisticsOwnerClicked(id) { // 权属统计
    showDialog("html/statistics/ownerStatistics.html", id);
}

function StatisticsInbuiltClicked(id) { // 埋设统计
    showDialog("html/statistics/inbuiltStatistics.html", id);
}

function StatisticsRoadClicked(id) { // 道路统计
    showDialog("html/statistics/roadStatistics.html", id);
}

function StatisticsCantonClicked(id) { // 行政区统计
    showDialog("html/statistics/cantonStatistics.html", id);
}

/*----------------统计end--------------------------------------*/
/*---------------------分析start----------------------------------*/
function AnalysisHorizontalDisClicked(id) {//水平净距
    showDialog("html/analysis/PipeHorizontalSpacing.html", id);
}
function AnalysisVerticalDisClicked(id) {//垂直净距
    showDialog("html/analysis/PipeVerticalSpacing.html", id);
}
function AnalysisCollisionClicked(id) {//碰撞分析
    showDialog("html/analysis/PipeCollisionAnalysis.html", id);
}
function AnalysisCoveringDepthClicked(id) {//覆土分析
    showDialog("html/analysis/PipeCoveringDepth.html", id);
}
function AnalysisVerSectionClicked(id) {//纵断面
    showDialog("html/analysis/PipeVerSectionAnalysis.html", id);
}
function AnalysisTranSectionClicked() {
    pipeTranSectionAnalysisClick();//横断面
}
function AnalysisAttachmentSearchClicked(id) {//设施搜索
    showDialog("html/analysis/PipeAttachmentSearch.html", id);
}
function AnalysisBurstClicked(id) {//爆管分析
    showDialog("html/analysis/PipeBurstAnalysis.html", id);
}


function AnalysisTrackingClicked(id) {//追踪分析
    showDialog("html/analysis/PipeTracingAnalysis.html", id);
}
function AnalysisConnectiveClicked(id) {//连通分析
    showDialog("html/analysis/PipeConnectiveAnalysis.html", id);
}
function AnalysisExcavaClicked(id) {//开挖分析
    showDialog("html/analysis/AnalysisExcave.html", id);
}
function AnalysisWarningClicked(id) {//预警分析
    showDialog("html/analysis/PipeWarningAnalysis.html", id);
}
function AnalysisManagerRangeClicked(id) {//管理区监测
    showDialog("html/analysis/mangerRange.html?type=mScope", id);
}
function AnalysisProtectRangeClicked(id) {//保护区监测
    showDialog("html/analysis/mangerRange.html?type=pScope", id);
}
/************************分析end************************************/
/*************************标注start**************************************/
function MarkedElevationClicked() { //标高标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    elevationClick();
}
function MarkedDiameterClicked() { //管径标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    diameterClick();
}
function MarkedCoveringDepthClicked() { //埋深标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    coveringDepthClick();
}
function MarkedCoordinatesClicked() { //坐标标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    coordinatesClick();
}
function MarkedCustomPartClicked() {//自定义标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    customPartClick();
}
function MarkedSlopeClicked() { //坡度标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    slopeClick();
}
function MarkedCurvedAngleClicked() { //弯头角度标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    curvedAngleClick();
}
function MarkedComplexClicked() { //扯旗标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    complexClick();
}
function MarkedAngleAndLengthClicked() { //栓点标注
    clearLRBDownEvent();
    LayerManagement.earth.focus();
    AngleAndLengthClick("", "true");
}
function MarkedManagementClicked(id) { //标注管理
    showDialog("html/marked/markedManagement.html", id);
}
/************************标注end************************************/
/*************************量算start**************************************/
function MeasureBTerrainClicked(id) { //忽略地形
    var flag = Tools.toolBarItemClickStyle(id);
    bTerrainClick(flag);
}
function MeasureHorizontalDisClicked(id) { //水平距离
    clearLRBDownEvent();
    horizontalDisClick();

}
function MeasureVerticalDisClicked(id) { //垂直距离
    clearLRBDownEvent();
    verticalDisClick();
}
function MeasureSpaceDisClicked(id) { //空间距离
    clearLRBDownEvent();
    spaceDisClick();
}
function MeasureFlatAreaClicked(id) { //水平面积测量
    clearLRBDownEvent();
    flatAreaClick();
}
function MeasurePlaneAngleClicked(id) { //角度测量
    clearLRBDownEvent();
    mPlaneAngleClick();
}
function MeasurePipelineHorDisClicked(id) { //管间水平距离
    clearLRBDownEvent();
    pipelineHorDisClick();
}
function MeasurePipelineVerDisClicked(id) { //管间垂直距离
    clearLRBDownEvent();
    pipelineVerDisClick();
}
function MeasurePipelineSpaceDisClicked(id) { //管间水平面积
    clearLRBDownEvent();
    pipelineSpaceDisClick();
}
/************************量算end************************************/

