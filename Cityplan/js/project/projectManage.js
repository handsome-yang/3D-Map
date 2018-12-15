/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月13日
 * 描    述：方案审批面板
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月13日
 *****************************************************************/

jQuery.support.cors = true; //开启jQuery跨域支持
var earth = top.LayerManagement.earth;//三维球
var projManager = top.projManager = STAMP.ProjectManager(earth);//初始化工程管理工具对象
var TreeData;//审批树数据

/**
 * 窗口重绘
 */
function windowResize() {
    var treeHeight = ($(window).height() - $("#topSearchDiv").height() - 15) / 2;//15为topSearchDiv设置的padding-top
    $("#projTreeScrollDiv").height(treeHeight);
    $("#approveTreeDiv").height(treeHeight);
}
/**
 * 获取当前审批中的项目节点
 * @return {[TreeNode]} [项目节点信息，未审批时返回null]
 */
function getCurrentProject() {
    var appTreeObj = $.fn.zTree.getZTreeObj("appTree");
    if (!appTreeObj) {
        return null;
    }
    var nodes = appTreeObj.getNodes();
    if (nodes && nodes.length > 0 && nodes[0].children && nodes[0].children.length > 0) {
        return nodes[0].children[0];
    } else {
        return null;
    }
}
/**
 * 在审批树结束审批点击事件
 * @return {[type]} [description]
 */
function finishApprove(){
    top.projNode = null;
    top.projNodeId = null;
    top.selNode = null;
    clearEditState();
    var tree = $.fn.zTree.getZTreeObj("appTree");
    var selNode = null;
    if(tree && tree.getNodes() && tree.getNodes().length > 0 && tree.getNodes()[0].children){
        selNode = tree.getNodes()[0].children[0];
    }
    
    //取消审批
    var xmlData = {
        id: ""
    };
    projManager.saveApproveXML(xmlData);
    parent.checkedStatusList.splice(0, parent.checkedStatusList.length); //清空数组
    top.showHideEditLayer(false, null);
    parent.initEditLayerEditable(false);
    loadApproveProTree();
    loadProjectTree($("#selState").val(), $("#txtKeyword").val());
    top.approveDisableState(0);
    top.projectState = 0;

    //否则显示(取消审批)
    if (projManager.parcelLayerGuid2) {
        var tree = $.fn.zTree.getZTreeObj("appTree");
        var parcelNode = tree.getNodeByParam("type", "PARCEL");
        var roadlineNode = tree.getNodeByParam("type", "ROADLINE");
        if (parcelNode.cId) {
            if (top.editLayers[parcelNode.cId]) {
                top.editLayers[parcelNode.cId].Visibility = false;
            }
        }
        if (roadlineNode.cId) {
            if (top.editLayers[roadlineNode.cId]) {
                top.editLayers[roadlineNode.cId].Visibility = false;
            }
        }

        if (top.passedPlanObj[selNode.id]) { //如果是已经审批项目
            setTimeout(function () {
                setTimeoutLoadLayers2(false, selNode.id, projManager.parcelLayerGuid2);
            }, 500);
        } else {
            setTimeout(function () {
                setTimeoutLoadLayers2(true, selNode.id, projManager.parcelLayerGuid2);
            }, 500);
        }
    }
}

    
var editTool = top.editTool;
var approveProIdList = [];
var setting = {
    check: {
        enable: true, //是否显示checkbox或radio
        chkStyle: "checkbox" //显示类型,可设置(checbox,radio)
    },
    data: {
        simpleData: {
            enable: true
        }
    },
    view: {
        expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
        selectedMulti: false //设置是否允许同时选中多个节点
    },
    callback: {
        beforeClick: null,
        beforeCollapse: null,
        beforeExpand: beforeExpand,
        onCollapse: null,
        onExpand: onExpand,
        onCheck: onCheckedEvent,
        onRightClick: onRightClick,
        onClick: function (event, treeId, node) {
            if (!node || treeId != "appTree") {
                return;
            }
            planDesignIsOnClick(node);
        },
        onDblClick: function (event, treeId, treeNode) {
            if (treeNode) {
                if (treeNode.children) {
                } else {
                    projManager.locateToLayer(treeNode);
                }
            }
        }
    }
};

