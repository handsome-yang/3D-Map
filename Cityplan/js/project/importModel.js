/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月26日
 * 描    述：导入矢量楼块
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */

var earth = "";
var dataProcess = null;
var projManager = null;
var projNodeId = "";
var editLayers = null;
var currentPlanLayerId = "";
var projectLayerIdList = null;
var projectLayerMap = null;
var SYSTEMPARAMS = null;
var generateEditDll = null;
var projectNode = null;
var currentPlanName = "";

/**
 * 检查
 * @return {[type]} [description]
 */
function check() {
    var filepath = document.getElementById("filepath").value;
    if ("" == filepath) {
        alert("请选择模型文件！");
        return false;
    }
    var shpFilepath = document.getElementById("shpFilePath").value;
    if ("" == shpFilepath) {
        alert("请选择基底文件！");
        return false;
    }
    var referenceInput = document.getElementById("referenceInput").value;
    if ("" == referenceInput) {
        alert("请选择投影文件！");
        return false;
    }
    return true;
}

function getEarth(earthObj) {
    earth = earthObj;
    var projManager = earth.projManager;
    projNodeId = earth.projNodeId;
    editLayers = earth.editLayers;;
    currentPlanLayerId = earth.currentPlanLayerId;
    projectLayerMap = earth.projectLayerMap;
    projectLayerIdList = earth.projectLayerIdList;
    SYSTEMPARAMS = earth.SYSTEMPARAMS;
    generateEditDll = earth.generateEditDll;
    projectNode = earth.projectNode;
    currentPlanName = earth.currentPlanName;
    dataProcess = document.getElementById("dataProcess");
    dataProcess.Load();
    var loop = 0;
    var recordDic = {};
    var filename = "MyPlace";
    var analysis = earth.analysisObj;
    var userdata = earth.userdataTemp;
    var v3sArr = [];//矢量面
    var shpInforArr = [];//建筑属性信息
    $("#btnAdd").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "usb文件(*.usb)|*.usb");
        if (filePath == "") {
            return;
        }

        $("#filepath").attr("value", filePath);

        var row = {
            "name": loop,
            "desp": filePath
        };
        if ("" != $("#referenceInput").val() && "" != $("#shpFilePath").val()) {
            $("#btnImport").removeAttr("disabled");
        }
    });

    //添加矢量面
    $("#btnAddShp").click(function(){
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "shp文件(*.shp)|*.shp");
        if (filePath == "") {
            return;
        }
        
        $("#shpFilePath").attr("value", filePath);
        
        if ("" != $("#referenceInput").val() && "" != $("#filepath").val()) {
            $("#btnImport").removeAttr("disabled");
        }
    });

    //选择投影文件
    $("#addSpatialReference").click(function() {
        var filePath = earth.UserDocument.OpenFileDialog(earth.RootPath, "spatial文件(*.spatial)|*.spatial");
        if (filePath == "") {
            return;
        }
        $("#referenceInput").attr("value", filePath);
        if ("" != $("#filepath").val() && "" != $("#shpFilePath").val()) {
            $("#btnImport").removeAttr("disabled");
        }
    });

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
    function createModelInDatabase(editLayer, dataServerIP, filepath, fileName, logPath, reference, shpLayerId, shpLayerName, ydName, planArr){
        var result = generateEditDll.run_single_ref_no_thread(editLayer.guid, dataServerIP, filepath, fileName, reference, logPath);                    
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

                addModelShp(shpLayerId, shpLayerName, ydName, planArr, editModel);
            };
            //根据GUID查找模型对象
            earth.DatabaseManager.GetDataBaseRecordByGuid(dataServerIP, editLayer.Guid, guid);
        }
    }

    /*
     *添加模型到图层中
     */
    function addModelInLayer(shpEditLayer, shpLayerId, ydName, modelObj){
        var infolist = earth.Factory.CreateDbEleInfoList();
        var objGuid = earth.Factory.CreateGuid();
        var objName = modelObj.name;

        //建筑高度
        var shpBuildingHeight = (shpInforArr[0].JZGD?shpInforArr[0].JZGD:3);

        //创建数据库对象
        var info = earth.Factory.CreateDbEleInfo(objGuid, objName);
        var styleinfo = earth.Factory.CreateStyleInfo();
        var stylelist = earth.Factory.CreateStyleInfoList();
        styleinfo.LineWidth = 1;
        styleinfo.FirstColor = 0xffffffff;
        styleinfo.SecondColor = 0xffffffff;
        stylelist.AddItem(styleinfo);
        info.DrawOrder = 1000;
        info.Type = 5;
        info.StyleInfoList = stylelist;
        info.SphericalVectors.Add(v3sArr[0]);
        info.Height = shpBuildingHeight;
        info.AltitudeType = 1;
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
                modelObj: modelObj,
                paramModel: model
            };
            //简单建筑添加成功后，更新数据库
            updateParamModelObj(params);
        }
        //参数模型对象数据库对象入库
        earth.DatabaseManager.AddElementListInLayer(STAMP_config.server.dataServerIP, shpLayerId, infolist);
    }

    /**
     * 更新参数模型
     * @param  {[type]} params [参数对象]
     * @return {[type]}        [description]
     */
    function updateParamModelObj(params){
        var ydName = params.ydName;
        var modelObj = params.modelObj;
        var elementVolume = params.paramModel;
        if(modelObj){//传入模型对象不为空时，更新坐标位置
            //将模型对象移动到基底矢量面处。同时更新数据库
            modelObj.SphericalTransform.SetScale(elementVolume.SphericalTransform.GetScale());
            modelObj.SphericalTransform.SetRotation(elementVolume.SphericalTransform.GetRotation());
            var location = elementVolume.SphericalTransform.GetLocation();
            var locationModel = modelObj.SphericalTransform.GetLocation();
            modelObj.SphericalTransform.SetLocationEx(location.X, location.Y, locationModel.Z);
            
            //下面是更新数据库
            var baseobj = earth.Factory.CreateDataBaseObject(modelObj.Guid, modelObj.Name);
            baseobj.SphericalTransform.SetScale(modelObj.SphericalTransform.GetScale());
            baseobj.SphericalTransform.SetRotation(modelObj.SphericalTransform.GetRotation());
            baseobj.SphericalTransform.SetLocation(modelObj.SphericalTransform.GetLocation());
            earth.DatabaseManager.UpdateSpatialPose(STAMP_config.server.dataServerIP,modelObj.GetParentNode().Guid, baseobj.Guid, baseobj);
            
            //位置更新完成后飞行定位
            locationModel = modelObj.SphericalTransform.GetLocation();
            earth.GlobeObserver.FlytoLookat(locationModel.X, locationModel.Y, locationModel.Z, 0, 90, 0, 100, 3);
        }

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
            alert("导入成功!");
        }catch(e){
            alert("建筑基底矢量面shp文件中字段格式不正确，请删除模型后重新导入！");
        }
    }

    /**
     * 对线数据进行空间数据转换
     * @param  {[type]} poly  [矢量面]
     * @param  {[type]} datum [空间参考]
     * @return {[type]}       [点集合]
     */
    function transformPolygon(poly, datum) {
        var inerLine = poly.GetExteriorRing();
        var wInerLine = transformLinearRing(inerLine, datum);
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

    /**
     * 根据line转换坐标
     * @param  {[type]} line  [线]
     * @param  {[type]} datum [空间参考]
     * @return {[type]}       [点集合]
     */
    function transformLinearRing(line, datum){
        var result = [];
        var pointNum = line.GetPointsCount();
        for (var j = 0; j < pointNum; j++){
            var point = line.GetPoint(j);
            var rawPoint = TransformPoint(point, datum);
            result.push(rawPoint);
        }
        return result;
    };

    /**
     * 对点数据进行空间数据转换 平面转经纬度
     * @param {[type]} point [点]
     * @param {[type]} datum [空间参考]
     */
    function TransformPoint(point, datum){
        var rawPoint = datum.src_xy_to_des_BLH(point.X, point.Y, 0);
        return rawPoint;
    };


    /**
     * 添加模型基底文件-入库
     * @param {[type]} shpLayerId    [参数模型图层ID]
     * @param {[type]} tempLayerName [当前图层名称]
     * @param {[type]} ydName        [用地名称]
     * @param {[type]} planArr       [方案相关图层的ID数组]
     * @param {[type]} modelObj      [模型对象]
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
     * @param  {[type]} shpFilePath [矢量文件路径]
     * @param  {[type]} datum       [空间参考]
     * @return {[type]}             [description]
     */
    var readShpJDM = function(shpFilePath, datum){
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
                    var v3s = transformPolygon(poly, datum);
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
     * 移除按钮禁用状态
     * @return {[type]} [description]
     */
    function removeDisabled(){
        $('#btnAdd').attr("disabled", false);
        $('#btnAddShp').attr("disabled", false);
        $('#addSpatialReference').attr("disabled", false);
        $('#clear').attr("disabled", false);
        $('#btnImport').attr("disabled", false);
    }

    //导入模型
    $("#btnImport").click(function() {
        if (check()) {
            var reference = $("#referenceInput").val();
            $('#btnAdd').attr("disabled", true);
            $('#btnAddShp').attr("disabled", true);
            $('#addSpatialReference').attr("disabled", true);
            $('#clear').attr("disabled", true);
            $('#btnImport').attr("disabled", true);
            if (reference != undefined && reference != "") {
                if(!dataProcess){
                    dataProcess = document.getElementById("dataProcess");
                    dataProcess.Load();
                }
                var spatial = dataProcess.CoordFactory.CreateSpatialRef();
                spatial.InitFromFile(reference);
                var datum = dataProcess.CoordFactory.CreateDatum();
                datum.Init(spatial);

                var link = $('#filepath').val();
                var shpFilePath = $('#shpFilePath').val();
                var texttrue = link.split("\\");
                var filePath = link.substring(0, link.lastIndexOf("\\"));
                var fileName = link.substring(link.lastIndexOf("\\")+1);
                var texttrueFname = texttrue[texttrue.length - 1];

                var projData = projManager.getProjectData({id: top.projNodeId});
                if(projData && projData.length > 0){
                    projData = projData[0];
                }
                var ydLayer = top.editLayers[projData["CPPROJECT.PARCELLAYERID"]];
                if(!ydLayer){
                    alert("没有规划用地数据");
                    removeDisabled();
                    return;
                }
                
                var ydName = "";
                v3sArr = [];
                shpInforArr = [];
                readShpJDM(shpFilePath, datum);
                if(!v3sArr || v3sArr.length != 1 || !shpInforArr || shpInforArr.length != 1){
                    alert("基底矢量面数据为空，请检查基底矢量面文件是否有面数据");
                    removeDisabled();
                    return;
                }
                var polygonBuilding = earth.Factory.CreatePolygon();
                polygonBuilding.AddRing(v3sArr[0]);
                for(var i = 0; i < ydLayer.GetObjCount(); i++){
                    var itemObj = ydLayer.GetObjAt(i);
                    if(itemObj){
                        //判断是否在用地范围内
                        var ydVector3s = itemObj.GetPolygon();
                        var isInPolygon = earth.PolygonAlgorithm.PolysRelationship(ydVector3s, polygonBuilding);
                        if(isInPolygon == 1 || isInPolygon == 0){
                            ydName = itemObj.name;
                            break;
                        }
                    }
                }
                if(ydName == "" || ydName == undefined){
                    alert("建筑不在用地范围内，或超出了用地范围");
                    removeDisabled();
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
                if(layerId && top.editLayers[layerId]){
                    var modelLayer = top.editLayers[layerId];
                    for(var i = 0; i < modelLayer.GetObjCount(); i++){
                        var modelItem = modelLayer.GetObjAt(i);
                        if(modelItem.name.toLowerCase() == fileName.toLowerCase()){
                            alert("模型'" + fileName + "'在该方案的" + ydName + "用地范围内已存在，请选择其他模型重试！");
                            removeDisabled();
                            return;
                        }
                    }
                }
                var projectName = projectNode?projectNode.name:"";
                var tempLayerName = (projectName?projectName+"_":"") + (currentPlanName?currentPlanName+"_":"") + "buildingsmodel_" + ydName;
                var tempShpLayerName = (projectName?projectName+"_":"") + (currentPlanName?currentPlanName+"_":"") + "buildingspolygon_" + ydName;
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
                            createModelInDatabase(top.editLayers[layerId], STAMP_config.server.dataServerIP, filePath, fileName, earth.RootPath + "\\temp", reference, /*shp文件相关*/shpLayerId, tempShpLayerName, ydName, planArr);
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
                    createModelInDatabase(top.editLayers[layerId], STAMP_config.server.dataServerIP, filePath, fileName, earth.RootPath + "\\temp", reference, /*shp文件相关*/shpLayerId, tempShpLayerName, ydName, planArr);
                }

                //如果图层ID未添加到项目图层ID集合里面，则添加进去
                if($.inArray(layerId, top.projectLayerIdList) == -1){
                    top.projectLayerIdList.push(layerId);    
                }
        
                removeDisabled();
            } else {
                alert("请选择投影文件!");
                $('#btnAdd').attr("disabled", false);
                $('#btnAddShp').attr("disabled", false);
                $('#addSpatialReference').attr("disabled", false);
                $('#clear').attr("disabled", false);
                $('#btnImport').attr("disabled", false);
                $("#filepath").val("");
                $("#referenceInput").val("");
            }
        }
    });

    $("#clear").click(function() {
        analysis.clearHtmlBallon(earth.htmlBallon);
        analysis.clearMenuStyle();
    });
}