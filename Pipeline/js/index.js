/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：一些全局变量以及初始化的方法和获取一些iframe的方法
 * 遗留bug ：无
 * 修改日期：2017年11月8日
 **************************************************/
// 系统的全局变量
var areaTable = [];//配置单位、道路、区域数据表
var earthToolsDiv = null;//工具栏div
var SYSTEMPARAMS = {}; //系统参数对象
//验证半径的正则表达式:非0开头的正数，小数点之后保留最多三位,小数点之前最多三位
var regExpValidation = /^(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*))$/;
var earthToolsBalloon = null;//工具栏气泡对象
var dialogLeft = Math.ceil(86 * zoomInit);//弹出框靠左距离
var headerHeight = 70;//一级菜单高度
var isProjectChanged = false;//工程是否切换

/*-------------标题栏样式 START--------------------*/
$(".logoImg").attr("src", STAMP_config.topInfo.logo);
if (STAMP_config.topInfo.titleImg && STAMP_config.topInfo.titleImg != "") {
    $(".titleImg").attr("src", STAMP_config.topInfo.titleImg);
    $(".titleText").hide();
    $(".titleImg").show();
} else {
    $(".titleText").text(STAMP_config.topInfo.titleText);
    $(".titleImg").hide();
    $(".titleText").show();
}
/*-------------标题栏样式 END--------------------*/

/**
 * 重要方法：三维球加载完成后初始化方法
 */
function init() {
    SystemSetting.initSystemParam();//初始化读取一些stampManager的配置文件
    LayerManagement.initLayerDataType(top.LayerManagement.earth, null); //初始化服务返回类型，不然属性查询是查不出来的
    var pipleLineLayerData = LayerManagement.getPipeTreeData(null); //获取管线图层数据
    baseLayerTree(LayerManagement.earth); // 将基本图层数据添加到左侧树
    pipeLineLayerTree(LayerManagement.earth, pipleLineLayerData); // 将管线图层数据添加到左侧树
    LayerManagement.initProjectList();//获取所有管线工程
    showEarthTools();//显示工具栏菜单
    
}
/**
 * 获取数据处理object对象：空间参考等,依赖于lib_data_util.dll
 * @return {[object]} [数据处理object对象]
 */
function getDataProcessIndex() {
    var dataProcess = document.getElementById("dataProcess");
    return dataProcess;
}

/**
 * 获取功能面板opendialog的frame
 * @return {[object]} [该frame的html对象]
 */
function getOperObject() {
    try {
        return window.frames["operator"];
    }
    catch (e) {
        return;
    }
}

/**
 * [获取ResultView对象，目前只有视点在此]
 * @return {[object]} [该frame的html对象]
 */
function getViewObject() {
    try {
        return window.frames["ResultMain"];
    }
    catch (e) {
        return;
    }
}

/*-----------------页面布局相关 START----------------------*/
/*
 页面自适应布局
 包括：系统主界面排版、三维球、左侧面板等
 */
var earthToolHeightTemp = 0;
function resizeEarthToolWindow() {//工具栏重新调整窗口
    if (earthToolsBalloon && Math.ceil($("#earthDiv").height() * getZoom()) < earthToolHeight) {
        var temHeight = parseInt((Math.ceil($("#earthDiv").height() * getZoom()) - 32 - (22 * zoomInit)) / (67 * zoomInit)) * (67 * zoomInit) + 32 + (22 * zoomInit);
        earthToolsBalloon.SetRectSize(earthToolWidth, temHeight);
        earthToolHeightTemp = temHeight;
    } else if (earthToolsBalloon && earthToolHeightTemp < earthToolHeight) {
        earthToolsBalloon.SetRectSize(earthToolWidth, earthToolHeight);
    }
}

//重绘左侧窗体
function resizeLeftPanel() {
    $("#mainDiv").height($(window).height() - headerHeight);
    $("#MapTwo").height($("#mainDiv").height() - ($("#viewpointMain").is(":hidden") ? 0 : 135) - 40);
    $("#id_tree_body").tabs({
        height: $("#id_tree_body").parent().height() - $("#layerHeader").height() - 2
    });
    if ($("#id_left_operator").is(":visible")) {
        $("#id_left_operator").panel({
            height: $(window).height() - headerHeight
        });
    }
}
/**
 * 窗口大小变化视角
 */
window.onresize = function () {
    resizeLeftPanel();
    setToolsIconStatus();
    resizeEarthToolWindow();
}

