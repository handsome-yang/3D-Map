var CreateTunnel = {};
(function () {
    var width = null;
    var height = null;
    var altitude = 0;
    var radius = null;
    var deep = null;
    var value = null;
    var mModelObj = null;
    var tempLayer = null;
    var resultAlt = null;
    var resultSize = null;
    var imgLocation = "http://" + getRootPath() + "/image/PipeMaterial/",
        sideTexturePath = imgLocation + "tunnel.jpg";
    //创建新的图层
    var layersList = [];
    var createNewLayer = function () {
        var tempDemPath = earth.Environment.RootPath + "\\temp\\terrain\\";
        var rect = earth.TerrainManager.GetTempLayerRect();
        var levelMin = earth.TerrainManager.GetTempLayerMinLevel();
        var levelMax = earth.TerrainManager.GetTempLayerMaxLevel();

        var guid = earth.Factory.CreateGUID();
        tempLayer = earth.Factory.CreateDemLayer(guid, "TempTerrainLayer", tempDemPath,
            rect, levelMin, levelMax, 1000);
        earth.AttachObject(tempLayer);
        layersList.push(tempLayer);
    };
    //创建模型
    var modelList = [];
    var createModel = function (args, modelGuid, name) {
        var terrain = earth.TerrainManager;
        if (modelGuid == null) {
            modelGuid = earth.Factory.CreateGUID();
        }
        if (value == "0") {
            if (name == null) {
                name = "RectTunnel";
            }
            mModelObj = terrain.GenerateTunnel(modelGuid, name, args, width, height, sideTexturePath, false);
        } else if (value == "1") {
            if (name == null) {
                name = "RoundTunnel";
            }
            mModelObj = terrain.GenerateRoundTunnel(modelGuid, name, args, radius, 24, sideTexturePath, false);
        } else if (value == "2") {
            if (name == null) {
                name = "ArchTunnel";
            }
            mModelObj = terrain.GenerateArchTunnel(modelGuid, name, args, radius, height, sideTexturePath, false);
        }
        modelList.push(mModelObj);
        earth.AttachObject(mModelObj);
        if (mModelObj) {
            analysisRS.removeAttr("disabled");
        }
    };
    //获取项目路径
    function getRootPath() {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return (localhost + projectName);
    }

    //创建隧道
    var pipelineList = [];
    var projectId = "";
    var resultHtml = "";
    var resultArr = [];
    var showRS = null;
    var importRS = null;
    var analysisRS = null;
    var createTunnel = function (tWidth, tHeight, dist, tDeep, val, proId, tbResult, showR, importR, analysisR) {
        analysisRS = analysisR;
        showRS = showR;
        importRS = importR;
        resultArr = [];
        clearTunnelAnaly();
        resultHtml = tbResult;
        projectId = proId;
        analysisRS.attr("disabled", "disabled");
        var layer = earth.LayerManager.GetLayerByGUID(proId);
        pipelineList = top.SystemSetting.getPipeListByLayer(layer);

        if (pipelineList == null) {
            return;
        }

        width = tWidth;
        height = tHeight;
        radius = dist;
        deep = tDeep;
        value = val;
        earth.TerrainManager.ClearTempLayer();
        earth.ToolManager.SphericalObjectEditTool.Browse();
        earth.Event.OnCreateGeometry = onCreateTunnel;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreatePolyline(2, 4294967040);
    };
    var tdeep = 0;
    var terrainVec3s = null;
    var gRadius = 0; //拱形半径
    var onCreateTunnel = function (pFeature) {
        earth.ShapeCreator.Clear();
        earth.OnCreateGeometry = function () {
        };
        var pntNum = pFeature.Count;
        var pointsArr = earth.Factory.CreateGeoPoints();
        for (var i = 0; i < pntNum; i++) {
            if (value === "0") { //矩形
                pointsArr.Add(pFeature.Items(i).X, pFeature.Items(i).Y, pFeature.Items(i).Z - deep - height / 2);
                pFeature.SetAt(i, pFeature.Items(i).X, pFeature.Items(i).Y, pFeature.Items(i).Z - deep - height / 2);
                tdeep = pFeature.Items(i).Z - height / 2;
                altitude = pFeature.Items(i).Z - deep - height / 2;
            } else if (value === "1") {
                pointsArr.Add(pFeature.Items(i).X, pFeature.Items(i).Y, pFeature.Items(i).Z - deep - radius);
                pFeature.SetAt(i, pFeature.Items(i).X, pFeature.Items(i).Y, pFeature.Items(i).Z - deep - radius);
                tdeep = pFeature.Items(i).Z - radius;
                altitude = pFeature.Items(i).Z - deep - radius;
            } else if (value === "2") {
                gRadius = radius / 2 * (Math.pow(2, 0.5) - 1);//拱形半径
                pointsArr.Add(pFeature.Items(i).X, pFeature.Items(i).Y, pFeature.Items(i).Z - deep - gRadius - height / 2);
                pFeature.SetAt(i, pFeature.Items(i).X, pFeature.Items(i).Y, pFeature.Items(i).Z - deep - gRadius - height / 2);
                tdeep = pFeature.Items(i).Z - height / 2;
                altitude = pFeature.Items(i).Z - deep - height / 2;
            }
        }
        if (pntNum <= 1) {
            return;
        }
        createNewLayer();
        createModel(pFeature);

        var bufferedPts = earth.GeometryAlgorithm.CreatePolygonFromPolylineAndWidth(pointsArr, width * 0.5, width * 0.5);
        var vec3s = earth.Factory.CreateVector3s();
        for (i = 0; i < bufferedPts.Count; i++) {
            var pt = bufferedPts.GetPointAt(i);
            vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude);
        }
        terrainVec3s = vec3s;


        $("div[tag=EditHidenTunnel]").attr("disabled", false);
        $("div[tag=EditClearTunnel]").attr("disabled", false);
    };
    var analysisTerrain = function () {
        resultArr = [];
        resultAlt = new ActiveXObject("Scripting.Dictionary");
        resultSize = new ActiveXObject("Scripting.Dictionary");
        var ary = [1, 0];
        $.each(pipelineList, function (i, v) {
            var vv = $(v);
            var guid = vv[0].id;  // checkbox的value值
            var name = vv[0].name;
            var layer = earth.LayerManager.GetLayerByGUID(guid);
            var subLayer = null;
            for (var x = 0, len = layer.GetChildCount(); x < len; x++) {
                subLayer = layer.GetChildAt(x);
                if (subLayer.LayerType == "Container" || subLayer.LayerType === "Model_container") {  // 使用具体的_container图层
                    break;
                }
            }
            if (subLayer == null || subLayer.QueryParameter == null) {
                return;
            }
            var param = subLayer.QueryParameter;
            param.Filter = "";
            param.QueryType = 17;   
            param.SetSpatialFilter(terrainVec3s);
            param.PageRecordCount = 200;//设置每页返回的最大数目
            for (var k = 0; k < ary.length; k++) {
                param.QueryTableType = ary[k];
                var result = subLayer.SearchFromGISServer();
                if (result.RecordCount > 0) {
                    parseResult(result.GotoPage(0), guid, name, layer.PipeLineType);
                }
            }
        });
        showResultPage(1);
    };

    /**
     * 计算高程值
     * @param alt 管径高度
     * @param us_salt 起点高程
     * @param us_ealt 终点高程
     * @param coordsPts 坐标点
     * @param records 查询结果
     * @param type 类型（管线或管点）
     * @param displayType 展示类型（管线或管点）
     * @param guid 管GUID
     * @param name 管NAME
     * @param nameType 管线为1，管点为0
     * @param isPAISHUI 是否是排水管
     */
    var mergeAlt = function (alt, us_salt, us_ealt, coordsPts, records, type, displayType, guid, name, nameType, isPAISHUI) {
        var saltpipeSize;
        var ealtpipeSize;
        var saltpipeSize2;
        var ealtpipeSize2;
        if (isPAISHUI) {//如果是排水，us_salt和us_ealt都是管底
            //起点管顶z值
            saltpipeSize = us_salt + parseFloat(alt) * 0.001;
            ealtpipeSize = us_ealt + parseFloat(alt) * 0.001;
            saltpipeSize2 = us_salt;
            ealtpipeSize2 = us_ealt;
        } else {//非排水，us_salt和us_ealt都是管顶
            //起点管顶z值
            saltpipeSize = us_salt;
            ealtpipeSize = us_ealt;
            saltpipeSize2 = us_salt - parseFloat(alt) * 0.001;
            ealtpipeSize2 = us_ealt - parseFloat(alt) * 0.001;
        }
        //起点坐标
        var bVect = earth.Factory.CreateVector3();
        bVect.X = coordsPts[0];
        bVect.Y = coordsPts[1];
        bVect.Z = saltpipeSize;
        //止点坐标
        var eVect = earth.Factory.CreateVector3();
        eVect.X = coordsPts[3];
        eVect.Y = coordsPts[4];
        eVect.Z = ealtpipeSize;

        //二次计算判断
        var bVect2 = earth.Factory.CreateVector3();
        bVect2.X = coordsPts[0];
        bVect2.Y = coordsPts[1];
        bVect2.Z = saltpipeSize2;
        //止点坐标
        var eVect2 = earth.Factory.CreateVector3();
        eVect2.X = coordsPts[3];
        eVect2.Y = coordsPts[4];
        eVect2.Z = ealtpipeSize2;

        //一次计算判断
        var isAdd = false;
        var relationship_top = earth.PolygonAlgorithm.LineVolumeRelationship(bVect, eVect, mModelObj);
        if (relationship_top == 0 || relationship_top == 1) {//线在体内或者相交
            var key = records[parent.getName("US_KEY", nameType, true)];
            resultArr.push({record: records, name: name, guid: guid, key: key, type: type, displayType: displayType});
            isAdd = true;
            return;
        }
        var relationShip_btm = earth.PolygonAlgorithm.LineVolumeRelationship(bVect2, eVect2, mModelObj);
        if (relationShip_btm == 0 || relationShip_btm == 1) {
            var key = records[parent.getName("US_KEY", nameType, true)];
            resultArr.push({record: records, name: name, guid: guid, key: key, type: type, displayType: displayType});
            isAdd = true;
        }
    };

    /**
     * 解析查询结果，添加到结果表格中
     * @param result 查询结果
     * @param guid 图层ID
     * @param name 图层名
     */
    var parseResult = function (result, guid, name, pipeType) {
        if (result == "" || result == null) {
            return;
        }
        var json = $.xml2json(result);
        var type = json.Result.geometry;
        var displayType = type === "point" ? "管点" : "管线";
        type = type === "point" ? "point" : "line";
        var nameType = 1;
        var records = json.Result.Record;
        if (json.Result.num <= 0) {
            return;
        } else if (json.Result.num == 1) {
            records = [records];
        }
        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            var alt;
            if (displayType === "管线") {
                //起点高程
                var us_ealt = parseFloat(record[parent.getName("US_SALT", nameType, true)]);
                //终点高程
                var us_salt = parseFloat(record[parent.getName("US_EALT", nameType, true)]);
                //起点编号
                var startKey = record[parent.getName("US_SPT_KEY", nameType, true)];
                //止点编号
                var endKey = record[parent.getName("US_EPT_KEY", nameType, true)];
                resultAlt.item(startKey) = us_ealt;
                resultAlt.item(endKey) = us_salt;
                var usSize = parent.getName("US_SIZE", 1, true);
                var pipeSize = record[usSize];
                //获取管线两边管点的xy坐标值
                var coords = record.SHAPE.Polyline.Coordinates;
                var coordsPts = coords.split(",");
                resultSize.item(startKey) = pipeSize;
                resultSize.item(endKey) = pipeSize;

                if (pipeType >= 4000 && pipeType <= 4306) {//排水
                    //针对排水类的管线 起点高程与止点高程都是相对于管底 
                    //判断方管与圆管
                    if (pipeSize.indexOf("X") == -1) {
                        mergeAlt(pipeSize, us_ealt, us_salt, coordsPts, record, type, displayType, guid, name, nameType, true);
                    } else {//方管
                        var pipeHeight = pipeSize.split("X")[1];
                        mergeAlt(pipeHeight, us_ealt, us_salt, coordsPts, record, type, displayType, guid, name, nameType, true);
                    }
                } else {
                    //非排水类管线
                    if (pipeSize.indexOf("X") == -1) {
                        mergeAlt(pipeSize, us_ealt, us_salt, coordsPts, record, type, displayType, guid, name, nameType, false);
                    } else {//方管
                        var pipeHeight = pipeSize.split("X")[1];
                        mergeAlt(pipeHeight, us_ealt, us_salt, coordsPts, record, type, displayType, guid, name, nameType, false);
                    }
                }
            } else {
                //管点 采用模拟的方式 利用最短线来代替点 修改一下z值 作为两个点 代入LineVolumeRelationship算法
                nameType = 0;
                var ptUSSize = 0;
                var key = record[parent.getName("US_KEY", nameType, true)];
                //获取管点的高程值
                var ptAlt = resultAlt.item(key);
                if (ptAlt) {
                    alt = parseFloat(ptAlt);
                } else {
                    //如果只有管点返回 没有查询到管线数据 则这里需要单独发个请求 获取管点的高程值 TODO:...
                    alt = 0;
                }
                var usSize = resultSize.item(key);
                if (usSize) {
                    if (usSize.indexOf("X") == -1) {
                        ptUSSize = parseFloat(usSize) * 0.001;
                    } else {
                        var pipeHeight = usSize.split("X")[1];
                        ptUSSize = parseFloat(pipeHeight) * 0.001;
                    }
                } else {
                    //从管线属性里获取...TODO:...
                }
                var coords = record.SHAPE.Point.Coordinates.split(",");
                var bVect = earth.Factory.CreateVector3();
                bVect.X = coords[0];
                bVect.Y = coords[1];
                bVect.Z = alt + ptUSSize;
                var eVect = earth.Factory.CreateVector3();
                eVect.X = coords[0];
                eVect.Y = coords[1];
                eVect.Z = alt - ptUSSize;
                var relationShip = earth.PolygonAlgorithm.LineVolumeRelationship(bVect, eVect, mModelObj);
                if (relationShip == 0 || relationShip == 1) {
                    resultArr.push({
                        record: record,
                        name: name,
                        guid: guid,
                        key: key,
                        type: type,
                        displayType: displayType
                    });
                    return;
                }
            }
        }
        
    };
    var pageNum = 0;
    var showResultPage = function (page) {
        highlightObjectList = [];
        pageNum = page;
        resultHtml.empty();
        var template = '<tr ondblclick=highlightExcaveObject("$LayerID","$TYPE","$GUID","$KEY","$DISPLAYTYPE")' +
            '><td class="col">$INDEX</td><td class="col">$DISPLAYTYPE2</td><td class="col">$LAYER</td></tr>';
        var nameType = 1;
        for (var i = 0; i < resultArr.length; i++) {
            if (i > resultArr.length - 1) {
                resultHtml.append("");
            } else {
                if (resultArr[i].displayType === "管线") {
                    nameType = 1;
                } else {
                    nameType = 0;
                }
                resultHtml.append(template.replace("$INDEX", resultArr[i].record[parent.getName("US_KEY", nameType, true)])
                    .replace("$DISPLAYTYPE", resultArr[i].record[parent.getName("US_FEATURE", nameType, true)] ? resultArr[i].record[parent.getName("US_FEATURE", nameType, true)] : resultArr[i].displayType)
                    .replace("$DISPLAYTYPE2", resultArr[i].record[parent.getName("US_FEATURE", nameType, true)] ? resultArr[i].record[parent.getName("US_FEATURE", nameType, true)] : resultArr[i].displayType)
                    .replace("$LAYER", resultArr[i].name)
                    .replace("$LayerID", resultArr[i].guid)
                    .replace("$TYPE", resultArr[i].type)
                    .replace("$GUID", resultArr[i].record[parent.getName("US_KEY", nameType, true)])
                    .replace("$KEY", resultArr[i].record[parent.getName("US_KEY", nameType, true)]));
            }
            var obj = {};
            obj.layerId = resultArr[i].guid;
            obj.type = resultArr[i].type;
            obj.guid = null;
            obj.key = resultArr[i].key;
            highlightObjectList.push(obj);
        }
        showRS.attr("disabled", false);
        importRS.attr("disabled", false);
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
    highlightExcaveObject = function (layerID, type, guid, key, flag) {
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            chkTag = "true";
        }
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var i = 0;
        var subLayer = null;
        var searchResult = null;
        var obj = null;
        for (i = 0; i < layer.GetChildCount(); i++) {
            subLayer = layer.GetChildAt(i);
            if (type === "point") {
                if (subLayer.LayerType === "Container" || subLayer.LayerType === "Vector" || subLayer.LayerType === "Model_container") continue;
            } else if (type === "line") {
                if ((subLayer.LayerType !== "Container" && subLayer.layerType !== "Container_Og" && subLayer.LayerType !== "Model_container") || subLayer.LayerType === "Vector") continue;
            }
            var dt = subLayer.LocalSearchParameter.ReturnDataType;
            subLayer.LocalSearchParameter.ClearSpatialFilter();
            subLayer.LocalSearchParameter.ReturnDataType = parent.localSearchDataType.xml;
            subLayer.LocalSearchParameter.PageRecordCount = 100;
            subLayer.LocalSearchParameter.SetFilter(key, "");
            subLayer.LocalSearchParameter.HasDetail = false;
            subLayer.LocalSearchParameter.HasMesh = false;
            searchResult = subLayer.SearchFromLocal();
            subLayer.LocalSearchParameter.ReturnDataType = dt;

            if (searchResult.RecordCount < 1) {
                continue;
            } else {
                subLayer.LocalSearchParameter.ReturnDataType = parent.localSearchDataType.xml;
                obj = filterByKey(searchResult, key);
                subLayer.LocalSearchParameter.ReturnDataType = dt;
                if (obj != null) {
                    var vecCenter = obj.SphericalTransform;
                    northArr.push(obj.GetLonLatRect().North);
                    southArr.push(obj.GetLonLatRect().South);
                    eastArr.push(obj.GetLonLatRect().East);
                    westArr.push(obj.GetLonLatRect().West);
                    earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude + 30, 0.0, 89.0, 0, 4);
                    if (chkTag === "true") {
                        if (flag === "true") {
                            obj.HightLightIsFlash(false);
                            obj.ShowHighLight();
                        } else {
                            if (chkArr && chkArr.length > 0) {
                                var ck = true;
                                for (var j = 0; j < chkArr.length; j++) {
                                    if (chkArr[j].key === obj.GetKey()) {
                                        ck = false;
                                        obj.HightLightIsFlash(true);
                                        setTimeout(function () {
                                            obj.HightLightIsFlash(false);
                                            obj.ShowHighLight();
                                        }, 100);
                                    }
                                }
                                if (ck) {
                                    obj.HightLightIsFlash(true);
                                    obj.ShowHighLight();
                                }
                            } else {
                                obj.HightLightIsFlash(true);
                                obj.ShowHighLight();
                            }
                        }
                    } else {
                        clearHighLight();
                        obj.HightLightIsFlash(true);
                        obj.ShowHighLight();
                        dbClickHighLight.splice(0, 1);
                        dbClickHighLight.push(obj);
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
                            var filed = parent.getName("US_KEY", bLine, true);
                            var strPara2 = "(and,equal," + filed + "," + key + ")"; // + "&pg=0,30";
                            var param = layer2.QueryParameter;
                            param.Filter = strPara2;
                            param.QueryType = 16;  
                            param.QueryTableType = bLine;
                            param.PageRecordCount = 1;
                            var result = layer2.SearchFromGISServer();
                            if (result.RecordCount > 0) {
                                var currentRecord = parent.$.xml2json(result.gotoPage(0)).Result.Record;
                                if (currentRecord == null || currentRecord == undefined) {
                                    top.LayerManagement.clearHtmlBalloons();
                                    return;
                                }
                                if (top.SYSTEMPARAMS.balloonAlpha > 0) {
                                    htmlStr = '<div style="word-break:keep-all;white-space:nowrap;overflow:auto;width:265px;height:310px;margin-top:25px;margin-bottom:25px"><table style="font-size:16px;background-color: #ffffff; color: #fffffe">';
                                } else {
                                    htmlStr = '<div style="word-break:keep-all;font-family:Microsoft Yahei;border:1px solid #ccc;white-space:nowrap;overflow:auto;width:255px;height:275px;margin-top:15px;margin-bottom:15px"><table style="font-size:16px;background-color: #fff; color: black">';
                                }
                                var mid;
                                if (type != "line") {
                                    initPointValue(layerID, currentRecord, parentLayerName, obj);
                                }
                                else {
                                    mid = initLineValue(layerID, currentRecord, parentLayerName);
                                    htmlStr = htmlStr + mid + '</table></div>';
                                    var vecCenter = obj.SphericalTransform;
                                    top.LayerManagement.showHtmlBalloon(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, htmlStr);
                                }
                            }
                        }
                    }

                    hideHigh.push(obj);
                    return;
                }
            }

        }
        if (obj == null && type === "point") {
            clearHighLight();
            StatisticsMgr.sphereGotoLookat(guid, subLayer, layerID, key, bShow, null, null);
        }
    };

    ///////////////////////////////////////////////////////////
    //  双击获取属性
    //////////////////////////////////////////////////////////
    function getPlaneCoordinates(layerID, data, usKey) {
        var Record = null;
        var jsonData = $.xml2json(data);
        var us_key = parent.getName("US_KEY", 0, true);
        if (jsonData == null || !jsonData.Result || jsonData.Result.num == 0) {
            return;
        } else if (jsonData.Result.num == 1) {
            Record = jsonData.Result.Record;
            if (jsonData.Result.Record[us_key] != usKey) {
                return false;
            }
        } else if (jsonData.Result.num > 1) {
            for (var i = 0; i < jsonData.Result.num; i++) {
                if (jsonData.Result.Record[i][us_key] != usKey) {
                    continue;
                } else {
                    Record = jsonData.Result.Record[i];
                }
            }
        }
        var Coordinates = Record.SHAPE.Point.Coordinates;
        var coord = Coordinates.split(" ");
        var coordinate1 = coord[0].split(",");
        var Coordinate = transformToPlaneCoordinates(layerID, coordinate1);
        return Coordinate;
    }

    function transformToPlaneCoordinates(layerId, coord) {
        var datum = parent.SYSTEMPARAMS.pipeDatum;
        var v3s1 = datum.des_BLH_to_src_xy(coord[0], coord[1], coord[2]);//经纬度转平面坐标
        return {datumCoord: v3s1, originCoord: coord};
    }

    var initPointValue = function (layerID, record, layerName, obj) {
        var strKey = record[parent.getName("US_KEY", 0, true)];
        var v3s = null;
        var us_key = parent.getName("US_KEY", 0, true);
        var strPara = "(and,equal," + us_key + ",";
        strPara += strKey;
        strPara += ")";
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var strConn = layer.GISServer + "dataquery?service=" + layerID + "&qt=17&dt=point&pc=" + strPara + "&pg=0,100";
        earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
            if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                var xmlStr = pRes.AttributeName;
                var xmlDoc = loadXMLStr(xmlStr);
                v3s = getPlaneCoordinates(layerID, xmlDoc, strKey);
                var tv3s = v3s["datumCoord"];
                originCoord = v3s["originCoord"];
                var X = "";
                var Y = "";
                if (tv3s) {
                    X = (parseFloat(tv3s.X)).toFixed(2);
                    Y = (parseFloat(tv3s.Y)).toFixed(2);
                }

                var us_well = record[parent.getName("US_WELL", 0, true)];
                var fieldArr = [];
                fieldArr = parent.PS2_config.PointProperty.DEFAULTPOINT;
                var str = "";
                for (var i = 0; i < fieldArr.length; i++) {
                    var fieldCaption = parent.getName(fieldArr[i], 0, false);    //显示字段
                    var fieldName = parent.getName(fieldArr[i], 0, true);//数据库字段
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
                        fieldValue = parseFloat(fieldValue).toFixed(2);
                    }
                    str += '<tr><td  width="100">&nbsp;&nbsp;&nbsp;&nbsp;' + fieldCaption + '</td><td>&nbsp;&nbsp;&nbsp;&nbsp;' + fieldValue || "" + '</td></tr>';
                }
                htmlStr = htmlStr + str + '</table></div>';
                if (obj != null) {
                    var vecCenter = obj.SphericalTransform;
                    top.LayerManagement.showHtmlBalloon(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude, htmlStr);
                }
            }
        }
        earth.DatabaseManager.GetXml(strConn);
    };

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
            var fieldCaption = parent.getName(fieldArr[i], 1, false);    //显示字段
            var fieldName = parent.getName(fieldArr[i], 1, true);//数据库字段
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
        if (dbClickHighLight.length > 0) {
            dbClickHighLight[0].StopHighLight();
        }
        StatisticsMgr.detachShere();
    }
    var highlightObjectFromTunnel = function (flag) {
        northArr = [];
        southArr = [];
        eastArr = [];
        westArr = [];
        if (flag) {
            chkTag = "true";
            chkArr = resultArr;
            if (resultArr.length != 0) {
                var nameType = 1;
                for (var i = 0; i < resultArr.length; i++) {
                    if (i === resultArr.length - 1) {
                        showTag = true;
                    }
                    if (resultArr[i].displayType == "管线") {
                        nameType = 1;
                    } else {
                        nameType = 0;
                    }
                    var distype = resultArr[i].record[parent.getName("US_FEATURE", nameType, true)] ? resultArr[i].record[parent.getName("US_FEATURE", nameType, true)] : resultArr[i].displayType;
                    highlightExcaveObject(resultArr[i].guid, resultArr[i].type, resultArr[i].record[parent.getName("US_KEY", nameType, true)], resultArr[i].record[parent.getName("US_KEY", nameType, true)], "true");
                }
            }
        } else {
            showTag = false;
            chkTag = "false";
            if (hideHigh.length != 0) {
                for (var i = 0; i < hideHigh.length; i++) {
                    hideHigh[i].StopHighLight();
                }
            }
        }
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
                obj.Underground = true;   
                return obj;
            }
        }
        return null;
    };
    /**
     *
     * 删除隧道
     */
    var clearTunnel = function () {
        for (var i = 0; i < modelList.length; i++) {
            var mModelObj = modelList[i];
            earth.DetachObject(mModelObj);
            deleteTunnelNode(mModelObj.Guid);
            mModelObj = null;
        }
        modelList.splice(0, modelList.length);

        for (var i = 0; i < layersList.length; i++) {
            var tempLayer = layersList[i];
            earth.DetachObject(tempLayer);
            tempLayer = null;
        }
        layersList.splice(0, layersList.length);

        $("div[tag=EditHidenTunnel]").attr("disabled", true);
        $("div[tag=EditClearTunnel]").attr("disabled", true);
        var toolItem = $("div[tag=EditHidenTunnel]");
        if (toolItem.hasClass("selected")) {
            toolItem.removeClass("selected");
        }
    };
    /**
     *
     * 删除隧道
     */
    var clearTunnelAnaly = function () {
        for (var i = 0; i < modelList.length; i++) {
            var mModelObj = modelList[i];
            earth.DetachObject(mModelObj);
            mModelObj = null;
        }
        modelList.splice(0, modelList.length);

        for (var i = 0; i < layersList.length; i++) {
            var tempLayer = layersList[i];
            earth.DetachObject(tempLayer);
            tempLayer = null;
        }
        layersList.splice(0, layersList.length);


    };
    //隐藏隧道
    var hidenTunnel = function () {
        var toolItem = $("div[tag=EditHidenTunnel]");
        toolItem.toggleClass("selected");
        if (toolItem.hasClass("selected")) {
            for (var i = 0; i < modelList.length; i++) {
                var mModelObj = modelList[i];
                mModelObj.Visibility = false;
            }
            for (var i = 0; i < layersList.length; i++) {
                var tempLayer = layersList[i];
                tempLayer.Visibility = false;
            }
        } else {
            for (var i = 0; i < modelList.length; i++) {
                var mModelObj = modelList[i];
                mModelObj.Visibility = true;
            }
            for (var i = 0; i < layersList.length; i++) {
                var tempLayer = layersList[i];
                tempLayer.Visibility = true;
            }
        }
    };

    /**
     * 功能：保存隧道信息
     * 参数：docXml-要保存的隧道信息
     * 返回：无
     */
    var saveTunnelFile = function (docXml) {
        var savePath = earth.Environment.RootPath + "temp\\tunnel";
        earth.UserDocument.SaveXmlFile(savePath, docXml);
    };

    /**
     * 功能：创建隧道信息文档
     * 参数：无
     * 返回：新建的文档内容
     */
    var createTunnelFile = function () {
        var xmlStr = '<xml></xml>';
        saveTunnelFile(xmlStr);
        return xmlStr;
    };

    /**
     * 功能：获取隧道信息文档对象
     * 参数：无
     * 返回：隧道信息文档对象
     */
    var getTunnelFile = function () {
        var loadPath = earth.Environment.RootPath + "temp\\tunnel.xml";
        var docXml = earth.UserDocument.LoadXmlFile(loadPath);
        if ((docXml == null) || (docXml == "")) {
            docXml = createTunnelFile();
        }
        var tunnelDoc = loadXMLStr(docXml);
        return tunnelDoc;
    };

    /**
     * 功能：创建隧道节点
     * 参数：id-隧道模型对象的编号；name-隧道模型对象的名称；tunnelType-隧道的类型；width-隧道的宽度；height-隧道的高度；radius-隧道的半径；tunnelVec3s-创建隧道的点集
     * 返回：隧道节点
     */
    var createTunnelNode = function (id, name, tunnelType, width, height, radius, tunnelVec3s) {
        var attrArr = [
            {name: "id", value: id},
            {name: "name", value: name}
        ];
        var tunnelCoordinate = "";
        for (var i = 0; i < tunnelVec3s.Count; i++) {
            var pt = tunnelVec3s.Items(i);
            if (tunnelCoordinate == "") {
                tunnelCoordinate = pt.X + "," + pt.Y + "," + pt.Z;
            } else {
                tunnelCoordinate = tunnelCoordinate + "," + pt.X + "," + pt.Y + "," + pt.Z;
            }
        }
        var tunnelDoc = CreateTunnel.tunnelDoc;
        var tunnelNode = createElementNode("ElementTunnel", attrArr, tunnelDoc);
        tunnelNode.appendChild(createElementText("TunnelType", tunnelType, tunnelDoc));
        if (tunnelType == 0) { //矩形隧道
            tunnelNode.appendChild(createElementText("Width", width, tunnelDoc));
            tunnelNode.appendChild(createElementText("Height", height, tunnelDoc));
        } else if (tunnelType == 1) { //圆形隧道
            tunnelNode.appendChild(createElementText("Radius", radius, tunnelDoc));
        } else if (tunnelType == 2) { //拱形隧道
            tunnelNode.appendChild(createElementText("Radius", radius, tunnelDoc));
            tunnelNode.appendChild(createElementText("Height", height, tunnelDoc));
        }
        tunnelNode.appendChild(createElementText("TunnelCoordinate", tunnelCoordinate, tunnelDoc));
        tunnelDoc.documentElement.appendChild(tunnelNode);
        saveTunnelFile(tunnelDoc.xml);
        return tunnelNode;
    };

    /**
     * 功能：删除隧道对象节点
     * 参数：id-隧道的ID编号
     * 返回：无
     */
    var deleteTunnelNode = function (id) {
        var tunnelNode = lookupNodeById(CreateTunnel.tunnelDoc, id);
        tunnelNode.parentNode.removeChild(tunnelNode);
        saveTunnelFile(CreateTunnel.tunnelDoc.xml);
    };

    /**
     * 功能：初始化隧道列表，从隧道文档中读取信息并将信息转化成隧道对象
     * 参数：tunnelDoc-隧道文档对象
     * 返回：无
     */
    var initTunnelObj = function (tunnelDoc) {
        var tunnelRoot = tunnelDoc.documentElement;
        for (var i = 0; i < tunnelRoot.childNodes.length; i++) {
            var tunnelNode = tunnelRoot.childNodes[i];
            var id = tunnelNode.getAttribute("id");
            var name = tunnelNode.getAttribute("name");
            var tunnelCoordinate = tunnelNode.selectSingleNode("TunnelCoordinate").text;
            var vec3s = earth.Factory.CreateVector3s();
            var tunnelCoordArr = tunnelCoordinate.split(",");
            for (var k = 0; k < tunnelCoordArr.length; k = k + 3) {
                vec3s.Add(parseFloat(tunnelCoordArr[k]), parseFloat(tunnelCoordArr[k + 1]), parseFloat(tunnelCoordArr[k + 2]));
            }
            var widthNode = tunnelNode.selectSingleNode("Width");
            if (widthNode != null) {
                width = parseFloat(widthNode.text);
            }
            var heightNode = tunnelNode.selectSingleNode("Height");
            if (heightNode != null) {
                height = parseFloat(heightNode.text);
            }
            var radiusNode = tunnelNode.selectSingleNode("Radius");
            if (radiusNode != null) {
                radius = parseFloat(radiusNode.text);
            }
            value = tunnelNode.selectSingleNode("TunnelType").text;
            createNewLayer();
            createModel(vec3s, id, name);
        }

        if (modelList.length > 0) {
            $("div[tag=EditHidenTunnel]").attr("disabled", false);
            $("div[tag=EditClearTunnel]").attr("disabled", false);
        }
    };

    CreateTunnel.createTunnel = createTunnel;
    CreateTunnel.clearTunnel = clearTunnel;
    CreateTunnel.hidenTunnel = hidenTunnel;
    CreateTunnel.clearTunnelAnaly = clearTunnelAnaly;
    CreateTunnel.analysisTerrain = analysisTerrain;
    CreateTunnel.clearHighLight = clearHighLight;
    CreateTunnel.tunnelDoc = null;
    CreateTunnel.getTunnelFile = getTunnelFile;
    CreateTunnel.initTunnelObj = initTunnelObj;
    CreateTunnel.highlightObjectFromTunnel = highlightObjectFromTunnel;
})();