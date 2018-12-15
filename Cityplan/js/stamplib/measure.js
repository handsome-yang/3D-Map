/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：量算模块
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var bolonArr = [];
var resultRes = null;
/**
 * 清除测量结果
 * @return {[type]} [description]
 */
var clearMeasureResult = function() {
    top.LayerManagement.earth.Measure.Clear();
};

/**
 * 清除上一次测量结果
 * @return {[type]} [description]
 */
var clearLastMeasureResult = function () {
    hideBollon();
    clearMeasureResult();
    if (resultRes) {
        resultRes.ClearRes();
        top.LayerManagement.earth.ShapeCreator.Clear();
    }
};

/**
 * 显示测量结果
 * @param  {[type]} result [测量结果]
 * @param  {[type]} type   [测量类型(1为空间距离测量，2为地表距离测量，3为垂直距离测量，4为投影面积测量，5为水平距离测量)]
 * @return {[type]}        [description]
 */
var showMeasureResult = function(result, type) {
    var unit = "";
    var title = "";
    if (type === 4) { //投影面积测量
        unit = "平方千米";
        if(result==0){
            alert("至少需要构成面积区域，方能进行面积计算");
            clearMeasureResult();
            if (resultRes) {
                resultRes.ClearRes();
                top.LayerManagement.earth.ShapeCreator.Clear();
            }
            return;
        }
        if (result < 1) {
            result = result * 1000000;
            unit = "平方米";
        }
        title = "水平面积为：";
    } else if (type >= 300 && type < 400) {
        unit = "米";
        if (type === 300) {
            title = "管间水平距离为：";
        } else if (type === 301) {
            title = "管间水平距离为：";
        } else if (type === 302) {
            title = "管间垂直距离为：";
        } else if (type === 303) {
            title = "管间垂直距离为：";
        } else if (type === 304) {
            title = " 管间空间距离为：";
        }
    } else if (type === 400) {
        unit = "度";
        title = "平面角度：";
    } else if (type === 401) {
        unit = "平方米";
        title = "地表面积：";
    } else { //其它测量
        unit = "千米";
        if (result < 1) {
            result = result * 1000;
            unit = "米";
        }
        if (type === 1) {
            title = "空间距离为：";
        } else if (type === 2) {
            title = "地表距离为：";
        }
        if (type === 3) {
            title = "垂直距离为：";
        }
        if (type === 5) {
            title = "水平距离为：";
        }
    }
    result = result.toFixed(2);
    var measureBalloonId = top.LayerManagement.earth.Factory.CreateGuid();
    var htmlBal = top.LayerManagement.earth.Factory.CreateHtmlBalloon(measureBalloonId, "量算窗体");
    var fontColor = top.SYSTEMPARAMS.balloonAlpha >0 ? '#fffffe':'black' ;
    var numColor = top.SYSTEMPARAMS.balloonAlpha >0 ? '#ffff00':'#DC7623' ;
    var html = "<html><body style='color: "+fontColor+"; margin: 8; padding: 2px;font:14px Microsoft Yahei;'>" +
        "<div style='position:absolute;top:20%;text-align:center;' >" + title + "<span style='font-weight:bold;color:"+
        numColor+"'>" + result + "</span>" + unit + "</div></body></html>";
    var width = 250;
    if(top.SYSTEMPARAMS.balloonAlpha >0){//气泡透明
        htmlBal.SetIsTransparence(true);
        htmlBal.SetRectSize(width, 80);
        htmlBal.SetBackgroundAlpha(0xcc);
    }else{//气泡不透明透明
        htmlBal.SetIsTransparence(false);
        width = 300;
        htmlBal.SetRectSize(width, 140);
    }
    var leftDis = top.dialogLeft + width/2;
    if(top.ViewTranSettingBtn){
        leftDis += 355;
        htmlBal.SetScreenLocation(leftDis, 0);
    }else{
        htmlBal.SetScreenLocation(leftDis, 0);
    }
    htmlBal.SetIsAddCloseButton(true);
    htmlBal.SetIsAddMargin(true);
    htmlBal.SetIsAddBackgroundImage(true);
    
    htmlBal.ShowHtml(html);
    bolonArr.push(htmlBal);

    //所有气泡关闭事件均修改为下面的回调方式
    top.Stamp.Tools.OnHtmlBalloonFinishedFunc(measureBalloonId,function(gid){
        if (measureBalloonId === gid) {
            hideBollon();
            clearMeasureResult();
            if (resultRes) {
                resultRes.ClearRes();
                top.LayerManagement.earth.ShapeCreator.Clear();
            }
        }
    });
};

