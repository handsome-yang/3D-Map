/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：方案指标
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
var params = null;
var earth = null;
var projManager = null;
var curYdName = "";
function getEarth(earthObj){
    earth = earthObj;
    params = earth.param;
    projManager = earth.projManager;
    var projectId = params.nodeId;
    var planId = params.planId;
    if (projectId == undefined || projectId == "") {
        alert("请选中方案节点")
        return;
    }
    if(params.type==="PLAN"){
        var ydNameArr = projManager.getYongDiArray(projectId);
        if(ydNameArr && ydNameArr.length > 0){
            for(var i = 0; i < ydNameArr.length; i++){
                $("#yongDiName").append('<option value="' + ydNameArr[i] + '">' + ydNameArr[i] + '</option>');
            }
            curYdName = ydNameArr[0];    
            setProjectIndex(projectId, curYdName);
            setPlanIndex(planId, curYdName);
        }
    }
    // 用地名称
    $("#yongDiName").change(function(){
        curYdName = $(this).find('option:selected').text();
        setProjectIndex(projectId, curYdName);
        setPlanIndex(planId, curYdName);
    });

    //设置方案指标值
    function setPlanIndex(planId, ydName){
        var planData=projManager.getPlanById(planId);
        var curPlanData = null;
        for(var i = 0; i < planData.length; i++){
            if(planData[i]["CPPLAN.YDNAME"] == ydName){
                curPlanData = planData[i];
                break;
            }
        }
        var buildingData=projManager.getBuildingDataByPlanId(planId, ydName);
        var buildingXianGao=0;
        $.each(buildingData, function (i, building) {
            var temp=parseFloat(building["CPBUILDING.JZGD"]).toFixed(2);
            if(temp > buildingXianGao){
                buildingXianGao = temp;
            }
        });
        var simpleBuildData = projManager.getSimpleBuildingDataByPlanId(planId, ydName);
        $.each(simpleBuildData, function (i, building) {
            var temp = (parseFloat(building["CPSIMPLEBUILD.FLOORHIGHT"]) * parseFloat(building["CPSIMPLEBUILD.FLOOR"])).toFixed(2);
            if(temp > buildingXianGao){
                buildingXianGao = temp;
            }
        });
        if(curPlanData){
            $("#YDMJ").text((curPlanData["CPPLAN.GHZYD"])?parseFloat(curPlanData["CPPLAN.GHZYD"]).toFixed(2):"");
            if( parseFloat( $("#YDMJ2").text() ) < parseFloat( curPlanData["CPPLAN.GHZYD"] ) ){
                $("#YDMJ").addClass("redColor");
            }else{
                $("#YDMJ").removeClass("redColor");
            }
            
            $("#JZMD").text((curPlanData["CPPLAN.JZMD"])?parseFloat(curPlanData["CPPLAN.JZMD"]).toFixed(2):"");
            if( parseFloat( $("#JZMD2").text() ) < parseFloat( curPlanData["CPPLAN.JZMD"] ) ){
                $("#JZMD").addClass("redColor");
            }else{
                $("#JZMD").removeClass("redColor");
            }

            $("#RJL").text((curPlanData["CPPLAN.RJL"])?parseFloat(curPlanData["CPPLAN.RJL"]).toFixed(2):"");
            if( parseFloat( $("#RJL2").text() ) < parseFloat( curPlanData["CPPLAN.RJL"] ) ){
                $("#RJL").addClass("redColor");
            }else{
                $("#RJL").removeClass("redColor");
            }

            $("#LDL").text((curPlanData["CPPLAN.LDL"])?parseFloat(curPlanData["CPPLAN.LDL"]).toFixed(2):"");
            if( parseFloat( $("#LDL2").text() ) < parseFloat( curPlanData["CPPLAN.LDL"] ) ){
                $("#LDL").addClass("redColor");
            }else{
                $("#LDL").removeClass("redColor");
            }

            $("#JZXG").text(buildingXianGao || "");
            if( parseFloat( $("#JZXG2").text() ) < parseFloat(buildingXianGao) ){
                $("#JZXG").addClass("redColor");
            }else{
                $("#JZXG").removeClass("redColor");
            }
        }
    }

    //设置用地控制指标值
    function setProjectIndex(projectId, ydName){
        var projData = projManager.getProjectData({id:projectId, YDNAME: ydName});
        if(projData && projData.length > 0){
            $("#YDMJ2").text(projData[0]["CPPROJECT.YDMJ"]?parseFloat(projData[0]["CPPROJECT.YDMJ"]).toFixed(2):"");//设计单位
            $("#JZMD2").text(projData[0]["CPPROJECT.JZMD"]?parseFloat(projData[0]["CPPROJECT.JZMD"]).toFixed(2):"");//设计单位
            $("#RJL2").text(projData[0]["CPPROJECT.RJL"]?parseFloat(projData[0]["CPPROJECT.RJL"]).toFixed(2):"");//设计单位
            $("#LDL2").text(projData[0]["CPPROJECT.LDL"]?parseFloat(projData[0]["CPPROJECT.LDL"]).toFixed(2):"");//设计单位
            $("#JZXG2").text(projData[0]["CPPROJECT.JZXG"]?parseFloat(projData[0]["CPPROJECT.JZXG"]).toFixed(2):"");//设计单位
        }
    }
}