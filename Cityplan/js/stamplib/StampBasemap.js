/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：三维球加载及与球相关的一些方法
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

/**
 * 加载三维球
 * @param  {[type]} earthObj [球对象]
 * @param  {[type]} screen   [第一个数据源data.data:从0开始]
 * @return {[type]}          [无]
 */
function loadEarth(earthObj, screen){
    var stampConfig = '<?xml version="1.0" encoding="gbk"?>';
    stampConfig += '<xml>';
    stampConfig += '<Config>' + screen + '</Config>';
    stampConfig += '<UserName>' + STAMP_config.server.username + '</UserName>';
    stampConfig += '<PassWord>' + STAMP_config.server.password + '</PassWord>';
    stampConfig += '<Token>' + STAMP_config.server.token + '</Token>';
    stampConfig += '</xml>';
    earthObj.Load_s(STAMP_config.server.ip, stampConfig);
}

/**
 * 三维地球加载的入口
 */
$(document).ready(function() {
    var ieVersion = window.navigator.platform;
    var stampCAB = 'codebase="stamp/stamp32.CAB#version=4,1,1,1"'; //32位cab包
    if (ieVersion == "Win64") {
        stampCAB = 'codebase="stamp/stamp64.CAB#version=4,1,1,1"'; //64位cab包
    }

    $("#earthDiv").html('<object id="seearth" ' +
        'classid="clsid:EA3EA17C-5724-4104-94D8-4EECBD352964" ' +
        'data="data:application/x-oleobject;base64,Xy0TLBTXH0q8GKFyFzl3vgAIAADYEwAA2BMAAA==" ' +
        'width="100%" height="100%"></object>');
    if(seearth == undefined || seearth.Event == undefined){
        alert("三维地球加载失败，请检查客户端插件是否安装正常，ActiveX控件加载是否设置为允许！");
        return;
    }
    seearth.Event.OnCreateEarth = function() {
        loadEarth(seearth, STAMP_config.server.screen);
        var height = $(document).height() - 4;
        Stamp.Tools.Earth = seearth;
        LayerManagement.earth = seearth;
        SystemSetting.earth = seearth;
        earth = seearth;
        LayerManagement.earthArray.push(seearth);
        seearth.Event.OnDocumentChanged = function(type, guid) {
            console.log(type)
            if (type === 1) {
                //TODO:initialize your app
                $("#loading").remove();
                $("#loading-mask").remove();
                init();
                seearth.Environment.Thumbnail = false;
                seearth.Environment.TerrainTransparency = 255;  //球体透明度
            }else if(type == 0){
                alert("请检查是否启用了服务权限控制？如已启用，需要开启登录验证。");
            }
        };
    };
});

var planArr = [];//方案数组-方案比选时用到
var bollonArr = [];//气泡数组
var curPlanYDName = "";//当前方案用地名称

/**
 * 创建三维球
 * @param  {[type]}  data        [球数据]
 * @param  {[type]}  is2d        [是否二维]
 * @param  {[type]}  projManager [方案管理工具对象]
 * @param  {[type]}  projectId   [项目ID]
 * @param  {Boolean} isThree     [是否三屏]
 * @return {[type]}              [description]
 */
