/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：隧道开挖、开挖分析js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var TerrainExcavate = {};
var excaveBalloon = null;
(function () {
    var resultHtml = "";
    var _result = null;      // 分析结果
    var tempClipModel = null,
        tempClipLayer = null,
        tempClipGuid = null,
        clipDepth = 0,
        level = 11,
        bufDist = 10,
        depth = 0,
        imgLocation = "http://" + getRootPath() + "/images/PipeMaterial/",
        profileTexturePath = imgLocation + "bottom.jpg";
    bottomTexturePath = imgLocation + "profile.jpg";
    function getRootPath() {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return (localhost + projectName);
    }

    /**
     * 高亮闪烁显示
     * 作为表格的行的双击事件处理函数，其可见范围需在window全局作用域！
     * @param layerID  图层ID
     * @param type     对象类型：point / line
     * @param guid     对象的GUID
     * @param key      对象的US_KEY值
     */
    var northArr = [];
    var southArr = [];
    var eastArr = [];
    var westArr = [];
    var hideHigh = [];
    var chkArr = [];
    var chkTag = "false";
    var showTag = false;
    var dbClickHighLight = [];//双击高亮记录
    /**
     * 双击高亮
     * @param layerID   图层guid
     * @param type      类型,管线还是管点
     * @param guid      模型guid
     * @param key       关键字
     * @param flag      是否显示详细信息
     * @param obj       模型对象
     */
    window.highlightTeObject = function (layerID, type, guid, key, flag, obj) {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            chkTag = "true";//显示结果
        }
        var vecCenter = obj.SphericalTransform;
        northArr.push(obj.GetLonLatRect().North);
        southArr.push(obj.GetLonLatRect().South);
        eastArr.push(obj.GetLonLatRect().East);
        westArr.push(obj.GetLonLatRect().West);
        // earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude + 30, 0.0, 89.0, 0, 4);
        if (chkTag === "true") {//显示结果
            if (flag === "true") {//显示详细信息
                obj.HightLightIsFlash(false);
                obj.ShowHighLight();
                hideHigh.push(obj);
            } else {//双击高亮定位
                obj.HightLightIsFlash(true);
                obj.ShowHighLight();
                dbClickHighLight.splice(0, 1);
                dbClickHighLight.push(obj);
                earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, 0.0, 89.0, 0, 10);
            }
        } else {//未显示结果----即在双击定位时进入
            clearHighLight();
            obj.HightLightIsFlash(true);
            obj.ShowHighLight();
            dbClickHighLight.splice(0, 1);
            dbClickHighLight.push(obj);
            earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, 0.0, 89.0, 0, 10);
        }
        if (showTag) {
            showTag = false;
            northArr.sort();
            southArr.sort();
            eastArr.sort();
            westArr.sort();
            var TO_RADIAN = 0.017453292519943295769236907684886;
            var SemiMajor = 6378.137;
            var width = Math.abs(eastArr[0] - westArr[westArr.length - 1]);
            var height = Math.abs(northArr[0] - southArr[southArr.length - 1]);
            var x = Math.abs((eastArr[0] + westArr[westArr.length - 1]) / 2);
            var y = Math.abs((northArr[0] + southArr[southArr.length - 1]) / 2);
            var vAltitude = earth.Measure.MeasureTerrainAltitude(x, y);
            var vAspect1 = width / height;
            var vAspect = earth.offsetWidth / earth.offsetHeight;
            var vRange = 100;
            if (vAspect1 > vAspect) {
                vRange = width * TO_RADIAN * SemiMajor * 1000 / Math.tan(22.5 * vAspect * TO_RADIAN);//* vAspect * TO_RADIAN
            }
            else {
                vRange = height * TO_RADIAN * SemiMajor * 1000 / Math.tan(22.5 * TO_RADIAN);//* TO_RADIAN
            }
            earth.GlobeObserver.GotoLookat(x, y, vAltitude, 0, 89.0, 0, vRange + 50);
        }

        if (!isShowResult && bShow) {
            var parentLayerName = obj.GetParentLayerName();
            var cArr = parentLayerName.split("=");
            var cArr = cArr[1].split("_");
            var layer2 = earth.LayerManager.GetLayerByGUID(cArr[0]);
            if (cArr.length > 1) {
                var bLine = parentLayerName.indexOf("container") > -1 ? 1 : 0;
                var filed = top.getName("US_KEY", bLine, true);
                var strPara2 = "(and,equal," + filed + "," + key + ")"; // + "&pg=0,30";
                var param = layer2.QueryParameter;
                param.Filter = strPara2;
                param.QueryType = 17;   // SE_AttributeData
                param.QueryTableType = bLine;
                param.PageRecordCount = 1;
                var result = layer2.SearchFromGISServer();
                if (result.RecordCount > 0) {
                    var currentRecord = $.xml2json(result.gotoPage(0)).Result.Record;
                    if (currentRecord == null || currentRecord == undefined) {
                        top.LayerManagement.clearHtmlBalloons();
                        return;
                    }
                    //显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
                    if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
                    } else {
                        htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:255px;height:275px;font-family:Microsoft Yahei;border:1px solid #ccc;margin-top:15px;margin-bottom:15px"><table style="font-size:16px; color: black">';
                    }
                    var mid;
                    if (type != "line") {
                        initPointValue(layerID, currentRecord, parentLayerName, obj, key, bLine);
                    }
                    else {
                        mid = initLineValue(layerID, currentRecord, parentLayerName);
                        htmlStr = htmlStr + mid + '</table></div>';
                        var vecCenter = obj.SphericalTransform;
                        top.LayerManagement.showHtmlBalloon(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, htmlStr);
                    }
                } else {
                    if (bLine == 1) {//竖管
                        var filed = top.getName("US_KEY", 0, true);
                        var strPara2 = "(and,equal," + filed + "," + key + ")"; // + "&pg=0,30";
                        var param = layer2.QueryParameter;
                        param.Filter = strPara2;
                        param.QueryType = 17;   // SE_AttributeData
                        param.QueryTableType = 0;
                        param.PageRecordCount = 1;
                        var result = layer2.SearchFromGISServer();
                        if (result.RecordCount > 0) {
                            var currentRecord = $.xml2json(result.gotoPage(0)).Result.Record;
                            if (currentRecord == null || currentRecord == undefined) {
                                top.LayerManagement.clearHtmlBalloons();
                                return;
                            }
                            //显示气泡  word-break: break-all;word-wrap: break-word; 内容自动换行
                            if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                                htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
                            } else {
                                htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:255px;height:275px;font-family:Microsoft Yahei;border:1px solid #ccc;margin-top:15px;margin-bottom:15px"><table style="font-size:16px; color: black">';
                            }
                            initPointValue(layerID, currentRecord, parentLayerName, obj, key, bLine);
                        }
                    }
                }
            }
        }
    };
    /**
     * 显示管点详细信息气泡
     * @param layerID       图层Guid
     * @param record        此记录
     * @param layerName     图层guid
     * @param obj           模型对象
     * @param key           关键字
     * @param bLine         是否是管线
     */
    var initPointValue = function (layerID, record, layerName, obj, key, bLine) {
        var Coordinates = record.SHAPE.Point.Coordinates;
        var coord = Coordinates.split(" ");
        var coordinate1 = coord[0].split(",");
        var v3s = transformToPlaneCoordinates(layerID, coordinate1);
        var tv3s = v3s["datumCoord"];
        originCoord = v3s["originCoord"];
        var X = "";
        var Y = "";
        if (tv3s) {
            X = (parseFloat(tv3s.X)).toFixed(3);
            Y = (parseFloat(tv3s.Y)).toFixed(3);
        }

        var us_well = record[top.getName("US_WELL", 0, true)];
        var fieldArr = [];
        fieldArr = top.STAMP_config.PointProperty.DEFAULTPOINT;
        var str = "";
        for (var i = 0; i < fieldArr.length; i++) {
            var fieldCaption = top.getName(fieldArr[i], 0, false);    //显示字段
            var fieldName = top.getName(fieldArr[i], 0, true);//数据库字段
            var fieldValue = record[fieldName] || "";
            if (fieldArr[i] == "X") {
                fieldCaption = "X坐标";
                fieldValue = X;
            } else if (fieldArr[i] == "Y") {
                fieldCaption = "Y坐标";
                fieldValue = Y;
            }
            if (Number(fieldValue) && (fieldArr[i] == "US_PT_ALT" || fieldArr[i] == "US_NDEEP"
                || fieldArr[i] == "US_WDEEP" || fieldArr[i] == "US_PSIZE" || fieldArr[i] == "US_WDIA"
                || fieldArr[i] == "US_ANGLE")) {
                fieldValue = parseFloat(fieldValue).toFixed(3);
            }
            if (fieldArr[i] == "US_KEY") {
                if (bLine == 1) {
                    fieldCaption = top.getName(fieldArr[i], 1, false);
                }
                fieldValue = key;
            }
            str += '<tr><td  width="100">&nbsp;&nbsp;&nbsp;&nbsp;' + fieldCaption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + fieldValue || "" + '</td></tr>';
        }
        htmlStr = htmlStr + str + '</table></div>';
        //高亮
        if (obj != null) {
            var vecCenter = obj.SphericalTransform;
            top.LayerManagement.showHtmlBalloon(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, htmlStr);
        }
    };
    /**
     * 显示管线详细信息气泡
     * @param layerID   图层guid
     * @param record    此记录
     * @param layerName 图层名称
     * @returns {string}    html字符串
     */
    var initLineValue = function (layerID, record, layerName) {
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var intLayerCode = layer.PipeLineType;
        var fieldArr = [];
        if (intLayerCode >= 1000 && intLayerCode < 2000) {//电力管线
            fieldArr = top.STAMP_config.LineProperty.DLLINE;
        } else if (intLayerCode >= 2000 && intLayerCode < 3000) {//电信
            fieldArr = top.STAMP_config.LineProperty.DXLINE;
        } else if (intLayerCode >= 3000 && intLayerCode < 4000) {//给水
            fieldArr = top.STAMP_config.LineProperty.JSLINE;
        } else if (intLayerCode >= 4000 && intLayerCode < 5000) {//排水
            fieldArr = top.STAMP_config.LineProperty.PSLINE;
        } else if (intLayerCode >= 5000 && intLayerCode < 6000) {//燃气
            fieldArr = top.STAMP_config.LineProperty.RQLINE;
        } else if (intLayerCode >= 6000 && intLayerCode < 7000) {//热力
            fieldArr = top.STAMP_config.LineProperty.RLLINE;
        } else if (intLayerCode >= 7000 && intLayerCode < 8000) {//工业
            fieldArr = top.STAMP_config.LineProperty.GYLINE;
        } else {//其他
            fieldArr = top.STAMP_config.LineProperty.DEFAULTLINE;
        }

        var str = "";
        for (var i = 0; i < fieldArr.length; i++) {
            var fieldCaption = top.getName(fieldArr[i], 1, false);    //显示字段
            var fieldName = top.getName(fieldArr[i], 1, true);//数据库字段
            var fieldValue = record[fieldName] || "";
            if (fieldArr[i] == "US_SIZE" && fieldValue.indexOf('X') == -1) {
                fieldValue = parseFloat(parseFloat(fieldValue).toFixed(2));
            }
            str += '<tr><td  width="100">&nbsp;&nbsp;&nbsp;&nbsp;' + fieldCaption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + fieldValue || "" + '</td></tr>';
        }
        return str;
    };

    //清除双击高亮
    var clearHighLight = function () {
        if (dbClickHighLight.length > 0 && top.LayerManagement.earth != null) {
            dbClickHighLight[0].StopHighLight();
        }
        StatisticsMgr.detachShere();
    };
    /**
     * 在搜索的结果集中根据key值确定具体的对象
     * @param searchResult  搜索结果集
     * @param key           对象的US_KEY值
     * @return {*}          返回匹配的对象
     */
    var filterByKey = function (searchResult, key) {
        var obj = null;
        if (searchResult.RecordCount === 0) {
            return null;
        }
        searchResult.GotoPage(0);
        for (var i = 0; i < searchResult.RecordCount; i++) {
            obj = searchResult.GetLocalObject(i);
            if (null == obj) continue;
            if (obj.GetKey() == key) {
                obj.Underground = true;   // SEObjectFlagType.ObjectFlagUnderground
                return obj;
            }
        }
        return null;
    };
    var clear = function () {
        earth.ShapeCreator.Clear();
        earth.Event.OnCreateGeometry = function () {
        };
    };
    var tempClipLayersList = [];
    //开挖
    var createNewLayer = function () {
        earth.Event.OnAnalysisFinished = function (res) {
            _result = res;
        };
        var tempDemPath = earth.Environment.RootPath + "\\temp\\terrain\\";
        var tempPolyPath = earth.Environment.RootPath + "\\temp\\polygon\\";
        var rect = earth.TerrainManager.GetTempLayerRect();
        var levelMin = earth.TerrainManager.GetTempLayerMinLevel();
        var levelMax = earth.TerrainManager.GetTempLayerMaxLevel();

        var guid = earth.Factory.CreateGUID();
        if (tempClipLayer != null) {
            earth.DetachObject(tempClipLayer);
            tempClipLayer = null;
        }
        tempClipLayer = earth.Factory.CreateDemLayer(guid, "TempTerrainLayer", tempDemPath,
            rect, levelMin, levelMax, 1000);
        earth.AttachObject(tempClipLayer);
        //tempClipLayersList.push(tempClipLayer);
    };
    var clipModelList = [];
    var createClipModel = function (args, modelGuid, modelName) {
        if (modelGuid == null) {
            modelGuid = earth.Factory.CreateGUID();
        }
        if (modelName == null) {
            modelName = "ClipModel";
        }
        var terrain = earth.TerrainManager;
        var sampArgs = terrain.GenerateSampledCoordinates(args);
        tempClipModel = terrain.GenerateClipModel(modelGuid, modelName, args, sampArgs, profileTexturePath, bottomTexturePath);

        earth.AttachObject(tempClipModel);
        clipModelList.push(tempClipModel);
        return tempClipModel;
    };
    /**
     * 显示挖方量气泡
     * @param excaveAmount  挖方量
     * @param balloonLocation   气泡的坐标
     */
    var showExcaveBalloon = function (excaveAmount, balloonLocation) {
        var htmlStr = "";
        var earth = top.LayerManagement.earth;
        if (excaveBalloon) {
            excaveBalloon.DestroyObject();
            excaveBalloon = null;
        }
        var guid = earth.Factory.CreateGuid();
        excaveBalloon = earth.Factory.CreateHtmlBalloon(guid, "balloon");
        var fontColor = top.SYSTEMPARAMS.balloonAlpha > 0 ? '#fffffe' : 'black';
        var numColor = top.SYSTEMPARAMS.balloonAlpha > 0 ? '#ffff00' : '#DC7623';
        var htmlStr = "<div style='color: " + fontColor + "; margin: 8; padding: 2px;font:14px Microsoft Yahei;'>" +
            "挖方量:<span style='font-weight:bold;color:" + numColor + "'>" + excaveAmount + "</span>立方米</div>";
        var width = 250;
        if (top.SYSTEMPARAMS.balloonAlpha > 0) {//气泡透明
            excaveBalloon.SetIsTransparence(true);
            excaveBalloon.SetRectSize(width, 80);
            excaveBalloon.SetBackgroundAlpha(0xcc);
        } else {//气泡不透明透明
            excaveBalloon.SetIsTransparence(false);
            width = 300;
            excaveBalloon.SetRectSize(width, 140);
        }
        var leftDis = top.dialogLeft + width / 2;
        if (top.ViewTranSettingBtn) {
            leftDis += 355;
            excaveBalloon.SetScreenLocation(leftDis, 0);
        } else {
            excaveBalloon.SetScreenLocation(leftDis, 0);
        }
        excaveBalloon.SetIsAddCloseButton(true);
        excaveBalloon.SetIsAddMargin(true);
        excaveBalloon.SetIsAddBackgroundImage(true);
        excaveBalloon.ShowHtml(htmlStr);
        top.Stamp.Tools.OnHtmlBalloonFinishedFunc(guid, function (closeBid) {
            if (excaveBalloon != null) {
                excaveBalloon.DestroyObject();
                excaveBalloon = null;
            }
        });
    }
    var roadVec3s = null;
    var btmAttitude = 0;//开挖后的底面的高程值
    /**
     * 沿路开挖画线回调事件
     * @param pFeat 返回的矢量对象
     */
    var onCreatePolyline = function (pFeat, geoType) {
        clear();
        var pntNum = pFeat.Count;
        if (pntNum < 2) {
            alert("应至少取两个点以进行开挖!");
            return;
        }
        var height = pFeat.Items(0).Z;
        var gpts0 = earth.Factory.CreateGeoPoints();
        for (var i = 0; i < pntNum; i++) {
            gpts0.Add(pFeat.Items(i).X, pFeat.Items(i).Y, pFeat.Items(i).Z);
            if (height < pFeat.Items(i).Z) {
                height = pFeat.Items(i).Z;
            }
        }
        var vec3s0 = earth.Factory.CreateVector3s();
        var vecTest = earth.GeometryAlgorithm.CreatePolygonFromPolylineAndWidth(gpts0, bufDist, bufDist);
        for (var i = 0; i < vecTest.Count - 1; i++) {
            if (height < vecTest.GetPointAt(i).Altitude) {
                height = vecTest.GetPointAt(i).Altitude;
            }
        }
        for (var i = 0; i < vecTest.Count - 1; i++) {
            vec3s0.Add(vecTest.GetPointAt(i).Longitude, vecTest.GetPointAt(i).Latitude, height + 10);
        }
        roadVec3s = vec3s0;

        // var height = altHeight;//pFeat.Items(0).Z;
        clipDepth = height - depth;
        var vec3 = null;
        var gpts = earth.Factory.CreateGeoPoints();
        for (var i = 0; i < pntNum; i++) {
            vec3 = pFeat.Items(i);
            gpts.Add(vec3.X, vec3.Y, height);
        }
        var bufferedPts = earth.GeometryAlgorithm.CreatePolygonFromPolylineAndWidth(gpts, bufDist, bufDist);

        var vec3s = earth.Factory.CreateVector3s();

        for (var i = 0; i < bufferedPts.Count; i++) {
            var pt = bufferedPts.GetPointAt(i);
            vec3s.Add(pt.Longitude, pt.Latitude, clipDepth);
        }
        var balloonLocation = vec3s.Items(0);
        earth.TerrainManager.SetMinClipLevel(level);

        if (checkExcave1) {
            tempClipGuid = earth.Factory.CreateGUID();
            earth.TerrainManager.ClipTerrainByPolygonEx(tempClipGuid, vec3s);
        } else {
            earth.TerrainManager.ClipTerrainByPolygon(vec3s);
        }

        createNewLayer();
        if (checkTag1) {
            var clipModel = createClipModel(vec3s);
        }

        earth.Event.OnAnalysisFinished = function (result, alt) {
            var res = result.Excavation.toFixed(2);
            showExcaveBalloon(res, balloonLocation);
        };
        earth.Analysis.SurfaceExcavationAndFill(clipDepth, vec3s);
        earth.ShapeCreator.Clear();
        earth.Event.OnCreateGeometry = function () {
        };
        analysisRS.removeAttr("disabled");
        $("div[tag=EditHideTempTerrain]").attr("disabled", false);
        $("div[tag=EditDeleteTempTerrain]").attr("disabled", false);
    };
    /**
     * 沿路开挖分析
     */
    var roadAnalysis = function () {
        clearHighLight();
        resultArr = [];
        $.each(pipelineList, function (i, v) {
            var vv = $(v);
            var guid = vv[0].id;  // checkbox的value值
            var name = vv[0].name;
            var layer = earth.LayerManager.GetLayerByGUID(guid);
            var subLayer = null;
            for (var i = 0, len = layer.GetChildCount(); i < len; i++) {
                subLayer = layer.GetChildAt(i);
                var pipeTypeName = "";
                if (subLayer.LayerType.toLowerCase() == "well") {
                    pipeTypeName = "井";
                    pipelnType = 0;
                } else if (subLayer.LayerType.toLowerCase() == "joint") {
                    pipeTypeName = "特征点";
                    pipelnType = 0;
                } else if (subLayer.LayerType.toLowerCase() == "equipment") {
                    pipeTypeName = "附属物";
                    pipelnType = 0;
                } else if (subLayer.LayerType.toLowerCase() == "room") {
                    pipeTypeName = "井室";
                    pipelnType = 0;
                } else if (subLayer.LayerType.toLowerCase() == "container") {
                    pipeTypeName = "管线";
                    pipelnType = 1;
                } else {
                    continue;
                }

                if (subLayer == null || subLayer.QueryParameter == null) {
                    return;
                }
                var dt = subLayer.LocalSearchParameter.ReturnDataType;
                subLayer.ClearSearchResult();
                subLayer.LocalSearchParameter.ClearSpatialFilter();
                subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
                subLayer.LocalSearchParameter.PageRecordCount = 10000;
                subLayer.LocalSearchParameter.SetFilter("", "");
                subLayer.LocalSearchParameter.SetSpatialFilter(roadVec3s);
                subLayer.LocalSearchParameter.HasDetail = true;
                subLayer.LocalSearchParameter.HasMesh = true;
                var localresult = subLayer.SearchFromLocal();
                var attrData = $.xml2json(localresult.gotoPage(0));
                var jsonRecords = attrData;
                if (attrData && attrData.SearchResult && attrData.SearchResult.total > 0 && attrData.SearchResult.ModelResult != null) {
                    jsonRecords = attrData.SearchResult.ModelResult.ModelData;
                }
                if (attrData && attrData.SearchResult.total == 1) {
                    jsonRecords = [jsonRecords];
                }
                parseLocalResult(localresult, guid, name, pipelnType, subLayer, pipeTypeName, jsonRecords);
                subLayer.LocalSearchParameter.ReturnDataType = dt;
            }
        });
        showResultPage(1);
    };
    /**
     * 道路开挖
     */
    var roadClip = function (pDepth, pLevel, dist) {
        // deleteTempTerrain();
        earth.Event.OnCreateGeometry = onCreatePolyline;
        earth.ShapeCreator.Clear();
        depth = parseFloat(pDepth);
        level = parseFloat(pLevel);
        bufDist = dist;
        earth.ShapeCreator.CreatePolyline(2, 255);
    };
    /**
     * 道路开挖
     */
    var projectId = "";
    var pipelineList = [];
    var showTable = "";
    var importTable = "";
    var checkTag1;
    var checkExcave1;
    var analysisRS = null;
    var mObjs = [];
    /**
     * 道路开挖
     * @param pDepth        开挖深度
     * @param pLevel        开挖级别
     * @param dist          开挖半径
     * @param id            工程guid
     * @param html          存放结果html的对象
     * @param show          是否显示结果
     * @param importObj     导出结果按钮
     * @param checkTag      是否开挖地面模型
     * @param checkExcave   是否生成辅助模型
     * @param analysisR     分析按钮
     */
    var roadClipAnaly = function (pDepth, pLevel, dist, id, html, show, importObj, checkTag, checkExcave, analysisR) {
        analysisRS = analysisR;
        checkTag1 = checkTag;
        checkExcave1 = checkExcave;
        showTable = show;
        importTable = importObj;

        deleteTempTerrainAnaly();
        projectId = id;
        resultHtml = html;
        analysisRS.attr("disabled", "disabled");
        var layer = earth.LayerManager.GetLayerByGUID(projectId);
        pipelineList = top.LayerManagement.getPipeListByLayer(layer);
        earth.Event.OnCreateGeometry = onCreatePolyline;
        earth.ShapeCreator.Clear();
        depth = parseFloat(pDepth);
        level = parseFloat(pLevel);
        bufDist = dist;
        earth.ShapeCreator.CreatePolyline(2, 255);
        resultArr = [];
    };
    //导入坐标
    var importClipAnaly = function (vector3s, pDepth, pLevel, id, html, show, importObj, checkTag, checkExcave, analysisR) {
        analysisRS = analysisR;
        checkTag1 = checkTag;
        checkExcave1 = checkExcave;
        showTable = show;
        importTable = importObj;
        projectId = id;
        resultHtml = html;
        analysisRS.attr("disabled", "disabled");
        var layer = earth.LayerManager.GetLayerByGUID(projectId);
        pipelineList = top.LayerManagement.getPipeListByLayer(layer);
        earth.ShapeCreator.Clear();
        depth = parseFloat(pDepth);
        level = parseFloat(pLevel);
        onCreatePolygon(vector3s);
    };
    //自定义开挖
    var onCreatePolygon = function (pFeat, geoType) {
        //var  pFeat1= pFeat;
        clear();
        var pntNum = pFeat.Count;
        if (pntNum < 3) {
            alert("应至少取三个点以进行开挖!");
            return;
        }

        var height = pFeat.Items(0).Z;
        for (var i = 0; i < pFeat.Count; i++) {
            if (height < pFeat.Items(i).Z) {
                height = pFeat.Items(i).Z;
            }
        }

        clipDepth = height - depth;
        var v3s = earth.Factory.CreateVector3s();
        for (var i = 0; i < pntNum; i++) {
            v3s.Add(pFeat.Items(i).X, pFeat.Items(i).Y, height + 10);
            pFeat.SetAt(i, pFeat.Items(i).X, pFeat.Items(i).Y, clipDepth);
        }
        var balloonLocation = v3s.Items(0);

        roadVec3s = v3s;
        earth.TerrainManager.SetMinClipLevel(level);
        if (checkExcave1) {
            tempClipGuid = earth.Factory.CreateGUID();
            earth.TerrainManager.ClipTerrainByPolygonEx(tempClipGuid, pFeat);
        } else {
            earth.TerrainManager.ClipTerrainByPolygon(pFeat);
        }

        if (tempClipLayer != null) {
            earth.DetachObject(tempClipLayer);
            tempClipLayer = null;
        }
        createNewLayer();

        if (checkTag1) {
            var clipModel = createClipModel(pFeat);
        }
        earth.Event.OnAnalysisFinished = function (result, alt) {
            var res = result.Excavation.toFixed(2);
            showExcaveBalloon(res, balloonLocation);

        };
        //第一个参数 是高程值 第二个参数是多边形
        earth.Analysis.SurfaceExcavationAndFill(clipDepth, pFeat);
        earth.ShapeCreator.Clear();
        earth.Event.OnCreateGeometry = function () {
        };
        analysisRS.removeAttr("disabled");
        $("div[tag=EditHideTempTerrain]").attr("disabled", false);
        $("div[tag=EditDeleteTempTerrain]").attr("disabled", false);

    };
    /**
     * 解析查询结果，添加到结果表格中
     * 开挖分析 这里要把查询到的管线进行比对 用管线的高程与埋深跟开挖深度比较 只有排水类的埋深是从管子的底部开始的
     * 先计算出挖后的地面的高程 然后用管段的起点高程与止点高程与之比对 在其之间就列举出来
     * todo......
     * @param result 查询结果
     * @param guid 图层ID
     * @param name 图层名
     */

    var keyArr = [];
    $.extend({
        //判断是否已经在数组中
        isInArray: function (keyStr, keyStrArr) {
            for (var i = 0; i < keyStrArr.length; i++) {
                if (keyStrArr[i].key == keyStr) {
                    return true;
                }
            }
            return false;
        }
    });

    var resultArr = [];
    /**
     *
     * @param result        查询结果
     * @param guid          图层GUID
     * @param name          图层名称
     * @param type          管线编码
     * @param clayer        当前图层
     * @param pipeTypeName
     * @param jsonRecords
     */
    var parseLocalResult = function (result, guid, name, type, clayer, pipeTypeName, jsonRecords) {
        if (result == null) {
            return;
        }
        if (result.RecordCount <= 0) {
            return;
        } else {
            type = type == 0 ? "point" : "line";
            var displayType = type === "point" ? "管点" : "管线";
            for (var i = 0; i < result.RecordCount; i++) {
                var obj = result.GetLocalObject(i);
                if (obj == null) {
                    continue;
                }
                var key = obj.GetKey();
                if ((obj.GetKey() == null || obj.GetKey() == "") && jsonRecords.length > i) {
                    key = jsonRecords[i].SE_NAME;
                }
                var meshV3s = result.GetMeshVertices(i);
                if (meshV3s == null) {
                    continue;
                }
                var alt = clipDepth;//roadVec3s.Items(0).Z;//与开挖时高程保持一致
                var bResult = false;
                bResult = earth.GeometryAlgorithm.GetPolygonPointSetRelationship(roadVec3s, alt, meshV3s);
                if (bResult) {
                    resultArr.push({
                        record: obj,
                        name: name,
                        guid: guid,
                        key: key,
                        type: type,
                        displayType: displayType,
                        pipeTypeName: pipeTypeName
                    });
                }
            }
        }
    };
    var pageNum = 0;
    /**
     * 显示分析结果
     * @param page  页码
     */
    var showResultPage = function (page) {
        pageNum = page;
        resultHtml.empty();
        var template = '<tr id="$trid"' +
            '><td class="col">$INDEX</td><td class="col">$DISPLAYTYPE</td><td class="col">$LAYER</td></tr>';
        var nameType = 1;
        for (var i = 0; i < resultArr.length; i++) {
            if (resultArr[i].displayType === "管线") {
                nameType = 1;
            } else {
                nameType = 0;
            }
            resultHtml.append(template.replace("$INDEX", resultArr[i].key)
                .replace("$DISPLAYTYPE", resultArr[i].pipeTypeName)
                .replace("$LAYER", resultArr[i].name)
                .replace("$LayerID", resultArr[i].guid)
                .replace("$TYPE", resultArr[i].type)
                .replace("$GUID", resultArr[i].key)
                .replace("$KEY", resultArr[i].key)
                .replace("$trid", "tr" + i));
            $("#tr" + i).dblclick(function () {
                var iIndex = $(this).attr("id").replace("tr", "");
                highlightTeObject(resultArr[iIndex].guid, resultArr[iIndex].type, resultArr[iIndex].key, resultArr[iIndex].key, "false", resultArr[iIndex].record);
            });
        }

        importTable.attr("disabled", false);
        showTable.attr("disabled", false);
        divloaded();
    };
    var getResultArr = function () {
        return resultArr;
    };
    /**
     * 高亮或者停止高亮所有结果
     * @param flag 是否高亮
     */
    var highlightObjectFromTunnel = function (flag) {
        northArr = [];
        southArr = [];
        eastArr = [];
        westArr = [];
        if (flag === "true") {
            chkTag = "true";
            chkArr = resultArr;
            if (resultArr.length != 0) {
                for (var i = 0; i < resultArr.length; i++) {
                    if (i === resultArr.length - 1) {
                        showTag = true;
                    }
                    var nameType = 0;
                    if (resultArr[i].displayType === "管线") {
                        nameType = 1;
                    }
                    highlightTeObject(resultArr[i].guid, resultArr[i].type, resultArr[i].key, resultArr[i].key, "true", resultArr[i].record);
                }
            }
        } else {
            showTag = false;
            chkTag = "false";
            if (hideHigh && hideHigh.length != 0 && top.LayerManagement.earth != null) {
                for (var i = 0; i < hideHigh.length; i++) {
                    hideHigh[i].StopHighLight();
                }
            }
        }
    };
    /**
     * 自定义开挖
     */
    var customClip = function (pDepth, pLevel) {
        //deleteTempTerrain();

        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        depth = parseFloat(pDepth);
        level = parseFloat(pLevel);
        earth.ShapeCreator.CreatePolygon();
    };
    /*
     * 自定义开挖
     */
    var customClipAnaly = function (pDepth, pLevel, id, html, show, importObj, checkTag, checkExcave, analysisR) {
        analysisRS = analysisR;
        checkTag1 = checkTag;
        checkExcave1 = checkExcave;
        showTable = show;
        importTable = importObj;
        deleteTempTerrainAnaly();
        projectId = id;
        resultHtml = html;
        analysisRS.attr("disabled", "disabled");
        var layer = earth.LayerManager.GetLayerByGUID(projectId);
        pipelineList = top.LayerManagement.getPipeListByLayer(layer);
        earth.Event.OnCreateGeometry = onCreatePolygon;
        earth.ShapeCreator.Clear();
        depth = parseFloat(pDepth);
        level = parseFloat(pLevel);
        earth.ShapeCreator.CreatePolygon();
    };
    /**
     * 删除临时地形
     */
    var deleteTempTerrainAnaly = function () {
        if (excaveBalloon) {
            excaveBalloon.DestroyObject();
            excaveBalloon = null;
        }
        earth.ShapeCreator.Clear();
        earth.TerrainManager.ClearTempLayer();
        if (tempClipGuid != null) {
            earth.TerrainManager.DeletePolygonByGUID(tempClipGuid);
            tempClipGuid = null;
        }
        if (_result) {
            _result.ClearRes();
            _result = null;
        }
        if (clipModelList.length > 0) {
            for (var i = 0; i < clipModelList.length; i++) {
                var tempClipModel = clipModelList[i];
                if (tempClipModel != null) {
                    earth.DetachObject(tempClipModel);
                    tempClipModel = null;
                }
            }
        }
        clipModelList.splice(0, clipModelList.length);
        if (tempClipLayer != null) {
            earth.DetachObject(tempClipLayer);
            tempClipLayer = null;
        }

        tempClipLayersList.splice(0, tempClipLayersList.length);
    };
    /**
     * 隐藏临时地形
     */
    var hideTempTerrain = function () {
        var toolItem = $("div[tag=EditHideTempTerrain]");
        toolItem.toggleClass("selected");
        if (toolItem.hasClass("selected")) {
            setClipTerrainVis(false);
        } else {
            setClipTerrainVis(true);
        }
    };

    /**
     * 设置地形的可见性
     */
    var setClipTerrainVis = function (visibility) {
        for (var i = 0; i < clipModelList.length; i++) {
            var tempClipModel = clipModelList[i];
            tempClipModel.Visibility = visibility;
        }
        if (visibility == true) {
            earth.AttachObject(tempClipLayer);
        } else {
            earth.DetachObject(tempClipLayer);
        }
    };

    /**
     * 删除临时地形
     */
    var deleteTempTerrain = function () {
        if (earth && earth.ShapeCreator) {
            earth.ShapeCreator.Clear();
        }
        if (earth && earth.TerrainManager) {
            earth.TerrainManager.ClearTempLayer();
        }

        if (_result) {
            _result.ClearRes();
            _result = null;
        }
        if (clipModelList.length > 0) {
            for (var i = 0; i < clipModelList.length; i++) {
                var tempClipModel = clipModelList[i];
                if (tempClipModel != null) {
                    earth.DetachObject(tempClipModel);
                    deleteClipTerrainNode(tempClipModel.Guid);
                    tempClipModel = null;
                }
            }
        }
        clipModelList.splice(0, clipModelList.length);
        if (tempClipLayer != null) {
            earth.DetachObject(tempClipLayer);
            tempClipLayer = null;
        }

        tempClipLayersList.splice(0, tempClipLayersList.length);
        $("div[tag=EditHideTempTerrain]").attr("disabled", true);
        $("div[tag=EditDeleteTempTerrain]").attr("disabled", true);
        var toolItem = $("div[tag=EditHideTempTerrain]");
        if (toolItem.hasClass("selected")) {
            toolItem.removeClass("selected");
        }
    };

    /**
     * 功能：保存开挖信息信息
     * 参数：docXml-要保存的开挖信息信息
     * 返回：无
     */
    var saveClipTerrainFile = function (docXml) {
        var savePath = earth.Environment.RootPath + "temp\\clipterrain";
        earth.UserDocument.SaveXmlFile(savePath, docXml);
    };

    /**
     * 功能：创建开挖信息文档
     * 参数：无
     * 返回：新建创建的文档内容
     */
    var createClipTerrainFile = function () {
        var xmlStr = '<xml></xml>';
        saveClipTerrainFile(xmlStr);
        return xmlStr;
    };

    /**
     * 功能：获取开挖信息文档对象
     * 参数：无
     * 返回：开挖信息文档对象
     */
    var getClipTerrainFile = function () {
        var loadPath = earth.Environment.RootPath + "temp\\clipterrain.xml";
        var docXml = earth.UserDocument.LoadXmlFile(loadPath);
        if ((docXml == null) || (docXml == "")) {
            docXml = createClipTerrainFile();
        }
        var clipTerrainDoc = loadXMLStr(docXml);
        return clipTerrainDoc;
    };

    /**
     * 功能：创建开挖对象节点
     * 参数：id-开挖的模型对象的编号；name-开挖的模型对象的名称；minLevel-开挖地形的最小级别；clipVec3s-开挖地形的范围点集
     * 返回：开挖对象节点
     */
    var createClipTerrainNode = function (id, name, minLevel, clipVec3s) {
        var attrArr = [
            {name: "id", value: id},
            {name: "name", value: name}
        ];
        var clipCoordinate = "";
        for (var i = 0; i < clipVec3s.Count; i++) {
            var pt = clipVec3s.Items(i);
            if (clipCoordinate == "") {
                clipCoordinate = pt.X + "," + pt.Y + "," + pt.Z;
            } else {
                clipCoordinate = clipCoordinate + "," + pt.X + "," + pt.Y + "," + pt.Z;
            }
        }
        var clipTerrainDoc = TerrainExcavate.clipTerrainDoc;
        var clipTerrainNode = createElementNode("ClipTerrain", attrArr, clipTerrainDoc);
        clipTerrainNode.appendChild(createElementText("ClipCoordinate", clipCoordinate, clipTerrainDoc));
        clipTerrainNode.appendChild(createElementText("MinClipLevel", minLevel, clipTerrainDoc));
        clipTerrainDoc.documentElement.appendChild(clipTerrainNode);
        saveClipTerrainFile(clipTerrainDoc.xml);
        return clipTerrainNode;
    };

    /**
     * 功能：删除开挖对象节点
     * 参数：id-开挖的ID编号
     * 返回：无
     */
    var deleteClipTerrainNode = function (id) {
        var clipTerrainNode = lookupNodeById(TerrainExcavate.clipTerrainDoc, id);
        clipTerrainNode.parentNode.removeChild(clipTerrainNode);
        saveClipTerrainFile(TerrainExcavate.clipTerrainDoc.xml);
    };

    /**
     * 功能：初始化开挖列表，从开挖文档中读取信息并将信息转化成开挖对象
     * 参数：clipTerrainDoc-开挖文档对象
     * 返回：无
     */
    var initClipTerrainObj = function (clipTerrainDoc) {
        var clipTerrainRoot = clipTerrainDoc.documentElement;
        for (var i = 0; i < clipTerrainRoot.childNodes.length; i++) {
            var clipTerrainNode = clipTerrainRoot.childNodes[i];
            var id = clipTerrainNode.getAttribute("id");
            var name = clipTerrainNode.getAttribute("name");
            var clipCoordinate = clipTerrainNode.selectSingleNode("ClipCoordinate").text;
            var minClipLevel = parseFloat(clipTerrainNode.selectSingleNode("MinClipLevel").text);
            var vec3s = earth.Factory.CreateVector3s();
            var clipCoordArr = clipCoordinate.split(",");
            for (var k = 0; k < clipCoordArr.length; k = k + 3) {
                vec3s.Add(clipCoordArr[k], clipCoordArr[k + 1], clipCoordArr[k + 2]);
            }
            earth.TerrainManager.SetMinClipLevel(minClipLevel);
            if (checkExcave1) {
                tempClipGuid = earth.Factory.CreateGUID();
                earth.TerrainManager.ClipTerrainByPolygonEx(tempClipGuid, vec3s);
            } else {
                earth.TerrainManager.ClipTerrainByPolygon(vec3s);
            }
            createNewLayer();
            createClipModel(vec3s, id, name);
        }

        if (clipModelList.length > 0) {
            $("div[tag=EditHideTempTerrain]").attr("disabled", false);
            $("div[tag=EditDeleteTempTerrain]").attr("disabled", false);
        }
    };

    TerrainExcavate.roadClip = roadClip;
    TerrainExcavate.customClip = customClip;
    TerrainExcavate.roadClipAnaly = roadClipAnaly;
    TerrainExcavate.customClipAnaly = customClipAnaly;
    TerrainExcavate.deleteTempTerrainAnaly = deleteTempTerrainAnaly;
    TerrainExcavate.highlightObjectFromTunnel = highlightObjectFromTunnel;
    TerrainExcavate.hideTempTerrain = hideTempTerrain;
    TerrainExcavate.deleteTempTerrain = deleteTempTerrain;
    TerrainExcavate.clipTerrainDoc = null;
    TerrainExcavate.getClipTerrainFile = getClipTerrainFile;
    TerrainExcavate.initClipTerrainObj = initClipTerrainObj;
    TerrainExcavate.roadAnalysis = roadAnalysis;
    TerrainExcavate.importClipAnaly = importClipAnaly;
    TerrainExcavate.getResultArr = getResultArr;
    TerrainExcavate.clearHighLight = clearHighLight;
})();