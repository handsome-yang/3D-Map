/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月14日
 * 描    述：方案比选
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2018年03月26日
 *****************************************************************/
var fullScreenStatus = false;//是否全屏
$(function() {
    var earth = top.LayerManagement.earth;
    var projManager = top.projManager;
    var tree = null;
    var bMultiple = false; // 当前是否是多屏显示状态
    var bSync = false; // 当前是否联动
    var bShowIndex = false; // 当前是否显示指标信息窗口
    var planLayerId; // 主球上的方案ID
    var planLayer = {};
    var layerStatus = {};
    var isShowCurrentObj = false;//是否显示现状图层
    document.oncontextmenu = function() { //右键屏蔽方法
        event.returnValue = false;
    }
    function init(){
        //先记录图层的显示状态 当该页面关闭时候 再还原图层的显示状态
        var planLayerIDs = projManager.getPlanLayerIDs();
        if(planLayerIDs){
            for(var layerID in planLayerIDs){
                var layerAry = planLayerIDs[layerID];
                if($.isArray(layerAry)){
                    //方案ID---对应的图层ID
                    planLayer[layerID] = layerAry;
                    var isPlanShow = false;
                    if(top.editLayers[layerAry[0]]){
                        isPlanShow = top.editLayers[layerAry[0]].Visibility;
                    }
                    layerStatus[layerID] = isPlanShow;
                }
            }
        }
        if(top.editLayers){
            for (var guid in top.editLayers) {
                var isShow = top.editLayers[guid].Visibility;
                layerStatus[guid] = isShow;
            };
        }

        if(projManager.currentApproveProjectGuid && projManager.getCurrentLayerObjList() && projManager.getCurrentLayerObjList()[projManager.currentApproveProjectGuid]){
            //关闭所有方案的显示
            projManager.showAll(projManager.currentApproveProjectGuid, "all", false, true, true, true, true);
            //关闭现状图层的显示
            var eList = projManager.getCurrentLayerObjList()[projManager.currentApproveProjectGuid];
            if (eList) {
                var count = eList.length;
                for (var j = 0; j < count; j++) {
                    var obj = eList[j];
                    obj.Visibility = false;
                }
            }
        }

        //没有现状图层，从树上取状态
        var zTree = top.getOperatorObject().$.fn.zTree.getZTreeObj("appTree");
        var cn = zTree.getNodeByParam("type", "OLD");
        if(cn){
            isShowCurrentObj = cn.checked;
        }else{
            isShowCurrentObj = false;
        }
    }

    //复选框状态控制
    $("#doubleScreen").click(function() {
        $("#threeScreen").removeAttr("checked");
        $("#doubleScreen").attr("checked", "checked");
        chkboxToButton(2);
    });

    //三屏
    $("#threeScreen").click(function() {
        $("#doubleScreen").removeAttr("checked");
        $("#threeScreen").attr("checked", "checked");
        chkboxToButton(3);
    });

    //全屏按钮事件
    $("#btnFullScreen").click(function() {
		if(fullScreenStatus){
            $(this).text("全屏显示");
            top.fullScreenEarth(false);
            fullScreenStatus = false;
        }else{
            $(this).text("关闭全屏");
            top.fullScreenEarth(true);
            fullScreenStatus = true;
            top.focus();
        }
    });

    //checkbox改变时，根据当前树状态改变按钮状态
    var chkboxToButton = function(tag) {
        if (tag === 2) {
            if (nodesArr.length > 2) {
                var planTree = $.fn.zTree.getZTreeObj("planTree");
                nodesArr[0].checked = false;
                planTree.updateNode(nodesArr[0]);
                nodesArr.splice(0, 1);
                $("#btnCompare").removeAttr("disabled");
            } else if (nodesArr.length < 2) {
                $("#btnCompare").attr("disabled", "disabled");
            } else {
                $("#btnCompare").removeAttr("disabled");
            }
        }else if (tag === 3) {
            if (nodesArr.length < 3) {
                $("#btnCompare").attr("disabled", "disabled");
            }
        }
    }
    // 鼠标双击节点
    var onDblClickNode = function(event, treeId, node){
        if(node) {
            if(node.children) {
            } else {
                projManager.locateToLayer(node);
            }
        }
    }

    //xi项目树check事件
    var nodesArr = [];
    var onCheckTreeNode = function(event, treeId, node) {
        if (node.isParent) {
            return;
        }
        if (!bMultiple) { //单屏  分屏租了处理，这不需处理多屏情况
            var planTree = $.fn.zTree.getZTreeObj(treeId);
            if (node.checked === false) {
                for (var i = 0; i < nodesArr.length; i++) {
                    if (node.id === nodesArr[i].id) {
                        nodesArr.splice(i, 1);
                    }
                }
            } else {
                nodesArr.push(node);
            }

            if (($("#doubleScreen").attr("checked") == "checked" && nodesArr.length < 2) ||
                $("#threeScreen").attr("checked") == "checked" && nodesArr.length < 3) {
                $("#btnCompare").attr("disabled", "disabled");
                return;
            };
            if ($("#doubleScreen").attr("checked") == "checked") {
                if (nodesArr.length > 2) {
                    nodesArr[0].checked = false;
                    planTree.updateNode(nodesArr[0]);
                    nodesArr.splice(0, 1);
                }
                $("#btnCompare").removeAttr("disabled");
            } else if ($("#threeScreen").attr("checked") == "checked") {
                if (nodesArr.length > 3) {
                    nodesArr[0].checked = false;
                    planTree.updateNode(nodesArr[0]);
                    nodesArr.splice(0, 1);
                }
                $("#btnCompare").removeAttr("disabled");
            }
        }
    };
    // 初始化树
    var initPlanTree = function(treeData) {
        var setting = {
            check: {
                enable: true, //是否显示checkbox或radio
                chkStyle: "checkbox", //显示类型,可设置(checbox,radio)
                chkboxType: {
                    "Y": "ps",
                    "N": "ps"
                }
            },
            data: {
                simpleData: {
                    enable: true
                }
            },
            view: {
                dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
                expandSpeed: "fast", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
                selectedMulti: false //设置是否允许同时选中多个节点
            },
            callback: {
                onCheck: onCheckTreeNode,
                onDblClick: onDblClickNode
            }
        };
        tree = $.fn.zTree.init($("#planTree"), setting, treeData);
        tree.expandAll(true);
    };

    init();
    var planDataArr = [];
    var proId = top.projNodeId;
    if (!proId) {
        alert("请先在方案管理中选择要对比的方案");
        return;
    }
    var proData = projManager.getPlanData(proId);
    var nodes = {
        id: 1,
        pId: 0,
        name: "方案",
        open: true,
        nocheck: true,
        isParent: true,
        icon: "../../images/project/folder.png"
    };
    var planNodes = [];
    var planGuidArr = [];
    //该树的图层显示顺序 先显示方案的节点 最后再显示现状图层的节点
    $.each(proData, function(i, node) {
        if($.inArray(node["CPPLAN.ID"], planGuidArr) == -1){
            planGuidArr.push(node["CPPLAN.ID"]);
            planNodes.push({
                id: node["CPPLAN.ID"],
                name: node["CPPLAN.NAME"],
                pId: 1,
                type: "PLAN",
                icon: "../../images/project/plan.png"
            });
        }
        planDataArr.push({
            id: node["CPPLAN.ID"],
            plan: node
        });
    });
    var parcelLayerGuid2; //现状图层guid
    var projData = projManager.getProjectData({
        id: proId
    });
    if (projData && projData[0] && projData[0]["CPPROJECT.PARCELLAYERID"]) {
        parcelLayerGuid2 = projData[0]["CPPROJECT.PARCELLAYERID"];
        planNodes.push({
            id: parcelLayerGuid2,
            name: "现状",
            icon: "../../images/project/currentStatus.png"
        });
        top.parcelLayerGuid2 = parcelLayerGuid2;
    }
    nodes.children = planNodes;
    initPlanTree(nodes);

    //多屏比选
    $("#btnCompare").click(function() {
        if (bMultiple) {
            top.earthToolsBalloon.SetIsVisible(true);
            $("#btnCompare").attr("disabled", "disabled");
            $("#btnCompare").text("切换中...");
            top.setScreenShow("mMultipleScreen", "3d");
            top.setSync(bSync);
            bMultiple = false;
            bSync = false;

            $("#btnSync").text("多屏联动").attr("disabled", "disabled");
            $("#btnIndexCompare").attr("disabled", "disabled");
            $("#doubleScreen").removeAttr("disabled");
            $("#threeScreen").removeAttr("disabled");
            $(".blockMask").hide();
            bShowIndex = false;
            top.showIndex(bShowIndex, planDataArr);
            setTimeout(function(){
                $("#btnCompare").removeAttr("disabled");
                $("#btnCompare").text("多屏比选");
            }, 1000);
        } else {
            top.earthToolsBalloon.SetIsVisible(false);
            top.bMultiScreenState = false;
            $("#btnCompare").attr("disabled", "disabled");
            $("#btnCompare").text("切换中...");
            bMultiple = true;
            $("#btnSync").text("多屏联动").removeAttr("disabled");
            $("#btnIndexCompare").removeAttr("disabled");
            $("#doubleScreen").attr("disabled", "disabled");
            $("#threeScreen").attr("disabled", "disabled");

            var planTree = $.fn.zTree.getZTreeObj("planTree");
            var checkedNodes = planTree.getCheckedNodes();
            var planIdArr = [];
            for (var i = 0; i < checkedNodes.length; i++) {
                if (checkedNodes[i].isParent) {
                    continue;
                }
                if (i == 0){
                    planLayerId = checkedNodes[i].id;
                }
                planIdArr.push({
                    id: checkedNodes[i].id,
                    name: checkedNodes[i].name
                });
            }
            if (planIdArr.length == 2){
                top.setScreenShow("mMultipleScreen", "3d3d", planIdArr, projManager, proId);
            }else if (planIdArr.length == 3){
                top.setScreenShow("mMultipleScreen", "3d3d3d", planIdArr, projManager, proId);
            }
            top.setSync(false);
            //加一个遮罩层
            if($(".blockMask").length > 0){
                $(".blockMask").show();
            }else{
                var divObj = document.getElementById("centerDiv");
                var blockMask = $("<div style='position:absolute; display:none;  z-index:300; background-color:" + "#eef5fd" + "; filter:alpha(opacity=50); -moz-opacity:0.5;  -khtml-opacity: 0.5;  opacity: 0.5;' />").css("width", $(divObj).width()).css("top", 3).css("left", $(divObj).offset().left + 5).css("height", $(divObj).height());
                blockMask.attr("class", "blockMask")
                $(divObj).append(blockMask);
                blockMask.show();
            }

            multiScreenClose();
        }
    });
    // 切换$("#btnCompare")内容
    function multiScreenClose(){
        setTimeout(function(){
            if(top.bMultiScreenState){
                $("#btnCompare").removeAttr("disabled");
                $("#btnCompare").text("单屏显示");
            }else{
                multiScreenClose();
            }
        }, 1000);
    }

    //指标比选
    $("#btnIndexCompare").click(function() {
        bShowIndex = !bShowIndex;
        top.showIndex(bShowIndex, planDataArr);
    });

    //多屏联动
    $("#btnSync").click(function() {
        bSync = !bSync;
        top.setSync(bSync);
        $(this).text(bSync ? "取消联动" : "多屏联动");
    });

    //页面关闭事件 - 隐藏遮罩图层、恢复一屏三维显示、还原方案图层以及删除相关数据
    $(window).unload(function() {
        try {
        	top.showIndex(false, planDataArr); //关闭气泡
            if ($(".blockMask")) {
                $(".blockMask").hide();
            }

            if(bMultiple){
                top.earthToolsBalloon.SetIsVisible(true);
                top.setScreenShow("mMultipleScreen", "3d");
            }

            //隐藏图层
            if(projManager.getCurrentLayerObjList() && projManager.getCurrentLayerObjList()[projManager.currentApproveProjectGuid]){
                var eList = projManager.getCurrentLayerObjList()[projManager.currentApproveProjectGuid];
                if(eList){
                    var count = eList.length;
                    for (var j = 0; j < count; j++){
                        var obj = eList[j];
                        if(!obj){
                            continue;
                        }
                        if(isShowCurrentObj){
                            obj.Visibility = true;
                        }else{
                            obj.Visibility = false;
                        }
                    }
                }
            }
            if(layerStatus){
                for (var guid in layerStatus) {//除去现状图层
                    if(top.editLayers[guid]){
                        top.editLayers[guid].Visibility = layerStatus[guid];
                    }
                };
            }
        } catch (e) {

        }
    });
});