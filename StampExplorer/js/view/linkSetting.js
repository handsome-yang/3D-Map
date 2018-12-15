/**
 * 作       者：StampGIS Team
 * 创建日期：2017年 11月 14日
 * 描       述：视频监控相关功能
 * 注意事项：
 * 遗留 Bug：0
 * 修改日期：2017年 11月 20日
 ******************************************/
//初始化
$(function() {
	$("#leftSipTree").mCustomScrollbar(); //设滚动条样式
	$("#rightArea").mCustomScrollbar();
	var cameraData = window.dialogArguments[0]; //摄像机
	var cameraOpenedIdParam = window.dialogArguments[1]; //已打开的相机id
	var earth = window.dialogArguments[2];//三维球earth对象
	var topTreeObj = window.dialogArguments[3];//父窗口中的树节点
	var cameraTreeData = window.dialogArguments[4];//父窗口中的树节点
	var selectedList = []; //已选择列表数组
	var tempSelect = null; //临时选中的div节点
	var selNode;
	var cameraArr = [];
	for(var i = 0; i < cameraData.length; i++){
		cameraArr.push({
			id: cameraData[i].id,
			pId: cameraData[i].pId,
			name: cameraData[i].name,
			font: cameraData[i].font,
			icon: cameraData[i].icon,
			open: cameraData[i].open,
			isParent: cameraData[i].isParent,
			cameraDeviceID: cameraData[i].cameraDeviceID,
			cameraLongitude: cameraData[i].cameraLongitude,
			cameraLatitude: cameraData[i].cameraLatitude,
			cameraModel: cameraData[i].cameraModel,
			cameraStatus: cameraData[i].cameraStatus,
			cameraDeviceType: cameraData[i].cameraDeviceType,
			cameraTiltAngle: cameraData[i].cameraTiltAngle,
			cameraHeadingAngle: cameraData[i].cameraHeadingAngle,
			cameraRotationAngle: cameraData[i].cameraRotationAngle
		});
	}

	/**
	 * 设置保存的参数对象
	 * @param {[type]} souNode [description]
	 * @param {[type]} desNode [description]
	 */
	function setUpdateParam(souNode, desNode){
		desNode.cameraLongitude = souNode.cameraLongitude;
		desNode.cameraLatitude = souNode.cameraLatitude;
		desNode.cameraTiltAngle = souNode.cameraTiltAngle;
		// desNode.cameraHeadingAngle = souNode.cameraHeadingAngle,
		desNode.cameraRotationAngle = souNode.cameraRotationAngle;
	}

	/**
	 * 更新父窗口中的树属性
	 * @param  {[type]} node [description]
	 * @return {[type]}      [description]
	 */
	function updateCameraTreeData(node){
		if(!node){
			return;
		}
		for(var i = 0; i < cameraTreeData.length; i++){
			if(cameraTreeData[i].id == node.id){
				setUpdateParam(node, cameraTreeData[i]);
			}
		}

		if(!topTreeObj){
			return;
		}
		var tempNodes = topTreeObj.getNodesByParam("cameraDeviceID", node.id, null);
		if(tempNodes.length > 0) {
			for(var i = 0; i < tempNodes.length; i++){
				setUpdateParam(node, tempNodes[i]);
				topTreeObj.updateNode(tempNodes[i]);
			}
		}
	}

	/**
	 * 设置树节点字体颜色
	 * @param {Object} treeId 树id
	 * @param {Object} node 节点
	 */
	function getFont(treeId, node) {
		return node.font ? node.font : {};
	}

	var setting = {
		data: {
			simpleData: {
				enable: true,
				idKey: "id",
				pIdKey: "pId"
			}
		},
		view: {
			fontCss: getFont,
			dblClickExpand: false, //双击节点时，是否自动展开父节点的标识
			expandSpeed: "", //节点展开、折叠时的动画速度, 可设置("","slow", "normal", or "fast")
			selectedMulti: false //设置是否允许同时选中多个节点
		},
		callback: {
			onClick: onClick
		}
	};

	var rootTreeObj = $.fn.zTree.init($("#rootTree"), setting, cameraData);//初始化树
	var showId = ""; //div的id
	var zNode = null; //节点
	for(var cOpen = 0; cOpen < cameraOpenedIdParam.length; cOpen++) {
		showId = cameraOpenedIdParam[cOpen].cameraDeviceID;
		zNode = cameraOpenedIdParam[cOpen];
		if(document.querySelectorAll('.selectDiv').length > 8) break;       //只允许存在8个
		selectedList.push(zNode);
		$("#list").append("<div class='selectDiv' id='" + showId + "' >" + showId + "</div>");
	}
	if(selectedList.length > 0) {
		if(selectedList.length == 1) {
			$("#linkNum").val(1);
		} else if(selectedList.length > 1 && selectedList.length <= 4) {
			$("#linkNum").val(4);
		} else {
			$("#linkNum").val(8);
		}
	}

	//事件委托click 点击中间控制按钮
	$("#middleCmd").on("click", "#middleCmd button", function(e) {
		var clickId = $(this).attr('id');
		if("selectItem" == clickId) { //点击选择
			if(!selNode){
				alert("请选择摄像机节点！");
				return;
			}
			if(!selNode.isParent) { //选中子节点
				var name = selNode.name;
				if(selectedList.indexOf(selNode.id) > -1) { //不允许重复
					alert("不能重复选择！");
					return;
				}
				//判断节点数量
				if(document.querySelectorAll('.selectDiv').length > 8) {
					alert("最多可选择8个摄像机！");
					return;
				}else if(document.querySelectorAll('.selectDiv').length >= $("#linkNum").val()){
					alert("注意：选择的摄像机个数已多于链路数，默认只显示前面的摄像机！");
				}
				selectedList.push({
					cameraLongitude: selNode.cameraLongitude,
					cameraLatitude: selNode.cameraLatitude,
					cameraDeviceID: selNode.id,
					cameraTiltAngle: selNode.cameraTiltAngle, //俯角
					cameraHeadingAngle: selNode.cameraHeadingAngle,   //仰角
					cameraRotationAngle: selNode.cameraRotationAngle,     //旋转角
					cameraDeviceType: selNode.cameraDeviceType	//类型
				});

				//将名称加载到list列表中
				$("#list").append("<div class='selectDiv' id='" + selNode.cameraDeviceID + "' >" + name + "</div>");
			}

		} else if(!tempSelect) { //没有选中div则啥都不干
			alert("请在'已选择列表'中,选择需要操作的项！");
			return;
		}else if("removeItem" == clickId) { //点击移除
			//删除选中的元素
			tempSelect.remove();
			selectedList.remove(tempSelect.attr("id"));
			tempSelect = null;

		}else if("moveUpItem" == clickId) { //上移
			//1.移动div元素 2.移动selectedList数据
			tempSelect.insertBefore(tempSelect.prev());
			var selectIndex = selectedList.indexOf(tempSelect.attr("id")); //所选元素在selectedList中的下标
			if(selectIndex - 1 >= 0) {
				selectedList[selectIndex - 1] = selectedList.splice(selectIndex, 1, selectedList[selectIndex - 1])[0]
			}
		}else if("moveDownItem" == clickId) { //下移
			//1.移动div元素 2.移动selectedList数据
			tempSelect.insertAfter(tempSelect.next());
			var selectIndex = selectedList.indexOf(tempSelect.attr("id")); //所选元素在selectedList中的下标
			if(selectIndex + 1 <= selectedList.length - 1) {
				selectedList[selectIndex + 1] = selectedList.splice(selectIndex, 1, selectedList[selectIndex + 1])[0]
			}
		}
	});

	//事件委托click  点击已选择列表
	$("#rightArea").on("click", ".selectDiv", function(e) {
		$(tempSelect).css({ //删除前一次的css样式
			"background-color": ""
		});
		$(this).css({
			"background-color": "#40aaf6"
		});
		tempSelect = $(this);
	});

	//添加方法，查找对应cameraDeviceID的元素的下标
	Array.prototype.indexOf = function(val) {
		for(var i = 0; i < this.length; i++) {
			if(this[i].cameraDeviceID == val) return i;
		}
		return -1;
	};
	//添加remove方法
	Array.prototype.remove = function(val) {
		var index = this.indexOf(val);
		if(index > -1) {
			this.splice(index, 1);
		}
	};

	//点击提交事件
	$("#btnSubmit").click(function() {
		var selectedLinkNum = $("#linkNum").val();
		window.returnValue = {
			selectedLinkNum: selectedLinkNum,
			selectedList: selectedList
		}
		window.close();
	});

	/**
	 * 设置树节点字体颜色
	 * @param {Object} treeId 树id
	 * @param {Object} node 节点
	 */
	function getFont(treeId, node) {
		return node.font ? node.font : {};
	}

	/**
	 * 输入框输入事件
	 */
	$("#keyWord").keyup(function() {
		checkStr(this, null, false); //输入检查，不允许输入特殊字符
		if($(this).val()) {
			$("#search").removeAttr("disabled");
		} else {
			rootTreeObj = $.fn.zTree.init($("#rootTree"), setting, cameraArr); //删除搜索框，还原树目录
			clearAttrTable(); //清空属性
		}
	});

	/**
	 * 树目录搜索过滤事件
	 */
	$("#search").click(function() {
		var keyWord = $("#keyWord").val();
		if(!keyWord) {
			alert("请输入搜索关键字！");
			return;
		}
		clearAttrTable(); //清空属性

		rootTreeObj = $.fn.zTree.init($("#rootTree"), setting, cameraArr); //还原树目录，然后再搜索

		//根据关键字搜索
		var nodes = rootTreeObj.getNodesByParamFuzzy("name", keyWord, null);

		//把结果重新生成树
		rootTreeObj = $.fn.zTree.init($("#rootTree"), setting, nodes[0]);
	});

	/**
	 * @param {Object} event  点击事件
	 * @param {Object} treeId  id
	 * @param {Object} treeNode  点击节点
	 */
	function onClick(event, treeId, treeNode) {
		if(!treeNode) {
			return;
		}
		selNode = rootTreeObj.getSelectedNodes()[0]; //选中的树节点
		if(!selNode) {
			return;
		}
		clearAttrTable(); //清空属性
		if(treeNode.name) { //名称
			$("#diviceName").text(treeNode.name);
		}
		if(treeNode.cameraStatus) { //状态
			if(treeNode.cameraStatus == "OK" || treeNode.cameraStatus == "ON") {
				$("#diviceStatus").text("在线");
			} else {
				$("#diviceStatus").text("离线");
			}
		}
		if(treeNode.cameraDeviceType == 0) { //球机
			$("#diviceType").text("球机");
			//球机类型才启用旋转角和俯仰角编辑状态
			$(".anglesText").removeAttr("disabled");
		}else{
			$("#diviceType").text("枪机");
			$(".anglesText").attr("disabled", "disabled");
		}
		if(treeNode.cameraLongitude) { //经度
			$("#diviceLong").val(treeNode.cameraLongitude);
		}
		if(treeNode.cameraLatitude) { //纬度
			$("#diviceLat").val(treeNode.cameraLatitude);
		}
		if(treeNode.cameraTiltAngle != undefined) { //俯仰角
			$("#downAngle").val(treeNode.cameraTiltAngle);
		}
		if(treeNode.cameraRotationAngle != undefined) { //旋转角
			$("#rotateAngle").val(treeNode.cameraRotationAngle);
		}
	}

	/**
	 * 角度文本框有修改则启用保存按钮
	 */
	$(".anglesText").keyup(function() {
		var thisObj = $(this);
		var thisId = thisObj.attr("id");
		if(thisId != ("diviceLong" || "diviceLat")) {
			//区分最大值控制
			var maxVal = {
				"downAngle": 180,
				"upAngle": 180,
				"rotateAngle": 350
			}[thisId];

			checkNum(thisObj, true, 1, maxVal);

		} else {//经纬度的输入控制和其他的不一样，单独控制
			checkNum(thisObj, false, 20);
		}

		$("#btnSave").removeAttr("disabled");
	});

	/**
	 * 保存按钮点击事件
	 */
	$("#btnSave").click(function() {
		if(!selNode){
			alert("请选择摄像机节点进行修改保存！");
			return;
		}
		//判断是否修改，如果修改过就更新
		var downAngleVal = $("#downAngle").val(),
			rotateAngleVal = $("#rotateAngle").val(),
			diviceLong = $("#diviceLong").val(),
			diviceLat = $("#diviceLat").val();
		if(selNode.cameraTiltAngle != downAngleVal) {
			selNode.cameraTiltAngle = downAngleVal;
		}
		if(selNode.cameraRotationAngle != rotateAngleVal) {
			selNode.cameraRotationAngle = rotateAngleVal;
		}
		if(selNode.cameraLongitude != diviceLong) {
			selNode.cameraLongitude = diviceLong;
		}
		if(selNode.cameraLatitude != diviceLat) {
			selNode.cameraLatitude = diviceLat;
		}

		//将修改结果保存到数据库
		var result = earth.Gb28181CameraManager.SetCameraAngleAndPosition(selNode.id, 
							parseFloat(selNode.cameraTiltAngle), 
							parseFloat(selNode.cameraHeadingAngle), 
							parseFloat(selNode.cameraRotationAngle), 
							parseFloat(selNode.cameraLongitude), 
							parseFloat(selNode.cameraLatitude), 
							selNode.cameraDeviceType);
		var jsonResult = $.xml2json(result);
		if(jsonResult == "SetCameraInfo succeed"){//保存成功之后再去更新节点
			rootTreeObj.updateNode(selNode); //更新节点

			updateCameraTreeData(selNode);//更新父窗口树节点及全局对象属性

			//遍历已选择列表，同时更新已选择列表
			selectedList.forEach(function(item, index, arr) {
				if(item.cameraDeviceID && item.cameraDeviceID == selNode.id) { //遍历得到了点选的节点对象，执行跟新属性操作
					item.cameraLongitude = diviceLong;
					item.cameraLatitude = diviceLat;
					item.cameraTiltAngle = downAngleVal;    //俯仰角
					item.cameraRotationAngle = rotateAngleVal;    //旋转角
					return false;
				}
			});
			alert("保存成功！");
		}else{
			alert("保存失败！");
		}
	});

	/**
	 * 清除界面属性内容
	 */
	function clearAttrTable() {
		$(".labelText").text("");
		$(".anglesText").val("");

		$("#btnSave").attr("disabled", "true");
	}

});