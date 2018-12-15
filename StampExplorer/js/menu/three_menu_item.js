/**
 * 作       者：StampGIS Team
 * 创建日期：2017年7月22日
 * 描        述： 三级菜单相关功能
 * 注意事项：
 * 遗留bug：0
 * 修改日期：2017年11月7日
 ******************************************/
var lastClickId = ""; //最后点击对象id
var filename = "MyPlace"; //文件名
var TreeObj = null; //树对象
var userdata = top.userdata; //用户数据
var treeRootName = "用户数据";
var params = null; //参数
//右键屏蔽方法
document.oncontextmenu = function() {
	event.returnValue = false;
}

//点击功能按钮事件
function clickMenuItem(id) {
	if(params["menuType"] == 1) {
		lastClickId = id;
	} else {
		if(lastClickId != "") {
			$("#" + lastClickId).attr("src", $("#" + lastClickId).attr("srcBefore"));
		}
		lastClickId = id;
		$("#" + id).attr("src", $("#" + id).attr("srcAfter"));
	}
	try {

		top.window[id + "Clicked"](id);
	} catch(e) {
		alert("请先定义" + id + "Clicked()方法");
	}
}

//初始化用户数据树
function initUserDataTree(type) {
	_initUserTreeByType($("#userDataTree"), type);
	top.isUserdataTree = true;
}

//加载三级功能菜单
function setMenuData() {
	params = parseLocation();
	if(params["type"]) {
		$("#userDataTree").show();
		initUserDataTree(params["type"]);
	}
	var menuCon = top.menuItem;
	if(menuCon == undefined) {
		return;
	}
	var divStr = "";

	for(var i = 0; i < menuCon.item.length; i++) {
		var menuObj = menuCon.item[i];
		var imgSrc = "../../" + menuObj.src;
		var imgSrcd = "../../" + menuObj.srcd;
		if((i + 1) % 3 == 1) {
			if(i != 0) {
				divStr += '</div>';
			}
			divStr += '<div class="menu_line"><div class="menu_item_first">';
		} else {
			divStr += '<div class="menu_item">';
		}

		divStr += '<img id="' + menuObj.id + '" srcBefore="' + imgSrc + '" srcAfter="' + imgSrcd + '" src="' + imgSrc + '" onclick=\'clickMenuItem("' + menuObj.id + '")\' /><span>' + menuObj.name + '</span></div>';

		if((i + 1) % 3 == 0 || i == menuCon.item.length - 1) {
			divStr += "</div>";
		}

	}

	$("#div_submenu").html(divStr);
	$("#delObj").attr("disabled", true);
	$("#scrollDiv").height($(this).height() - $("#paramSetInner").height() - 63);
	$("#scrollDiv").mCustomScrollbar({});
}

//根据类型初始化树：二维、三维、标绘、动态对象
var _initUserTreeByType = function(userdataTreeObj, type) {
	var userTreeData;
	// 树基本设置
	var setting = {
		data: {
			simpleData: {
				enable: true
			}
		},
		view: {
			dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
			expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
			selectedMulti: false, //设置是否允许同时选中多个节点
			showTitle: true //不显示提示信息
		},
		callback: {
			onDblClick: function(event, treeId, node) {
				var userDataDoc = userdata.getUserdata(filename);
				if(node && node.isParent) {
					TreeObj.expandNode(node);
				} else {
					if(node && node.id) {
						userdata.flyto(userDataDoc, node.id);
					}
				}
			},
			onRightClick: zTreeRightClick,
			onCheck: zTreeOnCheck2
		},
		check: {
			enable: true,
			chkStyle: "checkbox",
			chkboxType: {
				"Y": "ps",
				"N": "ps"
			}
		}
	};

	function zTreeOnCheck2(event, treeId, node) {
		if(node.isParent) {
			var childNodes = node.children;
			for(var i = 0; i < childNodes.length; i++) {
				var thisNodeId = childNodes[i].id;
				userdata.zTreeGetNode(thisNodeId, node.checked);
			}
		} else {
			userdata.zTreeGetNode(node.id, node.checked);
		}

	}
	function zTreeRightClick(event, treeId, node){
		//子节点弹出[编辑 删除]菜单
		$.fn.zTree.getZTreeObj(treeId).selectNode(node);
		if(node) {
			if(!node.isParent || (node.isParent && node.name != treeRootName)) {
				var userDataObj = userdata.getUserdataByGuid(node.id);
				if(node.checked && userDataObj && userDataObj.Rtti == 246 && userDataObj.Type == 6){
					$('#contextMenuExplosion').menu('show', {
						left: event.pageX,
						top: event.pageY
					});
				}else{
					$('#contextMenuUserdata').menu('show', {
						left: event.pageX,
						top: event.pageY
					});
				}
			} else { //根节点右键弹出新建菜单
				$('#contextMenuRoot').menu('show', {
					left: event.pageX,
					top: event.pageY
				});
			}
		}
	}
	function setRightDisable(isDisable){
		if(isDisable){
			TreeObj.setting.onRightClick = function(){};
		} else {
			TreeObj.setting.onRightClick = zTreeRightClick;
		}
	}

	var userDataDoc_Type = userdata.getUserdata(filename);
	var userTreeData_Type = getElementsListByType(userDataDoc_Type, "ElementDocument", 1, 0, type);
	TreeObj = $.fn.zTree.init(userdataTreeObj, setting, userTreeData_Type);
};

