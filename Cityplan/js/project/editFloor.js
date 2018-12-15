/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月14日
 * 描    述：楼高调整
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */
var earth = null;//三维球对象
var editTool = null;//编辑工具对象
var editLayers = null;//编辑图层集合
var originHeight = 0; //方案建筑在数据库中入库的楼高
var projManager = null;//项目方案管理工具对象
var buildId = null;//编辑的建筑ID
var model = null;//编辑的模型对象
var curPlanId = null;//当前方案ID
var modelType = "";//模型类型
var buildArea = 0;//建筑底面面积

/*
 * 获取外部传入的参数对象-外部触发
 * @param earthObj 外部传入参数对象
 * @return 无
 */
function getEarth(earthObj){
    //赋值
    earth = earthObj;
    editTool = earth.editTool;
    projManager = earth.projManager;
    curPlanId = earth.curPlanId;

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
    if(earth.SelectSet.GetCount() == 1){
       model = earth.SelectSet.GetObject(0);
       if (model){
       		//选中建筑模型时获取该模型的CPBUILDINGID
            getModelInfo(model);
       }
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
            var height = 0;
            var floorCount = 0; 
            if(buildingData.length >= 1){
                height = parseInt(buildingData[0]["CPSIMPLEBUILD.FLOOR"]) * parseFloat(buildingData[0]["CPSIMPLEBUILD.FLOORHIGHT"]);
                floorCount = parseInt(buildingData[0]["CPSIMPLEBUILD.FLOOR"]);
                buildArea = parseFloat(buildingData[0]["CPSIMPLEBUILD.BASEAREA"]);
            }
            modelType = "CPSimpleBuild";
        }else{//说明修改的是3DMax模型
            buildId = jzModel.Guid;
            var buildingData = projManager.getBuildingDataById(buildId);
            var height = 0;
            var floorCount = 0;
            if(buildingData.length >= 1){
                height = parseFloat(buildingData[0]["CPBUILDING.JZGD"]);
                floorCount = parseInt(buildingData[0]["CPBUILDING.JZCS"]);
                buildArea = parseFloat(buildingData[0]["CPBUILDING.JZJDMJ"]);
            }
            modelType = "CPBuilding";
        }
        originHeight = height;

        //为方案指标赋值
        var planInfo = projManager.getTotalPlanIndex(curPlanId);
        $("#RJL").val(parseFloat(planInfo.RJL).toFixed(2));
        $("#JZMD").val((parseFloat(planInfo.JZMD) * 100).toFixed(2));
        $("#buildingHeight").val(parseFloat(height).toFixed(2));
        $("#floorHeight").val((parseFloat(height)/parseInt(floorCount)).toFixed(2));
        $("#floorCount").val(floorCount);
    }
    
    //确定按钮点击事件
    $("#btnAction").click(function(){
        //当前编辑方案ID不能为空
        if(curPlanId == undefined || curPlanId == ""){
            alert("当前编辑方案ID为空");
            return;
        }
        var floorHeight = $("#floorHeight").val();
        var floorCount = $("#floorCount").val();
        var buildingHeight = $("#buildingHeight").val();
        if(isNaN(floorHeight)){
            alert("请输入数字!");
            return;
        }
        if(isNaN(floorCount)){
            alert("请输入数字!");
            return;
        }
        if(isNaN(buildingHeight)){
            alert("请输入数字!");
            return;
        }
        floorCount = parseInt(floorCount);
        floorHeight = parseFloat(floorHeight);
        buildingHeight = parseFloat(buildingHeight);
        if(earth.SelectSet.GetCount() > 1){//选中多个建筑
            alert("请选择单个建筑！");
        }else if(earth.SelectSet.GetCount() == 1){//选中一个建筑
            var model = earth.SelectSet.GetObject(0);
            var info = earth.Factory.CreateDbEleInfo(model.Guid, model.Name);
            var polygon = model.GetPolygon(1);//1：单位为度
            var vecs = polygon.GetRingAt(0);//获取第一个
            info.SphericalVectors.Add(vecs);
            if(model.Rtti == 280){//简单建筑
                model.BeginUpdate();
                model.SetFloorsHeight(buildingHeight);
                model.SetFloorHeight(floorHeight);
                model.EndUpdate();

                info.Height = buildingHeight;
                info.FloorHeight = model.GetFloorHeight();
                info.RoofType = model.GetRoofType();
            }else{//矢量楼块
                model.BeginUpdate();
                model.Height = buildingHeight;
                model.EndUpdate();

                info.Height = buildingHeight;
            }
            info.SphericalTransform.SetLocation(model.SphericalTransform.GetLocation());
            info.SphericalTransform.SetRotation(model.SphericalTransform.GetRotation());
            info.SphericalTransform.SetScale(model.SphericalTransform.GetScale());
            //更新数据库对象
            earth.DatabaseManager.UpdateElementParam(STAMP_config.server.dataServerIP, model.GetParentNode().Guid, model.MeshID, info);
            earth.Event.OnEditDatabaseFinished = function(pRes, pLayer){
                if(pRes.ExcuteType == 25 && pRes.ErrorExcuteType == 25){
                    var isSuccess = false;
                    if(modelType == "CPSimpleBuild"){
                        isSuccess = projManager.updateSimpleBuildHeight(buildId, floorHeight, floorCount, buildArea * floorCount);    
                    }else{
                        isSuccess = projManager.updateBuildHeight(buildId, buildingHeight, floorCount, buildArea * floorCount);
                    }
                    if(isSuccess){
                        projManager.updatePlanIndex(curPlanId);    
                        var planInfo = projManager.getTotalPlanIndex(curPlanId);
                        $("#RJL").val(parseFloat(planInfo.RJL).toFixed(2));
                        $("#JZMD").val((parseFloat(planInfo.JZMD) * 100).toFixed(2));
                    }
                }else{
                    alert("更新模型参数失败");
                }
            }
        }else{
            alert("请选择建筑参数模型");
        }
    });
    
    //关闭按钮点击事件
    $("#clear").click(function(){
        editTool.clearHtmlBallon(earth.htmlBallon);
        earth.SelectSet.UnLockSelectSet();
        earth.ToolManager.SphericalObjectEditTool.Browse();
        editTool.clearMenuStyle();
    });
    
    //建筑高度输入框修改事件
    $("#buildingHeight").blur(function(){
        if(isNaN($("#buildingHeight").val())){
            alert("楼层高度必须为数字!");
            $("#btnAction").attr("disabled",true);
            return;
        }
        else{
            $("#btnAction").attr("disabled",false);
        }
        $("#floorHeight").val((parseFloat($("#buildingHeight").val())/parseInt($("#floorCount").val())).toFixed(2));
    });
    //默认触发修改
    $("#buildingHeight").trigger("blur");

    //楼层高度输入框修改事件
    $("#floorHeight").blur( function(){
        if(isNaN($("#floorHeight").val())){
            alert("楼层高度必须为数字!");
            $("#btnAction").attr("disabled",true);
            return;
        }
        else{
            $("#btnAction").attr("disabled",false);
        }
        $("#buildingHeight").val((parseFloat($("#floorHeight").val()) * parseInt($("#floorCount").val())).toFixed(2));
    });
    //默认触发修改
    $("#floorHeight").trigger("blur");

    //楼层数量输入框修改事件
    $("#floorCount").blur( function(){
        if(isNaN($("#floorCount").val()) || Math.floor($("#floorCount").val()) != $("#floorCount").val()){
            alert("楼层数必须为一个整数!");
            $("#btnAction").attr("disabled",true);
            return;
        }
        else{
            $("#btnAction").attr("disabled",false);
        }
        $("#buildingHeight").val((parseFloat($("#floorHeight").val()) * parseInt($("#floorCount").val())).toFixed(2));
    });
    //默认触发修改
    $("#floorCount").trigger("blur");
    
    /*
     *获取编辑图层
     *@param editLayerMap 编辑图层集合
     *@return 无
     */
    function getEditLayers(editlayerMap){
        editLayers = editlayerMap;
    }

    //页面卸载事件
    $(window).unload(function () {
        earth.SelectSet.UnLockSelectSet();
        earth.ToolManager.SphericalObjectEditTool.Browse();
        editTool.clearMenuStyle();
        if(curPlanId){//恢复到3DMax模型状态
            projManager.showParamModel(curPlanId, false);    
        }
    });
}