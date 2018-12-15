/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：三维球加载
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
 /**
  * 文档加载完成之后加载三维球
  */
$(document).ready(function(){
    loadEarthData(params.screen); 
});

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
    stampConfig += '<UserName>' + params.username + '</UserName>';
    stampConfig += '<PassWord>' + params.password + '</PassWord>';
    stampConfig += '<Token>' + params.token + '</Token>';
    stampConfig += '</xml>';
    earthObj.Load_s(params.ip, stampConfig);
}

/**
 * 加载data.data
 * @param  {[number]} screen [第几份数据,对应stampmanager的data.data的配置,从0开始]
 */
function loadEarthData(screen){
    $("#earthDiv").html("");
    var ieVersion = window.navigator.platform;
    var stampCAB = 'codebase="stamp/stamp32.CAB#version=3,1,1,1"'; //32位cab包，版本：4.1客户端
    if (ieVersion == "Win64") {
        stampCAB = 'codebase="stamp/stamp64.CAB#version=3,1,1,1"'; //64位cab包，版本：4.1客户端
    }
    $("#earthDiv").html('<object id="seearth" ' +
        'classid="clsid:EA3EA17C-5724-4104-94D8-4EECBD352964" ' +
        'data="data:application/x-oleobject;base64,Xy0TLBTXH0q8GKFyFzl3vgAIAADYEwAA2BMAAA==" ' +stampCAB+
        'width="100%" height="100%"></object>');

    if(seearth == undefined || seearth.Event == undefined){
        alert("三维地球加载失败，请检查客户端插件是否安装正常，ActiveX控件加载是否设置为允许！");
        return;
    }
    /**
     * 三维球创建完成回调
     */
    seearth.Event.OnCreateEarth = function () {
        loadEarth(seearth, screen);
        top.loadData = screen;
        var height = $(document).height()-4;
        Stamp.Tools.Earth = seearth;
        LayerManagement.earth = seearth;
        SystemSetting.earth = seearth;
        LayerManagement.earthArray.push(seearth);
        //右键事件注销
        seearth.oncontextmenu = function (){
            return false;
        }
        seearth.Event.OnDocumentChanged = function(type,guid){
            if(type == 1){
                var transparency = parseInt(params.transparency) >= 0? parseInt(params.transparency) : 100;
                seearth.Environment.TerrainTransparency = transparency/100*255;
                $("#loading").remove();
                $("#loading-mask").remove();
                top.init();
                seearth.Environment.Thumbnail = false;
            }else if(type == 0){
                alert("请检查是否启用了服务权限控制");
            }
        };
    };
}



/**
 * 设置多屏
 * @param n 屏幕数
 */
function setScreen(n,data,is2d) {
    if (n == 1) {
        $("#earthDiv").removeClass("half");
        $("#earthDiv").addClass("whole");
        $("#earthDiv1").addClass("hide");
        $("#earthDiv1").removeClass("half");
        for (var i = LayerManagement.earthArray.length - 1; i > 0; i--) {
            LayerManagement.earthArray[i].Suicide();
            LayerManagement.earthArray.pop();
        }
        $("#earthDiv1").empty();
    } else if (n == 2) {
        $("#earthDiv").removeClass("whole");
        $("#earthDiv").addClass("half");
        $("#earthDiv1").addClass("half");
        $("#earthDiv1").removeClass("hide");
        createEarth(data,is2d);
    }
}

/**
 * 设置联动
 * @param bSync 等于true时表示联动
 */
function setSync(bSync) {
    var i = 0;
    var emptyFunction = function () {
    };
    if (bSync) {        //联动
        while (i < LayerManagement.earthArray.length) {
            LayerManagement.earthArray[i].Event.OnLBDown = setFocus(i);    // 注册每个球的OnLBDown事件
            LayerManagement.earthArray[i].Event.OnMBDown = setFocus(i);    // 鼠标中键按下后
            i += 1;
        }
        gotoPose(0)();    // 将其他屏定位到第一屏的位置
    } else {
        while (i < LayerManagement.earthArray.length) {      // 注销每个球绑定的事件
            LayerManagement.earthArray[i].Event.OnLBDown = emptyFunction;
            LayerManagement.earthArray[i].Event.OnMBDown = emptyFunction;// 鼠标中键按下后
            LayerManagement.earthArray[i].Event.OnObserverChanged = emptyFunction;
            i += 1;
        }
        gotoPose(0)();    // 将其他屏定位到第一屏的位置
    }
}
/**
 * 设置联动
 * 注册当前球的OnObserverChanged事件
 * 注销其他球的OnObserverChanged事件，给其他球的OnLBDown绑定事件，似的在左键点击时称为当前球
 */
function setFocus(i) {
    return function () {
        LayerManagement.earthArray[i].Event.OnObserverChanged = gotoPose(i);
        for (var j = 0; j < LayerManagement.earthArray.length; j++) {
            if (i != j) {
                LayerManagement.earthArray[j].Event.OnObserverChanged = function () {
                };
                LayerManagement.earthArray[j].Event.OnLBDown = setFocus(j);
                LayerManagement.earthArray[j].Event.OnMBDown = setFocus(j);
            }
        }
    };
}
function getEarths(){
    return  seearth;
}

