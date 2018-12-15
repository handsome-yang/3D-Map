/**
 * 作    者：StampGIS Team
 * 创建日期：2017年8月14日
 * 描    述：方案高程调整
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月10日
 */

var earth;//三维球对象
var projManager;//项目方案管理工具对象
var editTool ;//编辑工具对象
var projectIds = null;//当前项目ID
var editLayers;//编辑图层集合

/*
 *外部传参
 *@param earthObj 参数对象
 *@return 无
 */
function getEarth(earthObj){
    earth=earthObj;
    projManager=earth.projManager;
    editTool= earth.editTool;
    if(top.selNode_id){//当前项目ID
        projectIds = top.selNode_id;
    }
    if(earth.lastPlanHeight){//上一次方案高程不为空
        document.getElementById("heightValue").value = earth.lastPlanHeight;
    }else{//上一次方案高程为空,默认给0
        earth.lastPlanHeight = 0;
    }
}

/*
 * 获取编辑图层集合
 * @param editLayerMap 编辑图层集合
 * @return 无
 */
function getEditLayers(editLayerMap){
    editLayers = editLayerMap;
}

$(function () {
    var originHeight = Number(document.getElementById("heightValue").value);

    //确定按钮点击事件
    $("#btnAction").click(function(){
        var layerIds=[];
        var heightValue = $("#heightValue").val();
        if(isNaN(heightValue)){
            alert("请输入数字!");
            return;
        }
        var delta = Number(heightValue) - Number(earth.lastPlanHeight?earth.lastPlanHeight:0);
        earth.lastPlanHeight = heightValue;

        //获取方案信息
        var planData = projManager.getPlanData(projectIds);
        if (planData.length) {//循环获取所有的方案图层
            $.each(planData, function (k, pData) {
                var planLayers = projManager.getLayerIdsByPlanId(pData["CPPLAN.ID"]);
                layerIds = layerIds.concat(planLayers);
            });
        }

        if(layerIds){//修改高度
            projManager.changeHeight(delta,layerIds,editLayers);
        }
    });

    //退出按钮点击事件
    $("#clear").click(function(){
        editTool.clearHtmlBallon(earth.htmlBallon);
    });

    //高度调整输入改变事件
    $("#heightValue").change( function(){
        if(isNaN($("#heightValue").val())){
            alert("高度输入不正确");
            $("#btnAction").attr("disabled",true);
        }
        else{
            $("#btnAction").attr("disabled",false);;
        }
    });

    //触发修改
    $("#heightValue").trigger("change");
});