/**
 * 作    者：StampGIS Team
 * 创建日期：2017年9月20日
 * 描    述：标注管理js文件
 * 遗留bug ：无
 * 修改日期：2017年11月7日
 **************************************************/
var markedDoc = null; //标注信息XML文档对象
var earth = null; //地球对象
var tree = null; //标注树

$(function(){
    var treeDivHeight = $(parent.document).height()-115;
    $("#markedTreeDiv").height(treeDivHeight);
    $("#markedTreeDiv").mCustomScrollbar({});//滚动条
    initMarkedMgr();
});

/**
 * 功能：根据根节点构造生成树所需的数据
 * 参数：root-数据源根节点
 * 返回：数据数组
 */
var getMarkedData = function(root){
    var dataArr = [];
    for(var i=0; i<root.childNodes.length; i++){
        var childNode = root.childNodes[i];
        var id = childNode.getAttribute("id");
        var name = childNode.getAttribute("name");
        var checked = childNode.getAttribute("checked");
        if((id != null)&&(name != null)){
            var data = {
                id: id,
                name: name,
                checked : checked
            };
            if(childNode.tagName === "ElementMarked"){ //叶子节点
                var parentNodeName = root.nodeName;
                var imgPath = "../../images/markTree/" + parentNodeName + ".png";
                data.icon = imgPath;
                data.title = name;
            }else{ //目录节点
                data.children = getMarkedData(childNode);
                data.isParent = true;
                data.open = childNode.getAttribute("open");
                data.icon = "../../images/markTree/folder.png";
            }
            dataArr.push(data);
        }
    }
    return dataArr;
};

/**
 * 功能：初始化标注树
 * 参数：markedDoc - 标注文档对象
 * 返回：标注树
 */
var initMarkedTree = function(markedDoc){
    var setting = {
        check: {
            enable: true, //是否显示checkbox或radio
            chkStyle: "checkbox" //显示类型,可设置(checbox,radio)
        },
        key: {
            title: "title"
        },
        view: {
            showTitle: true,
            dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
            expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
            selectedMulti: false //设置是否允许同时选中多个节点
        },
        callback: {
            onDblClick: markedDblclick, //标注树节点双击事件
            onRightClick: markedRightClick, //标注树节点右键事件
            onCheck: markedCheck, //标注树节点复选框点击
            onCollapse : markedCollapse, //标注树节点折叠事件
            onExpand : markedExpand //标注树节点展开事件
        }
    };
    var markedRoot = markedDoc.documentElement;
    var zNodes = getMarkedData(markedRoot);
    var tree = $.fn.zTree.init($("#markedTree"), setting, zNodes);
    return tree;
};

/**
 * 功能：初始化 - 获取标注文档并创建标注树
 * 参数：无
 * 返回：无
 */
var initMarkedMgr = function(){
    earth = top.LayerManagement.earth;
    top.MarkedCreator.initMarkedDoc();
    top.MarkedCreator.initMarkedIconList();
    markedDoc = top.MarkedCreator.markedDoc;
    tree = initMarkedTree(markedDoc);
};
/**
 * 功能：标注树鼠标双击事件
 * 参数：event-JS事件；treeId-树的ID；treeNode-选中的标注树节点
 * 返回：无
 */
var markedDblclick = function(event,treeId,treeNode){
    if(!treeNode) return;
    var id = treeNode.id;
    var currNode = lookupNodeById(markedDoc, id);
    if(currNode.tagName != "ElementMarked"){ //如果双击的节点不是叶子节点，则不进行定位
        return;
    }

    var LayerNode = currNode.selectSingleNode("LayerId");
    if(LayerNode != null){ //判断标注节点是否为距离标注节点，如果是不是距离标注节点，则查询并高亮显示管线
        var searchLayerId = LayerNode.text;
        var key = currNode.selectSingleNode("USKey").text;
        if(searchLayerId.indexOf("_")>0){
            searchLayerId=searchLayerId.split("_")[0];
        }
        if(searchLayerId.indexOf("=")>0){
            searchLayerId=searchLayerId.split("=")[1];
        }
        var result = top.PipelineMeasure.getPipeLocalInfo(searchLayerId,key);
        if(result){
            var resXml = result.GotoPage(0); //获取数据
            for(var i=0; i<result.RecordCount; i++){
                var obj = result.GetLocalObject(i);
                if(obj.GetKey() === key){
                    obj.ShowHighLight();
                    break;
                }
            }
        }else{
            alert("未找到编号为："+key+"管线\n请删除之前的标注，重新标注.");
            return;
        }
    }

    //定位标注对象
    var location = currNode.selectSingleNode("Location").text;
    var locationArr = location.split(",");
    var lon = parseFloat(locationArr[0]);
    var lat = parseFloat(locationArr[1]);
    var alt = parseFloat(locationArr[2]);
    top.LayerManagement.earth.GlobeObserver.FlytoLookat(lon, lat, alt, 0, 60, 0, 100, 2);
};

