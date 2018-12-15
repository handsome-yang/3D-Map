/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月8日
 * 描    述：最外层页面脚本，包括全局变量和方法
 * 注意事项：可存放全局的变量或方法
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 */

//全局公共变量
var earth = null; // 全局球体对象
var SYSTEMPARAMS = {}; //系统参数对象
var userdataTemp = null;//用户数据对象
var editTool = null;//editTool对象
var projManager = null;//方案管理对象
var checkedStatusList = []; //记录复选框状态
var earthToolsDiv = null;//工具栏div对象
var earthToolsBalloon = null;//工具栏气泡
var dialogLeft = Math.ceil(86 * zoomInit);//工具栏宽度--用于设置弹出对话框距离场景左边框的距离
var earthToolHeightTemp = 0;//页面自适应布局全局-高度
var bFullScreen = false;//是否全屏

//方案编辑模块
var editState = false;//处于方案编辑状态
var selNode = null;//选择方案节点
var selNode_id = null;//选择的方案节点ID
var projNode = null;//审批中的项目节点
var projNodeId = null;//审批中的项目节点ID
var digDepth = 0;//记录主球地形平整时的开挖深度(球2做同步地形平整时的参考)
var ploygonLayersVcts3 = {}; //规划用地数组(Vector3s数组)
var smoothLineV3sArr = [];//地形平整线数组(Vector3s数组)
var databaseLayersArr = [];//从数据库中读取的图层数据,由project.js中取得
var currentLayerDatas = null;//数据库所有现状图层数据列表
var currentLayerIdList = null;//所有现状图层ID列表
var curEditLayers = null;//当前审批中的项目编辑图层
var editLayers = [];//所有编辑图层
var projectLayerIdList = [];//所有项目图层（groupid为-2的图层）
var projectLayerMap = {};//所有项目图层键值对（groupid为-2的图层）
var passedPlanObj = [];//已审批的项目键值对（项目ID，已通过方案）
var g_currTempLayer = null;//地形开挖图层
var g_currTempLayer2 = null;//地形开挖图层(球2)
var projectState = 0;//方案状态：0未审批或结束审批;1审批中未勾选方案和专题等;2审批中勾选方案;3审批中勾选专题
var currentPlanLayerId = null;//当前编辑的方案GUID
var currentPlanName = "";//当前编辑的方案名称

//辅助规划模块
var indicatorAccountingLayer = []; //指标查看图层
var removeAnalysisLayer = []; //拆迁分析图层
var ctrPlanLayer = []; //控规图层
var greenbeltAnalysisLayer = []; //绿地分析图层
var surroundingLayer = [];//周边矢量图层（空间、关键字、SQL查询）

//方案审批模块
var bMultiScreenState = false;

//管线分析模块
var regExpValidation = /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$/;//验证半径的正则表达式:非0开头的正数，小数点之后保留最多三位,小数点之前最多三位


/***************************************全局方法 START****************************************/
/**
 * 初始化系统参数及页面（三维球加载完成时调用）
 * @return {[type]} [description]
 */
function init() {
    //初始化环境参数
    SystemSetting.initSystemParam(function(){
        LayerManagement.setCurProjectLayerVisible();//初始默认隐藏所有图层（除了DEM/DOM/地下管线）
        editTool = STAMP.EditTool(earth, getGenerateEditIndex());//初始化编辑工具
        $("#projectManager").attr("src","html/project/projectManage.html");
    });

    LayerManagement.initLayerDataType(earth, null);//初始化查询返回数据类型

	initMenu();//初始化菜单
    approveDisableState(0);//初始化设置按钮状态
    projectState = 0;
    showEarthTools();//初始化工具栏

    var layerManager = STAMP.LayerManager(earth);
    layerManager.getLayerData(null, "currentPrj", true);//初始化各类图层数据，在未打开图层面板时也能操作图层相关的查询功能
    aidedPlanDisableState();//初始化辅助规划模块的菜单按钮状态

    userdataTemp = STAMP.Userdata(earth);  //获取用户数据
}

