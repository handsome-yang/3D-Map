/**
 * 作    者：StampGIS Team
 * 创建日期：2017年6月15日
 * 描    述：编辑工具
 * 注意事项：存放三维模型的编辑操作方法
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

if( !STAMP ){
    var STAMP = {};
}

STAMP.EditTool = function (earth,generateEdit){
    var editTool = {};
    var curEditingPoint = null;   // 当前正在编辑的节点对象
    var editOperStack = null;
    var curOper = -1;
    var status = "";//编辑状态：move为位置调整、rotate为方位调整
    var params = [];//位置调整后返回偏移值（x,y,z）
    var rotateYOff = 0;//方位调整后返回旋转值（Y轴）
    var selectStatus = false;
    var lastBalloonId = null;//方案编辑模块
    var isPoseChanged = false;//是否是调整位置或者方位调整的

    /**
     * 取消选择状态
     * @return {[type]} [description]
     */
    var browse=function(){
        earth.SelectSet.UnLockSelectSet();
        earth.ToolManager.SphericalObjectEditTool.Browse();
        earth.Event.OnSelectChanged = function(){};
    }

    /**
     * 选择
     * @return {[type]} [description]
     */
    var select = function (){
        clearHtmlBallon(htmlBalloonMove);
        browse();
        earth.Event.OnRBDown=function(){
            earth.Event.OnRBDown = function(){};
            clearHtmlBallon(htmlBalloonMove);
        }
        earth.ToolManager.SphericalObjectEditTool.Select();
    };

    /*
     * 供气泡内调用
     * @param rotate 旋转值
     * @return 无
     */
    var setRotateYOff = function(rotate){
        rotateYOff = rotate;
    }

    /*
     *打开建筑调整界面
     *@param id 功能ID，气泡类型
     *@return 无
     */
    var editProgramme = function (id){
        selectStatus = true;
        isPoseChanged = true;
        //清除气泡
        clearHtmlBallon(htmlBalloonMove);
        //清除选取状态
        browse();
        setSelectChange(id);
        status = "rotate";
        earth.Event.OnEditFinished = onEditFinished;
        earth.Event.OnPoseChanged = updateAndSetValue;
        //旋转
        earth.ToolManager.SphericalObjectEditTool.Rotate(2);
        //显示标准模型
        top.projManager.showParamModel(top.currentPlanLayerId, false);
    }

    /*
     *打开楼高调整界面
     *@param id 功能ID，当作气泡类型
     *@return 无
     */
    var editFloor = function (id){
        //清除气泡
        clearHtmlBallon(htmlBalloonMove);

        //清除选取状态
        browse();

        //注册选择改变事件
        earth.Event.OnSelectChanged = function(){
            if(earth.SelectSet.GetCount() == 1){//选中一个模型
               var model = earth.SelectSet.GetObject(0);
               if (model.Rtti == 280 || model.Rtti == 207){//280：简单建筑、207：矢量楼块
                    showMoveHtml(id);
               }else{//非简单建筑和矢量楼块时不允许调整
                    alert("您选择的不是参数模型!");
                    earth.SelectSet.Clear();
                    earth.ToolManager.SphericalObjectEditTool.Select();
               }
            }else if(earth.SelectSet.GetCount() > 1){
                alert("请选择单个模型");
            }
        };

        //注册右键事件，结束功能
        earth.Event.OnRBDown=function(){
            earth.Event.OnSelectChanged = function(){};
            earth.Event.OnRBDown = function(){};
            clearHtmlBallon(htmlBalloonMove);
            clearMenuStyle();
            //恢复3DMax标准模型状态
            top.projManager.showParamModel(top.currentPlanLayerId, false);
        }

        //选取状态
        earth.ToolManager.SphericalObjectEditTool.Select();

        //显示参数模型
        top.projManager.showParamModel(top.currentPlanLayerId, true);
    };

    /*
     *打开基底调整界面
     *@param id 功能ID，气泡类型
     *@return 无
     */
    var editBasal = function (id){
        //先清除气泡
    	clearHtmlBallon(htmlBalloonMove);
        //清除选取状态
        browse();
        //注册选择改变事件
        earth.Event.OnSelectChanged = function(){
           	if(earth.SelectSet.GetCount() == 1){//选中一个对象时
               var model = earth.SelectSet.GetObject(0);
               if (model.Rtti == 280 || model.Rtti == 207){//280：简单建筑、207：矢量楼块
               		showMoveHtml(id);
               }else{//非简单建筑和矢量楼块时不允许调整
               		alert("您选择的不是参数模型!");
               		earth.SelectSet.Clear();
		            earth.ToolManager.SphericalObjectEditTool.Select();
               }
           	}else if(earth.SelectSet.GetCount() > 1){
                alert("请选择单个模型");
            }
        };

        //注册右键事件，结束功能
        earth.Event.OnRBDown=function(){
            earth.Event.OnSelectChanged = function(){};
            earth.Event.OnRBDown = function(){};
            clearHtmlBallon(htmlBalloonMove);
            clearMenuStyle();
            //还原3DMax模型状态
            top.projManager.showParamModel(top.currentPlanLayerId, false, true);
        }

        //选取状态
        earth.ToolManager.SphericalObjectEditTool.Select();

        //显示参数模型
        top.projManager.showParamModel(top.currentPlanLayerId, true, true);
    }

    /**
     * 更新编辑模型
     * @param  {[type]} model [模型对象]
     * @return {[type]}       [description]
     */
    var updateObject = function (model){
        var info = earth.Factory.CreateDbEleInfo(model.Guid, model.Name);
        info.SphericalTransform.SetLocation(model.SphericalTransform.GetLocation());
        info.SphericalTransform.SetRotation(model.SphericalTransform.GetRotation());
        info.SphericalTransform.SetScale(model.SphericalTransform.GetScale());
        earth.DatabaseManager.UpdateElementPose(STAMP_config.server.dataServerIP,model.GetParentNode().Guid, model.Guid, info);
    };

    /*
     *更新模型对象位置-包括基底矢量面
     *@param model 模型对象
     */
    var updateModel = function (model){
        if (model){
            //更新模型对象
            var baseobj = earth.Factory.CreateDataBaseObject(model.Guid, model.Name);
            baseobj.SphericalTransform.SetLocation(model.SphericalTransform.GetLocation());
            baseobj.SphericalTransform.SetRotation(model.SphericalTransform.GetRotation());
            baseobj.SphericalTransform.SetScale(model.SphericalTransform.GetScale());
            var box = model.GetBBox();
            baseobj.BBox.SetExtent(box.MinVec, box.MaxVec);
            //更新数据库
            earth.DatabaseManager.UpdateSpatialPose(STAMP_config.server.dataServerIP,model.GetParentNode().Guid, model.Guid, baseobj);
            model.RefreshMesh();
            model.RefreshTexture();

            //找到对应的模型编辑图层
            var modelLayer = top.editLayers[model.GetParentNode().Guid];
            //模型编辑图层不能为空，名称不能为空，名称中必须含有buildingsmodel
            if(!modelLayer || !modelLayer.name || modelLayer.name.indexOf("buildingsmodel") == -1){
                return;
            }

            /*
             * 下面通过模型名称来找到基底矢量面对象
             * 模型图层名称：包括buildingsmodel_加上用地名称
             * 基地矢量面图层名称：包括buildingspolygon_加上用地名称
             */
            var polygonLayerName = modelLayer.name.replace("buildingsmodel", "buildingspolygon");
            var planLayers = projManager.getLayerIdsByPlanId(top.currentPlanLayerId);
            for (var j = 0; j < planLayers.length; j++) {
                var getEditLayers = top.editLayers;
                var editLayer = getEditLayers[planLayers[j]];
                if (editLayer && editLayer.DataLayerType == 5 && editLayer.Name == polygonLayerName) {
                    for(var k = 0; k < editLayer.GetObjCount(); k++){
                        var obj = editLayer.GetObjAt(k);
                        if(obj.name.toLowerCase() == model.name.toLowerCase()){//名称进行匹配，然后更新
                            //更新基底矢量面对象
                            obj.SphericalTransform.SetLocation(model.SphericalTransform.GetLocation());
                            obj.SphericalTransform.SetRotation(model.SphericalTransform.GetRotation());
                            obj.SphericalTransform.SetScale(model.SphericalTransform.GetScale());
                            var info = earth.Factory.CreateDbEleInfo(obj.guid, obj.Name);
                            info.SphericalTransform.SetLocation(model.SphericalTransform.GetLocation());
                            info.SphericalTransform.SetRotation(model.SphericalTransform.GetRotation());
                            info.SphericalTransform.SetScale(model.SphericalTransform.GetScale());
                            //更新基底矢量面数据库对象
                            earth.DatabaseManager.UpdateElementPose(STAMP_config.server.dataServerIP, planLayers[j], obj.guid, info);
                        }
                    }
                }
            }
        }
    };

    /**
     * 更新模型的基底矢量面
     * @param  {[type]} model [基底矢量面生成的参数模型]
     * @return {[type]}       [description]
     */
    var updateShp = function (model){
        var info = earth.Factory.CreateDbEleInfo(model.Guid, model.Name);
        info.SphericalTransform.SetLocation(model.SphericalTransform.GetLocation());
        info.SphericalTransform.SetRotation(model.SphericalTransform.GetRotation());
        info.SphericalTransform.SetScale(model.SphericalTransform.GetScale());
        var temp = model.GetExteriorRing();
        info.SphericalVectors.Add(temp);
        var styleInfo = earth.Factory.CreateStyleInfo();
        styleInfo.FirstColor = model.LineStyle.LineColor;
        styleInfo.SecondColor = model.FillStyle.FillColor;
        styleInfo.LineWidth = model.LineStyle.LineWidth;
        var stylelist = earth.Factory.CreateStyleInfoList();
        stylelist.AddItem(styleInfo);
        info.StyleInfoList = stylelist;
        info.DrawOrder = 1000;
        info.Type = 5;
        info.AltitudeType = 1;
        earth.DatabaseManager.UpdateElementPose(STAMP_config.server.dataServerIP,model.GetParentNode().Guid, model.Guid, info);
    };

    /**
     * 更新选中对象的位置
     * @return {[type]} [description]
     */
    var updateSelectedObject = function (){
        var model = null;
        if(earth.SelectSet.GetCount() <= 0){
            earth.SelectSet.UnLockSelectSet();
            return;
        }
        for (var i = 0; i < earth.SelectSet.GetCount(); i++){
            model = earth.SelectSet.GetObject(i);
            if (model){
                updateChangeObject(model);
            }
        }
    };

    /**
     * 更新模型对象位置信息
     * @param  {[type]} model [description]
     * @return {[type]}       [description]
     */
    var updateChangeObject=function(model){
        if (model){
            if(model.Rtti == 280 || model.Rtti == 207) {  // 简单建筑和矢量楼块
                updateObject(model);
            }else if(model.Rtti == 223){ // 3DMax建筑模型
                updateModel(model);
            }else if(model.Rtti==211){
                updateShp(model);
            }
        }
    };

    /**
     * 更新数据库并且将移动的值填充到气泡中
     */
    var updateAndSetValue = function(){
        updateSelectedObject();//更新数据库模型
        if(earth.SelectSet.GetCount() > 0){
            if(status == "editPosition"){//位置调整完成后，需要设置窗口内的偏移值
                var trans = earth.SelectSet.GetObject(0).SphericalTransform;
                var ssss = CoordinateTransform.sysDatum.des_BLH_to_src_xy(trans.longitude, trans.latitude, trans.altitude);
                if(params.length===3 && htmlBalloonMove){//x,y,z组成的数组
                    params[0] = ssss.X-params[0];
                    params[1] = ssss.Y-params[1];
                    params[2] = ssss.Z-params[2];
                    htmlBalloonMove.InvokeScript("GetReturnValue", params);
                }
                params=[ssss.X, ssss.Y, ssss.Z];//重置
            }else if(status == "rotate"){//方位调整完成后，需要设置窗口内的旋转值
                var rotateY = earth.SelectSet.GetObject(0).SphericalTransform.GetRotation().Y;
                var isNum = parseFloat(rotateYOff);
                if(!(isNaN(isNum)) && htmlBalloonMove){//存在旋转值时
                    rotateYOff = rotateY - rotateYOff;
                    htmlBalloonMove.InvokeScript("GetReturnValue", rotateYOff);
                }
                rotateYOff = rotateY;//重置
            }
        }
    }

    /**
     * 编辑完成事件
     */
    var onEditFinished = function (){
    	debugger
        earth.Event.OnEditDatabaseFinished = function (){};
        if(!isPoseChanged){//不是可以进posechanged的需要在这个地方更新数据库
            updateAndSetValue();
        }
        params = [];
        rotateYOff = null;
        //清空选择
        earth.ToolManager.SphericalObjectEditTool.Browse();
    };

    /*
     * 设置为重新选取状态
     * @param selectS 选择状态
     * @return 无
     */
    var setSelectStatus = function(isSelectChange, type){
        selectStatus = true;
        if(isSelectChange){
            setSelectChange(type);
        }
    }

    /**
     * 移动的选择改变事件
     * @param {[type]} id [模型ID]
     */
    function setSelectChange(id){
        earth.Event.OnSelectChanged = function(){
            if(!selectStatus){//非选择状态时直接返回（编辑完成时）
                return;
            }
            selectStatus = false;//重置为非选择状态
            if(earth.SelectSet.GetCount() > 0) {
                if(htmlBalloonMove == null){
                    showMoveHtml(id);
                }
                if(id == "editProgramme"){//方位调整
                	debugger
                    rotateYOff = earth.SelectSet.GetObject(0).SphericalTransform.GetRotation().Y;
                    if(htmlBalloonMove){
                        htmlBalloonMove.InvokeScript("GetReturnValue", 0);//初始偏移量设置为0,0,0
                    }
                }else if(id == "editPosition"){//位置调整
                    //设置选中的第一个模型的位置-用于编辑完成时计算偏移量
                    var trans = earth.SelectSet.GetObject(0).SphericalTransform;
                    var ssss = CoordinateTransform.sysDatum.des_BLH_to_src_xy(trans.longitude, trans.latitude, trans.altitude);
                    params = [];
                    params.push(ssss.X);
                    params.push(ssss.Y);
                    params.push(ssss.Z);
                    if(htmlBalloonMove){
                        htmlBalloonMove.InvokeScript("GetReturnValue", [0,0,0]);//初始偏移量设置为0,0,0
                    }
                }
            }
        };
    }

    /**
     * 位置调整
     * @param id 位置调整的菜单ID
     * @return 无
     */
    var editPosition = function (id){
        selectStatus = true;
        isPoseChanged = true;
        clearHtmlBallon(htmlBalloonMove);
        browse();
        setSelectChange(id);

        status = "editPosition";//位置调整
        earth.Event.OnEditFinished = onEditFinished;//编辑完成事件
        earth.ToolManager.SphericalObjectEditTool.Move(7);//7表示x、y、z全部可移动
        earth.Event.OnPoseChanged = updateAndSetValue;//位置变化完成事件
        //显示标准模型
        top.projManager.showParamModel(top.currentPlanLayerId, false);
    };

    //旋转
    var rotate = function (){
        clearHtmlBallon(htmlBalloonMove);
        browse();
        earth.Event.OnEditFinished = onEditFinished;
        earth.Event.OnSelectChanged = function(){
            if(earth.SelectSet.GetCount() > 0){
                showMoveHtml("rotate");
            }
            earth.Event.OnSelectChanged=function(){}
        };
        earth.ToolManager.SphericalObjectEditTool.Rotate(7);   // SEAxisStatus.EnableAxisAll
    };

    //缩放
    var scale = function (){
        clearHtmlBallon(htmlBalloonMove);
        browse();
        earth.Event.OnEditFinished = onEditFinished;
        earth.Event.OnSelectChanged = function(){
            if(earth.SelectSet.GetCount() > 0){
                showMoveHtml("scale");
            }
            earth.Event.OnSelectChanged=function(){}
        };
        earth.ToolManager.SphericalObjectEditTool.Scale(7);   // SEAxisStatus.EnableAxisAll
    };

    //删除
    var removeObj = function (){
        clearHtmlBallon(htmlBalloonMove);
        browse();
        earth.Event.OnSelectChanged = function(){
            if(earth.SelectSet.GetCount() > 0){
                var isSucces = deleteObj();
                if(isSucces){
                    updateSelectedObject();
                }

                clearHtmlBallon(htmlBalloonMove);
                //清空选择
                earth.ToolManager.SphericalObjectEditTool.Browse();
                earth.Event.OnSelectChanged=function(){}
            }
        };
        earth.ToolManager.SphericalObjectEditTool.Select();
    };

    //删除
    var deleteObj = function () {
        if(earth.SelectSet.GetCount() <= 0){
            earth.SelectSet.UnLockSelectSet();
            alert("请选择删除物体！");
            return false;
        }
        var deleteObjectLayersGuid=[];
        var eObjList=[];
        for (var i = 0; i < earth.SelectSet.GetCount(); i++){
            var selObj = earth.SelectSet.GetObject(i);
            if (selObj){
                var selObjLayer = selObj.GetParentNode();
                if(selObjLayer&&selObjLayer.Editable){
                    eObjList.push(selObj);
                    deleteObjectLayersGuid.push(selObjLayer.Guid);
                }else{
                    alert("删除失败，图层处于不可编辑状态！");
                    return false;
                }
            }
        }
        if (eObjList.length&&!confirm("是否确定要删除？")) {
            return false;
        }
        var polygonEditLayerMap = {};
        var planLayers = projManager.getLayerIdsByPlanId(top.currentPlanLayerId);
        for(var e=0;e<deleteObjectLayersGuid.length;e++){
            var delGuid=deleteObjectLayersGuid[e];
            var getEditLayers = projManager.getEditLayers();
            if(getEditLayers[delGuid]){
                getEditLayers[delGuid].BeginUpdate();
                //建筑模型图层-需要同步基底面
                if(getEditLayers[delGuid].name.indexOf("buildingsmodel") != -1){
                    //同一个方案里面有多个规划用地时，会有多个建筑模型图层和建筑基底面图层，通过后面的标识进行区别判断
                    var polygonLayerName = getEditLayers[delGuid].name.replace("buildingsmodel","buildingspolygon");
                    for (var j = 0; j < planLayers.length; j++) {
                        var getEditLayers = top.editLayers;
                        var polygonLayer = getEditLayers[planLayers[j]];
                        if(polygonLayer){
                            if(polygonLayer && polygonLayer.DataLayerType == 5 && polygonLayer.name == polygonLayerName) {
                                polygonLayer.BeginUpdate();
                                polygonEditLayerMap[delGuid] = polygonLayer;
                            }
                        }
                    }
                }
            }
        }

        earth.SelectSet.Clear();
        for(var l=0;l<eObjList.length;l++){
            var eObj = eObjList[l];
            var layer = eObj.GetParentNode();
            if(eObj.Rtti == 280 || eObj.Rtti == 207){  // 简单建筑280和矢量楼块207
                if(polygonEditLayerMap[layer.guid]){
                    for(var j = 0; j < polygonEditLayerMap[layer.guid].GetObjCount(); j++){
                        var itemPolygonLayer = polygonEditLayerMap[layer.guid];
                        if(itemPolygonLayer){
                            var itemPolygonObj = itemPolygonLayer.GetObjAt(j);
                            if(itemPolygonObj && itemPolygonObj.name.toLowerCase() == eObj.name.toLowerCase()){
                                earth.DatabaseManager.DeleteElementInLayer(STAMP_config.server.dataServerIP,itemPolygonLayer.Guid, itemPolygonObj.Guid);
                                itemPolygonLayer.DetachWithDeleteObject(itemPolygonObj);
                            }
                        }
                    }
                }

                earth.DatabaseManager.DeleteElementInLayer(STAMP_config.server.dataServerIP,layer.Guid, eObj.Guid);
                layer.DetachWithDeleteObject(eObj);
                projManager.deleteCPSimpleBuild(eObj.guid);
            }else if(eObj.Rtti == 223){
                if(polygonEditLayerMap[layer.guid]){//建筑模型
                    for(var j = 0; j < polygonEditLayerMap[layer.guid].GetObjCount(); j++){
                        var itemPolygonLayer = polygonEditLayerMap[layer.guid];
                        if(itemPolygonLayer){
                            var itemPolygonObj = itemPolygonLayer.GetObjAt(j);
                            if(itemPolygonObj && itemPolygonObj.name.toLowerCase() == eObj.name.toLowerCase()){
                                earth.DatabaseManager.DeleteElementInLayer(STAMP_config.server.dataServerIP,itemPolygonLayer.Guid, itemPolygonObj.Guid);
                                itemPolygonLayer.DetachWithDeleteObject(itemPolygonObj);
                            }
                        }
                    }
                    projManager.deleteCPBuilding(eObj.guid);
                }
                earth.DatabaseManager.DeleteRecordInLayer(STAMP_config.server.dataServerIP,layer.Guid, eObj.Guid);
                layer.DetachWithDeleteObject(eObj);
            }
        }
        for(var e=0;e<deleteObjectLayersGuid.length;e++){
            var delGuid=deleteObjectLayersGuid[e];
            var getEditLayers = projManager.getEditLayers();
            if(getEditLayers[delGuid]){
                getEditLayers[delGuid].EndUpdate();
                if(polygonEditLayerMap[delGuid]){
                    polygonEditLayerMap[delGuid].EndUpdate();
                }
            }
        }
        deleteObjectLayersGuid=[];
        eObjList=[];
        polygonEditLayerMap = {};
        projManager.updatePlanIndex(top.currentPlanLayerId);
        return true;
    };

    /*
     * 材质编辑
     */
    var textureEdit=function(){
        clearHtmlBallon(htmlBalloonMove);
        browse();
        earth.Event.OnMaterialSelectChanged = onResetMaterial;
        earth.SelectSet.LockSelectSet();
        earth.ToolManager.MaterialEditTool.Select();
        //恢复3DMax标准模型状态
        top.projManager.showParamModel(top.currentPlanLayerId, false);
    };

    /**
     * 更新简单建筑纹理
     * @param  {[type]} eObj          [简单建筑模型对象]
     * @param  {[type]} textureid     [纹理ID]
     * @param  {[type]} materialIndex [材质索引：1、顶部纹理；2、侧壁纹理；0、底部纹理]
     * @param  {[type]} texturePath   [description]
     * @param  {[type]} imgType       [description]
     * @return {[type]}               [description]
     */
    var updateSimpleBuildTexture = function(eObj, textureid, materialIndex, texturePath, imgType){
        if(materialIndex == 1){//顶部纹理
            earth.DatabaseManager.PostFile(texturePath, STAMP_config.service.addBuildTopTexture + eObj.Guid);
            var xmlUpdate = "<CPSIMPLEBUILD>" +
            "<CONDITION><ID> ='" + eObj.Guid + "' </ID></CONDITION>" +
            "<CONTENT><TOPTEXTURETYPE>" + imgType + "</TOPTEXTURETYPE></CONTENT>" +
            "</CPSIMPLEBUILD>";
            $.post(STAMP_config.service.update, xmlUpdate);
            eObj.BeginUpdate();
            if(eObj.Rtti == 280){//简单建筑
                //平顶纹理设置
                var floorMats = eObj.GetFloorsMaterialStyles();
                floorMats.Items(1).DiffuseTexture = texturePath;

                //凸顶纹理设置
                var roofMats = eObj.GetRoofMaterialStyles();
                for (var i = 0; i < roofMats.Count; i++) {
                    roofMats.Items(i).DiffuseTexture = texturePath;
                }
            }else if(eObj.Rtti == 207){//矢量楼块
                var materialStyles = eObj.MaterialStyles;//材质样式
                if(materialStyles.Count >= 2){
                    materialStyles.Items(1).DiffuseTexture = texturePath;
                }
            }
            eObj.EndUpdate();
        }else if(materialIndex == 2){//侧壁纹理
            earth.DatabaseManager.PostFile(texturePath, STAMP_config.service.addBuildBodyTexture + eObj.Guid);
            var xmlUpdate = "<CPSIMPLEBUILD>" +
            "<CONDITION><ID> ='" + eObj.Guid + "' </ID></CONDITION>" +
            "<CONTENT><BODYTEXTURETYPE>" + imgType + "</BODYTEXTURETYPE></CONTENT>" +
            "</CPSIMPLEBUILD>";
            $.post(STAMP_config.service.update, xmlUpdate);
            if(eObj.Rtti == 280){//简单建筑
                var floorMats = eObj.GetFloorsMaterialStyles();
                if(floorMats.Count >= 3){
                    floorMats.Items(2).DiffuseTexture = texturePath;
                }
            }else if(eObj.Rtti == 207){//矢量楼块
                var materialStyles = eObj.MaterialStyles;//材质样式
                if(materialStyles.Count >= 3){
                    materialStyles.Items(2).DiffuseTexture = texturePath;
                }
            }
        }else if(materialIndex == 0){//底部纹理
            earth.DatabaseManager.PostFile(texturePath, STAMP_config.service.addBuildBottomTexture + eObj.Guid);
            var xmlUpdate = "<CPSIMPLEBUILD>" +
            "<CONDITION><ID> ='" + eObj.Guid + "' </ID></CONDITION>" +
            "<CONTENT><BOTTOMTEXTURETYPE>" + imgType + "</BOTTOMTEXTURETYPE></CONTENT>" +
            "</CPSIMPLEBUILD>";
            $.post(STAMP_config.service.update, xmlUpdate);
            if(eObj.Rtti == 280){//简单建筑
                var floorMats = eObj.GetFloorsMaterialStyles();
                if(floorMats.Count >= 1){
                    floorMats.Items(0).DiffuseTexture = texturePath;
                }
            }else if(eObj.Rtti == 207){//矢量楼块
                var materialStyles = eObj.MaterialStyles;//材质样式
                if(materialStyles.Count >= 1){
                    materialStyles.Items(0).DiffuseTexture = texturePath;
                }
            }
        }
    }

    //材质替换
    var onResetMaterial=function(){
        earth.SelectSet.UnLockSelectSet();
        var texturePath = earth.UserDocument.OpenFileDialog("", "JPEG(*.jpg;jpeg)|*.jpg;*.jpeg|BMP(*.bmp)|*.bmp|PNG(*.png)|*.png|TGA(*.tga)|*.tga");    // 选择项目文件完整路径
        if (!texturePath) {
            //清除选中状态
            browse();
            return;
        }
        var imgType=texturePath.substr(texturePath.lastIndexOf(".")+1,texturePath.length);
        var img=new Image();
        img.src=texturePath;
        var width=img.width;
        var height=img.height;
        var material = earth.ToolManager.MaterialEditTool.GetSelectedMaterial();
        var textureid = material.DiffuseTexture;
        var eObj = earth.SelectSet.GetObject(0);
        if(eObj.Rtti == 280 || eObj.Rtti == 207){//简单建筑或矢量楼块
            updateSimpleBuildTexture(eObj, textureid, material.MaterialIndex, texturePath, imgType);
            return;
        }

        //下面是3DMax模型
        var pObj = eObj.GetParentNode();
        var logPath= earth.RootPath + "temp\\editgenerate.log";
        earth.Event.OnEditDatabaseFinished = function (){};
        var isValid=generateEdit.check_texture_log(pObj.Guid,STAMP_config.server.serviceIP, texturePath, textureid, logPath);
        if(!isValid){
            var type = generateEdit.get_pic_type();
            var swidth = generateEdit.get_pic_width();
            var sheight = generateEdit.get_pic_height();
            // 判断类型和大小是否一致，如果类型不一致没有办法转，如果大小不一致则可以
            if(type==4&&(imgType.toLowerCase()=="jpg"||imgType.toLowerCase()=="jpeg"||imgType.toLowerCase()=="bmp")){
                alert("图片类型与原材质不符，只能使用png或tga类型的图片");
                return;
            }else if(type==3&&(imgType.toLowerCase()=="png"||imgType.toLowerCase()=="tga")){
                alert("图片类型与原材质不符，只能使用jpg或bmp类型的图片");
                return;
            }else if(swidth!=width||sheight!=height){
                alert("图片类型与原材质宽高("+sheight+"*"+swidth+")不相等");
                return;
            }
        }else{
            changedTexture(material,pObj.Guid,texturePath,textureid,logPath, pObj);
        }
    }

    /**
     * 改变纹理
     * @param  {[type]} material    [材质]
     * @param  {[type]} objGuid     [模型GUID]
     * @param  {[type]} texturepath [纹理路径]
     * @param  {[type]} textureid   [纹理ID]
     * @param  {[type]} logpath     [日志路径]
     * @param  {[type]} pObj        [模型所属图层]
     * @return {[type]}             [description]
     */
    var changedTexture=function(material,objGuid,texturepath,textureid,logpath, pObj){
        var result = generateEdit.change_texture_log(objGuid, STAMP_config.server.serviceIP, texturepath, textureid, logpath);
        if (result){
            material.RefreshDiffuseTexture();
            //刷新该层上的所有editmodel对象 保证共用纹理即时刷新
            var childNum = pObj.GetObjCount();
            for(var i = 0; i < childNum; i++){
                var eModel = pObj.GetObjAt(i);
                eModel.RefreshTexture();
            }
            earth.SelectSet.UnLockSelectSet();
            earth.ToolManager.SphericalObjectEditTool.Select();
            browse();
        }else{
            alert("纹理替换失败");
        }
    }

    /**
     * 根据输入值移动
     * @param  {[type]} dx [x轴偏移值]
     * @param  {[type]} dy [y轴偏移值]
     * @param  {[type]} dz [z轴偏移值]
     * @return {[type]}    [description]
     */
    var moveByValue = function (dx,dy,dz){
        earth.ToolManager.SphericalObjectEditTool.MoveSelectObject(dx,dy,dz);
        updateSelectedObject();
    };

    /**
     * 根据输入值旋转
     * @param  {[type]} dx [x轴旋转值]
     * @param  {[type]} dy [y轴旋转值]
     * @param  {[type]} dz [z轴旋转值]
     * @return {[type]}    [description]
     */
    var rotateByValue = function (dx,dy,dz){
        earth.ToolManager.SphericalObjectEditTool.RotateSelectObject(dx,dy,dz);
        updateSelectedObject();
    };

    /**
     * 根据输入值放大缩小
     * @param  {[type]} dx [x轴放大值]
     * @param  {[type]} dy [y轴放大值]
     * @param  {[type]} dz [z轴放大值]
     * @return {[type]}    [description]
     */
    var scaleByValue = function (dx,dy,dz){
        earth.ToolManager.SphericalObjectEditTool.ScaleSelectObject(dx,dy,dz);
        updateSelectedObject();
    };

    /**
     * 建筑方位调整
     * @param  {[type]} roY [y轴旋转值]
     * @return {[type]}     [description]
     */
    var editProgrammeValue = function (roY){
    	earth.ToolManager.SphericalObjectEditTool.RotateSelectObject(0,roY,0);
    	updateSelectedObject();
    }

    /**
     * 贴地
     * @return {[type]} [description]
     */
    var alignGround = function (){
        var isSelected = false;//先选择对象再点“贴地”
        if(earth.SelectSet.GetCount() == 0){//未选择对象
            isSelected = false;
        }else{
            isSelected = true;//先点“贴地”再去选择对象
        }

        if(isSelected){//已选择对象
            earth.ToolManager.SphericalObjectEditTool.AlignGround();
            if(earth.SelectSet.GetCount() <= 0){//选择对象为空
	            earth.SelectSet.UnLockSelectSet();//解锁选择集
	            return;
	        }
            //循环遍历更新数据库对象
            updateSelectedObject();
        }else{//未选择对象
            earth.Event.OnSelectChanged = function(){
                earth.Event.OnSelectChanged=function(){};
                earth.ToolManager.SphericalObjectEditTool.AlignGround();
                if(earth.SelectSet.GetCount() <= 0){//选择对象为空
                    earth.SelectSet.UnLockSelectSet();//解锁选择集
                    return;
                }
                //循环遍历更新数据库对象
                updateSelectedObject();
            };
            earth.ToolManager.SphericalObjectEditTool.AlignGround();
        }
    };

    /**
     * 清除菜单选中状态
     * @return {[type]} [description]
     */
    var clearMenuStyle = function(){
        if(lastBalloonId){
            Tools.singleStyleCancel(lastBalloonId);
            lastBalloonId = null;
        }
    }

    /**
     * 弹出气泡（编辑工具栏的）
     * @param type 气泡类型
     * @param editLayers 编辑图层集合
     */
    var showMoveHtml = function(type, editLayers){
        var flag = Tools.toolBarItemClickStyle(type);
        if(!flag){
            if(htmlBalloonMove){
                htmlBalloonMove.DestroyObject();
                htmlBalloonMove = null;
            }
            lastBalloonId = null;
            return;
        }else {
            Tools.singleStyleCancel(lastBalloonId);
            lastBalloonId = type;
        }
        earth.Event.OnHtmlNavigateCompleted = function (){};
        var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/"));
        var url = "";
        var title="";
        var width = 272;
        var height = 257;
        if(type==="beginDig"){//平整开挖
            height=150;
            url=loaclUrl+"/html/project/beginDig.html?nodeParcle="+Vcts3;
            title="平整开挖";
        }else if(type==="divChangeHeight"){//方案高程
            height=143;
            url=loaclUrl+"/html/project/changeHeight.html";
            title="方案高程";
        }else if(type === "editPosition"){//位置调整
            url = loaclUrl + "/html/project/editPosition.html?action=move";
            title="位置调整";
        }else if(type==="editProgramme"){//方位调整
            height=173;
            url=loaclUrl+"/html/project/editProgramme.html";
            title="高程调整";
        }else if(type==="editFloor"){//楼高调整
        	height=355;
        	url=loaclUrl+"/html/project/editFloor.html";
        	title="楼高调整";
        }else if(type==="editBasal"){//基底调整
        	height=307;
        	url=loaclUrl+"/html/project/editBasal.html";
        	title="基底调整";
        }else if(type==="approveTag"){//审批纪要
            width = 521;
            height = 415;
            url = loaclUrl+"/html/analysis/approveTag.html";
            title="审批纪要";
        }else{
            return;
        }

        if (htmlBalloonMove != null){
            htmlBalloonMove.DestroyObject();
            htmlBalloonMove = null;
        }
        htmlBalloonMove = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGuid(), title);
        htmlBalloonMove.SetScreenLocation(width/2 + (top.dialogLeft?top.dialogLeft:86),0);
        htmlBalloonMove.SetRectSize(width,height);
        htmlBalloonMove.SetIsAddBackgroundImage(false);
        htmlBalloonMove.ShowNavigate(url);

        //气泡关闭事件
        earth.Event.OnHtmlBalloonFinished = function(id){
            if (htmlBalloonMove != null && id===htmlBalloonMove.Guid){
                clearMenuStyle();
                htmlBalloonMove.DestroyObject();
                htmlBalloonMove = null;
                earth.Event.OnPoseChanged = function(){};
                earth.Event.OnHtmlBalloonFinished = function(){};
            }
        };

        //页面加载完成事件
        earth.Event.OnDocumentReadyCompleted = function(guid){
            earth.htmlBallon = htmlBalloonMove;
            earth.editTool = editTool;
            earth.CoordinateTransform = CoordinateTransform;
            earth.projManager = projManager;
            earth.projNodeId = projNodeId;
            earth.curPlanId = top.currentPlanLayerId;
            if(title == "审批纪要") {
                earth.finishApprove = top.getOperatorObject().finishApprove;
                earth.Tools = Tools;
            }
            earth.setSelectStatus = setSelectStatus;//位置和方位调整用到-重新选取状态
            if(htmlBalloonMove === null){
                return;
            }
            if(htmlBalloonMove.Guid == guid){
                htmlBalloonMove.InvokeScript("getEarth", earth);
                htmlBalloonMove.InvokeScript("getEditLayers", editLayers);
            }
        }
    };

    /**
     * 清除气泡
     * @param htmlBall 气泡对象
     * @return 无
     */
    var clearHtmlBallon = function(htmlBall){
        if (htmlBall != null){
            htmlBall.DestroyObject();
            htmlBall = null;
        }
        if(htmlBalloonMove!= null){
            htmlBalloonMove.DestroyObject();
            htmlBalloonMove = null;
        }
        clearMenuStyle();
    };

    editTool.clearMenuStyle = clearMenuStyle;
    editTool.showMoveHtml = showMoveHtml;
    editTool.clearHtmlBallon=clearHtmlBallon;
    editTool.browse = browse;
    editTool.select = select;
    editTool.editPosition = editPosition;
    editTool.rotate = rotate;
    editTool.scale = scale;
    editTool.removeObj=removeObj;
    editTool.textureEdit=textureEdit;
    editTool.moveByValue = moveByValue;
    editTool.rotateByValue = rotateByValue;
    editTool.scaleByValue = scaleByValue;
    editTool.alignGround = alignGround;
    editTool.updateChangeObject = updateChangeObject;
    editTool.updateSelectedObject = updateSelectedObject;
	editTool.editProgramme = editProgramme;
    editTool.editProgrammeValue = editProgrammeValue;
	editTool.editFloor = editFloor;
	editTool.editBasal = editBasal;
    return editTool;
};