/**
 * 功能：点击鼠标右键取消分析/测量操作
 * 参数：无
 * 返回值：无
 */
var measureOperCancel = function() {
    top.LayerManagement.earth.Event.OnRBDown = function() {
        top.LayerManagement.earth.ShapeCreator.Clear();
        top.LayerManagement.earth.Event.OnRBDown = function() {};
    };
};

/**
 * 清除气泡
 * @return {[type]} [description]
 */
var hideBollon = function() {
    if (bolonArr.length > 0) {
        for (var i = 0; i < bolonArr.length; i++) {
            if (bolonArr[i]) {
                bolonArr[i].DestroyObject();
                bolonArr[i] = null;
            }
        }
    }
    if (resultRes) {
        resultRes.ClearRes();
        resultRes = null;
    }
}

/**
 * 功能：“水平距离”菜单点击事件
 * 参数：无
 * 返回：无
 */
var horizontalDisClick = function() {
    hideBollon();
    top.LayerManagement.earth.Event.OnMeasureFinish = showMeasureResult;
    setTimeout(function() {
        top.LayerManagement.earth.Measure.MeasureHorizontalDistance(Stamp.Tools.bTerrain);
        top.LayerManagement.earth.focus();
    }, 100);
};

/**
 * 功能：“垂直距离”菜单点击事件
 * 参数：无
 * 返回：无
 */
var verticalDisClick = function() {
    hideBollon();
    top.LayerManagement.earth.Event.OnMeasureFinish = showMeasureResult;

    setTimeout(function() {
        top.LayerManagement.earth.Measure.MeasureHeight(Stamp.Tools.bTerrain);
        top.LayerManagement.earth.focus();
    }, 100);
};

/**
 * 功能：“空间距离”菜单点击事件
 * 参数：无
 * 返回：无
 */
var spaceDisClick = function() {
    hideBollon();
    top.LayerManagement.earth.Event.OnMeasureFinish = showMeasureResult;

    setTimeout(function() {
        top.LayerManagement.earth.Measure.MeasureLineLength(Stamp.Tools.bTerrain);
        top.LayerManagement.earth.focus();
    }, 100);
};

/**
 * 功能：“水平面积”菜单点击事件
 * 参数：无
 * 返回：无
 */
var flatAreaClick = function() {
    hideBollon();
    top.LayerManagement.earth.Event.OnMeasureFinish = showMeasureResult;
    setTimeout(function() {
        top.LayerManagement.earth.Measure.MeasureArea();
        top.LayerManagement.earth.focus();
    }, 100);
};


/**
 * 功能：“地表面积”菜单点击事件
 * 参数：无
 * 返回：无
 */
var surfaceAreaClick = function() {
    hideBollon();
    top.LayerManagement.earth.Event.OnCreateGeometry = function(pval, type) {
        top.LayerManagement.earth.Event.OnAnalysisFinished = function(result) {
            resultRes = result;
            top.LayerManagement.earth.ShapeCreator.Clear();
            showMeasureResult(result.TerrainSurfaceArea, 401);
        };
        if(pval.Count<3) {
            alert("至少需要构成面积区域，方能进行面积计算");
            top.LayerManagement.earth.ShapeCreator.Clear();
        }
        top.LayerManagement.earth.Analysis.SurfaceArea(pval);
        top.LayerManagement.earth.Event.OnCreateGeometry = function() {};
    };
    setTimeout(function() {
        top.LayerManagement.earth.ShapeCreator.CreatePolygon();
        top.LayerManagement.earth.focus();
    }, 100);
};

/**
 * 功能：“平面角度”菜单点击事件
 * 参数：无
 * 返回：无
 */