//check勾选事件
function onCheckedEvent(event, treeId, treeNode) {
    if (!treeNode) {
        return;
    }
    var zTree = $.fn.zTree.getZTreeObj(treeId);
    if (treeId == "appTree") {//审批树
        var planArr = [];
        var nodes = $.fn.zTree.getZTreeObj("appTree").getCheckedNodes(true);
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].type == "PLAN") {
                planArr.push(nodes[i]);
            }
        }
        if (treeNode.checked) {
            if (treeNode.type == "PLAN") {
                top.selNode = treeNode;
            }
        } else { 
            top.selNode = null;
            if(top.editState && ((treeNode.type == "PLAN" && top.currentPlanLayerId == treeNode.id)
                || treeNode.type == "STAGE" || treeNode.type == "PROJECT")){//表示是处于编辑状态的，需要重置
                clearEditState();
                $('#contextMenuPlan').menu("setIcon", {
                    target: $("#divShowParamModel"),
                    iconCls: 'icon-blank'
                });
            }
        }
    }
    if (treeNode.type == "PLAN") {//方案节点
        projManager.showAll(treeNode.projectId, treeNode.id, treeNode.checked, true, false, false, false);
    } else if (treeNode.type == "PARCEL") {//规划用地
        projManager.showAll(treeNode.projectId, null, treeNode.checked, false, true, false, false);
    } else if (treeNode.type == "ROADLINE") {//道路红线
        projManager.showAll(treeNode.projectId, null, treeNode.checked, false, false, true, false);
    } else if (treeNode.type == "SMOOTHLINE") {//地形平整线
        projManager.showAll(treeNode.projectId, null, treeNode.checked, false, false, false, true);
    } else if (treeNode.type == "STAGE" || treeNode.type == "SUBJECT") {
        for (var i = 0; i < treeNode.children.length; i++) {
            var node = treeNode.children[i];
            if (node.type == "PARCEL") { //规划用地
                projManager.showAll(node.projectId, null, node.checked, false, true, false, false)
            } else if (node.type == "ROADLINE") { //道路红线
                projManager.showAll(node.projectId, null, node.checked, false, false, true, false)
            } else if (node.type == "SMOOTHLINE") { //地形平整线
                projManager.showAll(node.projectId, null, node.checked, false, false, false, true)
            } else if (node.type == "PLAN") {
                projManager.showAll(node.projectId, node.id, node.checked, true, false, false, false);
            }
        }
    } else if (treeNode.type == "PROJECT") { //项目节点
        projManager.showAll(treeNode.id, "all", treeNode.checked, true, true, true, true);
        if (treeNode.loadApprove) {
            projManager.showCurrentLayers(treeNode.checked, treeNode.id, treeNode.parcelId);
        }
    } else if (treeNode.type == "OLD") { //现状节点
        var isTimeout = false; //延迟加载
        if (!top.editLayers[treeNode.parcelId]) { //if规划用地图层没加载则加载
            projManager.applyDataBaseRecords(false, treeNode.parcelId);
            isTimeout = true;
        }
        if (isTimeout) {
            setTimeout(function () {
                setTimeoutLoadLayers(treeNode, projManager.currentApproveProjectGuid);
            }, 300);
        } else {
            setTimeout(function () {
                setTimeoutLoadLayers(treeNode, projManager.currentApproveProjectGuid);
            }, 300);
        }
    }
    $('#' + treeId).find('a[title=' + treeNode.name + ']:eq(0)').trigger('click');
}

//加载现状图层
function setTimeoutLoadLayers(treeNode, projectId) {
    projManager.showCurrentLayers(treeNode.checked, projectId, treeNode.parcelId);
}

//右键事件
function onRightClick(event, treeId, treeNode) {
    if (!treeNode) return;
    if (treeNode.loadApprove) { //审批树
        if (treeNode.type == "PROJECT") { // 项目节点
            $.fn.zTree.getZTreeObj(treeId).selectNode(treeNode);
            $('#contextMenuProject2').menu('show', {
                left: event.pageX,
                top: event.pageY
            });
        } else if (treeNode.type == "PLAN") { //方案节点
            $.fn.zTree.getZTreeObj(treeId).selectNode(treeNode);
            if (treeNode && treeNode.checked) {
                $('#contextMenuPlan').menu('show', {
                    left: event.pageX,
                    top: event.pageY
                });
            }
        }
    } else { //管理树
        if (treeNode.type == "PROJECT") { // 项目节点
            $.fn.zTree.getZTreeObj(treeId).selectNode(treeNode);
            if (treeNode.pId == -2) {//已审批项目
                $('#contextMenuProject4').menu('show', {
                    left: event.pageX,
                    top: event.pageY
                });
            } else if (treeNode.approve) { //已经审批中
                $('#contextMenuProject3').menu('show', {
                    left: event.pageX,
                    top: event.pageY
                });
            } else { //待审批
                $('#contextMenuProject').menu('show', {
                    left: event.pageX,
                    top: event.pageY
                });
            }
        }
    }
}