/**
 * 功能：标注树鼠标右键单击事件
 * 参数：event-JS事件；treeId-树的ID；treeNode-选中的标注树节点
 * 返回：无
 */
var markedRightClick = function(event,treeId,treeNode){
    if(!treeNode) return;
    var id = treeNode.id;
    var rootId = markedDoc.documentElement.firstChild.getAttribute("id");
    if(id === rootId){ //根节点没有右键菜单
        return;
    }
    tree.selectNode(treeNode);
    $("#rigMouMenuDiv").css({"display":"","left":event.clientX,"top": event.clientY});
};

/**
 * 功能：隐藏右键菜单
 * 参数：无
 * 返回：无
 */
var hiddenRightMenu = function(){
    $("#rigMouMenuDiv").css("display","none");
};

/**
 * 功能：右键菜单“属性”点击事件
 * 参数：无
 * 返回：无
 */
var editMarkedClick = function(){
    hiddenRightMenu();
    var selectedTreeNode = tree.getSelectedNodes()[0];
    var params = {
        markedName : selectedTreeNode.name
    };
    var markedName = openDialog("markedNameDialog.html",params,270,100);
    if(markedName == null){
        return;
    }

    var id = selectedTreeNode.id;
    //更新标注树
    selectedTreeNode.name = markedName;
    tree.updateNode(selectedTreeNode);

    //更新标注节点和文档
    var currNode = lookupNodeById(markedDoc, id);
    currNode.setAttribute("name",markedName);
    top.MarkedCreator.saveMarkedFile();

    //更新标注对象
    if(currNode.tagName === "ElementMarked"){ //判断选中的节点是否为标注节点
        var markedIcon = top.MarkedCreator.getMarkedIconById(id);
        markedIcon.Name = markedName;
    }
};

/**
 * 功能：右键菜单“删除”点击事件
 * 参数：无
 * 返回：无
 */
var deleteMarkedClick = function(){
    hiddenRightMenu();
    var flag = confirm("确实要删除吗?");
    if(flag == false){
        return;
    }

    var selectedTreeNode = tree.getSelectedNodes()[0];
    var id = selectedTreeNode.id;

    //删除标注节点，并更新文档
    var currNode = lookupNodeById(markedDoc, id);
    var currParNode = currNode.parentNode;
    currParNode.removeChild(currNode);

    //删除标注对象
    if(currNode.tagName == "ElementMarked"){  //如果当前选中的节点为标注节点，则直接将与其相应的标注对象删除
        deleteMarkedIcon(currNode);
        if(currParNode.childNodes.length == 0){
            currParNode.parentNode.removeChild(currParNode);
        }
        for(var i=0;i<top.lineArr.length;i++){
            if(id === top.lineArr[i].Guid){
                top.LayerManagement.earth.DetachObject(top.lineArr[i]);
                top.lineArr.splice(i,1);
            }
        }
    }else{ //否则，获取其子节中的标注节点，并将与其相应的标注对象删除
        var markedNodes = currNode.getElementsByTagName("ElementMarked");
        for(var i=0; i<markedNodes.length; i++){
            //currNode.parentNode.removeChild(currNode);
            var markedNode = markedNodes[i];
            for(var j=0;j<top.lineArr.length;j++){
                var markedId = markedNode.getAttribute("id");
                if(markedId === top.lineArr[j].Guid){
                    top.LayerManagement.earth.DetachObject(top.lineArr[j]);
                    top.lineArr.splice(j   ,1);
                }
            }
            deleteMarkedIcon(markedNode);
        }
        if(currParNode.childNodes.length == 0){
            if(currParNode.getAttribute("name")!= "标注数据"){
                currParNode.parentNode.removeChild(currParNode);
            }
        }
    }

    top.MarkedCreator.saveMarkedFile();
    //更新标注树
    initMarkedTree(markedDoc);
};