function createEarth(data, is2d, projManager, projectId, isThree) {
    $("#earthDiv1").html('<object id="seearth1" ' +
        'classid="clsid:EA3EA17C-5724-4104-94D8-4EECBD352964" ' +
        'data="data:application/x-oleobject;base64,Xy0TLBTXH0q8GKFyFzl3vgAIAADYEwAA2BMAAA==" ' +
        'width="100%" height="100%"></object>');

    seearth1.Event.OnCreateEarth = function (pval) {
        seearth1.Event.OnCreateEarth = function () {};
        LayerManagement.earthArray.push(seearth1);
        seearth1.Event.OnDocumentChanged = function (){
            seearth1.Event.OnDocumentChanged = function (){};
            if (is2d) {
                setSync(true);
                LayerManagement.earthArray[0].Environment.Mode2DEnable = false;
                LayerManagement.earthArray[1].Environment.Mode2DEnable = true;
            } else {
                if(isThree){ //创建第三个球
                    createEarth2(data, projManager, projectId);
                }
                // 比选时各球图层显隐保持一致 update at 2015-11-20 21:45:14
                copyLayerVisible(null, seearth1, seearth);

                //这里面就可以获取到earth.LayerManager 及其下属的属性与方法
                //控制数据显示
                if(data && data.length){
                    //searth加载数据
                    var firstId = data[0].id;
                    var secordId = data[1].id;
                    var xzId = parcelLayerGuid2;
                    if(firstId == xzId){
                        //第一个是现状
                    }else if(secordId == xzId){
                        //加载第一个方案 firstId
                        setTimeout(function(){
                            projManager.showAll(projectId, firstId, true, true, false, false, false);
                        },100);
                        //第二个是现状 secordId 需要把现状数据库图层的都加上即可
                        projManager.loadXZLayers(true, seearth1);
                    }else{
                        //两个都是方案
                        projManager.showAll(projectId, firstId, true, true, false, false, false);
                        //判断主球是否做了地形平整，双屏时需要保持一致
                        if(top.g_currTempLayer != null){
                            //表明主球中做了地形平整
                            seearth1.AttachObject(top.g_currTempLayer);
                        }
                        setTimeout(function(){
                            //earth1 加载方案2图层
                            var layerIDs = projManager.getLayerIdsByPlanId(secordId);
                            projManager.applyRecords(true, layerIDs, seearth1, projManager.parcelLayerGuid2, false);
                        },200);
                    }
                }

                //同步视角
                var pose = getPose(seearth);
                seearth1.GlobeObserver.GotoLookat(pose.longitude, pose.latitude, pose.altitude, pose.heading, pose.tilt, pose.roll, 0);
                bMultiScreenState = true;
            }
        };

        loadEarth(seearth1, STAMP_config.server.screen);
    };
}

/**
 * 创建第三个球-三屏时用到
 * @param  {[type]} data        [数据]
 * @param  {[type]}  projManager [方案管理工具对象]
 * @param  {[type]}  projectId   [项目ID]
 * @return {[type]}             [description]
 */
function createEarth2(data, projManager, projectId){
    $("#earthDiv2").html('<object id="seearth2" ' +
        'classid="clsid:EA3EA17C-5724-4104-94D8-4EECBD352964" ' +
        'data="data:application/x-oleobject;base64,Xy0TLBTXH0q8GKFyFzl3vgAIAADYEwAA2BMAAA==" ' +
        'width="100%" height="100%"></object>');

    seearth2.Event.OnCreateEarth = function (pval) {
        seearth2.Event.OnCreateEarth = function () {};
        LayerManagement.earthArray.push(seearth2);
        seearth2.Event.OnDocumentChanged = function (){
            seearth2.Event.OnDocumentChanged = function (){};
            // 比选时各球图层显隐保持一致 update at 2015-11-20 21:45:14
            copyLayerVisible(null, seearth2, seearth);

            //这里面就可以获取到earth.LayerManager 及其下属的属性与方法
            if(data && data.length){
                //searth加载数据
                var thirdId = data[2].id;
                var xzId = parcelLayerGuid2;
                if(thirdId == xzId){
                    //说明是现状
                    projManager.loadXZLayers(true, seearth2);
                }else{
                    //说明是方案
                    setTimeout(function(){
                        //earth1 加载方案2图层
                        var layerIDs = projManager.getLayerIdsByPlanId(thirdId);
                    },400);
                }
            }
            var pose = getPose(seearth);
            seearth2.GlobeObserver.GotoLookat(pose.longitude, pose.latitude, pose.altitude, pose.heading, pose.tilt, pose.roll, 0);
        };
        loadEarth(seearth2, STAMP_config.server.screen);
    };
}

/**
 * 卸载球
 * @return {[type]} [description]
 */