/**
 *   递归遍历XML节点生成一个数组 数组内部都是json格式的数据 用来直接传递给JQuery里的zTree对象
 *   @param  {String} xml 表示传入的xml数据
 *   @param  {String} rootName 表示开始遍历的节点名称
 *   @return {String} 返回[{...}]格式的数组数据
 */
function getElementsListByType(xml, rootName, originID, originPID, type) {
	var list = xml.documentElement.getElementsByTagName(rootName);
	var id = list[0].getAttribute("id");
	var checked = list[0].getAttribute("checked");
	var open = list[0].getAttribute("open");
	var length = list.length;
	var elementType = list[0].getAttribute("type");

	if(Number(checked) === 1) {
		checked = true;
	} else {
		checked = false;
	}
	if(type == 1) {
		treeRootName = "二维对象";
	} else if(type == 2) {
		treeRootName = "应急标绘";
	} else if(type == 3) {
		treeRootName = "几何对象";
	} else if(type == 4) {
		treeRootName = "三维模型";
	} else if(type == 5) {
		treeRootName = "动态对象";
	}

	treeData = [];
	var json = {
		id: id,
		pId: 0,
		name: treeRootName,
		checked: checked,
		open: true,
		isParent: true
	};
	treeData.push(json);
	for(var t = 0; t < length; t++) {
		var x = list[t].childNodes;
		//传入ElementDocument所有子节点
		recursion(x, id, originPID, type);
	}
	return treeData;
};

/*
 * 获取指定类型的数据
 * type:（1：二维对象；2：应急标绘；3：几何对象；4：三维模型；5：动态对象）
 * dataType：（209、220、......）
 */
function bRightType(type, dataType) {
	if(!type) {
		return true;
	}
	if(type == 1 && (dataType == 209 || dataType == 211 || dataType == 220 || dataType == 227 ||
			dataType == 228 || dataType == 229 || dataType == 243 || dataType == 245)) {
		//二维对象
		return true;
	} else if(type == 2 && ((dataType >= 250 && dataType <= 260))) {
		//应急标绘
		return true;
	} else if(type == 3 && (dataType == 216 || dataType == 202 || dataType == 203 ||
			dataType == 204 || dataType == 205 || dataType == 206 || dataType == 280 || dataType == 230 ||
			dataType == 'cordon' || dataType == 210 || dataType == 207)) {
		//几何对象
		return true;
	} else if(type == 4 && (dataType == 217 || dataType == 223 || dataType == 207)) {
		//三维模型
		return true;
	} else if(type == 5 && (dataType == 'fire' || dataType == 'mist' || dataType == 'Explosion' || dataType == 'fountain' ||
			dataType == 'nozzle' || dataType == 'SprayNozzle' || dataType == 'WaterGunSmall' || dataType == 'dWater')) {
		//动态对象
		return true;
	} else {
		return false;
	}
}

/**
 * 递归算法
 * @param  {[type]} x         [description]
 * @param  {[type]} originID  [description]
 * @param  {[type]} originPID [description]
 * @return {[type]}           [description]
 */
