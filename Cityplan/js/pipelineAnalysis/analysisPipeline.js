/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：智能排管
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
var earth = null;
$(function () {

    setDivHeight();

    earth = top.LayerManagement.earth;
    var projectId = top.SYSTEMPARAMS.project;
    var layer = earth.LayerManager.GetLayerByGUID(projectId);
    var clipModelList = [];
    var tempClipLayersList = [];
    var pipelineObj = [];
    var pipepointObj;
    // 判断输入框值域是否合法
    var validation = function () {
        var d = $("#deep").val();
        var s = $("#specification").val();
        var reg = /^\d+(X\d+)?$/;
        if (isNaN(d) || !reg.test(s) || s == 0) {//如果不合法 按钮置灰
            $("#btnCreate").attr("disabled", true);
        } else {
            $("#btnCreate").attr("disabled", false);
        }
        var depth = $("#depth").val();
        if (Number(depth) && Number(depth) != 0) {
            $("#customClip").attr("disabled", false);
        } else {
            $("#customClip").attr("disabled", true);
        }
    };
    // 【规格】键盘事件
    $("#specification").keyup(function () {
        var thisValue = $("#specification").val();
        thisValue = thisValue.replace(/[^0-9X]/g,'');
        $("#specification").val(thisValue);
        validation();
    });
    // 【创建】按钮
    $("#btnCreate").click(function () {
        $("#analysis").attr("disabled", true);
        $("#move").attr("disabled", true);
        $("#rotate").attr("disabled", true);
        analysisClearBuffer();
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        if (pipelineObj.length > 0) {
            for (var i = 0; i < pipelineObj.length; i++) {
                earth.DetachObject(pipelineObj[i]);
            }
            pipelineObj = [];
        }
        earth.ToolManager.SphericalObjectEditTool.Browse();
        earth.Event.OnCreateGeometry = onCreatePipeline;
        earth.ShapeCreator.Clear();
        earth.ShapeCreator.CreateLine();
    });
    var tempClipLayer = null;
    var tempClipGuid = null;
    // 【地形开挖】按钮
    $("#customClip").click(function () {
        analysisClearBuffer();
        deleteTempTerrainAnaly();
        var depth = $("#depth").val();
        earth.ShapeCreator.Clear();
        earth.Event.OnCreateGeometry = function (pFeat) {
            var pntNum = pFeat.Count;
            if (pntNum < 3) {
                alert("应至少取三个点以进行开挖!");
                earth.ShapeCreator.Clear();
                return;
            }
            var height = pFeat.Items(0).Z;
            var clipDepth = height - depth;

            //计算绘制面的中心点坐标 进而计算出开挖后的底面的高程值
            var v3s = earth.Factory.CreateVector3s();
            for (var j = 0; j < pntNum; j++) {
                var v3 = earth.Factory.CreateVector3();
                v3.X = pFeat.Items(i).X;
                v3.Y = pFeat.Items(i).Y;
                v3.Z = 0;
                v3s.AddVector(v3);
            }
            var bufPolygon = earth.Factory.CreateElementPolygon(earth.Factory.CreateGUID(), "");
            bufPolygon.BeginUpdate();
            bufPolygon.SetExteriorRing(v3s);
            bufPolygon.AltitudeType = 1;
            bufPolygon.visibility = false;
            bufPolygon.EndUpdate();
            var polyCenter = bufPolygon.SphericalTransform;
            var alt = earth.Measure.MeasureTerrainAltitude(polyCenter.Longitude, polyCenter.Latitude);//返回指定地理位置的高程值，忽略除地形外其他地物（如建筑物）。 如果是True，只通过本地数据获取高程值。如果是False，将通过服务获取高程值
            var btmAttitude = alt - depth;
            for (var i = 0; i < pntNum; i++) {
                pFeat.SetAt(i, pFeat.Items(i).X, pFeat.Items(i).Y, clipDepth);
            }
            earth.TerrainManager.SetMinClipLevel(12);
            var checkExcave = $('input:checkbox[name="checkExcave"]').is(":checked");
            if (checkExcave) {
                tempClipGuid = earth.Factory.CreateGUID();
                earth.TerrainManager.ClipTerrainByPolygonEx(tempClipGuid, pFeat);
            } else {
                earth.TerrainManager.ClipTerrainByPolygon(pFeat);
            }

            if (tempClipLayer != null) {
                earth.DetachObject(tempClipLayer);
                tempClipLayer = null;
            }
            createNewLayer();//创建图层

            createClipModel(pFeat);//创建开挖
            earth.Event.OnAnalysisFinished = function (result, alt) {
                if(result){
                    var res = result.Excavation.toFixed(2);
                    TerrainExcavate.showExcaveBalloon(res);
                }
            };
            //第一个参数 是高程值 第二个参数是多边形
            earth.Analysis.SurfaceExcavationAndFill(clipDepth, pFeat);
            earth.ShapeCreator.Clear();
            earth.Event.OnCreateGeometry = function () {
            };
        }
        earth.ShapeCreator.CreatePolygon();
    });
    // 创建图层
    var createNewLayer = function () {
        earth.Event.OnAnalysisFinished = function (res) {};
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
        tempClipLayersList.push(tempClipLayer);
    };
    // 创建开挖
    var createClipModel = function (args, modelGuid, modelName) {
        if (modelGuid == null) {
            modelGuid = earth.Factory.CreateGUID();
        }
        if (modelName == null) {
            modelName = "ClipModel";
        }
        var terrain = earth.TerrainManager;
        var sampArgs = terrain.GenerateSampledCoordinates(args);
        var imgLocation = "http://" + getRootPath() + "/img/PipeMaterial/";
        var bottomTexturePath = imgLocation + "profile.jpg";
        var profileTexturePath = imgLocation + "bottom.jpg";
        var tempClipModel = terrain.GenerateClipModel(modelGuid, modelName, args, sampArgs, profileTexturePath, bottomTexturePath);
        tempClipModel.Selectable = false;
        earth.AttachObject(tempClipModel);
        clipModelList.push(tempClipModel);
        return tempClipModel;
    };
    // 获取项目路径
    function getRootPath() {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return (localhost + projectName);
    }
    // 创建管线
    var onCreatePipeline = function (pFeature) {
        earth.Event.OnCreateGeometry = function () {
        };
        earth.ShapeCreator.Clear();
        var pntNum = pFeature.Count;
        if (pntNum < 2) {
            return;
        }
        var deep = parseFloat($("#deep").val());
        var vec3s = earth.Factory.CreateVector3s();
        pipepointObj = earth.Factory.CreateVector3s();
        if (pntNum > 1) {
            for (var i = 0; i < pntNum; i++) {
                var pt = pFeature.GetPointAt(i);
                vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude - deep);
                pipepointObj.add(pt.Longitude, pt.Latitude, pt.Altitude - deep);
            }
            var datum = top.SYSTEMPARAMS.pipeDatum;
            var startCoordXYZ = datum.des_BLH_to_src_xy(pFeature.GetPointAt(0).Longitude, pFeature.GetPointAt(0).Latitude, pFeature.GetPointAt(0).Altitude);
            var endCoordXYZ = datum.des_BLH_to_src_xy(pFeature.GetPointAt(1).Longitude, pFeature.GetPointAt(1).Latitude, pFeature.GetPointAt(1).Altitude);
            startCoord = (startCoordXYZ.X).toFixed(6) + "," + (startCoordXYZ.Y).toFixed(6) + "," + (startCoordXYZ.Z).toFixed(6);
            endCoord = (endCoordXYZ.X).toFixed(6) + "," + (endCoordXYZ.Y).toFixed(6) + "," + (endCoordXYZ.Z).toFixed(6);
        }
        var type = $("#type").val();
        var specification = $("#specification").val();
        var lineObj = UserDataAnalysis.createPipeLine(vec3s, specification, "管线", type);
        startPoint = lineObj.SphericalTransform.TransformSphrericalToCartesion(vec3s.Items(0));
        endPoint = lineObj.SphericalTransform.TransformSphrericalToCartesion(vec3s.Items(1));
        pipelineObj.push(lineObj);
        $("#analysis").attr("disabled", false);
        $("#move").attr("disabled", false);
        $("#rotate").attr("disabled", false);
    };
    /**
     * 删除临时地形
     */
    var deleteTempTerrainAnaly = function () {
        earth.ShapeCreator.Clear();
        earth.TerrainManager.ClearTempLayer();
        if (tempClipGuid != null) {
            earth.TerrainManager.DeletePolygonByGUID(tempClipGuid);
            tempClipGuid = null;
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
    $("#move").click(function () {
        analysisClearBuffer();
        earth.ToolManager.SphericalObjectEditTool.Move(7);
        earth.Event.OnPoseChanged = onSelectChanged;
    });
    $("#rotate").click(function () {
        analysisClearBuffer();
        earth.ToolManager.SphericalObjectEditTool.Rotate(7);
        earth.Event.OnPoseChanged = onSelectChanged;
    });

    $("#writerCoord").click(function () {
        earth.ToolManager.SphericalObjectEditTool.Browse();
        $("#analysis").attr("disabled", true);
        $("#move").attr("disabled", true);
        $("#rotate").attr("disabled", true);
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            TerrainExcavate.highlightObjectFromTunnel(false);
            $("#showResult").attr("checked", false);
        }
        $("#tblResult>tbody").empty();
        $("label#roadInfo").html("");

        analysisClearBuffer();
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        if (pipelineObj.length > 0) {
            for (var i = 0; i < pipelineObj.length; i++) {
                earth.DetachObject(pipelineObj[i]);
            }
            pipelineObj = [];
        }

        var obj = {};
        obj.pipeDatum = top.SYSTEMPARAMS.pipeDatum;
        obj.earth = earth;
        obj.createPipeline  = CreateLineByCrood;
        var pointArr = [];
        pointArr = showModelessDialog("../pipelineAnalysis/editCoord.html", obj, "dialogWidth=500px;dialogHeight=320px;status=no");
        if (pointArr === undefined || pointArr.length <= 0 || pointArr === null) {
            return;
        }
    });


    function CreateLineByCrood(pointArr) {
        earth.ShapeCreator.Clear();
        var deep = parseFloat($("#deep").val());
        var vec3s = earth.Factory.CreateVector3s();
        pipepointObj = earth.Factory.CreateVector3s();
        if (pointArr.length == 2) {
            for (var i = 0; i < pointArr.length; i++) {
                var pt = pointArr[i];
                vec3s.Add(pt.Longitude, pt.Latitude, pt.Altitude - deep);
                pipepointObj.add(pt.Longitude, pt.Latitude, pt.Altitude - deep);
            }
            var datum = top.SYSTEMPARAMS.pipeDatum;
            var startCoordXYZ = datum.des_BLH_to_src_xy(pointArr[0].Longitude, pointArr[0].Latitude, pointArr[0].Altitude);
            var endCoordXYZ = datum.des_BLH_to_src_xy(pointArr[1].Longitude, pointArr[1].Latitude, pointArr[1].Altitude);
            startCoord = (startCoordXYZ.X).toFixed(6) + "," + (startCoordXYZ.Y).toFixed(6) + "," + (startCoordXYZ.Z).toFixed(6);
            endCoord = (endCoordXYZ.X).toFixed(6) + "," + (endCoordXYZ.Y).toFixed(6) + "," + (endCoordXYZ.Z).toFixed(6);
        }
        else {
            return;
        }
        var type = $("#type").val();
        var specification = $("#specification").val();
        var lineObj = UserDataAnalysis.createPipeLine(vec3s, specification, "管线", type);
        startPoint = lineObj.SphericalTransform.TransformSphrericalToCartesion(vec3s.Items(0));
        endPoint = lineObj.SphericalTransform.TransformSphrericalToCartesion(vec3s.Items(1));
        pipelineObj.push(lineObj);
        $("#analysis").attr("disabled", false);
        $("#move").attr("disabled", false);
        $("#rotate").attr("disabled", false);

    }

    var startCoord = "";
    var endCoord = "";
    var startPoint = "";
    var endPoint = "";
    var onSelectChanged = function () {
        var count = earth.SelectSet.GetCount();
        if (count != 1) {
            return;
        }
        var objChg = earth.SelectSet.GetObject(0);
        var deep = parseFloat($("#deep").val());
        var guid = objChg.Guid;
        var obj = UserDataAnalysis.getPipeLineInfoByGuid(guid);
        if (!obj) return;
        $("#specification").val(obj.specification);
        $("#type").val(obj.type);
        var vec3s = obj.vec3s;
        if (vec3s.Count != 2) {
            return;
        }
        var startx = objChg.SphericalTransform.TransformCartesionToSphrerical(startPoint);
        var endx = objChg.SphericalTransform.TransformCartesionToSphrerical(endPoint);
        pipepointObj = earth.Factory.CreateVector3s();
        pipepointObj.add(startx.X, startx.Y, startx.Z - deep);
        pipepointObj.add(endx.X, endx.Y, endx.Z - deep);
        var xyStart = top.SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(startx.X, startx.Y, startx.Z);
        var xyEnd = top.SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(endx.X, endx.Y, endx.Z);
        startCoord = (xyStart.X).toFixed(6) + "," + (xyStart.Y).toFixed(6) + "," + (xyStart.Z).toFixed(6);
        endCoord = (xyEnd.X).toFixed(6) + "," + (xyEnd.Y).toFixed(6) + "," + (xyEnd.Z).toFixed(6);
    };
    $("#analysis").click(function () {
        noResult = true;
        analysisClearBuffer();
        if (lineObjArr.length > 0) {
            analysisShowResult(false, lineObjArr);
            $("#showResult").attr("checked", false);
        }
        var radius = 0;
        if ($("#radius").val() != null && Number($("#radius").val())) {
            radius = $("#radius").val();
        }
        $("#showResult").removeAttr("checked");
        $("#tblResult>tbody").empty();
        var pipeLineLayers = top.SystemSetting.getPipeListByLayer(layer);
        var selectedObj = null;
        selectedObj = earth.Factory.CreateGeoPoints();
        var coords = pipepointObj;
        divload("tablediv")
        if (coords.Count > 0) {
            for (var i = 0; i < coords.Count; i++) {
                selectedObj.Add(coords.Items(i).X, coords.Items(i).Y, coords.Items(i).Z);
            }
            AnalysisCreateBufferFromLine(selectedObj, radius);
        }

        var pType = $("#type").val();
        var pipelineTypes = PipelineStandard.PipelineType;
        var urlList = [];
        $.each(pipeLineLayers, function (i, v) {
            var thisLayer = earth.LayerManager.GetLayerByGUID(v.id);
            top.LayerManagement.searchLayers.push(thisLayer);
            var server = v.server;
            var layerId = v.id;
            var name = v.name;
            var strConn = server + "pipeline?rt=collision&service=" + layerId;
            strConn += "&aparam=0,";
            strConn += startCoord + ",";
            strConn += endCoord + ",";
            strConn += $("#specification").val() + ",";
            strConn += radius + ",";
            strConn += pipelineTypes[pType] + ",";
            // strConn += 0; //燃气编码现在拿不到，暂时统一用0
            if (pipelineTypes && pipelineTypes[pType] >= 5000 && pipelineTypes[pType] < 6000) {//燃气管线统一传低压：0
                strConn += "0,";
            } else {//非燃气管线统一传-1
                strConn += "-1,";
            }
            strConn += "0,";//所有管线创建时均采用直埋：0
            if (pipelineTypes && pipelineTypes[pType] >= 1000 && pipelineTypes[pType] < 2000) {//电力管线需传入电压值，统一传：0.1kV
                strConn += "0.1kV";
            } else {//非电力管线统一传-1
                strConn += "-1";
            }
            urlList.push({"url": strConn, "layerId": layerId, "name": name});
        });
        sendService(urlList);

        //table表格行单选
        var lastTr = null;
        $("tr").live("click", function () {
            if (lastTr != null) {
                lastTr.removeAttr("class");
            }
            $(this).attr("class", "trSingleSelectStyle");
            lastTr = $(this);
        });
    });
    var noResult = true;
    // 发送数据
    var sendService = function (urlList) {
        if (urlList) {
            var tempArr = urlList.shift();
            earth.Event.OnEditDatabaseFinished = function (pRes, pFeature) {
                if (pRes.ExcuteType == top.SystemSetting.excuteType) {
                    var xmlStr = pRes.AttributeName;
                    var xmlDoc = loadXMLStr(xmlStr);
                    parseResult(xmlDoc, tempArr["layerId"], tempArr["name"]);
                    noResult = false;
                    divloaded();
                }
                if (noResult && urlList.length == 0) {
                    divloaded();
                    alert("分析结果为空！");
                }
                if (urlList.length != 0) {
                    sendService(urlList);
                }
            }
            earth.DatabaseManager.GetXml(tempArr["url"]);
        }
    }
    window.onunload = function () {
        earth.ToolManager.SphericalObjectEditTool.Browse();//选择状态不清楚 关闭页面崩溃
        if (pipelineObj.length > 0) {
            for (var i = 0; i < pipelineObj.length; i++) {
                earth.DetachObject(pipelineObj[i]);
            }
        }
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        if (checkTag) {
            analysisShowResult(false, lineObjArr);
        }
        if (excaveBalloon) {
            excaveBalloon.DestroyObject();
            excaveBalloon = null;
        }
        clearHighLight();
        analysisClearBuffer();
        deleteTempTerrainAnaly();
    };
    /**
     * 功能：【导出Excel】按钮onclick事件
     */
    $("#importExcelBtn").click(function () {
        var tabObj = $("#tblResult>tbody")[0];
        var columns = ["编号", "图层", "水平净距", "标准"];
        LayerManagement.importExcelByTable(tabObj, columns);
    });
    $("#showResult").click(function () {
        clearHighLight();
        var checkTag = $('input:checkbox[name="showResult"]').is(":checked");
        analysisShowResult(checkTag, lineObjArr);
    });
    //显示详细信息
    $("#detailData").click(function () {
        bShow = $('input:checkbox[name="detailData"]').is(":checked");
        if (!bShow) {
            top.LayerManagement.clearHtmlBalloons();
        }
    });
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
     * 高亮闪烁显示
     * 作为表格的行的双击事件处理函数，其可见范围需在window全局作用域！
     * @param layerID  图层ID
     * @param type     对象类型：point / line
     * @param guid     对象的GUID
     * @param key      对象的US_KEY值
     */
    var lineObjArrFromSh = [];
    window.highlightObject = function (layerID, type, guid, key) {
        var layer = earth.LayerManager.GetLayerByGUID(layerID);
        var i = 0;
        var subLayer = null;
        var searchResult = null;
        var obj = null;
        for (i = 0; i < layer.GetChildCount(); i++) {
            subLayer = layer.GetChildAt(i);
            if (type === "point") {
                if (subLayer.LayerType === "Container" || subLayer.LayerType === "Vector") continue;
            } else if (type === "line") {
                if (subLayer.LayerType !== "Container" || subLayer.LayerType === "Vector") continue;
            }

            var dt = subLayer.LocalSearchParameter.ReturnDataType;
            subLayer.LocalSearchParameter.ClearSpatialFilter();
            subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
            subLayer.LocalSearchParameter.PageRecordCount = 100;
            subLayer.LocalSearchParameter.SetFilter(key, "");
            subLayer.LocalSearchParameter.HasDetail = false;
            subLayer.LocalSearchParameter.HasMesh = false;
            searchResult = subLayer.SearchFromLocal();
            subLayer.LocalSearchParameter.ReturnDataType = dt;

            if (searchResult.RecordCount < 1) continue;
            subLayer.LocalSearchParameter.ReturnDataType = top.localSearchDataType.xml;
            obj = filterByKey(searchResult, key);
            subLayer.LocalSearchParameter.ReturnDataType = dt;
            if (obj != null) {
                var vecCenter = obj.SphericalTransform;
                earth.GlobeObserver.GotoLookat(vecCenter.Longitude, vecCenter.Latitude, vecCenter.Altitude + 50, 0.0, 89.0, 0, 4);
                obj.ShowHighLight();
                lineObjArrFromSh.push(obj);
                break;
            }
        }
        if (obj == null && type === "point") {
            StatisticsMgr.sphereGotoLookat(guid, subLayer, layerID, key);
        }
    };
    /**
     * 解析查询结果，添加到结果表格中
     * @param result 查询结果
     * @param guid 图层ID
     * @param name 图层名
     */
    var targetPipeLineType = 0;
    var lineObjArr = [];
    var parseResult = function (result, guid, name) {
        var template = '<tr ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
            '><td class="col">$INDEX</td><td class="col">$LAYER</td><td class="col" title="净距符合标准">$HorizonDistance</td><td class="col">$standard</td></tr>';
        var templateOver = '<tr  ondblclick=analysisHighlightObject("$LayerID","$TYPE","$GUID","$KEY")' +
            '><td class="col">$INDEX</td><td class="col">$LAYER</td><td class="col bgRed" title="净距<标准值" >$HorizonDistance</td><td class="col">$standard</td></tr>';
        var json = $.xml2json(result);
        if (json == null || !json.CollisionResult) {
            return;
        }
        var type = "line";
        var records = json.CollisionResult.Record;
        if (json.CollisionResult.num <= 0) {
            return;
        } else if (json.CollisionResult.num == 1) {
            records = [records];
        }
        for (var i = 0; i < records.length; i++) {
            if (parseFloat(records[i].HorizonDistance) >= parseFloat(records[i].HorizonISO)) {
                $("#tblResult>tbody").append(template.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                    .replace("$HorizonDistance", parseFloat(records[i].HorizonDistance).toFixed(2) < 0 ? "-" : parseFloat(records[i].HorizonDistance).toFixed(2))
                    .replace("$LAYER", name)
                    .replace("$standard", parseFloat(records[i].HorizonISO).toFixed(2))
                    .replace("$LayerID", guid)
                    .replace("$TYPE", type)
                    .replace("$GUID", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                    .replace("$KEY", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)]));
            } else {
                lineObjArr.push({
                    layerId: guid,
                    type: type,
                    guid: records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)],
                    key: records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)]
                });
                $("#tblResult>tbody").append(templateOver.replace("$INDEX", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                    .replace("$HorizonDistance", parseFloat(records[i].HorizonDistance).toFixed(2) < 0 ? "-" : parseFloat(records[i].HorizonDistance).toFixed(2))
                    .replace("$LAYER", name)
                    .replace("$LayerID", guid)
                    .replace("$standard", parseFloat(records[i].HorizonISO).toFixed(2))
                    .replace("$TYPE", type)
                    .replace("$GUID", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)])
                    .replace("$KEY", records[i][top.getNameNoIgnoreCase("US_KEY", 1, true)]));
            }
        }

        $("#importExcelBtn").attr("disabled", false);
        $("#showResult").attr("disabled", false);
        $("#detailData").attr("disabled", false);
    };
})