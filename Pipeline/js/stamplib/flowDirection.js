/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：流向分析
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var FlowDirection = {};//流向分析方法封装对象
(function() {
    var imgLocation = getFilePath() + "/images/Flow/",
        flowImg = imgLocation + "flow.jpg";
    /**
     * 获取网络绝对路径
     */
    function getFilePath() {
        var url = window.location.href;
        url = url.substring(0,url.lastIndexOf('/'));
        return url;
    }
    var flowLayer = [];//流向图层集合
    /**
     *获取到需要流向分析的图层然后打开流向
     */
    var flowShowing = function() {
        getFlowLayer();
        if (flowLayer.length > 0) {
            for (var i = 0; i < flowLayer.length; i++) {
                top.LayerManagement.earth.LayerManager.OpenFlow(flowLayer[i], flowImg);
            }
        } else {
            alert("获取图层数据失败");
            return;
        }
    };
   
    /**
     * 遍历所有管线图层，管线编码在[4000,5000)之间的管线属于排水管线大类的才可以
     * @param  {[string]} id [工程id]
     */
    var getFlowLayer = function(id) {
        var projectList = top.LayerManagement.earth.LayerManager.GetLayerByGuid(id);
        if (!id) {
            var projectList = top.LayerManagement.earth.LayerManager.LayerList;
        }
        for (var i = 0; i < projectList.GetChildCount(); i++) {
            var ChildLayer = projectList.GetChildAt(i);
            ///判断是否为管线图层
            if (ChildLayer.PipeLineType >= 4000 && ChildLayer.PipeLineType <5000) {
                flowLayer.push(ChildLayer.Guid);
            } else {
                getFlowLayer(ChildLayer.Guid);
            }
        }
    }
    /**
     * 对打开流向的图层关闭流向并且将流向图层置空
     * @return {[type]} [description]
     */
    var flowClosing = function() {
        for (var i = 0, len = flowLayer.length; i < len; i++) {
            top.LayerManagement.earth.LayerManager.CloseFlow(flowLayer[i]);
        }
        flowLayer = [];
    };
    FlowDirection.flowShowing = flowShowing;
    FlowDirection.flowClosing = flowClosing;
})();