resizeLeftPanel();
$("#layerTreeDiv").mCustomScrollbar({});
$("#pipelineLayerDiv").mCustomScrollbar({});
$("#id_tree_body").tabs({
    onSelect: function (title, index) {
        if (title == "基础图层") {
            $("#pipelineLayerDiv").mCustomScrollbar("destroy");
            $("#layerTreeDiv").mCustomScrollbar({});
        } else {
            $("#layerTreeDiv").mCustomScrollbar("destroy");
            $("#pipelineLayerDiv").mCustomScrollbar({});
        }
    }
});
/**
 * 关闭整个球的时候需要调用的方法
 */
window.onunload = function () {
    if (Stamp.Tools.legendHtmlBalloons) {//清除图例气泡
        Stamp.Tools.legendHtmlBalloons.DestroyObject();
        Stamp.Tools.legendHtmlBalloons = null;
    }
    if (Stamp.Tools.htmlBalloonMove) {//关闭出图、屏幕截图以及管线更新气泡
        Stamp.Tools.htmlBalloonMove.DestroyObject();
        Stamp.Tools.htmlBalloonMove = null;
    }
    if (top.LayerManagement.htmlBalloon != null) {//关闭详细信息气泡
        top.LayerManagement.htmlBalloon.DestroyObject();
        top.LayerManagement.htmlBalloon = null;
    }
    closeDialog();//关闭左侧面板
    if (htmlBal != null) {//清除两端气泡
        htmlBal.DestroyObject();
        htmlBal = null;
    }
    if (earthToolsBalloon != null) {//清除工具栏气泡
        earthToolsBalloon.DestroyObject();
        earthToolsBalloon = null;
    }
    LayerManagement.clearSearchResult();//清除之前查询或者分析的图层结果
    try {
        if (LayerManagement.earth) {//销毁earth对象
            LayerManagement.earth.style.width = 0;
            LayerManagement.earth.style.height = 0;
            LayerManagement.earth.Suicide();
            LayerManagement.earth = null;
        }
    } catch (e) {

    }
};
/**
 * 设置气泡是否可见
 * @param {Boolean} isVisible [description]
 */
function setBalloonVisible(isVisible){
    if (Stamp.Tools.legendHtmlBalloons) {//图例气泡
        Stamp.Tools.legendHtmlBalloons.SetIsVisible(isVisible);
    }
    if (Stamp.Tools.htmlBalloonMove) {//出图、屏幕截图以及管线更新气泡
        Stamp.Tools.htmlBalloonMove.SetIsVisible(isVisible)
    }
    if (top.LayerManagement.htmlBalloon != null) {//详细信息气泡
        top.LayerManagement.htmlBalloon.SetIsVisible(isVisible);
    }
    if (earthToolsBalloon != null) {//工具栏气泡
        earthToolsBalloon.SetIsVisible(isVisible);
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
 * [设置视点面板是否显示]
 * @param {[Boolean]} ISshow [true:显示,false:不显示]
 */
function setTableView(ISshow) {
    if (ISshow) {
        $("#viewpointMain").show();
        $("#MapTwo").height($("#MapTwo").height() - 135);
    } else {
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

/**
 * [设置左侧图层面板是否显示]
 * @param {[Boolean]} isShow [show:true显示，show:false不显示]
 */
function setLayerShow(isShow) {
    bLayerVisible = isShow;
    if (isShow) {
        $("#leftPanel").show();
        $("#mainEarth").css("margin-left", "255px");
        $("#id_tree_body").height($("#id_left_layerTree").height() - $("#layerHeader").height() - $("#layer_title").height());

        if (dialogId) {
            closeDialog();
        }
    } else {
        if (dialogId) {
            BalloonHtml.setItemStyle("LayerManager");
            bLayerVisible = true;
            closeDialog();
            return;
        }
        $("#leftPanel").hide();
        $("#mainEarth").css("margin-left", "0px");
    }
    var scrollOrder = isShow ? "" : "destroy";//隐藏div的时候将其中的自定义的滚动条去掉,不然会影响性能
    var selectText = $("#id_tree_body .tabs-selected .tabs-title").text();
    if (selectText == "基础图层") {
        $("#layerTreeDiv").mCustomScrollbar(scrollOrder);
    } else {
        $("#pipelineLayerDiv").mCustomScrollbar(scrollOrder);
    }
    setToolsIconStatus();
}

/*-----------------页面布局相关 END----------------------*/

/*
 *模块：参数初始化
 */
/**
 * 查看是否配置了单位、道路、行政区划表
 * @param  {[object]} earth [球对象]
 * @return {[type]}       [description]
 */
var getAreaTable = function (earth) {
    //判断道路、交叉口、行政区、单位
    var roadUrl = top.params.ip + "/dataquery?config=Road&project=" + top.SYSTEMPARAMS.project;
    var cantonUrl = top.params.ip + "/dataquery?config=Canton3&project=" + top.SYSTEMPARAMS.project;
    var companyUrl = top.params.ip + "/dataquery?config=Company&project=" + top.SYSTEMPARAMS.project;
    earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
        if (pRes.ExcuteType == SystemSetting.excuteType) {
            var msg = pRes.AttributeName;
            if (msg) {
                if (msg != "error") {
                    top.areaTable.push("road")
                }
            }
        }
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == SystemSetting.excuteType) {
                var msg = pRes.AttributeName;
                if (msg) {
                    if (msg != "error") {
                        top.areaTable.push("canton");
                    }
                }
            }

            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                if (pRes.ExcuteType == SystemSetting.excuteType) {
                    var msg = pRes.AttributeName;
                    if (msg) {
                        if (msg != "error") {
                            top.areaTable.push("company")
                        }
                    }
                }
                initMenu();
            }
            earth.DatabaseManager.GetXml(companyUrl);
        }
        earth.DatabaseManager.GetXml(cantonUrl);
    }
    earth.DatabaseManager.GetXml(roadUrl);
}