var htmlBalloonMove = null;


//展开节点前
function beforeExpand(treeId, treeNode) {
    return (treeNode.expand !== false);
}

//展开节点
function onExpand(event, treeId, treeNode) {

}

// //指标检查按钮、红线分析按钮、是否可点击
function planDesignIsOnClick(selNode) {
    top.selNode = selNode;
    //方案
    if (selNode && selNode.loadApprove && selNode.type == "PLAN" && selNode.checked) {
        top.approveDisableState(2);
        top.projectState = 2;
    } else if (selNode && selNode.loadApprove && (selNode.type == "PARCEL" || selNode.type == "ROADLINE") && selNode.checked) {
        top.approveDisableState(3);
        top.projectState = 3;
    } else {
        top.approveDisableState(1);
        top.projectState = 1;
    }
}
/**
 * [loadProjectTree 生成项目管理树]
 * @param  {[type]} status       [项目状态]
 * @param  {[type]} projName     [关键字]
 * @param  {[type]} projProperty [用地性质]
 * @return {[type]}              [无]
 */
function loadProjectTree(status, projName, projProperty) {
    $("#projTree").empty();
    var treeData = [];
    var projData = projManager.getProjectData({
        status: status,
        projName: projName,
        projProperty: projProperty
    });
    if (projData && projData.length == 0) {
        alert('没有查询结果');
    }
    if (projData) {
        bExist(projData, treeData);
        $.each(projData, function (i, pData) {
            projManager.appendProjectData(treeData, pData, approveProIdList, false);
        });
    }
    $.fn.zTree.init($("#projTree"), setting, treeData);
    TreeData = treeData;
}

//隐藏所有项目图层-2
function hideProLayer(TreeDataApp) {
    var projectNodeId = "";
    if (TreeDataApp && TreeDataApp.length) {
        var getEditLayers = projManager.getEditLayers();
        for (var i = 0; i < TreeDataApp.length; i++) {
            var treeNode = TreeDataApp[i];
            if (treeNode.type == "PROJECT") { //项目节点
                projectNodeId = treeNode.id;
                if (getEditLayers[treeNode.id]) {
                    //先在earth上也要删除该id对应的editLayer图层 否则下次导入会无法显示 guid重复！
                    earth.DetachObject(getEditLayers[treeNode.id]);
                    delete getEditLayers[treeNode.id];
                }
            } else if (treeNode.type == "PLAN") {
                var layerIds = projManager.getLayerIdsByPlanId(treeNode.id);
                $.each(layerIds, function (i, id) {
                    if (getEditLayers[id]) {
                        //先在earth上也要删除该id对应的editLayer图层 否则下次导入会无法显示 guid重复！
                        earth.DetachObject(getEditLayers[id]);
                        delete getEditLayers[id];
                    }
                });
            } else if (treeNode.type == "PARCEL" || treeNode.type == "ROADLINE" || treeNode.type == "SMOOTHLINE") {
                var layerId = projManager.getLayerIdByProId(treeNode.projectId, treeNode.type);
                if (getEditLayers[layerId]) {
                    //先在earth上也要删除该id对应的editLayer图层 否则下次导入会无法显示 guid重复！
                    earth.DetachObject(getEditLayers[layerId]);
                    delete getEditLayers[layerId];
                }
            }
        }
    }
    if (projectNodeId != null && projectNodeId != "") {
        projManager.showAll(projectNodeId, "all", false, true, true, true, true);
    }
}

/**
 * 加载审批树
 * @return {[type]} [description]
 */