function recursion(x, originID, originPID, type) {
	for(var i = 0, max = x.length; i < max; i++) {
		var element = x[i];
		var name = element.nodeName;

		var nName = element.getAttribute("name");
		var nID = element.getAttribute("id");
		var checked = element.getAttribute("checked");
		var open = element.getAttribute("open");
		var dataType = element.getAttribute("type");
		var iconPath = userdata.getUserdataIcon(dataType, true);
		if(Number(checked) === 1) {
			checked = true;
		} else {
			checked = false;
		}

		if(name == "Element" && bRightType(type, dataType)) {
			var json = {
				id: nID,
				pId: originID,
				name: nName,
				checked: checked,
				open: open,
				icon: iconPath
			};
			treeData.push(json);
		}

		if(name == "ElementFolder" && element.childNodes) {
			var json = {
				id: nID,
				pId: originID,
				name: nName,
				checked: checked,
				open: open,
				isParent: true
			};
			treeData.push(json);

			recursion(element.childNodes, nID, nID, type);
		}
	}
}
//递归完毕

//开始爆炸
$("#divBeginExplosion").live("click", function(){
	var tempTreeObj = $.fn.zTree.getZTreeObj("userDataTree");
	var nodes = tempTreeObj.getSelectedNodes();
	if(nodes && nodes.length > 0) {
		var node = nodes[0];
		var userDataObj = userdata.getUserdataByGuid(node.id);
		if(userDataObj){
			var explosionFlag = top.LayerManagement.earth.Factory.CreateGuid();//唯一标识
			userdata.getDictionaryExplosion()[userDataObj.guid] = explosionFlag;
			userdata.beginExplosion(userDataObj, 10, explosionFlag);
		}
	}
});

//编辑子节点
$("#divEditUserdata, #divEditExplosion").live("click", function() {
	var tempTreeObj = $.fn.zTree.getZTreeObj("userDataTree");
	var nodes = tempTreeObj.getSelectedNodes();
	if(nodes && nodes.length > 0) {
		var node = nodes[0];
		var name = userdata.editUserdataClicked(node.id);
		if(name) {
			node.name = name;
			tempTreeObj.updateNode(node);
		}
	}
});

//删除子节点
$("#divDeleteUserdata, #divDeleteExplosion").live("click", function() {
	var tempTreeObj = $.fn.zTree.getZTreeObj("userDataTree");
	var nodes = tempTreeObj.getSelectedNodes();
	if(nodes && nodes.length > 0) {
		if(confirm("是否确定要删除?")) {
			var node = nodes[0];
			if(node.isParent) {
				userdata.deleteTreeFolder(node.id);
				var parentNode = node.getParentNode();
				tempTreeObj.removeNode(node);
				if(parentNode && !parentNode.isParent) {
					parentNode.isParent = true;
					tempTreeObj.updateNode(parentNode);
				}
			} else {
				var userDataObj = userdata.getUserdataByGuid(node.id);
				if(userDataObj && userDataObj.Rtti == 246 && userDataObj.Type == 6 && userdata.getDictionaryExplosion()[userDataObj.guid]){
					delete userdata.getDictionaryExplosion()[userDataObj.guid];
				}
				var parentNode = node.getParentNode();
				tempTreeObj.removeNode(node);
				userdata.deleteUserdataNode(node.id);
				if(parentNode && !parentNode.isParent) {
					parentNode.isParent = true;
					tempTreeObj.updateNode(parentNode);
				}
			}

		}
	}
});

//删除根节点
$("#deleteRootFolder").live("click", function() {
	var tempTreeObj = $.fn.zTree.getZTreeObj("userDataTree");
	var nodes = tempTreeObj.getSelectedNodes();
	if(nodes && nodes.length > 0) {
		var node = nodes[0];
		if(!node || !node.children || node.children.length <= 0) {
			alert("子节点为空！");
			return;
		}
		if(confirm("是否删除所有节点?")) {
			if(node && node.children && node.children.length > 0) {
				deleteRootFolder(tempTreeObj, node);
				//树上移除相关节点(如果有子节点也一并移除)
				tempTreeObj.removeChildNodes(node);
				node.isParent = true;
				tempTreeObj.updateNode(node);
			}
		}
	}
});

//删除根目录-递归方法
function deleteRootFolder(tempTreeObj, rootNode) {
	if(rootNode.children && rootNode.children.length) {
		for(var i = 0; i < rootNode.children.length; i++) {
			deleteRootFolder(tempTreeObj, rootNode.children[i]);
		}
	} else {
		userdata.deleteTreeNode(rootNode.id);
	}
}

//返回Ztree
function getUserdataTree() {
	var zTree = $.fn.zTree.getZTreeObj("userDataTree");
	return zTree;
}

$(function() {

	setMenuData();
	window.onunload = function() {
		if(top.LayerManagement.earth.ShapeCreator) {
			top.LayerManagement.earth.ShapeCreator.Clear();
		}
		top.isUserdataTree = false;
	}
});