function unloadEarth() {
    if(dialogId){//为了解决如果有详细信息气泡时刷新ie崩溃，如果有左侧面板则先关闭左侧面板
        closeDialog();
    }
    if (LayerManagement.htmlBalloon != null) {
        LayerManagement.htmlBalloon.DestroyObject();
        LayerManagement.htmlBalloon = null;
    }
    hideBollon();
    if(queryHtmlBalloon != null){
        queryHtmlBalloon.DestroyObject();
        queryHtmlBalloon = null;
    }
    if(earthToolsBalloon != null){//工具栏气泡
        earthToolsBalloon.DestroyObject();
        earthToolsBalloon = null;
    }
    if(STAMP.EditTool.htmlBalloonMove){//编辑模块气泡
        STAMP.EditTool.htmlBalloonMove.DestroyObject();
        STAMP.EditTool.htmlBalloonMove = null;
    }
    if(htmlBalloonMove){//分析模块气泡
        htmlBalloonMove.DestroyObject();
        htmlBalloonMove = null;
    }
    if(Stamp.Tools.picturesBalloons){//常用工具气泡
        Stamp.Tools.picturesBalloons.DestroyObject();
        Stamp.Tools.picturesBalloons = null;
    }
    LayerManagement.clearSearchResult();
    try{
        if(seearth){
            seearth.style.width = 0;
            seearth.style.height = 0;
            seearth.Suicide();
            seearth = null;
        }
    }catch(e){

    }
}

/**
 * 多屏显示
 * @param {[type]} id          [菜单ID]
 * @param {[type]} type        [多屏类型]
 * @param {[type]} data        [方案数据]
 * @param  {[type]}  projManager [方案管理工具对象]
 * @param  {[type]}  projectId   [项目ID]
 */
function setScreenShow(id, type, data, projManager, projectId) {
    if(type == "3d") { //一屏-三维
        if($("#" + id).hasClass("selected"))
            $("#" + id).removeClass("selected");
        setScreen(1, "");
        Tools.cancelDisabled(top.disabledButtonArr);
        $("#earthDiv").show();
        $("#earthDiv").css("width", "100%");
    } else if(type == "3d2d") {
        if($("#" + id).hasClass("selected")) { //一屏-三维
            $("#" + id).removeClass("selected");
            setScreen(1, "", false);
            Tools.cancelDisabled(top.disabledButtonArr);
            $("#earthDiv").css("width", "100%");
        } else { //二屏-三维二维
            $("#" + id).addClass("selected");
            setScreen(2, "", true);
            Tools.disabledAll("dimenLink");
            $("#earthDiv").css("width", "50%");
            $("#earthDiv1").css("width", "50%");
        }
    } else if(type == "3d3d") { //二屏-三维三维
        setScreen(2, data, false, projManager, projectId);
        Tools.disabledAll("");
        $("#earthDiv").css("width", "50%");
        $("#earthDiv1").css("width", "50%");
    } else if(type == "2d") {
        if($("#" + id).hasClass("selected")) { //一屏-三维
            $("#" + id).removeClass("selected");
            setScreen(1, "", false);
            Tools.cancelDisabled(top.disabledButtonArr);
            $("#earthDiv").css("width", "100%");
        } else { //一屏-二维
            $("#" + id).addClass("selected");
            setScreen(2, "", true);
            $("#earthDiv1").css("width", "100%");
            $("#earthDiv").hide();
            Tools.disabledAll("dimenLink");
        }
    } else if(type == "3d3d3d") { //三屏-三维三维三维
        setScreen(3, data, false, projManager, projectId);
        Tools.disabledAll("");
        $("#earthDiv").css("width", "33.3%");
        $("#earthDiv1").css("width", "33.3%");
        $("#earthDiv2").css("width", "33.3%");
    }
}

/**
 * 设置多屏
 * @param {[type]} n           [屏幕数]
 * @param {[type]} data        [方案数据]
 * @param {[type]} is2d        [是否二维]
 * @param  {[type]}  projManager [方案管理工具对象]
 * @param  {[type]}  projectId   [项目ID]
 */
