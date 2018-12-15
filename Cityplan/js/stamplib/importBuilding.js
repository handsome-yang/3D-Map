/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月15日
 * 描    述：导入模型
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */
var dataPro;
var datum;

if (!STAMP) {
    var STAMP = {};
}

/**
 * 导入导出shape文件
 * @param  {earth} usearth        [description]
 * @param  {[type]} savePath       [description]
 * @param  {[type]} spatialRefPath [description]
 * @return {[type]}                [description]
 */
STAMP.ImportBuilding = function(usearth, savePath, spatialRefPath, field, floor, height, allFieldAndValue) {
    var importBuilding = {};
    var dataDictionary = {};
    var latObj;
    var importFlag = true;
    /**
     * 导入文件 这里只针对面提供拉伸处理
     * @param  {[type]} shapePath      [description]
     * @param  {[type]} spatialRefPath [description]
     * @param  {[type]} layerType      [description]
     * @return {[type]}                [description]
     */
    var _importFile = function(field, floor, height, userdata) {
        //如果shape已经导入过一次 再次导入的时候 先清理掉之前的 同时删除userdata上对应节点
        if (dataDictionary[savePath]) {
            var f = dataDictionary[savePath];
            for (var h = f.length - 1; h >= 0; h--) {
                var obj = f[h];
                usearth.DetachObject(obj);
            };
        }

        //载入数据处理对象
        dataPro = document.getElementById("dataProcess");
        dataPro.Load();

        var ogrDataProcess = dataPro.OGRDataProcess;
        var driver = ogrDataProcess.GetDriverByType(44);
        //SHAPE的路径
        var readData = driver.Open(savePath, 0);
        var layerNum = readData.GetLayerCount();

        //加载空间参考文件(投影变换)
        var spatialRef = dataPro.CoordFactory.CreateSpatialRef();
        spatialRef.InitFromFile(spatialRefPath);
        datum = dataPro.CoordFactory.CreateDatum();
        datum.init(spatialRef);

        //根据field与floor来计算每一个feature对应的高度值
        var fFieldValues;
        var fFloorValues;
        var fieldSum = allFieldAndValue.length;
        for (var i = fieldSum - 1; i >= 0; i--) {
            if (field === allFieldAndValue[i].key) {
                fFieldValues = allFieldAndValue[i].value;
            }
            if (floor === allFieldAndValue[i].key) {
                fFloorValues = allFieldAndValue[i].value;
            }
        };

        var readLayer;
        var lonLat;
        var type;
        var features = [];

        //获取当前项目的用地规划图层
        var projData = projManager.getProjectData({id: top.projNodeId});
        if(projData && projData.length > 0){
            projData = projData[0];
        }
        var ydLayer = top.editLayers[projData["CPPROJECT.PARCELLAYERID"]];
        if(!ydLayer){
            alert("没有规划用地数据");
            return;
        }

        var volumeArrMap = {};
        for (var i = 0; i < layerNum; i++) {
            readLayer = readData.GetLayer(i);

            var featureNum = readLayer.GetFeatureCount();
            for (var j = 0; j < featureNum; j++) {
                //获取feature
                var feature = readLayer.GetFeature(j);
                //获取feature对应的属性字段
                var featureDefn = feature.GetFeatureDefn();
                type = feature.GetGeometryType();
                //获取空间信息
                var v3s;
                var guid = usearth.Factory.CreateGUID();
                //判断几何类型 参见SEWkbGeometryType枚举类型
                if (type === 3 || type === 403) { // 面
                    var poly = feature.GetPolygon();
                    v3s = transformPolygon(poly);
                    var elementVolume = usearth.Factory.CreateElementVolume(guid, "拉伸体");
                    //这里根据页面上的"名称字段"来给对象赋name属性值
                    elementVolume.name = fFieldValues[j];
                    elementVolume.BeginUpdate();
                    var newPolygon = usearth.Factory.CreatePolygon();
                    newPolygon.AddRing(v3s);
                    elementVolume.SetPolygon(1, newPolygon);
                    elementVolume.Height = fFloorValues[j] * height;
                    elementVolume.FillColor = parseInt("0xffffffff");
                    elementVolume.Visibility = true;
                    elementVolume.EndUpdate();
                    var ydName = "";
                    for(var i = 0; i < ydLayer.GetObjCount(); i++){
                        var itemObj = ydLayer.GetObjAt(i);
                        if(itemObj){
                            //判断是否在用地范围内
                            var ydVector3s = itemObj.GetPolygon();
                            var isInPolygon = earth.PolygonAlgorithm.PolysRelationship(ydVector3s, newPolygon);
                            if(isInPolygon == 1){
                                ydName = itemObj.name;
                                break;
                            }
                        }
                    }
                    if(ydName == "" || ydName == undefined){
                        alert("存在矢量面不在用地范围内，或超出了用地范围线");
                        removeBtnDisabled();
                        return;
                    }
                    if(volumeArrMap[ydName] == undefined || volumeArrMap[ydName] == null){
                        volumeArrMap[ydName] = [];
                    }
                    volumeArrMap[ydName].push({ydName:ydName,elementObj:elementVolume});
                    var beginPoint = v3s.Items(0);
                    if (beginPoint) {
                        lonLat = [beginPoint.X, beginPoint.Y, beginPoint.Z];
                    }
                } else {
                    alert("类型不正确!");
                    removeBtnDisabled();
                    return;
                }
            }
        }

        var styleinfo = earth.Factory.CreateStyleInfo();
        styleinfo.LineWidth = 1;
        styleinfo.DiffuseColor = parseInt("0xffffffff");
        styleinfo.FirstColor = parseInt("0xffffffff");
        styleinfo.SecondColor = parseInt("0xffffffff");
        var stylelist = earth.Factory.CreateStyleInfoList();
        stylelist.AddItem(styleinfo);

        for(var item in volumeArrMap){
            var volumeArr = volumeArrMap[item];
            var layerId = "";
            var planArr = projManager.getLayerIdsByPlanId(currentPlanLayerId, item);
            for(var j = 0; j < planArr.length; j++){
                if(projectLayerMap[planArr[j]] && projectLayerMap[planArr[j]].LayerType == 14){
                    layerId = projectLayerMap[planArr[j]].guid;
                    break;
                }
            }

            var paramsObj = { 
                layerId: layerId, 
                ydName: item,
                floorHeight: height, 
                objArr: [],
                stylelist: stylelist
            };
            for(var i = 0; i < volumeArr.length; i++){
                paramsObj.objArr.push({
                    guid: volumeArr[i].elementObj.guid, 
                    name: volumeArr[i].elementObj.name, 
                    v3s: volumeArr[i].elementObj.SphericalVectors, 
                    height: volumeArr[i].elementObj.Height
                });
            }

            var projectName = projectNode?projectNode.name:"";
            //矢量楼块图层名称
            var tempLayerName = (projectName?projectName+"_":"") + (currentPlanName?currentPlanName+"_":"") + "shpbuilding_" + ydName;
            if(layerId == ""){
                layerId = earth.Factory.CreateGuid();
                //创建编辑图层
                var tempLayer = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                tempLayer.DataLayerType = 14;
                earth.AttachObject(tempLayer);
                editLayers[layerId] = tempLayer;
                editLayers[layerId].Visibility = true;
                editLayers[layerId].Editable = true;
                paramsObj.layerId = layerId;
                paramsObj.mEditLayer = editLayers[layerId];
                earth.Event.OnEditDatabaseFinished = function(pRes, pLayer){
                    if (pRes.ExcuteType == 1) {
                        earth.Event.OnEditDatabaseFinished = function(){};
                        projManager.addNewLayerData(pLayer);
                        createShpBuilding(paramsObj);
                    }
                };
                var param = earth.Factory.CreateLayerParameter();
                param.Guid = layerId;
                param.Name = tempLayerName;
                param.Type = 14;
                param.Status = 1;
                earth.DatabaseManager.AddLayerInDatabaseIncludeGroupID(STAMP_config.server.dataServerIP,param, -2);
                planArr.push(layerId);
                $.ajaxSetup({
                    async: false  // 将ajax请求设为同步
                });
                projManager.updatePlanLayerIDs(currentPlanLayerId, item, planArr.join(","));
            }else{
                if(!editLayers[layerId]){
                    editLayers[layerId] = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                    editLayers[layerId].DataLayerType = 14;
                    editLayers[layerId].Visibility = true;
                    editLayers[layerId].Editable = true;
                    earth.AttachObject(editLayers[layerId]);
                }
                paramsObj.mEditLayer = editLayers[layerId];
                createShpBuilding(paramsObj);
            }
        }

        dataDictionary[savePath] = features;
        if (lonLat != []) {
            usearth.GlobeObserver.FlytoLookat(lonLat[0], lonLat[1], 50, 0, 60, 0, 200, 5);
            latObj = {
                lon: lonLat[0],
                lat: lonLat[1]
            };
        }
        alert("导入成功!");
        removeBtnDisabled();
    }

    /*
     * 坐标集合转换
     * @param vct3s Vector3s类型的点集合
     * @return 返回GeoPoints类型的点集合
     */
    function transformVectors(vct3s){
        var cGeoPoints = earth.Factory.CreateGeoPoints();
        for(var i = 0; i < vct3s.Count; i++){
            var item = top.SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(vct3s.Items(i).X, vct3s.Items(i).Y, vct3s.Items(i).Z);
            cGeoPoints.Add(item.X, item.Y, item.Z);
        }
        return cGeoPoints;
    }

    /**
     * 创建矢量楼块
     * @param  {[object]} paramsObj [参数对象]
     * @return {[type]}           [无]
     */
    function createShpBuilding(paramsObj){
        var mEditLayer = paramsObj.mEditLayer;
        var layerId = paramsObj.layerId;
        var ydName = paramsObj.ydName;
        var floorHeight = paramsObj.floorHeight;
        var stylelist = paramsObj.stylelist;
        var volumeArr = paramsObj.objArr;

        var infolist = earth.Factory.CreateDbEleInfoList();
        for(var i = 0; i < volumeArr.length; i++){
            var info = earth.Factory.CreateDbEleInfo(volumeArr[i].guid, volumeArr[i].name);
            info.DrawOrder = 1000;
            info.Type = 14;
            info.StyleInfoList = stylelist;
            info.SphericalVectors.Add(volumeArr[i].v3s);
            info.height = volumeArr[i].height;
            info.AltitudeType = 1;
            infolist.AddItem(info);
        }
        
        earth.Event.OnEditDatabaseFinished = function(pres, pFeat){
            if(pFeat == null || pFeat.Count <= 0){
                importFlag = false;
                return;
            }
            var textureArr = ["","",""];//导入时纹理默认为空
            //加载简单建筑模型
            for(var i = 0; i < pFeat.Count; i++){
                var model = projManager.createShpBuildingModel(pFeat.Items(i), textureArr);
                if(model == null){//创建失败，把入库的简单建筑删除掉
                    earth.DatabaseManager.DeleteElementInLayer(STAMP_config.server.dataServerIP, layerId, pFeat.Items(i).guid);
                    importFlag = false;
                    return;
                }

                mEditLayer.BeginUpdate();
                mEditLayer.AttachObject(model);
                mEditLayer.EndUpdate();

                var params = {
                    guid: pFeat.Items(i).guid,
                    name: pFeat.Items(i).name,
                    ydName: ydName,
                    v3s: pFeat.Items(i).SphericalVectors.Items(0),
                    height: pFeat.Items(i).height,
                    floorHeight: floorHeight
                };
                updateShpBuildingObj(params);
            }
        }
        earth.DatabaseManager.AddElementListInLayer(STAMP_config.server.dataServerIP,layerId, infolist);
    }

    /**
     * 更新矢量楼块数据库信息
     * @param  {[object]} paramsObj [参数对象]
     * @return {[type]}           [无]
     */
    function updateShpBuildingObj(paramsObj){
        var guid = paramsObj.guid;
        var name = paramsObj.name;
        var ydName = paramsObj.ydName;
        var v3s = paramsObj.v3s;
        var height = paramsObj.height;
        var floorHeight = paramsObj.floorHeight;

        var buildingArea = earth.GeometryAlgorithm.CalculatePolygonArea(transformVectors(v3s));
        var xml = "<CPSIMPLEBUILD>" +
            "<ID>" + guid + "</ID>" +
            "<PLANID>" + top.currentPlanLayerId + "</PLANID>" +
            "<YDNAME>" + ydName + "</YDNAME>" +
            "<NAME>" + name + "</NAME>" +
            "<FLOOR>" + parseInt(height/floorHeight) + "</FLOOR>" +
            "<FLOORHIGHT>" + floorHeight + "</FLOORHIGHT>" +
            "<TOTALAREA>" + (buildingArea * parseInt(height/floorHeight)) + "</TOTALAREA>" +
            "<BASEAREA>" + buildingArea + "</BASEAREA>" +
            "<ROOFTYPE></ROOFTYPE>" +
            "</CPSIMPLEBUILD>";
        $.support.cors = true; //开启jQuery跨域支持
        $.ajaxSetup({
            async: false  // 将ajax请求设为同步
        });
        var result = false;
        $.post(STAMP_config.service.add, xml, function (data) {
            if (/true/.test(data)) {
                result = true;
            }
        }, "text");
        if(result){
            projManager.updatePlanIndex(top.currentPlanLayerId);
        }
    }

    /**
     * 移除按钮禁用状态
     * @return {[type]} [description]
     */
    function removeBtnDisabled(){
        $("#selectVect").attr("disabled", false);
        $("#addSpatialReference").attr("disabled", false);
        $("#btnAdd").attr("disabled", false);
        $("#clear").attr("disabled", false);
    }

    /**
     * 对面数据进行空间数据转换
     * @param  {[type]} poly [polygon矢量面]
     * @return {[type]}      [description]
     */
    var transformPolygon = function(poly) {
        var inerLine = poly.GetExteriorRing();
        var wInerLine = transformLinearRing(inerLine);
        var v3s = usearth.Factory.CreateVector3s();
        for (var k = 0; k < wInerLine.length; k++) {
            var v = wInerLine[k];
            var v3 = usearth.Factory.CreateVector3();
            v3.X = v.X;
            v3.Y = v.Y;
            var altitude = usearth.Measure.MeasureTerrainAltitude(v.X, v.Y);
            v3.Z = altitude;
            v3s.AddVector(v3);
        }
        return v3s;
    }

    /**
     * 对线数据进行空间数据转换
     * @param  {[type]} line [线]
     * @return {[Vector3s]}      [经纬度点集合]
     */
    var transformLinearRing = function(line) {
        var result = [];
        var pointNum = line.GetPointsCount();
        for (var j = 0; j < pointNum; j++) {
            var point = line.GetPoint(j);
            var rawPoint = TransformPoint(point);
            result.push(rawPoint);
        }

        return result;
    }

    /**
     * 对点数据进行空间数据转换 平面转经纬度
     * @param {[type]} point [平面坐标点]
     * @return {[Vector3]} [经纬度点]
     */
    var TransformPoint = function(point) {
        var rawPoint = datum.src_xy_to_des_BLH(point.X, point.Y, 0);
        return rawPoint;
    }

    /**
     * 采用OGR接口绘制面
     * @param {[type]}  part    [点集合]
     * @param {[type]}  polygon [面对象]
     * @param {Boolean} isMult  [是否多个面]
     */
    var addRings = function(part, polygon, isMult) {
        var linearRing = dataPro.OGRDataProcess.OGRFactory.CreateOGRLinearRing();
        var vecs = part.split(" ");
        for (var j = 0; j < vecs.length; j++) {
            var v3 = dataPro.OGRDataProcess.OGRFactory.CreateOGRPoint();
            var part = vecs[j].split(",");
            v3.X = part[0];
            v3.Y = part[1];
            v3.Z = part[2];
            var pt = datum.des_BLH_to_src_xy(v3.X, v3.Y, 0);
            linearRing.SetPointOfXYZ(j, pt.X, pt.Y, pt.Z);
        }
        //如果有多个part
        if (isMult) {
            var partPolygon = dataPro.OGRDataProcess.OGRFactory.CreateOGRPolygon();
            partPolygon.AddRing(linearRing);
            polygon.AddGeometry(partPolygon);
        } else {
            polygon.AddRing(linearRing);
        }
        return polygon;
    };

    /**
     * 利用OGR接口绘制线
     * @param {[type]} part [点集合]
     * @param {[type]} line [线对象]
     */
    var addLineRings = function(part, line) {
        var vecs = part.split(" ");
        for (var j = 0; j < vecs.length; j++) {
            var v3 = dataPro.OGRDataProcess.OGRFactory.CreateOGRPoint();
            var part = vecs[j].split(",");
            v3.X = part[0];
            v3.Y = part[1];
            v3.Z = part[2];
            var pt = datum.des_BLH_to_src_xy(v3.X, v3.Y, 0);
            line.SetPointOfXYZ(j, pt.X, pt.Y, pt.Z);
        }
        return line;
    }

    /**
     * 得到导入的shp坐标位置
     * @return {[type]} [description]
     */
    var _getLocationObj = function() {
        if (latObj) {
            return latObj;
        }
        return null;
    }

    importBuilding.importFile = _importFile;
    importBuilding.getLocationObj = _getLocationObj;
    return importBuilding;
}
