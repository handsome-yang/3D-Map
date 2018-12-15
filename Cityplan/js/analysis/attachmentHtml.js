/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：项目附件(节点操作)
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月14日
 *****************************************************************/
$(function () {
    jQuery.support.cors = true; //开启jQuery跨域支持
    var earth = top.earth;
    var projManager = top.projManager;

    var attachment = STAMP.Attachment(earth);
    //返回当前审批项目的项目id
    var proId = top.projNodeId;
    //根据项目id获取方案信息
    var proData = projManager.getPlanData(proId);
    var folderIcon = "../../images/treeIcons/folder.png";
    var nodeIcon = "../../images/treeIcons/附件.png";
    //查看全部附件
    var nodes = {id:1, pId:0, name:"项目",open:true,isParent:true, icon:folderIcon};
    var proNodes =[];
    proNodes.push({id:proId,name:"项目附件",pId:1,open:true,isParent:true, icon:folderIcon});
    nodes.children =  proNodes;
    var len = proNodes.length;
    attachment.searchAttachment2(proNodes, len, nodes, $("#planTree"));

    var planNodes = [];
    var allPlanId = [];
    var planIndex = 0;

    $.each(proData,function(i,node){
        var len = proData.length;
        if($.inArray(node["CPPLAN.ID"], allPlanId) == -1){
            allPlanId.push(node["CPPLAN.ID"]); 
            planNodes.push({id:"fangan",name:node["CPPLAN.NAME"],pId:1,open:true,isParent:true, icon:folderIcon});
            planNodes[planIndex].children=[];
            planNodes[planIndex].children.push({id:node["CPPLAN.ID"],name:"方案附件",pId:"fangan",open:true,isParent:true, icon:folderIcon});

            nodes.children.push(planNodes[planIndex]);
            len = planNodes[planIndex].children.length;
            attachment.searchAttachment2(planNodes[planIndex].children, len, nodes, $("#planTree"));

            var buildNode = {id:"jianzhu", pId:1, name:"建筑附件",open:true,isParent:true, icon:folderIcon};
            planNodes[planIndex].children.push(buildNode);
            attachment.searchBuildAttachments2(buildNode, nodes, [allPlanId[allPlanId.length-1]], $("#planTree"));       
            planIndex++;
        }
    });
});