function loadApproveProTree() {
    $("#appTree").empty();
    approveProIdList = [];
    var treeData = [];
    var projectIds = projManager.loadApproveXML();//获取当前项目GUID
    if (!projectIds) {
        return;
    }

    if (typeof(projectIds) == "string") {//获取当前项目的所有图层数据（用地、红线、方案等）
        approveProIdList.push(projectIds);
        projManager.currentApproveProjectGuid = projectIds;
        var projData = projManager.getProjectData({
            id: projectIds
        });
        if (projData && projData[0] && projData[0]["CPPROJECT.PARCELLAYERID"]) {
            projManager.parcelLayerGuid2 = projData[0]["CPPROJECT.PARCELLAYERID"];
        }
        if (projData) {
            bExist(projData, treeData);
            $.each(projData, function (i, pData) {
                projManager.appendProjectData(treeData, pData, null, true);
            });
        }
    }
    //审批树的初始化
    $.fn.zTree.init($("#appTree"), setting, treeData);

    //隐藏项目图层-2
    hideProLayer(treeData);
};
/**
 * [bExist description]
 * @param  {[type]} res      [项目数据]
 * @param  {[type]} treeData [树数据]
 * @return {[type]}          [无]
 */
function bExist(res, treeData) {
    var bExist1 = false;
    var bExist2 = false;
    $.each(res, function (i, pData) {
        var status = pData["CPPROJECT.STATUS"];
        if (status == 0 && !bExist1) {
            treeData.push({
                id: -1,
                pId: 0,
                name: "未审批项目",
                open: true,
                nocheck: true,
                icon: "../../images/project/folder.png",
                type: 0
            }); // 项目树根节点
            bExist1 = true;
        }
        if (status == 1 && !bExist2) {
            treeData.push({
                id: -2,
                pId: 0,
                name: "已审批项目",
                icon: "../../images/project/folder.png",
                open: true,
                nocheck: true,
                type: 1
            }); // 项目树根节点
            bExist2 = true;
        }
    });
}

// 初始化用地性质下拉框
var initSelDatas = function () {
    var datas = projManager.getProjectYDXZ();
    $("#selProperty").empty();
    $("#selProperty").append('<option value="">全部</option>');
    $.each(datas, function (i, date) {
        $("#selProperty").append('<option value="' + datas[i] + '">' + datas[i] + '</option>');
    });
};



//记录审批树的选中状态
var approveCheckedStatus = function () {
    var checkedArr = [];
    var zTree = $.fn.zTree.getZTreeObj("appTree");
    if (zTree) {
        if (projManager.checkedStatusList) {
            projManager.checkedStatusList.splice(0, projManager.checkedStatusList.length); //清空数组
        }
        var checkCount = zTree.getCheckedNodes(true);
        if (checkCount) {
            for (var i = 0; i < checkCount.length; i++) {
                var node = checkCount[i];
                if (node.type == "PARCEL" || node.type == "ROADLINE") { //规划用地
                    projManager.checkedStatusList.push(node.id);
                    checkedArr.push(node.cId);
                } else if (node.type == "PLAN") {
                    projManager.checkedStatusList.push(node.id);
                    checkedArr = checkedArr.concat(node.cId);
                }
            }
        }
    }
    return checkedArr;
}



//删除项目方法
function divDeleteProjectHandler() {
    var tree = $.fn.zTree.getZTreeObj("projTree");
    var selNode = tree.getSelectedNodes()[0];
    if (selNode) {
        if (confirm("是否确定要删除该项目？")) {
            if (top.projNodeId && top.projNodeId == selNode.id) { //如果当前项目正在审批中 则设置按钮为不可用状态
                clearEditState();
                top.approveDisableState(0);
                top.projectState = 0;
            }
            projManager.showAll(selNode.id, "all", false, true, true, true, true); //隐藏已加载的图层
            if (approveProIdList && approveProIdList.length > 0) { //删除正在审批的项目
                if (selNode.id == approveProIdList[0]) {
                    var xmlData = {
                        id: ""
                    };
                    projManager.saveApproveXML(xmlData);
                    loadApproveProTree();
                }
            }
            projManager.deleteProject(selNode.id);
            tree.removeNode(selNode);
        }
    }
};



//清空编辑状态
function clearEditState(){
    top.editState = false;
    top.currentPlanLayerId = null;
    top.currentPlanName = "";
    top.setEditBtnDisabled();
}