function setScreen(n, data, is2d, projManager, projectId) {
    planArr = data;
    if (n == 1) {
        $("#earthDiv").removeClass("half");
        $("#earthDiv").addClass("whole");

        $("#earthDiv1").removeClass("half");
        $("#earthDiv1").addClass("hide");

        $("#earthDiv2").removeClass("three");
        $("#earthDiv2").addClass("hide");

        for (var i = LayerManagement.earthArray.length - 1; i > 0; i--) {
            if(LayerManagement.earthArray[i]){
                LayerManagement.earthArray[i].Suicide();
                LayerManagement.earthArray.pop();
            }
        }

        if(bollonArr&&bollonArr.length>0){
            for(var i=0;i<bollonArr.length;i++){
                if( bollonArr[i].Guid!=""){
                    bollonArr[i].DestroyObject();
                }
            }
        }
        bollonArr = [];

        $("#earthDiv1").empty();
        $("#earthDiv2").empty();
    } else if (n == 2) {
        $("#earthDiv").removeClass("whole");
        $("#earthDiv").addClass("half");

        $("#earthDiv1").removeClass("hide");
        $("#earthDiv1").addClass("half");

        $("#earthDiv2").removeClass("three");
        $("#earthDiv2").addClass("hide");

        $("#earthDiv2").empty();
        createEarth(data, is2d, projManager, projectId, false);
    } else if(n == 3) {
        $("#earthDiv").removeClass("whole");
        $("#earthDiv").addClass("three");

        $("#earthDiv1").removeClass("hide");
        $("#earthDiv1").addClass("three");

        $("#earthDiv2").removeClass("hide");
        $("#earthDiv2").addClass("three");

        createEarth(data, is2d, projManager, projectId, true);
    }
}

/**
 * 比选时各球图层显隐保持一致
 * @param  {[type]} layer    [图层]
 * @param  {[type]} desEarth [目标球]
 * @param  {[type]} srcEarth [源球]
 * @return {[type]}          [description]
 */
function copyLayerVisible(layer, desEarth, srcEarth){
    var a = [];
    var _v = function(layer, seearth, isGet){
        if(!layer){
            layer = seearth.LayerManager.LayerList;
        }
        if(isGet){
            a.push(layer.Visibility);
            if(layer.GetChildCount() > 0){
                for(var i = 0;i < layer.GetChildCount();i++){
                    _v(layer.GetChildAt(i), seearth, isGet);
                }
            }
        }else{
            var v = a.shift();
            layer.Visibility = v;
            if(layer.GetChildCount() > 0){
                for(var i = 0;i < layer.GetChildCount();i++){
                    _v(layer.GetChildAt(i), seearth, isGet);
                }
            }
        }

    }
    _v(null, srcEarth, true);
    _v(null, desEarth, false);
}

/**
 * 指标对比-方案比选时
 * @param  {[type]} tag      [打开或关闭]
 * @param  {[type]} planData [方案数据]
 * @return {[type]}          [description]
 */
function showIndex(tag, planData){
    if(tag){
        for(var i=0;i<planArr.length;i++){
            showPlanData(planArr[i],LayerManagement.earthArray[i],planData);
        }
    } else{
        if(bollonArr&&bollonArr.length>0){
            for(var i=0;i<bollonArr.length;i++){
                if( bollonArr[i].Guid!=""){
                    bollonArr[i].DestroyObject();
                }

            }
        }
        bollonArr = [];
    }
}

/*功能：设置当前方案用地，修改所有球的方案指标数据
 *@param ydName 方案指标
 *@return 无
 */
function setCurPlanYDName(ydName){
    if(ydName == undefined || ydName == ""){
        return;
    }
    for(var i = 0; i < bollonArr.length; i++){
        bollonArr[i].InvokeScript("changeSelectYDName", ydName);
    }
}

