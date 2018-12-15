/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月14日
 * 描    述：基底调整
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */

var earth = null;//全局对象-三维球
var editTool = null;//全局对象-编辑工具
var projManager = null;//全局对象-方案管理接口
var coordinateTransform = null;//全局对象-坐标转换对象
var buildId = null;//全局变量-选中模型在数据库中的guid
var floorCount = 0;//全局变量-选中模型的楼层数
var model = null;//全局变量-选中模型对象
var curPlanId = null;//全局变量-当前方案的ID

/*
 * 获取外部传入的参数对象
 * @param earthObj 外部传入参数对象
 * @return 无
 */
function getEarth(earthObj){
    //初始化变量-外部传入参数赋值
    earth = earthObj;
    editTool = earth.editTool;
    projManager = earth.projManager;
    curPlanId = earth.curPlanId;
    coordinateTransform = earth.CoordinateTransform;

    //当前编辑方案ID必须有值
    if(curPlanId == undefined || curPlanId == ""){
        alert("请选择方案，并启用方案编辑状态");
        return;
    }

    //注册模型选择改变事件
    earth.Event.OnSelectChanged = function(){
        if(earth.SelectSet.GetCount() > 1){//选中多个对象
           alert("请选择单个建筑！");
           earth.SelectSet.Clear();
           //开启选取，支持点选和框选，按住ctrl可多选
           earth.ToolManager.SphericalObjectEditTool.Select();
        }else if(earth.SelectSet.GetCount() == 1){//选中一个对象
            model = earth.SelectSet.GetObject(0);
            if(model.Rtti == 280 || model.Rtti == 207){//280：简单建筑；207：矢量楼块
                //选中建筑模型时获取该模型的基本信息
                getModelInfo(model);
            }else{
                alert("您选择的不是建筑模型！");
                earth.SelectSet.Clear();
                earth.ToolManager.SphericalObjectEditTool.Select();
            }
        }
    };
    
    //初始化显示选中模型的基本信息和方案信息
    if(earth.SelectSet.GetCount() == 1){//选中一个对象
       model = earth.SelectSet.GetObject(0);
       if (model){
            //选中建筑模型时获取该模型的基本信息
            getModelInfo(model);
       }
    }else{//未选取任何模型
        buildId = "";
    }

    /*
     * 获取选中模型的基本信息，并计算显示方案信息
     * @param model 选中模型对象
     * @return 无
     */
    function getModelInfo(model){
        var jzModel = projManager.getModelByParamModel(model, curPlanId);
        if(jzModel == null){//jzModel返回为NULL，则说明是简单建筑或矢量楼块
            buildId = model.Guid;
            var buildingData = projManager.getSimpleBuildingDataById(buildId);
            if(buildingData && buildingData.length == 1){
                floorCount = parseInt(buildingData[0]["CPSIMPLEBUILD.FLOOR"]);    
            }
            modelType = "CPSimpleBuild";
        }else{//说明修改的是3DMax模型
            buildId = jzModel.Guid;
            var buildingData = projManager.getBuildingDataById(buildId);
            if(buildingData && buildingData.length == 1){
                floorCount = parseInt(buildingData[0]["CPBUILDING.JZCS"]);    
            }
            
            modelType = "CPBuilding";
        }
        //为方案指标赋值
        var planInfo = projManager.getTotalPlanIndex(curPlanId);
        $("#RJL").val(parseFloat(planInfo.RJL).toFixed(2));
        $("#JZMD").val((parseFloat(planInfo.JZMD) * 100).toFixed(2));
    }
    
    //调整基地-确定按钮点击事件
    $("#btnAction").click(function(){
    	var rate = $("#floorProportion").val();
        if(isNaN(rate)){
            alert("基底比例必须为数字!");
            return;
        }
       	if(Number(rate) < 0 || Number(rate) == 0){
        	alert("基底比例必须大于0!");
        	return;
        }
       	
        if(earth.SelectSet.GetCount() > 1){//选中多个模型对象时
            alert("请选择单个建筑！");
        }else if(earth.SelectSet.GetCount() == 1){//选中一个模型对象时
            var model = earth.SelectSet.GetObject(0);
            //调整选中模型基底比例
            earth.ToolManager.SphericalObjectEditTool.ScaleSelectObject(rate,1,rate);
            //更新数据库信息
            updateBasial(model, curPlanId);
        }else{//未选中模型对象时
            alert("请选择要编辑的建筑");
        }
    });

    /*
     *调整基底面
     *@param model 选中模型对象
     *@param curPlanId 当前方案ID
     *@return 无
     */
    function updateBasial(model, curPlanId){
        if(curPlanId == undefined || curPlanId == ""){
            alert("当前编辑方案ID为空");
            return;
        }
        var buildArea = 0;
        var polygon = model.GetPolygon(1);//1代表单位度，0代表平面坐标米
        var vecs = polygon.GetRingAt(0);//获取第一个面坐标

        //坐标转换
        var geopoints = earth.Factory.CreateGeoPoints();
        for(var i = 0; i < vecs.Count; i++){
            var vec = coordinateTransform.sysDatum.des_BLH_to_src_xy(vecs.Items(i).x, vecs.Items(i).y, vecs.Items(i).z);
            geopoints.Add(vec.X, vec.Y, vec.Z);
        }

        //通过转换后的平面坐标串-获取底面面积
        buildArea = earth.GeometryAlgorithm.CalculatePolygonArea(geopoints);

        //创建数据库对象
        var info = earth.Factory.CreateDbEleInfo(model.Guid, model.Name);
        info.SphericalVectors.Add(vecs);
        if(model.Rtti == 280){//简单建筑
            info.Height = model.GetFloorsCount() * model.GetFloorHeight() + model.GetRoofHeight();
            info.FloorHeight = model.GetFloorHeight();
            info.RoofType = model.GetRoofType();
        }else{//矢量楼块
            info.Height = model.Height;
        }
        info.SphericalTransform.SetLocation(model.SphericalTransform.GetLocation());
        info.SphericalTransform.SetRotation(model.SphericalTransform.GetRotation());
        info.SphericalTransform.SetScale(model.SphericalTransform.GetScale());
        //更新数据库对象
        earth.DatabaseManager.UpdateElementParam(STAMP_config.server.dataServerIP, model.GetParentNode().Guid, model.MeshID, info);
        earth.Event.OnEditDatabaseFinished = function(pRes, pLayer){
            if(pRes.ExcuteType == 25 && pRes.ErrorExcuteType == 25){
                var isSuccess = false;
                if(modelType == "CPSimpleBuild"){//简单建筑和矢量楼块-共用的同一个数据库表
                    isSuccess = projManager.updateSimpleBuildBasial(buildId, buildArea, floorCount * buildArea);
                }else{//3DMax模型
                    isSuccess = projManager.updateBuildingBasial(buildId, buildArea, floorCount * buildArea);
                }
                if(isSuccess){
                    //更新方案指标数据
                    projManager.updatePlanIndex(curPlanId);   
                    //获取方案指标-容积率和建筑密度
                    var planInfo = projManager.getTotalPlanIndex(curPlanId);
                    $("#RJL").val(parseFloat(planInfo.RJL).toFixed(2));
                    $("#JZMD").val((parseFloat(planInfo.JZMD) * 100).toFixed(2));     
                }
            }else{
                alert("更新模型参数失败");
            }
        }
    }

    //注册顶点编辑、增加、删除之后的完成事件
    function onEditFinished(){
        updateBasial(model, curPlanId);
        setTimeout(function(){//保证编辑结束后再保持对象的选取状态，防止又要用户去重新点击“基底调整”菜单来选择对象
            earth.SelectSet.Add(model.Guid);
            earth.ToolManager.SphericalObjectEditTool.Select();
            earth.Event.OnEditFinished = function(){};
        }, 100);
    }
    
    //关闭按钮事件
    $("#clear").click(function(){
        editTool.clearHtmlBallon(earth.htmlBallon);
        earth.SelectSet.UnLockSelectSet();
        earth.ToolManager.SphericalObjectEditTool.Browse();
        editTool.clearMenuStyle();
    });
    
    //页面卸载
    $(window).unload(function () {
        earth.SelectSet.UnLockSelectSet();
        earth.ToolManager.SphericalObjectEditTool.Browse();
        editTool.clearMenuStyle();
        if(curPlanId){//恢复到3DMax模型状态
            projManager.showParamModel(curPlanId, false);    
        }
    });

    //移动顶点
    $("#editPoint").click(function(){
        earth.Event.OnControlPointValueChanged = function() {
            onEditFinished();
        }
        earth.ToolManager.ElementEditTool.ShapeEdit();
    });
    
    //添加顶点
    $("#addPoint").click(function(){
        earth.Event.OnGeometryInsertPoint = function() {
            onEditFinished();
        }
        earth.ToolManager.ElementEditTool.InsertPoint();
    });

    //删除顶点
    $("#deletePoint").click(function(){
        earth.Event.OnGeometryDeletePoint = function(v1) {
            earth.ToolManager.ElementEditTool.DeleteSelectedPoint(); //删除选择点
            onEditFinished();
        };
        earth.ToolManager.ElementEditTool.DeletePoint(); //选择删除点
    });
}
