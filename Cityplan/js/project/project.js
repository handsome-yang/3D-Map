/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月10日
 * 描    述：方案管理工具类STAMP.ProjectManager
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */
if (!STAMP) {
    var STAMP = {};
}
STAMP.ProjectManager = function (earth, dataProcess) {
    var projManager = {};
    var imgPathMgr = "../../images/project/";    // 方案树图标路径，相对管理页面的路径
    var imgPathInves = "../../images/project/";  // 方案树图标路径，相对审批树页面的路径
    var sep = "-";    // 分隔符，特殊节点（如规划专题、方案的阶段）ID由项目ID+sep+编码组成

    /********************************方案相关变量 START***************************************/
    //加载数据库图层
    var currentLayerDatas = [];//所有现状图层数组（自定义对象）
    var databaseLayers = {};//所有编辑图层map（guid，layer）
    var databaseLayersArr = [];//所有编辑图层数组
    var editLayers = {}; //记录数据库中所有已加载的编辑图层
    var ploygonLayersVcts3 = {}; //规划用地（Vector3s数组）
    var currentLayerIdList = []; //记录现状图层ID列表（groupid == -3）
    var projectLayerIdList = []; //记录项目图层ID列表（groupid == -2）
    var otherLayerIdList = []; //记录其他图层ID列表
    var currentLayerObjList = {}; //用地范围内所有的现状图层模型对象列表（用地范围内）
    var checkedStatusList = []; //记录复选框状态

    var planLayerIDs = {};//方案对应所有相关图层ID
    var parcelLayerGuid2 = null; //球2的规划用地图层guid
    var curLayers = [];//现状图层数组
    var layer = null;
    var curEditLayers = {};
    var cur3EditLayers = [];
    var currentApproveProjectGuid = "";//当前正在审批的项目GUID
    /********************************方案相关变量 END***************************************/

    /**
     * 保存所有需要的数据库中的空间图层属性信息，键值为图层guid
     */
    $.support.cors = true; //开启jQuery跨域支持
    $.ajaxSetup({
        async: false  // 将ajax请求设为同步
    });

    /**
     * 获取所有的编辑图层
     * @return {[type]} [description]
     */
    var getEditLayers = function(){
        return editLayers;
    };

    /**
     * 获取用地范围内所有的现状图层模型对象列表（用地范围内）
     * @return {[type]} [description]
     */
    var getCurrentLayerObjList = function(){
        return currentLayerObjList;
    }

    /**
     * 方案对应所有相关图层ID
     * @return {[type]} [description]
     */
    var getPlanLayerIDs = function(){
        return planLayerIDs;
    };

    /**
     * 获取规划用地图层guid
     * @return {[type]} [description]
     */
    var getParcelLayerGuid2 = function() {
        return parcelLayerGuid2;
    }

    /**
     * 从数据库中查询数据
     * @param serviceUrl 查询服务地址
     * @param xmlQuery 查询XML语句
     * @return {Array} 返回结果，如果没有查到符合条件的内容，返回空数组
     * @private
     */
    var _queryData = function (serviceUrl, xmlQuery) {
        var result = [];
        var res = dbUtil(serviceUrl, xmlQuery);
        res = $.xml2json(res).record;
        if (res) {
            if ($.isArray(res)) {
                result = res;
            } else {
                result.push(res);
            }
        }
        return result;
    };

    /*显示或隐藏参数模型
     *@param curPlanId 当前方案ID
     *@param 参数模型图层是否显示
     *@param 参数模型图层是否可编辑
     *@return 无
     */
    var showParamModel = function(curPlanId, isShow, isEdit){
        if(getParamModelVisibility() == isShow){
            return;
        }
        var plans = _getLayerIdsByPlanId(curPlanId);
        for(var i = 0; i < plans.length; i++){
            var editLayer = top.editLayers[plans[i]];
            if(editLayer && editLayer.name.indexOf("buildingsmodel") != -1){
                if(isShow){
                    editLayer.Visibility = false;
                }else{
                    editLayer.Visibility = true;
                    if(isEdit != undefined){
                        editLayer.Editable = isEdit;
                    }
                }
            }else if(editLayer && editLayer.name.indexOf("buildingspolygon") != -1){
                if(isShow){
                    editLayer.Visibility = true;
                    if(isEdit != undefined){
                        editLayer.Editable = isEdit;
                    }
                }else{
                    editLayer.Visibility = false;
                }
            }
        }
        if(isShow){
            top.getOperatorObject().$('#contextMenuPlan').menu("setIcon", {
                target: top.getOperatorObject().$("#divShowParamModel"),
                iconCls: 'icon-ok'
            });
        }else{
            top.getOperatorObject().$('#contextMenuPlan').menu("setIcon", {
                target: top.getOperatorObject().$("#divShowParamModel"),
                iconCls: 'icon-blank'
            });
        }
    }

    /**
     * 获取参数模型图层显示状态
     * @return 参数模型图层是否显示 （true：显示，false：不显示）
     */
    var getParamModelVisibility = function(){
        if(top.getOperatorObject().$("#divShowParamModel .menu-icon").hasClass("icon-ok")){
            return true;
        }else{
            return false;
        }
    }

	/**
     * 通过建筑模型ID查询到模型属性信息
     * @param  {[type]} curBuildingId [建筑模型ID]
     * @return {[type]}               [description]
     */
	var getBuildingDataById = function (curBuildingId){
		var buildingQueryXml =
            '<QUERY>' +
                '<CONDITION><AND><ID tablename = "CPBUILDING">=\'' + curBuildingId + '\'</ID></AND></CONDITION>' +
                '<RESULT><CPBUILDING></CPBUILDING></RESULT>' +
                '</QUERY>';
        return _queryData(STAMP_config.service.query, buildingQueryXml);
	}

    /**
     * 通过简单建筑模型ID查询到模型属性信息
     * @param  {[type]} curBuildingId [简单建筑模型ID]
     * @return {[type]}               [description]
     */
    var getSimpleBuildingDataById = function(curBuildingId){
        var buildingQueryXml =
            '<QUERY>' +
                '<CONDITION><AND><ID tablename = "CPSIMPLEBUILD">=\'' + curBuildingId + '\'</ID></AND></CONDITION>' +
                '<RESULT><CPSIMPLEBUILD></CPSIMPLEBUILD></RESULT>' +
                '</QUERY>';
        return _queryData(STAMP_config.service.query, buildingQueryXml);
    }

	/**
     * 修改数据库表CPBUILDING中建筑模型的建筑高度值
     * @param  {[type]} buildId       [建筑模型ID]
     * @param  {[type]} newHeight     [高度]
     * @param  {[type]} newFloorCount [楼层数]
     * @param  {[type]} zjzmj         [总建筑面积]
     * @return {[type]}               [description]
     */
	var updateBuildHeight = function (buildId, newHeight, newFloorCount, zjzmj){
		xmlUpdate = "<CPBUILDING>" +
            "<CONDITION><ID> ='" + buildId + "' </ID></CONDITION>" +
            "<CONTENT><JZGD>" + newHeight + "</JZGD><JZCS>" + newFloorCount + "</JZCS><ZJZMJ>" + zjzmj + "</ZJZMJ></CONTENT>" +
            "</CPBUILDING>";
        $.ajaxSetup({
            async: false  // 将ajax请求设为同步
        });
        var isSuccess = false;
        $.post(STAMP_config.service.update, xmlUpdate, function (data) {
            isSuccess = true;
        }, "text");
        return isSuccess;
	}

    /**
     * 修改数据库表CPBUILDING中建筑模型的建筑高度值
     * @param  {[string]} buildId        [简单建筑ID]
     * @param  {[num]} newFloorHeight [层高]
     * @param  {[num]} newFloorCount  [楼层数]
     * @param  {[num]} totalArea      [总基底面积]
     * @return {[bool]}                [是否成功]
     */
    var updateSimpleBuildHeight = function (buildId, newFloorHeight, newFloorCount, totalArea){
        xmlUpdate = "<CPSIMPLEBUILD>" +
            "<CONDITION><ID> ='" + buildId + "' </ID></CONDITION>" +
            "<CONTENT><FLOOR>" + newFloorCount + "</FLOOR><FLOORHIGHT>" + newFloorHeight + "</FLOORHIGHT><TOTALAREA>" + totalArea + "</TOTALAREA></CONTENT>" +
            "</CPSIMPLEBUILD>";
        $.ajaxSetup({
            async: false  // 将ajax请求设为同步
        });
        var isSuccess = false;
        $.post(STAMP_config.service.update, xmlUpdate, function (data) {
            isSuccess = true;
        }, "text");
        return isSuccess;
    }

	//修改数据库表CPBUILDING中建筑模型的总建筑面积
	var updateBuildZJZMJ = function (buildId, DSJZMJ){
		xmlUpdate = "<CPBUILDING>" +
            "<CONDITION><ID> ='" + buildId + "' </ID></CONDITION>" +
            "<CONTENT><ZJZMJ>" + DSJZMJ + "</ZJZMJ></CONTENT>" +
            "</CPBUILDING>";
        $.post(STAMP_config.service.update, xmlUpdate);
	}

    /*根据方案ID和用地名称，获取3DMax模型指标信息
    **planId:方案ID--必须传入
    **ydName:用地名称--可不传
    **返回值：3DMax模型的指标信息
    */
    var getBuildingDataByPlanId=function(planId, ydName){
        var  buildingQueryXml =
            '<QUERY>' +
                '<CONDITION><AND>'+
                "<PLANID tablename = 'CPBUILDING'>='" + planId + "'</PLANID>" +
                (ydName == undefined ? "" : ("<YDNAME tablename = 'CPBUILDING'>='" + ydName + "'</YDNAME>")) +
                '</AND></CONDITION>'+
                '<RESULT><CPBUILDING></CPBUILDING></RESULT>' +
                '</QUERY>';
        return _queryData(STAMP_config.service.query, buildingQueryXml);
    }

    /*根据方案ID和用地名称，获取简单建筑和矢量楼块指标信息
    **planId:方案ID--必须传入
    **ydName:用地名称--可不传
    **返回值：简单建筑和矢量楼块的指标信息
    */
    var getSimpleBuildingDataByPlanId = function(planId, ydName){
        var  buildingQueryXml =
            '<QUERY>' +
                '<CONDITION><AND>'+
                "<PLANID tablename = 'CPSIMPLEBUILD'>='" + planId + "'</PLANID>"+
                (ydName == undefined ? "" : ("<YDNAME tablename = 'CPSIMPLEBUILD'>='" + ydName + "'</YDNAME>")) +
                '</AND></CONDITION>'+
                '<RESULT><CPSIMPLEBUILD></CPSIMPLEBUILD></RESULT>' +
                '</QUERY>';
        return _queryData(STAMP_config.service.query, buildingQueryXml);
    }

    var getBuildingShpByPlanId = function(planId){
        var buildingShpXml = "<QUERY>"+"<CONDITION><AND>"+
            "<PLANID tablename = 'BUILDINGSHP'>='" +planId+"'</PLANID>"+
            "</AND></CONDITION>"+
            "<RESULT><BUILDINGSHP></BUILDINGSHP></RESULT>"+
            "</QUERY>"
            return _queryData(STAMP_config.service.query, buildingShpXml);
    }
    /**
     * 根据项目ID查询属于该项目的所有方案
     * @param projId 项目ID
     * @param type 方案类型编码：1,2,3,4
     * @return {*} 返回方案记录对象：包含对象的数组或者单个对象
     */
    var getPlanData = function (projId, type) {
        var planQueryXml =
            '<QUERY><CONDITION><AND>' +
                (projId ? ('<PROJECTID tablename = "CPPLAN">=\'' + projId + '\'</PROJECTID>') : '') +
                (type ? ('<TYPE tablename = "CPPLAN">=' + type + '</TYPE>') : '') +
                '</AND></CONDITION>' +
                '<RESULT><CPPLAN></CPPLAN></RESULT>' +
                '</QUERY>';
        return _queryData(STAMP_config.service.query, planQueryXml);
    };

    /**
     * 根据方案ID获取方案信息
     * @param id 方案ID
     * @return 返回方案记录信息-数组
     */
    var getPlanById = function (id) {
        var planQueryXml =
            '<QUERY>' +
                '<CONDITION><AND><ID tablename = "CPPLAN">=\'' + id + '\'</ID></AND></CONDITION>' +
                '<RESULT><CPPLAN></CPPLAN></RESULT>' +
                '</QUERY>';
        return _queryData(STAMP_config.service.query, planQueryXml);
    };

    /**
     * 根据方案中包含的建筑物数据属性统计方案指标
     * @param planId 方案ID
     * @param projId 项目ID
     * @param planType 方案类型：1,2,3,4
     * @return {*}
     */
    var getPlanIndex = function (planId, projId, planType) {
        var xmlCount = (planType <= 2 ? "<PLAN_TARGET_1>" : "<PLAN_TARGET_2>") +
            "<PROJECT_ID>" + projId + "</PROJECT_ID>" +
            "<PLAN_ID>" + planId + "</PLAN_ID>" +
            (planType <= 2 ? "</PLAN_TARGET_1>" : "</PLAN_TARGET_2>");
        var res = dbUtil(STAMP_config.service.count, xmlCount);
        res = $.xml2json(res);
        if (res) {
            return res;
        }
        return null;
    };

    /**
     * 更新项目的审批状态
     * @param id 项目ID
     * @param status 0,1,2
     */
    var updateStatus = function (id, status) {
        xmlUpdate = "<CPPROJECT>" +
            "<CONDITION><ID> ='" + id + "' </ID></CONDITION>" +
            "<CONTENT><STATUS>" + status + "</STATUS></CONTENT>" +
            "</CPPROJECT>";
        $.post(STAMP_config.service.update, xmlUpdate);
    };

    /**
     * 根据项目ID获取用地数组
     * @param projectId 项目id
     * @return {*} 返回项目内的用地名称--数组
     */
    var getYongDiArray = function(projectId){
        var projData = getProjectData({id:projectId});
        var ydNameArr = [];
        for(var i = 0; i < projData.length; i++){
            if($.inArray(projData[i]["CPPROJECT.YDNAME"], ydNameArr) == -1){
                ydNameArr.push(projData[i]["CPPROJECT.YDNAME"]);
            }
        }
        return ydNameArr;
    }

    /**
     * 根据3DMax模型对象找到参数模型对象
     * @param planLayers 方案图层数组
     * @param getEditLayers 所有编辑图层的map对象
     * @param obj 模型对象
     * @param editLayer 模型图层
     * @return {*} 返回参数模型对象
     */
    var getPolygonObjByModel = function(planLayers, getEditLayers, obj, editLayer){
        if(editLayer == undefined){
            editLayer = obj.GetParentNode();
        }
        for(var k = 0; k < planLayers.length; k++){
            var polygonLayer = getEditLayers[planLayers[k]];
            var polygonLayerName = editLayer.Name.replace("buildingsmodel","buildingspolygon");
            if(polygonLayer && polygonLayer.DataLayerType == 5 && polygonLayer.name == polygonLayerName) {
                for(var kk = 0; kk < polygonLayer.GetObjCount(); kk++){
                    var polygonObj = polygonLayer.GetObjAt(kk);
                    if(polygonObj.Name.toLowerCase() == obj.name.toLowerCase()){
                        return polygonObj;
                    }
                }
            }
        }
        return null;
    }

    /**
     * 根据参数模型对象找到3DMax模型对象
     * @param planLayers 方案图层数组
     * @param getEditLayers 所有编辑图层的map对象
     * @param obj 参数模型对象
     * @param editLayer 模型图层
     * @return {*} 返回3DMax模型对象
     */
    var getModelByPolygon = function(planLayers, getEditLayers, obj, editLayer){
        if(editLayer == undefined){
            editLayer = obj.GetParentNode();
        }
        for(var k = 0; k < planLayers.length; k++){
            var modelLayer = getEditLayers[planLayers[k]];
            var modelLayerName = editLayer.Name.replace("buildingspolygon", "buildingsmodel");
            if(modelLayer && modelLayer.DataLayerType == 1 && modelLayer.name == modelLayerName) {
                for(var kk = 0; kk < modelLayer.GetObjCount(); kk++){
                    var modelObj = modelLayer.GetObjAt(kk);
                    if(modelObj.Name.toLowerCase() == obj.name.toLowerCase()){
                        return modelObj;
                    }
                }
            }
        }
        return null;
    }

    /**
     * 根据项目状态、项目时间和项目名关键字查询得到项目记录
     * @param options.id 项目id
     * @param options.status 项目状态：审批、待审批、已审批
     * @param options.projDate 项目年份
     * @param options.projName 项目名称关键字
     * @return {*} 返回项目记录对象：包含对象的数组
     */
    var getProjectData = function (options) {
        // region 项目查询字符串
        var projectQueryXml =
            '<QUERY>' +
                '<CONDITION><AND>' +
                (options.id ? ("<ID tablename = 'CPPROJECT'>='" + options.id + "'</ID>") : '') +
                (options.status ? ('<STATUS tablename = "CPPROJECT">=' + options.status + '</STATUS>') : '') +
                (options.startDate ? ('<PROJDATE tablename = "CPPROJECT">&gt;=' + options.startDate + '</PROJDATE>') : '') +
                (options.endDate ? ('<PROJDATE tablename = "CPPROJECT">&lt;=' + options.endDate + '</PROJDATE>') : '') +
                (options.projName ? ('<NAME tablename = "CPPROJECT">like \'%' + options.projName + '%\'</NAME>') : '') +
                (options.projProperty ? ('<YDXZ tablename = "CPPROJECT">' + "='" + options.projProperty + "'"+'</YDXZ>') : '') +
                (options.YDNAME ? ('<YDNAME tablename = "CPPROJECT">' + "='" + options.YDNAME + "'"+'</YDNAME>') : '') +
                '</AND></CONDITION>' +
                '<RESULT><CPPROJECT></CPPROJECT></RESULT>' +
                '</QUERY>';

        // endregion
        return _queryData(STAMP_config.service.query, projectQueryXml);
    };

    /**
     * 获得用地性质
     * @param node
     */
    var getProjectYDXZ=function(){
        var result = [];
        // region 项目查询字符串
        var projectQueryXml =
            '<QUERY>' +
                '<CONDITION></CONDITION>' +
                '<RESULT><CPPROJECT><FIELD>YDXZ</FIELD></CPPROJECT></RESULT>' +
                '</QUERY>';
        // endregion
        var res = _queryData(STAMP_config.service.query, projectQueryXml);
        $.each(res, function (i, r) {
            if($.inArray()===-1){
                var isAdd = false;
                for (var i = result.length - 1; i >= 0; i--) {
                    if(result[i] == r["CPPROJECT.YDXZ"]){
                        isAdd = true;
                    }
                };
                if(!isAdd){
                     result.push(r["CPPROJECT.YDXZ"]);
                }
            }
        });
        return result;
    }

    /**
     * 根据参数模型（基底矢量面）获取标准模型对象
     * @param  {[object]} model  参数模型
     * @param  {[string]} planId 方案ID
     * @return {[object]}        标准模型对象
     */
    var getModelByParamModel = function(model, planId){
        var paramModelLayer = top.editLayers[model.GetParentNode().Guid];
        if(!paramModelLayer){
            return null;
        }
        if(paramModelLayer.name.indexOf("buildingspolygon") != -1){
            var modelLayerName = paramModelLayer.name.replace("buildingspolygon","buildingsmodel");
            var planLayers = _getLayerIdsByPlanId(planId);
            for (var j = 0; j < planLayers.length; j++) {
                var editLayer = top.editLayers[planLayers[j]];
                if (editLayer && editLayer.DataLayerType == 1 && (editLayer.Name == modelLayerName)) {
                    for(var k = 0; k < editLayer.GetObjCount(); k++){
                        var obj = editLayer.GetObjAt(k);
                        if(obj.name.toLowerCase() == model.name.toLowerCase()){
                            return obj;
                        }
                    }
                }
            }
        }else{
            return null;
        }
    }

    /**
     * 定位到图层节点
     * @param  {[type]} node [树节点]
     * @return {[type]}      [description]
     */
    var locateToLayer = function (node) {
        if (node.type == "PLAN") {
            var layerIds = _getLayerIdsByPlanId(node.id);
            for (var i = 0; i < layerIds.length; i++) {
                var layerId = layerIds[i];
                if (editLayers[layerId]) {
                    var rect = editLayers[layerId].LonLatRect
                    if (IsValid(rect)) {
                        flyToLayer(rect);
                        break;
                    }
                }else if(databaseLayers[layerId]){
                    var rect = databaseLayers[layerId].LonLatRect
                    if (IsValid(rect)) {
                        flyToLayer(rect);
                        break;
                    }
                }
            }
        } else if (node.type == "PARCEL" || node.type == "ROADLINE" || node.type == "SMOOTHLINE") {
            var layerId = _getLayerIdByProId(node.projectId, node.type);
            if (editLayers[layerId]) {
                var rect = editLayers[layerId].LonLatRect;
                if (IsValid(rect)) {
                    flyToLayer(rect);
                }
            }else if(databaseLayers[layerId]){
                var rect = databaseLayers[layerId].LonLatRect;
                if (IsValid(rect)) {
                    flyToLayer(rect);
                }
            }
        }
    };

    /**
     * 定位到经纬度范围
     * @param  {[object]} layerLonLatRect [图层外包矩形框范围]
     * @return {[type]}                 [无]
     */
    var flyToLayer = function (layerLonLatRect) {
        var centerX = (layerLonLatRect.East + layerLonLatRect.West) / 2;
        var centerY = (layerLonLatRect.North + layerLonLatRect.South) / 2;
        var width = (parseFloat(layerLonLatRect.North) - parseFloat(layerLonLatRect.South)) / 2;
        var range = width / 180 * Math.PI * 6378137 / Math.tan(22.5 / 180 * Math.PI);
        earth.GlobeObserver.FlytoLookat(centerX, centerY, 0, 0, 90, 0, range, 4);
    };

    /**
     * 数据库图层加载
     * @return {[type]} [description]
     */
    function getEditLayerListLoaded() {
        currentLayerDatas = [];
        databaseLayers = {};
        databaseLayersArr = [];
        editLayers = {}; //记录数据库中所有图层
        currentLayerIdList = []; //记录现状图层ID列表
        projectLayerIdList = []; //记录项目图层ID列表
        otherLayerIdList = []; //记录其他图层ID列表
        currentLayerObjList = {}; //用地范围内所有的现状图层模型对象列表（用地范围内）
        checkedStatusList = []; //记录复选框状态
        planLayerIDs = {};//方案对应所有相关图层ID
        earth.Event.OnEditDatabaseFinished = function(pRes, pFeature) { // pFeature的类型为ISEDatabaseLayer
            isLoadCurrentLayers = true;
            layer = null;
            earth.Event.OnEditDatabaseFinished = function() {};
            for (var i = 0; pFeature && i < pFeature.GetChildCount(); i++) {
                layer = pFeature.GetChildAt(i); // ISEDatabaseLayer
                if(layer.GroupID == -3) { //现状相关的图层
                	var data = {
                        "id": layer.Guid,
                        "pId": 2,
                        "name": layer.Name,
                        "checked": true,
                        "type": "OLD01"
                    };
            		currentLayerDatas.push(data);
                    curLayers.push(layer);
                    currentLayerIdList.push(layer.Guid);
                } else if(layer.GroupID == -2) { //项目相关的图层
                    projectLayerIdList.push(layer.Guid);
                    top.projectLayerIdList.push(layer.Guid);
                    top.projectLayerMap[layer.Guid] = layer;
                }else{
                    otherLayerIdList.push(layer.Guid);
                }
                databaseLayers[layer.Guid] = layer;
                databaseLayersArr.push(layer);
            }
            ////从数据库中取出的所有组ID为-3即现状图层Guid集合
            top.currentLayerIdList = currentLayerIdList;
            //从数据库中取出的所有入库图层集合
			top.databaseLayersArr = databaseLayersArr;
			//从数据库中取出的所有组ID为-3即现状图层的树数据集合（含加载完模型的图层editLayer）
			top.currentLayerDatas = currentLayerDatas;
            top.setBtnDisabled(false,"#LayerManage");
			if(curLayers.length == 0){
			}else{
				getModels(STAMP_config.server.dataServerIP, curLayers);
			}
        };
        earth.DatabaseManager.GetAllLayer(STAMP_config.server.dataServerIP);
    }

    /**
     * 添加一个新的数据库图层
     * @param {[object]} newDataBaseLayer [新的数据库图层]
     */
    function addNewLayerData(layer){
        if (layer.GroupID == -3) { //现状相关的图层
            var data = {
                "id": layer.Guid,
                "pId": 2,
                "name": layer.Name,
                "checked": true,
                "type": "OLD01"
            };
            currentLayerDatas.push(data);
            curLayers.push(layer);
            currentLayerIdList.push(layer.Guid);
        } else if (layer.GroupID == -2) { //项目相关的图层
            projectLayerIdList.push(layer.Guid);
            top.projectLayerIdList.push(layer.Guid);
            top.projectLayerMap[layer.Guid] = layer;
        }
        else {
            otherLayerIdList.push(layer.Guid);
        }
        databaseLayers[layer.Guid] = layer;
        databaseLayersArr.push(layer);

        ////从数据库中取出的所有组ID为-3即现状图层Guid集合
        top.currentLayerIdList = currentLayerIdList;
        //从数据库中取出的所有入库图层集合
        top.databaseLayersArr = databaseLayersArr;
        //从数据库中取出的所有组ID为-3即现状图层的树数据集合（含加载完模型的图层editLayer）
        top.currentLayerDatas = currentLayerDatas;
        top.setBtnDisabled(false,"#LayerManage");
    }

    /**
     * 获取模型
     * @param  {[string]} ServerIp [服务器IP]
     * @param  {[Array]} layers   [图层列表]
     * @return {[type]}          [无]
     */
    function getModels(ServerIp,layers){
		var i = 0;
	    earth.Event.OnEditDatabaseFinished = function (pRes, Feature) {
	    	var templayer = layers[i];
	    	//创建图层
	        var editLayer = earth.Factory.CreateEditLayer(templayer.Guid, templayer.Name, templayer.LonLatRect, 0, templayer.MaxVisibleHeight, templayer.Server);
	        editLayer.DataLayerType = templayer.LayerType;
	        editLayer.Underground = false;
	        //设置现状图层默认为显示状态
	        editLayer.Visibility = true;
	        earth.AttachObject(editLayer);
            editLayer.Analyzable = true;
            editLayer.Selectable = false;
            editLayer.Intersectable = true;
	        curEditLayers[templayer.Guid] = editLayer;
	        for (var j = 0; j < Feature.Count; j++) {
	            var item = Feature.Items(j);
	            //创建单个模型
	            var editmodel = earth.Factory.CreateEditModelByDatabase(item.Guid, item.Name, item.MeshID, item.Type);
	            editmodel.visibility = true;
	            editmodel.BeginUpdate();
                editmodel.Selectable = false;
	            editmodel.SetBBox(item.BBox.MinVec, item.BBox.MaxVec);
	            editmodel.Editable = editLayer.Editable;
	            editmodel.EndUpdate();
	            var vec = item.SphericalTransform.GetLocation();
	            editmodel.SphericalTransform.SetLocation(vec);
	            editmodel.SphericalTransform.SetRotation(item.SphericalTransform.GetRotation());
	            editmodel.SphericalTransform.SetScale(item.SphericalTransform.GetScale());
	            editLayer.AttachObject(editmodel);
                editmodel.Analyzable = true;
                editmodel.Intersectable = true;
	        }

	        i++;
	        if (i < layers.length) {
	            earth.DataBaseManager.GetDataBaseRecords(ServerIp, layers[i].Guid);
	        } else {
        	    top.curEditLayers = curEditLayers;
	            earth.Event.OnEditDatabaseFinished = function (pRes, Feature) {};
	        }
	    }
	    //获取图层中的模型记录
        earth.DataBaseManager.GetDataBaseRecords(ServerIp, layers[i].Guid);
	}

    //加载现状模型
    function loadCurrentLayers(treeData) {
        if (isLoadCurrentLayers) {
            if (treeData.length) {
                for (var i = 0; i < treeData.length; i++) {
                    var currLayer = treeData[i];
                    if (currLayer.type == "PLAN") {
                        var layerIds = _getLayerIdsByPlanId(currLayer.id);
                        applyDataBaseRecords(false, layerIds);
                    } else if(currLayer.type == "PARCEL" || currLayer.type == "ROADLINE" || currLayer.type == "SMOOTHLINE") {
                        var layerId = _getLayerIdByProId(currLayer.projectId, currLayer.type);
                        applyDataBaseRecords(false, layerId);
                    }
                }
            }
            isLoadCurrentLayers = false;
        }
    }

    //第一个方案加载入口
    function applyDataBaseRecords(bShow, layerIds, isCreated, callback) {
        var ids = databaseLayersArr;
        if (ids.length) {
            for (var i = 0; i < ids.length; i++) {
                var layer = ids[i];
                var layerId = layer.Guid;
                if ($.isArray(layerIds)) {
                    if ($.inArray(layerId, layerIds) === -1) { //layer.LayerType == 9 表示数据库水面图层类型
                        earth.event.OnEditDatabaseFinished = function(pRes, pFeat) {
                            var pLayerGuid = pRes.LayerGuid;
                            if (pRes.ExcuteType == 43) {
                                onDatabaseListLoaded(pLayerGuid, pFeat, bShow);
                            } else if (pRes.ExcuteType == 47) {
                                onElementListLoaded(pLayerGuid, pFeat, bShow);
                            }
                        };
                        if (layer.LayerType == 1 || layer.LayerType == 2 || layer.LayerType == 3 ||
                            layer.LayerType == 9 || layer.LayerType == 10 || layer.LayerType == 11 ||
                            layer.LayerType == 12) { // || layer.LayerType == 9  ModelObject,BillBoardObject,MatchModelObject
                            earth.DatabaseManager.GetDataBaseRecords(STAMP_config.server.dataServerIP, layer.Guid);
                        } else {
                            earth.DatabaseManager.GetElements(STAMP_config.server.dataServerIP, layer.Guid, layer.LayerType);
                        }
                    }
                } else {
                    if (layerId == layerIds) {
                        earth.event.OnEditDatabaseFinished = function(pRes, pFeat) {
                            var pLayerGuid = pRes.LayerGuid;
                            if (pRes.ExcuteType == 43) {
                                onDatabaseListLoaded(pLayerGuid, pFeat, bShow);
                            } else if (pRes.ExcuteType == 47) {
                                onElementListLoaded(pLayerGuid, pFeat, bShow);
                               if (parcelLayerGuid2 == pLayerGuid || isCreated) {
                                   //抠掉现状图层
                                   projManager.showCurrentLayers(false, top.SYSTEMPARAMS.project, pLayerGuid);
                               }
                            }
                        };
                        if (layer.LayerType == 1 || layer.LayerType == 2 || layer.LayerType == 3 ||
                            layer.LayerType == 9 || layer.LayerType == 10 || layer.LayerType == 11 ||
                            layer.LayerType == 12) { // || layer.LayerType == 9 ModelObject,BillBoardObject,MatchModelObject
                            earth.DatabaseManager.GetDataBaseRecords(STAMP_config.server.dataServerIP, layer.Guid);
                        } else {
                            earth.DatabaseManager.GetElements(STAMP_config.server.dataServerIP, layer.Guid, layer.LayerType);
                        }
                    }
                }
            }
        }
    }

    /**
     * 数据库对象加载
     * @param  {[type]} pLayerGuid [图层GUID]
     * @param  {[type]} pFeat      [数据库对象]
     * @param  {[type]} bShow      [是否显示]
     * @return {[type]}            [description]
     */
    function onDatabaseListLoaded(pLayerGuid, pFeat, bShow) {
        var databaseLayer = databaseLayers[pLayerGuid];
        if (!databaseLayer || null == pFeat) {
            return;
        }
        var m_editLayer = earth.Factory.CreateEditLayer(databaseLayer.Guid, databaseLayer.Name, databaseLayer.LonLatRect, 0, 4.5, STAMP_config.server.dataServerIP);
        editLayers[databaseLayer.Guid] = m_editLayer;
        m_editLayer.DataLayerType = databaseLayer.LayerType;//LayerType为1时为建筑模型
        m_editLayer.Visibility = bShow;
        m_editLayer.Editable = true;
        earth.AttachObject(m_editLayer);
        m_editLayer.BeginUpdate();
        // 只有建筑模型参与分析（LineSight、ViewShed和Shinning），其他类型不参与
        if (databaseLayer.LayerType == 1) {
            m_editLayer.Analyzable = true;
        } else {
            m_editLayer.Analyzable = false;
        }
        for (var i = 0; i < pFeat.Count; i++) {
            var obj = pFeat.Items(i);
            if (!obj) {
                continue;
            }
            //注意这里的图层类型(最后一个参数) 否则树模型就不跟着视点选择了 ModelObject = 1,BillBoardObject = 2,，，，等类型 2014-06-12
            var editmodel = earth.Factory.CreateEditModelByDatabase(obj.Guid, obj.Name, obj.MeshID, databaseLayer.LayerType);
            editmodel.BeginUpdate();
            editmodel.SetBBox(obj.BBox.MinVec, obj.BBox.MaxVec);
            editmodel.SphericalTransform.SetLocation(obj.SphericalTransform.GetLocation());
            editmodel.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
            editmodel.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
            editmodel.Editable = true;
            if(databaseLayer.LayerType == 11){//地面模型禁止选取
                editmodel.Selectable = false;
            }else{
                editmodel.Selectable = true;
            }
            editmodel.EndUpdate();

            m_editLayer.AttachObject(editmodel);
        }
        m_editLayer.EndUpdate();
        m_editLayer.Editable = false;
        if(databaseLayer.LayerType == 11){//地面模型禁止选取
            m_editLayer.Selectable = false;
        }else{
            m_editLayer.Selectable = true;
        }
        earth.DatabaseManager.UpdateLayerLonLatRect(STAMP_config.server.dataServerIP, pLayerGuid, m_editLayer.LonLatRect, m_editLayer.MaxHeight);
    };

    /**
     * 数据库中Element元素加载
     * @param  {[type]} pLayerGuid [图层GUID]
     * @param  {[type]} pFeat      [element对象]
     * @param  {[type]} bShow      [是否显示]
     * @return {[type]}            [description]
     */
    function onElementListLoaded(pLayerGuid, pFeat, bShow) {
        var databaseLayer = databaseLayers[pLayerGuid];
        if(!databaseLayer){
            return;
        }
        var m_editLayer = earth.Factory.CreateEditLayer(databaseLayer.Guid, databaseLayer.Name, databaseLayer.LonLatRect, 0, 4.5, STAMP_config.server.dataServerIP);
        m_editLayer.DataLayerType = databaseLayer.LayerType;
        m_editLayer.Visibility = bShow;
        m_editLayer.Editable = false;
        editLayers[databaseLayer.Guid] = m_editLayer;
        top.editLayers[databaseLayer.Guid] = m_editLayer;
        earth.AttachObject(m_editLayer);
        m_editLayer.BeginUpdate();
        var vect3 = null;
        var newPolygon = null;
        if(databaseLayer.LayerType == 5 && databaseLayer.name.toLowerCase().indexOf("smoothline") != -1){
            top.smoothLineV3sArr = [];
            m_editLayer.Visibility = false;
        }
        if(pFeat == null || pFeat.Count <= 0){
            m_editLayer.EndUpdate();
            return;
        }
        for (var i = 0; i < pFeat.Count; i++) {
            var obj = pFeat.Items(i);
            if (null == obj || obj.SphericalVectors.Count <= 0) {
                continue;
            }

            switch (databaseLayer.LayerType) {
                case 4: // SEObjectType.PolylineObject
                    var line = earth.Factory.CreateElementLine(obj.Guid, obj.Name);
                    vect3 = obj.SphericalTransform.GetLocation();

                    line.BeginUpdate();
                    line.SetPointArray(obj.SphericalVectors.Items(0));
                    line.AltitudeType = 1; // SEAltitudeType.ClampToTerrain
                    line.LineStyle.LineColor = obj.StyleInfoList.Items(0).FirstColor; // 道路红线默认为红色
                    line.EndUpdate();
                    if (projManager.IsValid(vect3)) {
                        line.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
                    }
                    line.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
                    line.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
                    m_editLayer.AttachObject(line);
                    break;
                case 5: // SEObjectType.PolygonObject
                    if(databaseLayer.name.indexOf("buildingspolygon") != -1){
                        var volume = _createShpBuildingModel(obj,["","",""]);
                        if(volume){
                            m_editLayer.AttachObject(volume);
                        }
                        m_editLayer.Visibility = false;
                    }else{
                        var polygon = earth.Factory.CreateElementPolygon(obj.Guid, obj.Name);
                        vect3 = obj.SphericalTransform.GetLocation();
                        polygon.BeginUpdate();
                        polygon.SetExteriorRing(obj.SphericalVectors.Items(0));
                        polygon.AltitudeType = 1; // SEAltitudeType.ClampToTerrain
                        polygon.FillStyle.FillColor = obj.StyleInfoList.Items(0).SecondColor;
                        polygon.LineStyle.LineColor = obj.StyleInfoList.Items(0).FirstColor;
                        polygon.LineStyle.LineWidth = obj.StyleInfoList.Items(0).LineWidth;
                        polygon.EndUpdate();
                        polygon.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
                        polygon.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
                        polygon.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
                        m_editLayer.AttachObject(polygon);

                        if(pFeat.Count > 1){
                            if(!ploygonLayersVcts3[databaseLayer.Guid]){
                                ploygonLayersVcts3[databaseLayer.Guid] = [];
                            }
                            ploygonLayersVcts3[databaseLayer.Guid].push(polygon.GetExteriorRing());
                        }else{
                            ploygonLayersVcts3[databaseLayer.Guid] = polygon.GetExteriorRing(); //保存规划用地的范围，控制现状的显示。隐藏
                        }

                        /*
                        ** ploygonLayersVcts3 复制到 top.ploygonLayersVcts3
                        *****************************************/
                        //将属性对象赋值到top.ploygonLayersVcts3上
                        var item = polygon.GetExteriorRing();
                        var vec3sTest = earth.Factory.CreateVector3s();
                        for(var k = 0; k < item.Count; k++){
                            vec3sTest.Add(item.Items(k).X,item.Items(k).Y,item.Items(k).Z);
                        }
                        //控规用地点集合
                        if(pFeat.Count > 1){
                            if(!top.ploygonLayersVcts3[databaseLayer.Guid]){
                                top.ploygonLayersVcts3[databaseLayer.Guid] = [];
                            }
                            top.ploygonLayersVcts3[databaseLayer.Guid].push(vec3sTest);
                        }else{
                            top.ploygonLayersVcts3[databaseLayer.Guid] = vec3sTest;
                        }

                        //地形平整线
                        if(databaseLayer.name.toLowerCase().indexOf("smoothline") != -1){
                            if(!top.smoothLineV3sArr){
                                smoothLineV3sArr = [];
                            }
                            top.smoothLineV3sArr.push(polygon.GetExteriorRing());
                        }
                    }
                    break;
                case 6: // SEObjectType.ElementBoxObject
                    break;
                case 14: // 矢量楼块 SEObjectType.ElementVolumeObject

                    //add by zhangd 20170816
                    //根据建筑ID获取数据记录信息
                    var res = getSimpleBuildingDataById(obj.Guid);
                    if(res == null || res.length <= 0){
                        continue;
                    }
                    var textureArr = [];
                    //找到底部材质
                    var bottomTextureType = res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] : "";
                    if(bottomTextureType != ""){
                        var bottomTextureUrl = STAMP_config.service.getBuildBottomTexture + obj.Guid + "&blobtype=" + bottomTextureType;
                        var returnStatus = earth.UserDocument.SaveFile(bottomTextureUrl, obj.Guid + "_Bottom." + bottomTextureType);
                        if(returnStatus){
                            var bottomTexture = earth.RootPath + "\\temp\\" + obj.Guid + "_Bottom." + bottomTextureType;
                            textureArr.push(bottomTexture);
                        }else{
                            textureArr.push("");
                        }
                    }else{
                        textureArr.push("");
                    }

                    //找到顶部材质
                    var topTextureType = res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"] : "";
                    if(topTextureType != ""){
                        var topTextureUrl = STAMP_config.service.getBuildTopTexture + obj.Guid + "&blobtype=" + topTextureType;
                        returnStatus = earth.UserDocument.SaveFile(topTextureUrl, obj.Guid + "_Top." + topTextureType);
                        if(returnStatus){
                            var topTexture = earth.RootPath + "\\temp\\" + obj.Guid + "_Top." + topTextureType;
                            textureArr.push(topTexture);
                        }else{
                            textureArr.push("");
                        }
                    }else{
                        textureArr.push("");
                    }


                    //找到侧壁材质
                    var bodyTextureType = res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] : "";
                    if(bodyTextureType != ""){
                        var bodyTextureUrl = STAMP_config.service.getBuildBodyTexture + obj.Guid + "&blobtype=" + bodyTextureType;
                        returnStatus = earth.UserDocument.SaveFile(bodyTextureUrl, obj.Guid + "_Body." + bodyTextureType);
                        if(returnStatus){
                            var bodyTexture = earth.RootPath + "\\temp\\" + obj.Guid + "_Body." + bodyTextureType;
                            textureArr.push(bodyTexture);
                        }else{
                            textureArr.push("");
                        }
                    }else{
                        textureArr.push("");
                    }

                    var volume = _createShpBuildingModel(obj, textureArr);
                    m_editLayer.AttachObject(volume);
                    break;
                case 8: // SEObjectType.SimpleBuildingObject
                    //add by zhangd 20170816
                    //根据建筑ID获取数据记录信息
                    var res = getSimpleBuildingDataById(obj.Guid);
                    if(res == null || res.length <= 0){
                        continue;
                    }

                    //找到底部材质
                    var bottomTextureType = res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] : "";
                    if(bottomTextureType != ""){
                        var bottomTextureUrl = STAMP_config.service.getBuildBottomTexture + obj.Guid + "&blobtype=" + bottomTextureType;
                        var returnStatus = earth.UserDocument.SaveFile(bottomTextureUrl, obj.Guid + "_Bottom." + bottomTextureType);
                        if(returnStatus){
                            var bottomTexture = earth.RootPath + "\\temp\\" + obj.Guid + "_Bottom." + bottomTextureType;
                        }
                    }

                    //找到顶部材质
                    var topTextureType = res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"]: "";
                    if(topTextureType != ""){
                        var topTextureUrl = STAMP_config.service.getBuildTopTexture + obj.Guid + "&blobtype=" + topTextureType;
                        var returnStatus = earth.UserDocument.SaveFile(topTextureUrl, obj.Guid + "_Top." + topTextureType);
                        if(returnStatus){
                            var roofTexture = earth.RootPath + "\\temp\\" + obj.Guid + "_Top." + topTextureType;
                        }
                    }

                    //找到侧壁材质
                    var bodyTextureType = res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] : "";
                    if(bodyTextureType != ""){
                        var bodyTextureUrl = STAMP_config.service.getBuildBodyTexture + obj.Guid + "&blobtype=" + bodyTextureType;
                        returnStatus = earth.UserDocument.SaveFile(bodyTextureUrl, obj.Guid + "_Body." + bodyTextureType);
                        if(returnStatus){
                            var floorTexture = earth.RootPath + "\\temp\\" + obj.Guid + "_Body." + bodyTextureType;
                        }
                    }

                    var model = _createSimpleBuildingModel(obj, roofTexture, floorTexture, bottomTexture);
                    if(model){
                        m_editLayer.AttachObject(model);
                    }
                    break;
                default:
                    break;
            }
        }
        m_editLayer.EndUpdate();
        earth.DatabaseManager.UpdateLayerLonLatRect(STAMP_config.server.dataServerIP, pLayerGuid, m_editLayer.LonLatRect, m_editLayer.MaxHeight);
    }

    /**
     * 创建矢量楼块模型
     * @param  {[type]} obj        [矢量楼块模型对象]
     * @param  {[type]} textureArr [纹理数组]
     * @return {[type]}            [矢量楼块模型]
     */
    var _createShpBuildingModel = function(obj, textureArr){
        try{
            var volume = earth.Factory.CreateElementVolume(obj.Guid, obj.Name);
            vect3 = obj.SphericalTransform.GetLocation();
            volume.BeginUpdate();
            newPolygon = earth.Factory.CreatePolygon();
            newPolygon.AddRing(obj.SphericalVectors.Items(0));
            volume.SetPolygon(1, newPolygon); // SECoordinateUnit.Degree
            volume.height = obj.Height;
            volume.FillColor = obj.StyleInfoList.Items(0).FirstColor;

            //材质贴图
            var materialStyles = volume.MaterialStyles;//材质样式
            var count = materialStyles.Count;
            for (var j = 0; j < count; j++) {
                var materialStyle = materialStyles.Items(j);
                if(textureArr[j] != null){
                    materialStyle.DiffuseTexture = textureArr[j];//材质贴图
                }
            }
            volume.EndUpdate();
            volume.MeshID = obj.StyleID;
            volume.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
            volume.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
            volume.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
            return volume;
        }catch(ex){
            return null;
        }
    }

    /**
     * 根据数据库对象创建简单建筑模型到球的编辑图层上
     * @param  {[type]} obj           [description]
     * @param  {[type]} roofTexture   [description]
     * @param  {[type]} floorTexture  [description]
     * @param  {[type]} bottomTexture [description]
     * @return {[type]}               [description]
     */
    var _createSimpleBuildingModel = function(obj, roofTexture, floorTexture, bottomTexture){
        try{
            var building = earth.Factory.CreateSimpleBuilding(obj.Guid, obj.Name);
            var vect3 = obj.SphericalTransform.GetLocation();

            building.BeginUpdate();
            newPolygon = earth.Factory.CreatePolygon();
            newPolygon.AddRing(obj.SphericalVectors.Items(0));
            building.SetPolygon(1, newPolygon);
            building.SetFloorsHeight(obj.height);
            building.SetFloorHeight(obj.FloorHeight);
            building.SetRoofType(obj.RoofType);

            if(floorTexture){//平顶
                // 贴材质
                var buildingMaterial = building.GetFloorsMaterialStyles();
                for (var j = 2; j < buildingMaterial.Count; ++j) {//侧壁
                    buildingMaterial.Items(j).DiffuseTexture = floorTexture;
                }

                if(roofTexture && roofTexture != ""){//顶部
                    buildingMaterial.Items(1).DiffuseTexture = roofTexture;
                }

                if(bottomTexture && bottomTexture != ""){//底部
                    buildingMaterial.Items(0).DiffuseTexture = bottomTexture;
                }else{//底部材质不存在时，使用侧壁材质
                    buildingMaterial.Items(0).DiffuseTexture = floorTexture;
                }
            }

            if(roofTexture){//凸顶
                var roofMats = building.GetRoofMaterialStyles();
                for (var j = 0; j < roofMats.Count; j++) {
                    roofMats.Items(j).DiffuseTexture = roofTexture;
                }
            }

            building.RoofColor = obj.StyleInfoList.Items(0).FirstColor;
            building.FloorsColor = obj.StyleInfoList.Items(0).SecondColor;

            building.EndUpdate();
            building.MeshID = obj.StyleID;
            // SetLocationEx方法调用必须放在EndUpdate函数之后
            building.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
            building.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
            building.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());

            return building;
        }catch(ex){
            return null;
        }
    }

    // region 删除方案
    /**
     * 删除模型数据类型的方案：详规和单体
     * @param planId 方案ID
     * @private
     */
    var _deleteModelPlan = function (planId) {
        // 删除空间数据
        var planIds = _getLayerIdsByPlanId(planId);
        $.each(planIds, function (i, id) {
            earth.DatabaseManager.DeleteLayerInDatabase(STAMP_config.server.dataServerIP, id);
            if(editLayers[id]){
                //先在earth上也要删除该id对应的editLayer图层 否则下次导入会无法显示 guid重复！
                earth.DetachObject(editLayers[id]);
                delete editLayers[id];
            }
        });

        // 删除建筑属性数据
        var xmlDelete = "<CPBUILDING><PLANID> ='" + planId + "' </PLANID></CPBUILDING>";
        dbUtil(STAMP_config.service.remove, xmlDelete);

        // 删除简单建筑属性数据
        xmlDelete = "<CPSIMPLEBUILD><PLANID> ='" + planId + "' </PLANID></CPSIMPLEBUILD>";
        dbUtil(STAMP_config.service.remove, xmlDelete);

        // 删除方案记录
        xmlDelete = "<CPPLAN><ID> ='" + planId + "' </ID></CPPLAN>";
        dbUtil(STAMP_config.service.remove, xmlDelete);
    };

    /**
     * 删除Shapefile数据类型的方案：策划和设计
     * @param planId 方案ID
     * @private
     */
    var _deleteShpPlan = function (planId) {
        // 删除空间数据
        var xmlQuery = "<QUERY>" +
            "<CONDITION><AND><ID tablename='CPPLAN'> ='" + planId + "' </ID></AND></CONDITION>" +
            "<RESULT><CPPLAN></CPPLAN></RESULT>" +
            "</QUERY>";
        var res = _queryData(STAMP_config.service.query, xmlQuery);
        if (res.length > 0) {
            var layerIds = res[0]["CPPLAN.LAYERIDS"];
            var layerIdArr = layerIds.split(",");
            $.each(layerIdArr, function (i, id) {
                earth.DatabaseManager.DeleteLayerInDatabase(STAMP_config.server.dataServerIP,id);
            });
        }

        // 删除属性数据
        var xmlDelete = "<CPSIMPLEBUILDING><PLANID> ='" + planId + "' </PLANID></CPSIMPLEBUILDING>";
        dbUtil(STAMP_config.service.remove, xmlDelete);

        xmlDelete = "<CPGREEN><PLANID> ='" + planId + "' </PLANID></CPGREEN>";
        dbUtil(STAMP_config.service.remove, xmlDelete);

        // 删除方案记录
        xmlDelete = "<CPPLAN><ID> ='" + planId + "' </ID></CPPLAN>";
        dbUtil(STAMP_config.service.remove, xmlDelete);
    };

    /**
     * 根据方案的ID和类型，删除方案及相关数据
     * @param id
     * @param type 策划、设计和详规、单体：都包含视点信息
     * 策划和设计：shp类型的数据，包含简单建筑和绿地
     * 详规和单体：模型类型的数据，包括建筑和方案附件
     */
    var deletePlan = function (id, type) {
        if (type == 1 || type == 2) {      // 策划或设计
            _deleteShpPlan(id);
        } else if (type == 3 || type == 4) {
            _deleteModelPlan(id);
        }
    };

    var deleteCPBuilding = function(id){
        var xmlDelete = "<CPBUILDING><ID> ='" + id + "' </ID></CPBUILDING>";
        dbUtil(STAMP_config.service.remove, xmlDelete);
        xmlDelete = "<CPATTACHMENT><PLANID> ='" + id + "' </PLANID></CPATTACHMENT>";
        dbUtil(STAMP_config.service.remove, xmlDelete);
    }

    var deleteCPSimpleBuild = function(id){
        var xmlDelete = "<CPSIMPLEBUILD><ID> ='" + id + "' </ID></CPSIMPLEBUILD>";
        dbUtil(STAMP_config.service.remove, xmlDelete);
    }

    var updatePlanLayerIDs = function(planId, ydName, planLayerIDs){
        var xmlUpdate = "<CPPLAN>" +
            "<CONDITION><ID> ='" + planId + "' </ID><YDNAME> ='" + ydName + "' </YDNAME></CONDITION>" +
            "<CONTENT><LAYERIDS>" + planLayerIDs + "</LAYERIDS></CONTENT>" +
            "</CPPLAN>";
        $.post(STAMP_config.service.update, xmlUpdate);
    }

    var getTotalPlanIndex = function(planId){
        var planData = getPlanById(planId);
        if(planData.length >= 1){
            var ZJZMJ = 0;
            var YDMJ = 0;
            var ZJZJDMJ = 0;
            for(var i = 0; i < planData.length; i++){
                var ydData = projManager.getProjectData({ID:planData[i]["CPPLAN.PROJECTID"],YDNAME:planData[i]["CPPLAN.YDNAME"]});
                if(ydData && ydData.length >= 1){
                    YDMJ += parseFloat(ydData[0]["CPPROJECT.YDMJ"]);
                }
                ZJZMJ += parseFloat(planData[i]["CPPLAN.ZJZMJ"]);
            }
            var xmlQuery = '<QUERY><CONDITION><AND><PLANID tablename = "CPBUILDING">=\'' + planId
                + '\'</PLANID></AND></CONDITION><RESULT><CPBUILDING></CPBUILDING></RESULT></QUERY>';
            var buildings = _queryData(STAMP_config.service.query, xmlQuery);
            for(var j = 0; j < buildings.length; j++){
                ZJZJDMJ += parseFloat(buildings[j]["CPBUILDING.JZJDMJ"]);
            }

            xmlQuery = '<QUERY><CONDITION><AND><PLANID tablename = "CPSIMPLEBUILD">=\'' + planId
                + '\'</PLANID></AND></CONDITION><RESULT><CPSIMPLEBUILD></CPSIMPLEBUILD></RESULT></QUERY>';
            var simpleBuidings = _queryData(STAMP_config.service.query, xmlQuery);
            for(var j = 0; j < simpleBuidings.length; j++){
                ZJZJDMJ += parseFloat(simpleBuidings[j]["CPSIMPLEBUILD.BASEAREA"]);
            }
            var returnInfo = {
                JZMD: parseFloat(ZJZJDMJ*100/YDMJ).toFixed(2),//单位为%，所以需要乘以100
                RJL: parseFloat(ZJZMJ/YDMJ).toFixed(2)
            };
            return returnInfo;
        }
    }

    //更新建筑模型基底指标
    var updateBuildingBasial = function(buildId, buildBaseArea, buildTotalArea){
        xmlUpdate = "<CPBUILDING>" +
            "<CONDITION><ID> ='" + buildId + "' </ID></CONDITION>" +
            "<CONTENT><JZJDMJ>" + buildBaseArea + "</JZJDMJ><ZJZMJ>" + buildTotalArea + "</ZJZMJ></CONTENT>" +
            "</CPBUILDING>";
        $.ajaxSetup({
            async: false  // 将ajax请求设为同步
        });
        var isSuccess = false;
        $.post(STAMP_config.service.update, xmlUpdate, function (data) {
            isSuccess = true;
        }, "text");
        return isSuccess;
    }

    //更新简单建筑和矢量楼块基底指标
    var updateSimpleBuildBasial = function(buildId, buildBaseArea, buildTotalArea){
        xmlUpdate = "<CPSIMPLEBUILD>" +
            "<CONDITION><ID> ='" + buildId + "' </ID></CONDITION>" +
            "<CONTENT><BASEAREA>" + buildBaseArea + "</BASEAREA><TOTALAREA>" + buildTotalArea + "</TOTALAREA></CONTENT>" +
            "</CPSIMPLEBUILD>";
        $.ajaxSetup({
            async: false  // 将ajax请求设为同步
        });
        var isSuccess = false;
        $.post(STAMP_config.service.update, xmlUpdate, function (data) {
            isSuccess = true;
        }, "text");
        return isSuccess;
    }

    var updatePlanIndex = function(planId){
        var xmlQuery = '<QUERY><CONDITION><AND><ID tablename = "CPPLAN">=\'' + planId
            + '\'</ID></AND></CONDITION><RESULT><CPPLAN><FIELD>PROJECTID</FIELD><FIELD>YDNAME</FIELD></CPPLAN></RESULT></QUERY>';
        var planYDs = _queryData(STAMP_config.service.query, xmlQuery);
        var planYDMap = {};
        if(planYDs.length <= 0){
            return;
        }

        xmlQuery = '<QUERY><CONDITION><AND><PLANID tablename = "CPBUILDING">=\'' + planId
            + '\'</PLANID></AND></CONDITION><RESULT><CPBUILDING></CPBUILDING></RESULT></QUERY>';
        var buildings = _queryData(STAMP_config.service.query, xmlQuery);

        xmlQuery = '<QUERY><CONDITION><AND><PLANID tablename = "CPSIMPLEBUILD">=\'' + planId
            + '\'</PLANID></AND></CONDITION><RESULT><CPSIMPLEBUILD></CPSIMPLEBUILD></RESULT></QUERY>';
        var simpleBuidings = _queryData(STAMP_config.service.query, xmlQuery);


        for(var i = 0; i < planYDs.length; i++){
            xmlQuery = '<QUERY><CONDITION><AND><ID tablename = "CPPROJECT">=\'' + planYDs[i]["CPPLAN.PROJECTID"]
            + '\'</ID><YDNAME tablename = "CPPROJECT">=\'' + planYDs[i]["CPPLAN.YDNAME"]
            + '\'</YDNAME></AND></CONDITION><RESULT><CPPROJECT><FIELD>YDMJ</FIELD></CPPROJECT></RESULT></QUERY>';
            var projects = _queryData(STAMP_config.service.query, xmlQuery);
            if(projects.length <= 0){
                return;
            }
            var YDMJ = projects[0]["CPPROJECT.YDMJ"];
            var ZJZMJ = 0;
            var ZJZJDMJ = 0;
            var DSJZMJ = 0;
            var ZZJZMJ = 0;
            var SYJZMJ = 0;
            var YEYJZMJ = 0;
            var SQFWZXJZMJ = 0;
            var DXJZMJ = 0;
            var DXSYMJ = 0;
            var DXTCCMJ = 0;
            var DXQTMJ = 0;
            var RJL = 0;
            var DSRJL = 0;
            var DXRJL = 0;
            var JZMD = 0;
            var LDL = 0;
            var GHHS = 0;
            var HJRK = 0;
            var GHRS = 0;
            var ZTCW = 0;
            var DSTCW = 0;
            var DXTCW = 0;
            for(var j = 0; j < buildings.length; j++){
                if(planYDs[i]["CPPLAN.YDNAME"] == buildings[j]["CPBUILDING.YDNAME"]){
                    ZJZMJ += parseFloat(buildings[j]["CPBUILDING.ZJZMJ"]);//buildings[j]["CPBUILDING.DSJZMJ"] + buildings[j]["CPBUILDING.DXJZMJ"];
                    ZJZJDMJ += parseFloat(buildings[j]["CPBUILDING.JZJDMJ"]);
                    DSJZMJ += parseFloat(buildings[j]["CPBUILDING.DSJZMJ"]);
                    ZZJZMJ += parseFloat(buildings[j]["CPBUILDING.ZZJZMJ"]);
                    SYJZMJ += parseFloat(buildings[j]["CPBUILDING.SYJZMJ"]);
                    YEYJZMJ += parseFloat(buildings[j]["CPBUILDING.YEYJZMJ"]);
                    SQFWZXJZMJ += parseFloat(buildings[j]["CPBUILDING.SQFWZXJZMJ"]);
                    DXJZMJ += parseFloat(buildings[j]["CPBUILDING.DXJZMJ"]);
                    DXSYMJ += parseFloat(buildings[j]["CPBUILDING.DXSYMJ"]);
                    DXTCCMJ += parseFloat(buildings[j]["CPBUILDING.DXTCCMJ"]);
                    DXQTMJ += parseFloat(buildings[j]["CPBUILDING.DXQTMJ"]);
                    GHHS += parseFloat(buildings[j]["CPBUILDING.GHHS"]);
                    HJRK += parseFloat(buildings[j]["CPBUILDING.HJRK"]);
                    GHRS += parseFloat(buildings[j]["CPBUILDING.GHRS"]);
                    ZTCW += parseFloat(buildings[j]["CPBUILDING.ZTCW"]);
                    DSTCW += parseFloat(buildings[j]["CPBUILDING.DSTCW"]);
                    DXTCW += parseFloat(buildings[j]["CPBUILDING.DXTCW"]);
                }
            }

            for(var j = 0; j < simpleBuidings.length; j++){
                if(planYDs[i]["CPPLAN.YDNAME"] == simpleBuidings[j]["CPSIMPLEBUILD.YDNAME"]){
                    ZJZMJ += parseFloat(simpleBuidings[j]["CPSIMPLEBUILD.TOTALAREA"]);
                    ZJZJDMJ += parseFloat(simpleBuidings[j]["CPSIMPLEBUILD.BASEAREA"]);
                }
            }

            RJL = parseFloat(ZJZMJ/YDMJ).toFixed(2);
            DSRJL = parseFloat(DSJZMJ/YDMJ).toFixed(2);
            DXRJL = parseFloat(DXJZMJ/YDMJ).toFixed(2);
            JZMD = parseFloat(ZJZJDMJ*100/YDMJ).toFixed(2);//单位为%，所以需要乘以100

            var xmlUpdate = "<CPPLAN>" +
            "<CONDITION><ID> ='" + planId + "' </ID><YDNAME> ='" + planYDs[i]["CPPLAN.YDNAME"]  + "' </YDNAME></CONDITION>" +
            "<CONTENT><ZJZMJ>" + ZJZMJ + "</ZJZMJ><DSJZMJ>" + DSJZMJ + "</DSJZMJ><ZZJZMJ>" + ZZJZMJ
            + "</ZZJZMJ><SYJZMJ>" + SYJZMJ + "</SYJZMJ><YEYJZMJ>" + YEYJZMJ + "</YEYJZMJ><SQFWZXJZMJ>"
            + SQFWZXJZMJ + "</SQFWZXJZMJ><DXJZMJ>" + DXJZMJ + "</DXJZMJ><DXSYMJ>" + DXSYMJ + "</DXSYMJ><DXTCCMJ>"
            + DXTCCMJ + "</DXTCCMJ><DXQTMJ>" + DXQTMJ + "</DXQTMJ><GHHS>" + GHHS + "</GHHS><HJRK>"
            + HJRK + "</HJRK><GHRS>" + GHRS + "</GHRS><ZTCW>" + ZTCW + "</ZTCW><DSTCW>"
            + DSTCW + "</DSTCW><DXTCW>" + DXTCW + "</DXTCW><RJL>" + RJL + "</RJL><DSRJL>"
            + DSRJL + "</DSRJL><DXRJL>" + DXRJL + "</DXRJL><JZMD>" + JZMD + "</JZMD></CONTENT>" +
            "</CPPLAN>";
            $.post(STAMP_config.service.update, xmlUpdate);
        }
    }

    // endregion

    // region 删除项目
    var _deleteSubjectByProjectId = function (projectId) {
        try{
            var xmlQuery = "<QUERY>" +
                "<CONDITION><AND><ID tablename='CPPROJECT'> ='" + projectId + "' </ID></AND></CONDITION>" +
                "<RESULT><CPPROJECT><FIELD>PARCELLAYERID</FIELD><FIELD>ROADLINELAYERID</FIELD><FIELD>SMOOTHLAYERID</FIELD></CPPROJECT></RESULT>" +
                "</QUERY>";
            var projects = _queryData(STAMP_config.service.query, xmlQuery);
            if (projects.length <= 0) {
                return;
            }
            var project = projects[0];
            var parcelLayerId = project["CPPROJECT.PARCELLAYERID"];
            var roadlineLayerId = project["CPPROJECT.ROADLINELAYERID"];
            var smoothLayerId = project["CPPROJECT.SMOOTHLAYERID"];
            var xml = "";
            if (parcelLayerId) {
                earth.DatabaseManager.DeleteLayerInDatabase(STAMP_config.server.dataServerIP,parcelLayerId);
                xml = "<CPPARCEL><PROJECTID> ='" + projectId + "' </PROJECTID></CPPARCEL>";
                dbUtil(STAMP_config.service.remove, xml);
                if(editLayers[parcelLayerId]){
                    earth.DetachObject(editLayers[parcelLayerId]);
                    delete editLayers[parcelLayerId];
                }
            }
            if (roadlineLayerId) {
                earth.DatabaseManager.DeleteLayerInDatabase(STAMP_config.server.dataServerIP,roadlineLayerId);
                xml = "<CPROADLINE><PROJECTID> ='" + projectId + "' </PROJECTID></CPROADLINE>";
                dbUtil(STAMP_config.service.remove, xml);
                if(editLayers[roadlineLayerId]){
                    earth.DetachObject(editLayers[roadlineLayerId]);
                    delete editLayers[roadlineLayerId];
                }
            }
            if (smoothLayerId) {
                earth.DatabaseManager.DeleteLayerInDatabase(STAMP_config.server.dataServerIP,smoothLayerId);
                if(editLayers[smoothLayerId]){
                    earth.DetachObject(editLayers[smoothLayerId]);
                    delete editLayers[smoothLayerId];
                }
            }
        }catch(e){

        }
    };

    /*
     *根据项目ID删除下面的所有方案数据（包括空间图层数据和属性数据）
     *@param projectId 项目ID
     */
    var _deletePlansByProjectId = function (projectId) {
        try{
            var xmlQuery = "<QUERY>" +
            "<CONDITION><AND><PROJECTID tablename='CPPLAN'> ='" + projectId + "' </PROJECTID></AND></CONDITION>" +
            "<RESULT><CPPLAN><FIELD>ID</FIELD><FIELD>TYPE</FIELD></CPPLAN></RESULT>" +
            "</QUERY>";
            var plans = _queryData(STAMP_config.service.query, xmlQuery);
            var planIdArray = [];
            $.each(plans, function (i, plan) {
                if($.inArray(plan["CPPLAN.ID"], planIdArray) == -1){//如果方案ID重复的不需要重复删除
                    planIdArray.push(plan["CPPLAN.ID"]);
                    deletePlan(plan["CPPLAN.ID"], plan["CPPLAN.TYPE"]);
                }
            });
        }catch(e){

        }
    };

    /*
     *删除项目相关表
     *@param projectId 项目ID
     */
    var _deleteConferencesByProjectId = function (projectId) {
        var xml = "<CPCONFERENCE><PROJECTID> ='" + projectId + "' </PROJECTID></CPCONFERENCE>";
        dbUtil(STAMP_config.service.remove, xml);
    };

    /*
     *删除所有附件
     *@param projectId 项目ID
     */
    var _deleteAttachmentByProjectId = function(projectId){
        try{
            var xmlQuery = "<QUERY>" +
                "<CONDITION><AND><PROJECTID tablename='CPPLAN'> ='" + projectId + "' </PROJECTID></AND></CONDITION>" +
                "<RESULT><CPPLAN><FIELD>ID</FIELD><FIELD>TYPE</FIELD></CPPLAN></RESULT>" +
                "</QUERY>";
            var plans = _queryData(STAMP_config.service.query, xmlQuery);
            var ids = [];
            $.each(plans, function (i, plan) {
                if($.inArray(plan["CPPLAN.ID"], ids) == -1){
                    ids.push(plan["CPPLAN.ID"]);

                    //根据方案ID查询到建筑，然后删除建筑附件
                    var xmlQuery = "<QUERY>" +
                    "<CONDITION><AND><PLANID tablename='CPBUILDING'> ='" + plan["CPPLAN.ID"] + "' </PLANID></AND></CONDITION>" +
                    "<RESULT><CPBUILDING></CPBUILDING></RESULT>" +
                    "</QUERY>";
                    var res = _queryData(STAMP_config.service.query, xmlQuery);
                    if(res && res.length > 0){
                        for(var i = 0; i < res.length; i++){
                            xmlDelete = "<CPATTACHMENT><PLANID> ='" + res["CPBUILDING.ID"] + "' </PLANID></CPATTACHMENT>";
                            dbUtil(STAMP_config.service.remove, xmlDelete);
                        }
                    }
                }
            });
            ids.push(projectId);

            //删除项目和方案附件
            for (var i = ids.length - 1; i >= 0; i--) {
                var pid = ids[i];
                var xml = "<CPATTACHMENT>" +
                "<PLANID> ='" + pid + "' </PLANID></CPATTACHMENT>"
                dbUtil(STAMP_config.service.remove, xml);
            };

        }catch(e){

        }
    };

    /**
     * 删除项目
     * @param  {[字符串]} id 删除的项目ID
     * @return  无
     */
    var deleteProject = function (id) {
        //删除附件表中的附件 根据项目的guid 方案的guid 进行删除
        _deleteAttachmentByProjectId(id);

        //根据项目ID删除规划用地、道路红线、地形平整线等数据
        _deleteSubjectByProjectId(id);

        //根据项目ID删除方案数据
        _deletePlansByProjectId(id);

        //根据项目ID删除相关表------不知道是干嘛用的
        _deleteConferencesByProjectId(id);

        //下面是删除方案表记录
        var xml = "<CPPROJECT><ID> ='" + id + "' </ID></CPPROJECT>";
        dbUtil(STAMP_config.service.remove, xml);
    };
    // endregion

    // region
    /**
     * 获取指定方案下指定用地的所有数据图层
     * @param  {[string]} id     [方案ID]
     * @param  {[string]} ydName [用地名称]
     * @return  无
     */
    var _getLayerIdsByPlanId = function (id, ydName) {
        var layerIds = [];
        var xml = "<QUERY><CONDITION><AND>" +
            "<ID tablename='CPPLAN'> ='" + id + "' </ID>"
            + (ydName?("<YDNAME tablename='CPPLAN'> ='" + ydName + "' </YDNAME>"):"")
            + "</AND></CONDITION>" +
            "<RESULT><CPPLAN><FIELD>LAYERIDS</FIELD></CPPLAN></RESULT>" +
            "</QUERY>";
        var res = _queryData(STAMP_config.service.query, xml);
        if (res.length > 0) {
            for(var i = 0; i < res.length; i++){
                var layerArr = res[i]["CPPLAN.LAYERIDS"].split(",");
                for(var j = 0; j < layerArr.length; j++){
                    if(layerArr[j] && $.inArray(layerArr[j], layerIds) == -1){
                        layerIds.push(layerArr[j]);
                    }
                }
            }
        }
        return layerIds;
    };

    //显示规划用地，道路红线
    var _getLayerIdByProId = function (projId, type) {
        var layerId = null;
        var xmlQuery = "<QUERY>" +
            "<CONDITION><AND><ID tablename='CPPROJECT'> ='" + projId + "' </ID></AND></CONDITION>" +
            "<RESULT><CPPROJECT><FIELD>$FIELD</FIELD></CPPROJECT></RESULT>" +
            "</QUERY>";
        if (type == "PARCEL") {
            xmlQuery = xmlQuery.replace("$FIELD", "PARCELLAYERID");
        } else if (type == "ROADLINE") {
            xmlQuery = xmlQuery.replace("$FIELD", "ROADLINELAYERID");
        } else if (type == "SMOOTHLINE") {
            xmlQuery = xmlQuery.replace("$FIELD", "SMOOTHLAYERID");
        }
        var res = _queryData(STAMP_config.service.query, xmlQuery);
        if (res.length > 0) {
            if (type == "PARCEL") {
                layerId = res[0]["CPPROJECT.PARCELLAYERID"];
            } else if (type == "ROADLINE") {
                layerId = res[0]["CPPROJECT.ROADLINELAYERID"];
            } else if (type == "SMOOTHLINE") {
                layerId = res[0]["CPPROJECT.SMOOTHLAYERID"];
            }
        }
        return layerId;
    };
    /**
     * 更新图层的经纬度范围
     * @param lonlat SELonLatRect
     * @param basedata SEDbEleInfo
     * @return {*} 重新计算后的经纬度范围
     * @private
     */
    var _updateRectangle = function (lonlat, basedata) {
        if (lonlat.North < basedata.SphericalTransform.GetLocation().Y) {
            lonlat.North = basedata.SphericalTransform.GetLocation().Y;
        }

        if (lonlat.South > basedata.SphericalTransform.GetLocation().Y) {
            lonlat.South = basedata.SphericalTransform.GetLocation().Y;
        }

        if (lonlat.East < basedata.SphericalTransform.GetLocation().X) {
            lonlat.East = basedata.SphericalTransform.GetLocation().X;
        }

        if (lonlat.West > basedata.SphericalTransform.GetLocation().X) {
            lonlat.West = basedata.SphericalTransform.GetLocation().X;
        }

        return lonlat;
    };
    var showCurrentLayers = function (bShow,treeId,parId) {
        return showCurrentLayers2(bShow, treeId, parId);
    };
    //显示或隐藏当前项目规划用地范围内的建筑模型
    var showCurrentLayers2 = function (bShow,treeId,parId) {
        var modelList = currentLayerObjList[treeId];
        if(modelList && modelList.length > 0){
            //这是按方案被裁切的现状模型
            for(var i in modelList){
                modelList[i].Visibility = bShow;
            }
        }else{
            var ids=currentLayerIdList;//所有的现状图层id
            var ml = [];
            for(var i=0;i<ids.length;i++){
                var cid=ids[i];
                //从数据库图层中取出现状图层
                var currentlayer=curEditLayers[cid];//从数据库图层中取出现状图层
                if(currentlayer){
                    //先将所有现状显示，审批时裁切方案范围的现状进行隐藏
                    currentlayer.Visibility = true;
                    var ploygonVects3=ploygonLayersVcts3[parId];//规划用地的范围即使现状图层的范围，抠出现状图层的范围
                    if(ploygonVects3){
                        if(!$.isArray(ploygonVects3)){
                            ploygonVects3 = [ploygonVects3];
                        }
                        for(var k = 0; k < ploygonVects3.length; k++){
                            currentlayer.LayerIsPrior=false;
                            var eList = currentlayer.ClipByRegion(ploygonVects3[k],false);
                            if(eList != null && eList.Count > 0){
                                for(var j = 0, l = eList.Count;j < l;j++){
                                    var model = eList.Items(j);
                                    var r = earth.GeometryAlgorithm.GetModelPolygonRelationship(model.Guid, ploygonVects3[k]);
                                    if(r < 3){
                                        model.Visibility = bShow;
                                        ml.push(model);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            currentLayerObjList[treeId] = ml;
        }
    };

    /**
     * 暂未使用，改动很大
     * 显示/隐藏某方案的规划用地范围内的现状模型
     * 原方法(showCurrentLayers)在在规划用地范围内存在多个现状图层需要处理的情形下，
     * 先保存的图层的模型会丢失(被后保存的模型覆盖了，因为居然用方案ID做键)
     * 增加变量parcelPolygon，避免修改ploygonLayersVcts3结构以支持多现状图层，顺便支持多规划用地(即规划用地图层中存在多个polygon)
     * 参数planId不会使用
     * @param  {bool}   bShow  显示/隐藏
     * @param  {string} planId 方案ID，占位用
     * @param  {string} parId  规划用地图层ID
     * @return {void}
     */
    var showCurrentLayers3 = function(bShow, planId, parId){
        var ids = currentLayerIdList;
        for(var i = 0;i < ids.length;i++){
            var curLyr = editLayers[ids[i]];
            if(curLyr){
                var parcelPolygon = parent.parcelPolygon || self.parcelPolygon;
                var polygonIds = parcelPolygon[parId];
                if(polygonIds){
                    for(var j in polygonIds){
                        var v3s = polygonIds[j]['v3s'];
                        var els = polygonIds[j]['els'];
                        if(v3s && els){
                            if(!els[ids[i]]){
                                els[ids[i]] = curLyr.ClipByRegion(v3s, false);
                            }
                            if(els[ids[i]] && els[ids[i]].Count > 0){
                                for(var m = 0, l = els[ids[i]].Count;m < l;m++){
                                    els[ids[i]].Items(m).Visibility = bShow;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    /**
     * 控制项目的显示、隐藏
     * @param projId 项目ID
     * @param bShow 已经创建的是否显示，未创建时不起作用
     * @param isCreatePlan 是否创建方案
     * @param isCreateParcel 是否创建规划用地
     * @param isCreateRoad 是否创建道路红线
     * @param isCreateSmooth 是否创建地形平整线
     */
    var showAll = function (projId, planId, bShow, isCreatePlan, isCreateParcel, isCreateRoad, isCreateSmooth) {
        var project;
        var projData = getProjectData({id: projId});
        if (projData.length > 0) {
            $.each(projData, function (i, pData) {
                project = pData;
            });
        } else {
            return;
        }
        var layerIds = [];
        var planData = getPlanData(project["CPPROJECT.ID"]);//方案
        if (planData.length && isCreatePlan) {
            var planArr = [];
            $.each(planData, function (i, pData) {
                var planId_temp = pData["CPPLAN.ID"];
                if($.inArray(planId_temp, planArr) == -1){
                    planArr.push(planId_temp);
                    var planLayers = _getLayerIdsByPlanId(planId_temp);
                    if (planId == "all") {
                        if(planLayers && planLayers.length){
                            planLayerIDs[planId_temp] = planLayers;
                        }
                        layerIds = layerIds.concat(planLayers);
                    } else if (planId == planId_temp) {
                        if(planLayers && planLayers.length){
                            planLayerIDs[planId_temp] = planLayers;
                        }
                        layerIds = layerIds.concat(planLayers);
                    }
                }
            });
        }
        var parcelData = project["CPPROJECT.PARCELLAYERID"]; //规划用地
        planLayerIDs[parcelData] = parcelData;
        if (parcelData && isCreateParcel) {
            layerIds.push(parcelData);
        }
        var roadData = project["CPPROJECT.ROADLINELAYERID"];//道路红线
        planLayerIDs[roadData] = roadData;
        if (roadData && isCreateRoad) {
            layerIds.push(roadData);
        }
        var smoothlineData = project["CPPROJECT.SMOOTHLAYERID"];//地形平整线
        planLayerIDs[smoothlineData] = smoothlineData;
        if (smoothlineData && isCreateSmooth) {
            layerIds.push(smoothlineData);
        }
        if (layerIds.length > 0) {
            if(planId && planId != "all"){
                //不同方案对应的所有图层id保存起来
                planLayerIDs[planId] = layerIds;
            }
            $.each(layerIds, function (i, layerId) {//已经存在的，控制其显示隐藏
                var layer = editLayers[layerId];
                if (layer) {
                    if(!IsValid(layer.LonLatRect)){
                        applyDataBaseRecords(bShow,layerId);
                    } else {
                        if(layer.DataLayerType == 5 && layer.name.indexOf("buildingspolygon") != -1){
                            layer.Visibility = false;
                            layer.Editable = false;
                        }else{
                            layer.Visibility = bShow;
                            if(!bShow){
                                layer.Editable = bShow;
                            }
                        }
                    }

                }else{//不存在的,请求数据
                    applyDataBaseRecords(bShow,layerId);
                }
            });
        }
    };
// endregion  ProjectManager

// region 方案树初始化

/**
 * 向数组插入方案记录，以及方案所属阶段的节点记录
 * @param res
 * @param projId 项目ID，方案所属阶段的节点的ID = 项目ID + 阶段编号
 * @param plan 方案数据：包含对象的数组或者对象
 * @param treeType 0：管理树，1：审批树
 * @param {[type]} [passedPlanId] [通过的方案ID]
 * @param {[type]} [IsBasic] [是否是基节点]
 * @param {[type]} [parcelData] [控规数据]
 * @param {[type]} [roadData] [道路数据]
 */
var _appendPlanData = function (res, projId, plan, treeType, passedPlanId,IsBasic,parcelData,roadData) {
    var planType = plan["CPPLAN.TYPE"];     // 1,2,3,4
    var planId=plan["CPPLAN.ID"];
    var stageNodeId = projId + sep + planType; // 方案所属阶段节点ID，由项目ID+阶段标识组成
    var stageExist = false;
    var i = 0;
    while (i < res.length) {
        if (res[i].id == stageNodeId) {
            stageExist = true;
            break;
        }
        i++;
    }
    var nodeIcon = "";
    var nodePlanIcon = "";
    if (treeType == 0) {
        nodeIcon = imgPathMgr + "folder.png";
        nodePlanIcon = imgPathMgr + "plan.png";
    } else if (treeType == 1) {
        nodeIcon = imgPathInves + "folder.png";
        nodePlanIcon = imgPathInves + "plan.png";
    }
    if (!stageExist) {
        res.push({
            id: stageNodeId,
            pId: projId,
            name: CODEMAP.Stage[planType],
            icon: nodeIcon,
            nocheck: false,
            type: "STAGE"
        });
    }
    var isChecked=false;
    if(IsBasic){
        var checkedtArr=checkedStatusList;
        for(var i=0;i<checkedtArr.length;i++){
            if(checkedtArr[i]===planId){
                isChecked=true;
                break;
            }
        }
    }else{
        if(!IsBasic){
            isChecked=(passedPlanId==planId);
        }
    }
    var planLayers = _getLayerIdsByPlanId(planId);
    res.push({
        id: planId,
        pId: stageNodeId,
        name: plan["CPPLAN.NAME"],
        nocheck: false,
        checked: isChecked,
        icon: nodePlanIcon,
        type: "PLAN",
        cId:planLayers,
        loadApprove: IsBasic,
        parcelId:parcelData,
        roadLine:roadData,
        projectId: projId
    });
};

var _appendBasicData = function (res, project) {
    if(currentLayerIdList && currentLayerIdList.length>0){
        var parcelId=project["CPPROJECT.PARCELLAYERID"];
        var projId=project["CPPROJECT.ID"];
        var subjectNodeId=projId+sep+"03";
        var bExist = false;
        var i = 0;
        while (i < res.length) {
            if (res[i].id == subjectNodeId) {
                bExist = true;
                break;
            }
            i++;
        }
        if (!bExist) {
            res.push({
                id: subjectNodeId,
                pId: projId,
                parcelId:parcelId,
                name: '现状',
                checked: false,
                icon: imgPathInves + "currentStatus.png",
                type: "OLD",
                projectId:projId,
                nocheck: false
            });
        }
    }
};

/**
 * 向数组插入规划专题信息
 * @param res
 * @param projId
 * @param type "PARCEL"或者"ROADLINE"
 * @param treeType 0：管理树，1：审批树
 */
var _appendSubjectData = function (res, projId, type, treeType,cId,IsBasic) {
    var subjectNodeId = projId + sep + "0";
    var nodeId = "";
    var nodeName = "";
    var nodeIcon = "";
    var bExist = false;
    var i = 0;
    while (i < res.length) {
        if (res[i].id == subjectNodeId) {
            bExist = true;
            break;
        }
        i++;
    }
    if (!bExist) {
        var zuanTiIcon = "";
        if (treeType == 0) {
            zuanTiIcon = imgPathMgr + "folder.png";
        } else if (treeType == 1) {
            zuanTiIcon = imgPathInves + "folder.png";
        }
        res.push({
            id: subjectNodeId,
            pId: projId,
            name: '项目专题',
            icon: zuanTiIcon,
            checked: false,
            type: "SUBJECT",
            nocheck: false
        });
    }

    if (type == "PARCEL") {
        nodeId = projId + sep + "01";
        nodeName = "规划用地";
        if (treeType == 0) {
            nodeIcon = imgPathMgr + "parcel.png";
        } else if (treeType == 1) {
            nodeIcon = imgPathInves + "parcel.png";
        }
    } else if (type == "ROADLINE") {
        nodeId = projId + sep + "02";
        nodeName = "道路红线";
        if (treeType == 0) {
            nodeIcon = imgPathMgr + "roadline.png";
        } else if (treeType == 1) {
            nodeIcon = imgPathInves + "roadline.png";
        }
    } else if (type == "SMOOTHLINE") {
        nodeId = projId + sep + "04";//因为03被现状数据占用了，这里取04
        nodeName = "地形平整线";
        if (treeType == 0) {
            nodeIcon = imgPathMgr + "smoothline.png";
        } else if (treeType == 1) {
            nodeIcon = imgPathInves + "smoothline.png";
        }
    }
    var checkedtArr = checkedStatusList;
    var isChecked=false;
    for(var i=0;i<checkedtArr.length;i++){
        if(checkedtArr[i]===nodeId){
            isChecked=true;
            break;
        }
    }
    res.push({
        id: nodeId,
        pId: subjectNodeId,
        name: nodeName,
        icon: nodeIcon,
        type: type,
        checked:isChecked,
        projectId: projId,
        cId:cId,
        loadApprove: IsBasic,
        nocheck: false
    });
};

/**
 * 查询项目ID对应的审批会议
 * @param projId
 * @returns {Array}
 * @private
 */
var _getConferenceData = function (projId) {
    var parcelQueryXml =
        '<QUERY><CONDITION><AND>' +
            '<PROJECTID tablename = "CPCONFERENCE">=\'' + projId + '\'</PROJECTID>' +
            '</AND></CONDITION>' +
            '><RESULT><CPCONFERENCE><FIELD>PASSEDPLANID</FIELD></CPCONFERENCE></RESULT>' +
            '</QUERY>';
    return _queryData(STAMP_config.service.query, parcelQueryXml);
};

var getAllConferenceData = function (projId) {
    var parcelQueryXml =
        '<QUERY><CONDITION><AND>' +
            '<PROJECTID tablename = "CPCONFERENCE">=\'' + projId + '\'</PROJECTID>' +
            '</AND></CONDITION>' +
            '><RESULT><CPCONFERENCE></CPCONFERENCE></RESULT>' +
            '</QUERY>';
    return _queryData(STAMP_config.service.query, parcelQueryXml);
};

/**
 * 查询项目ID对应的所有道路红线
 * @param projId
 * @return {Array}
 * @private
 */
var _getRoadLineData = function (projId) {
    var roadQueryXml =
        '<QUERY><CONDITION><AND>' +
            '<PROJECTID tablename = "CPROADLINE">=\'' + projId + '\'</PROJECTID>' +
            '</AND></CONDITION>' +
            '<RESULT><CPROADLINE></CPROADLINE></RESULT>' +
            '</QUERY>';
    return _queryData(STAMP_config.service.query, roadQueryXml);
};

/**
 * 向数组插入项目记录
 * @param res
 * @param project 项目数据：包含对象的数组或者对象
 */
var appendProjectData = function (res, project, approveProIdList, IsBasic) {
    var projId = project["CPPROJECT.ID"];
    for(var i = 0; i < res.length; i++){
        if(res[i].type == "PROJECT" && projId == res[i].id){
            return;
        }
    }

    var proStatus = project["CPPROJECT.STATUS"];
    var proName = project["CPPROJECT.NAME"];
    var IsApprove = false;
    if (approveProIdList && approveProIdList.length) {
        for (var i = 0; i < approveProIdList.length; i++) {//多审批处理
            var approveproid = approveProIdList[i];
            if (projId == approveproid) {//审批中的项目加上“审批中”的状态
                proName += "(审批中...)";
                IsApprove = true;
                break;
            }
        }
    }

    var pIdVal = -1;
    if (proStatus == 1) {//待审
        pIdVal = -2;
    }
    var parcelData = project["CPPROJECT.PARCELLAYERID"];
    res.push({
        id: projId,
        pId: pIdVal,
        parcelId:parcelData,//由于项目节点用到规划用地图层
        name: proName,
        icon: imgPathMgr + "project.png",
        approve: IsApprove,
        expand: !IsApprove,
        nocheck: IsApprove,
        open:IsBasic,
        loadApprove: IsBasic,
        type: "PROJECT"
    });

    if (parcelData) {//添加规划用地节点
        _appendSubjectData(res, projId, "PARCEL", 0, parcelData, IsBasic);
    }

    var roadData = project["CPPROJECT.ROADLINELAYERID"];
    if (roadData) {//添加道路红线节点
        _appendSubjectData(res, projId, "ROADLINE", 0, roadData, IsBasic);
    }

    var smoothData = project["CPPROJECT.SMOOTHLAYERID"];
    if (smoothData) {//添加道路红线节点
        _appendSubjectData(res, projId, "SMOOTHLINE", 0, smoothData, IsBasic);
    }

    var passedPlanId = null;
    var conferenceData = _getConferenceData(projId);//查询已审批通过的方案
    if(proStatus == 1){//已经审批的项目 才会勾选通过的方案
        if (conferenceData.length) {
            $.each(conferenceData, function (i, passedPlanData) {
                passedPlanId = passedPlanData["CPCONFERENCE.PASSEDPLANID"];//审批通过方案ID
                if(passedPlanId){
                    if(!IsApprove&&!IsBasic){//将已审批通过的方案默认显示在三维球中
                        showAll(projId, passedPlanId, true, true, false, false, false);//显示已勾选或者以审批通过的方案
                    }
                }
            });
        }
    }
    var planData = getPlanData(projId);
    if (planData.length) {
        $.each(planData, function (i, pData) {
            var bHasExist = false;
            for(var j = 0; j < res.length; j++){
                if(res[j].id == pData["CPPLAN.ID"]){
                    bHasExist = true;
                    break;
                }
            }
            if(!bHasExist){
                _appendPlanData(res, projId, pData, 0, passedPlanId,IsBasic,parcelData,roadData);
            }
        });
    }
    if (IsBasic) {
        _appendBasicData(res, project);
    }
};
var getAllPassedPlan=function(){
    var projArray = [];
    var projData = getProjectData({status: 1});
    if (projData) {
        $.each(projData, function (i, pData) {
            var projId = pData["CPPROJECT.ID"];
            if($.inArray(projId, projArray) == -1){//如果不加判断,该方案显隐会有问题
                projArray.push(projId);
                var parcelID = pData["CPPROJECT.PARCELLAYERID"];
                var passedPlanId = null;
                var conferenceData = _getConferenceData(projId);
                if (conferenceData.length == 1) {
                    passedPlanId = conferenceData[0]["CPCONFERENCE.PASSEDPLANID"];
                    showAll(projId, passedPlanId, true, true, false, false, false);//显示已勾选或者以审批通过的方案
                    if(passedPlanId){
                        top.passedPlanObj[projId] = passedPlanId;
                    }
                }
                //隐藏现状
                if(parcelID){
                    if(!editLayers[parcelID]){
                        applyDataBaseRecords(false, parcelID, true);
                    }
                }
            }

        });
    }
};
// endregion

// region 项目导入
    /**
     * 根据文件夹创建OgrDataSource
     * @param folder shp数据所在的文件夹
     * @return {*}
     * @private
     */
    var _getOgrDataSource = function (folder) {
        var dSource = null;
        if (dataProcess) {
            dataProcess.Load();
            var ogrDataProcess = dataProcess.OGRDataProcess;
            var driver = ogrDataProcess.GetDriverByType(44);   // SEOGRRegisterDriverType.Shape
            dSource = driver.Open(folder, 0);
        }
        return dSource;
    };

    /**
     * 检查rect范围是否正常
     * @param {[type]} rect [description]
     */
    var IsValid = function (rect) {
        var result = false;
        if (rect != null
            && rect.North >= -90.0 && rect.North <= 90
            && rect.South >= -90 && rect.South <= 90
            && rect.West >= -180 && rect.West <= 180
            && rect.East >= -180 && rect.East <= 180) {
            result = true;
        }
        return result;
    };

    var loadApproveXML = function () {
        var rootPath = earth.Environment.RootPath + "temp\\approve";
        var configPath = rootPath + ".xml";
        var configXml = earth.UserDocument.LoadXmlFile(configPath);
        if (configXml === "") {
            configXml = initApproveXML();
            earth.UserDocument.SaveXmlFile(rootPath, configXml);
        }
        var systemDoc = loadXMLStr(configXml);
        var systemJson = $.xml2json(systemDoc);
        if (systemJson == null) {
            return false;
        }
        return systemJson.Project;
    };

    var saveApproveXML = function (systemData) {
        var rootPath = earth.Environment.RootPath + "temp\\approve";
        var configPath = rootPath + ".xml";
        var configXml = earth.UserDocument.LoadXmlFile(configPath);
        if (configXml === "") {
            configXml = initApproveXML();
            earth.UserDocument.SaveXmlFile(rootPath, configXml);
        }
        var systemDoc = loadXMLStr(configXml);
        var root = systemDoc.documentElement;
        var projectNode = root.getElementsByTagName("Project");
        projectNode[0].text = systemData.id;
        earth.UserDocument.SaveXmlFile(rootPath, systemDoc.xml);
    };

    var initApproveXML = function (data) {
        var configXml = '<xml>';
        configXml = configXml + '<Project></Project>';
        configXml = configXml + '</xml>';
        return configXml;
    };

    var cancelApproveProject=function(){
        var projectIds = loadApproveXML();
        if (projectIds) {
            if (typeof(projectIds) == "string") {
                var projData = getProjectData({id: projectIds});
                if (projData) {
                    $.each(projData, function (i, pData) {
                        var proStatu=pData["CPPROJECT.STATUS"];
                        if(proStatu==1){
                            saveApproveXML({id:""});
                        }
                    });
                }
            }
        }else{
            var setBtnDisabled = parent.setBtnDisabled || self.setBtnDisabled;
            setBtnDisabled(true,"#heightChangeDIV");
        }
    };

    //获取项目路径
    var getRootPath=function(){
        var pathName=window.document.location.pathname;
        var localhost=window.location.host;
        var projectName=pathName.substring(0,pathName.substr(1).indexOf('/')+1);
        return(localhost+projectName);
    };

    var updateConference = function(proId,planId,date,p,d){
        var xml ='<CPCONFERENCE>' +
            '<CONDITION>' +
            '<PROJECTID>=\''+proId+'\'</PROJECTID>' +
            '</CONDITION>' +
            '<CONTENT>' +
            '<PASSEDPLANID>'+planId+'</PASSEDPLANID>' +
            '<CONFDATE>'+date+'</CONFDATE>' +
            '<STAFF>'+p+'</STAFF>' +
            '<DETAIL>'+d+'</DETAIL>' +
            '<STAGE>'+4+'</STAGE>' +
            '</CONTENT>' +
            '</CPCONFERENCE>';
        $.post(STAMP_config.service.update, xml);
    };

    var saveConference = function(proId,planId,date,p,d){
        var xml ='<CPCONFERENCE>' +
            '<PROJECTID>'+proId+'</PROJECTID>' +
            '<PASSEDPLANID>'+planId+'</PASSEDPLANID>' +
            '<CONFDATE>'+date+'</CONFDATE>' +
            '<STAFF>'+p+'</STAFF>' +
            '<DETAIL>'+d+'</DETAIL>' +
            '<STAGE>'+4+'</STAGE>' +
            '</CPCONFERENCE>';
        $.post(STAMP_config.service.add, xml, function(data){
            if (/true/.test(data)) {
            }  else{
               alert("保存失败！");
            }
        }, "text");
    };

    /*
     *定位到指定对象
     *@param obj 模型对象
     */
 	var centerObject = function (obj) {
        var lonlat = obj.GetLonLatRect();
        var north = lonlat.North;
        var south = lonlat.South;
        var east = lonlat.East;
        var west = lonlat.West;
        var top_height = lonlat.MaxHeight;
        var bottom_height = lonlat.MinHeight;
        var MaxValue = 0;
        if (Math.abs(north - south) > Math.abs(east - west)) {
            MaxValue = Math.abs(north - south) * 100000;
        }
        else {
            MaxValue = Math.abs(east - west) * 100000;
        }
        if (MaxValue < Math.abs(top_height - bottom_height)) {
            MaxValue = Math.abs(top_height - bottom_height);
        }
        earth.SelectSet.Clear();
        earth.SelectSet.Add(obj.Guid);
        earth.GlobeObserver.FlytoLookat((east + west) / 2, (north + south) / 2, (top_height + bottom_height) / 2, 0, 45, 0, MaxValue * 3,2);
    };

    var changeHeight=function(heightValue,layerIds,editLayers){
        var eObjList=[];
        if(layerIds.length){
            for(var i=0;i<layerIds.length;i++){
                if(editLayers[layerIds[i]]){
                    var count=editLayers[layerIds[i]].GetObjCount();
                    var oldEditable=editLayers[layerIds[i]].Editable;
                    if(editLayers[layerIds[i]].Editable==false){
                        editLayers[layerIds[i]].Editable=true;
                    }
                    editLayers[layerIds[i]].BeginUpdate();
                    if(count>0){
                    	var baseobj = null;
                        for (var j = count - 1; j >= 0; j--){
                            var eObj = editLayers[layerIds[i]].GetObjAt(j);
                            if (eObj != null && eObj.SphericalTransform != null)
                            {
                                var loc = eObj.SphericalTransform.GetLocation();
                                loc.Z = loc.Z + parseFloat(heightValue);
                                eObj.SphericalTransform.SetLocation(loc);
                                //数据库更新
                                baseobj = earth.Factory.CreateDataBaseObject(eObj.Guid, eObj.Name);
            					baseobj.SphericalTransform.SetLocation(eObj.SphericalTransform.GetLocation());
                                earth.DatabaseManager.UpdateSpatialPose(STAMP_config.server.dataServerIP,eObj.GetParentNode().Guid, baseobj.Guid, baseobj);
                            }
                        }
                    }
                    editLayers[layerIds[i]].EndUpdate();
                    editLayers[layerIds[i]].Editable=oldEditable;
                }
            }
        }
    };

    /**
     * 根据审批树设置按钮状态
     * @return {[type]} [description]
     */
    var checkButtonStatus = function(treeObj, node){
        var zTree = treeObj;
        if(zTree && zTree.getNodeIndex(node) >= 0){
            var eventObj = parent.$("div.toolbar-item[tag='planCheckTag']");//总评审核
            var planViewPointObj = parent.$("div.toolbar-item[tag='planViewPoint']");//方案视点
            var buildingAttributeObj = parent.$("div.toolbar-item[tag='buildingAttribute']");//建筑属性
            var indexInfoDIVObj = parent.$("div.toolbar-item[tag='indexInfoDIV']");//指标查看
            var planAttachmentObj = parent.$("div.toolbar-item[tag='planAttachmentTag']");//方案附件
            var buildingAttachmentObj = parent.$("div.toolbar-item[tag='buildingAttachmentTag']");//建筑附件
            if(node.level === 3 && node.getParentNode().name === CODEMAP.Stage[4] && node.checked){
                eventObj.removeAttr("disabled");
            }else{
                eventObj.attr("disabled", "disabled");
                eventObj.removeClass("selected");
            }

            //是否勾选
            if(node.checked){
                if(zTree.getSelectedNodes() && zTree.getSelectedNodes()[0] && (zTree.getSelectedNodes()[0].id == node.id && zTree.getSelectedNodes()[0].level == 3)){
                    planViewPointObj.removeAttr("disabled");
                    buildingAttributeObj.removeAttr("disabled");
                    indexInfoDIVObj.removeAttr("disabled");
                    eventObj.removeAttr("disabled");
                    planAttachmentObj.removeAttr("disabled");
                    buildingAttachmentObj.removeAttr("disabled");
                }else{
                    eventObj.attr("disabled", "disabled");
                    planViewPointObj.attr("disabled", "disabled");
                    buildingAttributeObj.attr("disabled", "disabled");
                    indexInfoDIVObj.attr("disabled", "disabled");
                    planAttachmentObj.attr("disabled", "disabled");
                    buildingAttachmentObj.attr("disabled", "disabled");
                }
            }

            //是否选中
            if(zTree.getSelectedNodes() && (zTree.getSelectedNodes()[0])){
                if(node.checked && (zTree.getSelectedNodes()[0].id == node.id) &&  zTree.getSelectedNodes()[0].level == 3){
                    planViewPointObj.removeAttr("disabled");
                    buildingAttributeObj.removeAttr("disabled");
                    indexInfoDIVObj.removeAttr("disabled");
                    eventObj.removeAttr("disabled");
                    planAttachmentObj.removeAttr("disabled");
                    buildingAttachmentObj.removeAttr("disabled");
                }else{
                    planViewPointObj.attr("disabled", "disabled");
                    buildingAttributeObj.attr("disabled", "disabled");
                    indexInfoDIVObj.attr("disabled", "disabled");
                    eventObj.attr("disabled", "disabled");
                    planAttachmentObj.attr("disabled", "disabled");
                    buildingAttachmentObj.attr("disabled", "disabled");
                }
            }
        }
    };

    var checkAttachmeng = function(){
        //"附件查看"按钮
        var fujianObj = parent.$("div.toolbar-item[tag='attachmentTag']");
        fujianObj.removeAttr("disabled");
    };
// endregion

//只加载现状数据库图层
function loadXZLayers(bShow, earthCopy) {
    var databaseLayersArr = [];
    var XZLayerGuids = [];
    earthCopy.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
            earthCopy.Event.OnEditDatabaseFinished = function() {};
            var layer = null;
            for (var i = 0; i < pFeature.GetChildCount(); i++) {
                layer = pFeature.GetChildAt(i);
                databaseLayersArr.push(layer);
                if (layer.GroupID == -3) {
                    XZLayerGuids.push(layer.Guid);
                }
            }
            earthCopy.XZLayerGuids = XZLayerGuids;
            earthCopy.editLayers = {};
            earthCopy.databaseLayersArr = databaseLayersArr;
            //加载editLayers图层 后面的现状图层隐藏需要用到
            if (XZLayerGuids.length) {
                for (var i = 0; i < XZLayerGuids.length; i++) {
                    var currLayer = XZLayerGuids[i];
                    getLayerLoaded(bShow, currLayer, earthCopy);
                }
            }
        }
    earthCopy.DatabaseManager.GetAllLayer(STAMP_config.server.dataServerIP);
};

/**
 * 第二个方案加载入口
 * @param  {[type]}  bShow       [description]
 * @param  {[type]}  layerIds    [description]
 * @param  {[type]}  earthCopy   [description]
 * @param  {[type]}  XZLayerGuid [description]
 * @param  {Boolean} isHideXZ    [description]
 * @return {[type]}              [description]
 */
function applyRecords(bShow, layerIds, earthCopy, XZLayerGuid, isHideXZ) {
    var databaseLayersArr = [];
    var XZLayerGuids = [];
    earthCopy.Event.OnEditDatabaseFinished = function(pRes, pFeature) {
        earthCopy.Event.OnEditDatabaseFinished = function() {};
        var layer = null;
        for (var i = 0; i < pFeature.GetChildCount(); i++) {
            layer = pFeature.GetChildAt(i);
            databaseLayersArr.push(layer);
            if (layer.GroupID == -3) {
                XZLayerGuids.push(layer.Guid);
            }
        }
        top.databaseLayersArr = databaseLayersArr;
        var editLayers2 = {};
        earthCopy.XZLayerGuids = XZLayerGuids;
        earthCopy.editLayers = editLayers2;
        earthCopy.databaseLayersArr = databaseLayersArr;
        if (XZLayerGuids.length) {
            for (var i = 0; i < XZLayerGuids.length; i++) {
                var currLayer = XZLayerGuids[i];
                getLayerLoaded(true, currLayer, earthCopy, databaseLayersArr, XZLayerGuid, false);
            }
        }
        setTimeout(function(){
            //加载方案图层
            $.each(layerIds, function(i, layerId) {
                getLayerLoaded(bShow, layerId, earthCopy, databaseLayersArr, XZLayerGuid, isHideXZ);
            });
        }, 500);
    }
    earthCopy.DatabaseManager.GetAllLayer(STAMP_config.server.dataServerIP);
};

/**
 * 单独处理方案比选中地球加载方案数据
 */
function getLayerLoaded(bShow, layerIds, earthCopy, databaseLayersArr, XZLayerGuid, isHideXZ) {
    var ids = earthCopy.databaseLayersArr;
    if (ids.length) {
        for (var i = 0; i < ids.length; i++) {
            var layer = ids[i];
            var layerId = layer.Guid;
            if ($.isArray(layerIds)) {
                if ($.inArray(layerId, layerIds) === -1) { // 不在数组中才返回-1
                    earthCopy.event.OnEditDatabaseFinished = function(pRes, pFeat) {
                        var pLayerGuid = result.LayerGuid;
                        if (result.ExcuteType == 43) {
                            onDatabaseListLoaded2(pLayerGuid, pFeat, bShow, earthCopy, XZLayerGuid, isHideXZ);
                        } else if (result.ExcuteType == 47) {
                            onElementListLoaded2(pLayerGuid, pFeat, bShow, earthCopy, XZLayerGuid, isHideXZ);
                        }
                    };
                    if (layer.LayerType == 1 || layer.LayerType == 2 || layer.LayerType == 3 ||
                        layer.LayerType == 9 || layer.LayerType == 10 || layer.LayerType == 11 ||
                        layer.LayerType == 12) {
                        earthCopy.DatabaseManager.GetDataBaseRecords(STAMP_config.server.dataServerIP, layer.Guid);
                    } else {
                        earthCopy.DatabaseManager.GetElements(STAMP_config.server.dataServerIP, layer.Guid, layer.LayerType);
                    }
                }
            } else {
                if (layerId == layerIds) {
                    earthCopy.event.OnEditDatabaseFinished = function(pRes, pFeat) {
                        var pLayerGuid = pRes.LayerGuid;
                        if (pRes.ExcuteType == 43) {
                            onDatabaseListLoaded2(pLayerGuid, pFeat, bShow, earthCopy, XZLayerGuid, isHideXZ);
                        } else if (pRes.ExcuteType == 47) {
                            onElementListLoaded2(pLayerGuid, pFeat, bShow, earthCopy, XZLayerGuid, isHideXZ);
                        }

                        if (isHideXZ !== undefined) {
                            hideEarthCurrentLayer(earthCopy, isHideXZ);
                        } else {
                            hideEarthCurrentLayer(earthCopy, bShow);
                        }
                    };
                    if (layer.LayerType == 1 || layer.LayerType == 2 || layer.LayerType == 3 ||
                        layer.LayerType == 9 || layer.LayerType == 10 || layer.LayerType == 11 ||
                        layer.LayerType == 12) {
                        earthCopy.DatabaseManager.GetDataBaseRecords(STAMP_config.server.dataServerIP, layer.Guid);
                    } else {
                        earthCopy.DatabaseManager.GetElements(STAMP_config.server.dataServerIP, layer.Guid, layer.LayerType);
                    }
                }
            }
        }
    }
};

/*功能：方案比对时，加载第二个球的模型对象
 *@param pLayerGuid 图层guid
 *@param pFeat 模型对象
 *@param bShow 是否显示
 *@param earthCopy earth球
 *@param XZLayerGuid 现状图层GUID
 *@param isHideXZ 是否隐藏现状图层
 *@return 无
 **/
function onDatabaseListLoaded2(pLayerGuid, pFeat, bShow, earthCopy, XZLayerGuid, isHideXZ) {
    var databaseLayer = databaseLayers[pLayerGuid];
    if (!databaseLayer || null == pFeat) {
        return;
    }
    var m_editLayer = earthCopy.Factory.CreateEditLayer(databaseLayer.Guid, databaseLayer.Name, databaseLayer.LonLatRect, 0, 4.5, STAMP_config.server.dataServerIP);
    earthCopy.editLayers[databaseLayer.Guid] = m_editLayer;
    m_editLayer.DataLayerType = databaseLayer.LayerType;
    m_editLayer.Visibility = bShow;
    m_editLayer.Editable = true;
    earthCopy.AttachObject(m_editLayer);
    m_editLayer.BeginUpdate();
    for (var i = 0; i < pFeat.Count; i++) {
        var obj = pFeat.Items(i);
        if (!obj) {
            continue;
        }
        var editmodel = earthCopy.Factory.CreateEditModelByDatabase(obj.Guid, obj.Name, obj.MeshID, databaseLayer.LayerType);
        editmodel.BeginUpdate();
        editmodel.SetBBox(obj.BBox.MinVec, obj.BBox.MaxVec);
        editmodel.SphericalTransform.SetLocation(obj.SphericalTransform.GetLocation());
        editmodel.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
        editmodel.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
        editmodel.Editable = true;
        editmodel.Selectable = true;
        editmodel.EndUpdate();
        m_editLayer.AttachObject(editmodel);
    }
    m_editLayer.EndUpdate();
    m_editLayer.Editable = true;
    m_editLayer.Selectable = true;
    earthCopy.DatabaseManager.UpdateLayerLonLatRect(STAMP_config.server.dataServerIP, pLayerGuid, m_editLayer.LonLatRect, m_editLayer.MaxHeight);
};

/*功能：方案比对时，加载第二个球的Element对象
 *@param pLayerGuid 图层guid
 *@param pFeat Element对象
 *@param bShow 是否显示
 *@param earthCopy earth球
 *@param XZLayerGuid 现状图层GUID
 *@param isHideXZ 是否隐藏现状图层
 *@return 无
 **/
function onElementListLoaded2(pLayerGuid, pFeat, bShow, earthCopy, XZLayerGuid, isHideXZ) {
    var databaseLayer = databaseLayers[pLayerGuid];
    if (!databaseLayer || null == pFeat) {
        return;
    }
    var m_editLayer = earthCopy.Factory.CreateEditLayer(databaseLayer.Guid, databaseLayer.Name, databaseLayer.LonLatRect, 0, 4.5, STAMP_config.server.dataServerIP);
    m_editLayer.DataLayerType = databaseLayer.LayerType;
    m_editLayer.Visibility = bShow;
    m_editLayer.Editable = true;
    earthCopy.AttachObject(m_editLayer);
    m_editLayer.BeginUpdate();
    var vect3 = null;
    var newPolygon = null;
    if(databaseLayer.LayerType == 5 && databaseLayer.name.toLowerCase().indexOf("smoothline") != -1){
        m_editLayer.Visibility = false;
    }
    for (var i = 0; i < pFeat.Count; i++) {
        var obj = pFeat.Items(i);
        if (null == obj || obj.SphericalVectors.Count <= 0) {
            continue;
        }

        switch (databaseLayer.LayerType) {
            case 4:
                var line = earthCopy.Factory.CreateElementLine(obj.Guid, obj.Name);
                vect3 = obj.SphericalTransform.GetLocation();

                line.BeginUpdate();
                line.SetPointArray(obj.SphericalVectors.Items(0));
                line.AltitudeType = 1;
                line.LineStyle.LineColor = obj.StyleInfoList.Items(0).FirstColor; // 道路红线默认为红色
                line.EndUpdate();
                line.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
                line.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
                line.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
                m_editLayer.AttachObject(line);
                break;
            case 5:
                if(databaseLayer.name.indexOf("buildingspolygon") != -1){
                    var volume = earthCopy.Factory.CreateElementVolume(obj.Guid, obj.Name);
                    vect3 = obj.SphericalTransform.GetLocation();
                    volume.BeginUpdate();
                    newPolygon = earthCopy.Factory.CreatePolygon();
                    newPolygon.AddRing(obj.SphericalVectors.Items(0));
                    volume.SetPolygon(1, newPolygon);
                    volume.height = obj.Height;
                    volume.EndUpdate();
                    volume.MeshID = obj.StyleID;
                    volume.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
                    volume.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
                    volume.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
                    m_editLayer.AttachObject(volume);
                    m_editLayer.Visibility = false;
                }else{
                    var polygon = earthCopy.Factory.CreateElementPolygon(obj.Guid, obj.Name);
                    vect3 = obj.SphericalTransform.GetLocation();
                    polygon.BeginUpdate();
                    polygon.SetExteriorRing(obj.SphericalVectors.Items(0));
                    polygon.AltitudeType = 1;
                    polygon.FillStyle.FillColor = obj.StyleInfoList.Items(0).SecondColor;
                    polygon.LineStyle.LineColor = obj.StyleInfoList.Items(0).FirstColor;
                    polygon.LineStyle.LineWidth = obj.StyleInfoList.Items(0).LineWidth;
                    polygon.EndUpdate();
                    polygon.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
                    polygon.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
                    polygon.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
                    m_editLayer.AttachObject(polygon);
                }
                break;
            case 6:
                break;
            case 14: // 矢量楼块 SEObjectType.ElementVolumeObject
                var volume = earthCopy.Factory.CreateElementVolume(obj.Guid, obj.Name);
                vect3 = obj.SphericalTransform.GetLocation();
                volume.BeginUpdate();
                newPolygon = earthCopy.Factory.CreatePolygon();
                newPolygon.AddRing(obj.SphericalVectors.Items(0));
                volume.SetPolygon(1, newPolygon);
                volume.height = obj.Height;
                volume.FillColor = obj.StyleInfoList.Items(0).FirstColor;

                //add by zhangd 20170816
                //根据建筑ID获取数据记录信息
                var res = getSimpleBuildingDataById(obj.Guid);
                if(res == null || res.length <= 0){
                    continue;
                }
                var textureArr = [];
                //找到底部材质
                var bottomTextureType = res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] : "";
                if(bottomTextureType != ""){
                    var bottomTextureUrl = STAMP_config.service.getBuildBottomTexture + obj.Guid + "&blobtype=" + bottomTextureType;
                    var returnStatus = earthCopy.UserDocument.SaveFile(bottomTextureUrl, obj.Guid + "_Bottom." + bottomTextureType);
                    if(returnStatus){
                        var bottomTexture = earthCopy.RootPath + "\\temp\\" + obj.Guid + "_Bottom." + bottomTextureType;
                        textureArr.push(bottomTexture);
                    }else{
                        textureArr.push("");
                    }
                }else{
                    textureArr.push("");
                }

                //找到顶部材质
                var topTextureType = res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"] : "";
                if(topTextureType != ""){
                    var topTextureUrl = STAMP_config.service.getBuildTopTexture + obj.Guid + "&blobtype=" + topTextureType;
                    returnStatus = earthCopy.UserDocument.SaveFile(topTextureUrl, obj.Guid + "_Top." + topTextureType);
                    if(returnStatus){
                        var topTexture = earthCopy.RootPath + "\\temp\\" + obj.Guid + "_Top." + topTextureType;
                        textureArr.push(topTexture);
                    }else{
                        textureArr.push("");
                    }
                }else{
                    textureArr.push("");
                }


                //找到侧壁材质
                var bodyTextureType = res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] : "";
                if(bodyTextureType != ""){
                    var bodyTextureUrl = STAMP_config.service.getBuildBodyTexture + obj.Guid + "&blobtype=" + bodyTextureType;
                    returnStatus = earthCopy.UserDocument.SaveFile(bodyTextureUrl, obj.Guid + "_Body." + bodyTextureType);
                    if(returnStatus){
                        var bodyTexture = earthCopy.RootPath + "\\temp\\" + obj.Guid + "_Body." + bodyTextureType;
                        textureArr.push(bodyTexture);
                    }else{
                        textureArr.push("");
                    }
                }else{
                    textureArr.push("");
                }


                //材质贴图
                var materialStyles = volume.MaterialStyles;//材质样式
                var count = materialStyles.Count;
                for (var j = 0; j < count; j++) {
                    var materialStyle = materialStyles.Items(j);
                    if(textureArr[j] != null){
                        materialStyle.DiffuseTexture = textureArr[j];//材质贴图
                    }
                }
                volume.EndUpdate();
                volume.MeshID = obj.StyleID;
                volume.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
                volume.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
                volume.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
                m_editLayer.AttachObject(volume);
                break;
            case 8:
                var building = earthCopy.Factory.CreateSimpleBuilding(obj.Guid, obj.Name);
                vect3 = obj.SphericalTransform.GetLocation();

                building.BeginUpdate();
                newPolygon = earthCopy.Factory.CreatePolygon();
                newPolygon.AddRing(obj.SphericalVectors.Items(0));
                building.SetPolygon(1, newPolygon);
                building.SetFloorsHeight(obj.height);
                building.SetFloorHeight(obj.FloorHeight);
                building.SetRoofType(obj.RoofType);

                //add by zhangd 20170816
                //根据建筑ID获取数据记录信息
                var res = getSimpleBuildingDataById(obj.Guid);
                if(res == null || res.length <= 0){
                    continue;
                }

                //找到底部材质
                var bottomTextureType = res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BOTTOMTEXTURETYPE"] : "";
                if(bottomTextureType != ""){
                    var bottomTextureUrl = STAMP_config.service.getBuildBottomTexture + obj.Guid + "&blobtype=" + bottomTextureType;
                    var returnStatus = earthCopy.UserDocument.SaveFile(bottomTextureUrl, obj.Guid + "_Bottom." + bottomTextureType);
                    if(returnStatus){
                        var bottomTexture = earthCopy.RootPath + "\\temp\\" + obj.Guid + "_Bottom." + bottomTextureType;
                    }
                }

                //找到顶部材质
                var topTextureType = res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.TOPTEXTURETYPE"]: "";
                if(topTextureType != ""){
                    var topTextureUrl = STAMP_config.service.getBuildTopTexture + obj.Guid + "&blobtype=" + topTextureType;
                    var returnStatus = earthCopy.UserDocument.SaveFile(topTextureUrl, obj.Guid + "_Top." + topTextureType);
                    if(returnStatus){
                        var roofTexture = earthCopy.RootPath + "\\temp\\" + obj.Guid + "_Top." + topTextureType;
                    }
                }

                //找到侧壁材质
                var bodyTextureType = res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] ? res[0]["CPSIMPLEBUILD.BODYTEXTURETYPE"] : "";
                if(bodyTextureType != ""){
                    var bodyTextureUrl = STAMP_config.service.getBuildBodyTexture + obj.Guid + "&blobtype=" + bodyTextureType;
                    returnStatus = earthCopy.UserDocument.SaveFile(bodyTextureUrl, obj.Guid + "_Body." + bodyTextureType);
                    if(returnStatus){
                        var floorTexture = earthCopy.RootPath + "\\temp\\" + obj.Guid + "_Body." + bodyTextureType;
                    }
                }

                if(floorTexture){//平顶
                    // 贴材质
                    var buildingMaterial = building.GetFloorsMaterialStyles();
                    for (var j = 2; j < buildingMaterial.Count; ++j) {//侧壁
                        buildingMaterial.Items(j).DiffuseTexture = floorTexture;
                    }

                    if(roofTexture && roofTexture != ""){//顶部
                        buildingMaterial.Items(1).DiffuseTexture = roofTexture;
                    }

                    if(bottomTexture && bottomTexture != ""){//底部
                        buildingMaterial.Items(0).DiffuseTexture = bottomTexture;
                    }else{//底部材质不存在时，使用侧壁材质
                        buildingMaterial.Items(0).DiffuseTexture = floorTexture;
                    }
                }

                if(roofTexture){//凸顶
                    var roofMats = building.GetRoofMaterialStyles();
                    for (var j = 0; j < roofMats.Count; j++) {
                        roofMats.Items(j).DiffuseTexture = roofTexture;
                    }
                }

                building.RoofColor = obj.StyleInfoList.Items(0).FirstColor;
                building.FloorsColor = obj.StyleInfoList.Items(0).SecondColor;

                building.EndUpdate();
                building.MeshID = obj.StyleID;
                // SetLocationEx方法调用必须放在EndUpdate函数之后
                building.SphericalTransform.SetLocationEx(vect3.X, vect3.Y, vect3.Z);
                building.SphericalTransform.SetRotation(obj.SphericalTransform.GetRotation());
                building.SphericalTransform.SetScale(obj.SphericalTransform.GetScale());
                m_editLayer.AttachObject(building);
                break;
            default:
                break;
        }
    }
    m_editLayer.EndUpdate();
    m_editLayer.Editable = false;
    earthCopy.DatabaseManager.UpdateLayerLonLatRect(STAMP_config.server.dataServerIP, pLayerGuid, m_editLayer.LonLatRect, m_editLayer.MaxHeight);
}

/**
 * 隐藏现状图层
 * @param  {[object]}  earthCopy [三维球]
 * @param  {Boolean} isHideXZ  [是否隐藏现状]
 * @return {[type]}            [无]
 */
function hideEarthCurrentLayer(earthCopy, isHideXZ) {
    if (!isHideXZ) { //隐藏现状图层
        var proId = projManager.loadApproveXML();
        var projData = projManager.getProjectData({id: proId});
        if(projData && projData[0] && projData[0]["CPPROJECT.PARCELLAYERID"]){
            parcelLayerGuid2 = projData[0]["CPPROJECT.PARCELLAYERID"];
            top.parcelLayerGuid2 = parcelLayerGuid2;
        }
        if(projData && projData[0] && projData[0]["CPPROJECT.SMOOTHLAYERID"]){
            top.smoothLayerId2 = projData[0]["CPPROJECT.SMOOTHLAYERID"];
        }
        if (parcelLayerGuid2) { //现状图层  bShow, layerIds, earthCopy
            var ids = earthCopy.XZLayerGuids; //获取现状图层的guids
            for (var i = 0; i < ids.length; i++) {
                var cid = ids[i];
                var currentlayer = earthCopy.editLayers[cid];
                if (currentlayer) {
                    var ploygonVects3 = ploygonLayersVcts3[parcelLayerGuid2];
                    if (ploygonVects3) {
                        if(!$.isArray(ploygonVects3)){
                            ploygonVects3 = [ploygonVects3];
                        }
                        for(var k = 0; k < ploygonVects3.length; k++){
                            currentlayer.LayerIsPrior = false;
                            var eList = currentlayer.ClipByRegion(ploygonVects3[k], false);
                            earthCopy.XZObjs = eList;
                            if (eList && eList.Count) {
                                var count = eList.Count;
                                for (var j = 0; j < count; j++) {
                                    var obj = eList.Items(j);
                                    obj.Visibility = false;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

//////////////////////////////////////////////////////////////////////////////////////////////

    // region 公共接口
    projManager.getCurrentLayerObjList = getCurrentLayerObjList;
    projManager.checkButtonStatus = checkButtonStatus;
    projManager.getProjectData = getProjectData;
    projManager.getPlanData = getPlanData;
    projManager.getPlanById = getPlanById;
    projManager.getPlanIndex = getPlanIndex;
    projManager.getProjectYDXZ=getProjectYDXZ;
    projManager.getRoadLineData=_getRoadLineData;
    projManager.getBuildingDataByPlanId=getBuildingDataByPlanId;
    projManager.getBuildingShpByPlanId = getBuildingShpByPlanId;
    projManager.updateStatus = updateStatus;
    projManager.locateToLayer = locateToLayer;
    projManager.getLayerIdsByPlanId = _getLayerIdsByPlanId;
    projManager.getLayerIdByProId = _getLayerIdByProId;
	projManager.applyDataBaseRecords = applyDataBaseRecords;
    projManager.appendProjectData = appendProjectData;// 为管理树添加项目数据
    projManager.deleteProject = deleteProject;
    projManager.deletePlan = deletePlan;
    projManager.deleteCPBuilding = deleteCPBuilding;
    projManager.deleteCPSimpleBuild = deleteCPSimpleBuild;
    projManager.updatePlanLayerIDs = updatePlanLayerIDs;
    projManager.updatePlanIndex = updatePlanIndex;
    projManager.getTotalPlanIndex = getTotalPlanIndex;
    projManager.updateBuildingBasial = updateBuildingBasial;
    projManager.updateSimpleBuildBasial = updateSimpleBuildBasial;
    projManager.IsValid = IsValid;
    projManager.showAll = showAll;
    projManager.showCurrentLayers = showCurrentLayers;
    projManager.getAllPassedPlan=getAllPassedPlan;
    projManager.loadApproveXML = loadApproveXML;
    projManager.saveApproveXML = saveApproveXML;
    projManager.getAllConferenceData=getAllConferenceData;
    projManager.saveConference=saveConference;
    projManager.updateConference=updateConference;
    projManager.centerObject=centerObject;
    projManager.cancelApproveProject=cancelApproveProject;
    projManager.changeHeight=changeHeight;
    projManager.getEditLayers = getEditLayers;
    projManager.getPlanLayerIDs = getPlanLayerIDs;
    projManager.getParcelLayerGuid2 = getParcelLayerGuid2;
    projManager.getEditLayerListLoaded = getEditLayerListLoaded;
    projManager.loadXZLayers = loadXZLayers;
    projManager.applyRecords = applyRecords;
    projManager.getBuildingDataById = getBuildingDataById;
    projManager.getSimpleBuildingDataById = getSimpleBuildingDataById;
    projManager.getSimpleBuildingDataByPlanId = getSimpleBuildingDataByPlanId;
    projManager.updateBuildHeight = updateBuildHeight;
    projManager.updateSimpleBuildHeight = updateSimpleBuildHeight;
    projManager.updateBuildZJZMJ = updateBuildZJZMJ;
    projManager.checkedStatusList = checkedStatusList;
    projManager.showParamModel = showParamModel;
    projManager.getParamModelVisibility = getParamModelVisibility;
    projManager.getModelByParamModel = getModelByParamModel;
    projManager.getYongDiArray = getYongDiArray;
    projManager.getPolygonObjByModel = getPolygonObjByModel;
    projManager.getModelByPolygon = getModelByPolygon;
    projManager.addNewLayerData = addNewLayerData;
    projManager.createShpBuildingModel = _createShpBuildingModel;
    projManager.createSimpleBuildingModel = _createSimpleBuildingModel;

    return projManager;
};
// endregion
