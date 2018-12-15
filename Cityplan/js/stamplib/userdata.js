/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：用户数据创建管理
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var earth = null;
if (!STAMP) {
    var STAMP = {};
}
STAMP.Userdata = function(earthObj) {
    if (earthObj) {
        earth = earthObj;
    } else {
        earth = parent.earth;
    }
    var userdata = {};
    var v3sArr = [];
    var shpInforArr = [];

    /**
     * 更新数据库对象
     * @param  {[object]} paramsObj [传入参数对象]
     * @return {[type]}           [无]
     */
    function updateShpBuildingObj(paramsObj){
        var guid = paramsObj.guid;
        var name = paramsObj.name;
        var ydName = paramsObj.ydName;
        var buildingArea = paramsObj.buildingArea;
        var height = paramsObj.height;
        var floorHeight = paramsObj.floorHeight;
        var textureArr = paramsObj.textureArr;
        //下面是获取纹理图片类型
        if(textureArr && textureArr[0] != null && textureArr[0] != ""){
            var bottomTextureType = textureArr[0].substring(textureArr[0].lastIndexOf(".") + 1);
        }
        if(textureArr && textureArr[1] != null && textureArr[1] != ""){
            var topTextureType = textureArr[1].substring(textureArr[1].lastIndexOf(".") + 1);   
        }
        if(textureArr && textureArr[2] != null && textureArr[2] != ""){
            var bodyTextureType = textureArr[2].substring(textureArr[2].lastIndexOf(".") + 1);
        }
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
            "<BOTTOMTEXTURETYPE>" + bottomTextureType + "</BOTTOMTEXTURETYPE>" +
            "<TOPTEXTURETYPE>" + topTextureType + "</TOPTEXTURETYPE>" +
            "<BODYTEXTURETYPE>" + bodyTextureType + "</BODYTEXTURETYPE>" +
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

        //下面是存放纹理图片
        if(textureArr && textureArr[0] != null && textureArr[0] != ""){
            earth.DatabaseManager.PostFile(textureArr[0], STAMP_config.service.addBuildBottomTexture + guid);    
        }
        if(textureArr && textureArr[1] != null && textureArr[1] != ""){
            earth.DatabaseManager.PostFile(textureArr[1], STAMP_config.service.addBuildTopTexture + guid);    
        }
        if(textureArr && textureArr[2] != null && textureArr[2] != ""){
            earth.DatabaseManager.PostFile(textureArr[2], STAMP_config.service.addBuildBodyTexture + guid);    
        }
    }

    /**
     * 创建矢量楼块
     * @param  {[object]} paramsObj [传参对象]
     * @return {[type]}           [无]
     */
    function createShpBuilding(paramsObj){
        var mEditLayer = paramsObj.mEditLayer;
        var layerId = paramsObj.layerId;
        var guid = paramsObj.guid;
        var ydName = paramsObj.ydName;
        var name = paramsObj.name;
        var v3s = paramsObj.v3s;
        var buildingArea = paramsObj.buildingArea;
        var height = paramsObj.height;
        var floorHeight = paramsObj.floorHeight;
        var styleInfoList = paramsObj.styleInfoList; 
        var textureArr = paramsObj.textureArr;

        var info = earth.Factory.CreateDbEleInfo(guid, name);
        var infolist = earth.Factory.CreateDbEleInfoList();
        var styleinfo = earth.Factory.CreateStyleInfo();
        info.DrawOrder = 1000;
        info.Type = 14;
        info.StyleInfoList = styleInfoList;
        info.SphericalVectors.Add(v3s);
        info.Height = height;
        info.AltitudeType = 1;//贴地形
        infolist.AddItem(info);
        earth.Event.OnEditDatabaseFinished = function(pres, pFeat){
            earth.Event.OnEditDatabaseFinished = function(){};
            if(pFeat == null || pFeat.Count <= 0){
                alert("矢量楼块添加失败！");
                return;
            }
            //加载矢量楼块
            var model = projManager.createShpBuildingModel(pFeat.Items(0), textureArr);
            if(model == null){//创建失败，把入库的简单建筑删除掉
                earth.DatabaseManager.DeleteElementInLayer(STAMP_config.server.dataServerIP, layerId, guid);
                alert("矢量楼块添加失败！");
                return;
            }

            mEditLayer.BeginUpdate();
            mEditLayer.AttachObject(model);
            mEditLayer.EndUpdate();

            var params = {
                guid: guid,
                name: name,
                ydName: ydName,
                buildingArea: buildingArea,
                height: height,
                floorHeight: floorHeight,
                textureArr: textureArr
            };
            updateShpBuildingObj(params);
        }
        earth.DatabaseManager.AddElementListInLayer(STAMP_config.server.dataServerIP, layerId, infolist);
    }

    /**************************************************************************************************************************************/
    /**
     * 数据库中创建模型对象
     * @param  {[object]} editLayer    [编辑图层]
     * @param  {[string]} dataServerIP [数据库IP]
     * @param  {[string]} filepath     [模型文件路径]
     * @param  {[string]} fileName     [模型文件名称]
     * @param  {[string]} logPath      [日志路径]
     * @param  {[string]} reference    [空间参考文件路径]
     * @param  {[string]} shpLayerId   [矢量图层ID]
     * @param  {[string]} shpLayerName [矢量图层名称]
     * @param  {[string]} ydName       [用地名称]
     * @param  {[array]} planArr      [方案ID数组]
     * @return {[type]}              [无]
     */
    function createModelInDatabase(editLayer, dataServerIP, filepath, fileName, logPath, point, shpLayerId, shpLayerName, ydName, planArr){
        var generateEditDll = top.getGenerateEditIndex();
        var result = generateEditDll.run_single_point_no_thread(editLayer.Guid, dataServerIP, filepath, fileName, logPath, point.X, point.Y, point.Z);
        if (result){
            var count = generateEditDll.get_guid_count();
            if(count <= 0){
                alert("模型入库失败，请检查模型数据是否正常！");
                return;
            }
            var guid = generateEditDll.get_at(count - 1);
            earth.Event.OnEditDatabaseFinished = function(pres, pFeat){
                earth.Event.OnEditDatabaseFinished = function(){};
                   
                //根据GUID未找到模型对象
                if(pFeat == null){
                    alert("模型入库失败，未找到模型记录，请重新导入！");
                    return;
                }

                //创建模型对象
                editLayer.BeginUpdate();
                var editModel = earth.Factory.CreateEditModelByDatabase(pFeat.Guid, pFeat.Name, pFeat.MeshID, 1);
                editModel.BeginUpdate();
                editModel.SetBBox(pFeat.BBox.MinVec, pFeat.BBox.MaxVec);
                editModel.Editable = true;
                editModel.EndUpdate();
                editModel.SphericalTransform.SetLocation(pFeat.SphericalTransform.GetLocation());
                editModel.SphericalTransform.SetRotation(pFeat.SphericalTransform.GetRotation());
                editModel.SphericalTransform.SetScale(pFeat.SphericalTransform.GetScale());
                editLayer.AttachObject(editModel);
                editLayer.EndUpdate();

                //添加基底矢量面（参数模型）
                addModelShp(shpLayerId, shpLayerName, ydName, planArr, editModel);
            };
            earth.DatabaseManager.GetDataBaseRecordByGuid(dataServerIP, editLayer.Guid, guid);
        }
    }

    /**
     * 图层中添加模型
     * @param {[type]} shpEditLayer [description]
     * @param {[type]} shpLayerId   [description]
     * @param {[type]} ydName       [description]
     * @param {[type]} modelObj     [description]
     */
    function addModelInLayer(shpEditLayer, shpLayerId, ydName, modelObj){
        var infolist = earth.Factory.CreateDbEleInfoList();
        var objGuid = earth.Factory.CreateGuid();
        var objName = modelObj.name;

        var shpBuildingHeight = (shpInforArr[0].JZGD?shpInforArr[0].JZGD:3);

        var info = earth.Factory.CreateDbEleInfo(objGuid, objName);
        var styleinfo = earth.Factory.CreateStyleInfo();
        var stylelist = earth.Factory.CreateStyleInfoList();
        styleinfo.LineWidth = 1;
        styleinfo.FirstColor = 0xffffffff;
        styleinfo.SecondColor = 0xffffffff;
        stylelist.AddItem(styleinfo);
        info.DrawOrder = 1000;
        info.Type = 5;
        //如果shp文件中不存在JZGD字段,则默认给3米;用户可以在后面自己调整
        info.Height = shpBuildingHeight;
        info.StyleInfoList = stylelist;
        info.SphericalVectors.Add(v3sArr[0]);
        info.AltitudeType = 1;
        if(modelObj){
            info.SphericalTransform.SetScale(modelObj.SphericalTransform.GetScale());
            info.SphericalTransform.SetRotation(modelObj.SphericalTransform.GetRotation());
            info.SphericalTransform.SetLocation(modelObj.SphericalTransform.GetLocation());
        }
        infolist.AddItem(info);
        earth.Event.OnEditDatabaseFinished = function(pres, pFeat){
            earth.Event.OnEditDatabaseFinished = function(){};
            if(pFeat == null || pFeat.Count <= 0){
                alert("参数模型添加失败！");
                return;
            }
            //加载参数模型
            var model = projManager.createShpBuildingModel(pFeat.Items(0), ["","",""]);
            if(model == null){//创建失败，把入库的简单建筑删除掉
                earth.DatabaseManager.DeleteElementInLayer(STAMP_config.server.dataServerIP, shpLayerId, objGuid);
                alert("参数模型添加失败！");
                return;
            }
            shpEditLayer.BeginUpdate();
            shpEditLayer.AttachObject(model);
            shpEditLayer.EndUpdate();
            var params = {
                ydName: ydName,
                modelObj: modelObj
            };
            //简单建筑添加成功后，更新数据库
            updateParamModelObj(params);
        }
        earth.DatabaseManager.AddElementListInLayer(STAMP_config.server.dataServerIP,shpLayerId, infolist);
    }

    /**
     * 更新参数模型对象
     * @return {[type]} [无]
     */
    function updateParamModelObj(params){
        var ydName = params.ydName;
        var modelObj = params.modelObj;
        try{
            var buildNode = shpInforArr[0];
            var buildingID = modelObj.guid;
            var buildingNAME = modelObj.name;
            var xml = 
                "<CPBUILDING>"
                + "<ID>" + buildingID + "</ID>"
                + "<YDNAME>" + ydName + "</YDNAME>"
                + "<PLANID>" + top.currentPlanLayerId + "</PLANID>"
                + "<NAME>" + buildingNAME + "</NAME>"
                + "<JZXZ>" + (buildNode.JZXZ?buildNode.JZXZ:0) + "</JZXZ>"
                + "<JZJDMJ>" + (buildNode.JZJDMJ?buildNode.JZJDMJ:0) 
                + "</JZJDMJ><ZJZMJ>" +  (buildNode.ZJZMJ?buildNode.ZJZMJ:0) 
                + "</ZJZMJ><DSJZMJ>" + (buildNode.DSJZMJ?buildNode.DSJZMJ:0) 
                + "</DSJZMJ><ZZJZMJ>" + (buildNode.ZZJZMJ?buildNode.ZZJZMJ:0) 
                + "</ZZJZMJ><SYJZMJ>" + (buildNode.SYJZMJ?buildNode.SYJZMJ:0) 
                + "</SYJZMJ><YEYJZMJ>" + (buildNode.YEYJZMJ?buildNode.YEYJZMJ:0) 
                + "</YEYJZMJ><SQFWZXJZMJ>" + (buildNode.SQFWZXJZMJ?buildNode.SQFWZXJZMJ:0)
                + "</SQFWZXJZMJ><DXJZMJ>" + (buildNode.DXJZMJ?buildNode.DXJZMJ:0) 
                + "</DXJZMJ><DXSYMJ>" + (buildNode.DXSYMJ?buildNode.DXSYMJ:0) 
                + "</DXSYMJ><DXTCCMJ>" +  (buildNode.DXTCCMJ?buildNode.DXTCCMJ:0) 
                + "</DXTCCMJ><DXQTMJ>" + (buildNode.DXQTMJ?buildNode.DXQTMJ:0) 
                + "</DXQTMJ><JZGD>" + (buildNode.JZGD?buildNode.JZGD:0) 
                + "</JZGD><JZCS>" +  (buildNode.JZCS?buildNode.JZCS:0) 
                + "</JZCS><DSCS>" + (buildNode.DSCS?buildNode.DSCS:0) 
                + "</DSCS><DXCS>" + (buildNode.DXCS?buildNode.DXCS:0) 
                + "</DXCS><GHHS>" + (buildNode.GHHS?buildNode.GHHS:0) 
                + "</GHHS><HJRK>" + (buildNode.HJRK?buildNode.HJRK:0) 
                + "</HJRK><GHRS>" + (buildNode.GHRS?buildNode.GHRS:0) 
                + "</GHRS><ZTCW>" +  (buildNode.ZTCW?buildNode.ZTCW:0) 
                + "</ZTCW><DSTCW>" + (buildNode.DSTCW?buildNode.DSTCW:0) 
                + "</DSTCW><DXTCW>" + (buildNode.DXTCW?buildNode.DXTCW:0) 
                + "</DXTCW></CPBUILDING>";
            $.support.cors = true; //开启jQuery跨域支持
            $.ajaxSetup({
                async: false
            });
            var result = false;
            $.post(STAMP_config.service.add, xml, function (data) {
                 if (/true/.test(data)) {
                    result = true;
                }
            },"text");
            if(result){
                projManager.updatePlanIndex(top.currentPlanLayerId);    
            }
            if(modelObj){   
                var location = modelObj.SphericalTransform.GetLocation();
                earth.GlobeObserver.FlytoLookat(location.X, location.Y, location.Z, 0, 90, 0, 100, 3);
            }
        }catch(e){
            alert("建筑基底矢量面shp文件中字段格式不正确，请删除模型后重新导入！");
        }
    }

    /* 
     * 对线数据进行空间数据转换
     */
    function transformPolygon(poly) {
        var inerLine = poly.GetExteriorRing();
        var wInerLine = transformLinearRing(inerLine);
        var v3s = earth.Factory.CreateVector3s();
        for (var k = 0; k < wInerLine.length; k++) {
            var v = wInerLine[k];
            var v3 = earth.Factory.CreateVector3();
            v3.X = v.X;
            v3.Y = v.Y;
            v3.Z = v.Z;
            v3s.AddVector(v3);
        }
        return v3s;
    };

    /*
     * 根据line转换坐标
     */
    function transformLinearRing(line){
        var result = [];
        var pointNum = line.GetPointsCount();
        for (var j = 0; j < pointNum; j++){
            var point = line.GetPoint(j);
            var rawPoint = TransformPoint(point);
            result.push(rawPoint);
        }
        return result;
    };

    /* 
     * 对点数据进行空间数据转换 平面转经纬度
     */
    function TransformPoint(point){
        var rawPoint = top.SYSTEMPARAMS.pipeDatum.src_xy_to_des_BLH(point.X, point.Y, 0);
        return rawPoint;
    };

    /**
     * 添加模型基底文件-入库
     * @param {[type]} shpLayerId    [description]
     * @param {[type]} tempLayerName [description]
     * @param {[type]} ydName        [description]
     * @param {[type]} planArr       [description]
     * @param {[type]} modelObj      [description]
     */
    function addModelShp(shpLayerId, tempLayerName, ydName, planArr, modelObj){
        if(shpLayerId == ""){
            shpLayerId = earth.Factory.CreateGuid();
            //创建编辑图层
            var tempLayer = earth.Factory.CreateEditLayer(shpLayerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
            tempLayer.DataLayerType = 5;
            earth.AttachObject(tempLayer);
            top.editLayers[shpLayerId] = tempLayer;
            top.editLayers[shpLayerId].Visibility = false;
            top.editLayers[shpLayerId].Editable = true;
            
            earth.Event.OnEditDatabaseFinished = function(pRes, pLayer){
                if (pRes.ExcuteType == 1) {
                    earth.Event.OnEditDatabaseFinished = function(){};
                    projManager.addNewLayerData(pLayer);
                    addModelInLayer(top.editLayers[shpLayerId], shpLayerId, ydName, modelObj);
                }
            };
            var param = earth.Factory.CreateLayerParameter();
            param.Guid = shpLayerId;
            param.Name = tempLayerName;
            param.Type = 5;
            param.Status = 1;
            earth.DatabaseManager.AddLayerInDatabaseIncludeGroupID(STAMP_config.server.dataServerIP,param, -2);
            planArr.push(shpLayerId);
            projManager.updatePlanLayerIDs(top.currentPlanLayerId, ydName, planArr.join(","));
        }else{
            if(!top.editLayers[shpLayerId]){
                top.editLayers[shpLayerId] = earth.Factory.CreateEditLayer(shpLayerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                top.editLayers[shpLayerId].DataLayerType = 5;
                top.editLayers[shpLayerId].Visibility = false;
                top.editLayers[shpLayerId].Editable = true;
                earth.AttachObject(top.editLayers[shpLayerId]);
            }
            addModelInLayer(top.editLayers[shpLayerId], shpLayerId, ydName, modelObj);              
        }
    }

    /**
     * 读取建筑基地矢量面
     * @param  {[type]} shpFilePath [description]
     * @param  {[type]} location    [description]
     * @return {[type]}             [description]
     */
    var readShpJDM = function(shpFilePath, location){
        dataProcess.Load();
        var oGRDataProcess = dataProcess.OGRDataProcess;
        //通过shp的type获得shp的驱动
        var driver = oGRDataProcess.GetDriverByType(44);
        //通过该驱动打开shp文件
        var dataSource = driver.Open(shpFilePath, 0);
        for (var i = 0; i < dataSource.GetLayerCount(); i++) {
            //获得图层信息
            var layer = dataSource.GetLayer(i);
            //遍历该图层里面所有的记录数
            for (var j = 0; j < layer.GetFeatureCount(); j++) {
                //获取一条记录
                var feature = layer.GetFeature(j);
                //获取feature
                type = feature.GetGeometryType();
                type = Number(type.toString(16));
                //获取空间信息
                //判断几何类型 参见SEWkbGeometryType枚举类型
                if (type === 3 || type === 403) { // 面，来源于stamp的“导入shp”功能
                    var poly = feature.GetPolygon();
                    var v3s = transformPolygon(poly);
                    v3sArr.push(v3s);
                    var shpInfor = {};
                    //遍历该记录中所有的属性
                    for (var k = 0; k < feature.GetFieldCount(); k++) {
                        shpInfor[feature.GetFieldDefn(k)] = feature.GetFieldAsString(feature.GetFieldIndex(feature.GetFieldDefn(k)));
                    }
                    shpInforArr.push(shpInfor);
                }
            }
        }
        if(v3sArr && v3sArr.length != 1){
            alert("建筑基底面shp文件中应该有且仅有一个面！");
            return;
        }
    }

    /**
     * 添加模型对象，并添加到方案中
     * @param {[type]} filePath    [description]
     * @param {[type]} fileName    [description]
     * @param {[type]} pVal        [description]
     * @param {[type]} shpFilePath [description]
     */
    var _addModelData = function(filePath, fileName, pVal, shpFilePath){
        var projData = projManager.getProjectData({id: top.projNodeId});
        if(projData && projData.length > 0){
            projData = projData[0];
        }
        var ydLayer = top.editLayers[projData["CPPROJECT.PARCELLAYERID"]];
        if(!ydLayer){
            alert("没有规划用地数据");
            earth.ShapeCreator.Clear();
            return;
        }

        var ydName = "";
        v3sArr = [];
        shpInforArr = [];
        readShpJDM(shpFilePath);
        if(!v3sArr || v3sArr.length != 1 || !shpInforArr || shpInforArr.length != 1){
            alert("shp数据为空，请检查shp文件中是否有面数据");
            return;
        }
        var polygonBuilding = earth.Factory.CreatePolygon();
        polygonBuilding.AddRing(v3sArr[0]);
        var centerPoint = polygonBuilding.GetCenterPoint();
        var offsetX = pVal.X - centerPoint.X;
        var offsetY = pVal.Y - centerPoint.Y;
        var v3sObj = earth.Factory.CreateVector3s();
        for(var i = 0; i < v3sArr[0].Count; i++){
            var x = v3sArr[0].Items(i).X + offsetX;
            var y = v3sArr[0].Items(i).Y + offsetY;
            var z = v3sArr[0].Items(i).Z;
            v3sObj.Add(x, y, z);
        }
        v3sArr = [];
        v3sArr.push(v3sObj);
        var polygonBuilding2 = earth.Factory.CreatePolygon();
        polygonBuilding2.AddRing(v3sObj);
        for(var i = 0; i < ydLayer.GetObjCount(); i++){
            var itemObj = ydLayer.GetObjAt(i);
            if(itemObj){
                //判断是否在用地范围内
                var ydVector3s = itemObj.GetPolygon();
                var isInPolygon = earth.PolygonAlgorithm.PolysRelationship(ydVector3s, polygonBuilding2);
                if(isInPolygon == 1 || isInPolygon == 0){
                    ydName = itemObj.name;
                    break;
                }
            }
        }
        if(ydName == "" || ydName == undefined){
            alert("建筑不在用地范围内，或超出了用地范围");
            earth.ShapeCreator.Clear();
            return;
        }
        
        var layerId = "";
        var shpLayerId = "";
        var planArr = projManager.getLayerIdsByPlanId(top.currentPlanLayerId, ydName);
        for(var i = 0; i < planArr.length; i++){
            if(top.projectLayerMap[planArr[i]] && top.projectLayerMap[planArr[i]].LayerType == 1 
                && top.projectLayerMap[planArr[i]].name.indexOf("buildingsmodel") != -1){
                layerId = top.projectLayerMap[planArr[i]].guid;
            }else if(top.projectLayerMap[planArr[i]] && top.projectLayerMap[planArr[i]].LayerType == 5 
                && top.projectLayerMap[planArr[i]].name.indexOf("buildingspolygon") != -1){
                shpLayerId = top.projectLayerMap[planArr[i]].guid;
            }
        }   

        //禁止同方案下同一块用地下重复模型导入
        if(layerId && top.editLayers[layerId]){
            var modelLayer = top.editLayers[layerId];
            for(var i = 0; i < modelLayer.GetObjCount(); i++){
                var modelItem = modelLayer.GetObjAt(i);
                if(modelItem.name.toLowerCase() == fileName.toLowerCase()){
                    alert("模型'" + fileName + "'在该方案的" + ydName + "用地范围内已存在，请选择其他模型重试！");
                    return;
                }
            }
        }

        var projectNode = top.getOperatorObject().getCurrentProject();
        var projectName = projectNode?projectNode.name:"";
        var tempLayerName = (projectName?projectName+"_":"") + (top.currentPlanName?top.currentPlanName+"_":"") + "buildingsmodel_" + ydName;
        var tempShpLayerName = (projectName?projectName+"_":"") + (top.currentPlanName?top.currentPlanName+"_":"") + "buildingspolygon_" + ydName;
        if(layerId == ""){
            layerId = earth.Factory.CreateGuid();
            //创建编辑图层
            var tempLayer = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
            tempLayer.DataLayerType = 1;
            earth.AttachObject(tempLayer);
            top.editLayers[layerId] = tempLayer;
            top.editLayers[layerId].Visibility = true;
            top.editLayers[layerId].Editable = true;
            
            earth.Event.OnEditDatabaseFinished = function(pRes, pLayer){
                if (pRes.ExcuteType == 1) {
                    earth.Event.OnEditDatabaseFinished = function(){};
                    projManager.addNewLayerData(pLayer);
                    createModelInDatabase(top.editLayers[layerId], STAMP_config.server.dataServerIP, filePath, fileName, earth.RootPath + "\\temp", pVal, /*shp文件相关*/shpLayerId, tempShpLayerName, ydName, planArr);
                }
            };
            var param = earth.Factory.CreateLayerParameter();
            param.Guid = layerId;
            param.Name = tempLayerName;
            param.Type = 1;
            param.Status = 1;
            earth.DatabaseManager.AddLayerInDatabaseIncludeGroupID(STAMP_config.server.dataServerIP,param, -2);
            planArr.push(layerId);
            projManager.updatePlanLayerIDs(top.currentPlanLayerId, ydName, planArr.join(","));
        }else{
            if(!top.editLayers[layerId]){
                top.editLayers[layerId] = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                top.editLayers[layerId].DataLayerType = 1;
                top.editLayers[layerId].Visibility = true;
                top.editLayers[layerId].Editable = true;
                earth.AttachObject(top.editLayers[layerId]);
            }
            createModelInDatabase(top.editLayers[layerId], STAMP_config.server.dataServerIP, filePath, fileName, earth.RootPath + "\\temp", pVal, shpLayerId, tempShpLayerName, ydName, planArr);   
        }
    }

    /**
     * 导入模型数据，根据flag判断导入那种数据
     * @param  {[type]} flag         [description]
     * @return {[type]}              [description]
     */
    var _importModelData = function(flag) {
        var obj = {};
        obj.action = "add";
        obj.earth = earth;
        earth.ShapeCreator.Clear();
        if (flag === "model" || flag === "tree" || flag === "match") {//添加模型
            earth.Event.OnCreateGeometry = function(pVal) {
                if (pVal) {
                    obj.path = earth.Environment.RootPath;
                    obj.flag = flag;
                    var tag = 1;
                    if (flag === "model") {
                        obj.name = "模型";
                        tag = 1;
                    } else if (flag === "tree") {
                        obj.name = "树";
                        tag = 2;
                    } else if (flag === "match") {
                        obj.name = "小品";
                        tag = 3;
                    }
                    obj.tag = tag;
                    obj.flag = "match";
                    var rValue = showModalDialog("html/project/addModel.html", obj, "dialogWidth=305px;dialogHeight=147px;status=no");
                    if (obj.click === "false") {
                        earth.ShapeCreator.Clear();
                        return;
                    }
                    var guid = earth.Factory.CreateGuid();
                    obj.guid = guid;
                    obj.type = 229;
                    obj.longitude = pVal.Longitude;
                    obj.latitude = pVal.Latitude;
                    obj.altitude = pVal.Altitude;

                    var filePath = obj.link.substring(0, obj.link.lastIndexOf("\\"));
                    var fileName = obj.link.substring(obj.link.lastIndexOf("\\")+1);
                    var vct3 = earth.Factory.CreateVector3();
                    vct3.X = pVal.Longitude;
                    vct3.Y = pVal.Latitude;
                    vct3.Z = pVal.Altitude;
                    var shpFilePath = obj.shplink;
                    _addModelData(filePath, fileName, vct3, shpFilePath);
                }
            }
            earth.ShapeCreator.CreatePoint();
        } else if (flag == "simplebuilding") {//简单建筑
            earth.Event.OnCreateGeometry = function(pVal, type) {
                if (pVal) {
                    obj.path = earth.Environment.RootPath;
                    obj.floorsAllHeight = pVal.Height;
                    obj.earth = earth;
                    var rValue = showModalDialog("html/project/simpleBuilding.html", obj, "dialogWidth=343px;dialogHeight=483px;status=no");
                    if (obj.click === "false") {
                        earth.ShapeCreator.Clear();
                        return;
                    }
                    obj.guid = earth.Factory.CreateGUID();
                    obj.type = 280;
                    obj.vector3s = pVal.Vector3s;
                    obj.longitude = pVal.Longitude;
                    obj.latitude = pVal.Latitude;
                    obj.altitude = pVal.Altitude;

                    //保存vector3s对象
                    var v3sPolygon = earth.Factory.CreateVector3s();
                    var geoPoint3 = top.SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(obj.longitude, obj.latitude, obj.altitude);

                    for(var i = 0; i < obj.vector3s.Count; i++){
                        var vectX = geoPoint3.x + obj.vector3s.Items(i).X;
                        var vectY = geoPoint3.y + obj.vector3s.Items(i).Z;
                        var vect3 = top.SYSTEMPARAMS.pipeDatum.src_xy_to_des_BLH(vectX, vectY, 0);
                        var vectZ = earth.Measure.MeasureTerrainAltitude(vect3.X, vect3.Y);
                        v3sPolygon.Add(vect3.X, vect3.Y, vectZ);
                    }

                    //球上新建简单建筑模型
                    var polygonSimpleBuilding = earth.Factory.CreatePolygon();
                    polygonSimpleBuilding.AddRing(v3sPolygon);
                    var simpleBuilding = earth.factory.CreateSimpleBuilding(obj.guid, obj.name);
                    simpleBuilding.SphericalTransform.SetLocationEx(obj.longitude, obj.latitude, obj.altitude);
                    simpleBuilding.BeginUpdate();
                    var polygon = earth.factory.CreatePolygon();
                    polygon.AddRing(obj.vector3s);
                    simpleBuilding.SetPolygon(0, polygon);
                    var floorCount = parseInt(obj.floorCount);
                    var floorHeight = parseFloat(obj.floorHeight);
                    simpleBuilding.SetFloorsHeight(floorHeight * floorCount);
                    simpleBuilding.SetFloorHeight(floorHeight);
                    simpleBuilding.SetRoofType(obj.roofTypeNode);
                    var roofcolor = parseInt("0x" + obj.roofColor.toString().substring(1).toLowerCase());
                    var floorcolor = parseInt("0x" + obj.floorColor.toString().substring(1).toLowerCase());
                    simpleBuilding.FloorsColor = floorcolor;
                    simpleBuilding.RoofColor = roofcolor;
                    var floorMats = simpleBuilding.GetFloorsMaterialStyles();

                    floorMats.Items(0).DiffuseTexture = obj.roofTexture;
                    floorMats.Items(1).DiffuseTexture = obj.roofTexture;
                    for (var i = 2; i < floorMats.Count; i++) {
                        floorMats.Items(i).DiffuseTexture = obj.floorTexture;
                    }
                    var roofMats = simpleBuilding.GetRoofMaterialStyles();
                    for (var i = 0; i < roofMats.Count; i++) {
                        roofMats.Items(i).DiffuseTexture = obj.roofTexture;
                    }
                    simpleBuilding.EndUpdate();

                    //获取简单建筑的基底面积
                    var simpleBuildingArea = simpleBuilding.GetBottomArea();

                    //获取当前审批的项目数据
                    var projData = projManager.getProjectData({id: top.projNodeId});
                    if(projData && projData.length > 0){
                        projData = projData[0];
                    }

                    //获取用地范围线对象
                    var ydLayer = top.editLayers[projData["CPPROJECT.PARCELLAYERID"]];
                    if(!ydLayer){
                        alert("没有规划用地数据");
                        earth.ShapeCreator.Clear();
                        return;
                    }
                   
                    //获取范围在哪个用地范围内，获取用地名称
                    var ydName = "";
                    for(var i = 0; i < ydLayer.GetObjCount(); i++){
                        var itemObj = ydLayer.GetObjAt(i);
                        if(itemObj){
                            //判断是否在用地范围内
                            var ydVector3s = itemObj.GetPolygon();
                            var isInPolygon = earth.PolygonAlgorithm.PolysRelationship(ydVector3s, polygonSimpleBuilding);
                            if(isInPolygon == 1){
                                ydName = itemObj.name;
                                break;
                            }
                        }
                    }

                    //没有获取到ydName
                    if(ydName == "" || ydName == undefined){
                        alert("建筑不在用地范围内，或超出了用地范围");
                        earth.ShapeCreator.Clear();
                        return;
                    }

                    //下面是获取简单建筑的图层ID
                    var layerId = "";
                    var planArr = projManager.getLayerIdsByPlanId(top.currentPlanLayerId, ydName);
                    for(var i = 0; i < planArr.length; i++){
                        if(top.projectLayerMap[planArr[i]] && top.projectLayerMap[planArr[i]].LayerType == 8){
                            layerId = top.projectLayerMap[planArr[i]].guid;
                            break;
                        }
                    }

                    //数据库Element样式集
                    var styleinfo = earth.Factory.CreateStyleInfo();
                    styleinfo.FirstColor = roofcolor;
                    styleinfo.SecondColor = floorcolor;
                    var styleinfo2 = earth.Factory.CreateStyleInfo();
                    styleinfo2.FirstColor = roofcolor;
                    styleinfo2.SecondColor = floorcolor;
                    var stylelist = earth.Factory.CreateStyleInfoList();
                    stylelist.AddItem(styleinfo);

                    var projectName = "";
                    //获取规划审批面板中正在审批的项目节点
                    var projectNode = top.getOperatorObject().getCurrentProject();
                    if(projectNode){
                        projectName = projectNode.name;
                    }

                    var paramsObj = {
                        layerId: layerId, 
                        guid: obj.guid, 
                        ydName: ydName, 
                        name: obj.name, 
                        v3s: v3sPolygon, 
                        buildingArea: simpleBuildingArea, 
                        floorCount: floorCount, 
                        floorHeight: floorHeight, 
                        roofType: obj.roofTypeNode, 
                        styleInfoList: stylelist, 
                        roofTexture: obj.roofTexture, 
                        floorTexture: obj.floorTexture
                    }
                    //简单建筑的图层名称
                    var tempLayerName = (projectName?projectName+"_":"") + (top.currentPlanName?top.currentPlanName+"_":"") + "simplebuilding_" + ydName;
                    if(layerId == ""){//如果方案中没有简单建筑图层，则创建
                        layerId = earth.Factory.CreateGuid();

                        //创建编辑图层
                        var tempLayer = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                        tempLayer.DataLayerType = 8;
                        earth.AttachObject(tempLayer);
                        top.editLayers[layerId] = tempLayer;
                        paramsObj.layerId = layerId;
                        paramsObj.mEditLayer = top.editLayers[layerId];

                        earth.Event.OnEditDatabaseFinished = function(pRes, pLayer){
                            if (pRes.ExcuteType == 1) {//1表示图层创建成功
                                earth.Event.OnEditDatabaseFinished = function(){};
                                
                                //将创建的简单建筑图层加到项目图层Map映射中
                                projManager.addNewLayerData(pLayer);

                                //创建简单建筑模型到数据库图层中
                                createSimpleBuilding(paramsObj);
                            }
                        };

                        //下面是创建图层
                        var param = earth.Factory.CreateLayerParameter();
                        param.Guid = layerId;
                        param.Name = tempLayerName;
                        param.Type = 8;
                        param.Status = 1;
                        earth.DatabaseManager.AddLayerInDatabaseIncludeGroupID(STAMP_config.server.dataServerIP,param, -2);
                        planArr.push(layerId);
                        projManager.updatePlanLayerIDs(top.currentPlanLayerId, ydName, planArr.join(","));
                    }else{//存在简单建筑图层
                        //如果earth上没有加载简单建筑图层，则创建editLayer图层，并加载到球上
                        if(!top.editLayers[layerId]){
                            top.editLayers[layerId] = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                            top.editLayers[layerId].DataLayerType = 8;
                            top.editLayers[layerId].Visibility = true;
                            top.editLayers[layerId].Editable = true;
                            earth.AttachObject(top.editLayers[layerId]);
                        }
                        paramsObj.mEditLayer = top.editLayers[layerId];

                        //创建简单建筑模型到数据库图层中
                        createSimpleBuilding(paramsObj);
                    }
                    earth.ShapeCreator.Clear();
                }
            };
            earth.ShapeCreator.CreateVolume(0xffff0000);
        } else if(flag == "addAlbuginea"){//添加楼块
            obj.type = 207;
            obj.name = "立体多边形"; //volume
            earth.Event.OnCreateGeometry = function(pval, type) {
                if (pval) {
                    obj.path = earth.Environment.RootPath;
                    obj.floorsAllHeight = pval.Height;

                    var rValue = showModalDialog("html/project/shpBuilding.html", obj, "dialogWidth=305px;dialogHeight=399px;status=no");
                    if (obj.click === "false") {
                        earth.ShapeCreator.Clear();
                        return;
                    }
                    var guid = earth.Factory.CreateGUID();
                    obj.guid = guid;
                    var elementVolume = earth.Factory.CreateElementVolume(guid, obj.name);
                    elementVolume.BeginUpdate();
                    elementVolume.Selectable = true;
                    elementVolume.Editable = true;
                    elementVolume.Underground = false;
                    elementVolume.SphericalTransform.SetLocationEx(pval.Longitude, pval.Latitude, pval.Altitude);
                    elementVolume.Height = obj.floorCount * obj.floorHeight;//楼层数 X 层高
                    elementVolume.Vectors = pval.Vector3s;//绘制的底面点串
                    var fillcolor = parseInt("0x" + obj.fillcolor.toString().substring(1).toLowerCase()); 
                    elementVolume.FillColor = fillcolor;//填充色
                    var materialStyles = elementVolume.MaterialStyles;//材质样式
                    var count = materialStyles.Count;
                    for (var i = 0; i < count; i++) {
                        var materialStyle = materialStyles.Items(i);
                        materialStyle.DiffuseTexture = obj.texturePath[i];//材质贴图
                    }
                    elementVolume.EndUpdate();
                    var shpBuildingArea = elementVolume.BottomArea;//获取底面面积

                    //保存vector3s对象
                    var v3sPolygon = earth.Factory.CreateVector3s();
                    var geoPoint3 = top.SYSTEMPARAMS.pipeDatum.des_BLH_to_src_xy(pval.Longitude, pval.Latitude, pval.Altitude);
                    //坐标转换-获取标准的vector3s对象集
                    for(var i = 0; i < pval.Vector3s.Count; i++){
                        var vectX = geoPoint3.x + pval.Vector3s.Items(i).X;
                        var vectY = geoPoint3.y + pval.Vector3s.Items(i).Z;
                        var vect3 = top.SYSTEMPARAMS.pipeDatum.src_xy_to_des_BLH(vectX, vectY, 0);
                        var vectZ = earth.Measure.MeasureTerrainAltitude(vect3.X, vect3.Y);
                        v3sPolygon.Add(vect3.X, vect3.Y, vectZ);
                    }

                    //球上新建简单建筑模型
                    var polygonVolume = earth.Factory.CreatePolygon();
                    polygonVolume.AddRing(v3sPolygon);

                    var projData = projManager.getProjectData({id: top.projNodeId});
                    if(projData && projData.length > 0){
                        projData = projData[0];
                    }
                    var ydLayer = top.editLayers[projData["CPPROJECT.PARCELLAYERID"]];
                    if(!ydLayer){
                        alert("没有规划用地数据");
                        earth.ShapeCreator.Clear();
                        return;
                    }
                    var ydName = "";
                    for(var i = 0; i < ydLayer.GetObjCount(); i++){
                        var itemObj = ydLayer.GetObjAt(i);
                        if(itemObj){
                            //判断绘制的建筑模型是否在用地范围内
                            var ydVector3s = itemObj.GetPolygon();
                            var isInPolygon = earth.PolygonAlgorithm.PolysRelationship(ydVector3s, polygonVolume);
                            if(isInPolygon == 1){
                                ydName = itemObj.name;
                                break;
                            }
                        }
                    }

                    //为空则表示不在用地范围内或超出用地范围，禁止创建
                    if(ydName == "" || ydName == undefined){
                        alert("楼块不在用地范围内，或超出了用地范围");
                        earth.ShapeCreator.Clear();
                        return;
                    }

                    var projectName = "";
                    //获取规划审批面板中正在审批的项目节点
                    var projectNode = top.getOperatorObject().getCurrentProject();
                    if(projectNode){
                        projectName = projectNode.name;
                    }

                    var layerId = "";
                    //矢量楼块图层名称
                    var tempLayerName = (projectName?projectName+"_":"") + (top.currentPlanName?top.currentPlanName+"_":"") + "shpbuilding_" + ydName;
                    var planArr = projManager.getLayerIdsByPlanId(top.currentPlanLayerId, ydName);
                    for(var i = 0; i < planArr.length; i++){
                        if(top.projectLayerMap[planArr[i]] && top.projectLayerMap[planArr[i]].LayerType == 14 && top.projectLayerMap[planArr[i]].name.indexOf(tempLayerName) != -1){
                            layerId = top.projectLayerMap[planArr[i]].guid;
                            break;
                        }
                    }

                    //提前设置好样式-后面将作为参数传入
                    var styleinfo = earth.Factory.CreateStyleInfo();
                    styleinfo.DiffuseColor = fillcolor;
                    styleinfo.FirstColor = fillcolor;
                    styleinfo.SecondColor = fillcolor;
                    var stylelist = earth.Factory.CreateStyleInfoList();
                    stylelist.AddItem(styleinfo);

                    var paramsObj = {
                        layerId: layerId,
                        guid: obj.guid,
                        name: obj.name,
                        ydName: ydName,
                        v3s: v3sPolygon,
                        buildingArea: shpBuildingArea,
                        height: parseFloat(obj.floorCount) * parseFloat(obj.floorHeight),
                        floorHeight: parseFloat(obj.floorHeight),
                        styleInfoList: stylelist,
                        textureArr: obj.texturePath
                    };
                    if(layerId == ""){//假如不存在矢量楼块图层，则创建
                        layerId = earth.Factory.CreateGuid();
                        //创建编辑图层
                        var tempLayer = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                        tempLayer.DataLayerType = 14;
                        earth.AttachObject(tempLayer);
                        top.editLayers[layerId] = tempLayer;
                        top.editLayers[layerId].Visibility = true;
                        top.editLayers[layerId].Editable = true;
                        paramsObj.layerId = layerId;
                        paramsObj.mEditLayer = top.editLayers[layerId];

                        earth.Event.OnEditDatabaseFinished = function(pRes, pLayer){
                            if (pRes.ExcuteType == 1) {
                                projManager.addNewLayerData(pLayer);
                                earth.Event.OnEditDatabaseFinished = function(){};
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
                        projManager.updatePlanLayerIDs(top.currentPlanLayerId, ydName, planArr.join(","));
                    }else{//存在矢量楼块图层
                        if(!top.editLayers[layerId]){//假如矢量楼块图层没加载，则创建编辑图层加载
                            top.editLayers[layerId] = earth.Factory.CreateEditLayer(layerId, tempLayerName, earth.Factory.CreateLonLatRect(-90, 90, -180, 180, 0, 10), 0, 4.5, STAMP_config.server.dataServerIP);
                            top.editLayers[layerId].DataLayerType = 14;
                            top.editLayers[layerId].Visibility = true;
                            top.editLayers[layerId].Editable = true;
                            earth.AttachObject(top.editLayers[layerId]);
                        }
                        paramsObj.mEditLayer = top.editLayers[layerId];
                        createShpBuilding(paramsObj);
                    }
                    
                    earth.ShapeCreator.Clear();
                }
            };
            earth.ShapeCreator.CreateVolume(16711680);
        }
        earth.focus();
    };

    /**
     * 更新数据库对象
     * @param  {[object]} paramsObj [传入参数对象]
     * @return {[type]}           [无]
     */
    function updateSimpleBuildingObj(paramsObj) {
        var guid = paramsObj.guid;
        var name = paramsObj.name;
        var ydName = paramsObj.ydName;
        var buildingArea = paramsObj.buildingArea;
        var floorCount = paramsObj.floorCount;
        var floorHeight = paramsObj.floorHeight;
        var roofType = paramsObj.roofType;
        var roofTexture = paramsObj.roofTexture;
        var floorTexture = paramsObj.floorTexture;
        //下面是获取纹理图片类型
        if(roofTexture != null && roofTexture != ""){
            var roofTextureType = roofTexture.substring(roofTexture.lastIndexOf(".") + 1);
        }
        if(floorTexture != null && floorTexture != ""){
            var floorTextureType = roofTexture.substring(roofTexture.lastIndexOf(".") + 1);   
        }
        var xml = "<CPSIMPLEBUILD>" +
            "<ID>" + guid + "</ID>" +
            "<PLANID>" + top.currentPlanLayerId + "</PLANID>" +
            "<YDNAME>" + ydName + "</YDNAME>" +
            "<NAME>" + name + "</NAME>" +
            "<FLOOR>" + floorCount + "</FLOOR>" +
            "<FLOORHIGHT>" + floorHeight + "</FLOORHIGHT>" +
            "<TOTALAREA>" + (buildingArea * floorCount) + "</TOTALAREA>" +
            "<BASEAREA>" + buildingArea + "</BASEAREA>" +
            "<ROOFTYPE>" + roofType + "</ROOFTYPE>" +
            "<BOTTOMTEXTURETYPE></BOTTOMTEXTURETYPE>" +
            "<TOPTEXTURETYPE>" + roofTextureType + "</TOPTEXTURETYPE>" +
            "<BODYTEXTURETYPE>" + floorTextureType + "</BODYTEXTURETYPE>" +
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

        //下面是存放纹理图片
        if(roofTexture){
            earth.DatabaseManager.PostFile(roofTexture, STAMP_config.service.addBuildTopTexture + guid);    
        }
        if(floorTexture){
            earth.DatabaseManager.PostFile(floorTexture, STAMP_config.service.addBuildBodyTexture + guid);
        }
    }

    /**
     * 创建简单建筑
     * @param  {[object]} paramsObj [参数对象]
     * @return {[type]}           [无]
     */
    function createSimpleBuilding(paramsObj){
        //传入参数赋值
        var mEditLayer = paramsObj.mEditLayer;
        var layerId = paramsObj.layerId;
        var guid = paramsObj.guid;
        var name = paramsObj.name;
        var ydName = paramsObj.ydName;
        var v3s = paramsObj.v3s;
        var buildingArea = paramsObj.buildingArea;
        var floorCount = paramsObj.floorCount;
        var floorHeight = paramsObj.floorHeight;
        var roofType = paramsObj.roofType;
        var styleInfoList = paramsObj.styleInfoList;
        var roofTexture = paramsObj.roofTexture;
        var floorTexture = paramsObj.floorTexture;
        
        var sePolygon = earth.Factory.CreatePolygon();
        sePolygon.AddRing(v3s);
        var infolist = earth.Factory.CreateDbEleInfoList();
        var info = earth.Factory.CreateDbEleInfo(guid, name);
        info.DrawOrder = 1000;
        info.Type = 8;
        info.StyleInfoList = styleInfoList;
        info.SphericalVectors.Add(v3s);
        info.SphericalTransform.SetLocation(sePolygon.GetCenterPoint());
        info.height = floorCount * floorHeight;
        info.FloorHeight = floorHeight;
        info.AltitudeType = 1;
        info.RoofType = roofType;
        infolist.AddItem(info);
        earth.Event.OnEditDatabaseFinished = function(pres, pFeat){
            earth.Event.OnEditDatabaseFinished = function(){};
            if(pFeat == null || pFeat.Count <= 0){
                alert("简单建筑添加失败！");
                return;
            }
            //加载简单建筑模型
            var model = projManager.createSimpleBuildingModel(pFeat.Items(0), roofTexture, floorTexture, floorTexture);
            if(model == null){//创建失败，把入库的简单建筑删除掉
                earth.DatabaseManager.DeleteElementInLayer(STAMP_config.server.dataServerIP, layerId, guid);
                alert("简单建筑添加失败！");
                return;
            }
            mEditLayer.BeginUpdate();
            mEditLayer.AttachObject(model);
            mEditLayer.EndUpdate();
            var params = {
                guid: guid,
                name: name,
                ydName: ydName,
                buildingArea: buildingArea,
                floorCount: floorCount,
                floorHeight: floorHeight,
                roofType: roofType,
                roofTexture: roofTexture, 
                floorTexture: floorTexture
            };
            //简单建筑添加成功后，更新数据库
            updateSimpleBuildingObj(params);
        }
        earth.DatabaseManager.AddElementListInLayer(STAMP_config.server.dataServerIP, layerId, infolist);
    }

    userdata.importModelData = _importModelData;//添加模型-model模型-simplebuilding简单建筑-addAlbuginea添加楼块
    return userdata;
}