/**
 * 获取数据处理对象（lib_data_util）
 * @return {[object]} [数据处理对象]
 */
function getDataProcessIndex() {
    var dataProcess = document.getElementById("dataProcess");
    return dataProcess;
}

/**
 * 获取数据编辑对象（generate_edit_active）
 * @return {[object]} [数据编辑对象]
 */
function getGenerateEditIndex() {
    var generateEdit = document.getElementById("generateEdit");
    return generateEdit.object;
}

/**
 * 获取ResultView对象，目前只有视点在此
 * @return {[object]} [视点管理面板对象]
 */
function getViewObject() {
    try {
        return window.frames["ResultMain"];
    } catch (e) {
        alert(e.name + ":" + e.message);
        return null;
    }
}

/**
 * 获取规划审批面板
 * @return {[object]} [规划审批面板对象]
 */
function getOperatorObject() {
   try {
       return window.frames["projectManager"];
   } catch (e) {
       alert(e.name + ":" + e.message);
       return null;
   }
}

/**
 * 获取功能面板
 * @return {[object]} [功能面板对象]
 */
function getFuncPanelObject() {
   try {
       return window.frames["operator"];
   } catch (e) {
       alert(e.name + ":" + e.message);
       return null;
   }
}

/**
 * 显示或隐藏编辑图层
 * @param  {[bool]} bShow    [true：显示；false：隐藏]
 * @param  {[array]} layerIds [图层列表]
 * @return {[type]}          [description]
 */
function showHideEditLayer(bShow, layerIds) {
    if (projectLayerIdList && projectLayerIdList.length > 0) {
        for (var i = 0; i < projectLayerIdList.length; i++) {
            var layerId = projectLayerIdList[i];
            if ($.inArray(layerId, layerIds) === -1) { // 不在数组中才返回-1
                if (editLayers[layerId]) {
                    editLayers[layerId].Visibility = bShow;
                }
            }
        }
    }
}

/**
 * 初始化编辑图层的编辑状态
 * @param  {[bool]} bEditable [是否可编辑]
 * @return {[type]}           [description]
 */
function initEditLayerEditable(bEditable) {
    if (projectLayerIdList && projectLayerIdList.length > 0) {
        for (var i = 0; i < projectLayerIdList.length; i++) {
            var layerId = projectLayerIdList[i];
            if (editLayers[layerId]) {
                editLayers[layerId].Editable = bEditable;
            }
        }
    }
}

/***************************************全局方法 END****************************************/

/***************************************页面布局相关 START**********************************/
/**
 * 工具栏重绘
 * @return {[type]} [description]
 */
function resizeEarthToolWindow(){
    if (earthToolsBalloon && Math.ceil($("#earthDiv").height() * getZoom()) < earthToolHeight) {
        var temHeight = parseInt((Math.ceil($("#earthDiv").height() * getZoom()) - 32 - (22 * zoomInit)) / (45 * zoomInit)) * (45 * zoomInit) + 32 + (22 * zoomInit);
        earthToolsBalloon.SetRectSize(earthToolWidth, temHeight);
        earthToolHeightTemp = temHeight;
    } else if (earthToolsBalloon && earthToolHeightTemp < earthToolHeight) {
        earthToolsBalloon.SetRectSize(earthToolWidth, earthToolHeight);
    }
}

/**
 * 左侧面板窗口重绘
 * @return {[type]} [description]
 */
function resizeLeftPanel(){
    if($("#id_left_operator").is(":visible")){
        $("#id_left_operator").panel({
            height: $(window).height() - $("#headerDiv").height()
        });
    }
    var treeResize = getFuncPanelObject().windowResize;
    if(treeResize && typeof treeResize == "function"){
        treeResize();
    }
    var panelWindowResize = getOperatorObject().windowResize;
    if(panelWindowResize && typeof panelWindowResize == "function"){
        panelWindowResize();
    }
}

/**
 * 窗口重绘
 * @return {[type]} [description]
 */