/**
 * 系统初始化
 * @type {Object}
 */
var SystemSetting = {
    earth: null,
    excuteType: 27,//一般调用databasefinished的回调正确值为27

    /**
     * 功能：初始化系统参数对象
     * 参数：无
     * 返回值：无
     */
    initSystemParam: function () {
        var earth = SystemSetting.earth;
        if (SYSTEMPARAMS) {
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
            var isHasPipeline = LayerManagement.hasPipelinelayer(layer);//判断当前工程有没有管线图层

            if (!isHasPipeline) {
                alert("缺少管线数据,系统无法正常运行.");
                return;
            }

            //服务端属性配置开始
            var projectSetting = layer.ProjectSetting;
            var layerLink = projectSetting.PipeConfigFile; //管线配置文件
            var fieldMap = projectSetting.FieldMapFile; //字段映射配置文件
            var valueMap = projectSetting.ValueMapFile; //值域映射文件
            if (fieldMap != "") {
                var filedPath = "";
                if (fieldMap.indexOf("http") >= 0) {
                    filedPath = fieldMap;
                } else {
                    filedPath = "http://" + fieldMap.substr(2).replace("/", "/sde?/") + "_sde";
                }
                SYSTEMPARAMS.pipeFieldMapUrl = filedPath;

                if (chkFile(filedPath)) {
                    //管线字段映射
                    earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                        if (pRes.ExcuteType == SystemSetting.excuteType) {
                            SYSTEMPARAMS.pipeFieldMap = loadXMLStr(pRes.AttributeName); //初始化编码映射文件对象
                        }
                        if (layerLink != "") {
                            var configUrl = "";
                            if (layerLink.indexOf("http") >= 0) {
                                configUrl = layerLink;
                            } else {
                                configUrl = "http://" + layerLink.substr(2).replace("/", "/sde?/") + "_sde";
                            }
                            SYSTEMPARAMS.pipeConfigLink = layerLink;
                            if (chkFile(configUrl)) {
                                //管线配置
                                earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                                    if (pRes.ExcuteType == SystemSetting.excuteType) {
                                        SYSTEMPARAMS.pipeConfigDoc = loadXMLStr(pRes.AttributeName); //初始化管线字段映射文件
                                    }
                                    if (valueMap != "") {
                                        var vPath = "";
                                        if (valueMap.indexOf("http") >= 0) {
                                            vPath = valueMap;
                                        } else {
                                            vPath = "http://" + valueMap.substr(2).replace("/", "/sde?/") + "_sde";
                                        }

                                        if (chkFile(vPath)) {
                                            //valueMap配置
                                            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                                                if (pRes.ExcuteType == SystemSetting.excuteType) {
                                                    SYSTEMPARAMS.valueMap = loadXMLStr(pRes.AttributeName); //初始化编码映射文件对象
                                                }
                                                //自定义字段 fieldMap.config
                                                var pipeConfigLink = SYSTEMPARAMS.pipeConfigLink;
                                                if (pipeConfigLink) {
                                                    var configUrl = "";
                                                    if (pipeConfigLink.indexOf("http") >= 0) {
                                                        configUrl = pipeConfigLink;
                                                    } else {
                                                        configUrl = "http://" + pipeConfigLink.substr(2).replace("/", "/sde?/").replace("PipeConfig.config", "FieldMap.config") + "_sde";
                                                    }

                                                    earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                                                        if (pRes.ExcuteType == SystemSetting.excuteType) {
                                                            var xmlStr = pRes.AttributeName;
                                                            var systemDoc = loadXMLStr(xmlStr);
                                                            if (systemDoc === null) {
                                                                return;
                                                            }
                                                            var jsonData = $.xml2json(systemDoc);
                                                            if (jsonData.LineFieldMap && jsonData.LineFieldMap.UserDefine) {
                                                                var fieldItem = jsonData.LineFieldMap.UserDefine.FieldMapItem;
                                                                var captionAry = [];
                                                                var aliasNameAry = [];
                                                                for (var i = 0; i < fieldItem.length; i++) {
                                                                    var fieldMapitem = fieldItem[i].FieldName;
                                                                    var fieldAliasName = fieldItem[i].FieldAliasName;
                                                                    captionAry.push(fieldMapitem);
                                                                    aliasNameAry.push(fieldAliasName);
                                                                }
                                                                customLineFields.push(captionAry, aliasNameAry);
                                                            }
                                                            if (jsonData.PointFieldMap && jsonData.PointFieldMap.UserDefine) {
                                                                var fieldItem = jsonData.PointFieldMap.UserDefine.FieldMapItem;
                                                                var captionAry = [];
                                                                var aliasNameAry = [];
                                                                for (var i = 0; i < fieldItem.length; i++) {
                                                                    var fieldMapitem = fieldItem[i].FieldName;
                                                                    var fieldAliasName = fieldItem[i].FieldAliasName;
                                                                    captionAry.push(fieldMapitem);
                                                                    aliasNameAry.push(fieldAliasName);
                                                                }
                                                                customPointFields.push(captionAry, aliasNameAry);
                                                            }
                                                        }
                                                        getAreaTable(earth);
                                                    }
                                                    earth.DatabaseManager.GetXml(configUrl);
                                                }
                                            }
                                            earth.DatabaseManager.GetXml(vPath);
                                        }
                                    } else {
                                        alert("缺少管线值域映射文件,部分功能可能无法正常运行.");
                                        SYSTEMPARAMS.valueMap = "";
                                        getAreaTable(earth);
                                    }
                                }
                                earth.DatabaseManager.GetXml(configUrl);
                            }
                        } else {
                            alert("缺少管线编码配置文件,系统无法正常运行.");
                            SYSTEMPARAMS.pipeConfigDoc = "";
                            getAreaTable(earth);
                        }
                    }
                    earth.DatabaseManager.GetXml(filedPath);
                }
            } else {
                alert("缺少管线字段映射文件,系统无法正常运行.");
                SYSTEMPARAMS.pipeFieldMap = "";
                getAreaTable(earth);
            }

            var spatialRef = projectSetting.SpatialRefFile; //空间参考文件

            if (spatialRef != "") {

                var spatialUrl = spatialRef.replace("http:", "").replace("/sde?", "");
                spatialUrl = spatialUrl.substr(0, spatialUrl.length - 4);
                while (spatialUrl.indexOf("/") > -1) {
                    spatialUrl = spatialUrl.replace("/", "\\");
                }
                if (chkFile(spatialUrl)) {
                    SYSTEMPARAMS.pipeDatum = CoordinateTransform.createDatum();
                    earth.Event.OnDocumentUpdate = function (res) {
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
                }
            } else {
                SYSTEMPARAMS.pipeDatum = "";
            }
            //服务端配置属性处理完毕！
            if (layer) {
                var alt = layer.ProjectSetting.UnderRefAlt;
            }
        } else {
            SYSTEMPARAMS.pipeConfigDoc = "";
            SYSTEMPARAMS.pipeDatum = "";
            SYSTEMPARAMS.pipeFieldMap = "";
        }
    },

    /**
     * 功能：初始化系统配置文件内容
     * 参数：无
     * 返回值：初始化的系统配置文件内容
     */
    initSystemConfig: function (id, alt, pos) {
        var configXml = '<xml>';
        if (id) {
            configXml += '<Project>' + id + '</Project>';
        } else {
            configXml += '<Project></Project>';
        }
        configXml += '<ProfileAlt></ProfileAlt>';
        configXml += '<BalloonAlpha></BalloonAlpha>';
        configXml += '<Position></Position></xml>';

        return configXml;
    },

    /**
     * 功能：获取系统配置参数
     * 返回值：系统配置参数
     */
    getSystemConfig: function () {
        var rootPath = SystemSetting.earth.Environment.RootPath + "temp\\SystemConfig";
        var configPath = rootPath + ".xml";
        var configXml = SystemSetting.earth.UserDocument.LoadXmlFile(configPath);
        if (configXml === "" || configXml.indexOf("Position") < 0) {
            configXml = SystemSetting.initSystemConfig();
            SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, configXml);
        }
        var systemDoc = loadXMLStr(configXml);
        var systemJson = $.xml2json(systemDoc);
        if (systemJson == null) {//防止systemconfig.xml格式错误导致系统无法正常运行
            configXml = SystemSetting.initSystemConfig();
            SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, configXml);
            systemDoc = loadXMLStr(configXml);
            systemJson = $.xml2json(systemDoc);
            if(systemJson == null){
                alert("客户端sysytemconfig.xml格式错误");
                return;
            }
        }
        var tempLayer;
        if (systemJson.Project) {//判断保存的xml里面的工程是否存在
            tempLayer = SystemSetting.earth.LayerManager.GetLayerByGUID(systemJson.Project);
            if (tempLayer) {
                var isHasPipeline = LayerManagement.hasPipelinelayer(tempLayer);//判断当前工程有没有管线图层
                if (!isHasPipeline) {
                    tempLayer = null;
                }
            }
        }
        if (!tempLayer || systemJson.Project == "" || systemJson.Project.length != 36) { //如果工程不存在或者之前选择的不是管线工程，默认选第一个
            var pipeProjArr = LayerManagement.initProjectList();
            if (pipeProjArr.length > 0) {
                var obj = {
                    ip: params.ip,
                    project: pipeProjArr[0].id
                };
                SystemSetting.earth.UserDocument.DeleteXmlFile(configPath);
                var newXml = SystemSetting.initSystemConfig(pipeProjArr[0].id);
                SystemSetting.earth.UserDocument.SaveXmlFile(rootPath, newXml);

                systemDoc = loadXMLStr(newXml);
                systemJson = $.xml2json(systemDoc);
            } else {
                alert("缺少管线数据,请配置再使用管线系统");
                return;
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
     * 功能：设置系统配置参数
     * 参数：systemData-系统配置参数
     * 返回值：无
     */
    setSystemConfig: function (systemData) {
        var rootPath = SystemSetting.earth.Environment.RootPath + "temp\\SystemConfig";
        var configPath = rootPath + ".xml";
        var configXml = SystemSetting.earth.UserDocument.LoadXmlFile(configPath);
        configXml = SystemSetting.initSystemConfig();
        var systemDoc = loadXMLStr(configXml);
        var root = systemDoc.documentElement;
        (root.getElementsByTagName("Project")[0]).text = systemData.project;
        (root.getElementsByTagName("ProfileAlt")[0]).text = systemData.profileAlt == "1" ? "1" : "0";
        (root.getElementsByTagName("Position")[0]).text = systemData.Position;
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

var chkFile = function (fileURL) {
    //Todo:暂时不能直接判断是否存在,直接返回true
    return true;
}

//-----------------------------------------------------------------
//--坐标转换对象创建 - 开始
//-----------------------------------------------------------------
var CoordinateTransform = {
    sysDatum: null, //系统内部的坐标转换对象

    /**
     * 功能：获取系统内部的坐标转换对象
     */
    getSystemDatum: function () {
        if (this.sysDatum == null) {
            this.sysDatum = this.createDatum();
        }
        return this.sysDatum;
    },
    getRootPath: function () {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return (localhost + projectName);
    },
    /**
     * 功能：创建空间坐标转换对象
     */
    createDatum: function () {

        var projectId = SYSTEMPARAMS.project;
        var projLayer = SystemSetting.earth.LayerManager.GetLayerByGUID(projectId);
        var spatialUrl = projLayer.ProjectSetting.SpatialRefFile;
        if (this.sysDatum) {
            return this.sysDatum;
        }
        var filePath = SystemSetting.earth.Environment.RootPath + "\\temp\\spatialFile";
        SystemSetting.earth.UserDocument.SaveFile(spatialUrl, "spatialFile");//适配Windows服务器不能访问共享目录,直接下载
        var dataProcess = top.getDataProcessIndex();
        dataProcess.Load();
        var spatial = dataProcess.CoordFactory.CreateSpatialRef();
        spatial.InitFromFile(filePath);
        SystemSetting.earth.UserDocument.DeleteFile(filePath);
        var datum = dataProcess.CoordFactory.CreateDatum();
        datum.Init(spatial);
        this.sysDatum = datum;
        return datum;
    }
};

