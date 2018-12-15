/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：方案审批面板
 * 注意事项：该文件方法仅为方案审批使用
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/
var params = "";
var earth = "";
var projManager = "";
function getEarth(earthObj){
    earth = earthObj;
    params = earth.param;
    projManager = earth.projManager;
    var selectedNodeId = params.nodeId;
    if (selectedNodeId) {
        if(params.type==="PARCEL"){
            $("#roadLineTab").hide();
            var planData = projManager.getProjectData({id:selectedNodeId});
            if (planData.length == 1) {
                $("#XMMC").text(planData[0]["CPPROJECT.NAME"] || "");//方案名称
                $("#YDMC").text(planData[0]["CPPROJECT.YDNAME"] || "");//设计单位
                $("#QSDW").text(planData[0]["CPPROJECT.QSDW"] || "");//设计单位
                $("#YDXZ").text(planData[0]["CPPROJECT.YDXZ"] || "");//设计单位
                $("#YDMJ").text(planData[0]["CPPROJECT.YDMJ"] || "");//设计单位
                $("#JZMD").text(planData[0]["CPPROJECT.JZMD"] || "");//设计单位
                $("#RJL").text(planData[0]["CPPROJECT.RJL"] || "");//设计单位
                $("#LDL").text(planData[0]["CPPROJECT.LDL"] || "");//设计单位
                $("#JZXG").text(planData[0]["CPPROJECT.JZXG"] || "");//设计单位
            }
        }else{
            $("#parcelTab").hide();
            var roadLineData=projManager.getRoadLineData(selectedNodeId);
            $.each(roadLineData, function (i, roadLine) {
                var trHtml="";
                trHtml+="<tr bgcolor='#F4FAFF'>";
                trHtml+="<td>"+roadLine["CPROADLINE.CODE"]+"</td>";
                trHtml+="<td>"+roadLine["CPROADLINE.DISTANCE"]+"</td>";
                trHtml+="<td align='center'>米</td>";
                $("#roadLineTab").append(trHtml);
            });
        }

    } else {
        alert("请选中方案树中的一个节点")
        return;
    }
}