function windowResize(){
    $("#mainDiv").height($(window).height() - ($("#headerDiv").is(":hidden")?0:$("#headerDiv").height()));
    $("#projectManager").height($("#mainDiv").height() - $("#layerHeader").height());
    $("#MapTwo").height($("#mainDiv").height() - ($("#viewpointMain").is(":hidden")?0:$("#viewpointMain").height()) - ($("#toolDiv").is(":hidden")?0:$("#toolDiv").height()));
    setToolsIconStatus();
    resizeEarthToolWindow();
    resizeLeftPanel();
}

/**
 * 页面重绘事件
 * @return {[type]} [description]
 */
window.onresize = function(){
    windowResize();
}
function setBalloonVisible(isVisible){
    if (LayerManagement.htmlBalloon != null) {
        LayerManagement.htmlBalloon.SetIsVisible(isVisible);
    }
    for(var i=0; i < bolonArr.length; i++){
        if(bolonArr[i]){
            bolonArr[i].SetIsVisible(isVisible);
        }
    }
    if(queryHtmlBalloon != null){
        queryHtmlBalloon.SetIsVisible(isVisible);
    }
    if(earthToolsBalloon != null){//工具栏气泡
        earthToolsBalloon.SetIsVisible(isVisible);
    }
    if(STAMP.EditTool.htmlBalloonMove){//编辑模块气泡
        STAMP.EditTool.htmlBalloonMove.SetIsVisible(isVisible);
    }
    if(htmlBalloonMove){//分析模块气泡
        htmlBalloonMove.SetIsVisible(isVisible);
    }
    if(Stamp.Tools.picturesBalloons){//常用工具气泡
        Stamp.Tools.picturesBalloons.SetIsVisible(isVisible);
    }
}
/**
 * 针对ie10+可以用的显示或者隐藏气泡                                                       [description]
 */
try{//ie9以下addEventListener会报错，所以需要加上try,catch
    document.addEventListener("visibilitychange",function(){
        if(document.hidden){
            setBalloonVisible(false);
        } else {
            setBalloonVisible(true);
        }
    });
}catch(e){

}
/**
 * 三维球全屏显示-方案比选时需要调用的
 * @param  {[type]} bFlag [true：全屏，false：取消全屏]
 * @return {[type]}       [description]
 */
var fullScreenEarth = function (bFlag) {
    bFullScreen = bFlag;
    if(bFlag){//全屏
        $("#toolDiv").hide();
        $("#leftPanel").hide();
        $("#headerDiv").hide();
        $("#mainDiv").css("top", "0px");
        $("#mainEarth").css("margin-left", "0px");
        $("#id_left_operator").hide();
        $(document).keyup(function(event){//注册按键事件
            if(event.keyCode == 27 && bFullScreen){//27：esc按键
                fullScreenEarth(false);//取消全屏
                if(getFuncPanelObject().$("#btnFullScreen") && getFuncPanelObject().$("#btnFullScreen").length > 0){
                    getFuncPanelObject().$("#btnFullScreen").text("全屏显示");
                }
                getFuncPanelObject().fullScreenStatus = false;
            }else{
                return false;
            }
        });
    }else{//取消全屏
        $("#toolDiv").show();
        $("#leftPanel").show();
        $("#headerDiv").show();
        $("#mainDiv").css("top", STAMP_config.height.bannerHeight + "px");
        $("#mainEarth").css("margin-left", STAMP_config.height.leftPanelWidth + "px");
        $("#id_left_operator").show();
        $(document).keyup(function(event){//取消按键事件
        });
    }
    var WsShell = new ActiveXObject('WScript.Shell');
    WsShell.SendKeys('{F11}');
    windowResize();//页面重绘
    earth.Focus();//三维球获取焦点
}

/**
 * 设置视点面板是否显示
 * @param {[type]} show [true显示，false不显示]
 */
function setTableView(show){
    if(show){
        $("#viewpointMain").show();
        $("#MapTwo").height($("#MapTwo").height() - 135);
    }else{
        $("#MapTwo").height($("#MapTwo").height() + 135);
        $("#viewpointMain").hide();
    }
    resizeEarthToolWindow();
}
/**
 * 重新设置工具条的大小,因为earth的高度变大的时候不会去重绘，所以采取这样一种方法
 */