//右键改变审批状态的操作内容(上方树)
function divApproveProjectHanlder() {
    var tree = $.fn.zTree.getZTreeObj("projTree");
    var selNode = tree.getSelectedNodes()[0];
    var xmlData = {};
    //当前编辑状态清空
    clearEditState();
    if (!selNode.approve) { //审批
        top.projNode = selNode;
        top.projNodeId = selNode.id;
        xmlData = {
            id: selNode.id
        };
        projManager.currentApproveProjectGuid = selNode.id;
        top.approveDisableState(1);
        top.projectState = 1;
    } else { //结束审批
        top.projNode = null;
        top.projNodeId = null;
        top.selNode = null;
        xmlData = {
            id: ""
        };
        top.showHideEditLayer(false, null);
        top.approveDisableState(0);
        top.projectState = 0;
    }

    projManager.saveApproveXML(xmlData);
    //把editlayer里的图层设置为false
    parent.initEditLayerEditable(false);
    loadApproveProTree();
    loadProjectTree($("#selState").val(), $("#txtKeyword").val());

    if (!selNode.approve) {
        setTimeout(function () {//定时器，目的是上面的异步请求先获取到用地区域，然后再剔除用地区域内的现状建筑
            setTimeoutLoadLayers2(false, selNode.id, projManager.parcelLayerGuid2);
        }, 500);
    } else {
        setTimeout(function () {//定时器，目的是上面的异步请求先获取到用地区域，然后再剔除用地区域内的现状建筑
            setTimeoutLoadLayers2(true, selNode.id, projManager.parcelLayerGuid2);
        }, 500);
    }
};
// 剔除用地区域内的现状建筑 
function setTimeoutLoadLayers2(isShow, projectID, parcelID) {
    projManager.showCurrentLayers(isShow, projectID, parcelID);
    showApprovedLayer(isShow, parcelID);
}

