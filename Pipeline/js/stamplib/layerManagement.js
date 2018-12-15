/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：图层树
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
/**
* 功能：图层控制，形成基本图层树
* 参数：data图层数据，earthObj为earth
* 返回值：无
*/
function baseLayerTree(earthObj){

    var setting = {
        check: {
                enable: true, //是否显示checkbox或radio
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
                top.LayerManagement.layerTreeCheck(earthObj, node);
            }
        }
    };

    var rootLayer = top.LayerManagement.getRootLayer(earthObj);
    var zNodes = top.LayerManagement.getLayerTreeData(rootLayer);
    var tree = $.fn.zTree.init($("#layerTree"), setting, zNodes);

    return tree;
}

/**
 * 构造管线图层树
 * @param  {[object]} earthObj [三维球对象]
 * @param  {[Array]} data     [管线图层数据]
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
            }
        }
    };
    var tree = $.fn.zTree.init($("#pipelineLayerTree"), setting, data);
    var nodes = tree.getNodes();
        if (nodes[0] && nodes[0].children) {
            var child = nodes[0].children;
            for (var i = 0; i < child.length; i++) {
                var nChild = child[i];
                tree.expandNode(nChild, true);
            }
        }
};
/**
 * 获取基本图层树并且返回
 */
function getLayerTree(){
    var tree = $.fn.zTree.getZTreeObj("layerTree");
    return tree;
}
/**
 * 获取管线图层树并且返回
 */
function getPipeTree(){
    var pipelineLayerzTree = $.fn.zTree.getZTreeObj("pipelineLayerTree");
    return pipelineLayerTree;
}