/*显示方案指标
 *@param data 方案ID和NAME数据
 *@param seearth 三维球
 *@param planData 方案指标数据
*/
function showPlanData(data, seearth, planData){
    var path = location.href.substring(0, location.href.lastIndexOf("/"));
    var url = path + "/html/analysis/planData.html";
    var htmlBalloon = null;
    var guid = seearth.Factory.CreateGuid();
    htmlBalloon = seearth.Factory.CreateHtmlBalloon(guid, "balloon");
    htmlBalloon.SetScreenLocation(0,0);
    htmlBalloon.SetRectSize(300,305);
    htmlBalloon.SetIsAddMargin(true);
    htmlBalloon.SetIsAddBackgroundImage(true);
    htmlBalloon.ShowNavigate(url);
    bollonArr.push(htmlBalloon);
    seearth.Event.OnDocumentReadyCompleted = function (htmlId){
        setTimeout(function(){
            if(planData && planData.length > 0){
                curPlanYDName = planData[0].plan["CPPLAN.YDNAME"];
            }
            var paramValue = {};
            paramValue.planData = planData;
            paramValue.curPlanYDName = curPlanYDName;
            paramValue.setCurPlanYDName = setCurPlanYDName;
            paramValue.id = data.id;
            if(bollonArr.length > 0){
                for(var i = 0; i < bollonArr.length; i++){
                    if(bollonArr[i] != null && bollonArr[i].Guid == htmlId){
                        bollonArr[i].InvokeScript("setTranScroll", paramValue);
                    }
                }
            }
        },100);
    };
}

/**
 * 设置联动
 * @param bSync 等于true时表示联动
 */
function setSync(bSync) {
    var i = 0;
    var emptyFunction = function() {};
    if (bSync) { //联动
        while (i < LayerManagement.earthArray.length) {
            LayerManagement.earthArray[i].Event.OnLBDown = setFocus(i); // 注册每个球的OnLBDown事件
            LayerManagement.earthArray[i].Event.OnMBDown = setFocus(i); // 鼠标中键按下后
            i += 1;
        }
        gotoPose(0)(); // 将其他屏定位到第一屏的位置
    } else {
        while (i < LayerManagement.earthArray.length) { // 注销每个球绑定的事件
            LayerManagement.earthArray[i].Event.OnLBDown = emptyFunction;
            LayerManagement.earthArray[i].Event.OnMBDown = emptyFunction; // 鼠标中键按下后
            LayerManagement.earthArray[i].Event.OnObserverChanged = emptyFunction;
            i += 1;
        }
        gotoPose(0)(); // 将其他屏定位到第一屏的位置
    }
}

/**
 * 设置联动
 * 注册当前球的OnObserverChanged事件
 * 注销其他球的OnObserverChanged事件，给其他球的OnLBDown绑定事件，似的在左键点击时称为当前球
 */
function setFocus(i) {
    return function() {
        LayerManagement.earthArray[i].Event.OnObserverChanged = gotoPose(i);
        for (var j = 0; j < LayerManagement.earthArray.length; j++) {
            if (i != j) {
                LayerManagement.earthArray[j].Event.OnObserverChanged = function() {};
                LayerManagement.earthArray[j].Event.OnLBDown = setFocus(j);
                LayerManagement.earthArray[j].Event.OnMBDown = setFocus(j);
            }
        }
    };
}

/**
 * 将所有非主球都定位到主球i的当前位置
 * @param i
 * @return {Function}
 */
function gotoPose(i) {
    setTimeout(function() {
        var pose = getPose(LayerManagement.earthArray[i]);
        var j = 0;
        while (j < LayerManagement.earthArray.length) {
            if (j != i) {
                LayerManagement.earthArray[j].GlobeObserver.GotoLookat(pose.longitude, pose.latitude, pose.altitude,
                    pose.heading, pose.tilt, pose.roll, pose.range);
            }
            j += 1;
        }
        setFocus(i);
    }, 500);
    return function() {
        var pose = getPose(LayerManagement.earthArray[i]);
        var j = 0;
        while (j < LayerManagement.earthArray.length) {
            if (j != i) {
                LayerManagement.earthArray[j].GlobeObserver.GotoLookat(pose.longitude, pose.latitude, pose.altitude,
                    pose.heading, pose.tilt, pose.roll, pose.range);
            }
            j += 1;
        }
        setFocus(i);
    }
}