var mPlaneAngleClick = function() {
    hideBollon();
    top.LayerManagement.earth.Event.OnMeasureFinish = function(pval, type) {
        var showResult = "平面角度:" + pval + "度";
        showMeasureResult(pval, 400);
        top.LayerManagement.earth.Event.OnMeasureFinish = function() {};
    };
    setTimeout(function() {
        top.LayerManagement.earth.Measure.MeasurePlaneAngle(); // 平面角度
        top.LayerManagement.earth.focus();
    }, 100);
};

//----------------------------------------------------------------------
// 管线测量 - 开始
//----------------------------------------------------------------------
/**
 * 管线测量对象
 */
var PipelineMeasure = {
    coordinate1: null, //管线坐标1
    coordinate2: null, //管线坐标2
    datumConfigLink: null, //字段映射文件的地址
    datum: null, //空间坐标转换对象

    /**
     * 功能：初始化空间坐标转换对象
     * 参数：无
     * 返回：无
     */
    initDatum: function(layerId) {
        var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(layerId);
        var projectSetting = layer.ProjectSetting;
        var layerLink = projectSetting.SpatialRefFile;
        if (this.datumConfigLink == layerLink) {
            return;
        }
        this.datumConfigLink = layerLink;
        var spatialUrl = "http://" + layerLink.substr(2).replace("/", "/sde?") + "_sde";
        spatialUrl = spatialUrl.replace("http:", "").replace("/sde?", "");
        spatialUrl = spatialUrl.substr(0, spatialUrl.length - 4);
        while (spatialUrl.indexOf("/")>-1) {
            spatialUrl = spatialUrl.replace("/", "\\");
        }
        this.datum = CoordinateTransform.createDatum(spatialUrl);
    },

    /**
     * 功能：根据管线的图层ID，搜索管线信息
     * 参数：pipelineId - 管线的图层Id; filter - 搜索条件; queryType - 搜索类型; queryTableType - 搜索表类型；spatial-空间搜索对象
     * 返回：搜索结果
     */
    getPipelineInfo: function(pipelineId, filter, queryType, queryTableType, spatial, contain) {
        var pipeLayer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(pipelineId);
        if (pipeLayer == null) {
            return null;
        }
        var subLayer = null;
        for (var i = 0, len = pipeLayer.GetChildCount(); i < len; i++) {
            subLayer = pipeLayer.GetChildAt(i);
            if (subLayer.Name == contain) { // 使用具体的_container图层
                break;
            }
        }
        if (subLayer == null) {
            return;
        }
        var params = subLayer.QueryParameter;
        if (params == null) {
            return null;
        }
        params.ClearRanges();
        params.ClearCompoundCondition();
        params.ClearSpatialFilter();
        params.Filter = "";
        params.Filter = filter;
        params.ClearSpatialFilter();
        if (spatial != null) {
            params.SetSpatialFilter(spatial);
        }
        params.QueryType = queryType;
        params.QueryTableType = queryTableType; //0为点表搜索；1为线表搜索
        var result = subLayer.SearchFromGISServer();
        return result;
    },

    /**
     * 功能：根据管线的图层ID和关键字，搜索管线信息
     * 参数：pipelineId - 管线的图层Id; key - 对象的关键字，即US_KEY值;
     * 返回：搜索结果
     */
    getPipeLocalInfo: function(pipelineId, key) {
        var pipeLayer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(pipelineId);
        if (pipeLayer == null) {
            return null;
        }
        var params = pipeLayer.LocalSearchParameter;
        if (params == null) {
            return null;
        }
        var dt = params.ReturnDataType;
        params.ClearSpatialFilter();
        params.ReturnDataType = top.localSearchDataType.xml;
        params.PageRecordCount = 100;
        params.SetFilter(key, "");
        params.HasDetail = false;
        params.HasMesh = false;
        var result = pipeLayer.SearchFromLocal();
        params.ReturnDataType = dt;
        return result;
    },

    /**
     * 功能：根据搜索结果提取管线的坐标信息
     * 参数：result - 搜索结果
     * 返回：坐标信息对象
     */
    getPipelineCoord: function(result, layerGuid, key) {
        if (result == null) {
            return null;
        }
        var resultXml = result.GotoPage(0);
        var resultDoc = loadXMLStr(resultXml);
        var resultRoot = resultDoc.documentElement;
        if (resultRoot == null) {
            return null;
        }
        var recordRoot = resultRoot.firstChild;
        if (recordRoot.childNodes.length <= 0) {
            return null;
        }

        var recordNode = recordRoot.firstChild;
        var coordType = recordRoot.getAttribute("geometry");
        var shapeNode = recordNode.selectSingleNode("SHAPE");
        var shapeXml = shapeNode.xml;
        var coordBeginIndex = shapeXml.indexOf("<Coordinates>") + "<Coordinates>".length;
        var coordEndIndex = shapeXml.indexOf("</Coordinates>");
        var coordStr = shapeXml.substr(coordBeginIndex, coordEndIndex - coordBeginIndex);
        var coordArr = coordStr.split(",");
        var us_SDEEP = top.getName("US_SALT", 1, true);
        var us_EDEEP = top.getName("US_EALT", 1, true);
        var us_SDEEP_value = parseFloat(recordRoot.getElementsByTagName(us_SDEEP)[0].text); //起点高程
        var us_EDEEP_value = parseFloat(recordRoot.getElementsByTagName(us_EDEEP)[0].text); //止点高程
        //排水时管底，非排水是管顶
        var us_Size = top.getName("US_SIZE",1,true);
        var us_Size_value = recordRoot.getElementsByTagName(us_Size)[0].text;
        var pipeHeight = us_Size_value;
        var pipeWidth = us_Size_value;
        if(us_Size_value.indexOf('X') > -1){
            pipeWidth = us_Size_value.split("X")[0] * 0.001;
            pipeHeight = us_Size_value.split("X")[1] * 0.001;
        }else{
            pipeWidth = us_Size_value * 0.001;
            pipeHeight = us_Size_value * 0.001;
        }
        var layer = top.LayerManagement.earth.LayerManager.GetLayerByGUID(layerGuid);
        if(!layer){
            return;
        }
        var layerType = layer.PipeLineType;
        if(layerType >= 4000 && layerType <= 4306){//排水
            us_SDEEP_value = us_SDEEP_value + pipeHeight * 0.5;
            us_EDEEP_value = us_EDEEP_value + pipeHeight * 0.5;
        }else{
            us_SDEEP_value = us_SDEEP_value - pipeHeight * 0.5;
            us_EDEEP_value = us_EDEEP_value - pipeHeight * 0.5;
        }
        
        coordArr.splice(2, 1, us_SDEEP_value);
        coordArr.splice(5, 1, us_EDEEP_value);
        var coordList = [];
        var vect3s = top.LayerManagement.earth.Factory.CreateVector3s();
        for (var i = 0; i < coordArr.length; i = i + 3) {
            //空间坐标转换，将经纬度坐标转换为空间坐标
            var coordPoint = this.datum.des_BLH_to_src_xy(coordArr[i], coordArr[i + 1], coordArr[i + 2]);
            coordList.push(coordPoint);
            var vect = top.LayerManagement.earth.Factory.CreateVector3();
            vect.X = coordArr[i];
            vect.Y = coordArr[i + 1];
            vect.Z = coordArr[i + 2];
            vect3s.AddVector(vect);
        }

        //新增获取管线的mesh顶点，用于两个mesh求最短距离
        var meshV3s = this.getPipeLineMeshVertices(layer,key);

        var coordObject = {
            coordType: coordType,
            coordList: coordList,
            centerLineVect3s: vect3s,
            lineMeshV3s: meshV3s,
            pipeHeight: pipeHeight,
            pipeWidth: pipeWidth
        };
        return coordObject;
    },

    /**
     * 功能：判断两个坐标点是否相同
     * 参数：coordPoint1 - 坐标点1；coordPoint1-坐标点2
     * 返回：比较结果（true为相同；false为不相同）
     */
    isCoordPointEqual: function(coordPoint1, coordPoint2) {
        if ((coordPoint1 == null) || (coordPoint2 == null)) {
            return false;
        }

        if ((coordPoint1.X === coordPoint2.X) &&
            (coordPoint1.Y === coordPoint2.Y) &&
            (coordPoint1.Z === coordPoint2.Z)) {
            return true;
        } else {
            return false;
        }
    },

    /**
     * 获取管线mesh点集合
     * @param  {[type]} layer [图层]
     * @param  {[type]} key   [关键字]
     * @return {[type]}       [description]
     */
    getPipeLineMeshVertices: function(layer, key){
        var curlayer = null;
        for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
            curlayer = layer.GetChildAt(i);
            if (curlayer.LayerType === "Container") { // 使用具体的_container图层
                break;
            }
        }
        if (curlayer == null) {
            return;
        }
        var dt = curlayer.LocalSearchParameter.ReturnDataType;
        curlayer.LocalSearchParameter.ClearSpatialFilter();
        curlayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
        curlayer.LocalSearchParameter.PageRecordCount = 100;
        curlayer.LocalSearchParameter.SetFilter(key, "");
        curlayer.LocalSearchParameter.HasDetail = true;
        curlayer.LocalSearchParameter.HasMesh = true;
        var localresult = curlayer.SearchFromLocal();
        curlayer.LocalSearchParameter.ReturnDataType = dt;
        if(localresult == null){
            return false;
        }
        curlayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
        localresult.GotoPage(0);
        curlayer.LocalSearchParameter.ReturnDataType = dt;
        var meshV3s = null;
        for (var i = 0; i < localresult.RecordCount; i++) {
            var lobjKey = localresult.GetLocalObjectKey(i);
            if(lobjKey != key){
                continue;
            }
            var lobj = localresult.GetLocalObject(i);
            if (!lobj) {
                continue;
            }
            meshV3s = lobj;
        }
        return meshV3s;
    },

    /**
     * 功能：添加OnPickObjectEx监听事件，选取两条管线
     * 参数：callback - 事件的回调函数
     * 返回：无
     */
    onPickObjectEvent: function(callback) {
        top.LayerManagement.earth.Event.OnPickObjectEx = function(obj) {
            obj.Underground = true; // SEObjectFlagType.ObjectFlagUnderground
            var parentLayerId = obj.GetParentLayerName();
            var parentLayerArr = parentLayerId.split("_");
            var searchLayerId = parentLayerArr[0];
            var useKey = top.getName("US_KEY", 1, true);
            var searchFilter = "(and,equal," + useKey + "," + obj.GetKey() + ")";
            var queryType = 17;
            var queryTableType = 1; //线表搜索
            var result = PipelineMeasure.getPipelineInfo(searchLayerId.split("=")[1], searchFilter, queryType, queryTableType, null, parentLayerArr[1]);
            PipelineMeasure.initDatum(searchLayerId.split("=")[1]); //初始化空间坐标转换对象
            var coordObj = PipelineMeasure.getPipelineCoord(result, searchLayerId.split("=")[1],obj.GetKey());
            if (coordObj == null) {
                top.LayerManagement.earth.Query.FinishPick();
                PipelineMeasure.clearPipelineMeasure();
                alert("未能查询到选定对象的信息");
                return;
            }
            if (PipelineMeasure.coordinate1 == null) {
                PipelineMeasure.coordinate1 = coordObj;
                obj.ShowHighLight();
            } else {
                PipelineMeasure.coordinate2 = coordObj;
                obj.ShowHighLight();
                top.LayerManagement.earth.Query.FinishPick();
                callback(); //回调处理函数
                PipelineMeasure.coordinate1 = null;
                PipelineMeasure.coordinate2 = null;
            }
        };
        top.LayerManagement.earth.Query.PickObjectEx(24);
    },

    /**
     * 功能：清除管线测量数据
     * 参数：无
     * 返回：无
     */
    clearPipelineMeasure: function() {
        this.coordinate1 = null;
        this.coordinate2 = null;
    }
};
//----------------------------------------------------------------------
// 管线测量 - 结束
//----------------------------------------------------------------------