function showApprovedLayer(isShow, parcelId) {
    try {
        if (parcelId == undefined) {
            return;
        }

        var root = $.fn.zTree.getZTreeObj('projTree');
        var approvedNodes = root.getNodeByParam('name', '已审批项目', null);
        if (approvedNodes != null) {
            approvedNodes = approvedNodes.children;
            if (approvedNodes != null) {
                for (var i = 0; i < approvedNodes.length; i++) {
                    var curProNode = approvedNodes[i];
                    var curParcelId = curProNode.parcelId;
                    if (curProNode.approve) {
                        //审批中的项目
                        continue;
                    }

                    if (curProNode.children != null && curProNode.children.length > 0) {
                        for (var j = 0; j < curProNode.children.length; j++) {
                            if (curProNode.children[j].type == "STAGE") {
                                var planNodes = root.getNodesByParam('type', 'PLAN', curProNode.children[j]);
                                for (var k = 0; k < planNodes.length; k++) {
                                    //取消审批时隐藏方案图层
                                    projManager.showAll(planNodes[k].projectId, planNodes[k].id, false, true, false, false, false);
                                    var needHide = false;

                                    var poly1 = getPolygonFromVector3s(top.ploygonLayersVcts3[parcelId]); //当前审批的控规面
                                    var poly2 = getPolygonFromVector3s(top.ploygonLayersVcts3[curParcelId]); //已审批的控规面

                                    var relation = earth.PolygonAlgorithm.PolysRelationship(poly1, poly2);
                                    needHide = relation < 4;

                                    if (needHide && planNodes[k].checked) {
                                        root.checkNode(planNodes[k], isShow, true, true);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {

    }
}
// 获取控规面
function getPolygonFromVector3s(v3s) {
    if (v3s == null) {
        return null;
    }

    try {
        var polygon = earth.Factory.CreatePolygon();
        polygon.AddRing(v3s);
        return polygon;
    } catch (e) {
        return null;
    }
}

$(function () {
    windowResize();
    $("#projTreeScrollDiv").mCustomScrollbar({});
    $("#approveTreeDiv").mCustomScrollbar({});
    $("#finishedTag").click(function () {
        var tree = $.fn.zTree.getZTreeObj("projTree");
        if (!tree) {
            return;
        }
        var selNode = tree.getSelectedNodes()[0];
        var selectedItemId = selNode.id;
        if (selectedItemId == "") {
            alert("请右键已审批项目，查看已审批纪要！");
        } else {
            if(htmlBalloonMove){
                htmlBalloonMove.DestroyObject();
                htmlBalloonMove = null;
            }
            var loaclUrl = window.location.href.substring(0, window.location.href.lastIndexOf("/") - 1);
            loaclUrl = loaclUrl.substring(0, loaclUrl.lastIndexOf("/") - 1);
            loaclUrl = loaclUrl.substring(0, loaclUrl.lastIndexOf("/"));
            var width = 521;
            var height = 415;
            var url = loaclUrl + "/html/analysis/approveTag.html?type=2";
            var title = "已审批纪要";
            htmlBalloonMove = earth.Factory.CreateHtmlBalloon(earth.Factory.CreateGUID(), title);
            htmlBalloonMove.SetScreenLocation(width / 2 + (top.dialogLeft ? top.dialogLeft : 86), 0);
            htmlBalloonMove.SetRectSize(width, height);
            htmlBalloonMove.SetIsAddBackgroundImage(false);
            htmlBalloonMove.ShowNavigate(url);
            //页面加载完成事件
            earth.Event.OnDocumentReadyCompleted = function (guid) {
                earth.htmlBallon = htmlBalloonMove;
                earth.editTool = editTool;
                earth.projManager = projManager;
                earth.projNodeId = selectedItemId;
                if (htmlBalloonMove === null) {
                    return;
                }
                if (htmlBalloonMove.Guid == guid) {
                    htmlBalloonMove.InvokeScript("getEarthFinished", earth);
                }
            }
        }
    });
    //页面卸载关闭气泡
    $(window).unload(function(){
        if(htmlBalloonMove) {
            htmlBalloonMove.DestroyObject();
            htmlBalloonMove = null;
        }
    });
    initSelDatas();

    //每次点击方案管理切出面板时都会重新调用此方法，造成现状和基础图层反复加载，影响图层控制
    projManager.getEditLayerListLoaded();

    setTimeout(projManager.getAllPassedPlan, 300); //延迟加载，等待加载数据库数据
    // 搜索按钮
    $("#btnSearch").click(function () {
        var layerIds = approveCheckedStatus();
        top.showHideEditLayer(false, layerIds);
        loadProjectTree($("#selState").val(), $("#txtKeyword").val(), $("#selProperty").val());
        top.editLayers = projManager.getEditLayers();
    });

    // 页面卸载（即窗口关闭）时
    $(window).unload(function () {
        approveCheckedStatus();
    });
    //删除项目右键事件
    $("#divDeleteProject, #divDeleteProject3, #divDeleteProject4").click(function () {
        divDeleteProjectHandler();
    });
    /**上面的项目管理树的右键审批功能
     * [ description]
     * @return {[type]} [description]
     */
    $("#divApproveProject, #divApproveProject3").click(function () {
        divApproveProjectHanlder();
    });
    /**
     * 下面的审批树的右键审批事件回调(结束审批)
     * @return {[type]} [description]
     */
    $("#divApproveProject2").click(function () {
        finishApprove();
    });

    //设置方案编辑右键菜单样式
    $('#contextMenuPlan').menu("setIcon", {
        target: $("#divEditPlan"),
        iconCls: 'icon-blank'
    });

    //设置方案编辑“显示参数模型”右键菜单样式
    $('#contextMenuPlan').menu("setIcon", {
        target: $("#divShowParamModel"),
        iconCls: 'icon-blank'
    });

    //项目管理树中未审批项目的右键菜单
    $('#contextMenuProject').menu({
        onShow: function () { // 控制右键菜单中显示菜单前面的勾选状态
            var tree = $.fn.zTree.getZTreeObj("projTree");
            var selNode = tree.getSelectedNodes()[0];
            if (selNode) {
                if (selNode.approve) {
                    $(this).menu("setIcon", {
                        target: $("#divApproveProject"),
                        iconCls: 'icon-ok'
                    });
                } else {
                    $(this).menu("setIcon", {
                        target: $("#divApproveProject"),
                        iconCls: 'icon-blank'
                    });
                }
            }
        }
    });

    //项目管理树审批中项目的右键菜单---结束审批
    $('#contextMenuProject3').menu({
        onShow: function () { // 控制右键菜单中显示菜单前面的勾选状态
            var tree = $.fn.zTree.getZTreeObj("projTree");
            var selNode = tree.getSelectedNodes()[0];
            if (selNode) {
                if (selNode.approve) {
                    $(this).menu("setIcon", {
                        target: $("#divApproveProject3"),
                        iconCls: 'icon-ok'
                    });
                } else {
                    $(this).menu("setIcon", {
                        target: $("#divApproveProject3"),
                        iconCls: 'icon-blank'
                    });
                }
            }
        }
    });

    //审批树中右键菜单
    $('#contextMenuProject2').menu({
        onShow: function () { // 控制右键菜单中显示菜单前面的勾选状态
            var tree = $.fn.zTree.getZTreeObj("appTree");
            var selNode = tree.getSelectedNodes()[0];
            if (selNode) {
                $(this).menu("setIcon", {
                    target: $("#divApproveProject2"),
                    iconCls: 'icon-ok'
                });
            }
        }
    });

    //方案编辑菜单
    $('#contextMenuPlan').menu({
        onShow: function () { // 控制右键菜单中显示菜单前面的勾选状态
            var tree = $.fn.zTree.getZTreeObj("appTree");
            var selNode = tree.getSelectedNodes()[0];
            if (selNode == null || selNode.cId == null || selNode.cId.length <= 0) {
                return;
            }
            var editLayer = top.editLayers[selNode.cId[0]];
            if (editLayer && editLayer.Visibility) { //如果图层加载 并且可见 则可设置可编辑状态
                if (editLayer.Editable) {
                    $(this).menu("setIcon", {
                        target: $("#divEditPlan"),
                        iconCls: 'icon-ok'
                    });
                } else {
                    $(this).menu("setIcon", {
                        target: $("#divEditPlan"),
                        iconCls: 'icon-blank'
                    });
                }
            } else {
                $(this).menu("setIcon", {
                    target: $("#divEditPlan"),
                    iconCls: 'icon-blank'
                });
            }
        }
    });

    //显示参数模型
    $("#divShowParamModel").click(function () {
        var tree = $.fn.zTree.getZTreeObj("appTree");
        var selNode = tree.getSelectedNodes()[0];
        if ($("#divShowParamModel .menu-icon").hasClass("icon-ok")) {
            projManager.showParamModel(selNode.id, false);
        } else {
            projManager.showParamModel(selNode.id, true);
        }
    });
    //方案编辑
    $("#divEditPlan").click(function () {
        //当前应该只有一个方案处于编辑状态
        var isEdit = false;
        var tree = $.fn.zTree.getZTreeObj("appTree");
        var selNode = tree.getSelectedNodes()[0];
        var layerIds = selNode.cId;
        var planLayerIDs = projManager.getPlanLayerIDs();
        var planLayers = planLayerIDs[selNode.id];
        //当前选中方案对应的图层id
        var plans = [];
        for (var planID in planLayerIDs) {
            plans.push(planID);
        }
        for (var i = plans.length - 1; i >= 0; i--) {
            var currentPlanId = plans[i];
            if (currentPlanId == selNode.id) {
                if (planLayers && planLayers.length) {
                    //开启编辑功能
                    for (var k = 0; k < layerIds.length; k++) {
                        var layerId = layerIds[k];
                        var getEditLayers = projManager.getEditLayers();
                        var layer = getEditLayers[layerId]; 
                        if (layer) {
                            if (layer.Editable) {
                                layer.Editable = false;
                                clearEditState();
                            } else {
                                if (layer.name.indexOf("buildingspolygon") == -1) {//参数模型不可编辑
                                    layer.Editable = true;
                                    top.editState = true;
                                    top.currentPlanLayerId = selNode.id;
                                    top.currentPlanName = selNode.name;
                                    top.setEditBtnDisabled();
                                }
                            }
                            isEdit = layer.Editable;
                        }
                    }
                }
            }
        }
        if (isEdit) {
            //如果有一个开启 则关闭其他的方案编辑状态
            for (var i = plans.length - 1; i >= 0; i--) {
                var currentPlanId = plans[i];
                if (currentPlanId != selNode.id) {
                    var pLayers = planLayerIDs[currentPlanId];
                    for (var j = 0; j < pLayers.length; j++) {
                        var layerId = pLayers[j];
                        if (projManager.getParcelLayerGuid2() != pLayers) { //这里要过滤掉现状图层parent.parcelLayerGuid2
                            var getEditLayers = projManager.getEditLayers();
                            var layer = getEditLayers[layerId];
                            var isShow = !isEdit;
                            if (isShow) {
                                if (layer && layer.Visibility) {
                                    layer.Editable = true;
                                }
                            } else {
                                if (layer) layer.Editable = isShow;
                            }
                        }
                    }
                }
            }
        }
    });
    //右键屏蔽方法
    document.oncontextmenu = function () {
        event.returnValue = false;
    }
});