/**
 * 获得earthObj的当前位置
 * @param earthObj
 * @return {Object}
 */
function getPose(earthObj) {
    var data = {};
    if (earthObj && earthObj.GlobeObserver && earthObj.GlobeObserver.Pose && earthObj.GlobeObserver.TargetPose) {
        data.longitude = earthObj.GlobeObserver.TargetPose.Longitude;
        data.latitude = earthObj.GlobeObserver.TargetPose.Latitude;
        data.altitude = earthObj.GlobeObserver.TargetPose.Altitude;
        data.heading = earthObj.GlobeObserver.Pose.heading;
        data.tilt = earthObj.GlobeObserver.Pose.tilt;
        data.roll = earthObj.GlobeObserver.Pose.roll;
        data.range = earthObj.GlobeObserver.Pose.range;
    }
    return data;
}

/**
 * 直接选择其他功能中的选取模型功能，会导致OnPickObject..等事件重复调用两次
 * @return {[type]} [description]
 */
var clearLRBDownEvent = function() {
    var earth = seearth;
    earth.Event.OnPickObjectEx = function() {};
    earth.Event.OnPickObject = function() {};
    earth.Event.OnLBDown = function() {};
    earth.focus();
}

/**
 * 是否显示二位地图
 * @param  {[type]}  show     [是否显示]
 * @param  {[type]}  earthArr [三维球]
 * @return {Boolean}          [description]
 */
var isShowMap = function(show, earthArr) {
    var earth = earthArr;
    var rootLayerList = earth.LayerManager.LayerList;
    var projectCount = rootLayerList.GetChildCount();
    for (var i = 0; i < projectCount; i++) {
        var childLayer = rootLayerList.GetChildAt(i);
        var layerType = childLayer.LayerType;
        if (layerType === "Project") {
            var projectId = childLayer.Guid;
            var projectName = childLayer.Name;
            var chlildrenCount = childLayer.GetChildCount();
            for (var x = 0; x < chlildrenCount; x++) {
                var mapchildLayer = childLayer.GetChildAt(x);
                var maplayerType = mapchildLayer.LayerType;
                if (maplayerType != "Folder" && maplayerType != null && (maplayerType.toLowerCase() === "map" || maplayerType.toLowerCase() === "wms")) {
                    var layer = earthArr.LayerManager.GetLayerByGUID(mapchildLayer.Guid);
                    layer.Visibility = show;
                    var childWmsLayerCount = mapchildLayer.GetChildCount();
                    if (childWmsLayerCount > 0) {
                        for (var k = 0; k < childWmsLayerCount; k++) {
                            var childWmsLayer = mapchildLayer.GetChildAt(k);
                            var wmslayerType = childWmsLayer.LayerType;
                            if (wmslayerType != null && (wmslayerType.toLowerCase() === "map" || wmslayerType.toLowerCase() === "wms")) {
                                var layerWms = earthArr.LayerManager.GetLayerByGUID(childWmsLayer.Guid);
                                if (layerWms) {
                                    layerWms.Visibility = show;
                                }
                            }
                        }
                    }
                }
                if (maplayerType === "Folder") {
                    var threeLayerCount = mapchildLayer.GetChildCount();
                    for (var s = 0; s < threeLayerCount; s++) {
                        var threechildLayer = mapchildLayer.GetChildAt(s);
                        var threemaplayerType = threechildLayer.LayerType;
                        if (threemaplayerType != null && (threemaplayerType.toLowerCase() === "map" || threemaplayerType.toLowerCase() === "wms")) {
                            var layer = earthArr.LayerManager.GetLayerByGUID(threechildLayer.Guid);
                            if (layer) {
                                layer.Visibility = show;
                            }
                        }
                    }
                }
            }
        }
    }
}
