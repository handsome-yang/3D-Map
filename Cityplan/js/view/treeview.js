/**
 * 作    者：StampGIS Team
 * 创建日期：2017年11月9日
 * 描    述：图层管理
 * 注意事项：无
 * 遗留bug ：无
 * 修改日期：2017年11月9日
 */

var earth = top.LayerManagement.earth;//三维球

//窗口重绘
var windowResize = function(){
    $("#id_tree_body").height($(window).height() - 40);
    var treeHeight = $("#id_tree_body").height() - $(".tabs-header").height();
    $("#layerTreeDiv").height(treeHeight);
    $("#pipelineLayerDiv").height(treeHeight);
}

//初始方法
$(document).ready(function(){
    windowResize();
    $("#layerTreeDiv").mCustomScrollbar({});
    $("#pipelineLayerDiv").mCustomScrollbar({});
    var pipleLineLayerData = top.LayerManagement.getPipeTreeData(null); //获取管线图层数据
    pipeLineLayerTree(earth, pipleLineLayerData); // 将管线图层数据添加到左侧树
    baseLayerTree(earth, top.curEditLayers);//初始化基础数据和现状数据树
});

//注册图层树选择事件
$("#id_tree_body").tabs({
    onSelect:function(title,index){
        if(title == "基础图层"){
            $("#pipelineLayerDiv").mCustomScrollbar("destroy");
            $("#layerTreeDiv").mCustomScrollbar({});
        }else{
            var treeHeight = $("#id_tree_body").height() - $(".tabs-header").height();
            $("#pipelineLayerDiv").height(treeHeight);
            $("#layerTreeDiv").mCustomScrollbar("destroy");
            $("#pipelineLayerDiv").mCustomScrollbar({});
        }
    }
});

/**
* 功能：图层控制，形成基本图层树
* 参数：data图层数据，earthObj为earth
* 返回值：无
*/
function baseLayerTree(earthObj, curEditLayers){
    var currentLayerDatas = top.currentLayerDatas;
    if(currentLayerDatas){//现状图层树按照名称排序
        currentLayerDatas.sort(function(a, b){
            return a.name.localeCompare(b.name);
        });    
    }
    
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
            dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
            expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
            selectedMulti: false //设置是否允许同时选中多个节点
        },
        callback: {
            onDblClick: function(event, treeId, node) {//双击图层
                top.LayerManagement.layerTreeDbClick(earthObj, node);
            },
            onCheck: function(event, treeId, node) {//点击checkbox事件
                top.LayerManagement.layerTreeCheck(earthObj, node, curEditLayers);
            },
            onExpand:function(event, treeId, node){
                setScroll();
            },
            onCollapse:function(event, treeId, node){
                setScroll();
            }
        }
    };

    var rootLayer = top.LayerManagement.getRootLayer(earthObj);
    var baseLayerDatas = top.LayerManagement.getLayerTreeData(rootLayer);
    var zNodes = [];
    zNodes.push({
        id: 1,
        pId: 0,
        name: "基础数据",
        open: true,
        nocheck: true,
        type: "DATA",
        icon:top.LayerManagement.getLayerIcon('Folder')
    });
    if(currentLayerDatas){
        zNodes.push({
            id: 2,
            pId: 1,
            name: "现状数据",
            open: false,
            nocheck: false,
            type: "OLD",
            icon:top.LayerManagement.getLayerIcon('Folder'),
            checked: top.LayerManagement.getChildVisibility(currentLayerDatas)
        });
        //将获取到的现状图层数据加载到现状数据节点下
        zNodes = zNodes.concat(currentLayerDatas);
    }
    zNodes.push({
        id: 3,
        pId: 1,
        name: "浏览数据",
        open: false,
        nocheck: false,
        type: "BASE",
        icon:top.LayerManagement.getLayerIcon('Folder')
    });
    
    //获取基础图层数据加载到浏览数据节点下
    zNodes = zNodes.concat(baseLayerDatas);
    var tree = $.fn.zTree.init($("#layerTree"), setting, zNodes);
    return tree;
}

/*
 * 设置滚动条
 */
function setScroll(){
    var h=window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    $("#id_tree_body").height(h-40); 
}

/*
 * 管线图层树加载
 * @param earthObj 三维球
 * @param data 图层数据数组
 */
function pipeLineLayerTree(earthObj,data){
    var setting = {
        open:true,
        check: {
            enable: true, //是否显示checkbox或radio
            chkStyle: "checkbox" //显示类型,可设置(checbox,radio)
        },
        view: {
            dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
            expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
            selectedMulti: false //设置是否允许同时选中多个节点
        },
        callback: {
            onDblClick: function(event, treeId, node) {
                top.LayerManagement.layerTreeDbClick(earthObj, node);
            },
            onCheck: function(event, treeId, node) {//点击checkbox事件
                top.LayerManagement.layerTreeCheck(earthObj, node);
            },
            onExpand:function(event, treeId, node){
                setScroll();
            },
            onCollapse:function(event, treeId, node){
                setScroll();
            }
        }
    };
    var tree = $.fn.zTree.init($("#pipelineLayerTree"), setting, data);
    //展开所有节点
    var nodes = tree.getNodes();
    if (nodes[0] && nodes[0].children) {
        var child = nodes[0].children;
        for (var i = 0; i < child.length; i++) {
            var nChild = child[i];
            tree.expandNode(nChild, true);
        }
    }
};

/*
 * 基础图层树控件对象
 */
function getLayerTree(){
    var tree = $.fn.zTree.getZTreeObj("layerTree");
    return tree;
}

/*
 * 管线图层树控件对象
 */
function getPipeTree(){
    var pipelineLayerzTree = $.fn.zTree.getZTreeObj("pipelineLayerTree");
    return pipelineLayerzTree;
}