/**
 * 功能：根据标注节点删除对应的标注对象
 * 参数：markedNode-标注节点
 * 返回：无
 */
var deleteMarkedIcon = function(markedNode){
    //删除标注对象
    var markedId = markedNode.getAttribute("id");
    top.MarkedCreator.removeMarkedIconById(markedId);
};

/**
 * 功能：标注树复选框点击事件
 * 参数：event-JS事件；treeId-树的ID；treeNode-选中的标注树节点
 * 返回：无
 */
var markedCheck = function(event,treeId,treeNode){
    setMarkedVisibility(treeNode); //设置子节点的可见性
    setParentVisibility(treeNode); //设置父节点的可见性
    setLineVisibility(treeNode); //设置父节点的可见性
    top.MarkedCreator.saveMarkedFile();
};
var setLineVisibility = function(treeNode){
    var id = treeNode.id;
    if((treeNode.children == null) || (treeNode.children.length === 0)){
        for(var i=0;i<top.lineArr.length;i++){
            if(id === top.lineArr[i].Guid){
                top.lineArr[i].Visibility = treeNode.checked;
                break;
            }
        }
    }else {
        for(var s= 0;s<treeNode.children.length;s++){
            setLineVisibility(treeNode.children[s]);
        }
    }
}
/**
 * 功能：根据标注节点设置标注对象的可见性
 * 参数：treeNode - 标注树节点;
 * 返回：无
 */
var setMarkedVisibility = function(treeNode){
    var id = treeNode.id;
    var markedNode = lookupNodeById(markedDoc, id);
    markedNode.setAttribute("checked",treeNode.checked.toString());//修改标注节点的可见属性
    if((treeNode.children == null) || (treeNode.children.length === 0)){
        if(markedNode.tagName === "ElementMarked"){
            //设置标注对象的可见属性
            var markedIcon = top.MarkedCreator.getMarkedIconById(id);
            var childMarkeds = markedIcon.ChildMarkeds;
            if(childMarkeds != null){ //判断标注是否为距离标注和扯旗标注
                for(var itemIndex in childMarkeds){
                    childMarkeds[itemIndex].Visibility = treeNode.checked;
                }
            }else{
                markedIcon.Visibility = treeNode.checked;
            }
        }
    }else{
        for(var i=0; i<treeNode.children.length; i++){
            var childTreeNode = treeNode.children[i];
            setMarkedVisibility(childTreeNode);
        }
    }
};

/**
 * 功能：根据标注节点设置标注父节点的checked属性
 * 参数：treeNode - 标注树节点;
 * 返回：无
 */
var setParentVisibility = function(treeNode){
    var parentTreeNode = treeNode.getParentNode();
    if(parentTreeNode != null){
        var id = parentTreeNode.id;
        var markedNode = lookupNodeById(markedDoc, id);
        markedNode.setAttribute("checked",parentTreeNode.checked.toString());//修改标注节点的可见属性
        setParentVisibility(parentTreeNode);
    }
};

/**
 * 功能：标注树节点折叠事件
 * 参数：event-JS事件；treeId-树的ID；treeNode-选中的标注树节点
 * 返回：无
 */
var markedCollapse = function(event,treeId,treeNode){
    var id = treeNode.id;
    var markedNode = lookupNodeById(markedDoc, id);
    markedNode.setAttribute("open","false");
    //top.MarkedCreator.saveMarkedFile();
};

/**
 * 功能：标注树节点展开事件
 * 参数：event-JS事件；treeId-树的ID；treeNode-选中的标注树节点
 * 返回：无
 */
var markedExpand = function(event,treeId,treeNode){
    var id = treeNode.id;
    var markedNode = lookupNodeById(markedDoc, id);
    markedNode.setAttribute("open","true");
};