/**
 * 将所有非主球都定位到主球i的当前位置
 * @param i
 * @return {Function}
 */
function gotoPose(i) {
    setTimeout(  function () {
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
    },500);
    return function () {
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

//直接选择其他功能中的选取模型功能，会导致OnPickObject..等事件重复调用两次
var clearLRBDownEvent = function() {
    var earth = seearth;
    earth.Event.OnPickObjectEx = function() {};
    earth.Event.OnPickObject = function() {};
    earth.Event.OnLBDown = function() {};
    earth.focus();
}

/**
 * 根据id和div容器创建Earth对象，并返回创建的对象
 * @param id
 * @param div
 */
function createEarth(data,is2d) {
    $("#earthDiv1").html('<object id="seearth1" ' +
                    'classid="clsid:EA3EA17C-5724-4104-94D8-4EECBD352964" ' +
                    'data="data:application/x-oleobject;base64,Xy0TLBTXH0q8GKFyFzl3vgAIAADYEwAA2BMAAA==" ' +
                    'width="100%" height="100%"></object>');

    seearth1.Event.OnCreateEarth = function (pval) {
        seearth1.Event.OnCreateEarth = function () {};
        LayerManagement.earthArray.push(seearth1);
        if(data){
            loadEarth(seearth1, data);
        }else{
            loadEarth(seearth1, params.screen);
        }
        
        seearth1.Event.OnDocumentChanged = function (){
            if(is2d){
                setSync(true);
                LayerManagement.earthArray[0].Environment.Mode2DEnable = false;
                LayerManagement.earthArray[1].Environment.Mode2DEnable = true;
                isShowMap(true,LayerManagement.earthArray[1]);
                isShowMap(false,LayerManagement.earthArray[0]);
            }
            seearth1.Event.OnDocumentChanged = function (){};
        };
    };
}

//是否显示二位地图
var isShowMap = function(show,earthArr){
    var earth = seearth;
    var layerTree = $.fn.zTree.getZTreeObj("layerTree");
    var rootLayerList = earth.LayerManager.LayerList;
    var projectCount = rootLayerList.GetChildCount();
    for(var i = 0; i < projectCount; i++){
        var childLayer = rootLayerList.GetChildAt(i);
        var layerType = childLayer.LayerType;
        if(layerType === "Project"){  //17
            var projectId = childLayer.Guid;
            var projectName = childLayer.Name;
            var chlildrenCount = childLayer.GetChildCount();
            for(var x=0;x<chlildrenCount;x++){
                var mapchildLayer = childLayer.GetChildAt(x);
                var maplayerType = mapchildLayer.LayerType;
                if(maplayerType != "Folder" && maplayerType != null && (maplayerType.toLowerCase() === "map" || maplayerType.toLowerCase() === "wms")){
                    var treeNode = layerTree.getNodeByParam("id",mapchildLayer.Guid);
                    layerTree.checkNode(treeNode, show, null);
                    var layer = earthArr.LayerManager.GetLayerByGUID(mapchildLayer.Guid);
                    layer.Visibility = show;
                    var childWmsLayerCount = mapchildLayer.GetChildCount();
                    if(childWmsLayerCount>0){
                        for(var k=0;k<childWmsLayerCount;k++){
                            var childWmsLayer = mapchildLayer.GetChildAt(k);
                            var wmslayerType = childWmsLayer.LayerType;
                            if(wmslayerType != null && (wmslayerType.toLowerCase() === "map" || wmslayerType.toLowerCase() === "wms")){
                                var treeNodeWms = layerTree.getNodeByParam("id",childWmsLayer.Guid);
                                layerTree.checkNode(treeNodeWms, show, null);
                                var layerWms = earthArr.LayerManager.GetLayerByGUID(childWmsLayer.Guid);
                                if(layerWms){
                                    layerWms.Visibility = show;
                                }
                            }
                        }
                        

                    }
                }
                if(maplayerType === "Folder"){
                    var threeLayerCount = mapchildLayer.GetChildCount();
                    for(var s=0;s<threeLayerCount;s++){
                        var threechildLayer = mapchildLayer.GetChildAt(s);
                        var threemaplayerType = threechildLayer.LayerType;
                        if(threemaplayerType != null && (threemaplayerType.toLowerCase() === "map" || threemaplayerType.toLowerCase() === "wms")){
                            var treeNode = layerTree.getNodeByParam("id",threechildLayer.Guid);
                            layerTree.checkNode(treeNode, show, null);
                            var layer = earthArr.LayerManager.GetLayerByGUID(threechildLayer.Guid);
                            if(layer)            {
                                layer.Visibility = show;
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * 剖切分析
 */
var ClipScene = function(){
    seearth.Event.OnMeasureFinish = function (result, type) {
        seearth.Event.OnMeasureFinish = function () { };
        seearth.Measure.Clear();
    };
    seearth.Measure.ClipScene(true,31);//垂直,31代表针对所有模型
}