function resizeEarthTool(){
    earthToolsBalloon.SetRectSize(earthToolWidth, earthToolHeight);
    $("#MapTwo").height(LayerManagement.earth.clientHeight - 1);
    $("#MapTwo").height(LayerManagement.earth.clientHeight + 1);
}
/**********************************页面布局相关 END**********************************************/

/**********************************标题栏样式 START**********************************************/
$(".logoImg").attr("src",STAMP_config.topInfo.logo);
if(STAMP_config.topInfo.titleImg && STAMP_config.topInfo.titleImg != ""){//系统标题图片存在，则使用图片显示
    $(".titleImg").attr("src",STAMP_config.topInfo.titleImg);
    $(".titleText").hide();
    $(".titleImg").show();
}else{//系统标题图片不存在，则使用文字显示
    $(".titleText").text(STAMP_config.topInfo.titleText);
    $(".titleImg").hide();
    $(".titleText").show();
}
/**********************************标题栏样式 END************************************************/

$(function(){
    windowResize();
    $("#generateEditDiv").html('<div id="earthContainer2">'+'<object id="generateEdit" classid="clsid:422A8D29-FF52-4C65-8EDF-F6DC3008E8A0" width="0" height="0"></object></div>');
});

//参数初始化
var SystemSetting = {
    earth: null,
    excuteType: 27,//getxml请求成功时的结果判断
    /**
     * 初始化规划字段映射
     * @param  {[type]}   reloadEditLayer [所有的编辑图层]
     * @param  {Function} callback        [初始化完成后的回调方法]
     * @return {[type]}                   [description]
     */
    initMapMgr:function(reloadEditLayer, callback) {
        try {
            var fXmlUrl = SystemSetting.earth.LayerManager.GetLayerByGuid(SYSTEMPARAMS.project).ProjectSetting.PlanFieldMapFile;
            SystemSetting.earth.Event.OnEditDatabaseFinished = function(response) {
                SystemSetting.earth.Event.OnEditDatabaseFinished = function() {};
                var fieldXml = response.AttributeName;
                mapMgr.init(undefined, fieldXml);
                if (reloadEditLayer) {
                    getEditLayerListLoaded();
                }
                if(typeof callback == 'function'){
                    callback();
                }
            }

            if(fXmlUrl){
                SystemSetting.earth.DatabaseManager.GetXml(fXmlUrl);
            }else{
                if (reloadEditLayer) {
                    getEditLayerListLoaded();
                }
                if(typeof callback == 'function'){
                    callback();
                }
            }
        } catch (e) {
            if (reloadEditLayer) {
                getEditLayerListLoaded();
            }
            if(typeof callback == 'function'){
                alert("规划字段映射文件读取失败，请检查规划字段映射文件是否配置正确？");
                callback();
            }
        }
    },
    /**
     * 获取管线图层列表
     * @param  {[object]} layer [根节点图层]
     * @return {[array]}       [管线图层数组]
     */
    getPipeListByLayer: function(layer) {
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
     * 获取有管线图层的工程列表
     * @return {[list]} [有管线的工程列表]
     */
    getPipelineProjectList: function() {
        var pipeProjectList = [];
        var rootLayerList = this.earth.LayerManager.LayerList;
        var projectCount = rootLayerList.GetChildCount();
        for (var i = 0; i < projectCount; i++) {
            var childLayer = rootLayerList.GetChildAt(i);
            var layerType = childLayer.LayerType;
            if (layerType === "Project") {
                var projectId = childLayer.Guid;
                var projectName = childLayer.Name;
                var pipeList = this.getPipeListByLayer(childLayer);
                if (pipeList.length > 0) {
                    pipeProjectList.push({
                        id: projectId,
                        name: projectName
                    });
                }
            }
        }
        return pipeProjectList;
    },

    /**
     * 初始化系统参数对象
     * @param  {Function} callback [初始化完成后的回调方法]
     * @return {[type]}            [description]
     */
    initSystemParam: function(callback) {
        var earth = SystemSetting.earth;
        if (SYSTEMPARAMS) {//初始化配置文件
            SYSTEMPARAMS = this.getSystemConfig();
        }
        if (SYSTEMPARAMS.project) {
            if (SYSTEMPARAMS.Position != "" && SYSTEMPARAMS.Position) {
                var longitude = SYSTEMPARAMS.Position.split(",")[0];
                var latitude = SYSTEMPARAMS.Position.split(",")[1];
                var altitude = SYSTEMPARAMS.Position.split(",")[2];
                var tilt = SYSTEMPARAMS.Position.split(",")[3];
                var heading = SYSTEMPARAMS.Position.split(",")[4];
                var roll = SYSTEMPARAMS.Position.split(",")[5];
                var range = SYSTEMPARAMS.Position.split(",")[6];
                earth.GlobeObserver.GotoLookat(longitude, latitude, altitude, heading, tilt, roll, range);
            }
            var layer = earth.LayerManager.GetLayerByGUID(SYSTEMPARAMS.project);
            if(layer == null){
                if(typeof callback == 'function'){
                    callback();
                }
                return;
            }
            //服务端属性配置开始！
            var projectSetting = layer.ProjectSetting;
            var layerLink = projectSetting.PipeConfigFile; //管线编码配置文件
            var fieldMap = projectSetting.FieldMapFile; //字段映射配置文件
            var valueMap = projectSetting.ValueMapFile; //值域映射文件

            var pipelineArr = SystemSetting.getPipeListByLayer(layer); //初始化管线图层列表;

            if (pipelineArr == undefined || pipelineArr.length < 1 || pipelineArr.length == undefined) {
                if(typeof callback == 'function'){
                    callback();
                }
            }else {
                if (fieldMap != "") {//管线字段映射开始
                    var filedPath = "";
                    if (fieldMap.indexOf("http") >= 0) {
                        filedPath = fieldMap;
                    } else {
                        filedPath = "http://" + fieldMap.substr(2).replace("/", "/sde?/") + "_sde";
                    }
                    SYSTEMPARAMS.pipeFieldMapUrl = filedPath;

                    if (filedPath != "") {//管线字段映射请求开始
                        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                            if (pRes.ExcuteType == SystemSetting.excuteType) {
                                SYSTEMPARAMS.pipeFieldMap = loadXMLStr(pRes.AttributeName); //初始化编码映射文件对象
                            }
                            if (layerLink != "") {//管线编码配置开始
                                var configUrl = "";
                                if (layerLink.indexOf("http") >= 0) {
                                    configUrl = layerLink;
                                } else {
                                    configUrl = "http://" + layerLink.substr(2).replace("/", "/sde?/") + "_sde";
                                }
                                SYSTEMPARAMS.pipeConfigLink = layerLink;
                                if (configUrl != "") {//管线编码配置请求开始
                                    earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                                        if (pRes.ExcuteType == SystemSetting.excuteType) {
                                            SYSTEMPARAMS.pipeConfigDoc = loadXMLStr(pRes.AttributeName); //初始化管线字段映射文件
                                        }
                                        if (valueMap != "") {//管线值域映射配置开始
                                            var vPath = "";
                                            if (valueMap.indexOf("http") >= 0) {
                                                vPath = valueMap;
                                            } else {
                                                vPath = "http://" + valueMap.substr(2).replace("/", "/sde?/") + "_sde";
                                            }

                                            if (vPath != "") {//管线值域映射配置请求开始
                                                earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                                                    if (pRes.ExcuteType == SystemSetting.excuteType) {
                                                        SYSTEMPARAMS.valueMap = loadXMLStr(pRes.AttributeName); //初始化编码映射文件对象
                                                    }

                                                    //最后开始规划字段映射
                                                    SystemSetting.initMapMgr(undefined, function () {
                                                        if (typeof callback == 'function') {
                                                            callback();
                                                        }
                                                    });
                                                }
                                                earth.DatabaseManager.GetXml(vPath);
                                            }
                                        } else {
                                            alert("缺少管线值域映射文件.");
                                            SYSTEMPARAMS.valueMap = "";
                                            SystemSetting.initMapMgr(undefined, function () {
                                                if (typeof callback == 'function') {
                                                    callback();
                                                }
                                            });
                                        }
                                    }
                                    earth.DatabaseManager.GetXml(configUrl);
                                }
                            } else {
                                alert("缺少管线编码配置文件.");
                                SYSTEMPARAMS.pipeConfigDoc = "";
                                SystemSetting.initMapMgr(undefined, function () {
                                    if (typeof callback == 'function') {
                                        callback();
                                    }
                                });
                            }
                        }
                        earth.DatabaseManager.GetXml(filedPath);
                    }
                } else {
                    alert("缺少管线字段映射文件.");
                    SystemSetting.initMapMgr(undefined, function () {
                        if (typeof callback == 'function') {
                            callback();
                        }
                    });
                }
            }

            SystemSetting.loadSpatialRefFile(layer, projectSetting.SpatialRefFile);//空间参考文件
        } else {
            SYSTEMPARAMS.pipeConfigDoc = "";
            SYSTEMPARAMS.pipeDatum = "";
            SYSTEMPARAMS.pipeFieldMap = "";
            if(typeof callback == 'function'){
                callback();
            }
        }
    },

    /**
     * 加载空间参考文件
     * @return {[type]} [description]
     */
    loadSpatialRefFile: function(layer, spatialRef){
        if (spatialRef != "") {
            SYSTEMPARAMS.pipeDatum = CoordinateTransform.createDatum(spatialRef);
            earth.Event.OnDocumentUpdate = function(res) {
                //修改坐标显示单位 如果当前工程范围内 就转坐标 否则显示经纬度
                var earthPose = earth.GlobeObserver.TargetPose;
                var lon = earthPose.Longitude;
                var lat = earthPose.Latitude;
                var alt = earth.GlobeObserver.Pose.Altitude;
                var pXY = SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(lon, lat, alt);
                var layerBounds = layer.ProjectSetting.LonLatRect;
                var layerMaxHeight = layerBounds.MaxHeight; //图层的最大可见高度
                if (alt <= (layerMaxHeight + 10000) && lon >= layerBounds.West && lon <= layerBounds.east && lat >= layerBounds.South && lat <= layerBounds.North) {
                    earth.Environment.UseLocalCoord = true;
                    earth.Environment.SetLocalCoord(pXY.x, pXY.y);
                } else {
                    earth.Environment.UseLocalCoord = false;
                }
            }
        } else {
            SYSTEMPARAMS.pipeDatum = "";
        }
    },

    /**
     * 初始化系统配置文件内容
     * @param  {[string]} id [项目id]
     * @return {[string]}    [初始化的系统配置文件内容]
     */
    initSystemConfig: function(id) {
        var configXml = '<xml>';
        if (id) {
            configXml = configXml + '<Project>' + id + '</Project>'; //系统当前项目id
        } else {
            configXml = configXml + '<Project></Project>'; //
        }
        configXml += '<ProfileAlt></ProfileAlt>'; //
        configXml += '<BalloonAlpha>-1</BalloonAlpha>'; //启用透明气泡状态
        configXml += '<Position></Position></xml>'; //初始位置
        return configXml;
    },

    /**
     * 获取系统配置参数
     * @return {[object]} [系统配置参数]
     */
    getSystemConfig: function() {
        var rootPath = SystemSetting.earth.Environment.RootPath + "temp\\SystemConfig";
        var configPath = rootPath + ".xml";
        var configXml = SystemSetting.earth.UserDocument.LoadXmlFile(configPath);
        if (configXml === "" || configXml.indexOf("Position") < 0) {//配置文件不存在，则需要新建并初始化
            configXml = this.initSystemConfig();
            SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, configXml);
        }
        var systemDoc = loadXMLStr(configXml);
        var systemJson = $.xml2json(systemDoc);
        if (systemJson == null) {//防止xml格式错误导致系统无法正常运行
            configXml = SystemSetting.initSystemConfig();
            SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, configXml);
            systemDoc = loadXMLStr(configXml);
            systemJson = $.xml2json(systemDoc);
            if(systemJson == null){
                alert("客户端sysytemconfig.xml格式错误");
                return;
            }
        }
        var tempLayer = null;
        if (systemJson.Project) {
            tempLayer = SystemSetting.earth.LayerManager.GetLayerByGUID(systemJson.Project);
        }
        if (!tempLayer || systemJson.Project == "" || systemJson.Project.length != 36) { //如果工程不存在，默认选第一个；所有的工程GUID都是36位长度的字符串
            var pipeProjArr = this.getPipelineProjectList();
            if (pipeProjArr.length > 0) {
                SystemSetting.earth.UserDocument.DeleteXmlFile(configPath);//删除配置文件
                var newXml = this.initSystemConfig(pipeProjArr[0].id);
                SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, newXml);//重新创建配置文件
                systemDoc = loadXMLStr(newXml);
                systemJson = $.xml2json(systemDoc);
            }
        }
        var systemData = {};
        systemData.project = systemJson.Project;
        systemData.Position = systemJson.Position;
        systemData.profileAlt = systemJson.ProfileAlt;
        systemData.balloonAlpha = systemJson.BalloonAlpha;
        return systemData;
    },

    /**
     * 设置系统配置参数
     * @param {[type]} systemData [系统配置参数]
     */
    setSystemConfig: function(systemData) {
        var rootPath = SystemSetting.earth.Environment.RootPath + "temp\\SystemConfig";
        var configPath = rootPath + ".xml";
        var configXml = SystemSetting.earth.UserDocument.LoadXmlFile(configPath);
        configXml = this.initSystemConfig();
        var systemDoc = loadXMLStr(configXml);
        var root = systemDoc.documentElement;
        (root.getElementsByTagName("Project")[0]).text = systemData.project;
        (root.getElementsByTagName("Position")[0]).text = systemData.Position;
        (root.getElementsByTagName("ProfileAlt")[0]).text = systemData.profileAlt == "0" ? "0" : "1";
        if (root.getElementsByTagName('BalloonAlpha').length == 0) {
            var bn = systemDoc.createElement('BalloonAlpha');
            var bt = systemDoc.createTextNode('');
            bn.appendChild(bt);
            root.appendChild(bn);
        }
        if (systemData.balloonAlpha != null) {
            root.getElementsByTagName('BalloonAlpha')[0].text = systemData.balloonAlpha;
        }
        SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, systemDoc.xml);
    }

};

//-----------------------------------------------------------------
//--坐标转换对象创建 - 开始
//-----------------------------------------------------------------
var CoordinateTransform = {
    sysDatum: null, //系统内部的坐标转换对象

    /**
     * 功能：获取系统内部的坐标转换对象
     */
    getSystemDatum: function() {
        if (this.sysDatum == null) {
            this.sysDatum = this.createDatum();
        }
        return this.sysDatum;
    },
    getRootPath: function() {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return (localhost + projectName);
    },
    /**
     * 功能：创建空间坐标转换对象
     */
    createDatum: function(spatialUrl) {
        if(this.sysDatum){
            return this.sysDatum;
        }
        if(spatialUrl == undefined || spatialUrl == ""){
            var projectId = SYSTEMPARAMS.project;
            var projLayer = SystemSetting.earth.LayerManager.GetLayerByGUID(projectId);
            spatialUrl = projLayer.ProjectSetting.SpatialRefFile;
        }

        var filePath = SystemSetting.earth.Environment.RootPath+"\\temp\\spatialFile";
        SystemSetting.earth.UserDocument.SaveFile(spatialUrl,"spatialFile");
        var dataProcess = top.getDataProcessIndex();
        dataProcess.Load();
        var spatial = dataProcess.CoordFactory.CreateSpatialRef();
        spatial.InitFromFile(filePath);
        SystemSetting.earth.UserDocument.DeleteFile (filePath);
        var datum = dataProcess.CoordFactory.CreateDatum();
        datum.Init(spatial);
        this.sysDatum = datum;
        return datum;
    }
};
